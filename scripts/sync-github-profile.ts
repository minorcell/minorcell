import { execFileSync } from 'node:child_process'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseGitHubSnapshot } from '../src/lib/github-profile.ts'
import { renderContributionSnake } from './snake-and-commits.ts'
import { collectGitHubActivity } from './github-activity.ts'
import type {
  GitHubSnapshot,
  GitHubRepository,
} from '../src/lib/github-profile.ts'

type Fetch = typeof globalThis.fetch
type Options = { user: string; token: string; fetch?: Fetch; now?: Date }
type ApiRepository = {
  id: number
  name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  fork: boolean
  archived: boolean
  private: boolean
  pushed_at: string
}

const query = `query($login:String!,$from:DateTime!,$to:DateTime!){viewer{login} user(login:$login){contributionsCollection(from:$from,to:$to){startedAt endedAt contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`

export async function collectGitHubSnapshot(
  options: Options,
): Promise<GitHubSnapshot> {
  const {
    user,
    token,
    fetch: request = globalThis.fetch,
    now = new Date(),
  } = options
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(user))
    throw new Error('Invalid GitHub username')
  if (!token)
    throw new Error('A GitHub token is required for contribution data')
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2026-03-10',
    'User-Agent': 'minorcell-profile',
  }
  async function json<T>(path: string, body?: unknown): Promise<T> {
    const response = await request(`https://api.github.com${path}`, {
      headers: {
        ...headers,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok)
      throw new Error(`GitHub request failed: HTTP ${response.status}`)
    return response.json() as Promise<T>
  }
  async function repositories() {
    const result: GitHubRepository[] = []
    for (let page = 1; ; page++) {
      const batch = await json<ApiRepository[]>(
        `/users/${user}/repos?type=owner&per_page=100&page=${page}`,
      )
      if (!Array.isArray(batch)) throw new Error('Invalid repository response')
      result.push(
        ...batch
          .filter((repo) => repo.private === false)
          .map((repo) => ({
            id: repo.id,
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            fork: repo.fork,
            archived: repo.archived,
            pushedAt: repo.pushed_at,
          })),
      )
      if (batch.length < 100) break
    }
    return result
  }
  async function organizations() {
    const result: GitHubSnapshot['organizations'] = []
    for (let page = 1; ; page++) {
      // This endpoint only exposes public memberships, including authenticated requests.
      const batch = await json<{ login: string; avatar_url: string }[]>(
        `/users/${user}/orgs?per_page=100&page=${page}`,
      )
      if (!Array.isArray(batch))
        throw new Error('Invalid organization response')
      result.push(
        ...batch.map((org) => ({
          login: org.login,
          avatarUrl: org.avatar_url,
          url: `https://github.com/${org.login}`,
        })),
      )
      if (batch.length < 100) return result
    }
  }
  const [profile, repos, orgs, calendar] = await Promise.all([
    json<{
      login: string
      bio: string | null
      company: string | null
      avatar_url: string
      html_url: string
      followers: number
    }>(`/users/${user}`),
    repositories(),
    organizations(),
    json<{
      errors?: unknown[]
      data?: {
        viewer: { login: string }
        user: {
          contributionsCollection: {
            startedAt: string
            endedAt: string
            contributionCalendar: {
              totalContributions: number
              weeks: {
                contributionDays: { date: string; contributionCount: number }[]
              }[]
            }
          }
        } | null
      }
    }>('/graphql', {
      query,
      variables: {
        login: user,
        from: new Date(now.getTime() - 365 * 86_400_000).toISOString(),
        to: now.toISOString(),
      },
    }),
  ])
  if (calendar.errors?.length || !calendar.data?.user)
    throw new Error('GitHub contribution query failed')
  if (calendar.data.viewer?.login?.toLowerCase() !== user.toLowerCase())
    throw new Error(
      "Use the profile owner's token to include private contributions",
    )
  const collection = calendar.data.user.contributionsCollection
  const activity = await collectGitHubActivity({
    user,
    now,
    request: (query, variables) => json('/graphql', { query, variables }),
  })
  return parseGitHubSnapshot({
    schemaVersion: 2,
    fetchedAt: now.toISOString(),
    profile: {
      login: profile.login,
      bio: profile.bio?.trim() ?? null,
      company: profile.company,
      avatarUrl: profile.avatar_url,
      url: profile.html_url,
      followers: profile.followers,
    },
    organizations: orgs,
    repositories: repos,
    activity,
    contributions: {
      from: collection.startedAt,
      to: collection.endedAt,
      total: collection.contributionCalendar.totalContributions,
      days: collection.contributionCalendar.weeks
        .flatMap((week) => week.contributionDays)
        .map((day) => ({ date: day.date, count: day.contributionCount })),
    },
  })
}

export async function refreshGitHubSnapshot(path: string, options: Options) {
  const snapshot = await collectGitHubSnapshot(options)
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.${process.pid}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`)
  await rename(temporaryPath, path)
  return { updated: true, snapshot }
}

function getToken() {
  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN)
    return process.env.GH_TOKEN || process.env.GITHUB_TOKEN || ''
  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const site = JSON.parse(
    await readFile(resolve('content/site/site.json'), 'utf8'),
  )
  const account = new URL(site.contact.github).pathname
    .split('/')
    .filter(Boolean)[0]
  const outputIndex = process.argv.indexOf('--output')
  if (outputIndex !== -1 && !process.argv[outputIndex + 1])
    throw new Error('--output requires a path')
  const result = await refreshGitHubSnapshot(
    resolve(
      outputIndex === -1
        ? 'content/site/github.local.json'
        : process.argv[outputIndex + 1],
    ),
    { user: account, token: getToken() },
  )
  if (outputIndex === -1) {
    for (const [name, theme] of [
      ['light', 'green'],
      ['dark', 'matrix'],
    ] as const) {
      await writeFile(
        resolve(`content/site/snake-${name}.local.svg`),
        renderContributionSnake(result.snapshot.contributions.days, theme),
      )
    }
  }
  console.log(`GitHub profile generated: ${result.snapshot.profile.login}`)
}

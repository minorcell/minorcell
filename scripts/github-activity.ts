import { parseGitHubActivity } from '../src/lib/github-profile.ts'
import type {
  GitHubActivity,
  GitHubActivityKind,
  GitHubActivitySnapshot,
} from '../src/lib/github-profile.ts'

type Repository = { visibility: string; nameWithOwner: string; url: string }
type Node = {
  occurredAt: string
  isRestricted: boolean
  repository?: Repository | null
  commitCount?: number
  issue?: { title: string; url: string; repository: Repository }
  pullRequest?: { title: string; url: string; repository: Repository }
  pullRequestReview?: { url: string }
}
type Connection = {
  nodes: (Node | null)[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}
type Result = {
  errors?: unknown[]
  data?: {
    user: {
      contributionsCollection: Record<
        string,
        Connection | { contributions: Connection }[]
      >
    } | null
  }
}
type Request = (
  query: string,
  variables: Record<string, string | null>,
) => Promise<Result>
const repository = 'repository{visibility nameWithOwner url}'
const common = 'occurredAt isRestricted'

export async function collectGitHubActivity({
  user,
  now,
  request,
}: {
  user: string
  now: Date
  request: Request
}): Promise<GitHubActivitySnapshot> {
  const beginning = new Date(now)
  const dayOfMonth = beginning.getUTCDate()
  beginning.setUTCDate(1)
  beginning.setUTCMonth(beginning.getUTCMonth() - 6)
  const lastDay = new Date(
    Date.UTC(beginning.getUTCFullYear(), beginning.getUTCMonth() + 1, 0),
  ).getUTCDate()
  beginning.setUTCDate(Math.min(dayOfMonth, lastDay))
  beginning.setUTCHours(0, 0, 0, 0)
  const from = beginning.toISOString()
  const to = now.toISOString()
  const items = new Map<string, GitHubActivity>()
  let limited = false
  async function collection(
    fields: string,
    cursor: string | null = null,
    range = { from, to },
  ) {
    const cursorDeclaration = fields.includes('$cursor')
      ? ',$cursor:String'
      : ''
    const query = `query($login:String!,$from:DateTime!,$to:DateTime!${cursorDeclaration}){user(login:$login){contributionsCollection(from:$from,to:$to){${fields}}}}`
    const result = await request(query, { login: user, ...range, cursor })
    if (result.errors?.length || !result.data?.user)
      throw new Error('GitHub public activity query failed')
    return result.data.user.contributionsCollection
  }
  function include(node: Node | null, kind: GitHubActivityKind) {
    // Discard restricted, private and internal activity before copying any metadata.
    if (!node || node.isRestricted) return
    const repo =
      node.repository ?? node.issue?.repository ?? node.pullRequest?.repository
    if (repo?.visibility !== 'PUBLIC') return
    if (kind === 'commit' && !node.commitCount) return
    // GitHub can return boundary-day contributions outside the requested times,
    // including a daily commit bucket timestamp later than the current time.
    const occurredAt = Date.parse(node.occurredAt)
    if (occurredAt < beginning.getTime() || occurredAt > now.getTime()) return
    const day = node.occurredAt.slice(0, 10)
    const nextDay = new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000)
      .toISOString()
      .slice(0, 10)
    const url =
      kind === 'commit'
        ? `${repo.url}/commits?author=${user}&since=${day}&until=${nextDay}`
        : kind === 'issue'
          ? node.issue!.url
          : kind === 'review'
            ? node.pullRequestReview!.url
            : node.pullRequest!.url
    const id = `${kind}:${url}:${node.occurredAt}`
    items.set(id, {
      id,
      kind,
      occurredAt: node.occurredAt,
      repository: { name: repo.nameWithOwner, url: repo.url },
      url,
      title:
        kind === 'commit'
          ? `${node.commitCount} 次提交`
          : kind === 'issue'
            ? (node.issue?.title ?? '')
            : (node.pullRequest?.title ?? ''),
      count: kind === 'commit' ? (node.commitCount ?? 0) : 1,
    })
  }
  await Promise.all([
    (async () => {
      // A repository/day connection is capped at 100 nodes; split the six-month range.
      for (
        let start = beginning.getTime();
        start < now.getTime();
        start += 90 * 86_400_000
      ) {
        const result = await collection(
          `commitContributionsByRepository(maxRepositories:100){contributions(first:100){nodes{${common} ${repository} commitCount} pageInfo{hasNextPage}}}`,
          null,
          {
            from: new Date(start).toISOString(),
            to: new Date(
              Math.min(now.getTime(), start + 90 * 86_400_000),
            ).toISOString(),
          },
        )
        const groups = result.commitContributionsByRepository as {
          contributions: Connection
        }[]
        limited ||= groups.length >= 100
        for (const group of groups) {
          limited ||= group.contributions.pageInfo.hasNextPage
          for (const node of group.contributions.nodes) include(node, 'commit')
        }
      }
    })(),
    ...(
      [
        ['issue', 'issueContributions', `issue{title url ${repository}}`],
        [
          'pr',
          'pullRequestContributions',
          `pullRequest{title url ${repository}}`,
        ],
        [
          'review',
          'pullRequestReviewContributions',
          `pullRequest{title url ${repository}} pullRequestReview{url}`,
        ],
      ] as const
    ).map(async ([kind, field, detail]) => {
      let cursor: string | null = null
      do {
        const result = await collection(
          `${field}(first:100,after:$cursor){nodes{${common} ${detail}} pageInfo{hasNextPage endCursor}}`,
          cursor,
        )
        const connection = result[field] as Connection
        for (const node of connection.nodes) include(node, kind)
        if (!connection.pageInfo.hasNextPage) break
        const next = connection.pageInfo.endCursor
        if (!next || next === cursor)
          throw new Error('Invalid GitHub activity pagination')
        cursor = next
      } while (cursor)
    }),
  ])
  return parseGitHubActivity({ from, to, limited, items: [...items.values()] })
}

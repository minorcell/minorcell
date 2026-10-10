export interface GitHubUpstream {
  fullName: string
  description: string | null
  url: string
  language: string | null
  stars: number
  forks: number
  archived: boolean
  pushedAt: string
}

export interface GitHubRepository {
  id: number
  name: string
  description: string | null
  url: string
  language: string | null
  stars: number
  forks: number
  fork: boolean
  archived: boolean
  pushedAt: string
  upstream?: GitHubUpstream | null
}

export type GitHubActivityKind = 'commit' | 'pr' | 'issue' | 'review'

export interface GitHubActivity {
  id: string
  kind: GitHubActivityKind
  occurredAt: string
  repository: { name: string; url: string }
  title: string
  url: string
  count: number
}

export interface GitHubActivitySnapshot {
  from: string
  to: string
  limited: boolean
  items: GitHubActivity[]
}

export interface GitHubSnapshot {
  schemaVersion: 2
  fetchedAt: string
  profile: {
    login: string
    bio: string | null
    company: string | null
    avatarUrl: string
    url: string
    followers: number
  }
  organizations: { login: string; avatarUrl: string; url: string }[]
  repositories: GitHubRepository[]
  activity?: GitHubActivitySnapshot
  contributions: {
    from: string
    to: string
    total: number
    days: { date: string; count: number }[]
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const isDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))
const isNullableText = (value: unknown) =>
  value === null || typeof value === 'string'

export function parseGitHubActivity(value: unknown): GitHubActivitySnapshot {
  if (
    !isRecord(value) ||
    !isDate(value.from) ||
    !isDate(value.to) ||
    Date.parse(value.from) > Date.parse(value.to) ||
    typeof value.limited !== 'boolean' ||
    !Array.isArray(value.items)
  )
    throw new Error('Invalid GitHub activity snapshot')
  const ids = new Set<string>()
  const items: GitHubActivity[] = []
  for (const item of value.items) {
    if (
      !isRecord(item) ||
      item.isRestricted === true ||
      typeof item.id !== 'string' ||
      ids.has(item.id) ||
      !['commit', 'pr', 'issue', 'review'].includes(String(item.kind)) ||
      !isDate(item.occurredAt) ||
      Date.parse(item.occurredAt) < Date.parse(value.from) ||
      Date.parse(item.occurredAt) > Date.parse(value.to) ||
      typeof item.title !== 'string' ||
      !isCount(item.count) ||
      item.count < 1 ||
      !isRecord(item.repository) ||
      item.repository.private === true ||
      item.repository.isPrivate === true ||
      (item.repository.visibility !== undefined &&
        item.repository.visibility !== 'PUBLIC') ||
      typeof item.repository.name !== 'string' ||
      !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?\/[a-z\d_.-]+$/i.test(
        item.repository.name,
      ) ||
      item.repository.url !== `https://github.com/${item.repository.name}` ||
      typeof item.url !== 'string' ||
      !item.url.startsWith(`${item.repository.url}/`)
    )
      throw new Error('Invalid public GitHub activity')
    ids.add(item.id)
    items.push({
      id: item.id,
      kind: item.kind as GitHubActivityKind,
      occurredAt: item.occurredAt,
      repository: {
        name: item.repository.name,
        url: item.repository.url as string,
      },
      title: item.title,
      url: item.url,
      count: item.count,
    })
  }
  return {
    from: value.from,
    to: value.to,
    limited: value.limited,
    items: items.sort(
      (a, b) =>
        b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id),
    ),
  }
}

export function parseGitHubSnapshot(value: unknown): GitHubSnapshot {
  if (!isRecord(value) || value.schemaVersion !== 2 || !isDate(value.fetchedAt))
    throw new Error('Invalid GitHub snapshot metadata')
  const profile = value.profile
  if (
    !isRecord(profile) ||
    typeof profile.login !== 'string' ||
    !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(profile.login) ||
    !isNullableText(profile.bio) ||
    !isNullableText(profile.company) ||
    typeof profile.avatarUrl !== 'string' ||
    !/^https:\/\/avatars\.githubusercontent\.com\//.test(profile.avatarUrl) ||
    profile.url !== `https://github.com/${profile.login}` ||
    !isCount(profile.followers)
  )
    throw new Error('Invalid GitHub profile')
  if (!Array.isArray(value.organizations))
    throw new Error('Invalid GitHub organizations')
  for (const org of value.organizations) {
    if (
      !isRecord(org) ||
      typeof org.login !== 'string' ||
      !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(org.login) ||
      org.url !== `https://github.com/${org.login}` ||
      typeof org.avatarUrl !== 'string' ||
      !/^https:\/\/avatars\.githubusercontent\.com\//.test(org.avatarUrl)
    )
      throw new Error('Invalid GitHub organization')
  }
  if (!Array.isArray(value.repositories))
    throw new Error('Invalid GitHub repositories')
  const ids = new Set<number>()
  for (const repo of value.repositories) {
    if (
      !isRecord(repo) ||
      repo.private === true ||
      !isCount(repo.id) ||
      ids.has(repo.id) ||
      typeof repo.name !== 'string' ||
      !repo.name ||
      repo.url !== `https://github.com/${profile.login}/${repo.name}` ||
      !isNullableText(repo.description) ||
      !isNullableText(repo.language) ||
      !isCount(repo.stars) ||
      !isCount(repo.forks) ||
      typeof repo.fork !== 'boolean' ||
      typeof repo.archived !== 'boolean' ||
      !isDate(repo.pushedAt)
    )
      throw new Error('Invalid GitHub repository')
    ids.add(repo.id)
    const upstream = repo.upstream
    if (
      upstream != null &&
      (!repo.fork ||
        !isRecord(upstream) ||
        upstream.private === true ||
        typeof upstream.fullName !== 'string' ||
        !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?\/[a-z\d_.-]+$/i.test(
          upstream.fullName,
        ) ||
        upstream.url !== `https://github.com/${upstream.fullName}` ||
        !isNullableText(upstream.description) ||
        !isNullableText(upstream.language) ||
        !isCount(upstream.stars) ||
        !isCount(upstream.forks) ||
        typeof upstream.archived !== 'boolean' ||
        !isDate(upstream.pushedAt))
    )
      throw new Error('Invalid public upstream repository')
  }
  const contributions = value.contributions
  if (
    !isRecord(contributions) ||
    !isDate(contributions.from) ||
    !isDate(contributions.to) ||
    Date.parse(contributions.from) > Date.parse(contributions.to) ||
    !isCount(contributions.total) ||
    !Array.isArray(contributions.days) ||
    contributions.days.length === 0
  )
    throw new Error('Invalid GitHub contributions')
  const dates = new Set<string>()
  for (const day of contributions.days) {
    if (
      !isRecord(day) ||
      typeof day.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
      !isDate(day.date) ||
      dates.has(day.date) ||
      !isCount(day.count)
    )
      throw new Error('Invalid GitHub contribution day')
    dates.add(day.date)
  }
  // Only allow explicitly public fields into the published snapshot.
  return {
    schemaVersion: 2,
    fetchedAt: value.fetchedAt,
    profile: {
      login: profile.login,
      bio: profile.bio as string | null,
      company: profile.company as string | null,
      avatarUrl: profile.avatarUrl,
      url: profile.url as string,
      followers: profile.followers,
    },
    organizations: value.organizations.map((org) => ({
      login: org.login,
      avatarUrl: org.avatarUrl,
      url: org.url,
    })),
    repositories: value.repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
      language: repo.language,
      stars: repo.stars,
      forks: repo.forks,
      fork: repo.fork,
      archived: repo.archived,
      pushedAt: repo.pushedAt,
      upstream:
        repo.upstream == null
          ? null
          : {
              fullName: repo.upstream.fullName,
              description: repo.upstream.description,
              url: repo.upstream.url,
              language: repo.upstream.language,
              stars: repo.upstream.stars,
              forks: repo.upstream.forks,
              archived: repo.upstream.archived,
              pushedAt: repo.upstream.pushedAt,
            },
    })),
    ...(value.activity == null
      ? {}
      : { activity: parseGitHubActivity(value.activity) }),
    contributions: {
      from: contributions.from,
      to: contributions.to,
      total: contributions.total,
      days: contributions.days.map((day) => ({
        date: day.date,
        count: day.count,
      })),
    },
  }
}

export function summarizeGitHub(snapshot: GitHubSnapshot) {
  const originals = snapshot.repositories.filter((repo) => !repo.fork)
  const languages = new Map<string, number>()
  let unknownLanguages = 0
  for (const repo of originals) {
    if (repo.language)
      languages.set(repo.language, (languages.get(repo.language) ?? 0) + 1)
    else unknownLanguages++
  }
  const monthly = new Map<string, number>()
  for (const day of snapshot.contributions.days) {
    const month = day.date.slice(0, 7)
    monthly.set(month, (monthly.get(month) ?? 0) + day.count)
  }
  const byRecent = (a: GitHubRepository, b: GitHubRepository) =>
    Date.parse(b.pushedAt) - Date.parse(a.pushedAt) ||
    a.name.localeCompare(b.name)
  return {
    publicRepositories: snapshot.repositories.length,
    originalRepositories: originals.length,
    stars: originals.reduce((sum, repo) => sum + repo.stars, 0),
    featured: [...originals].sort(
      (a, b) => b.stars - a.stars || byRecent(a, b),
    ),
    forks: snapshot.repositories
      .filter((repo) => repo.fork)
      .sort((a, b) => a.name.localeCompare(b.name)),
    languages: [...languages].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    ),
    unknownLanguages,
    monthly: [...monthly].sort((a, b) => a[0].localeCompare(b[0])),
  }
}

export const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#a38b21',
  Rust: '#b66b51',
  Go: '#008aa5',
  Vue: '#44895e',
  Python: '#527fa8',
  HTML: '#c75c40',
  CSS: '#936bc5',
  Shell: '#76944d',
}

export function formatGitHubDate(value: string, monthOnly = false) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    ...(monthOnly ? {} : { day: '2-digit' }),
  })
    .formatToParts(new Date(value))
    .filter((part) => ['year', 'month', 'day'].includes(part.type))
    .map((part) => part.value)
    .join('.')
}

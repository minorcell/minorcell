/** Profile contribution year, aligned with the number on a GitHub profile. */

const LEVELS = [
  'NONE',
  'FIRST_QUARTILE',
  'SECOND_QUARTILE',
  'THIRD_QUARTILE',
  'FOURTH_QUARTILE',
] as const

export type ContributionLevel = (typeof LEVELS)[number]
export type ContributionDay = {
  date: string
  count: number
  level: ContributionLevel
}
type Fetch = typeof globalThis.fetch
type Options = { user: string; token: string; fetch?: Fetch }
type Calendar = {
  totalContributions?: number
  weeks?: {
    contributionDays?: {
      date?: string
      contributionCount?: number
      contributionLevel?: string
    }[]
  }[]
}
type Collection = {
  startedAt: string
  endedAt: string
  contributionCalendar?: Calendar
}
type Payload = {
  errors?: { message?: string }[]
  data?: {
    viewer?: { login?: string }
    user?: { contributionsCollection?: Collection } | null
  }
}

const calendarFields = `contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}`

function sum(days: ContributionDay[]): number {
  return days.reduce((total, day) => total + day.count, 0)
}

function isLevel(value: string): value is ContributionLevel {
  return (LEVELS as readonly string[]).includes(value)
}

function readDays(calendar: Calendar | undefined): ContributionDay[] {
  const days: ContributionDay[] = []
  for (const week of calendar?.weeks ?? []) {
    for (const day of week.contributionDays ?? []) {
      if (
        !day.date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
        !Number.isInteger(day.contributionCount) ||
        day.contributionCount! < 0 ||
        !day.contributionLevel ||
        !isLevel(day.contributionLevel)
      )
        throw new Error('Invalid GitHub contribution calendar')
      days.push({
        date: day.date,
        count: day.contributionCount!,
        level: day.contributionLevel,
      })
    }
  }
  days.sort((a, b) => a.date.localeCompare(b.date))
  return days
}

/**
 * GitHub's profile total covers the week-aligned last year, but a calendar
 * longer than 365 days comes back without its oldest days. Those days still
 * count in `totalContributions`. Put them back, and if the window starts
 * partway through the oldest day, keep only the in-window part of that day.
 */
export function alignContributionDays(
  total: number,
  days: ContributionDay[],
  earlier: ContributionDay[] = [],
): ContributionDay[] {
  const ordered = [...days].sort((a, b) => a.date.localeCompare(b.date))
  if (!ordered.length) return []
  const missing = total - sum(ordered)
  if (missing <= 0) return ordered
  const first = ordered[0].date
  const prefix = earlier
    .filter((day) => day.date < first)
    .sort((a, b) => a.date.localeCompare(b.date))
  let start = prefix.length
  let covered = 0
  for (let index = prefix.length - 1; index >= 0; index--) {
    covered += prefix[index].count
    start = index
    if (covered >= missing) break
  }
  let overflow = Math.max(0, covered - missing)
  const suffix: ContributionDay[] = []
  for (const day of prefix.slice(start)) {
    const count = Math.max(0, day.count - overflow)
    overflow = Math.max(0, overflow - day.count)
    suffix.push({ ...day, count, level: count === 0 ? 'NONE' : day.level })
  }
  return [...suffix, ...ordered]
}

export async function fetchProfileContributions(options: Options): Promise<{
  viewer: string
  from: string
  to: string
  total: number
  days: ContributionDay[]
}> {
  const { user, token, fetch: request = globalThis.fetch } = options
  async function query(text: string, variables: Record<string, string>) {
    const response = await request('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'minorcell-profile',
        'X-GitHub-Api-Version': '2026-03-10',
      },
      body: JSON.stringify({ query: text, variables }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok)
      throw new Error(`GitHub request failed: HTTP ${response.status}`)
    const result = (await response.json()) as Payload
    if (result.errors?.length)
      throw new Error(
        `GitHub contribution query failed: ${result.errors.map((error) => error.message ?? 'unknown error').join('; ')}`,
      )
    return result
  }
  const year = await query(
    `query($login:String!){viewer{login} user(login:$login){contributionsCollection{startedAt endedAt ${calendarFields}}}}`,
    { login: user },
  )
  const collection = year.data?.user?.contributionsCollection
  const total = collection?.contributionCalendar?.totalContributions
  if (!collection || !Number.isInteger(total) || total! < 0)
    throw new Error('GitHub contribution query failed')
  const visible = readDays(collection.contributionCalendar)
  let earlier: ContributionDay[] = []
  if (visible.length && sum(visible) !== total) {
    const prefixTo = new Date(Date.parse(`${visible[0].date}T00:00:00Z`) - 1000)
      .toISOString()
      .replace('.000Z', 'Z')
    if (Date.parse(collection.startedAt) <= Date.parse(prefixTo)) {
      const prefix = await query(
        `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){startedAt endedAt ${calendarFields}}}}`,
        { login: user, from: collection.startedAt, to: prefixTo },
      )
      earlier = readDays(
        prefix.data?.user?.contributionsCollection?.contributionCalendar,
      )
    }
  }
  const days = alignContributionDays(total!, visible, earlier)
  if (sum(days) !== total)
    throw new Error('GitHub contribution total does not match daily counts')
  return {
    viewer: year.data?.viewer?.login ?? '',
    from: collection.startedAt,
    to: collection.endedAt,
    total: total!,
    days,
  }
}

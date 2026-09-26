#!/usr/bin/env node
/** Turn a GitHub contribution graph into an animated Snake SVG. */
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const CELL = 11
const GAP = 3
const PITCH = CELL + GAP
const MX = 16
const MTOP = 26
const MBOT = 30
const STEPS_PER_SEC = 10
const PAUSE_STEPS = 26
const BASE_LEN = 3

const LEVEL = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
} as const
const MONTHS = [
  '',
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]

type Cell = [col: number, row: number]
type Week = {
  contributionDays: {
    date: string
    contributionCount: number
    contributionLevel: keyof typeof LEVEL
  }[]
}
type Theme = {
  levels: string[]
  snake: string
  head: string
  ramp: [number, string][]
  text: string
  frameBg: string
  frameBorder: string
}
type Options = {
  user: string
  output: string
  theme: keyof typeof THEMES
  frame: boolean
  counter: boolean
}
type Solution = {
  route: Cell[]
  eats: { step: number; cell: Cell }[]
  growth: number[]
  maxLength: number
  left: number
}

const THEMES = {
  green: {
    levels: ['#e9ecef', '#a8ddb5', '#63be7b', '#2f9752', '#17643b'],
    snake: '#c2410c',
    head: '#f97316',
    ramp: [
      [1, '#ea580c'],
      [4, '#c2410c'],
      [10, '#9a3412'],
      [21, '#7c2d12'],
    ],
    text: '#656d76',
    frameBg: '#ffffff',
    frameBorder: '#d0d7de',
  },
  blue: {
    levels: ['#161b22', '#0f2f56', '#1f5fa6', '#3f8bd6', '#79c0ff'],
    snake: '#58a6ff',
    head: '#c9e4ff',
    ramp: [
      [1, '#c9e4ff'],
      [4, '#58a6ff'],
      [10, '#3f83d6'],
      [21, '#2e62a8'],
    ],
    text: '#7d8590',
    frameBg: '#0d1117',
    frameBorder: '#22406a',
  },
  amber: {
    levels: ['#1a1710', '#3d2f0e', '#7a5c14', '#c99a1e', '#ffd257'],
    snake: '#ffd257',
    head: '#fff2c2',
    ramp: [
      [1, '#fff2c2'],
      [4, '#ffd257'],
      [10, '#c99a1e'],
      [21, '#7a5c14'],
    ],
    text: '#8a7752',
    frameBg: '#0d0b07',
    frameBorder: '#4d3d16',
  },
  matrix: {
    levels: ['#30363d', '#1b5234', '#1c7542', '#299d56', '#52d47d'],
    snake: '#ffb45b',
    head: '#fff0d6',
    ramp: [
      [1, '#ffd699'],
      [4, '#ffb45b'],
      [10, '#f08c2e'],
      [21, '#c45a00'],
    ],
    text: '#8b949e',
    frameBg: '#0d1117',
    frameBorder: '#30363d',
  },
} satisfies Record<string, Theme>

const GRAPHQL_QUERY = `query($login:String!,$from:DateTime!){user(login:$login){contributionsCollection(from:$from){contributionCalendar{weeks{contributionDays{date contributionCount contributionLevel}}}}}}`
const key = (cell: Cell) => `${cell[0]},${cell[1]}`

function getToken(): string {
  for (const name of ['GH_TOKEN', 'GITHUB_TOKEN'])
    if (process.env[name]) return process.env[name]!
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

async function fetchWeeks(user: string, token: string): Promise<Week[]> {
  const from = new Date(Date.now() - 365 * 86_400_000).toISOString()
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': user,
    },
    body: JSON.stringify({
      query: GRAPHQL_QUERY,
      variables: { login: user, from },
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok)
    throw new Error(
      `GitHub API request failed (${response.status} ${response.statusText})`,
    )
  const result = (await response.json()) as {
    errors?: { message: string }[]
    data?: {
      user?: {
        contributionsCollection?: { contributionCalendar?: { weeks?: Week[] } }
      }
    }
  }
  if (result.errors?.length)
    throw new Error(
      `GitHub API error: ${result.errors.map((e) => e.message).join('; ')}`,
    )
  const weeks =
    result.data?.user?.contributionsCollection?.contributionCalendar?.weeks
  if (!weeks)
    throw new Error(
      `GitHub user "${user}" was not found or returned no calendar.`,
    )
  return weeks
}

export function calendarGrid(weeks: Week[]): {
  grid: number[][]
  counts: number[][]
} {
  const grid: number[][] = []
  const counts: number[][] = []
  for (const week of weeks) {
    const levels = Array<number>(7).fill(0)
    const totals = Array<number>(7).fill(0)
    for (const day of week.contributionDays) {
      const row = new Date(`${day.date}T00:00:00Z`).getUTCDay()
      levels[row] = LEVEL[day.contributionLevel]
      totals[row] = day.contributionCount
    }
    grid.push(levels)
    counts.push(totals)
  }
  return { grid, counts }
}

export function solve(grid: number[][], cap = 999): Solution {
  const ncols = grid.length
  const neighbors = ([col, row]: Cell): Cell[] =>
    (
      [
        [col + 1, row],
        [col - 1, row],
        [col, row + 1],
        [col, row - 1],
      ] as Cell[]
    ).filter(([c, r]) => c >= 0 && c < ncols && r >= 0 && r < grid[c].length)

  function bfs(start: Cell, goal: Cell, blocked: Set<string>): Cell[] | null {
    // Find the shortest route across cells that the body does not occupy.
    if (key(start) === key(goal)) return [[...start]]
    const queue: { cell: Cell; path: Cell[] }[] = [
      { cell: [...start], path: [[...start]] },
    ]
    const seen = new Set([key(start)])
    for (let i = 0; i < queue.length; i++) {
      const { cell, path } = queue[i]
      for (const next of neighbors(cell)) {
        if (
          seen.has(key(next)) ||
          (blocked.has(key(next)) && key(next) !== key(goal))
        )
          continue
        if (key(next) === key(goal)) return [...path, next]
        seen.add(key(next))
        queue.push({ cell: next, path: [...path, next] })
      }
    }
    return null
  }

  const remaining = new Set<string>()
  for (let c = 0; c < ncols; c++)
    for (let r = 0; r < grid[c].length; r++)
      if (grid[c][r] > 0) remaining.add(`${c},${r}`)
  const start = [...remaining]
    .map((v) => v.split(',').map(Number) as Cell)
    .sort(
      (a, b) => a[0] * 10 + Math.abs(a[1] - 3) - b[0] * 10 - Math.abs(b[1] - 3),
    )[0] ?? [0, 3]
  const body: Cell[] = [[...start]]
  const occupied = new Set([key(start)])
  const route: Cell[] = [[...start]]
  const eats: Solution['eats'] = []
  const growth: number[] = []
  const allowed = () => BASE_LEN + growth.length
  function eat(cell: Cell): void {
    remaining.delete(key(cell))
    eats.push({ step: route.length - 1, cell: [...cell] })
    if (BASE_LEN + growth.length < cap) growth.push(route.length - 1)
  }
  function stepTo(cell: Cell): void {
    route.push(cell)
    body.push(cell)
    occupied.add(key(cell))
    if (remaining.has(key(cell))) eat(cell)
    while (body.length > allowed()) {
      const tail = body.shift()!
      if (key(tail) !== key(cell)) occupied.delete(key(tail))
    }
  }
  if (remaining.has(key(start))) eat(start)
  const tailWillVacate = (cell: Cell) =>
    key(cell) === key(body[0]) &&
    !remaining.has(key(cell)) &&
    body.length + 1 > allowed()
  function safe(cell: Cell): boolean {
    // A move is safe only if the head can still reach the moving tail afterward.
    const grows = remaining.has(key(cell))
    if (key(cell) === key(body[0]) && !grows && !tailWillVacate(cell))
      return false
    const blocked = new Set(occupied)
    blocked.add(key(cell))
    let tail = body[0]
    if (!grows && body.length + 1 > allowed()) {
      blocked.delete(key(body[0]))
      tail = body[1] ?? cell
    }
    blocked.delete(key(tail))
    blocked.delete(key(cell))
    return bfs(cell, tail, blocked) !== null
  }

  let stuck = 0
  while (remaining.size && route.length < 4000) {
    let head = body.at(-1)!
    const blocked = new Set(occupied)
    blocked.delete(key(head))
    const score = (cell: Cell) =>
      grid[cell[0]][cell[1]] * 8 +
      Math.abs(cell[0] - head[0]) +
      Math.abs(cell[1] - head[1])
    const candidates = [...remaining]
      .map((v) => v.split(',').map(Number) as Cell)
      .sort((a, b) => score(a) - score(b))
      .slice(0, 24)
    let path: Cell[] | null = null
    for (const candidate of candidates) {
      const found = bfs(head, candidate, blocked)
      if (found && found.length > 1) {
        path = found
        break
      }
    }
    if (path) {
      let aborted = false
      for (const cell of path.slice(1)) {
        if (!safe(cell)) {
          aborted = true
          break
        }
        stepTo(cell)
      }
      if (!aborted) {
        stuck = 0
        continue
      }
    }
    if (++stuck > 400) break
    // If the chosen food route would trap the snake, follow its tail instead.
    head = body.at(-1)!
    const tail = body[0]
    const blockedByBody = new Set(occupied)
    blockedByBody.delete(key(head))
    const tailPath = bfs(head, tail, blockedByBody)
    let next: Cell | undefined
    if (
      tailPath &&
      tailPath.length > 1 &&
      (!occupied.has(key(tailPath[1])) || tailWillVacate(tailPath[1])) &&
      safe(tailPath[1])
    ) {
      next = tailPath[1]
    } else {
      const free = neighbors(head).filter(
        (cell) => !occupied.has(key(cell)) || tailWillVacate(cell),
      )
      const safeFree = free.filter(safe)
      ;(safeFree.length ? safeFree : free).sort(
        (a, b) =>
          neighbors(b).filter((cell) => !occupied.has(key(cell))).length -
          neighbors(a).filter((cell) => !occupied.has(key(cell))).length,
      )
      next = (safeFree.length ? safeFree : free)[0]
    }
    if (!next) break
    stepTo(next)
  }
  return {
    route,
    eats,
    growth,
    maxLength: BASE_LEN + growth.length,
    left: remaining.size,
  }
}

function render(
  grid: number[][],
  counts: number[][],
  months: [number, string][],
  route: Cell[],
  eats: Solution['eats'],
  growth: number[],
  theme: keyof typeof THEMES,
  options: Pick<Options, 'counter' | 'frame'>,
): string {
  const colors = THEMES[theme]
  const ncols = grid.length
  const total = route.length + PAUSE_STEPS
  const duration = total / STEPS_PER_SEC
  const pct = (step: number) => Number(((step / total) * 100).toFixed(3))
  const xy = (col: number, row: number): [number, number] => [
    MX + col * PITCH,
    MTOP + row * PITCH,
  ]
  const lengthAt = (step: number) =>
    BASE_LEN + growth.filter((at) => at <= step).length

  const intervals = new Map<string, [number, number][]>()
  const openIntervals = new Map<string, number>()
  let previous = new Set<string>()
  for (let step = 0; step < route.length; step++) {
    const occupied = new Set(
      route.slice(Math.max(0, step - lengthAt(step) + 1), step + 1).map(key),
    )
    for (const cell of occupied)
      if (!previous.has(cell)) openIntervals.set(cell, step)
    for (const cell of previous) {
      if (!occupied.has(cell)) {
        const list = intervals.get(cell) ?? []
        list.push([openIntervals.get(cell)!, step])
        intervals.set(cell, list)
        openIntervals.delete(cell)
      }
    }
    previous = occupied
  }
  for (const [cell, start] of openIntervals) {
    const list = intervals.get(cell) ?? []
    list.push([start, total])
    intervals.set(cell, list)
  }

  const eatenAt = new Map(eats.map(({ step, cell }) => [key(cell), step]))
  const css: string[] = []
  const body: string[] = []
  for (let col = 0; col < ncols; col++) {
    for (let row = 0; row < grid[col].length; row++) {
      const [x, y] = xy(col, row)
      const base = colors.levels[grid[col][row]]
      const cellIntervals = intervals.get(`${col},${row}`) ?? []
      const className = `c${col}_${row}`
      body.push(
        `<rect class="${className}" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${base}"/>`,
      )
      if (!cellIntervals.length) continue

      const stops: [number, string | null][] = [[0, base]]
      for (const [start, end] of cellIntervals) {
        const post =
          !eatenAt.has(`${col},${row}`) || eatenAt.get(`${col},${row}`)! > end
            ? base
            : colors.levels[0]
        const startPct = pct(start)
        stops.push(
          [Math.max(startPct - 0.05, 0), null],
          [startPct, colors.head],
        )
        for (const [age, color] of colors.ramp)
          if (start + age < end) stops.push([pct(start + age), color])
        if (end < total) {
          const endPct = pct(end)
          stops.push([Math.max(endPct - 0.05, 0), null], [endPct, post])
        }
      }
      let last = base
      const frames = stops.map(([percent, color]) => {
        last = color ?? last
        return `${percent}% { fill:${last}; }`
      })
      frames.push(`100% { fill:${last}; }`)
      css.push(
        `@keyframes k${className} { ${frames.join(' ')} }\n.${className} { animation:k${className} ${duration.toFixed(1)}s linear infinite; }`,
      )
    }
  }

  for (const [col, label] of months) {
    const [x] = xy(col, 0)
    body.push(`<text class="lab" x="${x}" y="14">${label}</text>`)
  }
  const legendX = MX + ncols * PITCH - GAP - 5 * (CELL + 3) - 62
  const legendY = MTOP + 7 * PITCH + 8
  body.push(
    `<text class="lab" x="${legendX - 30}" y="${legendY + 9}">less</text>`,
  )
  for (let level = 0; level < 5; level++) {
    body.push(
      `<rect x="${legendX + level * (CELL + 3)}" y="${legendY}" width="${CELL}" height="${CELL}" rx="2.5" fill="${colors.levels[level]}"/>`,
    )
  }
  body.push(
    `<text class="lab" x="${legendX + 5 * (CELL + 3) + 8}" y="${legendY + 9}">more</text>`,
  )

  if (options.counter) {
    const totalCommits = eats.reduce(
      (sum, { cell }) => sum + counts[cell[0]][cell[1]],
      0,
    )
    let value = 0
    const states: [number, number][] = [[0, 0]]
    for (const { step, cell } of eats) {
      value += counts[cell[0]][cell[1]]
      states.push([step, value])
    }
    body.push(
      `<text class="lab" x="${MX}" y="${legendY + 9}">$ commits eaten:</text>`,
    )
    states.forEach(([step, count], index) => {
      const start = pct(step)
      const end = index + 1 < states.length ? pct(states[index + 1][0]) : 100
      if (end <= start) return
      const frames =
        end < 100
          ? `0% { opacity:0; } ${start}% { opacity:1; } ${end}% { opacity:0; } 100% { opacity:0; }`
          : `0% { opacity:0; } ${start}% { opacity:1; } 100% { opacity:1; }`
      css.push(
        `@keyframes m${index} { ${frames} }\n.m${index} { animation:m${index} ${duration.toFixed(1)}s steps(1,end) infinite; }`,
      )
      body.push(
        `<text class="cnt m${index}" opacity="0" x="${MX + 102}" y="${legendY + 9}">${count}/${totalCommits}</text>`,
      )
    })
  }

  const width = MX * 2 + ncols * PITCH - GAP
  const height = MTOP + 7 * PITCH - GAP + MBOT
  const frameOpen = options.frame
    ? `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="12" fill="${colors.frameBg}" stroke="${colors.frameBorder}"/>`
    : ''
  const frameClose = options.frame
    ? `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="12" fill="none" stroke="${colors.frameBorder}"/>`
    : ''
  const mono = "ui-monospace,'SF Mono',Menlo,Consolas,monospace"
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <style>
    .lab { font-family:${mono}; font-size:9.5px; fill:${colors.text}; }
    .cnt { font-family:${mono}; font-size:9.5px; fill:${colors.snake}; }
    @media (prefers-reduced-motion) { * { animation:none !important; } }
    ${css.join('\n')}
  </style>
  ${frameOpen}
  ${body.map((item) => `  ${item}`).join('\n')}
  ${frameClose}
</svg>
`
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    user: process.env.GH_USER ?? process.env.GITHUB_REPOSITORY_OWNER ?? '',
    output: 'dist/snake.svg',
    theme: 'green',
    frame: false,
    counter: true,
  }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--frame') options.frame = true
    else if (arg === '--no-counter') options.counter = false
    else if (['--user', '--output', '--theme'].includes(arg)) {
      const value = args[++i]
      if (!value) throw new Error(`Missing value for ${arg}`)
      if (arg === '--user') options.user = value
      else if (arg === '--output') options.output = value
      else {
        if (!(value in THEMES))
          throw new Error(
            `Unknown theme "${value}". Choose: ${Object.keys(THEMES).join(', ')}`,
          )
        options.theme = value as keyof typeof THEMES
      }
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Turn a GitHub contribution graph into a Snake SVG.\n\nUsage: node scripts/snake-and-commits.ts --user OCTOCAT --output dist/snake.svg [options]\n\nOptions:\n  --user USER       GitHub username\n  --output PATH     Output path (default: dist/snake.svg)\n  --theme THEME     green, blue, amber, or matrix\n  --frame           Draw a rounded window frame\n  --no-counter      Hide the commits-eaten counter',
      )
      process.exit(0)
    } else throw new Error(`Unknown option "${arg}"`)
  }
  if (!options.user)
    throw new Error('--user is required (or set GH_USER / run in Actions)')
  return options
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const token = getToken()
  if (!token)
    throw new Error(
      'No token found. Set GH_TOKEN (or GITHUB_TOKEN) or run gh auth login.',
    )
  const weeks = await fetchWeeks(options.user, token)
  const { grid, counts } = calendarGrid(weeks)
  const months: [number, string][] = []
  let seenMonth: number | null = null
  for (const [col, week] of weeks.entries()) {
    if (!week.contributionDays.length) continue
    const month = Number(week.contributionDays[0].date.split('-')[1])
    if (month !== seenMonth) {
      months.push([col, MONTHS[month]])
      seenMonth = month
    }
  }
  if (months[0]?.[0] === 0 && months.length > 1 && months[1][0] <= 2)
    months.shift()
  let result = solve(grid, 48)
  for (const cap of [40, 34, 28, 24, 20, 16, 12]) {
    if (!result.left) break
    result = solve(grid, cap)
  }
  await mkdir(dirname(options.output), { recursive: true })
  await writeFile(
    options.output,
    render(
      grid,
      counts,
      months,
      result.route,
      result.eats,
      result.growth,
      options.theme,
      options,
    ),
  )
  console.log(
    `wrote ${options.output} — ${result.eats.length} cells eaten, snake grew to ${result.maxLength}, ${result.left} left over`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    console.error(
      `error: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exitCode = 1
  })
}

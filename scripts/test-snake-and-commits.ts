import assert from 'node:assert/strict'
import test from 'node:test'
import { calendarGrid, solve } from './snake-and-commits.ts'

function week(start: string, activeRows: Set<number>) {
  const first = new Date(`${start}T00:00:00Z`)
  return {
    contributionDays: Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(first.getTime() + offset * 86_400_000)
        .toISOString()
        .slice(0, 10)
      const active = activeRows.has(offset)
      return {
        date,
        contributionCount: active ? 1 : 0,
        contributionLevel: active
          ? ('FIRST_QUARTILE' as const)
          : ('NONE' as const),
      }
    }),
  }
}

test('empty weeks remain traversable columns', () => {
  const { grid, counts } = calendarGrid([
    week('2025-01-05', new Set([3])),
    { contributionDays: [] },
    week('2025-01-19', new Set([3])),
  ])
  const result = solve(grid)
  assert.deepEqual(grid[1], [0, 0, 0, 0, 0, 0, 0])
  assert.deepEqual(counts[1], [0, 0, 0, 0, 0, 0, 0])
  assert.equal(result.left, 0)
  assert.ok(result.eats.some(({ cell }) => cell[0] === 2))
  assert.ok(result.route.some(([col]) => col === 1))
})

test('partial weeks keep their original weekday positions', () => {
  const { grid, counts } = calendarGrid([
    {
      contributionDays: [
        {
          date: '2025-01-06',
          contributionCount: 2,
          contributionLevel: 'FIRST_QUARTILE',
        },
        {
          date: '2025-01-11',
          contributionCount: 5,
          contributionLevel: 'FOURTH_QUARTILE',
        },
      ],
    },
  ])
  assert.deepEqual(grid[0], [0, 1, 0, 0, 0, 0, 4])
  assert.deepEqual(counts[0], [0, 2, 0, 0, 0, 0, 5])
})

test('solver does not close a loop around its head', () => {
  const grid = [
    [1, 1, 1, 1, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 1],
  ]
  const result = solve(grid)
  assert.equal(result.left, 0)
  assert.equal(result.eats.length, 8)
  assert.ok(Math.max(...result.route.map(([col]) => col)) > 0)
})

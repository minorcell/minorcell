import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  collectGitHubSnapshot,
  refreshGitHubSnapshot,
} from './sync-github-profile.ts'
import {
  formatGitHubDate,
  parseGitHubSnapshot,
  summarizeGitHub,
} from '../src/lib/github-profile.ts'
import type {
  GitHubSnapshot,
  GitHubRepository,
} from '../src/lib/github-profile.ts'

const now = new Date('2026-10-07T13:00:00Z')
const repository: GitHubRepository = {
  id: 1,
  name: 'demo',
  description: null,
  url: 'https://github.com/tester/demo',
  language: 'TypeScript',
  stars: 10,
  forks: 2,
  fork: false,
  archived: false,
  pushedAt: '2026-08-16T19:20:03Z',
}
const fixture: GitHubSnapshot = {
  schemaVersion: 2,
  fetchedAt: now.toISOString(),
  profile: {
    login: 'tester',
    bio: null,
    company: null,
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    url: 'https://github.com/tester',
    followers: 3,
  },
  organizations: [
    {
      login: 'demo-org',
      url: 'https://github.com/demo-org',
      avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4',
    },
  ],
  repositories: [repository],
  contributions: {
    from: '2025-10-07T13:00:00Z',
    to: now.toISOString(),
    total: 12,
    days: [
      { date: '2026-09-30', count: 3 },
      { date: '2026-10-01', count: 9 },
    ],
  },
}

function apiRepository(id: number) {
  return {
    id,
    name: `repo-${id}`,
    html_url: `https://github.com/tester/repo-${id}`,
    description: null,
    language: null,
    stargazers_count: 0,
    forks_count: 0,
    fork: false,
    archived: false,
    private: false,
    pushed_at: repository.pushedAt,
  }
}

function fakeFetch(
  options: {
    pages?: number[]
    graphqlError?: boolean
    viewer?: string
    privateRepository?: boolean
    orgPages?: number[]
  } = {},
): typeof fetch {
  return async (input, init) => {
    const url = new URL(
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    )
    assert.equal(url.origin, 'https://api.github.com')
    if (url.pathname === '/users/tester')
      return Response.json({
        login: 'tester',
        name: null,
        bio: null,
        company: null,
        avatar_url: fixture.profile.avatarUrl,
        html_url: fixture.profile.url,
        created_at: '2022-12-17T14:15:32Z',
        followers: 3,
      })
    if (url.pathname === '/users/tester/repos') {
      assert.equal(url.searchParams.get('type'), 'owner')
      const page = Number(url.searchParams.get('page'))
      return Response.json(
        Array.from(
          { length: (options.pages ?? [1])[page - 1] ?? 0 },
          (_, i) => ({
            ...apiRepository((page - 1) * 100 + i + 1),
            private:
              (options.privateRepository && page === 1 && i === 0) || false,
          }),
        ),
      )
    }
    if (url.pathname === '/users/tester/orgs') {
      assert.equal(new Headers(init?.headers).has('Authorization'), true)
      const page = Number(url.searchParams.get('page'))
      return Response.json(
        Array.from(
          { length: (options.orgPages ?? [1])[page - 1] ?? 0 },
          (_, index) => ({
            login: `org-${(page - 1) * 100 + index}`,
            avatar_url: fixture.organizations[0].avatarUrl,
          }),
        ),
      )
    }
    assert.equal(url.pathname, '/graphql')
    const { variables, query } = JSON.parse(String(init?.body))
    assert.equal(variables.login, 'tester')
    assert.equal(variables.to, now.toISOString())
    if (options.graphqlError)
      return Response.json({ errors: [{ message: 'Unavailable' }] })
    if (!query.includes('contributionCalendar')) {
      const field = [
        'issueContributions',
        'pullRequestContributions',
        'pullRequestReviewContributions',
      ].find((name) => query.includes(`${name}(`))
      return Response.json({
        data: {
          user: {
            contributionsCollection: field
              ? {
                  [field]: {
                    nodes: [],
                    pageInfo: { hasNextPage: false, endCursor: null },
                  },
                }
              : { commitContributionsByRepository: [] },
          },
        },
      })
    }
    return Response.json({
      data: {
        viewer: { login: options.viewer ?? 'tester' },
        user: {
          contributionsCollection: {
            startedAt: fixture.contributions.from,
            endedAt: fixture.contributions.to,
            contributionCalendar: {
              totalContributions: 12,
              weeks: [
                {
                  contributionDays: fixture.contributions.days.map((day) => ({
                    date: day.date,
                    contributionCount: day.count,
                  })),
                },
              ],
            },
          },
        },
      },
    })
  }
}

test('collects every public repository and organization page', async () => {
  const snapshot = await collectGitHubSnapshot({
    user: 'tester',
    token: 'test',
    now,
    fetch: fakeFetch({ pages: [100, 1], orgPages: [100, 1] }),
  })
  assert.equal(snapshot.repositories.length, 101)
  assert.equal(snapshot.repositories.at(-1)?.name, 'repo-101')
  assert.equal(snapshot.repositories[0].language, null)
  assert.deepEqual(snapshot.contributions, fixture.contributions)
  assert.equal(snapshot.organizations.length, 101)
  assert.equal(snapshot.organizations.at(-1)?.login, 'org-100')
})

test('excludes private repository details while preserving aggregate contributions', async () => {
  const snapshot = await collectGitHubSnapshot({
    user: 'tester',
    token: 'test',
    now,
    fetch: fakeFetch({ privateRepository: true }),
  })
  assert.equal(snapshot.repositories.length, 0)
  assert.deepEqual(snapshot.contributions, fixture.contributions)
  assert.doesNotMatch(JSON.stringify(snapshot), /repo-1|createdAt|created_at/)
})

test('requires the account owner token for private contribution data', async () => {
  await assert.rejects(
    collectGitHubSnapshot({
      user: 'tester',
      token: 'test',
      now,
      fetch: fakeFetch({ viewer: 'another-user' }),
    }),
    /owner's token/,
  )
})

test('published snapshots strip unrecognized private metadata', () => {
  const snapshot = parseGitHubSnapshot({
    ...fixture,
    token: 'secret-token',
    profile: {
      ...fixture.profile,
      createdAt: '2020-01-01',
      name: 'unwanted-name',
    },
    contributions: {
      ...fixture.contributions,
      privateRepository: 'secret-project',
    },
    repositories: [{ ...repository, privateMetadata: 'private-details' }],
  })
  assert.doesNotMatch(
    JSON.stringify(snapshot),
    /secret-token|secret-project|private-details|unwanted-name|createdAt/,
  )
  assert.throws(
    () =>
      parseGitHubSnapshot({
        ...fixture,
        repositories: [{ ...repository, private: true }],
      }),
    /repository/,
  )
})

test('rejects GraphQL errors even with HTTP 200', async () => {
  await assert.rejects(
    collectGitHubSnapshot({
      user: 'tester',
      token: 'test',
      now,
      fetch: fakeFetch({ graphqlError: true }),
    }),
    /contribution query failed/,
  )
})

test('keeps upstream stars out of personal metrics and includes archived originals', () => {
  const make = (
    id: number,
    extras: Partial<GitHubRepository>,
  ): GitHubRepository => ({
    ...repository,
    id,
    name: `repo-${id}`,
    url: `https://github.com/tester/repo-${id}`,
    ...extras,
  })
  const snapshot = {
    ...fixture,
    repositories: [
      make(1, {
        fork: true,
        stars: 1000,
        upstream: {
          fullName: 'upstream/source',
          description: 'Original project',
          url: 'https://github.com/upstream/source',
          language: 'Rust',
          stars: 5000,
          forks: 200,
          archived: false,
          pushedAt: '2026-10-06T00:00:00Z',
        },
      }),
      make(2, { archived: true, stars: 100 }),
      make(3, { stars: 15 }),
      make(4, { stars: 15, pushedAt: '2026-10-01T00:00:00Z' }),
      make(5, { language: null, stars: 1 }),
    ],
  }
  const summary = summarizeGitHub(parseGitHubSnapshot(snapshot))
  assert.equal(summary.publicRepositories, 5)
  assert.equal(summary.originalRepositories, 4)
  assert.equal(summary.stars, 131)
  assert.deepEqual(
    summary.featured.map((r) => r.id),
    [2, 4, 3, 5],
  )
  assert.deepEqual(summary.languages, [['TypeScript', 3]])
  assert.equal(summary.unknownLanguages, 1)
  assert.equal(summary.forks[0].upstream?.stars, 5000)
  assert.equal(
    summary.featured.some((repo) => repo.fork),
    false,
  )
  assert.deepEqual(summary.monthly, [
    ['2026-09', 3],
    ['2026-10', 9],
  ])
})

test('rejects duplicate repositories and malformed metrics', () => {
  assert.throws(
    () =>
      parseGitHubSnapshot({
        ...fixture,
        repositories: [repository, repository],
      }),
    /repository/,
  )
  assert.throws(
    () =>
      parseGitHubSnapshot({
        ...fixture,
        profile: { ...fixture.profile, followers: -1 },
      }),
    /profile/,
  )
  assert.throws(
    () =>
      parseGitHubSnapshot({
        ...fixture,
        contributions: { ...fixture.contributions, total: null },
      }),
    /contributions/,
  )
  assert.throws(
    () =>
      parseGitHubSnapshot({
        ...fixture,
        contributions: {
          ...fixture.contributions,
          days: [fixture.contributions.days[0], fixture.contributions.days[0]],
        },
      }),
    /contribution day/,
  )
})

test('failed collection leaves the last successful snapshot and timestamp intact', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'github-profile-'))
  const path = join(directory, 'profile.json')
  const previous = JSON.stringify(fixture)
  try {
    await writeFile(path, previous)
    await assert.rejects(
      refreshGitHubSnapshot(path, {
        user: 'tester',
        token: 'test',
        fetch: async () => new Response('', { status: 403 }),
      }),
      /HTTP 403/,
    )
    assert.equal(await readFile(path, 'utf8'), previous)
    await assert.rejects(
      refreshGitHubSnapshot(path, {
        user: 'another-user',
        token: 'test',
        fetch: async () => new Response('', { status: 403 }),
      }),
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('successful collection replaces the snapshot and cold failure does not create fake data', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'github-profile-'))
  try {
    const path = join(directory, 'profile.json')
    await assert.rejects(
      refreshGitHubSnapshot(path, { user: 'tester', token: '', now }),
      /token is required/,
    )
    const result = await refreshGitHubSnapshot(path, {
      user: 'tester',
      token: 'test',
      now,
      fetch: fakeFetch(),
    })
    assert.equal(result.updated, true)
    assert.equal(
      parseGitHubSnapshot(JSON.parse(await readFile(path, 'utf8'))).fetchedAt,
      now.toISOString(),
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('dates use Beijing time regardless of the build machine timezone', () => {
  assert.equal(formatGitHubDate('2026-08-16T19:20:03Z'), '2026.08.17')
  assert.equal(formatGitHubDate('2022-12-17T14:15:32Z', true), '2022.12')
})

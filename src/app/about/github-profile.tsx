'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import {
  formatGitHubDate,
  languageColors,
  parseGitHubSnapshot,
  summarizeGitHub,
} from '@/lib/github-profile'
import type { GitHubSnapshot, GitHubRepository } from '@/lib/github-profile'
import styles from './profile.module.css'
import PublicActivity from './public-activity'

const number = new Intl.NumberFormat('zh-CN')
export const snapshotUrl =
  'https://raw.githubusercontent.com/minorcell/minorcell/output/github.json'
const outputUrl = 'https://raw.githubusercontent.com/minorcell/minorcell/output'
export type SnakeSources = { light: string; dark: string }

function RepositoryBadges({ repo }: { repo: GitHubRepository }) {
  return (
    <>
      {repo.archived ? (
        <span className={styles.badge}>
          <Icon name="archive-line" aria-hidden="true" className="h-3 w-3" />
          已归档
        </span>
      ) : null}
    </>
  )
}

function ContributionSnake({
  contributions,
  sources,
}: {
  contributions: GitHubSnapshot['contributions']
  sources: SnakeSources | null
}) {
  const [failed, setFailed] = useState(false)
  return (
    <figure className={styles.snake}>
      {failed || !sources ? (
        <p className={styles.empty}>贡献动画暂时无法加载。</p>
      ) : (
        <picture>
          <source media="(prefers-color-scheme: dark)" srcSet={sources.dark} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sources.light}
            alt="近一年公开与私有贡献的动态 Snake 图"
            width={788}
            height={154}
            onError={() => setFailed(true)}
          />
        </picture>
      )}
      <figcaption>
        {contributions.days[0]?.date} 至 {contributions.days.at(-1)?.date}
      </figcaption>
    </figure>
  )
}

function Language({ name }: { name: string }) {
  return (
    <span className={styles.language}>
      <span
        aria-hidden="true"
        className={styles.languageDot}
        style={{
          backgroundColor: languageColors[name] ?? 'var(--muted-foreground)',
        }}
      />
      {name}
    </span>
  )
}

export default function GitHubProfile({
  development = false,
  localSnapshot = null,
  localSnake = null,
}: {
  development?: boolean
  localSnapshot?: GitHubSnapshot | null
  localSnake?: SnakeSources | null
}) {
  const [remoteSnapshot, setSnapshot] = useState<GitHubSnapshot | null>(null)
  const snapshot = development ? localSnapshot : remoteSnapshot
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (development) return
    const controller = new AbortController()
    setFailed(false)
    fetch(snapshotUrl, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Snapshot unavailable')
        const next = parseGitHubSnapshot(await response.json())
        if (next.profile.login !== 'minorcell')
          throw new Error('Unexpected profile')
        if (!controller.signal.aborted) setSnapshot(next)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [attempt, development])

  if (!snapshot)
    return (
      <div
        className={`mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-10 ${styles.status}`}
      >
        <h1>关于</h1>
        <output>
          {development
            ? '本地 GitHub 数据暂不可用。'
            : failed
              ? 'GitHub 数据暂时无法加载。'
              : '正在加载 GitHub 数据…'}
        </output>
        {failed || development ? (
          <button
            type="button"
            onClick={() => {
              if (development) window.location.reload()
              else setAttempt((value) => value + 1)
            }}
          >
            <Icon name="refresh-line" aria-hidden="true" className="h-4 w-4" />
            重试
          </button>
        ) : null}
      </div>
    )

  return (
    <ProfileContent
      snapshot={snapshot}
      snakeSources={
        development
          ? localSnake
          : {
              light: `${outputUrl}/snake-light.svg`,
              dark: `${outputUrl}/snake-dark.svg`,
            }
      }
    />
  )
}

function ProfileContent({
  snapshot,
  snakeSources,
}: {
  snapshot: GitHubSnapshot
  snakeSources: SnakeSources | null
}) {
  const { profile, contributions, organizations } = snapshot
  const [repositoryLimit, setRepositoryLimit] = useState(3)
  const summary = summarizeGitHub(snapshot)
  const activeDays = contributions.days.filter((day) => day.count > 0).length
  const updatedTime = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(snapshot.fetchedAt))

  return (
    <div
      className={`mx-auto w-full max-w-[1280px] px-5 pb-16 sm:px-8 sm:pb-24 lg:px-10 ${styles.profile}`}
    >
      <header className={styles.identity}>
        <div className={styles.identityRow}>
          <div className={styles.identityText}>
            <div className={styles.nameRow}>
              <h1>{profile.login}</h1>
              {profile.company ? (
                <span className={styles.company}>{profile.company}</span>
              ) : null}
            </div>
            {profile.bio ? <p className={styles.bio}>{profile.bio}</p> : null}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatarUrl}
            alt={`${profile.login} 的 GitHub 头像`}
            width={64}
            height={64}
            className={styles.avatar}
            decoding="async"
          />
        </div>
        <div className={styles.profileLinks}>
          <a href={profile.url} target="_blank" rel="noopener noreferrer">
            <Icon name="github-line" aria-hidden="true" className="h-4 w-4" />
            GitHub
          </a>
          {organizations.length ? (
            <ul className={styles.organizations} aria-label="公开组织">
              {organizations.map((org) => (
                <li key={org.login}>
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`组织：${org.login}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={org.avatarUrl}
                      alt=""
                      width={24}
                      height={24}
                      loading="lazy"
                    />
                    {org.login}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <section
        className={styles.activity}
        aria-labelledby="contribution-activity"
      >
        <div className={styles.activityHeading}>
          <h2 id="contribution-activity">贡献活跃</h2>
          <p>
            {number.format(contributions.total)} 次贡献 ·{' '}
            {number.format(activeDays)} 个活跃日
          </p>
        </div>
        <ContributionSnake
          contributions={contributions}
          sources={snakeSources}
        />
      </section>

      <div className={styles.repositoryToolbar}>
        <h2 id="popular-repositories">我的公开项目</h2>
        <span>{number.format(summary.originalRepositories)} 个项目</span>
      </div>
      <div className={styles.content}>
        <section aria-labelledby="popular-repositories">
          {summary.featured.length ? (
            <ol className={styles.repositories}>
              {summary.featured.slice(0, repositoryLimit).map((repo) => (
                <li key={repo.id} className={styles.repository}>
                  <div className={styles.repositoryHeading}>
                    <h3>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {repo.name}
                        <Icon
                          name="arrow-right-up-line"
                          aria-hidden="true"
                          className="ml-2 inline-block h-4 w-4"
                        />
                      </a>
                    </h3>
                    <span className={styles.stars}>
                      <Icon
                        name="star-line"
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                      {number.format(repo.stars)} Star
                    </span>
                  </div>
                  {repo.description ? (
                    <p className={styles.description}>{repo.description}</p>
                  ) : null}
                  <div className={styles.repositoryMeta}>
                    <RepositoryBadges repo={repo} />
                    {repo.language ? <Language name={repo.language} /> : null}
                    <span>{number.format(repo.forks)} Fork</span>
                    <span>
                      推送于{' '}
                      <time dateTime={repo.pushedAt}>
                        {formatGitHubDate(repo.pushedAt)}
                      </time>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>暂无公开的非 Fork 项目。</p>
          )}
          {summary.featured.length > repositoryLimit ? (
            <button
              type="button"
              className={styles.showMore}
              onClick={() => setRepositoryLimit((value) => value + 6)}
            >
              <Icon
                name="arrow-down-line"
                aria-hidden="true"
                className="h-4 w-4"
              />
              更多仓库
            </button>
          ) : null}
        </section>

        <aside className={styles.sidebar} aria-label="项目语言与数据口径">
          <section>
            <h2 className={styles.sectionTitle}>项目的主要语言</h2>
            {summary.languages.length ? (
              <ul className={styles.languages}>
                {summary.languages.map(([language, count]) => (
                  <li key={language}>
                    <Language name={language} />
                    <span>{number.format(count)} 个</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>暂无已识别的仓库主语言。</p>
            )}
            {summary.unknownLanguages ? (
              <p className={styles.small}>
                另有 {summary.unknownLanguages} 个仓库未识别主语言
              </p>
            ) : null}
          </section>

          <details className={styles.dataNotes}>
            <summary>数据口径</summary>
            <p>
              项目仅包含公开非 Fork 仓库，归档项目正常展示。语言按仓库数统计。
              贡献版图仅展示我实际参与的公开活动。
            </p>
            <p>
              贡献活跃包含私有贡献计数，不展示私有名称或详情。贡献量沿用 GitHub
              日历口径，不等同于 Commit 数。日期使用北京时间。
            </p>
          </details>
        </aside>
      </div>
      <PublicActivity
        activity={snapshot.activity}
        login={profile.login}
        avatarUrl={profile.avatarUrl}
      />
      <div className={styles.provenance}>
        <span>
          GitHub · 数据更新于{' '}
          <time dateTime={snapshot.fetchedAt}>
            {formatGitHubDate(snapshot.fetchedAt)} {updatedTime}
          </time>
        </span>
        <a
          href={`${profile.url}?tab=repositories`}
          target="_blank"
          rel="noopener noreferrer"
        >
          全部仓库
          <Icon
            name="arrow-right-up-line"
            aria-hidden="true"
            className="h-4 w-4"
          />
        </a>
      </div>
    </div>
  )
}

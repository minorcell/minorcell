'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { formatGitHubDate } from '@/lib/github-profile'
import type {
  GitHubActivity,
  GitHubActivityKind,
  GitHubActivitySnapshot,
} from '@/lib/github-profile'
import styles from './public-activity.module.css'

const kinds: { kind: GitHubActivityKind; label: string; icon: string }[] = [
  { kind: 'commit', label: '提交', icon: 'git-commit-line' },
  { kind: 'pr', label: 'PR', icon: 'git-pull-request-line' },
  { kind: 'issue', label: 'Issue', icon: 'error-warning-line' },
  { kind: 'review', label: 'Review', icon: 'chat-check-line' },
]
const number = new Intl.NumberFormat('zh-CN')
type Project = {
  name: string
  url: string
  records: GitHubActivity[]
  count: number
  counts: Record<GitHubActivityKind, number>
  x: number
  y: number
  kind: GitHubActivityKind
}
type Camera = { x: number; y: number; zoom: number }

// Math.cos/sin can differ by one ULP between Node and browser JS engines,
// which breaks hydration. Basic IEEE-754 ops are exact, so rounding the
// results makes the coordinates identical on server and client.
const round = (value: number) => Math.round(value * 1000) / 1000

function layoutProjects(activity: GitHubActivitySnapshot) {
  const grouped = new Map<string, Project>()
  for (const item of activity.items) {
    let project = grouped.get(item.repository.url)
    if (!project) {
      project = {
        ...item.repository,
        records: [],
        count: 0,
        counts: { commit: 0, pr: 0, issue: 0, review: 0 },
        x: 0,
        y: 0,
        kind: item.kind,
      }
      grouped.set(project.url, project)
    }
    project.records.push(item)
    project.count += item.count
    project.counts[item.kind] += item.count
  }
  const sorted = [...grouped.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  )
  const rings: { radius: number; capacity: number }[] = []
  if (sorted.length <= 12) {
    rings.push({
      radius: Math.max(260, (sorted.length * 230) / (2 * Math.PI)),
      capacity: sorted.length,
    })
  } else {
    let capacity = 0
    for (let radius = 300; capacity < sorted.length; radius += 220) {
      const count = Math.floor((2 * Math.PI * radius) / 230)
      rings.push({ radius, capacity: count })
      capacity += count
    }
  }
  const size = (rings[rings.length - 1].radius + 140) * 2
  const hub = { x: size / 2, y: size / 2 }
  const totalCapacity = rings.reduce((sum, ring) => sum + ring.capacity, 0)
  let capacitySoFar = 0
  let placed = 0
  const projects: Project[] = []
  // Spread projects over complete rings instead of leaving a sparse outer arc.
  for (const [ringIndex, ring] of rings.entries()) {
    capacitySoFar += ring.capacity
    const end = Math.round((sorted.length * capacitySoFar) / totalCapacity)
    const count = end - placed
    for (let index = 0; index < count; index++) {
      const project = sorted[placed + index]
      const angle =
        -Math.PI / 2 +
        (index * 2 * Math.PI) / count +
        (ringIndex * Math.PI) / count
      const kind = [...kinds].sort(
        (a, b) => project.counts[b.kind] - project.counts[a.kind],
      )[0].kind
      projects.push({
        ...project,
        x: round(hub.x + Math.cos(angle) * ring.radius),
        y: round(hub.y + Math.sin(angle) * ring.radius),
        kind,
      })
    }
    placed = end
  }
  return { projects, hub, size }
}

export default function PublicActivity({
  activity,
  login = 'minorcell',
  avatarUrl,
}: {
  activity?: GitHubActivitySnapshot
  login?: string
  avatarUrl?: string
}) {
  if (!activity?.items.length)
    return (
      <section className={styles.activity}>
        <h2>公开活动</h2>
        <p className={styles.empty}>
          {activity ? '近期暂无公开贡献记录。' : '公开活动数据暂不可用。'}
        </p>
      </section>
    )
  return (
    <ContributionMap
      key={`${activity.from}:${activity.to}`}
      activity={activity}
      login={login}
      avatarUrl={avatarUrl}
    />
  )
}

function ContributionMap({
  activity,
  login,
  avatarUrl,
}: {
  activity: GitHubActivitySnapshot
  login: string
  avatarUrl?: string
}) {
  const {
    projects,
    hub,
    size: worldSize,
  } = useMemo(() => layoutProjects(activity), [activity])
  const [selectedUrl, setSelectedUrl] = useState(
    activity.items[0].repository.url,
  )
  const [recordIndex, setRecordIndex] = useState(0)
  const [noteOpen, setNoteOpen] = useState(true)
  const [dragging, setDragging] = useState(false)
  const selected =
    projects.find((project) => project.url === selectedUrl) ?? projects[0]
  const record = selected.records[recordIndex] ?? selected.records[0]
  const viewport = useRef<HTMLDivElement>(null)
  const note = useRef<HTMLDivElement>(null)
  const [noteHeight, setNoteHeight] = useState(340)
  const drag = useRef<{ x: number; y: number; camera: Camera } | null>(null)
  const initialized = useRef(false)
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })
  const [dimensions, setDimensions] = useState({ width: 1200, height: 620 })

  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      const height = entry.contentRect.height
      setDimensions({ width, height })
      if (!initialized.current) {
        const target = projects.find(
          (project) => project.url === activity.items[0].repository.url,
        )!
        setCamera({
          zoom: 1,
          x: width * (width < 640 ? 0.5 : 0.35) - target.x,
          y: (width < 640 ? 46 : height * 0.35) - target.y,
        })
        initialized.current = true
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [activity, projects])

  useEffect(() => {
    if (!noteOpen || !note.current) return
    const observer = new ResizeObserver(([entry]) => {
      setNoteHeight(
        entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height,
      )
    })
    observer.observe(note.current)
    return () => observer.disconnect()
  }, [noteOpen])

  const zoomBy = (factor: number) =>
    setCamera((previous) => {
      const zoom = Math.max(0.3, Math.min(1.8, previous.zoom * factor))
      const scale = zoom / previous.zoom
      return {
        zoom,
        x: dimensions.width / 2 - (dimensions.width / 2 - previous.x) * scale,
        y: dimensions.height / 2 - (dimensions.height / 2 - previous.y) * scale,
      }
    })
  const fit = () => {
    setNoteOpen(false)
    const zoom = Math.min(
      1,
      dimensions.width / worldSize,
      dimensions.height / worldSize,
    )
    setCamera({
      zoom,
      x: (dimensions.width - worldSize * zoom) / 2,
      y: (dimensions.height - worldSize * zoom) / 2,
    })
  }
  const resetScale = () => {
    setNoteOpen(true)
    setCamera({
      zoom: 1,
      x: dimensions.width * (dimensions.width < 640 ? 0.5 : 0.35) - selected.x,
      y: (dimensions.width < 640 ? 46 : dimensions.height * 0.35) - selected.y,
    })
  }
  const select = (project: Project) => {
    setSelectedUrl(project.url)
    setRecordIndex(0)
    setNoteOpen(true)
  }
  const route = (project: Project) =>
    `M ${hub.x} ${hub.y} L ${project.x} ${project.y}`
  const point = {
    x: selected.x * camera.zoom + camera.x,
    y: selected.y * camera.zoom + camera.y,
  }
  const compact = dimensions.width < 640
  const noteWidth = Math.min(340, dimensions.width - 24)
  const noteLeft = compact
    ? 12
    : Math.max(12, Math.min(dimensions.width - noteWidth - 12, point.x + 32))
  const noteTop = compact
    ? dimensions.height - noteHeight - 12
    : Math.max(12, Math.min(dimensions.height - noteHeight - 12, point.y - 32))
  const noteVisible =
    noteOpen &&
    point.x > 0 &&
    point.x < dimensions.width &&
    point.y > 0 &&
    point.y < dimensions.height

  return (
    <section
      className={styles.activity}
      aria-labelledby="public-activity-title"
    >
      <header className={styles.heading}>
        <div>
          <h2 id="public-activity-title">贡献版图</h2>
        </div>
        <p>{number.format(projects.length)} 个公开项目</p>
      </header>
      <div
        className={styles.viewport}
        ref={viewport}
        data-dragging={dragging || undefined}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (
            !event.isPrimary ||
            event.button !== 0 ||
            (event.target as Element).closest('button, a, [data-map-note]')
          )
            return
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { x: event.clientX, y: event.clientY, camera }
          setDragging(true)
        }}
        onPointerMove={(event) => {
          const start = drag.current
          if (!start) return
          setCamera({
            ...start.camera,
            x: start.camera.x + event.clientX - start.x,
            y: start.camera.y + event.clientY - start.y,
          })
        }}
        onPointerUp={() => {
          drag.current = null
          setDragging(false)
        }}
        onPointerCancel={() => {
          drag.current = null
          setDragging(false)
        }}
        onLostPointerCapture={() => {
          drag.current = null
          setDragging(false)
        }}
      >
        <div
          className={styles.scene}
          style={{
            width: worldSize,
            height: worldSize,
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          }}
        >
          <svg
            className={styles.routes}
            viewBox={`0 0 ${worldSize} ${worldSize}`}
            width={worldSize}
            height={worldSize}
            aria-hidden="true"
          >
            {projects.map((project) => (
              <path
                key={project.url}
                d={route(project)}
                data-kind={project.kind}
                data-active={
                  (noteOpen && project.url === selected.url) || undefined
                }
              />
            ))}
          </svg>
          <div className={styles.hub} style={{ left: hub.x, top: hub.y }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                width={56}
                height={56}
                draggable={false}
              />
            ) : (
              <Icon
                name="github-line"
                aria-hidden="true"
                className="h-10 w-10"
              />
            )}
            <strong>{login}</strong>
          </div>
          {projects.map((project) => {
            const type = kinds.find((kind) => kind.kind === project.kind)!
            const [owner, name] = project.name.split('/')
            return (
              <button
                type="button"
                key={project.url}
                className={styles.project}
                data-kind={project.kind}
                style={{ left: project.x, top: project.y }}
                aria-pressed={noteOpen && selected.url === project.url}
                aria-controls="project-activity-note"
                aria-label={`${project.name}，${project.count} 次公开贡献`}
                title={`${project.name} · ${project.count} 次公开贡献`}
                onClick={() => select(project)}
                onFocus={(event) => {
                  if (!event.currentTarget.matches(':focus-visible')) return
                  setCamera((previous) => {
                    const x = project.x * previous.zoom + previous.x
                    const y = project.y * previous.zoom + previous.y
                    if (
                      x >= 24 &&
                      x <= dimensions.width - 24 &&
                      y >= 24 &&
                      y <= dimensions.height - 24
                    )
                      return previous
                    return {
                      ...previous,
                      x: dimensions.width / 2 - project.x * previous.zoom,
                      y: dimensions.height / 2 - project.y * previous.zoom,
                    }
                  })
                }}
              >
                <span className={styles.pin}>
                  <Icon
                    name={type.icon}
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>
                <span className={styles.projectName}>{name}</span>
                <span className={styles.owner}>{owner}</span>
                <span className={styles.projectCount}>
                  {number.format(project.count)} 次贡献
                </span>
              </button>
            )
          })}
        </div>
        {noteOpen && (
          <>
            <svg
              className={styles.tether}
              width="100%"
              height="100%"
              aria-hidden="true"
              data-kind={selected.kind}
              style={{ visibility: noteVisible ? 'visible' : 'hidden' }}
            >
              <path
                d={`M ${point.x} ${point.y} L ${noteLeft + (compact ? noteWidth / 2 : 0)} ${noteTop + (compact ? 0 : 32)}`}
              />
            </svg>
            <div
              ref={note}
              id="project-activity-note"
              className={styles.note}
              data-map-note
              data-kind={selected.kind}
              style={{
                left: noteLeft,
                top: noteTop,
                width: noteWidth,
                visibility: noteVisible ? 'visible' : 'hidden',
              }}
            >
              <ActivityNote
                project={selected}
                record={record}
                recordIndex={recordIndex}
                onRecord={setRecordIndex}
                onClose={() => setNoteOpen(false)}
              />
            </div>
          </>
        )}
        <div className={styles.mapTools}>
          <button
            type="button"
            title="恢复正常比例"
            aria-label="恢复正常比例并定位当前项目"
            onClick={resetScale}
          >
            <Icon name="restart-line" aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            title="放大"
            aria-label="放大地图"
            onClick={() => zoomBy(1.25)}
          >
            <Icon name="zoom-in-line" aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            title="缩小"
            aria-label="缩小地图"
            onClick={() => zoomBy(0.8)}
          >
            <Icon name="zoom-out-line" aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            title="查看全部项目"
            aria-label="查看全部项目"
            onClick={fit}
          >
            <Icon name="focus-3-line" aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>
      <footer className={styles.mapFooter}>
        <div className={styles.legend} aria-label="公开活动类型">
          {kinds.map((kind) => (
            <span key={kind.kind} data-kind={kind.kind}>
              <Icon
                name={kind.icon}
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />
              {kind.label}
            </span>
          ))}
        </div>
        <p className={styles.range}>
          {formatGitHubDate(activity.from)} 至 {formatGitHubDate(activity.to)}
          {activity.limited ? ' · 部分公开记录' : ''}
        </p>
      </footer>
    </section>
  )
}

function ActivityNote({
  project,
  record,
  recordIndex,
  onRecord,
  onClose,
}: {
  project: Project
  record: GitHubActivity
  recordIndex: number
  onRecord: (index: number) => void
  onClose: () => void
}) {
  const kind = kinds.find((item) => item.kind === record.kind)!
  const rail = useRef<HTMLDivElement>(null)
  const activeStamp = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!rail.current || !activeStamp.current) return
    rail.current.scrollLeft =
      activeStamp.current.offsetLeft -
      rail.current.clientWidth / 2 +
      activeStamp.current.clientWidth / 2
  }, [project.url, recordIndex])

  return (
    <>
      <header className={styles.noteHeading}>
        <div>
          <p>{project.name.split('/')[0]}</p>
          <h3>
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              {project.name.split('/')[1]}
              <Icon
                name="arrow-right-up-line"
                className="h-4 w-4"
                aria-hidden="true"
              />
            </a>
          </h3>
        </div>
        <button
          type="button"
          className={styles.close}
          title="收起项目活动"
          aria-label="收起项目活动"
          onClick={onClose}
        >
          <Icon name="close-line" className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <div
        className={styles.contributionMix}
        aria-label={`${project.count} 次公开贡献`}
      >
        {kinds
          .filter((item) => project.counts[item.kind] > 0)
          .map((item) => (
            <span
              key={item.kind}
              data-kind={item.kind}
              title={`${item.label} · ${project.counts[item.kind]}`}
            >
              <Icon name={item.icon} className="h-4 w-4" aria-hidden="true" />
              <span>{number.format(project.counts[item.kind])}</span>
              <span className={styles.mixLabel}>{item.label}</span>
            </span>
          ))}
      </div>
      <div className={styles.footprints} ref={rail} aria-label="项目活动足迹">
        {project.records.map((item, index) => {
          const type = kinds.find((entry) => entry.kind === item.kind)!
          return (
            <button
              type="button"
              key={item.id}
              ref={index === recordIndex ? activeStamp : undefined}
              data-kind={item.kind}
              aria-pressed={index === recordIndex}
              aria-label={`${formatGitHubDate(item.occurredAt)} · ${type.label} · ${item.title}`}
              title={`${formatGitHubDate(item.occurredAt)} · ${type.label}`}
              onClick={() => onRecord(index)}
            >
              <Icon name={type.icon} className="h-4 w-4" aria-hidden="true" />
            </button>
          )
        })}
      </div>
      <div
        className={styles.memory}
        data-kind={record.kind}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={styles.recordMeta}>
          <span>{kind.label}</span>
          <time dateTime={record.occurredAt}>
            {formatGitHubDate(record.occurredAt)}
          </time>
        </div>
        <a
          className={styles.recordTitle}
          href={record.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {record.title}
          <Icon
            name="arrow-right-up-line"
            className="h-4 w-4"
            aria-hidden="true"
          />
        </a>
      </div>
      <div className={styles.recordControl}>
        <span>
          {recordIndex + 1} / {project.records.length}
        </span>
        <button
          type="button"
          title="上一条活动"
          aria-label="上一条活动"
          disabled={recordIndex === 0}
          onClick={() => onRecord(recordIndex - 1)}
        >
          <Icon
            name="arrow-left-s-line"
            className="h-5 w-5"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          title="下一条活动"
          aria-label="下一条活动"
          disabled={recordIndex >= project.records.length - 1}
          onClick={() => onRecord(recordIndex + 1)}
        >
          <Icon
            name="arrow-right-s-line"
            className="h-5 w-5"
            aria-hidden="true"
          />
        </button>
      </div>
    </>
  )
}

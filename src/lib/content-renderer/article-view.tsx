import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { GiscusComments } from '@/components/common/GiscusComments'
import { CopyPageButton } from '@/components/common/CopyPageButton'
import type { ArticleContent } from '@/lib/content-parser'

function formatIsoDate(value: string) {
  const date = new Date(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${d}`
}

function readingMinutes(text: string) {
  const cnChars = (text.match(/[一-龥]/g) || []).length
  const enWords = text
    .replace(/[一-龥]/g, '')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(cnChars / 400 + enWords / 220))
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : []
}

interface ArticleViewProps {
  article: ArticleContent
  discussionTerm: string
}

export function ArticleView({ article, discussionTerm }: ArticleViewProps) {
  const { metadata, content, rawContent } = article

  const tags = [...toStringArray(metadata.keywords), ...toStringArray(metadata.tags)]
  const minutes = readingMinutes(content)
  const dateStr = metadata.date
    ? formatIsoDate(metadata.date)
    : ''

  return (
    <article className="mx-auto w-full max-w-[920px]">
      {/* MASTHEAD */}
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <div className="flex items-center gap-5">
            <span>SECTION §01 · ARTICLE</span>
            <span className="hidden sm:inline">{minutes} MIN READ</span>
          </div>
          {dateStr && <time>{dateStr}</time>}
        </div>

        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/85">
            {tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}

        <h1
          className="m-0 mt-7 text-[clamp(1.85rem,1.4rem+2vw,3.4rem)] leading-[1.08] tracking-[-0.02em] text-pretty sm:text-balance"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 500,
          }}
        >
          {metadata.title}
        </h1>

        {metadata.description && (
          <p
            className="mt-6 max-w-[58ch] text-[clamp(1.05rem,1rem+0.45vw,1.3rem)] leading-[1.55] tracking-[-0.005em] text-muted-foreground"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
            }}
          >
            {metadata.description}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>BYLINE · MCELL</span>
          <CopyPageButton pageContent={rawContent} bodyContent={content} />
        </div>
      </header>

      {/* Content */}
      <div className="mt-14 sm:mt-16">
        <MarkdownRenderer content={content} />
      </div>

      <hr className="section-divider" />

      {/* Comments */}
      <section className="mt-12">
        <div className="mb-6 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
          <h2
            className="m-0 text-[clamp(1.25rem,1.05rem+0.8vw,1.6rem)] tracking-[-0.02em]"
            style={{
              fontFamily: 'var(--font-orbitron), Georgia, serif',
              fontWeight: 700,
            }}
          >
            Discussion
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            留言区
          </span>
        </div>
        <GiscusComments term={discussionTerm} />
      </section>
    </article>
  )
}

'use client'

import React from 'react'
import { BookOpen, MessageCircle } from 'lucide-react'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { DiscussionDrawer, type DiscussionDrawerHandle } from '@/components/common/DiscussionDrawer'
import { CodeWave, type StepContent } from '@/components/interactive/CodeWave'
import { ImageWave, type ImageStepContent } from '@/components/interactive/ImageWave'
import { WebWave, type WebStepContent } from '@/components/interactive/WebWave'
import type { BookMeta, BookChapter } from '@/lib/book-parser'
import type {
  SerializedCodeStep,
  SerializedImageStep,
  SerializedDemoStep,
} from '@/components/interactive/InteractiveTutorialView'

// ─── TOC Drawer ──────────────────────────────────────────────────────────────

function TOCDrawer({
  book,
  currentChapterSlug,
  open,
  onClose,
}: {
  book: BookMeta
  currentChapterSlug: string
  open: boolean
  onClose: () => void
}) {
  const navRef = React.useRef<HTMLElement>(null)

  // Auto-scroll to current chapter when drawer opens
  React.useEffect(() => {
    if (!open) return
    const nav = navRef.current
    if (!nav) return
    requestAnimationFrame(() => {
      const el = nav.querySelector<HTMLElement>(
        `[data-toc-slug="${currentChapterSlug}"]`,
      )
      if (!el) return
      const navRect = nav.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const offset =
        elRect.top - navRect.top - navRect.height / 2 + el.offsetHeight / 2
      nav.scrollBy({ top: offset, behavior: 'instant' as const })
    })
  }, [open, currentChapterSlug])

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Prevent body scroll
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[1400] bg-black/20 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-[1410] h-full w-[560px] max-w-full border-l border-border bg-background shadow-[-8px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-[0.35s] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            全书导航
          </span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            aria-label="关闭目录"
          >
            ✕
          </button>
        </div>

        {/* Scrollable TOC */}
        <nav
          ref={navRef}
          aria-label="章节目录"
          className="h-full overflow-y-auto overscroll-contain px-5 py-5 pb-32"
          style={{ scrollbarWidth: 'none' }}
          data-lenis-prevent
        >
          <div className="mb-4 font-serif text-[1.05em] font-semibold text-foreground">
            {book.title}
          </div>

          {/* Book index — always first */}
          <a
            href={`/books/${book.slug}`}
            onClick={onClose}
            data-toc-slug="__index__"
            className="mb-4 block border-l-[1.5px] border-l-transparent py-[0.3rem] pl-3 text-[0.85em] leading-[1.4] text-muted-foreground transition-all duration-200 hover:border-l-border hover:text-foreground"
          >
            概览与目录
          </a>

          {book.volumes.map((vol) => (
            <div key={vol.number} className="mb-4">
              <div className="mb-0.5 font-serif text-[0.88em] font-semibold text-foreground/80">
                卷 {vol.number}
              </div>

              <div className="flex flex-col">
                {vol.chapters.map((ch) => {
                  const isIntro = ch.chapter === 0
                  const isCurrent = ch.slug === currentChapterSlug
                  return (
                    <a
                      key={ch.slug}
                      data-toc-slug={ch.slug}
                      href={`/books/${book.slug}/${ch.slug}`}
                      onClick={onClose}
                      className={`block border-l-[1.5px] py-[0.3rem] pl-3 text-[0.85em] leading-[1.4] transition-all duration-200 ${
                        isCurrent
                          ? 'border-l-[var(--link-accent)] font-medium text-[var(--link-accent)]'
                          : 'border-l-transparent text-muted-foreground hover:border-l-border hover:text-foreground'
                      } ${
                        isIntro
                          ? 'italic text-[0.8em]'
                          : ''
                      }`}
                    >
                      {isIntro ? `导读：${ch.title}` : ch.title}
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}

// ─── Book index page ─────────────────────────────────────────────────────────

function BookIndex({ book, discussionTerm }: { book: BookMeta; discussionTerm: string }) {
  return (
    <div className="mx-auto w-full max-w-[920px] px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20">
      <header className="mb-12">
        <div className="border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          小书 · BOOK
        </div>
        <h1
          className="m-0 mt-7 text-[clamp(1.85rem,1.4rem+2vw,3.4rem)] leading-[1.08] tracking-[-0.02em] text-pretty sm:text-balance"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 500,
          }}
        >
          {book.title}
        </h1>
        {book.description && (
          <p
            className="mt-5 max-w-[58ch] text-[clamp(1.02rem,1rem+0.45vw,1.25rem)] leading-[1.55] text-muted-foreground"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
            }}
          >
            {book.description}
          </p>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-md border border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] bg-[color:color-mix(in_oklab,var(--muted)_50%,transparent)] px-5 py-3.5">
          <span aria-hidden className="mt-0.5 shrink-0 font-mono text-[11px] text-muted-foreground">※</span>
          <p className="m-0 text-[0.82em] leading-[1.55] text-muted-foreground">
            本书由 mcell 与大语言模型（AI）协作撰写。内容经过人工审校与编辑，但不保证完全准确。阅读时请保持独立思考。
          </p>
        </div>
      </header>

      <div className="rounded-md border border-border bg-card p-6 sm:p-8">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          目录
        </div>
        {book.volumes.map((vol) => (
          <div key={vol.number} className="mb-5">
            <div className="mb-1 font-serif text-[1.05em] font-semibold text-foreground">
              卷 {vol.number}
            </div>
            <div className="flex flex-col">
              {vol.chapters.map((ch) => {
                const isIntro = ch.chapter === 0
                return (
                  <a
                    key={ch.slug}
                    href={`/books/${book.slug}/${ch.slug}`}
                    className={`block border-l-[1.5px] border-l-transparent py-[0.35rem] pl-3 text-[0.9em] leading-[1.45] text-muted-foreground transition-all duration-200 hover:border-l-border hover:text-foreground ${
                      isIntro ? 'italic text-[0.82em]' : ''
                    }`}
                  >
                    {isIntro ? `导读：${ch.title}` : ch.title}
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {book.indexContent.trim() && (
        <div className="mt-12 article-markdown">
          <MarkdownRenderer content={book.indexContent} />
        </div>
      )}

      <DiscussionDrawer discussionTerm={discussionTerm} />
    </div>
  )
}

// ─── Chapter page ────────────────────────────────────────────────────────────

type ChapterStepKind = 'code' | 'image' | 'demo'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStep = any

function groupChapterSteps(
  steps: AnyStep[],
): { kind: ChapterStepKind; steps: AnyStep[] }[] {
  const groups: { kind: ChapterStepKind; steps: AnyStep[] }[] = []
  for (const step of steps) {
    const last = groups[groups.length - 1]
    if (last && last.kind === step.kind) {
      last.steps.push(step)
    } else {
      groups.push({ kind: step.kind, steps: [step] })
    }
  }
  return groups
}

/** Build serialized steps from chapter.steps, merging intro into first step's prose */
function buildChapterSteps(
  chapter: BookChapter,
): (SerializedCodeStep | SerializedImageStep | SerializedDemoStep)[] | null {
  if (!chapter.steps || chapter.steps.length === 0) return null

  const result: (SerializedCodeStep | SerializedImageStep | SerializedDemoStep)[] =
    chapter.steps.map((s) => {
      switch (s.kind) {
        case 'code':
          return {
            kind: 'code',
            code: s.code,
            language: s.language,
            highlightLines: s.highlightLines,
            fileName: s.fileName,
            prose: s.prose,
          } satisfies SerializedCodeStep
        case 'image':
          return {
            kind: 'image',
            src: s.src,
            alt: s.alt,
            prose: s.prose,
          } satisfies SerializedImageStep
        case 'demo':
          return {
            kind: 'demo',
            html: s.html,
            title: s.title,
            height: s.height,
            aspect: s.aspect,
            prose: s.prose,
          } satisfies SerializedDemoStep
      }
    })

  // Merge intro into first step's prose
  if (chapter.intro && result.length > 0) {
    result[0] = { ...result[0], prose: chapter.intro + '\n\n' + result[0].prose }
  }

  return result
}

function InteractiveChapter({
  book,
  chapter,
  prev,
  next,
  discussionTerm,
}: {
  book: BookMeta
  chapter: BookChapter
  prev: BookChapter | null
  next: BookChapter | null
  discussionTerm: string
}) {
  const [tocOpen, setTocOpen] = React.useState(false)
  const discussionRef = React.useRef<DiscussionDrawerHandle>(null)
  const steps = buildChapterSteps(chapter)
  if (!steps) return null
  const groups = groupChapterSteps(steps)

  return (
    <>
      <TOCDrawer
        book={book}
        currentChapterSlug={chapter.slug}
        open={tocOpen}
        onClose={() => setTocOpen(false)}
      />

      {/* Merged floating toolbar */}
      <div className="fixed bottom-6 right-6 z-50 flex overflow-hidden rounded-full border border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] bg-card shadow-[0_2px_16px_rgba(0,0,0,0.07)] sm:bottom-10 sm:right-10">
        <button
          onClick={() => setTocOpen(true)}
          className="flex items-center gap-1.5 bg-transparent px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-foreground transition-all duration-200 hover:bg-[color:color-mix(in_oklab,var(--accent)_5%,transparent)] hover:text-[var(--link-accent)]"
        >
          <BookOpen className="h-[14px] w-[14px] opacity-70" />
          <span className="hidden sm:inline">目录</span>
        </button>
        <span className="my-1.5 w-px bg-[color:color-mix(in_oklab,var(--border)_70%,transparent)]" />
        <button
          onClick={() => discussionRef.current?.open()}
          className="flex items-center gap-1.5 bg-transparent px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground transition-all duration-200 hover:bg-[color:color-mix(in_oklab,var(--accent)_5%,transparent)] hover:text-[var(--link-accent)]"
        >
          <MessageCircle className="h-[14px] w-[14px] opacity-70" />
          <span className="hidden sm:inline">讨论</span>
        </button>
      </div>

      {/* Chapter masthead above the wave content */}
      <div className="mx-auto w-full max-w-[780px] px-6 pt-14 sm:px-10 sm:pt-20">
        <header className="mb-2">
          <div className="border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {book.title} · 卷 {chapter.volume}
          </div>
          <h1
            className="m-0 mt-6 text-[clamp(1.65rem,1.3rem+1.8vw,2.6rem)] leading-[1.12] tracking-[-0.015em] text-pretty sm:text-balance"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 500 }}
          >
            {chapter.title}
          </h1>
        </header>
      </div>

      {/* Interactive wave sections */}
      {groups.map((group, gi) => (
        <div key={gi} className="px-2 sm:px-4 lg:px-6">
          {group.kind === 'code' ? (
            <CodeWave
              steps={(group.steps as SerializedCodeStep[]).map(
                (s): StepContent => ({
                  step: { code: s.code, language: s.language, highlightLines: s.highlightLines, fileName: s.fileName },
                  prose: s.prose,
                }),
              )}
            />
          ) : group.kind === 'image' ? (
            <ImageWave
              steps={(group.steps as SerializedImageStep[]).map(
                (s): ImageStepContent => ({
                  step: { src: s.src, alt: s.alt },
                  prose: s.prose,
                }),
              )}
            />
          ) : (
            <WebWave
              steps={(group.steps as SerializedDemoStep[]).map(
                (s): WebStepContent => ({
                  step: { html: s.html, title: s.title, height: s.height, aspect: s.aspect },
                  prose: s.prose,
                }),
              )}
            />
          )}
        </div>
      ))}

      {/* Bottom nav */}
      <div className="mx-auto w-full max-w-[780px] px-6 pb-20 sm:px-10 sm:pb-28">
        <nav className="flex items-center justify-between border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pt-5 font-mono text-[11px] uppercase tracking-[0.14em]">
          <div>
            {prev ? (
              <a href={`/books/${book.slug}/${prev.slug}`} className="text-muted-foreground transition-colors hover:text-[var(--link-accent)]">
                ← {prev.title}
              </a>
            ) : (
              <a href={`/books/${book.slug}`} className="text-muted-foreground transition-colors hover:text-[var(--link-accent)]">
                ← 目录
              </a>
            )}
          </div>
          <div>
            {next ? (
              <a href={`/books/${book.slug}/${next.slug}`} className="text-muted-foreground transition-colors hover:text-[var(--link-accent)]">
                {next.title} →
              </a>
            ) : (
              <span className="text-muted-foreground/30">完</span>
            )}
          </div>
        </nav>
      </div>

      <DiscussionDrawer ref={discussionRef} discussionTerm={discussionTerm} hideTrigger />
    </>
  )
}

function ChapterPage({
  book,
  chapter,
  prev,
  next,
  discussionTerm,
}: {
  book: BookMeta
  chapter: BookChapter
  prev: BookChapter | null
  next: BookChapter | null
  discussionTerm: string
}) {
  const [tocOpen, setTocOpen] = React.useState(false)
  const discussionRef = React.useRef<DiscussionDrawerHandle>(null)

  // If chapter has interactive steps, render the interactive view
  if (chapter.steps && chapter.steps.length > 0) {
    return (
      <InteractiveChapter book={book} chapter={chapter} prev={prev} next={next} discussionTerm={discussionTerm} />
    )
  }

  return (
    <>
      {/* TOC Drawer */}
      <TOCDrawer
        book={book}
        currentChapterSlug={chapter.slug}
        open={tocOpen}
        onClose={() => setTocOpen(false)}
      />

      {/* Merged floating toolbar */}
      <div className="fixed bottom-6 right-6 z-50 flex overflow-hidden rounded-full border border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] bg-card shadow-[0_2px_16px_rgba(0,0,0,0.07)] sm:bottom-10 sm:right-10">
        <button
          onClick={() => setTocOpen(true)}
          className="flex items-center gap-1.5 bg-transparent px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-foreground transition-all duration-200 hover:bg-[color:color-mix(in_oklab,var(--accent)_5%,transparent)] hover:text-[var(--link-accent)]"
        >
          <BookOpen className="h-[14px] w-[14px] opacity-70" />
          <span className="hidden sm:inline">目录</span>
        </button>
        <span className="my-1.5 w-px bg-[color:color-mix(in_oklab,var(--border)_70%,transparent)]" />
        <button
          onClick={() => discussionRef.current?.open()}
          className="flex items-center gap-1.5 bg-transparent px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground transition-all duration-200 hover:bg-[color:color-mix(in_oklab,var(--accent)_5%,transparent)] hover:text-[var(--link-accent)]"
        >
          <MessageCircle className="h-[14px] w-[14px] opacity-70" />
          <span className="hidden sm:inline">讨论</span>
        </button>
      </div>

      {/* Full-width content */}
      <main>
        <div className="mx-auto w-full max-w-[780px] px-6 pb-20 pt-14 sm:px-10 sm:pb-28 sm:pt-20">
          <header className="mb-10">
            <div className="border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {book.title} · 卷 {chapter.volume}
            </div>
            <h1
              className="m-0 mt-6 text-[clamp(1.65rem,1.3rem+1.8vw,2.6rem)] leading-[1.12] tracking-[-0.015em] text-pretty sm:text-balance"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 500 }}
            >
              {chapter.title}
            </h1>
          </header>

          <div className="article-markdown">
            <MarkdownRenderer content={chapter.content} />
          </div>

          <nav className="mt-14 flex items-center justify-between border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pt-5 font-mono text-[11px] uppercase tracking-[0.14em]">
            <div>
              {prev ? (
                <a href={`/books/${book.slug}/${prev.slug}`} className="text-muted-foreground transition-colors hover:text-[var(--link-accent)]">
                  ← {prev.title}
                </a>
              ) : (
                <a href={`/books/${book.slug}`} className="text-muted-foreground transition-colors hover:text-[var(--link-accent)]">
                  ← 目录
                </a>
              )}
            </div>
            <div>
              {next ? (
                <a href={`/books/${book.slug}/${next.slug}`} className="text-muted-foreground transition-colors hover:text-[var(--link-accent)]">
                  {next.title} →
                </a>
              ) : (
                <span className="text-muted-foreground/30">完</span>
              )}
            </div>
          </nav>
        </div>
      </main>

      <DiscussionDrawer ref={discussionRef} discussionTerm={discussionTerm} hideTrigger />
    </>
  )
}

// ─── Main exported component ─────────────────────────────────────────────────

interface BookViewProps {
  book: BookMeta
  chapter?: BookChapter
  prevChapter?: BookChapter | null
  nextChapter?: BookChapter | null
  discussionTerm: string
}

export function BookView({
  book,
  chapter,
  prevChapter,
  nextChapter,
  discussionTerm,
}: BookViewProps) {
  if (!chapter) {
    return <BookIndex book={book} discussionTerm={discussionTerm} />
  }

  return (
    <ChapterPage
      book={book}
      chapter={chapter}
      prev={prevChapter ?? null}
      next={nextChapter ?? null}
      discussionTerm={discussionTerm}
    />
  )
}

import { getAllBooks } from '@/lib/book-parser'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import { createBreadcrumbJsonLd } from '@/lib/structured-data'
import Link from 'next/link'

export const metadata: Metadata = buildPageMetadata({
  title: '小书',
  description: '书房一角。深度阅读，系统学习。由 mcell 与 AI 协作撰写。',
  path: '/books',
})

export default function BooksPage() {
  const books = getAllBooks()

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '小书', path: '/books' },
  ])

  return (
    <div className="relative">
      <JsonLd id="books-breadcrumb" data={breadcrumbJsonLd} />

      <div className="mx-auto w-full max-w-[960px] px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            § BOOKSHELF
          </div>
          <h1
            className="m-0 text-[clamp(2rem,1.6rem+2.2vw,3rem)] leading-[1.12] tracking-[-0.02em]"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 500,
            }}
          >
            小书
          </h1>
          <p
            className="mx-auto mt-3 max-w-[48ch] text-[clamp(1rem,1rem+0.3vw,1.15rem)] leading-[1.5] text-muted-foreground"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
            }}
          >
            书房一角。深度阅读，系统学习。
          </p>

          {/* AI co-writing disclaimer */}
          <div className="mx-auto mt-6 flex max-w-[520px] items-start gap-3 rounded-md border border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] bg-[color:color-mix(in_oklab,var(--muted)_50%,transparent)] px-5 py-3.5 text-left">
            <span
              aria-hidden
              className="mt-0.5 shrink-0 font-mono text-[11px] text-muted-foreground"
            >
              ※
            </span>
            <p className="m-0 text-[0.82em] leading-[1.55] text-muted-foreground">
              本栏目的书籍由{' '}
              <span className="font-medium text-foreground">mcell</span>{' '}
              与{' '}
              <span className="font-medium text-foreground">
                大语言模型（AI）
              </span>{' '}
              协作撰写。内容经过人工审校与编辑，但不保证完全准确。阅读时请保持独立思考。
            </p>
          </div>
        </header>

        {/* Shelf */}
        {books.length > 0 ? (
          <div className="mb-10">
            <div className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
              书架一
            </div>
            <div className="flex flex-wrap items-end gap-5 border-b-[6px] px-3 pb-6"
              style={{
                borderBottomColor: 'oklch(0.62 0.06 70)',
              }}
            >
              {books.map((book, i) => {
                const spineColors = [
                  'oklch(0.55 0.05 70)',
                  'oklch(0.48 0.06 250)',
                  'oklch(0.42 0.05 290)',
                  'oklch(0.52 0.04 150)',
                ]
                const spineColor = spineColors[i % spineColors.length]

                const totalChapters = book.volumes.reduce(
                  (sum, v) => sum + v.chapters.filter((c) => c.chapter > 0).length,
                  0,
                )

                return (
                  <Link
                    key={book.slug}
                    href={`/books/${book.slug}`}
                    className="group relative flex w-[220px] flex-col rounded-[3px_6px_6px_3px] border border-border bg-card transition-all duration-[0.35s] ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1.5 hover:border-[var(--link-accent)] max-sm:w-[160px]"
                    style={{
                      minHeight: 280,
                      boxShadow:
                        '0 1px 0 rgba(0,0,0,0.04), 2px 3px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* Spine */}
                    <span
                      className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-sm transition-all duration-[0.35s] group-hover:w-2"
                      style={{ backgroundColor: spineColor }}
                    />

                    {/* Cover content */}
                    <div className="flex flex-1 flex-col py-[1.35rem] pr-5 pl-7">
                      <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
                        {book.volumes.length} 卷 · {totalChapters} 章
                      </div>
                      <div
                        className="mb-2 text-[1.15em] leading-[1.3] tracking-[-0.01em] text-foreground"
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontWeight: 600,
                        }}
                      >
                        {book.title}
                      </div>
                      {book.description && (
                        <div className="line-clamp-3 text-[0.82em] leading-[1.45] text-muted-foreground">
                          {book.description}
                        </div>
                      )}
                      <div className="mt-auto border-t border-border pt-3 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
                        {totalChapters} 章
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="py-16 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            暂无书籍
          </p>
        )}

        {/* Empty shelf — visual promise of more to come */}
        <div className="mb-10">
          <div className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
            书架二
          </div>
          <div className="border-b-[6px] px-3 pb-6"
            style={{ borderBottomColor: 'oklch(0.62 0.06 70)' }}
          >
            <p className="px-1 font-mono text-[9px] uppercase italic tracking-[0.18em] text-muted-foreground/35">
              空书架 · 等待新书
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

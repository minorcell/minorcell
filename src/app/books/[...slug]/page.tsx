import { notFound } from 'next/navigation'
import { getAllBooks, getBookBySlug, getBookChapter, getAdjacentChapters } from '@/lib/book-parser'
import type { BookMeta, BookChapter } from '@/lib/book-parser'
import { BookView } from '@/lib/content-renderer'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import { createArticleJsonLd, createBreadcrumbJsonLd } from '@/lib/structured-data'

interface Props {
  params: Promise<{ slug: string[] }>
}

export async function generateStaticParams() {
  const books = getAllBooks()
  const params: { slug: string[] }[] = []

  for (const book of books) {
    params.push({ slug: [book.slug] })
    for (const vol of book.volumes) {
      for (const ch of vol.chapters) {
        params.push({ slug: [book.slug, ch.slug] })
      }
    }
  }

  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [bookSlug, chapterSlug] = slug

  const book = getBookBySlug(bookSlug)
  if (!book) {
    return buildPageMetadata({
      title: '书籍不存在',
      description: '请求的书籍不存在或已删除。',
      path: `/books/${bookSlug}`,
      noIndex: true,
    })
  }

  if (!chapterSlug) {
    return buildPageMetadata({
      title: `${book.title} — 小书`,
      description: book.description ?? '',
      path: `/books/${bookSlug}`,
    })
  }

  const chapter = getBookChapter(bookSlug, chapterSlug)
  if (!chapter) {
    return buildPageMetadata({
      title: '章节不存在',
      description: '请求的章节不存在。',
      path: `/books/${bookSlug}/${chapterSlug}`,
      noIndex: true,
    })
  }

  return buildPageMetadata({
    title: `${chapter.title} — ${book.title}`,
    description: (chapter.description || book.description) ?? '',
    path: `/books/${bookSlug}/${chapterSlug}`,
  })
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params
  const [bookSlug, chapterSlug] = slug

  const book = getBookBySlug(bookSlug)
  if (!book) notFound()

  let chapter: BookChapter | undefined
  let prevChapter: BookChapter | null = null
  let nextChapter: BookChapter | null = null

  if (chapterSlug) {
    chapter = getBookChapter(bookSlug, chapterSlug) ?? undefined
    if (!chapter) notFound()

    const { prev, next } = getAdjacentChapters(book, chapterSlug)
    prevChapter = prev
    nextChapter = next
  }

  const pagePath = chapterSlug
    ? `/books/${bookSlug}/${chapterSlug}`
    : `/books/${bookSlug}`

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '小书', path: '/books' },
    { name: book.title, path: `/books/${bookSlug}` },
    ...(chapter ? [{ name: chapter.title, path: pagePath }] : []),
  ])

  const articleJsonLd = createArticleJsonLd({
    type: 'TechArticle',
    title: chapter ? chapter.title : book.title,
    description: (chapter?.description || book.description) ?? '',
    path: pagePath,
    section: 'Books',
    keywords: chapter
      ? [book.title, chapter.title, '技术书籍']
      : [book.title, '小书', '技术书籍'],
  })

  return (
    <div>
      <JsonLd id={`book-breadcrumb-${bookSlug}`} data={breadcrumbJsonLd} />
      <JsonLd id={`book-article-${bookSlug}`} data={articleJsonLd} />
      <BookView
        book={book}
        chapter={chapter}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        discussionTerm={`books/${bookSlug}${chapterSlug ? `/${chapterSlug}` : ''}`}
      />
    </div>
  )
}

import { CopyPageButton } from '@/components/common/CopyPageButton'
import { DiscussionDrawer } from '@/components/common/DiscussionDrawer'
import { ReadingProgress } from '@/components/common/ReadingProgress'
import { TableOfContents } from '@/components/common/TableOfContents'
import { TransitionLink } from '@/components/effects/PageTransition'
import type { ArticleContent } from '@/lib/content-parser'
import { getContentHref } from '@/lib/content-parser'
import { renderMarkdown } from '@/lib/content-renderer/markdown'
import { siteAuthor } from '@/lib/seo'

function formatDate(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

function readingMinutes(text: string) {
  const chineseCharacters = (text.match(/[一-龥]/g) || []).length
  const englishWords = text
    .replace(/[一-龥]/g, '')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(chineseCharacters / 400 + englishWords / 220))
}

interface ArticleViewProps {
  article: ArticleContent
  discussionTerm: string
  related?: ArticleContent[]
}

export async function ArticleView({
  article,
  discussionTerm,
  related = [],
}: ArticleViewProps) {
  const { metadata, content } = article
  const { node: renderedContent, headings } = await renderMarkdown(
    content,
    metadata.title,
  )
  const minutes = readingMinutes(content)
  const updatedTime = metadata.updated
  const publishedTime = metadata.date
  const showUpdated =
    !!updatedTime &&
    (!publishedTime ||
      new Date(updatedTime).getTime() > new Date(publishedTime).getTime())
  const searchTerms = [
    ...(metadata.keywords ?? []),
    ...(metadata.tags ?? []),
  ].filter(
    (term): term is string =>
      typeof term === 'string' && term.trim().length > 0,
  )

  return (
    <>
      <ReadingProgress />
      <div className="flex justify-center">
        <article className="w-full max-w-[780px]" data-pagefind-body>
          <header className="relative pt-8 sm:pt-14">
            <div className="sm:pr-14">
              <h1 className="type-article-title m-0">{metadata.title}</h1>

              {searchTerms.length > 0 ? (
                <span className="sr-only" data-pagefind-weight="10">
                  关键词：{searchTerms.join('、')}
                </span>
              ) : null}

              {metadata.description ? (
                <p className="type-article-deck mb-0 mt-5 max-w-[58ch] text-muted-foreground">
                  {metadata.description}
                </p>
              ) : null}

              <div className="type-caption mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                <TransitionLink
                  href={siteAuthor.aboutPath}
                  className="font-medium text-foreground underline-offset-4 transition-colors hover:text-link-accent hover:underline"
                >
                  {siteAuthor.name}
                </TransitionLink>
                {metadata.date ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <time dateTime={metadata.date}>
                      {formatDate(metadata.date)}
                    </time>
                  </>
                ) : null}
                {showUpdated && updatedTime ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      更新于{' '}
                      <time dateTime={updatedTime}>
                        {formatDate(updatedTime)}
                      </time>
                    </span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{minutes} 分钟阅读</span>
              </div>
            </div>

            <CopyPageButton
              content={content}
              className="mt-5 sm:absolute sm:right-0 sm:top-14 sm:mt-0"
            />
          </header>

          <div className="mt-12 sm:mt-16">
            <div className="article-markdown">{renderedContent}</div>
          </div>

          {related.length > 0 ? (
            <section
              className="mt-16 border-t border-border pt-8"
              aria-labelledby="related-posts"
              data-pagefind-ignore
            >
              <h2 id="related-posts" className="type-section-title m-0">
                相关阅读
              </h2>
              <ul className="m-0 mt-4 list-none space-y-1 p-0">
                {related.map((item) => (
                  <li key={item.slug}>
                    <TransitionLink
                      href={getContentHref(item)}
                      className="-mx-3 flex flex-col gap-1 rounded-lg px-3 py-3 transition-colors duration-200 ease-out hover:bg-surface-hover motion-reduce:transition-none"
                    >
                      <span className="type-headline text-foreground">
                        {item.metadata.title}
                      </span>
                      {item.metadata.description ? (
                        <span className="type-meta line-clamp-1 text-muted-foreground">
                          {item.metadata.description}
                        </span>
                      ) : null}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <DiscussionDrawer discussionTerm={discussionTerm} />
        </article>

        <TableOfContents headings={headings} />
      </div>
    </>
  )
}

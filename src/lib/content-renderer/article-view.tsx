import { CopyPageButton } from '@/components/common/CopyPageButton'
import { DiscussionDrawer } from '@/components/common/DiscussionDrawer'
import { TableOfContents } from '@/components/common/TableOfContents'
import type { ArticleContent } from '@/lib/content-parser'
import { renderMarkdown } from '@/lib/content-renderer/markdown'

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
}

export async function ArticleView({
  article,
  discussionTerm,
}: ArticleViewProps) {
  const { metadata, content } = article
  const { node: renderedContent, headings } = await renderMarkdown(content)
  const minutes = readingMinutes(content)

  return (
    <div className="flex justify-center">
      <article className="w-full max-w-[780px]">
        <header className="relative pt-8 sm:pt-14">
          <div className="sm:pr-14">
            <h1 className="type-article-title m-0">{metadata.title}</h1>

            {metadata.description ? (
              <p className="type-article-deck mb-0 mt-5 max-w-[58ch] text-muted-foreground">
                {metadata.description}
              </p>
            ) : null}

            <div className="type-caption mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
              {metadata.date ? <time>{formatDate(metadata.date)}</time> : null}
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

        <DiscussionDrawer discussionTerm={discussionTerm} />
      </article>

      <TableOfContents headings={headings} />
    </div>
  )
}

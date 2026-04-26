import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const root = process.cwd()
const topicsDir = path.join(root, 'content', 'topics')

export interface TopicArticle {
  slug: string
  title: string
  description?: string
  date?: string
  order?: number
}

export interface Topic {
  slug: string
  title: string
  description: string
  articles: TopicArticle[]
}

interface TopicIndexMetadata {
  title: string
  description: string
}

interface TopicArticleMetadata {
  title: string
  description?: string
  date?: string
  order?: number
}

/**
 * 读取专题配置：从 content.md 读取元信息
 */
function readTopicIndex(topicSlug: string): Topic | null {
  const contentPath = path.join(topicsDir, topicSlug, 'content.md')

  if (!fs.existsSync(contentPath)) return null

  try {
    const fileContents = fs.readFileSync(contentPath, 'utf8')
    const parsed = matter(fileContents)
    const metadata = parsed.data as TopicIndexMetadata

    return {
      slug: topicSlug,
      title: metadata.title || topicSlug,
      description: metadata.description || '',
      articles: readTopicArticles(topicSlug),
    }
  } catch (error) {
    console.error(`Error reading topic index for ${topicSlug}:`, error)
    return null
  }
}

const EXCLUDED_FILES = new Set(['index.md', 'content.md'])

function readTopicArticles(topicSlug: string): TopicArticle[] {
  const topicPath = path.join(topicsDir, topicSlug)
  if (!fs.existsSync(topicPath)) return []

  const files = fs.readdirSync(topicPath).filter((f) => {
    return f.endsWith('.md') && !EXCLUDED_FILES.has(f)
  })

  const articles: TopicArticle[] = files
    .map((file) => {
      const slug = file.replace(/\.md$/, '')
      try {
        const content = fs.readFileSync(path.join(topicPath, file), 'utf8')
        const { data } = matter(content)
        const meta = data as TopicArticleMetadata
        return {
          slug,
          title: meta.title || slug,
          description: meta.description,
          date: meta.date ? String(meta.date) : undefined,
          order: meta.order,
        }
      } catch {
        return { slug, title: slug }
      }
    })
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined)
        return a.order - b.order
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return (a.date ?? '').localeCompare(b.date ?? '')
    })

  return articles
}

/**
 * 获取所有专题
 */
export function getAllTopics(): Topic[] {
  if (!fs.existsSync(topicsDir)) {
    return []
  }

  const topicFolders = fs.readdirSync(topicsDir).filter((item) => {
    const fullPath = path.join(topicsDir, item)
    return fs.statSync(fullPath).isDirectory()
  })

  const topics: Topic[] = []

  for (const folder of topicFolders) {
    const topic = readTopicIndex(folder)
    if (topic) {
      topics.push(topic)
    }
  }

  return topics
}

/**
 * 获取单个专题
 */
export function getTopic(slug: string): Topic | undefined {
  return readTopicIndex(slug) || undefined
}

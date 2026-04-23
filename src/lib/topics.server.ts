import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const root = process.cwd()
const topicsDir = path.join(root, 'content', 'topics')

export interface Topic {
  slug: string
  title: string
  description: string
}

interface TopicIndexMetadata {
  title: string
  description: string
}

/**
 * 读取专题的 index.md 文件获取专题配置
 */
function readTopicIndex(topicSlug: string): Topic | null {
  const indexPath = path.join(topicsDir, topicSlug, 'index.md')

  if (!fs.existsSync(indexPath)) {
    return null
  }

  try {
    const fileContents = fs.readFileSync(indexPath, 'utf8')
    const parsed = matter(fileContents)
    const metadata = parsed.data as TopicIndexMetadata

    return {
      slug: topicSlug,
      title: metadata.title || topicSlug,
      description: metadata.description || '',
    }
  } catch (error) {
    console.error(`Error reading topic index for ${topicSlug}:`, error)
    return null
  }
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

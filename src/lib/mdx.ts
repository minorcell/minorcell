import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const root = process.cwd()
const contentDir = path.join(root, 'content')

export type PostType = 'blog' | 'topics'

export interface PostMetadata {
  title: string
  date: string
  slug: string
  image?: string
  description?: string
  order?: number
  topicSlug?: string
  [key: string]: unknown
}

/**
 * Read topicSlug from a blog post's metadata. When present, the post is treated
 * as a stub that should redirect (or link directly) to the matching interactive
 * topic at /topics/<topicSlug>.
 */
export function getTopicSlug(metadata: PostMetadata): string | undefined {
  const value = metadata.topicSlug
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export interface Post {
  metadata: PostMetadata
  content: string
  rawContent: string
  slug: string
}

export function getPostSlugs(type: PostType) {
  const dir = path.join(contentDir, type)
  if (!fs.existsSync(dir)) return []

  const files: string[] = []

  function traverse(currentDir: string) {
    const items = fs.readdirSync(currentDir)
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        traverse(fullPath)
      } else if (/\.mdx?$/.test(item)) {
        // Create relative path from type dir
        const relativePath = path.relative(dir, fullPath)
        files.push(relativePath)
      }
    }
  }

  traverse(dir)
  return files
}

export function getPostBySlug(type: PostType, slug: string): Post {
  // Slug might contain slashes if it was nested, but here we usually flatten or handle it.
  // However, the current implementation of [slug] page assumes a single segment slug.
  // If we want to support nested routes like /blog/2025/foo, we need [...slug].
  // For now, let's assume we want to flatten them or just find the file by name?
  // Or better, let's update [slug] to [...slug] if we want to keep the structure.
  // BUT, the user's existing structure is `blog/2025/foo.md`.
  // If I return `2025/foo.md` as slug, the URL will be `/blog/2025%2Ffoo`.
  // That's ugly.
  // If I want `/blog/foo`, I need to handle collisions.
  // Let's assume we want to support the path as is.
  // So I should change `[slug]` to `[...slug]`.

  // For now, I will implement a simple recursive search that returns the RELATIVE path as the slug.
  // And I will update the page to use `[...slug]`.

  const dir = path.join(contentDir, type)
  const realSlug = slug.replace(/\.mdx?$/, '')

  // Try to find the file. slug could be "2025/foo"
  let fullPath = path.join(dir, `${realSlug}.md`)
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(dir, `${realSlug}.mdx`)
  }

  if (!fs.existsSync(fullPath)) {
    // Fallback: maybe the slug is just the filename "foo" and it's inside some folder?
    // This is expensive to search. Let's stick to path-based slugs.
    throw new Error(`Post not found: ${slug}`)
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const parsed = matter(fileContents)
  const data = parsed.data as {
    title?: string
    date?: string | Date
    image?: string
    description?: string
    order?: number
    [key: string]: unknown
  }
  const content = parsed.content

  // Extract first image from content if not provided in frontmatter
  let image = data.image
  if (!image) {
    const imageMatch = content.match(/!\[.*?\]\((.*?)\)/)
    if (imageMatch) {
      image = imageMatch[1]
    }
  }

  return {
    slug: realSlug,
    metadata: {
      ...data,
      slug: realSlug,
      title: data.title || path.basename(realSlug),
      date: data.date
        ? new Date(data.date).toISOString()
        : new Date().toISOString(),
      image,
    },
    content,
    rawContent: fileContents,
  }
}

export function getAllPosts(type: PostType): Post[] {
  const slugs = getPostSlugs(type)
  const posts = slugs
    .map((slug) => getPostBySlug(type, slug))
    .sort((post1, post2) => (post1.slug > post2.slug ? -1 : 1))
  return posts
}

import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import { parseGitHubSnapshot } from '@/lib/github-profile'
import type { GitHubSnapshot } from '@/lib/github-profile'
import GitHubProfile from './github-profile'

export const metadata: Metadata = buildPageMetadata({
  title: '关于',
  description:
    'minorcell 的 GitHub 公开档案：开源仓库、收到的 Star、贡献记录和仓库语言统计。',
  path: '/about',
  keywords: ['GitHub', '开源项目', 'minorcell'],
})

export default async function AboutPage() {
  const development = process.env.NODE_ENV === 'development'
  let localSnapshot: GitHubSnapshot | null = null
  if (development) {
    const { readFile } = await import('node:fs/promises')
    const { resolve } = await import('node:path')
    try {
      localSnapshot = parseGitHubSnapshot(
        JSON.parse(
          await readFile(
            resolve(process.cwd(), 'content/site/github.local.json'),
            'utf8',
          ),
        ),
      )
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      console.warn(
        'Local GitHub snapshot missing. Run pnpm github:sync to generate it.',
      )
    }
  }
  return (
    <GitHubProfile
      key={localSnapshot?.fetchedAt ?? 'remote'}
      development={development}
      localSnapshot={localSnapshot}
    />
  )
}

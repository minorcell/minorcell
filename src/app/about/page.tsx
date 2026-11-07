import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import { parseGitHubSnapshot } from '@/lib/github-profile'
import type { GitHubSnapshot } from '@/lib/github-profile'
import { AboutIdentity } from './identity'
import GitHubProfile from './github-profile'

export const metadata: Metadata = buildPageMetadata({
  title: '关于',
  description:
    'minorcell，在上海做产品架构师和 FDE。这里是公开档案、开源仓库、贡献记录，以及 Bilibili 和掘金。',
  path: '/about',
  keywords: ['GitHub', '开源项目', 'minorcell', '上海', '产品架构师', 'FDE'],
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
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 sm:px-8 sm:pb-24 lg:px-10">
      <AboutIdentity />
      <GitHubProfile
        key={localSnapshot?.fetchedAt ?? 'remote'}
        development={development}
        localSnapshot={localSnapshot}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Giscus from '@giscus/react'
import { cn } from '@/lib/utils'

interface Props {
  term: string
  className?: string
}

export function GiscusComments({ term, className }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement

    const syncTheme = () => {
      setTheme(root.classList.contains('dark') ? 'dark' : 'light')
    }

    syncTheme()

    const observer = new MutationObserver(() => {
      syncTheme()
    })

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className={cn(className)}>
      <Giscus
        key={`${term}-${theme}`}
        id="giscus-comments"
        repo="minorcell/cellstack"
        repoId="R_kgDOPdW_4w"
        category="General"
        categoryId="DIC_kwDOPdW_484CuOIM"
        mapping="specific"
        term={term}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={theme}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  )
}

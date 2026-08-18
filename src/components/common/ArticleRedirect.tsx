'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ArticleRedirectProps {
  href: string
}

/**
 * Countdown redirect for articles that moved to a new slug. The parent server
 * component renders a meta-refresh fallback for no-JS visitors; this component
 * shows the visible countdown and performs the client-side jump.
 */
export function ArticleRedirect({ href }: ArticleRedirectProps) {
  const router = useRouter()
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count <= 0) {
      router.replace(href)
      return
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [count, router, href])

  return (
    <span className="font-medium text-foreground" aria-live="polite">
      {count}
    </span>
  )
}

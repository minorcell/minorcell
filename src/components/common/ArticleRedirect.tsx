'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ArticleRedirectProps {
  href: string
}

/**
 * Client-side redirect for articles that moved to a new slug. Renders nothing;
 * the visible fallback UI lives in the parent server component so users still
 * have a clear link if JS is disabled or the redirect is intercepted.
 */
export function ArticleRedirect({ href }: ArticleRedirectProps) {
  const router = useRouter()

  useEffect(() => {
    router.replace(href)
  }, [router, href])

  return null
}

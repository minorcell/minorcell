'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TopicRedirectProps {
  topicHref: string
}

/**
 * Client-side redirect for blog posts that defer their content to an
 * interactive topic. Renders nothing; the visible CTA lives in the parent
 * server component so users still have a clear fallback if JS is disabled or
 * the redirect is intercepted.
 */
export function TopicRedirect({ topicHref }: TopicRedirectProps) {
  const router = useRouter()

  useEffect(() => {
    router.replace(topicHref)
  }, [router, topicHref])

  return null
}

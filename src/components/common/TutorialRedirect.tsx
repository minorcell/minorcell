'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TutorialRedirectProps {
  tutorialHref: string
}

/**
 * Client-side redirect for stub articles that defer their content to an
 * interactive tutorial. Renders nothing; the visible CTA lives in the parent
 * server component so users still have a clear fallback if JS is disabled or
 * the redirect is intercepted.
 */
export function TutorialRedirect({ tutorialHref }: TutorialRedirectProps) {
  const router = useRouter()

  useEffect(() => {
    router.replace(tutorialHref)
  }, [router, tutorialHref])

  return null
}

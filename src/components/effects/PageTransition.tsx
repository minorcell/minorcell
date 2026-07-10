'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react'

interface PageTransitionContextValue {
  startTransition: (path: string) => void
  phase: 'idle'
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
  startTransition: () => {},
  phase: 'idle',
})

export function usePageTransition() {
  return useContext(PageTransitionContext)
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const startTransition = useCallback(
    (path: string) => {
      router.push(path)
    },
    [router],
  )

  return (
    <PageTransitionContext.Provider value={{ startTransition, phase: 'idle' }}>
      {children}
    </PageTransitionContext.Provider>
  )
}

type TransitionLinkProps = ComponentProps<typeof Link>

export function TransitionLink({
  href,
  replace,
  scroll,
  prefetch = true,
  children,
  ...props
}: TransitionLinkProps) {
  const hrefString = typeof href === 'string' ? href : ''
  const useNativeAnchor =
    hrefString.startsWith('http') ||
    hrefString.startsWith('//') ||
    hrefString.startsWith('#') ||
    hrefString.endsWith('.xml') ||
    hrefString.endsWith('.rss') ||
    hrefString.startsWith('/feed')

  if (useNativeAnchor) {
    return (
      <a href={hrefString} {...props}>
        {children}
      </a>
    )
  }

  return (
    <Link
      href={href}
      replace={replace}
      scroll={scroll}
      prefetch={prefetch}
      {...props}
    >
      {children}
    </Link>
  )
}

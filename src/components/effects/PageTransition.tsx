import Link from 'next/link'
import type { ComponentProps } from 'react'

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

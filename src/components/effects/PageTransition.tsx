import Link from 'next/link'
import type { ComponentProps } from 'react'

type TransitionLinkProps = ComponentProps<typeof Link>

export function TransitionLink({
  href,
  replace,
  scroll,
  // Keep Next's default "auto" prefetch strategy. `prefetch={true}` selects
  // the "full" strategy, which fetches the page URL itself (`/path?_rsc=…`)
  // instead of the exported `/path.txt` RSC payload. On a static host like
  // GitHub Pages that request is answered with the HTML document, which
  // poisons the client segment cache and makes later link clicks silently do
  // nothing. The "auto" strategy uses the per-segment `.txt` files that
  // `output: "export"` actually emits. See vercel/next.js#85374.
  prefetch = null,
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

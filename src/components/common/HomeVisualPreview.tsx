'use client'

import { useEffect, useState } from 'react'
import InfiniteMenu, {
  type InfiniteMenuItem,
} from '@/components/effects/reactbits/InfiniteMenu'

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'

interface HomeVisualPreviewProps {
  items: InfiniteMenuItem[]
}

export function HomeVisualPreview({ items }: HomeVisualPreviewProps) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches
      : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches)
    }

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange)
    } else {
      media.addListener(onChange)
    }

    return () => {
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', onChange)
      } else {
        media.removeListener(onChange)
      }
    }
  }, [])

  if (!isDesktop || items.length === 0) {
    return null
  }

  return (
    <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 overflow-hidden">
      <div className="relative h-[420px] px-2 sm:h-[520px] sm:px-4 md:h-[600px]">
        <InfiniteMenu items={items} scale={0.62} />
      </div>
    </div>
  )
}

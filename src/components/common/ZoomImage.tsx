'use client'

import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ZoomImageProps = ImgHTMLAttributes<HTMLImageElement>

export function ZoomImage(props: ZoomImageProps) {
  const { alt, className, ...rest } = props
  return (
    <Zoom>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...rest}
        alt={alt ?? ''}
        loading={rest.loading ?? 'lazy'}
        decoding={rest.decoding ?? 'async'}
        className={cn(
          'h-auto w-full rounded-lg object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10',
          className,
        )}
      />
    </Zoom>
  )
}

'use client'

import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import type { ImgHTMLAttributes } from 'react'

type ZoomImageProps = ImgHTMLAttributes<HTMLImageElement>

export function ZoomImage(props: ZoomImageProps) {
  const { alt, ...rest } = props
  return (
    <Zoom>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...rest}
        alt={alt ?? ''}
        className="rounded-lg w-full h-auto object-cover"
      />
    </Zoom>
  )
}

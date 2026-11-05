import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ContentImageProps = ImgHTMLAttributes<HTMLImageElement>

export function ContentImage(props: ContentImageProps) {
  const { alt, className, ...rest } = props
  return (
    // eslint-disable-next-line @next/next/no-img-element
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
  )
}

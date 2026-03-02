'use client'

import Link from 'next/link'
import CardSwap, { Card } from '@/components/effects/reactbits/CardSwap'

interface HomePostCardSwapItem {
  slug: string
  title: string
  date: string
  description?: string
}

interface HomePostCardSwapProps {
  items: HomePostCardSwapItem[]
}

const formatDate = (value: string) => {
  const date = new Date(value)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m}.${d}`
}

export default function HomePostCardSwap({ items }: HomePostCardSwapProps) {
  const cards = items.slice(0, 4)
  if (cards.length < 2) return null

  return (
    <div className="relative h-[280px] w-full">
      <CardSwap
        width={240}
        height={140}
        cardDistance={20}
        verticalDistance={20}
        delay={4200}
        skewAmount={2}
        easing="linear"
        pauseOnHover
        className="left-1/2! right-auto! top-1/2! bottom-auto! -translate-x-1/2! -translate-y-1/2! max-[768px]:scale-90! max-[768px]:translate-x-[-50%]!max-[768px]:translate-y-[-50%]! max-[480px]:scale-75!"
      >
        {cards.map((item) => (
          <Card
            key={item.slug}
            customClass="!border-border/60 !bg-background/85 shadow-sm"
          >
            <Link
              href={`/blog/${item.slug}`}
              className="flex h-full w-full flex-col justify-between p-4 hover:opacity-100"
            >
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Recent
                </p>
                <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground/80">
                    {item.description}
                  </p>
                )}
              </div>
              <time className="text-xs text-muted-foreground">
                {formatDate(item.date)}
              </time>
            </Link>
          </Card>
        ))}
      </CardSwap>
    </div>
  )
}

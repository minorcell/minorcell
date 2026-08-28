'use client'

import { useScroll } from 'framer-motion'
import { MotionProgress } from '@/components/effects/MotionPrimitives'

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-progress h-0.5 bg-transparent"
    >
      <MotionProgress value={scrollYProgress} />
    </div>
  )
}

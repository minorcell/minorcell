'use client'

import { ReactLenis } from 'lenis/react'
import type { ReactNode } from 'react'

export function ScrollDamping({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: 0.9,
        touchMultiplier: 0.7,
      }}
    >
      {children}
    </ReactLenis>
  )
}

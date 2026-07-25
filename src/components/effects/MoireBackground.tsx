'use client'

import { useEffect, useRef } from 'react'

const DESKTOP_QUERY = '(min-width: 768px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const FRAME_INTERVAL = 1000 / 30
const INTENSITY = 0.58

interface MoireColors {
  primary: string
  secondary: string
}

export function MoireBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasNode = canvasRef.current
    if (!canvasNode) return

    const canvasContext = canvasNode.getContext('2d', {
      alpha: true,
      desynchronized: true,
    })
    if (!canvasContext) return

    const canvas = canvasNode
    const context = canvasContext

    const desktop = window.matchMedia(DESKTOP_QUERY)
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY)

    let width = 0
    let height = 0
    let frame = 0
    let resizeFrame = 0
    let lastFrame = 0
    let pointerListening = false
    let colors: MoireColors = {
      primary: '#3f6f24',
      secondary: '#1d1d1f',
    }
    const pointer = {
      targetX: 0,
      targetY: 0,
      followX: 0,
      followY: 0,
    }

    function readColors() {
      const styles = getComputedStyle(document.documentElement)
      colors = {
        primary: styles.getPropertyValue('--primary').trim() || '#3f6f24',
        secondary: styles.getPropertyValue('--foreground').trim() || '#1d1d1f',
      }
    }

    function clear() {
      context.clearRect(0, 0, width, height)
    }

    function resize() {
      if (!desktop.matches) {
        setPointerListening(false)
        cancelAnimationFrame(frame)
        frame = 0
        width = 0
        height = 0
        canvas.width = 1
        canvas.height = 1
        return
      }

      width = window.innerWidth
      height = window.innerHeight
      setPointerListening(true)
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(reducedMotion.matches ? 0 : performance.now())
    }

    function draw(time: number) {
      if (!width || !height) return

      clear()
      const centerX = width * 0.7
      const centerY = height * 0.5
      const drift = reducedMotion.matches ? 0 : Math.sin(time * 0.00014) * 10

      pointer.followX += (pointer.targetX * 24 - pointer.followX) * 0.025
      pointer.followY += (pointer.targetY * 18 - pointer.followY) * 0.025

      const offsetX = 30 + pointer.followX + drift
      const offsetY = pointer.followY
      const firstX = centerX - offsetX
      const firstY = centerY - offsetY
      const secondX = centerX + offsetX
      const secondY = centerY + offsetY
      const spacing = 13 - INTENSITY * 6
      const maximum = Math.hypot(width, height)

      context.lineWidth = 0.55 + INTENSITY * 0.25
      for (let radius = spacing; radius < maximum; radius += spacing) {
        context.globalAlpha = 0.2
        context.strokeStyle = colors.primary
        context.beginPath()
        context.arc(firstX, firstY, radius, 0, Math.PI * 2)
        context.stroke()

        context.globalAlpha = 0.1
        context.strokeStyle = colors.secondary
        context.beginPath()
        context.arc(secondX, secondY, radius, 0, Math.PI * 2)
        context.stroke()
      }
      context.globalAlpha = 1
    }

    function animate(time: number) {
      frame = requestAnimationFrame(animate)
      if (time - lastFrame < FRAME_INTERVAL) return
      lastFrame = time
      draw(time)
    }

    function start() {
      cancelAnimationFrame(frame)
      frame = 0
      if (!desktop.matches || document.hidden) return
      if (reducedMotion.matches) {
        draw(0)
        return
      }
      lastFrame = 0
      frame = requestAnimationFrame(animate)
    }

    function handlePointerMove(event: PointerEvent) {
      if (!desktop.matches) return
      pointer.targetX = (event.clientX / width) * 2 - 1
      pointer.targetY = (event.clientY / height) * 2 - 1
    }

    function handlePointerOut(event: PointerEvent) {
      if (event.relatedTarget !== null) return
      pointer.targetX = 0
      pointer.targetY = 0
    }

    function setPointerListening(enabled: boolean) {
      if (enabled === pointerListening) return
      pointerListening = enabled
      if (enabled) {
        window.addEventListener('pointermove', handlePointerMove, {
          passive: true,
        })
        window.addEventListener('pointerout', handlePointerOut)
        return
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerout', handlePointerOut)
    }

    function handleResize() {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        resize()
        start()
      })
    }

    function handleThemeChange() {
      readColors()
      if (reducedMotion.matches) draw(0)
    }

    const themeObserver = new MutationObserver(handleThemeChange)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    window.addEventListener('resize', handleResize, { passive: true })
    document.addEventListener('visibilitychange', start)
    desktop.addEventListener('change', handleResize)
    reducedMotion.addEventListener('change', start)

    readColors()
    resize()
    start()

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(resizeFrame)
      themeObserver.disconnect()
      setPointerListening(false)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', start)
      desktop.removeEventListener('change', handleResize)
      reducedMotion.removeEventListener('change', start)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden h-full w-full md:block"
    />
  )
}

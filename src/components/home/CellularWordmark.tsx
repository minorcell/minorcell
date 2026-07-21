'use client'

import { useEffect, useRef } from 'react'

const TARGET_TEXT = 'Cell'
const CELL_GLYPH_TEXT = 'Cell'
const CELL_GLYPH_FONT =
  '800 64px "SF Pro Display", "Helvetica Neue", Arial, sans-serif'
const CELL_GLYPH_WIDTH_RATIO = 0.875
const TARGET_COLS = 160
const TARGET_ROWS = 60
const MASK_SCALE = 4
const TARGET_FONT =
  '800 52.5px "SF Pro Display", "Helvetica Neue", Arial, sans-serif'
const TARGET_COVERAGE = 0.17
const ORDER_BANDS = 40
const PLAYBACK_RATE = 0.5
const GROW_DURATION_MS = 6200 / PLAYBACK_RATE
const INITIAL_HOLD_MS = 800 / PLAYBACK_RATE
const HOLD_DURATION_MS = 1100 / PLAYBACK_RATE
const COLLAPSE_DURATION_MS = 1400 / PLAYBACK_RATE
const HANDOFF_DURATION_MS = 220 / PLAYBACK_RATE
const CELL_FADE_MS = 260 / PLAYBACK_RATE
const MAX_VIEW_ZOOM = 2
const MIN_VIEW_ZOOM = 0.1
const VIEW_INSET = 0.44
const CELL_SPACING_RATIO = 0.82
const CAMERA_LOOKAHEAD_MS = 2000 / PLAYBACK_RATE
const PAN_HALF_LIFE_MS = 220 / PLAYBACK_RATE
const ZOOM_HALF_LIFE_MS = 150 / PLAYBACK_RATE
const SIMPLE_LOD_START_PX = 8
const SIMPLE_LOD_END_PX = 14
const FULL_LOD_START_PX = 22
const FULL_LOD_END_PX = 30

type AnimationPhase = 'grow' | 'pause' | 'collapse' | 'handoff'

interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface TargetCell {
  x: number
  y: number
  activationAt: number
}

interface RenderCell {
  x: number
  y: number
  fromX: number
  fromY: number
  offsetX: number
  offsetY: number
  bornAt: number
  stepIndex: number
  tex: number
  jitter: number
  rot: number
}

interface LayerSnapshot {
  mipmaps: HTMLCanvasElement[]
  width: number
  height: number
  centerX: number
  centerY: number
  targetScale: number
}

interface AnimationState {
  elapsed: number
  phaseElapsed: number
  phase: AnimationPhase
  cells: Map<string, RenderCell>
  targetCells: TargetCell[]
  nextTargetIndex: number
  bounds: Bounds | null
  snapshot?: LayerSnapshot
  nextState?: AnimationState
  nextSeed?: RenderCell
}

interface ThemeColors {
  palette: string[]
  deep: string[]
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))
const lerp = (start: number, end: number, amount: number) =>
  start + (end - start) * amount
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
const easeInOut = (value: number) => value * value * (3 - 2 * value)

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5)
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(a: number, b: number, c = 0) {
  let value = (a * 374761393 + b * 668265263 + c * 1442695041) >>> 0
  value = (value ^ (value >>> 13)) * 1274126177
  return (value ^ (value >>> 16)) >>> 0
}

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement)
  const read = (name: string) => styles.getPropertyValue(name).trim()

  return {
    palette: [
      read('--wordmark-palette-1'),
      read('--wordmark-palette-2'),
      read('--wordmark-palette-3'),
      read('--wordmark-palette-4'),
      read('--wordmark-palette-5'),
      read('--wordmark-palette-6'),
    ],
    deep: [
      read('--wordmark-deep-1'),
      read('--wordmark-deep-2'),
      read('--wordmark-deep-3'),
      read('--wordmark-deep-4'),
    ],
  }
}

export function CellularWordmark() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasNode = canvasRef.current
    if (!canvasNode) return

    const canvasContext = canvasNode.getContext('2d', {
      alpha: true,
      desynchronized: true,
    })
    if (!canvasContext) return

    const container = canvasNode
    const canvas = canvasNode
    const context = canvasContext

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const moveMs = reducedMotion ? 1 : 360 / PLAYBACK_RATE
    const birthMs = reducedMotion ? 1 : 720 / PLAYBACK_RATE

    let width = 1
    let height = 1
    let dpr = 1
    let raf = 0
    let visible = true
    let disposed = false
    let seed = Math.floor(Math.random() * 1e9)
    let textures: HTMLCanvasElement[] = []
    let simpleTextures: HTMLCanvasElement[] = []
    let colors = readThemeColors()
    let lastFrame = performance.now()
    const camera = {
      x: (TARGET_COLS - 1) / 2,
      y: (TARGET_ROWS - 1) / 2,
      zoom: MAX_VIEW_ZOOM,
      target: MAX_VIEW_ZOOM,
    }
    let state: AnimationState

    const key = (x: number, y: number) => `${x},${y}`

    function resize() {
      dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
      width = Math.max(1, container.clientWidth)
      height = Math.max(1, container.clientHeight)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
    }

    function makeTexture(index: number, detailed: boolean) {
      const size = 128
      const texture = document.createElement('canvas')
      texture.width = texture.height = size
      const textureContext = texture.getContext('2d')
      if (!textureContext) return texture

      const random = mulberry32(seed + index * 9973)
      const base = colors.palette[index % colors.palette.length]
      const deep = colors.deep[(index * 3) % colors.deep.length]

      textureContext.clearRect(0, 0, size, size)
      textureContext.save()
      textureContext.translate(size / 2, size / 2)
      if (detailed) textureContext.rotate((random() - 0.5) * 0.035)
      textureContext.font = CELL_GLYPH_FONT
      textureContext.textAlign = 'center'
      textureContext.textBaseline = 'middle'
      textureContext.lineJoin = 'round'
      if (detailed) {
        textureContext.strokeStyle = deep
        textureContext.globalAlpha = 0.42
        textureContext.lineWidth = 3.2
        textureContext.strokeText(CELL_GLYPH_TEXT, 0, 2)
        textureContext.globalAlpha = 1
      }
      textureContext.fillStyle = base
      textureContext.fillText(CELL_GLYPH_TEXT, 0, 2)

      if (detailed) {
        textureContext.globalCompositeOperation = 'source-atop'
        const shine = textureContext.createLinearGradient(
          -size / 3,
          -size / 4,
          size / 3,
          size / 4,
        )
        shine.addColorStop(0, 'rgba(255,255,255,0.18)')
        shine.addColorStop(0.5, 'rgba(255,255,255,0)')
        shine.addColorStop(1, 'rgba(23,33,15,0.12)')
        textureContext.fillStyle = shine
        textureContext.fillRect(-size / 2, -size / 2, size, size)
      }
      textureContext.restore()
      return texture
    }

    function rebuildTextures() {
      textures = Array.from({ length: 12 }, (_, index) =>
        makeTexture(index, true),
      )
      simpleTextures = Array.from({ length: 12 }, (_, index) =>
        makeTexture(index, false),
      )
    }

    function buildTargetCells() {
      const mask = document.createElement('canvas')
      mask.width = TARGET_COLS * MASK_SCALE
      mask.height = TARGET_ROWS * MASK_SCALE
      const maskContext = mask.getContext('2d', { willReadFrequently: true })
      if (!maskContext) return []

      maskContext.scale(MASK_SCALE, MASK_SCALE)
      maskContext.fillStyle = '#000'
      maskContext.font = TARGET_FONT
      maskContext.textAlign = 'center'
      maskContext.textBaseline = 'middle'
      maskContext.fillText(TARGET_TEXT, TARGET_COLS / 2, TARGET_ROWS / 2 + 0.5)

      const pixels = maskContext.getImageData(
        0,
        0,
        mask.width,
        mask.height,
      ).data
      const cells: Array<{ x: number; y: number }> = []

      for (let y = 0; y < TARGET_ROWS; y++) {
        for (let x = 0; x < TARGET_COLS; x++) {
          let alpha = 0
          for (let sampleY = 0; sampleY < MASK_SCALE; sampleY++) {
            for (let sampleX = 0; sampleX < MASK_SCALE; sampleX++) {
              const pixelX = x * MASK_SCALE + sampleX
              const pixelY = y * MASK_SCALE + sampleY
              alpha += pixels[(pixelY * mask.width + pixelX) * 4 + 3]
            }
          }
          const coverage = alpha / (255 * MASK_SCALE * MASK_SCALE)
          if (coverage >= TARGET_COVERAGE) cells.push({ x, y })
        }
      }

      if (!cells.length) return []

      const minX = Math.min(...cells.map((cell) => cell.x))
      const maxX = Math.max(...cells.map((cell) => cell.x))
      const minY = Math.min(...cells.map((cell) => cell.y))
      const maxY = Math.max(...cells.map((cell) => cell.y))
      const spanX = Math.max(1, maxX - minX)
      const spanY = Math.max(1, maxY - minY)
      const originY = (minY + maxY) / 2
      const maxDistance = Math.hypot(spanX, spanY / 2)
      const ordered = cells
        .map((cell) => {
          const xProgress = (cell.x - minX) / spanX
          const spatialProgress =
            Math.hypot(cell.x - minX, cell.y - originY) / maxDistance
          const orderProgress = clamp(
            xProgress * 0.68 + spatialProgress * 0.32,
            0,
            1,
          )
          const band = Math.min(
            ORDER_BANDS - 1,
            Math.floor(orderProgress * ORDER_BANDS),
          )
          const jitter = (hash2(cell.x, cell.y, seed) & 1023) / 1023
          return { ...cell, order: band + jitter }
        })
        .sort((a, b) => a.order - b.order)

      const firstOrder = ordered[0].order
      const orderSpan = Math.max(
        0.001,
        ordered[ordered.length - 1].order - firstOrder,
      )

      return ordered.map<TargetCell>((cell, index) => ({
        x: cell.x,
        y: cell.y,
        activationAt:
          index === 0
            ? 0
            : INITIAL_HOLD_MS +
              ((cell.order - firstOrder) / orderSpan) *
                (GROW_DURATION_MS - INITIAL_HOLD_MS),
      }))
    }

    function newState(): AnimationState {
      seed = (seed + 1013904223) >>> 0
      rebuildTextures()
      return {
        elapsed: 0,
        phaseElapsed: 0,
        phase: 'grow',
        cells: new Map(),
        targetCells: buildTargetCells(),
        nextTargetIndex: 0,
        bounds: null,
      }
    }

    function makeCell(
      x: number,
      y: number,
      fromX: number,
      fromY: number,
      bornAt: number,
      stepIndex: number,
    ): RenderCell {
      const value = hash2(x, y, seed)
      const offsetValue = hash2(y, x, seed ^ 0x85ebca6b)
      return {
        x,
        y,
        fromX,
        fromY,
        offsetX: ((offsetValue & 255) / 255 - 0.5) * 0.16,
        offsetY: (((offsetValue >>> 8) & 255) / 255 - 0.5) * 0.32,
        bornAt,
        stepIndex,
        tex: value % textures.length,
        jitter: (((value >>> 7) & 255) / 255 - 0.5) * 0.045,
        rot: (((value >>> 15) & 255) / 255 - 0.5) * 0.12,
      }
    }

    function activateTargetCells(now: number) {
      if (state.phase !== 'grow') return
      const elapsed = state.elapsed

      while (
        state.nextTargetIndex < state.targetCells.length &&
        state.targetCells[state.nextTargetIndex].activationAt <= elapsed
      ) {
        const target = state.targetCells[state.nextTargetIndex]
        const neighbors = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]
          .map(([dx, dy]) => state.cells.get(key(target.x + dx, target.y + dy)))
          .filter((cell): cell is RenderCell => Boolean(cell))
        const from = neighbors.length
          ? neighbors[hash2(target.x, target.y, seed) % neighbors.length]
          : target

        if (state.cells.size === 0) {
          camera.x = target.x
          camera.y = target.y
          camera.zoom = MAX_VIEW_ZOOM
          camera.target = MAX_VIEW_ZOOM
        }

        state.cells.set(
          key(target.x, target.y),
          makeCell(
            target.x,
            target.y,
            from.x,
            from.y,
            now,
            state.nextTargetIndex,
          ),
        )
        if (!state.bounds) {
          state.bounds = {
            minX: target.x,
            maxX: target.x,
            minY: target.y,
            maxY: target.y,
          }
        } else {
          state.bounds.minX = Math.min(state.bounds.minX, target.x)
          state.bounds.maxX = Math.max(state.bounds.maxX, target.x)
          state.bounds.minY = Math.min(state.bounds.minY, target.y)
          state.bounds.maxY = Math.max(state.bounds.maxY, target.y)
        }
        state.nextTargetIndex++
      }

      if (
        state.nextTargetIndex === state.targetCells.length &&
        elapsed >= GROW_DURATION_MS
      ) {
        state.phase = 'pause'
        state.phaseElapsed = 0
      }
    }

    function worldConfig() {
      const frameSize = Math.min(width, height)
      const base = frameSize / 25
      return {
        spacing: base * CELL_SPACING_RATIO,
        tile: base,
      }
    }

    function toScreen(x: number, y: number) {
      const { spacing } = worldConfig()
      return {
        x: width / 2 + (x - camera.x) * spacing * camera.zoom,
        y: height / 2 + (y - camera.y) * spacing * camera.zoom,
      }
    }

    function captureCellLayer() {
      if (!state.bounds) return null
      const { tile } = worldConfig()
      const size = tile * camera.zoom
      const topLeft = toScreen(state.bounds.minX, state.bounds.minY)
      const bottomRight = toScreen(state.bounds.maxX, state.bounds.maxY)
      const left = topLeft.x - size / 2
      const top = topLeft.y - size / 2
      const layerWidth = bottomRight.x - topLeft.x + size
      const layerHeight = bottomRight.y - topLeft.y + size
      const layer = document.createElement('canvas')
      layer.width = Math.max(1, Math.ceil(layerWidth * dpr))
      layer.height = Math.max(1, Math.ceil(layerHeight * dpr))
      const layerContext = layer.getContext('2d')
      if (!layerContext) return null
      layerContext.imageSmoothingEnabled = true
      layerContext.imageSmoothingQuality = 'high'
      layerContext.drawImage(
        canvas,
        left * dpr,
        top * dpr,
        layerWidth * dpr,
        layerHeight * dpr,
        0,
        0,
        layer.width,
        layer.height,
      )

      const initialCellSize = tile * MAX_VIEW_ZOOM
      return {
        mipmaps: buildMipmaps(layer),
        width: layerWidth,
        height: layerHeight,
        centerX: left + layerWidth / 2,
        centerY: top + layerHeight / 2,
        targetScale: (initialCellSize * CELL_GLYPH_WIDTH_RATIO) / layerWidth,
      }
    }

    function buildMipmaps(source: HTMLCanvasElement) {
      const mipmaps = [source]
      let current = source

      while (current.width > 2 || current.height > 2) {
        const next = document.createElement('canvas')
        next.width = Math.max(1, Math.floor(current.width / 2))
        next.height = Math.max(1, Math.floor(current.height / 2))
        const nextContext = next.getContext('2d')
        if (!nextContext) break
        nextContext.imageSmoothingEnabled = true
        nextContext.imageSmoothingQuality = 'high'
        nextContext.drawImage(current, 0, 0, next.width, next.height)
        mipmaps.push(next)
        current = next
      }

      return mipmaps
    }

    function primeState(nextState: AnimationState, now: number) {
      const target = nextState.targetCells[0]
      if (!target) return null
      const cell = makeCell(
        target.x,
        target.y,
        target.x,
        target.y,
        now - birthMs,
        0,
      )
      nextState.cells.set(key(target.x, target.y), cell)
      nextState.nextTargetIndex = 1
      nextState.bounds = {
        minX: target.x,
        maxX: target.x,
        minY: target.y,
        maxY: target.y,
      }
      return cell
    }

    function beginCollapse(now: number) {
      const snapshot = captureCellLayer()
      if (!snapshot) return
      state.snapshot = snapshot
      state.nextState = newState()
      state.nextSeed = primeState(state.nextState, now) ?? undefined
      state.phase = 'collapse'
      state.phaseElapsed = 0
    }

    function beginHandoff() {
      const nextSeed = state.nextSeed
      if (!nextSeed) return
      camera.x = nextSeed.x
      camera.y = nextSeed.y
      camera.zoom = MAX_VIEW_ZOOM
      camera.target = MAX_VIEW_ZOOM
      state.phase = 'handoff'
      state.phaseElapsed = 0
    }

    function clearCanvas() {
      context.clearRect(0, 0, width, height)
    }

    function glyphColor(cell: RenderCell) {
      return cell.stepIndex % 3 === 0
        ? colors.deep[cell.tex % colors.deep.length]
        : colors.palette[cell.tex % colors.palette.length]
    }

    function drawBirthGlyph(
      cell: RenderCell,
      x: number,
      y: number,
      size: number,
      progress: number,
      alpha: number,
    ) {
      const glyphSize = size * lerp(0.35, 1.08, easeOutCubic(progress))
      context.save()
      context.translate(x, y)
      context.rotate(cell.rot + progress * 0.08)
      const birthAlpha =
        alpha * Math.sin(Math.PI * clamp(progress, 0, 1)) * 0.95
      const glyphWeight = easeInOut(
        clamp(
          (glyphSize * dpr - SIMPLE_LOD_START_PX) /
            (SIMPLE_LOD_END_PX - SIMPLE_LOD_START_PX),
          0,
          1,
        ),
      )
      context.fillStyle = glyphColor(cell)
      context.globalAlpha = birthAlpha * (1 - glyphWeight)
      const markSize = Math.max(glyphSize * 0.56, 1 / dpr)
      context.beginPath()
      context.arc(0, 0, markSize / 2, 0, Math.PI * 2)
      context.fill()
      context.globalAlpha = birthAlpha * glyphWeight
      context.font = `800 ${glyphSize * 0.5}px "SF Pro Display", "Helvetica Neue", Arial, sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(CELL_GLYPH_TEXT, 0, glyphSize * 0.015)
      context.restore()
    }

    function drawTile(cell: RenderCell, now: number, alpha: number) {
      const age = now - cell.bornAt
      const birthProgress = clamp(age / birthMs, 0, 1)
      const moveProgress = easeOutCubic(clamp(age / moveMs, 0, 1))
      const from = toScreen(
        cell.fromX + cell.offsetX,
        cell.fromY + cell.offsetY,
      )
      const target = toScreen(cell.x + cell.offsetX, cell.y + cell.offsetY)
      const x = lerp(from.x, target.x, moveProgress)
      const y = lerp(from.y, target.y, moveProgress)
      const { tile } = worldConfig()
      const size = tile * camera.zoom
      const physicalSize = size * dpr
      if (physicalSize < 1 || size > 12000) return

      if (age < birthMs) {
        drawBirthGlyph(cell, x, y, size, birthProgress, alpha)
        return
      }

      const fade = clamp((age - birthMs) / CELL_FADE_MS, 0, 1)
      const wobble =
        Math.sin(now * 0.0012 * PLAYBACK_RATE + cell.stepIndex * 0.4) *
        cell.jitter
      const settleStart = GROW_DURATION_MS * 0.72
      const settle =
        state.phase === 'grow'
          ? easeInOut(
              clamp(
                (state.elapsed - settleStart) /
                  (GROW_DURATION_MS - settleStart),
                0,
                1,
              ),
            )
          : 1

      context.save()
      context.translate(x, y)
      const fullWeight = easeInOut(
        clamp(
          (physicalSize - FULL_LOD_START_PX) /
            (FULL_LOD_END_PX - FULL_LOD_START_PX),
          0,
          1,
        ),
      )
      const simpleVisibility = easeInOut(
        clamp(
          (physicalSize - SIMPLE_LOD_START_PX) /
            (SIMPLE_LOD_END_PX - SIMPLE_LOD_START_PX),
          0,
          1,
        ),
      )
      const simpleWeight = (1 - fullWeight) * simpleVisibility
      const markWeight = 1 - fullWeight - simpleWeight

      if (markWeight > 0) {
        context.globalAlpha = alpha * fade * markWeight
        context.fillStyle = glyphColor(cell)
        const markSize = Math.max(size * 0.56, 1 / dpr)
        context.beginPath()
        context.arc(0, 0, markSize / 2, 0, Math.PI * 2)
        context.fill()
      }

      const rotationVisibility = easeInOut(
        clamp(
          (physicalSize - SIMPLE_LOD_END_PX) /
            (FULL_LOD_START_PX - SIMPLE_LOD_END_PX),
          0,
          1,
        ),
      )
      context.rotate((cell.rot + wobble) * (1 - settle) * rotationVisibility)
      if (simpleWeight > 0) {
        context.globalAlpha = alpha * fade * simpleWeight
        context.drawImage(
          simpleTextures[cell.tex],
          -size / 2,
          -size / 2,
          size,
          size,
        )
      }
      if (fullWeight > 0) {
        context.globalAlpha = alpha * fade * fullWeight
        context.drawImage(textures[cell.tex], -size / 2, -size / 2, size, size)
      }
      context.restore()
    }

    function updateCamera(dt: number) {
      if (!state.bounds) return
      const { spacing, tile } = worldConfig()
      const tileRadius = (tile * Math.SQRT2) / 2
      const availableHalfWidth = width * VIEW_INSET
      const availableHalfHeight = height * VIEW_INSET
      const { minX, maxX, minY, maxY } = state.bounds
      const previewBounds = { minX, maxX, minY, maxY }
      const lookahead = Math.min(CAMERA_LOOKAHEAD_MS, state.elapsed)
      const previewUntil = Math.min(GROW_DURATION_MS, state.elapsed + lookahead)

      for (
        let index = state.nextTargetIndex;
        index < state.targetCells.length;
        index++
      ) {
        const cell = state.targetCells[index]
        if (cell.activationAt > previewUntil) break
        previewBounds.minX = Math.min(previewBounds.minX, cell.x)
        previewBounds.maxX = Math.max(previewBounds.maxX, cell.x)
        previewBounds.minY = Math.min(previewBounds.minY, cell.y)
        previewBounds.maxY = Math.max(previewBounds.maxY, cell.y)
      }

      const targetX = (previewBounds.minX + previewBounds.maxX) / 2
      const targetY = (previewBounds.minY + previewBounds.maxY) / 2
      const idealHalfWidth =
        ((previewBounds.maxX - previewBounds.minX) * spacing) / 2 + tileRadius
      const idealHalfHeight =
        ((previewBounds.maxY - previewBounds.minY) * spacing) / 2 + tileRadius
      const fitZoom = Math.min(
        availableHalfWidth / idealHalfWidth,
        availableHalfHeight / idealHalfHeight,
      )
      camera.target = Math.min(camera.target, MAX_VIEW_ZOOM, fitZoom)

      const panAmount = 1 - Math.pow(0.5, dt / PAN_HALF_LIFE_MS)
      camera.x = lerp(camera.x, targetX, panAmount)
      camera.y = lerp(camera.y, targetY, panAmount)

      const safeHalfWidth =
        Math.max(camera.x - minX, maxX - camera.x) * spacing + tileRadius
      const safeHalfHeight =
        Math.max(camera.y - minY, maxY - camera.y) * spacing + tileRadius
      const safeZoom = Math.min(
        availableHalfWidth / safeHalfWidth,
        availableHalfHeight / safeHalfHeight,
      )
      const zoomAmount = 1 - Math.pow(0.5, dt / ZOOM_HALF_LIFE_MS)
      const nextZoom = Math.exp(
        lerp(Math.log(camera.zoom), Math.log(camera.target), zoomAmount),
      )
      camera.zoom = clamp(
        Math.min(camera.zoom, nextZoom, safeZoom),
        MIN_VIEW_ZOOM,
        MAX_VIEW_ZOOM,
      )
    }

    function draw(now: number) {
      if (
        (state.phase === 'collapse' || state.phase === 'handoff') &&
        state.snapshot
      ) {
        const collapsing = state.phase === 'collapse'
        const collapseProgress = collapsing
          ? clamp(state.phaseElapsed / COLLAPSE_DURATION_MS, 0, 1)
          : 1
        const handoffProgress =
          state.phase === 'handoff'
            ? easeInOut(clamp(state.phaseElapsed / HANDOFF_DURATION_MS, 0, 1))
            : 0
        clearCanvas()

        const easedCollapse = easeInOut(collapseProgress)
        const snapshot = state.snapshot
        const scale = Math.exp(
          lerp(0, Math.log(snapshot.targetScale), easedCollapse),
        )
        const drawWidth = snapshot.width * scale
        const drawHeight = snapshot.height * scale
        const centerX = lerp(snapshot.centerX, width / 2, easedCollapse)
        const centerY = lerp(snapshot.centerY, height / 2, easedCollapse)
        const mipLevel = clamp(
          Math.log2(1 / scale),
          0,
          snapshot.mipmaps.length - 1,
        )
        const lowerLevel = Math.floor(mipLevel)
        const upperLevel = Math.min(snapshot.mipmaps.length - 1, lowerLevel + 1)
        const mipBlend = mipLevel - lowerLevel
        context.save()
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        context.globalAlpha = (1 - handoffProgress) * (1 - mipBlend)
        context.drawImage(
          snapshot.mipmaps[lowerLevel],
          centerX - drawWidth / 2,
          centerY - drawHeight / 2,
          drawWidth,
          drawHeight,
        )
        if (upperLevel !== lowerLevel && mipBlend > 0) {
          context.globalAlpha = (1 - handoffProgress) * mipBlend
          context.drawImage(
            snapshot.mipmaps[upperLevel],
            centerX - drawWidth / 2,
            centerY - drawHeight / 2,
            drawWidth,
            drawHeight,
          )
        }
        context.restore()

        if (state.phase === 'handoff' && state.nextSeed) {
          const { tile } = worldConfig()
          const size = tile * MAX_VIEW_ZOOM
          context.save()
          context.globalAlpha = handoffProgress
          context.drawImage(
            textures[state.nextSeed.tex],
            width / 2 - size / 2,
            height / 2 - size / 2,
            size,
            size,
          )
          context.restore()
        }
        return
      }

      clearCanvas()
      const cells = Array.from(state.cells.values()).sort(
        (a, b) => a.stepIndex - b.stepIndex,
      )
      for (const cell of cells) drawTile(cell, now, 1)
    }

    function frame(now: number) {
      if (disposed || !visible) return
      const dt = Math.min(48, now - lastFrame)
      lastFrame = now
      state.elapsed += dt

      if (
        state.phase === 'pause' ||
        state.phase === 'collapse' ||
        state.phase === 'handoff'
      ) {
        state.phaseElapsed += dt
        if (state.phase === 'pause' && state.phaseElapsed >= HOLD_DURATION_MS) {
          beginCollapse(now)
        } else if (
          state.phase === 'collapse' &&
          state.phaseElapsed >= COLLAPSE_DURATION_MS
        ) {
          beginHandoff()
        } else if (
          state.phase === 'handoff' &&
          state.phaseElapsed >= HANDOFF_DURATION_MS &&
          state.nextState
        ) {
          state = state.nextState
        }
      }

      activateTargetCells(now)
      if (state.phase === 'grow' || state.phase === 'pause') updateCamera(dt)
      draw(now)
      raf = requestAnimationFrame(frame)
    }

    function start() {
      cancelAnimationFrame(raf)
      lastFrame = performance.now()
      raf = requestAnimationFrame(frame)
    }

    function stop() {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const resizeObserver = new ResizeObserver(resize)
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true
        if (visible) start()
        else stop()
      },
      { threshold: 0.01 },
    )
    const themeObserver = new MutationObserver(() => {
      colors = readThemeColors()
      state = newState()
    })

    resize()
    state = newState()
    resizeObserver.observe(container)
    intersectionObserver.observe(container)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    start()

    return () => {
      disposed = true
      stop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block aspect-[3/2] w-full max-w-[320px] sm:max-w-[400px] lg:mx-0 lg:max-w-[520px] lg:justify-self-end"
      aria-hidden="true"
    />
  )
}

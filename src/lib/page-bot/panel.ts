export type ResizeEdge =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export interface PanelRect {
  left: number
  top: number
  width: number
  height: number
}

interface Viewport {
  width: number
  height: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

function panelBounds(viewport: Viewport) {
  const gutter = viewport.width >= 640 ? 32 : 20
  const left = Math.min(gutter, viewport.width / 2)
  const right = Math.max(left, viewport.width - gutter)
  const bottom = Math.max(0, viewport.height - gutter)
  const top = Math.min(bottom, 104 - gutter)
  return { left, top, right, bottom }
}

export function clampPanelRect(rect: PanelRect, viewport: Viewport): PanelRect {
  const bounds = panelBounds(viewport)
  const maxWidth = bounds.right - bounds.left
  const maxHeight = bounds.bottom - bounds.top
  const width = clamp(rect.width, Math.min(320, maxWidth), maxWidth)
  const height = clamp(rect.height, Math.min(288, maxHeight), maxHeight)
  return {
    left: clamp(rect.left, bounds.left, bounds.right - width),
    top: clamp(rect.top, bounds.top, bounds.bottom - height),
    width,
    height,
  }
}

export function resizePanelRect(
  initial: PanelRect,
  edge: ResizeEdge,
  deltaX: number,
  deltaY: number,
  viewport: Viewport,
): PanelRect {
  const rect = clampPanelRect(initial, viewport)
  const bounds = panelBounds(viewport)
  const minWidth = Math.min(320, bounds.right - bounds.left)
  const minHeight = Math.min(288, bounds.bottom - bounds.top)
  let left = rect.left
  let top = rect.top
  let right = rect.left + rect.width
  let bottom = rect.top + rect.height

  if (edge.includes('left')) {
    left = clamp(left + deltaX, bounds.left, right - minWidth)
  }
  if (edge.includes('right')) {
    right = clamp(right + deltaX, left + minWidth, bounds.right)
  }
  if (edge.includes('top')) {
    top = clamp(top + deltaY, bounds.top, bottom - minHeight)
  }
  if (edge.includes('bottom')) {
    bottom = clamp(bottom + deltaY, top + minHeight, bounds.bottom)
  }

  return { left, top, width: right - left, height: bottom - top }
}

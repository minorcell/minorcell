import assert from 'node:assert/strict'
import test from 'node:test'
import { clampPanelRect, resizePanelRect, type ResizeEdge } from './panel'

const viewport = { width: 1400, height: 1000 }
const rect = { left: 400, top: 200, width: 400, height: 400 }

const cases: [ResizeEdge, number[]][] = [
  ['top', [400, 230, 400, 370]],
  ['right', [400, 200, 440, 400]],
  ['bottom', [400, 200, 400, 430]],
  ['left', [440, 200, 360, 400]],
  ['top-left', [440, 230, 360, 370]],
  ['top-right', [400, 230, 440, 370]],
  ['bottom-left', [440, 200, 360, 430]],
  ['bottom-right', [400, 200, 440, 430]],
]

for (const [edge, expected] of cases) {
  test(`dragging ${edge} keeps the opposite edges in place`, () => {
    const result = resizePanelRect(rect, edge, 40, 30, viewport)
    assert.deepEqual(
      [result.left, result.top, result.width, result.height],
      expected,
    )
  })
}

test('shrinking from the top-left stops at the minimum size', () => {
  const result = resizePanelRect(rect, 'top-left', 5000, 5000, viewport)
  assert.deepEqual(result, {
    left: 480,
    top: 312,
    width: 320,
    height: 288,
  })
})

test('expanding from the top-left stops inside the viewport', () => {
  const result = resizePanelRect(rect, 'top-left', -5000, -5000, viewport)
  assert.deepEqual(result, { left: 32, top: 72, width: 768, height: 528 })
})

test('expanding from the bottom-right stops inside the viewport', () => {
  const result = resizePanelRect(rect, 'bottom-right', 5000, 5000, viewport)
  assert.deepEqual(result, { left: 400, top: 200, width: 968, height: 768 })
})

test('a smaller viewport repositions and shrinks an oversized panel', () => {
  const result = clampPanelRect(
    { left: 500, top: 300, width: 900, height: 800 },
    { width: 320, height: 480 },
  )
  assert.deepEqual(result, { left: 20, top: 84, width: 280, height: 376 })
})

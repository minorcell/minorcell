import assert from 'node:assert/strict'
import test from 'node:test'
import { createStreamBuffer } from './stream-buffer.ts'

test('shows the first token immediately and coalesces a burst into its latest text', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const updates: string[] = []
  const stream = createStreamBuffer((content) => updates.push(content))

  stream.push('你')
  assert.deepEqual(updates, ['你'])
  stream.push('你好')
  stream.push('你好，世界')
  t.mock.timers.tick(49)
  assert.deepEqual(updates, ['你'])
  t.mock.timers.tick(1)
  assert.deepEqual(updates, ['你', '你好，世界'])
})

test('bounds UI updates during a continuous stream without losing text', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const updates: string[] = []
  const stream = createStreamBuffer((content) => updates.push(content))
  let answer = ''

  for (let index = 0; index < 1000; index++) {
    answer += `${index}，`
    stream.push(answer)
    t.mock.timers.tick(1)
  }
  stream.flush()

  assert.equal(updates.at(-1), answer)
  assert.ok(
    updates.length <= 22,
    `${updates.length} UI updates for 1000 tokens`,
  )
  assert.ok(updates.length >= 19, 'continues publishing while tokens arrive')
})

test('flushing at completion or stop retains trailing tokens and clears the timer', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const updates: string[] = []
  const stream = createStreamBuffer((content) => updates.push(content))

  stream.push('开头')
  stream.push('开头和未满一个刷新周期的结尾')
  stream.flush()
  stream.flush()
  stream.cancel()
  t.mock.timers.tick(100)

  assert.deepEqual(updates, ['开头', '开头和未满一个刷新周期的结尾'])
})

test('retains partial output when generation throws before the next refresh', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const updates: string[] = []
  const stream = createStreamBuffer((content) => updates.push(content))
  const failure = new Error('generation interrupted')

  await assert.rejects(async () => {
    try {
      stream.push('部分')
      stream.push('部分回答')
      throw failure
    } finally {
      stream.flush()
      stream.cancel()
    }
  }, failure)

  t.mock.timers.tick(100)
  assert.deepEqual(updates, ['部分', '部分回答'])
})

test('discarding an old stream cannot publish stale text into a new conversation', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const updates: string[] = []
  const oldStream = createStreamBuffer((content) => updates.push(content))
  oldStream.push('旧回答')
  oldStream.push('旧回答的尾部')
  oldStream.cancel()

  const newStream = createStreamBuffer((content) => updates.push(content))
  newStream.push('新回答')
  oldStream.push('迟到的旧 token')
  oldStream.flush()
  t.mock.timers.tick(100)

  assert.deepEqual(updates, ['旧回答', '新回答'])
})

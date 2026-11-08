import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPrompt, SAFETY_MARGIN, type ChatTurn } from './budget'
import {
  CONTEXT_PRUNE_TARGET,
  CONTEXT_PRUNE_THRESHOLD,
  DEFAULT_CONTEXT_WINDOW,
} from './model'

type PromptInput = Parameters<typeof buildPrompt>[0]

function build(overrides: Partial<PromptInput> = {}) {
  return buildPrompt({
    history: [],
    question: '请继续解释',
    pageTitle: '测试文章',
    pagePath: '/articles/test',
    chunks: [],
    selection: '',
    ...overrides,
  })
}

function conversation(rounds: number, length = 500): ChatTurn[] {
  return Array.from({ length: rounds }, (_, index) => [
    { role: 'user' as const, content: `问题${index}：${'问'.repeat(length)}` },
    {
      role: 'assistant' as const,
      content: `回答${index}：${'答'.repeat(length)}`,
    },
  ]).flat()
}

function usage(prompt: ReturnType<typeof build>) {
  return prompt.inputTokens + prompt.replyTokens + SAFETY_MARGIN
}

function boundaryHistory(target: number): ChatTurn[] {
  const historyFor = (length: number): ChatTurn[] => [
    { role: 'user', content: 'a'.repeat(length) },
    { role: 'assistant', content: 'previous answer' },
  ]
  let low = 1
  let high = DEFAULT_CONTEXT_WINDOW * 4
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    const unpruned = build({
      contextWindow: DEFAULT_CONTEXT_WINDOW * 2,
      history: historyFor(middle),
    })
    if (usage(unpruned) < target) low = middle + 1
    else high = middle
  }
  const history = historyFor(low)
  assert.equal(
    usage(build({ contextWindow: DEFAULT_CONTEXT_WINDOW * 2, history })),
    target,
  )
  return history
}

test('uses a 64K context and larger ordinary replies', () => {
  const prompt = build()
  assert.equal(prompt.contextWindow, 65536)
  assert.equal(prompt.replyTokens, 2048)
  assert.doesNotMatch(prompt.messages[0].content, /最多六句/)
})

test('keeps full message contents below the pruning threshold', () => {
  const history = conversation(10, 1000)
  const prompt = build({ history })
  assert.deepEqual(prompt.history, history)
  assert.equal(prompt.prunedMessages, 0)
  assert.ok(prompt.history[0].content.length > 220)
  assert.ok(prompt.history[1].content.length > 160)
})

test('retains history immediately below 80% usage', () => {
  const threshold = Math.ceil(DEFAULT_CONTEXT_WINDOW * CONTEXT_PRUNE_THRESHOLD)
  const history = boundaryHistory(threshold - 1)
  const prompt = build({ history })
  assert.equal(usage(prompt), threshold - 1)
  assert.deepEqual(prompt.history, history)
  assert.equal(prompt.prunedMessages, 0)
})

test('starts pruning at exactly 80%, including reply and safety reservations', () => {
  const threshold = Math.ceil(DEFAULT_CONTEXT_WINDOW * CONTEXT_PRUNE_THRESHOLD)
  const prompt = build({ history: boundaryHistory(threshold) })
  assert.equal(prompt.prunedMessages, 2)
  assert.ok(usage(prompt) <= DEFAULT_CONTEXT_WINDOW * CONTEXT_PRUNE_TARGET)
})

test('removes oldest complete turns and retains the latest original messages', () => {
  const history = conversation(40)
  const original = structuredClone(history)
  const prompt = build({ history })
  assert.ok(prompt.prunedMessages > 0)
  assert.equal(prompt.prunedMessages % 2, 0)
  assert.equal(prompt.history[0].role, 'user')
  assert.deepEqual(prompt.history, history.slice(prompt.prunedMessages))
  assert.deepEqual(prompt.history.slice(-2), history.slice(-2))
  assert.deepEqual(history, original)
  assert.ok(usage(prompt) <= DEFAULT_CONTEXT_WINDOW * CONTEXT_PRUNE_TARGET)
})

test('handles histories requiring more than 24 rounds to be removed', () => {
  const prompt = build({ history: conversation(120) })
  assert.ok(prompt.prunedMessages > 48)
  assert.ok(usage(prompt) <= DEFAULT_CONTEXT_WINDOW * CONTEXT_PRUNE_TARGET)
})

test('does not reintroduce removed messages on the following turn', () => {
  const first = build({ history: conversation(40) })
  const next = build({
    history: [
      ...first.history,
      { role: 'user', content: '上一个问题' },
      { role: 'assistant', content: '上一个回答' },
    ],
  })
  assert.equal(next.prunedMessages, 0)
  assert.doesNotMatch(JSON.stringify(next.messages), /问题0：|回答0：/)
})

test('keeps the current question, relevant page text, and selection when pruning', () => {
  const prompt = build({
    history: conversation(40),
    question: '请解释重点',
    chunks: [{ heading: '重点', text: '当前文章的关键事实' }],
    selection: '用户特别选中的内容',
  })
  assert.ok(prompt.prunedMessages > 0)
  const current = prompt.messages.at(-1)!.content
  assert.match(current, /请解释重点/)
  assert.match(current, /当前文章的关键事实/)
  assert.match(current, /用户特别选中的内容/)
})

test('uses the larger window for article text and longer questions', () => {
  const chunks = Array.from({ length: 10 }, (_, index) => ({
    heading: `第${index}节`,
    text: `${'内容'.repeat(250)}段落结尾${index}`,
  }))
  const question = `总结这一页，${'关注重点'.repeat(150)}`
  const prompt = build({ chunks, question })
  assert.equal(prompt.excerptCount, chunks.length)
  assert.match(prompt.messages.at(-1)!.content, /段落结尾9/)
  assert.ok(prompt.messages.at(-1)!.content.includes(question))
  assert.ok(prompt.inputTokens > 4096)
})

test('includes page context by default', () => {
  const prompt = build({
    chunks: [{ heading: '重点', text: '页面独有内容' }],
    selection: '选区独有内容',
  })
  const current = prompt.messages.at(-1)!.content
  assert.match(current, /页面独有内容/)
  assert.match(current, /选区独有内容/)
  assert.match(current, /测试文章/)
  assert.match(current, /\/articles\/test/)
})

test('excludes all automatic page input when page context is disabled', () => {
  const prompt = build({
    includePageContext: false,
    chunks: [{ heading: '重点', text: '页面独有内容' }],
    selection: '选区独有内容',
    historyMayBeOtherPage: true,
  })
  assert.equal(prompt.mode, 'chat')
  assert.equal(prompt.excerptCount, 0)
  assert.doesNotMatch(
    JSON.stringify(prompt.messages),
    /页面独有内容|选区独有内容|测试文章|\/articles\/test|较早的对话可能/,
  )
})

test('keeps overflow retry prompts within a smaller input budget', () => {
  const prompt = build({
    contextWindow: 8192,
    history: conversation(40),
    question: '解释重点',
    chunks: Array.from({ length: 20 }, () => ({
      heading: '重点',
      text: '正文'.repeat(300),
    })),
  })
  assert.ok(usage(prompt) <= 8192)
  assert.ok(prompt.replyTokens <= 2048)
  assert.match(prompt.messages.at(-1)!.content, /解释重点/)
})

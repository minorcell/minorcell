'use client'

import {
  memo,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import dynamic from 'next/dynamic'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import { Icon } from '@/components/ui/icon'
import { buildPrompt, type ChatTurn } from '@/lib/page-bot/budget'
import {
  explainEngineError,
  getLoadedEngine,
  hasCachedModel,
  hasWebGPU,
  isContextOverflow,
  loadEngine,
  subscribeProgress,
} from '@/lib/page-bot/engine'

import {
  readPage,
  readSelection,
  type PageSnapshot,
} from '@/lib/page-bot/read-page'
import {
  clampPanelRect,
  resizePanelRect,
  type PanelRect,
  type ResizeEdge,
} from '@/lib/page-bot/panel'
import { createStreamBuffer } from '@/lib/page-bot/stream-buffer'
import styles from './PageBot.module.css'

const MarkdownRenderer = dynamic(() =>
  import('@/components/common/MarkdownRenderer').then(
    (module) => module.MarkdownRenderer,
  ),
)

const STORAGE_KEY = 'minorcell.page-bot.v1'
const SUGGESTIONS = ['总结这一页', '列出三个要点']
const RESIZE_EDGES: ResizeEdge[] = [
  'top',
  'right',
  'bottom',
  'left',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]

interface StoredChat {
  messages: ChatTurn[]
  history: ChatTurn[]
  path: string
}

interface PanelResize extends PanelRect {
  pointerId: number
  edge: ResizeEdge
  x: number
  y: number
}

function readTurns(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is ChatTurn =>
      !!item &&
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string',
  )
}

function loadStored(): StoredChat {
  const empty: StoredChat = { messages: [], history: [], path: '' }
  if (typeof window === 'undefined') return empty
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return empty
    const record = parsed as Partial<StoredChat>
    const messages = readTurns(record.messages)
    return {
      messages: messages.slice(-24),
      history: Array.isArray(record.history)
        ? readTurns(record.history)
        : messages,
      path: typeof record.path === 'string' ? record.path : '',
    }
  } catch {
    return empty
  }
}

function saveStored(payload: StoredChat) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // A full or unavailable session cache must not interrupt the conversation.
  }
}

const AssistantTurn = memo(function AssistantTurn({
  content,
  isStreaming,
}: {
  content: string
  isStreaming: boolean
}) {
  if (!content.trim()) return null
  return (
    <li className="mr-2 min-w-0">
      <MarkdownRenderer
        content={content}
        isStreaming={isStreaming}
        className={styles.answer}
      />
    </li>
  )
})

export function PageBot() {
  const titleId = useId()
  const panelId = useId()
  const panelRef = useRef<HTMLDialogElement>(null)
  const resizeRef = useRef<PanelResize | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const turnRef = useRef(0)
  const streamRef = useRef<ReturnType<typeof createStreamBuffer> | null>(null)
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const messagesRef = useRef<ChatTurn[]>([])
  const historyRef = useRef<ChatTurn[]>([])
  const askedPathRef = useRef('')
  const dirtyRef = useRef(false)
  const skipPersistRef = useRef(true)
  const [open, setOpen] = useState(false)
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null)
  const [activeResizeEdge, setActiveResizeEdge] = useState<ResizeEdge | null>(
    null,
  )
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [draft, setDraft] = useState('')
  const [includePageContext, setIncludePageContext] = useState(true)
  const [activity, setActivity] = useState<'idle' | 'loading' | 'generating'>(
    'idle',
  )
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [gpuOk, setGpuOk] = useState(true)

  const remember = (next: ChatTurn[]) => {
    messagesRef.current = next
    setMessages(next)
  }

  const closePanel = () => {
    resizeRef.current = null
    setActiveResizeEdge(null)
    setOpen(false)
  }

  useEffect(() => {
    if (dirtyRef.current) return
    const stored = loadStored()
    askedPathRef.current = stored.path
    historyRef.current = stored.history
    remember(stored.messages)
    setGpuOk(hasWebGPU())
    return subscribeProgress((report) => {
      setProgress(report.progress)
    })
  }, [])

  useEffect(() => {
    if (!hasWebGPU() || getLoadedEngine()) return
    let cancelled = false
    const turn = turnRef.current

    const preload = async () => {
      let loading = false
      try {
        const cached = await hasCachedModel()
        if (!cached || cancelled || turn !== turnRef.current) return
        loading = true
        setProgress(0)
        setActivity('loading')
        await loadEngine()
      } catch (error) {
        if (!cancelled && turn === turnRef.current) {
          setError(explainEngineError(error))
        }
      } finally {
        if (loading && !cancelled && turn === turnRef.current) {
          setActivity('idle')
        }
      }
    }

    void preload()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }
    const persist = () => {
      saveStored({
        messages: messagesRef.current.slice(-24),
        history: historyRef.current,
        path: askedPathRef.current,
      })
    }
    if (activity !== 'generating') {
      persist()
      return
    }
    const id = window.setTimeout(persist, 250)
    return () => window.clearTimeout(id)
  }, [messages, activity])

  useEffect(() => {
    const persist = () => {
      streamRef.current?.flush()
      saveStored({
        messages: messagesRef.current.slice(-24),
        history: historyRef.current,
        path: askedPathRef.current,
      })
    }
    window.addEventListener('pagehide', persist)
    return () => window.removeEventListener('pagehide', persist)
  }, [])

  useEffect(() => {
    return () => {
      const stream = streamRef.current
      stream?.cancel()
      streamRef.current = null
      turnRef.current += 1
      if (stream) void getLoadedEngine()?.stop()
    }
  }, [])

  useEffect(() => {
    const fitToViewport = () => {
      setPanelRect((rect) =>
        rect
          ? clampPanelRect(rect, {
              width: window.innerWidth,
              height: window.innerHeight,
            })
          : null,
      )
    }
    window.addEventListener('resize', fitToViewport)
    return () => window.removeEventListener('resize', fitToViewport)
  }, [])

  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    inputRef.current?.focus()
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      trigger?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const log = logRef.current
    if (!log) return
    log.scrollTop = log.scrollHeight
  }, [messages, activity, open, error])

  const busy = activity !== 'idle'
  const stop = () => {
    streamRef.current?.flush()
    streamRef.current?.cancel()
    streamRef.current = null
    turnRef.current += 1
    void getLoadedEngine()?.stop()
    setActivity('idle')
  }

  const clearChat = () => {
    dirtyRef.current = true
    stop()
    askedPathRef.current = ''
    historyRef.current = []
    setError(null)
    remember([])
  }

  const send = (text: string) => {
    const question = text.trim()
    if (!question || !gpuOk || busy) return
    const page = includePageContext
      ? readPage()
      : { title: '', path: '', chunks: [] }
    const selection = includePageContext ? readSelection() : ''
    dirtyRef.current = true
    setDraft('')
    setError(null)
    if (inputRef.current) inputRef.current.style.height = ''
    const history = historyRef.current
    const next = [
      ...messagesRef.current,
      { role: 'user' as const, content: question },
    ]
    remember(next)
    const turn = ++turnRef.current
    const run = queueRef.current.then(() =>
      execute(turn, question, history, page, selection, {
        includePageContext,
      }),
    )
    queueRef.current = run.catch(() => {})
  }

  async function execute(
    turn: number,
    question: string,
    history: ChatTurn[],
    page: PageSnapshot,
    selection: string,
    options: { includePageContext: boolean },
  ) {
    if (turn !== turnRef.current) return
    setActivity('loading')
    setProgress(0)
    try {
      const engine = await loadEngine()
      if (turn !== turnRef.current) return

      const historyMayBeOtherPage =
        askedPathRef.current.length > 0 && askedPathRef.current !== page.path
      askedPathRef.current = page.path
      let prompt = buildPrompt({
        contextWindow: engine.contextWindow,
        history,
        question,
        pageTitle: page.title,
        pagePath: page.path,
        chunks: page.chunks,
        selection,
        historyMayBeOtherPage,
        ...options,
      })
      setActivity('generating')
      let produced = false

      const streamIntoThread = async (built: typeof prompt) => {
        const turnHistory: ChatTurn[] = [
          ...built.history,
          { role: 'user', content: question },
        ]
        historyRef.current = turnHistory
        let answer = ''
        let started = false
        const base = messagesRef.current
        const stream = createStreamBuffer((content) => {
          if (turn !== turnRef.current) return
          historyRef.current = [...turnHistory, { role: 'assistant', content }]
          remember([...base, { role: 'assistant', content }])
        })
        streamRef.current = stream
        try {
          for await (const delta of engine.generate(
            built.messages,
            built.replyTokens,
          )) {
            if (turn !== turnRef.current) return started
            answer += delta
            started = true
            produced = true
            stream.push(answer)
          }
        } finally {
          if (turn === turnRef.current) stream.flush()
          stream.cancel()
          if (streamRef.current === stream) streamRef.current = null
        }
        if (turn !== turnRef.current) return started
        if (!answer.trim()) {
          const content = '没有生成内容。可以换个更短的问题。'
          historyRef.current = [...turnHistory, { role: 'assistant', content }]
          remember([
            ...messagesRef.current,
            {
              role: 'assistant',
              content,
            },
          ])
        }
        return started
      }

      try {
        await streamIntoThread(prompt)
      } catch (error) {
        if (turn !== turnRef.current || produced || !isContextOverflow(error)) {
          if (turn === turnRef.current) throw error
          return
        }
        prompt = buildPrompt({
          contextWindow: Math.min(engine.contextWindow, 8192),
          history: [],
          question,
          pageTitle: page.title,
          pagePath: page.path,
          chunks: page.chunks,
          selection,
          ...options,
        })
        await streamIntoThread(prompt)
      }
    } catch (error) {
      if (turn === turnRef.current) setError(explainEngineError(error))
    } finally {
      if (turn === turnRef.current) setActivity('idle')
    }
  }

  const onDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    )
      return
    event.preventDefault()
    send(draft)
  }

  const resizeDraft = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`
  }

  const startPanelResize = (
    event: PointerEvent<HTMLDivElement>,
    edge: ResizeEdge,
  ) => {
    if (!event.isPrimary || event.button !== 0) return
    const panel = panelRef.current
    if (!panel) return
    event.preventDefault()
    const rect = panel.getBoundingClientRect()
    resizeRef.current = {
      pointerId: event.pointerId,
      edge,
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }
    setActiveResizeEdge(edge)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const movePanelResize = (event: PointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current
    if (!resize || resize.pointerId !== event.pointerId) return
    event.preventDefault()
    setPanelRect(
      resizePanelRect(
        resize,
        resize.edge,
        event.clientX - resize.x,
        event.clientY - resize.y,
        { width: window.innerWidth, height: window.innerHeight },
      ),
    )
  }

  const endPanelResize = (event: PointerEvent<HTMLDivElement>) => {
    if (resizeRef.current?.pointerId !== event.pointerId) return
    resizeRef.current = null
    setActiveResizeEdge(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div data-page-bot data-pagefind-ignore>
      <FloatingActionButton
        ref={triggerRef}
        icon={<Icon name="robot-2-line" className="h-[15px] w-[15px]" />}
        label="阅读助手"
        onClick={() => setOpen(true)}
        hidden={open}
        className="z-drawer"
        aria-expanded={open}
        aria-controls={panelId}
      />

      {open ? (
        <dialog
          ref={panelRef}
          id={panelId}
          open
          aria-labelledby={titleId}
          style={
            panelRect
              ? { ...panelRect, right: 'auto', bottom: 'auto' }
              : undefined
          }
          className="fixed inset-auto start-auto end-auto top-auto left-auto right-5 bottom-5 z-drawer m-0 flex h-[min(34rem,calc(100dvh-6.5rem))] min-h-[min(18rem,calc(100dvh-6.5rem))] w-[min(22.5rem,calc(100vw-2.5rem))] min-w-[min(20rem,calc(100vw-2.5rem))] max-h-[calc(100dvh-6.5rem)] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border-0 bg-card p-0 text-card-foreground shadow-none sm:right-8 sm:bottom-8 sm:max-w-[calc(100vw-4rem)]"
        >
          {RESIZE_EDGES.map((edge) => (
            <div
              key={edge}
              aria-hidden="true"
              data-edge={edge}
              data-resizing={activeResizeEdge === edge || undefined}
              className={styles.resizeHandle}
              onPointerDown={(event) => startPanelResize(event, edge)}
              onPointerMove={movePanelResize}
              onPointerUp={endPanelResize}
              onPointerCancel={endPanelResize}
              onLostPointerCapture={endPanelResize}
            />
          ))}
          <header className="flex shrink-0 items-center justify-end gap-1 px-2 pt-2 pb-1">
            <h2 id={titleId} className="sr-only">
              阅读助手
            </h2>
            <button
              type="button"
              onClick={clearChat}
              disabled={messages.length === 0}
              className="type-caption h-8 rounded-md px-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              清空
            </button>
            <button
              type="button"
              aria-label="关闭阅读助手"
              onClick={closePanel}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon name="close-line" className="h-4 w-4" />
            </button>
          </header>

          <div
            ref={logRef}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-3"
          >
            {messages.length === 0 ? (
              <div className="type-meta text-muted-foreground">
                {gpuOk && includePageContext ? (
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => send(suggestion)}
                        disabled={busy}
                        className="type-caption rounded-full border border-input bg-muted px-3 py-1.5 text-foreground hover:bg-surface-hover disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : !gpuOk ? (
                  <p className="m-0 mt-3 text-foreground">
                    当前浏览器无法使用阅读助手。
                  </p>
                ) : null}
              </div>
            ) : (
              <ol className="m-0 flex list-none flex-col gap-3 p-0">
                {messages.map((message, index) =>
                  message.role === 'user' ? (
                    <li
                      key={`user-${index}`}
                      className="type-meta min-w-0 max-w-[85%] self-end rounded-lg bg-muted px-3 py-2 whitespace-pre-wrap wrap-anywhere"
                    >
                      {message.content}
                    </li>
                  ) : (
                    <AssistantTurn
                      key={`assistant-${index}`}
                      content={message.content}
                      isStreaming={
                        activity === 'generating' &&
                        index === messages.length - 1
                      }
                    />
                  ),
                )}
              </ol>
            )}

            {activity === 'loading' ? (
              <div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.max(4, Math.round(progress * 100))}%`,
                    }}
                  />
                </div>
                <p className="type-caption m-0 mt-2 text-muted-foreground">
                  正在准备…
                </p>
              </div>
            ) : null}
            {activity === 'generating' ? (
              <p className="type-caption m-0 text-muted-foreground">正在写…</p>
            ) : null}
            {error ? (
              <p className="type-caption m-0 text-destructive">{error}</p>
            ) : null}
          </div>

          <form
            className="shrink-0 px-3 pt-2 pb-3"
            onSubmit={(event) => {
              event.preventDefault()
              send(draft)
            }}
          >
            <div className="rounded-xl border border-input bg-muted p-2 focus-within:ring-2 focus-within:ring-ring">
              <label className="sr-only" htmlFor={`${panelId}-input`}>
                向阅读助手提问
              </label>
              <textarea
                id={`${panelId}-input`}
                ref={inputRef}
                rows={1}
                value={draft}
                disabled={!gpuOk || busy}
                placeholder={
                  !gpuOk
                    ? '当前无法使用'
                    : includePageContext
                      ? '问这一页，或随便聊聊'
                      : '输入你的问题'
                }
                onChange={(event) => {
                  setDraft(event.target.value)
                  resizeDraft(event.target)
                }}
                onKeyDown={onDraftKeyDown}
                className="type-meta block max-h-32 min-h-8 w-full resize-none bg-transparent px-1 py-1 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    aria-pressed={includePageContext}
                    disabled={busy}
                    onClick={() => setIncludePageContext((value) => !value)}
                    className={`type-caption flex h-8 items-center gap-1 rounded-full border border-input px-2 disabled:opacity-50 ${
                      includePageContext
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                    }`}
                  >
                    <Icon name="article-line" className="h-3.5 w-3.5" />
                    参考本文
                  </button>
                </div>
                {busy ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="type-caption h-8 shrink-0 rounded-md border border-input bg-secondary px-3 text-secondary-foreground"
                  >
                    停止
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!gpuOk || draft.trim().length === 0}
                    className="type-caption h-8 shrink-0 rounded-md border border-input bg-primary px-3 text-primary-foreground disabled:opacity-50"
                  >
                    发送
                  </button>
                )}
              </div>
            </div>
          </form>
        </dialog>
      ) : null}
    </div>
  )
}

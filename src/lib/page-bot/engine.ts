import { REPLY_TOKENS, type PromptMessage } from './budget'
import { DEFAULT_CONTEXT_WINDOW, DEFAULT_MODEL_ID } from './model'

export interface EngineProgress {
  progress: number
  text: string
}

export interface PageBotEngine {
  modelId: string
  contextWindow: number
  generate: (
    messages: PromptMessage[],
    maxTokens?: number,
  ) => AsyncGenerator<string>
  stop: () => Promise<void>
  unload: () => Promise<void>
}

type ProgressListener = (progress: EngineProgress) => void

interface ModelListEntry {
  model_id: string
}

const listeners = new Set<ProgressListener>()

let current: PageBotEngine | null = null
let pending: Promise<PageBotEngine> | null = null

export function subscribeProgress(listener: ProgressListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getLoadedEngine() {
  return current
}

export function hasWebGPU() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export async function hasCachedModel() {
  const webllm = await import('@mlc-ai/web-llm')
  return webllm.hasModelInCache(DEFAULT_MODEL_ID)
}

export function loadEngine() {
  if (current) return Promise.resolve(current)
  if (!pending) {
    pending = createEngine()
      .then((engine) => {
        current = engine
        return engine
      })
      .catch((error: unknown) => {
        pending = null
        throw error
      })
  }
  return pending
}

export async function unloadEngine() {
  const engine = current
  current = null
  pending = null
  if (engine) await engine.unload()
}

async function createEngine(): Promise<PageBotEngine> {
  const webllm = await import('@mlc-ai/web-llm')
  const record = resolveModel(webllm.prebuiltAppConfig.model_list)

  const engine = await webllm.CreateMLCEngine(
    record.model_id,
    {
      logLevel: 'WARN',
      initProgressCallback: (report) => {
        const progress = {
          progress: report.progress,
          text: report.text,
        }
        for (const listener of listeners) listener(progress)
      },
    },
    { context_window_size: DEFAULT_CONTEXT_WINDOW },
  )

  console.info('[page-bot] engine ready')

  return {
    modelId: record.model_id,
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    async *generate(messages, maxTokens = REPLY_TOKENS) {
      const stream = await engine.chat.completions.create({
        messages,
        stream: true,
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: maxTokens,
        repetition_penalty: 1.05,
      })
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (typeof delta === 'string' && delta.length > 0) yield delta
      }
    },
    stop() {
      return engine.interruptGenerate()
    },
    unload() {
      return engine.unload()
    },
  }
}

export function resolveModel(modelList: ModelListEntry[]) {
  const record = modelList.find((item) => item.model_id === DEFAULT_MODEL_ID)
  if (!record) {
    throw new Error('预置模型列表里没有可用的阅读助手模型')
  }
  return record
}

export function explainEngineError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (/webgpu|gpu|adapter|device/i.test(message)) {
    return '当前浏览器无法使用阅读助手。'
  }
  if (/fetch|network|failed to load|404/i.test(message)) {
    return '助手暂时没能准备好，请稍后再试。'
  }
  if (/context window|exceed|prompt tokens/i.test(message)) {
    return '这个问题太长了，换短一些再试。'
  }
  return '这次没有回答出来，可以再试一次。'
}

export function isContextOverflow(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /context window|prompt tokens exceed|maximum context/i.test(message)
}

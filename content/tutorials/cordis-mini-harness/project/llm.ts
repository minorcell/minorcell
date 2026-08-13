import { Service, type Context } from 'cordis'

declare module 'cordis' {
  interface Context {
    llm: LlmService
  }
}

export interface LlmConfig {
  model?: string
  baseUrl?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
}

export class LlmService extends Service {
  config: Required<LlmConfig>

  constructor(ctx: Context, config: LlmConfig = {}) {
    super(ctx, 'llm')
    this.config = {
      model: config.model ?? 'deepseek-v4-flash',
      baseUrl: config.baseUrl ?? 'https://api.deepseek.com',
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
      }),
    })
    if (!res.ok) {
      throw new Error(`LLM 调用失败：${res.status} ${await res.text()}`)
    }
    const data = await res.json()
    return data.choices[0].message.content as string
  }
}

export const name = 'mini-llm'

export function apply(ctx: Context, config?: LlmConfig) {
  ctx.plugin(LlmService, config)
}

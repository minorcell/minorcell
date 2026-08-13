import { Service, type Context } from 'cordis'
import type { ChatMessage } from './llm.js'

declare module 'cordis' {
  interface Context {
    agent: AgentService
  }
  interface Events {
    'agent/step'(step: AgentStep): void
    'prompt/build'(base: string, next: () => Promise<string>): Promise<string>
  }
}

export type AgentStep =
  | { type: 'tool'; tool: string; args: Record<string, unknown>; result: string }
  | { type: 'answer'; answer: string }

const BASE_PROMPT = '你是一个可以调用工具的 agent。'

function parseJson(text: string): Record<string, any> | null {
  const stripped = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
  try {
    return JSON.parse(stripped)
  } catch {
    return null
  }
}

export class AgentService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'agent')
  }

  async buildPrompt(): Promise<string> {
    return this.ctx.waterfall('prompt/build', BASE_PROMPT, async () => BASE_PROMPT)
  }

  async run(prompt: string, maxTurns = 5): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: await this.buildPrompt() },
      { role: 'user', content: prompt },
    ]

    for (let turn = 0; turn < maxTurns; turn++) {
      const reply = await this.ctx.llm.chat(messages)
      const parsed = parseJson(reply)

      if (!parsed) {
        return reply
      }
      if (parsed.answer) {
        this.ctx.emit('agent/step', { type: 'answer', answer: parsed.answer })
        return parsed.answer
      }
      if (parsed.tool) {
        const result = await this.ctx.tools.execute(parsed.tool, parsed.args)
        this.ctx.emit('agent/step', {
          type: 'tool',
          tool: parsed.tool,
          args: parsed.args ?? {},
          result,
        })
        messages.push({ role: 'assistant', content: reply })
        messages.push({ role: 'user', content: `工具结果：${result}` })
        continue
      }
      return reply
    }
    return '已达到最大循环轮数，任务中止。'
  }
}

export const name = 'mini-agent'
export const inject = ['llm', 'tools']

export function apply(ctx: Context) {
  ctx.plugin(AgentService)
}

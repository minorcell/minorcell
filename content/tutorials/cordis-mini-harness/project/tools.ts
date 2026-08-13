import { Service, type Context } from 'cordis'

declare module 'cordis' {
  interface Context {
    tools: ToolsService
  }
}

export interface Tool {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute(args: Record<string, unknown>): Promise<string> | string
}

export class ToolsService extends Service {
  private tools = new Map<string, Tool>()

  constructor(ctx: Context) {
    super(ctx, 'tools')
  }

  register(tool: Tool) {
    this.tools.set(tool.name, tool)
  }

  describe(): string {
    return [...this.tools.values()]
      .map(
        (tool) =>
          `- ${tool.name}：${tool.description}，参数 ${JSON.stringify(tool.parameters)}`,
      )
      .join('\n')
  }

  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name)
    if (!tool) throw new Error(`未知工具：${name}`)
    return await tool.execute(args ?? {})
  }
}

export const name = 'mini-tools'

export function apply(ctx: Context) {
  ctx.plugin(ToolsService)
}

import type { Context } from 'cordis'

export const name = 'mini-prompt'
export const inject = ['tools']

const RULES = `回答规则：
- 需要调用工具时，只输出一行 JSON：{"tool": "工具名", "args": {...}}
- 任务已经完成时，只输出一行 JSON：{"answer": "给用户的最终回答"}
- 不要输出 JSON 之外的任何内容。`

export function apply(ctx: Context) {
  ctx.on('prompt/build', async (base, next) => {
    const downstream = await next()
    return `${downstream}\n\n可用工具：\n${ctx.tools.describe()}\n\n${RULES}`
  })
}

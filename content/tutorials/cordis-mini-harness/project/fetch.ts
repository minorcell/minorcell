import type { Context } from 'cordis'

export const name = 'mini-fetch'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register({
    name: 'fetch',
    description: '请求一个 http/https URL 并返回状态码和文本内容',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '要请求的 URL' },
        method: { type: 'string', description: 'HTTP 方法，默认 GET' },
        body: { type: 'string', description: '请求体（JSON 字符串，可选）' },
      },
      required: ['url'],
    },
    async execute(args) {
      const url = String(args.url ?? '')
      const method = String(args.method ?? 'GET')
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: args.body ? String(args.body) : undefined,
      })
      const text = await res.text()
      return `${res.status}\n${text.slice(0, 2000)}`
    },
  })
}

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import type { Context } from 'cordis'

const execAsync = promisify(exec)

export const name = 'mini-bash'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register({
    name: 'bash',
    description: '执行一条 shell 命令并返回输出（仅限本机，超时 10 秒）',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的命令' },
      },
      required: ['command'],
    },
    async execute(args) {
      const command = String(args.command ?? '')
      try {
        const { stdout, stderr } = await execAsync(command, { timeout: 10_000 })
        return (stdout + stderr).trim() || '(无输出)'
      } catch (error) {
        return `命令执行失败：${(error as Error).message}`
      }
    },
  })
}

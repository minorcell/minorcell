interface Params {
  command: string
  timeout?: number
}

// 示例省略 import：默认 detectDanger / confirmFromUser / truncateOutput 已可用
export async function bash({
  command,
  timeout = 30_000,
}: Params): Promise<string> {
  // 危险命令检测：block 直接拒绝，confirm 等用户确认
  const danger = detectDanger(command)

  if (danger === 'block') {
    return `拒绝执行：该命令已被自动阻止（高风险操作）。\n命令：${command}`
  }

  if (danger === 'confirm') {
    const approved = await confirmFromUser(command)
    if (!approved) {
      return `用户拒绝执行命令：${command}`
    }
  }

  // 执行命令
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let stdout = ''
  let stderr = ''
  let exitCode = 0

  try {
    const proc = Bun.spawn(['sh', '-c', command], {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    controller.signal.addEventListener('abort', () => proc.kill())
    ;[stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ])
    exitCode = await proc.exited
  } catch (e) {
    return `执行失败：${(e as Error).message}`
  } finally {
    clearTimeout(timer)
  }

  // 整合输出
  const parts: string[] = []
  if (stdout) parts.push(stdout)
  if (stderr) parts.push(`[stderr]\n${stderr}`)
  if (exitCode !== 0) parts.push(`[exit code: ${exitCode}]`)

  const output = parts.join('\n').trim() || '(无输出)'

  return truncateOutput('bash', output)
}

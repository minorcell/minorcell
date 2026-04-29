export async function bash({
  command,
  timeout = 30_000,
}: {
  command: string
  timeout?: number
}): Promise<string> {
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

  try {
    const proc = Bun.spawn(['sh', '-c', command], {
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const timer = setTimeout(() => proc.kill(), timeout)
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    clearTimeout(timer)

    const output =
      [
        stdout,
        stderr && `[stderr]\n${stderr}`,
        exitCode !== 0 && `[exit code: ${exitCode}]`,
      ]
        .filter(Boolean)
        .join('\n')
        .trim() || '(无输出)'

    return truncateOutput('bash', output)
  } catch (e) {
    return `执行失败：${(e as Error).message}`
  }
}

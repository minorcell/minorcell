const PROMPT_FILE = '../SYSTEM_PROMPT.md'

export async function assembleSystemPrompt(
  runtimeHints: string[] = [],
): Promise<string> {
  const segments: string[] = []

  // Segment 1: 静态指令
  segments.push(await Bun.file(new URL(PROMPT_FILE, import.meta.url)).text())

  // Segment 2: 运行时状态（有则注入）
  if (runtimeHints.length > 0) {
    segments.push('---\n# 运行时状态\n\n' + runtimeHints.join('\n\n'))
  }

  return segments.join('\n\n')
}

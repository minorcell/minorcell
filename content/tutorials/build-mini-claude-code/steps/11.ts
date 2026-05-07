const PROMPT_FILE = '../SYSTEM_PROMPT.md'

export async function assembleSystemPrompt(
  runtimeHints: string[] = [],
): Promise<string> {
  const staticPrompt = await Bun.file(
    new URL(PROMPT_FILE, import.meta.url),
  ).text()
  const segments = [staticPrompt]

  if (runtimeHints.length > 0) {
    segments.push('---\n# 运行时状态\n\n' + runtimeHints.join('\n\n'))
  }

  return segments.join('\n\n')
}

const MAX_TOOL_OUTPUT = 8_000

export function truncateOutput(toolName: string, output: string): string {
  if (output.length <= MAX_TOOL_OUTPUT) return output

  const truncated = output.slice(0, MAX_TOOL_OUTPUT)

  const hint = [
    '',
    `<system_hint type="tool_output_omitted" tool="${toolName}" reason="too_long"`,
    `             actual_chars="${output.length}" max_chars="${MAX_TOOL_OUTPUT}">`,
    `  工具输出过长，已自动截断。如需完整内容，请用 offset/limit 参数分段调用。`,
    `</system_hint>`,
  ].join('\n')

  return truncated + hint
}

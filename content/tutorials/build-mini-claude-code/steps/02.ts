function parseAssistant(content: string): ParsedAssistant {
  const actionMatch = content.match(
    /<action[^>]*tool="([^"]+)"[^>]*>([\s\S]*?)<\/action>/i,
  )
  const finalMatch = content.match(/<final>([\s\S]*?)<\/final>/i)

  return {
    action: actionMatch
      ? {
          tool: actionMatch[1],
          input: actionMatch[2]?.trim() ?? '',
        }
      : undefined,
    final: finalMatch?.[1]?.trim(),
  }
}

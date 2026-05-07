type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ParsedAssistant = {
  action?: { tool: string; input: string }
  final?: string
}

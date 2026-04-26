type Role = 'system' | 'user' | 'assistant'

type ChatMessage = {
  role: Role
  content: string
}

type ParsedAssistant = {
  action?: { tool: string; input: string }
  final?: string
}

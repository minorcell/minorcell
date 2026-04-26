type Role = 'system' | 'user' | 'assistant'

type ChatMessage = {
  role: Role
  content: string
}

type ParsedAssistant = {
  action?: { tool: string; input: string }
  final?: string
}

type DeepSeekMessage = { content?: string }
type DeepSeekChoice = { message?: DeepSeekMessage }
type DeepSeekResponse = { choices?: DeepSeekChoice[] }

// 示例里省略 import，默认 TOOLKIT / ToolName 来自 tools.ts
type ToolName = 'getWeather' | 'getTime'
declare const TOOLKIT: Record<ToolName, (input: string) => Promise<string>>

async function callLLMs(messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.35,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API 错误: ${res.status} ${text}`)
  }

  const data = (await res.json()) as DeepSeekResponse
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new Error('返回内容为空')
  }
  return content
}

function parseAssistant(content: string): ParsedAssistant {
  const actionMatch = content.match(
    /<action[^>]*tool="([^"]+)"[^>]*>([\s\S]*?)<\/action>/i,
  )
  const finalMatch = content.match(/<final>([\s\S]*?)<\/final>/i)

  const parsed: ParsedAssistant = {}
  if (actionMatch) {
    parsed.action = {
      tool: actionMatch[1],
      input: actionMatch[2]?.trim() ?? '',
    }
  }
  if (finalMatch) {
    parsed.final = finalMatch[1]?.trim()
  }

  return parsed
}

async function AgentLoop(question: string) {
  const systemPrompt = await Bun.file('prompt.md').text()

  const history: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ]

  for (let step = 0; step < 10; step++) {
    const assistantText = await callLLMs(history)
    console.log(`\n[LLM 第 ${step + 1} 轮输出]\n${assistantText}\n`)
    history.push({ role: 'assistant', content: assistantText })

    const parsed = parseAssistant(assistantText)

    if (parsed.final) {
      return parsed.final
    }

    // 新增：模型触发 action 时，执行工具并回填 observation
    if (parsed.action) {
      const toolFn = TOOLKIT[parsed.action.tool as ToolName]
      let observation: string

      if (toolFn) {
        observation = await toolFn(parsed.action.input)
      } else {
        observation = `未知工具: ${parsed.action.tool}`
      }

      console.log(`<observation>${observation}</observation>\n`)

      history.push({
        role: 'user',
        content: `<observation>${observation}</observation>`,
      })
      continue
    }

    break
  }

  return '未能生成最终回答，请重试或调整问题。'
}

// 新增：CLI 入口
async function main() {
  const userQuestion = process.argv.slice(2).join(' ') || '上海现在天气如何？'
  console.log(`用户问题: ${userQuestion}`)

  try {
    const answer = await AgentLoop(userQuestion)
    console.log('\n=== 最终回答 ===')
    console.log(answer)
  } catch (err) {
    console.error(`运行失败: ${(err as Error).message}`)
  }
}

await main()

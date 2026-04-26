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

    break // 工具调用暂时跳过
  }

  return '未能生成最终回答，请重试或调整问题。'
}

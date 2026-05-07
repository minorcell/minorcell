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

    break
  }

  return '未能生成最终回答，请重试或调整问题。'
}

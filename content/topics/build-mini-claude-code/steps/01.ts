type DeepSeekMessage = { content?: string }
type DeepSeekChoice = { message?: DeepSeekMessage }
type DeepSeekResponse = { choices?: DeepSeekChoice[] }

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

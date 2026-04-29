export async function agentLoop(
  question: string,
  history: CoreMessage[],
  runtimeHints: string[] = [],
): Promise<{
  text: string
  responseMessages: CoreMessage[]
  usage: LanguageModelUsage
  stepCount: number
}> {
  const system = await assembleSystemPrompt(runtimeHints)

  const messages: CoreMessage[] = [
    ...history,
    { role: 'user', content: question },
  ]

  const result = await generateText({
    model,
    system,
    messages,
    tools: TOOLS,
    maxSteps: 50,

    onStepFinish(step) {
      const { toolCalls, finishReason } = step
      const isFinalStep = finishReason === 'stop' && toolCalls.length === 0
      if (!isFinalStep) {
        printStep(step)
      }
    },
  })

  const stepCount = result.steps.length
  if (stepCount > 1) {
    console.log(`\n\x1b[90m[共执行 ${stepCount} 步]\x1b[0m\n`)
  }

  return {
    text: result.text,
    responseMessages: result.response.messages as CoreMessage[],
    usage: result.usage,
    stepCount,
  }
}

let stepCounter = 0

function printStep({
  text,
  toolCalls,
}: {
  text: string
  toolCalls: Array<{ toolName: string; args: unknown }>
}) {
  console.log(`\n── Step ${++stepCounter} ──`)

  if (text.trim()) {
    console.log(text.trim())
  }

  for (const call of toolCalls) {
    console.log(`${call.toolName} ${JSON.stringify(call.args)}`)
  }
}

export function resetStepCounter() {
  stepCounter = 0
}

// 示例省略 import：默认 generateText / CoreMessage / model / TOOLS 已可用

export interface RunResult {
  text: string
  responseMessages: CoreMessage[]
  usage: LanguageModelUsage
  stepCount: number
}

export async function agentLoop(
  question: string,
  history: CoreMessage[],
  runtimeHints: string[] = [],
): Promise<RunResult> {
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

    onStepFinish: ({ text, toolCalls, finishReason }) => {
      const isFinalStep = finishReason === 'stop' && toolCalls.length === 0
      if (!isFinalStep) {
        printStep({ text, toolCalls, finishReason })
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

interface StepInfo {
  text: string
  toolCalls: Array<{ toolName: string; args: unknown }>
}

let stepCounter = 0

function printStep({ text, toolCalls }: StepInfo) {
  stepCounter++
  console.log(
    `\n\x1b[36m── Step ${stepCounter} ──────────────────────────────────\x1b[0m`,
  )

  if (text.trim()) {
    console.log(`\x1b[37m${text.trim()}\x1b[0m`)
  }

  for (const call of toolCalls) {
    const argsOneLine = JSON.stringify(call.args)
    const argsPreview =
      argsOneLine.length > 120 ? argsOneLine.slice(0, 120) + '…}' : argsOneLine
    console.log(
      `\n\x1b[32m🔧 ${call.toolName}\x1b[0m \x1b[90m${argsPreview}\x1b[0m`,
    )
  }
}

export function resetStepCounter() {
  stepCounter = 0
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

let history: CoreMessage[] = []
let runtimeHints: string[] = []

function prompt() {
  rl.question('\n\x1b[34m> \x1b[0m', async (input) => {
    const question = input.trim()

    if (question === '/exit' || question === '/quit') {
      console.log('再见！')
      rl.close()
      return
    }

    if (question === '/reset') {
      history = []
      runtimeHints = []
      console.log('\x1b[90m[会话已重置]\x1b[0m')
      prompt()
      return
    }

    if (question === '/help') {
      printHelp()
      prompt()
      return
    }

    if (!question) {
      prompt()
      return
    }

    resetStepCounter()

    try {
      await runTurn(question)
    } catch (e) {
      console.error(`\n\x1b[31m[错误] ${(e as Error).message}\x1b[0m`)
    }

    prompt()
  })
}

async function runTurn(question: string) {
  const { text, responseMessages, usage, stepCount } = await agentLoop(
    question,
    history,
    runtimeHints,
  )

  history.push({ role: 'user', content: question }, ...responseMessages)

  if (stepCount > 1) console.log('\n── 最终回答 ──')
  console.log(text)

  if (!shouldCompress(usage.promptTokens)) return

  console.log('\n[上下文接近上限，正在压缩...]')
  const summary = await compressHistory(history)
  history = []
  runtimeHints = [buildCompressionHint(summary)]
  console.log('[上下文已压缩，下次对话继续]')
}

function printHelp() {
  console.log(`
\x1b[1mmini-claude-code\x1b[0m — 教学用 Code Agent

\x1b[1m可用命令：\x1b[0m
  /reset   清空当前会话历史，重新开始
  /exit    退出
  /help    显示此帮助

\x1b[1m可用工具：\x1b[0m
  read_file   读取文件
  write_file  写入文件
  edit_file   局部编辑文件
  bash        执行 Shell 命令
  web_fetch   抓取网页内容
`)
}

console.log(
  `\x1b[1mmini-claude-code\x1b[0m \x1b[90mv0.1.0 — 输入 /help 查看帮助\x1b[0m\n`,
)
prompt()

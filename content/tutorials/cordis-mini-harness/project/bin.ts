import { Context } from 'cordis'
import * as readline from 'node:readline/promises'
import * as llm from './llm.js'
import * as tools from './tools.js'
import * as bash from './bash.js'
import * as fetchTool from './fetch.js'
import * as search from './search.js'
import * as prompt from './prompt.js'
import * as agent from './agent.js'

const tracer = {
  name: 'tracer',
  apply(ctx: Context) {
    ctx.on('agent/step', (step) => {
      if (step.type === 'tool') {
        console.log(`  [tool] ${step.tool}(${JSON.stringify(step.args)}) => ${step.result}`)
      }
    })
  },
}

const app = new Context()

await app.plugin(llm)
await app.plugin(tools)
await app.plugin(bash)
await app.plugin(fetchTool)
await app.plugin(search)
await app.plugin(prompt)
await app.plugin(agent)
await app.plugin(tracer)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log('mini harness 已就绪，输入 exit 退出。')
while (true) {
  const line = await rl.question('> ')
  if (!line.trim()) continue
  if (line === 'exit') break
  const reply = await app.agent.run(line)
  console.log(reply)
}
rl.close()

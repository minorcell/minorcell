if (!process.env.QINIU_API_KEY) {
  throw new Error('缺少环境变量 QINIU_API_KEY，请参考 .env.example 配置')
}

const qiniu = createOpenAI({
  apiKey: process.env.QINIU_API_KEY,
  baseURL: 'https://api.qnaigc.com/v1',
  compatibility: 'compatible',
})

const modelName = process.env.QINIU_MODEL ?? 'claude-4.6-sonnet'

export const model = qiniu(modelName)

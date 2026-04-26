if (!process.env.QINIU_API_KEY) {
  throw new Error('缺少环境变量 QINIU_API_KEY，请参考 .env.example 配置')
}

// 示例省略 import：默认 createOpenAI 已可用

// 七牛大模型推理服务，兼容 OpenAI 协议
const qiniu = createOpenAI({
  apiKey: process.env.QINIU_API_KEY,
  baseURL: 'https://api.qnaigc.com/v1',
  // 兼容模式：不发送 OpenAI 专属字段，避免第三方接口报错
  compatibility: 'compatible',
})

const modelName = process.env.QINIU_MODEL ?? 'claude-4.6-sonnet'

export const model = qiniu(modelName)

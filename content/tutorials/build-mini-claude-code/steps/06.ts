export const TOOLS = {
  read_file: tool({
    description: '读取文件内容，支持 offset/limit 分段读取。',
    parameters: z.object({
      path: z.string(),
      offset: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: readFile,
  }),

  write_file: tool({
    description: '创建或完整覆盖文件；局部修改优先用 edit_file。',
    parameters: z.object({
      path: z.string(),
      content: z.string(),
    }),
    execute: writeFile,
  }),

  edit_file: tool({
    description: '替换唯一匹配的 old_string，适合局部修改。',
    parameters: z.object({
      path: z.string(),
      old_string: z.string(),
      new_string: z.string(),
    }),
    execute: editFile,
  }),

  bash: tool({
    description: '执行 Shell 命令；危险命令会触发确认或拒绝。',
    parameters: z.object({
      command: z.string(),
      timeout: z.number().optional(),
    }),
    execute: bash,
  }),

  web_fetch: tool({
    description: '抓取网页并返回 Markdown，适合查阅文档。',
    parameters: z.object({
      url: z.string(),
    }),
    execute: webFetch,
  }),
}

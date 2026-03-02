import type { Metadata } from 'next'
import Link from 'next/link'

const PACKAGE_NAME = '@mcell/mcell-mcp-server'
const REPO_URL = 'https://github.com/minorcell/mcell-mcp-server'

export const metadata: Metadata = {
  title: 'mcell MCP Server',
  description: 'mcell-mcp-server 接入方式、能力说明与配置示例',
}

const guides = [
  {
    title: 'Codex CLI',
    subtitle: '推荐，直接通过 codex 命令行添加',
    snippet: `codex mcp add mcell -- npx -y ${PACKAGE_NAME}`,
  },
  {
    title: 'Claude Code',
    subtitle: 'CLI 添加示例（不同版本参数可能有差异）',
    snippet: `claude mcp add mcell -- npx -y ${PACKAGE_NAME}`,
  },
  {
    title: 'Memo Code',
    subtitle: 'CLI 添加示例（与 Codex 风格一致）',
    snippet: `memo mcp add mcell -- npx -y ${PACKAGE_NAME}`,
  },
  {
    title: '标准 MCP 配置',
    subtitle: '适用于支持 mcpServers 的通用客户端（JSON 片段）',
    snippet: `{
  "mcpServers": {
    "mcell": {
      "command": "npx",
      "args": ["-y", "${PACKAGE_NAME}"],
      "env": {
        "AWS_REGION": "us-east-1",
        "MCELL_CONTENT_INDEX_URL": "https://stack.mcell.top/mcp/index.json"
      }
    }
  }
}`,
  },
]

const toolsets = [
  {
    title: '内容工具（博客）',
    desc: '支持最新文章、分页列表、按 id/slug 读取正文、关键词搜索。',
  },
  {
    title: '图片处理',
    desc: '支持压缩（可选 resize）与多格式转换（jpeg/png/webp/avif 等）。',
  },
  {
    title: 'S3 上传',
    desc: '支持 AWS S3 与兼容 S3 的对象存储（如 MinIO / R2）。',
  },
]

const envExamples = [
  {
    title: '博客数据源（按需覆盖）',
    snippet: `MCELL_CONTENT_INDEX_URL=https://stack.mcell.top/mcp/index.json
MCELL_CONTENT_CACHE_DIR=~/.cache/mcell-mcp/content
MCELL_CONTENT_CACHE_TTL_SECONDS=1800
MCELL_CONTENT_REQUEST_TIMEOUT_SECONDS=20`,
  },
  {
    title: 'S3 凭证（按需）',
    snippet: `AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_SESSION_TOKEN=optional
AWS_REGION=us-east-1`,
  },
]

export default function StackMcpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block"
      >
        ← 返回首页
      </Link>

      <header className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight mb-3">
          Mcell MCP Server
        </h1>
        <p className="text-muted-foreground mb-3">
          <code>{PACKAGE_NAME}</code> 是一个基于 <code>stdio</code> 的 MCP
          Server，独立仓库维护于{' '}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            mcell-mcp-server
          </a>
          。
        </p>
        <p className="text-muted-foreground">
          关于 MCP 协议的详细介绍和规范，请参考
          <a
            href="https://modelcontextprotocol.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline ml-1"
          >
            What is the Model Context Protocol (MCP)?
          </a>
          。
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          快速接入
        </h2>
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
          <pre className="text-sm text-foreground overflow-x-auto">
            <code>{`codex mcp add mcell -- npx -y ${PACKAGE_NAME}`}</code>
          </pre>
        </div>
      </section>

      <hr className="section-divider" />

      <section className="mb-10">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          内置能力
        </h2>
        <div className="space-y-3">
          {toolsets.map((item) => (
            <article
              key={item.title}
              className="rounded-md border border-border/50 bg-muted/20 p-4"
            >
              <h3 className="text-foreground font-medium mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <hr className="section-divider" />

      <section className="mb-10">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          客户端配置
        </h2>
        <div className="space-y-0">
          {guides.map((guide) => (
            <article
              key={guide.title}
              className="py-4 border-b border-border/40 last:border-b-0"
            >
              <h3 className="text-foreground font-medium mb-1">
                {guide.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {guide.subtitle}
              </p>
              <pre className="bg-muted/40 border border-border/60 rounded-md p-3 text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                <code>{guide.snippet}</code>
              </pre>
            </article>
          ))}
        </div>
      </section>

      <hr className="section-divider" />

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          环境变量
        </h2>
        <div className="space-y-0">
          {envExamples.map((item) => (
            <article
              key={item.title}
              className="py-4 border-b border-border/40 last:border-b-0"
            >
              <h3 className="text-foreground font-medium mb-2">{item.title}</h3>
              <pre className="bg-muted/40 border border-border/60 rounded-md p-3 text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                <code>{item.snippet}</code>
              </pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

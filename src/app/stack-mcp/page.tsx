import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

const PACKAGE_NAME = '@mcell/mcell-mcp-server'
const REPO_URL = 'https://github.com/minorcell/mcell-mcp-server'

export const metadata: Metadata = buildPageMetadata({
  title: 'mcell MCP Server 接入指南',
  description:
    'mcell-mcp-server 的完整接入文档，包含 Codex/Claude/Memo 配置方式、能力说明、环境变量与 S3 上传实践。',
  path: '/stack-mcp',
  keywords: [
    'MCP Server',
    'Model Context Protocol',
    'Codex MCP',
    'Claude MCP',
    'mcell-mcp-server',
    'AI tools integration',
  ],
})

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
  {
    title: '任务通知',
    desc: '任务完成后推送系统通知或 Webhook（支持飞书、企业微信等渠道），可携带状态、摘要与耗时信息。',
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

const formatIsoDate = (value: Date) =>
  `${value.getFullYear()} · ${String(value.getMonth() + 1).padStart(2, '0')} · ${String(value.getDate()).padStart(2, '0')}`

const pad = (n: number) => String(n).padStart(2, '0')

const orbitron = {
  fontFamily: 'var(--font-orbitron), Georgia, serif',
} as const
const accentBlue = 'oklch(0.86 0.05 220)'

const codeStyle =
  'block whitespace-pre-wrap break-all font-mono text-[12.5px] leading-relaxed text-foreground/90 border-l border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pl-4 sm:pl-5'

export default function StackMcpPage() {
  return (
    <div className="mx-auto w-full px-6 pb-24 pt-14 sm:px-10 sm:pb-32 sm:pt-20 lg:px-16 xl:px-24">
      {/* MASTHEAD */}
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <div className="flex items-center gap-5">
            <span>SECTION §04 · TOOLING</span>
            <span className="hidden sm:inline">MCP SERVER</span>
          </div>
          <span>{formatIsoDate(new Date())}</span>
        </div>

        <h1
          className="m-0 mt-9 text-[clamp(2.8rem,9vw,7rem)] leading-[0.95] tracking-[-0.04em] text-pretty sm:text-balance"
          style={{ ...orbitron, fontWeight: 800 }}
        >
          MCP{' '}
          <span
            className="text-muted-foreground"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            &amp;
          </span>{' '}
          Stack
        </h1>

        <div className="mt-7 grid gap-4 sm:mt-9 sm:grid-cols-[220px_1fr] sm:gap-10">
          <div className="pt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span
              aria-hidden
              className="mr-2.5 inline-block h-px w-6 bg-foreground align-middle"
            />
            INTEGRATION GUIDE
          </div>
          <p className="m-0 max-w-[58ch] text-[clamp(1.05rem,1rem+0.5vw,1.3rem)] leading-[1.55] tracking-[-0.005em]">
            <code className="font-mono text-[0.95em]">{PACKAGE_NAME}</code>{' '}
            是一个基于 stdio 的 MCP Server，独立仓库维护于{' '}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-0.5 hover:border-[color:oklch(0.86_0.05_220)] hover:text-[color:oklch(0.86_0.05_220)] hover:opacity-100"
            >
              mcell-mcp-server
            </a>
            。MCP 协议详细规范见{' '}
            <a
              href="https://modelcontextprotocol.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-0.5 hover:border-[color:oklch(0.86_0.05_220)] hover:text-[color:oklch(0.86_0.05_220)] hover:opacity-100"
            >
              modelcontextprotocol.io
            </a>
            。
          </p>
        </div>
      </header>

      {/* QUICK START */}
      <section className="mt-20 sm:mt-24">
        <div className="mb-6 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
          <h2
            className="m-0 text-[clamp(1.4rem,1.1rem+1.2vw,1.9rem)] tracking-[-0.02em]"
            style={{ ...orbitron, fontWeight: 700 }}
          >
            Quick Start
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            ONE-LINER · 一行接入
          </span>
        </div>
        <div className="grid items-start gap-5 py-2 sm:grid-cols-[64px_1fr] sm:gap-7">
          <span
            className="text-muted-foreground"
            style={{
              ...orbitron,
              fontWeight: 500,
              fontSize: 'clamp(1.4rem, 1.2rem + 0.5vw, 1.8rem)',
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.05,
            }}
          >
            00
          </span>
          <pre className="m-0 overflow-x-auto">
            <code className={codeStyle}>
              {`codex mcp add mcell -- npx -y ${PACKAGE_NAME}`}
            </code>
          </pre>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="mt-20 sm:mt-24">
        <div className="mb-2 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
          <h2
            className="m-0 text-[clamp(1.4rem,1.1rem+1.2vw,1.9rem)] tracking-[-0.02em]"
            style={{ ...orbitron, fontWeight: 700 }}
          >
            Capabilities
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {toolsets.length} TOOLSETS
          </span>
        </div>
        <ol className="m-0 list-none p-0 lg:grid lg:grid-cols-2">
          {toolsets.map((item, idx) => {
            const isLeftCol = idx % 2 === 0
            return (
              <li
                key={item.title}
                className={`border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] last:border-b-0 ${
                  !isLeftCol
                    ? 'lg:border-l lg:border-[color:color-mix(in_oklab,var(--border)_70%,transparent)]'
                    : ''
                }`}
              >
                <article
                  className={`grid items-start gap-5 py-7 sm:gap-7 sm:py-8 ${
                    !isLeftCol ? 'lg:pl-10' : 'lg:pr-10'
                  }`}
                  style={{ gridTemplateColumns: '52px 1fr' }}
                >
                  <span
                    className="text-muted-foreground"
                    style={{
                      ...orbitron,
                      fontWeight: 500,
                      fontSize: '1.4rem',
                      letterSpacing: '-0.01em',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.05,
                    }}
                  >
                    {pad(idx + 1)}
                  </span>
                  <div>
                    <h3
                      className="m-0 text-[clamp(1.15rem,1.05rem+0.4vw,1.35rem)] leading-[1.25] tracking-[-0.005em]"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontWeight: 500,
                      }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </section>

      {/* CLIENT CONFIG */}
      <section className="mt-20 sm:mt-24">
        <div className="mb-2 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
          <h2
            className="m-0 text-[clamp(1.4rem,1.1rem+1.2vw,1.9rem)] tracking-[-0.02em]"
            style={{ ...orbitron, fontWeight: 700 }}
          >
            Client Config
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {guides.length} CLIENTS
          </span>
        </div>
        <ol className="m-0 list-none p-0">
          {guides.map((guide, idx) => (
            <li
              key={guide.title}
              className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] last:border-b-0"
            >
              <article
                className="grid items-start gap-5 py-8 sm:gap-7"
                style={{ gridTemplateColumns: '64px 1fr' }}
              >
                <span
                  className="text-muted-foreground"
                  style={{
                    ...orbitron,
                    fontWeight: 500,
                    fontSize: 'clamp(1.3rem, 1.1rem + 0.5vw, 1.7rem)',
                    letterSpacing: '-0.01em',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.05,
                  }}
                >
                  {pad(idx + 1)}
                </span>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3
                      className="m-0 text-[clamp(1.2rem,1.05rem+0.5vw,1.5rem)] leading-[1.25] tracking-[-0.01em]"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontWeight: 500,
                      }}
                    >
                      {guide.title}
                    </h3>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      · {guide.subtitle}
                    </span>
                  </div>
                  <pre className="mt-4 overflow-x-auto">
                    <code className={codeStyle}>{guide.snippet}</code>
                  </pre>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      {/* ENV */}
      <section className="mt-20 sm:mt-24">
        <div className="mb-2 flex items-baseline justify-between border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pb-3.5">
          <h2
            className="m-0 text-[clamp(1.4rem,1.1rem+1.2vw,1.9rem)] tracking-[-0.02em]"
            style={{ ...orbitron, fontWeight: 700 }}
          >
            Environment
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            ENV VARS
          </span>
        </div>
        <ol className="m-0 list-none p-0">
          {envExamples.map((item, idx) => (
            <li
              key={item.title}
              className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] last:border-b-0"
            >
              <article
                className="grid items-start gap-5 py-8 sm:gap-7"
                style={{ gridTemplateColumns: '64px 1fr' }}
              >
                <span
                  className="text-muted-foreground"
                  style={{
                    ...orbitron,
                    fontWeight: 500,
                    fontSize: 'clamp(1.3rem, 1.1rem + 0.5vw, 1.7rem)',
                    letterSpacing: '-0.01em',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.05,
                  }}
                >
                  {pad(guides.length + idx + 1)}
                </span>
                <div className="min-w-0">
                  <h3
                    className="m-0 text-[clamp(1.15rem,1.05rem+0.4vw,1.35rem)] leading-[1.25] tracking-[-0.005em]"
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontWeight: 500,
                    }}
                  >
                    {item.title}
                  </h3>
                  <pre className="mt-4 overflow-x-auto">
                    <code className={codeStyle}>{item.snippet}</code>
                  </pre>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mt-20 flex flex-wrap justify-end gap-5 sm:mt-24">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-1 font-mono text-[12px] uppercase tracking-[0.18em] transition-colors hover:opacity-100"
          style={{ color: accentBlue, borderColor: accentBlue }}
        >
          GITHUB ↗
        </a>
        <a
          href="https://www.npmjs.com/package/@mcell/mcell-mcp-server"
          target="_blank"
          rel="noopener noreferrer"
          className="border-b border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pb-1 font-mono text-[12px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-[color:oklch(0.86_0.05_220)] hover:text-[color:oklch(0.86_0.05_220)] hover:opacity-100"
        >
          NPM ↗
        </a>
      </section>
    </div>
  )
}

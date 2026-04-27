export type ProjectStatus = 'active' | 'maintained' | 'archived'

export interface ProjectLink {
  label: string
  href: string
}

export interface ProjectItem {
  name: string
  summary: string
  status: ProjectStatus
  tags?: string[]
  links: ProjectLink[]
}

export interface ProjectGroup {
  title: string
  description?: string
  projects: ProjectItem[]
}

export const projectQuickLinks: ProjectLink[] = [
  {
    label: 'GitHub Profile',
    href: 'https://github.com/minorcell',
  },
  {
    label: 'Latest Repos',
    href: 'https://github.com/minorcell?tab=repositories&sort=updated',
  },
]

export const projectGroups: ProjectGroup[] = [
  {
    title: 'AI & Agent',
    description: 'AI 编码助手与相关工具链项目。',
    projects: [
      {
        name: 'memo-code',
        summary: 'A lightweight coding agent that runs in your terminal.',
        status: 'active',
        tags: ['TypeScript'],
        links: [
          {
            label: 'Open',
            href: 'https://memo.mcell.top/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/memo-code',
          },
        ],
      },
      {
        name: 'mini-claude-code',
        summary: '从零构建一个 Mini Claude Code（TypeScript）',
        status: 'active',
        tags: ['TypeScript'],
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/mini-claude-code',
          },
        ],
      },
      {
        name: 'aquaregia',
        summary:
          'Provider-agnostic Rust toolkit for building AI applications — unified API across OpenAI, Anthropic, Google, and OpenAI-compatible providers, with streaming, reasoning, and tool-loop support.',
        status: 'active',
        tags: ['Rust'],
        links: [
          {
            label: 'Docs',
            href: 'https://docs.rs/aquaregia/latest/aquaregia/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/aquaregia',
          },
        ],
      },
      {
        name: 'wwcchh0123/hackathonGO',
        summary: 'Let‘s do it ',
        status: 'active',
        tags: ['TypeScript', 'Fork'],
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/wwcchh0123/hackathonGO',
          },
        ],
      },
    ],
  },
  {
    title: 'Developer Tools',
    description: '面向开发者效率和工程实践的工具项目。',
    projects: [
      {
        name: 'kvslite',
        summary: '轻量级rust数据库',
        status: 'active',
        tags: ['Rust'],
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/kvslite',
          },
        ],
      },
      {
        name: 'goplus/builder',
        summary: 'XBuilder',
        status: 'active',
        tags: ['TypeScript', 'Fork'],
        links: [
          {
            label: 'Open',
            href: 'https://xbuilder.com',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/goplus/builder',
          },
        ],
      },
      {
        name: 'codepaintstudio/vuedir',
        summary:
          'VueDir is a lightweight library of custom directives for Vue.js.',
        status: 'active',
        tags: ['TypeScript', 'Fork'],
        links: [
          {
            label: 'Open',
            href: 'https://vuedir.feashow.cn/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/codepaintstudio/vuedir',
          },
        ],
      },
    ],
  },
  {
    title: 'Web Apps',
    description: '可直接访问的站点、应用与产品化 Demo。',
    projects: [
      {
        name: 'cellstack',
        summary: '计算机科学的工程实践和一些个人思考',
        status: 'active',
        tags: ['TypeScript'],
        links: [
          {
            label: 'Open',
            href: 'https://stack.mcell.top/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/cellstack',
          },
        ],
      },
      {
        name: 'perfedge',
        summary: 'PerfEdge 集Web性能优化学习、体验为主的开源知识库。',
        status: 'active',
        tags: ['TypeScript'],
        links: [
          {
            label: 'Open',
            href: 'https://perfedge.vercel.app',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/perfedge',
          },
        ],
      },
      {
        name: 'album',
        summary:
          'A cloud space system built on Next.js + Prisma + MySQL + TOS.',
        status: 'active',
        tags: ['TypeScript'],
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/album',
          },
        ],
      },
      {
        name: 'codepaintstudio/cp-email',
        summary: "CodePaintStudio's tool for send email easily.",
        status: 'active',
        tags: ['Vue', 'Fork'],
        links: [
          {
            label: 'Open',
            href: 'http://cpemail.hub.feashow.cn/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/codepaintstudio/cp-email',
          },
        ],
      },
      {
        name: 'dilidili',
        summary: 'B站视频下载器，支持扫码登陆、选择清晰度和视频下载',
        status: 'active',
        tags: ['TypeScript'],
        links: [
          {
            label: 'Open',
            href: 'https://dilidili.mcell.top/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/dilidili',
          },
        ],
      },
      {
        name: 'hub-io',
        summary: 'Access GitHub repository contributor information.',
        status: 'active',
        tags: ['TypeScript'],
        links: [
          {
            label: 'Open',
            href: 'https://hub-io-mcells-projects.vercel.app/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/hub-io',
          },
        ],
      },
      {
        name: 'mini-portfolio',
        summary:
          'This could be a proof of idea, or it could be an improvised demo.',
        status: 'active',
        tags: ['Vue'],
        links: [
          {
            label: 'Open',
            href: 'https://mini-portfolio-kohl.vercel.app',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/mini-portfolio',
          },
        ],
      },
    ],
  },
  {
    title: 'Learning & Labs',
    description: '学习、实验、课程与开源协作相关项目。',
    projects: [
      {
        name: 'qiniu/techcamp',
        summary:
          '1024 Techcamp：an open, hands-on platform where engineers grow through real projects, open-source collaboration, and architectural thinking. ',
        status: 'active',
        tags: ['TypeScript', 'Fork'],
        links: [
          {
            label: 'Open',
            href: 'https://qiniu.github.io/techcamp/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/qiniu/techcamp',
          },
        ],
      },
      {
        name: 'rustful',
        summary: '迟早要学，那不如现在就学。',
        status: 'active',
        tags: ['Rust'],
        links: [
          {
            label: 'Open',
            href: 'https://www.bilibili.com/video/BV1hp4y1k7SV',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/rustful',
          },
        ],
      },
      {
        name: 'codepaintstudio/back-end-learn',
        summary: '针对前端开发同学的全栈学习路线，主Node侧；',
        status: 'active',
        tags: ['JavaScript', 'Fork'],
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/codepaintstudio/back-end-learn',
          },
        ],
      },
      {
        name: 'liangdengwang/wetalk',
        summary: '专业综合实践项目，WeTalk，实时聊天室。',
        status: 'active',
        tags: ['TypeScript', 'Fork'],
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/liangdengwang/wetalk',
          },
        ],
      },
      {
        name: '1024-talent-rank',
        summary: '七牛云第三届1024创作节，作品《TalentRank》前端源码仓库',
        status: 'active',
        tags: ['JavaScript'],
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/1024-talent-rank',
          },
        ],
      },
    ],
  },
  {
    title: 'Creative Projects',
    description: '创意内容、作品赛和媒体类项目。',
    projects: [
      {
        name: 'cms-program',
        summary: '赴苍穹，问九天 ｜ 中国载人航天',
        status: 'active',
        links: [
          {
            label: 'Open',
            href: 'https://cms.mcell.top/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/cms-program',
          },
        ],
      },
      {
        name: 'minecraft-web',
        summary: 'minecraft-web',
        status: 'active',
        tags: ['JavaScript'],
        links: [
          {
            label: 'Open',
            href: 'http://craft.mcell.top/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/minecraft-web',
          },
        ],
      },
      {
        name: 'oil-paper-umbrella',
        summary: '2024全国大学生数字媒体与创新创意作品赛《泸州油纸伞》作品源码',
        status: 'active',
        tags: ['JavaScript'],
        links: [
          {
            label: 'Open',
            href: 'https://minorcell.github.io/oil-paper-umbrella/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/oil-paper-umbrella',
          },
        ],
      },
      {
        name: 'chuanyaosi',
        summary: 'ncda-2024作品赛仓库',
        status: 'active',
        links: [
          {
            label: 'Open',
            href: 'https://minorcell.github.io/chuanyaosi/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/chuanyaosi',
          },
        ],
      },
      {
        name: 'sileme-clone',
        summary:
          '使用 Expo + Supabase + Codex 十分钟复刻的“死了么”APP，仅供学习和 demo 使用。',
        status: 'active',
        tags: ['TypeScript'],
        links: [
          {
            label: 'Open',
            href: 'https://www.bilibili.com/video/BV1yEr4BJE8B',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/sileme-clone',
          },
        ],
      },
      {
        name: 'pick-quote',
        summary:
          '让每一次灵光乍现，都有处安放。 一款在浏览中快速收藏信息的轻量工具。',
        status: 'active',
        tags: ['TypeScript'],
        links: [
          {
            label: 'Open',
            href: 'https://minorcell.github.io/pick-quote/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/pick-quote',
          },
        ],
      },
    ],
  },
]

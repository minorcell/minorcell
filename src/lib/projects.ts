export type ProjectStatus = 'active' | 'maintained' | 'archived'

export interface ProjectLink {
  label: string
  href: string
}

export interface ProjectItem {
  name: string
  summary: string
  status: ProjectStatus
  links: ProjectLink[]
}

export interface ProjectGroup {
  title: string
  description?: string
  projects: ProjectItem[]
}

export const projectGroups: ProjectGroup[] = [
  {
    title: 'AI & Agent',
    description: 'AI 编码助手与相关工具链项目。',
    projects: [
      {
        name: 'mini-claude-code',
        summary: '从零构建一个 Mini Claude Code（TypeScript）',
        status: 'active',
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
          'Aquaregia gives you the agent loop — think → call tools → observe → repeat — so you do not write it yourself. One API. Any provider.',
        status: 'active',
        links: [
          {
            label: 'Open',
            href: 'https://aquaregia.mcell.top/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/aquaregia',
          },
        ],
      },
      {
        name: 'memo-code',
        summary: 'A lightweight coding agent that runs in your terminal.',
        status: 'active',
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
        name: 'minorcell-skill',
        summary:
          "A collection of skills distilled from minorcell's own workflows and useful practices from others.",
        status: 'active',
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/minorcell-skills',
          },
        ],
      },
      {
        name: 'wwcchh0123/hackathonGO',
        summary: 'Let‘s do it ',
        status: 'maintained',
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
        summary:
          'Rust 学习项目，一个轻量级嵌入式键值存储引擎，基于 Bitcask 模型实现。',
        status: 'archived',
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
        links: [
          {
            label: 'Open',
            href: 'https://builder.goplus.org',
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
        links: [
          {
            label: 'Open',
            href: 'https://codepaintstudio.github.io/vuedir/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/codepaintstudio/vuedir',
          },
        ],
      },
      {
        name: 'minorcell-theme-vscode',
        summary:
          'A minimal, customizable VS Code theme that follows the operating system appearance.',
        status: 'active',
        links: [
          {
            label: 'Open',
            href: 'https://marketplace.visualstudio.com/items?itemName=minorcell.minorcell-theme',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/minorcell-theme-vscode',
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
        name: 'minorcell',
        summary: '记录真实问题、技术选择，以及把想法做成产品的个人技术站。',
        status: 'active',
        links: [
          {
            label: 'Open',
            href: 'https://minorcell.top/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/minorcell',
          },
        ],
      },
      {
        name: 'perfedge',
        summary: 'PerfEdge 集Web性能优化学习、体验为主的开源知识库。',
        status: 'active',
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
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/minorcell/album',
          },
        ],
      },
      {
        name: 'hub-io',
        summary: 'Access GitHub repository contributor information.',
        status: 'active',
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
        name: 'pick-quote',
        summary:
          '让每一次灵光乍现，都有处安放。 一款在浏览中快速收藏信息的轻量工具。',
        status: 'maintained',
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
      {
        name: 'mini-portfolio',
        summary:
          'This could be a proof of idea, or it could be an improvised demo.',
        status: 'maintained',
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
        name: '1024XEngineer/techcamp',
        summary:
          '1024 Techcamp：an open, hands-on platform where engineers grow through real projects, open-source collaboration, and architectural thinking. ',
        status: 'active',
        links: [
          {
            label: 'Open',
            href: 'https://1024xengineer.github.io/techcamp/',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/1024XEngineer/techcamp',
          },
        ],
      },
      {
        name: 'rustful',
        summary: '迟早要学，那不如现在就学。',
        status: 'active',
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
        status: 'maintained',
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/codepaintstudio/back-end-learn',
          },
        ],
      },
      {
        name: '1024-talent-rank',
        summary: '七牛云第三届1024创作节，作品《TalentRank》前端源码仓库',
        status: 'maintained',
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
            href: 'https://minorcell.github.io/cms-program/',
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
        status: 'maintained',
        links: [
          {
            label: 'Open',
            href: 'https://minorcell.github.io/minecraft-web/',
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
    ],
  },
]

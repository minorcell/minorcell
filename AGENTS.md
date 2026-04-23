# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

CellStack is a static technical blog with a pixel-art aesthetic, built with Next.js 16 (App Router) and deployed to GitHub Pages. The site features MDX content, static search via Pagefind, and Giscus comments integration.

**Key Technologies:**
- Next.js 16.0.7 (App Router, static export mode)
- TypeScript 5
- Tailwind CSS 4
- MDX with next-mdx-remote (build-time compilation)
- Pagefind (static search)
- pnpm package manager

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build static site (outputs to ./out/)
pnpm build                # Runs next build + postbuild script
pnpm postbuild            # Runs pagefind indexing (automatic after build)

# Preview production build locally
pnpm start                # Serves the ./out/ directory

# Code quality
pnpm lint                 # Run ESLint
pnpm format               # Format code with Prettier
pnpm format:check         # Check formatting without writing
```

## Architecture

### Static Site Generation Model

This is a **fully static site** (no Node.js server at runtime):
- `output: 'export'` in [next.config.ts](next.config.ts) enables static HTML export
- All pages are pre-rendered at build time using `generateStaticParams()`
- Content (MDX/Markdown) is compiled to React at build time via server components
- Output goes to `./out/` directory (deployed to GitHub Pages)
- Pagefind creates a static search index post-build

### Content Organization

**Blog Posts** (`content/blog/`)
- Structure: Flat or nested (e.g., `content/blog/2025/01_article.md`)
- Files are discovered recursively by [src/lib/mdx.ts](src/lib/mdx.ts)
- Frontmatter: `title`, `date`, `description`, `tags`, `author`, `image`
- Routing: `/blog/[...slug]` (catch-all route in [src/app/blog/[...slug]/page.tsx](src/app/blog/[...slug]/page.tsx))

**Topics** (`content/topics/`)
- Structure: Topic folders with `index.md` + article files
  ```
  content/topics/
  └── topic-name/
      ├── index.md        # Topic intro (required)
      ├── article-1.md
      └── article-2.md
  ```
- Parsed by [src/lib/topics.server.ts](src/lib/topics.server.ts)
- Articles sorted by: `order` (frontmatter) > `date` > filename
- Routing: `/topics/[slug]/[article]` in [src/app/topics/[slug]/[article]/page.tsx](src/app/topics/[slug]/[article]/page.tsx)

### Key Utilities

**Content Parsing:**
- [src/lib/mdx.ts](src/lib/mdx.ts): Blog post parsing with gray-matter and recursive directory traversal
  - `getPostSlugs('blog')` - finds all `.md`/`.mdx` files
  - `getPostBySlug('blog', slug)` - reads and parses file with frontmatter
- [src/lib/topics.server.ts](src/lib/topics.server.ts): Topic-specific parsing (server-only, uses Node.js `fs`)
  - `getAllTopics()` - returns all topics with articles
  - `getTopic(slug)` - returns single topic with sorted articles
  - `getTopicArticle(topicSlug, articleSlug)` - returns article metadata + content

**MDX Rendering:**
- [src/components/MdxPre.tsx](src/components/MdxPre.tsx): Wraps code blocks, detects mermaid diagrams
- [src/components/CodeBlock.tsx](src/components/CodeBlock.tsx): Syntax highlighting with copy button (highlight.js)
- [src/components/MermaidBlock.tsx](src/components/MermaidBlock.tsx): Renders mermaid diagrams
- [src/components/ZoomImage.tsx](src/components/ZoomImage.tsx): Medium-style image zoom

**Search:**
- [src/components/PagefindSearch.tsx](src/components/PagefindSearch.tsx): Static search UI (loads `/pagefind/` index)
- Pagefind indexes the `./out/` directory after build completes
- Search is fully client-side (no backend required)

### Styling Architecture

**Pixel Art Theme:**
- Custom CSS variables in [src/app/globals.css](src/app/globals.css):
  - Pixel colors: `--pixel-purple`, `--pixel-cyan`, `--pixel-yellow`, etc.
  - Fonts: `--font-pixel` (Press Start 2P), `--font-body` (Ark Pixel), `--font-mono` (JetBrains Mono)
- Custom animations: `pixel-bounce`, `pixel-pulse`, `pixel-float`, `pixel-blink`
- Tailwind CSS 4 with `@theme` directive in globals.css

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in [tsconfig.json](tsconfig.json))
- Example: `import { cn } from '@/lib/utils'`

### Server vs Client Components

**Server Components** (default in App Router):
- All page routes (`page.tsx` files) - handle MDX compilation, content fetching
- Content parsing utilities (`mdx.ts`, `topics.server.ts`) - use Node.js `fs`

**Client Components** (`'use client'` directive):
- Interactive features: search, navigation menus, animations, Three.js effects
- [src/components/PagefindSearch.tsx](src/components/PagefindSearch.tsx)
- [src/components/Navbar.tsx](src/components/Navbar.tsx)
- [src/app/me/MeClientPage.tsx](src/app/me/MeClientPage.tsx)

**IMPORTANT:** Do not use Node.js APIs (`fs`, `path`, etc.) in client components. Keep file system operations in `.server.ts` files.

## Adding Content

**New Blog Post:**
1. Create `.md` or `.mdx` file in `content/blog/` (or nested folder like `content/blog/2025/`)
2. Add frontmatter:
   ```yaml
   ---
   title: 'Article Title'
   date: 2026-01-30
   description: 'Article description'
   tags: ['tag1', 'tag2']
   ---
   ```
3. Rebuild site with `pnpm build` (generates static pages + search index)

**New Topic or Topic Article:**
1. Create folder `content/topics/topic-slug/`
2. Add `index.md` with topic intro and frontmatter
3. Add article files (e.g., `article-name.md`)
4. Optional: Use `order: 1` in frontmatter to control article sequence
5. Rebuild site with `pnpm build`

## Deployment

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
- Triggers on push to `main` branch
- Uses pnpm v9 + Node 24
- Caches `.next` directory for faster builds
- Runs `pnpm install --frozen-lockfile && pnpm build`
- Deploys `./out/` to GitHub Pages

**Manual Deployment:**
```bash
pnpm build          # Creates ./out/ directory
# Upload ./out/ to any static host
```

## Critical Constraints

1. **No Dynamic Server Routes**: This is a static site. All routes must be pre-rendered at build time via `generateStaticParams()`.

2. **Content Changes Require Rebuild**: New articles don't appear until you run `pnpm build` and redeploy.

3. **Pagefind Index**: Search only includes pages present in `./out/` at build time. Run postbuild script after content changes.

4. **Image Optimization**: Images are unoptimized (`unoptimized: true` in next.config.ts) due to static export mode.

5. **Server-Only Imports**: Mark Node.js imports with `import 'server-only'` to prevent accidental client-side usage.

## Special Features

**Mermaid Diagrams:**
- Use code blocks with `mermaid` language: ` ```mermaid ... ``` `
- Auto-detected and rendered by [MdxPre.tsx](src/components/MdxPre.tsx)

**Comments System:**
- Giscus (GitHub Discussions) in [src/components/GiscusComments.tsx](src/components/GiscusComments.tsx)
- Each article gets a discussion thread by term: `blog/{slug}` or `topics/{topic}/{article}`

**Three.js Background:**
- [src/components/ThreeBackground.tsx](src/components/ThreeBackground.tsx) provides 3D effects on home page
- Client-side only, uses @react-three/fiber + drei

## Common Tasks

**Add a new shadcn/ui component:**
```bash
pnpm dlx shadcn@latest add [component-name]
# Components install to src/components/ui/
```

**Modify global styles:**
- Edit [src/app/globals.css](src/app/globals.css) for CSS variables, animations, Tailwind theme

**Change site metadata:**
- Edit root layout [src/app/layout.tsx](src/app/layout.tsx) for `<title>`, `<meta>` tags

**Debug build issues:**
```bash
rm -rf .next out         # Clean build artifacts
pnpm build               # Rebuild from scratch
```

## Technical Notes

- **React 19.2.0**: Uses latest React features (no legacy mode)
- **TypeScript strict mode**: All code is strictly typed
- **ESLint config**: Next.js recommended config (eslint-config-next)
- **Prettier**: Formats .ts, .tsx, .md, .mdx, .css, .json files
- **pnpm**: Uses pnpm workspace and lock file (faster than npm/yarn)

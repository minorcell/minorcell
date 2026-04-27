import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const root = process.cwd()
const topicsDir = path.join(root, 'content', 'topics')

export interface InteractiveTutorialMeta {
  title: string
  description: string
  type: 'interactive'
  entryFile?: string
}

export interface TutorialCodeStep {
  kind: 'code'
  code: string
  language: string
  highlightLines?: number[]
  fileName?: string
  prose: string
}

export interface TutorialImageStep {
  kind: 'image'
  src: string
  alt?: string
  prose: string
}

export type TutorialStep = TutorialCodeStep | TutorialImageStep

export interface InteractiveTutorial {
  slug: string
  title: string
  description: string
  intro: string
  steps: TutorialStep[]
}

/**
 * Parse highlight line notation like "1,3:5,10" into an array of line numbers [1,3,4,5,10]
 */
function parseHighlightLines(notation: string): number[] {
  const lines: number[] = []
  const parts = notation.split(',').map((s) => s.trim())
  for (const part of parts) {
    if (part.includes(':')) {
      const [start, end] = part.split(':').map(Number)
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          lines.push(i)
        }
      }
    } else {
      const n = Number(part)
      if (!isNaN(n)) lines.push(n)
    }
  }
  return lines
}

/**
 * Resolve a file= reference to actual file content.
 * Path is relative to the topic directory.
 */
function resolveFileRef(topicDir: string, filePath: string): string {
  const fullPath = path.join(topicDir, filePath)
  if (!fs.existsSync(fullPath)) {
    console.warn(`[interactive] File not found: ${fullPath}`)
    return `// File not found: ${filePath}`
  }
  return fs.readFileSync(fullPath, 'utf8')
}

/**
 * Parse the tutorial markdown content into steps.
 *
 * Format convention:
 * - Text before the first code block with `step` meta is the intro
 * - A fenced code block with meta containing `step` marks a new step
 *   e.g. ```jsx step file=steps/00.jsx highlight=1,3:5
 * - An image block with `<!-- step-image src=images/fiber0.png alt=... -->` marks an image step
 * - Text between steps is the prose for the preceding step
 */
function parseTutorialContent(
  content: string,
  topicDir: string,
): { intro: string; steps: TutorialStep[] } {
  const lines = content.split('\n')
  const steps: TutorialStep[] = []
  let intro = ''
  let currentProse: string[] = []
  let inCodeBlock = false
  let codeBlockMeta = ''
  let codeBlockContent: string[] = []
  let codeBlockLang = ''
  let foundFirstStep = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect fenced code block start
    const codeStart = line.match(/^```(\w*)\s+step(.*)$/)
    if (codeStart && !inCodeBlock) {
      // If we have a previous step, finalize its prose
      if (steps.length > 0) {
        steps[steps.length - 1].prose = currentProse.join('\n').trim()
        currentProse = []
      } else if (!foundFirstStep) {
        intro = currentProse.join('\n').trim()
        currentProse = []
      }

      foundFirstStep = true
      inCodeBlock = true
      codeBlockLang = codeStart[1] || 'text'
      codeBlockMeta = codeStart[2].trim()
      codeBlockContent = []
      continue
    }

    // Detect fenced code block end
    if (inCodeBlock && line.match(/^```\s*$/)) {
      inCodeBlock = false

      // Parse meta: file=xxx highlight=xxx
      const fileMeta = codeBlockMeta.match(/file=(\S+)/)
      const highlightMeta = codeBlockMeta.match(/highlight=(\S+)/)

      let code = codeBlockContent.join('\n')
      let fileName: string | undefined

      if (fileMeta) {
        code = resolveFileRef(topicDir, fileMeta[1])
        fileName = path.basename(fileMeta[1])
      }

      const highlightLines = highlightMeta
        ? parseHighlightLines(highlightMeta[1])
        : undefined

      steps.push({
        kind: 'code',
        code,
        language: codeBlockLang,
        highlightLines,
        fileName,
        prose: '',
      })
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    // Detect image step marker: <!-- step-image src=xxx alt=xxx -->
    const imageStep = line.match(
      /^<!--\s*step-image\s+src=(\S+)(?:\s+alt=(.+?))?\s*-->$/,
    )
    if (imageStep) {
      if (steps.length > 0) {
        steps[steps.length - 1].prose = currentProse.join('\n').trim()
        currentProse = []
      } else if (!foundFirstStep) {
        intro = currentProse.join('\n').trim()
        currentProse = []
      }

      foundFirstStep = true

      // Resolve image path — for static export, images need to be in public/
      // or referenced via a relative path that the build can handle
      const imgSrc = imageStep[1]
      const imgAlt = imageStep[2]?.trim() || ''

      steps.push({
        kind: 'image',
        src: imgSrc,
        alt: imgAlt,
        prose: '',
      })
      continue
    }

    // Regular text line
    currentProse.push(line)
  }

  // Finalize last step's prose
  if (steps.length > 0) {
    steps[steps.length - 1].prose = currentProse.join('\n').trim()
  } else {
    intro = currentProse.join('\n').trim()
  }

  return { intro, steps }
}

/**
 * Load and parse an interactive tutorial
 */
export function getInteractiveTutorial(
  topicSlug: string,
): InteractiveTutorial | null {
  const topicDir = path.join(topicsDir, topicSlug)
  const contentPath = path.join(topicDir, 'content.md')

  if (!fs.existsSync(contentPath)) return null

  const contentContents = fs.readFileSync(contentPath, 'utf8')
  const contentParsed = matter(contentContents)
  const meta = contentParsed.data as Partial<InteractiveTutorialMeta>

  if (meta.type !== 'interactive') return null

  // content.md is both the metadata source and the entry file
  const { intro, steps } = parseTutorialContent(contentParsed.content, topicDir)

  return {
    slug: topicSlug,
    title: meta.title || topicSlug,
    description: meta.description || '',
    intro,
    steps,
  }
}

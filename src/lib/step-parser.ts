import fs from 'fs'
import path from 'path'

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

export interface TutorialDemoStep {
  kind: 'demo'
  html: string
  title?: string
  height?: number
  aspect?: string
  prose: string
}

export type TutorialStep =
  | TutorialCodeStep
  | TutorialImageStep
  | TutorialDemoStep

export function parseHighlightLines(notation: string): number[] {
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

export function parseDemoAttrs(body: string): {
  src?: string
  title?: string
  height?: string
  aspect?: string
} {
  const attrs: Record<string, string> = {}
  const re = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g
  let match: RegExpExecArray | null
  while ((match = re.exec(body)) !== null) {
    const key = match[1]
    const value = match[2] ?? match[3] ?? match[4] ?? ''
    attrs[key] = value
  }
  return {
    src: attrs.src,
    title: attrs.title,
    height: attrs.height,
    aspect: attrs.aspect,
  }
}

export function resolveFileRef(tutorialDir: string, filePath: string): string {
  const fullPath = path.join(tutorialDir, filePath)
  if (!fs.existsSync(fullPath)) {
    console.warn(`[step-parser] File not found: ${fullPath}`)
    return `// File not found: ${filePath}`
  }
  return fs.readFileSync(fullPath, 'utf8')
}

export function parseTutorialContent(
  content: string,
  tutorialDir: string,
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

    const codeStart = line.match(/^```(\w*)\s+step(.*)$/)
    if (codeStart && !inCodeBlock) {
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

    if (inCodeBlock && line.match(/^```\s*$/)) {
      inCodeBlock = false

      const fileMeta = codeBlockMeta.match(/file=(\S+)/)
      const highlightMeta = codeBlockMeta.match(/highlight=(\S+)/)

      let code = codeBlockContent.join('\n')
      let fileName: string | undefined

      if (fileMeta) {
        code = resolveFileRef(tutorialDir, fileMeta[1])
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

      steps.push({
        kind: 'image',
        src: imageStep[1],
        alt: imageStep[2]?.trim() || '',
        prose: '',
      })
      continue
    }

    const demoStep = line.match(/^<!--\s*step-demo\s+(.+?)\s*-->$/)
    if (demoStep) {
      if (steps.length > 0) {
        steps[steps.length - 1].prose = currentProse.join('\n').trim()
        currentProse = []
      } else if (!foundFirstStep) {
        intro = currentProse.join('\n').trim()
        currentProse = []
      }

      foundFirstStep = true

      const attrs = parseDemoAttrs(demoStep[1])
      const demoSrc = attrs.src
      let html = ''
      if (!demoSrc) {
        console.warn('[step-parser] step-demo missing src attribute')
        html = '<!-- step-demo missing src -->'
      } else {
        const fullPath = path.join(tutorialDir, demoSrc)
        if (!fs.existsSync(fullPath)) {
          console.warn(`[step-parser] Demo file not found: ${fullPath}`)
          html = `<!-- Demo file not found: ${demoSrc} -->`
        } else {
          html = fs.readFileSync(fullPath, 'utf8')
        }
      }

      const heightNum = attrs.height ? Number(attrs.height) : undefined
      const height =
        heightNum !== undefined && !Number.isNaN(heightNum)
          ? heightNum
          : undefined

      steps.push({
        kind: 'demo',
        html,
        title: attrs.title,
        height,
        aspect: attrs.aspect,
        prose: '',
      })
      continue
    }

    currentProse.push(line)
  }

  if (steps.length > 0) {
    steps[steps.length - 1].prose = currentProse.join('\n').trim()
  } else {
    intro = currentProse.join('\n').trim()
  }

  return { intro, steps }
}

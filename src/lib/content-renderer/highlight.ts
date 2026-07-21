import {
  bundledLanguages,
  bundledLanguagesInfo,
  createHighlighter,
  type Highlighter,
} from 'shiki'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

export const CODE_THEME = 'github-dark-high-contrast'

export interface CodeToken {
  content: string
  color?: string
}

export type CodeTokenLines = CodeToken[][]

const engine = createJavaScriptRegexEngine({ forgiving: true })

const aliasToId = Object.fromEntries(
  bundledLanguagesInfo.flatMap((info) =>
    (info.aliases ?? []).map((alias) => [alias, info.id]),
  ),
)
const supportedIds = new Set(Object.keys(bundledLanguages))

function resolveLanguage(language: string): string {
  const normalized = language.trim().toLowerCase()
  return aliasToId[normalized] ?? normalized
}

// One highlighter per language, cached for the whole build.
const highlighters = new Map<string, Promise<Highlighter>>()

function getHighlighter(lang: string): Promise<Highlighter> {
  let pending = highlighters.get(lang)
  if (!pending) {
    pending = createHighlighter({
      themes: [CODE_THEME],
      langs: [lang],
      engine,
    })
    highlighters.set(lang, pending)
  }
  return pending
}

/**
 * Build-time syntax highlighting for interactive tutorial steps.
 * Returns per-line tokens with a single resolved color (the site uses one
 * code theme in both light and dark mode), serializable to client components.
 */
export async function highlightCodeToTokens(
  code: string,
  language: string,
): Promise<CodeTokenLines> {
  const resolved = resolveLanguage(language)
  const lang = supportedIds.has(resolved) ? resolved : 'text'
  const highlighter = await getHighlighter(lang)
  const loaded = highlighter.getLoadedLanguages().includes(lang) ? lang : 'text'

  const { tokens } = highlighter.codeToTokens(code, {
    lang: loaded as never,
    theme: CODE_THEME,
  })

  return tokens.map((line) =>
    line.map((token) => ({ content: token.content, color: token.color })),
  )
}

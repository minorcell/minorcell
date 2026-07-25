import type { MermaidConfig } from 'mermaid'
import { LXGW_Marker_Gothic } from 'next/font/google'

const mermaidHandFont = LXGW_Marker_Gothic({
  weight: '400',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
})

const MERMAID_FONT_FAMILY = `${mermaidHandFont.style.fontFamily}, "PingFang SC", "Microsoft YaHei", sans-serif`

export function createMermaidTheme(isDark: boolean): MermaidConfig {
  return {
    theme: isDark ? 'dark' : 'default',
    look: 'handDrawn',
    handDrawnSeed: 17,
    fontFamily: MERMAID_FONT_FAMILY,
    fontSize: 18,
    timeline: {
      leftMargin: 0,
      padding: 10,
    },
  }
}

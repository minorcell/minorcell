export type DangerLevel = 'safe' | 'confirm' | 'block'

declare function resolvePath(cwd: string, inputPath: string): string

const BLOCK_PATTERNS: RegExp[] = [
  /rm\s+-\S*r\S*f\s+(\/|~|\$HOME)\b/,
  /dd\s+if=.*of=\/dev\//,
  /mkfs\./,
  />\s*\/dev\/(sda|hda|nvme)/,
  /shutdown|reboot|halt/,
]

const CONFIRM_PATTERNS: RegExp[] = [
  /rm\s+-\S*[rf]/,
  /sudo\s+/,
  /(curl|wget)\s+.*\|\s*(sh|bash|zsh)/,
  /npm\s+publish/,
  /git\s+push\s+.*--force/,
  /git\s+reset\s+--hard/,
]

export function detectDanger(command: string): DangerLevel {
  if (BLOCK_PATTERNS.some((p) => p.test(command))) return 'block'
  if (CONFIRM_PATTERNS.some((p) => p.test(command))) return 'confirm'
  return 'safe'
}

export function resolveSafePath(inputPath: string): string {
  const cwd = process.cwd()
  const resolved = resolvePath(cwd, inputPath)

  if (!resolved.startsWith(cwd + '/') && resolved !== cwd) {
    throw new Error(
      `路径越界：${inputPath} 解析为 ${resolved}，超出工作目录 ${cwd}`,
    )
  }

  return resolved
}

const SENSITIVE_PATTERNS: RegExp[] = [
  /\.env(\.|$)/,
  /\.aws\/credentials/,
  /\.ssh\/(id_rsa|id_ed25519)$/,
  /secrets?\.(json|yaml|yml)$/i,
]

export function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(path))
}

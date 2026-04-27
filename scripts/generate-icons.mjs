/**
 * generate-icons.mjs
 *
 * Reads `public/logo.png` (the master, transparent-background pixel-art logo)
 * and emits a complete set of derived icons used across the site:
 *
 *   public/favicon.ico                  multi-size 16/32/48
 *   public/favicon-16x16.png
 *   public/favicon-32x32.png
 *   public/apple-touch-icon.png         180×180 (cream-paper bg, Apple disallows transparency)
 *   public/android-chrome-192x192.png   192×192
 *   public/android-chrome-512x512.png   512×512
 *   public/icon-512-maskable.png        512×512 with 20% safe area, opaque bg
 *   public/og-image.png                 1200×630 social card with logo + brand text
 *
 * Run via:  pnpm icons
 */

import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const PUBLIC = resolve(root, 'public')
const SRC = resolve(PUBLIC, 'logo.png')

// Paper-cream tint that matches the site's --background (light) so opaque
// icons (Apple, OG, maskable) stay in family with the rest of the site.
const PAPER = { r: 248, g: 244, b: 236, alpha: 1 } // ≈ oklch(0.982 0.005 85)

async function ensureDir(path) {
  await mkdir(dirname(path), { recursive: true })
}

/**
 * The master `public/logo.png` is RGB (no alpha) and has the checker
 * background baked in as light-grey / near-white pixels. We flood-fill from
 * all four corners over pixels that look like background (very bright + low
 * saturation) and zero their alpha. This preserves white pixels inside the
 * artwork (eyes, gears, dots) because they are not connected to the corners.
 *
 * Returns a sharp instance backed by a transparent-bg PNG buffer at the
 * original resolution, suitable for further `.resize()` calls.
 */
async function loadMasterLogo() {
  const meta = await sharp(SRC).metadata()
  if (meta.hasAlpha) return SRC // already transparent — use as is

  const { data: rgb, info } = await sharp(SRC)
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels } = info

  // Build RGBA pixel buffer, alpha defaults to 255
  const rgba = Buffer.alloc(W * H * 4)
  for (let i = 0, j = 0; i < rgb.length; i += channels, j += 4) {
    rgba[j] = rgb[i]
    rgba[j + 1] = rgb[i + 1]
    rgba[j + 2] = rgb[i + 2]
    rgba[j + 3] = 255
  }

  // Pixel test: very bright + grey (R, G, B all high & close)
  const isBg = (r, g, b) => {
    if (r < 220 || g < 220 || b < 220) return false
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    return max - min < 16 // near-grey
  }

  // Iterative flood fill from corners — don't recurse, JS stack is small
  const visited = new Uint8Array(W * H)
  const stack = [
    [0, 0],
    [W - 1, 0],
    [0, H - 1],
    [W - 1, H - 1],
  ]
  while (stack.length) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= W || y >= H) continue
    const idx = y * W + x
    if (visited[idx]) continue
    const off = idx * 4
    if (!isBg(rgba[off], rgba[off + 1], rgba[off + 2])) continue
    visited[idx] = 1
    rgba[off + 3] = 0 // zero alpha
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer()
}

let MASTER_BUFFER = null
async function getMaster() {
  if (!MASTER_BUFFER) MASTER_BUFFER = await loadMasterLogo()
  return MASTER_BUFFER
}

async function emitPng(targetSize, outName, { opaque = false, padPct = 0 } = {}) {
  const out = resolve(PUBLIC, outName)
  const innerSize = Math.round(targetSize * (1 - padPct * 2))

  // Resize the logo to the inner size, then either drop on transparent
  // canvas (default) or composite onto an opaque paper-cream square.
  const master = await getMaster()
  const logo = await sharp(master)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  const canvas = sharp({
    create: {
      width: targetSize,
      height: targetSize,
      channels: 4,
      background: opaque ? PAPER : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })

  const offset = Math.round((targetSize - innerSize) / 2)
  await ensureDir(out)
  await canvas
    .composite([{ input: logo, left: offset, top: offset }])
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log(`  ✓ ${outName}  (${targetSize}×${targetSize})`)
}

async function emitIco() {
  const sizes = [16, 32, 48]
  const master = await getMaster()
  const buffers = await Promise.all(
    sizes.map((s) =>
      sharp(master)
        .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
    ),
  )
  const ico = await pngToIco(buffers)
  const out = resolve(PUBLIC, 'favicon.ico')
  await writeFile(out, ico)
  console.log(`  ✓ favicon.ico       (16/32/48)`)
}

/**
 * Compose an Open Graph card 1200×630.
 * Layout: paper background, logo on the left, brand text on the right.
 * Text is rendered via inline SVG so this script has no font runtime dep
 * (relies on whatever serif/sans the rasteriser falls back to — which
 * is fine because the SVG declares generic family stacks).
 */
async function emitOg() {
  const W = 1200
  const H = 630
  const logoSize = 400
  const logoX = 96
  const logoY = (H - logoSize) / 2

  const master = await getMaster()
  const logo = await sharp(master)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  const textX = logoX + logoSize + 64 // 560
  const textSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <style>
        .brand { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
                 font-weight: 500; fill: #1c1916; letter-spacing: -0.02em; }
        .amp   { font-family: Georgia, 'Times New Roman', serif;
                 font-style: italic; font-weight: 400; fill: #6b6258; }
        .kicker{ font-family: 'SF Mono', Menlo, Consolas, monospace;
                 font-size: 22px; letter-spacing: 0.22em;
                 fill: #6b6258; text-transform: uppercase; }
        .rule  { stroke: #c8c0b3; stroke-width: 1; }
      </style>
      <text x="${textX}" y="270" class="brand" font-size="108">
        Cell <tspan class="amp">&amp;</tspan> Stack
      </text>
      <line x1="${textX}" y1="310" x2="${textX + 72}" y2="310" class="rule" />
      <text x="${textX + 88}" y="316" class="kicker">A FIELD JOURNAL</text>
      <text x="${textX}" y="395" font-family="Georgia, serif" font-size="28"
            fill="#3a342d" letter-spacing="-0.005em">
        AI Agent · 全栈工程 · 日常实践
      </text>
      <text x="${textX}" y="555" class="kicker" font-size="18">
        STACK.MCELL.TOP
      </text>
    </svg>
  `)

  const canvas = sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: PAPER,
    },
  })

  await canvas
    .composite([
      { input: logo, left: logoX, top: Math.round(logoY) },
      { input: textSvg, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(resolve(PUBLIC, 'og-image.png'))
  console.log(`  ✓ og-image.png      (1200×630)`)
}

async function main() {
  console.log('Generating icons from public/logo.png …\n')

  await emitIco()
  await emitPng(16, 'favicon-16x16.png')
  await emitPng(32, 'favicon-32x32.png')
  await emitPng(180, 'apple-touch-icon.png', { opaque: true }) // Apple disallows alpha
  await emitPng(192, 'android-chrome-192x192.png')
  await emitPng(512, 'android-chrome-512x512.png')
  await emitPng(512, 'icon-512-maskable.png', { opaque: true, padPct: 0.1 })
  await emitOg()

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

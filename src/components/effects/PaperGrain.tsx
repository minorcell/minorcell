/**
 * PaperGrain — 纸本质感背景叠层
 *
 * 用法：作为固定全屏 z-0 层放置，效果极淡，不抢主体内容。
 * - 亮色模式：以 multiply 混合在白纸上，制造细微"未漂白"颗粒
 * - 暗色模式：以 screen 混合在深底上，制造印刷颗粒/胶片噪点感
 * - 使用 SVG feTurbulence 生成确定性噪声，无脚本、无图片资源
 */
export function PaperGrain() {
  // 内联 SVG，作为 CSS 背景图
  // baseFrequency 控制颗粒粗细（越大越细）；numOctaves 控制层次
  const noise = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.86' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
  const dataUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(noise)}")`

  return (
    <div
      aria-hidden
      className="paper-grain pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: dataUrl,
        backgroundRepeat: 'repeat',
        backgroundSize: '240px 240px',
      }}
    />
  )
}

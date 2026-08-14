#!/usr/bin/env python3
"""SVG 配图渲染为 PNG：Playwright 打开 file:// 做几何验证 + 2x 截图 + PIL 程序化视觉检查。

用法：
  svg2png.py in.svg [-o out.png] [--no-check] [--bg r,g,b]

默认输出与输入同名 .png；默认做 text 越界/重叠检查与背景色检查。
背景色默认 #f5f5f7（站点底色），可传 --bg 覆盖；--no-check 跳过几何与背景检查（仅截图）。
"""
import argparse
import re
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright


def read_viewbox(svg_path: Path):
    text = svg_path.read_text(encoding="utf-8")
    m = re.search(r'viewBox="([\d.\-]+)[ ,]+([\d.\-]+)[ ,]+([\d.\-]+)[ ,]+([\d.\-]+)"', text)
    if not m:
        m = re.search(r"width=\"([\d.]+)\" height=\"([\d.]+)\"", text)
        if not m:
            sys.exit(f"❌ 无法从 {svg_path} 读取 viewBox 或 width/height")
        return int(float(m.group(1))), int(float(m.group(2)))
    return int(float(m.group(3))), int(float(m.group(4)))


def geometry_check(page, vw, vh):
    """检查所有 <text> 的 bbox 不越出 viewBox、两两不重叠。"""
    issues = page.evaluate(
        """(arg) => {
            const vw = arg.vw, vh = arg.vh;
            const texts = [...document.querySelectorAll('text')];
            const boxes = texts.map(t => {
                const b = t.getBoundingClientRect();
                return { text: t.textContent, x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height };
            });
            const issues = [];
            for (const b of boxes) {
                if (b.x < -1 || b.y < -1 || b.right > vw + 1 || b.bottom > vh + 1)
                    issues.push(`越界: "${b.text}" (${b.right.toFixed(0)},${b.bottom.toFixed(0)})`);
            }
            for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
                const a = boxes[i], b = boxes[j];
                if (Math.min(a.right, b.right) - Math.max(a.x, b.x) > 2 &&
                    Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 2)
                    issues.push(`重叠: "${a.text}" 与 "${b.text}"`);
            }
            return issues;
        }""",
        {"vw": vw, "vh": vh},
    )
    if issues:
        for i in issues:
            print(f"  ⚠️ {i}")
        sys.exit("❌ 几何检查失败，请修正 SVG 后重试")
    print(f"✅ 几何检查通过（{len(page.query_selector_all('text'))} 个 text 无越界无重叠）")


def background_check(png_path: Path, bg, exp_w, exp_h):
    """尺寸与四角背景色符合预期。"""
    img = Image.open(png_path).convert("RGB")
    w, h = img.size
    if w != exp_w or h != exp_h:
        sys.exit(f"❌ 尺寸不符：期望 {exp_w}x{exp_h}，实际 {w}x{h}")
    for name, (x, y) in {"左上": (8, 8), "右上": (w - 9, 8), "左下": (8, h - 9), "右下": (w - 9, h - 9)}.items():
        px = img.getpixel((x, y))
        if any(abs(px[i] - bg[i]) > 12 for i in range(3)):
            print(f"  ⚠️ 背景{name}: {px}（预期 {bg}）")
            return
    print(f"✅ 尺寸 {w}x{h}，四角背景色 {tuple(bg)}")


def main():
    ap = argparse.ArgumentParser(description="SVG → PNG（渲染 + 验证）")
    ap.add_argument("svg", type=Path, help="输入 SVG 文件")
    ap.add_argument("-o", "--out", type=Path, help="输出 PNG 路径（默认与输入同名）")
    ap.add_argument("--no-check", action="store_true", help="跳过几何与背景检查")
    ap.add_argument("--bg", default="245,245,247", help="预期背景色 r,g,b（默认 245,245,247）")
    ap.add_argument("--scale", type=int, default=2, help="device_scale_factor（默认 2；封面图用 1 输出 1536x1024）")
    args = ap.parse_args()

    vw, vh = read_viewbox(args.svg)
    out = args.out or args.svg.with_suffix(".png")
    bg = tuple(int(x) for x in args.bg.split(","))
    scale = args.scale

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": vw, "height": vh}, device_scale_factor=scale)
        page.goto(args.svg.resolve().as_uri())
        page.wait_for_timeout(400)
        if not args.no_check:
            geometry_check(page, vw, vh)
        page.screenshot(path=str(out))
        browser.close()

    if not args.no_check:
        background_check(out, bg, vw * scale, vh * scale)
    print(f"✅ 已输出 {out}")


if __name__ == "__main__":
    main()

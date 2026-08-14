#!/usr/bin/env python3
"""多帧静态 SVG → GIF 动图：逐帧 Playwright 截图 → PIL 合成 → 逐帧像素差验证。

帧 SVG 的生成逻辑因内容而异，请用 Python 脚本参数化生成各帧（状态用 dict 描述），
本脚本只负责「帧文件 → GIF」的转换与验证。帧按文件名排序。

用法：
  svg2gif.py frames/ -o out.gif [--pattern "frame-*.svg"] [--duration 1500,1500,3000]

--duration 为每帧毫秒时长，逗号分隔；传单个值则所有帧统一（默认 2000，末帧 3000）。
"""
import argparse
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright


def frame_size(svg_path: Path):
    import re

    text = svg_path.read_text(encoding="utf-8")
    m = re.search(r'viewBox="[\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.\-]+)[ ,]+([\d.\-]+)"', text)
    if not m:
        sys.exit(f"❌ 无法从 {svg_path} 读取 viewBox")
    return int(float(m.group(1))), int(float(m.group(2)))


def main():
    ap = argparse.ArgumentParser(description="帧 SVG 目录 → GIF 动图")
    ap.add_argument("frames", type=Path, help="帧 SVG 所在目录")
    ap.add_argument("-o", "--out", type=Path, required=True, help="输出 GIF 路径")
    ap.add_argument("--pattern", default="*.svg", help="帧文件 glob（默认 *.svg）")
    ap.add_argument("--duration", default="2000", help="每帧毫秒时长，逗号分隔（末帧建议 3000）")
    args = ap.parse_args()

    frames = sorted(args.frames.glob(args.pattern))
    if len(frames) < 2:
        sys.exit(f"❌ 帧数不足（{len(frames)}），至少需要 2 帧")

    durations = [int(x) for x in args.duration.split(",")]
    if len(durations) == 1:
        durations = [durations[0]] * len(frames)
        durations[-1] = 3000  # 末帧定格久一些
    elif len(durations) != len(frames):
        sys.exit(f"❌ --duration 数量（{len(durations)}）与帧数（{len(frames)}）不符")

    vw, vh = frame_size(frames[0])
    pngs = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": vw, "height": vh}, device_scale_factor=2)
        for i, f in enumerate(frames):
            page.goto(f.resolve().as_uri())
            page.wait_for_timeout(400)
            png = f.with_suffix(".png")
            page.screenshot(path=str(png))
            pngs.append(png)
            print(f"  帧 {i + 1}/{len(frames)}: {f.name}")
        browser.close()

    # PIL 合成（每帧独立量化，避免调色板串色）
    imgs = []
    for png in pngs:
        img = Image.open(png).convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=64)
        imgs.append(img)
    imgs[0].save(
        args.out,
        save_all=True,
        append_images=imgs[1:],
        duration=durations,
        loop=0,
    )
    for png in pngs:
        png.unlink()

    # 验证：逐帧像素差 > 0（动画有效），帧数正确
    with Image.open(args.out) as gif:
        n_frames = gif.n_frames
        ok = n_frames == len(frames)
        if ok:
            prev = None
            for i in range(n_frames):
                gif.seek(i)
                cur = gif.convert("RGB")
                if prev is not None and list(cur.getdata()) == list(prev.getdata()):
                    ok = False
                    print(f"  ⚠️ 第 {i + 1} 帧与前一帧完全相同")
                prev = cur
    print(f"{'✅' if ok else '❌'} GIF 验证：{n_frames} 帧，动画 {'有效' if ok else '异常'}")
    print(f"✅ 已输出 {args.out}（{args.out.stat().st_size // 1024} KB）")


if __name__ == "__main__":
    main()

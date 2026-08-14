#!/usr/bin/env python3
"""新闻/官网页面截图：去广告裁剪 + 非白像素验证。

三种用法：
  1. 探测正文容器（确定裁剪坐标用）：
     news-shot.py URL out.png --probe
  2. 裁剪正文区域截图（去掉导航/广告/推荐位）：
     news-shot.py URL out.png --clip x,y,w,h
  3. 整页（视口）截图：
     news-shot.py URL out.png

截图后自动用 PIL 检查非白像素比例（>3% 视为有内容，防全黑/全白）。
页面持续请求时 networkidle 会一直不满足，本脚本用 domcontentloaded + 固定等待。
"""
import argparse
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

# 常见正文容器选择器（按优先级探测）
BODY_SELECTORS = [
    "article",
    ".markdown-body",
    ".article-content",
    ".art_content",
    ".article-detail",
    ".news-content",
    ".content",
    ".detail-content",
    ".rich_media_content",
    ".post-content",
    ".story-content",
    "[class*=article__body]",
    "[class*=content]",
]

CLOSE_SELECTORS = [
    "button:has-text('关闭')",
    ".close",
    "[aria-label='Close']",
    "button:has-text('知道了')",
]


def probe(page):
    """打印正文容器候选、大文本块与标题位置，供确定 --clip 参数。"""
    info = page.evaluate(
        """(sels) => {
            const out = {found: [], biggest: [], titles: []};
            for (const s of sels) {
                const el = document.querySelector(s);
                if (el) {
                    const b = el.getBoundingClientRect();
                    if (b.width > 400 && b.height > 300)
                        out.found.push({sel: s, cls: (el.className || '').toString().slice(0, 50),
                            x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height)});
                }
            }
            const divs = [...document.querySelectorAll('div')]
                .map(d => ({d, len: (d.textContent || '').length}))
                .sort((a, b) => b.len - a.len).slice(0, 4);
            for (const s of divs) {
                const b = s.d.getBoundingClientRect();
                if (b.width > 400 && b.height > 200 && b.top < 2000)
                    out.biggest.push({cls: (s.d.className || '').toString().slice(0, 40), len: s.len,
                        x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height)});
            }
            for (const h of document.querySelectorAll('h1, h2, [class*=title]')) {
                const b = h.getBoundingClientRect();
                const t = (h.textContent || '').trim().slice(0, 50);
                if (t && b.y > 50 && b.y < 2000)
                    out.titles.push({t, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width)});
            }
            return out;
        }""",
        BODY_SELECTORS,
    )
    print("正文容器候选（可用 --clip x,y,w,h 裁剪）：")
    for f in info["found"][:5]:
        print(f"  {f['sel']}: ({f['x']},{f['y']}) {f['w']}x{f['h']} cls={f['cls']}")
    print("大文本块：")
    for b in info["biggest"][:4]:
        print(f"  cls='{b['cls']}' len={b['len']} ({b['x']},{b['y']}) {b['w']}x{b['h']}")
    print("标题位置：")
    for h in info["titles"][:5]:
        print(f"  '{h['t']}' at ({h['x']},{h['y']})")


def verify_content(path: Path):
    """非白像素比例检查（防全黑/全白截图）。"""
    img = Image.open(path).convert("RGB")
    w, h = img.size
    nonwhite = sum(
        1
        for x in range(0, w, 4)
        for y in range(0, h, 4)
        if sum(img.getpixel((x, y))) < 720
    )
    total = len(range(0, w, 4)) * len(range(0, h, 4))
    ratio = nonwhite / total * 100
    print(f"{'✅' if ratio > 3 else '❌'} 内容检查：非白像素 {ratio:.1f}%（{w}x{h}）")
    return ratio > 3


def main():
    ap = argparse.ArgumentParser(description="新闻/官网页面截图（去广告裁剪）")
    ap.add_argument("url", help="页面 URL")
    ap.add_argument("out", type=Path, help="输出 PNG 路径")
    ap.add_argument("--probe", action="store_true", help="只探测正文容器，不截图")
    ap.add_argument("--clip", help="裁剪区域 x,y,w,h（CSS 像素）")
    ap.add_argument("--wait", type=int, default=6, help="加载后等待秒数（默认 6）")
    ap.add_argument("--locale", default="zh-CN", help="浏览器 locale（默认 zh-CN）")
    args = ap.parse_args()

    clip = None
    if args.clip:
        x, y, w, h = [int(v) for v in args.clip.split(",")]
        clip = {"x": x, "y": y, "width": w, "height": h}

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(locale=args.locale, viewport={"width": 1280, "height": 900}, device_scale_factor=2)
        page = ctx.new_page()
        page.goto(args.url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(args.wait * 1000)
        for sel in CLOSE_SELECTORS:
            try:
                btn = page.query_selector(sel)
                if btn:
                    btn.click()
                    page.wait_for_timeout(800)
            except Exception:
                pass
        if args.probe:
            probe(page)
            browser.close()
            return
        page.screenshot(path=str(args.out), clip=clip)
        browser.close()

    verify_content(args.out)
    print(f"✅ 已输出 {args.out}")


if __name__ == "__main__":
    main()

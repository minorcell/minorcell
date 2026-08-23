#!/usr/bin/env python3
"""snake-and-commits — turn your GitHub contribution graph into a Snake game.

The snake plays a real, winnable game of Snake over your contribution grid:
it hunts every commit cell sparse-to-dense with BFS pathfinding, never crosses
its own body, grows one segment per cell eaten, fades a gradient from a bright
head to a dim tail, and tallies the commits it eats. Pure animated SVG (CSS +
no JS), so it renders anywhere GitHub shows an image. Stdlib only.

Usage:
    python scripts/snake-and-commits.py --user OCTOCAT --output dist/snake.svg
    python scripts/snake-and-commits.py --user OCTOCAT --theme blue --frame

Auth: set GH_TOKEN (or GITHUB_TOKEN) to a token that can read contribution
data. For private and internal contribution counts, use the profile owner's
token with the read:user scope and enable private contribution counts on the
GitHub profile.
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.request
from bisect import bisect_right
from collections import deque
from datetime import datetime, timedelta, timezone

CELL, GAP = 11, 3
PITCH = CELL + GAP
MX, MTOP, MBOT = 16, 26, 30
STEPS_PER_SEC = 10
PAUSE_STEPS = 26
BASE_LEN = 3

LEVEL = {"NONE": 0, "FIRST_QUARTILE": 1, "SECOND_QUARTILE": 2,
         "THIRD_QUARTILE": 3, "FOURTH_QUARTILE": 4}
MONTHS = ["", "jan", "feb", "mar", "apr", "may", "jun",
          "jul", "aug", "sep", "oct", "nov", "dec"]

# Each theme: the 5-step contribution ramp (empty..brightest), the snake head
# and body, a 4-stop age gradient (bright head -> dim tail), label + frame.
THEMES = {
    "green": dict(
        levels=["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
        snake="#39d353", head="#b7ffd0",
        ramp=[(1, "#8affc1"), (4, "#39d353"), (10, "#26a641"), (21, "#006d32")],
        text="#7d8590", frame_bg="#0d1117", frame_border="#30363d",
    ),
    "blue": dict(
        levels=["#161b22", "#0f2f56", "#1f5fa6", "#3f8bd6", "#79c0ff"],
        snake="#58a6ff", head="#c9e4ff",
        ramp=[(1, "#c9e4ff"), (4, "#58a6ff"), (10, "#3f83d6"), (21, "#2e62a8")],
        text="#7d8590", frame_bg="#0d1117", frame_border="#22406a",
    ),
    "amber": dict(
        levels=["#1a1710", "#3d2f0e", "#7a5c14", "#c99a1e", "#ffd257"],
        snake="#ffd257", head="#fff2c2",
        ramp=[(1, "#fff2c2"), (4, "#ffd257"), (10, "#c99a1e"), (21, "#7a5c14")],
        text="#8a7752", frame_bg="#0d0b07", frame_border="#4d3d16",
    ),
    "matrix": dict(
        levels=["#0a0f0a", "#0d3d1a", "#12742f", "#1fb84e", "#39ff7a"],
        snake="#39ff7a", head="#d6ffe4",
        ramp=[(1, "#d6ffe4"), (4, "#39ff7a"), (10, "#1fb84e"), (21, "#12742f")],
        text="#3fa060", frame_bg="#000000", frame_border="#123d1f",
    ),
}


def token():
    for k in ("GH_TOKEN", "GITHUB_TOKEN"):
        if os.environ.get(k):
            return os.environ[k]
    try:
        return subprocess.run(["gh", "auth", "token"], capture_output=True, text=True).stdout.strip()
    except FileNotFoundError:
        return ""


def fetch_weeks(user, tok):
    now = datetime.now(timezone.utc)
    frm = (now - timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%SZ")
    q = """
    query($login:String!,$from:DateTime!){user(login:$login){contributionsCollection(from:$from){
      contributionCalendar{weeks{contributionDays{date contributionCount contributionLevel}}}}}}"""
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=json.dumps({"query": q, "variables": {"login": user, "from": frm}}).encode(),
        headers={"Authorization": f"Bearer {tok}", "User-Agent": user},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    if data.get("errors"):
        sys.exit(f"GitHub API error: {data['errors']}")
    return data["data"]["user"]["contributionsCollection"]["contributionCalendar"]["weeks"]


def solve(grid, cap=999):
    """Real Snake rules: head never enters an occupied cell; BFS to the nearest
    (sparse-first) commit cell avoiding the body; chase the tail when boxed in.
    Returns route, eats, growth steps, final length, uneaten count."""
    ncols = len(grid)

    def neighbors(cr):
        c, r = cr
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nc, nr = c + dc, r + dr
            if 0 <= nc < ncols and 0 <= nr < len(grid[nc]):
                yield (nc, nr)

    def bfs(start_, goal, blocked):
        if start_ == goal:
            return [start_]
        qq, seen = deque([(start_, [start_])]), {start_}
        while qq:
            cur, path = qq.popleft()
            for nb in neighbors(cur):
                if nb in seen or (nb in blocked and nb != goal):
                    continue
                if nb == goal:
                    return path + [nb]
                seen.add(nb)
                qq.append((nb, path + [nb]))
        return None

    remaining = {(c, r) for c in range(ncols) for r in range(len(grid[c])) if grid[c][r] > 0}
    start = min(remaining, key=lambda cr: cr[0] * 10 + abs(cr[1] - 3)) if remaining else (0, 3)
    body = deque([start])
    occupied = {start}
    route, eats, growth = [start], [], []

    def allowed():
        return BASE_LEN + len(growth)

    def eat(cell):
        remaining.discard(cell)
        eats.append((len(route) - 1, cell))
        if BASE_LEN + len(growth) < cap:
            growth.append(len(route) - 1)

    def step_to(cell):
        route.append(cell)
        body.append(cell)
        occupied.add(cell)
        if cell in remaining:
            eat(cell)
        while len(body) > allowed():
            occupied.discard(body.popleft())

    if start in remaining:
        eat(start)

    def safe(cell):
        if len(body) < 8:
            return True
        grows = cell in remaining
        occ = set(occupied)
        occ.add(cell)
        b0 = body[0]
        if not grows and len(body) + 1 > allowed():
            occ.discard(body[0])
            b0 = body[1] if len(body) > 1 else cell
        return bfs(cell, b0, occ - {b0, cell}) is not None

    stuck = 0
    while remaining and len(route) < 4000:
        head = body[-1]
        blocked = occupied - {head}
        path = None
        for cand in sorted(remaining, key=lambda cr: grid[cr[0]][cr[1]] * 8 +
                           abs(cr[0] - head[0]) + abs(cr[1] - head[1]))[:24]:
            p = bfs(head, cand, blocked)
            if p and len(p) > 1:
                path = p
                break
        if path:
            aborted = False
            for cell in path[1:]:
                if not safe(cell):
                    aborted = True
                    break
                step_to(cell)
            if not aborted:
                stuck = 0
                continue
        stuck += 1
        if stuck > 400:
            break
        head = body[-1]
        blocked = occupied - {head}
        tail = body[0]
        tp = bfs(head, tail, blocked - {tail})
        nxt = None
        if tp and len(tp) > 1 and tp[1] not in occupied and safe(tp[1]):
            nxt = tp[1]
        else:
            free = [nb for nb in neighbors(head) if nb not in occupied]
            pool = [nb for nb in free if safe(nb)] or free
            if pool:
                nxt = max(pool, key=lambda cr: sum(1 for n in neighbors(cr) if n not in occupied))
        if nxt is None:
            break
        step_to(nxt)
    return route, eats, growth, BASE_LEN + len(growth), len(remaining)


def render(grid, counts, months, route, eats, growth, theme, opts):
    t = THEMES[theme]
    ncols = len(grid)
    n = len(route)
    total = n + PAUSE_STEPS
    dur = total / STEPS_PER_SEC

    def pct(s):
        return round(s / total * 100, 3)

    def xy(c, r):
        return MX + c * PITCH, MTOP + r * PITCH

    def length_at(s):
        return BASE_LEN + bisect_right(growth, s)

    intervals, open_iv, prev = {}, {}, set()
    for s in range(n):
        bod = set(route[max(0, s - length_at(s) + 1): s + 1])
        for cell in bod - prev:
            open_iv[cell] = s
        for cell in prev - bod:
            intervals.setdefault(cell, []).append((open_iv.pop(cell), s))
        prev = bod
    for cell, st in open_iv.items():
        intervals.setdefault(cell, []).append((st, total))

    eaten_step = {cell: s for s, cell in eats}
    css, body = [], []
    for c in range(ncols):
        for r in range(len(grid[c])):
            x, y = xy(c, r)
            base = t["levels"][grid[c][r]]
            ivs = intervals.get((c, r), [])
            cls = f"c{c}_{r}"
            body.append(f'<rect class="{cls}" x="{x}" y="{y}" width="{CELL}" height="{CELL}" rx="2.5" fill="{base}"/>')
            if not ivs:
                continue
            stops = [(0.0, base)]
            for a, b in ivs:
                post = base if (c, r) not in eaten_step or eaten_step[(c, r)] > b else t["levels"][0]
                pa = pct(a)
                stops += [(max(pa - .05, 0), None), (pa, t["head"])]
                for age, col in t["ramp"]:
                    if a + age < b:
                        stops.append((pct(a + age), col))
                if b < total:
                    pb = pct(b)
                    stops += [(max(pb - .05, 0), None), (pb, post)]
            frames, last = [], base
            for p, col in stops:
                col = last if col is None else col
                frames.append(f"{p}% {{ fill:{col}; }}")
                last = col
            frames.append(f"100% {{ fill:{last}; }}")
            css.append(f"@keyframes k{cls} {{ {' '.join(frames)} }}\n.{cls} {{ animation:k{cls} {dur:.1f}s linear infinite; }}")

    for c, label in months:
        x, _ = xy(c, 0)
        body.append(f'<text class="lab" x="{x}" y="14">{label}</text>')

    lx = MX + ncols * PITCH - GAP - 5 * (CELL + 3) - 62
    ly = MTOP + 7 * PITCH + 8
    body.append(f'<text class="lab" x="{lx-30}" y="{ly+9}">less</text>')
    for i in range(5):
        body.append(f'<rect x="{lx+i*(CELL+3)}" y="{ly}" width="{CELL}" height="{CELL}" rx="2.5" fill="{t["levels"][i]}"/>')
    body.append(f'<text class="lab" x="{lx+5*(CELL+3)+8}" y="{ly+9}">more</text>')

    if opts.counter:
        total_commits = sum(counts[c][r] for _, (c, r) in eats)
        states, val = [(0, 0)], 0
        for s, (c, r) in eats:
            val += counts[c][r]
            states.append((s, val))
        body.append(f'<text class="lab" x="{MX}" y="{ly+9}">$ commits eaten:</text>')
        for i, (s, v) in enumerate(states):
            a = pct(s)
            b = pct(states[i + 1][0]) if i + 1 < len(states) else 100.0
            if b <= a:
                continue
            fr = (f"0% {{ opacity:0; }} {a}% {{ opacity:1; }} {b}% {{ opacity:0; }} 100% {{ opacity:0; }}"
                  if b < 100 else f"0% {{ opacity:0; }} {a}% {{ opacity:1; }} 100% {{ opacity:1; }}")
            css.append(f"@keyframes m{i} {{ {fr} }}\n.m{i} {{ animation:m{i} {dur:.1f}s steps(1,end) infinite; }}")
            body.append(f'<text class="cnt m{i}" opacity="0" x="{MX+102}" y="{ly+9}">{v}/{total_commits}</text>')

    w = MX * 2 + ncols * PITCH - GAP
    h = MTOP + 7 * PITCH - GAP + MBOT
    frame_open = frame_close = ""
    if opts.frame:
        frame_open = f'<rect x="1" y="1" width="{w-2}" height="{h-2}" rx="12" fill="{t["frame_bg"]}" stroke="{t["frame_border"]}"/>'
        frame_close = f'<rect x="1" y="1" width="{w-2}" height="{h-2}" rx="12" fill="none" stroke="{t["frame_border"]}"/>'
    mono = "ui-monospace,'SF Mono',Menlo,Consolas,monospace"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">
  <style>
    .lab {{ font-family:{mono}; font-size:9.5px; fill:{t['text']}; }}
    .cnt {{ font-family:{mono}; font-size:9.5px; fill:{t['snake']}; }}
    @media (prefers-reduced-motion) {{ * {{ animation:none !important; }} }}
    {chr(10).join(css)}
  </style>
  {frame_open}
  {chr(10).join('  ' + b for b in body)}
  {frame_close}
</svg>
"""


def main():
    ap = argparse.ArgumentParser(description="Turn a GitHub contribution graph into a Snake game (animated SVG).")
    ap.add_argument("--user", default=os.environ.get("GH_USER") or os.environ.get("GITHUB_REPOSITORY_OWNER"),
                    help="GitHub username (defaults to the Actions repo owner)")
    ap.add_argument("--output", default="dist/snake.svg", help="output svg path")
    ap.add_argument("--theme", default="green", choices=list(THEMES), help="color theme")
    ap.add_argument("--frame", action="store_true", help="draw a rounded window frame")
    ap.add_argument("--no-counter", dest="counter", action="store_false", help="hide the commits-eaten counter")
    ap.set_defaults(counter=True)
    opts = ap.parse_args()
    if not opts.user:
        sys.exit("error: --user is required (or set GH_USER / run in Actions)")

    tok = token()
    if not tok:
        sys.exit("error: no token found. set GH_TOKEN (or GITHUB_TOKEN).")

    weeks = fetch_weeks(opts.user, tok)
    grid = [[LEVEL[d["contributionLevel"]] for d in w["contributionDays"]] for w in weeks]
    counts = [[d["contributionCount"] for d in w["contributionDays"]] for w in weeks]
    months, seen = [], None
    for c, w in enumerate(weeks):
        m = int(w["contributionDays"][0]["date"].split("-")[1])
        if m != seen:
            months.append((c, MONTHS[m]))
            seen = m
    if months and months[0][0] == 0 and len(months) > 1 and months[1][0] <= 2:
        months = months[1:]

    for cap in (48, 40, 34, 28, 24, 20, 16, 12):
        route, eats, growth, maxlen, left = solve(grid, cap)
        if left == 0:
            break

    os.makedirs(os.path.dirname(os.path.abspath(opts.output)), exist_ok=True)
    with open(opts.output, "w") as f:
        f.write(render(grid, counts, months, route, eats, growth, opts.theme, opts))
    print(f"wrote {opts.output} — {len(eats)} cells eaten, snake grew to {maxlen}, {left} left over")


if __name__ == "__main__":
    main()

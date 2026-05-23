#!/usr/bin/env python3
"""Build an HTML visual report for the MSX2 OpenMSX smoke outputs."""

from __future__ import annotations

import html
import json
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "test" / "msx2-screen4" / "out"
REPORT = OUT / "msx2-visual-report.html"
SUMMARY = OUT / "msx2-visual-report.json"


CASES = [
    {
        "title": "Collision wall",
        "image": "msx2screen-layers-right-blocked.png",
        "probe": "msx2screen-layers-right-blocked-probe.txt",
        "note": "Player stops at the right collision wall.",
    },
    {
        "title": "Collectible cleared",
        "image": "msx2screen-layers-collect.png",
        "probe": "msx2screen-layers-collect-probe.txt",
        "note": "First collectible is removed from effects RAM and the SCREEN 4 tile layer.",
    },
    {
        "title": "Both collectibles cleared",
        "image": "msx2screen-layers-collect-both.png",
        "probe": "msx2screen-layers-collect-both-probe.txt",
        "note": "Both required collectibles are collected.",
    },
    {
        "title": "Air HUD",
        "image": "msx2screen-layers-air.png",
        "probe": "msx2screen-layers-air-probe.txt",
        "note": "Air counter and top-right HUD decrease over time.",
    },
    {
        "title": "Ladder behavior",
        "image": "msx2screen-layers-ladder.png",
        "probe": "msx2screen-layers-ladder-probe.txt",
        "note": "Behavior layer ladder moves the player upward.",
    },
    {
        "title": "Jump arc",
        "image": "msx2screen-layers-jump-mid.png",
        "probe": None,
        "note": "Player sprite is visibly airborne.",
    },
    {
        "title": "Hazard respawn",
        "image": "msx2screen-layers-hazard-respawn.png",
        "probe": "msx2screen-layers-hazard-respawn-probe.txt",
        "note": "Hazard decrements lives and respawns the player.",
    },
    {
        "title": "Enemy respawn",
        "image": "msx2screen-layers-enemy-respawn.png",
        "probe": "msx2screen-layers-enemy-respawn-probe.txt",
        "note": "Entity enemy collision uses the same damage path.",
    },
    {
        "title": "Enemy motion",
        "image": "msx2screen-layers-enemy-motion-b.png",
        "probe": "msx2screen-layers-enemy-motion-b-probe.txt",
        "note": "Hardware enemy sprite remains visible after movement.",
    },
    {
        "title": "Game over",
        "image": "msx2screen-layers-lives-gameover.png",
        "probe": "msx2screen-layers-lives-gameover-probe.txt",
        "note": "Repeated damage reaches the red game-over banner.",
    },
    {
        "title": "Restart",
        "image": "msx2screen-layers-restart.png",
        "probe": "msx2screen-layers-restart-probe.txt",
        "note": "Restart restores lives, flags, and mutable effects.",
    },
    {
        "title": "WorldMap locked transition",
        "image": "msx2screen-layers-world-left-locked.png",
        "probe": "msx2screen-layers-gameplay-locked-probe.txt",
        "note": "One collectible is not enough to unlock the target exit.",
    },
    {
        "title": "WorldMap open transition",
        "image": "msx2screen-layers-world-left.png",
        "probe": "msx2screen-layers-gameplay-probe.txt",
        "note": "Two collectibles unlock the exit and level-complete state.",
    },
    {
        "title": "WorldMap return persistence",
        "image": "msx2screen-layers-world-return.png",
        "probe": "msx2screen-layers-world-return-probe.txt",
        "note": "Collected item stays cleared after leaving and returning.",
    },
    {
        "title": "Level continue",
        "image": "msx2screen-layers-level-continue.png",
        "probe": "msx2screen-layers-level-continue-probe.txt",
        "note": "Continue removes the level-complete banner and resets the room.",
    },
    {
        "title": "Conveyor right",
        "image": "msx2screen-conveyor-right.png",
        "probe": "msx2screen-conveyor-right-probe.txt",
        "note": "Behavior code 2 pushes the player to the right.",
    },
    {
        "title": "Conveyor left",
        "image": "msx2screen-conveyor-left.png",
        "probe": "msx2screen-conveyor-left-probe.txt",
        "note": "Behavior code 3 pushes the player to the left.",
    },
]


def require_file(path: Path) -> None:
    if not path.exists():
        raise SystemExit(f"Missing visual report input: {path}")


def read_probe(path: Path | None) -> str:
    if path is None:
        return ""
    require_file(path)
    lines = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if "=" in line:
            lines.append(line)
    return "\n".join(lines)


def parse_probe(path: Path | None) -> dict[str, int]:
    if path is None:
        return {}
    probe: dict[str, int] = {}
    for line in read_probe(path).splitlines():
        key, raw_value = line.split("=", 1)
        probe[key] = int(raw_value, 16)
    return probe


def collect_case_summary(case: dict[str, str | None]) -> dict[str, object]:
    image_name = str(case["image"])
    image_path = OUT / image_name
    require_file(image_path)
    probe_name = case.get("probe")
    probe_path = OUT / str(probe_name) if probe_name else None
    probe = parse_probe(probe_path)
    return {
        "title": case["title"],
        "note": case["note"],
        "image": image_name,
        "imageBytes": image_path.stat().st_size,
        "probe": probe_name,
        "probeValues": probe,
    }


def render_case(case: dict[str, str | None]) -> str:
    image_name = str(case["image"])
    image_path = OUT / image_name
    require_file(image_path)
    probe_name = case.get("probe")
    probe_text = read_probe(OUT / str(probe_name) if probe_name else None)
    probe_html = (
        f"<pre>{html.escape(probe_text)}</pre>"
        if probe_text
        else "<p class=\"muted\">PNG-only visual check.</p>"
    )
    return f"""
      <article class="card">
        <a href="{html.escape(image_name)}"><img src="{html.escape(image_name)}" alt="{html.escape(str(case["title"]))}"></a>
        <div class="body">
          <h2>{html.escape(str(case["title"]))}</h2>
          <p>{html.escape(str(case["note"]))}</p>
          {probe_html}
        </div>
      </article>
"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    cards = "\n".join(render_case(case) for case in CASES)
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    summary = {
        "generatedAt": generated_at,
        "report": REPORT.name,
        "caseCount": len(CASES),
        "cases": [collect_case_summary(case) for case in CASES],
    }
    SUMMARY.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mideas MSX2 Visual Smoke Report</title>
  <style>
    body {{ margin: 0; font-family: Segoe UI, Arial, sans-serif; background: #101418; color: #e9eef2; }}
    header {{ padding: 24px 28px 12px; border-bottom: 1px solid #26313a; }}
    h1 {{ margin: 0 0 6px; font-size: 24px; }}
    .muted, header p {{ color: #aab6c1; }}
    main {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; padding: 18px; }}
    .card {{ background: #171d23; border: 1px solid #2c3742; border-radius: 8px; overflow: hidden; }}
    img {{ display: block; width: 100%; image-rendering: pixelated; background: #050607; }}
    .body {{ padding: 12px 14px 14px; }}
    h2 {{ margin: 0 0 6px; font-size: 17px; }}
    p {{ margin: 0 0 10px; line-height: 1.35; }}
    pre {{ margin: 0; max-height: 150px; overflow: auto; padding: 10px; background: #0b0f13; border-radius: 6px; font-size: 12px; }}
  </style>
</head>
<body>
  <header>
    <h1>Mideas MSX2 Visual Smoke Report</h1>
    <p>Generated {html.escape(generated_at)} from OpenMSX screenshots and RAM probes.</p>
  </header>
  <main>
{cards}
  </main>
</body>
</html>
""", encoding="utf-8")
    print(f"MSX2 visual report ready: {REPORT}")
    print(f"MSX2 visual report summary ready: {SUMMARY}")


if __name__ == "__main__":
    main()

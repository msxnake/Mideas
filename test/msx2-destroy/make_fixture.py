"""Builds the destroy_tile smoke fixture from any MSX2 bitmap-room project JSON.

Usage: python make_fixture.py <project.json> [fixture_on.json]

Enables the destroy_tile skill on the player (digKey=B, hitsPerTile=2,
digCooldown=8, hold-to-dig) and marks EVERY atlas entry of every bitmap room
as destructible, so any solid wall can be dug during the smoke. Keeps the
Game Flow intact (removing it would reroute the build to the presentation
backend). Then:

  python ../../scripts/build_mideas_unified_rom.py --json fixture_on.json \
      --project-root ../.. --asm-output on.asm --rom-output on.rom \
      --allow-tsc-errors --rom-mode megarom --target-format konami
  openmsx -machine C-BIOS_MSX2 -cart on.rom -romtype KonamiSCC \
      -script destroy_persist2.tcl     # or destroy_diag3.tcl
      # (mapper Konami SCC since branch mapper_2m; -romtype konami also boots)
"""
import json, io, sys

src = sys.argv[1]
dst = sys.argv[2] if len(sys.argv) > 2 else 'fixture_on.json'
d = json.load(io.open(src, encoding='utf-8'))
player = next(a for a in d['assets'] if a['type'] == 'msx2player')
params = {"digKey": 1, "hitsPerTile": 2, "digCooldown": 8,
          "requireKeyRelease": False, "destroyedLimit": 64, "digSound": True}
for key in ('player', 'compact'):
    node = player['data'].get(key)
    if isinstance(node, dict):
        skills = node.setdefault('activeSkills', [])
        if 'destroy_tile' not in skills:
            skills.append('destroy_tile')
        node.setdefault('skillParameters', {})['destroy_tile'] = params
marked = 0
for asset in d['assets']:
    if asset['type'] != 'msx2bitmaproom':
        continue
    for entry in (asset['data'].get('atlas') or {}).get('entries', []):
        entry['destructible'] = True
        marked += 1
json.dump(d, io.open(dst, 'w', encoding='utf-8'))
print(f'{dst}: destroy_tile enabled, {marked} atlas entries marked destructible')

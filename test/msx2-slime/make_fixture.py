"""Builds the SlimeCeiling smoke fixture from the destroy_tile base project.

Usage: python make_fixture.py [../msx2-destroy/fixture_base.json] [fixture_slime.json]

Adds ONE slimeCeiling enemy to the boot room (pan1) standing on the floor at
tile (6,9): it crawls, hops to the ceiling every 32 px, crawls upside down and
drops back. Uses the existing 'enemy_1' sprite and contact damage 1.

  python ../../scripts/build_mideas_unified_rom.py --json fixture_slime.json \
      --project-root ../.. --asm-output slime.asm --rom-output slime.rom \
      --allow-tsc-errors --rom-mode megarom --target-format konami
  openmsx -machine C-BIOS_MSX2 -cart slime.rom -romtype KonamiSCC \
      -script slime_smoke.tcl
"""
import json, io, sys

src = sys.argv[1] if len(sys.argv) > 1 else '../msx2-destroy/fixture_base.json'
dst = sys.argv[2] if len(sys.argv) > 2 else 'fixture_slime.json'
d = json.load(io.open(src, encoding='utf-8'))

sprite = next(a for a in d['assets'] if a['type'] == 'msx2sprite' and a['name'] == 'enemy_1')
room = next(a for a in d['assets'] if a['type'] == 'msx2bitmaproom' and a['name'] == 'pan1')

slime = {
    'id': 'slime_smoke_1',
    'name': 'Slime Ceiling Smoke',
    'kind': 'enemy',
    'position': {'x': 6, 'y': 9},
    'components': {
        'msx2_transform': {},
        'msx2_hardware_sprite': {'msx2SpriteAssetId': sprite['id']},
        'msx2_movement': {
            'mode': 'slimeCeiling', 'direction': 1, 'travelPx': 32,
            'boundsUnit': 'px', 'minX': 16, 'maxX': 160,
        },
        'msx2_collision': {'damage': 1, 'hitboxW': 16, 'hitboxH': 16, 'offsetX': 0, 'offsetY': 0},
    },
    'params': {'runtime': 'MSX2', 'engine': 'slimeCeiling', 'movement': 'slimeCeiling', 'direction': 1, 'travelPx': 32},
}
room['data'].setdefault('entities', []).append(slime)
json.dump(d, io.open(dst, 'w', encoding='utf-8'))
print(f"{dst}: slimeCeiling enemy added to {room['name']} at tile (6,9), sprite={sprite['id']}")

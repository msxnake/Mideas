"""Builds the SlimeCeiling smoke fixture from test122.json (copied here as fixture_base.json).

Usage: python make_fixture.py [fixture_base.json] [fixture_slime.json]

Adds ONE slimeCeiling enemy to the BOOT room (pan2, worldmap start) standing on
the floor at tile (6,10), under the floating platform (rows 2-3, cols 4-10)
that acts as its ceiling: it crawls, hops to the ceiling every 32 px, crawls
upside down and drops back. Uses the project's 'slime1' sprite (16x16,
2 frames) and contact damage 1 (one heart).

  python ../../scripts/build_mideas_unified_rom.py --json fixture_slime.json \
      --project-root ../.. --asm-output slime.asm --rom-output slime.rom \
      --allow-tsc-errors --rom-mode megarom --target-format konami
  openmsx -machine C-BIOS_MSX2 -cart slime.rom -romtype KonamiSCC \
      -script slime_smoke.tcl
"""
import json, io, sys

src = sys.argv[1] if len(sys.argv) > 1 else 'fixture_base.json'
dst = sys.argv[2] if len(sys.argv) > 2 else 'fixture_slime.json'
d = json.load(io.open(src, encoding='utf-8'))

sprite = next(a for a in d['assets'] if a['type'] == 'msx2sprite' and a['name'] == 'slime1')
room = next(a for a in d['assets'] if a['type'] == 'msx2bitmaproom' and a['name'] == 'pan2')

# Drop the aimed turret from the boot room: its bullets keep the player in
# permanent i-frames, which is pure noise for the slime smoke.
room['data']['entities'] = [
    e for e in (room['data'].get('entities') or []) if e.get('name') != 'Turret1'
]

slime = {
    'id': 'slime_smoke_1',
    'name': 'Slime Ceiling Smoke',
    'kind': 'enemy',
    'position': {'x': 6, 'y': 10},
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
print(f"{dst}: slimeCeiling enemy added to {room['name']} at tile (6,10), sprite={sprite['id']}")

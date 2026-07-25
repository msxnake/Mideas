"""Builds the bitmap BOSS smoke fixture from the shared bitmap-room base
(test122.json copy, same base as the slime smoke).

Adds to the BOOT room (pan2):
  - a 64x64 procedural "demon" painted into appended source-atlas rows,
  - an atlas entry 'boss_body_smoke' covering it,
  - a kind:'boss' entity patrolling X 16..160 at y tile 2 with hp 3.

Usage: python make_fixture.py

  python ../../scripts/build_mideas_unified_rom.py --json fixture_boss.json \
      --project-root ../.. --asm-output boss.asm --rom-output boss.rom \
      --allow-tsc-errors --rom-mode megarom --target-format konami
  openmsx -machine C-BIOS_MSX2 -cart boss.rom -romtype KonamiSCC \
      -script boss_smoke.tcl
"""
import json, io

SRC, DST = 'fixture_base.json', 'fixture_boss.json'
W = H = 64

d = json.load(io.open(SRC, encoding='utf-8'))
room = next(a for a in d['assets'] if a['type'] == 'msx2bitmaproom' and a['name'] == 'pan2')
atlas = room['data']['atlas']
pixels = atlas['pixels']
atlas_w = atlas['width']
base_y = len(pixels)

# --- paint a chunky demon: dark-red body, horns, yellow eyes, white fangs ---
BODY, DARK, HORN, EYE, PUPIL, FANG, BG = 8, 6, 10, 10, 1, 15, 0
art = [[BG] * W for _ in range(H)]
for y in range(8, 60):
    for x in range(6, 58):
        inside = (8 <= y < 56 and 10 <= x < 54) or (56 <= y < 60 and 14 <= x < 50)
        if inside:
            edge = y in (8, 55) or x in (10, 53)
            art[y][x] = DARK if edge else BODY
for y in range(0, 12):                     # horns
    for x in range(0, 10):
        if x + y < 10:
            art[y][x + 4] = HORN
            art[y][W - 5 - x] = HORN
for cy, cx in ((24, 22), (24, 42)):        # eyes
    for y in range(cy - 4, cy + 4):
        for x in range(cx - 5, cx + 5):
            art[y][x] = EYE
    for y in range(cy - 2, cy + 2):
        for x in range(cx - 2, cx + 2):
            art[y][x] = PUPIL
for i, x in enumerate(range(20, 45, 6)):   # fangs over the mouth band
    for y in range(42, 48):
        art[y][x] = art[y][x + 1] = FANG if (y - 42) < 4 - (i % 2) else art[y][x]
for row in art:                            # append under the existing atlas
    padded = row + [0] * (atlas_w - W)
    pixels.append(padded)
atlas['height'] = len(pixels)

atlas['entries'].append({
    'id': 'boss_body_smoke', 'name': 'Boss Body Smoke',
    'sx': 0, 'sy': base_y, 'w': W, 'h': H,
})

# --- Phase B chain barrier: a single 16x16 "chain link" tile ---
GREY, WHITE = 14, 15
chain_y = len(pixels)
chain = [[BG] * atlas_w for _ in range(16)]
for y in range(16):
    for x in range(16):
        dx, dy = x - 8, y - 8
        dist = dx * dx + dy * dy
        if 20 <= dist <= 40:
            chain[y][x] = WHITE
        elif 12 <= dist < 20 or 40 < dist <= 58:
            chain[y][x] = GREY
for row in chain:
    pixels.append(row)
atlas['height'] = len(pixels)
atlas['entries'].append({
    'id': 'boss_chain_smoke', 'name': 'Boss Chain Smoke',
    'sx': 0, 'sy': chain_y, 'w': 16, 'h': 16,
})

# --- Phase D projectile: a small 8x8 fireball ---
FIRE, CORE = 9, 10
proj_y = len(pixels)
proj = [[BG] * atlas_w for _ in range(8)]
for y in range(8):
    for x in range(8):
        dx, dy = x - 3.5, y - 3.5
        dist = dx * dx + dy * dy
        if dist <= 2.5:
            proj[y][x] = CORE
        elif dist <= 10:
            proj[y][x] = FIRE
for row in proj:
    pixels.append(row)
atlas['height'] = len(pixels)
atlas['entries'].append({
    'id': 'boss_proj_smoke', 'name': 'Boss Projectile Smoke',
    'sx': 0, 'sy': proj_y, 'w': 8, 'h': 8,
})

boss = {
    'id': 'boss_smoke_1',
    'name': 'Bitmap Boss Smoke',
    'kind': 'boss',
    'position': {'x': 4, 'y': 2},
    'components': {
        'msx2_transform': {},
        'msx2_movement': {'mode': 'patrolX', 'direction': 1, 'boundsUnit': 'px', 'minX': 16, 'maxX': 160},
        'msx2_collision': {'damage': 1, 'hitboxW': W, 'hitboxH': H, 'offsetX': 0, 'offsetY': 0},
    },
    'params': {
        'runtime': 'MSX2', 'engine': 'bitmapBoss', 'movement': 'patrolX', 'direction': 1,
        'bossAtlasEntryId': 'boss_body_smoke',
        'bossFrames': 1, 'bossAnimDelay': 12, 'bossHp': 3, 'bossDamage': 1, 'bossInterval': 3,
        # Phase A Boss Defeat Actions: raise a persistent global flag on death.
        'onDefeated': [
            {'action': 'setFlag', 'flag': 'boss_demon_defeated'},
            {'action': 'giveKey', 'count': 1},
        ],
        # Phase E damage zones: eyes are weak points (x2), the body is armour.
        # Order matters: weak points must come BEFORE the armour that contains them.
        'damageZones': [
            {'id': 'eye_l', 'type': 'weak_point', 'x': 17, 'y': 20, 'w': 10, 'h': 8, 'damageMultiplier': 2},
            {'id': 'eye_r', 'type': 'weak_point', 'x': 37, 'y': 20, 'w': 10, 'h': 8, 'damageMultiplier': 2},
            {'id': 'body', 'type': 'invulnerable', 'x': 0, 'y': 0, 'w': 64, 'h': 64},
        ],
        # Phase B chain barrier: seal the room perimeter with this tile while alive.
        'bossBarrierTileId': 'boss_chain_smoke',
        # Phase D projectiles: fire a small bitmap bullet at the player.
        'bossProjectileKind': 'sprite',
        'bossShootInterval': 40, 'bossProjectileSpeed': 3, 'bossProjectileDamage': 1,
        # Phase D attack phases: the boss gets angrier as it loses health.
        'bossPhases': [
            {'id': 'phase_1', 'enterWhenHpBelowPercent': 100, 'interval': 40, 'projectileSpeed': 3},
            {'id': 'phase_2', 'enterWhenHpBelowPercent': 66, 'interval': 25, 'projectileSpeed': 3},
            {'id': 'phase_3', 'enterWhenHpBelowPercent': 33, 'interval': 15, 'projectileSpeed': 4},
        ],
    },
}
# A boss room has NO regular enemies (they only return once the boss is down),
# which is exactly what lets the boss reuse their sprite slots for its bullets.
# Also drop the turret (permanent i-frames noise in the smoke).
room['data']['entities'] = [
    e for e in (room['data'].get('entities') or [])
    if e.get('name') != 'Turret1' and e.get('kind') not in ('enemy', 'turret')
]
room['data']['entities'].append(boss)

# Enable the shoot skill so the bullet pool runs and the smoke can verify the
# bullet->boss damage/death path (the probe pokes bullets straight into the pool).
player = next(a for a in d['assets'] if a['type'] == 'msx2player')
player_obj = player.setdefault('data', {}).setdefault('player', {})
skills = player_obj.setdefault('activeSkills', [])
if 'shoot' not in skills:
    skills.append('shoot')

json.dump(d, io.open(DST, 'w', encoding='utf-8'))
print(f"{DST}: 64x64 boss entry at source atlas sy={base_y}, entity patrol X 16..160, hp=3")

"""Builds the animated boss-death smoke fixture.

Takes the stamp-body boss fixture and adds three 16x16 explosion stamps
(small spark -> full blast -> dissipating ring), then wires them as the ORDERED
frames of one animated explosion on the Demon Guardian definition.

Usage: python make_death_anim_fixture.py

  python ../../scripts/build_mideas_unified_rom.py --json fixture_boss_death_anim.json \
      --project-root ../.. --asm-output boss_death_anim.asm --rom-output boss_death_anim.rom \
      --allow-tsc-errors --rom-mode megarom --target-format konami
  openmsx -machine C-BIOS_MSX2 -cart boss_death_anim.rom -romtype KonamiSCC \
      -script boss_death_anim.tcl
"""
import json, io, math

SRC, DST = 'fixture_stampbody.json', 'fixture_boss_death_anim.json'
SIZE = 16

d = json.load(io.open(SRC, encoding='utf-8'))

# Reuse a palette that already exists in the project so the stamp resolves to
# real SCREEN 5 colours instead of the editor's fallback.
donor = next(a for a in d['assets'] if a['type'] == 'msx2bitmapstamp')
palette = donor['data']['palette']

WHITE, YELLOW, ORANGE, RED = 15, 10, 9, 6


def blast(radius, ring, colors):
    """A filled (or hollow) circle of `radius`, drawn with `colors` by depth."""
    out = [0] * (SIZE * SIZE)
    cx = cy = (SIZE - 1) / 2.0
    for y in range(SIZE):
        for x in range(SIZE):
            dist = math.hypot(x - cx, y - cy)
            if dist > radius or (ring and dist < radius - 2.2):
                continue
            depth = min(len(colors) - 1, int((radius - dist) / max(radius, 1) * len(colors)))
            out[y * SIZE + x] = colors[depth]
    return out


FRAMES = [
    ('boss_blast_1', blast(4.0, False, [ORANGE, YELLOW, WHITE])),
    ('boss_blast_2', blast(7.6, False, [RED, ORANGE, YELLOW, WHITE])),
    ('boss_blast_3', blast(7.6, True, [RED, ORANGE, YELLOW])),
]

stamp_ids = []
for name, pixels in FRAMES:
    asset_id = f'{name}_stamp'
    stamp_ids.append(asset_id)
    d['assets'].append({
        'id': asset_id,
        'name': name,
        'type': 'msx2bitmapstamp',
        'data': {
            'id': asset_id,
            'name': name,
            'savedAt': '2026-08-03T00:00:00.000Z',
            'stamp': {
                'id': asset_id,
                'name': name,
                'mode': 'SCREEN5_BITMAP_STAMP',
                'columns': 1,
                'rows': 1,
                'tileWidth': SIZE,
                'tileHeight': SIZE,
                'sourceType': 'generated',
                'paletteId': donor['data']['stamp']['paletteId'],
                'tiles': [{
                    'id': f'{asset_id}_tile_0',
                    'name': f'{name}_r0_c0',
                    'mode': 'SCREEN5_BITMAP',
                    'width': SIZE,
                    'height': SIZE,
                    'sourceType': 'generated',
                    'paletteId': donor['data']['stamp']['paletteId'],
                    'pixelData': pixels,
                    'createdAt': '2026-08-03T00:00:00.000Z',
                    'updatedAt': '2026-08-03T00:00:00.000Z',
                }],
                'createdAt': '2026-08-03T00:00:00.000Z',
                'updatedAt': '2026-08-03T00:00:00.000Z',
            },
            'palette': palette,
        },
    })

# Custom PSG asset deliberately authored on channel A. The SCREEN 5 boss
# compiler must remap it to the gameplay SFX channel C and flatten the hardware
# envelope step so music on A/B keeps ownership of AY R11-R13.
sound_id = 'boss_custom_explosion_sfx'
d['assets'].append({
    'id': sound_id,
    'name': 'Boss Custom Explosion',
    'type': 'sound',
    'data': {
        'id': sound_id,
        'name': 'Boss Custom Explosion',
        'tempoBPM': 120,
        'channels': [
            {
                'id': 'A',
                'loop': False,
                'steps': [
                    {'id': 'boom-1', 'tonePeriod': 1008, 'volume': 15,
                     'toneEnabled': True, 'noiseEnabled': True,
                     'useEnvelope': True, 'durationMs': 70},
                    {'id': 'boom-2', 'tonePeriod': 480, 'volume': 11,
                     'toneEnabled': False, 'noiseEnabled': True,
                     'useEnvelope': False, 'durationMs': 100},
                    {'id': 'boom-3', 'tonePeriod': 240, 'volume': 5,
                     'toneEnabled': False, 'noiseEnabled': True,
                     'useEnvelope': False, 'durationMs': 150},
                ],
            },
            {'id': 'B', 'loop': False, 'steps': []},
            {'id': 'C', 'loop': False, 'steps': []},
        ],
        'noisePeriod': 9,
        'envelopePeriod': 256,
        'envelopeShape': 9,
        'masterVolume': 1,
    },
})

boss = next(a for a in d['assets'] if a['type'] == 'msx2boss')
params = boss['data']['params']
params['bossDeathExplosionStampIds'] = stamp_ids
params['bossDeathExplosionAnimated'] = True
params['bossDeathExplosionCount'] = 10
params['bossDeathExplosionInterval'] = 8
params['bossDeathExplosionFrameDelay'] = 5
params['bossDeathExplosionHoldFrames'] = 24
params['bossDeathExplosionSoundAssetId'] = sound_id

json.dump(d, io.open(DST, 'w', encoding='utf-8'), ensure_ascii=False)
print(f'{DST}: {len(stamp_ids)} explosion frames -> {stamp_ids}; sound={sound_id}')

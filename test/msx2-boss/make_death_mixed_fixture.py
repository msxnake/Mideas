"""Mixed death-FX fixtures: one animated boss + one legacy random-variant boss.

Only a project that uses BOTH presentations keeps the animated 6-byte table
header on a legacy room, so this is the fixture that proves the shared header
stride does not break the original random-blast path.

Writes two projects:
  fixture_boss_death_mixed.json             animated in the boot room (pan2)
  fixture_boss_death_mixed_boot_legacy.json legacy in the boot room, so a smoke
                                            script can drive the legacy path

Usage: python make_death_anim_fixture.py && python make_death_mixed_fixture.py

  python ../../scripts/build_mideas_unified_rom.py --json fixture_boss_death_mixed_boot_legacy.json \
      --project-root ../.. --asm-output boss_death_mixed_bl.asm --rom-output boss_death_mixed_bl.rom \
      --allow-tsc-errors --rom-mode megarom --target-format konami
  openmsx -machine C-BIOS_MSX2 -cart boss_death_mixed_bl.rom -romtype KonamiSCC \
      -script boss_death_mixed_bl.tcl
"""
import json, io, copy

SRC = 'fixture_boss_death_anim.json'
d = json.load(io.open(SRC, encoding='utf-8'))

# A second definition that keeps the original random-variant cloud.
boss_def = next(a for a in d['assets'] if a['type'] == 'msx2boss')
legacy = copy.deepcopy(boss_def)
legacy['id'] = 'bossdef_demon_legacy'
legacy['name'] = 'Demon Guardian (legacy FX)'
params = legacy['data']['params']
params['bossDeathExplosionAnimated'] = False
params['bossDeathExplosionCount'] = 6
params.pop('bossBarrierTileId', None)      # only one room needs the chain
d['assets'].append(legacy)

# Place it in a second room, next to the animated one in the boot room.
boot_room, other_room = d['assets'][3], d['assets'][5]
boss_entity = next(e for e in boot_room['data']['entities'] if e.get('kind') == 'boss')
clone = copy.deepcopy(boss_entity)
clone['id'] = 'boss_smoke_legacy'
clone['name'] = 'Bitmap Boss Legacy FX'
clone['params']['bossId'] = legacy['id']
other_room['data'].setdefault('entities', []).append(clone)

json.dump(d, io.open('fixture_boss_death_mixed.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(f"fixture_boss_death_mixed.json: animated in {boot_room['name']}, legacy in {other_room['name']}")

# Same project with the two definitions swapped, so the BOOT room runs the
# legacy path inside an animated build.
boss_entity['params']['bossId'], clone['params']['bossId'] = clone['params']['bossId'], boss_entity['params']['bossId']
json.dump(d, io.open('fixture_boss_death_mixed_boot_legacy.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(f"fixture_boss_death_mixed_boot_legacy.json: legacy in {boot_room['name']}, animated in {other_room['name']}")

#!/usr/bin/env node
/**
 * Contract checks for the SCREEN 5 bitmap bat: movement mode 13 (FlyBounce8).
 *
 * The bat drifts along one of 8 headings, ignores tiles entirely, bounces only
 * on the room edges and re-rolls its heading every turnPx pixels. Two things
 * are easy to break and expensive to notice:
 *   - the mode never reaching the ROM (the supported-movement gate, the table
 *     byte order, the editor's movement-patch whitelist);
 *   - the random turn being drawn PER SLOT, which would split a multi-layer bat
 *     into layers flying in different directions.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const read = (...parts) => readFileSync(join(root, ...parts), 'utf8');

const runtime = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2EntityRuntimeGenerator.ts');
const enemyGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapEnemyGenerator.ts');
const roomGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts');
const editor = read('components', 'editors', 'Msx2BitmapScreenEditor.tsx');
const catalog = read('components', 'msx2_screen4_editor', 'msx2EntityCatalog.ts');
const types = read('types.ts');
const library = read('data', 'enemyLibrary.ts');

// The reroll block must hash the LOGICAL origin (visual x/y minus this layer's
// cell offset, ix+14/ix+15) instead of consuming one PRNG byte per slot.
const reroll = enemyGen.split('.fly8_reroll:')[1]?.split('.enemy_step_slime')[0] || '';

const checks = [
  ['Mode 13 is declared once and exported',
    runtime.includes('export const MSX2_ENEMY_MOVEMENT_FLY_BOUNCE_8 = 13;')
    && runtime.includes('MSX2_FLY_BOUNCE_8_DEFAULT_TURN_PX = 100')],
  ['Movement aliases resolve to mode 13',
    runtime.includes("normalized === 'flybounce8'") && runtime.includes("movement === 'murcielago'")],
  ['Bounds are forced to the whole room, not the authored patrol span',
    runtime.includes('hasGearWheel || hasFlyBounce8 ? 0 :')
    && runtime.includes('hasGearWheel || hasFlyBounce8 ? 240 :')
    && runtime.includes('hasFlyBounce8 ? 176 :')],
  ['turnPx is resolved and carried on the slot',
    runtime.includes("getComponentValue(entity, 'msx2_movement', 'turnPx'")
    && runtime.includes('turnPx: hasFlyBounce8 ? fly8TurnPx : 0,')],
  ['The bitmap backend accepts mode 13 (without this the bat is dropped)',
    roomGen.includes('|| mode === MSX2_ENEMY_MOVEMENT_FLY_BOUNCE_8;')],
  ['An Enemy Asset with behavior FlyBounce8 overrides a stale placement snapshot',
    roomGen.includes("FlyBounce8: 'flyBounce8',")],
  ['turnPx reaches the ROM table, and empty slots pad it',
    roomGen.includes('if (fly8Enabled) table.push(0);')
    && roomGen.includes('slot.mode === MSX2_ENEMY_MOVEMENT_FLY_BOUNCE_8 ? Math.max(1, slot.turnPx & 0xff) : 0')],
  ['Pool/table strides grow by one term per engine instead of one constant per combination',
    enemyGen.includes("+ (data?.fly8Enabled ? BITMAP_ENEMY_POOL_STRIDE_FLY8_BYTES : 0)")
    && enemyGen.includes('const TABLE_STRIDE = 22 + (slime ? 1 : 0) + (gear ? 2 : 0) + (fly8 ? 1 : 0);')],
  ['Bat state sits behind the other engines’ pool bytes',
    enemyGen.includes('const FLY8_LEFT_OFFSET = 23 + (slime ? 3 : 0) + (gear ? 5 : 0);')
    && enemyGen.includes('const FLY8_TURN_OFFSET = FLY8_LEFT_OFFSET + 1;')],
  ['The dispatch and the flight block are emitted only for bat builds',
    enemyGen.includes('${fly8 ? `    cp ${MSX2_ENEMY_MOVEMENT_FLY_BOUNCE_8}')
    && enemyGen.includes('.enemy_step_fly8:')
    && enemyGen.includes('bitmap_enemy_dir8_table')],
  ['The 8 headings are the dx,dy sign pairs the pool expects',
    enemyGen.includes('[1, 0, 1, 1, 0, 1, 0xFF, 1, 0xFF, 0, 0xFF, 0xFF, 0, 0xFF, 1, 0xFF]')],
  ['The PRNG advances once per FRAME, outside the per-slot loop',
    enemyGen.includes('One PRNG step per FRAME, not per draw')
    && enemyGen.split('ld ix, bitmap_enemy_pool')[0].includes('ld (bitmap_enemy_rand_seed), a')],
  ['The seed reuses the byte ramBytes already reserved (no RAM growth)',
    enemyGen.includes('bitmap_enemy_rand_seed EQU ${asmWord(updateLaneAddr + 1)}')
    && enemyGen.includes('const ramBytes = 3 + maxSlots * POOL_STRIDE;')],
  ['Every hardware layer of one bat rolls the SAME heading',
    reroll.includes('ld e, (ix+14)') && reroll.includes('ld e, (ix+15)')
    && reroll.includes('ld a, (bitmap_enemy_rand_seed)') && reroll.includes('and 7')],
  ['The reroll keeps the registers bitmap_update_enemies promises to preserve',
    reroll.includes('push bc') && reroll.includes('push de') && reroll.includes('push hl')
    && reroll.includes('pop hl') && reroll.includes('pop de') && reroll.includes('pop bc')],
  ['The bat never probes a tile',
    !enemyGen.split('.enemy_step_fly8:')[1].split('.fly8_reroll:')[0].includes('bitmap_probe_solid')],
  ['The editor offers the mode and persists turnPx',
    editor.includes('<option value="flyBounce8">')
    && editor.includes("'respawnSeconds', 'turnPx'")
    && editor.includes("selectedMovementMode === 'flyBounce8'")],
  ['The shared catalog knows the behavior, the movement and the param',
    types.includes("| 'FlyBounce8' |")
    && catalog.includes("case 'FlyBounce8': return { movementName: 'flyBounce8', implemented: true };")
    && catalog.includes("turnPx: { label: 'Bat turn distance (px)'")
    && catalog.includes("{ value: 'flyBounce8', label: 'Fly 8-way bounce (bat)' }")],
  ['A ready-made bat template exists in the enemy library',
    library.includes("templateId: 'bat_fly_bounce_8'") && library.includes("type: 'FlyBounce8'")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);

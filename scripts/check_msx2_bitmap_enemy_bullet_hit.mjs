#!/usr/bin/env node
/**
 * Contract checks for player bullets vs SCREEN 5 bitmap-room enemies.
 *
 * The bug this guards: bitmap_bullet_check_enemy_collision used to be a plain
 * `ret` unless the project had a boss, so bullets flew straight through every
 * ordinary enemy. Three things are easy to break and expensive to notice:
 *   - the enemy pool never being wired into the shoot stub at all;
 *   - the boss losing its first refusal when both systems exist (a shot into
 *     the boss body would also kill whatever stood behind it);
 *   - the kill being applied to ONE pool slot, which splits a multi-layer enemy
 *     (a bat is a body layer plus an eyes layer) into a corpse and a survivor.
 *
 * Verified end to end on hardware by test/msx2-bats/bats_shoot.tcl.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
// core.autocrlf checks out these sources with CRLF, so every multi-line literal
// below would silently miss without normalizing first.
const read = (...parts) => readFileSync(join(root, ...parts), 'utf8').replace(/\r\n/g, '\n');

const enemyGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapEnemyGenerator.ts');
const shootGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapShootGenerator.ts');
const roomGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts');

const hitBody = enemyGen.split('bitmap_enemy_bullet_hit:')[1]?.split('\n`;')[0] || '';
const killBody = hitBody.split('.ebh_kill_layers:')[1] || '';
const searchBody = hitBody.split('.ebh_kill_layers:')[0] || '';

const checks = [
  ['The shoot stub still jumps to whatever target label it is given',
    shootGen.includes('bitmap_bullet_check_enemy_collision:')
    && shootGen.includes('${opts.enemyCollisionJumpLabel ? `    jp ${opts.enemyCollisionJumpLabel}` : `    ret`}')],
  ['The room generator offers the enemy pool as a bullet target',
    roomGen.includes('const bulletHitsEnemies = shootConfig.enabled && enemyData.maxSlots > 0;')
    && roomGen.includes("? (bulletHitsEnemies ? 'bitmap_bullet_targets' : 'bitmap_boss_bullet_hit')")
    && roomGen.includes(": (bulletHitsEnemies ? 'bitmap_enemy_bullet_hit' : undefined)")
    && roomGen.includes('enemyCollisionJumpLabel: bulletTargetLabel,')],
  ['A ROM with no shoot skill emits none of this (byte-identical to before)',
    enemyGen.includes('const bulletHitAsm = !opts.bulletHit ?')
    && roomGen.includes('bulletHit: bulletHitsEnemies')],
  ['Boss and enemies chain in that order, and the boss gets first refusal',
    enemyGen.includes('bitmap_bullet_targets:')
    && enemyGen.includes('call ${opts.bulletHit.chainFromBossLabel}')
    && enemyGen.includes('    ret z                     ; the boss consumed this bullet')
    && enemyGen.includes('    jp bitmap_enemy_bullet_hit')],
  ['The dispatcher is emitted only when a boss exists',
    enemyGen.includes('${!opts.bulletHit.chainFromBossLabel ? \'\' : `; ---')],
  ['The search skips slots already dead, so one corpse cannot eat every bullet',
    searchBody.includes('ld a, (iy+13)') && searchBody.includes('cp #FF')
    && searchBody.includes('jp z, .ebh_next')],
  ['Overlap is a true absolute difference on both axes',
    searchBody.includes('sub (iy+0)') && searchBody.includes('sub (iy+1)')
    && (searchBody.match(/\n {4}neg\n/g) || []).length === 2
    && (searchBody.match(/cp 16/g) || []).length === 2],
  ['A hit consumes the bullet',
    searchBody.includes('ld (ix+0), a              ; the bullet is spent on this enemy')],
  ['Death is the movement-mode #FF the rest of the runtime already honours',
    killBody.includes('ld (iy+13), #FF')
    && enemyGen.includes('ld a, (ix+13)             ; #FF = killed by a thrown object')
    && enemyGen.includes('cp #FF\n    jp z, .sat_slot_${i}_hidden')],
  ['Every hardware layer of one enemy dies together, keyed on the logical origin',
    killBody.includes('sub (iy+14)') && killBody.includes('sub (iy+15)')
    && killBody.includes('cp d') && killBody.includes('cp e')],
  ['The layer sweep keeps its key across the pointer advance',
    killBody.includes('push de                   ; D/E carry the logical-origin key')
    && killBody.includes('pop de')],
  ['The routine keeps every register bitmap_step_bullets promises to preserve',
    searchBody.includes('push bc') && searchBody.includes('push de')
    && searchBody.includes('push hl') && searchBody.includes('push iy')
    && searchBody.includes('pop iy') && searchBody.includes('pop hl')
    && searchBody.includes('pop de') && searchBody.includes('pop bc')],
  ['Both pool walks use dec/jp, not djnz, because the bodies exceed its range',
    (hitBody.match(/\n {4}dec b\b/g) || []).length === 2
    && (hitBody.match(/\n {4}jp nz, \.ebh_(kill_)?loop\b/g) || []).length === 2
    && !/\n {4}djnz\b/.test(hitBody)],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
if (failed) process.exit(1);

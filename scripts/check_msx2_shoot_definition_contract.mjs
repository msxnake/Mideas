#!/usr/bin/env node
/**
 * Contract checks for the MSX2 Shoots Definition: authored angle, fixed-angle
 * fan/ring (record bit 7) and the spiral (record bit 6 + rotation RAM), plus
 * the body-centre aim fix. Source-level contracts, same style as
 * check_msx2_boss_death_fx_contract.mjs.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
// core.autocrlf normalisation: see check_msx2_boss_death_fx_contract.mjs
const read = (...parts) => readFileSync(join(root, ...parts), 'utf8').replace(/\r\n/g, '\n');

const types = read('types.ts');
const shoot = read('utils', 'msx2Shoot.ts');
const editor = read('components', 'editors', 'Msx2ShootEditor.tsx');
const bossGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.ts');

const checks = [
  ['Definition stores the fine angle, fixedAngle and spin',
    types.includes('angle?: number') &&
    types.includes('fixedAngle?: boolean') &&
    types.includes('spin?: boolean')],
  ['Bake maps the authored angle and flags fixedAngle (bit 7) / spin (bit 6)',
    shoot.includes('export function shootAngleIndex') &&
    shoot.includes('shootUsesAuthoredAngle(shoot) && base >= 2 ? base | 0x80 : base') &&
    shoot.includes('if (shoot.spin === true && base !== 0) pattern |= 0x40')],
  ['Legacy assets without angle keep the 8-compass direction',
    shoot.includes('return shootRingIndex(shoot.direction);')],
  ['Aim lookup compares the player BODY CENTRE (hitbox aware), not the render origin',
    bossGen.includes('const aimOffsetX = clampInt(hit.x + Math.floor(Math.max(1, hit.w) / 2), 0, 255, 8)') &&
    bossGen.includes('const aimOffsetY = clampInt(hit.y + Math.floor(Math.max(1, hit.h) / 2), 0, 255, 8)') &&
    bossGen.includes('player body centre X (hitbox aware)') &&
    bossGen.includes('player body centre Y (hitbox aware)')],
  ['Wave runtime honours fixedAngle (bit 7) before the aim lookup',
    bossGen.includes('bit 7, c') && bossGen.includes('authored direction replaces the aim')],
  ['Spiral: pattern bit 6 rotates the base angle and boss_shoot_rot accumulates the stride',
    bossGen.includes('.bsw_spin:') &&
    bossGen.includes('bit 6, c') &&
    bossGen.includes('boss_shoot_rot EQU') &&
    bossGen.includes('every trigger starts the spiral clean') &&
    bossGen.includes('shootRamBytesTotal = SHOOT_RAM_BYTES + (shootSpinUsed ? 1 : 0)')],
  ['Pattern byte survives the wave loop (vector/spawn calls trash BC)',
    bossGen.includes('push bc') && bossGen.includes('pop bc') &&
    bossGen.includes('the pattern byte survives the spawn calls')],
  ['Editor exposes the 16-step angle, fixed-angle and spiral controls',
    editor.includes('ANGLE_OPTIONS') &&
    editor.includes('fire from a fixed angle') &&
    editor.includes('sweep the angle each wave') &&
    editor.includes('spiralWaves')],
];

let failures = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failures++;
}
console.log(`${checks.length - failures}/${checks.length} contracts green`);
process.exit(failures ? 1 : 0);

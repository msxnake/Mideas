#!/usr/bin/env node
/**
 * Contract checks for SCREEN 5 bitmap boss ATTACK PHASE ESCALATION.
 *
 * A phase used to be able to say only "shoot faster / harder". It can now also
 * change WHAT is fired (an authored `msx2shoot` pattern), how often the laser
 * waves come back, how often the body updates and how far it moves per update.
 *
 * These are not source greps: the generator is compiled and RUN twice, once on
 * a boss whose phases escalate and once on the same boss with plain phases. The
 * second run is the byte-identity contract — every one of the new runtime
 * pieces must be ABSENT from it, because a project that does not use the
 * feature must not pay a single ROM byte for it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(import.meta.url);
const BUILD_DIR = join(root, 'server', 'temp', 'tsbuild_bossphases');
const MODULE = 'utils/msxGenerator/generators/msx2/msx2BitmapBossGenerator.ts';

// ---- compile the generator module (about a second; it is one import graph) ---
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
if (!existsSync(tsc)) throw new Error('Local TypeScript not found. Run npm install.');
rmSync(BUILD_DIR, { recursive: true, force: true });
execFileSync(process.execPath, [
  tsc, '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020',
  '--outDir', BUILD_DIR, '--moduleResolution', 'node', '--skipLibCheck',
  '--noEmitOnError', 'false', MODULE,
], { cwd: root, stdio: 'pipe' });
const compiled = join(BUILD_DIR, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.js');
if (!existsSync(compiled)) throw new Error(`No generator build at ${compiled}`);
const gen = require(compiled);

// ---- the smallest project that produces a boss ------------------------------
const SHOOT_ID = 'shoot_fan';
const atlas = {
  entries: [
    { id: 'body32', sx: 0, sy: 0, w: 32, h: 32 },
    { id: 'laser16', sx: 32, sy: 0, w: 16, h: 16 },
  ],
};
const basePhases = [
  { id: 'phase_1', enterWhenHpBelowPercent: 100, interval: 90, projectileSpeed: 2 },
  { id: 'phase_2', enterWhenHpBelowPercent: 50, interval: 45, projectileSpeed: 3 },
];
const angryPhases = [
  basePhases[0],
  {
    ...basePhases[1],
    shootId: SHOOT_ID,
    laserInterval: 40,
    bodyInterval: 2,
    moveStepMultiplier: 3,
  },
];
const bossParams = phases => ({
  bossAtlasEntryId: 'body32',
  bossFrames: 1,
  bossHp: 10,
  bossDamage: 1,
  bossInterval: 4,
  bossMovement: 'patrolX',
  bossSpeed: 2,
  bossProjectileKind: 'sprite',
  bossShootInterval: 90,
  bossProjectileSpeed: 2,
  bossProjectileDamage: 1,
  bossLaserTileId: 'laser16',
  bossLaserInterval: 90,
  bossLaserDirectionMask: 0x05,
  bossPhases: phases,
});
const shoots = new Map([[SHOOT_ID, {
  id: SHOOT_ID,
  name: 'Fan',
  shoot: { pattern: 'spread', bulletCount: 2, direction: 'down', speed: 0, burstCount: 2, burstInterval: 8 },
}]]);

const buildData = phases => gen.buildBitmapRoomBossData(
  [{ name: 'boss room', atlas, entities: [{ kind: 'boss', position: { x: 64, y: 64 }, params: bossParams(phases) }] }],
  () => undefined,
  { hasKeys: false, doorOffsetById: new Map() },
  new Map(),
  new Map(),
  shoots,
);
const buildAsm = data => gen.buildBitmapBossSystemAsm(data, {
  ramBase: 0xd000,
  gameYOffset: 24,
  playerHitbox: { x: 4, y: 0, w: 8, h: 16 },
  damageInvulnFrames: 60,
  maxHealth: 3,
  projScratchBaseY: 800,
  spriteBullets: {
    satBase: 0x9c00, colorBase: 0x9800, patternAddr: 0x9000,
    patternNumber: 0, maxSlots: 2, color: 8,
  },
});

const plain = buildData(basePhases);
const angry = buildData(angryPhases);
const plainAsm = buildAsm(plain);
const angryAsm = buildAsm(angry);
const plainText = `${plainAsm.equates}${plainAsm.routinesAsm}${plainAsm.dataAsm}`;
const angryText = `${angryAsm.equates}${angryAsm.routinesAsm}${angryAsm.dataAsm}`;

/** The phase entries of the first room slot that actually carries a boss. */
const phaseEntries = (data, stride) => {
  const table = (data.phaseTables || []).find(row => (row?.[0] || 0) > 0) || [0];
  const out = [];
  for (let i = 0; i < table[0]; i++) out.push(table.slice(1 + i * stride, 1 + (i + 1) * stride));
  return out;
};

const plainRows = phaseEntries(plain, gen.BITMAP_BOSS_PHASE_ENTRY_BASE);
const angryRows = phaseEntries(angry, gen.BITMAP_BOSS_PHASE_ENTRY_FULL);

const editor = readFileSync(join(root, 'components', 'editors', 'Msx2BossEditor.tsx'), 'utf8').replace(/\r\n/g, '\n');
const types = readFileSync(join(root, 'types.ts'), 'utf8').replace(/\r\n/g, '\n');

const checks = [
  // ---- data model -----------------------------------------------------------
  ['A phase can name a shot pattern, a laser cadence, a body cadence and a step count',
    types.includes('shootId?: string')
    && types.includes('laserInterval?: number')
    && types.includes('bodyInterval?: number')
    && types.includes('moveStepMultiplier?: number')],

  // ---- the escalating build -------------------------------------------------
  ['Escalating phases switch the table to the 7-byte stride',
    angry.phaseTablesExtended === true
    && gen.BITMAP_BOSS_PHASE_ENTRY_FULL === 7
    && angryRows.length === 2
    && angryRows.every(row => row.length === 7)],
  ['Entries stay sorted most-damaged-first, with the overrides on the right phase',
    angryRows[0][0] === 5 && angryRows[1][0] === 10          // 50% and 100% of HP 10
    && angryRows[0][1] === 45 && angryRows[0][2] === 3        // interval / bullet speed
    && angryRows[0][3] === 1                                 // 1-based shoot pattern
    && angryRows[0][4] === 40 && angryRows[0][5] === 2 && angryRows[0][6] === 3
    && angryRows[1].slice(3).join(',') === '0,0,0,1'],       // untouched phase = neutral
  ['A phase-named shot pattern is baked even though no path references it',
    angry.shootRecords.length === 1 && angry.shootRecords[0][1] === 2],
  ['The resolved phase is parked in RAM once per boss update',
    angryText.includes('bitmap_boss_phase_apply:')
    && angryText.includes('call bitmap_boss_phase_apply')
    && angryText.includes('boss_phase_shoot EQU')
    && angryText.includes('boss_phase_move EQU')],
  ['The cadence fires the pattern instead of one aimed bullet',
    /\.sb_fire:[\s\S]{0,400}?ld a, \(boss_phase_shoot\)[\s\S]{0,80}?jp nz, \.sb_fire_pattern[\s\S]{0,120}?\.sb_fire_pattern:[\s\S]{0,120}?jp bitmap_boss_shoot_fire/
      .test(angryText)
    && angryText.includes('bitmap_boss_shoot_fire:')],
  ['The laser wave reload consults the phase before the config default',
    /\.boss_laser_wave_done:[\s\S]{0,400}?ld a, \(boss_phase_laser_int\)[\s\S]{0,240}?ld \(boss_laser_cd\), a/
      .test(angryText)],
  ['The body cadence gate compares against the phase override',
    /ld b, \(ix\+19\)[\s\S]{0,120}?ld a, \(boss_phase_body_int\)[\s\S]{0,200}?cp b/.test(angryText)],
  ['Extra movement steps are applied, and the restore strip grows with them',
    angryText.includes('bitmap_boss_phase_step_scale:')
    && angryText.includes('bitmap_boss_strip_width:')
    && angryText.includes('call bitmap_boss_strip_width')],
  ['A bounce still flips the PATROL step, not the scaled one',
    /\.bounce_x:\s*\n\s*ld a, \(boss_dx\)[^\n]*\n\s*neg/.test(angryText)
    && /\.bounce_y:\s*\n\s*ld a, \(boss_dy\)[^\n]*\n\s*neg/.test(angryText)],

  // ---- byte identity: none of it exists without an escalating phase ---------
  ['Plain phases keep the original 3-byte stride',
    plain.phaseTablesExtended === false
    && gen.BITMAP_BOSS_PHASE_ENTRY_BASE === 3
    && plainRows.length === 2
    && plainRows.every(row => row.length === 3)
    && plainRows[0][0] === 5 && plainRows[1][0] === 10],
  ['Plain phases emit no escalation RAM, no apply routine and no wider strips',
    !plainText.includes('boss_phase_shoot')
    && !plainText.includes('boss_phase_move')
    && !plainText.includes('boss_phase_laser_int')
    && !plainText.includes('boss_phase_body_int')
    && !plainText.includes('bitmap_boss_phase_apply')
    && !plainText.includes('bitmap_boss_strip_width')
    && !plainText.includes('bitmap_boss_phase_step_scale')],
  ['Plain phases keep the original in-line table scan',
    plainText.includes('inc hl                     ; skip this entry (3 bytes)')
    && plainText.includes('ld a, (ix+7)               ; base interval')],
  ['Plain phases still reserve less boss RAM than escalating ones',
    plainAsm.ramBytes < angryAsm.ramBytes],

  // ---- editor ---------------------------------------------------------------
  ['The phase table only offers what this boss can fire',
    editor.includes('function resolveBossAttacks')
    && editor.includes('attacks.bullets &&')
    && editor.includes('attacks.laser &&')
    && editor.includes('This boss fires:')],
  ['Each phase shows the HP band it really covers, and flags a dead one',
    editor.includes('const bandOf =')
    && editor.includes('never: an earlier phase already covers this HP')],
  ['The panel warns when the path silences the cadence',
    editor.includes("activePathFiring === 'path'")
    && editor.includes('only the node scripts shoot')],
  ['Shot patterns are offered, with the sprite-bullet requirement spelled out',
    editor.includes('Shot pattern — how MANY bullets go out')
    && editor.includes('Shot patterns need hardware-sprite bullets')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'}: ${name}`);
  if (!ok) failed += 1;
}
if (failed) {
  console.error(`\n${failed} MSX2 boss attack-phase check(s) failed.`);
  process.exit(1);
}
console.log('\nMSX2 boss attack-phase escalation checks passed.');

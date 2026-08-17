#!/usr/bin/env node
/**
 * Weak-point hit explosion, and the per-zone hit sounds that go with it.
 *
 * A full-body flash was tried first and rejected: it needed a second copy of the
 * body in the shared atlas (12 KB for a 128x96 boss), which pushed a real
 * project past its offscreen-VRAM ceiling and FAILED THE BUILD. The blast
 * borrows a Death FX stamp that is already packed in the atlas instead, so the
 * whole effect costs no VRAM and is erased for free by the next body redraw.
 *
 * The fragile parts, and what each check below is really guarding:
 *   - the blast must turn ITSELF off when the boss has no stamp to borrow,
 *     otherwise the runtime blits a zero-sized/garbage rectangle;
 *   - the borrowed stamp rect is copied into the boss table, so the offsets the
 *     Z80 reads (ix+20..26) must match what the compiler wrote;
 *   - the damage-zone record grew to 7 bytes for the hit sound, and the Z80
 *     scanner strides by the same constant;
 *   - zone sounds REUSE the death explosion's sequencer, so "zone sound but no
 *     death sound" must still emit the sequencer and must NOT emit the per-room
 *     death entry point.
 *
 * The generator is transpiled and invoked here, not restated.
 */
import { mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const out = join(mkdtempSync(join(tmpdir(), 'mideas-boss-blast-')), 'bossgen.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
});
const {
  buildBitmapRoomBossData,
  buildBitmapBossSystemAsm,
  bossHitBlastFrames,
  BITMAP_BOSS_TABLE_STRIDE,
  BOSS_ZONE_RECORD_BYTES,
} = await import(pathToFileURL(out).href);

// Table byte offsets (see the `table:` literal in the boss compiler).
const OFF_W = 13, OFF_H = 14, OFF_BLAST = 20, OFF_BLAST_SX = 21, OFF_BLAST_NX = 25;

const STAMP = 'stamp_body';
const FX = 'stamp_boom';
const BODY_W = 64, BODY_H = 48;
const FX_W = 16, FX_H = 16, FX_SX = 96, FX_SY = 640;

const makeRoom = (bossParams) => ([{
  name: 'boss_room',
  atlas: { entries: [] },
  entities: [{
    id: 'e_boss', name: 'Boss', kind: 'boss',
    position: { x: 2, y: 2 },
    params: { runtime: 'MSX2', engine: 'bitmapBoss', bossStampAssetId: STAMP, ...bossParams },
  }],
}]);

const placements = () => new Map([
  [STAMP, { sx: 0, sy: 0, w: BODY_W, h: BODY_H }],
  [FX, { sx: FX_SX, sy: FX_SY, w: FX_W, h: FX_H }],
]);

const compile = (bossParams, sounds = new Map()) => buildBitmapRoomBossData(
  makeRoom(bossParams), () => undefined, undefined, new Map(), new Map(), new Map(), sounds, placements(),
);

const asmFor = (bossParams, sounds = new Map()) => buildBitmapBossSystemAsm(compile(bossParams, sounds), {
  ramBase: 0xc800, gameYOffset: 8, gameHeight: 168,
  playerHitbox: { x: 0, y: 0, w: 16, h: 16 },
  maxHealth: 3, damageInvulnFrames: 60,
});

const WEAK = { id: 'weak', type: 'weak_point', x: 8, y: 8, w: 16, h: 16, damageMultiplier: 2 };
const withFx = { bossDeathExplosionStampIds: [FX], bossDeathExplosionCount: 4 };

const checks = [];
const check = (label, ok) => checks.push([label, ok]);

// ---- opt-in semantics -------------------------------------------------------
check('Blast is opt-in: disabled means 0 frames', bossHitBlastFrames({ bossHitBlastFrames: 9 }) === 0);
check('Frames default to 6 and clamp to 1..30',
  bossHitBlastFrames({ bossHitBlastEnabled: true }) === 6 &&
  bossHitBlastFrames({ bossHitBlastEnabled: true, bossHitBlastFrames: 999 }) === 30);

const off = compile({ bossHp: 4, damageZones: [WEAK], ...withFx });
check('A boss that never asked for a blast reports 0 hold frames', off.roomTables[0][OFF_BLAST] === 0);

// ---- blast ON with a stamp to borrow ---------------------------------------
const on = compile({ bossHp: 4, damageZones: [WEAK], bossHitBlastEnabled: true, bossHitBlastFrames: 6, ...withFx });
const t = on.roomTables[0];
check('Blast hold reaches the boss table', t[OFF_BLAST] === 6);
// The atlas lives at VRAM rows 512+, so the compiler stores sy + 512 exactly as
// it does for the body. Getting this wrong draws the blast from empty VRAM.
const FX_VRAM_SY = FX_SY + 512;
check('The borrowed Death FX rect is copied into the boss table',
  t[OFF_BLAST_SX] === (FX_SX & 0xff) && t[OFF_BLAST_SX + 1] === (FX_SX >> 8)
  && t[OFF_BLAST_SX + 2] === (FX_VRAM_SY & 0xff) && t[OFF_BLAST_SX + 3] === (FX_VRAM_SY >> 8)
  && t[OFF_BLAST_NX] === FX_W && t[OFF_BLAST_NX + 1] === FX_H);
check('The body itself is untouched by the blast', t[OFF_W] === BODY_W && t[OFF_H] === BODY_H);
check('Boss table is 27 bytes and the record fills it',
  BITMAP_BOSS_TABLE_STRIDE === 27 && t.length === 27);

// ---- THE failure this guards: no stamp to borrow ---------------------------
const orphan = compile({ bossHp: 4, damageZones: [WEAK], bossHitBlastEnabled: true });
check('THE BUG THIS GUARDS: with no Death FX stamp the blast disables itself instead of blitting garbage',
  orphan.roomTables[0][OFF_BLAST] === 0);
check('A boss with no stamp to borrow still works otherwise',
  orphan.enabled === true && orphan.roomTables[0][OFF_H] === BODY_H);

// ---- emitted ASM ------------------------------------------------------------
const blastAsm = asmFor({ bossHp: 4, damageZones: [WEAK], bossHitBlastEnabled: true, ...withFx });
const plainAsm = asmFor({ bossHp: 4, damageZones: [WEAK], ...withFx });
check('Blast reserves its own RAM: countdown, hold and the hit zone centre',
  /boss_blast_timer\s+EQU/.test(blastAsm.equates) && /boss_blast_len\s+EQU/.test(blastAsm.equates)
  && /boss_blast_x\s+EQU/.test(blastAsm.equates) && /boss_blast_y\s+EQU/.test(blastAsm.equates));
check('Blast is drawn with LMMM + TIMP so colour 0 stays transparent',
  blastAsm.routinesAsm.includes('bitmap_boss_hit_blast_draw:') && blastAsm.routinesAsm.includes('ld a, #98'));
check('Blast is painted right after the body, so the next redraw erases it',
  /call bitmap_boss_draw\s*\r?\n\s*call bitmap_boss_hit_blast_draw/.test(blastAsm.routinesAsm));
check('Countdown is guarded against wrapping past zero',
  /ld a, \(boss_blast_timer\)\s*\r?\n\s*or a\s*\r?\n\s*jr z,/.test(blastAsm.routinesAsm));
check('Blast position is clamped so a zone near the body edge cannot underflow',
  (blastAsm.routinesAsm.match(/jr nc, \.blast_d[xy]_ok/g) || []).length === 2);
check('A boss without the blast emits none of its RAM or code',
  !plainAsm.equates.includes('boss_blast_timer')
  && !plainAsm.routinesAsm.includes('bitmap_boss_hit_blast_draw'));
check('The rejected full-body flash left nothing behind',
  !blastAsm.equates.includes('boss_flash') && !blastAsm.routinesAsm.includes('boss_flash'));

// ---- per-zone hit sound in a 7-byte record ---------------------------------
const SOUND = {
  id: 'snd', name: 'blip', masterVolume: 1, noisePeriod: 4,
  channels: [{ id: 'C', steps: [{ tonePeriod: 300, volume: 12, toneEnabled: true, noiseEnabled: false, durationMs: 50 }] }],
};
const soundMap = new Map([['snd', SOUND]]);
check('Zone record is 7 bytes for the hit sound', BOSS_ZONE_RECORD_BYTES === 7);
const zoned = compile({ bossHp: 4, damageZones: [
  { ...WEAK, hitSoundAssetId: 'snd' },
  { id: 'armour', type: 'invulnerable', x: 32, y: 0, w: 8, h: 8, damageMultiplier: 1 },
] }, soundMap);
const zt = zoned.damageZoneTables[0];
check('Zone table is [count, 7 bytes per zone]', zt[0] === 2 && zt.length === 1 + 2 * BOSS_ZONE_RECORD_BYTES);
check('Second zone starts one full record in, not 6 bytes in',
  zt[1 + BOSS_ZONE_RECORD_BYTES] === 32 && zt[1 + BOSS_ZONE_RECORD_BYTES + 4] === 0);
check('An authored hit sound lands in the record; an absent one stays silent',
  zt[1 + 6] === 1 && zt[1 + BOSS_ZONE_RECORD_BYTES + 6] === 0);

// ---- gate combinations must not leave dangling labels ----------------------
const danglingLabels = (asm) => {
  const text = `${asm.equates}\n${asm.initAsm}\n${asm.routinesAsm}\n${asm.dataAsm}\n`
    + `${asm.loadCallAsm}\n${asm.updateCallAsm}\n${asm.satCallAsm}\n${asm.playerGateAsm}\n`
    + (asm.bankedBlocks || []).map(b => (typeof b === 'string' ? b : b?.asm || '')).join('\n');
  const defined = new Set();
  for (const m of text.matchAll(/^([A-Za-z_][A-Za-z0-9_]*):/gm)) defined.add(m[1]);
  for (const m of text.matchAll(/^([A-Za-z_][A-Za-z0-9_]*)\s+EQU\s/gm)) defined.add(m[1]);
  const missing = new Set();
  for (const m of text.matchAll(/\b(?:call|jp|jr)\s+(?:[a-z]{1,2},\s*)?(bitmap_boss_[A-Za-z0-9_]*)/g)) {
    if (!defined.has(m[1])) missing.add(m[1]);
  }
  for (const m of text.matchAll(/\b(?:dw|ld hl,)\s*(bitmap_boss_[A-Za-z0-9_]*)/g)) {
    if (!defined.has(m[1])) missing.add(m[1]);
  }
  return [...missing];
};

const zoneSound = [{ ...WEAK, hitSoundAssetId: 'snd' }];
const combos = [
  ['plain boss', asmFor({ bossHp: 4 })],
  ['blast only', asmFor({ bossHp: 4, damageZones: [WEAK], bossHitBlastEnabled: true, ...withFx })],
  ['zone sound, NO death sound', asmFor({ bossHp: 4, damageZones: zoneSound }, soundMap)],
  ['death sound, no zone sound', asmFor({ bossHp: 4, damageZones: [WEAK], bossDeathExplosionSoundAssetId: 'snd', ...withFx }, soundMap)],
  ['blast + zone sound', asmFor({ bossHp: 4, damageZones: zoneSound, bossHitBlastEnabled: true, ...withFx }, soundMap)],
];
for (const [label, asm] of combos) {
  const missing = danglingLabels(asm);
  check(`No dangling boss labels: ${label}${missing.length ? ` -> ${missing.join(', ')}` : ''}`, missing.length === 0);
}

const zoneAsm = combos[2][1];
check('Zone sounds reach the shared sequencer through a pool table',
  zoneAsm.routinesAsm.includes('bitmap_boss_zone_sfx_start:') && zoneAsm.dataAsm.includes('bitmap_boss_sfx_pool_ptr_table:'));
check('Zone sounds WITHOUT a death sound still reserve the sequencer RAM',
  zoneAsm.equates.includes('boss_death_sfx_ptr EQU'));
check('Zone sounds without a death sound skip the per-room death entry point',
  !zoneAsm.dataAsm.includes('bitmap_boss_death_sfx_room_ptr_table:'));

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!ok) failed += 1;
}
if (failed > 0) {
  console.error(`\n${failed} boss hit-blast check(s) failed.`);
  process.exit(1);
}
console.log('\nMSX2 boss hit-blast checks passed.');

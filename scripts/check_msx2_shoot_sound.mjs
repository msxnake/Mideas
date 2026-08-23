#!/usr/bin/env node
/**
 * Contract checks for the SHOOT skill's shot sound.
 *
 * Two shapes behind one entry point:
 *   - no asset chosen  -> the built-in pew, a handful of PSG registers written
 *     once. No RAM, no per-frame work.
 *   - an asset chosen  -> the Sound Editor sound, compiled to a step stream and
 *     walked by a sequencer ticked every frame. Four bytes of RAM.
 *
 * The generator is compiled and RUN; the compiled stream is decoded back into
 * the values that were authored, so a check fails if the bytes stop meaning
 * what they say. The switch that matters most is the last one: a player who
 * turns the sound off must not pay a byte for any of it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(import.meta.url);
const BUILD_DIR = join(root, 'server', 'temp', 'tsbuild_shootsound');

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
if (!existsSync(tsc)) throw new Error('Local TypeScript not found. Run npm install.');
rmSync(BUILD_DIR, { recursive: true, force: true });
execFileSync(process.execPath, [
  tsc, '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020',
  '--outDir', BUILD_DIR, '--moduleResolution', 'node', '--skipLibCheck',
  '--noEmitOnError', 'false',
  'utils/msxGenerator/generators/msx2/msx2BitmapShootGenerator.ts',
  'utils/msxGenerator/generators/msx2/msx2PsgOneShot.ts',
], { cwd: root, stdio: 'pipe' });
const gen = require(join(BUILD_DIR, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapShootGenerator.js'));
const psg = require(join(BUILD_DIR, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2PsgOneShot.js'));

const RAM_BASE = 0xc000;
const baseConfig = {
  enabled: true,
  bulletSpeed: 4,
  maxBullets: 2,
  shootCooldown: 10,
  requireKeyRelease: true,
  bulletDamage: 1,
  bulletRange: 0,
  allowUpShot: false,
  bulletLantern: false,
  shootSound: true,
  primaryControl: 'attack',
  secondaryControl: 'none',
};
const opts = {
  playerLayerCount: 2,
  bulletPatternNumber: 8,
  satBase: 0xf600,
  colorBase: 0xf400,
  patternBase: 0xf800,
  gameYOffset: 24,
  screenWidth: 256,
};

/** A three-step descending zap on channel C, with distinct volumes. */
const sound = {
  id: 'sfx', name: 'sfx', tempoBPM: 120,
  noisePeriod: 0, envelopePeriod: 0, envelopeShape: 0, masterVolume: 1,
  channels: [
    { id: 'A', steps: [], loop: false },
    { id: 'B', steps: [], loop: false },
    {
      id: 'C', loop: false,
      steps: [
        { tonePeriod: 0x40, volume: 14, durationMs: 40, toneEnabled: true, noiseEnabled: false, useEnvelope: false, envelopeShape: 0 },
        { tonePeriod: 0x80, volume: 10, durationMs: 40, toneEnabled: true, noiseEnabled: false, useEnvelope: false, envelopeShape: 0 },
        { tonePeriod: 0x140, volume: 6, durationMs: 60, toneEnabled: true, noiseEnabled: false, useEnvelope: false, envelopeShape: 0 },
      ],
    },
  ],
};

const build = (config, options = {}) => ({
  ram: gen.bitmapShootRamBytes(config),
  equates: gen.buildBitmapShootEquates(config, RAM_BASE),
  gate: gen.buildBitmapShootGateAsm(config),
  asm: gen.buildBitmapShootRuntimeAsm(config, { ...opts, ...options }),
});

const builtIn = build(baseConfig);
const authored = build({ ...baseConfig, shootSoundAssetId: 'sfx' }, { shootSound: sound });
const muted = build({ ...baseConfig, shootSound: false });
const noSkill = build({ ...baseConfig, enabled: false });

/** Decode the emitted DB rows back into the ten-byte records. */
const records = asm => {
  const block = /bitmap_shoot_sfx_data:\n([\s\S]*?)\n\s*DB #00/.exec(asm);
  if (!block) return [];
  return block[1].split('\n')
    .map(line => /DB (.+)$/.exec(line.trim()))
    .filter(Boolean)
    .map(match => match[1].split(',').map(value => parseInt(value.trim().replace('#', ''), 16)));
};
const authoredRecords = records(authored.asm);

const checks = [
  // ---- the built-in pew ----------------------------------------------------
  ['With no asset chosen the shot still sounds, straight from the ROM table',
    builtIn.asm.includes('bitmap_shoot_sfx_start:')
    && builtIn.asm.includes('bitmap_shoot_sfx_data:')
    && /db 7,#3B,4,#60/.test(builtIn.asm)],

  ['The built-in pew owns no RAM and needs no per-frame work',
    builtIn.ram === gen.bitmapShootRamBytes({ ...baseConfig, shootSound: false })
    && !builtIn.equates.includes('bitmap_shoot_sfx_active')
    && !builtIn.gate.includes('bitmap_shoot_sfx_tick')],

  // ---- the authored sound --------------------------------------------------
  ['Choosing an asset costs exactly four bytes of sequencer RAM',
    authored.ram === builtIn.ram + psg.PSG_ONE_SHOT_RAM_BYTES
    && authored.equates.includes('bitmap_shoot_sfx_active')
    && authored.equates.includes('bitmap_shoot_sfx_timer')
    && authored.equates.includes('bitmap_shoot_sfx_ptr')],

  ['The sequencer is ticked once per frame, from the same gate that steps bullets',
    authored.gate.includes('call bitmap_shoot_sfx_tick')
    && authored.asm.includes('bitmap_shoot_sfx_tick:')
    && authored.asm.includes('bitmap_shoot_sfx_load_step:')
    && authored.asm.includes('bitmap_shoot_sfx_stop:')],

  ['The compiled stream carries the authored volumes, in order, and is terminated',
    authoredRecords.length === 3
    && authoredRecords.map(record => record[4]).join(',') === '14,10,6'
    && /DB #00\n/.test(authored.asm)],

  ['Durations are frames, not milliseconds: 40ms and 60ms at 60Hz',
    authoredRecords.map(record => record[0]).join(',') === '2,2,4'],

  ['Tone periods survive the split into low and high bytes',
    authoredRecords.map(record => `${record[2]}${record[1].toString(16)}`).join(',') === '040,080,140'],

  // ---- one entry point -----------------------------------------------------
  ['Firing calls the same routine either way, so the spawn code has no branch',
    (builtIn.asm.match(/call bitmap_shoot_sfx_start/g) || []).length === 1
    && (authored.asm.match(/call bitmap_shoot_sfx_start/g) || []).length === 1],

  ['The call happens on the shot, after the cooldown is armed',
    /ld \(bitmap_shoot_cooldown\), a\n\s*call bitmap_shoot_sfx_start/.test(builtIn.asm)],

  ['Init clears the playing flag, so a warm boot cannot resume a half-played shot',
    (() => {
      const init = /bitmap_shoot_init_clear:([\s\S]*?)\n    ret/.exec(authored.asm);
      if (!init) return false;
      const body = init[1];
      // Inside the routine, and after the clear loop that leaves A at zero.
      return body.includes('ld (bitmap_shoot_sfx_active), a')
        && body.indexOf('djnz') < body.indexOf('ld (bitmap_shoot_sfx_active), a')
        // The built-in pew has no flag to clear, so it must not appear there.
        && !/bitmap_shoot_init_clear:([\s\S]*?)\n    ret/.exec(builtIn.asm)[1].includes('sfx_active');
    })()],

  // ---- opting out ----------------------------------------------------------
  ['Turning the sound off costs not one byte',
    !muted.asm.includes('bitmap_shoot_sfx')
    && !muted.equates.includes('bitmap_shoot_sfx')
    && !muted.gate.includes('bitmap_shoot_sfx')
    && muted.ram === builtIn.ram],

  ['A player without the skill emits nothing at all',
    noSkill.asm === '' && noSkill.equates === '' && noSkill.gate === '' && noSkill.ram === 0],

  // ---- the shared compiler -------------------------------------------------
  ['An asset with no steps falls back instead of emitting an empty stream',
    psg.compilePsgOneShot({ channels: [{ id: 'C', steps: [] }] }, 'x') === undefined
    && psg.compilePsgOneShot(undefined, 'x') === undefined],

  ['The asset\'s master volume scales the per-step volumes',
    (() => {
      const half = psg.compilePsgOneShot({ ...sound, masterVolume: 0.5 }, 'bitmap_shoot_sfx_data');
      return records(half.dataAsm).map(record => record[4]).join(',') === '7,5,3';
    })()],

  ['A sound authored on another channel is remapped onto the SFX channel',
    psg.compilePsgOneShot(
      { ...sound, channels: [{ id: 'A', steps: sound.channels[2].steps, loop: false }, { id: 'B', steps: [], loop: false }, { id: 'C', steps: [], loop: false }] },
      'x',
    )?.sourceChannel === 'A'],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
/**
 * Contract checks for the SCREEN 5 bitmap boss SPIDER THREAD (Jordi 2026-09-22).
 *
 * Like the other boss checkers, this compiles and RUNS the real generator
 * rather than grepping it, because the thread feature is opt-in and every one
 * of these is a bug that would otherwise reach a ROM:
 *
 *   - a project without a thread keeps a byte-identical ROM: no thread EQU,
 *     no state machine, no render phase, no data table anywhere;
 *   - a project WITH a thread gets the whole contract: RAM block, room-entry
 *     load, the descend/align/climb state machine, the depth-limit trigger,
 *     the render phase that paints (LINE, 1px via nibble-expanded colour) and
 *     trims (HMMM from the clean page), the death cleanup and the per-room
 *     data table with the authored limit/colour/anchor baked in;
 *   - the thread column is the body's horizontal centre on the spawn point,
 *     which is the anchor the author sees in the editor;
 *   - the thread RAM sits between the boss cells byte and the instance
 *     selector, and pushes the rest of the map up by exactly 6 bytes.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(import.meta.url);
const BUILD_DIR = join(root, 'server', 'temp', 'tsbuild_bossthread');

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
if (!existsSync(tsc)) throw new Error('Local TypeScript not found. Run npm install.');
rmSync(BUILD_DIR, { recursive: true, force: true });
execFileSync(process.execPath, [
  tsc, '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020',
  '--outDir', BUILD_DIR, '--moduleResolution', 'node', '--skipLibCheck',
  '--noEmitOnError', 'false',
  'utils/msxGenerator/generators/msx2/msx2BitmapBossGenerator.ts',
], { cwd: root, stdio: 'pipe' });
writeFileSync(join(BUILD_DIR, 'package.json'), '{"type":"commonjs"}');

const gen = require(join(BUILD_DIR, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.js'));

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const ROOM = { name: 'thread', atlas: { entries: [{ id: 'bossbody', sx: 0, sy: 0, w: 32, h: 32 }] } };

const entity = (threadLength, threadColor) => ({
  kind: 'boss',
  position: { x: 120, y: 16 },
  params: {
    bossAtlasEntryId: 'bossbody',
    bossFrames: 1,
    bossHp: 8,
    bossDamage: 1,
    bossInterval: 3,
    bossMovement: 'patrolY',
    bossSpeed: 2,
    bossThreadLength: threadLength,
    bossThreadColor: threadColor,
  },
});

const resolvePatrol = () => ({ x: 120, y: 16, minX: 0, maxX: 224, minY: 16, maxY: 112, dx: 0, dy: 2 });

const buildData = (threadLength, threadColor) => gen.buildBitmapRoomBossData(
  [{ ...ROOM, entities: [entity(threadLength, threadColor)] }],
  resolvePatrol,
  { hasKeys: false, doorOffsetById: new Map() },
  new Map(), new Map(), new Map(), new Map(), new Map(), new Map(),
);

const opts = {
  ramBase: 0xc000,
  gameYOffset: 0,
  gameHeight: 192,
  playerHitbox: { x: 4, y: 2, w: 8, h: 12 },
  damageInvulnFrames: 60,
  maxHealth: 3,
};

const asmOf = (data) => {
  const parts = gen.buildBitmapBossSystemAsm(data, opts);
  return [parts.equates, parts.initAsm, parts.loadCallAsm, parts.updateCallAsm, parts.routinesAsm, parts.dataAsm].join('\n');
};

// ---- 1. No thread authored: the feature must not exist in the ROM at all ----
const plain = asmOf(buildData(0, 15));
check(!/boss_thread_phase EQU/.test(plain), 'plain build must not emit thread equates');
check(!/boss_thread_load_done/.test(plain), 'plain build must not emit the room-entry thread load');
check(!/\.boss_render_thread/.test(plain), 'plain build must not emit the thread render phase');
check(!/\.thread_descend|\.thread_align|\.thread_climb_top|\.thread_roam/.test(plain), 'plain build must not emit the thread state machine');
check(!/bitmap_boss_thread_ptr_table/.test(plain), 'plain build must not emit the thread data table');
check(!/\.boss_thread_death_clean/.test(plain), 'plain build must not emit the thread death cleanup');

// ---- 2. With a thread: the whole contract must be there ----
const data = buildData(96, 8);
const asm = asmOf(data);

check(/boss_thread_phase EQU/.test(asm), 'thread build emits the thread equates');
check(/boss_thread_len\s+EQU/.test(asm) && /boss_thread_x\s+EQU/.test(asm)
  && /boss_thread_top\s+EQU/.test(asm) && /boss_thread_max\s+EQU/.test(asm)
  && /boss_thread_color\s+EQU/.test(asm), 'thread build emits all six state equates');
check(/boss_thread_load_done/.test(asm), 'room entry loads the thread record');
check(/\.thread_descend/.test(asm), 'state machine: descend phase present');
check(/\.thread_align/.test(asm), 'state machine: align-X phase present');
check(/\.thread_climb_top/.test(asm), 'state machine: climb phase with anchor clamp present');
check(/\.thread_roam/.test(asm), 'state machine: depth-limit trigger while roaming present');
check(/\.boss_render_thread/.test(asm), 'render phase 4 present');
check(/#E0/.test(asm), 'thread paint uses the LINE command (#E0)');
check(/#70/.test(asm), 'thread LINE argument selects the vertical axis');
check(/\.boss_thread_death_clean/.test(asm), 'death cleanup erases the thread column');
check(/bitmap_boss_thread_ptr_table/.test(asm), 'per-room thread data table present');

// The baked record: limit 96, colour 8, column = spawn X + width/2 = 136,
// anchor Y = spawn Y = 16 (asmByte emits '#XX' hex).
const record = asm.match(/bitmap_boss_thread_room_0:\s*\n\s*db ([0-9A-Fa-f#, ]+)/);
const recordBytes = record
  ? record[1].split(',').map(t => parseInt(t.trim().replace('#', ''), 16))
  : [];
check(recordBytes.length === 4 && recordBytes[0] === 96 && recordBytes[1] === 8
  && recordBytes[2] === 136 && recordBytes[3] === 16,
  `room 0 record bakes limit 96, colour 8, column 136, anchor 16 (got ${record ? record[1].trim() : 'nothing'})`);

// Render chain: the mono body completion must advance to the thread phase (4).
check(/call bitmap_boss_try_launch_cmd\s*\n\s*ret nz\s*\n\s*ld a, 4\s*\n\s*ld \(boss_render_phase\), a/.test(asm),
  'body draw completion chains into the thread phase');

// ---- 3. RAM placement: 6 thread bytes between the cells latch and the selector ----
const equ = (name) => {
  const m = asm.match(new RegExp(`${name}\\s+EQU ([0-9A-Fa-f#$]+)`));
  if (!m) return undefined;
  const hex = m[1].replace(/[$#]/, '');
  return parseInt(hex, 16);
};
const phase = equ('boss_thread_phase');
const color = equ('boss_thread_color');
const selector = equ('boss_slot');
if (phase !== undefined && color !== undefined && selector !== undefined) {
  check(color === phase + 5, 'the six thread bytes are contiguous');
  check(selector === color + 1, 'thread RAM sits directly below the instance selector');
} else {
  failures.push('could not parse thread/selector EQU addresses');
}

// The totals line must grow by exactly 6 against the plain build.
const totalOf = (text) => {
  const m = text.match(/runtime state \((\d+) bytes\)/);
  return m ? Number(m[1]) : undefined;
};
const plainTotal = totalOf(plain);
const threadTotal = totalOf(asm);
if (plainTotal !== undefined && threadTotal !== undefined) {
  check(threadTotal - plainTotal === 6, `thread build spends exactly 6 extra RAM bytes (got ${threadTotal - plainTotal})`);
} else {
  failures.push('could not parse the runtime RAM totals');
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} spider-thread contract violation(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('OK: spider thread contract holds (plain builds untouched, threaded builds complete).');

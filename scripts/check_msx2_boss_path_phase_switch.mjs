#!/usr/bin/env node
/**
 * Contract checks for the DEFERRED boss path switch.
 *
 * The bug: a baked path is a stream of relative deltas, so whatever position the
 * boss is at when a stream starts becomes that route's anchor. Swapping route
 * the instant an attack phase's HP threshold was crossed anchored the new route
 * wherever the old one happened to have reached — a different pixel every
 * playthrough — so the shape the author drew and checked ended up somewhere
 * else, frequently with a good part of it off screen.
 *
 * The fix has three pieces, and this file guards all three:
 *   1. the swap is QUEUED and only applied when the running lap closes, the one
 *      moment the boss is provably back where its route started;
 *   2. `Walk it once` reaches the runtime, so a route with no closing leg is no
 *      longer replayed forever (it used to displace the boss by the whole shape
 *      every pass);
 *   3. a seatbelt clamp keeps the body inside the room even if the route does
 *      not fit.
 *
 * The generator is compiled and RUN. The geometric property the whole fix rests
 * on — a looping stream sums to a zero delta, a walk-once one does not — is
 * measured on the bytes the generator actually emitted, not asserted from the
 * source.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(import.meta.url);
const BUILD_DIR = join(root, 'server', 'temp', 'tsbuild_bosspathswitch');
const MODULE = 'utils/msxGenerator/generators/msx2/msx2BitmapBossGenerator.ts';

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
if (!existsSync(tsc)) throw new Error('Local TypeScript not found. Run npm install.');
rmSync(BUILD_DIR, { recursive: true, force: true });
execFileSync(process.execPath, [
  tsc, '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020',
  '--outDir', BUILD_DIR, '--moduleResolution', 'node', '--skipLibCheck',
  '--noEmitOnError', 'false', MODULE,
], { cwd: root, stdio: 'pipe' });
const gen = require(join(BUILD_DIR, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.js'));

// ---- the smallest project with two routes and a phase that swaps them -------
const LOOP_ID = 'path_box_loop';
const ONCE_ID = 'path_run_once';
const atlas = { entries: [{ id: 'body32', sx: 0, sy: 0, w: 32, h: 32 }] };
const node = (x, y) => ({ id: `n_${x}_${y}`, x, y, actions: [] });
// The generator takes the ASSET, not the recipe: the route lives in `.path`.
// Passing the recipe straight in bakes an empty stream that quietly satisfies
// anything measured on it.
const paths = new Map([
  [LOOP_ID, {
    id: LOOP_ID,
    name: 'Box loop',
    path: {
      id: LOOP_ID, name: 'Box loop', speedPxPerTick: 2, loopMode: 'loop', firing: 'auto',
      nodes: [node(64, 40), node(160, 40), node(160, 96), node(64, 96)],
    },
  }],
  [ONCE_ID, {
    id: ONCE_ID,
    name: 'Run once',
    path: {
      id: ONCE_ID, name: 'Run once', speedPxPerTick: 2, loopMode: 'once', firing: 'path',
      nodes: [node(40, 40), node(200, 40), node(200, 120)],
    },
  }],
]);

const bossParams = (extra = {}) => ({
  bossAtlasEntryId: 'body32',
  bossFrames: 1,
  bossHp: 30,
  bossDamage: 1,
  bossInterval: 4,
  bossMovement: 'patrolX',
  bossSpeed: 2,
  ...extra,
});

const buildData = params => gen.buildBitmapRoomBossData(
  [{ name: 'boss room', atlas, entities: [{ kind: 'boss', position: { x: 64, y: 40 }, params }] }],
  () => undefined,
  { hasKeys: false, doorOffsetById: new Map() },
  new Map(),
  paths,
  new Map(),
);
const buildAsm = data => gen.buildBitmapBossSystemAsm(data, {
  ramBase: 0xd000,
  gameYOffset: 24,
  playerHitbox: { x: 4, y: 0, w: 8, h: 16 },
  damageInvulnFrames: 60,
  maxHealth: 3,
  projScratchBaseY: 800,
});

// A boss that walks the box and switches to the walk-once route at half health.
const switcher = buildData(bossParams({
  bossPathId: LOOP_ID,
  bossPhases: [
    { id: 'phase_1', enterWhenHpBelowPercent: 100, interval: 90, projectileSpeed: 2 },
    { id: 'phase_2', enterWhenHpBelowPercent: 50, interval: 45, projectileSpeed: 2, pathId: ONCE_ID },
  ],
}));
const pathless = buildData(bossParams());

const switcherAsm = buildAsm(switcher);
const pathlessAsm = buildAsm(pathless);
const text = `${switcherAsm.equates}${switcherAsm.routinesAsm}${switcherAsm.dataAsm}`;
const pathlessText = `${pathlessAsm.equates}${pathlessAsm.routinesAsm}${pathlessAsm.dataAsm}`;

/** Where one pass of a stream leaves the boss, relative to where it began it. */
const netDelta = stream => {
  let x = 0;
  let y = 0;
  for (let i = 0; i < stream.length; i++) {
    const byte = stream[i];
    if (byte === 0xff) break;
    if (byte >= 0xf0) { i += 1; continue; }
    x += ((byte >> 4) & 0x0f) - 8;
    y += (byte & 0x0f) - 8;
  }
  return { x, y };
};

/** The body of one ASM routine, so a check cannot be satisfied by another one. */
const routine = (source, label) => {
  const start = source.indexOf(`\n${label}:`);
  if (start < 0) return '';
  const rest = source.slice(start + label.length + 2);
  const end = rest.search(/\n[a-z_][a-z0-9_]*:/i);
  return end < 0 ? rest : rest.slice(0, end);
};

const streams = switcher.pathStreams || [];
const modes = switcher.pathModes || [];
const loopStream = streams[0];
const onceStream = streams[1];

// Every RAM symbol the boss system hands out, so an overlap cannot hide.
const equates = [...switcherAsm.equates.matchAll(/^(\w+)\s+EQU\s+#([0-9A-Fa-f]{4})/gm)]
  .map(match => ({ name: match[1], addr: parseInt(match[2], 16) }));
const byAddress = new Map();
for (const entry of equates) {
  if (!byAddress.has(entry.addr)) byAddress.set(entry.addr, []);
  byAddress.get(entry.addr).push(entry.name);
}
const collisions = [...byAddress.entries()].filter(([, names]) => names.length > 1);

const syncBody = routine(switcherAsm.routinesAsm, 'bitmap_boss_path_sync');
const stepBody = routine(switcherAsm.routinesAsm, 'bitmap_boss_path_step');
const clampBody = routine(switcherAsm.routinesAsm, 'bitmap_boss_path_clamp');

const checks = [
  // ---- the property the whole fix rests on ---------------------------------
  // The length guard matters: an empty stream also "returns to the start", so
  // without it this passes on a route the generator never actually baked.
  ['A looping route returns EXACTLY to where the lap started, so the lap boundary is a stable anchor',
    !!loopStream && loopStream.length > 32
    && JSON.stringify(netDelta(loopStream)) === JSON.stringify({ x: 0, y: 0 })],

  ['A walk-once route does NOT come back, which is why replaying it walked the boss off screen',
    !!onceStream && (netDelta(onceStream).x !== 0 || netDelta(onceStream).y !== 0)],

  ['The loop mode reaches the runtime in bit 1 of the mode byte, alongside the firing mode in bit 0',
    modes.length === 2 && (modes[0] & 2) === 0 && (modes[1] & 2) === 2
    && (modes[0] & 1) === 0 && (modes[1] & 1) === 1],

  // ---- 1. the swap is queued, not applied on the spot ----------------------
  ['The phase does not swap the route on the spot: it queues it',
    syncBody.includes('ld (boss_path_pending), a')
    && !/^\s+jp bitmap_boss_path_select/m.test(syncBody.split('.bpsy_queue')[0] || '')],

  ['A boss that is standing still has no lap to wait for and switches at once',
    /or a\s*\n\s*ret nz[\s\S]*jp bitmap_boss_path_select/.test(syncBody)],

  ['The queued route is applied where the lap closes, before the stream is rewound',
    stepBody.includes('.bpt_end:')
    && stepBody.indexOf('ld a, (boss_path_pending)') > stepBody.indexOf('.bpt_end:')
    && stepBody.indexOf('ld a, (boss_path_pending)') < stepBody.indexOf('ld hl, (boss_path_ptr)')],

  ['After swapping, the cursor is reread: the old one points into the route that just ended',
    /call bitmap_boss_path_select\s*\n\s*ld hl, \(boss_path_cur\)/.test(stepBody)],

  // ---- 2. walk-once is honoured -------------------------------------------
  ['A walk-once route holds its last node instead of replaying the shape',
    stepBody.includes('ld a, (boss_path_once)')
    && stepBody.indexOf('ld a, (boss_path_once)') < stepBody.indexOf('ld hl, (boss_path_ptr)')],

  ['Selecting a route splits the mode byte into the firing mode and the loop mode',
    routine(switcherAsm.routinesAsm, 'bitmap_boss_path_select').includes('and #01')
    && routine(switcherAsm.routinesAsm, 'bitmap_boss_path_select').includes('and #02')],

  // ---- 3. the seatbelt ----------------------------------------------------
  ['The path branch clamps the body to the room; the patrol branch keeps its own bounce',
    /call bitmap_boss_path_clamp/.test(switcherAsm.routinesAsm)
    && clampBody.includes('sub (ix+13)') && clampBody.includes('sub (ix+14)')],

  ['Stepping past the left or top wall saturates instead of wrapping to the far side',
    stepBody.includes('bit 7, c') && stepBody.includes('bit 7, b')
    && (stepBody.match(/xor a/g) || []).length >= 2],

  // ---- RAM: the new bytes must not land on another block ------------------
  ['The two new state bytes have addresses of their own',
    /boss_path_pending EQU/.test(switcherAsm.equates)
    && /boss_path_once\s+EQU/.test(switcherAsm.equates)
    && collisions.length === 0],

  ['Both are swapped per boss instance, so two bosses queue their swaps separately',
    switcherAsm.routinesAsm.includes('boss_path_pending')
    && /boss_path_once/.test(switcherAsm.routinesAsm)
    && (switcherAsm.routinesAsm.match(/ld \(boss_path_once\), a/g) || []).length >= 2],

  // Adding a state field means editing two lists that must agree. When they did
  // not, nothing failed to build: slot 1's block simply began two bytes inside
  // slot 0's, so each boss quietly corrupted the tail of the other's state —
  // the path cursor — and the route walked into nonsense. Counted from the
  // copies the generator emitted, so it guards every future field too.
  ['The per-instance state block is exactly as big as the fields copied into it',
    (() => {
      const save = routine(switcherAsm.routinesAsm, 'bitmap_boss_state_save');
      // The first read is boss_slot, which picks the block rather than being in it.
      const bytes = (save.match(/ld a, \(boss_\w+\)/g) || []).length - 1;
      const words = (save.match(/ld hl, \(boss_\w+\)/g) || []).length;
      const declared = /BOSS_INSTANCE_STATE_BYTES EQU (\d+)/.exec(switcherAsm.equates);
      return !!declared && Number(declared[1]) === bytes + words * 2;
    })()],

  // ---- a project with no path pays for none of it --------------------------
  ['A boss with no path pays not one byte for any of this',
    !pathlessText.includes('boss_path_pending')
    && !pathlessText.includes('boss_path_once')
    && !pathlessText.includes('bitmap_boss_path_clamp')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
if (collisions.length) {
  for (const [addr, names] of collisions) {
    console.log(`      RAM collision at #${addr.toString(16).toUpperCase()}: ${names.join(', ')}`);
  }
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
/**
 * Contract checks for the boss path FIXED TABLE bake.
 *
 * A route can be compiled two ways, and the two have to stay honest about each
 * other, so this compiles and RUNS the baker rather than grepping it. What is
 * worth naming, because each one is a bug that would otherwise reach a ROM:
 *
 *   - the fixed table is a SPRITE ATTRIBUTE table: exactly 4 bytes per frame,
 *     in the order the VDP reads them (Y, X, pattern, colour), with the HUD band
 *     and the VDP's one-line bias already inside the Y byte. If any of that
 *     drifts, the sprite lands somewhere other than where it was drawn;
 *   - Y=216 (D8h) stops sprite processing in sprite mode 2, so a route that
 *     lands on it must WARN rather than silently blank the rest of the sprites;
 *   - a node script is state, not opcodes: a wait becomes repeated entries, an
 *     anim frame becomes a new pattern byte, and a fire — which a position table
 *     cannot express at all — comes back as a frame event instead of vanishing;
 *   - both modes must trace the SAME shape, or "how it is compiled" would
 *     quietly mean "which route you get";
 *   - and the delta bake must be untouched, because every existing ROM depends
 *     on it byte for byte.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(import.meta.url);
const BUILD_DIR = join(root, 'server', 'temp', 'tsbuild_bosspathfixed');

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
if (!existsSync(tsc)) throw new Error('Local TypeScript not found. Run npm install.');
rmSync(BUILD_DIR, { recursive: true, force: true });
execFileSync(process.execPath, [
  tsc, '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020',
  '--outDir', BUILD_DIR, '--moduleResolution', 'node', '--skipLibCheck',
  '--noEmitOnError', 'false',
  'utils/msx2BossPath.ts',
], { cwd: root, stdio: 'pipe' });
// The repo is an ES module package; the emitted CommonJS needs saying so.
writeFileSync(join(BUILD_DIR, 'package.json'), '{"type":"commonjs"}');

const baker = require(join(BUILD_DIR, 'utils', 'msx2BossPath.js'));

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const path = (nodes, extra = {}) => ({
  id: 'p', name: 'p', speedPxPerTick: 2, loopMode: 'once', firing: 'auto', nodes, ...extra,
});

const STRAIGHT = path([
  { id: 'a', x: 40, y: 40, actions: [] },
  { id: 'b', x: 120, y: 40, actions: [] },
]);
const LOOP = path([
  { id: 'a', x: 60, y: 60, actions: [] },
  { id: 'b', x: 140, y: 60, actions: [] },
  { id: 'c', x: 100, y: 120, actions: [] },
], { loopMode: 'loop' });
const WAVE = path([
  { id: 'a', x: 20, y: 96, actions: [], segment: { mode: 'sine', amplitude: 24, frequency: 2 } },
  { id: 'b', x: 220, y: 96, actions: [] },
]);
const SCRIPTED = path([
  { id: 'a', x: 50, y: 50, actions: [{ action: 'setAnimFrame', frame: 2 }, { action: 'wait', frames: 5 }] },
  { id: 'b', x: 150, y: 50, actions: [{ action: 'fire', shootId: 's1' }] },
], { firing: 'path' });

// --- the entry is what the VDP reads -----------------------------------------
const straight = baker.bakeBossPathFixed(STRAIGHT);
check(straight.bytes.length === straight.frames * baker.FIXED_TABLE_ENTRY_BYTES,
  `fixed table must hold exactly 4 bytes per frame (${straight.frames} frames, ${straight.bytes.length} bytes)`);
check(straight.bytes[0] === 40 + baker.SCREEN5_HUD_BAND_ROWS + baker.SPRITE_Y_BIAS,
  `Y byte must carry the HUD band and the VDP bias (got ${straight.bytes[0]}, expected ${40 + baker.SCREEN5_HUD_BAND_ROWS + baker.SPRITE_Y_BIAS})`);
check(straight.bytes[1] === 40, `X byte must be the authored pixel (got ${straight.bytes[1]})`);
check(straight.bytes[3] === 15, `default colour must be 15 (got ${straight.bytes[3]})`);
check(straight.bytes[straight.bytes.length - 3] === 120,
  `the table must reach the last node (got X=${straight.bytes[straight.bytes.length - 3]})`);

// --- a script becomes state, and what cannot become state is reported ---------
const scripted = baker.bakeBossPathFixed(SCRIPTED, { basePattern: 8, colour: 6 });
check(scripted.bytes[2] === 8 + 2 * baker.SPRITE_PATTERN_STEP,
  `set anim frame 2 must select pattern 8+8 (got ${scripted.bytes[2]})`);
check(scripted.bytes[3] === 6, `the asset's colour must reach the entry (got ${scripted.bytes[3]})`);
const firstThree = [0, 1, 2].map(i => `${scripted.bytes[i * 4]},${scripted.bytes[i * 4 + 1]}`);
check(new Set(firstThree).size === 1, `a wait must repeat the same entry (got ${firstThree.join(' | ')})`);
check(scripted.events.length === 1 && scripted.events[0].action === 'fire',
  'a fire node must come back as a frame event');
check(scripted.warnings.some(w => /fire node/.test(w)),
  'the author must be told that events do not fit in a position table');

// --- the two encodings, i.e. who applies the screen offsets ------------------
// The bitmap room's enemy SAT writer adds BITMAP_ROOM_GAME_Y_OFFSET itself, so a
// table feeding its pool must carry the raw pixel. Handing it a finished entry
// would apply the band twice and drop every sprite 20 lines down the screen.
const forPool = baker.bakeBossPathFixed(STRAIGHT, { yEncoding: 'gameArea', patternEncoding: 'animFrame' });
check(forPool.bytes[0] === 40,
  `'gameArea' must store the authored pixel untouched (got ${forPool.bytes[0]}, expected 40)`);
check(straight.bytes[0] - forPool.bytes[0] === baker.SCREEN5_HUD_BAND_ROWS + baker.SPRITE_Y_BIAS,
  'the two encodings must differ by exactly the HUD band plus the VDP bias');
const framed = baker.bakeBossPathFixed(SCRIPTED, { basePattern: 8, patternEncoding: 'animFrame' });
check(framed.bytes[2] === 2,
  `'animFrame' must store the frame index, not a pattern byte (got ${framed.bytes[2]})`);
check(baker.bakeBossPathFixed(SCRIPTED, { basePattern: 8 }).bytes[2] === 16,
  "'absolute' must still fold the base pattern in");

// --- the D8h trap ------------------------------------------------------------
// 197 + 20 - 1 = 216, the value that stops sprite processing in mode 2.
const trap = baker.bakeBossPathFixed(path([
  { id: 'a', x: 40, y: 197, actions: [] },
  { id: 'b', x: 80, y: 197, actions: [] },
]));
check(trap.bytes[0] === baker.SPRITE_Y_STOP_MODE2, `fixture must land on D8h (got ${trap.bytes[0]})`);
check(trap.warnings.some(w => /216/.test(w)), 'landing on Y=216 must warn: it blanks the sprites below it');
// The same trap through the other encoding: the stored byte is 196, the line the
// VDP reads is still 216, and a check on the stored byte alone would miss it.
const trapPool = baker.bakeBossPathFixed(path([
  { id: 'a', x: 40, y: 196, actions: [] },
  { id: 'b', x: 80, y: 196, actions: [] },
]), { yEncoding: 'gameArea' });
check(trapPool.bytes[0] === 196, `'gameArea' stores the raw pixel (got ${trapPool.bytes[0]})`);
check(trapPool.warnings.some(w => /216/.test(w)),
  'the D8h check must look at the line the VDP reads, not at the stored byte');

// --- one shape, two compilations ---------------------------------------------
const boxOf = points => ({
  minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)),
  minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)),
});
const walkDelta = source => {
  const baked = baker.bakeBossPath(source, baker.BITMAP_BOSS_PATH_LIMITS);
  let x = source.nodes[0].x;
  let y = source.nodes[0].y;
  const out = [{ x, y }];
  for (let i = 0; i < baked.bytes.length; i++) {
    const byte = baked.bytes[i];
    if (byte === baker.PATH_OP_END) break;
    if (byte >= 0xf0) { i += baker.PATH_OP_ARG_BYTES; continue; }
    x += ((byte >> 4) & 0x0f) - 8;
    y += (byte & 0x0f) - 8;
    out.push({ x, y });
  }
  return out;
};
const walkFixed = source => {
  const baked = baker.bakeBossPathFixed(source);
  const out = [];
  for (let i = 0; i < baked.frames; i++) {
    out.push({
      x: baked.bytes[i * 4 + 1],
      y: baked.bytes[i * 4] - baker.SCREEN5_HUD_BAND_ROWS - baker.SPRITE_Y_BIAS,
    });
  }
  return out;
};
for (const [name, source] of Object.entries({ STRAIGHT, LOOP, WAVE })) {
  const a = boxOf(walkDelta(source));
  const b = boxOf(walkFixed(source));
  const near = (p, q) => Math.abs(p - q) <= 2;
  check(near(a.minX, b.minX) && near(a.maxX, b.maxX) && near(a.minY, b.minY) && near(a.maxY, b.maxY),
    `${name}: both bakes must trace the same shape (delta ${JSON.stringify(a)} vs fixed ${JSON.stringify(b)})`);
}

// --- the delta bake is load-bearing and must not have moved ------------------
for (const [name, source] of Object.entries({ STRAIGHT, LOOP, WAVE, SCRIPTED })) {
  const baked = baker.bakeBossPath(source, baker.BITMAP_BOSS_PATH_LIMITS);
  check(baked.bytes[baked.bytes.length - 1] === baker.PATH_OP_END,
    `${name}: the delta stream must still terminate with the end opcode`);
  check(baked.bytes.every(byte => byte >= 0 && byte <= 255),
    `${name}: the delta stream must still be bytes`);
}

if (failures.length) {
  console.error('FAIL check_msx2_boss_path_fixed_table');
  failures.forEach(message => console.error(`  - ${message}`));
  process.exit(1);
}
console.log('OK check_msx2_boss_path_fixed_table');

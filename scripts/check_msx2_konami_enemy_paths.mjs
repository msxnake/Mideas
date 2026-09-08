import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve('server/temp/konami-check');
mkdirSync(output, { recursive: true });
const require = createRequire(import.meta.url);
function load(source, name) {
  const outfile = resolve(output, `${name}.cjs`);
  buildSync({ entryPoints: [source], outfile, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' });
  return require(outfile);
}
const { bakeBossPath, bakeBossPathFixed } = load('utils/msx2BossPath.ts', 'baker');
const { PATH_EASING_OPTIONS, evaluatePathEasing, normalizePathTiming, evaluatePathTiming } = load('utils/msx2PathTiming.ts', 'timing');
const { bitmapEnemyPoolStride, buildBitmapEnemySystemAsm } = load('utils/msxGenerator/generators/msx2/msx2BitmapEnemyGenerator.ts', 'enemy');
const path = { id: 'test', name: 'test', loopMode: 'once', firing: 'auto', speedPxPerTick: 2,
  nodes: [{ id: 'a', x: 20, y: 70, actions: [] }, { id: 'b', x: 220, y: 70, actions: [] }] };
// Formula tests exercise time-to-distance, independently of route geometry.
for (const { value } of PATH_EASING_OPTIONS) {
  assert.equal(evaluatePathEasing(value, 0), 0);
  assert.equal(evaluatePathEasing(value, 1), 1);
  let previous = 0;
  for (let i = 1; i <= 100; i++) {
    const p = evaluatePathEasing(value, i / 100);
    assert(p >= previous && p <= 1, `${value} must advance without reversing`);
    previous = p;
  }
}
const timing = { durationFrames: 20, keys: [{ time: 0, distance: 0, easing: 'quadIn' }, { time: 1, distance: 1, easing: 'linear' }] };
for (const { value } of PATH_EASING_OPTIONS) {
  for (const intensity of [0, 0.8, 1, 1.012, 1.2, 2, 4]) {
    let previous = 0;
    for (let frame = 0; frame <= 100; frame++) {
      const u = frame / 100, result = evaluatePathEasing(value, u, intensity);
      assert(Number.isFinite(result) && result >= previous && result <= 1);
      if (intensity === 0) assert.equal(result, u);
      if (intensity === 1) assert.equal(result, evaluatePathEasing(value, u));
      previous = result;
    }
    assert.equal(previous, 1);
  }
}
assert.equal(evaluatePathEasing('quadIn', 0.5, 2), 0.125);
assert(evaluatePathEasing('sineInOut', 0.25, 2) < evaluatePathEasing('sineInOut', 0.25));
assert(evaluatePathEasing('sineInOut', 0.25, 0.8) > evaluatePathEasing('sineInOut', 0.25));
assert(Math.abs(evaluatePathEasing('smoothstep', 0.25, 2) + evaluatePathEasing('smoothstep', 0.75, 2) - 1) < 1e-10);
const timedPath = { ...path, nodes: [{ ...path.nodes[0], segment: { mode: 'linear', timing } }, path.nodes[1]] };
const timed = bakeBossPathFixed(timedPath, { yEncoding: 'gameArea' });
const intensePath = { ...timedPath, nodes: [{ ...timedPath.nodes[0], segment: { mode: 'linear', timing: { ...timing,
  keys: timing.keys.map(key => ({ ...key, intensity: 1.2 })) } } }, path.nodes[1]] };
const intenseBaked = bakeBossPathFixed(intensePath);
assert.equal(intenseBaked.frames, timed.frames);
assert.equal(intenseBaked.bytes[10 * 4 + 1], Math.round(20 + 200 * 0.5 ** 2.2));
assert.deepEqual(bakeBossPathFixed(JSON.parse(JSON.stringify(intensePath))).bytes, intenseBaked.bytes);
assert.equal(timed.frames, 21, 'origin plus exactly twenty timed transitions');
for (let i = 0; i <= 20; i++) assert.equal(timed.bytes[i * 4 + 1], Math.round(20 + 200 * (i / 20) ** 2));
assert.equal(timed.bytes[10 * 4 + 1], 70, 'half the time traverses a quarter of the distance with t²');
assert.deepEqual(bakeBossPath(timedPath).bytes, bakeBossPath(path).bytes, 'temporal layer must not affect delta mode');
const segmented = { durationFrames: 20, keys: [
  { time: 0, distance: 0, easing: 'quadIn' }, { time: 0.25, distance: 0.5, easing: 'linear' },
  { time: 0.75, distance: 0.5, easing: 'quadOut' }, { time: 1, distance: 1, easing: 'linear' },
] };
const hold = bakeBossPathFixed({ ...timedPath, nodes: [{ ...path.nodes[0], segment: { mode: 'linear', timing: segmented } }, path.nodes[1]] });
for (let i = 5; i <= 15; i++) assert.equal(hold.bytes[i * 4 + 1], 120, 'horizontal timing interval holds the position');
const roundTrip = JSON.parse(JSON.stringify(timedPath));
assert.deepEqual(bakeBossPathFixed(roundTrip).bytes, bakeBossPathFixed(timedPath).bytes, 'saved project keeps the temporal layer');
const ranged = { ...path, nodes: [
  { ...path.nodes[0], segment: { mode: 'linear', timing: { ...timing, endNodeId: 'b' } } },
  { id: 'mid1', x: 70, y: 70, actions: [] },
  { id: 'mid2', x: 150, y: 70, actions: [] }, path.nodes[1],
] };
const sharedTiming = { ...timing, intensity: 2, endNodeId: 'b', keys: [
  { time: 0, distance: 0, easing: 'quadIn' },
  { time: 0.5, distance: 0.5, easing: 'quadOut' },
  { time: 1, distance: 1, easing: 'linear' },
] };
assert.equal(evaluatePathTiming(sharedTiming.keys, 0.25, sharedTiming.intensity), 0.0625);
assert.equal(evaluatePathTiming(sharedTiming.keys, 0.75, sharedTiming.intensity), 0.9375);
const sharedPath = { ...ranged, nodes: ranged.nodes.map((n, i) => i === 0 ? { ...n, segment: { mode: 'linear', timing: sharedTiming } } : n) };
const sharedBaked = bakeBossPathFixed(sharedPath);
assert.equal(sharedBaked.frames, 21);
assert.equal(sharedBaked.bytes[5 * 4 + 1], 33, 'shared factor changes the first temporal formula');
assert.equal(sharedBaked.bytes[15 * 4 + 1], 208, 'shared factor also changes the later formula across spatial nodes');
assert.deepEqual(bakeBossPathFixed(JSON.parse(JSON.stringify(sharedPath))).bytes, sharedBaked.bytes);
assert.equal(normalizePathTiming({ ...sharedTiming, keys: sharedTiming.keys.map(k => ({ ...k, intensity: 0.8 })) }).intensity, 2, 'range intensity overrides legacy key settings');
assert.deepEqual(bakeBossPathFixed(ranged).bytes, bakeBossPathFixed(timedPath).bytes, 'intermediate nodes must not restart the quadratic clock');
assert.deepEqual(bakeBossPathFixed(JSON.parse(JSON.stringify(ranged))).bytes, bakeBossPathFixed(ranged).bytes, 'range endpoints survive JSON');
const corner = { ...ranged, nodes: [ranged.nodes[0], { id: 'corner', x: 120, y: 70, actions: [] }, { ...path.nodes[1], x: 120, y: 170 }] };
const cornerBaked = bakeBossPathFixed(corner, { yEncoding: 'gameArea' });
assert.equal(cornerBaked.frames, 21);
for (let i = 0; i <= 20; i++) {
  const distance = 200 * (i / 20) ** 2;
  assert.equal(cornerBaked.bytes[i * 4 + 1], Math.round(20 + Math.min(100, distance)));
  assert.equal(cornerBaked.bytes[i * 4], Math.round(70 + Math.max(0, distance - 100)));
}
const actionsRange = { ...ranged, nodes: ranged.nodes.map(n => n.id === 'mid1' ? { ...n, actions: [{ action: 'wait', frames: 3 }, { action: 'fire' }] } : n) };
const actionsBaked = bakeBossPathFixed(actionsRange);
assert.equal(actionsBaked.frames, 24, 'node waits remain additive to the movement clock');
assert.equal(actionsBaked.events.length, 1, 'intermediate actions are executed exactly once');
const overlap = { ...ranged, nodes: ranged.nodes.map(n => n.id === 'mid1' ? { ...n, segment: { mode: 'linear', timing } } : n) };
assert.deepEqual(bakeBossPathFixed(overlap).bytes, bakeBossPathFixed(ranged).bytes, 'outer range owns intermediate timing');
assert(bakeBossPathFixed(overlap).warnings.some(w => w.includes('overridden')));
const closedRange = { ...ranged, loopMode: 'loop', nodes: ranged.nodes.map((n, i) => i === 0 ? { ...n, segment: { mode: 'linear', timing: { ...timing, endNodeId: 'a' } } } : n) };
assert.equal(bakeBossPathFixed(closedRange).frames, 21, 'range may include the loop closing edge');
assert(bakeBossPathFixed({ ...ranged, nodes: ranged.nodes.filter(n => n.id !== 'b') }).warnings.some(w => w.includes('destination missing')));
const linearTiming = { ...timing, durationFrames: 100, keys: timing.keys.map(key => ({ ...key, easing: 'linear' })) };
const sineTimed = bakeBossPathFixed({ ...path, nodes: [{ ...path.nodes[0], segment: { mode: 'sine', amplitude: 24, frequency: 1, timing: linearTiming } }, path.nodes[1]] }, { yEncoding: 'gameArea' });
for (let i = 0; i < sineTimed.frames; i++) {
  const y = sineTimed.bytes[i * 4], x = sineTimed.bytes[i * 4 + 1];
  assert(Math.abs(y - (70 + 24 * Math.sin(2 * Math.PI * (x - 20) / 200))) < 1.5, 'time remapping stays on the original sine');
}
assert.equal(sineTimed.frames, 101, 'shape does not determine duration');
const broken = normalizePathTiming({ durationFrames: Infinity, keys: [
  { time: 0.6, distance: 0.8, easing: 'linear' }, { time: 0.7, distance: 0.2, easing: 'unknown' },
  { time: NaN, distance: 0.3, easing: 'quadIn' }, { time: 0.6, distance: 0.9, easing: 'linear' },
] });
assert.equal(broken.durationFrames, 60);
assert.equal(evaluatePathTiming(broken.keys, 0.7), 0.8, 'invalid imported curves cannot move backwards');
const ramp = { ...path, nodes: [{ ...path.nodes[0], segment: { mode: 'linear', speedStart: 1, speedEnd: 8 } }, path.nodes[1]] };
const baked = bakeBossPathFixed(ramp, { yEncoding: 'gameArea' });
const xs = baked.bytes.filter((_, i) => i % 4 === 1);
const gaps = xs.slice(1).map((x, i) => x - xs[i]);
assert(gaps.slice(0, 8).reduce((a, b) => a + b) < gaps.slice(-9, -1).reduce((a, b) => a + b), 'spacing must increase');
assert.equal(xs.at(-1), 220, 'acceleration must reach the end');
const brake = bakeBossPathFixed({ ...ramp, nodes: [{ ...ramp.nodes[0], segment: { mode: 'linear', speedStart: 8, speedEnd: 1 } }, path.nodes[1]] });
assert(brake.frames > 1);
const slow = bakeBossPathFixed({ ...ramp, nodes: [{ ...ramp.nodes[0], segment: { mode: 'linear', speedStart: 0.25, speedEnd: 0.25 } }, path.nodes[1]] });
assert.equal(slow.frames, 801, 'fractional speed keeps repeated frames');
const edited = bakeBossPathFixed({ ...ramp, fixedFramePositions: { 2: { x: 50, y: 80 } } }, { yEncoding: 'gameArea' });
assert.deepEqual(edited.bytes.slice(8, 10), [80, 50]);
assert.equal(edited.frames, baked.frames, 'dragging a frame changes position, not duration');
assert.deepEqual(bakeBossPath(ramp).bytes, bakeBossPath(path).bytes, 'bitmap boss delta mode stays unchanged');
const wave = bakeBossPathFixed({ ...ramp, nodes: [{ ...ramp.nodes[0], segment: { mode: 'sine', amplitude: 24, frequency: 1, speedStart: 1, speedEnd: 8 } }, path.nodes[1]] });
assert(wave.bounds.maxY >= 93 && wave.bounds.minY <= 47, 'acceleration preserves the sine shape');

const data = { maxSlots: 2, maxFrames: 1, roomTables: [[2, ...Array(44).fill(0)]], patternBytes: Array(64).fill(0),
  colorBytes: Array(16).fill(15), slimeEnabled: false, gearEnabled: false };
const options = { ramBase: 0xd000, satBase: 0x7600, colorBase: 0x7400, patternBase: 0x7800, patternGroupBase: 0,
  playerHitbox: { x: 0, y: 0, width: 16, height: 16 } };
const plain = buildBitmapEnemySystemAsm(data, options);
const withPaths = { ...data, konamiPaths: [{ bytes: baked.bytes, loop: true }, { bytes: baked.bytes, loop: false }], konamiRoomPaths: [[0, 1]] };
const runtime = buildBitmapEnemySystemAsm(withPaths, options);
assert.equal(bitmapEnemyPoolStride(withPaths), bitmapEnemyPoolStride(data) + 8);
assert.equal(runtime.ramBytes, plain.ramBytes + 16);
assert(!plain.routinesAsm.includes('bitmap_enemy_konami_step'));
assert(runtime.dataAsm.includes('bitmap_enemy_konami_path_1_end-4'), 'once holds the last frame');
assert(runtime.dataAsm.includes('DW bitmap_enemy_konami_path_0,bitmap_enemy_konami_path_0,bitmap_enemy_konami_path_0_end,bitmap_enemy_konami_path_0'), 'loop restarts from its own table');
assert(runtime.routinesAsm.indexOf('call bitmap_enemy_konami_step') < runtime.routinesAsm.indexOf('.enemy_step_cadence_gate:'), 'position table runs every video frame');
console.log('OK Konami formulas, independent timing layer, pauses, JSON round-trip, spacing, frame edits, sine, legacy isolation, RAM and loop/once generation');

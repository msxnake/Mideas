// Contract tests for utils/msx2TransitionFx.ts (SCREEN 5 transition FX: compiler + JS model of the VDP).
// Run: npx tsx scripts/test_msx2_transition_fx.ts      (npm run test:msx2-transition-fx)
//
// Every expectation comes from a source that is NOT the code under test:
//  - the design document (docs/msx/MSX2_TRANSITION_FX_DESIGN.md): palette plan numbers, opcode table, header;
//  - the easing formulas, the fade formula round(c * level) and the command costs, re-written here;
//  - the ORIGINAL presentation image (RGB per pixel) and the Sound Editor asset (durations, volumes);
//  - the Z80 playback routine in msx2PsgOneShot.ts (register order), parsed from its ASM text;
//  - bytes assembled by hand from the opcode table.
// A failing test exits with code 1. They were verified red by sabotaging the compiler/decoder (see the report).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assembleFxBlock, compileTransition, compileTransitionDetailed, createDefaultTransitionAsset, createFxDecoder, createLogoDropPreset,
  createPsgOneShotSequencer, decodeFxBlock, decodeFxOps, deriveFxImage, encodeFxOps, fxEase, fxPageRows, normalizeTransitionAsset,
  planPaletteGroups, readFxSourceImage, resolveTimeline, runFxToEnd, stepFxFrame, validateTransitionAsset,
  FX_MAX_BLOCK_BYTES, FX_OP,
  type FxDecoder, type FxOp, type FxRgb, type FxSourceImage,
} from '../utils/msx2TransitionFx';
import { buildPsgOneShotAsm, compilePsgOneShot, compilePsgOneShotRecords } from '../utils/msxGenerator/generators/msx2/msx2PsgOneShot';
import type { Msx2TransitionAsset, Msx2TransitionClip, PSGSoundData } from '../types';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-transition-fx', 'fixture_back_to_mars.json'), 'utf8'));
const sound: PSGSoundData = fixture.sound.data;
const SOUND_ID: string = fixture.sound.id;
const SOUNDS = { [SOUND_ID]: sound };

// ---------------------------------------------------------------------------
// harness
// ---------------------------------------------------------------------------
let passed = 0;
const failures: string[] = [];
function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (error: any) {
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${String(error?.stack ?? error).split('\n').slice(0, 8).join('\n       ')}`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as any)) deepFreeze(v);
  }
  return value;
}
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// ---------------------------------------------------------------------------
// independent references
// ---------------------------------------------------------------------------
/** easeOutBounce as parabola arcs of the standard curve (easings.net), in units of 1/2.75. */
function bounceRef(p: number): number {
  if (p >= 1) return 1;
  const arcs = [{ end: 1, centre: 0, base: 0 }, { end: 2, centre: 1.5, base: 0.75 }, { end: 2.5, centre: 2.25, base: 0.9375 }, { end: 2.75, centre: 2.625, base: 0.984375 }];
  const t = p * 2.75;
  const arc = arcs.find(a => t < a.end)!;
  return arc.base + 7.5625 * ((t - arc.centre) / 2.75) ** 2;
}
const easeRef = (kind: 'linear' | 'easeOut' | 'bounce', p: number) => (kind === 'linear' ? p : kind === 'easeOut' ? 1 - (1 - p) ** 3 : bounceRef(p));

// costs of the design doc: HMMM 4.51 us/B, HMMV 2.88 us/B, 0.35 ms per command (Z80), 60 Hz
const US_FRAME = 1_000_000 / 60;

/** The opcode table of the document: total length of each op (PALRUN is 3 + 2n). */
const OP_LEN: Record<number, number> = { 0: 1, 1: 2, 2: 8, 3: 7, 4: 8, 5: 4, 7: 2, 8: 2, 9: 1, 10: 1, 11: 2 };
function docWalk(block: Uint8Array, start: number): { end: number; syncSum: number; opCodes: number[] } {
  let pc = start; let syncSum = 0;
  const opCodes: number[] = [];
  for (;;) {
    const code = block[pc];
    opCodes.push(code);
    if (code >= 0x0c) throw new Error(`opcode ${code} at ${pc}`);
    const len = code === 6 ? 3 + 2 * block[pc + 2] : OP_LEN[code];
    if (code === 1) syncSum += block[pc + 1];
    pc += len;
    if (code === 0) return { end: pc, syncSum, opCodes };
  }
}

const rgbOf = (palette: FxRgb[], index: number) => palette[index].join(',');

// ---------------------------------------------------------------------------
// shared fixtures
// ---------------------------------------------------------------------------
const sourceImage: FxSourceImage = deepFreeze(readFxSourceImage(fixture.presentation));
const LOGO = { x: 4, y: 12, w: 250, h: 53 };
const ALIEN = { x: 68, y: 65, w: 104, h: 136 };
const demoAsset = (): Msx2TransitionAsset => createLogoDropPreset({
  sourcePresentationAssetId: fixture.presentation.id, logo: LOGO, alien: ALIEN, whooshSoundId: SOUND_ID, thudSoundId: SOUND_ID,
});
const demo = compileTransitionDetailed(demoAsset(), sourceImage, { sounds: SOUNDS });
assert.deepEqual(demo.errors, [], 'the demo must compile');
const demoDerived = demo.derived!;

/** Runs a block to END answering WAITKEY (press while it waits for one) and an optional skip press at `skipAt`. */
function runDemo(block: Uint8Array, derivedPixels: number[][], opts: { skipAt?: number; keyForever?: boolean; onTick?: (dec: FxDecoder) => void } = {}): FxDecoder {
  const dec = createFxDecoder(block, { page1: derivedPixels });
  while (!dec.done) {
    const key = opts.keyForever === true || dec.tick === opts.skipAt || dec.waitKeyPhase === 1;
    stepFxFrame(dec, key);
    opts.onTick?.(dec);
    assert.ok(dec.tick < 5000, 'runaway decoder');
  }
  return dec;
}

/** Page 0 expected mid-animation: the derived picture with every dynamic rect black, plus the layers pasted at `pos` (clipped). */
function renderExpected(derived: number[][], dynamic: Array<{ rect: { x: number; y: number; w: number; h: number }; pos?: { x: number; y: number }; rows?: Array<[number, number]> }>): number[][] {
  const out = derived.map(row => row.slice());
  for (const d of dynamic) for (let y = d.rect.y; y < d.rect.y + d.rect.h; y++) for (let x = d.rect.x; x < d.rect.x + d.rect.w; x++) out[y][x] = 0;
  for (const d of dynamic) {
    const pos = d.pos ?? { x: d.rect.x, y: d.rect.y };
    for (let ry = 0; ry < d.rect.h; ry++) {
      if (d.rows && !d.rows.some(([a, b]) => ry >= a && ry < b)) continue;
      for (let rx = 0; rx < d.rect.w; rx++) {
        const x = pos.x + rx; const y = pos.y + ry;
        if (x >= 0 && x < 256 && y >= 0 && y < 212) out[y][x] = derived[d.rect.y + ry][d.rect.x + rx];
      }
    }
  }
  return out;
}
const sameRows = (a: number[][], b: number[][]) => a.length === b.length && a.every((row, y) => row.every((v, x) => v === b[y][x]));
function firstDiff(a: number[][], b: number[][]): string {
  for (let y = 0; y < a.length; y++) for (let x = 0; x < a[y].length; x++) if (a[y][x] !== b[y][x]) return `first difference at (${x},${y}): ${a[y][x]} vs ${b[y][x]}`;
  return 'identical';
}

/** A busy image: every pixel non-black (colour 1..15 by position), black palette slot 0. */
function patternImage(): FxSourceImage {
  const palette: FxRgb[] = Array.from({ length: 16 }, (_u, i) => (i === 0 ? [0, 0, 0] : [i % 8, (i * 3) % 8, (i * 5) % 8 || 1] as FxRgb));
  const pixels = Array.from({ length: 212 }, (_u, y) => Array.from({ length: 256 }, (_v, x) => ((x >> 1) + y * 3) % 15 + 1));
  return deepFreeze({ width: 256 as const, height: 212 as const, pixels, palette });
}
const clip = (id: string, target: string, effect: Msx2TransitionClip['effect'], durationFrames: number, extra: Partial<Msx2TransitionClip> = {}): Msx2TransitionClip =>
  ({ id, target, effect, durationFrames, delayFrames: 0, easing: 'linear', params: {}, ...extra });
const assetOf = (layers: Msx2TransitionAsset['layers'], steps: Array<Msx2TransitionClip[]>, extra: Partial<Msx2TransitionAsset> = {}): Msx2TransitionAsset => ({
  version: 1, sourcePresentationAssetId: 'p', layers, steps: steps.map((clips, i) => ({ id: `s${i}`, name: `Paso ${i}`, clips })), skippable: true, ...extra,
});

// ---------------------------------------------------------------------------
// 1. palette plan
// ---------------------------------------------------------------------------
console.log('Palette plan and derived image');
test('plan = 16/16 slots and exactly 30 px change colour (document section 7)', () => {
  const plan = demoDerived.plan;
  assert.equal(plan.mode, 'grouped');
  assert.equal(plan.slotsUsed, 16, 'black + 15 colour slots');
  assert.equal(plan.alteredPixels, 30);
  assert.deepEqual(plan.errors, []);
  // the numbers must also hold when counted straight from the pixels (not from the plan's own tally)
  let altered = 0;
  for (let y = 0; y < 212; y++) for (let x = 0; x < 256; x++) {
    if (rgbOf(sourceImage.palette, sourceImage.pixels[y][x]) !== rgbOf(demoDerived.palette, demoDerived.pixels[y][x])) altered++;
  }
  assert.equal(altered, 30, 'pixels whose RGB differs between the source and the derived image');
});
test('plan merges are the ones of section 7 (2->12, 13->14, 7->14, 6->8->10, 14->10) with their pixel counts', () => {
  const key = (m: { from: number; to: number; pixels: number }) => `${m.from}>${m.to}:${m.pixels}`;
  const got = demoDerived.plan.merges.map(key).sort();
  // 6->8 carries 2 px (the 2 px of colour 6), 8->10 carries the 4 px of the merged colour, 14->10 the 16 + 1 px
  assert.deepEqual(got, ['13>14:7', '14>10:17', '2>12:2', '6>8:2', '7>14:1', '8>10:4']);
  assert.equal(demoDerived.plan.merges.length, 6);
});
test('groups are contiguous slot ranges tiling 1..15; black is slot 0 for every group', () => {
  const plan = demoDerived.plan;
  const taken = new Set<number>();
  for (const g of plan.groups) {
    for (let s = g.first; s < g.first + g.count; s++) { assert.ok(s >= 1 && s <= 15 && !taken.has(s), `slot ${s}`); taken.add(s); }
    assert.equal(g.colorMap[1], 0, `black (slot 1 of the source) must map to 0 in ${g.id}`);
  }
  assert.equal(taken.size, 15);
  assert.deepEqual(demoDerived.palette[0], [0, 0, 0]);
  // the alien group is isolated: no pixel of the logo rectangle may use one of its slots, and vice versa
  const alien = plan.groups.find(g => g.layerId === 'layer_alien')!;
  const isAlienSlot = (s: number) => s >= alien.first && s < alien.first + alien.count;
  for (let y = 0; y < 212; y++) for (let x = 0; x < 256; x++) {
    const inAlien = x >= ALIEN.x && x < ALIEN.x + ALIEN.w && y >= ALIEN.y && y < ALIEN.y + ALIEN.h;
    const s = demoDerived.pixels[y][x];
    if (s === 0) continue;
    assert.equal(isAlienSlot(s), inAlien, `pixel (${x},${y}) slot ${s}`);
  }
});
test('every pixel keeps its RGB except the 30 merged ones; packed bitmap = pixels', () => {
  for (let y = 0; y < 212; y += 1) for (let x = 0; x < 256; x++) {
    const orig = rgbOf(sourceImage.palette, sourceImage.pixels[y][x]);
    const now = rgbOf(demoDerived.palette, demoDerived.pixels[y][x]);
    if (orig !== now) assert.ok((x >= 4 && x <= 253 && y >= 12 && y <= 200), 'only logo/alien pixels may change');
  }
  for (let y = 0; y < 212; y++) for (let x = 0; x < 128; x++) {
    assert.equal(demoDerived.packed[y * 128 + x], (demoDerived.pixels[y][2 * x] << 4) | demoDerived.pixels[y][2 * x + 1]);
  }
  assert.equal(demoDerived.packed.length, 27136);
});
test('pinned colours are never merged away; impossible pins are ignored with a warning', () => {
  const pinned = { ...demoAsset(), palettePlan: { pinnedColors: [14] } };
  const plan = planPaletteGroups(sourceImage, normalizeTransitionAsset(pinned));
  assert.equal(plan.slotsUsed, 16);
  assert.ok(plan.merges.every(m => m.from !== 14), 'colour 14 stays');
  const d = deriveFxImage(sourceImage, normalizeTransitionAsset(pinned), plan);
  for (let y = 0; y < 212; y++) for (let x = 0; x < 256; x++) {
    if (sourceImage.pixels[y][x] === 14) assert.equal(rgbOf(d.palette, d.pixels[y][x]), rgbOf(sourceImage.palette, 14));
  }
  const all = { ...demoAsset(), palettePlan: { pinnedColors: Array.from({ length: 15 }, (_u, i) => i + 1) } };
  const planAll = planPaletteGroups(sourceImage, normalizeTransitionAsset(all));
  assert.equal(planAll.slotsUsed, 16);
  assert.ok(planAll.pinnedIgnored.length > 0 && planAll.warnings.some(w => /fijados/.test(w)));
});
test('only a global fade (or none) derives nothing: same indices, same palette', () => {
  const asset = assetOf([], [[clip('g', '__screen', 'fade', 8, { params: { fade: { direction: 'in' } } })]]);
  const d = deriveFxImage(sourceImage, normalizeTransitionAsset(asset));
  assert.equal(d.plan.mode, 'identity');
  assert.ok(sameRows(d.pixels, sourceImage.pixels));
  assert.deepEqual(d.palette, sourceImage.palette);
  assert.notEqual(d.pixels, sourceImage.pixels);
  assert.notEqual(d.pixels[0], sourceImage.pixels[0], 'a new bitmap, not an alias of the source');
});
test('16 layers that each fade need 16 isolated colours: the plan reports an error', () => {
  const layers = Array.from({ length: 16 }, (_u, k) => ({ id: `l${k}`, name: `L${k}`, rect: { x: 2 * k, y: 0, w: 2, h: 1 } }));
  const palette: FxRgb[] = Array.from({ length: 16 }, (_u, i) => [i % 8, (i >> 1) % 8, (i * 3) % 8] as FxRgb);
  palette[0] = [0, 0, 0];
  palette[1] = [1, 0, 0];
  const pixels = Array.from({ length: 212 }, (_u, y) => Array.from({ length: 256 }, (_v, x) => (y === 0 && x < 32 ? 1 + Math.floor(x / 2) % 15 : 0)));
  // 16 groups each holding at least one colour (colours repeat, but groups are isolated)
  const image: FxSourceImage = { width: 256, height: 212, pixels, palette };
  const asset = assetOf(layers, [layers.map(l => clip(`c_${l.id}`, l.id, 'fade', 4))]);
  const plan = planPaletteGroups(image, normalizeTransitionAsset(asset));
  assert.ok(plan.errors.length > 0, 'must not fit');
});

// ---------------------------------------------------------------------------
// 2. no mutation
// ---------------------------------------------------------------------------
console.log('Inputs are never mutated');
test('compiling leaves the presentation, the asset and the sound untouched (frozen inputs + hash)', () => {
  const presentation = deepFreeze(JSON.parse(JSON.stringify(fixture.presentation)));
  const before = sha(presentation);
  const asset = deepFreeze(demoAsset());
  const snd = deepFreeze(JSON.parse(JSON.stringify(sound)));
  const img = deepFreeze(readFxSourceImage(presentation));
  const hashImg = sha(img);
  const result = compileTransitionDetailed(asset, img, { sounds: { [SOUND_ID]: snd } });
  assert.deepEqual(result.errors, []);
  assert.equal(sha(presentation), before);
  assert.equal(sha(img), hashImg);
  assert.equal(sha(asset), sha(demoAsset()));
  assert.equal(sha(snd), sha(sound));
  const bytes = compileTransition(asset, img, { sounds: { [SOUND_ID]: snd } });
  assert.equal(Buffer.compare(Buffer.from(bytes), Buffer.from(result.bytes)), 0, 'deterministic');
});
test('normalizeTransitionAsset is idempotent, snaps odd rects and does not alias its input', () => {
  const raw: any = { version: 7, layers: [{ id: 'a', rect: { x: 5, y: -4, w: 33, h: 999 } }], steps: [{ clips: [{ effect: 'bogus', durationFrames: -3, sounds: [{ soundAssetId: 'x', offsetFrames: 500 }, { soundAssetId: 'y' }, { soundAssetId: 'z' }] }] }] };
  const frozen = deepFreeze(JSON.parse(JSON.stringify(raw)));
  const n = normalizeTransitionAsset(frozen);
  assert.equal(n.version, 1);
  assert.deepEqual(n.layers[0].rect, { x: 4, y: 0, w: 32, h: 212 });
  assert.equal(n.steps[0].clips[0].effect, 'hold');
  assert.equal(n.steps[0].clips[0].sounds!.length, 2);
  assert.equal(n.steps[0].clips[0].sounds![0].offsetFrames, 60);
  assert.deepEqual(normalizeTransitionAsset(n), n);
  assert.equal(n.skippable, true);
});

// ---------------------------------------------------------------------------
// 3. bytes
// ---------------------------------------------------------------------------
console.log('Block format');
test('header and layout follow the document (parsed with an independent walker over the opcode table)', () => {
  const b = demo.bytes;
  const u16 = (i: number) => b[i] | (b[i + 1] << 8);
  assert.equal(b[0], 1, 'version');
  assert.equal(b[1] & 1, 1, 'skippable');
  assert.equal(b[2], 0, 'R#7 = 0: black is slot 0 while the effect runs');
  assert.equal(b[3], 0);
  const offStream = u16(4); const offFinal = u16(6); const offSounds = u16(8); const total = u16(10);
  assert.equal(offStream, 12);
  const main = docWalk(b, offStream);
  assert.equal(offFinal, main.end, 'the skip sequence follows the main stream');
  const fin = docWalk(b, offFinal);
  assert.equal(offSounds, fin.end, 'the sound table follows the skip sequence');
  assert.equal(total, main.syncSum, 'totalFrames = sum of the SYNC operands of the main stream');
  assert.equal(total, demo.totalTicks);
  // sound table: u8 n, n x u16, then 10-byte records closed by a zero duration
  assert.equal(b[offSounds], 1, 'one distinct sound ("xof") used twice');
  const first = u16(offSounds + 1);
  assert.equal(first, offSounds + 3);
  let pos = first; let records = 0;
  while (b[pos] !== 0) { pos += 10; records++; }
  assert.equal(records, 3, 'xof has 3 steps');
  assert.equal(pos + 1, b.length, 'the block ends right after the sound terminator');
  assert.equal(main.opCodes[main.opCodes.length - 1], 0);
  assert.ok(main.opCodes.every(c => c <= 0x0b));
  assert.ok(main.opCodes.includes(0x0a), 'the preset waits for a key (WAITKEY)');
  assert.ok(main.opCodes.includes(0x08), 'SFX');
});
test('encode -> decode is the identity (whole block and per op, every opcode)', () => {
  const parts = decodeFxBlock(demo.bytes);
  const again = assembleFxBlock({
    skippable: parts.header.skippable, backdrop: parts.header.backdrop, mainOps: parts.mainOps, finalOps: parts.finalOps, sounds: parts.sounds, totalFrames: parts.header.totalFrames,
  });
  assert.equal(Buffer.compare(Buffer.from(again), Buffer.from(demo.bytes)), 0);
  const everyOp: FxOp[] = [
    { op: 'PAL', index: 3, rgb: [1, 2, 3] }, { op: 'PALRUN', first: 14, colors: [[7, 6, 5], [0, 1, 2]] },
    { op: 'HMMM', sx: 254, sy: 211, dx: 2, dy: 250, w: 2, h: 255, srcPage: 3, dstPage: 2 },
    { op: 'HMMV', dx: 0, dy: 0, w: 256, h: 212, page: 1, color: 0x2e },
    { op: 'LMMM', sx: 255, sy: 0, dx: 1, dy: 2, w: 256, h: 9, srcPage: 1, dstPage: 0, timp: true },
    { op: 'FLIP', page: 3 }, { op: 'SFX', id: 127 }, { op: 'SFXOFF' }, { op: 'WAITKEY' }, { op: 'BACKDROP', color: 9 }, { op: 'SYNC', n: 255 }, { op: 'END' },
  ];
  assert.deepEqual(decodeFxOps(Uint8Array.from(encodeFxOps(everyOp)), 0), everyOp);
});
test('hand-assembled bytes (written from the opcode table) mean what the document says', () => {
  // palette 1 = (R7,G7,B0); HMMM page1(0,0) 2x1 -> page0; HMMM page1(0,0) -> page 2 at row 5; HMMV page 3 (2,1) col #2E
  const stream = [
    0x05, 0x01, 0x70, 0x07,
    0x07, 0x00,
    0x02, 0, 0, 0, 0, 1, 1, 0x01,
    0x02, 0, 0, 0, 5, 1, 1, 0x09,
    0x03, 1, 1, 1, 1, 3, 0x2e,
    0x01, 0x02,
    0x00,
  ];
  const offSounds = 12 + stream.length;
  const block = Uint8Array.from([1, 0, 0, 0, 12, 0, 0, 0, offSounds & 255, offSounds >> 8, 2, 0, ...stream, 0]);
  const page1 = Array.from({ length: 212 }, () => new Array(256).fill(0));
  page1[0][0] = 5; page1[0][1] = 9;
  const dec = createFxDecoder(block, { page1 });
  runFxToEnd(dec);
  assert.deepEqual(dec.palette[1], [7, 7, 0]);
  assert.deepEqual([dec.vram[0], dec.vram[1]], [5, 9], 'page 0 got the pixels (source page 1, destination page 0)');
  assert.deepEqual([dec.vram[2 * 65536 + 5 * 256], dec.vram[2 * 65536 + 5 * 256 + 1]], [5, 9], 'DY high byte = destination page: page 2, row 5');
  assert.equal(dec.vram[2 * 65536], 0, 'row 0 of page 2 untouched');
  assert.deepEqual([dec.vram[3 * 65536 + 256 + 2], dec.vram[3 * 65536 + 256 + 3]], [2, 14], 'HMMV: even x gets the high nibble');
  assert.equal(dec.vram[65536], 5, 'the source page is untouched');
  assert.equal(dec.tick, 2);
  assert.equal(dec.visiblePage, 0);
});
test('an invalid opcode throws (decoder and walker); truncated operands throw', () => {
  const header = (len: number) => [1, 0, 0, 0, 12, 0, 0, 0, len & 255, len >> 8, 0, 0];
  const bad = Uint8Array.from([...header(14), 0x0c, 0x00, 0x00]);
  assert.throws(() => runFxToEnd(createFxDecoder(bad)), /inválido/);
  assert.throws(() => runFxToEnd(createFxDecoder(Uint8Array.from([...header(14), 0xff, 0x00, 0x00]))), /inválido/);
  assert.throws(() => decodeFxOps(Uint8Array.from([0x02, 1, 2]), 0), /truncado/);
  assert.throws(() => docWalk(bad, 12), /opcode/);
});
test('the palette must be written right after SYNC: PAL after a draw in the same frame throws', () => {
  const stream = [0x02, 0, 0, 0, 0, 1, 1, 0x01, 0x05, 0x01, 0x70, 0x07, 0x01, 0x01, 0x00];
  const len = 12 + stream.length;
  const block = Uint8Array.from([1, 0, 0, 0, 12, 0, 0, 0, len & 255, len >> 8, 1, 0, ...stream, 0]);
  assert.throws(() => runFxToEnd(createFxDecoder(block)), /justo tras el SYNC/);
});
test('blocks that are skippable without a skip sequence, and bad versions, are rejected', () => {
  const stream = [0x00];
  const len = 12 + stream.length;
  assert.throws(() => createFxDecoder(Uint8Array.from([1, 1, 0, 0, 12, 0, 0, 0, len & 255, len >> 8, 0, 0, ...stream, 0])), /saltable/);
  assert.throws(() => createFxDecoder(Uint8Array.from([2, 0, 0, 0, 12, 0, 0, 0, len & 255, len >> 8, 0, 0, ...stream, 0])), /Versión/);
});

// ---------------------------------------------------------------------------
// 4. running the demo
// ---------------------------------------------------------------------------
console.log('Demo: alien fades in (32 frames), logo falls (40 frames) with whoosh and thud, wait for a key');
test('timeline: alien fade 0..32, logo slide 32..72, hold at 72; the flow is below 4 KB', () => {
  const tl = resolveTimeline(demoAsset());
  const byId = Object.fromEntries(tl.clips.map(c => [c.clip.id, [c.start, c.end]]));
  assert.deepEqual(byId, { clip_alien_fade: [0, 32], clip_logo_drop: [32, 72], clip_wait: [72, 72] });
  assert.equal(tl.totalFrames, 72);
  assert.ok(demo.bytes.length < 4096, `block is ${demo.bytes.length} bytes`);
  assert.ok(demo.bytes.length <= FX_MAX_BLOCK_BYTES);
});
test('final page 0 = derived image and final palette = derived palette (run to END, key pressed at WAITKEY)', () => {
  const dec = runDemo(demo.bytes, demoDerived.pixels);
  assert.equal(dec.skipped, false);
  assert.equal(dec.visiblePage, 0);
  assert.equal(dec.backdrop, 0);
  const page0 = fxPageRows(dec, 0, 212);
  assert.ok(sameRows(page0, demoDerived.pixels), firstDiff(page0, demoDerived.pixels));
  assert.deepEqual(dec.palette, demoDerived.palette);
  assert.equal(dec.psgRegs[10], 0, 'END silences channel C');
  // and, through the palette, the visible RGB equals the ORIGINAL image except the 30 merged pixels
  let different = 0;
  for (let y = 0; y < 212; y++) for (let x = 0; x < 256; x++) {
    if (rgbOf(dec.palette, page0[y][x]) !== rgbOf(sourceImage.palette, sourceImage.pixels[y][x])) different++;
  }
  assert.equal(different, 30);
  assert.ok(dec.tick >= demo.totalTicks, 'the run lasts at least the ticks announced in the header (plus the wait for the key)');
});
test('alien fade-in: palette of its group at frame k = round(c * (k+1)/32), the rest never fades', () => {
  const alien = demoDerived.plan.groups.find(g => g.layerId === 'layer_alien')!;
  const rest = demoDerived.plan.groups.find(g => g.layerId === null)!;
  const endTick = (frame: number) => demo.frames[frame + 1].tickStart + demo.frames[frame + 1].ticks;
  const wanted = new Map<number, number>();
  for (let k = 0; k < 32; k++) wanted.set(endTick(k), k);
  wanted.set(endTick(40), 99);
  wanted.set(demo.frames[0].tickStart + demo.frames[0].ticks, -1); // end of the preparation: before any frame
  let seen = 0;
  runDemo(demo.bytes, demoDerived.pixels, {
    onTick: dec => {
      const k = wanted.get(dec.tick);
      if (k === undefined) return;
      seen++;
      const level = k === 99 ? 1 : k === -1 ? 0 : (k + 1) / 32; // k = -1: the fade-in starts from level 0 (invisible), not from full colour
      for (let s = alien.first; s < alien.first + alien.count; s++) {
        const expected = demoDerived.palette[s].map(c => Math.round(c * level));
        assert.deepEqual(dec.palette[s], expected, `alien slot ${s} at frame ${k}`);
      }
      for (let s = rest.first; s < rest.first + rest.count; s++) assert.deepEqual(dec.palette[s], demoDerived.palette[s], `rest slot ${s} at frame ${k}`);
      assert.deepEqual(dec.palette[0], [0, 0, 0]);
    },
  });
  assert.equal(seen, 34);
});
test('logo falls: page 0 at every frame equals the picture with the logo at y = 12 - round((1-bounce(p))*65)', () => {
  const D = 40;
  const dist = LOGO.y + LOGO.h; // starts with its bottom edge at the top of the screen
  const wanted = new Map<number, number>();
  const expectedY: number[] = [];
  for (let j = 0; j < D; j++) {
    const e = bounceRef((j + 1) / D);
    expectedY.push(j === D - 1 ? LOGO.y : LOGO.y - Math.round((1 - e) * dist));
    const f = 32 + j;
    wanted.set(demo.frames[f + 1].tickStart + demo.frames[f + 1].ticks, j);
  }
  assert.equal(expectedY[D - 1], 12);
  assert.ok(expectedY.some(y => y < 0) && new Set(expectedY).size > 20, 'the path must really move (and be clipped at the top)');
  let checked = 0;
  runDemo(demo.bytes, demoDerived.pixels, {
    onTick: dec => {
      const j = wanted.get(dec.tick);
      if (j === undefined) return;
      const expected = renderExpected(demoDerived.pixels, [{ rect: LOGO, pos: { x: LOGO.x, y: expectedY[j] } }]);
      const got = fxPageRows(dec, 0, 212);
      assert.ok(sameRows(got, expected), `frame ${j} (logo y=${expectedY[j]}): ${firstDiff(got, expected)}`);
      checked++;
    },
  });
  assert.equal(checked, D);
});
test('sounds: whoosh at the first frame of the drop, thud at its last frame, one table entry', () => {
  assert.equal(demo.soundEvents.length, 2);
  const [whoosh, thud] = demo.soundEvents;
  assert.equal(whoosh.frame, 32);
  assert.equal(thud.frame, 71, 'last frame of the 40-frame clip');
  const dec = runDemo(demo.bytes, demoDerived.pixels);
  assert.deepEqual(dec.sfxLog.map(e => e.tick), [demo.frames[32 + 1].tickStart, demo.frames[71 + 1].tickStart]);
  assert.ok(demo.totalTicks >= thud.tick + 24, 'a tail of SYNCs lets the thud ring out before the wait for a key');
  assert.equal(whoosh.tableIndex, thud.tableIndex);
});
test('frame budget: a frame lasts ceil((Z80 + VDP) / 16.67 ms) ticks, computed here from the issued commands', () => {
  const dec = runDemo(demo.bytes, demoDerived.pixels);
  for (const info of demo.frames) {
    const cmds = dec.rectLog.filter(r => r.tick === info.tickStart);
    let us = 0;
    for (const r of cmds) us += 350 + (r.w / 2) * r.h * (r.op === 'HMMV' ? 2.88 : 4.51);
    const expectedTicks = Math.max(1, Math.ceil(us / US_FRAME));
    // the compiler also counts the palette / sound writes of the frame (< 0.5 ms): allow one tick more only right at a boundary
    const nearBoundary = expectedTicks * US_FRAME - us < 500;
    if (cmds.length) assert.ok(info.ticks === expectedTicks || (nearBoundary && info.ticks === expectedTicks + 1), `frame ${info.frame}: ${info.ticks} vs ${expectedTicks} (${(us / 1000).toFixed(2)} ms)`);
  }
  const drop = demo.frames.filter(f => f.frame >= 32 && f.frame < 72 && f.opCount > 0);
  assert.ok(drop.some(f => f.ticks >= 2), 'the 250x53 logo (6625 B = ~30 ms) cannot fit in one frame');
  assert.ok(demo.warnings.some(w => /Logo/.test(w) && /1\/60/.test(w)), 'the compiler says so');
  const prep = demo.frames[0];
  assert.ok(Math.abs(prep.vdpUs - 7072 * 4.51) < 1, 'the static alien (7072 B) is the preparation');
  assert.ok(prep.cpuUs > 0 && prep.cpuUs < prep.vdpUs / 10, 'Z80 and VDP time are reported apart');
});
test('rectangles: x and w even, inside 256x212, HMMM page 1 -> page 0 (decoded streams and executed commands)', () => {
  const parts = decodeFxBlock(demo.bytes);
  const rects: Array<{ x: number; y: number; w: number; h: number; op: string }> = [];
  for (const op of [...parts.mainOps, ...parts.finalOps]) {
    if (op.op === 'HMMM') { assert.equal(op.srcPage, 1); assert.equal(op.dstPage, 0); rects.push({ x: op.sx, y: op.sy, w: op.w, h: op.h, op: 'src' }); rects.push({ x: op.dx, y: op.dy, w: op.w, h: op.h, op: 'dst' }); }
    if (op.op === 'HMMV') { assert.equal(op.page, 0); rects.push({ x: op.dx, y: op.dy, w: op.w, h: op.h, op: 'fill' }); }
  }
  assert.ok(rects.length > 40);
  for (const r of rects) {
    assert.equal(r.x % 2, 0, `${r.op} x=${r.x}`);
    assert.equal(r.w % 2, 0, `${r.op} w=${r.w}`);
    assert.ok(r.x >= 0 && r.w >= 2 && r.x + r.w <= 256 && r.y >= 0 && r.h >= 1 && r.y + r.h <= 212, `${r.op} ${JSON.stringify(r)}`);
  }
  const dec = runDemo(demo.bytes, demoDerived.pixels);
  assert.ok(dec.rectLog.length > 40);
  for (const r of dec.rectLog) assert.ok(r.dx % 2 === 0 && r.w % 2 === 0 && r.dx + r.w <= 256 && r.dy + r.h <= 212);
});
/** Opcode lists of a block's main stream, split at every SYNC (the SYNC closes its group), walked with the document's op lengths. */
function groupsOf(block: Uint8Array): number[][] {
  const groups: number[][] = [[]];
  let pc = block[4] | (block[5] << 8);
  for (;;) {
    const code = block[pc];
    groups[groups.length - 1].push(code);
    const len = code === 6 ? 3 + 2 * block[pc + 2] : OP_LEN[code];
    pc += len;
    if (code === 1) groups.push([]);
    if (code === 0) return groups;
  }
}
const concurrentAsset = (): Msx2TransitionAsset => assetOf(
  [{ id: 'logo', name: 'Logo', rect: LOGO }, { id: 'alien', name: 'Alien', rect: ALIEN }],
  [[
    clip('fade', 'alien', 'fade', 24, { params: { fade: { direction: 'in' } } }),
    clip('drop', 'logo', 'slide', 20, { easing: 'bounce', params: { direction: 'down' } }),
  ]],
);
test('in every frame the palette / FLIP / BACKDROP ops precede every draw (a fade and a slide share frames here)', () => {
  const r = compileTransitionDetailed(concurrentAsset(), sourceImage);
  assert.deepEqual(r.errors, []);
  for (const block of [demo.bytes, r.bytes]) {
    let mixed = 0;
    for (const g of groupsOf(block)) {
      const lastSetup = Math.max(-1, ...g.map((c, i) => ([5, 6, 7, 11].includes(c) ? i : -1)));
      const firstDraw = g.findIndex(c => c === 2 || c === 3 || c === 4);
      if (lastSetup >= 0 && firstDraw >= 0) { mixed++; assert.ok(lastSetup < firstDraw, `group ${JSON.stringify(g)}`); }
    }
    if (block === r.bytes) assert.ok(mixed >= 10, `only ${mixed} frames mix palette writes and draws: the test would prove nothing`);
  }
});
test('a fade-in on one layer while another slides: both follow their own formulas frame by frame', () => {
  const r = compileTransitionDetailed(concurrentAsset(), sourceImage);
  assert.deepEqual(r.errors, []);
  const d = r.derived!;
  const alien = d.plan.groups.find(g => g.layerId === 'alien')!;
  const wanted = new Map<number, number>();
  for (let f = 0; f < 24; f++) wanted.set(r.frames[f + 1].tickStart + r.frames[f + 1].ticks, f);
  const dec = createFxDecoder(r.bytes, { page1: d.pixels });
  let checked = 0;
  while (!dec.done) {
    stepFxFrame(dec, false);
    const f = wanted.get(dec.tick);
    if (f === undefined || dec.done) continue;
    const level = (f + 1) / 24;
    for (let s = alien.first; s < alien.first + alien.count; s++) assert.deepEqual(dec.palette[s], d.palette[s].map(c => Math.round(c * level)), `alien slot ${s}, frame ${f}`);
    const y = f < 20 ? (f === 19 ? LOGO.y : LOGO.y - Math.round((1 - bounceRef((f + 1) / 20)) * 65)) : LOGO.y;
    const expected = renderExpected(d.pixels, [{ rect: LOGO, pos: { x: LOGO.x, y } }]);
    const got = fxPageRows(dec, 0, 212);
    assert.ok(sameRows(got, expected), `frame ${f} (y=${y}): ${firstDiff(got, expected)}`);
    checked++;
  }
  assert.equal(checked, 24);
  assert.ok(sameRows(fxPageRows(dec, 0, 212), d.pixels));
});
test('the decoder refuses rectangles outside 256x212 (rows below 212 would hit the sprite tables of page 1)', () => {
  const wrap = (stream: number[]) => { const len = 12 + stream.length; return Uint8Array.from([1, 0, 0, 0, 12, 0, 0, 0, len & 255, len >> 8, 1, 0, ...stream, 0]); };
  const page1 = Array.from({ length: 212 }, () => new Array(256).fill(1));
  // HMMM 2x6 from page 1 row 0 to page 0 row 208 (rows 208..213): out of the picture
  assert.throws(() => runFxToEnd(createFxDecoder(wrap([0x02, 0, 0, 0, 208, 1, 6, 0x01, 0x01, 0x01, 0x00]), { page1 })), /no cabe/);
  // HMMV 256 wide starting at x = 2
  assert.throws(() => runFxToEnd(createFxDecoder(wrap([0x03, 1, 0, 128, 1, 0, 0x11, 0x01, 0x01, 0x00]))), /no cabe/);
  // the same commands inside the picture run
  runFxToEnd(createFxDecoder(wrap([0x02, 0, 0, 0, 206, 1, 6, 0x01, 0x01, 0x01, 0x00]), { page1 }));
});
test('skipping with a key at ANY tick reaches the same final state (page 0, palette, page, backdrop, silence)', () => {
  const reference = runDemo(demo.bytes, demoDerived.pixels);
  const refPage = fxPageRows(reference, 0, 212);
  let skippedRuns = 0;
  for (let t = 0; t < demo.totalTicks; t += 3) {
    const dec = runDemo(demo.bytes, demoDerived.pixels, { skipAt: t });
    assert.equal(dec.skipped, true, `a press at tick ${t} must skip`);
    skippedRuns++;
    const page = fxPageRows(dec, 0, 212);
    assert.ok(sameRows(page, refPage), `skip at tick ${t}: ${firstDiff(page, refPage)}`);
    assert.deepEqual(dec.palette, reference.palette, `palette after a skip at tick ${t}`);
    assert.equal(dec.visiblePage, 0);
    assert.equal(dec.backdrop, reference.backdrop);
    assert.equal(dec.psgRegs[10], 0, 'a skip silences the sound');
  }
  assert.ok(skippedRuns > 30);
  const quick = runDemo(demo.bytes, demoDerived.pixels, { skipAt: demo.totalTicks - 2 });
  assert.equal(quick.skipped, true);
});
test('a block that is not skippable ignores the key and has no skip sequence', () => {
  const asset = { ...demoAsset(), skippable: false, steps: demoAsset().steps.slice(0, 2) };
  const r = compileTransitionDetailed(asset, sourceImage, { sounds: SOUNDS });
  assert.deepEqual(r.errors, []);
  assert.equal(r.bytes[1] & 1, 0);
  assert.equal(r.bytes[6] | (r.bytes[7] << 8), 0, 'offFinal = 0');
  const dec = createFxDecoder(r.bytes, { page1: r.derived!.pixels });
  while (!dec.done) { stepFxFrame(dec, dec.tick % 2 === 0); assert.ok(dec.tick < 1000); }
  assert.equal(dec.skipped, false);
  assert.ok(sameRows(fxPageRows(dec, 0, 212), r.derived!.pixels));
});

// ---------------------------------------------------------------------------
// 5. other effects, on a busy image
// ---------------------------------------------------------------------------
console.log('Other effects (busy image: nothing is black, so a missing repaint cannot hide)');
const busy = patternImage();
test('easing formulas: bounce touches 0.75 / 0.9375 / 0.984375 at the arc centres, p=1 is exactly 1', () => {
  assert.equal(fxEase('bounce', 0), 0);
  assert.equal(fxEase('bounce', 1), 1);
  for (const [t, v] of [[1.5, 0.75], [2.25, 0.9375], [2.625, 0.984375]] as const) assert.ok(Math.abs(fxEase('bounce', t / 2.75) - v) < 1e-9, `bounce at ${t}/2.75`);
  for (const kind of ['linear', 'easeOut', 'bounce'] as const) {
    for (let i = 0; i <= 64; i++) assert.ok(Math.abs(fxEase(kind, i / 64) - easeRef(kind, i / 64)) < 1e-9, `${kind} ${i}/64`);
  }
});
for (const direction of ['down', 'up', 'left', 'right'] as const) {
  test(`slide ${direction} over a busy picture: every frame equals the independent render, final state = derived image`, () => {
    const rect = { x: 40, y: 50, w: 60, h: 36 };
    const D = 12;
    const asset = assetOf([{ id: 'L', name: 'L', rect }], [[clip('c', 'L', 'slide', D, { easing: 'easeOut', params: { direction, distance: 24 } })]]);
    const r = compileTransitionDetailed(asset, busy);
    assert.deepEqual(r.errors, []);
    const wanted = new Map<number, number>();
    for (let j = 0; j < D; j++) wanted.set(r.frames[j + 1].tickStart + r.frames[j + 1].ticks, j);
    let checked = 0;
    const dec = createFxDecoder(r.bytes, { page1: r.derived!.pixels });
    while (!dec.done) {
      stepFxFrame(dec, false);
      const j = wanted.get(dec.tick);
      if (j === undefined || dec.done) continue;
      const e = easeRef('easeOut', (j + 1) / D);
      const off = j === D - 1 ? 0 : (1 - e) * 24;
      const o = direction === 'down' || direction === 'up' ? Math.round(off) : 2 * Math.round(off / 2);
      const pos = { x: rect.x + (direction === 'left' ? o : direction === 'right' ? -o : 0), y: rect.y + (direction === 'up' ? o : direction === 'down' ? -o : 0) };
      const expected = renderExpected(r.derived!.pixels, [{ rect, pos }]);
      const got = fxPageRows(dec, 0, 212);
      assert.ok(sameRows(got, expected), `${direction} frame ${j}: ${firstDiff(got, expected)}`);
      checked++;
    }
    assert.equal(checked, D);
    assert.ok(sameRows(fxPageRows(dec, 0, 212), r.derived!.pixels), 'final = derived image');
  });
}
for (const direction of ['down', 'up', 'left', 'right'] as const) {
  test(`reveal ${direction} with strips of 4 and 3 slats: uncovered area per frame follows round(e*size/q)*q per slat`, () => {
    const rect = { x: 20, y: 30, w: 80, h: 50 };
    const D = 9; const q = 4; const slats = 3;
    const asset = assetOf([{ id: 'L', name: 'L', rect }], [[clip('c', 'L', 'reveal', D, { easing: 'easeOut', params: { direction, stripSize: q, slats } })]]);
    const r = compileTransitionDetailed(asset, busy);
    assert.deepEqual(r.errors, []);
    const vertical = direction === 'down' || direction === 'up';
    const extent = vertical ? rect.h : rect.w;
    let band = Math.ceil(extent / slats);
    if (!vertical && band % 2) band++;
    const bands: Array<[number, number]> = [];
    for (let s = 0; s < extent; s += band) bands.push([s, Math.min(extent, s + band)]);
    const wanted = new Map<number, number>();
    for (let j = 0; j < D; j++) wanted.set(r.frames[j + 1].tickStart + r.frames[j + 1].ticks, j);
    const done = bands.map(() => 0);
    const qq = vertical ? q : Math.max(2, q - (q % 2));
    const dec = createFxDecoder(r.bytes, { page1: r.derived!.pixels });
    let checked = 0;
    while (!dec.done) {
      stepFxFrame(dec, false);
      const j = wanted.get(dec.tick);
      if (j === undefined || dec.done) continue;
      const e = easeRef('easeOut', (j + 1) / D);
      const expected = r.derived!.pixels.map(row => row.slice());
      for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) expected[y][x] = 0;
      bands.forEach(([a, b], i) => {
        const size = b - a;
        done[i] = Math.max(done[i], j === D - 1 ? size : Math.min(size, Math.round(e * size / qq) * qq));
        for (let k = 0; k < done[i]; k++) {
          // k-th uncovered line of the slat, counted from the side the reveal starts at
          const line = direction === 'down' || direction === 'right' ? a + k : b - 1 - k;
          if (vertical) for (let x = rect.x; x < rect.x + rect.w; x++) expected[rect.y + line][x] = r.derived!.pixels[rect.y + line][x];
          else for (let y = rect.y; y < rect.y + rect.h; y++) expected[y][rect.x + line] = r.derived!.pixels[y][rect.x + line];
        }
      });
      const got = fxPageRows(dec, 0, 212);
      assert.ok(sameRows(got, expected), `${direction} frame ${j}: ${firstDiff(got, expected)}`);
      checked++;
    }
    assert.equal(checked, D);
    assert.ok(sameRows(fxPageRows(dec, 0, 212), r.derived!.pixels));
  });
}
test('palette fades: global x layer levels multiply, fade-out ends black, easing applies, between clips the level holds', () => {
  const base: FxRgb[] = busy.palette;
  const L = { x: 100, y: 20, w: 40, h: 40 };
  const asset = assetOf([{ id: 'L', name: 'L', rect: L }], [
    [clip('g', '__screen', 'fade', 8, { params: { fade: { direction: 'in' } } }), clip('l', 'L', 'fade', 8, { params: { fade: { direction: 'in' } } })],
    [clip('hold', '__screen', 'hold', 3)],
    [clip('out', '__screen', 'fade', 4, { easing: 'easeOut', params: { fade: { direction: 'out' } } })],
  ]);
  const r = compileTransitionDetailed(asset, busy);
  assert.deepEqual(r.errors, []);
  const plan = r.derived!.plan;
  const groupL = plan.groups.find(g => g.layerId === 'L')!;
  const groupRest = plan.groups.find(g => g.layerId === null)!;
  // expected level of each group at frame f, straight from the formulas of the module header
  const lvlGlobal = (f: number): number => (f < 8 ? (f + 1) / 8 : f < 11 ? 1 : 1 - easeRef('easeOut', (f - 11 + 1) / 4));
  const lvlLayer = (f: number): number => (f < 8 ? (f + 1) / 8 : 1);
  const endTick = (f: number) => r.frames[f + 1].tickStart + r.frames[f + 1].ticks;
  const wanted = new Map<number, number>();
  for (let f = 0; f < 15; f++) wanted.set(endTick(f), f);
  const dec = createFxDecoder(r.bytes, { page1: r.derived!.pixels });
  let checked = 0;
  while (!dec.done) {
    stepFxFrame(dec, false);
    const f = wanted.get(dec.tick);
    if (f === undefined || dec.done) continue;
    for (const [group, level] of [[groupL, lvlLayer(f)], [groupRest, 1]] as const) {
      for (let s = group.first; s < group.first + group.count; s++) {
        const expected: number[] = r.derived!.palette[s].map((c: number) => Math.round(c * level * lvlGlobal(f)));
        assert.deepEqual(dec.palette[s], expected, `slot ${s} (${group.id}) at frame ${f}`);
      }
    }
    checked++;
  }
  assert.equal(checked, 15);
  assert.deepEqual(dec.palette.slice(1).every(c => c.every(v => v === 0)), true, 'a fade-out ends on black');
  assert.ok(base.length === 16);
});
test('an effect that touches the same area twice is not left dirty: slide + reveal on two layers, final state = derived', () => {
  const asset = assetOf(
    [{ id: 'A', name: 'A', rect: { x: 10, y: 10, w: 50, h: 30 } }, { id: 'B', name: 'B', rect: { x: 100, y: 120, w: 70, h: 40 } }],
    [[clip('a', 'A', 'slide', 10, { easing: 'bounce', params: { direction: 'right' } }), clip('b', 'B', 'reveal', 6, { delayFrames: 3, params: { direction: 'up', slats: 5, stripSize: 3 } })], [clip('a2', 'B', 'fade', 4)]],
  );
  const r = compileTransitionDetailed(asset, busy);
  assert.deepEqual(r.errors, []);
  const dec = runDemo(r.bytes, r.derived!.pixels);
  assert.ok(sameRows(fxPageRows(dec, 0, 212), r.derived!.pixels));
  for (let t = 0; t < r.totalTicks; t += 2) {
    const s = runDemo(r.bytes, r.derived!.pixels, { skipAt: t });
    assert.ok(sameRows(fxPageRows(s, 0, 212), r.derived!.pixels), `skip at ${t}`);
  }
});

// ---------------------------------------------------------------------------
// 6. sound
// ---------------------------------------------------------------------------
console.log('Sound');
/** A black picture: the preparation group is empty (1 tick), so the tick of frame k is easy to know without the compiler. */
const blank: FxSourceImage = { width: 256, height: 212, pixels: Array.from({ length: 212 }, () => new Array(256).fill(0)), palette: Array.from({ length: 16 }, () => [0, 0, 0] as FxRgb) };
test('an SFX produces R#10 and the tone/mixer registers of the Sound Editor asset at the expected tick', () => {
  const asset = assetOf([], [[clip('h', '__screen', 'hold', 40, { sounds: [{ soundAssetId: SOUND_ID, at: 'start', offsetFrames: 3 }] })]]);
  const r = compileTransitionDetailed(asset, blank, { sounds: SOUNDS });
  assert.deepEqual(r.errors, []);
  assert.equal(r.frames[0].ticks, 1, 'blank picture: 1 tick of preparation');
  const dec = createFxDecoder(r.bytes);
  // what the Sound Editor asset says (channel A is remapped to C): frames = round(ms * 60 / 1000), volume, envelope flag
  const steps = sound.channels[0].steps.map(s => ({ frames: Math.round(s.durationMs * 60 / 1000), r10: s.useEnvelope ? 0x10 : s.volume, tone: s.tonePeriod }));
  assert.deepEqual(steps.map(s => s.frames), [8, 10, 6]);
  const startTick = 1 + 3; // preparation (1 tick) + 3 frames of offset: the SFX op runs when 4 ticks have elapsed
  const r10: number[] = [0];
  while (!dec.done) { stepFxFrame(dec, false); r10[dec.tick] = dec.psgRegs[10]; assert.ok(dec.tick < 100); }
  // msx2PsgOneShot.ts: _start loads record 1; every _tick decrements the timer and loads the next record when it hits 0.
  // After n ticks since the SFX op, the active record is the number of records whose cumulative length is <= n.
  const cumulative: number[] = [];
  steps.reduce((sum, s) => { cumulative.push(sum + s.frames); return sum + s.frames; }, 0);
  assert.deepEqual(cumulative, [8, 18, 24]);
  for (let t = 1; t <= 40; t++) {
    const n = t - startTick;
    const expected = n < 1 ? 0 : (steps[cumulative.filter(c => c <= n).length]?.r10 ?? 0);
    assert.equal(r10[t], expected, `R#10 after tick ${t} (${n} ticks since the SFX op)`);
  }
  assert.deepEqual([r10[startTick], r10[startTick + 1], r10[startTick + 7], r10[startTick + 8], r10[startTick + 18], r10[startTick + 24]], [0, 8, 8, 15, 0x10, 0]);
  assert.equal(dec.sfxLog[0].tick, startTick);
  const regsAtStep1 = dec.psgLog.filter(e => e.tick === startTick);
  assert.deepEqual(regsAtStep1.map(e => e.reg), [4, 5, 6, 10, 11, 12, 13, 7], 'the Z80 order of writes');
  assert.equal(regsAtStep1.find(e => e.reg === 4)!.value, 257 & 0xff);
  assert.equal(regsAtStep1.find(e => e.reg === 5)!.value, 257 >> 8);
  assert.equal(regsAtStep1.find(e => e.reg === 6)!.value, sound.noisePeriod);
  assert.equal(regsAtStep1.find(e => e.reg === 7)!.value, 0x3f & ~0x20, 'noise on, tone off');
  assert.equal(dec.psgShadowR7C, 0x24);
});
test('a second sound cutting the first one is reported; a missing sound is skipped with a warning', () => {
  const clipWith = clip('h', '__screen', 'hold', 12, { sounds: [{ soundAssetId: SOUND_ID, at: 'start' }, { soundAssetId: SOUND_ID, at: 'end' }] });
  const r = compileTransitionDetailed(assetOf([], [[clipWith]]), blank, { sounds: SOUNDS });
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some(w => /corta a/.test(w)), r.warnings.join('|'));
  const missing = compileTransitionDetailed(assetOf([], [[clip('h', '__screen', 'hold', 5, { sounds: [{ soundAssetId: 'nope', at: 'start' }] })]]), blank, { sounds: SOUNDS });
  assert.deepEqual(missing.errors, []);
  assert.ok(missing.warnings.some(w => /no existe/.test(w)));
  assert.equal(missing.soundEvents.length, 0);
  assert.ok(!missing.mainOps.some(op => op.op === 'SFX'));
});
test('PSG sequencer port matches the Z80 routine: register order parsed from buildPsgOneShotAsm, records from compilePsgOneShot', () => {
  const asm = buildPsgOneShotAsm('t', 'data');
  const loadStep = asm.slice(asm.indexOf('t_load_step:'), asm.indexOf('t_stop:'));
  const order = [...loadStep.matchAll(/ld a, (\d+)\s+out \(#A0\), a/g)].map(m => Number(m[1]));
  assert.deepEqual(order, [4, 5, 6, 10, 11, 12, 13, 7]);
  const stopSrc = asm.slice(asm.indexOf('t_stop:'));
  assert.match(stopSrc, /ld a, 10\s+out \(#A0\), a\s+xor a\s+out \(#A1\), a/);
  assert.match(stopSrc, /ld a, #24/);
  const seq = createPsgOneShotSequencer();
  const compiled = compilePsgOneShotRecords(sound)!;
  assert.deepEqual(seq.start(compiled.records).map(w => w.reg), order);
  assert.equal(seq.active, true);
  assert.equal(seq.timer, compiled.records[0][0]);
  const seen: string[] = [];
  for (let i = 0; i < 40; i++) { const w = seq.tick(); if (w.length) seen.push(`${i + 1}:${w.length}`); }
  assert.deepEqual(seen, ['8:8', '18:8', '24:1'], 'next record after 8 / 10 ticks, then the stop');
  assert.equal(seq.active, false);
  assert.equal(seq.shadowR7C, 0x24);
  // the records are exactly the DB rows of the ASM data block (the refactor contract)
  const data = compilePsgOneShot(sound, 'lbl')!.dataAsm;
  const rows = [...data.matchAll(/DB ((?:#[0-9A-F]{2},?)+)/g)].map(m => m[1].split(',').map(h => parseInt(h.slice(1), 16)));
  assert.deepEqual(rows.slice(0, -1), compiled.records);
  assert.deepEqual(rows[rows.length - 1], [0]);
  // _start_hl: opt-in, no bytes, ASM unchanged by default
  const withLabel = buildPsgOneShotAsm('t', 'data', { exportStartHl: true });
  assert.ok(!asm.includes('t_start_hl'));
  assert.match(withLabel, /ld hl, data\s+t_start_hl:\s+ld \(t_ptr\), hl/);
  assert.equal(withLabel.replace('t_start_hl:\n', ''), asm);
});

// ---------------------------------------------------------------------------
// 7. validation and limits
// ---------------------------------------------------------------------------
console.log('Validation');
const errorsOf = (asset: Msx2TransitionAsset, ctx = {}) => validateTransitionAsset(asset, ctx).errors.join(' | ');
test('layers: odd x/w, outside the picture, overlapping, duplicate ids', () => {
  const L = (id: string, x: number, y: number, w: number, h: number) => ({ id, name: id, rect: { x, y, w, h } });
  assert.match(errorsOf(assetOf([L('a', 3, 0, 10, 10)], [])), /impares/);
  assert.match(errorsOf(assetOf([L('a', 0, 0, 11, 10)], [])), /impares/);
  assert.match(errorsOf(assetOf([L('a', 250, 0, 10, 10)], [])), /se sale/);
  assert.match(errorsOf(assetOf([L('a', 0, 205, 10, 10)], [])), /se sale/);
  assert.match(errorsOf(assetOf([L('a', 0, 0, 20, 20), L('b', 10, 10, 20, 20)], [])), /se solapan/);
  assert.match(errorsOf(assetOf([L('a', 0, 0, 20, 20), L('a', 40, 0, 20, 20)], [])), /mismo id/);
  assert.equal(errorsOf(assetOf([L('a', 0, 0, 20, 20), L('b', 20, 0, 20, 20)], [])), '', 'touching is fine');
});
test('clips: unknown target/effect, reveal on the screen, two geometry clips on a layer, overlapping fades, >2 sounds, bad offset', () => {
  const lay = [{ id: 'L', name: 'Logo', rect: { x: 0, y: 0, w: 20, h: 20 } }];
  assert.match(errorsOf(assetOf(lay, [[clip('c', 'zz', 'slide', 5)]])), /no existe/);
  assert.match(errorsOf(assetOf(lay, [[clip('c', 'zz', 'fade', 5)]])), /no existe/);
  assert.match(errorsOf(assetOf(lay, [[clip('c', '__screen', 'reveal', 5)]])), /necesita una capa/);
  assert.match(errorsOf(assetOf(lay, [[clip('c', 'L', 'slide', 5), clip('d', 'L', 'reveal', 5)]])), /solo se admite uno/);
  assert.match(errorsOf(assetOf(lay, [[clip('c', 'L', 'fade', 5), clip('d', 'L', 'fade', 5, { delayFrames: 2 })]])), /se solapan en el tiempo/);
  assert.equal(errorsOf(assetOf(lay, [[clip('c', 'L', 'fade', 5)], [clip('d', 'L', 'fade', 5)]])), '', 'sequential fades are fine');
  const s = { soundAssetId: 's', at: 'start' as const };
  assert.match(errorsOf(assetOf(lay, [[clip('c', 'L', 'slide', 5, { sounds: [s, s, s] })]])), /más de 2 sonidos/);
  assert.match(errorsOf(assetOf(lay, [[clip('c', 'L', 'slide', 5, { sounds: [{ ...s, offsetFrames: 61 }] })]])), /entre -60 y 60/);
  assert.match(errorsOf(assetOf(lay, [[clip('c', 'L', 'slide', 0)]])), /duración/);
  assert.match(errorsOf(assetOf(lay, [[clip('c', 'L', 'slide', 5), clip('c', 'L', 'fade', 5)]])), /mismo id/);
  assert.match(errorsOf({ ...assetOf([], []), version: 2 as any }), /versión/);
});
test('warnings: slide over another animated layer, empty-black fade layer, missing steps', () => {
  const lay = [{ id: 'A', name: 'Uno', rect: { x: 10, y: 10, w: 30, h: 30 } }, { id: 'B', name: 'Dos', rect: { x: 10, y: 80, w: 30, h: 30 } }];
  const w = validateTransitionAsset(assetOf(lay, [[clip('c', 'A', 'slide', 8, { params: { direction: 'up', distance: 100 } }), clip('d', 'B', 'reveal', 8)]])).warnings.join('|');
  assert.match(w, /pasa por encima de «Dos»/);
  assert.match(validateTransitionAsset(assetOf([], [])).warnings.join('|'), /no tiene pasos/);
  const onBlack = validateTransitionAsset(assetOf([{ id: 'Z', name: 'Vacia', rect: { x: 0, y: 0, w: 8, h: 8 } }], [[clip('f', 'Z', 'fade', 4)]]), { image: blank });
  assert.match(onBlack.warnings.join('|'), /solo contiene negro/);
});
test('compileTransition throws with the Spanish messages; a huge flow reports it does not fit the bank', () => {
  assert.throws(() => compileTransition(assetOf([{ id: 'a', name: 'a', rect: { x: 0, y: 0, w: 20, h: 20 } }], [[clip('c', 'zz', 'slide', 5)]]), busy), /No se puede compilar la transición[\s\S]*no existe/);
  const layers6 = Array.from({ length: 6 }, (_u, k) => ({ id: `F${k}`, name: `F${k}`, rect: { x: 40 * k, y: 100, w: 38, h: 20 } }));
  const huge = assetOf(layers6, [layers6.map(l => clip(`c_${l.id}`, l.id, 'slide', 200, { params: { direction: 'down', distance: 200 } }))]);
  const r = compileTransitionDetailed(huge, busy);
  assert.ok(r.errors.some(e => /no cabe en el banco/.test(e)), r.errors.join('|') || `size ${r.bytes.length}`);
  assert.equal(r.bytes.length, 0);
});
test('timeline: steps run end to end, clips of a step start together plus their delay', () => {
  const lay = [{ id: 'L', name: 'L', rect: { x: 0, y: 0, w: 10, h: 10 } }];
  const tl = resolveTimeline(assetOf(lay, [
    [clip('A', 'L', 'fade', 5, { delayFrames: 2 }), clip('B', '__screen', 'hold', 3)],
    [clip('C', 'L', 'fade', 4, { delayFrames: 1 })],
    [],
    [clip('D', '__screen', 'hold', 0, { params: { waitForKey: true } })],
  ]));
  const at = Object.fromEntries(tl.clips.map(c => [c.clip.id, [c.start, c.end]]));
  assert.deepEqual(at, { A: [2, 7], B: [0, 3], C: [8, 12], D: [12, 12] });
  assert.deepEqual(tl.stepStarts, [0, 7, 12, 12]);
  assert.equal(tl.totalFrames, 12);
  const empty = compileTransitionDetailed(createDefaultTransitionAsset('p'), busy);
  assert.deepEqual(empty.errors, []);
  const dec = runDemo(empty.bytes, empty.derived!.pixels);
  assert.ok(sameRows(fxPageRows(dec, 0, 212), busy.pixels), 'no steps: the picture appears at once');
});

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.error(`FAILED: ${failures.join('; ')}`);
  process.exit(1);
}
void FX_OP;

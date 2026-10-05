// Contract tests for utils/msx2TransitionEditorUtils.ts (logic of the msx2transition editor and of the GameFlow
// "entry effect" selector) and for AYRegisterSynthesizer.pokeRegisters.
// Run: npx tsx scripts/test_msx2_transition_editor_utils.ts      (npm run test:msx2-transition-editor)
//
// Expectations come from sources that are NOT the code under test:
//  - the F1a design doc numbers (30 altered pixels, the logo bounding box x4..252 / y12..64);
//  - the MSX2 3-bit -> 8-bit conversion re-written here as round(v * 255 / 7);
//  - the ORIGINAL presentation pixels (RGB) read straight from the fixture;
//  - the Sound Editor asset (durations in ms -> 60 Hz frames) and the ASM register order of the PSG sequencer;
//  - a wall clock written as plain arithmetic (tick k lasts 1000/60 ms).
// A failing test exits with code 1. Verified red by sabotaging each function (see the report).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compileTransitionDetailed, createFxDecoder, createLogoDropPreset, deriveFxImage, normalizeTransitionAsset, planPaletteGroups,
  readFxSourceImage, runFxToEnd, soundsFromAssets, validateTransitionAsset,
  type FxSourceImage,
} from '../utils/msx2TransitionFx';
import {
  analyzeTransition, applyLayerDrag, backdropCss, buildTimelineModel, clearTransitionReferences, computeAlteredMask, createClip, createFxPlayer, createLayer,
  createStep, defaultLayerRect, describePaletteGroups, effectNeedsLayer, FX_PLAYER_MAX_CATCHUP, FX_TICK_MS, newTransitionId,
  DOUBLE_KEY_PRESS_WARNING, effectHasKeyWait, findKeyWaitConflicts, nodeWaitsForKey, stripTrailingKeyWait,
  normalizeClipDraft, overlappingLayerIds, presentationFxNodeIssues, previousNonMusicNode, rectFromCorners, removeLayerFromAsset,
  renderDecoderRgba, renderDiffRgba, renderIndexedRgba, shrinkRectToContent, snapLayerRect, soundPreviewSchedule,
  togglePinnedColor, transitionAssetsForPresentation, withClipEffect,
  type RectHandle,
} from '../utils/msx2TransitionEditorUtils';
import { compilePsgOneShotRecords } from '../utils/msxGenerator/generators/msx2/msx2PsgOneShot';
import { AYRegisterSynthesizer } from '../components/utils/ayRegisterSynthesizer';
import type {
  Msx2GameFlowConnection, Msx2GameFlowNode, Msx2GameFlowScreen5PresentationNode, Msx2TransitionAsset, ProjectAsset, PSGSoundData,
} from '../types';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-transition-fx', 'fixture_back_to_mars.json'), 'utf8'));
const sound: PSGSoundData = fixture.sound.data;
const SOUND_ID: string = fixture.sound.id;
const PRES_ID: string = fixture.presentation.id;

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

const image: FxSourceImage = readFxSourceImage(fixture.presentation);
const LOGO = { x: 4, y: 12, w: 250, h: 53 };
const ALIEN = { x: 68, y: 65, w: 104, h: 136 };
const demo = (): Msx2TransitionAsset => createLogoDropPreset({
  sourcePresentationAssetId: PRES_ID, logo: LOGO, alien: ALIEN, whooshSoundId: SOUND_ID, thudSoundId: SOUND_ID,
});
const assets: ProjectAsset[] = [fixture.presentation, fixture.sound];
const demoResult = compileTransitionDetailed(demo(), image, { sounds: soundsFromAssets(assets) });
assert.deepEqual(demoResult.errors, [], 'the demo must compile');

/** Deterministic pseudo random (mulberry32) so a failure is reproducible. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const msx8 = (v: number) => Math.round(v * 255 / 7); // 3-bit level -> 8-bit, the plain formula

// ---------------------------------------------------------------------------
console.log('Rectangles');
test('snapLayerRect: odd x / width snap outwards to even, inside 256x212, minimum 2x1', () => {
  assert.deepEqual(snapLayerRect({ x: 3, y: 5, w: 5, h: 7 }), { x: 2, y: 5, w: 6, h: 7 });
  assert.deepEqual(snapLayerRect({ x: -10, y: -3, w: 500, h: 500 }), { x: 0, y: 0, w: 256, h: 212 });
  assert.deepEqual(snapLayerRect({ x: 255, y: 211, w: 0, h: 0 }), { x: 254, y: 211, w: 2, h: 1 });
  assert.deepEqual(snapLayerRect(LOGO), LOGO, 'a valid rectangle is not touched');
});
test('applyLayerDrag move: keeps the size, slides against the borders, x stays even', () => {
  assert.deepEqual(applyLayerDrag(LOGO, 'move', 10, 0, 2), { x: 6, y: 12, w: 250, h: 53 }); // 4+10 would leave at 14 > 256-250
  assert.deepEqual(applyLayerDrag(LOGO, 'move', -50, -50, 2), { x: 0, y: 0, w: 250, h: 53 });
  assert.deepEqual(applyLayerDrag({ x: 10, y: 10, w: 20, h: 20 }, 'move', 5, 7, 8), { x: 16, y: 16, w: 20, h: 20 }); // 15 -> 16, 17 -> 16
  assert.deepEqual(applyLayerDrag({ x: 10, y: 10, w: 20, h: 20 }, 'move', 0, 0, 8), { x: 8, y: 8, w: 20, h: 20 }, 'edges snap to the grid even without moving');
});
test('applyLayerDrag resize: moving edges snap, clamp to the picture and keep at least 2x1', () => {
  const r = { x: 40, y: 40, w: 40, h: 40 };
  assert.deepEqual(applyLayerDrag(r, 'e', 13, 0, 4), { x: 40, y: 40, w: 52, h: 40 }); // right 80+13 -> 92
  assert.deepEqual(applyLayerDrag(r, 'w', -50, 0, 2), { x: 0, y: 40, w: 80, h: 40 }); // left clamped to 0
  assert.deepEqual(applyLayerDrag(r, 'se', 999, 999, 2), { x: 40, y: 40, w: 216, h: 172 }); // clamped to 256 / 212
  assert.deepEqual(applyLayerDrag(r, 'w', 200, 0, 2), { x: 78, y: 40, w: 2, h: 40 }, 'cannot cross the opposite edge');
  assert.deepEqual(applyLayerDrag(r, 'n', 0, 200, 2), { x: 40, y: 79, w: 40, h: 1 });
});
test('property: any drag leaves an even-x/even-w rectangle inside the picture that normalizeTransitionAsset keeps as it is', () => {
  const rand = rng(7);
  const handles: RectHandle[] = ['move', 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  for (let i = 0; i < 4000; i++) {
    const start = snapLayerRect({ x: Math.floor(rand() * 256), y: Math.floor(rand() * 212), w: 2 + Math.floor(rand() * 200), h: 1 + Math.floor(rand() * 150) });
    const mode = handles[Math.floor(rand() * handles.length)];
    const snap = [2, 4, 8, 16][Math.floor(rand() * 4)];
    const out = applyLayerDrag(start, mode, Math.round((rand() - 0.5) * 600), Math.round((rand() - 0.5) * 500), snap);
    assert.ok(out.x % 2 === 0 && out.w % 2 === 0, `${JSON.stringify(start)} ${mode} -> ${JSON.stringify(out)} must have even x and w`);
    assert.ok(out.x >= 0 && out.y >= 0 && out.w >= 2 && out.h >= 1 && out.x + out.w <= 256 && out.y + out.h <= 212, `${mode}: ${JSON.stringify(out)} must stay inside 256x212`);
    const norm = normalizeTransitionAsset({ layers: [{ id: 'a', name: 'a', rect: out }] }).layers[0].rect;
    assert.deepEqual(norm, out, 'the F1a normalizer must agree with the editor snapping');
  }
});
test('rectFromCorners: left edge floors to even, right edge ceils to even, any corner order; tiny or outside = null', () => {
  assert.deepEqual(rectFromCorners(5.3, 20.7, 13.2, 30.1), { x: 4, y: 20, w: 10, h: 11 });
  assert.deepEqual(rectFromCorners(13.2, 30.1, 5.3, 20.7), { x: 4, y: 20, w: 10, h: 11 });
  assert.equal(rectFromCorners(10, 10, 10, 50), null, 'zero width');
  assert.equal(rectFromCorners(10, 10, 40, 10), null, 'zero height');
  assert.equal(rectFromCorners(300, 5, 400, 50), null, 'entirely right of the picture');
  assert.deepEqual(rectFromCorners(-30, -30, 999, 999), { x: 0, y: 0, w: 256, h: 212 });
});
test('shrinkRectToContent finds the logo bounding box of the real picture (x4..252, y12..64 -> 4,12,250x53)', () => {
  assert.deepEqual(shrinkRectToContent(image, { x: 0, y: 0, w: 256, h: 65 }), { x: 4, y: 12, w: 250, h: 53 });
  // independent scan of the ORIGINAL rgb: first / last non-black pixel in those rows
  let x0 = 999; let x1 = -1; let y0 = 999; let y1 = -1;
  for (let y = 0; y < 65; y++) for (let x = 0; x < 256; x++) {
    const [r, g, b] = image.palette[image.pixels[y][x]];
    if (r + g + b === 0) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  assert.deepEqual([x0, x1, y0, y1], [4, 252, 12, 64], 'the document bounding box');
  assert.equal(shrinkRectToContent(image, { x: 0, y: 0, w: 256, h: 10 }), null, 'an all-black strip has no content');
});
test('overlappingLayerIds / defaultLayerRect / createLayer: new layers never overlap and ids are unique', () => {
  const layers = [{ id: 'layer_1', name: 'A', rect: { x: 0, y: 0, w: 100, h: 100 } }, { id: 'layer_2', name: 'B', rect: { x: 50, y: 50, w: 100, h: 100 } }, { id: 'layer_3', name: 'C', rect: { x: 200, y: 0, w: 20, h: 20 } }];
  assert.deepEqual(Array.from(overlappingLayerIds(layers)).sort(), ['layer_1', 'layer_2']);
  assert.equal(overlappingLayerIds([layers[0], { id: 'x', name: 'x', rect: { x: 100, y: 0, w: 10, h: 10 } }]).size, 0, 'touching edges do not overlap');
  const grown: typeof layers = [];
  for (let i = 0; i < 12; i++) grown.push(createLayer(grown));
  assert.equal(new Set(grown.map(l => l.id)).size, 12);
  assert.equal(overlappingLayerIds(grown).size, 0, 'the 12 auto-placed layers are disjoint');
  assert.deepEqual(defaultLayerRect([]), { x: 8, y: 8, w: 64, h: 32 });
  assert.equal(newTransitionId('layer', ['layer_1', 'layer_2', 'layer_4']), 'layer_3');
});

// ---------------------------------------------------------------------------
console.log('Defaults, clips and layer removal');
test('createClip gives each effect valid defaults and reveal/slide pick a layer', () => {
  const base = normalizeTransitionAsset({ layers: [{ id: 'lg', name: 'Logo', rect: LOGO }], steps: [] });
  const slide = createClip(base, 'slide');
  assert.equal(slide.target, 'lg');
  assert.equal(slide.params.direction, 'down');
  const fade = createClip(base, 'fade');
  assert.equal(fade.target, '__screen');
  assert.deepEqual(fade.params, { fade: { direction: 'in' } });
  const hold = createClip(base, 'hold');
  assert.equal(hold.durationFrames, 30);
  assert.equal(slide.id, 'clip_1');
  const asset: Msx2TransitionAsset = { ...base, steps: [{ id: 's1', name: 'P', clips: [slide, fade, hold].map((c, i) => ({ ...c, id: `c${i}` })) }] };
  assert.deepEqual(validateTransitionAsset(asset).errors, [], 'default clips are valid');
  assert.equal(createClip({ ...base, steps: [{ id: 's1', name: 'P', clips: [slide] }] }, 'fade').id, 'clip_2', 'a new clip never reuses an id');
  assert.equal(effectNeedsLayer('reveal') && effectNeedsLayer('slide') && !effectNeedsLayer('fade') && !effectNeedsLayer('hold'), true);
});
test('withClipEffect resets params of the old effect and moves the screen target to a layer for reveal/slide', () => {
  const layers = [{ id: 'lg', name: 'Logo', rect: LOGO }];
  const fade = { id: 'c', target: '__screen', effect: 'fade' as const, durationFrames: 20, delayFrames: 3, easing: 'bounce' as const, params: { fade: { direction: 'out' as const } }, sounds: [{ soundAssetId: 's', at: 'end' as const, offsetFrames: 4 }] };
  const toSlide = withClipEffect(fade, 'slide', layers);
  assert.equal(toSlide.effect, 'slide');
  assert.equal(toSlide.target, 'lg');
  assert.equal(toSlide.params.fade, undefined, 'fade params are gone');
  assert.equal(toSlide.params.direction, 'down');
  assert.equal(toSlide.durationFrames, 20);
  assert.equal(toSlide.delayFrames, 3);
  assert.equal(toSlide.easing, 'bounce', 'easing survives a change of effect');
  assert.deepEqual(toSlide.sounds, fade.sounds);
  assert.equal(withClipEffect(fade, 'slide', []).target, '__screen', 'no layer to move to: the validation will say so');
  // reveal and slide read `direction` differently (the area grows / the layer moves): changing the effect starts from the new default
  const reveal = { id: 'r', target: 'lg', effect: 'reveal' as const, durationFrames: 30, delayFrames: 0, easing: 'linear' as const, params: { direction: 'up' as const, stripSize: 8, slats: 4 } };
  const revealToSlide = withClipEffect(reveal, 'slide', layers);
  assert.deepEqual(revealToSlide.params, { direction: 'down' }, 'reveal params (strip size, slats, direction up) do not leak into the slide');
  assert.deepEqual(withClipEffect(revealToSlide, 'reveal', layers).params, { direction: 'down', stripSize: 2, slats: 1 });
  const waited = normalizeClipDraft({ ...fade, effect: 'hold', durationFrames: 0, params: {} });
  assert.equal(waited.durationFrames, 1, 'a hold without waitForKey lasts at least 1 frame');
  assert.equal(createStep(normalizeTransitionAsset({ steps: [{ id: 'step_1', clips: [] }] })).id, 'step_2');
});
test('removeLayerFromAsset drops the layer and the clips that targeted it, and counts them', () => {
  const asset = normalizeTransitionAsset({
    layers: [{ id: 'a', name: 'A', rect: { x: 0, y: 0, w: 10, h: 10 } }, { id: 'b', name: 'B', rect: { x: 20, y: 0, w: 10, h: 10 } }],
    steps: [{ id: 's1', clips: [{ id: 'c1', target: 'a', effect: 'fade', durationFrames: 5 }, { id: 'c2', target: 'b', effect: 'fade', durationFrames: 5 }] }, { id: 's2', clips: [{ id: 'c3', target: 'a', effect: 'slide', durationFrames: 9 }] }],
  });
  const out = removeLayerFromAsset(asset, 'a');
  assert.deepEqual(out.layers.map(l => l.id), ['b']);
  assert.deepEqual(out.steps.map(s => s.clips.map(c => c.id)), [['c2'], []]);
  assert.equal(out.removedClips, 2);
  assert.deepEqual(asset.layers.map(l => l.id), ['a', 'b'], 'the input asset is not mutated');
});
test('togglePinnedColor adds sorted colours, ignores duplicates and returns undefined when empty', () => {
  let asset = normalizeTransitionAsset({});
  asset = { ...asset, ...togglePinnedColor(asset, 10, true) };
  asset = { ...asset, ...togglePinnedColor(asset, 3, true) };
  asset = { ...asset, ...togglePinnedColor(asset, 10, true) };
  assert.deepEqual(asset.palettePlan, { pinnedColors: [3, 10] });
  asset = { ...asset, ...togglePinnedColor(asset, 3, false) };
  assert.deepEqual(asset.palettePlan, { pinnedColors: [10] });
  assert.equal(togglePinnedColor(asset, 10, false).palettePlan, undefined);
});

// ---------------------------------------------------------------------------
console.log('Palette difference view and rendering');
const demoNorm = normalizeTransitionAsset(demo());
const plan = planPaletteGroups(image, demoNorm);
const derived = deriveFxImage(image, demoNorm, plan);
test('computeAlteredMask marks exactly the 30 pixels of the document, inside the logo / alien boxes', () => {
  const mask = computeAlteredMask(image, derived);
  let count = 0;
  for (const m of mask) count += m;
  assert.equal(count, 30);
  // independent recount straight from the RGB of the original picture vs the derived one
  let recount = 0;
  for (let y = 0; y < 212; y++) for (let x = 0; x < 256; x++) {
    if (image.palette[image.pixels[y][x]].join() !== derived.palette[derived.pixels[y][x]].join()) { recount++; assert.equal(mask[y * 256 + x], 1); }
  }
  assert.equal(recount, 30);
  // the red eye of the alien (the 4 pixels of colours 6 and 8 at x140..142, y121..122, F0 data) turns into the neighbouring colour
  const eye = [[140, 121], [140, 122], [141, 122], [142, 122]].filter(([x, y]) => mask[y * 256 + x]).length;
  assert.equal(eye, 4);
  // no fade layers -> nothing is derived -> no altered pixels
  const identity = deriveFxImage(image, normalizeTransitionAsset({ layers: [], steps: [] }));
  assert.equal(computeAlteredMask(image, identity).reduce((a, b) => a + b, 0), 0);
});
test('describePaletteGroups reports the slot ranges of the plan and the per-group altered pixels', () => {
  const rows = describePaletteGroups(plan, demoNorm);
  // only the alien fades by itself, so there are two groups: the rest (which includes the sliding logo) and the alien
  assert.deepEqual(rows.map(r => r.name), ['Resto de la imagen', 'Alien']);
  assert.equal(rows[0].id, 'rest');
  assert.equal(rows[0].slots, `${plan.groups[0].first}-${plan.groups[0].first + plan.groups[0].count - 1}`);
  assert.equal(rows.reduce((s, r) => s + r.count, 0), 15, 'the groups own the 15 colour slots');
  assert.equal(rows.reduce((s, r) => s + r.altered, 0), 30);
  const identityRows = describePaletteGroups(planPaletteGroups(image, normalizeTransitionAsset({})), normalizeTransitionAsset({}));
  assert.equal(identityRows[0].name, 'Toda la imagen');
});
test('renderIndexedRgba converts 3-bit levels with round(v*255/7) and keeps alpha opaque', () => {
  const rgba = renderIndexedRgba(image.pixels, image.palette);
  for (const [x, y] of [[0, 0], [4, 12], [140, 121], [128, 100], [255, 211], [70, 70]]) {
    const o = (y * 256 + x) * 4;
    const rgb = image.palette[image.pixels[y][x]];
    assert.deepEqual(Array.from(rgba.slice(o, o + 4)), [msx8(rgb[0]), msx8(rgb[1]), msx8(rgb[2]), 255], `pixel ${x},${y}`);
  }
});
test('renderDiffRgba paints altered pixels magenta and dims the rest to half', () => {
  const mask = computeAlteredMask(image, derived);
  const plain = renderIndexedRgba(image.pixels, image.palette);
  const diff = renderDiffRgba(image, mask);
  let seen = 0;
  for (let i = 0; i < mask.length; i++) {
    const o = i * 4;
    if (mask[i]) { seen++; assert.deepEqual(Array.from(diff.slice(o, o + 3)), [255, 0, 255]); }
    else assert.deepEqual(Array.from(diff.slice(o, o + 3)), [plain[o] >> 1, plain[o + 1] >> 1, plain[o + 2] >> 1]);
  }
  assert.equal(seen, 30);
});
test('renderDecoderRgba shows the VISIBLE page through the palette registers (end state = derived picture)', () => {
  const dec = createFxDecoder(demoResult.bytes, { page1: derived.pixels });
  assert.ok(renderDecoderRgba(dec).every(v => v === 0 || v === 255) && renderDecoderRgba(dec).slice(0, 4).join() === '0,0,0,255', 'before the first op the screen is black');
  runFxToEnd(dec, { keyAtTick: () => true });
  const end = renderDecoderRgba(dec);
  const want = renderIndexedRgba(derived.pixels, derived.palette);
  assert.equal(end.length, want.length);
  for (let i = 0; i < want.length; i++) if (end[i] !== want[i]) assert.fail(`byte ${i}: ${end[i]} vs ${want[i]}`);
  assert.equal(backdropCss(dec), 'rgb(0,0,0)', 'R#7 = 0 and palette entry 0 is black');
  // changing the visible page must change what is shown: page 1 holds the derived picture, page 0 is the same at the end,
  // so point the monitor at an empty page and the screen must go black
  dec.visiblePage = 2;
  assert.ok(renderDecoderRgba(dec).every((v, i) => (i % 4 === 3 ? v === 255 : v === 0)), 'page 2 is empty = black');
});

// ---------------------------------------------------------------------------
console.log('Player (wall clock -> ticks) and sound');
const soundRecords = compilePsgOneShotRecords(sound)!.records;
const REG_ORDER = [4, 5, 6, 10, 11, 12, 13, 7]; // Z80 order of the sequencer (see msx2PsgOneShot.ts)
test('createFxPlayer runs one tick per 1000/60 ms of wall clock and never ahead of it', () => {
  const start = 5000;
  const player = createFxPlayer(demoResult.bytes, derived.pixels, start);
  assert.equal(player.advance(start + FX_TICK_MS - 0.5, false).steps.length, 0, 'tick 0 is not due yet');
  const first = player.advance(start + FX_TICK_MS + 0.5, false);
  assert.deepEqual(first.steps.map(s => s.tick), [0]);
  for (const ms of [100, 200, 300, 333.4, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500]) { // hops of at most 8 ticks
    player.advance(start + ms, false);
    assert.equal(player.dec.tick, Math.floor(ms / FX_TICK_MS), `after ${ms} ms`);
  }
});
test('the whoosh / thud writes come out at the tick the compiler computed, in the Z80 register order', () => {
  const player = createFxPlayer(demoResult.bytes, derived.pixels, 0);
  const sfxTicks: number[] = [];
  const firstWrites: Array<{ tick: number; regs: number[]; vals: number[] }> = [];
  for (let t = 1; t <= demoResult.totalTicks + 5 && !player.dec.done; t++) {
    const adv = player.advance(t * FX_TICK_MS + 0.01, false);
    for (const s of adv.steps) {
      if (s.sfxIds.length) sfxTicks.push(s.tick);
      if (s.sfxIds.length) firstWrites.push({ tick: s.tick, regs: s.psgWrites.slice(0, 8).map(w => w.reg), vals: s.psgWrites.slice(0, 8).map(w => w.value) });
    }
  }
  assert.deepEqual(sfxTicks, demoResult.soundEvents.map(e => e.tick), 'SFX ticks = the compiler soundEvents');
  assert.deepEqual(sfxTicks, [34, 96], 'whoosh at the start of the drop (logical frame 32 + 2 preparation ticks), thud on the last frame');
  for (const w of firstWrites) {
    assert.deepEqual(w.regs, REG_ORDER);
    assert.deepEqual(w.vals, [soundRecords[0][1], soundRecords[0][2], soundRecords[0][3], soundRecords[0][4], soundRecords[0][5], soundRecords[0][6], soundRecords[0][7], soundRecords[0][8]]);
  }
});
test('sound writes are delivered tick by tick even when the host calls late (several ticks in one advance)', () => {
  const player = createFxPlayer(demoResult.bytes, derived.pixels, 0);
  const adv = player.advance(60 * FX_TICK_MS + 1, false); // 60 ticks due in one call: capped at FX_PLAYER_MAX_CATCHUP
  assert.equal(adv.steps.length, FX_PLAYER_MAX_CATCHUP);
  assert.ok(adv.dropped > 0, 'the rest is reported as dropped, not run all at once');
  assert.deepEqual(adv.steps.map(s => s.tick), Array.from({ length: FX_PLAYER_MAX_CATCHUP }, (_u, i) => i));
  const next = player.advance(60 * FX_TICK_MS + 1, false);
  assert.equal(next.steps.length, 0, 'after re-syncing the clock nothing is owed');
  assert.equal(player.dec.tick, FX_PLAYER_MAX_CATCHUP);
});
test('a key press while a skippable effect runs ends it in the final state; without a press it waits for the key', () => {
  const want = renderIndexedRgba(derived.pixels, derived.palette);
  const run = (pressAtMs: number | null) => {
    const player = createFxPlayer(demoResult.bytes, derived.pixels, 0);
    for (let t = 1; t < 600 && !player.dec.done; t++) {
      const now = t * FX_TICK_MS + 0.01;
      player.advance(now, pressAtMs !== null && now >= pressAtMs && now < pressAtMs + 3 * FX_TICK_MS);
    }
    return player.dec;
  };
  const waiting = run(null);
  assert.equal(waiting.done, false, 'the last step waits for a key and 10 s of wall clock do not end it');
  assert.equal(waiting.waitKeyPhase >= 0, true);
  const pressed = run(400); // during the alien fade
  assert.equal(pressed.done, true);
  assert.equal(pressed.skipped, true);
  assert.ok(pressed.tick < demoResult.totalTicks / 2, `skipping is much faster than playing everything (${pressed.tick} of ${demoResult.totalTicks} ticks)`);
  assert.deepEqual(Array.from(renderDecoderRgba(pressed)), Array.from(want), 'the skip lands on the same picture as playing it all');
});
test('soundPreviewSchedule length = 1 + the sum of the record durations (frames) of the Sound Editor asset', () => {
  const schedule = soundPreviewSchedule(soundRecords);
  const framesFromAsset = sound.channels.find(c => c.steps?.length)!.steps.reduce((s, st) => s + Math.max(1, Math.round((st.durationMs ?? 100) * 60 / 1000)), 0);
  assert.equal(framesFromAsset, 8 + 10 + 6, '130 + 160 + 100 ms at 60 Hz');
  assert.equal(schedule.length, 1 + framesFromAsset);
  assert.deepEqual(schedule[0].map(w => w.reg), REG_ORDER, 'the first tick loads the first record');
  assert.deepEqual(schedule[schedule.length - 1], [{ reg: 10, value: 0 }], 'the last tick silences channel C');
});

// ---------------------------------------------------------------------------
console.log('Timeline model');
test('buildTimelineModel: bars on the real tick axis, sounds with their real duration, costs per frame', () => {
  const model = buildTimelineModel(normalizeTransitionAsset(demo()), demoResult);
  assert.equal(model.totalTicks, demoResult.totalTicks);
  assert.equal(model.blockBytes, demoResult.bytes.length);
  const alien = model.clips.find(c => c.clipId === 'clip_alien_fade')!;
  const logo = model.clips.find(c => c.clipId === 'clip_logo_drop')!;
  const wait = model.clips.find(c => c.clipId === 'clip_wait')!;
  assert.equal(alien.startTick, 2, 'the 2-tick preparation group goes first (measured by the compiler: static picture 32 ms)');
  assert.equal(alien.endTick, 34, '32 fade frames of 1 tick');
  assert.equal(logo.startTick, alien.endTick, 'the next step starts when the longest clip ends');
  assert.ok(logo.endTick - logo.startTick > 40, 'the drop lasts MORE than its 40 logical frames: every frame is stretched to 2 ticks when it does not fit');
  assert.equal(wait.waitsForKey, true);
  assert.equal(model.sounds.length, 2);
  assert.equal(model.sounds[0].startTick, logo.startTick, 'the whoosh starts with the drop');
  assert.equal(model.sounds[0].endTick - model.sounds[0].startTick, 24, 'the xof sound lasts 24 frames');
  assert.ok(model.stretchedFrames > 0 && model.peakLoad > 1, 'the slide frames are heavier than 1/60 s');
  assert.equal(model.costs[0].frame, -1);
});

// ---------------------------------------------------------------------------
console.log('GameFlow: entry effect of a Screen5Presentation node');
const fxAsset: ProjectAsset = { id: 'fx1', name: 'Entrada', type: 'msx2transition', data: demo() };
const presNode = (extra: Partial<Msx2GameFlowScreen5PresentationNode> = {}): Msx2GameFlowScreen5PresentationNode => ({
  id: 'n_pres', type: 'Screen5Presentation', position: { x: 0, y: 0 }, presentationAssetId: PRES_ID, fxAssetId: 'fx1', ...extra,
} as Msx2GameFlowScreen5PresentationNode);
const link = (a: string, b: string): Msx2GameFlowConnection => ({ id: `${a}_${b}`, from: { nodeId: a }, to: { nodeId: b } });
const allAssets = [...assets, fxAsset];
test('no fxAssetId = no issues; a missing effect asset is an error that does not crash', () => {
  const none = presentationFxNodeIssues(presNode({ fxAssetId: undefined }), [presNode()], [], allAssets, true);
  assert.deepEqual(none, { errors: [], warnings: [] });
  const gone = presentationFxNodeIssues(presNode({ fxAssetId: 'deleted' }), [presNode()], [], allAssets, true);
  assert.equal(gone.errors.length, 1);
  assert.match(gone.errors[0], /ya no existe/);
});
test('a clean node reports a summary and no errors; the walker / strict backend only warns', () => {
  const ok = presentationFxNodeIssues(presNode(), [presNode()], [], allAssets, true, true);
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.summary!.layers, 2);
  assert.equal(ok.summary!.steps, 3);
  assert.equal(ok.summary!.durationFrames, 32 + 40);
  assert.equal(ok.summary!.blockBytes, demoResult.bytes.length);
  assert.equal(ok.summary!.totalTicks, demoResult.totalTicks);
  const walker = presentationFxNodeIssues(presNode(), [presNode()], [], allAssets, false);
  assert.deepEqual(walker.errors, []);
  assert.ok(walker.warnings.some(w => /estática/.test(w)), 'bitmap-room only');
});
test('an effect made on another picture is an error; so is a node without picture', () => {
  const other = presentationFxNodeIssues(presNode({ presentationAssetId: 'other_pres' }), [presNode()], [], [...allAssets, { id: 'other_pres', name: 'Otra', type: 'msx2presentation', data: fixture.presentation.data }], true);
  assert.ok(other.errors.some(e => /otra imagen/.test(e)), other.errors.join('|'));
  const none = presentationFxNodeIssues(presNode({ presentationAssetId: undefined }), [presNode()], [], allAssets, true);
  assert.ok(none.errors.some(e => /no tiene presentación/.test(e)));
});
test('a palette fade-in / out-in / crossfade before the node is an error (through Music nodes too); other effects are fine', () => {
  const node = presNode();
  const music = { id: 'n_music', type: 'Music' } as Msx2GameFlowNode;
  const tr = (effect: string) => ({ id: 'n_tr', type: 'Transition', effect } as unknown as Msx2GameFlowNode);
  const issuesFor = (effect: string, viaMusic: boolean) => {
    const nodes = viaMusic ? [tr(effect), music, node] : [tr(effect), node];
    const conns = viaMusic ? [link('n_tr', 'n_music'), link('n_music', 'n_pres')] : [link('n_tr', 'n_pres')];
    return presentationFxNodeIssues(node, nodes, conns, allAssets, true).errors.filter(e => /transición anterior/.test(e));
  };
  for (const effect of ['palette_fade_in', 'palette_fade_out_in', 'palette_crossfade']) {
    assert.equal(issuesFor(effect, false).length, 1, effect);
    assert.equal(issuesFor(effect, true).length, 1, `${effect} through Music`);
  }
  for (const effect of ['palette_fade_out', 'screen5_wipe', 'cls', 'palette_flash']) assert.equal(issuesFor(effect, false).length, 0, effect);
  assert.equal(previousNonMusicNode('n_pres', [node], []), null);
  const cycle = [link('a', 'b'), link('b', 'a')];
  assert.equal(previousNonMusicNode('a', [{ id: 'a', type: 'Music' }, { id: 'b', type: 'Music' }] as Msx2GameFlowNode[], cycle), null, 'a Music cycle terminates');
});
test('errors of the effect itself (overlapping layers) reach the node; the lightweight check validates, the deep one compiles', () => {
  const bad = { ...demo(), layers: demo().layers.map(l => ({ ...l, rect: { ...ALIEN } })) };
  const issues = presentationFxNodeIssues(presNode(), [presNode()], [], [...assets, { ...fxAsset, data: bad }], true);
  assert.ok(issues.errors.some(e => /se solapan/.test(e)), issues.errors.join('|'));
  const light = presentationFxNodeIssues(presNode(), [presNode()], [], allAssets, true, false);
  assert.equal(light.summary!.blockBytes, undefined, 'the cheap check does not compile');
});
test('transitionAssetsForPresentation lists the effects of that picture plus the one already selected', () => {
  const other: ProjectAsset = { id: 'fx2', name: 'Otra', type: 'msx2transition', data: { ...demo(), sourcePresentationAssetId: 'zzz' } };
  assert.deepEqual(transitionAssetsForPresentation([fxAsset, other], PRES_ID).map(e => e.asset.id), ['fx1']);
  assert.deepEqual(transitionAssetsForPresentation([fxAsset, other], PRES_ID, 'fx2').map(e => `${e.asset.id}:${e.matches}`), ['fx1:true', 'fx2:false']);
});
test('clearTransitionReferences: deleting an effect asset clears fxAssetId of the nodes that used it, nothing else', () => {
  const flowAsset = (id: string, nodes: unknown[]): ProjectAsset => ({ id, name: id, type: 'msx2gameflow', data: { id, nodes, connections: [], startNodeId: 'a' } as never });
  const flowA = flowAsset('flowA', [
    { id: 'a', type: 'Start' },
    { id: 'p1', type: 'Screen5Presentation', presentationAssetId: PRES_ID, fxAssetId: 'fx1', waitForKey: true },
    { id: 'p2', type: 'Screen5Presentation', presentationAssetId: PRES_ID, fxAssetId: 'fx_other' },
  ]);
  const flowB = flowAsset('flowB', [{ id: 'b', type: 'Start' }, { id: 'p3', type: 'Screen5Presentation', presentationAssetId: PRES_ID }]);
  const rest = [fixture.presentation, fixture.sound, fxAsset];
  const out = clearTransitionReferences([...rest, flowA, flowB], 'fx1');
  const nodesOf = (a: ProjectAsset) => (a.data as unknown as { nodes: Array<Record<string, unknown>> }).nodes;
  const flowAOut = out.find(a => a.id === 'flowA')!;
  assert.equal('fxAssetId' in nodesOf(flowAOut).find(n => n.id === 'p1')!, false, 'the reference is removed, not set to undefined');
  assert.equal(nodesOf(flowAOut).find(n => n.id === 'p1')!.waitForKey, true, 'other node fields survive');
  assert.equal(nodesOf(flowAOut).find(n => n.id === 'p2')!.fxAssetId, 'fx_other', 'a node that uses another effect is untouched');
  assert.equal(out.find(a => a.id === 'flowB'), flowB, 'a flow without references keeps its identity');
  assert.equal(out[0], rest[0], 'non-flow assets keep their identity');
  assert.equal(nodesOf(flowA).find(n => n.id === 'p1')!.fxAssetId, 'fx1', 'the input flow is not mutated');
});
test('analyzeTransition: a deleted presentation / sound is reported, never thrown', () => {
  const noPres = analyzeTransition(demo(), [fixture.sound]);
  assert.equal(noPres.result, null);
  assert.match(noPres.sourceError!, /ya no existe/);
  const noSound = analyzeTransition(demo(), [fixture.presentation]);
  assert.equal(noSound.sourceError, null);
  assert.ok(noSound.result && noSound.result.errors.length === 0);
  assert.ok(noSound.result!.warnings.some(w => /no existe: se omite/.test(w)), 'the missing sound is a warning, the effect still compiles');
  assert.equal(noSound.result!.soundEvents.length, 0);
  const empty = analyzeTransition({ ...demo(), sourcePresentationAssetId: '' }, assets);
  assert.match(empty.sourceError!, /Elige la presentación/);
});

// ---------------------------------------------------------------------------
console.log('Key waits: the effect and the Screen5Presentation node must not both wait');
// A Screen5Presentation node waits for a key AFTER the effect (F2 note): an effect that also ends in a key-wait hold,
// or a player that skips with SPACE, would need two presses. Expectations are written from that rule, not from the code.
const waitingNode = (extra: Partial<Msx2GameFlowScreen5PresentationNode> = {}) => presNode({ waitForKey: true, ...extra });
const demoWithWait = fxAsset; // F1a preset: ends with a hold + waitForKey
const demoNoWait: ProjectAsset = { ...fxAsset, id: 'fx_nowait', data: { ...demo(), steps: stripTrailingKeyWait(demo().steps) } };
test('stripTrailingKeyWait drops only a trailing step made of key-wait holds', () => {
  const steps = demo().steps;
  assert.deepEqual(steps.map(s => s.id), ['step_alien', 'step_logo', 'step_wait'], 'F1a preset: alien fade, logo drop, wait');
  assert.deepEqual(stripTrailingKeyWait(steps).map(s => s.id), ['step_alien', 'step_logo']);
  assert.equal(stripTrailingKeyWait(stripTrailingKeyWait(steps)).length, 2, 'idempotent: nothing else is a key wait');
  const timedHold = { id: 'h', name: 'h', clips: [{ id: 'hc', target: '__screen', effect: 'hold' as const, durationFrames: 30, delayFrames: 0, easing: 'linear' as const, params: {} }] };
  assert.deepEqual(stripTrailingKeyWait([...steps.slice(0, 2), timedHold]).map(s => s.id), ['step_alien', 'step_logo', 'h'], 'a hold without waitForKey is a plain pause: kept');
  const mixed = { id: 'm', name: 'm', clips: [timedHold.clips[0], steps[2].clips[0]] };
  assert.equal(stripTrailingKeyWait([...steps.slice(0, 2), mixed]).length, 3, 'a step that also holds a timed clip is not a pure key wait: kept');
  const middle = [steps[2], steps[0], steps[1]];
  assert.equal(stripTrailingKeyWait(middle).length, 3, 'a key wait in the middle is never touched');
  assert.deepEqual(stripTrailingKeyWait([]), []);
});
test('the preset without the trailing wait compiles without WAITKEY; with it, exactly one', () => {
  const sounds = { sounds: soundsFromAssets(assets) };
  const withWait = compileTransitionDetailed(demo(), image, sounds);
  const without = compileTransitionDetailed({ ...demo(), steps: stripTrailingKeyWait(demo().steps) }, image, sounds);
  assert.deepEqual(without.errors, []);
  assert.equal(withWait.mainOps.filter(op => op.op === 'WAITKEY').length, 1);
  assert.equal(without.mainOps.filter(op => op.op === 'WAITKEY').length, 0);
  assert.equal(effectHasKeyWait(demo()), true);
  assert.equal(effectHasKeyWait({ steps: stripTrailingKeyWait(demo().steps) }), false);
  // and the effect without the wait still ends by itself: END is reached with no key presses at all
  const dec = createFxDecoder(without.bytes, { page1: without.derived!.pixels });
  runFxToEnd(dec);
  assert.equal(dec.done, true);
});
test('nodeWaitsForKey mirrors the generator: node flag, else the presentation runtime flag, default true', () => {
  const presWith = (runtime: unknown): ProjectAsset => ({ id: 'p', name: 'p', type: 'msx2presentation', data: { ...fixture.presentation.data, runtime } as never });
  assert.equal(nodeWaitsForKey({ waitForKey: true, presentationAssetId: 'p' }, [presWith({ waitForKey: false })]), true, 'the node flag wins');
  assert.equal(nodeWaitsForKey({ waitForKey: false, presentationAssetId: 'p' }, [presWith({ waitForKey: true })]), false);
  assert.equal(nodeWaitsForKey({ presentationAssetId: 'p' }, [presWith({ waitForKey: false })]), false, 'no node flag: the presentation decides');
  assert.equal(nodeWaitsForKey({ presentationAssetId: 'p' }, [presWith({ waitForKey: true })]), true);
  assert.equal(nodeWaitsForKey({ presentationAssetId: 'p' }, [presWith(undefined)]), true, 'default: wait');
  assert.equal(nodeWaitsForKey({ presentationAssetId: 'missing' }, []), true);
});
test('presentationFxNodeIssues warns about two key presses (first in the list) only when both wait on the bitmap-room backend', () => {
  const issues = (node: Msx2GameFlowScreen5PresentationNode, fx: ProjectAsset, bitmap = true, extraAssets: ProjectAsset[] = []) =>
    presentationFxNodeIssues({ ...node, fxAssetId: fx.id }, [node], [], [...assets, fx, ...extraAssets], bitmap);
  const both = issues(waitingNode(), demoWithWait);
  assert.equal(both.warnings[0], DOUBLE_KEY_PRESS_WARNING);
  assert.match(DOUBLE_KEY_PRESS_WARNING, /dos pulsaciones/);
  assert.deepEqual(both.errors, [], 'a warning, not an error: it still exports');
  assert.ok(!issues(waitingNode({ waitForKey: false }), demoWithWait).warnings.includes(DOUBLE_KEY_PRESS_WARNING), 'the node does not wait');
  assert.ok(!issues(waitingNode(), demoNoWait).warnings.includes(DOUBLE_KEY_PRESS_WARNING), 'the effect does not wait');
  assert.ok(!issues(waitingNode(), demoWithWait, false).warnings.includes(DOUBLE_KEY_PRESS_WARNING), 'walker / strict backend: the effect is not played, nothing to double');
  const runtimeNoWait: ProjectAsset = { ...fixture.presentation, data: { ...fixture.presentation.data, runtime: { waitForKey: false } } };
  const fromRuntime = presentationFxNodeIssues({ ...presNode(), waitForKey: undefined, fxAssetId: 'fx1' }, [], [], [runtimeNoWait, fixture.sound, demoWithWait], true);
  assert.ok(!fromRuntime.warnings.includes(DOUBLE_KEY_PRESS_WARNING), 'node flag unset and the presentation does not wait');
});
test('findKeyWaitConflicts lists the bitmap-room nodes that use the effect and wait for a key', () => {
  const node = (id: string, extra: Record<string, unknown> = {}) => ({ id, type: 'Screen5Presentation', presentationAssetId: PRES_ID, fxAssetId: 'fx1', waitForKey: true, ...extra });
  const flow = (id: string, name: string, purpose: string, nodes: unknown[]): ProjectAsset => ({ id, name, type: 'msx2gameflow', data: { id, purpose, nodes, connections: [] } as never });
  const room: ProjectAsset = { id: 'room', name: 'room', type: 'msx2bitmaproom', data: {} as never };
  const all = [fixture.presentation, fixture.sound, fxAsset, room,
    flow('f1', 'Flow juego', 'screen5', [node('n_wait'), node('n_nowait', { waitForKey: false }), node('n_other', { fxAssetId: 'fx_other' })]),
    flow('f2', 'Flow estricto', 'screen5-presentation', [node('s_wait')])];
  assert.deepEqual(findKeyWaitConflicts('fx1', demo(), all), [{ flowName: 'Flow juego', nodeId: 'n_wait' }]);
  assert.deepEqual(findKeyWaitConflicts('fx1', { steps: stripTrailingKeyWait(demo().steps) }, all), [], 'the effect does not wait');
  assert.deepEqual(findKeyWaitConflicts('', demo(), all), []);
  assert.deepEqual(findKeyWaitConflicts('nope', demo(), all), []);
  // without bitmap rooms a plain `screen5` flow is a presentation flow (walker): nothing is played
  assert.deepEqual(findKeyWaitConflicts('fx1', demo(), all.filter(a => a !== room)), []);
});

// ---------------------------------------------------------------------------
console.log('AYRegisterSynthesizer.pokeRegisters');
test('pokeRegisters masks like the chip, ignores R14/R15 and a write to R13 restarts the envelope', () => {
  const synth = new AYRegisterSynthesizer(0.5);
  synth.pokeRegisters([{ reg: 4, value: 0xab }, { reg: 5, value: 0xff }, { reg: 6, value: 0xff }, { reg: 7, value: 0xff }, { reg: 10, value: 0xff }, { reg: 11, value: 0x12 }, { reg: 12, value: 0x34 }, { reg: 14, value: 0x55 }]);
  assert.equal(synth.getRegister(4), 0xab);
  assert.equal(synth.getRegister(5), 0x0f, 'R5 has 4 bits');
  assert.equal(synth.getRegister(6), 0x1f, 'R6 has 5 bits');
  assert.equal(synth.getRegister(7), 0x3f, 'R7 keeps the 6 mixer bits');
  assert.equal(synth.getRegister(10), 0x1f, 'volume: 4 bits + envelope flag');
  assert.equal(synth.getRegister(11), 0x12);
  assert.equal(synth.getRegister(12), 0x34);
  const priv = synth as any;
  synth.pokeRegisters([{ reg: 13, value: 0x1c }]);
  assert.equal(synth.getRegister(13), 0x0c, 'R13 has 4 bits');
  assert.equal(priv.envelopeStep, 32, 'envelope restarted');
  priv.envelopeStep = 5;
  synth.pokeRegisters([{ reg: 13, value: 0x0c }]); // same shape again
  assert.equal(priv.envelopeStep, 32, 'the real PSG restarts the envelope on every write to R13, even with the same shape');
  synth.pokeRegisters([{ reg: 99, value: 1 }, { reg: -1, value: 1 }]); // out of range: ignored, no throw
});
test('replaying the writes of a sound through pokeRegisters leaves channel C playing then silent', () => {
  const synth = new AYRegisterSynthesizer(0.5);
  const schedule = soundPreviewSchedule(soundRecords);
  schedule.forEach((writes, i) => {
    synth.pokeRegisters(writes);
    if (i === 0) assert.equal(synth.getRegister(10), soundRecords[0][4] & 0x1f, 'the first record sets the volume of C');
  });
  assert.equal(synth.getRegister(10), 0, 'the stop write silences channel C');
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.error(`FAILED: ${failures.join('; ')}`);
  process.exit(1);
}
void defaultLayerRect;

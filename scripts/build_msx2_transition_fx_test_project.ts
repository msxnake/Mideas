/**
 * Builds the fixture of the Transition FX OpenMSX smoke (scripts/check_msx2_transition_fx_smoke.mjs):
 *
 *   test/msx2-transition-fx/out/fixture_fx.json        a SCREEN 5 bitmap-room project whose boot flow is
 *                                                      Start -> Screen5Presentation (entry effect) -> Transition -> WorldLink
 *   test/msx2-transition-fx/out/expected_page0.bin     VRAM page 0 (212 rows x 128 bytes) the effect must END on,
 *                                                      from the JS decoder (utils/msx2TransitionFx.ts), NOT from the Z80
 *   test/msx2-transition-fx/out/expected_page1.bin     VRAM page 1 rows 0..211: the derived picture the RLE upload must leave there
 *   test/msx2-transition-fx/out/expected.json          final palette, tick counts, sound ticks, skip-sequence page 0 ...
 *
 * The donor project is test/msx2-bitmap-intro/bitmap_intro_test.json (rooms + a presentation intro); the picture
 * ("Back to Mars") and the sound come from test/msx2-transition-fx/fixture_back_to_mars.json, the effect is the F1a
 * default preset (alien fades in, logo drops with a bounce and whoosh + thud, then wait for a key).
 *
 *   npx tsx scripts/build_msx2_transition_fx_test_project.ts [--no-wait] [--no-skip] [--no-sound]
 *
 * --no-wait   leave out the final "wait for a key" step
 * --no-skip   make the effect not skippable (no skip sequence in the block)
 * --no-sound  drop the sounds from the effect
 * --chain     play a plain (no effect) presentation first, so the effect scene is the SECOND scene of the boot chain
 * --two-fx    like --chain, but the first scene has an effect of its own: two different effect blocks in the ROM (block 1 = Back to Mars)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type FxDecoder,
  compileTransitionDetailed,
  createFxDecoder,
  createLogoDropPreset,
  fxPageRows,
  readFxSourceImage,
  runFxToEnd,
  soundsFromAssets,
} from '../utils/msx2TransitionFx';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'test', 'msx2-transition-fx', 'out');
const args = new Set(process.argv.slice(2));

const donor = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/msx2-bitmap-intro/bitmap_intro_test.json'), 'utf8'));
const mars = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/msx2-transition-fx/fixture_back_to_mars.json'), 'utf8'));

const presentation = { id: mars.presentation.id, name: 'Back to Mars', type: 'msx2presentation', data: { ...mars.presentation.data, id: mars.presentation.id, name: 'Back to Mars' } };
const whoosh = { id: mars.sound.id, name: 'whoosh', type: 'sound', data: { ...mars.sound.data, id: mars.sound.id, name: 'whoosh' } };
// A second, different sound so the block carries a real table (index 0 and 1) and the SFX operand is exercised.
const thudData = JSON.parse(JSON.stringify(mars.sound.data));
const thud = { id: 'sound_fx_thud', name: 'thud', type: 'sound', data: { ...thudData, id: 'sound_fx_thud', name: 'thud' } };
for (const channel of thud.data.channels || []) {
  for (const step of channel.steps || []) step.tonePeriod = Math.min(0x0fff, (step.tonePeriod || 200) * 3);
}

const effect = createLogoDropPreset({
  sourcePresentationAssetId: presentation.id,
  logo: { x: 4, y: 12, w: 250, h: 53 },
  alien: { x: 68, y: 65, w: 104, h: 136 },
  whooshSoundId: args.has('--no-sound') ? undefined : whoosh.id,
  thudSoundId: args.has('--no-sound') ? undefined : thud.id,
  alienFadeFrames: 32,
  dropFrames: 40,
});
if (args.has('--no-wait')) effect.steps = effect.steps.filter(step => step.id !== 'step_wait');
if (args.has('--no-skip')) effect.skippable = false;
const fxAsset = { id: 'msx2transition_smoke', name: 'Back to Mars entry', type: 'msx2transition', data: effect };

const project = JSON.parse(JSON.stringify(donor));
// --chain keeps the donor's own presentation: it plays first, WITHOUT an effect, so the effect scene starts on a page 0 that is not black.
if (args.has('--two-fx')) args.add('--chain');
if (!args.has('--chain')) project.assets = project.assets.filter((a: any) => a.id !== 'intro_presentation_test');
// A room backdrop other than 0 makes "the effect runs on backdrop 0 and the room's R#7 comes back" observable in R#7.
for (const asset of project.assets) if (asset.type === 'msx2bitmaproom') asset.data.backgroundColor = 5;
project.assets.push(presentation, whoosh, thud, fxAsset);
const flow = project.assets.find((a: any) => a.type === 'msx2gameflow').data;
const node = flow.nodes.find((n: any) => n.type === 'Screen5Presentation');
node.presentationAssetId = presentation.id;
node.fxAssetId = fxAsset.id;
// the smoke presses SPACE where the effect asks for it; the scene itself waits a short fixed time
node.waitForKey = false;
node.waitFrames = 30;
if (args.has('--chain')) {
  // Start -> first scene (coloured picture, 20 frames, no effect) -> the effect scene
  const first = { id: 'gf_first_scene', type: 'Screen5Presentation', position: { x: 100, y: 100 }, presentationAssetId: 'intro_presentation_test', waitForKey: false, waitFrames: 20 };
  flow.nodes.push(first);
  const toEffect = flow.connections.find((c: any) => c.to.nodeId === node.id);
  toEffect.to.nodeId = first.id;
  flow.connections.push({ id: 'c_first_to_effect', from: { nodeId: first.id }, to: { nodeId: node.id } });
  if (args.has('--two-fx')) {
    // The first scene gets an effect of its own (a plain top-down reveal of its picture), so the ROM carries TWO different effect blocks:
    // block 0 = this reveal, block 1 = the Back to Mars effect. The smoke checks the SECOND scene, which exercises the block table index.
    const reveal = {
      id: 'msx2transition_reveal', name: 'Intro art reveal', type: 'msx2transition',
      data: {
        version: 1, sourcePresentationAssetId: 'intro_presentation_test',
        layers: [{ id: 'layer_all', name: 'All', rect: { x: 0, y: 0, w: 256, h: 192 } }],
        steps: [{ id: 'step_reveal', name: 'Reveal', clips: [{ id: 'clip_reveal', target: 'layer_all', effect: 'reveal', durationFrames: 24, delayFrames: 0, easing: 'linear', params: { direction: 'down', stripSize: 8, slats: 1 } }] }],
        skippable: true,
      },
    };
    project.assets.push(reveal);
    (first as any).fxAssetId = reveal.id;
  }
}

// ---- expected result, from the JS decoder only ---------------------------------------------------------
const image = readFxSourceImage(presentation.data);
const compiled = compileTransitionDetailed(effect, image, { sounds: soundsFromAssets([whoosh, thud] as any) });
if (compiled.errors.length) throw new Error(`the preset does not compile: ${compiled.errors.join('; ')}`);
const derived = compiled.derived!;
const waitsForKey = compiled.mainOps.some(op => op.op === 'WAITKEY');

const pack = (rows: number[][]) => {
  const out = Buffer.alloc(rows.length * 128);
  rows.forEach((row, y) => { for (let x = 0; x < 128; x++) out[y * 128 + x] = ((row[2 * x] & 15) << 4) | (row[2 * x + 1] & 15); });
  return out;
};
/** What the VDP/PSG must hold right after tick N: the decoder steps whole ticks, so this is the state at the Z80's "tick N returned". */
interface TickState { page0: Buffer; palette: number[][]; psg: number[] }
const snapshot = (d: FxDecoder): TickState => ({ page0: pack(fxPageRows(d, 0)), palette: d.palette.map(c => [...c]), psg: [...d.psgRegs] });

// Run to the end WITHOUT a skip: no key until the animation is over, then one press (for WAITKEY).
// The key schedule is in TICKS (the smoke drives the keyboard / joystick from the tick counter, not from the clock).
const pressFrom = compiled.totalTicks + 10;
const pressTicks = 12;
const SKIP_FROM = 40; // the first sound (35..61) is still ringing when the skip lands
const SKIP_TICKS = 10;
const ticks: TickState[] = []; // ticks[i] = state right after tick i + 1 (animation ticks only; the waits for a key change nothing)
const dec = createFxDecoder(compiled.bytes, { page1: derived.pixels });
runFxToEnd(dec, {
  keyAtTick: tick => waitsForKey && tick >= pressFrom && tick < pressFrom + pressTicks,
  onTick: d => { if (d.tick === ticks.length + 1 && d.tick <= compiled.totalTicks) ticks.push(snapshot(d)); },
});
const page0 = pack(fxPageRows(dec, 0));
// The same effect when SPACE is pressed early (skip sequence): the final state must be identical.
let skipPage0: Buffer | null = null;
let skipTicks = 0;
if (effect.skippable) {
  const skipDec = createFxDecoder(compiled.bytes, { page1: derived.pixels });
  runFxToEnd(skipDec, { keyAtTick: tick => tick >= SKIP_FROM && tick < SKIP_FROM + SKIP_TICKS });
  skipPage0 = pack(fxPageRows(skipDec, 0));
  skipTicks = skipDec.tick;
}

const palette = dec.palette.map(([r, g, b]) => [r, g, b]);
// Ticks the smoke highlights (and sabotages): the state there must differ from the final one, or a "final state only" bug would hide.
const finalPalette = JSON.stringify(palette);
const differsFromFinal = (t: number) => t <= ticks.length && !(ticks[t - 1].page0.equals(page0) && JSON.stringify(ticks[t - 1].palette) === finalPalette);
const sampleTicks = [10, 25, 40, 50, 60, 70, 80, 100].filter(differsFromFinal);
if (sampleTicks.length < 4 && effect.steps.length > 0) throw new Error(`only ${sampleTicks.length} sample ticks differ from the final state`);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'expected_ticks_page0.bin'), Buffer.concat(ticks.map(t => t.page0)));
fs.writeFileSync(path.join(OUT, 'fixture_fx.json'), JSON.stringify(project));
// The same project WITHOUT the effect (the picture appears at once): scripts/check_msx2_transition_fx_room_change.mjs compares what
// the game shows after its first room change with and without the effect.
{
  const plain = JSON.parse(JSON.stringify(project));
  const plainFlow = plain.assets.find((a: any) => a.type === 'msx2gameflow').data;
  delete plainFlow.nodes.find((n: any) => n.id === node.id).fxAssetId;
  fs.writeFileSync(path.join(OUT, 'fixture_plain.json'), JSON.stringify(plain));
}
// The effect + its sounds on their own, to graft them onto a real project (e.g. test716: same presentation id).
fs.writeFileSync(path.join(OUT, 'fx_assets.json'), JSON.stringify({ presentationId: presentation.id, assets: [whoosh, thud, fxAsset] }));
fs.writeFileSync(path.join(OUT, 'expected_page0.bin'), page0);
// What the RLE upload must leave on VRAM page 1 (rows 0..211): the DERIVED picture the effect copies from.
fs.writeFileSync(path.join(OUT, 'expected_page1.bin'), Buffer.from(derived.packed));
if (skipPage0) fs.writeFileSync(path.join(OUT, 'expected_skip_page0.bin'), skipPage0);
else fs.rmSync(path.join(OUT, 'expected_skip_page0.bin'), { force: true });
fs.writeFileSync(path.join(OUT, 'expected.json'), JSON.stringify({
  blockBytes: compiled.bytes.length,
  totalTicks: compiled.totalTicks,
  waitsForKey,
  endTick: dec.tick,
  skipEndTick: skipTicks,
  pressFrom,
  pressTicks,
  skipFrom: SKIP_FROM,
  skipTicks: SKIP_TICKS,
  tickCount: ticks.length,
  sampleTicks,
  tickPalettes: ticks.map(t => t.palette),
  tickPsg: ticks.map(t => t.psg),
  firstSfxTick: dec.sfxLog.length ? dec.sfxLog[0].tick + 1 : -1,
  palette,
  paletteMode: derived.plan.mode,
  paletteSlotsUsed: derived.plan.slotsUsed,
  alteredPixels: derived.plan.alteredPixels,
  sfx: dec.sfxLog,
  soundEvents: compiled.soundEvents,
  rectCount: dec.rectLog.length,
  warnings: compiled.warnings,
  frames: compiled.frames.length,
}, null, 2));
console.log(`fixture ${path.relative(ROOT, path.join(OUT, 'fixture_fx.json'))}: block ${compiled.bytes.length} B, ${compiled.totalTicks} ticks, `
  + `${dec.rectLog.length} rectangles, ${dec.sfxLog.length} sounds, palette ${derived.plan.mode} (${derived.plan.slotsUsed} slots, ${derived.plan.alteredPixels} px altered)`);
for (const warning of compiled.warnings) console.log(`  warning: ${warning}`);

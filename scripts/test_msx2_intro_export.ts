// Contract test for the Intro ROM exporter's edge cases (data side; the interpreter itself is
// covered by scripts/check_msx2_intro_smoke.mjs in OpenMSX).
// Run: npx tsx scripts/test_msx2_intro_export.ts
import assert from 'node:assert/strict';
import { buildBitmapIntro } from '../utils/msxGenerator/generators/msx2/msx2BitmapIntroGenerator';
import { createIntroSlide, createIntroStep } from '../utils/msx2IntroUtils';

const flowWith = (introAssetId: string) => ({ nodes: [{ id: 'n', type: 'Intro', introAssetId }], connections: [] }) as any;
const project = (slides: any[], extraAssets: any[] = []) => ({
  assets: [{ id: 'i1', name: 'I', type: 'msx2intro', data: { id: 'i1', name: 'I', target: 'MSX2', slides } }, ...extraAssets],
}) as any;
const build = (slides: any[], extra: any[] = [], megaRom = true) =>
  buildBitmapIntro(project(slides, extra), flowWith('i1'), { firstBank: 4, music: false, megaRom });

// baseline: one slide builds, banksAsm is emitted, code bank is 4
const ok = build([createIntroSlide('a')]);
assert.ok(ok.banksAsm.includes('org #8000') && ok.residentAsm.includes('bitmap_intro_run'));
assert.equal(ok.introIndexById.get('i1'), 0);

// no MegaROM -> clear error, nothing emitted
assert.throws(() => build([createIntroSlide('a')], [], false), /MegaROM/);

// a flow without Intro nodes produces nothing (this is what keeps ROMs byte-identical)
const none = buildBitmapIntro(project([createIntroSlide('a')]), { nodes: [{ id: 'x', type: 'Start' }], connections: [] } as any, { firstBank: 4, music: false, megaRom: true });
assert.equal(none.banksAsm, '');

// a step whose zone was deleted aborts instead of desynchronising the parser
const broken = createIntroSlide('b');
broken.steps[0].zoneId = 'gone';
assert.throws(() => build([broken]), /deleted text zone/);

// text that cannot fit the interpreter bank fails with a message that names the intro, not a Glass error
const big = createIntroSlide('big');
big.textZones[0].rect = { x: 0, y: 0, w: 256, h: 192 };
big.steps = Array.from({ length: 60 }, () => ({ ...createIntroStep(big.textZones[0].id), text: 'WORD '.repeat(60) }));
assert.throws(() => build([big]), /interpreter bank/);

// the #3F bank is never handed out: starting right before it, the code bank skips it
const skip = buildBitmapIntro(project([createIntroSlide('a')]), flowWith('i1'), { firstBank: 0x3f, music: false, megaRom: true });
assert.ok(!/BITMAP_INTRO_CODE_BANK EQU 63/.test(skip.equatesAsm), 'code bank must not be #3F');
assert.ok(/BITMAP_INTRO_CODE_BANK EQU 64/.test(skip.equatesAsm));

// an odd / out-of-range zone is normalised (and reported) instead of exported as is
const odd = createIntroSlide('odd');
odd.textZones[0].rect = { x: 7, y: 300, w: 33, h: 20 };
const oddBuild = build([odd]);
assert.ok(oddBuild.warnings.some(w => /adjusted/.test(w)));

// fonts: more than 250 glyphs would collide with the #FE/#FF text markers
const chars = Array.from({ length: 300 }, (_u, i) => String.fromCharCode(0x100 + i)).join('');
const fontAsset = { id: 'f1', name: 'Big', type: 'msx2hudfont', data: { target: 'MSX2', vdpMode: 'SCREEN4', baseChar: 0, characters: chars, patterns: {}, colorByte: 0xf1 } };
const withFont = createIntroSlide('f');
withFont.textZones[0].fontAssetId = 'f1';
withFont.steps[0].text = 'A';
const fontBuild = build([withFont], [fontAsset]);
assert.ok(fontBuild.warnings.some(w => /only the first 250/.test(w)));

// missing numeric fields fall back to the editor defaults instead of NaN/0
const legacy = createIntroSlide('legacy');
delete (legacy.textZones[0] as any).lineSpacing;
delete (legacy.textZones[0] as any).charDelayFrames;
const legacyAsm = build([legacy]).banksAsm;
assert.ok(/#0A,#03,#\d\d/.test(legacyAsm.replace(/\s/g, '')) || /,#0A,#03,/.test(legacyAsm.replace(/\s/g, '')), 'spacing 10 and delay 3 expected');

// fade transitions are exported as slide flags (bit0 in, bit1 out) right after the background slot
const fading = createIntroSlide('fading');
fading.backgroundColor = 5;
fading.transitionIn = 'fade';
assert.ok(/; slide 1: fading\n\s*DB #05,#01,/.test(build([fading]).banksAsm), 'fade in -> flags 1');
fading.transitionOut = 'fade';
assert.ok(/; slide 1: fading\n\s*DB #05,#03,/.test(build([fading]).banksAsm), 'fade in + out -> flags 3');
assert.ok(/; slide 1: a\n\s*DB #01,#00,/.test(ok.banksAsm), 'cut/cut -> flags 0');

// the scratch RAM (#E600-#E6FF) must not overlap the project's dedicated RAM chain
const withChain = (ramChainEnd: number) =>
  buildBitmapIntro(project([createIntroSlide('a')]), flowWith('i1'), { firstBank: 4, music: false, megaRom: true, ramChainEnd });
assert.throws(() => withChain(0xe700), /RAM chain/);
assert.doesNotThrow(() => withChain(0xe600));

// every routine of the interpreter carries the contract header required by ai/ASM_GUIDELINES.md
for (const name of ['bitmap_intro_main', 'bitmap_intro_slide', 'bitmap_intro_step', 'bitmap_intro_fade', 'bitmap_intro_draw_glyph', 'bitmap_intro_marker_set', 'bitmap_intro_read_key', 'bitmap_intro_frame', 'bitmap_intro_vwrite', 'bitmap_intro_vread']) {
  assert.ok(new RegExp(`; FUNCTION: ${name}\\n(;.*\\n)+?; DESTROYS:[\\s\\S]*?\\n${name}:`).test(ok.banksAsm), `${name} has no contract header`);
}
assert.ok(/; FUNCTION: bitmap_intro_run\n(;.*\n)+?; DESTROYS:/.test(ok.residentAsm), 'bitmap_intro_run has no contract header');
assert.ok(ok.residentAsm.includes('bitmap_intro_resident_end'), 'resident guard missing');

// counters are one byte: 256 steps/zones/images must abort instead of wrapping to 0
const many = createIntroSlide('many');
many.steps = Array.from({ length: 256 }, () => createIntroStep(many.textZones[0].id));
assert.throws(() => build([many]), /at most 255/);
const manySlides = Array.from({ length: 256 }, (_u, i) => createIntroSlide(`s${i}`));
assert.throws(() => build(manySlides), /at most 255/);

// a slide name with a line break cannot inject assembler lines into the generated comment
const sneaky = createIntroSlide('x\n    halt\n; y');
assert.ok(!/^\s+halt\s*$/m.test(build([sneaky]).banksAsm), 'slide name leaked a line of assembler');

// an image whose source presentation is gone is reported, not dropped silently
const orphan = createIntroSlide('orphan');
orphan.images = [{ id: 'i', name: 'Ghost', sourceAssetId: 'no-such-presentation', crop: { x: 0, y: 0, w: 8, h: 8 }, dest: { x: 0, y: 0, w: 8, h: 8 } }];
assert.ok(build([orphan]).warnings.some(w => /Ghost.*no source presentation/.test(w)));

// one warning per font, however many zones and steps use it
const bigFont = createIntroSlide('bigfont');
bigFont.textZones[0].fontAssetId = 'f1';
bigFont.steps = Array.from({ length: 5 }, () => ({ ...createIntroStep(bigFont.textZones[0].id), text: 'A' }));
const bigChars = Array.from({ length: 300 }, (_u, i) => String.fromCharCode(0x100 + i)).join('');
const bigAsset = { id: 'f1', name: 'Big', type: 'msx2hudfont', data: { target: 'MSX2', vdpMode: 'SCREEN4', baseChar: 0, characters: bigChars, patterns: {}, colorByte: 0xf1 } };
assert.equal(build([bigFont], [bigAsset]).warnings.filter(w => /only the first 250/.test(w)).length, 1);

// A zone record carries its cell width in bytes (the interpreter blits and advances by it): 4 for an 8x8 font,
// 2 for a SCREEN 5 font set to 4x8, and the characters-per-line byte doubles with it. The built-in font keeps 3.
const zoneRecord = (fontData: any | undefined) => {
  const slide = createIntroSlide('rec');
  const zone = slide.textZones[0];
  zone.rect = { x: 16, y: 8, w: 64, h: 16 };
  zone.fg = 7; zone.bg = 2; zone.lineSpacing = 10; zone.charDelayFrames = 3;
  if (fontData) zone.fontAssetId = 'fh';
  slide.steps = [{ ...createIntroStep(zone.id), text: 'A' }];
  const asset = fontData ? [{ id: 'fh', name: 'Half', type: 'msx2hudfont', data: fontData }] : [];
  // DB lines wrap every 16 bytes: glue them back into one stream before looking for the record
  return build([slide], asset).banksAsm.replace(/\n\s*DB /g, ',').replace(/\s/g, '');
};
const fh = { target: 'MSX2', baseChar: 0, characters: 'A ', colorByte: 0xf1, patterns: { A: [255, 255, 255, 255, 255, 255, 255, 255] } };
const hex = (bytes: number[]) => bytes.map(b => `#${b.toString(16).toUpperCase().padStart(2, '0')}`).join(',');
const record = (cellBytes: number, cols: number) => hex([8, 8, 32, 16, cellBytes, 0, 7, 2, 10, 3, cols]); // x/2, y, w/2, h, cell, font, fg, bg, spacing, delay, cols
assert.ok(zoneRecord({ ...fh, vdpMode: 'SCREEN4' }).includes(record(4, 8)), '8x8 font: 4-byte cell, 64 / 8 = 8 columns');
assert.ok(zoneRecord({ ...fh, vdpMode: 'SCREEN5' }).includes(record(4, 8)), 'SCREEN 5 font without a width keeps the 8 px cell');
assert.ok(zoneRecord({ ...fh, vdpMode: 'SCREEN5', glyphWidth: 4 }).includes(record(2, 16)), '4x8 font: 2-byte cell, 64 / 4 = 16 columns');
assert.ok(!zoneRecord({ ...fh, vdpMode: 'SCREEN4', glyphWidth: 4 }).includes(record(2, 16)), 'a 4x8 width outside SCREEN 5 is ignored, like everywhere else');
assert.ok(zoneRecord(undefined).includes(hex([8, 8, 32, 16, 3, 0, 7, 2, 10, 3, 10])), 'built-in font: 3-byte cell, 64 / 6 = 10 columns');

console.log('msx2 intro export: OK');

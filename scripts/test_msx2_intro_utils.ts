// Contract test for the Intro typewriter state machine and rect normalisation.
// Run: npx tsx scripts/test_msx2_intro_utils.ts
import assert from 'node:assert/strict';
import {
  buildIntroFontFromAsset, BUILTIN_INTRO_FONT, createIntroSlide, drawZoneText, createIntroBuffer, initialIntroPlayerState, scaleSlotsBrightness, validateIntroMusic,
  layoutZoneText, normalizeScreenRect, resolveIntroFont, stepIntroPlayer,
} from '../utils/msx2IntroUtils';

const slide = createIntroSlide('t');
slide.textZones[0].charDelayFrames = 2;
slide.steps = [
  { ...slide.steps[0], text: 'AB', autoAdvanceFrames: 0 },
  { ...slide.steps[0], id: 's2', text: 'CD', autoAdvanceFrames: 3 },
];
const total = layoutZoneText(slide.textZones[0], 'AB').totalChars;
assert.equal(total, 2);

// typing: one char every 2 frames, complete -> waiting
let s = initialIntroPlayerState();
assert.equal(s.stepStarted, true);
s = stepIntroPlayer(s, slide, false); assert.equal(s.typed, 0);
s = stepIntroPlayer(s, slide, false); assert.equal(s.typed, 1);
s = stepIntroPlayer(s, slide, false); s = stepIntroPlayer(s, slide, false);
assert.deepEqual([s.typed, s.phase], [2, 'waiting']);

// a press while typing completes it but does NOT also advance
let t = stepIntroPlayer(initialIntroPlayerState(), slide, true);
assert.deepEqual([t.step, t.typed, t.phase], [0, 2, 'waiting']);
// a press while waiting advances and marks the new step as started
t = stepIntroPlayer(t, slide, true);
assert.deepEqual([t.step, t.typed, t.phase, t.stepStarted], [1, 0, 'typing', true]);

// auto advance on the last step ends the slide by itself
t = stepIntroPlayer(t, slide, true); // complete "CD"
for (let i = 0; i < 3; i++) t = stepIntroPlayer(t, slide, false);
assert.equal(t.phase, 'done');

// empty text does not swallow a key press
const empty = createIntroSlide('e');
empty.steps[0].text = '';
let e = stepIntroPlayer(initialIntroPlayerState(), empty, false);
assert.equal(e.phase, 'waiting');
e = stepIntroPlayer(e, empty, true);
assert.equal(e.phase, 'done');

// rectangles: always inside the screen, x and w even
for (const r of [{ x: 100, y: 0, w: 400, h: 10 }, { x: -50, y: -5, w: 250, h: 0 }, { x: 255, y: 191, w: 1, h: 99 }, { x: NaN, y: 3, w: 7, h: 5 }]) {
  const n = normalizeScreenRect(r);
  assert.ok(n.x >= 0 && n.x + n.w <= 256 && n.y >= 0 && n.y + n.h <= 192, JSON.stringify(n));
  assert.equal(n.x % 2, 0); assert.equal(n.w % 2, 0);
}
// custom fonts: 8 px cells, unsupported characters become spaces, glyphs are blitted
const fontAsset: any = {
  id: 'f1', name: 'MyFont', type: 'msx2hudfont',
  data: { target: 'MSX2', vdpMode: 'SCREEN4', baseChar: 0, characters: 'AB ', colorByte: 0xF1,
    patterns: { A: [255, 255, 255, 255, 255, 255, 255, 255], B: [0, 0, 0, 0, 0, 0, 0, 0] } },
};
const { font, missing } = resolveIntroFont([fontAsset], undefined, 'f1');
assert.equal(missing, false);
assert.equal(font.cellW, 8);
assert.equal(font.sanitize('aXb'), 'A B'); // lower-case folded, unknown char -> space
assert.equal(resolveIntroFont([], undefined, 'gone').missing, true);
assert.equal(resolveIntroFont([fontAsset], 'f1', undefined).font.id, 'f1'); // zone override
const z = slide.textZones[0];
z.rect = { x: 0, y: 0, w: 24, h: 8 };
assert.equal(layoutZoneText(z, 'AAAA', font).cols, 3); // 24 / 8
assert.equal(layoutZoneText(z, 'AAAA', BUILTIN_INTRO_FONT).cols, 4); // 24 / 6
const buf = createIntroBuffer();
z.fg = 7; z.bg = 2;
drawZoneText(buf, z, layoutZoneText(z, 'AB', font), 2, font);
assert.equal(buf[0], 7); // 'A' is a solid glyph -> fg
assert.equal(buf[8], 2); // 'B' is empty -> bg, starts 8 px further
// A SCREEN 5 colour font is drawn from its 1bpp mask in the zone colours, whatever its bitmap says
// (the bitmap here is solid, the mask of "B" is empty: the result must follow the mask).
const bmp = buildIntroFontFromAsset('f2', 'Bmp', { ...fontAsset.data, vdpMode: 'SCREEN5',
  bitmapPatterns: { A: Array.from({ length: 8 }, () => new Array(8).fill(9)), B: Array.from({ length: 8 }, () => new Array(8).fill(9)) } } as any);
const b2 = createIntroBuffer();
drawZoneText(b2, z, layoutZoneText(z, 'AB', bmp), 2, bmp);
assert.equal(b2[0], 7); // "A" mask is solid -> text colour, not the bitmap's slot 9
assert.equal(b2[8], 2); // "B" mask is empty -> box colour
assert.equal(bmp.bitmap, false);
// a space stored as a solid box (HUD fonts do that) must still print blank
const boxSpace = buildIntroFontFromAsset('f3', 'BoxSpace', { ...fontAsset.data,
  patterns: { ...fontAsset.data.patterns, ' ': new Array(8).fill(255) } } as any);
const b3 = createIntroBuffer();
drawZoneText(b3, z, layoutZoneText(z, 'A A', boxSpace), 3, boxSpace);
assert.equal(b3[8], 2); // the space between the two "A" is box colour, not text colour

// fade: level 7 leaves the palette alone, 0 is black, and the steps in between are strictly increasing
const pal = createIntroSlide('p').palette;
const bright = (level: number) => scaleSlotsBrightness(pal, level).slice(1).reduce((n, slot) => n + parseInt(slot.hex.slice(1, 3), 16) + parseInt(slot.hex.slice(3, 5), 16) + parseInt(slot.hex.slice(5, 7), 16), 0);
assert.deepEqual(scaleSlotsBrightness(pal, 7).map(x => x.hex), pal.map(x => x.hex));
// a dimmed palette must survive ensureScreen5PaletteSlots' own normalisation when it is drawn: the editor
// hands scaled slots straight to drawIntroBuffer, so normalising them again would rebuild the master colours
// (this is exactly the bug that made the preview fade invisible)
import('../utils/msx2PaletteUtils').then(({ ensureScreen5PaletteSlots }) => {
  const dim = scaleSlotsBrightness(pal, 3);
  const renormalised = ensureScreen5PaletteSlots(dim).slots;
  assert.notDeepEqual(renormalised.map(x => x.hex), dim.map(x => x.hex), 'documented: ensureScreen5PaletteSlots rebuilds hex from masterIndex');
});
assert.equal(bright(0), 0);
for (let level = 1; level <= 7; level++) assert.ok(bright(level) > bright(level - 1), `level ${level} must be brighter than ${level - 1}`);

// the preview fade shows exactly what the ROM's fade puts on screen: the 3-bit components scaled by
// round(c * level / 7), expanded back to 8 bits the way the palette is displayed (round(c * 255 / 7))
const to3 = (v8: number) => Math.round((v8 * 7) / 255);
const to8 = (c3: number) => Math.round((c3 * 255) / 7).toString(16).padStart(2, '0');
for (let level = 1; level <= 6; level++) {
  scaleSlotsBrightness(pal, level).forEach((slot, i) => {
    if (slot.hex === 'rgba(0,0,0,0)') return;
    const expected = '#' + [1, 3, 5].map(at => to8(Math.round((to3(parseInt(pal[i].hex.slice(at, at + 2), 16)) * level) / 7))).join('');
    assert.equal(slot.hex, expected, `slot ${i} at level ${level}`);
  });
}

// music option: unset / silence are always fine, a deleted track is reported
assert.deepEqual(validateIntroMusic({ musicTrackAssetId: undefined } as any, []), []);
assert.deepEqual(validateIntroMusic({ musicTrackAssetId: '__none' } as any, []), []);
assert.equal(validateIntroMusic({ musicTrackAssetId: 'gone' } as any, []).length, 1);
assert.deepEqual(validateIntroMusic({ musicTrackAssetId: 't1' } as any, [{ id: 't1', type: 'track' } as any]), []);

console.log('msx2 intro utils: OK');

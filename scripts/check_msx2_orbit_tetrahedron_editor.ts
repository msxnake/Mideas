// Checks of the editor side of the orbiting tetrahedron (Screen5Presentation node, "Figura orbital" section).
//
//   npx tsx scripts/check_msx2_orbit_tetrahedron_editor.ts
//
// No browser: the section is thin, the logic is in utils/msx2OrbitTetrahedronEditorUtils.ts (which sprites can be dots,
// the default config, what a node builds and what is wrong with it) and utils/msx2OrbitTetrahedronPreview.ts (the canvas
// that plays the ROM tables). What is checked:
//   - which sprite assets can be dots and why the others cannot;
//   - the default config takes every valid sprite, biggest first;
//   - a node builds the same figure the export builds, and its problems come back as messages, never as exceptions
//     (disabled, no picture, a sprite that is gone, an entry effect that is gone, a backend that cannot play it);
//   - the palette of a presentation whose nested `data` holds only pixels is not lost (it used to read as all black);
//   - the preview paints the picture with its palette, the dots with the three colours (so the CC/OR of the second plane
//     works), and is deterministic from frame to frame.
import assert from 'node:assert/strict';
import {
  defaultOrbitTetrahedronConfig,
  orbitSpriteCandidates,
  orbitTetrahedronForNode,
  orbitTetrahedronNodeErrors,
  paletteEntryCss,
} from '../utils/msx2OrbitTetrahedronEditorUtils';
import { createOrbitPreview, ORBIT_PREVIEW_HEIGHT, ORBIT_PREVIEW_WIDTH } from '../utils/msx2OrbitTetrahedronPreview';
import { readFxSourceImage } from '../utils/msx2TransitionFx';

const checks: string[] = [];
const pass = (name: string) => { checks.push(name); console.log(`ok - ${name}`); };

// ---- assets
// masterIndex wins over hex when the palette is read, so it has to be right: (R << 6) | (G << 3) | B with 3-bit levels.
const slot = (slotIndex: number, hex: string) => {
  if (slotIndex === 0) return { slotIndex, masterIndex: -1, hex };
  const level = (shift: number) => Math.round(((parseInt(hex.slice(1), 16) >> shift) & 0xff) * 7 / 255);
  return { slotIndex, masterIndex: (level(16) << 6) | (level(8) << 3) | level(0), hex };
};
// The dot sprites draw with slots 1, 2, 3; their own palette only matters for the editor.
const DOT_HEX = ['rgba(0,0,0,0)', '#2424B6', '#FFFFFF', '#4949FF'];
const spritePalette = DOT_HEX.map((hex, index) => slot(index, hex)).concat(Array.from({ length: 12 }, (_unused, index) => slot(4 + index, index === 2 ? '#B62424' : `#0000${(index + 16).toString(16).toUpperCase().padStart(2, '0')}`)));
function disc(diameter: number, id: string, extraSlot?: number) {
  const data = Array.from({ length: 16 }, (_unused, y) => Array.from({ length: 16 }, (_unused2, x) => {
    const distance = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
    if (distance > diameter / 2) return DOT_HEX[0];
    if (extraSlot && x === 8 && y === 8) return spritePalette[extraSlot].hex;
    if (distance > diameter / 2 - 1.2) return DOT_HEX[1];
    if (x < 8 && y < 8 && distance > diameter * 0.18) return DOT_HEX[2];
    return DOT_HEX[3];
  }));
  return { id, name: `ball ${diameter}`, type: 'msx2sprite', data: { id, name: `ball ${diameter}`, size: { width: 16, height: 16 }, palette: spritePalette, frames: [{ id: 'f', data }], currentFrameIndex: 0 } };
}
const sprites = [disc(8, 'ball8'), disc(16, 'ball16'), disc(12, 'ball12'), disc(4, 'ball4')];
const notBall = disc(10, 'ball_slot6', 6);

// The picture: an ellipse of palette slot 9 on a slot 1 background. The dot colours (2, 5, 7: 5 | 2 = 7) are only in the palette.
const picturePalette = Array.from({ length: 16 }, (_unused, index) => {
  const hexes: Record<number, string> = { 1: '#000000', 2: '#49B649', 5: '#4949FF', 7: '#6DDBDB', 9: '#FF9292' };
  return slot(index, index === 0 ? 'rgba(0,0,0,0)' : hexes[index] || '#000000');
});
const pixels = Array.from({ length: 212 }, (_unused, y) => Array.from({ length: 256 }, (_unused2, x) => (((x - 128) / 60) ** 2 + ((y - 106) / 70) ** 2 <= 1 ? 9 : 1)));
const packed = pixels.flatMap(row => Array.from({ length: 128 }, (_unused, index) => (row[index * 2] << 4) | row[index * 2 + 1]));
const presentationAsset = {
  id: 'pres', name: 'Picture', type: 'msx2presentation',
  data: { width: 256, height: 212, palette: picturePalette, pixels, packedBitmap: packed, packedPixels: packed, data: { pixels, packedBitmap: packed, packedPixels: packed } },
};
const assets: any[] = [...sprites, notBall, presentationAsset, { id: 'room', name: 'Room', type: 'msx2bitmaproom', data: {} }];
const node = (extra: Record<string, unknown> = {}): any => ({ id: 'node1', type: 'Screen5Presentation', position: { x: 0, y: 0 }, presentationAssetId: 'pres', waitForKey: true, waitFrames: 0, ...extra });

// ---- 1. candidates and default config
{
  const candidates = orbitSpriteCandidates(assets);
  assert.equal(candidates.length, 5, 'every msx2sprite asset is listed');
  const good = candidates.filter(candidate => candidate.ok);
  assert.deepEqual(good.map(candidate => candidate.asset.id).sort(), ['ball12', 'ball16', 'ball4', 'ball8']);
  assert.deepEqual(Object.fromEntries(good.map(candidate => [candidate.asset.id, candidate.diameter])), { ball16: 16, ball12: 12, ball8: 8, ball4: 4 });
  const bad = candidates.find(candidate => !candidate.ok)!;
  assert.equal(bad.asset.id, 'ball_slot6');
  assert.match(bad.reason!, /palette slot 6/);
  const config = defaultOrbitTetrahedronConfig(assets);
  assert.equal(config.enabled, true);
  assert.deepEqual(config.spriteAssetIds, ['ball16', 'ball12', 'ball8', 'ball4'], 'biggest dot first, the sprite that does not serve left out');
  pass('candidates: valid sprites listed with their size, the others with the reason; default config takes the valid ones, biggest first');
}

// ---- 2. a node builds what the export builds
{
  const config = defaultOrbitTetrahedronConfig(assets);
  const build = orbitTetrahedronForNode(node({ orbitTetrahedron: config }), assets, true);
  assert.deepEqual(build.errors, []);
  assert.deepEqual(build.warnings, []);
  const result = build.result!;
  assert.ok(result, 'the figure was not built');
  assert.equal(result.frameCount, 240);
  const entries = result.paletteEntries;
  assert.deepEqual([entries.rim, entries.highlight, entries.body].sort((a, b) => a - b), [2, 5, 7], 'the only OR trio of this palette is 2, 5, 7');
  assert.equal(entries.rim | entries.highlight, entries.body);
  assert.ok(build.paletteBytes && build.bitmapBytes && build.bitmapBytes.length === 212 * 128);
  assert.equal(build.romBytes, result.frameBlocks.reduce((sum, block) => sum + block.length, 0) + result.patternBytes.length + result.colorBytes.length);
  assert.equal(orbitTetrahedronNodeErrors(node({ orbitTetrahedron: config }), assets).length, 0);
  assert.equal(paletteEntryCss(build.paletteBytes!, 9), 'rgb(255, 146, 146)');
  pass('a node builds the figure the export builds: trio of the picture palette, ROM size, no messages');
}

// ---- 3. problems come back as messages
{
  const config = defaultOrbitTetrahedronConfig(assets);
  // disabled or absent: nothing built, nothing to say
  for (const extra of [{}, { orbitTetrahedron: { ...config, enabled: false } }]) {
    const build = orbitTetrahedronForNode(node(extra), assets, true);
    assert.deepEqual([build.errors, build.warnings, build.result], [[], [], undefined]);
  }
  // a backend that cannot play it
  const walker = orbitTetrahedronForNode(node({ orbitTetrahedron: config }), assets, false);
  assert.equal(walker.errors.length, 0);
  assert.equal(walker.warnings.length, 1);
  assert.match(walker.warnings[0], /bitmap-room/);
  // no picture / a picture that is gone
  assert.match(orbitTetrahedronForNode(node({ presentationAssetId: undefined, orbitTetrahedron: config }), assets, true).errors[0], /no tiene presentación/);
  assert.match(orbitTetrahedronForNode(node({ presentationAssetId: 'gone', orbitTetrahedron: config }), assets, true).errors[0], /no existe/);
  // a sprite that is gone, a sprite that does not serve, nothing selected
  const gone = orbitTetrahedronForNode(node({ orbitTetrahedron: { ...config, spriteAssetIds: ['ball16', 'vanished'] } }), assets, true);
  assert.match(gone.errors[0], /^References msx2sprite asset "vanished"/, 'the message has no scene prefix and no repeated subject');
  assert.match(orbitTetrahedronForNode(node({ orbitTetrahedron: { ...config, spriteAssetIds: ['ball_slot6'] } }), assets, true).errors[0], /two-colour sprites/);
  assert.match(orbitTetrahedronForNode(node({ orbitTetrahedron: { ...config, spriteAssetIds: [] } }), assets, true).errors[0], /^Needs spriteAssetIds/);
  // an entry effect that no longer exists: the figure cannot be checked, and the message says why
  const noFx = orbitTetrahedronForNode(node({ fxAssetId: 'fx_gone', orbitTetrahedron: config }), assets, true);
  assert.equal(noFx.result, undefined);
  assert.match(noFx.errors[0], /^El efecto de entrada no se puede compilar/);
  // a palette with no trio, with the explanation of what to do
  const flat = assets.map(asset => asset.id !== 'pres' ? asset : { ...asset, data: { ...asset.data, palette: asset.data.palette.map((entry: any) => (entry.slotIndex === 7 ? { ...entry, hex: '#000000', masterIndex: 0 } : entry)) } });
  const noTrio = orbitTetrahedronForNode(node({ orbitTetrahedron: config }), flat, true);
  assert.match(noTrio.errors[0], /^Found no three entries in the palette of the picture/);
  assert.match(noTrio.errors[0], /load the bitmap/);
  pass('problems return as messages: disabled/absent silent, walker warning, no picture, vanished sprite or effect, bad sprite, no palette trio');
}

// ---- 4. the palette of a presentation whose nested data holds only pixels
{
  const rows = pixels;
  const slots = picturePalette;
  const image = readFxSourceImage({ palette: slots, data: { pixels: rows } });
  assert.deepEqual(image.palette[9], [7, 4, 4], 'slot 9 must keep its colour, not read as black');
  assert.deepEqual(image.palette[5], [2, 2, 7]);
  // a wrapped project asset still works as before
  assert.deepEqual(readFxSourceImage({ id: 'x', data: { palette: slots, pixels: rows } }).palette[9], [7, 4, 4]);
  // and the nested palette still wins when the asset has both
  const nested = readFxSourceImage({ palette: slots, data: { pixels: rows, palette: slots.map(entry => (entry.slotIndex === 9 ? { ...entry, hex: '#000000', masterIndex: 0 } : entry)) } });
  assert.deepEqual(nested.palette[9], [0, 0, 0]);
  pass('readFxSourceImage keeps the palette of an asset whose nested data has only pixels');
}

// ---- 5. the preview
{
  const config = defaultOrbitTetrahedronConfig(assets);
  const build = orbitTetrahedronForNode(node({ orbitTetrahedron: config }), assets, true);
  const preview = createOrbitPreview(build.result!, build.paletteBytes!, build.bitmapBytes!);
  assert.equal(preview.frameCount, 240);
  assert.equal(preview.delay, 1);
  const frame = new Uint8ClampedArray(ORBIT_PREVIEW_WIDTH * ORBIT_PREVIEW_HEIGHT * 4);
  const rgb = (x: number, y: number, buffer = frame) => Array.from(buffer.slice((y * ORBIT_PREVIEW_WIDTH + x) * 4, (y * ORBIT_PREVIEW_WIDTH + x) * 4 + 3));
  const colorOf = (slotIndex: number) => { const css = paletteEntryCss(build.paletteBytes!, slotIndex).match(/\d+/g)!.map(Number); return css; };
  preview.draw(0, frame);
  assert.deepEqual(rgb(3, 3), colorOf(1), 'a background pixel keeps the colour of palette entry 1');
  assert.equal(frame[3], 255, 'opaque');
  const entries = build.result!.paletteEntries;
  const dotColors = new Map([[entries.rim, 'rim'], [entries.highlight, 'highlight'], [entries.body, 'body']].map(([slotIndex, name]) => [colorOf(slotIndex as number).join(','), name as string]));
  // over the whole orbit, the three colours of the dot appear: body only exists where plane 1 is ORed with plane 0
  const seen = new Set<string>();
  let dotPixels = 0;
  const first = new Uint8ClampedArray(frame.length);
  for (let index = 0; index < preview.frameCount; index++) {
    preview.draw(index, frame);
    if (index === 0) first.set(frame);
    for (let at = 0; at < frame.length; at += 4) {
      const name = dotColors.get(`${frame[at]},${frame[at + 1]},${frame[at + 2]}`);
      if (name) { seen.add(name); dotPixels++; }
    }
  }
  assert.deepEqual([...seen].sort(), ['body', 'highlight', 'rim'], `the preview shows ${[...seen].join(', ')}: the CC/OR plane is not working`);
  assert.ok(dotPixels > 2000, `only ${dotPixels} dot pixels over the whole orbit`);
  // deterministic and wrapping
  const again = new Uint8ClampedArray(frame.length);
  preview.draw(0, again);
  assert.deepEqual(Array.from(again.slice(0, 4096)), Array.from(first.slice(0, 4096)));
  preview.draw(240, again);
  assert.deepEqual(Array.from(again), Array.from(first), 'frame 240 wraps to frame 0');
  preview.draw(60, again);
  assert.notDeepEqual(Array.from(again), Array.from(first), 'the animation does not move');
  // the picture is under the dots: where no dot is, every pixel of the preview equals the picture
  const pictureOnly = new Uint8ClampedArray(frame.length);
  createOrbitPreview({ ...build.result!, frameBlocks: [[0, ...Array(32).fill(0).map((_unused, index) => (index % 4 === 0 ? 0xd0 : 0))]] }, build.paletteBytes!, build.bitmapBytes!).draw(0, pictureOnly);
  assert.deepEqual(rgb(128, 106, pictureOnly), colorOf(9), 'the ellipse is painted with palette entry 9');
  assert.deepEqual(rgb(10, 10, pictureOnly), colorOf(1));
  pass(`preview: picture with its palette, rim/highlight/body all appear (${dotPixels} dot pixels), deterministic, wraps at 240`);
}

console.log(`\n${checks.length} checks passed`);

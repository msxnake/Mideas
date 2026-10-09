import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'work', 'msx2-sprite-part-offsets');
mkdirSync(output, { recursive: true });
const modulePath = join(output, 'helpers.mjs');
await build({ stdin: { contents: `
export { resolveMsx2SpriteParts, composeMsx2SpriteFrame, msx2SpriteScanlineCounts, orderMsx2SpriteCells } from './utils/msx2SpriteComposition';
export { calculateMsx2SpriteFrameHardwareUsage } from './utils/msx2HardwareSpriteUsage';
export { buildHardwareSpriteLayersForFrame } from './utils/msxGenerator/generators/msx2/msx2Screen4Generator';
export { generateModularASM } from './utils/msxGenerator/index';
export { DEFAULT_SCREEN5_CUSTOM_PALETTE } from './constants';
`, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: modulePath, logLevel: 'silent' });
const impl = await import(pathToFileURL(modulePath).href);
const palette = impl.DEFAULT_SCREEN5_CUSTOM_PALETTE;
const frame = Array.from({ length: 48 }, () => Array(16).fill(palette[0].hex));
// Different OR pairs in A/B/C. The overlap/result pixel needs both planes.
[[1, 4, 5], [4, 10, 14], [1, 10, 11]].forEach((colors, cell) => {
  for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) frame[cell * 16 + y][x] = palette[colors[x % 3]].hex;
});
const second = frame.map(row => [...row]);
second[35][9] = palette[1].hex;
const sprite = {
  id: 'offset_sprite', name: 'Offset A B C', target: 'MSX2', vdpMode: 'SCREEN5',
  size: { width: 16, height: 48 }, palette, backgroundColor: palette[0].hex,
  frames: [{ id: 'one', data: frame }, { id: 'two', data: second }], currentFrameIndex: 0,
  animationSpeedMs: 160, loops: true, facingDirection: 'right',
  hardware: { x: 96, y: 64, color: 4, patternIndex: 0, useOrColor: true },
};
const originalFrames = JSON.stringify(sprite.frames);
const base = sprite.frames.map((_frame, index) => impl.buildHardwareSpriteLayersForFrame(sprite, 4, index));
assert.equal(base[0].length, 6);
assert.deepEqual(impl.composeMsx2SpriteFrame(sprite).pixels, frame, 'old assets retain their original pixels');
assert.equal(impl.calculateMsx2SpriteFrameHardwareUsage(sprite.id, sprite.name, sprite, 0).worstScanlineHardwareSprites, 2);
sprite.superSpriteLayout = 'custom';
sprite.superSpriteParts = impl.resolveMsx2SpriteParts(sprite);
Object.assign(sprite.superSpriteParts[1], { offsetX: 3, offsetY: 18 });
Object.assign(sprite.superSpriteParts[2], { offsetX: -4, offsetY: 29 });
assert.equal(JSON.stringify(sprite.frames), originalFrames, 'offsets never rewrite source pixels');
const shape = layers => layers.map(({ pattern, colors }) => ({ pattern, colors }));
for (const [index, expected] of base.entries()) {
  const layers = impl.buildHardwareSpriteLayersForFrame(sprite, 4, index);
  assert.deepEqual(shape(layers), shape(expected), 'all frame patterns and OR colors stay identical');
  assert.deepEqual(layers.map(layer => [layer.xOffset, layer.yOffset]), [[0, 0], [0, 0], [3, 18], [3, 18], [-4, 29], [-4, 29]]);
  const composed = impl.composeMsx2SpriteFrame(sprite, index);
  assert.equal(composed.originX, -4);
  assert.equal(composed.width, 23);
  assert.equal(composed.pixels[30][1], sprite.frames[index].data[33][1], 'negative offset retains C pixels');
  const mirrored = impl.composeMsx2SpriteFrame(sprite, index, true);
  const c = mirrored.parts[2];
  assert.equal(c.offsetX, 4);
  assert.equal(mirrored.pixels[30][c.offsetX - mirrored.originX + 14], sprite.frames[index].data[33][1]);
}
assert.equal(impl.calculateMsx2SpriteFrameHardwareUsage(sprite.id, sprite.name, sprite, 0).worstScanlineHardwareSprites, 4, 'B/C overlap occupies four sprite slots');
const overlap = structuredClone(sprite);
Object.assign(overlap.superSpriteParts[1], { offsetY: 8 });
Object.assign(overlap.superSpriteParts[2], { offsetY: 12 });
assert.equal(impl.calculateMsx2SpriteFrameHardwareUsage(overlap.id, overlap.name, overlap, 0).worstScanlineHardwareSprites, 6);
assert.equal(impl.composeMsx2SpriteFrame(overlap).pixels[13][6], frame[13][2], 'A keeps priority in overlapping parts');
const restored = JSON.parse(JSON.stringify(sprite));
assert.deepEqual(impl.buildHardwareSpriteLayersForFrame(restored, 4, 1), impl.buildHardwareSpriteLayersForFrame(sprite, 4, 1), 'JSON round trip retains offsets and frames');
assert.deepEqual(impl.orderMsx2SpriteCells(sprite, [{ x: -4, y: 29 }, { x: 3, y: 18 }, { x: 0, y: 0 }]), [{ x: 0, y: 0 }, { x: 3, y: 18 }, { x: -4, y: 29 }]);

const fixture = JSON.parse(readFileSync(join(root, 'test/msx2-screen5-fg/fg_fastcopy_fixture.json'), 'utf8'));
const asset = fixture.assets.find(asset => asset.id === 'smoke_player_sprite');
asset.data = { ...sprite, id: asset.id };
const logs = { log: console.log, warn: console.warn };
let files;
try {
  console.log = console.warn = () => {};
  files = impl.generateModularASM('msx2_part_offsets_smoke', fixture.assets, { generateUnified: true, romMode: 'megarom', targetFormat: 'konami', screenMode: fixture.screenMode });
} finally { Object.assign(console, logs); }
const asm = files['unitedFiles.asm'] || files['unifiedFiles.asm'];
assert(asm?.includes('bitmap_update_sprite_sat:'), 'real SCREEN 5 SAT routine emitted');
assert.match(asm, /add a, 3\s+; cell col \+3px/);
assert.match(asm, /add a, 252\s+; cell col \+-4px/);
assert.match(asm, /add a, 18\s+; cell row \+18px/);
assert.match(asm, /\.ply_slot_2_x_mirror:/, 'mirror also repositions the cell');
writeFileSync(join(output, 'offsets-fixture.json'), JSON.stringify(fixture, null, 2));
writeFileSync(join(output, 'offsets-smoke.asm'), asm);
console.log('PASS: three independent parts, OR, two frames, signed offsets, overlap budget, mirror, persistence and real SCREEN 5 export.');
console.log(`ASM: ${join(output, 'offsets-smoke.asm')}`);

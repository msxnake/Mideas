// Contract test for the AI Game Sketch exporter (Files > Export Sketch IA).
// Run: npx tsx scripts/test_game_sketch_export.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { buildGameSketch, GAME_SKETCH_SCHEMA } from '../utils/gameSketch/buildGameSketch';
import { scale2x, scale3x, createImage, setPixel } from '../utils/gameSketch/png';
import { conditionToNatural, conditionToPseudo } from '../utils/gameSketch/rulesToText';

const project = JSON.parse(readFileSync(new URL('../Examples/mini_game75.json', import.meta.url), 'utf8'));

const run = (scale: number, scaleMethod: 'smooth' | 'nearest') => buildGameSketch({
  assets: project.assets,
  currentProjectName: 'Sketch Test',
  currentScreenMode: project.currentScreenMode,
  componentDefinitions: project.componentDefinitions,
  entityTemplates: project.entityTemplates,
  msxFont: project.msxFont,
  msxFontColorAttributes: project.msxFontColorAttributes,
  options: { scale, scaleMethod },
  now: new Date('2026-01-01T00:00:00Z'),
});

const pngSize = (bytes: Uint8Array) => {
  const b = Buffer.from(bytes);
  assert.equal(b.toString('hex', 0, 8), '89504e470d0a1a0a', 'PNG signature');
  const w = b.readUInt32BE(16);
  const h = b.readUInt32BE(20);
  const idat: Buffer[] = [];
  let o = 8;
  while (o < b.length) {
    const len = b.readUInt32BE(o);
    if (b.toString('ascii', o + 4, o + 8) === 'IDAT') idat.push(b.subarray(o + 8, o + 8 + len));
    o += 12 + len;
  }
  assert.equal(inflateSync(Buffer.concat(idat)).length, (w * 4 + 1) * h, 'PNG pixel payload');
  return { w, h };
};

const r = run(3, 'smooth');
const byPath = new Map(r.files.map(f => [f.path, f.content]));
assert.equal(r.rootFolder, 'sketch_test_ai_sketch');

// Mandatory files
for (const p of ['README_AI.md', 'game_sketch.json', 'graphics/palette.json', 'graphics/tileset_atlas.json',
  'rules/state_machines.md', 'rules/game_flow.md', 'rules/glossary.json', 'audio/AUDIO_SPEC.md']) {
  assert.ok(byPath.has(p), `missing ${p}`);
}

const sketch = JSON.parse(byPath.get('game_sketch.json') as string);
assert.equal(sketch.schema, GAME_SKETCH_SCHEMA);
assert.deepEqual(sketch.graphics.scales, ['x1', 'x3']);
assert.equal(sketch.summary.genreGuess, 'platformer (flip-screen)');
assert.ok(sketch.summary.players.includes('Player'));
assert.equal(sketch.screens.length, 7);
assert.ok(sketch.stateMachines.length >= 1);

// Screens: 32x24 grids, ASCII collision map, x1 and x3 images
const screenRef = sketch.screens[0];
const screen = JSON.parse(byPath.get(screenRef.file) as string);
assert.equal(screen.layers.background.length, 24);
assert.equal(screen.layers.background[0].length, 32);
assert.equal(screen.collisionMap.rows.length, 24);
assert.ok(screen.collisionMap.rows.every((row: string) => row.length === 32));
assert.ok(screen.collisionMap.rows.join('').includes('#'), 'screen has solid cells');
assert.deepEqual(pngSize(byPath.get(screen.image.x1) as Uint8Array), { w: 256, h: 192 });
assert.deepEqual(pngSize(byPath.get(screen.image.x3) as Uint8Array), { w: 768, h: 576 });
const player = screen.entities.find((e: any) => e.templateName === 'Player');
assert.ok(player, 'player placed in first screen');
assert.equal(player.pixel.x, player.cell.x * 8);
assert.ok(player.resolvedComponents.Gravity, 'resolved components include template defaults');

// Sprites: sheet = frames side by side
const hero = sketch.graphics.sprites.find((s: any) => s.name === 'hero');
assert.equal(hero.frameCount, 4);
assert.deepEqual(pngSize(byPath.get(hero.images.sheet.x1) as Uint8Array), { w: 64, h: 16 });
assert.deepEqual(pngSize(byPath.get(hero.images.sheet.x3) as Uint8Array), { w: 192, h: 48 });

// Rules in natural language + pseudocode
const smMd = byPath.get('rules/state_machines.md') as string;
assert.match(smMd, /collides with an enemy/);
assert.match(smMd, /stateDiagram-v2/);
assert.equal(conditionToPseudo({ type: 'KEY_PRESSED', params: { key: 'KeyN' } } as any), 'input.is_pressed("N")');
assert.equal(
  conditionToNatural({ type: 'AND', conditions: [{ type: 'KEY_PRESSED', params: { key: 'ArrowLeft' } }, { type: 'CAN_MOVE_DIRECTION', params: { direction: 'left' } }] } as any, { name: () => null }),
  '(the player is pressing LEFT) AND (the entity can move left (no solid tile blocks it))'
);

// Audio
const song = JSON.parse(byPath.get(sketch.audio.music[0].file) as string);
assert.equal(song.schema, 'mideas.sketch.song.v1');
assert.ok(song.patterns[0].events.some((e: any) => e.frequencyHz > 0));
assert.ok(byPath.has(sketch.audio.music[0].instrumentsFile));
const sfx = JSON.parse(byPath.get(sketch.audio.soundEffects[0].file) as string);
assert.ok(sfx.durationMs > 0);

// Scale 1 => only x1 graphics
const r1 = run(1, 'nearest');
assert.ok(!r1.files.some(f => f.path.startsWith('graphics/x2') || f.path.startsWith('graphics/x3')));

// Scale filters keep the palette and size
const img = createImage(2, 2);
setPixel(img, 0, 0, [255, 0, 0, 255]);
setPixel(img, 1, 1, [0, 0, 255, 255]);
const s2 = scale2x(img);
const s3 = scale3x(img);
assert.equal(s2.width, 4);
assert.equal(s3.width, 6);
const colors = new Set<string>();
for (let i = 0; i < s3.data.length; i += 4) colors.add(Array.from(s3.data.slice(i, i + 4)).join(','));
assert.ok(colors.size <= 3, 'Scale3x does not invent colours');

console.log(`OK game sketch export: ${r.files.length} files, ${r.warnings.length} warnings`);

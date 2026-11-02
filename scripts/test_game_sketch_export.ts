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

// Semantics must match the live Play mode (GameFlowPreviewModal), not dead code
{
  const comps = sketch.entities.components as any[];
  const gravity = comps.find(c => c.id === 'comp_gravity');
  const jump = comps.find(c => c.id === 'comp_jump');
  assert.ok(gravity.formulas.some((f: string) => f.includes('0x40')), 'gravity uses the Z80 8.8 constants');
  assert.ok(gravity.ignoredByPlayMode.includes('strength'));
  assert.ok(jump.ignoredByPlayMode.includes('jumpPower'));
  assert.ok(sketch.engineRules?.screenExits?.length > 0, 'engine rules exported');
  // Placed entities spawn at cell*8 or at Patrol waypoint1; Position is not exported as if it were used
  const platform = screen.entities.find((e: any) => e.templateName === 'e_platform_multi');
  assert.deepEqual([platform.spawnPixel.x, platform.spawnPixel.y], [189, 24]);
  assert.ok(!player.resolvedComponents.Position, 'ignored Position is not presented as spawn data');
  assert.ok(screen.collisionMap.blockingChars.includes('#'));
}
{
  const r0 = { name: () => null };
  assert.equal(conditionToPseudo({ type: 'TIME_OUT', params: { duration: 60 } } as any), 'state_time_frames >= 60');
  const { actionToNatural } = await import('../utils/gameSketch/rulesToText');
  assert.equal(
    actionToNatural({ type: 'ADD_VARIABLES', params: { targetVariable: 'Score', operand1Type: 'variable', operand1Variable: 'Score', operand2Type: 'constant', operand2Value: 10 } } as any, r0),
    'Score = Score + 10'
  );
  const { buildStateMachineSketch } = await import('../utils/gameSketch/rulesToText');
  const anySm = buildStateMachineSketch({
    id: 'sm', name: 'sm', initialStateId: 's1', events: [],
    states: [{ id: 's1', name: 'Idle' }, { id: 's2', name: 'Dead' }],
    transitions: [{ id: 't', fromStateId: '__ANY_STATE__', toStateId: 's2', conditions: { type: 'HAS_DEADLY_TILE_COLLISION' } }],
  } as any, r0);
  assert.match(anySm.transitions[0].natural, /^In ANY state/);
  assert.match(anySm.mermaid, /AnyState --> Dead/);
}

// Audio
const song =JSON.parse(byPath.get(sketch.audio.music[0].file) as string);
assert.equal(song.schema, 'mideas.sketch.song.v1');
assert.ok(song.patterns[0].events.some((e: any) => e.frequencyHz > 0));
assert.ok(byPath.has(sketch.audio.music[0].instrumentsFile));
const sfx = JSON.parse(byPath.get(sketch.audio.soundEffects[0].file) as string);
assert.ok(sfx.durationMs > 0);

// WAV: RIFF/WAVE 16-bit mono 44.1 kHz, songs carry a smpl loop chunk
const wavChunks = (bytes: Uint8Array) => {
  const b = Buffer.from(bytes);
  assert.equal(b.toString('ascii', 0, 4), 'RIFF');
  assert.equal(b.toString('ascii', 8, 12), 'WAVE');
  const chunks: Record<string, Buffer> = {};
  let o = 12;
  while (o < b.length) {
    const len = b.readUInt32LE(o + 4);
    chunks[b.toString('ascii', o, o + 4)] = b.subarray(o + 8, o + 8 + len);
    o += 8 + len;
  }
  return chunks;
};
const songWav = wavChunks(byPath.get(sketch.audio.music[0].wavFile) as Uint8Array);
assert.equal(songWav['fmt '].readUInt16LE(2), 1, 'mono');
assert.equal(songWav['fmt '].readUInt32LE(4), 44100, 'sample rate');
assert.equal(songWav['fmt '].readUInt16LE(14), 16, '16-bit');
assert.ok(songWav.data.length > 44100, 'song has audio');
assert.ok(songWav.smpl, 'song WAV has loop points');
assert.equal(song.wav.loop.startSample, songWav.smpl.readUInt32LE(44));
let songPeak = 0;
for (let i = 0; i < songWav.data.length; i += 2) songPeak = Math.max(songPeak, Math.abs(songWav.data.readInt16LE(i)));
assert.ok(songPeak > 1000, 'song WAV is not silent');
const sfxWav = wavChunks(byPath.get(sketch.audio.soundEffects[0].wavFile) as Uint8Array);
assert.equal(sfxWav.data.length / 2, Math.round((sfx.durationMs * 44100) / 1000), 'sfx length matches its steps');
assert.ok(!sfxWav.smpl, 'sfx is one-shot');

// Single A-4 square note renders at 440 Hz with exact row timing and loop point
{
  const { renderSongToWav } = await import('../utils/gameSketch/audioRender');
  const empty = () => ({ note: null, instrument: null, ornament: null, volume: null });
  const rows = Array.from({ length: 16 }, () => ({ A: empty(), B: empty(), C: empty() })) as any[];
  rows[0].A = { note: 'A-4', instrument: 1, ornament: null, volume: 15 };
  const r = renderSongToWav({
    id: 't', name: 't', soundChip: 'PSG', bpm: 125, speed: 6, globalVolume: 15,
    patterns: [{ id: 'p', name: 'p', numRows: 16, rows }], order: [0, 0], lengthInPatterns: 2, restartPosition: 1,
    instruments: [{ id: 1, name: 'square' }], ornaments: [], currentPatternIndexInOrder: 0,
  } as any);
  assert.equal(r.durationMs, 3840);
  assert.equal(r.loopStartSample, Math.ceil((16 * 120 * 44.1) / 1024) * 1024, 'loop starts on the block boundary where its first row is applied');
  const data = wavChunks(r.wav).data;
  const N = 22050;
  const goertzel = (f: number) => {
    let s1 = 0, s2 = 0;
    const c = 2 * Math.cos((2 * Math.PI * f) / 44100);
    for (let i = 0; i < N; i++) {
      const s = data.readInt16LE(2 * (i + 1000)) / 32768 + c * s1 - s2;
      s2 = s1;
      s1 = s;
    }
    return Math.sqrt(s1 * s1 + s2 * s2 - c * s1 * s2);
  };
  assert.ok(goertzel(440) > 10 * goertzel(400), 'A-4 renders at 440 Hz');
}

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

// PT3 through the real player (public/audio/pt3-render-worker.js run in a vm "worker")
{
  const { runInContext, createContext } = await import('node:vm');
  const { resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { computePt3LoopFrame } = await import('../utils/gameSketch/pt3CowbellRender');
  const workerPath = fileURLToPath(new URL('../public/audio/pt3-render-worker.js', import.meta.url));
  const pt3 = new Uint8Array(readFileSync(new URL('../pt3/PT3/CASTLEVA/wicked child.pt3', import.meta.url)));
  const msg: any = await new Promise((ok, fail) => {
    const ctx: any = { console, Math, Uint8Array, Float32Array, Array, Object, Error };
    ctx.self = ctx;
    ctx.globalThis = ctx;
    ctx.importScripts = (...files: string[]) => files.forEach(f => runInContext(readFileSync(resolve(dirname(workerPath), f), 'utf8'), ctx));
    ctx.postMessage = (m: any) => (m.error ? fail(new Error(m.error)) : ok(m));
    createContext(ctx);
    runInContext(readFileSync(workerPath, 'utf8'), ctx);
    ctx.onmessage({ data: { id: 1, bytes: pt3.slice().buffer, sampleRate: 44100, playbackHz: 50 } });
  });
  assert.equal(msg.complete, true);
  assert.equal(new Float32Array(msg.samples).length, msg.frameCount * 882);
  const loop = computePt3LoopFrame({
    playbackBackend: 'external-pt3', bpm: 125, speed: 3, patterns: [], order: [], restartPosition: 0,
    instruments: [], ornaments: [], externalPt3Data: Array.from(pt3), externalPt3HasHeader: true,
  } as any);
  assert.equal(loop.timelineFrames, msg.frameCount, 'PT3 timeline matches the real player frame count');
  assert.equal(loop.loopStartFrame, 1024, 'loop starts at order[2]');
}

console.log(`OK game sketch export: ${r.files.length} files, ${r.warnings.length} warnings`);

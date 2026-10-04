#!/usr/bin/env node
/**
 * Builds test/msx2-intro/fixture_intro.json: a SCREEN 5 bitmap-room project whose GameFlow is
 *   Start -> Music -> Screen5Presentation -> Transition -> Intro -> WorldLink -> End
 * with a two-slide Intro (image + two text zones + a custom font) and a PSG track, so the
 * ROM can be smoke-tested in OpenMSX with music playing during the intro.
 *
 *   node scripts/build_msx2_intro_test_project.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/msx2-bitmap-intro/bitmap_intro_test.json'), 'utf8'));
// INTRO_DONOR picks the project that lends its track + font (to try another music driver).
const donor = JSON.parse(fs.readFileSync(path.join(ROOT, process.env.INTRO_DONOR || 'test/msx2-boss/fixture_test606.json'), 'utf8'));

const presentation = base.assets.find(a => a.type === 'msx2presentation');
const palette = presentation.data.palette.map(slot => ({ ...slot }));

// Deterministic 256x192 art: sky bands, sun, mountains, ground. Slots 1..15 of the palette.
const W = 256, H = 192;
const pixels = Array.from({ length: H }, (_u, y) => Array.from({ length: W }, (_v, x) => {
  if (y > 150) return 5 + ((x >> 4) & 1);                       // ground checker
  const dx = x - 190, dy = y - 50;
  if (dx * dx + dy * dy < 28 * 28) return 10;                   // sun
  const ridge = 120 - Math.abs(((x + 40) % 96) - 48);           // mountains
  if (y > ridge) return 12;
  return 1 + Math.min(3, Math.floor(y / 40));                   // sky bands
}));

const art = {
  id: 'intro_art_presentation',
  name: 'Intro Art',
  type: 'msx2presentation',
  data: {
    ...presentation.data, name: 'Intro Art', sourceFileName: null, sourceImageWidth: W, sourceImageHeight: H,
    width: W, height: H, palette, pixels, packedBitmap: [],
  },
};

const track = donor.assets.find(a => a.type === 'track');
const font = donor.assets.find(a => a.type === 'msx2hudfont');
if (!track || !font) throw new Error('donor fixture lost its track/font');

const zone = (id, name, rect, extra = {}) => ({ id, name, rect, fg: 15, bg: 1, lineSpacing: 10, charDelayFrames: 2, ...extra });
const intro = {
  id: 'intro_test_asset',
  name: 'Test Intro',
  type: 'msx2intro',
  data: {
    id: 'intro_test_asset', name: 'Test Intro', target: 'MSX2', fontAssetId: undefined,
    slides: [
      {
        id: 'slide_a', name: 'Sunrise', backgroundColor: 1, palette,
        images: [{ id: 'img_a', name: 'Sun', sourceAssetId: art.id, crop: { x: 0, y: 0, w: 256, h: 192 }, dest: { x: 32, y: 8, w: 192, h: 120 } }],
        textZones: [zone('z_a', 'Body', { x: 16, y: 136, w: 224, h: 48 })],
        steps: [
          { id: 's1', zoneId: 'z_a', text: 'LONG AGO A SMALL ADVENTURER LEFT HOME.', clearBefore: true, autoAdvanceFrames: 0 },
          { id: 's2', zoneId: 'z_a', text: 'THE ROAD WAS LONG AND THE NIGHTS WERE COLD.', clearBefore: true, autoAdvanceFrames: 0 },
        ],
        transitionIn: 'cut', transitionOut: 'cut',
      },
      {
        id: 'slide_b', name: 'Custom font', backgroundColor: 2, palette,
        images: [{ id: 'img_b', name: 'Mountains', sourceAssetId: art.id, crop: { x: 0, y: 60, w: 256, h: 90 }, dest: { x: 64, y: 40, w: 128, h: 48 } }],
        textZones: [
          zone('z_t', 'Title', { x: 64, y: 8, w: 128, h: 16 }, { fontAssetId: font.id, bg: 2 }),
          zone('z_b', 'Body', { x: 24, y: 100, w: 208, h: 60 }, { fontAssetId: font.id, bg: 2 }),
        ],
        steps: [
          { id: 's3', zoneId: 'z_t', text: 'CHAPTER ONE', clearBefore: true, autoAdvanceFrames: 0 },
          { id: 's4', zoneId: 'z_b', text: 'PRESS SPACE TO SKIP THE TYPING OR TO GO ON.', clearBefore: true, autoAdvanceFrames: 0 },
        ],
        transitionIn: 'cut', transitionOut: 'cut',
      },
    ],
  },
};

// INTRO_FADE=1: slide 1 fades in and out, slide 2 fades in (palette fades, see check_msx2_intro_fade.mjs).
if (process.env.INTRO_FADE) {
  intro.data.slides[0].transitionIn = 'fade';
  intro.data.slides[0].transitionOut = 'fade';
  intro.data.slides[1].transitionIn = 'fade';
}

// INTRO_MONO=1: both images are 1 bpp. Slide 2's image is 124 px wide (not a multiple of 8) to
// exercise the padded last byte of every row. check_msx2_intro_smoke.mjs compares VRAM byte-exact.
if (process.env.INTRO_MONO) {
  intro.data.slides[0].images[0].mono = { ink: 10, paper: 1 };
  intro.data.slides[1].images[0].mono = { ink: 12, paper: 2 };
  intro.data.slides[1].images[0].dest.w = 124;
}

const project = JSON.parse(JSON.stringify(base));
project.assets.push(art, track, font, intro);
const flow = project.assets.find(a => a.type === 'msx2gameflow').data;
const connectionFrom = id => flow.connections.find(c => c.from.nodeId === id && !c.from.sourceId);
const startId = flow.startNodeId;
const world = flow.nodes.find(n => n.type === 'WorldLink');
const transition = flow.nodes.find(n => n.type === 'Transition');
const pres = flow.nodes.find(n => n.type === 'Screen5Presentation');
flow.nodes.push(
  { id: 'gf_test_music', type: 'Music', position: { x: 200, y: 200 }, stop: false, autoPlay: true, trackAssetId: track.id, loop: true },
  { id: 'gf_test_intro', type: 'Intro', position: { x: 400, y: 200 }, introAssetId: intro.id },
);
// Start -> Music -> Presentation ; Transition -> Intro -> WorldLink
flow.connections = flow.connections.filter(c => !(c.from.nodeId === startId || c.from.nodeId === transition.id));
flow.connections.push(
  { id: 'c_start_music', from: { nodeId: startId }, to: { nodeId: 'gf_test_music' } },
  { id: 'c_music_pres', from: { nodeId: 'gf_test_music' }, to: { nodeId: pres.id } },
  { id: 'c_trans_intro', from: { nodeId: transition.id }, to: { nodeId: 'gf_test_intro' } },
  { id: 'c_intro_world', from: { nodeId: 'gf_test_intro' }, to: { nodeId: world.id } },
);
void connectionFrom;

// INTRO_MUSIC picks the Intro's own music option for the intermission variant:
//   track (default) -> starts the track, none -> silence, keep -> leave it untouched.
const introMusic = process.env.INTRO_MUSIC || (process.env.INTRO_MIDGAME ? 'track' : 'keep');
if (introMusic === 'track') intro.data.musicTrackAssetId = track.id;
else if (introMusic === 'none') intro.data.musicTrackAssetId = '__none';

// INTRO_MIDGAME=1: Start -> Music -> Presentation -> Transition -> WorldLink -> Intro -> WorldLink2 -> End,
// i.e. the intro plays BETWEEN two zones (the case of an intermission).
if (process.env.INTRO_MIDGAME) {
  const end = flow.nodes.find(n => n.type === 'End');
  const world2 = { ...JSON.parse(JSON.stringify(world)), id: 'gf_test_world2', position: { x: 700, y: 200 } };
  flow.nodes.push(world2);
  flow.connections = flow.connections.filter(c => !(c.from.nodeId === 'gf_test_intro' || c.to.nodeId === 'gf_test_intro' || c.from.nodeId === world.id));
  flow.connections.push(
    { id: 'c_trans_world1', from: { nodeId: transition.id }, to: { nodeId: world.id } },
    { id: 'c_world1_intro', from: { nodeId: world.id }, to: { nodeId: 'gf_test_intro' } },
    { id: 'c_intro_world2', from: { nodeId: 'gf_test_intro' }, to: { nodeId: world2.id } },
    { id: 'c_world2_end', from: { nodeId: world2.id }, to: { nodeId: end.id } },
  );
}

const out = path.join(ROOT, process.env.INTRO_MIDGAME ? 'test/msx2-intro/fixture_intro_midgame.json' : 'test/msx2-intro/fixture_intro.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(project));
console.log(`wrote ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB); font ${font.id}, track ${track.id}`);

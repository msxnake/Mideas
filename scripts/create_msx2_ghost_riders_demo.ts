/**
 * Build an MSX2 SCREEN 5 project whose job is to play one chiptune chorus.
 *
 * The scene is deliberately thin -- a night sky over a mesa horizon -- because
 * the point of the project is the PSG song, not the room. The SCREEN 5 bitmap
 * backend autoplays track 0 on a loop whenever the GameFlow has no Music node,
 * so simply shipping a `track` asset is enough to get music at boot.
 *
 *   node scripts/create_msx2_ghost_riders_demo.mjs
 *   python scripts/build_mideas_unified_rom.py --json json/ghost_riders_msx2.json \
 *     --asm-output server/temp/ghost_riders.asm --rom-output server/temp/ghost_riders.rom
 */
import fs from 'node:fs';
import path from 'node:path';
import { PT3_FACTORY_INSTRUMENTS } from '../utils/audio/pt3FactoryInstruments';

// The .mjs wrapper bundles this file into server/temp, so the repo root cannot
// come from import.meta.url. Run it from the repository root.
const root = process.cwd();
const outJson = path.join(root, 'json', 'ghost_riders_msx2.json');

// --------------------------------------------------------------------------
// Palette: a cold night with two warm accents for the mesa and the moon.
// --------------------------------------------------------------------------
const palette = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 2, masterIndex: 9, hex: '#000024' },   // deep night
  { slotIndex: 3, masterIndex: 18, hex: '#000049' },  // horizon glow
  { slotIndex: 4, masterIndex: 27, hex: '#00246D' },
  { slotIndex: 5, masterIndex: 159, hex: '#496DFF' },
  { slotIndex: 6, masterIndex: 292, hex: '#929292' },
  { slotIndex: 7, masterIndex: 365, hex: '#B6B6B6' },
  { slotIndex: 8, masterIndex: 511, hex: '#FFFFFF' },
  { slotIndex: 9, masterIndex: 433, hex: '#DBDB24' },  // moon
  { slotIndex: 10, masterIndex: 436, hex: '#DBDB92' },
  { slotIndex: 11, masterIndex: 329, hex: '#B62424' }, // mesa shadow
  { slotIndex: 12, masterIndex: 457, hex: '#FF2424' },
  { slotIndex: 13, masterIndex: 480, hex: '#FF9200' },
  { slotIndex: 14, masterIndex: 73, hex: '#246D24' },
  { slotIndex: 15, masterIndex: 405, hex: '#DB49B6' },
];

// --------------------------------------------------------------------------
// Atlas: 256x16, four 16x16 entries. Slot 0 must stay empty so an unset
// tileGrid cell paints nothing.
// --------------------------------------------------------------------------
const ATLAS_W = 256;
const ATLAS_H = 16;
const atlasPixels = Array.from({ length: ATLAS_H }, () => Array(ATLAS_W).fill(2));

const paint = (slot, fn) => {
  const x0 = slot * 16;
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const value = fn(x, y);
      if (value !== null) atlasPixels[y][x0 + x] = value;
    }
  }
};

// 0: empty night sky.
paint(0, () => 2);
// 1: sky with a scatter of stars.
paint(1, (x, y) => {
  if ((x === 3 && y === 2) || (x === 11 && y === 6) || (x === 6 && y === 12)) return 8;
  if ((x === 14 && y === 9) || (x === 1 && y === 8)) return 7;
  return 2;
});
// 2: mesa ridge -- a lit top edge over a dark body.
paint(2, (x, y) => {
  const ridge = 6 + Math.floor(Math.sin(x / 5) * 2);
  if (y === ridge) return 11;
  if (y > ridge) return 1;
  return 2;
});
// 3: solid mesa body.
paint(3, () => 1);

const atlasEntries = [
  { id: 'sky_plain', name: 'Night Sky', sx: 0, sy: 0, w: 16, h: 16 },
  { id: 'sky_stars', name: 'Stars', sx: 16, sy: 0, w: 16, h: 16 },
  { id: 'mesa_ridge', name: 'Mesa Ridge', sx: 32, sy: 0, w: 16, h: 16 },
  { id: 'mesa_body', name: 'Mesa Body', sx: 48, sy: 0, w: 16, h: 16 },
];

// Room is 16x12 cells of 16x16 px = 256x192.
const COLS = 16;
const ROWS = 12;
const grid = (fill) => Array.from({ length: ROWS }, () => Array(COLS).fill(fill));

// tileGrid is 1-based: 0 paints nothing and N selects atlasEntries[N-1].
const SKY = 1;
const STARS = 2;
const RIDGE = 3;
const BODY = 4;

const tileGrid = grid(SKY);
[[1, 2], [4, 1], [7, 3], [10, 0], [13, 2], [2, 5], [9, 5], [14, 4]].forEach(([cx, cy]) => {
  tileGrid[cy][cx] = STARS;
});
for (let cx = 0; cx < COLS; cx += 1) {
  tileGrid[9][cx] = RIDGE;
  tileGrid[10][cx] = BODY;
  tileGrid[11][cx] = BODY;
}

// ==========================================================================
// The song: chorus of "(Ghost) Riders in the Sky" (Stan Jones, 1948),
// transcribed by ear for a personal tracker test.
//
// A natural minor. 16 rows per 4/4 bar, so 4 rows = one quarter note. At
// bpm 125 / speed 6 a row lasts 2500*6/125 = 120 ms, which puts the gallop at
// a walking 125 BPM and makes the 8-bar chorus run ~15 s.
// ==========================================================================
const PATTERN_ROWS = 64; // 4 bars
const emptyCell = () => ({ note: '---', instrument: null, ornament: null, volume: null });
const emptyRows = () => Array.from({ length: PATTERN_ROWS }, () => ({
  A: emptyCell(), B: emptyCell(), C: emptyCell(),
}));

const put = (rows, channel, row, note, instrument, volume = 15) => {
  if (row < 0 || row >= PATTERN_ROWS) return;
  rows[row][channel] = { note, instrument, ornament: null, volume };
};

const INS_LEAD = 1;
const INS_HARMONY = 2;
const INS_BASS = 3;
const INS_HOOF = 4;

/**
 * Melody, as [row, note] against a 4-bar pattern.
 *
 * Bars 1-4 are the two "yippie-i-oh / yippie-i-ay" calls: a rising A minor
 * arpeggio that falls back through the fifth. Bars 5-8 are the title line,
 * a long stepwise descent that resolves onto the tonic.
 */
const chorusPartOne = [
  // "Yip-pie-i-oh"
  [0, 'A-4'], [4, 'C-5'], [8, 'E-5'], [12, 'A-5'],
  // held, then easing down
  [16, 'A-5'], [24, 'G-5'], [28, 'E-5'],
  // "Yip-pie-i-ay"
  [32, 'A-4'], [36, 'C-5'], [40, 'E-5'], [44, 'A-5'],
  [48, 'A-5'], [56, 'G-5'], [60, 'E-5'],
];

const chorusPartTwo = [
  // "Ghost rid-ers..."
  [0, 'A-5'], [8, 'G-5'], [12, 'F-5'],
  // "...in the sky"
  [16, 'E-5'], [20, 'D-5'], [24, 'C-5'],
  [32, 'A-4'],
  // tail: the riders trail off into the distance
  [48, 'E-4'], [56, 'A-4'],
];

/** Harmony a minor third / fourth under the lead, quieter. */
const harmonyPartOne = [
  [0, 'A-3'], [4, 'A-3'], [8, 'C-4'], [12, 'E-4'],
  [16, 'E-4'], [24, 'E-4'], [28, 'C-4'],
  [32, 'A-3'], [36, 'A-3'], [40, 'C-4'], [44, 'E-4'],
  [48, 'E-4'], [56, 'E-4'], [60, 'C-4'],
];

const harmonyPartTwo = [
  [0, 'F-4'], [8, 'E-4'], [12, 'D-4'],
  [16, 'C-4'], [20, 'B-3'], [24, 'A-3'],
  [32, 'A-3'],
  [48, 'C-4'], [56, 'A-3'],
];

/**
 * The horse gallop that gives the tune its character: a dotted "da-da-DUM"
 * on every beat rather than a flat pulse.
 */
const layGallop = (rows, rootByBar) => {
  for (let bar = 0; bar < 4; bar += 1) {
    const root = rootByBar[bar];
    for (let beat = 0; beat < 4; beat += 1) {
      const base = bar * 16 + beat * 4;
      put(rows, 'C', base, root, INS_BASS, 14);
      put(rows, 'C', base + 2, root, INS_HOOF, 9);
      put(rows, 'C', base + 3, root, INS_HOOF, 7);
    }
  }
};

const buildPatterns = () => {
  const first = emptyRows();
  const second = emptyRows();

  chorusPartOne.forEach(([row, note]) => put(first, 'A', row, note, INS_LEAD, 15));
  chorusPartTwo.forEach(([row, note]) => put(second, 'A', row, note, INS_LEAD, 15));
  harmonyPartOne.forEach(([row, note]) => put(first, 'B', row, note, INS_HARMONY, 11));
  harmonyPartTwo.forEach(([row, note]) => put(second, 'B', row, note, INS_HARMONY, 11));

  layGallop(first, ['A-2', 'A-2', 'A-2', 'A-2']);
  layGallop(second, ['F-2', 'C-3', 'A-2', 'A-2']);

  return [
    { id: 'ghost_riders_chorus_a', name: 'Chorus (call)', numRows: PATTERN_ROWS, rows: first },
    { id: 'ghost_riders_chorus_b', name: 'Chorus (answer)', numRows: PATTERN_ROWS, rows: second },
  ];
};

/**
 * Instruments come from the factory PT3 kit rather than hand-written volume
 * envelopes.
 *
 * This is not cosmetic: the SCREEN 5 bitmap music runtime only emits its PT3
 * step decoder when the project actually contains `pt3-sample` instruments.
 * With classic envelope instruments the ROM assembles and reads the melody --
 * the AY tone periods do change -- but the amplitude registers and the mixer
 * are never opened, so it plays in total silence.
 */
const factory = (index: number, id: number, name: string) => {
  const template = PT3_FACTORY_INSTRUMENTS[index] as Record<string, unknown>;
  if (!template) throw new Error(`Factory PT3 instrument ${index} is missing.`);
  return { ...template, id, name };
};

const instruments = [
  // "Bright Lead" loops on step 0, so a held note keeps ringing over the gallop.
  factory(10, INS_LEAD, 'Spectral Lead'),
  factory(10, INS_HARMONY, 'Night Choir'),
  factory(9, INS_BASS, 'Saddle Bass'),
  factory(4, INS_HOOF, 'Hoofbeat'),
];

const buildTrackAsset = () => {
  const patterns = buildPatterns();
  const order = [0, 1];
  return {
    id: 'ghost_riders_track',
    name: 'Ghost Riders Chorus',
    type: 'track',
    data: {
      id: 'ghost_riders_track',
      name: 'Ghost Riders Chorus',
      soundChip: 'PSG',
      title: 'Ghost Riders (chorus)',
      author: 'personal tracker test',
      bpm: 125,
      speed: 6,
      globalVolume: 15,
      patterns,
      order,
      lengthInPatterns: order.length,
      restartPosition: 0,
      instruments,
      ornaments: [],
      currentPatternIndexInOrder: 0,
      currentPatternId: patterns[0].id,
      ayHardwareEnvelopePeriod: 1,
      ayNoisePeriod: 12,
      playbackBackend: 'native',
    },
  };
};

const roomAsset = {
  id: 'ghost_riders_room',
  name: 'Ghost Riders Sky',
  type: 'msx2bitmaproom',
  data: {
    id: 'ghost_riders_room',
    name: 'Ghost Riders Sky',
    target: 'MSX2',
    vdpMode: 'SCREEN5_BITMAP_ROOM',
    width: 256,
    height: 192,
    palette,
    backgroundColor: 2,
    atlas: { width: ATLAS_W, height: ATLAS_H, offscreenBaseY: 320, pixels: atlasPixels, entries: atlasEntries },
    composition: { source: 'authored', commands: [] },
    tileGrid,
    collision: grid(0),
    effects: grid(0),
    behavior: grid(0),
    entities: [],
    playerEntries: [],
    runtime: {
      screenKind: 'playable',
      screenEngine: 'player',
      movementMode: 'platform',
      movementModel: 'platform',
      activeAreaX: 0,
      activeAreaY: 0,
      activeAreaWidth: COLS,
      activeAreaHeight: ROWS,
      showHud: false,
      statusHud: false,
    },
    notes: 'Scene for a personal SCREEN 5 chiptune test. The music is the point.',
  },
};

const worldAsset = {
  id: 'ghost_riders_world',
  name: 'Ghost Riders World',
  type: 'worldmap',
  data: {
    id: 'ghost_riders_world',
    name: 'Ghost Riders World',
    nodes: [{ id: 'wmnode_sky', screenAssetId: 'ghost_riders_room', name: 'Sky', position: { x: 0, y: 0 } }],
    connections: [],
    startScreenNodeId: 'wmnode_sky',
  },
};

const project = {
  name: 'ghost_riders_msx2',
  currentScreenMode: 'SCREEN 4 (Graphics II)',
  screenMode: 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2Screen5BitmapRoom',
  assets: [roomAsset, worldAsset, buildTrackAsset()],
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');

const track = project.assets.find(asset => asset.type === 'track').data;
const rowMs = (2500 * track.speed) / track.bpm;
const totalRows = track.order.length * PATTERN_ROWS;
console.log(`Project JSON written: ${outJson}`);
console.log(`Song: ${track.patterns.length} patterns, ${totalRows} rows, ${rowMs.toFixed(0)} ms/row -> ${(totalRows * rowMs / 1000).toFixed(1)} s per loop`);

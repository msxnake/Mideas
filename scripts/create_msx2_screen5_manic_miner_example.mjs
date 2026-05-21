import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'Examples', 'msx2_screen4_manic_miner_example.json');
const outPng = path.join(root, 'screenshots', 'msx2_screen4_manic_miner_example.png');
const outBackgroundPng = path.join(root, 'screenshots', 'msx2_screen4_manic_miner_tiles.png');
const WIDTH = 256;
const HEIGHT = 192;
const TILE_SIZE = 16;
const WIDTH_TILES = 16;
const HEIGHT_TILES = 12;

const palette = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 2, masterIndex: 113, hex: '#24DB24' },
  { slotIndex: 3, masterIndex: 251, hex: '#6DFF6D' },
  { slotIndex: 4, masterIndex: 79, hex: '#2424FF' },
  { slotIndex: 5, masterIndex: 159, hex: '#496DFF' },
  { slotIndex: 6, masterIndex: 329, hex: '#B62424' },
  { slotIndex: 7, masterIndex: 183, hex: '#49DBFF' },
  { slotIndex: 8, masterIndex: 457, hex: '#FF2424' },
  { slotIndex: 9, masterIndex: 475, hex: '#FF6D6D' },
  { slotIndex: 10, masterIndex: 433, hex: '#DBDB24' },
  { slotIndex: 11, masterIndex: 436, hex: '#DBDB92' },
  { slotIndex: 12, masterIndex: 97, hex: '#249224' },
  { slotIndex: 13, masterIndex: 405, hex: '#DB49B6' },
  { slotIndex: 14, masterIndex: 365, hex: '#B6B6B6' },
  { slotIndex: 15, masterIndex: 511, hex: '#FFFFFF' },
];

const pixels = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(1));

const rect = (x, y, w, h, color) => {
  for (let yy = Math.max(0, y); yy < Math.min(HEIGHT, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(WIDTH, x + w); xx++) {
      pixels[yy][xx] = color;
    }
  }
};

const platform = (x, y, w, color = 5) => {
  rect(x, y, w, 3, 15);
  rect(x, y + 3, w, 5, color);
  for (let xx = x; xx < x + w; xx += 8) rect(xx, y + 3, 4, 5, color === 5 ? 4 : 6);
};

const ladder = (x, y, h) => {
  rect(x, y, 2, h, 10);
  rect(x + 8, y, 2, h, 10);
  for (let yy = y; yy < y + h; yy += 8) rect(x, yy, 10, 2, 10);
};

const hazard = (x, y, count) => {
  for (let i = 0; i < count; i++) {
    rect(x + i * 10, y, 7, 2, 8);
    rect(x + i * 10 + 2, y + 2, 3, 5, 9);
  }
};

const door = (x, y) => {
  rect(x, y, 18, 26, 13);
  rect(x + 3, y + 3, 12, 20, 1);
  rect(x + 6, y + 6, 6, 14, 7);
};

platform(0, 180, 256, 4);
platform(18, 164, 84, 5);
platform(136, 164, 98, 5);
platform(0, 126, 56, 6);
platform(88, 126, 82, 5);
platform(198, 126, 58, 6);
platform(34, 88, 86, 5);
platform(156, 88, 76, 6);
platform(0, 50, 76, 4);
platform(116, 50, 98, 5);
ladder(66, 88, 76);
ladder(180, 50, 114);
ladder(24, 50, 76);
hazard(112, 172, 6);
hazard(18, 118, 4);
door(222, 98);
rect(118, 30, 4, 20, 7);
rect(122, 26, 12, 4, 15);
rect(134, 30, 4, 20, 7);
rect(122, 42, 12, 4, 10);
rect(44, 150, 8, 8, 10);
rect(152, 112, 8, 8, 10);
rect(196, 72, 8, 8, 10);
const bitmapPixels = pixels.map(row => [...row]);

const spriteRows = [
  '0000555500000000',
  '0005555550000000',
  '0005222250000000',
  '0005252250000000',
  '0005222250000000',
  '0000888800000000',
  '0008888880000000',
  '0058888885000000',
  '0058888885000000',
  '0000888800000000',
  '0000555500000000',
  '0000505000000000',
  '0000505000000000',
  '0000505000000000',
  '0005000500000000',
  '0055000550000000',
];
const spritePixels = spriteRows.map(row => row.split('').map(ch => Number(ch)));
const playerX = 74;
const playerY = 148;

for (let y = 0; y < spritePixels.length; y++) {
  for (let x = 0; x < spritePixels[y].length; x++) {
    const color = spritePixels[y][x];
    if (color) pixels[playerY + y][playerX + x] = color;
  }
}

const tileKey = tilePixels => tilePixels.map(row => row.join(',')).join('|');
const msx2Tiles = [];
const tileIndexByKey = new Map();
const map = Array.from({ length: HEIGHT_TILES }, (_, tileY) =>
  Array.from({ length: WIDTH_TILES }, (_, tileX) => {
    const tilePixels = Array.from({ length: TILE_SIZE }, (_unused, y) =>
      Array.from({ length: TILE_SIZE }, (_unused2, x) =>
        bitmapPixels[(tileY * TILE_SIZE) + y]?.[(tileX * TILE_SIZE) + x] ?? 1
      )
    );
    const key = tileKey(tilePixels);
    if (!tileIndexByKey.has(key)) {
      tileIndexByKey.set(key, msx2Tiles.length);
      msx2Tiles.push({
        id: `manic_miner_tile_${msx2Tiles.length}`,
        name: `Manic Miner Tile ${msx2Tiles.length}`,
        pixels: tilePixels,
      });
    }
    return tileIndexByKey.get(key);
  })
);
const collisionMap = Array.from({ length: HEIGHT_TILES }, (_, y) =>
  Array.from({ length: WIDTH_TILES }, (_, x) => {
    const tileIndex = map[y][x];
    const tile = msx2Tiles[tileIndex]?.pixels || [];
    const solidPixels = tile.flat().filter(slot => slot === 4 || slot === 5 || slot === 6 || slot === 15).length;
    return solidPixels > 80 ? 1 : 0;
  })
);
const emptyLayer = Array.from({ length: HEIGHT_TILES }, () => Array(WIDTH_TILES).fill(0));
const effectsLayer = Array.from({ length: HEIGHT_TILES }, () => Array(WIDTH_TILES).fill(0));
const behaviorLayer = Array.from({ length: HEIGHT_TILES }, () => Array(WIDTH_TILES).fill(0));

const markCells = (layer, cells, value) => {
  for (const [x, y] of cells) {
    if (layer[y] && x >= 0 && x < WIDTH_TILES) layer[y][x] = value;
  }
};

markCells(effectsLayer, [[7, 10], [8, 10], [9, 10], [10, 10], [1, 7], [2, 7]], 1);
markCells(effectsLayer, [[14, 6], [14, 7]], 2);
markCells(effectsLayer, [[2, 9], [9, 7], [12, 4]], 3);
for (let y = 5; y <= 9; y++) markCells(behaviorLayer, [[4, y]], 1);
for (let y = 3; y <= 9; y++) markCells(behaviorLayer, [[11, y]], 1);
for (let y = 3; y <= 7; y++) markCells(behaviorLayer, [[1, y]], 1);

const project = {
  name: 'MSX2 SCREEN 4 Manic Miner example',
  currentScreenMode: 'SCREEN 4 (Graphics II)',
  screenMode: 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-pattern',
  dataFormat: 'hex',
  assets: [
    {
      id: 'palette_msx2_manic_miner',
      name: 'MSX2 Platform Palette',
      type: 'palette',
      data: {
        mode: 'SCREEN4',
        slots: palette,
        notes: 'Default V9938 RGB333 SCREEN 4 palette for the example.',
      },
    },
    {
      id: 'screen_msx2_manic_miner_room',
      name: 'Manic Miner Style Room',
      type: 'msx2screen',
      data: {
        id: 'screen_msx2_manic_miner_room',
        name: 'Manic Miner Style Room',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        tileSize: TILE_SIZE,
        widthTiles: WIDTH_TILES,
        heightTiles: HEIGHT_TILES,
        palette,
        tiles: msx2Tiles,
        map,
        collisionMap,
        layers: {
          collision: collisionMap,
          effects: effectsLayer,
          behavior: behaviorLayer,
          entities: [
            {
              id: 'entity_msx2_platform_player',
              name: 'MSX2 Platform Player',
              kind: 'player',
              position: { x: Math.floor(playerX / TILE_SIZE), y: Math.floor(playerY / TILE_SIZE) },
              spriteAssetId: 'sprite_msx2_platform_player',
              params: { runtime: 'MSX2', engine: 'player', movementMode: 'platform' },
            },
            {
              id: 'entity_manic_patrol_guard',
              name: 'Patrol Guard',
              kind: 'enemy',
              position: { x: 9, y: 7 },
              params: {
                runtime: 'MSX2',
                engine: 'patrolX',
                movement: 'patrolX',
                minX: 8,
                maxX: 11,
                direction: 1,
                speed: 3,
              },
            },
          ],
        },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          movementMode: 'platform',
          movementModel: 'platform',
          requiredCollectibles: 3,
          initialAir: 255,
          activeAreaX: 0,
          activeAreaY: 0,
          activeAreaWidth: WIDTH_TILES,
          activeAreaHeight: HEIGHT_TILES,
        },
        notes: 'SCREEN 4 tile room generated from 16x16 pattern cells.',
      },
    },
    {
      id: 'sprite_msx2_platform_player',
      name: 'MSX2 Platform Player',
      type: 'msx2sprite',
      data: {
        id: 'sprite_msx2_platform_player',
        name: 'MSX2 Platform Player',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        size: { width: 16, height: 16 },
        palette,
        backgroundColor: 'rgba(0,0,0,0)',
        frames: [{ id: 'frame_player_idle', data: spritePixels.map(row => row.map(color => color ? palette[color].hex : 'rgba(0,0,0,0)')) }],
        currentFrameIndex: 0,
        animationSpeedMs: 140,
        loops: true,
        hitbox: { width: 10, height: 15, offsetX: 3, offsetY: 1 },
        hardware: { x: playerX, y: playerY, color: 8, patternIndex: 0, useOrColor: true },
      },
    },
  ],
  mainMenuConfig: { isEnabled: false, options: [], keyMapping: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', fire1: ' ', fire2: 'm' } },
  selectedEntityInstanceId: null,
  selectedEffectZoneId: null,
};

function hexToRgb(hex) {
  if (hex.startsWith('rgba')) return [0, 0, 0, 255];
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255,
  ];
}

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function writePng(filePath, sourcePixels = pixels) {
  const raw = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  let offset = 0;
  for (let y = 0; y < HEIGHT; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < WIDTH; x++) {
      const [r, g, b, a] = hexToRgb(palette[sourcePixels[y][x]].hex);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
writePng(outPng, pixels);
writePng(outBackgroundPng, bitmapPixels);
console.log(`Example JSON: ${outJson}`);
console.log(`Screenshot PNG: ${outPng}`);
console.log(`Tile-source PNG: ${outBackgroundPng}`);

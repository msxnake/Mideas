import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'json', 'snake_msx2_mideas.json');

const palette = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 2, masterIndex: 73, hex: '#246D24' },
  { slotIndex: 3, masterIndex: 113, hex: '#24DB24' },
  { slotIndex: 4, masterIndex: 145, hex: '#49DB49' },
  { slotIndex: 5, masterIndex: 511, hex: '#FFFFFF' },
  { slotIndex: 6, masterIndex: 448, hex: '#FF0000' },
  { slotIndex: 7, masterIndex: 480, hex: '#FF9200' },
  { slotIndex: 8, masterIndex: 504, hex: '#FFFF00' },
  { slotIndex: 9, masterIndex: 23, hex: '#0049FF' },
  { slotIndex: 10, masterIndex: 39, hex: '#0092FF' },
  { slotIndex: 11, masterIndex: 365, hex: '#B6B6B6' },
  { slotIndex: 12, masterIndex: 146, hex: '#49FF49' },
  { slotIndex: 13, masterIndex: 292, hex: '#929292' },
  { slotIndex: 14, masterIndex: 63, hex: '#00FFFF' },
  { slotIndex: 15, masterIndex: 455, hex: '#FF00FF' },
];

const fillTile = slot => Array.from({ length: 16 }, () => Array(16).fill(slot));
const tileFromRows = rows => rows.map(row => row.split('').map(ch => Number(ch)));

const floorTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (x === 0 || y === 0) return 2;
    if (x % 8 === 0 || y % 8 === 0) return 2;
    return 1;
  })
);

const wallTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (x < 2 || x > 13 || y < 2 || y > 13) return 10;
    if (x < 4 || x > 11 || y < 4 || y > 11) return 9;
    return 14;
  })
);

const snakeBodyTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const dx = Math.abs(x - 7.5);
    const dy = Math.abs(y - 7.5);
    if (dx < 6.5 && dy < 5.5) return (x + y) % 3 === 0 ? 12 : 3;
    if (dx < 7.5 && dy < 6.5) return 4;
    return 1;
  })
);

const appleTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const dx = x - 7.5;
    const dy = y - 8;
    if (y < 4 && x >= 7 && x <= 9) return 3;
    if (dx * dx + dy * dy < 26) return x < 8 ? 6 : 7;
    if (dx * dx + dy * dy < 34) return 8;
    return 1;
  })
);

const exitTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (x < 2 || x > 13 || y < 2 || y > 13) return 14;
    if ((x + y) % 4 < 2) return 8;
    return 5;
  })
);

const hazardTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (x === y || x + y === 15 || x < 2 || x > 13 || y < 2 || y > 13 ? 15 : 6))
);

const msx2Tiles = [
  { id: 'snake_tile_floor', name: 'Dark grid floor', pixels: floorTile },
  { id: 'snake_tile_wall', name: 'Arena wall', pixels: wallTile },
  { id: 'snake_tile_body', name: 'Snake body block', pixels: snakeBodyTile },
  { id: 'snake_tile_apple', name: 'Apple collectible', pixels: appleTile },
  { id: 'snake_tile_exit', name: 'Open exit', pixels: exitTile },
  { id: 'snake_tile_hazard', name: 'Hazard marker', pixels: hazardTile },
];

const mapRows = [
  '1111111111111111',
  '1000000000000001',
  '1000300000003001',
  '1000002200000001',
  '1000000200000001',
  '1000000200030001',
  '1000300000000001',
  '1000000002200001',
  '1000000000200001',
  '1003000000200001',
  '1000000300000001',
  '1000000000000001',
  '1000000000000041',
  '1111111111111111',
];

const map = mapRows.map(row => row.split('').map(ch => Number(ch)));
const collision = mapRows.map(row => row.split('').map(ch => (ch === '1' || ch === '2' ? 1 : 0)));
const effects = mapRows.map(row =>
  row.split('').map(ch => {
    if (ch === '3') return 3;
    if (ch === '4') return 2;
    return 0;
  })
);
const behavior = Array.from({ length: 14 }, () => Array(16).fill(0));

const snakeHeadFrame = tileFromRows([
  '0000333333000000',
  '0003333333300000',
  '0033333333330000',
  '0333333333333000',
  '0333353335333000',
  '0333353335333000',
  '0333333333333000',
  '0333333333333000',
  '0333333333333000',
  '0333333333333000',
  '0033333883330000',
  '0003338883300000',
  '0000333333000000',
  '0000033330000000',
  '0000003300000000',
  '0000000000000000',
]).map(row => row.map(slot => (slot ? palette[slot].hex : 'rgba(0,0,0,0)')));

const project = {
  name: 'snake_msx2_mideas',
  currentProjectName: 'snake_msx2_mideas',
  currentScreenMode: 'SCREEN 5 (Graphics III)',
  screenMode: 'SCREEN 5 (Graphics III)',
  targetGraphicsBackend: 'msx2-screen5-tile16',
  selectedAssetId: 'screen_snake_msx2_arena',
  currentEditor: 'Msx2Screen',
  assets: [
    {
      id: 'palette_snake_msx2',
      name: 'Snake MSX2 Palette',
      type: 'palette',
      data: {
        mode: 'SCREEN5',
        slots: palette,
        notes: 'V9938 SCREEN 5 palette for a green Snake arena with red apples.',
      },
    },
    {
      id: 'screen_snake_msx2_arena',
      name: 'Snake Arena',
      type: 'msx2screen',
      data: {
        id: 'screen_snake_msx2_arena',
        name: 'Snake Arena',
        target: 'MSX2',
        vdpMode: 'SCREEN5',
        tileSize: 16,
        widthTiles: 16,
        heightTiles: 14,
        palette,
        tiles: msx2Tiles,
        map,
        collisionMap: collision,
        layers: {
          collision,
          effects,
          behavior,
          entities: [
            {
              id: 'entity_snake_head',
              name: 'Snake Head',
              kind: 'player',
              position: { x: 3, y: 11 },
              spriteAssetId: 'sprite_snake_head_msx2',
              params: {},
            },
            {
              id: 'entity_patrol_tail_1',
              name: 'Moving tail hazard',
              kind: 'enemy',
              position: { x: 12, y: 6 },
              params: { movement: 'patrolY', minY: 2, maxY: 10, direction: 1, speed: 3 },
            },
            {
              id: 'entity_patrol_tail_2',
              name: 'Moving body hazard',
              kind: 'enemy',
              position: { x: 5, y: 2 },
              params: { movement: 'patrolX', minX: 2, maxX: 13, direction: 1, speed: 2 },
            },
          ],
        },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          movementMode: 'maze',
          snakeGrowth: {
            enabled: true,
            bodyTileIndex: 2,
            maxPendingSegments: 15,
          },
          requiredCollectibles: 6,
          initialAir: 255,
          activeAreaX: 0,
          activeAreaY: 0,
          activeAreaWidth: 16,
          activeAreaHeight: 14,
          hideHud: true,
        },
        notes: 'Snake-style MSX2 arena: collect all six apples, avoid walls/body hazards, then reach the exit tile.',
      },
    },
    {
      id: 'sprite_snake_head_msx2',
      name: 'Snake Head Sprite',
      type: 'msx2sprite',
      data: {
        id: 'sprite_snake_head_msx2',
        name: 'Snake Head Sprite',
        target: 'MSX2',
        vdpMode: 'SCREEN5',
        size: { width: 16, height: 16 },
        palette,
        backgroundColor: 'rgba(0,0,0,0)',
        frames: [{ id: 'frame_snake_head_idle', data: snakeHeadFrame }],
        currentFrameIndex: 0,
        animationSpeedMs: 100,
        loops: true,
        hitbox: { width: 12, height: 12, offsetX: 2, offsetY: 2 },
        hardware: { x: 48, y: 176, color: 3, patternIndex: 0, useOrColor: true },
      },
    },
    {
      id: 'world_snake_msx2',
      name: 'Snake World',
      type: 'worldmap',
      data: {
        id: 'world_snake_msx2',
        name: 'Snake World',
        nodes: [
          {
            id: 'world_node_snake_arena',
            screenAssetId: 'screen_snake_msx2_arena',
            name: 'Arena',
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
        startScreenNodeId: 'world_node_snake_arena',
        gridSize: 64,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
      },
    },
    {
      id: 'gameflow_snake_msx2',
      name: 'Main',
      type: 'gameflow',
      data: {
        id: 'gameflow_snake_msx2',
        name: 'Main',
        startNodeId: 'gf_start',
        panOffset: { x: 0, y: 0 },
        zoomLevel: 1,
        nodes: [
          { id: 'gf_start', type: 'Start', position: { x: 0, y: 0 } },
          {
            id: 'gf_world',
            type: 'WorldLink',
            worldAssetId: 'world_snake_msx2',
            position: { x: 180, y: 0 },
          },
        ],
        connections: [
          {
            id: 'gf_start_to_world',
            from: { nodeId: 'gf_start', handle: 'default' },
            to: { nodeId: 'gf_world', handle: 'input' },
            type: 'default',
          },
        ],
      },
    },
  ],
  mainMenuConfig: {
    title: 'SNAKE MSX2',
    subtitle: 'Collect apples and reach the exit',
    isEnabled: false,
    options: ['START'],
    selectedOptionIndex: 0,
    keyMapping: {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
      fire1: ' ',
      fire2: 'm',
    },
  },
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(outJson);

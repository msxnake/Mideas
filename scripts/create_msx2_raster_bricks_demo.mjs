import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'test', 'msx2-screen4', 'raster-bricks', 'msx2-raster-bricks-project.json');

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

function brickTile(fill, shade, light, crack = false) {
  return Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => {
      if (x === 0 || x === 15 || y === 0 || y === 15) return 1;
      if ((y === 7 || y === 8) && x > 1 && x < 14) return 1;
      if ((y < 7 && x === 8) || (y > 8 && x === 5)) return 1;
      if (crack && ((x === 11 && y >= 3 && y <= 5) || (x === 10 && y === 6) || (x === 9 && y === 7) || (x === 7 && y >= 10 && y <= 12))) return 1;
      if ((y === 1 || y === 9) && x > 1 && x < 14) return light;
      if ((x + y) % 7 === 0) return shade;
      if (y > 11 || x > 12) return shade;
      return fill;
    })
  );
}

const tiles = [
  { id: 'brick_blank', name: 'Black', pixels: Array.from({ length: 16 }, () => Array(16).fill(1)) },
  { id: 'brick_red', name: 'Red Brick', pixels: brickTile(8, 6, 9) },
  { id: 'brick_gold', name: 'Gold Brick', pixels: brickTile(10, 6, 11) },
  { id: 'brick_dark', name: 'Dark Brick', pixels: brickTile(6, 1, 8, true) },
  { id: 'brick_hot', name: 'Hot Brick', pixels: brickTile(9, 8, 15, true) },
];

const map = Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if ((x + y) % 11 === 0) return 4;
    if ((x * 3 + y) % 7 === 0) return 2;
    if ((x + y) % 4 === 0) return 3;
    return 1;
  })
);

const emptyLayer = Array.from({ length: 12 }, () => Array(16).fill(0));

const gameFlow = {
  id: 'msx2_gameflow_raster_bricks',
  name: 'MSX2 Raster Bricks GameFlow',
  purpose: 'screen4-runtime',
  startNodeId: 'start',
  panOffset: { x: 0, y: 0 },
  zoomLevel: 1,
  nodes: [
    { id: 'start', type: 'Start', position: { x: 20, y: 80 } },
    {
      id: 'bricks',
      type: 'Screen4Screen',
      position: { x: 220, y: 80 },
      screenAssetId: 'screen_msx2_raster_bricks',
      waitForKey: false,
      waitFrames: 210,
    },
    {
      id: 'raster',
      type: 'Transition',
      position: { x: 460, y: 80 },
      effect: 'raster_diagonal_corner',
      durationFrames: 48,
    },
    {
      id: 'world_ref_for_megarom_budget',
      type: 'WorldLink',
      position: { x: 220, y: 240 },
      worldAssetId: 'world_msx2_raster_bricks',
    },
    {
      id: 'end',
      type: 'End',
      position: { x: 700, y: 80 },
      waitForKey: false,
      waitFrames: 255,
    },
  ],
  connections: [
    { id: 'start_to_bricks', from: { nodeId: 'start', handle: 'default' }, to: { nodeId: 'bricks', handle: 'input' }, type: 'default' },
    { id: 'bricks_to_raster', from: { nodeId: 'bricks', handle: 'default' }, to: { nodeId: 'raster', handle: 'input' }, type: 'default' },
    { id: 'raster_to_end', from: { nodeId: 'raster', handle: 'default' }, to: { nodeId: 'end', handle: 'input' }, type: 'default' },
  ],
};

const project = {
  name: 'msx2_raster_bricks_demo',
  currentScreenMode: 'SCREEN 4 (Graphics II)',
  screenMode: 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-pattern',
  currentEditor: 'Msx2GameFlow',
  selectedAssetId: 'asset_msx2_gameflow_raster_bricks',
  assets: [
    {
      id: 'palette_msx2_raster_bricks',
      name: 'MSX2 Raster Bricks Palette',
      type: 'palette',
      data: { mode: 'SCREEN4', slots: palette },
    },
    {
      id: 'asset_screen_msx2_raster_bricks',
      name: 'MSX2 Raster Bricks Screen',
      type: 'msx2screen',
      data: {
        id: 'screen_msx2_raster_bricks',
        name: 'MSX2 Raster Bricks Screen',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        tileSize: 16,
        widthTiles: 16,
        heightTiles: 12,
        palette,
        tiles,
        map,
        collisionMap: emptyLayer,
        layers: {
          collision: emptyLayer,
          effects: emptyLayer,
          behavior: emptyLayer,
          entities: [],
        },
        runtime: {
          screenKind: 'cutscene',
          screenEngine: 'fakePlayer',
          requiredCollectibles: 0,
          initialAir: 255,
          showHud: false,
        },
        backgroundColor: 1,
        borderColor: 1,
      },
    },
    {
      id: 'asset_msx2_gameflow_raster_bricks',
      name: 'MSX2 Raster Bricks GameFlow',
      type: 'msx2gameflow',
      data: gameFlow,
    },
    {
      id: 'world_msx2_raster_bricks',
      name: 'MSX2 Raster Bricks World',
      type: 'worldmap',
      data: {
        id: 'world_msx2_raster_bricks',
        name: 'MSX2 Raster Bricks World',
        nodes: [
          {
            id: 'world_node_raster_bricks',
            name: 'Raster Bricks',
            screenAssetId: 'screen_msx2_raster_bricks',
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
        startScreenNodeId: 'world_node_raster_bricks',
        gridSize: 64,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
      },
    },
  ],
  mainMenuConfig: {
    isEnabled: false,
    options: [],
    keyMapping: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', fire1: ' ', fire2: 'm' },
  },
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(outJson);

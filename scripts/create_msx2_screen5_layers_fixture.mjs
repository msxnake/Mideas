import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'test', 'msx2-screen5', 'msx2screen-layers-project.json');

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

const tile = (slot) => Array.from({ length: 16 }, () => Array(16).fill(slot));
const platformTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (y < 3 ? 15 : x % 4 < 2 ? 4 : 5))
);
const wallTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (x < 3 || x > 12 || y < 3 || y > 12 ? 15 : 6))
);
const effectTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => ((x + y) % 2 === 0 ? 7 : 1))
);
const collectibleTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const dx = x - 7.5;
    const dy = y - 7.5;
    if ((dx * dx) + (dy * dy) < 28) return (x + y) % 2 === 0 ? 11 : 15;
    return 0;
  })
);
const ladderTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (x === 3 || x === 12 || y % 5 === 0 ? 7 : 0))
);
const conveyorTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y < 3) return 15;
    if ((x + y) % 6 < 3) return 8;
    return 6;
  })
);

const map = Array.from({ length: 14 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 10 && x >= 2 && x <= 12) return 1;
    if (y === 10 && x === 12) return 6;
    if (y === 9 && x === 8) return 2;
    if (y === 6 && x === 3) return 3;
    if (y === 4 && x === 12) return 3;
    if (y === 9 && x === 5) return 4;
    if ((y === 8 || y === 9) && x === 6) return 5;
    if (y === 9 && x === 7) return 4;
    if (y === 8 && x === 5) return 3;
    return 0;
  })
);

const exitMap = Array.from({ length: 14 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 10 && x >= 1 && x <= 15) return 1;
    if (y === 8 && x === 11) return 3;
    return 0;
  })
);

const collision = Array.from({ length: 14 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => ((y === 10 && x >= 2 && x <= 12) || (y === 9 && x === 8) ? 1 : 0))
);
const effects = Array.from({ length: 14 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 8 && x === 7) return 1; // jump hazard over the collectible
    if (y === 9 && x === 5) return 3; // second required collectible on the exit route
    if (y === 9 && x === 7) return 3; // collectible before the blocking wall
    return 0;
  })
);
const behavior = Array.from({ length: 14 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if ((y === 8 || y === 9) && x === 6) return 1;
    if (y === 10 && x === 12) return 2;
    return 0;
  })
);
const exitCollision = Array.from({ length: 14 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (y === 10 && x >= 1 && x <= 15 ? 1 : 0))
);
const exitEffects = Array.from({ length: 14 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (y >= 8 && y <= 10 && x >= 10 && x <= 15 ? 2 : 0))
);

const msx2Tiles = [
  { id: 'msx2_tile_blank', name: 'Blank', pixels: tile(0) },
  { id: 'msx2_tile_platform', name: 'Platform', pixels: platformTile },
  { id: 'msx2_tile_wall', name: 'Collision Wall', pixels: wallTile },
  { id: 'msx2_tile_effect', name: 'Effect Marker', pixels: effectTile },
  { id: 'msx2_tile_collectible', name: 'Collectible', pixels: collectibleTile },
  { id: 'msx2_tile_ladder', name: 'Ladder', pixels: ladderTile },
  { id: 'msx2_tile_conveyor', name: 'Conveyor Right', pixels: conveyorTile },
];

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

const spriteFrame = spriteRows.map(row =>
  row.split('').map(ch => {
    const slot = Number(ch);
    return slot ? palette[slot].hex : 'rgba(0,0,0,0)';
  })
);

const project = {
  name: 'msx2screen_layers_smoke',
  currentScreenMode: 'SCREEN 5 (Graphics III)',
  screenMode: 'SCREEN 5 (Graphics III)',
  targetGraphicsBackend: 'msx2-screen5-tile16',
  assets: [
    {
      id: 'palette_msx2_layers_smoke',
      name: 'MSX2 Layers Smoke Palette',
      type: 'palette',
      data: { mode: 'SCREEN5', slots: palette },
    },
    {
      id: 'screen_msx2_layers_smoke',
      name: 'MSX2 Layers Smoke Screen',
      type: 'msx2screen',
      data: {
        id: 'screen_msx2_layers_smoke',
        name: 'MSX2 Layers Smoke Screen',
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
              id: 'entity_msx2_player',
              name: 'Player',
              kind: 'player',
              position: { x: 6, y: 9 },
              spriteAssetId: 'sprite_msx2_layers_player',
              params: {},
            },
            {
              id: 'entity_msx2_enemy_left',
              name: 'Enemy Patrol',
              kind: 'enemy',
              position: { x: 3, y: 6 },
              params: { movement: 'patrolX', minX: 2, maxX: 6, direction: 1 },
            },
            {
              id: 'entity_msx2_enemy_right',
              name: 'Enemy Hazard Right',
              kind: 'enemy',
              position: { x: 5, y: 9 },
              params: {},
            },
            {
              id: 'entity_msx2_enemy_vertical',
              name: 'Enemy Vertical Patrol',
              kind: 'enemy',
              position: { x: 12, y: 4 },
              params: { movement: 'patrolY', minY: 3, maxY: 7, direction: 1 },
            },
          ],
        },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          requiredCollectibles: 2,
          initialAir: 255,
          activeAreaX: 0,
          activeAreaY: 0,
          activeAreaWidth: 16,
          activeAreaHeight: 14,
        },
      },
    },
    {
      id: 'screen_msx2_layers_exit',
      name: 'MSX2 Layers Exit Screen',
      type: 'msx2screen',
      data: {
        id: 'screen_msx2_layers_exit',
        name: 'MSX2 Layers Exit Screen',
        target: 'MSX2',
        vdpMode: 'SCREEN5',
        tileSize: 16,
        widthTiles: 16,
        heightTiles: 14,
        palette,
        tiles: msx2Tiles,
        map: exitMap,
        collisionMap: exitCollision,
        layers: {
          collision: exitCollision,
          effects: exitEffects,
          behavior: Array.from({ length: 14 }, () => Array(16).fill(0)),
          entities: [],
        },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          requiredCollectibles: 2,
          initialAir: 192,
          activeAreaX: 0,
          activeAreaY: 0,
          activeAreaWidth: 16,
          activeAreaHeight: 14,
        },
      },
    },
    {
      id: 'sprite_msx2_layers_player',
      name: 'MSX2 Layers Player',
      type: 'msx2sprite',
      data: {
        id: 'sprite_msx2_layers_player',
        name: 'MSX2 Layers Player',
        target: 'MSX2',
        vdpMode: 'SCREEN5',
        size: { width: 16, height: 16 },
        palette,
        backgroundColor: 'rgba(0,0,0,0)',
        frames: [{ id: 'frame_msx2_layers_player_idle', data: spriteFrame }],
        currentFrameIndex: 0,
        animationSpeedMs: 140,
        loops: true,
        hitbox: { width: 10, height: 15, offsetX: 3, offsetY: 1 },
        hardware: { x: 96, y: 144, color: 8, patternIndex: 0, useOrColor: true },
      },
    },
    {
      id: 'world_msx2_layers_smoke',
      name: 'MSX2 Layers Smoke World',
      type: 'worldmap',
      data: {
        id: 'world_msx2_layers_smoke',
        name: 'MSX2 Layers Smoke World',
        nodes: [
          {
            id: 'world_node_start',
            screenAssetId: 'screen_msx2_layers_smoke',
            name: 'Start Room',
            position: { x: 0, y: 0 },
          },
          {
            id: 'world_node_exit',
            screenAssetId: 'screen_msx2_layers_exit',
            name: 'Exit Room',
            position: { x: -96, y: 0 },
          },
        ],
        connections: [
          {
            id: 'world_start_to_exit_west',
            fromNodeId: 'world_node_start',
            toNodeId: 'world_node_exit',
            fromDirection: 'west',
            toDirection: 'east',
          },
          {
            id: 'world_exit_to_start_east',
            fromNodeId: 'world_node_exit',
            toNodeId: 'world_node_start',
            fromDirection: 'east',
            toDirection: 'west',
          },
        ],
        startScreenNodeId: 'world_node_start',
        gridSize: 64,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
      },
    },
    {
      id: 'gameflow_msx2_layers_smoke',
      name: 'MSX2 Layers Smoke GameFlow',
      type: 'gameflow',
      data: {
        id: 'gameflow_msx2_layers_smoke',
        name: 'MSX2 Layers Smoke GameFlow',
        startNodeId: 'gf_start',
        nodes: [
          { id: 'gf_start', type: 'Start', position: { x: 0, y: 0 } },
          {
            id: 'gf_world',
            type: 'WorldLink',
            worldAssetId: 'world_msx2_layers_smoke',
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
    isEnabled: false,
    options: [],
    keyMapping: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', fire1: ' ', fire2: 'm' },
  },
};

const startScreenAssetIndex = project.assets.findIndex(asset => asset.id === 'screen_msx2_layers_smoke');
const exitScreenAssetIndex = project.assets.findIndex(asset => asset.id === 'screen_msx2_layers_exit');
if (startScreenAssetIndex >= 0 && exitScreenAssetIndex > startScreenAssetIndex) {
  const [exitScreenAsset] = project.assets.splice(exitScreenAssetIndex, 1);
  project.assets.splice(startScreenAssetIndex, 0, exitScreenAsset);
}

fs.mkdirSync(path.dirname(outJson), { recursive: true });
const fixtureJson = `${JSON.stringify(project, null, 2)}\n`;
let existingMatches = false;
if (fs.existsSync(outJson)) {
  try {
    const existing = JSON.parse(fs.readFileSync(outJson, 'utf8'));
    existingMatches = `${JSON.stringify(existing, null, 2)}\n` === fixtureJson;
  } catch {
    existingMatches = false;
  }
}
if (!existingMatches) {
  const tempJson = `${outJson}.tmp`;
  fs.writeFileSync(tempJson, fixtureJson, 'utf8');
  fs.renameSync(tempJson, outJson);
}
console.log(outJson);

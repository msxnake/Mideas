import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'json', 'msx2_hud_example_mideas.json');

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

const tile = slot => Array.from({ length: 16 }, () => Array(16).fill(slot));
const platformTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (y < 3 ? 15 : x % 4 < 2 ? 4 : 5))
);
const wallTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (x < 3 || x > 12 || y < 3 || y > 12 ? 15 : 6))
);
const ladderTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (x === 3 || x === 12 || y % 5 === 0 ? 7 : 0))
);
const gemTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const dx = Math.abs(x - 7.5);
    const dy = Math.abs(y - 7.5);
    if (dx + dy < 7) return (x + y) % 2 === 0 ? 10 : 15;
    return 0;
  })
);
const heartTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const left = (x - 5) ** 2 + (y - 5) ** 2 < 12;
    const right = (x - 10) ** 2 + (y - 5) ** 2 < 12;
    const point = y > 5 && Math.abs(x - 7.5) + (y - 5) < 9;
    if (left || right || point) return y < 6 ? 9 : 8;
    return 0;
  })
);
const hudEnergyTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 2 || y === 9 || x === 0 || x === 15) return 15;
    if (y > 2 && y < 9 && x > 1 && x < 13) return 10;
    return 4;
  })
);
const hudAirTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 2 || y === 7 || x === 0 || x === 15) return 15;
    if (y > 2 && y < 7 && x > 1 && x < 11) return 7;
    return 4;
  })
);
const hudScoreTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 2 || y === 13 || x === 0 || x === 15) return 15;
    if ((x === 4 || x === 8 || x === 12) && y > 4 && y < 11) return 10;
    if ((y === 5 || y === 10) && x > 3 && x < 13) return 10;
    return 1;
  })
);
const hudRoomTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 2 || y === 13 || x === 0 || x === 15) return 15;
    if ((x + y) % 5 === 0) return 14;
    return 1;
  })
);

const map = Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 0) {
      if (x === 0) return 5;
      if (x >= 1 && x <= 4) return 6;
      if (x >= 6 && x <= 8) return 7;
      if (x >= 10 && x <= 12) return 8;
      if (x >= 14) return 9;
      return 0;
    }
    if (y === 1) return 0;
    if (y === 10 && x >= 1 && x <= 14) return 1;
    if (y === 8 && x >= 8 && x <= 11) return 1;
    if ((y === 6 || y === 7 || y === 8 || y === 9) && x === 5) return 3;
    if (y === 9 && x === 3) return 4;
    if (y === 9 && x === 12) return 2;
    return 0;
  })
);

const collision = Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (map[y][x] === 1 || map[y][x] === 2 ? 1 : 0))
);
const effects = Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (y === 9 && x === 3 ? 3 : 0))
);
const behavior = Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => ((y >= 6 && y <= 9 && x === 5) ? 1 : 0))
);

const msx2Tiles = [
  { id: 'msx2_hud_tile_blank', name: 'Blank', pixels: tile(0) },
  { id: 'msx2_hud_tile_platform', name: 'Platform', pixels: platformTile },
  { id: 'msx2_hud_tile_wall', name: 'Wall', pixels: wallTile },
  { id: 'msx2_hud_tile_ladder', name: 'Ladder', pixels: ladderTile },
  { id: 'msx2_hud_tile_gem', name: 'Collectible Gem', pixels: gemTile },
  { id: 'msx2_hud_tile_heart', name: 'HUD Heart Icon', pixels: heartTile },
  { id: 'msx2_hud_tile_energy_bar', name: 'HUD Energy Bar Tile', pixels: hudEnergyTile },
  { id: 'msx2_hud_tile_air_bar', name: 'HUD Air Bar Tile', pixels: hudAirTile },
  { id: 'msx2_hud_tile_score_panel', name: 'HUD Score Panel Tile', pixels: hudScoreTile },
  { id: 'msx2_hud_tile_room_panel', name: 'HUD Room Panel Tile', pixels: hudRoomTile },
];

const spriteRows = [
  '0000888800000000',
  '0008999980000000',
  '0008222280000000',
  '0008282280000000',
  '0008222280000000',
  '0000888800000000',
  '0000555500000000',
  '0000255200000000',
  '0000255200000000',
  '0000255200000000',
  '0000222200000000',
  '0000505000000000',
  '0000505000000000',
  '0005000500000000',
  '0055000550000000',
  '0000000000000000',
];

const spriteFrame = spriteRows.map(row =>
  row.split('').map(ch => {
    const slot = Number(ch);
    return slot ? palette[slot].hex : 'rgba(0,0,0,0)';
  })
);

const project = {
  name: 'msx2_hud_example_mideas',
  currentScreenMode: 'SCREEN 4 (Graphics II)',
  screenMode: 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-pattern',
  assets: [
    {
      id: 'palette_msx2_hud_example',
      name: 'MSX2 HUD Example Palette',
      type: 'palette',
      data: { mode: 'SCREEN4', slots: palette },
    },
    {
      id: 'screen_msx2_hud_example',
      name: 'MSX2 HUD Example Room',
      type: 'msx2screen',
      data: {
        id: 'screen_msx2_hud_example',
        name: 'MSX2 HUD Example Room',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        tileSize: 16,
        widthTiles: 16,
        heightTiles: 12,
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
              id: 'entity_msx2_hud_player',
              name: 'Player',
              kind: 'player',
              position: { x: 2, y: 9 },
              spriteAssetId: 'sprite_msx2_hud_player',
              params: {},
            },
          ],
        },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          requiredCollectibles: 1,
          initialAir: 192,
          activeAreaX: 0,
          activeAreaY: 2,
          activeAreaWidth: 16,
          activeAreaHeight: 10,
          showHud: true,
          statusHud: true,
          hudStyle: 'statusBars',
          playerEnergyMax: 16,
          playerEnergyInitial: 12,
          hudPrimaryColor: 10,
          hudSecondaryColor: 8,
          hudBorderColor: 15,
          hudEmptyColor: 4,
          hudWidgets: [
            {
              id: 'hud_player_energy',
              name: 'Player Energy',
              kind: 'bar',
              binding: 'playerEnergy',
              x: 8,
              y: 5,
              width: 64,
              height: 6,
              maxValue: 16,
              initialValue: 12,
              primaryColor: 10,
              borderColor: 15,
              emptyColor: 4,
            },
            {
              id: 'hud_air_timer',
              name: 'Air Timer',
              kind: 'bar',
              binding: 'air',
              x: 8,
              y: 15,
              width: 64,
              height: 4,
              maxValue: 255,
              initialValue: 192,
              primaryColor: 7,
              borderColor: 15,
              emptyColor: 4,
            },
            {
              id: 'hud_score',
              name: 'Score',
              kind: 'counter',
              binding: 'score',
              x: 104,
              y: 4,
              width: 48,
              height: 8,
              maxValue: 999,
              initialValue: 0,
              primaryColor: 15,
              secondaryColor: 10,
            },
            {
              id: 'hud_room_label',
              name: 'Room Label',
              kind: 'text',
              binding: 'custom',
              x: 166,
              y: 4,
              width: 56,
              height: 8,
              primaryColor: 15,
              text: 'ROOM 1',
              variableName: 'roomLabel',
            },
            {
              id: 'hud_life_icon',
              name: 'Life Icon',
              kind: 'icon',
              binding: 'lives',
              x: 232,
              y: 3,
              width: 16,
              height: 16,
              primaryColor: 15,
              iconTileIndex: 5,
            },
          ],
        },
      },
    },
    {
      id: 'sprite_msx2_hud_player',
      name: 'MSX2 HUD Player',
      type: 'msx2sprite',
      data: {
        id: 'sprite_msx2_hud_player',
        name: 'MSX2 HUD Player',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        size: { width: 16, height: 16 },
        palette,
        backgroundColor: 'rgba(0,0,0,0)',
        frames: [{ id: 'frame_msx2_hud_player_idle', data: spriteFrame }],
        currentFrameIndex: 0,
        animationSpeedMs: 140,
        loops: true,
        hitbox: { width: 10, height: 15, offsetX: 3, offsetY: 1 },
        hardware: { x: 32, y: 144, color: 8, patternIndex: 0, useOrColor: true },
      },
    },
    {
      id: 'world_msx2_hud_example',
      name: 'MSX2 HUD Example World',
      type: 'worldmap',
      data: {
        id: 'world_msx2_hud_example',
        name: 'MSX2 HUD Example World',
        nodes: [
          {
            id: 'world_node_msx2_hud_start',
            screenAssetId: 'screen_msx2_hud_example',
            name: 'HUD Room',
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
        startScreenNodeId: 'world_node_msx2_hud_start',
        gridSize: 64,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
      },
    },
    {
      id: 'gameflow_msx2_hud_example',
      name: 'MSX2 HUD Example GameFlow',
      type: 'gameflow',
      data: {
        id: 'gameflow_msx2_hud_example',
        name: 'MSX2 HUD Example GameFlow',
        startNodeId: 'gf_start',
        nodes: [
          { id: 'gf_start', type: 'Start', position: { x: 0, y: 0 } },
          {
            id: 'gf_world',
            type: 'WorldLink',
            worldAssetId: 'world_msx2_hud_example',
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

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(outJson);

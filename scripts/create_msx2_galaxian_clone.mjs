import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'json', 'galaxian_msx2_mideas.json');

const palette = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 2, masterIndex: 73, hex: '#246D24' },
  { slotIndex: 3, masterIndex: 113, hex: '#24DB24' },
  { slotIndex: 4, masterIndex: 9, hex: '#002400' },
  { slotIndex: 5, masterIndex: 511, hex: '#FFFFFF' },
  { slotIndex: 6, masterIndex: 448, hex: '#FF0000' },
  { slotIndex: 7, masterIndex: 480, hex: '#FF9200' },
  { slotIndex: 8, masterIndex: 504, hex: '#FFFF00' },
  { slotIndex: 9, masterIndex: 23, hex: '#0049FF' },
  { slotIndex: 10, masterIndex: 39, hex: '#0092FF' },
  { slotIndex: 11, masterIndex: 292, hex: '#929292' },
  { slotIndex: 12, masterIndex: 146, hex: '#49FF49' },
  { slotIndex: 13, masterIndex: 405, hex: '#DB49B6' },
  { slotIndex: 14, masterIndex: 365, hex: '#B6B6B6' },
  { slotIndex: 15, masterIndex: 455, hex: '#FF00FF' },
];

const blankTile = Array.from({ length: 16 }, () => Array(16).fill(1));
const starTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if ((x === 2 && y === 3) || (x === 12 && y === 10)) return 5;
    if ((x === 7 && y === 14) || (x === 14 && y === 1)) return 10;
    return 1;
  })
);
const greenStarTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if ((x === 5 && y === 5) || (x === 9 && y === 12)) return 12;
    if (x === 13 && y === 2) return 8;
    return 1;
  })
);
const bunkerTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y > 10 && x > 2 && x < 13) return 3;
    if (y > 7 && x > 4 && x < 11) return 12;
    if (y > 5 && x > 6 && x < 9) return 8;
    return 1;
  })
);
const alienMarkerTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const dx = Math.abs(x - 7.5);
    const dy = Math.abs(y - 7.5);
    if (dx + dy < 5) return y < 8 ? 10 : 13;
    if (dx < 7 && dy < 2) return 8;
    return 1;
  })
);

const tiles = [
  { id: 'galaxian_tile_space', name: 'Space', pixels: blankTile },
  { id: 'galaxian_tile_stars_a', name: 'Star Field A', pixels: starTile },
  { id: 'galaxian_tile_stars_b', name: 'Star Field B', pixels: greenStarTile },
  { id: 'galaxian_tile_bunker', name: 'Shield Bunker', pixels: bunkerTile },
  { id: 'galaxian_tile_alien_marker', name: 'Formation Marker', pixels: alienMarkerTile },
];

const map = Array.from({ length: 14 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 11 && (x === 2 || x === 6 || x === 10 || x === 14)) return 3;
    if (y >= 2 && y <= 5 && x >= 4 && x <= 11 && (x + y) % 2 === 0) return 4;
    return (x * 7 + y * 5) % 11 === 0 ? 1 : (x * 3 + y * 2) % 17 === 0 ? 2 : 0;
  })
);
const emptyLayer = Array.from({ length: 14 }, () => Array(16).fill(0));
const collision = Array.from({ length: 14 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (y === 11 && (x === 2 || x === 6 || x === 10 || x === 14) ? 1 : 0))
);

const frameFromRows = rows => rows.map(row =>
  row.split('').map(ch => {
    const slot = Number(ch);
    return slot ? palette[slot].hex : 'rgba(0,0,0,0)';
  })
);

const playerFrame = frameFromRows([
  '0000005500000000',
  '0000005500000000',
  '0000055550000000',
  '0000058850000000',
  '0000558855000000',
  '0005588885500000',
  '0055888888550000',
  '0555888888555000',
  '0555558855555000',
  '0000558855000000',
  '0000058850000000',
  '0000050050000000',
  '0000500005000000',
  '0005000000500000',
  '0055000000550000',
  '0000000000000000',
]);

const alienFrameA = frameFromRows([
  '0000000000000000',
  '0000100000010000',
  '0000110000110000',
  '0000111111110000',
  '0001111111111000',
  '0011101130111000',
  '0111111111111100',
  '0110111111101100',
  '0110111111101100',
  '0000110000110000',
  '0001100000011000',
  '0011000000001100',
  '0110000000000110',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
]);

const alienFrameB = frameFromRows([
  '0000000000000000',
  '0000001000100000',
  '0000011001100000',
  '0000111111110000',
  '0001111111111000',
  '0011101130111000',
  '0111111111111100',
  '0110111111101100',
  '0010111111101000',
  '0000110000110000',
  '0000011001100000',
  '0000001111000000',
  '0000010000100000',
  '0000100000010000',
  '0000000000000000',
  '0000000000000000',
]);

const laserFrame = frameFromRows([
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000006600000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
]);

const makeTransform = (x, y) => ({ tileX: x, tileY: y, pixelX: x * 16, pixelY: y * 16, spawnX: x * 16, spawnY: y * 16 });
const makeAlien = (id, name, x, y, row, column, active = false) => ({
  id,
  name,
  kind: 'enemy',
  position: { x, y },
  spriteAssetId: 'sprite_galaxian_alien_msx2',
  components: {
    msx2_transform: makeTransform(x, y),
    msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_galaxian_alien_msx2', frame: 0, paletteSlot: 10, visible: true },
    msx2_animation: { animation: 'alien_flap', frameStart: 0, frameCount: 2, frameDelay: 12, loop: true, animateOnlyWhenMoving: false },
    msx2_movement: { mode: active ? 'patrolX' : 'static', speed: active ? 2 : 0, direction: 1, minX: Math.max(0, x - 1), maxX: Math.min(15, x + 1), minY: y, maxY: y },
    msx2_collision: { hitboxW: 14, hitboxH: 12, offsetX: 1, offsetY: 2, solid: false, damage: 1 },
    msx2_health: { current: 1, max: 1, invincibleFrames: 0, deathAction: 'score' },
    msx2_damage: { amount: 1, mode: 'contact', cooldownFrames: 45, knockback: 0 },
    msx2_formation: { row, column, groupId: 'main', homeX: x, homeY: y, spacingX: 2, spacingY: 1 },
    msx2_attack_pattern: { pattern: active ? 'dive' : 'formation', trigger: active ? 'timer' : 'wave', triggerFrames: 90 + column * 20, returnToFormation: true, fireDuringDive: active },
    msx2_score: { points: row === 0 ? 150 : 100, variableId: 'score', addOnCollect: false },
  },
  params: active
    ? { runtime: 'MSX2', engine: 'patrolX', movement: 'patrolX', direction: 1, speed: 2, minX: Math.max(0, x - 1), maxX: Math.min(15, x + 1) }
    : { runtime: 'MSX2', engine: 'staticEnemy', movement: 'static' },
});

const entities = [
  {
    id: 'entity_galaxian_player',
    name: 'Galaxian Player',
    kind: 'player',
    position: { x: 7, y: 12 },
    spriteAssetId: 'sprite_galaxian_player_msx2',
    components: {
      msx2_transform: makeTransform(7, 12),
      msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_galaxian_player_msx2', frame: 0, paletteSlot: 15, visible: true },
      msx2_player_control: { controlMode: 'shooterHorizontal', jump: false, gravity: false, air: 255 },
      msx2_movement: { mode: 'horizontal', speed: 3, direction: 0, minX: 0, maxX: 15, minY: 12, maxY: 12 },
      msx2_collision: { hitboxW: 14, hitboxH: 12, offsetX: 1, offsetY: 2, solid: false, damage: 0 },
      msx2_shooter: { enabled: true, fireKey: 'space', cooldownFrames: 18, projectilePresetId: 'player_laser', maxProjectiles: 1 },
      msx2_lives: { lives: 3, maxLives: 3, extraLifeAt: 10000, gameOverAction: 'restart' },
      msx2_score: { points: 0, variableId: 'score', addOnCollect: false },
    },
    params: { runtime: 'MSX2', engine: 'player', controlMode: 'shooterHorizontal', movement: 'horizontal', speed: 3 },
  },
  {
    id: 'entity_galaxian_wave',
    name: 'Wave Controller',
    kind: 'door',
    position: { x: 0, y: 0 },
    components: {
      msx2_transform: makeTransform(0, 0),
      msx2_wave: { waveId: 1, enemyCount: 12, nextWaveScreenId: '', clearCondition: 'allEnemies' },
      msx2_timer: { initialValue: 255, tickRateFrames: 1, onZero: 'nextAttack', hud: false },
      msx2_score: { points: 0, variableId: 'score', addOnCollect: false },
    },
    params: { runtime: 'MSX2', engine: 'checkpoint', waveController: true },
  },
  ...Array.from({ length: 12 }, (_unused, index) => {
    const row = Math.floor(index / 4);
    const column = index % 4;
    const x = 4 + column * 2;
    const y = 2 + row;
    return makeAlien(`entity_galaxian_alien_${index + 1}`, `Alien ${index + 1}`, x, y, row, column, index < 4);
  }),
  {
    id: 'entity_galaxian_player_laser',
    name: 'Player Laser Prototype',
    kind: 'hazard',
    position: { x: 7, y: 11 },
    spriteAssetId: 'sprite_galaxian_laser_msx2',
    components: {
      msx2_transform: makeTransform(7, 11),
      msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_galaxian_laser_msx2', frame: 0, paletteSlot: 6, visible: false },
      msx2_projectile: { owner: 'player', velocityX: 0, velocityY: -4, damage: 1, expireOnHit: true, maxDistance: 192 },
      msx2_collision: { hitboxW: 4, hitboxH: 8, offsetX: 6, offsetY: 4, solid: false, damage: 1 },
      msx2_damage: { amount: 1, mode: 'projectile', cooldownFrames: 0, knockback: 0 },
    },
    params: { runtime: 'MSX2', engine: 'hazard', projectile: true },
  },
];

const project = {
  name: 'galaxian_msx2_mideas',
  currentProjectName: 'galaxian_msx2_mideas',
  currentScreenMode: 'SCREEN 5 (Graphics III)',
  screenMode: 'SCREEN 5 (Graphics III)',
  targetGraphicsBackend: 'msx2-screen5-tile16',
  selectedAssetId: 'screen_galaxian_msx2',
  currentEditor: 'Msx2Screen',
  assets: [
    {
      id: 'palette_galaxian_msx2',
      name: 'Galaxian MSX2 Palette',
      type: 'palette',
      data: { mode: 'SCREEN5', slots: palette, notes: 'SCREEN 5 palette for Galaxian-style arcade colors.' },
    },
    {
      id: 'screen_galaxian_msx2',
      name: 'Galaxian Sector',
      type: 'msx2screen',
      data: {
        id: 'screen_galaxian_msx2',
        name: 'Galaxian Sector',
        target: 'MSX2',
        vdpMode: 'SCREEN5',
        tileSize: 16,
        widthTiles: 16,
        heightTiles: 14,
        palette,
        tiles,
        map,
        collisionMap: collision,
        layers: { collision, effects: emptyLayer, behavior: emptyLayer, entities },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          movementMode: 'shooterHorizontal',
          requiredCollectibles: 0,
          initialAir: 255,
          activeAreaX: 0,
          activeAreaY: 0,
          activeAreaWidth: 16,
          activeAreaHeight: 14,
          hideHud: false,
        },
        notes: 'Galaxian-style MSX2 clone data. Current ROM runtime supports player, horizontal shooter movement, one player projectile, one enemy projectile, visible score, dive-attack movement, and the 12 authored formation enemy slots.',
      },
    },
    {
      id: 'sprite_galaxian_player_msx2',
      name: 'Galaxian Player Ship',
      type: 'msx2sprite',
      data: {
        id: 'sprite_galaxian_player_msx2',
        name: 'Galaxian Player Ship',
        target: 'MSX2',
        vdpMode: 'SCREEN5',
        size: { width: 16, height: 16 },
        palette,
        backgroundColor: 'rgba(0,0,0,0)',
        frames: [{ id: 'frame_galaxian_player_idle', data: playerFrame }],
        currentFrameIndex: 0,
        animationSpeedMs: 100,
        loops: true,
        hitbox: { width: 14, height: 12, offsetX: 1, offsetY: 2 },
        hardware: { x: 112, y: 192, color: 15, patternIndex: 0, useOrColor: true },
      },
    },
    {
      id: 'sprite_galaxian_alien_msx2',
      name: 'Galaxian Alien',
      type: 'msx2sprite',
      data: {
        id: 'sprite_galaxian_alien_msx2',
        name: 'Galaxian Alien',
        target: 'MSX2',
        vdpMode: 'SCREEN5',
        size: { width: 16, height: 16 },
        palette,
        backgroundColor: 'rgba(0,0,0,0)',
        frames: [
          { id: 'frame_galaxian_alien_a', data: alienFrameA },
          { id: 'frame_galaxian_alien_b', data: alienFrameB },
        ],
        currentFrameIndex: 0,
        animationSpeedMs: 140,
        loops: true,
        hitbox: { width: 14, height: 12, offsetX: 1, offsetY: 2 },
        hardware: { x: 64, y: 48, color: 10, patternIndex: 8, useOrColor: true },
      },
    },
    {
      id: 'sprite_galaxian_laser_msx2',
      name: 'Galaxian Laser',
      type: 'msx2sprite',
      data: {
        id: 'sprite_galaxian_laser_msx2',
        name: 'Galaxian Laser',
        target: 'MSX2',
        vdpMode: 'SCREEN5',
        size: { width: 16, height: 16 },
        palette,
        backgroundColor: 'rgba(0,0,0,0)',
        frames: [{ id: 'frame_galaxian_laser', data: laserFrame }],
        currentFrameIndex: 0,
        animationSpeedMs: 60,
        loops: true,
        hitbox: { width: 4, height: 8, offsetX: 6, offsetY: 4 },
        hardware: { x: 112, y: 176, color: 6, patternIndex: 16, useOrColor: true },
      },
    },
    {
      id: 'world_galaxian_msx2',
      name: 'Galaxian World',
      type: 'worldmap',
      data: {
        id: 'world_galaxian_msx2',
        name: 'Galaxian World',
        nodes: [{ id: 'world_node_galaxian_sector', screenAssetId: 'screen_galaxian_msx2', name: 'Sector 1', position: { x: 0, y: 0 } }],
        connections: [],
        startScreenNodeId: 'world_node_galaxian_sector',
        gridSize: 64,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
      },
    },
    {
      id: 'gameflow_galaxian_msx2',
      name: 'Galaxian Main',
      type: 'gameflow',
      data: {
        id: 'gameflow_galaxian_msx2',
        name: 'Galaxian Main',
        startNodeId: 'gf_start',
        panOffset: { x: 0, y: 0 },
        zoomLevel: 1,
        nodes: [
          { id: 'gf_start', type: 'Start', position: { x: 0, y: 0 } },
          { id: 'gf_world', type: 'WorldLink', worldAssetId: 'world_galaxian_msx2', position: { x: 180, y: 0 } },
        ],
        connections: [{ id: 'gf_start_to_world', from: { nodeId: 'gf_start', handle: 'default' }, to: { nodeId: 'gf_world', handle: 'input' }, type: 'default' }],
      },
    },
  ],
  mainMenuConfig: {
    title: 'GALAXIAN MSX2',
    subtitle: 'Formation attack prototype',
    isEnabled: false,
    options: ['START'],
    selectedOptionIndex: 0,
    keyMapping: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', fire1: ' ', fire2: 'm' },
  },
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(outJson);

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
    if ((x === 4 && y === 11) || (x === 10 && y === 5)) return 11;
    return 1;
  })
);
const bunkerTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y > 12 && x > 1 && x < 14) return 3;
    if (y > 9 && x > 2 && x < 13) return 12;
    if (y > 7 && x > 4 && x < 11) return 3;
    if ((y === 8 || y === 9) && x > 5 && x < 10) return 8;
    if (y === 13 && (x === 3 || x === 12)) return 8;
    return 1;
  })
);

const ringedPlanetTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const dx = x - 8;
    const dy = y - 8;
    const ring = Math.abs((dy * 3) - dx) <= 3 && Math.abs(dx) > 4;
    const body = dx * dx + dy * dy <= 36;
    if (body && (dx < -1 || dy > 3)) return 13;
    if (body) return 9;
    if (ring) return 8;
    return 1;
  })
);

const bluePlanetTile = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const dx = x - 8;
    const dy = y - 8;
    const body = dx * dx + dy * dy <= 49;
    const band = Math.abs(y - 5 - Math.floor(x / 5)) <= 1 || Math.abs(y - 10 + Math.floor(x / 6)) <= 1;
    if (body && band) return 10;
    if (body && dx < -2) return 9;
    if (body) return 11;
    return 1;
  })
);

const tiles = [
  { id: 'galaxian_tile_space', name: 'Space', pixels: blankTile },
  { id: 'galaxian_tile_stars_a', name: 'Star Field A', pixels: starTile },
  { id: 'galaxian_tile_bunker', name: 'Shield Bunker', pixels: bunkerTile },
  { id: 'galaxian_tile_ringed_planet', name: 'Ringed Planet', pixels: ringedPlanetTile },
  { id: 'galaxian_tile_blue_planet', name: 'Blue Planet', pixels: bluePlanetTile },
];

const bunkerRow = 9;
const bunkerColumns = new Set([2, 6, 10, 14]);
const bunkerTileIndex = 2;
const starColumnsByRow = [
  [0, 5, 11],
  [3, 8, 14],
  [1, 6, 12],
  [4, 10, 15],
  [2, 7, 13],
  [0, 9, 14],
  [3, 6, 11],
  [1, 8, 15],
  [4, 10, 12],
  [0, 5, 14],
  [2, 7, 11],
  [3, 9, 15],
];

const makeMap = (phase = 1) => Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === bunkerRow && bunkerColumns.has(x)) return bunkerTileIndex;
    if (phase === 1 && x === 1 && y === 1) return 3;
    if (phase === 1 && x === 2 && y === 1) return 3;
    if (phase === 1 && x === 1 && y === 2) return 3;
    if (phase === 1 && x === 2 && y === 2) return 3;
    if (phase === 1 && x === 12 && y === 5) return 4;
    if (phase === 1 && x === 13 && y === 5) return 4;
    if (phase === 1 && x === 12 && y === 6) return 4;
    if (phase === 1 && x === 13 && y === 6) return 4;
    if (phase === 2 && x === 11 && y === 1) return 4;
    if (phase === 2 && x === 12 && y === 1) return 4;
    if (phase === 2 && x === 11 && y === 2) return 4;
    if (phase === 2 && x === 12 && y === 2) return 4;
    if (phase === 2 && x === 3 && y === 6) return 3;
    if (phase === 2 && x === 4 && y === 6) return 3;
    if (phase === 2 && x === 3 && y === 7) return 3;
    if (phase === 2 && x === 4 && y === 7) return 3;
    if (starColumnsByRow[y]?.includes(x)) return 1;
    if (phase === 2 && (x * 5 + y * 13) % 17 === 0) return 1;
    if ((x * 11 + y * 7) % 23 === 0) return 1;
    return (x * 7 + y * 5) % 11 === 0 ? 1 : (x * 3 + y * 2) % 19 === 0 ? 1 : 0;
  })
);
const map = makeMap(1);
const phase2Map = makeMap(2);
const emptyLayer = Array.from({ length: 12 }, () => Array(16).fill(0));
const collision = Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (y === bunkerRow && bunkerColumns.has(x) ? 1 : 0))
);
const effectsLayer = Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => (y === bunkerRow && bunkerColumns.has(x) ? 3 : 0))
);

const slotFromChar = ch => {
  if (ch === '.' || ch === '0') return 0;
  const value = Number.parseInt(ch, 16);
  return Number.isFinite(value) ? value : 0;
};

const frameFromRows = (rows, solidSlot = null) => rows.map(row =>
  row.split('').map(ch => {
    const sourceSlot = slotFromChar(ch);
    const slot = solidSlot === null ? sourceSlot : (sourceSlot ? solidSlot : 0);
    return slot ? palette[slot].hex : 'rgba(0,0,0,0)';
  })
);

const playerFrame = frameFromRows([
  '0000005500000000',
  '000000FF00000000',
  '000005FF50000000',
  '00000FFFF0000000',
  '00005F55F5000000',
  '0005FFFFFF500000',
  '005FF8FF8FF50000',
  '05FFFFFFFFFF5000',
  '0FFFFF88FFFFF000',
  '0000FF88FF000000',
  '000008FF80000000',
  '0000080080000000',
  '0000800008000000',
  '0008000000800000',
  '0088000000880000',
  '0000000000000000',
]);

const alienFrameA = frameFromRows([
  '0000000000000000',
  '0000100000010000',
  '0000110000110000',
  '0001111111111000',
  '0011111111111100',
  '0111101130111110',
  '1111111111111110',
  '1011111111111010',
  '0011111111111000',
  '0001100110011000',
  '0011000000001100',
  '0110000000000110',
  '0100000000000010',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
], 10);

const alienFrameB = frameFromRows([
  '0000000000000000',
  '0000001000100000',
  '0000011001100000',
  '0001111111111000',
  '0011111111111100',
  '1111101130111110',
  '0111111111111100',
  '0011111111111000',
  '0001100000011000',
  '0000110000110000',
  '0000011001100000',
  '0000001111000000',
  '0000010000100000',
  '0000100000010000',
  '0000000000000000',
  '0000000000000000',
], 10);

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
], 6);

const makeTransform = (x, y) => ({ tileX: x, tileY: y, pixelX: x * 16, pixelY: y * 16, spawnX: x * 16, spawnY: y * 16 });
const makeAlien = (id, name, x, y, row, column, active = false, options = {}) => {
  const speed = Number(options.speed ?? (active ? 2 : 0));
  const minX = Number(options.minX ?? Math.max(0, x - 1));
  const maxX = Number(options.maxX ?? Math.min(15, x + 1));
  const triggerFrames = Number(options.triggerFrames ?? (90 + column * 20));
  const points = Number(options.points ?? (row === 0 ? 150 : 100));
  const direction = Number(options.direction ?? 1) < 0 ? -1 : 1;
  const attackPattern = String(options.attackPattern ?? ['circle', 'zigzag', 'diagonal'][(row + column) % 3]);
  return ({
  id,
  name,
  kind: 'enemy',
  position: { x, y },
  spriteAssetId: 'sprite_galaxian_alien_msx2',
  components: {
    msx2_transform: makeTransform(x, y),
    msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_galaxian_alien_msx2', frame: 0, paletteSlot: 10, visible: true },
    msx2_animation: { animation: 'alien_flap', frameStart: 0, frameCount: 2, frameDelay: 12, loop: true, animateOnlyWhenMoving: false },
    msx2_movement: { mode: active ? 'patrolX' : 'static', speed, direction, minX, maxX, minY: y, maxY: y },
    msx2_collision: { hitboxW: 14, hitboxH: 12, offsetX: 1, offsetY: 2, solid: false, damage: 1 },
    msx2_health: { current: 1, max: 1, invincibleFrames: 0, deathAction: 'score' },
    msx2_damage: { amount: 1, mode: 'contact', cooldownFrames: 45, knockback: 0 },
    msx2_formation: { row, column, groupId: 'main', homeX: x, homeY: y, spacingX: 2, spacingY: 1 },
    msx2_attack_pattern: { pattern: attackPattern, trigger: 'wave', triggerFrames, returnToFormation: true, fireDuringDive: active },
    msx2_score: { points, variableId: 'score', addOnCollect: false },
  },
  params: active
    ? { runtime: 'MSX2', engine: 'patrolX', movement: 'patrolX', direction, speed, minX, maxX, triggerFrames, attackPattern }
    : { runtime: 'MSX2', engine: 'staticEnemy', movement: 'static', attackPattern },
  });
};

const makePlayerEntity = suffix => ({
  id: `entity_galaxian_player${suffix}`,
  name: 'Galaxian Player',
  kind: 'player',
  position: { x: 7, y: 10 },
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
});

const makeWaveController = (waveId, nextWaveScreenId = '') => ({
  id: `entity_galaxian_wave_${waveId}`,
  name: `Wave ${waveId} Controller`,
  kind: 'door',
  position: { x: 0, y: 0 },
  components: {
    msx2_transform: makeTransform(0, 0),
    msx2_wave: { waveId, enemyCount: 12, nextWaveScreenId, clearCondition: 'allEnemies' },
    msx2_attack_wave: { enabled: true, intervalFrames: 180, minAttackers: 1, maxAttackers: 3, randomSeed: 73 },
    msx2_scroll: {
      scrollDirection: 'vertical',
      scrollMode: 'tile',
      screenMode: 'SCREEN4',
      scrollSpeedX: 0,
      scrollSpeedY: -1,
      cameraX: 0,
      cameraY: 0,
      tileSize: 8,
      vramPage: 0,
      bufferMode: 'loop',
      maskBorders: false,
      updateBudget: 32,
      spriteScrollCompensation: false,
    },
    msx2_timer: { initialValue: 255, tickRateFrames: 1, onZero: 'nextAttack', hud: false },
    msx2_score: { points: 0, variableId: 'score', addOnCollect: false },
  },
  params: { runtime: 'MSX2', engine: 'checkpoint', waveController: true, waveId, nextWaveScreenId, attackIntervalFrames: 180, minAttackers: 1, maxAttackers: 3, randomSeed: 73, scrollMode: 'tile', scrollDirection: 'vertical', scrollLoop: true },
});

const makePlayerLaserEntity = suffix => ({
  id: `entity_galaxian_player_laser${suffix}`,
  name: 'Player Laser Prototype',
  kind: 'hazard',
  position: { x: 7, y: 11 },
  spriteAssetId: 'sprite_galaxian_laser_msx2',
  components: {
    msx2_transform: makeTransform(7, 11),
    msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_galaxian_laser_msx2', frame: 0, paletteSlot: 6, visible: false },
    msx2_projectile: { owner: 'player', velocityX: 0, velocityY: -8, damage: 1, expireOnHit: true, maxDistance: 192 },
    msx2_collision: { hitboxW: 4, hitboxH: 8, offsetX: 6, offsetY: 4, solid: false, damage: 1 },
    msx2_damage: { amount: 1, mode: 'projectile', cooldownFrames: 0, knockback: 0 },
  },
  params: { runtime: 'MSX2', engine: 'hazard', projectile: true, owner: 'player' },
});

const wave1AlienSpecs = Array.from({ length: 12 }, (_unused, index) => {
  const row = Math.floor(index / 4);
  const column = index % 4;
  return { x: 4 + column * 2, y: 2 + row, row, column, active: index < 4 };
});

const wave2AlienSpecs = [
  { x: 2, y: 2, row: 0, column: 0, active: true, triggerFrames: 52, points: 200, minX: 1, maxX: 4 },
  { x: 5, y: 2, row: 0, column: 1, active: true, triggerFrames: 68, points: 200, minX: 4, maxX: 7 },
  { x: 8, y: 2, row: 0, column: 2, active: true, triggerFrames: 84, points: 200, minX: 7, maxX: 9 },
  { x: 11, y: 2, row: 0, column: 3, active: true, triggerFrames: 68, points: 200, minX: 10, maxX: 12 },
  { x: 14, y: 2, row: 0, column: 4, active: true, triggerFrames: 52, points: 200, minX: 12, maxX: 15, direction: -1 },
  { x: 3, y: 3, row: 1, column: 0, active: false, points: 120 },
  { x: 6, y: 3, row: 1, column: 1, active: true, triggerFrames: 96, points: 150, minX: 5, maxX: 8 },
  { x: 9, y: 3, row: 1, column: 2, active: true, triggerFrames: 110, points: 150, minX: 8, maxX: 10 },
  { x: 12, y: 3, row: 1, column: 3, active: false, points: 120 },
  { x: 4, y: 4, row: 2, column: 0, active: false, points: 100 },
  { x: 8, y: 4, row: 2, column: 1, active: true, triggerFrames: 124, points: 130, minX: 7, maxX: 9 },
  { x: 12, y: 4, row: 2, column: 2, active: false, points: 100 },
];

const makeWaveEntities = (waveId, specs, nextWaveScreenId) => [
  makePlayerEntity(waveId === 1 ? '' : `_phase${waveId}`),
  makeWaveController(waveId, nextWaveScreenId),
  ...specs.map((spec, index) => makeAlien(
    `entity_galaxian_w${waveId}_alien_${index + 1}`,
    `Wave ${waveId} Alien ${index + 1}`,
    spec.x,
    spec.y,
    spec.row,
    spec.column,
    Boolean(spec.active),
    spec
  )),
  makePlayerLaserEntity(waveId === 1 ? '' : `_phase${waveId}`),
];

const entities = makeWaveEntities(1, wave1AlienSpecs, 'screen_galaxian_msx2_phase2');
const phase2Entities = makeWaveEntities(2, wave2AlienSpecs, 'screen_galaxian_msx2');

const project = {
  name: 'galaxian_msx2_mideas',
  currentProjectName: 'galaxian_msx2_mideas',
  currentScreenMode: 'SCREEN 4 (Graphics II)',
  screenMode: 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-pattern',
  selectedAssetId: 'screen_galaxian_msx2',
  currentEditor: 'Msx2Screen',
  assets: [
    {
      id: 'palette_galaxian_msx2',
      name: 'Galaxian MSX2 Palette',
      type: 'palette',
      data: { mode: 'SCREEN4', slots: palette, notes: 'SCREEN 4 palette for Galaxian-style arcade colors.' },
    },
    {
      id: 'screen_galaxian_msx2',
      name: 'Galaxian Sector 1',
      type: 'msx2screen',
      data: {
        id: 'screen_galaxian_msx2',
        name: 'Galaxian Sector 1',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        tileSize: 16,
        widthTiles: 16,
        heightTiles: 12,
        palette,
        tiles,
        map,
        collisionMap: collision,
        layers: { collision, effects: effectsLayer, behavior: emptyLayer, entities },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          movementMode: 'shooterHorizontal',
          requiredCollectibles: 0,
          initialAir: 255,
          activeAreaX: 0,
          activeAreaY: 0,
          activeAreaWidth: 16,
          activeAreaHeight: 12,
          hideHud: true,
        },
        notes: 'Galaxian-style MSX2 phase 1. Current ROM runtime supports player, horizontal shooter movement, one player projectile, one enemy projectile, destructible shields, internal score, dive-attack movement, and the 12 authored formation enemy slots rendered as hardware sprites.',
      },
    },
    {
      id: 'screen_galaxian_msx2_phase2',
      name: 'Galaxian Sector 2',
      type: 'msx2screen',
      data: {
        id: 'screen_galaxian_msx2_phase2',
        name: 'Galaxian Sector 2',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        tileSize: 16,
        widthTiles: 16,
        heightTiles: 12,
        palette,
        tiles,
        map: phase2Map,
        collisionMap: collision,
        layers: { collision, effects: effectsLayer, behavior: emptyLayer, entities: phase2Entities },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          movementMode: 'shooterHorizontal',
          requiredCollectibles: 0,
          initialAir: 255,
          activeAreaX: 0,
          activeAreaY: 0,
          activeAreaWidth: 16,
          activeAreaHeight: 12,
          hideHud: true,
        },
        notes: 'Galaxian-style MSX2 phase 2 with a wider V-shaped formation, more active dive attackers, higher score values, and destructible shields.',
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
        vdpMode: 'SCREEN4',
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
        vdpMode: 'SCREEN4',
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
        vdpMode: 'SCREEN4',
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
        nodes: [
          { id: 'world_node_galaxian_sector', screenAssetId: 'screen_galaxian_msx2', name: 'Sector 1', position: { x: 0, y: 0 } },
          { id: 'world_node_galaxian_sector_2', screenAssetId: 'screen_galaxian_msx2_phase2', name: 'Sector 2', position: { x: 96, y: 0 } },
        ],
        connections: [{ id: 'world_sector_1_to_2', fromNodeId: 'world_node_galaxian_sector', toNodeId: 'world_node_galaxian_sector_2', direction: 'right' }],
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

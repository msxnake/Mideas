#!/usr/bin/env node
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const root = process.cwd();

const bundle = await esbuild.build({
  entryPoints: [path.join(root, 'utils/msxGenerator/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
});
const generator = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

const transparent = 'rgba(0,0,0,0)';
const palette = [
  { slotIndex: 0, masterIndex: -1, hex: transparent },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 6, masterIndex: 120, hex: '#CC4444' },
  { slotIndex: 8, masterIndex: 200, hex: '#DDCC55' },
  { slotIndex: 10, masterIndex: 300, hex: '#55AAEE' },
  { slotIndex: 13, masterIndex: 400, hex: '#CC66CC' },
  { slotIndex: 15, masterIndex: 511, hex: '#FFFFFF' },
];

function spriteFrame(colorA, colorB, phase) {
  return Array.from({ length: 16 }, (_unused, y) =>
    Array.from({ length: 16 }, (_unused2, x) => {
      if (x === phase + 2 || x === phase + 3) return colorA;
      if (y >= 5 && y <= 10 && x >= 6 && x <= 11) return colorB;
      return transparent;
    })
  );
}

function spriteAsset(id, name, colorA, colorB, facingDirection = 'right') {
  return {
    id,
    name,
    type: 'msx2sprite',
    data: {
      id,
      name,
      target: 'MSX2',
      vdpMode: 'SCREEN4',
      size: { width: 16, height: 16 },
      palette,
      backgroundColor: transparent,
      frames: [
        { id: `${id}_0`, data: spriteFrame(colorA, colorB, 0) },
        { id: `${id}_1`, data: spriteFrame(colorA, colorB, 2) },
      ],
      currentFrameIndex: 0,
      animationSpeedMs: 120,
      facingDirection,
      hardware: { x: 32, y: 128, color: 15, patternIndex: 0, useOrColor: true },
    },
  };
}

function enemyAsset(id, name, spriteId, delay) {
  return {
    id,
    name,
    type: 'msx2enemy',
    data: {
      enemyId: id,
      name,
      behavior: { type: 'PatrolX', stateTransitions: [] },
      attack: { type: 'None' },
      render: {
        renderMode: 'hardwareSprite',
        spriteId,
        palette: 'screen',
        size: '16x16',
        animations: { patrol: { frames: [0, 1], speed: delay, loop: true } },
        roles: [{
          id: 'patrol',
          label: 'Patrol',
          behavior: 'PatrolX',
          spriteId,
          animation: 'patrol',
          frames: [0, 1],
          speed: delay,
          loop: true,
        }],
      },
      hitboxes: {
        body: { x: 0, y: 0, w: 16, h: 16 },
        damage: { x: 0, y: 0, w: 16, h: 16 },
      },
      stats: { hp: 1, damage: 1, score: 10 },
    },
  };
}

const emptyLayer = () => Array.from({ length: 12 }, () => Array(16).fill(0));
const tile = {
  id: 'tile_black',
  name: 'Black',
  width: 16,
  height: 16,
  screen5Palette: palette,
  pixels: Array.from({ length: 16 }, () => Array(16).fill('#000000')),
  logicalProperties: { mapId: 0, familyId: 0, instanceId: 0, isSolid: false },
};

function screenAsset(index, enemyId, enemySpriteId) {
  const id = `screen_enemy_pack_${index}`;
  const layer = emptyLayer();
  return {
    id,
    name: `Enemy Pack Screen ${index}`,
    type: 'msx2screen',
    data: {
      id,
      name: `Enemy Pack Screen ${index}`,
      target: 'MSX2',
      vdpMode: 'SCREEN4',
      tileSize: 16,
      widthTiles: 16,
      heightTiles: 12,
      tiles: [tile],
      map: layer,
      collisionMap: layer,
      layers: {
        collision: layer,
        effects: layer,
        behavior: layer,
        entities: [
          {
            id: `player_${index}`,
            kind: 'player',
            position: { x: 2, y: 9 },
            spriteAssetId: 'sprite_player',
            components: {
              msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_player', visible: true },
              msx2_player_control: { controlMode: 'platform' },
            },
          },
          {
            id: `enemy_${index}`,
            kind: 'enemy',
            position: { x: 8, y: 9 },
            spriteAssetId: enemySpriteId,
            components: {
              msx2_hardware_sprite: { msx2SpriteAssetId: enemySpriteId, visible: true },
              msx2_movement: { mode: 'patrolX', direction: 1, speed: 2 },
              msx2_animation: {
                animation: 'patrol',
                frameStart: 0,
                frameCount: 2,
                frameDelay: index === 0 ? 7 : 11,
                frameList: [0, 1],
              },
              msx2_collision: { hitboxW: 16, hitboxH: 16, damage: 1 },
            },
            params: { enemyAssetId: enemyId, enemyRenderRoleId: 'patrol' },
          },
        ],
      },
      runtime: {
        screenKind: 'playable',
        screenEngine: 'player',
        movementMode: 'platform',
        requiredCollectibles: 0,
        initialAir: 255,
      },
      backgroundColor: 1,
      borderColor: 1,
    },
  };
}

const screen0 = screenAsset(0, 'enemy_asset_a', 'sprite_enemy_a');
const screen1 = screenAsset(1, 'enemy_asset_b', 'sprite_enemy_b');
const gameFlow = {
  id: 'enemy_pack_flow',
  name: 'Enemy Pack Flow',
  purpose: 'screen4-runtime',
  startNodeId: 'start',
  panOffset: { x: 0, y: 0 },
  zoomLevel: 1,
  nodes: [
    { id: 'start', type: 'Start', position: { x: 0, y: 0 } },
    { id: 'room0', type: 'Screen4Screen', position: { x: 160, y: 0 }, screenAssetId: screen0.id, waitForKey: true },
    { id: 'room1', type: 'Screen4Screen', position: { x: 320, y: 0 }, screenAssetId: screen1.id, waitForKey: true },
    { id: 'end', type: 'End', position: { x: 480, y: 0 }, message: 'END', waitForKey: false },
  ],
  connections: [
    { id: 'c0', from: { nodeId: 'start' }, to: { nodeId: 'room0' } },
    { id: 'c1', from: { nodeId: 'room0' }, to: { nodeId: 'room1' } },
    { id: 'c2', from: { nodeId: 'room1' }, to: { nodeId: 'end' } },
  ],
};

const assets = [
  spriteAsset('sprite_player', 'Player', '#FFFFFF', '#55AAEE'),
  spriteAsset('sprite_enemy_a', 'Enemy A Sprite', '#CC4444', '#DDCC55', 'right'),
  spriteAsset('sprite_enemy_b', 'Enemy B Sprite', '#CC66CC', '#55AAEE', 'left'),
  enemyAsset('enemy_asset_a', 'Enemy A', 'sprite_enemy_a', 7),
  enemyAsset('enemy_asset_b', 'Enemy B', 'sprite_enemy_b', 11),
  screen0,
  screen1,
  { id: 'enemy_pack_flow_asset', name: gameFlow.name, type: 'msx2gameflow', data: gameFlow },
];

const originalLog = console.log;
let asm;
try {
  console.log = () => {};
  asm = generator.generateModularASM('MSX2_Screen_Enemy_Pack', assets, {
    generateUnified: true,
    screenMode: 'SCREEN 4 (Graphics II)',
    targetGraphicsBackend: 'msx2-screen4-pattern',
    romMode: 'megarom',
    targetFormat: 'konami',
  })['unitedFiles.asm'];
} finally {
  console.log = originalLog;
}

function labelBytes(label) {
  const match = asm.match(new RegExp(`^${label}:\\n(?<body>(?:    DB .+\\n)+)`, 'm'));
  if (!match) throw new Error(`Missing generated label ${label}`);
  return [...match.groups.body.matchAll(/#([0-9A-F]{2})/g)].map(item => Number.parseInt(item[1], 16));
}

const checks = [
  ['per-screen loader is emitted', asm.includes('load_current_msx2_enemy_sprite_pack:')],
  ['enemy reset calls the loader', /msx2_reset_enemy_runtime_for_current_screen:[\s\S]{0,240}call load_current_msx2_enemy_sprite_pack/.test(asm)],
  ['fixed reserve is exactly 8 x 32 bytes', labelBytes('msx2_hw_enemy_sprite_pattern_reserve').length === 256],
  ['screen 0 pack is exactly 256 bytes', labelBytes('msx2_screen_enemy_pack_0_patterns').length === 256],
  ['screen 1 pack is exactly 256 bytes', labelBytes('msx2_screen_enemy_pack_1_patterns').length === 256],
  ['screen packs carry two 16-byte color layers', labelBytes('msx2_screen_enemy_pack_0_colors').length === 32 && labelBytes('msx2_screen_enemy_pack_1_colors').length === 32],
  ['different Enemy Assets emit different packs', labelBytes('msx2_screen_enemy_pack_0_patterns').join(',') !== labelBytes('msx2_screen_enemy_pack_1_patterns').join(',')],
  ['base and mirror variants differ', labelBytes('msx2_screen_enemy_pack_0_patterns').slice(0, 128).join(',') !== labelBytes('msx2_screen_enemy_pack_0_patterns').slice(128).join(',')],
  ['loader copies 256 pattern bytes', asm.includes('ld bc, 256\n    call copy_to_vram_ext')],
  ['loader copies both color layers per resident enemy', asm.includes('ld b, 1\n.copy_enemy_pack_colors_0:') && asm.includes('ld bc, 32\n    call copy_to_vram_ext')],
  ['runtime writes the second enemy SAT color layer', asm.includes('; Enemy/hazard sprite slot 0, color layer 1.') && asm.includes('.enemy_sprite_0_layer_1_base_pattern:')],
  ['per-screen animation delays come from Enemy Assets', asm.includes('ld a, 7\n    ld (msx2_enemy_anim_delay), a') && asm.includes('ld a, 11\n    ld (msx2_enemy_anim_delay), a')],
  ['same-screen resets can skip the VRAM transfer', asm.includes('ld (msx2_enemy_pack_loaded_index), a') && /cp b\s+ret z/.test(asm)],
  ['MegaROM loader restores the data bank', asm.includes('call msx2_screen4_data_bank_enter') && asm.includes('call msx2_screen4_data_bank_leave')],
];

for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
}
if (checks.some(([, passed]) => !passed)) {
  throw new Error('MSX2 per-screen enemy pack contract failed');
}

const invalidAssets = structuredClone(assets);
const invalidScreen = invalidAssets.find(asset => asset.id === screen0.id);
invalidScreen.data.layers.entities.push({
  ...structuredClone(invalidScreen.data.layers.entities[1]),
  id: 'enemy_second_type_same_screen',
  params: { enemyAssetId: 'enemy_asset_b', enemyRenderRoleId: 'patrol' },
});
let rejectedTwoTypes = false;
try {
  console.log = () => {};
  generator.generateModularASM('MSX2_Invalid_Enemy_Pack', invalidAssets, {
    generateUnified: true,
    screenMode: 'SCREEN 4 (Graphics II)',
    targetGraphicsBackend: 'msx2-screen4-pattern',
    romMode: 'megarom',
    targetFormat: 'konami',
  });
} catch (error) {
  rejectedTwoTypes = /only one patrol enemy type is allowed per screen/.test(String(error?.message || error));
} finally {
  console.log = originalLog;
}
console.log(`${rejectedTwoTypes ? 'OK' : 'FAIL'}: two Enemy Asset types in one screen are rejected`);
if (!rejectedTwoTypes) throw new Error('Expected two enemy types in one screen to be rejected');

const satOverflowAssets = structuredClone(assets);
const satOverflowScreen = satOverflowAssets.find(asset => asset.id === screen0.id);
const enemyTemplate = satOverflowScreen.data.layers.entities[1];
for (let index = 1; index < 12; index += 1) {
  satOverflowScreen.data.layers.entities.push({
    ...structuredClone(enemyTemplate),
    id: `enemy_sat_overflow_${index}`,
    position: { x: 2 + index, y: 8 },
  });
}
let rejectedSatOverflow = false;
try {
  console.log = () => {};
  generator.generateModularASM('MSX2_Invalid_SAT_Pack', satOverflowAssets, {
    generateUnified: true,
    screenMode: 'SCREEN 4 (Graphics II)',
    targetGraphicsBackend: 'msx2-screen4-pattern',
    romMode: 'megarom',
    targetFormat: 'konami',
  });
} catch (error) {
  rejectedSatOverflow = /SAT overflow with two-color Enemy Assets/.test(String(error?.message || error));
} finally {
  console.log = originalLog;
}
console.log(`${rejectedSatOverflow ? 'OK' : 'FAIL'}: two-color enemy instances cannot overflow the 32 SAT slots`);
if (!rejectedSatOverflow) throw new Error('Expected excessive two-color enemy instances to be rejected');

const outDir = mkdtempSync(path.join(tmpdir(), 'mideas-screen-enemy-pack-'));
const asmPath = path.join(outDir, 'enemy_pack.asm');
const romPath = path.join(outDir, 'enemy_pack.rom');
const symPath = path.join(outDir, 'enemy_pack.sym');
writeFileSync(asmPath, asm, 'utf8');
const glass = path.join(root, 'server', 'glass.jar');
const compile = spawnSync('java', ['-jar', glass, '-I', path.join(root, 'server'), asmPath, romPath, symPath], {
  cwd: root,
  encoding: 'utf8',
});
if (compile.status !== 0) {
  throw new Error(`Glass compile failed:\n${compile.stdout || ''}\n${compile.stderr || ''}`);
}
const romSize = statSync(romPath).size;
const romHeader = readFileSync(romPath).subarray(0, 2).toString('ascii');
if (romHeader !== 'AB' || romSize <= 32768 || romSize % 8192 !== 0) {
  throw new Error(`Invalid compiled MegaROM: header=${romHeader} size=${romSize}`);
}
console.log(`OK: generated ASM compiles with Glass (${romSize} bytes)`);
console.log('MSX2 per-screen Enemy Asset pack contract passed.');

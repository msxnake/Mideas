import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'json', 'pong_2_players_msx2.json');

const palette = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 2, masterIndex: 9, hex: '#002400' },
  { slotIndex: 3, masterIndex: 23, hex: '#0049FF' },
  { slotIndex: 4, masterIndex: 39, hex: '#0092FF' },
  { slotIndex: 5, masterIndex: 63, hex: '#00FFFF' },
  { slotIndex: 6, masterIndex: 448, hex: '#FF0000' },
  { slotIndex: 7, masterIndex: 480, hex: '#FF9200' },
  { slotIndex: 8, masterIndex: 504, hex: '#FFFF00' },
  { slotIndex: 9, masterIndex: 73, hex: '#246D24' },
  { slotIndex: 10, masterIndex: 146, hex: '#49FF49' },
  { slotIndex: 11, masterIndex: 219, hex: '#6D6D6D' },
  { slotIndex: 12, masterIndex: 292, hex: '#929292' },
  { slotIndex: 13, masterIndex: 365, hex: '#B6B6B6' },
  { slotIndex: 14, masterIndex: 438, hex: '#DBB6DB' },
  { slotIndex: 15, masterIndex: 511, hex: '#FFFFFF' },
];

const makeTile = (id, name, fn) => ({
  id,
  name,
  width: 16,
  height: 16,
  screen5Palette: palette,
  pixels: Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => fn(x, y))),
});

const shootItemPosition = { x: 10, y: 5 };

const tiles = [
  makeTile('pong_tile_black', 'Black court', () => 1),
  makeTile('pong_tile_center_dash', 'Center dash', (x, y) => (x >= 7 && x <= 8 && y >= 2 && y <= 13 ? 13 : 1)),
  makeTile('pong_tile_top_bottom', 'Court rail', (_x, y) => (y < 2 || y > 13 ? 12 : 1)),
  makeTile('pong_tile_shoot_item', 'Shoot item target', (x, y) => {
    const ring = (x === 3 || x === 12) && y >= 5 && y <= 10
      || (y === 4 || y === 11) && x >= 4 && x <= 11;
    const core = x >= 6 && x <= 9 && y >= 6 && y <= 9;
    const shine = (x === 7 || x === 8) && y === 5;
    if (core) return 8;
    if (shine) return 15;
    if (ring) return 5;
    return 1;
  }),
];

const map = Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    if (y === 0 || y === 11) return 2;
    if (x === shootItemPosition.x && y === shootItemPosition.y) return 3;
    if (x === 7 && y % 2 === 0) return 1;
    return 0;
  })
);
const emptyLayer = Array.from({ length: 12 }, () => Array(16).fill(0));
const effectsLayer = Array.from({ length: 12 }, (_, y) =>
  Array.from({ length: 16 }, (_unused, x) => (
    x === shootItemPosition.x && y === shootItemPosition.y ? 3 : 0
  ))
);

const makeFrame = rows => rows.map(row =>
  row.split('').map(ch => {
    const slot = Number.parseInt(ch, 16);
    return slot ? palette[slot].hex : 'rgba(0,0,0,0)';
  })
);

const paddleFrame = makeFrame([
  '00000DDDD0000000',
  '0000FFFFFF000000',
  '0000555555000000',
  '0000555555000000',
  '0000555555000000',
  '0000555555000000',
  '0000FFFFFF000000',
  '0000555555000000',
  '0000555555000000',
  '0000555555000000',
  '0000555555000000',
  '0000FFFFFF000000',
  '0000555555000000',
  '0000555555000000',
  '0000FFFFFF000000',
  '00000DDDD0000000',
]);

const ballFrame = makeFrame([
  '0000000000000000',
  '0000000000000000',
  '0000000880000000',
  '0000008888000000',
  '0000088888800000',
  '00000FFFFFF00000',
  '00000FFFFFF00000',
  '0000088888800000',
  '0000008888000000',
  '0000000880000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
]);

const makeTransform = (x, y) => ({ tileX: x, tileY: y, pixelX: x * 16, pixelY: y * 16, spawnX: x * 16, spawnY: y * 16 });
const stateMachineAssetId = 'statemachine_pong_2_players_rules';
const worldAssetId = 'world_pong_2_players_msx2';
const gameFlowAssetId = 'gameflow_pong_2_players_msx2';

const project = {
  name: 'pong_2_players_msx2',
  currentProjectName: 'pong_2_players_msx2',
  currentScreenMode: 'SCREEN 4 (Graphics II)',
  screenMode: 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-pattern',
  selectedAssetId: gameFlowAssetId,
  currentEditor: 'GameFlow',
  assets: [
    {
      id: 'palette_pong_2_players_msx2',
      name: 'Pong 2P MSX2 Palette',
      type: 'palette',
      data: { mode: 'SCREEN4', slots: palette, notes: 'SCREEN 4 high contrast Pong palette.' },
    },
    {
      id: 'screen_pong_2_players_msx2',
      name: 'Pong 2P Court',
      type: 'msx2screen',
      data: {
        id: 'screen_pong_2_players_msx2',
        name: 'Pong 2P Court',
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
          effects: effectsLayer,
          behavior: emptyLayer,
          entities: [
            {
              id: 'entity_pong_p1_paddle',
              name: 'Player 1 Paddle',
              kind: 'player',
              position: { x: 1, y: 5 },
              spriteAssetId: 'sprite_pong_paddle_msx2',
              components: {
                msx2_transform: makeTransform(1, 5),
                msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_pong_paddle_msx2', frame: 0, paletteSlot: 15, visible: true },
                msx2_player_control: { controlMode: 'control_2_players', movementMode: 'control_2_players', jump: false, gravity: false, air: 0, disableAirTimer: true },
                control_2_players: { player1Input: 'cursors', player2Input: 'joystick1', axis: 'vertical', speed: 3, ballSpeed: 2, minY: 16, maxY: 160 },
                msx2_movement: { mode: 'control_2_players', speed: 3, minY: 1, maxY: 10 },
                msx2_paddle: { width: 8, height: 24, speed: 3, minX: 16, maxX: 16, sticky: false, serveBall: false },
                msx2_collision: { hitboxW: 8, hitboxH: 24, offsetX: 4, offsetY: 0, solid: true },
                comp_statemachine: { stateMachineAssetId, currentStateId: 'state_pong_play', isEnabled: true },
              },
              params: { runtime: 'MSX2', engine: 'control_2_players', controlMode: 'control_2_players', movement: 'control_2_players', speed: 3, stateMachineAssetId },
            },
            {
              id: 'entity_pong_p2_paddle',
              name: 'Player 2 Paddle',
              kind: 'enemy',
              position: { x: 14, y: 5 },
              spriteAssetId: 'sprite_pong_paddle_msx2',
              components: {
                msx2_transform: makeTransform(14, 5),
                msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_pong_paddle_msx2', frame: 0, paletteSlot: 15, visible: true },
                msx2_movement: { mode: 'static', speed: 0, direction: 0, minX: 14, maxX: 14, minY: 1, maxY: 10 },
                msx2_paddle: { width: 8, height: 24, speed: 3, minX: 224, maxX: 224, sticky: false, serveBall: false },
                msx2_collision: { hitboxW: 8, hitboxH: 24, offsetX: 4, offsetY: 0, solid: true },
                comp_statemachine: { stateMachineAssetId, currentStateId: 'state_pong_play', isEnabled: true },
              },
              params: { runtime: 'MSX2', engine: 'control_2_players', movement: 'static', speed: 0, stateMachineAssetId },
            },
            {
              id: 'entity_pong_ball',
              name: 'Pong Ball',
              kind: 'hazard',
              position: { x: 7, y: 5 },
              spriteAssetId: 'sprite_pong_ball_msx2',
              components: {
                msx2_transform: makeTransform(7, 5),
                msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_pong_ball_msx2', frame: 0, paletteSlot: 15, visible: true },
                msx2_ball: { speedX: 2, speedY: -2, minSpeed: 1, maxSpeed: 4, bounceAngle: 2, launchOnFire: false, resetOnMiss: true },
                msx2_movement: { mode: 'ballBounce', speed: 2, speedX: 2, speedY: -2, direction: 1, minX: 8, maxX: 232, minY: 16, maxY: 160, boundsUnit: 'px' },
                msx2_collision: { hitboxW: 8, hitboxH: 8, offsetX: 4, offsetY: 4, solid: false, damage: 0 },
                comp_statemachine: { stateMachineAssetId, currentStateId: 'state_pong_play', isEnabled: true },
              },
              params: { runtime: 'MSX2', engine: 'ballBounce', movement: 'ballBounce', speed: 2, speedX: 2, speedY: -2, minX: 8, maxX: 232, minY: 16, maxY: 160, boundsUnit: 'px', stateMachineAssetId },
            },
            {
              id: 'entity_pong_shoot_item',
              name: 'Shoot Item Target',
              kind: 'collectible',
              position: shootItemPosition,
              components: {
                msx2_transform: makeTransform(shootItemPosition.x, shootItemPosition.y),
                msx2_collectible: { value: 1, requiredForExit: false, eraseTile: true, persistent: false },
                msx2_score: { points: 50 },
                msx2_collision: { hitboxW: 16, hitboxH: 16, offsetX: 0, offsetY: 0, solid: false, isTrigger: true },
                comp_statemachine: { stateMachineAssetId, currentStateId: 'state_pong_play', isEnabled: true },
              },
              params: { runtime: 'MSX2', engine: 'collectible', role: 'shoot_item', points: 50, stateMachineAssetId },
            },
          ],
        },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          movementMode: 'control_2_players',
          controlMode: 'control_2_players',
          requiredCollectibles: 0,
          initialAir: 0,
          activeAreaX: 0,
          activeAreaY: 1,
          activeAreaWidth: 16,
          activeAreaHeight: 10,
          hideHud: true,
        },
        notes: 'Two-player Pong vertical slice. Player 1: cursor up/down. Player 2: joystick 1 up/down. The control_2_players component drives both paddles in the SCREEN 4 ROM runtime.',
      },
    },
    {
      id: worldAssetId,
      name: 'Pong 2P World',
      type: 'worldmap',
      data: {
        id: worldAssetId,
        name: 'Pong 2P World',
        nodes: [
          {
            id: 'world_node_pong_court',
            screenAssetId: 'screen_pong_2_players_msx2',
            name: 'Pong Court',
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
        startScreenNodeId: 'world_node_pong_court',
        gridSize: 64,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
      },
    },
    {
      id: gameFlowAssetId,
      name: 'Pong 2P Main',
      type: 'gameflow',
      data: {
        id: gameFlowAssetId,
        name: 'Pong 2P Main',
        startNodeId: 'gf_pong_start',
        panOffset: { x: 0, y: 0 },
        zoomLevel: 1,
        nodes: [
          {
            id: 'gf_pong_start',
            type: 'Start',
            position: { x: 0, y: 0 },
            systemConfig: {
              initPSG: true,
              clearSprites: true,
              resetVDP: true,
              clearVRAM: true,
              initialDelayFrames: 0,
            },
          },
          {
            id: 'gf_pong_world',
            type: 'WorldLink',
            worldAssetId,
            position: { x: 180, y: 0 },
          },
        ],
        connections: [
          {
            id: 'gf_pong_start_to_world',
            from: { nodeId: 'gf_pong_start', handle: 'default' },
            to: { nodeId: 'gf_pong_world', handle: 'input' },
            type: 'default',
          },
        ],
      },
    },
    {
      id: stateMachineAssetId,
      name: 'Pong 2P Rules',
      type: 'statemachine',
      data: {
        id: stateMachineAssetId,
        name: 'Pong 2P Rules',
        initialStateId: 'state_pong_play',
        events: [],
        states: [
          {
            id: 'state_pong_play',
            name: 'Running',
            position: { x: 0, y: 0 },
            properties: {
              rule: 'Update vertical paddles, advance the ball, apply wall/paddle bounces, and keep gameplay active.',
              p1Input: 'CURSORS up/down',
              p2Input: 'JOYSTICK1 up/down',
            },
          },
          {
            id: 'state_pong_item_hit',
            name: 'Take',
            position: { x: 220, y: -90 },
            properties: {
              rule: 'When the ball overlaps an effect value 3 cell, clear that item, add score, increment collectible count, and invert DY.',
              effectValue: 3,
              score: 50,
            },
          },
          {
            id: 'state_pong_paddle_hit',
            name: 'Shooting',
            position: { x: 220, y: 90 },
            properties: {
              rule: 'Paddle impact point selects one of six vertical ball angles.',
              dyValues: ['FD', 'FE', 'FF', '01', '02', '03'],
            },
          },
        ],
        transitions: [
          {
            id: 'transition_pong_play_to_item_hit',
            fromStateId: 'state_pong_play',
            toStateId: 'state_pong_item_hit',
            conditions: { type: 'HAS_COLLISION', params: { collisionType: 'item' } },
            actions: [
              { type: 'INCREMENT_VARIABLE', params: { variableName: 'score', amount: 50 } },
              { type: 'INCREMENT_VARIABLE', params: { variableName: 'collectibles', amount: 1 } },
            ],
          },
          {
            id: 'transition_pong_item_hit_to_play',
            fromStateId: 'state_pong_item_hit',
            toStateId: 'state_pong_play',
            conditions: { type: 'TIME_OUT', params: { frames: 1 } },
            actions: [{ type: 'NONE', params: {} }],
          },
          {
            id: 'transition_pong_play_to_paddle_hit',
            fromStateId: 'state_pong_play',
            toStateId: 'state_pong_paddle_hit',
            conditions: { type: 'HAS_COLLISION', params: { collisionType: 'entity' } },
            actions: [{ type: 'NONE', params: {} }],
          },
          {
            id: 'transition_pong_paddle_hit_to_play',
            fromStateId: 'state_pong_paddle_hit',
            toStateId: 'state_pong_play',
            conditions: { type: 'TIME_OUT', params: { frames: 1 } },
            actions: [{ type: 'NONE', params: {} }],
          },
        ],
      },
    },
    {
      id: 'sprite_pong_paddle_msx2',
      name: 'Pong Paddle',
      type: 'msx2sprite',
      data: {
        id: 'sprite_pong_paddle_msx2',
        name: 'Pong Paddle',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        size: { width: 16, height: 16 },
        palette,
        backgroundColor: 'rgba(0,0,0,0)',
        frames: [{ id: 'frame_pong_paddle', data: paddleFrame }],
        currentFrameIndex: 0,
        animationSpeedMs: 100,
        loops: true,
        hitbox: { width: 8, height: 16, offsetX: 4, offsetY: 0 },
        hardware: { x: 16, y: 80, color: 15, patternIndex: 0, useOrColor: true },
      },
    },
    {
      id: 'sprite_pong_ball_msx2',
      name: 'Pong Ball',
      type: 'msx2sprite',
      data: {
        id: 'sprite_pong_ball_msx2',
        name: 'Pong Ball',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        size: { width: 16, height: 16 },
        palette,
        backgroundColor: 'rgba(0,0,0,0)',
        frames: [{ id: 'frame_pong_ball', data: ballFrame }],
        currentFrameIndex: 0,
        animationSpeedMs: 100,
        loops: true,
        hitbox: { width: 8, height: 8, offsetX: 4, offsetY: 4 },
        hardware: { x: 120, y: 88, color: 15, patternIndex: 8, useOrColor: true },
      },
    },
  ],
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(project, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ json: outJson }, null, 2));

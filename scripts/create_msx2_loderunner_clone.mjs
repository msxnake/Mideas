import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'json', 'loderunner_msx2_mideas.json');
const outDownloads = 'C:/Users/salam/Downloads/loderunner_msx2_mideas.json';
const outReport = 'C:/Users/salam/Downloads/loderunner_msx2_validation.md';

const palette = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 2, masterIndex: 73, hex: '#246D24' },
  { slotIndex: 3, masterIndex: 146, hex: '#49FF49' },
  { slotIndex: 4, masterIndex: 23, hex: '#0049FF' },
  { slotIndex: 5, masterIndex: 39, hex: '#0092FF' },
  { slotIndex: 6, masterIndex: 448, hex: '#FF0000' },
  { slotIndex: 7, masterIndex: 480, hex: '#FF9200' },
  { slotIndex: 8, masterIndex: 504, hex: '#FFFF00' },
  { slotIndex: 9, masterIndex: 292, hex: '#929292' },
  { slotIndex: 10, masterIndex: 365, hex: '#B6B6B6' },
  { slotIndex: 11, masterIndex: 511, hex: '#FFFFFF' },
  { slotIndex: 12, masterIndex: 260, hex: '#922400' },
  { slotIndex: 13, masterIndex: 456, hex: '#FF4949' },
  { slotIndex: 14, masterIndex: 438, hex: '#DBB6DB' },
  { slotIndex: 15, masterIndex: 63, hex: '#00FFFF' },
];

const tile = (id, name, draw) => ({
  id,
  name,
  width: 16,
  height: 16,
  screen5Palette: palette,
  pixels: Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => draw(x, y))),
});

const tileFromRows = (id, name, rows) => ({
  id,
  name,
  width: 16,
  height: 16,
  screen5Palette: palette,
  pixels: rows.map(row => row.split('').map(ch => parseInt(ch, 16))),
});

const steelPixels = Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
  if (y === 15) return 1;
  if (x === 0 || x === 15 || y === 0 || y === 14) return 9;
  if (x === 1 || x === 14 || y === 1 || y === 13) return 10;
  if ((x === 3 || x === 12) && (y === 3 || y === 11)) return 11;
  if ((x + y) % 6 === 0) return 10;
  if ((x === y || x + y === 15) && y > 3 && y < 12) return 11;
  return 9;
}));

const tiles = [
  tileFromRows('lr_empty', 'Empty mine air', [
    '1111111111111111', '1111111111111111', '1111111111111111', '1111112111111111',
    '1111111111111111', '1111111111111111', '1111111111111211', '1111111111111111',
    '1111111111111111', '1121111111111111', '1111111111111111', '1111111111111111',
    '1111111111211111', '1111111111111111', '1111111111111111', '1111111111111111',
  ]),
  tileFromRows('lr_brick', 'Diggable brick', [
    'CCCCCCCCCCCCCCCC', 'C777777C7777777C', 'C766666C7666667C', 'C666666C6666666C',
    'CCCCCCCCCCCCCCCC', '777C7777777C7777', '766C6666666C6667', '666C6666666C6666',
    'CCCCCCCCCCCCCCCC', 'C777777C7777777C', 'C766666C7666667C', 'C666666C6666666C',
    'CCCCCCCCCCCCCCCC', '777C7777777C7777', '766C6666666C6667', 'CCCCCCCCCCCCCCCC',
  ]),
  { id: 'lr_steel', name: 'Steel wall', width: 16, height: 16, screen5Palette: palette, pixels: steelPixels },
  tileFromRows('lr_ladder', 'Ladder', [
    '1111111111111111', '1117C111111C7111', '1118C111111C8111', '1118CCCCCCCC8111',
    '1118C111111C8111', '1118C111111C8111', '1118CCCCCCCC8111', '1118C111111C8111',
    '1118C111111C8111', '1118CCCCCCCC8111', '1118C111111C8111', '1118C111111C8111',
    '1118CCCCCCCC8111', '1118C111111C8111', '1117C111111C7111', '1111111111111111',
  ]),
  tileFromRows('lr_rope', 'Hand rope', [
    '1111111111111111', '1111111111111111', '1111111111111111', '1111111111111111',
    '7777777777777777', 'C7C777C7C777C7C7', '1117111111171111', '1117111111171111',
    '111C1111111C1111', '1111111111111111', '1111111111111111', '1111111111111111',
    '1111111111111111', '1111111111111111', '1111111111111111', '1111111111111111',
  ]),
  tileFromRows('lr_gold', 'Gold', [
    '1111111111111111', '1111111111111111', '1111118881111111', '1111888888111111',
    '1118888888811111', '118888BBBB881111', '11888B888BB81111', '11888B88B8B81111',
    '1188888888881111', '1118877777881111', '1111777777111111', '1111177771111111',
    '1111111111111111', '1111111111111111', '1111111111111111', '1111111111111111',
  ]),
  tileFromRows('lr_exit', 'Exit ladder', [
    '1111113331111111', '1111133333311111', '1111132223311111', '1113333333331111',
    '1113C111111C3111', '1113C111111C3111', '1113CCCCCCCC3111', '1113C111111C3111',
    '1113C111111C3111', '1113CCCCCCCC3111', '1113C111111C3111', '1113C111111C3111',
    '1113CCCCCCCC3111', '1113C111111C3111', '1113C111111C3111', '1111111111111111',
  ]),
  tileFromRows('lr_trap', 'False brick trap', [
    '1111111111111111', '1C77777C77777711', '1C76666C76666711', '1166C66C66666111',
    '1111C1111C111111', '777C77711C777711', '766C666C1C666711', '666C6666CC666611',
    'CCCCCCCCC1111111', '1C777777C7711111', '1C766666C6677111', '11666666C6666111',
    '1111CCCCCCCC1111', '111777C777777111', '111766C666667111', '1111111111111111',
  ]),
];

const frameFrom = rows => rows.map(row => row.split('').map(ch => {
  const slot = parseInt(ch, 16);
  return slot ? palette[slot].hex : 'rgba(0,0,0,0)';
}));

const playerFrame = frameFrom([
  '0000008888000000',
  '0000088888800000',
  '000008B88B800000',
  '0000088888800000',
  '0000008888000000',
  '0000044444400000',
  '000044B44B440000',
  '0004044444404000',
  '0000044444400000',
  '0000004444000000',
  '0000004004000000',
  '0000044004400000',
  '0000440000440000',
  '0004400000044000',
  '0000000000000000',
  '0000000000000000',
]);

const guardFrame = frameFrom([
  '000000DDDD000000',
  '00000DDDDDD00000',
  '00000DBDDBD00000',
  '00000DDDDDD00000',
  '000000DDDD000000',
  '0000999999900000',
  '00099D999D990000',
  '0090999999909000',
  '0000999999900000',
  '0000009999000000',
  '0000009009000000',
  '0000099009900000',
  '0000990000990000',
  '0009900000099000',
  '0000000000000000',
  '0000000000000000',
]);

const makeSprite = (id, name, frame, color, patternIndex, facingDirection = 'right') => ({
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
    backgroundColor: 'rgba(0,0,0,0)',
    frames: [{ id: `${id}_idle`, data: frame }],
    currentFrameIndex: 0,
    animationSpeedMs: 120,
    loops: true,
    facingDirection,
    authoredPerspective: 'side',
    mirrorPolicy: {
      horizontal: 'autoFromFacingDirection',
      authoredDirection: facingDirection,
    },
    hitbox: { width: 14, height: 15, offsetX: 1, offsetY: 1 },
    hardware: { x: 0, y: 0, color, patternIndex },
  },
});

const makeTransform = (x, y) => ({ tileX: x, tileY: y, pixelX: x * 16, pixelY: y * 16, spawnX: x * 16, spawnY: y * 16 });

const layout = [
  '################',
  '#..H.......G..E#',
  '#G.H..BBBBB....#',
  '#BBBB....H.....#',
  '#....RRRRH..G..#',
  '#..G.....HBBBB.#',
  '#BBBBBBBBH.....#',
  '#.......TH..G..#',
  '#..RRRRR...BBBB#',
  '#H...G......H..#',
  '#PBBBB..G...H..#',
  '################',
];

const tileIndexFor = { '.': 0, '#': 2, 'B': 1, 'H': 3, 'R': 4, 'G': 5, 'E': 6, 'T': 7, 'P': 0 };
const map = layout.map(row => row.split('').map(ch => tileIndexFor[ch] ?? 0));
const collision = layout.map(row => row.split('').map(ch => (ch === '#' || ch === 'B' ? 1 : 0)));
const effects = layout.map(row => row.split('').map(ch => (ch === 'G' ? 3 : ch === 'E' ? 2 : 0)));
const behavior = layout.map(row => row.split('').map(ch => (ch === 'H' || ch === 'E' ? 1 : ch === 'R' ? 4 : 0)));
const requiredCollectibles = layout.join('').split('G').length - 1;

const stateMachineAssetId = 'statemachine_loderunner_msx2_rules';
const worldAssetId = 'world_loderunner_msx2';
const gameFlowAssetId = 'gameflow_loderunner_msx2';
const screenAssetId = 'screen_loderunner_msx2_level1';

const entities = [
  {
    id: 'entity_loderunner_player',
    name: 'Player Runner',
    kind: 'player',
    position: { x: 1, y: 10 },
    spriteAssetId: 'sprite_loderunner_player_msx2',
    components: {
      msx2_transform: makeTransform(1, 10),
      msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_loderunner_player_msx2', frame: 0, paletteSlot: 8, visible: true },
      msx2_player_control: { controlMode: 'platform', movementMode: 'platform', jump: false, gravity: true, air: 0, disableAirTimer: true },
      msx2_gravity: { enabled: true, strength: 64, terminalVelocity: 1024 },
      msx2_movement: { mode: 'platform', speed: 2 },
      msx2_collision: { hitboxW: 14, hitboxH: 15, offsetX: 1, offsetY: 1, solid: false, damage: 0 },
      msx2_health: { current: 3, max: 3, invincibleFrames: 45, deathAction: 'respawn' },
      msx2_spawn: { spawnOnScreenLoad: true, respawn: true, respawnDelayFrames: 45 },
      msx2_lives: { lives: 3, maxLives: 3, gameOverAction: 'restart' },
      comp_statemachine: { stateMachineAssetId, currentStateId: 'state_run', isEnabled: true },
    },
    params: { runtime: 'MSX2', engine: 'platform', controlMode: 'platform', movementMode: 'platform', speed: 2, stateMachineAssetId },
  },
  {
    id: 'entity_loderunner_guard_a',
    name: 'Guard A',
    kind: 'enemy',
    position: { x: 10, y: 5 },
    spriteAssetId: 'sprite_loderunner_guard_msx2',
    components: {
      msx2_transform: makeTransform(10, 5),
      msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_loderunner_guard_msx2', frame: 0, paletteSlot: 13, visible: true },
      msx2_movement: { mode: 'patrolX', speed: 3, direction: 1, minX: 8, maxX: 13, boundsUnit: 'tile' },
      msx2_ai: { engine: 'patrol', initialDirection: 'right', turnPolicy: 'reverse' },
      msx2_collision: { hitboxW: 14, hitboxH: 15, offsetX: 1, offsetY: 1, solid: false, damage: 1 },
      msx2_damage: { amount: 1, mode: 'contact', cooldownFrames: 45 },
      msx2_health: { current: 1, max: 1 },
    },
    params: { runtime: 'MSX2', engine: 'patrolX', movement: 'patrolX', direction: 1, speed: 3, minX: 8, maxX: 13, stateMachineAssetId },
  },
  {
    id: 'entity_loderunner_guard_b',
    name: 'Guard B',
    kind: 'enemy',
    position: { x: 5, y: 9 },
    spriteAssetId: 'sprite_loderunner_guard_msx2',
    components: {
      msx2_transform: makeTransform(5, 9),
      msx2_hardware_sprite: { msx2SpriteAssetId: 'sprite_loderunner_guard_msx2', frame: 0, paletteSlot: 13, visible: true },
      msx2_movement: { mode: 'patrolX', speed: 4, direction: -1, minX: 1, maxX: 7, boundsUnit: 'tile' },
      msx2_ai: { engine: 'patrol', initialDirection: 'left', turnPolicy: 'reverse' },
      msx2_collision: { hitboxW: 14, hitboxH: 15, offsetX: 1, offsetY: 1, solid: false, damage: 1 },
      msx2_damage: { amount: 1, mode: 'contact', cooldownFrames: 45 },
      msx2_health: { current: 1, max: 1 },
    },
    params: { runtime: 'MSX2', engine: 'patrolX', movement: 'patrolX', direction: -1, speed: 4, minX: 1, maxX: 7, stateMachineAssetId },
  },
  {
    id: 'entity_loderunner_exit',
    name: 'Exit after all gold',
    kind: 'door',
    position: { x: 14, y: 1 },
    components: {
      msx2_transform: makeTransform(14, 1),
      msx2_door_exit: { targetScreenId: '', requiresCollectibles: true, locked: true },
      msx2_screen_transition: { requiresCollectibles: true, lockIfMissingTarget: false },
      msx2_collision: { hitboxW: 16, hitboxH: 16, offsetX: 0, offsetY: 0, solid: false },
    },
    params: { runtime: 'MSX2', engine: 'door', requiresCollectibles: true },
  },
];

const stateMachine = {
  id: stateMachineAssetId,
  name: 'Lode Runner MSX2 Rules',
  initialStateId: 'state_run',
  states: [
    { id: 'state_run', name: 'Running', position: { x: 60, y: 100 } },
    { id: 'state_climb', name: 'Climbing', position: { x: 260, y: 40 } },
    { id: 'state_collect', name: 'Take', position: { x: 260, y: 160 } },
    { id: 'state_escape', name: 'Interacting', position: { x: 460, y: 100 } },
  ],
  events: [],
  transitions: [
    { id: 'tr_run_climb', fromStateId: 'state_run', toStateId: 'state_climb', conditions: { type: 'KEY_PRESSED', params: { key: 'up' } } },
    { id: 'tr_climb_run', fromStateId: 'state_climb', toStateId: 'state_run', conditions: { type: 'KEY_RELEASED', params: { key: 'up' } } },
    { id: 'tr_collect', fromStateId: 'state_run', toStateId: 'state_collect', conditions: { type: 'HAS_COLLISION', params: { collisionType: 'item' } }, actions: [{ type: 'INCREMENT_VARIABLE', params: { variable: 'Gold', amount: 1 } }] },
    { id: 'tr_collect_run', fromStateId: 'state_collect', toStateId: 'state_run', conditions: { type: 'TIME_OUT', params: { frames: 1 } } },
    { id: 'tr_escape', fromStateId: 'state_run', toStateId: 'state_escape', conditions: { type: 'VARIABLE_COMPARE', params: { variableName: 'Gold', operator: '>=', compareValue: requiredCollectibles } } },
  ],
};

const project = {
  name: 'loderunner_msx2',
  currentProjectName: 'loderunner_msx2',
  projectName: 'Lode Runner MSX2',
  projectVersion: '0.1.0',
  projectDescription: 'Lode Runner-style MSX2 SCREEN 4 project built in Mideas: ladders, platforms, gold, guards and gated exit.',
  currentScreenMode: 'SCREEN 4 (Graphics II)',
  screenMode: 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-pattern',
  selectedAssetId: screenAssetId,
  currentEditor: 'Msx2Screen',
  assets: [
    { id: 'palette_loderunner_msx2', name: 'Lode Runner MSX2 Palette', type: 'palette', data: { mode: 'SCREEN4', slots: palette, notes: 'SCREEN 4 palette for Lode Runner style mine graphics.' } },
    makeSprite('sprite_loderunner_player_msx2', 'MSX2 Runner Sprite', playerFrame, 8, 0),
    makeSprite('sprite_loderunner_guard_msx2', 'MSX2 Guard Sprite', guardFrame, 13, 4),
    {
      id: screenAssetId,
      name: 'Lode Runner Level 1',
      type: 'msx2screen',
      data: {
        id: screenAssetId,
        name: 'Lode Runner Level 1',
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        tileSize: 16,
        widthTiles: 16,
        heightTiles: 12,
        palette,
        tiles,
        map,
        collisionMap: collision,
        layers: { collision, effects, behavior, entities },
        runtime: {
          screenKind: 'playable',
          screenEngine: 'player',
          movementMode: 'platform',
          controlMode: 'platform',
          playerMode: 'platform',
          requiredCollectibles,
          initialAir: 0,
          disableAirTimer: true,
          activeAreaX: 0,
          activeAreaY: 0,
          activeAreaWidth: 16,
          activeAreaHeight: 12,
          hideHud: false,
          showHud: true,
          statusHud: true,
          notes: 'Cursors move. Up/down use behavior=1 ladder cells. Ropes use behavior=4. Gold uses effect=3. Exit uses effect=2 and requires all gold.',
        },
        notes: 'MSX2 SCREEN 4 Lode Runner clone slice. Bricks are solid; ladder cells are behavior layer 1; rope cells are behavior layer 4; gold and exit are effect layer cells.',
      },
    },
    {
      id: worldAssetId,
      name: 'Lode Runner MSX2 World',
      type: 'worldmap',
      data: {
        id: worldAssetId,
        name: 'Lode Runner MSX2 World',
        nodes: [{ id: 'world_node_loderunner_level1', screenAssetId, name: 'Level 1', position: { x: 0, y: 0 } }],
        connections: [],
        startScreenNodeId: 'world_node_loderunner_level1',
        gridSize: 64,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
      },
    },
    {
      id: gameFlowAssetId,
      name: 'Main',
      type: 'gameflow',
      data: {
        id: gameFlowAssetId,
        name: 'Main',
        nodes: [
          { id: 'gf_start', type: 'Start', position: { x: 40, y: 120 }, initializeGlobals: { enabled: true, globalVariablesAssetId: 'globals_loderunner_msx2', variables: [{ variableName: 'Gold', value: 0 }, { variableName: 'Lives', value: 3 }] } },
          { id: 'gf_cls', type: 'Transition', position: { x: 220, y: 120 }, effect: 'cls', duration: 120 },
          { id: 'gf_world', type: 'WorldLink', position: { x: 420, y: 120 }, worldAssetId },
        ],
        connections: [
          { id: 'gf_conn_start_cls', from: { nodeId: 'gf_start' }, to: { nodeId: 'gf_cls' } },
          { id: 'gf_conn_cls_world', from: { nodeId: 'gf_cls' }, to: { nodeId: 'gf_world' } },
        ],
        startNodeId: 'gf_start',
        panOffset: { x: 0, y: 0 },
        zoomLevel: 1,
      },
    },
    { id: stateMachineAssetId, name: 'Lode Runner MSX2 Rules', type: 'statemachine', data: stateMachine },
    {
      id: 'globals_loderunner_msx2',
      name: 'Lode Runner MSX2 Globals',
      type: 'globalvariables',
      data: {
        customVariables: [
          { id: 'var_gold', name: 'Gold', type: 'byte', initialValue: 0, description: 'Gold collected in the current level.' },
          { id: 'var_lives', name: 'Lives', type: 'byte', initialValue: 3, description: 'Remaining lives.' },
        ],
      },
    },
  ],
  gameContract: {
    target: 'MSX2',
    vdpMode: 'SCREEN4',
    playerEntityId: 'entity_loderunner_player',
    initialScreenAssetId: screenAssetId,
    worldAssetId,
    gameFlowAssetId,
    stateMachineAssetId,
    requiredCollectibles,
    runtimeLayers: { collision: 'solid walls and bricks', behavior: 'ladder cells and rope cells', effects: 'gold=3, exit=2' },
  },
};

const checks = {
  target_msx2_screen4: project.currentScreenMode === 'SCREEN 4 (Graphics II)' && project.targetGraphicsBackend === 'msx2-screen4-pattern',
  has_msx2screen: project.assets.some(asset => asset.type === 'msx2screen'),
  has_player: entities.some(entity => entity.kind === 'player'),
  has_guards: entities.filter(entity => entity.kind === 'enemy').length >= 2,
  has_collectibles: requiredCollectibles >= 6,
  has_exit: effects.flat().some(value => value === 2),
  has_ladders: behavior.flat().some(value => value === 1),
  has_ropes: behavior.flat().some(value => value === 4),
  has_side_facing_msx2_sprites: project.assets
    .filter(asset => asset.type === 'msx2sprite')
    .every(asset => asset.data?.facingDirection === 'right' && asset.data?.mirrorPolicy?.horizontal === 'autoFromFacingDirection'),
  has_world_gameflow_state_machine: [worldAssetId, gameFlowAssetId, stateMachineAssetId].every(id => project.assets.some(asset => asset.id === id)),
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(project, null, 2), 'utf8');
fs.mkdirSync(path.dirname(outDownloads), { recursive: true });
fs.writeFileSync(outDownloads, JSON.stringify(project, null, 2), 'utf8');

const report = [
  '# Lode Runner MSX2 validation',
  '',
  'Date: 2026-05-22',
  '',
  `Project JSON: ${outDownloads}`,
  '',
  '## Checks',
  ...Object.entries(checks).map(([key, ok]) => `- ${ok ? 'PASS' : 'FAIL'}: ${key}`),
  '',
  '## Runtime contract',
  `- SCREEN 4 tiles: ${tiles.length}`,
  `- Gold required: ${requiredCollectibles}`,
  '- Player movement: platform mode, hardware sprite.',
  '- Sprite perspective: side-view authored facing right; Mideas mirrors horizontally from facingDirection.',
  '- Ladders: behavior layer value 1.',
  '- Ropes: behavior layer value 4.',
  '- Gold: effects layer value 3.',
  '- Exit: effects layer value 2, gated by required collectibles.',
  '- Guards: MSX2 patrolX enemy entities with contact damage.',
  '',
].join('\n');
fs.writeFileSync(outReport, report, 'utf8');

console.log(JSON.stringify({ outJson, outDownloads, outReport, checks, requiredCollectibles }, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);

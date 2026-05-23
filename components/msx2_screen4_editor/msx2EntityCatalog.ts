import { Msx2EntityKind } from '../../types';

export type Msx2ComponentId =
  | 'msx2_transform'
  | 'msx2_hardware_sprite'
  | 'msx2_player_control'
  | 'msx2_movement'
  | 'msx2_collision'
  | 'msx2_collectible'
  | 'msx2_door_exit'
  | 'msx2_hazard'
  | 'msx2_ai'
  | 'msx2_animation'
  | 'msx2_health'
  | 'msx2_damage'
  | 'msx2_spawn'
  | 'msx2_checkpoint'
  | 'msx2_screen_transition'
  | 'msx2_inventory'
  | 'msx2_score'
  | 'msx2_timer'
  | 'msx2_platform'
  | 'msx2_shooter'
  | 'msx2_projectile'
  | 'msx2_formation'
  | 'msx2_attack_pattern'
  | 'msx2_attack_wave'
  | 'msx2_wave'
  | 'msx2_lives'
  | 'control_2_players'
  | 'msx2_paddle'
  | 'msx2_ball'
  | 'msx2_brick'
  | 'msx2_char_render'
  | 'msx2_snake'
  | 'msx2_snake_segment'
  | 'msx2_scroll';

export interface Msx2ComponentDefinition {
  id: Msx2ComponentId;
  label: string;
  description: string;
  defaults: Record<string, any>;
}

export type Msx2RuntimeEngine =
  | 'platform'
  | 'maze'
  | 'shooterHorizontal'
  | 'staticEnemy'
  | 'ghostMaze'
  | 'patrolX'
  | 'patrolY'
  | 'hazard'
  | 'collectible'
  | 'door'
  | 'checkpoint'
  | 'control_2_players'
  | 'paddleHorizontal'
  | 'ballBounce'
  | 'brick'
  | 'snakeChar'
  | 'snakeFood';

export interface Msx2EntityCreatePreset {
  id: string;
  label: string;
  kind: Exclude<Msx2EntityKind, 'custom'>;
  runtime: 'MSX2';
  engine: Msx2RuntimeEngine;
  description: string;
  components: Partial<Record<Msx2ComponentId, Record<string, any>>>;
  params?: Record<string, any>;
}

export const MSX2_COMPONENT_REPERTOIRE: Msx2ComponentDefinition[] = [
  {
    id: 'msx2_transform',
    label: 'Position',
    description: 'Native MSX2 tile and pixel position for SCREEN 4 entities.',
    defaults: { tileX: 0, tileY: 0, pixelX: 0, pixelY: 0, spawnX: 0, spawnY: 0 },
  },
  {
    id: 'msx2_hardware_sprite',
    label: 'Render',
    description: 'MSX2 hardware sprite render binding and animation frame state.',
    defaults: { msx2SpriteAssetId: '', frame: 0, paletteSlot: 5, visible: true },
  },
  {
    id: 'msx2_player_control',
    label: 'Player Control',
    description: 'Player-only control mode for the MSX2 runtime.',
    defaults: { controlMode: 'maze', movementMode: 'maze', jump: false, gravity: false, air: 0, disableAirTimer: true },
  },
  {
    id: 'msx2_movement',
    label: 'Movement',
    description: 'Native MSX2 movement mode and patrol bounds.',
    defaults: { mode: 'static', speed: 2, direction: 1, minX: 0, maxX: 0, minY: 0, maxY: 0, boundsUnit: 'tile' },
  },
  {
    id: 'msx2_collision',
    label: 'Collision',
    description: 'Runtime hitbox and solidity for MSX2 entity tables.',
    defaults: { hitboxW: 16, hitboxH: 16, offsetX: 0, offsetY: 0, solid: false, damage: 0 },
  },
  {
    id: 'msx2_collectible',
    label: 'Collectible',
    description: 'Collectible counter and erase behavior owned by the MSX2 runtime.',
    defaults: { value: 1, requiredForExit: true, eraseTile: true, persistent: true },
  },
  {
    id: 'msx2_door_exit',
    label: 'Door Exit',
    description: 'Door or exit behavior for MSX2 screen progression.',
    defaults: { targetScreenId: '', requiresCollectibles: true, locked: true },
  },
  {
    id: 'msx2_hazard',
    label: 'Hazard',
    description: 'Damage and respawn behavior for hazards in the MSX2 runtime.',
    defaults: { damage: 1, respawn: true, instantDeath: false },
  },
  {
    id: 'msx2_ai',
    label: 'AI',
    description: 'Small built-in MSX2 AI engines such as maze ghost or patrol.',
    defaults: { engine: 'patrol', initialDirection: 'right', turnPolicy: 'reverse' },
  },
  {
    id: 'msx2_animation',
    label: 'Animation',
    description: 'Hardware sprite animation state owned by the MSX2 runtime.',
    defaults: { animation: 'idle', frameStart: 0, frameCount: 1, frameDelay: 8, loop: true, animateOnlyWhenMoving: false },
  },
  {
    id: 'msx2_health',
    label: 'Health',
    description: 'Small byte-sized life state for player, enemies, and destructibles.',
    defaults: { current: 1, max: 1, invincibleFrames: 0, deathAction: 'none' },
  },
  {
    id: 'msx2_damage',
    label: 'Damage',
    description: 'Contact or trigger damage emitted by an entity.',
    defaults: { amount: 1, mode: 'contact', cooldownFrames: 30, knockback: 0 },
  },
  {
    id: 'msx2_spawn',
    label: 'Spawn',
    description: 'Spawn and respawn metadata for native MSX2 screens.',
    defaults: { spawnOnScreenLoad: true, respawn: false, respawnDelayFrames: 60, preserveAfterCollect: false },
  },
  {
    id: 'msx2_checkpoint',
    label: 'Checkpoint',
    description: 'Respawn marker controlled by the MSX2 runtime.',
    defaults: { enabled: true, setPlayerSpawn: true, oneShot: false },
  },
  {
    id: 'msx2_screen_transition',
    label: 'Screen Transition',
    description: 'Native MSX2 screen or world transition trigger.',
    defaults: { targetScreenId: '', direction: 'auto', requiresCollectibles: false, lockIfMissingTarget: true },
  },
  {
    id: 'msx2_inventory',
    label: 'Inventory',
    description: 'Key/item payload used by doors and collectible gates.',
    defaults: { itemId: '', amount: 1, consumeOnUse: false, requiredItemId: '' },
  },
  {
    id: 'msx2_score',
    label: 'Score',
    description: 'Score payload for collectible and enemy interactions.',
    defaults: { points: 0, variableId: 'score', addOnCollect: true },
  },
  {
    id: 'msx2_timer',
    label: 'Timer',
    description: 'Frame or air countdown data for screen-local MSX2 logic.',
    defaults: { initialValue: 255, tickRateFrames: 60, onZero: 'none', hud: false },
  },
  {
    id: 'msx2_platform',
    label: 'Platform',
    description: 'Solid moving platform metadata for future MSX2 platformer runtime.',
    defaults: { carriesPlayer: true, oneWay: false, speed: 1, minX: 0, maxX: 0, minY: 0, maxY: 0 },
  },
  {
    id: 'msx2_shooter',
    label: 'Shooter',
    description: 'Shooter firing metadata for MSX2 arcade runtimes.',
    defaults: { enabled: true, fireKey: 'space', cooldownFrames: 18, projectilePresetId: 'player_laser', maxProjectiles: 1 },
  },
  {
    id: 'msx2_projectile',
    label: 'Projectile',
    description: 'Projectile movement, ownership, and hit payload for MSX2 shooters.',
    defaults: { owner: 'player', velocityX: 0, velocityY: -4, damage: 1, expireOnHit: true, maxDistance: 192 },
  },
  {
    id: 'msx2_formation',
    label: 'Formation',
    description: 'Grid formation slot metadata for Galaxian-style enemy groups.',
    defaults: { row: 0, column: 0, groupId: 'main', homeX: 0, homeY: 0, spacingX: 2, spacingY: 1 },
  },
  {
    id: 'msx2_attack_pattern',
    label: 'Attack Pattern',
    description: 'Attack selection metadata for enemies leaving formation.',
    defaults: { pattern: 'circle', trigger: 'wave', triggerFrames: 120, returnToFormation: true, fireDuringDive: false },
  },
  {
    id: 'msx2_attack_wave',
    label: 'Attack Wave',
    description: 'Galaxian-style timed attack waves: how often a random group leaves formation and how many attackers launch.',
    defaults: { enabled: true, intervalFrames: 180, minAttackers: 1, maxAttackers: 3, randomSeed: 73 },
  },
  {
    id: 'msx2_wave',
    label: 'Wave',
    description: 'Screen-level wave metadata attached to a controller entity.',
    defaults: { waveId: 1, enemyCount: 0, nextWaveScreenId: '', clearCondition: 'allEnemies' },
  },
  {
    id: 'msx2_lives',
    label: 'Lives',
    description: 'Arcade life counter payload for players and wave controllers.',
    defaults: { lives: 3, maxLives: 3, extraLifeAt: 10000, gameOverAction: 'restart' },
  },
  {
    id: 'control_2_players',
    label: '2P Controls',
    description: 'Two-player Pong controls: player 1 uses cursor keys and player 2 uses joystick 1.',
    defaults: { player1Input: 'cursors', player2Input: 'joystick1', axis: 'vertical', speed: 3, ballSpeed: 2 },
  },
  {
    id: 'msx2_paddle',
    label: 'Paddle',
    description: 'Horizontal bat/paddle control for Pong and brick-breaker MSX2 runtimes.',
    defaults: { width: 32, height: 8, speed: 4, minX: 0, maxX: 224, sticky: false, serveBall: true },
  },
  {
    id: 'msx2_ball',
    label: 'Ball',
    description: 'Ball velocity, bounce, and serve metadata for Pong and brick-breaker MSX2 runtimes.',
    defaults: { speedX: 2, speedY: -2, minSpeed: 1, maxSpeed: 4, bounceAngle: 3, launchOnFire: true, resetOnMiss: true },
  },
  {
    id: 'msx2_brick',
    label: 'Brick',
    description: 'Breakable block metadata for Arkanoid-style MSX2 screens.',
    defaults: { hitPoints: 1, points: 10, breakable: true, powerUpId: '', clearTileId: '', groupId: 'main' },
  },
  {
    id: 'msx2_char_render',
    label: 'Char Render',
    description: 'SCREEN 4 name-table character/tile render binding for low-cost MSX2 actors.',
    defaults: { tileId: '', charCode: 0, paletteSlot: 7, clearTileId: '', useHardwareSprite: false },
  },
  {
    id: 'msx2_snake',
    label: 'Snake',
    description: 'Grid-based snake head state for SCREEN 4 char/tile runtimes.',
    defaults: { direction: 'right', nextDirection: 'right', speedFrames: 8, growBy: 1, wrapEdges: false, startLength: 3 },
  },
  {
    id: 'msx2_snake_segment',
    label: 'Snake Segment',
    description: 'Snake body segment metadata for ordered char/tile trail updates.',
    defaults: { segmentIndex: 0, followsHead: true, eraseTail: true, solidBody: true },
  },
  {
    id: 'msx2_scroll',
    label: 'Scroll',
    description: 'Conditional MSX2 scroll contract: vertical can use V9938 R#23, horizontal must be tile, software, VDP-copy, R#18 adjustment, or hybrid and pass visual/performance checks.',
    defaults: {
      scrollDirection: 'vertical',
      scrollMode: 'hardware',
      screenMode: 'SCREEN4',
      scrollSpeedX: 0,
      scrollSpeedY: 1,
      cameraX: 0,
      cameraY: 0,
      tileSize: 16,
      vramPage: 0,
      bufferMode: 'streaming',
      maskBorders: true,
      updateBudget: 32,
      spriteScrollCompensation: true,
    },
  },
];

export const MSX2_ENTITY_KIND_OPTIONS: Array<{ value: Exclude<Msx2EntityKind, 'custom'>; label: string }> = [
  { value: 'player', label: 'Player' },
  { value: 'enemy', label: 'Enemy' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'collectible', label: 'Collectible' },
  { value: 'door', label: 'Door' },
];

export const MSX2_ENTITY_MOVEMENT_OPTIONS = [
  { value: 'static', label: 'Static' },
  { value: 'maze', label: 'Maze Player' },
  { value: 'shooterHorizontal', label: 'Shooter Horizontal' },
  { value: 'paddleHorizontal', label: 'Paddle Horizontal' },
  { value: 'ballBounce', label: 'Ball Bounce' },
  { value: 'snakeChar', label: 'Snake Char Grid' },
  { value: 'control_2_players', label: '2P Pong Controls' },
  { value: 'patrolX', label: 'Patrol X' },
  { value: 'patrolY', label: 'Patrol Y' },
  { value: 'ghostMaze', label: 'Ghost Maze' },
] as const;

export const MSX2_ENTITY_REPERTOIRE: Msx2EntityCreatePreset[] = [
  {
    id: 'player',
    label: 'MSX2 Player Platform',
    kind: 'player',
    runtime: 'MSX2',
    engine: 'platform',
    description: 'Hardware sprite platform player controlled by the MSX2 SCREEN 4 runtime.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_player_control: { controlMode: 'platform', movementMode: 'platform', jump: true, gravity: true, air: 255, disableAirTimer: false },
      msx2_animation: { animation: 'player_idle', frameCount: 2, frameDelay: 8, animateOnlyWhenMoving: true },
      msx2_health: { current: 3, max: 3, invincibleFrames: 60, deathAction: 'respawn' },
      msx2_spawn: { spawnOnScreenLoad: true, respawn: true, respawnDelayFrames: 45 },
      msx2_timer: { initialValue: 255, tickRateFrames: 60, onZero: 'damage', hud: true },
      msx2_collision: { solid: false, hitboxW: 14, hitboxH: 15, offsetX: 1, offsetY: 1 },
    },
    params: { runtime: 'MSX2', engine: 'platform', controlMode: 'platform', movementMode: 'platform' },
  },
  {
    id: 'player_maze',
    label: 'MSX2 Player Maze',
    kind: 'player',
    runtime: 'MSX2',
    engine: 'maze',
    description: 'Grid-gated maze player for Pac-Man style MSX2 screens.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_player_control: { controlMode: 'maze', movementMode: 'maze', jump: false, gravity: false, air: 0, disableAirTimer: true },
      msx2_animation: { animation: 'maze_walk', frameCount: 2, frameDelay: 6, animateOnlyWhenMoving: true },
      msx2_health: { current: 3, max: 3, invincibleFrames: 45, deathAction: 'respawn' },
      msx2_spawn: { spawnOnScreenLoad: true, respawn: true, respawnDelayFrames: 45 },
      msx2_collision: { solid: false, hitboxW: 14, hitboxH: 14, offsetX: 1, offsetY: 1 },
    },
    params: { runtime: 'MSX2', engine: 'maze', controlMode: 'maze', movement: 'maze', movementMode: 'maze', initialAir: 0, disableAirTimer: true },
  },
  {
    id: 'enemy_static',
    label: 'MSX2 Enemy',
    kind: 'enemy',
    runtime: 'MSX2',
    engine: 'staticEnemy',
    description: 'Static enemy or blocker handled by the MSX2 entity table.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_health: {},
      msx2_damage: {},
      msx2_collision: { damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'staticEnemy', movement: 'static' },
  },
  {
    id: 'ghost_maze',
    label: 'MSX2 Ghost Maze',
    kind: 'enemy',
    runtime: 'MSX2',
    engine: 'ghostMaze',
    description: 'Maze ghost movement component for Pac-Man style screens.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_animation: { animation: 'ghost_walk', frameCount: 2, frameDelay: 8, animateOnlyWhenMoving: true },
      msx2_movement: { mode: 'ghostMaze', speed: 4 },
      msx2_ai: { engine: 'ghostMaze', initialDirection: 'right' },
      msx2_damage: { amount: 1, mode: 'contact', cooldownFrames: 45 },
      msx2_collision: { damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'ghostMaze', movement: 'ghostMaze', initialDirection: 'right', speed: 4 },
  },
  {
    id: 'patrol_x',
    label: 'MSX2 Patrol X',
    kind: 'enemy',
    runtime: 'MSX2',
    engine: 'patrolX',
    description: 'Horizontal patrol movement component owned by the MSX2 runtime.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_animation: { animation: 'patrol_walk', frameCount: 2, frameDelay: 10, animateOnlyWhenMoving: true },
      msx2_movement: { mode: 'patrolX', direction: 1 },
      msx2_health: {},
      msx2_damage: {},
      msx2_collision: { damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'patrolX', movement: 'patrolX', direction: 1 },
  },
  {
    id: 'patrol_y',
    label: 'MSX2 Patrol Y',
    kind: 'enemy',
    runtime: 'MSX2',
    engine: 'patrolY',
    description: 'Vertical patrol movement component owned by the MSX2 runtime.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_animation: { animation: 'patrol_walk', frameCount: 2, frameDelay: 10, animateOnlyWhenMoving: true },
      msx2_movement: { mode: 'patrolY', direction: 1 },
      msx2_health: {},
      msx2_damage: {},
      msx2_collision: { damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'patrolY', movement: 'patrolY', direction: 1 },
  },
  {
    id: 'hazard',
    label: 'MSX2 Hazard',
    kind: 'hazard',
    runtime: 'MSX2',
    engine: 'hazard',
    description: 'MSX2 hazard entity used by the SCREEN 4 collision/effects runtime.',
    components: {
      msx2_transform: {},
      msx2_hazard: {},
      msx2_damage: { amount: 1, mode: 'trigger', cooldownFrames: 30 },
      msx2_spawn: { spawnOnScreenLoad: true, respawn: true, respawnDelayFrames: 60 },
      msx2_collision: { damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'hazard' },
  },
  {
    id: 'collectible',
    label: 'MSX2 Collectible',
    kind: 'collectible',
    runtime: 'MSX2',
    engine: 'collectible',
    description: 'Collectible entity counted by the MSX2 SCREEN 4 runtime.',
    components: {
      msx2_transform: {},
      msx2_collectible: {},
      msx2_inventory: { itemId: 'collectible', amount: 1 },
      msx2_score: { points: 10, variableId: 'score', addOnCollect: true },
      msx2_spawn: { spawnOnScreenLoad: true, preserveAfterCollect: true },
    },
    params: { runtime: 'MSX2', engine: 'collectible' },
  },
  {
    id: 'door',
    label: 'MSX2 Door',
    kind: 'door',
    runtime: 'MSX2',
    engine: 'door',
    description: 'Door or exit entity for MSX2 screen progression.',
    components: {
      msx2_transform: {},
      msx2_door_exit: {},
      msx2_screen_transition: { requiresCollectibles: true, lockIfMissingTarget: true },
      msx2_inventory: { requiredItemId: '', consumeOnUse: false },
      msx2_collision: { solid: false },
    },
    params: { runtime: 'MSX2', engine: 'door' },
  },
  {
    id: 'checkpoint',
    label: 'MSX2 Checkpoint',
    kind: 'door',
    runtime: 'MSX2',
    engine: 'checkpoint',
    description: 'Checkpoint marker that can update the MSX2 respawn point.',
    components: {
      msx2_transform: {},
      msx2_door_exit: { requiresCollectibles: false, locked: false },
      msx2_checkpoint: {},
      msx2_screen_transition: { requiresCollectibles: false, lockIfMissingTarget: false },
    },
    params: { runtime: 'MSX2', engine: 'checkpoint', checkpoint: true },
  },
  {
    id: 'galaxian_player',
    label: 'Galaxian Player',
    kind: 'player',
    runtime: 'MSX2',
    engine: 'shooterHorizontal',
    description: 'Horizontal shooter player for Galaxian-style MSX2 games.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: { paletteSlot: 15 },
      msx2_player_control: { controlMode: 'shooterHorizontal', movementMode: 'shooterHorizontal', jump: false, gravity: false, air: 0, disableAirTimer: true },
      msx2_movement: { mode: 'horizontal', speed: 3 },
      msx2_collision: { hitboxW: 14, hitboxH: 12, offsetX: 1, offsetY: 2 },
      msx2_shooter: {},
      msx2_lives: {},
      msx2_score: { points: 0, variableId: 'score', addOnCollect: false },
    },
    params: { runtime: 'MSX2', engine: 'shooterHorizontal', controlMode: 'shooterHorizontal', movement: 'horizontal', movementMode: 'shooterHorizontal', speed: 3, initialAir: 0, disableAirTimer: true },
  },
  {
    id: 'galaxian_alien_formation',
    label: 'Galaxian Alien',
    kind: 'enemy',
    runtime: 'MSX2',
    engine: 'patrolX',
    description: 'Formation alien with side-to-side motion and dive attack metadata.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: { paletteSlot: 10 },
      msx2_animation: { animation: 'alien_flap', frameCount: 2, frameDelay: 12, loop: true },
      msx2_movement: { mode: 'patrolX', speed: 2, direction: 1 },
      msx2_collision: { hitboxW: 14, hitboxH: 12, offsetX: 1, offsetY: 2, damage: 1 },
      msx2_health: {},
      msx2_damage: {},
      msx2_formation: {},
      msx2_attack_pattern: { pattern: 'circle', trigger: 'wave', triggerFrames: 120, returnToFormation: true, fireDuringDive: false },
      msx2_score: { points: 100, variableId: 'score', addOnCollect: false },
    },
    params: { runtime: 'MSX2', engine: 'patrolX', movement: 'patrolX', direction: 1, speed: 2 },
  },
  {
    id: 'galaxian_laser',
    label: 'Galaxian Laser',
    kind: 'hazard',
    runtime: 'MSX2',
    engine: 'hazard',
    description: 'Player or enemy projectile payload for Galaxian-style shooters.',
    components: {
      msx2_transform: {},
      msx2_projectile: {},
      msx2_collision: { hitboxW: 4, hitboxH: 8, offsetX: 6, offsetY: 4, damage: 1 },
      msx2_damage: { amount: 1, mode: 'projectile', cooldownFrames: 0 },
    },
    params: { runtime: 'MSX2', engine: 'hazard', projectile: true },
  },
  {
    id: 'galaxian_wave_controller',
    label: 'Galaxian Wave',
    kind: 'door',
    runtime: 'MSX2',
    engine: 'checkpoint',
    description: 'Invisible wave controller carrying formation and clear-condition metadata.',
    components: {
      msx2_transform: {},
      msx2_wave: { waveId: 1, enemyCount: 12 },
      msx2_attack_wave: { enabled: true, intervalFrames: 180, minAttackers: 1, maxAttackers: 3, randomSeed: 73 },
      msx2_timer: { initialValue: 255, tickRateFrames: 1, onZero: 'nextAttack', hud: false },
      msx2_score: { points: 0, variableId: 'score', addOnCollect: false },
    },
    params: { runtime: 'MSX2', engine: 'checkpoint', waveController: true },
  },
  {
    id: 'pong_paddle',
    label: 'MSX2 Pong Paddle',
    kind: 'player',
    runtime: 'MSX2',
    engine: 'paddleHorizontal',
    description: 'Horizontal player paddle for Pong and brick-breaker MSX2 screens.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: { paletteSlot: 15 },
      msx2_player_control: { controlMode: 'paddleHorizontal', movementMode: 'paddleHorizontal', jump: false, gravity: false, air: 0, disableAirTimer: true },
      msx2_movement: { mode: 'paddleHorizontal', speed: 4, minX: 0, maxX: 224 },
      msx2_paddle: {},
      msx2_collision: { hitboxW: 32, hitboxH: 8, offsetX: 0, offsetY: 4, solid: true },
      msx2_lives: { lives: 3, maxLives: 3, gameOverAction: 'restart' },
    },
    params: { runtime: 'MSX2', engine: 'paddleHorizontal', controlMode: 'paddleHorizontal', movement: 'paddleHorizontal', movementMode: 'paddleHorizontal', speed: 4, initialAir: 0, disableAirTimer: true },
  },
  {
    id: 'pong_2p_left_paddle',
    label: 'MSX2 Pong 2P Left Paddle',
    kind: 'player',
    runtime: 'MSX2',
    engine: 'control_2_players',
    description: 'Left Pong paddle controlled by MSX cursor keys for the SCREEN 4 two-player runtime.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: { paletteSlot: 15 },
      msx2_player_control: { controlMode: 'control_2_players', movementMode: 'control_2_players', jump: false, gravity: false, air: 0, disableAirTimer: true },
      control_2_players: {},
      msx2_movement: { mode: 'control_2_players', speed: 3, minY: 1, maxY: 10 },
      msx2_paddle: { width: 8, height: 24, speed: 3, minX: 16, maxX: 16, sticky: false, serveBall: false },
      msx2_collision: { hitboxW: 8, hitboxH: 24, offsetX: 4, offsetY: 0, solid: true },
      msx2_lives: { lives: 9, maxLives: 9, gameOverAction: 'restart' },
    },
    params: { runtime: 'MSX2', engine: 'control_2_players', controlMode: 'control_2_players', movement: 'control_2_players', movementMode: 'control_2_players', speed: 3, initialAir: 0, disableAirTimer: true },
  },
  {
    id: 'pong_ball',
    label: 'MSX2 Pong Ball',
    kind: 'hazard',
    runtime: 'MSX2',
    engine: 'ballBounce',
    description: 'Bouncing ball payload for Pong and Arkanoid-style MSX2 screens.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: { paletteSlot: 15 },
      msx2_ball: {},
      msx2_movement: { mode: 'ballBounce', speed: 2, direction: 1, minX: 8, maxX: 232, minY: 16, maxY: 176, boundsUnit: 'px' },
      msx2_collision: { hitboxW: 8, hitboxH: 8, offsetX: 4, offsetY: 4, damage: 1 },
      msx2_damage: { amount: 1, mode: 'contact', cooldownFrames: 0 },
    },
    params: { runtime: 'MSX2', engine: 'ballBounce', movement: 'ballBounce', speed: 2, speedX: 2, speedY: -2, minX: 8, maxX: 232, minY: 16, maxY: 176, boundsUnit: 'px' },
  },
  {
    id: 'arkanoid_brick',
    label: 'MSX2 Arkanoid Brick',
    kind: 'collectible',
    runtime: 'MSX2',
    engine: 'brick',
    description: 'Breakable brick/block entity for Arkanoid-style MSX2 screens.',
    components: {
      msx2_transform: {},
      msx2_brick: {},
      msx2_score: { points: 10, variableId: 'score', addOnCollect: false },
      msx2_collision: { hitboxW: 16, hitboxH: 8, offsetX: 0, offsetY: 4, solid: true },
    },
    params: { runtime: 'MSX2', engine: 'brick', brick: true, points: 10 },
  },
  {
    id: 'snake_head',
    label: 'MSX2 Snake Head',
    kind: 'player',
    runtime: 'MSX2',
    engine: 'snakeChar',
    description: 'Grid-based Snake player head rendered through SCREEN 4 chars/tiles.',
    components: {
      msx2_transform: {},
      msx2_char_render: { paletteSlot: 10, useHardwareSprite: false },
      msx2_player_control: { controlMode: 'snakeChar', movementMode: 'snakeChar', jump: false, gravity: false, air: 0, disableAirTimer: true },
      msx2_movement: { mode: 'snakeChar', speed: 8, direction: 1, minX: 0, maxX: 15, minY: 0, maxY: 11 },
      msx2_snake: {},
      msx2_collision: { hitboxW: 16, hitboxH: 16, solid: false },
      msx2_score: { points: 0, variableId: 'score', addOnCollect: false },
      msx2_lives: { lives: 1, maxLives: 1, gameOverAction: 'restart' },
    },
    params: { runtime: 'MSX2', engine: 'snakeChar', controlMode: 'snakeChar', movement: 'snakeChar', movementMode: 'snakeChar', speedFrames: 8, initialAir: 0, disableAirTimer: true },
  },
  {
    id: 'snake_segment',
    label: 'MSX2 Snake Segment',
    kind: 'enemy',
    runtime: 'MSX2',
    engine: 'snakeChar',
    description: 'Snake body segment rendered as a SCREEN 4 char/tile and ordered by segment index.',
    components: {
      msx2_transform: {},
      msx2_char_render: { paletteSlot: 7, useHardwareSprite: false },
      msx2_snake_segment: {},
      msx2_collision: { hitboxW: 16, hitboxH: 16, solid: true, damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'snakeChar', snakeSegment: true, segmentIndex: 0 },
  },
  {
    id: 'snake_food',
    label: 'MSX2 Snake Food',
    kind: 'collectible',
    runtime: 'MSX2',
    engine: 'snakeFood',
    description: 'Snake food rendered as a SCREEN 4 char/tile collectible.',
    components: {
      msx2_transform: {},
      msx2_char_render: { paletteSlot: 8, useHardwareSprite: false },
      msx2_collectible: { value: 1, requiredForExit: false, eraseTile: true, persistent: false },
      msx2_score: { points: 10, variableId: 'score', addOnCollect: true },
      msx2_spawn: { spawnOnScreenLoad: true, respawn: true, respawnDelayFrames: 1, preserveAfterCollect: false },
    },
    params: { runtime: 'MSX2', engine: 'snakeFood', food: true, points: 10 },
  },
];

export const DEFAULT_MSX2_ENTITY_CREATE_PRESETS = MSX2_ENTITY_REPERTOIRE;

const defaultsByComponent = new Map(MSX2_COMPONENT_REPERTOIRE.map(component => [component.id, component.defaults]));

export function buildMsx2EntityComponents(
  preset: Msx2EntityCreatePreset,
  tileX: number,
  tileY: number
): Record<string, Record<string, any>> {
  const components: Record<string, Record<string, any>> = {};
  Object.entries(preset.components).forEach(([componentId, values]) => {
    const defaults = defaultsByComponent.get(componentId as Msx2ComponentId) || {};
    components[componentId] = {
      ...defaults,
      ...(values || {}),
    };
  });
  if (components.msx2_transform) {
    components.msx2_transform = {
      ...components.msx2_transform,
      tileX,
      tileY,
      pixelX: tileX * 16,
      pixelY: tileY * 16,
      spawnX: tileX * 16,
      spawnY: tileY * 16,
    };
  }
  return components;
}

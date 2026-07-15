import { EnemyBehaviorType, EnemyDefinition, EnemyRenderRoleBinding, EntityTemplate, Msx2EntityKind, Msx2Screen4EntityInstance, ProjectAsset } from '../../types';

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
  | 'msx2_jump'
  | 'msx2_gravity'
  | 'msx2_push_box'
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
  | 'msx2_grid_snap'
  | 'msx2_box2'
  | 'msx2_carryable'
  | 'msx2_pressure_button'
  | 'msx2_jumper'
  | 'msx2_wall_jumper'
  | 'msx2_scroll';

export interface Msx2ComponentDefinition {
  id: Msx2ComponentId;
  label: string;
  description: string;
  defaults: Record<string, any>;
}

export type Msx2ComponentFieldEditorKind = 'boolean' | 'number' | 'string' | 'select' | 'tileIndex' | 'msx2SpriteAsset';

export interface Msx2ComponentFieldEditorConfig {
  kind?: Msx2ComponentFieldEditorKind;
  label?: string;
  min?: number;
  max?: number;
  options?: readonly string[];
  ariaLabel?: string;
  hidden?: boolean;
  paramKey?: string;
}

export const MSX2_COMPONENT_FIELD_EDITORS: Partial<Record<Msx2ComponentId, Record<string, Msx2ComponentFieldEditorConfig>>> = {
  msx2_transform: {
    tileX: { label: 'Tile X', min: 0, max: 15, paramKey: 'tileX' },
    tileY: { label: 'Tile Y', min: 0, max: 11, paramKey: 'tileY' },
    pixelX: { label: 'Pixel X', min: 0, max: 255 },
    pixelY: { label: 'Pixel Y', min: 0, max: 191 },
    spawnX: { label: 'Spawn X', min: 0, max: 15 },
    spawnY: { label: 'Spawn Y', min: 0, max: 11 },
  },
  msx2_hardware_sprite: {
    msx2SpriteAssetId: { hidden: true },
    frame: { label: 'Frame', min: 0, max: 7 },
    paletteSlot: { label: 'Palette slot', min: 0, max: 15 },
    visible: { kind: 'boolean', label: 'Visible' },
  },
  msx2_player_control: {
    controlMode: { kind: 'select', options: ['platform', 'maze', 'shooterVertical', 'shooterHorizontal', 'paddleHorizontal', 'control_2_players', 'snakeChar'] },
    movementMode: { kind: 'select', options: ['platform', 'maze', 'shooterVertical', 'shooterHorizontal', 'paddleHorizontal', 'control_2_players', 'snakeChar', 'static'] },
    jump: { kind: 'boolean', label: 'Jump enabled' },
    gravity: { kind: 'boolean', label: 'Gravity enabled' },
    air: { label: 'Air timer', min: 0, max: 255 },
    disableAirTimer: { kind: 'boolean', label: 'Disable air timer' },
  },
  msx2_jump: {
    enabled: { kind: 'boolean', label: 'Enabled' },
    jumpPower: { label: 'Jump power', min: 256, max: 2048, ariaLabel: 'MSX2 jump power' },
    maxJumps: { label: 'Max jumps', min: 1, max: 4, ariaLabel: 'MSX2 max jumps' },
    requireKeyRelease: { kind: 'boolean', label: 'Require key release between jumps' },
  },
  msx2_gravity: {
    enabled: { kind: 'boolean', label: 'Enabled' },
    strength: { label: 'Strength', min: 16, max: 128, ariaLabel: 'MSX2 gravity strength' },
    terminalVelocity: { label: 'Terminal velocity', min: 256, max: 2048, ariaLabel: 'MSX2 terminal fall velocity' },
  },
  msx2_push_box: {
    enabled: { kind: 'boolean', label: 'Enabled', ariaLabel: 'MSX2 PushBox enabled' },
    pushAxis: { kind: 'select', options: ['horizontal', 'vertical', 'both'], label: 'Axis', ariaLabel: 'MSX2 PushBox axis' },
    slideSpeed: { label: 'Slide speed', min: 1, max: 4, ariaLabel: 'MSX2 PushBox slide speed' },
    gravity: { kind: 'boolean', label: 'Box gravity', ariaLabel: 'MSX2 PushBox box gravity' },
    msx2SpriteAssetId: { kind: 'msx2SpriteAsset', label: 'Moving box sprite', ariaLabel: 'MSX2 PushBox moving hardware sprite' },
    tileIndex: { kind: 'tileIndex', label: 'Box tile (idle / fallback)', ariaLabel: 'MSX2 PushBox idle tile', paramKey: 'boxTileIndex' },
    paletteSlot: { label: 'Box palette', min: 1, max: 15, ariaLabel: 'MSX2 PushBox palette slot' },
  },
  msx2_movement: {
    mode: { kind: 'select', options: ['static', 'patrolX', 'patrolChaseX', 'walkerGravity', 'patrolY', 'ghostMaze', 'ballBounce', 'maze'] },
    speed: { label: 'Speed', min: 0, max: 15 },
    direction: { label: 'Direction', min: -1, max: 1 },
    minX: { label: 'Min X', min: 0, max: 255 },
    maxX: { label: 'Max X', min: 0, max: 255 },
    minY: { label: 'Min Y', min: 0, max: 191 },
    maxY: { label: 'Max Y', min: 0, max: 191 },
    boundsUnit: { kind: 'select', options: ['tile', 'px'] },
  },
  msx2_collision: {
    hitboxW: { label: 'Hitbox width', min: 1, max: 32 },
    hitboxH: { label: 'Hitbox height', min: 1, max: 32 },
    offsetX: { label: 'Offset X', min: 0, max: 16 },
    offsetY: { label: 'Offset Y', min: 0, max: 16 },
    solid: { kind: 'boolean', label: 'Solid' },
    damage: { label: 'Damage', min: 0, max: 255 },
  },
  msx2_collectible: {
    value: { label: 'Value', min: 0, max: 255 },
    requiredForExit: { kind: 'boolean', label: 'Required for exit' },
    eraseTile: { kind: 'boolean', label: 'Erase tile on collect' },
    persistent: { kind: 'boolean', label: 'Persistent' },
  },
  msx2_door_exit: {
    targetScreenId: { label: 'Target screen ID' },
    requiresCollectibles: { kind: 'boolean', label: 'Requires collectibles' },
    locked: { kind: 'boolean', label: 'Locked' },
  },
  msx2_pressure_button: {
    enabled: { kind: 'boolean', label: 'Enabled' },
    targetDoorId: { label: 'Target door ID' },
    actors: { kind: 'select', options: ['playerAndEnemies', 'player', 'enemies'], label: 'Actors' },
    latch: { kind: 'boolean', label: 'Latch' },
    atlasEntryId: { label: 'Released atlas tile ID' },
    pressedAtlasEntryId: { label: 'Pressed atlas tile ID' },
  },
  msx2_jumper: {
    enabled: { kind: 'boolean', label: 'Enabled' },
    atlasEntryId: { label: 'Idle atlas tile ID' },
    triggeredAtlasEntryId: { label: 'Triggered atlas tile ID' },
    impulsePx: { label: 'Impulse (px/frame)', min: 2, max: 15 },
  },
  msx2_wall_jumper: {
    enabled: { kind: 'boolean', label: 'Enabled' },
    atlasEntryId: { label: 'Idle atlas tile ID' },
    triggeredAtlasEntryId: { label: 'Triggered atlas tile ID' },
    impulsePx: { label: 'Impulse (px/frame)', min: 2, max: 15 },
    direction: { kind: 'select', options: ['left', 'right'], label: 'Launch direction' },
  },
  msx2_hazard: {
    damage: { label: 'Damage', min: 0, max: 255 },
    respawn: { kind: 'boolean', label: 'Respawn player' },
    instantDeath: { kind: 'boolean', label: 'Instant death' },
  },
  msx2_ai: {
    engine: { kind: 'select', options: ['patrol', 'ghostMaze'] },
    initialDirection: { kind: 'select', options: ['right', 'left', 'up', 'down'] },
    turnPolicy: { kind: 'select', options: ['reverse', 'random', 'towardPlayer'] },
  },
  msx2_animation: {
    animation: { label: 'Animation name' },
    frameStart: { label: 'Frame start', min: 0, max: 7 },
    frameCount: { label: 'Frame count', min: 1, max: 8 },
    frameDelay: { label: 'Frame delay', min: 1, max: 255 },
    loop: { kind: 'boolean', label: 'Loop' },
    animateOnlyWhenMoving: { kind: 'boolean', label: 'Animate only when moving' },
  },
  msx2_health: {
    current: { label: 'Current HP', min: 0, max: 255 },
    max: { label: 'Max HP', min: 1, max: 255 },
    invincibleFrames: { label: 'Invincible frames', min: 0, max: 255 },
    deathAction: { kind: 'select', options: ['none', 'respawn', 'gameOver', 'remove'] },
  },
  msx2_damage: {
    amount: { label: 'Amount', min: 0, max: 255 },
    mode: { kind: 'select', options: ['contact', 'trigger', 'projectile'] },
    cooldownFrames: { label: 'Cooldown frames', min: 0, max: 255 },
    knockback: { label: 'Knockback', min: 0, max: 255 },
  },
  msx2_spawn: {
    spawnOnScreenLoad: { kind: 'boolean', label: 'Spawn on screen load' },
    respawn: { kind: 'boolean', label: 'Respawn' },
    respawnDelayFrames: { label: 'Respawn delay frames', min: 0, max: 255 },
    preserveAfterCollect: { kind: 'boolean', label: 'Preserve after collect' },
  },
  msx2_checkpoint: {
    enabled: { kind: 'boolean', label: 'Enabled' },
    setPlayerSpawn: { kind: 'boolean', label: 'Set player spawn' },
    oneShot: { kind: 'boolean', label: 'One shot' },
  },
  msx2_screen_transition: {
    targetScreenId: { label: 'Target screen ID' },
    direction: { kind: 'select', options: ['auto', 'left', 'right', 'up', 'down'] },
    requiresCollectibles: { kind: 'boolean', label: 'Requires collectibles' },
    lockIfMissingTarget: { kind: 'boolean', label: 'Lock if missing target' },
  },
  msx2_inventory: {
    itemId: { label: 'Item ID' },
    amount: { label: 'Amount', min: 0, max: 255 },
    consumeOnUse: { kind: 'boolean', label: 'Consume on use' },
    requiredItemId: { label: 'Required item ID' },
  },
  msx2_score: {
    points: { label: 'Points', min: 0, max: 65535 },
    variableId: { label: 'Variable ID' },
    addOnCollect: { kind: 'boolean', label: 'Add on collect' },
  },
  msx2_timer: {
    initialValue: { label: 'Initial value', min: 0, max: 255 },
    tickRateFrames: { label: 'Tick rate frames', min: 1, max: 255 },
    onZero: { kind: 'select', options: ['none', 'damage', 'gameOver', 'respawn'] },
    hud: { kind: 'boolean', label: 'Show on HUD' },
  },
  msx2_platform: {
    carriesPlayer: { kind: 'boolean', label: 'Carries player' },
    oneWay: { kind: 'boolean', label: 'One way' },
    speed: { label: 'Speed', min: 0, max: 15 },
    minX: { label: 'Min X', min: 0, max: 255 },
    maxX: { label: 'Max X', min: 0, max: 255 },
    minY: { label: 'Min Y', min: 0, max: 191 },
    maxY: { label: 'Max Y', min: 0, max: 191 },
  },
  msx2_shooter: {
    enabled: { kind: 'boolean', label: 'Enabled' },
    fireKey: { kind: 'select', options: ['space', 'button1', 'button2'] },
    direction: { kind: 'select', options: ['horizontalFacing', 'up'], ariaLabel: 'MSX2 shooter projectile direction' },
    cooldownFrames: { label: 'Cooldown frames', min: 0, max: 255 },
    projectilePresetId: { label: 'Projectile preset ID' },
    maxProjectiles: { label: 'Max projectiles', min: 1, max: 4 },
  },
  msx2_projectile: {
    owner: { kind: 'select', options: ['player', 'enemy'] },
    velocityX: { label: 'Velocity X', min: -16, max: 16 },
    velocityY: { label: 'Velocity Y', min: -16, max: 16 },
    damage: { label: 'Damage', min: 0, max: 255 },
    expireOnHit: { kind: 'boolean', label: 'Expire on hit' },
    maxDistance: { label: 'Max distance', min: 0, max: 255 },
  },
  msx2_attack_pattern: {
    pattern: { kind: 'select', options: ['circle', 'zigzag', 'diagonal'], ariaLabel: 'Galaxian attack pattern', paramKey: 'attackPattern' },
    trigger: { kind: 'select', options: ['wave', 'timer', 'manual'] },
    triggerFrames: { label: 'Trigger frames', min: 1, max: 240, ariaLabel: 'Galaxian attack trigger frames', paramKey: 'triggerFrames' },
    returnToFormation: { kind: 'boolean', label: 'Return to formation' },
    fireDuringDive: { kind: 'boolean', label: 'Fire dive' },
  },
  msx2_attack_wave: {
    enabled: { kind: 'boolean', label: 'Enabled' },
    intervalFrames: { label: 'Interval frames', min: 1, max: 255, ariaLabel: 'Galaxian attack wave interval frames', paramKey: 'attackIntervalFrames' },
    minAttackers: { label: 'Min attackers', min: 1, max: 3, ariaLabel: 'Galaxian attack wave minimum attackers', paramKey: 'minAttackers' },
    maxAttackers: { label: 'Max attackers', min: 1, max: 3, ariaLabel: 'Galaxian attack wave maximum attackers', paramKey: 'maxAttackers' },
    randomSeed: { label: 'Random seed', min: 1, max: 255, ariaLabel: 'Galaxian attack wave random seed', paramKey: 'randomSeed' },
  },
  msx2_char_render: {
    tileIndex: { kind: 'tileIndex', ariaLabel: 'Idle tile for char render', paramKey: 'tileIndex' },
    tileId: { label: 'Tile ID' },
    charCode: { label: 'Char code', min: 0, max: 255 },
    paletteSlot: { label: 'Palette slot', min: 0, max: 15 },
    clearTileId: { label: 'Clear tile ID' },
    useHardwareSprite: { kind: 'boolean', label: 'Use hardware sprite' },
  },
  msx2_grid_snap: {
    gridUnit: { label: 'Grid unit (px)', min: 8, max: 16 },
    charWidth: { label: 'Char width (cells)', min: 1, max: 4 },
    charHeight: { label: 'Char height (cells)', min: 1, max: 4 },
    snapOnStop: { kind: 'boolean', label: 'Snap on stop' },
  },
  msx2_box2: {
    pushAxis: { kind: 'select', options: ['horizontal', 'vertical', 'both'], ariaLabel: 'Box2 push axis', paramKey: 'pushAxis' },
    slideSpeed: { label: 'Slide speed (px/frame)', min: 1, max: 4, ariaLabel: 'Box2 slide speed', paramKey: 'slideSpeed' },
    gravity: { kind: 'boolean', label: 'Gravity (falls in gaps)', ariaLabel: 'Box2 gravity', paramKey: 'gravity' },
    requiresAlignment: { kind: 'boolean', label: 'Requires player alignment' },
    tileIndex: { kind: 'tileIndex', ariaLabel: 'Idle tile for box2 char render', paramKey: 'tileIndex' },
    charCode: { label: 'Char code', min: 0, max: 255 },
    paletteSlot: { label: 'Palette slot', min: 0, max: 15 },
  },
  msx2_carryable: {
    enabled: { kind: 'boolean', label: 'Enabled', ariaLabel: 'MSX2 Carryable enabled' },
  },
};

export type Msx2RuntimeEngine =
  | 'platform'
  | 'maze'
  | 'shooterHorizontal'
  | 'shooterVertical'
  | 'staticEnemy'
  | 'ghostMaze'
  | 'patrolX'
  | 'patrolChaseX'
  | 'walkerGravity'
  | 'patrolY'
  | 'movingPlatform'
  | 'hazard'
  | 'collectible'
  | 'pickupItem'
  | 'spike'
  | 'door'
  | 'pressureButton'
  | 'jumper'
  | 'wallJumper'
  | 'checkpoint'
  | 'npc'
  | 'hiddenObj'
  | 'control_2_players'
  | 'paddleHorizontal'
  | 'ballBounce'
  | 'brick'
  | 'snakeChar'
  | 'snakeFood'
  | 'box2';

export interface Msx2EntityCreatePreset {
  id: string;
  label: string;
  kind: Msx2EntityKind;
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
    id: 'msx2_jump',
    label: 'Jump',
    description: 'Platform jump impulse and air-jump rules for the MSX2 SCREEN 4 runtime.',
    defaults: { enabled: true, jumpPower: 1024, maxJumps: 2, requireKeyRelease: true },
  },
  {
    id: 'msx2_gravity',
    label: 'Gravity',
    description: '8.8 gravity acceleration and terminal fall speed for MSX2 platform physics.',
    defaults: { enabled: true, strength: 64, terminalVelocity: 1024 },
  },
  {
    id: 'msx2_push_box',
    label: 'PushBox',
    description: 'Player capability for pushing map tiles marked as Caja / BOX in SCREEN 4 cell flags. Configure the hardware sprite used while the box slides; the idle pose uses the box tile on the map or the tile index below.',
    defaults: {
      enabled: true,
      pushAxis: 'horizontal',
      slideSpeed: 1,
      gravity: true,
      msx2SpriteAssetId: '',
      tileIndex: 0,
      tileId: '',
      paletteSlot: 6,
    },
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
    description: 'Enables player firing (SPACE / Button 1). Works on platform and arcade MSX2 screens.',
    defaults: { enabled: true, fireKey: 'space', direction: 'horizontalFacing', cooldownFrames: 12, projectilePresetId: 'player_bullet', maxProjectiles: 1 },
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
    defaults: { tileId: '', tileIndex: 0, charCode: 0, paletteSlot: 7, clearTileId: '', useHardwareSprite: false },
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
    id: 'msx2_grid_snap',
    label: 'Grid Snap',
    description: 'Grid-aligned char block metadata for MSX2 actors that snap to 16px SCREEN 4 cells and render as char blocks when idle.',
    defaults: { gridUnit: 16, charWidth: 2, charHeight: 2, snapOnStop: true },
  },
  {
    id: 'msx2_carryable',
    label: 'Carryable',
    description: 'Marks this entity (rock, key, ball...) as a carryable object for the player carry_object skill: pick it up with the attack key, carry it above the head and throw it. The SCREEN 5 editor can render it as a hardware sprite or a 16-colour bitmap atlas patch; max 2 carryables per screen.',
    defaults: { enabled: true },
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

export const MSX2_ENTITY_KIND_OPTIONS: Array<{ value: Msx2EntityKind; label: string }> = [
  { value: 'player', label: 'Player' },
  { value: 'enemy', label: 'Enemy' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'collectible', label: 'Collectible' },
  { value: 'door', label: 'Door' },
  // Component-driven entities: the runtime derives behavior from the
  // attached components (Carryable, Collectible...), not from the kind.
  { value: 'custom', label: 'Custom' },
];

export const MSX2_ENTITY_MOVEMENT_OPTIONS = [
  { value: 'static', label: 'Static' },
  { value: 'maze', label: 'Maze Player' },
  { value: 'shooterVertical', label: 'Shooter Vertical 60Hz' },
  { value: 'shooterHorizontal', label: 'Shooter Horizontal' },
  { value: 'paddleHorizontal', label: 'Paddle Horizontal' },
  { value: 'ballBounce', label: 'Ball Bounce' },
  { value: 'snakeChar', label: 'Snake Char Grid' },
  { value: 'control_2_players', label: '2P Pong Controls' },
  { value: 'patrolX', label: 'Patrol X' },
  { value: 'patrolChaseX', label: 'Patrol Chase X' },
  { value: 'walkerGravity', label: 'Walker Gravity' },
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
      msx2_jump: { enabled: true, jumpPower: 1024, maxJumps: 2, requireKeyRelease: true },
      msx2_gravity: { enabled: true, strength: 64, terminalVelocity: 1024 },
      msx2_push_box: { enabled: true, pushAxis: 'horizontal', slideSpeed: 1, gravity: true },
      msx2_animation: { animation: 'player_idle', frameCount: 2, frameDelay: 8, animateOnlyWhenMoving: true },
      msx2_health: { current: 3, max: 3, invincibleFrames: 60, deathAction: 'respawn' },
      msx2_spawn: { spawnOnScreenLoad: true, respawn: true, respawnDelayFrames: 45 },
      msx2_timer: { initialValue: 255, tickRateFrames: 60, onZero: 'damage', hud: true },
      msx2_collision: { solid: false, hitboxW: 14, hitboxH: 15, offsetX: 1, offsetY: 1 },
    },
    params: { runtime: 'MSX2', engine: 'platform', controlMode: 'platform', movementMode: 'platform' },
  },
  {
    id: 'player_shooter',
    label: 'MSX2 Player (Shooter)',
    kind: 'player',
    runtime: 'MSX2',
    engine: 'platform',
    description: 'Platform player with msx2_shooter component: fire with SPACE in the facing direction.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_player_control: { controlMode: 'platform', movementMode: 'platform', jump: true, gravity: true, air: 255, disableAirTimer: false },
      msx2_jump: { enabled: true, jumpPower: 1024, maxJumps: 2, requireKeyRelease: true },
      msx2_gravity: { enabled: true, strength: 64, terminalVelocity: 1024 },
      msx2_push_box: { enabled: true, pushAxis: 'horizontal', slideSpeed: 1, gravity: true },
      msx2_shooter: { enabled: true, fireKey: 'space', direction: 'horizontalFacing', cooldownFrames: 12, projectilePresetId: 'player_bullet', maxProjectiles: 1 },
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
      msx2_push_box: { enabled: true, pushAxis: 'horizontal', slideSpeed: 1, gravity: false },
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
    id: 'patrol_chase_x',
    label: 'MSX2 Patrol Chase X',
    kind: 'enemy',
    runtime: 'MSX2',
    engine: 'patrolChaseX',
    description: 'Horizontal patrol that detects the player inside its patrol span and runs toward them without leaving the bounds.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_animation: { animation: 'patrol_walk', frameCount: 2, frameDelay: 8, animateOnlyWhenMoving: true },
      msx2_movement: { mode: 'patrolChaseX', direction: 1 },
      msx2_health: {},
      msx2_damage: {},
      msx2_collision: { damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'patrolChaseX', movement: 'patrolChaseX', direction: 1 },
  },
  {
    id: 'walker_gravity',
    label: 'MSX2 Walker Gravity',
    kind: 'enemy',
    runtime: 'MSX2',
    engine: 'walkerGravity',
    description: 'Horizontal walker that falls when there is no floor and reverses on wall collision.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_animation: { animation: 'walk', frameCount: 2, frameDelay: 8, animateOnlyWhenMoving: true },
      msx2_movement: { mode: 'walkerGravity', direction: 1 },
      msx2_health: {},
      msx2_damage: {},
      msx2_collision: { damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'walkerGravity', movement: 'walkerGravity', direction: 1 },
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
    id: 'moving_platform',
    label: 'MSX2 Moving Platform',
    kind: 'platform',
    runtime: 'MSX2',
    engine: 'movingPlatform',
    description: 'Hardware-sprite moving platform (patrol X/Y, 16 or 32 px wide) the player can stand on and ride. One-way: solid only from above.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
      msx2_movement: { mode: 'patrolX', direction: 1, boundsUnit: 'px' },
      msx2_platform: { carriesPlayer: true, oneWay: true, speed: 1 },
    },
    params: { runtime: 'MSX2', engine: 'movingPlatform', movement: 'patrolX', direction: 1 },
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
      msx2_char_render: { paletteSlot: 14, useHardwareSprite: false, charCode: 7, tileIndex: 1 },
      msx2_hazard: { damage: 1, respawn: true, instantDeath: false },
      msx2_damage: { amount: 1, mode: 'contact', cooldownFrames: 30 },
      msx2_spawn: { spawnOnScreenLoad: true, respawn: true, respawnDelayFrames: 60 },
      msx2_collision: { hitboxW: 16, hitboxH: 16, solid: false, damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'hazard' },
  },
  {
    id: 'spike_trap',
    label: 'MSX2 Pinchos',
    kind: 'hazard',
    runtime: 'MSX2',
    engine: 'spike',
    description: 'Spike trap: touching it costs a life and respawns the player. Renders as a 16x16 char tile (non-solid).',
    components: {
      msx2_transform: {},
      msx2_char_render: { paletteSlot: 14, useHardwareSprite: false, charCode: 7, tileIndex: 1 },
      msx2_hazard: { damage: 1, respawn: true, instantDeath: false },
      msx2_damage: { amount: 1, mode: 'contact', cooldownFrames: 0 },
      msx2_spawn: { spawnOnScreenLoad: true, respawn: true, respawnDelayFrames: 0 },
      msx2_collision: { hitboxW: 16, hitboxH: 16, solid: false, damage: 1 },
    },
    params: { runtime: 'MSX2', engine: 'spike', hazard: true },
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
      msx2_char_render: { paletteSlot: 8, useHardwareSprite: false, charCode: 5, tileIndex: 0 },
      msx2_collectible: { value: 1, requiredForExit: false, eraseTile: true, persistent: true },
      msx2_inventory: { itemId: 'collectible', amount: 1 },
      msx2_score: { points: 10, variableId: 'score', addOnCollect: true },
      msx2_collision: { hitboxW: 16, hitboxH: 16, solid: false, damage: 0 },
      msx2_spawn: { spawnOnScreenLoad: true, preserveAfterCollect: true },
    },
    params: { runtime: 'MSX2', engine: 'collectible' },
  },
  {
    id: 'pickup_item',
    label: 'MSX2 Pickup Item',
    kind: 'collectible',
    runtime: 'MSX2',
    engine: 'pickupItem',
    description: 'Pickup coin/item: player walks over it to collect. Renders as a 16x16 char tile, increments score and clears on pickup.',
    components: {
      msx2_transform: {},
      msx2_char_render: { paletteSlot: 8, useHardwareSprite: false, charCode: 5, tileIndex: 0 },
      msx2_collectible: { value: 1, requiredForExit: false, eraseTile: true, persistent: true },
      msx2_score: { points: 100, variableId: 'score', addOnCollect: true },
      msx2_collision: { hitboxW: 16, hitboxH: 16, solid: false, damage: 0 },
      msx2_spawn: { spawnOnScreenLoad: true, preserveAfterCollect: true },
    },
    params: { runtime: 'MSX2', engine: 'pickupItem', collectible: true, points: 100 },
  },
  {
    id: 'pressure_button',
    label: 'MSX2 Pressure Button',
    kind: 'custom',
    runtime: 'MSX2',
    engine: 'pressureButton',
    description: 'Floor pressure button that can be stepped on by the player or bitmap enemies to open a linked gate.',
    components: {
      msx2_transform: {},
      msx2_pressure_button: { enabled: true, actors: 'playerAndEnemies', latch: false, targetDoorId: '', atlasEntryId: '', pressedAtlasEntryId: '' },
      msx2_collision: { solid: false },
    },
    params: {
      runtime: 'MSX2',
      engine: 'pressureButton',
      pressureButton: { enabled: true, actors: 'playerAndEnemies', latch: false, targetDoorId: '', atlasEntryId: '', pressedAtlasEntryId: '' },
    },
  },
  {
    id: 'jumper',
    label: 'MSX2 Jumper (Spring)',
    kind: 'custom',
    runtime: 'MSX2',
    engine: 'jumper',
    description: 'Solid 16x16 spring tile (SCREEN 5 bitmap rooms): the player lands on top and is launched upward; the tile swaps to a triggered frame for a moment.',
    components: {
      msx2_transform: {},
      msx2_jumper: { enabled: true, atlasEntryId: '', triggeredAtlasEntryId: '', impulsePx: 8 },
      msx2_collision: { solid: true },
    },
    params: {
      runtime: 'MSX2',
      engine: 'jumper',
      jumper: { enabled: true, atlasEntryId: '', triggeredAtlasEntryId: '', impulsePx: 8 },
    },
  },
  {
    id: 'wallJumper',
    label: 'MSX2 Wall Jumper (Spring)',
    kind: 'custom',
    runtime: 'MSX2',
    engine: 'wallJumper',
    description: 'Solid 16x16 wall-spring tile (SCREEN 5 bitmap rooms): the player touches its side and is launched horizontally; gravity then bends the launch into an arc. Place it against a vertical wall (left or right).',
    components: {
      msx2_transform: {},
      msx2_wall_jumper: { enabled: true, atlasEntryId: '', triggeredAtlasEntryId: '', impulsePx: 8, direction: 'right' },
      msx2_collision: { solid: true },
    },
    params: {
      runtime: 'MSX2',
      engine: 'wallJumper',
      wallJumper: { enabled: true, atlasEntryId: '', triggeredAtlasEntryId: '', impulsePx: 8, direction: 'right' },
    },
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
    id: 'npc',
    label: 'MSX2 Talking NPC',
    kind: 'npc',
    runtime: 'MSX2',
    engine: 'npc',
    description: 'SCREEN 5 bitmap-room NPC: the player overlaps its 16x16 cell and presses the talk key (UP/SPACE) to play an MSX2 Dialogue (typewriter box + talking-head portrait). Its visual is an atlas tile baked into the room render.',
    components: {
      msx2_transform: {},
    },
    params: { runtime: 'MSX2', engine: 'npc', npcDialogue: { dialogueAssetId: '', atlasEntryId: '', talkKey: 'up' } },
  },
  {
    id: 'hidden_obj',
    label: 'MSX2 Hidden Object',
    kind: 'hidden_obj',
    runtime: 'MSX2',
    engine: 'hiddenObj',
    description: 'SCREEN 5 bitmap-room invisible marker for the Perception skill: when the player enters the skill radius, flag_near is raised and the perceiving animation state can trigger (e.g. glowing tail). Bakes no visual into the room.',
    components: {
      msx2_transform: {},
    },
    params: { runtime: 'MSX2', engine: 'hiddenObj', hiddenObj: true },
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
    id: 'shooter_vertical_player',
    label: 'MSX2 Shooter Player 60Hz',
    kind: 'player',
    runtime: 'MSX2',
    engine: 'shooterVertical',
    description: 'Vertical arcade shooter player tuned for the SCREEN 4 60Hz runtime budget.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: { paletteSlot: 15 },
      msx2_player_control: { controlMode: 'shooterVertical', movementMode: 'shooterVertical', jump: false, gravity: false, air: 0, disableAirTimer: true },
      msx2_movement: { mode: 'shooterVertical', speed: 3, minX: 0, maxX: 240, minY: 16, maxY: 176, boundsUnit: 'px' },
      msx2_collision: { hitboxW: 8, hitboxH: 8, offsetX: 4, offsetY: 4 },
      msx2_shooter: { enabled: true, fireKey: 'space', cooldownFrames: 10, projectilePresetId: 'player_laser', maxProjectiles: 6 },
      msx2_lives: { lives: 3, maxLives: 3, extraLifeAt: 10000, gameOverAction: 'gameflow_exit' },
      msx2_score: { points: 0, variableId: 'score', addOnCollect: false },
    },
    params: { runtime: 'MSX2', engine: 'shooterVertical', controlMode: 'shooterVertical', movement: 'shooterVertical', movementMode: 'shooterVertical', speed: 3, initialAir: 0, disableAirTimer: true },
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
    id: 'player_bullet',
    label: 'MSX2 Player Bullet',
    kind: 'hazard',
    runtime: 'MSX2',
    engine: 'hazard',
    description: 'Projectile payload for platform/shooter players. Place once on the screen (any tile). Referenced by msx2_shooter.projectilePresetId.',
    components: {
      msx2_transform: {},
      msx2_char_render: { paletteSlot: 15, useHardwareSprite: false, charCode: 13, tileIndex: 2 },
      msx2_projectile: { owner: 'player', velocityX: 4, velocityY: 0, damage: 1, expireOnHit: true, maxDistance: 192 },
      msx2_collision: { hitboxW: 4, hitboxH: 4, offsetX: 6, offsetY: 6, damage: 1 },
      msx2_damage: { amount: 1, mode: 'projectile', cooldownFrames: 0 },
    },
    params: { runtime: 'MSX2', engine: 'hazard', owner: 'player', projectile: true },
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
    id: 'custom_entity',
    label: 'MSX2 Custom',
    kind: 'custom',
    runtime: 'MSX2',
    engine: 'staticEnemy',
    description: 'Blank component-driven entity: starts with Position + Render only. Add the components you need (Carryable, Collectible...) from the entity inspector. NOTE: with no role component it does not render in the ROM; switch the kind to Enemy/Hazard if you need enemy-slot behavior.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: {},
    },
    params: { runtime: 'MSX2', custom: true },
  },
  {
    id: 'carryable_object',
    label: 'MSX2 Carryable Object',
    kind: 'enemy',
    runtime: 'MSX2',
    engine: 'staticEnemy',
    description: 'Harmless prop (rock, key, ball...) the player can pick up and throw with the carry_object skill. The SCREEN 5 editor can choose a hardware sprite or 16-colour bitmap atlas patch; never damages the player and never joins the enemy slots.',
    components: {
      msx2_transform: {},
      msx2_hardware_sprite: { paletteSlot: 9 },
      msx2_carryable: { enabled: true },
    },
    params: { runtime: 'MSX2', engine: 'staticEnemy', carryable: true },
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

/**
 * Enemy Library bridge (authoring side): maps a library EnemyDefinition behavior
 * to the screen-entity movement-mode name understood by the MSX2 SCREEN 4
 * generator (getMsx2EnemyHazardRuntimeSlots). The placement snapshot writes this
 * name into the entity's msx2_movement.mode, so the generator path is unchanged.
 * Behaviors without a runtime movement implementation map to 'static' (a
 * stationary enemy that still damages the player on contact); `implemented:false`
 * lets the UI warn the user.
 */
export function mapEnemyBehaviorToMovementMode(
  behavior: EnemyBehaviorType | undefined,
): { movementName: string; implemented: boolean } {
  switch (behavior) {
    case 'PatrolHorizontal': return { movementName: 'patrolX', implemented: true };
    case 'WalkerTurnOnEdge': return { movementName: 'walkerEdge', implemented: true };
    case 'FlyerSine': return { movementName: 'flyerSine', implemented: true };
    case 'Jumper': return { movementName: 'jumper', implemented: true };
    case 'BounceDiagonal': return { movementName: 'ballBounce', implemented: true };
    case 'ChaseHorizontal': return { movementName: 'chaseH', implemented: true };
    case 'None': return { movementName: 'static', implemented: true };
    // HopperTowardsPlayer / DropFromCeiling / EmergeFromGround / ShooterStatic /
    // CustomBehavior: no runtime movement yet -> stationary fallback.
    default: return { movementName: 'static', implemented: false };
  }
}

function selectEnemyRenderRole(def: EnemyDefinition): EnemyRenderRoleBinding | undefined {
  const roles = Array.isArray(def.render?.roles) ? def.render.roles : [];
  if (roles.length === 0) return undefined;
  const behavior = def.behavior?.type || 'None';
  const attack = def.attack?.type || 'None';
  const scored = roles.map((role, index) => {
    let score = 0;
    if (role.behavior === behavior) score += 4;
    else if (!role.behavior || role.behavior === 'Any') score += 1;
    if (role.attack === attack) score += 3;
    else if (!role.attack || role.attack === 'Any') score += 1;
    if (role.state && String(role.state).toLowerCase().includes(String(behavior).toLowerCase())) score += 1;
    if (role.spriteId) score += 1;
    return { role, index, score };
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored[0]?.role;
}

function selectEnemyBehaviorStateSwitch(def: EnemyDefinition): {
  nearMode: string;
  farMode: string;
  rangeX: number;
  rangeY: number;
} | undefined {
  const transitions = Array.isArray(def.behavior?.stateTransitions) ? def.behavior.stateTransitions : [];
  const transition = transitions.find(item => item?.condition === 'PlayerNear');
  if (!transition) return undefined;
  const near = mapEnemyBehaviorToMovementMode(transition.toBehavior);
  const far = mapEnemyBehaviorToMovementMode(transition.returnBehavior || def.behavior?.type);
  if (!near.implemented || !far.implemented || near.movementName === far.movementName) return undefined;
  const rangeX = Math.max(1, Math.min(255, Math.floor(Number(transition.rangeX) || 0)));
  const rangeY = Math.max(1, Math.min(191, Math.floor(Number(transition.rangeY) || 0)));
  return { nearMode: near.movementName, farMode: far.movementName, rangeX, rangeY };
}

/**
 * Builds a placed MSX2 screen enemy entity from a library `msx2enemy` asset
 * (snapshot at placement). The generator reads msx2_movement.mode for movement
 * and the Render sprite id for the shared enemy pattern; `params.enemyAssetId`
 * keeps the link for a future "Refresh from library". `x`/`y` are tile coords.
 */
export function buildMsx2EnemyEntityFromAsset(
  asset: ProjectAsset,
  x: number,
  y: number,
): Msx2Screen4EntityInstance {
  const def = (asset.data || {}) as EnemyDefinition;
  const { movementName } = mapEnemyBehaviorToMovementMode(def.behavior?.type);
  const renderRole = selectEnemyRenderRole(def);
  const stateSwitch = selectEnemyBehaviorStateSwitch(def);
  const roleFrames = Array.isArray(renderRole?.frames) && renderRole.frames.length ? renderRole.frames : [0];
  const spriteId = renderRole?.spriteId || def.render?.spriteId || '';
  const dropBombOnPlayerX = Boolean(def.attack?.dropBombOnPlayerX);
  const aiComponent = (stateSwitch || dropBombOnPlayerX) ? {
    ...(stateSwitch ? {
      engine: 'stateSwitch',
      trigger: 'playerNear',
      stateSwitchEnabled: true,
      nearMode: stateSwitch.nearMode,
      farMode: stateSwitch.farMode,
      rangeX: stateSwitch.rangeX,
      rangeY: stateSwitch.rangeY,
    } : {}),
    ...(dropBombOnPlayerX ? { dropBombOnPlayerX: true } : {}),
  } : undefined;
  return {
    id: `msx2_enemy_${Date.now()}`,
    name: def.name || asset.name || 'Enemy',
    kind: 'enemy',
    position: { x, y },
    spriteAssetId: spriteId || undefined,
    components: {
      msx2_transform: { tileX: x, tileY: y, pixelX: x * 16, pixelY: y * 16, spawnX: x * 16, spawnY: y * 16 },
      msx2_movement: { mode: movementName, direction: 1, speed: 2 },
      msx2_hardware_sprite: { msx2SpriteAssetId: spriteId, frame: 0, paletteSlot: 10, visible: Boolean(spriteId) },
      ...(aiComponent ? { msx2_ai: aiComponent } : {}),
      msx2_animation: {
        animation: renderRole?.animation || renderRole?.id || 'enemy',
        frameStart: roleFrames[0] || 0,
        frameCount: roleFrames.length,
        frameDelay: Math.max(1, Number(renderRole?.speed) || 8),
        frameList: roleFrames,
        loop: renderRole?.loop ?? true,
      },
      msx2_collision: { hitboxW: 16, hitboxH: 16, offsetX: 0, offsetY: 0, solid: false, damage: 1 },
    },
    params: {
      runtime: 'MSX2',
      engine: 'staticEnemy',
      movement: movementName,
      enemyAssetId: asset.id,
      enemyRenderRoleId: renderRole?.id || '',
      enemyRenderState: renderRole?.state || '',
      ...(stateSwitch ? {
        enemyStateSwitch: true,
        enemyNearMode: stateSwitch.nearMode,
        enemyFarMode: stateSwitch.farMode,
        enemyStateRangeX: stateSwitch.rangeX,
        enemyStateRangeY: stateSwitch.rangeY,
      } : {}),
      ...(dropBombOnPlayerX ? { enemyDropBombOnPlayerX: true } : {}),
    },
  };
}

const MSX2_VALID_ENTITY_KINDS = new Set(MSX2_ENTITY_KIND_OPTIONS.map(option => option.value));

/**
 * Converts an edited MSX2 screen entity into a project EntityTemplate asset
 * (target MSX2) so it persists in the project JSON and can be re-inserted
 * from the Create MSX2 Entity palette. Transform values are kept but the
 * placement click overrides position (see buildMsx2EntityComponents).
 */
export function buildEntityTemplateFromMsx2Entity(
  entity: Msx2Screen4EntityInstance,
  templateId: string,
  name: string,
): EntityTemplate {
  return {
    id: templateId,
    name,
    target: 'MSX2',
    components: Object.entries(entity.components || {}).map(([definitionId, defaultValues]) => ({
      definitionId,
      defaultValues: { ...(defaultValues || {}) },
    })),
    description: `Custom MSX2 entity preset saved from the room editor (kind: ${entity.kind}).`,
    msx2Kind: entity.kind,
    msx2Params: { ...(entity.params || {}) },
  };
}

/**
 * Converts a project EntityTemplate (target MSX2) back into a palette
 * preset. Returns null for non-MSX2 or component-less templates so legacy
 * MSX1 ECS templates never leak into the MSX2 palette.
 */
export function buildMsx2PresetFromEntityTemplate(
  template: EntityTemplate | undefined | null,
): Msx2EntityCreatePreset | null {
  if (!template || template.target !== 'MSX2' || !Array.isArray(template.components)) return null;
  const components: Partial<Record<Msx2ComponentId, Record<string, any>>> = {};
  for (const component of template.components) {
    if (!component?.definitionId) continue;
    components[component.definitionId as Msx2ComponentId] = { ...(component.defaultValues || {}) };
  }
  if (Object.keys(components).length === 0) return null;
  const kind = template.msx2Kind && MSX2_VALID_ENTITY_KINDS.has(template.msx2Kind)
    ? template.msx2Kind
    : 'custom';
  return {
    id: template.id,
    label: template.name || template.id,
    kind,
    runtime: 'MSX2',
    engine: 'staticEnemy',
    description: template.description || 'Custom project entity preset.',
    components,
    params: { runtime: 'MSX2', ...(template.msx2Params || {}) },
  };
}

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

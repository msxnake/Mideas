import { EnemyDefinition, EnemyTemplate, SpawnParamSchemaItem } from '../types';

export const GLOBAL_ENEMY_TEMPLATES: EnemyTemplate[] = [
  {
    templateId: 'bat_enemy_basic',
    name: 'Bat Enemy',
    category: 'simpleEnemy',
    behavior: { type: 'FlyerSine', requiresRoutine: 'Move_FlyerSine' },
    attack: { type: 'DamageOnTouch' },
    spawnParamsSchema: [
      { name: 'speedX', label: 'Speed X', type: 'byte', default: 1, min: 1, max: 4, exportParam: 'p0' },
      { name: 'amplitude', label: 'Flight Amplitude', type: 'byte', default: 12, min: 0, max: 64, exportParam: 'p1' },
      { name: 'frequency', label: 'Wing Frequency', type: 'byte', default: 2, min: 1, max: 8, exportParam: 'p2' },
      { name: 'phase', label: 'Start Phase', type: 'byte', default: 0, min: 0, max: 255, exportParam: 'p3' },
    ],
    requiredRoutines: ['Move_FlyerSine', 'DamageOnTouch_Update', 'Enemy_Animate'],
    budget: { cpu: 2, ram: 18, sprites: 1 },
    renderPlaceholder: { spriteSize: '16x16', defaultAnimation: 'fly' },
    description: 'Small flying bat using a sine movement path and damage-on-touch collision.',
  },
  {
    templateId: 'patrol_horizontal_basic',
    name: 'Patrol Enemy',
    category: 'simpleEnemy',
    behavior: { type: 'PatrolHorizontal', requiresRoutine: 'Move_PatrolHorizontal' },
    attack: { type: 'DamageOnTouch' },
    spawnParamsSchema: [
      { name: 'range', label: 'Patrol Range', type: 'byte', default: 48, min: 0, max: 128, exportParam: 'p0' },
      { name: 'speed', label: 'Speed', type: 'byte', default: 1, min: 1, max: 4, exportParam: 'p1' },
      { name: 'initialDirection', label: 'Initial Direction', type: 'enum', values: ['left', 'right'], default: 'left', exportParam: 'p2' },
      { name: 'pauseOnTurn', label: 'Pause On Turn', type: 'byte', default: 0, min: 0, max: 255, exportParam: 'p3' },
    ],
    requiredRoutines: ['Move_PatrolHorizontal', 'DamageOnTouch_Update', 'Enemy_Animate', 'GetSolidCell'],
    budget: { cpu: 1, ram: 16, sprites: 1 },
    renderPlaceholder: { spriteSize: '16x16', defaultAnimation: 'move' },
  },
  {
    templateId: 'walker_turn_on_edge_basic',
    name: 'Walker Turn On Edge',
    category: 'simpleEnemy',
    behavior: { type: 'WalkerTurnOnEdge', requiresRoutine: 'Move_WalkerTurnOnEdge' },
    attack: { type: 'DamageOnTouch' },
    spawnParamsSchema: [
      { name: 'speed', label: 'Speed', type: 'byte', default: 1, min: 1, max: 4, exportParam: 'p0' },
      { name: 'gravity', label: 'Gravity', type: 'byte', default: 1, min: 0, max: 8, exportParam: 'p1' },
      { name: 'turnOnWall', label: 'Turn On Wall', type: 'boolean', default: true, exportParam: 'p2' },
      { name: 'turnOnLedge', label: 'Turn On Ledge', type: 'boolean', default: true, exportParam: 'p3' },
    ],
    requiredRoutines: ['Move_WalkerTurnOnEdge', 'DamageOnTouch_Update', 'Enemy_Animate', 'GetSolidCell'],
    budget: { cpu: 2, ram: 18, sprites: 1 },
    renderPlaceholder: { spriteSize: '16x16', defaultAnimation: 'walk' },
  },
  {
    templateId: 'flyer_sine_basic',
    name: 'Flying Sine Enemy',
    category: 'simpleEnemy',
    behavior: { type: 'FlyerSine', requiresRoutine: 'Move_FlyerSine' },
    attack: { type: 'DamageOnTouch' },
    spawnParamsSchema: [
      { name: 'speedX', label: 'Speed X', type: 'byte', default: 1, min: 1, max: 4, exportParam: 'p0' },
      { name: 'amplitude', label: 'Amplitude', type: 'byte', default: 8, min: 0, max: 64, exportParam: 'p1' },
      { name: 'frequency', label: 'Frequency', type: 'byte', default: 2, min: 1, max: 8, exportParam: 'p2' },
      { name: 'phase', label: 'Phase', type: 'byte', default: 0, min: 0, max: 255, exportParam: 'p3' },
    ],
    requiredRoutines: ['Move_FlyerSine', 'DamageOnTouch_Update', 'Enemy_Animate'],
    budget: { cpu: 2, ram: 18, sprites: 1 },
    renderPlaceholder: { spriteSize: '16x16', defaultAnimation: 'fly' },
  },
  {
    templateId: 'bounce_diagonal_basic',
    name: 'Bouncing Enemy',
    category: 'simpleEnemy',
    behavior: { type: 'BounceDiagonal', requiresRoutine: 'Move_BounceDiagonal' },
    attack: { type: 'DamageOnTouch' },
    spawnParamsSchema: [
      { name: 'speedX', label: 'Speed X', type: 'byte', default: 1, min: 1, max: 3, exportParam: 'p0' },
      { name: 'speedY', label: 'Speed Y', type: 'byte', default: 1, min: 1, max: 3, exportParam: 'p1' },
      { name: 'dirX', label: 'Direction X', type: 'enum', values: ['left', 'right'], default: 'right', exportParam: 'p2' },
      { name: 'dirY', label: 'Direction Y', type: 'enum', values: ['up', 'down'], default: 'down', exportParam: 'p3' },
    ],
    requiredRoutines: ['Move_BounceDiagonal', 'DamageOnTouch_Update', 'Enemy_Animate', 'GetSolidCell'],
    budget: { cpu: 2, ram: 16, sprites: 1 },
    renderPlaceholder: { spriteSize: '16x16', defaultAnimation: 'move' },
  },
  {
    templateId: 'shooter_static_basic',
    name: 'Static Shooter',
    category: 'simpleEnemy',
    behavior: { type: 'ShooterStatic', requiresRoutine: 'Move_None' },
    attack: { type: 'ShooterStatic' },
    spawnParamsSchema: [
      { name: 'fireRate', label: 'Fire Rate', type: 'byte', default: 64, min: 1, max: 255, exportParam: 'p0' },
      { name: 'bulletType', label: 'Bullet Type', type: 'byte', default: 0, min: 0, max: 15, exportParam: 'p1' },
      { name: 'direction', label: 'Direction', type: 'enum', values: ['left', 'right', 'up', 'down'], default: 'left', exportParam: 'p2' },
      { name: 'initialDelay', label: 'Initial Delay', type: 'byte', default: 0, min: 0, max: 255, exportParam: 'p3' },
    ],
    requiredRoutines: ['Enemy_ShooterStatic', 'Enemy_Animate', 'Sound_RequestSFX'],
    budget: { cpu: 1, ram: 18, sprites: 1 },
    renderPlaceholder: { spriteSize: '16x16', defaultAnimation: 'idle' },
  },
  {
    templateId: 'drop_from_ceiling_basic',
    name: 'Drop From Ceiling',
    category: 'hazard',
    behavior: { type: 'DropFromCeiling', requiresRoutine: 'Move_DropFromCeiling' },
    attack: { type: 'DamageOnTouch' },
    spawnParamsSchema: [
      { name: 'detectWidth', label: 'Detect Width', type: 'byte', default: 24, min: 8, max: 128, exportParam: 'p0' },
      { name: 'gravity', label: 'Gravity', type: 'byte', default: 1, min: 1, max: 8, exportParam: 'p1' },
      { name: 'fallSpeedMax', label: 'Max Fall Speed', type: 'byte', default: 4, min: 1, max: 16, exportParam: 'p2' },
      { name: 'resetOnLeave', label: 'Reset On Leave', type: 'boolean', default: false, exportParam: 'p3' },
    ],
    requiredRoutines: ['Move_DropFromCeiling', 'DamageOnTouch_Update', 'GetSolidCell'],
    budget: { cpu: 2, ram: 18, sprites: 1 },
    renderPlaceholder: { spriteSize: '16x16', defaultAnimation: 'idle' },
  },
  {
    templateId: 'gear_wheel_emitter',
    name: 'Rueda dentada',
    category: 'hazard',
    behavior: { type: 'GearWheel', requiresRoutine: 'Move_GearWheelEmitter' },
    attack: { type: 'DamageOnTouch' },
    spawnParamsSchema: [
      { name: 'speed', label: 'Speed (px/2 frames)', type: 'byte', default: 1, min: 1, max: 15, exportParam: 'p0' },
      { name: 'direction', label: 'Initial Direction', type: 'enum', values: ['left', 'right'], default: 'right', exportParam: 'p1' },
      { name: 'respawnSeconds', label: 'Respawn Delay (seconds)', type: 'byte', default: 3, min: 1, max: 255, exportParam: 'p2' },
    ],
    requiredRoutines: ['Move_GearWheelEmitter', 'DamageOnTouch_Update', 'Enemy_Animate', 'GetSolidCell', 'GetExitCell'],
    budget: { cpu: 3, ram: 28, sprites: 1 },
    renderPlaceholder: { spriteSize: '16x16', defaultAnimation: 'roll' },
    description: 'Emisor de una rueda dentada: cae, rueda por el suelo, invierte en paredes y desaparece en salidas. Solo hay una rueda activa por emisor.',
  },
];

const slugify = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'enemy';

const defaultHitbox = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

export const createEnemyFromTemplate = (
  template: EnemyTemplate,
  options: { name?: string; existingIds?: Set<string>; world?: string } = {}
): EnemyDefinition => {
  const baseName = options.name?.trim() || template.name;
  const baseId = slugify(baseName);
  const existingIds = options.existingIds || new Set<string>();
  let enemyId = baseId;
  let suffix = 2;
  while (existingIds.has(enemyId)) {
    enemyId = `${baseId}_${suffix++}`;
  }

  const defaultAnimation = template.renderPlaceholder?.defaultAnimation || 'move';
  const defaultRoleId = defaultAnimation === 'fly' ? 'patrol' : defaultAnimation;
  return {
    enemyId,
    basedOnTemplate: template.templateId,
    name: baseName,
    world: options.world || 'common',
    behaviorGroup: `${options.world || 'common'}_entities`,
    category: template.category,
    scope: options.world ? 'perWorld' : 'common',
    behavior: { type: template.behavior.type },
    attack: { type: template.attack.type },
    render: {
      renderMode: 'hardwareSprite',
      spriteId: '',
      palette: '',
      size: template.renderPlaceholder?.spriteSize || '16x16',
      animations: {
        [defaultAnimation]: { frames: [0], speed: 4, loop: true },
      },
      roles: [
        {
          id: defaultRoleId,
          label: defaultRoleId.charAt(0).toUpperCase() + defaultRoleId.slice(1),
          state: template.behavior.type === 'None' ? 'Idle' : template.behavior.type,
          behavior: template.behavior.type,
          attack: template.attack.type === 'None' ? 'Any' : template.attack.type,
          spriteId: '',
          animation: defaultAnimation,
          frames: [0],
          speed: 4,
          loop: true,
        },
      ],
    },
    hitboxes: {
      body: defaultHitbox(2, 2, 12, 12),
      damage: defaultHitbox(1, 1, 14, 14),
    },
    stats: { hp: template.category === 'boss' ? 16 : 1, damage: 1, invulnerabilityFrames: 0, knockback: 0 },
    sound: {
      onSpawn: null,
      onAttack: null,
      onHit: null,
      onDeath: null,
      onBounce: null,
      onDespawn: null,
    },
    spawnParamsSchema: template.spawnParamsSchema.map(param => ({ ...param })),
    requiredRoutines: [...template.requiredRoutines],
    budget: {
      cpu: template.budget.cpu,
      sprites: template.budget.sprites,
      ram: template.budget.ram,
      codePackage: `${options.world || 'common'}_entity_code`,
      graphicsPackage: `${options.world || 'common'}_enemy_gfx`,
      graphicsBank: 'auto',
      ramPackage: '',
    },
  };
};

export const createEmptyEnemyDefinition = (existingIds: Set<string> = new Set()): EnemyDefinition => {
  const schema: SpawnParamSchemaItem[] = [
    { name: 'p0', label: 'Param 0', type: 'byte', default: 0, min: 0, max: 255, exportParam: 'p0' },
  ];
  return {
    ...createEnemyFromTemplate({
      templateId: 'empty_custom_enemy',
      name: 'Empty Enemy',
      category: 'simpleEnemy',
      behavior: { type: 'None' },
      attack: { type: 'None' },
      spawnParamsSchema: schema,
      requiredRoutines: [],
      budget: { cpu: 0, ram: 0, sprites: 0 },
    }, { existingIds }),
    basedOnTemplate: undefined,
    name: 'Empty Enemy',
    behaviorGroup: 'custom_entities',
    scope: 'perWorld',
  };
};

import { EntityTemplate, EntityTemplateComponent, PlayerTemplate } from '../types';

export const GLOBAL_PLAYER_TEMPLATES: PlayerTemplate[] = [
  {
    templateId: 'platformer_basic',
    name: 'Platformer Basic',
    category: 'platformer',
    description: 'Reusable left/right, jump, gravity, damage and checkpoint player base.',
    movement: {
      type: 'Platformer',
      defaults: {
        moveSpeed: 2,
        acceleration: 1,
        gravity: 1,
        jumpPower: 5,
        maxFallSpeed: 6,
        airControl: true,
      },
    },
    input: {
      left: 'LEFT',
      right: 'RIGHT',
      jump: 'BUTTON_A',
      attack: 'BUTTON_B',
      interact: 'UP',
    },
    stateMachine: ['IDLE', 'WALK', 'JUMP', 'FALL', 'ATTACK', 'HURT', 'DEAD', 'SCREEN_TRANSITION'],
    respawn: {
      mode: 'lastCheckpoint',
      invulnerabilityFrames: 90,
    },
    requiredRoutines: [
      'Player_UpdatePlatformer',
      'Player_CheckCollision',
      'Player_ApplyGravity',
      'Player_HandleJump',
      'Player_HandleDamage',
      'Player_HandleScreenTransition',
    ],
    budget: {
      cpu: 3,
      ram: 64,
      sprites: 4,
    },
  },
  {
    templateId: 'maze_4_direction',
    name: 'Maze 4 Direction',
    category: 'maze',
    description: 'Grid-friendly four-way player for maze and room games.',
    movement: {
      type: 'Maze4',
      defaults: {
        moveSpeed: 2,
        gridAligned: true,
        allowDiagonals: false,
      },
    },
    input: {
      left: 'LEFT',
      right: 'RIGHT',
      up: 'UP',
      down: 'DOWN',
    },
    stateMachine: ['IDLE', 'MOVE', 'TURN', 'HURT', 'DEAD', 'SCREEN_TRANSITION'],
    respawn: {
      mode: 'screenEntry',
      invulnerabilityFrames: 60,
    },
    requiredRoutines: [
      'Player_UpdateMaze4',
      'Player_CheckCollision',
      'Player_HandleDamage',
      'Player_HandleScreenTransition',
    ],
    budget: {
      cpu: 2,
      ram: 48,
      sprites: 2,
    },
  },
  {
    templateId: 'shooter_horizontal',
    name: 'Shooter Horizontal',
    category: 'shooter',
    description: 'Horizontal shooter player with projectile support.',
    movement: {
      type: 'ShooterHorizontal',
      defaults: {
        moveSpeed: 3,
        maxProjectiles: 2,
        projectileSpeed: 4,
      },
    },
    input: {
      left: 'LEFT',
      right: 'RIGHT',
      up: 'UP',
      down: 'DOWN',
      attack: 'BUTTON_A',
    },
    stateMachine: ['IDLE', 'MOVE', 'FIRE', 'HURT', 'DEAD', 'RESPAWN'],
    respawn: {
      mode: 'screenEntry',
      invulnerabilityFrames: 90,
    },
    requiredRoutines: [
      'Player_UpdateShooterHorizontal',
      'Player_UpdateProjectilePool',
      'Player_HandleDamage',
      'Player_Respawn',
    ],
    budget: {
      cpu: 2,
      ram: 64,
      sprites: 3,
    },
  },
  {
    templateId: 'shooter_vertical',
    name: 'Shooter Vertical',
    category: 'shooter',
    description: 'Vertical shooter player tuned for arcade movement and shots.',
    movement: {
      type: 'ShooterVertical',
      defaults: {
        moveSpeed: 3,
        maxProjectiles: 3,
        projectileSpeed: 5,
      },
    },
    input: {
      left: 'LEFT',
      right: 'RIGHT',
      up: 'UP',
      down: 'DOWN',
      attack: 'BUTTON_A',
    },
    stateMachine: ['IDLE', 'MOVE', 'FIRE', 'HURT', 'DEAD', 'RESPAWN'],
    respawn: {
      mode: 'screenEntry',
      invulnerabilityFrames: 90,
    },
    requiredRoutines: [
      'Player_UpdateShooterVertical',
      'Player_UpdateProjectilePool',
      'Player_HandleDamage',
      'Player_Respawn',
    ],
    budget: {
      cpu: 2,
      ram: 64,
      sprites: 3,
    },
  },
  {
    templateId: 'top_down_adventure',
    name: 'Top Down Adventure',
    category: 'topDown',
    description: 'Eight-direction adventure player with interaction and basic attack hooks.',
    movement: {
      type: 'TopDown',
      defaults: {
        moveSpeed: 2,
        allowDiagonals: true,
        interactionRange: 8,
      },
    },
    input: {
      left: 'LEFT',
      right: 'RIGHT',
      up: 'UP',
      down: 'DOWN',
      attack: 'BUTTON_A',
      interact: 'BUTTON_B',
    },
    stateMachine: ['IDLE', 'WALK', 'ATTACK', 'INTERACT', 'HURT', 'DEAD', 'SCREEN_TRANSITION'],
    respawn: {
      mode: 'lastCheckpoint',
      invulnerabilityFrames: 75,
    },
    requiredRoutines: [
      'Player_UpdateTopDown',
      'Player_CheckCollision',
      'Player_AttackMelee',
      'Player_HandleInteraction',
      'Player_HandleDamage',
    ],
    budget: {
      cpu: 2,
      ram: 64,
      sprites: 4,
    },
  },
];

const createLegacyComponents = (template: PlayerTemplate): EntityTemplateComponent[] => {
  const base: EntityTemplateComponent[] = [
    { definitionId: 'comp_pos', defaultValues: { x: 32, y: 100 } },
    { definitionId: 'comp_render', defaultValues: { spriteAssetId: '', isVisible: true, layer: 1 } },
    { definitionId: 'comp_health', defaultValues: { current: 3, max: 3 } },
    { definitionId: 'comp_player_input', defaultValues: { controllerId: 0, inputEnabled: true } },
    { definitionId: 'comp_animation', defaultValues: { currentAnimationName: 'idle', animationSpeed: 8, animateOnlyWhenMoving: true } },
    { definitionId: 'comp_collision', defaultValues: { hitboxWidth: 14, hitboxHeight: 15, offsetX: 1, offsetY: 1, collisionLayer: 1, collidesWith: 255 } },
  ];

  if (template.movement.type === 'Platformer') {
    return [
      ...base,
      { definitionId: 'comp_cursors', defaultValues: { isEnabled: true, speed: template.movement.defaults.moveSpeed ?? 2, allowUp: false, allowDown: false, allowLeft: true, allowRight: true } },
      { definitionId: 'comp_jump', defaultValues: { jumpPower: String(Number(template.movement.defaults.jumpPower ?? 5) * 96), maxJumps: 1 } },
      { definitionId: 'comp_gravity', defaultValues: { strength: String(Number(template.movement.defaults.gravity ?? 1) * 64) } },
      { definitionId: 'comp_limit_on', defaultValues: { isEnabled: true } },
    ];
  }

  if (template.movement.type === 'ShooterHorizontal' || template.movement.type === 'ShooterVertical') {
    const vertical = template.movement.type === 'ShooterVertical';
    return [
      ...base,
      { definitionId: 'comp_cursors', defaultValues: { isEnabled: true, speed: template.movement.defaults.moveSpeed ?? 3, allowUp: true, allowDown: true, allowLeft: true, allowRight: true } },
      { definitionId: 'comp_shoot', defaultValues: { mode: 'char', speed: template.movement.defaults.projectileSpeed ?? 4, velocityX: vertical ? 0 : 4, velocityY: vertical ? -5 : 0, cooldownMs: 180, trigger: 'fire' } },
    ];
  }

  return [
    ...base,
    { definitionId: 'comp_cursors', defaultValues: { isEnabled: true, speed: template.movement.defaults.moveSpeed ?? 2, allowUp: true, allowDown: true, allowLeft: true, allowRight: true } },
    { definitionId: 'comp_limit_on', defaultValues: { isEnabled: true } },
  ];
};

const createMsx2Components = (template: PlayerTemplate): EntityTemplateComponent[] => {
  const movementMode = template.movement.type === 'Platformer'
    ? 'platform'
    : template.movement.type === 'Maze4' || template.movement.type === 'Maze8'
      ? 'maze'
      : template.movement.type === 'ShooterVertical'
        ? 'shooterVertical'
        : template.movement.type === 'ShooterHorizontal'
          ? 'shooterHorizontal'
          : 'maze';

  const components: EntityTemplateComponent[] = [
    { definitionId: 'msx2_transform', defaultValues: { tileX: 0, tileY: 0, pixelX: 32, pixelY: 128, spawnX: 0, spawnY: 0 } },
    { definitionId: 'msx2_hardware_sprite', defaultValues: { msx2SpriteAssetId: '', frame: 0, paletteSlot: 5, visible: true } },
    { definitionId: 'msx2_player_control', defaultValues: { controlMode: movementMode, movementMode, jump: template.movement.type === 'Platformer', gravity: template.movement.type === 'Platformer', air: 255, disableAirTimer: template.movement.type !== 'Platformer' } },
    { definitionId: 'msx2_movement', defaultValues: { mode: movementMode, speed: template.movement.defaults.moveSpeed ?? 2, minX: 0, maxX: 15, minY: 0, maxY: 11 } },
    { definitionId: 'msx2_health', defaultValues: { current: 3, max: 3, invincibleFrames: template.respawn.invulnerabilityFrames, deathAction: 'respawn' } },
    { definitionId: 'msx2_spawn', defaultValues: { spawnOnScreenLoad: true, respawn: template.respawn.mode !== 'none', respawnDelayFrames: 45 } },
  ];

  if (template.category === 'shooter') {
    components.push({
      definitionId: 'msx2_shooter',
      defaultValues: {
        enabled: true,
        fireKey: 'space',
        cooldownFrames: 10,
        projectilePresetId: template.movement.type === 'ShooterVertical' ? 'player_laser' : 'player_bullet',
        maxProjectiles: template.movement.defaults.maxProjectiles ?? 2,
      },
    });
  }

  return components;
};

export const createProjectPlayerTemplate = (
  template: PlayerTemplate,
  options: {
    name?: string;
    target?: EntityTemplate['target'];
    existingIds?: Set<string>;
  } = {}
): EntityTemplate => {
  const target = options.target || 'COMMON';
  const baseId = `tpl_player_${template.templateId}`;
  const existingIds = options.existingIds || new Set<string>();
  let id = baseId;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${baseId}_${suffix}`;
    suffix += 1;
  }

  return {
    id,
    name: options.name || template.name,
    target,
    icon: 'P',
    isPlayer: true,
    playerTemplateId: template.templateId,
    playerLibraryRole: 'projectPlayer',
    description: `${template.name} project player created from the Global Player Library.`,
    components: target === 'MSX2' ? createMsx2Components(template) : createLegacyComponents(template),
  };
};

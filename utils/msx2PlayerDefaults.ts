import { Msx2GameProfileId, Msx2PlayerDefinition, Msx2PlayerEntry, Msx2PlayerGameType } from '../types';

const gameTypeFromProfile = (profileId?: Msx2GameProfileId | null): Msx2PlayerGameType => {
  if (profileId === 'maze') return 'maze';
  if (profileId === 'shooterHorizontal') return 'shooterHorizontal';
  if (profileId === 'shooterVertical') return 'shooterVertical';
  return 'platform';
};

export const createDefaultMsx2PlayerDefinition = (
  id = `msx2_player_${Date.now()}`,
  profileId?: Msx2GameProfileId | null
): Msx2PlayerDefinition => {
  const gameType = gameTypeFromProfile(profileId);
  const isShooter = gameType === 'shooterHorizontal' || gameType === 'shooterVertical';
  const isMaze = gameType === 'maze';
  return {
    id,
    name: 'Player_Main',
    target: 'MSX2',
    gameType,
    basedOnTemplate: isShooter ? 'shooter_basic' : isMaze ? 'maze_4_direction' : 'platformer_basic',
    worldCompatibility: ['all'],
    render: {
      mode: 'hardwareSprite',
      spriteSize: isShooter ? '16x16' : '16x32',
      usesFlipX: true,
    },
    animations: isMaze
      ? {
        idle_down: { frames: [0], speed: 12 },
        idle_up: { frames: [1], speed: 12 },
        idle_left: { frames: [2], speed: 12 },
        idle_right: { frames: [3], speed: 12 },
        walk_down: { frames: [4, 5], speed: 6 },
        walk_up: { frames: [6, 7], speed: 6 },
        walk_left: { frames: [8, 9], speed: 6 },
        walk_right: { frames: [10, 11], speed: 6 },
        hurt: { frames: [12], speed: 6 },
      }
      : {
        idle: { frames: [0, 1], speed: 12 },
        walk: { frames: [2, 3, 4, 5], speed: 6 },
        jump: { frames: [6], speed: 1 },
        fall: { frames: [7], speed: 1 },
        attack: { frames: [8, 9], speed: 4 },
        hurt: { frames: [10], speed: 6 },
      },
    hitboxes: {
      body: isShooter ? { x: 2, y: 2, w: 12, h: 12 } : { x: 3, y: 4, w: 10, h: 27 },
      feet: isShooter ? undefined : { x: 3, y: 30, w: 10, h: 2 },
      attack: { x: 14, y: 8, w: 10, h: 8 },
      interaction: { x: -4, y: 4, w: 24, h: 24 },
    },
    movement: {
      model: gameType,
      moveSpeed: isShooter ? 3 : 2,
      acceleration: isShooter || isMaze ? 0 : 1,
      deceleration: isShooter || isMaze ? 0 : 1,
      gravity: isShooter || isMaze ? 0 : 1,
      maxFallSpeed: isShooter || isMaze ? 0 : 6,
      jumpPower: isShooter || isMaze ? 0 : 5,
      coyoteTime: isShooter || isMaze ? 0 : 4,
      jumpBuffer: isShooter || isMaze ? 0 : 4,
      airControl: !isShooter && !isMaze,
      diagonalAllowed: isMaze || isShooter,
      snapToGrid: false,
      screenBoundsClamp: isShooter,
      fireRate: isShooter ? 12 : 0,
      maxProjectiles: isShooter ? 2 : 0,
    },
    inputMapping: {
      left: 'CURSOR_LEFT',
      right: 'CURSOR_RIGHT',
      up: 'CURSOR_UP',
      down: 'CURSOR_DOWN',
      jump: 'SPACE',
      attack: 'M',
      interact: 'UP',
      inventory: 'F1',
      pause: 'F2',
    },
    health: {
      maxHealth: 5,
      lives: 3,
      invulnerabilityFrames: 60,
      knockbackX: isShooter ? 0 : 8,
      knockbackY: isShooter ? 0 : 4,
    },
    attack: {
      type: isShooter ? 'projectile' : 'melee',
      damage: 1,
      durationFrames: isShooter ? 0 : 12,
      cooldownFrames: isShooter ? 12 : 15,
      projectileType: isShooter ? 'player_bullet' : undefined,
    },
    interaction: {
      mode: 'pressUp',
      box: { x: -4, y: 4, w: 24, h: 24 },
    },
    sounds: {
      onJump: 'sfx_jump',
      onHit: 'sfx_player_hit',
      onDeath: 'sfx_death',
    },
    inventoryHooks: [],
    stateMachine: isMaze
      ? ['IDLE', 'MOVE', 'ATTACK', 'HURT', 'DEAD', 'INTERACT', 'DIALOGUE_LOCK', 'SCREEN_TRANSITION']
      : ['IDLE', 'WALK', 'JUMP', 'FALL', 'ATTACK', 'HURT', 'DEAD', 'INTERACT', 'DIALOGUE_LOCK', 'SCREEN_TRANSITION'],
    budget: {
      cpu: isShooter ? 2 : 3,
      ram: 64,
      sprites: isShooter ? 1 : 4,
      maxProjectiles: isShooter ? 2 : 0,
    },
    requiredRoutines: isShooter
      ? ['Player_ReadInput', 'Player_UpdateShooter', 'Player_ClampToScreen', 'Player_FireProjectile', 'Player_RenderHardwareSprite']
      : isMaze
        ? ['Player_ReadInput', 'Player_UpdateMaze', 'Player_CheckCollision', 'Player_HandleInteraction', 'Player_RenderHardwareSprite']
        : ['Player_ReadInput', 'Player_UpdatePlatformer', 'Player_CheckCollision', 'Player_ApplyGravity', 'Player_HandleJump', 'Player_HandleDamage', 'Player_HandleScreenTransition', 'Player_RenderHardwareSprite'],
    notes: 'MSX2 player core should stay resident and update every frame.',
  };
};

export const createDefaultMsx2PlayerEntries = (): Msx2PlayerEntry[] => [
  { id: 'default', x: 32, y: 128, facing: 'right', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
  { id: 'from_left', x: 8, y: 128, facing: 'right', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
  { id: 'from_right', x: 232, y: 128, facing: 'left', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
];

export const normalizeMsx2PlayerEntries = (entries: Msx2PlayerEntry[] | undefined): Msx2PlayerEntry[] => {
  const source = Array.isArray(entries) && entries.length > 0 ? entries : createDefaultMsx2PlayerEntries();
  return source.map((entry, index) => ({
    id: String(entry.id || `entry_${index + 1}`),
    x: Math.max(0, Math.min(255, Math.round(Number(entry.x) || 0))),
    y: Math.max(0, Math.min(191, Math.round(Number(entry.y) || 0))),
    facing: entry.facing || 'right',
    state: entry.state || 'IDLE',
    playerId: entry.playerId,
    entryAnimation: entry.entryAnimation || 'none',
    invulnerabilityFrames: Math.max(0, Math.min(255, Math.round(Number(entry.invulnerabilityFrames) || 0))),
    cameraTransition: entry.cameraTransition || 'instant',
  }));
};

export const normalizeMsx2PlayerDefinition = (player: Partial<Msx2PlayerDefinition> | undefined): Msx2PlayerDefinition => ({
  ...createDefaultMsx2PlayerDefinition(player?.id),
  ...(player || {}),
  render: {
    ...createDefaultMsx2PlayerDefinition(player?.id).render,
    ...(player?.render || {}),
  },
  hitboxes: {
    ...createDefaultMsx2PlayerDefinition(player?.id).hitboxes,
    ...(player?.hitboxes || {}),
  },
  movement: {
    ...createDefaultMsx2PlayerDefinition(player?.id).movement,
    ...(player?.movement || {}),
  },
  health: {
    ...createDefaultMsx2PlayerDefinition(player?.id).health,
    ...(player?.health || {}),
  },
  attack: {
    ...createDefaultMsx2PlayerDefinition(player?.id).attack,
    ...(player?.attack || {}),
  },
  interaction: {
    ...createDefaultMsx2PlayerDefinition(player?.id).interaction,
    ...(player?.interaction || {}),
  },
});

import { ProjectAnalysis } from './asmTemplateGenerator';
import { Msx2PlayerControlId, Msx2Screen4TileScreen } from '../types';
import { getSkill } from './msxGenerator/skills';

/** MSX1 ROM default: #FC00 (-1024 in 8.8 fixed-point, ~-4 px/frame initial rise). */
export const MSX2_DEFAULT_JUMP_IMPULSE_88 = 0xfc00;

/** MSX1 ROM default gravity acceleration per frame (#40 on the low byte). */
export const MSX2_DEFAULT_GRAVITY_STRENGTH_88 = 0x0040;

/** MSX1 ROM terminal fall speed cap (#0400 in 8.8). */
export const MSX2_DEFAULT_TERMINAL_VELOCITY_88 = 0x0400;

/** Mid-air jump impulse scale when the optional double_jump skill is active. */
export const MSX2_DOUBLE_JUMP_IMPULSE_SCALE = 0.7;

export interface Msx2GlideConfig {
  enabled: boolean;
  glideSpeed: number;
  glideHorizontalSpeed: number;
  glideBoostCost: number;
}

export interface Msx2TeleportABConfig {
  enabled: boolean;
  teleportCooldown: number;
  teleportDelay: number;
  savePointA: boolean;
  useHorizontal: boolean;
  useVertical: boolean;
  maxDistance: number;
  primaryControl: Msx2PlayerControlId;
  secondaryControl: Msx2PlayerControlId | 'none';
}

export interface Msx2DashConfig {
  enabled: boolean;
  dashSpeed: number;
  dashDuration: number;
  dashCooldown: number;
  requireKeyRelease: boolean;
  directional: boolean;
  invulnerable: boolean;
  primaryControl: Msx2PlayerControlId;
  secondaryControl: Msx2PlayerControlId | 'none';
}

/**
 * Wall jump skill config (MSX2 platformer).
 *
 * Two sub-behaviours share the same 4 bytes of RAM (see msx2WallJumpGenerator):
 *  - `wall_slide`: detected via touching-wall probe; caps gravityVel to wallSlideSpeed.
 *  - `wall_jump_kick`: triggered from wall_slide when jump key fires; applies
 *    `wallJumpPower88` (8.8, sign-extended negative) and locks vx to
 *    `±wallJumpHorizontal` for internally-computed `lockFrames` frames.
 *
 * Both require the player to hold the direction key into the wall (Celeste-style).
 */
export interface Msx2WallJumpConfig {
  enabled: boolean;
  /** Vertical impulse 8.8 (sign-extended negative: -1024 = 1024 px/sec up). Range 256..2048. */
  wallJumpPower88: number;
  /** Horizontal push away from wall, px/frame. Range 1..12. Sign chosen by detected wall side. */
  wallJumpHorizontal: number;
  /** Cap of gravityVel while wall_slide is active. 0 = total cling (gravityVel=0). Range 0..4. */
  wallSlideSpeed: number;
  /** When true, the player must release jump key between wall jumps (Celeste-style). */
  requireKeyRelease: boolean;
  /** Jump key used to trigger wall_jump kick from wall_slide. */
  primaryControl: Msx2PlayerControlId;
}

export interface Msx2PlatformPhysicsConfig {
  jumpEnabled: boolean;
  gravityEnabled: boolean;
  jumpImpulse88: number;
  /** Mid-air jump impulse (double_jump skill). Equals jumpImpulse88 when skill is off. */
  airJumpImpulse88: number;
  gravityStrength88: number;
  terminalVelocity88: number;
  maxJumps: number;
  doubleJumpEnabled: boolean;
  requireKeyRelease: boolean;
  /** Coyote time in frames. 0 = disabled. Counts down each frame after leaving a platform. */
  coyoteTime: number;
  /** Jump buffer in frames. 0 = disabled. Counts down after a jump press in the air, fires on landing. */
  jumpBuffer: number;
}

export function clampMsx2JumpImpulse88(value: unknown): number {
  const magnitude = Math.max(256, Math.min(2048, Math.floor(Math.abs(Number(value) || 1024))));
  return (-magnitude) & 0xffff;
}

export function clampMsx2GravityStrength88(value: unknown): number {
  return Math.max(16, Math.min(128, Math.floor(Number(value) || MSX2_DEFAULT_GRAVITY_STRENGTH_88)));
}

export function clampMsx2GravityStrength88Px(valuePx: unknown): number {
  const px = Number(valuePx);
  const magnitude88 = Math.max(16, Math.min(128, Math.floor(Math.abs(px || 0) * 256)));
  return magnitude88;
}

export function clampMsx2TerminalVelocity88(value: unknown): number {
  return Math.max(256, Math.min(2048, Math.floor(Number(value) || MSX2_DEFAULT_TERMINAL_VELOCITY_88)));
}

export function clampMsx2TerminalVelocity88Px(valuePx: unknown): number {
  const px = Number(valuePx);
  const magnitude88 = Math.max(256, Math.min(2048, Math.floor(Math.abs(px || 0) * 256)));
  return magnitude88;
}

export function clampMsx2CoyoteFrames(value: unknown): number {
  const n = Math.floor(Number(value) || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(0, Math.min(16, n));
}

export function clampMsx2JumpBufferFrames(value: unknown): number {
  const n = Math.floor(Number(value) || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(0, Math.min(16, n));
}

export function resolveMsx2JumpImpulse88(jumpPower: unknown): number {
  const numeric = Number(jumpPower);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return MSX2_DEFAULT_JUMP_IMPULSE_88;
  }
  if (numeric < 0) {
    return numeric & 0xffff;
  }
  return clampMsx2JumpImpulse88(numeric);
}

export function resolveMsx2JumpImpulse88Px(jumpPowerPx: unknown): number {
  const px = Number(jumpPowerPx);
  if (!Number.isFinite(px) || px === 0) {
    return MSX2_DEFAULT_JUMP_IMPULSE_88;
  }
  const magnitude88 = Math.max(256, Math.min(2048, Math.floor(Math.abs(px) * 256)));
  return (-magnitude88) & 0xffff;
}

function isMsx2ComponentEnabled(component: Record<string, any> | undefined): boolean {
  if (!component) return false;
  if (component.enabled === false || component.enabled === 'false') return false;
  return true;
}

function readPlayerActiveSkills(player: any | undefined): string[] {
  if (!Array.isArray(player?.activeSkills)) return [];
  return player.activeSkills.map((id: unknown) => String(id || '').trim()).filter(Boolean);
}

function resolveSkillNumberParam(
  params: Record<string, number | boolean>,
  skillId: string,
  key: string,
  fallback: number,
): number {
  const raw = params[key];
  if (raw !== undefined && Number.isFinite(Number(raw))) {
    return Math.floor(Number(raw));
  }
  const def = getSkill(skillId)?.parameters?.find((param) => param.key === key);
  if (def?.type === 'number' && def.default !== undefined && Number.isFinite(Number(def.default))) {
    return Math.floor(Number(def.default));
  }
  return fallback;
}

function pickSkillNumberParam(
  params: Record<string, number | boolean>,
  skillId: string,
  keys: string[],
  fallback: number,
): number {
  for (const key of keys) {
    const raw = params[key];
    if (raw !== undefined && Number.isFinite(Number(raw))) {
      return Math.floor(Number(raw));
    }
  }
  return resolveSkillNumberParam(params, skillId, keys[0], fallback);
}

const MSX2_JUMP_KEY_ALIASES: Record<string, string[]> = {
  spc: [' '],
  space: [' '],
  m: ['m', 'M'],
  z: ['z', 'Z', 'KeyZ'],
  x: ['x', 'X', 'KeyX'],
  a: ['a', 'A', 'KeyA'],
};

const MSX2_DASH_KEY_ALIASES: Record<string, string[]> = {
  attack: ['x', 'X', 'KeyX', 'z', 'Z', 'KeyZ', 'n', 'N', 'KeyN'],
  jump: [' ', 'a', 'A', 'KeyA'],
};

export interface Msx2PreviewControlSettings {
  keyboardButton1?: string;
  keyboardButton2?: string;
  jumpActionButton?: 'button1' | 'button2';
  actionButton?: 'button1' | 'button2';
}

function aliasesForMsx2KeyboardButton(key: string | undefined): string[] {
  const normalized = String(key || '').trim().toUpperCase();
  if (normalized === 'SPC' || normalized === 'SPACE') return [' '];
  if (normalized === 'M') return ['m', 'M'];
  if (normalized === 'N') return ['n', 'N', 'KeyN'];
  if (normalized === 'CTRL' || normalized === 'CONTROL') return ['Control'];
  if (normalized === 'Z') return ['z', 'Z', 'KeyZ'];
  if (normalized === 'X') return ['x', 'X', 'KeyX'];
  return [];
}

function aliasesForMsx2LogicalButton(
  settings: Msx2PreviewControlSettings | undefined,
  button: 'button1' | 'button2',
): string[] {
  if (!settings) return [];
  const key = button === 'button1' ? settings.keyboardButton1 : settings.keyboardButton2;
  return aliasesForMsx2KeyboardButton(key);
}

export function isMsx2PlayerControlPressed(
  pressedKeys: ReadonlySet<string>,
  control: Msx2PlayerControlId,
  settings?: Msx2PreviewControlSettings,
): boolean {
  if (control === 'right') {
    return pressedKeys.has('ArrowRight') || pressedKeys.has('d') || pressedKeys.has('D');
  }
  if (control === 'left') {
    return pressedKeys.has('ArrowLeft') || pressedKeys.has('a') || pressedKeys.has('A');
  }
  if (control === 'up') {
    return pressedKeys.has('ArrowUp') || pressedKeys.has('w') || pressedKeys.has('W');
  }
  if (control === 'down') {
    return pressedKeys.has('ArrowDown') || pressedKeys.has('s') || pressedKeys.has('S');
  }
  if (control === 'jump') {
    const logicalButton = settings?.jumpActionButton === 'button2' ? 'button2' : 'button1';
    const logicalAliases = aliasesForMsx2LogicalButton(settings, logicalButton);
    const fallbackAliases = MSX2_JUMP_KEY_ALIASES.jump;
    return [...logicalAliases, ...fallbackAliases].some((key) => pressedKeys.has(key));
  }
  if (control === 'attack') {
    const logicalButton = settings?.actionButton === 'button1' ? 'button1' : 'button2';
    const logicalAliases = aliasesForMsx2LogicalButton(settings, logicalButton);
    const fallbackAliases = MSX2_DASH_KEY_ALIASES.attack;
    return [...logicalAliases, ...fallbackAliases].some((key) => pressedKeys.has(key));
  }
  return false;
}

export function isMsx2DashKeyPressed(
  pressedKeys: ReadonlySet<string>,
  primaryControl: Msx2PlayerControlId,
  secondaryControl: Msx2PlayerControlId | 'none' = 'none',
  settings?: Msx2PreviewControlSettings,
): boolean {
  if (settings) {
    if (!isMsx2PlayerControlPressed(pressedKeys, primaryControl, settings)) return false;
    if (secondaryControl === 'none') return true;
    return isMsx2PlayerControlPressed(pressedKeys, secondaryControl, settings);
  }
  const primaryAliases = MSX2_DASH_KEY_ALIASES[primaryControl]
    || MSX2_JUMP_KEY_ALIASES[primaryControl]
    || MSX2_DASH_KEY_ALIASES.attack;
  const primaryDown = primaryAliases.some((key) => pressedKeys.has(key));
  if (!primaryDown) return false;
  if (secondaryControl === 'none') return true;
  const secondaryAliases = MSX2_DASH_KEY_ALIASES[secondaryControl]
    || MSX2_JUMP_KEY_ALIASES[secondaryControl]
    || [];
  return secondaryAliases.some((key) => pressedKeys.has(key));
}

export function isMsx2JumpKeyPressed(
  pressedKeys: ReadonlySet<string>,
  inputMapping?: { jump?: string },
): boolean {
  if (pressedKeys.has(' ')) return true;
  const jump = String(inputMapping?.jump || 'spc').trim().toLowerCase();
  const aliases = MSX2_JUMP_KEY_ALIASES[jump] || MSX2_JUMP_KEY_ALIASES.spc;
  return aliases.some((key) => pressedKeys.has(key));
}

export function applyMsx2JumpImpulseToEntity(entity: {
  gravityVel: number;
  vy: number;
}, impulse88: number): void {
  entity.gravityVel = impulse88 & 0xffff;
  const hi = (entity.gravityVel >> 8) & 0xff;
  entity.vy = hi >= 0x80 ? hi - 0x100 : hi;
}

export function scaleMsx2JumpImpulse88(impulse88: number, scale: number): number {
  const word = impulse88 & 0xffff;
  const signed = word >= 0x8000 ? word - 0x10000 : word;
  const scaled = Math.round(signed * scale);
  return scaled & 0xffff;
}

function resolveMsx2SkillBinding(
  player: any | undefined,
  skillId: string,
): {
  primary: Msx2PlayerControlId;
  secondary: Msx2PlayerControlId | 'none';
} {
  const binding = player?.skillBindings?.[skillId];
  if (binding?.primary) {
    return {
      primary: binding.primary as Msx2PlayerControlId,
      secondary: (binding.secondary ?? 'none') as Msx2PlayerControlId | 'none',
    };
  }
  const def = getSkill(skillId);
  const icons = def?.controlIcon
    ? (Array.isArray(def.controlIcon) ? def.controlIcon : [def.controlIcon])
    : ['attack'];
  return {
    primary: (icons[0] || 'attack') as Msx2PlayerControlId,
    secondary: (icons[1] ?? 'none') as Msx2PlayerControlId | 'none',
  };
}

function resolveDashSkillBinding(player: any | undefined): {
  primary: Msx2PlayerControlId;
  secondary: Msx2PlayerControlId | 'none';
} {
  return resolveMsx2SkillBinding(player, 'dash');
}

function resolveTeleportABSkillBinding(player: any | undefined): {
  primary: Msx2PlayerControlId;
  secondary: Msx2PlayerControlId | 'none';
} {
  return resolveMsx2SkillBinding(player, 'teleport_a_b');
}

function resolveWallJumpSkillBinding(player: any | undefined): {
  primary: Msx2PlayerControlId;
  secondary: Msx2PlayerControlId | 'none';
} {
  return resolveMsx2SkillBinding(player, 'wall_jump');
}

export function isMsx2TeleportKeyPressed(
  pressedKeys: ReadonlySet<string>,
  primaryControl: Msx2PlayerControlId,
  secondaryControl: Msx2PlayerControlId | 'none' = 'none',
): boolean {
  return isMsx2DashKeyPressed(pressedKeys, primaryControl, secondaryControl);
}

export function getMsx2GlideConfigFromPlayerEntity(player: any | undefined): Msx2GlideConfig {
  const activeSkills = readPlayerActiveSkills(player);
  const enabled = activeSkills.includes('glide');
  const params = (player?.skillParameters?.glide || {}) as Record<string, number | boolean>;
  return {
    enabled,
    glideSpeed: Math.max(0, Math.min(4, Math.floor(Number(params.glideSpeed ?? 1) || 1))),
    glideHorizontalSpeed: Math.max(0, Math.min(6, Math.floor(Number(params.glideHorizontalSpeed ?? 2) || 2))),
    glideBoostCost: Math.max(0, Math.min(20, Math.floor(Number(params.glideBoostCost ?? 5) || 5))),
  };
}

export function getMsx2TeleportABConfigFromPlayerEntity(player: any | undefined): Msx2TeleportABConfig {
  const activeSkills = readPlayerActiveSkills(player);
  const enabled = activeSkills.includes('teleport_a_b');
  const params = (player?.skillParameters?.teleport_a_b || {}) as Record<string, number | boolean>;
  const binding = resolveTeleportABSkillBinding(player);
  return {
    enabled,
    teleportCooldown: Math.max(10, Math.min(180, Math.floor(Number(params.teleportCooldown ?? 60) || 60))),
    teleportDelay: Math.max(5, Math.min(60, Math.floor(Number(params.teleportDelay ?? 15) || 15))),
    savePointA: params.savePointA !== false,
    useHorizontal: params.useHorizontal !== false,
    useVertical: params.useVertical !== false,
    maxDistance: Math.max(1, Math.min(50, Math.floor(Number(params.maxDistance ?? 10) || 10))),
    primaryControl: binding.primary,
    secondaryControl: binding.secondary,
  };
}

export function getMsx2DashConfigFromPlayerEntity(player: any | undefined): Msx2DashConfig {
  const activeSkills = readPlayerActiveSkills(player);
  const enabled = activeSkills.includes('dash');
  const params = (player?.skillParameters?.dash || {}) as Record<string, number | boolean>;
  const binding = resolveDashSkillBinding(player);
  const dashSpeed = pickSkillNumberParam(params, 'dash', ['dashSpeed'], 8);
  const dashDuration = pickSkillNumberParam(params, 'dash', ['dashDuration', 'dashDurationFrames'], 8);
  const dashCooldown = pickSkillNumberParam(params, 'dash', ['dashCooldown', 'dashCooldownFrames'], 30);
  return {
    enabled,
    dashSpeed: Math.max(1, Math.min(24, dashSpeed || 8)),
    dashDuration: Math.max(1, Math.min(30, dashDuration || 8)),
    dashCooldown: Math.max(0, Math.min(120, dashCooldown || 30)),
    requireKeyRelease: params.requireKeyRelease !== false,
    directional: params.directional !== false,
    invulnerable: params.invulnerable !== false,
    primaryControl: binding.primary,
    secondaryControl: binding.secondary,
  };
}

/**
 * Returns the resolved wall_jump skill config for the given player.
 *
 * Reads `player.skillParameters.wall_jump` and clamps every numeric field to
 * the range declared in `wallJumpParameters` (handlers/index.ts). The
 * `wallJumpPower88` is sign-extended negative to align with `clampMsx2JumpImpulse88`
 * (vertical impulse convention: -y = up).
 */
export function getMsx2WallJumpConfigFromPlayerEntity(player: any | undefined): Msx2WallJumpConfig {
  const activeSkills = readPlayerActiveSkills(player);
  const enabled = activeSkills.includes('wall_jump');
  const params = (player?.skillParameters?.wall_jump || {}) as Record<string, number | boolean>;
  const binding = resolveWallJumpSkillBinding(player);
  const wallJumpPower = pickSkillNumberParam(params, 'wall_jump', ['wallJumpPower'], 1024);
  const wallJumpHorizontal = pickSkillNumberParam(params, 'wall_jump', ['wallJumpHorizontal'], 4);
  const wallSlideSpeed = pickSkillNumberParam(params, 'wall_jump', ['wallSlideSpeed'], 1);
  return {
    enabled,
    wallJumpPower88: clampMsx2JumpImpulse88(wallJumpPower),
    wallJumpHorizontal: Math.max(1, Math.min(12, wallJumpHorizontal || 4)),
    wallSlideSpeed: Math.max(0, Math.min(4, wallSlideSpeed || 1)),
    requireKeyRelease: params.requireKeyRelease !== false,
    primaryControl: binding.primary,
  };
}

function resolveDoubleJumpMaxJumps(
  doubleJumpParams: Record<string, number | boolean> | undefined,
): number {
  return Math.max(1, Math.min(4, Math.floor(Number(doubleJumpParams?.maxJumps ?? 2) || 2)));
}

export function getMsx2PlatformPhysicsFromPlayerEntity(player: any | undefined): Msx2PlatformPhysicsConfig {
  const jump = player?.components?.msx2_jump;
  const gravity = player?.components?.msx2_gravity;
  const control = player?.components?.msx2_player_control || {};
  const params = player?.params || {};
  const movement = player?.movement || {};
  // New declarative source: skillParameters.jump from Player Config Abilities & Items dialog.
  // Wins when present (per AI Charter 2026-06-08: Player Config is the human-facing source of truth).
  const skillJump = player?.skillParameters?.jump;

  const hasSkillJump = skillJump && typeof skillJump === 'object';

  const jumpEnabled = hasSkillJump
    ? skillJump.enabled !== false && skillJump.enabled !== 'false'
    : isMsx2ComponentEnabled(jump)
      || (jump === undefined && (control.jump === true || control.jump === 'true' || params.jump === true));
  const gravityEnabled = isMsx2ComponentEnabled(gravity)
    || (gravity === undefined && (control.gravity === true || control.gravity === 'true' || params.gravity === true));

  // Skill wins when present. For legacy projects (no skillParameters.jump), use movement.*
  // for physics values (jumpPower, gravity, maxFallSpeed) as these were the intended pixel values.
  // Do NOT use movement.coyoteTime/movement.jumpBuffer for legacy projects - those were never
  // used by the ASM runtime and would introduce new untested code paths.
  const hasMovementPhysics = !hasSkillJump && (
    movement.jumpPower !== undefined
    || movement.gravity !== undefined
    || movement.maxFallSpeed !== undefined
  );

  let jumpPower: unknown;
  let gravityStrength: unknown;
  let terminalVelocity: unknown;
  if (hasSkillJump && skillJump.jumpPower !== undefined) {
    jumpPower = skillJump.jumpPower;
  } else if (hasMovementPhysics) {
    jumpPower = movement.jumpPower ?? movement.jumpImpulse;
    gravityStrength = movement.gravity;
    terminalVelocity = movement.maxFallSpeed;
  } else {
    jumpPower = jump?.jumpPower ?? jump?.jumpImpulse
      ?? control.jumpPower ?? control.jumpImpulse
      ?? params.jumpPower ?? params.jumpImpulse;
    gravityStrength = gravity?.strength ?? gravity?.gravityStrength
      ?? control.gravityStrength ?? params.gravityStrength;
    terminalVelocity = gravity?.terminalVelocity
      ?? control.terminalVelocity ?? params.terminalVelocity;
  }

  const activeSkills = readPlayerActiveSkills(player);
  const doubleJumpEnabled = activeSkills.includes('double_jump');
  const doubleJumpParams = player?.skillParameters?.double_jump as Record<string, number | boolean> | undefined;
  const maxJumps = doubleJumpEnabled
    ? resolveDoubleJumpMaxJumps(doubleJumpParams)
    : Math.max(1, Math.min(4, Math.floor(Number(
      jump?.maxJumps ?? params.maxJumps ?? 1
    ) || 1)));
  const requireKeyRelease = doubleJumpEnabled
    ? doubleJumpParams?.requireKeyRelease !== false
    : hasSkillJump
      ? (skillJump.requireKeyRelease !== false && skillJump.requireKeyRelease !== 'false')
      : (jump?.requireKeyRelease !== false
        && jump?.requireKeyRelease !== 'false'
        && control.requireKeyRelease !== false
        && control.requireKeyRelease !== 'false');

  // Coyote / jumpBuffer: ONLY enabled when explicitly configured via skillParameters.jump.
  // Legacy projects may have movement.coyoteTime/movement.jumpBuffer in JSON but they were
  // NEVER used by the ASM runtime. Reading them would introduce new untested code paths
  // (coyote/jump buffer logic) breaking backward compatibility.
  // See ai/LESSONS_LEARNED.md: "Bug Resuelto: cambio en ASM runtime MSX sin smoke automatizable"
  const coyoteTime = hasSkillJump
    ? clampMsx2CoyoteFrames(skillJump.coyoteTime)
    : 0;
  const jumpBuffer = hasSkillJump
    ? clampMsx2JumpBufferFrames(skillJump.jumpBuffer)
    : 0;

  const jumpImpulse88 = hasSkillJump
    ? resolveMsx2JumpImpulse88(jumpPower)
    : hasMovementPhysics
      ? resolveMsx2JumpImpulse88Px(jumpPower)
      : resolveMsx2JumpImpulse88(jumpPower);
  const airJumpImpulse88 = doubleJumpEnabled
    ? scaleMsx2JumpImpulse88(jumpImpulse88, MSX2_DOUBLE_JUMP_IMPULSE_SCALE)
    : jumpImpulse88;

  return {
    jumpEnabled,
    gravityEnabled,
    jumpImpulse88,
    airJumpImpulse88,
    gravityStrength88: hasMovementPhysics
      ? clampMsx2GravityStrength88Px(gravityStrength)
      : clampMsx2GravityStrength88(gravityStrength),
    terminalVelocity88: hasMovementPhysics
      ? clampMsx2TerminalVelocity88Px(terminalVelocity)
      : clampMsx2TerminalVelocity88(terminalVelocity),
    maxJumps,
    doubleJumpEnabled,
    requireKeyRelease,
    coyoteTime,
    jumpBuffer,
  };
}

export function getMsx2PlatformPhysicsFromScreen(
  screen: Msx2Screen4TileScreen | undefined,
  player: any | undefined
): Msx2PlatformPhysicsConfig {
  const base = getMsx2PlatformPhysicsFromPlayerEntity(player);
  const runtime = screen?.runtime as unknown as Record<string, unknown> | undefined;
  if (!runtime) return base;
  return {
    ...base,
    jumpImpulse88: runtime.jumpImpulse !== undefined || runtime.jumpPower !== undefined
      ? resolveMsx2JumpImpulse88(runtime.jumpImpulse ?? runtime.jumpPower)
      : base.jumpImpulse88,
    gravityStrength88: runtime.gravityStrength !== undefined
      ? clampMsx2GravityStrength88(runtime.gravityStrength)
      : base.gravityStrength88,
    terminalVelocity88: runtime.terminalVelocity !== undefined
      ? clampMsx2TerminalVelocity88(runtime.terminalVelocity)
      : base.terminalVelocity88,
  };
}

export function getMsx2PlatformPhysicsFromAnalysis(analysis: ProjectAnalysis): Msx2PlatformPhysicsConfig {
  const screen = analysis.msx2Screens?.find(item =>
    item.layers?.entities?.some(entity => entity.kind === 'player')
    || (Array.isArray(item.playerEntries) && item.playerEntries.length > 0)
  )
    || analysis.msx2Screens?.[0];
  const player = screen?.layers?.entities?.find(entity => entity.kind === 'player')
    || (
      Array.isArray(screen?.playerEntries) && screen.playerEntries.length > 0
        ? {
          kind: 'player',
          components: {
            msx2_player_control: {
              jump: String(screen?.runtime?.movementMode || screen?.runtime?.screenEngine || 'platform').replace(/[\s_-]+/g, '').toLowerCase() === 'platform',
              gravity: String(screen?.runtime?.movementMode || screen?.runtime?.screenEngine || 'platform').replace(/[\s_-]+/g, '').toLowerCase() === 'platform',
              jumpPower: screen?.runtime?.jumpPower ?? screen?.runtime?.jumpImpulse,
              gravityStrength: screen?.runtime?.gravityStrength,
              terminalVelocity: screen?.runtime?.terminalVelocity,
            },
          },
        }
        : undefined
    );
  return getMsx2PlatformPhysicsFromScreen(screen, player);
}

export function playerHasMsx2JumpComponent(player: any | undefined): boolean {
  return getMsx2PlatformPhysicsFromPlayerEntity(player).jumpEnabled;
}

export function playerHasMsx2GravityComponent(player: any | undefined): boolean {
  return getMsx2PlatformPhysicsFromPlayerEntity(player).gravityEnabled;
}

export function formatAsmWord(value: number): string {
  const word = value & 0xffff;
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function formatAsmByte(value: number): string {
  const byte = value & 0xff;
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

/** High byte of the 8.8 terminal cap used in the MSX1 gravity routine. */
export function getTerminalVelocityHighByte(terminalVelocity88: number): number {
  return (clampMsx2TerminalVelocity88(terminalVelocity88) >> 8) & 0xff;
}

import { ProjectAnalysis } from './asmTemplateGenerator';
import { Msx2Screen4TileScreen } from '../types';

/** MSX1 ROM default: #FC00 (-1024 in 8.8 fixed-point, ~-4 px/frame initial rise). */
export const MSX2_DEFAULT_JUMP_IMPULSE_88 = 0xfc00;

/** MSX1 ROM default gravity acceleration per frame (#40 on the low byte). */
export const MSX2_DEFAULT_GRAVITY_STRENGTH_88 = 0x0040;

/** MSX1 ROM terminal fall speed cap (#0400 in 8.8). */
export const MSX2_DEFAULT_TERMINAL_VELOCITY_88 = 0x0400;

export interface Msx2PlatformPhysicsConfig {
  jumpEnabled: boolean;
  gravityEnabled: boolean;
  jumpImpulse88: number;
  gravityStrength88: number;
  terminalVelocity88: number;
  maxJumps: number;
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

  // Skill wins when present, else fall back to movement.* (px), else components/control/params (8.8).
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
  } else {
    jumpPower = jump?.jumpPower ?? jump?.jumpImpulse
      ?? control.jumpPower ?? control.jumpImpulse
      ?? params.jumpPower ?? params.jumpImpulse;
  }
  gravityStrength = gravity?.strength ?? gravity?.gravityStrength
    ?? control.gravityStrength ?? params.gravityStrength;
  terminalVelocity = gravity?.terminalVelocity
    ?? control.terminalVelocity ?? params.terminalVelocity;

  const maxJumps = Math.max(1, Math.min(4, Math.floor(Number(
    jump?.maxJumps ?? params.maxJumps ?? 1
  ) || 1)));
  const requireKeyRelease = hasSkillJump
    ? (skillJump.requireKeyRelease !== false && skillJump.requireKeyRelease !== 'false')
    : (jump?.requireKeyRelease !== false
      && jump?.requireKeyRelease !== 'false'
      && control.requireKeyRelease !== false
      && control.requireKeyRelease !== 'false');

  // Coyote / jumpBuffer: skill wins, else read legacy movement.* (which had the same fields declared
  // but unused by the runtime), else 0.
  const coyoteTime = clampMsx2CoyoteFrames(
    hasSkillJump ? skillJump.coyoteTime : movement.coyoteTime,
  );
  const jumpBuffer = clampMsx2JumpBufferFrames(
    hasSkillJump ? skillJump.jumpBuffer : movement.jumpBuffer,
  );

  return {
    jumpEnabled,
    gravityEnabled,
    jumpImpulse88: hasSkillJump
      ? resolveMsx2JumpImpulse88(jumpPower)
      : hasMovementPhysics
        ? resolveMsx2JumpImpulse88Px(jumpPower)
        : resolveMsx2JumpImpulse88(jumpPower),
    gravityStrength88: hasMovementPhysics
      ? clampMsx2GravityStrength88Px(gravityStrength)
      : clampMsx2GravityStrength88(gravityStrength),
    terminalVelocity88: hasMovementPhysics
      ? clampMsx2TerminalVelocity88Px(terminalVelocity)
      : clampMsx2TerminalVelocity88(terminalVelocity),
    maxJumps,
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

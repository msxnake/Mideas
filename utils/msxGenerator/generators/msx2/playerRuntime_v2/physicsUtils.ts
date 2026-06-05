import { Msx2PlatformPhysicsConfig } from '../../../../msx2PlatformPhysics';

export const V2_DEFAULT_JUMP_IMPULSE_88 = 0xFC00;
export const V2_DEFAULT_GRAVITY_STRENGTH_88 = 0x0040;
export const V2_DEFAULT_TERMINAL_VELOCITY_88 = 0x0400;

/**
 * Resuelve la configuracion de fisica del player SOLO desde player.movement.*
 * Sin fallback a componentes legacy (msx2_jump, msx2_gravity, etc.)
 */
export function resolvePhysicsConfig(playerEntity: any): Msx2PlatformPhysicsConfig {
  const movement = playerEntity?.movement || {};

  const hasJumpPower = movement.jumpPower !== undefined;
  const hasGravity = movement.gravity !== undefined;
  const hasMaxFallSpeed = movement.maxFallSpeed !== undefined;

  const jumpEnabled = hasJumpPower;
  const gravityEnabled = hasGravity || hasMaxFallSpeed;

  const jumpImpulse88 = hasJumpPower
    ? resolveJumpImpulsePx(movement.jumpPower)
    : V2_DEFAULT_JUMP_IMPULSE_88;

  const gravityStrength88 = hasGravity
    ? Math.max(16, Math.min(128, Math.floor(Math.abs(Number(movement.gravity)) * 256)))
    : V2_DEFAULT_GRAVITY_STRENGTH_88;

  const terminalVelocity88 = hasMaxFallSpeed
    ? Math.max(256, Math.min(2048, Math.floor(Math.abs(Number(movement.maxFallSpeed)) * 256)))
    : V2_DEFAULT_TERMINAL_VELOCITY_88;

  return {
    jumpEnabled,
    gravityEnabled,
    jumpImpulse88,
    gravityStrength88,
    terminalVelocity88,
    maxJumps: Math.max(1, Math.min(4, Number(movement.maxJumps) || 1)),
    requireKeyRelease: movement.requireKeyRelease !== false,
  } as Msx2PlatformPhysicsConfig;
}

function resolveJumpImpulsePx(jumpPower: unknown): number {
  const value = Math.floor(Math.abs(Number(jumpPower) || 0) * 256);
  const clamped = Math.max(256, Math.min(2048, value));
  return (0x10000 - clamped) & 0xFFFF;
}

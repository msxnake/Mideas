import { MSX2_BOX2_RUNTIME_BYTES } from './msx2Box2ComponentGenerator';
import { MSX2_DASH_RAM_BYTES } from './msx2DashGenerator';
import { MSX2_TELEPORT_AB_RAM_BYTES } from './msx2TeleportABGenerator';

const MSX2_SNAKE_BODY_BASE = 0xC047;
const MSX2_SKILL_RAM_BASE_NO_PUSHBOX = 0xC049;

/**
 * First byte after the snake-body cache window (#C047 + 32 cells * 2 bytes):
 * msx2_effects_runtime_buffers starts here. The whole player-timer + skill
 * extension chain MUST stay below this address.
 */
export const MSX2_SKILL_RAM_LIMIT = 0xC087;

/** msx2_player_coyote_timer (1) + msx2_player_jump_buffer_timer (1). */
export const MSX2_PLAYER_TIMER_RAM_BYTES = 2;

export interface Msx2SkillRamOptions {
  pushBoxMovement: boolean;
  dashEnabled: boolean;
  teleportEnabled: boolean;
}

/**
 * Base address for the player coyote/jump-buffer timers.
 *
 * With pushBox the box2 runtime owns #C047..#C047+MSX2_BOX2_RUNTIME_BYTES-1
 * (it reuses the snake-body cache window), so the timers go right after it.
 * Without pushBox they start at #C049, leaving #C047/#C048 untouched because
 * snake-body cells may live there in snake projects.
 *
 * NOTE: never hardcode these addresses in generators. A previous bug
 * (LESSONS_LEARNED 2026-06-08 + this fix) placed the timers at #C047/#C048,
 * which IS msx2_box2_count/msx2_box2_try_dx in pushBox projects: arming the
 * coyote timer created phantom boxes and the per-frame decrement deleted
 * real ones.
 */
export function resolveMsx2PlayerTimersRamBase(pushBoxMovement: boolean): number {
  return pushBoxMovement
    ? MSX2_SNAKE_BODY_BASE + MSX2_BOX2_RUNTIME_BYTES
    : MSX2_SKILL_RAM_BASE_NO_PUSHBOX;
}

/**
 * Base address for the next skill extension block. Layout (in order):
 * timers (always reserved, 2 bytes) -> dash (4) -> teleport (8) -> glide (2).
 * Each skill resolves its own base by passing the skills that precede it.
 */
export function resolveMsx2SkillExtensionRamBase(options: Msx2SkillRamOptions): number {
  let base = resolveMsx2PlayerTimersRamBase(options.pushBoxMovement) + MSX2_PLAYER_TIMER_RAM_BYTES;
  if (options.dashEnabled) base += MSX2_DASH_RAM_BYTES;
  if (options.teleportEnabled) base += MSX2_TELEPORT_AB_RAM_BYTES;
  return base;
}

export function buildMsx2SkillRamOptions(
  pushBoxMovement: boolean,
  dashEnabled: boolean,
  teleportEnabled: boolean,
): Msx2SkillRamOptions {
  return { pushBoxMovement, dashEnabled, teleportEnabled };
}

/**
 * Generation-time guard: throws if the skill RAM chain would overlap
 * msx2_effects_runtime_buffers (#C087). Failing the build is better than
 * emitting a ROM with silent RAM corruption.
 */
export function assertMsx2SkillRamWithinLimit(endExclusive: number, context: string): void {
  if (endExclusive > MSX2_SKILL_RAM_LIMIT) {
    throw new Error(
      `MSX2 skill RAM overflow: ${context} ends at #${endExclusive.toString(16).toUpperCase()} `
      + `but the limit is #${MSX2_SKILL_RAM_LIMIT.toString(16).toUpperCase()} `
      + '(msx2_effects_runtime_buffers). Reduce enabled skills or move the region.',
    );
  }
}

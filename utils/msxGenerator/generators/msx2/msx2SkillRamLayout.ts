import { MSX2_BOX2_RUNTIME_BYTES } from './msx2Box2ComponentGenerator';
import { MSX2_DASH_RAM_BYTES } from './msx2DashGenerator';
import { MSX2_TELEPORT_AB_RAM_BYTES } from './msx2TeleportABGenerator';
import { MSX2_GLIDE_RAM_BYTES } from './msx2GlideGenerator';
import { MSX2_WALL_JUMP_RAM_BYTES } from './msx2WallJumpGenerator';

const MSX2_SNAKE_BODY_BASE = 0xC047;
const MSX2_SKILL_RAM_BASE_NO_PUSHBOX = 0xC049;

/**
 * First byte reserved for the player-timer + skill extension chain.
 *
 * The chain is `timers (2) -> dash (4) -> teleport (8) -> glide (2) -> wall_jump (4)`,
 * with the worst-case end (pushBox + all skills) at #C08B. After that byte
 * `msx2_effects_runtime_buffers` starts (anchored to `max(0xC200, ...)` so the
 * 4 bytes we added for wall_jump are invisible to the runtime RAM budget — see
 * `estimateMsx2RuntimeRamEnd` in msx2Screen4Generator.ts).
 *
 * The +1 byte between #C08B and #C08C is a defensive gap so a future skill
 * addition does not immediately overlap the runtime buffers.
 *
 * History: 0xC087 was the original limit (snake-body end). Moved to 0xC08C
 * in 2026-06-10 to make room for the wall_jump skill (4 bytes) plus 1 byte
 * of defensive padding. Bumping further (e.g. for new skills) is safe as
 * long as it stays below 0xC200.
 */
export const MSX2_SKILL_RAM_LIMIT = 0xC08C;

/** msx2_player_coyote_timer (1) + msx2_player_jump_buffer_timer (1). */
export const MSX2_PLAYER_TIMER_RAM_BYTES = 2;

export interface Msx2SkillRamOptions {
  pushBoxMovement: boolean;
  dashEnabled: boolean;
  teleportEnabled: boolean;
  glideEnabled: boolean;
  wallJumpEnabled: boolean;
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
 * timers (always reserved, 2 bytes) -> dash (4) -> teleport (8) -> glide (2) -> wall_jump (4).
 * Each skill resolves its own base by passing the skills that precede it.
 *
 * NOTE: the chain is `options` driven so the layout module owns the ordering.
 * Individual skill generators (e.g. `msx2WallJumpGenerator`) read back the
 * base via the layout module — they MUST NOT hardcode addresses (see
 * LESSONS_LEARNED 2026-06-08 + 2026-06-10 for RAM-collision bugs).
 */
export function resolveMsx2SkillExtensionRamBase(options: Msx2SkillRamOptions): number {
  let base = resolveMsx2PlayerTimersRamBase(options.pushBoxMovement) + MSX2_PLAYER_TIMER_RAM_BYTES;
  if (options.dashEnabled) base += MSX2_DASH_RAM_BYTES;
  if (options.teleportEnabled) base += MSX2_TELEPORT_AB_RAM_BYTES;
  if (options.glideEnabled) base += MSX2_GLIDE_RAM_BYTES;
  if (options.wallJumpEnabled) base += MSX2_WALL_JUMP_RAM_BYTES;
  return base;
}

export function buildMsx2SkillRamOptions(
  pushBoxMovement: boolean,
  dashEnabled: boolean,
  teleportEnabled: boolean,
  glideEnabled: boolean,
  wallJumpEnabled: boolean,
): Msx2SkillRamOptions {
  return { pushBoxMovement, dashEnabled, teleportEnabled, glideEnabled, wallJumpEnabled };
}

/**
 * Generation-time guard: throws if the skill RAM chain would overlap
 * msx2_effects_runtime_buffers (starts at #MSX2_SKILL_RAM_LIMIT). Failing the
 * build is better than emitting a ROM with silent RAM corruption.
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

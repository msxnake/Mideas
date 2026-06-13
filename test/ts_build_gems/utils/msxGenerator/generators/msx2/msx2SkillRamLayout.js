"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_PLAYER_TIMER_RAM_BYTES = exports.MSX2_SKILL_RAM_LIMIT = void 0;
exports.resolveMsx2PlayerTimersRamBase = resolveMsx2PlayerTimersRamBase;
exports.resolveMsx2SkillExtensionRamBase = resolveMsx2SkillExtensionRamBase;
exports.buildMsx2SkillRamOptions = buildMsx2SkillRamOptions;
exports.assertMsx2SkillRamWithinLimit = assertMsx2SkillRamWithinLimit;
const msx2Box2ComponentGenerator_1 = require("./msx2Box2ComponentGenerator");
const msx2DashGenerator_1 = require("./msx2DashGenerator");
const msx2TeleportABGenerator_1 = require("./msx2TeleportABGenerator");
const msx2GlideGenerator_1 = require("./msx2GlideGenerator");
const msx2WallJumpGenerator_1 = require("./msx2WallJumpGenerator");
const msx2PowerStompGenerator_1 = require("./msx2PowerStompGenerator");
const msx2ScreenShakeGenerator_1 = require("./msx2ScreenShakeGenerator");
const msx2AirDashGenerator_1 = require("./msx2AirDashGenerator");
const msx2CarryObjectGenerator_1 = require("./msx2CarryObjectGenerator");
const MSX2_SNAKE_BODY_BASE = 0xC047;
const MSX2_SKILL_RAM_BASE_NO_PUSHBOX = 0xC049;
/**
 * First byte reserved for the player-timer + skill extension chain.
 *
 * The chain is `timers (2) -> dash (4) -> teleport (8) -> glide (2) -> wall_jump (4)`,
 * then `power_stomp (2) -> screen_shake (1) -> air_dash (4)`. After that byte
 * `msx2_effects_runtime_buffers` starts (anchored to `max(0xC200, ...)` so the
 * 4 bytes we added for wall_jump are invisible to the runtime RAM budget — see
 * `estimateMsx2RuntimeRamEnd` in msx2Screen4Generator.ts).
 *
 * The +1 byte between #C08B and #C08C is a defensive gap so a future skill
 * addition does not immediately overlap the runtime buffers.
 *
 * History: 0xC087 was the original limit (snake-body end). Moved to 0xC08C
 * in 2026-06-10 to make room for the wall_jump skill (4 bytes) plus 1 byte
 * of defensive padding. Moved to 0xC094 in 2026-06-11 to make room for the
 * power_stomp skill (2 bytes) and the reusable screen-shake module (1 byte),
 * plus defensive padding. Moved to 0xC098 in 2026-06-11 to add the distinct
 * air_dash skill (4 bytes). Moved to 0xC0A8 in 2026-06-12 to add the
 * carry_object skill (14 bytes) plus padding. Bumping further is safe as
 * long as it stays below 0xC200.
 */
exports.MSX2_SKILL_RAM_LIMIT = 0xC0A8;
/** msx2_player_coyote_timer (1) + msx2_player_jump_buffer_timer (1). */
exports.MSX2_PLAYER_TIMER_RAM_BYTES = 2;
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
function resolveMsx2PlayerTimersRamBase(pushBoxMovement) {
    return pushBoxMovement
        ? MSX2_SNAKE_BODY_BASE + msx2Box2ComponentGenerator_1.MSX2_BOX2_RUNTIME_BYTES
        : MSX2_SKILL_RAM_BASE_NO_PUSHBOX;
}
/**
 * Base address for the next skill extension block. Layout (in order):
 * timers (always reserved, 2 bytes) -> dash (4) -> teleport (8) ->
 * glide (2) -> wall_jump (4) -> power_stomp (2) -> screen_shake (1) ->
 * air_dash (4) -> carry_object (14).
 * Each skill resolves its own base by passing the skills that precede it.
 *
 * NOTE: the chain is `options` driven so the layout module owns the ordering.
 * Individual skill generators (e.g. `msx2WallJumpGenerator`) read back the
 * base via the layout module — they MUST NOT hardcode addresses (see
 * LESSONS_LEARNED 2026-06-08 + 2026-06-10 for RAM-collision bugs).
 */
function resolveMsx2SkillExtensionRamBase(options) {
    let base = resolveMsx2PlayerTimersRamBase(options.pushBoxMovement) + exports.MSX2_PLAYER_TIMER_RAM_BYTES;
    if (options.dashEnabled)
        base += msx2DashGenerator_1.MSX2_DASH_RAM_BYTES;
    if (options.teleportEnabled)
        base += msx2TeleportABGenerator_1.MSX2_TELEPORT_AB_RAM_BYTES;
    if (options.glideEnabled)
        base += msx2GlideGenerator_1.MSX2_GLIDE_RAM_BYTES;
    if (options.wallJumpEnabled)
        base += msx2WallJumpGenerator_1.MSX2_WALL_JUMP_RAM_BYTES;
    if (options.powerStompEnabled)
        base += msx2PowerStompGenerator_1.MSX2_POWER_STOMP_RAM_BYTES;
    if (options.screenShakeEnabled)
        base += msx2ScreenShakeGenerator_1.MSX2_SCREEN_SHAKE_RAM_BYTES;
    if (options.airDashEnabled)
        base += msx2AirDashGenerator_1.MSX2_AIR_DASH_RAM_BYTES;
    if (options.carryObjectEnabled)
        base += msx2CarryObjectGenerator_1.MSX2_CARRY_OBJECT_RAM_BYTES;
    return base;
}
function buildMsx2SkillRamOptions(pushBoxMovement, dashEnabled, teleportEnabled, glideEnabled, wallJumpEnabled, powerStompEnabled = false, screenShakeEnabled = false, airDashEnabled = false, carryObjectEnabled = false) {
    return {
        pushBoxMovement,
        dashEnabled,
        teleportEnabled,
        glideEnabled,
        wallJumpEnabled,
        powerStompEnabled,
        screenShakeEnabled,
        airDashEnabled,
        carryObjectEnabled,
    };
}
/**
 * Generation-time guard: throws if the skill RAM chain would overlap
 * msx2_effects_runtime_buffers (starts at #MSX2_SKILL_RAM_LIMIT). Failing the
 * build is better than emitting a ROM with silent RAM corruption.
 */
function assertMsx2SkillRamWithinLimit(endExclusive, context) {
    if (endExclusive > exports.MSX2_SKILL_RAM_LIMIT) {
        throw new Error(`MSX2 skill RAM overflow: ${context} ends at #${endExclusive.toString(16).toUpperCase()} `
            + `but the limit is #${exports.MSX2_SKILL_RAM_LIMIT.toString(16).toUpperCase()} `
            + '(msx2_effects_runtime_buffers). Reduce enabled skills or move the region.');
    }
}

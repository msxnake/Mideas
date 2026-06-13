"use strict";
/**
 * MSX2 power_stomp skill generator (Z80 ASM).
 *
 * When the player presses DOWN+B (down + attack) while airborne, they slam
 * straight down at a fast constant speed. The skill pins the player's
 * `msx2_player_gravity_vel` high byte to `stompSpeed` (low byte 0) every active
 * frame — it does NOT move the sprite directly. The normal vertical physics
 * (`update_hardware_sprite_vertical`) integrates `gravity_vel` and performs the
 * wall/floor collision, so the stomp simply makes the fall fast and constant.
 *
 * On landing (the platform settle hook) the active flag is cleared and, when
 * `screenShake` is enabled, `msx2_screen_shake_trigger` is called to fire the
 * reusable V9938 R#18 earthquake.
 *
 * Uses 2 bytes of RAM (`msx2_stomp_active`, `msx2_stomp_cooldown`), allocated
 * after wall_jump in the skill RAM chain via `resolveMsx2SkillExtensionRamBase`.
 * Addresses are NEVER hardcoded (LESSONS_LEARNED 2026-06-08 + 2026-06-10).
 *
 * Conventions mirror msx2WallJumpGenerator / msx2DashGenerator:
 *  - every routine carries a FUNCTION/PURPOSE/INPUT/OUTPUT/DESTROYS header.
 *  - no `or a` between a SUB/CP and a `jp c/nc` that depends on its carry.
 *  - the pressed-combo check goes through buildMsx2SkillPressedRoutine.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_POWER_STOMP_RAM_BYTES = void 0;
exports.resolveMsx2PowerStompRamBase = resolveMsx2PowerStompRamBase;
exports.buildMsx2PowerStompEquates = buildMsx2PowerStompEquates;
exports.buildMsx2PowerStompRuntimeAsm = buildMsx2PowerStompRuntimeAsm;
exports.buildMsx2PowerStompInputGateAsm = buildMsx2PowerStompInputGateAsm;
exports.buildMsx2PowerStompLandHookAsm = buildMsx2PowerStompLandHookAsm;
exports.buildMsx2PowerStompInitClearAsm = buildMsx2PowerStompInitClearAsm;
const msx2SkillRamLayout_1 = require("./msx2SkillRamLayout");
const msx2SkillControlsGenerator_1 = require("./msx2SkillControlsGenerator");
/** Total bytes of RAM used by the power_stomp skill (active + cooldown). */
exports.MSX2_POWER_STOMP_RAM_BYTES = 2;
function formatAsmByte(value) {
    const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
    return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
function formatAsmWord(value) {
    const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
    return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}
function resolveMsx2PowerStompRamBase(options) {
    return (0, msx2SkillRamLayout_1.resolveMsx2SkillExtensionRamBase)(options);
}
/** EQUs for the 2 power_stomp RAM variables, anchored at `ramBase`. */
function buildMsx2PowerStompEquates(ramBase) {
    return `msx2_stomp_active EQU ${formatAsmWord(ramBase)}
msx2_stomp_cooldown EQU ${formatAsmWord(ramBase + 1)}
`;
}
function buildPowerStompPressedRoutine(config) {
    return (0, msx2SkillControlsGenerator_1.buildMsx2SkillPressedRoutine)('msx2_control_power_stomp_pressed', 'power stomp', config.primaryControl, config.secondaryControl);
}
function buildMsx2PowerStompRuntimeAsm(config, options) {
    if (!config.enabled)
        return '';
    const stompSpeed = formatAsmByte(config.stompSpeed);
    const stompCooldown = formatAsmByte(config.stompCooldown);
    const triggerShake = options.screenShakeEnabled
        ? '    call msx2_screen_shake_trigger\n'
        : '';
    return `${buildPowerStompPressedRoutine(config)}
msx2_tick_stomp_cooldown:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_tick_stomp_cooldown
    ; PURPOSE: Decrements the stomp cooldown timer when active.
    ; INPUT: none. OUTPUT: none.
    ; DESTROYS: AF. PRESERVES: BC, DE, HL.
    ; ------------------------------------------------------------
    ld a, (msx2_stomp_cooldown)
    or a
    ret z
    dec a
    ld (msx2_stomp_cooldown), a
    ret

msx2_try_start_stomp:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_try_start_stomp
    ; PURPOSE: Starts a power stomp when the player is airborne, the
    ;   cooldown is 0, no stomp is already active, and the DOWN+B combo
    ;   is held. On start: sets msx2_stomp_active=1, arms the cooldown,
    ;   and pins gravity_vel hi = stompSpeed (lo = 0) for a fast fall.
    ; INPUT: none. OUTPUT: msx2_stomp_active = 1 when a stomp started.
    ; DESTROYS: AF, BC, DE, HL.
    ; ------------------------------------------------------------
    call msx2_tick_stomp_cooldown
    ; Skip if already stomping.
    ld a, (msx2_stomp_active)
    or a
    ret nz
    ; Skip if grounded (player_flags bit 0 = grounded).
    ld a, (msx2_player_flags)
    bit 0, a
    ret nz
    ; Skip if cooldown still running.
    ld a, (msx2_stomp_cooldown)
    or a
    ret nz
    ; Skip if combo not pressed.
    call msx2_control_power_stomp_pressed
    or a
    ret z
    ; Start the stomp.
    ld a, 1
    ld (msx2_stomp_active), a
    ld a, ${stompCooldown}
    ld (msx2_stomp_cooldown), a
    ; Pin gravity_vel: hi = stompSpeed (positive = down), lo = 0.
    ld hl, msx2_player_gravity_vel
    xor a
    ld (hl), a
    inc hl
    ld a, ${stompSpeed}
    ld (hl), a
    ret

msx2_step_stomp_fall:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_step_stomp_fall
    ; PURPOSE: While a stomp is active, re-asserts gravity_vel hi =
    ;   stompSpeed (lo = 0) every frame so the fall stays fast and
    ;   constant. Does NOT move the sprite — the normal vertical physics
    ;   integrates gravity_vel and does the wall/floor collision.
    ; INPUT: msx2_stomp_active (0 = idle, 1 = stomping).
    ; OUTPUT: msx2_player_gravity_vel pinned to stompSpeed.
    ; DESTROYS: AF, HL. PRESERVES: BC, DE, IX, IY.
    ; ------------------------------------------------------------
    ld a, (msx2_stomp_active)
    or a
    ret z
    ld hl, msx2_player_gravity_vel
    xor a
    ld (hl), a
    inc hl
    ld a, ${stompSpeed}
    ld (hl), a
    ret

msx2_stomp_on_land:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_stomp_on_land
    ; PURPOSE: Called from the landing settle hook. If a stomp was active,
    ;   clears it and (when screen shake is enabled) fires the reusable
    ;   V9938 R#18 earthquake via msx2_screen_shake_trigger.
    ; INPUT: msx2_stomp_active.
    ; OUTPUT: msx2_stomp_active = 0; screen shake armed if enabled.
    ; DESTROYS: AF. PRESERVES: BC, DE, HL (msx2_screen_shake_trigger only
    ;   destroys AF).
    ; ------------------------------------------------------------
    ld a, (msx2_stomp_active)
    or a
    ret z
    xor a
    ld (msx2_stomp_active), a
    ; TODO phase 2: deal stomp damage to enemies / break breakable tiles
    ; within impactRadius here (params: stompDamage, breakableTiles).
${triggerShake}    ret
`;
}
/**
 * Input gate: try to start a stomp; while one is active, pin the fall and skip
 * the GTSTCK dispatch (so DOWN+B does not also drive ladders/move). Inserted
 * into `update_hardware_sprite_input` before the GTSTCK dispatch, after the
 * wall_jump gate.
 */
function buildMsx2PowerStompInputGateAsm(config) {
    if (!config.enabled)
        return '';
    return `    ; power_stomp: try to start, then while active pin the fall and skip move/ladder.
    call msx2_try_start_stomp
    ld a, (msx2_stomp_active)
    or a
    jp z, .power_stomp_inactive
    call msx2_step_stomp_fall
    jp update_hardware_sprite_vertical
.power_stomp_inactive:
`;
}
/**
 * Landing hook: clear the stomp + (optionally) fire the screen shake. Inserted
 * at `.platform_land_settle`, next to wallJumpLandClearAsm.
 */
function buildMsx2PowerStompLandHookAsm(config, _options) {
    if (!config.enabled)
        return '';
    return `    call msx2_stomp_on_land
`;
}
/** Reset both power_stomp RAM bytes to 0 (called from init clears / reset). */
function buildMsx2PowerStompInitClearAsm() {
    return `    xor a
    ld (msx2_stomp_active), a
    ld (msx2_stomp_cooldown), a
`;
}

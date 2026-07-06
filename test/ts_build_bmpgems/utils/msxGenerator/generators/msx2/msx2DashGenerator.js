"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_DASH_RAM_BYTES = void 0;
exports.resolveMsx2DashRamBase = resolveMsx2DashRamBase;
exports.buildMsx2DashEquates = buildMsx2DashEquates;
exports.buildMsx2DashRuntimeAsm = buildMsx2DashRuntimeAsm;
exports.buildMsx2DashInputGateAsm = buildMsx2DashInputGateAsm;
exports.buildMsx2DashActiveFrameAsm = buildMsx2DashActiveFrameAsm;
exports.buildMsx2DashDamageSkipAsm = buildMsx2DashDamageSkipAsm;
exports.buildMsx2DashHazardSkipAsm = buildMsx2DashHazardSkipAsm;
exports.buildMsx2DashInitClearAsm = buildMsx2DashInitClearAsm;
const msx2SkillRamLayout_1 = require("./msx2SkillRamLayout");
const msx2SkillControlsGenerator_1 = require("./msx2SkillControlsGenerator");
exports.MSX2_DASH_RAM_BYTES = 4;
function formatAsmByte(value) {
    const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
    return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
function formatAsmWord(value) {
    const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
    return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}
function resolveMsx2DashRamBase(pushBoxMovement) {
    return (0, msx2SkillRamLayout_1.resolveMsx2SkillExtensionRamBase)((0, msx2SkillRamLayout_1.buildMsx2SkillRamOptions)(pushBoxMovement, false, false, false, false));
}
function buildDashPressedRoutine(config) {
    return (0, msx2SkillControlsGenerator_1.buildMsx2SkillPressedRoutine)('msx2_control_dash_pressed', 'dash skill', config.primaryControl, config.secondaryControl);
}
function buildDashDirectionResolveAsm(config) {
    if (config.directional) {
        // msx2_player_sprite_dx: 0=left, 1=right — use facing directly (do not treat 0 as "unset").
        return `    ld a, (msx2_player_sprite_dx)
    ld (msx2_dash_direction), a
`;
    }
    return `    xor a
    call GTSTCK
    cp 6
    jp z, .dash_face_left
    cp 7
    jp z, .dash_face_left
    cp 8
    jp z, .dash_face_left
    cp 2
    jp z, .dash_face_right
    cp 3
    jp z, .dash_face_right
    cp 4
    jp z, .dash_face_right
    ld a, (msx2_player_sprite_dx)
    or a
    jp nz, .dash_dir_from_facing
    ld a, 1
    jp .dash_dir_store
.dash_face_left:
    xor a
    jp .dash_dir_store
.dash_face_right:
    ld a, 1
    jp .dash_dir_store
.dash_dir_from_facing:
    ld a, 1
.dash_dir_store:
    ld (msx2_dash_direction), a
    ld (msx2_player_sprite_dx), a
`;
}
function buildMsx2DashEquates(ramBase) {
    return `msx2_dash_timer EQU ${formatAsmWord(ramBase)}
msx2_dash_cooldown EQU ${formatAsmWord(ramBase + 1)}
msx2_dash_lock EQU ${formatAsmWord(ramBase + 2)}
msx2_dash_direction EQU ${formatAsmWord(ramBase + 3)}
`;
}
function buildMsx2DashRuntimeAsm(config, patrolBounds, options = {}) {
    if (!config.enabled)
        return '';
    const dashSpeed = formatAsmByte(config.dashSpeed);
    const dashDuration = formatAsmByte(config.dashDuration);
    const dashCooldown = formatAsmByte(config.dashCooldown);
    const dashLockGate = config.requireKeyRelease
        ? `    ld a, (msx2_dash_lock)
    or a
    jp nz, .dash_start_blocked
`
        : '';
    const setWalkingFlag = options.setPlayerWalkingFlagAsm || '';
    return `${buildDashPressedRoutine(config)}
msx2_dash_player_grounded:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_dash_player_grounded
    ; PURPOSE: Detects whether a solid cell is directly below the player feet.
    ; INPUT: none.
    ; OUTPUT: A=1 grounded, A=0 airborne.
    ; DESTROYS: AF, BC, DE, HL.
    ; PRESERVES: IX, IY.
    ; CALLS: msx2_collision_at_pixel.
    ; SIDE EFFECTS: none.
    ; NOTES: Uses direct foot probes instead of msx2_player_flags because that
    ;   flag can be stale before the vertical physics pass refreshes it.
    ; ------------------------------------------------------------
    ld a, (msx2_player_sprite_x)
    add a, 4
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_collision_at_pixel
    or a
    jp nz, .dash_grounded_yes
    ld a, (msx2_player_sprite_x)
    add a, 12
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_collision_at_pixel
    or a
    jp nz, .dash_grounded_yes
    xor a
    ret
.dash_grounded_yes:
    ld a, 1
    ret

msx2_tick_dash_cooldown:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_tick_dash_cooldown
    ; PURPOSE: Decrements the dash cooldown timer when active.
    ; INPUT: none. OUTPUT: none.
    ; DESTROYS: AF. PRESERVES: BC, DE, HL.
    ; ------------------------------------------------------------
    ld a, (msx2_dash_cooldown)
    or a
    ret z
    dec a
    ld (msx2_dash_cooldown), a
    ret

msx2_dash_release_lock:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_dash_release_lock
    ; PURPOSE: Clears the dash key lock once the dash input is released.
    ; INPUT: none. OUTPUT: none.
    ; DESTROYS: AF, BC, DE (via msx2_control_dash_pressed). PRESERVES: HL.
    ; ------------------------------------------------------------
    call msx2_control_dash_pressed
    or a
    ret nz
    xor a
    ld (msx2_dash_lock), a
    ret

msx2_try_start_dash:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_try_start_dash
    ; PURPOSE: Starts a ground dash when input, cooldown and key lock allow it.
    ;   Resolves dash direction and arms msx2_dash_timer/cooldown/lock.
    ; INPUT: none. OUTPUT: msx2_dash_timer > 0 when a dash started.
    ; DESTROYS: AF, BC, DE, HL.
    ; PRESERVES: IX, IY.
    ; CALLS: msx2_tick_dash_cooldown, msx2_dash_release_lock,
    ;   msx2_control_dash_pressed.
    ; SIDE EFFECTS: Updates dash timer/cooldown/lock/direction in RAM.
    ; NOTES: Grounded is bit 0 of msx2_player_flags; air_dash owns airborne dashes.
    ; ------------------------------------------------------------
    call msx2_tick_dash_cooldown
    ld a, (msx2_dash_timer)
    or a
    ret nz
    call msx2_dash_release_lock
    call msx2_dash_player_grounded
    or a
    jp z, .dash_start_blocked
    call msx2_control_dash_pressed
    or a
    jp z, .dash_start_blocked
${dashLockGate}    ld a, (msx2_dash_cooldown)
    or a
    jp nz, .dash_start_blocked
${buildDashDirectionResolveAsm(config)}    ld a, ${dashDuration}
    ld (msx2_dash_timer), a
    ld a, ${dashCooldown}
    ld (msx2_dash_cooldown), a
${config.requireKeyRelease ? `    ld a, 1
    ld (msx2_dash_lock), a
` : ''}${setWalkingFlag}    ret
.dash_start_blocked:
    ret

msx2_step_dash_movement:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_step_dash_movement
    ; PURPOSE: Moves the player dashSpeed pixels horizontally for each
    ;   active dash frame, clamped to patrol bounds and blocked by solids.
    ;   PushBox boxes stay solid through msx2_collision_at_pixel runtime
    ;   override, so a dash simply stops at them (dash never pushes boxes).
    ; INPUT: none. OUTPUT: msx2_player_sprite_x/_dx updated.
    ; DESTROYS: AF, BC, DE, HL.
    ; NOTES: msx2_collision_at_pixel destroys DE, so the dash target X held
    ;   in E is preserved with push/pop around each probe (see LESSONS_LEARNED:
    ;   register corruption is the first hypothesis).
    ; ------------------------------------------------------------
    ld a, (msx2_dash_timer)
    or a
    ret z
    dec a
    ld (msx2_dash_timer), a
    ld a, (msx2_dash_direction)
    or a
    jp nz, .dash_step_right
.dash_step_left:
    ld a, (msx2_player_sprite_x)
    cp ${formatAsmByte(patrolBounds.minX)}
    jp z, .dash_step_done
    sub ${dashSpeed}
    jp nc, .dash_left_check_min
    ld a, ${formatAsmByte(patrolBounds.minX)}
    jp .dash_left_target
.dash_left_check_min:
    cp ${formatAsmByte(patrolBounds.minX)}
    jp nc, .dash_left_target
    ld a, ${formatAsmByte(patrolBounds.minX)}
.dash_left_target:
    ld e, a
    ld b, e
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    push de
    call msx2_collision_at_pixel
    pop de
    jp nz, .dash_step_done
    ld a, e
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp .dash_step_done
.dash_step_right:
    ld a, (msx2_player_sprite_x)
    add a, ${dashSpeed}
    jp nc, .dash_right_check_max
    ld a, ${formatAsmByte(patrolBounds.maxX)}
    jp .dash_right_target
.dash_right_check_max:
    cp ${formatAsmByte(patrolBounds.maxX + 1)}
    jp c, .dash_right_target
    ld a, ${formatAsmByte(patrolBounds.maxX)}
.dash_right_target:
    ld e, a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    push de
    call msx2_collision_at_pixel
    pop de
    jp nz, .dash_step_done
    ld a, e
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
.dash_step_done:
    ret

`;
}
function buildMsx2DashInputGateAsm(config) {
    if (!config.enabled)
        return '';
    return `    ld a, (msx2_dash_timer)
    or a
    jp nz, .dash_active_input
    call msx2_try_start_dash
    ld a, (msx2_dash_timer)
    or a
    jp nz, .dash_active_input
`;
}
function buildMsx2DashActiveFrameAsm(config) {
    if (!config.enabled)
        return '';
    return `.dash_active_input:
    call msx2_step_dash_movement
    jp update_hardware_sprite_vertical
`;
}
function buildMsx2DashDamageSkipAsm(config) {
    if (!config.enabled || !config.invulnerable)
        return '';
    return `    ld a, (msx2_dash_timer)
    or a
    ret nz
`;
}
function buildMsx2DashHazardSkipAsm(config) {
    if (!config.enabled || !config.invulnerable)
        return '';
    return `    ld a, (msx2_dash_timer)
    or a
    jp nz, .no_effect
`;
}
function buildMsx2DashInitClearAsm() {
    return `    xor a
    ld (msx2_dash_timer), a
    ld (msx2_dash_cooldown), a
    ld (msx2_dash_lock), a
    ld (msx2_dash_direction), a
`;
}

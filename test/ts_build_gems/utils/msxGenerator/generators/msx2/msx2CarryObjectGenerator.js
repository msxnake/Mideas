"use strict";
/**
 * MSX2 carry_object skill generator (Z80 ASM).
 *
 * Carryable objects (rock, key, ball...) are screen entities flagged with
 * the `msx2_carryable` component, `params.carryable === true` or
 * `kind === 'carryable'`. Each screen exposes up to
 * MSX2_MAX_CARRYABLES_PER_SCREEN of them as dedicated hardware sprites
 * (SAT slots after the push-box slot, before the terminator).
 *
 * Runtime model (per slot states): 0=idle on ground, 1=carried (follows
 * 16px above the player's head), 2=flying (thrown: horizontal flight with
 * a shallow 2px/frame drop), 3=falling (4px/frame), #FF=inactive.
 * Pressing the bound key next to an idle object picks it up; pressing
 * again throws it toward the player's facing direction. The flight stops
 * at solid cells/bounds and the object settles on top of the first solid
 * cell below (snapped to the 16px row grid).
 *
 * v1 limitations (documented in Msx2CarryObjectConfig):
 *  - `carrySpeed`, `throwVertical`, `objectTypes` skill params are ignored.
 *  - `msx2_carry_fly_dir` is shared: if two objects fly at once (pick+throw
 *    during another flight, throttled by throwCooldown) both use the
 *    latest direction.
 *  - Idle objects do not fall: place them on solid ground in the editor.
 *
 * Register-safety notes:
 *  - `msx2_collision_at_pixel` preserves BC (probe inputs) and clobbers
 *    AF/DE/HL; probes here never need values in DE/HL afterwards.
 *  - `copy_to_vram_ext` (colors upload) clobbers AF/BC/DE/HL; the reset
 *    routine recomputes every pointer after each call.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_CARRY_DEFAULT_COLOR = exports.MSX2_CARRY_DEFAULT_PATTERN = exports.MSX2_CARRY_OBJECT_RAM_BYTES = exports.MSX2_MAX_CARRYABLES_PER_SCREEN = void 0;
exports.isMsx2CarryableEntity = isMsx2CarryableEntity;
exports.getMsx2CarryableRuntimeSlots = getMsx2CarryableRuntimeSlots;
exports.usesMsx2CarryObject = usesMsx2CarryObject;
exports.resolveMsx2CarryObjectRamBase = resolveMsx2CarryObjectRamBase;
exports.buildMsx2CarryObjectEquates = buildMsx2CarryObjectEquates;
exports.buildMsx2CarryObjectInitClearAsm = buildMsx2CarryObjectInitClearAsm;
exports.buildMsx2CarryObjectAttrWritesAsm = buildMsx2CarryObjectAttrWritesAsm;
exports.buildMsx2CarryObjectRuntimeAsm = buildMsx2CarryObjectRuntimeAsm;
exports.buildMsx2CarryObjectDataTablesAsm = buildMsx2CarryObjectDataTablesAsm;
const msx2SkillRamLayout_1 = require("./msx2SkillRamLayout");
const msx2SkillControlsGenerator_1 = require("./msx2SkillControlsGenerator");
exports.MSX2_MAX_CARRYABLES_PER_SCREEN = 2;
/**
 * carried_slot(1) + lock(1) + cooldown(1) + fly_dir(1) + count(1) + spare(1)
 * + runtime x/y/state/pattern (2 bytes each).
 */
exports.MSX2_CARRY_OBJECT_RAM_BYTES = 6 + exports.MSX2_MAX_CARRYABLES_PER_SCREEN * 4;
/** Fallback 16x16 rock pattern (sprite mode 2 layout: left column, right column). */
exports.MSX2_CARRY_DEFAULT_PATTERN = [
    0x00, 0x03, 0x0F, 0x1F, 0x3F, 0x3F, 0x7F, 0x7F,
    0x7F, 0x7F, 0x3F, 0x3F, 0x1F, 0x0F, 0x03, 0x00,
    0x00, 0xC0, 0xF0, 0xF8, 0xFC, 0xFC, 0xFE, 0xFE,
    0xFE, 0xFE, 0xFC, 0xFC, 0xF8, 0xF0, 0xC0, 0x00,
];
exports.MSX2_CARRY_DEFAULT_COLOR = 14;
const clampTileCoordinate = (value, max) => Math.max(0, Math.min(max, Number(value) || 0));
function formatHexByte(value) {
    return `#${Math.max(0, Math.min(255, Math.floor(Number(value) || 0))).toString(16).toUpperCase().padStart(2, '0')}`;
}
function formatHexWord(value) {
    return `#${Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0))).toString(16).toUpperCase().padStart(4, '0')}`;
}
function isMsx2CarryableEntity(entity) {
    if (!entity)
        return false;
    return Boolean(entity.components?.msx2_carryable)
        || entity.params?.carryable === true
        || entity.params?.carryable === 'true'
        || entity.kind === 'carryable';
}
function getCarryableRenderSpriteId(entity) {
    const id = entity?.components?.msx2_render?.sprite
        ?? entity?.components?.msx2_render?.spriteId
        ?? entity?.params?.sprite
        ?? entity?.params?.spriteId
        ?? entity?.spriteId;
    const normalized = String(id || '').trim();
    return normalized ? normalized : undefined;
}
function getMsx2CarryableRuntimeSlots(screen) {
    return (screen?.layers?.entities || [])
        .filter(entity => entity?.kind !== 'player' && entity?.position && isMsx2CarryableEntity(entity))
        .slice(0, exports.MSX2_MAX_CARRYABLES_PER_SCREEN)
        .map(entity => ({
        x: clampTileCoordinate(entity.position?.x, 15) * 16,
        y: clampTileCoordinate(entity.position?.y, 11) * 16,
        spriteId: getCarryableRenderSpriteId(entity),
    }));
}
function usesMsx2CarryObject(config, tileScreens) {
    return config.enabled
        && tileScreens.some(screen => getMsx2CarryableRuntimeSlots(screen).length > 0);
}
function resolveMsx2CarryObjectRamBase(options) {
    return (0, msx2SkillRamLayout_1.resolveMsx2SkillExtensionRamBase)(options);
}
function buildMsx2CarryObjectEquates(ramBase) {
    const slots = exports.MSX2_MAX_CARRYABLES_PER_SCREEN;
    return `msx2_carry_carried_slot EQU ${formatHexWord(ramBase)}
msx2_carry_lock EQU ${formatHexWord(ramBase + 1)}
msx2_carry_cooldown EQU ${formatHexWord(ramBase + 2)}
msx2_carry_fly_dir EQU ${formatHexWord(ramBase + 3)}
msx2_carry_count EQU ${formatHexWord(ramBase + 4)}
msx2_carry_runtime_x EQU ${formatHexWord(ramBase + 6)}
msx2_carry_runtime_y EQU ${formatHexWord(ramBase + 6 + slots)}
msx2_carry_runtime_state EQU ${formatHexWord(ramBase + 6 + slots * 2)}
msx2_carry_runtime_pattern EQU ${formatHexWord(ramBase + 6 + slots * 3)}
MSX2_MAX_CARRYABLES_PER_SCREEN EQU ${slots}
`;
}
function buildMsx2CarryObjectInitClearAsm() {
    return `    ld a, #FF
    ld (msx2_carry_carried_slot), a
    ld (msx2_carry_runtime_state), a
    ld (msx2_carry_runtime_state + 1), a
    xor a
    ld (msx2_carry_lock), a
    ld (msx2_carry_cooldown), a
    ld (msx2_carry_fly_dir), a
    ld (msx2_carry_count), a
`;
}
/**
 * SAT attribute writes for the carryable sprite slots. Follows the same
 * shape as the enemy/push-box writes in write_hardware_sprite_attrs.
 * `msx2_carry_runtime_pattern` stores the unique carry sprite INDEX
 * (0..n); the SAT pattern byte is computed as patternBase + index*4 so
 * the per-screen ROM tables stay independent from the pattern budget.
 */
function buildMsx2CarryObjectAttrWritesAsm(attrBase, patternBase) {
    return Array.from({ length: exports.MSX2_MAX_CARRYABLES_PER_SCREEN }, (_unused, slot) => {
        const attrAddress = attrBase + slot * 4;
        return `    ; Carryable object hardware sprite slot ${slot}.
    ld a, (msx2_carry_runtime_state + ${slot})
    cp #FF
    jp nz, .carry_sprite_${slot}_visible
    ld a, 208
    ld hl, ${formatHexWord(attrAddress)}
    call write_vram_byte_ext
    jp .carry_sprite_${slot}_done
.carry_sprite_${slot}_visible:
    ld a, (msx2_carry_runtime_y + ${slot})
    ld hl, ${formatHexWord(attrAddress)}
    call write_vram_byte_ext
    ld a, (msx2_carry_runtime_x + ${slot})
    ld hl, ${formatHexWord(attrAddress + 1)}
    call write_vram_byte_ext
    ld a, (msx2_carry_runtime_pattern + ${slot})
    add a, a
    add a, a
    add a, ${formatHexByte(patternBase)}
    ld hl, ${formatHexWord(attrAddress + 2)}
    call write_vram_byte_ext
    xor a
    ld hl, ${formatHexWord(attrAddress + 3)}
    call write_vram_byte_ext
.carry_sprite_${slot}_done:
`;
    }).join('\n');
}
function buildCarrySlotColorUploadAsm(slot, satSlotBase) {
    const vramRow = 0x1C00 + (satSlotBase + slot) * 16;
    return `    ld a, (msx2_carry_runtime_state + ${slot})
    cp #FF
    jp z, .carry_colors_done_${slot}
    ld a, (msx2_carry_runtime_pattern + ${slot})
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, msx2_carry_color_rows
    add hl, de
    ld de, ${formatHexWord(vramRow)}
    ld bc, 16
    call copy_to_vram_ext
.carry_colors_done_${slot}:
`;
}
/**
 * Shared per-slot routines, IX-indexed to avoid unrolling per slot:
 * IX = msx2_carry_runtime_x + slot, so (ix+0)=x[slot],
 * (ix+stride)=y[slot], (ix+stride*2)=state[slot] because the runtime
 * arrays are contiguous with stride MSX2_MAX_CARRYABLES_PER_SCREEN.
 * msx2_collision_at_pixel preserves IX.
 */
function buildCarrySharedSlotRoutinesAsm(throwPower) {
    const power = formatHexByte(throwPower);
    const stride = exports.MSX2_MAX_CARRYABLES_PER_SCREEN;
    const yOff = stride;
    const stateOff = stride * 2;
    return `msx2_carry_phase_step:
    ; IX = msx2_carry_runtime_x + slot. Steps one slot's flight/fall phase.
    ; Clobbers AF/BC/DE/HL. Preserves IX.
    ld a, (ix + ${stateOff})
    cp 2
    jp z, .carry_step_fly
    cp 3
    jp z, .carry_step_fall
    ret
.carry_step_fly:
    ld a, (msx2_carry_fly_dir)
    or a
    jp z, .carry_step_fly_left
    ld a, (ix + 0)
    add a, ${power}
    jp c, .carry_step_wall
    cp 240
    jp nc, .carry_step_wall
    ld (ix + 0), a
    add a, 15
    ld b, a
    jp .carry_step_probe
.carry_step_fly_left:
    ld a, (ix + 0)
    sub ${power}
    jp c, .carry_step_wall
    cp 8
    jp c, .carry_step_wall
    ld (ix + 0), a
    ld b, a
.carry_step_probe:
    ld a, (ix + ${yOff})
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    or a
    jp nz, .carry_step_wall
    ld a, (ix + ${yOff})
    add a, 2
    ld (ix + ${yOff}), a
    jp .carry_step_land_check
.carry_step_wall:
    ld (ix + ${stateOff}), 3
    ret
.carry_step_fall:
    ld a, (ix + ${yOff})
    add a, 4
    ld (ix + ${yOff}), a
.carry_step_land_check:
    ld a, (ix + ${yOff})
    cp 176
    jp c, .carry_step_probe_floor
    ld (ix + ${yOff}), 176
    jp .carry_step_land
.carry_step_probe_floor:
    ld a, (ix + 0)
    add a, 8
    ld b, a
    ld a, (ix + ${yOff})
    add a, 16
    ld c, a
    call msx2_collision_at_pixel
    or a
    ret z
.carry_step_land:
    ld a, (ix + ${yOff})
    add a, 16
    and #F0
    sub 16
    ld (ix + ${yOff}), a
    ld (ix + ${stateOff}), 0
    ret

msx2_carry_pickup_probe:
    ; IX = msx2_carry_runtime_x + slot. A=1 when the slot is idle and the
    ; player overlaps it (|dx|<16, |dy|<24); the slot becomes carried.
    ; Clobbers AF/B. Preserves IX.
    ld a, (ix + ${stateOff})
    or a
    jp nz, .carry_probe_no
    ld a, (ix + 0)
    ld b, a
    ld a, (msx2_player_sprite_x)
    sub b
    jp nc, .carry_probe_dx
    neg
.carry_probe_dx:
    cp 16
    jp nc, .carry_probe_no
    ld a, (ix + ${yOff})
    ld b, a
    ld a, (msx2_player_sprite_y)
    sub b
    jp nc, .carry_probe_dy
    neg
.carry_probe_dy:
    cp 24
    jp nc, .carry_probe_no
    ld (ix + ${stateOff}), 1
    ld a, 1
    ret
.carry_probe_no:
    xor a
    ret

`;
}
function buildMsx2CarryObjectRuntimeAsm(config, options) {
    if (!config.enabled)
        return '';
    const throwCooldown = formatHexByte(config.throwCooldown);
    return `${(0, msx2SkillControlsGenerator_1.buildMsx2SkillPressedRoutine)('msx2_control_carry_pressed', 'carry object skill', config.primaryControl, config.secondaryControl)}
msx2_reset_carry_runtime_for_current_screen:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_reset_carry_runtime_for_current_screen
    ; PURPOSE: Copies this screen's carryable ROM slots into runtime RAM
    ;   and uploads each active slot's sprite color row to VRAM.
    ; INPUT: msx2_current_screen_index.
    ; OUTPUT: none.
    ; DESTROYS: AF, BC, DE, HL.
    ; PRESERVES: IX, IY.
    ; CALLS: copy_to_vram_ext.
    ; SIDE EFFECTS: Resets carry scalars (carried/lock/cooldown/fly_dir).
    ; ------------------------------------------------------------
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_carry_count
    add hl, de
    ld a, (hl)
    ld (msx2_carry_count), a
    ld a, (msx2_current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, msx2_screen_carry_x
    add hl, de
    ld a, (hl)
    ld (msx2_carry_runtime_x), a
    inc hl
    ld a, (hl)
    ld (msx2_carry_runtime_x + 1), a
    ld hl, msx2_screen_carry_y
    add hl, de
    ld a, (hl)
    ld (msx2_carry_runtime_y), a
    inc hl
    ld a, (hl)
    ld (msx2_carry_runtime_y + 1), a
    ld hl, msx2_screen_carry_sprite
    add hl, de
    ld a, (hl)
    ld (msx2_carry_runtime_pattern), a
    inc hl
    ld a, (hl)
    ld (msx2_carry_runtime_pattern + 1), a
    xor a
    ld (msx2_carry_runtime_state), a
    ld (msx2_carry_runtime_state + 1), a
    ld (msx2_carry_lock), a
    ld (msx2_carry_cooldown), a
    ld (msx2_carry_fly_dir), a
    ld a, #FF
    ld (msx2_carry_carried_slot), a
    ld a, (msx2_carry_count)
    or a
    jp nz, .carry_reset_slot0_active
    ld a, #FF
    ld (msx2_carry_runtime_state), a
.carry_reset_slot0_active:
    ld a, (msx2_carry_count)
    cp 2
    jp nc, .carry_reset_slot1_active
    ld a, #FF
    ld (msx2_carry_runtime_state + 1), a
.carry_reset_slot1_active:
${Array.from({ length: exports.MSX2_MAX_CARRYABLES_PER_SCREEN }, (_unused, slot) => buildCarrySlotColorUploadAsm(slot, options.satSlotBase)).join('')}    ret

update_msx2_carry_objects:
    ; ------------------------------------------------------------
    ; FUNCTION: update_msx2_carry_objects
    ; PURPOSE: Per-frame carry_object skill step: cooldown/lock upkeep,
    ;   pick-up probe, carried follow, throw start, flight and landing.
    ; INPUT: none.
    ; OUTPUT: carry runtime arrays updated for the SAT writes.
    ; DESTROYS: AF, BC, DE, HL.
    ; PRESERVES: IX, IY.
    ; CALLS: msx2_control_carry_pressed, msx2_collision_at_pixel.
    ; SIDE EFFECTS: Updates carry skill RAM.
    ; ------------------------------------------------------------
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_carry_cooldown)
    or a
    jp z, .carry_cooldown_done
    dec a
    ld (msx2_carry_cooldown), a
.carry_cooldown_done:
    call msx2_control_carry_pressed
    or a
    jp nz, .carry_key_state_done
    xor a
    ld (msx2_carry_lock), a
.carry_key_state_done:
    ld a, (msx2_carry_carried_slot)
    cp #FF
    jp z, .carry_try_pickup
    ; Carried object follows 16px above the player's head.
    ld e, a
    ld d, 0
    ld hl, msx2_carry_runtime_x
    add hl, de
    ld a, (msx2_player_sprite_x)
    ld (hl), a
    ld hl, msx2_carry_runtime_y
    add hl, de
    ld a, (msx2_player_sprite_y)
    sub 16
    jp nc, .carry_follow_y_ok
    xor a
.carry_follow_y_ok:
    ld (hl), a
    ; Throw on a fresh key press.
    call msx2_control_carry_pressed
    or a
    jp z, .carry_update_phases
    ld a, (msx2_carry_lock)
    or a
    jp nz, .carry_update_phases
    ld a, (msx2_carry_cooldown)
    or a
    jp nz, .carry_update_phases
    ld a, 1
    ld (msx2_carry_lock), a
    ld a, ${throwCooldown}
    ld (msx2_carry_cooldown), a
    ld a, (msx2_player_sprite_dx)
    ld (msx2_carry_fly_dir), a
    ld a, (msx2_carry_carried_slot)
    ld e, a
    ld d, 0
    ld hl, msx2_carry_runtime_state
    add hl, de
    ld (hl), 2
    ld a, #FF
    ld (msx2_carry_carried_slot), a
    jp .carry_update_phases
.carry_try_pickup:
    call msx2_control_carry_pressed
    or a
    jp z, .carry_update_phases
    ld a, (msx2_carry_lock)
    or a
    jp nz, .carry_update_phases
    ld a, (msx2_carry_cooldown)
    or a
    jp nz, .carry_update_phases
${Array.from({ length: exports.MSX2_MAX_CARRYABLES_PER_SCREEN }, (_unused, slot) => `    ld ix, msx2_carry_runtime_x + ${slot}
    call msx2_carry_pickup_probe
    or a
    jp z, .carry_pickup_miss_${slot}
    ld a, ${slot}
    jp .carry_pickup_hit
.carry_pickup_miss_${slot}:
`).join('')}    jp .carry_update_phases
.carry_pickup_hit:
    ld (msx2_carry_carried_slot), a
    ld a, 1
    ld (msx2_carry_lock), a
    ld a, ${throwCooldown}
    ld (msx2_carry_cooldown), a
.carry_update_phases:
${Array.from({ length: exports.MSX2_MAX_CARRYABLES_PER_SCREEN }, (_unused, slot) => `    ld ix, msx2_carry_runtime_x + ${slot}
    call msx2_carry_phase_step
`).join('')}    ret

${buildCarrySharedSlotRoutinesAsm(config.throwPower)}`;
}
/**
 * ROM data tables for the per-screen carryable slots. Must live in the
 * always-visible main ROM area (NOT the Konami data bank): the reset
 * routine reads them with plain memory loads at screen-load time.
 */
function buildMsx2CarryObjectDataTablesAsm(tables) {
    const formatBytes = (label, bytes, comment) => {
        const lines = [`; ${comment}`, `${label}:`];
        for (let offset = 0; offset < bytes.length; offset += 16) {
            lines.push(`    DB ${bytes.slice(offset, offset + 16).map(formatHexByte).join(',')}`);
        }
        return `${lines.join('\n')}\n`;
    };
    const slots = exports.MSX2_MAX_CARRYABLES_PER_SCREEN;
    return `${formatBytes('msx2_screen_carry_count', tables.countByScreen.length ? tables.countByScreen : [0], `Per-msx2screen carryable entity count, capped at ${slots}`)}${formatBytes('msx2_screen_carry_x', tables.xBytes.length ? tables.xBytes : Array(slots).fill(0), `Per-msx2screen carryable X coordinates, ${slots} slots per screen`)}${formatBytes('msx2_screen_carry_y', tables.yBytes.length ? tables.yBytes : Array(slots).fill(0), `Per-msx2screen carryable Y coordinates, ${slots} slots per screen`)}${formatBytes('msx2_screen_carry_sprite', tables.spriteIdxBytes.length ? tables.spriteIdxBytes : Array(slots).fill(0), `Per-msx2screen carryable unique sprite indices, ${slots} slots per screen`)}${formatBytes('msx2_carry_color_rows', tables.colorRows.length ? tables.colorRows : Array(16).fill(exports.MSX2_CARRY_DEFAULT_COLOR), 'Carryable sprite color rows, 16 bytes per unique carryable sprite')}`;
}

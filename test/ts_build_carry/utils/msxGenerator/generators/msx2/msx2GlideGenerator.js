"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_GLIDE_RAM_BYTES = void 0;
exports.resolveMsx2GlideRamBase = resolveMsx2GlideRamBase;
exports.buildMsx2GlideEquates = buildMsx2GlideEquates;
exports.buildMsx2GlideInitAsm = buildMsx2GlideInitAsm;
exports.buildMsx2GlideInitClearAsm = buildMsx2GlideInitClearAsm;
exports.buildMsx2GlideLandRefillAsm = buildMsx2GlideLandRefillAsm;
exports.buildMsx2GlideGravityHookAsm = buildMsx2GlideGravityHookAsm;
exports.buildMsx2GlideRuntimeAsm = buildMsx2GlideRuntimeAsm;
const msx2SkillRamLayout_1 = require("./msx2SkillRamLayout");
exports.MSX2_GLIDE_RAM_BYTES = 2;
function formatAsmByte(value) {
    const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
    return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
function formatAsmWord(value) {
    const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
    return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}
function resolveMsx2GlideRamBase(options) {
    return (0, msx2SkillRamLayout_1.resolveMsx2SkillExtensionRamBase)(options);
}
function buildMsx2GlideEquates(ramBase) {
    return `msx2_glide_stamina EQU ${formatAsmWord(ramBase)}
msx2_glide_active EQU ${formatAsmWord(ramBase + 1)}
`;
}
function buildMsx2GlideInitAsm(config) {
    if (!config.enabled)
        return '';
    const initialStamina = config.glideBoostCost > 0 ? '    ld a, #64\n    ld (msx2_glide_stamina), a\n' : '';
    return `${initialStamina}    xor a
    ld (msx2_glide_active), a
`;
}
function buildMsx2GlideInitClearAsm() {
    return `    xor a
    ld (msx2_glide_stamina), a
    ld (msx2_glide_active), a
`;
}
function buildMsx2GlideLandRefillAsm(config) {
    if (!config.enabled || config.glideBoostCost <= 0)
        return '';
    return `    ld a, #64
    ld (msx2_glide_stamina), a
`;
}
function buildMsx2GlideGravityHookAsm(config) {
    if (!config.enabled)
        return '';
    return `    call msx2_apply_glide_clamp
`;
}
function buildMsx2GlideRuntimeAsm(config) {
    if (!config.enabled)
        return '';
    const glideSpeed = formatAsmByte(config.glideSpeed);
    const staminaCost = formatAsmByte(config.glideBoostCost);
    const staminaGate = config.glideBoostCost > 0
        ? `    ld a, (msx2_glide_stamina)
    or a
    jp z, .glide_inactive
`
        : '';
    const staminaTick = config.glideBoostCost > 0
        ? `    ld a, (msx2_glide_stamina)
    or a
    jp z, .glide_inactive
    dec a
    ld (msx2_glide_stamina), a
`
        : '';
    return `msx2_apply_glide_clamp:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_apply_glide_clamp
    ; PURPOSE: Caps fall speed at glideSpeed px/frame while the jump
    ;   input is held in mid-air (glide skill). glideSpeed=0 floats.
    ; INPUT: none. OUTPUT: msx2_player_gravity_vel clamped, glide flag set.
    ; DESTROYS: AF, B, HL (plus C/D via msx2_control_jump_pressed BIOS path).
    ; PRESERVES: E, IX, IY.
    ; NOTES: only clamps DOWNWARD velocity (bit 7 clear). The cap fires when
    ;   current fall speed EXCEEDS glideSpeed (carry after cp); a previous
    ;   version used jp nc and accelerated slow falls instead of capping.
    ; ------------------------------------------------------------
    ld a, (msx2_player_flags)
    bit 0, a
    jp nz, .glide_inactive
    call msx2_control_jump_pressed
    or a
    jp z, .glide_inactive
${staminaGate}${staminaTick}    ld hl, msx2_player_gravity_vel
    inc hl
    ld a, (hl)
    bit 7, a
    ret nz
    ld b, a
    ld a, ${glideSpeed}
    or a
    jp z, .glide_float
    cp b
    jp c, .glide_cap_store
    ld a, 1
    ld (msx2_glide_active), a
    ret
.glide_cap_store:
    ld (hl), a
    dec hl
    xor a
    ld (hl), a
    ld a, 1
    ld (msx2_glide_active), a
    ret
.glide_float:
    dec hl
    xor a
    ld (hl), a
    inc hl
    ld (hl), a
    ld a, 1
    ld (msx2_glide_active), a
    ret
.glide_inactive:
    xor a
    ld (msx2_glide_active), a
    ret

`;
}

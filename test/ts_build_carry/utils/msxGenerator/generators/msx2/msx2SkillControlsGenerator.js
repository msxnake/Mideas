"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMsx2SkillControlPressedCheck = buildMsx2SkillControlPressedCheck;
exports.buildMsx2SkillPressedRoutine = buildMsx2SkillPressedRoutine;
/**
 * Shared ASM builder for MSX2 skill input checks (dash, teleport, future skills).
 *
 * Each check block is a guard: it falls through when the control IS active and
 * returns A=0 (Z set) when it is NOT. Concatenating primary+secondary blocks
 * followed by `ld a, 1 / ret` yields an AND of all configured controls.
 *
 * `blockSuffix` must be unique within the enclosing global label so the local
 * labels generated for directional checks do not collide (Glass scopes local
 * labels to the previous global label).
 */
function buildDirectionalCheck(matchValues, blockSuffix) {
    const okLabel = `.skill_dir_ok_${blockSuffix}`;
    const matches = matchValues
        .map((value) => `    cp ${value}\n    jp z, ${okLabel}\n`)
        .join('');
    return `    xor a
    call GTSTCK
${matches}    xor a
    ret
${okLabel}:
`;
}
function buildMsx2SkillControlPressedCheck(control, blockSuffix) {
    switch (control) {
        case 'jump':
            return `    call msx2_control_jump_pressed
    or a
    ret z
`;
        case 'attack':
            return `    call msx2_control_action_pressed
    or a
    ret z
`;
        case 'right':
            return buildDirectionalCheck([2, 3, 4], blockSuffix);
        case 'left':
            return buildDirectionalCheck([6, 7, 8], blockSuffix);
        case 'up':
            return buildDirectionalCheck([1, 2, 8], blockSuffix);
        case 'down':
            return buildDirectionalCheck([4, 5, 6], blockSuffix);
        default:
            return `    xor a
    ret
`;
    }
}
function buildMsx2SkillPressedRoutine(routineLabel, skillName, primaryControl, secondaryControl) {
    const primary = buildMsx2SkillControlPressedCheck(primaryControl, 'p');
    const secondary = secondaryControl !== 'none'
        ? buildMsx2SkillControlPressedCheck(secondaryControl, 's')
        : '';
    return `${routineLabel}:
    ; ------------------------------------------------------------
    ; FUNCTION: ${routineLabel}
    ; PURPOSE: A=1 when the configured ${skillName} input combo is held.
    ; INPUT: none (reads joystick/keyboard via BIOS).
    ; OUTPUT: A=1 pressed, A=0 not pressed (Z set when not pressed).
    ; DESTROYS: AF, BC, DE (GTSTCK / msx2_read_control_buttons BIOS paths).
    ; PRESERVES: HL, IX, IY.
    ; ------------------------------------------------------------
${primary}${secondary}    ld a, 1
    ret
`;
}

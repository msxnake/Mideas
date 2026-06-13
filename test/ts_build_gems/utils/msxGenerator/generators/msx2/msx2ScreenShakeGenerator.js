"use strict";
/**
 * MSX2 reusable screen-shake (earthquake) effect generator (Z80 ASM).
 *
 * Drives the V9938 R#18 (display adjust) register to shake the whole SCREEN 4
 * display for a short, punchy decay. This module is INDEPENDENT of any skill —
 * any feature can call `msx2_screen_shake_trigger` to start a shake; the main
 * loop calls `msx2_screen_shake_update` once per frame to advance it.
 *
 * R#18 layout (V9938 register 18, #12):
 *   - low nibble  = horizontal adjust (-7 .. +8); 0 = centred horizontally
 *   - high nibble = vertical adjust   (-7 .. +8); 0 = centred vertically
 *   Neutral (centred) value is #00. A negative adjust uses the 1's-complement
 *   form documented by the V9938: the nibble runs 0,F,E,...,9 for 0,-1,-2,...,-7
 *   and 0,1,2,...,8 for 0,+1,..,+8. We use the high nibble (vertical bias) for a
 *   vertical earthquake feel.
 *
 * CRITICAL: the table MUST end at #00 so the screen returns dead-centre. We use
 * the decay table indexed by the REMAINING timer; the routine writes the entry
 * for `timer` then decrements, and the final visible frame (timer == 1) writes
 * #00 (neutral). See LESSONS_LEARNED 2026-06-11.
 *
 * Uses 1 byte of RAM (`msx2_shake_timer`). It sits at the tail of the skill RAM
 * chain via `resolveMsx2SkillExtensionRamBase` — addresses are NEVER hardcoded
 * (LESSONS_LEARNED 2026-06-08 + 2026-06-10).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_SCREEN_SHAKE_RAM_BYTES = void 0;
exports.resolveMsx2ScreenShakeRamBase = resolveMsx2ScreenShakeRamBase;
exports.buildMsx2ScreenShakeEquates = buildMsx2ScreenShakeEquates;
exports.buildMsx2ScreenShakeInitClearAsm = buildMsx2ScreenShakeInitClearAsm;
exports.buildMsx2ScreenShakeRuntimeAsm = buildMsx2ScreenShakeRuntimeAsm;
exports.buildMsx2ScreenShakeMainLoopCallAsm = buildMsx2ScreenShakeMainLoopCallAsm;
const msx2SkillRamLayout_1 = require("./msx2SkillRamLayout");
/** Total bytes of RAM used by the screen-shake effect (shake_timer). */
exports.MSX2_SCREEN_SHAKE_RAM_BYTES = 1;
/**
 * Vertical-bias shake decay table.
 *
 * Indexed by the REMAINING timer value (1..length). Entry at index 0 is unused
 * (timer never reads 0 — `update` rets when timer == 0). The mapping below is
 * read as "when timer == N, write table[N-1] to R#18, then dec timer", i.e. the
 * sequence is played from the END of the table back to the start as the timer
 * counts down. So the LAST played entry (timer == 1) is table[0] and MUST be
 * #00 (neutral / centred) — guaranteeing the screen returns to centre.
 *
 * Play order (timer 5->1): #20, #F0, #10, #F0, #00.
 *   - #20 high nibble 2 => vertical +2 (down 2)
 *   - #F0 high nibble F => vertical -1 (up 1)
 *   - #10 high nibble 1 => vertical +1 (down 1)
 *   - #F0 high nibble F => vertical -1 (up 1)
 *   - #00              => centre (neutral) — final frame.
 * Low nibble stays 0 so there is no horizontal drift; the bias is vertical.
 */
const MSX2_SHAKE_TABLE = [0x00, 0xF0, 0x10, 0xF0, 0x20];
const MSX2_SHAKE_LENGTH = MSX2_SHAKE_TABLE.length;
function formatAsmByte(value) {
    const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
    return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
function formatAsmWord(value) {
    const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
    return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}
function resolveMsx2ScreenShakeRamBase(options) {
    return (0, msx2SkillRamLayout_1.resolveMsx2SkillExtensionRamBase)(options);
}
/** EQU for the 1 screen-shake RAM byte, anchored at `ramBase`. */
function buildMsx2ScreenShakeEquates(ramBase) {
    return `msx2_shake_timer EQU ${formatAsmWord(ramBase)}
`;
}
/**
 * Init-clear: zeroes the shake timer AND resets R#18 to neutral (#00) so the
 * display is centred at boot / screen load. R#18 is register #12 (=18).
 */
function buildMsx2ScreenShakeInitClearAsm() {
    // VDP write convention (BIOS WRTVDP): B = value, C = register.
    // R#18 = #12, neutral value = #00, so BC must be #0012 (B=#00, C=#12).
    // NOTE: `ld bc, #0012` loads B=#00, C=#12. The byte order of `ld bc, nnnn`
    // is B=high byte, C=low byte; writing #1200 here (B=#12, C=#00) would send
    // #12 to R#0 — changing the screen mode and enabling the line interrupt —
    // which hangs the boot before the main loop. Match msx2_screen_shake_update,
    // which uses `ld c, #12`.
    return `    xor a
    ld (msx2_shake_timer), a
    ld bc, #0012    ; B=#00 (R#18 neutral / centred), C=#12 (=18 = R#18)
    call WRTVDP
`;
}
/**
 * Runtime routines + the decay table.
 *
 * `msx2_screen_shake_trigger`  — starts a shake (arms the timer).
 * `msx2_screen_shake_update`   — advances the shake one frame (call per frame).
 * `msx2_shake_decay_table`     — the db decay table.
 */
function buildMsx2ScreenShakeRuntimeAsm() {
    const tableBytes = MSX2_SHAKE_TABLE.map(formatAsmByte).join(', ');
    return `msx2_screen_shake_trigger:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_screen_shake_trigger
    ; PURPOSE: Starts a screen shake by arming msx2_shake_timer to the
    ;   decay-table length. The per-frame msx2_screen_shake_update then
    ;   plays the table down to #00 (neutral).
    ; INPUT: none.
    ; OUTPUT: msx2_shake_timer = ${MSX2_SHAKE_LENGTH}.
    ; DESTROYS: AF.
    ; PRESERVES: BC, DE, HL, IX, IY.
    ; ------------------------------------------------------------
    ld a, ${formatAsmByte(MSX2_SHAKE_LENGTH)}
    ld (msx2_shake_timer), a
    ret

msx2_screen_shake_update:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_screen_shake_update
    ; PURPOSE: Advances the active screen shake by one frame. When the
    ;   timer is 0 it does nothing (the final visible frame already wrote
    ;   #00 to R#18, so the display is centred and stays there). When the
    ;   timer is non-zero it indexes the decay table by the timer, writes
    ;   that byte to V9938 R#18 (#12), then decrements the timer. The
    ;   final played frame (timer == 1) writes table[0] = #00 (neutral),
    ;   guaranteeing the screen returns dead-centre.
    ; INPUT: msx2_shake_timer (0 = idle, 1..${MSX2_SHAKE_LENGTH} = playing).
    ; OUTPUT: V9938 R#18 written; msx2_shake_timer decremented.
    ; DESTROYS: AF, BC, HL.
    ; PRESERVES: DE, IX, IY.
    ; ------------------------------------------------------------
    ld a, (msx2_shake_timer)
    or a
    ret z
    dec a
    ld (msx2_shake_timer), a
    ; A = remaining timer after dec (0..${MSX2_SHAKE_LENGTH - 1}). Index table[A].
    ld hl, msx2_shake_decay_table
    ld c, a
    ld b, 0
    add hl, bc
    ld b, (hl)      ; B = R#18 value from decay table
    ld c, #12       ; C = #12 (=18) = R#18
    call WRTVDP
    ret

msx2_shake_decay_table:
    db ${tableBytes}
`;
}
/** Main-loop call site: advance the shake once per frame. */
function buildMsx2ScreenShakeMainLoopCallAsm() {
    return `    call msx2_screen_shake_update
`;
}

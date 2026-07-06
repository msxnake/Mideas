"use strict";
/**
 * SCREEN 5 bitmap-room JUMP BLOCK (single / double jump + coyote_time +
 * jump_buffer).
 *
 * Unlike the dash (a self-contained appended routine), the jump EXTENDS the
 * existing jump, which lives inline in update_player_movement. So this module
 * owns the whole jump block (.check_jump .. .jump_released):
 *   - When double_jump is OFF it emits the original single-jump block; when ON
 *     it tracks player_jumps_used (#C00D): a ground jump uses the primary
 *     impulse and sets the counter to 1; an air jump (while the counter is
 *     below maxJumps) uses the mid-air impulse and increments it. The counter
 *     resets to 0 whenever the player is grounded (player_flags bit 0).
 *   - coyote_time (frames) lets the player still jump shortly after leaving a
 *     ledge; a coyote jump counts as the ground jump (jump #1), so it never
 *     spends an air jump. Armed by the leave-ground hook, consumed on jump,
 *     decremented every frame, cleared on land.
 *   - jump_buffer (frames) remembers a jump press that happened slightly before
 *     landing and fires it as the first jump on touchdown. Set when the press
 *     is rejected because the player is airborne+coyote-expired, fired by the
 *     land hook, decremented every frame.
 *
 * player_jump_lock (requireKeyRelease) is set on every jump and cleared on
 * release, so each jump needs a fresh press (holding space never auto-repeats).
 *
 * When coyoteTime==0 AND jumpBuffer==0 AND double_jump is off, the emitted
 * block is bit-identical to the original single-jump block (no-regression for
 * legacy projects).
 *
 * RAM:
 *   player_jumps_used      EQU #C00D  (double_jump counter; only when active)
 *   player_coyote_timer    EQU #C00E  (coyote_time frames remaining; only >0)
 *   player_jump_buffer_t   EQU #C00F  (jump_buffer frames remaining; only >0)
 * Direction/impulse come from the Player Config via resolveBitmapPlayerPhysics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_BITMAP_JUMP_BUFFER_TIMER_RAM = exports.MSX2_BITMAP_COYOTE_TIMER_RAM = exports.MSX2_BITMAP_JUMPS_USED_RAM = void 0;
exports.bitmapDoubleJumpEnabled = bitmapDoubleJumpEnabled;
exports.bitmapCoyoteEnabled = bitmapCoyoteEnabled;
exports.bitmapJumpBufferEnabled = bitmapJumpBufferEnabled;
exports.buildBitmapDoubleJumpEquates = buildBitmapDoubleJumpEquates;
exports.buildBitmapCoyoteBufferEquates = buildBitmapCoyoteBufferEquates;
exports.buildBitmapDoubleJumpInitClearAsm = buildBitmapDoubleJumpInitClearAsm;
exports.buildBitmapCoyoteBufferInitClearAsm = buildBitmapCoyoteBufferInitClearAsm;
exports.buildBitmapJumpBlockAsm = buildBitmapJumpBlockAsm;
exports.buildBitmapCoyoteBufferLandHookAsm = buildBitmapCoyoteBufferLandHookAsm;
exports.buildBitmapCoyoteBufferLeaveGroundHookAsm = buildBitmapCoyoteBufferLeaveGroundHookAsm;
exports.MSX2_BITMAP_JUMPS_USED_RAM = 0xC00D;
exports.MSX2_BITMAP_COYOTE_TIMER_RAM = 0xC00E;
exports.MSX2_BITMAP_JUMP_BUFFER_TIMER_RAM = 0xC00F;
function asmByte(value) {
    const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
    return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
function asmWord(value) {
    const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
    return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}
function bitIndexFromMask(mask) {
    const byte = Math.max(0, Math.min(255, Math.floor(Number(mask) || 0)));
    for (let bit = 0; bit < 8; bit++) {
        if (byte === (1 << bit))
            return bit;
    }
    return 0;
}
function bitmapDoubleJumpEnabled(physics) {
    return Boolean(physics?.doubleJumpEnabled) && Number(physics?.maxJumps) > 1;
}
/** True when coyote_time is configured (non-zero frames) for the linked player. */
function bitmapCoyoteEnabled(physics) {
    return Number(physics?.coyoteTime) > 0;
}
/** True when jump_buffer is configured (non-zero frames) for the linked player. */
function bitmapJumpBufferEnabled(physics) {
    return Number(physics?.jumpBuffer) > 0;
}
/** RAM EQU for the jump counter (only when the skill is active). */
function buildBitmapDoubleJumpEquates(physics) {
    if (!bitmapDoubleJumpEnabled(physics))
        return '';
    return `; --- DOUBLE JUMP skill: jumps taken since leaving the ground ---
player_jumps_used EQU ${asmWord(exports.MSX2_BITMAP_JUMPS_USED_RAM)}
`;
}
/**
 * EQUs for coyote_time / jump_buffer timers. Only emitted when the
 * corresponding parameter is non-zero, so legacy projects get no new EQUs.
 */
function buildBitmapCoyoteBufferEquates(physics) {
    if (!physics)
        return '';
    const coyote = bitmapCoyoteEnabled(physics);
    const buffer = bitmapJumpBufferEnabled(physics);
    if (!coyote && !buffer)
        return '';
    const lines = ['; --- COYOTE / JUMP BUFFER timers (skillParameters.jump) ---'];
    if (coyote) {
        lines.push(`player_coyote_timer  EQU ${asmWord(exports.MSX2_BITMAP_COYOTE_TIMER_RAM)}`);
    }
    if (buffer) {
        lines.push(`player_jump_buffer_t EQU ${asmWord(exports.MSX2_BITMAP_JUMP_BUFFER_TIMER_RAM)}`);
    }
    return lines.join('\n') + '\n';
}
/** Zeroes the jump counter at init (only when the skill is active). */
function buildBitmapDoubleJumpInitClearAsm(physics) {
    if (!bitmapDoubleJumpEnabled(physics))
        return '';
    return `    xor a
    ld (player_jumps_used), a
`;
}
/**
 * Init-clear for coyote / jump_buffer timers. Only emitted when at least one is
 * active. Must NOT use `xor a` blindly for coyote: 0 already means "expired /
 * not armed" (no sentinel here, unlike wall_slide_side), so xor a is correct.
 */
function buildBitmapCoyoteBufferInitClearAsm(physics) {
    const coyote = bitmapCoyoteEnabled(physics);
    const buffer = bitmapJumpBufferEnabled(physics);
    if (!coyote && !buffer)
        return '';
    const lines = ['    xor a'];
    if (coyote)
        lines.push('    ld (player_coyote_timer), a');
    if (buffer)
        lines.push('    ld (player_jump_buffer_t), a');
    return lines.join('\n') + '\n';
}
/**
 * Per-frame coyote / jump_buffer timer decrement block. Emitted only when at
 * least one is active. Local labels .cb_skip_coyote_dec / .cb_skip_buffer_dec
 * live inside the jump block scope (inserted at the top of .check_jump or just
 * after .cj_airborne), so they must not collide with other labels there.
 */
function buildBitmapCoyoteBufferTimerDecrementAsm(physics) {
    const coyote = bitmapCoyoteEnabled(physics);
    const buffer = bitmapJumpBufferEnabled(physics);
    if (!coyote && !buffer)
        return '';
    const lines = ['    ; per-frame coyote / jump_buffer timer decrements'];
    if (coyote) {
        lines.push('    ld a, (player_coyote_timer)', '    or a', '    jr z, .cb_skip_coyote_dec', '    dec a', '    ld (player_coyote_timer), a', '.cb_skip_coyote_dec:');
    }
    if (buffer) {
        lines.push('    ld a, (player_jump_buffer_t)', '    or a', '    jr z, .cb_skip_buffer_dec', '    dec a', '    ld (player_jump_buffer_t), a', '.cb_skip_buffer_dec:');
    }
    return lines.join('\n') + '\n';
}
/**
 * Coyote gate inserted in .jump_pressed right after the grounded check fails
 * (player is airborne). When coyote is active and the timer has not expired,
 * consumes the timer and jumps as if grounded (so a coyote jump counts as
 * jump #1 and never spends an air jump). When coyote is expired (or disabled)
 * and jump_buffer is active, records the press as a buffered jump for the next
 * landing. Falls through to the caller's airborne handling (air-jump / reject)
 * when neither fires.
 *
 * Local label .cb_coyote_expired is only emitted when coyote is active.
 */
function buildBitmapCoyoteAirGateAsm(physics) {
    const coyote = bitmapCoyoteEnabled(physics);
    const buffer = bitmapJumpBufferEnabled(physics);
    if (!coyote && !buffer)
        return '';
    const bufferArm = buffer
        ? `    ld a, ${asmByte(Math.max(1, Math.min(16, Math.floor(physics.jumpBuffer))))}
    ld (player_jump_buffer_t), a
`
        : '';
    if (!coyote) {
        // Coyote disabled: only the buffer arm runs (no label emitted).
        return `    ; (coyote disabled) record airborne jump press as buffer for next landing.
${bufferArm}`;
    }
    return `    ; COYOTE: if the timer is still active, consume it and jump as if grounded.
    ld a, (player_coyote_timer)
    or a
    jp z, .cb_coyote_expired
    xor a
    ld (player_coyote_timer), a
    jp .jump_from_ground
.cb_coyote_expired:
${buffer ? `    ; coyote expired: record airborne jump press as buffer for next landing.
${bufferArm}` : ''}`;
}
/**
 * The jump dispatch block (.check_jump .. .jump_released), inserted inline in
 * update_player_movement. INPUT: C = pressed key mask for keyboard row 8
 * (bit 0 = SPACE, bit 5 = UP). Falls through to .apply_gravity.
 *
 * Variants (all bit-identical to the legacy block when their feature is off):
 *   - single jump, no coyote/buffer  -> original single-jump block
 *   - single jump + coyote/buffer    -> adds airborne gate
 *   - double jump, no coyote/buffer  -> original double-jump block
 *   - double jump + coyote/buffer    -> adds airborne gate before air-jump check
 *
 * .jump_from_ground always consumes the ground impulse and (when double jump is
 * on) sets player_jumps_used = 1, so a coyote jump counts as jump #1.
 */
function buildBitmapJumpBlockAsm(physics) {
    const jumpByte = asmByte(physics.jumpImpulseByte);
    const jumpPx = Math.max(1, Math.floor(physics.jumpPx) || 5);
    const jumpKeyboard = physics.jumpKeyboard === undefined ? { label: 'SPC', row: 8, mask: 0x01 } : physics.jumpKeyboard;
    const jumpInputAsm = !jumpKeyboard
        ? `    jp .jump_released      ; jump control disabled`
        : jumpKeyboard.row === 8
            ? `    bit ${bitIndexFromMask(jumpKeyboard.mask)}, c     ; jump key ${jumpKeyboard.label}
    jp nz, .jump_pressed
    jp .jump_released`
            : `    in a, (PPI_C)           ; jump key ${jumpKeyboard.label}
    and #F0
    or ${jumpKeyboard.row}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(jumpKeyboard.mask)}
    jp nz, .jump_pressed
    jp .jump_released`;
    const djEnabled = bitmapDoubleJumpEnabled(physics);
    const coyote = bitmapCoyoteEnabled(physics);
    const buffer = bitmapJumpBufferEnabled(physics);
    const needsAirGate = coyote || buffer;
    // Bit-identical legacy single-jump block (no double_jump, no coyote, no buffer).
    if (!djEnabled && !needsAirGate) {
        return `.check_jump:
${jumpInputAsm}
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity
    ld a, (player_flags)
    and #01
    jp z, .apply_gravity
    ld a, ${jumpByte}              ; -${jumpPx} px/frame initial jump velocity (Player Config jumpPower)
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a         ; clear sub-pixel fraction so the next gravity tick starts clean
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, 1
    ld (player_jump_lock), a
    jp .apply_gravity
.jump_released:
    xor a
    ld (player_jump_lock), a`;
    }
    const timerDec = buildBitmapCoyoteBufferTimerDecrementAsm(physics);
    const airGate = buildBitmapCoyoteAirGateAsm(physics);
    const bufferFrames = buffer ? asmByte(Math.max(1, Math.min(16, Math.floor(physics.jumpBuffer)))) : '';
    if (!djEnabled) {
        // Single jump WITH coyote/buffer.
        return `.check_jump:
${timerDec}${jumpInputAsm}
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity
    ld a, (player_flags)
    and #01
    jp z, .cb_airborne             ; airborne -> coyote / jump_buffer gate
    jp .jump_from_ground
.cb_airborne:
${airGate}    jp .apply_gravity
.jump_from_ground:
    ld a, ${jumpByte}              ; -${jumpPx} px/frame initial jump velocity (Player Config jumpPower)
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a         ; clear sub-pixel fraction so the next gravity tick starts clean
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, 1
    ld (player_jump_lock), a
    jp .apply_gravity
.jump_released:
    xor a
    ld (player_jump_lock), a`;
    }
    // Double jump (with or without coyote/buffer).
    const maxJumps = asmByte(Math.max(1, Math.min(4, Math.floor(physics.maxJumps) || 2)));
    const airByte = asmByte(physics.airJumpImpulseByte);
    const airPx = Math.max(1, Math.floor(physics.airJumpPx) || jumpPx);
    // When jump_buffer is active, an air-jump rejection arms the buffer; otherwise
    // it falls straight through to .apply_gravity (bit-identical to the legacy
    // double-jump block when buffer is off).
    const airRejectTarget = buffer ? '.cb_air_rejected' : '.apply_gravity';
    const airRejectedBlock = buffer
        ? `.cb_air_rejected:
    ld a, ${bufferFrames}
    ld (player_jump_buffer_t), a
    jp .apply_gravity
`
        : '';
    return `.check_jump:
    ; DOUBLE JUMP: reset the jump counter whenever the player is grounded.
    ld a, (player_flags)
    and #01
    jp z, .cj_airborne
    xor a
    ld (player_jumps_used), a
.cj_airborne:
${timerDec}${jumpInputAsm}
.jump_pressed:
    ld a, (player_jump_lock)
    or a
    jp nz, .apply_gravity        ; key held -> no repeat
    ld a, (player_flags)
    and #01
    jp nz, .jump_from_ground
    ; Airborne: coyote first (counts as jump #1), then air jumps, then buffer.
${airGate}    ld a, (player_jumps_used)
    cp ${maxJumps}
    jp nc, ${airRejectTarget}
    ld a, ${airByte}              ; -${airPx} px/frame mid-air jump velocity
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a         ; clear sub-pixel fraction so the next gravity tick starts clean
    ld a, (player_jumps_used)
    inc a
    ld (player_jumps_used), a
    ld a, 1
    ld (player_jump_lock), a
    jp .apply_gravity
${airRejectedBlock}.jump_from_ground:
    ld a, ${jumpByte}              ; -${jumpPx} px/frame initial jump velocity (Player Config jumpPower)
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a         ; clear sub-pixel fraction so the next gravity tick starts clean
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, 1
    ld (player_jumps_used), a     ; ground jump counts as the first jump
    ld a, 1
    ld (player_jump_lock), a
    jp .apply_gravity
.jump_released:
    xor a
    ld (player_jump_lock), a`;
}
/**
 * Land hook (injected via skillHooks.landClearAsm, after player_flags bit 0 is
 * set on touchdown). Fires a buffered jump press as the first jump when the
 * jump_buffer timer is non-zero, then unconditionally clears the coyote timer.
 *
 * When a buffered jump fires, grounded is cleared (the player is leaving the
 * ground again) and player_vy is set to the ground impulse; the rest of the
 * land-settle code in update_player_movement runs normally afterwards because
 * this hook does NOT jump away. The hook must be emitted AFTER other land hooks
 * (wall_jump / power_stomp / high_jump) so their clears run first.
 *
 * INPUT: none. OUTPUT: fires a buffered jump or just clears coyote.
 * DESTROYS: AF. PRESERVES: BC, DE, HL. No calls (no register-survival risk).
 */
function buildBitmapCoyoteBufferLandHookAsm(physics) {
    if (!physics)
        return '';
    const coyote = bitmapCoyoteEnabled(physics);
    const buffer = bitmapJumpBufferEnabled(physics);
    if (!coyote && !buffer)
        return '';
    const jumpByte = asmByte(physics.jumpImpulseByte);
    const lines = ['    ; --- COYOTE / JUMP BUFFER land hook ---'];
    if (buffer) {
        lines.push('    ld a, (player_jump_buffer_t)', '    or a', '    jp z, .cb_land_no_buffer', '    xor a', '    ld (player_jump_buffer_t), a', `    ld a, ${jumpByte}              ; fire buffered jump as the first jump`, '    ld (player_vy), a', '    xor a', '    ld (player_vy_frac), a         ; clear sub-pixel fraction so the next gravity tick starts clean', '    ld a, (player_flags)', '    and #FE                      ; clear grounded: we are jumping again', '    ld (player_flags), a', '    ld a, 1', '    ld (player_jump_lock), a', '.cb_land_no_buffer:');
    }
    if (coyote) {
        lines.push('    xor a', '    ld (player_coyote_timer), a   ; landing clears any stale coyote timer');
    }
    return lines.join('\n') + '\n';
}
/**
 * Leave-ground hook (injected via skillHooks.leaveGroundAsm, right after the
 * grounded flag is cleared when the player starts falling). Arms the coyote
 * timer once (only when it is currently 0, so repeated frames of free-fall do
 * not refresh the window). No-op when coyote is disabled.
 *
 * INPUT: none. OUTPUT: arms player_coyote_timer if it was 0.
 * DESTROYS: AF. PRESERVES: BC, DE, HL. No calls.
 */
function buildBitmapCoyoteBufferLeaveGroundHookAsm(physics) {
    if (!bitmapCoyoteEnabled(physics))
        return '';
    const coyoteFrames = asmByte(Math.max(1, Math.min(16, Math.floor(physics.coyoteTime))));
    return `    ; --- COYOTE: arm timer on leave-ground (once) ---
    ld a, (player_coyote_timer)
    or a
    jr nz, .cb_leave_skip_arm
    ld a, ${coyoteFrames}
    ld (player_coyote_timer), a
.cb_leave_skip_arm:
`;
}

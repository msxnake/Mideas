/** Optional 48x48 Pollito state machine. Uses existing per-instance boss bytes. */
export function buildBitmapChickAsm(options: {
  hit: { x: number; y: number; w: number; h: number };
  aimOffsetX: number;
  invulnFrames: string;
}): string {
  const { hit, aimOffsetX, invulnFrames } = options;
  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_chick_config_ix
; PURPOSE: Select the active Pollito's timing and mirrored-source record.
; INPUT: room index and boss_slot. OUTPUT: IX -> record.
; DESTROYS: AF, DE, HL, IX. PRESERVES: BC, IY.
; ------------------------------------------------------------
bitmap_boss_chick_config_ix:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_chick_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    pop ix
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_chick_set_frame
; PURPOSE: Select one of two running legs or two dizzy star poses.
; INPUT: A = frame, IX -> body. DESTROYS: AF, BC, DE, HL.
; PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_boss_chick_set_frame:
    call bitmap_boss_chick_select_frame
    ld a, 3
    ld (boss_render_phase), a
    ret

; Compute frame source, including the pre-mirrored atlas row. This does not
; change render_phase, so a moving frame can still restore its exposed strip.
bitmap_boss_chick_select_frame:
    ld (boss_anim_frame), a
    ld b, a
    ld a, (boss_dx)
    bit 7, a
    jr z, .chick_facing_right
    push ix
    call bitmap_boss_chick_config_ix
    ld l, (ix+4)
    ld h, (ix+5)
    ld e, (ix+6)
    ld d, (ix+7)
    ld (boss_chick_sy), de
    pop ix
    jr .chick_base_ready
.chick_facing_right:
    ld l, (ix+9)
    ld h, (ix+10)
    ld e, (ix+11)
    ld d, (ix+12)
    ld (boss_chick_sy), de
.chick_base_ready:
    ld e, (ix+13)
    ld d, 0
    ld a, b
    or a
    jr z, .chick_sx_ready
.chick_sx_add:
    add hl, de
    djnz .chick_sx_add
.chick_sx_ready:
    ld (boss_sx), hl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_chick_update
; PURPOSE: Telegraph, charge, fall dizzy after a miss, recover.
;   Timers and collision run at 60Hz; body redraw remains deferred.
; INPUT: IX -> boss body. DESTROYS: AF, BC, DE, HL.
; PRESERVES: IX, IY, R#15.
; ------------------------------------------------------------
bitmap_boss_chick_update:
    ld a, (boss_dy)           ; 4 init, 0 windup, 1 charge,
    cp 4                      ; 2 dizzy, 3 recovery.
    jp z, .chick_init
    ld a, (boss_render_phase)
    or a
    call nz, bitmap_boss_render_step
    ld a, (boss_dy)
    or a
    jp z, .chick_windup
    cp 1
    jp z, .chick_charge
    cp 2
    jp z, .chick_dizzy
    jp .chick_recovery
.chick_init:
    xor a
    ld (boss_dy), a
    push ix
    call bitmap_boss_chick_config_ix
    ld a, (ix+1)
    pop ix
    ld (boss_anim_tick), a
    jp bitmap_boss_chick_touch
.chick_windup:
    ld a, (boss_anim_tick)
    or a
    jp z, .chick_choose_dir
    dec a
    ld (boss_anim_tick), a
    jp nz, bitmap_boss_chick_touch
.chick_choose_dir:
    ld a, (boss_render_phase)
    or a
    jp nz, bitmap_boss_chick_touch
    ld a, (boss_x)
    add a, 24
    ld b, a
    ld a, (player_x)
    add a, ${aimOffsetX}
    cp b
    ld a, 2
    jr nc, .chick_dir_ready
    ld a, #FE
.chick_dir_ready:
    ld (boss_dx), a
    ld a, 1
    ld (boss_dy), a
    call bitmap_boss_chick_set_frame
    jp bitmap_boss_chick_touch
.chick_charge:
    ld a, (boss_render_phase)
    or a
    jp nz, bitmap_boss_chick_touch
    ld a, (boss_int_tick)
    inc a
    cp (ix+19)
    jr nc, .chick_step
    ld (boss_int_tick), a
    jp bitmap_boss_chick_touch
.chick_step:
    xor a
    ld (boss_int_tick), a
    ld a, (boss_x)
    ld (boss_old_x), a
    ld b, a
    ld a, (boss_dx)
    add a, b
    cp (ix+5)
    jp c, .chick_miss
    cp (ix+6)
    jp z, .chick_move
    jp nc, .chick_miss
.chick_move:
    ld (boss_x), a
    ld a, (boss_anim_tick)
    inc a
    cp 4                      ; hold each stride for 8px of travel
    jr c, .chick_keep_stride
    xor a
    ld (boss_anim_tick), a
    ld a, (boss_anim_frame)
    xor 1                     ; swap the supporting and raised feet
    call bitmap_boss_chick_select_frame
    jr .chick_frame_ready
.chick_keep_stride:
    ld (boss_anim_tick), a
.chick_frame_ready:
    ld a, 1                   ; uncovered X strip, then body
    ld (boss_render_phase), a
    call bitmap_boss_render_step
    jp bitmap_boss_chick_touch
.chick_miss:
    ld a, 2
    ld (boss_dy), a
    push ix
    call bitmap_boss_chick_config_ix
    ld a, (ix+2)
    pop ix
    ld (boss_anim_tick), a
    ld a, 2
    call bitmap_boss_chick_set_frame
    jp bitmap_boss_chick_touch
.chick_dizzy:
    ld a, (boss_anim_tick)
    or a
    jp z, .chick_end_dizzy
    dec a
    ld (boss_anim_tick), a
    jp z, .chick_end_dizzy
    and 7
    jp nz, bitmap_boss_chick_touch
    ld a, (boss_render_phase)
    or a
    jp nz, bitmap_boss_chick_touch
    ld a, (boss_anim_frame)
    xor 1                     ; alternate poses 2 and 3
    call bitmap_boss_chick_set_frame
    jp bitmap_boss_chick_touch
.chick_end_dizzy:
    ld a, (boss_render_phase)
    or a
    jp nz, bitmap_boss_chick_touch
    jp bitmap_boss_chick_recover
.chick_recovery:
    ld a, (boss_anim_tick)
    or a
    jp z, .chick_restart
    dec a
    ld (boss_anim_tick), a
    jp nz, bitmap_boss_chick_touch
.chick_restart:
    ld a, (boss_render_phase)
    or a
    jp nz, bitmap_boss_chick_touch
    xor a
    ld (boss_dy), a
    push ix
    call bitmap_boss_chick_config_ix
    ld a, (ix+1)
    pop ix
    ld (boss_anim_tick), a
    jp bitmap_boss_chick_touch

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_chick_touch
; PURPOSE: Solid body collision; a downward dizzy stomp removes one boss
;   heart and bounces. A peck removes one player heart and pushes 16px.
; INPUT: IX -> body. DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_boss_chick_touch:
    ld a, (player_x)
    add a, ${hit.x}
    ld b, a
    ld a, (boss_x)
    add a, 44
    cp b
    ret c
    ret z
    ld a, b
    add a, ${hit.w}
    ld c, a
    ld a, (boss_x)
    add a, 4
    cp c
    ret nc
    ld a, (player_y)
    add a, ${hit.y}
    ld b, a
    ld a, (boss_y)
    add a, 44
    cp b
    ret c
    ret z
    ld a, b
    add a, ${hit.h}
    ld c, a                   ; player feet
    ld a, (boss_y)
    add a, 8
    cp c
    ret nc
    ld a, (boss_dy)
    cp 2
    jp nz, .chick_not_stunned
    ld a, (player_vy)
    or a
    jp z, .chick_side
    bit 7, a
    jp nz, .chick_side
    ld a, c
    ld b, a
    ld a, (boss_y)
    add a, 22
    cp b
    jp nc, .chick_side
    add a, 12
    cp b
    jp c, .chick_side
    ld a, (player_invuln)
    or a
    jp nz, .chick_side
    ld a, (boss_y)
    add a, 22
    sub ${hit.y + hit.h}
    ld (player_y), a
    ld a, #F8                 ; bounce upward 8px
    ld (player_vy), a
    xor a
    ld (player_vy_frac), a
    ld a, ${invulnFrames}
    ld (player_invuln), a
    ld a, (boss_hp)
    dec a
    ld (boss_hp), a
    jp z, bitmap_boss_kill
    jp bitmap_boss_chick_recover
.chick_not_stunned:
    cp 1
    jp nz, .chick_side
    ; Only the leading bill hurts during the charge. The broad 40x36 body
    ; bounds above are for solid contact, not for dealing damage: they include
    ; air around the round head and made a one-pixel graze cost a heart.
    ld a, (boss_dx)
    bit 7, a
    jr nz, .chick_peck_left
    ld a, (boss_x)
    add a, 35                 ; right-facing bill core: [35,40)
    ld d, a
    add a, 5
    ld e, a
    jr .chick_peck_x
.chick_peck_left:
    ld a, (boss_x)
    add a, 8                  ; mirrored bill core: [8,13)
    ld d, a
    add a, 5
    ld e, a
.chick_peck_x:
    ld a, (player_x)
    add a, ${hit.x}
    cp e
    jp nc, .chick_charge_graze
    add a, ${hit.w}
    cp d
    jp c, .chick_charge_graze
    jp z, .chick_charge_graze
    ld a, (player_y)
    add a, ${hit.y}
    ld b, a
    ld a, (boss_y)
    add a, 22                 ; bill's lower edge
    cp b
    jp c, .chick_charge_graze
    jp z, .chick_charge_graze
    ld a, b
    add a, ${hit.h}
    ld b, a
    ld a, (boss_y)
    add a, 14                 ; bill's upper edge
    cp b
    jp nc, .chick_charge_graze
    ld a, (player_invuln)
    or a
    jp nz, .chick_side
    ld a, (player_health)
    cp (ix+18)
    jp c, .chick_lethal
    jp z, .chick_lethal
    call bitmap_boss_touch
    call bitmap_boss_chick_push16
    jp bitmap_boss_chick_recover
.chick_lethal:
    call bitmap_boss_touch     ; respawn/game-over owns the player position
    jp bitmap_boss_chick_recover
.chick_charge_graze:
    ; Do not push the player away from the approaching bill before it can
    ; actually meet them. Contact from behind still has a solid body.
    ld a, (player_x)
    add a, ${aimOffsetX}
    ld b, a
    ld a, (boss_dx)
    bit 7, a
    jr nz, .chick_charge_graze_left
    ld a, (boss_x)
    add a, 24
    cp b
    ret c                     ; player is in front of a rightward charge
    ret z
    jp .chick_side
.chick_charge_graze_left:
    ld a, (boss_x)
    add a, 24
    cp b
    ret nc                    ; player is in front of a leftward charge
    jp .chick_side
.chick_side:
    ld a, (player_x)
    add a, ${aimOffsetX}
    ld b, a
    ld a, (boss_x)
    add a, 24
    cp b
    ld a, 1
    jr c, .chick_side_dir
    ld a, #FF
.chick_side_dir:
    jp bitmap_try_move_x

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_chick_push16
; PURPOSE: Push along the peck and stop at the first solid tile.
; INPUT: boss_dx sign. DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_boss_chick_push16:
    ld b, 16
.chick_push_step:
    push bc
    ld a, (player_x)
    push af
    ld a, (boss_dx)
    bit 7, a
    ld a, 1
    jr z, .chick_push_dir
    ld a, #FF
.chick_push_dir:
    call bitmap_try_move_x
    pop bc                    ; B = player X before probe
    ld a, (player_x)
    cp b
    pop bc                    ; B = steps remaining
    ret z
    djnz .chick_push_step
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_chick_recover
; PURPOSE: Protected recovery after a hit or timed-out stun.
; INPUT: IX -> body. DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_boss_chick_recover:
    ld a, 3
    ld (boss_dy), a
    push ix
    call bitmap_boss_chick_config_ix
    ld a, (ix+3)
    pop ix
    ld (boss_anim_tick), a
    xor a
    jp bitmap_boss_chick_set_frame
`;
}

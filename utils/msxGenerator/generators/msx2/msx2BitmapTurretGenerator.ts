/** SCREEN 5 bitmap-room aimed turret runtime (two hardware sprites + one shared bullet). */

export const BITMAP_MAX_TURRET_SLOTS = 2;
const TURRET_STRIDE = 13;
const TABLE_STRIDE = 12;

function byte(value: number): string {
  return `#${Math.max(0, Math.min(255, Math.floor(Number(value) || 0))).toString(16).toUpperCase().padStart(2, '0')}`;
}

function word(value: number): string {
  return `#${Math.max(0, Math.min(0xffff, Math.floor(Number(value) || 0))).toString(16).toUpperCase().padStart(4, '0')}`;
}

export interface BitmapTurretRoomData {
  maxSlots: number;
  roomTables: number[][];
  patternBytes: number[];
  colorBytes: number[];
  bulletPatternBytes: number[];
  bulletColorBytes: number[];
}

export interface BitmapTurretRuntimeOptions {
  /** Konami MegaROM: per-room records live in a data bank, staged into RAM on load. */
  bankedTables?: boolean;
  ramBase: number;
  satBase: number;
  colorBase: number;
  patternBase: number;
  patternGroupBase: number;
  gameYOffset: number;
  playerHitbox: { x: number; y: number; w: number; h: number };
  damageInvulnFrames: number;
  maxHealth: number;
  pauseGateAsm?: string;
}

export interface BitmapTurretSystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  loadCallAsm: string;
  updateCallAsm: string;
  satCallAsm: string;
  routinesAsm: string;
  dataAsm: string;
  /** Room records for the MegaROM data-bank packer; empty on simple32k. */
  bankedBlocks: Array<{ label: string; bytes: number[]; description: string }>;
}

const EMPTY: BitmapTurretSystemAsm = {
  enabled: false, ramBytes: 0, equates: '', loadCallAsm: '', updateCallAsm: '', satCallAsm: '', routinesAsm: '', dataAsm: '', bankedBlocks: [],
};

export function bitmapTurretHardwareSlots(data: BitmapTurretRoomData | undefined): number {
  return data?.maxSlots ? data.maxSlots * 2 + 1 : 0;
}

export function bitmapTurretPatternGroups(data: BitmapTurretRoomData | undefined): number {
  return data?.maxSlots ? data.maxSlots * 2 + 1 : 0;
}

export function buildBitmapTurretSystemAsm(data: BitmapTurretRoomData, opts: BitmapTurretRuntimeOptions): BitmapTurretSystemAsm {
  const maxSlots = Math.max(0, Math.min(BITMAP_MAX_TURRET_SLOTS, data.maxSlots));
  if (!maxSlots) return EMPTY;
  const poolBytes = maxSlots * TURRET_STRIDE;
  const bulletBase = opts.ramBase + 1 + poolBytes;
  // Shared projectile: active,x,y,absDx,absDy,error,signFlags,majorAxis,speed.
  // signFlags bit0=X negative, bit1=Y negative; majorAxis 0=X, 1=Y.
  // MegaROM: records are banked and staged, because bitmap_load_turrets walks
  // them from inside the #8000-#9FFF window.
  const bankedTables = opts.bankedTables === true;
  const TABLE_BYTES = 1 + maxSlots * TABLE_STRIDE;
  const tableBufAddr = opts.ramBase + 1 + poolBytes + 9;
  const ramBytes = 1 + poolBytes + 9 + (bankedTables ? TABLE_BYTES : 0);
  const bulletPattern = (opts.patternGroupBase + maxSlots * 2) * 4;
  const bulletSat = opts.satBase + maxSlots * 8;
  const bulletColor = opts.colorBase + maxSlots * 32;
  const invuln = byte(Math.max(1, opts.damageInvulnFrames || 30));
  const maxHealth = byte(Math.max(1, opts.maxHealth || 1));
  const playerLeft = opts.playerHitbox.x || 0;
  const playerTop = opts.playerHitbox.y || 0;
  const playerRight = playerLeft + Math.max(1, opts.playerHitbox.w || 16);
  const playerBottom = playerTop + Math.max(1, opts.playerHitbox.h || 16);

  const loadBlocks = Array.from({ length: maxSlots }, (_v, i) => {
    const pool = `bitmap_turret_pool + ${i * TURRET_STRIDE}`;
    const patVram = opts.patternBase + (opts.patternGroupBase + i * 2) * 32;
    const colVram = opts.colorBase + i * 32;
    return `    ld a, (bitmap_turret_count)
    cp ${i + 1}
    jp c, .turret_load_${i}_done
    ld a, (ix+0)
    ld (${pool}+0), a         ; centre x
    ld a, (ix+1)
    ld (${pool}+1), a         ; centre y
    ld a, (ix+2)
    ld (${pool}+2), a         ; centre pattern source offset
    ld a, (ix+3)
    ld (${pool}+3), a         ; aim pattern source offset
    ld a, (ix+4)
    ld (${pool}+5), a         ; base direction (0..7)
    ld (${pool}+4), a         ; current aim direction
    ld a, (ix+5)
    ld (${pool}+6), a         ; half arc in 45-degree steps
    ld a, (ix+6)
    ld (${pool}+7), a         ; separation
    ld a, (ix+7)
    ld (${pool}+8), a         ; fire period
    ld (${pool}+10), a        ; initial cooldown
    ld a, (ix+8)
    ld (${pool}+9), a         ; bullet speed
    ld a, (ix+11)
    or a
    jp nz, .turret_load_${i}_interval_valid
    inc a                     ; legacy/corrupt zero => every frame
.turret_load_${i}_interval_valid:
    ld (${pool}+11), a        ; logic interval
    ld a, 1
    ld (${pool}+12), a        ; first gameplay frame executes logic
    ld a, (ix+2)
    call bitmap_turret_pattern_offset
    ld de, ${word(patVram)}
    ld bc, 32
    call copy_to_vram_ext
    ld a, (ix+3)
    call bitmap_turret_pattern_offset
    ld de, ${word(patVram + 32)}
    ld bc, 32
    call copy_to_vram_ext
    ld a, (ix+9)
    call bitmap_turret_color_offset
    ld de, ${word(colVram)}
    ld bc, 16
    call copy_to_vram_ext
    ld a, (ix+10)
    call bitmap_turret_color_offset
    ld de, ${word(colVram + 16)}
    ld bc, 16
    call copy_to_vram_ext
.turret_load_${i}_done:
    ld de, ${TABLE_STRIDE}
    add ix, de
`;
  }).join('');

  const aimBlocks = Array.from({ length: maxSlots }, (_v, i) => {
    const pool = `bitmap_turret_pool + ${i * TURRET_STRIDE}`;
    return `    ld a, (bitmap_turret_count)
    cp ${i + 1}
    jp c, .turret_update_${i}_done
    ld ix, ${pool}
    ld a, (ix+12)             ; shared aim/fire logic countdown
    or a
    jp z, .turret_update_${i}_logic_due
    dec a
    ld (ix+12), a
    jp nz, .turret_update_${i}_done
.turret_update_${i}_logic_due:
    ld a, (ix+11)
    or a
    jp nz, .turret_update_${i}_interval_valid
    inc a
.turret_update_${i}_interval_valid:
    ld (ix+12), a
    call bitmap_turret_choose_direction
    ld (ix+4), a
    push af                    ; carry = Player inside configured vision arc
    ld a, (ix+10)
    or a
    jp z, .turret_update_${i}_cool
    dec (ix+10)
.turret_update_${i}_cool:
    pop af
    jp nc, .turret_update_${i}_done
    ld a, (bitmap_turret_bullet_active)
    or a
    jp nz, .turret_update_${i}_done
    ld a, (ix+10)
    or a
    jp nz, .turret_update_${i}_done
    call bitmap_turret_spawn_bullet
.turret_update_${i}_done:
`;
  }).join('');

  const satBlocks = Array.from({ length: maxSlots }, (_v, i) => {
    const pool = `bitmap_turret_pool + ${i * TURRET_STRIDE}`;
    const basePattern = (opts.patternGroupBase + i * 2) * 4;
    const headPattern = basePattern + 4;
    return `    ld a, (bitmap_turret_count)
    cp ${i + 1}
    jp c, .turret_sat_${i}_empty
    ld ix, ${pool}
    ld a, (ix+1)
    add a, ${byte(opts.gameYOffset)}
    out (VDP_DATA_PORT), a
    ld a, (ix+0)
    out (VDP_DATA_PORT), a
    ld a, ${byte(basePattern)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    ld a, (ix+4)
    ld c, (ix+7)
    call bitmap_turret_direction_offset
    ld a, (ix+1)
    add a, c
    add a, ${byte(opts.gameYOffset)}
    out (VDP_DATA_PORT), a
    ld a, (ix+0)
    add a, b
    out (VDP_DATA_PORT), a
    ld a, ${byte(headPattern)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jp .turret_sat_${i}_done
.turret_sat_${i}_empty:
    ld b, 2
.turret_sat_${i}_empty_loop:
    ld a, #D4
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    djnz .turret_sat_${i}_empty_loop
.turret_sat_${i}_done:
`;
  }).join('');

  const equates = `; --- AIMED TURRET runtime: ${maxSlots} x ${TURRET_STRIDE} bytes + one shared bullet ---
; Per slot: centre/pattern/aim/fire fields (11), logicInterval, logicCountdown.
bitmap_turret_count         EQU ${word(opts.ramBase)}
bitmap_turret_pool          EQU ${word(opts.ramBase + 1)}
bitmap_turret_bullet_active EQU ${word(bulletBase)}
bitmap_turret_bullet_x      EQU ${word(bulletBase + 1)}
bitmap_turret_bullet_y      EQU ${word(bulletBase + 2)}
bitmap_turret_bullet_abs_dx EQU ${word(bulletBase + 3)}
bitmap_turret_bullet_abs_dy EQU ${word(bulletBase + 4)}
bitmap_turret_bullet_error  EQU ${word(bulletBase + 5)}
bitmap_turret_bullet_signs  EQU ${word(bulletBase + 6)}
bitmap_turret_bullet_major  EQU ${word(bulletBase + 7)}
bitmap_turret_bullet_speed  EQU ${word(bulletBase + 8)}
${bankedTables ? `; Room record staged out of its data bank (${TABLE_BYTES} bytes) before it is walked.
bitmap_turret_table_buf     EQU ${word(tableBufAddr)}` : ''}
`;

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_load_turrets
; PURPOSE: Load the current room's two-sprite turret records and upload their
;   patterns/line colours. Also clears the single shared bullet.
; INPUT: current_screen_index. OUTPUT: bitmap_turret_count/pool.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IY; IX is saved/restored.
; CALLS: copy_to_vram_ext, bitmap_turret_pattern_offset, bitmap_turret_color_offset.
; ------------------------------------------------------------
bitmap_load_turrets:
    push ix
    xor a
    ld (bitmap_turret_bullet_active), a
${bankedTables ? `    ; Records are banked: resolve the bank, LDIR into RAM, walk the RAM copy.
    push bc
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_turret_bank_table
    add hl, de
    ld c, (hl)
    ld hl, bitmap_room_turret_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, bitmap_turret_table_buf
    ld a, c
    ld bc, ${TABLE_BYTES}
    call bitmap_copy_banked_to_ram
    pop bc
    ld hl, bitmap_turret_table_buf` : `    ld hl, bitmap_room_turret_ptr_table
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a`}
    ld a, (hl)
    ld (bitmap_turret_count), a
    inc hl
    push hl
    pop ix
${loadBlocks}    ; Shared bullet pattern and colour (one hardware slot per screen).
    ; The turret pattern-group range may be reused by another subsystem
    ; (enemies/platforms) in rooms without turrets, so this upload must not
    ; touch VRAM when the room has no turret: it would corrupt whichever
    ; sprite patterns currently live in the shared groups.
    ld a, (bitmap_turret_count)
    or a
    jp z, .turret_load_no_bullet
    ld hl, bitmap_turret_bullet_pattern
    ld de, ${word(opts.patternBase + (opts.patternGroupBase + maxSlots * 2) * 32)}
    ld bc, 32
    call copy_to_vram_ext
    ld hl, bitmap_turret_bullet_colors
    ld de, ${word(bulletColor)}
    ld bc, 16
    call copy_to_vram_ext
.turret_load_no_bullet:
    pop ix
    ret

bitmap_turret_pattern_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, bitmap_turret_patterns
    add hl, de
    ret

bitmap_turret_color_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, bitmap_turret_colors
    add hl, de
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_turret_choose_direction
; PURPOSE: Quantize the vector from turret centre to Player centre into 8
;   directions (0=R,1=DR,2=D,3=DL,4=L,5=UL,6=U,7=UR), then test the authored arc.
; INPUT: IX -> turret slot. OUTPUT: A=direction; carry set iff inside vision arc.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_turret_choose_direction:
    ld a, (player_x)
    add a, ${byte(Math.floor((playerLeft + playerRight) / 2))}
    sub (ix+0)
    ld d, 0                    ; D=0 right, D=4 left
    jp nc, .turret_dx_ready
    neg
    ld d, 4
.turret_dx_ready:
    ld b, a                    ; B=abs dx
    ld a, (player_y)
    add a, ${byte(Math.floor((playerTop + playerBottom) / 2))}
    sub (ix+1)
    ld e, 0                    ; E=0 down, E=4 up marker
    jp nc, .turret_dy_ready
    neg
    ld e, 4
.turret_dy_ready:
    ld c, a                    ; C=abs dy
    ld a, c
    add a, a
    jp c, .turret_not_horizontal
    cp b
    jp c, .turret_horizontal
    jp z, .turret_horizontal
.turret_not_horizontal:
    ld a, b
    add a, a
    jp c, .turret_diagonal
    cp c
    jp c, .turret_vertical
    jp z, .turret_vertical
.turret_diagonal:
    ld a, d
    or a
    jp nz, .turret_diag_left
    ld a, e
    or a
    ld a, 1
    jp z, .turret_arc_test
    ld a, 7
    jp .turret_arc_test
.turret_diag_left:
    ld a, e
    or a
    ld a, 3
    jp z, .turret_arc_test
    ld a, 5
    jp .turret_arc_test
.turret_horizontal:
    ld a, d
    jp .turret_arc_test
.turret_vertical:
    ld a, e
    or a
    ld a, 2
    jp z, .turret_arc_test
    ld a, 6
.turret_arc_test:
    ld h, a                    ; preserve selected direction
    sub (ix+5)
    and 7
    cp 5
    jp c, .turret_arc_distance
    neg
    and 7
.turret_arc_distance:
    ld l, (ix+6)
    inc l
    cp l
    ld a, h
    ret c
    or a                       ; clear carry: outside arc
    ret

; INPUT A=direction, C=separation. OUTPUT B=signed dx, C=signed dy.
bitmap_turret_direction_offset:
    and 7
    or a
    jp z, .turret_off_r
    cp 1
    jp z, .turret_off_dr
    cp 2
    jp z, .turret_off_d
    cp 3
    jp z, .turret_off_dl
    cp 4
    jp z, .turret_off_l
    cp 5
    jp z, .turret_off_ul
    cp 6
    jp z, .turret_off_u
    ld b, c
    ld a, c
    neg
    ld c, a
    ret
.turret_off_r: ld b, c
    ld c, 0
    ret
.turret_off_dr: ld b, c
    ret
.turret_off_d: ld b, 0
    ret
.turret_off_dl: ld a, c
    neg
    ld b, a
    ret
.turret_off_l: ld a, c
    neg
    ld b, a
    ld c, 0
    ret
.turret_off_ul: ld a, c
    neg
    ld b, a
    ld c, a
    ret
.turret_off_u: ld b, 0
    ld a, c
    neg
    ld c, a
    ret

; INPUT IX -> firing turret. One global bullet means a second turret cannot fire
; until the current projectile disappears. The movement vector is latched from
; player centre - turret centre; speed scales traversal along its major axis.
; DESTROYS AF/BC/DE/HL. PRESERVES IX/IY.
bitmap_turret_spawn_bullet:
    ld a, (ix+9)
    ld (bitmap_turret_bullet_speed), a
    xor a
    ld (bitmap_turret_bullet_error), a
    ld c, a                    ; C = sign flags

    ; dx = player centre X - turret centre X (bit0 marks negative).
    ld a, (player_x)
    add a, ${byte(Math.floor((playerLeft + playerRight) / 2))}
    sub (ix+0)
    jp nc, .turret_spawn_dx_positive
    neg
    set 0, c
.turret_spawn_dx_positive:
    ld (bitmap_turret_bullet_abs_dx), a

    ; dy = player centre Y - turret centre Y (bit1 marks negative).
    ld a, (player_y)
    add a, ${byte(Math.floor((playerTop + playerBottom) / 2))}
    sub (ix+1)
    jp nc, .turret_spawn_dy_positive
    neg
    set 1, c
.turret_spawn_dy_positive:
    ld (bitmap_turret_bullet_abs_dy), a
    ld a, c
    ld (bitmap_turret_bullet_signs), a

    ; majorAxis = absDy > absDx. If both deltas are zero, force +X.
    ld a, (bitmap_turret_bullet_abs_dx)
    ld b, a
    ld a, (bitmap_turret_bullet_abs_dy)
    or b
    jp nz, .turret_spawn_has_vector
    inc b
    ld a, b
    ld (bitmap_turret_bullet_abs_dx), a
.turret_spawn_has_vector:
    ld a, (bitmap_turret_bullet_abs_dy)
    cp b
    ld a, 0
    jp c, .turret_spawn_major_ready
    jp z, .turret_spawn_major_ready
    inc a
.turret_spawn_major_ready:
    ld (bitmap_turret_bullet_major), a

    ; Spawn at the outer aiming sprite selected by the visual 8-way direction.
    ld a, (ix+4)
    ld c, (ix+7)
    call bitmap_turret_direction_offset
    ld a, (ix+0)
    add a, b
    add a, 4
    ld (bitmap_turret_bullet_x), a
    ld a, (ix+1)
    add a, c
    add a, 4
    ld (bitmap_turret_bullet_y), a
    ld a, 1
    ld (bitmap_turret_bullet_active), a
    ld a, (ix+8)
    ld (ix+10), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_turrets
; PURPOSE: Aim every room turret at the Player, enforce its angular vision arc,
;   and let the first eligible turret claim the single shared projectile.
; INPUT: turret/player RAM. OUTPUT: aim dirs/cooldowns and optional bullet spawn.
; DESTROYS: AF, BC, DE, HL, IX. PRESERVES: IY.
; ------------------------------------------------------------
bitmap_update_turrets:
${opts.pauseGateAsm || ''}${aimBlocks}    jp bitmap_turret_step_bullet

; Move the projectile along the exact signed vector latched at spawn. A Bresenham
; error accumulator preserves dx:dy without division/floating point. The speed
; setting is the number of one-pixel major-axis steps per frame, so collision is
; checked after every pixel and fast bullets cannot tunnel through solid tiles.
; DESTROYS AF/BC/DE/HL. PRESERVES IX/IY.
bitmap_turret_step_bullet:
    ld a, (bitmap_turret_bullet_active)
    or a
    ret z
    ld a, (bitmap_turret_count)
    or a
    jp z, .turret_bullet_hide
    ld a, (bitmap_turret_bullet_speed)
    ld b, a
.turret_bullet_pixel_loop:
    push bc
    call bitmap_turret_step_vector_pixel
    pop bc
    jp c, .turret_bullet_hide
.turret_bullet_probe:
    push bc
    ld a, (bitmap_turret_bullet_x)
    add a, 4
    ld b, a
    ld a, (bitmap_turret_bullet_y)
    add a, 4
    ld c, a
    call bitmap_probe_solid
    pop bc
    jp nz, .turret_bullet_hide
    push bc
    call bitmap_turret_bullet_hits_player
    pop bc
    ld a, (bitmap_turret_bullet_active)
    or a
    ret z
    djnz .turret_bullet_pixel_loop
    ret
.turret_bullet_hide:
    xor a
    ld (bitmap_turret_bullet_active), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_turret_step_vector_pixel
; PURPOSE: One Bresenham pixel step using the latched signed vector.
; INPUT: bullet vector RAM. OUTPUT: position updated; carry set on screen exit.
; DESTROYS: AF/DE/HL. PRESERVES: BC/IX/IY.
; ------------------------------------------------------------
bitmap_turret_step_vector_pixel:
    ld a, (bitmap_turret_bullet_major)
    or a
    jp nz, .turret_vector_major_y

    ; X-major: X always moves; Y moves when error+absDy >= absDx.
    call bitmap_turret_step_x_signed
    ret c
    ld a, (bitmap_turret_bullet_abs_dy)
    ld d, a
    ld a, (bitmap_turret_bullet_abs_dx)
    ld e, a
    ld a, (bitmap_turret_bullet_error)
    add a, d
    jp c, .turret_vector_x_minor
    cp e
    jp c, .turret_vector_store_error
.turret_vector_x_minor:
    sub e
    ld (bitmap_turret_bullet_error), a
    jp bitmap_turret_step_y_signed
.turret_vector_store_error:
    ld (bitmap_turret_bullet_error), a
    or a
    ret

.turret_vector_major_y:
    ; Y-major: Y always moves; X moves when error+absDx >= absDy.
    call bitmap_turret_step_y_signed
    ret c
    ld a, (bitmap_turret_bullet_abs_dx)
    ld d, a
    ld a, (bitmap_turret_bullet_abs_dy)
    ld e, a
    ld a, (bitmap_turret_bullet_error)
    add a, d
    jp c, .turret_vector_y_minor
    cp e
    jp c, .turret_vector_store_error
.turret_vector_y_minor:
    sub e
    ld (bitmap_turret_bullet_error), a
    jp bitmap_turret_step_x_signed

; Signed X/Y helpers. Carry signals leaving the 256x192 gameplay area.
bitmap_turret_step_x_signed:
    ld a, (bitmap_turret_bullet_signs)
    bit 0, a
    jp nz, .turret_vector_x_negative
    ld a, (bitmap_turret_bullet_x)
    inc a
    jp z, .turret_vector_axis_exit
    ld (bitmap_turret_bullet_x), a
    or a
    ret
.turret_vector_x_negative:
    ld a, (bitmap_turret_bullet_x)
    or a
    scf
    ret z
    dec a
    ld (bitmap_turret_bullet_x), a
    or a
    ret

bitmap_turret_step_y_signed:
    ld a, (bitmap_turret_bullet_signs)
    bit 1, a
    jp nz, .turret_vector_y_negative
    ld a, (bitmap_turret_bullet_y)
    inc a
    cp 192
    jp nc, .turret_vector_axis_exit
    ld (bitmap_turret_bullet_y), a
    or a
    ret
.turret_vector_y_negative:
    ld a, (bitmap_turret_bullet_y)
    or a
    scf
    ret z
    dec a
    ld (bitmap_turret_bullet_y), a
    or a
    ret
.turret_vector_axis_exit:
    scf
    ret

; AABB bullet (8x8) vs configured Player body. Impact always consumes the bullet;
; player_invuln prevents repeated heart loss. Exactly one health point is removed.
bitmap_turret_bullet_hits_player:
    ld a, (bitmap_turret_bullet_x)
    add a, 8
    ld b, a
    ld a, (player_x)
${playerLeft ? `    add a, ${byte(playerLeft)}\n` : ''}    cp b
    ret nc
    ld a, (player_x)
${playerRight ? `    add a, ${byte(playerRight)}\n` : ''}    ld b, a
    ld a, (bitmap_turret_bullet_x)
    cp b
    ret nc
    ld a, (bitmap_turret_bullet_y)
    add a, 8
    ld b, a
    ld a, (player_y)
${playerTop ? `    add a, ${byte(playerTop)}\n` : ''}    cp b
    ret nc
    ld a, (player_y)
${playerBottom ? `    add a, ${byte(playerBottom)}\n` : ''}    ld b, a
    ld a, (bitmap_turret_bullet_y)
    cp b
    ret nc
    xor a
    ld (bitmap_turret_bullet_active), a
    ld a, (player_invuln)
    or a
    ret nz
    ld a, (player_health)
    dec a
    ld (player_health), a
    jp nz, .turret_damage_iframes
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jp nz, .turret_damage_respawn
    ld a, 1
    ld (bitmap_game_over_flag), a
.turret_damage_respawn:
    ld a, ${maxHealth}
    ld (player_health), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_x_table
    add hl, de
    ld a, (hl)
    ld (player_x), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_y_table
    add hl, de
    ld a, (hl)
    ld (player_y), a
.turret_damage_iframes:
    ld a, ${invuln}
    ld (player_invuln), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_turret_sat
; PURPOSE: Write two hardware sprites per turret plus the one shared bullet,
;   then append the SAT terminator. Direction offset is recomputed for display.
; INPUT: turret/bullet RAM. OUTPUT: SAT at ${word(opts.satBase)}.
; DESTROYS: AF, BC, DE, HL, IX. PRESERVES: IY.
; ------------------------------------------------------------
bitmap_update_turret_sat:
    ld de, ${word(opts.satBase)}
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
${satBlocks}    ld a, (bitmap_turret_bullet_active)
    or a
    jp z, .turret_sat_bullet_empty
    ld a, (bitmap_turret_bullet_y)
    add a, ${byte(opts.gameYOffset)}
    out (VDP_DATA_PORT), a
    ld a, (bitmap_turret_bullet_x)
    out (VDP_DATA_PORT), a
    ld a, ${byte(bulletPattern)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jp .turret_sat_bullet_done
.turret_sat_bullet_empty:
    ld a, #D4
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.turret_sat_bullet_done:
    ld a, #D8
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    ret
`;

  const emit = (label: string, bytes: number[], comment: string): string => {
    const lines = [`; ${comment}`, `${label}:`];
    for (let i = 0; i < bytes.length; i += 16) lines.push(`    DB ${bytes.slice(i, i + 16).map(byte).join(',')}`);
    return lines.join('\n') + '\n';
  };
  const dataAsm = (bankedTables ? [] : data.roomTables).map((table, i) => emit(`bitmap_room_turret_table_${i}`, table, `Room ${i}: count + ${maxSlots} aimed turret records`)).join('')
    + `bitmap_room_turret_ptr_table:\n${data.roomTables.map((_t, i) => `    DW bitmap_room_turret_table_${i}`).join('\n')}\n`
    + (bankedTables
      ? `bitmap_room_turret_bank_table:\n    DB ${data.roomTables.map((_t, i) => `bitmap_room_turret_table_${i}_DATA_BANK`).join(',')}\n`
      : '')
    + emit('bitmap_turret_patterns', data.patternBytes, 'Turret centre/head hardware sprite patterns')
    + emit('bitmap_turret_colors', data.colorBytes, 'Turret centre/head line colours')
    + emit('bitmap_turret_bullet_pattern', data.bulletPatternBytes, 'Single shared enemy bullet pattern')
    + emit('bitmap_turret_bullet_colors', data.bulletColorBytes, 'Single shared enemy bullet line colours');

  return {
    enabled: true,
    ramBytes,
    equates,
    loadCallAsm: '    call bitmap_load_turrets\n',
    updateCallAsm: '    call bitmap_update_turrets\n',
    satCallAsm: '    call bitmap_update_turret_sat\n',
    routinesAsm,
    dataAsm,
    bankedBlocks: bankedTables
      ? data.roomTables.map((table, i) => ({
        label: `bitmap_room_turret_table_${i}`,
        bytes: table,
        description: `Room ${i} turret records, banked; staged into bitmap_turret_table_buf by bitmap_load_turrets`,
      }))
      : [],
  };
}

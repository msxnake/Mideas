/** Complete canvas plus positioned 16x16 parts, across the selected frames. */
export function getEnemySpriteBodyBounds(size: { width: number; height: number } | undefined, cells: Array<{ x: number; y: number }>) {
  const left = Math.min(0, ...cells.map(cell => cell.x));
  const top = Math.min(0, ...cells.map(cell => cell.y));
  const right = Math.max(Number(size?.width) || 16, ...cells.map(cell => cell.x + 16));
  const bottom = Math.max(Number(size?.height) || 16, ...cells.map(cell => cell.y + 16));
  if (left < -128 || top < -128 || right - left > 256 || bottom - top > 192) {
    throw new Error('SCREEN 5 complete enemy body must fit inside a 256x192 room with signed part offsets.');
  }
  return { left, top, right, bottom, bytes: [left & 0xff, top & 0xff, right - left - 1, bottom - top - 1] };
}

/** Full visual-body probes for the SCREEN 5 scripted enemy interpreter.
 * The resident descriptor is keyed by the slot's base colour offset, so bodies
 * sharing a behaviour can have different sizes without changing the pool stride.
 * Extents are inclusive spans (width-1/height-1), allowing a 256px wide body.
 */
export function buildEnemyBodyCollisionAsm(options: {
  boundsLabel: string; visualXOffset: number; visualYOffset: number; floorProbe: string; skipAbove?: boolean;
}): string {
  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_body_load
; PURPOSE: Cache this body's signed offsets and inclusive spans, once per tick.
; INPUT: IX=slot; (ix+12)=base colour block. OUTPUT: four shared body bytes.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
; CALLS: None. SIDE EFFECTS: shared RAM only; resident data, no bank switch.
; ------------------------------------------------------------
bitmap_enemy_body_load:
    ld l, (ix+12)
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, ${options.boundsLabel}
    add hl, de
    ld de, bitmap_enemy_body_bounds
    push bc
    ld bc, 4
    ldir
    pop bc
    ret
; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_body_origin
; PURPOSE: Resolve the complete rectangle from logical origin and signed offsets.
; INPUT: IX=slot, cached descriptor. OUTPUT: DE=left/top, carry=outside room.
; DESTROYS: AF, HL. PRESERVES: BC, IX, IY. DE is output.
; CALLS: bitmap_enemy_body_add_offset. SIDE EFFECTS: None.
; ------------------------------------------------------------
bitmap_enemy_body_origin:
    ld a, (bitmap_enemy_body_bounds)
    ld h, a
    ld a, (ix+0)
    sub (ix+${options.visualXOffset})
    call bitmap_enemy_body_add_offset
    ret c
    ld d, a
    ld a, (bitmap_enemy_body_bounds+1)
    ld h, a
    ld a, (ix+1)
    sub (ix+${options.visualYOffset})
    call bitmap_enemy_body_add_offset
    ret c
    ld e, a
    ld a, (bitmap_enemy_body_bounds+2)
    add a, d
    ret c
    ld a, (bitmap_enemy_body_bounds+3)
    add a, e
    ret c
    cp 192
    jp nc, .body_outside
    or a
    ret
.body_outside:
    scf
    ret
; FUNCTION: bitmap_enemy_body_add_offset
; PURPOSE: Add a signed offset without wrapping a room coordinate.
; INPUT: A=coordinate, H=signed offset. OUTPUT: A=sum; carry=out of range.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY. CALLS: None.
bitmap_enemy_body_add_offset:
    bit 7, h
    jp nz, .body_negative_offset
    add a, h
    ret
.body_negative_offset:
    add a, h
    ccf
    ret
; ------------------------------------------------------------
; Full-body probes preserve BC/DE/HL/IX/IY, destroy AF and return NZ=blocked.
; The scans visit every 8px quadrant crossed by an edge. This covers solid
; 16px tiles and their 8x8 masks even when the origin is not grid aligned.
; CALLS: body_origin, scans, bitmap_probe_solid / ${options.floorProbe}.
; SIDE EFFECTS: None; no VDP or mapper state changes.
; ------------------------------------------------------------
bitmap_enemy_script_probe_ahead:
    ld a, (ix+2)
    jp bitmap_enemy_body_probe_side
bitmap_enemy_body_probe_back:
    ld a, (ix+2)
    or a
    jp nz, .body_back_facing
    inc a
.body_back_facing:
    neg
bitmap_enemy_body_probe_side:
    push bc
    push de
    push hl
    push af
    call bitmap_enemy_body_origin
    jp c, .side_outside
    pop af
    bit 7, a
    jp nz, .side_left
    ld a, (bitmap_enemy_body_bounds+2)
    add a, d
    inc a
    jp z, bitmap_enemy_body_probe_edge
    jp .side_ready
.side_left:
    ld a, d
    or a
    jp z, bitmap_enemy_body_probe_edge
    dec a
.side_ready:
    ld b, a
    ld c, e
    ld a, (bitmap_enemy_body_bounds+3)
    add a, e
    ld d, a
    call bitmap_enemy_body_scan_y
    jp bitmap_enemy_body_probe_return
.side_outside:
    pop af
    jp bitmap_enemy_body_probe_edge
bitmap_enemy_script_probe_below:
    push bc
    push de
    push hl
    call bitmap_enemy_body_origin
    jp c, bitmap_enemy_body_probe_edge
    ld a, (bitmap_enemy_body_bounds+3)
    add a, e
    inc a
    ld c, a
    ld b, d
    ld a, (bitmap_enemy_body_bounds+2)
    add a, d
    ld d, a
    call bitmap_enemy_body_scan_floor_x
    jp bitmap_enemy_body_probe_return
bitmap_enemy_script_probe_head:
    push bc
    push de
    push hl
    call bitmap_enemy_body_origin
    jp c, bitmap_enemy_body_probe_edge
    ld a, e
    or a
    jp z, bitmap_enemy_body_probe_edge
    dec a
    ld c, a
    ld b, d
    ld a, (bitmap_enemy_body_bounds+2)
    add a, d
    ld d, a
    call bitmap_enemy_body_scan_solid_x
    jp bitmap_enemy_body_probe_return
bitmap_enemy_script_probe_floor_ahead:
    push bc
    push de
    push hl
    call bitmap_enemy_body_origin
    jp c, bitmap_enemy_body_probe_edge
    ld a, (bitmap_enemy_body_bounds+3)
    add a, e
    inc a
    ld c, a
    ld a, (ix+2)
    bit 7, a
    jp nz, .floor_ahead_left
    ld a, (bitmap_enemy_body_bounds+2)
    add a, d
    inc a
    jp z, bitmap_enemy_body_probe_edge
    jp .floor_ahead_ready
.floor_ahead_left:
    ld a, d
    or a
    jp z, bitmap_enemy_body_probe_edge
    dec a
.floor_ahead_ready:
    ld b, a
    call ${options.floorProbe}
    jp bitmap_enemy_body_probe_return
${options.skipAbove ? '' : `bitmap_enemy_script_probe_above:
    push bc
    push de
    push hl
    call bitmap_enemy_body_origin
    jp c, bitmap_enemy_body_probe_edge
    ld a, (bitmap_enemy_script_arg)
    add a, a
    add a, a
    add a, a
    add a, a
    ld b, a
    ld a, e
    sub b
    jp c, bitmap_enemy_body_probe_edge
    ld c, a
    ld b, d
    ld a, (bitmap_enemy_body_bounds+2)
    add a, d
    ld d, a
    call bitmap_enemy_body_scan_solid_x
    jp bitmap_enemy_body_probe_return
`}
bitmap_enemy_body_probe_edge:
    ld a, 1
    or a
bitmap_enemy_body_probe_return:
    pop hl
    pop de
    pop bc
    ret
; FUNCTION: bitmap_enemy_body_scan_y
; INPUT: B=X, C=first Y, D=last inclusive Y. OUTPUT: NZ=solid.
; DESTROYS: AF, C, HL. PRESERVES: B, DE, IX, IY.
; CALLS: bitmap_probe_solid. SIDE EFFECTS: None.
bitmap_enemy_body_scan_y:
    push de
    call bitmap_probe_solid
    pop de
    ret nz
    ld a, c
    or 7
    inc a
    jp z, .scan_y_clear
    cp d
    jp z, .scan_y_next
    jp nc, .scan_y_clear
.scan_y_next:
    ld c, a
    jp bitmap_enemy_body_scan_y
.scan_y_clear:
    xor a
    ret
; FUNCTION: bitmap_enemy_body_scan_floor_x / bitmap_enemy_body_scan_solid_x
; INPUT: B=first X, C=Y, D=last inclusive X. OUTPUT: NZ=solid.
; DESTROYS: AF, B, E, HL. PRESERVES: C, D, IX, IY.
; CALLS: bitmap_probe_solid / ${options.floorProbe}. SIDE EFFECTS: None.
bitmap_enemy_body_scan_floor_x:
    ld e, 1
    jp bitmap_enemy_body_scan_x_loop
bitmap_enemy_body_scan_solid_x:
    ld e, 0
bitmap_enemy_body_scan_x_loop:
    ld a, e
    push de
    or a
    jp z, .scan_x_solid
    call ${options.floorProbe}
    jp .scan_x_result
.scan_x_solid:
    call bitmap_probe_solid
.scan_x_result:
    pop de
    ret nz
    ld a, b
    or 7
    inc a
    jp z, .scan_x_clear
    cp d
    jp z, .scan_x_next
    jp nc, .scan_x_clear
.scan_x_next:
    ld b, a
    jp bitmap_enemy_body_scan_x_loop
.scan_x_clear:
    xor a
    ret
`;
}

/** Existing WalkerGravity behaviour with complete-body terrain probes. */
export function buildEnemyBodyWalkerAsm(): string {
  return `.enemy_step_walker_gravity:
    call bitmap_enemy_body_load
    ld d, (ix+21)
.body_walker_fall:
    call bitmap_enemy_script_probe_below
    jp nz, .body_walker_ground
    inc (ix+1)
    dec d
    jp nz, .body_walker_fall
    jp .enemy_anim
.body_walker_ground:
    ld d, (ix+21)
    ld a, (ix+2)
    or a
    jp nz, .body_walker_step
    ld (ix+2), #01
.body_walker_step:
    bit 7, (ix+2)
    jp nz, .body_walker_left
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .body_walker_turn_left
    call bitmap_enemy_script_probe_ahead
    jp nz, .body_walker_turn_left
    inc (ix+0)
    dec d
    jp nz, .body_walker_step
    jp .enemy_anim
.body_walker_left:
    ld a, (ix+0)
    cp (ix+4)
    jp z, .body_walker_turn_right
    jp c, .body_walker_turn_right
    call bitmap_enemy_script_probe_ahead
    jp nz, .body_walker_turn_right
    dec (ix+0)
    dec d
    jp nz, .body_walker_step
    jp .enemy_anim
.body_walker_turn_left:
    ld (ix+2), #FF
    jp .enemy_anim
.body_walker_turn_right:
    ld (ix+2), #01
    jp .enemy_anim
`;
}

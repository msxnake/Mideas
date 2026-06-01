import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { Msx2Screen4TileScreen } from '../../../../types';
import { buildMsx2GridSnapCharDrawAsm } from './msx2GridSnapComponentGenerator';
import {
  MSX2_MAX_PUSH_BOXES_PER_SCREEN,
  getMsx2PushBoxRuntimeSlots,
  usesMsx2PushBoxFromScreens,
} from './msx2PushBoxRuntimeGenerator';

const formatHexByte = (value: number): string => `#${Math.max(0, Math.min(255, value)).toString(16).toUpperCase().padStart(2, '0')}`;
const formatHexWord = (value: number): string => `#${Math.max(0, Math.min(0xFFFF, value)).toString(16).toUpperCase().padStart(4, '0')}`;

const formatBytes = (label: string, bytes: number[], comment?: string): string => {
  const lines: string[] = [];
  if (comment) lines.push(`; ${comment}`);
  lines.push(`${label}:`);
  for (let offset = 0; offset < bytes.length; offset += 16) {
    lines.push(`    DB ${bytes.slice(offset, offset + 16).map(value => formatHexByte(value)).join(',')}`);
  }
  return `${lines.join('\n')}\n`;
};

// RAM layout (MAX = MSX2_MAX_PUSH_BOXES_PER_SCREEN = 8):
// +0          count
// +1          try_dx
// +2          try_dy
// +3          draw_char scratch
// +4          active slot scratch
// +5          moving_slot (#FF = none)
// +6          speed scratch
// +7          move_mode (0=push slide, 1=gravity fall)
// +8..+15     runtime_x[8]
// +16..+23    runtime_y[8]
// +24..+31    runtime_offset_x[8] (box_x - player_x when slide starts)
// +32..+39    runtime_offset_y[8] (box_y - player_center_y when slide starts)
// +40..+47    runtime_moving[8] (0=chars visible, 1=sliding, 2=defer chars until L/R release)
// +48..+55    runtime_slide_remaining[8] (0=done, 1-8=frames to slide)
// +56         defer_char_slot (#FF=none, else slot showing sprite until L/R release)
export const MSX2_PUSH_BOX_RAM_BASE = 0xC047;
export const MSX2_PUSH_BOX_RUNTIME_BYTES = 8 + MSX2_MAX_PUSH_BOXES_PER_SCREEN * 6 + 1;

export function usesMsx2PushBox(
  analysis: ProjectAnalysis,
  tileScreens: Array<Msx2Screen4TileScreen | undefined> = []
): boolean {
  if (usesMsx2PushBoxFromScreens(tileScreens)) return true;
  const screens = (analysis as any)?.msx2Screen4TileScreens as Msx2Screen4TileScreen[] | undefined;
  return usesMsx2PushBoxFromScreens(screens || []);
}

export function buildMsx2PushBoxEquates(ramBase = MSX2_PUSH_BOX_RAM_BASE): string {
  const slotBytes = MSX2_MAX_PUSH_BOXES_PER_SCREEN;
  return `msx2_push_box_count EQU ${formatHexWord(ramBase)}
msx2_push_box_try_dx EQU ${formatHexWord(ramBase + 1)}
msx2_push_box_try_dy EQU ${formatHexWord(ramBase + 2)}
msx2_push_box_draw_char EQU ${formatHexWord(ramBase + 3)}
msx2_push_box_active EQU ${formatHexWord(ramBase + 4)}
msx2_push_box_moving_slot EQU ${formatHexWord(ramBase + 5)}
msx2_push_box_speed_scratch EQU ${formatHexWord(ramBase + 6)}
msx2_push_box_move_mode EQU ${formatHexWord(ramBase + 7)}
msx2_push_box_runtime_x EQU ${formatHexWord(ramBase + 8)}
msx2_push_box_runtime_y EQU ${formatHexWord(ramBase + 8 + slotBytes)}
msx2_push_box_runtime_offset_x EQU ${formatHexWord(ramBase + 8 + slotBytes * 2)}
msx2_push_box_runtime_offset_y EQU ${formatHexWord(ramBase + 8 + slotBytes * 3)}
msx2_push_box_runtime_moving EQU ${formatHexWord(ramBase + 8 + slotBytes * 4)}
msx2_push_box_runtime_slide_remaining EQU ${formatHexWord(ramBase + 8 + slotBytes * 5)}
msx2_push_box_defer_char_slot EQU ${formatHexWord(ramBase + 8 + slotBytes * 6)}
msx2_push_box_runtime_end EQU ${formatHexWord(ramBase + MSX2_PUSH_BOX_RUNTIME_BYTES)}
MSX2_MAX_PUSH_BOXES_PER_SCREEN EQU ${MSX2_MAX_PUSH_BOXES_PER_SCREEN}
`;
}

function buildPushBoxRuntimeTables(
  tileScreens: Array<Msx2Screen4TileScreen | undefined>,
  resolveTileBytes: (screen: Msx2Screen4TileScreen | undefined, entity: any) => { pattern: number[]; color: number[] } | undefined
): {
  countBytes: number[];
  xBytes: number[];
  yBytes: number[];
  charBaseBytes: number[];
  speedBytes: number[];
  gravityBytes: number[];
} {
  const pushBoxes = tileScreens.map(screen => getMsx2PushBoxRuntimeSlots(screen, resolveTileBytes));
  const countBytes = pushBoxes.map(boxes => Math.min(MSX2_MAX_PUSH_BOXES_PER_SCREEN, boxes.length));
  const xBytes = pushBoxes.flatMap(boxes =>
    Array.from({ length: MSX2_MAX_PUSH_BOXES_PER_SCREEN }, (_unused, index) => boxes[index]?.x ?? 0)
  );
  const yBytes = pushBoxes.flatMap(boxes =>
    Array.from({ length: MSX2_MAX_PUSH_BOXES_PER_SCREEN }, (_unused, index) => boxes[index]?.y ?? 0)
  );
  const charBaseBytes = pushBoxes.flatMap(boxes =>
    Array.from({ length: MSX2_MAX_PUSH_BOXES_PER_SCREEN }, (_unused, index) => boxes[index]?.charBase ?? 0)
  );
  const speedBytes = pushBoxes.flatMap(boxes =>
    Array.from({ length: MSX2_MAX_PUSH_BOXES_PER_SCREEN }, (_unused, index) => boxes[index]?.moveSpeed ?? 1)
  );
  const gravityBytes = pushBoxes.flatMap(boxes =>
    Array.from({ length: MSX2_MAX_PUSH_BOXES_PER_SCREEN }, (_unused, index) => boxes[index]?.gravity ?? 1)
  );
  return { countBytes, xBytes, yBytes, charBaseBytes, speedBytes, gravityBytes };
}

export function buildMsx2PushBoxDataTables(
  tileScreens: Array<Msx2Screen4TileScreen | undefined>,
  resolveTileBytes: (screen: Msx2Screen4TileScreen | undefined, entity: any) => { pattern: number[]; color: number[] } | undefined
): string {
  if (!usesMsx2PushBoxFromScreens(tileScreens)) return '';
  const tables = buildPushBoxRuntimeTables(tileScreens, resolveTileBytes);
  return `${formatBytes('msx2_screen_push_box_count', tables.countBytes.length ? tables.countBytes : [0], 'Per-msx2screen push box count')}
${formatBytes('msx2_screen_push_box_x', tables.xBytes.length ? tables.xBytes : Array(MSX2_MAX_PUSH_BOXES_PER_SCREEN).fill(0), `Per-msx2screen push box initial X (8-aligned px), ${MSX2_MAX_PUSH_BOXES_PER_SCREEN} slots/screen`)}
${formatBytes('msx2_screen_push_box_y', tables.yBytes.length ? tables.yBytes : Array(MSX2_MAX_PUSH_BOXES_PER_SCREEN).fill(0), `Per-msx2screen push box initial Y (8-aligned px), ${MSX2_MAX_PUSH_BOXES_PER_SCREEN} slots/screen`)}
${formatBytes('msx2_screen_push_box_char_base', tables.charBaseBytes.length ? tables.charBaseBytes : Array(MSX2_MAX_PUSH_BOXES_PER_SCREEN).fill(0), `Per-msx2screen push box 2x2 char block base, ${MSX2_MAX_PUSH_BOXES_PER_SCREEN} slots/screen`)}
${formatBytes('msx2_screen_push_box_speed', tables.speedBytes.length ? tables.speedBytes : Array(MSX2_MAX_PUSH_BOXES_PER_SCREEN).fill(1), `Per-msx2screen push box slide speed (px/frame), ${MSX2_MAX_PUSH_BOXES_PER_SCREEN} slots/screen`)}
${formatBytes('msx2_screen_push_box_gravity', tables.gravityBytes.length ? tables.gravityBytes : Array(MSX2_MAX_PUSH_BOXES_PER_SCREEN).fill(1), `Per-msx2screen push box gravity flag (1=fall in gaps, 0=static), ${MSX2_MAX_PUSH_BOXES_PER_SCREEN} slots/screen`)}
`;
}

export function buildMsx2PushBoxPlayerHookAsm(direction: 'right' | 'left' | 'up' | 'down'): string {
  const dx = direction === 'right' ? 0x08 : direction === 'left' ? 0xF8 : 0;
  const dy = direction === 'down' ? 0x08 : direction === 'up' ? 0xF8 : 0;
  const blockedLabel = direction === 'right' || direction === 'left'
    ? `.${direction}_blocked`
    : '.push_box_vertical_blocked';
  return `    ld a, ${formatHexByte(dx)}
    ld (msx2_push_box_try_dx), a
    ld a, ${formatHexByte(dy)}
    ld (msx2_push_box_try_dy), a
    call msx2_try_push_box_from_player
    jp c, ${blockedLabel}
`;
}

export function buildMsx2PushBoxHardwareSpriteAttrWrite(options: {
  attrAddress: number;
  patternIndex: number;
}): string {
  return `    ; Push box hardware sprite while sliding or waiting for L/R release.
    ld a, (msx2_push_box_moving_slot)
    cp #FF
    jr nz, .push_box_sprite_show
    ld a, (msx2_push_box_defer_char_slot)
    cp #FF
    jp z, .push_box_sprite_hide
.push_box_sprite_show:
    ld c, a
    ld b, 0
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld a, (hl)
    ld hl, #${options.attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld a, (hl)
    ld hl, #${(options.attrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, ${options.patternIndex}
    ld hl, #${(options.attrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(options.attrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    jp .push_box_sprite_done
.push_box_sprite_hide:
    ld a, 208
    ld hl, #${options.attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
.push_box_sprite_done:
`;
}

export function buildMsx2PushBoxRuntimeAsm(options: {
  enabled: boolean;
  allowVerticalPush?: boolean;
}): string {
  if (!options.enabled) return '';
  const allowVerticalPush = options.allowVerticalPush ?? false;
  const verticalProbeAsm = allowVerticalPush
    ? `    jr z, .push_box_probe_vertical
    jp m, .push_box_probe_left
    ld a, b
    add a, 16
    ld b, a
    jr .push_box_probe_ready
.push_box_probe_left:
    ld a, b
    sub 16
    ld b, a
    jr .push_box_probe_ready
.push_box_probe_vertical:
    ld a, (msx2_push_box_try_dy)
    jp m, .push_box_probe_up
    ld a, c
    add a, 8
    ld c, a
    jr .push_box_probe_ready
.push_box_probe_up:
    ld a, c
    sub 8
    ld c, a
    jr .push_box_probe_ready
`
    : `    ret z
    jp m, .push_box_probe_left
    ld a, b
    add a, 16
    ld b, a
    jr .push_box_probe_ready
.push_box_probe_left:
    ld a, b
    sub 16
    ld b, a
    jr .push_box_probe_ready
`;
  return `${buildMsx2GridSnapCharDrawAsm({ scratchCharVar: 'msx2_push_box_draw_char', includeErase: false })}
msx2_push_box_horizontal_held:
    ; Zero flag set when LEFT/RIGHT is currently held on joystick 1.
    ; Clobbers AF.
    xor a
    call GTSTCK
    cp 2
    ret z
    cp 3
    ret z
    cp 4
    ret z
    cp 6
    ret z
    cp 7
    ret z
    cp 8
    ret z
    or a
    ret

msx2_push_box_sync_char_tiles:
    ; Draw deferred push box char tiles once LEFT/RIGHT are released.
    ; Clobbers AF/BC/DE/HL.
    call msx2_push_box_horizontal_held
    ret nz
    ld a, (msx2_push_box_moving_slot)
    cp #FF
    ret nz
    ld a, (msx2_push_box_defer_char_slot)
    cp #FF
    ret z
    ld c, a
    ld b, 0
    push bc
    ld a, c
    call msx2_push_box_draw_chars_for_slot
    pop bc
    ld hl, msx2_push_box_runtime_moving
    add hl, bc
    xor a
    ld (hl), a
    ld a, #FF
    ld (msx2_push_box_defer_char_slot), a
    ret

init_msx2_push_boxes:
    ; Load push boxes for current screen and draw idle 2x2 char blocks.
    ; Clobbers AF/BC/DE/HL.
    call msx2_reset_push_boxes_for_current_screen
    ld a, (msx2_push_box_count)
    or a
    ret z
    ld b, a
    xor a
.push_box_init_loop:
    push bc
    push af
    call msx2_push_box_draw_chars_for_slot
    pop af
    pop bc
    inc a
    djnz .push_box_init_loop
    ret

update_msx2_push_boxes:
    ; Advance sliding push boxes: box follows player position for 8 frames.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_push_box_moving_slot)
    cp #FF
    jp nz, .push_box_update_active
    call msx2_push_box_try_gravity_falls
    ret
.push_box_update_active:
    ld a, (msx2_push_box_move_mode)
    or a
    jp nz, msx2_push_box_update_gravity_fall
    ; Check slide_remaining for this slot
    ld a, (msx2_push_box_moving_slot)
    ld c, a
    ld b, 0
    ld hl, msx2_push_box_runtime_slide_remaining
    add hl, bc
    ld a, (hl)
    or a
    jr z, .push_box_finish_if_done
    ; Decrement slide_remaining
    dec (hl)
    ; Compute new box position = player_pos + stored offset.
    ; Box X = player_x + offset_x
    ld a, (msx2_player_sprite_x)
    ld hl, msx2_push_box_runtime_offset_x
    add hl, bc
    add a, (hl)
    ; Check bounds (0-240)
    cp 241
    jr nc, .push_box_finish_slide_now
    ; Store new box X
    ld d, a
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld (hl), d
    ; Box Y = player_y + 8 + offset_y
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld hl, msx2_push_box_runtime_offset_y
    add hl, bc
    add a, (hl)
    ; Check bounds (0-176)
    cp 177
    jr nc, .push_box_finish_slide_now
    ; Store new box Y
    ld e, a
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld (hl), e
    ld hl, msx2_push_box_runtime_slide_remaining
    add hl, bc
    ld a, (hl)
    or a
    ret nz
    call msx2_push_box_finish_slide
    ret
.push_box_finish_if_done:
    ; slide_remaining is 0 but still marked as moving - finish slide
    call msx2_push_box_finish_slide
    call msx2_push_box_try_gravity_falls
    ret
.push_box_finish_slide_now:
    call msx2_push_box_finish_slide
    ret

msx2_push_box_load_speed_for_slot:
    ; Input: C=slot. Output: (msx2_push_box_speed_scratch)=speed. Clobbers AF/DE/HL.
    push bc
    call msx2_push_box_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_push_box_speed
    add hl, de
    add hl, bc
    ld a, (hl)
    ld (msx2_push_box_speed_scratch), a
    pop bc
    ret

msx2_reset_push_boxes_for_current_screen:
    ; Copy static push box slots for current screen into mutable RAM.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_push_box_count
    add hl, de
    ld a, (hl)
    cp MSX2_MAX_PUSH_BOXES_PER_SCREEN + 1
    jr c, .push_box_count_ok
    ld a, MSX2_MAX_PUSH_BOXES_PER_SCREEN
.push_box_count_ok:
    ld (msx2_push_box_count), a
    call msx2_push_box_screen_base
    ld hl, msx2_screen_push_box_x
    add hl, de
    push de
    ld de, msx2_push_box_runtime_x
    ld bc, MSX2_MAX_PUSH_BOXES_PER_SCREEN
    ldir
    pop de
    ld hl, msx2_screen_push_box_y
    add hl, de
    ld de, msx2_push_box_runtime_y
    ld bc, MSX2_MAX_PUSH_BOXES_PER_SCREEN
    ldir
    ld a, #FF
    ld (msx2_push_box_moving_slot), a
    ld (msx2_push_box_defer_char_slot), a
    xor a
    ld (msx2_push_box_move_mode), a
    ld hl, msx2_push_box_runtime_moving
    ld bc, MSX2_MAX_PUSH_BOXES_PER_SCREEN
.push_box_clear_moving:
    ld (hl), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .push_box_clear_moving
    ; Clear slide_remaining
    ld hl, msx2_push_box_runtime_slide_remaining
    ld bc, MSX2_MAX_PUSH_BOXES_PER_SCREEN
.push_box_clear_slide:
    ld (hl), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .push_box_clear_slide
    xor a
    ld hl, msx2_push_box_runtime_offset_x
    ld bc, MSX2_MAX_PUSH_BOXES_PER_SCREEN * 3
.push_box_clear_offsets:
    ld (hl), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .push_box_clear_offsets
    ret

msx2_push_box_screen_base:
    ; Output: DE = current_screen_index * MSX2_MAX_PUSH_BOXES_PER_SCREEN. Clobbers AF/DE/HL.
    ld a, (msx2_current_screen_index)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ex de, hl
    ret

msx2_push_box_draw_chars_for_slot:
    ; Draw idle 2x2 char block for slot A at runtime pixel coords. Clobbers AF/BC/DE/HL.
    push af
    call msx2_push_box_screen_base
    pop af
    push af
    ld c, a
    ld b, 0
    ld hl, msx2_screen_push_box_char_base
    add hl, de
    add hl, bc
    ld a, (hl)
    ld (msx2_push_box_draw_char), a
    pop af
    ld c, a
    ld b, 0
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld e, (hl)
    ld b, d
    ld c, e
    call msx2_grid_draw_char_block_16
    ret

msx2_push_box_restore_chars_for_slot:
    ; Clear the 2x2 name-table block under slot A before sliding. Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 0
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld e, (hl)
    ld b, d
    ld c, e
    call screen4_name_cell_from_bc
    jp clear_screen4_name_cell_16

msx2_push_box_find_at_pixel:
    ; Input: B=probe X px, C=probe Y px. Output: A=slot or #FF. Clobbers AF/BC/DE/HL.
    ld d, b
    ld e, c
    ld a, (msx2_push_box_count)
    or a
    jr z, .push_box_find_none
    ld b, a
    ld c, 0
.push_box_find_loop:
    push bc
    ld b, 0
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld a, (hl)
    ld h, a
    ld a, d
    sub h
    jr c, .push_box_find_next
    cp 16
    jr nc, .push_box_find_next
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld a, (hl)
    ld h, a
    ld a, e
    sub h
    jr c, .push_box_find_next
    cp 16
    jr nc, .push_box_find_next
    pop bc
    ld a, c
    ret
.push_box_find_next:
    pop bc
    inc c
    djnz .push_box_find_loop
.push_box_find_none:
    ld a, #FF
    ret

msx2_push_box_can_move_slot:
    ; Input: A=slot, try_dx/dy set. Carry SET = destination free. Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 0
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld e, (hl)
    ld a, (msx2_push_box_try_dx)
    or a
    jr z, .push_box_move_vert
    add a, d
    ld d, a
    jr .push_box_move_check
.push_box_move_vert:
    ld a, (msx2_push_box_try_dy)
    add a, e
    ld e, a
.push_box_move_check:
    ld a, d
    cp 241
    jr nc, .push_box_move_blocked
    ld a, e
    cp 177
    jr nc, .push_box_move_blocked
    push de
    ld b, d
    ld c, e
    call msx2_collision_at_pixel
    pop de
    jr nz, .push_box_move_blocked
    push de
    ld a, e
    add a, 15
    ld c, a
    ld b, d
    call msx2_collision_at_pixel
    pop de
    jr nz, .push_box_move_blocked
    ld b, d
    ld c, e
    call msx2_push_box_find_at_pixel
    cp #FF
    jr z, .push_box_move_free
    ld c, a
    ld a, (msx2_push_box_active)
    cp c
    jr nz, .push_box_move_blocked
.push_box_move_free:
    scf
    ret
.push_box_move_blocked:
    or a
    ret

msx2_push_box_start_slide:
    ; Input: A=slot. Starts 8-frame push slide following player position.
    ; Clobbers AF/BC/DE/HL.
    ld c, a
    ld a, (msx2_push_box_moving_slot)
    cp #FF
    ret nz
    ld a, c
    ld b, 0
    push bc
    ld a, #FF
    ld (msx2_push_box_defer_char_slot), a
    pop bc
    push bc
    ld a, c
    call msx2_push_box_restore_chars_for_slot
    pop bc
    push bc
    ; Calculate and store offset for: box_pos = player_pos + offset.
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld a, (hl)
    ld d, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, d
    sub e
    ld hl, msx2_push_box_runtime_offset_x
    add hl, bc
    ld (hl), a
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld a, (hl)
    ld d, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld e, a
    ld a, d
    sub e
    ld hl, msx2_push_box_runtime_offset_y
    add hl, bc
    ld (hl), a
    ld hl, msx2_push_box_runtime_moving
    add hl, bc
    ld a, 1
    ld (hl), a
    ; Set slide_remaining = 8 (8 frames of following)
    ld hl, msx2_push_box_runtime_slide_remaining
    add hl, bc
    ld a, 8
    ld (hl), a
    pop bc
    ld a, c
    ld (msx2_push_box_moving_slot), a
    xor a
    ld (msx2_push_box_move_mode), a
    ret

msx2_push_box_start_gravity_fall:
    ; Input: A=slot. Starts pixel fall when unsupported below. Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 0
    push bc
    ld a, #FF
    ld (msx2_push_box_defer_char_slot), a
    pop bc
    push bc
    ld a, c
    call msx2_push_box_restore_chars_for_slot
    pop bc
    ld hl, msx2_push_box_runtime_moving
    add hl, bc
    ld a, 1
    ld (hl), a
    ld a, c
    ld (msx2_push_box_moving_slot), a
    ld (msx2_push_box_move_mode), a
    ret

msx2_push_box_slot_has_gravity:
    ; Input: C=slot. Zero flag clear when gravity is enabled.
    ; Clobbers AF/DE/HL. Preserves BC.
    push bc
    call msx2_push_box_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_push_box_gravity
    add hl, de
    add hl, bc
    ld a, (hl)
    pop bc
    or a
    ret

msx2_push_box_slot_has_support:
    ; Input: (msx2_push_box_active)=slot. Carry SET when the box is supported (floor, tile, or box below).
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_push_box_active)
    ld c, a
    ld b, 0
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld b, (hl)
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld a, (hl)
    add a, 16
    ld c, a
    call msx2_collision_at_pixel
    jr nz, .push_box_supported
    ld a, b
    add a, 15
    ld b, a
    call msx2_collision_at_pixel
    jr nz, .push_box_supported
    ld a, (msx2_push_box_active)
    ld c, a
    ld b, 0
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld b, (hl)
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld a, (hl)
    add a, 16
    ld c, a
    call msx2_push_box_find_at_pixel
    cp #FF
    jr z, .push_box_unsupported
    ld c, a
    ld a, (msx2_push_box_active)
    cp c
    jr z, .push_box_unsupported
.push_box_supported:
    scf
    ret
.push_box_unsupported:
    or a
    ret

msx2_push_box_try_gravity_falls:
    ; Start gravity fall for the first unsupported gravity-enabled idle slot.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_push_box_count)
    or a
    ret z
    ld b, a
    ld c, 0
.push_box_gravity_scan:
    push bc
    call msx2_push_box_slot_has_gravity
    jr z, .push_box_gravity_next
    ld a, c
    ld (msx2_push_box_active), a
    call msx2_push_box_slot_has_support
    jr c, .push_box_gravity_next
    pop bc
    ld a, c
    call msx2_push_box_start_gravity_fall
    ret
.push_box_gravity_next:
    pop bc
    inc c
    djnz .push_box_gravity_scan
    ret

msx2_push_box_update_gravity_fall:
    ; Input: moving_slot = falling slot. Clobbers AF/BC/DE/HL.
    ld a, (msx2_push_box_moving_slot)
    ld (msx2_push_box_active), a
    call msx2_push_box_slot_has_support
    jr c, msx2_push_box_finish_slide
    ld a, (msx2_push_box_moving_slot)
    ld c, a
    ld b, 0
    call msx2_push_box_load_speed_for_slot
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld a, (hl)
    ld hl, msx2_push_box_speed_scratch
    add a, (hl)
    cp 177
    jp nc, msx2_push_box_finish_slide
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld (hl), a
    ret

msx2_push_box_finish_slide:
    ; Input: moving_slot = active slot. Snap to 8px grid; defer char tiles until L/R release.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_push_box_moving_slot)
    cp #FF
    ret z
    ld c, a
    ld b, 0
    ld hl, msx2_push_box_runtime_x
    add hl, bc
    ld a, (hl)
    and #F8
    ld (hl), a
    ld hl, msx2_push_box_runtime_y
    add hl, bc
    ld a, (hl)
    and #F8
    ld (hl), a
    ld hl, msx2_push_box_runtime_moving
    add hl, bc
    ld a, 2
    ld (hl), a
    ; Clear slide_remaining
    ld hl, msx2_push_box_runtime_slide_remaining
    add hl, bc
    xor a
    ld (hl), a
    ld a, c
    ld (msx2_push_box_defer_char_slot), a
    xor a
    ld (msx2_push_box_move_mode), a
    ld a, #FF
    ld (msx2_push_box_moving_slot), a
    ret

msx2_try_push_box_from_player:
    ; Probe one cell ahead. Carry SET = blocked by box. Carry CLEAR = free or push started.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_push_box_count)
    or a
    ret z
    ld a, (msx2_push_box_moving_slot)
    cp #FF
    jr z, .push_box_try_idle
    ld a, (msx2_push_box_move_mode)
    or a
    jr nz, .push_box_player_blocked
    ; Push slide already active: let the player keep moving and the box will follow in update_msx2_push_boxes.
    or a
    ret
.push_box_try_idle:
    ld a, (msx2_push_box_defer_char_slot)
    cp #FF
    jr z, .push_box_try_ready
    scf
    ret
.push_box_try_ready:
    ld a, (msx2_player_sprite_x)
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, (msx2_push_box_try_dx)
    or a
${verticalProbeAsm}.push_box_probe_ready:
    call msx2_push_box_find_at_pixel
    cp #FF
    jr z, .push_box_player_free
    ld (msx2_push_box_active), a
    call msx2_push_box_can_move_slot
    jr nc, .push_box_player_blocked
    ld a, (msx2_push_box_active)
    call msx2_push_box_start_slide
.push_box_player_free:
    or a
    ret
.push_box_player_blocked:
    scf
    ret
`;
}

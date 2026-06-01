import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { Msx2Screen4TileScreen } from '../../../../types';
import { buildMsx2GridSnapCharDrawAsm } from './msx2GridSnapComponentGenerator';
import {
  MSX2_MAX_BOX2_PER_SCREEN,
  Msx2Box2RuntimeSlot,
  getMsx2Box2RuntimeSlotsForScreen,
  usesMsx2Box2FromScreens,
} from './msx2Box2RuntimeGenerator';

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

// RAM layout (MAX = MSX2_MAX_BOX2_PER_SCREEN = 8):
// +0          count
// +1          try_dx
// +2          try_dy
// +3          draw_char scratch
// +4          active slot scratch
// +5          moving_slot (#FF = none)
// +6          speed scratch
// +7          move_mode (0=slide, 1=gravity fall)
// +8..+15     runtime_x[8]
// +16..+23    runtime_y[8]
// +24..+31    runtime_target_x[8]
// +32..+39    runtime_target_y[8]
// +40..+47    runtime_moving[8] (0=idle/chars, 1=active sprite)
export const MSX2_BOX2_RAM_BASE = 0xC047;
export const MSX2_BOX2_RUNTIME_BYTES = 8 + MSX2_MAX_BOX2_PER_SCREEN * 5;

export function usesMsx2Box2(
  analysis: ProjectAnalysis,
  tileScreens: Array<Msx2Screen4TileScreen | undefined> = []
): boolean {
  if (usesMsx2Box2FromScreens(tileScreens)) return true;
  const screens = (analysis as any)?.msx2Screen4TileScreens as Msx2Screen4TileScreen[] | undefined;
  return usesMsx2Box2FromScreens(screens || []);
}

export function buildMsx2Box2Equates(ramBase = MSX2_BOX2_RAM_BASE): string {
  const slotBytes = MSX2_MAX_BOX2_PER_SCREEN;
  return `msx2_box2_count EQU ${formatHexWord(ramBase)}
msx2_box2_try_dx EQU ${formatHexWord(ramBase + 1)}
msx2_box2_try_dy EQU ${formatHexWord(ramBase + 2)}
msx2_box2_draw_char EQU ${formatHexWord(ramBase + 3)}
msx2_box2_active EQU ${formatHexWord(ramBase + 4)}
msx2_box2_moving_slot EQU ${formatHexWord(ramBase + 5)}
msx2_box2_speed_scratch EQU ${formatHexWord(ramBase + 6)}
msx2_box2_move_mode EQU ${formatHexWord(ramBase + 7)}
msx2_box2_runtime_x EQU ${formatHexWord(ramBase + 8)}
msx2_box2_runtime_y EQU ${formatHexWord(ramBase + 8 + slotBytes)}
msx2_box2_runtime_target_x EQU ${formatHexWord(ramBase + 8 + slotBytes * 2)}
msx2_box2_runtime_target_y EQU ${formatHexWord(ramBase + 8 + slotBytes * 3)}
msx2_box2_runtime_moving EQU ${formatHexWord(ramBase + 8 + slotBytes * 4)}
msx2_box2_runtime_end EQU ${formatHexWord(ramBase + MSX2_BOX2_RUNTIME_BYTES)}
MSX2_MAX_BOX2_PER_SCREEN EQU ${MSX2_MAX_BOX2_PER_SCREEN}
`;
}

function buildBox2RuntimeTables(
  slotsByScreen: Msx2Box2RuntimeSlot[][]
): {
  countBytes: number[];
  xBytes: number[];
  yBytes: number[];
  charBaseBytes: number[];
  speedBytes: number[];
  gravityBytes: number[];
  alignBytes: number[];
  axisBytes: number[];
  mapOriginBytes: number[];
  mapTileIndexBytes: number[];
  restoreNameBytes: number[];
} {
  const countBytes = slotsByScreen.map(items => Math.min(MSX2_MAX_BOX2_PER_SCREEN, items.length));
  const pickNumber = (getter: (slot: Msx2Box2RuntimeSlot | undefined) => number, fallback: number) =>
    slotsByScreen.flatMap(items =>
      Array.from({ length: MSX2_MAX_BOX2_PER_SCREEN }, (_unused, index) => {
        const slot = items[index];
        return slot ? getter(slot) : fallback;
      })
    );
  const restoreNameBytes = slotsByScreen.flatMap(items =>
    Array.from({ length: MSX2_MAX_BOX2_PER_SCREEN }, (_unused, index) => {
      const slot = items[index];
      const quad = slot?.mapOrigin ? slot.restoreNameBytes : undefined;
      return quad ?? [0, 0, 0, 0];
    }).flat()
  );
  return {
    countBytes,
    xBytes: pickNumber(slot => slot.x, 0),
    yBytes: pickNumber(slot => slot.y, 0),
    charBaseBytes: pickNumber(slot => slot.charBase, 0),
    speedBytes: pickNumber(slot => slot.slideSpeed, 1),
    gravityBytes: pickNumber(slot => slot.gravity, 1),
    alignBytes: pickNumber(slot => slot.requiresAlignment, 1),
    axisBytes: pickNumber(slot => slot.pushAxis, 0),
    mapOriginBytes: pickNumber(slot => (slot.mapOrigin ? 1 : 0), 0),
    mapTileIndexBytes: pickNumber(slot => slot.mapTileIndex ?? 0, 0),
    restoreNameBytes,
  };
}

export function buildMsx2Box2DataTables(
  tileScreens: Array<Msx2Screen4TileScreen | undefined>,
  resolveTileBytes: (screen: Msx2Screen4TileScreen | undefined, entity: any) => { pattern: number[]; color: number[] } | undefined,
  slotsByScreen?: Msx2Box2RuntimeSlot[][]
): string {
  if (!usesMsx2Box2FromScreens(tileScreens)) return '';
  const resolvedSlots = slotsByScreen
    ?? tileScreens.map(screen => getMsx2Box2RuntimeSlotsForScreen(screen, resolveTileBytes));
  const tables = buildBox2RuntimeTables(resolvedSlots);
  const slotCount = MSX2_MAX_BOX2_PER_SCREEN;
  return `${formatBytes('msx2_screen_box2_count', tables.countBytes.length ? tables.countBytes : [0], 'Per-screen box2 count')}
${formatBytes('msx2_screen_box2_x', tables.xBytes.length ? tables.xBytes : Array(slotCount).fill(0), `Per-screen box2 initial X (8-aligned px), ${slotCount} slots/screen`)}
${formatBytes('msx2_screen_box2_y', tables.yBytes.length ? tables.yBytes : Array(slotCount).fill(0), `Per-screen box2 initial Y (8-aligned px), ${slotCount} slots/screen`)}
${formatBytes('msx2_screen_box2_char_base', tables.charBaseBytes.length ? tables.charBaseBytes : Array(slotCount).fill(0), `Per-screen box2 2x2 char block base, ${slotCount} slots/screen`)}
${formatBytes('msx2_screen_box2_speed', tables.speedBytes.length ? tables.speedBytes : Array(slotCount).fill(1), `Per-screen box2 slide speed (px/frame), ${slotCount} slots/screen`)}
${formatBytes('msx2_screen_box2_gravity', tables.gravityBytes.length ? tables.gravityBytes : Array(slotCount).fill(1), `Per-screen box2 gravity flag, ${slotCount} slots/screen`)}
${formatBytes('msx2_screen_box2_align', tables.alignBytes.length ? tables.alignBytes : Array(slotCount).fill(1), `Per-screen box2 requires-alignment flag, ${slotCount} slots/screen`)}
${formatBytes('msx2_screen_box2_axis', tables.axisBytes.length ? tables.axisBytes : Array(slotCount).fill(0), `Per-screen box2 push axis (0=H,1=V,2=both), ${slotCount} slots/screen`)}
${formatBytes('msx2_screen_box2_map_origin', tables.mapOriginBytes.length ? tables.mapOriginBytes : Array(slotCount).fill(0), `Per-screen box2 map-tile origin flag (1=painted tile), ${slotCount} slots/screen`)}
${formatBytes('msx2_screen_box2_map_tile_index', tables.mapTileIndexBytes.length ? tables.mapTileIndexBytes : Array(slotCount).fill(0), `Per-screen box2 source map tile index, ${slotCount} slots/screen`)}
${formatBytes('msx2_screen_box2_restore_names', tables.restoreNameBytes.length ? tables.restoreNameBytes : Array(slotCount * 4).fill(0), `Per-screen box2 restore name quads for map tiles, ${slotCount} slots x 4 bytes`)}
`;
}

export function buildMsx2Box2PlayerHookAsm(direction: 'right' | 'left' | 'up' | 'down'): string {
  const dx = direction === 'right' ? 0x08 : direction === 'left' ? 0xF8 : 0;
  const dy = direction === 'down' ? 0x08 : direction === 'up' ? 0xF8 : 0;
  const blockedLabel = direction === 'right' || direction === 'left'
    ? `.${direction}_blocked`
    : '.box2_vertical_blocked';
  return `    ld a, ${formatHexByte(dx)}
    ld (msx2_box2_try_dx), a
    ld a, ${formatHexByte(dy)}
    ld (msx2_box2_try_dy), a
    call msx2_try_box2_from_player
    jp c, ${blockedLabel}
`;
}

export function buildMsx2Box2HardwareSpriteAttrWrite(options: {
  attrAddress: number;
  patternIndex: number;
}): string {
  return `    ; Box2 hardware sprite while sliding or falling (hybrid render).
    ld a, (msx2_box2_moving_slot)
    cp #FF
    jp z, .box2_sprite_hide
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld hl, #${options.attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld hl, msx2_box2_runtime_x
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
    jp .box2_sprite_done
.box2_sprite_hide:
    ld a, 208
    ld hl, #${options.attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
.box2_sprite_done:
`;
}

export function buildMsx2Box2RuntimeAsm(options: {
  enabled: boolean;
  allowVerticalPush?: boolean;
}): string {
  if (!options.enabled) return '';
  const allowVerticalPush = options.allowVerticalPush ?? false;
  const verticalProbeAsm = allowVerticalPush
    ? `.box2_probe_vertical:
    ld a, (msx2_box2_try_dy)
    jp m, .box2_probe_up
    ld a, c
    add a, 8
    ld c, a
    jr .box2_probe_ready
.box2_probe_up:
    ld a, c
    sub 8
    ld c, a
    jr .box2_probe_ready
`
    : `    ret
`;
  return `${buildMsx2GridSnapCharDrawAsm({ drawLabel: 'msx2_box2_grid_draw_char_block_16', scratchCharVar: 'msx2_box2_draw_char', includeErase: false })}

init_msx2_box2_boxes:
    ; Load box2 slots for current screen and draw idle 2x2 char blocks.
    ; Clobbers AF/BC/DE/HL.
    call msx2_reset_box2_for_current_screen
    ld a, (msx2_box2_count)
    or a
    ret z
    ld b, a
    xor a
.box2_init_loop:
    push bc
    push af
    call msx2_box2_draw_chars_for_slot
    pop af
    call msx2_box2_set_collision_for_slot
    pop bc
    inc a
    djnz .box2_init_loop
    ret

update_msx2_box2_boxes:
    ; Advance sliding/falling box2 slots. Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    cp #FF
    jp nz, .box2_update_active
    call msx2_box2_try_gravity_falls
    ret
.box2_update_active:
    ld a, (msx2_box2_move_mode)
    or a
    jp nz, msx2_box2_update_gravity_fall
    call msx2_box2_step_slide_toward_target
    ret

msx2_box2_screen_base:
    ; Output: DE = current_screen_index * MSX2_MAX_BOX2_PER_SCREEN. Clobbers AF/DE/HL.
    ld a, (msx2_current_screen_index)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ex de, hl
    ret

msx2_box2_load_speed_for_slot:
    ; Input: C=slot. Output: (msx2_box2_speed_scratch)=speed. Clobbers AF/DE/HL. Preserves BC.
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_box2_speed
    add hl, de
    add hl, bc
    ld a, (hl)
    ld (msx2_box2_speed_scratch), a
    pop bc
    ret

msx2_reset_box2_for_current_screen:
    ; Copy static box2 slots for current screen into mutable RAM.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_box2_count
    add hl, de
    ld a, (hl)
    cp MSX2_MAX_BOX2_PER_SCREEN + 1
    jr c, .box2_count_ok
    ld a, MSX2_MAX_BOX2_PER_SCREEN
.box2_count_ok:
    ld (msx2_box2_count), a
    call msx2_box2_screen_base
    ld hl, msx2_screen_box2_x
    add hl, de
    push de
    ld de, msx2_box2_runtime_x
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
    ldir
    pop de
    ld hl, msx2_screen_box2_y
    add hl, de
    ld de, msx2_box2_runtime_y
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
    ldir
    ld hl, msx2_box2_runtime_x
    ld de, msx2_box2_runtime_target_x
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
    ldir
    ld hl, msx2_box2_runtime_y
    ld de, msx2_box2_runtime_target_y
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
    ldir
    ld a, #FF
    ld (msx2_box2_moving_slot), a
    xor a
    ld (msx2_box2_move_mode), a
    ld hl, msx2_box2_runtime_moving
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
.box2_clear_moving:
    ld (hl), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .box2_clear_moving
    ret

msx2_box2_draw_chars_for_slot:
    ; Draw idle 2x2 char block for slot A at runtime pixel coords. Clobbers AF/BC/DE/HL.
    push af
    call msx2_box2_screen_base
    pop af
    push af
    ld c, a
    ld b, 0
    ld hl, msx2_screen_box2_char_base
    add hl, de
    add hl, bc
    ld a, (hl)
    ld (msx2_box2_draw_char), a
    pop af
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld e, (hl)
    ld b, d
    ld c, e
    call msx2_box2_grid_draw_char_block_16
    ret

msx2_box2_restore_chars_for_slot:
    ; Clear or restore the 2x2 name-table block under slot A before sliding. Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 0
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    push de
    ld hl, msx2_screen_box2_map_origin
    add hl, de
    add hl, bc
    ld a, (hl)
    pop de
    pop bc
    or a
    jp nz, msx2_box2_restore_map_underlay_for_slot
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld e, (hl)
    ld b, d
    ld c, e
    call screen4_name_cell_from_bc
    jp clear_screen4_name_cell_16

msx2_box2_restore_map_underlay_for_slot:
    ; Input: C=slot. Restores the painted background name quad for a map-origin box.
    ; Clobbers AF/BC/DE/HL.
    push bc
    call msx2_box2_screen_base
    ld hl, msx2_screen_box2_restore_names
    add hl, de
    pop bc
    push bc
    push hl
    ld a, c
    ld e, a
    ld d, 0
    sla e
    sla e
    add hl, de
    ex de, hl
    pop hl
    pop bc
    push bc
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld b, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld c, (hl)
    call screen4_name_cell_from_bc
    pop bc
    ld a, (de)
    call WRTVRM
    inc hl
    inc de
    ld a, (de)
    call WRTVRM
    ld bc, 31
    add hl, bc
    inc de
    ld a, (de)
    call WRTVRM
    inc hl
    inc de
    ld a, (de)
    call WRTVRM
    ret

msx2_box2_slot_is_map_origin:
    ; Input: A=slot. Returns A=1 when slot comes from a painted map box tile.
    ; Clobbers AF/DE/HL. Preserves BC.
    push bc
    ld c, a
    ld b, 0
    push bc
    call msx2_box2_screen_base
    pop bc
    ld hl, msx2_screen_box2_map_origin
    add hl, de
    add hl, bc
    ld a, (hl)
    pop bc
    or a
    ret

msx2_box2_maybe_clear_map_visual_for_slot:
    ; Input: A=slot. Clears visual map cell when slot is map-origin.
    ; Clobbers AF/BC/DE/HL.
    push bc
    ld c, a
    call msx2_box2_slot_is_map_origin
    pop bc
    or a
    ret z
    ld a, c
    call msx2_box2_clear_map_visual_for_slot
    ret

msx2_box2_maybe_restore_map_visual_for_slot:
    ; Input: A=slot. Restores visual map cell when slot is map-origin.
    ; Clobbers AF/BC/DE/HL.
    push bc
    ld c, a
    call msx2_box2_slot_is_map_origin
    pop bc
    or a
    ret z
    ld a, c
    call msx2_box2_restore_map_visual_for_slot
    ret

msx2_box2_patch_visual_map_for_slot:
    ; Input: A=slot, B=visual tile index for the runtime map cell. Clobbers AF/BC/DE/HL.
    ld c, a
    ld a, b
    push af
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    srl a
    srl a
    srl a
    srl a
    ld d, a
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    srl a
    srl a
    srl a
    srl a
    ld e, a
    ld a, e
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, d
    add a, l
    ld l, a
    ld h, 0
    ex de, hl
    pop af
    ld hl, msx2_visual_map_cache
    add hl, de
    ld (hl), a
    ret

msx2_box2_clear_map_visual_for_slot:
    ; Input: A=slot. Clears visual map cell for map-origin boxes when they slide away.
    xor a
    ld b, a
    jr msx2_box2_patch_visual_map_for_slot

msx2_box2_restore_map_visual_for_slot:
    ; Input: A=slot. Restores visual map cell to the box tile index for map-origin boxes.
    ld c, a
    ld b, 0
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    push de
    ld hl, msx2_screen_box2_map_tile_index
    add hl, de
    add hl, bc
    ld a, (hl)
    pop de
    pop bc
    ld b, a
    ld a, c
    jr msx2_box2_patch_visual_map_for_slot

msx2_box2_find_at_pixel:
    ; Input: B=probe X px, C=probe Y px. Output: A=slot or #FF. Clobbers AF/BC/DE/HL.
    ld d, b
    ld e, c
    ld a, (msx2_box2_count)
    or a
    jr z, .box2_find_none
    ld b, a
    ld c, 0
.box2_find_loop:
    push bc
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld h, a
    ld a, d
    sub h
    jr c, .box2_find_next
    cp 16
    jr nc, .box2_find_next
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld h, a
    ld a, e
    sub h
    jr c, .box2_find_next
    cp 16
    jr nc, .box2_find_next
    pop bc
    ld a, c
    ret
.box2_find_next:
    pop bc
    inc c
    djnz .box2_find_loop
.box2_find_none:
    ld a, #FF
    ret

msx2_box2_collision_index_from_bc:
    ; B=pixel X, C=pixel Y. Output DE=16x12 collision cell index. Clobbers AF/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, l
    ld l, a
    ld h, 0
    ex de, hl
    ret

msx2_box2_patch_collision_value_for_slot:
    ; Input: A=slot, B=collision byte (0=clear, 1=solid). Clobbers AF/BC/DE/HL.
    ld c, a
    ld a, b
    push af
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld b, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld c, (hl)
    call msx2_box2_collision_index_from_bc
    pop af
    ld hl, (msx2_current_collision_ptr)
    add hl, de
    ld (hl), a
    ret

msx2_box2_set_collision_for_slot:
    ; Input: A=slot. Marks the runtime box cell solid in the mutable collision cache.
    ; Clobbers AF/BC/DE/HL.
    ld b, 1
    jr msx2_box2_patch_collision_value_for_slot

msx2_box2_clear_collision_for_slot:
    ; Input: A=slot. Clears the runtime box cell in the mutable collision cache.
    ; Clobbers AF/BC/DE/HL.
    ld b, 0
    jr msx2_box2_patch_collision_value_for_slot

msx2_box2_slot_allows_axis:
    ; Input: C=slot, try_dx/dy set. Zero flag set when axis allows push direction.
    ; Clobbers AF/DE/HL. Preserves BC.
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_box2_axis
    add hl, de
    add hl, bc
    ld a, (hl)
    ld e, a
    pop bc
    ld a, (msx2_box2_try_dx)
    or a
    jr z, .box2_axis_check_vert
    ld a, e
    cp 1
    jr z, .box2_axis_denied
    xor a
    ret
.box2_axis_check_vert:
    ld a, e
    or a
    jr z, .box2_axis_denied
    xor a
    ret
.box2_axis_denied:
    ld a, 1
    ret

msx2_box2_slot_requires_alignment:
    ; Input: C=slot. Zero flag set when alignment is required.
    ; Clobbers AF/DE/HL. Preserves BC.
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_box2_align
    add hl, de
    add hl, bc
    ld a, (hl)
    pop bc
    or a
    ret

msx2_box2_player_aligned_for_push:
    ; Input: C=slot. A=0 when player is aligned for push (sprite tops match on H push).
    ; Clobbers AF/DE/HL. Preserves BC.
    call msx2_box2_slot_requires_alignment
    ret z
    push bc
    ld b, 0
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld d, (hl)
    ld a, (msx2_player_sprite_y)
    ld e, a
    ld a, d
    sub e
    jp p, .box2_align_pos
    neg
.box2_align_pos:
    cp 5
    pop bc
    ret nc
    xor a
    ret

msx2_box2_can_move_slot:
    ; Input: A=slot, try_dx/dy set. Carry SET = destination free. Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld e, (hl)
    ld a, (msx2_box2_try_dx)
    or a
    jr z, .box2_move_vert
    add a, d
    ld d, a
    jr .box2_move_check
.box2_move_vert:
    ld a, (msx2_box2_try_dy)
    add a, e
    ld e, a
.box2_move_check:
    ld a, d
    cp 241
    jr nc, .box2_move_blocked
    ld a, e
    cp 177
    jr nc, .box2_move_blocked
    push de
    ld b, d
    ld c, e
    call msx2_box2_find_at_pixel
    pop de
    cp #FF
    jr z, .box2_move_check_collision
    ld b, a
    ld a, c
    cp b
    jr z, .box2_move_free
    ld a, b
    ld (msx2_box2_active), a
    call msx2_box2_can_move_slot
    ret
.box2_move_check_collision:
    push de
    ld b, d
    ld c, e
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_move_blocked
    push de
    ld a, e
    add a, 15
    ld c, a
    ld b, d
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_move_blocked
    scf
    ret
.box2_move_free:
    scf
    ret
.box2_move_blocked:
    or a
    ret

msx2_box2_start_slide:
    ; Input: A=slot. Starts slide toward one cell in try_dx/dy direction.
    ; Clobbers AF/BC/DE/HL.
    ld c, a
    ld a, (msx2_box2_moving_slot)
    cp #FF
    ret nz
    ld a, c
    ld b, 0
    push bc
    ld a, c
    call msx2_box2_clear_collision_for_slot
    call msx2_box2_restore_chars_for_slot
    ld a, c
    call msx2_box2_maybe_clear_map_visual_for_slot
    pop bc
    push bc
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld d, a
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld e, a
    ld a, (msx2_box2_try_dx)
    or a
    jr z, .box2_target_vert
    add a, d
    ld d, a
    jr .box2_target_store
.box2_target_vert:
    ld a, (msx2_box2_try_dy)
    add a, e
    ld e, a
.box2_target_store:
    ld hl, msx2_box2_runtime_target_x
    add hl, bc
    ld a, d
    ld (hl), a
    ld hl, msx2_box2_runtime_target_y
    add hl, bc
    ld a, e
    ld (hl), a
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    ld a, 1
    ld (hl), a
    pop bc
    ld a, c
    ld (msx2_box2_moving_slot), a
    xor a
    ld (msx2_box2_move_mode), a
    ret

msx2_box2_finish_slide:
    ; Snap to 8px grid, draw chars immediately, hide sprite. Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    cp #FF
    ret z
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    and #F8
    ld (hl), a
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    and #F8
    ld (hl), a
    ld hl, msx2_box2_runtime_target_x
    add hl, bc
    ld a, (hl)
    and #F8
    ld (hl), a
    ld hl, msx2_box2_runtime_target_y
    add hl, bc
    ld a, (hl)
    and #F8
    ld (hl), a
    ld a, c
    call msx2_box2_draw_chars_for_slot
    call msx2_box2_set_collision_for_slot
    ld a, c
    call msx2_box2_maybe_restore_map_visual_for_slot
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    xor a
    ld (hl), a
    ld a, #FF
    ld (msx2_box2_moving_slot), a
    xor a
    ld (msx2_box2_move_mode), a
    ret

msx2_box2_step_slide_toward_target:
    ; Input: (msx2_box2_moving_slot)=active slot. Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    ld c, a
    ld b, 0
    call msx2_box2_load_speed_for_slot
    ld a, (msx2_box2_speed_scratch)
    ld d, a
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld e, (hl)
    ld hl, msx2_box2_runtime_target_x
    add hl, bc
    ld a, (hl)
    cp e
    jr z, .box2_step_y_axis
    jr c, .box2_step_x_forward
    ld a, e
    sub d
    cp (hl)
    jr nc, .box2_step_x_write
    ld a, (hl)
    jr .box2_step_x_write
.box2_step_x_forward:
    ld a, e
    add a, d
    cp (hl)
    jr c, .box2_step_x_write
    jr z, .box2_step_x_write
    ld a, (hl)
.box2_step_x_write:
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld (hl), a
.box2_step_y_axis:
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld e, (hl)
    ld hl, msx2_box2_runtime_target_y
    add hl, bc
    ld a, (hl)
    cp e
    jr z, .box2_step_done_check
    jr c, .box2_step_y_forward
    ld a, e
    sub d
    cp (hl)
    jr nc, .box2_step_y_write
    ld a, (hl)
    jr .box2_step_y_write
.box2_step_y_forward:
    ld a, e
    add a, d
    cp (hl)
    jr c, .box2_step_y_write
    jr z, .box2_step_y_write
    ld a, (hl)
.box2_step_y_write:
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld (hl), a
.box2_step_done_check:
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld e, a
    ld hl, msx2_box2_runtime_target_x
    add hl, bc
    ld a, (hl)
    cp e
    jr nz, .box2_step_continue
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld e, a
    ld hl, msx2_box2_runtime_target_y
    add hl, bc
    ld a, (hl)
    cp e
    jr nz, .box2_step_continue
    jp msx2_box2_finish_slide
.box2_step_continue:
    ret

msx2_box2_slot_has_gravity:
    ; Input: C=slot. Zero flag clear when gravity is enabled. Clobbers AF/DE/HL. Preserves BC.
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_box2_gravity
    add hl, de
    add hl, bc
    ld a, (hl)
    pop bc
    or a
    ret

msx2_box2_slot_has_support:
    ; Input: (msx2_box2_active)=slot. Carry SET when supported below.
    ; Probes the bottom row (y+15) and the row below (y+16) for solid collision.
    ; Clobbers AF/BC/DE/HL. BC probe inputs survive msx2_collision_at_pixel; DE does not.
    ld a, (msx2_box2_active)
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    add a, 15
    ld e, a
    push de
    ld b, d
    ld c, e
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_supported
    push de
    ld b, d
    ld a, e
    inc a
    ld c, a
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_supported
    push de
    ld a, d
    add a, 15
    ld b, a
    ld c, e
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_supported
    push de
    ld a, d
    add a, 15
    ld b, a
    ld a, e
    inc a
    ld c, a
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_supported
    ld a, (msx2_box2_active)
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld b, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    add a, 15
    ld c, a
    call msx2_box2_find_at_pixel
    cp #FF
    jr z, .box2_unsupported
    ld c, a
    ld a, (msx2_box2_active)
    cp c
    jr z, .box2_unsupported
.box2_supported:
    scf
    ret
.box2_unsupported:
    or a
    ret

msx2_box2_try_gravity_falls:
    ; Start gravity fall for first unsupported gravity-enabled idle slot.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_count)
    or a
    ret z
    ld b, a
    ld c, 0
.box2_gravity_scan:
    push bc
    call msx2_box2_slot_has_gravity
    jr z, .box2_gravity_next
    ld a, c
    ld (msx2_box2_active), a
    call msx2_box2_slot_has_support
    jr c, .box2_gravity_next
    pop bc
    ld a, c
    call msx2_box2_start_gravity_fall
    ret
.box2_gravity_next:
    pop bc
    inc c
    djnz .box2_gravity_scan
    ret

msx2_box2_start_gravity_fall:
    ; Input: A=slot. Starts pixel fall when unsupported below. Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 0
    push bc
    ld a, c
    call msx2_box2_clear_collision_for_slot
    call msx2_box2_restore_chars_for_slot
    pop bc
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    ld a, 1
    ld (hl), a
    ld a, c
    ld (msx2_box2_moving_slot), a
    ld a, 1
    ld (msx2_box2_move_mode), a
    ret

msx2_box2_update_gravity_fall:
    ; Input: moving_slot = falling slot. Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    ld (msx2_box2_active), a
    call msx2_box2_slot_has_support
    jr c, msx2_box2_finish_gravity_fall
    ld a, (msx2_box2_moving_slot)
    ld c, a
    ld b, 0
    call msx2_box2_load_speed_for_slot
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld hl, msx2_box2_speed_scratch
    add a, (hl)
    cp 177
    jp nc, msx2_box2_finish_gravity_fall
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld (hl), a
    ret

msx2_box2_finish_gravity_fall:
    ; Snap Y, draw chars immediately. Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    cp #FF
    ret z
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    and #F8
    ld (hl), a
    ld a, c
    call msx2_box2_draw_chars_for_slot
    call msx2_box2_set_collision_for_slot
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    xor a
    ld (hl), a
    ld a, #FF
    ld (msx2_box2_moving_slot), a
    xor a
    ld (msx2_box2_move_mode), a
    ret

msx2_try_box2_from_player:
    ; Probe one cell ahead. Carry SET = blocked by box. Carry CLEAR = free or push started.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_count)
    or a
    ret z
    ld a, (msx2_box2_moving_slot)
    cp #FF
    jr z, .box2_try_idle
    ld a, (msx2_box2_move_mode)
    or a
    jr nz, .box2_player_blocked
    ; Slide already active: let the player keep moving while update_msx2_box2_boxes advances the box.
    or a
    ret
.box2_try_idle:
    ld a, (msx2_player_sprite_x)
    ld b, a
    ld a, (msx2_player_sprite_y)
    ld c, a
    ld a, (msx2_box2_try_dx)
    or a
    jr z, .box2_probe_vert_setup
    push af
    ld a, c
    add a, 8
    ld c, a
    pop af
    cp #80
    jp nc, .box2_probe_left
    ld a, b
    add a, 16
    ld b, a
    jr .box2_probe_ready
.box2_probe_left:
    ld a, b
    sub 16
    ld b, a
    jr .box2_probe_ready
.box2_probe_vert_setup:
    ld a, c
    add a, 8
    ld c, a
${verticalProbeAsm}.box2_probe_ready:
    call msx2_box2_find_at_pixel
    cp #FF
    jr z, .box2_player_free
    ld c, a
    push bc
    call msx2_box2_slot_allows_axis
    pop bc
    or a
    jr nz, .box2_player_blocked
    push bc
    call msx2_box2_player_aligned_for_push
    pop bc
    or a
    jr nz, .box2_player_blocked
    ld a, c
    ld (msx2_box2_active), a
    call msx2_box2_can_move_slot
    jr nc, .box2_player_blocked
    ld a, (msx2_box2_active)
    call msx2_box2_start_slide
.box2_player_free:
    or a
    ret
.box2_player_blocked:
    scf
    ret
`;
}

import { Msx2Screen4TileScreen } from '../../../../types';

export const MSX2_GRID_SNAP_UNIT = 8;
export const MSX2_GRID_CHAR_BLOCK_BYTES = 32;

export interface Msx2GridSnapSettings {
  gridUnit: number;
  charWidth: number;
  charHeight: number;
  snapOnStop: boolean;
}

export interface Msx2GridSnapCharBlock {
  charBase: number;
  pattern: number[];
  color: number[];
}

const clampByte = (value: number): number => Math.max(0, Math.min(255, Math.floor(value) || 0));

const clampCharBlockBase = (value: number): number => Math.max(1, Math.min(252, Math.floor(value) || 1));

export const getComponentValue = (
  entity: any,
  componentId: string,
  key: string,
  fallback: unknown
): unknown => entity?.components?.[componentId]?.[key] ?? entity?.params?.[key] ?? fallback;

export function getMsx2GridSnapSettings(entity: any): Msx2GridSnapSettings {
  const gridUnit = Math.max(8, Math.min(16, Number(getComponentValue(entity, 'msx2_grid_snap', 'gridUnit', 8)) || 8));
  const charWidth = Math.max(1, Math.min(2, Number(getComponentValue(entity, 'msx2_grid_snap', 'charWidth', 2)) || 2));
  const charHeight = Math.max(1, Math.min(2, Number(getComponentValue(entity, 'msx2_grid_snap', 'charHeight', 2)) || 2));
  const snapOnStop = getComponentValue(entity, 'msx2_grid_snap', 'snapOnStop', true) !== false;
  return { gridUnit, charWidth, charHeight, snapOnStop };
}

/** Char cells to stamp in the SCREEN 4 name table for a char-render entity. */
export function getMsx2CharStampDimensions(
  entity: any,
  tilePixelWidth = 16,
  tilePixelHeight = 16
): { charWidth: number; charHeight: number } {
  if (entity?.components?.msx2_grid_snap) {
    const grid = getMsx2GridSnapSettings(entity);
    return { charWidth: grid.charWidth, charHeight: grid.charHeight };
  }
  const hitboxW = Number(entity?.components?.msx2_collision?.hitboxW ?? tilePixelWidth) || tilePixelWidth;
  const hitboxH = Number(entity?.components?.msx2_collision?.hitboxH ?? tilePixelHeight) || tilePixelHeight;
  return {
    charWidth: Math.max(1, Math.min(2, Math.ceil(Math.max(hitboxW, tilePixelWidth) / 8))),
    charHeight: Math.max(1, Math.min(2, Math.ceil(Math.max(hitboxH, tilePixelHeight) / 8))),
  };
}

export function snapPixelToGrid(value: number, gridUnit: number): number {
  return clampByte(Math.floor(value / gridUnit) * gridUnit);
}

export function buildMsx2GridSnapCharDrawAsm(options: {
  drawLabel?: string;
  scratchCharVar?: string;
  nameVram?: string;
  includeErase?: boolean;
} = {}): string {
  const drawLabel = options.drawLabel || 'msx2_grid_draw_char_block_16';
  const scratchCharVar = options.scratchCharVar || 'msx2_grid_draw_char';
  const nameVram = options.nameVram || 'SCREEN4_NAME_VRAM';
  const includeErase = options.includeErase !== false;
  return `${drawLabel}:
    ; Draw a 2x2 SCREEN 4 char block (16x16 px) at pixel B=x, C=y.
    ; Char base code must be preloaded in (${scratchCharVar}).
    ; Clobbers AF/BC/DE/HL.
    ld a, b
    srl a
    srl a
    srl a
    srl a
    ld b, a
    ld a, c
    srl a
    srl a
    srl a
    srl a
    ld c, a
    ld hl, ${nameVram}
    ld a, c
    or a
    jp z, .grid_row_done
    ld de, 64
.grid_row_loop:
    add hl, de
    dec a
    jp nz, .grid_row_loop
.grid_row_done:
    ld a, b
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (${scratchCharVar})
    call WRTVRM
    inc hl
    ld a, (${scratchCharVar})
    inc a
    call WRTVRM
    ld de, 31
    add hl, de
    ld a, (${scratchCharVar})
    add a, 2
    call WRTVRM
    inc hl
    ld a, (${scratchCharVar})
    add a, 3
    call WRTVRM
    ret
${includeErase ? `
msx2_grid_erase_char_block_16:
    ; Erase a 2x2 char block at pixel B=x, C=y using char code in A.
    ; Clobbers AF/BC/DE/HL.
    ld (${scratchCharVar}), a
    jp ${drawLabel}
` : ''}`;
}

export function resolveMsx2GridSnapCharBase(
  entity: any,
  reservedBases: number[],
  fallback = 9
): number {
  const requested = Number(getComponentValue(entity, 'msx2_char_render', 'charCode', fallback));
  const base = clampCharBlockBase(Number.isFinite(requested) ? requested : fallback);
  if (!reservedBases.some(existing => Math.abs(existing - base) < 4)) return base;
  for (let candidate = base + 4; candidate <= 252; candidate += 4) {
    if (!reservedBases.some(existing => Math.abs(existing - candidate) < 4)) return candidate;
  }
  return base;
}

export function getMsx2GridSnapCharBlockFromEntity(
  screen: Msx2Screen4TileScreen | undefined,
  entity: any,
  resolveTileBytes: (screen: Msx2Screen4TileScreen | undefined, entity: any) => { pattern: number[]; color: number[] } | undefined
): Msx2GridSnapCharBlock {
  const charBase = clampCharBlockBase(Number(getComponentValue(entity, 'msx2_char_render', 'charCode', 9)));
  const bytes = resolveTileBytes(screen, entity) || {
    pattern: Array(32).fill(0xFF),
    color: Array(32).fill(0xCC),
  };
  return {
    charBase,
    pattern: bytes.pattern.slice(0, 32),
    color: bytes.color.slice(0, 32),
  };
}

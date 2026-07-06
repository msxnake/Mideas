"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComponentValue = exports.MSX2_GRID_CHAR_BLOCK_BYTES = exports.MSX2_GRID_SNAP_UNIT = void 0;
exports.getMsx2GridSnapSettings = getMsx2GridSnapSettings;
exports.getMsx2CharStampDimensions = getMsx2CharStampDimensions;
exports.snapPixelToGrid = snapPixelToGrid;
exports.buildMsx2GridSnapCharDrawAsm = buildMsx2GridSnapCharDrawAsm;
exports.resolveMsx2GridSnapCharBase = resolveMsx2GridSnapCharBase;
exports.getMsx2GridSnapCharBlockFromEntity = getMsx2GridSnapCharBlockFromEntity;
exports.MSX2_GRID_SNAP_UNIT = 8;
exports.MSX2_GRID_CHAR_BLOCK_BYTES = 32;
const clampByte = (value) => Math.max(0, Math.min(255, Math.floor(value) || 0));
const clampCharBlockBase = (value) => Math.max(1, Math.min(252, Math.floor(value) || 1));
const getComponentValue = (entity, componentId, key, fallback) => entity?.components?.[componentId]?.[key] ?? entity?.params?.[key] ?? fallback;
exports.getComponentValue = getComponentValue;
function getMsx2GridSnapSettings(entity) {
    const gridUnit = Math.max(8, Math.min(16, Number((0, exports.getComponentValue)(entity, 'msx2_grid_snap', 'gridUnit', 8)) || 8));
    const charWidth = Math.max(1, Math.min(2, Number((0, exports.getComponentValue)(entity, 'msx2_grid_snap', 'charWidth', 2)) || 2));
    const charHeight = Math.max(1, Math.min(2, Number((0, exports.getComponentValue)(entity, 'msx2_grid_snap', 'charHeight', 2)) || 2));
    const snapOnStop = (0, exports.getComponentValue)(entity, 'msx2_grid_snap', 'snapOnStop', true) !== false;
    return { gridUnit, charWidth, charHeight, snapOnStop };
}
/** Char cells to stamp in the SCREEN 4 name table for a char-render entity. */
function getMsx2CharStampDimensions(entity, tilePixelWidth = 16, tilePixelHeight = 16) {
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
function snapPixelToGrid(value, gridUnit) {
    return clampByte(Math.floor(value / gridUnit) * gridUnit);
}
function buildMsx2GridSnapCharDrawAsm(options = {}) {
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
function resolveMsx2GridSnapCharBase(entity, reservedBases, fallback = 9) {
    const requested = Number((0, exports.getComponentValue)(entity, 'msx2_char_render', 'charCode', fallback));
    const base = clampCharBlockBase(Number.isFinite(requested) ? requested : fallback);
    if (!reservedBases.some(existing => Math.abs(existing - base) < 4))
        return base;
    for (let candidate = base + 4; candidate <= 252; candidate += 4) {
        if (!reservedBases.some(existing => Math.abs(existing - candidate) < 4))
            return candidate;
    }
    return base;
}
function getMsx2GridSnapCharBlockFromEntity(screen, entity, resolveTileBytes) {
    const charBase = clampCharBlockBase(Number((0, exports.getComponentValue)(entity, 'msx2_char_render', 'charCode', 9)));
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

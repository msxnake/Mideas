"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMsx2Screen5Files = generateMsx2Screen5Files;
const constants_1 = require("../../../../constants");
const SCREEN5_WIDTH = 256;
const SCREEN5_HEIGHT = 212;
const SCREEN5_BYTES = (SCREEN5_WIDTH * SCREEN5_HEIGHT) / 2;
const CELL_SIZE = 8;
const TRANSPARENT_HEX = 'RGBA(0,0,0,0)';
const SCREEN5_SPRATR_VRAM = '#7600';
const SCREEN5_SPRCOL_VRAM = '#7400';
const SCREEN5_SPRPAT_VRAM = '#7800';
const MSX2_TILE_SCREEN_WIDTH = 16;
const MSX2_TILE_SCREEN_HEIGHT = 14;
const sanitizeLabel = (value, fallback) => String(value || fallback)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^([0-9])/, '_$1')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || fallback.toUpperCase();
const normalizeColor = (value) => String(value || '').trim().toUpperCase();
const parseHexColor = (hex) => {
    const normalized = normalizeColor(hex);
    if (!/^#[0-9A-F]{6}$/.test(normalized))
        return null;
    return {
        r: parseInt(normalized.slice(1, 3), 16),
        g: parseInt(normalized.slice(3, 5), 16),
        b: parseInt(normalized.slice(5, 7), 16),
    };
};
const colorDistance = (a, b) => {
    const ca = parseHexColor(a);
    const cb = parseHexColor(b);
    if (!ca || !cb)
        return Number.MAX_SAFE_INTEGER;
    const dr = ca.r - cb.r;
    const dg = ca.g - cb.g;
    const db = ca.b - cb.b;
    return dr * dr + dg * dg + db * db;
};
function resolveScreen5Palette(analysis) {
    const assets = analysis.assets;
    const paletteAsset = assets?.find(asset => asset?.type === 'palette')?.data;
    if (paletteAsset?.mode === 'SCREEN5' && paletteAsset.slots?.length === 16) {
        return paletteAsset.slots.map(slot => ({ ...slot }));
    }
    const bitmapPalette = (analysis.msx2Bitmaps || []).find(bitmap => bitmap.palette?.length === 16)?.palette;
    if (bitmapPalette?.length === 16) {
        return bitmapPalette.map(slot => ({ ...slot }));
    }
    const tileScreenPalette = (analysis.msx2Screens || []).find(screen => screen.palette?.length === 16)?.palette;
    if (tileScreenPalette?.length === 16) {
        return tileScreenPalette.map(slot => ({ ...slot }));
    }
    const tilePalette = (analysis.tiles || []).find(tile => tile.screen5Palette?.length === 16)?.screen5Palette;
    if (tilePalette?.length === 16) {
        return tilePalette.map(slot => ({ ...slot }));
    }
    return constants_1.DEFAULT_SCREEN5_CUSTOM_PALETTE.map(slot => ({ ...slot }));
}
function paletteIndexForColor(color, slots) {
    const normalized = normalizeColor(color);
    if (!normalized || normalized === TRANSPARENT_HEX)
        return 0;
    const exactIndex = slots.findIndex(slot => normalizeColor(slot.hex) === normalized);
    if (exactIndex >= 0)
        return exactIndex & 0x0f;
    let bestIndex = 0;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    for (let i = 1; i < slots.length; i++) {
        const distance = colorDistance(normalized, slots[i].hex);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = i;
        }
    }
    return bestIndex & 0x0f;
}
function getTilePixel(tile, subTileX, subTileY, x, y) {
    if (!tile)
        return undefined;
    return tile.data?.[(subTileY * CELL_SIZE) + y]?.[(subTileX * CELL_SIZE) + x];
}
function buildScreen5BitmapBytes(screen, tiles, slots) {
    const bytes = [];
    const tileById = new Map(tiles.map(tile => [tile.id, tile]));
    const backgroundLayer = screen?.layers?.background || [];
    for (let y = 0; y < SCREEN5_HEIGHT; y++) {
        const cellY = Math.floor(y / CELL_SIZE);
        const pixelY = y % CELL_SIZE;
        for (let byteX = 0; byteX < SCREEN5_WIDTH / 2; byteX++) {
            const x0 = byteX * 2;
            const x1 = x0 + 1;
            const cellX0 = Math.floor(x0 / CELL_SIZE);
            const cellX1 = Math.floor(x1 / CELL_SIZE);
            const screenTile0 = backgroundLayer[cellY]?.[cellX0];
            const screenTile1 = backgroundLayer[cellY]?.[cellX1];
            const tile0 = screenTile0?.tileId ? tileById.get(screenTile0.tileId) : undefined;
            const tile1 = screenTile1?.tileId ? tileById.get(screenTile1.tileId) : undefined;
            const hi = paletteIndexForColor(getTilePixel(tile0, screenTile0?.subTileX || 0, screenTile0?.subTileY || 0, x0 % CELL_SIZE, pixelY), slots);
            const lo = paletteIndexForColor(getTilePixel(tile1, screenTile1?.subTileX || 0, screenTile1?.subTileY || 0, x1 % CELL_SIZE, pixelY), slots);
            bytes.push(((hi & 0x0f) << 4) | (lo & 0x0f));
        }
    }
    return bytes;
}
function buildScreen5BitmapBytesFromAsset(bitmap) {
    const bytes = [];
    const pixels = bitmap?.pixels || [];
    for (let y = 0; y < SCREEN5_HEIGHT; y++) {
        const row = pixels[y] || [];
        for (let byteX = 0; byteX < SCREEN5_WIDTH / 2; byteX++) {
            const x0 = byteX * 2;
            const hi = Math.max(0, Math.min(15, Number(row[x0]) || 0));
            const lo = Math.max(0, Math.min(15, Number(row[x0 + 1]) || 0));
            bytes.push(((hi & 0x0f) << 4) | (lo & 0x0f));
        }
    }
    return bytes;
}
function buildScreen5BitmapBytesFromTileScreen(screen) {
    const bytes = [];
    const tiles = screen?.tiles || [];
    const map = screen?.map || [];
    const tileByIndex = (index) => tiles[Math.max(0, Math.min(tiles.length - 1, Number(index) || 0))];
    for (let y = 0; y < SCREEN5_HEIGHT; y++) {
        const tileY = Math.floor(y / 16);
        const pixelY = y % 16;
        for (let byteX = 0; byteX < SCREEN5_WIDTH / 2; byteX++) {
            const x0 = byteX * 2;
            const x1 = x0 + 1;
            const tileX0 = Math.floor(x0 / 16);
            const tileX1 = Math.floor(x1 / 16);
            const tile0 = tileByIndex(map[tileY]?.[tileX0] ?? 0);
            const tile1 = tileByIndex(map[tileY]?.[tileX1] ?? 0);
            const hi = Math.max(0, Math.min(15, Number(tile0?.pixels?.[pixelY]?.[x0 % 16]) || 0));
            const lo = Math.max(0, Math.min(15, Number(tile1?.pixels?.[pixelY]?.[x1 % 16]) || 0));
            bytes.push(((hi & 0x0f) << 4) | (lo & 0x0f));
        }
    }
    return bytes;
}
function buildTileScreenLayerBytes(screen, layerName) {
    const fallback = layerName === 'collision' ? screen?.collisionMap : undefined;
    const layer = screen?.layers?.[layerName];
    const bytes = [];
    for (let y = 0; y < MSX2_TILE_SCREEN_HEIGHT; y++) {
        for (let x = 0; x < MSX2_TILE_SCREEN_WIDTH; x++) {
            bytes.push(Math.max(0, Math.min(255, Number(layer?.[y]?.[x] ?? fallback?.[y]?.[x] ?? 0) || 0)));
        }
    }
    return bytes;
}
function buildPaletteBytes(slots) {
    const bytes = [];
    for (let i = 0; i < 16; i++) {
        const slot = slots[i];
        if (!slot || slot.masterIndex < 0) {
            bytes.push(0, 0);
            continue;
        }
        const r = (slot.masterIndex >> 6) & 0x07;
        const g = (slot.masterIndex >> 3) & 0x07;
        const b = slot.masterIndex & 0x07;
        bytes.push((r << 4) | b, g);
    }
    return bytes;
}
function formatBytes(label, bytes, comment) {
    const lines = [];
    if (comment)
        lines.push(`; ${comment}`);
    lines.push(`${label}:`);
    for (let offset = 0; offset < bytes.length; offset += 16) {
        lines.push(`    DB ${bytes.slice(offset, offset + 16).map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}`);
    }
    return `${lines.join('\n')}\n`;
}
function getHardwareSpriteSource(analysis) {
    return analysis.msx2Sprites?.[0];
}
function getHardwareSpriteSettings(sprite) {
    const hardware = sprite.hardware;
    return {
        x: Number.isFinite(Number(hardware?.x)) ? Number(hardware?.x) : 56,
        y: Number.isFinite(Number(hardware?.y)) ? Number(hardware?.y) : 120,
        color: Number.isFinite(Number(hardware?.color)) ? Number(hardware?.color) : 5,
        patternIndex: Number.isFinite(Number(hardware?.patternIndex)) ? Number(hardware?.patternIndex) : 0,
    };
}
function clampTileCoordinate(value, max) {
    return Math.max(0, Math.min(max, Number(value) || 0));
}
function getPrimaryRuntimeTileScreen(analysis) {
    return collectReferencedTileScreens(analysis)[0] || analysis.msx2Screens?.[0];
}
function getPlayerStartFromTileScreen(screen) {
    const player = screen?.layers?.entities?.find(entity => entity.kind === 'player')
        || screen?.layers?.entities?.[0];
    if (!player?.position)
        return undefined;
    return {
        x: clampHardwareSpriteX(clampTileCoordinate(player.position.x, 15) * 16),
        y: clampHardwareSpriteY(clampTileCoordinate(player.position.y, 13) * 16),
    };
}
function getHardwareSpriteRuntimeSettings(analysis, sprite) {
    const settings = getHardwareSpriteSettings(sprite);
    const start = getPlayerStartFromTileScreen(getPrimaryRuntimeTileScreen(analysis));
    return {
        ...settings,
        x: start?.x ?? settings.x,
        y: start?.y ?? settings.y,
    };
}
function getRuntimePatrolBounds(analysis) {
    const screen = getPrimaryRuntimeTileScreen(analysis);
    const runtime = screen?.runtime;
    const minTileX = clampTileCoordinate(runtime?.activeAreaX, 15);
    const widthTiles = Math.max(1, Math.min(16 - minTileX, Number(runtime?.activeAreaWidth) || 16));
    const minX = Math.max(1, minTileX * 16);
    const maxX = Math.max(minX + 1, Math.min(239, (minTileX + widthTiles) * 16 - 16));
    return { minX, maxX };
}
function isTransparentSpritePixel(color, sprite) {
    const normalized = normalizeColor(color);
    if (!normalized || normalized === TRANSPARENT_HEX)
        return true;
    return normalized === normalizeColor(sprite.backgroundColor);
}
function spritePatternByteForLayer(rowCompositions, layerIndex, x0, y) {
    const mask = rowCompositions[y]?.masks[layerIndex] || 0;
    if (!mask)
        return 0;
    let value = 0;
    for (let bit = 0; bit < 8; bit++) {
        if (mask & (1 << (x0 + bit))) {
            value |= 0x80 >> bit;
        }
    }
    return value;
}
function buildHardwareSpritePatternForLayer(rowCompositions, layerIndex) {
    const bytes = [];
    // V9938 16x16 sprites use four consecutive 8x8 patterns:
    // top-left, top-right, bottom-left, bottom-right.
    for (let y = 0; y < 8; y++)
        bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 0, y));
    for (let y = 0; y < 8; y++)
        bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 8, y));
    for (let y = 8; y < 16; y++)
        bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 0, y));
    for (let y = 8; y < 16; y++)
        bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 8, y));
    return bytes;
}
function paletteSlotForSpriteColor(sprite, color) {
    const normalized = normalizeColor(color);
    if (!normalized || isTransparentSpritePixel(color, sprite))
        return undefined;
    const slotIndex = sprite.palette?.find(slot => normalizeColor(slot.hex) === normalized)?.slotIndex;
    if (typeof slotIndex === 'number' && slotIndex > 0 && slotIndex < 16)
        return slotIndex;
    return undefined;
}
function findBestOrColorPair(slots, counts) {
    let best;
    slots.forEach(base => {
        slots.forEach(overlay => {
            if (base === overlay)
                return;
            const result = base | overlay;
            if (result === base || result === overlay || !slots.includes(result))
                return;
            const score = ((counts.get(result) || 0) * 4) + (counts.get(base) || 0) + (counts.get(overlay) || 0);
            if (!best || score > best.score || (score === best.score && result < best.pair.result)) {
                best = { pair: { base, overlay, result }, score };
            }
        });
    });
    return best?.pair;
}
function buildCellRowComposition(slots, useOrColor) {
    const counts = new Map();
    slots.forEach(slot => {
        if (slot > 0)
            counts.set(slot, (counts.get(slot) || 0) + 1);
    });
    const uniqueSlots = Array.from(counts.keys()).sort((a, b) => a - b);
    if (!uniqueSlots.length)
        return { masks: [0], colors: [0] };
    const masks = [];
    const colors = [];
    const handled = new Set();
    const orPair = useOrColor ? findBestOrColorPair(uniqueSlots, counts) : undefined;
    if (orPair) {
        let baseMask = 0;
        let overlayMask = 0;
        slots.forEach((slot, x) => {
            if (slot === orPair.base)
                baseMask |= 1 << x;
            if (slot === orPair.overlay)
                overlayMask |= 1 << x;
            if (slot === orPair.result) {
                baseMask |= 1 << x;
                overlayMask |= 1 << x;
            }
        });
        masks.push(baseMask);
        colors.push(orPair.base);
        masks.push(overlayMask);
        colors.push(0x40 | orPair.overlay);
        handled.add(orPair.base);
        handled.add(orPair.overlay);
        handled.add(orPair.result);
    }
    uniqueSlots.forEach(slot => {
        if (handled.has(slot))
            return;
        let mask = 0;
        slots.forEach((rowSlot, x) => {
            if (rowSlot === slot)
                mask |= 1 << x;
        });
        masks.push(mask);
        colors.push(slot);
    });
    return { masks, colors };
}
function buildHardwareSpriteLayers(sprite, fallbackColor) {
    const frame = sprite.frames?.[sprite.currentFrameIndex || 0] || sprite.frames?.[0];
    const useOrColor = sprite.hardware?.useOrColor !== false;
    const cellColumns = Math.max(1, Math.ceil((sprite.size?.width || 16) / 16));
    const cellRows = Math.max(1, Math.ceil((sprite.size?.height || 16) / 16));
    const layers = [];
    for (let cellY = 0; cellY < cellRows; cellY++) {
        for (let cellX = 0; cellX < cellColumns; cellX++) {
            const xOffset = cellX * 16;
            const yOffset = cellY * 16;
            const rowCompositions = Array.from({ length: 16 }, (_, y) => {
                const slots = Array.from({ length: 16 }, (_, x) => paletteSlotForSpriteColor(sprite, frame?.data?.[yOffset + y]?.[xOffset + x]) || 0);
                return buildCellRowComposition(slots, useOrColor);
            });
            const layerCount = Math.min(8, Math.max(1, ...rowCompositions.map(row => row.colors.length)));
            for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
                const colors = rowCompositions.map(row => row.colors[layerIndex] ?? 0);
                const hasPixels = rowCompositions.some(row => (row.masks[layerIndex] || 0) !== 0);
                if (!hasPixels)
                    continue;
                layers.push({
                    pattern: buildHardwareSpritePatternForLayer(rowCompositions, layerIndex),
                    colors: colors.map(color => color || Math.max(1, Math.min(15, fallbackColor))),
                    xOffset,
                    yOffset,
                });
            }
        }
    }
    return layers.length ? layers : [{
            pattern: Array(32).fill(0),
            colors: Array(16).fill(Math.max(1, Math.min(15, fallbackColor))),
            xOffset: 0,
            yOffset: 0,
        }];
}
function clampHardwareSpriteY(value) {
    return Math.max(0, Math.min(211, value));
}
function clampHardwareSpriteX(value) {
    return Math.max(0, Math.min(255, value));
}
function clampBasePatternIndex(patternIndex, spriteCount) {
    const aligned = Math.max(0, patternIndex) & 0xFC;
    const maxBase = Math.max(0, 252 - (Math.max(1, spriteCount) - 1) * 4);
    return Math.min(aligned, maxBase & 0xFC);
}
function clampHardwareSpriteCount(layers) {
    return layers.slice(0, 32);
}
function hasHardwareSprite(analysis) {
    const sprite = getHardwareSpriteSource(analysis);
    return Boolean(sprite?.frames?.[0]?.data);
}
function buildHardwareSpriteInitAsm(analysis) {
    const sprite = getHardwareSpriteSource(analysis);
    if (!sprite)
        return '';
    const settings = getHardwareSpriteRuntimeSettings(analysis, sprite);
    const x = clampHardwareSpriteX(settings.x);
    const y = clampHardwareSpriteY(settings.y);
    return `init_hardware_sprites:
    ; SCREEN 5 hardware sprite runtime. Clobbers AF/BC/DE/HL.
    ; Preserve the SCREEN 5 mode bits set by CHGMOD; only select 16x16, non-magnified sprites.
    ld a, (#F3E0)
    or #02
    and #FE
    ld (#F3E0), a
    ld b, a
    ld c, #01
    call WRTVDP

    ; Sprite attribute/color/pattern tables live above the SCREEN 5 bitmap.
    ; In sprite mode 2, R#5 selects the combined color+attribute table:
    ; color table #7400, SAT #7600. Bits 0-2 must be 1.
    ld bc, #EF05
    call WRTVDP
    ld bc, #000B
    call WRTVDP
    ld bc, #0F06
    call WRTVDP

    ld hl, msx2_hw_sprite_patterns
    ld de, ${SCREEN5_SPRPAT_VRAM}
    ld bc, msx2_hw_sprite_patterns_end - msx2_hw_sprite_patterns
    call LDIRVM

    ld hl, msx2_hw_sprite_colors
    ld de, ${SCREEN5_SPRCOL_VRAM}
    ld bc, msx2_hw_sprite_colors_end - msx2_hw_sprite_colors
    call LDIRVM

    ld hl, msx2_hw_sprite_attrs
    ld de, ${SCREEN5_SPRATR_VRAM}
    ld bc, 128
    call LDIRVM

    ld a, ${x}
    ld (msx2_player_sprite_x), a
    ld a, ${y}
    ld (msx2_player_sprite_y), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    xor a
    ld (msx2_player_sprite_frame), a
    call upload_hardware_sprite_attrs

    xor a
    ld bc, #000E
    call WRTVDP
    ret

copy_to_vram_ext:
    ; HL=RAM/ROM source, DE=absolute VRAM destination, BC=length. Clobbers AF/BC/DE/HL.
    ld a, d
    and #C0
    rlca
    rlca
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
.copy_loop:
    ld a, (hl)
    out (VDP_DATA_PORT), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .copy_loop
    ret

write_vram_byte_ext:
    ; A=data, HL=absolute VRAM destination. Clobbers AF/B.
    ld b, a
    ld a, h
    and #C0
    rlca
    rlca
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ld a, l
    out (VDP_CTRL_PORT), a
    ld a, h
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
    ld a, b
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ret

`;
}
function addImmediateToA(value) {
    if (!value)
        return '';
    return `    add a, ${Math.max(0, Math.min(255, value))}\n`;
}
function buildHardwareSpriteRuntimeAsm(analysis) {
    const sprite = getHardwareSpriteSource(analysis);
    if (!sprite)
        return '';
    const settings = getHardwareSpriteSettings(sprite);
    const color = Math.max(1, Math.min(15, settings.color));
    const layers = clampHardwareSpriteCount(buildHardwareSpriteLayers(sprite, color));
    const basePatternIndex = clampBasePatternIndex(settings.patternIndex, layers.length);
    const patrolBounds = getRuntimePatrolBounds(analysis);
    const attrWrites = layers.map((layer, layerIndex) => {
        const attrAddress = 0x7600 + (layerIndex * 4);
        return `    ; Sprite layer ${layerIndex}: x+${layer.xOffset}, y+${layer.yOffset}
    ld a, (msx2_player_sprite_y)
${addImmediateToA(layer.yOffset)}    ld hl, #${attrAddress.toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
${addImmediateToA(layer.xOffset)}    ld hl, #${(attrAddress + 1).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    ld a, ${basePatternIndex + (layerIndex * 4)}
    ld hl, #${(attrAddress + 2).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
    xor a
    ld hl, #${(attrAddress + 3).toString(16).toUpperCase().padStart(4, '0')}
    call write_vram_byte_ext
`;
    }).join('\n');
    return `update_hardware_sprite_input:
    ; First playable MSX2 slice: keyboard/joystick left-right with collision guard.
    ; Falls back to autonomous patrol when there is no input, so smoke captures still prove runtime.
    ; Clobbers AF/BC/DE/HL.
    xor a
    call GTSTCK
    cp 2
    jp z, move_hardware_sprite_right
    cp 3
    jp z, move_hardware_sprite_right
    cp 4
    jp z, move_hardware_sprite_right
    cp 6
    jp z, move_hardware_sprite_left
    cp 7
    jp z, move_hardware_sprite_left
    cp 8
    jp z, move_hardware_sprite_left
    jp auto_patrol_hardware_sprite

move_hardware_sprite_right:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.maxX}
    jp nc, upload_hardware_sprite_attrs
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

move_hardware_sprite_left:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.minX}
    jp z, upload_hardware_sprite_attrs
    jp c, upload_hardware_sprite_attrs
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, upload_hardware_sprite_attrs
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

auto_patrol_hardware_sprite:
    ; Move every 4 frames so the sprite visibly patrols without racing.
    ld a, (msx2_player_sprite_frame)
    inc a
    and 3
    ld (msx2_player_sprite_frame), a
    ret nz
    ld a, (msx2_player_sprite_dx)
    or a
    jp z, .patrol_left
.patrol_right:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.maxX}
    jp c, .patrol_right_apply
    xor a
    ld (msx2_player_sprite_dx), a
    jp .patrol_left
.patrol_right_apply:
    inc a
    ld (msx2_player_sprite_x), a
    jp upload_hardware_sprite_attrs
.patrol_left:
    ld a, (msx2_player_sprite_x)
    cp ${patrolBounds.minX}
    jp nc, .patrol_left_apply
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp .patrol_right
.patrol_left_apply:
    dec a
    ld (msx2_player_sprite_x), a
    jp upload_hardware_sprite_attrs

upload_hardware_sprite_attrs:
    ; Writes visible sprite layer attributes to SCREEN 5 SAT. Clobbers AF/HL.
${attrWrites}    ret

msx2_collision_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=collision byte with Z set when empty.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_collision_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

`;
}
function buildHardwareSpriteDataAsm(analysis) {
    const sprite = getHardwareSpriteSource(analysis);
    if (!sprite)
        return '';
    const settings = getHardwareSpriteRuntimeSettings(analysis, sprite);
    const y = clampHardwareSpriteY(settings.y);
    const x = clampHardwareSpriteX(settings.x);
    const color = Math.max(1, Math.min(15, settings.color));
    const layers = clampHardwareSpriteCount(buildHardwareSpriteLayers(sprite, color));
    const basePatternIndex = clampBasePatternIndex(settings.patternIndex, layers.length);
    const visibleAttributes = layers.flatMap((layer, layerIndex) => [
        clampHardwareSpriteY(y + layer.yOffset),
        clampHardwareSpriteX(x + layer.xOffset),
        basePatternIndex + (layerIndex * 4),
        0,
    ]);
    const terminator = [216, 0, 0, 0];
    const attributes = [...visibleAttributes, ...terminator, ...Array(Math.max(0, 128 - visibleAttributes.length - terminator.length)).fill(0)];
    return `
msx2_hw_sprite_patterns:
${layers.map((layer, index) => formatBytes(`msx2_hw_sprite_pattern_${index}`, layer.pattern, `Hardware metasprite part ${index}: x+${layer.xOffset}, y+${layer.yOffset}`)).join('')}msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
${layers.map((layer, index) => formatBytes(`msx2_hw_sprite_colors_${index}`, layer.colors, `Line colors for hardware sprite layer ${index}`)).join('')}msx2_hw_sprite_colors_end:

${formatBytes('msx2_hw_sprite_attrs', attributes, `${layers.length} visible metasprite hardware sprite(s); next Y=216 terminates the SAT`)}
`;
}
function defaultTargetNodeId(connections, nodeId) {
    return (connections || []).find(connection => connection.from?.nodeId === nodeId && !connection.from?.sourceId)?.to?.nodeId;
}
function resolveScreenByAssetId(analysis, assetId) {
    if (!assetId)
        return undefined;
    const assets = analysis.assets;
    const asset = assets?.find(item => item.id === assetId && item.type === 'screenmap');
    if (asset?.data)
        return asset.data;
    return (analysis.screenMaps || []).find(screen => screen.id === assetId);
}
function resolveTileScreenByAssetId(analysis, assetId) {
    if (!assetId)
        return undefined;
    const assets = analysis.assets;
    const asset = assets?.find(item => item.id === assetId && item.type === 'msx2screen');
    if (asset?.data)
        return asset.data;
    return (analysis.msx2Screens || []).find(screen => screen.id === assetId);
}
function resolveWorldStartScreenAssetId(analysis, worldAssetId) {
    if (!worldAssetId)
        return undefined;
    const world = (analysis.worldmaps || []).find((candidate) => candidate?.id === worldAssetId);
    const startNodeId = world?.startScreenNodeId || world?.nodes?.[0]?.id;
    const startNode = world?.nodes?.find((node) => node?.id === startNodeId) || world?.nodes?.[0];
    return startNode?.screenAssetId;
}
function collectReferencedScreens(analysis) {
    const screens = new Map();
    const addScreen = (screen) => {
        if (!screen)
            return;
        screens.set(screen.id || screen.name || `screen_${screens.size}`, screen);
    };
    addScreen(analysis.screenMaps?.[0]);
    for (const node of analysis.gameFlow?.nodes || []) {
        if (node.type === 'Text') {
            addScreen(resolveScreenByAssetId(analysis, node.appearance?.backgroundScreenAssetId));
        }
        else if (node.type === 'SubMenu') {
            addScreen(resolveScreenByAssetId(analysis, node.appearance?.backgroundScreenAssetId));
        }
        else if (node.type === 'Restart') {
            addScreen(resolveScreenByAssetId(analysis, node.appearance?.backgroundScreenAssetId));
        }
    }
    return Array.from(screens.values());
}
function collectReferencedTileScreens(analysis) {
    const screens = new Map();
    const addScreen = (screen) => {
        if (!screen)
            return;
        screens.set(screen.id || screen.name || `msx2_screen_${screens.size}`, screen);
    };
    addScreen(analysis.msx2Screens?.[0]);
    for (const node of analysis.gameFlow?.nodes || []) {
        if (node.type !== 'WorldLink')
            continue;
        const screenAssetId = resolveWorldStartScreenAssetId(analysis, node.worldAssetId);
        addScreen(resolveTileScreenByAssetId(analysis, screenAssetId));
    }
    return Array.from(screens.values());
}
function screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, screenAssetId) {
    const screen = resolveScreenByAssetId(analysis, screenAssetId);
    if (screen)
        return screenLabels.get(screen.id || screen.name);
    const tileScreen = resolveTileScreenByAssetId(analysis, screenAssetId);
    if (tileScreen)
        return tileScreenLabels.get(tileScreen.id || tileScreen.name);
    return undefined;
}
function buildMsx2GameFlowProgram(analysis, screenLabels, tileScreenLabels) {
    const graph = analysis.gameFlow;
    const fallbackLabel = tileScreenLabels.values().next().value || screenLabels.values().next().value;
    if (!graph?.nodes?.length) {
        return fallbackLabel ? `    call load_${fallbackLabel}_bitmap\n` : '';
    }
    const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
    const startNodeId = graph.startNodeId || graph.nodes.find(node => node.type === 'Start')?.id;
    const lines = [
        '    ; MSX2 minimal GameFlow: Start/Text(background)/Transition(cls)/End.',
    ];
    const unsupported = new Set();
    const visited = new Set();
    let terminated = false;
    let current = startNodeId ? nodeById.get(startNodeId) : undefined;
    while (current && !visited.has(current.id)) {
        visited.add(current.id);
        switch (current.type) {
            case 'Start':
            case 'Waypoint':
            case 'Globals':
            case 'Music':
                break;
            case 'Text': {
                const screen = resolveScreenByAssetId(analysis, current.appearance?.backgroundScreenAssetId) || analysis.screenMaps?.[0];
                const label = screen ? screenLabels.get(screen.id || screen.name) : undefined;
                if (label)
                    lines.push(`    call load_${label}_bitmap`);
                lines.push('    call wait_key');
                break;
            }
            case 'SubMenu': {
                const screen = resolveScreenByAssetId(analysis, current.appearance?.backgroundScreenAssetId) || analysis.screenMaps?.[0];
                const label = screen ? screenLabels.get(screen.id || screen.name) : undefined;
                if (label)
                    lines.push(`    call load_${label}_bitmap`);
                lines.push('    call wait_key');
                break;
            }
            case 'WorldLink': {
                const screenAssetId = resolveWorldStartScreenAssetId(analysis, current.worldAssetId);
                const label = screenLoadLabelForAssetId(analysis, screenLabels, tileScreenLabels, screenAssetId) || fallbackLabel;
                if (label)
                    lines.push(`    call load_${label}_bitmap`);
                lines.push('    jp .main_loop');
                terminated = true;
                current = undefined;
                continue;
            }
            case 'Transition':
                if (current.effect === 'cls') {
                    lines.push('    call clear_screen5_bitmap');
                }
                else {
                    unsupported.add(`Transition:${current.effect}`);
                }
                break;
            case 'End':
                lines.push('    jp .main_loop');
                terminated = true;
                current = undefined;
                continue;
            case 'Restart':
                lines.push('    jp init_rom');
                terminated = true;
                current = undefined;
                continue;
            default:
                unsupported.add(current.type);
                break;
        }
        const nextNodeId = defaultTargetNodeId(graph.connections, current.id);
        current = nextNodeId ? nodeById.get(nextNodeId) : undefined;
    }
    if (unsupported.size > 0) {
        lines.push(`    ; Unsupported MSX2 GameFlow nodes skipped in MVP: ${Array.from(unsupported).join(', ')}`);
    }
    if (!terminated) {
        lines.push('    jp .main_loop');
    }
    return `${lines.join('\n')}\n`;
}
function generateUnitedFiles(projectName, analysis, config) {
    const screens = collectReferencedScreens(analysis);
    const bitmaps = analysis.msx2Bitmaps || [];
    const tileScreens = collectReferencedTileScreens(analysis);
    const slots = resolveScreen5Palette(analysis);
    const paletteBytes = buildPaletteBytes(slots);
    const title = projectName.replace(/[^ -~]/g, '');
    const bitmapLabels = new Map();
    const screenLabels = new Map();
    const bitmapBlocks = bitmaps.map((bitmap, index) => {
        const label = sanitizeLabel(bitmap?.name || `msx2_bitmap_${index}`, `MSX2_BITMAP_${index}`);
        bitmapLabels.set(bitmap.id || bitmap.name || `bitmap_${index}`, label);
        return formatBytes(`${label}_BITMAP`, buildScreen5BitmapBytesFromAsset(bitmap), `${bitmap?.name || `Bitmap ${index}`} packed as SCREEN 5, 2 pixels per byte`);
    });
    const screenBitmapBlocks = screens.map((screen, index) => {
        const label = sanitizeLabel(screen?.name || `screen5_screen_${index}`, `SCREEN5_SCREEN_${index}`);
        screenLabels.set(screen.id || screen.name || `screen_${index}`, label);
        return formatBytes(`${label}_BITMAP`, buildScreen5BitmapBytes(screen, analysis.tiles || [], slots), `${screen?.name || `Screen ${index}`} rasterized as SCREEN 5, 2 pixels per byte`);
    });
    const tileScreenBlocks = tileScreens.map((screen, index) => {
        const label = sanitizeLabel(screen?.name || `msx2_screen5_screen_${index}`, `MSX2_SCREEN5_SCREEN_${index}`);
        bitmapLabels.set(screen.id || screen.name || `tile_screen_${index}`, label);
        return formatBytes(`${label}_BITMAP`, buildScreen5BitmapBytesFromTileScreen(screen), `${screen?.name || `MSX2 Tile Screen ${index}`} rasterized from 16x16 SCREEN 5 bitmap tiles`);
    });
    if (bitmapBlocks.length === 0 && screenBitmapBlocks.length === 0 && tileScreenBlocks.length === 0) {
        bitmapBlocks.push(formatBytes('SCREEN5_SCREEN_0_BITMAP', Array(SCREEN5_BYTES).fill(0), 'Empty SCREEN 5 bitmap'));
    }
    const bitmapLoadLabels = bitmaps.map((bitmap, index) => bitmapLabels.get(bitmap.id || bitmap.name || `bitmap_${index}`) || sanitizeLabel(bitmap.name, `MSX2_BITMAP_${index}`));
    const screenLoadLabels = screens.map((screen, index) => screenLabels.get(screen.id || screen.name || `screen_${index}`) || sanitizeLabel(screen.name, `SCREEN5_SCREEN_${index}`));
    const tileScreenLabels = new Map();
    const tileScreenLoadLabels = tileScreens.map((screen, index) => bitmapLabels.get(screen.id || screen.name || `tile_screen_${index}`) || sanitizeLabel(screen.name, `MSX2_SCREEN5_SCREEN_${index}`));
    const runtimeLayerLabels = new Map();
    tileScreens.forEach((screen, index) => {
        const label = tileScreenLoadLabels[index];
        tileScreenLabels.set(screen.id || screen.name || `tile_screen_${index}`, label);
        runtimeLayerLabels.set(label, {
            collision: `${label}_COLLISION`,
            effects: `${label}_EFFECTS`,
        });
    });
    const tileScreenRuntimeBlocks = tileScreens.map((screen, index) => {
        const label = tileScreenLoadLabels[index];
        return [
            formatBytes(`${label}_COLLISION`, buildTileScreenLayerBytes(screen, 'collision'), `${screen?.name || `MSX2 Tile Screen ${index}`} collision layer, 16x14 bytes`),
            formatBytes(`${label}_EFFECTS`, buildTileScreenLayerBytes(screen, 'effects'), `${screen?.name || `MSX2 Tile Screen ${index}`} effects layer, 16x14 bytes`),
        ].join('\n');
    });
    const allLoadLabels = [...tileScreenLoadLabels, ...bitmapLoadLabels, ...screenLoadLabels];
    const firstScreen = screens[0] || analysis.screenMaps?.[0];
    const firstScreenLabel = allLoadLabels[0]
        || (firstScreen ? screenLabels.get(firstScreen.id || firstScreen.name) || sanitizeLabel(firstScreen.name, 'SCREEN5_SCREEN_0') : 'SCREEN5_SCREEN_0');
    const gameFlowProgram = buildMsx2GameFlowProgram(analysis, screenLabels, tileScreenLabels);
    const hardwareSpriteInitAsm = buildHardwareSpriteInitAsm(analysis);
    const hardwareSpriteDataAsm = buildHardwareSpriteDataAsm(analysis);
    const loadRuntimeLayerPointers = (label) => {
        const runtimeLabels = runtimeLayerLabels.get(label);
        const collisionLabel = runtimeLabels?.collision || 'screen5_empty_collision_layer';
        const effectsLabel = runtimeLabels?.effects || 'screen5_empty_effects_layer';
        return `    ld hl, ${collisionLabel}
    ld (msx2_current_collision_ptr), hl
    ld hl, ${effectsLabel}
    ld (msx2_current_effects_ptr), hl
`;
    };
    return `; ==================================================================
; Mideas MSX2 SCREEN 5 bitmap backend
; Project: ${title}
; Screen mode: ${config.screenMode}
; ROM mode requested: ${config.romMode}
; Mapper requested: ${config.targetFormat}
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
FILVRM  EQU #0056
WRTVRM  EQU #004D
WRTVDP  EQU #0047
LDIRVM  EQU #005C
CHGCLR  EQU #0062
CHGET   EQU #009F
GTSTCK  EQU #00D5
SNSMAT  EQU #0141
HKEY    EQU #F3DB
CLIKSW  EQU #F3DC
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA

VDP_PALETTE_PORT EQU #9A
VDP_DATA_PORT EQU #98
VDP_CTRL_PORT EQU #99
SCREEN5_BITMAP_VRAM EQU #0000
SCREEN5_BITMAP_SIZE EQU ${SCREEN5_BYTES}
msx2_player_sprite_x EQU #C000
msx2_player_sprite_y EQU #C001
msx2_player_sprite_dx EQU #C002
msx2_player_sprite_frame EQU #C003
msx2_current_collision_ptr EQU #C004
msx2_current_effects_ptr EQU #C006

    org #4000

    db "AB"
    dw init_rom
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

init_rom:
    di
    im 1
    ld sp, #F380
    call map_page2_to_cart_primary

    ld a, #C9
    ld (HKEY), a
    xor a
    ld (CLIKSW), a
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    call DISSCR
    ld a, 5
    call CHGMOD

    ; Enable 212-line display on V9938/V9958.
    ld bc, #8009
    call WRTVDP

    call load_screen5_palette
    call load_${firstScreenLabel}_bitmap
${hasHardwareSprite(analysis) ? '    call init_hardware_sprites\n' : ''}
    call ENASCR
    ei

${gameFlowProgram}
.main_loop:
${hasHardwareSprite(analysis) ? '    call update_hardware_sprite_input\n' : ''}
    call wait_frame_busy
    jr .main_loop

wait_frame_busy:
    ; Simple ROM backend delay. Avoid HALT here so C-BIOS/OpenMSX smoke tests
    ; keep advancing even when no VBlank hook is installed by the minimal backend.
    ld bc, #0800
.wait_loop:
    dec bc
    ld a, b
    or c
    jp nz, .wait_loop
    ret

map_page2_to_cart_primary:
    ; Keep #8000-#BFFF on the same primary slot as the cart page at #4000.
    ; Raw SCREEN 5 backgrounds are larger than 16 KB, so LDIRVM may read data above #8000.
    in a, (#A8)
    ld b, a
    and #0C
    add a, a
    add a, a
    ld c, a
    ld a, b
    and #CF
    or c
    out (#A8), a
    ret

wait_key:
    call CHGET
    ret

clear_screen5_bitmap:
    xor a
    ld hl, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call FILVRM
    ret

${hardwareSpriteInitAsm}
${buildHardwareSpriteRuntimeAsm(analysis)}
load_screen5_palette:
    ; R#16 selects the first palette register; port #9A receives 2 bytes per slot.
    ld bc, #0010
    call WRTVDP
    ld hl, screen5_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
    ret

load_${firstScreenLabel}_bitmap:
    ld hl, ${firstScreenLabel}_BITMAP
    ld de, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call LDIRVM
${loadRuntimeLayerPointers(firstScreenLabel)}
    ret

${allLoadLabels.filter(label => label !== firstScreenLabel).map(label => {
        return `load_${label}_bitmap:
    ld hl, ${label}_BITMAP
    ld de, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call LDIRVM
${loadRuntimeLayerPointers(label)}
    ret
`;
    }).join('\n')}
${formatBytes('screen5_palette_data', paletteBytes, 'Palette bytes: byte1=(R<<4)|B, byte2=G')}
${formatBytes('screen5_empty_collision_layer', Array(MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT).fill(0), 'Default empty MSX2 collision layer, 16x14 bytes')}
${formatBytes('screen5_empty_effects_layer', Array(MSX2_TILE_SCREEN_WIDTH * MSX2_TILE_SCREEN_HEIGHT).fill(0), 'Default empty MSX2 effects layer, 16x14 bytes')}
${hardwareSpriteDataAsm}
${[...tileScreenRuntimeBlocks, ...tileScreenBlocks, ...bitmapBlocks, ...screenBitmapBlocks].join('\n')}
    ds #C000 - $, #FF
    end
`;
}
function generateMsx2Screen5Files(projectName, analysis, config) {
    const unitedFiles = generateUnitedFiles(projectName, analysis, config);
    return {
        'page0.asm': '; MSX2 SCREEN 5 backend: page0 not used in MVP.\n',
        'bios.asm': '; MSX2 SCREEN 5 backend emits BIOS equates in unitedFiles.asm.\n',
        'constants.asm': '; MSX2 SCREEN 5 backend constants are local to unitedFiles.asm.\n',
        'variables.asm': '; MSX2 SCREEN 5 backend has no RAM variables in MVP.\n',
        'mapper.asm': '; MSX2 SCREEN 5 backend MVP is a simple ROM path.\n',
        'resource_ids.asm': '; MSX2 SCREEN 5 backend has no resource table in MVP.\n',
        'resource_table.asm': '; MSX2 SCREEN 5 backend has no resource table in MVP.\n',
        'resource_manager.asm': '; MSX2 SCREEN 5 backend has no resource manager in MVP.\n',
        'interrupt.asm': '; MSX2 SCREEN 5 backend uses BIOS CHGET and HALT loop in MVP.\n',
        'header.asm': '; MSX2 SCREEN 5 backend header is emitted in unitedFiles.asm.\n',
        'patterns.asm': '; SCREEN 2 pattern tables are intentionally not used by MSX2 SCREEN 5.\n',
        'colors.asm': '; SCREEN 2 color tables are intentionally not used by MSX2 SCREEN 5.\n',
        'components.asm': '; Components are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'entities.asm': '; Entities are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'worlds.asm': '; Worlds are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'screens.asm': '; SCREEN 5 bitmap data is emitted in unitedFiles.asm.\n',
        'sprites.asm': hasHardwareSprite(analysis)
            ? '; MSX2 SCREEN 5 hardware sprite MVP is emitted inline in unitedFiles.asm.\n'
            : '; Sprites are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'font.asm': '; Font is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'hud.asm': '; HUD is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'menus.asm': '; Menus are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'sound.asm': '; Sound is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'scroll.asm': '; Scroll is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'animtiles.asm': '; Animated tiles are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'bosses.asm': '; Bosses are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'statemachine.asm': '; State machines are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
        'gameflow.asm': '; MSX2 SCREEN 5 minimal GameFlow is emitted inline in unitedFiles.asm.\n',
        'main.asm': unitedFiles,
        'unitedFiles.asm': unitedFiles,
    };
}

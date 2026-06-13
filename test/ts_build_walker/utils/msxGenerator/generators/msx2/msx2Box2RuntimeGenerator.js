"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_MAX_BOX2_PER_SCREEN = void 0;
exports.screenHasMapBoxTiles = screenHasMapBoxTiles;
exports.entityHasMsx2Box2 = entityHasMsx2Box2;
exports.playerHasMsx2PushBox = playerHasMsx2PushBox;
exports.resolveMsx2CharRenderTileIndex = resolveMsx2CharRenderTileIndex;
exports.getMsx2Box2RuntimeSlots = getMsx2Box2RuntimeSlots;
exports.getMsx2Box2RuntimeSlotsForScreen = getMsx2Box2RuntimeSlotsForScreen;
exports.getFirstBox2Entity = getFirstBox2Entity;
exports.usesMsx2Box2FromScreens = usesMsx2Box2FromScreens;
exports.usesMsx2Box2VerticalPush = usesMsx2Box2VerticalPush;
const msx2Screen4TileBehavior_1 = require("../../../msx2Screen4TileBehavior");
const msx2Box2Runtime_1 = require("../../../msx2Box2Runtime");
const msx2GridSnapComponentGenerator_1 = require("./msx2GridSnapComponentGenerator");
exports.MSX2_MAX_BOX2_PER_SCREEN = 8;
const MSX2_BOX2_SCREEN_TILE_WIDTH = 16;
const MSX2_BOX2_SCREEN_TILE_HEIGHT = 12;
function screenHasMapBoxTiles(screen) {
    const tiles = screen?.tiles || [];
    const map = screen?.map || [];
    const height = screen?.heightTiles || MSX2_BOX2_SCREEN_TILE_HEIGHT;
    const width = screen?.widthTiles || MSX2_BOX2_SCREEN_TILE_WIDTH;
    for (let tileY = 0; tileY < height; tileY++) {
        for (let tileX = 0; tileX < width; tileX++) {
            const tileIndex = Math.max(0, Math.min(tiles.length - 1, Number(map[tileY]?.[tileX]) || 0));
            if ((0, msx2Screen4TileBehavior_1.getMsx2TileBehaviorKind)(tiles[tileIndex]) === 'box')
                return true;
        }
    }
    return false;
}
function slotOccupiesCell(slot) {
    const tileX = Math.floor(slot.x / 16);
    const tileY = Math.floor(slot.y / 16);
    return `${tileX},${tileY}`;
}
function buildMapBoxTileSlots(screen, nameLayout, resolveTileBytes, occupiedCells) {
    if (!screen)
        return [];
    const tiles = screen.tiles || [];
    const map = screen.map || [];
    const height = screen.heightTiles || MSX2_BOX2_SCREEN_TILE_HEIGHT;
    const width = screen.widthTiles || MSX2_BOX2_SCREEN_TILE_WIDTH;
    const playerPushBox = (screen.layers?.entities || []).find(entity => playerHasMsx2PushBox(entity))?.components?.msx2_push_box || {};
    const pushAxis = (0, msx2Box2Runtime_1.normalizeBox2Axis)(playerPushBox.pushAxis ?? 'horizontal');
    const slideSpeed = Math.max(1, Math.min(4, Number(playerPushBox.slideSpeed ?? 1) || 1));
    const gravity = (0, msx2Box2Runtime_1.normalizeBox2Gravity)(playerPushBox.gravity, true) ? 1 : 0;
    const slots = [];
    for (let tileY = 0; tileY < height; tileY++) {
        for (let tileX = 0; tileX < width; tileX++) {
            const cellKey = `${tileX},${tileY}`;
            if (occupiedCells.has(cellKey))
                continue;
            const tileIndex = Math.max(0, Math.min(tiles.length - 1, Number(map[tileY]?.[tileX]) || 0));
            const tile = tiles[tileIndex];
            if ((0, msx2Screen4TileBehavior_1.getMsx2TileBehaviorKind)(tile) !== 'box')
                continue;
            occupiedCells.add(cellKey);
            const pseudoEntity = { params: { tileIndex } };
            const bytes = resolveTileBytes(screen, pseudoEntity) || { pattern: Array(32).fill(0), color: Array(32).fill(0) };
            slots.push({
                x: tileX * 16,
                y: tileY * 16,
                charBase: nameLayout.charBaseAtTile(tileX, tileY),
                pushAxis,
                slideSpeed,
                gravity,
                requiresAlignment: 1,
                gridUnit: 16,
                charWidth: 2,
                charHeight: 2,
                spriteAssetId: '',
                paletteSlot: 6,
                pattern: bytes.pattern,
                color: bytes.color,
                mapOrigin: true,
                restoreNameBytes: nameLayout.restoreNameQuadAtTile(tileX, tileY),
                mapTileIndex: tileIndex,
                mapCellX: tileX,
                mapCellY: tileY,
            });
        }
    }
    return slots;
}
const clampTileCoordinate = (value, max) => Math.max(0, Math.min(max, Number(value) || 0));
const clampHardwareSpriteCoord = (value, max) => Math.max(0, Math.min(max, value));
/** True for msx2_box2 and legacy msx2_push_box entities. */
function entityHasMsx2Box2(entity) {
    if (entity?.kind === 'player')
        return false;
    if (entity?.components?.msx2_box2)
        return true;
    if (entity?.components?.msx2_push_box)
        return true;
    const engine = String(entity?.params?.engine || '').replace(/[\s_-]+/g, '').toLowerCase();
    return engine === 'box2' || engine === 'pushbox' || entity?.params?.pushBox === true || entity?.params?.box2 === true;
}
function playerHasMsx2PushBox(entity) {
    if (entity?.kind !== 'player')
        return false;
    const pushBox = entity?.components?.msx2_push_box;
    if (!pushBox)
        return false;
    return pushBox.enabled !== false;
}
function screenHasPlayerEntry(screen) {
    return Array.isArray(screen?.playerEntries) && screen.playerEntries.length > 0;
}
function readBox2Field(entity, box2Key, legacyKey, fallback) {
    const box2 = entity?.components?.msx2_box2;
    if (box2 && box2[box2Key] !== undefined)
        return box2[box2Key];
    const legacy = entity?.components?.msx2_push_box;
    if (legacy && legacy[legacyKey] !== undefined)
        return legacy[legacyKey];
    if (entity?.params?.[box2Key] !== undefined)
        return entity.params[box2Key];
    if (entity?.params?.[legacyKey] !== undefined)
        return entity.params[legacyKey];
    return fallback;
}
function resolveMsx2CharRenderTileIndex(screen, entity) {
    const charRender = entity?.components?.msx2_char_render;
    const tileId = String(charRender?.tileId ?? entity?.params?.tileId ?? '').trim();
    if (tileId && screen?.tiles?.length) {
        const byId = screen.tiles.findIndex(tile => String(tile?.id || '') === tileId);
        if (byId >= 0)
            return byId;
    }
    const explicitTileIndex = Number(charRender?.tileIndex ?? entity?.params?.tileIndex);
    if (Number.isFinite(explicitTileIndex) && explicitTileIndex >= 0)
        return explicitTileIndex;
    return undefined;
}
function getMsx2Box2RuntimeSlots(screen, resolveTileBytes) {
    const reservedBases = [];
    return (screen?.layers?.entities || [])
        .filter(entity => entityHasMsx2Box2(entity) && entity.position)
        .slice(0, exports.MSX2_MAX_BOX2_PER_SCREEN)
        .map(entity => {
        const grid = (0, msx2GridSnapComponentGenerator_1.getMsx2GridSnapSettings)(entity);
        const restGridUnit = Math.max(8, grid.gridUnit);
        const tileX = clampTileCoordinate(entity.position?.x, 15);
        const tileY = clampTileCoordinate(entity.position?.y, 11);
        const pixelX = (0, msx2GridSnapComponentGenerator_1.snapPixelToGrid)(clampHardwareSpriteCoord(Number((0, msx2GridSnapComponentGenerator_1.getComponentValue)(entity, 'msx2_transform', 'pixelX', tileX * 16)), 240), restGridUnit);
        const pixelY = (0, msx2GridSnapComponentGenerator_1.snapPixelToGrid)(clampHardwareSpriteCoord(Number((0, msx2GridSnapComponentGenerator_1.getComponentValue)(entity, 'msx2_transform', 'pixelY', tileY * 16)), 176), restGridUnit);
        const charBlock = (0, msx2GridSnapComponentGenerator_1.getMsx2GridSnapCharBlockFromEntity)(screen, entity, resolveTileBytes);
        const charBase = (0, msx2GridSnapComponentGenerator_1.resolveMsx2GridSnapCharBase)(entity, reservedBases, charBlock.charBase);
        reservedBases.push(charBase);
        const slideSpeed = Math.max(1, Math.min(4, Number(readBox2Field(entity, 'slideSpeed', 'moveSpeed', 1)) || 1));
        const pushAxis = (0, msx2Box2Runtime_1.normalizeBox2Axis)(readBox2Field(entity, 'pushAxis', 'pushAxis', 'horizontal'));
        const gravity = (0, msx2Box2Runtime_1.normalizeBox2Gravity)(readBox2Field(entity, 'gravity', 'gravity', true), true) ? 1 : 0;
        const requiresAlignment = readBox2Field(entity, 'requiresAlignment', 'requiresAlignment', true) !== false ? 1 : 0;
        const spriteAssetId = String((0, msx2GridSnapComponentGenerator_1.getComponentValue)(entity, 'msx2_hardware_sprite', 'msx2SpriteAssetId', entity.params?.msx2SpriteAssetId ?? ''));
        const paletteSlot = Math.max(1, Math.min(15, Number((0, msx2GridSnapComponentGenerator_1.getComponentValue)(entity, 'msx2_hardware_sprite', 'paletteSlot', (0, msx2GridSnapComponentGenerator_1.getComponentValue)(entity, 'msx2_char_render', 'paletteSlot', entity.params?.paletteSlot ?? 6))) || 6));
        return {
            x: pixelX,
            y: pixelY,
            charBase,
            pushAxis,
            slideSpeed,
            gravity,
            requiresAlignment,
            gridUnit: restGridUnit,
            charWidth: grid.charWidth,
            charHeight: grid.charHeight,
            spriteAssetId,
            paletteSlot,
            pattern: charBlock.pattern,
            color: charBlock.color,
        };
    });
}
function getMsx2Box2RuntimeSlotsForScreen(screen, resolveTileBytes, nameLayout) {
    const entitySlots = getMsx2Box2RuntimeSlots(screen, resolveTileBytes);
    const occupiedCells = new Set(entitySlots.map(slotOccupiesCell));
    const mapSlots = nameLayout ? buildMapBoxTileSlots(screen, nameLayout, resolveTileBytes, occupiedCells) : [];
    return [...entitySlots, ...mapSlots].slice(0, exports.MSX2_MAX_BOX2_PER_SCREEN);
}
function getFirstBox2Entity(screens) {
    for (const screen of screens) {
        const entity = (screen?.layers?.entities || []).find(candidate => entityHasMsx2Box2(candidate));
        if (entity)
            return entity;
    }
    return undefined;
}
function usesMsx2Box2FromScreens(screens) {
    return screens.some(screen => (screen?.layers?.entities || []).some(entity => entityHasMsx2Box2(entity))
        || (screenHasMapBoxTiles(screen) && (screenHasPlayerEntry(screen)
            || (screen?.layers?.entities || []).some(entity => playerHasMsx2PushBox(entity)))));
}
function usesMsx2Box2VerticalPush(screens) {
    return screens.some(screen => (screen?.layers?.entities || []).some(entity => {
        if (!entityHasMsx2Box2(entity))
            return false;
        const axis = (0, msx2Box2Runtime_1.normalizeBox2Axis)(readBox2Field(entity, 'pushAxis', 'pushAxis', 'horizontal'));
        return axis === 1 || axis === 2;
    }));
}

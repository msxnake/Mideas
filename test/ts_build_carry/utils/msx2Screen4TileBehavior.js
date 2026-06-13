"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMsx2TileHazardHitboxBytes = exports.buildMsx2TileVisualMapBytes = exports.checkMsx2HazardAtWorldPixel = exports.isPixelInsideMsx2TileHitbox = exports.getMsx2TilePixelSize = exports.countMsx2TilesByBehavior = exports.filterMsx2TilesByBehavior = exports.applyMsx2TileBehaviorToMapCell = exports.stripMsx2BoxTileCollisionFromLayer = exports.resolveMsx2TileRuntimeLayers = exports.normalizeMsx2Screen4TileBehavior = exports.normalizeMsx2TileHitbox = exports.getMsx2TileBehaviorKind = exports.normalizeMsx2TileBehaviorKind = exports.getDefaultHitboxForBehavior = exports.MSX2_TILE_BEHAVIOR_COLORS = exports.MSX2_TILE_BEHAVIOR_DESCRIPTIONS = exports.MSX2_TILE_BEHAVIOR_LABELS = exports.MSX2_TILE_BEHAVIOR_KINDS = void 0;
exports.MSX2_TILE_BEHAVIOR_KINDS = [
    'background',
    'foreground',
    'dangerous',
    'box',
];
exports.MSX2_TILE_BEHAVIOR_LABELS = {
    background: 'Fondo',
    foreground: 'Frente / Colisión',
    dangerous: 'Peligro',
    box: 'Caja',
};
exports.MSX2_TILE_BEHAVIOR_DESCRIPTIONS = {
    background: 'Solo aspecto visual. Sin colisión ni daño.',
    foreground: 'Plataformas, suelo, techo y sólidos.',
    dangerous: 'Pinchos, fuego, eléctrico, ácido (hazard).',
    box: 'Cajas empujables (box2). Colisión dinámica en runtime, no en esta capa.',
};
exports.MSX2_TILE_BEHAVIOR_COLORS = {
    background: '#64748b',
    foreground: '#3b82f6',
    dangerous: '#f472b6',
    box: '#f59e0b',
};
const clampHitboxCoord = (value, max) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
const getDefaultHitboxForBehavior = (kind, tileWidth = 16, tileHeight = 16) => {
    if (kind === 'background') {
        return { offsetX: 0, offsetY: 0, width: 0, height: 0 };
    }
    return { offsetX: 0, offsetY: 0, width: tileWidth, height: tileHeight };
};
exports.getDefaultHitboxForBehavior = getDefaultHitboxForBehavior;
const normalizeMsx2TileBehaviorKind = (value) => exports.MSX2_TILE_BEHAVIOR_KINDS.includes(value)
    ? value
    : 'background';
exports.normalizeMsx2TileBehaviorKind = normalizeMsx2TileBehaviorKind;
const getMsx2TileBehaviorKind = (tile) => (0, exports.normalizeMsx2TileBehaviorKind)(tile?.behaviorKind);
exports.getMsx2TileBehaviorKind = getMsx2TileBehaviorKind;
const normalizeMsx2TileHitbox = (tile, tileWidth = 16, tileHeight = 16) => {
    const kind = (0, exports.getMsx2TileBehaviorKind)(tile);
    const fallback = (0, exports.getDefaultHitboxForBehavior)(kind, tileWidth, tileHeight);
    const hitbox = tile?.hitbox;
    if (!hitbox)
        return fallback;
    const width = clampHitboxCoord(hitbox.width, tileWidth);
    const height = clampHitboxCoord(hitbox.height, tileHeight);
    const maxOffsetX = Math.max(0, tileWidth - width);
    const maxOffsetY = Math.max(0, tileHeight - height);
    return {
        offsetX: clampHitboxCoord(hitbox.offsetX, maxOffsetX),
        offsetY: clampHitboxCoord(hitbox.offsetY, maxOffsetY),
        width,
        height,
    };
};
exports.normalizeMsx2TileHitbox = normalizeMsx2TileHitbox;
const normalizeMsx2Screen4TileBehavior = (tile, tileWidth = 16, tileHeight = 16) => {
    const behaviorKind = (0, exports.getMsx2TileBehaviorKind)(tile);
    return {
        ...tile,
        behaviorKind,
        hitbox: (0, exports.normalizeMsx2TileHitbox)({ ...tile, behaviorKind }, tileWidth, tileHeight),
    };
};
exports.normalizeMsx2Screen4TileBehavior = normalizeMsx2Screen4TileBehavior;
const resolveMsx2TileRuntimeLayers = (tile) => {
    const kind = (0, exports.getMsx2TileBehaviorKind)(tile);
    if (kind === 'foreground') {
        return { collision: 1, effect: 0 };
    }
    if (kind === 'box') {
        return { collision: 0, effect: 0 };
    }
    if (kind === 'dangerous') {
        return { collision: 0, effect: 1 };
    }
    return { collision: 0, effect: 0 };
};
exports.resolveMsx2TileRuntimeLayers = resolveMsx2TileRuntimeLayers;
/** Remove stale collision-mask bytes under painted box tiles (box2 owns runtime collision). */
const stripMsx2BoxTileCollisionFromLayer = (map, tiles, collision) => {
    const maxTileIndex = Math.max(0, tiles.length - 1);
    return collision.map((row, y) => row.map((value, x) => {
        const tileIndex = Math.max(0, Math.min(maxTileIndex, Number(map[y]?.[x]) || 0));
        if ((0, exports.getMsx2TileBehaviorKind)(tiles[tileIndex]) !== 'box')
            return value;
        return 0;
    }));
};
exports.stripMsx2BoxTileCollisionFromLayer = stripMsx2BoxTileCollisionFromLayer;
/** Apply collision/effects for one map cell from the painted tile behavior. */
const applyMsx2TileBehaviorToMapCell = (tile, x, y, collision, effects) => {
    const { collision: collisionValue, effect } = (0, exports.resolveMsx2TileRuntimeLayers)(tile);
    if (collision[y]?.[x] !== undefined) {
        collision[y][x] = collisionValue;
    }
    if (effects[y]?.[x] !== undefined) {
        effects[y][x] = effect;
    }
};
exports.applyMsx2TileBehaviorToMapCell = applyMsx2TileBehaviorToMapCell;
const filterMsx2TilesByBehavior = (tiles, filter) => tiles
    .map((tile, index) => ({ tile, index }))
    .filter(entry => filter === 'all' || (0, exports.getMsx2TileBehaviorKind)(entry.tile) === filter);
exports.filterMsx2TilesByBehavior = filterMsx2TilesByBehavior;
const countMsx2TilesByBehavior = (tiles) => ({
    background: tiles.filter(tile => (0, exports.getMsx2TileBehaviorKind)(tile) === 'background').length,
    foreground: tiles.filter(tile => (0, exports.getMsx2TileBehaviorKind)(tile) === 'foreground').length,
    dangerous: tiles.filter(tile => (0, exports.getMsx2TileBehaviorKind)(tile) === 'dangerous').length,
    box: tiles.filter(tile => (0, exports.getMsx2TileBehaviorKind)(tile) === 'box').length,
});
exports.countMsx2TilesByBehavior = countMsx2TilesByBehavior;
const getMsx2TilePixelSize = (tile) => {
    const width = Math.max(8, Math.min(32, Number(tile?.width ?? tile?.pixels?.[0]?.length ?? 16) || 16));
    const height = Math.max(8, Math.min(32, Number(tile?.height ?? tile?.pixels?.length ?? 16) || 16));
    return { width, height };
};
exports.getMsx2TilePixelSize = getMsx2TilePixelSize;
const isPixelInsideMsx2TileHitbox = (tile, localX, localY) => {
    const kind = (0, exports.getMsx2TileBehaviorKind)(tile);
    if (kind !== 'dangerous')
        return false;
    const { width: tileWidth, height: tileHeight } = (0, exports.getMsx2TilePixelSize)(tile);
    const hitbox = (0, exports.normalizeMsx2TileHitbox)(tile, tileWidth, tileHeight);
    if (hitbox.width <= 0 || hitbox.height <= 0)
        return false;
    return localX >= hitbox.offsetX
        && localX < hitbox.offsetX + hitbox.width
        && localY >= hitbox.offsetY
        && localY < hitbox.offsetY + hitbox.height;
};
exports.isPixelInsideMsx2TileHitbox = isPixelInsideMsx2TileHitbox;
const checkMsx2HazardAtWorldPixel = (screen, pixelX, pixelY, tileSize = 16) => {
    if (pixelX < 0 || pixelY < 0)
        return false;
    const tileX = Math.floor(pixelX / tileSize);
    const tileY = Math.floor(pixelY / tileSize);
    if (tileX < 0 || tileX >= (screen.widthTiles || 16) || tileY < 0 || tileY >= (screen.heightTiles || 12)) {
        return false;
    }
    const tileIndex = screen.map?.[tileY]?.[tileX] ?? 0;
    const tile = screen.tiles?.[tileIndex];
    const effectCell = screen.layers?.effects?.[tileY]?.[tileX] ?? 0;
    if ((0, exports.getMsx2TileBehaviorKind)(tile) !== 'dangerous' && effectCell !== 1)
        return false;
    const localX = pixelX - tileX * tileSize;
    const localY = pixelY - tileY * tileSize;
    return (0, exports.isPixelInsideMsx2TileHitbox)(tile, localX, localY);
};
exports.checkMsx2HazardAtWorldPixel = checkMsx2HazardAtWorldPixel;
const buildMsx2TileVisualMapBytes = (screen) => {
    const width = screen?.widthTiles || 16;
    const height = screen?.heightTiles || 12;
    const bytes = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            bytes.push(Math.max(0, Math.min(255, Number(screen?.map?.[y]?.[x]) || 0)));
        }
    }
    return bytes;
};
exports.buildMsx2TileVisualMapBytes = buildMsx2TileVisualMapBytes;
const buildMsx2TileHazardHitboxBytes = (screen, paddedTileSlots) => {
    const tiles = screen?.tiles || [];
    const slotCount = Math.max(1, paddedTileSlots ?? (tiles.length || 1));
    const bytes = [];
    tiles.forEach(tile => {
        const { width, height } = (0, exports.getMsx2TilePixelSize)(tile);
        const kind = (0, exports.getMsx2TileBehaviorKind)(tile);
        const hitbox = (0, exports.normalizeMsx2TileHitbox)(tile, width, height);
        if (kind !== 'dangerous' || hitbox.width <= 0 || hitbox.height <= 0) {
            bytes.push(0, 0, 0, 0);
            return;
        }
        bytes.push(hitbox.offsetX, hitbox.offsetY, hitbox.width, hitbox.height);
    });
    while (bytes.length < slotCount * 4) {
        bytes.push(0, 0, 0, 0);
    }
    return bytes.slice(0, slotCount * 4);
};
exports.buildMsx2TileHazardHitboxBytes = buildMsx2TileHazardHitboxBytes;

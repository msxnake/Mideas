"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMsx2CellFlagBytes = exports.clearMsx2CellEffect = exports.patchMsx2CellSolid = exports.getMsx2CellBehavior = exports.getMsx2CellEffect = exports.getMsx2CellSolid = exports.packMsx2CellFlags = exports.MSX2_CELL_BEHAVIOR_BOX = exports.MSX2_CELL_BEHAVIOR_ROPE = exports.MSX2_CELL_BEHAVIOR_CONVEYOR_LEFT = exports.MSX2_CELL_BEHAVIOR_CONVEYOR_RIGHT = exports.MSX2_CELL_BEHAVIOR_LADDER = exports.MSX2_CELL_BEHAVIOR_NONE = exports.MSX2_CELL_EFFECT_COLLECTIBLE = exports.MSX2_CELL_EFFECT_EXIT = exports.MSX2_CELL_EFFECT_HAZARD = exports.MSX2_CELL_EFFECT_NONE = exports.MSX2_CELL_ZONE_MASK = exports.MSX2_CELL_BEHAVIOR_SHIFT = exports.MSX2_CELL_BEHAVIOR_MASK = exports.MSX2_CELL_EFFECT_SHIFT = exports.MSX2_CELL_EFFECT_MASK = exports.MSX2_CELL_SOLID = void 0;
const msx2Screen4TileBehavior_1 = require("./msx2Screen4TileBehavior");
exports.MSX2_CELL_SOLID = 0x01;
exports.MSX2_CELL_EFFECT_MASK = 0x06;
exports.MSX2_CELL_EFFECT_SHIFT = 1;
exports.MSX2_CELL_BEHAVIOR_MASK = 0x38;
exports.MSX2_CELL_BEHAVIOR_SHIFT = 3;
exports.MSX2_CELL_ZONE_MASK = 0xc0;
exports.MSX2_CELL_EFFECT_NONE = 0;
exports.MSX2_CELL_EFFECT_HAZARD = 1;
exports.MSX2_CELL_EFFECT_EXIT = 2;
exports.MSX2_CELL_EFFECT_COLLECTIBLE = 3;
exports.MSX2_CELL_BEHAVIOR_NONE = 0;
exports.MSX2_CELL_BEHAVIOR_LADDER = 1;
exports.MSX2_CELL_BEHAVIOR_CONVEYOR_RIGHT = 2;
exports.MSX2_CELL_BEHAVIOR_CONVEYOR_LEFT = 3;
exports.MSX2_CELL_BEHAVIOR_ROPE = 4;
exports.MSX2_CELL_BEHAVIOR_BOX = 5;
const packMsx2CellFlags = ({ solid = false, effect = 0, behavior = 0, zone = 0, }) => ((solid ? exports.MSX2_CELL_SOLID : 0)
    | ((Math.max(0, Math.min(3, Math.floor(Number(effect) || 0))) << exports.MSX2_CELL_EFFECT_SHIFT) & exports.MSX2_CELL_EFFECT_MASK)
    | ((Math.max(0, Math.min(7, Math.floor(Number(behavior) || 0))) << exports.MSX2_CELL_BEHAVIOR_SHIFT) & exports.MSX2_CELL_BEHAVIOR_MASK)
    | (Math.max(0, Math.min(255, Math.floor(Number(zone) || 0))) & exports.MSX2_CELL_ZONE_MASK)) & 0xff;
exports.packMsx2CellFlags = packMsx2CellFlags;
const getMsx2CellSolid = (cellFlags) => (cellFlags & exports.MSX2_CELL_SOLID) !== 0;
exports.getMsx2CellSolid = getMsx2CellSolid;
const getMsx2CellEffect = (cellFlags) => (cellFlags & exports.MSX2_CELL_EFFECT_MASK) >> exports.MSX2_CELL_EFFECT_SHIFT;
exports.getMsx2CellEffect = getMsx2CellEffect;
const getMsx2CellBehavior = (cellFlags) => (cellFlags & exports.MSX2_CELL_BEHAVIOR_MASK) >> exports.MSX2_CELL_BEHAVIOR_SHIFT;
exports.getMsx2CellBehavior = getMsx2CellBehavior;
const patchMsx2CellSolid = (cellFlags, solid) => solid ? ((cellFlags | exports.MSX2_CELL_SOLID) & 0xff) : (cellFlags & ~exports.MSX2_CELL_SOLID & 0xff);
exports.patchMsx2CellSolid = patchMsx2CellSolid;
const clearMsx2CellEffect = (cellFlags) => cellFlags & ~exports.MSX2_CELL_EFFECT_MASK & 0xff;
exports.clearMsx2CellEffect = clearMsx2CellEffect;
const buildMsx2CellFlagBytes = (screen, layerBytes) => {
    const cellCount = Math.max(0, Math.floor(Number(screen?.widthTiles || 16) || 16) * Math.floor(Number(screen?.heightTiles || 12) || 12));
    const fallbackCount = 16 * 12;
    const count = cellCount || fallbackCount;
    const width = Math.max(1, Math.floor(Number(screen?.widthTiles || 16) || 16));
    const tiles = screen?.tiles || [];
    const map = screen?.map || [];
    const maxTileIndex = Math.max(0, tiles.length - 1);
    return Array.from({ length: count }, (_, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        const tileIndex = Math.max(0, Math.min(maxTileIndex, Number(map[y]?.[x]) || 0));
        const tileBehavior = (0, msx2Screen4TileBehavior_1.getMsx2TileBehaviorKind)(tiles[tileIndex]);
        let solid = (Number(layerBytes.collision[index]) || 0) !== 0;
        let effect = Number(layerBytes.effects[index]) || 0;
        let behavior = Number(layerBytes.behavior[index]) || 0;
        if (tileBehavior === 'foreground') {
            solid = true;
        }
        else if (tileBehavior === 'dangerous') {
            effect = Math.max(effect, exports.MSX2_CELL_EFFECT_HAZARD);
        }
        else if (tileBehavior === 'box') {
            solid = true;
            behavior = exports.MSX2_CELL_BEHAVIOR_BOX;
        }
        return (0, exports.packMsx2CellFlags)({ solid, effect, behavior });
    });
};
exports.buildMsx2CellFlagBytes = buildMsx2CellFlagBytes;

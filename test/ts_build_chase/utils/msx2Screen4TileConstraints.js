"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillAllLineAttributeSlots = exports.remapSegmentPixels = exports.shiftLineAttributes = exports.mirrorLineAttributesVertical = exports.mirrorLineAttributesHorizontal = exports.resizeLineAttributes = exports.fixInvalidTilePixels = exports.analyzeTileColorLimits = exports.resolvePaintSlot = exports.isValidPixelSlot = exports.getSegmentAttribute = exports.getSegmentIndex = exports.ensureLineAttributes = exports.inferLineAttributesFromPixels = exports.cloneLineAttributes = exports.createDefaultLineAttributes = exports.chooseScreen4RowColors = exports.DEFAULT_SCREEN4_BG_SLOT = exports.DEFAULT_SCREEN4_FG_SLOT = exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT = void 0;
const constants_1 = require("../constants");
exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT = constants_1.SCREEN2_PIXELS_PER_COLOR_SEGMENT;
exports.DEFAULT_SCREEN4_FG_SLOT = 1;
exports.DEFAULT_SCREEN4_BG_SLOT = 0;
const clampSlot = (value) => Math.max(0, Math.min(15, Number(value) || 0));
const chooseScreen4RowColors = (row) => {
    const counts = new Map();
    row.forEach(value => {
        const slot = clampSlot(value);
        counts.set(slot, (counts.get(slot) || 0) + 1);
    });
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    const bg = sorted[0]?.[0] ?? exports.DEFAULT_SCREEN4_BG_SLOT;
    const fg = sorted.find(([slot]) => slot !== bg)?.[0] ?? bg;
    return { fg, bg };
};
exports.chooseScreen4RowColors = chooseScreen4RowColors;
const createDefaultLineAttributes = (tileWidth, tileHeight, fg = exports.DEFAULT_SCREEN4_FG_SLOT, bg = exports.DEFAULT_SCREEN4_BG_SLOT) => {
    const numSegmentsPerRow = Math.max(1, tileWidth / exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT);
    return Array.from({ length: tileHeight }, () => Array.from({ length: numSegmentsPerRow }, () => ({ fg: clampSlot(fg), bg: clampSlot(bg) })));
};
exports.createDefaultLineAttributes = createDefaultLineAttributes;
const cloneLineAttributes = (lineAttributes) => lineAttributes?.map(row => row.map(segment => ({ ...segment })));
exports.cloneLineAttributes = cloneLineAttributes;
const inferLineAttributesFromPixels = (pixels) => {
    const height = pixels.length;
    const width = pixels[0]?.length ?? 0;
    const numSegmentsPerRow = Math.max(1, width / exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT);
    return Array.from({ length: height }, (_, y) => Array.from({ length: numSegmentsPerRow }, (_, segment) => {
        const startX = segment * exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT;
        const row = Array.from({ length: exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT }, (_unused, offset) => clampSlot(pixels[y]?.[startX + offset]));
        return (0, exports.chooseScreen4RowColors)(row);
    }));
};
exports.inferLineAttributesFromPixels = inferLineAttributesFromPixels;
const ensureLineAttributes = (pixels, lineAttributes, width, height) => {
    const expectedSegments = Math.max(1, width / exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT);
    if (lineAttributes
        && lineAttributes.length === height
        && lineAttributes.every(row => row.length === expectedSegments)) {
        return lineAttributes.map(row => row.map(segment => ({ fg: clampSlot(segment.fg), bg: clampSlot(segment.bg) })));
    }
    return (0, exports.inferLineAttributesFromPixels)(pixels);
};
exports.ensureLineAttributes = ensureLineAttributes;
const getSegmentIndex = (x) => Math.floor(x / exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT);
exports.getSegmentIndex = getSegmentIndex;
const getSegmentAttribute = (lineAttributes, y, x) => lineAttributes?.[y]?.[(0, exports.getSegmentIndex)(x)];
exports.getSegmentAttribute = getSegmentAttribute;
const isValidPixelSlot = (x, y, slot, lineAttributes) => {
    const attributes = (0, exports.getSegmentAttribute)(lineAttributes, y, x);
    if (!attributes)
        return true;
    const normalized = clampSlot(slot);
    return normalized === attributes.fg || normalized === attributes.bg;
};
exports.isValidPixelSlot = isValidPixelSlot;
const resolvePaintSlot = (x, y, button, tool, lineAttributes, _activeSlot) => {
    const attributes = (0, exports.getSegmentAttribute)(lineAttributes, y, x);
    if (!attributes)
        return clampSlot(_activeSlot);
    if (tool === 'erase' || button === 2)
        return attributes.bg;
    return attributes.fg;
};
exports.resolvePaintSlot = resolvePaintSlot;
const analyzeTileColorLimits = (pixels) => {
    const diagnostics = [];
    const height = pixels.length;
    const width = pixels[0]?.length ?? 0;
    const numSegmentsPerRow = Math.max(1, width / exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT);
    for (let y = 0; y < height; y++) {
        for (let segment = 0; segment < numSegmentsPerRow; segment++) {
            const colors = new Set();
            const startX = segment * exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT;
            for (let x = startX; x < startX + exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT && x < width; x++) {
                colors.add(clampSlot(pixels[y]?.[x]));
            }
            if (colors.size > 2) {
                diagnostics.push({ row: y, segment, colors: [...colors].sort((a, b) => a - b) });
            }
        }
    }
    return diagnostics;
};
exports.analyzeTileColorLimits = analyzeTileColorLimits;
const fixInvalidTilePixels = (pixels, lineAttributes) => {
    const height = pixels.length;
    const width = pixels[0]?.length ?? 0;
    return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => {
        const slot = clampSlot(pixels[y]?.[x]);
        const attributes = (0, exports.getSegmentAttribute)(lineAttributes, y, x);
        if (!attributes)
            return slot;
        if (slot === attributes.fg || slot === attributes.bg)
            return slot;
        return attributes.bg;
    }));
};
exports.fixInvalidTilePixels = fixInvalidTilePixels;
const resizeLineAttributes = (oldAttributes, oldWidth, oldHeight, newWidth, newHeight, defaultFg = exports.DEFAULT_SCREEN4_FG_SLOT, defaultBg = exports.DEFAULT_SCREEN4_BG_SLOT) => {
    const newNumSegmentsPerRow = Math.max(1, newWidth / exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT);
    const oldNumSegmentsPerRow = Math.max(1, oldWidth / exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT);
    const newAttrs = [];
    for (let y = 0; y < newHeight; y++) {
        const newRowAttrs = [];
        for (let s = 0; s < newNumSegmentsPerRow; s++) {
            if (oldAttributes && y < oldHeight && s < oldNumSegmentsPerRow && oldAttributes[y]?.[s]) {
                newRowAttrs.push({ ...oldAttributes[y][s] });
            }
            else {
                newRowAttrs.push({ fg: clampSlot(defaultFg), bg: clampSlot(defaultBg) });
            }
        }
        newAttrs.push(newRowAttrs);
    }
    return newAttrs;
};
exports.resizeLineAttributes = resizeLineAttributes;
const mirrorLineAttributesHorizontal = (lineAttributes, width) => {
    if (!lineAttributes)
        return undefined;
    const numSegmentsPerRow = Math.max(1, width / exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT);
    return lineAttributes.map(row => {
        const mirrored = [];
        for (let s = 0; s < numSegmentsPerRow; s++) {
            mirrored.push({ ...row[numSegmentsPerRow - 1 - s] });
        }
        return mirrored;
    });
};
exports.mirrorLineAttributesHorizontal = mirrorLineAttributesHorizontal;
const mirrorLineAttributesVertical = (lineAttributes) => lineAttributes ? [...lineAttributes].reverse().map(row => row.map(segment => ({ ...segment }))) : undefined;
exports.mirrorLineAttributesVertical = mirrorLineAttributesVertical;
const shiftLineAttributes = (lineAttributes, dx, dy, width, height, defaultFg = exports.DEFAULT_SCREEN4_FG_SLOT, defaultBg = exports.DEFAULT_SCREEN4_BG_SLOT) => {
    const numSegmentsPerRow = Math.max(1, width / exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT);
    const source = lineAttributes ?? (0, exports.createDefaultLineAttributes)(width, height, defaultFg, defaultBg);
    return Array.from({ length: height }, (_, y) => Array.from({ length: numSegmentsPerRow }, (_, segment) => {
        const sourceY = y - dy;
        const sourceSegment = segment - dx;
        if (sourceY < 0 || sourceY >= height || sourceSegment < 0 || sourceSegment >= numSegmentsPerRow) {
            return { fg: clampSlot(defaultFg), bg: clampSlot(defaultBg) };
        }
        return { ...source[sourceY][sourceSegment] };
    }));
};
exports.shiftLineAttributes = shiftLineAttributes;
const remapSegmentPixels = (pixels, rowIndex, segmentIndex, oldAttribute, newAttribute) => {
    const nextPixels = pixels.map(row => [...row]);
    const startX = segmentIndex * exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT;
    const endX = startX + exports.SCREEN4_PIXELS_PER_COLOR_SEGMENT;
    const row = nextPixels[rowIndex];
    if (!row)
        return nextPixels;
    for (let x = startX; x < endX && x < row.length; x++) {
        const currentSlot = clampSlot(row[x]);
        if (currentSlot === oldAttribute.fg) {
            row[x] = newAttribute.fg;
        }
        else if (currentSlot === oldAttribute.bg) {
            row[x] = newAttribute.bg;
        }
        else {
            row[x] = newAttribute.fg;
        }
    }
    return nextPixels;
};
exports.remapSegmentPixels = remapSegmentPixels;
const fillAllLineAttributeSlots = (lineAttributes, slot, type) => {
    const normalized = clampSlot(slot);
    return lineAttributes.map(row => row.map(segment => ({ ...segment, [type]: normalized })));
};
exports.fillAllLineAttributeSlots = fillAllLineAttributeSlots;

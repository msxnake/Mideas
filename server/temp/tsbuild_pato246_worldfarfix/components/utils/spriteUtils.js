"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpriteASMCode = exports.generateSingleFrameASMCode = exports.buildMSXDirectionalSpriteCatalog = exports.mirrorPixelDataVertically = exports.mirrorPixelDataHorizontally = exports.generateSpriteBinaryData = void 0;
const frameUsesLayer = (frame, layerIndex, layerColor) => !!frame?.msx1LayerData?.[layerIndex]?.some(row => row.some(Boolean)) ||
    !!frame?.data?.some(row => row?.some(pixel => pixel === layerColor));
const isLayerPixelSet = (frameData, layerData, layerIndex, layerColor, y, x) => {
    const plane = layerData?.[layerIndex];
    if (plane)
        return !!plane[y]?.[x];
    return frameData[y]?.[x] === layerColor;
};
/**
 * Generates a raw byte array for a sprite asset.
 * It processes each frame, creating a separate byte layer for each color in the sprite's palette
 * (excluding the background color). These layers are then concatenated.
 * @param sprite The sprite object to serialize.
 * @returns A Uint8Array containing the binary data for the sprite.
 */
const generateSpriteBinaryData = (sprite) => {
    const allFramesBytes = [];
    sprite.frames.forEach(frame => {
        // Iterate through the 4 sprite palette colors.
        // Skip if the palette color is the same as the sprite's general background color,
        // as that color isn't typically part of the drawable sprite pattern for VDP.
        for (let layerIndex = 0; layerIndex < sprite.spritePalette.length; layerIndex++) {
            const layerColor = sprite.spritePalette[layerIndex];
            // Skip if the layer color is the same as the sprite's designated background/transparent color
            if (layerColor === sprite.backgroundColor) {
                continue;
            }
            let colorUsedInFrameLayer = false; // Check if this specific palette color is used in this frame
            const frameLayerBytes = [];
            const width = sprite.size.width;
            const height = sprite.size.height;
            if (width === 16 && height === 16) {
                // 16x16 sprite - use MSX column-major format
                // Left column, rows 0-7
                for (let y = 0; y < 8; y++) {
                    let byteValue = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        if (isLayerPixelSet(frame.data, frame.msx1LayerData, layerIndex, layerColor, y, bit)) {
                            byteValue |= (1 << (7 - bit));
                            colorUsedInFrameLayer = true;
                        }
                    }
                    frameLayerBytes.push(byteValue);
                }
                // Left column, rows 8-15
                for (let y = 8; y < 16; y++) {
                    let byteValue = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        if (isLayerPixelSet(frame.data, frame.msx1LayerData, layerIndex, layerColor, y, bit)) {
                            byteValue |= (1 << (7 - bit));
                            colorUsedInFrameLayer = true;
                        }
                    }
                    frameLayerBytes.push(byteValue);
                }
                // Right column, rows 0-7
                for (let y = 0; y < 8; y++) {
                    let byteValue = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        if (isLayerPixelSet(frame.data, frame.msx1LayerData, layerIndex, layerColor, y, 8 + bit)) {
                            byteValue |= (1 << (7 - bit));
                            colorUsedInFrameLayer = true;
                        }
                    }
                    frameLayerBytes.push(byteValue);
                }
                // Right column, rows 8-15
                for (let y = 8; y < 16; y++) {
                    let byteValue = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        if (isLayerPixelSet(frame.data, frame.msx1LayerData, layerIndex, layerColor, y, 8 + bit)) {
                            byteValue |= (1 << (7 - bit));
                            colorUsedInFrameLayer = true;
                        }
                    }
                    frameLayerBytes.push(byteValue);
                }
            }
            else {
                // 8x8 or other sizes - use linear format
                for (let y = 0; y < height; y++) {
                    for (let xByte = 0; xByte < Math.ceil(width / 8); xByte++) {
                        let byteValue = 0;
                        for (let bit = 0; bit < 8; bit++) {
                            const px = xByte * 8 + bit;
                            if (px < width) {
                                if (isLayerPixelSet(frame.data, frame.msx1LayerData, layerIndex, layerColor, y, px)) {
                                    byteValue |= (1 << (7 - bit));
                                    colorUsedInFrameLayer = true;
                                }
                            }
                        }
                        frameLayerBytes.push(byteValue);
                    }
                }
            }
            // Only add this layer's bytes if the color was actually used in the frame.
            // This avoids exporting empty layers for unused palette slots.
            if (colorUsedInFrameLayer) {
                allFramesBytes.push(frameLayerBytes);
            }
        }
    });
    const flatBytes = allFramesBytes.flat();
    return new Uint8Array(flatBytes);
};
exports.generateSpriteBinaryData = generateSpriteBinaryData;
/**
 * Mirrors pixel data horizontally.
 * @param pixelData The pixel data to mirror.
 * @returns The horizontally mirrored pixel data.
 */
const mirrorPixelDataHorizontally = (pixelData) => {
    return pixelData.map(row => [...row].reverse());
};
exports.mirrorPixelDataHorizontally = mirrorPixelDataHorizontally;
/**
 * Mirrors pixel data vertically.
 * @param pixelData The pixel data to mirror.
 * @returns The vertically mirrored pixel data.
 */
const mirrorPixelDataVertically = (pixelData) => {
    return [...pixelData].reverse();
};
exports.mirrorPixelDataVertically = mirrorPixelDataVertically;
const DIRECTION_SUFFIX_REGEX = /_(left|right|up|down)$/i;
const normalizeDirection = (value) => {
    if (!value)
        return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'left' || normalized === 'right' || normalized === 'up' || normalized === 'down') {
        return normalized;
    }
    return undefined;
};
const parseDirectionalSuffix = (name) => {
    const match = name.match(DIRECTION_SUFFIX_REGEX);
    if (!match) {
        return { baseName: name };
    }
    return {
        baseName: name.slice(0, -match[0].length),
        suffixDirection: normalizeDirection(match[1])
    };
};
const createAutoDirectionalSprite = (source, targetName, targetDirection, transform, invertLayerYOffset = false) => {
    const msx1LayerOffsets = source.msx1LayerOffsets && invertLayerYOffset
        ? Object.fromEntries(Object.entries(source.msx1LayerOffsets).map(([key, value]) => [
            key,
            {
                ...value,
                offsetY: typeof value?.offsetY === 'number' ? -value.offsetY : value?.offsetY
            }
        ]))
        : source.msx1LayerOffsets;
    return {
        ...source,
        id: `${source.id}__auto_${targetDirection}`,
        name: targetName,
        facingDirection: targetDirection,
        msx1LayerOffsets,
        frames: source.frames.map((frame, frameIndex) => ({
            ...frame,
            id: `${frame.id || `f${frameIndex}`}_${targetDirection}_auto`,
            data: transform(frame.data),
            msx1LayerData: frame.msx1LayerData
                ? Object.fromEntries(Object.entries(frame.msx1LayerData).map(([key, plane]) => [
                    key,
                    invertLayerYOffset
                        ? [...plane].reverse().map(row => [...row])
                        : plane.map(row => [...row].reverse())
                ]))
                : undefined
        }))
    };
};
const addNameMapping = (nameToIndex, key, index, warnings) => {
    if (!key)
        return;
    const keys = key === key.toLowerCase() ? [key] : [key, key.toLowerCase()];
    keys.forEach(candidate => {
        const existing = nameToIndex[candidate];
        if (existing === undefined) {
            nameToIndex[candidate] = index;
            return;
        }
        if (existing !== index) {
            warnings.push(`Name alias collision for "${candidate}" between indexes ${existing} and ${index}. Keeping first mapping.`);
        }
    });
};
/**
 * Builds a deterministic sprite catalog for MSX generation:
 * - Canonical directional names (<base>_<dir>)
 * - Missing directional variants via mirror transforms
 * - Backward-compatible aliases (old names and IDs)
 */
const buildMSXDirectionalSpriteCatalog = (sourceSprites) => {
    const warnings = [];
    const usedNames = new Set();
    const entries = [];
    const directionalFamilies = new Map();
    const ensureUniqueName = (preferred, fallback, context) => {
        if (!usedNames.has(preferred))
            return preferred;
        if (!usedNames.has(fallback)) {
            warnings.push(`Name "${preferred}" already exists. Using fallback "${fallback}" for ${context}.`);
            return fallback;
        }
        let suffix = 1;
        let candidate = `${preferred}_${suffix}`;
        while (usedNames.has(candidate)) {
            suffix += 1;
            candidate = `${preferred}_${suffix}`;
        }
        warnings.push(`Name "${preferred}" already exists. Using "${candidate}" for ${context}.`);
        return candidate;
    };
    sourceSprites.forEach((sourceSprite, sourceIndex) => {
        const originalName = sourceSprite.name || `sprite_${sourceIndex}`;
        const { baseName: suffixBaseName, suffixDirection } = parseDirectionalSuffix(originalName);
        const facingDirection = normalizeDirection(sourceSprite.facingDirection);
        if (facingDirection && suffixDirection && facingDirection !== suffixDirection) {
            warnings.push(`Sprite "${originalName}" has suffix "${suffixDirection}" but facing "${facingDirection}". Using facing direction.`);
        }
        const effectiveDirection = facingDirection || suffixDirection;
        const canonicalBaseName = suffixDirection ? suffixBaseName : originalName;
        const desiredName = effectiveDirection ? `${canonicalBaseName}_${effectiveDirection}` : originalName;
        const finalName = ensureUniqueName(desiredName, originalName, `sprite "${originalName}"`);
        const aliases = new Set();
        if (originalName !== finalName)
            aliases.add(originalName);
        const normalizedSprite = {
            ...sourceSprite,
            name: finalName,
            facingDirection: effectiveDirection || sourceSprite.facingDirection
        };
        const entry = {
            sprite: normalizedSprite,
            baseName: canonicalBaseName,
            direction: effectiveDirection,
            aliases
        };
        entries.push(entry);
        usedNames.add(finalName);
        if (effectiveDirection) {
            const family = directionalFamilies.get(canonicalBaseName) || {};
            if (family[effectiveDirection] === undefined) {
                family[effectiveDirection] = entries.length - 1;
                directionalFamilies.set(canonicalBaseName, family);
            }
            else {
                warnings.push(`Duplicate directional sprite for "${canonicalBaseName}_${effectiveDirection}". Keeping first occurrence.`);
            }
        }
    });
    directionalFamilies.forEach((family, baseName) => {
        const addGeneratedVariant = (targetDirection, sourceIndex, transform, transformName, invertLayerYOffset = false) => {
            if (sourceIndex === undefined)
                return;
            if (family[targetDirection] !== undefined)
                return;
            const targetName = `${baseName}_${targetDirection}`;
            if (usedNames.has(targetName)) {
                warnings.push(`Cannot auto-generate "${targetName}" because the name already exists.`);
                return;
            }
            const sourceEntry = entries[sourceIndex];
            const generatedSprite = createAutoDirectionalSprite(sourceEntry.sprite, targetName, targetDirection, transform, invertLayerYOffset);
            const generatedEntry = {
                sprite: generatedSprite,
                baseName,
                direction: targetDirection,
                aliases: new Set()
            };
            entries.push(generatedEntry);
            family[targetDirection] = entries.length - 1;
            usedNames.add(targetName);
            warnings.push(`Auto-generated "${targetName}" from "${sourceEntry.sprite.name}" using ${transformName}.`);
        };
        if (family.right !== undefined && family.left === undefined) {
            addGeneratedVariant('left', family.right, exports.mirrorPixelDataHorizontally, 'horizontal mirror');
        }
        else if (family.left !== undefined && family.right === undefined) {
            addGeneratedVariant('right', family.left, exports.mirrorPixelDataHorizontally, 'horizontal mirror');
        }
        if (family.up !== undefined && family.down === undefined) {
            addGeneratedVariant('down', family.up, exports.mirrorPixelDataVertically, 'vertical mirror', true);
        }
        else if (family.down !== undefined && family.up === undefined) {
            addGeneratedVariant('up', family.down, exports.mirrorPixelDataVertically, 'vertical mirror', true);
        }
    });
    const nameToIndex = {};
    entries.forEach((entry, index) => {
        addNameMapping(nameToIndex, entry.sprite.name, index, warnings);
        addNameMapping(nameToIndex, entry.sprite.id, index, warnings);
    });
    entries.forEach((entry, index) => {
        entry.aliases.forEach(alias => addNameMapping(nameToIndex, alias, index, warnings));
    });
    const lookupLeft = entries.map((_entry, index) => index);
    const lookupRight = entries.map((_entry, index) => index);
    const lookupUp = entries.map((_entry, index) => index);
    const lookupDown = entries.map((_entry, index) => index);
    entries.forEach((entry, index) => {
        const family = directionalFamilies.get(entry.baseName);
        if (!family)
            return;
        if (family.left !== undefined)
            lookupLeft[index] = family.left;
        if (family.right !== undefined)
            lookupRight[index] = family.right;
        if (family.up !== undefined)
            lookupUp[index] = family.up;
        if (family.down !== undefined)
            lookupDown[index] = family.down;
    });
    return {
        sprites: entries.map(entry => entry.sprite),
        nameToIndex,
        directionalLookupTables: {
            left: lookupLeft,
            right: lookupRight,
            up: lookupUp,
            down: lookupDown
        },
        warnings
    };
};
exports.buildMSXDirectionalSpriteCatalog = buildMSXDirectionalSpriteCatalog;
// Helper function to ensure two-digit uppercase hex representation
const toHexByte = (num) => {
    let hex = num.toString(16).toUpperCase();
    if (hex.length === 1) {
        hex = '0' + hex; // Manual padding
    }
    return hex;
};
/**
 * Generates Z80 assembly code for a single frame of a sprite.
 * This uses the same logic as the Sprite Editor's "Download ASM" button.
 * @param frameName The name of the frame, used for labels in the ASM code.
 * @param frameData The pixel data for the frame.
 * @param spritePalette The sprite's 4-color palette.
 * @param backgroundColor The sprite's background color, which is not exported as a layer.
 * @param spriteWidth The width of the sprite in pixels.
 * @param spriteHeight The height of the sprite in pixels.
 * @param dataFormat The data format for exporting to ASM.
 * @returns A string containing the generated assembly code for the frame.
 */
const generateSingleFrameASMCode = (frameName, frameData, spritePalette, backgroundColor, spriteWidth, spriteHeight, dataFormat = 'hex', layerIndexesToExport, frameLayerData) => {
    const ASM_BYTES_PER_LINE = 16;
    const safeFrameName = frameName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    let asmString = `;; ---- Sprite Frame: ${frameName} ----\n`;
    asmString += `;; Size: ${spriteWidth}x${spriteHeight}\n`;
    let layersGenerated = 0;
    const exportLayers = Array.isArray(layerIndexesToExport) && layerIndexesToExport.length > 0
        ? layerIndexesToExport
        : spritePalette
            .map((_color, index) => index)
            .filter((index) => {
            const color = spritePalette[index];
            return !!color && color !== backgroundColor;
        });
    for (const layerIndex of exportLayers) {
        const layerColor = spritePalette[layerIndex];
        if (!layerColor || layerColor === backgroundColor) {
            continue;
        }
        // Export a stable set of layers across all frames (pre-selected in
        // generateSpriteASMCode). Individual frames can still have zero bytes
        // for a given layer if that color is not present in that frame.
        // First, generate layer bytes to check if layer is empty
        const layerBytes = [];
        // MSX VDP 16x16 sprite format:
        // For 16x16 sprites, the VDP expects data in a specific column-major order:
        // Bytes 0-7:   Left column (pixels 0-7), rows 0-7
        // Bytes 8-15:  Left column (pixels 0-7), rows 8-15
        // Bytes 16-23: Right column (pixels 8-15), rows 0-7
        // Bytes 24-31: Right column (pixels 8-15), rows 8-15
        if (spriteWidth === 16 && spriteHeight === 16) {
            // 16x16 sprite - use MSX column-major format
            // Left column, rows 0-7
            for (let y = 0; y < 8; y++) {
                let byteValue = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const px = bit; // Left column (pixels 0-7)
                    if (isLayerPixelSet(frameData, frameLayerData, layerIndex, layerColor, y, px)) {
                        byteValue |= (1 << (7 - bit));
                    }
                }
                layerBytes.push(byteValue);
            }
            // Left column, rows 8-15
            for (let y = 8; y < 16; y++) {
                let byteValue = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const px = bit; // Left column (pixels 0-7)
                    if (isLayerPixelSet(frameData, frameLayerData, layerIndex, layerColor, y, px)) {
                        byteValue |= (1 << (7 - bit));
                    }
                }
                layerBytes.push(byteValue);
            }
            // Right column, rows 0-7
            for (let y = 0; y < 8; y++) {
                let byteValue = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const px = 8 + bit; // Right column (pixels 8-15)
                    if (isLayerPixelSet(frameData, frameLayerData, layerIndex, layerColor, y, px)) {
                        byteValue |= (1 << (7 - bit));
                    }
                }
                layerBytes.push(byteValue);
            }
            // Right column, rows 8-15
            for (let y = 8; y < 16; y++) {
                let byteValue = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const px = 8 + bit; // Right column (pixels 8-15)
                    if (isLayerPixelSet(frameData, frameLayerData, layerIndex, layerColor, y, px)) {
                        byteValue |= (1 << (7 - bit));
                    }
                }
                layerBytes.push(byteValue);
            }
        }
        else {
            // 8x8 or other sizes - use linear format
            for (let y = 0; y < spriteHeight; y++) {
                for (let xByte = 0; xByte < Math.ceil(spriteWidth / 8); xByte++) {
                    let byteValue = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        const px = xByte * 8 + bit;
                        if (px < spriteWidth) {
                            if (isLayerPixelSet(frameData, frameLayerData, layerIndex, layerColor, y, px)) {
                                byteValue |= (1 << (7 - bit));
                            }
                        }
                    }
                    layerBytes.push(byteValue);
                }
            }
        }
        // Always generate the selected layer label, even if this frame has no
        // pixels for that layer, to keep per-frame byte layout stable.
        // Layer has data, so write the label and data
        layersGenerated += 1;
        asmString += `${safeFrameName}_LAYER${layerIndex}: ; Brush Color Index ${layerIndex} (Actual Color: ${layerColor})\n`;
        if (spriteWidth % 8 !== 0) {
            asmString += `;; WARNING: Sprite width ${spriteWidth} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.\n`;
        }
        for (let i = 0; i < layerBytes.length; i += ASM_BYTES_PER_LINE) {
            const chunk = layerBytes.slice(i, i + ASM_BYTES_PER_LINE);
            const formattedChunk = chunk.map(b => {
                return dataFormat === 'hex' ? `#${toHexByte(b)}` : b.toString();
            });
            asmString += `    DB ${formattedChunk.join(',')}\n`;
        }
        asmString += '\n';
    }
    if (layersGenerated === 0) {
        asmString += `;; NO DRAWABLE LAYERS EXPORTED for ${frameName} - Palette may match background color.\n`;
    }
    asmString += `;; ---- End of Frame: ${frameName} ----\n\n`;
    return asmString;
};
exports.generateSingleFrameASMCode = generateSingleFrameASMCode;
/**
 * Generates Z80 assembly code for an entire sprite with all frames.
 * This uses the same logic as the Sprite Editor's "Download ASM" button.
 * @param sprite The sprite to generate code for.
 * @param dataFormat The data format for exporting to ASM.
 * @returns A string containing the generated assembly code for the entire sprite.
 */
const generateSpriteASMCode = (sprite, dataFormat = 'hex', uniqueIndex) => {
    let fullAsmCode = `;; Sprite: ${sprite.name}\n`;
    fullAsmCode += `;; Total Frames: ${sprite.frames.length}\n`;
    fullAsmCode += `;; Size: ${sprite.size.width}x${sprite.size.height}\n`;
    fullAsmCode += `;; Background Color (not exported as a layer): ${sprite.backgroundColor}\n`;
    fullAsmCode += `;; Drawable Palette (Hex): C0=${sprite.spritePalette[0]}, C1=${sprite.spritePalette[1]}, C2=${sprite.spritePalette[2]}, C3=${sprite.spritePalette[3]}\n\n`;
    // Constants for MSX Main Generator
    const suffix = uniqueIndex !== undefined ? `_${uniqueIndex}` : '';
    const uniqueName = sprite.name + suffix;
    const safeSpriteName = uniqueName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    fullAsmCode += `SPRITE_${safeSpriteName}_WIDTH     EQU ${sprite.size.width}\n`;
    fullAsmCode += `SPRITE_${safeSpriteName}_HEIGHT    EQU ${sprite.size.height}\n`;
    fullAsmCode += `SPRITE_${safeSpriteName}_FRAMES    EQU ${sprite.frames.length}\n\n`;
    // Keep a stable (and compact) layer set across all frames:
    // only non-background palette layers that are actually used at least once.
    const usedLayerIndexes = sprite.spritePalette
        .map((_color, index) => index)
        .filter((layerIndex) => {
        const layerColor = sprite.spritePalette[layerIndex];
        if (!layerColor || layerColor === sprite.backgroundColor)
            return false;
        return sprite.frames.some((frame) => frameUsesLayer(frame, layerIndex, layerColor));
    });
    sprite.frames.forEach((frame, index) => {
        fullAsmCode += (0, exports.generateSingleFrameASMCode)(`${uniqueName}_F${index}`, frame.data, sprite.spritePalette, sprite.backgroundColor, sprite.size.width, sprite.size.height, dataFormat, usedLayerIndexes, frame.msx1LayerData);
    });
    return fullAsmCode;
};
exports.generateSpriteASMCode = generateSpriteASMCode;

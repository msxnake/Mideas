"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpriteASMCode = exports.generateSingleFrameASMCode = exports.mirrorPixelDataVertically = exports.mirrorPixelDataHorizontally = exports.generateSpriteBinaryData = void 0;
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
            for (let y = 0; y < sprite.size.height; y++) {
                for (let xByte = 0; xByte < Math.ceil(sprite.size.width / 8); xByte++) {
                    let byteValue = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        const px = xByte * 8 + bit;
                        if (px < sprite.size.width) {
                            const pixelColorValue = frame.data[y]?.[px];
                            if (pixelColorValue === layerColor) {
                                byteValue |= (1 << (7 - bit));
                                colorUsedInFrameLayer = true;
                            }
                        }
                    }
                    frameLayerBytes.push(byteValue);
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
const generateSingleFrameASMCode = (frameName, frameData, spritePalette, backgroundColor, spriteWidth, spriteHeight, dataFormat = 'hex') => {
    const ASM_BYTES_PER_LINE = 16;
    const safeFrameName = frameName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    let asmString = `;; ---- Sprite Frame: ${frameName} ----\n`;
    asmString += `;; Size: ${spriteWidth}x${spriteHeight}\n`;
    let layersGenerated = 0;
    for (let layerIndex = 0; layerIndex < spritePalette.length; layerIndex++) {
        const layerColor = spritePalette[layerIndex];
        let colorUsed = false;
        if (layerColor !== backgroundColor) {
            for (let y = 0; y < spriteHeight; y++) {
                for (let x = 0; x < spriteWidth; x++) {
                    if (frameData[y]?.[x] === layerColor) {
                        colorUsed = true;
                        break;
                    }
                }
                if (colorUsed)
                    break;
            }
        }
        if (!colorUsed) {
            asmString += `;; Layer ${layerIndex} (Color: ${layerColor}) - SKIPPED (color not used or is background)\n`;
            continue;
        }
        layersGenerated++;
        asmString += `${safeFrameName}_LAYER${layerIndex}: ; Brush Color Index ${layerIndex} (Actual Color: ${layerColor})\n`;
        const layerBytes = [];
        if (spriteWidth % 8 !== 0) {
            asmString += `;; WARNING: Sprite width ${spriteWidth} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.\n`;
        }
        for (let y = 0; y < spriteHeight; y++) {
            for (let xByte = 0; xByte < Math.ceil(spriteWidth / 8); xByte++) {
                let byteValue = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const px = xByte * 8 + bit;
                    if (px < spriteWidth) {
                        const pixelColorValue = frameData[y]?.[px];
                        if (pixelColorValue === layerColor) {
                            byteValue |= (1 << (7 - bit));
                        }
                    }
                }
                layerBytes.push(byteValue);
            }
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
        asmString += `;; NO ACTIVE LAYERS EXPORTED for ${frameName} - Frame might be empty or only contain the background color.\n`;
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
const generateSpriteASMCode = (sprite, dataFormat = 'hex') => {
    let fullAsmCode = `;; Sprite: ${sprite.name}\n`;
    fullAsmCode += `;; Total Frames: ${sprite.frames.length}\n`;
    fullAsmCode += `;; Size: ${sprite.size.width}x${sprite.size.height}\n`;
    fullAsmCode += `;; Background Color (not exported as a layer): ${sprite.backgroundColor}\n`;
    fullAsmCode += `;; Drawable Palette (Hex): C0=${sprite.spritePalette[0]}, C1=${sprite.spritePalette[1]}, C2=${sprite.spritePalette[2]}, C3=${sprite.spritePalette[3]}\n\n`;
    // Constants for MSX Main Generator
    const safeSpriteName = sprite.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    fullAsmCode += `SPRITE_${safeSpriteName}_WIDTH     EQU ${sprite.size.width}\n`;
    fullAsmCode += `SPRITE_${safeSpriteName}_HEIGHT    EQU ${sprite.size.height}\n`;
    fullAsmCode += `SPRITE_${safeSpriteName}_FRAMES    EQU ${sprite.frames.length}\n\n`;
    sprite.frames.forEach((frame, index) => {
        fullAsmCode += (0, exports.generateSingleFrameASMCode)(`${sprite.name}_F${index}`, frame.data, sprite.spritePalette, sprite.backgroundColor, sprite.size.width, sprite.size.height, dataFormat);
    });
    return fullAsmCode;
};
exports.generateSpriteASMCode = generateSpriteASMCode;

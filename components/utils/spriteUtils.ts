import { PixelData, Sprite } from '../../types';

/**
 * Generates raw byte array for a sprite, concatenating all layers of all frames.
 * Each layer represents pixels matching one of the 4 sprite palette colors (excluding background).
 */
export const generateSpriteBinaryData = (sprite: Sprite): Uint8Array => {
  const allFramesBytes: number[][] = [];
  
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
      const frameLayerBytes: number[] = [];

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

export const mirrorPixelDataHorizontally = (pixelData: PixelData): PixelData => {
  return pixelData.map(row => [...row].reverse());
};

export const mirrorPixelDataVertically = (pixelData: PixelData): PixelData => {
  return [...pixelData].reverse();
};

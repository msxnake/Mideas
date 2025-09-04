/**
 * @fileoverview This module provides functions to serialize project assets into binary formats suitable for MSX.
 */

/**
 * The MSX color palette used for serialization.
 * @type {string[]}
 */
const MSX_PALETTE = [
  '#000000', // 0: transparent (treated as black)
  '#010101', // 1: black
  '#3eb849', // 2: medium green
  '#74d07d', // 3: light green
  '#5955e0', // 4: dark blue
  '#8076f1', // 5: light blue
  '#b95e51', // 6: dark red
  '#65dbef', // 7: cyan
  '#db6559', // 8: medium red
  '#ff897d', // 9: light red
  '#ccc35e', // 10: dark yellow
  '#ded087', // 11: light yellow
  '#3aa241', // 12: dark green
  '#b766b5', // 13: magenta
  '#cccccc', // 14: gray
  '#ffffff', // 15: white
];

/**
 * A reverse map from hex color to palette index for quick lookups.
 * @type {Map<string, number>}
 */
const MSX_COLOR_TO_INDEX = new Map(MSX_PALETTE.map((hex, i) => [hex.toUpperCase(), i]));
MSX_COLOR_TO_INDEX.set('#000000', 1);

/**
 * Serializes a tile asset into a binary buffer.
 * Each pixel is represented by a 4-bit color index, and two pixels are packed into a single byte.
 * @param {object} tile - The tile data object.
 * @param {number[][]} tile.data - The 2D array of pixel data (hex color strings).
 * @param {number} tile.width - The width of the tile in pixels.
 * @param {number} tile.height - The height of the tile in pixels.
 * @returns {Buffer} The serialized tile data as a Buffer.
 */
function serializeTile(tile) {
  if (!tile || !tile.data || !tile.width || !tile.height) {
    throw new Error('Invalid tile data provided for serialization.');
  }

  const { width, height, data } = tile;
  const pixels = data.flat();

  const bufferSize = (width * height) / 2;
  const buffer = Buffer.alloc(bufferSize);

  for (let i = 0; i < pixels.length; i += 2) {
    const hex1 = pixels[i].toUpperCase();
    const hex2 = pixels[i + 1].toUpperCase();

    const index1 = MSX_COLOR_TO_INDEX.get(hex1) ?? 1;
    const index2 = MSX_COLOR_TO_INDEX.get(hex2) ?? 1;

    const byte = (index1 << 4) | index2;
    buffer.writeUInt8(byte, i / 2);
  }

  return buffer;
}

/**
 * Serializes a generic project asset based on its type.
 * Currently supports 'tile' type, falling back to JSON stringification for others.
 * @param {object} asset - The project asset object.
 * @param {string} asset.type - The type of the asset (e.g., 'tile', 'sprite').
 * @param {object} asset.data - The data associated with the asset.
 * @returns {Buffer} The serialized asset data as a Buffer.
 */
function serializeAsset(asset) {
  if (!asset || !asset.type || !asset.data) {
    throw new Error('Invalid asset provided for serialization.');
  }

  switch (asset.type) {
    case 'tile':
      return serializeTile(asset.data);
    default:
      return Buffer.from(JSON.stringify(asset.data, null, 2));
  }
}

/**
 * @module assetSerializer
 */
module.exports = {
  serializeAsset,
  serializeTile,
  MSX_PALETTE,
};

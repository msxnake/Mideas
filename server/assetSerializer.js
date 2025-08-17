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

// A reverse map for quick lookups
const MSX_COLOR_TO_INDEX = new Map(MSX_PALETTE.map((hex, i) => [hex.toUpperCase(), i]));
// Add some tolerance for near-black colors from different sources
MSX_COLOR_TO_INDEX.set('#000000', 1);

function serializeTile(tile) {
  if (!tile || !tile.data || !tile.width || !tile.height) {
    throw new Error('Invalid tile data provided for serialization.');
  }

  const { width, height, data } = tile;
  const pixels = data.flat();

  // Each pixel is a 4-bit index, so 2 pixels per byte.
  const bufferSize = (width * height) / 2;
  const buffer = Buffer.alloc(bufferSize);

  for (let i = 0; i < pixels.length; i += 2) {
    const hex1 = pixels[i].toUpperCase();
    const hex2 = pixels[i + 1].toUpperCase();

    const index1 = MSX_COLOR_TO_INDEX.get(hex1) ?? 1; // Default to black if not found
    const index2 = MSX_COLOR_TO_INDEX.get(hex2) ?? 1;

    // Pack two 4-bit indices into a single byte.
    // The first pixel goes into the high nibble, the second into the low nibble.
    const byte = (index1 << 4) | index2;
    buffer.writeUInt8(byte, i / 2);
  }

  return buffer;
}

function serializeAsset(asset) {
  if (!asset || !asset.type || !asset.data) {
    throw new Error('Invalid asset provided for serialization.');
  }

  switch (asset.type) {
    case 'tile':
      return serializeTile(asset.data);
    // Add cases for other asset types here in the future
    // case 'sprite':
    //   return serializeSprite(asset.data);
    // case 'screenmap':
    //   return serializeScreenMap(asset.data);
    default:
      // For now, for unknown types, we'll just stringify them as before.
      // This maintains old behavior for asset types we don't handle yet.
      return Buffer.from(JSON.stringify(asset.data, null, 2));
  }
}

module.exports = {
  serializeAsset,
  serializeTile,
  MSX_PALETTE,
};

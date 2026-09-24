import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const spriteFile = path.join(dir, 'alien_rival_48.msx2sprite.json');
const sprite = JSON.parse(fs.readFileSync(spriteFile, 'utf8')).entries[0].sprite;
const id = 'msx2bitmapstamp_alien_rival_48';
const paletteId = `${id}_palette`;
const slotByHex = new Map(sprite.palette.map(slot => [slot.hex.toUpperCase(), slot.slotIndex]));
const pixels = frame => frame.data.map(row => row.map(hex => {
  const slot = slotByHex.get(hex.toUpperCase());
  if (slot === undefined) throw new Error(`Pixel outside the sprite palette: ${hex}`);
  return slot;
}));
const makeTile = (grid, index, frameName) => {
  const row = Math.floor(index / 3), col = index % 3;
  return {
    id: `${id}_${frameName}_${index}`,
    name: `Rival alien ${frameName} r${row} c${col}`,
    mode: 'SCREEN5_BITMAP',
    width: 16,
    height: 16,
    sourceType: 'generated',
    paletteId,
    pixelData: grid.slice(row * 16, row * 16 + 16)
      .flatMap(line => line.slice(col * 16, col * 16 + 16)),
    createdAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
  };
};

const base = pixels(sprite.frames[0]);
const charge = pixels(sprite.frames[1]);
const tiles = Array.from({ length: 9 }, (_, index) => makeTile(base, index, 'idle'));
const changed = tiles.map((tile, index) => ({ index, tile: makeTile(charge, index, 'charge') }))
  .filter(({ index, tile }) => tile.pixelData.some((pixel, offset) => pixel !== tiles[index].pixelData[offset]));
const stamp = {
  id,
  name: 'Sujeto Rival 48x48',
  mode: 'SCREEN5_BITMAP_STAMP',
  columns: 3,
  rows: 3,
  tileWidth: 16,
  tileHeight: 16,
  sourceType: 'generated',
  paletteId,
  tiles,
  frameVariants: [{ id: `${id}_charge`, name: 'Carga de energia', cells: changed }],
  tags: ['boss', 'alien', 'area51'],
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};
const library = { version: 1, entries: [{ id, name: stamp.name, savedAt: Date.now(), stamp, palette: sprite.palette }] };
const out = path.join(dir, 'alien_rival_48.msx2bitmapstamp.json');
fs.writeFileSync(out, JSON.stringify(library, null, 2) + '\n');
console.log(`OK ${out}: 9 base tiles, ${changed.length} changed tiles for the charge frame`);

import fs from 'node:fs';
import path from 'node:path';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const inputPath = path.resolve(args.get('--input') || '');
const outputPath = path.resolve(args.get('--output') || '');
if (!inputPath || !outputPath || inputPath === outputPath) {
  throw new Error('Use --input <project.json> --output <new-project.json>; output must be different.');
}

const project = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const assets = Array.isArray(project.assets) ? project.assets : [];
const sourceHud = assets.find((asset) => asset.type === 'msx2hud' && asset.name === 'Marcador_nueces_refinado');
const sourceFont = assets.find((asset) => asset.id === sourceHud?.data?.hudFontAssetId && asset.type === 'msx2hudfont');
const minaPalette = assets.find((asset) => asset.type === 'palette' && asset.name === 'mina_luz_8x2');
if (!sourceHud || !sourceFont || !minaPalette) {
  throw new Error('Missing Marcador_nueces_refinado, its HUD font, or palette mina_luz_8x2.');
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const darkFont = clone(sourceFont);
darkFont.id = 'msx2hudfont_mina_luz_8x2';
darkFont.name = 'HUD Font · Mina Luz';
darkFont.data.name = darkFont.name;
darkFont.data.paletteAssetId = minaPalette.id;
darkFont.data.colorByte = 0x71;

const fontRemap = new Map([[15, 7], [2, 6], [3, 4], [8, 3]]);
for (const glyph of Object.values(darkFont.data.bitmapPatterns || {})) {
  for (const row of glyph) {
    for (let x = 0; x < row.length; x += 1) row[x] = fontRemap.get(row[x]) ?? row[x];
  }
}

const darkHud = clone(sourceHud);
darkHud.id = 'msx2hud_mina_luz_8x2';
darkHud.name = 'Marcador_nueces_mina_luz';
darkHud.data.name = darkHud.name;
darkHud.data.paletteAssetId = minaPalette.id;
darkHud.data.hudFontAssetId = darkFont.id;
darkHud.data.notes = 'HUD de alto contraste para la paleta mina_luz_8x2 y habitaciones con iluminación oscura.';

const iconIdMap = new Map();
for (const icon of darkHud.data.icons) {
  const previousId = icon.id;
  icon.id = `${previousId}_mina`;
  iconIdMap.set(previousId, icon.id);

  let remap;
  if (icon.name === 'Heart Full Refined') remap = new Map([[15, 7], [2, 5], [9, 6]]);
  else if (icon.name === 'Heart Empty Refined') remap = new Map([[14, 3]]);
  else if (icon.name === 'Key Gold Refined') remap = new Map([[11, 6], [15, 7]]);
  else if (icon.name === 'Key Empty Refined') remap = new Map([[14, 3], [8, 7]]);
  else if (icon.name === 'Nut Refined') remap = new Map([[4, 4], [10, 6], [6, 14], [11, 7]]);
  else if (icon.name === 'Gem Blue Refined') remap = new Map([[3, 5], [8, 4], [15, 7]]);
  else remap = new Map([[15, 7], [14, 3], [11, 6], [10, 5], [9, 6], [8, 4], [3, 4], [2, 5]]);

  icon.name = `${icon.name} · Mina`;
  icon.pixels = icon.pixels.map((row) => row.map((value) => remap.get(value) ?? value));
}

for (const layer of darkHud.data.layers) {
  layer.id = `${layer.id}_mina`;
  layer.element.id = `${layer.element.id}_mina`;
  if (layer.element.atlasEntryId) layer.element.atlasEntryId = iconIdMap.get(layer.element.atlasEntryId);
  if (layer.element.emptyAtlasEntryId) layer.element.emptyAtlasEntryId = iconIdMap.get(layer.element.emptyAtlasEntryId);
  layer.element.colors = {
    ...layer.element.colors,
    text: 7,
    outline: 1,
    primary: 5,
    secondary: 3,
    border: 7,
    empty: 11,
  };
  if (layer.element.kind === 'icon') layer.element.colors.empty = 1;
}

const paletteKey = (slots) => JSON.stringify((slots || []).map(({ slotIndex, masterIndex }) => [slotIndex, masterIndex]));
const minaPaletteKey = paletteKey(minaPalette.data.slots);
const linkedRooms = [];
for (const room of assets.filter((asset) => asset.type === 'msx2bitmaproom')) {
  if (paletteKey(room.data?.palette) !== minaPaletteKey) continue;
  room.data.runtime ||= {};
  room.data.runtime.hudAssetId = darkHud.id;
  room.data.runtime.hideHud = false;
  room.data.runtime.showHud = true;
  room.data.runtime.statusHud = true;
  room.data.runtime.playerEnergyMax = 5;
  room.data.runtime.playerEnergyInitial = Math.min(5, room.data.runtime.playerEnergyInitial ?? 5);
  linkedRooms.push(room.name);
}

assets.push(darkFont, darkHud);
project.currentProjectName = 'test263_nueces16';
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(project)}\n`, 'utf8');

console.log(JSON.stringify({
  inputPath,
  outputPath,
  paletteId: minaPalette.id,
  hudId: darkHud.id,
  fontId: darkFont.id,
  linkedRooms,
  outputBytes: fs.statSync(outputPath).size,
}, null, 2));

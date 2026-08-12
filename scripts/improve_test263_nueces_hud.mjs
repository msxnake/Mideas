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
const hud = project.assets?.find((asset) => asset.type === 'msx2hud');
if (!hud) throw new Error('The project has no msx2hud asset.');

const iconByName = new Map(hud.data.icons.map((icon) => [icon.name, icon]));
const layerByName = new Map(hud.data.layers.map((layer) => [layer.name, layer]));

const rowsToPixels = (rows, colors) => {
  const width = rows[0]?.length || 0;
  if (!width || rows.some((row) => row.length !== width)) {
    throw new Error('Icon rows must all have the same width.');
  }
  return rows.map((row) => [...row].map((symbol) => colors[symbol] ?? -1));
};

const replaceIcon = (name, nextName, rows, colors) => {
  const icon = iconByName.get(name);
  if (!icon) throw new Error(`Missing HUD icon: ${name}`);
  icon.name = nextName;
  icon.width = rows[0].length;
  icon.height = rows.length;
  icon.pixels = rowsToPixels(rows, colors);
  return icon;
};

const fullHeart = replaceIcon(
  'Icon_heart 2',
  'Heart Full Refined',
  [
    '..KK..KK....',
    '.KWWKKWWK...',
    'KWRRWWRRWK..',
    'KWRRRRRRWK..',
    'KWRPRRPRWK..',
    '.KWRRRRWK...',
    '..KWRRWK....',
    '...KWWK.....',
    '....KK......',
    '............',
    '............',
    '............',
  ],
  { K: 1, R: 2, P: 9, W: 15 },
);

const emptyHeart = replaceIcon(
  'Icon_heart',
  'Heart Empty Refined',
  [
    '..KK..KK....',
    '.KGGKKGGK...',
    'KG......GK..',
    'KG......GK..',
    'KG......GK..',
    '.KG....GK...',
    '..KG..GK....',
    '...KGGK.....',
    '....KK......',
    '............',
    '............',
    '............',
  ],
  { G: 14, K: 1 },
);

const keyRows = [
  '..............',
  '........KKK...',
  '.......KFFFK..',
  '......KF...FK.',
  '......KF...FK.',
  '.......KFFFK..',
  '........KFK...',
  '........KF....',
  '..KKKKKKKF....',
  '.KFFFFFHHK....',
  '.KF.KK.KK.....',
  '.KK.KK........',
  '..............',
  '..............',
];
const keyOn = replaceIcon('key_on', 'Key Gold Refined', keyRows, { K: 1, F: 11, H: 15 });
const keyOff = replaceIcon('key_off', 'Key Empty Refined', keyRows, { K: 1, F: 14, H: 8 });

const nut = replaceIcon(
  'nuez',
  'Nut Refined',
  [
    '...GGG....',
    '..KYYK....',
    '.KYYYYK...',
    '.KBBBBK...',
    'KBBBBBBK..',
    'KBBHBBBK..',
    '.KBBBBK...',
    '..KBBK....',
    '...KK.....',
    '..........',
  ],
  { K: 1, G: 4, Y: 10, B: 6, H: 11 },
);

const gem = replaceIcon(
  'gema1',
  'Gem Blue Refined',
  [
    '...KK.....',
    '..KCCK....',
    '.KCWWCK...',
    'KCCCCCCK..',
    'KCCBBCCK..',
    '.KCCCCK...',
    '..KCCK....',
    '...KK.....',
    '..........',
    '..........',
  ],
  { K: 1, B: 3, C: 8, W: 15 },
);

const heartsLayer = layerByName.get('Heart / Life');
const keyLayer = layerByName.get('Key Item');
const keyCounterLayer = layerByName.get('Key Counter');
const gemLayer = layerByName.get('Gem / Coin');
const nutLayer = layerByName.get('Icon Slot');
if (![heartsLayer, keyLayer, keyCounterLayer, gemLayer, nutLayer].every(Boolean)) {
  throw new Error('The expected HUD layers were not found.');
}

Object.assign(heartsLayer.element, {
  x: 4,
  y: 4,
  width: 80,
  height: 12,
  maxValue: 5,
  initialValue: 5,
  spacing: 16,
  atlasEntryId: fullHeart.id,
  emptyAtlasEntryId: emptyHeart.id,
  align: { h: 'left', v: 'middle' },
});
heartsLayer.name = 'Health · 5 Hearts';

Object.assign(keyLayer.element, {
  x: 88,
  y: 2,
  width: 16,
  height: 16,
  atlasEntryId: keyOn.id,
  emptyAtlasEntryId: keyOff.id,
  colors: { ...keyLayer.element.colors, border: 15, empty: 1 },
});
keyLayer.name = 'Key Status';

Object.assign(keyCounterLayer.element, {
  kind: 'iconCounter',
  x: 88,
  y: 2,
  width: 48,
  height: 16,
  atlasEntryId: keyOn.id,
  align: { h: 'left', v: 'middle' },
  format: { digits: 2, base: 'dec', zeroPad: false, prefix: 'x' },
});
keyCounterLayer.name = 'Key Counter';

Object.assign(gemLayer.element, {
  kind: 'iconCounter',
  x: 142,
  y: 2,
  width: 48,
  height: 16,
  binding: 'collectibles',
  atlasEntryId: gem.id,
  align: { h: 'left', v: 'middle' },
  format: { digits: 2, base: 'dec', zeroPad: false, prefix: 'x' },
});
gemLayer.name = 'Gem Counter';

Object.assign(nutLayer.element, {
  kind: 'iconCounter',
  x: 196,
  y: 2,
  width: 56,
  height: 16,
  binding: 'ammo',
  atlasEntryId: nut.id,
  align: { h: 'left', v: 'middle' },
  format: { digits: 2, base: 'dec', zeroPad: false, prefix: 'x' },
});
nutLayer.name = 'Nut Counter';

hud.data.layers = hud.data.layers.filter((layer) => (
  layer.id !== 'hud_layer_ammo_nueces' && layer.name !== 'Key Status'
));
hud.name = 'Marcador_nueces_refinado';
hud.data.name = hud.name;
hud.data.notes = 'HUD refinado: cinco corazones reales, iconos legibles y contadores sin solapamientos. Llave unificada en un iconCounter para conservar icono y cantidad usando una sola rutina dinamica.';

let repairedHudLinks = 0;
for (const room of project.assets.filter((asset) => asset.type === 'msx2bitmaproom')) {
  const runtime = room.data?.runtime;
  if (!runtime?.hudAssetId) continue;
  const targetExists = project.assets.some((asset) => asset.id === runtime.hudAssetId && asset.type === 'msx2hud');
  if (!targetExists) {
    runtime.hudAssetId = hud.id;
    repairedHudLinks += 1;
  }
}

project.currentProjectName = 'test263_nueces15';
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(project)}\n`, 'utf8');

console.log(JSON.stringify({
  inputPath,
  outputPath,
  hudId: hud.id,
  hudName: hud.name,
  layerCount: hud.data.layers.length,
  iconCount: hud.data.icons.length,
  repairedHudLinks,
  outputBytes: fs.statSync(outputPath).size,
}, null, 2));

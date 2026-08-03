// Builds the "Mina" lighting fixture: a new world with its own paired palette
// (indices 0-7 lit, 8-15 the dimmed twin of each) and simple stone tiles, so the
// SCREEN 5 halo lighting can be judged on real hardware BEFORE any runtime code
// exists. Rooms are authored with both tile variants side by side, which is
// exactly what the LMMV OR #8 / AND #7 pair will produce at runtime.
//
//   node scripts/build_mina_lighting_fixture.cjs [--source <project.json>]
//
// Derived from an existing project so the player, HUD, state machines and
// GameFlow stay intact; the old bitmap rooms and worldmap are dropped because
// collectBitmapWorldRooms() compiles a single world per ROM.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const SOURCE = argOf('--source', 'C:/Users/salam/Downloads/test183.json');
const OUT = argOf('--out', path.join(ROOT, 'test', 'msx2-lighting', 'mina.json'));
// Los gemelos apagados van a oscuridad de mina (elegido tras compararlo en
// hardware); --penumbra recupera el escalon intermedio, mas legible, que es
// donde caera el anillo de dither.
const DARKER = !args.includes('--penumbra');

// --- Palette -------------------------------------------------------------
// masterIndex = R*64 + G*8 + B with each channel 0..7 (MSX2 9-bit palette).
const CH = ['00', '24', '49', '6D', '92', 'B6', 'DB', 'FF'];
const hexOf = (r, g, b) => `#${CH[r]}${CH[g]}${CH[b]}`;
const slot = (slotIndex, r, g, b) => ({ slotIndex, masterIndex: r * 64 + g * 8 + b, hex: hexOf(r, g, b) });

// 0-7 iluminado, 8-15 = gemelo apagado de (idx-8). Slot 0 stays transparent.
const PALETTE = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  slot(1, 0, 0, 0),   // negro: juntas y fondo
  slot(2, 3, 3, 3),   // #6D6D6D gris oscuro (cuerpo de la piedra)
  slot(3, 5, 5, 5),   // #B6B6B6 gris claro (cara iluminada)
  slot(4, 5, 6, 3),   // #B6DB6D musgo luminoso
  slot(5, 5, 6, 0),   // #B6DB00 player
  slot(6, 6, 6, 3),   // #DBDB6D player
  slot(7, 7, 7, 7),   // #FFFFFF player / HUD
  slot(8, 0, 0, 0),   // gemelo de 0 (nunca deberia aparecer)
  slot(9, 0, 0, 0),   // negro -> negro
  DARKER ? slot(10, 0, 0, 0) : slot(10, 1, 1, 1),  // gris oscuro apagado
  DARKER ? slot(11, 1, 1, 1) : slot(11, 2, 2, 2),  // gris claro apagado
  slot(12, 0, 3, 2),  // #006D49 FOSFORESCENTE: el musgo sigue viendose a oscuras
  slot(13, 2, 3, 0),  // #496D00
  slot(14, 3, 3, 1),  // #6D6D24
  slot(15, 3, 3, 3),  // #6D6D6D
];

// --- Tiles ---------------------------------------------------------------
// '.' negro(1)  'd' gris oscuro(2)  'l' gris claro(3)  'm' musgo(4)
const INK = { '.': 1, d: 2, l: 3, m: 4 };

const TILES = {
  cave_bg: [
    '................',
    '................',
    '.......d........',
    '................',
    '................',
    '................',
    '..d.............',
    '................',
    '................',
    '............d...',
    '................',
    '................',
    '................',
    '....d...........',
    '................',
    '................',
  ],
  cave_rock: [
    'llllllllllllllll',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    '................',
    'lllllll.llllllll',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    '................',
  ],
  cave_rock_b: [
    'lllllll.llllllll',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    '................',
    'llllllllllllllll',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    '................',
  ],
  cave_rock_crack: [
    'llllllllllllllll',
    'ddddd.dddddddddd',
    'dddd.ddddddddddd',
    'ddddd.dddddddddd',
    'dddddd.ddddddddd',
    'ddddd.dddddddddd',
    'dddddd.ddddddddd',
    '................',
    'lllllll.llllllll',
    'ddddddd.dddddddd',
    'ddddddd.dddd.ddd',
    'ddddddd.ddd.dddd',
    'ddddddd.dddd.ddd',
    'ddddddd.ddddd.dd',
    'ddddddd.dddddddd',
    '................',
  ],
  cave_floor: [
    'llllllllllllllll',
    'llllllllllllllll',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    '................',
    'lllllll.llllllll',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    '................',
  ],
  cave_ceiling: [
    'llllllllllllllll',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    '................',
    'lllllll.llllllll',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    'dddddddddddddddd',
    'dddddddddddddddd',
    '.dd...d....dd...',
    '..d........d....',
  ],
  cave_moss: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.......m........',
    '......mmm.......',
    '.....mmmmm......',
    '......m.m.......',
    '....m..m..m.....',
    '...mm.mmm.mm....',
    '..mmmmmmmmmmm...',
    '.mmmmmmmmmmmmm..',
  ],
  cave_ore: [
    'llllllllllllllll',
    'ddddddddmddddddd',
    'dddddddmdddddddd',
    'ddddddmmdddddddd',
    'dddddddmdddddddd',
    'ddddddddmddddddd',
    'dddddddddmdddddd',
    '................',
    'lllllll.llllllll',
    'ddddddd.dddddddd',
    'ddddddd.dmdddddd',
    'ddddddd.ddmddddd',
    'ddddddd.dmdddddd',
    'ddddddd.dddddddd',
    'ddddddd.dddddddd',
    '................',
  ],
};

const TILE_ORDER = Object.keys(TILES);
for (const [name, rows] of Object.entries(TILES)) {
  if (rows.length !== 16) throw new Error(`tile ${name}: ${rows.length} filas, esperaba 16`);
  rows.forEach((row, y) => {
    if (row.length !== 16) throw new Error(`tile ${name} fila ${y}: ${row.length} chars, esperaba 16`);
    for (const ch of row) if (!(ch in INK)) throw new Error(`tile ${name} fila ${y}: char '${ch}' desconocido`);
  });
}
if (TILE_ORDER.length > 8) throw new Error('mas de 8 tiles: no caben lit+dark en una fila de atlas de 256px');

// Solid cells (collisionFlags 16, como el resto del proyecto).
const SOLID = new Set(['cave_rock', 'cave_rock_b', 'cave_rock_crack', 'cave_floor', 'cave_ceiling', 'cave_ore']);

// Atlas: fila 0 = variante iluminada (indices 1-4), fila 1 = apagada (+8).
const ATLAS_W = 256;
const ATLAS_H = 32;
const atlasPixels = Array.from({ length: ATLAS_H }, () => new Array(ATLAS_W).fill(0));
const atlasEntries = [];
const entryIdOf = {};

TILE_ORDER.forEach((name, i) => {
  for (const [variant, rowY, shift] of [['lit', 0, 0], ['dark', 16, 8]]) {
    const sx = i * 16;
    const sy = rowY;
    TILES[name].forEach((row, y) => {
      for (let x = 0; x < 16; x++) atlasPixels[sy + y][sx + x] = INK[row[x]] + shift;
    });
    const id = `atlas_mina_${name}_${variant}`;
    const entry = { id, name: `${name}_${variant}`, sx, sy, w: 16, h: 16 };
    if (SOLID.has(name)) entry.collisionFlags = 16;
    atlasEntries.push(entry);
    entryIdOf[`${name}:${variant}`] = { id, index: atlasEntries.length - 1 };
  }
});

// --- Room layouts --------------------------------------------------------
const COLS = 16;
const ROWS = 12;
const LAYOUT_KEY = {
  C: 'cave_ceiling',
  R: 'cave_rock',
  r: 'cave_rock_b',
  K: 'cave_rock_crack',
  F: 'cave_floor',
  B: 'cave_bg',
  M: 'cave_moss',
  O: 'cave_ore',
};

// Sala 1: mitad izquierda iluminada, mitad derecha apagada. La costura de la
// columna 8 es exactamente el borde que dibujara el halo.
const ROOM1 = [
  'CCCCCCCCCCCCCCCC',
  'RBBBBBBBBBBBBBBR',
  'RBBBBBBBBBBBBBBR',
  'RBBBBBBBBBBBBBBR',
  'RBBBBBBBBBBBBBBR',
  'RBBBBBBBBBBBBBBR',
  'RBBRRRBBBBRRRBBR',
  'RBBBBBBBBBBBBBBR',
  'RBBBBBBBBBBBBBBR',
  'RMBBBBBBBBBBBBMR',
  'FFFFFOFFFFOFFFFF',
  'RRrRKRRrRRKRrRRr',
];

// Sala 2: todo apagado. Sirve para juzgar si la oscuridad total es navegable y
// si el musgo fosforescente (indice 12) marca el camino de verdad.
const ROOM2 = [
  'CCCCCCCCCCCCCCCC',
  'RBBBBBBBBBBBBBBR',
  'RBBBBBBBBBBBBBBR',
  'RBBBBBBBBBBBBBBR',
  'RBBBBBBRRBBBBBBR',
  'RBBBBBBBBBBBBBBR',
  'RBBBBBBBBBBBBBBR',
  'RBBBRRBBBBRRBBBR',
  'RBBBBBBBBBBBBBBR',
  'RMBBMBBBBBBMBBMR',
  'FFFFFFFFFFFFFFFF',
  'RRrRRRRrRRRRrRRr',
];

for (const [name, layout] of [['room1', ROOM1], ['room2', ROOM2]]) {
  if (layout.length !== ROWS) throw new Error(`${name}: ${layout.length} filas, esperaba ${ROWS}`);
  layout.forEach((row, y) => {
    if (row.length !== COLS) throw new Error(`${name} fila ${y}: ${row.length} cols, esperaba ${COLS}`);
    for (const ch of row) if (!(ch in LAYOUT_KEY)) throw new Error(`${name} fila ${y}: char '${ch}' desconocido`);
  });
}

/** variantFor(x,y) -> 'lit' | 'dark' */
function buildRoomData(id, name, layout, variantFor) {
  const tileGrid = [];
  const collision = [];
  const commands = [];
  for (let y = 0; y < ROWS; y++) {
    const gridRow = [];
    const colRow = [];
    for (let x = 0; x < COLS; x++) {
      const tileName = LAYOUT_KEY[layout[y][x]];
      const { id: entryId, index } = entryIdOf[`${tileName}:${variantFor(x, y)}`];
      gridRow.push(index + 1); // tileGrid es 1-based; 0 = celda vacia
      colRow.push(SOLID.has(tileName) ? 16 : 0);
      commands.push({ id: `tile_${x}_${y}`, op: 'copy', atlasEntryId: entryId, dx: x * 16, dy: y * 16, w: 16, h: 16 });
    }
    tileGrid.push(gridRow);
    collision.push(colRow);
  }
  const zeros = () => Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  return {
    id,
    name,
    target: 'MSX2',
    vdpMode: 'SCREEN4_BITMAP_ROOM',
    width: 256,
    height: 192,
    palette: PALETTE.map(s => ({ ...s })),
    backgroundColor: 1,
    atlas: {
      width: ATLAS_W,
      height: ATLAS_H,
      offscreenBaseY: 512,
      pixels: atlasPixels.map(row => row.slice()),
      entries: atlasEntries.map(e => ({ ...e })),
    },
    composition: { source: 'authored', commands },
    collision,
    effects: zeros(),
    behavior: zeros(),
    entities: [],
    playerEntries: [
      { id: 'default', x: 32, y: 128, facing: 'right', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
      { id: 'from_left', x: 24, y: 128, facing: 'right', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
      { id: 'from_right', x: 216, y: 128, facing: 'left', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
    ],
    runtime: {
      screenKind: 'playable',
      screenEngine: 'player',
      activeAreaX: 0,
      activeAreaY: 0,
      activeAreaWidth: 16,
      activeAreaHeight: 12,
      movementMode: 'platform',
      movementModel: 'platform',
      requiredCollectibles: 0,
      initialAir: 255,
      hudStyle: 'statusBars',
      playerEnergyMax: 64,
      playerEnergyInitial: 64,
      notes: 'Mina: prueba de paleta emparejada 8x2 para el halo de luz.',
      lighting: 'lamp',
    },
    tileGrid,
    autoTerrains: [],
  };
}

// Con el runtime del halo las salas se autoran SOLO con la variante iluminada:
// el `LMMV OR #8` de bitmap_light_paint_full es quien las apaga al entrar.
// --static las vuelve a pintar a mano (mitad/mitad) como referencia estatica.
const STATIC = args.includes('--static');
const room1 = buildRoomData('bitmap_room_mina_luz', 'caverna_luz', ROOM1, x => (STATIC && x >= 8 ? 'dark' : 'lit'));
const room2 = buildRoomData('bitmap_room_mina_oscura', 'caverna_oscura', ROOM2, () => (STATIC ? 'dark' : 'lit'));
if (STATIC) { room1.runtime.lighting = 'off'; room2.runtime.lighting = 'off'; }

// --- Assemble the project ------------------------------------------------
const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

// Keep the HUD the source project already uses, if present.
const hudAsset = source.assets.find(a => a.type === 'msx2hud');
if (hudAsset) {
  room1.runtime.hudAssetId = hudAsset.id;
  room2.runtime.hudAssetId = hudAsset.id;
}

// Assets dropped: the old world (a ROM compiles one world) and the assets that
// point at its rooms, which would dangle.
const DROP_TYPES = new Set([
  'msx2bitmaproom', 'worldmap', 'msx2boss', 'msx2bosspath', 'msx2dialogue',
  'msx2bitmaptile', 'msx2bitmapstamp', 'msx2bitmapterrain', 'msx2presentation',
]);
const kept = source.assets.filter(a => !DROP_TYPES.has(a.type));

const paletteAsset = {
  id: 'palette_screen5_mina',
  name: 'mina_luz_8x2',
  type: 'palette',
  data: {
    mode: 'SCREEN5',
    slots: PALETTE.map(s => ({ ...s })),
    source: 'manual',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    notes: 'Paleta emparejada: 0-7 iluminado, 8-15 el gemelo apagado. Apagar = LMMV OR #8, encender = LMMV AND #7. El slot 12 es fosforescente a proposito.',
    name: 'mina_luz_8x2',
  },
};

const worldAsset = {
  id: 'worldmap_mina',
  name: 'Mina',
  type: 'worldmap',
  data: {
    id: 'worldmap_mina',
    name: 'Mina',
    nodes: [
      { id: 'wmnode_mina_luz', screenAssetId: room1.id, name: room1.name, position: { x: 240, y: 0 } },
      { id: 'wmnode_mina_oscura', screenAssetId: room2.id, name: room2.name, position: { x: 480, y: 0 } },
    ],
    connections: [
      { id: 'wmconn_mina_1', fromNodeId: 'wmnode_mina_luz', toNodeId: 'wmnode_mina_oscura', fromDirection: 'east', toDirection: 'west' },
    ],
    startScreenNodeId: 'wmnode_mina_luz',
    gridSize: 20,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },
    paletteAssetId: paletteAsset.id,
  },
};

// Sprites resolve each pixel's hex against their OWN palette and that slot index
// is then used against the world palette (paletteSlotForSpriteColor in
// msx2Screen4Generator.ts). Left alone, the player's green sits at index 13 of
// the old palette and would come out painted in slot 13 of this one, i.e. its
// own dimmed twin. Re-point every sprite at the mina palette and snap its pixels
// to the lit half (slots 1-7); dimming them later is just +8.
const LIT_SLOTS = PALETTE.filter(s => s.slotIndex >= 1 && s.slotIndex <= 7);
const channels = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const nearestLitHex = hex => {
  const [r, g, b] = channels(hex);
  let best = LIT_SLOTS[0];
  let bestDistance = Infinity;
  for (const s of LIT_SLOTS) {
    const [sr, sg, sb] = channels(s.hex);
    const d = (r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2;
    if (d < bestDistance) { bestDistance = d; best = s; }
  }
  return best.hex;
};
const spriteRemap = new Map();
const snapColors = node => {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const v = node[i];
      if (typeof v === 'string' && v.startsWith('#')) {
        const to = nearestLitHex(v);
        if (!spriteRemap.has(v)) spriteRemap.set(v, to);
        node[i] = to;
      } else snapColors(v);
    }
  } else if (node && typeof node === 'object') {
    Object.values(node).forEach(snapColors);
  }
};
const spriteAssets = kept.filter(a => a.type === 'msx2sprite');
for (const asset of spriteAssets) {
  snapColors(asset.data.frames);
  asset.data.palette = PALETTE.map(s => ({ ...s }));
}

// The source GameFlow points its WorldLink at the old world and opens with a
// Screen5Presentation whose asset we dropped. Rewire it to Start -> Music ->
// WorldLink(mina) -> End so the ROM boots straight into the cave.
const gameflow = kept.find(a => a.type === 'msx2gameflow');
if (gameflow) {
  const g = gameflow.data;
  const keepTypes = new Set(['Start', 'Music', 'WorldLink', 'End']);
  g.nodes = g.nodes.filter(n => keepTypes.has(n.type));
  const idOf = type => (g.nodes.find(n => n.type === type) || {}).id;
  const worldLink = g.nodes.find(n => n.type === 'WorldLink');
  if (!worldLink) throw new Error('GameFlow sin nodo WorldLink');
  worldLink.worldAssetId = worldAsset.id;
  const chain = ['Start', 'Music', 'WorldLink', 'End'].map(idOf).filter(Boolean);
  g.connections = chain.slice(0, -1).map((from, i) => ({
    id: `gfc_mina_${i}`,
    from: { nodeId: from },
    to: { nodeId: chain[i + 1] },
  }));
}

const project = {
  ...source,
  currentProjectName: 'mina',
  selectedAssetId: room1.id,
  currentEditor: 'Msx2BitmapRoom',
  assets: [
    { id: room1.id, name: room1.name, type: 'msx2bitmaproom', data: room1 },
    { id: room2.id, name: room2.name, type: 'msx2bitmaproom', data: room2 },
    worldAsset,
    paletteAsset,
    ...kept,
  ],
};
delete project.presentationScreen;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(project, null, 2) + '\n', 'utf8');

const mb = (fs.statSync(OUT).size / 1048576).toFixed(2);
console.log(`OK  ${OUT}  (${mb} MB)`);
console.log(`    tiles: ${TILE_ORDER.length} x2 variantes = ${atlasEntries.length} entries, atlas ${ATLAS_W}x${ATLAS_H}`);
console.log(`    salas: ${room1.name} (mitad/mitad), ${room2.name} (todo apagado)`);
console.log(`    assets conservados: ${kept.length}  |  descartados: ${source.assets.length - kept.length}`);
console.log(`    gemelos apagados: ${DARKER ? 'oscuridad de mina' : 'penumbra (--penumbra)'}`);
console.log(`    sprites remapeados: ${spriteAssets.length} assets`);
for (const [from, to] of spriteRemap) console.log(`      ${from} -> ${to}${from === to ? '  (exacto)' : ''}`);

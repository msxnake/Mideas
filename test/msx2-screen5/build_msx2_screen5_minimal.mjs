import * as esbuild from 'esbuild';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const outDir = resolve(repoRoot, 'server/temp/msx2-screen5-minimal');
const asmPath = resolve(outDir, 'msx2_screen5_minimal.asm');
const romPath = resolve(outDir, 'msx2_screen5_minimal.rom');
const fixturePath = resolve(outDir, 'msx2_screen5_minimal.fixture.json');
const glassPath = resolve(repoRoot, 'server/glass.jar');

const tilePalette = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 2, masterIndex: 56, hex: '#00FFFF' },
  { slotIndex: 3, masterIndex: 448, hex: '#FF0000' },
  { slotIndex: 4, masterIndex: 63, hex: '#00FFFF' },
  { slotIndex: 5, masterIndex: 504, hex: '#FFFF00' },
  { slotIndex: 6, masterIndex: 511, hex: '#FFFFFF' },
  { slotIndex: 7, masterIndex: 292, hex: '#929292' },
  { slotIndex: 8, masterIndex: 73, hex: '#249249' },
  { slotIndex: 9, masterIndex: 146, hex: '#499249' },
  { slotIndex: 10, masterIndex: 219, hex: '#6D6D6D' },
  { slotIndex: 11, masterIndex: 365, hex: '#B66DB6' },
  { slotIndex: 12, masterIndex: 438, hex: '#DBB6DB' },
  { slotIndex: 13, masterIndex: 18, hex: '#004949' },
  { slotIndex: 14, masterIndex: 36, hex: '#009200' },
  { slotIndex: 15, masterIndex: 255, hex: '#6DFFFF' },
];

function makeTile(id, name, fn) {
  return {
    id,
    name,
    width: 8,
    height: 8,
    screen5Palette: tilePalette,
    data: Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => fn(x, y))
    ),
    logicalProperties: {
      mapId: 0,
      familyId: 0,
      instanceId: 0,
      isSolid: false,
      isBreakable: false,
      isMovable: false,
      causesDamage: false,
      isInteractiveSwitch: false,
      isInteractable: false,
      interactionType: 'none',
      interactionValue: 1,
      interactionTarget: '',
    },
  };
}

const tiles = [
  makeTile('tile_black', 'Black', () => '#000000'),
  makeTile('tile_cyan_grid', 'Cyan Grid', (x, y) => (x === y || x === 7 - y ? '#FFFFFF' : '#00FFFF')),
  makeTile('tile_red_block', 'Red Block', (x, y) => ((x + y) % 2 === 0 ? '#FF0000' : '#FFFF00')),
  makeTile('tile_green_stripe', 'Green Stripe', (x) => (x < 4 ? '#009200' : '#249249')),
];

const background = Array.from({ length: 27 }, (_, y) =>
  Array.from({ length: 32 }, (_, x) => {
    if (x === 0 || y === 0 || x === 31 || y === 26) return { tileId: 'tile_red_block' };
    if ((x + y) % 7 === 0) return { tileId: 'tile_cyan_grid' };
    if (y > 17 && x > 4 && x < 27) return { tileId: 'tile_green_stripe' };
    return { tileId: 'tile_black' };
  })
);

const screen = {
  id: 'screen_msx2_minimal',
  name: 'MSX2 Minimal',
  width: 32,
  height: 27,
  screenKind: 'cutscene',
  screenEngine: 'fakePlayer',
  layers: {
    background,
    collision: [],
    effects: [],
    entities: [],
  },
  backgroundColor: 1,
  borderColor: 1,
};

const gameFlow = {
  id: 'gf_msx2_minimal',
  name: 'MSX2 Minimal Flow',
  startNodeId: 'gf_start',
  panOffset: { x: 0, y: 0 },
  zoomLevel: 1,
  nodes: [
    { id: 'gf_start', type: 'Start', position: { x: 80, y: 120 } },
    {
      id: 'gf_screen_a',
      type: 'Text',
      title: 'Screen A',
      message: '',
      position: { x: 260, y: 120 },
      appearance: {
        backgroundScreenAssetId: 'asset_screen_msx2_minimal',
        colors: { text: '#FFFFFF', background: '#000000', promptText: '#FFFFFF' },
      },
    },
    { id: 'gf_cls', type: 'Transition', effect: 'cls', duration: 100, position: { x: 460, y: 120 } },
    {
      id: 'gf_screen_b',
      type: 'Text',
      title: 'Screen B',
      message: '',
      position: { x: 660, y: 120 },
      appearance: {
        backgroundScreenAssetId: 'asset_screen_msx2_minimal',
        colors: { text: '#FFFFFF', background: '#000000', promptText: '#FFFFFF' },
      },
    },
    { id: 'gf_end', type: 'End', endType: 'Victory', message: 'END', position: { x: 860, y: 120 } },
  ],
  connections: [
    { id: 'c_start_a', from: { nodeId: 'gf_start' }, to: { nodeId: 'gf_screen_a' } },
    { id: 'c_a_cls', from: { nodeId: 'gf_screen_a' }, to: { nodeId: 'gf_cls' } },
    { id: 'c_cls_b', from: { nodeId: 'gf_cls' }, to: { nodeId: 'gf_screen_b' } },
    { id: 'c_b_end', from: { nodeId: 'gf_screen_b' }, to: { nodeId: 'gf_end' } },
  ],
};

const assets = [
  ...tiles.map(tile => ({ id: `asset_${tile.id}`, name: tile.name, type: 'tile', data: tile })),
  {
    id: 'palette_msx2_minimal',
    name: 'MSX2 Minimal Palette',
    type: 'palette',
    data: { mode: 'SCREEN5', slots: tilePalette, notes: 'Minimal SCREEN 5 smoke palette.' },
  },
  { id: 'asset_screen_msx2_minimal', name: screen.name, type: 'screenmap', data: screen },
  { id: 'asset_gf_msx2_minimal', name: gameFlow.name, type: 'gameflow', data: gameFlow },
];

mkdirSync(outDir, { recursive: true });
writeFileSync(fixturePath, JSON.stringify({ currentScreenMode: 'SCREEN 5 (Graphics III)', assets }, null, 2));

const bundle = await esbuild.build({
  entryPoints: [resolve(repoRoot, 'utils/msxGenerator/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
});

const generator = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const files = generator.generateModularASM('MSX2_Screen5_Minimal', assets, {
  generateUnified: true,
  screenMode: 'SCREEN 5 (Graphics III)',
  targetGraphicsBackend: 'msx2-screen5-bitmap',
  romMode: 'simple32k',
  targetFormat: 'konami',
});

writeFileSync(asmPath, files['unitedFiles.asm']);
if (!files['unitedFiles.asm'].includes('MSX2 minimal GameFlow')) {
  throw new Error('MSX2 minimal GameFlow marker missing');
}
if (!files['unitedFiles.asm'].includes('call clear_screen5_bitmap')) {
  throw new Error('MSX2 cls transition was not emitted');
}
if (!files['unitedFiles.asm'].includes('call wait_key')) {
  throw new Error('MSX2 Text wait was not emitted');
}
execFileSync('java', ['-jar', glassPath, asmPath, romPath], { stdio: 'inherit' });

console.log(JSON.stringify({
  fixture: fixturePath,
  asm: asmPath,
  rom: romPath,
}, null, 2));

import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

async function loadGenerator() {
  const bundle = await esbuild.build({
    entryPoints: [path.join(root, 'utils/msxGenerator/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
  });
  const encoded = Buffer.from(bundle.outputFiles[0].text).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

const fixture = JSON.parse(read('test/msx2-bitmap-intro/bitmap_intro_test.json'));
const assets = structuredClone(fixture.assets);
const flowAsset = assets.find(asset => asset.type === 'msx2gameflow' && asset.data?.purpose === 'screen4-bitmap-runtime');
const worldLink = flowAsset?.data?.nodes?.find(node => node.type === 'WorldLink');
const worldAsset = assets.find(asset => asset.id === worldLink?.worldAssetId && asset.type === 'worldmap');
const startWorldNode = worldAsset?.data?.nodes?.find(node => node.id === worldAsset.data.startScreenNodeId)
  || worldAsset?.data?.nodes?.[0];
const roomAsset = assets.find(asset => asset.id === startWorldNode?.screenAssetId && asset.type === 'msx2bitmaproom');

if (!flowAsset || !worldLink || !worldAsset || !roomAsset) {
  throw new Error('The SCREEN 5 fixture is missing its GameFlow -> WorldLink -> world -> start room chain.');
}

const firstAtlasEntryId = roomAsset.data?.atlas?.entries?.[0]?.id || '';
roomAsset.data.entities = [
  ...(roomAsset.data.entities || []),
  {
    id: 'world_exit_contract_entity',
    name: 'Contract Exit Door',
    kind: 'door',
    position: { x: 2, y: 2 },
    components: {
      msx2_transform: { tileX: 2, tileY: 2 },
      msx2_world_exit: { enabled: true, atlasEntryId: firstAtlasEntryId, offsetX: 1, offsetY: 2, hitboxW: 14, hitboxH: 28 },
      msx2_collision: { solid: false },
    },
    params: {
      runtime: 'MSX2',
      engine: 'worldExit',
      worldExit: { enabled: true, atlasEntryId: firstAtlasEntryId, offsetX: 1, offsetY: 2, hitboxW: 14, hitboxH: 28 },
    },
  },
];

const generator = await loadGenerator();
const originalLog = console.log;
let files;
try {
  console.log = () => {};
  files = generator.generateModularASM('MSX2_Bitmap_World_Exit_Contract', assets, {
    generateUnified: true,
    screenMode: fixture.currentScreenMode || 'SCREEN 5 (Graphics III)',
    targetGraphicsBackend: 'msx2-screen4-bitmap-room',
    romMode: 'megarom',
    targetFormat: 'konami',
    executionMode: 'gameLoop',
    interruptDrivenComponents: false,
  });
} finally {
  console.log = originalLog;
}

const unified = files['unitedFiles.asm'] || files['unifiedFiles.asm'] || '';
const catalog = read('components/msx2_screen4_editor/msx2EntityCatalog.ts');
const profile = read('utils/msx2ProjectProfiles.ts');
const editor = read('components/editors/Msx2BitmapScreenEditor.tsx');
const screen5Generator = read('utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts');

const checks = [
  ['SCREEN 5 preset is in the MSX2 repertoire', catalog.includes("id: 'world_exit'") && catalog.includes("label: 'MSX2 Exit World'")],
  ['bitmap profile exposes the preset', profile.includes("'world_exit'") && profile.includes("'worldExit'") && profile.includes("'msx2_world_exit'")],
  ['bitmap editor exposes Exit World controls', editor.includes('Exit World (GameFlow)') && editor.includes('selectedWorldExitConfig')],
  ['generator recognizes the entity engine', screen5Generator.includes("engine === 'worldexit'") && screen5Generator.includes('msx2_world_exit')],
  ['generated ASM checks Exit World AABBs', unified.includes('bitmap_check_world_exits:') && unified.includes('Contract Exit Door" AABB [33,34]..[47,62]')],
  ['generated main loop calls the trigger', unified.includes('call bitmap_check_world_exits')],
  ['collision arms the semantic GameFlow exit flag', unified.includes('ld (bitmap_gameflow_exit_flag), a')],
  ['gameplay loop checks the flag every frame', unified.includes('jp bitmap_enter_game_loop') && unified.includes('ld a, (bitmap_gameflow_exit_flag)')],
  ['WorldLink continues through its default connection', unified.includes('call bitmap_enter_game_loop') && unified.includes('bitmap_gf_node_')],
  ['End screen preserves its message pointer before the VDP clear', unified.includes('draw_bitmap_end_screen:') && unified.includes('push hl') && unified.includes('call bitmap_end_launch_cmd') && unified.includes('pop hl')],
  ['End node enters a terminal sink instead of gameplay', unified.includes('jp bitmap_gameflow_terminal_loop') && unified.includes('bitmap_gameflow_terminal_loop:')],
];

let failures = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'}: ${label}`);
  if (!ok) failures += 1;
}
if (failures) process.exit(1);

const outputPath = path.join(root, 'server/temp/msx2_bitmap_world_exit_contract.asm');
fs.writeFileSync(outputPath, unified, 'utf8');
console.log(`Generated: ${outputPath}`);
console.log(`All ${checks.length} MSX2 SCREEN 5 Exit World contract checks passed.`);

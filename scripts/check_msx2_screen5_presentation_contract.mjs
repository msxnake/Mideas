#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const read = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8');
const readJson = (...parts) => JSON.parse(read(...parts));

const types = read('types.ts');
const constants = read('constants.ts');
const editor = read('components', 'editors', 'Msx2Screen5PresentationEditor.tsx');
const utils = read('components', 'utils', 'msx2Screen5PresentationUtils.ts');
const handlers = read('handlers', 'useAssetHandlers.tsx');
const appUi = read('components', 'AppUI.tsx');
const toolbar = read('components', 'layout', 'Toolbar.tsx');
const fileExplorer = read('components', 'tools', 'FileExplorerPanel.tsx');
const projectTarget = read('utils', 'projectTarget.ts');
const generatorIndex = read('utils', 'msxGenerator', 'index.ts');
const presentationGenerator = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5PresentationGenerator.ts');
const smokeScript = read('scripts', 'build_msx2_screen5_presentation_smoke.py');

const fixturePath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'presentation_screen5_project.json');
const bitmapPath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'presentation_screen5_bitmap.bin');
const asmPath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'presentation_screen5_test.asm');
const fixture = readJson('test', 'msx2-screen5-presentation', 'presentation_screen5_project.json');
const bitmap = readFileSync(bitmapPath);
const asm = readFileSync(asmPath, 'utf8');

const allowedHeights = new Set([192, 212]);
const allowedFitModes = new Set(['cover', 'contain', 'stretch']);
const allowedRomDataGroups = new Set(['auto', 'default', 'page0']);
const hexColor = /^#[0-9A-Fa-f]{6}$/;

const checks = [];

function check(name, passed, detail = '') {
  checks.push([name, Boolean(passed), detail]);
}

function isByte(value) {
  return Number.isInteger(value) && value >= 0 && value <= 255;
}

function validatePresentationAsset(asset) {
  check('fixture contains an msx2presentation asset', asset?.type === 'msx2presentation');
  if (!asset || asset.type !== 'msx2presentation') return;

  const data = asset.data || {};
  const expectedVisibleBytes = (data.width * data.height) / 2;
  const expectedVramBytes = (data.width * (data.displayHeight || data.height)) / 2;

  check('asset data targets MSX2 SCREEN 5', data.target === 'MSX2' && data.screenMode === 'SCREEN 5');
  check('asset data uses fixed SCREEN 5 width', data.width === 256);
  check('asset data height is an accepted presentation height', allowedHeights.has(data.height));
  check('asset fit mode is supported', allowedFitModes.has(data.fitMode));
  check('asset source image dimensions are preserved', data.sourceImageWidth > 0 && data.sourceImageHeight > 0);
  check('asset palette has exactly 16 slots', Array.isArray(data.palette) && data.palette.length === 16);

  if (Array.isArray(data.palette)) {
    const slotIndexes = data.palette.map(slot => slot.slotIndex);
    const masterIndexes = data.palette.map(slot => slot.masterIndex);
    check('asset palette slot indexes are 0..15 in order', slotIndexes.every((slot, index) => slot === index));
    check('asset palette master indexes fit RGB333 range', masterIndexes.every(index => Number.isInteger(index) && index >= 0 && index <= 511));
    check('asset palette colors are serialized as hex RGB', data.palette.every(slot => hexColor.test(slot.hex)));
    check('asset palette slot 0 is black background', data.palette[0]?.slotIndex === 0 && data.palette[0]?.hex === '#000000');
  }

  check('asset packed bitmap is 4bpp, two pixels per byte', Array.isArray(data.packedBitmap) && data.packedBitmap.length === expectedVisibleBytes);
  check('asset packed bitmap values are bytes', Array.isArray(data.packedBitmap) && data.packedBitmap.every(isByte));
  check('asset compression contract is ZX0 chunked', data.compression?.codec === 'ZX0' && data.compression?.enabled === true && data.compression?.chunkLines === 32);
  check(
    'asset runtime has current or standalone wait key flag',
    data.runtime?.waitForKey === true || data.runtime?.waitForInput === true
  );

  if (data.runtime?.vramPage !== undefined) {
    check('asset runtime vram page is valid when present', data.runtime.vramPage === 0 || data.runtime.vramPage === 1);
  }
  if (data.runtime?.romDataGroup !== undefined) {
    check('asset runtime ROM data group is valid when present', allowedRomDataGroups.has(data.runtime.romDataGroup));
  }

  check('fixture records visible image byte count', data.visibleImageBytes === expectedVisibleBytes);
  check('fixture records VRAM bitmap byte count', data.vramBitmapBytes === expectedVramBytes);
  check('sidecar bitmap byte length matches visible packed bitmap', bitmap.length === expectedVisibleBytes);
  check(
    'sidecar bitmap bytes match fixture packed bitmap',
    Array.isArray(data.packedBitmap) &&
      data.packedBitmap.length === bitmap.length &&
      data.packedBitmap.every((value, index) => value === bitmap[index])
  );
}

const presentationAssets = (fixture.assets || []).filter(asset => asset.type === 'msx2presentation');
check('fixture project has exactly one msx2presentation asset', presentationAssets.length === 1);
check('fixture selects the SCREEN 5 presentation backend', fixture.targetGraphicsBackend === 'msx2-screen5-presentation' && fixture.screenMode === 'SCREEN 5 (Graphics III)');
validatePresentationAsset(presentationAssets[0]);

check('types expose the MSX2 SCREEN 5 presentation config', types.includes('export interface Msx2Screen5PresentationConfig') && types.includes("target: 'MSX2'") && types.includes("screenMode: 'SCREEN 5'"));
check('types constrain SCREEN 5 presentation geometry and import modes', types.includes('export type Msx2Screen5PresentationHeight = 192 | 212') && types.includes("export type Msx2Screen5PresentationFitMode = 'cover' | 'contain' | 'stretch'") && types.includes('width: 256;'));
check('types constrain SCREEN 5 presentation compression and runtime', types.includes("codec: 'ZX0'") && types.includes('vramPage: 0 | 1') && types.includes("romDataGroup: 'auto' | 'default' | 'page0'"));

check('default config is a disabled MSX2 SCREEN 5 presentation asset', constants.includes('DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG') && constants.includes('enabled: false') && constants.includes("target: 'MSX2'") && constants.includes("screenMode: 'SCREEN 5'"));
check('default config uses 256x192 pixels and empty packed bitmap', constants.includes('width: 256') && constants.includes('height: 192') && constants.includes('Array.from({ length: 192 }, () => Array.from({ length: 256 }, () => 0))') && constants.includes('packedBitmap: []'));
check('default config keeps ZX0 chunk and runtime defaults', constants.includes("codec: 'ZX0'") && constants.includes('chunkLines: 32') && constants.includes('waitForKey: true') && constants.includes("romDataGroup: 'auto'"));

check('utility exposes fixed SCREEN 5 presentation geometry', utils.includes('SCREEN5_PRESENTATION_WIDTH = 256') && utils.includes('SCREEN5_PRESENTATION_HEIGHTS = [192, 212]') && utils.includes('SCREEN5_PRESENTATION_CHUNK_LINES = 32'));
check('utility packs two 4-bit pixels per byte', utils.includes('((left & 0x0f) << 4) | (right & 0x0f)') && utils.includes('packed.push'));
check('utility unpacks current packedBitmap data', utils.includes('unpackScreen5PresentationPixels') && utils.includes('packedBitmap.length < (SCREEN5_PRESENTATION_WIDTH * height) / 2'));
check('utility stats report raw bytes and chunk count', utils.includes('getScreen5PresentationStats') && utils.includes('rawBytes: (SCREEN5_PRESENTATION_WIDTH * height) / 2') && utils.includes('chunks: Math.ceil(height / SCREEN5_PRESENTATION_CHUNK_LINES)'));

check('editor normalizes flat and legacy nested presentation data', editor.includes('flat.packedBitmap ?? data?.packedBitmap ?? data?.packedPixels') && editor.includes('normalizeScreen5PresentationPixels(flat.pixels ?? data?.pixels, height)'));
check('editor emits current flat data plus legacy-compatible nested data', editor.includes('onUpdate(normalized)') && editor.includes('data: {') && editor.includes('packedPixels: next.packedBitmap') && editor.includes('packedBitmap: next.packedBitmap'));
check('asset creation uses the shared default config', handlers.includes("case 'msx2presentation'") && handlers.includes('DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG') && handlers.includes('EditorType.Msx2Presentation'));
check('AppUI routes msx2presentation to its editor', appUi.includes('EditorType.Msx2Presentation') && appUi.includes("activeAsset?.type === 'msx2presentation'") && appUi.includes('<Msx2Screen5PresentationEditor'));
check('toolbar exposes the SCREEN 5 presentation asset type', toolbar.includes("onNewAsset('msx2presentation')") && toolbar.includes('MSX2 SCREEN 5 Presentation'));
check('file explorer groups msx2presentation assets', fileExplorer.includes('msx2presentation: "MSX2 SCREEN 5 Presentations"') && fileExplorer.includes('msx2presentation: EditorType.Msx2Presentation'));
check('MSX2 project target allows msx2presentation assets', projectTarget.includes("'msx2presentation'"));
check('generator exposes the SCREEN 5 presentation backend', generatorIndex.includes("'msx2-screen5-presentation'") && generatorIndex.includes('generateMsx2Screen5PresentationFiles'));
check('generator auto-selects presentation backend for SCREEN 5 assets', generatorIndex.includes("asset?.type === 'msx2presentation'") && generatorIndex.includes("return 'msx2-screen5-presentation'"));
check('presentation generator emits SCREEN 5 palette and bitmap chunk labels', presentationGenerator.includes('screen5_presentation_palette_data') && presentationGenerator.includes('SCREEN5_PRESENTATION_BITMAP_CHUNK_${index}'));
check('presentation generator switches to SCREEN 5 mode', presentationGenerator.includes('ld a, 5') && presentationGenerator.includes('call CHGMOD'));
check('presentation generator does not switch back to SCREEN 4', !/\bld\s+a,\s*4\b/i.test(presentationGenerator) && !presentationGenerator.includes('call INIGRP'));
check('presentation generator uploads full 256x212 VRAM bitmap', presentationGenerator.includes('VISIBLE_HEIGHT = 212') && presentationGenerator.includes('SCREEN5_PRESENTATION_BITMAP_SIZE EQU ${BITMAP_BYTE_COUNT}'));
check('presentation generator maps ROM page 2 before LDIRVM', presentationGenerator.includes('map_page2_to_cart_primary') && presentationGenerator.includes('call map_page2_to_cart_primary'));

check('real smoke asserts SCREEN 5 mode and forbids SCREEN 4 fallback', smokeScript.includes('assert_screen5_mode_contract') && smokeScript.includes('must not switch to SCREEN 4'));
check('real smoke asserts generated SCREEN5 labels', smokeScript.includes('assert_screen5_generated_labels'));
check('real smoke asserts ROM output is 8KB aligned', smokeScript.includes('size % 8192 != 0'));

check('standalone ASM smoke exists beside the fixture', existsSync(asmPath));
check('standalone ASM switches to SCREEN 5 before loading bitmap', asm.includes('ld a, 5') && asm.includes('call CHGMOD') && asm.includes('ld hl, screen5_bitmap_data'));
check('standalone ASM loads the full SCREEN 5 bitmap from #0000', asm.includes('ld de, #0000') && asm.includes('ld bc, SCREEN5_BITMAP_SIZE') && asm.includes('call LDIRVM'));
check('standalone ASM waits for a key after enabling screen', asm.includes('call ENASCR') && asm.includes('.wait_key:') && asm.includes('call CHGET'));

const failures = checks.filter(([, passed]) => !passed);

for (const [name, passed, detail] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}${detail ? ` (${detail})` : ''}`);
}

if (failures.length) {
  console.error(`\nMSX2 SCREEN 5 presentation contract failed: ${failures.length} check(s).`);
  process.exit(1);
}

console.log('\nMSX2 SCREEN 5 presentation contract passed.');

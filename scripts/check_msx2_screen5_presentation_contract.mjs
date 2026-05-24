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
const codeExportModal = read('components', 'modals', 'CodeExportModal.tsx');
const projectHandlers = read('handlers', 'useProjectHandlers.tsx');
const summaryExtractor = read('utils', 'summaryExtractor.ts');
const createSummary = read('create_summary.js');
const smokeScript = read('scripts', 'build_msx2_screen5_presentation_smoke.py');
const pngImportScript = read('scripts', 'create_msx2_screen5_presentation_from_png.py');
const pngImportDoc = read('docs', 'project', 'MSX2_SCREEN5_PRESENTATION_PNG_IMPORT.md');
const requirements = read('requirements.txt');
const buildScript = read('scripts', 'build_mideas_unified_rom.py');
const serverJs = read('server', 'server.js');
const packageJson = readJson('package.json');

const fixturePath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'presentation_screen5_project.json');
const bitmapPath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'presentation_screen5_bitmap.bin');
const asmPath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'presentation_screen5_test.asm');
const fixture = readJson('test', 'msx2-screen5-presentation', 'presentation_screen5_project.json');
const bitmap = readFileSync(bitmapPath);
const asm = readFileSync(asmPath, 'utf8');
const fromPngFixturePath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'from_png', 'presentacion_naves_galaxian_rtype_screen5_project.json');
const fromPngBitmapPath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'from_png', 'presentacion_naves_galaxian_rtype_screen5_bitmap.bin');
const fromPngPreviewPath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'from_png', 'presentacion_naves_galaxian_rtype_screen5_preview.png');
const fromPngZx0AsmPath = join(repoRoot, 'test', 'msx2-screen5-presentation', 'from_png', 'presentacion_naves_galaxian_rtype_screen5_compressed.asm');
const fromPngFixture = existsSync(fromPngFixturePath) ? JSON.parse(readFileSync(fromPngFixturePath, 'utf8')) : null;
const fromPngBitmap = existsSync(fromPngBitmapPath) ? readFileSync(fromPngBitmapPath) : null;
const fromPngPreview = existsSync(fromPngPreviewPath) ? readFileSync(fromPngPreviewPath) : null;
const fromPngZx0Asm = existsSync(fromPngZx0AsmPath) ? readFileSync(fromPngZx0AsmPath, 'utf8') : '';

const allowedHeights = new Set([192, 212]);
const allowedFitModes = new Set(['cover', 'contain', 'stretch']);
const allowedPaletteModes = new Set(['auto', 'default']);
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
  check('asset palette mode is supported when present', data.paletteMode === undefined || allowedPaletteModes.has(data.paletteMode));
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

function readPngDimensions(buffer) {
  if (!buffer || buffer.length < 24) return null;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((value, index) => buffer[index] === value)) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function validateFromPngFixture() {
  check('from_png fixture exists', Boolean(fromPngFixture));
  if (!fromPngFixture) return;

  const assets = (fromPngFixture.assets || []).filter(asset => asset.type === 'msx2presentation');
  const asset = assets[0];
  const data = asset?.data || {};
  const expectedBytes = 256 * 192 / 2;
  const uniquePacked = new Set(Array.isArray(data.packedBitmap) ? data.packedBitmap : []);
  const nonZeroBytes = Array.isArray(data.packedBitmap) ? data.packedBitmap.filter(value => value !== 0).length : 0;
  const previewDimensions = readPngDimensions(fromPngPreview);

  check('from_png fixture has exactly one msx2presentation asset', assets.length === 1);
  check('from_png fixture selects the SCREEN 5 presentation backend', fromPngFixture.targetGraphicsBackend === 'msx2-screen5-presentation' && fromPngFixture.screenMode === 'SCREEN 5 (Graphics III)');
  check('from_png asset records real PNG import metadata', data.sourceFileName?.endsWith('.png') && data.sourceImageWidth === 1672 && data.sourceImageHeight === 941 && data.width === 256 && data.height === 192 && data.fitMode === 'cover');
  check('from_png fixture keeps auto palette mode', data.paletteMode === undefined || data.paletteMode === 'auto');
  check('from_png fixture keeps characteristic auto palette slots', data.palette?.[1]?.hex === '#000024' && data.palette?.[6]?.hex === '#926DB6' && data.palette?.[8]?.hex === '#FFFFFF');
  check('from_png asset keeps black background in slot 0', data.backgroundSlot === 0 && data.backgroundHex === '#000000' && data.palette?.[0]?.slotIndex === 0 && data.palette?.[0]?.masterIndex === 0 && data.palette?.[0]?.hex === '#000000');
  check('from_png packed bitmap is visible SCREEN 5 size', Array.isArray(data.packedBitmap) && data.packedBitmap.length === expectedBytes);
  check('from_png sidecar bitmap matches packed bitmap', Boolean(fromPngBitmap) && fromPngBitmap.length === expectedBytes && Array.isArray(data.packedBitmap) && data.packedBitmap.every((value, index) => value === fromPngBitmap[index]));
  check('from_png packed bitmap has real image variety', uniquePacked.size > 16 && nonZeroBytes > 1000);
  check('from_png preview PNG is real 256x192 output', previewDimensions?.width === 256 && previewDimensions?.height === 192 && fromPngPreview.length > 1024);
  check('from_png ZX0 artifact exists and decompresses chunks', fromPngZx0Asm.includes('SCREEN5_PRESENTATION_COMPRESSION: ZX0') && fromPngZx0Asm.includes('SCREEN5_PRESENTATION_CHUNK_LINES: 32') && fromPngZx0Asm.includes('call dzx0_standard') && fromPngZx0Asm.includes('SCREEN5_PRESENTATION_ZX0_BUFFER') && fromPngZx0Asm.includes('@mideas:screen5-presentation-chunk'));
}

const presentationAssets = (fixture.assets || []).filter(asset => asset.type === 'msx2presentation');
check('fixture project has exactly one msx2presentation asset', presentationAssets.length === 1);
check('fixture selects the SCREEN 5 presentation backend', fixture.targetGraphicsBackend === 'msx2-screen5-presentation' && fixture.screenMode === 'SCREEN 5 (Graphics III)');
validatePresentationAsset(presentationAssets[0]);
validateFromPngFixture();

check('types expose the MSX2 SCREEN 5 presentation config', types.includes('export interface Msx2Screen5PresentationConfig') && types.includes("target: 'MSX2'") && types.includes("screenMode: 'SCREEN 5'"));
check('types constrain SCREEN 5 presentation geometry and import modes', types.includes('export type Msx2Screen5PresentationHeight = 192 | 212') && types.includes("export type Msx2Screen5PresentationFitMode = 'cover' | 'contain' | 'stretch'") && types.includes('width: 256;'));
check('types constrain SCREEN 5 presentation compression and runtime', types.includes("codec: 'ZX0'") && types.includes('vramPage: 0 | 1') && types.includes("romDataGroup: 'auto' | 'default' | 'page0'"));
check('types expose serialized SCREEN 5 presentation import metadata', types.includes('backgroundSlot?: 0') && types.includes("backgroundHex?: '#000000'") && types.includes('visibleImageBytes?: number') && types.includes('vramBitmapBytes?: number') && types.includes('packedPixels?: number[]'));

check('default config is a disabled MSX2 SCREEN 5 presentation asset', constants.includes('DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG') && constants.includes('enabled: false') && constants.includes("target: 'MSX2'") && constants.includes("screenMode: 'SCREEN 5'"));
check('default config uses 256x192 pixels and empty packed bitmap', constants.includes('width: 256') && constants.includes('height: 192') && constants.includes('Array.from({ length: 192 }, () => Array.from({ length: 256 }, () => 0))') && constants.includes('packedBitmap: []'));
check('default config keeps ZX0 chunk and runtime defaults', constants.includes("codec: 'ZX0'") && constants.includes('chunkLines: 32') && constants.includes('waitForKey: true') && constants.includes("romDataGroup: 'auto'"));

check('utility exposes fixed SCREEN 5 presentation geometry', utils.includes('SCREEN5_PRESENTATION_WIDTH = 256') && utils.includes('SCREEN5_PRESENTATION_HEIGHTS = [192, 212]') && utils.includes('SCREEN5_PRESENTATION_CHUNK_LINES = 32'));
check('utility defaults missing SCREEN 5 presentation height to 192', utils.includes('isScreen5Height(height) ? height : 192'));
check('utility packs two 4-bit pixels per byte', utils.includes('((left & 0x0f) << 4) | (right & 0x0f)') && utils.includes('packed.push'));
check('utility unpacks current packedBitmap data', utils.includes('unpackScreen5PresentationPixels') && utils.includes('packedBitmap.length < (SCREEN5_PRESENTATION_WIDTH * height) / 2'));
check('utility stats report raw bytes and chunk count', utils.includes('getScreen5PresentationStats') && utils.includes('rawBytes: (SCREEN5_PRESENTATION_WIDTH * height) / 2') && utils.includes('chunks: Math.ceil(height / SCREEN5_PRESENTATION_CHUNK_LINES)'));
check('PNG import CLI exists and builds SCREEN 5 presentation projects', pngImportScript.includes('Create an MSX2 SCREEN 5 presentation project from a PNG') && pngImportScript.includes('--source-png') && pngImportScript.includes('--output-prefix') && pngImportScript.includes('--timestamp-ms') && pngImportScript.includes('targetGraphicsBackend') && pngImportScript.includes('msx2-screen5-presentation') && pngImportScript.includes('backgroundHex') && pngImportScript.includes('#000000'));
check('PNG import CLI exposes auto and default palette modes', pngImportScript.includes('--palette-mode') && pngImportScript.includes('choices=["auto", "default"]') && pngImportScript.includes('default="auto"') && pngImportScript.includes('build_default_palette()') && pngImportScript.includes('paletteMode'));
check('PNG import CLI validates OpenMSX captures when requested', pngImportScript.includes('assert_openmsx_capture') && pngImportScript.includes('unique_colors') && pngImportScript.includes('non_black'));
check('Python requirements pin Pillow for PNG import reproducibility', requirements.includes('Pillow==11.3.0'));
check('package exposes PNG import CLI script', packageJson.scripts?.['create:msx2-screen5-presentation'] === 'python scripts/create_msx2_screen5_presentation_from_png.py');
check('package exposes deterministic PNG presentation smoke', packageJson.scripts?.['smoke:msx2-screen5-presentation-png']?.includes('create_msx2_screen5_presentation_from_png.py') && packageJson.scripts?.['smoke:msx2-screen5-presentation-png']?.includes('--timestamp-ms 1779625323134') && packageJson.scripts?.['smoke:msx2-screen5-presentation-png']?.includes('--build-rom'));
check('static MSX2 smoke includes PNG presentation import', packageJson.scripts?.['smoke:msx2-static']?.includes('smoke:msx2-screen5-presentation-png'));
check('PNG import documentation covers command and contracts', pngImportDoc.includes('MSX2 SCREEN 5 Presentation PNG Import') && pngImportDoc.includes('npm run create:msx2-screen5-presentation') && pngImportDoc.includes('pip install -r requirements.txt') && pngImportDoc.includes('targetGraphicsBackend') && pngImportDoc.includes('ZX0'));

check('editor normalizes flat and legacy nested presentation data', editor.includes('flat.packedBitmap ?? data?.packedBitmap ?? data?.packedPixels') && editor.includes('normalizeScreen5PresentationPixels(flat.pixels ?? data?.pixels, height)'));
check('editor emits current flat data plus legacy-compatible nested data', editor.includes('onUpdate(normalized)') && editor.includes('data: {') && editor.includes('packedPixels: next.packedBitmap') && editor.includes('packedBitmap: next.packedBitmap'));
check('asset creation uses the shared default config', handlers.includes("case 'msx2presentation'") && handlers.includes('DEFAULT_MSX2_SCREEN5_PRESENTATION_CONFIG') && handlers.includes('EditorType.Msx2Presentation'));
check('AppUI routes msx2presentation to its editor', appUi.includes('EditorType.Msx2Presentation') && appUi.includes("activeAsset?.type === 'msx2presentation'") && appUi.includes('<Msx2Screen5PresentationEditor'));
check('toolbar exposes the SCREEN 5 presentation asset type', toolbar.includes("onNewAsset('msx2presentation')") && toolbar.includes('MSX2 SCREEN 5 Presentation'));
check('file explorer groups msx2presentation assets', fileExplorer.includes('msx2presentation: "MSX2 SCREEN 5 Presentations"') && fileExplorer.includes('msx2presentation: EditorType.Msx2Presentation'));
check('MSX2 project target allows msx2presentation assets', projectTarget.includes("'msx2presentation'"));
check('generator exposes the SCREEN 5 presentation backend', generatorIndex.includes("'msx2-screen5-presentation'") && generatorIndex.includes('generateMsx2Screen5PresentationFiles'));
check('generator auto-selects presentation backend for SCREEN 5 assets', generatorIndex.includes("asset?.type === 'msx2presentation'") && generatorIndex.includes("return 'msx2-screen5-presentation'"));
check('code export preserves SCREEN 5 presentation backend', codeExportModal.includes('hasMsx2PresentationAsset') && codeExportModal.includes("hasScreen5Presentation ? LEGACY_SCREEN5_MODE") && codeExportModal.includes("? 'msx2-screen5-presentation'"));
check('code export routes SCREEN 5 presentation screen export through mapper bundle', codeExportModal.includes("case 'screens'") && codeExportModal.includes('if (hasScreen5Presentation)') && codeExportModal.includes('const screen5Bundle = await generateMapperReadyBundle'));
check('project load restores screenMode when currentScreenMode is absent', projectHandlers.includes('projectData.currentScreenMode || projectData.screenMode || DEFAULT_SCREEN_MODE'));
check('project load normalizes flat and legacy nested msx2presentation assets', projectHandlers.includes("asset.type === 'msx2presentation'") && projectHandlers.includes('normalizeMsx2Presentation(asset)') && projectHandlers.includes('unpackScreen5PresentationPixels(sourcePacked, height)') && projectHandlers.includes('packedPixels: packedBitmap'));
check('summary extractor carries msx2presentation assets', summaryExtractor.includes('msx2Presentations: any[]') && summaryExtractor.includes('extractMsx2Presentations(assets, usedAssets)') && summaryExtractor.includes("asset.type === 'msx2presentation'"));
check('legacy summary extractor carries msx2presentation assets', createSummary.includes('msx2Presentations: []') && createSummary.includes("asset.type === 'msx2presentation'") && createSummary.includes('usedAssets.msx2Presentations.push'));
check('CLI JSON export preserves SCREEN 5 presentation backend', buildScript.includes('hasMsx2Presentation') && buildScript.includes('? "msx2-screen5-presentation"') && buildScript.includes('targetGraphicsBackend: raw.targetGraphicsBackend || defaultGraphicsBackend'));
check('CLI build runs ZX0 preprocessing before compile by default', buildScript.includes('maybe_run_zx0_preprocess(') && buildScript.includes('enabled=not args.skip_zx0_preprocess') && buildScript.includes('asm_output=zx0_asm') && buildScript.includes('asm_output=asm_to_compile'));
check('CLI smoke inspects the post-ZX0 ASM emitted by build_mideas_unified_rom.py', smokeScript.includes('assert_screen5_zx0_contract') && smokeScript.includes('_compressed.asm'));
check('CLI smoke accepts custom fixtures and output paths', smokeScript.includes('--fixture') && smokeScript.includes('--out-dir') && smokeScript.includes('--project-name') && smokeScript.includes('--screenshot-output'));
check('CLI smoke validates fixture and OpenMSX screenshot content', smokeScript.includes('assert_fixture_contract(fixture)') && smokeScript.includes('assert_openmsx_capture(screenshot_output)') && smokeScript.includes('unique_colors') && smokeScript.includes('non_black'));
check('presentation generator emits SCREEN 5 palette and bitmap chunk labels', presentationGenerator.includes('screen5_presentation_palette_data') && presentationGenerator.includes('SCREEN5_PRESENTATION_BITMAP_CHUNK_${index}'));
check('presentation generator switches to SCREEN 5 mode', presentationGenerator.includes('ld a, 5') && presentationGenerator.includes('call CHGMOD'));
check('presentation generator does not switch back to SCREEN 4', !/\bld\s+a,\s*4\b/i.test(presentationGenerator) && !presentationGenerator.includes('call INIGRP'));
check('presentation generator uploads full 256x212 VRAM bitmap', presentationGenerator.includes('VISIBLE_HEIGHT = 212') && presentationGenerator.includes('SCREEN5_PRESENTATION_BITMAP_SIZE EQU ${BITMAP_BYTE_COUNT}'));
check('presentation generator maps ROM page 2 before LDIRVM', presentationGenerator.includes('map_page2_to_cart_primary') && presentationGenerator.includes('call map_page2_to_cart_primary'));
check('ZX0 preprocessor discovers SCREEN 5 presentation chunks', serverJs.includes('hasScreen5PresentationBitmapData') && serverJs.includes('SCREEN5_PRESENTATION_BITMAP_CHUNK_\\d+'));
check('ZX0 preprocessor treats SCREEN 5 presentation chunks as compression candidates', serverJs.includes('screen5PresentationBitmapBlocks') && serverJs.includes('...screen5PresentationBitmapBlocks') && serverJs.includes("await processBlocks(allTilePatternBlocks, 'tile_pattern'"));
check('ZX0 preprocessor rewrites compressed SCREEN 5 presentation chunk loads', serverJs.includes('hlScreen5PresentationChunkMatch') && serverJs.includes('Decompress ZX0 SCREEN 5 presentation chunk into RAM buffer') && serverJs.includes('ld de, SCREEN5_PRESENTATION_ZX0_BUFFER') && serverJs.includes('ld hl, SCREEN5_PRESENTATION_ZX0_BUFFER'));

check('real smoke asserts SCREEN 5 mode and forbids SCREEN 4 fallback', smokeScript.includes('assert_screen5_mode_contract') && smokeScript.includes('must not switch to SCREEN 4'));
check('real smoke asserts generated SCREEN5 labels', smokeScript.includes('assert_screen5_generated_labels'));
check('real smoke asserts ZX0-compressed SCREEN 5 presentation chunks', smokeScript.includes('ZX0 compressed tile_pattern') && smokeScript.includes('call dzx0_standard'));
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

// Fase 3 dual-chip check: generate the MegaROM ASM for Downloads/test141.json
// AS-IS (its only song "la_nova" is PSG+SCC; before Fase 3 the ROM was mute).
// Usage: node test/scc/build_test141_dual.cjs
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '..', '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_full', 'utils', 'msxGenerator', 'index.js'));

const projectPath = path.join(os.homedir(), 'Downloads', 'test141.json');
const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

const files = generator.generateModularASM('test141_dual', project.assets, {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
  screenMode: project.currentScreenMode || 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-bitmap-room',
});
const asm = files['unitedFiles.asm'] || files['main.asm'] || '';
if (!asm) throw new Error('no unified ASM. files=' + Object.keys(files).join(','));

const outDir = path.join(ROOT, 'test', 'scc', 'out');
fs.mkdirSync(outDir, { recursive: true });
const asmPath = path.join(outDir, 'test141_dual.asm');
fs.writeFileSync(asmPath, asm);
console.log('asm written:', asmPath, `${(asm.length / 1024).toFixed(0)}KB`);

for (const marker of ['scc_music_update', 'psg_music_update', 'music_psg_ptr_table', 'psg_track_0_la_nova_data']) {
  if (!asm.includes(marker)) throw new Error(`marker missing in ASM: ${marker}`);
}
console.log('dual music runtime markers present');

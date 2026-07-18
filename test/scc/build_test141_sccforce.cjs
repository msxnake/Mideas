// A/B experiment: same test141 project but with the dual song excluded
// (soundChip patched to a value the collector ignores) -> no music block,
// same as pre-Fase 3 output. If THIS also hangs in node_3 under C-BIOS,
// the hang is unrelated to the dual music work.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ROOT = path.resolve(__dirname, '..', '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_full', 'utils', 'msxGenerator', 'index.js'));
const project = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Downloads', 'test141.json'), 'utf8'));
for (const a of project.assets) {
  if (a.type === 'track') a.data.soundChip = "SCC";
}
const files = generator.generateModularASM('test141_sccforce', project.assets, {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
  screenMode: project.currentScreenMode || 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-bitmap-room',
});
const asm = files['unitedFiles.asm'];
if (!asm.includes("scc_music_update")) throw new Error("scc music missing"); if (asm.includes("psg_music_update")) throw new Error("psg should be absent");
fs.writeFileSync(path.join(ROOT, 'test', 'scc', 'out', 'test141_sccforce.asm'), asm);
console.log('nomusic asm written, no music block confirmed');

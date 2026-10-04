#!/usr/bin/env node
/**
 * Measures how much room a SCREEN 5 bitmap-room project leaves in its Konami
 * MegaROM: the 32 KB resident window (#4000-#BFFF = banks 0-3) and the data banks.
 * Used to size new features (e.g. the Intro node) BEFORE writing them.
 *
 *   node scripts/measure_bitmap_rom_budget.mjs <project.json> [--reuse-build] [--top N] [--keep out.rom]
 *
 * Read-only: the project file is never modified. Free space is counted as the
 * trailing #FF bytes of the resident area / of each bank, which is exactly what
 * glass leaves behind (`ds #C000 - $, #FF` and bank padding).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TS_BUILD_DIR = path.join(ROOT, 'server', 'temp', 'tsbuild_budget');
const BANK = 0x2000;

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const valueOf = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const project = args.find(a => !a.startsWith('--') && a !== valueOf('--top') && a !== valueOf('--keep') && a !== valueOf('--asm') && a !== valueOf('--sym'));
if (!project) { console.error('usage: measure_bitmap_rom_budget.mjs <project.json> [--reuse-build] [--top N] [--keep out.rom]'); process.exit(2); }
const topN = Number(valueOf('--top') || 12);

function build() {
  const compiled = path.join(TS_BUILD_DIR, 'utils', 'msxGenerator', 'index.js');
  if (flag('--reuse-build') && fs.existsSync(compiled)) return compiled;
  console.error('Compiling the generator with tsc...');
  fs.rmSync(TS_BUILD_DIR, { recursive: true, force: true });
  fs.mkdirSync(TS_BUILD_DIR, { recursive: true });
  try {
    execFileSync(process.execPath, [
      path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020', '--outDir', TS_BUILD_DIR,
      '--moduleResolution', 'node', '--skipLibCheck', '--noEmitOnError', 'false', 'utils/msxGenerator/index.ts',
    ], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
  } catch (error) {
    // Unrelated type errors in a dirty tree still emit; only a missing output is fatal.
    if (!fs.existsSync(compiled)) throw new Error(`tsc produced no output:\n${error.stdout || error.message}`);
    console.error('tsc reported errors but emitted output (tree is dirty); measuring anyway.');
  }
  fs.writeFileSync(path.join(TS_BUILD_DIR, 'package.json'), '{"type":"commonjs"}');
  return compiled;
}

const compiledIndex = build();
const { createRequire } = await import('node:module');
const generator = createRequire(import.meta.url)(compiledIndex);

console.error(`Reading ${project} ...`);
const raw = JSON.parse(fs.readFileSync(project, 'utf8'));
const assets = Array.isArray(raw.assets) ? raw.assets : [];
const config = {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
  autoMegaROM: true,
  screenMode: raw.screenMode || raw.currentScreenMode || 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: raw.targetGraphicsBackend || undefined,
};
const realLog = console.log;
const realWarn = console.warn;
console.log = () => {};
console.warn = () => {};
let files;
try {
  files = generator.generateModularASM(raw.name || path.basename(project, '.json'), assets, config);
} finally {
  console.log = realLog;
  console.warn = realWarn;
}
const asm = files['unitedFiles.asm'] || files['main.asm'];
if (!asm) throw new Error(`no unified ASM. Files: ${Object.keys(files).join(', ')}`);

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_budget_'));
const asmPath = path.join(work, 'p.asm');
const romPath = path.join(work, 'p.rom');
const symPath = path.join(work, 'p.sym');
fs.writeFileSync(asmPath, asm);
let glassFailed = null;
try {
  execFileSync('java', ['-jar', path.join(ROOT, 'server', 'glass.jar'), '-I', path.join(ROOT, 'server'), asmPath, romPath, symPath],
    { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
} catch (error) {
  glassFailed = `${error.stdout || ''}${error.stderr || ''}`.trim().split('\n').slice(0, 6).join('\n');
}
if (glassFailed) {
  console.log(`\nGLASS FAILED (${project}):\n${glassFailed}`);
  console.log('A "Negative initial size" error means the resident window overflowed by that many bytes.');
  process.exit(1);
}

const rom = fs.readFileSync(romPath);
const trailingFF = (buf, from, to) => { let n = 0; for (let i = to - 1; i >= from && buf[i] === 0xff; i--) n++; return n; };
const syms = new Map();
for (const line of fs.readFileSync(symPath, 'utf8').split('\n')) {
  const m = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
  if (m) syms.set(m[1], parseInt(m[2], 16));
}

const residentBytes = 4 * BANK;
const residentFree = trailingFF(rom, 0, residentBytes);
console.log(`\nProject: ${path.basename(project)}  (${assets.length} assets, ${(asm.length / 1024).toFixed(0)} KB of ASM)`);
console.log(`ROM: ${rom.length} bytes = ${rom.length / BANK} banks of 8 KB`);
console.log(`\nRESIDENT WINDOW #4000-#BFFF (banks 0-3): ${residentBytes - residentFree} used, ${residentFree} FREE of ${residentBytes}`);

// Data banks: allocated banks are packed front to back, so the free tail of the
// last non-empty bank is the real headroom; earlier banks may still have slack.
console.log('\nDATA BANKS (free = trailing #FF):');
let totalFree = 0;
for (let bank = 4; bank < rom.length / BANK; bank++) {
  const free = trailingFF(rom, bank * BANK, (bank + 1) * BANK);
  totalFree += free;
  console.log(`  bank ${String(bank).padStart(3)}  used ${String(BANK - free).padStart(5)}  free ${String(free).padStart(5)}`);
}
console.log(`  total slack across data banks: ${totalFree} bytes; mapper reaches banks up to 255 (2 MB) on Konami SCC`);

// Where does the resident window go? Size of each label span between neighbours.
const resident = [...syms.entries()].filter(([, a]) => a >= 0x4000 && a < 0xc000).sort((a, b) => a[1] - b[1]);
const spans = [];
for (let i = 0; i < resident.length - 1; i++) {
  const size = resident[i + 1][1] - resident[i][1];
  if (size > 0) spans.push([resident[i][0], resident[i][1], size]);
}
spans.sort((a, b) => b[2] - a[2]);
console.log(`\nLARGEST RESIDENT SPANS (label to next label, top ${topN}):`);
for (const [name, addr, size] of spans.slice(0, topN)) console.log(`  ${String(size).padStart(6)}  #${addr.toString(16).toUpperCase()}  ${name}`);

const interesting = ['bitmap_flow_font', 'bitmap_room_render_ptr_table_p0', 'bitmap_room_blockcount_table', 'bitmap_gameflow_terminal_loop', 'music_update', 'copy_to_vram_ext'];
console.log('\nKEY SYMBOLS (must stay < #8000 when a data bank is mapped):');
for (const name of interesting) {
  const a = [...syms.entries()].find(([k]) => k === name)?.[1];
  console.log(`  ${name.padEnd(36)} ${a === undefined ? '(absent)' : '#' + a.toString(16).toUpperCase() + (a >= 0x8000 && a < 0xa000 ? '  (#8000-#9FFF: may be a data-bank label; data banks reuse those addresses)' : '')}`);
}
const flowSyms = [...syms.keys()].filter(k => k.startsWith('bitmap_flow_')).length;
console.log(`\nGameFlow text engine present: ${flowSyms > 0 ? `yes (${flowSyms} bitmap_flow_* labels)` : 'no (project has no Text/Menu nodes)'}`);

if (valueOf('--keep')) fs.copyFileSync(romPath, valueOf('--keep'));
if (valueOf('--asm')) fs.copyFileSync(asmPath, valueOf('--asm'));
if (valueOf('--sym')) fs.copyFileSync(symPath, valueOf('--sym'));
fs.rmSync(work, { recursive: true, force: true });

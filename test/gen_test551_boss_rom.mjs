#!/usr/bin/env node
/**
 * Build the test551 boss ROM headlessly and decode what the runtime will read.
 *
 * The boss bug ("only the first 16x16 cell shows, and the background is never
 * repaired") is not reproducible from a small fixture: it needs the real
 * project, whose start node is redirected to the boss room by
 * test/make_test551_boss_fixture.mjs.
 *
 * Prints the decoded cell blob so the DATA side can be ruled in or out before
 * anyone reads a line of Z80, and the symbol addresses the OpenMSX probe needs
 * (they move on every code change, so hardcoding them is how a probe silently
 * starts measuring the wrong instruction).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const workDir = join(tmpdir(), 'mideas-test551');
const FIXTURE = join(workDir, process.env.TEST551_FIXTURE || 'test551_boss_fixture.json');
const asmPath = join(workDir, 'test551_boss_claude.asm');
const romPath = join(workDir, 'test551_boss_claude.rom');
const symPath = join(workDir, 'test551_boss_claude.sym');

if (!existsSync(FIXTURE)) {
  console.error(`missing fixture ${FIXTURE}`);
  console.error('run: node test/make_test551_boss_fixture.mjs');
  process.exit(1);
}

const bundle = join(workDir, 'gen_claude.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundle,
  logLevel: 'silent',
});
const generator = await import(pathToFileURL(bundle).href);

const project = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const realLog = console.log;
const realWarn = console.warn;
const warnings = [];
console.log = () => {};
console.warn = (...args) => warnings.push(args.join(' '));
let asm;
try {
  const files = generator.generateModularASM(project.name || 'test551', project.assets, {
    generateUnified: true,
    romMode: 'megarom',
    targetFormat: 'konami',
    screenMode: project.currentScreenMode || 'SCREEN 4 (Graphics II)',
    targetGraphicsBackend: project.targetGraphicsBackend || undefined,
  });
  asm = files['unitedFiles.asm'] || files['main.asm'];
} finally {
  console.log = realLog;
  console.warn = realWarn;
}
writeFileSync(asmPath, asm);
realLog(`asm  ${asmPath} (${asm.length} bytes)`);
for (const text of warnings.filter(w => /boss/i.test(w))) realLog(`WARN ${text}`);

// ---- decode every non-empty cell blob -------------------------------------
const blobRe = /bitmap_boss_cells_room_(\d+):\s*\n\s*db ([^\n]+)/g;
let match;
while ((match = blobRe.exec(asm)) !== null) {
  const bytes = match[2].split(',').map(t => parseInt(t.trim().replace('#', ''), 16));
  if (bytes.length < 10 || bytes[0] === 0) continue;
  const [frames, perFrame] = bytes;
  const stride = bytes[2] | (bytes[3] << 8);
  const records = [];
  for (let i = 4; i + 5 < bytes.length; i += 6) {
    records.push({
      sx: bytes[i] | (bytes[i + 1] << 8),
      sy: bytes[i + 2] | (bytes[i + 3] << 8),
      dx: bytes[i + 4],
      dy: bytes[i + 5],
    });
  }
  const maxDx = Math.max(...records.map(r => r.dx));
  const maxDy = Math.max(...records.map(r => r.dy));
  const slots = new Set(records.map(r => `${r.sx},${r.sy}`)).size;
  realLog(
    `room ${match[1]}: frames=${frames} perFrame=${perFrame} stride=${stride} `
    + `records=${records.length} body=${maxDx + 16}x${maxDy + 16}px slots=${slots} `
    + `sy=[${Math.min(...records.map(r => r.sy))}..${Math.max(...records.map(r => r.sy))}] `
    + `${records.length === frames * perFrame && stride === perFrame * 6 ? 'HEADER-OK' : 'HEADER-MISMATCH'}`,
  );
}

// ---- assemble --------------------------------------------------------------
try {
  execFileSync(
    'java',
    ['-jar', join(repoRoot, 'server', 'glass.jar'), '-I', join(repoRoot, 'server'), asmPath, romPath, symPath],
    { cwd: repoRoot, stdio: 'pipe' },
  );
} catch (error) {
  console.error('glass.jar FAILED');
  console.error(String(error.stdout || '') + String(error.stderr || ''));
  process.exit(1);
}
realLog(`rom  ${romPath}`);

// ---- symbols the probe must break on --------------------------------------
const symbols = readFileSync(symPath, 'utf8');
const addressOf = name => {
  const m = new RegExp(`^${name}: equ ([0-9A-F]+)H`, 'mi').exec(symbols);
  return m ? parseInt(m[1], 16) : -1;
};
const wanted = [
  'bitmap_boss_draw_cell_list',
  'bitmap_boss_draw_cells',
  'bitmap_boss_launch_cmd',
  'bitmap_boss_restore_strips',
  'bitmap_boss_draw_animated',
  'bitmap_boss_pick_cell_list',
  'boss_cmd_buf',
  'boss_x',
  'boss_y',
  'boss_active',
  'boss_cells_shown',
  'boss_anim_frame',
  'current_screen_index',
];
realLog('--- probe symbols ---');
for (const name of wanted) {
  const at = addressOf(name);
  realLog(`${name} = ${at < 0 ? 'MISSING' : '0x' + at.toString(16).toUpperCase()}`);
}

import { readFileSync } from 'node:fs';
import { analyzeProject } from './utils/asmTemplateGenerator';
import { generateMsx2Screen5BitmapRoomFiles } from './utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator';

const file = process.argv[2];
const project = JSON.parse(readFileSync(file, 'utf8'));
const warns: string[] = [];
const logs: string[] = [];
const rw = console.warn, rl = console.log;
console.warn = (...a: any[]) => { warns.push(a.join(' ')); };
console.log = (...a: any[]) => { logs.push(a.join(' ')); };
let asm = '';
let err: any = null;
try {
  const analysis = analyzeProject(project.name || 'x', (project.assets || []) as any);
  const files: any = generateMsx2Screen5BitmapRoomFiles(project.name || 'x', analysis as any, {
    screenMode: 'SCREEN 4 (Graphics II)', romMode: 'megarom', targetFormat: 'konami', autoMegaROM: true,
  } as any);
  asm = Object.values(files || {}).map((v: any) => typeof v === 'string' ? v : (v?.content || '')).join('\n');
} catch (e) { err = e; }
console.warn = rw; console.log = rl;

console.log('=== file:', file);
console.log('=== THROWN:', err ? String(err.message || err) : '(none)');
console.log('=== ALL WARNINGS (' + warns.length + ') ===');
const uniq = [...new Set(warns)];
for (const w of uniq) console.log('  !', w);
console.log('=== generator logs mentioning budget/atlas/vram/resident ===');
for (const l of [...new Set(logs)].filter(l => /atlas|vram|resident|budget|overflow|bank|row/i.test(l))) console.log('  .', l);
// resident layout probes
const eq = (name: string) => { const m = asm.match(new RegExp('^' + name + '\s+EQU\s+([^\s;]+)', 'm')); return m ? m[1] : '(n/a)'; };
for (const n of ['BITMAP_ATLAS_VRAM_BASE_ROW','BITMAP_DIALOGUE_VRAM_BASE_ROW','BITMAP_ATLAS_ROWS','BOSS_SCRATCH_VRAM_ROW'])
  console.log('  EQU', n, '=', eq(n));
console.log('=== asm size:', asm.length, 'chars');

import { readFileSync, writeFileSync } from 'node:fs';
import { analyzeProject } from './utils/asmTemplateGenerator';
import { generateMsx2Screen5BitmapRoomFiles } from './utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator';

const file = process.argv[2];
const out = process.argv[3];
const project = JSON.parse(readFileSync(file, 'utf8'));
const warns: string[] = [];
const rw = console.warn;
console.warn = (...a: any[]) => { warns.push(a.join(' ')); };
const analysis = analyzeProject(project.name || 'x', (project.assets || []) as any);
const files: any = generateMsx2Screen5BitmapRoomFiles(project.name || 'x', analysis as any, {
  screenMode: 'SCREEN 4 (Graphics II)', romMode: 'megarom', targetFormat: 'konami', autoMegaROM: true,
} as any);
console.warn = rw;
writeFileSync(out, files['unitedFiles.asm'], 'utf8');
for (const w of [...new Set(warns)]) console.log('  !', w);
console.log('written', out, files['unitedFiles.asm'].length);

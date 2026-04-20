import * as fs from 'fs';
import * as path from 'path';
import { generateModularASM } from '../utils/msxGenerator/index.js';

const projectPath = 'C:/Users/salam/Downloads/joc7.json';
const outputPath = 'C:/Users/salam/Documents/Programacion/Mideas/temp/joc7_generated_unified.asm';

const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
const result = generateModularASM(
  projectData.name || 'joc7',
  projectData.assets,
  { generateUnified: true }
);

fs.writeFileSync(outputPath, result['unitedFiles.asm'], 'utf-8');
console.log(JSON.stringify({
  projectPath,
  outputPath,
  bytes: result['unitedFiles.asm'].length,
}, null, 2));

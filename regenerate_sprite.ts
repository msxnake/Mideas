/**
 * Regenerate ASM from sprite.json project
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the MSX generator
import { generateModularASM } from './utils/msxGenerator/index.js';

// Read the sprite.json project
const projectPath = path.join(__dirname, 'Examples', 'sprite.json');
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

console.log('📦 Loading project: sprite.json');
console.log('🔧 Generating ASM files...');

// Generate the ASM project with unified file
const result = generateModularASM('sprite', projectData.assets, { generateUnified: true });

// Write the unified source file
const outputPath = path.join(__dirname, 'server', 'temp', 'sprite_regenerated.asm');
fs.writeFileSync(outputPath, result['unitedFiles.asm'], 'utf8');

console.log('✅ Generated:', outputPath);
console.log('📊 Size:', result['unitedFiles.asm'].length, 'bytes');

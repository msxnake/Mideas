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
import { generateMSXProject } from './utils/msxGenerator/index.js';

// Read the sprite.json project
const projectPath = path.join(__dirname, 'Examples', 'sprite.json');
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

console.log('📦 Loading project: sprite.json');
console.log('🔧 Generating ASM files...');

// Generate the ASM project
const result = generateMSXProject(projectData, 'sprite');

// Write the main source file
const outputPath = path.join(__dirname, 'server', 'temp', 'sprite_regenerated.asm');
fs.writeFileSync(outputPath, result.unifiedFile, 'utf8');

console.log('✅ Generated:', outputPath);
console.log('📊 Size:', result.unifiedFile.length, 'bytes');

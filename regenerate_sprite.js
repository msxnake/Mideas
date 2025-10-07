/**
 * Regenerate ASM from sprite.json project
 */
const fs = require('fs');
const path = require('path');

// Import the MSX generator
const { generateMSXProject } = require('./utils/msxGenerator/index.ts');

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

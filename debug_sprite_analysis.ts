/**
 * Debug sprite.json analysis
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { generateModularASM } from './utils/msxGenerator/index.js';
import { analyzeProject } from './utils/asmTemplateGenerator.js';

// Read the sprite.json project
const projectPath = path.join(__dirname, 'Examples', 'sprite.json');
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

console.log('📦 Analyzing sprite.json...');
console.log('📊 Assets count:', projectData.assets?.length);

// Analyze the project
const analysis = analyzeProject('sprite', projectData.assets);

console.log('\n🔍 Analysis results:');
console.log('  hasEntities:', analysis.hasEntities);
console.log('  entities.length:', analysis.entities?.length);
console.log('  entities:', JSON.stringify(analysis.entities, null, 2));

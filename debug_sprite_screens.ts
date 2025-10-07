/**
 * Debug sprite.json screens
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the sprite.json project
const projectPath = path.join(__dirname, 'Examples', 'sprite.json');
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

console.log('📦 Analyzing sprite.json screens...');

const screenAssets = projectData.assets.filter((a: any) => a.type === 'screenmap');
console.log('📊 Screens found:', screenAssets.length);

screenAssets.forEach((screen: any, i: number) => {
  console.log(`\n🖼️  Screen ${i}: ${screen.data.name}`);
  console.log('  Entities:', screen.data.entities?.length || 0);
  if (screen.data.entities) {
    screen.data.entities.forEach((ent: any, j: number) => {
      console.log(`    Entity ${j}:`, ent.name, '@', ent.position);
    });
  }
});

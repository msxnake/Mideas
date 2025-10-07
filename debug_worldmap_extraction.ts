/**
 * Debug worldmap entity extraction
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the sprite.json project
const projectPath = path.join(__dirname, 'Examples', 'sprite.json');
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

console.log('📦 Debugging worldmap entity extraction...\n');

const worldmapAssets = projectData.assets.filter((a: any) => a.type === 'worldmap');
console.log('🗺️  Worldmaps found:', worldmapAssets.length);

const entities: any[] = [];
worldmapAssets.forEach((worldmap: any, i: number) => {
  console.log(`\n  Worldmap ${i}: ${worldmap.name || worldmap.id}`);
  console.log(`    data keys:`, Object.keys(worldmap.data || {}));

  const screens = worldmap.data?.screens || [];
  console.log(`    screens:`, screens.length);

  screens.forEach((screen: any, j: number) => {
    console.log(`\n    Screen ${j}:`, screen.name || 'unnamed');
    console.log(`      entities:`, screen.entities?.length || 0);

    if (screen.entities && Array.isArray(screen.entities)) {
      console.log(`      Found ${screen.entities.length} entities:`);
      screen.entities.forEach((ent: any) => {
        console.log(`        - ${ent.name} (${ent.id})`);
        entities.push(ent);
      });
    }
  });
});

console.log(`\n✅ Total entities extracted: ${entities.length}`);
console.log('Entities:', JSON.stringify(entities, null, 2));

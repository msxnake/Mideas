/**
 * Debug screenmap entity extraction
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the sprite.json project
const projectPath = path.join(__dirname, 'Examples', 'sprite.json');
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

console.log('📦 Debugging screenmap entity extraction...\n');

const screenmapAssets = projectData.assets.filter((a: any) => a.type === 'screenmap');
console.log('🖼️  Screenmaps found:', screenmapAssets.length);

const entities: any[] = [];
screenmapAssets.forEach((screenmap: any, i: number) => {
  console.log(`\n  Screenmap ${i}: ${screenmap.data.name}`);
  console.log(`    data keys:`, Object.keys(screenmap.data || {}));
  console.log(`    layers keys:`, Object.keys(screenmap.data.layers || {}));

  // Check direct entities array
  if (screenmap.data.entities) {
    console.log(`    ✅ Found entities array (${screenmap.data.entities.length} items)`);
    entities.push(...screenmap.data.entities);
  }

  // Check layers.entities
  if (screenmap.data.layers?.entities) {
    console.log(`    ✅ Found layers.entities array (${screenmap.data.layers.entities.length} items)`);
    entities.push(...screenmap.data.layers.entities);
  }
});

console.log(`\n✅ Total entities extracted: ${entities.length}`);
if (entities.length > 0) {
  entities.forEach((ent: any) => {
    console.log(`  - ${ent.name} (${ent.id}) @ (${ent.position.x}, ${ent.position.y})`);
  });
}

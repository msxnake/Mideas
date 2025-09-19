/**
 * Script to generate BasicEnemy project using the real Mideas MSX Modular Generator
 */

const fs = require('fs');
const path = require('path');

// Simple require for the generator (we'll inline the function instead)
const projectPath = path.resolve(__dirname, '../../Examples/BasicEnemy(7).json');

console.log('🚀 Starting BasicEnemy project generation...');
console.log(`📂 Loading project from: ${projectPath}`);

if (!fs.existsSync(projectPath)) {
  throw new Error(`Project file not found: ${projectPath}`);
}

const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
console.log(`✅ Project loaded successfully`);

// Extract assets from the project
const assets = projectData.assets || [];
console.log(`📊 Found ${assets.length} assets in project`);

// Log asset types for debugging
const assetTypes = assets.reduce((acc, asset) => {
  acc[asset.type] = (acc[asset.type] || 0) + 1;
  return acc;
}, {});
console.log(`📈 Asset distribution:`, assetTypes);

// Find sprites and tiles
const sprites = assets.filter(asset => asset.type === 'sprite');
const tiles = assets.filter(asset => asset.type === 'tile');
const screens = assets.filter(asset => asset.type === 'screen');

console.log(`🎨 Found ${sprites.length} sprites, ${tiles.length} tiles, ${screens.length} screens`);

sprites.forEach(sprite => {
  console.log(`  🔸 Sprite: ${sprite.name} (${sprite.id})`);
});

tiles.forEach(tile => {
  console.log(`  🔸 Tile: ${tile.name} (${tile.id})`);
});

// Save the cleaned project data for manual processing
const outputDir = path.resolve(__dirname, '../temp');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a clean project data file
const cleanProject = {
  projectName: 'BasicEnemy',
  sprites: sprites,
  tiles: tiles,
  screens: screens,
  totalAssets: assets.length
};

const cleanProjectPath = path.join(outputDir, 'BasicEnemy_clean.json');
fs.writeFileSync(cleanProjectPath, JSON.stringify(cleanProject, null, 2), 'utf8');
console.log(`💾 Clean project data saved to: ${cleanProjectPath}`);

console.log('🎉 BasicEnemy project analysis completed!');
console.log('📝 Next step: Use TypeScript compilation to generate ASM files');
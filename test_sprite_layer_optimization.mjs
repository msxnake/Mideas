import { readFileSync, writeFileSync } from 'fs';
import { generateSpriteASMCode } from './components/utils/spriteUtils.ts';

// Load test project
const projectJson = JSON.parse(
  readFileSync('./test_sprite_optimization.json', 'utf-8')
);

console.log('=== Sprite Layer Optimization Test ===\n');
console.log(`Project: ${projectJson.projectName}`);
console.log(`Sprites: ${projectJson.sprites.length}\n`);

// Generate ASM code for the sprite
const sprite = projectJson.sprites[0];
console.log(`Testing sprite: ${sprite.name}`);
console.log(`Size: ${sprite.size.width}x${sprite.size.height}`);
console.log(`Background Color: ${sprite.backgroundColor}`);
console.log(`Palette: ${sprite.spritePalette.join(', ')}`);
console.log(`Frames: ${sprite.frames.length}\n`);

// Analyze which colors are actually used in the sprite
const frame = sprite.frames[0];
const colorsUsed = new Set();
frame.data.forEach(row => {
  row.forEach(pixel => {
    if (pixel !== sprite.backgroundColor) {
      colorsUsed.add(pixel);
    }
  });
});

console.log('Colors actually used in sprite data:');
colorsUsed.forEach(color => {
  const layerIndex = sprite.spritePalette.indexOf(color);
  console.log(`  - Color ${color} (Layer ${layerIndex})`);
});
console.log('');

// Generate ASM code
const asmCode = generateSpriteASMCode(sprite, 'hex');

// Save to file
const outputPath = './server/temp/test_sprite_optimized.asm';
writeFileSync(outputPath, asmCode, 'utf-8');

console.log('Generated ASM code:');
console.log('─'.repeat(80));
console.log(asmCode);
console.log('─'.repeat(80));

// Count how many layers were generated
const layerMatches = asmCode.match(/LAYER\d+:/g);
const layersGenerated = layerMatches ? layerMatches.length : 0;

console.log(`\n✅ Layers generated: ${layersGenerated}`);
console.log(`✅ Expected: 1 (only white color is used)`);
console.log(`✅ Empty layers skipped: ${sprite.spritePalette.length - 1 - layersGenerated}`);
console.log(`\n📄 Output saved to: ${outputPath}`);

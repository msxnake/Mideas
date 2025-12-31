import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { generateModularASM } from './utils/msxGenerator/index.ts';

console.log('=== Full MSX Compilation Test ===\n');

// Load test project
const projectPath = './test_sprite_optimization.json';
const projectJson = JSON.parse(readFileSync(projectPath, 'utf-8'));

console.log(`Project: ${projectJson.projectName}`);
console.log(`Sprites: ${projectJson.sprites.length}\n`);

// Convert project to assets array (simplified - just sprites for this test)
const assets = projectJson.sprites.map(sprite => ({
  type: 'sprite',
  id: sprite.id,
  data: sprite
}));

// Generate unified ASM file
console.log('Generating unified ASM file...');
const files = generateModularASM(projectJson.projectName, assets, {
  generateUnified: true,
  targetFormat: 'konami'
});
const asmCode = files['unitedFiles.asm'];

// Save ASM file
const asmPath = './server/temp/test_optimized.asm';
writeFileSync(asmPath, asmCode, 'utf-8');
console.log(`✅ ASM generated: ${asmPath}`);
console.log(`   Lines: ${asmCode.split('\n').length}`);
console.log(`   Size: ${(asmCode.length / 1024).toFixed(2)} KB\n`);

// Check sprite section in ASM
const spriteSection = asmCode.match(/;; Sprite:.*?(?=;; Sprite:|;; ==== ENTITIES ====|$)/gs);
if (spriteSection) {
  console.log('Sprite section analysis:');
  spriteSection.forEach((section, idx) => {
    const layerMatches = section.match(/LAYER\d+:/g);
    const layerCount = layerMatches ? layerMatches.length : 0;
    const spriteName = section.match(/;; Sprite: (\w+)/)?.[1] || `Sprite ${idx}`;
    console.log(`  ${spriteName}: ${layerCount} layer(s) generated`);
  });
  console.log('');
}

// Compile with glass.jar
console.log('Compiling with glass.jar...');
try {
  const glassPath = 'server/glass.jar';
  const romPath = './server/temp/test_optimized.rom';

  const output = execSync(
    `java -jar "${glassPath}" "${asmPath}" "${romPath}"`,
    { encoding: 'utf-8', cwd: process.cwd() }
  );

  console.log('Glass.jar output:');
  console.log(output);

  if (existsSync(romPath)) {
    const romSize = readFileSync(romPath).length;
    console.log(`✅ ROM compiled successfully!`);
    console.log(`   ROM size: ${romSize} bytes (${(romSize / 1024).toFixed(2)} KB)`);
  } else {
    console.log('❌ ROM file not created');
  }
} catch (error) {
  console.error('❌ Compilation error:');
  console.error(error.message);
  if (error.stdout) console.error('STDOUT:', error.stdout);
  if (error.stderr) console.error('STDERR:', error.stderr);
}

/**
 * Test script to verify generator fixes are working
 * Run with: node test_generator_fixes.js
 */

const fs = require('fs');
const path = require('path');

// Import the generator (using dynamic import for ESM)
async function testGenerator() {
  console.log('🔧 Testing MSX Generator Fixes...\n');

  // Load the BasicEnemy project
  const projectPath = path.join(__dirname, 'Examples', 'BasicEnemy(7).json');
  console.log(`📂 Loading project: ${projectPath}`);

  if (!fs.existsSync(projectPath)) {
    console.error('❌ Project file not found!');
    return;
  }

  const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  const assets = projectData.assets || [];

  console.log(`✅ Project loaded: ${assets.length} assets\n`);

  // Import the generator (ESM module)
  const { generateModularASM } = await import('./utils/msxGenerator/index.ts');

  console.log('🚀 Generating ASM files...\n');

  const generatedFiles = generateModularASM('TestFix', assets, {
    projectName: 'TestFix',
    targetMSX: 'MSX1',
    generateUnified: true,
    outputDir: './test_output/'
  });

  console.log(`✅ Generated ${Object.keys(generatedFiles).length} files\n`);

  // Check key fixes in the generated code
  const unifiedASM = generatedFiles['unitedFiles.asm'] || '';

  console.log('🔍 Verification Results:\n');

  // Check 1: Font system initialization
  const hasFontInit = unifiedASM.includes('call init_font_system');
  console.log(`${hasFontInit ? '✅' : '❌'} Fix 1: init_font_system called: ${hasFontInit}`);

  // Check 2: Sprite count (should be 12, not 2)
  const spriteCountMatch = unifiedASM.match(/ld b, (\d+)\s+; 4 bytes per sprite/);
  const spriteCount = spriteCountMatch ? parseInt(spriteCountMatch[1]) : 0;
  const correctSpriteCount = spriteCount === 12;
  console.log(`${correctSpriteCount ? '✅' : '❌'} Fix 2: Sprite count = ${spriteCount} (should be 12)`);

  // Check 3: Entity coordinates (should be ×8, not ×16)
  const coordMatch = unifiedASM.match(/JSON position: \((\d+), (\d+)\) tiles = \((\d+), (\d+)\) pixels/);
  if (coordMatch) {
    const tileX = parseInt(coordMatch[1]);
    const tileY = parseInt(coordMatch[2]);
    const pixelX = parseInt(coordMatch[3]);
    const pixelY = parseInt(coordMatch[4]);

    const correctMultiplier = (pixelX === tileX * 8) && (pixelY === tileY * 8);
    console.log(`${correctMultiplier ? '✅' : '❌'} Fix 3: Coordinates using ×8: (${tileX}, ${tileY}) → (${pixelX}, ${pixelY})`);

    if (!correctMultiplier) {
      console.log(`   ⚠️  Expected: (${tileX * 8}, ${tileY * 8}), Got: (${pixelX}, ${pixelY})`);
    }
  } else {
    console.log('❌ Fix 3: Could not find coordinate data');
  }

  // Check 4: Sprite pattern loading (should load all 12)
  const patternLoads = (unifiedASM.match(/Load sprite \d+:/g) || []).length;
  const correctPatternCount = patternLoads === 12;
  console.log(`${correctPatternCount ? '✅' : '❌'} Fix 4: Sprite patterns loaded = ${patternLoads} (should be 12)`);

  // Check 5: Globals node support
  const hasGlobalsCase = unifiedASM.includes('GameFlow: Start → Globals');
  console.log(`${hasGlobalsCase ? '✅' : '❌'} Fix 5: Globals node supported: ${hasGlobalsCase}`);

  // Save test output
  const outputDir = path.join(__dirname, 'test_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'test_fix_output.asm');
  fs.writeFileSync(outputPath, unifiedASM, 'utf8');

  console.log(`\n💾 Test output saved to: ${outputPath}`);
  console.log(`📊 File size: ${unifiedASM.length} bytes`);

  // Summary
  const allPassed = hasFontInit && correctSpriteCount && correctPatternCount;
  console.log(`\n${allPassed ? '✅ ALL FIXES VERIFIED!' : '⚠️  SOME FIXES NEED ATTENTION'}`);
}

// Run the test
testGenerator().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

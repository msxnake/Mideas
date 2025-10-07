/**
 * Test script to generate ASM from ejemplo1.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateModularASM } from './utils/msxGenerator/index';
import { execSync } from 'child_process';
import { ProjectAsset } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ejemplo1.json
const ejemplo1Path = path.join(__dirname, 'Examples', 'ejemplo1.json');
console.log('📂 Loading ejemplo1.json from:', ejemplo1Path);

const projectData = JSON.parse(fs.readFileSync(ejemplo1Path, 'utf-8'));
console.log('✅ Project loaded:', projectData.name || 'Unknown');

// Extract assets array
const assets: ProjectAsset[] = Object.values(projectData.assets || {});
console.log('📊 Assets found:', assets.length);

assets.forEach((asset: any, index: number) => {
  console.log(`  ${index}: ${asset.type} - ${asset.name || asset.id}`);
});

// Generate ASM files
console.log('\n🔧 Generating ASM files...');
try {
  const asmFiles = generateModularASM(
    projectData.name || 'ejemplo1',
    assets,
    { generateUnified: true }
  );

  // Create output directory
  const outputDir = path.join(__dirname, 'server', 'temp', 'ejemplo1_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write all generated files
  Object.entries(asmFiles).forEach(([filename, content]) => {
    if (content && content.length > 0) {
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, content, 'utf-8');
      console.log(`✅ Written: ${filename} (${content.length} bytes)`);
    }
  });

  console.log('\n✅ ASM generation complete!');
  console.log('📁 Output directory:', outputDir);

  // Try to compile unitedFiles.asm
  console.log('\n🔨 Attempting compilation with glass.jar...');
  const unitedPath = path.join(outputDir, 'unitedFiles.asm');
  const outputRom = path.join(outputDir, 'ejemplo1.rom');

  try {
    execSync(
      `cd "${outputDir}" && java -jar "${path.join(__dirname, 'server', 'glass.jar')}" unitedFiles.asm ${outputRom}`,
      { stdio: 'inherit' }
    );
    console.log('✅ Compilation successful!');
    console.log('📦 ROM generated:', outputRom);
  } catch (error) {
    console.error('❌ Compilation failed:', error);
  }

} catch (error) {
  console.error('❌ Error generating ASM:', error);
  throw error;
}

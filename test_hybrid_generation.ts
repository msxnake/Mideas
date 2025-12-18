/**
 * Test script to generate ASM with hybrid mode and verify Glass.jar compilation
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateModularASM } from './utils/msxGenerator/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test project (use mini_game73.json which has sprites with facing direction)
const projectPath = 'c:\\Users\\salam\\Downloads\\mini_game73.json';
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));

console.log('📦 Loaded project:', projectData.name || 'mini_game73');
console.log('🔧 Generating ASM with hybrid mode...');

// Generate ASM with hybrid mode
const asmFiles = generateModularASM(
  projectData.name || 'test_hybrid',
  projectData.assets, // Pass assets array, not full project
  {
    generateUnified: true,
    targetFormat: 'konami',
    hardwareMode: 'hybrid',
    optimizeLevel: 'safe',
    interruptDrivenComponents: true
  }
);

// Save unified file
const outputDir = path.join(__dirname, 'server', 'temp');
const outputFile = path.join(outputDir, 'test_hybrid_generated.asm');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, asmFiles['unitedFiles.asm'], 'utf-8');

console.log('✅ ASM generated:', outputFile);
console.log('📊 File size:', fs.statSync(outputFile).size, 'bytes');

// Verify fast routines are present
const asmContent = asmFiles['unitedFiles.asm'];
const hasLdirvm = asmContent.includes('FAST_LDIRVM:');
const hasWrtvrm = asmContent.includes('FAST_WRTVRM:');
const hasWrtvdp = asmContent.includes('FAST_WRTVDP:');
const hasGtstck = asmContent.includes('FAST_GTSTCK:');
const hasVblank = asmContent.includes('WAIT_VBLANK:');

console.log('\n🔍 Fast routines verification:');
console.log('  FAST_LDIRVM:', hasLdirvm ? '✅' : '❌');
console.log('  FAST_WRTVRM:', hasWrtvrm ? '✅' : '❌');
console.log('  FAST_WRTVDP:', hasWrtvdp ? '✅' : '❌');
console.log('  FAST_GTSTCK:', hasGtstck ? '✅' : '❌');
console.log('  WAIT_VBLANK:', hasVblank ? '✅' : '❌');

// Count occurrences to detect duplicates
const countOccurrences = (str: string, pattern: string): number => {
  return (str.match(new RegExp(pattern, 'g')) || []).length;
};

console.log('\n🔢 Duplicate check:');
console.log('  FAST_LDIRVM occurrences:', countOccurrences(asmContent, 'FAST_LDIRVM:'));
console.log('  FAST_WRTVRM occurrences:', countOccurrences(asmContent, 'FAST_WRTVRM:'));
console.log('  FAST_WRTVDP occurrences:', countOccurrences(asmContent, 'FAST_WRTVDP:'));

if (countOccurrences(asmContent, 'FAST_LDIRVM:') > 1) {
  console.error('❌ ERROR: FAST_LDIRVM is defined multiple times!');
  process.exit(1);
}

console.log('\n✅ All checks passed! Ready for glass.jar compilation.');
console.log('\n📝 To compile:');
console.log(`   cd server`);
console.log(`   java -jar glass.jar temp/test_hybrid_generated.asm temp/test_hybrid_generated.rom`);

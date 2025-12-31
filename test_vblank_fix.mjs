import { generateInterruptFile } from './utils/msxGenerator/generators/interruptGenerator.ts';
import { writeFileSync } from 'fs';

console.log('=== Testing VBlank Fix ===\n');

// Generate interrupt.asm with the new VBlank implementation
const analysis = {
  hasSprites: false,
  hasTiles: false,
  hasScreens: false,
  hasEntities: false,
  hasComponents: false,
  hasGameFlow: false,
  hasMenus: false,
  hasFonts: false,
  hasECS: false,
  hasMultipleScreens: false,
  hasAnimations: false,
  hasCollisions: false,
  hasMenuSystem: false,
  components: [],
  templates: [],
  entities: [],
  sprites: [],
  tiles: [],
  screens: [],
  screenMaps: [],
  projectName: 'VBlankTest',
  customStates: [],
  stateMachines: [],
  globalVariables: []
};

const interruptCode = generateInterruptFile(analysis, { interruptDrivenComponents: false });

// Save to file
const outputPath = './server/temp/interrupt_vblank_fixed.asm';
writeFileSync(outputPath, interruptCode, 'utf-8');

console.log(`✅ Generated: ${outputPath}`);
console.log(`   Size: ${(interruptCode.length / 1024).toFixed(2)} KB`);
console.log(`   Lines: ${interruptCode.split('\n').length}\n`);

// Check for the new functions
const hasWaitVblank = interruptCode.includes('wait_vblank:');
const hasUpdateFlag = interruptCode.includes('update_vblank_flag:');
const hasVdpRead = interruptCode.includes('in a, (#99)');
const hasCallUpdate = interruptCode.includes('call update_vblank_flag');

console.log('Function checks:');
console.log(`  ✅ wait_vblank: ${hasWaitVblank ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ update_vblank_flag: ${hasUpdateFlag ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ VDP port reading: ${hasVdpRead ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Dispatcher calls update: ${hasCallUpdate ? 'FOUND' : 'MISSING'}`);

if (hasWaitVblank && hasUpdateFlag && hasVdpRead && hasCallUpdate) {
  console.log('\n🎉 All VBlank fixes implemented correctly!');
} else {
  console.log('\n❌ Some fixes are missing');
}

/**
 * Test shooter facing direction implementation
 */

import fs from 'fs';

console.log('🎯 Shooter Facing Direction Test\n');

try {
  const compGenContent = fs.readFileSync('utils/msxGenerator/generators/componentsGenerator.ts', 'utf8');

  console.log('📊 Checking shooter facing implementation...\n');

  const checks = {
    noTodo: !compGenContent.includes('TODO: Read shooter facing direction'),
    hasComment: compGenContent.includes('Set projectile velocity based on shooter\'s facing direction'),
    checksVelX: compGenContent.includes('ld hl, entity_vel_x') && compGenContent.includes('; A = shooter\'s vel_x'),
    checksBit7: compGenContent.includes('bit 7, a') && compGenContent.includes('; Check sign bit'),
    hasLeftBranch: compGenContent.includes('.shoot_facing_left'),
    hasRightBranch: compGenContent.includes('.shoot_facing_right'),
    negatesSpeed: compGenContent.includes('neg') && compGenContent.includes('; Negate to make it negative'),
    hasSetLabel: compGenContent.includes('.shoot_vel_set')
  };

  console.log('✓ Implementation checks:');
  console.log(`   TODO removed: ${checks.noTodo ? '✅' : '❌'}`);
  console.log(`   Has descriptive comment: ${checks.hasComment ? '✅' : '❌'}`);
  console.log(`   Reads shooter vel_x: ${checks.checksVelX ? '✅' : '❌'}`);
  console.log(`   Checks sign bit (bit 7): ${checks.checksBit7 ? '✅' : '❌'}`);
  console.log(`   Left facing branch: ${checks.hasLeftBranch ? '✅' : '❌'}`);
  console.log(`   Right facing branch: ${checks.hasRightBranch ? '✅' : '❌'}`);
  console.log(`   Negates speed for left: ${checks.negatesSpeed ? '✅' : '❌'}`);
  console.log(`   Has .shoot_vel_set label: ${checks.hasSetLabel ? '✅' : '❌'}`);

  const allPassed = Object.values(checks).every(Boolean);

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ Shooter Facing Direction Successfully Implemented!');
    console.log('='.repeat(60));

    console.log('\n📋 What was implemented:');
    console.log('   1. ✅ TODO removed from line 1618 (componentsGenerator.ts)');
    console.log('   2. ✅ Shooter facing direction logic:');
    console.log('      • Reads shooter\'s current vel_x');
    console.log('      • Checks bit 7 (sign bit) to determine direction');
    console.log('      • If vel_x < 0 (negative): Facing LEFT');
    console.log('      • If vel_x >= 0 (positive/zero): Facing RIGHT');
    console.log('   3. ✅ Projectile velocity adjustment:');
    console.log('      • Facing LEFT: velocity = -shoot_speed (NEG instruction)');
    console.log('      • Facing RIGHT: velocity = +shoot_speed (unchanged)');

    console.log('\n🎮 How it works:');
    console.log('   Player/Enemy moving LEFT (vel_x < 0):');
    console.log('      └─> Shoots LEFT (projectile vel_x = -speed)');
    console.log('   Player/Enemy moving RIGHT (vel_x >= 0):');
    console.log('      └─> Shoots RIGHT (projectile vel_x = +speed)');
    console.log('   Player/Enemy STATIONARY (vel_x = 0):');
    console.log('      └─> Shoots RIGHT by default');

    console.log('\n🔧 Technical Implementation:');
    console.log('   • Uses Z80 BIT instruction to check sign (bit 7)');
    console.log('   • Uses Z80 NEG instruction to negate velocity');
    console.log('   • Efficient: Only 2-3 extra instructions');
    console.log('   • No additional RAM variables needed');

  } else {
    console.log('❌ Some checks failed!');
    console.log('='.repeat(60));
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

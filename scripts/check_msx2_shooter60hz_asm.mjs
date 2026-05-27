#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const read = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8');

const msx2Generator = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen4Generator.ts');
const msx2ShooterRuntime = read('utils', 'msx2ShooterRuntime.ts');

const checks = [
  [
    'Generator gates player bullet pool with MSX2_SHOOTER60HZ_MAX_PLAYER_SHOTS',
    msx2Generator.includes('cp MSX2_SHOOTER60HZ_MAX_PLAYER_SHOTS') &&
      msx2Generator.includes('.bullet_pool_full') &&
      msx2Generator.includes('shooter60HzContract'),
  ],
  [
    'Generator caps visible enemy slots with MSX2_SHOOTER60HZ_MAX_ENEMIES',
    msx2Generator.includes('cp MSX2_SHOOTER60HZ_MAX_ENEMIES') &&
      msx2Generator.includes('.enemy_sprite_${slot}_count_ready'),
  ],
  [
    'Shooter runtime resolves tileVertical scroll to IRQ_STAGE_SCROLL_EVEN for ASM',
    msx2ShooterRuntime.includes('resolveMsx2Shooter60HzBudgetForGeneration') &&
      msx2ShooterRuntime.includes("activeIrqProfile: 'IRQ_STAGE_SCROLL_EVEN'"),
  ],
  [
    'Generator dispatches shooter 60Hz IRQ profile before scroll work',
    msx2Generator.includes('call update_msx2_shooter60hz_frame') &&
      msx2ShooterRuntime.includes('buildMsx2Shooter60HzFrameDispatchAsm') &&
      msx2ShooterRuntime.includes("tasks.includes('scroll_row')") &&
      msx2ShooterRuntime.includes("tasks.includes('sat_upload_24')") &&
      msx2Generator.includes('deferSatUploadToShooterFrameDispatch'),
  ],
  [
    'Generator gates enemy bullet pool with MSX2_SHOOTER60HZ_MAX_ENEMY_SHOTS',
    msx2Generator.includes('cp MSX2_SHOOTER60HZ_MAX_ENEMY_SHOTS') &&
      msx2Generator.includes('.enemy_bullet_pool_full') &&
      msx2Generator.includes('.enemy_bullet_count_ready') &&
      msx2Generator.includes('.enemy_bullet_count_after_slot_0'),
  ],
  [
    'Generator exposes second enemy bullet hardware slot for shooter contract',
    msx2Generator.includes('MSX2_ENEMY_BULLET_HARDWARE_SLOTS = 2') &&
      msx2Generator.includes('update_msx2_enemy_bullet_slot_1') &&
      msx2Generator.includes('msx2_enemy_bullet_1_active EQU #C040'),
  ],
  [
    'Shooter frame dispatch uploads SAT and ticks music from active IRQ profile',
    msx2ShooterRuntime.includes('update_msx2_shooter60hz_present_frame') &&
      msx2ShooterRuntime.includes('call write_hardware_sprite_attrs') &&
      msx2ShooterRuntime.includes('update_msx2_shooter_music_tick'),
  ],
  [
    'Vertical shooter tile scroll can enable background scroll runtime',
    msx2Generator.includes('shooterVerticalTileScroll') &&
      msx2Generator.includes('usesShooterVerticalMovement(analysis)'),
  ],
  [
    'Shooter main loop waits on VBlank before frame work to preserve 60 Hz pacing',
    msx2Generator.includes("'    call wait_frame_busy\\n    call update_msx2_shooter60hz_frame\\n'") &&
      msx2Generator.includes('Shooter 60Hz contract: exactly one wait_frame_busy per main_loop iteration'),
  ],
  [
    'Shooter contract locks TARGET_HZ and exports frame cycle budget EQU',
    msx2ShooterRuntime.includes('MSX2_SHOOTER60HZ_MAX_FRAME_CYCLES EQU') &&
      msx2ShooterRuntime.includes('frame_rate_not_60hz'),
  ],
  [
    'GameFlow frame waits use wait_frame_busy instead of bare halt',
    !msx2Generator.includes("lines.push('    halt')") &&
      msx2Generator.includes('buildMsx2GameFlowTransitionWaitLines'),
  ],
  [
    'Vertical shooter scroll_row uses dedicated name-table upload routine',
    msx2Generator.includes('update_msx2_shooter_scroll_row') &&
      msx2Generator.includes('init_msx2_shooter_scroll_row') &&
      msx2ShooterRuntime.includes('scrollRowRoutine'),
  ],
  [
    'Project slice exports shooter 60Hz frame budget headroom for IDE feedback',
    msx2Generator.includes('buildMsx2Shooter60HzFrameBudgetSummary') &&
      msx2ShooterRuntime.includes('estimatedHeadroomCycles') &&
      msx2ShooterRuntime.includes('resolveMsx2ShooterScrollRowRoutine'),
  ],
];

const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
}
if (failures.length) {
  throw new Error(`MSX2 shooter 60Hz ASM checks failed: ${failures.length}`);
}
console.log('MSX2 shooter 60Hz ASM checks passed.');

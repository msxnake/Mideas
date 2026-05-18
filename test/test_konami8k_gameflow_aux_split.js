/**
 * Validate Konami 8K resident-pressure splits and SecretZone RAM policy.
 */

import fs from 'fs';

const runtimeLayoutPolicySource = fs.readFileSync('utils/msxGenerator/generators/runtimeLayoutPolicy.ts', 'utf8');
const variablesSource = fs.readFileSync('utils/msxGenerator/generators/variablesGenerator.ts', 'utf8');
const componentsSource = fs.readFileSync('utils/msxGenerator/generators/componentsGenerator.ts', 'utf8');
const unifiedSource = fs.readFileSync('utils/msxGenerator/generators/unifiedGenerator.ts', 'utf8');
const gameFlowSource = fs.readFileSync('utils/msxGenerator/generators/gameFlowGenerator.ts', 'utf8');
const screensSource = fs.readFileSync('utils/msxGenerator/generators/screensGenerator.ts', 'utf8');

const failures = [];

if (!runtimeLayoutPolicySource.includes('export function getRuntimeSecretRestoreBufferSize')) {
  failures.push('SecretZone runtime must size a compact restore buffer from max rect area');
}

if (!/export function shouldKeepRuntimeBackgroundLayout[\s\S]*?return false;/.test(runtimeLayoutPolicySource)) {
  failures.push('SecretZone runtime must not force a full 768-byte background layout copy');
}

if (!variablesSource.includes('RUNTIME_SECRET_RESTORE_BUFFER_SIZE') || !variablesSource.includes('secret_zone_restore_buffer')) {
  failures.push('variables.asm must expose the compact SecretZone restore buffer');
}

if (!componentsSource.includes('secret_zone_capture_current_rect') || !componentsSource.includes('secret_zone_copy_packed_to_runtime_screen')) {
  failures.push('SecretZone runtime must capture and restore packed rect data');
}

if (componentsSource.includes('ld de, runtime_background_layout')) {
  failures.push('SecretZone restore path must not depend on runtime_background_layout');
}

if (unifiedSource.includes('jp z, gameflow_handle_submenu_far')) {
  failures.push('SubMenu must not be a normal far handler because it tail-jumps to gameflow_execute_node');
}

if (unifiedSource.includes('SubMenu handler moved to gameflow_aux2 far module')) {
  failures.push('SubMenu handler must remain resident instead of being extracted to aux2');
}

if (!unifiedSource.includes('SubMenu render/cursor helpers moved to gameflow_aux2 far module') ||
    !unifiedSource.includes('render_submenu_screen_far')) {
  failures.push('SubMenu render/cursor helpers should move to aux2 while the interactive handler remains resident');
}

if (unifiedSource.includes('jp z, gameflow_handle_presentationscreen_far')) {
  failures.push('PresentationScreen must stay resident because its HALT wait loop cannot run under a far-call DI window');
}

if (unifiedSource.includes("replace(/\\bcall\\s+wait_for_fire\\b/g, 'call wait_for_fire_far')")) {
  failures.push('Text wait_for_fire must stay resident; it contains HALT and cannot run behind a normal far-call DI trampoline');
}

if (!/wait_for_fire:[\s\S]*?\.wait_press:\s*ei\s*halt/.test(gameFlowSource) ||
    !/\.wait_release:\s*ei\s*halt/.test(gameFlowSource) ||
    !/\.delay_loop:\s*ei\s*halt/.test(gameFlowSource)) {
  failures.push('Text wait_for_fire must enable IRQ immediately before each HALT so Credits cannot block after a far-rendered text screen');
}

if (!/gameflow_presentation_wait_frames:[\s\S]*?\.gfpwf_loop:\s*ei\s*halt/.test(gameFlowSource) ||
    !/gameflow_presentation_wait_for_fire:[\s\S]*?\.gfpwff_wait_press:\s*ei\s*halt/.test(gameFlowSource) ||
    !/\.gfpwff_wait_release:\s*ei\s*halt/.test(gameFlowSource)) {
  failures.push('GameFlow presentation waits must enable IRQ before HALT after returning from far-rendered screens');
}

if (!/presentation_wait_frames:[\s\S]*?\.pwf_loop:\s*ei\s*halt/.test(screensSource) ||
    !/presentation_wait_for_fire:[\s\S]*?\.pwff_wait_press:\s*ei\s*halt/.test(screensSource) ||
    !/\.pwff_wait_release:\s*ei\s*halt/.test(screensSource)) {
  failures.push('Legacy presentation waits must enable IRQ before HALT');
}

if (!unifiedSource.includes("replace(/\\bcall\\s+print_string_vram\\b/g, 'call print_string_vram_far')") ||
    !unifiedSource.includes("replace(/\\bcall\\s+clear_screen_row\\b/g, 'call clear_screen_row_far')")) {
  failures.push('Aux2 must route shared GameFlow helpers through bank-0 trampolines');
}

if (!/function buildFarIrqLockEnter\(\)[\s\S]*?ld a, \(far_call_irq_lock_depth\)[\s\S]*?inc a[\s\S]*?ld \(far_call_irq_lock_depth\), a/.test(unifiedSource) ||
    !/function buildFarIrqLockLeave\(\)[\s\S]*?ld a, \(far_call_irq_lock_depth\)[\s\S]*?dec a[\s\S]*?ld \(far_call_irq_lock_depth\), a/.test(unifiedSource)) {
  failures.push('Far-call IRQ lock helpers must not clobber HL so pointer-based wrappers like print_string_vram_far keep their input');
}

if (failures.length > 0) {
  console.error('Konami 8K GameFlow aux split validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Konami 8K GameFlow aux split validation passed');

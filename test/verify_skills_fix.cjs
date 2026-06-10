// Verification for the MSX2 skills/RAM fixes (2026-06-10):
//  A) coyote/jump-buffer timers moved off the box2 runtime head (#C047/#C048)
//  B) dash preserves E across msx2_collision_at_pixel (push de/pop de)
//  C) dash no longer emits box2 hooks with nonexistent labels
//  D) teleport abs uses the SUB borrow + destination collision check
//  E) directional pressed checks return 0 when not pressed
//  F) glide caps only when fall speed exceeds glideSpeed (jp c)
const fs = require('fs');
const { generateModularASM } = require('C:/temp/mideas_tsbuild/utils/msxGenerator/index');

let failures = 0;
function check(cond, msg) {
  console.log(`${cond ? 'OK' : 'FAIL'}: ${msg}`);
  if (!cond) failures += 1;
}

const config = {
  screenMode: 'SCREEN 4 (Graphics II)',
  romMode: 'simple32k',
  targetFormat: 'konami',
  autoMegaROM: false,
};

function generate(projectPath, mutate) {
  const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  if (mutate) mutate(project);
  const result = generateModularASM('verify_skills', project.assets || [], config);
  return result['unitedFiles.asm'] || result['main.asm'] || Object.values(result).join('\n');
}

function equAddr(asm, name) {
  const m = asm.match(new RegExp(`${name}\\s+EQU\\s+#([0-9A-Fa-f]{4})`));
  return m ? parseInt(m[1], 16) : null;
}

// ── Case 1: push_example22 as-is (pushBox + coyoteTime=8, no skills) ──
const asm1 = generate('./downloads/push_example22.json');
const coyote1 = equAddr(asm1, 'msx2_player_coyote_timer');
const buffer1 = equAddr(asm1, 'msx2_player_jump_buffer_timer');
const box2Count = equAddr(asm1, 'msx2_box2_count');
const box2End = equAddr(asm1, 'msx2_box2_runtime_end');
console.log(`coyote=#${coyote1?.toString(16)} buffer=#${buffer1?.toString(16)} box2_count=#${box2Count?.toString(16)} box2_end=#${box2End?.toString(16)}`);
check(coyote1 !== null && buffer1 !== null, 'timer EQUs emitted');
if (box2Count !== null && box2End !== null) {
  check(coyote1 >= box2End && buffer1 >= box2End,
    'A) timers sit AFTER the box2 runtime region (no overlap with box2_count/try_dx)');
} else {
  check(coyote1 !== 0xC047 && buffer1 !== 0xC048, 'A) timers not at #C047/#C048');
}
check(buffer1 === coyote1 + 1, 'A) buffer timer immediately follows coyote timer');
check(coyote1 < 0xC087, 'A) timers below msx2_effects_runtime_buffers (#C087)');

// ── Case 2: same project with dash + teleport + glide force-enabled ──
const asm2 = generate('./downloads/push_example22.json', (project) => {
  for (const asset of project.assets || []) {
    const compact = asset?.data?.compact;
    if (compact && Array.isArray(compact.activeSkills)) {
      compact.activeSkills = ['dash', 'teleport_a_b', 'glide'];
      compact.skillBindings = {
        dash: { primary: 'attack', secondary: 'none' },
        teleport_a_b: { primary: 'down', secondary: 'none' },
      };
    }
  }
});

const coyote2 = equAddr(asm2, 'msx2_player_coyote_timer');
const dashTimer = equAddr(asm2, 'msx2_dash_timer');
const teleCooldown = equAddr(asm2, 'msx2_teleport_cooldown');
const glideStamina = equAddr(asm2, 'msx2_glide_stamina');
const glideActive = equAddr(asm2, 'msx2_glide_active');
console.log(`coyote=#${coyote2?.toString(16)} dash=#${dashTimer?.toString(16)} tele=#${teleCooldown?.toString(16)} glide=#${glideStamina?.toString(16)}`);
check(dashTimer === coyote2 + 2, 'A) dash RAM starts right after the 2 timer bytes');
check(teleCooldown === dashTimer + 4, 'A) teleport RAM starts after dash (4 bytes)');
check(glideStamina === teleCooldown + 8, 'A) glide RAM starts after teleport (8 bytes)');
check(glideActive !== null && glideActive < 0xC087, 'A) full chain ends below #C087');

// B) dash preserves E across collision probes
const dashStep = asm2.slice(asm2.indexOf('msx2_step_dash_movement:'), asm2.indexOf('.dash_step_done:'));
const probeCount = (dashStep.match(/push de\s*\n\s*call msx2_collision_at_pixel\s*\n\s*pop de/g) || []).length;
check(probeCount === 2, `B) both dash probes wrap msx2_collision_at_pixel with push de/pop de (got ${probeCount})`);

// C) no orphan box2-hook labels inside the dash routine
check(!dashStep.includes('.right_blocked') && !dashStep.includes('.left_blocked')
  && !dashStep.includes('msx2_try_box2_from_player'),
  'C) dash routine has no box2 hook with nonexistent labels');

// D) teleport abs keeps the SUB borrow and dest collision is checked
const absRoutine = asm2.slice(asm2.indexOf('msx2_teleport_abs_tiles:'), asm2.indexOf('msx2_teleport_distance_ok_bc:'));
check(/jp c, \.tele_abs_negate/.test(absRoutine) && !/^\s*or a/m.test(absRoutine),
  'D) abs routine branches on the caller SUB borrow (no or a before jp c)');
check(asm2.includes('msx2_teleport_dest_free_bc:'),
  'D) teleport destination collision routine emitted');
check((asm2.match(/call msx2_teleport_dest_free_bc/g) || []).length === 2,
  'D) both teleport paths (to A / to B) check the destination');

// E) directional pressed check (teleport bound to "down") returns 0 when not matched
const telePressed = asm2.slice(asm2.indexOf('msx2_control_teleport_pressed:'), asm2.indexOf('msx2_tick_teleport_cooldown:'));
check(/cp 4[\s\S]*?cp 5[\s\S]*?cp 6[\s\S]*?xor a\s*\n\s*ret\s*\n\.skill_dir_ok_p:/.test(telePressed),
  'E) directional check falls through to "xor a / ret" (not pressed) and only matches 4/5/6');
check(!/cp \d+\s*\n\s*ret z/.test(telePressed),
  'E) no inverted "cp N / ret z" directional pattern remains');

// F) glide cap uses jp c (cap when falling faster than glideSpeed)
const glideRoutine = asm2.slice(asm2.indexOf('msx2_apply_glide_clamp:'), asm2.indexOf('.glide_inactive:'));
check(/cp b\s*\n\s*jp c, \.glide_cap_store/.test(glideRoutine),
  'F) glide caps with jp c (only when current fall speed exceeds glideSpeed)');

// Restart still clears the timers in this platform-physics project
const restart = asm2.slice(asm2.indexOf('msx2_restart_game:'), asm2.indexOf('auto_patrol_hardware_sprite:'));
check(restart.includes('ld (msx2_player_coyote_timer), a'),
  'restart clears timers (platform physics project)');

fs.writeFileSync('./test/verify_skills_fix_output.asm', asm2);
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);

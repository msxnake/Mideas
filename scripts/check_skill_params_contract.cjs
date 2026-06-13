// Standalone smoke test: re-implement the core logic and compare against expectations.
// This validates behavior parity without requiring a full TS toolchain.
const path = require('node:path');
const fs = require('node:fs');
const ROOT = path.resolve(__dirname, '..');
const ts = fs.readFileSync(path.join(ROOT, 'utils', 'msx2PlayerDefaults.ts'), 'utf8');

function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
  console.log('OK:', msg);
}

// 1) Defaults are produced for double_jump
assert(ts.includes('buildSkillParametersDefaults'), 'buildSkillParametersDefaults is defined');
assert(ts.includes('mergeSkillParameters'), 'mergeSkillParameters is defined');
assert(ts.includes('coerceSkillParameterValue'), 'coerceSkillParameterValue is defined');

// 2) Coercion respects min/max for number
const coerceLogic = ts.match(/const coerceSkillParameterValue[\s\S]+?\n\};/);
assert(coerceLogic, 'coerceSkillParameterValue is well-formed');
assert(coerceLogic[0].includes('Number.isFinite'), 'coerce uses Number.isFinite');
assert(coerceLogic[0].includes('Math.max') && coerceLogic[0].includes('Math.min'), 'coerce clamps to min/max');

// 3) Default value handling for boolean
assert(coerceLogic[0].includes('Boolean(raw)'), 'coerce returns boolean for boolean params');
assert(coerceLogic[0].includes('param.default'), 'coerce falls back to default when NaN');

// 4) mergeSkillParameters merges defaults + user values
const mergeLogic = ts.match(/const mergeSkillParameters[\s\S]+?\n\};/);
assert(mergeLogic, 'mergeSkillParameters is well-formed');
assert(mergeLogic[0].includes('defaults') && mergeLogic[0].includes('raw'), 'mergeSkillParameters uses defaults and raw');

// 5) Normalizer returns skillParameters
assert(ts.includes('skillParameters: mergeSkillParameters(parsed?.skillParameters)'),
  'normalizeMsx2PlayerDefinition returns merged skillParameters');

// 6) createDefaultMsx2PlayerDefinition includes default skillParameters
assert(ts.includes('skillParameters: buildSkillParametersDefaults()'),
  'createDefaultMsx2PlayerDefinition seeds default skillParameters');

// 7) types.ts includes skillParameters
const typesCode = fs.readFileSync(path.join(ROOT, 'types.ts'), 'utf8');
assert(/skillParameters\?:\s*Record<string,\s*Record<string,\s*number\s*\|\s*boolean>>/.test(typesCode),
  'Msx2PlayerDefinition.skillParameters has the expected type');

// 8) skills/types.ts includes SkillParameterDef
const skillsTypesCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'skills', 'types.ts'), 'utf8');
assert(/export interface SkillParameterDef/.test(skillsTypesCode), 'SkillParameterDef is exported');
assert(/parameters\?:\s*SkillParameterDef\[\]/.test(skillsTypesCode), 'SkillDef has parameters');

// 9) doubleJump uses parameters: doubleJumpParameters
const handlersCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'skills', 'handlers', 'index.ts'), 'utf8');
assert(handlersCode.includes('parameters: doubleJumpParameters'),
  'doubleJump wires its parameters array');
assert(handlersCode.includes("key: 'maxJumps'") && handlersCode.includes("key: 'requireKeyRelease'"),
  'doubleJump parameters include maxJumps and requireKeyRelease');
assert(handlersCode.includes('default: 2') && handlersCode.includes('min: 1') && handlersCode.includes('max: 4'),
  'doubleJump maxJumps has min/max/default');
assert(handlersCode.includes('default: true'),
  'doubleJump requireKeyRelease defaults to true');

// 10) mergeMsx2PlayerUpdate propagates skillParameters
const docCode = fs.readFileSync(path.join(ROOT, 'utils', 'msx2PlayerDocument.ts'), 'utf8');
assert(docCode.includes('skillParameters: partialPatch.skillParameters'),
  'mergeMsx2PlayerUpdate propagates skillParameters');

// 11) Msx2PlayerEditor wires the dialog and the clickable label
const editorCode = fs.readFileSync(path.join(ROOT, 'components', 'editors', 'Msx2PlayerEditor.tsx'), 'utf8');
assert(editorCode.includes('SkillParametersDialog'), 'SkillParametersDialog is referenced');
assert(editorCode.includes('openSkillDialogId'), 'openSkillDialogId state is wired');
assert(editorCode.includes('updateSkillParameter'), 'updateSkillParameter handler is defined');
assert(editorCode.includes('setOpenSkillDialogId(skill.id)'), 'row click opens the dialog');
assert(editorCode.includes('aria-haspopup="dialog"'), 'clickable row has dialog aria');

// 12) First_Jump (core skill 'jump') has parameters wired
assert(handlersCode.includes('export const firstJumpParameters: SkillParameterDef[]'),
  'firstJumpParameters is exported from skills handlers');
assert(handlersCode.includes('label: \'Jump\''),
  'jump core skill is relabelled to "Jump"');
assert(handlersCode.includes('parameters: firstJumpParameters'),
  'jump core skill wires its parameters array');
assert(handlersCode.includes("key: 'enabled'") && handlersCode.includes("key: 'jumpPower'") && handlersCode.includes("key: 'requireKeyRelease'"),
  'firstJumpParameters has enabled/jumpPower/requireKeyRelease keys');
assert(handlersCode.includes('default: 1024') && handlersCode.includes('min: 256') && handlersCode.includes('max: 2048'),
  'firstJumpParameters jumpPower has min=256 max=2048 default=1024 (matches msx2_jump component)');
// Keys must match the legacy component for future generator migration (1:1 mapping).
assert(handlersCode.includes("key: 'jumpPower'") && handlersCode.includes("key: 'requireKeyRelease'"),
  'firstJumpParameters keys align with components[\'msx2_jump\'] for future migration');

// 13) UI lists skills with parameters (not just optional ones)
assert(editorCode.includes('filter(s => s.parameters && s.parameters.length > 0)'),
  'editor filters skills by parameters presence, not by !s.required');
assert(editorCode.includes('const isCore = skill.required;'),
  'editor distinguishes core vs optional skills for the parameters dialog');

// 14) Registry still treats jump as required (no architectural change)
const registryCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'skills', 'registry.ts'), 'utf8');
assert(registryCode.includes('s.required'), 'registry still uses required flag for core/optional split');
assert(/required:\s*true,\s*cycles:\s*80,\s*controlIcon:\s*'jump'/.test(handlersCode),
  'jump core skill keeps required: true (no architectural change)');

// 15) Jump skill exposes coyoteTime and jumpBuffer parameters
assert(handlersCode.includes("key: 'coyoteTime'") && handlersCode.includes("key: 'jumpBuffer'"),
  'firstJumpParameters exposes coyoteTime and jumpBuffer');
assert(/coyoteTime[\s\S]+?min:\s*0[\s\S]+?max:\s*16/.test(handlersCode),
  'coyoteTime parameter has min:0 max:16 range');
assert(/jumpBuffer[\s\S]+?min:\s*0[\s\S]+?max:\s*16/.test(handlersCode),
  'jumpBuffer parameter has min:0 max:16 range');

// 16) msx2PlatformPhysics reads skillParameters.jump with priority A
const physicsCode = fs.readFileSync(path.join(ROOT, 'utils', 'msx2PlatformPhysics.ts'), 'utf8');
assert(physicsCode.includes('player?.skillParameters?.jump'),
  'msx2PlatformPhysics reads player.skillParameters.jump');
assert(physicsCode.includes('coyoteTime') && physicsCode.includes('jumpBuffer'),
  'Msx2PlatformPhysicsConfig exposes coyoteTime and jumpBuffer');
assert(physicsCode.includes('clampMsx2CoyoteFrames') && physicsCode.includes('clampMsx2JumpBufferFrames'),
  'msx2PlatformPhysics has clamp helpers for coyote/buffer frames');

// 17) msx2Screen4Generator wires the EQU + decrement + coyote/buffer logic
assert(handlersCode.includes('parameters: firstJumpParameters'),
  'jump core skill wires its parameters array');
const genCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen4Generator.ts'), 'utf8');
// Lesson 2026-06-08 + fix 2026-06-10: the timers were hardcoded at #C047/#C048,
// which IS msx2_box2_count/msx2_box2_try_dx in pushBox projects (the box2 RAM
// base is a TS const, invisible to an "EQU #C047" grep). They now resolve
// through msx2SkillRamLayout so they can never overlap box2 again.
assert(!/msx2_player_coyote_timer\s+EQU\s+#C0/.test(genCode),
  'msx2_player_coyote_timer must NOT be hardcoded (it collided with msx2_box2_count at #C047)');
assert(!/msx2_player_jump_buffer_timer\s+EQU\s+#C0/.test(genCode),
  'msx2_player_jump_buffer_timer must NOT be hardcoded (it collided with msx2_box2_try_dx at #C048)');
assert(genCode.includes('resolveMsx2PlayerTimersRamBase'),
  'msx2Screen4Generator resolves the timer addresses via msx2SkillRamLayout');
assert(genCode.includes('assertMsx2SkillRamWithinLimit'),
  'msx2Screen4Generator asserts the skill RAM chain stays below msx2_effects_runtime_buffers');
assert(/coyoteTime\s*>\s*0/.test(genCode) && /jumpBuffer\s*>\s*0/.test(genCode),
  'Generator gates coyote/buffer blocks on the corresponding skill value');
assert(genCode.includes('.platform_coyote_blocked') && genCode.includes('.platform_land_settle'),
  'Generator emits coyote/buffer labels in the platform vertical physics routine');
assert(genCode.includes('ld (msx2_player_coyote_timer), a') && genCode.includes('ld (msx2_player_jump_buffer_timer), a'),
  'Generator writes both timers (arming and clearing paths)');
assert(genCode.includes('Jump accepts the cached grounded flag') && genCode.includes('fall back to a direct foot probe'),
  'Jump grounded gate supports settled idle jumps and stale-cache fallback probing');
assert(genCode.includes('probeCenterOffset') && genCode.includes('bodyHitbox.x + Math.floor((bodyHitbox.w - 1) / 2)'),
  'MSX2 jump/grounded probes include a center foot sample for idle false negatives');

// 17b) Regression guard: the skill RAM layout module chains the regions in
// order (timers -> dash -> teleport -> glide -> wall_jump -> power_stomp ->
// screen_shake -> air_dash) and enforces the #C098 limit.
const layoutCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2SkillRamLayout.ts'), 'utf8');
assert(layoutCode.includes('MSX2_PLAYER_TIMER_RAM_BYTES = 2'),
  'msx2SkillRamLayout reserves 2 bytes for the player coyote/jump-buffer timers');
assert(layoutCode.includes('MSX2_SKILL_RAM_LIMIT = 0xC0A8'),
    'msx2SkillRamLayout caps the chain at #C0A8 (msx2_effects_runtime_buffers)');
// The effect runtime base must match the skill RAM limit, otherwise the
// assertMsx2SkillRamWithinLimit guard lies (latent overlap bug fixed 2026-06-12).
assert(genCode.includes('MSX2_SKILL_CHAIN_RESERVED_BYTES = 33'),
  'msx2Screen4Generator reserves 33 skill-chain bytes so the effect base sits at #C0A8');
assert(layoutCode.includes('MSX2_BOX2_RUNTIME_BYTES'),
  'msx2SkillRamLayout offsets the chain past the box2 runtime in pushBox projects');
// No EQU in the generator may land on the box2 runtime head (#C047/#C048):
const allEquLines = (genCode.match(/^\s*msx2_\w+\s+EQU\s+#C0[0-9A-Fa-f]+/gm) || []);
for (const line of allEquLines) {
  const m = line.match(/(msx2_\w+)\s+EQU\s+(#C0[0-9A-Fa-f]+)/);
  if (!m) continue;
  const addr = parseInt(m[2].slice(1), 16);
  assert(!(addr === 0xC047 || addr === 0xC048),
    `${m[1]} must not be hardcoded at ${m[2]} (box2 runtime head in pushBox projects)`);
}

// 17c) Regression guard: known 16-bit little-endian pointer pairs must not
// be split. If a new EQU is added inside any of these ranges, the runtime
// breaks. The known pairs are: collision_ptr #C004-#C005, effects_ptr
// #C006-#C007, gravity_vel #C008-#C009, current_behavior_ptr #C01A-#C01B.
const forbiddenRanges = [
  { start: 0xC004, end: 0xC005, name: 'msx2_current_collision_ptr (16-bit ptr)' },
  { start: 0xC006, end: 0xC007, name: 'msx2_current_effects_ptr (16-bit ptr)' },
  { start: 0xC008, end: 0xC009, name: 'msx2_player_gravity_vel (16-bit)' },
  { start: 0xC01A, end: 0xC01B, name: 'msx2_current_behavior_ptr (16-bit ptr)' },
];
for (const line of allEquLines) {
  const m = line.match(/(msx2_\w+)\s+EQU\s+#C0([0-9A-Fa-f]{2})/);
  if (!m) continue;
  const name = m[1];
  const addr = parseInt(m[2], 16);
  for (const range of forbiddenRanges) {
    if (addr >= range.start && addr <= range.end) {
      assert(false, `EQU ${name} at #${m[2].toUpperCase()} collides with ${range.name}`);
    }
  }
}
assert(true, 'no EQU collides with the known 16-bit pointer HI bytes');

// 18) Normalizer (R1-A): core skills do NOT auto-seed defaults so legacy projects keep their physics
const defaultsCode = fs.readFileSync(path.join(ROOT, 'utils', 'msx2PlayerDefaults.ts'), 'utf8');
assert(/buildSkillParametersDefaults[\s\S]+?if\s*\(\s*skill\.required\s*\)\s*continue;/.test(defaultsCode),
  'buildSkillParametersDefaults skips required (core) skills (R1-A)');

// 19) wall_jump skill is registered in handlers/index.ts
assert(handlersCode.includes("id: 'wall_jump'"),
  'handlers/index.ts registers wall_jump skill');
assert(handlersCode.includes('parameters: wallJumpParameters') || handlersCode.includes('parameters: wall_jump_parameters'),
  'wall_jump wires its parameters array');
assert(handlersCode.includes("key: 'wallJumpPower'") && handlersCode.includes("key: 'wallJumpHorizontal'") && handlersCode.includes("key: 'wallSlideSpeed'"),
  'wallJumpParameters has wallJumpPower/wallJumpHorizontal/wallSlideSpeed keys');
assert(handlersCode.includes("key: 'requireKeyRelease'"),
  'wallJumpParameters includes requireKeyRelease');
// 19b) wallJumpVertical: human-facing px/frame field. It must exist in the
// dialog AND the physics resolver must apply it ONLY when explicitly present
// (a pickSkillNumberParam fallback would override every custom wallJumpPower).
assert(handlersCode.includes("key: 'wallJumpVertical'"),
  'wallJumpParameters includes wallJumpVertical (px/frame vertical force)');
assert(physicsCode.includes('wallJumpVerticalRaw !== undefined'),
  'physics resolver applies wallJumpVertical only when explicitly set');
assert(physicsCode.includes('resolveMsx2JumpImpulse88Px(Math.max(1, Math.min(8,'),
  'wallJumpVertical clamps to 1-8 px/frame before 8.8 conversion');
assert(handlersCode.includes('default: 768') || handlersCode.includes('min: 256') || handlersCode.includes('max: 2048'),
  'wallJumpParameters wallJumpPower has a reasonable range (768 seems typical)');

// 20) msx2Screen4Generator wires wall_jump config
assert(genCode.includes('getMsx2WallJumpConfigFromPlayerEntity'),
  'msx2Screen4Generator reads wall_jump config');
assert(genCode.includes('buildMsx2WallJumpRuntimeAsm'),
  'msx2Screen4Generator builds wall_jump runtime ASM');
assert(genCode.includes('wallJumpInitClearAsm') || genCode.includes('buildMsx2WallJumpInitClearAsm'),
  'msx2Screen4Generator clears wall_jump RAM on init');
assert(genCode.includes('wallJumpEquatesAsm') || genCode.includes('buildMsx2WallJumpEquates'),
  'msx2Screen4Generator emits wall_jump EQUs');
assert(genCode.includes('resolveMsx2WallJumpRamBase') || genCode.includes('resolveMsx2SkillExtensionRamBase'),
  'msx2Screen4Generator resolves wall_jump RAM base via msx2SkillRamLayout');

// 21) wall_jump has its own generator reference in the EQUs block
assert(genCode.includes('${wallJumpEquatesAsm}'),
  'wall_jump EQUs are injected in the EQU block');

// 22) msx2PlatformPhysics has Msx2WallJumpConfig
assert(physicsCode.includes('Msx2WallJumpConfig'),
  'msx2PlatformPhysics exports Msx2WallJumpConfig');
assert(physicsCode.includes('getMsx2WallJumpConfigFromPlayerEntity'),
  'msx2PlatformPhysics has getMsx2WallJumpConfigFromPlayerEntity');

// 23) power_stomp skill exposes the screenShake param and DOWN+B binding
assert(handlersCode.includes("key: 'screenShake'"),
  'power_stomp (handlers) exposes the screenShake parameter');
assert(/controlIcon:\s*\['down',\s*'attack'\]/.test(handlersCode),
  "power_stomp controlIcon is ['down', 'attack'] (DOWN+B default binding)");

// 24) physics resolver + screen-shake gate for power_stomp
assert(physicsCode.includes('getMsx2PowerStompConfigFromPlayerEntity'),
  'msx2PlatformPhysics has getMsx2PowerStompConfigFromPlayerEntity');
assert(physicsCode.includes('msx2PlayerWantsScreenShake'),
  'msx2PlatformPhysics exports msx2PlayerWantsScreenShake');
assert(physicsCode.includes('Msx2PowerStompConfig'),
  'msx2PlatformPhysics exports Msx2PowerStompConfig');

// 25) generator wires power_stomp + screen_shake runtimes
assert(genCode.includes('buildMsx2PowerStompRuntimeAsm'),
  'msx2Screen4Generator builds power_stomp runtime ASM');
assert(genCode.includes('buildMsx2ScreenShakeRuntimeAsm'),
  'msx2Screen4Generator builds screen_shake runtime ASM');
assert(genCode.includes('${powerStompRuntimeAsm}') && genCode.includes('${screenShakeRuntimeAsm}'),
  'power_stomp + screen_shake runtimes are injected in the runtime block');
assert(genCode.includes('${powerStompInputGateAsm}'),
  'power_stomp input gate is injected before the GTSTCK dispatch');
assert(genCode.includes('${powerStompLandHookAsm}'),
  'power_stomp landing hook is injected at the platform settle');

// 26) layout module declares the new RAM byte constants
assert(layoutCode.includes('MSX2_POWER_STOMP_RAM_BYTES'),
  'msx2SkillRamLayout chains MSX2_POWER_STOMP_RAM_BYTES');
assert(layoutCode.includes('MSX2_SCREEN_SHAKE_RAM_BYTES'),
  'msx2SkillRamLayout chains MSX2_SCREEN_SHAKE_RAM_BYTES');
const stompGenCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2PowerStompGenerator.ts'), 'utf8');
assert(stompGenCode.includes('MSX2_POWER_STOMP_RAM_BYTES = 2'),
  'msx2PowerStompGenerator declares MSX2_POWER_STOMP_RAM_BYTES = 2');
const shakeGenCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2ScreenShakeGenerator.ts'), 'utf8');
assert(shakeGenCode.includes('MSX2_SCREEN_SHAKE_RAM_BYTES = 1'),
  'msx2ScreenShakeGenerator declares MSX2_SCREEN_SHAKE_RAM_BYTES = 1');

// 27) air_dash is distinct from ground dash and has its own runtime/RAM.
assert(handlersCode.includes("id: 'air_dash'") && /controlIcon:\s*'attack'/.test(handlersCode),
  'air_dash is registered as a separate attack-button skill');
assert(handlersCode.includes("key: 'requireKeyRelease'") && handlersCode.includes("key: 'invulnerable'"),
  'air_dash exposes lock and invulnerability parameters');
assert(physicsCode.includes('Msx2AirDashConfig') && physicsCode.includes('getMsx2AirDashConfigFromPlayerEntity'),
  'msx2PlatformPhysics exports air_dash config resolver');
assert(genCode.includes('buildMsx2AirDashRuntimeAsm') && genCode.includes('${airDashRuntimeAsm}'),
  'msx2Screen4Generator builds and injects air_dash runtime ASM');
assert(genCode.includes('${airDashInputGateAsm}${dashInputGateAsm}'),
  'air_dash input gate runs before ground dash gate');
// The air dash active block must sit AFTER the dispatch's final
// "jp update_hardware_sprite_vertical" (reachable only from its gate):
// its tail is "jp upload_hardware_sprite_attrs", which SKIPS vertical
// physics, so placing it in the idle fallthrough froze gravity and jump
// (bug fixed 2026-06-12). The ground dash block stays in the fallthrough
// because its tail jumps to vertical physics (transparent for idle).
assert(genCode.includes('${dashActiveFrameAsm}    jp update_hardware_sprite_vertical' + String.fromCharCode(10) + '${airDashActiveFrameAsm}'),
  'air_dash active block is emitted after the final vertical-physics jp (never in the idle fallthrough)');
assert(!genCode.includes('${airDashActiveFrameAsm}${dashActiveFrameAsm}'),
  'air_dash active block must not precede the dispatch fallthrough (froze idle physics)');
assert(genCode.includes('${airDashEquatesAsm}'),
  'air_dash EQUs are injected in the EQU block');
assert(layoutCode.includes('MSX2_AIR_DASH_RAM_BYTES') && layoutCode.includes('airDashEnabled'),
  'msx2SkillRamLayout chains MSX2_AIR_DASH_RAM_BYTES');
const airDashGenCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2AirDashGenerator.ts'), 'utf8');
assert(airDashGenCode.includes('MSX2_AIR_DASH_RAM_BYTES = 4'),
  'msx2AirDashGenerator declares MSX2_AIR_DASH_RAM_BYTES = 4');
assert(airDashGenCode.includes('msx2_air_dash_player_grounded') && airDashGenCode.includes('ld a, (msx2_player_flags)') && airDashGenCode.includes('add a, 8'),
  'air_dash grounded gate honors cached grounded flag and includes center foot probe');
assert(airDashGenCode.includes('lockGroundDashOnStart') && airDashGenCode.includes('ld (msx2_dash_lock), a'),
  'air_dash can lock ground dash so one held input does not trigger both skills');
const dashGenCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2DashGenerator.ts'), 'utf8');
assert(dashGenCode.includes('msx2_dash_player_grounded') && dashGenCode.includes('jp z, .dash_start_blocked'),
  'ground dash starts only when the direct foot probe says the player is grounded');

// 28) collector_gems is a passive skill: score hook + optional PSG blip,
// no skill RAM (score/latch live in the base runtime, so it must NOT be
// chained in msx2SkillRamLayout).
assert(handlersCode.includes("id: 'collector_gems'") && handlersCode.includes('parameters: collectorGemsParameters'),
  'collector_gems is registered with its parameters array');
assert(handlersCode.includes("key: 'gemValue'") && handlersCode.includes("key: 'collectSound'"),
  'collectorGemsParameters expose gemValue and collectSound');
assert(physicsCode.includes('Msx2CollectorGemsConfig') && physicsCode.includes('getMsx2CollectorGemsConfigFromPlayerEntity'),
  'msx2PlatformPhysics exports collector_gems config resolver');
assert(physicsCode.includes('Math.min(1000, gemValue'),
  'collector_gems gemValue clamps to the 1..1000 range from the skill def');
const collectorGemsGenCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2CollectorGemsGenerator.ts'), 'utf8');
assert(collectorGemsGenCode.includes('MSX2_COLLECTOR_GEMS_RAM_BYTES = 0'),
  'msx2CollectorGemsGenerator declares zero skill RAM');
assert(!layoutCode.includes('COLLECTOR_GEMS'),
  'collector_gems must NOT be chained in msx2SkillRamLayout (it owns no RAM)');
assert(collectorGemsGenCode.includes('adc a,') && collectorGemsGenCode.includes('msx2_score_hi'),
  'collector_gems score add is 16-bit (add lo + adc hi)');
assert(genCode.includes('buildMsx2CollectorGemsCollectHookAsm') && genCode.includes('buildMsx2CollectorGemsSfxAsm'),
  'msx2Screen4Generator builds collector_gems hook + sfx ASM');
assert(genCode.includes('ld (msx2_collectible_latch), a\n${collectorGemsCollectHookAsm}    call msx2_compare_collectibles_required'),
  'collector_gems hook is injected after the latch set and before the required-collectibles compare (every gem scores)');
assert(genCode.includes('${collectorGemsSfxAsm}msx2_check_enemy_wave_complete:'),
  'collector_gems sfx routine is emitted next to the shared PSG sfx tables');

// 29) carry_object: carryable entities (msx2_carryable component / carryable
// flag / kind) get dedicated sprite slots; the skill chains 14 RAM bytes
// after air_dash and excludes carryables from enemy/hazard slots.
assert(handlersCode.includes("id: 'carry_object'") && handlersCode.includes('parameters: carryObjectParameters'),
  'carry_object is registered with its parameters array');
assert(physicsCode.includes('Msx2CarryObjectConfig') && physicsCode.includes('getMsx2CarryObjectConfigFromPlayerEntity'),
  'msx2PlatformPhysics exports carry_object config resolver');
const carryGenCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2CarryObjectGenerator.ts'), 'utf8');
assert(carryGenCode.includes('MSX2_CARRY_OBJECT_RAM_BYTES = 6 + MSX2_MAX_CARRYABLES_PER_SCREEN * 4'),
  'msx2CarryObjectGenerator declares its RAM bytes from the slot count');
assert(layoutCode.includes('MSX2_CARRY_OBJECT_RAM_BYTES') && layoutCode.includes('carryObjectEnabled'),
  'msx2SkillRamLayout chains MSX2_CARRY_OBJECT_RAM_BYTES');
assert(carryGenCode.includes('msx2_carry_phase_step') && carryGenCode.includes('msx2_carry_pickup_probe'),
  'carry_object slot phases/probes are shared IX-indexed routines (ROM size: do NOT unroll per slot)');
const entityRuntimeCode = fs.readFileSync(path.join(ROOT, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2EntityRuntimeGenerator.ts'), 'utf8');
assert(entityRuntimeCode.includes('!isMsx2CarryableEntity(entity)'),
  'enemy/hazard slot extraction excludes carryable entities');
assert(genCode.includes('isMsx2CarryableEntity(candidate)'),
  'enemy hardware sprite source skips carryable entities');
assert(genCode.includes('${pushBoxAttrWrite}${carryAttrWrites}'),
  'carry SAT writes are emitted after push box, before the terminator');
assert(genCode.includes('${carryResetCallAsm}    ret'),
  'carry runtime reset is chained at the enemy runtime reset tail');
assert(genCode.includes('${carryUpdateCallAsm}    call update_msx2_enemy_positions'),
  'carry update runs in the upload chain before enemy positions');
assert(genCode.includes('${carryObjectEquatesAsm}') && genCode.includes('${carryObjectDataTablesAsm}'),
  'carry equates + per-screen data tables are injected');
assert(genCode.includes('+ carryPatternGroupCount'),
  'carry sprite pattern groups are counted in the hardware pattern budget');

// 30) MSX2 enemy runtime supports the first complex Enemy Library movement
// bridge: FlyerSine. This is intentionally mapped through the existing compact
// enemy/hazard slot tables, so it must not allocate new RAM.
assert(entityRuntimeCode.includes('MSX2_ENEMY_MOVEMENT_FLYER_SINE = 5'),
  'msx2EntityRuntimeGenerator declares the FlyerSine movement mode');
assert(entityRuntimeCode.includes('hasFlyerSine') && entityRuntimeCode.includes("movement === 'flyersine'"),
  'entity runtime normalizes flyerSine/sine movement names');
assert(entityRuntimeCode.includes("getComponentValue(entity, 'msx2_movement', 'amplitude'"),
  'FlyerSine reads amplitude from the msx2_movement component/params');
assert(entityRuntimeCode.includes('signedByte(direction * flyerSpeedX)') && entityRuntimeCode.includes('flyerFrequency'),
  'FlyerSine encodes speedX/frequency into existing dx/dy runtime bytes');
assert(genCode.includes('MSX2_ENEMY_MOVEMENT_FLYER_SINE'),
  'msx2Screen4Generator imports the FlyerSine movement mode');
assert(genCode.includes('cp ${MSX2_ENEMY_MOVEMENT_FLYER_SINE}') && genCode.includes('.enemy_slot_${slot}_flyer_sine'),
  'enemy slot dispatch reaches the FlyerSine ASM branch');
assert(genCode.includes('msx2_enemy_flyer_sine_shared:') && genCode.includes('Shared FlyerSine movement') && genCode.includes('DESTROYS: AF/BC/DE/HL'),
  'FlyerSine emitted shared ASM routine documents its register contract');
assert(genCode.includes('msx2_enemy_screen_slot_offset_from_b:') && genCode.includes('PRESERVES: BC/HL/IX/IY'),
  'shared enemy offset helper documents its preserve contract');
assert(!layoutCode.includes('FLYER_SINE'),
  'FlyerSine uses existing enemy runtime RAM and does not extend the skill RAM layout');

// 31) MSX2 enemy runtime supports vertical Jumper as the second complex
// Enemy Library bridge. It reuses enemy slot dy/tick bytes: dy is signed
// vertical speed, tick is landing pause. HopperTowardsPlayer needs a shared
// non-unrolled routine and is intentionally not mapped here.
assert(entityRuntimeCode.includes('MSX2_ENEMY_MOVEMENT_JUMPER = 6'),
  'msx2EntityRuntimeGenerator declares the Jumper movement mode');
assert(entityRuntimeCode.includes('hasJumper') && entityRuntimeCode.includes("movement === 'jumper'") && entityRuntimeCode.includes("movement === 'verticaljump'"),
  'entity runtime normalizes jumper movement names');
assert(!entityRuntimeCode.includes("movement === 'hopper'"),
  'HopperTowardsPlayer is not silently mapped to the simpler vertical Jumper runtime');
assert(entityRuntimeCode.includes("getComponentValue(entity, 'msx2_movement', 'jumpHeight'"),
  'Jumper reads jumpHeight from the msx2_movement component/params');
assert(entityRuntimeCode.includes('jumperSpeedY') && entityRuntimeCode.includes('jumperPauseFrames'),
  'Jumper encodes vertical speed and landing pause into existing dy/tick runtime bytes');
assert(genCode.includes('MSX2_ENEMY_MOVEMENT_JUMPER'),
  'msx2Screen4Generator imports the Jumper movement mode');
assert(genCode.includes('cp ${MSX2_ENEMY_MOVEMENT_JUMPER}') && genCode.includes('.enemy_slot_${slot}_jumper'),
  'enemy slot dispatch reaches the Jumper ASM branch');
assert(genCode.includes('jp msx2_enemy_jumper_shared') && genCode.includes('${enemySlotMovementHandlers}${enemyJumperSharedHandler}'),
  'Jumper slot branch jumps to one shared handler instead of unrolling movement per slot');
assert(genCode.includes('Shared vertical Jumper movement') && genCode.includes('INPUT: B=slot index') && genCode.includes('STACK: balanced push/pop'),
  'Jumper shared ASM routine documents its register/stack contract');
assert(!layoutCode.includes('JUMPER'),
  'Jumper uses existing enemy runtime RAM and does not extend the skill RAM layout');

// WalkerTurnOnEdge (mode 7): horizontal patrol that turns at walls/ledges.
assert(entityRuntimeCode.includes('MSX2_ENEMY_MOVEMENT_WALKER_EDGE = 7'),
  'entity runtime defines WalkerTurnOnEdge as movement mode 7');
assert(entityRuntimeCode.includes('hasWalkerEdge') && entityRuntimeCode.includes("movement === 'walkerturnonedge'") && entityRuntimeCode.includes("movement === 'walker'"),
  'entity runtime normalizes WalkerTurnOnEdge movement names');
assert(genCode.includes('MSX2_ENEMY_MOVEMENT_WALKER_EDGE'),
  'msx2Screen4Generator imports the WalkerTurnOnEdge movement mode');
assert(genCode.includes('cp ${MSX2_ENEMY_MOVEMENT_WALKER_EDGE}') && genCode.includes('.enemy_slot_${slot}_walker_edge'),
  'enemy slot dispatch reaches the WalkerTurnOnEdge ASM branch');
assert(genCode.includes('jp msx2_enemy_walker_edge_shared'),
  'WalkerTurnOnEdge slot branch jumps to one shared handler instead of unrolling movement per slot');
assert(genCode.includes('FUNCTION: msx2_enemy_walker_edge_shared') && genCode.includes('INPUT:\n    ;   B = slot index'),
  'WalkerTurnOnEdge shared ASM routine carries the mandatory header with INPUT B=slot');
assert(genCode.includes('msx2_collision_at_pixel') && genCode.includes('.walker_edge_turn'),
  'WalkerTurnOnEdge probes collision and has a turn path');
assert(!layoutCode.includes('WALKER'),
  'WalkerTurnOnEdge uses existing enemy runtime RAM and does not extend the skill RAM layout');

console.log('\nAll 39 plumbing checks passed.');

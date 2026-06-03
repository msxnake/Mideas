import { getSkill, getAllSkills } from './registry';
import { SkillDef } from './types';

export interface SkillBindingEntry {
  primary: string;
  secondary?: string;
}

export interface StateMachineOptions {
  jumpImpulseLo: string;
  jumpImpulseHi: string;
  doubleJumpImpulseLo: string;
  doubleJumpImpulseHi: string;
  gravityStrength: string;
  terminalHigh: string;
  terminalWord: string;
  maxJumps: number;
  requireKeyRelease: boolean;
  jumpEnabled: boolean;
  gravityEnabled: boolean;
  hbLeft: number;
  hbFeet: number;
  hbRight: number;
  hbCenterX: number;
  hbCenterY: number;
  setPlayerWalkingFlagAsm: string;
  clearPlayerWalkingFlagAsm: string;
  activeSkillIds: string[];
  skillBindings: Record<string, SkillBindingEntry>;
}

function hasSkill(id: string, activeIds: string[]): boolean {
  return activeIds.includes(id);
}

function getControlIdFromBinding(binding: SkillBindingEntry): string {
  return binding.primary;
}

/** Map a binding primary/secondary to the ASM input check routine name. */
function bindingToCheckRoutine(ctrl: string): string | null {
  switch (ctrl) {
    case 'jump': return 'msx2_control_jump_pressed';
    case 'attack': return 'msx2_control_action_pressed';
    default: return null; // directions handled inline
  }
}

/** Map a binding to an inline ASM condition that tests whether that direction is pressed.
 *  Returns null if not a direction binding. */
function bindingToDirectionInline(ctrl: string): string | null {
  switch (ctrl) {
    case 'left':
      return [
        '    call msx2_read_player_horizontal_input',
        '    cp #FF',
      ].join('\n');
    case 'right':
      return [
        '    call msx2_read_player_horizontal_input',
        '    cp 1',
      ].join('\n');
    case 'up':
      return [
        '    call msx2_read_player_vertical_input',
        '    cp #FF',
      ].join('\n');
    case 'down':
      return [
        '    call msx2_read_player_vertical_input',
        '    cp 1',
      ].join('\n');
    default: return null;
  }
}

/**
 * Returns ASM that checks a single control id.
 * Assumes A=0/non-zero is accessible after the check; uses `jp z, failLabel` / `jp nz, successLabel`.
 * Sets Z flag appropriately.
 */
function buildControlCheck(ctrl: string, failLabel: string): string {
  const routine = bindingToCheckRoutine(ctrl);
  if (routine) {
    return [
      `    call ${routine}`,
      `    or a`,
      `    jp z, ${failLabel}`,
    ].join('\n');
  }
  const dirInline = bindingToDirectionInline(ctrl);
  if (dirInline) {
    return `${dirInline}\n    jp nz, ${failLabel}`;
  }
  return `    ; unknown control "${ctrl}" — skipping\n    jp ${failLabel}`;
}

/** Build a combined check that tests ALL required controls (combo). Falls to failLabel if ANY fails. */
function buildComboCheck(binding: SkillBindingEntry, failLabel: string): string {
  const checks: string[] = [];
  checks.push(buildControlCheck(binding.primary, failLabel));
  if (binding.secondary && binding.secondary !== 'none') {
    checks.push(buildControlCheck(binding.secondary, failLabel));
  }
  return checks.join('\n');
}

function buildStateEnum(activeIds: string[]): string {
  const lines = [
    'PLAYER_STATE_GROUNDED    EQU 0',
    'PLAYER_STATE_RUNNING     EQU 1',
    'PLAYER_STATE_JUMPING     EQU 2',
    'PLAYER_STATE_FALLING     EQU 3',
  ];
  const optionalSkills = getAllSkills().filter(s => !s.required);
  let idx = 4;
  for (const skill of optionalSkills) {
    if (activeIds.includes(skill.id)) {
      for (const state of skill.addsStates) {
        const label = `PLAYER_STATE_${state.toUpperCase().replace(/ /g, '_')}`;
        lines.push(`${label}    EQU ${idx}`);
        idx++;
      }
    }
  }
  return lines.join('\n');
}

function buildDispatcher(): string {
  return `
    ld a, (msx2_player_state)
    cp PLAYER_STATE_GROUNDED
    jp z, msx2_player_state_grounded
    cp PLAYER_STATE_RUNNING
    jp z, msx2_player_state_grounded
    cp PLAYER_STATE_JUMPING
    jp z, msx2_player_state_jumping
    cp PLAYER_STATE_FALLING
    jp z, msx2_player_state_falling
    ; fallback: default to grounded
    xor a
    ld (msx2_player_state), a
    jp msx2_player_state_grounded
`;
}

function buildSlashState(o: StateMachineOptions, stateName: string): string {
  const maxSlots = 8;
  const slotChecks = Array.from({ length: maxSlots }, (_, slot) => {
    const xOff = slot === 0 ? '' : ` + ${slot}`;
    const yOff = slot === 0 ? '' : ` + ${slot}`;
    return `
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp ${slot + 1}
    jp c, .sn_${slot}
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbCenterX}
    ld b, a
    ld a, (msx2_enemy_runtime_x${xOff})
    cp b
    jp nc, .sn_${slot}
    add a, 15
    cp b
    jp c, .sn_${slot}
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbCenterY}
    ld b, a
    ld a, (msx2_enemy_runtime_y${yOff})
    cp b
    jp nc, .sn_${slot}
    add a, 15
    cp b
    jp c, .sn_${slot}
    ld a, 240
    ld (msx2_enemy_runtime_y${yOff}), a
    call msx2_sfx_hit
.sn_${slot}:`;
  }).join('');
  return `
msx2_player_state_${stateName}:
    ; --- SLASHING ---
    ld hl, msx2_player_slash_timer
    ld a, (hl)
    or a
    jp nz, .slash_decrement
    ld (hl), 10
${slotChecks}
    jp msx2_state_machine_exit
.slash_decrement:
    dec (hl)
    jp nz, msx2_state_machine_exit
    ld a, PLAYER_STATE_GROUNDED
    ld (msx2_player_state), a
    jp msx2_state_machine_exit
`;
}

function buildDoubleJumpState(o: StateMachineOptions, stateName: string): string {
  return `
msx2_player_state_${stateName}:
    ; --- DOUBLE JUMPING ---
    call msx2_apply_platform_gravity
    call msx2_read_player_horizontal_input
    ld (msx2_player_sprite_dx), a
    ; first-frame impulse if gravity_vel is zero
    ld hl, msx2_player_gravity_vel
    ld a, (hl)
    or a
    jp nz, .dj_grav
    inc hl
    ld a, (hl)
    or a
    jp nz, .dj_grav
    ld hl, msx2_player_gravity_vel
    ld (hl), ${o.doubleJumpImpulseLo}
    inc hl
    ld (hl), ${o.doubleJumpImpulseHi}
.dj_grav:
    ld hl, msx2_player_gravity_vel + 1
    ld a, (hl)
    or a
    jp z, .dj_fall
    bit 7, a
    jp nz, .dj_fall
.dj_move:
    ; check collision above (left)
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    dec a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .dj_head
    ; check collision above (right)
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    dec a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .dj_head
    ; move up one pixel
    ld a, (msx2_player_sprite_y)
    or a
    jp z, .dj_done
    dec a
    ld (msx2_player_sprite_y), a
.dj_done:
    jp msx2_state_machine_exit
.dj_head:
    call msx2_clear_vertical_velocity
.dj_fall:
    ld a, PLAYER_STATE_FALLING
    ld (msx2_player_state), a
    jp msx2_player_state_falling
`;
}

function buildOptionalStates(o: StateMachineOptions): string {
  const optionalSkills = getAllSkills().filter(s => !s.required);
  const blocks: string[] = [];
  for (const skill of optionalSkills) {
    if (!o.activeSkillIds.includes(skill.id)) continue;
    for (const state of skill.addsStates) {
      switch (skill.id) {
        case 'double_jump':
          blocks.push(buildDoubleJumpState(o, state));
          break;
        case 'slash':
          blocks.push(buildSlashState(o, state));
          break;
        default:
          blocks.push(`msx2_player_state_${state}:`);
          blocks.push(`    ; ${skill.label} — ${state}`);
          blocks.push(`    ; handler not yet implemented`);
          blocks.push(`    ld a, PLAYER_STATE_GROUNDED`);
          blocks.push(`    ld (msx2_player_state), a`);
          blocks.push(`    jp msx2_state_machine_exit`);
          blocks.push(``);
      }
    }
  }
  return blocks.join('\n');
}

/**
 * Build input-dispatch checks for optional skills in the grounded handler.
 * Checks each active skill's binding; on match transitions to that skill's first state.
 */
function buildOptionalSkillDispatches(o: StateMachineOptions): string {
  const optionalSkills = getAllSkills().filter(s => !s.required);
  const blocks: string[] = [];
  let labelIdx = 0;

  for (const skill of optionalSkills) {
    if (!o.activeSkillIds.includes(skill.id)) continue;
    if (skill.addsStates.length === 0) continue;

    const binding = o.skillBindings[skill.id];
    if (!binding) continue;

    const failLabel = `.skill_no_${labelIdx}`;
    const stateEnum = `PLAYER_STATE_${skill.addsStates[0].toUpperCase().replace(/ /g, '_')}`;

    blocks.push(buildComboCheck(binding, failLabel));
    blocks.push(`    ld a, ${stateEnum}`);
    blocks.push(`    ld (msx2_player_state), a`);
    blocks.push(`    jp msx2_player_state_${skill.addsStates[0]}`);
    blocks.push(`${failLabel}:`);
    labelIdx++;
  }

  return blocks.join('\n');
}

function buildGroundedState(o: StateMachineOptions): string {
  return `
msx2_player_state_grounded:
    ; --- GROUNDED ---
    call msx2_read_player_horizontal_input
    ld (msx2_player_sprite_dx), a
    or a
    jp z, .gnd_idle
${o.setPlayerWalkingFlagAsm}    jp .gnd_check
.gnd_idle:
${o.clearPlayerWalkingFlagAsm}
.gnd_check:
    ; --- optional skill input dispatch ---
${buildOptionalSkillDispatches(o)}
    ; --- core jump transition ---
${o.jumpEnabled ? `    call msx2_control_jump_pressed
    or a
    jp z, .gnd_check_ground
    ld a, PLAYER_STATE_JUMPING
    ld (msx2_player_state), a
    jp msx2_player_state_jumping
.gnd_check_ground:
` : ''}
    ; check ground below
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .gnd_stay
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .gnd_stay
    call msx2_clear_grounded_flag
    ld a, PLAYER_STATE_FALLING
    ld (msx2_player_state), a
    jp msx2_player_state_falling
.gnd_stay:
    call msx2_set_grounded_flag
    jp msx2_state_machine_exit
`;
}

function buildJumpingState(o: StateMachineOptions): string {
  const doubleJumpCheck = hasSkill('double_jump', o.activeSkillIds) ? `
    ld a, (msx2_player_jump_count)
    cp 1
    jp nz, .jmp_no_double
    push bc
    call msx2_control_jump_pressed
    pop bc
    or a
    jp z, .jmp_no_double
    ld a, 2
    ld (msx2_player_jump_count), a
    ld a, PLAYER_STATE_DOUBLE_JUMPING
    ld (msx2_player_state), a
    jp msx2_player_state_double_jumping
.jmp_no_double:` : '';

  return `
msx2_player_state_jumping:
    ; --- JUMPING ---
    ld a, (msx2_player_state)
    ld (msx2_player_state_prev), a
    ld hl, msx2_player_gravity_vel
    ld a, (hl)
    or a
    jp nz, .jmp_grav
    inc hl
    ld a, (hl)
    or a
    jp nz, .jmp_grav
    ld hl, msx2_player_gravity_vel
    ld (hl), ${o.jumpImpulseLo}
    inc hl
    ld (hl), ${o.jumpImpulseHi}
.jmp_grav:
${o.gravityEnabled ? `    call msx2_apply_platform_gravity
` : ''}
    call msx2_read_player_horizontal_input
    ld (msx2_player_sprite_dx), a
${doubleJumpCheck}
    ld hl, msx2_player_gravity_vel + 1
    ld a, (hl)
    or a
    jp z, .jmp_fall
    bit 7, a
    jp nz, .jmp_fall
.jmp_move:
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    dec a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .jmp_head
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    dec a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .jmp_head
    ld a, (msx2_player_sprite_y)
    or a
    jp z, .jmp_done
    dec a
    ld (msx2_player_sprite_y), a
.jmp_done:
    jp msx2_state_machine_exit
.jmp_head:
    call msx2_clear_vertical_velocity
.jmp_fall:
    ld a, PLAYER_STATE_FALLING
    ld (msx2_player_state), a
    jp msx2_player_state_falling
`;
}

function buildFallingState(o: StateMachineOptions): string {
  return `
msx2_player_state_falling:
    ; --- FALLING ---
${o.gravityEnabled ? `    call msx2_apply_platform_gravity
` : ''}
    call msx2_read_player_horizontal_input
    ld (msx2_player_sprite_dx), a
    ld hl, msx2_player_gravity_vel + 1
    ld a, (hl)
    or a
    jp z, .fal_chk
    bit 7, a
    jp nz, .fal_chk
    ld d, a
.fal_loop:
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    inc a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .fal_land
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    inc a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .fal_land
    ld a, (msx2_player_sprite_y)
    inc a
    cp 196
    jp nc, .fal_done
    ld (msx2_player_sprite_y), a
    dec d
    ld a, d
    or a
    jp nz, .fal_loop
    jp .fal_done
.fal_chk:
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .fal_land
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp z, .fal_done
.fal_land:
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld a, #01
    ld (msx2_player_flags), a
    ld a, PLAYER_STATE_GROUNDED
    ld (msx2_player_state), a
.fal_done:
    jp msx2_state_machine_exit
`;
}

function buildHelpers(o: StateMachineOptions): string {
  return `
; --- State machine helpers ---
msx2_read_player_horizontal_input:
    push bc
    xor a
    call GTSTCK
    pop bc
    cp 3
    jp z, .hr
    cp 4
    jp z, .hr
    cp 2
    jp z, .hr
    cp 7
    jp z, .hl
    cp 8
    jp z, .hl
    cp 6
    jp z, .hl
    xor a
    ret
.hr:
    ld a, 1
    ret
.hl:
    ld a, #FF
    ret

msx2_read_player_vertical_input:
    push bc
    xor a
    call GTSTCK
    pop bc
    cp 1
    jp z, .vu
    cp 2
    jp z, .vu
    cp 8
    jp z, .vu
    cp 5
    jp z, .vd
    cp 4
    jp z, .vd
    cp 6
    jp z, .vd
    xor a
    ret
.vu:
    ld a, #FF
    ret
.vd:
    ld a, 1
    ret

msx2_set_grounded_flag:
    ld a, (msx2_player_flags)
    or #01
    ld (msx2_player_flags), a
    ret

msx2_clear_grounded_flag:
    ld a, (msx2_player_flags)
    and #FE
    ld (msx2_player_flags), a
    ret

msx2_clear_vertical_velocity:
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ret

msx2_apply_platform_gravity:
    ld hl, msx2_player_gravity_vel
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    add a, ${o.gravityStrength}
    ld e, a
    ld a, d
    adc a, #00
    ld d, a
    ld a, d
    bit 7, a
    jp nz, .store
    cp ${o.terminalHigh}
    jp c, .store
    ld de, ${o.terminalWord}
.store:
    ld hl, msx2_player_gravity_vel
    ld (hl), e
    inc hl
    ld (hl), d
    ret
`;
}

export function buildPlayerStateMachineAsm(o: StateMachineOptions): string {
  const lines: string[] = [];
  lines.push('; --- Player State Machine ---');
  lines.push(buildStateEnum(o.activeSkillIds));
  lines.push('');
  lines.push('msx2_player_state_machine_tick:');
  lines.push(buildDispatcher());
  lines.push('');
  lines.push(buildGroundedState(o));
  lines.push(buildJumpingState(o));
  lines.push(buildFallingState(o));
  if (o.activeSkillIds.length > 0) {
    const opt = buildOptionalStates(o);
    if (opt.trim()) {
      lines.push('; --- Optional skill states ---');
      lines.push(opt);
    }
  }
  lines.push('msx2_state_machine_exit:');
  lines.push('    jp apply_msx2_conveyor');
  lines.push('');
  lines.push(buildHelpers(o));
  return lines.join('\n');
}

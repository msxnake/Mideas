import { getSkill, getAllSkills } from './registry';
import { SkillDef } from './types';

export interface StateMachineOptions {
  jumpImpulseLo: string;
  jumpImpulseHi: string;
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
}

function hasSkill(id: string, activeIds: string[]): boolean {
  return activeIds.includes(id);
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

function buildDispatcher(activeIds: string[]): string {
  const coreJumps = [
    `    cp PLAYER_STATE_GROUNDED`,
    `    jp z, msx2_player_state_grounded`,
    `    cp PLAYER_STATE_RUNNING`,
    `    jp z, msx2_player_state_grounded`,
    `    cp PLAYER_STATE_JUMPING`,
    `    jp z, msx2_player_state_jumping`,
    `    cp PLAYER_STATE_FALLING`,
    `    jp z, msx2_player_state_falling`,
  ];
  const optionalSkills = getAllSkills().filter(s => !s.required);
  for (const skill of optionalSkills) {
    if (activeIds.includes(skill.id)) {
      for (const state of skill.addsStates) {
        const label = `PLAYER_STATE_${state.toUpperCase().replace(/ /g, '_')}`;
        coreJumps.push(`    cp ${label}`);
        coreJumps.push(`    jp z, msx2_player_state_${state}`);
      }
    }
  }
  coreJumps.push(`    ; fallback: default to grounded`);
  coreJumps.push(`    xor a`);
  coreJumps.push(`    ld (msx2_player_state), a`);
  coreJumps.push(`    jp msx2_player_state_grounded`);
  return [
    'msx2_player_state_machine_tick:',
    `    ld a, (msx2_player_state)`,
    ...coreJumps,
  ].join('\n    ');
}

function buildOptionalStates(activeIds: string[]): string {
  const optionalSkills = getAllSkills().filter(s => !s.required);
  const blocks: string[] = [];
  for (const skill of optionalSkills) {
    if (activeIds.includes(skill.id)) {
      for (const state of skill.addsStates) {
        blocks.push(`msx2_player_state_${state}:`);
        blocks.push(`    ; ${skill.label} — ${state}`);
        blocks.push(`    ; handler not yet implemented`);
        blocks.push(`    ret`);
        blocks.push(``);
      }
    }
  }
  return blocks.join('\n');
}

function buildGroundedState(o: StateMachineOptions): string {
  return `
msx2_player_state_grounded:
    ; --- GROUNDED ---
    ; apply horizontal input
    call msx2_read_player_horizontal_input
    ld (msx2_player_sprite_dx), a
    or a
    jp z, .grounded_idle
${o.setPlayerWalkingFlagAsm}    jp .grounded_check_transitions
.grounded_idle:
${o.clearPlayerWalkingFlagAsm}
.grounded_check_transitions:
    ; transition: jump key pressed
${o.jumpEnabled ? `    call msx2_control_jump_pressed
    or a
    jp nz, msx2_player_state_jumping` : ''}
    ; transition: no ground below
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp z, .grounded_check_right_foot
    ; hit solid below → stay grounded
    call msx2_set_grounded_flag
    jp upload_hardware_sprite_attrs
.grounded_check_right_foot:
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp nz, msx2_land_player
    ; no ground → fall
    call msx2_clear_grounded_flag
    ld a, PLAYER_STATE_FALLING
    ld (msx2_player_state), a
    jp upload_hardware_sprite_attrs
`;
}

function buildJumpingState(o: StateMachineOptions): string {
  const doubleJumpCheck = hasSkill('double_jump', o.activeSkillIds) ? `
    ; double_jump: allow second jump in mid-air
    ld a, (msx2_player_jump_count)
    cp 1
    jp nz, .jumping_no_double
    call msx2_control_jump_pressed
    or a
    jp z, .jumping_no_double
    ld a, 2
    ld (msx2_player_jump_count), a
    jp msx2_player_state_double_jumping
.jumping_no_double:` : '';

  return `
msx2_player_state_jumping:
    ; --- JUMPING ---
    ; save previous state for first-frame detection
    ld a, (msx2_player_state)
    ld (msx2_player_state_prev), a
    ; apply initial impulse if not already jumping
    ld hl, msx2_player_gravity_vel
    ld a, (hl)
    or a
    jp nz, .jumping_apply_gravity
    inc hl
    ld a, (hl)
    or a
    jp nz, .jumping_apply_gravity
    ; first frame: set impulse
    ld hl, msx2_player_gravity_vel
    ld (hl), ${o.jumpImpulseLo}
    inc hl
    ld (hl), ${o.jumpImpulseHi}
.jumping_apply_gravity:
${o.gravityEnabled ? `    ; apply gravity
    call msx2_apply_platform_gravity
` : ''}
    ; apply horizontal input
    call msx2_read_player_horizontal_input
    ld (msx2_player_sprite_dx), a
${doubleJumpCheck}
    ; move up using gravity vel
    ld hl, msx2_player_gravity_vel
    ld a, (hl)
    or a
    jp nz, .jumping_move
    inc hl
    ld a, (hl)
    or a
    jp z, .jumping_falling
.jumping_move:
    ; check collision above
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    dec a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .jumping_hit_head
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    dec a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .jumping_hit_head
    ; move up
    ld a, (msx2_player_sprite_y)
    or a
    jp z, upload_hardware_sprite_attrs
    dec a
    ld (msx2_player_sprite_y), a
    jp upload_hardware_sprite_attrs
.jumping_hit_head:
    call msx2_clear_vertical_velocity
.jumping_falling:
    ld a, PLAYER_STATE_FALLING
    ld (msx2_player_state), a
    jp upload_hardware_sprite_attrs
`;
}

function buildFallingState(o: StateMachineOptions): string {
  return `
msx2_player_state_falling:
    ; --- FALLING ---
${o.gravityEnabled ? `    ; apply gravity
    call msx2_apply_platform_gravity
` : ''}
    ; apply horizontal input
    call msx2_read_player_horizontal_input
    ld (msx2_player_sprite_dx), a
    ; move down using gravity vel
    ld hl, msx2_player_gravity_vel
    inc hl
    ld a, (hl)
    or a
    jp z, .falling_check_grounded
    bit 7, a
    jp nz, .falling_check_grounded
    ld d, a
.falling_loop:
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    inc a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .falling_land
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    inc a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .falling_land
    ld a, (msx2_player_sprite_y)
    inc a
    cp 196
    jp nc, upload_hardware_sprite_attrs
    ld (msx2_player_sprite_y), a
    dec d
    ld a, d
    or a
    jp nz, .falling_loop
    jp upload_hardware_sprite_attrs
.falling_check_grounded:
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .falling_land
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp z, upload_hardware_sprite_attrs
.falling_land:
    call msx2_land_player
    call apply_msx2_conveyor
    ld a, PLAYER_STATE_GROUNDED
    ld (msx2_player_state), a
    jp upload_hardware_sprite_attrs
`;
}

function buildHelpers(o: StateMachineOptions): string {
  return `
; --- State machine helpers ---
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

msx2_land_player:
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld a, #01
    ld (msx2_player_flags), a
    ret

msx2_apply_platform_gravity:
    ; 8.8 fixed-point gravity: adds configured strength to accumulator. Clobbers AF/DE/HL.
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
    jp nz, .store_gravity_vel
    cp ${o.terminalHigh}
    jp c, .store_gravity_vel
    ld de, ${o.terminalWord}
.store_gravity_vel:
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
  lines.push(buildDispatcher(o.activeSkillIds));
  lines.push('');
  lines.push(buildGroundedState(o));
  lines.push(buildJumpingState(o));
  lines.push(buildFallingState(o));
  if (o.activeSkillIds.length > 0) {
    const opt = buildOptionalStates(o.activeSkillIds);
    if (opt.trim()) {
      lines.push('; --- Optional skill states ---');
      lines.push(opt);
    }
  }
  lines.push(buildHelpers(o));
  return lines.join('\n');
}

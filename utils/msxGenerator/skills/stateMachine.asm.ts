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

function buildOptionalStates(activeIds: string[]): string {
  const optionalSkills = getAllSkills().filter(s => !s.required);
  const blocks: string[] = [];
  for (const skill of optionalSkills) {
    if (activeIds.includes(skill.id)) {
      for (const state of skill.addsStates) {
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

function buildGroundedState(o: StateMachineOptions): string {
  return `
msx2_player_state_grounded:
    ; --- GROUNDED ---
    call msx2_read_player_horizontal_input
    ld (msx2_player_sprite_dx), a
    or a
    jp z, .grounded_idle
${o.setPlayerWalkingFlagAsm}    jp .grounded_check_transitions
.grounded_idle:
${o.clearPlayerWalkingFlagAsm}
.grounded_check_transitions:
${o.jumpEnabled ? `    call msx2_control_jump_pressed
    or a
    jp z, .grounded_check_ground
    ld a, PLAYER_STATE_JUMPING
    ld (msx2_player_state), a
    jp msx2_player_state_jumping
.grounded_check_ground:
` : ''}
    ; check ground below left foot
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .grounded_stay
    ; check ground below right foot
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .grounded_stay
    ; no ground below → fall
    call msx2_clear_grounded_flag
    ld a, PLAYER_STATE_FALLING
    ld (msx2_player_state), a
    jp msx2_player_state_falling
.grounded_stay:
    call msx2_set_grounded_flag
    jp msx2_state_machine_exit
`;
}

function buildJumpingState(o: StateMachineOptions): string {
  const doubleJumpCheck = hasSkill('double_jump', o.activeSkillIds) ? `
    ld a, (msx2_player_jump_count)
    cp 1
    jp nz, .jumping_no_double
    push bc
    call msx2_control_jump_pressed
    pop bc
    or a
    jp z, .jumping_no_double
    ld a, 2
    ld (msx2_player_jump_count), a
    ld a, PLAYER_STATE_DOUBLE_JUMPING
    ld (msx2_player_state), a
    jp msx2_player_state_double_jumping
.jumping_no_double:` : '';

  return `
msx2_player_state_jumping:
    ; --- JUMPING ---
    ld a, (msx2_player_state)
    ld (msx2_player_state_prev), a
    ; first-frame impulse if gravity_vel is zero
    ld hl, msx2_player_gravity_vel
    ld a, (hl)
    or a
    jp nz, .jumping_apply_gravity
    inc hl
    ld a, (hl)
    or a
    jp nz, .jumping_apply_gravity
    ld hl, msx2_player_gravity_vel
    ld (hl), ${o.jumpImpulseLo}
    inc hl
    ld (hl), ${o.jumpImpulseHi}
.jumping_apply_gravity:
${o.gravityEnabled ? `    call msx2_apply_platform_gravity
` : ''}
    call msx2_read_player_horizontal_input
    ld (msx2_player_sprite_dx), a
${doubleJumpCheck}
    ; read gravity vel hi-byte for ascent check
    ld hl, msx2_player_gravity_vel + 1
    ld a, (hl)
    or a
    jp z, .jumping_falling
    bit 7, a
    jp nz, .jumping_falling
.jumping_move:
    ; check collision above (left)
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    dec a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .jumping_hit_head
    ; check collision above (right)
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    dec a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .jumping_hit_head
    ; move up one pixel
    ld a, (msx2_player_sprite_y)
    or a
    jp z, .jumping_done
    dec a
    ld (msx2_player_sprite_y), a
.jumping_done:
    jp msx2_state_machine_exit
.jumping_hit_head:
    call msx2_clear_vertical_velocity
.jumping_falling:
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
    ; read gravity vel hi-byte for fall speed
    ld hl, msx2_player_gravity_vel + 1
    ld a, (hl)
    or a
    jp z, .falling_check_grounded
    bit 7, a
    jp nz, .falling_check_grounded
    ld d, a
.falling_loop:
    ; check collision below (left)
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbLeft}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    inc a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .falling_land
    ; check collision below (right)
    ld a, (msx2_player_sprite_x)
    add a, ${o.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${o.hbFeet}
    inc a
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .falling_land
    ; move down
    ld a, (msx2_player_sprite_y)
    inc a
    cp 196
    jp nc, .falling_done
    ld (msx2_player_sprite_y), a
    dec d
    ld a, d
    or a
    jp nz, .falling_loop
    jp .falling_done
.falling_check_grounded:
    ; check ground at feet (before gravity pull)
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
    jp z, .falling_done
.falling_land:
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld a, #01
    ld (msx2_player_flags), a
    ld a, PLAYER_STATE_GROUNDED
    ld (msx2_player_state), a
.falling_done:
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
    jp z, .right
    cp 4
    jp z, .right
    cp 2
    jp z, .right
    cp 7
    jp z, .left
    cp 8
    jp z, .left
    cp 6
    jp z, .left
    xor a
    ret
.right:
    ld a, 1
    ret
.left:
    ld a, #FF
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
    const opt = buildOptionalStates(o.activeSkillIds);
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

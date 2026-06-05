import { SpriteLayout } from '../types';
import { buildPlayerStateMachineAsm } from '../../../../skills/stateMachine.asm';
import { V2Options, Msx2PlatformPhysicsConfig } from '../types';
import { formatAsmByte } from '../../../../../msx2PlatformPhysics';

export function generateStateMachine(analysis: any, layout: SpriteLayout, physics: Msx2PlatformPhysicsConfig, options: V2Options): string {
  const jumpEnabled = physics.jumpEnabled;
  const gravityEnabled = physics.gravityEnabled;
  const maxJumps = physics.maxJumps;
  const requireKeyRelease = physics.requireKeyRelease;

  const djImpulse = Math.round(physics.jumpImpulse88 * 0.7);
  const djImpulseLo = (djImpulse & 0xFF).toString(16).toUpperCase().padStart(2, '0');
  const djImpulseHi = ((djImpulse >> 8) & 0xFF).toString(16).toUpperCase().padStart(2, '0');

  const activeSkillIds: string[] = [];
  const skillBindings: Record<string, { primary: string; secondary?: string }> = {};

  const sm = buildPlayerStateMachineAsm({
    jumpImpulseLo: formatAsmByte(physics.jumpImpulse88),
    jumpImpulseHi: formatAsmByte(physics.jumpImpulse88 >> 8),
    doubleJumpImpulseLo: `#${djImpulseLo}`,
    doubleJumpImpulseHi: `#${djImpulseHi}`,
    gravityStrength: formatAsmByte(physics.gravityStrength88),
    terminalHigh: formatAsmByte(getTerminalVelocityHighByte(physics.terminalVelocity88)),
    terminalWord: `#${(physics.terminalVelocity88 & 0xFF).toString(16).toUpperCase().padStart(2, '0')}${((physics.terminalVelocity88 >> 8) & 0xFF).toString(16).toUpperCase().padStart(2, '0')}`,
    maxJumps,
    requireKeyRelease,
    jumpEnabled,
    gravityEnabled,
    hbLeft: layout.hbLeft,
    hbFeet: layout.hbFeet,
    hbRight: layout.hbRight,
    hbCenterX: layout.hbCenterX,
    hbCenterY: layout.hbCenterY,
    setPlayerWalkingFlagAsm: layout.setPlayerWalkingFlagAsm,
    clearPlayerWalkingFlagAsm: layout.clearPlayerWalkingFlagAsm,
    activeSkillIds,
    skillBindings,
  });

  const usesVertical = layout.usesVerticalPhysics;

  return `
msx2_update_hardware_sprite_vertical:
    ; Player state machine (platform mode with skills).
    ; Clobbers AF/BC/DE/HL.
${usesVertical ? `    jp msx2_player_state_machine_tick` : `    jp upload_hardware_sprite_attrs`}

${usesVertical ? sm : ''}

apply_msx2_conveyor:
    ; Behavior code 2 pushes right, code 3 pushes left. Clobbers AF/BC/DE/HL.
    call msx2_behavior_below_player_center
    cp 2
    jp z, .conveyor_right
    cp 3
    jp z, .conveyor_left
    ret
.conveyor_right:
    ld a, (msx2_player_sprite_x)
    cp ${layout.patrolBounds.maxX}
    ret nc
    add a, ${layout.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${layout.hbCenterY}
    ld c, a
    call msx2_collision_at_pixel
    ret nz
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_facing_dx), a
${layout.setPlayerWalkingFlagAsm}    ret
.conveyor_left:
    ld a, (msx2_player_sprite_x)
    cp ${layout.patrolBounds.minX}
    ret z
    ret c
    add a, ${layout.hbLeft - 1}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${layout.hbCenterY}
    ld c, a
    call msx2_collision_at_pixel
    ret nz
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_facing_dx), a
${layout.setPlayerWalkingFlagAsm}    ret

msx2_ladder_at_player_center:
    ld a, (msx2_player_sprite_x)
    add a, ${layout.hbCenterX}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${layout.hbCenterY}
    ld c, a
    call msx2_collision_at_pixel
    cp 4
    ret

msx2_ladder_below_player_center:
    ld a, (msx2_player_sprite_x)
    add a, ${layout.hbCenterX}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${layout.hbCenterY + 1}
    ld c, a
    call msx2_collision_at_pixel
    cp 4
    ret

msx2_rope_at_player_center:
    ld a, (msx2_player_sprite_x)
    add a, ${layout.hbCenterX}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${layout.hbCenterY}
    ld c, a
    call msx2_collision_at_pixel
    cp 5
    ret

msx2_behavior_below_player_center:
    ld a, (msx2_player_sprite_x)
    add a, ${layout.hbCenterX}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${layout.hbFeet + 1}
    ld c, a
    call msx2_cell_behavior_at_pixel
    ret
`;
}

function getTerminalVelocityHighByte(terminalVelocity88: number): number {
  return Math.min(7, Math.max(1, (terminalVelocity88 >> 8) & 0xFF));
}

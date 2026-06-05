import { SpriteLayout } from '../types';
import { Msx2PlatformPhysicsConfig } from '../types';
import { V2Options } from '../types';

export function generateMovement(analysis: any, layout: SpriteLayout, physics: Msx2PlatformPhysicsConfig, options: V2Options): string {
  return `
move_hardware_sprite_right:
    ld a, (msx2_player_sprite_x)
    cp ${layout.patrolBounds.maxX}
    jp nc, msx2_try_world_edge_transition_right
    ld a, (msx2_player_sprite_x)
    add a, ${layout.hbRight}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${layout.hbCenterY}
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .right_blocked
.right_move_player:
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_facing_dx), a
${layout.setPlayerWalkingFlagAsm}    jp finish_msx2_horizontal_move
.right_blocked:
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_facing_dx), a
    jp finish_msx2_horizontal_move

move_hardware_sprite_left:
    ld a, (msx2_player_sprite_x)
    cp ${layout.patrolBounds.minX}
    jp z, msx2_try_world_edge_transition_left
    jp c, msx2_try_world_edge_transition_left
    ld a, (msx2_player_sprite_x)
    add a, ${layout.hbLeft - 1}
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, ${layout.hbCenterY}
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .left_blocked
.left_move_player:
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_facing_dx), a
${layout.setPlayerWalkingFlagAsm}    jp finish_msx2_horizontal_move
.left_blocked:
    xor a
    ld (msx2_player_sprite_dx), a
    ld (msx2_player_facing_dx), a
    jp finish_msx2_horizontal_move

finish_msx2_horizontal_move:
    call msx2_rope_at_player_center
    jp z, hold_msx2_rope
    jp msx2_update_hardware_sprite_vertical
`;
}

import { Msx2TeleportABConfig } from '../../../msx2PlatformPhysics';
import { buildMsx2SkillRamOptions, resolveMsx2SkillExtensionRamBase } from './msx2SkillRamLayout';
import { buildMsx2SkillPressedRoutine } from './msx2SkillControlsGenerator';

export const MSX2_TELEPORT_AB_RAM_BYTES = 8;

function formatAsmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function formatAsmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function resolveMsx2TeleportABRamBase(pushBoxMovement: boolean, dashEnabled: boolean): number {
  return resolveMsx2SkillExtensionRamBase(
    buildMsx2SkillRamOptions(pushBoxMovement, dashEnabled, false),
  );
}

function buildTeleportPressedRoutine(config: Msx2TeleportABConfig): string {
  return buildMsx2SkillPressedRoutine(
    'msx2_control_teleport_pressed',
    'teleport skill',
    config.primaryControl,
    config.secondaryControl,
  );
}

export function buildMsx2TeleportABEquates(ramBase: number): string {
  return `msx2_teleport_cooldown EQU ${formatAsmWord(ramBase)}
msx2_teleport_delay EQU ${formatAsmWord(ramBase + 1)}
msx2_teleport_lock EQU ${formatAsmWord(ramBase + 2)}
msx2_teleport_flags EQU ${formatAsmWord(ramBase + 3)}
msx2_teleport_ax EQU ${formatAsmWord(ramBase + 4)}
msx2_teleport_ay EQU ${formatAsmWord(ramBase + 5)}
msx2_teleport_bx EQU ${formatAsmWord(ramBase + 6)}
msx2_teleport_by EQU ${formatAsmWord(ramBase + 7)}
MSX2_TELEPORT_FLAG_HAS_A EQU #01
MSX2_TELEPORT_FLAG_HAS_B EQU #02
MSX2_TELEPORT_FLAG_TARGET_B EQU #04
`;
}

export function buildMsx2TeleportABRuntimeAsm(config: Msx2TeleportABConfig): string {
  if (!config.enabled) return '';

  const cooldownFrames = formatAsmByte(config.teleportCooldown);
  const delayFrames = formatAsmByte(config.teleportDelay);
  const maxDistanceTiles = formatAsmByte(config.maxDistance);
  const maskDestX = config.useHorizontal
    ? ''
    : `    ld a, (msx2_player_sprite_x)
    ld b, a
`;
  const maskDestY = config.useVertical
    ? ''
    : `    ld a, (msx2_player_sprite_y)
    ld c, a
`;

  return `${buildTeleportPressedRoutine(config)}
msx2_tick_teleport_cooldown:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_tick_teleport_cooldown
    ; PURPOSE: Decrements the teleport cooldown timer when active.
    ; INPUT: none. OUTPUT: none.
    ; DESTROYS: AF. PRESERVES: BC, DE, HL.
    ; ------------------------------------------------------------
    ld a, (msx2_teleport_cooldown)
    or a
    ret z
    dec a
    ld (msx2_teleport_cooldown), a
    ret

msx2_tick_teleport_delay:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_tick_teleport_delay
    ; PURPOSE: Decrements the post-teleport invulnerability timer.
    ; INPUT: none. OUTPUT: none.
    ; DESTROYS: AF. PRESERVES: BC, DE, HL.
    ; ------------------------------------------------------------
    ld a, (msx2_teleport_delay)
    or a
    ret z
    dec a
    ld (msx2_teleport_delay), a
    ret

msx2_teleport_release_lock:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_teleport_release_lock
    ; PURPOSE: Clears the teleport key lock once the input is released.
    ; INPUT: none. OUTPUT: none.
    ; DESTROYS: AF, BC, DE (via msx2_control_teleport_pressed). PRESERVES: HL.
    ; ------------------------------------------------------------
    call msx2_control_teleport_pressed
    or a
    ret nz
    xor a
    ld (msx2_teleport_lock), a
    ret

msx2_teleport_abs_tiles:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_teleport_abs_tiles
    ; PURPOSE: Converts a signed pixel delta into an absolute tile delta.
    ; INPUT: A = pixel delta produced by a SUB, Carry = borrow of that SUB
    ;   (CALL preserves flags, so the caller's SUB carry is still valid here).
    ; OUTPUT: A = abs(delta) / 8 (tile delta 0-31).
    ; DESTROYS: AF. PRESERVES: BC, DE, HL.
    ; NOTES: do NOT insert any flag-touching instruction before the JP C:
    ;   a previous version did "or a" first, which cleared the borrow and made
    ;   every negative delta read as a huge distance (teleport always denied
    ;   when moving right/down).
    ; ------------------------------------------------------------
    jp c, .tele_abs_negate
    jp .tele_abs_shift
.tele_abs_negate:
    xor #FF
    inc a
.tele_abs_shift:
    srl a
    srl a
    srl a
    ret

msx2_teleport_distance_ok_bc:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_teleport_distance_ok_bc
    ; PURPOSE: Checks the Chebyshev tile distance to the destination.
    ; INPUT: B = dest x, C = dest y.
    ; OUTPUT: A=1 when within maxDistance tiles, A=0 (Z set) otherwise.
    ; DESTROYS: AF, DE. PRESERVES: BC, HL.
    ; ------------------------------------------------------------
    push bc
    ld a, (msx2_player_sprite_x)
    sub b
    call msx2_teleport_abs_tiles
    ld d, a
${config.useHorizontal ? '' : `    xor a
    ld d, a
`}    pop bc
    push bc
    ld a, (msx2_player_sprite_y)
    sub c
    call msx2_teleport_abs_tiles
    ld e, a
${config.useVertical ? '' : `    xor a
    ld e, a
`}    pop bc
    ld a, d
    cp e
    jp nc, .tele_dist_use_e
    ld a, e
.tele_dist_use_e:
    cp ${maxDistanceTiles}
    jp nc, .tele_dist_fail
    ld a, 1
    ret
.tele_dist_fail:
    xor a
    ret

msx2_teleport_dest_free_bc:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_teleport_dest_free_bc
    ; PURPOSE: Verifies the destination cell is not solid before warping,
    ;   probing both body sides at mid height (same probe row used by the
    ;   horizontal movement code).
    ; INPUT: B = dest x, C = dest y (sprite top-left).
    ; OUTPUT: A=1 destination free, A=0 (Z set) when blocked.
    ; DESTROYS: AF, DE, HL. PRESERVES: BC.
    ; CALLS: msx2_collision_at_pixel (preserves BC, destroys AF/DE/HL).
    ; ------------------------------------------------------------
    push bc
    ld a, b
    add a, 2
    ld b, a
    ld a, c
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    pop bc
    jp nz, .tele_dest_blocked
    push bc
    ld a, b
    add a, 13
    ld b, a
    ld a, c
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    pop bc
    jp nz, .tele_dest_blocked
    ld a, 1
    or a
    ret
.tele_dest_blocked:
    xor a
    ret

msx2_teleport_apply_bc:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_teleport_apply_bc
    ; PURPOSE: Warps the player to B/C and resets vertical physics state.
    ; INPUT: B = dest x, C = dest y.
    ; OUTPUT: player position updated, gravity velocity and flags cleared.
    ; DESTROYS: AF, HL. PRESERVES: BC, DE.
    ; ------------------------------------------------------------
    ld a, b
    ld (msx2_player_sprite_x), a
    ld a, c
    ld (msx2_player_sprite_y), a
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld (msx2_player_flags), a
    ret

msx2_teleport_save_current_to_b:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_teleport_save_current_to_b
    ; PURPOSE: Stores the current sprite position as point B.
    ; DESTROYS: AF. PRESERVES: BC, DE, HL.
    ; ------------------------------------------------------------
    ld a, (msx2_player_sprite_x)
    ld (msx2_teleport_bx), a
    ld a, (msx2_player_sprite_y)
    ld (msx2_teleport_by), a
    ld a, (msx2_teleport_flags)
    or MSX2_TELEPORT_FLAG_HAS_B
    ld (msx2_teleport_flags), a
    ret

msx2_teleport_save_current_to_a:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_teleport_save_current_to_a
    ; PURPOSE: Stores the current sprite position as point A.
    ; DESTROYS: AF. PRESERVES: BC, DE, HL.
    ; ------------------------------------------------------------
    ld a, (msx2_player_sprite_x)
    ld (msx2_teleport_ax), a
    ld a, (msx2_player_sprite_y)
    ld (msx2_teleport_ay), a
    ld a, (msx2_teleport_flags)
    or MSX2_TELEPORT_FLAG_HAS_A
    ld (msx2_teleport_flags), a
    ret

msx2_try_teleport_ab:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_try_teleport_ab
    ; PURPOSE: Handles the teleport A-B skill input: first press saves
    ;   point A, later presses warp between A and B when the destination
    ;   is within range AND not inside a solid cell.
    ; INPUT: none. OUTPUT: player may be warped; timers/locks updated.
    ; DESTROYS: AF, BC, DE, HL.
    ; ------------------------------------------------------------
    call msx2_tick_teleport_cooldown
    call msx2_tick_teleport_delay
    call msx2_teleport_release_lock
    call msx2_control_teleport_pressed
    or a
    jp z, .teleport_done
    ld a, (msx2_teleport_lock)
    or a
    jp nz, .teleport_done
    ld a, (msx2_teleport_cooldown)
    or a
    jp nz, .teleport_done
    ld a, (msx2_teleport_flags)
    bit 0, a
    jp nz, .teleport_has_a
${config.savePointA ? `.teleport_save_a:
    call msx2_teleport_save_current_to_a
    ld a, ${cooldownFrames}
    ld (msx2_teleport_cooldown), a
    ld a, 1
    ld (msx2_teleport_lock), a
    jp .teleport_done
` : `    jp .teleport_done
`}.teleport_has_a:
    ld a, (msx2_teleport_flags)
    bit 2, a
    jp nz, .teleport_to_b
.teleport_to_a:
    ld a, (msx2_teleport_ax)
    ld b, a
    ld a, (msx2_teleport_ay)
    ld c, a
${maskDestX}${maskDestY}    call msx2_teleport_distance_ok_bc
    or a
    jp z, .teleport_done
    call msx2_teleport_dest_free_bc
    or a
    jp z, .teleport_done
    call msx2_teleport_save_current_to_b
    call msx2_teleport_apply_bc
    ld a, (msx2_teleport_flags)
    or MSX2_TELEPORT_FLAG_TARGET_B
    ld (msx2_teleport_flags), a
    jp .teleport_finish
.teleport_to_b:
    ld a, (msx2_teleport_flags)
    bit 1, a
    jp z, .teleport_done
    ld a, (msx2_teleport_bx)
    ld b, a
    ld a, (msx2_teleport_by)
    ld c, a
${maskDestX}${maskDestY}    call msx2_teleport_distance_ok_bc
    or a
    jp z, .teleport_done
    call msx2_teleport_dest_free_bc
    or a
    jp z, .teleport_done
    call msx2_teleport_save_current_to_a
    call msx2_teleport_apply_bc
    ld a, (msx2_teleport_flags)
    and #FB
    ld (msx2_teleport_flags), a
.teleport_finish:
    ld a, ${delayFrames}
    ld (msx2_teleport_delay), a
    ld a, ${cooldownFrames}
    ld (msx2_teleport_cooldown), a
    ld a, 1
    ld (msx2_teleport_lock), a
.teleport_done:
    ret

`;
}

export function buildMsx2TeleportABInputGateAsm(config: Msx2TeleportABConfig): string {
  if (!config.enabled) return '';
  return `    call msx2_try_teleport_ab
`;
}

export function buildMsx2TeleportABDamageSkipAsm(config: Msx2TeleportABConfig): string {
  if (!config.enabled) return '';
  return `    ld a, (msx2_teleport_delay)
    or a
    ret nz
`;
}

export function buildMsx2TeleportABHazardSkipAsm(config: Msx2TeleportABConfig): string {
  if (!config.enabled) return '';
  return `    ld a, (msx2_teleport_delay)
    or a
    jp nz, .no_effect
`;
}

export function buildMsx2TeleportABInitClearAsm(): string {
  return `    xor a
    ld (msx2_teleport_cooldown), a
    ld (msx2_teleport_delay), a
    ld (msx2_teleport_lock), a
    ld (msx2_teleport_flags), a
    ld (msx2_teleport_ax), a
    ld (msx2_teleport_ay), a
    ld (msx2_teleport_bx), a
    ld (msx2_teleport_by), a
`;
}

import { Msx2ShootConfig } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room SHOOT skill.
 *
 * Fires one bullet per fire-key press+release cycle. Up to `maxBullets`
 * simultaneous bullets travel horizontally at `bulletSpeed` px/frame in the
 * player's facing direction. Bullets are deactivated on wall collision, screen
 * border, or enemy impact (stub). Each active bullet occupies one V9938 sprite
 * slot after the player layers.
 *
 * RAM layout (contiguous pool walked by IX):
 *   bitmap_bullet_pool           active, x, y, dir  (4 bytes x maxBullets)
 *   bitmap_shoot_cooldown        1 byte
 *   bitmap_shoot_lock            1 byte (requireKeyRelease)
 *
 * Fire key (pilot): 'N' = keyboard matrix row 4, bit 3 (mask #08).
 * M is used by dash (row 4, bit 2), so both can coexist.
 * Direction comes from player_facing (0=left, 1=right).
 */

const SHOOT_KEY_ROW = 4;     // MSX keyboard matrix row holding K..R
const SHOOT_KEY_MASK = 0x08; // bit 3 = 'N'
const STRIDE = 4;            // bytes per bullet slot: active, x, y, dir

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** True when the shoot skill is enabled for the resolved player. */
export function bitmapShootEnabled(config: Msx2ShootConfig | undefined): boolean {
  return Boolean(config?.enabled);
}

/** Number of bytes the bullet pool + shared state occupies. */
export function bitmapShootRamBytes(config: Msx2ShootConfig | undefined): number {
  if (!bitmapShootEnabled(config)) return 0;
  const maxBullets = Math.max(1, Math.min(8, Math.floor(config!.maxBullets) || 3));
  return maxBullets * STRIDE + 2;
}

export interface BitmapShootRuntimeOptions {
  playerLayerCount: number;
  bulletPatternNumber: number;
  satBase: number;
  colorBase: number;
  patternBase: number;
  gameYOffset: number;
  screenWidth: number;
}

export interface BitmapShootSpriteData {
  patternBytes: number[];
  colorBytes: number[];
}

/** RAM EQU block (empty when shoot is disabled). */
export function buildBitmapShootEquates(
  config: Msx2ShootConfig | undefined,
  ramBase: number,
): string {
  if (!bitmapShootEnabled(config)) return '';
  const maxBullets = Math.max(1, Math.min(8, Math.floor(config!.maxBullets) || 3));
  const poolBytes = maxBullets * STRIDE;
  return `; --- SHOOT skill runtime state (${poolBytes + 2} bytes) ---
bitmap_bullet_pool     EQU ${asmWord(ramBase)}
bitmap_shoot_cooldown  EQU ${asmWord(ramBase + poolBytes)}
bitmap_shoot_lock      EQU ${asmWord(ramBase + poolBytes + 1)}
`;
}

/** Clears the shoot state. Inlined at init_rom and on screen transitions. */
export function buildBitmapShootInitClearAsm(config: Msx2ShootConfig | undefined): string {
  if (!bitmapShootEnabled(config)) return '';
  const maxBullets = Math.max(1, Math.min(8, Math.floor(config!.maxBullets) || 3));
  const total = maxBullets * STRIDE + 2;
  return `    ; Clear SHOOT pool (${total} bytes at bitmap_bullet_pool)
    ld hl, bitmap_bullet_pool
    ld b, ${asmByte(total)}
    xor a
.shoot_clear_loop:
    ld (hl), a
    inc hl
    djnz .shoot_clear_loop
`;
}

/** Main-loop gate: try to spawn a bullet, then step all active bullets. */
export function buildBitmapShootGateAsm(config: Msx2ShootConfig | undefined): string {
  if (!bitmapShootEnabled(config)) return '';
  return `    call bitmap_try_spawn_bullet
    call bitmap_step_bullets
`;
}

/** Call placed right after bitmap_update_sprite_sat to append bullet sprites. */
export function buildBitmapBulletSatCallAsm(config: Msx2ShootConfig | undefined): string {
  if (!bitmapShootEnabled(config)) return '';
  return '    call bitmap_update_bullet_sat\n';
}

/** Uploads the bullet sprite pattern + colour to VRAM at init time. */
export function buildBitmapBulletInitUploadAsm(
  config: Msx2ShootConfig | undefined,
  opts: BitmapShootRuntimeOptions,
): string {
  if (!bitmapShootEnabled(config)) return '';
  const patternVram = opts.patternBase + opts.bulletPatternNumber * 8;
  const colorVram = opts.colorBase + opts.playerLayerCount * 16;
  return `    ; Upload bullet sprite pattern (32 bytes) to VRAM ${asmWord(patternVram)}
    ld hl, bitmap_bullet_pattern_data
    ld de, ${asmWord(patternVram)}
    ld bc, bitmap_bullet_pattern_data_end - bitmap_bullet_pattern_data
    call copy_to_vram_ext
    ; Upload bullet sprite colour (16 bytes) to VRAM ${asmWord(colorVram)}
    ld hl, bitmap_bullet_color_data
    ld de, ${asmWord(colorVram)}
    ld bc, bitmap_bullet_color_data_end - bitmap_bullet_color_data
    call copy_to_vram_ext
`;
}

/** Data tables for the bullet sprite (pattern + colour). */
export function buildBitmapBulletDataTables(
  config: Msx2ShootConfig | undefined,
  sprite: BitmapShootSpriteData | undefined,
): string {
  if (!bitmapShootEnabled(config)) return '';
  const pattern = sprite?.patternBytes && sprite.patternBytes.length === 32
    ? sprite.patternBytes
    : Array(32).fill(0);
  const colors = sprite?.colorBytes && sprite.colorBytes.length === 16
    ? sprite.colorBytes
    : Array(16).fill(15);
  const emit = (label: string, bytes: number[], comment: string): string => {
    const l: string[] = [`; ${comment}`, `${label}:`];
    for (let i = 0; i < bytes.length; i += 16) {
      l.push(`    DB ${bytes.slice(i, i + 16).map(b => '#' + (b & 0xff).toString(16).toUpperCase().padStart(2, '0')).join(',')}`);
    }
    l.push(`${label}_end:`);
    return l.join('\n') + '\n';
  };
  return emit('bitmap_bullet_pattern_data', pattern, 'Shoot skill: 16x16 bullet sprite pattern (mode 2 quadrants)')
    + emit('bitmap_bullet_color_data', colors, 'Shoot skill: 16-byte line colour table for the bullet sprite');
}

/** The full shoot runtime ASM (all routines). Empty when disabled. */
export function buildBitmapShootRuntimeAsm(
  config: Msx2ShootConfig | undefined,
  opts: BitmapShootRuntimeOptions,
): string {
  if (!config || !bitmapShootEnabled(config)) return '';

  const maxBullets = Math.max(1, Math.min(8, Math.floor(config.maxBullets) || 3));
  const bulletSpeed = asmByte(Math.max(1, Math.min(16, Math.floor(config.bulletSpeed) || 4)));
  const shootCooldown = asmByte(Math.max(0, Math.min(120, Math.floor(config.shootCooldown) || 10)));
  const requireKeyRelease = config.requireKeyRelease !== false;
  const patternNumber = asmByte(opts.bulletPatternNumber);
  const satStart = opts.satBase + opts.playerLayerCount * 4;
  const gameYOffset = asmByte(opts.gameYOffset);

  const lockGate = requireKeyRelease
    ? `    ld a, (bitmap_shoot_lock)
    or a
    jp nz, .spawn_done
`
    : '';
  const armLock = requireKeyRelease
    ? `    ld a, 1
    ld (bitmap_shoot_lock), a
`
    : '';

  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_shoot_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the shoot key ('N', keyboard matrix row ${SHOOT_KEY_ROW} bit 3) via PPI.
; INPUT: none. OUTPUT: A = 1 when pressed, A = 0 otherwise (Z when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row ${SHOOT_KEY_ROW} on PPI_C.
; ------------------------------------------------------------
bitmap_shoot_pressed:
    in a, (PPI_C)
    and #F0
    or ${SHOOT_KEY_ROW}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(SHOOT_KEY_MASK)}
    ret z
    ld a, 1
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_tick_shoot_cooldown
; ------------------------------------------------------------
bitmap_tick_shoot_cooldown:
    ld a, (bitmap_shoot_cooldown)
    or a
    ret z
    dec a
    ld (bitmap_shoot_cooldown), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_shoot_release_lock
; ------------------------------------------------------------
bitmap_shoot_release_lock:
    call bitmap_shoot_pressed
    or a
    ret nz
    xor a
    ld (bitmap_shoot_lock), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_try_spawn_bullet
; ------------------------------------------------------------
; PURPOSE: Ticks cooldown, checks fire key + lock, and spawns one bullet in
;   the first free pool slot at the player's position with current facing.
;   No-op when pool is full.
; INPUT: none. OUTPUT: a bullet slot activated when conditions met.
; DESTROYS: AF, BC, DE, HL, IX. PRESERVES: IY.
; NOTES: IX walks the pool with a ${STRIDE}-byte stride (active, x, y, dir).
;   Spawn position: x = player_x +/- 14 (facing edge), y = player_y + 6.
; ------------------------------------------------------------
bitmap_try_spawn_bullet:
    call bitmap_tick_shoot_cooldown
    call bitmap_shoot_release_lock
    call bitmap_shoot_pressed
    or a
    jp z, .spawn_done
    ld a, (bitmap_shoot_cooldown)
    or a
    jp nz, .spawn_done
${lockGate}    ld ix, bitmap_bullet_pool
    ld b, ${asmByte(maxBullets)}
.find_free:
    ld a, (ix+0)
    or a
    jp z, .found
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .find_free
    jp .spawn_done
.found:
    ld (ix+0), 1
    ld a, (player_facing)
    ld (ix+3), a
    or a
    jp z, .spawn_left
    ld a, (player_x)
    add a, 14
    ld (ix+1), a
    jp .spawn_y
.spawn_left:
    ld a, (player_x)
    add a, 2
    ld (ix+1), a
.spawn_y:
    ld a, (player_y)
    add a, 6
    ld (ix+2), a
    ld a, ${shootCooldown}
    ld (bitmap_shoot_cooldown), a
${armLock}.spawn_done:
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_step_bullets
; ------------------------------------------------------------
; PURPOSE: Advances each active bullet by bulletSpeed px in its latched
;   direction, then checks wall collision (bitmap_probe_solid) and screen
;   bounds. Deactivates bullets that hit a wall or leave the screen.
; INPUT: none. OUTPUT: pool positions updated; slots may be deactivated.
; DESTROYS: AF, BC, DE, HL, IX. PRESERVES: IY.
; CALLS: bitmap_probe_solid, bitmap_bullet_check_enemy_collision.
; NOTES: IX walks the pool (${STRIDE}-byte stride). The djnz counter B is
;   saved across the probe call with push/pop bc because B/C carry the
;   probe X/Y arguments.
; ------------------------------------------------------------
bitmap_step_bullets:
    ld ix, bitmap_bullet_pool
    ld b, ${asmByte(maxBullets)}
.step_loop:
    ld a, (ix+0)
    or a
    jp z, .step_next
    ld a, (ix+3)
    or a
    jp z, .step_left
    ld a, (ix+1)
    add a, ${bulletSpeed}
    jp c, .deactivate
    ld (ix+1), a
    jp .step_wall
.step_left:
    ld a, (ix+1)
    sub ${bulletSpeed}
    jp c, .deactivate
    ld (ix+1), a
.step_wall:
    push bc
    ld b, (ix+1)
    ld c, (ix+2)
    call bitmap_probe_solid
    pop bc
    jp nz, .deactivate
    call bitmap_bullet_check_enemy_collision
.step_next:
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .step_loop
    ret
.deactivate:
    xor a
    ld (ix+0), a
    jp .step_next

; ------------------------------------------------------------
; FUNCTION: bitmap_update_bullet_sat
; ------------------------------------------------------------
; PURPOSE: Appends active bullet SAT entries after the player layers, then
;   writes the #D8 terminator. Called right after bitmap_update_sprite_sat.
; INPUT: none. OUTPUT: SAT entries at VRAM ${asmWord(satStart)} onwards.
; DESTROYS: AF, DE, HL, IX. PRESERVES: BC (saved), IY.
; ------------------------------------------------------------
bitmap_update_bullet_sat:
    ld de, ${asmWord(satStart)}
    push bc
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
    ld ix, bitmap_bullet_pool
    ld b, ${asmByte(maxBullets)}
.sat_loop:
    ld a, (ix+0)
    or a
    jp z, .sat_next
    ld a, (ix+2)
    add a, ${gameYOffset}
    out (VDP_DATA_PORT), a
    ld a, (ix+1)
    out (VDP_DATA_PORT), a
    ld a, ${patternNumber}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
.sat_next:
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .sat_loop
    ld a, #D8
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_check_enemy_collision
; ------------------------------------------------------------
; PURPOSE: Stub — placeholder for bullet-vs-enemy collision damage. The
;   bitmap-room backend does not yet have an enemy runtime; when one is
;   added this routine should iterate enemy slots, bounding-box test
;   against the current bullet (IX points to the active slot), apply
;   bulletDamage, and deactivate the bullet on hit.
; INPUT: IX -> current bullet slot (active, x, y, dir).
; OUTPUT: none (currently). DESTROYS: none. PRESERVES: AF, BC, DE, HL, IX, IY.
; TODO (hacer proximamente): wire enemy collision once enemies exist.
; ------------------------------------------------------------
bitmap_bullet_check_enemy_collision:
    ret
`;
}

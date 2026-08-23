import { Msx2BitmapKeyboardBinding, Msx2ShootConfig } from '../../../msx2PlatformPhysics';
import type { PSGSoundData } from '../../../../types';
import { PSG_ONE_SHOT_RAM_BYTES, buildPsgOneShotAsm, compilePsgOneShot } from './msx2PsgOneShot';

/**
 * SCREEN 5 bitmap-room SHOOT skill.
 *
 * Fires one bullet per fire-key press+release cycle. Up to `maxBullets`
 * simultaneous bullets travel at `bulletSpeed` px/frame. Bullets are
 * deactivated on wall collision, screen border, enemy impact (stub) and, when
 * `bulletRange` is authored, on running out of life. Each active bullet
 * occupies one V9938 sprite slot after the player layers.
 *
 * RAM layout (contiguous pool walked by IX):
 *   bitmap_bullet_pool           active, x, y, dir[, life]  (4 or 5 bytes x maxBullets)
 *   bitmap_shoot_cooldown        1 byte
 *   bitmap_shoot_lock            1 byte (requireKeyRelease)
 *   bitmap_bullet_borrow_group   1 byte (#FF before the first borrowed upload)
 *
 * The life byte only exists when `bulletRange` > 0, so a project that never
 * authors a range keeps the historical 4-byte slot and a byte-equal ROM.
 *
 * Fire input comes from the Player skill binding resolved by
 * resolveMsx2BitmapKeyboardBinding. Direction comes from player_facing
 * (dir 0=left, 1=right) or, with `allowUpShot` and UP held while firing, 2=up.
 */

const STRIDE = 4;            // bytes per bullet slot: active, x, y, dir
const STRIDE_RANGED = 5;     // + life: steps left before the bullet dies of old age

/** True when the project caps how far a bullet may travel. */
function bitmapShootRanged(config: Msx2ShootConfig | undefined): boolean {
  return bitmapShootEnabled(config) && Math.floor(Number(config!.bulletRange) || 0) > 0;
}

/** Pool stride: the life byte only exists when a range was authored. */
export function bitmapShootSlotStride(config: Msx2ShootConfig | undefined): number {
  return bitmapShootRanged(config) ? STRIDE_RANGED : STRIDE;
}

/**
 * Steps a bullet survives = range / speed, clamped to a byte. The bullet still
 * dies early on a wall, an enemy or the screen edge; this only adds old age.
 */
function bitmapShootLifeSteps(config: Msx2ShootConfig): number {
  const speed = Math.max(1, Math.min(16, Math.floor(config.bulletSpeed) || 4));
  const range = Math.max(0, Math.min(255, Math.floor(config.bulletRange) || 0));
  return Math.max(1, Math.min(255, Math.ceil(range / speed)));
}

/** Direction codes stored in the slot's dir byte. */
const BULLET_DIR_LEFT = 0;
const BULLET_DIR_RIGHT = 1;
const BULLET_DIR_UP = 2;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

function buildBitmapShootKeyCheck(key: Msx2BitmapKeyboardBinding | undefined): string {
  if (!key) {
    return `    xor a
    ret
`;
  }
  return `    in a, (PPI_C)
    and #F0
    or ${key.row}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${asmByte(key.mask)}
    ret z
`;
}

function buildBitmapShootPressedRoutine(config: Msx2ShootConfig): string {
  const primaryKey = config.primaryKeyboard ?? { label: 'M', row: 4, mask: 0x04 };
  const secondaryKey = config.secondaryControl !== 'none' ? config.secondaryKeyboard : undefined;
  const comboLabel = secondaryKey ? `${primaryKey.label}+${secondaryKey.label}` : primaryKey.label;
  const rows = secondaryKey && secondaryKey.row !== primaryKey.row
    ? `${primaryKey.row}/${secondaryKey.row}`
    : String(primaryKey.row);
  const secondaryCheck = secondaryKey ? buildBitmapShootKeyCheck(secondaryKey) : '';
  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_shoot_pressed
; ------------------------------------------------------------
; PURPOSE: Reads the configured shoot input (${comboLabel}) via PPI.
; INPUT: none. OUTPUT: A = 1 when pressed, A = 0 otherwise (Z when not pressed).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: Selects keyboard row ${rows} on PPI_C. update_player_movement
;   re-selects row 8 next frame, so the transient selection is safe.
; ------------------------------------------------------------
bitmap_shoot_pressed:
${buildBitmapShootKeyCheck(primaryKey)}${secondaryCheck}    ld a, 1
    ret
`;
}

/** True when the shoot skill is enabled for the resolved player. */
export function bitmapShootEnabled(config: Msx2ShootConfig | undefined): boolean {
  return Boolean(config?.enabled);
}

/**
 * True when the shot plays an AUTHORED sound, which needs a frame sequencer and
 * therefore RAM. Decided from the config alone — never from the asset's
 * contents — so the RAM map does not move when someone edits the sound. An
 * asset that turns out to be empty falls back to the built-in pew and simply
 * leaves these four bytes unused.
 */
function bitmapShootSfxSequenced(config: Msx2ShootConfig | undefined): boolean {
  return bitmapShootEnabled(config)
    && config!.shootSound !== false
    && Boolean(String(config!.shootSoundAssetId || '').trim());
}

/** Number of bytes the bullet pool + shared state occupies. */
export function bitmapShootRamBytes(config: Msx2ShootConfig | undefined): number {
  if (!bitmapShootEnabled(config)) return 0;
  const maxBullets = Math.max(1, Math.min(8, Math.floor(config!.maxBullets) || 3));
  return maxBullets * bitmapShootSlotStride(config) + 3
    + (bitmapShootSfxSequenced(config) ? PSG_ONE_SHOT_RAM_BYTES : 0);
}

export interface BitmapShootRuntimeOptions {
  playerLayerCount: number;
  bulletPatternNumber: number;
  satBase: number;
  colorBase: number;
  patternBase: number;
  gameYOffset: number;
  screenWidth: number;
  /** Foreground sprite slots reserved in front of the player (0 = none, legacy). */
  foregroundSlotCount?: number;
  /** Enemy SAT slots reserved between the player layers and the bullets (0 = none, legacy). */
  enemySlotCount?: number;
  /** Moving-platform SAT slots reserved between the enemies and the bullets (0 = none, legacy). */
  platformSlotCount?: number;
  /** Carry-and-throw SAT slots reserved between platforms and the bullets. */
  carrySlotCount?: number;
  /** destroy_tile debris SAT slots reserved between carry and the bullets. */
  destroySlotCount?: number;
  /** Label the bullet-vs-enemy stub jumps to (e.g. the bitmap boss hit check).
   *  The target must preserve BC and IX (bullet loop counter + slot pointer). */
  enemyCollisionJumpLabel?: string;
  /**
   * RAM label holding the ammunition count (nuts). When set, firing costs one
   * unit and an empty counter refuses the shot outright. Undefined keeps the
   * historical unlimited fire, so a project with no nuts placed is unaffected.
   */
  ammoCounterLabel?: string;
  /**
   * Sound Editor asset played on every shot, when the player picked one. Absent
   * (or with no steps) keeps the built-in pew, which needs no sequencer at all.
   */
  shootSound?: PSGSoundData;
  /**
   * When no dedicated V9938 group remains, borrow one of two player pattern
   * groups. The runtime always chooses the group outside the currently visible
   * player frame, restores the previous borrowed group from ROM, then uploads
   * the bullet pattern into the newly safe group.
   */
  borrowPlayerPatternGroups?: {
    primaryGroup: number;
    alternateGroup: number;
    playerPatternsLabel: string;
    /**
     * EQU holding the MegaROM data bank of `playerPatternsLabel`. The pattern
     * bank is not resident, so the routine maps it into P2 around its copies.
     * Undefined means the table is resident and no mapping is needed.
     */
    playerPatternsDataBankLabel?: string;
  };
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
  const poolBytes = maxBullets * bitmapShootSlotStride(config);
  const sfxBase = ramBase + poolBytes + 3;
  return `; --- SHOOT skill runtime state (${bitmapShootRamBytes(config)} bytes) ---
bitmap_bullet_pool     EQU ${asmWord(ramBase)}
bitmap_shoot_cooldown  EQU ${asmWord(ramBase + poolBytes)}
bitmap_shoot_lock      EQU ${asmWord(ramBase + poolBytes + 1)}
bitmap_bullet_borrow_group EQU ${asmWord(ramBase + poolBytes + 2)}
${bitmapShootSfxSequenced(config) ? `; Authored shot sound: the sequencer's playing flag, frame countdown and cursor.
bitmap_shoot_sfx_active EQU ${asmWord(sfxBase)}
bitmap_shoot_sfx_timer EQU ${asmWord(sfxBase + 1)}
bitmap_shoot_sfx_ptr   EQU ${asmWord(sfxBase + 2)}  ; word
` : ''}`;
}

/** Clears the shoot state. Called from every WorldLink init, implemented once. */
export function buildBitmapShootInitClearAsm(config: Msx2ShootConfig | undefined): string {
  if (!bitmapShootEnabled(config)) return '';
  const maxBullets = Math.max(1, Math.min(8, Math.floor(config!.maxBullets) || 3));
  const total = maxBullets * bitmapShootSlotStride(config) + 3;
  return `    ; Clear SHOOT pool (${total} bytes at bitmap_bullet_pool)
    call bitmap_shoot_init_clear
`;
}

/** Main-loop gate: try to spawn a bullet, then step all active bullets. */
export function buildBitmapShootGateAsm(config: Msx2ShootConfig | undefined): string {
  if (!bitmapShootEnabled(config)) return '';
  return `    call bitmap_try_spawn_bullet
    call bitmap_step_bullets
${bitmapShootSfxSequenced(config) ? '    call bitmap_shoot_sfx_tick     ; authored shot sound: one record per frame\n' : ''}`;
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
  const maxBullets = Math.max(1, Math.min(8, Math.floor(config!.maxBullets) || 3));
  const patternVram = opts.patternBase + opts.bulletPatternNumber * 8;
  const patternUpload = opts.borrowPlayerPatternGroups
    ? `    ; Bullet pattern is uploaded by bitmap_prepare_bullet_pattern into a
    ; currently invisible player group on the first main-loop frame.
`
    : `    ; Upload bullet sprite pattern (32 bytes) to VRAM ${asmWord(patternVram)}
    ld hl, bitmap_bullet_pattern_data
    ld de, ${asmWord(patternVram)}
    ld bc, bitmap_bullet_pattern_data_end - bitmap_bullet_pattern_data
    call copy_to_vram_ext
`;
  // V9938 sprite mode 2 keeps ONE 16-byte colour table per sprite slot. Active
  // bullets pack into slots playerLayerCount..playerLayerCount+maxBullets-1, so
  // every one of those slots needs the bullet colour uploaded; uploading only the
  // first slot left the 2nd+ simultaneous bullets with an uninitialised (black)
  // colour table.
  const colorUploads = Array.from({ length: maxBullets }, (_unused, i) => {
    const colorVram = opts.colorBase + (opts.playerLayerCount + (opts.enemySlotCount || 0) + (opts.platformSlotCount || 0) + (opts.carrySlotCount || 0) + (opts.destroySlotCount || 0) + i) * 16;
    return `    ; bullet colour -> sprite slot ${opts.playerLayerCount + i} (VRAM ${asmWord(colorVram)})
    ld hl, bitmap_bullet_color_data
    ld de, ${asmWord(colorVram)}
    ld bc, bitmap_bullet_color_data_end - bitmap_bullet_color_data
    call copy_to_vram_ext
`;
  }).join('');
  return `${patternUpload}${colorUploads}`;
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
  const stride = bitmapShootSlotStride(config);
  const ranged = bitmapShootRanged(config);
  const lifeSteps = ranged ? bitmapShootLifeSteps(config) : 0;
  const allowUpShot = config.allowUpShot === true;
  // IX walks the pool one slot at a time; the stride grew with the life byte.
  const advanceSlot = Array.from({ length: stride }, () => '    inc ix').join('\n');
  const patternNumber = asmByte(opts.bulletPatternNumber);
  const satStart = opts.satBase + ((opts.foregroundSlotCount || 0) + opts.playerLayerCount + (opts.enemySlotCount || 0) + (opts.platformSlotCount || 0) + (opts.carrySlotCount || 0) + (opts.destroySlotCount || 0)) * 4;
  const gameYOffset = asmByte(opts.gameYOffset);
  const shootPressedRoutine = buildBitmapShootPressedRoutine(config);
  const borrowed = opts.borrowPlayerPatternGroups;
  const borrowedPatternSelectAsm = borrowed
    ? `    ld a, (player_pat)
    or a
    ld a, ${asmByte(borrowed.primaryGroup * 4)}
    jp nz, .sat_pattern_ready
    ld a, ${asmByte(borrowed.alternateGroup * 4)}
.sat_pattern_ready:
`
    : `    ld a, ${patternNumber}
`;
  const borrowedPatternRuntime = borrowed
    ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_prepare_bullet_pattern
; ------------------------------------------------------------
; PURPOSE:
;   Keep the SHOOT pattern resident without consuming a 65th V9938 sprite
;   pattern group. Group ${borrowed.primaryGroup} is borrowed unless player_pat
;   is zero (the player currently displays groups 0..${Math.max(0, opts.playerLayerCount - 1)}),
;   in which case group ${borrowed.alternateGroup} is borrowed. Before changing
;   groups, restore the previous player pattern from its ROM bank.
;
; INPUT:
;   player_pat = current player SAT base pattern number.
;   bitmap_bullet_borrow_group = previous borrowed group or #FF.
;
; OUTPUT:
;   The safe borrowed group contains bitmap_bullet_pattern_data.
;   bitmap_bullet_borrow_group records that group.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   copy_to_vram_ext.
;
; SIDE EFFECTS:
;   Copies at most 96 bytes to sprite-pattern VRAM and restores VDP R#14 = 0
;   through copy_to_vram_ext. R#15/R#17 and mapper banks are not changed.
;
; NOTES:
;   No stack operations. All exits keep the caller stack unchanged.
; ------------------------------------------------------------
bitmap_prepare_bullet_pattern:
${borrowed.playerPatternsDataBankLabel ? `    ; The player pattern bank is not resident. Map it into P2 for the whole
    ; routine and put the resident bank back on the way out, so every exit is
    ; covered without touching the body's early returns. This wrapper and
    ; copy_to_vram_ext both live well below #8000, outside the swapped window.
    ld a, ${borrowed.playerPatternsDataBankLabel}
    call bitmap_room_select_data_bank_a
    call bitmap_prepare_bullet_pattern_body
    jp bitmap_room_restore_resident_banks
bitmap_prepare_bullet_pattern_body:
` : ''}    ld a, (player_pat)
    or a
    ld a, ${asmByte(borrowed.primaryGroup)}
    jp nz, .borrow_group_selected
    ld a, ${asmByte(borrowed.alternateGroup)}
.borrow_group_selected:
    ld b, a
    ld a, (bitmap_bullet_borrow_group)
    cp b
    ret z
    cp #FF
    jp z, .borrow_restore_both
    cp ${asmByte(borrowed.primaryGroup)}
    jp z, .borrow_restore_primary
    ; Restore the alternate player group before it can become visible.
    ld hl, ${borrowed.playerPatternsLabel} + ${borrowed.alternateGroup * 32}
    ld de, ${asmWord(opts.patternBase + borrowed.alternateGroup * 32)}
    ld bc, 32
    call copy_to_vram_ext
    jp .borrow_upload_selected
.borrow_restore_both:
    ; A room transition clears the SHOOT RAM without re-uploading the complete
    ; player bank. Restore both possible loan groups so no stale bullet pattern
    ; can become visible after the transition, then install the current loan.
    ld hl, ${borrowed.playerPatternsLabel} + ${borrowed.primaryGroup * 32}
    ld de, ${asmWord(opts.patternBase + borrowed.primaryGroup * 32)}
    ld bc, 32
    call copy_to_vram_ext
    ld hl, ${borrowed.playerPatternsLabel} + ${borrowed.alternateGroup * 32}
    ld de, ${asmWord(opts.patternBase + borrowed.alternateGroup * 32)}
    ld bc, 32
    call copy_to_vram_ext
    jp .borrow_upload_selected
.borrow_restore_primary:
    ld hl, ${borrowed.playerPatternsLabel} + ${borrowed.primaryGroup * 32}
    ld de, ${asmWord(opts.patternBase + borrowed.primaryGroup * 32)}
    ld bc, 32
    call copy_to_vram_ext
.borrow_upload_selected:
    ; copy_to_vram_ext destroys the selected group in B; derive it again.
    ld a, (player_pat)
    or a
    ld a, ${asmByte(borrowed.primaryGroup)}
    jp nz, .borrow_store_selected
    ld a, ${asmByte(borrowed.alternateGroup)}
.borrow_store_selected:
    ld (bitmap_bullet_borrow_group), a
    cp ${asmByte(borrowed.primaryGroup)}
    jp z, .borrow_upload_primary
    ld de, ${asmWord(opts.patternBase + borrowed.alternateGroup * 32)}
    jp .borrow_upload_pattern
.borrow_upload_primary:
    ld de, ${asmWord(opts.patternBase + borrowed.primaryGroup * 32)}
.borrow_upload_pattern:
    ld hl, bitmap_bullet_pattern_data
    ld bc, bitmap_bullet_pattern_data_end - bitmap_bullet_pattern_data
    jp copy_to_vram_ext
`
    : '';

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
  // Ammo gate. Placed AFTER the cooldown/lock checks and BEFORE the free-slot
  // search, so an empty counter neither arms the cooldown nor consumes the key
  // press: releasing and pressing again still tries (and still refuses).
  const ammoGate = opts.ammoCounterLabel
    ? `    ld a, (${opts.ammoCounterLabel})
    or a
    jp z, .spawn_done         ; out of ammo: no shot
`
    : '';
  // Spend one unit only once a slot was actually taken.
  const ammoSpend = opts.ammoCounterLabel
    ? `    ld a, (${opts.ammoCounterLabel})
    dec a
    ld (${opts.ammoCounterLabel}), a
`
    : '';

  // ---- shot sound -----------------------------------------------------------
  // Two shapes, one entry point. An authored asset is a list of steps, so it
  // needs a sequencer ticked every frame; the built-in pew is a handful of PSG
  // registers written once and forgotten. Both are called bitmap_shoot_sfx_start
  // so the spawn site never has to know which one it got.
  const sfxWanted = config.shootSound !== false;
  const sequenced = bitmapShootSfxSequenced(config);
  const compiledSfx = sequenced
    ? compilePsgOneShot(opts.shootSound, 'bitmap_shoot_sfx_data')
    : undefined;
  if (sequenced && !compiledSfx) {
    console.warn(
      'MSX2 SHOOT skill: the chosen shot sound has no steps on any channel, so the built-in pew is used. '
      + `Its ${PSG_ONE_SHOT_RAM_BYTES} bytes of sequencer RAM stay reserved.`,
    );
  }
  const sfxCall = sfxWanted
    ? `    call bitmap_shoot_sfx_start
`
    : '';
  const sfxRoutineAsm = !sfxWanted ? '' : compiledSfx
    ? `${buildPsgOneShotAsm('bitmap_shoot_sfx', 'bitmap_shoot_sfx_data')}
${compiledSfx.dataAsm}`
    : `
; ------------------------------------------------------------
; FUNCTION: bitmap_shoot_sfx_start
; ------------------------------------------------------------
; PURPOSE: The built-in pew. Writes the register pairs below straight to the
;   PSG and forgets about them: the envelope shape does the decay in hardware,
;   so there is nothing to tick and no RAM to own.
;   Channel C is the gameplay SFX channel by convention; the shadow byte tells
;   the music driver to merge it into the mixer.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF, B, HL. PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_shoot_sfx_start:
    ld hl, bitmap_shoot_sfx_data
    ld b, 7
.shoot_sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .shoot_sfx_loop
    ld a, #20               ; shadow: tone C on, noise C off (music merges it)
    ld (psg_sfx_r7_c_bits), a
    ret

bitmap_shoot_sfx_data:
    ; reg,value pairs: mixer, tone period C, envelope period, volume=envelope, shape
    db 7,#3B,4,#60,5,#00,11,#18,12,#00,10,#10,13,#09
`;

  const initClearRoutineAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_shoot_init_clear
; PURPOSE: Clear the reusable bullet pool and release any borrowed player group.
; INPUT: None. OUTPUT: None.
; DESTROYS: AF, B, HL. PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_shoot_init_clear:
    ld hl, bitmap_bullet_pool
    ld b, ${asmByte(maxBullets * STRIDE + 3)}
    xor a
.shoot_init_clear_loop:
    ld (hl), a
    inc hl
    djnz .shoot_init_clear_loop
${sequenced ? `    ld (bitmap_shoot_sfx_active), a    ; A is still 0: nothing playing
` : ''}    dec a
    ld (bitmap_bullet_borrow_group), a ; #FF = no borrowed player group yet
    ret
`;

  return `${initClearRoutineAsm}${sfxRoutineAsm}
${borrowedPatternRuntime}${shootPressedRoutine}
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
${!allowUpShot ? '' : `
; ------------------------------------------------------------
; FUNCTION: bitmap_shoot_up_held
; ------------------------------------------------------------
; PURPOSE: Reads the UP cursor key (matrix row 8, mask #20) to aim the shot
;   upwards. Only the HELD state matters: the shot itself is triggered by the
;   fire edge, so the UP press is still free for doors and shops.
; INPUT: none. OUTPUT: A = 1 when held, A = 0 otherwise (Z when released).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; SIDE EFFECTS: selects keyboard row 8 on PPI_C, which is where
;   update_player_movement leaves it anyway.
; ------------------------------------------------------------
bitmap_shoot_up_held:
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and #20
    ret z
    ld a, 1
    ret
`}

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
${lockGate}${ammoGate}    ld ix, bitmap_bullet_pool
    ld b, ${asmByte(maxBullets)}
.find_free:
    ld a, (ix+0)
    or a
    jp z, .found
${advanceSlot}
    djnz .find_free
    jp .spawn_done
.found:
    ld (ix+0), 1
${allowUpShot ? `    ; UP held? Shoot upwards. The shot is triggered by the FIRE edge, never by
    ; the UP edge, so bitmap_key_up_lock (doors, shops) is left untouched.
    call bitmap_shoot_up_held
    or a
    jp z, .spawn_forward
    ld (ix+3), ${BULLET_DIR_UP}
    ld a, (player_x)
    add a, 6
    ld (ix+1), a
    ld a, (player_y)
    sub 2
    jp nc, .spawn_up_y_ok
    xor a                     ; clamp at the top row
.spawn_up_y_ok:
    ld (ix+2), a
    jp .spawn_life
.spawn_forward:
` : ''}    ld a, (player_facing)
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
${allowUpShot ? '.spawn_life:\n' : ''}${ranged ? `    ; The step routine spends one life BEFORE moving, so the slot needs one extra
    ; unit for the bullet to actually travel its full ${config.bulletRange} px.
    ld (ix+4), ${asmByte(Math.min(255, lifeSteps + 1))}     ; ${lifeSteps} moves = ${config.bulletRange} px of range
` : ''}${ammoSpend}    ld a, ${shootCooldown}
    ld (bitmap_shoot_cooldown), a
${sfxCall}${armLock}.spawn_done:
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
${ranged ? `    ; Old age first: a spent bullet must not get one more free step.
    ld a, (ix+4)
    dec a
    ld (ix+4), a
    jp z, .deactivate
` : ''}    ld a, (ix+3)
${allowUpShot ? `    cp ${BULLET_DIR_UP}
    jp z, .step_up
` : ''}    or a
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
${!allowUpShot ? '' : `    jp .step_wall
.step_up:
    ; Upwards: Y grows downwards, so borrowing past 0 means the bullet left the
    ; top of the play area. The room is 192 px tall, no bottom case exists here.
    ld a, (ix+2)
    sub ${bulletSpeed}
    jp c, .deactivate
    ld (ix+2), a
`}.step_wall:
    push bc
    ld b, (ix+1)
    ld c, (ix+2)
    call bitmap_probe_solid
    pop bc
    jp nz, .deactivate
    call bitmap_bullet_check_enemy_collision
.step_next:
${advanceSlot}
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
${borrowedPatternSelectAsm}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
.sat_next:
${advanceSlot}
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
; PURPOSE: Bullet-vs-target dispatch. ${opts.enemyCollisionJumpLabel
    ? `Jumps to ${opts.enemyCollisionJumpLabel}.`
    : `Stub — no bullet-damageable runtime is enabled in this ROM.`}
; INPUT: IX -> current bullet slot (active, x, y, dir).
; OUTPUT: target HP/despawn on hit. DESTROYS: AF (target may use more).
; PRESERVES: BC, IX (bullet loop counter + slot pointer contract).
; ------------------------------------------------------------
bitmap_bullet_check_enemy_collision:
${opts.enemyCollisionJumpLabel ? `    jp ${opts.enemyCollisionJumpLabel}` : `    ret`}
`;
}

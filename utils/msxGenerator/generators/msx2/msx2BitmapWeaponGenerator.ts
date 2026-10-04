import type { Msx2WeaponRuntimeConfig } from '../../../msx2PlayerWeapons';
import { MSX2_WEAPON_MAX_LAYERS } from '../../../msx2PlayerWeapons';
import type { Msx2BitmapKeyboardBinding } from '../../../msx2PlatformPhysics';

/**
 * SCREEN 5 bitmap-room PLAYER WEAPONS (melee swing + weapon inventory).
 *
 * A melee weapon is a hardware sprite that appears "out of nowhere" in front of
 * the player when the attack button (B) is pressed, plays its authored frames
 * (typically 2: wind-up + hit) and disappears. The LAST frame hits: every
 * present 16x16 layer of the weapon is offered, as a bullet-shaped probe, to
 * the same target routine the shoot skill's bullets use (enemy pool and/or
 * boss), so one swing kills what one bullet kills.
 *
 * The runtime also owns the weapon inventory:
 *   - bitmap_weapon_owned    bitmask of weapons in hand (bit n = player.weapons[n])
 *   - bitmap_weapon_equipped index of the equipped weapon, #FF = none
 * The switch key cycles through the owned weapons; a room pickup grants and
 * equips a weapon (see the pickup class in the room generator). While a melee
 * weapon is equipped bitmap_weapon_blocks_shoot = 1 and the shoot skill does
 * not fire, so B swings instead of shooting ("the weapon replaces the shot").
 *
 * Graphics: the weapon owns `slotCount` SAT slots right before the player
 * bullets and the same number of sprite pattern groups. Only the frame on
 * screen is resident in VRAM: when the frame (or facing) changes, its pattern
 * and line colours are copied from ROM (48 bytes per layer). Facing left uses
 * a pre-mirrored copy built at generation time.
 *
 * RAM layout (BITMAP_WEAPON_RAM_BYTES bytes from ramBase):
 *   +0  owned         +1  equipped      +2  active       +3  frame
 *   +4  tick          +5  cooldown      +6  attack lock  +7  switch lock
 *   +8  dir (latched) +9  dirty         +10 blocks shoot +11 HUD index
 *   +12 probe (active, x, y, dir: bullet slot shape, 4 bytes)
 *   +16 hit done      +17 frame count   +18 frame delay
 */

export const BITMAP_WEAPON_RAM_BYTES = 19;
/**
 * Extra RAM byte used only when some weapon is combined frame-by-frame with the
 * player's attack animation (Sprite Editor weapon combinations):
 *   +19 sync   1 while a synced swing drives the player's attack clip
 */
export const BITMAP_WEAPON_SYNC_RAM_BYTES = BITMAP_WEAPON_RAM_BYTES + 1;
/** Per swing-frame flag bits (combination rows). */
export const BITMAP_WEAPON_FRAME_HITS = 0x01;
export const BITMAP_WEAPON_FRAME_FRONT = 0x02;
/** Set on every frame of a combined weapon when an attack clip exists: the swing drives it. */
export const BITMAP_WEAPON_FRAME_SYNC = 0x80;

export interface BitmapWeaponLayerGraphics {
  /** 32-byte mode-2 16x16 pattern (TL, BL, TR, BR quadrants). */
  pattern: number[];
  /** 16 line colour bytes (bit 6 = CC/OR colour for overlay layers). */
  colors: number[];
  /** Layer origin relative to player_x / player_y (weapon offset + cell offset). */
  dx: number;
  dy: number;
}

export interface BitmapWeaponFrameGraphics {
  left: BitmapWeaponLayerGraphics[];
  right: BitmapWeaponLayerGraphics[];
}

export interface BitmapWeaponGraphics {
  /** One entry per swing frame; empty for non-melee weapons. */
  frames: BitmapWeaponFrameGraphics[];
  /**
   * Present when the weapon is combined with the player's attack animation
   * (Sprite Editor weapon combination): one swing frame per attack-clip frame.
   */
  sync?: {
    /** Per swing frame: BITMAP_WEAPON_FRAME_HITS | BITMAP_WEAPON_FRAME_FRONT. */
    frameFlags: number[];
    /** Game frames per swing frame (the attack clip's delay). */
    frameDelay: number;
  };
}

export interface BitmapWeaponRuntimeOptions {
  /** SAT slots owned by the weapon (max layers of any melee weapon). */
  slotCount: number;
  /** Absolute VRAM address of the weapon's first SAT entry. */
  satAddress: number;
  /** Absolute VRAM address of the weapon's first sprite colour block. */
  colorAddress: number;
  /** First sprite pattern group (16x16) owned by the weapon. */
  patternGroupBase: number;
  /** Sprite pattern generator table base (SCREEN 5 bitmap rooms: #F800). */
  patternBase: number;
  /** Y added to game coordinates on the SAT (HUD band height). */
  gameYOffset: number;
  /** Game area height in pixels: a weapon layer at or below it is hidden. */
  playAreaHeight: number;
  /** True when no SAT writer follows: append the #D8 terminator. */
  writesTerminator: boolean;
  /** Bullet-target routine (IX -> probe slot, preserves BC/IX); undefined = nothing to hit. */
  hitTargetLabel?: string;
  /** Konami MegaROM: map the resident banks before reading the frame blocks. */
  megaRom: boolean;
  /**
   * Second block of weapon SAT slots placed right BEFORE the player's slots
   * (lower SAT index = drawn over the player). Used by combination frames marked
   * "in front"; the regular block (after the enemies) is used otherwise.
   */
  front?: { satAddress: number; colorAddress: number };
  /**
   * Player clip id (player_anim_state) of the attack animation. > 0 makes a
   * synced swing drive the player's attack clip frame by frame.
   */
  attackAnimId?: number;
}

export interface BitmapWeaponSystem {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  initAsm: string;
  /** Main loop, logic phase, BEFORE the shoot gate. */
  updateCallAsm: string;
  /** SAT phase, right before the player-bullet SAT writer. */
  satCallAsm: string;
  /** Deferred VRAM phase (pattern/colour upload of the visible frame). */
  uploadCallAsm: string;
  /** Code + small tables. Emit in the resident low window (read during the SAT phase). */
  routinesAsm: string;
  /** Frame pattern/colour blob (non-MegaROM). Read only by the upload routine. */
  dataAsm: string;
  /** Frame blob as a MegaROM data-bank block (Konami MegaROM only). */
  bankedBlocks: Array<{ label: string; bytes: number[]; description: string }>;
  /** RAM byte that is non-zero while a melee weapon is equipped. */
  blocksShootLabel: string;
  /** RAM byte for an equippedWeapon HUD widget: 0 = none, n+1 = weapon n. */
  hudIndexLabel: string;
}

const DISABLED: BitmapWeaponSystem = {
  enabled: false,
  ramBytes: 0,
  equates: '',
  initAsm: '',
  updateCallAsm: '',
  satCallAsm: '',
  uploadCallAsm: '',
  routinesAsm: '',
  dataAsm: '',
  bankedBlocks: [],
  blocksShootLabel: '',
  hudIndexLabel: '',
};

function hexByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function hexWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** Signed byte in -128..127 as a DB operand. */
function signedByte(value: number): string {
  const v = Math.max(-128, Math.min(127, Math.trunc(Number(value) || 0)));
  return hexByte(v & 0xff);
}

function dbLines(bytes: number[], indent = '    '): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    lines.push(`${indent}DB ${bytes.slice(i, i + 16).map(hexByte).join(',')}`);
  }
  return lines.join('\n');
}

function buildKeyReadAsm(label: string, key: Msx2BitmapKeyboardBinding | undefined, purpose: string): string {
  const body = key
    ? `    in a, (PPI_C)
    and #F0
    or ${key.row}
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    and ${hexByte(key.mask)}
    ret z
    ld a, 1
    ret
`
    : `    xor a
    ret
`;
  return `
; ------------------------------------------------------------
; FUNCTION: ${label}
; ------------------------------------------------------------
; PURPOSE:
;   ${purpose} (${key ? `${key.label}: keyboard row ${key.row}, mask ${hexByte(key.mask)}` : 'no key bound'}).
; INPUT: None.
; OUTPUT: A = 1 and NZ when held; A = 0 and Z when released.
; DESTROYS: AF.
; PRESERVES: BC, DE, HL, IX, IY.
; CALLS: None.
; SIDE EFFECTS: Selects a keyboard row on PPI_C (update_player_movement
;   re-selects its own row every frame).
; NOTES: None.
; ------------------------------------------------------------
${label}:
${body}`;
}

/**
 * Builds the complete weapon runtime. Returns the disabled stub (all strings
 * empty) when the player has no melee weapon, so projects without weapons keep
 * a byte-identical ROM.
 */
export function buildBitmapWeaponSystem(
  config: Msx2WeaponRuntimeConfig,
  graphics: BitmapWeaponGraphics[],
  ramBase: number,
  opts: BitmapWeaponRuntimeOptions,
): BitmapWeaponSystem {
  if (!config.enabled || config.weapons.length === 0) return DISABLED;
  const weaponCount = config.weapons.length;
  const slotCount = Math.max(1, Math.min(MSX2_WEAPON_MAX_LAYERS, Math.floor(opts.slotCount) || 1));
  const layerBlockBytes = 48; // 32 pattern + 16 colours
  const frameBlockBytes = slotCount * layerBlockBytes;
  // Weapon combinations (Sprite Editor): per-frame hit / in-front flags and,
  // with an attack clip, a player animation locked to the swing. Everything
  // below is gated on it so ROMs without combinations stay byte-identical.
  const syncMode = graphics.some((entry, index) => !!entry?.sync && config.weapons[index]?.isMelee);
  const front = syncMode ? opts.front : undefined;
  const attackAnimId = syncMode ? Math.max(0, Math.min(255, Math.floor(opts.attackAnimId || 0))) : 0;
  const ramBytes = syncMode ? BITMAP_WEAPON_SYNC_RAM_BYTES : BITMAP_WEAPON_RAM_BYTES;

  // ---- constant tables ---------------------------------------------------
  // Info: isMelee, frameCount, frameDelay, cooldown (4 bytes per weapon).
  const infoBytes = config.weapons.flatMap((weapon, index) => {
    const frames = graphics[index]?.frames || [];
    const isMelee = weapon.isMelee && frames.length > 0;
    const frameDelay = graphics[index]?.sync
      ? Math.max(1, Math.min(255, Math.floor(graphics[index]!.sync!.frameDelay) || 1))
      : weapon.frameDelay;
    return [isMelee ? 1 : 0, isMelee ? frames.length : 0, frameDelay, weapon.cooldownFrames];
  });
  const firstDrawableWeapon = config.weapons.findIndex((_weapon, index) => (graphics[index]?.frames || []).length > 0);
  // Per-frame flags (bit0 hits, bit1 in front). A weapon without a combination
  // keeps the classic rule: its last frame hits, always behind the player.
  const frameFlagTables = config.weapons.map((weapon, index) => {
    const frames = graphics[index]?.frames || [];
    const sync = graphics[index]?.sync;
    const flags = frames.map((_frame, frameIndex) => {
      if (sync) {
        return ((sync.frameFlags[frameIndex] || 0) & (BITMAP_WEAPON_FRAME_HITS | (front ? BITMAP_WEAPON_FRAME_FRONT : 0)))
          | (attackAnimId > 0 ? BITMAP_WEAPON_FRAME_SYNC : 0);
      }
      return frameIndex === frames.length - 1 ? BITMAP_WEAPON_FRAME_HITS : 0;
    });
    if (!frames.length && firstDrawableWeapon >= 0) {
      return `bitmap_weapon_fflags_${index} EQU bitmap_weapon_fflags_${firstDrawableWeapon}    ; ${weapon.name}: never swings`;
    }
    return `bitmap_weapon_fflags_${index}:    ; ${weapon.name}: per frame bit0 hits, bit1 in front, bit7 drives the attack clip${sync ? ' (combination)' : ''}
    DB ${(flags.length ? flags : [0]).map(hexByte).join(',')}`;
  }).join('\n');


  // Offsets: per weapon, per frame, facing left then right: slotCount x
  // (dx, dy), dx = #80 for an absent layer. Per frame because a frame may leave a 16x16 cell empty,
  // which shifts the remaining layers.
  const offsetTables = config.weapons.map((weapon, index) => {
    const frames = graphics[index]?.frames || [];
    const rowsFor = (layers: BitmapWeaponLayerGraphics[] | undefined): string => {
      const cells: string[] = [];
      for (let k = 0; k < slotCount; k++) {
        const layer = layers?.[k];
        // dx = #80 marks an absent layer (-128 is never a real offset).
        cells.push(layer
          ? `${signedByte(Math.max(-127, layer.dx))},${signedByte(layer.dy)}`
          : '#80,0');
      }
      return `    DB ${cells.join(', ')}`;
    };
    // A weapon without swing frames is never drawn: it shares the first
    // drawable weapon's table instead of carrying an empty one (resident bytes).
    if (!frames.length && firstDrawableWeapon >= 0) {
      return `bitmap_weapon_offsets_${index} EQU bitmap_weapon_offsets_${firstDrawableWeapon}    ; ${weapon.name}: never drawn`;
    }
    const rows = frames.length
      ? frames.map((frame, frameIndex) => `${rowsFor(frame.left)}    ; frame ${frameIndex} facing left
${rowsFor(frame.right)}    ; frame ${frameIndex} facing right`).join('\n')
      : `${rowsFor(undefined)}    ; not melee: never drawn
${rowsFor(undefined)}`;
    return `bitmap_weapon_offsets_${index}:    ; ${weapon.name}
${rows}`;
  }).join('\n');

  // Frame blocks: per melee weapon, per frame, per facing: slotCount x 48 bytes.
  const emptyLayer = [...Array(32).fill(0), ...Array(16).fill(0)];
  // All frame blocks form ONE blob (bitmap_weapon_gfx). In a Konami MegaROM it
  // lives in a data bank (the resident image is full); the upload maps it
  // around each copy through bitmap_copy_banked_to_vram.
  const gfxBytes: number[] = [];
  const framePtrTables: string[] = [];
  config.weapons.forEach((weapon, index) => {
    const frames = graphics[index]?.frames || [];
    if (!weapon.isMelee || frames.length === 0) {
      framePtrTables.push(`bitmap_weapon_frames_${index}:    ; ${weapon.name}: no swing graphics\n    DW 0`);
      return;
    }
    const ptrs: string[] = [];
    frames.forEach((frame, frameIndex) => {
      (['left', 'right'] as const).forEach(facing => {
        const bytes: number[] = [];
        for (let k = 0; k < slotCount; k++) {
          const layer = frame[facing][k];
          if (!layer) {
            bytes.push(...emptyLayer);
            continue;
          }
          const pattern = layer.pattern.slice(0, 32);
          while (pattern.length < 32) pattern.push(0);
          const colors = layer.colors.slice(0, 16);
          while (colors.length < 16) colors.push(0);
          bytes.push(...pattern.map(v => v & 0xff), ...colors.map(v => v & 0xff));
        }
        ptrs.push(`bitmap_weapon_gfx + ${gfxBytes.length}`);
        gfxBytes.push(...bytes);
      });
    });
    framePtrTables.push(`bitmap_weapon_frames_${index}:    ; ${weapon.name}: frame0 L/R, frame1 L/R, ...\n    DW ${ptrs.join(', ')}`);
  });

  const ram = (offset: number) => hexWord(ramBase + offset);
  const equates = `; --- PLAYER WEAPONS runtime state (${ramBytes} bytes) ---
bitmap_weapon_owned        EQU ${ram(0)}
bitmap_weapon_equipped     EQU ${ram(1)}   ; #FF = no weapon
bitmap_weapon_active       EQU ${ram(2)}
bitmap_weapon_frame        EQU ${ram(3)}
bitmap_weapon_tick         EQU ${ram(4)}
bitmap_weapon_cooldown     EQU ${ram(5)}
bitmap_weapon_lock         EQU ${ram(6)}
bitmap_weapon_switch_lock  EQU ${ram(7)}
bitmap_weapon_dir          EQU ${ram(8)}
bitmap_weapon_dirty        EQU ${ram(9)}
bitmap_weapon_blocks_shoot EQU ${ram(10)}
bitmap_weapon_hud_index    EQU ${ram(11)}
bitmap_weapon_probe        EQU ${ram(12)}  ; 4 bytes: active, x, y, dir
bitmap_weapon_hit_done     EQU ${ram(16)}
bitmap_weapon_frame_count  EQU ${ram(17)}
bitmap_weapon_frame_delay  EQU ${ram(18)}
${syncMode ? `bitmap_weapon_sync         EQU ${ram(19)}  ; 1 = swing drives the player's attack clip
` : ''}BITMAP_WEAPON_COUNT        EQU ${weaponCount}
BITMAP_WEAPON_SLOTS        EQU ${slotCount}
`;

  const initAsm = `    call bitmap_weapon_init    ; weapons: inventory + swing state
`;

  const hitAsm = opts.hitTargetLabel
    ? `    ld ix, bitmap_weapon_probe
    call ${opts.hitTargetLabel}    ; preserves BC, IX
    ld a, (bitmap_weapon_probe)
    or a
    jr nz, .whit_next          ; nothing there: try the next layer
    ld a, 1
    ld (bitmap_weapon_hit_done), a    ; one hit per swing
    pop hl
    pop bc
    ret
`
    : `    ; No enemy/boss runtime in this ROM: the swing is purely visual.
`;

  const copyCall = opts.megaRom
    ? `    ld a, bitmap_weapon_gfx_DATA_BANK
    call bitmap_copy_banked_to_vram    ; maps the gfx bank around the copy
`
    : `    call copy_to_vram_ext
`;

  const satY = hexByte(opts.gameYOffset);
  const terminatorAsm = opts.writesTerminator
    ? `    ld a, #D8                  ; last SAT writer: terminate the list
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
`
    : '';

  // Upload of the visible frame's layers. With 2+ layers a loop over a small
  // destination table is far smaller than the unrolled copies (the resident
  // window of big MegaROM projects is tight); one layer stays unrolled.
  const uploadDestWords = Array.from({ length: slotCount }, (_unused, k) => [
    opts.patternBase + (opts.patternGroupBase + k) * 32,
    opts.colorAddress + k * 16,
    ...(front ? [front.colorAddress + k * 16] : []),
  ]).flat();
  const uploadLayersAsm = slotCount >= 2
    ? `    push ix
    ld ix, bitmap_weapon_upload_dests
    ld b, BITMAP_WEAPON_SLOTS
.wup_layer:
    push bc
    ld bc, 32                  ; pattern -> the layer's pattern group
    call .wup_copy
    ld bc, 16                  ; line colours -> the layer's colour block
    call .wup_copy
${front ? `    ld de, -16                 ; same colours again for the in-front SAT block
    add hl, de
    ld bc, 16
    call .wup_copy
` : ''}    pop bc
    djnz .wup_layer
    pop ix
    ret
.wup_copy:
    ; IN: IX -> destination word, HL = source, BC = bytes. OUT: IX += 2, HL += BC.
    ld e, (ix+0)
    ld d, (ix+1)
    inc ix
    inc ix
    push hl
    push bc
${copyCall}    pop bc
    pop hl
    add hl, bc
    ret
`
    : `${Array.from({ length: slotCount }, (_unused, k) => `    ; layer ${k}: pattern -> group ${opts.patternGroupBase + k}, colours -> ${hexWord(opts.colorAddress + k * 16)}
    push hl
    ld de, ${hexWord(opts.patternBase + (opts.patternGroupBase + k) * 32)}
    ld bc, 32
${copyCall}    pop hl
    ld de, 32
    add hl, de
    push hl
    ld de, ${hexWord(opts.colorAddress + k * 16)}
    ld bc, 16
${copyCall}    pop hl
${front ? `    push hl                    ; same line colours for the in-front SAT block
    ld de, ${hexWord(front.colorAddress + k * 16)}
    ld bc, 16
${copyCall}    pop hl
` : ''}    ld de, 16
    add hl, de
`).join('')}    ret
`;

  // SAT writer. Classic: one block after the enemies (always behind the
  // player). With an "in front" combination frame: a second block right before
  // the player; each frame writes its layers to one block and parks the other.
  const backSatAsm = `bitmap_weapon_sat:
    push bc
    ld de, ${hexWord(opts.satAddress)}
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
    ld a, (bitmap_weapon_active)
    or a
    jr z, .wsat_all_hidden
    call bitmap_weapon_offsets_ptr
    ld c, 0                    ; layer index -> pattern group
    ld b, BITMAP_WEAPON_SLOTS
.wsat_loop:
    push bc
    call bitmap_weapon_layer_xy    ; D = x, E = y, carry = hidden
    pop bc
    jr c, .wsat_hidden
    ld a, e
    add a, ${satY}
    out (VDP_DATA_PORT), a
    ld a, d
    out (VDP_DATA_PORT), a
    ld a, c
    add a, a
    add a, a
    add a, ${hexByte((opts.patternGroupBase * 4) & 0xff)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jr .wsat_next
.wsat_hidden:
    ld a, #D4
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.wsat_next:
    inc hl
    inc hl
    inc c
    djnz .wsat_loop
    jr .wsat_done
.wsat_all_hidden:
    ld b, BITMAP_WEAPON_SLOTS
.wsat_hide_loop:
    ld a, #D4
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    djnz .wsat_hide_loop
.wsat_done:
${terminatorAsm}    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop bc
    ret
`;
  const frontSatAsm = front ? `bitmap_weapon_sat:
    push bc
    ld a, (bitmap_weapon_active)
    or a
    jr z, .wsat_front          ; A = 0: nothing in front
    call bitmap_weapon_frame_flags
    and ${hexByte(BITMAP_WEAPON_FRAME_FRONT)}
.wsat_front:
    push af                    ; A != 0: this frame is drawn over the player
    ld de, ${hexWord(front.satAddress)}
    call bitmap_weapon_sat_block
    pop af
    or a
    ld a, 0                    ; in front: park the back block (flags kept)
    jr nz, .wsat_back
    ld a, (bitmap_weapon_active)    ; behind the player = swinging and not in front
.wsat_back:
    ld de, ${hexWord(opts.satAddress)}
    call bitmap_weapon_sat_block
${terminatorAsm}    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_sat_block
; ------------------------------------------------------------
; PURPOSE:
;   Write one weapon SAT block: the visible swing frame's layers, or every slot
;   parked off screen (Y = #D4, never the #D8 terminator).
; INPUT: DE = SAT block VRAM address; A != 0 layers, A = 0 park.
; OUTPUT: ${slotCount} SAT entr${slotCount === 1 ? 'y' : 'ies'} written.
; DESTROYS: AF, BC, DE, HL.
; PRESERVES: IX, IY.
; CALLS: vdp_write_register, bitmap_weapon_offsets_ptr, bitmap_weapon_layer_xy.
; SIDE EFFECTS: R#14 = address bits 14-16 (the caller restores 0).
; NOTES: Both blocks share the weapon's pattern groups and colours.
; ------------------------------------------------------------
bitmap_weapon_sat_block:
    push af
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
    pop af
    or a
    jr z, .wsb_hide
    call bitmap_weapon_offsets_ptr
    ld c, 0                    ; layer index -> pattern group
    ld b, BITMAP_WEAPON_SLOTS
.wsb_loop:
    push bc
    call bitmap_weapon_layer_xy    ; D = x, E = y, carry = hidden
    pop bc
    jr c, .wsb_hidden
    ld a, e
    add a, ${satY}
    out (VDP_DATA_PORT), a
    ld a, d
    out (VDP_DATA_PORT), a
    ld a, c
    add a, a
    add a, a
    add a, ${hexByte((opts.patternGroupBase * 4) & 0xff)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jr .wsb_next
.wsb_hidden:
    ld a, #D4
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.wsb_next:
    inc hl
    inc hl
    inc c
    djnz .wsb_loop
    ret
.wsb_hide:
    ld b, BITMAP_WEAPON_SLOTS
.wsb_hide_loop:
    ld a, #D4
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    djnz .wsb_hide_loop
    ret
` : '';

  const routinesAsm = `
; ==================================================================
; PLAYER WEAPONS (melee swing + inventory). ${weaponCount} weapon(s), ${slotCount} SAT slot(s).
; ==================================================================
${buildKeyReadAsm('bitmap_weapon_attack_pressed', config.attackKey, 'Reads the weapon attack key (player button B)')}
${buildKeyReadAsm('bitmap_weapon_switch_pressed', config.switchKey, 'Reads the weapon switch key')}
; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_init
; ------------------------------------------------------------
; PURPOSE:
;   Boot/WorldLink state: weapons authored as "owned at start" are in hand,
;   the authored equipped weapon (or the first owned one) is selected and no
;   swing is running.
; INPUT: None.
; OUTPUT: Weapon RAM initialised.
; DESTROYS: AF, B, HL.
; PRESERVES: C, DE, IX, IY.
; CALLS: bitmap_weapon_refresh_equipped.
; SIDE EFFECTS: Writes the weapon RAM block.
; NOTES: The equipped byte uses #FF as its "none" sentinel, never 0.
; ------------------------------------------------------------
bitmap_weapon_init:
    ld hl, bitmap_weapon_owned
    ld b, ${ramBytes}
    xor a
.winit_clear:
    ld (hl), a
    inc hl
    djnz .winit_clear
    ld a, ${hexByte(config.initialOwnedMask)}
    ld (bitmap_weapon_owned), a
    ld a, ${config.initialEquippedIndex >= 0 ? hexByte(config.initialEquippedIndex) : '#FF'}
    ld (bitmap_weapon_equipped), a
    ld a, 1
    ld (bitmap_weapon_lock), a         ; a B held through boot must be released first
    ld (bitmap_weapon_switch_lock), a
    jp bitmap_weapon_refresh_equipped

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_info_ptr
; ------------------------------------------------------------
; PURPOSE: Point at the equipped weapon's info record.
; INPUT: bitmap_weapon_equipped (must not be #FF).
; OUTPUT: HL -> isMelee, frameCount, frameDelay, cooldown.
; DESTROYS: AF, DE, HL.
; PRESERVES: BC, IX, IY.
; CALLS: None.
; SIDE EFFECTS: None.
; NOTES: Table lives in the resident low window.
; ------------------------------------------------------------
bitmap_weapon_info_ptr:
    ld a, (bitmap_weapon_equipped)
    add a, a
    add a, a                   ; 4 bytes per weapon (max 8 weapons)
    ld e, a
    ld d, 0
    ld hl, bitmap_weapon_info
    add hl, de
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_refresh_equipped
; ------------------------------------------------------------
; PURPOSE:
;   Publish the equipped weapon: HUD index (0 = none, n+1 = weapon n) and the
;   shoot gate (1 while a melee weapon is equipped: B swings, it does not shoot).
; INPUT: bitmap_weapon_equipped.
; OUTPUT: bitmap_weapon_hud_index, bitmap_weapon_blocks_shoot.
; DESTROYS: AF, DE, HL.
; PRESERVES: BC, IX, IY.
; CALLS: bitmap_weapon_info_ptr.
; SIDE EFFECTS: The equippedWeapon HUD widget repaints on its next update.
; NOTES: None.
; ------------------------------------------------------------
bitmap_weapon_refresh_equipped:
    ld a, (bitmap_weapon_equipped)
    cp #FF
    jr z, .wref_none
    inc a
    ld (bitmap_weapon_hud_index), a
    call bitmap_weapon_info_ptr
    ld a, (hl)                 ; isMelee
    ld (bitmap_weapon_blocks_shoot), a
    ret
.wref_none:
    xor a
    ld (bitmap_weapon_hud_index), a
    ld (bitmap_weapon_blocks_shoot), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_grant
; ------------------------------------------------------------
; PURPOSE:
;   A room pickup gives the player weapon A: mark it owned and equip it
;   (unless a swing is running; then it is only added to the inventory).
; INPUT: A = weapon index (0..${weaponCount - 1}).
; OUTPUT: Inventory and equipped weapon updated.
; DESTROYS: AF, B, DE, HL.
; PRESERVES: C, IX, IY.
; CALLS: bitmap_weapon_refresh_equipped.
; SIDE EFFECTS: HUD index / shoot gate change.
; NOTES: Called by the pickup scan (bitmap_update_gems).
; ------------------------------------------------------------
bitmap_weapon_grant:
    cp BITMAP_WEAPON_COUNT
    ret nc                     ; defensive: unknown weapon index
    ld e, a                    ; E = index
    ld b, a
    inc b
    ld a, #80
.wgrant_mask:
    rlca                       ; #80 -> #01 on the first turn, then shifts left
    djnz .wgrant_mask
    ld hl, bitmap_weapon_owned
    or (hl)
    ld (hl), a
    ld a, (bitmap_weapon_active)
    or a
    ret nz
    ld a, e
    ld (bitmap_weapon_equipped), a
    jp bitmap_weapon_refresh_equipped

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_cycle
; ------------------------------------------------------------
; PURPOSE: Equip the next owned weapon after the current one (wraps around).
; INPUT: bitmap_weapon_owned, bitmap_weapon_equipped.
; OUTPUT: bitmap_weapon_equipped updated when another weapon is owned.
; DESTROYS: AF, BC, DE, HL.
; PRESERVES: IX, IY.
; CALLS: bitmap_weapon_refresh_equipped.
; SIDE EFFECTS: HUD index / shoot gate change.
; NOTES: With a single owned weapon the cycle lands on it again (no-op).
; ------------------------------------------------------------
bitmap_weapon_cycle:
    ld a, (bitmap_weapon_owned)
    or a
    ret z
    ld a, (bitmap_weapon_equipped)
    ld c, a                    ; #FF + 1 = 0: from "none" the scan starts at 0
    ld b, BITMAP_WEAPON_COUNT
.wcycle_next:
    ld a, c
    inc a
    cp BITMAP_WEAPON_COUNT
    jr c, .wcycle_index_ok
    xor a
.wcycle_index_ok:
    ld c, a
    ; Bit C of the owned mask -> bit 0.
    ld e, a
    inc e
    ld a, (bitmap_weapon_owned)
    rlca                       ; pre-compensate the first rrca
.wcycle_shift:
    rrca
    dec e
    jr nz, .wcycle_shift
    and 1
    jr nz, .wcycle_found
    djnz .wcycle_next
    ret
.wcycle_found:
    ld a, c
    ld (bitmap_weapon_equipped), a
    jp bitmap_weapon_refresh_equipped

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_swish_sfx
; ------------------------------------------------------------
; PURPOSE: Short noise swish on PSG channel C when a swing starts.
; INPUT: None.  OUTPUT: None.
; DESTROYS: AF, B, HL.
; PRESERVES: C, DE, IX, IY.
; CALLS: None.
; SIDE EFFECTS: PSG registers 6, 7, 10-13; psg_sfx_r7_c_bits (noise C on, tone C off).
; NOTES: Fire-and-forget like the shoot pew: the hardware envelope decays it.
; ------------------------------------------------------------
bitmap_weapon_swish_sfx:
    ld hl, bitmap_weapon_swish_data
    ld b, 6
.wswish_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .wswish_loop
    ld a, #04                  ; shadow: tone C off, noise C on (music merges it)
    ld (psg_sfx_r7_c_bits), a
    ret
bitmap_weapon_swish_data:
    ; reg,value: mixer (noise C only), noise period, envelope period, volume=envelope, shape
    DB 7,#1F, 6,#04, 11,#30, 12,#00, 10,#10, 13,#09

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_update
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame weapon logic (logic phase, after update_player_movement and
;   BEFORE the shoot gate): cooldown, switch key (edge), swing start on the
;   attack key (edge, melee weapon equipped, cooldown elapsed), swing animation
;   and the hit test on the swing's last frame.
; INPUT: Weapon RAM, player_facing, player_x, player_y.
; OUTPUT: Weapon RAM updated; bitmap_weapon_dirty = 1 when the visible frame changes.
; DESTROYS: AF, BC, DE, HL, IX.
; PRESERVES: IY.
; CALLS: bitmap_weapon_switch_pressed, bitmap_weapon_attack_pressed,
;   bitmap_weapon_cycle, bitmap_weapon_info_ptr, bitmap_weapon_swish_sfx,
;   bitmap_weapon_try_hit.
; SIDE EFFECTS: PSG swish on swing start.
; NOTES: Facing is latched at swing start so turning mid-swing does not flip it.
; ------------------------------------------------------------
bitmap_weapon_update:
    ld a, (bitmap_weapon_cooldown)
    or a
    jr z, .wupd_switch
    dec a
    ld (bitmap_weapon_cooldown), a
.wupd_switch:
    call bitmap_weapon_switch_pressed
    jr nz, .wupd_switch_held
    ld (bitmap_weapon_switch_lock), a    ; A = 0: released
    jr .wupd_attack
.wupd_switch_held:
    ld a, (bitmap_weapon_switch_lock)
    or a
    jr nz, .wupd_attack
    inc a
    ld (bitmap_weapon_switch_lock), a
    ld a, (bitmap_weapon_active)
    or a
    call z, bitmap_weapon_cycle          ; never swap weapons mid-swing
.wupd_attack:
    ld a, (bitmap_weapon_active)
    or a
    jr nz, .wupd_swing_step
    call bitmap_weapon_attack_pressed
    jr nz, .wupd_attack_held
    ld (bitmap_weapon_lock), a           ; A = 0: released
    ret
.wupd_attack_held:
    ld a, (bitmap_weapon_lock)
    or a
    ret nz                               ; one swing per press
    ld a, (bitmap_weapon_blocks_shoot)
    or a
    ret z                                ; no melee weapon equipped: B belongs to the shoot skill
    ld a, (bitmap_weapon_cooldown)
    or a
    ret nz
    ; ---- start a swing ----
    ld a, 1
    ld (bitmap_weapon_lock), a
    ld (bitmap_weapon_active), a
    ld (bitmap_weapon_dirty), a
    xor a
    ld (bitmap_weapon_frame), a
    ld (bitmap_weapon_hit_done), a
    ld a, (player_facing)
    or a
    jr z, .wupd_dir_ok
    ld a, 1
.wupd_dir_ok:
    ld (bitmap_weapon_dir), a
    call bitmap_weapon_info_ptr
    inc hl
    ld a, (hl)                           ; frameCount
    ld (bitmap_weapon_frame_count), a
    inc hl
    ld a, (hl)                           ; frameDelay
    ld (bitmap_weapon_frame_delay), a
    ld (bitmap_weapon_tick), a
${syncMode ? `    ; Combination with the attack clip (flag bit7): lock the player's animation
    ; to the swing. bitmap_weapon_frame is 0 here.
    call bitmap_weapon_frame_flags
    and ${hexByte(BITMAP_WEAPON_FRAME_SYNC)}
    ld (bitmap_weapon_sync), a
    call bitmap_weapon_assert_anim
` : ''}    jp bitmap_weapon_swish_sfx
.wupd_swing_step:
${syncMode ? `    ; Hit frames come from the per-frame flags (bit0): test every frame a hit
    ; frame stays on screen, so an enemy walking into the blade is still hit
    ; (once per swing).
    call bitmap_weapon_frame_flags
    and ${hexByte(BITMAP_WEAPON_FRAME_HITS)}
    call nz, bitmap_weapon_try_hit
    ld hl, bitmap_weapon_tick
    dec (hl)
    jr nz, .wupd_swing_keep
` : `    ; The last frame is the hit frame: test every frame it stays on screen, so an
    ; enemy walking into the blade is still hit (once per swing).
    ld a, (bitmap_weapon_frame)
    inc a
    ld hl, bitmap_weapon_frame_count
    cp (hl)
    call z, bitmap_weapon_try_hit
    ld hl, bitmap_weapon_tick
    dec (hl)
    ret nz
`}    ld a, (bitmap_weapon_frame_delay)
    ld (bitmap_weapon_tick), a
    ld a, (bitmap_weapon_frame)
    inc a
    ld hl, bitmap_weapon_frame_count
    cp (hl)
    jr nc, .wupd_swing_end
    ld (bitmap_weapon_frame), a
    ld a, 1
    ld (bitmap_weapon_dirty), a
${syncMode ? `.wupd_swing_keep:
    ; Still swinging: re-assert the attack clip AFTER the State Machine wrote
    ; player_anim_state this frame (never on the end frame, so the SM state
    ; is back on the very next VRAM phase).
    jp bitmap_weapon_assert_anim
` : `    ret
`}.wupd_swing_end:
    xor a
    ld (bitmap_weapon_active), a         ; the SAT writer hides the slots${syncMode ? `
    ld (bitmap_weapon_sync), a           ; release the player's animation` : ''}
    call bitmap_weapon_info_ptr
    inc hl
    inc hl
    inc hl
    ld a, (hl)                           ; cooldown after the swing
    ld (bitmap_weapon_cooldown), a
    ret

${syncMode ? `; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_frame_flags
; ------------------------------------------------------------
; PURPOSE: Flags of the visible swing frame of the equipped weapon.
; INPUT: bitmap_weapon_equipped (not #FF), bitmap_weapon_frame.
; OUTPUT: A = bit0 hits, bit1 drawn in front of the player, bit7 drives the attack clip.
; DESTROYS: AF, DE, HL.
; PRESERVES: BC, IX, IY.
; CALLS: None.
; SIDE EFFECTS: None.
; NOTES: Tables authored by the Sprite Editor weapon combinations; weapons
;   without a combination flag only their last frame as the hit frame.
; ------------------------------------------------------------
bitmap_weapon_frame_flags:
    ld a, (bitmap_weapon_equipped)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_weapon_fflag_ptrs
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, (bitmap_weapon_frame)
    ld e, a                    ; D is still 0
    add hl, de
    ld a, (hl)
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_assert_anim
; ------------------------------------------------------------
; PURPOSE:
;   While a synced swing runs, select the player's attack clip. The clip frame
;   itself is forced to bitmap_weapon_frame by bitmap_update_player_sprite_animation,
;   so player and weapon can never drift apart.
; INPUT: bitmap_weapon_sync.
; OUTPUT: player_anim_state = attack clip${attackAnimId > 0 ? ` (${attackAnimId})` : ''} when syncing.
; DESTROYS: AF.
; PRESERVES: BC, DE, HL, IX, IY.
; CALLS: None.
; SIDE EFFECTS: Overrides the State Machine's clip choice for this frame.
; NOTES: Runs in the logic phase, after the State Machine and the air clip.
; ------------------------------------------------------------
bitmap_weapon_assert_anim:
    ld a, (bitmap_weapon_sync)
    or a
    ret z
${attackAnimId > 0 ? `    ld a, ${attackAnimId}
    ld (player_anim_state), a
` : ''}    ret

` : ''}; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_offsets_ptr
; ------------------------------------------------------------
; PURPOSE: Point at the (dx, dy) layer table of the visible swing frame.
; INPUT: bitmap_weapon_equipped (not #FF), bitmap_weapon_frame,
;   bitmap_weapon_dir (0 left, 1 right).
; OUTPUT: HL -> BITMAP_WEAPON_SLOTS x 2 bytes (dx = #80: absent layer).
; DESTROYS: AF, DE, HL.
; PRESERVES: BC, IX, IY.
; CALLS: None.
; SIDE EFFECTS: None.
; NOTES: Rows are frame-major: frame0 left, frame0 right, frame1 left, ...
; ------------------------------------------------------------
bitmap_weapon_offsets_ptr:
    push bc
    ld a, (bitmap_weapon_equipped)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_weapon_offset_ptrs
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, (bitmap_weapon_frame)
    add a, a
    ld e, a
    ld a, (bitmap_weapon_dir)
    add a, e                   ; row = frame * 2 + dir
    or a
    jr z, .woff_done
    ld b, a
    ld de, ${slotCount * 2}
.woff_step:
    add hl, de
    djnz .woff_step
.woff_done:
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_layer_xy
; ------------------------------------------------------------
; PURPOSE:
;   Screen position of one weapon layer: player position + signed offset,
;   rejecting layers that fall off the play area.
; INPUT: HL -> (dx, dy) of the layer (dx = #80: absent).
; OUTPUT: Carry clear = visible, D = x, E = y (game coordinates).
;         Carry set = hidden (absent layer or off screen).
; DESTROYS: AF, BC, DE.
; PRESERVES: HL, IX, IY.
; CALLS: None.
; SIDE EFFECTS: None.
; NOTES: Offsets are signed bytes; the sums are done in 16 bits.
; ------------------------------------------------------------
bitmap_weapon_layer_xy:
    push hl
    ld a, (hl)                 ; dx
    cp #80
    jr z, .wxy_hidden          ; absent layer
    ld c, a
    add a, a
    sbc a, a                   ; sign extend
    ld b, a
    push hl
    ld a, (player_x)
    ld l, a
    ld h, 0
    add hl, bc
    ld a, h
    or a
    ld a, l
    pop hl
    jr nz, .wxy_hidden         ; left of 0 or right of 255
    ld d, a
    inc hl
    ld a, (hl)                 ; dy
    ld c, a
    add a, a
    sbc a, a
    ld b, a
    ld a, (player_y)
    ld l, a
    ld h, 0
    add hl, bc
    ld a, h
    or a
    jr nz, .wxy_hidden
    ld a, l
    cp ${hexByte(Math.max(1, Math.min(255, opts.playAreaHeight)))}
    jr nc, .wxy_hidden
    ld e, a
    pop hl
    or a                       ; carry clear: visible
    ret
.wxy_hidden:
    pop hl
    scf
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_try_hit
; ------------------------------------------------------------
; PURPOSE:
;   Offer every visible layer of the swing to the bullet target routine as a
;   bullet-shaped probe. The first layer the target consumes ends the test and
;   latches bitmap_weapon_hit_done for the rest of the swing.
; INPUT: Weapon RAM (swing on its last frame).
; OUTPUT: Enemy/boss damaged on contact; bitmap_weapon_hit_done.
; DESTROYS: AF, BC, DE, HL, IX.
; PRESERVES: IY.
; CALLS: bitmap_weapon_offsets_ptr, bitmap_weapon_layer_xy${opts.hitTargetLabel ? `, ${opts.hitTargetLabel}` : ''}.
; SIDE EFFECTS: Same as a player bullet hit (enemy killed, boss damaged).
; NOTES: A probe hits when its 16x16 cell overlaps the target's, exactly like a bullet.
; ------------------------------------------------------------
bitmap_weapon_try_hit:
    ld a, (bitmap_weapon_hit_done)
    or a
    ret nz
    call bitmap_weapon_offsets_ptr
    ld b, BITMAP_WEAPON_SLOTS
.whit_loop:
    push bc
    push hl
    call bitmap_weapon_layer_xy
    jr c, .whit_next
    ld a, 1
    ld (bitmap_weapon_probe), a
    ld a, d
    ld (bitmap_weapon_probe + 1), a
    ld a, e
    ld (bitmap_weapon_probe + 2), a
    ld a, (bitmap_weapon_dir)
    ld (bitmap_weapon_probe + 3), a
${hitAsm}.whit_next:
    pop hl
    inc hl
    inc hl
    pop bc
    djnz .whit_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_sat
; ------------------------------------------------------------
; PURPOSE:
;   SAT writer for the weapon slots (VRAM ${hexWord(opts.satAddress)}): visible layers of
;   the running swing, #D4 (parked off screen) otherwise.${opts.writesTerminator ? ' Appends the #D8 terminator (no later SAT writer).' : ''}
; INPUT: Weapon RAM, player_x, player_y.
; OUTPUT: ${slotCount} SAT entr${slotCount === 1 ? 'y' : 'ies'} written.
; DESTROYS: AF, DE, HL.
; PRESERVES: BC, IX, IY.
; CALLS: vdp_write_register, bitmap_weapon_offsets_ptr, bitmap_weapon_layer_xy.
; SIDE EFFECTS: Leaves R#14 = 0.
; NOTES: Runs in the SAT phase right after the vblank flag, like every SAT writer.
; ------------------------------------------------------------
${front ? frontSatAsm : backSatAsm}
; ------------------------------------------------------------
; FUNCTION: bitmap_weapon_upload
; ------------------------------------------------------------
; PURPOSE:
;   Deferred VRAM phase: copy the visible swing frame (pattern + line colours of
;   every weapon layer) into the weapon's sprite pattern groups and colour
;   blocks when bitmap_weapon_dirty is set.
; INPUT: Weapon RAM.
; OUTPUT: VRAM pattern groups ${opts.patternGroupBase}..${opts.patternGroupBase + slotCount - 1}, colour blocks from ${hexWord(opts.colorAddress)}.
; DESTROYS: AF, BC, DE, HL.
; PRESERVES: IX, IY.
; CALLS: ${opts.megaRom ? 'bitmap_copy_banked_to_vram' : 'copy_to_vram_ext'}.
; SIDE EFFECTS: ${opts.megaRom ? 'Maps the gfx data bank in P2 during each copy and restores the resident banks; ' : ''}leaves R#14 = 0.
; NOTES: Skipped while a room composition streams data (keeps its banks); the
;   dirty flag stays set and the copy happens on the first idle frame.
; ------------------------------------------------------------
bitmap_weapon_upload:
    ld a, (bitmap_weapon_dirty)
    or a
    ret z
    ld a, (bitmap_composition_state)
    or a
    ret nz
    xor a
    ld (bitmap_weapon_dirty), a
    ld a, (bitmap_weapon_active)
    or a
    ret z
    ; HL = bitmap_weapon_frame_ptrs[equipped] -> frame list
    ld a, (bitmap_weapon_equipped)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_weapon_frame_ptrs
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ; entry = (frame * 2 + dir) * 2
    ld a, (bitmap_weapon_frame)
    add a, a
    ld e, a
    ld a, (bitmap_weapon_dir)
    add a, e
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, h
    or l
    ret z                      ; weapon without graphics
${uploadLayersAsm}
; ---- weapon tables (resident: read by the SAT writer) ----
bitmap_weapon_info:    ; per weapon: isMelee, frameCount, frameDelay, cooldown
${dbLines(infoBytes)}
bitmap_weapon_offset_ptrs:
    DW ${config.weapons.map((_weapon, index) => `bitmap_weapon_offsets_${index}`).join(', ')}
${offsetTables}
bitmap_weapon_frame_ptrs:    ; per weapon -> list of (frame, facing) blocks inside bitmap_weapon_gfx
    DW ${config.weapons.map((_weapon, index) => `bitmap_weapon_frames_${index}`).join(', ')}
${framePtrTables.join('\n')}
${slotCount >= 2 ? `bitmap_weapon_upload_dests:    ; per layer: pattern, colours${front ? ', in-front colours' : ''} (VRAM)
    DW ${uploadDestWords.map(hexWord).join(', ')}
` : ''}${syncMode ? `bitmap_weapon_fflag_ptrs:
    DW ${config.weapons.map((_weapon, index) => `bitmap_weapon_fflags_${index}`).join(', ')}
${frameFlagTables}
` : ''}`;

  const gfxDescription = `Player weapon swing graphics: per weapon/frame/facing ${slotCount} x (pattern 32 + colours 16) = ${frameBlockBytes} bytes`;
  const dataAsm = opts.megaRom
    ? ''
    : `
; ---- PLAYER WEAPONS: ${gfxDescription} ----
bitmap_weapon_gfx:
${dbLines(gfxBytes)}
`;
  const bankedBlocks = opts.megaRom
    ? [{ label: 'bitmap_weapon_gfx', bytes: gfxBytes, description: `${gfxDescription}; uploaded by bitmap_weapon_upload through bitmap_copy_banked_to_vram` }]
    : [];

  return {
    enabled: true,
    ramBytes,
    equates,
    initAsm,
    updateCallAsm: '    call bitmap_weapon_update    ; weapons: switch key, B swing, hit frame\n',
    satCallAsm: '    call bitmap_weapon_sat\n',
    uploadCallAsm: '    call bitmap_weapon_upload\n',
    routinesAsm,
    dataAsm,
    bankedBlocks,
    blocksShootLabel: 'bitmap_weapon_blocks_shoot',
    hudIndexLabel: 'bitmap_weapon_hud_index',
  };
}

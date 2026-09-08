import {
  MSX2_ENEMY_MOVEMENT_PATROL_CHASE_X,
  MSX2_ENEMY_MOVEMENT_WALKER_GRAVITY,
  MSX2_ENEMY_MOVEMENT_SLIME_CEILING,
  MSX2_ENEMY_MOVEMENT_GEAR_WHEEL,
  MSX2_ENEMY_MOVEMENT_FLY_BOUNCE_8,
  MSX2_ENEMY_MOVEMENT_LAYER_FOLLOWER,
} from './msx2EntityRuntimeGenerator';
import {
  MSX2_ENEMY_MOVEMENT_SCRIPTED,
  enemyScriptScratchBytes,
  MSX2_ENEMY_SCRIPT_POOL_BYTES,
  MSX2_ENEMY_PATH_POOL_BYTES,
  buildEnemyBehaviorRuntimeAsm,
  buildEnemyBehaviorProgramAsm,
  enemyProgramsUseGravity,
} from './msx2EnemyBehaviorRuntime';

/**
 * SCREEN 5 bitmap-room ENEMY runtime — patrol MVP.
 *
 * Port of the SCREEN 4 enemy/hazard slot system (msx2Screen4Generator
 * update_msx2_enemy_position_slot_N, PATROL mode only for now): each placed
 * `kind: 'enemy' | 'hazard'` entity with movement mode patrolX/patrolY becomes
 * one hardware sprite that bounces between minX/maxX (or minY/maxY) at 1px per
 * frame, exactly like the SCREEN 4 patrol handler. Enemies animate through
 * their sprite asset's frames and mirror horizontally when patrolling left
 * (variant order in VRAM: [facing-right, facing-left] per frame). While an
 * NPC dialogue is open the whole enemy engine pauses (movement + animation);
 * the SAT writer keeps running so the sprites stay visible, frozen.
 *
 * VRAM layout (sprite mode 2):
 *   SAT slots     [foreground][player layers][ENEMIES][bullets][terminator]
 *   colour table  current 16-byte line-colour block per enemy SAT slot
 *   patterns      per-slot maxFrames*2 (or *4 for slime-capable slots)
 *                 32-byte groups, uploaded per room by bitmap_load_enemies
 *                 from the unique-sprite pattern table
 *
 * RAM (chained after the dialogue system, below the #C1F0 ceiling):
 *   bitmap_enemy_count   1 byte  active slots in the current room
 *   bitmap_enemy_pool    24 bytes/slot: x, y, dx, dy, minX, maxX, minY, maxY,
 *                        animTick, animFrame, frameCount, animDelay, colorOff,
 *                        mode, visualXOff, visualYOff, damage, hitX, hitY,
 *                        hitW, hitH, speed, logicInterval, logicCountdown
 *                        (+3 when a SlimeCeiling enemy exists anywhere:
 *                        travelPx, travelCount, phase; +5 for GearWheel:
 *                        state, cooldownLo/Hi, delayLo/Hi; +2 for FlyBounce8
 *                        bats: flyLeft, flyTurnPx)
 *
 * ROM (resident, like the foreground tables):
 *   bitmap_room_enemy_table_N   count + maxSlots*(22 bytes, or 23 with slime)
 *                               x,y,dx,dy,minX,maxX,minY,maxY,
 *                               patGroupOff,colorOff,frameCount,animDelay,
 *                               mode,visualXOff,visualYOff,damage,hitX,hitY,
 *                               hitW,hitH,speed,logicInterval (+travelPx on slime builds,
 *                               +respawnFramesLo/Hi on GearWheel builds,
 *                               +turnPx on FlyBounce8 builds)
 *   bitmap_room_enemy_ptr_table DW per room
 *   bitmap_enemy_sprite_patterns  frames*2 variants x 32 bytes per unique sprite
 *                                 (frames*4 on slime builds: vertical-flip pair)
 *   bitmap_enemy_sprite_colors    frameCount x 16 bytes per unique sprite layer
 *                                 (x2 on slime builds: flipped tables appended)
 */

export const BITMAP_MAX_ENEMY_SLOTS = 4;
export const BITMAP_MAX_ENEMY_FRAMES = 4;
export const BITMAP_ENEMY_POOL_STRIDE = 24;  // RAM bytes per slot (base build)
/** Slime builds append travelPx/travelCount/phase to every pool slot. */
export const BITMAP_ENEMY_POOL_STRIDE_SLIME = 27;
/** Gear builds append state/cooldown/delay (5 bytes) to every pool slot. */
export const BITMAP_ENEMY_POOL_STRIDE_GEAR = 29;
/** Combined Slime + Gear build. */
export const BITMAP_ENEMY_POOL_STRIDE_SLIME_GEAR = 32;
/** FlyBounce8 builds append flyLeft/flyTurnPx to every pool slot. */
export const BITMAP_ENEMY_POOL_STRIDE_FLY8_BYTES = 2;
/** Scripted builds append program/state/timer/vertical-velocity to every slot. */
export const BITMAP_ENEMY_POOL_STRIDE_SCRIPTED = MSX2_ENEMY_SCRIPT_POOL_BYTES;
/** PATH FOLLOW builds append node-index and branch-mask bytes after scripted state. */
export const BITMAP_ENEMY_POOL_STRIDE_PATH = MSX2_ENEMY_PATH_POOL_BYTES;
/**
 * Authored behaviour programs are read by bitmap_enemy_script_step on every
 * logic tick. They therefore stay in the resident ROM window; only the per-room
 * placement tables may be cold/banked and staged during bitmap_load_enemies.
 */
export const MSX2_ENEMY_BEHAVIOR_RUNTIME_STORAGE = 'resident' as const;
/** FIRE uses a deliberately small pool, independent from player/boss bullets. */
export const BITMAP_ENEMY_BULLET_SLOTS = 2;
/** First-cut enemy projectile speed, in logical pixels per video frame. */
export const BITMAP_ENEMY_BULLET_SPEED = 3;
/** Built-in 16x16 mode-2 projectile: a small centred diamond in four quadrants. */
const ENEMY_BULLET_PATTERN_BYTES = [
  0x00, 0x00, 0x00, 0x00, 0x18, 0x00, 0x3C, 0x00,
  0x7E, 0x00, 0x3C, 0x00, 0x18, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];
const ENEMY_BULLET_COLOR_BYTES = Array.from({ length: 16 }, () => 0xF1);

/** RAM pool stride actually used by the generated runtime for this project.
 *  One term per optional movement engine: enumerating the combinations instead
 *  needs a constant per subset, and three engines already means eight. */
export function bitmapEnemyPoolStride(data: BitmapEnemyRoomData | undefined): number {
  const programsUsePath = data?.scriptedEnabled === true
    && data.scriptedBehaviorPrograms?.some(program => program.kind === 'path_follow') === true;
  return BITMAP_ENEMY_POOL_STRIDE
    + (data?.slimeEnabled ? 3 : 0)
    + (data?.gearEnabled ? 5 : 0)
    + (data?.fly8Enabled ? BITMAP_ENEMY_POOL_STRIDE_FLY8_BYTES : 0)
    + (data?.scriptedEnabled ? BITMAP_ENEMY_POOL_STRIDE_SCRIPTED : 0)
    + (programsUsePath ? BITMAP_ENEMY_POOL_STRIDE_PATH : 0)
    + (data?.konamiPaths?.length ? 8 : 0);
}

/** Sprite pattern variants emitted per animation frame ([right,left] or
 *  [right,left,ceilRight,ceilLeft] when a SlimeCeiling enemy exists). */
export function bitmapEnemyVariantsPerFrame(data: BitmapEnemyRoomData | undefined): number {
  return data?.slimeEnabled ? 4 : 2;
}
/** Same off-screen non-terminator Y the foreground empty slots use. */
const ENEMY_EMPTY_SPRITE_Y = 0xD4;

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export interface BitmapEnemyRoomData {
  /** Shared resident position tables and per-room hardware-slot references (-1 = none). */
  konamiPaths?: Array<{ bytes: number[]; loop: boolean }>;
  konamiRoomPaths?: number[][];
  /** Max enemy slots used by any room (0 disables the whole system). */
  maxSlots: number;
  /** Max animation frames across the unique enemy sprites (>= 1). */
  maxFrames: number;
  /**
   * Per-room table bytes: [count] + maxSlots * table stride (22 base plus
   * opt-in extensions). In MegaROM these placement tables are cold/banked and
   * staged by bitmap_load_enemies; the reusable scripted programs are separate
   * resident data.
   */
  roomTables: number[][];
  /** frames * variants x 32 bytes per unique enemy sprite ([right, left] per frame,
   *  plus [ceilRight, ceilLeft] vertical flips when slimeEnabled). */
  patternBytes: number[];
  /** frameCount x 16 bytes per unique enemy sprite layer (line colour tables);
   *  with slimeEnabled each layer also carries frameCount FLIPPED tables after
   *  the normal ones (line order reversed for the ceiling pose). */
  colorBytes: number[];
  /** True when any room places a SlimeCeiling (mode 11) enemy: widens the RAM
   *  pool/ROM table strides and doubles the per-frame sprite variants. */
  slimeEnabled: boolean;
  /** True when any room places a GearWheel emitter (mode 12). */
  gearEnabled: boolean;
  /** True when any room places a FlyBounce8 bat (mode 13): adds the direction
   *  table, the shared per-frame PRNG seed and 2 pool bytes per slot. */
  fly8Enabled?: boolean;
  /** True when any room uses the declarative mode 14 interpreter. */
  scriptedEnabled?: boolean;
  /**
   * True when at least one placed enemy occupies more than one hardware sprite
   * layer (extra cells, extra colour layers, or both). Those extra slots carry
   * MSX2_ENEMY_MOVEMENT_LAYER_FOLLOWER and copy the slot before them instead of
   * running the behaviour again. Off, the follower path is not emitted at all.
   */
  layeredEnemies?: boolean;
  /** Baked scripted programs, excluding the implicit index-0 fallback. */
  scriptedBehaviorPrograms?: Array<{
    id: string;
    name: string;
    bytes: number[];
    gravity?: boolean;
    kind?: 'rules' | 'path_follow';
  }>;
  /** True only when a baked authored program actually contains FIRE. */
  scriptedProgramsUseFire?: boolean;
  /** True only when a baked authored program actually tests PLAYER_BULLET_INCOMING. */
  scriptedProgramsUsePlayerBulletSense?: boolean;
  /**
   * True when any placed enemy opts into the dark-room "eyes only" look. Every
   * unique sprite then carries a SECOND set of line-colour blocks after the
   * normal (and slime-flipped) ones: the opted-in ones keep only the eye lines,
   * the rest are a byte copy of their normal blocks. Copying instead of
   * branching means the runtime offset is the same for every slot, so no
   * per-slot flag has to reach the RAM pool.
   */
  darkEyesEnabled?: boolean;
  /** Per-hardware-slot destination offset (in 32-byte pattern groups).
   * Slots with a SlimeCeiling sprite reserve four variants per frame;
   * ordinary enemies reserve two.  Keeping these offsets sparse avoids
   * wasting the final V9938 groups on non-slime slots. */
  patternGroupOffsets?: number[];
  /** Per-hardware-slot pattern variant count (2 or 4). */
  patternVariantCounts?: number[];
  /** Total number of groups reserved by the compact per-slot allocation. */
  patternGroupCount?: number;
}

export interface BitmapEnemyRuntimeOptions {
  ramBase: number;
  /** First enemy SAT entry (after foreground + player layers). */
  satBase: number;
  /** First enemy 16-byte colour block (mirrors satBase slot order). */
  colorBase: number;
  /** First V9938 sprite pattern group reserved for enemy slots. */
  patternGroupBase: number;
  /** Optional compact per-slot destination offsets, relative to patternGroupBase. */
  patternGroupOffsets?: number[];
  /** Optional per-slot variant counts (2 for normal, 4 for slime-capable slots). */
  patternVariantCounts?: number[];
  /** HUD band offset added to logical Y before the SAT write. */
  /** Shared floor probe; undefined keeps the historical bitmap_probe_solid. */
  floorProbeLabel?: string;
  gameYOffset: number;
  /** Player body hitbox in local player coordinates. */
  playerHitbox: { x: number; y: number; w: number; h: number };
  /** I-frame count to arm after a DamageOnTouch hit. */
  damageInvulnFrames: number;
  /** Player max health byte (matches the deadly system). Used to reset health on
   *  respawn when enemy contact drains the last heart. Required for lives support. */
  maxHealth?: number;
  /** Player starting lives byte (matches the deadly system). When provided,
   *  enemy contact that drops health to 0 decrements player_lives and, at 0
   *  lives, arms bitmap_game_over_flag so the Game Flow exits — consistent with
   *  the deadly-tile damage path. */
  lives?: number;
  /** Whether enemy damage should respawn the player (reset health + reposition to
   *  spawn) when health hits 0, mirroring the deadly system. Defaults to false
   *  (legacy behaviour: health saturates at 0, no respawn). */
  respawnOnDeath?: boolean;
  /** First SAT entry reserved for the optional scripted enemy bullet pool. */
  enemyBulletSatBase?: number;
  /** First 16-byte colour block reserved for the optional enemy bullets. */
  enemyBulletColorBase?: number;
  /** Pattern number (not group number) written by the enemy bullet SAT writer. */
  enemyBulletPatternNumber?: number;
  /** True when the player bullet writer follows the enemy bullet writer. */
  enemyBulletFollowedByPlayerBullets?: boolean;
  /** Early-return gate prepended to bitmap_update_enemies (e.g. the NPC
   * dialogue pause). Empty when no pausing system exists in this ROM. */
  pauseGateAsm?: string;
  /**
   * Player-bullet hit support (shoot skill). Absent when the ROM has no shoot
   * skill, which keeps the whole routine out of it.
   */
  bulletHit?: {
    /**
     * Boss hit check to run before the enemies. When set, a `bitmap_bullet_targets`
     * dispatcher is emitted: the boss sees the bullet first and the enemies only
     * get the ones it did not consume.
     */
    chainFromBossLabel?: string;
  };
  /**
   * Dark-room "eyes only" support. Absent when no enemy opted in, which keeps
   * the light test, its table and the second colour bank out of the ROM.
   */
  darkEyes?: {
    /**
     * Halo half width per 8-row slice of its 64-row vertical extent, one row of
     * 8 entries per decay stage (stage 0 = brightest first). A lamp that never
     * decays has a single row.
     */
    halfWidths: number[][];
    /** Read bitmap_light_stage to pick the row (torch skill builds only). */
    stagedHalo: boolean;
    /** The player halo only counts while the tail is lit (torch skill builds). */
    torchGated: boolean;
    /** Travelling bullet lantern box, when the shoot skill drags one. */
    lantern?: { halfWidth: number; halfHeight: number };
  };
  /**
   * The SHOOT skill's player bullet pool, read-only. Passed straight through
   * to buildEnemyBehaviorRuntimeAsm so PLAYER_BULLET_INCOMING can scan it by
   * label. Absent when the project has no SHOOT skill.
   */
  playerBullets?: { poolLabel?: string; slotCount: number; slotStride: number };
  /**
   * Konami MegaROM: move the enemy sprite pattern/colour art out of the 32KB
   * resident window into a data bank. The art is cold (uploaded to VRAM on room
   * load, plus one 16-byte colour table per slot per frame change) but it is the
   * single biggest resident block in a content-heavy project, so keeping it
   * resident is what makes projects hit `Negative initial size` in Glass.
   *
   * Every copy then goes through `bitmap_copy_banked_to_vram`, which owns the
   * bank swap and lives below #8000 — the enemy routines themselves sit inside
   * the #8000-#9FFF window and must NOT map a bank in their own body.
   */
  bankedSpriteData?: boolean;
}

export interface BitmapEnemySystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  /** `call bitmap_load_enemies` — after load_room at init and on room commit. */
  loadCallAsm: string;
  /** `call bitmap_update_enemies` — before bitmap_update_sprite_sat. */
  updateCallAsm: string;
  /** `call bitmap_update_enemy_sat` — right after bitmap_update_sprite_sat and
   * BEFORE the bullet SAT writer (each writer overwrites the previous
   * terminator and appends its own). */
  satCallAsm: string;
  /** Deferred per-frame colour-table refresh; must run after every SAT writer. */
  colorCallAsm: string;
  /** `call bitmap_update_enemy_bullet_sat` — before the player bullet writer. */
  bulletSatCallAsm: string;
  routinesAsm: string;
  dataAsm: string;
  /**
   * Sprite art pulled out of `dataAsm` when `bankedSpriteData` is set, for the
   * room generator to hand to the MegaROM data-bank packer. Empty otherwise, so
   * a simple32k build emits byte-identical ASM.
   */
  bankedBlocks: Array<{ label: string; bytes: number[]; description: string }>;
}

export function bitmapEnemySystemEnabled(data: BitmapEnemyRoomData | undefined): boolean {
  return Boolean(data && data.maxSlots > 0);
}

export function buildBitmapEnemySystemAsm(
  data: BitmapEnemyRoomData,
  opts: BitmapEnemyRuntimeOptions,
): BitmapEnemySystemAsm {
  if (!bitmapEnemySystemEnabled(data)) {
    return { enabled: false, ramBytes: 0, equates: '', loadCallAsm: '', updateCallAsm: '', satCallAsm: '', colorCallAsm: '', bulletSatCallAsm: '', routinesAsm: '', dataAsm: '', bankedBlocks: [] };
  }
  const maxSlots = data.maxSlots;
  const maxFrames = Math.max(1, data.maxFrames);
  const slime = Boolean(data.slimeEnabled);
  const gear = Boolean(data.gearEnabled);
  const fly8 = Boolean(data.fly8Enabled);
  const scripted = Boolean(data.scriptedEnabled);
  // Only projects that actually place a multi-layer enemy pay for the follower
  // path: without one, not a single byte of the update loop moves.
  const layered = Boolean(data.layeredEnemies);
  const programsUseFire = scripted && data.scriptedProgramsUseFire === true;
  const programsUsePlayerBulletSense = scripted && data.scriptedProgramsUsePlayerBulletSense === true;
  // Gravity is the default for an authored behaviour, so this is normally true;
  // a project whose enemies all fly gets neither the hook nor the table.
  const programsUseGravity = scripted && enemyProgramsUseGravity(data.scriptedBehaviorPrograms || []);
  const programsUsePath = scripted
    && data.scriptedBehaviorPrograms?.some(program => program.kind === 'path_follow') === true;
  const enemyBulletSlotCount = programsUseFire ? BITMAP_ENEMY_BULLET_SLOTS : 0;
  // MegaROM: the sprite art lives in a data bank, so every copy goes through the
  // below-#8000 helper that owns the swap (these routines sit in #8000-#9FFF).
  const bankedArt = opts.bankedSpriteData === true;
  const copyArt = (label: string): string => (bankedArt
    ? `    ld a, ${label}_DATA_BANK
    call bitmap_copy_banked_to_vram`
    : '    call copy_to_vram_ext');
  // "Eyes only in the dark" needs both halves: the baked second colour bank
  // (data) and a light source to test against (opts). Either one missing keeps
  // the feature — and every byte of it — out of the ROM.
  const darkEyes = data.darkEyesEnabled && opts.darkEyes ? opts.darkEyes : undefined;
  const POOL_STRIDE = bitmapEnemyPoolStride(data);
  const konami = Boolean(data.konamiPaths?.length);
  const konamiOffset = POOL_STRIDE - 8;
  // Each optional slot extension is current/start/end/restart, four words.
  // Load contract: destroys AF/BC/DE/HL, preserves IX/IY. Called inside load's IX save.
  const konamiLoadAsm = konami ? `
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_enemy_konami_rooms
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
${Array.from({ length: maxSlots }, (_, i) => `    ld de, bitmap_enemy_pool+${i * POOL_STRIDE + konamiOffset}
    ld bc, 8
    ldir`).join('\n')}` : '';
  // Step contract: IX=enemy; carry=set when table owns movement, clear otherwise.
  // Preserves BC/HL/IX/IY, destroys AF/DE; stack balanced on both exits.
  const konamiStepAsm = konami ? `
bitmap_enemy_konami_step:
    ld e, (ix+${konamiOffset})
    ld d, (ix+${konamiOffset + 1})
    ld a, d
    or e
    ret z
    push hl
    push bc
    ex de, hl
    ld e, (ix+${konamiOffset + 4})
    ld d, (ix+${konamiOffset + 5})
    or a
    sbc hl, de
    add hl, de
    jp nz, .read
    ld l, (ix+${konamiOffset + 6})
    ld h, (ix+${konamiOffset + 7})
.read:
    ld a, (hl)
    ld (ix+1), a
    inc hl
    ld a, (hl)
    ld (ix+0), a
    inc hl
    inc hl
    inc hl
    ld (ix+${konamiOffset}), l
    ld (ix+${konamiOffset + 1}), h
    pop bc
    pop hl
    scf
    ret` : '';
  const TABLE_STRIDE = 22 + (slime ? 1 : 0) + (gear ? 2 : 0) + (fly8 ? 1 : 0); // ROM bytes per slot
  const SCRIPTED_TABLE_STRIDE = TABLE_STRIDE + (scripted ? 1 : 0);
  const GEAR_STATE_OFFSET = 24 + (slime ? 3 : 0);
  const GEAR_COOLDOWN_LO_OFFSET = GEAR_STATE_OFFSET + 1;
  const GEAR_COOLDOWN_HI_OFFSET = GEAR_STATE_OFFSET + 2;
  const GEAR_DELAY_LO_OFFSET = GEAR_STATE_OFFSET + 3;
  const GEAR_DELAY_HI_OFFSET = GEAR_STATE_OFFSET + 4;
  // Bat flight state, after whatever the other optional engines claimed.
  const FLY8_LEFT_OFFSET = 24 + (slime ? 3 : 0) + (gear ? 5 : 0);   // px left before the next turn
  const FLY8_TURN_OFFSET = FLY8_LEFT_OFFSET + 1;                    // authored turn distance
  // ROM index of the turnPx byte, which sits behind the other engines' bytes.
  const FLY8_TABLE_INDEX = 22 + (slime ? 1 : 0) + (gear ? 2 : 0);
  // Scripted state follows every optional movement extension in the pool/table.
  const SCRIPTED_PROGRAM_OFFSET = 24 + (slime ? 3 : 0) + (gear ? 5 : 0) + (fly8 ? BITMAP_ENEMY_POOL_STRIDE_FLY8_BYTES : 0);
  const SCRIPTED_STATE_OFFSET = SCRIPTED_PROGRAM_OFFSET + 1;
  const SCRIPTED_TIMER_OFFSET = SCRIPTED_PROGRAM_OFFSET + 2;
  const SCRIPTED_VELOCITY_OFFSET = SCRIPTED_PROGRAM_OFFSET + 3;
  // The runtime's defaults place path state after the six-byte scripted block:
  // program, state, timer, velocity, shield and hit stamp.
  const SCRIPTED_PATH_NODE_OFFSET = SCRIPTED_PROGRAM_OFFSET + MSX2_ENEMY_SCRIPT_POOL_BYTES;
  const SCRIPTED_PATH_BRANCH_OFFSET = SCRIPTED_PATH_NODE_OFFSET + 1;
  const SCRIPTED_TABLE_INDEX = 22 + (slime ? 1 : 0) + (gear ? 2 : 0) + (fly8 ? 1 : 0);
  const variantsPerFrame = bitmapEnemyVariantsPerFrame(data);
  const groupsPerSlot = maxFrames * variantsPerFrame;
  const slotPatternVariants = Array.from({ length: maxSlots }, (_unused, i) =>
    Math.max(2, Number(opts.patternVariantCounts?.[i] || variantsPerFrame) || variantsPerFrame)
  );
  const slotPatternOffsets = Array.from({ length: maxSlots }, (_unused, i) =>
    Number.isFinite(Number(opts.patternGroupOffsets?.[i]))
      ? Math.max(0, Math.floor(Number(opts.patternGroupOffsets?.[i])))
      : i * groupsPerSlot
  );
  // Count + slot pool; FlyBounce8 adds one shared PRNG seed byte.
  // Banked room tables are staged through RAM: bitmap_load_enemies walks the
  // record field by field and lives inside the #8000-#9FFF window, so it cannot
  // read straight out of the mapped bank.
  const TABLE_BYTES = 1 + maxSlots * SCRIPTED_TABLE_STRIDE;
  const ramBytes = 1 + maxSlots * POOL_STRIDE + (fly8 ? 1 : 0);
  const baseRamBytes = ramBytes + (bankedArt ? TABLE_BYTES : 0);
  const countAddr = opts.ramBase;
  const poolAddr = opts.ramBase + 1;
  const randSeedAddr = poolAddr + maxSlots * POOL_STRIDE;
  const tableBufAddr = randSeedAddr + (fly8 ? 1 : 0);
  const scriptedScratchAddr = tableBufAddr + (bankedArt ? TABLE_BYTES : 0);
  if (programsUseFire && (
    opts.enemyBulletSatBase === undefined
    || opts.enemyBulletColorBase === undefined
    || opts.enemyBulletPatternNumber === undefined
  )) {
    throw new Error(
      'SCREEN 5 scripted FIRE needs enemy bullet SAT, colour and pattern reservations '
      + 'from buildBitmapEnemySystemAsm.',
    );
  }
  const enemyBulletRamBase = scriptedScratchAddr + enemyScriptScratchBytes(programsUseGravity);
  const scriptedRuntime = scripted
    ? buildEnemyBehaviorRuntimeAsm({
      ramBase: scriptedScratchAddr,
      poolProgramOffset: SCRIPTED_PROGRAM_OFFSET,
      poolStateOffset: SCRIPTED_STATE_OFFSET,
      poolTimerOffset: SCRIPTED_TIMER_OFFSET,
      poolVelocityOffset: SCRIPTED_VELOCITY_OFFSET,
      poolVisualXOffset: 14,
      poolVisualYOffset: 15,
      poolSpeedOffset: 21,
      poolAnimFrameOffset: 9,
      poolFrameCountOffset: 10,
      floorProbeLabel: opts.floorProbeLabel,
      poolStride: POOL_STRIDE,
      maxSlots,
      programsUseFire,
      programsUseGravity,
      programsUsePath,
      poolPathNodeOffset: SCRIPTED_PATH_NODE_OFFSET,
      poolPathBranchOffset: SCRIPTED_PATH_BRANCH_OFFSET,
      enemyBullets: programsUseFire ? {
        ramBase: enemyBulletRamBase,
        slotCount: enemyBulletSlotCount,
        speedPx: BITMAP_ENEMY_BULLET_SPEED,
        playerHurtLabel: 'bitmap_enemy_hurt_player',
        damageHearts: 1,
      } : undefined,
      programsUsePlayerBulletSense,
      playerBulletPool: opts.playerBullets,
    })
    : undefined;
  const totalRamBytes = baseRamBytes
    + (scriptedRuntime?.ramBytes || 0)
    + (scriptedRuntime?.bulletRamBytes || 0);

  const equates = `; --- ENEMY runtime state (${totalRamBytes} bytes): count + ${maxSlots} slot(s) x ${POOL_STRIDE}${fly8 ? ' + PRNG seed' : ''}
; (x,y,dx,dy,minX,maxX,minY,maxY,animTick,animFrame,frameCount,animDelay,colorOff,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,logicInterval,logicCountdown${slime ? ',travelPx,travelCount,phase' : ''}${gear ? ',gearState,gearCooldownLo,gearCooldownHi,gearDelayLo,gearDelayHi' : ''}${fly8 ? ',flyLeft,flyTurnPx' : ''}${scripted ? ',scriptProgram,scriptState,scriptTimer,scriptVelocity,scriptShield,scriptHit' : ''}${programsUsePath ? ',pathNode,pathBranchMask' : ''}) ---
bitmap_enemy_count EQU ${asmWord(countAddr)}
bitmap_enemy_pool  EQU ${asmWord(poolAddr)}
${fly8 ? `bitmap_enemy_rand_seed EQU ${asmWord(randSeedAddr)}
` : ''}${bankedArt ? `; Room record staged out of its data bank (${TABLE_BYTES} bytes) before it is walked.
bitmap_enemy_table_buf EQU ${asmWord(tableBufAddr)}
` : ''}${scriptedRuntime?.equates || ''}`;

  // ---- bitmap_load_enemies: per-room table -> RAM pool + VRAM uploads ----
  const loadSlotBlocks = Array.from({ length: maxSlots }, (_unused, i) => {
    const patternGroup = opts.patternGroupBase + slotPatternOffsets[i];
    const slotVariants = slotPatternVariants[i];
    const patternVram = 0xF800 + patternGroup * 32;
    const colorVram = opts.colorBase + i * 16;
    const poolBase = `bitmap_enemy_pool + ${i * POOL_STRIDE}`;
    return `.benemy_slot_${i}:
    ld a, (bitmap_enemy_count)
    cp ${i + 1}
    jp c, .benemy_slot_${i}_done      ; slot unused in this room
    push ix
    pop hl
    ld de, ${poolBase}
    ld bc, 8
    ldir                      ; movement bytes (x..maxY)
    ld a, (ix+11)             ; animDelay
    ld (${poolBase} + 8), a   ; animTick = delay
    ld (${poolBase} + 11), a  ; animDelay
    xor a
    ld (${poolBase} + 9), a   ; animFrame = 0
    ld a, (ix+10)             ; frameCount
    ld (${poolBase} + 10), a
    ld a, (ix+9)              ; colorOff base, in 16-byte blocks
    ld (${poolBase} + 12), a
    ld a, (ix+12)             ; movement mode
    ld (${poolBase} + 13), a
    ld a, (ix+13)             ; visual X offset from logical enemy origin
    ld (${poolBase} + 14), a
    ld a, (ix+14)             ; visual Y offset from logical enemy origin
    ld (${poolBase} + 15), a
    ld a, (ix+15)             ; DamageOnTouch damage (0 = harmless)
    ld (${poolBase} + 16), a
    ld a, (ix+16)             ; damage hitbox X offset from logical origin
    ld (${poolBase} + 17), a
    ld a, (ix+17)             ; damage hitbox Y offset from logical origin
    ld (${poolBase} + 18), a
    ld a, (ix+18)             ; damage hitbox width
    ld (${poolBase} + 19), a
    ld a, (ix+19)             ; damage hitbox height
    ld (${poolBase} + 20), a
    ld a, (ix+20)             ; authored movement speed in px/update
    ld (${poolBase} + 21), a
    ld a, (ix+21)             ; logic update interval in video frames (1..255)
    or a
    jp nz, .benemy_slot_${i}_interval_valid
    inc a                     ; legacy/corrupt zero falls back to every frame
.benemy_slot_${i}_interval_valid:
    ld (${poolBase} + 22), a
    ld a, 1
    ld (${poolBase} + 23), a  ; first gameplay frame executes logic
${slime ? `    ld a, (ix+22)             ; slime hop distance in px (0 on non-slime slots)
    ld (${poolBase} + 24), a
    xor a
    ld (${poolBase} + 25), a  ; travelCount = 0
    ld (${poolBase} + 26), a  ; phase = ground crawl
` : ''}${gear ? `    ; GearWheel state: 1=falling, 2=rolling, 3=stopped, 0=waiting.
    ld a, (ix+${22 + (slime ? 1 : 0)})       ; respawn delay frames (lo)
    ld (${poolBase} + ${GEAR_DELAY_LO_OFFSET}), a
    ld a, (ix+${23 + (slime ? 1 : 0)})       ; respawn delay frames (hi)
    ld (${poolBase} + ${GEAR_DELAY_HI_OFFSET}), a
    xor a
    ld (${poolBase} + ${GEAR_COOLDOWN_LO_OFFSET}), a
    ld (${poolBase} + ${GEAR_COOLDOWN_HI_OFFSET}), a
    ld a, 1
    ld (${poolBase} + ${GEAR_STATE_OFFSET}), a
` : ''}${fly8 ? `    ; Bat flight: fly the authored distance before the first random turn.
    ld a, (ix+${FLY8_TABLE_INDEX})          ; turnPx (0 on non-bat slots)
    ld (${poolBase} + ${FLY8_TURN_OFFSET}), a
    ld (${poolBase} + ${FLY8_LEFT_OFFSET}), a
` : ''}${scripted ? `    ; Scripted mode: table byte selects the resident program; state/timer/vy start clear.
    ld a, (ix+${SCRIPTED_TABLE_INDEX})
    ld (${poolBase} + ${SCRIPTED_PROGRAM_OFFSET}), a
    xor a
    ld (${poolBase} + ${SCRIPTED_STATE_OFFSET}), a
    ld (${poolBase} + ${SCRIPTED_TIMER_OFFSET}), a
    ld (${poolBase} + ${SCRIPTED_VELOCITY_OFFSET}), a
${programsUsePath ? `    xor a
    ld (${poolBase} + ${SCRIPTED_PATH_NODE_OFFSET}), a
    ld (${poolBase} + ${SCRIPTED_PATH_BRANCH_OFFSET}), a
` : ''}
` : ''}${slime && slotVariants < 4 ? `    ; --- upload frameCount x [right,left] pairs -> VRAM ${asmWord(patternVram)} (group ${patternGroup}+) ---
    ; Slime builds store 4 variants per frame in ROM ([R,L,ceilR,ceilL]) for
    ; EVERY sprite, but this slot only reserves the facing pair: copy 64 of
    ; every 128 source bytes so frame N lands on group ${patternGroup}+N*2.
    ld a, (ix+8)
    call bitmap_enemy_patterns_offset
    ld de, ${asmWord(patternVram)}
    ld a, (ix+10)             ; frameCount (>= 1 on used slots)
.benemy_slot_${i}_patstride:
    push af
    push hl
    push de
    ld bc, 64                 ; one [right, left] pair
${copyArt('bitmap_enemy_sprite_patterns')}
    pop de
    pop hl
    ld bc, 128                ; ROM stride: 4 variants x 32 bytes
    add hl, bc
    ex de, hl
    ld bc, 64                 ; VRAM stride: 2 variants x 32 bytes
    add hl, bc
    ex de, hl
    pop af
    dec a
    jp nz, .benemy_slot_${i}_patstride` : `    ; --- upload frameCount*${slotVariants} pattern groups -> VRAM ${asmWord(patternVram)} (group ${patternGroup}+) ---
    ld a, (ix+8)
    call bitmap_enemy_patterns_offset
    ld a, (ix+10)             ; frameCount
    add a, a                  ; *2 variants${slotVariants >= 4 ? `
    add a, a                  ; *4 variants (ceiling flips)` : ''}
    push hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32 bytes/group
    ld b, h
    ld c, l
    pop hl
    ld de, ${asmWord(patternVram)}
${copyArt('bitmap_enemy_sprite_patterns')}`}
    ; --- upload 16-byte colour table -> VRAM ${asmWord(colorVram)} (slot ${i}) ---
    ld a, (ix+9)
    call bitmap_enemy_colors_offset
    ld de, ${asmWord(colorVram)}
    ld bc, 16
${copyArt('bitmap_enemy_sprite_colors')}
.benemy_slot_${i}_done:
    ld de, ${SCRIPTED_TABLE_STRIDE}
    add ix, de`;
  }).join('\n');

  const enemyBulletColorUploads = Array.from({ length: enemyBulletSlotCount }, (_unused, i) => `    ld hl, bitmap_enemy_bullet_color_data
    ld de, ${asmWord((opts.enemyBulletColorBase as number) + i * 16)}
    ld bc, bitmap_enemy_bullet_color_data_end - bitmap_enemy_bullet_color_data
    call copy_to_vram_ext
`).join('');
  const enemyBulletLoadAsm = programsUseFire ? `
    ; --- upload the shared FIRE projectile pattern and its SAT colour blocks ---
    ld hl, bitmap_enemy_bullet_pattern_data
    ld de, ${asmWord((opts.enemyBulletPatternNumber as number) * 8 + 0xF800)}
    ld bc, bitmap_enemy_bullet_pattern_data_end - bitmap_enemy_bullet_pattern_data
    call copy_to_vram_ext
${enemyBulletColorUploads}` : '';

  const playerHitbox = opts.playerHitbox;
  const playerLeft = Math.max(0, Math.min(31, Math.floor(playerHitbox.x) || 0));
  const playerTop = Math.max(0, Math.min(31, Math.floor(playerHitbox.y) || 0));
  const playerRight = Math.max(playerLeft + 1, Math.min(64, playerLeft + (Math.floor(playerHitbox.w) || 16)));
  const playerBottom = Math.max(playerTop + 1, Math.min(64, playerTop + (Math.floor(playerHitbox.h) || 16)));
  const enemyInvulnFrames = asmByte(opts.damageInvulnFrames || 60);
  // Lives/respawn support (optional). When respawnOnDeath is true, enemy contact
  // that drains the last heart mirrors the deadly system: -1 life, respawn to
  // spawn, and at 0 lives arm bitmap_game_over_flag so the Game Flow exits.
  const respawnOnDeath = opts.respawnOnDeath === true;
  const maxHealthByte = asmByte(opts.maxHealth ?? 5);
  void opts.lives; // lives are seeded by the deadly system init; the touch handler only decrements.

  // ---- follower layers: one body, one decision ----
  // A placed enemy occupies cells x colour layers hardware sprites, and every one
  // of them is a pool slot. Running the behaviour once per slot costs as many
  // probes, PRNG draws and script steps as there are layers, and — worse — gives
  // each layer its own state, so nothing MAKES them agree: a random turn taken by
  // the body and not by its eyes tears the sprite in two on screen.
  //
  // So only the first layer thinks. The rest copy the slot immediately before
  // them, which the sweep has already brought up to date, and rebuild their own
  // position from the body's logical origin:
  //     x = (leader.x - leader.xOff) + own xOff
  // That is the same origin key the kill/damage code already uses, so multi-CELL
  // sprites keep their real geometry instead of being stacked on one point.
  // Copying the whole optional-engine tail (slime phase, gear state, script
  // state and path cursor) keeps the SAT and colour writers working unchanged:
  // they read those bytes per slot and now find the leader's values there.
  const followerCopyOffsets: number[] = [];
  for (let offset = 24; offset < POOL_STRIDE; offset++) {
    // The program index never changes, and the hit stamp is per-layer evidence
    // that this layer took a bullet — copying it back down would replay the hit.
    if (scripted && (offset === SCRIPTED_PROGRAM_OFFSET || offset === SCRIPTED_PROGRAM_OFFSET + 5)) continue;
    followerCopyOffsets.push(offset);
  }
  const followerStepAsm = `
.enemy_step_follow:
    push iy
    push ix
    pop iy
    ld de, ${asmWord(0x10000 - POOL_STRIDE)}
    add iy, de                ; IY = previous slot = this layer's leader
    ld a, (iy+13)
    cp #FF
    jp z, .enemy_step_follow_died
${scripted ? `    ld a, (ix+bitmap_enemy_script_hit_ofs)
    or a
    jp z, .enemy_step_follow_body
    ld (iy+bitmap_enemy_script_hit_ofs), a  ; a bullet in any layer hits the body
    xor a
    ld (ix+bitmap_enemy_script_hit_ofs), a  ; ... and is reported exactly once
.enemy_step_follow_body:
` : ''}    ld a, (iy+0)
    sub (iy+14)               ; logical body origin X
    add a, (ix+14)            ; + this layer's own cell offset
    ld (ix+0), a
    ld a, (iy+1)
    sub (iy+15)
    add a, (ix+15)
    ld (ix+1), a
    ld a, (iy+2)
    ld (ix+2), a              ; facing: the SAT writer mirrors on dx bit 7
    ld a, (iy+3)
    ld (ix+3), a
    ld a, (iy+8)
    ld (ix+8), a              ; animTick
    ld a, (iy+9)
    ld (ix+9), a              ; animFrame
${followerCopyOffsets.map(offset => `    ld a, (iy+${offset})
    ld (ix+${offset}), a`).join('\n')}${followerCopyOffsets.length ? '\n' : ''}    pop iy
    jp .enemy_step_next
.enemy_step_follow_died:
    ; A body dies whole, however few of its layers the killer actually touched.
    ld (ix+13), #FF
    pop iy
    jp .enemy_step_next
`;

  // ---- bitmap_update_enemies: per-enemy configurable logic cadence ----
  // Check-then-move like the SCREEN 4 slot handler: at the bound the enemy
  // turns without moving, so positions can never overshoot minX/maxX.
  const updateAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_update_enemies
; ------------------------------------------------------------
; PURPOSE: Ticks animation for every active slot, but runs heavy behavior and
;   movement only when that slot's logic countdown expires. Interval 1 updates
;   every frame; N updates every N frames. Every hardware layer belonging to
;   one logical enemy is seeded with the same interval/countdown and stays in phase.
;   Paused entirely (movement + animation) while a pause gate holds, e.g.
;   an open NPC dialogue; the SAT writer keeps drawing the frozen sprites.
; INPUT: bitmap_enemy_count, bitmap_enemy_pool.
; OUTPUT: pool x/y/dx/dy/anim state updated in RAM.
; DESTROYS: AF, DE, IX. PRESERVES: BC, HL, IY.
; ------------------------------------------------------------
bitmap_update_enemies:
${opts.pauseGateAsm || ''}    ld a, (bitmap_enemy_count)
    or a
    ret z
    push bc
${fly8 ? `    ; One PRNG step per FRAME, not per draw: every hardware layer of the same
    ; bat has to read the same value or the eyes fly off the body.
    ld a, (bitmap_enemy_rand_seed)
    rrca
    xor #B8
    add a, #3D
    ld (bitmap_enemy_rand_seed), a
` : ''}    ld a, (bitmap_enemy_count)
    ld b, a
    ld ix, bitmap_enemy_pool
.enemy_step_loop:
    ld a, (ix+13)             ; #FF = killed by a thrown object
    cp #FF
    jp z, .enemy_step_next
${layered ? `    cp ${MSX2_ENEMY_MOVEMENT_LAYER_FOLLOWER}
    jp z, .enemy_step_follow  ; extra layer of a body: copies, never thinks
` : ''}${konami ? `    call bitmap_enemy_konami_step
    jp c, .enemy_anim
` : ''}.enemy_step_cadence_gate:
${gear ? `    ; Gear cooldowns are real video-frame seconds, independent of the
    ; configured logic cadence. Once active, movement obeys the cadence gate.
    ld a, (ix+13)
    cp ${MSX2_ENEMY_MOVEMENT_GEAR_WHEEL}
    jp nz, .enemy_step_cadence_compare
    call .gear_pre_frame
    ld a, (ix+${GEAR_STATE_OFFSET})
    or a
    jp z, .enemy_anim
.enemy_step_cadence_compare:
` : ''}    ld a, (ix+23)             ; video-frame countdown to next logic update
    or a
    jp z, .enemy_step_logic_due       ; defensive recovery from corrupt zero
    dec a
    ld (ix+23), a
    jp nz, .enemy_anim                ; cadence skipped: animation still ticks
.enemy_step_logic_due:
    ld a, (ix+22)                     ; authored interval (1..255)
    or a
    jp nz, .enemy_step_interval_valid
    inc a                             ; legacy/corrupt zero => every frame
.enemy_step_interval_valid:
    ld (ix+23), a
    ld a, (ix+13)             ; movement mode
    cp ${MSX2_ENEMY_MOVEMENT_PATROL_CHASE_X}
    jp z, .enemy_step_patrol_chase_x
    cp ${MSX2_ENEMY_MOVEMENT_WALKER_GRAVITY}
    jp z, .enemy_step_walker_gravity
${slime ? `    cp ${MSX2_ENEMY_MOVEMENT_SLIME_CEILING}
    jp z, .enemy_step_slime
` : ''}${gear ? `    cp ${MSX2_ENEMY_MOVEMENT_GEAR_WHEEL}
    jp z, .enemy_step_gear
` : ''}${fly8 ? `    cp ${MSX2_ENEMY_MOVEMENT_FLY_BOUNCE_8}
    jp z, .enemy_step_fly8
` : ''}${scripted ? `    cp ${MSX2_ENEMY_MOVEMENT_SCRIPTED}
    jp z, .enemy_step_scripted
` : ''}    ; --- X axis ---
.enemy_step_patrol:
    ld a, (ix+2)              ; dx
    or a
    jp z, .enemy_step_y
    ld d, (ix+21)             ; authored pixels per logic update
.enemy_step_x_px:
    ld a, (ix+2)
    bit 7, a
    jp nz, .enemy_step_left
    ld a, (ix+0)
    cp (ix+5)                 ; x vs maxX
    jp nc, .enemy_turn_left
    inc (ix+0)
    dec d
    jp nz, .enemy_step_x_px
    jp .enemy_step_y
.enemy_turn_left:
    ld (ix+2), #FF
    jp .enemy_step_y
.enemy_step_left:
    ld a, (ix+0)
    cp (ix+4)                 ; x vs minX
    jp z, .enemy_turn_right
    jp c, .enemy_turn_right
    dec (ix+0)
    dec d
    jp nz, .enemy_step_x_px
    jp .enemy_step_y
.enemy_turn_right:
    ld (ix+2), #01
.enemy_step_y:
    ; --- Y axis ---
    ld a, (ix+3)              ; dy
    or a
    jp z, .enemy_anim
    ld d, (ix+21)
.enemy_step_y_px:
    ld a, (ix+3)
    bit 7, a
    jp nz, .enemy_step_up
    ld a, (ix+1)
    cp (ix+7)                 ; y vs maxY
    jp nc, .enemy_turn_up
    inc (ix+1)
    dec d
    jp nz, .enemy_step_y_px
    jp .enemy_anim
.enemy_turn_up:
    ld (ix+3), #FF
    jp .enemy_anim
.enemy_step_up:
    ld a, (ix+1)
    cp (ix+6)                 ; y vs minY
    jp z, .enemy_turn_down
    jp c, .enemy_turn_down
    dec (ix+1)
    dec d
    jp nz, .enemy_step_y_px
    jp .enemy_anim
.enemy_turn_down:
    ld (ix+3), #01
    jp .enemy_anim
.enemy_step_patrol_chase_x:
    ; Detects player only inside this slot's patrol span. Outside that active
    ; zone it behaves like normal patrol; inside it uses authored speed.
    ld a, (player_x)
    cp (ix+4)                 ; player_x < minX -> patrol
    jp c, .enemy_step_patrol
    ld c, a                   ; C = player_x
    ld a, (ix+5)              ; maxX
    cp c
    jp c, .enemy_step_patrol  ; maxX < player_x -> patrol
    ld a, c
    cp (ix+0)                 ; player_x vs enemy_x
    jp z, .enemy_anim
    jp c, .enemy_chase_left
.enemy_chase_right:
    ld (ix+2), #01
    ld d, (ix+21)
.enemy_chase_right_px:
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .enemy_anim
    cp c
    jp nc, .enemy_anim
    inc (ix+0)
    dec d
    jp nz, .enemy_chase_right_px
    jp .enemy_anim
.enemy_chase_left:
    ld (ix+2), #FF
    ld d, (ix+21)
.enemy_chase_left_px:
    ld a, (ix+0)
    cp (ix+4)
    jp z, .enemy_anim
    jp c, .enemy_anim
    cp c
    jp c, .enemy_anim
    dec (ix+0)
    dec d
    jp nz, .enemy_chase_left_px
    jp .enemy_anim
.enemy_step_walker_gravity:
    ; Logical origin = SAT x/y minus the visual cell offset. This keeps multi-cell
    ; hardware sprites moving as one physics body.
    ; Gravity probes every traversed pixel at the authored speed.
    ld d, (ix+21)
.walker_fall_px:
    ld a, (ix+1)
    ld e, (ix+15)
    sub e                      ; A = logical top Y
    cp 176
    jp nc, .walker_on_ground
    push bc                    ; preserve enemy loop counter in B
    push de                    ; preserve remaining speed pixels in D
    add a, 16                  ; probe one pixel row under 16px body
    ld c, a
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    add a, 8                   ; probe bottom centre
    ld b, a
    call bitmap_probe_solid
    or a
    pop de
    pop bc
    jp nz, .walker_on_ground
    inc (ix+1)
    dec d
    jp nz, .walker_fall_px
    jp .enemy_anim
.walker_on_ground:
    ld d, (ix+21)
    ld a, (ix+2)
    or a
    jp z, .walker_set_right
    bit 7, a
    jp nz, .walker_left
.walker_right:
    ; Wall probe at logical x+16, y+8. Solid or max bound -> reverse.
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .walker_turn_left
    push bc                    ; preserve enemy loop counter in B
    push de
    ld e, (ix+14)
    sub e
    add a, 16
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    pop de
    pop bc
    jp nz, .walker_turn_left
    inc (ix+0)
    dec d
    jp nz, .walker_right
    jp .enemy_anim
.walker_turn_left:
    ld (ix+2), #FF
    jp .enemy_anim
.walker_set_right:
    ld (ix+2), #01
    jp .walker_right
.walker_left:
    ; Wall probe at logical x-1, y+8. Solid or min bound -> reverse.
    ld a, (ix+0)
    cp (ix+4)
    jp z, .walker_turn_right
    jp c, .walker_turn_right
    push bc                    ; preserve enemy loop counter in B
    push de
    ld e, (ix+14)
    sub e
    dec a
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    pop de
    pop bc
    jp nz, .walker_turn_right
    dec (ix+0)
    dec d
    jp nz, .walker_left
    jp .enemy_anim
.walker_turn_right:
    ld (ix+2), #01
${gear ? `    jp .enemy_anim
.enemy_step_gear:
    ; GearWheel uses one logical 16x16 body per emitter. State 1 falls,
    ; state 2 rolls, state 3 is a bottom stop, and state 0 waits to respawn.
    ld a, (ix+${GEAR_STATE_OFFSET})
    cp 1
    jp z, .gear_fall
    cp 2
    jp z, .gear_roll
    jp .enemy_anim
.gear_fall:
    ld d, (ix+21)             ; authored speed: px per logic update
.gear_fall_px:
    ; An exit below either edge consumes the wheel before solid landing.
    ld a, (ix+1)
    add a, 16
    ld c, a
    push de
    call .gear_probe_exit_body
    or a
    pop de
    jp nz, .gear_despawn
    ld a, (ix+1)
    cp 176
    jp nc, .gear_stop
    add a, 16
    ld c, a
    push de
    call .gear_probe_body
    or a
    pop de
    jp nz, .gear_land
    inc (ix+1)
    dec d
    jp nz, .gear_fall_px
    jp .enemy_anim
.gear_land:
    ld a, 2
    ld (ix+${GEAR_STATE_OFFSET}), a
    jp .enemy_anim
.gear_stop:
    ld (ix+1), 176
    ld a, 3
    ld (ix+${GEAR_STATE_OFFSET}), a
    jp .enemy_anim
.gear_roll:
    ; A missing floor makes the wheel fall again. Exits are checked first.
    ld a, (ix+1)
    add a, 16
    ld c, a
    push de
    call .gear_probe_exit_body
    or a
    pop de
    jp nz, .gear_despawn
    ld a, (ix+1)
    cp 176
    jp nc, .gear_stop
    add a, 16
    ld c, a
    call .gear_probe_body
    or a
    jp z, .gear_start_fall
    ld d, (ix+21)
.gear_roll_px:
    call .gear_roll_one
    jp c, .enemy_anim          ; wall: direction already inverted
    ld a, (ix+1)
    add a, 16
    ld c, a
    push de
    call .gear_probe_exit_body
    or a
    pop de
    jp nz, .gear_despawn
    dec d
    jp nz, .gear_roll_px
    jp .enemy_anim
.gear_start_fall:
    ld a, 1
    ld (ix+${GEAR_STATE_OFFSET}), a
    jp .gear_fall
.gear_roll_one:
    ; One-pixel horizontal step. Carry means blocked and dx was inverted.
    ld a, (ix+2)
    or a
    jp z, .gear_set_right
    bit 7, a
    jp nz, .gear_roll_left
.gear_roll_right:
    ld a, (ix+0)
    cp (ix+5)
    jp nc, .gear_turn_left
    push bc
    ld b, a
    add a, 16
    ld b, a
    ld a, (ix+1)
    add a, 8
    ld c, a
    push de
    call bitmap_probe_solid
    pop de
    or a
    pop bc
    jp nz, .gear_turn_left
    inc (ix+0)
    or a
    ret
.gear_turn_left:
    ld (ix+2), #FF
    scf
    ret
.gear_set_right:
    ld (ix+2), #01
    jp .gear_roll_right
.gear_roll_left:
    ld a, (ix+0)
    cp (ix+4)
    jp z, .gear_turn_right
    jp c, .gear_turn_right
    push bc
    dec a
    ld b, a
    ld a, (ix+1)
    add a, 8
    ld c, a
    push de
    call bitmap_probe_solid
    pop de
    or a
    pop bc
    jp nz, .gear_turn_right
    dec (ix+0)
    or a
    ret
.gear_turn_right:
    ld (ix+2), #01
    scf
    ret
.gear_despawn:
    xor a
    ld (ix+${GEAR_STATE_OFFSET}), a
    ld (ix+${GEAR_COOLDOWN_LO_OFFSET}), a
    ld a, (ix+${GEAR_DELAY_LO_OFFSET})
    ld (ix+${GEAR_COOLDOWN_LO_OFFSET}), a
    ld a, (ix+${GEAR_DELAY_HI_OFFSET})
    ld (ix+${GEAR_COOLDOWN_HI_OFFSET}), a
    ld a, (ix+6)              ; emitter X (stored in minY)
    ld (ix+0), a
    ld (ix+1), ${asmByte(ENEMY_EMPTY_SPRITE_Y)}
    jp .enemy_anim
.gear_pre_frame:
    ; Decrements respawn cooldown every video frame, not every logic update.
    ; INPUT IX. DESTROYS AF/DE/HL. PRESERVES BC/IX/IY.
    push bc
    push de
    push hl
    ld a, (ix+${GEAR_STATE_OFFSET})
    or a
    jp nz, .gear_pre_done
    ld l, (ix+${GEAR_COOLDOWN_LO_OFFSET})
    ld h, (ix+${GEAR_COOLDOWN_HI_OFFSET})
    ld a, h
    or l
    jp z, .gear_respawn
    dec hl
    ld (ix+${GEAR_COOLDOWN_LO_OFFSET}), l
    ld (ix+${GEAR_COOLDOWN_HI_OFFSET}), h
    ld a, h
    or l
    jp nz, .gear_pre_done
.gear_respawn:
    ld a, (ix+6)              ; emitter X
    ld (ix+0), a
    ld a, (ix+7)              ; emitter Y
    ld (ix+1), a
    ld a, (ix+3)              ; initial direction is kept in dy
    ld (ix+2), a
    ld a, 1
    ld (ix+${GEAR_STATE_OFFSET}), a
    xor a
    ld (ix+${GEAR_COOLDOWN_LO_OFFSET}), a
    ld (ix+${GEAR_COOLDOWN_HI_OFFSET}), a
.gear_pre_done:
    pop hl
    pop de
    pop bc
    ret
.gear_probe_body:
    ; INPUT C=probe Y, IX=slot. OUTPUT A=solid byte/NZ, preserves BC/IX/IY.
    push bc
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    ld b, a
    call bitmap_probe_solid
    or a
    jp nz, .gear_probe_body_done
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    add a, 15
    ld b, a
    call bitmap_probe_solid
    or a
.gear_probe_body_done:
    pop bc
    ret
.gear_probe_exit_body:
    ; INPUT C=probe Y. Returns A=1/NZ when either edge is an EXIT cell.
    push bc
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    ld b, a
    call .gear_probe_exit_cell
    or a
    jp nz, .gear_probe_exit_done
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    add a, 15
    ld b, a
    call .gear_probe_exit_cell
    or a
.gear_probe_exit_done:
    pop bc
    ret
.gear_probe_exit_cell:
    ; INPUT B=pixel X, C=pixel Y. EXIT = behavior code 4 (exit_enemy).
    ; The legacy effect=2 encoding is accepted as a compatibility fallback.
    ; Reads the active 16x12 behavior/collision maps; preserves BC/IY.
    call bitmap_probe_behavior
    cp 4
    jp z, .gear_exit_yes
    ld a, c
    cp 192
    jp nc, .gear_exit_no
    and #F0
    ld l, a
    ld a, b
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de
    ld a, (hl)
    and #06
    cp #04
    jp z, .gear_exit_yes
.gear_exit_no:
    xor a
    ret
.gear_exit_yes:
    ld a, 1
    or a
    ret
` : ''}${fly8 ? `    jp .enemy_anim
.enemy_step_fly8:
    ; Bat flight. Drifts along one of 8 headings, never probes a tile, and
    ; turns only on the room edges — the resolver already widened this slot's
    ; bounds to the whole screen, so (ix+4..7) ARE the edges. Every turnPx
    ; pixels flown the heading is re-rolled, which is what makes it wander
    ; instead of tracing one diagonal forever.
    ld d, (ix+21)              ; authored pixels per logic update
.fly8_px:
    ld a, (ix+2)               ; dx
    or a
    jp z, .fly8_y
    bit 7, a
    jp nz, .fly8_x_left
    ld a, (ix+0)
    cp (ix+5)                  ; x vs maxX
    jp nc, .fly8_turn_left
    inc (ix+0)
    jp .fly8_y
.fly8_turn_left:
    ld (ix+2), #FF             ; bounce: mirror the horizontal component
    jp .fly8_y
.fly8_x_left:
    ld a, (ix+0)
    cp (ix+4)                  ; x vs minX
    jp z, .fly8_turn_right
    jp c, .fly8_turn_right
    dec (ix+0)
    jp .fly8_y
.fly8_turn_right:
    ld (ix+2), #01
.fly8_y:
    ld a, (ix+3)               ; dy
    or a
    jp z, .fly8_step_done
    bit 7, a
    jp nz, .fly8_y_up
    ld a, (ix+1)
    cp (ix+7)                  ; y vs maxY
    jp nc, .fly8_turn_up
    inc (ix+1)
    jp .fly8_step_done
.fly8_turn_up:
    ld (ix+3), #FF
    jp .fly8_step_done
.fly8_y_up:
    ld a, (ix+1)
    cp (ix+6)                  ; y vs minY
    jp z, .fly8_turn_down
    jp c, .fly8_turn_down
    dec (ix+1)
    jp .fly8_step_done
.fly8_turn_down:
    ld (ix+3), #01
.fly8_step_done:
    dec (ix+${FLY8_LEFT_OFFSET})         ; one pixel of this heading spent
    jp nz, .fly8_next_px
    call .fly8_reroll
.fly8_next_px:
    dec d
    jp nz, .fly8_px
    jp .enemy_anim
.fly8_reroll:
    ; Pick the next heading and rearm the distance counter.
    ; A bat drawn with several hardware sprites is several pool slots, and they
    ; must all turn the SAME way or the body and the eyes fly apart. So the draw
    ; is not "the next PRNG byte" (each slot would consume a different one) but a
    ; hash of the LOGICAL origin — visual x/y minus this layer's cell offset,
    ; identical across the layers of one bat — mixed with a seed that advances
    ; once per frame. Two bats standing at different places still differ.
    ; INPUT: IX = slot. DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
    push bc
    push de
    push hl
    ld a, (ix+0)
    ld e, (ix+14)
    sub e                      ; logical X
    ld c, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e                      ; logical Y
    rrca
    rrca
    rrca
    xor c
    ld c, a
    ld a, (bitmap_enemy_rand_seed)
    xor c
    and 7
    add a, a                   ; 2 bytes per heading
    ld e, a
    ld d, 0
    ld hl, bitmap_enemy_dir8_table
    add hl, de
    ld a, (hl)
    ld (ix+2), a               ; dx sign
    inc hl
    ld a, (hl)
    ld (ix+3), a               ; dy sign
    ld a, (ix+${FLY8_TURN_OFFSET})         ; rearm with the authored distance
    ld (ix+${FLY8_LEFT_OFFSET}), a
    pop hl
    pop de
    pop bc
    ret
` : ''}${slime ? `    jp .enemy_anim
.enemy_step_slime:
    ; SlimeCeiling: crawls its authored travel distance along the floor, then
    ; sticks (Metroid-style gravity flip look), crawls the same distance upside
    ; down, then drops back to the floor and repeats. Pool extras:
    ;   +21 speed, +22 logicInterval, +23 logicCountdown,
    ;   +24 travelPx, +25 travelCount, +26 phase
    ;   phase: 0 = floor crawl, 1 = rising, 2 = ceiling crawl, 3 = falling
    ;   All phases use the authored speed and probe every traversed pixel.
    ; Logical origin = SAT x/y minus the visual cell offset, like the walker.
    ld a, (ix+26)
    or a
    jp z, .slime_ground
    cp 1
    jp z, .slime_rise
    cp 2
    jp z, .slime_ceiling
    jp .slime_fall
.slime_ground:
    ; Floor gone under the body (bottom-centre probe)? Then fall first.
    ld a, (ix+1)
    ld e, (ix+15)
    sub e                      ; A = logical top Y
    cp 176
    jp nc, .slime_ground_crawl ; resting on the room's bottom line
    push bc                    ; preserve enemy loop counter in B
    add a, 16                  ; probe one pixel row under the 16px body
    ld c, a
    call .slime_probe_body_width
    or a
    pop bc
    jp z, .slime_start_fall
.slime_ground_crawl:
    push bc                    ; B is the outer enemy counter; C is caller-owned
    ld b, (ix+21)              ; apply authored speed pixel-by-pixel
.slime_ground_speed_loop:
    call .slime_crawl_step
    jp c, .slime_ground_speed_done ; turned at a wall/bound: stop this frame
    inc (ix+25)
    ld a, (ix+25)
    cp (ix+24)
    jp nc, .slime_ground_travel_done
    dec b
    jp nz, .slime_ground_speed_loop
.slime_ground_speed_done:
    pop bc
    jp .enemy_anim
.slime_ground_travel_done:
    xor a
    ld (ix+25), a
    ld (ix+26), 1              ; hop: start rising to the ceiling
    pop bc
    jp .enemy_anim
.slime_start_fall:
    xor a
    ld (ix+25), a
    ld (ix+26), 3
    jp .enemy_anim
.slime_rise:
    ld d, (ix+21)              ; authored px/update, probing every pixel
.slime_rise_px:
    ld a, (ix+1)
    ld e, (ix+15)
    sub e                      ; A = logical top Y
    or a
    jp z, .slime_attach        ; reached the top edge: stick there
    dec a                      ; probe the pixel row above the head
    push bc
    push de
    ld c, a
    call .slime_probe_body_width
    or a
    pop de
    pop bc
    jp nz, .slime_attach
    dec (ix+1)
    dec d
    jp nz, .slime_rise_px
    jp .enemy_anim
.slime_attach:
    xor a
    ld (ix+25), a
    ld (ix+26), 2              ; stuck to the ceiling
    jp .enemy_anim
.slime_ceiling:
    ; Ceiling still there (head-row probe)? A destroyed tile drops the slime.
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    or a
    jp z, .slime_ceiling_crawl ; glued to the top edge of the room
    dec a
    push bc
    ld c, a
    call .slime_probe_body_width
    or a
    pop bc
    jp z, .slime_start_fall
.slime_ceiling_crawl:
    push bc                    ; preserve outer counter and caller-owned C
    ld b, (ix+21)
.slime_ceiling_speed_loop:
    call .slime_crawl_step
    jp c, .slime_ceiling_speed_done
    inc (ix+25)
    ld a, (ix+25)
    cp (ix+24)
    jp nc, .slime_ceiling_travel_done
    dec b
    jp nz, .slime_ceiling_speed_loop
.slime_ceiling_speed_done:
    pop bc
    jp .enemy_anim
.slime_ceiling_travel_done:
    xor a
    ld (ix+25), a
    ld (ix+26), 3              ; detach: drop back to the floor
    pop bc
    jp .enemy_anim
.slime_fall:
    ld d, (ix+21)              ; authored px/update, probing every pixel
.slime_fall_px:
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    cp 176
    jp nc, .slime_land         ; bottom line of the play area
    add a, 16
    push bc
    push de
    ld c, a
    call .slime_probe_body_width
    or a
    pop de
    pop bc
    jp nz, .slime_land
    inc (ix+1)
    dec d
    jp nz, .slime_fall_px
    jp .enemy_anim
.slime_land:
    xor a
    ld (ix+25), a
    ld (ix+26), a              ; phase = floor crawl
    jp .enemy_anim
.slime_probe_body_width:
    ; ------------------------------------------------------------
    ; PURPOSE: Probe one vertical collision row across the full 16px body.
    ; INPUT: C = logical probe Y, IX = current slime slot.
    ; OUTPUT: A = first solid cell or right-edge cell; Z when both edges pass.
    ; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
    ; CALLS: bitmap_probe_solid.
    ; NOTES: Samples logical X and X+15, so landing/attachment reflects the
    ; complete sprite width instead of treating the slime as a centre point.
    ; ------------------------------------------------------------
    push bc
    ld a, (ix+0)
    ld e, (ix+14)
    sub e                      ; logical left edge X
    ld b, a
    call bitmap_probe_solid
    or a
    jp nz, .slime_probe_body_width_done
    ld a, (ix+0)
    ld e, (ix+14)
    sub e
    add a, 15                 ; logical right edge X (16px body)
    ld b, a
    call bitmap_probe_solid
    or a
.slime_probe_body_width_done:
    pop bc
    ret
.slime_crawl_step:
    ; Shared floor/ceiling crawl: 1px towards dx with wall/bound turns, exactly
    ; the walker rules. Returns NC when the slime advanced 1px, C when it only
    ; turned (blocked). Preserves B (loop counter) around the probes.
    ld a, (ix+2)
    or a
    jp z, .slime_set_right
    bit 7, a
    jp nz, .slime_left
.slime_right:
    ld a, (ix+0)
    cp (ix+5)                  ; x vs maxX
    jp nc, .slime_turn_left
    push bc
    ld e, (ix+14)
    sub e
    add a, 16                  ; wall probe ahead at logical x+16
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8                   ; body-middle row works on floor and ceiling
    ld c, a
    call bitmap_probe_solid
    or a
    pop bc
    jp nz, .slime_turn_left
    inc (ix+0)
    or a                       ; NC = advanced (A is 0 from the empty probe)
    ret
.slime_turn_left:
    ld (ix+2), #FF
    scf
    ret
.slime_set_right:
    ld (ix+2), #01
    jp .slime_right
.slime_left:
    ld a, (ix+0)
    cp (ix+4)                  ; x vs minX
    jp z, .slime_turn_right
    jp c, .slime_turn_right
    push bc
    ld e, (ix+14)
    sub e
    dec a                      ; wall probe at logical x-1
    ld b, a
    ld a, (ix+1)
    ld e, (ix+15)
    sub e
    add a, 8
    ld c, a
    call bitmap_probe_solid
    or a
    pop bc
    jp nz, .slime_turn_right
    dec (ix+0)
    or a                       ; NC = advanced
    ret
.slime_turn_right:
    ld (ix+2), #01
    scf
    ret
` : ''}${scripted ? `    jp .enemy_anim
.enemy_step_scripted:
    call bitmap_enemy_script_step
    jp .enemy_anim
` : ''}.enemy_anim:
    ; --- frame animation: every animDelay frames, frame = (frame+1) % frameCount ---
    ld a, (ix+10)             ; frameCount
    cp 2
    jp c, .enemy_step_next    ; 0/1 frames = static
    dec (ix+8)                ; animTick
    jp nz, .enemy_step_next
    ld a, (ix+11)             ; animDelay
    ld (ix+8), a
    ld a, (ix+9)              ; animFrame
    inc a
    cp (ix+10)
    jp c, .enemy_anim_store
    xor a
.enemy_anim_store:
    ld (ix+9), a
.enemy_step_next:
    ld de, ${POOL_STRIDE}
    add ix, de
    dec b                     ; loop body exceeds djnz's -128 range
    jp nz, .enemy_step_loop
    pop bc
    ret
${layered ? followerStepAsm : ''}`;

  const touchDamageAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_check_enemy_touch
; ------------------------------------------------------------
; PURPOSE:
;   Apply DamageOnTouch for active bitmap-room enemy slots. Each damaging
;   enemy compares its configured damage hitbox against the Player Config body
;   hitbox, subtracts its damage from player_health, and arms player_invuln.
;
; INPUT:
;   RAM state: bitmap_enemy_count, bitmap_enemy_pool, player_x, player_y,
;              player_health, player_invuln.
;
; OUTPUT:
;   player_health and player_invuln updated on the first active overlap.
;
; DESTROYS:
;   AF, BC, DE, IX
;
; PRESERVES:
;   HL, IY
;
; CALLS:
;   None
;
; SIDE EFFECTS:
;   Reads enemy slot contact bytes at +16..+20. Damage byte 0 disables contact.
;   Does not respawn or decrement lives; it only applies contact damage + i-frames.
; ------------------------------------------------------------
bitmap_check_enemy_touch:
${opts.pauseGateAsm || ''}    ld a, (bitmap_enemy_count)
    or a
    ret z
    ld a, (player_invuln)
    or a
    ret nz                     ; already blinking -> immune this frame
    ld a, (bitmap_enemy_count)
    ld b, a
    ld ix, bitmap_enemy_pool
.enemy_touch_loop:
    ld a, (ix+13)             ; #FF = killed by a thrown object
    cp #FF
    jp z, .enemy_touch_next
    ld a, (ix+16)              ; damage
    or a
    jp z, .enemy_touch_next

    ; X overlap: enemyRight > playerLeft && playerRight > enemyLeft.
    ld a, (ix+0)
    sub (ix+14)                ; logical enemy X = visual X - visualXOff
    add a, (ix+17)             ; + damage hitbox X
    ld d, a                    ; D = enemyLeft
    ld e, a
    ld a, (ix+19)              ; hitW
    add a, e
    ld e, a                    ; E = enemyRight exclusive
    ld a, (player_x)
${playerLeft ? `    add a, ${playerLeft}\n` : ''}    ld c, a                    ; C = playerLeft
    ld a, e
    cp c
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next
    ld a, (player_x)
${playerRight ? `    add a, ${playerRight}\n` : ''}    cp d                       ; playerRight <= enemyLeft -> separated
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next

    ; Y overlap: enemyBottom > playerTop && playerBottom > enemyTop.
    ld a, (ix+1)
    sub (ix+15)                ; logical enemy Y = visual Y - visualYOff
    add a, (ix+18)             ; + damage hitbox Y
    ld d, a                    ; D = enemyTop
    ld e, a
    ld a, (ix+20)              ; hitH
    add a, e
    ld e, a                    ; E = enemyBottom exclusive
    ld a, (player_y)
${playerTop ? `    add a, ${playerTop}\n` : ''}    ld c, a                    ; C = playerTop
    ld a, e
    cp c
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next
    ld a, (player_y)
${playerBottom ? `    add a, ${playerBottom}\n` : ''}    cp d                       ; playerBottom <= enemyTop -> separated
    jp z, .enemy_touch_next
    jp c, .enemy_touch_next

    ; Apply contact damage, saturating at zero to avoid byte underflow.
    ld a, (player_health)
    ld e, (ix+16)
    sub e
    jp z, .enemy_touch_zero
    jp c, .enemy_touch_zero
    ld (player_health), a
    jp .enemy_touch_arm_iframes
.enemy_touch_zero:
    xor a
    ld (player_health), a
${respawnOnDeath ? `
    ; Last heart drained by enemy contact: spend a life, like the deadly system.
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr z, .enemy_touch_game_over     ; lives 0 -> request Game Flow exit
    jp .enemy_touch_respawn
.enemy_touch_game_over:
    ld a, 1
    ld (bitmap_game_over_flag), a
.enemy_touch_respawn:
    ; Full respawn: reset health, arm blink, zero velocity, reposition to spawn.
    ld a, ${maxHealthByte}
    ld (player_health), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_x_table
    add hl, de
    ld a, (hl)
    ld (player_x), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_y_table
    add hl, de
    ld a, (hl)
    ld (player_y), a
` : ''}.enemy_touch_arm_iframes:
    ld a, ${enemyInvulnFrames}
    ld (player_invuln), a
    ret
.enemy_touch_next:
    ld de, ${POOL_STRIDE}
    add ix, de
    dec b
    jp nz, .enemy_touch_loop
    ret
`;

  const enemyBulletHurtAsm = !programsUseFire ? '' : `
; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_hurt_player
; ------------------------------------------------------------
; PURPOSE: Apply A hearts of damage for an authored enemy bullet. This copy is
;   emitted with the enemy bullet opt-in so FIRE never depends on a boss block.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_enemy_hurt_player:
    ld b, a
    ld a, (player_health)
    sub b
    jr z, .ebhp_zero
    jr c, .ebhp_zero
    ld (player_health), a
    jr .ebhp_arm
.ebhp_zero:
    xor a
    ld (player_health), a
${respawnOnDeath ? `    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr z, .ebhp_gameover
    ld a, ${maxHealthByte}
    ld (player_health), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_x_table
    add hl, de
    ld a, (hl)
    ld (player_x), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_y_table
    add hl, de
    ld a, (hl)
    ld (player_y), a
    jr .ebhp_arm
.ebhp_gameover:
    ld a, 1
    ld (bitmap_game_over_flag), a
` : ''}.ebhp_arm:
    ld a, ${enemyInvulnFrames}
    ld (player_invuln), a
    ret
`;

  // ---- player bullets vs enemies (shoot skill) ----
  const bulletHitAsm = !opts.bulletHit ? '' : `
${!opts.bulletHit.chainFromBossLabel ? '' : `; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_targets
; ------------------------------------------------------------
; PURPOSE: Body of the shoot skill's bitmap_bullet_check_enemy_collision stub
;   when this ROM has BOTH a boss and enemy slots. The boss looks at the bullet
;   first; only a bullet it left alive is offered to the enemy pool, so a shot
;   into the boss body can never also kill an enemy behind it.
; INPUT: IX -> bullet slot (+0 active, +1 x, +2 y).
; PRESERVES: BC, IX (contract of the stub call site).
; ------------------------------------------------------------
bitmap_bullet_targets:
    call ${opts.bulletHit.chainFromBossLabel}
    ld a, (ix+0)
    or a
    ret z                     ; the boss consumed this bullet
    jp bitmap_enemy_bullet_hit

`}; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_bullet_hit
; ------------------------------------------------------------
; PURPOSE:
;   Player bullet vs the enemy pool. The first live slot whose 16x16 sprite cell
;   overlaps the bullet consumes it and dies: the slot keeps its place in the
;   pool with movement mode #FF, which the update loop, the contact-damage pass
;   and the SAT writer already read as "dead and invisible".
;
; INPUT:
;   IX -> bullet slot (+0 active, +1 x, +2 y); bitmap_enemy_count/pool.
;
; OUTPUT:
;   On a hit the bullet is deactivated and every hardware layer of the enemy
;   that was hit is marked dead.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; NOTES:
;   One authored enemy can occupy SEVERAL pool slots (a bat is a body layer plus
;   an eyes layer), so killing only the slot that was hit would leave the rest
;   flying on their own. The layers of one enemy share a LOGICAL origin — visual
;   x/y minus that layer's cell offset — which is the key .ebh_kill_layers
;   sweeps for, the same identity the bat's flight reroll already relies on.
; ------------------------------------------------------------
bitmap_enemy_bullet_hit:
    ld a, (bitmap_enemy_count)
    or a
    ret z
    push bc
    push de
    push hl
    push iy
    ld b, a
    ld iy, bitmap_enemy_pool
.ebh_loop:
    ld a, (iy+13)             ; #FF = already dead
    cp #FF
    jp z, .ebh_next
    ; |bulletX - enemyX| < 16 and |bulletY - enemyY| < 16. The sub/neg pair is a
    ; true absolute difference: a wrapped subtraction sets the borrow and
    ; negating it lands back on the real distance.
    ld a, (ix+1)
    sub (iy+0)
    jp nc, .ebh_dx_abs
    neg
.ebh_dx_abs:
    cp 16
    jp nc, .ebh_next
    ld a, (ix+2)
    sub (iy+1)
    jp nc, .ebh_dy_abs
    neg
.ebh_dy_abs:
    cp 16
    jp nc, .ebh_next
${scripted ? `    ; Scripted enemies record the impact before checking their guard. A
    ; shield consumes the bullet but prevents the normal kill/damage path.
    ld a, bitmap_enemy_script_hit_stamp
    ld (iy+bitmap_enemy_script_hit_ofs), a
    ld a, (iy+bitmap_enemy_script_shield_ofs)
    or a
    jp nz, .ebh_shielded
` : ''}    xor a
    ld (ix+0), a              ; the bullet is spent on this enemy
    call .ebh_kill_layers
    jp .ebh_done${scripted ? `
.ebh_shielded:
    xor a
    ld (ix+0), a              ; the shield also consumes the bullet
    jp .ebh_done` : ''}
.ebh_next:
    ld de, ${POOL_STRIDE}
    add iy, de
    dec b                     ; loop body exceeds djnz's -128 range
    jp nz, .ebh_loop
.ebh_done:
    pop iy
    pop hl
    pop de
    pop bc
    ret
.ebh_kill_layers:
    ; INPUT: IY -> the slot that was hit. Marks every slot sharing its logical
    ; origin as dead. DESTROYS AF, BC, DE, IY (all restored by the caller).
    ld a, (iy+0)
    sub (iy+14)               ; logical X = visual X - this layer's cell offset
    ld d, a
    ld a, (iy+1)
    sub (iy+15)               ; logical Y
    ld e, a
    ld a, (bitmap_enemy_count)
    ld b, a
    ld iy, bitmap_enemy_pool
.ebh_kill_loop:
    ld a, (iy+13)
    cp #FF
    jp z, .ebh_kill_next
    ld a, (iy+0)
    sub (iy+14)
    cp d
    jp nz, .ebh_kill_next
    ld a, (iy+1)
    sub (iy+15)
    cp e
    jp nz, .ebh_kill_next
    ld (iy+13), #FF
.ebh_kill_next:
    push de                   ; D/E carry the logical-origin key across add iy,de
    ld de, ${POOL_STRIDE}
    add iy, de
    pop de
    dec b
    jp nz, .ebh_kill_loop
    ret
`;

  // ---- bitmap_update_enemy_sat: fixed slots after the player layers ----
  // Pattern byte = slot base group *4 + animFrame*8 (2 variants/frame) + 4
  // when patrolling left (variant 1 = mirrored/facing-left).
  const satSlotBlocks = Array.from({ length: maxSlots }, (_unused, i) => {
    const slotVariants = slotPatternVariants[i];
    const slotUsesCeilingVariants = slotVariants >= 4;
    const patternByteBase = ((opts.patternGroupBase + slotPatternOffsets[i]) * 4) & 0xff;
    const poolBase = `bitmap_enemy_pool + ${i * POOL_STRIDE}`;
    return `.sat_slot_${i}:
    ld a, (bitmap_enemy_count)
    cp ${i + 1}
    jp c, .sat_slot_${i}_hidden
    ld a, (${poolBase} + 13)  ; killed enemy stays in the pool but is invisible
    cp #FF
    jp z, .sat_slot_${i}_hidden
${gear ? `    ld a, (${poolBase} + ${GEAR_STATE_OFFSET}) ; GearWheel state 0 waits off-screen
    or a
    jp z, .sat_slot_${i}_hidden
` : ''}    ld a, (${poolBase} + 1)
    add a, ${opts.gameYOffset}
    out (VDP_DATA_PORT), a    ; Y
    ld a, (${poolBase})
    out (VDP_DATA_PORT), a    ; X
    ld a, (${poolBase} + 9)   ; animFrame
    add a, a
    add a, a
    add a, a                  ; frame * 8 (2 variants x 4 pattern numbers)
${slotUsesCeilingVariants ? `    add a, a                  ; frame * 16 (4 variants x 4 pattern numbers)
` : ''}    ld e, a
    ld a, (${poolBase} + 2)   ; dx: bit7 set = moving left = mirrored variant
    and #80
    jp z, .sat_slot_${i}_right
    ld a, 4
    jp .sat_slot_${i}_pat
.sat_slot_${i}_right:
    xor a
.sat_slot_${i}_pat:
${slotUsesCeilingVariants ? `    ld d, a
    ld a, (${poolBase} + 26)  ; slime phase 1/2 (rising/ceiling) = flipped pose
    dec a
    cp 2
    ld a, d
    jp nc, .sat_slot_${i}_noflip
    add a, 8                  ; +2 pattern groups: the vertical-flip pair
.sat_slot_${i}_noflip:
` : ''}    add a, e
    add a, ${asmByte(patternByteBase)}
    out (VDP_DATA_PORT), a    ; pattern
    xor a
    out (VDP_DATA_PORT), a    ; EC = 0
    jp .sat_slot_${i}_end
.sat_slot_${i}_hidden:
    ld a, ${asmByte(ENEMY_EMPTY_SPRITE_Y)}
    out (VDP_DATA_PORT), a    ; off-screen, non-terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sat_slot_${i}_end:`;
  }).join('\n');

  const colorUploadSlotBlocks = Array.from({ length: maxSlots }, (_unused, i) => {
    const slotUsesCeilingVariants = slotPatternVariants[i] >= 4;
    const colorVram = opts.colorBase + i * 16;
    const poolBase = `bitmap_enemy_pool + ${i * POOL_STRIDE}`;
    return `.color_slot_${i}:
    ld a, (bitmap_enemy_count)
    cp ${i + 1}
    jp c, .color_slot_${i}_done
${darkEyes ? `    ld a, (${poolBase} + 0)   ; logical X
    ld b, a
    ld a, (${poolBase} + 1)   ; logical Y
    ld c, a
    call bitmap_enemy_light_reaches
    ld d, a                   ; D = 0 while no light reaches this slot
` : ''}    ld a, (${poolBase} + 12)  ; colorOff base, in 16-byte blocks
    ld e, a
    ld a, (${poolBase} + 9)   ; animFrame
    add a, e
${slotUsesCeilingVariants ? `    ld e, a
    ld a, (${poolBase} + 26)  ; slime phase 1/2 = flipped line-colour table
    dec a
    cp 2
    jp nc, .color_slot_${i}_noflip
    ld a, (${poolBase} + 10)  ; flipped tables sit frameCount blocks later
    add a, e
    ld e, a
.color_slot_${i}_noflip:
    ld a, e
` : ''}${darkEyes ? `    ld c, a
    ld a, d
    or a
    ld a, c
    jp nz, .color_slot_${i}_lit
    ld e, a                   ; in the dark: the eyes-only bank sits one whole
    ld a, (${poolBase} + 10)  ; set of frames later${slime ? ` (x2: past the slime flips)` : ''}
${slime ? `    add a, a
` : ''}    add a, e
.color_slot_${i}_lit:
` : ''}    call bitmap_enemy_colors_offset
    ld de, ${asmWord(colorVram)}
    ld bc, 16
${copyArt('bitmap_enemy_sprite_colors')}
.color_slot_${i}_done:`;
  }).join('\n');

  // ---- dark-room "eyes only": does any light source reach this enemy? ----
  const darkEyesAsm = !darkEyes ? '' : `
; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_light_reaches
; ------------------------------------------------------------
; PURPOSE: Dark-room bats. Answers whether a light source covers this enemy, so
;   the SAT writer can pick the eyes-only line-colour block instead of the full
;   body one. The sources are the ones the lighting engine already tracks: the
;   player's halo (a blob, so its half width is looked up per 8-row slice) and
;   the travelling bullet lantern (a plain box). Nothing here paints anything;
;   the halo itself is drawn by the lighting engine as always.
; INPUT: B = enemy logical X, C = enemy logical Y (RAM pool coordinates).
; OUTPUT: A = 1 lit (draw the whole body), 0 dark (draw only the eye lines).
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; NOTES: A room that is not dark short-circuits to "lit", so outside the dark
;   rooms this whole feature costs one flag test per enemy slot per frame.
;   The 8-bit sub/neg pair gives a true absolute difference across the full
;   0..255 range: a wrapped subtraction sets the borrow, and negating it lands
;   back on the real distance.
; ------------------------------------------------------------
bitmap_enemy_light_reaches:
    call bitmap_light_room_is_dark
    jp z, .elr_lit             ; normal room: nothing is hidden
    ld a, b
    add a, 8
    ld b, a                    ; B = body centre X
    ld a, c
    add a, ${asmByte(opts.gameYOffset + 8)}
    ld c, a                    ; C = body centre Y, in screen rows
${darkEyes.torchGated ? `    ld a, (bitmap_light_on)
    or a
    jp z, .elr_lantern         ; tail out: the player carries no halo
` : ''}    ld a, (bitmap_light_active)
    or a
    jp z, .elr_lantern
    ld a, (bitmap_light_y)
    ld e, a
    ld a, c
    sub e
    add a, 32
    cp 64
    jp nc, .elr_lantern        ; above or below the halo's 64-row extent
    srl a
    srl a
    srl a                      ; 0..7: which 8-row slice of the blob
${darkEyes.stagedHalo ? `    ld e, a
    ld a, (bitmap_light_stage)
    add a, a
    add a, a
    add a, a                   ; 8 half widths per decay stage
    add a, e
` : ''}    ld e, a
    ld d, 0
    ld hl, bitmap_enemy_light_half_widths
    add hl, de
    ld e, (hl)                 ; E = halo half width on this row
    ld a, (bitmap_light_x)
    ld l, a
    ld a, b
    sub l
    jp nc, .elr_halo_absx
    neg
.elr_halo_absx:
    cp e
    jp c, .elr_lit
.elr_lantern:
${!darkEyes.lantern ? '' : `    ld a, (bitmap_bl_on)
    or a
    jp z, .elr_dark
    ld a, (bitmap_bl_x)
    ld e, a
    ld a, b
    sub e
    jp nc, .elr_bl_absx
    neg
.elr_bl_absx:
    cp ${asmByte(darkEyes.lantern.halfWidth)}
    jp nc, .elr_dark
    ld a, (bitmap_bl_y)
    ld e, a
    ld a, c
    sub e
    jp nc, .elr_bl_absy
    neg
.elr_bl_absy:
    cp ${asmByte(darkEyes.lantern.halfHeight)}
    jp nc, .elr_dark
    jp .elr_lit
.elr_dark:
`}    xor a
    ret
.elr_lit:
    ld a, 1
    ret

; Halo half width per 8-row slice of its 64-row vertical extent${darkEyes.stagedHalo ? `,
; one row of 8 per decay stage (stage 0 = freshly fed)` : ''}.
bitmap_enemy_light_half_widths:
${darkEyes.halfWidths.map(row => `    DB ${row.map(value => asmByte(value)).join(',')}`).join('\n')}
`;

  const enemyBulletSatTerminator = opts.enemyBulletFollowedByPlayerBullets ? '' : `    ld a, #D8
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
`;
  const enemyBulletSatAsm = !programsUseFire ? '' : `
; ------------------------------------------------------------
; FUNCTION: bitmap_update_enemy_bullet_sat
; ------------------------------------------------------------
; PURPOSE: Publish the fixed FIRE pool before the player bullet writer.
;   Inactive entries are parked off-screen so the reserved SAT range is stable.
; ------------------------------------------------------------
bitmap_update_enemy_bullet_sat:
    push bc
    push hl
    ld de, ${asmWord(opts.enemyBulletSatBase as number)}
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
    ld ix, bitmap_enemy_bullet_pool
    ld b, ${asmByte(enemyBulletSlotCount)}
.ebs_slot:
    ld a, (ix+0)
    or a
    jp z, .ebs_hidden
    ld a, (ix+2)
    add a, ${asmByte(opts.gameYOffset)}
    out (VDP_DATA_PORT), a
    ld a, (ix+1)
    out (VDP_DATA_PORT), a
    ld a, ${asmByte(opts.enemyBulletPatternNumber as number)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jp .ebs_next
.ebs_hidden:
    ld a, ${asmByte(ENEMY_EMPTY_SPRITE_Y)}
    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.ebs_next:
    inc ix
    inc ix
    inc ix
    inc ix
    djnz .ebs_slot
${enemyBulletSatTerminator}    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop hl
    pop bc
    ret
`;

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_load_enemies
; ------------------------------------------------------------
; PURPOSE: Loads the enemy slots of the ACTIVE room: copies the per-room ROM
;   table into the mutable RAM pool, seeds the per-slot animation state and
;   uploads each used slot's sprite pattern/colour tables to its reserved
;   VRAM groups. Called after load_room at init and on every room-transition
;   commit (same sites as the foreground sprite loader).
; INPUT: current_screen_index.
; OUTPUT: bitmap_enemy_count/pool + VRAM pattern groups reserved by the
; compact per-slot enemy allocation.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY (IX saved/restored).
; CALLS: copy_to_vram_ext, bitmap_enemy_patterns_offset, bitmap_enemy_colors_offset.
; ------------------------------------------------------------
bitmap_load_enemies:
    push ix${konamiLoadAsm}
${bankedArt ? `    ; The room record lives in a data bank. Resolve its bank, LDIR it into RAM and
    ; walk the RAM copy: this routine sits in #8000-#9FFF and would unmap itself.
    push bc
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_enemy_bank_table
    add hl, de
    ld c, (hl)                ; C = data bank holding this room's record
    ld hl, bitmap_room_enemy_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                   ; HL = record, inside that bank
    ld de, bitmap_enemy_table_buf
    ld a, c                   ; A = bank (before BC is reloaded with the length)
    ld bc, ${TABLE_BYTES}
    call bitmap_copy_banked_to_ram
    pop bc
    ld hl, bitmap_enemy_table_buf` : `    ld hl, bitmap_room_enemy_ptr_table
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a`}
    ld a, (hl)                ; count byte
    ld (bitmap_enemy_count), a
    inc hl
    push hl
    pop ix                    ; IX -> slot 0 (${SCRIPTED_TABLE_STRIDE} bytes/slot)
${loadSlotBlocks}${enemyBulletLoadAsm ? `\n${enemyBulletLoadAsm}` : '\n'}    pop ix
    ret

; HL = bitmap_enemy_sprite_patterns + A*32 (A = pattern group offset).
bitmap_enemy_patterns_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32
    ld de, bitmap_enemy_sprite_patterns
    add hl, de
    ret

; HL = bitmap_enemy_sprite_colors + A*16 (A = color block offset).
bitmap_enemy_colors_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *16
    ld de, bitmap_enemy_sprite_colors
    add hl, de
    ret
${darkEyesAsm}${updateAsm}
${touchDamageAsm}${enemyBulletHurtAsm}${bulletHitAsm}
; ------------------------------------------------------------
; FUNCTION: bitmap_update_enemy_sat
; ------------------------------------------------------------
; PURPOSE: Writes the ${maxSlots} fixed enemy SAT slot(s) at VRAM ${asmWord(opts.satBase)}
;   (right after the player layers, overwriting the player writer's
;   terminator), then appends a #D8 terminator. Unused slots get an
;   off-screen Y=${asmByte(ENEMY_EMPTY_SPRITE_Y)} sprite so the VDP keeps scanning. When the shoot
;   skill is active its bullet writer runs AFTER this and overwrites our
;   terminator in turn. This routine performs SAT publication ONLY. Slow light
;   tests and line-colour copies live in bitmap_update_enemy_colors, which the
;   global main loop calls after every subsystem has published its SAT entries.
; INPUT: bitmap_enemy_count, bitmap_enemy_pool.
; OUTPUT: SAT entries at VRAM ${asmWord(opts.satBase)}..${asmWord(opts.satBase + maxSlots * 4 + 3)}.
; DESTROYS: AF, DE. PRESERVES: BC, HL, IX, IY.
; VDP STATE: R#14 restored to 0; R#15 is not changed.
; ------------------------------------------------------------
bitmap_update_enemy_sat:
    push bc
    push hl
    ld de, ${asmWord(opts.satBase)}
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
${satSlotBlocks}
    ld a, #D8
    out (VDP_DATA_PORT), a    ; terminator
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop hl
    pop bc
    ret

${enemyBulletSatAsm ? `${enemyBulletSatAsm}\n` : ''}; ------------------------------------------------------------
; FUNCTION: bitmap_update_enemy_colors
; ------------------------------------------------------------
; PURPOSE: Refreshes each active enemy hardware layer's 16-byte line-colour
;   table for its current animation/light state. Deliberately separate from SAT
;   publication so this variable-cost work cannot leave later subsystem SAT
;   entries stale or partially published when blanking ends.
; INPUT: bitmap_enemy_count, bitmap_enemy_pool and optional lighting state.
; OUTPUT: enemy colour tables refreshed at VRAM ${asmWord(opts.colorBase)}.
; DESTROYS: AF, DE. PRESERVES: BC, HL, IX, IY.
; CALLS: bitmap_enemy_colors_offset, copy_to_vram_ext, optional bitmap_enemy_light_reaches.
; VDP STATE: R#14 restored to 0; R#15 is not changed.
; ------------------------------------------------------------
bitmap_update_enemy_colors:
    push bc
    push hl
${colorUploadSlotBlocks}
    pop hl
    pop bc
    ret${scriptedRuntime ? `\n${scriptedRuntime.routinesAsm}` : ''}${konamiStepAsm}
`;

  const emitBytes = (label: string, bytes: number[], comment: string, endLabel?: string): string => {
    const lines: string[] = [`; ${comment}`, `${label}:`];
    for (let i = 0; i < bytes.length; i += 16) {
      lines.push(`    DB ${bytes.slice(i, i + 16).map(b => asmByte(b & 0xff)).join(',')}`);
    }
    if (endLabel) lines.push(`${endLabel}:`);
    return lines.join('\n') + '\n';
  };
  const konamiDataAsm = konami ? `bitmap_enemy_konami_rooms:
${data.roomTables.map((_, i) => `    DW bitmap_enemy_konami_room_${i}`).join('\n')}
${data.roomTables.map((_, room) => `bitmap_enemy_konami_room_${room}:\n` + Array.from({ length: maxSlots }, (_, slot) => {
    const index = data.konamiRoomPaths?.[room]?.[slot] ?? -1;
    if (index < 0) return '    DW 0,0,0,0';
    const path = data.konamiPaths![index];
    const label = `bitmap_enemy_konami_path_${index}`;
    return `    DW ${label},${label},${label}_end,${path.loop ? label : `${label}_end-4`}`;
  }).join('\n')).join('\n')}
${data.konamiPaths!.map((path, i) => emitBytes(`bitmap_enemy_konami_path_${i}`, path.bytes,
    'Konami positions: game Y, X, frame, reserved colour (sprite art is owned by the enemy)', `bitmap_enemy_konami_path_${i}_end`)).join('')}` : '';
  // Scripted programs stay resident: bitmap_enemy_script_step reads them with
  // HL directly and deliberately does not own mapper state. Keeping this
  // block resident also makes the runtime call safe in both simple32k and
  // Konami MegaROM builds; the cold sprite art remains banked as before.
  const scriptedProgramAsm = scripted
    ? buildEnemyBehaviorProgramAsm(data.scriptedBehaviorPrograms || []).asm
      : '';
  const enemyBulletDataAsm = programsUseFire
    ? emitBytes('bitmap_enemy_bullet_pattern_data', ENEMY_BULLET_PATTERN_BYTES, 'Scripted enemy FIRE: shared 16x16 pattern', 'bitmap_enemy_bullet_pattern_data_end')
      + emitBytes('bitmap_enemy_bullet_color_data', ENEMY_BULLET_COLOR_BYTES, 'Scripted enemy FIRE: one 16-byte line-colour block per SAT slot', 'bitmap_enemy_bullet_color_data_end')
    : '';
  const dataAsm = data.roomTables.map((table, index) =>
    (bankedArt ? '' : emitBytes(`bitmap_room_enemy_table_${index}`, table, `Room ${index} enemies: count + ${maxSlots} slot(s) x ${SCRIPTED_TABLE_STRIDE} (x,y,dx,dy,minX,maxX,minY,maxY,patOff,colOff,frames,delay,mode,xOff,yOff,damage,hitX,hitY,hitW,hitH,speed,logicInterval${slime ? ',travelPx' : ''}${gear ? ',respawnFramesLo,respawnFramesHi' : ''}${fly8 ? ',turnPx' : ''}${scripted ? ',scriptProgram' : ''})`))
  ).join('')
    + (bankedArt
      ? `; Room enemy records are emitted in Konami MegaROM data banks below.
`
        + `bitmap_room_enemy_bank_table:
    DB ${data.roomTables.map((_t, index) => `bitmap_room_enemy_table_${index}_DATA_BANK`).join(',')}
`
      : '')
    + (fly8
      ? emitBytes('bitmap_enemy_dir8_table', [1, 0, 1, 1, 0, 1, 0xFF, 1, 0xFF, 0, 0xFF, 0xFF, 0, 0xFF, 1, 0xFF],
        'Bat flight headings: dx,dy signs in the turret order R,DR,D,DL,L,UL,U,UR')
      : '')
    + `bitmap_room_enemy_ptr_table:\n${data.roomTables.map((_t, index) => `    DW bitmap_room_enemy_table_${index}`).join('\n')}\n`
    + (bankedArt
      ? '; Enemy sprite pattern/colour art is emitted in a Konami MegaROM data bank below.\n'
      : emitBytes('bitmap_enemy_sprite_patterns', data.patternBytes, `Enemy sprites: ${data.patternBytes.length / 32} pattern group(s), ${slime ? '[right, left, ceilRight, ceilLeft] variants' : '[right, left] variant pair'} per frame (mode 2 quadrants)`)
        + emitBytes('bitmap_enemy_sprite_colors', data.colorBytes, `Enemy sprites: 16-byte line colour tables per unique sprite layer frame${slime ? ' (normal tables then vertical flips)' : ''}`))
    + konamiDataAsm
    + scriptedProgramAsm
    + enemyBulletDataAsm;

  const bankedBlocks = bankedArt
    ? [
      ...data.roomTables.map((table, index) => ({
        label: `bitmap_room_enemy_table_${index}`,
        bytes: table,
        description: `Room ${index} enemy records, banked; staged into bitmap_enemy_table_buf by bitmap_load_enemies`,
      })),
      { label: 'bitmap_enemy_sprite_patterns', bytes: data.patternBytes, description: `Enemy sprites: ${data.patternBytes.length / 32} pattern group(s), banked; read only through bitmap_copy_banked_to_vram` },
      { label: 'bitmap_enemy_sprite_colors', bytes: data.colorBytes, description: 'Enemy sprites: 16-byte line colour tables, banked; read only through bitmap_copy_banked_to_vram' },
    ]
    : [];

  return {
    enabled: true,
    ramBytes: totalRamBytes,
    equates,
    loadCallAsm: '    call bitmap_load_enemies\n',
    updateCallAsm: `    call bitmap_update_enemies
${programsUseFire ? '    call bitmap_enemy_bullet_update\n' : ''}    call bitmap_check_enemy_touch
`,
    satCallAsm: '    call bitmap_update_enemy_sat\n',
    colorCallAsm: '    call bitmap_update_enemy_colors\n',
    bulletSatCallAsm: programsUseFire ? '    call bitmap_update_enemy_bullet_sat\n' : '',
    routinesAsm,
    dataAsm,
    bankedBlocks,
  };
}

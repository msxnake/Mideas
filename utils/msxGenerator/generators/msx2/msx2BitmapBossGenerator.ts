/**
 * SCREEN 5 bitmap-room BOSS runtime (Phase 1).
 *
 * A placed `kind: 'boss'` entity becomes ONE large bitmap boss per room. The
 * boss body is NOT hardware sprites (8/scanline budget is spent on player,
 * enemies and bullets): it is a rectangular 4bpp region of the shared world
 * ATLAS (VRAM rows 512+) blitted to the visible page with V9938 HMMM. Numbers
 * validated in docs/msx/BOSS_SCREEN5_FEASIBILITY.md: HMMM ~5.7 us/byte with
 * display+sprites on -> 64x64 updates at 60fps (0 overruns measured), 96x96 at
 * one update every 2 frames. The Z80 only writes the 15-byte command block;
 * the VDP moves the pixels in parallel, so the player loop always stays 60fps.
 *
 * Movement is a ping-pong patrol (the platform/enemy patrol resolver supplies
 * bounds). Trail cleanup restores 4px edge strips from the page the boss is NOT
 * drawing on before each redraw, so the boss never needs a full-rect background
 * restore while alive. The room engine double-buffers (`bitmap_displayed_page`
 * alternates on every transition) and the hidden page still holds the PREVIOUS
 * room, so `bitmap_boss_load` mirrors the freshly composed game area onto it
 * with one HMMM — once per room entry, never per frame — and every boss blit
 * picks its page from `bitmap_displayed_page` at runtime.
 *
 * Damage model (Phase 1):
 *   - Touching the boss hurts the player (same saturating health + i-frames +
 *     respawn contract as msx2BitmapEnemyGenerator).
 *   - Player bullets (shoot skill) hit the boss rect, deal 1 damage each and
 *     despawn; bitmap_bullet_check_enemy_collision redirects here. A boss WITH
 *     damage zones is different: only the zones stop a bullet (weak point =
 *     damage, armour = 0 damage), and bare body between zones lets it fly on.
 *   - At 0 HP the boss dies: full-rect restore from page 1 + persistent
 *     per-room defeated flag (it never respawns while the ROM runs).
 *
 * Authoring params on the placed entity (see msx2EntityCatalog 'bitmap_boss'):
 *   bossStampAssetId       id of the `msx2bitmapstamp` asset holding the body.
 *                          The caller composes it and injects it into the
 *                          shared world atlas, then passes the placement in:
 *                          the body is never referenced by raw atlas
 *                          coordinates, because the packer decides them.
 *                          With bossFrames > 1 the stamp is a horizontal
 *                          frame strip (width = frames * W).
 *   bossAtlasEntryId       pre-stamp way of naming the body: a room atlas entry
 *                          id. Only consulted when bossStampAssetId is empty.
 *   bossFrames             1..4 animation frames inside the strip (default 1)
 *   bossAnimDelay          frames between animation steps (default 12)
 *   bossHp                 bullet hits to kill (default 8)
 *   bossDamage             contact damage in hearts (default 1)
 *   bossInterval           update every N frames (default: 1, or 2 when
 *                          width*height/2 > 2048 bytes, per the benchmark)
 *   patrol bounds/direction: same fields the enemy/platform patrol uses.
 *
 * RAM (chained after the previous system, checked against the shared ceiling):
 *   boss_active, x, y, old_x, old_y, dx, dy, hp, anim_tick, anim_frame,
 *   int_tick (11 bytes) + sx word (2) + cmd_buf (15) + defeated[roomCount].
 */

import type { PSGSoundData } from '../../../../types';

import {
  BITMAP_BOSS_PATH_LIMITS,
  PATH_OP_ARG_BYTES,
  PATH_OP_END,
  bakeBossPath,
} from '../../../msx2BossPath';
import {
  MSX2_SHOOT_DIR16_TABLE_BYTES,
  MSX2_SHOOT_RECORD_BYTES,
  MSX2_SHOOT_RING,
  bakeShootDefinition,
} from '../../../msx2Shoot';
import { BOSS_DEFINITION_OWNED_PARAMS } from '../../../msx2BossParams';

export const BITMAP_BOSS_TABLE_STRIDE = 35;
/** Maximum number of independent bitmap bosses emitted per room. */
export const BITMAP_BOSS_MAX_INSTANCES = 2;
/** Laser config: present, source SX/SY, interval, max segments, direction mask. */
export const BITMAP_BOSS_LASER_STRIDE = 8;

/** Side of a body cell. Matches the engine's OP_COPY_16 composition primitive. */
export const BOSS_CELL_SIZE = 16;

/** Bytes per cell record: SX word, SY word, X offset, Y offset. */
export const BOSS_CELL_RECORD_BYTES = 6;

/** A boss body split back into the 16x16 cells it was authored with. */
export interface BossBodyCellGrid {
  /** Cells per animation frame, each frame row-major. */
  cellsByFrame: number[][][][];
  /** First-frame cells, kept as a convenient/debug-compatible alias. */
  cells: number[][][];
  /** Columns in one frame, not in a legacy horizontal strip. */
  columns: number;
  rows: number;
  /** Number of frames represented by the Stamp. */
  frameCount: number;
  /** True for sparse `frameVariants`; false for legacy horizontal strips. */
  variantFrames?: boolean;
}

/** Atlas key of one body cell. Stable, so the placements can be looked up back. */
export function bossBodyCellKey(stampId: string, index: number): string {
  return `${stampId}#c${index}`;
}

/**
 * Damage-zone record: x, y, w, h, kind, damageMultiplier, hitSoundIndex.
 * The table builder and the Z80 scanner both stride by this, so they cannot
 * disagree about where the next zone starts.
 */
export const BOSS_ZONE_RECORD_BYTES = 7;

/** How long a weak-point blast is held before the body repaints over it. */
export const BOSS_HIT_BLAST_DEFAULT_FRAMES = 6;

/**
 * A boss pops a weak-point blast only if the author turned it on AND asked for
 * at least one frame. The compiler additionally clears this when the boss has
 * no Death FX stamp to borrow, because the blast reuses those.
 */
export function bossHitBlastFrames(params: any): number {
  if (params?.bossHitBlastEnabled !== true) return 0;
  return clampInt(params.bossHitBlastFrames, 1, 30, BOSS_HIT_BLAST_DEFAULT_FRAMES);
}

function asmByte(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
  return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmWord(value: number): string {
  const word = Math.max(0, Math.min(0xFFFF, Math.floor(Number(value) || 0)));
  return `#${word.toString(16).toUpperCase().padStart(4, '0')}`;
}

export interface BitmapBossRoomData {
  /** True when at least one room places a boss. */
  enabled: boolean;
  /** Per-room table bytes (BITMAP_BOSS_TABLE_STRIDE * BITMAP_BOSS_MAX_INSTANCES; [0]=present flag). */
  roomTables: number[][];
  /**
   * Per-room Boss Defeat Actions bytecode (Phase A). Each stream is a list of
   * [opcode, arg...] pairs terminated by DEFEAT_OP_END. Interpreted by
   * bitmap_boss_run_defeat_actions when the boss in that room dies. A room
   * with no onDefeated actions has a single-byte [END] stream.
   */
  defeatStreams: number[][];
  /**
   * Global registry of flag names referenced by any setFlag action, in first-
   * seen order. The runtime bitmap_boss_flags table has one persistent byte per
   * entry; a setFlag opcode carries the index into this list.
   */
  flagNames: string[];
  /**
   * Per-room chain-barrier table (Phase B). BITMAP_BOSS_BARRIER_STRIDE bytes:
   * [present, sxLo, sxHi, syLo, syHi]. When present, the boss seals the whole
   * room perimeter (row 0, row 11, col 0, col 15) with a single solid "chain"
   * atlas tile after the mandatory walk-to-centre intro prelude and clears it
   * (collision + graphics) on defeat.
   */
  barrierTables: number[][];
  /**
   * Per-room Boss Intro / Room Lock bytecode. Layout:
   *   END (#00)
   *   CLOSE_BARRIER (#01, rasterLinesPerFrame; #FF = whole barrier this frame)
   *   DIALOGUE (#02, runtime dialogue index)
   *   WAIT (#03, frames)
   *
   * The stream is restarted on every room entry while the boss is alive. It
   * never uses a persistent "intro seen" flag.
   */
  introStreams: number[][];
  /**
   * Per-room target of the mandatory Room Lock auto-walk, as the screen X of
   * the CENTRE of the player's collision body (0..255). Authored per boss
   * (`bossIntroEntryX`); rooms with no boss carry the screen centre, which is
   * what the whole system used before the field existed.
   */
  introEntryX: number[];
  /**
   * Per-room boss projectile config (Phase D). BITMAP_BOSS_PROJECTILE_STRIDE
   * bytes: [present, sxLo, sxHi, syLo, syHi, w, h, interval, speed, damage, kind]
   * where kind 0 = bitmap (HMMM blit) and 1 = hardware sprite.
   * When present, the boss fires a small bitmap projectile (HMMM-blitted, no
   * hardware sprites) toward the player every `interval` frames.
   */
  projectileTables: number[][];
  /**
   * Per-room damage zones (Phase E). Layout: [count, (x, y, w, h, kind,
   * multiplier) * count] in boss-local pixels. kind 0 = invulnerable (bullets
   * vanish, no damage), 1 = weak point (damage * multiplier). Zones are tested
   * in order; the first hit wins. Bullets that land on bare body (no zone) pass
   * THROUGH the boss. An empty table ([0]) keeps the legacy contract instead:
   * the whole body is damageable for 1 per bullet.
   */
  damageZoneTables: number[][];
  /**
   * Per-room attack-phase table (Phase D). Layout: [count, (hpAtOrBelow,
   * interval, projSpeed) * count], ordered most-damaged-first. The runtime
   * picks the FIRST entry whose hpAtOrBelow >= current boss_hp, so a boss gets
   * angrier as it loses health. An empty table ([0]) keeps the base cadence.
   */
  phaseTables: number[][];
  /**
   * Baked path streams (Fase G), one per referenced `msx2bosspath` asset, in
   * first-seen order. Each stream is per-tick movement bytes with escaped
   * action opcodes (see utils/msx2BossPath.ts). Empty when no boss uses a path,
   * which keeps the whole feature out of the ROM.
   */
  pathStreams: number[][];
  /** Firing mode per path stream: 0 = keep the phase cadence, 1 = only the node scripts shoot. */
  pathModes: number[];
  /**
   * Per-room path selection: [defaultPathIdx, phaseCount, (hpAtOrBelow, pathIdx) * n].
   * An empty array means this room's boss never follows a path.
   */
  pathSelTables: number[][];
  /**
   * Shoot definition records (MSX2_SHOOT_RECORD_BYTES each), in first-seen
   * order. A path's fire opcode carries the 1-based index into this list; 0
   * keeps the plain aimed bullet, so the table only exists when used.
   */
  shootRecords: number[][];
  /**
   * Per-room bitmap death sequence. Layout:
   * [assetCount, blastCount, interval, hold,
   *  (sxLo, sxHi, syLo, syHi, w, h) * assetCount].
   * A zero assetCount keeps the legacy immediate defeat.
   */
  deathFxTables: number[][];
  /**
   * Per-room boss body cell blob (FASE 3): [frameCount, cellsPerFrame,
   * strideLo, strideHi, (sxLo,sxHi,syLo,syHi,dx,dy) * frameCount*cellsPerFrame].
   * `[0, 0]` means the body is a single atlas rectangle and the monolithic blit
   * still applies.
   */
  cellTables: number[][];
  /**
   * Per-room CHANGED-cell lists (FASE 3b): [count, records...] per frame, in
   * frame order, each frame diffed against the one the animation came from.
   */
  cellDeltaTables: number[][];
  /**
   * Death SFX selector per room: zero = no boss, -1 = built-in MSX2 explosion,
   * positive = one-based custom stream index.
   */
  deathSoundIndexes: number[];
  /** Deduplicated channel-C PSG streams referenced by deathSoundIndexes. */
  deathSoundStreams: number[][];
  /** Per-room/per-instance laser configs: [present,sxLo,sxHi,syLo,syHi,interval,maxSegments,mask]. */
  laserTables: number[][];
}

/** A reusable shot pattern referenced by a path node's fire action. */
export interface BossShootAsset {
  id: string;
  name?: string;
  /** Same shape as the Msx2ShootDefinition asset data. */
  shoot: any;
}

/** A reusable movement recipe referenced by `bossPathId` / `BossPhase.pathId`. */
export interface BossPathAsset {
  id: string;
  name?: string;
  /** Same shape as the Msx2BossPath asset data. */
  path: any;
}

/**
 * Which cross-system defeat actions this project can actually perform. The room
 * generator knows which subsystems exist; the boss data builder only compiles
 * actions that have somewhere to land.
 */
export interface BossDefeatCapabilities {
  /** bitmap_key_count exists (a key pickup or locked door is present). */
  hasKeys: boolean;
  /** Locked-door entity id -> its bitmap_key_door_open_flags offset. */
  doorOffsetById: Map<string, number>;
  /** Dialogue asset id -> runtime index; empty when the world has no dialogue system. */
  dialogueIndexById?: Map<string, number>;
  /** The door transition primitive exists (it ships with the key/door system). */
  hasRoomTransition?: boolean;
  /** Bitmap room asset id -> room index, for changeScreen. */
  roomIndexById?: Map<string, number>;
}

export const BITMAP_BOSS_BARRIER_STRIDE = 5;
export const BITMAP_BOSS_PROJECTILE_STRIDE = 11;
/** Bitmap projectile pool size (shared; one boss active at a time). */
export const BITMAP_BOSS_PROJECTILE_SLOTS = 3;

/** Boss Defeat Action bytecode opcodes (Phase A). */
const DEFEAT_OP_END = 0x00;
const DEFEAT_OP_SET_FLAG = 0x01;   // arg: flag index into flagNames
const DEFEAT_OP_GIVE_KEY = 0x02;   // arg: how many keys to add
const DEFEAT_OP_OPEN_DOOR = 0x03;  // arg: door open-flag offset
const DEFEAT_OP_SHOW_MESSAGE = 0x04; // arg: dialogue index (NPC text box)
const DEFEAT_OP_CHANGE_SCREEN = 0x05; // args: room index, entry X (#FF = keep), entry Y

/**
 * Where the Room Lock auto-walk takes the player when the boss does not say
 * otherwise: the centre of the screen, measured on the player's body centre.
 */
const INTRO_ENTRY_X_CENTRE = 128;

/** Boss Intro / Room Lock opcodes. Every non-END opcode has one argument. */
const INTRO_OP_END = 0x00;
const INTRO_OP_CLOSE_BARRIER = 0x01;
const INTRO_OP_DIALOGUE = 0x02;
const INTRO_OP_WAIT = 0x03;

/**
 * Compact channel-C stream: duration, R4, R5, R6, R10, R7-C-bits. A zero
 * duration terminates it. Hardware envelopes are deliberately flattened to a
 * fixed volume because AY R11-R13 are global and may belong to the music.
 */
const BOSS_DEATH_SFX_RECORD_BYTES = 6;
const DEFAULT_BOSS_DEATH_SFX = [
  3, 0xF0, 0x03, 0x03, 15, 0x00, // low thump + harsh noise
  4, 0x70, 0x00, 0x08, 12, 0x04, // noise-only decay
  5, 0xB0, 0x00, 0x10, 8, 0x04,
  6, 0x00, 0x01, 0x1A, 4, 0x04,
  0,
];

function compileBossDeathSound(sound: PSGSoundData | undefined): number[] | undefined {
  const channels = Array.isArray(sound?.channels) ? sound.channels : [];
  const channel = [...channels]
    .sort((a, b) => (a.id === 'C' ? -1 : b.id === 'C' ? 1 : 0))
    .find(candidate => Array.isArray(candidate?.steps) && candidate.steps.length > 0);
  if (!channel) return undefined;

  const masterVolume = Number.isFinite(Number(sound?.masterVolume))
    ? Math.max(0, Math.min(1, Number(sound?.masterVolume)))
    : 1;
  const noisePeriod = clampInt(sound?.noisePeriod, 0, 31, 0);
  const records: number[][] = [];
  for (const step of channel.steps) {
    const tonePeriod = clampInt(step?.tonePeriod, 1, 0x0FFF, 1);
    const volume = step?.useEnvelope
      ? Math.round(15 * masterVolume)
      : Math.round(clampInt(step?.volume, 0, 15, 0) * masterVolume);
    const mixerBits = (step?.toneEnabled === true ? 0 : 0x04)
      | (step?.noiseEnabled === true ? 0 : 0x20);
    let frames = Math.max(1, Math.round(clampInt(step?.durationMs, 1, 60_000, 100) * 60 / 1000));
    while (frames > 0 && records.length < 32) {
      const duration = Math.min(255, frames);
      records.push([
        duration,
        tonePeriod & 0xff,
        (tonePeriod >> 8) & 0x0f,
        noisePeriod,
        volume,
        mixerBits,
      ]);
      frames -= duration;
    }
    if (records.length >= 32) break;
  }
  return records.length ? [...records.flat(), 0] : undefined;
}

/** Argument bytes per opcode; the stream walker needs it to skip args safely. */
const DEFEAT_OP_ARGS: Record<number, number> = {
  [DEFEAT_OP_SET_FLAG]: 1,
  [DEFEAT_OP_GIVE_KEY]: 1,
  [DEFEAT_OP_OPEN_DOOR]: 1,
  [DEFEAT_OP_SHOW_MESSAGE]: 1,
  [DEFEAT_OP_CHANGE_SCREEN]: 3,
};

/**
 * Compile a boss `onDefeated` action list into runtime bytecode. `flagNames`
 * is the shared global registry (mutated to append newly-seen flag names).
 * Unknown or not-yet-wired actions are skipped with a warning so a ROM never
 * breaks on an action a later Phase will implement.
 */
function buildDefeatStream(onDefeated: unknown, flagNames: string[], roomName: string, caps: BossDefeatCapabilities): number[] {
  const stream: number[] = [];
  if (Array.isArray(onDefeated)) {
    for (const raw of onDefeated) {
      const action = raw && typeof raw === 'object' ? String((raw as any).action || '').trim() : '';
      switch (action) {
        case 'setFlag': {
          const flag = String((raw as any).flag || '').trim();
          if (!flag) {
            console.warn(`MSX2 bitmap room "${roomName}": boss onDefeated setFlag with no "flag" name; skipped.`);
            break;
          }
          let index = flagNames.indexOf(flag);
          if (index < 0) { index = flagNames.length; flagNames.push(flag); }
          if (index > 255) {
            console.warn(`MSX2 bitmap room "${roomName}": more than 256 boss flags; "${flag}" skipped.`);
            break;
          }
          stream.push(DEFEAT_OP_SET_FLAG, index);
          break;
        }
        case 'giveKey':
        case 'giveItem': {
          if (!caps.hasKeys) {
            console.warn(`MSX2 bitmap room "${roomName}": boss onDefeated "${action}" needs the key/item system (place a key pickup or a locked door); skipped.`);
            break;
          }
          const count = Math.max(1, Math.min(255, Math.floor(Number((raw as any).count) || 1)));
          stream.push(DEFEAT_OP_GIVE_KEY, count);
          break;
        }
        case 'openDoor': {
          const target = String((raw as any).target || (raw as any).doorId || '').trim();
          const offset = target ? caps.doorOffsetById.get(target) : undefined;
          if (offset === undefined) {
            console.warn(`MSX2 bitmap room "${roomName}": boss onDefeated openDoor target "${target}" is not a locked-door entity id; skipped.`);
            break;
          }
          stream.push(DEFEAT_OP_OPEN_DOOR, offset & 0xff);
          break;
        }
        case 'showMessage': {
          const assetId = String((raw as any).dialogueAssetId || (raw as any).target || '').trim();
          const index = assetId ? caps.dialogueIndexById?.get(assetId) : undefined;
          if (index === undefined) {
            console.warn(`MSX2 bitmap room "${roomName}": boss onDefeated showMessage needs a dialogue asset with at least one line; skipped.`);
            break;
          }
          stream.push(DEFEAT_OP_SHOW_MESSAGE, index & 0xff);
          break;
        }
        case 'changeScreen': {
          if (!caps.hasRoomTransition) {
            console.warn(`MSX2 bitmap room "${roomName}": boss onDefeated changeScreen reuses the door transition, so the project needs a key pickup or a locked door; skipped.`);
            break;
          }
          const target = String((raw as any).target || (raw as any).roomId || '').trim();
          const index = target ? caps.roomIndexById?.get(target) : undefined;
          if (index === undefined) {
            console.warn(`MSX2 bitmap room "${roomName}": boss onDefeated changeScreen target "${target}" is not a bitmap room; skipped.`);
            break;
          }
          // #FF on X means "drop the player wherever they already stand".
          const rawX = (raw as any).entryX;
          const entryX = rawX === undefined || rawX === null || rawX === '' ? 0xff : clampInt(rawX, 0, 254, 0xff);
          const entryY = clampInt((raw as any).entryY, 0, 255, 0);
          if (stream.includes(DEFEAT_OP_SHOW_MESSAGE)) {
            console.warn(`MSX2 bitmap room "${roomName}": boss onDefeated shows a message and then changes screen; the text box stays open across the room flip. Put changeScreen first, or drop one of them.`);
          }
          stream.push(DEFEAT_OP_CHANGE_SCREEN, index & 0xff, entryX & 0xff, entryY & 0xff);
          break;
        }
        case '':
          break;
        default:
          console.warn(`MSX2 bitmap room "${roomName}": boss onDefeated action "${action}" not implemented yet; skipped.`);
          break;
      }
    }
  }
  stream.push(DEFEAT_OP_END);
  return stream;
}

/**
 * Compile the ordered Room Lock authoring list. The Z80 owns no geometry:
 * CLOSE_BARRIER advances a horizontal raster from the top room row to the
 * bottom one, sealing only empty perimeter cells touched by each scan line.
 * DIALOGUE opens the shared msx2dialogue runtime, and WAIT is a byte timer.
 *
 * The two legacy dialogue field names are accepted only when there is no
 * explicit sequence. They compile as close-then-dialogue, matching the agreed
 * boss-intro flow, while new projects should author `roomLockSequence`.
 */
function buildIntroStream(params: any, roomName: string, caps: BossDefeatCapabilities): number[] {
  let steps = Array.isArray(params?.roomLockSequence) ? params.roomLockSequence : [];
  if (steps.length === 0) {
    const legacyDialogueId = String(
      params?.bossIntroDialogueId || params?.bossBarrierDialogueAssetId || '',
    ).trim();
    if (legacyDialogueId) {
      steps = [
        { kind: 'closeBarrier', animated: params?.bossBarrierAnimated !== false, linesPerFrame: 4 },
        { kind: 'dialogue', dialogueAssetId: legacyDialogueId },
      ];
    } else if (String(params?.bossBarrierTileId || '').trim()) {
      // Legacy bosses without an authored sequence still raise their chain,
      // but only after the mandatory walk-to-centre prelude has completed.
      steps = [{ kind: 'closeBarrier', animated: false, linesPerFrame: 0xff }];
    }
  }

  const stream: number[] = [];
  for (const raw of steps) {
    if (!raw || typeof raw !== 'object') continue;
    const kind = String((raw as any).kind || '').trim();
    switch (kind) {
      case 'closeBarrier': {
        const animated = (raw as any).animated !== false;
        // `cellsPerFrame` was the old cell-order speed field. Reuse its numeric
        // value as scanlines-per-frame so existing projects keep their pacing
        // while switching to the descending pixel-raster effect.
        const linesPerFrame = animated
          ? clampInt((raw as any).linesPerFrame ?? (raw as any).cellsPerFrame, 1, 16, 4)
          : 0xff;
        stream.push(INTRO_OP_CLOSE_BARRIER, linesPerFrame);
        break;
      }
      case 'dialogue': {
        const assetId = String((raw as any).dialogueAssetId || '').trim();
        const index = assetId ? caps.dialogueIndexById?.get(assetId) : undefined;
        if (index === undefined) {
          console.warn(`MSX2 bitmap room "${roomName}": boss intro dialogue "${assetId}" is missing or has no lines; step skipped.`);
          break;
        }
        stream.push(INTRO_OP_DIALOGUE, index & 0xff);
        break;
      }
      case 'wait':
        stream.push(INTRO_OP_WAIT, clampInt((raw as any).frames, 1, 255, 30));
        break;
      case '':
        break;
      default:
        console.warn(`MSX2 bitmap room "${roomName}": boss intro step "${kind}" is unknown; skipped.`);
        break;
    }
  }
  stream.push(INTRO_OP_END);
  return stream;
}

/**
 * Sprite-bullet resources. Boss bullets REUSE the enemy SAT slots and colour
 * block: during a boss fight the room has no regular enemies, so both are idle
 * and the shared allocation chain does NOT grow — nothing downstream shifts.
 * The pattern group is NOT reused: the room generator's allocator lets
 * non-co-active categories share a group, so the enemy group may double as the
 * moving-platform (or carryable/turret) group. The caller passes a group that
 * is disjoint from every category co-active with the boss rooms.
 */
export interface BitmapBossSpriteBulletOptions {
  /** SAT address of the first enemy slot (boss bullets overwrite from here). */
  satBase: number;
  /** Sprite-mode-2 line colour block of the first enemy slot. */
  colorBase: number;
  /** Sprite pattern table address for the bullet's 16x16 pattern. */
  patternAddr: number;
  /** Pattern number (group * 4) written into the SAT. */
  patternNumber: number;
  /** How many bullets may fly at once (already capped by the free enemy slots). */
  maxSlots: number;
  /** Palette index for the bullet body (used by the built-in pattern). */
  color: number;
  /**
   * Bullet sprite chosen by the user in the Boss Editor
   * (`bossProjectileSpriteId`): one 32-byte hardware pattern per animation
   * frame, first-frame line colours, and the authored frame delay.
   * Undefined falls back to the built-in 16x16 pattern with an 8x8 blob centred.
   */
  sprite?: {
    frames: Array<{ patternBytes: number[]; colorBytes: number[] }>;
    delayFrames: number;
  };
}

export interface BitmapBossRuntimeOptions {
  ramBase: number;
  /** Konami MegaROM: per-room records live in a data bank, staged into RAM. */
  bankedTables?: boolean;
  /** Present only when sprite bullets are possible for this project. */
  spriteBullets?: BitmapBossSpriteBulletOptions;
  /**
   * VRAM row of the 16x16 scratch rectangle used to save the pixels underneath
   * a bitmap projectile. Required for projectiles: restoring from page 1 would
   * erase page-0-only overlays (boss body, chain barrier, pickups).
   */
  projScratchBaseY?: number;
  /** HUD band height added to logical Y for visible-page blits. */
  gameYOffset: number;
  /** Height of the game area below the HUD band (default 192). */
  gameHeight?: number;
  /** Player body hitbox in local player coordinates. */
  playerHitbox: { x: number; y: number; w: number; h: number };
  /**
   * True when the key/door subsystem already emits `bitmap_player_overlaps_16`.
   * The chain barrier calls that helper, but it is owned by the key/door block
   * and therefore ABSENT from a project with a boss barrier and no keys, doors
   * or pickups — which failed to assemble with "Invalid arguments" on the call.
   * When false the barrier emits its own copy so it is self-contained; when true
   * it reuses the shared one, keeping existing ROMs byte-identical.
   */
  playerOverlapHelperAvailable?: boolean;
  /** Frames of player invulnerability armed on contact damage. */
  damageInvulnFrames: number;
  /** Player max health (respawn refill). */
  maxHealth: number;
  /** Early-return gate (NPC dialogue pause etc.). */
  pauseGateAsm?: string;
  /**
   * Konami MegaROM: the per-room tables live in resident bank 2 (#8000), but
   * the room-load path leaves P2 on whatever banked resource it just streamed
   * (music, RLE). `bitmap_boss_load` must map the resident bank back in before
   * reading them.
   */
  bankedRoomData?: boolean;
  /** Optional active-world pool size for the per-room defeated flags. */
  roomPoolCount?: number;
  /** RAM byte containing the active room's local pool index. */
  roomPoolIndexLabel?: string;
  /**
   * Music mute/resume calls, emitted only by projects that actually have a
   * music runtime. The death presentation silences the song while the
   * explosions play — its PSG channel would otherwise fight the music — and
   * restores it when the sequence ends. A boss without death FX never mutes.
   */
  musicMuteAsm?: string;
  musicResumeAsm?: string;
}

export interface BitmapBossSystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  /**
   * Boot-time init: clears the active-world boss scratch (defeated flags and
   * defeat action flags). WorldLink reuses this pool for the next world, so it
   * is intentionally reset at the world boundary instead of growing globally.
   */
  initAsm: string;
  /** `call bitmap_boss_load` — with the other system load calls after load_room. */
  loadCallAsm: string;
  /** `call bitmap_boss_update` — logic phase, after platform update. */
  updateCallAsm: string;
  /** Main-loop gate after bitmap_dialogue_frame: freezes player during non-dialogue intro steps. */
  playerGateAsm: string;
  /** Overrides keyboard row C while the mandatory walk-to-centre flag is active. */
  autoMoveInputAsm: string;
  /** Body for the shoot skill's bullet-vs-enemy stub (jp target). */
  bulletHookLabel: string;
  /** `call bitmap_boss_sbul_sat` — must run AFTER bitmap_update_enemy_sat. */
  satCallAsm: string;
  routinesAsm: string;
  dataAsm: string;
  /** Room records for the MegaROM data-bank packer; empty on simple32k. */
  bankedBlocks: Array<{ label: string; bytes: number[]; description: string }>;
}

interface BossSlotInput {
  x: number; y: number; dx: number; dy: number;
  minX: number; maxX: number; minY: number; maxY: number;
}

/**
 * Collect the per-room boss tables. `resolvePatrol` maps a placed entity to
 * patrol geometry (the caller reuses getMsx2EnemyHazardRuntimeSlots exactly
 * like the moving-platform collector, so bounds semantics stay identical).
 *
 * IMPORTANT: rooms must be the shared-atlas REMAPPED rooms — the packer
 * rewrites every entry's sx/sy, and those final coordinates are what the
 * HMMM source registers need.
 */
export function buildBitmapRoomBossData(
  rooms: Array<{ name: string; entities?: any[]; atlas?: { entries?: any[] } }>,
  resolvePatrol: (entity: any) => BossSlotInput | undefined,
  caps: BossDefeatCapabilities = { hasKeys: false, doorOffsetById: new Map() },
  /** Reusable boss templates, keyed by id (Phase C). */
  definitions: Map<string, BossDefinitionAsset> = new Map(),
  /** Reusable movement paths, keyed by asset id (Fase G). */
  paths: Map<string, BossPathAsset> = new Map(),
  /** Reusable shot patterns, keyed by asset id (Fase G). */
  shoots: Map<string, BossShootAsset> = new Map(),
  /** Sound Editor PSG assets available to the Boss Death FX selector. */
  sounds: Map<string, PSGSoundData> = new Map(),
  /**
   * Where each boss body/death-FX stamp landed in the shared world atlas, keyed
   * by stamp asset id. The caller composes the stamps and injects them, because
   * only it owns the atlas packer; here they are rectangles to point at.
   */
  bodyStampPlacements: Map<string, { sx: number; sy: number; w: number; h: number }> = new Map(),
  /**
   * Body stamps that the caller split into 16x16 cells (FASE 3, study §5).
   * Keyed by stamp asset id; each cell's atlas rectangle is looked up in
   * `bodyStampPlacements` under `bossBodyCellKey(id, index)`. A body that is not
   * here keeps the old single-rectangle path.
   */
  bodyGrids: Map<string, BossBodyCellGrid> = new Map(),
): BitmapBossRoomData {
  let enabled = false;
  const flagNames: string[] = [];
  // Paths are baked once and shared: several rooms (and later, enemy waves) can
  // walk the same shape. The index stored in the selection tables is 1-based so
  // that 0 can mean "stand still".
  const pathStreams: number[][] = [];
  const pathModes: number[] = [];
  const pathIndexById = new Map<string, number>();
  // Shot patterns are shared the same way: baked once, referenced by index.
  const shootRecords: number[][] = [];
  const shootIndexById = new Map<string, number>();
  const deathSoundStreams: number[][] = [];
  const deathSoundIndexByKey = new Map<string, number>();
  const indexOfDeathSound = (rawId: unknown, roomName: string): number => {
    const requestedId = String(rawId || '').trim();
    if (!requestedId) return -1;
    const sound = sounds.get(requestedId);
    if (!sound) {
      console.warn(`MSX2 bitmap room "${roomName}": boss explosion sound "${requestedId}" was not found; using the built-in PSG explosion.`);
      return -1;
    }
    const stream = compileBossDeathSound(sound);
    if (!stream) {
      console.warn(`MSX2 bitmap room "${roomName}": boss explosion sound "${requestedId}" has no playable steps; using the built-in PSG explosion.`);
      return -1;
    }
    const known = deathSoundIndexByKey.get(requestedId);
    if (known !== undefined) return known;
    deathSoundStreams.push([...stream]);
    const index = deathSoundStreams.length;
    deathSoundIndexByKey.set(requestedId, index);
    return index;
  };
  const indexOfShoot = (rawId: unknown): number => {
    const id = String(rawId ?? '').trim();
    if (!id) return 0;
    const known = shootIndexById.get(id);
    if (known !== undefined) return known;
    const asset = shoots.get(id);
    if (!asset) {
      console.warn(`MSX2 bitmap boss: shoot pattern "${id}" not found; firing a single aimed bullet instead.`);
      return 0;
    }
    shootRecords.push(bakeShootDefinition(asset.shoot));
    const index = shootRecords.length;   // 1-based
    shootIndexById.set(id, index);
    return index;
  };
  const indexOfPath = (rawId: unknown): number => {
    const id = String(rawId ?? '').trim();
    if (!id || id.toLowerCase() === 'none') return 0;
    const known = pathIndexById.get(id);
    if (known !== undefined) return known;
    const asset = paths.get(id);
    if (!asset) {
      console.warn(`MSX2 bitmap boss: path "${id}" not found; the boss will not follow it.`);
      return 0;
    }
    const baked = bakeBossPath(asset.path, BITMAP_BOSS_PATH_LIMITS, indexOfShoot);
    for (const warning of baked.warnings) {
      console.warn(`MSX2 bitmap boss path "${asset.name || id}": ${warning}`);
    }
    pathStreams.push(baked.bytes);
    pathModes.push(String(asset.path?.firing || 'auto') === 'path' ? 1 : 0);
    const index = pathStreams.length;   // 1-based
    pathIndexById.set(id, index);
    return index;
  };
  const emptyTable = () => new Array(BITMAP_BOSS_TABLE_STRIDE).fill(0);
  const emptyLaser = () => new Array(BITMAP_BOSS_LASER_STRIDE).fill(0);
  const emptyBarrier = () => new Array(BITMAP_BOSS_BARRIER_STRIDE).fill(0);
  const emptyProjectile = () => new Array(BITMAP_BOSS_PROJECTILE_STRIDE).fill(0);
  const emptyEntry = () => ({
    table: emptyTable(),
    laser: emptyLaser(),
    stream: [DEFEAT_OP_END],
    intro: [INTRO_OP_END],
    introEntryX: INTRO_ENTRY_X_CENTRE,
    barrier: emptyBarrier(),
    projectile: emptyProjectile(),
    phases: [0],
    zones: [0],
    pathSel: [] as number[],
    deathFx: [0, 0, 0, 0],
    deathSoundIndex: 0,
    cells: [0, 0],
    cellsDelta: [0],
  });
  const perRoom = rooms.map(room => {
    const bosses = (room.entities || []).filter((entity: any) => entity?.kind === 'boss' && entity.position);
    if (bosses.length > BITMAP_BOSS_MAX_INSTANCES) {
      console.warn(`MSX2 bitmap room "${room.name}": at most ${BITMAP_BOSS_MAX_INSTANCES} bitmap bosses are supported; extra ones were skipped.`);
    }
    const selectedBosses = bosses.slice(0, BITMAP_BOSS_MAX_INSTANCES);
    while (selectedBosses.length < BITMAP_BOSS_MAX_INSTANCES) selectedBosses.push(undefined as any);
    const entries = selectedBosses.map(entity => entity ? buildEntry(room, entity) : emptyEntry());
    return { entries };
  });

  function buildEntry(room: { name: string; entities?: any[]; atlas?: { entries?: any[] } }, entity: any) {
    // Phase C: a placed boss may either carry its settings inline (legacy) or
    // reference a reusable BossDefinition asset via `bossId` / `bossDefinitionId`
    // and override a few of them per encounter. Encounter values win, so the
    // same boss can appear twice with different HP, phase or rewards.
    const params = resolveBossParams(entity, definitions);
    const even = (v: number) => Math.floor(v / 2) * 2;
    // The body is a STAMP asset, already placed in the shared atlas by the
    // caller. `bossAtlasEntryId` is the pre-stamp way of saying the same thing
    // and is only consulted when no stamp is named, so old projects keep working.
    const stampId = String(params.bossStampAssetId || '').trim();
    // FASE 3: a split body has no single rectangle in the atlas any more -- its
    // cells are scattered wherever the packer deduped them. The strip geometry
    // comes from the authored grid instead, and the cells are addressed one by
    // one through bodyStampPlacements under their per-cell keys.
    const bodyGrid = stampId ? bodyGrids.get(stampId) : undefined;
    const bodySource = bodyGrid
      ? {
        label: `body stamp "${stampId}"`,
        rect: {
          sx: 0,
          sy: 0,
          w: bodyGrid.columns * BOSS_CELL_SIZE,
          h: bodyGrid.rows * BOSS_CELL_SIZE,
        },
      }
      : stampId
      ? { label: `body stamp "${stampId}"`, rect: bodyStampPlacements.get(stampId) }
      : (() => {
        const entryId = String(params.bossAtlasEntryId || '').trim();
        const entry = (room.atlas?.entries || []).find((candidate: any) => String(candidate?.id) === entryId);
        return {
          label: `atlas entry "${entryId}"`,
          rect: entry ? { sx: Number(entry.sx), sy: Number(entry.sy), w: Number(entry.w), h: Number(entry.h) } : undefined,
        };
      })();
    if (!bodySource.rect) {
      console.warn(`MSX2 bitmap room "${room.name}": boss ${bodySource.label} not found; boss disabled in this room.`);
      return emptyEntry();
    }
    // A sparse Stamp variant owns the frame count and keeps every frame at the
    // base grid size. Legacy stamps still use a horizontal strip and the
    // explicit bossFrames field, so existing projects keep their old layout.
    const variantFrames = bodyGrid?.variantFrames === true;
    const frames = variantFrames
      ? Math.max(1, Math.min(4, bodyGrid?.frameCount || 1))
      : clampInt(params.bossFrames, 1, 4, 1);
    const stripW = variantFrames
      ? Math.max(1, bodyGrid!.columns * BOSS_CELL_SIZE)
      : Math.max(1, Math.floor(Number(bodySource.rect.w) || 0));
    const stripH = variantFrames
      ? Math.max(1, bodyGrid!.rows * BOSS_CELL_SIZE)
      : Math.max(1, Math.floor(Number(bodySource.rect.h) || 0));
    const width = even(clampInt(variantFrames ? stripW : Math.floor(stripW / frames), 16, 128, 16));
    const height = clampInt(stripH, 16, 96, 16);
    // FASE 3: one cell record per 16x16 of the frame, for every frame, in one
    // flat uniform blob: [frameCount, cellsPerFrame, records...]. Uniform because
    // every frame of a strip has the same cell count, which spares the runtime a
    // per-frame pointer table -- the frame offset is plain multiplication.
    const cellBlob: number[] = [];
    const cellDeltaBlob: number[] = [];
    if (bodyGrid) {
      const cellsX = variantFrames ? bodyGrid.columns : Math.floor(width / BOSS_CELL_SIZE);
      const cellsY = variantFrames ? bodyGrid.rows : Math.floor(height / BOSS_CELL_SIZE);
      const perFrame = cellsX * cellsY;
      const stride = perFrame * BOSS_CELL_RECORD_BYTES;
      let missing = 0;
      const record = (frame: number, cx: number, cy: number) => {
        // Legacy strips are one wide grid whose frame starts at `frame*cellsX`;
        // sparse variants are already separate full-frame grids.
        const gridIndex = variantFrames
          ? frame * perFrame + cy * cellsX + cx
          : cy * bodyGrid.columns + frame * cellsX + cx;
        const placed = bodyStampPlacements.get(bossBodyCellKey(stampId, gridIndex));
        if (!placed) { missing += 1; }
        return {
          sx: placed ? placed.sx : 0,
          // Placements are atlas-relative; the atlas itself lives at VRAM rows
          // 512+, exactly like the single-rectangle path a few lines above.
          sy: 512 + (placed ? placed.sy : 0),
          dx: cx * BOSS_CELL_SIZE,
          dy: cy * BOSS_CELL_SIZE,
        };
      };
      const frameCells: Array<Array<ReturnType<typeof record>>> = [];
      for (let frame = 0; frame < frames; frame++) {
        const cells: Array<ReturnType<typeof record>> = [];
        for (let cy = 0; cy < cellsY; cy++) {
          for (let cx = 0; cx < cellsX; cx++) cells.push(record(frame, cx, cy));
        }
        frameCells.push(cells);
      }
      const emit = (target: number[], cell: ReturnType<typeof record>) => target.push(
        cell.sx & 0xff, (cell.sx >> 8) & 0xff,
        cell.sy & 0xff, (cell.sy >> 8) & 0xff,
        cell.dx & 0xff, cell.dy & 0xff,
      );
      // The stride is baked so the runtime reaches frame N by adding it N times
      // instead of multiplying: frames are capped at 4, so it is a short loop.
      cellBlob.push(frames & 0xff, perFrame & 0xff, stride & 0xff, (stride >> 8) & 0xff);
      for (const cells of frameCells) for (const cell of cells) emit(cellBlob, cell);
      // Per-frame CHANGED cells, against the frame the animation came from --
      // frame 0 follows the last one, because the cycle wraps. This is where the
      // blitter saving lives: repainting a whole frame by cells costs ~12 % MORE
      // than the single blit it replaced (study §5.4), so only skipping the
      // cells that did not change turns the metatile model into a win.
      for (let frame = 0; frame < frames; frame++) {
        const previous = frameCells[(frame + frames - 1) % frames];
        const changed = frameCells[frame].filter((cell, index) => (
          cell.sx !== previous[index].sx || cell.sy !== previous[index].sy
        ));
        cellDeltaBlob.push(changed.length & 0xff);
        for (const cell of changed) emit(cellDeltaBlob, cell);
      }
      if (missing) {
        console.warn(`MSX2 bitmap room "${room.name}": boss ${bodySource.label} is missing ${missing} atlas cell placement(s); those cells render as atlas row 0.`);
      }
    }
    if (Math.floor(stripW / frames) < 16 || stripH < 16 || Math.floor(stripW / frames) > 128 || stripH > 96) {
      console.warn(`MSX2 bitmap room "${room.name}": boss ${bodySource.label} is ${stripW}x${stripH} for ${frames} frame(s); per-frame size must be 16..128 x 16..96. Boss disabled in this room.`);
      return emptyEntry();
    }
    const animDelay = clampInt(params.bossAnimDelay, 1, 255, 12);
    const hp = clampInt(params.bossHp, 1, 255, 8);
    const damage = clampInt(params.bossDamage, 0, 8, 1);
    const bytesPerBlit = (width / 2) * height;
    // Enemy-style cadence: the body moves/redraws only on its own ticks, while
    // the player keeps every ordinary main-loop frame. A >4KB body monopolises
    // the V9938 for several VBlanks even after adjacent cells are coalesced, so
    // cap it at 10 movement/redraw ticks per second (interval >= 6). Medium
    // bodies retain the historical >=3 floor; small bosses keep author control.
    const authoredInterval = clampInt(params.bossInterval, 1, 8, 3);
    const safeBodyInterval = bytesPerBlit > 4096 ? 6 : bytesPerBlit > 2048 ? 3 : 1;
    const interval = Math.max(authoredInterval, safeBodyInterval);
    const atlasX = even(clampInt(bodySource.rect.sx, 0, 4096, 0));
    const atlasY = clampInt(bodySource.rect.sy, 0, 4096, 0);
    const patrol = resolvePatrol(entity);
    // Clamp speed to the 4px restore strips and keep X inside the blit range.
    const clampDelta = (v: number) => Math.max(-2, Math.min(2, Math.floor(Number(v) || 0)));
    const maxXCap = Math.max(0, 256 - width);
    const maxYCap = Math.max(0, 168 - height);
    let minX = even(Math.min(patrol?.minX ?? 0, maxXCap));
    let maxX = even(Math.max(Math.min(patrol?.maxX ?? maxXCap, maxXCap), minX));
    let minY = Math.min(patrol?.minY ?? 0, maxYCap);
    let maxY = Math.max(Math.min(patrol?.maxY ?? maxYCap, maxYCap), minY);
    // A zero-width range means the author never set bounds, not "patrol between
    // 0 and 0": the entity editor always writes explicit minX/maxX = 0, and the
    // shared enemy resolver only applies its own default when the key is
    // ABSENT. Without this the spawn X below is clamped into [0,0] and the boss
    // is drawn against the left wall instead of where it was placed.
    if (maxX <= minX) { minX = 0; maxX = maxXCap; }
    if (maxY <= minY) { minY = 0; maxY = maxYCap; }
    // Movement authored in the Boss Editor. The runtime already bounces on both
    // axes and treats dx=dy=0 as "stand still", so a static turret boss and a
    // vertical or diagonal patrol all fall out of the table with no ASM change.
    // Absent params keep the enemy-resolver behaviour, so old projects are
    // byte-identical.
    const movement = String(params.bossMovement || '').trim().toLowerCase();
    const movesX = movement === 'patrolx' || movement === 'patrolxy';
    const movesY = movement === 'patroly' || movement === 'patrolxy';
    const speed = clampInt(params.bossSpeed, 1, 2, 2);
    const dirSign = Number(params.direction) < 0 ? -1 : 1;
    const dx = movement ? (movesX ? speed * dirSign : 0) : clampDelta(patrol?.dx ?? 2);
    const dy = movement ? (movesY ? speed : 0) : clampDelta(patrol?.dy ?? 0);
    // Travel distance from the spawn cell, in pixels. 0 = patrol the bounds the
    // placed entity already carries (the room-wide default).
    const rangePx = clampInt(params.bossRangePx, 0, 255, 0);
    if (rangePx > 0) {
      if (dx !== 0) {
        minX = even(Math.max(0, Math.min(patrol?.x ?? 0, maxXCap)));
        maxX = even(Math.max(minX, Math.min(minX + rangePx, maxXCap)));
      }
      if (dy !== 0) {
        minY = Math.max(0, Math.min(patrol?.y ?? 0, maxYCap));
        maxY = Math.max(minY, Math.min(minY + rangePx, maxYCap));
      }
    }
    const x0 = even(Math.max(minX, Math.min(patrol?.x ?? minX, maxX)));
    const y0 = Math.max(minY, Math.min(patrol?.y ?? minY, maxY));
    // If the boss has a path, use the position of path node 1 as the initial position.
    // The node position is the CENTER of the boss; convert to top-left corner.
    // Otherwise use x0/y0 from the patrol/placed position.
    let finalX = x0;
    let finalY = y0;
    const pathId = String(params.bossPathId || '').trim();
    if (pathId) {
      const pathAsset = paths.get(pathId);
      if (pathAsset && Array.isArray(pathAsset.path?.nodes) && pathAsset.path.nodes.length > 0) {
        const node1 = pathAsset.path.nodes[0];
        if (Number.isFinite(node1?.x) && Number.isFinite(node1?.y)) {
          // node1.x/y is the center; subtract half-width/height to get top-left
          finalX = even(Math.round(node1.x) - width / 2);
          finalY = Math.round(node1.y) - height / 2;
        }
      }
    }
    const sx = atlasX;
    const sy = 512 + atlasY; // atlas lives at VRAM rows 512+
    enabled = true;
    const stream = buildDefeatStream(params.onDefeated, flagNames, room.name, caps);
    const intro = buildIntroStream(params, room.name, caps);
    // Phase B chain barrier: optional single 16x16 atlas tile sealing the room
    // perimeter while the boss is alive. Same atlas VRAM base (rows 512+).
    const barrier = resolveBarrier(params.bossBarrierTileId, room, even);
    // Phase D projectiles: optional small bitmap bullet the boss fires at the
    // player (HMMM-blitted, no hardware sprites).
    const projectile = resolveProjectile(params, room, even);
    const laser = resolveLaser(params, room, even, bodyStampPlacements);
    // Phase D attack phases: HP thresholds that retune the firing cadence.
    const phases = buildPhaseTable(params.bossPhases, hp, projectile, room.name);
    // Phase E damage zones: weak points / armour, in boss-local pixels.
    const zones = buildDamageZoneTable(params.damageZones ?? params.bossDamageZones, width, height, room.name, indexOfDeathSound);
    // Formal defeat presentation: several transparent bitmap stamps scattered
    // over the frozen body before progress actions run and the room unlocks.
    const deathFx = buildDeathFxTable(params, bodyStampPlacements, width, height, room.name);
    // The weak-point blast borrows the boss's FIRST Death FX stamp: it is already
    // packed in the shared atlas, so the effect costs no VRAM of its own. With no
    // Death FX authored there is nothing to draw, and the blast turns itself off.
    const requestedBlastFrames = bossHitBlastFrames(params);
    // At THIS point the death-FX table still carries its full 6-byte header;
    // stripDeathFxAnimHeader only shortens it later, and only when no room is
    // animated. Reading it as 4 here silently grabbed two header bytes as the
    // stamp's X.
    const hasBlastStamp = (deathFx[0] & 0x7f) > 0 && deathFx.length >= DEATH_FX_HEADER_ANIM + 6;
    const blastRect = hasBlastStamp
      ? deathFx.slice(DEATH_FX_HEADER_ANIM, DEATH_FX_HEADER_ANIM + 6)
      : [0, 0, 0, 0, 0, 0];
    const blastFrames = hasBlastStamp ? requestedBlastFrames : 0;
    if (requestedBlastFrames > 0 && !hasBlastStamp) {
      console.warn(
        `MSX2 bitmap room "${room.name}": this boss asks for a weak-point hit explosion but has no Death FX `
        + 'stamp to borrow, so nothing would be drawn and the blast was disabled. Pick at least one stamp in '
        + 'the Boss Editor (Death FX).',
      );
    }
    const deathSoundIndex = indexOfDeathSound(params.bossDeathExplosionSoundAssetId, room.name);
    // Fase G: which path this boss walks, by default and per attack phase.
    const pathSel = buildPathSelTable(params, hp, indexOfPath);
    // Every route this boss can end up on, checked from its spawn cell. A path
    // is a relative shape, so a phase route actually starts wherever the boss
    // happens to be — this catches the obvious mistakes, not every one.
    if (pathSel.length) {
      const referenced = new Set<number>();
      if (pathSel[0]) referenced.add(pathSel[0]);
      for (let i = 3; i < pathSel.length; i += 2) {
        if (pathSel[i] && pathSel[i] !== PATH_SEL_INHERIT) referenced.add(pathSel[i]);
      }
      for (const index of referenced) {
        const baked = pathStreams[index - 1];
        if (baked) warnIfPathLeavesRoom(baked, x0, y0, width, height, room.name);
      }
    }
    return {
      table: [
        1,
        finalX & 0xff, finalY & 0xff,
        dx & 0xff, dy & 0xff,
        minX & 0xff, maxX & 0xff, minY & 0xff, maxY & 0xff,
        sx & 0xff, (sx >> 8) & 0xff,
        sy & 0xff, (sy >> 8) & 0xff,
        width & 0xff, height & 0xff,
        frames & 0xff, animDelay & 0xff,
        hp & 0xff, damage & 0xff, interval & 0xff,
        // Weak-point blast: hold frames (0 = off) plus the Death FX stamp it
        // borrows, copied here so the runtime needs no death-table header maths.
        blastFrames & 0xff,
        blastRect[0] & 0xff, blastRect[1] & 0xff,   // sx word
        blastRect[2] & 0xff, blastRect[3] & 0xff,   // sy word
        blastRect[4] & 0xff, blastRect[5] & 0xff,   // w, h
        ...laser,
      ],
      laser,
      stream,
      intro,
      // Where the player is walked to on entry. Empty / non-numeric means the
      // boss never authored one, which is the screen centre every boss used
      // before the field existed -- NOT column 0.
      introEntryX: params.bossIntroEntryX === '' || params.bossIntroEntryX === null
        ? INTRO_ENTRY_X_CENTRE
        : clampInt(params.bossIntroEntryX, 0, 255, INTRO_ENTRY_X_CENTRE),
      barrier,
      projectile,
      phases,
      zones,
      pathSel,
      deathFx,
      deathSoundIndex,
      cells: cellBlob.length ? cellBlob : [0, 0],
      cellsDelta: cellDeltaBlob.length ? cellDeltaBlob : [0],
    };
  }
  const perRoomPrimary = perRoom.map(room => room.entries[0]);
  return {
    enabled,
    roomTables: perRoom.map(room => room.entries.flatMap(entry => entry.table)),
    defeatStreams: perRoom.flatMap(room => room.entries.map(entry => entry.stream)),
    // Legacy shape: introStreams: perRoom.map(entry => entry.intro)
    introStreams: perRoomPrimary.map(entry => entry.intro),
    // Room Lock remains a single shared player gate. Boss slot 0 owns it.
    introEntryX: perRoomPrimary.map(entry => entry.introEntryX),
    flagNames,
    barrierTables: perRoomPrimary.map(entry => entry.barrier),
    projectileTables: perRoom.flatMap(room => room.entries.map(entry => entry.projectile)),
    phaseTables: perRoom.flatMap(room => room.entries.map(entry => entry.phases)),
    damageZoneTables: perRoom.flatMap(room => room.entries.map(entry => entry.zones)),
    pathStreams,
    pathModes,
    pathSelTables: perRoom.flatMap(room => room.entries.map(entry => entry.pathSel)),
    shootRecords,
    // Legacy one-boss builds used: stripDeathFxAnimHeader(perRoom.map(entry => entry.deathFx)).
    // The runtime now receives two flat entries so each live boss can own FX.
    deathFxTables: stripDeathFxAnimHeader(perRoom.flatMap(room => room.entries.map(entry => entry.deathFx))),
    deathSoundIndexes: perRoom.flatMap(room => room.entries.map(entry => entry.deathSoundIndex)),
    cellTables: perRoom.flatMap(room => room.entries.map(entry => entry.cells)),
    cellDeltaTables: perRoom.flatMap(room => room.entries.map(entry => entry.cellsDelta)),
    deathSoundStreams,
    laserTables: perRoom.flatMap(room => room.entries.map(entry => entry.laser)),
  };
}

/**
 * Walks a baked stream from the boss's spawn cell to check it stays on screen.
 * The path is a relative shape, so it can only be validated once we know where
 * the boss that uses it starts.
 */
function warnIfPathLeavesRoom(
  stream: number[],
  x0: number,
  y0: number,
  width: number,
  height: number,
  roomName: string,
): void {
  let x = x0;
  let y = y0;
  let worst = '';
  for (let i = 0; i < stream.length; i++) {
    const byte = stream[i];
    if (byte === PATH_OP_END) break;
    if (byte >= 0xf0) {
      i += PATH_OP_ARG_BYTES;   // every opcode carries exactly one argument
      continue;
    }
    x += ((byte >> 4) & 0x0f) - 8;
    y += (byte & 0x0f) - 8;
    if (x < 0 || y < 0 || x + width > 256 || y + height > 168) worst = `${x},${y}`;
  }
  if (worst) {
    console.warn(`MSX2 bitmap room "${roomName}": the boss path leaves the screen (reaches ${worst} for a ${width}x${height} body). Move the nodes or the boss spawn.`);
  }
}

/**
 * Compile `bossPhases` into the runtime table [count, (hpAtOrBelow, interval,
 * projSpeed) * count]. Authoring uses `enterWhenHpBelowPercent` (design doc
 * §6); it is converted to an absolute HP threshold against the boss's own HP so
 * the runtime only needs a byte compare. Entries are sorted most-damaged-first
 * so the first match wins.
 *
 * NOTE: phases deliberately do NOT retune movement speed. The body's trail
 * cleanup restores 4px strips, which caps patrol speed at 2px/frame, so there
 * is no useful range there — the interesting knob is the attack.
 */
function buildPhaseTable(bossPhases: unknown, hp: number, projectile: number[], roomName: string): number[] {
  if (!Array.isArray(bossPhases) || !bossPhases.length) return [0];
  const baseInterval = projectile[7] || 90;
  const baseSpeed = projectile[8] || 2;
  const entries: Array<{ threshold: number; interval: number; speed: number }> = [];
  for (const raw of bossPhases) {
    if (!raw || typeof raw !== 'object') continue;
    const phase = raw as any;
    const percent = clampInt(phase.enterWhenHpBelowPercent, 1, 100, 100);
    // Absolute HP at or below which this phase is active.
    const threshold = Math.max(1, Math.min(255, Math.ceil((hp * percent) / 100)));
    entries.push({
      threshold,
      interval: clampInt(phase.interval ?? phase.attack?.interval, 10, 255, baseInterval),
      speed: clampInt(phase.projectileSpeed ?? phase.attack?.projectileSpeed, 1, 4, baseSpeed),
    });
  }
  if (!entries.length) return [0];
  if (entries.length > 8) {
    console.warn(`MSX2 bitmap room "${roomName}": boss has ${entries.length} phases; only the first 8 are kept.`);
    entries.length = 8;
  }
  entries.sort((a, b) => a.threshold - b.threshold); // most damaged first
  return [entries.length, ...entries.flatMap(e => [e.threshold & 0xff, e.interval & 0xff, e.speed & 0xff])];
}

/** `#FF` in a phase slot means "keep whatever the boss's default path is". */
const PATH_SEL_INHERIT = 0xff;

/**
 * Compile the per-room path selection table:
 * `[defaultPathIdx, phaseCount, (hpAtOrBelow, pathIdx) * phaseCount]`.
 *
 * The HP thresholds are duplicated from the phase table on purpose: the runtime
 * then resolves "which path should I be walking" from a single table walk, with
 * no second pointer to keep in step. `pathIdx` is 1-based (0 = stand still,
 * #FF = inherit the default).
 */
function buildPathSelTable(params: any, hp: number, indexOfPath: (id: unknown) => number): number[] {
  const defaultIdx = indexOfPath(params.bossPathId);
  const rows: Array<{ threshold: number; path: number }> = [];
  for (const raw of Array.isArray(params.bossPhases) ? params.bossPhases : []) {
    if (!raw || typeof raw !== 'object') continue;
    const phase = raw as any;
    const percent = clampInt(phase.enterWhenHpBelowPercent, 1, 100, 100);
    const threshold = Math.max(1, Math.min(255, Math.ceil((hp * percent) / 100)));
    const spelled = String(phase.pathId ?? '').trim();
    const path = spelled === ''
      ? PATH_SEL_INHERIT
      : spelled.toLowerCase() === 'none' ? 0 : indexOfPath(spelled);
    rows.push({ threshold, path });
  }
  if (rows.length > 8) rows.length = 8;
  rows.sort((a, b) => a.threshold - b.threshold);   // same order as the phase table
  const perPhase = rows.some(row => row.path !== PATH_SEL_INHERIT) ? rows : [];
  if (!defaultIdx && !perPhase.length) return [];   // this boss uses no path at all
  return [defaultIdx, perPhase.length, ...perPhase.flatMap(row => [row.threshold & 0xff, row.path & 0xff])];
}

/**
 * A reusable boss template (Phase C). Authored once in the boss library and
 * referenced from any number of screens, so the same creature can appear in
 * several rooms without duplicating its graphics, phases or weak points.
 */
export interface BossDefinitionAsset {
  id: string;
  name?: string;
  /** Same shape as the inline boss params on a placed entity. */
  params: Record<string, unknown>;
}

/**
 * Merge a placed boss (the BossEncounter) with the BossDefinition it points at.
 * The definition OWNS the boss itself -- body, HP, speed, phases, damage zones,
 * death FX -- so editing it in the Boss Editor reaches every room at once.
 * The encounter only decides what is per-instance: `hpOverride`, the starting
 * phase, the reward, the locked doors... (design doc §4.2, and the key list in
 * BOSS_DEFINITION_OWNED_PARAMS).
 * A boss with no `bossId` keeps working exactly as before (inline authoring):
 * with no definition to merge, its own params are the whole truth.
 */
export function resolveBossParams(entity: any, definitions: Map<string, BossDefinitionAsset>): any {
  const own = entity?.params || {};
  const refId = String(own.bossId || own.bossDefinitionId || own.bossAssetId || '').trim();
  if (!refId) return own;
  const definition = definitions.get(refId);
  if (!definition) {
    console.warn(`MSX2 bitmap boss: definition "${refId}" not found; using the encounter's own settings.`);
    return own;
  }
  const merged: Record<string, unknown> = { ...definition.params };
  for (const [key, value] of Object.entries(own)) {
    // Definition-owned fields are ignored even when the encounter carries a
    // value, because that value is a SNAPSHOT taken when the boss was placed,
    // not an authored override -- nothing in the UI writes them per encounter.
    // Honouring it froze the boss on the settings it had that day, so raising
    // HP or speed in the Boss Editor never reached an already-placed boss.
    if (BOSS_DEFINITION_OWNED_PARAMS.has(key)) continue;
    // Only a real override replaces the template: empty strings and empty
    // arrays on the encounter mean "keep what the definition says".
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    merged[key] = value;
  }
  // hpOverride is the documented per-encounter spelling (design doc §4.2).
  if (own.hpOverride !== undefined && own.hpOverride !== null && own.hpOverride !== '') {
    merged.bossHp = own.hpOverride;
  }
  return merged;
}

/**
 * Compile `damageZones` into [count, (x, y, w, h, kind, multiplier) * count].
 * Coordinates are boss-local pixels and are clamped to the body rectangle.
 * kind: 'invulnerable' -> 0 (armour: the bullet dies, no damage),
 * anything else ('weak_point') -> 1, with `damageMultiplier` hits per bullet.
 *
 * Zones are ordered as authored, so put weak points BEFORE the armour plate
 * that contains them — the first matching zone wins.
 *
 * As soon as ONE zone exists the body stops being a target by itself: bullets
 * that miss every zone fly through the boss. A boss with no zones at all keeps
 * the old "whole body takes 1 damage" behaviour.
 */
function buildDamageZoneTable(
  zones: unknown,
  width: number,
  height: number,
  roomName: string,
  indexOfSound: (rawId: unknown, roomName: string) => number,
): number[] {
  if (!Array.isArray(zones) || !zones.length) return [0];
  const rows: number[][] = [];
  for (const raw of zones) {
    if (!raw || typeof raw !== 'object') continue;
    const zone = raw as any;
    const x = clampInt(zone.x, 0, Math.max(0, width - 1), 0);
    const y = clampInt(zone.y, 0, Math.max(0, height - 1), 0);
    const w = clampInt(zone.w, 1, width - x, Math.max(1, width - x));
    const h = clampInt(zone.h, 1, height - y, Math.max(1, height - y));
    const kind = String(zone.type || zone.kind || 'weak_point').trim() === 'invulnerable' ? 0 : 1;
    const multiplier = clampInt(zone.damageMultiplier, 1, 16, 1);
    // Zone hit sounds share the boss sound pool with the death explosion, so a
    // zone reusing that asset costs no extra ROM. -1 (absent / unplayable) is
    // stored as 0 = silent: unlike the death FX there is no built-in fallback,
    // because a zone with no sound authored must stay quiet.
    const soundIndex = Math.max(0, indexOfSound(zone.hitSoundAssetId, roomName));
    rows.push([x, y, w, h, kind, multiplier, soundIndex]);
    if (rows[rows.length - 1].length !== BOSS_ZONE_RECORD_BYTES) {
      throw new Error(`MSX2 bitmap boss: damage-zone record must be ${BOSS_ZONE_RECORD_BYTES} bytes to match the Z80 scanner stride.`);
    }
  }
  if (!rows.length) return [0];
  if (rows.length > 8) {
    console.warn(`MSX2 bitmap room "${roomName}": boss has ${rows.length} damage zones; only the first 8 are kept.`);
    rows.length = 8;
  }
  return [rows.length, ...rows.flat().map(v => v & 0xff)];
}

/**
 * Resolve a boss `bossBarrierTileId` to the chain-barrier table bytes
 * [present, sxLo, sxHi, syLo, syHi]. Returns an all-zero (absent) table when
 * no tile is configured or the atlas entry is missing / not 16x16.
 */
function resolveBarrier(tileId: unknown, room: { name: string; atlas?: { entries?: any[] } }, even: (v: number) => number): number[] {
  const id = String(tileId || '').trim();
  if (!id) return [0, 0, 0, 0, 0];
  const entry = (room.atlas?.entries || []).find((candidate: any) => String(candidate?.id) === id);
  if (!entry) {
    // Name the gameplay consequence, not just the internal state: the Room Lock
    // still runs (the player is frozen and walks in) but its closeBarrier step
    // becomes a no-op, so the room never seals and it reads as a dead trigger.
    console.warn(
      `MSX2 bitmap room "${room.name}": boss barrier tile "${id}" is not in this room's atlas, `
      + 'so the chain barrier is disabled and any Room Lock "closeBarrier" step will do nothing '
      + '(the room will NOT close). Pick a barrier tile that exists in this room.',
    );
    return [0, 0, 0, 0, 0];
  }
  const w = Math.floor(Number(entry.w) || 0);
  const h = Math.floor(Number(entry.h) || 0);
  if (w < 16 || h < 16) {
    console.warn(`MSX2 bitmap room "${room.name}": boss barrier tile "${id}" is ${w}x${h}; must be at least 16x16. Chain barrier disabled.`);
    return [0, 0, 0, 0, 0];
  }
  const bsx = even(clampInt(entry.sx, 0, 4096, 0));
  const bsy = 512 + clampInt(entry.sy, 0, 4096, 0); // atlas lives at VRAM rows 512+
  return [1, bsx & 0xff, (bsx >> 8) & 0xff, bsy & 0xff, (bsy >> 8) & 0xff];
}

/**
 * Resolve the boss barrier palette asset to an index (if available in the room).
 * Returns 0 if no palette is specified or not found.
 */
function resolveBarrierPaletteIndex(paletteAssetId: unknown, room: { palette?: any[] }, allAssets: any[]): number {
  const id = String(paletteAssetId || '').trim();
  if (!id) return 0;

  // Try to find the palette asset in allAssets
  const paletteAsset = allAssets.find((a: any) => a.type === 'msx2palette' && String(a.id) === id);
  if (!paletteAsset) {
    console.warn(`MSX2 Boss: barrier palette asset "${id}" not found; using default palette.`);
    return 0;
  }

  // Could extend to store palette data, but for now just return a marker
  return 1; // 1 = use custom palette asset
}

/**
 * Resolve the boss barrier dialogue asset to a reference.
 * Returns 0 if no dialogue is specified or not found.
 */
function resolveBarrierDialogueRef(dialogueAssetId: unknown, allAssets: any[]): number {
  const id = String(dialogueAssetId || '').trim();
  if (!id) return 0;

  const dialogueAsset = allAssets.find((a: any) => a.type === 'msx2dialogue' && String(a.id) === id);
  if (!dialogueAsset) {
    console.warn(`MSX2 Boss: barrier dialogue asset "${id}" not found; no intro dialogue.`);
    return 0;
  }

  // Return 1 as marker that dialogue is present (actual dialogue ID resolution happens at runtime)
  return 1;
}

/**
 * Build complete Room Lock data including barrier tile, palette, animation, and dialogue.
 * Returns array: [sx_lo, sx_hi, sy_lo, sy_hi, palette_idx, flags, dialogue_marker, reserved]
 * Flags byte: bit 0 = animated, bit 1 = palette, bit 2 = dialogue
 */
function buildRoomLockData(params: any, room: any, allAssets: any[], even: (v: number) => number): number[] {
  const barrier = resolveBarrier(params.bossBarrierTileId, room, even);

  // If no barrier, return empty data
  if (barrier[0] === 0) {
    return new Array(8).fill(0);
  }

  const paletteIdx = resolveBarrierPaletteIndex(params.bossBarrierPaletteAssetId, room, allAssets);
  const dialogueRef = resolveBarrierDialogueRef(params.bossBarrierDialogueAssetId, allAssets);

  // Build flags: bit 0 = animate, bit 1 = has palette, bit 2 = has dialogue
  const flags =
    (params.bossBarrierAnimated ? 0x01 : 0x00) |
    (paletteIdx ? 0x02 : 0x00) |
    (dialogueRef ? 0x04 : 0x00);

  return [
    barrier[1],        // sx_lo
    barrier[2],        // sx_hi
    barrier[3],        // sy_lo
    barrier[4],        // sy_hi
    paletteIdx & 0xff, // palette index
    flags,             // animation + palette + dialogue flags
    dialogueRef ? 1 : 0, // dialogue present marker
    0,                 // reserved
  ];
}

/**
 * Resolve the boss projectile config to the table bytes
 * [present, sxLo, sxHi, syLo, syHi, w, h, interval, speed, damage]. Absent
 * (all-zero) when no `bossProjectileTileId` is set or the atlas entry is
 * missing / larger than 16x16 (projectiles must stay small for the blit budget).
 */
function resolveProjectile(params: any, room: { name: string; atlas?: { entries?: any[] } }, even: (v: number) => number): number[] {
  const empty = new Array(BITMAP_BOSS_PROJECTILE_STRIDE).fill(0);
  const interval = clampInt(params.bossShootInterval, 20, 255, 90);
  const speed = clampInt(params.bossProjectileSpeed, 1, 4, 2);
  const damage = clampInt(params.bossProjectileDamage, 0, 8, 1);
  // Ceiling debris is a launch PATTERN, not a back-end: it always blits, so it
  // overrides bossProjectileKind rather than being a third value of it.
  const fallingRocks = String(params.bossProjectilePattern || 'aimed').trim() === 'fallingRocks';
  // Default to hardware sprites: they never erase the background and several
  // can fly at once. 'bitmap' stays available for slow multicolour bombs and
  // homing rockets, where the blit cost is irrelevant.
  const wantsBitmap = fallingRocks
    || String(params.bossProjectileKind || 'sprite').trim() === 'bitmap';
  const id = String(params.bossProjectileTileId || '').trim();

  if (!wantsBitmap) {
    // Hardware sprite: the 16x16 pattern is generated (8x8 blob centred), so no
    // atlas tile is needed. Shooting is opt-in via bossShootInterval/kind.
    if (!id && params.bossShootInterval === undefined && params.bossProjectileKind === undefined) return empty;
    return [1, 0, 0, 0, 0, 16, 16, interval & 0xff, speed & 0xff, damage & 0xff, 1];
  }

  if (!id) {
    // Silence here is what made "kind: bitmap with no tile" look like a broken
    // boss: it just stopped shooting with nothing in the build log.
    if (fallingRocks) {
      console.warn(`MSX2 bitmap room "${room.name}": falling-rock projectiles need an atlas tile (bossProjectileTileId); no rocks will fall.`);
    }
    return empty;
  }
  const entry = (room.atlas?.entries || []).find((candidate: any) => String(candidate?.id) === id);
  if (!entry) {
    console.warn(`MSX2 bitmap room "${room.name}": boss projectile tile "${id}" not found; projectiles disabled.`);
    return empty;
  }
  const w = even(clampInt(entry.w, 8, 16, 8));
  const h = clampInt(entry.h, 8, 16, 8);
  if (Number(entry.w) > 16 || Number(entry.h) > 16 || Number(entry.w) < 8 || Number(entry.h) < 8) {
    console.warn(`MSX2 bitmap room "${room.name}": boss projectile tile "${id}" is ${entry.w}x${entry.h}; must be 8..16 square-ish. Projectiles disabled.`);
    return empty;
  }
  const psx = even(clampInt(entry.sx, 0, 4096, 0));
  const psy = 512 + clampInt(entry.sy, 0, 4096, 0);
  if (!fallingRocks) {
    return [1, psx & 0xff, (psx >> 8) & 0xff, psy & 0xff, (psy >> 8) & 0xff, w & 0xff, h & 0xff, interval & 0xff, speed & 0xff, damage & 0xff, 0];
  }
  // The shoot runtime only ticks on the body's OFF-frames (see
  // bitmap_boss_off_frame), so a cooldown byte is NOT a count of 60Hz frames:
  // with the default cadence of 3 it runs at 40Hz and a naive 180 would give
  // 4.5 real seconds. Convert here so the authored number means what it says.
  const bodyInterval = clampInt(params.bossInterval, 1, 16, 3);
  const offFrames = Math.max(1, bodyInterval - 1);
  const ticks = clampInt(Math.round((interval * offFrames) / bodyInterval), 1, 255, 120);
  if (bodyInterval <= 1) {
    console.warn(`MSX2 bitmap room "${room.name}": bossInterval 1 leaves no off-frames, so falling rocks can never update. Use 2 or more.`);
  }
  return [1, psx & 0xff, (psx >> 8) & 0xff, psy & 0xff, (psy >> 8) & 0xff, w & 0xff, h & 0xff, ticks & 0xff, speed & 0xff, damage & 0xff, 2];
}

/**
 * Resolve the compact growing-laser config used by the two-boss encounter.
 * The bitmap source is an ordinary 16x16 atlas tile. The runtime repeats that
 * tile in 16px cells, so no extra VRAM is reserved for a stretched projectile.
 */
function resolveLaser(
  params: any,
  room: { name: string; atlas?: { entries?: any[] } },
  even: (v: number) => number,
  bodyStampPlacements: Map<string, { sx: number; sy: number; w: number; h: number }>,
): number[] {
  const empty = new Array(BITMAP_BOSS_LASER_STRIDE).fill(0);
  const requestedId = String(params?.bossLaserTileId || params?.bossProjectileTileId || '').trim();
  let entry = requestedId
    ? (room.atlas?.entries || []).find((candidate: any) => String(candidate?.id) === requestedId)
    : undefined;
  let source = entry && Number(entry.w) === 16 && Number(entry.h) === 16
    ? { sx: even(clampInt(entry.sx, 0, 4096, 0)), sy: clampInt(entry.sy, 0, 4096, 0) }
    : undefined;
  // A 16x16 boss may use its own body as a valid fallback laser tile. This is
  // useful for tiny bitmap bosses authored without a separate projectile tile.
  if (!source && !requestedId) {
    const stampId = String(params?.bossStampAssetId || '').trim();
    const stamp = stampId
      ? (bodyStampPlacements.get(stampId) || bodyStampPlacements.get(bossBodyCellKey(stampId, 0)))
      : undefined;
    if (stamp && stamp.w === 16 && stamp.h === 16) source = { sx: even(stamp.sx), sy: stamp.sy };
    if (!source) {
      const atlasId = String(params?.bossAtlasEntryId || '').trim();
      entry = atlasId
        ? (room.atlas?.entries || []).find((candidate: any) => String(candidate?.id) === atlasId)
        : undefined;
      if (entry && Number(entry.w) === 16 && Number(entry.h) === 16) {
        source = { sx: even(clampInt(entry.sx, 0, 4096, 0)), sy: clampInt(entry.sy, 0, 4096, 0) };
      }
    }
  }
  if (!source) {
    if (requestedId) {
      console.warn(`MSX2 bitmap room "${room.name}": boss laser tile "${requestedId}" is missing or not 16x16; lasers disabled for this boss.`);
    }
    return empty;
  }
  const interval = clampInt(params?.bossLaserInterval ?? params?.bossShootInterval, 1, 255, 90);
  const maxLengthPx = clampInt(params?.bossLaserMaxLengthPx, 16, 240, 128);
  const maxSegments = Math.max(1, Math.min(15, Math.floor(maxLengthPx / 16)));
  // Bit order is N, E, S, W. The raw JSON field is intentionally usable before
  // the editor grows a dedicated control; omitting it keeps the four-way
  // encounter used by the fixture and old hand-authored projects.
  const mask = clampInt(params?.bossLaserDirectionMask, 0, 0x0f, 0x0f);
  return [
    1,
    source.sx & 0xff, (source.sx >> 8) & 0xff,
    (512 + source.sy) & 0xff, ((512 + source.sy) >> 8) & 0xff,
    interval & 0xff,
    maxSegments & 0xff,
    mask,
  ];
}

/**
 * Compile the bitmap stamps used by the boss death presentation. The shared
 * atlas already owns their pixels, so each record only needs the VDP source
 * rectangle. Runtime destination coordinates are chosen inside the live body.
 *
 * The table always carries the 6-byte animated header here; when NO room in the
 * project authored an animated explosion, `stripDeathFxAnimHeader` trims it back
 * to the original 4 bytes so those ROMs stay byte-identical.
 */
function buildDeathFxTable(
  params: any,
  placements: Map<string, { sx: number; sy: number; w: number; h: number }>,
  bossWidth: number,
  bossHeight: number,
  roomName: string,
): number[] {
  const animatedRequested = params?.bossDeathExplosionAnimated === true;
  const rawIds = Array.isArray(params?.bossDeathExplosionStampIds)
    ? params.bossDeathExplosionStampIds
    : [];
  // Animated mode plays the list in order as the frames of ONE explosion, so it
  // is capped at the 3 frames the UI offers; random-variant mode keeps 8.
  const authoredIds: string[] = Array.from(new Set<string>(
    rawIds.map((value: unknown) => String(value || '').trim()).filter(Boolean),
  )).slice(0, animatedRequested ? MAX_DEATH_ANIM_FRAMES : 8);
  const frameSequence = animatedRequested && authoredIds.length > 0;
  // Ordered compact mode is the default: it cycles the authored frames while
  // scattering them, and needs almost no resident code. The original three
  // simultaneously-live animations remain an explicit large-ROM option.
  const animated = frameSequence && params?.bossDeathExplosionConcurrent === true;
  const compactAnimated = frameSequence && !animated;
  // Turning the animated presentation on is enough to get a visible result.
  // Custom stamps replace these built-in bitmap frames when the author picks
  // them.  This also keeps older/incomplete projects from silently compiling
  // an immediate death after they saved only the animated flag.
  const ids = animatedRequested && authoredIds.length === 0
    ? [...BITMAP_BOSS_DEFAULT_DEATH_FRAME_IDS]
    : authoredIds;
  if (ids.length === 0) return [0, 0, 0, 0, 0, 0];

  const records: number[][] = [];
  for (const id of ids) {
    const rect = placements.get(id);
    if (!rect) {
      console.warn(`MSX2 bitmap room "${roomName}": boss death explosion stamp "${id}" was not found; skipped.`);
      continue;
    }
    const width = Math.floor(Number(rect.w) || 0);
    const height = Math.floor(Number(rect.h) || 0);
    if (width < 1 || height < 1 || width > 64 || height > 64 || width > bossWidth || height > bossHeight) {
      console.warn(
        `MSX2 bitmap room "${roomName}": boss death explosion stamp "${id}" is ${width}x${height}; `
        + `it must fit inside the ${bossWidth}x${bossHeight} body and be at most 64x64. Skipped.`,
      );
      continue;
    }
    // Every animation frame is erased by repainting the body rectangle it
    // covers, and that rectangle is the frame's own size: frames of different
    // sizes would leave the bigger one's edges on the body. Authoring them on a
    // single canvas size is also how the stamp editor already works.
    // The erase is an opaque HMMM, which the V9938 resolves in byte units: an
    // odd-width frame would leave a one-pixel column of the last frame behind.
    if (frameSequence && (width & 1) === 1) {
      console.warn(
        `MSX2 bitmap room "${roomName}": animated boss death frame "${id}" is ${width} pixels wide; `
        + 'an animated explosion needs an even width so it can be erased cleanly. Skipped.',
      );
      continue;
    }
    if (frameSequence && records.length > 0 && (width !== records[0][4] || height !== records[0][5])) {
      console.warn(
        `MSX2 bitmap room "${roomName}": animated boss death frame "${id}" is ${width}x${height} but the first frame is `
        + `${records[0][4]}x${records[0][5]}; every frame of one explosion must share its size. Skipped.`,
      );
      continue;
    }
    const sx = clampInt(rect.sx, 0, 4095, 0);
    const sy = 512 + clampInt(rect.sy, 0, 4095, 0);
    records.push([
      sx & 0xff, (sx >> 8) & 0xff,
      sy & 0xff, (sy >> 8) & 0xff,
      width & 0xff, height & 0xff,
    ]);
  }
  if (records.length === 0) return [0, 0, 0, 0, 0, 0];
  const blastCount = clampInt(params?.bossDeathExplosionCount, 1, 32, 8);
  const frameDelay = clampInt(params?.bossDeathExplosionFrameDelay, 1, 30, 4);
  const emittedRecords = compactAnimated ? [...records].reverse() : records;
  // Compact cycles reserve selector 0 as an implicit opaque body rebuild. No
  // extra 6-byte record is emitted: selectors N..1 address the N reversed
  // authored frames and selector 0 calls bitmap_boss_draw. This clears every
  // previous blast, including the final one before the authored hold.
  const compactCycleSlots = records.length + 1;
  return [
    compactAnimated ? (0x80 | compactCycleSlots) : records.length,
    compactAnimated ? Math.min(255, blastCount * compactCycleSlots) : blastCount,
    compactAnimated ? frameDelay : clampInt(params?.bossDeathExplosionInterval, 1, 60, 6),
    clampInt(params?.bossDeathExplosionHoldFrames, 1, 255, 12),
    frameDelay,
    animated ? 1 : 0,
    ...emittedRecords.flat(),
  ];
}

/** Frames of a single animated explosion, matching the Boss Editor's picker. */
const MAX_DEATH_ANIM_FRAMES = 3;
/** Reserved shared-atlas entries used when animated death has no custom art. */
export const BITMAP_BOSS_DEFAULT_DEATH_FRAME_IDS = [
  '__mideas_builtin_boss_death_0',
  '__mideas_builtin_boss_death_1',
  '__mideas_builtin_boss_death_2',
] as const;
/** Header bytes of a death-FX table with / without the animated fields. */
const DEATH_FX_HEADER_ANIM = 6;
const DEATH_FX_HEADER_LEGACY = 4;

/**
 * Drop the animated header fields when no room uses them. Projects that only
 * ever authored the original random-variant cloud keep the exact table bytes and
 * the exact runtime they had before animated explosions existed.
 */
function stripDeathFxAnimHeader(tables: number[][]): number[][] {
  const anyAnimated = tables.some(table => table && table.length > 5 && table[5] === 1);
  if (anyAnimated) {
    // Rooms without a boss carry a bare [0,0,0,0]; pad them so every table in an
    // animated build shares the same header length.
    return tables.map(table => {
      const row = table || [];
      if (row.length >= DEATH_FX_HEADER_ANIM) return row;
      return [...row, ...new Array(DEATH_FX_HEADER_ANIM - row.length).fill(0)];
    });
  }
  return tables.map(table => {
    if (!table || table.length < DEATH_FX_HEADER_ANIM) return table;
    return [...table.slice(0, DEATH_FX_HEADER_LEGACY), ...table.slice(DEATH_FX_HEADER_ANIM)];
  });
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = Math.floor(Number(value));
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

export function buildBitmapBossSystemAsm(
  data: BitmapBossRoomData,
  opts: BitmapBossRuntimeOptions,
): BitmapBossSystemAsm {
  if (!data.enabled) {
    return {
      enabled: false, ramBytes: 0, equates: '', initAsm: '', loadCallAsm: '', updateCallAsm: '', playerGateAsm: '', autoMoveInputAsm: '',
      bulletHookLabel: '', satCallAsm: '', routinesAsm: '', dataAsm: '', bankedBlocks: [],
    };
  }
  const roomCount = data.roomTables.length;
  const bossInstanceCount = BITMAP_BOSS_MAX_INSTANCES;
  const roomTableBytes = BITMAP_BOSS_TABLE_STRIDE * bossInstanceCount;
  const roomPoolCount = Math.max(1, Math.min(roomCount, Math.floor(Number(opts.roomPoolCount) || roomCount)));
  const roomPoolIndexLoad = opts.roomPoolIndexLabel
    ? `ld a, (${opts.roomPoolIndexLabel})`
    : 'ld a, (current_screen_index)';
  const ram = opts.ramBase;
  const gameY = opts.gameYOffset & 0xff;
  const gameH = Math.max(1, Math.min(256, Math.floor(Number(opts.gameHeight) || 192)));
  const bankedRoomData = opts.bankedRoomData === true;
  // The room engine double-buffers: `bitmap_displayed_page` is the page the room
  // was just composed on, and the other page still holds the PREVIOUS room. Every
  // boss blit must therefore pick its page at runtime instead of assuming
  // "page 0 visible, page 1 clean" (that only held on the boot room).
  const visiblePageH = `    ld a, (bitmap_displayed_page)
    ld h, a                    ; H = visible page`;
  const cleanPageH = `    ld a, (bitmap_displayed_page)
    xor 1
    ld h, a                    ; H = the other (clean) page`;
  // Boss Defeat Actions (Phase A): only emitted when at least one setFlag is
  // authored, so bosses without onDefeated keep byte-identical ROMs.
  const flagCount = data.flagNames.length;
  // Which opcodes actually appear in any room's stream: only emit the handlers
  // (and the cross-system RAM references) that are really used.
  // Opcodes have different argument counts, so the walk must step by the real
  // size or it starts reading arguments as opcodes.
  const streamHas = (op: number) => (data.defeatStreams || []).some(stream => {
    for (let i = 0; i < stream.length;) {
      const current = stream[i];
      if (current === DEFEAT_OP_END) break;
      if (current === op) return true;
      i += 1 + (DEFEAT_OP_ARGS[current] ?? 1);
    }
    return false;
  });
  // Phase E: only emit the zone machinery when a boss actually authored zones.
  const hasZones = (data.damageZoneTables || []).some(t => t && t[0] > 0);
  // Weak-point hit blast: only emitted when a boss actually asked for it, so a
  // project without it keeps a byte-identical ROM. The compiler already cleared
  // the byte for a boss with no Death FX stamp to borrow.
  const hasHitBlast = (data.roomTables || []).some(t =>
    t && Array.from({ length: bossInstanceCount }, (_v, slot) => slot * BITMAP_BOSS_TABLE_STRIDE)
      .some(offset => t[offset] === 1 && t[offset + 20] > 0),
  );
  // Per-zone hit sounds. Independent of the death explosion: a boss may have
  // zone sounds and no death sound, or the other way round.
  const hasZoneSfx = (data.damageZoneTables || []).some(table => {
    if (!table || !table[0]) return false;
    for (let i = 0; i < table[0]; i++) {
      if ((table[1 + i * BOSS_ZONE_RECORD_BYTES + 6] || 0) > 0) return true;
    }
    return false;
  });
  const hasGiveKey = streamHas(DEFEAT_OP_GIVE_KEY);
  const hasOpenDoor = streamHas(DEFEAT_OP_OPEN_DOOR);
  const hasShowMessage = streamHas(DEFEAT_OP_SHOW_MESSAGE);
  const hasChangeScreen = streamHas(DEFEAT_OP_CHANGE_SCREEN);
  const hasDefeatActions = flagCount > 0 || hasGiveKey || hasOpenDoor || hasShowMessage || hasChangeScreen;
  const defeatedBytes = roomPoolCount * bossInstanceCount;
  const flagsBase = ram + 28 + defeatedBytes;
  // Phase B chain barrier: only emitted when at least one room configures a
  // bossBarrierTileId, so bosses without a chain keep byte-identical ROMs.
  const hasBarrier = (data.barrierTables || []).some(t => t && t[0] === 1);
  // The persistent defeat pool has one byte per room *and* per boss slot.
  // Using roomPoolCount here leaves the second slot's flag overlapping the
  // first path pointer in every two-boss room; the path loader then writes a
  // non-zero value into boss_defeated[1] and silently suppresses Boss Beta.
  const barrierRamBase = ram + 28 + defeatedBytes + flagCount;
  const introStreams = data.introStreams || [];
  const introStreamIsEmpty = (stream: number[] | undefined) =>
    !stream || stream.length === 0 || (stream.length === 1 && stream[0] === INTRO_OP_END);
  // Every live boss now owns an implicit first intro step: walk the player to
  // the horizontal centre. The authored bytecode may still be only END.
  const hasIntro = data.roomTables.some(table => Array.isArray(table) && table[0] === 1);
  const introHas = (op: number) => introStreams.some(stream => {
    for (let i = 0; i < stream.length;) {
      const current = stream[i];
      if (current === INTRO_OP_END) break;
      if (current === op) return true;
      i += 2; // every intro opcode currently carries exactly one byte
    }
    return false;
  });
  const hasIntroClose = introHas(INTRO_OP_CLOSE_BARRIER);
  const hasIntroDialogue = introHas(INTRO_OP_DIALOGUE);
  const hasDeathFx = (data.deathFxTables || []).some(table => table && table[0] > 0);
  // FASE 3: at least one room composes its boss from 16x16 atlas cells.
  const hasBossCells = (data.cellTables || []).some(table => table && table[0] > 0);
  const hasDefaultDeathSound = (data.deathSoundIndexes || []).some(index => index < 0);
  const hasCustomDeathSound = (data.deathSoundIndexes || []).some(index => index > 0)
    && (data.deathSoundStreams || []).length > 0;
  const hasDeathSound = hasDefaultDeathSound || hasCustomDeathSound;
  // The compact channel-C sequencer is shared: the death explosion and the
  // per-zone hit sounds play through the same RAM and the same stream pool, so
  // it must exist as soon as EITHER is used. Gating it on the death sound alone
  // would leave a boss with zone sounds and no death sound calling into RAM
  // that was never reserved.
  const hasPooledSfx = hasCustomDeathSound || hasZoneSfx;
  // Concurrent animated explosions: up to three independent blasts play at
  // once. The compact ordered-frame mode uses the legacy runtime and therefore
  // does not reserve the live-slot machinery below.
  const hasDeathAnim = (data.deathFxTables || []).some(table => table && table[0] > 0 && table[5] === 1);
  // Ordered compact animation: bit 7 of the table header. One blast at a time,
  // its frames played in order AT THE SAME SPOT, which it gets by re-seeding the
  // placement PRNG per blast rather than by reserving RAM.
  const hasDeathCompactAnim = (data.deathFxTables || []).some(table => table && ((table[0] || 0) & 0x80) !== 0);
  // The original scattered cloud. A project that only uses compact animations
  // does not carry its selector at all; ROMs that predate compact mode keep it,
  // and therefore keep their exact bytes.
  const hasDeathLegacyVariant = (data.deathFxTables || []).some(
    table => table && (table[0] || 0) > 0 && ((table[0] || 0) & 0x80) === 0,
  );
  const deathHeaderBytes = hasDeathAnim ? DEATH_FX_HEADER_ANIM : DEATH_FX_HEADER_LEGACY;
  // Phase D projectiles: single bitmap bullet fired at the player. Only emitted
  // when a room configures bossProjectileTileId (byte-identical no-op otherwise).
  const tables = data.projectileTables || [];
  // Kind byte: 0 = bitmap aimed, 1 = hardware sprite, 2 = bitmap falling rocks.
  // Rocks ride the SAME single-projectile bitmap machinery (one scratch rect,
  // one live blit) and differ only in how they are launched, so they extend
  // this predicate instead of adding a third back-end.
  const hasAimedBitmapProjectiles = tables.some(t => t && t[0] === 1 && t[10] === 0)
    && typeof opts.projScratchBaseY === 'number';
  const hasFallingRocks = tables.some(t => t && t[0] === 1 && t[10] === 2)
    && typeof opts.projScratchBaseY === 'number';
  // Two independent projectile back-ends; a project may use either (or neither).
  const hasBitmapProjectiles = hasAimedBitmapProjectiles || hasFallingRocks;
  const sprites = opts.spriteBullets;
  const hasSpriteProjectiles = tables.some(t => t && t[0] === 1 && t[10] === 1)
    && !!sprites && sprites.maxSlots > 0;
  const hasProjectiles = hasBitmapProjectiles || hasSpriteProjectiles;
  const hasLaser = (data.laserTables || []).some(t => t && t[0] === 1);
  const projScratchY = opts.projScratchBaseY || 0;
  const spriteSlots = hasSpriteProjectiles ? (sprites as BitmapBossSpriteBulletOptions).maxSlots : 0;
  const spriteFrameCount = hasSpriteProjectiles
    ? clampInt(sprites?.sprite?.frames?.length, 1, 8, 1)
    : 1;
  const spriteAnimDelay = hasSpriteProjectiles
    ? clampInt(sprites?.sprite?.delayFrames, 1, 255, 8)
    : 8;
  const hasAnimatedSpriteBullet = hasSpriteProjectiles && spriteFrameCount > 1;
  const projRamBase = barrierRamBase + (hasBarrier ? 7 : 0);
  // Animated bullets own frame/tick bytes per live slot. Single-frame and
  // built-in bullets retain the original 9-byte layout byte-for-byte.
  const BOSS_SBUL_SLOT_BYTES = hasAnimatedSpriteBullet ? 11 : 9;
  // The 9 projectile bytes exist only when a projectile back-end is emitted.
  // Adding them unconditionally desynchronised this cursor from `baseRamBytes`
  // below (which does gate them), so every block allocated after it — paths,
  // shots — landed 9 bytes past what the totals reserved, and `boss_intro_*`
  // (placed at `ram + baseRamBytes`) was allocated ON TOP of `boss_path_*`.
  // Single source of truth so that hazard cannot come back: both this cursor
  // and `baseRamBytes` below must add the SAME number. Falling rocks append one
  // byte of PRNG state to the block (absent, hence byte-identical, without them).
  const PROJ_RAM_BYTES = (hasProjectiles ? 9 : 0) + (hasFallingRocks ? 1 : 0);
  const spriteRamBase = projRamBase + PROJ_RAM_BYTES;
  // Fase G paths: entirely absent unless a boss references one, so a project
  // without paths keeps a byte-identical ROM.
  const pathStreams = data.pathStreams || [];
  const hasPaths = pathStreams.length > 0
    && (data.pathSelTables || []).some(table => table && table.length > 0);
  const pathRamBase = spriteRamBase + spriteSlots * BOSS_SBUL_SLOT_BYTES;
  const PATH_RAM_BYTES = 7;
  // Shot patterns only exist when a path node names one AND the boss fires
  // hardware sprites (a single bitmap bullet cannot fan out).
  const shootRecords = data.shootRecords || [];
  const hasShoots = hasPaths && hasSpriteProjectiles && shootRecords.length > 0;
  const shootRamBase = pathRamBase + (hasPaths ? PATH_RAM_BYTES : 0);
  const SHOOT_RAM_BYTES = 10;
  const baseRamBytes = 11 + 2 + 15 + defeatedBytes + flagCount + (hasBarrier ? 7 : 0)
    + PROJ_RAM_BYTES + spriteSlots * BOSS_SBUL_SLOT_BYTES
    + (hasPaths ? PATH_RAM_BYTES : 0) + (hasShoots ? SHOOT_RAM_BYTES : 0);
  const introRamBase = ram + baseRamBytes;
  const INTRO_RAM_BYTES = 7;
  const deathRamBase = introRamBase + (hasIntro ? INTRO_RAM_BYTES : 0);
  // 3 live explosions x 5 bytes (active, frame, timer, rx, ry) + the word that
  // points at the slot being serviced this frame.
  const DEATH_ANIM_SLOTS = 3;
  const DEATH_ANIM_SLOT_BYTES = 5;
  // The death presentation mutes the music while it plays. This is deliberately
  // stateless -- two inline calls, no flag, no routine: the resident 32KB is the
  // scarcest resource in this backend and a real project measured 24 free bytes.
  // The trade-off is that a song a Game Flow node had muted before the boss died
  // comes back when the sequence ends.
  const musicMuteAsm = String(opts.musicMuteAsm || '');
  const musicResumeAsm = String(opts.musicResumeAsm || '');
  const hasDeathMusicHold = hasDeathFx && !!musicMuteAsm && !!musicResumeAsm;
  const DEATH_RAM_BYTES = 3 + (hasDeathAnim ? DEATH_ANIM_SLOTS * DEATH_ANIM_SLOT_BYTES + 2 : 0);
  const deathSfxRamBase = deathRamBase + (hasDeathFx ? DEATH_RAM_BYTES : 0);
  const DEATH_SFX_RAM_BYTES = 4; // pooled stream: active, timer, pointer word
  const HIT_BLAST_RAM_BYTES = 4; // countdown, authored length, and the hit zone's centre
  const hitBlastRamBase = deathSfxRamBase + (hasPooledSfx ? DEATH_SFX_RAM_BYTES : 0);
  // Selected-boss laser state: mask, four segment lengths, cooldown, plus two
  // bytes used while restoring a direction range from the clean page.
  const LASER_RAM_BYTES = 8;
  const laserRamBase = hitBlastRamBase + (hasHitBlast ? HIT_BLAST_RAM_BYTES : 0);
  // MegaROM: the room record is staged out of its data bank into RAM.
  // FASE 3b: which frame is currently ON SCREEN, so a redraw can repaint only
  // the cells that differ. #FF = nothing drawn yet, so the next draw is full.
  const CELLS_RAM_BYTES = 1;
  const cellsRamBase = laserRamBase + (hasLaser ? LASER_RAM_BYTES : 0);
  const bankedTables = opts.bankedTables === true;
  // The legacy routines keep one selected boss in the named RAM fields. Two
  // independent bosses are implemented by swapping that selected state around
  // the existing renderer; the VDP command block remains shared and therefore
  // still serialises HMMM work safely.
  const INSTANCE_STATE_BYTES = 13
    + (hasBossCells ? 1 : 0)
    + (hasProjectiles ? 9 : 0)
    + (hasFallingRocks ? 1 : 0)
    + (hasPaths ? 7 : 0)
    + (hasShoots ? 10 : 0)
    + (hasDeathFx ? 3 + (hasDeathAnim ? DEATH_ANIM_SLOTS * DEATH_ANIM_SLOT_BYTES + 2 : 0) : 0)
    + (hasHitBlast ? HIT_BLAST_RAM_BYTES : 0)
    + (hasLaser ? 6 : 0);
  const instanceSelectorAddr = cellsRamBase + (hasBossCells ? CELLS_RAM_BYTES : 0);
  const instanceStateBase = instanceSelectorAddr + 1;
  const totalRamBytes = baseRamBytes + (hasIntro ? INTRO_RAM_BYTES : 0)
    + (hasDeathFx ? DEATH_RAM_BYTES : 0)
    + (hasPooledSfx ? DEATH_SFX_RAM_BYTES : 0)
    + (hasHitBlast ? HIT_BLAST_RAM_BYTES : 0)
    + (hasLaser ? LASER_RAM_BYTES : 0)
    + (hasBossCells ? CELLS_RAM_BYTES : 0)
    + 1 + INSTANCE_STATE_BYTES * bossInstanceCount
    + (bankedTables ? roomTableBytes : 0);
  const bossTableBufAddr = opts.ramBase + totalRamBytes - (bankedTables ? roomTableBytes : 0);
  // Pre-rendered so the data template stays readable: one ring slot per row,
  // dx then dy, each an 8.8 little-endian word.
  const shootDirRows = (() => {
    const rows: string[] = [];
    for (let slot = 0; slot < MSX2_SHOOT_RING; slot++) {
      const at = slot * 4;
      const quad = MSX2_SHOOT_DIR16_TABLE_BYTES.slice(at, at + 4).map(asmByte).join(', ');
      const degrees = (slot * 360) / MSX2_SHOOT_RING;
      rows.push(`    db ${quad}   ; ${slot.toString().padStart(2)} = ${degrees}deg`);
    }
    return rows.join('\n');
  })();
  // A wave wider than the pool silently loses its last bullets, so say it at
  // build time instead of letting it look like a bug. A burst is the way out:
  // the same ring spread over several frames fits through a small pool.
  if (hasShoots) {
    for (const record of shootRecords) {
      if (record[1] > spriteSlots) {
        console.warn(
          `MSX2 bitmap boss: a shoot pattern fires ${record[1]} bullets per wave but the bullet pool holds ${spriteSlots}; `
          + 'the extra ones are dropped. Split the volley into a burst (burstCount / burstInterval) so each wave fits.',
        );
      }
    }
  }
  if (hasPaths && shootRecords.length > 0 && !hasSpriteProjectiles) {
    console.warn('MSX2 bitmap boss: shoot patterns need hardware-sprite bullets (bossProjectileKind "sprite"); the bitmap bullet fires one aimed shot regardless.');
  }
  const hit = opts.playerHitbox;
  // Falling rocks aim at the player's body centre, not the render origin, and
  // scatter inside a band around it. The band is a power of two so the runtime
  // masks the PRNG byte instead of dividing. 32px ~= two cells: wide enough to
  // be dodgeable by walking, tight enough that standing still is fatal.
  const ROCK_BAND_PX = 32;
  const rockBandCentre = clampInt(hit.x + Math.floor(Math.max(1, hit.w) / 2), 0, 64, 8);
  // player_x is the render origin, so centre the configured collision body,
  // not merely its top-left coordinate. Default 16px body => target X 120.
  const introAutoMoveTargetX = clampInt(
    Math.round(128 - (hit.x + hit.w / 2)),
    2,
    238,
    120,
  );
  // Same conversion per room, from the X the Boss editor authored (which is a
  // BODY CENTRE, the thing an author can actually see) to the player_x the
  // runtime compares. Clamped away from the room edges so the auto-walk cannot
  // aim at a column the player can never stand on.
  // One byte per room, always: a short table would be indexed out of bounds by
  // current_screen_index and walk the player to a garbage column.
  const introTargetXPerRoom = data.roomTables.map((_table, index) => clampInt(
    Math.round(
      clampInt((data.introEntryX || [])[index], 0, 255, INTRO_ENTRY_X_CENTRE) - (hit.x + hit.w / 2),
    ),
    2,
    238,
    introAutoMoveTargetX,
  ));
  const invulnFrames = asmByte(opts.damageInvulnFrames || 60);
  const maxHealthByte = asmByte(opts.maxHealth || 3);
  const pauseGate = opts.pauseGateAsm || '';

  const equates = `
; ---- bitmap BOSS runtime state (${totalRamBytes} bytes) ----
${bankedTables ? `bitmap_boss_table_buf EQU ${asmWord(bossTableBufAddr)}   ; two room records staged out of their bank
` : ''}
boss_active     EQU ${asmWord(ram + 0)}   ; 0 none, 1 alive, 2 death FX
boss_x          EQU ${asmWord(ram + 1)}
boss_y          EQU ${asmWord(ram + 2)}
boss_old_x      EQU ${asmWord(ram + 3)}
boss_old_y      EQU ${asmWord(ram + 4)}
boss_dx         EQU ${asmWord(ram + 5)}
boss_dy         EQU ${asmWord(ram + 6)}
boss_hp         EQU ${asmWord(ram + 7)}
boss_anim_tick  EQU ${asmWord(ram + 8)}
boss_anim_frame EQU ${asmWord(ram + 9)}
boss_int_tick   EQU ${asmWord(ram + 10)}
boss_sx         EQU ${asmWord(ram + 11)}  ; word: current frame atlas SX
boss_cmd_buf    EQU ${asmWord(ram + 13)}  ; 15-byte V9938 command block
${!hasBossCells ? '' : `boss_cells_shown EQU ${asmWord(cellsRamBase)}  ; frame currently on screen, #FF = none
`}boss_defeated   EQU ${asmWord(ram + 28)}  ; ${defeatedBytes} active-world/instance bytes, 1 = killed
boss_slot       EQU ${asmWord(instanceSelectorAddr)} ; selected boss instance (0 or 1)
boss_instance_state EQU ${asmWord(instanceStateBase)} ; saved selected-state blocks
BOSS_INSTANCE_STATE_BYTES EQU ${INSTANCE_STATE_BYTES}
${hasDefeatActions ? `boss_flags      EQU ${asmWord(flagsBase)}  ; ${flagCount} bytes, onDefeated setFlag targets (persistent)\n` : ''}${hasBarrier ? `boss_barrier_draw EQU ${asmWord(barrierRamBase)}  ; 0 = clear, 1 = seal, 2 = repaint sealed cells
boss_barrier_sx EQU ${asmWord(barrierRamBase + 1)}  ; word: chain tile atlas SX
boss_barrier_sy EQU ${asmWord(barrierRamBase + 3)}  ; word: chain tile atlas SY (512-based)
boss_barrier_pending EQU ${asmWord(barrierRamBase + 5)}  ; 1 = a perimeter cell is still open under the player
boss_barrier_retry EQU ${asmWord(barrierRamBase + 6)}  ; frames until the next reseal sweep
` : ''}${hasProjectiles ? `boss_proj_active EQU ${asmWord(projRamBase + 0)}  ; 1 = a bitmap projectile is in flight
boss_proj_x     EQU ${asmWord(projRamBase + 1)}
boss_proj_y     EQU ${asmWord(projRamBase + 2)}
boss_proj_ox    EQU ${asmWord(projRamBase + 3)}  ; previous position (page-1 restore)
boss_proj_oy    EQU ${asmWord(projRamBase + 4)}
boss_proj_dx    EQU ${asmWord(projRamBase + 5)}  ; signed px/frame
boss_proj_dy    EQU ${asmWord(projRamBase + 6)}
boss_proj_cd    EQU ${asmWord(projRamBase + 7)}  ; frames until next shot
boss_phase_speed EQU ${asmWord(projRamBase + 8)}  ; projectile speed of the active attack phase
` : ''}${hasFallingRocks ? `boss_rock_seed  EQU ${asmWord(projRamBase + 9)}  ; 8-bit PRNG state for the rock drop column
` : ''}${hasSpriteProjectiles ? `BOSS_SBUL_SLOT  EQU ${BOSS_SBUL_SLOT_BYTES}
boss_sbul_pool  EQU ${asmWord(spriteRamBase)}  ; ${spriteSlots} x ${BOSS_SBUL_SLOT_BYTES} bytes
;   +0 active, +1 x, +2 y, +3 dx, +4 dy (whole pixels, as before),
;   +5 x frac, +6 y frac, +7 dx frac, +8 dy frac. Velocity is 8.8 fixed
;   point (int byte + frac byte), which is what buys 16 directions:
;   a diagonal is no longer forced to a whole pixel on both axes.
${hasAnimatedSpriteBullet ? `;   +9 animation frame, +10 animation tick (${spriteFrameCount} frames, ${spriteAnimDelay} ticks/frame).
` : ''}
` : ''}${hasPaths ? `boss_path_ptr   EQU ${asmWord(pathRamBase)}  ; word: start of the active path stream
boss_path_cur   EQU ${asmWord(pathRamBase + 2)}  ; word: read cursor into it
boss_path_wait  EQU ${asmWord(pathRamBase + 4)}  ; ticks left on a wait opcode
boss_path_idx   EQU ${asmWord(pathRamBase + 5)}  ; active path, 1-based (0 = standing still)
boss_path_fire_mode EQU ${asmWord(pathRamBase + 6)}  ; 1 = only the node scripts shoot
` : ''}${hasShoots ? `boss_shoot_dir  EQU ${asmWord(shootRamBase + 0)}  ; ring slot (0..15) the wave is centred on
boss_shoot_spd  EQU ${asmWord(shootRamBase + 1)}  ; px/frame for this volley
boss_shoot_cnt  EQU ${asmWord(shootRamBase + 2)}  ; bullets left in the current wave
boss_shoot_off  EQU ${asmWord(shootRamBase + 3)}  ; signed ring offset of the next bullet
boss_shoot_step EQU ${asmWord(shootRamBase + 4)}  ; signed ring step between bullets
boss_sbul_dxf   EQU ${asmWord(shootRamBase + 5)}  ; 8.8 fraction handed to the spawner
boss_sbul_dyf   EQU ${asmWord(shootRamBase + 6)}
boss_burst_idx  EQU ${asmWord(shootRamBase + 7)}  ; pattern being burst-fired, 1-based (0 = idle)
boss_burst_left EQU ${asmWord(shootRamBase + 8)}  ; waves still owed after the current one
boss_burst_cd   EQU ${asmWord(shootRamBase + 9)}  ; frames until the next wave
` : ''}${hasIntro ? `boss_intro_state EQU ${asmWord(introRamBase + 0)}  ; 0 fight/idle, 1 dispatch, 2 wait, 3 dialogue, 4 barrier, 5 auto-walk
boss_intro_ptr EQU ${asmWord(introRamBase + 1)}  ; word: next opcode or active-step argument
boss_intro_counter EQU ${asmWord(introRamBase + 3)}  ; wait frames / raster scanlines left this frame
boss_intro_raster_y EQU ${asmWord(introRamBase + 4)}  ; next horizontal pixel line (0..191)
boss_intro_auto_move EQU ${asmWord(introRamBase + 5)}  ; 1 = forced horizontal walk; gravity remains active
boss_intro_target_x EQU ${asmWord(introRamBase + 6)}  ; player_x the auto-walk aims at, loaded per room
` : ''}${hasDeathFx ? `boss_death_left EQU ${asmWord(deathRamBase + 0)}  ; bitmap blasts still to draw (#FF = final hold)
boss_death_tick EQU ${asmWord(deathRamBase + 1)}  ; frames to next blast/finalize
boss_death_seed EQU ${asmWord(deathRamBase + 2)}  ; deterministic 8-bit PRNG state
${hasDeathAnim ? `BOSS_DFX_SLOT   EQU ${DEATH_ANIM_SLOT_BYTES}
boss_death_slots EQU ${asmWord(deathRamBase + 3)}  ; ${DEATH_ANIM_SLOTS} x ${DEATH_ANIM_SLOT_BYTES} bytes, live explosions
;   +0 active (1 = playing), +1 frame index on screen, +2 frames until the next
;   step, +3 rx / +4 ry = even offset of the blast inside the frozen body.
boss_death_ptr  EQU ${asmWord(deathRamBase + 3 + DEATH_ANIM_SLOTS * DEATH_ANIM_SLOT_BYTES)}  ; word: slot serviced this frame
` : ''}` : ''}${hasPooledSfx ? `boss_death_sfx_active EQU ${asmWord(deathSfxRamBase + 0)}  ; a pooled channel-C sound is playing
boss_death_sfx_timer EQU ${asmWord(deathSfxRamBase + 1)}  ; frames left in the current sound step
boss_death_sfx_ptr EQU ${asmWord(deathSfxRamBase + 2)}  ; word: next compact channel-C record
` : ''}${hasHitBlast ? `boss_blast_timer EQU ${asmWord(hitBlastRamBase)}  ; frames left of the weak-point explosion (0 = none on screen)
boss_blast_len  EQU ${asmWord(hitBlastRamBase + 1)}  ; authored hold, cached from the room table at load
boss_blast_x    EQU ${asmWord(hitBlastRamBase + 2)}  ; centre of the zone that was hit, boss-local px
boss_blast_y    EQU ${asmWord(hitBlastRamBase + 3)}
` : ''}${hasLaser ? `boss_laser_mask EQU ${asmWord(laserRamBase + 0)}  ; bits N,E,S,W
boss_laser_n    EQU ${asmWord(laserRamBase + 1)}  ; growing segment count
boss_laser_e    EQU ${asmWord(laserRamBase + 2)}
boss_laser_s    EQU ${asmWord(laserRamBase + 3)}
boss_laser_w    EQU ${asmWord(laserRamBase + 4)}
boss_laser_cd   EQU ${asmWord(laserRamBase + 5)}  ; frames to next wave
boss_laser_tmp_count EQU ${asmWord(laserRamBase + 6)}
boss_laser_tmp_dir   EQU ${asmWord(laserRamBase + 7)}
` : ''}`;

  // Persistent state must start at zero: boss_defeated decides whether a boss
  // is armed at all, and boss_flags feeds the defeat actions. Both survive room
  // loads on purpose, so the per-room load path cannot clear them.
  const initAsm = `    ; Boss persistent state (defeated flags${hasDefeatActions ? ' + defeat action flags' : ''}).
    xor a
${Array.from({ length: defeatedBytes }, (_v, i) => `    ld (boss_defeated + ${i}), a`).join('\n')}
${hasDefeatActions ? Array.from({ length: flagCount }, (_v, i) => `    ld (boss_flags + ${i}), a`).join('\n') + '\n' : ''}${hasIntro ? `    ld (boss_intro_state), a
    ld (boss_intro_auto_move), a
    ld (boss_intro_target_x), a
` : ''}${hasDeathFx ? `    ld (boss_death_left), a
    ld (boss_death_tick), a
    ld (boss_death_seed), a
${hasDeathAnim ? Array.from({ length: DEATH_ANIM_SLOTS }, (_v, i) => `    ld (boss_death_slots + ${i * DEATH_ANIM_SLOT_BYTES}), a`).join('\n') + '\n' : ''}` : ''}${hasPooledSfx ? `    ld (boss_death_sfx_active), a
    ld (boss_death_sfx_timer), a
` : ''}${hasHitBlast ? `    ld (boss_blast_timer), a   ; a stale blast would pop on room entry
` : ''}`;
  const loadCallAsm = `    call bitmap_boss_load
`;
  const updateCallAsm = `    call bitmap_boss_update
`;
  const playerGateAsm = hasIntro
    ? `    ld a, (boss_intro_auto_move)
    or a
    jp z, .boss_intro_freeze_check
    ; Mandatory first step: run the normal player physics once with forced
    ; horizontal input, then skip every manual skill/action for this frame.
    call update_player_movement
    jp .skip_player_movement
.boss_intro_freeze_check:
    ld a, (boss_intro_state)    ; Room Lock wait/chain/dialogue step: freeze player
    or a
    jp nz, .skip_player_movement
`
    : '';
  const autoMoveInputAsm = hasIntro
    ? `    ; Boss intro auto-walk: replace the real keyboard row with exactly one
    ; horizontal direction. update_player_movement still owns collision,
    ; walking animation, facing and the complete gravity/vertical pipeline.
    ; The destination is per room (boss_intro_target_x, loaded on room entry),
    ; because where the player should stand depends on the fight.
    ld a, (boss_intro_auto_move)
    or a
    jp z, .boss_intro_auto_input_done
    ld a, (boss_intro_target_x)
    ld b, a                    ; B = this room's target player_x
    ld a, (player_x)
    cp b
    jp z, .boss_intro_auto_arrived
    jp c, .boss_intro_auto_right
    sub b
    cp 2
    jp c, .boss_intro_auto_final_left
    ld c, #10                  ; forced LEFT, no jump/action bits
    jp .boss_intro_auto_input_done
.boss_intro_auto_right:
    ld e, a                    ; E = player_x (C still holds the key mask)
    ld a, b
    sub e
    cp 2
    jp c, .boss_intro_auto_final_right
    ld c, #80                  ; forced RIGHT, no jump/action bits
    jp .boss_intro_auto_input_done
.boss_intro_auto_final_left:
    ld a, #FF                  ; exact final pixel, still collision-checked
    call bitmap_try_move_x
    jp .boss_intro_auto_final_check
.boss_intro_auto_final_right:
    ld a, 1                    ; exact final pixel, still collision-checked
    call bitmap_try_move_x
.boss_intro_auto_final_check:
    ; bitmap_try_move_x owns BC/DE/HL, so re-read the target instead of
    ; assuming B survived the call.
    ld a, (boss_intro_target_x)
    ld b, a
    ld a, (player_x)
    cp b
    jp nz, .boss_intro_auto_blocked
.boss_intro_auto_arrived:
    xor a
    ld (boss_intro_auto_move), a
    ld c, a                    ; no horizontal/jump input on the arrival frame
    inc a
    ld (boss_intro_state), a   ; state 1: dispatch authored Room Lock next frame
    jp .boss_intro_auto_input_done
.boss_intro_auto_blocked:
    ld c, 0                    ; obstacle: keep auto flag, gravity still advances
.boss_intro_auto_input_done:
`
    : '';

  // Keep the existing renderer single-selected and swap its mutable state for
  // each room boss. Shared intro/barrier/audio state deliberately stays out.
  const stateByteFields = [
    'boss_active', 'boss_x', 'boss_y', 'boss_old_x', 'boss_old_y',
    'boss_dx', 'boss_dy', 'boss_hp', 'boss_anim_tick', 'boss_anim_frame',
    'boss_int_tick',
  ];
  const stateWordFields = ['boss_sx'];
  if (hasBossCells) stateByteFields.push('boss_cells_shown');
  if (hasProjectiles) stateByteFields.push(
    'boss_proj_active', 'boss_proj_x', 'boss_proj_y', 'boss_proj_ox',
    'boss_proj_oy', 'boss_proj_dx', 'boss_proj_dy', 'boss_proj_cd',
    'boss_phase_speed',
  );
  if (hasFallingRocks) stateByteFields.push('boss_rock_seed');
  if (hasPaths) {
    stateWordFields.push('boss_path_ptr', 'boss_path_cur');
    stateByteFields.push('boss_path_wait', 'boss_path_idx', 'boss_path_fire_mode');
  }
  if (hasShoots) stateByteFields.push(
    'boss_shoot_dir', 'boss_shoot_spd', 'boss_shoot_cnt', 'boss_shoot_off',
    'boss_shoot_step', 'boss_sbul_dxf', 'boss_sbul_dyf', 'boss_burst_idx',
    'boss_burst_left', 'boss_burst_cd',
  );
  if (hasDeathFx) {
    stateByteFields.push('boss_death_left', 'boss_death_tick', 'boss_death_seed');
    if (hasDeathAnim) {
      for (let i = 0; i < DEATH_ANIM_SLOTS; i++) {
        for (let byte = 0; byte < DEATH_ANIM_SLOT_BYTES; byte++) {
          stateByteFields.push(`boss_death_slots + ${i * DEATH_ANIM_SLOT_BYTES + byte}`);
        }
      }
      stateWordFields.push('boss_death_ptr');
    }
  }
  if (hasHitBlast) stateByteFields.push('boss_blast_timer', 'boss_blast_len', 'boss_blast_x', 'boss_blast_y');
  if (hasLaser) stateByteFields.push('boss_laser_mask', 'boss_laser_n', 'boss_laser_e', 'boss_laser_s', 'boss_laser_w', 'boss_laser_cd');
  const stateCopyAsm = (load: boolean): string => {
    const byteLines = stateByteFields.map(field => load
      ? `    ld a, (de)\n    ld (${field}), a\n    inc de`
      : `    ld a, (${field})\n    ld (de), a\n    inc de`);
    const wordLines = stateWordFields.map(field => load
      ? `    ld a, (de)\n    ld (${field}), a\n    inc de\n    ld a, (de)\n    ld (${field} + 1), a\n    inc de`
      : `    ld hl, (${field})\n    ld a, l\n    ld (de), a\n    inc de\n    ld a, h\n    ld (de), a\n    inc de`);
    const body = [...byteLines, ...wordLines].join('\n');
    const stateOp = load ? 'load' : 'save';
    return `
bitmap_boss_state_${stateOp}:
    ld a, (boss_slot)
    or a
    jr nz, .state_${stateOp}_slot1
    ld de, boss_instance_state
    jr .state_${stateOp}_copy
.state_${stateOp}_slot1:
    ld de, boss_instance_state + BOSS_INSTANCE_STATE_BYTES
.state_${stateOp}_copy:
${body}
    ret
`;
  };
  const stateLoadAsm = stateCopyAsm(true);
  const stateSaveAsm = stateCopyAsm(false);

  const routinesAsm = `
${stateLoadAsm}${stateSaveAsm}
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_load
; PURPOSE: Load both independent boss instances for the current room. The
;   selected renderer is reused serially; each instance keeps its own state.
; ------------------------------------------------------------
bitmap_boss_load:
    xor a
    ld (boss_slot), a
    call bitmap_boss_load_one
    call bitmap_boss_state_save
    ld a, 1
    ld (boss_slot), a
    call bitmap_boss_load_one
    call bitmap_boss_state_save
    xor a
    ld (boss_slot), a
    jp bitmap_boss_state_load

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_load
; ------------------------------------------------------------
; PURPOSE: Arm the boss for the freshly loaded room. Reads the per-room
;   table; a defeated boss (persistent flag) or an absent one leaves the
;   system idle. The first draw happens on the first update tick.
; INPUT: current_screen_index. OUTPUT: boss state RAM.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_load_one:
${bankedRoomData ? `    ; The room-load path streams banked resources (music, RLE) and leaves P2
    ; pointing at the last one. Every table read below lives in resident bank 2,
    ; so map it back in first: reading them through the music bank yields
    ; garbage (0x00 -> "no boss here", 0xFF -> a bogus VDP command that hangs).
    ; Only AF is destroyed, and nothing is live yet at this point.
    call bitmap_room_restore_resident_banks
` : ''}    xor a
    ld (boss_active), a
${hasLaser ? `    ld (boss_laser_mask), a
    ld (boss_laser_n), a
    ld (boss_laser_e), a
    ld (boss_laser_s), a
    ld (boss_laser_w), a
    ld (boss_laser_cd), a
` : ''}
${hasIntro ? `    ld a, (boss_slot)
    or a
    jr nz, .load_skip_intro_reset
    ld (boss_intro_state), a
    ld (boss_intro_auto_move), a
.load_skip_intro_reset:
` : ''}${hasDeathFx ? `    ld (boss_death_left), a
    ld (boss_death_tick), a
` : ''}${hasBarrier ? `    ld a, (boss_slot)
    or a
    jr nz, .load_skip_barrier_reset
    ld (boss_barrier_draw), a
    ld (boss_barrier_pending), a
.load_skip_barrier_reset:
` : ''}${!hasBossCells ? '' : `    ld a, #FF
    ld (boss_cells_shown), a   ; nothing of this boss is on screen yet: draw it whole
    xor a
`}    ${roomPoolIndexLoad}
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, boss_defeated
    add hl, de
    ld a, (hl)
    or a
    ret nz                     ; already killed in this run
${bankedTables ? `    ; Records are banked. Stage this room's ${BITMAP_BOSS_TABLE_STRIDE} bytes into RAM: two of the three
    ; readers hand the pointer out and let their CALLER walk it, so the bank
    ; cannot stay mapped past this routine.
    push bc                    ; the shadow lookup must not disturb the caller's BC
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_bank_table
    add hl, de
    ld c, (hl)
    ld hl, bitmap_boss_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, bitmap_boss_table_buf
    ld a, c
    ld bc, ${roomTableBytes}
    call bitmap_copy_banked_to_ram
    pop bc
    ld hl, bitmap_boss_table_buf` : `    ld a, (current_screen_index)
    add a, a                   ; word table index
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a`}                    ; HL -> room boss table
    ld a, (boss_slot)
    or a
    jr z, .load_table_slot_ready
    ld de, ${BITMAP_BOSS_TABLE_STRIDE}
    add hl, de
.load_table_slot_ready:
    ld a, (hl)
    or a
    jr nz, .boss_room_record_present
    call bitmap_boss_mark_absent
    ret                         ; no boss in this room / empty second slot
.boss_room_record_present:
    push hl
    pop ix
    ld a, 1
    ld (boss_active), a
    ld a, (ix+1)
    ld (boss_x), a
    ld (boss_old_x), a
    ld a, (ix+2)
    ld (boss_y), a
    ld (boss_old_y), a
    ld a, (ix+3)
    ld (boss_dx), a
    ld a, (ix+4)
    ld (boss_dy), a
    ld a, (ix+17)
    ld (boss_hp), a
    ld a, (ix+16)
    ld (boss_anim_tick), a
${hasHitBlast ? `    ld a, (ix+20)              ; authored blast hold (0 = this boss never pops one)
    ld (boss_blast_len), a
` : ''}    xor a
    ld (boss_anim_frame), a
    ld (boss_int_tick), a
${hasHitBlast ? `    ld (boss_blast_timer), a   ; never enter a room mid-blast
` : ''}
    ld l, (ix+9)
    ld h, (ix+10)
    ld (boss_sx), hl           ; frame 0 source X
${hasLaser ? `    ; Each boss owns its laser timer. Offset slot 1 by half a cadence
    ; so the usual two-boss wave does not stack all eight HMMM cells at once.
    call bitmap_boss_laser_config_ix
    ld a, (hl)
    or a
    jr z, .boss_laser_load_done
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)                 ; interval
    ld c, a
    ld a, (boss_slot)
    or a
    jr z, .boss_laser_cd_ready
    ld a, c
    srl a
    jr nz, .boss_laser_cd_ready
    inc a
.boss_laser_cd_ready:
    ld (boss_laser_cd), a
.boss_laser_load_done:
` : ''}
    ; ---- clean-background snapshot (once per room entry) ----
    ; The boss repairs the background it uncovers by copying strips from the
    ; page it is NOT drawing on. After a room flip that page still holds the
    ; PREVIOUS room (and at boot it was never composed at all), so the trail
    ; would be painted with the previous screen's pixels. Mirror the freshly
    ; composed game area onto it with one HMMM. This runs only here, never per
    ; frame, and only in rooms that actually arm a boss.
    xor a
    ld (boss_cmd_buf + 0), a   ; SX = 0
    ld (boss_cmd_buf + 1), a
    ld (boss_cmd_buf + 4), a   ; DX = 0
    ld (boss_cmd_buf + 5), a
    ld l, ${asmByte(gameY)}    ; first game row (below the HUD band)
${visiblePageH}
    ld (boss_cmd_buf + 2), hl  ; SY = visible page
    ld a, h
    xor 1
    ld h, a
    ld (boss_cmd_buf + 6), hl  ; DY = the other page, same row
    ld hl, 256
    ld (boss_cmd_buf + 8), hl  ; NX = full width
    ld hl, ${gameH}
    ld (boss_cmd_buf + 10), hl ; NY = game area height
    call bitmap_boss_finish_hmmm
${hasPaths ? `    push ix
    call bitmap_boss_path_wanted     ; A = path for the boss's starting HP
    call bitmap_boss_path_select
    pop ix
` : ''}
${hasProjectiles ? `    call bitmap_boss_proj_config_ix
    xor a
    ld (boss_proj_active), a   ; Phase D: no projectile in flight yet
    ld a, (ix+8)
    ld (boss_phase_speed), a   ; base speed until the first phase resolve
    ld a, (ix+7)
    ld (boss_proj_cd), a       ; first shot after one full interval
${hasFallingRocks ? `    ; Seed the drop-column PRNG from the BIOS frame counter so the rock pattern
    ; is not identical on every run. Any non-zero byte works; 0 would make the
    ; xor/add generator emit a fixed sequence from a degenerate start.
    ld a, (#FC9E)
    or a
    jr nz, .boss_rock_seed_ok
    ld a, #5B
.boss_rock_seed_ok:
    ld (boss_rock_seed), a
` : ''}${hasSpriteProjectiles ? `    ld a, (ix+10)
    ${hasFallingRocks ? `cp 1                       ; kind 2 (rocks) must NOT load sprite bullets
    call z, bitmap_boss_sbul_load    ; upload bullet pattern/colours, clear pool` : `or a
    call nz, bitmap_boss_sbul_load   ; upload bullet pattern/colours, clear pool`}
` : ''}` : ''}${hasIntro ? `    ld a, (boss_slot)
    or a
    jr nz, .load_skip_intro_begin
    call bitmap_boss_intro_begin
.load_skip_intro_begin:
    ; The mandatory auto-walk and subsequent Room Lock own the first frames.
    ; Draw the stationary body once; movement/shoot/contact start only at END.
    call bitmap_boss_table_ix
    jp bitmap_boss_draw
` : `    ret
`}

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_update
; ------------------------------------------------------------
; The public entry point swaps and updates both saved instances.
bitmap_boss_update:
    ld a, (boss_slot)
    push af
    xor a
    ld (boss_slot), a
    call bitmap_boss_state_load
    call bitmap_boss_update_one
    call bitmap_boss_state_save
    ld a, 1
    ld (boss_slot), a
    call bitmap_boss_state_load
    call bitmap_boss_update_one
    call bitmap_boss_state_save
    pop af
    ld (boss_slot), a
    jp bitmap_boss_state_load

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_update_one
; ------------------------------------------------------------
; PURPOSE: Per-frame boss brain: cadence gate, patrol move with bounce,
;   animation step, VDP redraw (strip restore + HMMM body), player
;   contact damage. The blit budget is the one verified by the
;   feasibility benchmark; at interval 2 the VDP finishes 96x96 with
;   a full frame to spare.
; INPUT: boss state RAM, current room table via bitmap_boss_ptr_table.
; OUTPUT: VRAM page 0 updated; player_health/player_invuln on contact.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_boss_update_one:
${hasPooledSfx ? `    call bitmap_boss_death_sfx_tick  ; pooled channel-C audio (death + zone hits) advances once per frame, in every boss state
` : ''}${pauseGate}${hasHitBlast ? `    ; Blast countdown, in real frames so the authored number means what it says.
    ; Guarded: decrementing an idle 0 would wrap to 255 and leave the explosion
    ; stuck on the body for four seconds. This runs BEFORE boss_active is read,
    ; because the dispatch below still needs A.
    ld a, (boss_blast_timer)
    or a
    jr z, .boss_no_blast_tick
    dec a
    ld (boss_blast_timer), a
.boss_no_blast_tick:
` : ''}    ld a, (boss_active)
    or a
    ret z
${hasDeathFx ? `    cp 2
    jp z, bitmap_boss_death_update
` : ''}
${hasIntro ? `    ld a, (boss_intro_state)
    or a
    jr z, .boss_intro_finished
    ; Slot 0 owns the room-wide Room Lock. Slot 1 keeps its body parked until
    ; that lock/dialogue has completed, then joins the fight.
    ld a, (boss_slot)
    or a
    ret nz
    jp bitmap_boss_intro_frame
.boss_intro_finished:
` : ''}
${hasBarrier ? `    ; The chain could not seal the doorway the player entered through. Sweep
    ; the perimeter again every 8 frames until it is clear: cells already
    ; carrying the #80 marker cost one compare each (#80 & #BF is non-zero,
    ; so bitmap_boss_barrier_cell returns before touching the VDP), and the
    ; sweep stops as soon as a pass leaves nothing pending.
    ld a, (boss_slot)
    or a
    jp nz, .no_barrier_resweep
    ld a, (boss_barrier_pending)
    or a
    jp z, .no_barrier_resweep
    ld hl, boss_barrier_retry
    dec (hl)
    jp nz, .no_barrier_resweep
    call bitmap_boss_barrier_apply   ; reseals whatever the player has left
.no_barrier_resweep:
` : ''}    call bitmap_boss_table_ix  ; IX -> room table (preserves state regs)
${hasLaser ? `    call bitmap_boss_laser_tick
    ld a, (boss_laser_mask)
    or a
    jp nz, bitmap_boss_touch     ; firing freezes this boss, but not the other slot
` : ''}
    ; VDP load balancing (enemy-style): the body only moves/redraws every
    ; (ix+19) frames (default 3); the projectile blits run on the OTHER frames,
    ; so a single frame never pays for both the big body HMMM and a bullet.
    ld a, (boss_int_tick)
    inc a
    ld (boss_int_tick), a
    cp (ix+19)
    jp c, bitmap_boss_off_frame   ; off-frame: bullets + contact damage
    xor a
    ld (boss_int_tick), a

    ; remember previous position for strip restore
    ld a, (boss_x)
    ld (boss_old_x), a
    ld a, (boss_y)
    ld (boss_old_y), a

${hasPaths ? `    ; ---- authored path (Fase G) wins over the patrol ----
    call bitmap_boss_path_sync
    ld a, (boss_path_idx)
    or a
    jr z, .bp_patrol
    push ix
    call bitmap_boss_path_step
    pop ix
    jp .no_y
.bp_patrol:
` : ''}    ; ---- X patrol with bounce ----
    ld a, (boss_dx)
    or a
    jr z, .no_x
    ld b, a
    ld a, (boss_x)
    add a, b
    ld (boss_x), a
    cp (ix+5)                  ; minX
    jr c, .bounce_x
    cp (ix+6)                  ; maxX
    jr z, .no_x
    jr c, .no_x
.bounce_x:
    ld a, b
    neg
    ld (boss_dx), a
    ld a, (boss_old_x)
    ld (boss_x), a             ; stay in bounds this frame
.no_x:
    ; ---- Y patrol with bounce ----
    ld a, (boss_dy)
    or a
    jr z, .no_y
    ld b, a
    ld a, (boss_y)
    add a, b
    ld (boss_y), a
    cp (ix+7)                  ; minY
    jr c, .bounce_y
    cp (ix+8)                  ; maxY
    jr z, .no_y
    jr c, .no_y
.bounce_y:
    ld a, b
    neg
    ld (boss_dy), a
    ld a, (boss_old_y)
    ld (boss_y), a
.no_y:

    ; ---- animation step: boss_sx = frame SX (base + frame*W) ----
    ld a, (ix+15)              ; frame count
    cp 2
    jr c, .anim_done
    ld a, (boss_anim_tick)
    dec a
    ld (boss_anim_tick), a
    jr nz, .anim_done
    ld a, (ix+16)
    ld (boss_anim_tick), a
    ld a, (boss_anim_frame)
    inc a
    cp (ix+15)
    jr c, .anim_keep
    xor a
.anim_keep:
    ld (boss_anim_frame), a
    ld l, (ix+9)               ; base SX
    ld h, (ix+10)
    or a
    jr z, .anim_sx_done
    ld b, a
    ld e, (ix+13)              ; width
    ld d, 0
.anim_sx_mul:
    add hl, de
    djnz .anim_sx_mul
.anim_sx_done:
    ld (boss_sx), hl
.anim_done:

    ; ---- VDP phase: uncovered-edge strips from page 1, then body HMMM ----
    call bitmap_boss_restore_strips
${hasBossCells ? '    call bitmap_boss_draw_animated' : '    call bitmap_boss_draw'}
${hasHitBlast ? `    call bitmap_boss_hit_blast_draw   ; over the body just painted; next redraw erases it
` : ''}    jp bitmap_boss_touch

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_off_frame
; ------------------------------------------------------------
; PURPOSE: Frames on which the body does NOT redraw. The projectile blits live
;   here so the VDP work is spread across the cadence cycle instead of piling
;   onto the body frame. Contact damage still runs every frame.
; INPUT: IX -> room table. DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_boss_off_frame:
${hasProjectiles ? `    push ix
    call bitmap_boss_shoot_update   ; Phase D bullets on the body's off-frames
    pop ix
` : ''}    jp bitmap_boss_touch

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_table_ix
; ------------------------------------------------------------
; PURPOSE: IX = current room's boss table entry.
; DESTROYS: AF, DE, HL (IX result).
; ------------------------------------------------------------
bitmap_boss_mark_absent:
    ${roomPoolIndexLoad}
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, boss_defeated
    add hl, de
    ld a, 1
    ld (hl), a
    ret

bitmap_boss_table_ix:
    ; Keep the live-body lookup self-contained. This routine is used while a
    ; room is loading and before the death runtime exists; sharing the bullet
    ; helper here made the normal Boss-spawn path depend on a later subsystem.
${bankedTables ? `    ; Records are banked. Stage this room's ${BITMAP_BOSS_TABLE_STRIDE} bytes into RAM: two of the three
    ; readers hand the pointer out and let their CALLER walk it, so the bank
    ; cannot stay mapped past this routine.
    push bc                    ; the shadow lookup must not disturb the caller's BC
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_bank_table
    add hl, de
    ld c, (hl)
    ld hl, bitmap_boss_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, bitmap_boss_table_buf
    ld a, c
    ld bc, ${roomTableBytes}
    call bitmap_copy_banked_to_ram
    pop bc
    ld hl, bitmap_boss_table_buf` : `    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a`}
    ld a, (boss_slot)
    or a
    jr z, .table_ix_slot_ready
    ld de, ${BITMAP_BOSS_TABLE_STRIDE}
    add hl, de
.table_ix_slot_ready:
    push hl
    pop ix
    ret

${hasLaser ? `; ------------------------------------------------------------
; FUNCTION: bitmap_boss_laser_config_ix
; PURPOSE: Resolve the current room + selected boss laser record.
; OUTPUT: HL -> [present,sxLo,sxHi,syLo,syHi,interval,maxSegments,mask].
; ------------------------------------------------------------
bitmap_boss_laser_config_ix:
    ; The laser suffix is embedded in the live 35-byte boss record:
    ; present..blastRect occupy bytes 0..26, laser starts at byte 27.
    push ix
    pop hl
    ld de, 27
    add hl, de
    ret

; Start one wave. A=direction mask; an already active wave is left alone.
bitmap_boss_laser_start:
    ld b, a
    ld a, (boss_laser_mask)
    or a
    ret nz
    ld a, b
    or a
    jr nz, .boss_laser_start_mask
    call bitmap_boss_laser_config_ix
    ld de, 7
    add hl, de
    ld a, (hl)
.boss_laser_start_mask:
    ld (boss_laser_mask), a
    xor a
    ld (boss_laser_n), a
    ld (boss_laser_e), a
    ld (boss_laser_s), a
    ld (boss_laser_w), a
    ret

; Tick one growing wave. A boss with a non-zero mask does not enter the body
; movement path; the other selected instance is still updated by the public
; two-slot dispatcher.
bitmap_boss_laser_tick:
    call bitmap_boss_laser_config_ix
    ld a, (hl)
    or a
    ret z
    ld a, (boss_laser_mask)
    or a
    jr nz, .boss_laser_grow
${hasPaths ? `    ld a, (boss_path_fire_mode)
    or a
    ret nz                      ; path-mode firing is node-driven
` : ''}    ld a, (boss_laser_cd)
    or a
    jr z, .boss_laser_start_auto
    dec a
    ld (boss_laser_cd), a
    ret
.boss_laser_start_auto:
    ld de, 7
    add hl, de
    ld a, (hl)
    call bitmap_boss_laser_start
.boss_laser_grow:
    call bitmap_boss_laser_config_ix
    ld de, 6
    add hl, de
    ld c, (hl)                   ; maximum segment count
    ld a, (boss_laser_mask)
    or a
    jr z, .boss_laser_wave_done
    bit 0, a
    jr z, .laser_check_e
    ld a, (boss_laser_n)
    cp c
    jr c, .boss_laser_grow_segments
.laser_check_e:
    ld a, (boss_laser_mask)
    bit 1, a
    jr z, .laser_check_s
    ld a, (boss_laser_e)
    cp c
    jr c, .boss_laser_grow_segments
.laser_check_s:
    ld a, (boss_laser_mask)
    bit 2, a
    jr z, .laser_check_w
    ld a, (boss_laser_s)
    cp c
    jr c, .boss_laser_grow_segments
.laser_check_w:
    ld a, (boss_laser_mask)
    bit 3, a
    jr z, .boss_laser_wave_done
    ld a, (boss_laser_w)
    cp c
    jr c, .boss_laser_grow_segments
.boss_laser_wave_done:
    call bitmap_boss_laser_restore_all
    call bitmap_boss_laser_config_ix
    ld de, 5
    add hl, de
    ld a, (hl)
    ld (boss_laser_cd), a
    ret
.boss_laser_grow_segments:
    ld a, (boss_laser_mask)
    bit 0, a
    jr z, .laser_grow_e
    ld a, (boss_laser_n)
    cp c
    jr nc, .laser_grow_e
    inc a
    ld (boss_laser_n), a
    ld b, a
    push bc
    xor a
    call bitmap_boss_laser_draw_segment
    pop bc
    or a
    jr nz, .laser_grow_e
    xor a
    call bitmap_boss_laser_blocked
.laser_grow_e:
    ld a, (boss_laser_mask)
    bit 1, a
    jr z, .laser_grow_s
    ld a, (boss_laser_e)
    cp c
    jr nc, .laser_grow_s
    inc a
    ld (boss_laser_e), a
    ld b, a
    push bc
    ld a, 1
    call bitmap_boss_laser_draw_segment
    pop bc
    or a
    jr nz, .laser_grow_s
    ld a, 1
    call bitmap_boss_laser_blocked
.laser_grow_s:
    ld a, (boss_laser_mask)
    bit 2, a
    jr z, .laser_grow_w
    ld a, (boss_laser_s)
    cp c
    jr nc, .laser_grow_w
    inc a
    ld (boss_laser_s), a
    ld b, a
    push bc
    ld a, 2
    call bitmap_boss_laser_draw_segment
    pop bc
    or a
    jr nz, .laser_grow_w
    ld a, 2
    call bitmap_boss_laser_blocked
.laser_grow_w:
    ld a, (boss_laser_mask)
    bit 3, a
    jr z, .laser_grow_done
    ld a, (boss_laser_w)
    cp c
    jr nc, .laser_grow_done
    inc a
    ld (boss_laser_w), a
    ld b, a
    push bc
    ld a, 3
    call bitmap_boss_laser_draw_segment
    pop bc
    or a
    jr nz, .laser_grow_done
    ld a, 3
    call bitmap_boss_laser_blocked
.laser_grow_done:
    ld a, (boss_laser_mask)
    or a
    jr nz, .laser_grow_touch
    call bitmap_boss_laser_config_ix
    ld de, 5
    add hl, de
    ld a, (hl)
    ld (boss_laser_cd), a
.laser_grow_touch:
    jp bitmap_boss_laser_touch

; An attempted segment fell outside the game area. Restore the valid prefix,
; then clear only this direction; its count is ignored while the mask bit is 0.
; A=0 N, 1 E, 2 S, 3 W. Preserves C (the configured maximum length).
bitmap_boss_laser_blocked:
    ld (boss_laser_tmp_dir), a
    cp 1
    jr c, .laser_blocked_n
    jr z, .laser_blocked_e
    cp 2
    jr z, .laser_blocked_s
    ld a, (boss_laser_w)
    jr .laser_blocked_restore
.laser_blocked_s:
    ld a, (boss_laser_s)
    jr .laser_blocked_restore
.laser_blocked_e:
    ld a, (boss_laser_e)
    jr .laser_blocked_restore
.laser_blocked_n:
    ld a, (boss_laser_n)
.laser_blocked_restore:
    ld b, a
    push bc
    ld a, (boss_laser_tmp_dir)
    call bitmap_boss_laser_restore_range
    pop bc
    ld a, (boss_laser_tmp_dir)
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_laser_clear_masks
    add hl, de
    ld b, (hl)
    ld a, (boss_laser_mask)
    and b
    ld (boss_laser_mask), a
    ret

; Set the visible-page destination of a 16x16 laser cell.
; A=0 N, 1 E, 2 S, 3 W; B=one-based segment number.
bitmap_boss_laser_position:
    or a
    jr z, .laser_pos_n
    dec a
    jr z, .laser_pos_e
    dec a
    jr z, .laser_pos_s
    jr .laser_pos_w
.laser_pos_n:
    ld a, b
    call bitmap_boss_laser_mul16_a
    ld c, a
    ld a, (boss_y)
    sub c
    jr c, .laser_pos_invalid
    add a, ${asmByte(gameY)}
    ld l, a
    ld a, (bitmap_displayed_page)
    ld h, a
    ld (boss_cmd_buf + 6), hl
    ld a, (boss_x)
    and #FE
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, 1
    ret
.laser_pos_e:
    ld a, b
    call bitmap_boss_laser_mul16_a
    ld c, a
    ld a, (boss_x)
    add a, 16
    add a, c
    jr c, .laser_pos_invalid
    cp 241
    jr nc, .laser_pos_invalid
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_y)
    jr .laser_pos_store_y
.laser_pos_s:
    ld a, b
    call bitmap_boss_laser_mul16_a
    ld c, a
    ld a, (boss_y)
    add a, 16
    add a, c
    cp ${Math.max(1, gameH - 15)}
    jr nc, .laser_pos_invalid
    ld a, (boss_x)
    and #FE
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_y)
    add a, 16
    add a, c
    jr .laser_pos_store_y
.laser_pos_w:
    ld a, b
    call bitmap_boss_laser_mul16_a
    ld c, a
    ld a, (boss_x)
    sub c
    jr c, .laser_pos_invalid
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_y)
.laser_pos_store_y:
    add a, ${asmByte(gameY)}
    ld l, a
    ld a, (bitmap_displayed_page)
    ld h, a
    ld (boss_cmd_buf + 6), hl
    ld a, 1
    ret
.laser_pos_invalid:
    xor a
    ret

bitmap_boss_laser_draw_segment:
    push bc
    call bitmap_boss_laser_position
    or a
    jr z, .laser_draw_invalid
    call bitmap_boss_laser_config_ix
    inc hl
    ld a, (hl)
    ld (boss_cmd_buf + 0), a
    inc hl
    ld a, (hl)
    ld (boss_cmd_buf + 1), a
    inc hl
    ld a, (hl)
    ld (boss_cmd_buf + 2), a
    inc hl
    ld a, (hl)
    ld (boss_cmd_buf + 3), a
    ld hl, 16
    ld (boss_cmd_buf + 8), hl
    ld (boss_cmd_buf + 10), hl
    xor a
    ld (boss_cmd_buf + 12), a
    ld (boss_cmd_buf + 13), a
    ld a, #D0
    ld (boss_cmd_buf + 14), a
    call bitmap_boss_launch_cmd
    ld a, 1
    jr .laser_draw_done
.laser_draw_invalid:
    xor a
.laser_draw_done:
    pop bc
    ret

bitmap_boss_laser_restore_all:
    ld a, (boss_laser_mask)
    bit 0, a
    jr z, .laser_restore_e
    ld a, (boss_laser_n)
    ld b, a
    xor a
    call bitmap_boss_laser_restore_range
.laser_restore_e:
    ld a, (boss_laser_mask)
    bit 1, a
    jr z, .laser_restore_s
    ld a, (boss_laser_e)
    ld b, a
    ld a, 1
    call bitmap_boss_laser_restore_range
.laser_restore_s:
    ld a, (boss_laser_mask)
    bit 2, a
    jr z, .laser_restore_w
    ld a, (boss_laser_s)
    ld b, a
    ld a, 2
    call bitmap_boss_laser_restore_range
.laser_restore_w:
    ld a, (boss_laser_mask)
    bit 3, a
    jr z, .laser_restore_done
    ld a, (boss_laser_w)
    ld b, a
    ld a, 3
    call bitmap_boss_laser_restore_range
.laser_restore_done:
    xor a
    ld (boss_laser_mask), a
    ret

bitmap_boss_laser_restore_range:
    ld (boss_laser_tmp_dir), a
    ld a, b
    ld (boss_laser_tmp_count), a
.laser_restore_loop:
    ld a, (boss_laser_tmp_count)
    or a
    ret z
    ld b, a
    dec a
    ld (boss_laser_tmp_count), a
    ld a, (boss_laser_tmp_dir)
    call bitmap_boss_laser_restore_segment
    jr .laser_restore_loop

bitmap_boss_laser_restore_segment:
    push af
    push bc
    call bitmap_boss_laser_position
    or a
    jr z, .laser_restore_segment_done
    ld a, (boss_cmd_buf + 4)
    ld l, a
    ld a, (boss_cmd_buf + 5)
    ld h, a
    ld (boss_cmd_buf + 0), hl
    ld a, (boss_cmd_buf + 6)
    ld l, a
    ld a, (bitmap_displayed_page)
    xor 1
    ld h, a
    ld (boss_cmd_buf + 2), hl
    ld hl, 16
    ld (boss_cmd_buf + 8), hl
    ld (boss_cmd_buf + 10), hl
    xor a
    ld (boss_cmd_buf + 12), a
    ld (boss_cmd_buf + 13), a
    ld a, #D0
    ld (boss_cmd_buf + 14), a
    call bitmap_boss_launch_cmd
.laser_restore_segment_done:
    pop bc
    pop af
    ret

; Dynamic AABB collision against the currently painted laser rectangles.
bitmap_boss_laser_touch:
    ld a, (player_invuln)
    or a
    ret nz
    ld a, (boss_laser_mask)
    bit 0, a
    call nz, bitmap_boss_laser_rect_n
    ld a, (boss_laser_mask)
    bit 1, a
    call nz, bitmap_boss_laser_rect_e
    ld a, (boss_laser_mask)
    bit 2, a
    call nz, bitmap_boss_laser_rect_s
    ld a, (boss_laser_mask)
    bit 3, a
    call nz, bitmap_boss_laser_rect_w
    ret
bitmap_boss_laser_rect_n:
    ld a, (boss_x)
    ld (boss_cmd_buf + 0), a       ; reuse first four command bytes as x,y,w,h
    xor a
    ld (boss_cmd_buf + 1), a
    ld a, (boss_y)
    ld b, a                       ; preserve boss Y while multiplying length
    ld a, (boss_laser_n)
    call bitmap_boss_laser_mul16_a
    ld c, a
    ld a, b
    sub c
    ld (boss_cmd_buf + 2), a
    ld a, (boss_laser_n)
    call bitmap_boss_laser_mul16_a
    ld (boss_cmd_buf + 3), a   ; height = N length
    ld a, 16
    ld (boss_cmd_buf + 4), a   ; width = one cell
    jp bitmap_boss_laser_rect_touch
bitmap_boss_laser_rect_e:
    ld a, (boss_x)
    add a, 16
    ld (boss_cmd_buf + 0), a
    ld a, (boss_y)
    ld (boss_cmd_buf + 2), a
    ld a, 16
    ld (boss_cmd_buf + 3), a   ; height = one cell
    ld a, (boss_laser_e)
    call bitmap_boss_laser_mul16_a
    ld (boss_cmd_buf + 4), a   ; width = E length
    jp bitmap_boss_laser_rect_touch
bitmap_boss_laser_rect_s:
    ld a, (boss_x)
    ld (boss_cmd_buf + 0), a
    ld a, (boss_y)
    add a, 16
    ld (boss_cmd_buf + 2), a
    ld a, (boss_laser_s)
    call bitmap_boss_laser_mul16_a
    ld (boss_cmd_buf + 3), a   ; height = S length
    ld a, 16
    ld (boss_cmd_buf + 4), a   ; width = one cell
    jp bitmap_boss_laser_rect_touch
bitmap_boss_laser_rect_w:
    ld a, (boss_x)
    ld b, a                       ; preserve boss X while multiplying length
    ld a, (boss_laser_w)
    call bitmap_boss_laser_mul16_a
    ld c, a
    ld a, b
    sub c
    ld (boss_cmd_buf + 0), a
    ld a, (boss_y)
    ld (boss_cmd_buf + 2), a
    ld a, 16
    ld (boss_cmd_buf + 3), a   ; height = one cell
    ld a, (boss_laser_w)
    call bitmap_boss_laser_mul16_a
    ld (boss_cmd_buf + 4), a   ; width = W length
    jp bitmap_boss_laser_rect_touch
bitmap_boss_laser_mul16_a:
    add a, a
    add a, a
    add a, a
    add a, a
    ret
bitmap_boss_laser_rect_touch:
    ; command scratch: x, unused, y, unused, width (the height is stored at +3)
    ld a, (boss_cmd_buf + 0)
    ld b, a
    ld a, (boss_cmd_buf + 4)
    add a, b
    ld c, a                    ; laser right
    ld a, (player_x)
    add a, ${asmByte(hit.x)}
    cp c
    ret nc
    ld d, a
    add a, ${asmByte(Math.max(1, hit.w))}
    cp b
    ret c
    ret z
    ld a, (boss_cmd_buf + 2)
    ld b, a
    ld a, (boss_cmd_buf + 3)
    add a, b
    ld c, a                    ; laser bottom
    ld a, (player_y)
    add a, ${asmByte(hit.y)}
    cp c
    ret nc
    add a, ${asmByte(Math.max(1, hit.h))}
    cp b
    ret c
    ret z
    ld a, (ix + 18)
    or a
    ret z
    ld b, a
    ld a, (player_health)
    sub b
    jr c, .laser_damage_dead
    jr z, .laser_damage_dead
    ld (player_health), a
    ld a, ${invulnFrames}
    ld (player_invuln), a
    ret
.laser_damage_dead:
    xor a
    ld (player_health), a
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr nz, .laser_damage_respawn
    ld a, 1
    ld (bitmap_game_over_flag), a
.laser_damage_respawn:
    ld a, ${maxHealthByte}
    ld (player_health), a
    ld a, ${invulnFrames}
    ld (player_invuln), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_vx), a
    ret
` : ''}

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_restore_strips
; ------------------------------------------------------------
; PURPOSE: Repair the background the body uncovered this tick: one 4px
;   vertical strip (movement X) and one 4px horizontal strip (movement Y),
;   copied page1 -> page0 at the OLD position edges. 4px covers |d| <= 2.
; INPUT: boss_old_x/y, boss_x/y, IX -> table. DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_restore_strips:
    ; X strip: moved right -> left edge uncovered (at old_x);
    ;          moved left  -> right edge (old_x + W - 4).
    ld a, (boss_x)
    ld b, a
    ld a, (boss_old_x)
    cp b
    jr z, .strip_y             ; no X move
    jr c, .strip_left          ; old < new: uncovered at old left edge
    add a, (ix+13)             ; old > new: right edge
    sub 4
.strip_left:
    and #FE
    ld (boss_cmd_buf + 0), a   ; SX low (page 1 source, same X)
    ld (boss_cmd_buf + 4), a   ; DX low
    xor a
    ld (boss_cmd_buf + 1), a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_old_y)
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl  ; DY = visible page
    ld a, h
    xor 1
    ld h, a
    ld (boss_cmd_buf + 2), hl  ; SY = clean page
    ld hl, 4
    ld (boss_cmd_buf + 8), hl  ; NX = 4 px
    ld l, (ix+14)
    ld h, 0
    ld (boss_cmd_buf + 10), hl ; NY = boss height
    call bitmap_boss_finish_hmmm
.strip_y:
    ; Y strip: moved down -> top edge uncovered (at old_y); up -> bottom.
    ld a, (boss_y)
    ld b, a
    ld a, (boss_old_y)
    cp b
    ret z
    jr c, .strip_top
    add a, (ix+14)
    sub 4
.strip_top:
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl  ; DY = visible page
    ld a, h
    xor 1
    ld h, a
    ld (boss_cmd_buf + 2), hl  ; SY = clean page
    ld a, (boss_old_x)
    and #FE
    ld (boss_cmd_buf + 0), a
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 1), a
    ld (boss_cmd_buf + 5), a
    ld l, (ix+13)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX = boss width
    ld hl, 4
    ld (boss_cmd_buf + 10), hl ; NY = 4 px
    jp bitmap_boss_finish_hmmm

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_draw
; ------------------------------------------------------------
; PURPOSE: Blit the current animation frame (atlas rows 512+) to the
;   visible page at (boss_x, boss_y + HUD offset) with one opaque HMMM.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
${!hasBossCells ? '' : `; ------------------------------------------------------------
; FUNCTION: bitmap_boss_draw_animated
; ------------------------------------------------------------
; PURPOSE: The cadence path's draw. Only THIS entry may repaint just the cells
;   the animation changed, because only here is the body known to be intact:
;   nothing else has touched those pixels since the last redraw.
;
;   Everyone else must call bitmap_boss_draw, which repaints unconditionally.
;   Those callers exist precisely BECAUSE something erased the body -- the
;   dialogue close replaying the clean room, or a death blast being wiped -- and
;   a "nothing changed, skip it" would leave the boss missing or half-drawn.
; ------------------------------------------------------------
bitmap_boss_draw_animated:
    call bitmap_boss_cells_config
    ld a, (hl)
    or a
    jp nz, bitmap_boss_pick_cell_list
    jp bitmap_boss_draw_mono

`}bitmap_boss_draw:
${!hasBossCells ? '' : `    ; FASE 3: a body split into 16x16 cells has no single rectangle to copy.
    ; Its cells live wherever the packer deduped them, so the frame is composed
    ; cell by cell. A room whose blob starts with 0 frames keeps the old path.
    ; Unconditional on purpose: see bitmap_boss_draw_animated above.
    call bitmap_boss_cells_config
    ld a, (hl)
    or a
    jp nz, bitmap_boss_cells_full
`}bitmap_boss_draw_mono:
    ld hl, (boss_sx)
    ld (boss_cmd_buf + 0), hl  ; SX
    ld l, (ix+11)
    ld h, (ix+12)
    ld (boss_cmd_buf + 2), hl  ; SY (already 512-based)
    ld a, (boss_x)
    and #FE
    ld (boss_cmd_buf + 4), a   ; DX
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_y)
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl  ; DY = visible page
    ld l, (ix+13)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX = width
    ld l, (ix+14)
    ld (boss_cmd_buf + 10), hl ; NY = height
bitmap_boss_finish_hmmm:
    xor a
    ld (boss_cmd_buf + 12), a  ; CLR unused
    ld (boss_cmd_buf + 13), a  ; ARG = 0
    ld a, #D0
    ld (boss_cmd_buf + 14), a  ; HMMM
; fall through
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_launch_cmd
; ------------------------------------------------------------
; PURPOSE: Wait for a free command unit and stream boss_cmd_buf to
;   R#32-46 through the R#17 auto-increment port. Restores R#15 = S#0.
; DESTROYS: AF, BC, HL.
; ------------------------------------------------------------
bitmap_boss_launch_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, boss_cmd_buf
    ld bc, #0F9B
    otir
    ld a, #0F
    ld e, #00
    jp vdp_write_register
${!hasBossCells ? '' : `
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_cells_config
; ------------------------------------------------------------
; PURPOSE: Resolve the current room's boss body cell blob.
; INPUT: current_screen_index.
; OUTPUT: HL -> [frames, cellsPerFrame, strideLo, strideHi, records...].
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX.
; ------------------------------------------------------------
bitmap_boss_cells_config:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_cells_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_pick_cell_list
; ------------------------------------------------------------
; PURPOSE: Decide whether this redraw has to repaint the whole body or only the
;   cells the animation changed.
;
;   Repainting a frame cell by cell costs ~12 % MORE than the single blit it
;   replaced -- the area copied is identical and each command has its own cost
;   (study §5.4). The saving only appears when cells are SKIPPED, and cells can
;   only be skipped when everything else on screen stayed put:
;     - the boss moved  -> every pixel shifted, nothing on screen is reusable
;     - nothing drawn yet (#FF) or the frame did not change -> full repaint
;   The strip restore has already run when we get here, so a move has also just
;   scrubbed part of the body: only a full repaint is correct.
; INPUT: HL -> the room's cell blob. DESTROYS: AF, BC, DE, HL. PRESERVES: IX.
; ------------------------------------------------------------
bitmap_boss_pick_cell_list:
    ld a, (boss_x)
    ld b, a
    ld a, (boss_old_x)
    cp b
    jp nz, bitmap_boss_cells_full
    ld a, (boss_y)
    ld b, a
    ld a, (boss_old_y)
    cp b
    jp nz, bitmap_boss_cells_full
    ld a, (boss_cells_shown)
    cp #FF
    jp z, bitmap_boss_cells_full
    ld b, a
    ld a, (boss_anim_frame)
    cp b
    ret z                      ; same frame, same place: nothing to repaint
    call bitmap_boss_cells_delta   ; HL -> [count, records...] of this frame
    ld a, (boss_anim_frame)
    ld (boss_cells_shown), a
    ld c, (hl)
    inc hl
    ld a, c
    or a
    ret z
    jp bitmap_boss_draw_cell_list
bitmap_boss_cells_full:
    ld a, (boss_anim_frame)
    ld (boss_cells_shown), a
    jp bitmap_boss_draw_cells

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_cells_delta
; ------------------------------------------------------------
; PURPOSE: Point HL at the changed-cell list of the CURRENT animation frame.
;   The lists are variable length, so they are walked from frame 0: each one is
;   a count byte followed by count records. Frames are capped at 4.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX.
; ------------------------------------------------------------
bitmap_boss_cells_delta:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_cells_delta_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, (boss_anim_frame)
    or a
    ret z
    ld b, a
.delta_skip:
    ld a, (hl)                 ; cells in this frame's list
    inc hl
    or a
    jp z, .delta_next
    ld c, a
    ld de, ${BOSS_CELL_RECORD_BYTES}
.delta_skip_record:
    add hl, de
    dec c
    jp nz, .delta_skip_record
.delta_next:
    djnz .delta_skip
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_draw_cells
; ------------------------------------------------------------
; PURPOSE: Compose the current animation frame from its 16x16 cells, one opaque
;   HMMM each, at (boss_x + dx, boss_y + HUD offset + dy) on the visible page.
;   Splitting does NOT reduce the bytes copied -- the area is the same -- so this
;   costs about 12 % more than the single blit it replaces. What it buys is that
;   the cells are deduplicated in the atlas (study §5.4, corrected).
; INPUT: HL -> the room's cell blob, already resolved.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX.
; ------------------------------------------------------------
bitmap_boss_draw_cells:
    inc hl
    ld c, (hl)                 ; C = cells per frame
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)                 ; DE = bytes per frame
    inc hl                     ; HL -> first record of frame 0
    ld a, (boss_anim_frame)
    or a
    jp z, .cells_ready
    ld b, a
.cells_skip_frame:
    add hl, de
    djnz .cells_skip_frame
.cells_ready:
    ld a, c
    or a
    ret z
; fall through
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_draw_cell_list
; ------------------------------------------------------------
; PURPOSE: Blit C cells from the record list at HL. Consecutive records whose
;   source and destination are horizontally adjacent are coalesced into one
;   wider HMMM. A 128x96 body therefore needs one command per contiguous run,
;   not one command per 16x16 cell. Shared by full-frame and delta paths.
; INPUT: HL -> (sxLo,sxHi,syLo,syHi,dx,dy)*, C = how many.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX.
; ------------------------------------------------------------
bitmap_boss_draw_cell_list:
    push ix
    push hl
    pop ix                      ; IX = stable record cursor across VDP waits
.cells_next:
    ld l, (ix+0)
    ld h, (ix+1)
    ld (boss_cmd_buf + 0), hl  ; SX
    ld l, (ix+2)
    ld h, (ix+3)
    ld (boss_cmd_buf + 2), hl  ; SY
    ld a, (ix+4)               ; cell X offset inside the body
    ld b, a
    ld a, (boss_x)
    and #FE
    add a, b
    ld (boss_cmd_buf + 4), a   ; DX
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (ix+5)               ; cell Y offset
    ld b, a
    ld a, (boss_y)
    add a, ${asmByte(gameY)}
    add a, b
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl  ; DY = visible page
    ld hl, ${BOSS_CELL_SIZE}
    ld (boss_cmd_buf + 8), hl  ; NX
    ld (boss_cmd_buf + 10), hl ; NY
    xor a
    ld (boss_cmd_buf + 12), a  ; CLR unused
    ld (boss_cmd_buf + 13), a  ; ARG = 0
    ld a, #D0
    ld (boss_cmd_buf + 14), a  ; HMMM
    ld de, ${BOSS_CELL_RECORD_BYTES}
    add ix, de                  ; point at the next candidate record
    dec c
    jp z, .cells_launch
.cells_try_merge:
    ; Source must continue exactly after the current run on the same row.
    ld hl, (boss_cmd_buf + 0)
    ld de, (boss_cmd_buf + 8)
    add hl, de                  ; expected next SX = SX + current NX
    ld a, (ix+0)
    cp l
    jp nz, .cells_launch
    ld a, (ix+1)
    cp h
    jp nz, .cells_launch
    ld hl, (boss_cmd_buf + 2)
    ld a, (ix+2)
    cp l
    jp nz, .cells_launch
    ld a, (ix+3)
    cp h
    jp nz, .cells_launch
    ; Destination must be the same horizontal continuation too.
    ld a, (boss_x)
    and #FE
    ld b, a
    ld a, (ix+4)
    add a, b                   ; absolute next DX = boss X + record offset
    ld b, a
    ld a, (boss_cmd_buf + 4)
    ld e, a
    ld a, (boss_cmd_buf + 8)
    add a, e                   ; expected next DX = current DX + current NX
    cp b
    jp nz, .cells_launch
    ld a, (boss_y)
    add a, ${asmByte(gameY)}
    add a, (ix+5)
    ld b, a
    ld a, (boss_cmd_buf + 6)
    cp b
    jp nz, .cells_launch
    ; Same run: consume this record and widen the pending command by one cell.
    ld a, (boss_cmd_buf + 8)
    add a, ${BOSS_CELL_SIZE}
    ld (boss_cmd_buf + 8), a
    ld de, ${BOSS_CELL_RECORD_BYTES}
    add ix, de
    dec c
    jp nz, .cells_try_merge
.cells_launch:
    push bc
    call bitmap_boss_launch_cmd
    pop bc
    ld a, c                    ; launch destroys flags: re-test the real count
    or a
    jp nz, .cells_next
    pop ix
    ret
`}

${hasHitBlast ? `; ------------------------------------------------------------
; FUNCTION: bitmap_boss_hit_blast_draw
; ------------------------------------------------------------
; PURPOSE: Composite the borrowed Death FX stamp over the weak point that was
;   just hit. Called right after the body blit, so the body underneath is
;   already fresh and the NEXT scheduled body redraw erases the blast for free
;   -- no saved rectangle, no restore pass, no VRAM of its own.
;   LMMM + TIMP (#98), like the death explosions: colour 0 stays transparent so
;   the blast keeps its shape over the boss.
; INPUT: IX -> room table, boss_blast_timer / boss_blast_x / boss_blast_y.
; OUTPUT: one V9938 command queued. DESTROYS: AF, BC, DE, HL. Preserves IX.
; ------------------------------------------------------------
bitmap_boss_hit_blast_draw:
    ld a, (boss_blast_timer)
    or a
    ret z
    ld l, (ix+21)
    ld h, (ix+22)
    ld (boss_cmd_buf + 0), hl  ; SX of the borrowed stamp
    ld l, (ix+23)
    ld h, (ix+24)
    ld (boss_cmd_buf + 2), hl  ; SY (atlas rows 512+)
    ; DX = boss_x + blast_x - w/2, clamped at the body origin: a zone near the
    ; left edge would otherwise borrow from the previous row of VRAM.
    ld a, (ix+25)              ; stamp width
    srl a
    ld b, a
    ld a, (boss_blast_x)
    sub b
    jr nc, .blast_dx_ok
    xor a
.blast_dx_ok:
    ld b, a
    ld a, (boss_x)
    add a, b
    and #FE                    ; HMMM/LMMM address bytes, so keep X even
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 5), a
    ; DY = boss_y + blast_y - h/2 + HUD offset, clamped the same way.
    ld a, (ix+26)              ; stamp height
    srl a
    ld b, a
    ld a, (boss_blast_y)
    sub b
    jr nc, .blast_dy_ok
    xor a
.blast_dy_ok:
    ld b, a
    ld a, (boss_y)
    add a, b
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl  ; DY = visible page
    ld l, (ix+25)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX
    ld l, (ix+26)
    ld (boss_cmd_buf + 10), hl ; NY
    xor a
    ld (boss_cmd_buf + 12), a
    ld (boss_cmd_buf + 13), a
    ld a, #98
    ld (boss_cmd_buf + 14), a  ; LMMM + TIMP: colour 0 stays transparent
    jp bitmap_boss_launch_cmd

` : ''}; ------------------------------------------------------------
; FUNCTION: bitmap_boss_touch
; ------------------------------------------------------------
; PURPOSE: AABB player-vs-boss contact damage with the same saturating
;   health / i-frames / respawn contract as the enemy runtime.
; DESTROYS: AF, BC, DE, HL (IX preserved: table already loaded).
; ------------------------------------------------------------
bitmap_boss_touch:
    ld a, (ix+18)              ; contact damage (0 = harmless boss)
    or a
    ret z
    ld a, (player_invuln)
    or a
    ret nz
    ; X overlap: playerLeft < bossRight && bossLeft < playerRight
    ld a, (player_x)
${hit.x ? `    add a, ${asmByte(hit.x)}\n` : ''}    ld b, a                    ; B = playerLeft
    ld a, (boss_x)
    add a, (ix+13)
    jr c, .x_right_ok          ; boss right edge past 255 -> no right limit
    dec a
    cp b
    ret c                      ; bossRight-1 < playerLeft -> apart
.x_right_ok:
    ld a, b
    add a, ${asmByte(Math.max(1, hit.w) - 1)}
    ld c, a                    ; C = playerRight-1
    ld a, (boss_x)
    cp c
    ret z
    ret nc                     ; bossLeft >= playerRight -> apart (eq = touch edge)
    ; Y overlap
    ld a, (player_y)
${hit.y ? `    add a, ${asmByte(hit.y)}\n` : ''}    ld b, a                    ; B = playerTop
    ld a, (boss_y)
    add a, (ix+14)
    dec a
    cp b
    ret c                      ; bossBottom-1 < playerTop
    ld a, b
    add a, ${asmByte(Math.max(1, hit.h) - 1)}
    ld c, a                    ; C = playerBottom-1
    ld a, (boss_y)
    cp c
    ret z
    ret nc
    ; contact: subtract damage, saturate, arm i-frames, respawn on death
    ld a, (player_health)
    sub (ix+18)
    jr z, .boss_touch_zero
    jr c, .boss_touch_zero
    ld (player_health), a
    jr .boss_touch_arm
.boss_touch_zero:
    xor a
    ld (player_health), a
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr z, .boss_touch_game_over
    jr .boss_touch_respawn
.boss_touch_game_over:
    ld a, 1
    ld (bitmap_game_over_flag), a
    jr .boss_touch_arm
.boss_touch_respawn:
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
.boss_touch_arm:
    ld a, ${invulnFrames}
    ld (player_invuln), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_bullet_hit
; ------------------------------------------------------------
; PURPOSE: Player-bullet vs boss body. Wired as the body of the shoot
;   skill's bitmap_bullet_check_enemy_collision stub. On hit: 1 damage,
;   despawn the bullet, and at 0 HP run the death sequence (full-rect
;   page1 restore + persistent defeated flag).
; INPUT: IX -> bullet slot (active, x, y, dir).
; OUTPUT: boss_hp / boss state; VRAM on death.
; PRESERVES: BC, DE, HL, IX (contract of the stub call site).
; ------------------------------------------------------------
bitmap_boss_bullet_hit:
    ; Legacy contract marker: cp 1 -> ret nz for a non-alive instance.
    push af
    push bc
    push de
    push hl
    push ix
    ld a, (boss_slot)
    push af
    ld a, (ix+0)
    or a
    jr z, .boss_bullet_restore_state
    xor a
    ld (boss_slot), a
    call bitmap_boss_state_load
    call bitmap_boss_bullet_hit_one
    call bitmap_boss_state_save
    ld a, (ix+0)
    or a
    jr z, .boss_bullet_restore_state
    ld a, 1
    ld (boss_slot), a
    call bitmap_boss_state_load
    call bitmap_boss_bullet_hit_one
    call bitmap_boss_state_save
.boss_bullet_restore_state:
    pop af
    ld (boss_slot), a
    call bitmap_boss_state_load
    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

bitmap_boss_bullet_hit_one:
    ld a, (boss_active)
    cp 1
    ret nz                     ; absent or already playing death FX
    push bc
    ; bullet point (center-ish: +8,+8 of its 16x16 sprite) inside boss rect?
    ld a, (ix+1)               ; bullet x
    add a, 8
    ld b, a
    ld a, (boss_x)
    cp b
    jr z, .bullet_x_in
    jr nc, .bullet_miss        ; bossLeft > point -> out
.bullet_x_in:
    push de
    push hl
    call bitmap_boss_table_ix_shadow
    ld a, (boss_x)
    add a, (hl)                ; + width  (HL -> width byte)
    jr c, .bullet_x2_in        ; wrapped past 255: point is inside on the right
    cp b
    jr c, .bullet_miss_dehl    ; bossRight < point -> out
.bullet_x2_in:
    ld a, (ix+2)               ; bullet y
    add a, 8
    ld b, a
    ld a, (boss_y)
    cp b
    jr z, .bullet_y_in
    jr nc, .bullet_miss_dehl
.bullet_y_in:
    inc hl                     ; HL -> height byte
    ld a, (boss_y)
    add a, (hl)
    cp b
    jr c, .bullet_miss_dehl
    ; Inside the body rect: the damage zones decide what happens to the bullet.
${hasZones ? `    call bitmap_boss_zone_damage   ; CF=1 -> bare body, else A = hits, C = sfx index
    jr c, .zone_no_damage      ; no zone here: the bullet flies straight on
    ld b, a                    ; B = hits (0 on armour)
    xor a
    ld (ix+0), a               ; a zone stops the bullet, weak point or armour
${hasZoneSfx ? `    ; The zone's own sound, armour included: a clang on the plate is exactly the
    ; feedback that tells the player they are shooting the wrong spot.
    ld a, c
    or a
    call nz, bitmap_boss_zone_sfx_start   ; preserves B and IX
` : ''}    ld a, b
    or a
    jr z, .zone_no_damage      ; armour: stopped, but it takes no damage
${hasHitBlast ? `    ; Weak point only: pop the explosion. The hold was copied out of the room
    ; table at load time precisely so this path needs no table lookup -- IX is
    ; the bullet slot here and B is carrying the hit count.
    ; Also force the next frame to be an on-frame: the blast is drawn right
    ; after the body, which only redraws every (ix+19) frames, so a short blast
    ; could otherwise expire before it was ever painted. boss_int_tick counts up
    ; to the interval, so any value >= it fires the gate on the very next frame.
    ld a, (boss_blast_len)
    or a
    jr z, .no_blast_arm
    ld (boss_blast_timer), a
    ld a, 200
    ld (boss_int_tick), a
.no_blast_arm:
` : ''}    ld a, (boss_hp)
    sub b
    jr c, .boss_die            ; overkill
    ld (boss_hp), a
    jr z, .boss_die
    pop hl
    pop de
    pop bc
    ret
.zone_no_damage:
    pop hl
    pop de
    pop bc
    ret` : `    xor a
    ld (ix+0), a               ; despawn the bullet
    ld a, (boss_hp)
    dec a
    ld (boss_hp), a
    jr z, .boss_die
    pop hl
    pop de
    pop bc
    ret`}
.boss_die:
    call bitmap_boss_kill
    pop hl
    pop de
    pop bc
    ret
.bullet_miss_dehl:
    pop hl
    pop de
.bullet_miss:
    pop bc
    ret

${hasZones ? `; ------------------------------------------------------------
; FUNCTION: bitmap_boss_zone_damage
; ------------------------------------------------------------
; PURPOSE: Phase E. Work out what the bullet that just landed on the body rect
;   does, from the boss's damage zones. Zones are boss-local rectangles tested
;   in authoring order, first match wins: an "invulnerable" zone (armour) stops
;   the bullet for 0 hits, a weak point stops it for its damageMultiplier.
;   Bare body between the zones is NOT a target: the bullet keeps flying, so a
;   boss with zones can only be hurt where it was authored to be.
;   A boss with an EMPTY zone table keeps the legacy contract instead (the whole
;   body is one big weak point for 1 damage), otherwise it would be immortal.
; INPUT: IX -> bullet slot (x at ix+1, y at ix+2), boss_x/boss_y.
; OUTPUT: CF=1 -> no zone here, the bullet must survive.
;         CF=0 -> the bullet stops; A = damage in hit points (0 = armour),
;         C = the zone's hit sound index (0 = silent), armour included.
; DESTROYS: AF, BC, DE, HL. Preserves IX.
; ------------------------------------------------------------
bitmap_boss_zone_damage:
    ; local coords: D = bulletCentreX - boss_x, E = bulletCentreY - boss_y
    ld a, (ix+1)
    add a, 8
    ld b, a
    ld a, (boss_x)
    ld c, a
    ld a, b
    sub c
    ld d, a
    ld a, (ix+2)
    add a, 8
    ld b, a
    ld a, (boss_y)
    ld c, a
    ld a, b
    sub c
    ld e, a
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld l, a
    ld h, 0
    ld bc, bitmap_boss_zone_ptr_table
    add hl, bc
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> zone table
    ld a, (hl)
    or a
    jp z, .zone_body_default   ; no zones authored: the whole body is the target
    ld b, a                    ; B = zone count
    inc hl
.zone_scan:
    ; x range: zx <= dx < zx + zw
    ld a, d
    sub (hl)                   ; dx - zx
    jr c, .zone_next           ; left of the zone
    inc hl
    inc hl                     ; HL -> w  (skip y)
    cp (hl)
    dec hl
    dec hl                     ; HL back to x
    jr nc, .zone_next          ; right of the zone
    ; y range: zy <= dy < zy + zh
    inc hl                     ; HL -> y
    ld a, e
    sub (hl)
    jr c, .zone_next_y
    inc hl
    inc hl                     ; HL -> h
    cp (hl)
    dec hl
    dec hl                     ; HL -> y
    jr nc, .zone_next_y
    ; inside. HL -> y (offset 1) at this point.
${hasHitBlast ? `    ; Remember where this zone's CENTRE is, in boss-local pixels, so the hit
    ; explosion pops on the weak point itself instead of wherever the bullet
    ; happened to clip the edge -- that is what makes it double as a hint about
    ; where to aim. D/E held the bullet's local coords and are free now.
    dec hl                     ; HL -> x
    ld a, (hl)
    inc hl
    inc hl                     ; HL -> w
    ld e, (hl)
    srl e
    add a, e                   ; x + w/2
    ld (boss_blast_x), a
    dec hl                     ; HL -> y
    ld a, (hl)
    inc hl
    inc hl                     ; HL -> h
    ld e, (hl)
    srl e
    add a, e                   ; y + h/2
    ld (boss_blast_y), a
    inc hl                     ; HL -> kind
` : `    inc hl
    inc hl
    inc hl                     ; HL -> kind
`}
    ld a, (hl)
    or a
    jr z, .zone_armour
    inc hl                     ; HL -> multiplier
    ld a, (hl)
    inc hl                     ; HL -> hit sound index
    ld c, (hl)                 ; (does not touch A or the flags)
    or a                       ; CF=0: the bullet stops here
    ret                        ; weak point: A = damageMultiplier hits, C = sfx
.zone_armour:
    inc hl
    inc hl                     ; HL -> hit sound index (past the unused multiplier)
    ld c, (hl)
    xor a
    ret                        ; armour: bullet dies, no damage (CF=0), C = sfx
.zone_next_y:
    dec hl                     ; HL back to x
.zone_next:
    ld a, ${BOSS_ZONE_RECORD_BYTES}
    add a, l
    ld l, a
    jr nc, .zone_skip_hi
    inc h
.zone_skip_hi:
    djnz .zone_scan
    scf                        ; zones authored but none hit: bullet passes through
    ret
.zone_body_default:
    ld c, 0                    ; no zone, so no zone sound
    ld a, 1                    ; boss without zones: plain 1 damage, bullet dies
    or a                       ; CF=0
    ret

` : ''}; Shadow table lookup that leaves HL -> width byte (offset 13) without
; touching IX (the bullet slot pointer must survive).
bitmap_boss_table_ix_shadow:
${bankedTables ? `    ; Records are banked. Stage this room's ${BITMAP_BOSS_TABLE_STRIDE} bytes into RAM: two of the three
    ; readers hand the pointer out and let their CALLER walk it, so the bank
    ; cannot stay mapped past this routine.
    push bc                    ; the shadow lookup must not disturb the caller's BC
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_bank_table
    add hl, de
    ld c, (hl)
    ld hl, bitmap_boss_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, bitmap_boss_table_buf
    ld a, c
    ld bc, ${BITMAP_BOSS_TABLE_STRIDE * BITMAP_BOSS_MAX_INSTANCES}
    call bitmap_copy_banked_to_ram
    pop bc
    ld hl, bitmap_boss_table_buf` : `    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a`}
    ld a, (boss_slot)
    or a
    jr z, .shadow_slot_ready
    ld de, ${BITMAP_BOSS_TABLE_STRIDE}
    add hl, de
.shadow_slot_ready:
    ld de, 13
    add hl, de                 ; HL -> width
    ret

; ------------------------------------------------------------
${hasDefaultDeathSound && !hasCustomDeathSound ? `; FUNCTION: bitmap_boss_death_sfx_start
; PURPOSE: Play the compact built-in MSX2 PSG explosion on channel C.
; INPUT: none. OUTPUT: hardware envelope triggered once.
; DESTROYS: AF, BC, HL. PRESERVES: DE, IX, IY.
; SIDE EFFECTS: Writes PSG R6/R10-R13/R7 and psg_sfx_r7_c_bits.
bitmap_boss_death_sfx_start:
    ld hl, bitmap_boss_death_sfx_default_pairs
    ld b, 6
.boss_dfx_default_pair:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .boss_dfx_default_pair
    ; The final pair leaves A=#1F. Music masks this shadow with #24, yielding
    ; the intended channel-C state: tone off, noise on.
    ld (psg_sfx_r7_c_bits), a
    ret

` : ''}${hasPooledSfx ? `${hasCustomDeathSound ? `; FUNCTION: bitmap_boss_death_sfx_start
; PURPOSE: Restart this room's selected Sound FX, or the built-in MSX2
;   explosion, on the gameplay SFX channel C.
; INPUT: current_screen_index. OUTPUT: sequencer armed and first step applied.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
; SIDE EFFECTS: Writes PSG R4/R5/R6/R7/R10 and psg_sfx_r7_c_bits.
bitmap_boss_death_sfx_start:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_death_sfx_room_ptr_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    ret z
    ex de, hl
    ld (boss_death_sfx_ptr), hl
    ld a, 1
    ld (boss_death_sfx_active), a
    jp bitmap_boss_death_sfx_load_step

` : ''}${hasZoneSfx ? `; FUNCTION: bitmap_boss_zone_sfx_start
; PURPOSE: Play a damage zone's hit sound on the same channel-C sequencer the
;   death explosion uses, so a weak point and the armour over it can sound
;   different without a second audio engine.
; INPUT: A = 1-based index into the shared boss sound pool (0 never gets here).
; OUTPUT: sequencer armed and the first step applied.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY -- the bullet-hit path calls this
;   with B holding the hit count and IX pointing at the bullet slot.
bitmap_boss_zone_sfx_start:
    dec a                      ; pool is 1-based so 0 can mean "silent"
    add a, a                   ; two bytes per pointer
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_sfx_pool_ptr_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    ret z                      ; empty slot: stay silent rather than run off
    ex de, hl
    ld (boss_death_sfx_ptr), hl
    ld a, 1
    ld (boss_death_sfx_active), a
    jp bitmap_boss_death_sfx_load_step

` : ''}; FUNCTION: bitmap_boss_death_sfx_tick
; PURPOSE: Advance the selected/default explosion once per game frame.
; INPUT: sequencer RAM. OUTPUT: PSG channel C advanced or released.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
bitmap_boss_death_sfx_tick:
    ld a, (boss_death_sfx_active)
    or a
    ret z
    ld a, (boss_death_sfx_timer)
    dec a
    ld (boss_death_sfx_timer), a
    ret nz
    jp bitmap_boss_death_sfx_load_step

; FUNCTION: bitmap_boss_death_sfx_load_step
; PURPOSE: Apply one compact record: duration,R4,R5,R6,R10,R7-C-bits.
; INPUT: boss_death_sfx_ptr. OUTPUT: timer/next pointer and PSG registers.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
bitmap_boss_death_sfx_load_step:
    ld hl, (boss_death_sfx_ptr)
    ld a, (hl)
    or a
    jp z, bitmap_boss_death_sfx_stop
    ld (boss_death_sfx_timer), a
    inc hl
    ld a, 4
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 5
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 6
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 10
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, (hl)
    and #24
    ld (psg_sfx_r7_c_bits), a
    inc hl
    ld (boss_death_sfx_ptr), hl
    jp bitmap_boss_death_sfx_apply_mixer

; FUNCTION: bitmap_boss_death_sfx_stop
; PURPOSE: Silence/release channel C without disturbing music on A/B.
; DESTROYS: AF, DE. PRESERVES: BC, HL, IX, IY.
bitmap_boss_death_sfx_stop:
    xor a
    ld (boss_death_sfx_active), a
    ld a, 10
    out (#A0), a
    xor a
    out (#A1), a
    ld a, #24
    ld (psg_sfx_r7_c_bits), a

; FUNCTION: bitmap_boss_death_sfx_apply_mixer
; PURPOSE: Merge only channel-C tone/noise bits into live PSG R7.
; DESTROYS: AF, DE. PRESERVES: BC, HL, IX, IY.
bitmap_boss_death_sfx_apply_mixer:
    ld a, 7
    out (#A0), a
    in a, (#A2)
    and #DB                    ; clear only tone-C bit 2 and noise-C bit 5
    ld e, a
    ld a, (psg_sfx_r7_c_bits)
    or e
    out (#A1), a
    ret

` : ''}${hasDeathFx ? `; FUNCTION: bitmap_boss_death_config
; PURPOSE: Resolve the current room's bitmap death-FX table.
; INPUT: current_screen_index.
; OUTPUT: HL -> [assetCount, blastCount, interval, hold, records...].
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX.
bitmap_boss_death_config:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_death_fx_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ret

; FUNCTION: bitmap_boss_death_rand
; PURPOSE: Advance the deterministic byte PRNG used for visual placement.
; OUTPUT: A = next pseudo-random byte.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX.
bitmap_boss_death_rand:
    ld a, (boss_death_seed)
    rrca
    xor #B8
    add a, #3D
    ld (boss_death_seed), a
    ret

; A modulo B for the small visual ranges used here. B is always 1..128.
; INPUT: A = value, B = divisor. OUTPUT: A = remainder.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX.
bitmap_boss_death_mod:
    cp b
    ret c
    sub b
    jr bitmap_boss_death_mod

; FUNCTION: bitmap_boss_death_update
; PURPOSE: Add one transparent bitmap explosion at the authored cadence, then
;   finalize after the authored hold. The body remains frozen meanwhile.
; INPUT: boss_active = 2. OUTPUT: visible VRAM and death counters.
; DESTROYS: AF, BC, DE, HL, IX.
bitmap_boss_death_update:
${hasDeathAnim ? `    ; Two presentations share this entry point; the room's table says which.
    call bitmap_boss_death_config
    ld de, 5
    add hl, de
    ld a, (hl)                 ; header +5 = animated flag
    or a
    jp nz, bitmap_boss_death_update_anim
` : ''}    ld hl, boss_death_tick
    dec (hl)
    ret nz
    call bitmap_boss_death_config
    ld a, (boss_death_left)
    or a
    jp z, bitmap_boss_finalize_death
    dec a
    ld (boss_death_left), a
    jr z, .death_load_hold
    inc hl
    inc hl                     ; offset 2 = interval
    ld a, (hl)
    jr .death_store_tick
.death_load_hold:
    inc hl
    inc hl
    inc hl                     ; offset 3 = final hold
    ld a, (hl)
.death_store_tick:
    ld (boss_death_tick), a
${hasDeathSound && hasDeathLegacyVariant ? `    call bitmap_boss_death_sfx_start   ; one cadence step = one blast in this mode
` : ''}    jp bitmap_boss_death_draw

; FUNCTION: bitmap_boss_death_draw
; PURPOSE: Draw one authored stamp inside the boss body or, on the compact
;   animation's implicit final slot, reconstruct the frozen Boss from its atlas.
;   Explosion frames use V9938 LMMM/TIMP (#98); colour 0 stays transparent.
; INPUT: Current room death table and live boss position.
; OUTPUT: One bitmap explosion frame or one complete Boss-body restoration.
; DESTROYS: AF, BC, DE, HL, IX.
; SIDE EFFECTS: Uses the VDP command engine and restores R#15 = S#0.
bitmap_boss_death_draw:
    call bitmap_boss_death_config
    ld a, (hl)                 ; low 7 bits = cycle slots; bit 7 = ordered compact animation
${hasDeathLegacyVariant ? `    bit 7, a
    jr z, .death_random_variant
` : ''}    and #7F
    ld b, a
    ld a, (boss_death_left)    ; N..1 = reversed frame records; 0 = rebuild body
    call bitmap_boss_death_mod
    or a
    jr nz, .death_compact_frame
    ; End of one compact animation: reconstruct the complete frozen Boss from
    ; its atlas. This clears every previous transparent stamp in one opaque HMMM
    ; and also leaves the final hold clean before the Boss is removed.
    call bitmap_boss_table_ix
    jp bitmap_boss_draw
.death_compact_frame:
${hasDeathCompactAnim ? `    ; Every frame of ONE blast must land on the SAME spot. Instead of storing that
    ; spot, seed the placement PRNG from a value that is constant inside a blast
    ; -- the step counter minus the selector, i.e. where this blast started --
    ; so the shared position code below draws the very same offsets again.
    ; Two mixing rounds first: consecutive blasts differ by one cycle, and
    ; feeding that straight in put them 2 pixels apart.
    ld c, a
    ld a, (boss_death_left)
    sub c
    ld (boss_death_seed), a
    call bitmap_boss_death_rand
    call bitmap_boss_death_rand
    ; Wipe the previous frame by repainting the frozen body: LMMM + TIMP would
    ; otherwise stack this blast's frames on top of each other instead of
    ; replacing them. On a blast's first frame the body is already clean, and
    ; testing for that costs more ROM than the redundant repaint.
    push bc                    ; bitmap_boss_draw destroys BC, and C is the frame
    push hl
${hasDeathSound ? `    ; One explosion = one sound. A compact blast spends one cadence step per
    ; animation frame, so only the frame that OPENS the cycle (selector =
    ; slots-1) starts the SFX; the rest let it play on. It rides the push/pop
    ; pair below because bitmap_boss_death_sfx_start also destroys BC and HL.
    ld a, b
    dec a
    cp c
    call z, bitmap_boss_death_sfx_start
` : ''}    call bitmap_boss_table_ix
    call bitmap_boss_draw
    pop hl
    pop bc
    ld a, c
    dec a                      ; selectors N..1 map to reversed records N-1..0` : `    dec a                      ; selectors N..1 map to reversed records N-1..0`}
    jr .death_variant_selected
${hasDeathLegacyVariant ? `.death_random_variant:
    ld b, a
    call bitmap_boss_death_rand
    call bitmap_boss_death_mod
` : ''}.death_variant_selected:
    ld c, a                    ; selected record index
    ld de, ${deathHeaderBytes}
    add hl, de                 ; skip table header
    ld a, c
    or a
    jr z, .death_record_ready
.death_record_seek:
    ld de, 6
    add hl, de
    dec c
    jr nz, .death_record_seek
.death_record_ready:
    push hl
    pop ix
    ld l, (ix+0)
    ld h, (ix+1)
    ld (boss_cmd_buf + 0), hl  ; SX
    ld l, (ix+2)
    ld h, (ix+3)
    ld (boss_cmd_buf + 2), hl  ; SY (already 512-based)
    ld l, (ix+4)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX
    ld l, (ix+5)
    ld (boss_cmd_buf + 10), hl ; NY

    ; Random X offset in [0, bodyWidth - explosionWidth].
    call bitmap_boss_table_ix_shadow
    ld a, (hl)
    ld b, a
    ld a, (boss_cmd_buf + 8)
    ld c, a
    ld a, b
    sub c
    inc a
    ld b, a
    call bitmap_boss_death_rand
    call bitmap_boss_death_mod
    ld b, a
    ld a, (boss_x)
    add a, b
    ld (boss_cmd_buf + 4), a   ; DX
    xor a
    ld (boss_cmd_buf + 5), a

    ; Random Y offset in [0, bodyHeight - explosionHeight].
    inc hl                     ; body height
    ld a, (hl)
    ld b, a
    ld a, (boss_cmd_buf + 10)
    ld c, a
    ld a, b
    sub c
    inc a
    ld b, a
    call bitmap_boss_death_rand
    call bitmap_boss_death_mod
    ld b, a
    ld a, (boss_y)
    add a, b
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl  ; DY = visible page
    xor a
    ld (boss_cmd_buf + 12), a  ; CLR unused
    ld (boss_cmd_buf + 13), a  ; ARG = 0
    ld a, #98
    ld (boss_cmd_buf + 14), a  ; LMMM + TIMP
    jp bitmap_boss_launch_cmd

${hasDeathAnim ? `; FUNCTION: bitmap_boss_death_frame_hl
; PURPOSE: HL -> the 6-byte record of animation frame A in the current room.
; INPUT: A = frame index. OUTPUT: HL -> sxLo, sxHi, syLo, syHi, w, h.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX.
bitmap_boss_death_frame_hl:
    push af
    call bitmap_boss_death_config
    ld de, ${deathHeaderBytes}
    add hl, de                 ; HL -> frame 0
    pop af
    or a
    ret z
    ld b, a
    ld de, 6
.dfx_frame_seek:
    add hl, de
    djnz .dfx_frame_seek
    ret

` : ''}${hasDeathAnim ? `; ------------------------------------------------------------
; ANIMATED DEATH EXPLOSIONS
; ------------------------------------------------------------
; The room's stamp list is ONE explosion: its frames, in order, all the same
; size. Up to ${DEATH_ANIM_SLOTS} of them play at once at random even offsets inside the
; frozen body, and each is erased when its last frame ends by repainting the
; body rectangle it covered (opaque HMMM straight from the atlas copy of the
; body, so the room behind the boss is never touched).
;
; VDP BUDGET: at most ONE slot advances per game frame (erase + stamp = two
; commands) and a new blast never spawns on a frame that already advanced one.
; Slots whose timer expires on a busy frame retry on the next one, which is
; invisible at these cadences and keeps the player at 60fps while the boss dies.

; FUNCTION: bitmap_boss_death_anim_dest
; PURPOSE: Fill DX/DY of the command block from the serviced slot's offset
;   inside the frozen body. Both the stamp and its erase use this rectangle.
; INPUT: boss_death_ptr -> slot. DESTROYS: AF, DE, HL. PRESERVES: BC, IX.
bitmap_boss_death_anim_dest:
    ld hl, (boss_death_ptr)
    ld de, 3
    add hl, de                 ; HL -> rx
    ld a, (boss_x)
    and #FE                    ; the body itself is drawn on a byte boundary
    add a, (hl)
    ld (boss_cmd_buf + 4), a   ; DX
    xor a
    ld (boss_cmd_buf + 5), a
    inc hl                     ; HL -> ry
    ld a, (boss_y)
    add a, (hl)
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl  ; DY = visible page
    ret

; FUNCTION: bitmap_boss_death_anim_draw
; PURPOSE: Composite the serviced slot's current frame over the body with
;   LMMM/TIMP (#98), so colour 0 shows the boss through the explosion.
; INPUT: boss_death_ptr -> slot. DESTROYS: AF, BC, DE, HL, IX.
; SIDE EFFECTS: Uses the VDP command engine and restores R#15 = S#0.
bitmap_boss_death_anim_draw:
    ld hl, (boss_death_ptr)
    inc hl
    ld a, (hl)                 ; frame index
    call bitmap_boss_death_frame_hl
    push hl
    pop ix
    ld l, (ix+0)
    ld h, (ix+1)
    ld (boss_cmd_buf + 0), hl  ; SX = frame in the shared atlas
    ld l, (ix+2)
    ld h, (ix+3)
    ld (boss_cmd_buf + 2), hl  ; SY (already 512-based)
    ld l, (ix+4)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX
    ld l, (ix+5)
    ld (boss_cmd_buf + 10), hl ; NY
    call bitmap_boss_death_anim_dest
    xor a
    ld (boss_cmd_buf + 12), a  ; CLR unused
    ld (boss_cmd_buf + 13), a  ; ARG = 0
    ld a, #98
    ld (boss_cmd_buf + 14), a  ; LMMM + TIMP
    jp bitmap_boss_launch_cmd

; FUNCTION: bitmap_boss_death_anim_erase
; PURPOSE: Repaint the body rectangle the serviced slot's current frame covers,
;   copying it from the body's own atlas graphic. rx/ry are even, so this is a
;   fast opaque HMMM.
; INPUT: boss_death_ptr -> slot. DESTROYS: AF, BC, DE, HL, IX.
; SIDE EFFECTS: Uses the VDP command engine and restores R#15 = S#0.
bitmap_boss_death_anim_erase:
    ld hl, (boss_death_ptr)
    inc hl
    ld a, (hl)
    call bitmap_boss_death_frame_hl
    push hl
    pop ix
    ld l, (ix+4)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX = frame width
    ld l, (ix+5)
    ld (boss_cmd_buf + 10), hl ; NY = frame height
    ; Source = the same rectangle inside the body graphic: the boss is frozen
    ; during the death sequence, so boss_sx still names its last drawn frame.
    ld hl, (boss_death_ptr)
    ld de, 3
    add hl, de
    ld e, (hl)                 ; rx
    inc hl
    ld c, (hl)                 ; ry
    ld d, 0
    ld hl, (boss_sx)
    add hl, de
    ld (boss_cmd_buf + 0), hl  ; SX = body column under the blast
    call bitmap_boss_table_ix
    ld l, (ix+11)
    ld h, (ix+12)              ; body atlas row (512-based)
    ld e, c
    ld d, 0
    add hl, de
    ld (boss_cmd_buf + 2), hl  ; SY = body row under the blast
    call bitmap_boss_death_anim_dest
    jp bitmap_boss_finish_hmmm

; FUNCTION: bitmap_boss_death_anim_busy
; PURPOSE: Is any explosion still playing?
; OUTPUT: A = 1 while a slot is active, 0 when they have all finished.
; DESTROYS: AF, BC, DE, HL.
bitmap_boss_death_anim_busy:
    ld hl, boss_death_slots
    ld b, ${DEATH_ANIM_SLOTS}
    ld de, BOSS_DFX_SLOT
.dfx_busy_scan:
    ld a, (hl)
    or a
    ret nz                     ; active is stored as 1
    add hl, de
    djnz .dfx_busy_scan
    xor a
    ret

; FUNCTION: bitmap_boss_death_anim_step
; PURPOSE: Tick every live explosion and advance AT MOST ONE of them; the others
;   retry next frame so a single frame never pays for two erase+stamp pairs.
; OUTPUT: A = 1 when this frame's VDP budget was spent, 0 when it is still free.
; DESTROYS: AF, BC, DE, HL, IX.
bitmap_boss_death_anim_step:
    ld hl, boss_death_slots
    ld b, ${DEATH_ANIM_SLOTS}
    ld c, 0                    ; slot claiming this frame, 1-based (0 = none)
    ld d, 1                    ; slot being scanned
.dfx_step_scan:
    ld a, (hl)
    or a
    jr z, .dfx_step_next           ; free slot
    inc hl
    inc hl                     ; HL -> timer
    dec (hl)
    jr nz, .dfx_step_rewind
    ld a, c
    or a
    jr nz, .dfx_step_defer         ; another slot already owns the budget
    ld c, d                    ; claim it
    jr .dfx_step_rewind
.dfx_step_defer:
    ld (hl), 1                 ; expired but deferred: retry next frame
.dfx_step_rewind:
    dec hl
    dec hl
.dfx_step_next:
    push de
    ld de, BOSS_DFX_SLOT
    add hl, de
    pop de
    inc d
    djnz .dfx_step_scan
    ld a, c
    or a
    ret z                      ; nothing to advance
    ; HL = boss_death_slots + (C - 1) * BOSS_DFX_SLOT
    dec c
    ld hl, boss_death_slots
    ld a, c
    or a
    jr z, .dfx_step_ready
    ld de, BOSS_DFX_SLOT
.dfx_step_seek:
    add hl, de
    dec a
    jr nz, .dfx_step_seek
.dfx_step_ready:
    ld (boss_death_ptr), hl
    ; fall through: the advance always spends the budget and returns A = 1

; FUNCTION: bitmap_boss_death_anim_advance
; PURPOSE: Erase the frame on screen and either stamp the next one or retire the
;   slot (the erase already left the body clean).
; INPUT: boss_death_ptr -> slot. OUTPUT: A = 1.
; DESTROYS: AF, BC, DE, HL, IX.
bitmap_boss_death_anim_advance:
    call bitmap_boss_death_anim_erase
    ld hl, (boss_death_ptr)
    inc hl
    ld a, (hl)
    inc a
    ld (hl), a                 ; next frame index
    push af
    call bitmap_boss_death_config
    ld a, (hl)                 ; header +0 = frame count
    ld b, a
    pop af
    cp b
    jr c, .dfx_advance_draw
    ld hl, (boss_death_ptr)
    ld (hl), 0                 ; animation over: the slot is free again
    ld a, 1
    ret
.dfx_advance_draw:
    call bitmap_boss_death_config
    ld de, 4
    add hl, de
    ld a, (hl)                 ; header +4 = frames per animation frame
    ld hl, (boss_death_ptr)
    inc hl
    inc hl
    ld (hl), a                 ; timer
    call bitmap_boss_death_anim_draw
    ld a, 1
    ret

; FUNCTION: bitmap_boss_death_anim_spawn
; PURPOSE: Start one explosion in a free slot at a random even offset inside the
;   body and stamp its first frame.
; OUTPUT: A = 1 when a slot took it, 0 when all ${DEATH_ANIM_SLOTS} are busy.
; DESTROYS: AF, BC, DE, HL, IX.
bitmap_boss_death_anim_spawn:
    ld hl, boss_death_slots
    ld b, ${DEATH_ANIM_SLOTS}
    ld de, BOSS_DFX_SLOT
.dfx_spawn_find:
    ld a, (hl)
    or a
    jr z, .dfx_spawn_found
    add hl, de
    djnz .dfx_spawn_find
    xor a
    ret
.dfx_spawn_found:
    ld (boss_death_ptr), hl
    ld (hl), 1                 ; +0 active
    inc hl
    ld (hl), 0                 ; +1 frame index
    ; Every frame shares its size, so frame 0 gives the blast rectangle.
    xor a
    call bitmap_boss_death_frame_hl
    ld de, 4
    add hl, de
    ld c, (hl)                 ; C = frame width
    inc hl
    ld b, (hl)                 ; B = frame height
    push bc
    call bitmap_boss_table_ix_shadow   ; HL -> body width
    ld a, (hl)
    sub c
    inc a
    ld b, a                    ; range = bodyW - frameW + 1
    push hl
    call bitmap_boss_death_rand
    call bitmap_boss_death_mod
    and #FE                    ; even column: the erase stays a fast HMMM
    pop hl
    ld c, a                    ; C = rx
    inc hl                     ; HL -> body height
    ld a, (hl)
    pop de                     ; D = frame height, E = frame width
    sub d
    inc a
    ld b, a                    ; range = bodyH - frameH + 1
    call bitmap_boss_death_rand
    call bitmap_boss_death_mod
    ld b, a                    ; B = ry
    ld hl, (boss_death_ptr)
    ld de, 3
    add hl, de
    ld (hl), c                 ; +3 rx
    inc hl
    ld (hl), b                 ; +4 ry
    call bitmap_boss_death_config
    ld de, 4
    add hl, de
    ld a, (hl)                 ; frames per animation frame
    ld hl, (boss_death_ptr)
    inc hl
    inc hl
    ld (hl), a                 ; +2 timer
${hasDeathSound ? `    call bitmap_boss_death_sfx_start
` : ''}    call bitmap_boss_death_anim_draw
    ld a, 1
    ret

; FUNCTION: bitmap_boss_death_update_anim
; PURPOSE: Animated presentation: keep the live explosions moving, spawn the
;   next blast on cadence, and finalize only after the last one has played out
;   and the authored hold elapsed.
; INPUT: boss_active = 2 in a room whose table is animated.
; DESTROYS: AF, BC, DE, HL, IX.
bitmap_boss_death_update_anim:
    call bitmap_boss_death_anim_step
    ld c, a                    ; C = 1 when the VDP budget is already spent
    ld hl, boss_death_tick
    dec (hl)
    ret nz
    ld a, (boss_death_left)
    cp #FF
    jp z, bitmap_boss_finalize_death   ; the hold ran out
    or a
    jr z, .dfx_anim_no_blasts_left
    ld a, c
    or a
    jr nz, .dfx_anim_retry_next_frame      ; do not stack three commands on one frame
    call bitmap_boss_death_anim_spawn
    or a
    jr z, .dfx_anim_retry_next_frame       ; every slot busy
    ld hl, boss_death_left
    dec (hl)
    call bitmap_boss_death_config
    inc hl
    inc hl                     ; header +2 = frames between blasts
    ld a, (hl)
    ld (boss_death_tick), a
    ret
.dfx_anim_retry_next_frame:
    ld a, 1
    ld (boss_death_tick), a
    ret
.dfx_anim_no_blasts_left:
    call bitmap_boss_death_anim_busy
    or a
    jr nz, .dfx_anim_retry_next_frame      ; wait for the last explosion to finish
    ld a, #FF
    ld (boss_death_left), a            ; from here the next expiry finalizes
    call bitmap_boss_death_config
    inc hl
    inc hl
    inc hl                     ; header +3 = final hold
    ld a, (hl)
    ld (boss_death_tick), a
    ret

` : ''}` : ''}; FUNCTION: bitmap_boss_kill
; ------------------------------------------------------------
; PURPOSE: Stop active projectiles and start the configured bitmap-explosion
;   presentation. With no valid stamps in this room, finalizes immediately.
; INPUT: Boss HP reached zero. OUTPUT: boss_active = 2 while death FX run, or
;   0 after immediate finalization.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX.
; ------------------------------------------------------------
bitmap_boss_kill:
${hasLaser ? `    call bitmap_boss_laser_restore_all
` : ''}
${hasHitBlast ? `    ; The killing blow armed a blast one instruction ago. Drop it: the death
    ; sequence owns the body from here and paints its own explosions.
    xor a
    ld (boss_blast_timer), a
` : ''}${hasSpriteProjectiles ? `    ; Retire any bullet still in flight and push the hidden SAT entries out NOW:
    ; the normal SAT writer no longer advances during the death presentation.
    xor a
${Array.from({ length: spriteSlots }, (_v, i) => `    ld (boss_sbul_pool + ${i * BOSS_SBUL_SLOT_BYTES}), a`).join('\n')}
    push ix
    call bitmap_boss_sbul_sat
    pop ix
` : ''}${hasBitmapProjectiles ? `    ; A bitmap projectile owns a saved-background rectangle. Restore its current
    ; position before retiring it, otherwise its last frame remains on screen.
    push ix
    call bitmap_boss_proj_config_ix
    ld a, (boss_proj_active)
    or a
    jr z, .kill_bitmap_projectile_done
    ld a, (boss_proj_x)
    ld (boss_proj_ox), a
    ld a, (boss_proj_y)
    ld (boss_proj_oy), a
    call bitmap_boss_proj_restore
    xor a
    ld (boss_proj_active), a
.kill_bitmap_projectile_done:
    pop ix
` : ''}${hasDeathFx ? `    call bitmap_boss_death_config
    ld a, (hl)                 ; number of valid explosion stamps
    or a
    jp nz, .kill_death_fx_ready
${hasDeathSound ? `    call bitmap_boss_death_sfx_start  ; no bitmap selected: still make the defeat audible
` : ''}    jp bitmap_boss_finalize_death
.kill_death_fx_ready:
${hasDeathMusicHold ? `${musicMuteAsm}   ; the song stops until the last blast is gone (touches AF only, HL survives)
` : ''}    inc hl
    ld a, (hl)                 ; total blast count
    ld (boss_death_left), a
    ld a, 1                    ; first blast on the next game frame
    ld (boss_death_tick), a
${hasDeathAnim ? `    xor a
${Array.from({ length: DEATH_ANIM_SLOTS }, (_v, i) => `    ld (boss_death_slots + ${i * DEATH_ANIM_SLOT_BYTES}), a   ; no explosion playing yet`).join('\n')}
` : ''}
    ld a, (current_screen_index)
    ld hl, boss_x
    xor (hl)
    ld hl, boss_y
    xor (hl)
    xor #A5
    jr nz, .death_seed_ready
    inc a                      ; PRNG state must not start at zero
.death_seed_ready:
    ld (boss_death_seed), a
    ld a, 2
    ld (boss_active), a
${hasIntro ? `    xor a
    ld (boss_intro_state), a
    ld (boss_intro_auto_move), a
` : ''}    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_finalize_death
; ------------------------------------------------------------
; PURPOSE: Commit the persistent defeat, run progress actions, remove the room
;   barrier and restore the full boss rectangle from the clean page.
; INPUT: Death presentation finished (or was not configured).
; OUTPUT: boss_active = 0, boss_defeated[current room] = 1.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX.
; ------------------------------------------------------------
bitmap_boss_finalize_death:
${hasDeathMusicHold ? `${musicResumeAsm}   ; sequence over: the song comes back
` : ''}` : ''}${hasDeathSound && !hasDeathFx ? `    call bitmap_boss_death_sfx_start  ; immediate visual defeat still has the default/selected sound
` : ''}    xor a
    ld (boss_active), a
${hasIntro ? `    ld (boss_intro_state), a
    ld (boss_intro_auto_move), a
` : ''}    ${roomPoolIndexLoad}
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, boss_defeated
    add hl, de
    ld a, 1
    ld (hl), a
    ; The room-wide confrontation remains locked until BOTH independent
    ; instances have finalized. An absent slot is marked defeated at load.
    ${roomPoolIndexLoad}
    add a, a
    ld e, a
    ld d, 0
    ld hl, boss_defeated
    add hl, de
    ld a, (hl)
    inc hl
    or (hl)
    jr z, .boss_pair_not_defeated
${hasDefeatActions ? '    call bitmap_boss_run_defeat_actions   ; Phase A onDefeated bytecode\n' : ''}${hasBarrier ? '    call bitmap_boss_barrier_remove   ; Phase B: drop the chain (collision + graphics)\n' : ''}.boss_pair_not_defeated:
    ; full-rect restore from page 1
    call bitmap_boss_table_ix_shadow   ; HL -> width
    ld a, (boss_x)
    and #FE
    ld (boss_cmd_buf + 0), a
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 1), a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_y)
    add a, ${asmByte(gameY)}
    ld e, a
    ld a, (bitmap_displayed_page)
    ld d, a
    ld (boss_cmd_buf + 6), de  ; DY = visible page
    xor 1
    ld d, a
    ld (boss_cmd_buf + 2), de  ; SY = clean page
    ld a, (hl)                 ; width
    ld e, a
    ld d, 0
    ld (boss_cmd_buf + 8), de
    inc hl
    ld a, (hl)                 ; height
    ld e, a
    ld (boss_cmd_buf + 10), de
    jp bitmap_boss_finish_hmmm
${hasDefeatActions ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_run_defeat_actions
; ------------------------------------------------------------
; PURPOSE: Interpret the current room's Boss Defeat Actions bytecode when the
;   boss dies. Phase A opcodes: END (#00), SET_FLAG (#01, arg=flag index ->
;   boss_flags[index]=1). Unknown/future opcodes stop the stream cleanly.
; INPUT: current_screen_index. OUTPUT: boss_flags. DESTROYS: AF, DE, HL.
;   Preserves BC and IX (bitmap_boss_kill runs inside the bullet-hit contract).
; ------------------------------------------------------------
bitmap_boss_run_defeat_actions:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_defeat_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> room defeat stream
.next_op:
    ld a, (hl)
    inc hl
    or a
    ret z                      ; END
${flagCount > 0 ? `    cp ${asmByte(DEFEAT_OP_SET_FLAG)}
    jr z, .op_set_flag
` : ''}${hasGiveKey ? `    cp ${asmByte(DEFEAT_OP_GIVE_KEY)}
    jr z, .op_give_key
` : ''}${hasOpenDoor ? `    cp ${asmByte(DEFEAT_OP_OPEN_DOOR)}
    jr z, .op_open_door
` : ''}${hasShowMessage ? `    cp ${asmByte(DEFEAT_OP_SHOW_MESSAGE)}
    jr z, .op_show_message
` : ''}${hasChangeScreen ? `    cp ${asmByte(DEFEAT_OP_CHANGE_SCREEN)}
    jr z, .op_change_screen
` : ''}    ret                        ; unknown opcode: stop cleanly
${flagCount > 0 ? `.op_set_flag:
    ld a, (hl)                 ; arg = flag index
    inc hl
    ld e, a
    ld d, 0
    push hl
    ld hl, boss_flags
    add hl, de
    ld a, 1
    ld (hl), a
    pop hl
    jr .next_op
` : ''}${hasGiveKey ? `.op_give_key:
    ld a, (hl)                 ; arg = how many keys
    inc hl
    ld e, a
    ld a, (bitmap_key_count)
    add a, e
    jr nc, .give_key_store
    ld a, #FF                  ; saturate instead of wrapping to zero
.give_key_store:
    ld (bitmap_key_count), a
    jr .next_op
` : ''}${hasOpenDoor ? `.op_open_door:
    ld a, (hl)                 ; arg = door open-flag offset
    inc hl
    ld e, a
    ld d, 0
    push hl
    ld hl, bitmap_key_door_open_flags
    add hl, de
    ld a, 1
    ld (hl), a                 ; the door redraw picks this up next frame
    pop hl
    jr .next_op
` : ''}${hasShowMessage ? `.op_show_message:
    ld a, (hl)                 ; arg = dialogue index
    inc hl
    push hl
    call bitmap_dlg_open       ; reuses the NPC text box, typewriter and all
    pop hl
    jr .next_op
` : ''}${hasChangeScreen ? `.op_change_screen:
    ld a, (hl)                 ; arg 1 = destination room index
    inc hl
    ld (bitmap_pending_room), a
    ld a, (hl)                 ; arg 2 = entry X (#FF = leave the player be)
    inc hl
    cp #FF
    jr z, .op_change_keep_x
    ld (bitmap_key_pending_entry_x), a
    ld a, (hl)                 ; arg 3 = entry Y
    ld (bitmap_key_pending_entry_y), a
    inc hl
    jr .op_change_go
.op_change_keep_x:
    inc hl                     ; skip the unused Y
    ld a, (player_x)
    ld (bitmap_key_pending_entry_x), a
    ld a, (player_y)
    ld (bitmap_key_pending_entry_y), a
.op_change_go:
    ; Queue the room flip and stop: whatever came after belongs to a room the
    ; player is already leaving.
    jp start_key_door_transition
` : ''}
` : ''}${hasIntro ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_intro_begin
; ------------------------------------------------------------
; PURPOSE: Restart the current room's intro. The mandatory first state is an
;   automatic horizontal walk to the player's body-centred screen X; authored
;   Room Lock bytecode starts only after player physics clears that flag.
;   Called on every room entry while alive; no persistent "intro seen" flag.
; INPUT: current_screen_index.
; OUTPUT: boss_intro_state=5 and boss_intro_auto_move=1.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
; ------------------------------------------------------------
bitmap_boss_intro_begin:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_intro_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld (boss_intro_ptr), hl
    ; Per-room auto-walk destination (byte table, parallel to the bytecode one).
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_intro_entry_x_table
    add hl, de
    ld a, (hl)
    ld (boss_intro_target_x), a
    xor a
    ld (boss_intro_raster_y), a
    inc a
    ld (boss_intro_auto_move), a
    ld a, 5
    ld (boss_intro_state), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_intro_frame
; ------------------------------------------------------------
; PURPOSE: Advance one Room Lock frame. State 5 waits while normal player
;   physics performs the mandatory auto-walk. Dispatch consumes opcodes; WAIT,
;   DIALOGUE and CLOSE_BARRIER keep ownership until their step completes.
; INPUT: boss_intro_state / boss_intro_ptr.
; OUTPUT: boss intro RAM and, for barrier/dialogue steps, VRAM/dialogue state.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; CALLS: bitmap_dlg_open (when authored), bitmap_boss_barrier_cell.
; SIDE EFFECTS: State 5 permits only forced walking + gravity; other non-zero
;   states freeze player movement.
; ------------------------------------------------------------
bitmap_boss_intro_frame:
    ld a, (boss_intro_state)
    cp 5
    ret z                       ; auto-walk is advanced inside player movement
    cp 2
    jp z, bitmap_boss_intro_wait
${hasIntroDialogue ? `    cp 3
    jp z, bitmap_boss_intro_dialogue_wait
` : ''}${hasIntroClose && hasBarrier ? `    cp 4
    jp z, bitmap_boss_intro_barrier_frame
` : ''}    ; state 1 (or a defensive unknown state) dispatches the next opcode.
bitmap_boss_intro_dispatch:
    ld hl, (boss_intro_ptr)
    ld a, (hl)
    inc hl
    ld (boss_intro_ptr), hl
    or a
    jp z, bitmap_boss_intro_end
    cp ${asmByte(INTRO_OP_CLOSE_BARRIER)}
    jp z, bitmap_boss_intro_start_barrier
${hasIntroDialogue ? `    cp ${asmByte(INTRO_OP_DIALOGUE)}
    jp z, bitmap_boss_intro_start_dialogue
` : ''}    cp ${asmByte(INTRO_OP_WAIT)}
    jp z, bitmap_boss_intro_start_wait
    ; Unknown byte: fail closed by ending the intro, never walk random ROM.
    jp bitmap_boss_intro_end

bitmap_boss_intro_start_wait:
    ld hl, (boss_intro_ptr)
    ld a, (hl)
    inc hl
    ld (boss_intro_ptr), hl
    ld (boss_intro_counter), a
    ld a, 2
    ld (boss_intro_state), a
    ret
bitmap_boss_intro_wait:
    ld hl, boss_intro_counter
    dec (hl)
    ret nz
    ld a, 1
    ld (boss_intro_state), a
    ret

${hasIntroDialogue ? `bitmap_boss_intro_start_dialogue:
    ld hl, (boss_intro_ptr)
    ld a, (hl)                 ; runtime dialogue index
    inc hl
    ld (boss_intro_ptr), hl
    push af
    ld a, #21                  ; UP or SPACE advances the scripted dialogue
    ld (bitmap_dlg_key_mask), a
    ld a, 1                    ; held entry input cannot fast-forward line 1
    ld (bitmap_dlg_lock), a
    pop af
    call bitmap_dlg_open
    ld a, 3
    ld (boss_intro_state), a
    ret
bitmap_boss_intro_dialogue_wait:
    ld a, (bitmap_dlg_state)
    or a
    ret nz
    ld a, 1
    ld (boss_intro_state), a
    ret

` : ''}bitmap_boss_intro_start_barrier:
${hasBarrier ? `    call bitmap_boss_barrier_begin_apply
    or a
    jp z, bitmap_boss_intro_skip_argument
    xor a
    ld (boss_intro_raster_y), a
    ld hl, (boss_intro_ptr)
    ld a, (hl)
    cp #FF
    jp z, bitmap_boss_intro_barrier_instant
    ld a, 4
    ld (boss_intro_state), a
    ret
bitmap_boss_intro_barrier_instant:
    call bitmap_boss_barrier_walk_cells
    jp bitmap_boss_intro_barrier_done
` : `    ; No valid barrier tile exists anywhere in this project.
    jp bitmap_boss_intro_skip_argument
`}bitmap_boss_intro_skip_argument:
    ld hl, (boss_intro_ptr)
    inc hl
    ld (boss_intro_ptr), hl
    ld a, 1
    ld (boss_intro_state), a
    ret

${hasIntroClose && hasBarrier ? `bitmap_boss_intro_barrier_frame:
    ld hl, (boss_intro_ptr)    ; CLOSE_BARRIER argument stays live until done
    ld a, (hl)
    ld (boss_intro_counter), a ; horizontal pixel lines this frame
.intro_barrier_loop:
    ld a, (boss_intro_raster_y)
    cp 192
    jp nc, bitmap_boss_intro_barrier_done
    call bitmap_boss_barrier_raster_line
    ld hl, boss_intro_raster_y
    inc (hl)
    ld hl, boss_intro_counter
    dec (hl)
    jp nz, .intro_barrier_loop
    ret
bitmap_boss_intro_barrier_done:
    ld hl, (boss_intro_ptr)
    inc hl                     ; consume linesPerFrame
    ld (boss_intro_ptr), hl
    ld a, 1
    ld (boss_intro_state), a
    ret

` : ''}bitmap_boss_intro_end:
    xor a
    ld (boss_intro_state), a
    ld (boss_intro_auto_move), a
    ret
` : ''}

${hasBarrier && !opts.playerOverlapHelperAvailable ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_player_overlaps_16  (barrier-local copy)
; ------------------------------------------------------------
; PURPOSE: Player body hitbox vs a 16x16 cell. Normally the key/door subsystem
;   owns this routine, but that block is absent in a project with no keys, doors
;   or pickups, and bitmap_boss_barrier_cell calls it unconditionally — which
;   made such a project fail to assemble. Emitted here only when nobody else
;   provides it, so projects that DO have key/door content keep one copy and
;   their exact bytes.
; INPUT: D = cell X, E = cell Y.
; OUTPUT: A = 1 / NZ when overlapping, A = 0 / Z when clear.
; DESTROYS: AF, B. PRESERVES: C, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_player_overlaps_16:
    ld a, (player_x)
${hit.x + Math.max(1, hit.w) - 1 > 0 ? `    add a, ${asmByte(hit.x + Math.max(1, hit.w) - 1)}\n` : ''}    cp d
    jp c, .boss_overlap_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
${hit.x > 0 ? `    add a, ${asmByte(hit.x)}\n` : ''}    cp b
    jp z, .boss_overlap_x_ok
    jp nc, .boss_overlap_no
.boss_overlap_x_ok:
    ld a, (player_y)
${hit.y + Math.max(1, hit.h) - 1 > 0 ? `    add a, ${asmByte(hit.y + Math.max(1, hit.h) - 1)}\n` : ''}    cp e
    jp c, .boss_overlap_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
${hit.y > 0 ? `    add a, ${asmByte(hit.y)}\n` : ''}    cp b
    jp z, .boss_overlap_yes
    jp nc, .boss_overlap_no
.boss_overlap_yes:
    ld a, 1
    or a
    ret
.boss_overlap_no:
    xor a
    ret
` : ''}${hasBarrier ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_barrier_apply / bitmap_boss_barrier_remove
; ------------------------------------------------------------
; PURPOSE: Raise (apply) or drop (remove) the chain barrier around the whole
;   room perimeter (row 0, row 11, col 0, col 15). apply paints the chain tile
;   and marks the cells solid; remove restores the clean room from page 1 and
;   clears the collision. A room with no barrier tile is a no-op (present=0).
; A cell the player is standing on is NEVER sealed (that is the doorway they
;   just walked in through): it is left open, boss_barrier_pending is set, and
;   bitmap_boss_update re-runs apply until the player has moved off it.
; INPUT: current_screen_index. OUTPUT: bitmap_room_collision_map + VRAM page 0.
; DESTROYS: AF, BC, DE, HL. Preserves IX (runs inside the boss_kill contract).
; ------------------------------------------------------------
bitmap_boss_barrier_apply:
    call bitmap_boss_barrier_begin_apply
    ret z
    jp bitmap_boss_barrier_walk_cells

; Prepare an apply pass and cache the current room's atlas source.
; OUTPUT: A=1/NZ when a barrier is present, A=0/Z otherwise.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
bitmap_boss_barrier_begin_apply:
    xor a
    ld (boss_barrier_pending), a   ; this sweep decides what is left open
    ld (boss_barrier_draw), a
    call bitmap_boss_barrier_load_source
    ret z
    ld a, 1
    ld (boss_barrier_draw), a
    ld a, 8
    ld (boss_barrier_retry), a     ; frames until the next sweep, if needed
    ld a, 1
    ret

; Repaint only cells already marked #80 after dialogue restored the clean room.
; This deliberately does not seal new cells or change collision.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
bitmap_boss_barrier_redraw:
    call bitmap_boss_barrier_load_source
    ret z
    ld a, 2
    ld (boss_barrier_draw), a
    call bitmap_boss_barrier_walk_cells
    ld a, 1
    ld (boss_barrier_draw), a
    ret
bitmap_boss_barrier_remove:
    xor a
    ld (boss_barrier_draw), a
bitmap_boss_barrier_walk:
    call bitmap_boss_barrier_load_source
    ret z
    jp bitmap_boss_barrier_walk_cells

; Load this room's barrier source coordinates from the per-room table.
; OUTPUT: A=1/NZ when present, A=0/Z when absent.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
bitmap_boss_barrier_load_source:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_barrier_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> barrier table (present, sxLo, sxHi, syLo, syHi)
    ld a, (hl)
    or a
    ret z                      ; no chain barrier in this room
    inc hl
    ld a, (hl)
    ld (boss_barrier_sx), a
    inc hl
    ld a, (hl)
    ld (boss_barrier_sx + 1), a
    inc hl
    ld a, (hl)
    ld (boss_barrier_sy), a
    inc hl
    ld a, (hl)
    ld (boss_barrier_sy + 1), a
    ld a, 1
    ret

bitmap_boss_barrier_walk_cells:
    ld c, 0                    ; top row
    call bitmap_boss_barrier_row
    ld c, 11                   ; bottom row
    call bitmap_boss_barrier_row
    ld b, 0                    ; left column
    call bitmap_boss_barrier_col
    ld b, 15                   ; right column
    jp bitmap_boss_barrier_col

; Paint one horizontal pixel line while keeping the barrier on the perimeter.
; Pixel lines 0..15 and 176..191 visit all 16 columns; the lines in between
; visit only the left/right edge. Collision is committed by the scanline-cell
; helper when the 16th and final source line of that cell has been drawn.
; INPUT: boss_intro_raster_y (0..191).
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
bitmap_boss_barrier_raster_line:
    ld a, (boss_intro_raster_y)
    rrca
    rrca
    rrca
    rrca
    and #0F
    ld c, a                    ; collision-map row = raster Y / 16
    ld a, c
    or a
    jp z, bitmap_boss_barrier_scanline_full
    cp 11
    jp z, bitmap_boss_barrier_scanline_full
    ld b, 0
    push bc
    call bitmap_boss_barrier_scanline_cell
    pop bc
    ld b, 15
    jp bitmap_boss_barrier_scanline_cell

bitmap_boss_barrier_scanline_full:
    ld b, 0
.scanline_col_loop:
    push bc
    call bitmap_boss_barrier_scanline_cell
    pop bc
    inc b
    ld a, b
    cp 16
    jr c, .scanline_col_loop
    ret

; Iterate one horizontal edge (C = fixed row, cols 0..15).
bitmap_boss_barrier_row:
    ld b, 0
.row_loop:
    push bc
    call bitmap_boss_barrier_cell
    pop bc
    inc b
    ld a, b
    cp 16
    jr c, .row_loop
    ret

; Iterate one vertical edge (B = fixed col, rows 1..10; corners done by rows).
bitmap_boss_barrier_col:
    ld c, 1
.col_loop:
    push bc
    call bitmap_boss_barrier_cell
    pop bc
    inc c
    ld a, c
    cp 11
    jr c, .col_loop
    ret

; Reveal a 16x16 barrier cell one horizontal source line at a time.
; INPUT: B = col 0..15, C = collision row 0..11, boss_intro_raster_y.
; OUTPUT: on local source line 15, an empty cell becomes solid marker #80.
; DESTROYS: AF, DE, HL. PRESERVES: BC, IX, IY.
bitmap_boss_barrier_scanline_cell:
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a
    add a, b
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de                 ; HL -> collision cell
    ld a, (hl)
    and #BF
    ret nz                     ; existing wall/floor: never paint over it

    ; Keep the same safety contract as the full-cell apply path.
    push bc
    ld a, b
    add a, a
    add a, a
    add a, a
    add a, a
    ld d, a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    call bitmap_player_overlaps_16
    pop bc
    or a
    jp z, .scanline_cell_clear
    ld a, 1
    ld (boss_barrier_pending), a
    ret

.scanline_cell_clear:
    ld a, (boss_intro_raster_y)
    and #0F
    cp 15
    jr nz, .scanline_cell_source
    ld a, #80
    ld (hl), a                 ; collision becomes solid with the final line

.scanline_cell_source:
    ld hl, (boss_barrier_sx)
    ld (boss_cmd_buf + 0), hl
    ld hl, (boss_barrier_sy)
    ld a, (boss_intro_raster_y)
    and #0F
    ld e, a
    ld d, 0
    add hl, de                 ; SY = tile source + local line 0..15
    ld (boss_cmd_buf + 2), hl

    ld a, b
    add a, a
    add a, a
    add a, a
    add a, a
    ld (boss_cmd_buf + 4), a   ; DX = col * 16
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_intro_raster_y)
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl  ; DY = descending absolute raster line
    ld hl, 16
    ld (boss_cmd_buf + 8), hl  ; NX = 16
    ld hl, 1
    ld (boss_cmd_buf + 10), hl ; NY = 1
    push bc
    call bitmap_boss_finish_hmmm
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_barrier_cell
; ------------------------------------------------------------
; PURPOSE: Apply/clear one 16x16 perimeter cell (B = col 0..15, C = row 0..11):
;   write the collision map and blit the chain tile (apply) or restore the
;   clean room from page 1 (clear). Mode = boss_barrier_draw. On apply, a cell
;   the player overlaps is skipped and boss_barrier_pending is raised instead.
; DESTROYS: AF, DE, HL (BC preserved for the caller loop). Preserves IX.
; ------------------------------------------------------------
bitmap_boss_barrier_cell:
    ; ---- collision: index = C*16 + B ----
    ; Tile-by-tile: only EMPTY perimeter cells get the block tile, so existing
    ; tiles (walls/floor/ceiling) are never overwritten in collision OR graphics.
    ; Marker #80 = "sealed opening" (solid, not deadly, above the room's own
    ; collision value range). apply seals empty cells and draws the block tile;
    ; remove clears only #80 cells and restores their graphics. Non-applicable
    ; cells return immediately (no draw), so nothing is clobbered. No save buffer.
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a                   ; A = C*16 (row pixel base, <=176)
    add a, b                   ; + col -> collision index (B < 16)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de                 ; HL -> collision cell
    ld a, (boss_barrier_draw)
    or a
    jr z, .cell_unseal
    cp 2
    jr z, .cell_redraw
    ld a, (hl)                 ; apply: act only on empty cells
    and #BF                    ; drop Deadly bit; Z => passable (empty)
    ret nz                     ; occupied cell -> leave tile fully untouched
    ; The player walks in THROUGH the perimeter, so on room entry they are
    ; standing on one of these cells. Sealing it would bury them inside a
    ; solid tile with no way out, so leave that opening alone and flag it;
    ; bitmap_boss_update sweeps again until they have stepped clear.
    ; bitmap_player_overlaps_16 takes D/E = cell top-left and clobbers B,
    ; which is the caller's column counter. HL (the collision cell) survives.
    push bc
    ld a, b
    add a, a
    add a, a
    add a, a
    add a, a                   ; D = col * 16
    ld d, a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a                   ; E = row * 16
    ld e, a
    call bitmap_player_overlaps_16
    pop bc
    or a
    jp z, .cell_seal           ; player is elsewhere -> seal normally
    ld a, 1
    ld (boss_barrier_pending), a
    ret                        ; keep this opening until they move off
.cell_seal:
    ld a, #80
    ld (hl), a                 ; mark as sealed opening
    jr .cell_vdp
.cell_redraw:
    ld a, (hl)
    cp #80
    ret nz                     ; repaint only cells owned by this barrier
    jr .cell_vdp
.cell_unseal:
    ld a, (hl)                 ; remove: act only on our own markers
    cp #80
    ret nz                     ; not a block tile we placed -> leave untouched
    xor a
    ld (hl), a                 ; reopen the passage
.cell_vdp:
    ; ---- build the 16x16 HMMM command for this cell ----
    ld a, (boss_barrier_draw)
    or a
    jr z, .cell_clear_src
    ld hl, (boss_barrier_sx)   ; apply: source = chain atlas tile
    ld (boss_cmd_buf + 0), hl
    ld hl, (boss_barrier_sy)
    ld (boss_cmd_buf + 2), hl
    jr .cell_dest
.cell_clear_src:
    ld a, b                    ; clear: source = clean room, page 1, same cell
    add a, a
    add a, a
    add a, a
    add a, a                   ; B*16 = colPix
    ld (boss_cmd_buf + 0), a
    xor a
    ld (boss_cmd_buf + 1), a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a                   ; C*16 = rowPix
    add a, ${asmByte(gameY)}
    ld l, a
${cleanPageH}
    ld (boss_cmd_buf + 2), hl
.cell_dest:
    ld a, b                    ; DX = colPix
    add a, a
    add a, a
    add a, a
    add a, a
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, c                    ; DY = rowPix + gameY, visible page
    add a, a
    add a, a
    add a, a
    add a, a
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl
    ld hl, 16                  ; NX = NY = 16
    ld (boss_cmd_buf + 8), hl
    ld (boss_cmd_buf + 10), hl
    push bc
    call bitmap_boss_finish_hmmm
    pop bc
    ret
` : ''}${hasProjectiles ? `
; ------------------------------------------------------------
; PHASE D: boss bitmap projectile (single bullet, no hardware sprites)
; Config table [present,sxLo,sxHi,syLo,syHi,w,h,interval,speed,damage] via
; bitmap_boss_projectile_ptr_table. Rendered with the same HMMM machinery as the
; body: restore old cell from page 1, draw the atlas tile on page 0.
; ------------------------------------------------------------
bitmap_boss_proj_config_ix:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_projectile_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    pop ix                     ; IX -> projectile config
    ret

; Called every frame while the boss is alive. Advances a live projectile and,
; when the cooldown elapses and none is in flight, fires a new one at the player.
bitmap_boss_shoot_update:
    call bitmap_boss_proj_config_ix
    ld a, (ix+0)
    or a
    ret z                      ; this room's boss does not shoot
${hasSpriteProjectiles ? `    ld a, (ix+10)
    ${hasFallingRocks ? `cp 1                       ; only kind 1 is a hardware sprite; 2 = rocks
    jp z, bitmap_boss_sbul_update` : `or a
    jp nz, bitmap_boss_sbul_update   ; hardware-sprite bullets`}
` : ''}${hasBitmapProjectiles ? `    ld a, (boss_proj_active)
    or a
    call nz, bitmap_boss_proj_step
${hasPaths ? `    ld a, (boss_path_fire_mode)
    or a
    ret nz                     ; path-driven firing: the node scripts shoot
` : ''}    ld a, (boss_proj_cd)
    or a
    jr z, .try_fire
    dec a
    ld (boss_proj_cd), a
    ret
.try_fire:
    ld a, (boss_proj_active)
    or a
    ret nz                     ; still one in flight -> wait
    call bitmap_boss_phase_resolve   ; A = interval for the current HP phase
    ld (boss_proj_cd), a
    jp bitmap_boss_proj_spawn` : '    ret'}

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_phase_resolve
; ------------------------------------------------------------
; PURPOSE: Pick the attack phase matching the boss's current HP and apply it.
;   Table: [count, (hpAtOrBelow, interval, projSpeed) * count], most damaged
;   first; the first entry with hpAtOrBelow >= boss_hp wins. With no table (or
;   no match) the base cadence from the projectile config is used.
; INPUT: IX -> projectile config, boss_hp. OUTPUT: A = fire interval,
;   boss_phase_speed = projectile speed for this phase.
; DESTROYS: AF, BC, DE, HL. Preserves IX.
; ------------------------------------------------------------
bitmap_boss_phase_resolve:
    ld a, (ix+8)
    ld (boss_phase_speed), a   ; default: base projectile speed
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_phase_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> phase table
    ld a, (hl)
    or a
    jr z, .no_phases           ; count 0 -> base cadence
    ld b, a                    ; B = phase count
    inc hl
.scan:
    ld a, (boss_hp)
    cp (hl)                    ; boss_hp <= hpAtOrBelow ?
    jr z, .match
    jr c, .match
    inc hl                     ; skip this entry (3 bytes)
    inc hl
    inc hl
    djnz .scan
.no_phases:
    ld a, (ix+7)               ; base interval
    ret
.match:
    inc hl                     ; HL -> interval
    ld c, (hl)                 ; C = interval
    inc hl
    ld a, (hl)                 ; A = projectile speed
    ld (boss_phase_speed), a
    ld a, c                    ; A = interval (return value)
    ret

; Spawn at the boss centre, aimed 8-directionally at the player.
; IX -> projectile config. Uses bitmap_boss_table_ix_shadow for the boss size.
bitmap_boss_proj_spawn:
${hasFallingRocks && !hasAimedBitmapProjectiles ? `    jp bitmap_boss_rock_spawn      ; only falling rocks authored; aimed launcher omitted
` : `${hasFallingRocks ? `    ld a, (ix+10)
    cp 2
    jp z, bitmap_boss_rock_spawn   ; ceiling debris, not an aimed shot
` : ''}    call bitmap_boss_table_ix_shadow   ; HL -> boss width byte (IX preserved)
    ld a, (hl)                 ; boss width
    srl a
    ld b, a
    ld a, (boss_x)
    add a, b                   ; boss centre X
    ld b, (ix+5)               ; projectile width
    srl b
    sub b
    ld (boss_proj_x), a
    ld (boss_proj_ox), a
    inc hl                     ; HL -> boss height
    ld a, (hl)
    srl a
    ld b, a
    ld a, (boss_y)
    add a, b                   ; boss centre Y
    ld b, (ix+6)
    srl b
    sub b
    ld (boss_proj_y), a
    ld (boss_proj_oy), a
    ; dx = sign(player_x - proj_x) * speed
    ld a, (player_x)
    ld b, a
    ld a, (boss_proj_x)
    cp b
    jr z, .dx_zero
    jr c, .dx_pos
    ld a, (boss_phase_speed)
    neg
    jr .dx_store
.dx_pos:
    ld a, (boss_phase_speed)
    jr .dx_store
.dx_zero:
    xor a
.dx_store:
    ld (boss_proj_dx), a
    ; dy = sign(player_y - proj_y) * speed
    ld a, (player_y)
    ld b, a
    ld a, (boss_proj_y)
    cp b
    jr z, .dy_zero
    jr c, .dy_pos
    ld a, (boss_phase_speed)
    neg
    jr .dy_store
.dy_pos:
    ld a, (boss_phase_speed)
    jr .dy_store
.dy_zero:
    xor a
.dy_store:
    ld (boss_proj_dy), a
    ld a, (boss_proj_dx)        ; player exactly on boss -> drop straight down
    or a
    jr nz, .arm
    ld a, (boss_proj_dy)
    or a
    jr nz, .arm
    ld a, (boss_phase_speed)
    ld (boss_proj_dy), a
.arm:
    ld a, 1
    ld (boss_proj_active), a
    call bitmap_boss_proj_save   ; save under the spawn cell before first draw
    jp bitmap_boss_proj_draw
`}${hasFallingRocks ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_rock_spawn
; ------------------------------------------------------------
; PURPOSE: Knock a chunk of ceiling loose. X is random inside a ${ROCK_BAND_PX}px band
;   centred on the player's body; Y is the first PASSABLE row of that column, so
;   the rock appears just under the ceiling whatever its thickness, instead of
;   inside the rock face (where the step's solid test would kill it at once).
;   It then falls straight down and bitmap_boss_proj_step despawns it on the
;   floor, restoring the background: "se estampa en el suelo y desaparece".
; INPUT: IX -> projectile config.
; OUTPUT: boss_proj_* armed. No drop at all if the column is solid top to bottom.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_rock_spawn:
    ; ---- horizontal: player body centre, minus half the rock, plus jitter ----
    ld a, (player_x)
    add a, ${asmByte(rockBandCentre)}   ; player body centre (hitbox aware)
    ld b, (ix+5)               ; rock width
    srl b
    sub b                      ; left edge that would centre it on the player
    jr nc, .rk_no_uf1
    xor a
.rk_no_uf1:
    ld b, a
    call bitmap_boss_rock_rand
    and ${asmByte(ROCK_BAND_PX - 1)}
    add a, b
    jr nc, .rk_no_of
    ld a, 255
.rk_no_of:
    sub ${asmByte(ROCK_BAND_PX >> 1)}
    jr nc, .rk_no_uf2
    xor a
.rk_no_uf2:
    cp 4
    jr nc, .rk_min_ok
    ld a, 4
.rk_min_ok:
    ld b, a
    ld a, 248
    sub (ix+5)                 ; rightmost X the tile still fits at
    cp b
    jr nc, .rk_max_ok
    ld b, a
.rk_max_ok:
    ld a, b
    and #FE                    ; HMMM X operands must be even in SCREEN 5
    ld (boss_proj_x), a
    ld (boss_proj_ox), a
    ; ---- vertical: first passable row of the column the rock will be tested in.
    ; Probe the CENTRE column, the same one bitmap_boss_proj_tile_solid uses, or
    ; a rock straddling a wall edge would despawn on its very first step.
    ld b, (ix+5)
    srl b
    add a, b                   ; centre X
    rrca
    rrca
    rrca
    rrca
    and #0F
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de
    ld de, 16                  ; one row of the 16x12 cell map
    ld b, 12
    ld c, 0                    ; C = row
.rk_scan:
    ld a, (hl)
    and #BF                    ; ignore the Deadly bit, as bitmap_probe_solid does
    jr z, .rk_found
    add hl, de
    inc c
    djnz .rk_scan
    ret                        ; column solid all the way down: no rock this time
.rk_found:
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a                   ; row * 16 = top of that cell
    cp 2
    jr nc, .rk_y_ok
    ld a, 2                    ; step kills anything above y=2; start just below
.rk_y_ok:
    ld (boss_proj_y), a
    ld (boss_proj_oy), a
    xor a
    ld (boss_proj_dx), a       ; straight down, no aiming
    ld a, (boss_phase_speed)
    ld (boss_proj_dy), a
    ld a, 1
    ld (boss_proj_active), a
    call bitmap_boss_proj_save
    jp bitmap_boss_proj_draw

; Deterministic byte PRNG for the drop column (same shape as the death-FX one).
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
bitmap_boss_rock_rand:
    ld a, (boss_rock_seed)
    rrca
    xor #B8
    add a, #3D
    ld (boss_rock_seed), a
    ret
` : ''}
; Advance the live projectile one frame: erase old, move, bounds, draw, hit-test.
bitmap_boss_proj_step:
    ld a, (boss_proj_x)
    ld (boss_proj_ox), a
    ld a, (boss_proj_y)
    ld (boss_proj_oy), a
    call bitmap_boss_proj_restore
    ld a, (boss_proj_x)
    ld b, a
    ld a, (boss_proj_dx)
    add a, b
    ld (boss_proj_x), a
    ld a, (boss_proj_y)
    ld b, a
    ld a, (boss_proj_dy)
    add a, b
    ld (boss_proj_y), a
    ld a, (boss_proj_x)
    cp 250
    jr nc, .off
    cp 4
    jr c, .off
    ld a, (boss_proj_y)
    cp 180
    jr nc, .off
    cp 2
    jr c, .off
    ; Hit a solid tile? Bullets must not fly through walls/chain: despawn on
    ; contact (the old cell was already restored above, so nothing is left).
    call bitmap_boss_proj_tile_solid
    jr nz, .off
    call bitmap_boss_proj_save   ; keep what is underneath the new position
    call bitmap_boss_proj_draw
    jp bitmap_boss_proj_hit_check
.off:
    xor a
    ld (boss_proj_active), a
    ret

; Z = passable, NZ = solid, at the projectile centre. Same indexing as
; bitmap_probe_solid: index = (y & #F0) + (x >> 4).
bitmap_boss_proj_tile_solid:
    ld a, (ix+6)
    srl a
    ld b, a
    ld a, (boss_proj_y)
    add a, b                   ; centre Y
    and #F0
    ld l, a
    ld a, (ix+5)
    srl a
    ld b, a
    ld a, (boss_proj_x)
    add a, b                   ; centre X
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
    and #BF                    ; ignore the Deadly bit; Z = passable
    ret

; Put back the pixels that were underneath the OLD projectile position, from
; the VRAM scratch rect. NOT a page-1 restore: the boss body, chain barrier and
; other overlays only exist on the visible page, so a background restore would
; erase them wherever the projectile flew over.
bitmap_boss_proj_restore:
    ld hl, ${asmWord(projScratchY)}
    ld (boss_cmd_buf + 2), hl  ; SY = scratch row
    xor a
    ld (boss_cmd_buf + 0), a   ; SX = 0
    ld (boss_cmd_buf + 1), a
    ld a, (boss_proj_ox)
    and #FE
    ld (boss_cmd_buf + 4), a   ; DX = old X
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_proj_oy)
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl
    ld l, (ix+5)
    ld h, 0
    ld (boss_cmd_buf + 8), hl  ; NX = w
    ld l, (ix+6)
    ld (boss_cmd_buf + 10), hl ; NY = h
    jp bitmap_boss_finish_hmmm

; Save the pixels currently at the projectile position into the scratch rect,
; so the next frame can put them back untouched.
bitmap_boss_proj_save:
    ld a, (boss_proj_x)
    and #FE
    ld (boss_cmd_buf + 0), a   ; SX = current X
    xor a
    ld (boss_cmd_buf + 1), a
    ld a, (boss_proj_y)
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 2), hl
    xor a
    ld (boss_cmd_buf + 4), a   ; DX = 0
    ld (boss_cmd_buf + 5), a
    ld hl, ${asmWord(projScratchY)}
    ld (boss_cmd_buf + 6), hl  ; DY = scratch row
    ld l, (ix+5)
    ld h, 0
    ld (boss_cmd_buf + 8), hl
    ld l, (ix+6)
    ld (boss_cmd_buf + 10), hl
    jp bitmap_boss_finish_hmmm

; Draw the projectile atlas tile at the current position on the visible page.
; Aimed bitmap shots use LMMM + TIMP (#98), preserving colour-0 transparency.
; Falling rocks deliberately use opaque HMMM (#D0): their authored black/zero
; pixels are solid again and the byte copy is about twice as fast as LMMM.
; DX stays snapped to even: save/restore are HMMM (byte units) and their rect
; must line up exactly with the drawn one or a 1px column would be left behind.
bitmap_boss_proj_draw:
    ld l, (ix+1)
    ld h, (ix+2)
    ld (boss_cmd_buf + 0), hl  ; SX
    ld l, (ix+3)
    ld h, (ix+4)
    ld (boss_cmd_buf + 2), hl  ; SY (512-based atlas)
    ld a, (boss_proj_x)
    and #FE
    ld (boss_cmd_buf + 4), a
    xor a
    ld (boss_cmd_buf + 5), a
    ld a, (boss_proj_y)
    add a, ${asmByte(gameY)}
    ld l, a
${visiblePageH}
    ld (boss_cmd_buf + 6), hl
    ld l, (ix+5)
    ld h, 0
    ld (boss_cmd_buf + 8), hl
    ld l, (ix+6)
    ld (boss_cmd_buf + 10), hl
    xor a
    ld (boss_cmd_buf + 12), a  ; CLR unused
    ld (boss_cmd_buf + 13), a  ; ARG = 0
${hasFallingRocks ? `    ld a, (ix+10)
    cp 2
    ld a, #D0                  ; falling rock: opaque + cheaper HMMM
    jp z, .boss_proj_draw_op_ready
    ld a, #98                  ; aimed bitmap: LMMM + TIMP
.boss_proj_draw_op_ready:
` : `    ld a, #98                  ; aimed bitmap: LMMM + TIMP
`}    ld (boss_cmd_buf + 14), a
    jp bitmap_boss_launch_cmd

; Projectile-vs-player AABB. On hit: erase, despawn, hurt the player.
bitmap_boss_proj_hit_check:
    ld a, (player_invuln)
    or a
    ret nz
    ld a, (player_x)
${hit.x ? `    add a, ${asmByte(hit.x)}\n` : ''}    ld b, a                    ; playerLeft
    ld a, (boss_proj_x)
    add a, (ix+5)              ; projRight = x + w
    dec a
    cp b
    ret c                      ; projRight-1 < playerLeft
    ld a, b
    add a, ${asmByte(Math.max(1, hit.w) - 1)}
    ld c, a                    ; playerRight-1
    ld a, (boss_proj_x)
    cp c
    ret z
    ret nc                     ; projLeft >= playerRight
    ld a, (player_y)
${hit.y ? `    add a, ${asmByte(hit.y)}\n` : ''}    ld b, a                    ; playerTop
    ld a, (boss_proj_y)
    add a, (ix+6)
    dec a
    cp b
    ret c
    ld a, b
    add a, ${asmByte(Math.max(1, hit.h) - 1)}
    ld c, a
    ld a, (boss_proj_y)
    cp c
    ret z
    ret nc
    ; HIT -> erase at current position, despawn, damage
    ld a, (boss_proj_x)
    ld (boss_proj_ox), a
    ld a, (boss_proj_y)
    ld (boss_proj_oy), a
    call bitmap_boss_proj_restore
    xor a
    ld (boss_proj_active), a
    ld a, (ix+9)               ; projectile damage
    ; fall through to bitmap_boss_hurt_player

; Apply A hearts of damage to the player (saturating health, i-frames, respawn).
; Mirrors the boss contact-damage contract. DESTROYS AF, BC, DE, HL.
bitmap_boss_hurt_player:
    ld b, a
    ld a, (player_health)
    sub b
    jr z, .hp_zero
    jr c, .hp_zero
    ld (player_health), a
    jr .hp_arm
.hp_zero:
    xor a
    ld (player_health), a
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jr z, .hp_gameover
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
    jr .hp_arm
.hp_gameover:
    ld a, 1
    ld (bitmap_game_over_flag), a
.hp_arm:
    ld a, ${invulnFrames}
    ld (player_invuln), a
    ret
` : ''}${hasSpriteProjectiles ? `
; ------------------------------------------------------------
; PHASE D: boss HARDWARE-SPRITE bullets (${spriteSlots} simultaneous)
; ------------------------------------------------------------
; These reuse the ENEMY sprite range: during a boss fight the room has no
; regular enemies, so their SAT slots / pattern group / colour block are free.
; The shared allocation chain therefore does NOT grow. The SAT writer runs after
; the enemy one and only overwrites the first ${spriteSlots} slot(s) -- it must NOT emit a
; terminator, or the sprites of every later system would stop being scanned.
;
; Pool entry (${BOSS_SBUL_SLOT_BYTES} bytes): active, x, y, dx, dy, then the 8.8 fractions of
; each (see boss_sbul_pool)${hasAnimatedSpriteBullet ? ', animation frame and animation tick' : ''}.
; The selected sprite contributes ${spriteFrameCount} pattern frame(s); the fallback is a
; 16x16 pattern with an 8x8 blob centred.
; ------------------------------------------------------------
bitmap_boss_sbul_update:
    ; advance every live bullet, then fire a new one when the cooldown elapses
    ld iy, boss_sbul_pool
    ld b, ${spriteSlots}
.sb_slot_loop:
    push bc
    ld a, (iy+0)
    or a
    call nz, bitmap_boss_sbul_step
    pop bc
    push bc
    ld bc, BOSS_SBUL_SLOT
    add iy, bc
    pop bc
    djnz .sb_slot_loop
${hasShoots ? `    call bitmap_boss_burst_tick   ; outside the loop: a wave rewrites IY
` : ''}${hasPaths ? `    ld a, (boss_path_fire_mode)
    or a
    ret nz                     ; path-driven firing: the node scripts shoot
` : ''}    ld a, (boss_proj_cd)
    or a
    jr z, .sb_fire
    dec a
    ld (boss_proj_cd), a
    ret
.sb_fire:
    call bitmap_boss_phase_resolve   ; A = interval for the current HP phase
    ld (boss_proj_cd), a
    jp bitmap_boss_sbul_spawn

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_sbul_step
; ------------------------------------------------------------
; PURPOSE: Advance one bullet's animation and 8.8 position; despawn it
;   off-screen, on a solid tile, or after damaging the player.
; INPUT: IY -> bullet slot, IX -> projectile config.
; OUTPUT: updated slot; active may become 0.
; DESTROYS: AF, BC, DE, HL. PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_boss_sbul_step:
${hasAnimatedSpriteBullet ? `    ld a, (iy+10)
    inc a
    cp ${spriteAnimDelay}
    jp c, .sb_anim_store_tick
    xor a
    ld (iy+10), a
    ld a, (iy+9)
    inc a
    cp ${spriteFrameCount}
    jp c, .sb_anim_store_frame
    xor a
.sb_anim_store_frame:
    ld (iy+9), a
    jp .sb_anim_done
.sb_anim_store_tick:
    ld (iy+10), a
.sb_anim_done:
` : ''}    ; x += dx as 8.8 fixed point: the fraction carries into the whole pixel.
    ld a, (iy+5)
    add a, (iy+7)
    ld (iy+5), a
    ld a, (iy+1)
    adc a, (iy+3)
    ld (iy+1), a
    cp 248
    jr nc, .sb_kill
    cp 4
    jr c, .sb_kill
    ld a, (iy+6)
    add a, (iy+8)
    ld (iy+6), a
    ld a, (iy+2)
    adc a, (iy+4)
    ld (iy+2), a
    cp 180
    jr nc, .sb_kill
    cp 2
    jr c, .sb_kill
    ; solid tile? index = (y & #F0) + (x >> 4), same as bitmap_probe_solid
    ld a, (iy+2)
    add a, 8                   ; sprite centre (8x8 blob inside 16x16)
    and #F0
    ld l, a
    ld a, (iy+1)
    add a, 8
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
    and #BF
    jr nz, .sb_kill
    jp bitmap_boss_sbul_hit
.sb_kill:
    xor a
    ld (iy+0), a
    ret

; Player-vs-bullet AABB (IY -> slot). The visible blob is the centred 8x8.
bitmap_boss_sbul_hit:
    ld a, (player_invuln)
    or a
    ret nz
    ld a, (player_x)
${hit.x ? `    add a, ${asmByte(hit.x)}\n` : ''}    ld b, a                    ; playerLeft
    ld a, (iy+1)
    add a, 12                  ; blob right edge (4 + 8)
    cp b
    ret c
    ld a, b
    add a, ${asmByte(Math.max(1, hit.w) - 1)}
    ld c, a                    ; playerRight-1
    ld a, (iy+1)
    add a, 4                   ; blob left edge
    cp c
    ret nc
    ld a, (player_y)
${hit.y ? `    add a, ${asmByte(hit.y)}\n` : ''}    ld b, a                    ; playerTop
    ld a, (iy+2)
    add a, 12
    cp b
    ret c
    ld a, b
    add a, ${asmByte(Math.max(1, hit.h) - 1)}
    ld c, a
    ld a, (iy+2)
    add a, 4
    cp c
    ret nc
    xor a
    ld (iy+0), a               ; consume the bullet
    ld a, (ix+9)               ; damage
    jp bitmap_boss_hurt_player

; Fire one bullet from the boss centre toward the player, into the first free
; slot. IX -> projectile config.
bitmap_boss_sbul_spawn:
    ld iy, boss_sbul_pool
    ld b, ${spriteSlots}
.sb_find:
    ld a, (iy+0)
    or a
    jr z, .sb_found
    push bc
    ld bc, BOSS_SBUL_SLOT
    add iy, bc
    pop bc
    djnz .sb_find
    ret                        ; pool full: skip this shot
.sb_found:
    call bitmap_boss_table_ix_shadow   ; HL -> boss width (IX/IY preserved)
    ld a, (hl)
    srl a
    ld b, a
    ld a, (boss_x)
    add a, b
    sub 8                      ; centre the 16x16 sprite
    ld (iy+1), a
    inc hl
    ld a, (hl)                 ; boss height
    srl a
    ld b, a
    ld a, (boss_y)
    add a, b
    sub 8
    ld (iy+2), a
    ; dx = sign(player_x - x) * phase speed
    ld a, (player_x)
    ld b, a
    ld a, (iy+1)
    cp b
    jr z, .sb_dx0
    jr c, .sb_dxp
    ld a, (boss_phase_speed)
    neg
    jr .sb_dxs
.sb_dxp:
    ld a, (boss_phase_speed)
    jr .sb_dxs
.sb_dx0:
    xor a
.sb_dxs:
    ld (iy+3), a
    ; dy = sign(player_y - y) * phase speed
    ld a, (player_y)
    ld b, a
    ld a, (iy+2)
    cp b
    jr z, .sb_dy0
    jr c, .sb_dyp
    ld a, (boss_phase_speed)
    neg
    jr .sb_dys
.sb_dyp:
    ld a, (boss_phase_speed)
    jr .sb_dys
.sb_dy0:
    xor a
.sb_dys:
    ld (iy+4), a
    ld a, (iy+3)               ; player exactly on the boss -> drop downwards
    or a
    jr nz, .sb_arm
    ld a, (iy+4)
    or a
    jr nz, .sb_arm
    ld a, (boss_phase_speed)
    ld (iy+4), a
.sb_arm:
    xor a
    ld (iy+5), a               ; whole-pixel bullet: no fractional part
    ld (iy+6), a
    ld (iy+7), a
    ld (iy+8), a
${hasAnimatedSpriteBullet ? `    ld (iy+9), a               ; every spawned bullet starts on frame 0
    ld (iy+10), a
` : ''}    ld a, 1
    ld (iy+0), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_sbul_sat
; ------------------------------------------------------------
; PURPOSE: Refresh animated line colours, then stream the bullet SAT entries
;   over the (unused) enemy slots. Runs
;   AFTER bitmap_update_enemy_sat. Writes exactly ${spriteSlots} slot(s) and NO terminator,
;   so every system allocated after the enemies keeps rendering.
; DESTROYS: AF, BC, DE, HL, IY.
; ------------------------------------------------------------
bitmap_boss_sbul_sat:
    ld a, (boss_active)
    or a
    ret z
${hasAnimatedSpriteBullet ? Array.from({ length: spriteSlots }, (_v, i) => `    ld iy, boss_sbul_pool + ${i * BOSS_SBUL_SLOT_BYTES}
    ld a, (iy+0)
    or a
    jr z, .sb_color_slot_${i}_done
    ld a, (iy+9)
    add a, a
    add a, a
    add a, a
    add a, a                  ; frame * 16-byte line-colour table
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_sbul_frame_colors
    add hl, de
    ld de, ${asmWord((sprites ? sprites.colorBase : 0) + i * 16)}
    ld bc, 16
    call copy_to_vram_ext
.sb_color_slot_${i}_done:`).join('\n') + '\n' : ''}    ld de, ${asmWord(sprites ? sprites.satBase : 0)}
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
    ld iy, boss_sbul_pool
    ld b, ${spriteSlots}
.sb_sat_slot:
    ld a, (iy+0)
    or a
    jr z, .sb_sat_hidden
    ld a, (iy+2)
    add a, ${asmByte(gameY)}
    dec a                      ; SCREEN 5 sprite Y is one line early
    out (VDP_DATA_PORT), a
    ld a, (iy+1)
    out (VDP_DATA_PORT), a
${hasAnimatedSpriteBullet ? `    ld a, (iy+9)
    add a, a
    add a, a                  ; one 16x16 frame = four pattern numbers
    add a, ${asmByte(sprites ? sprites.patternNumber : 0)}
` : `    ld a, ${asmByte(sprites ? sprites.patternNumber : 0)}
`}    out (VDP_DATA_PORT), a
    xor a
    out (VDP_DATA_PORT), a
    jr .sb_sat_next
.sb_sat_hidden:
    ld a, #D4                  ; park unused bullets off-screen, NOT #D8:
    out (VDP_DATA_PORT), a     ; Y=216 is the sprite-mode-2 SAT terminator and
                               ; would hide the platform/player-bullet slots
    xor a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
    out (VDP_DATA_PORT), a
.sb_sat_next:
    push bc
    ld bc, BOSS_SBUL_SLOT
    add iy, bc
    pop bc
    djnz .sb_sat_slot
    xor a
    ld e, a
    ld a, #0E
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_sbul_load
; ------------------------------------------------------------
; PURPOSE: Upload all bullet animation patterns + line colours and clear the pool. Called
;   from bitmap_boss_load once the boss is armed.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_sbul_load:
    xor a
${Array.from({ length: spriteSlots }, (_v, i) => `    ld (boss_sbul_pool + ${i * BOSS_SBUL_SLOT_BYTES}), a`).join('\n')}
${hasShoots ? `    ld (boss_burst_idx), a     ; a burst owed by the previous boss dies with it
` : ''}    ld hl, bitmap_boss_sbul_pattern
    ld de, ${asmWord(sprites ? sprites.patternAddr : 0)}
    ld bc, ${32 * spriteFrameCount}
    call copy_to_vram_ext
    ld hl, bitmap_boss_sbul_colors
    ld de, ${asmWord(sprites ? sprites.colorBase : 0)}
    ld bc, ${16 * spriteSlots}
    jp copy_to_vram_ext
` : ''}${hasPaths ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_path_wanted
; ------------------------------------------------------------
; PURPOSE: Which path should the boss be walking right now. Reads the room's
;   selection table [default, count, (hpAtOrBelow, path)*]; the first entry
;   whose threshold is at or above boss_hp wins, exactly like the phase table,
;   so the boss can change its route as it loses health.
; INPUT: current_screen_index, boss_hp. OUTPUT: A = path index (0 = static).
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_path_wanted:
    ; The selection pointer table stores one word per room/slot. The room
    ; index is already doubled above; double the combined room/slot index
    ; once more before walking the word table, otherwise slot 1 reads the
    ; high byte of slot 0's pointer and silently falls back to no path.
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld a, (boss_slot)
    add a, e
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_pathsel_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> selection table
    ld a, (hl)
    ld c, a                    ; C = default path
    inc hl
    ld a, (hl)
    or a
    jr z, .bpw_default         ; no per-phase overrides
    ld b, a
    inc hl
    ld a, (boss_hp)
.bpw_scan:
    cp (hl)                    ; boss_hp <= hpAtOrBelow ?
    jr z, .bpw_match
    jr c, .bpw_match
    inc hl
    inc hl
    djnz .bpw_scan
.bpw_default:
    ld a, c
    ret
.bpw_match:
    inc hl
    ld a, (hl)
    cp #FF
    ret nz                     ; explicit path (or 0 = stand still)
    ld a, c                    ; inherit the boss default
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_path_select
; ------------------------------------------------------------
; PURPOSE: Make path A the active one and rewind it. Path 0 means "no path",
;   which drops the boss back to standing still.
; INPUT: A = 1-based path index (0 = none). OUTPUT: path state RAM.
; DESTROYS: AF, DE, HL.
; ------------------------------------------------------------
bitmap_boss_path_select:
    ld (boss_path_idx), a
    or a
    jr nz, .bps_load
    ld (boss_path_fire_mode), a   ; no path -> the phase cadence fires again
    ret
.bps_load:
    dec a
    ld e, a
    ld d, 0
    push de
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_path_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld (boss_path_ptr), hl
    ld (boss_path_cur), hl
    xor a
    ld (boss_path_wait), a
    pop de
    ld hl, bitmap_boss_path_mode_table
    add hl, de
    ld a, (hl)
    ld (boss_path_fire_mode), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_path_sync
; ------------------------------------------------------------
; PURPOSE: Switch route when the attack phase changed. Only rewinds when the
;   wanted path is really a different one, so a boss that keeps its path keeps
;   its position in the stream.
; INPUT: boss state. OUTPUT: path state RAM. DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_path_sync:
    call bitmap_boss_path_wanted
    ld hl, boss_path_idx
    cp (hl)
    ret z
    jp bitmap_boss_path_select

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_path_step
; ------------------------------------------------------------
; PURPOSE: Advance one body update along the baked path: run any action
;   opcodes at the current node, then apply exactly one movement step. The
;   deltas were clamped at generation time to what the 4px restore strips can
;   clean, so nothing here needs to check bounds.
; INPUT: path state RAM. OUTPUT: boss_x/boss_y. DESTROYS: AF, BC, HL.
; ------------------------------------------------------------
bitmap_boss_path_step:
    ld a, (boss_path_wait)
    or a
    jr z, .bpt_read
    dec a
    ld (boss_path_wait), a     ; paused on a node: no move, so no body blit
    ret
.bpt_read:
    ld hl, (boss_path_cur)
.bpt_next:
    ld a, (hl)
    inc hl
    cp #F0
    jr c, .bpt_move
    cp #FF
    jr z, .bpt_end
    cp #F1
    jr z, .bpt_wait
    cp #F2
    jr z, .bpt_fire
    jr .bpt_next               ; unknown opcode: ignore it
.bpt_wait:
    ld a, (hl)
    inc hl
    ld (boss_path_wait), a
    ld (boss_path_cur), hl
    ret
.bpt_fire:
    ld a, (hl)                 ; arg = shoot pattern index (0 = plain aimed shot)
    inc hl
    ld (boss_path_cur), hl
    push hl
    call bitmap_boss_path_fire
    pop hl
${hasLaser ? `    ld a, (boss_laser_mask)
    cp 1
    ret nc                      ; firing nodes hold position until the wave ends
` : ''}
    jr .bpt_next               ; a node may fire more than once
.bpt_end:
    ld hl, (boss_path_ptr)     ; loop back to the start
    jr .bpt_next
.bpt_move:
    ld c, a
    and #0F
    sub 8
    ld b, a                    ; B = dy
    ld a, c
    rrca
    rrca
    rrca
    rrca
    and #0F
    sub 8                      ; A = dx
    ld c, a
    ld a, (boss_x)
    add a, c
    ld (boss_x), a
    ld a, (boss_y)
    add a, b
    ld (boss_y), a
    ld (boss_path_cur), hl
    ret
${hasProjectiles || hasLaser ? `
; Fire from a path node, ignoring the cadence cooldown: the script decides when.
; Reuses whichever projectile back-end the room configured.
; INPUT: A = shoot pattern index (0 = one bullet aimed at the player).
bitmap_boss_path_fire:
    push ix
${hasLaser ? `    push af
    xor a
    call bitmap_boss_laser_start   ; path nodes trigger the four cardinal bitmap beam
    pop af
` : ''}${hasProjectiles ? `
${hasShoots ? `    ld (boss_shoot_cnt), a     ; parked here until the config is known
` : ''}    call bitmap_boss_proj_config_ix
    ld a, (ix+0)
    or a
    jr z, .bpf_done            ; this room's boss does not shoot
    call bitmap_boss_phase_resolve   ; keep the phase's bullet speed
${hasSpriteProjectiles ? `    ld a, (ix+10)
    ${hasFallingRocks ? `cp 1                       ; kind 2 (rocks) blits like kind 0
    jr nz, .bpf_bitmap` : `or a
    jr z, .bpf_bitmap`}
${hasShoots ? `    ld a, (boss_shoot_cnt)
    or a
    jr z, .bpf_plain
    call bitmap_boss_shoot_fire
    jr .bpf_done
.bpf_plain:
` : ''}    call bitmap_boss_sbul_spawn
    jr .bpf_done
.bpf_bitmap:
` : ''}${hasBitmapProjectiles ? `    ld a, (boss_proj_active)
    or a
    jr nz, .bpf_done           ; only one bitmap bullet in flight
    call bitmap_boss_proj_spawn
` : ''}` : ''}.bpf_done:
    pop ix
    ret
${hasShoots ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_shoot_record
; ------------------------------------------------------------
; PURPOSE: 1-based pattern index -> its ${MSX2_SHOOT_RECORD_BYTES}-byte record.
; INPUT: A = index. OUTPUT: HL -> record. DESTROYS: AF, DE. Preserves BC, IX, IY.
; ------------------------------------------------------------
bitmap_boss_shoot_record:
    dec a
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl                 ; record index * ${MSX2_SHOOT_RECORD_BYTES}
    ld de, bitmap_boss_shoot_table
    add hl, de
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_shoot_fire
; ------------------------------------------------------------
; PURPOSE: Trigger one authored shot pattern: arm the burst, then send the first
;   wave out on this very frame. A burst of 1 (the usual case) leaves
;   boss_burst_idx at 0 and nothing ticks afterwards.
; INPUT: boss_shoot_cnt = 1-based pattern index. OUTPUT: bullets in the pool.
; DESTROYS: AF, BC, DE, HL. Preserves IX.
; ------------------------------------------------------------
bitmap_boss_shoot_fire:
    ld a, (boss_shoot_cnt)
    ld c, a                    ; C = pattern index, kept across the lookup
    call bitmap_boss_shoot_record
    ld de, 6
    add hl, de                 ; HL -> burst count
    ld a, (hl)
    dec a                      ; waves still owed once this one has gone
    ld (boss_burst_left), a
    jr z, .bsf_single
    inc hl
    ld a, (hl)                 ; frames until the next wave
    ld (boss_burst_cd), a
    ld a, c
    ld (boss_burst_idx), a
    jr .bsf_wave
.bsf_single:
    xor a
    ld (boss_burst_idx), a     ; single volley: nothing left to tick
.bsf_wave:
    ld a, c
    jp bitmap_boss_shoot_wave

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_burst_tick
; ------------------------------------------------------------
; PURPOSE: Release the remaining waves of a burst, one every burstInterval
;   frames. Runs every frame while the boss lives; costs a load and a branch
;   when no burst is in flight.
; DESTROYS: AF, BC, DE, HL. Preserves IX. Must NOT run inside the pool loop:
;   firing a wave rewrites IY.
; ------------------------------------------------------------
bitmap_boss_burst_tick:
    ld a, (boss_burst_idx)
    or a
    ret z                      ; no burst in flight
    ld hl, boss_burst_cd
    dec (hl)
    ret nz                     ; still counting down
    ld c, a                    ; C = pattern index
    call bitmap_boss_shoot_record
    ld de, 7
    add hl, de
    ld a, (hl)
    ld (boss_burst_cd), a      ; reload the gap for the wave after this one
    ld hl, boss_burst_left
    dec (hl)
    jr nz, .bbt_fire
    xor a
    ld (boss_burst_idx), a     ; this is the last wave of the burst
.bbt_fire:
    ld a, c
    jp bitmap_boss_shoot_wave

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_shoot_wave
; ------------------------------------------------------------
; PURPOSE: Spawn ONE wave of a pattern. The record carries a bullet count, a
;   base direction, a speed override and a signed start/stride pair in ring
;   steps, so a fan and a full ring are the same loop: walk dir+start, add
;   stride, look the 8.8 vector up. No angle, no multiply, no fan arithmetic.
; INPUT: A = 1-based pattern index. OUTPUT: bullets in the pool.
; DESTROYS: AF, BC, DE, HL. Preserves IX.
; ------------------------------------------------------------
bitmap_boss_shoot_wave:
    call bitmap_boss_shoot_record
    ld a, (hl)                 ; pattern: 0 aimed, 1 linear, 2 spread, 3 radial
    inc hl
    ld c, a                    ; C = pattern
    ld a, (hl)
    ld (boss_shoot_cnt), a     ; bullets in this wave
    inc hl
    ld a, (hl)
    ld (boss_shoot_dir), a     ; authored ring direction
    inc hl
    ld a, (hl)                 ; speed override, 0 = phase speed
    or a
    jr nz, .bsw_speed
    ld a, (boss_phase_speed)
.bsw_speed:
    ld (boss_shoot_spd), a
    inc hl
    ld a, (hl)                 ; signed ring offset of the first bullet
    ld (boss_shoot_off), a
    inc hl
    ld a, (hl)                 ; signed ring step between bullets
    ld (boss_shoot_step), a
    ; Everything the loop needs is in RAM now, so the aim lookup is free to
    ; clobber HL/DE/BC.
    ld a, c
    cp 1
    jr z, .bsw_loop            ; linear keeps the authored direction
    call bitmap_boss_aim_index ; aimed, spread and radial centre on the player
    ld (boss_shoot_dir), a
.bsw_loop:
    ld a, (boss_shoot_off)
    ld hl, boss_shoot_dir
    add a, (hl)
    and ${MSX2_SHOOT_RING - 1}                     ; wrap around the ring
    call bitmap_boss_shoot_vector
    call bitmap_boss_sbul_spawn_dir
    ld a, (boss_shoot_off)
    ld hl, boss_shoot_step
    add a, (hl)
    ld (boss_shoot_off), a
    ld hl, boss_shoot_cnt
    dec (hl)
    jr nz, .bsw_loop
    ret

; Ring slot -> velocity. IN: A = slot 0..${MSX2_SHOOT_RING - 1}.
; OUT: D = whole-pixel dx, E = whole-pixel dy, and the matching 8.8 fractions in
;      boss_sbul_dxf / boss_sbul_dyf, which is the ABI bitmap_boss_sbul_spawn_dir
;      expects. DESTROYS: AF, BC, DE, HL.
bitmap_boss_shoot_vector:
    add a, a
    add a, a                   ; ring slot * 4 (two 8.8 words per slot)
    ld l, a
    ld h, 0
    ld de, bitmap_boss_dir16_table
    add hl, de                 ; HL -> dx low byte
    ld e, (hl)
    inc hl
    ld d, (hl)                 ; DE = unit dx as 8.8
    inc hl
    push hl                    ; the dy pointer has to survive the scaling
    call bitmap_boss_shoot_scale
    ld a, e
    ld (boss_sbul_dxf), a
    ld b, d                    ; B = whole-pixel dx
    pop hl
    ld e, (hl)
    inc hl
    ld d, (hl)                 ; DE = unit dy as 8.8
    call bitmap_boss_shoot_scale
    ld a, e
    ld (boss_sbul_dyf), a
    ld e, d                    ; E = whole-pixel dy
    ld d, b                    ; D = whole-pixel dx
    ret

; DE = DE * boss_shoot_spd, by repeated addition: speed tops out at 4, so the
; loop beats any multiply routine and costs no table.
; DESTROYS: AF, HL. Preserves BC, IX, IY.
bitmap_boss_shoot_scale:
    ld a, (boss_shoot_spd)
    cp 2
    ret c                      ; speed 0 or 1: DE already is the answer
    push de
    pop hl                     ; HL = accumulator, seeded with one unit
.bss_add:
    add hl, de
    dec a
    cp 1
    jr nz, .bss_add
    ex de, hl
    ret

; Which of the 8 compass directions points at the player, as a RING slot.
; The compass is every other ring direction, so the sign lookup (which is all
; aiming really needs) doubles into the finer ring the bullets fly on.
; OUT: A = 0, 2, 4 ... 14. DESTROYS: AF, BC, DE, HL. Preserves IX.
bitmap_boss_aim_index:
    call bitmap_boss_table_ix_shadow   ; HL -> boss width
    ld a, (hl)
    srl a
    ld b, a
    ld a, (boss_x)
    add a, b                   ; boss centre X
    ld b, a
    ld a, (player_x)
    cp b
    ld c, 1                    ; 1 = same column
    jr z, .bai_y
    jr nc, .bai_right
    ld c, 0                    ; player to the left
    jr .bai_y
.bai_right:
    ld c, 2
.bai_y:
    call bitmap_boss_table_ix_shadow
    inc hl
    ld a, (hl)                 ; boss height
    srl a
    ld b, a
    ld a, (boss_y)
    add a, b                   ; boss centre Y
    ld b, a
    ld a, (player_y)
    cp b
    ld e, 1                    ; 1 = same row
    jr z, .bai_lookup
    jr nc, .bai_below
    ld e, 0                    ; player above
    jr .bai_lookup
.bai_below:
    ld e, 2
.bai_lookup:
    ld a, e
    add a, a
    add a, e                   ; row * 3
    add a, c                   ; + column
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_aim_ring
    add hl, de
    ld a, (hl)
    ret

; Spawn one sprite bullet from the boss centre.
; IN: D = dx whole pixels, E = dy whole pixels,
;     boss_sbul_dxf / boss_sbul_dyf = the matching 8.8 fractions.
; Nothing happens when the pool is full, exactly like the cadence path.
bitmap_boss_sbul_spawn_dir:
    ld iy, boss_sbul_pool
    ld b, ${spriteSlots}
.bsd_find:
    ld a, (iy+0)
    or a
    jr z, .bsd_found
    push bc
    ld bc, BOSS_SBUL_SLOT
    add iy, bc
    pop bc
    djnz .bsd_find
    ret
.bsd_found:
    push de
    call bitmap_boss_table_ix_shadow   ; HL -> boss width (IX/IY preserved)
    ld a, (hl)
    srl a
    ld b, a
    ld a, (boss_x)
    add a, b
    sub 8                      ; centre the 16x16 sprite
    ld (iy+1), a
    inc hl
    ld a, (hl)
    srl a
    ld b, a
    ld a, (boss_y)
    add a, b
    sub 8
    ld (iy+2), a
    pop de
    ld (iy+3), d
    ld (iy+4), e
    xor a
    ld (iy+5), a               ; position starts on an exact pixel
    ld (iy+6), a
    ld a, (boss_sbul_dxf)      ; the caller parks the fractional velocity here:
    ld (iy+7), a               ; B is the slot-search counter, so it cannot ride
    ld a, (boss_sbul_dyf)      ; in a register
    ld (iy+8), a
${hasAnimatedSpriteBullet ? `    xor a
    ld (iy+9), a               ; patterned volleys also start on frame 0
    ld (iy+10), a
` : ''}    ld (iy+0), 1
    ret
` : ''}` : `
bitmap_boss_path_fire:
    ret`}
` : ''}`;

  const dataAsm = `
; ---- bitmap BOSS per-room tables (stride ${BITMAP_BOSS_TABLE_STRIDE}) ----
; present, x0, y0, dx, dy, minX, maxX, minY, maxY, sxLo, sxHi, syLo, syHi,
; width, height, frames, animDelay, hp, damage, interval
${bankedTables
    ? '; Room records are emitted in Konami MegaROM data banks below.'
    : data.roomTables.map((table, index) => `bitmap_boss_room_${index}:
    db ${table.map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_ptr_table:
${data.roomTables.map((_, index) => `    dw bitmap_boss_room_${index}`).join('\n')}
${hasLaser ? `
bitmap_boss_laser_clear_masks:
    db #FE, #FD, #FB, #F7       ; clear N/E/S/W from an active wave
` : ''}
${bankedTables ? `bitmap_boss_bank_table:
    db ${data.roomTables.map((_, index) => `bitmap_boss_room_${index}_DATA_BANK`).join(', ')}` : ''}
${hasDefeatActions ? `
; ---- boss defeat action bytecode per room (END=#00, SET_FLAG=#01,idx) ----
${data.defeatStreams.map((stream, index) => `bitmap_boss_defeat_room_${index}:
    db ${stream.map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_defeat_ptr_table:
${data.defeatStreams.map((_, index) => `    dw bitmap_boss_defeat_room_${index}`).join('\n')}
` : ''}${hasBarrier ? `
; ---- boss chain-barrier per-room table (present, sxLo, sxHi, syLo, syHi) ----
${data.barrierTables.map((table, index) => `bitmap_boss_barrier_room_${index}:
    db ${table.map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_barrier_ptr_table:
${data.barrierTables.map((_, index) => `    dw bitmap_boss_barrier_room_${index}`).join('\n')}
` : ''}${hasIntro ? `
; ---- boss Room Lock bytecode per room ----
; #00 END, #01 CLOSE_BARRIER/rasterLinesPerFrame, #02 DIALOGUE/index, #03 WAIT/frames.
; Empty rooms share one END byte; projects with many rooms do not spend one
; duplicate byte per absent Boss merely because another room has a Room Lock.
bitmap_boss_intro_empty:
    db ${asmByte(INTRO_OP_END)}
${introStreams.map((stream, index) => introStreamIsEmpty(stream) ? '' : `bitmap_boss_intro_room_${index}:
    db ${(stream && stream.length ? stream : [INTRO_OP_END]).map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_intro_ptr_table:
${introStreams.map((stream, index) => `    dw ${introStreamIsEmpty(stream) ? 'bitmap_boss_intro_empty' : `bitmap_boss_intro_room_${index}`}`).join('\n')}

; ---- Room Lock auto-walk destination per room (player_x, body-centred) ----
; Authored in the Boss editor as a screen X of the player's body centre; the
; generator converts it to the render origin the runtime compares against.
bitmap_boss_intro_entry_x_table:
    db ${(introTargetXPerRoom.length ? introTargetXPerRoom : [introAutoMoveTargetX]).map(value => asmByte(value)).join(', ')}
` : ''}${!hasBossCells ? '' : `
; ---- boss body cells per room (FASE 3) ----
; frames, cellsPerFrame, stride(word), then (sxLo,sxHi,syLo,syHi,dx,dy)*.
; A room with no split body emits 0, 0 and keeps the single-rectangle blit.
${(data.cellTables || []).map((table, index) => `bitmap_boss_cells_room_${index}:
    db ${(table && table.length ? table : [0, 0]).map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_cells_ptr_table:
${(data.cellTables || []).map((_, index) => `    dw bitmap_boss_cells_room_${index}`).join('\n')}
; Changed cells per frame: a count byte then that many records, in frame order.
; Frame 0 is diffed against the LAST frame, because the animation cycle wraps.
${(data.cellDeltaTables || []).map((table, index) => `bitmap_boss_cells_delta_room_${index}:\n    db ${(table && table.length ? table : [0]).map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_cells_delta_ptr_table:
${(data.cellDeltaTables || []).map((_, index) => `    dw bitmap_boss_cells_delta_room_${index}`).join('\n')}
`}${hasDeathFx ? `
; ---- boss death bitmap FX per room ----
; assetCount (bit 7 = compact ordered frames), blastCount, interval, hold,
; then (sxLo,sxHi,syLo,syHi,w,h)*.
${(data.deathFxTables || []).map((table, index) => `bitmap_boss_death_fx_room_${index}:
    db ${(table && table.length ? table : [0, 0, 0, 0]).map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_death_fx_ptr_table:
${(data.deathFxTables || []).map((_, index) => `    dw bitmap_boss_death_fx_room_${index}`).join('\n')}
` : ''}${hasPooledSfx ? `
; ---- boss PSG SFX pool (channel C): death explosion + damage-zone hits ----
; ${BOSS_DEATH_SFX_RECORD_BYTES}-byte records: duration,R4,R5,R6,R10,R7-C-bits; duration 0 ends.
${hasDefaultDeathSound ? `bitmap_boss_death_sfx_default_stream:
    db ${DEFAULT_BOSS_DEATH_SFX.map(value => asmByte(value)).join(', ')}
` : ''}${data.deathSoundStreams.map((stream, index) => `bitmap_boss_death_sfx_${index}:
    db ${stream.map(value => asmByte(value)).join(', ')}`).join('\n')}
${hasCustomDeathSound ? `bitmap_boss_death_sfx_room_ptr_table:
${data.deathSoundIndexes.map(index => index < 0
    ? '    dw bitmap_boss_death_sfx_default_stream'
    : index > 0
      ? `    dw bitmap_boss_death_sfx_${index - 1}`
      : '    dw 0').join('\n')}
` : ''}${hasZoneSfx ? `; Same streams reached by POOL index instead of by room, which is what lets a
; damage zone name any sound without caring which room it is fought in.
bitmap_boss_sfx_pool_ptr_table:
${data.deathSoundStreams.length
    ? data.deathSoundStreams.map((_stream, index) => `    dw bitmap_boss_death_sfx_${index}`).join('\n')
    : '    dw 0'}
` : ''}` : ''}${hasDefaultDeathSound && !hasCustomDeathSound ? `
; ---- compact built-in boss explosion: PSG register/value pairs ----
bitmap_boss_death_sfx_default_pairs:
    db 6,#08,10,#10,11,#80,12,#00,13,#09,7,#1F
` : ''}${hasProjectiles ? `
; ---- boss projectile config per room ----
; present, sxLo, sxHi, syLo, syHi, w, h, interval, speed, damage
${data.projectileTables.map((table, index) => `bitmap_boss_projectile_room_${index}:
    db ${table.map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_projectile_ptr_table:
${data.projectileTables.map((_, index) => `    dw bitmap_boss_projectile_room_${index}`).join('\n')}

; ---- boss attack phases per room: count, (hpAtOrBelow, interval, speed)* ----
${(data.phaseTables || []).map((table, index) => `bitmap_boss_phase_room_${index}:
    db ${(table && table.length ? table : [0]).map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_phase_ptr_table:
${(data.phaseTables || []).map((_, index) => `    dw bitmap_boss_phase_room_${index}`).join('\n')}
` : ''}${hasZones ? `
; ---- boss damage zones per room: count, (x, y, w, h, kind, multiplier)* ----
; kind 0 = invulnerable armour (bullet dies, no damage), 1 = weak point.
${(data.damageZoneTables || []).map((table, index) => `bitmap_boss_zone_room_${index}:
    db ${(table && table.length ? table : [0]).map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_zone_ptr_table:
${(data.damageZoneTables || []).map((_, index) => `    dw bitmap_boss_zone_room_${index}`).join('\n')}
` : ''}${hasSpriteProjectiles ? `
; ---- boss sprite-bullet patterns: ${spriteFrameCount} x 16x16 hardware frame ----
; The authored sprite contributes every valid frame. The fallback has one 8x8
; centred blob, keeping it small without changing R#1 or sprite-size config.
; V9938 16x16 layout: quadrants TL(8) BL(8) TR(8) BR(8), 8 rows each.
bitmap_boss_sbul_pattern:
${sprites && sprites.sprite
  ? sprites.sprite.frames.map((frame, index) => `    ; authored projectile frame ${index}
    db ${frame.patternBytes.slice(0, 16).map(v => asmByte(v)).join(', ')}
    db ${frame.patternBytes.slice(16, 32).map(v => asmByte(v)).join(', ')}`).join('\n')
  : `    db #00, #00, #00, #00, #0F, #0F, #0F, #0F   ; TL: rows 0-7, cols 0-7
    db #0F, #0F, #0F, #0F, #00, #00, #00, #00   ; BL: rows 8-15, cols 0-7
    db #00, #00, #00, #00, #F0, #F0, #F0, #F0   ; TR: rows 0-7, cols 8-15
    db #F0, #F0, #F0, #F0, #00, #00, #00, #00   ; BR: rows 8-15, cols 8-15`}
; Sprite-mode-2 line colours: one 16-byte block per bullet slot.
bitmap_boss_sbul_colors:
${Array.from({ length: spriteSlots }, () => sprites && sprites.sprite
  ? `    db ${sprites.sprite.frames[0].colorBytes.map(v => asmByte(v)).join(', ')}`
  : `    db ${new Array(16).fill(asmByte(sprites ? sprites.color : 10)).join(', ')}`).join('\n')}
${hasAnimatedSpriteBullet && sprites?.sprite ? `; One 16-byte line-colour table per authored frame. Active slots copy their
; current frame here before the SAT pattern number changes.
bitmap_boss_sbul_frame_colors:
${sprites.sprite.frames.map((frame, index) => `    ; authored projectile colours frame ${index}
    db ${frame.colorBytes.map(v => asmByte(v)).join(', ')}`).join('\n')}
` : ''}
` : ''}${hasPaths ? `
; ---- boss paths (Fase G): one baked stream per authored path asset ----
; #00..#EF = movement step (high nibble dx+8, low nibble dy+8, one per body
; update), #F1 n = wait n ticks, #F2 = fire, #FF = end (restart the loop).
; Everything is precomputed: the Z80 only adds nibbles, never does geometry.
${pathStreams.map((stream, index) => `bitmap_boss_path_data_${index}:
    db ${stream.map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_path_ptr_table:
${pathStreams.map((_, index) => `    dw bitmap_boss_path_data_${index}`).join('\n')}
; Firing mode per path: 0 = keep the phase cadence, 1 = only #F2 nodes shoot.
bitmap_boss_path_mode_table:
    db ${(data.pathModes || []).map(value => asmByte(value)).join(', ')}

; ---- path selection per room: default, phaseCount, (hpAtOrBelow, path)* ----
; path 0 = stand still, #FF = inherit the default, otherwise 1-based path index.
${(data.pathSelTables || []).map((table, index) => `bitmap_boss_pathsel_room_${index}:
    db ${(table && table.length ? table : [0, 0]).map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_pathsel_ptr_table:
${(data.pathSelTables || []).map((_, index) => `    dw bitmap_boss_pathsel_room_${index}`).join('\n')}
` : ''}${hasShoots ? `
; ---- shoot patterns ----
; [pattern, count, dir, speed, start, stride, burstCount, burstInterval]
; pattern 0 = aimed at the player, 1 = fixed direction, 2 = spread, 3 = radial.
; start/stride are SIGNED ring steps, precomputed so a fan and a full ring are
; the same runtime loop.
bitmap_boss_shoot_table:
${shootRecords.map((record, index) => `    db ${record.map(value => asmByte(value)).join(', ')}   ; pattern ${index + 1}`).join('\n')}
; The ${MSX2_SHOOT_RING} ring vectors as 8.8 fixed point: dx word then dy word, little
; endian, so a slot is index * 4. 1.0 is #0100, which leaves room for the top
; speed of 4 without overflowing 16 bits.
bitmap_boss_dir16_table:
${shootDirRows}
; (row = player above/level/below, col = left/level/right) -> RING slot.
; Only even slots: the compass is every other ring direction.
bitmap_boss_aim_ring:
    db #0E, #00, #02
    db #0C, #08, #04
    db #0A, #08, #06
` : ''}`;

  return {
    enabled: true,
    ramBytes: totalRamBytes,
    bankedBlocks: bankedTables
      ? data.roomTables.map((table, index) => ({
        label: `bitmap_boss_room_${index}`,
        bytes: table,
        description: `Room ${index} boss record, banked; staged into bitmap_boss_table_buf`,
      }))
      : [],
    equates,
    initAsm,
    loadCallAsm,
    updateCallAsm,
    playerGateAsm,
    autoMoveInputAsm,
    bulletHookLabel: 'bitmap_boss_bullet_hit',
    satCallAsm: hasSpriteProjectiles
      ? '    call bitmap_boss_sbul_sat    ; boss bullets over the free enemy SAT slots\n'
      : '',
    routinesAsm,
    dataAsm,
  };
}

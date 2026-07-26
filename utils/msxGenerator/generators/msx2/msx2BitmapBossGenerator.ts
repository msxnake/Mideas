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
 *     despawn; bitmap_bullet_check_enemy_collision redirects here.
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

export const BITMAP_BOSS_TABLE_STRIDE = 20;

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
  /** Per-room table bytes (BITMAP_BOSS_TABLE_STRIDE each; [0]=present flag). */
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
   * atlas tile on boss load and clears it (collision + graphics) on defeat.
   */
  barrierTables: number[][];
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
   * in order; the first hit wins. An empty table ([0]) keeps the whole body
   * damageable for 1 per bullet.
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
   * (`bossProjectileSpriteId`): 32-byte hardware pattern + 16 line colours.
   * Undefined falls back to the built-in 16x16 pattern with an 8x8 blob centred.
   */
  sprite?: { patternBytes: number[]; colorBytes: number[] };
}

export interface BitmapBossRuntimeOptions {
  ramBase: number;
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
}

export interface BitmapBossSystemAsm {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  /**
   * Boot-time init: clears the PERSISTENT boss state (defeated flags, defeat
   * action flags). These must not be cleared per room — a killed boss stays
   * dead — so they need an explicit zero at boot instead of relying on
   * uninitialised RAM.
   */
  initAsm: string;
  /** `call bitmap_boss_load` — with the other system load calls after load_room. */
  loadCallAsm: string;
  /** `call bitmap_boss_update` — logic phase, after platform update. */
  updateCallAsm: string;
  /** Body for the shoot skill's bullet-vs-enemy stub (jp target). */
  bulletHookLabel: string;
  /** `call bitmap_boss_sbul_sat` — must run AFTER bitmap_update_enemy_sat. */
  satCallAsm: string;
  routinesAsm: string;
  dataAsm: string;
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
  /**
   * Where each boss BODY STAMP landed in the shared world atlas, keyed by stamp
   * asset id. The caller composes the stamps and injects them, because only it
   * owns the atlas packer; here they are just a rectangle to point at.
   */
  bodyStampPlacements: Map<string, { sx: number; sy: number; w: number; h: number }> = new Map(),
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
  const emptyBarrier = () => new Array(BITMAP_BOSS_BARRIER_STRIDE).fill(0);
  const emptyProjectile = () => new Array(BITMAP_BOSS_PROJECTILE_STRIDE).fill(0);
  const perRoom = rooms.map(room => {
    const bosses = (room.entities || []).filter((entity: any) => entity?.kind === 'boss' && entity.position);
    if (!bosses.length) return { table: emptyTable(), stream: [DEFEAT_OP_END], barrier: emptyBarrier(), projectile: emptyProjectile(), phases: [0], zones: [0], pathSel: [] as number[] };
    if (bosses.length > 1) {
      console.warn(`MSX2 bitmap room "${room.name}": only 1 boss per room is supported; extra ones were skipped.`);
    }
    const entity = bosses[0];
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
    const bodySource = stampId
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
      return { table: emptyTable(), stream: [DEFEAT_OP_END], barrier: emptyBarrier(), projectile: emptyProjectile(), phases: [0], zones: [0], pathSel: [] as number[] };
    }
    const frames = clampInt(params.bossFrames, 1, 4, 1);
    const stripW = Math.max(1, Math.floor(Number(bodySource.rect.w) || 0));
    const stripH = Math.max(1, Math.floor(Number(bodySource.rect.h) || 0));
    const width = even(clampInt(Math.floor(stripW / frames), 16, 128, 16));
    const height = clampInt(stripH, 16, 96, 16);
    if (Math.floor(stripW / frames) < 16 || stripH < 16 || Math.floor(stripW / frames) > 128 || stripH > 96) {
      console.warn(`MSX2 bitmap room "${room.name}": boss ${bodySource.label} is ${stripW}x${stripH} for ${frames} frame(s); per-frame size must be 16..128 x 16..96. Boss disabled in this room.`);
      return { table: emptyTable(), stream: [DEFEAT_OP_END], barrier: emptyBarrier(), projectile: emptyProjectile(), phases: [0], zones: [0], pathSel: [] as number[] };
    }
    const animDelay = clampInt(params.bossAnimDelay, 1, 255, 12);
    const hp = clampInt(params.bossHp, 1, 255, 8);
    const damage = clampInt(params.bossDamage, 0, 8, 1);
    const bytesPerBlit = (width / 2) * height;
    // Enemy-style cadence: the body moves/redraws every 3 frames by default so
    // its big HMMM never shares a frame with the projectile blits (which run on
    // the off-frames). Large bodies stay at >= 3; authors can override.
    const interval = clampInt(params.bossInterval, 1, 8, bytesPerBlit > 2048 ? 3 : 3);
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
    // Phase B chain barrier: optional single 16x16 atlas tile sealing the room
    // perimeter while the boss is alive. Same atlas VRAM base (rows 512+).
    const barrier = resolveBarrier(params.bossBarrierTileId, room, even);
    // Phase D projectiles: optional small bitmap bullet the boss fires at the
    // player (HMMM-blitted, no hardware sprites).
    const projectile = resolveProjectile(params, room, even);
    // Phase D attack phases: HP thresholds that retune the firing cadence.
    const phases = buildPhaseTable(params.bossPhases, hp, projectile, room.name);
    // Phase E damage zones: weak points / armour, in boss-local pixels.
    const zones = buildDamageZoneTable(params.damageZones ?? params.bossDamageZones, width, height, room.name);
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
      ],
      stream,
      barrier,
      projectile,
      phases,
      zones,
      pathSel,
    };
  });
  return {
    enabled,
    roomTables: perRoom.map(entry => entry.table),
    defeatStreams: perRoom.map(entry => entry.stream),
    flagNames,
    barrierTables: perRoom.map(entry => entry.barrier),
    projectileTables: perRoom.map(entry => entry.projectile),
    phaseTables: perRoom.map(entry => entry.phases),
    damageZoneTables: perRoom.map(entry => entry.zones),
    pathStreams,
    pathModes,
    pathSelTables: perRoom.map(entry => entry.pathSel),
    shootRecords,
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
 * The definition supplies the defaults; anything set on the encounter wins, so a
 * screen can override HP, the starting phase, the reward, the locked doors...
 * A boss with no `bossId` keeps working exactly as before (inline authoring).
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
 */
function buildDamageZoneTable(zones: unknown, width: number, height: number, roomName: string): number[] {
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
    rows.push([x, y, w, h, kind, multiplier]);
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
    console.warn(`MSX2 bitmap room "${room.name}": boss barrier tile "${id}" not found; chain barrier disabled.`);
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
  // Default to hardware sprites: they never erase the background and several
  // can fly at once. 'bitmap' stays available for slow multicolour bombs and
  // homing rockets, where the blit cost is irrelevant.
  const wantsBitmap = String(params.bossProjectileKind || 'sprite').trim() === 'bitmap';
  const id = String(params.bossProjectileTileId || '').trim();

  if (!wantsBitmap) {
    // Hardware sprite: the 16x16 pattern is generated (8x8 blob centred), so no
    // atlas tile is needed. Shooting is opt-in via bossShootInterval/kind.
    if (!id && params.bossShootInterval === undefined && params.bossProjectileKind === undefined) return empty;
    return [1, 0, 0, 0, 0, 16, 16, interval & 0xff, speed & 0xff, damage & 0xff, 1];
  }

  if (!id) return empty;
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
  return [1, psx & 0xff, (psx >> 8) & 0xff, psy & 0xff, (psy >> 8) & 0xff, w & 0xff, h & 0xff, interval & 0xff, speed & 0xff, damage & 0xff, 0];
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
      enabled: false, ramBytes: 0, equates: '', initAsm: '', loadCallAsm: '', updateCallAsm: '',
      bulletHookLabel: '', satCallAsm: '', routinesAsm: '', dataAsm: '',
    };
  }
  const roomCount = data.roomTables.length;
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
  const hasGiveKey = streamHas(DEFEAT_OP_GIVE_KEY);
  const hasOpenDoor = streamHas(DEFEAT_OP_OPEN_DOOR);
  const hasShowMessage = streamHas(DEFEAT_OP_SHOW_MESSAGE);
  const hasChangeScreen = streamHas(DEFEAT_OP_CHANGE_SCREEN);
  const hasDefeatActions = flagCount > 0 || hasGiveKey || hasOpenDoor || hasShowMessage || hasChangeScreen;
  const flagsBase = ram + 28 + roomCount;
  // Phase B chain barrier: only emitted when at least one room configures a
  // bossBarrierTileId, so bosses without a chain keep byte-identical ROMs.
  const hasBarrier = (data.barrierTables || []).some(t => t && t[0] === 1);
  const barrierRamBase = ram + 28 + roomCount + flagCount;
  // Phase D projectiles: single bitmap bullet fired at the player. Only emitted
  // when a room configures bossProjectileTileId (byte-identical no-op otherwise).
  const tables = data.projectileTables || [];
  // Two independent projectile back-ends; a project may use either (or neither).
  const hasBitmapProjectiles = tables.some(t => t && t[0] === 1 && t[10] === 0)
    && typeof opts.projScratchBaseY === 'number';
  const sprites = opts.spriteBullets;
  const hasSpriteProjectiles = tables.some(t => t && t[0] === 1 && t[10] === 1)
    && !!sprites && sprites.maxSlots > 0;
  const hasProjectiles = hasBitmapProjectiles || hasSpriteProjectiles;
  const projScratchY = opts.projScratchBaseY || 0;
  const spriteSlots = hasSpriteProjectiles ? (sprites as BitmapBossSpriteBulletOptions).maxSlots : 0;
  const projRamBase = barrierRamBase + (hasBarrier ? 7 : 0);
  const BOSS_SBUL_SLOT_BYTES = 9;   // keep in sync with BOSS_SBUL_SLOT in the ASM
  const spriteRamBase = projRamBase + 9;
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
  const invulnFrames = asmByte(opts.damageInvulnFrames || 60);
  const maxHealthByte = asmByte(opts.maxHealth || 3);
  const pauseGate = opts.pauseGateAsm || '';

  const equates = `
; ---- bitmap BOSS runtime state (${11 + 2 + 15 + roomCount + flagCount + (hasBarrier ? 7 : 0) + (hasProjectiles ? 9 : 0) + spriteSlots * BOSS_SBUL_SLOT_BYTES + (hasPaths ? PATH_RAM_BYTES : 0) + (hasShoots ? SHOOT_RAM_BYTES : 0)} bytes) ----
boss_active     EQU ${asmWord(ram + 0)}   ; 0 none, 1 alive
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
boss_defeated   EQU ${asmWord(ram + 28)}  ; ${roomCount} bytes, 1 = killed (persistent)
${hasDefeatActions ? `boss_flags      EQU ${asmWord(flagsBase)}  ; ${flagCount} bytes, onDefeated setFlag targets (persistent)\n` : ''}${hasBarrier ? `boss_barrier_draw EQU ${asmWord(barrierRamBase)}  ; 1 = drawing/sealing, 0 = clearing/unsealing
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
` : ''}${hasSpriteProjectiles ? `BOSS_SBUL_SLOT  EQU 9
boss_sbul_pool  EQU ${asmWord(spriteRamBase)}  ; ${spriteSlots} x 9 bytes
;   +0 active, +1 x, +2 y, +3 dx, +4 dy (whole pixels, as before),
;   +5 x frac, +6 y frac, +7 dx frac, +8 dy frac. Velocity is 8.8 fixed
;   point (int byte + frac byte), which is what buys 16 directions:
;   a diagonal is no longer forced to a whole pixel on both axes.
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
` : ''}`;

  // Persistent state must start at zero: boss_defeated decides whether a boss
  // is armed at all, and boss_flags feeds the defeat actions. Both survive room
  // loads on purpose, so the per-room load path cannot clear them.
  const initAsm = `    ; Boss persistent state (defeated flags${hasDefeatActions ? ' + defeat action flags' : ''}).
    xor a
${Array.from({ length: roomCount }, (_v, i) => `    ld (boss_defeated + ${i}), a`).join('\n')}
${hasDefeatActions ? Array.from({ length: flagCount }, (_v, i) => `    ld (boss_flags + ${i}), a`).join('\n') + '\n' : ''}`;
  const loadCallAsm = `    call bitmap_boss_load
`;
  const updateCallAsm = `    call bitmap_boss_update
`;

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_boss_load
; ------------------------------------------------------------
; PURPOSE: Arm the boss for the freshly loaded room. Reads the per-room
;   table; a defeated boss (persistent flag) or an absent one leaves the
;   system idle. The first draw happens on the first update tick.
; INPUT: current_screen_index. OUTPUT: boss state RAM.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_load:
${bankedRoomData ? `    ; The room-load path streams banked resources (music, RLE) and leaves P2
    ; pointing at the last one. Every table read below lives in resident bank 2,
    ; so map it back in first: reading them through the music bank yields
    ; garbage (0x00 -> "no boss here", 0xFF -> a bogus VDP command that hangs).
    ; Only AF is destroyed, and nothing is live yet at this point.
    call bitmap_room_restore_resident_banks
` : ''}    xor a
    ld (boss_active), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, boss_defeated
    add hl, de
    ld a, (hl)
    or a
    ret nz                     ; already killed in this run
    ld a, (current_screen_index)
    add a, a                   ; word table index
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                    ; HL -> room boss table
    ld a, (hl)
    or a
    ret z                      ; no boss in this room
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
    xor a
    ld (boss_anim_frame), a
    ld (boss_int_tick), a
    ld l, (ix+9)
    ld h, (ix+10)
    ld (boss_sx), hl           ; frame 0 source X
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
${hasBarrier ? '    call bitmap_boss_barrier_apply   ; Phase B: raise the chain around the room\n' : ''}${hasProjectiles ? `    call bitmap_boss_proj_config_ix
    xor a
    ld (boss_proj_active), a   ; Phase D: no projectile in flight yet
    ld a, (ix+8)
    ld (boss_phase_speed), a   ; base speed until the first phase resolve
    ld a, (ix+7)
    ld (boss_proj_cd), a       ; first shot after one full interval
${hasSpriteProjectiles ? `    ld a, (ix+10)
    or a
    call nz, bitmap_boss_sbul_load   ; upload bullet pattern/colours, clear pool
` : ''}` : ''}    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_update
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
bitmap_boss_update:
${pauseGate}    ld a, (boss_active)
    or a
    ret z
${hasBarrier ? `    ; The chain could not seal the doorway the player entered through. Sweep
    ; the perimeter again every 8 frames until it is clear: cells already
    ; carrying the #80 marker cost one compare each (#80 & #BF is non-zero,
    ; so bitmap_boss_barrier_cell returns before touching the VDP), and the
    ; sweep stops as soon as a pass leaves nothing pending.
    ld a, (boss_barrier_pending)
    or a
    jp z, .no_barrier_resweep
    ld hl, boss_barrier_retry
    dec (hl)
    jp nz, .no_barrier_resweep
    call bitmap_boss_barrier_apply   ; reseals whatever the player has left
.no_barrier_resweep:
` : ''}    call bitmap_boss_table_ix  ; IX -> room table (preserves state regs)
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
    call bitmap_boss_draw
    jp bitmap_boss_touch

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
bitmap_boss_table_ix:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    pop ix
    ret

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
bitmap_boss_draw:
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

; ------------------------------------------------------------
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
    ld a, (boss_active)
    or a
    ret z
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
    ; HIT: despawn the bullet, then apply damage for the zone it landed on.
    xor a
    ld (ix+0), a
${hasZones ? `    call bitmap_boss_zone_damage   ; A = hits (0 = armour, no damage)
    or a
    jr z, .zone_no_damage
    ld b, a
    ld a, (boss_hp)
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
    ret` : `    ld a, (boss_hp)
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
; PURPOSE: Phase E. Work out how much damage the bullet that just landed does,
;   from the boss's damage zones. Zones are boss-local rectangles tested in
;   authoring order, first match wins: an "invulnerable" zone (armour) returns
;   0 hits, a weak point returns its damageMultiplier. A bullet that lands
;   outside every zone does the default 1 damage.
; INPUT: IX -> bullet slot (x at ix+1, y at ix+2), boss_x/boss_y.
; OUTPUT: A = damage in hit points (0 = no damage).
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
    jr z, .zone_default        ; no zones authored
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
    ; inside: read kind + multiplier
    inc hl
    inc hl
    inc hl                     ; HL -> kind
    ld a, (hl)
    or a
    jr z, .zone_armour
    inc hl                     ; HL -> multiplier
    ld a, (hl)
    ret                        ; weak point: damageMultiplier hits
.zone_armour:
    xor a
    ret                        ; armour: bullet dies, no damage
.zone_next_y:
    dec hl                     ; HL back to x
.zone_next:
    ld a, 6
    add a, l
    ld l, a
    jr nc, .zone_skip_hi
    inc h
.zone_skip_hi:
    djnz .zone_scan
.zone_default:
    ld a, 1                    ; outside every zone: plain 1 damage
    ret

` : ''}; Shadow table lookup that leaves HL -> width byte (offset 13) without
; touching IX (the bullet slot pointer must survive).
bitmap_boss_table_ix_shadow:
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    ld hl, bitmap_boss_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, 13
    add hl, de                 ; HL -> width
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_kill
; ------------------------------------------------------------
; PURPOSE: Death sequence: erase the body with one full-rect page1 -> page0
;   HMMM at the current position and set the persistent defeated flag.
; DESTROYS: AF, DE, HL (BC preserved by callers that need it).
; ------------------------------------------------------------
bitmap_boss_kill:
${hasSpriteProjectiles ? `    ; Retire any bullet still in flight and push the hidden SAT entries out NOW:
    ; once boss_active is 0 the SAT writer stops running, so a live bullet would
    ; stay frozen on screen forever.
    xor a
${Array.from({ length: spriteSlots }, (_v, i) => `    ld (boss_sbul_pool + ${i * BOSS_SBUL_SLOT_BYTES}), a`).join('\n')}
    push ix
    call bitmap_boss_sbul_sat
    pop ix
` : ''}    xor a
    ld (boss_active), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, boss_defeated
    add hl, de
    ld a, 1
    ld (hl), a
${hasDefeatActions ? '    call bitmap_boss_run_defeat_actions   ; Phase A onDefeated bytecode\n' : ''}${hasBarrier ? '    call bitmap_boss_barrier_remove   ; Phase B: drop the chain (collision + graphics)\n' : ''}    ; full-rect restore from page 1
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
    ld a, 1
    ld (boss_barrier_draw), a
    xor a
    ld (boss_barrier_pending), a   ; this sweep decides what is left open
    ld a, 8
    ld (boss_barrier_retry), a     ; frames until the next sweep, if needed
    jp bitmap_boss_barrier_walk
bitmap_boss_barrier_remove:
    xor a
    ld (boss_barrier_draw), a
bitmap_boss_barrier_walk:
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
    ld c, 0                    ; top row
    call bitmap_boss_barrier_row
    ld c, 11                   ; bottom row
    call bitmap_boss_barrier_row
    ld b, 0                    ; left column
    call bitmap_boss_barrier_col
    ld b, 15                   ; right column
    jp bitmap_boss_barrier_col

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
    or a
    jp nz, bitmap_boss_sbul_update   ; hardware-sprite bullets
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
    call bitmap_boss_table_ix_shadow   ; HL -> boss width byte (IX preserved)
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

; Draw the projectile atlas tile at the current position on page 0.
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
    jp bitmap_boss_finish_hmmm

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
; each (see boss_sbul_pool).  Pattern: 16x16 with an 8x8 blob centred, so the
; bullet looks small without touching R#1 or any VRAM config.
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

; Move one bullet (IY -> slot). Despawns off-screen or on a solid tile.
bitmap_boss_sbul_step:
    ; x += dx as 8.8 fixed point: the fraction carries into the whole pixel.
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
    ld a, 1
    ld (iy+0), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_boss_sbul_sat
; ------------------------------------------------------------
; PURPOSE: Stream the bullet SAT entries over the (unused) enemy slots. Runs
;   AFTER bitmap_update_enemy_sat. Writes exactly ${spriteSlots} slot(s) and NO terminator,
;   so every system allocated after the enemies keeps rendering.
; DESTROYS: AF, BC, DE, HL, IY.
; ------------------------------------------------------------
bitmap_boss_sbul_sat:
    ld a, (boss_active)
    or a
    ret z
    ld de, ${asmWord(sprites ? sprites.satBase : 0)}
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
    ld a, ${asmByte(sprites ? sprites.patternNumber : 0)}
    out (VDP_DATA_PORT), a
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
; PURPOSE: Upload the bullet pattern + line colours and clear the pool. Called
;   from bitmap_boss_load once the boss is armed.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_boss_sbul_load:
    xor a
${Array.from({ length: spriteSlots }, (_v, i) => `    ld (boss_sbul_pool + ${i * BOSS_SBUL_SLOT_BYTES}), a`).join('\n')}
${hasShoots ? `    ld (boss_burst_idx), a     ; a burst owed by the previous boss dies with it
` : ''}    ld hl, bitmap_boss_sbul_pattern
    ld de, ${asmWord(sprites ? sprites.patternAddr : 0)}
    ld bc, 32
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
    ld a, (current_screen_index)
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
${hasProjectiles ? `
; Fire from a path node, ignoring the cadence cooldown: the script decides when.
; Reuses whichever projectile back-end the room configured.
; INPUT: A = shoot pattern index (0 = one bullet aimed at the player).
bitmap_boss_path_fire:
    push ix
${hasShoots ? `    ld (boss_shoot_cnt), a     ; parked here until the config is known
` : ''}    call bitmap_boss_proj_config_ix
    ld a, (ix+0)
    or a
    jr z, .bpf_done            ; this room's boss does not shoot
    call bitmap_boss_phase_resolve   ; keep the phase's bullet speed
${hasSpriteProjectiles ? `    ld a, (ix+10)
    or a
    jr z, .bpf_bitmap
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
` : ''}.bpf_done:
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
    ld (iy+0), 1
    ret
` : ''}` : `
bitmap_boss_path_fire:
    ret`}
` : ''}`;

  const dataAsm = `
; ---- bitmap BOSS per-room tables (stride ${BITMAP_BOSS_TABLE_STRIDE}) ----
; present, x0, y0, dx, dy, minX, maxX, minY, maxY, sxLo, sxHi, syLo, syHi,
; width, height, frames, animDelay, hp, damage, interval
${data.roomTables.map((table, index) => `bitmap_boss_room_${index}:
    db ${table.map(value => asmByte(value)).join(', ')}`).join('\n')}
bitmap_boss_ptr_table:
${data.roomTables.map((_, index) => `    dw bitmap_boss_room_${index}`).join('\n')}
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
; ---- boss sprite-bullet pattern: 16x16 sprite with an 8x8 blob CENTRED ----
; Rows 4..11, columns 4..11 are set; everything else transparent. This keeps the
; bullet visually small WITHOUT changing R#1 or any VRAM sprite-size config.
; V9938 16x16 layout: quadrants TL(8) BL(8) TR(8) BR(8), 8 rows each.
bitmap_boss_sbul_pattern:
${sprites && sprites.sprite
  ? `    ; sprite selected by the user in the Boss Editor
    db ${sprites.sprite.patternBytes.slice(0, 16).map(v => asmByte(v)).join(', ')}
    db ${sprites.sprite.patternBytes.slice(16, 32).map(v => asmByte(v)).join(', ')}`
  : `    db #00, #00, #00, #00, #0F, #0F, #0F, #0F   ; TL: rows 0-7, cols 0-7
    db #0F, #0F, #0F, #0F, #00, #00, #00, #00   ; BL: rows 8-15, cols 0-7
    db #00, #00, #00, #00, #F0, #F0, #F0, #F0   ; TR: rows 0-7, cols 8-15
    db #F0, #F0, #F0, #F0, #00, #00, #00, #00   ; BR: rows 8-15, cols 8-15`}
; Sprite-mode-2 line colours: one 16-byte block per bullet slot.
bitmap_boss_sbul_colors:
${Array.from({ length: spriteSlots }, () => sprites && sprites.sprite
  ? `    db ${sprites.sprite.colorBytes.map(v => asmByte(v)).join(', ')}`
  : `    db ${new Array(16).fill(asmByte(sprites ? sprites.color : 10)).join(', ')}`).join('\n')}
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
    ramBytes: 11 + 2 + 15 + roomCount + flagCount + (hasBarrier ? 7 : 0) + (hasProjectiles ? 9 : 0) + spriteSlots * BOSS_SBUL_SLOT_BYTES
      + (hasPaths ? PATH_RAM_BYTES : 0) + (hasShoots ? SHOOT_RAM_BYTES : 0),
    equates,
    initAsm,
    loadCallAsm,
    updateCallAsm,
    bulletHookLabel: 'bitmap_boss_bullet_hit',
    satCallAsm: hasSpriteProjectiles
      ? '    call bitmap_boss_sbul_sat    ; boss bullets over the free enemy SAT slots\n'
      : '',
    routinesAsm,
    dataAsm,
  };
}

/**
 * SCREEN 5 halo lighting: the player carries a lamp, or a tail he has to feed.
 *
 * Two authoring layers sit on top of the same halo engine:
 *
 *   - a room flagged `runtime.lighting = 'lamp'` is DARK. Without the torch
 *     skill the player simply carries a lamp that is always on (the original
 *     behaviour, unchanged and byte-identical).
 *   - the optional `torch` skill turns that lamp into the alien's GLOWING TAIL.
 *     It is not switched on by a key: eating a phosphorescent mushroom (a
 *     `mushroom` entity placed in the room) lights it, and from there the halo
 *     shrinks stage by stage until it dies out. Mushrooms glow on their own so
 *     you can spot the next one before the dark closes in; an eaten one goes
 *     out and regenerates when that glow timer reaches zero.
 *
 * The palette is authored in pairs — indices 0-7 are the lit colours and 8-15
 * the dimmed twin of each — so bit 3 of every pixel nibble IS the light level.
 * That turns lighting into two V9938 rectangle fills that are exact inverses:
 *
 *   dim  a rect -> LMMV #82 (logical OR),  CLR #08   (sets bit 3)
 *   light a rect -> LMMV #81 (logical AND), CLR #07  (clears bit 3)
 *
 * Because they are inverses, the halo can move without keeping a clean copy of
 * the room anywhere: nothing is ever lost, so nothing has to be restored from a
 * backup page.
 *
 * Per frame only the *edges* of the halo are repainted. The halo is a stack of
 * horizontal bands (an octagon-ish blob); the bands are disjoint in Y, so a
 * horizontal move is one leaving strip + one entering strip per band. A vertical
 * move is subtler: the rows a band vacates are exactly the rows its neighbour
 * grows into, so almost nothing really changes. Only the difference in half
 * width at each boundary does, and that is precomputed into a step table
 * (see buildStepTable below).
 *
 * The halo centre is clamped so the blob never leaves the game band. That costs
 * nothing visually (near a wall the light simply stops advancing) and removes
 * all rectangle clipping from the runtime.
 *
 * DECAY STAGES: every stage keeps the same band *rows* and only narrows the half
 * widths, so shrinking one stage is two thin side strips per band (a precomputed
 * ring table) instead of a repaint, and growing back after eating is the same
 * table with the lit fill. Each stage carries its own bands, step tables and
 * horizontal clamp, picked at runtime through a stage descriptor.
 *
 * MUSHROOM GLOW breaks one assumption of the scheme: dimming is a logical OR, so
 * a moving halo that swept over a statically lit pool would swallow it for good.
 * Every dim rectangle is therefore followed by a REPAIR pass that re-lights the
 * intersection of that rectangle with each *uneaten* mushroom of the room (see
 * bitmap_light_repair). The repair is bounded by the dim rectangle, not by the
 * halo, so walking past a mushroom costs a few thin fills, not a repaint.
 */

import type { Msx2TorchConfig } from '../../../msx2PlatformPhysics';
import type { PSGSoundData } from '../../../../types';
import { compilePsgOneShot, type CompiledPsgOneShot } from './msx2PsgOneShot';

export interface BitmapLightingOptions {
  /** First free byte of the linked-HUD RAM chain. */
  ramBase: number;
  /** Player hitbox (offsets relative to player_x/player_y), centres the halo. */
  playerHitbox?: { x: number; y: number; w: number; h: number };
  /** Torch skill config. When disabled the halo is a lamp that never goes out. */
  torch?: Msx2TorchConfig;
  /** Optional Sound Editor asset used as the mushroom-eat one-shot. */
  eatSound?: PSGSoundData;
  /** Absolute SCREEN 5 Y row where the shared room atlas starts in VRAM. */
  atlasBaseY?: number;
  /**
   * Address of the 15-byte V9938 command scratch every overlay system launches
   * from. bitmap_light_dim_cmd_block reads the destination rectangle from it to
   * dim what was just painted (see there).
   */
  cmdBlockAddr?: number;
  /** Animation id of the 'glowing' player state, when the project maps one. */
  glowingAnimId?: number;
  /**
   * A music driver is emitted, so the long room-entry paint may tick it while it
   * waits for the command engine. Without this the full-band dim fill (the most
   * expensive blit of a transition) stalls the song for its whole duration.
   */
  musicTick?: boolean;
  /**
   * The room composition already delivers a dark room: its command program reads
   * tiles from a pre-dimmed twin of the atlas and its colour fills carry the
   * dimmed index (see dimRoomRenderRecords in the room generator). Room entry
   * then only has to CUT the light sources out, and the 256x192 LMMV OR that
   * dominated every dark-room entry (292 ms of blitter, 17,5 frames) disappears.
   */
  roomsComposeDimmed?: boolean;
  /**
   * Travelling lantern carried by the shoot skill's bullet: while the tail is
   * lit, the bullet drags a small halo so a shot doubles as a sonar.
   *
   * Only emitted when the project also has glowing mushrooms, because the
   * trailing strip must be repaired against the player's own halo and that
   * machinery (bitmap_light_submit / _repair_halo / bitmap_light_protect) lives
   * inside the mushroom block. A dark room with no mushroom keeps its bullets
   * dark; the caller warns about it.
   */
  bulletLantern?: {
    /** RAM label of the bullet pool (active, x, y, dir[, life]). */
    poolLabel: string;
    slotCount: number;
    slotStride: number;
    /** Bullet speed in px/frame: the strip repainted on each side per frame. */
    speed: number;
    /** Half sizes of the lantern rectangle around the bullet centre. */
    halfWidth: number;
    halfHeight: number;
    /** Y added to a bullet's room coordinate to reach SCREEN 5 rows. */
    gameYOffset: number;
  };
}

export interface BitmapLightingSystem {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  initAsm: string;
  /** Per-frame halo delta, after player movement resolved. */
  mainLoopCall: string;
  /** Bullet lantern update; '' when no travelling lantern is emitted. */
  bulletLanternCall: string;
  /** Full dark fill + halo on the hidden page, before commit_room_flip. */
  pendingPageCallAsm: string;
  /** Full dark fill + halo on the visible page, at boot. */
  bootPaintCallAsm: string;
  routinesAsm: string;
  dataAsm: string;
}

const DISABLED_SYSTEM: BitmapLightingSystem = {
  enabled: false,
  ramBytes: 0,
  equates: '',
  initAsm: '',
  mainLoopCall: '',
  bulletLanternCall: '',
  pendingPageCallAsm: '',
  bootPaintCallAsm: '',
  routinesAsm: '',
  dataAsm: '',
};

/** Top of the game band on a SCREEN 5 page (the HUD owns rows 0-19). */
const GAME_Y = 20;
const GAME_H = 192;

/**
 * Halo band rows: [signed Y offset from the centre, height]. Shared by every
 * decay stage — only the half widths below shrink — so one stage's rows are
 * always another stage's rows and a shrink never has to move a row boundary.
 * Must be contiguous and disjoint, top to bottom.
 *
 * THREE bands, not five. Measured on hardware (test/msx2-lighting/lmmv_bench):
 * a rectangle costs ~0,25-0,34 ms of wall clock BEFORE painting a pixel (the 11
 * OUTs, the wait for the previous command, decoding the band), against 5,94 us
 * per pixel of actual fill. For the thin strips a halo delta is made of, that
 * fixed part is two thirds of the bill, so the number of rectangles is the real
 * currency — not their area. Merging the old 8-row shoulders into their
 * neighbours takes a horizontal delta from 10 rectangles to 6 and a vertical one
 * from 10 to 6, for the SAME pixel count and the same lit area (see below).
 * Cost: a chunkier silhouette, two steps per side instead of three.
 */
const BAND_ROWS: Array<[number, number]> = [
  [-32, 16],
  [-16, 32],
  [16, 16],
];

/**
 * Half width of each band, per decay stage. Stage 0 is a freshly eaten mushroom;
 * the last stage is the dying glow just before the dark takes over.
 *
 * Chosen so every stage keeps EXACTLY the lit area of the five-band shape it
 * replaces (4160 / 2816 / 1536 px): the light reaches as far as it used to, it
 * just gets there in fewer steps.
 */
const STAGE_HALF_WIDTHS: number[][] = [
  [24, 40, 24],
  [16, 28, 16],
  [8, 16, 8],
];

const BAND_COUNT = BAND_ROWS.length;
const STAGE_COUNT = STAGE_HALF_WIDTHS.length;
const LAMP_HALF_WIDTHS = STAGE_HALF_WIDTHS[0];

const VEXT = Math.max(...BAND_ROWS.map(([dy, h]) => Math.max(Math.abs(dy), Math.abs(dy + h))));
/**
 * Largest halo step per frame. Must be <= the shortest band: a vertical step
 * consumes one boundary row-range per band, and ranges must not overlap.
 */
const MAX_STEP = Math.min(8, ...BAND_ROWS.map(([, h]) => h));

/**
 * Smallest halo step worth paying for. A delta below this is left pending: the
 * halo waits until the player has drifted this far and then moves in one go.
 *
 * The point is the fixed cost of a rectangle (see BAND_ROWS): six rectangles of
 * 2 px cost almost exactly what six rectangles of 4 px cost, so at the usual
 * walking speed of 2 px/frame this halves the number of frames that pay for the
 * halo at no extra pixel cost. It is a dead zone, not a frame counter, and that
 * matters: something moving fast (a fall at terminal velocity) clears the
 * threshold every frame and keeps tracking exactly as it did before, while
 * something slow simply moves in coarser steps. The halo can sit up to
 * MIN_STEP-1 px off centre, which is invisible inside an 80 px wide blob — and
 * it stays SELF-CONSISTENT, because everything that asks "is this point lit?"
 * (bitmap_light_sprite_point_is_lit, the repairs) reads the painted centre.
 */
const MIN_STEP = 4;

const CY_MIN = GAME_Y + VEXT;
const CY_MAX = GAME_Y + GAME_H - VEXT;
/** Bullet lantern box, in pixels from the bullet centre. */
export const BITMAP_LANTERN_HALF_WIDTH = 16;
export const BITMAP_LANTERN_HALF_HEIGHT = 12;

/**
 * The halo's half width sampled every 8 rows of its ${VEXT * 2}-row vertical extent, so
 * "is this sprite standing in the light?" can be a table lookup instead of a
 * band walk. One row of 8 per decay stage when the torch skill is on; a plain
 * lamp never decays and only needs stage 0.
 *
 * Consumed by the enemy runtime's dark-room bats. It samples the same geometry
 * the halo painter uses, so widening a band moves both together.
 */
export function bitmapHaloHalfWidthSlices(staged: boolean): number[][] {
  const stages = staged ? STAGE_HALF_WIDTHS : [LAMP_HALF_WIDTHS];
  return stages.map(halfWidths => Array.from({ length: (VEXT * 2) / 8 }, (_slice, index) => {
    const dy = -VEXT + index * 8;
    const band = BAND_ROWS.findIndex(([top, height]) => dy >= top && dy < top + height);
    return halfWidths[band < 0 ? 0 : band];
  }));
}

const stageHwMax = (stage: number) => Math.max(...STAGE_HALF_WIDTHS[stage]);
const stageCxMin = (stage: number) => stageHwMax(stage);
const stageCxMax = (stage: number) => 256 - stageHwMax(stage);

/**
 * Vertical steps are driven by a precomputed table rather than by repainting
 * whole bands. When the halo slides down by `d`, the rows a band vacates are the
 * rows its neighbour grows into, so the ONLY pixels that actually change are the
 * difference in half width at each band boundary, plus the full-width slivers
 * entering at one end and leaving at the other. Repainting whole bands instead
 * costs 2 * sum(2 * halfWidth) * d (352 * d at stage 0); the differences cost
 * 2 * (hw_first + hw_last + sum|hw delta|) * d = 160 * d, 2.2x less for the same
 * six rectangles.
 *
 * A bonus: every rectangle in the table covers a distinct row range, so unlike
 * the whole-band version there is no "all dims before all lights" ordering rule.
 *
 * Down entries place their rectangle at cy + yOff; up entries at cy + yOff - d.
 */
interface StepEntry { yOff: number; xOff: number; w: number; lit: boolean }

function pushWidthDiff(out: StepEntry[], yOff: number, from: number, to: number): void {
  if (from === to) return;
  const lit = to > from;
  const inner = Math.min(from, to);
  const outer = Math.max(from, to);
  const w = outer - inner;
  out.push({ yOff, xOff: -outer, w, lit });   // left sliver
  out.push({ yOff, xOff: inner, w, lit });    // right sliver
}

function buildStepTable(halfWidths: number[], direction: 'down' | 'up'): StepEntry[] {
  const out: StepEntry[] = [];
  const last = BAND_COUNT - 1;
  const hw = (i: number) => halfWidths[i];
  const top = (i: number) => BAND_ROWS[i][0];
  const bottom = BAND_ROWS[last][0] + BAND_ROWS[last][1];
  const down = direction === 'down';

  // Sliver leaving the trailing end / entering the leading end.
  out.push({ yOff: top(0), xOff: -hw(0), w: 2 * hw(0), lit: !down });
  for (let b = 1; b <= last; b++) {
    // Row range at the boundary changes owner: band b <-> band b-1.
    pushWidthDiff(out, top(b), down ? hw(b) : hw(b - 1), down ? hw(b - 1) : hw(b));
  }
  out.push({ yOff: bottom, xOff: -hw(last), w: 2 * hw(last), lit: down });
  return out;
}

/**
 * Ring between two consecutive stages: per band the two side strips that stop
 * being lit when the halo shrinks (and light up again when it is fed). Rows are
 * identical across stages, so the ring really is just those strips.
 */
interface RingEntry { yOff: number; xOff: number; w: number; h: number }

function buildRingTable(fromStage: number, toStage: number): RingEntry[] {
  const out: RingEntry[] = [];
  for (let band = 0; band < BAND_COUNT; band++) {
    const [yOff, h] = BAND_ROWS[band];
    const outer = STAGE_HALF_WIDTHS[fromStage][band];
    const inner = STAGE_HALF_WIDTHS[toStage][band];
    if (outer === inner) continue;
    out.push({ yOff, xOff: -outer, w: outer - inner, h });
    out.push({ yOff, xOff: inner, w: outer - inner, h });
  }
  return out;
}

/**
 * Mushroom glow: the same band-stack shape one size down, so a mushroom lights
 * its own corner without lighting half the room.
 */
const MUSH_BAND_ROWS: Array<[number, number]> = [
  [-16, 8],
  [-8, 16],
  [8, 8],
];
const MUSH_HALF_WIDTHS = [16, 24, 16];
const MUSH_HW_MAX = Math.max(...MUSH_HALF_WIDTHS);
const MUSH_VEXT = Math.max(...MUSH_BAND_ROWS.map(([dy, h]) => Math.max(Math.abs(dy), Math.abs(dy + h))));
/** Mushroom glow centres are clamped like the halo: no rectangle clipping. */
const MUSH_CX_MIN = MUSH_HW_MAX;
const MUSH_CX_MAX = 256 - MUSH_HW_MAX;
const MUSH_CY_MIN = GAME_Y + MUSH_VEXT;
const MUSH_CY_MAX = GAME_Y + GAME_H - MUSH_VEXT;

/** Room grid used by placed entities (16x16 cells). */
const TILE_GRID_SIZE = 16;
const COLLISION_COLS = 16;
const COLLISION_ROWS = 12;

/** True when a placed entity is a phosphorescent mushroom. */
export function isBitmapMushroomEntity(entity: any): boolean {
  if (!entity) return false;
  if (entity.kind === 'mushroom') return true;
  return entity.params?.engine === 'glowMushroom' || entity.params?.glowMushroom === true;
}

interface MushroomRecord {
  roomIndex: number;
  /** Glow centre in page pixels, already clamped to the game band. */
  glowX: number;
  glowY: number;
  /** Cell top-left in ROOM pixels, for the eat hitbox. */
  cellX: number;
  cellY: number;
  /** Index into the per-room eaten-flag array. */
  flagIndex: number;
  /** Selected 16x16 tile source in the shared SCREEN 5 atlas. */
  tileSourceX: number;
  tileSourceY: number;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = Math.trunc(Number(value));
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

const hex2 = (value: number) => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;

/** True when the room is authored as a dark room (the player is the light). */
export function isBitmapLightingRoom(room: any): boolean {
  return String(room?.runtime?.lighting || 'off').toLowerCase() === 'lamp';
}

/**
 * Tail call for any routine that has just launched a 15-byte command from the
 * shared scratch block: in a dark room it brings the rectangle it painted down
 * to the room's light level and gives the halo back. See
 * bitmap_light_dim_cmd_block. Emit it only when a dark room exists — the label
 * does not exist otherwise, and lit projects must stay byte-identical.
 */
export const BITMAP_LIGHT_DIM_CMD_CALL =
  '    call bitmap_light_dim_cmd_block   ; dark room: keep the patch at the room light level\n';

/**
 * Mushrooms of every DARK room. Mushrooms placed in a lit room are ignored:
 * there is no darkness for them to cut through and nothing to feed.
 */
function collectBitmapMushroomRecords(rooms: Array<any>, atlasBaseY: number): MushroomRecord[] {
  const records: MushroomRecord[] = [];
  for (const [roomIndex, room] of rooms.entries()) {
    if (!isBitmapLightingRoom(room)) continue;
    let flagIndex = 0;
    for (const entity of room?.entities || []) {
      if (!isBitmapMushroomEntity(entity)) continue;
      const cellX = clampInt(entity.position?.x ?? 0, 0, COLLISION_COLS - 1, 0);
      const cellY = clampInt(entity.position?.y ?? 0, 0, COLLISION_ROWS - 1, 0);
      const centreX = cellX * TILE_GRID_SIZE + TILE_GRID_SIZE / 2;
      const centreY = cellY * TILE_GRID_SIZE + TILE_GRID_SIZE / 2 + GAME_Y;
      const atlasEntryId = String(entity.params?.glowMushroomAtlasEntryId || '').trim();
      const atlasEntry = (room.atlas?.entries || []).find((item: any) => item.id === atlasEntryId);
      const hasTile = !!atlasEntry
        && Number(atlasEntry.w) >= TILE_GRID_SIZE
        && Number(atlasEntry.h) >= TILE_GRID_SIZE;
      records.push({
        roomIndex,
        glowX: Math.max(MUSH_CX_MIN, Math.min(MUSH_CX_MAX, centreX)),
        glowY: Math.max(MUSH_CY_MIN, Math.min(MUSH_CY_MAX, centreY)),
        cellX: cellX * TILE_GRID_SIZE,
        cellY: cellY * TILE_GRID_SIZE,
        flagIndex: flagIndex++,
        tileSourceX: hasTile ? clampInt(atlasEntry.sx, 0, 255, 0) : 0,
        tileSourceY: hasTile
          ? atlasBaseY + clampInt(atlasEntry.sy, 0, 511, 0)
          : 0xffff,
      });
    }
  }
  return records;
}

const bandTableAsm = (label: string, halfWidths: number[], comment: string) =>
  `${label}:    ; ${comment}\n`
  + BAND_ROWS.map(([dy, h], band) => `    DB ${hex2(dy)}, ${h}, ${halfWidths[band]}`).join('\n')
  + '\n';

const stepTableAsm = (label: string, entries: StepEntry[], placement: string) =>
  `${label}:\n    ; row offset, column offset, width, 1 = light / 0 = dim; rect at ${placement}\n`
  + entries.map(e => `    DB ${hex2(e.yOff)}, ${hex2(e.xOff)}, ${e.w}, ${e.lit ? 1 : 0}`).join('\n')
  + '\n';

const ringTableAsm = (label: string, entries: RingEntry[], comment: string) =>
  `${label}:    ; ${comment}\n    ; row offset, column offset, width, height\n`
  + entries.map(e => `    DB ${hex2(e.yOff)}, ${hex2(e.xOff)}, ${e.w}, ${e.h}`).join('\n')
  + '\n';

/**
 * The bitmap gameplay mixer reserves PSG channel C for SFX. The compiler that
 * turns a Sound Editor asset into the records `bitmap_light_sfx_tick` walks now
 * lives in msx2PsgOneShot.ts, so the shoot skill and anything after it use the
 * same one instead of copying it.
 */
function compileEatSound(sound: PSGSoundData | undefined): CompiledPsgOneShot | undefined {
  return compilePsgOneShot(sound, 'bitmap_light_sfx_eat_data');
}

export function buildBitmapLightingSystemAsm(
  rooms: Array<any>,
  options: BitmapLightingOptions,
): BitmapLightingSystem {
  const flags = rooms.map(room => (isBitmapLightingRoom(room) ? 1 : 0));
  if (!flags.some(Boolean)) return DISABLED_SYSTEM;

  const hitbox = options.playerHitbox || { x: 0, y: 0, w: 16, h: 32 };
  const centerX = Math.max(0, Math.min(63, Math.trunc(hitbox.x + hitbox.w / 2)));
  // player_y is room-relative; the game band starts GAME_Y rows down the page.
  const centerY = Math.max(0, Math.min(63, Math.trunc(hitbox.y + hitbox.h / 2))) + GAME_Y;

  // --- torch skill (glowing tail) + mushrooms -------------------------------
  const torchConfig = options.torch;
  const torchSkill = torchConfig?.enabled === true;
  const musicTick = options.musicTick === true;
  const composeDimmed = options.roomsComposeDimmed === true;
  const atlasBaseY = clampInt(options.atlasBaseY, 0, 1023, 512);
  const cmdBlockAddr = clampInt(options.cmdBlockAddr, 0xc000, 0xfff0, 0xc2c0);
  // Mushrooms only glow where the skill is active: without it the room has a
  // lamp that never goes out, and a second light source has nothing to add.
  const mushrooms = torchSkill ? collectBitmapMushroomRecords(rooms, atlasBaseY) : [];
  const anyMushroom = mushrooms.length > 0;
  const mushFlagCount = anyMushroom
    ? Math.max(...rooms.map((_room, index) => mushrooms.filter(item => item.roomIndex === index).length))
    : 0;
  const eatSound = torchSkill && torchConfig?.eatSound !== false;
  const compiledEatSound = eatSound ? compileEatSound(options.eatSound) : undefined;
  const stageFrames = Math.max(
    30,
    Math.min(0xffff, Math.round((torchConfig?.lightSeconds ?? 10) * 60 / STAGE_COUNT)),
  );
  const glowingAnimId = torchSkill ? options.glowingAnimId : undefined;
  // Every dim rectangle is repaired against the mushroom glows; without any, the
  // passes keep calling bitmap_light_rect directly (lamp ROMs stay identical).
  const SUBMIT = anyMushroom ? 'bitmap_light_submit' : 'bitmap_light_rect';
  if (torchSkill && !anyMushroom) {
    console.warn(
      '⚠️ MSX2 bitmap lighting: the torch skill is active but no mushroom entity is placed in any dark room. '
      + "The tail can never be lit, so the dark rooms stay dark. Place 'MSX2 Seta Fosforescente' entities.",
    );
  }

  const ramBase = options.ramBase;
  let cursor = ramBase;
  const alloc = (size: number) => {
    const address = cursor;
    cursor += size;
    return address;
  };
  const A_X = alloc(1);
  const A_Y = alloc(1);
  const A_TX = alloc(1);
  const A_TY = alloc(1);
  const A_ACTIVE = alloc(1);
  const A_PAGE = alloc(1);
  const A_OP_CLR = alloc(1);
  const A_OP_CMD = alloc(1);
  const A_D = alloc(1);
  const A_XSIGN = alloc(1);
  const A_XADJ = alloc(1);
  const A_YBIAS = alloc(1);
  const A_RX = alloc(1);
  const A_RY = alloc(1);
  const A_RW = alloc(2);
  const A_RH = alloc(1);
  const A_BY = alloc(1);
  const A_BH = alloc(1);
  const A_BHW = alloc(1);
  // Rectangle intersection scratch: source (a rectangle just dimmed) against a
  // target (a light source). Shared by the mushroom repair and by the runtime
  // repaint dimmer, which is why it is not gated on mushrooms.
  const A_SRX = alloc(1);
  const A_SRY = alloc(1);
  const A_SRW = alloc(1);
  const A_SRH = alloc(1);
  const A_TX0 = alloc(1);
  const A_TY0 = alloc(1);
  const A_TW = alloc(1);
  const A_TH = alloc(1);
  const A_PROTECT = alloc(1);
  // Torch skill state.
  const A_ON = torchSkill ? alloc(1) : -1;
  const A_STAGE = torchSkill ? alloc(1) : -1;
  const A_TIMER = torchSkill ? alloc(2) : -1;
  // Stage descriptor cache (copied from ROM whenever the stage changes).
  const A_BANDS_PTR = torchSkill ? alloc(2) : -1;
  const A_SDOWN_PTR = torchSkill ? alloc(2) : -1;
  const A_SDOWN_N = torchSkill ? alloc(1) : -1;
  const A_SUP_PTR = torchSkill ? alloc(2) : -1;
  const A_SUP_N = torchSkill ? alloc(1) : -1;
  const A_CXMIN = torchSkill ? alloc(1) : -1;
  const A_CXMAX = torchSkill ? alloc(1) : -1;
  // Mushroom glow / repair scratch.
  const A_MCX = anyMushroom ? alloc(1) : -1;
  const A_MCY = anyMushroom ? alloc(1) : -1;
  const A_MEX = anyMushroom ? alloc(1) : -1;
  const A_MEY = anyMushroom ? alloc(1) : -1;
  const A_MFLAG = anyMushroom ? alloc(1) : -1;
  const A_MSX = anyMushroom ? alloc(1) : -1;
  const A_MSY = anyMushroom ? alloc(2) : -1;
  const A_MFLAGS = anyMushroom ? alloc(mushFlagCount) : -1;
  // A selected Sound Editor asset is sequenced over subsequent frames. The
  // built-in blip remains fire-and-forget and consumes no extra RAM.
  const A_SFX_ACTIVE = compiledEatSound ? alloc(1) : -1;
  const A_SFX_TIMER = compiledEatSound ? alloc(1) : -1;
  const A_SFX_PTR = compiledEatSound ? alloc(2) : -1;
  // Travelling bullet lantern. Needs the mushroom block's repair machinery, so
  // it only exists when both are present.
  const lantern = anyMushroom ? options.bulletLantern : undefined;
  const A_BL_ON = lantern ? alloc(1) : -1;   // a lantern is currently painted
  const A_BL_X = lantern ? alloc(1) : -1;    // centre it was last painted at
  const A_BL_Y = lantern ? alloc(1) : -1;
  const ramBytes = cursor - ramBase;

  const equ = (name: string, address: number) =>
    `${name.padEnd(30)} EQU #${address.toString(16).toUpperCase().padStart(4, '0')}\n`;

  const equates =
    equ('bitmap_light_x', A_X) +
    equ('bitmap_light_y', A_Y) +
    equ('bitmap_light_tx', A_TX) +
    equ('bitmap_light_ty', A_TY) +
    equ('bitmap_light_active', A_ACTIVE) +
    equ('bitmap_light_page', A_PAGE) +
    equ('bitmap_light_op_clr', A_OP_CLR) +
    equ('bitmap_light_op_cmd', A_OP_CMD) +
    equ('bitmap_light_d', A_D) +
    equ('bitmap_light_xsign', A_XSIGN) +
    equ('bitmap_light_xadj', A_XADJ) +
    equ('bitmap_light_ybias', A_YBIAS) +
    equ('bitmap_light_rx', A_RX) +
    equ('bitmap_light_ry', A_RY) +
    equ('bitmap_light_rw', A_RW) +
    equ('bitmap_light_rh', A_RH) +
    equ('bitmap_light_band_y', A_BY) +
    equ('bitmap_light_band_h', A_BH) +
    equ('bitmap_light_band_hw', A_BHW) +
    equ('bitmap_light_srx', A_SRX) +
    equ('bitmap_light_sry', A_SRY) +
    equ('bitmap_light_srw', A_SRW) +
    equ('bitmap_light_srh', A_SRH) +
    equ('bitmap_light_tx0', A_TX0) +
    equ('bitmap_light_ty0', A_TY0) +
    equ('bitmap_light_tw', A_TW) +
    equ('bitmap_light_th', A_TH) +
    equ('bitmap_light_protect', A_PROTECT) +
    (torchSkill
      ? equ('bitmap_light_on', A_ON) +
        equ('bitmap_light_stage', A_STAGE) +
        equ('bitmap_light_timer', A_TIMER) +
        equ('bitmap_light_bands_ptr', A_BANDS_PTR) +
        equ('bitmap_light_sdown_ptr', A_SDOWN_PTR) +
        equ('bitmap_light_sdown_n', A_SDOWN_N) +
        equ('bitmap_light_sup_ptr', A_SUP_PTR) +
        equ('bitmap_light_sup_n', A_SUP_N) +
        equ('bitmap_light_cxmin', A_CXMIN) +
        equ('bitmap_light_cxmax', A_CXMAX)
      : '') +
    (anyMushroom
      ? equ('bitmap_mush_cx', A_MCX) +
        equ('bitmap_mush_cy', A_MCY) +
        equ('bitmap_mush_ex', A_MEX) +
        equ('bitmap_mush_ey', A_MEY) +
        equ('bitmap_mush_flag', A_MFLAG) +
        equ('bitmap_mush_sx', A_MSX) +
        equ('bitmap_mush_sy', A_MSY) +
        equ('bitmap_mush_flags', A_MFLAGS)
      : '') +
    (compiledEatSound
      ? equ('bitmap_light_sfx_active', A_SFX_ACTIVE) +
        equ('bitmap_light_sfx_timer', A_SFX_TIMER) +
        equ('bitmap_light_sfx_ptr', A_SFX_PTR)
      : '') +
    (lantern
      ? equ('bitmap_bl_on', A_BL_ON) +
        equ('bitmap_bl_x', A_BL_X) +
        equ('bitmap_bl_y', A_BL_Y)
      : '');

  const initAsm = `    xor a
    ld (bitmap_light_active), a       ; no halo painted yet
    ld (bitmap_light_protect), a
${lantern ? '    ld (bitmap_bl_on), a              ; no bullet lantern painted\n' : ''}${compiledEatSound ? '    ld (bitmap_light_sfx_active), a\n' : ''}${torchSkill
    ? `    ld (bitmap_light_stage), a
    ld a, ${torchConfig?.startsLit === true ? 1 : 0}
    ld (bitmap_light_on), a           ; the tail starts ${torchConfig?.startsLit === true ? 'glowing' : 'dark: eat a mushroom'}
    ld hl, ${stageFrames}
    ld (bitmap_light_timer), hl
    call bitmap_light_load_stage      ; stage pointers/clamps must be valid before the first paint
`
    : ''}`;

  // ---------------------------------------------------------------- ROM data
  const lampTablesAsm = torchSkill
    ? ''
    : `${bandTableAsm('bitmap_light_bands', LAMP_HALF_WIDTHS, 'signed Y offset from the halo centre, height, half width')}
${stepTableAsm('bitmap_light_step_down', buildStepTable(LAMP_HALF_WIDTHS, 'down'), 'cy + yOff')}
${stepTableAsm('bitmap_light_step_up', buildStepTable(LAMP_HALF_WIDTHS, 'up'), 'cy + yOff - d')}`;

  const stageTablesAsm = torchSkill
    ? STAGE_HALF_WIDTHS.map((halfWidths, stage) =>
        `${bandTableAsm(`bitmap_light_bands_${stage}`, halfWidths, `stage ${stage}: signed Y offset, height, half width`)}
${stepTableAsm(`bitmap_light_step_down_${stage}`, buildStepTable(halfWidths, 'down'), 'cy + yOff')}
${stepTableAsm(`bitmap_light_step_up_${stage}`, buildStepTable(halfWidths, 'up'), 'cy + yOff - d')}`
      ).join('\n')
      + `\nbitmap_light_stage_table:
    ; per stage: bands, step-down table + count, step-up table + count, cx clamp
${STAGE_HALF_WIDTHS.map((halfWidths, stage) =>
  `    DW bitmap_light_bands_${stage}
    DW bitmap_light_step_down_${stage}
    DB ${buildStepTable(halfWidths, 'down').length}
    DW bitmap_light_step_up_${stage}
    DB ${buildStepTable(halfWidths, 'up').length}
    DB ${stageCxMin(stage)}, ${stageCxMax(stage)}`).join('\n')}

${Array.from({ length: STAGE_COUNT - 1 }, (_unused, stage) =>
  ringTableAsm(
    `bitmap_light_ring_${stage}`,
    buildRingTable(stage, stage + 1),
    `ring between stage ${stage} and stage ${stage + 1}`,
  )).join('\n')}
bitmap_light_ring_ptr_table:
${Array.from({ length: STAGE_COUNT - 1 }, (_unused, stage) => `    DW bitmap_light_ring_${stage}`).join('\n')}
bitmap_light_ring_count_table:
    DB ${Array.from({ length: STAGE_COUNT - 1 }, (_unused, stage) => buildRingTable(stage, stage + 1).length).join(',')}
`
    : '';

  const mushroomRoomTables = anyMushroom
    ? rooms.map((_room, roomIndex) => mushrooms.filter(item => item.roomIndex === roomIndex))
    : [];
  const mushroomDataAsm = anyMushroom
    ? `${mushroomRoomTables.map((items, roomIndex) =>
        items.length > 0
          ? `bitmap_mush_room_${roomIndex}:    ; glow X/Y, cell X/Y, flag, atlas source X/Y (8 bytes)\n`
            + items.map(item => `    DB ${item.glowX}, ${item.glowY}, ${item.cellX}, ${item.cellY}, ${item.flagIndex}, ${item.tileSourceX}, ${item.tileSourceY & 0xff}, ${(item.tileSourceY >> 8) & 0xff}`).join('\n') + '\n'
          : `bitmap_mush_room_${roomIndex}:    ; no mushrooms in this room\n`
      ).join('')}bitmap_mush_ptr_table:
${mushroomRoomTables.map((_items, index) => `    DW bitmap_mush_room_${index}`).join('\n')}
bitmap_mush_count_table:
    DB ${mushroomRoomTables.map(items => items.length).join(',')}

bitmap_mush_bands:
    ; signed Y offset from the mushroom centre, height, half width
${MUSH_BAND_ROWS.map(([dy, h], band) => `    DB ${hex2(dy)}, ${h}, ${MUSH_HALF_WIDTHS[band]}`).join('\n')}

bitmap_mush_bg_table:
    ; room backdrop colour used to wipe an eaten mushroom's tile. Forced into
    ; 0..7: in a dark room the 8..15 half of the palette is the dimmed twin, and
    ; the wiped cell is always inside the halo the player just relit.
    DB ${rooms.map(room => clampInt(room?.backgroundColor, 0, 15, 0) & 0x07).join(',')}

`
    : '';

  const dataAsm = `bitmap_light_room_flags:
    DB ${flags.join(',')}    ; 1 = dark room (the player is the only light source)

${lampTablesAsm}${stageTablesAsm}${mushroomDataAsm}${compiledEatSound?.dataAsm || ''}`;

  // ---------------------------------------------------------------- routines
  // Table access differs between the lamp (one fixed geometry, resolved at build
  // time) and the tail (one geometry per decay stage, resolved through the
  // stage descriptor cache). Everything else is shared.
  const loadBandsHl = torchSkill
    ? '    ld hl, (bitmap_light_bands_ptr)\n'
    : '    ld hl, bitmap_light_bands\n';
  const loadStepDown = torchSkill
    ? `    ld hl, (bitmap_light_sdown_ptr)
    ld a, (bitmap_light_sdown_n)
    ld b, a
`
    : `    ld hl, bitmap_light_step_down
    ld b, ${buildStepTable(LAMP_HALF_WIDTHS, 'down').length}
`;
  const loadStepUp = torchSkill
    ? `    ld hl, (bitmap_light_sup_ptr)
    ld a, (bitmap_light_sup_n)
    ld b, a
`
    : `    ld hl, bitmap_light_step_up
    ld b, ${buildStepTable(LAMP_HALF_WIDTHS, 'up').length}
`;
  // Horizontal clamp: constants for the lamp, the stage's own pair for the tail.
  const clampCxAsm = torchSkill
    ? `    ld c, a
    ld a, (bitmap_light_cxmin)
    cp c
    jr nc, .cx_clamped                ; centre left of the stage minimum
    ld a, (bitmap_light_cxmax)
    cp c
    jr c, .cx_clamped                 ; centre right of the stage maximum
    ld a, c
.cx_clamped:
`
    : `    cp ${stageCxMin(0)}
    jr nc, .cx_min_ok
    ld a, ${stageCxMin(0)}
.cx_min_ok:
    cp ${stageCxMax(0) + 1}
    jr c, .cx_clamped
    ld a, ${stageCxMax(0)}
.cx_clamped:
`;

  const sharedRoutinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_light_sprite_point_is_lit
; ------------------------------------------------------------
; PURPOSE:
;   Test a hardware-sprite point against the player's current halo. Bitmap
;   logical fills cannot affect the V9938 sprite layer, so sprite runtimes use
;   this result to select their dim or bright colour-table twin.
;
; INPUT:
;   D = absolute SCREEN 5 X, E = absolute SCREEN 5 Y.
;
; OUTPUT:
;   A = 1 and NZ when the point is inside one halo band; A = 0 and Z when the
;   room is fully lit, the tail is off, or the point lies outside the halo.
;
; DESTROYS:
;   AF, BC, HL.
;
; PRESERVES:
;   DE, IX, IY.
; ------------------------------------------------------------
bitmap_light_sprite_point_is_lit:
    ld a, (bitmap_light_active)
    or a
    ret z
${torchSkill ? `    ld a, (bitmap_light_on)
    or a
    ret z
` : ''}    push de
${loadBandsHl}    ld b, ${BAND_ROWS.length}
.sprite_light_band_loop:
    ld a, (hl)                ; signed band Y offset
    inc hl
    ld c, a
    ld a, (bitmap_light_y)
    add a, c                  ; A = band top
    ld c, a
    ld a, e
    sub c                     ; A = pointY - bandTop
    jp c, .sprite_light_skip_y
    ld c, a
    ld a, (hl)                ; band height
    inc hl
    cp c
    jp c, .sprite_light_skip_hw
    jp z, .sprite_light_skip_hw
    ld c, (hl)                ; half width
    inc hl
    ld a, (bitmap_light_x)
    sub c                     ; A = band left
    ld c, a
    ld a, d
    sub c                     ; A = pointX - bandLeft
    jp c, .sprite_light_next
    dec hl
    ld c, (hl)
    inc hl
    sla c                     ; full band width
    cp c
    jp c, .sprite_light_yes
.sprite_light_next:
    djnz .sprite_light_band_loop
    pop de
    xor a
    ret
.sprite_light_skip_y:
    inc hl                    ; skip height
.sprite_light_skip_hw:
    inc hl                    ; skip half width
    jp .sprite_light_next
.sprite_light_yes:
    pop de
    ld a, 1
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_room_is_dark
; ------------------------------------------------------------
; PURPOSE:
;   Test whether the current room is lit only by the player.
;
; OUTPUT:
;   A = flag, Z set when the room is a normal (fully lit) room.
;
; DESTROYS:
;   AF, DE, HL.
; ------------------------------------------------------------
bitmap_light_room_is_dark:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_light_room_flags
    add hl, de
    ld a, (hl)
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_op_dim / bitmap_light_op_lit
; ------------------------------------------------------------
; PURPOSE:
;   Select the logical fill used by the next rectangles. OR #08 sets bit 3 of
;   every pixel nibble (colour N -> its dimmed twin N+8); AND #07 clears it.
;
; DESTROYS:
;   AF.
; ------------------------------------------------------------
bitmap_light_op_dim:
    ld a, #08
    ld (bitmap_light_op_clr), a
    ld a, #82                 ; LMMV (#80) + logical OR (#02). NOT #A0: that is
                              ; LMCM, VRAM->CPU, which stalls waiting for reads.
    ld (bitmap_light_op_cmd), a
    ret

bitmap_light_op_lit:
    ld a, #07
    ld (bitmap_light_op_clr), a
    ld a, #81                 ; LMMV (#80) + logical AND (#01)
    ld (bitmap_light_op_cmd), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_rect
; ------------------------------------------------------------
; PURPOSE:
;   Run the selected logical fill over one rectangle. Coordinates are never
;   clipped here: every halo centre is clamped so each rectangle already lies
;   inside the game band.
;
; INPUT:
;   bitmap_light_rx / _ry = top-left corner, bitmap_light_rw = width (word),
;   bitmap_light_rh = height, bitmap_light_page = destination page (DY high),
;   bitmap_light_op_clr / _op_cmd = the fill selected above.
;
; DESTROYS:
;   AF, E.
;
; PRESERVES:
;   BC, D, HL, IX, IY.
;
; SIDE EFFECTS:
;   Leaves R#15 selecting S#2 (vdp_wait_cmd_ready). The caller restores S#0.
; ------------------------------------------------------------
bitmap_light_rect:
    call vdp_wait_cmd_ready
    ld a, #11
    ld e, #24                 ; R#17 = 36: indirect writes start at R#36 (DX)
    call vdp_write_register
    ld a, (bitmap_light_rx)
    out (#9B), a              ; DX low
    xor a
    out (#9B), a              ; DX high
    ld a, (bitmap_light_ry)
    out (#9B), a              ; DY low
    ld a, (bitmap_light_page)
    out (#9B), a              ; DY high = page (SCREEN 5 page N starts at y=N*256)
    ld a, (bitmap_light_rw)
    out (#9B), a              ; NX low
    ld a, (bitmap_light_rw + 1)
    out (#9B), a              ; NX high
    ld a, (bitmap_light_rh)
    out (#9B), a              ; NY low
    xor a
    out (#9B), a              ; NY high
    ld a, (bitmap_light_op_clr)
    out (#9B), a              ; CLR
    xor a
    out (#9B), a              ; ARG
    ld a, (bitmap_light_op_cmd)
    out (#9B), a              ; CMD
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_load_band
; ------------------------------------------------------------
; PURPOSE:
;   Resolve one band record against the current halo centre.
;
; INPUT:
;   HL = band record (signed dy, height, half width), bitmap_light_y = centre.
;
; OUTPUT:
;   bitmap_light_band_y / _band_h / _band_hw, HL advanced past the record.
;
; DESTROYS:
;   AF, E, HL.
; ------------------------------------------------------------
bitmap_light_load_band:
    ld a, (bitmap_light_y)
    ld e, a
    ld a, (hl)                ; signed offset; the clamped centre keeps the
    add a, e                  ; result inside the game band, so 8-bit is enough
    ld (bitmap_light_band_y), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_band_h), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_band_hw), a
    inc hl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_draw_bands
; ------------------------------------------------------------
; PURPOSE:
;   Apply the selected fill to the whole halo (every band, full width).
;   Used when the halo appears or dies, not for the per-frame delta.
;
; INPUT:
;   bitmap_light_x / _y = halo centre, fill already selected.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_draw_bands:
${loadBandsHl}    ld b, ${BAND_COUNT}
.band_loop:
    push bc
    call bitmap_light_load_band
    push hl
    ld a, (bitmap_light_band_hw)
    ld c, a
    ld a, (bitmap_light_x)
    sub c
    ld (bitmap_light_rx), a
    ld a, c
    add a, a                  ; width = 2 * half width (<= 80)
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, (bitmap_light_band_y)
    ld (bitmap_light_ry), a
    ld a, (bitmap_light_band_h)
    ld (bitmap_light_rh), a
    call ${SUBMIT}
    pop hl
    pop bc
    djnz .band_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_target
; ------------------------------------------------------------
; PURPOSE:
;   Halo centre the player wants this frame: his own centre, clamped so the blob
;   never crosses the edges of the game band. The clamp is what lets every
;   rectangle skip clipping.
;
; OUTPUT:
;   bitmap_light_tx / bitmap_light_ty.
;
; DESTROYS:
;   AF${torchSkill ? ', C' : ''}.
; ------------------------------------------------------------
bitmap_light_target:
    ld a, (player_x)
    add a, ${centerX}
    jr nc, .cx_no_wrap
    ld a, 255
.cx_no_wrap:
${clampCxAsm}    ld (bitmap_light_tx), a
    ld a, (player_y)
    add a, ${centerY}
    jr nc, .cy_no_wrap
    ld a, 255
.cy_no_wrap:
    cp ${CY_MIN}
    jr nc, .cy_min_ok
    ld a, ${CY_MIN}
.cy_min_ok:
    cp ${CY_MAX + 1}
    jr c, .cy_max_ok
    ld a, ${CY_MAX}
.cy_max_ok:
    ld (bitmap_light_ty), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_paint_full
; ------------------------------------------------------------
; PURPOSE:
;   Cut the room's light sources out of the darkness. Runs once per room, on the
;   hidden page before the flip (or on the visible page at boot), never in the
;   steady-state frame budget.
;
;${composeDimmed
    ? `   The darkness itself is NOT painted here: the room's command program already
;   composed it from the pre-dimmed twin of the atlas, so this only has to light
;   the mushrooms and the halo. That is what removed the 256x192 LMMV OR — the
;   single most expensive blit of the engine at 292 ms — from every room entry.`
    : `   Dims the whole game band first, then cuts the light sources out of it.`}
;
; INPUT:
;   bitmap_light_page = destination page.
;
; OUTPUT:
;   bitmap_light_x / _y = halo centre, bitmap_light_active = 1.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_paint_full:
${anyMushroom ? '    call bitmap_mush_clear_flags      ; entering the room grows every mushroom back\n' : ''}${composeDimmed
    ? ''
    : `    call bitmap_light_op_dim
    xor a
    ld (bitmap_light_rx), a
    ld (bitmap_light_rw), a
    ld a, ${GAME_Y}
    ld (bitmap_light_ry), a
    ld a, 1
    ld (bitmap_light_rw + 1), a       ; NX = 256, the full row
    ld a, ${GAME_H}
    ld (bitmap_light_rh), a
    call bitmap_light_rect            ; unrepaired on purpose: the mushrooms are
                                      ; cut out of this fill right below
`}${anyMushroom ? '    call bitmap_light_paint_mushrooms ; static glows, before the moving one\n' : ''}    call bitmap_light_target
    ld a, (bitmap_light_tx)
    ld (bitmap_light_x), a
    ld a, (bitmap_light_ty)
    ld (bitmap_light_y), a
${torchSkill
    ? `    ld a, (bitmap_light_on)
    or a
    jp z, .light_full_done            ; tail dark: only the mushrooms light this room
`
    : ''}    call bitmap_light_op_lit
    call bitmap_light_draw_bands
${torchSkill ? '.light_full_done:\n' : ''}    ; Drain the engine before returning: every rectangle above is issued
    ; fire-and-forget, and commit_room_flip publishes the page right after this
    ; call with no wait of its own. With the halo drawn the band rects served as
    ; that wait (each starts with vdp_wait_cmd_ready), but the tail-dark path
    ; skips them and the flip caught the last fill mid-flight: the room appeared
    ; lit and then darkened top-down, a visible raster sweep. Once per room load,
    ; never in the steady-state frame budget.
    call ${musicTick ? 'bitmap_light_drain_cmd' : 'vdp_wait_cmd_ready'}
    ld a, 1
    ld (bitmap_light_active), a
    ret
${musicTick ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_light_drain_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Wait for the room-entry paint to finish WITHOUT stalling the song. The
;   full-band dim fill is the longest blit of a whole transition, so draining it
;   with a bare vdp_wait_cmd_ready held the CPU for several frames and the music
;   audibly stopped on every screen change. Same keep-alive contract as
;   step_room_composition: poll S#0 and tick the driver once per elapsed vblank.
;
; OUTPUT:
;   Command engine idle, R#15 = 2 (same exit state as vdp_wait_cmd_ready, and
;   the paint entry points restore R#15 = 0 via bitmap_light_restore_status).
;
; DESTROYS:
;   AF, BC, DE, HL (music_update).
; ------------------------------------------------------------
bitmap_light_drain_cmd:
.drain_loop:
    call read_vdp_status_2
    bit 0, a                  ; CE still set -> the fill is running
    ret z
    xor a
    out (#99), a
    ld a, #8F
    out (#99), a              ; R#15 = 0 -> status port reads S#0
    in a, (#99)               ; frame flag (bit 7); reading clears it
    bit 7, a
    call nz, music_update
    jp .drain_loop
` : ''}

; ------------------------------------------------------------
; FUNCTION: bitmap_light_paint_visible / bitmap_light_paint_pending
; ------------------------------------------------------------
; PURPOSE:
;   Room entry points. The pending variant paints the hidden page just before
;   commit_room_flip publishes it, so the room is never seen fully lit.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_paint_visible:
    call bitmap_light_room_is_dark
    jp z, bitmap_light_clear_state
    ld a, (bitmap_displayed_page)
    ld (bitmap_light_page), a
    call bitmap_light_paint_full
    jp bitmap_light_restore_status

bitmap_light_paint_pending:
    call bitmap_light_room_is_dark
    jp z, bitmap_light_clear_state
    ld a, (bitmap_pending_display_page)
    ld (bitmap_light_page), a
    call bitmap_light_paint_full
    jp bitmap_light_restore_status

bitmap_light_clear_state:
    xor a
    ld (bitmap_light_active), a       ; lit room: nothing painted, nothing to track
    ret

bitmap_light_restore_status:
    ; The command helpers leave R#15 on S#2; the main loop polls S#0 for vblank.
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_light_save_src
; ------------------------------------------------------------
; PURPOSE:
;   Latch the current rectangle as the SOURCE of the intersection tests below.
;   The relight passes reuse bitmap_light_rx / _ry / _rw / _rh as their output,
;   so the rectangle being repaired has to be kept somewhere else.
;
; DESTROYS: AF.
; ------------------------------------------------------------
bitmap_light_save_src:
    ld a, (bitmap_light_rx)
    ld (bitmap_light_srx), a
    ld a, (bitmap_light_ry)
    ld (bitmap_light_sry), a
    ld a, (bitmap_light_rw)
    ld (bitmap_light_srw), a
    ld a, (bitmap_light_rh)
    ld (bitmap_light_srh), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_intersect
; ------------------------------------------------------------
; PURPOSE:
;   Intersect the saved source rectangle with the target rectangle. Widths are
;   measured FORWARD from the intersection corner (w - (i - x)) instead of
;   comparing right edges, because a right edge can legitimately be 256 and
;   would wrap in 8 bits.
;
; INPUT:
;   bitmap_light_srx / _sry / _srw / _srh = source (the rectangle just dimmed),
;   bitmap_light_tx0 / _ty0 / _tw / _th   = target (a glow band or its bbox).
;
; OUTPUT:
;   Z set when the two are disjoint. Otherwise NZ and bitmap_light_rx / _ry /
;   _rw / _rh hold the intersection, ready for bitmap_light_rect.
;
; DESTROYS: AF, BC, DE.  PRESERVES: HL, IX, IY.
; ------------------------------------------------------------
bitmap_light_intersect:
    ld a, (bitmap_light_srx)
    ld b, a
    ld a, (bitmap_light_tx0)
    ld c, a
    cp b
    jr nc, .tl_ix_ok
    ld a, b                   ; A = max(srx, tx0)
.tl_ix_ok:
    ld (bitmap_light_rx), a
    sub b                     ; how far into the source rectangle
    ld e, a
    ld a, (bitmap_light_srw)
    sub e
    jp z, .tl_no_overlap
    jp c, .tl_no_overlap
    ld d, a                   ; D = source width left of its right edge
    ld a, (bitmap_light_rx)
    sub c                     ; how far into the target rectangle
    ld e, a
    ld a, (bitmap_light_tw)
    sub e
    jp z, .tl_no_overlap
    jp c, .tl_no_overlap
    cp d
    jr c, .tl_keep_w
    ld a, d
.tl_keep_w:
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, (bitmap_light_sry)
    ld b, a
    ld a, (bitmap_light_ty0)
    ld c, a
    cp b
    jr nc, .tl_iy_ok
    ld a, b                   ; A = max(sry, ty0)
.tl_iy_ok:
    ld (bitmap_light_ry), a
    sub b
    ld e, a
    ld a, (bitmap_light_srh)
    sub e
    jp z, .tl_no_overlap
    jp c, .tl_no_overlap
    ld d, a
    ld a, (bitmap_light_ry)
    sub c
    ld e, a
    ld a, (bitmap_light_th)
    sub e
    jp z, .tl_no_overlap
    jp c, .tl_no_overlap
    cp d
    jr c, .tl_keep_h
    ld a, d
.tl_keep_h:
    ld (bitmap_light_rh), a
    or a                      ; height >= 1 here, so NZ = they overlap
    ret
.tl_no_overlap:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_relight_halo
; ------------------------------------------------------------
; PURPOSE:
;   Cut the player's halo back out of the saved source rectangle: every band
;   that overlaps it is re-lit, so a rectangle dimmed under the player's feet
;   does not punch a hole in the light he is standing in.
;
; INPUT:
;   bitmap_light_srx / _sry / _srw / _srh = the rectangle that was just dimmed.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_relight_halo:
${torchSkill ? `    ld a, (bitmap_light_on)
    or a
    ret z                     ; tail out: there is no halo to give back
` : ''}${loadBandsHl}    ld b, ${BAND_COUNT}
.tl_rhalo_band:
    push bc
    ld a, (bitmap_light_y)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ty0), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_th), a
    inc hl
    ld a, (bitmap_light_x)
    sub (hl)
    ld (bitmap_light_tx0), a
    ld a, (hl)
    add a, a
    ld (bitmap_light_tw), a
    inc hl
    call bitmap_light_intersect
    jr z, .tl_rhalo_next
    call bitmap_light_op_lit
    call bitmap_light_rect    ; preserves BC and HL: no stack needed here
.tl_rhalo_next:
    pop bc
    djnz .tl_rhalo_band
    ret

${anyMushroom ? `; ------------------------------------------------------------
; FUNCTION: bitmap_light_repair_halo
; ------------------------------------------------------------
; PURPOSE:
;   The halo relight above, but only while bitmap_light_protect is set. Inside
;   the halo passes it must NOT run: there the dimmed strip is the one the halo
;   is leaving behind, and protecting it would freeze the light in place. It is
;   set for an eaten mushroom's glow being put out under the player's feet, and
;   for the runtime repaints below.
;
; INPUT:
;   bitmap_light_srx / _sry / _srw / _srh = the rectangle that was just dimmed.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_repair_halo:
    ld a, (bitmap_light_protect)
    or a
    ret z
    jp bitmap_light_relight_halo
` : ''}
; ------------------------------------------------------------
; FUNCTION: bitmap_light_dim_repaint
; ------------------------------------------------------------
; PURPOSE:
;   Bring a rectangle that was just repainted down to the light level of the
;   room it landed on. Every overlay command template — a pickup metatile, the
;   background restored under a collected one, a door swinging open, a chipped
;   tile — is authored from the LIT atlas, so in a dark room it left a brightly
;   lit patch floating in the darkness. The room itself is composed from the
;   dimmed twin of that same atlas, so a plain OR #08 over the rectangle lands
;   on exactly the colours the composition would have painted there.
;
;   Then the light sources are cut back out of it: a pickup is collected at the
;   player's feet, which is precisely where his halo is, and leaving the cell
;   dark there would be as wrong as leaving it lit in the dark.
;
;   Lit rooms return on the first compare, so this costs a table read per
;   repaint in a project that has dark rooms at all.
;
; INPUT:
;   bitmap_light_rx / _ry (page row) / _rw (word) / _rh = the painted rectangle,
;   bitmap_light_page = the page it was painted on.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_dim_repaint:
    call bitmap_light_room_is_dark
    ret z
    call bitmap_light_op_dim
    call bitmap_light_rect
    ; Room entry draws its overlays BEFORE bitmap_light_paint_full cuts the
    ; light out, and bitmap_light_x / _y still hold the previous room's centre:
    ; dim only, the paint below gets the light sources right.
    ld a, (bitmap_composition_state)
    or a
    ret nz
    ld a, (bitmap_light_active)
    or a
    ret z                     ; no halo painted yet (boot, before the first paint)
${anyMushroom ? `    ld a, 1
    ld (bitmap_light_protect), a      ; give the halo back too, not just the glows
    call bitmap_light_repair          ; latches the source rectangle itself
    xor a
    ld (bitmap_light_protect), a
    ret`
    : `    call bitmap_light_save_src
    jp bitmap_light_relight_halo`}

; ------------------------------------------------------------
; FUNCTION: bitmap_light_dim_cmd_block
; ------------------------------------------------------------
; PURPOSE:
;   bitmap_light_dim_repaint for the caller that has just launched a 15-byte
;   V9938 command from the shared scratch block at #${cmdBlockAddr.toString(16).toUpperCase()}: the destination
;   rectangle is read straight out of the block, so every overlay system gets
;   the dimming with one call and no bookkeeping of its own.
;
;   Registers are preserved because this hangs off the tail of launch routines
;   whose callers walk record tables in BC / HL.
;
; INPUT:
;   The block at #${cmdBlockAddr.toString(16).toUpperCase()} (DX, DY, NX, NY as just launched).
;
; DESTROYS: AF.  PRESERVES: BC, DE, HL, IX, IY.
;
; SIDE EFFECTS:
;   Leaves R#15 selecting S#2 when the room is dark (bitmap_light_rect); the
;   launch routines restore S#0 right after this call.
; ------------------------------------------------------------
bitmap_light_dim_cmd_block:
    push bc
    push de
    push hl
    ld a, (#${(cmdBlockAddr + 4).toString(16).toUpperCase()})               ; DX low
    ld (bitmap_light_rx), a
    ld a, (#${(cmdBlockAddr + 6).toString(16).toUpperCase()})               ; DY low: already a page row
    ld (bitmap_light_ry), a
    ld a, (#${(cmdBlockAddr + 8).toString(16).toUpperCase()})               ; NX
    ld (bitmap_light_rw), a
    ld a, (#${(cmdBlockAddr + 9).toString(16).toUpperCase()})
    ld (bitmap_light_rw + 1), a
    ld a, (#${(cmdBlockAddr + 10).toString(16).toUpperCase()})              ; NY (never crosses the page)
    ld (bitmap_light_rh), a
    ld a, (#${(cmdBlockAddr + 7).toString(16).toUpperCase()})               ; DY high = destination page
    ld (bitmap_light_page), a
    call bitmap_light_dim_repaint
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_shift_x
; ------------------------------------------------------------
; PURPOSE:
;   Move the halo horizontally by repainting only the strips that change: the
;   column the halo leaves behind is dimmed, the column it reaches is lit. Bands
;   are disjoint in Y, so each band is independent and pass order is free.
;
;   A drift of less than ${MIN_STEP} px is left pending (see MIN_STEP): each strip costs
;   the same whether it is 2 or ${MIN_STEP} px wide, so waiting halves the frames that pay.
;
; INPUT:
;   bitmap_light_tx = wanted centre, bitmap_light_x = current centre.
;
; OUTPUT:
;   bitmap_light_x advanced by ${MIN_STEP}..${MAX_STEP} px, or left alone.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_shift_x:
    ld a, (bitmap_light_x)
    ld c, a
    ld a, (bitmap_light_tx)
    sub c                     ; A = signed dx
    ret z
    jp m, .going_left
    cp ${MIN_STEP}
    ret c                     ; dead zone: not worth a pass yet
    cp ${MAX_STEP + 1}
    jr c, .right_step_ok
    ld a, ${MAX_STEP}
.right_step_ok:
    ld (bitmap_light_d), a
    ; Moving right: the left edge is vacated, the right edge is gained.
    xor a
    ld (bitmap_light_xadj), a
    ld (bitmap_light_xsign), a        ; leaving strip sits at cx - hw
    call bitmap_light_op_dim
    call bitmap_light_strip_pass
    ld a, 1
    ld (bitmap_light_xsign), a        ; entering strip sits at cx + hw
    call bitmap_light_op_lit
    call bitmap_light_strip_pass
    ld a, (bitmap_light_d)
    ld c, a
    ld a, (bitmap_light_x)
    add a, c
    ld (bitmap_light_x), a
    ret
.going_left:
    neg
    cp ${MIN_STEP}
    ret c                     ; dead zone
    cp ${MAX_STEP + 1}
    jr c, .left_step_ok
    ld a, ${MAX_STEP}
.left_step_ok:
    ld (bitmap_light_d), a
    ; Moving left: both strips are pulled back by d, and the roles swap.
    ld (bitmap_light_xadj), a
    ld a, 1
    ld (bitmap_light_xsign), a        ; leaving strip sits at cx + hw - d
    call bitmap_light_op_dim
    call bitmap_light_strip_pass
    xor a
    ld (bitmap_light_xsign), a        ; entering strip sits at cx - hw - d
    call bitmap_light_op_lit
    call bitmap_light_strip_pass
    ld a, (bitmap_light_x)
    ld c, a
    ld a, (bitmap_light_d)
    ld b, a
    ld a, c
    sub b
    ld (bitmap_light_x), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_strip_pass
; ------------------------------------------------------------
; PURPOSE:
;   One vertical-strip pass over every band, using the fill and the edge
;   selected by the caller.
;
; INPUT:
;   bitmap_light_xsign (0 = cx - hw, 1 = cx + hw), bitmap_light_xadj (0 or d),
;   bitmap_light_d = strip width.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_strip_pass:
${loadBandsHl}    ld b, ${BAND_COUNT}
.strip_loop:
    push bc
    call bitmap_light_load_band
    push hl
    ld a, (bitmap_light_band_hw)
    ld c, a
    ld a, (bitmap_light_xsign)
    or a
    ld a, (bitmap_light_x)
    jr z, .strip_minus
    add a, c
    jr .strip_adj
.strip_minus:
    sub c
.strip_adj:
    ld c, a
    ld a, (bitmap_light_xadj)
    ld b, a
    ld a, c
    sub b
    ld (bitmap_light_rx), a
    ld a, (bitmap_light_d)
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, (bitmap_light_band_y)
    ld (bitmap_light_ry), a
    ld a, (bitmap_light_band_h)
    ld (bitmap_light_rh), a
    call ${SUBMIT}
    pop hl
    pop bc
    djnz .strip_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_shift_y
; ------------------------------------------------------------
; PURPOSE:
;   Move the halo vertically. Only the pixels that genuinely change owner are
;   repainted: the full-width sliver entering at the leading end, the one leaving
;   at the trailing end, and at every band boundary just the difference in half
;   width. Repainting whole bands would cost 2.2x more for the same result.
;
;   Same ${MIN_STEP} px dead zone as the horizontal pass. Note this axis is the one that
;   can genuinely need a big step: a fall runs at up to the terminal velocity of
;   the Player Config, so the threshold is cleared every frame there and nothing
;   lags behind.
;
; INPUT:
;   bitmap_light_ty = wanted centre, bitmap_light_y = current centre,
;   bitmap_light_x = centre already updated by bitmap_light_shift_x.
;
; OUTPUT:
;   bitmap_light_y advanced by ${MIN_STEP}..${MAX_STEP} px (never more than the
;   shortest band, or two boundary row ranges would overlap), or left alone.
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_shift_y:
    ld a, (bitmap_light_y)
    ld c, a
    ld a, (bitmap_light_ty)
    sub c                     ; A = signed dy
    ret z
    jp m, .going_up
    cp ${MIN_STEP}
    ret c                     ; dead zone: not worth a pass yet
    cp ${MAX_STEP + 1}
    jr c, .down_step_ok
    ld a, ${MAX_STEP}
.down_step_ok:
    ld (bitmap_light_d), a
    xor a
    ld (bitmap_light_ybias), a        ; down: rectangles sit at cy + yOff
${loadStepDown}    call bitmap_light_step_pass
    ld a, (bitmap_light_d)
    ld c, a
    ld a, (bitmap_light_y)
    add a, c
    ld (bitmap_light_y), a
    ret
.going_up:
    neg
    cp ${MIN_STEP}
    ret c                     ; dead zone
    cp ${MAX_STEP + 1}
    jr c, .up_step_ok
    ld a, ${MAX_STEP}
.up_step_ok:
    ld (bitmap_light_d), a
    ld (bitmap_light_ybias), a        ; up: rectangles sit at cy + yOff - d
${loadStepUp}    call bitmap_light_step_pass
    ld a, (bitmap_light_y)
    ld c, a
    ld a, (bitmap_light_d)
    ld b, a
    ld a, c
    sub b
    ld (bitmap_light_y), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_step_pass
; ------------------------------------------------------------
; PURPOSE:
;   Run one vertical-step table. Each entry is a rectangle d rows tall placed
;   relative to the halo centre, with its own fill. Entries never share a row
;   range, so they can run in any order.
;
; INPUT:
;   HL = step table, B = entry count, bitmap_light_d = step height,
;   bitmap_light_ybias = 0 (down) or d (up).
;
; DESTROYS:
;   AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_step_pass:
.light_step_loop:
    ld a, (bitmap_light_y)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ry), a
    ld a, (bitmap_light_ybias)
    ld e, a
    ld a, (bitmap_light_ry)
    sub e                     ; up entries hang d rows higher
    ld (bitmap_light_ry), a
    inc hl
    ld a, (bitmap_light_x)
    add a, (hl)               ; + signed column offset
    ld (bitmap_light_rx), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    inc hl
    ld a, (bitmap_light_d)
    ld (bitmap_light_rh), a
    ld a, (hl)                ; 1 = light, 0 = dim
    inc hl
    or a
    jr z, .light_step_dim
    call bitmap_light_op_lit
    jr .light_step_fire
.light_step_dim:
    call bitmap_light_op_dim
.light_step_fire:
    call ${SUBMIT}            ; preserves B and HL, so the loop needs no stack
    djnz .light_step_loop
    ret
`;

  // ------------------------------------------------------- mushroom routines
  const hbLeft = hitbox.x;
  const hbRight = hitbox.x + hitbox.w - 1;
  const hbTop = hitbox.y;
  const hbBottom = hitbox.y + hitbox.h - 1;
  const addA = (n: number) => (n > 0 ? `    add a, ${n}\n` : '');

  const mushroomRoutinesAsm = anyMushroom ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_mush_room_table
; ------------------------------------------------------------
; PURPOSE:
;   Resolve the current room's mushroom table (8 bytes each: clamped glow
;   centre, cell corner, eaten-flag index and selected atlas tile source).
;
; OUTPUT:
;   HL = first record, B = mushroom count. Z set (B = 0) when the room has none.
;
; DESTROYS: AF, B, DE, HL.  PRESERVES: C, IX, IY.
; ------------------------------------------------------------
bitmap_mush_room_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_mush_count_table
    add hl, de
    ld b, (hl)
    ld hl, bitmap_mush_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld a, b
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_clear_flags
; ------------------------------------------------------------
; PURPOSE:
;   Forget which mushrooms were eaten. Room paint still resets the local flags;
;   normal gameplay also regenerates them when the tail timer reaches zero.
;
; DESTROYS: AF, B, HL.
; ------------------------------------------------------------
bitmap_mush_clear_flags:
    ld hl, bitmap_mush_flags
    ld b, ${mushFlagCount}
    xor a
.tl_mush_clear_loop:
    ld (hl), a
    inc hl
    djnz .tl_mush_clear_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_eaten
; ------------------------------------------------------------
; PURPOSE:
;   Read the eaten flag of one mushroom.
;
; INPUT:   A = flag index.
; OUTPUT:  A = flag, Z set when the mushroom is still there.
; DESTROYS: AF, DE, HL.  PRESERVES: BC, IX, IY.
; ------------------------------------------------------------
bitmap_mush_eaten:
    ld e, a
    ld d, 0
    ld hl, bitmap_mush_flags
    add hl, de
    ld a, (hl)
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_draw_glow
; ------------------------------------------------------------
; PURPOSE:
;   Apply the selected fill to one mushroom glow (every band, full width).
;
; INPUT:
;   bitmap_mush_cx / _cy = glow centre, fill already selected.
;
; DESTROYS: AF, C, DE, HL.  PRESERVES: B, IX, IY.
; ------------------------------------------------------------
bitmap_mush_draw_glow:
    ld hl, bitmap_mush_bands
    ld c, ${MUSH_BAND_ROWS.length}
.tl_glow_loop:
    ld a, (bitmap_mush_cy)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ry), a
    inc hl
    ld a, (hl)                ; band height
    ld (bitmap_light_rh), a
    inc hl
    ld a, (bitmap_mush_cx)
    sub (hl)                  ; centre - half width
    ld (bitmap_light_rx), a
    ld a, (hl)
    add a, a                  ; width = 2 * half width
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    inc hl
    push bc
    push hl
    call ${SUBMIT}
    pop hl
    pop bc
    dec c
    jp nz, .tl_glow_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_erase_tile
; ------------------------------------------------------------
; PURPOSE:
;   Wipe the eaten mushroom's 16x16 cell to the room backdrop colour, so the
;   mushroom is really gone and not just switched off. LMMV with no logical
;   operation (#80) paints the colour straight over the cell; every other fill
;   in this file uses the OR/AND variants instead.
;
;   It runs AFTER the tail has been relit, so the cell is inside the lit halo
;   and the lit backdrop colour is the right one. The selected atlas tile is
;   copied back by bitmap_mush_regenerate_eaten when the tail burns out.
;
; INPUT:
;   bitmap_mush_ex / _ey = cell top-left in room pixels.
;
; DESTROYS: AF, DE, HL.  PRESERVES: BC, IX, IY.
; ------------------------------------------------------------
bitmap_mush_erase_tile:
    ld a, (bitmap_mush_ex)
    ld (bitmap_light_rx), a
    ld a, (bitmap_mush_ey)
    add a, ${GAME_Y}                    ; room row -> page row
    ld (bitmap_light_ry), a
    ld a, ${TILE_GRID_SIZE}
    ld (bitmap_light_rw), a
    ld (bitmap_light_rh), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_mush_bg_table
    add hl, de
    ld a, (hl)
    ld (bitmap_light_op_clr), a       ; backdrop colour, not a light level
    ld a, #80                         ; LMMV + IMP: write the colour as it is
    ld (bitmap_light_op_cmd), a
    jp bitmap_light_rect

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_restore_tile
; ------------------------------------------------------------
; PURPOSE:
;   Copy the mushroom's selected 16x16 tile from the shared SCREEN 5 atlas back
;   to its cell on the displayed page. #FFFF means the entity has no valid tile:
;   its collision/glow still regenerate, but there is no bitmap to copy.
;
; INPUT:
;   bitmap_mush_sx / _sy = absolute atlas source X/Y.
;   bitmap_mush_ex / _ey = destination cell in room pixels.
;   bitmap_light_page = displayed SCREEN 5 page.
;
; DESTROYS: AF, E.  PRESERVES: BC, D, HL, IX, IY.
;
; SIDE EFFECTS:
;   Starts one V9938 HMMM command and leaves R#15 selecting S#2. The outer
;   bitmap_light_update path restores S#0 before returning to gameplay.
; ------------------------------------------------------------
bitmap_mush_restore_tile:
    ld a, (bitmap_mush_sy + 1)
    cp #FF
    jp nz, .tl_mush_restore_do
    ld a, (bitmap_mush_sy)
    cp #FF
    ret z
.tl_mush_restore_do:
    call vdp_wait_cmd_ready
    ld e, #20                 ; R#17 = 32: SX,SY,DX,DY,NX,NY,COL,ARG,CMD
    ld a, #11
    call vdp_write_register
    ld a, (bitmap_mush_sx)
    out (#9B), a              ; SX low
    xor a
    out (#9B), a              ; SX high
    ld a, (bitmap_mush_sy)
    out (#9B), a              ; SY low
    ld a, (bitmap_mush_sy + 1)
    out (#9B), a              ; SY high
    ld a, (bitmap_mush_ex)
    out (#9B), a              ; DX low
    xor a
    out (#9B), a              ; DX high
    ld a, (bitmap_mush_ey)
    add a, ${GAME_Y}
    out (#9B), a              ; DY low
    ld a, (bitmap_light_page)
    out (#9B), a              ; DY high = displayed page
    ld a, ${TILE_GRID_SIZE}
    out (#9B), a              ; NX low
    xor a
    out (#9B), a              ; NX high
    ld a, ${TILE_GRID_SIZE}
    out (#9B), a              ; NY low
    xor a
    out (#9B), a              ; NY high
    out (#9B), a              ; COL (unused by HMMM)
    out (#9B), a              ; ARG
    ld a, #D0                 ; HMMM + IMP
    out (#9B), a              ; CMD
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_mush_regenerate_eaten
; ------------------------------------------------------------
; PURPOSE:
;   When the configured glow time is exhausted, regenerate every mushroom eaten
;   in the current room: clear its flag, restore its selected tile and relight
;   its static glow.
;
; DESTROYS: AF, BC, DE, HL.  PRESERVES: IX, IY.
; ------------------------------------------------------------
bitmap_mush_regenerate_eaten:
    call bitmap_mush_room_table
    ret z
.tl_mush_regen_loop:
    push bc
    ld a, (hl)
    ld (bitmap_mush_cx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_cy), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_ex), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_ey), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_flag), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_sx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_sy), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_sy + 1), a
    inc hl
    push hl                   ; next 8-byte record
    ld a, (bitmap_mush_flag)
    call bitmap_mush_eaten
    jp z, .tl_mush_regen_next
    ld a, (bitmap_mush_flag)
    ld e, a
    ld d, 0
    ld hl, bitmap_mush_flags
    add hl, de
    xor a
    ld (hl), a               ; edible again before its glow is repaired
    call bitmap_mush_restore_tile
    call bitmap_light_op_lit
    call bitmap_mush_draw_glow
.tl_mush_regen_next:
    pop hl
    pop bc
    dec b
    jp nz, .tl_mush_regen_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_paint_mushrooms
; ------------------------------------------------------------
; PURPOSE:
;   Cut every uneaten mushroom of the current room out of the darkness. Runs
;   once per room, right after the full dark fill.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_paint_mushrooms:
    call bitmap_mush_room_table
    ret z
    call bitmap_light_op_lit
.tl_paint_loop:
    push bc
    ld a, (hl)
    ld (bitmap_mush_cx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_cy), a
    inc hl
    inc hl                    ; skip the eat hitbox corner
    inc hl
    ld a, (hl)                ; flag index
    inc hl
    inc hl                    ; skip atlas source X
    inc hl                    ; skip atlas source Y low/high
    inc hl
    push hl
    call bitmap_mush_eaten
    jp nz, .tl_paint_next     ; already eaten: wait for timer expiry/regeneration
    call bitmap_mush_draw_glow
.tl_paint_next:
    pop hl
    pop bc
    dec b
    jp nz, .tl_paint_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_repair
; ------------------------------------------------------------
; PURPOSE:
;   Re-light whatever the rectangle just dimmed took away from a mushroom glow.
;   Dimming is a logical OR, so without this the halo would swallow every
;   mushroom it swept over, permanently. Eaten mushrooms are skipped, which is
;   also what keeps them dark once their glow has been put out.
;
;   The bounding box of each glow is tested first, so a halo far from any
;   mushroom pays two subtractions and a compare per mushroom.
;
; INPUT:
;   bitmap_light_rx / _ry / _rw / _rh = the rectangle that was just dimmed.
;
; OUTPUT:
;   The dim fill is reselected, so the caller's pass continues unaffected.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_repair:
    call bitmap_light_save_src
    call bitmap_mush_room_table
    jp z, bitmap_light_op_dim
.tl_repair_loop:
    push bc
    ld a, (hl)
    ld (bitmap_mush_cx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_cy), a
    inc hl
    inc hl                    ; skip the eat hitbox corner
    inc hl
    ld a, (hl)                ; flag index
    inc hl
    inc hl                    ; skip atlas source X
    inc hl                    ; skip atlas source Y low/high
    inc hl
    push hl
    call bitmap_mush_eaten
    jp nz, .tl_repair_next    ; eaten glows have nothing left to protect
    ld a, (bitmap_mush_cx)
    sub ${MUSH_HW_MAX}
    ld (bitmap_light_tx0), a
    ld a, ${2 * MUSH_HW_MAX}
    ld (bitmap_light_tw), a
    ld a, (bitmap_mush_cy)
    sub ${MUSH_VEXT}
    ld (bitmap_light_ty0), a
    ld a, ${2 * MUSH_VEXT}
    ld (bitmap_light_th), a
    call bitmap_light_intersect       ; bounding box first
    jp z, .tl_repair_next
    ld hl, bitmap_mush_bands
    ld b, ${MUSH_BAND_ROWS.length}
.tl_repair_band:
    push bc
    ld a, (bitmap_mush_cy)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ty0), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_th), a
    inc hl
    ld a, (bitmap_mush_cx)
    sub (hl)
    ld (bitmap_light_tx0), a
    ld a, (hl)
    add a, a
    ld (bitmap_light_tw), a
    inc hl
    call bitmap_light_intersect
    jr z, .tl_repair_band_next
    call bitmap_light_op_lit
    call bitmap_light_rect    ; preserves BC and HL: no stack needed here
.tl_repair_band_next:
    pop bc
    djnz .tl_repair_band
.tl_repair_next:
    pop hl
    pop bc
    dec b                     ; loop body exceeds djnz's -128 range
    jp nz, .tl_repair_loop
    call bitmap_light_repair_halo
    jp bitmap_light_op_dim    ; restore the caller's fill

; ------------------------------------------------------------
; FUNCTION: bitmap_light_submit
; ------------------------------------------------------------
; PURPOSE:
;   Rectangle entry point used by every pass once mushrooms exist: submit it,
;   then repair the mushroom glows if it was a dim.
;
; DESTROYS: AF, E.  PRESERVES: BC, D, HL, IX, IY (bitmap_light_rect's contract).
; ------------------------------------------------------------
bitmap_light_submit:
    call bitmap_light_rect
    ld a, (bitmap_light_op_clr)
    cp #08                    ; #08 = OR fill, the one that puts light out
    ret nz
    push bc
    push de
    push hl
    call bitmap_light_repair
    pop hl
    pop de
    pop bc
    ret
` : '';

  // ----------------------------------------------------- glowing-tail routines
  const eatSfxAsm = compiledEatSound ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_light_sfx_eat
; ------------------------------------------------------------
; PURPOSE:
;   Start the selected Sound Editor one-shot on gameplay PSG channel C.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF, HL. PRESERVES: BC, DE, IX, IY.
; SIDE EFFECTS: arms bitmap_light_sfx_tick and writes PSG registers.
; ------------------------------------------------------------
bitmap_light_sfx_eat:
    ld hl, bitmap_light_sfx_eat_data
    ld (bitmap_light_sfx_ptr), hl
    ld a, 1
    ld (bitmap_light_sfx_active), a
    jp bitmap_light_sfx_load_step

; ------------------------------------------------------------
; FUNCTION: bitmap_light_sfx_tick
; ------------------------------------------------------------
; PURPOSE: advance the selected one-shot once per 60 Hz game frame.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF, HL. PRESERVES: BC, DE, IX, IY.
; ------------------------------------------------------------
bitmap_light_sfx_tick:
    ld a, (bitmap_light_sfx_active)
    or a
    ret z
    ld a, (bitmap_light_sfx_timer)
    dec a
    ld (bitmap_light_sfx_timer), a
    ret nz
    jp bitmap_light_sfx_load_step

; ------------------------------------------------------------
; FUNCTION: bitmap_light_sfx_load_step
; ------------------------------------------------------------
; PURPOSE:
;   Apply one ten-byte compiled record. The source asset's chosen channel is
;   remapped to PSG C (tone R4/R5, volume R10) by compileEatSound().
; INPUT: bitmap_light_sfx_ptr. OUTPUT: none.
; DESTROYS: AF, HL. PRESERVES: BC, DE, IX, IY.
; ------------------------------------------------------------
bitmap_light_sfx_load_step:
    ld hl, (bitmap_light_sfx_ptr)
    ld a, (hl)                ; duration in frames; zero terminates the stream
    or a
    jp z, bitmap_light_sfx_stop
    ld (bitmap_light_sfx_timer), a
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
    ld a, 11
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 12
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 13
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, 7
    out (#A0), a
    ld a, (hl)
    out (#A1), a
    inc hl
    ld a, (hl)
    ld (psg_sfx_r7_c_bits), a
    inc hl
    ld (bitmap_light_sfx_ptr), hl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_sfx_stop
; ------------------------------------------------------------
; PURPOSE: silence PSG channel C and release the sequencer.
; INPUT: none. OUTPUT: none.
; DESTROYS: AF. PRESERVES: BC, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_light_sfx_stop:
    xor a
    ld (bitmap_light_sfx_active), a
    ld a, 10
    out (#A0), a
    xor a
    out (#A1), a
    ld a, #24                 ; tone C off, noise C off
    ld (psg_sfx_r7_c_bits), a
    ret
` : eatSound ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_light_sfx_eat
; ------------------------------------------------------------
; PURPOSE:
;   Short PSG blip when a mushroom is eaten (fire-and-forget writes, channel C,
;   same envelope recipe as the other bitmap-room blips).
; DESTROYS: AF, B, HL.  PRESERVES: C, DE, IX, IY.
; ------------------------------------------------------------
bitmap_light_sfx_eat:
    ld hl, bitmap_light_sfx_eat_data
    ld b, 7
.tl_sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .tl_sfx_loop
    ld a, #20                 ; shadow: tone C on, noise C off (music merges it)
    ld (psg_sfx_r7_c_bits), a
    ret

bitmap_light_sfx_eat_data:
    db 7,#3B,4,#48,5,#00,11,#60,12,#00,10,#10,13,#09
` : '';

  const glowAnimAsm = typeof glowingAnimId === 'number'
    ? `    ld a, (player_anim_state)
    or a
    jp nz, .tl_glow_anim_done ; an action skill owns the animation this frame
    ld a, ${glowingAnimId}
    ld (player_anim_state), a
.tl_glow_anim_done:
`
    : '';

  const torchRoutinesAsm = torchSkill ? `${eatSfxAsm}
; ------------------------------------------------------------
; FUNCTION: bitmap_light_load_stage
; ------------------------------------------------------------
; PURPOSE:
;   Cache the current decay stage's descriptor (band table, both step tables and
;   the horizontal clamp) so the halo passes read RAM instead of re-indexing ROM
;   on every rectangle.
;
; INPUT:   bitmap_light_stage.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_load_stage:
    ld a, (bitmap_light_stage)
    ld l, a
    ld h, 0
    add hl, hl                ; 10-byte records: x2
    ld d, h
    ld e, l
    add hl, hl                ; x4
    add hl, hl                ; x8
    add hl, de                ; x10
    ld de, bitmap_light_stage_table
    add hl, de
    ld de, bitmap_light_bands_ptr
    ld bc, 10
    ldir
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_ring_pass
; ------------------------------------------------------------
; PURPOSE:
;   Paint the ring between one stage and the next with the selected fill: the
;   two side strips of every band, placed against the current halo centre. Same
;   table both ways — dim it to shrink, light it to grow back after eating.
;
; INPUT:
;   A = stage index the ring belongs to (0 = between stage 0 and 1), fill
;   already selected.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_ring_pass:
    ld e, a
    ld d, 0
    ld hl, bitmap_light_ring_count_table
    add hl, de
    ld b, (hl)
    ld hl, bitmap_light_ring_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.tl_ring_loop:
    ld a, (bitmap_light_y)
    add a, (hl)               ; + signed row offset
    ld (bitmap_light_ry), a
    inc hl
    ld a, (bitmap_light_x)
    add a, (hl)               ; + signed column offset
    ld (bitmap_light_rx), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    inc hl
    ld a, (hl)
    ld (bitmap_light_rh), a
    inc hl
    call ${SUBMIT}            ; preserves B and HL, so the loop needs no stack
    djnz .tl_ring_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_extinguish
; ------------------------------------------------------------
; PURPOSE:
;   The glow dies: dim what is left of the halo (the repair pass gives back any
;   mushroom light underneath) and leave the room to the mushrooms.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_extinguish:
    xor a
    ld (bitmap_light_on), a
    call bitmap_light_op_dim
    call bitmap_light_draw_bands
${anyMushroom ? '    call bitmap_mush_regenerate_eaten ; glow time ended: grow eaten mushrooms back\n' : ''}    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_refill
; ------------------------------------------------------------
; PURPOSE:
;   A mushroom was eaten: the tail glows again at full size with a full timer.
;   When it was already glowing the halo grows back through the ring tables
;   (cheaper and steadier than repainting the whole blob).
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_refill:
    ld a, (bitmap_light_on)
    or a
    jp z, .tl_refill_cold
    ld a, (bitmap_light_stage)
    or a
    jp z, .tl_refill_timer    ; already at full size
    call bitmap_light_op_lit
.tl_refill_grow:
    ld a, (bitmap_light_stage)
    dec a
    ld (bitmap_light_stage), a
    call bitmap_light_ring_pass       ; A = the ring we shrank through
    ld a, (bitmap_light_stage)
    or a
    jp nz, .tl_refill_grow
    call bitmap_light_load_stage
    jp .tl_refill_timer
.tl_refill_cold:
    xor a
    ld (bitmap_light_stage), a
    call bitmap_light_load_stage
    ld a, 1
    ld (bitmap_light_on), a
    call bitmap_light_target
    ld a, (bitmap_light_tx)
    ld (bitmap_light_x), a
    ld a, (bitmap_light_ty)
    ld (bitmap_light_y), a
    call bitmap_light_op_lit
    call bitmap_light_draw_bands
.tl_refill_timer:
    ld hl, ${stageFrames}
    ld (bitmap_light_timer), hl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_tick
; ------------------------------------------------------------
; PURPOSE:
;   Burn one frame of glow. When a stage runs out the halo drops to the next
;   size (one ring dimmed, ~1300 px) and, past the last one, goes out.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_tick:
    ld hl, (bitmap_light_timer)
    dec hl
    ld (bitmap_light_timer), hl
    ld a, h
    or l
    ret nz
    ld a, (bitmap_light_stage)
    cp ${STAGE_COUNT - 1}
    jp nc, bitmap_light_extinguish    ; last stage burnt out: darkness
    call bitmap_light_op_dim
    ld a, (bitmap_light_stage)
    call bitmap_light_ring_pass       ; dim the ring this stage loses
    ld a, (bitmap_light_stage)
    inc a
    ld (bitmap_light_stage), a
    call bitmap_light_load_stage
    ld hl, ${stageFrames}
    ld (bitmap_light_timer), hl
    ret
${anyMushroom ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_mush_player_overlaps
; ------------------------------------------------------------
; PURPOSE:
;   Test the configured player body hitbox against a 16x16 mushroom cell.
;
; INPUT:   D = cell X in room pixels, E = cell Y in room pixels (top-left).
; OUTPUT:  A = 1 and NZ when overlapping; A = 0 and Z when separated.
; DESTROYS: AF, B.  PRESERVES: C, DE, HL, IX, IY.
; ------------------------------------------------------------
bitmap_mush_player_overlaps:
    ld a, (player_x)
${addA(hbRight)}    cp d
    jp c, .tl_eat_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
${addA(hbLeft)}    cp b
    jp z, .tl_eat_x_ok
    jp nc, .tl_eat_no
.tl_eat_x_ok:
    ld a, (player_y)
${addA(hbBottom)}    cp e
    jp c, .tl_eat_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
${addA(hbTop)}    cp b
    jp z, .tl_eat_yes
    jp nc, .tl_eat_no
.tl_eat_yes:
    ld a, 1
    or a
    ret
.tl_eat_no:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_light_eat_scan
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame mushroom scan: stepping on an uneaten mushroom puts its own glow
;   out (the alien ate it) and feeds the tail back to full size.
;
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_light_eat_scan:
    ld a, (bitmap_composition_state)
    or a
    ret nz                    ; room transition in progress: nothing to eat
    call bitmap_mush_room_table
    ret z
.tl_eat_loop:
    push bc
    ld a, (hl)
    ld (bitmap_mush_cx), a
    inc hl
    ld a, (hl)
    ld (bitmap_mush_cy), a
    inc hl
    ld a, (hl)
    inc hl
    ld d, a                   ; cell X (room pixels)
    ld (bitmap_mush_ex), a
    ld a, (hl)
    inc hl
    ld e, a                   ; cell Y (room pixels)
    ld (bitmap_mush_ey), a
    ld a, (hl)                ; flag index
    inc hl
    inc hl                    ; skip atlas source X
    inc hl                    ; skip atlas source Y low/high
    inc hl
    push hl
    push de
    call bitmap_mush_eaten
    pop de
    jp nz, .tl_eat_next
    call bitmap_mush_player_overlaps
    or a
    jp z, .tl_eat_next
    ; EATEN: latch the flag first, so the repair pass below stops protecting
    ; this glow and the dim really takes it out.
    pop hl
    pop bc
    ld de, -4                 ; next record -> flag index in this 8-byte record
    add hl, de
    ld a, (hl)
    ld e, a
    ld d, 0
    push hl
    ld hl, bitmap_mush_flags
    add hl, de
    ld (hl), 1
    pop hl
    ; The player is standing in this glow: protect his halo while it goes out,
    ; or the dim would punch a hole in the light he is carrying.
    ld a, (bitmap_light_on)
    ld (bitmap_light_protect), a
    call bitmap_light_op_dim
    call bitmap_mush_draw_glow
    xor a
    ld (bitmap_light_protect), a
    call bitmap_light_refill
    call bitmap_mush_erase_tile       ; the mushroom is gone, not just dark
${eatSound ? '    call bitmap_light_sfx_eat\n' : ''}    ret                       ; one mushroom per frame is plenty
.tl_eat_next:
    pop hl
    pop bc
    dec b
    jp nz, .tl_eat_loop
    ret
` : ''}` : '';

  const updateRoutineAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_light_update
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame halo maintenance. Costs a handful of thin rectangles while the
;   player walks; a full repaint only happens if the halo was never painted.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; SIDE EFFECTS:
;   Writes the displayed page through the V9938 command engine and restores
;   R#15 to S#0 on the way out.
; ------------------------------------------------------------
bitmap_light_update:
${compiledEatSound ? '    call bitmap_light_sfx_tick        ; selected PSG one-shot keeps advancing across room changes\n' : ''}    call bitmap_light_room_is_dark
    ret z
    ld a, (bitmap_displayed_page)
    ld (bitmap_light_page), a
    ld a, (bitmap_light_active)
    or a
    jp z, .repaint
${torchSkill
    ? `${anyMushroom ? '    call bitmap_light_eat_scan        ; mushrooms feed the tail\n' : ''}    ld a, (bitmap_light_on)
    or a
    jp z, bitmap_light_restore_status  ; tail dark: nothing follows the player
    call bitmap_light_tick            ; burn a frame of glow, shrink or die out
    ld a, (bitmap_light_on)
    or a
    jp z, bitmap_light_restore_status  ; it just went out
${glowAnimAsm}`
    : ''}    call bitmap_light_target
    call bitmap_light_shift_x
    call bitmap_light_shift_y
    jp bitmap_light_restore_status
.repaint:
    call bitmap_light_paint_full
    jp bitmap_light_restore_status
`;

  // ----------------------------------------------------- travelling bullet lantern
  const lanternRoutinesAsm = !lantern ? '' : (() => {
    const hw = Math.max(4, Math.min(48, Math.floor(lantern.halfWidth) || 16));
    const hh = Math.max(4, Math.min(48, Math.floor(lantern.halfHeight) || 12));
    const w = hw * 2;
    const h = hh * 2;
    const advance = Array.from({ length: lantern.slotStride }, () => '    inc ix').join('\n');
    // Centre clamps keep every rectangle inside the game band, exactly like the
    // player halo does: bitmap_light_rect never clips.
    const xMin = hw;
    const xMax = 255 - hw;
    const yMin = GAME_Y + hh;
    const yMax = GAME_Y + GAME_H - hh;
    return `
; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_light_update
; ------------------------------------------------------------
; PURPOSE:
;   Drag a ${w}x${h} halo along with the live bullet, so a shot lights the room in
;   the direction it travels. Only the two strips that actually change are
;   repainted: the leading one is lit, the trailing one is dimmed.
;
;   The dim goes through bitmap_light_submit with bitmap_light_protect set, so it
;   repairs the mushroom glows AND the player's own halo instead of punching
;   holes in them. The flag is raised and lowered inside this routine, and the
;   player halo is moved by a different call, so the two never interleave --
;   protecting during halo movement would freeze the light in place.
;
; INPUT:   bullet pool at ${lantern.poolLabel}, bitmap_light_* state.
; OUTPUT:  VRAM fills; bitmap_bl_on/_x/_y track the painted footprint.
; DESTROYS: AF, BC, DE, HL, IX.
; ------------------------------------------------------------
bitmap_bullet_light_update:
    call bitmap_light_room_is_dark
    jp z, .bl_forget            ; normal room: the repaint already took it away
    ld a, (bitmap_light_active)
    or a
    jp z, .bl_forget
${torchSkill ? `    ld a, (bitmap_light_on)
    or a
    jp z, .bl_drop              ; tail out: take the lantern down too
` : ''}    ld a, (bitmap_displayed_page)
    ld (bitmap_light_page), a
    ld ix, ${lantern.poolLabel}
    ld b, ${lantern.slotCount}
.bl_scan:
    ld a, (ix+0)
    or a
    jp nz, .bl_live
${advance}
    djnz .bl_scan
.bl_drop:
    ; No bullet left: dim the footprint we painted and forget it.
    ld a, (bitmap_bl_on)
    or a
    ret z
    xor a
    ld (bitmap_bl_on), a
    ld a, (bitmap_displayed_page)
    ld (bitmap_light_page), a
    ld a, (bitmap_bl_x)
    ld d, a
    ld a, (bitmap_bl_y)
    ld e, a
    call bitmap_bullet_light_dim_full
    jp bitmap_light_restore_status
.bl_forget:
    xor a
    ld (bitmap_bl_on), a
    ret
.bl_live:
    ; Centre of the bullet sprite, clamped so the rectangle stays in the band.
    ld a, (ix+1)
    add a, 8
    cp ${xMin}
    jp nc, .bl_x_lo_ok
    ld a, ${xMin}
.bl_x_lo_ok:
    cp ${xMax + 1}
    jp c, .bl_x_hi_ok
    ld a, ${xMax}
.bl_x_hi_ok:
    ld d, a
    ld a, (ix+2)
    add a, ${lantern.gameYOffset + 8}
    cp ${yMin}
    jp nc, .bl_y_lo_ok
    ld a, ${yMin}
.bl_y_lo_ok:
    cp ${yMax + 1}
    jp c, .bl_y_hi_ok
    ld a, ${yMax}
.bl_y_hi_ok:
    ld e, a
    ld a, (bitmap_bl_on)
    or a
    jp nz, .bl_shift
    ; First frame of this shot: light the whole footprint.
    ld a, 1
    ld (bitmap_bl_on), a
    ld a, d
    ld (bitmap_bl_x), a
    ld a, e
    ld (bitmap_bl_y), a
    call bitmap_bullet_light_set_rect
    call bitmap_light_op_lit
    call bitmap_light_rect
    jp bitmap_light_restore_status
.bl_shift:
    ; Exactly one axis moves (dir is latched at spawn and the clamp on the other
    ; axis is constant), so test X first and fall through to Y.
    ld a, (bitmap_bl_x)
    ld c, a
    ld a, d
    sub c                       ; A = newCX - oldCX
    jp z, .bl_shift_y
    ld a, d
    ld (bitmap_bl_x), a
    ld a, d
    sub c
    jp c, .bl_shift_left
    ld b, a                     ; B = strip width, moved right
    ; trailing column leaves at oldCX - hw
    ld a, c
    sub ${hw}
    ld (bitmap_light_rx), a
    jp .bl_shift_x_common
.bl_shift_left:
    neg
    ld b, a                     ; B = strip width, moved left
    ; trailing column leaves at oldCX + hw - width
    ld a, c
    add a, ${hw}
    sub b
    ld (bitmap_light_rx), a
.bl_shift_x_common:
    ld a, b
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, e
    sub ${hh}
    ld (bitmap_light_ry), a
    ld a, ${h}
    ld (bitmap_light_rh), a
    push de
    push bc
    call bitmap_bullet_light_dim_submit
    pop bc
    pop de
    ; leading column arrives on the new side
    ld a, d
    sub c                       ; sign again: which side did it enter from
    jp c, .bl_lead_left
    ld a, d
    add a, ${hw}
    sub b
    jp .bl_lead_common
.bl_lead_left:
    ld a, d
    sub ${hw}
.bl_lead_common:
    ld (bitmap_light_rx), a
    ld a, b
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, e
    sub ${hh}
    ld (bitmap_light_ry), a
    ld a, ${h}
    ld (bitmap_light_rh), a
    call bitmap_light_op_lit
    call bitmap_light_rect
    jp bitmap_light_restore_status
.bl_shift_y:
    ld a, (bitmap_bl_y)
    ld c, a
    ld a, e
    sub c                       ; A = newCY - oldCY
    ret z                       ; clamped still: nothing changed
    ld a, e
    ld (bitmap_bl_y), a
    ld a, e
    sub c
    jp c, .bl_shift_up
    ld b, a                     ; moved down
    ld a, c
    sub ${hh}
    jp .bl_shift_y_common
.bl_shift_up:
    neg
    ld b, a                     ; moved up
    ld a, c
    add a, ${hh}
    sub b
.bl_shift_y_common:
    ld (bitmap_light_ry), a
    ld a, b
    ld (bitmap_light_rh), a
    ld a, d
    sub ${hw}
    ld (bitmap_light_rx), a
    ld a, ${w}
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    push de
    push bc
    call bitmap_bullet_light_dim_submit
    pop bc
    pop de
    ; leading row arrives on the new side
    ld a, e
    sub c
    jp c, .bl_lead_up
    ld a, e
    add a, ${hh}
    sub b
    jp .bl_lead_y_common
.bl_lead_up:
    ld a, e
    sub ${hh}
.bl_lead_y_common:
    ld (bitmap_light_ry), a
    ld a, b
    ld (bitmap_light_rh), a
    ld a, d
    sub ${hw}
    ld (bitmap_light_rx), a
    ld a, ${w}
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    call bitmap_light_op_lit
    call bitmap_light_rect
    jp bitmap_light_restore_status

; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_light_dim_submit
; ------------------------------------------------------------
; PURPOSE:
;   Dim the rectangle already loaded in bitmap_light_r*, repairing both the
;   mushroom glows and the player's halo. The protect flag is raised only for
;   this single fill.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_bullet_light_dim_submit:
    call bitmap_light_op_dim
    ld a, 1
    ld (bitmap_light_protect), a
    call bitmap_light_submit
    xor a
    ld (bitmap_light_protect), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_light_dim_full
; ------------------------------------------------------------
; PURPOSE:
;   Take the whole lantern footprint down (bullet died / tail went out).
; INPUT: D = centre X, E = centre Y.
; DESTROYS: AF, BC, DE, HL.
; ------------------------------------------------------------
bitmap_bullet_light_dim_full:
    call bitmap_bullet_light_set_rect
    jp bitmap_bullet_light_dim_submit

; ------------------------------------------------------------
; FUNCTION: bitmap_bullet_light_set_rect
; ------------------------------------------------------------
; PURPOSE: Load bitmap_light_r* with the full ${w}x${h} lantern around D,E.
; INPUT: D = centre X, E = centre Y (both already clamped).
; DESTROYS: AF. PRESERVES: BC, DE, HL.
; ------------------------------------------------------------
bitmap_bullet_light_set_rect:
    ld a, d
    sub ${hw}
    ld (bitmap_light_rx), a
    ld a, ${w}
    ld (bitmap_light_rw), a
    xor a
    ld (bitmap_light_rw + 1), a
    ld a, e
    sub ${hh}
    ld (bitmap_light_ry), a
    ld a, ${h}
    ld (bitmap_light_rh), a
    ret
`;
  })();

  return {
    enabled: true,
    ramBytes,
    equates,
    initAsm,
    mainLoopCall: `    call bitmap_light_update    ; move the ${torchSkill ? 'glowing tail' : 'lamp'} halo (dark rooms only)\n`,
    bulletLanternCall: lantern ? '    call bitmap_bullet_light_update    ; drag the shot lantern\n' : '',
    pendingPageCallAsm: '    call bitmap_light_paint_pending    ; dim the hidden page and cut the halo before the flip\n',
    bootPaintCallAsm: '    call bitmap_light_paint_visible    ; dim the first room and cut the halo\n',
    routinesAsm: `${sharedRoutinesAsm}${mushroomRoutinesAsm}${torchRoutinesAsm}${updateRoutineAsm}${lanternRoutinesAsm}`,
    dataAsm,
  };
}

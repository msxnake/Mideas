import {
  MSX2_ENEMY_BEHAVIOR_MAX_STATES,
  MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY,
} from '../../../msx2EnemyBehavior';

/**
 * The single Z80 interpreter that walks a baked ENEMY BEHAVIOUR program.
 *
 * One resident routine replaces the "a bespoke ASM handler plus pool bytes on
 * every slot, per behaviour" pattern that msx2BitmapEnemyGenerator had grown
 * into. Adding a behaviour is authoring data; it costs no generator work and no
 * extra RAM.
 *
 * CONTRACT WITH THE ENEMY UPDATE LOOP
 *   IN   IX = the enemy's pool slot, already selected by the caller.
 *        The caller's slot counter lives in B; BC is pushed on entry and popped
 *        on exit, exactly like the walkerGravity handler does around its probes.
 *   OUT  AF/DE/HL clobbered. BC and IX preserved.
 *   The routine runs under the existing cadence gate, so it executes once per
 *   `logicInterval` video frames, never once per frame.
 *
 * WHAT THE INTERPRETER TRUSTS, AND WHY THAT IS SAFE
 *   It reads a rule count and executes exactly that many rules without checking
 *   for the end of the block, and it follows state indices without validating
 *   them. Both are guaranteed by bakeEnemyBehavior: every state ends in an
 *   ALWAYS rule, and every nextState either exists or was rejected at bake time.
 *   The state index is masked anyway on the way in, because a corrupt RAM byte
 *   costs one masked read here and an unbounded wild read otherwise.
 *
 * THE TWO EDGE TRAPS OF bitmap_probe_solid, HANDLED EXPLICITLY
 *   1. It answers SOLID for any Y >= 192. Probing above the room underflows Y
 *      into that band, so "is there a ceiling above me" would be answered by
 *      accident rather than on purpose. Every probe here range-checks first.
 *   2. It indexes the column with (X >> 4) & #0F. At the left edge, X - 1 wraps
 *      to 255 and reads column 15, i.e. the far side of the room. A left-facing
 *      enemy at x=0 would sense whatever sits on the right wall.
 *   Both cases resolve to "the room edge is a wall", deliberately and in one
 *   place (bitmap_enemy_script_edge).
 */

/** Movement mode that hands the slot to this interpreter. */
export const MSX2_ENEMY_MOVEMENT_SCRIPTED = 14;

/**
 * Pool bytes this engine appends per slot, and only when a project uses it:
 * program, state, timer, velocity, shield clock, hit stamp.
 *
 * Both new bytes are meaningful at zero, which is why they need no init pass:
 * shield 0 is "no guard", and the hit stamp counts DOWN from 255, so 0 reads as
 * "not hit recently". A stamp that counted up would have to start at 255 or
 * every enemy would spawn believing it had just been shot.
 */
export const MSX2_ENEMY_SCRIPT_POOL_BYTES = 6;

/** Shared scratch, one copy for the whole engine rather than one per slot. */
export const MSX2_ENEMY_SCRIPT_SCRATCH_BYTES = 9;

/** Value the damage path stamps on a slot when a player bullet connects. */
export const MSX2_ENEMY_SCRIPT_HIT_STAMP = 0xff;

/** Number of condition opcodes, i.e. the size of the condition jump table. */
export const MSX2_ENEMY_SCRIPT_COND_COUNT = 28;
/** Number of action opcodes. */
export const MSX2_ENEMY_SCRIPT_ACT_COUNT = 17;

/** Downward velocity the fall integrator will not exceed, as a signed byte. */
const TERMINAL_VELOCITY = 0xfc;   // -4 px per logic tick

/**
 * How far into a one-way platform's cell the feet may be and still land on it,
 * and therefore how far DROP_THROUGH has to step to escape it. ONE number, used
 * twice on purpose: a nudge smaller than the band lands the enemy straight back
 * on the platform it just decided to leave, and the bug would look like "the
 * random never fires" rather than like an off-by-one.
 *
 * It must also be >= terminal velocity, or a body at full speed steps over the
 * band between two ticks and falls through a platform it should have caught.
 */
const PLATFORM_LAND_BAND = 4;

export interface EnemyBehaviorRuntimeOptions {
  /** First byte of the engine's shared scratch. */
  ramBase: number;
  /** Pool offsets of the scripted bytes, from the slot base. */
  poolProgramOffset: number;
  poolStateOffset: number;
  poolTimerOffset: number;
  poolVelocityOffset: number;
  /**
   * The whole slot stride. Required, not optional: ENEMY_AHEAD walks the pool
   * looking for its neighbours, and a wrong stride there reads the middle of
   * another slot as a coordinate. A missing value must break the build, not
   * quietly emit a condition that answers "no".
   */
  poolStride: number;
  /** Default to the two bytes right after the velocity, which is how they are laid out. */
  poolShieldOffset?: number;
  poolHitOffset?: number;
  /** Pool offsets of the fields shared with the other movement engines. */
  poolVisualXOffset?: number;
  poolVisualYOffset?: number;
  poolSpeedOffset?: number;
  poolAnimFrameOffset?: number;
  poolFrameCountOffset?: number;
  /**
   * Number of hardware enemy slots in the room runtime. ENEMY_AHEAD clamps its
   * scan to this: bitmap_enemy_count is RAM, and a corrupt count would walk the
   * loop straight off the end of the pool and read whatever follows it as
   * enemy coordinates.
   */
  maxSlots: number;
  /**
   * Routine that answers "can I stand here?" as opposed to "does this block me?".
   * Defaults to bitmap_probe_solid, which is the same question when a project
   * has no one-way platforms — and keeps those ROMs byte-identical. The room
   * generator passes bitmap_probe_floor once any room paints a Platform cell.
   */
  floorProbeLabel?: string;
  /**
   * Set when at least one baked program contains FIRE. Separate from the pool
   * below on purpose: it is what makes a missing pool a BUILD ERROR instead of
   * an enemy that pulls the trigger and nothing comes out.
   */
  programsUseFire?: boolean;
  /**
   * The enemy bullet pool. Omitted entirely when no authored program fires, so
   * turning the behaviour engine on costs no RAM, no SAT slots and no code for
   * a project whose enemies never shoot.
   */
  enemyBullets?: EnemyBulletPoolOptions;
}

export interface EnemyBulletPoolOptions {
  /** First byte of the pool: slotCount x 4 (active, x, y, dir). */
  ramBase: number;
  slotCount: number;
  /** Pixels per frame. A runtime constant in this first cut, not per-shot. */
  speedPx: number;
  /**
   * Routine that takes A = hearts of damage and applies it to the player.
   * Required rather than assumed: the only one that exists today lives in the
   * boss generator, and an enemy bullet must not need a boss in the room.
   */
  playerHurtLabel: string;
  damageHearts: number;
}

export interface EnemyBehaviorRuntimeAsm {
  equates: string;
  routinesAsm: string;
  ramBytes: number;
  /** Bytes in use at enemyBullets.ramBase. Zero when no program fires. */
  bulletRamBytes: number;
}

const asmWord = (value: number) =>
  `#${Math.max(0, Math.min(0xffff, Math.floor(value))).toString(16).toUpperCase().padStart(4, '0')}`;

const asmByte = (value: number) =>
  `#${Math.max(0, Math.min(0xff, Math.floor(value))).toString(16).toUpperCase().padStart(2, '0')}`;

/**
 * The mask that keeps a corrupt state index inside the table. Powers of two only:
 * anything else would need a compare-and-clamp, and silently masking with a
 * non-power-of-two would fold high indices onto the wrong states.
 */
function stateIndexMask(): number {
  const max = MSX2_ENEMY_BEHAVIOR_MAX_STATES;
  if ((max & (max - 1)) !== 0) {
    throw new Error(`MSX2_ENEMY_BEHAVIOR_MAX_STATES must be a power of two to be masked, got ${max}`);
  }
  return max - 1;
}

export function buildEnemyBehaviorRuntimeAsm(options: EnemyBehaviorRuntimeOptions): EnemyBehaviorRuntimeAsm {
  // A program that fires without a pool behind it is the exact failure this
  // opcode already shipped once: the ROM builds, the enemy plays its firing
  // state, and nothing ever comes out. Break the build instead.
  if (options.programsUseFire && !options.enemyBullets) {
    throw new Error(
      'An authored behaviour uses FIRE but no enemyBullets pool was passed to '
      + 'buildEnemyBehaviorRuntimeAsm. Emitting FIRE without its runtime would be a silent no-op in the ROM.'
    );
  }
  const bullets = options.enemyBullets;
  const BULLET_SLOTS = bullets ? Math.max(1, Math.min(8, Math.floor(bullets.slotCount) || 2)) : 0;
  const BULLET_SPEED = bullets ? Math.max(1, Math.min(8, Math.floor(bullets.speedPx) || 3)) : 0;
  const BULLET_DAMAGE = bullets ? Math.max(1, Math.min(8, Math.floor(bullets.damageHearts) || 1)) : 0;
  const PROG = options.poolProgramOffset;
  const STATE = options.poolStateOffset;
  const TIMER = options.poolTimerOffset;
  const VY = options.poolVelocityOffset;
  const SHIELD = options.poolShieldOffset ?? (options.poolVelocityOffset + 1);
  const HIT = options.poolHitOffset ?? (options.poolVelocityOffset + 2);
  const STRIDE = options.poolStride;
  const FLOOR_PROBE = options.floorProbeLabel || 'bitmap_probe_solid';
  const MAX_SLOTS = Math.max(1, Math.min(255, Math.floor(options.maxSlots)));
  // At 255 the clamp would need `cp 256`, which does not exist. There is also
  // nothing left to clamp to at that point: the counter cannot exceed it.
  const slotClampAsm = MAX_SLOTS >= 255 ? '' : `    cp ${MAX_SLOTS + 1}
    jp c, .ea_count_ok
    ld a, ${MAX_SLOTS}                       ; a corrupt count must not walk off the pool
.ea_count_ok:
`;
  const VXOFF = options.poolVisualXOffset ?? 14;
  const VYOFF = options.poolVisualYOffset ?? 15;
  const SPEED = options.poolSpeedOffset ?? 21;
  const ANIM_FRAME = options.poolAnimFrameOffset ?? 9;
  const FRAME_COUNT = options.poolFrameCountOffset ?? 10;
  const MASK = stateIndexMask();

  const base = options.ramBase;
  const addr = {
    programBase: base,
    cursor: base + 2,
    rulesLeft: base + 4,
    arg: base + 5,
    next: base + 6,
    seed: base + 7,
    aheadMode: base + 8,
  };

  const equates = `; --- scripted ENEMY behaviour engine (${MSX2_ENEMY_SCRIPT_SCRATCH_BYTES} shared bytes) ---
; Shared, not per slot: only one enemy is ever mid-interpretation at a time.
bitmap_enemy_script_base   EQU ${asmWord(addr.programBase)}
bitmap_enemy_script_cursor EQU ${asmWord(addr.cursor)}
bitmap_enemy_script_left   EQU ${asmWord(addr.rulesLeft)}
bitmap_enemy_script_arg    EQU ${asmWord(addr.arg)}
bitmap_enemy_script_next   EQU ${asmWord(addr.next)}
bitmap_enemy_script_seed   EQU ${asmWord(addr.seed)}
bitmap_enemy_script_ahead_mode EQU ${asmWord(addr.aheadMode)}
; Slot offsets the DAMAGE path needs, published as symbols so the shooting code
; never has to hardcode a number that moves when the pool grows:
;   on impact          ld (ix+bitmap_enemy_script_hit_ofs), bitmap_enemy_script_hit_stamp
;   before the damage  ld a, (ix+bitmap_enemy_script_shield_ofs) / or a / jp nz, <skip>
bitmap_enemy_script_shield_ofs EQU ${SHIELD}
bitmap_enemy_script_hit_ofs    EQU ${HIT}
bitmap_enemy_script_hit_stamp  EQU ${asmByte(MSX2_ENEMY_SCRIPT_HIT_STAMP)}
${bullets ? `; --- enemy bullet pool (${BULLET_SLOTS} x 4 bytes: active, x, y, dir) ---
; Field order matches the player's bitmap_bullet_pool so a SAT writer reads the
; same offsets. dir uses the player's convention too: 0 = left, 1 = right.
bitmap_enemy_bullet_pool  EQU ${asmWord(bullets.ramBase)}
bitmap_enemy_bullet_slots EQU ${BULLET_SLOTS}
` : ''}`;

  const routinesAsm = `; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_script_step
; ------------------------------------------------------------
; PURPOSE:
;   Run one logic tick of the enemy's authored behaviour: evaluate the current
;   state's rules top-down and execute the first one whose condition holds.
; INPUT:
;   IX = enemy pool slot. B = the update loop's slot counter.
; OUTPUT:
;   The slot's position, facing, animation and state are updated in place.
; REGISTERS:
;   Clobbers AF/DE/HL. Preserves BC and IX.
; CALLS: bitmap_probe_solid.
; ------------------------------------------------------------
bitmap_enemy_script_step:
    push bc                        ; the update loop's slot counter lives in B
    ; ONE PRNG STEP PER FRAME, NOT PER SLOT.
    ; A placed enemy occupies one pool slot per colour layer, and the interpreter
    ; runs on each of them. Advancing the seed inside RANDOM meant the two layers
    ; of the SAME enemy read different numbers, took different decisions, and
    ; walked apart: measured on hardware, one layer dropped through a platform
    ; and the other stayed, ending 86px apart. The bat runtime already learned
    ; this and says so in bitmap_update_enemies: "or the eyes fly off the body".
    ; B counts down from bitmap_enemy_count, so B == count is the first slot of
    ; the frame and the only one that may move the seed on.
    ld a, (bitmap_enemy_count)
    cp b
    jp nz, .escript_seed_done
    ld a, (bitmap_enemy_script_seed)
    rlca
    xor #1D
    ld (bitmap_enemy_script_seed), a
.escript_seed_done:
    ; --- resolve this slot's program ---
    ld a, (ix+${PROG})
    ld l, a
    ld h, 0
    add hl, hl                     ; WORD table: the index must be doubled
    ld de, bitmap_enemy_script_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                        ; HL -> program base
    ld (bitmap_enemy_script_base), hl
    ; --- resolve the current state block ---
    ld a, (ix+${STATE})
    and ${asmByte(MASK)}           ; a corrupt byte costs a masked read, not a wild one
    add a, a                       ; WORD table again: state * 2
    inc a                          ; step over the stateCount byte
    ld e, a
    ld d, 0
    add hl, de                     ; HL -> stateOffset[state]
    ld e, (hl)
    inc hl
    ld d, (hl)                     ; DE = block offset from the program base
    ld hl, (bitmap_enemy_script_base)
    add hl, de                     ; HL -> state block
    ld a, (hl)
    ld (bitmap_enemy_script_left), a   ; rule count
    inc hl
    ld (bitmap_enemy_script_cursor), hl
; ---- rule loop -------------------------------------------------------------
bitmap_enemy_script_rule:
    ld hl, (bitmap_enemy_script_cursor)
    ld a, (hl)                     ; condition opcode
    inc hl
    ld e, (hl)                     ; condition argument
    inc hl
    ld (bitmap_enemy_script_cursor), hl    ; cursor now at the action byte
    ld hl, bitmap_enemy_script_arg
    ld (hl), e
    cp ${MSX2_ENEMY_SCRIPT_COND_COUNT}
    jp nc, bitmap_enemy_script_false       ; an opcode we do not know never fires
    ld l, a
    ld h, 0
    add hl, hl                     ; WORD table: double the opcode
    ld de, bitmap_enemy_script_cond_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    jp (hl)                        ; every handler exits via _true or _false
; ---- the condition did not hold: step over the rule ------------------------
bitmap_enemy_script_false:
    ld hl, (bitmap_enemy_script_cursor)
    ld de, 3                       ; action, actionArg, nextState
    add hl, de
    ld (bitmap_enemy_script_cursor), hl
    ld hl, bitmap_enemy_script_left
    dec (hl)
    jp nz, bitmap_enemy_script_rule
    ; Unreachable while the baker keeps forcing a trailing ALWAYS rule. If a
    ; hand-made program ever gets here, standing still beats running off the
    ; end of the block and executing the next state's bytes as rules.
    jp bitmap_enemy_script_done
; ---- the condition held: run its action ------------------------------------
bitmap_enemy_script_true:
    ld hl, (bitmap_enemy_script_cursor)
    ld a, (hl)                     ; action opcode
    inc hl
    ld e, (hl)                     ; action argument
    inc hl
    ld d, (hl)                     ; next state (${asmByte(MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY)} = stay)
    ld hl, bitmap_enemy_script_arg
    ld (hl), e
    inc hl                         ; -> bitmap_enemy_script_next
    ld (hl), d
    cp ${MSX2_ENEMY_SCRIPT_ACT_COUNT}
    jp nc, bitmap_enemy_script_apply       ; unknown action behaves as idle
    ld l, a
    ld h, 0
    add hl, hl                     ; WORD table: double the opcode
    ld de, bitmap_enemy_script_act_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    jp (hl)                        ; every handler exits via _apply
; ---- state switch and timer ------------------------------------------------
bitmap_enemy_script_apply:
    ld a, (bitmap_enemy_script_next)
    cp ${asmByte(MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY)}
    jp z, bitmap_enemy_script_tick
    and ${asmByte(MASK)}
    cp (ix+${STATE})
    jp z, bitmap_enemy_script_tick         ; re-entering the same state keeps its clock
    ld (ix+${STATE}), a
    ld (ix+${TIMER}), 0                    ; a new state starts its clock at zero
    jp bitmap_enemy_script_done
bitmap_enemy_script_tick:
    ld a, (ix+${TIMER})
    inc a
    jp z, bitmap_enemy_script_done         ; saturate at 255 instead of wrapping
    ld (ix+${TIMER}), a
bitmap_enemy_script_done:
    ; Per-tick housekeeping. It lives HERE and not in _tick because _tick is
    ; skipped whenever the rule switched state, and a shield that stopped
    ; running down on the tick it was raised would never expire.
    ld a, (ix+${SHIELD})
    or a
    jp z, .keep_hit
    dec (ix+${SHIELD})
.keep_hit:
    ; The hit stamp counts down, so 0 is "not hit recently" and a zeroed slot
    ; needs no init. Floor it instead of letting it wrap back to 255.
    ld a, (ix+${HIT})
    or a
    jp z, .housekeeping_done
    dec (ix+${HIT})
.housekeeping_done:
    pop bc
    ret

; ------------------------------------------------------------
; Shared probe helpers. All of them answer "solid" (NZ) for anything outside
; the room, so no caller has to re-derive the edge rules.
; ------------------------------------------------------------
; Logical origin of the body: the SAT position minus the visual cell offset,
; so a multi-cell sprite senses from where its physics body actually is.
; OUT: D = logical X, E = logical Y. Clobbers A.
bitmap_enemy_script_origin:
    ld a, (ix+0)
    sub (ix+${VXOFF})
    ld d, a
    ld a, (ix+1)
    sub (ix+${VYOFF})
    ld e, a
    ret
; The room edge, answered as a wall.
bitmap_enemy_script_edge:
    ld a, 1
    or a                           ; NZ = solid
    ret
; Probe ahead of the facing edge. IN: C = rows below the logical origin.
; OUT: Z = passable, NZ = solid.
bitmap_enemy_script_probe_floor_ahead:
    ; The LEDGE question: "is there something to stand on over there?"
    ld a, 1
    ld (bitmap_enemy_script_ahead_mode), a
    jp bitmap_enemy_script_probe_ahead_common
bitmap_enemy_script_probe_ahead:
    ; The WALL question: "does something over there block me?"
    xor a
    ld (bitmap_enemy_script_ahead_mode), a
bitmap_enemy_script_probe_ahead_common:
    call bitmap_enemy_script_origin
    ld a, e
    add a, c
    ld c, a                        ; C = probe Y
    ld a, (ix+2)
    bit 7, a
    jp nz, .ahead_left
    ld a, d
    add a, 16                      ; the leading edge when facing right
    jp c, bitmap_enemy_script_edge ; past the right wall
    ld b, a
    jp bitmap_enemy_script_ahead_dispatch
.ahead_left:
    ld a, d
    or a
    jp z, bitmap_enemy_script_edge ; x-1 at x=0 would wrap to column 15
    dec a
    ld b, a
bitmap_enemy_script_ahead_dispatch:
    ld a, (bitmap_enemy_script_ahead_mode)
    or a
    jp z, bitmap_probe_solid
    jp ${FLOOR_PROBE}
; Probe under the body centre. OUT: Z = passable, NZ = solid.
bitmap_enemy_script_probe_below:
    ; "Can I stand here", not "does this block me". With one-way platforms in the
    ; room those are different questions, and asking the wrong one is what made a
    ; falling enemy sink through the floor and only stop on the out-of-room band.
    call bitmap_enemy_script_origin
    ld a, e
    add a, 16                      ; one row under a 16px body
    ld c, a
    ld a, d
    add a, 8
    ld b, a
    jp ${FLOOR_PROBE}
; Probe just over the body top. OUT: Z = passable, NZ = solid.
bitmap_enemy_script_probe_head:
    call bitmap_enemy_script_origin
    ld a, e
    or a
    jp z, bitmap_enemy_script_edge ; the room lid
    dec a
    ld c, a
    ld a, d
    add a, 8
    ld b, a
    jp bitmap_probe_solid
; Probe N tiles over the body top. IN: script_arg = N (1..11).
bitmap_enemy_script_probe_above:
    call bitmap_enemy_script_origin
    ld a, (bitmap_enemy_script_arg)
    add a, a
    add a, a
    add a, a
    add a, a                       ; N * 16; N <= 11 so this cannot overflow
    ld b, a
    ld a, e
    sub b
    jp c, bitmap_enemy_script_edge ; over the room lid: solid, on purpose
    ld c, a
    ld a, d
    add a, 8
    ld b, a
    jp bitmap_probe_solid

; ------------------------------------------------------------
; CONDITIONS. Each one falls out through _true or _false.
; ------------------------------------------------------------
bitmap_enemy_script_cond_always:
    jp bitmap_enemy_script_true
bitmap_enemy_script_cond_floor_ahead:
    ld c, 16
    call bitmap_enemy_script_probe_floor_ahead
    jp z, bitmap_enemy_script_false
    jp bitmap_enemy_script_true
bitmap_enemy_script_cond_no_floor_ahead:
    ld c, 16
    call bitmap_enemy_script_probe_floor_ahead
    jp z, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_wall_ahead:
    ld c, 8                        ; mid height, so a one-cell step is not a wall
    call bitmap_enemy_script_probe_ahead
    jp z, bitmap_enemy_script_false
    jp bitmap_enemy_script_true
bitmap_enemy_script_cond_solid_above:
    call bitmap_enemy_script_probe_above
    jp z, bitmap_enemy_script_false
    jp bitmap_enemy_script_true
bitmap_enemy_script_cond_no_solid_above:
    call bitmap_enemy_script_probe_above
    jp z, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_on_ground:
    call bitmap_enemy_script_probe_below
    jp z, bitmap_enemy_script_false
    jp bitmap_enemy_script_true
bitmap_enemy_script_cond_not_on_ground:
    call bitmap_enemy_script_probe_below
    jp z, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_timer:
    ld a, (ix+${TIMER})
    ld hl, bitmap_enemy_script_arg
    cp (hl)
    jp nc, bitmap_enemy_script_true         ; timer >= argument
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_player_near_x:
    call bitmap_enemy_script_origin
    ld a, (player_x)
    sub d
    jp nc, .near_x_abs
    neg
.near_x_abs:
    ld hl, bitmap_enemy_script_arg
    cp (hl)
    jp z, bitmap_enemy_script_true
    jp c, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_player_near_y:
    call bitmap_enemy_script_origin
    ld a, (player_y)
    sub e
    jp nc, .near_y_abs
    neg
.near_y_abs:
    ld hl, bitmap_enemy_script_arg
    cp (hl)
    jp z, bitmap_enemy_script_true
    jp c, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_player_left:
    call bitmap_enemy_script_origin
    ld a, (player_x)
    cp d
    jp c, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_player_right:
    call bitmap_enemy_script_origin
    ld a, (player_x)
    cp d
    jp z, bitmap_enemy_script_false
    jp nc, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_random:
    ; READS the seed, never advances it. The advance happens once per frame at
    ; the top of bitmap_enemy_script_step, so every layer of every enemy sees the
    ; same number this frame. Desynchronising slots is NOT wanted here: two
    ; layers of one enemy that disagree are a bug, not variety.
    ld a, (bitmap_enemy_script_seed)
    ld hl, bitmap_enemy_script_arg
    cp (hl)
    jp c, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_at_min_x:
    ld a, (ix+0)
    cp (ix+4)
    jp z, bitmap_enemy_script_true
    jp c, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_at_max_x:
    ld a, (ix+0)
    cp (ix+5)
    jp nc, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_player_above:
    call bitmap_enemy_script_origin
    ld a, (player_y)
    cp e
    jp c, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_player_below:
    call bitmap_enemy_script_origin
    ld a, (player_y)
    cp e
    jp z, bitmap_enemy_script_false
    jp nc, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_player_in_front:
    ; The sight test: is the player on the side we are already facing?
    call bitmap_enemy_script_origin
    ld a, (ix+2)
    bit 7, a
    jp nz, .front_left
    ld a, (player_x)
    cp d
    jp z, bitmap_enemy_script_false
    jp nc, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
.front_left:
    ld a, (player_x)
    cp d
    jp c, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_facing_left:
    ld a, (ix+2)
    bit 7, a
    jp nz, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_facing_right:
    ; A slot that has never moved has dx = 0, and WALK sends it right, so
    ; "not left" is the honest reading of facing right.
    ld a, (ix+2)
    bit 7, a
    jp z, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_at_min_y:
    ld a, (ix+1)
    cp (ix+6)
    jp z, bitmap_enemy_script_true
    jp c, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_at_max_y:
    ld a, (ix+1)
    cp (ix+7)
    jp nc, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_no_wall_ahead:
    ld c, 8
    call bitmap_enemy_script_probe_ahead
    jp z, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_on_platform_tile:
    ; The cell under the feet carries the one-way bit. probe_solid hands the raw
    ; cell value back in A, so this needs no second read of the map.
    call bitmap_enemy_script_origin
    ld a, e
    add a, 16
    ld c, a
    ld a, d
    add a, 8
    ld b, a
    call bitmap_probe_solid
    bit 5, a
    jp nz, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_was_hit:
    ; The stamp counts DOWN from ${asmByte(MSX2_ENEMY_SCRIPT_HIT_STAMP)}, so "hit within the last N ticks"
    ; is "stamp is still above ${asmByte(MSX2_ENEMY_SCRIPT_HIT_STAMP)} - N". With the stamp at its maximum,
    ; 256 - N is exactly NEG N, which is one instruction instead of a subtract.
    ld a, (bitmap_enemy_script_arg)
    neg
    cp (ix+${HIT})
    jp z, bitmap_enemy_script_true
    jp c, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_shield_active:
    ld a, (ix+${SHIELD})
    or a
    jp nz, bitmap_enemy_script_true
    jp bitmap_enemy_script_false
bitmap_enemy_script_cond_enemy_ahead:
    ; Walk the live slots looking for a neighbour ahead. BC is free in here: the
    ; caller's slot counter was pushed on entry and is popped in _done.
    ld a, (bitmap_enemy_count)
    or a
    jp z, bitmap_enemy_script_false
${slotClampAsm}    ld b, a                        ; B = slots left to test
    push ix
    pop de                         ; DE = my own slot address, to skip myself
    ld hl, bitmap_enemy_pool
.ea_slot:
    ld a, h
    cp d
    jp nz, .ea_test
    ld a, l
    cp e
    jp z, .ea_next                 ; same address: that is me
.ea_test:
    ld a, (hl)                     ; their x
    sub (ix+0)
    bit 7, (ix+2)
    jp z, .ea_signed
    neg                            ; facing left: ahead is the other way
.ea_signed:
    or a
    jp z, .ea_next                 ; exactly on top of me is not "ahead"
    jp m, .ea_next                 ; behind me
    push hl
    ld hl, bitmap_enemy_script_arg
    cp (hl)
    pop hl
    jp z, .ea_band
    jp nc, .ea_next                ; further away than the authored reach
.ea_band:
    inc hl
    ld a, (hl)                     ; their y
    dec hl
    sub (ix+1)
    jp nc, .ea_band_abs
    neg
.ea_band_abs:
    cp 16
    jp c, bitmap_enemy_script_true ; same 16px band: a body, not a rooftop
.ea_next:
    push de
    ld de, ${STRIDE}
    add hl, de
    pop de
    djnz .ea_slot
    jp bitmap_enemy_script_false

; ------------------------------------------------------------
; ACTIONS. Each one falls out through _apply, which handles the state switch.
; ------------------------------------------------------------
bitmap_enemy_script_act_idle:
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_walk:
    ; Deliberately blind: walls and ledges are the rules' business, not the
    ; action's. Only the authored patrol bounds stop it.
    ld a, (ix+2)
    or a
    jp nz, .walk_go
    ld (ix+2), #01                 ; a slot that has never moved walks right
.walk_go:
    ld d, (ix+${SPEED})
.walk_px:
    ld a, (ix+2)
    bit 7, a
    jp nz, .walk_left
    ld a, (ix+0)
    cp (ix+5)                      ; x vs maxX
    jp nc, bitmap_enemy_script_apply
    inc (ix+0)
    dec d
    jp nz, .walk_px
    jp bitmap_enemy_script_apply
.walk_left:
    ld a, (ix+0)
    cp (ix+4)                      ; x vs minX
    jp z, bitmap_enemy_script_apply
    jp c, bitmap_enemy_script_apply
    dec (ix+0)
    dec d
    jp nz, .walk_px
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_turn:
    ld a, (ix+2)
    bit 7, a
    jp nz, .turn_to_right
    ld (ix+2), #FF
    jp bitmap_enemy_script_apply
.turn_to_right:
    ld (ix+2), #01
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_turn_and_walk:
    ; Turning and stepping in the same tick is what keeps a ledge turn from
    ; costing a frame of standing still on the brink.
    ld a, (ix+2)
    bit 7, a
    jp nz, .taw_to_right
    ld (ix+2), #FF
    jp bitmap_enemy_script_act_walk
.taw_to_right:
    ld (ix+2), #01
    jp bitmap_enemy_script_act_walk
bitmap_enemy_script_act_jump:
    ; Seed the upward velocity and integrate it immediately, so the body leaves
    ; the ground on the tick the rule fired.
    ld a, (bitmap_enemy_script_arg)
    ld (ix+${VY}), a
    jp bitmap_enemy_script_act_fall
bitmap_enemy_script_act_fall:
    ; One signed byte of vertical velocity: positive rises, negative falls, and
    ; gravity subtracts one per tick down to terminal velocity.
    ld a, (ix+${VY})
    or a
    jp z, .fall_down_1
    bit 7, a
    jp nz, .fall_down
    ld d, a                        ; rising by A pixels this tick
.fall_up_px:
    ld a, (ix+1)
    or a
    jp z, .fall_bonk
    push de
    call bitmap_enemy_script_probe_head
    pop de
    jp nz, .fall_bonk
    dec (ix+1)
    dec d
    jp nz, .fall_up_px
    jp .fall_gravity
.fall_bonk:
    ld (ix+${VY}), 0               ; hit the ceiling: start falling next tick
    jp bitmap_enemy_script_apply
.fall_down_1:
    ld d, 1                        ; velocity zero still falls a pixel
    jp .fall_down_px
.fall_down:
    neg                            ; A = |velocity| downward pixels
    ld d, a
.fall_down_px:
    push de
    call bitmap_enemy_script_probe_below
    pop de
    jp nz, .fall_land
    inc (ix+1)
    dec d
    jp nz, .fall_down_px
    jp .fall_gravity
.fall_land:
    ld (ix+${VY}), 0
    jp bitmap_enemy_script_apply
.fall_gravity:
    ld a, (ix+${VY})
    cp ${asmByte(TERMINAL_VELOCITY)}
    jp z, bitmap_enemy_script_apply
    dec a
    ld (ix+${VY}), a
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_rise:
    ; Climb ignoring gravity, for floaters. It still probes: a floater that
    ; embeds itself in the ceiling looks broken, and costs nothing to prevent.
    ld d, (ix+${SPEED})
.rise_px:
    ld a, (ix+1)
    or a
    jp z, bitmap_enemy_script_apply
    push de
    call bitmap_enemy_script_probe_head
    pop de
    jp nz, bitmap_enemy_script_apply
    dec (ix+1)
    dec d
    jp nz, .rise_px
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_set_anim:
    ld a, (bitmap_enemy_script_arg)
    cp (ix+${FRAME_COUNT})
    jp nc, bitmap_enemy_script_apply       ; a frame the sprite does not have
    ld (ix+${ANIM_FRAME}), a
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_set_speed:
    ld a, (bitmap_enemy_script_arg)
    or a
    jp z, bitmap_enemy_script_apply        ; speed 0 would freeze the slot for good
    ld (ix+${SPEED}), a
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_fire:
${bullets ? `    call bitmap_enemy_bullet_spawn
    jp bitmap_enemy_script_apply` : `    ; Inert: this ROM has no authored behaviour that fires, so no pool was
    ; emitted. Reaching here would need a hand-edited program, since a baked
    ; FIRE makes the generator emit the pool or fail the build.
    jp bitmap_enemy_script_apply`}
bitmap_enemy_script_act_face_player:
    call bitmap_enemy_script_origin
    ld a, (player_x)
    cp d
    jp c, .face_left
    ld (ix+2), #01
    jp bitmap_enemy_script_apply
.face_left:
    ld (ix+2), #FF
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_walk_back:
    ; Retreat without turning, so the sprite keeps watching where it came from.
    ld d, (ix+${SPEED})
.back_px:
    ld a, (ix+2)
    bit 7, a
    jp nz, .back_to_right
    ld a, (ix+0)
    cp (ix+4)
    jp z, bitmap_enemy_script_apply
    jp c, bitmap_enemy_script_apply
    dec (ix+0)
    dec d
    jp nz, .back_px
    jp bitmap_enemy_script_apply
.back_to_right:
    ld a, (ix+0)
    cp (ix+5)
    jp nc, bitmap_enemy_script_apply
    inc (ix+0)
    dec d
    jp nz, .back_px
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_descend:
    ; The mirror of RISE: sink ignoring gravity, but stop on solid ground.
    ld d, (ix+${SPEED})
.descend_px:
    push de
    call bitmap_enemy_script_probe_below
    pop de
    jp nz, bitmap_enemy_script_apply
    inc (ix+1)
    dec d
    jp nz, .descend_px
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_reset_timer:
    ; Restart the clock in place. The tick that follows this action still
    ; increments, so the timer reads 1 on the tick you reset it, not 0.
    ld (ix+${TIMER}), 0
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_shield:
    ld a, (bitmap_enemy_script_arg)
    or a
    jp z, bitmap_enemy_script_apply        ; a zero-tick guard is not a guard
    ld (ix+${SHIELD}), a
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_drop_through:
    ; Step past the landing band and let gravity take it from there. Refuses to
    ; move when there is no one-way platform underfoot, so an author who fires
    ; this on solid ground gets an enemy that stays put, not one that sinks
    ; through the world.
    call bitmap_enemy_script_origin
    ld a, e
    add a, 16
    ld c, a
    ld a, d
    add a, 8
    ld b, a
    call bitmap_probe_solid
    bit 5, a
    jp z, bitmap_enemy_script_apply
    ld a, (ix+1)
    add a, ${PLATFORM_LAND_BAND}
    ld (ix+1), a
    ld (ix+${VY}), 0               ; start the fall from rest, like leaving a ledge
    jp bitmap_enemy_script_apply
bitmap_enemy_script_act_chase:
    ; Face and step on the same tick. Falls into WALK rather than duplicating
    ; it, so the patrol bounds keep applying to a chase exactly as they do to a
    ; walk: a chaser cannot be lured out of its authored box.
    call bitmap_enemy_script_origin
    ld a, (player_x)
    cp d
    jp c, .chase_left
    ld (ix+2), #01
    jp bitmap_enemy_script_act_walk
.chase_left:
    ld (ix+2), #FF
    jp bitmap_enemy_script_act_walk

${bullets ? `
; ------------------------------------------------------------
; ENEMY BULLETS. Every local label here carries the .ebul_ prefix, and that is
; not decoration: this assembles into ONE flat symbol table with every other
; generator, and a plain .spawn_left collided head-on with the player's
; bitmap_try_spawn_bullet. Glass refuses the ROM outright, which is the good
; case; the bad case is a jump that silently resolves to somebody else's code.
; ENEMY BULLETS. Two moving parts, both self-contained: FIRE fills a slot, and
; the per-frame update walks them. The SAT writer is NOT here — sprite slot
; allocation and the #D8 terminator belong to whoever owns the SAT chain.
; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_bullet_spawn
; IN:  IX = the firing enemy's pool slot.
; OUT: one bullet slot armed, or nothing at all if the pool is full.
; REGISTERS: clobbers AF/DE/HL. Preserves BC and IX.
; ------------------------------------------------------------
; A full pool DROPS the shot rather than recycling the oldest bullet. Recycling
; would let one enemy at point-blank range erase a bullet already in flight
; towards the player, which reads as the game cheating in the player's favour
; and is harder to explain than a shot that simply did not happen.
bitmap_enemy_bullet_spawn:
    push bc
    call bitmap_enemy_script_origin    ; D = logical X, E = logical Y
    ld hl, bitmap_enemy_bullet_pool
    ld b, ${asmByte(BULLET_SLOTS)}
.ebul_spawn_find:
    ld a, (hl)
    or a
    jp z, .ebul_spawn_found
    push de
    ld de, 4
    add hl, de
    pop de
    djnz .ebul_spawn_find
    pop bc
    ret                                ; pool full: the shot is lost, by design
.ebul_spawn_found:
    ld (hl), #01                       ; active
    inc hl
    ld a, d
    add a, 8                           ; body centre
    bit 7, (ix+2)
    jp nz, .ebul_spawn_left
    add a, 8                           ; clear of the leading edge, facing right
    ld (hl), a
    inc hl
    ld a, e
    add a, 6
    ld (hl), a
    inc hl
    ld (hl), #01                       ; dir = right
    pop bc
    ret
.ebul_spawn_left:
    sub 8
    ld (hl), a
    inc hl
    ld a, e
    add a, 6
    ld (hl), a
    inc hl
    ld (hl), #00                       ; dir = left
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_enemy_bullet_update
; Call ONCE PER FRAME, right after bitmap_update_enemies, so a slot armed by
; FIRE this tick starts moving on the next one.
; REGISTERS: clobbers AF/BC/DE/HL/IX.
; ------------------------------------------------------------
bitmap_enemy_bullet_update:
    ld ix, bitmap_enemy_bullet_pool
    ld b, ${asmByte(BULLET_SLOTS)}
.ebul_slot:
    ld a, (ix+0)
    or a
    jp z, .ebul_next
    ld a, (ix+3)
    or a
    jp z, .ebul_go_left
    ld a, (ix+1)
    add a, ${asmByte(BULLET_SPEED)}
    jp c, .ebul_kill                    ; ran off the right of the room
    ld (ix+1), a
    jp .ebul_tests
.ebul_go_left:
    ld a, (ix+1)
    sub ${asmByte(BULLET_SPEED)}
    jp c, .ebul_kill                    ; ran off the left of the room
    ld (ix+1), a
.ebul_tests:
    ; Walls stop it. BC holds the slot counter, and bitmap_probe_solid takes its
    ; arguments in BC, so the counter has to go on the stack for the call.
    push bc
    ld b, (ix+1)
    ld c, (ix+2)
    call bitmap_probe_solid
    pop bc
    jp nz, .ebul_kill
    ld a, (player_invuln)
    or a
    jp nz, .ebul_next                    ; i-frames keep the shot alive
    ld a, (player_x)
    sub (ix+1)
    jp nc, .ebul_dx_abs
    neg
.ebul_dx_abs:
    cp 10
    jp nc, .ebul_next
    ld a, (player_y)
    sub (ix+2)
    jp nc, .ebul_dy_abs
    neg
.ebul_dy_abs:
    cp 14
    jp nc, .ebul_next
    xor a
    ld (ix+0), a                       ; spent on the player
    push bc
    ld a, ${asmByte(BULLET_DAMAGE)}
    call ${bullets.playerHurtLabel}
    pop bc
    jp .ebul_next
.ebul_kill:
    xor a
    ld (ix+0), a
.ebul_next:
    ld de, 4
    add ix, de
    djnz .ebul_slot
    ret
` : ''}
; ------------------------------------------------------------
; Opcode jump tables. Order MUST match MSX2_ENEMY_COND / MSX2_ENEMY_ACT in
; utils/msx2EnemyBehavior.ts; check_msx2_enemy_behavior_runtime.mjs asserts it.
; ------------------------------------------------------------
bitmap_enemy_script_cond_table:
    dw bitmap_enemy_script_cond_always          ; 00 ALWAYS
    dw bitmap_enemy_script_cond_floor_ahead     ; 01 FLOOR_AHEAD
    dw bitmap_enemy_script_cond_no_floor_ahead  ; 02 NO_FLOOR_AHEAD
    dw bitmap_enemy_script_cond_wall_ahead      ; 03 WALL_AHEAD
    dw bitmap_enemy_script_cond_solid_above     ; 04 SOLID_ABOVE
    dw bitmap_enemy_script_cond_no_solid_above  ; 05 NO_SOLID_ABOVE
    dw bitmap_enemy_script_cond_on_ground       ; 06 ON_GROUND
    dw bitmap_enemy_script_cond_not_on_ground   ; 07 NOT_ON_GROUND
    dw bitmap_enemy_script_cond_timer           ; 08 TIMER_ELAPSED
    dw bitmap_enemy_script_cond_player_near_x   ; 09 PLAYER_NEAR_X
    dw bitmap_enemy_script_cond_player_near_y   ; 0A PLAYER_NEAR_Y
    dw bitmap_enemy_script_cond_player_left     ; 0B PLAYER_LEFT
    dw bitmap_enemy_script_cond_player_right    ; 0C PLAYER_RIGHT
    dw bitmap_enemy_script_cond_random          ; 0D RANDOM
    dw bitmap_enemy_script_cond_at_min_x        ; 0E AT_MIN_X
    dw bitmap_enemy_script_cond_at_max_x        ; 0F AT_MAX_X
    dw bitmap_enemy_script_cond_player_above    ; 10 PLAYER_ABOVE
    dw bitmap_enemy_script_cond_player_below    ; 11 PLAYER_BELOW
    dw bitmap_enemy_script_cond_player_in_front ; 12 PLAYER_IN_FRONT
    dw bitmap_enemy_script_cond_facing_left     ; 13 FACING_LEFT
    dw bitmap_enemy_script_cond_facing_right    ; 14 FACING_RIGHT
    dw bitmap_enemy_script_cond_at_min_y        ; 15 AT_MIN_Y
    dw bitmap_enemy_script_cond_at_max_y        ; 16 AT_MAX_Y
    dw bitmap_enemy_script_cond_no_wall_ahead   ; 17 NO_WALL_AHEAD
    dw bitmap_enemy_script_cond_was_hit         ; 18 WAS_HIT
    dw bitmap_enemy_script_cond_shield_active   ; 19 SHIELD_ACTIVE
    dw bitmap_enemy_script_cond_enemy_ahead     ; 1A ENEMY_AHEAD
    dw bitmap_enemy_script_cond_on_platform_tile ; 1B ON_PLATFORM_TILE
bitmap_enemy_script_act_table:
    dw bitmap_enemy_script_act_idle             ; 00 IDLE
    dw bitmap_enemy_script_act_walk             ; 01 WALK
    dw bitmap_enemy_script_act_turn             ; 02 TURN
    dw bitmap_enemy_script_act_turn_and_walk    ; 03 TURN_AND_WALK
    dw bitmap_enemy_script_act_jump             ; 04 JUMP
    dw bitmap_enemy_script_act_fall             ; 05 FALL
    dw bitmap_enemy_script_act_rise             ; 06 RISE
    dw bitmap_enemy_script_act_set_anim         ; 07 SET_ANIM
    dw bitmap_enemy_script_act_set_speed        ; 08 SET_SPEED
    dw bitmap_enemy_script_act_fire             ; 09 FIRE (reserved)
    dw bitmap_enemy_script_act_face_player      ; 0A FACE_PLAYER
    dw bitmap_enemy_script_act_walk_back        ; 0B WALK_BACK
    dw bitmap_enemy_script_act_descend          ; 0C DESCEND
    dw bitmap_enemy_script_act_reset_timer      ; 0D RESET_TIMER
    dw bitmap_enemy_script_act_shield           ; 0E SHIELD
    dw bitmap_enemy_script_act_chase            ; 0F CHASE
    dw bitmap_enemy_script_act_drop_through     ; 10 DROP_THROUGH
`;

  return {
    equates,
    routinesAsm,
    ramBytes: MSX2_ENEMY_SCRIPT_SCRATCH_BYTES,
    // Reported separately because it sits at its own ramBase, which the caller
    // chose: this is how much of it is actually in use.
    bulletRamBytes: BULLET_SLOTS * 4,
  };
}

/**
 * Emits the program pointer table and the baked programs themselves.
 *
 * Index 0 is always the standing fallback, so a slot whose behaviour asset went
 * missing points at a real program instead of at whatever byte pair sits at the
 * head of the table.
 */
export function buildEnemyBehaviorProgramAsm(
  programs: Array<{ id: string; name: string; bytes: number[] }>,
): { asm: string; indexById: Record<string, number> } {
  const fallback = { id: '__fallback__', name: 'standing fallback', bytes: [1, 3, 0, 1, 0, 0, 0, 0, 0xff] };
  const all = [fallback, ...programs];
  const indexById: Record<string, number> = {};
  all.forEach((program, index) => { indexById[program.id] = index; });

  const lines: string[] = [
    '; ---- scripted enemy behaviour programs ----',
    '; Index 0 is the standing fallback: a slot with a missing asset must land on',
    '; a real program, never on a wild pointer.',
    'bitmap_enemy_script_ptr_table:',
    ...all.map((program, index) => `    dw bitmap_enemy_script_program_${index}   ; ${program.name}`),
    '',
  ];
  all.forEach((program, index) => {
    lines.push(`bitmap_enemy_script_program_${index}:   ; ${program.name} (${program.bytes.length} bytes)`);
    for (let at = 0; at < program.bytes.length; at += 16) {
      lines.push(`    db ${program.bytes.slice(at, at + 16).map(b => asmByte(b)).join(', ')}`);
    }
  });

  return { asm: lines.join('\n') + '\n', indexById };
}

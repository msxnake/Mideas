/**
 * Bakes an authored ENEMY BEHAVIOUR asset into the byte stream a single
 * resident Z80 interpreter walks.
 *
 * Why this exists: every new SCREEN 5 enemy behaviour used to cost a bespoke
 * ASM handler in msx2BitmapEnemyGenerator, a build flag, AND extra pool bytes
 * on EVERY slot whether it used the mode or not (see bitmapEnemyPoolStride).
 * Three engines already means eight combinations. One interpreter plus data
 * makes a new behaviour cost zero generator work.
 *
 * The model is deliberately condition-driven, matching the project rule that
 * there are no events, only conditions. A behaviour is a handful of STATES;
 * each state is an ORDERED list of rules evaluated top-down every logic tick,
 * and the first rule whose condition holds wins. Nothing else runs that tick.
 *
 * Stream format — one program per asset:
 *
 *   db  stateCount                      1..MAX_STATES
 *   dw  stateOffset[stateCount]         byte offset from the program base
 *   ... state blocks, in state order ...
 *
 *   state block:
 *     db  ruleCount                     1..MAX_RULES_PER_STATE
 *     ... ruleCount rules of RULE_BYTES bytes ...
 *
 *   rule (5 bytes):
 *     db  condition, conditionArg, action, actionArg, nextState
 *
 * `nextState` is NEXT_STATE_STAY (#FF) to remain in the current state; any
 * other value switches state AND resets the state timer. Packing the switch
 * into the rule is what stops a transition from costing a wasted tick: the
 * enemy turns and steps in the same update, with no interpreter loop and so no
 * need for a hop guard.
 *
 * The offsets are WORDS. A byte offset would be one instruction cheaper on the
 * Z80, but MAX_STATES * MAX_RULES_PER_STATE already exceeds 255 bytes, and a
 * silently truncated offset is exactly the class of bug this project keeps
 * paying for. Note for whoever writes the interpreter: the state index must be
 * DOUBLED before it indexes the offset table (`add hl, hl`). Reading a word
 * table with an unshifted index is a bug this codebase has shipped more than
 * once.
 */

/** Ceiling per asset. Chosen to be measured on hardware, not defended. */
export const MSX2_ENEMY_BEHAVIOR_MAX_STATES = 8;
/** Ceiling per state, including the mandatory catch-all. */
export const MSX2_ENEMY_BEHAVIOR_MAX_RULES = 8;
/** condition, conditionArg, action, actionArg, nextState. */
export const MSX2_ENEMY_BEHAVIOR_RULE_BYTES = 5;
/** `nextState` value meaning "stay where you are". */
export const MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY = 0xff;

/**
 * Conditions the interpreter can test. "Ahead" always means the direction the
 * enemy currently faces, so one authored state serves both facings.
 *
 * The probes map onto bitmap_probe_solid (B = pixel X, C = pixel Y), which the
 * walkerGravity handler already uses, so no new sensing primitive is needed.
 */
export const MSX2_ENEMY_COND = {
  /** Always true. Every state's last rule must be one of these. */
  ALWAYS: 0x00,
  /** Solid ground one pixel below the leading bottom corner. */
  FLOOR_AHEAD: 0x01,
  /** The ledge case: no ground under the leading bottom corner. */
  NO_FLOOR_AHEAD: 0x02,
  /** Solid cell at body edge + 1 in the facing direction, at mid height. */
  WALL_AHEAD: 0x03,
  /** arg = tiles above the body top (1..11) that must be solid. */
  SOLID_ABOVE: 0x04,
  /** arg = tiles above the body top (1..11) that must be clear. */
  NO_SOLID_ABOVE: 0x05,
  /** Standing on something solid. */
  ON_GROUND: 0x06,
  /** In the air. */
  NOT_ON_GROUND: 0x07,
  /** arg = ticks. True once the state timer has reached arg. */
  TIMER_ELAPSED: 0x08,
  /** arg = pixels. |player.x - enemy.x| <= arg. */
  PLAYER_NEAR_X: 0x09,
  /** arg = pixels. |player.y - enemy.y| <= arg. */
  PLAYER_NEAR_Y: 0x0a,
  /** The player is to the left, whichever way the enemy faces. */
  PLAYER_LEFT: 0x0b,
  /** The player is to the right. */
  PLAYER_RIGHT: 0x0c,
  /** arg = 1..255. True when the per-frame PRNG byte is below arg. */
  RANDOM: 0x0d,
  /** Reached the authored minX patrol bound. */
  AT_MIN_X: 0x0e,
  /** Reached the authored maxX patrol bound. */
  AT_MAX_X: 0x0f,
  /** The player is higher up the screen. */
  PLAYER_ABOVE: 0x10,
  /** The player is lower down the screen. */
  PLAYER_BELOW: 0x11,
  /** The player is on the side the enemy currently faces. */
  PLAYER_IN_FRONT: 0x12,
  /** Currently facing left. Its negation is FACING_RIGHT, not rule order. */
  FACING_LEFT: 0x13,
  FACING_RIGHT: 0x14,
  /** Reached the authored minY bound. Vertical patrols need this. */
  AT_MIN_Y: 0x15,
  AT_MAX_Y: 0x16,
  /** Clear ahead. Saves burning the catch-all on "keep going if nothing blocks". */
  NO_WALL_AHEAD: 0x17,
  /**
   * arg = how many ticks back still counts. The damage path stamps the slot on
   * impact and the stamp fades one tick at a time, so this reads "the player
   * shot me recently" without the rule having to run on the exact frame.
   */
  WAS_HIT: 0x18,
  /** Guard still up. Use it to keep a shield state from re-arming every tick. */
  SHIELD_ACTIVE: 0x19,
  /**
   * arg = pixels. Another live enemy slot is ahead within that reach and in the
   * same 16px horizontal band. Both enemies see each other, so both turn.
   */
  ENEMY_AHEAD: 0x1a,
  /**
   * Standing on a one-way platform: a cell painted "Platform" in the room
   * editor, which you can jump up through from below and drop down through on
   * purpose. Pair it with TIMER_ELAPSED and RANDOM to get "every so often,
   * maybe go down a floor".
   */
  ON_PLATFORM_TILE: 0x1b,
} as const;

/** Actions. Exactly one runs per logic tick. */
export const MSX2_ENEMY_ACT = {
  /** Burn the tick. Use with nextState to switch without moving. */
  IDLE: 0x00,
  /** Step `speed` pixels in the facing direction. */
  WALK: 0x01,
  /** Flip the facing. Does not move. */
  TURN: 0x02,
  /** Flip the facing AND step, so a ledge turn costs no tick. */
  TURN_AND_WALK: 0x03,
  /** arg = initial upward pixels per tick. Sets vy and leaves the ground. */
  JUMP: 0x04,
  /** Apply gravity: move down by the accumulated vy. */
  FALL: 0x05,
  /** Move `speed` pixels straight up, ignoring gravity (climbers, floaters). */
  RISE: 0x06,
  /** arg = animation frame index. Does not move. */
  SET_ANIM: 0x07,
  /** arg = pixels per logic tick. Persists until changed. */
  SET_SPEED: 0x08,
  /**
   * arg = shoot pattern index. Spawns an enemy bullet travelling horizontally
   * in the facing direction. There is no cooldown byte: cadence is authored,
   * with a firing state that hands off to a waiting state on TIMER_ELAPSED.
   * That keeps the rate visible in the editor instead of buried in a constant.
   *
   * A program containing FIRE makes the generator emit the bullet pool, or fail
   * the build. It is never quietly inert.
   */
  FIRE: 0x09,
  /** Turn to face the player. One opcode instead of a PLAYER_LEFT/TURN dance. */
  FACE_PLAYER: 0x0a,
  /** Step backwards without turning: retreat while keeping your guard up. */
  WALK_BACK: 0x0b,
  /** Sink `speed` pixels, ignoring gravity, stopping on solid ground. */
  DESCEND: 0x0c,
  /**
   * Restart the state's clock without leaving the state. Lets one state run a
   * repeating cycle ("every N ticks, do X") instead of ping-ponging between two.
   */
  RESET_TIMER: 0x0d,
  /**
   * arg = ticks of guard. While the clock runs the damage path skips this slot
   * and the bullet is spent anyway, so a shielded enemy eats the shot instead
   * of ignoring it.
   */
  SHIELD: 0x0e,
  /**
   * Turn towards the player AND step, in one tick. FACE_PLAYER spends the whole
   * tick turning, so a two-state chase always lost a tick per direction change;
   * this is the same behaviour without the stutter.
   */
  CHASE: 0x0f,
  /**
   * Step down through the one-way platform underfoot.
   *
   * It moves the body just far enough to clear the landing band the floor probe
   * uses, and no further: gravity does the rest, and the enemy lands on
   * whatever the next platform down turns out to be. Does nothing when there is
   * no platform underfoot, so a rule that fires on solid ground is inert rather
   * than a way to walk through the world.
   */
  DROP_THROUGH: 0x10,
} as const;

export type Msx2EnemyBehaviorConditionName = keyof typeof MSX2_ENEMY_COND;
export type Msx2EnemyBehaviorActionName = keyof typeof MSX2_ENEMY_ACT;

/** What an opcode's argument means, and the range the runtime can honour. */
export interface Msx2EnemyBehaviorArgSpec {
  min: number;
  max: number;
  /** Unit shown next to the field, e.g. "tiles" or "px/tick". */
  unit: string;
}

/** One entry per opcode: the label an author reads and the argument it takes. */
export interface Msx2EnemyBehaviorOpcodeInfo {
  label: string;
  /** Absent when the opcode ignores its argument, which then bakes as 0. */
  arg?: Msx2EnemyBehaviorArgSpec;
  /** Why an author would reach for it, or what to watch out for. */
  help: string;
}

/**
 * Single source of truth for opcode metadata: the baker clamps from here and the
 * editor renders from here. Two tables would drift, and a UI that offers a value
 * the baker silently clamps is how an author ends up debugging the wrong thing.
 */
export const MSX2_ENEMY_COND_INFO: Record<Msx2EnemyBehaviorConditionName, Msx2EnemyBehaviorOpcodeInfo> = {
  ALWAYS: { label: 'Always', help: 'Catch-all. Every state needs one as its last rule; the baker adds it if you do not.' },
  FLOOR_AHEAD: { label: 'Floor ahead', help: 'Solid ground under the leading bottom corner.' },
  NO_FLOOR_AHEAD: { label: 'No floor ahead', help: 'The ledge test: nothing under the leading bottom corner.' },
  WALL_AHEAD: { label: 'Wall ahead', help: 'Solid at body edge + 1, mid height. The room edge counts as a wall.' },
  // The room is 12 cells tall; probing further up always reads off-room.
  SOLID_ABOVE: { label: 'Ceiling above', arg: { min: 1, max: 11, unit: 'tiles' }, help: 'Solid N tiles over the body top. Above the room counts as solid.' },
  NO_SOLID_ABOVE: { label: 'No ceiling above', arg: { min: 1, max: 11, unit: 'tiles' }, help: 'Clear N tiles over the body top.' },
  ON_GROUND: { label: 'On ground', help: 'Standing on something solid.' },
  NOT_ON_GROUND: { label: 'In the air', help: 'Nothing under the body.' },
  TIMER_ELAPSED: { label: 'Time in state', arg: { min: 1, max: 255, unit: 'ticks' }, help: 'Ticks since entering this state. The timer saturates at 255.' },
  PLAYER_NEAR_X: { label: 'Player near (X)', arg: { min: 1, max: 255, unit: 'px' }, help: 'Horizontal distance to the player is N pixels or less.' },
  PLAYER_NEAR_Y: { label: 'Player near (Y)', arg: { min: 1, max: 255, unit: 'px' }, help: 'Vertical distance to the player is N pixels or less.' },
  PLAYER_LEFT: { label: 'Player to the left', help: 'Regardless of which way the enemy faces.' },
  PLAYER_RIGHT: { label: 'Player to the right', help: 'Regardless of which way the enemy faces.' },
  RANDOM: { label: 'Random chance', arg: { min: 1, max: 255, unit: '/255' }, help: 'Fires when a shared per-tick random byte falls below N.' },
  AT_MIN_X: { label: 'At left patrol bound', help: 'Reached the minX authored on the placed enemy.' },
  AT_MAX_X: { label: 'At right patrol bound', help: 'Reached the maxX authored on the placed enemy.' },
  PLAYER_ABOVE: { label: 'Player above', help: 'The player is higher up the screen than the body top.' },
  PLAYER_BELOW: { label: 'Player below', help: 'The player is lower down the screen.' },
  PLAYER_IN_FRONT: { label: 'Player in front', help: 'The player is on the side the enemy faces. The sight test for chargers and sentries.' },
  FACING_LEFT: { label: 'Facing left', help: 'Use with its opposite to give an enemy asymmetric behaviour.' },
  FACING_RIGHT: { label: 'Facing right', help: 'Use with its opposite to give an enemy asymmetric behaviour.' },
  AT_MIN_Y: { label: 'At top bound', help: 'Reached the minY authored on the placed enemy. For vertical patrols.' },
  AT_MAX_Y: { label: 'At bottom bound', help: 'Reached the maxY authored on the placed enemy.' },
  NO_WALL_AHEAD: { label: 'Nothing ahead', help: 'Clear at body edge + 1. Saves spending the catch-all on "carry on if nothing blocks".' },
  WAS_HIT: { label: 'Was shot recently', arg: { min: 1, max: 255, unit: 'ticks' }, help: 'The player hit this enemy N ticks ago or less. Pair it with Raise shield.' },
  SHIELD_ACTIVE: { label: 'Shield up', help: 'Guard ticks still on the clock. Keeps a shield state from re-arming itself every tick.' },
  ENEMY_AHEAD: { label: 'Enemy ahead', arg: { min: 1, max: 255, unit: 'px' }, help: 'Another live enemy is within N pixels ahead, in the same 16px band. Both see each other, so both turn.' },
  ON_PLATFORM_TILE: { label: 'On a one-way platform', help: 'Standing on a cell painted Platform, the kind you can drop through. False on ordinary solid ground.' },
};

export const MSX2_ENEMY_ACT_INFO: Record<Msx2EnemyBehaviorActionName, Msx2EnemyBehaviorOpcodeInfo> = {
  IDLE: { label: 'Do nothing', help: 'Burns the tick. Pair it with a state switch to change state without moving.' },
  WALK: { label: 'Walk forward', help: 'Steps at the current speed. Blind to walls and ledges on purpose: that is what the rules are for.' },
  TURN: { label: 'Turn around', help: 'Flips the facing without moving.' },
  TURN_AND_WALK: { label: 'Turn and walk', help: 'Turns and steps in the same tick, so a ledge turn costs no frame on the brink.' },
  // A jump faster than 8px/tick tunnels through a 16px ceiling cell between probes.
  JUMP: { label: 'Jump', arg: { min: 1, max: 8, unit: 'px/tick' }, help: 'Sets upward speed and integrates it at once. Over 8 px/tick the body tunnels through a ceiling.' },
  FALL: { label: 'Fall', help: 'Applies gravity: rises while velocity is positive, then falls, stopping on solid ground.' },
  RISE: { label: 'Rise', help: 'Climbs at the current speed, ignoring gravity. For floaters.' },
  SET_ANIM: { label: 'Set frame', arg: { min: 0, max: 3, unit: 'frame' }, help: 'Frames the sprite does not have are ignored.' },
  SET_SPEED: { label: 'Set speed', arg: { min: 1, max: 8, unit: 'px/tick' }, help: 'Persists until changed. Speed 0 is refused; it would freeze the slot for good.' },
  FIRE: { label: 'Fire', arg: { min: 0, max: 7, unit: 'pattern' }, help: 'Shoots horizontally the way the enemy faces. No cooldown: pair a firing state with a waiting one on Time in state.' },
  FACE_PLAYER: { label: 'Face the player', help: 'Turns toward the player without moving. Does nothing if already facing them.' },
  WALK_BACK: { label: 'Step back', help: 'Moves opposite to the facing without turning. For retreating while still watching.' },
  DESCEND: { label: 'Descend', help: 'Sinks at the current speed ignoring gravity, and stops on solid ground. The mirror of Rise.' },
  RESET_TIMER: { label: 'Restart state timer', help: 'Restarts the clock without leaving the state, so one state can run a repeating cycle.' },
  SHIELD: { label: 'Raise shield', arg: { min: 1, max: 255, unit: 'ticks' }, help: 'Invulnerable for N ticks. The shot still hits and is spent, it just does no damage.' },
  CHASE: { label: 'Chase the player', help: 'Turns towards the player and steps in the same tick. The one-opcode chase.' },
  DROP_THROUGH: { label: 'Drop through platform', help: 'Steps down through the one-way platform underfoot and falls to the next one. Does nothing on solid ground.' },
};

const CONDITIONS_WITH_ARG: ReadonlySet<Msx2EnemyBehaviorConditionName> = new Set(
  (Object.keys(MSX2_ENEMY_COND_INFO) as Msx2EnemyBehaviorConditionName[]).filter(name => MSX2_ENEMY_COND_INFO[name].arg));

const ACTIONS_WITH_ARG: ReadonlySet<Msx2EnemyBehaviorActionName> = new Set(
  (Object.keys(MSX2_ENEMY_ACT_INFO) as Msx2EnemyBehaviorActionName[]).filter(name => MSX2_ENEMY_ACT_INFO[name].arg));

const ARG_RANGES: Partial<Record<Msx2EnemyBehaviorConditionName | Msx2EnemyBehaviorActionName, Msx2EnemyBehaviorArgSpec>> = {
  ...Object.fromEntries((Object.keys(MSX2_ENEMY_COND_INFO) as Msx2EnemyBehaviorConditionName[])
    .flatMap(name => (MSX2_ENEMY_COND_INFO[name].arg ? [[name, MSX2_ENEMY_COND_INFO[name].arg!]] : []))),
  ...Object.fromEntries((Object.keys(MSX2_ENEMY_ACT_INFO) as Msx2EnemyBehaviorActionName[])
    .flatMap(name => (MSX2_ENEMY_ACT_INFO[name].arg ? [[name, MSX2_ENEMY_ACT_INFO[name].arg!]] : []))),
};

export interface Msx2EnemyBehaviorRule {
  id: string;
  condition: Msx2EnemyBehaviorConditionName;
  /** Read only by the conditions listed in CONDITIONS_WITH_ARG. */
  conditionArg?: number;
  action: Msx2EnemyBehaviorActionName;
  /** Read only by the actions listed in ACTIONS_WITH_ARG. */
  actionArg?: number;
  /** State to switch to, by index. Undefined or -1 means "stay". */
  nextState?: number;
}

export interface Msx2EnemyBehaviorState {
  id: string;
  name: string;
  rules: Msx2EnemyBehaviorRule[];
}

/**
 * A reusable movement recipe for simple enemies. Referenced by a placed enemy
 * (or by an enemy definition as its default), never owned by one — the same
 * asset drives every enemy that opts into it, in any room.
 */
export interface Msx2EnemyBehaviorAsset {
  id: string;
  name: string;
  /** Fixed target; the interpreter is a SCREEN 5 bitmap-room system. */
  target?: 'MSX2';
  states: Msx2EnemyBehaviorState[];
  /** Index into `states` the enemy starts in. Defaults to 0. */
  initialState?: number;
  /** Pixels per logic tick before any SET_SPEED runs. */
  speedPxPerTick?: number;
  /** Video frames between logic ticks, mirroring the existing cadence gate. */
  logicIntervalFrames?: number;
  /**
   * Does this enemy fall when there is nothing under it? Defaults to TRUE: a
   * body standing on air is the surprising case, not the ordinary one, and
   * before this existed every ground enemy needed an explicit FALL rule that
   * authors kept forgetting — the enemy simply hovered over the hole.
   *
   * Set false for anything that flies. The vertical actions (JUMP, FALL, RISE,
   * DESCEND, DROP_THROUGH) always win for the tick they run in, so a program
   * can still take the axis over whenever it wants.
   */
  gravity?: boolean;
  notes?: string;
}

export interface Msx2EnemyBehaviorBakeResult {
  bytes: number[];
  /** Byte offset of each state block from the program base, in state order. */
  stateOffsets: number[];
  /** Baked initial state index, already clamped to a state that exists. */
  initialState: number;
  /**
   * Problems that make the program unsafe to run. A bake with errors still
   * returns bytes — a safe fallback program — so a broken asset degrades to a
   * standing enemy instead of failing the whole ROM build.
   */
  errors: string[];
  warnings: string[];
  /**
   * Action opcodes this program actually contains, sorted and deduplicated.
   *
   * The generator uses it to decide whether an optional subsystem is worth
   * emitting at all: FIRE only earns its bullet pool, its RAM and its two SAT
   * entries if some authored program really fires. Turning the behaviour
   * engine on must not, by itself, move a single byte of a ROM whose enemies
   * never shoot.
   */
  usedActions: number[];
}

/**
 * Walks a baked program and collects the action opcodes it uses.
 *
 * Reads the stream the way the interpreter does — state table, rule counts —
 * rather than scanning for bytes that look like opcodes, because an argument
 * byte holding the value 9 is not a FIRE.
 */
export function enemyProgramUsedActions(bytes: number[]): number[] {
  const used = new Set<number>();
  const stateCount = bytes[0] ?? 0;
  for (let state = 0; state < stateCount; state += 1) {
    const offset = (bytes[1 + state * 2] ?? 0) | ((bytes[2 + state * 2] ?? 0) << 8);
    const ruleCount = bytes[offset] ?? 0;
    for (let rule = 0; rule < ruleCount; rule += 1) {
      const at = offset + 1 + rule * MSX2_ENEMY_BEHAVIOR_RULE_BYTES;
      if (at + 2 < bytes.length) used.add(bytes[at + 2]);
    }
  }
  return [...used].sort((a, b) => a - b);
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const toByte = (value: unknown, fallback = 0): number => {
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) ? clamp(numeric, 0, 255) : fallback;
};

/**
 * The program a broken or empty asset falls back to: one state, one catch-all
 * rule, stand still. Chosen over throwing because an unbuildable ROM tells the
 * author nothing about WHICH enemy is wrong, while a motionless enemy plus the
 * returned error does.
 */
function fallbackProgram(): { bytes: number[]; stateOffsets: number[] } {
  const stateOffsets = [3];
  return {
    bytes: [
      1,                                              // stateCount
      stateOffsets[0] & 0xff, stateOffsets[0] >> 8,   // stateOffset[0]
      1,                                              // ruleCount
      MSX2_ENEMY_COND.ALWAYS, 0, MSX2_ENEMY_ACT.IDLE, 0, MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY,
    ],
    stateOffsets,
  };
}

/** Clamps an authored argument to what the runtime can actually honour. */
function bakeArg(
  name: Msx2EnemyBehaviorConditionName | Msx2EnemyBehaviorActionName,
  raw: unknown,
  used: boolean,
  where: string,
  warnings: string[],
): number {
  if (!used) return 0;
  const range = ARG_RANGES[name];
  const value = toByte(raw, range ? range.min : 0);
  if (!range) return value;
  const clamped = clamp(value, range.min, range.max);
  if (clamped !== value) {
    warnings.push(`${where}: ${name} argument ${value} is outside ${range.min}..${range.max}, baked as ${clamped}`);
  }
  return clamped;
}

/**
 * Bakes one behaviour asset.
 *
 * Never throws. Anything the runtime could not survive becomes an entry in
 * `errors` and the whole program collapses to the standing fallback, so a bad
 * asset costs one motionless enemy rather than the build.
 */
export function bakeEnemyBehavior(asset: Msx2EnemyBehaviorAsset | undefined): Msx2EnemyBehaviorBakeResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const authored = (asset?.states || []).filter(state => state && Array.isArray(state.rules));
  if (!authored.length) {
    errors.push('behaviour has no states; baked a standing enemy');
    const fallback = fallbackProgram();
    return { ...fallback, initialState: 0, errors, warnings, usedActions: enemyProgramUsedActions(fallback.bytes) };
  }

  const states = authored.slice(0, MSX2_ENEMY_BEHAVIOR_MAX_STATES);
  if (authored.length > states.length) {
    warnings.push(`${authored.length} states authored but only the first ${MSX2_ENEMY_BEHAVIOR_MAX_STATES} are baked`);
  }

  // Rules are baked first so the state blocks can be measured before the header
  // that points at them is written.
  const stateBlocks: number[][] = states.map((state, stateIndex) => {
    const label = state.name || `state ${stateIndex}`;
    const rules = (state.rules || []).slice(0, MSX2_ENEMY_BEHAVIOR_MAX_RULES);
    if ((state.rules || []).length > rules.length) {
      warnings.push(`${label}: ${state.rules.length} rules authored but only the first ${MSX2_ENEMY_BEHAVIOR_MAX_RULES} are baked`);
    }

    const baked: number[] = [];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const where = `${label}, rule ${i + 1}`;
      const condition = (rule?.condition && rule.condition in MSX2_ENEMY_COND)
        ? rule.condition
        : null;
      const action = (rule?.action && rule.action in MSX2_ENEMY_ACT)
        ? rule.action
        : null;
      if (!condition) {
        errors.push(`${where}: unknown condition ${String(rule?.condition)}`);
        continue;
      }
      if (!action) {
        errors.push(`${where}: unknown action ${String(rule?.action)}`);
        continue;
      }
      if (action === 'FIRE') {
        warnings.push(`${where}: FIRE has no cooldown of its own; give the firing state a waiting state on TIMER_ELAPSED or it shoots every tick`);
      }

      const nextRaw = Math.floor(Number(rule.nextState));
      let nextState = MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY;
      if (Number.isFinite(nextRaw) && nextRaw >= 0) {
        if (nextRaw >= states.length) {
          // A dangling target is the one authoring mistake that turns into a
          // wild jump on hardware, so it downgrades to "stay" and is reported.
          errors.push(`${where}: jumps to state ${nextRaw}, which does not exist`);
        } else {
          nextState = nextRaw;
        }
      }

      baked.push(
        MSX2_ENEMY_COND[condition],
        bakeArg(condition, rule.conditionArg, CONDITIONS_WITH_ARG.has(condition), where, warnings),
        MSX2_ENEMY_ACT[action],
        bakeArg(action, rule.actionArg, ACTIONS_WITH_ARG.has(action), where, warnings),
        nextState,
      );
    }

    // The interpreter walks ruleCount rules and never checks for running off the
    // end: a state whose last rule can fail would fall through into whatever
    // bytes follow. The catch-all is therefore mandatory, and appended rather
    // than rejected so an author mid-edit still gets a runnable ROM.
    const ruleCount = baked.length / MSX2_ENEMY_BEHAVIOR_RULE_BYTES;
    const lastCondition = ruleCount > 0 ? baked[(ruleCount - 1) * MSX2_ENEMY_BEHAVIOR_RULE_BYTES] : -1;
    if (lastCondition !== MSX2_ENEMY_COND.ALWAYS) {
      if (ruleCount >= MSX2_ENEMY_BEHAVIOR_MAX_RULES) {
        // A full state with no catch-all is repaired, not rejected: dropping the
        // author's last rule costs one rule, while treating it as an error would
        // collapse the whole behaviour to a standing enemy for a mistake that
        // has a safe, predictable repair.
        warnings.push(`${label}: no catch-all rule and no room to add one; the last authored rule was replaced by "always: idle"`);
        baked.splice((MSX2_ENEMY_BEHAVIOR_MAX_RULES - 1) * MSX2_ENEMY_BEHAVIOR_RULE_BYTES);
      } else {
        warnings.push(`${label}: no catch-all rule, appended "always: idle"`);
      }
      baked.push(MSX2_ENEMY_COND.ALWAYS, 0, MSX2_ENEMY_ACT.IDLE, 0, MSX2_ENEMY_BEHAVIOR_NEXT_STATE_STAY);
    }

    return [baked.length / MSX2_ENEMY_BEHAVIOR_RULE_BYTES, ...baked];
  });

  if (errors.length) {
    const fallback = fallbackProgram();
    return { ...fallback, initialState: 0, errors, warnings, usedActions: enemyProgramUsedActions(fallback.bytes) };
  }

  const headerBytes = 1 + states.length * 2;
  const stateOffsets: number[] = [];
  let cursor = headerBytes;
  for (const block of stateBlocks) {
    stateOffsets.push(cursor);
    cursor += block.length;
  }

  const bytes: number[] = [states.length];
  for (const offset of stateOffsets) bytes.push(offset & 0xff, (offset >> 8) & 0xff);
  for (const block of stateBlocks) bytes.push(...block);

  const initialRaw = Math.floor(Number(asset?.initialState) || 0);
  const initialState = clamp(Number.isFinite(initialRaw) ? initialRaw : 0, 0, states.length - 1);
  if (initialRaw !== initialState) {
    warnings.push(`initial state ${initialRaw} does not exist; starting in state ${initialState}`);
  }

  return { bytes, stateOffsets, initialState, errors, warnings, usedActions: enemyProgramUsedActions(bytes) };
}

/**
 * Ready-made behaviours the editor offers as starting points.
 *
 * Each one exists because the state/rule model alone does not teach an author
 * WHICH rules make a recognisable enemy. Reading "Chaser" next to "Walker" is
 * how you learn that sight is PLAYER_IN_FRONT and that a charge is just a
 * second state with a higher speed.
 */
export interface Msx2EnemyBehaviorPreset {
  key: string;
  label: string;
  /** What the enemy visibly does, in one line, for the editor's picker. */
  summary: string;
  build: () => Omit<Msx2EnemyBehaviorAsset, 'id' | 'name'>;
}

const rule = (
  condition: Msx2EnemyBehaviorConditionName,
  action: Msx2EnemyBehaviorActionName,
  extra: Partial<Msx2EnemyBehaviorRule> = {},
): Msx2EnemyBehaviorRule => ({
  id: `r_${condition}_${action}_${Math.random().toString(36).slice(2, 6)}`,
  condition,
  action,
  ...extra,
});

export const MSX2_ENEMY_BEHAVIOR_PRESETS: Msx2EnemyBehaviorPreset[] = [
  {
    key: 'walker',
    label: 'Walker that looks up and jumps',
    summary: 'Walks while it has floor, turns at ledges and walls, and every few seconds checks for a ceiling overhead — jumping only if one is there.',
    build: () => ({
      target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 2,
      states: [
        {
          id: 'state_walk', name: 'Walk',
          rules: [
            rule('NO_FLOOR_AHEAD', 'TURN_AND_WALK'),
            rule('WALL_AHEAD', 'TURN_AND_WALK'),
            // The timer gate is not decoration. Testing the ceiling every tick
            // makes the enemy pogo continuously under any low roof: it lands,
            // the ceiling is still there, it jumps again. Measured on hardware:
            // 48 jumps crossing three columns. A rule fires on a CONDITION, so
            // "every few seconds" has to be a condition too.
            rule('TIMER_ELAPSED', 'IDLE', { conditionArg: 90, nextState: 1 }),
            rule('ALWAYS', 'WALK'),
          ],
        },
        {
          // Entering Walk resets its clock, so this state IS the "every few
          // seconds" beat, and it costs one tick of standing still: the tell.
          id: 'state_look', name: 'Look up',
          rules: [
            rule('SOLID_ABOVE', 'JUMP', { conditionArg: 3, actionArg: 4, nextState: 2 }),
            rule('ALWAYS', 'WALK', { nextState: 0 }),
          ],
        },
        {
          id: 'state_jump', name: 'Jump',
          rules: [
            rule('ON_GROUND', 'WALK', { nextState: 0 }),
            rule('ALWAYS', 'FALL'),
          ],
        },
      ],
    }),
  },
  {
    key: 'chaser',
    label: 'Chaser',
    summary: 'Patrols until the player comes close, then turns to face them and charges at double speed.',
    build: () => ({
      target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 2,
      states: [
        {
          id: 'state_patrol', name: 'Patrol',
          rules: [
            // Sight first: a chaser that checks its ledge before its prey feels blind.
            rule('PLAYER_NEAR_X', 'FACE_PLAYER', { conditionArg: 64, nextState: 1 }),
            rule('NO_FLOOR_AHEAD', 'TURN_AND_WALK'),
            rule('WALL_AHEAD', 'TURN_AND_WALK'),
            rule('ALWAYS', 'WALK'),
          ],
        },
        {
          // One action runs per tick, so speeding up needs its own tick. This
          // state IS that tick, and it doubles as the enemy's tell.
          id: 'state_lunge', name: 'Lunge',
          rules: [rule('ALWAYS', 'SET_SPEED', { actionArg: 2, nextState: 2 })],
        },
        {
          id: 'state_charge', name: 'Charge',
          rules: [
            // CHASE, not WALK: a charger that keeps running the way it was
            // pointed sails straight past a player who steps around it.
            // Losing sight ends the charge; the speed reset lives on the way out.
            rule('PLAYER_NEAR_X', 'CHASE', { conditionArg: 96 }),
            rule('ALWAYS', 'SET_SPEED', { actionArg: 1, nextState: 0 }),
          ],
        },
      ],
    }),
  },
  {
    key: 'guard',
    label: 'Guard that backs off',
    summary: 'Holds its post, faces the player, and retreats while still watching when they get too close.',
    build: () => ({
      target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 3,
      states: [
        {
          id: 'state_watch', name: 'Watch',
          rules: [
            rule('PLAYER_NEAR_X', 'WALK_BACK', { conditionArg: 32 }),
            rule('PLAYER_NEAR_X', 'FACE_PLAYER', { conditionArg: 96 }),
            rule('ALWAYS', 'IDLE'),
          ],
        },
      ],
    }),
  },
  {
    key: 'floater',
    label: 'Floater',
    summary: 'Drifts up and down between its authored Y bounds, ignoring gravity, and turns at walls.',
    build: () => ({
      // The one preset that opts out of automatic gravity. Everything else here
      // is a ground creature and falls when the floor runs out.
      target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 3, gravity: false,
      states: [
        {
          id: 'state_up', name: 'Rise',
          rules: [
            rule('AT_MIN_Y', 'DESCEND', { nextState: 1 }),
            rule('WALL_AHEAD', 'TURN'),
            rule('ALWAYS', 'RISE'),
          ],
        },
        {
          id: 'state_down', name: 'Sink',
          rules: [
            rule('AT_MAX_Y', 'RISE', { nextState: 0 }),
            rule('ON_GROUND', 'RISE', { nextState: 0 }),
            rule('WALL_AHEAD', 'TURN'),
            rule('ALWAYS', 'DESCEND'),
          ],
        },
      ],
    }),
  },
  {
    key: 'hopper',
    label: 'Hopper',
    summary: 'Waits on the ground, then hops forward in an arc.',
    build: () => ({
      target: 'MSX2', initialState: 0, speedPxPerTick: 2, logicIntervalFrames: 2,
      states: [
        {
          id: 'state_crouch', name: 'Crouch',
          rules: [
            rule('TIMER_ELAPSED', 'JUMP', { conditionArg: 24, actionArg: 5, nextState: 1 }),
            rule('ALWAYS', 'IDLE'),
          ],
        },
        {
          // A diagonal hop used to need TWO air states taking turns, because the
          // interpreter runs exactly one action per tick and the fall had to be
          // one of them. Automatic gravity moves the vertical axis off the rule
          // list entirely, so the air state now does nothing but keep going
          // forward and the arc comes out of the engine.
          id: 'state_hop', name: 'Hop',
          rules: [
            rule('ON_GROUND', 'IDLE', { nextState: 0 }),
            rule('WALL_AHEAD', 'TURN'),
            rule('ALWAYS', 'WALK'),
          ],
        },
      ],
    }),
  },
  {
    key: 'faller',
    label: 'Walks off ledges',
    summary: 'Never turns at a ledge: walks straight off and drops to whatever is below. Only walls turn it.',
    build: () => ({
      target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 2,
      states: [
        {
          // The whole preset is the ABSENCE of the ledge rule. Walker turns on
          // NO_FLOOR_AHEAD; this one simply does not ask, so it steps into the
          // gap and the fall rule takes over on the next tick.
          id: 'state_walk', name: 'Walk',
          rules: [
            rule('NOT_ON_GROUND', 'FALL'),
            rule('WALL_AHEAD', 'TURN_AND_WALK'),
            rule('ALWAYS', 'WALK'),
          ],
        },
      ],
    }),
  },
  {
    key: 'bouncer',
    label: 'Turns on contact',
    summary: 'Patrols, and turns away when it runs into another enemy as well as at walls and ledges.',
    build: () => ({
      target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 2,
      states: [
        {
          id: 'state_walk', name: 'Walk',
          rules: [
            // Both enemies see each other on the same tick and both turn, which
            // is what makes a line of them spread out instead of stacking up.
            rule('ENEMY_AHEAD', 'TURN_AND_WALK', { conditionArg: 18 }),
            rule('NO_FLOOR_AHEAD', 'TURN_AND_WALK'),
            rule('WALL_AHEAD', 'TURN_AND_WALK'),
            rule('ALWAYS', 'WALK'),
          ],
        },
      ],
    }),
  },
  {
    key: 'sentry_shooter',
    label: 'Shoots when lined up',
    summary: 'Patrols, and when the player lines up on its own row within a margin, stops, shoots, and waits before shooting again.',
    build: () => ({
      target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 2,
      states: [
        {
          id: 'state_patrol', name: 'Patrol',
          rules: [
            // "Same horizontal line, give or take N" IS PLAYER_NEAR_Y: the
            // vertical distance is what has to be small for a horizontal shot
            // to connect. Facing the player first means the shot goes the right
            // way, since the bullet always travels the way the enemy looks.
            rule('PLAYER_NEAR_Y', 'FACE_PLAYER', { conditionArg: 12, nextState: 1 }),
            rule('NO_FLOOR_AHEAD', 'TURN_AND_WALK'),
            rule('WALL_AHEAD', 'TURN_AND_WALK'),
            rule('ALWAYS', 'WALK'),
          ],
        },
        {
          id: 'state_shoot', name: 'Shoot',
          rules: [
            // Lost the line while turning: back to the patrol without firing.
            rule('PLAYER_NEAR_Y', 'FIRE', { conditionArg: 12, actionArg: 0, nextState: 2 }),
            rule('ALWAYS', 'WALK', { nextState: 0 }),
          ],
        },
        {
          // FIRE has no cooldown byte, so the cadence lives here, where an
          // author can see it and change it. Without this state the enemy would
          // pull the trigger on every logic tick and keep the two-slot pool
          // permanently full.
          id: 'state_reload', name: 'Reload',
          rules: [
            rule('TIMER_ELAPSED', 'IDLE', { conditionArg: 30, nextState: 0 }),
            rule('ALWAYS', 'IDLE'),
          ],
        },
      ],
    }),
  },
  {
    key: 'platform_dropper',
    label: 'Drops down through platforms',
    summary: 'Patrols, and every so often, if it happens to be standing on a one-way platform, it may decide to step down to the one below.',
    build: () => ({
      target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 2,
      states: [
        {
          id: 'state_walk', name: 'Walk',
          rules: [
            rule('NO_FLOOR_AHEAD', 'TURN_AND_WALK'),
            rule('WALL_AHEAD', 'TURN_AND_WALK'),
            // The counter. One rule tests one condition, so "every so often AND
            // maybe" is spelled as a chain of states rather than an expression.
            rule('TIMER_ELAPSED', 'IDLE', { conditionArg: 120, nextState: 1 }),
            rule('ALWAYS', 'WALK'),
          ],
        },
        {
          // Standing on ordinary ground? Then there is nothing to drop through
          // and the whole idea is dropped with it, back to walking.
          id: 'state_look_down', name: 'Look down',
          rules: [
            rule('ON_PLATFORM_TILE', 'IDLE', { nextState: 2 }),
            rule('ALWAYS', 'WALK', { nextState: 0 }),
          ],
        },
        {
          // The random. Roughly one in three; the rest of the time it just
          // carries on, which is what stops the enemy from draining downwards
          // every single time it crosses a platform.
          id: 'state_roll', name: 'Decide',
          rules: [
            rule('RANDOM', 'DROP_THROUGH', { conditionArg: 96, nextState: 3 }),
            rule('ALWAYS', 'WALK', { nextState: 0 }),
          ],
        },
        {
          id: 'state_dropping', name: 'Dropping',
          rules: [
            rule('ON_GROUND', 'WALK', { nextState: 0 }),
            rule('ALWAYS', 'FALL'),
          ],
        },
      ],
    }),
  },
  {
    key: 'shielded',
    label: 'Shields when shot',
    summary: 'Patrols until the player hits it, then raises a guard that eats the next shots before carrying on.',
    build: () => ({
      target: 'MSX2', initialState: 0, speedPxPerTick: 1, logicIntervalFrames: 2,
      states: [
        {
          id: 'state_patrol', name: 'Patrol',
          rules: [
            // A short window, not "this exact tick": logic runs every 2 frames,
            // so a rule that only fired on the frame of impact would miss most
            // hits outright.
            rule('WAS_HIT', 'SHIELD', { conditionArg: 8, actionArg: 48, nextState: 1 }),
            rule('NO_FLOOR_AHEAD', 'TURN_AND_WALK'),
            rule('WALL_AHEAD', 'TURN_AND_WALK'),
            rule('ALWAYS', 'WALK'),
          ],
        },
        {
          id: 'state_guard', name: 'Guard',
          rules: [
            // SHIELD_ACTIVE is what stops this state from raising the shield
            // again every tick, which would make it permanent.
            rule('SHIELD_ACTIVE', 'SET_ANIM', { actionArg: 1 }),
            rule('ALWAYS', 'SET_ANIM', { actionArg: 0, nextState: 0 }),
          ],
        },
      ],
    }),
  },
];

/** A blank behaviour with the defaults the runtime expects: Jordi's walker. */
export function createMsx2EnemyBehavior(
  id: string,
  name: string,
  presetKey = 'walker',
): Msx2EnemyBehaviorAsset {
  const preset = MSX2_ENEMY_BEHAVIOR_PRESETS.find(entry => entry.key === presetKey)
    || MSX2_ENEMY_BEHAVIOR_PRESETS[0];
  return { id, name, ...preset.build() };
}

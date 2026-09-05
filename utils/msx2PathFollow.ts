import { MSX2_ENEMY_ACT, Msx2EnemyBehaviorActionName } from './msx2EnemyBehavior';

/**
 * PATH FOLLOW: an enemy behaviour authored as numbered nodes instead of rules.
 *
 * A node is NOT a point the enemy walks to. It is a TRIGGER on a room cell:
 * the body keeps moving the way it already moves, and when it enters a node's
 * cell the node tells it what to do next — go right, jump, fall, climb. That is
 * the Pac-Man model, not the boss-path model, and the difference is what makes
 * it cheap: no interpolation, no fixed point, no per-tick stream to read.
 *
 * WHY THE RECORD IS FIXED-SIZE
 *   The obvious saving is a variable record: 4 bytes for an ordinary node and 6
 *   for one that branches. It does not survive contact with the runtime. Nodes
 *   reference each other BY INDEX, so a variable record needs an offset table to
 *   find node N — one or two bytes per node, which is exactly what the variable
 *   layout just saved. Fixed 5-byte records make `nodes + index * 5` the whole
 *   addressing story, and that multiply is three adds on a Z80.
 *
 * BYTE LAYOUT, 5 per node
 *   0  cell     row * 16 + column, 0..191. The room grid is 16x12.
 *   1  action   opcode in bits 0-4, branch policy in bits 5-7
 *   2  arg      the action's argument, 0 when it takes none
 *   3  next     node index, or #FF for "stop here"
 *   4  nextAlt  node index for the second exit, or #FF when the node has one
 *
 * Packing the policy into the spare bits of the action byte is not a trick for
 * its own sake: opcodes need five bits and policies need three, and keeping them
 * in one byte is what holds the record at five instead of six.
 *
 * COORDINATES ARE ABSOLUTE CELLS
 *   A reusable asset with absolute coordinates only fits rooms whose geometry
 *   allows it. That is deliberate: rather than guarantee reuse by making every
 *   node relative to the spawn, the editor's Onion overlay VERIFIES it, room by
 *   room, and says exactly which node lands in a wall. Verified reuse beats
 *   guaranteed reuse when the author can see the answer.
 */

/** Bytes per node record. Fixed, so node N lives at nodes + N * 5. */
export const MSX2_PATH_NODE_BYTES = 5;

/**
 * Node indices share a byte with nothing, but #FF is reserved for "none", and
 * the editor stays well inside a limit an author would ever reach by hand.
 */
export const MSX2_PATH_MAX_NODES = 32;

/** Index value meaning "no such node": end of route, or no second exit. */
export const MSX2_PATH_NODE_NONE = 0xff;

/** Room grid the cell index addresses. */
export const MSX2_PATH_GRID_COLS = 16;
export const MSX2_PATH_GRID_ROWS = 12;

/**
 * Who picks the exit when a node has two.
 *
 * Chosen by the author, per node, from the ones that node can actually exercise
 * — a node with a single exit offers no choice at all. `random` is on the list
 * because Jordi put it there: an author who selects it has decided, which is the
 * opposite of a behaviour that forks at random on its own.
 */
export const MSX2_PATH_POLICY = {
  /** Always the first exit. The default, and the only one for a single-exit node. */
  fixed: 0,
  /** Take the exits in turn. One bit of state per branching node, per body. */
  alternate: 1,
  /** Whichever exit is on the player's side. */
  playerSide: 2,
  /** A game flag decides. */
  flag: 3,
  /** The shared per-frame PRNG decides. */
  random: 4,
} as const;

export type Msx2PathPolicyName = keyof typeof MSX2_PATH_POLICY;

/** Policies worth offering for a node with two exits, in menu order. */
export const MSX2_PATH_BRANCH_POLICIES: Msx2PathPolicyName[] =
  ['fixed', 'alternate', 'playerSide', 'flag', 'random'];

export interface Msx2PathNode {
  /** Stable identity. The number the author SEES is derived from the route. */
  id: string;
  /** Column 0..15 and row 0..11 of the room grid. */
  cellX: number;
  cellY: number;
  /** What the enemy does on entering this cell. */
  action: Msx2EnemyBehaviorActionName;
  arg?: number;
  /** Node ids. `next` absent means the route stops here. */
  next?: string;
  nextAlt?: string;
  /** Only meaningful with nextAlt set; ignored otherwise. */
  policy?: Msx2PathPolicyName;
}

export interface Msx2PathFollowProgram {
  /**
   * Room the author drew the path against, so the Onion opens where they left
   * it. EDITOR ONLY: it never reaches the ROM, and a path is not bound to it.
   */
  screenId?: string;
  /**
   * Palette the Onion previews with, overriding the automatic choice.
   * EDITOR ONLY, like screenId: it never reaches the ROM. A route is reusable
   * across worlds, and the point of picking one by hand is to see the same
   * route under the colours of a world it does not belong to.
   */
  palettePreviewId?: string;
  /** Node the enemy starts on. Defaults to the first. */
  startNodeId?: string;
  nodes: Msx2PathNode[];
}

export interface Msx2PathFollowBakeResult {
  bytes: number[];
  /** Node ids in emitted order, so the editor can map a byte back to a node. */
  order: string[];
  /** Problems that make the route unsafe to run. Bytes still come back. */
  errors: string[];
  warnings: string[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));

/** Sequence label the author sees. Derived, never stored: inserting a node in
 *  the middle renumbers the labels and breaks no edge. */
export function pathNodeLabels(program: Msx2PathFollowProgram): Map<string, string> {
  const labels = new Map<string, string>();
  const byId = new Map(program.nodes.map(node => [node.id, node]));
  const startId = program.startNodeId || program.nodes[0]?.id;
  if (!startId) return labels;

  // Walk the route rather than the array: the label is the position along the
  // path, which is what "nodo1 -> nodo2 -> nodo3" means to an author.
  // The label travels WITH the queue entry. Assigning it on the way out and
  // recomputing it on the way in is the same bug twice: the fork sets "4a"/"4b"
  // for its exits, and then dequeuing them overwrites both with fresh ordinals.
  let ordinal = 1;
  const queue: Array<{ id: string; label: string }> = [{ id: startId, label: String(ordinal) }];
  const seen = new Set<string>();
  while (queue.length) {
    const { id, label } = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    labels.set(id, label);
    const node = byId.get(id);
    if (!node) continue;
    ordinal += 1;
    // A fork gives its two exits the SAME ordinal with different suffixes, which
    // is exactly the "nodo4a / nodo4b" the brief asked for.
    if (node.next && node.nextAlt) {
      queue.push({ id: node.next, label: `${ordinal}a` }, { id: node.nextAlt, label: `${ordinal}b` });
    } else if (node.next) {
      queue.push({ id: node.next, label: String(ordinal) });
    }
  }
  // Nodes no route reaches still need a label, or the editor shows a blank chip.
  for (const node of program.nodes) {
    if (!labels.has(node.id)) labels.set(node.id, '-');
  }
  return labels;
}

/**
 * Bakes a route into the byte table the Z80 walker indexes.
 *
 * Output is `db nodeCount` followed by nodeCount 5-byte records. The count is
 * one byte the walker never strictly needs — it follows indices, not a length —
 * but it is what lets a validator, a probe or a hex dump tell a truncated table
 * from a valid short one.
 */
export function bakePathFollow(program: Msx2PathFollowProgram): Msx2PathFollowBakeResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodes = (program.nodes || []).slice(0, MSX2_PATH_MAX_NODES);

  if ((program.nodes || []).length > MSX2_PATH_MAX_NODES) {
    errors.push(`A route may hold ${MSX2_PATH_MAX_NODES} nodes; the extra ones were dropped.`);
  }
  if (!nodes.length) {
    return { bytes: [0], order: [], errors: ['A route needs at least one node.'], warnings };
  }

  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const startId = program.startNodeId || nodes[0].id;
  if (!indexById.has(startId)) {
    warnings.push('The start node does not exist; the first node is used instead.');
  }

  const resolve = (id: string | undefined, label: string): number => {
    if (!id) return MSX2_PATH_NODE_NONE;
    const index = indexById.get(id);
    if (index === undefined) {
      errors.push(`${label} points at a node that is not in the route.`);
      return MSX2_PATH_NODE_NONE;
    }
    return index;
  };

  const bytes: number[] = [nodes.length & 0xff];
  const order: string[] = [];

  for (const node of nodes) {
    order.push(node.id);
    const cellX = clamp(node.cellX, 0, MSX2_PATH_GRID_COLS - 1);
    const cellY = clamp(node.cellY, 0, MSX2_PATH_GRID_ROWS - 1);
    const opcode = MSX2_ENEMY_ACT[node.action];
    if (opcode === undefined) {
      errors.push(`Node "${node.id}" uses an action the runtime does not have.`);
    }
    const next = resolve(node.next, `Node "${node.id}"`);
    const nextAlt = resolve(node.nextAlt, `Node "${node.id}" second exit`);

    // A policy without a second exit has nothing to decide; storing it anyway
    // would let the editor show a choice that the runtime silently ignores.
    const policyName: Msx2PathPolicyName =
      nextAlt === MSX2_PATH_NODE_NONE ? 'fixed' : (node.policy || 'fixed');
    if (nextAlt === MSX2_PATH_NODE_NONE && node.policy && node.policy !== 'fixed') {
      warnings.push(`Node "${node.id}" has a branch policy but only one exit; it is ignored.`);
    }
    // The runtime has no flag source yet, so this policy walks the first exit.
    // Saying so is the whole point: an option that silently does nothing is
    // worse than one that is missing, because the author trusts it.
    if (policyName === 'flag') {
      warnings.push(
        `Node "${node.id}" branches on a game flag, which the runtime cannot read yet: `
        + 'it will always take the first exit until a flag source exists.',
      );
    }
    const policy = MSX2_PATH_POLICY[policyName] ?? 0;

    bytes.push(
      (cellY * MSX2_PATH_GRID_COLS + cellX) & 0xff,
      ((opcode ?? MSX2_ENEMY_ACT.IDLE) & 0x1f) | ((policy & 0x07) << 5),
      clamp(node.arg ?? 0, 0, 255),
      next & 0xff,
      nextAlt & 0xff,
    );
  }

  // WHAT THIS USED TO SAY, AND WHY IT WAS WRONG: it warned when no node ended
  // the route and no node pointed back at the START. That is not the same as
  // "nothing loops" — a circuit that closes on any other node is a perfectly
  // ordinary route, and it got the warning anyway. Worse, the condition it
  // claimed to detect cannot happen: in a finite graph where every reachable
  // node has a successor, walking forward must revisit a node, so there is
  // always a cycle. A warning that fires on good routes and never on the case
  // it names teaches the author to ignore warnings.
  //
  // The real editing accident is a node the route can never reach: the author
  // placed it, wired nothing to it, and believes it runs.
  const reachable = new Set<string>();
  const pending = [startId];
  while (pending.length) {
    const id = pending.pop()!;
    if (!id || reachable.has(id)) continue;
    const node = nodes.find(item => item.id === id);
    if (!node) continue;
    reachable.add(id);
    if (node.next) pending.push(node.next);
    if (node.nextAlt) pending.push(node.nextAlt);
  }
  const orphans = nodes.filter(node => !reachable.has(node.id));
  if (orphans.length) {
    warnings.push(
      `${orphans.length === 1 ? 'One node is' : `${orphans.length} nodes are`} not reachable from the start `
      + `and will never fire: ${orphans.map(node => `"${node.id}"`).join(', ')}.`,
    );
  }

  return { bytes, order, errors, warnings };
}

/** Bytes a route costs in ROM, without baking it. For the editor's budget chip. */
export function pathFollowRomBytes(program: Msx2PathFollowProgram): number {
  const count = Math.min((program.nodes || []).length, MSX2_PATH_MAX_NODES);
  return 1 + count * MSX2_PATH_NODE_BYTES;
}

export function createMsx2PathFollow(): Msx2PathFollowProgram {
  return { nodes: [] };
}

/**
 * Which palette entry a node was made from.
 *
 * THE BUG THIS EXISTS FOR: the editor looked this up with
 * `ACTIONS.find(item => item.action === node.action)`. Two palette entries are
 * the SAME opcode told apart by their argument — "go right" is SET_DIR 1 and
 * "go left" is SET_DIR 0 — so `find` always returned the first one. Every
 * left-facing node drew the right-facing arrow and its tooltip said "Go right".
 * The stored byte was correct all along; only the editor was lying, which is
 * the worst shape for a bug like this: the author fixes what is not broken.
 *
 * The rule is deliberately not "always compare the argument". When one entry
 * owns an opcode, the argument is a VALUE the author may tune — a jump height —
 * and a jump with a hand-edited height must still show the jump icon. The
 * argument only becomes part of the identity when it is the only thing telling
 * two entries apart.
 */
export function paletteEntryFor<T extends { action: string; arg?: number }>(
  entries: readonly T[],
  node: { action: string; arg?: number } | null | undefined,
): T | undefined {
  if (!node) return undefined;
  const sameAction = entries.filter(entry => entry.action === node.action);
  if (sameAction.length <= 1) return sameAction[0];
  return sameAction.find(entry => entry.arg === node.arg) ?? sameAction[0];
}

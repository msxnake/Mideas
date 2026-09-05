import React, { useMemo, useState } from 'react';
import {
  MSX2_PATH_BRANCH_POLICIES,
  MSX2_PATH_GRID_COLS,
  MSX2_PATH_GRID_ROWS,
  MSX2_PATH_MAX_NODES,
  Msx2PathFollowProgram,
  Msx2PathNode,
  Msx2PathPolicyName,
  bakePathFollow,
  pathFollowRomBytes,
  paletteEntryFor,
  pathNodeLabels,
} from '../../utils/msx2PathFollow';
import { MSX2_ENEMY_ACT_INFO, Msx2EnemyBehaviorActionName } from '../../utils/msx2EnemyBehavior';
import {
  ActChaseIcon, ActDescendIcon, ActDropThroughIcon, ActFaceLeftIcon, ActFacePlayerIcon,
  ActFaceRightIcon, ActFallIcon, ActSetSpeedIcon,
  ActFireIcon, ActIdleIcon, ActJumpIcon, ActRiseIcon, ActShieldIcon, ActTurnIcon,
  ActWalkIcon, PathBranchIcon, PathNodeIcon, PolicyAlternateIcon, PolicyFixedIcon,
  PolicyFlagIcon, PolicyPlayerSideIcon, PolicyRandomIcon, TrashIcon,
} from '../icons/MsxIcons';

/**
 * PATH FOLLOW editor: place numbered nodes on a room grid and say what the
 * enemy does when it steps on each one.
 *
 * The brief was "iconos identificables, menos texto, facilidad de elegir
 * opciones", so the icon IS the control here: an action is a row of buttons you
 * click, not a dropdown you open and read. Words survive only in tooltips and in
 * the one place they carry information a glyph cannot — the byte budget.
 *
 * The grid is the room, 16x12 cells. Clicking an empty cell adds a node and
 * chains it to the previous one; clicking a node selects it. That is the whole
 * interaction: no modal, no form, no "add node" button to hunt for.
 */

interface Msx2PathFollowEditorProps {
  program: Msx2PathFollowProgram;
  onUpdate: (program: Msx2PathFollowProgram) => void;
  /** Optional room backdrop for the Onion overlay: 192 collision cells. */
  onionCells?: number[];
  /** The room's actual art, one data URL per cell (192), undefined where empty. */
  onionTiles?: (string | undefined)[];
  onionName?: string;
}

type ActionChoice = { action: Msx2EnemyBehaviorActionName; arg?: number; title: string; Icon: React.FC<{ className?: string }> };

/**
 * The palette: the verbs a ROUTE needs, which is not the same list as the verbs
 * a rule program needs.
 *
 * WHAT IS DELIBERATELY MISSING, and why, because "why is X not here" is the
 * first question the next reader asks. A node fires ONCE, when the body enters
 * its cell, and then the route moves on — so an opcode is only useful here if
 * one shot of it changes something that LASTS.
 *
 *   SET_ANIM      Sets the sprite frame — and the enemy loop's own animation
 *                 ticker (.enemy_anim in msx2BitmapEnemyGenerator) advances
 *                 that same byte every animDelay frames, on every slot, right
 *                 after the scripted step runs. A node would hold the frame for
 *                 a few frames and lose it. In rule mode a state re-asserts it
 *                 every tick, which is why it works there and not here. Adding
 *                 it would need a "hold this frame" latch in the runtime.
 *   TURN_AND_WALK Its whole point is saving a tick inside a rule loop. At a
 *                 one-shot node it is Turn around plus one step, and the body
 *                 steps by itself on the next tick anyway.
 *   WALK_BACK     One tick of backward movement, then the body resumes walking
 *                 forward. A nudge, not a behaviour.
 *   RESET_TIMER   Restarts the STATE clock. A route has no states.
 */
export const ACTIONS: ActionChoice[] = [
  { action: 'SET_DIR', arg: 1, title: 'Go right', Icon: ActFaceRightIcon },
  { action: 'SET_DIR', arg: 0, title: 'Go left', Icon: ActFaceLeftIcon },
  { action: 'WALK', title: 'Walk on', Icon: ActWalkIcon },
  { action: 'JUMP', arg: 4, title: 'Jump', Icon: ActJumpIcon },
  { action: 'FALL', title: 'Fall', Icon: ActFallIcon },
  { action: 'RISE', title: 'Climb up', Icon: ActRiseIcon },
  { action: 'DESCEND', title: 'Climb down', Icon: ActDescendIcon },
  { action: 'DROP_THROUGH', title: 'Drop through the platform', Icon: ActDropThroughIcon },
  { action: 'TURN', title: 'Turn around', Icon: ActTurnIcon },
  { action: 'FACE_PLAYER', title: 'Look at the player', Icon: ActFacePlayerIcon },
  { action: 'CHASE', title: 'Chase the player', Icon: ActChaseIcon },
  { action: 'SET_SPEED', arg: 2, title: 'Change speed', Icon: ActSetSpeedIcon },
  { action: 'FIRE', title: 'Fire', Icon: ActFireIcon },
  { action: 'SHIELD', arg: 60, title: 'Raise shield', Icon: ActShieldIcon },
  { action: 'IDLE', title: 'Wait', Icon: ActIdleIcon },
];

const POLICY_ICONS: Record<Msx2PathPolicyName, { Icon: React.FC<{ className?: string }>; title: string }> = {
  fixed: { Icon: PolicyFixedIcon, title: 'Always the first exit' },
  alternate: { Icon: PolicyAlternateIcon, title: 'Take the exits in turn' },
  playerSide: { Icon: PolicyPlayerSideIcon, title: "Whichever exit is on the player's side" },
  flag: { Icon: PolicyFlagIcon, title: 'A game flag decides' },
  random: { Icon: PolicyRandomIcon, title: 'The shared PRNG decides' },
};

const uid = () => `node_${Math.random().toString(36).slice(2, 8)}`;

const iconBtn = (active: boolean) =>
  `p-1.5 rounded border transition-colors ${active
    ? 'bg-msx-accent text-msx-bgcolor border-msx-accent'
    : 'border-msx-border text-msx-textsecondary hover:text-msx-textprimary hover:bg-msx-hover'}`;

export const Msx2PathFollowEditor: React.FC<Msx2PathFollowEditorProps> = ({
  program, onUpdate, onionCells, onionTiles, onionName,
}) => {
  const nodes = program.nodes || [];
  const [selectedId, setSelectedId] = useState<string | null>(nodes[0]?.id ?? null);
  const [linking, setLinking] = useState<'next' | 'nextAlt' | null>(null);

  const labels = useMemo(() => pathNodeLabels(program), [program]);
  const baked = useMemo(() => bakePathFollow(program), [program]);
  const byCell = useMemo(() => {
    const map = new Map<number, Msx2PathNode>();
    for (const node of nodes) map.set(node.cellY * MSX2_PATH_GRID_COLS + node.cellX, node);
    return map;
  }, [nodes]);

  const selected = nodes.find(node => node.id === selectedId) || null;

  /**
   * The argument spec to expose for the selected node, or nothing.
   *
   * Two conditions, and both matter. The opcode must TAKE an argument, which
   * only MSX2_ENEMY_ACT_INFO knows. And exactly one palette entry may own that
   * opcode: where two share it the argument IS the identity, and a slider would
   * turn "go left" into "go right" behind the author's back.
   */
  const argSpec = useMemo(() => {
    if (!selected) return undefined;
    const owners = ACTIONS.filter(entry => entry.action === selected.action);
    if (owners.length !== 1) return undefined;
    return MSX2_ENEMY_ACT_INFO[selected.action]?.arg;
  }, [selected]);

  const patch = (next: Partial<Msx2PathFollowProgram>) => onUpdate({ ...program, ...next });
  const patchNode = (id: string, changes: Partial<Msx2PathNode>) =>
    patch({ nodes: nodes.map(node => (node.id === id ? { ...node, ...changes } : node)) });

  const clickCell = (cellX: number, cellY: number) => {
    const existing = byCell.get(cellY * MSX2_PATH_GRID_COLS + cellX);
    if (existing) {
      // Linking mode turns the next click into "this is where that exit goes",
      // which is how a fork gets drawn without a second panel.
      if (linking && selected && existing.id !== selected.id) {
        patchNode(selected.id, { [linking]: existing.id } as Partial<Msx2PathNode>);
        setLinking(null);
        return;
      }
      setSelectedId(existing.id);
      return;
    }
    if (nodes.length >= MSX2_PATH_MAX_NODES) return;
    const node: Msx2PathNode = { id: uid(), cellX, cellY, action: 'WALK' };
    // Chain it to the selected node, so drawing a route is just clicking along it.
    const chained = selected && !selected.next
      ? nodes.map(item => (item.id === selected.id ? { ...item, next: node.id } : item))
      : nodes;
    patch({ nodes: [...chained, node], startNodeId: program.startNodeId || node.id });
    setSelectedId(node.id);
  };

  const removeSelected = () => {
    if (!selected) return;
    patch({
      nodes: nodes.filter(node => node.id !== selected.id).map(node => ({
        ...node,
        next: node.next === selected.id ? undefined : node.next,
        nextAlt: node.nextAlt === selected.id ? undefined : node.nextAlt,
      })),
      startNodeId: program.startNodeId === selected.id ? undefined : program.startNodeId,
    });
    setSelectedId(null);
  };

  /**
   * The collision layer the AUTHOR paints is truthy/falsy, not the runtime's
   * 0x10 SOLID bit: a new screen writes 1 for its floor row, and the screen
   * editor itself renders `collision` as a plain boolean. Testing 0x10 here
   * would have made the Onion silently never flag anything — the exact failure
   * that looks like "the feature works" until someone trusts it.
   */
  const isSolid = (cellIndex: number) => Boolean(onionCells && (onionCells[cellIndex] ?? 0));

  /**
   * The cell's own background. When the room art is drawn it goes here as a
   * background-IMAGE, so the node colour cannot live here too: a background
   * colour paints BEHIND the image and an opaque tile would swallow it whole.
   * The node's wash is a separate layer on top; see nodeWash below.
   */
  const cellClass = (cellIndex: number, node: Msx2PathNode | undefined) => {
    const art = onionTiles?.[cellIndex];
    const solid = isSolid(cellIndex);
    const base = art ? 'bg-msx-bgcolor' : solid ? 'bg-msx-border/70' : 'bg-msx-bgcolor';
    if (!node) return `${base} border-msx-border/40`;
    if (node.id === selectedId) return `${art ? base : 'bg-msx-accent'} border-msx-accent`;
    return node.nextAlt
      ? `${art ? base : 'bg-cyan-700'} border-cyan-400`
      : `${art ? base : 'bg-lime-700'} border-lime-400`;
  };

  /**
   * The node's colour as a translucent layer ABOVE the room art, so the author
   * sees the node and the scenery under it at once. That is the whole point of
   * an Onion: without it the node hides the very cell it is being judged against.
   */
  const nodeWash = (node: Msx2PathNode) =>
    node.id === selectedId ? 'bg-msx-accent/60'
      : node.nextAlt ? 'bg-cyan-600/60' : 'bg-lime-600/60';

  // A node sitting on a solid cell can never fire: the body cannot stand there.
  // That is the Onion's whole job, and it is worth saying loudly.
  const buriedNodes = useMemo(() => {
    if (!onionCells) return [];
    return nodes.filter(node => isSolid(node.cellY * MSX2_PATH_GRID_COLS + node.cellX));
  }, [nodes, onionCells]);

  return (
    <div className="flex gap-3 p-3 text-msx-textprimary">
      <div>
        {/* ---- the room grid: click to place, click a node to select ---- */}
        <div
          className="grid gap-0.5 p-1 bg-msx-panel border border-msx-border rounded"
          // 2rem = 32px = EXACTLY twice a 16px tile. A non-integer scale with
          // image-rendering: pixelated gives some source pixels two screen pixels
          // and others one, and the room art comes out visibly lumpy.
          style={{ gridTemplateColumns: `repeat(${MSX2_PATH_GRID_COLS}, 2rem)` }}
        >
          {Array.from({ length: MSX2_PATH_GRID_COLS * MSX2_PATH_GRID_ROWS }, (_unused, index) => {
            const cellX = index % MSX2_PATH_GRID_COLS;
            const cellY = Math.floor(index / MSX2_PATH_GRID_COLS);
            const node = byCell.get(index);
            const choice = paletteEntryFor(ACTIONS, node);
            const Icon = choice?.Icon;
            return (
              <button
                key={index}
                onClick={() => clickCell(cellX, cellY)}
                title={node ? `${labels.get(node.id) || ''} ${choice?.title || node.action}` : `${cellX},${cellY}`}
                className={`h-8 w-8 border rounded-sm flex items-center justify-center relative ${cellClass(index, node)}`}
                style={onionTiles?.[index] ? {
                  backgroundImage: `url(${onionTiles[index]})`,
                  backgroundSize: '100% 100%',
                  // 16x16 art blown up to 28px: without this the browser
                  // smooths it and the room stops looking like an MSX room.
                  imageRendering: 'pixelated',
                } : undefined}
              >
                {node && onionTiles?.[index] ? (
                  <span className={`absolute inset-0 rounded-sm ${nodeWash(node)}`} />
                ) : null}
                {node && Icon ? <Icon className="w-3.5 h-3.5 relative" /> : null}
                {node ? (
                  <span className="absolute -top-1 -left-1 text-[9px] leading-none px-0.5 rounded bg-msx-bgcolor border border-msx-border">
                    {labels.get(node.id)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-msx-textsecondary">
          <span className="flex items-center gap-1"><PathNodeIcon className="w-3 h-3" />{nodes.length}/{MSX2_PATH_MAX_NODES}</span>
          <span>{pathFollowRomBytes(program)} B ROM</span>
          {/* An "Onion: pan1" chip shown while the overlay is drawing NOTHING is
              how this went unnoticed: the label said the feature was on. It now
              says what it actually has. */}
          {onionName ? (
            onionCells || onionTiles
              ? <span className="text-cyan-300">Onion: {onionName}{onionTiles ? '' : ' (solo colisión)'}</span>
              : <span className="text-amber-400">Onion: {onionName} — sin datos de esta pantalla</span>
          ) : null}
        </div>
      </div>

      {/* ---- the node inspector: icons, not dropdowns ---- */}
      <div className="w-64">
        {selected ? (
          <div className="bg-msx-panel border border-msx-border rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1 text-sm">
                <PathNodeIcon className="w-4 h-4" />
                <b>{labels.get(selected.id)}</b>
                <span className="text-msx-textsecondary text-xs">{selected.cellX},{selected.cellY}</span>
              </span>
              <button className={iconBtn(false)} onClick={removeSelected} title="Remove this node">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-1 mb-3">
              {ACTIONS.map(choice => {
                // The SAME lookup the grid uses, so the highlighted button and
                // the icon on the cell cannot disagree. The old test had its own
                // rule and a second bug in it: a SET_DIR node with no argument
                // lit up BOTH direction buttons, because `selected.arg ?? choice.arg`
                // falls back to the choice's own value and then compares equal.
                const active = paletteEntryFor(ACTIONS, selected) === choice;
                return (
                  <button
                    key={`${choice.action}_${choice.arg ?? 'x'}`}
                    className={iconBtn(active)}
                    title={choice.title}
                    onClick={() => patchNode(selected.id, { action: choice.action, arg: choice.arg })}
                  >
                    <choice.Icon />
                  </button>
                );
              })}
            </div>

            {/* ---- the action's argument, when it is a VALUE and not an identity ----
                Jump height, shield ticks, walking speed: the palette seeds a
                sensible one, and until now the author was stuck with it.

                It appears only when ONE palette entry owns the opcode. Where two
                entries share an opcode the argument is what tells them apart —
                "go right" is SET_DIR 1 and "go left" is SET_DIR 0 — so editing
                it would silently turn one button into the other, and the same
                ambiguity that made every left node draw a right arrow would be
                back as a control. Same rule as paletteEntryFor, on purpose.

                The range comes from MSX2_ENEMY_ACT_INFO, not from a number typed
                here: restating it would let the editor offer a value the baker
                clamps, and the author would trust the one on screen. */}
            {argSpec ? (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-msx-textsecondary w-20 shrink-0">{argSpec.unit}</span>
                <input
                  type="range"
                  className="flex-1"
                  min={argSpec.min}
                  max={argSpec.max}
                  value={Math.min(argSpec.max, Math.max(argSpec.min, selected.arg ?? argSpec.min))}
                  onChange={event => patchNode(selected.id, { arg: Number(event.target.value) })}
                  title={MSX2_ENEMY_ACT_INFO[selected.action]?.help}
                />
                <span className="text-xs tabular-nums w-8 text-right">
                  {selected.arg ?? argSpec.min}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-1 mb-1 text-xs text-msx-textsecondary">
              <PathBranchIcon className="w-4 h-4" />
              <span>{selected.nextAlt ? 'two exits' : 'one exit'}</span>
            </div>
            <div className="flex gap-1 mb-2">
              <button
                className={iconBtn(linking === 'next')}
                title="Pick the next node"
                onClick={() => setLinking(linking === 'next' ? null : 'next')}
              >
                <PolicyFixedIcon />
              </button>
              <button
                className={iconBtn(linking === 'nextAlt')}
                title="Pick the second exit"
                onClick={() => setLinking(linking === 'nextAlt' ? null : 'nextAlt')}
              >
                <PathBranchIcon />
              </button>
            </div>

            {/* The policy picker only offers what this node can exercise: with a
                single exit there is nothing to decide, so it is not shown. */}
            {selected.nextAlt ? (
              <div className="flex gap-1">
                {MSX2_PATH_BRANCH_POLICIES.map(name => {
                  const { Icon, title } = POLICY_ICONS[name];
                  return (
                    <button
                      key={name}
                      className={iconBtn((selected.policy || 'fixed') === name)}
                      title={title}
                      onClick={() => patchNode(selected.id, { policy: name })}
                    >
                      <Icon />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-xs text-msx-textsecondary p-2">Click a cell to place a node.</div>
        )}

        {(baked.errors.length || baked.warnings.length || buriedNodes.length) ? (
          <div className="mt-2 text-[11px] space-y-1">
            {baked.errors.map((text, i) => <div key={`e${i}`} className="text-red-400">{text}</div>)}
            {buriedNodes.map(node => (
              <div key={`b${node.id}`} className="text-amber-400">
                Node {labels.get(node.id)} sits in a wall on this screen.
              </div>
            ))}
            {baked.warnings.map((text, i) => <div key={`w${i}`} className="text-amber-300">{text}</div>)}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Msx2PathFollowEditor;

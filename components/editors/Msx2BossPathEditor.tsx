import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Msx2BossPath,
  Msx2BossPathAction,
  Msx2BossPathNode,
  Msx2BossPathSegment,
  Msx2HudAsset,
  Msx2Screen5BitmapRoom,
  PaletteAsset,
  ProjectAsset,
} from '../../types';
import {
  drawScreen5BitmapRoomPreview,
  renderWidgetLayer,
  resolveBitmapRoomPreviewPalette,
} from './Msx2HudEditor';
import { createDefaultScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { BITMAP_BOSS_PATH_LIMITS, PATH_OP_ARG_BYTES, PATH_OP_END, bakeBossPath } from '../../utils/msx2BossPath';

/**
 * MSX2 SCREEN 5 boss path editor.
 *
 * A path is a reusable movement recipe: nodes joined by segments, each node
 * carrying a small script (pause, fire, carry on). It is authored in room
 * pixels but baked as deltas, so the same shape can be dropped on any boss —
 * and later on shoot'em up enemy waves — wherever it spawns.
 *
 * The preview shows the BAKED steps, not the ideal line: that is exactly what
 * the MSX will walk, one dot per body update.
 *
 * See docs/msx/BOSS_SYSTEM_DESIGN.md §Fase G.
 */

interface Msx2BossPathEditorProps {
  path: Msx2BossPath;
  onUpdate: (path: Msx2BossPath) => void;
  allAssets: ProjectAsset[];
  setStatusBarMessage?: (message: string) => void;
}

/**
 * SCREEN 5 geometry, kept in sync with BITMAP_ROOM_HUD_HEIGHT in
 * msx2Screen5BitmapRoomGenerator.ts: a 20-row HUD band on top of a 192-row
 * playable area. Nodes are authored in game-area pixels, so the overlay is
 * offset by the HUD band instead of shifting the coordinates.
 */
const ROOM_W = 256;
const HUD_H = 20;
const ROOM_H = 192;
const FULL_SCREEN_H = HUD_H + ROOM_H;
const SCALE = 2;

const card = 'bg-msx-panel border border-msx-border rounded p-3 mb-3';
const label = 'block text-xs text-msx-textsecondary mb-1';
const input = 'w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary';
const btn = 'px-2 py-1 text-xs rounded border border-msx-border hover:bg-msx-hover';

export const Msx2BossPathEditor: React.FC<Msx2BossPathEditorProps> = ({ path, onUpdate, allAssets, setStatusBarMessage }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const onionRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  // Onion skin: a real screen behind the route, so a path can be drawn against
  // the walls and platforms the boss actually fights in.
  const [onionOn, setOnionOn] = useState(false);
  const [onionRoomId, setOnionRoomId] = useState('');
  const nodes = path.nodes || [];

  const rooms = useMemo(() => allAssets.filter(a => a.type === 'msx2bitmaproom'), [allAssets]);
  const hudAsset = useMemo(() => allAssets.find(a => a.type === 'msx2hud'), [allAssets]);
  const shootAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2shoot'), [allAssets]);
  const onionRoom = useMemo(
    () => (rooms.find(a => a.id === onionRoomId) || rooms[0])?.data as Msx2Screen5BitmapRoom | undefined,
    [rooms, onionRoomId],
  );

  useEffect(() => {
    if (!onionRoomId && rooms.length) setOnionRoomId(rooms[0].id);
  }, [rooms, onionRoomId]);

  useEffect(() => {
    const canvas = onionRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!onionOn || !onionRoom) return;
    // Dimmed: the screen is a reference, the route is the subject.
    ctx.globalAlpha = 0.6;
    drawScreen5BitmapRoomPreview(ctx, onionRoom, resolveBitmapRoomPreviewPalette(allAssets, onionRoom), SCALE);
    const hud = hudAsset?.data as Msx2HudAsset | undefined;
    if (hud) {
      const slots = (allAssets.find(a => a.id === hud.paletteAssetId && a.type === 'palette')?.data as PaletteAsset | undefined)?.slots
        || createDefaultScreen5PaletteSlots();
      [...(hud.layers || [])].reverse().forEach(layer => {
        if (!layer.visible) return;
        if (layer.kind === 'paint') {
          for (let y = 0; y < HUD_H; y++) {
            for (let x = 0; x < ROOM_W; x++) {
              const colorIndex = layer.pixels[y]?.[x];
              if (colorIndex === undefined || colorIndex < 0) continue;
              ctx.fillStyle = slots[colorIndex]?.hex || '#fff';
              ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
            }
          }
        } else {
          renderWidgetLayer(ctx, layer, SCALE, slots, hud.icons || [], { editMode: false, selected: false });
        }
      });
    }
    ctx.globalAlpha = 1;
  }, [onionOn, onionRoom, hudAsset, allAssets]);

  const set = <K extends keyof Msx2BossPath>(key: K, value: Msx2BossPath[K]) =>
    onUpdate({ ...path, [key]: value });
  const setNodes = (next: Msx2BossPathNode[]) => onUpdate({ ...path, nodes: next });

  // The baked stream is the source of truth for the preview: if the editor drew
  // the ideal curve instead, the author would be looking at something the MSX
  // never walks.
  const baked = useMemo(() => bakeBossPath(path, BITMAP_BOSS_PATH_LIMITS), [path]);
  const steps = useMemo(() => {
    const out: Array<{ x: number; y: number }> = [];
    if (!nodes.length) return out;
    let x = nodes[0].x;
    let y = nodes[0].y;
    for (let i = 0; i < baked.bytes.length; i++) {
      const byte = baked.bytes[i];
      if (byte === PATH_OP_END) break;
      if (byte >= 0xf0) {
        i += PATH_OP_ARG_BYTES;   // every opcode carries exactly one argument
        continue;
      }
      x += ((byte >> 4) & 0x0f) - 8;
      y += (byte & 0x0f) - 8;
      out.push({ x, y });
    }
    return out;
  }, [baked, nodes]);

  const toRoom = (event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(ROOM_W - 1, Math.round((event.clientX - rect.left) / SCALE))),
      y: Math.max(0, Math.min(ROOM_H - 1, Math.round((event.clientY - rect.top) / SCALE))),
    };
  };

  const addNode = (event: React.MouseEvent) => {
    const point = toRoom(event);
    const next = [...nodes, { id: `node_${nodes.length + 1}`, x: point.x, y: point.y, actions: [] }];
    setNodes(next);
    setSelected(next.length - 1);
    setStatusBarMessage?.(`Node added at ${point.x},${point.y}.`);
  };

  const moveNode = (index: number, point: { x: number; y: number }) =>
    setNodes(nodes.map((node, i) => i === index ? { ...node, x: point.x, y: point.y } : node));

  const node = nodes[selected];
  const laps = steps.length;
  // 60Hz frames per body update; the boss body redraws every 3 by default.
  const seconds = laps ? ((laps * 3) / 60).toFixed(1) : '0.0';

  return (
    <div className="flex h-full text-msx-textprimary overflow-y-auto">
      <div className="flex-1 p-4">
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Route</h3>
            <span className="text-xs text-msx-textsecondary">
              click to add a node, drag to move it
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <button
              className={`${btn} ${onionOn ? 'bg-msx-accent text-white' : ''}`}
              title="Show a real screen behind the route, like an onion skin"
              onClick={() => setOnionOn(!onionOn)}
            >
              {onionOn ? '◉' : '○'} Onion skin
            </button>
            <select
              className={`${input} flex-1`}
              value={onionRoomId}
              disabled={!onionOn || rooms.length === 0}
              onChange={e => setOnionRoomId(e.target.value)}
            >
              {rooms.length === 0
                ? <option value="">no bitmap rooms in this project</option>
                : rooms.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </div>

          <div className="relative" style={{ width: ROOM_W * SCALE, height: FULL_SCREEN_H * SCALE }}>
            <canvas
              ref={onionRef}
              width={ROOM_W * SCALE}
              height={FULL_SCREEN_H * SCALE}
              className="absolute inset-0 border border-msx-border"
              style={{ imageRendering: 'pixelated' }}
            />
            <div
              ref={canvasRef}
              className="absolute cursor-crosshair"
              style={{
                left: 0, top: HUD_H * SCALE,
                width: ROOM_W * SCALE, height: ROOM_H * SCALE,
              }}
              onMouseDown={event => { if (event.target === canvasRef.current) addNode(event); }}
              onMouseMove={event => { if (dragging !== null) moveNode(dragging, toRoom(event)); }}
              onMouseUp={() => setDragging(null)}
              onMouseLeave={() => setDragging(null)}
            >
            {steps.map((step, index) => (
              <div key={index} className="absolute rounded-full" style={{
                left: step.x * SCALE - 1, top: step.y * SCALE - 1,
                width: 3, height: 3, background: 'rgba(120,200,255,0.75)',
              }} />
            ))}
            {nodes.map((item, index) => (
              <div
                key={item.id || index}
                onMouseDown={event => { event.stopPropagation(); setSelected(index); setDragging(index); }}
                title={`${item.id} (${item.x},${item.y})`}
                className="absolute rounded-full cursor-move"
                style={{
                  left: item.x * SCALE - 6, top: item.y * SCALE - 6,
                  width: 12, height: 12,
                  border: `2px solid ${selected === index ? '#ffffff' : '#ff4d4d'}`,
                  background: (item.actions || []).length ? 'rgba(255,77,77,0.85)' : 'transparent',
                }}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-msx-textsecondary mt-2">
            Dots are the baked steps — one per body update, at most 2 px apart, which is
            what the body's 4-pixel restore strips can clean. A filled node has a script.
            One lap is <strong>{laps} steps</strong> ≈ {seconds}s, {baked.bytes.length} bytes of ROM.
          </p>
          {baked.warnings.map((warning, index) => (
            <p key={index} className="text-xs text-yellow-400 mt-1">{warning}</p>
          ))}
        </div>
      </div>

      <div className="w-80 shrink-0 border-l border-msx-border p-3 overflow-y-auto">
        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Path</h3>
          <label className={label}>Name</label>
          <input className={input} value={path.name} onChange={e => set('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className={label}>Speed (px/step)</label>
              <input type="number" min={1} max={2} className={input} value={path.speedPxPerTick}
                onChange={e => set('speedPxPerTick', Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>When it ends</label>
              <select className={input} value={path.loopMode}
                onChange={e => set('loopMode', e.target.value as Msx2BossPath['loopMode'])}>
                <option value="loop">Loop back to the start</option>
                <option value="once">Walk it once</option>
              </select>
            </div>
          </div>
          <div className="mt-2">
            <label className={label}>Firing</label>
            <select className={input} value={path.firing}
              onChange={e => set('firing', e.target.value as Msx2BossPath['firing'])}>
              <option value="auto">Keep the phase's shot cadence</option>
              <option value="path">Only the node scripts shoot</option>
            </select>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Nodes</h3>
            <button className={btn} disabled={nodes.length <= 1}
              onClick={() => { setNodes(nodes.filter((_, i) => i !== selected)); setSelected(0); }}>
              Remove node
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {nodes.map((item, index) => (
              <button key={item.id || index} className={`${btn} ${selected === index ? 'bg-msx-accent text-white' : ''}`}
                onClick={() => setSelected(index)}>{index + 1}</button>
            ))}
          </div>
          {node && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label}>x</label>
                  <input type="number" min={0} max={ROOM_W - 1} className={input} value={node.x}
                    onChange={e => moveNode(selected, { x: Number(e.target.value), y: node.y })} />
                </div>
                <div>
                  <label className={label}>y</label>
                  <input type="number" min={0} max={ROOM_H - 1} className={input} value={node.y}
                    onChange={e => moveNode(selected, { x: node.x, y: Number(e.target.value) })} />
                </div>
              </div>
              {(path.loopMode === 'loop' || selected < nodes.length - 1) && (
                <SegmentControls
                  segment={node.segment}
                  onChange={next => setNodes(nodes.map((item, i) => i === selected ? { ...item, segment: next } : item))}
                />
              )}
              <NodeActions
                actions={node.actions || []}
                shoots={shootAssets}
                onChange={next => setNodes(nodes.map((item, i) => i === selected ? { ...item, actions: next } : item))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * How the boss travels from this node to the next. The wave rides the segment's
 * own normal, so it follows whatever direction the author drew instead of being
 * locked to one axis.
 */
const SegmentControls: React.FC<{
  segment?: Msx2BossPathSegment;
  onChange: (segment: Msx2BossPathSegment | undefined) => void;
}> = ({ segment, onChange }) => {
  const mode = segment?.mode || 'linear';
  return (
    <div className="mt-3 pt-3 border-t border-msx-border">
      <label className={label}>Travel to the next node</label>
      <select className={input} value={mode}
        onChange={e => onChange(
          e.target.value === 'sine' ? { mode: 'sine', amplitude: segment?.amplitude ?? 16, frequency: segment?.frequency ?? 1 }
            : e.target.value === 'spline' ? { mode: 'spline' }
              : undefined)}>
        <option value="linear">Straight line</option>
        <option value="sine">Sine wave</option>
        <option value="spline">Smooth curve</option>
      </select>
      {mode === 'spline' && (
        <p className="text-xs text-msx-textsecondary mt-2">
          The curve bends to meet the nodes on either side, so it passes through every
          node without you placing a single control point. On an open path the first and
          last segments stay straight, since there is no neighbour to lean on.
        </p>
      )}
      {mode === 'sine' && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className={label}>Amplitude (px)</label>
            <input type="number" min={1} max={64} className={input} value={segment?.amplitude ?? 16}
              onChange={e => onChange({ mode: 'sine', amplitude: Number(e.target.value), frequency: segment?.frequency ?? 1 })} />
          </div>
          <div>
            <label className={label}>Waves along it</label>
            <input type="number" min={1} max={8} step={1} className={input} value={segment?.frequency ?? 1}
              onChange={e => onChange({ mode: 'sine', amplitude: segment?.amplitude ?? 16, frequency: Number(e.target.value) })} />
          </div>
        </div>
      )}
      {mode === 'sine' && (
        <p className="text-xs text-msx-textsecondary mt-2">
          The wave is measured perpendicular to the segment, so it bends whichever way the
          segment points. It also makes the trip longer: the boss keeps the same speed, so
          it takes more steps and more ROM.
        </p>
      )}
    </div>
  );
};

/** The little script a node runs before movement resumes. */
const NodeActions: React.FC<{
  actions: Msx2BossPathAction[];
  shoots: ProjectAsset[];
  onChange: (actions: Msx2BossPathAction[]) => void;
}> = ({ actions, shoots, onChange }) => (
  <div className="mt-3">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-msx-textsecondary">Actions on arrival</span>
      <div className="flex gap-1">
        <button className={btn} onClick={() => onChange([...actions, { action: 'wait', frames: 30 }])}>+ Wait</button>
        <button className={btn} onClick={() => onChange([...actions, { action: 'fire' }])}>+ Fire</button>
      </div>
    </div>
    {actions.length === 0 && (
      <p className="text-xs text-msx-textsecondary">The boss passes straight through.</p>
    )}
    {actions.map((action, index) => (
      <div key={index} className="flex gap-2 items-end mb-2">
        <div className="flex-1">
          <label className={label}>{action.action === 'wait' ? 'Pause (frames)' : 'Fire a projectile'}</label>
          {action.action === 'wait'
            ? <input type="number" min={1} max={600} className={input} value={action.frames}
              onChange={e => onChange(actions.map((item, i) =>
                i === index ? { action: 'wait', frames: Number(e.target.value) } : item))} />
            : <select className={input} value={action.shootId || ''}
              onChange={e => onChange(actions.map((item, i) =>
                i === index ? { action: 'fire', shootId: e.target.value } : item))}>
              <option value="">One bullet, aimed at the player</option>
              {shoots.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>}
        </div>
        <button className={btn} onClick={() => onChange(actions.filter((_, i) => i !== index))}>✕</button>
      </div>
    ))}
    <p className="text-xs text-msx-textsecondary mt-1">
      A pause costs nothing on the VDP: a boss that is not moving is not redrawn.
      Firing here only reaches the game if the path's firing mode is set to the node scripts.
      Patterns come from <strong>MSX2 Shoots Definition</strong> assets, and only apply to
      hardware-sprite bullets — a bitmap bullet always fires one aimed shot.
    </p>
  </div>
);

export { createMsx2BossPath } from '../../utils/msx2BossPath';

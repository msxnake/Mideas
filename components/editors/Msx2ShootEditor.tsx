import React from 'react';
import { Msx2ShootDefinition, Msx2ShootDirection, Msx2ShootPattern } from '../../types';
import { MSX2_SHOOT_MAX_BULLETS, shootVectors } from '../../utils/msx2Shoot';

/**
 * MSX2 Shoots Definition editor.
 *
 * A shot pattern authored once and fired by name: a boss path node picks one,
 * and the same asset is meant to serve turrets and shoot'em up enemies later.
 *
 * Directions are the 8 compass points on purpose — the bullet pool stores one
 * signed byte of velocity per axis, so that is the real hardware granularity.
 * The preview draws the exact vectors the runtime will use.
 *
 * See docs/msx/BOSS_SYSTEM_DESIGN.md §Fase G.
 */

interface Msx2ShootEditorProps {
  shoot: Msx2ShootDefinition;
  onUpdate: (shoot: Msx2ShootDefinition) => void;
}

const card = 'bg-msx-panel border border-msx-border rounded p-3 mb-3';
const label = 'block text-xs text-msx-textsecondary mb-1';
const input = 'w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary';

const DIRECTIONS: Msx2ShootDirection[] = ['up', 'upRight', 'right', 'downRight', 'down', 'downLeft', 'left', 'upLeft'];

export const Msx2ShootEditor: React.FC<Msx2ShootEditorProps> = ({ shoot, onUpdate }) => {
  const set = <K extends keyof Msx2ShootDefinition>(key: K, value: Msx2ShootDefinition[K]) =>
    onUpdate({ ...shoot, [key]: value });

  // For the preview, "aimed" is drawn as if the player were down-right of the
  // boss; at runtime it follows the player instead.
  const vectors = shootVectors(shoot, 3);
  const size = 180;
  const centre = size / 2;
  const reach = 62;
  const clamped = Math.min(Math.max(1, Number(shoot.bulletCount) || 1), MSX2_SHOOT_MAX_BULLETS);

  return (
    <div className="flex h-full text-msx-textprimary overflow-y-auto">
      <div className="flex-1 p-4">
        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Pattern</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Kind</label>
              <select className={input} value={shoot.pattern}
                onChange={e => set('pattern', e.target.value as Msx2ShootPattern)}>
                <option value="aimed">Aimed at the player (turret)</option>
                <option value="linear">Always the same direction</option>
                <option value="spread">Spread — a fan around the aim</option>
              </select>
            </div>
            <div>
              <label className={label}>Bullets at once (max {MSX2_SHOOT_MAX_BULLETS})</label>
              <input type="number" min={1} max={MSX2_SHOOT_MAX_BULLETS} className={input}
                disabled={shoot.pattern !== 'spread'}
                value={shoot.bulletCount}
                onChange={e => set('bulletCount', Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>Direction</label>
              <select className={input} value={shoot.direction} disabled={shoot.pattern !== 'linear'}
                onChange={e => set('direction', e.target.value as Msx2ShootDirection)}>
                {DIRECTIONS.map(dir => <option key={dir} value={dir}>{dir}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Speed (px/frame, 0 = phase speed)</label>
              <input type="number" min={0} max={4} className={input} value={shoot.speed}
                onChange={e => set('speed', Number(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-msx-textsecondary mt-3">
            Angles snap to the 8 compass points: the bullet pool keeps one signed byte of
            velocity per axis, so that is the granularity the hardware actually has. A
            spread of {clamped} therefore fans across {clamped} of those 8 directions.
          </p>
        </div>
      </div>

      <div className="w-80 shrink-0 border-l border-msx-border p-3">
        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Preview</h3>
          <svg width={size} height={size} style={{ background: '#101018' }} className="border border-msx-border rounded">
            {[...Array(8)].map((_, index) => {
              const angle = (index * Math.PI) / 4;
              return (
                <line key={index}
                  x1={centre} y1={centre}
                  x2={centre + Math.sin(angle) * reach} y2={centre - Math.cos(angle) * reach}
                  stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
              );
            })}
            {vectors.map((vector, index) => (
              <line key={index}
                x1={centre} y1={centre}
                x2={centre + vector.dx * (reach / 2)} y2={centre + vector.dy * (reach / 2)}
                stroke="#ff4d4d" strokeWidth={2} />
            ))}
            <circle cx={centre} cy={centre} r={5} fill="#50c8ff" />
          </svg>
          <p className="text-xs text-msx-textsecondary mt-2">
            {shoot.pattern === 'aimed'
              ? 'Drawn as if the player stood down-right; in game it follows them.'
              : shoot.pattern === 'spread'
                ? 'The fan is centred on the aim and drawn here against the same sample player.'
                : 'A fixed direction, whatever the player does.'}
          </p>
        </div>
      </div>
    </div>
  );
};

/** A blank shoot definition with the defaults the runtime expects. */
export function createMsx2ShootDefinition(id: string, name: string): Msx2ShootDefinition {
  return { id, name, pattern: 'aimed', bulletCount: 1, direction: 'down', speed: 0 };
}

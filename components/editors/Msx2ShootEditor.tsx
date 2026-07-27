import React from 'react';
import { Msx2ShootDefinition, Msx2ShootDirection, Msx2ShootPattern } from '../../types';
import {
  MSX2_SHOOT_MAX_BULLETS,
  MSX2_SHOOT_MAX_BURST,
  MSX2_SHOOT_MAX_BURST_INTERVAL,
  MSX2_SHOOT_MAX_WAVE_BULLETS,
  MSX2_SHOOT_RING,
  shootBulletCount,
  shootBurst,
  shootVectors,
  shootWaveLayout,
} from '../../utils/msx2Shoot';

/**
 * MSX2 Shoots Definition editor.
 *
 * A shot pattern authored once and fired by name: a boss path node picks one,
 * and the same asset is meant to serve turrets and shoot'em up enemies later.
 *
 * Bullets fly on a 16-point ring; the AUTHORED direction stays on the 8 compass
 * points, because aiming only ever needs the sign of each axis. The preview
 * draws the exact vectors the runtime will use.
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
const note = 'text-xs text-msx-textsecondary mt-3';

const DIRECTIONS: Msx2ShootDirection[] = ['up', 'upRight', 'right', 'downRight', 'down', 'downLeft', 'left', 'upLeft'];

/** Sample aim for the preview: as if the player stood down-right of the boss. */
const SAMPLE_AIM = 6;

export const Msx2ShootEditor: React.FC<Msx2ShootEditorProps> = ({ shoot, onUpdate }) => {
  const set = <K extends keyof Msx2ShootDefinition>(key: K, value: Msx2ShootDefinition[K]) =>
    onUpdate({ ...shoot, [key]: value });

  const vectors = shootVectors(shoot, SAMPLE_AIM);
  const layout = shootWaveLayout(shoot);
  const burst = shootBurst(shoot);
  const count = shootBulletCount(shoot);
  const fansOut = shoot.pattern === 'spread' || shoot.pattern === 'radial';
  // Every bullet of a wave is born at the boss centre, so a wave wider than the
  // pool loses its tail — and even one that fits runs into the V9938's 8
  // sprites per line. Both are fixed the same way: spread the volley over time.
  const overPool = count > MSX2_SHOOT_MAX_BULLETS && burst.count === 1;

  const size = 180;
  const centre = size / 2;
  const reach = 62;

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
                <option value="radial">Radial — shared out around the circle</option>
              </select>
            </div>
            <div>
              <label className={label}>Bullets per wave (max {MSX2_SHOOT_MAX_WAVE_BULLETS})</label>
              <input type="number" min={1} max={MSX2_SHOOT_MAX_WAVE_BULLETS} className={input}
                disabled={!fansOut}
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
            <div>
              <label className={label}>Fan step (× 22.5°)</label>
              <input type="number" min={1} max={4} className={input}
                disabled={shoot.pattern !== 'spread'}
                value={shoot.spreadStep ?? 2}
                onChange={e => set('spreadStep', Number(e.target.value))} />
            </div>
          </div>
          <p className={note}>
            Bullets fly on a ring of {MSX2_SHOOT_RING} directions ({(360 / MSX2_SHOOT_RING).toFixed(1)}° apart), stored as
            8.8 fixed-point velocity per axis. Aiming still snaps to the 8 compass points — that
            only needs the sign of each axis — and the in-between slots are what the fans and
            rings use.
          </p>
        </div>

        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Burst</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Waves per trigger (max {MSX2_SHOOT_MAX_BURST})</label>
              <input type="number" min={1} max={MSX2_SHOOT_MAX_BURST} className={input}
                value={shoot.burstCount ?? 1}
                onChange={e => set('burstCount', Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>Frames between waves (max {MSX2_SHOOT_MAX_BURST_INTERVAL})</label>
              <input type="number" min={1} max={MSX2_SHOOT_MAX_BURST_INTERVAL} className={input}
                disabled={burst.count === 1}
                value={shoot.burstInterval ?? 8}
                onChange={e => set('burstInterval', Number(e.target.value))} />
            </div>
          </div>
          <p className={note}>
            A burst repeats the whole wave, so {burst.count} × {count} = {burst.count * count} bullets
            leave the boss over {burst.count === 1 ? 'one frame' : `${(burst.count - 1) * burst.interval + 1} frames`}.
            Staggering matters: every bullet is born at the boss centre, and the V9938 only
            scans 8 sprites per line.
          </p>
        </div>
      </div>

      <div className="w-80 shrink-0 border-l border-msx-border p-3">
        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Preview</h3>
          <svg width={size} height={size} style={{ background: '#101018' }} className="border border-msx-border rounded">
            {[...Array(MSX2_SHOOT_RING)].map((_, index) => {
              const angle = (index * 2 * Math.PI) / MSX2_SHOOT_RING;
              const compass = index % 2 === 0;
              return (
                <line key={index}
                  x1={centre} y1={centre}
                  x2={centre + Math.sin(angle) * reach} y2={centre - Math.cos(angle) * reach}
                  stroke={compass ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)'} strokeWidth={1} />
              );
            })}
            {vectors.map((vector, index) => (
              <line key={index}
                x1={centre} y1={centre}
                x2={centre + vector.dx * reach} y2={centre + vector.dy * reach}
                stroke="#ff4d4d" strokeWidth={2} />
            ))}
            <circle cx={centre} cy={centre} r={5} fill="#50c8ff" />
          </svg>
          <p className="text-xs text-msx-textsecondary mt-2">
            {shoot.pattern === 'aimed'
              ? 'Drawn as if the player stood down-right; in game it follows them.'
              : shoot.pattern === 'spread'
                ? 'The fan is centred on the aim and drawn here against the same sample player.'
                : shoot.pattern === 'radial'
                  ? 'The ring starts on the aim and walks all the way round.'
                  : 'A fixed direction, whatever the player does.'}
          </p>
          <p className="text-xs text-msx-textsecondary mt-2">
            Record: {count} bullet{count === 1 ? '' : 's'}, start {layout.start}, step {layout.stride}
            {burst.count > 1 ? `, ${burst.count} waves every ${burst.interval}f` : ''}.
          </p>
          {overPool && (
            <p className="text-xs mt-2" style={{ color: '#ffb454' }}>
              The bullet pool holds {MSX2_SHOOT_MAX_BULLETS}, so only the first {MSX2_SHOOT_MAX_BULLETS} of
              this wave reach the screen. Raise the wave count and lower the bullets per wave to fit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/** A blank shoot definition with the defaults the runtime expects. */
export function createMsx2ShootDefinition(id: string, name: string): Msx2ShootDefinition {
  return {
    id, name,
    pattern: 'aimed', bulletCount: 1, direction: 'down', speed: 0,
    spreadStep: 2, burstCount: 1, burstInterval: 8,
  };
}

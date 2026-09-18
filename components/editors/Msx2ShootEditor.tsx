import React from 'react';
import { Msx2ShootDefinition, Msx2ShootPattern } from '../../types';
import {
  MSX2_SHOOT_MAX_BULLETS,
  MSX2_SHOOT_MAX_BURST,
  MSX2_SHOOT_MAX_BURST_INTERVAL,
  MSX2_SHOOT_MAX_WAVE_BULLETS,
  MSX2_SHOOT_RING,
  shootAngleIndex,
  shootBulletCount,
  shootBurst,
  shootUsesAuthoredAngle,
  shootVectors,
  shootWaveLayout,
} from '../../utils/msx2Shoot';

/**
 * MSX2 Shoots Definition editor.
 *
 * A shot pattern authored once and fired by name: a boss path node picks one,
 * and the same asset is meant to serve turrets and shoot'em up enemies later.
 *
 * Aimed shots use the vector to the player's body centre at spawn, with 8.8
 * subpixel velocity. Authored angles and fans/rings use the 16-point ring.
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

/** Compass names for the even ring slots, clockwise from up. */
const COMPASS: string[] = ['up', 'up right', 'right', 'down right', 'down', 'down left', 'left', 'up left'];

const ANGLE_OPTIONS = Array.from({ length: MSX2_SHOOT_RING }, (_unused, slot) => ({
  slot,
  degrees: (slot * 360) / MSX2_SHOOT_RING,
  name: slot % 2 === 0 ? COMPASS[slot / 2] : undefined,
}));

/** Sample bearing for ring-based patterns. */
const SAMPLE_AIM = 6;

export const Msx2ShootEditor: React.FC<Msx2ShootEditorProps> = ({ shoot, onUpdate }) => {
  const set = <K extends keyof Msx2ShootDefinition>(key: K, value: Msx2ShootDefinition[K]) =>
    onUpdate({ ...shoot, [key]: value });

  const fixedBase = shoot.pattern !== 'aimed' && shootUsesAuthoredAngle(shoot);
  const spinOn = shoot.pattern !== 'aimed' && shoot.spin === true;
  const vectors = shootVectors(shoot, fixedBase ? shootAngleIndex(shoot)
    : shoot.pattern === 'aimed' ? 6.7 : SAMPLE_AIM);
  const layout = shootWaveLayout(shoot);
  const burst = shootBurst(shoot);
  // A spiral sweeps: draw up to three successive burst waves, fading out.
  const spiralWaves: Array<Array<{ dx: number; dy: number }>> = spinOn
    ? Array.from({ length: Math.min(3, burst.count) }, (_v, wave) =>
        shootVectors(shoot, fixedBase ? shootAngleIndex(shoot) : SAMPLE_AIM, wave * layout.stride))
    : [];
  // Spray scatters: draw the ±spray neighbours of the main wave.
  const spray = Math.max(0, Math.min(3, Math.floor(Number(shoot.spray) || 0)));
  const sprayWaves: Array<Array<{ dx: number; dy: number }>> = spray > 0
    ? [-spray, spray].map(steps =>
        shootVectors(shoot, fixedBase ? shootAngleIndex(shoot) : SAMPLE_AIM, steps))
    : [];
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
            {shoot.pattern !== 'aimed' && (
              <div>
                <label className={label}>
                  {shoot.pattern === 'linear' ? 'Angle' : 'Fixed angle (ignore the player)'}
                </label>
                {shoot.pattern === 'linear' ? (
                  <select className={input} value={shootAngleIndex(shoot)}
                    onChange={e => set('angle', Number(e.target.value))}>
                    {ANGLE_OPTIONS.map(option => (
                      <option key={option.slot} value={option.slot}>
                        {option.degrees}°{option.name ? ` — ${option.name}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <label className="flex items-center gap-2 text-sm text-msx-textprimary">
                    <input type="checkbox" checked={shoot.fixedAngle === true}
                      onChange={e => set('fixedAngle', e.target.checked)} />
                    fire from a fixed angle
                  </label>
                )}
              </div>
            )}
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
            {shoot.pattern !== 'aimed' && (
              <div>
                <label className={label}>Spiral (rotate every wave)</label>
                <label className="flex items-center gap-2 text-sm text-msx-textprimary">
                  <input type="checkbox" checked={shoot.spin === true}
                    onChange={e => set('spin', e.target.checked)} />
                  sweep the angle each wave
                </label>
              </div>
            )}
            <div>
              <label className={label}>Spray per wave (± ring steps)</label>
              <input type="number" min={0} max={3} className={input} value={shoot.spray ?? 0}
                onChange={e => set('spray', Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>Hold still while firing</label>
              <label className="flex items-center gap-2 text-sm text-msx-textprimary">
                <input type="checkbox" checked={shoot.freezeWhileFiring === true}
                  onChange={e => set('freezeWhileFiring', e.target.checked)} />
                boss stops during the burst
              </label>
            </div>
            {fansOut && shoot.fixedAngle === true && (
              <div>
                <label className={label}>{shoot.pattern === 'radial' && (shoot.burstCount ?? 1) > 1 ? 'Start angle' : 'Angle'}</label>
                <select className={input} value={shootAngleIndex(shoot)}
                  onChange={e => set('angle', Number(e.target.value))}>
                  {ANGLE_OPTIONS.map(option => (
                    <option key={option.slot} value={option.slot}>
                      {option.degrees}°{option.name ? ` — ${option.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {shoot.pattern === 'radial' && shoot.fixedAngle === true && (shoot.burstCount ?? 1) > 1 && (
              <div>
                <label className={label}>End angle</label>
                <select className={input} value={Number.isFinite(Number(shoot.angleEnd)) ? shootAngleIndex({ ...shoot, angle: shoot.angleEnd }) : shootAngleIndex(shoot)}
                  onChange={e => set('angleEnd', Number(e.target.value))}>
                  {ANGLE_OPTIONS.map(option => (
                    <option key={option.slot} value={option.slot}>
                      {option.degrees}°{option.name ? ` — ${option.name}` : ''}
                    </option>
                  ))}
                </select>
                <p className={note}>With one bullet per wave, the burst sweeps this range in order.</p>
              </div>
            )}
          </div>
          <p className={note}>
            Aimed shots target the player's body centre when fired, with subpixel precision
            and constant speed. Each shot keeps that trajectory; later shots aim again.
            Fans, rings and the Angle control use {MSX2_SHOOT_RING} directions
            ({(360 / MSX2_SHOOT_RING).toFixed(1)}° apart). Spray deliberately offsets the aim.
          </p>
        </div>

        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Burst</h3>
          <button type="button" className="mb-3 px-2 py-1 text-xs rounded border border-msx-border text-msx-textprimary"
            onClick={() => onUpdate({ ...shoot, pattern: 'radial', bulletCount: 1, fixedAngle: true, spin: true,
              angle: 4, angleEnd: 8, burstCount: 5, burstInterval: 60 })}>
            Preset: 5 bullets, 90° → 180°, every second
          </button>
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
            {sprayWaves.map((waveVectors, index) => (
              waveVectors.map((vector, i) => (
                <line key={`spray${index}_${i}`}
                  x1={centre} y1={centre}
                  x2={centre + vector.dx * reach} y2={centre + vector.dy * reach}
                  stroke="#ffb454" strokeWidth={1.5} opacity={0.6} />
              ))
            ))}
            {spiralWaves.map((waveVectors, wave) => (
              waveVectors.map((vector, index) => (
                <line key={`spin${wave}_${index}`}
                  x1={centre} y1={centre}
                  x2={centre + vector.dx * reach} y2={centre + vector.dy * reach}
                  stroke="#ff4d4d" strokeWidth={1.5} opacity={0.55 - wave * 0.18} />
              ))
            ))}
            <circle cx={centre} cy={centre} r={5} fill="#50c8ff" />
          </svg>
          <p className="text-xs text-msx-textsecondary mt-2">
            {shoot.pattern === 'aimed'
              ? 'Targets the player at the moment of firing, then travels straight.'
              : shoot.pattern === 'spread'
                ? fixedBase
                  ? 'The fan is centred on the chosen angle and never turns.'
                  : 'The fan is centred on the aim and drawn here against the same sample player.'
                : shoot.pattern === 'radial'
                  ? fixedBase
                    ? 'The ring starts on the chosen angle and walks all the way round.'
                    : 'The ring starts on the aim and walks all the way round.'
                  : 'A fixed direction, whatever the player does.'}
            {spinOn && (
              <>
                {' '}The spiral sweeps the base angle {layout.stride} ring step{layout.stride === 1 ? '' : 's'}
                {' '}per wave; the fading lines are the next burst waves.
              </>
            )}
          </p>
          <p className="text-xs text-msx-textsecondary mt-2">
            Record: {count} bullet{count === 1 ? '' : 's'}, start {layout.start}, step {layout.stride}
            {burst.count > 1 ? `, ${burst.count} waves every ${burst.interval}f` : ''}
            {spray > 0 ? `, spray ±${spray}` : ''}
            {shoot.freezeWhileFiring ? ', hold still' : ''}.
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
export { createMsx2ShootDefinition } from '../../utils/msx2AssetDefaults';

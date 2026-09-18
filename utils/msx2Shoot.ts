import { Msx2ShootDefinition, Msx2ShootDirection } from '../types';

/**
 * Shot patterns, shared by the editor preview and the ROM generator so both
 * agree on what a definition actually fires.
 *
 * Bullets fly along a ring of 16 directions (k * 22.5 degrees). The pool stores
 * an 8.8 fixed-point velocity per axis, so a direction is a pair of signed
 * 16-bit numbers and the ring can be as fine as the table is long; 16 is where
 * the useful angles stop for a 256x192 screen with 2 px/frame bullets.
 *
 * A plain AIMED definition uses the live body-centre displacement at spawn,
 * normalised to the configured speed in 8.8. It does not snap to this ring.
 * Fans/rings and intentional spray still use ring bearings. The preview may
 * supply a fractional aimIndex to show an aimed bearing between ring slots.
 */

/** Directions in the ring. Even indices are the 8 compass points. */
export const MSX2_SHOOT_RING = 16;

/** The sprite bullet pool holds this many bullets at once. */
export const MSX2_SHOOT_MAX_BULLETS = 3;

/**
 * Bullets a single wave may name. Anything past the pool is dropped at runtime
 * (the generator warns), but authoring a wide ring is still meaningful: split it
 * into a burst and the waves fit through a small pool one at a time.
 */
export const MSX2_SHOOT_MAX_WAVE_BULLETS = MSX2_SHOOT_RING;

/** Waves per trigger, and the frame gap between them. */
export const MSX2_SHOOT_MAX_BURST = 16;
export const MSX2_SHOOT_MAX_BURST_INTERVAL = 60;

/** Clockwise from up, matching Msx2ShootDirection. */
export const MSX2_SHOOT_DIRECTIONS: Msx2ShootDirection[] = [
  'up', 'upRight', 'right', 'downRight', 'down', 'downLeft', 'left', 'upLeft',
];

export const shootDirectionIndex = (direction: Msx2ShootDirection | undefined): number => {
  const index = MSX2_SHOOT_DIRECTIONS.indexOf(direction as Msx2ShootDirection);
  return index < 0 ? 4 : index;   // default: down
};

/** A compass point as a ring slot. The compass is every other ring direction. */
export const shootRingIndex = (direction: Msx2ShootDirection | undefined): number =>
  shootDirectionIndex(direction) * 2;

/**
 * The authored firing angle as a ring slot: the fine `angle` field (0..15, in
 * 22.5° steps clockwise from up) when the asset has one, otherwise the legacy
 * 8-compass `direction`. Old assets never carry `angle`, so they keep firing
 * exactly the way they always did.
 */
export function shootAngleIndex(
  shoot: Pick<Msx2ShootDefinition, 'direction' | 'angle'>,
): number {
  const angle = Math.floor(Number(shoot.angle));
  if (Number.isFinite(angle)) {
    return ((angle % MSX2_SHOOT_RING) + MSX2_SHOOT_RING) % MSX2_SHOOT_RING;
  }
  return shootRingIndex(shoot.direction);
}

/**
 * True when the wave centres on the AUTHORED angle instead of the live player
 * aim: `linear` always, plus a `spread`/`radial` whose author ticked the fixed
 * angle. The runtime record marks the same fact in bit 7 of the pattern byte,
 * which is the only thing the Z80 ever reads.
 */
export function shootUsesAuthoredAngle(
  shoot: Pick<Msx2ShootDefinition, 'pattern' | 'fixedAngle'>,
): boolean {
  if (shoot.pattern === 'linear') return true;
  return (shoot.pattern === 'spread' || shoot.pattern === 'radial')
    && shoot.fixedAngle === true;
}

/** Unit vector of ring slot k, in screen axes (y grows downwards). */
export function shootRingVector(index: number): { dx: number; dy: number } {
  const k = ((index % MSX2_SHOOT_RING) + MSX2_SHOOT_RING) % MSX2_SHOOT_RING;
  const angle = (k * 2 * Math.PI) / MSX2_SHOOT_RING;
  return { dx: Math.sin(angle), dy: -Math.cos(angle) };
}

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
};

/** Bullets per wave, after the per-pattern rules. Only fans and rings fire more than one. */
export function shootBulletCount(shoot: Pick<Msx2ShootDefinition, 'pattern' | 'bulletCount'>): number {
  if (shoot.pattern !== 'spread' && shoot.pattern !== 'radial') return 1;
  return clampInt(shoot.bulletCount, 1, MSX2_SHOOT_MAX_WAVE_BULLETS, 1);
}

/**
 * Ring step between neighbouring bullets of a wave, and the offset of the first
 * one relative to the aim.
 *
 * A fan is centred on the aim, so it starts half a fan back; a ring starts on
 * the aim and walks all the way round. Both are precomputed here so the Z80 only
 * ever adds a signed byte to a direction index.
 */
export function shootWaveLayout(
  shoot: Pick<Msx2ShootDefinition, 'pattern' | 'bulletCount' | 'direction' | 'spreadStep' | 'angle' | 'angleEnd' | 'burstCount'>,
): { count: number; start: number; stride: number } {
  const count = shootBulletCount(shoot);
  if (shoot.pattern === 'radial') {
    // A one-bullet radial burst can sweep a chosen angle range over its waves.
    // The same signed stride is consumed by the runtime's spiral accumulator.
    const waves = clampInt(shoot.burstCount, 1, MSX2_SHOOT_MAX_BURST, 1);
    if (count === 1 && waves > 1 && Number.isFinite(Number(shoot.angleEnd))) {
      const start = shootAngleIndex(shoot);
      const end = ((Math.floor(Number(shoot.angleEnd)) % MSX2_SHOOT_RING) + MSX2_SHOOT_RING) % MSX2_SHOOT_RING;
      let delta = end - start;
      if (delta > MSX2_SHOOT_RING / 2) delta -= MSX2_SHOOT_RING;
      if (delta < -MSX2_SHOOT_RING / 2) delta += MSX2_SHOOT_RING;
      return { count, start: 0, stride: Math.max(-15, Math.min(15, Math.round(delta / (waves - 1)))) };
    }
    // round() rather than floor() so counts that do not divide 16 (3, 5, 6...)
    // still spread out instead of bunching up on one side.
    const stride = Math.max(1, Math.round(MSX2_SHOOT_RING / count));
    return { count, start: 0, stride };
  }
  if (shoot.pattern === 'spread') {
    const stride = clampInt(shoot.spreadStep, 1, 4, 2);
    return { count, start: -Math.floor((count - 1) / 2) * stride, stride };
  }
  return { count: 1, start: 0, stride: 0 };
}

/** Waves per trigger and the gap between them, clamped to what the record holds. */
export function shootBurst(
  shoot: Pick<Msx2ShootDefinition, 'burstCount' | 'burstInterval'>,
): { count: number; interval: number } {
  const count = clampInt(shoot.burstCount, 1, MSX2_SHOOT_MAX_BURST, 1);
  return {
    count,
    interval: count > 1 ? clampInt(shoot.burstInterval, 1, MSX2_SHOOT_MAX_BURST_INTERVAL, 8) : 0,
  };
}

/**
 * The unit vectors ONE WAVE fires, in spawn order.
 *
 * `aimIndex` is the ring slot the boss is aiming at; the editor passes a sample
 * value so the preview has something to draw, the runtime uses the real aim.
 * Patterns that fire along the authored angle (`linear`, or a fixed-angle
 * fan/ring) ignore it. `rotationSteps` shifts the whole wave around the ring —
 * that is what the spiral preview uses to draw successive burst waves.
 */
export function shootVectors(
  shoot: Pick<Msx2ShootDefinition, 'pattern' | 'bulletCount' | 'direction' | 'angle' | 'angleEnd' | 'fixedAngle' | 'spreadStep' | 'burstCount'>,
  aimIndex: number,
  rotationSteps = 0,
): Array<{ dx: number; dy: number }> {
  const base = shootUsesAuthoredAngle(shoot) ? shootAngleIndex(shoot) : aimIndex;
  const { count, start, stride } = shootWaveLayout(shoot);
  const out: Array<{ dx: number; dy: number }> = [];
  for (let i = 0; i < count; i++) {
    out.push(shootRingVector(base + rotationSteps + start + i * stride));
  }
  return out;
}

/**
 * Compiles a definition into the 8-byte runtime record:
 *
 *   [pattern, count, dir, speed, start, stride, burstCount, burstInterval]
 *
 * pattern 0 = aimed, 1 = linear, 2 = spread, 3 = radial — bit 7 additionally
 * set when a spread/radial fires from the authored angle instead of the player
 * (linear needs no flag: it never aims). speed 0 means "use the attack phase's
 * bullet speed". `dir` is the authored ring slot 0..15, and `start`/`stride`
 * are signed ring steps, which is what lets one loop cover a fan and a full
 * ring alike: the runtime walks `dir + start`, then `+ stride` each time, and
 * looks every slot up in the 8.8 vector table. No fan arithmetic, no multiply,
 * no angle.
 */
export function bakeShootDefinition(shoot: Msx2ShootDefinition): number[] {
  const base = shoot.pattern === 'linear' ? 1
    : shoot.pattern === 'spread' ? 2
      : shoot.pattern === 'radial' ? 3
        : 0;
  let pattern = shootUsesAuthoredAngle(shoot) && base >= 2 ? base | 0x80 : base;
  // Spin (rotate the base angle every burst wave) rides bit 6; it needs the
  // burst machinery, so `aimed` never carries it.
  if (shoot.spin === true && base !== 0) pattern |= 0x40;
  // Hold still while the burst is in flight (bit 2).
  if (shoot.freezeWhileFiring === true) pattern |= 0x04;
  // Per-wave spray, ±N ring steps around the computed bearing (bits 4-5).
  const spray = clampInt(shoot.spray, 0, 3, 0);
  if (spray > 0) pattern |= (spray & 3) << 4;
  const { count, start, stride } = shootWaveLayout(shoot);
  const burst = shootBurst(shoot);
  return [
    pattern,
    count,
    shootAngleIndex(shoot),
    clampInt(shoot.speed, 0, 4, 0),
    start & 0xff,
    stride & 0xff,
    burst.count,
    burst.interval,
  ];
}

export const MSX2_SHOOT_RECORD_BYTES = 8;

/**
 * The 16 ring vectors as 8.8 fixed point, flattened little-endian:
 * `dxLo, dxHi, dyLo, dyHi` per slot, so indexing is `slot * 4`.
 *
 * 1.0 is 256, so a component never leaves signed 16-bit range even multiplied by
 * the top speed of 4. Unlike the old 8-direction table these ARE normalised: a
 * diagonal used to travel sqrt(2) times faster than a cardinal.
 */
export const MSX2_SHOOT_DIR16_TABLE_BYTES: number[] = (() => {
  const bytes: number[] = [];
  for (let k = 0; k < MSX2_SHOOT_RING; k++) {
    const { dx, dy } = shootRingVector(k);
    for (const component of [dx, dy]) {
      const fixed = Math.round(component * 256) & 0xffff;
      bytes.push(fixed & 0xff, (fixed >> 8) & 0xff);
    }
  }
  return bytes;
})();

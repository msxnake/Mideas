import { Msx2ShootDefinition, Msx2ShootDirection } from '../types';

/**
 * Shot patterns, shared by the editor preview and the ROM generator so both
 * agree on what a definition actually fires.
 *
 * The 8 compass directions are not a simplification for the preview's sake:
 * the bullet pool stores one signed byte of velocity per axis, so a direction
 * IS a pair of signs. Everything here works in that space.
 */

/** The sprite bullet pool holds this many bullets at once. */
export const MSX2_SHOOT_MAX_BULLETS = 3;

/** Clockwise from up, matching Msx2ShootDirection. */
export const MSX2_SHOOT_DIRECTIONS: Msx2ShootDirection[] = [
  'up', 'upRight', 'right', 'downRight', 'down', 'downLeft', 'left', 'upLeft',
];

const UNIT: Array<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
  { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 },
];

export const shootDirectionIndex = (direction: Msx2ShootDirection | undefined): number => {
  const index = MSX2_SHOOT_DIRECTIONS.indexOf(direction as Msx2ShootDirection);
  return index < 0 ? 4 : index;   // default: down
};

/**
 * The unit vectors a definition fires, in spawn order.
 *
 * `aimIndex` is the compass slot the boss is aiming at; the editor passes a
 * sample value so the preview has something to draw, the runtime uses the real
 * aim. A spread alternates around the aim (centre, +1, -1, +2, …) so an even
 * bullet count still looks balanced.
 */
export function shootVectors(
  shoot: Pick<Msx2ShootDefinition, 'pattern' | 'bulletCount' | 'direction'>,
  aimIndex: number,
): Array<{ dx: number; dy: number }> {
  const count = Math.max(1, Math.min(MSX2_SHOOT_MAX_BULLETS, Math.floor(Number(shoot.bulletCount) || 1)));
  if (shoot.pattern === 'linear') return [UNIT[shootDirectionIndex(shoot.direction)]];
  if (shoot.pattern !== 'spread') return [UNIT[((aimIndex % 8) + 8) % 8]];
  const out: Array<{ dx: number; dy: number }> = [];
  for (let i = 0; i < count; i++) {
    // 0, +1, -1, +2, -2 …
    const step = Math.ceil(i / 2) * (i % 2 === 1 ? 1 : -1);
    out.push(UNIT[((aimIndex + step) % 8 + 8) % 8]);
  }
  return out;
}

/**
 * Compiles a definition into the 8-byte runtime record:
 *
 *   [pattern, count, dirIndex, speed, off0, off1, off2, pad]
 *
 * pattern 0 = aimed, 1 = linear, 2 = spread; speed 0 means "use the attack
 * phase's bullet speed". The per-bullet ring offsets are precomputed here so
 * the Z80 never works out a fan: it just adds a signed byte to the base
 * direction. 8 bytes (not 7) so indexing is three shifts instead of a multiply.
 */
export function bakeShootDefinition(shoot: Msx2ShootDefinition): number[] {
  const pattern = shoot.pattern === 'linear' ? 1 : shoot.pattern === 'spread' ? 2 : 0;
  const count = pattern === 2
    ? Math.max(1, Math.min(MSX2_SHOOT_MAX_BULLETS, Math.floor(Number(shoot.bulletCount) || 1)))
    : 1;
  const offsets = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    offsets[i] = pattern === 2 ? Math.ceil(i / 2) * (i % 2 === 1 ? 1 : -1) : 0;
  }
  return [
    pattern,
    count,
    shootDirectionIndex(shoot.direction),
    Math.max(0, Math.min(4, Math.floor(Number(shoot.speed) || 0))),
    offsets[0] & 0xff, offsets[1] & 0xff, offsets[2] & 0xff,
    0,
  ];
}

export const MSX2_SHOOT_RECORD_BYTES = 8;

/** The 8 unit vectors in ring order, flattened as signed bytes for the ROM table. */
export const MSX2_SHOOT_DIR_TABLE_BYTES: number[] = UNIT.flatMap(v => [v.dx & 0xff, v.dy & 0xff]);

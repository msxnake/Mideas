/**
 * @fileoverview Player weapon runtime contract for SCREEN 5 bitmap rooms.
 *
 * The Player Editor authors `player.weapons[]` (declarative metadata). This
 * module turns it into the small, clamped structure the ASM generator and the
 * editor preview share, so both read the SAME numbers:
 *
 * - Up to {@link MSX2_WEAPON_MAX_COUNT} weapons, identified at runtime by their
 *   index in `player.weapons` (the owned set is a bitmask of those indexes).
 * - A 'melee' weapon draws its `attackVisual` sprite (hardware sprite, one SAT
 *   slot per 16x16 layer) in front of the player for `frames.length` animation
 *   frames of `frameDelay` game frames each, and hits enemies on its LAST frame.
 * - A 'projectile' weapon is the shoot skill's mode: while it is equipped the
 *   shoot skill fires as before; while a melee weapon is equipped the same
 *   button swings the weapon instead.
 * - `availability: 'owned'` weapons are in hand at boot; 'pickup' weapons are
 *   granted by a room collectible (`params.weaponPickupId`). 'locked' weapons
 *   are never granted by the runtime.
 * - `weaponSwitchKey` cycles through the owned weapons.
 */
import type {
  Msx2PlayerDefinition,
  Msx2PlayerWeaponDefinition,
  Msx2PlayerWeaponSwitchKey,
} from '../types';
import { Msx2BitmapKeyboardBinding, resolveMsx2BitmapKeyboardBinding } from './msx2PlatformPhysics';

/** Owned weapons are a one-byte bitmask. */
export const MSX2_WEAPON_MAX_COUNT = 8;
/** Attack animation frames kept per weapon (first N of attackVisual.frames). */
export const MSX2_WEAPON_MAX_FRAMES = 4;
/** Minimum frames for a readable swing: wind-up + hit. */
export const MSX2_WEAPON_MIN_FRAMES = 2;
/** Hardware SAT slots (16x16 layers) a weapon swing may use. */
export const MSX2_WEAPON_MAX_LAYERS = 4;
/** Default pixel offset of the weapon sprite relative to the player sprite origin. */
export const MSX2_WEAPON_DEFAULT_OFFSETS = {
  right: { x: 14, y: 8 },
  left: { x: -14, y: 8 },
} as const;

/**
 * MSX keyboard matrix position of every key offered for weapon switching.
 * Row/bit values follow the standard MSX international matrix (row 2 bit 7 = B,
 * row 3 bit 0 = C, row 4 bit 2 = M, row 5 bit 5 = X / bit 7 = Z, row 7 bit 3 = TAB).
 */
export const MSX2_WEAPON_SWITCH_KEYS: Record<Exclude<Msx2PlayerWeaponSwitchKey, 'none'>, Msx2BitmapKeyboardBinding> = {
  m: { label: 'M', row: 4, mask: 0x04 },
  b: { label: 'B', row: 2, mask: 0x80 },
  c: { label: 'C', row: 3, mask: 0x01 },
  x: { label: 'X', row: 5, mask: 0x20 },
  z: { label: 'Z', row: 5, mask: 0x80 },
  tab: { label: 'TAB', row: 7, mask: 0x08 },
};

export const MSX2_WEAPON_SWITCH_KEY_OPTIONS: ReadonlyArray<{ value: Msx2PlayerWeaponSwitchKey; label: string }> = [
  { value: 'm', label: 'M' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
  { value: 'x', label: 'X' },
  { value: 'z', label: 'Z' },
  { value: 'tab', label: 'TAB' },
  { value: 'none', label: 'Sin tecla (solo pickups)' },
];

export interface Msx2WeaponRuntimeOffset {
  x: number;
  y: number;
}

export interface Msx2WeaponRuntimeEntry {
  /** Index in player.weapons: bit in the owned mask, value of the equipped byte. */
  index: number;
  id: string;
  name: string;
  isMelee: boolean;
  /** In hand at boot. */
  owned: boolean;
  /** Granted by a room pickup whose params.weaponPickupId equals `id`. */
  pickup: boolean;
  spriteAssetId?: string;
  /** Sprite frame indices played by the swing (2..4 entries for melee). */
  frames: number[];
  /** Game frames each swing frame stays visible (1..30). */
  frameDelay: number;
  /** Game frames between swings (0..120). */
  cooldownFrames: number;
  /** Sprite origin relative to player_x/player_y, per facing. */
  offsets: { left: Msx2WeaponRuntimeOffset; right: Msx2WeaponRuntimeOffset };
}

export interface Msx2WeaponRuntimeConfig {
  /** True when at least one melee weapon exists: the weapon runtime is emitted. */
  enabled: boolean;
  weapons: Msx2WeaponRuntimeEntry[];
  /** Index equipped at boot, -1 = nothing equipped. */
  initialEquippedIndex: number;
  /** Bitmask of weapons in hand at boot. */
  initialOwnedMask: number;
  switchKey?: Msx2BitmapKeyboardBinding;
  switchKeyId: Msx2PlayerWeaponSwitchKey;
  /**
   * Key that swings the equipped melee weapon: the player's B/attack button
   * (SPC stays on jump). It is the same key the shoot skill uses, which is the
   * point: the equipped weapon decides whether B shoots or swings.
   */
  attackKey?: Msx2BitmapKeyboardBinding;
}

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

const readOffset = (
  weapon: Msx2PlayerWeaponDefinition,
  facing: 'left' | 'right',
): Msx2WeaponRuntimeOffset => {
  const raw = weapon.attackVisual?.offsetByFacing?.[facing];
  const fallback = MSX2_WEAPON_DEFAULT_OFFSETS[facing];
  return {
    x: clampInt(raw?.x, -64, 64, fallback.x),
    y: clampInt(raw?.y, -64, 64, fallback.y),
  };
};

/** Frames played by a melee swing, clamped to the runtime limits. */
export function resolveMsx2WeaponFrames(weapon: Pick<Msx2PlayerWeaponDefinition, 'attackVisual'>): number[] {
  const raw = Array.isArray(weapon.attackVisual?.frames) ? weapon.attackVisual!.frames : [];
  const frames = raw
    .map(frame => clampInt(frame, 0, 63, 0))
    .slice(0, MSX2_WEAPON_MAX_FRAMES);
  if (frames.length === 0) return [0, 1];
  if (frames.length === 1) return [frames[0], frames[0]];
  return frames;
}

export function normalizeMsx2WeaponSwitchKey(value: unknown): Msx2PlayerWeaponSwitchKey {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'none') return 'none';
  return (key in MSX2_WEAPON_SWITCH_KEYS ? key : 'm') as Msx2PlayerWeaponSwitchKey;
}

/**
 * Resolve the weapon runtime for a player (Player Config asset data or a
 * compact player entity). Weapons past {@link MSX2_WEAPON_MAX_COUNT} are ignored.
 */
export function getMsx2WeaponRuntimeConfig(
  player: Partial<Msx2PlayerDefinition> | undefined,
): Msx2WeaponRuntimeConfig {
  const rawWeapons = Array.isArray(player?.weapons) ? player!.weapons!.slice(0, MSX2_WEAPON_MAX_COUNT) : [];
  const weapons: Msx2WeaponRuntimeEntry[] = rawWeapons.map((weapon, index) => {
    const isMelee = weapon?.type === 'melee';
    return {
      index,
      id: String(weapon?.id || `weapon_${index + 1}`),
      name: String(weapon?.name || weapon?.id || `Weapon ${index + 1}`),
      isMelee,
      owned: (weapon?.availability || 'owned') === 'owned',
      pickup: weapon?.availability === 'pickup',
      spriteAssetId: String(weapon?.attackVisual?.spriteAssetId || '').trim() || undefined,
      frames: resolveMsx2WeaponFrames(weapon || {}),
      frameDelay: clampInt(weapon?.attackVisual?.frameDelay, 1, 30, 4),
      cooldownFrames: clampInt(weapon?.cooldownFrames, 0, 120, 15),
      offsets: { left: readOffset(weapon, 'left'), right: readOffset(weapon, 'right') },
    };
  });
  const enabled = weapons.some(weapon => weapon.isMelee);
  const initialOwnedMask = weapons.reduce((mask, weapon) => (weapon.owned ? mask | (1 << weapon.index) : mask), 0);
  const requested = weapons.find(weapon => weapon.id === player?.equippedWeaponId && weapon.owned);
  const initialEquippedIndex = requested
    ? requested.index
    : (weapons.find(weapon => weapon.owned)?.index ?? -1);
  const switchKeyId = normalizeMsx2WeaponSwitchKey(player?.weaponSwitchKey);
  return {
    enabled,
    weapons,
    initialEquippedIndex,
    initialOwnedMask,
    switchKey: switchKeyId === 'none' ? undefined : MSX2_WEAPON_SWITCH_KEYS[switchKeyId],
    switchKeyId,
    attackKey: resolveMsx2BitmapKeyboardBinding(player, 'attack'),
  };
}

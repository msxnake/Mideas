/**
 * Functional zoning of the shared MSX2 SCREEN4/SCREEN5 16-color palette.
 *
 * SCREEN 4 has a SINGLE hardware palette of 16 colors shared by BOTH tiles and
 * sprites. To make ownership explicit and user-controllable, the 16 slots are
 * divided into three functional zones with one movable divider:
 *
 *  - Immutable: slot 0 (transparent) plus the detected black + white slots.
 *    These are never reassigned (overwriting them would break everything).
 *  - Sprite zone: contiguous slots reserved for sprites.
 *  - Tile zone: contiguous slots reserved for tiles (tile imports write here).
 *
 * The model stores a single `divider` (first slot of the tile zone) which is
 * what the user drags; sprites own [spriteStart .. divider-1], tiles own
 * [divider .. tileEnd]. Immutable slots that fall inside either range are
 * filtered out by the zone getters, so they always stay protected.
 */

import { Msx2PaletteZones, Screen5PaletteSlot } from '../types';
import { SCREEN5_PALETTE_SLOT_COUNT } from './msx2PaletteUtils';

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const normalizeHex = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const isTransparent = (hex: string | undefined): boolean =>
  normalizeHex(hex) === normalizeHex(TRANSPARENT_HEX);

const isBlack = (hex: string | undefined): boolean => {
  const normalized = normalizeHex(hex);
  return normalized === '#000000' || normalized === '#000';
};

const isWhite = (hex: string | undefined): boolean => {
  const normalized = normalizeHex(hex);
  return normalized === '#FFFFFF' || normalized === '#FFF';
};

/**
 * Slots that must never be reassigned: slot 0 (transparent) plus any slot
 * holding pure black or pure white. Returns a sorted, de-duplicated list.
 */
export const getImmutableSlots = (palette: Screen5PaletteSlot[] | undefined): number[] => {
  const immutable = new Set<number>([0]);
  (palette || []).forEach((slot, index) => {
    const slotIndex = slot?.slotIndex ?? index;
    if (slotIndex === 0) return;
    if (isTransparent(slot?.hex) || isBlack(slot?.hex) || isWhite(slot?.hex)) {
      immutable.add(slotIndex);
    }
  });
  return Array.from(immutable).sort((a, b) => a - b);
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Builds default zones for a palette: sprites get the lower mutable slots
 * (≈2–5), tiles get the rest up to slot 15. Immutable slots (transparent +
 * black/white) are honoured when picking the boundaries.
 */
export const createDefaultPaletteZones = (palette?: Screen5PaletteSlot[]): Msx2PaletteZones => {
  const immutable = new Set(getImmutableSlots(palette));
  const lastSlot = SCREEN5_PALETTE_SLOT_COUNT - 1; // 15

  // First mutable slot at/above 1 is the sprite zone start.
  let spriteStart = 1;
  while (spriteStart <= lastSlot && immutable.has(spriteStart)) spriteStart += 1;
  if (spriteStart > lastSlot) spriteStart = 1;

  const tileEnd = lastSlot;

  // Default divider: aim for sprites ≈ slots 2..5, tiles ≈ 6..15. Keep it
  // within the mutable span and ensure at least one slot on each side.
  let divider = clamp(6, spriteStart + 1, tileEnd);
  if (divider <= spriteStart) divider = spriteStart + 1;

  return normalizePaletteZones({ spriteStart, divider, tileEnd }, palette);
};

/**
 * Normalizes zones: clamps to 0..15, keeps `spriteStart <= divider <= tileEnd`,
 * and guarantees the divider sits on a slot that is not immutable (so the
 * draggable boundary always lands on a reassignable slot).
 */
export const normalizePaletteZones = (
  zones: Msx2PaletteZones | undefined,
  palette?: Screen5PaletteSlot[],
): Msx2PaletteZones => {
  const lastSlot = SCREEN5_PALETTE_SLOT_COUNT - 1;
  const immutable = new Set(getImmutableSlots(palette));

  const fallback = (): Msx2PaletteZones => {
    let spriteStart = 1;
    while (spriteStart <= lastSlot && immutable.has(spriteStart)) spriteStart += 1;
    if (spriteStart > lastSlot) spriteStart = 1;
    return { spriteStart, divider: clamp(spriteStart + 1, 1, lastSlot), tileEnd: lastSlot };
  };

  if (!zones) return fallback();

  let spriteStart = clamp(Math.round(zones.spriteStart), 1, lastSlot);
  const tileEnd = clamp(Math.round(zones.tileEnd), spriteStart, lastSlot);
  let divider = clamp(Math.round(zones.divider), spriteStart, tileEnd);

  // Ensure spriteStart itself is the first non-immutable slot at/after 1.
  while (spriteStart < tileEnd && immutable.has(spriteStart)) spriteStart += 1;
  if (divider < spriteStart) divider = spriteStart;
  if (divider > tileEnd) divider = tileEnd;

  return { spriteStart, divider, tileEnd };
};

/** Mutable slots in [spriteStart .. divider-1], excluding immutable slots. */
export const getSpriteZoneSlots = (
  zones: Msx2PaletteZones,
  palette?: Screen5PaletteSlot[],
): number[] => {
  const immutable = new Set(getImmutableSlots(palette));
  const slots: number[] = [];
  for (let slot = zones.spriteStart; slot < zones.divider; slot++) {
    if (!immutable.has(slot)) slots.push(slot);
  }
  return slots;
};

/** Mutable slots in [divider .. tileEnd], excluding immutable slots. */
export const getTileZoneSlots = (
  zones: Msx2PaletteZones,
  palette?: Screen5PaletteSlot[],
): number[] => {
  const immutable = new Set(getImmutableSlots(palette));
  const slots: number[] = [];
  for (let slot = zones.divider; slot <= zones.tileEnd; slot++) {
    if (!immutable.has(slot)) slots.push(slot);
  }
  return slots;
};

/** Per-slot functional role, for rendering/labelling the zone bar. */
export type Msx2PaletteSlotRole = 'immutable' | 'sprite' | 'tile';

export const getSlotRole = (
  slotIndex: number,
  zones: Msx2PaletteZones,
  palette?: Screen5PaletteSlot[],
): Msx2PaletteSlotRole => {
  const immutable = new Set(getImmutableSlots(palette));
  if (immutable.has(slotIndex)) return 'immutable';
  if (slotIndex >= zones.divider && slotIndex <= zones.tileEnd) return 'tile';
  if (slotIndex >= zones.spriteStart && slotIndex < zones.divider) return 'sprite';
  // Slots outside [spriteStart..tileEnd] default to sprite (lower) / tile (higher).
  return slotIndex < zones.spriteStart ? 'sprite' : 'tile';
};

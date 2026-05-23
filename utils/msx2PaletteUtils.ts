import { MSXColor, Screen5PaletteSlot } from '../types';
import { DEFAULT_SCREEN5_CUSTOM_PALETTE, MSX_SCREEN5_MASTER_PALETTE } from '../constants';

export const SCREEN5_PALETTE_SLOT_COUNT = 16;
const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const cloneSlots = (slots: Screen5PaletteSlot[]): Screen5PaletteSlot[] =>
  slots.map(slot => ({ ...slot }));

const clampMasterIndex = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(0, value), MSX_SCREEN5_MASTER_PALETTE.length - 1);
};

export const createDefaultScreen5PaletteSlots = (): Screen5PaletteSlot[] =>
  cloneSlots(DEFAULT_SCREEN5_CUSTOM_PALETTE);

/**
 * Ensures an MSX2 V9938 palette definition always has 16 valid slots.
 * Returns both the sanitized slots and whether any changes were required.
 */
export const ensureScreen5PaletteSlots = (incoming?: Screen5PaletteSlot[]): { slots: Screen5PaletteSlot[]; changed: boolean } => {
  if (!incoming || incoming.length !== SCREEN5_PALETTE_SLOT_COUNT) {
    return { slots: createDefaultScreen5PaletteSlots(), changed: true };
  }

  let changed = false;
  const sanitized = incoming.map((slot, idx) => {
    const fallback = DEFAULT_SCREEN5_CUSTOM_PALETTE[idx];
    if (idx === 0) {
      const hex = slot?.hex === TRANSPARENT_HEX ? TRANSPARENT_HEX : fallback.hex;
      if (!slot || slot.slotIndex !== 0 || slot.masterIndex !== -1 || slot.hex !== hex) {
        changed = true;
      }
      return { slotIndex: 0, masterIndex: -1, hex };
    }

    if (!slot) {
      changed = true;
      return { ...fallback, slotIndex: idx };
    }

    const normalizedMasterIndex = clampMasterIndex(typeof slot.masterIndex === 'number' ? slot.masterIndex : fallback.masterIndex);
    const masterColor = MSX_SCREEN5_MASTER_PALETTE[normalizedMasterIndex] ?? MSX_SCREEN5_MASTER_PALETTE[fallback.masterIndex];
    const resolvedHex = masterColor?.hex ?? fallback.hex;

    if (slot.slotIndex !== idx || slot.masterIndex !== normalizedMasterIndex || slot.hex !== resolvedHex) {
      changed = true;
    }

    return {
      slotIndex: idx,
      masterIndex: normalizedMasterIndex,
      hex: resolvedHex,
    };
  });

  return { slots: changed ? sanitized : incoming, changed };
};

export const screen5SlotsToMsxColors = (slots: Screen5PaletteSlot[]): MSXColor[] =>
  slots.map((slot, idx) => ({
    name: idx === 0 ? 'Transparent' : `Slot ${idx}`,
    hex: slot.hex,
  }));

export const assignMasterColorToSlot = (
  slots: Screen5PaletteSlot[],
  slotIndex: number,
  masterIndex: number
): Screen5PaletteSlot[] => {
  if (slotIndex === 0) {
    return slots;
  }
  const updated = cloneSlots(slots);
  const clampedIndex = clampMasterIndex(masterIndex);
  const masterColor = MSX_SCREEN5_MASTER_PALETTE[clampedIndex];
  updated[slotIndex] = {
    slotIndex,
    masterIndex: clampedIndex,
    hex: masterColor.hex,
  };
  return updated;
};

export const getScreen5PaletteColor = (
  slots: Screen5PaletteSlot[] | undefined,
  slotIndex: number,
  fallback: string
): string => {
  if (!slots || !slots[slotIndex]) return fallback;
  return slots[slotIndex]!.hex;
};

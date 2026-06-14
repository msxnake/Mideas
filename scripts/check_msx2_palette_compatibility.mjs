import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const utilitySource = readFileSync('utils/msx2PaletteCompatibility.ts', 'utf8');

assert.match(
  utilitySource,
  /export const compareMsx2PalettesForUsedSlots/,
  'Palette compatibility helper must export compareMsx2PalettesForUsedSlots',
);
assert.match(
  utilitySource,
  /filter\(slot => slot > 0 && slot <= 15\)/,
  'Slot 0 transparency must be ignored when comparing SCREEN 4 sprite palettes',
);
assert.match(
  utilitySource,
  /getUsedMsx2SpritePaletteSlots/,
  'Palette comparison must be able to restrict checks to sprite pixels actually used',
);

const normalizeHex = value => String(value || '').trim().toUpperCase();

function compareMsx2PalettesForUsedSlots(screenPalette, assetPalette, usedSlots) {
  if (!assetPalette || assetPalette.length === 0) return [];
  const slotsToCompare = usedSlots.size > 0
    ? Array.from(usedSlots).filter(slot => slot > 0 && slot <= 15)
    : Array.from({ length: 15 }, (_, index) => index + 1);

  return slotsToCompare
    .map(slotIndex => {
      const screenSlot = screenPalette[slotIndex];
      const assetSlot = assetPalette[slotIndex];
      if (!screenSlot || !assetSlot) return null;
      const sameMaster = screenSlot.masterIndex === assetSlot.masterIndex;
      const sameHex = normalizeHex(screenSlot.hex) === normalizeHex(assetSlot.hex);
      if (sameMaster && sameHex) return null;
      return { slotIndex, screenHex: screenSlot.hex, assetHex: assetSlot.hex };
    })
    .filter(Boolean);
}

const palette = slots => slots.map((hex, slotIndex) => ({ slotIndex, masterIndex: slotIndex, hex }));
const screenPalette = palette([
  'rgba(0,0,0,0)', '#000000', '#3EB849', '#74D07D',
  '#2424B6', '#4949FF', '#B62424', '#66D9D9',
  '#FF4949', '#FF8A8A', '#B6B649', '#DBDB6D',
  '#249249', '#B649B6', '#929292', '#FFFFFF',
]);
const spritePalette = palette([
  'rgba(0,0,0,0)', '#000000', '#3EB849', '#74D07D',
  '#B6B6B6', '#244992', '#B62424', '#66D9D9',
  '#FF4949', '#FF8A8A', '#B6B649', '#DBDB6D',
  '#249249', '#B649B6', '#929292', '#FFFFFF',
]);

const mismatches = compareMsx2PalettesForUsedSlots(screenPalette, spritePalette, new Set([0, 4, 5, 15]));
assert.deepEqual(
  mismatches.map(item => [item.slotIndex, item.assetHex, item.screenHex]),
  [
    [4, '#B6B6B6', '#2424B6'],
    [5, '#244992', '#4949FF'],
  ],
  'Used sprite slots must report the exact RGB values that will change under the screen palette',
);

const unusedMismatch = compareMsx2PalettesForUsedSlots(screenPalette, spritePalette, new Set([0, 15]));
assert.equal(unusedMismatch.length, 0, 'Mismatched slots that are not used by the sprite must not warn');

console.log('MSX2 palette compatibility checks passed');

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScreen5PaletteColor = exports.assignMasterColorToSlot = exports.screen5SlotsToMsxColors = exports.ensureScreen5PaletteSlots = exports.createDefaultScreen5PaletteSlots = exports.SCREEN5_PALETTE_SLOT_COUNT = void 0;
const constants_1 = require("../constants");
exports.SCREEN5_PALETTE_SLOT_COUNT = 16;
const TRANSPARENT_HEX = 'rgba(0,0,0,0)';
const cloneSlots = (slots) => slots.map(slot => ({ ...slot }));
const clampMasterIndex = (value) => {
    if (Number.isNaN(value))
        return 0;
    return Math.min(Math.max(0, value), constants_1.MSX_SCREEN5_MASTER_PALETTE.length - 1);
};
const createDefaultScreen5PaletteSlots = () => cloneSlots(constants_1.DEFAULT_SCREEN5_CUSTOM_PALETTE);
exports.createDefaultScreen5PaletteSlots = createDefaultScreen5PaletteSlots;
/**
 * Ensures an MSX2 V9938 palette definition always has 16 valid slots.
 * Returns both the sanitized slots and whether any changes were required.
 */
const ensureScreen5PaletteSlots = (incoming) => {
    if (!incoming || incoming.length !== exports.SCREEN5_PALETTE_SLOT_COUNT) {
        return { slots: (0, exports.createDefaultScreen5PaletteSlots)(), changed: true };
    }
    let changed = false;
    const sanitized = incoming.map((slot, idx) => {
        const fallback = constants_1.DEFAULT_SCREEN5_CUSTOM_PALETTE[idx];
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
        const masterColor = constants_1.MSX_SCREEN5_MASTER_PALETTE[normalizedMasterIndex] ?? constants_1.MSX_SCREEN5_MASTER_PALETTE[fallback.masterIndex];
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
exports.ensureScreen5PaletteSlots = ensureScreen5PaletteSlots;
const screen5SlotsToMsxColors = (slots) => slots.map((slot, idx) => ({
    name: idx === 0 ? 'Transparent' : `Slot ${idx}`,
    hex: slot.hex,
}));
exports.screen5SlotsToMsxColors = screen5SlotsToMsxColors;
const assignMasterColorToSlot = (slots, slotIndex, masterIndex) => {
    if (slotIndex === 0) {
        return slots;
    }
    const updated = cloneSlots(slots);
    const clampedIndex = clampMasterIndex(masterIndex);
    const masterColor = constants_1.MSX_SCREEN5_MASTER_PALETTE[clampedIndex];
    updated[slotIndex] = {
        slotIndex,
        masterIndex: clampedIndex,
        hex: masterColor.hex,
    };
    return updated;
};
exports.assignMasterColorToSlot = assignMasterColorToSlot;
const getScreen5PaletteColor = (slots, slotIndex, fallback) => {
    if (!slots || !slots[slotIndex])
        return fallback;
    return slots[slotIndex].hex;
};
exports.getScreen5PaletteColor = getScreen5PaletteColor;

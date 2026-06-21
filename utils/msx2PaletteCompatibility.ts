import type {
  EnemyDefinition,
  Msx2PlayerDefinition,
  Msx2Screen4EntityInstance,
  Msx2Sprite,
  ProjectAsset,
  Screen5PaletteSlot,
} from '../types';
import { ensureScreen5PaletteSlots } from './msx2PaletteUtils';

export interface Msx2PaletteSlotMismatch {
  slotIndex: number;
  screenHex: string;
  assetHex: string;
  screenMasterIndex: number;
  assetMasterIndex: number;
}

export interface Msx2PaletteCompatibilityIssue {
  spriteAssetId: string;
  spriteName: string;
  ownerLabel: string;
  mismatches: Msx2PaletteSlotMismatch[];
}

const normalizeHex = (value: unknown): string =>
  String(value || '').trim().toUpperCase();

const addNonEmpty = (ids: Set<string>, value: unknown) => {
  const id = String(value || '').trim();
  if (id) ids.add(id);
};

const unwrapMsx2PlayerDefinition = (value: unknown): Partial<Msx2PlayerDefinition> | undefined => {
  const candidate = value as { player?: Partial<Msx2PlayerDefinition> } & Partial<Msx2PlayerDefinition> | undefined;
  return candidate?.player || candidate;
};

export const getUsedMsx2SpritePaletteSlots = (sprite: Msx2Sprite): Set<number> => {
  const used = new Set<number>();
  for (const frame of sprite.frames || []) {
    for (const row of frame.data || []) {
      for (const cell of row || []) {
        const slot = Number(cell);
        if (Number.isInteger(slot) && slot >= 0 && slot <= 15) used.add(slot);
      }
    }
  }
  return used;
};

export const compareMsx2PalettesForUsedSlots = (
  screenPalette: Screen5PaletteSlot[],
  assetPalette: Screen5PaletteSlot[] | undefined,
  usedSlots: Set<number>,
): Msx2PaletteSlotMismatch[] => {
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
      return {
        slotIndex,
        screenHex: screenSlot.hex,
        assetHex: assetSlot.hex,
        screenMasterIndex: screenSlot.masterIndex,
        assetMasterIndex: assetSlot.masterIndex,
      };
    })
    .filter((item): item is Msx2PaletteSlotMismatch => item !== null);
};

export const resolveMsx2PlayerSpriteIds = (player: Msx2PlayerDefinition | { player?: Msx2PlayerDefinition } | undefined): string[] => {
  const definition = unwrapMsx2PlayerDefinition(player);
  const ids = new Set<string>();
  addNonEmpty(ids, definition?.render?.spriteAssetId);
  Object.values(definition?.animations || {}).forEach(animation => addNonEmpty(ids, animation?.spriteAssetId));
  return Array.from(ids);
};

export const resolveMsx2EnemySpriteIds = (enemy: EnemyDefinition | undefined): string[] => {
  const ids = new Set<string>();
  addNonEmpty(ids, enemy?.render?.spriteId);
  (enemy?.render?.roles || []).forEach(role => addNonEmpty(ids, role?.spriteId));
  return Array.from(ids);
};

export const resolveMsx2EntitySpriteIds = (entity: Msx2Screen4EntityInstance | undefined): string[] => {
  const ids = new Set<string>();
  addNonEmpty(ids, entity?.spriteAssetId);
  addNonEmpty(ids, entity?.components?.msx2_hardware_sprite?.msx2SpriteAssetId);
  addNonEmpty(ids, entity?.components?.msx2_render?.msx2SpriteAssetId);
  addNonEmpty(ids, entity?.components?.msx2_render?.spriteAssetId);
  addNonEmpty(ids, entity?.components?.msx2_push_box?.msx2SpriteAssetId);
  addNonEmpty(ids, entity?.components?.msx2_push_box?.spriteAssetId);
  addNonEmpty(ids, entity?.params?.msx2SpriteAssetId);
  addNonEmpty(ids, entity?.params?.spriteAssetId);
  addNonEmpty(ids, entity?.params?.spriteId);
  return Array.from(ids);
};

/**
 * Slot indices (1-15) actually referenced by the sprite's pixels, matched by HEX
 * against the sprite's own palette — exactly how the ROM generator resolves a
 * pixel to a hardware color (`paletteSlotForSpriteColor`). Note this differs from
 * {@link getUsedMsx2SpritePaletteSlots}, which treats pixels as numeric slot
 * indices; MSX2 sprite pixel data stores hex color strings, so hex matching is
 * the correct source of "which slots does this sprite use".
 */
export const getUsedMsx2SpriteSlotsByHex = (sprite: Msx2Sprite): Set<number> => {
  const hexToSlot = new Map<string, number>();
  (sprite.palette || []).forEach(slot => {
    if (slot && typeof slot.slotIndex === 'number' && slot.slotIndex > 0) {
      hexToSlot.set(normalizeHex(slot.hex), slot.slotIndex);
    }
  });
  const background = normalizeHex(sprite.backgroundColor);
  const transparent = normalizeHex('rgba(0,0,0,0)');
  const used = new Set<number>();
  for (const frame of sprite.frames || []) {
    for (const row of frame.data || []) {
      for (const cell of row || []) {
        const hex = normalizeHex(cell);
        if (!hex || hex === background || hex === transparent) continue;
        const slot = hexToSlot.get(hex);
        if (typeof slot === 'number' && slot > 0 && slot < 16) used.add(slot);
      }
    }
  }
  return used;
};

export interface Msx2SpritePaletteReconcileResult {
  /** Project palette slots after merging the sprite's used slots (always 16). */
  slots: Screen5PaletteSlot[];
  /** True when at least one slot changed. */
  changed: boolean;
  /** The slot indices that were overwritten with the sprite's color. */
  overwrittenSlots: number[];
}

/**
 * Reconciles a library sprite into the project's single shared SCREEN 5 palette.
 *
 * The V9938 loads ONE 16-color palette for the whole ROM, but a library sprite
 * carries its own palette. Without reconciliation the generator emits the
 * sprite's slot indices while the VDP shows the project's colors at those slots,
 * so imported sprites render with the wrong colors — and OR-color sprites worst
 * of all, because the hardware OR overlap color lives at slot `base|overlay` and
 * must match too.
 *
 * Policy (chosen by the user): the sprite wins. Each slot the sprite actually
 * uses is copied into the project palette at the SAME slot index, overwriting
 * whatever was there. Keeping the indices is what preserves the OR relation
 * `base|overlay = result`. Slot 0 (transparent) is never touched. The VDP color
 * is driven by `masterIndex`, so that is what makes the ROM correct; hex is kept
 * in sync for the editors.
 */
export const reconcileMsx2SpriteIntoProjectPalette = (
  sprite: Msx2Sprite,
  projectSlots: Screen5PaletteSlot[] | undefined,
): Msx2SpritePaletteReconcileResult => {
  const target = ensureScreen5PaletteSlots(projectSlots).slots.map(slot => ({ ...slot }));
  const spriteSlots = sprite.palette || [];
  const used = getUsedMsx2SpriteSlotsByHex(sprite);
  const overwrittenSlots: number[] = [];
  used.forEach(index => {
    const source = spriteSlots.find(slot => slot && slot.slotIndex === index);
    const destination = target[index];
    if (!source || !destination) return;
    const sourceMaster = typeof source.masterIndex === 'number' ? source.masterIndex : destination.masterIndex;
    if (destination.masterIndex !== sourceMaster || normalizeHex(destination.hex) !== normalizeHex(source.hex)) {
      target[index] = { slotIndex: index, masterIndex: sourceMaster, hex: source.hex };
      overwrittenSlots.push(index);
    }
  });
  return { slots: target, changed: overwrittenSlots.length > 0, overwrittenSlots: overwrittenSlots.sort((a, b) => a - b) };
};

export const collectMsx2PaletteCompatibilityIssues = (
  screenPalette: Screen5PaletteSlot[],
  allAssets: ProjectAsset[],
  spriteAssetIds: string[],
  ownerLabel: string,
): Msx2PaletteCompatibilityIssue[] => {
  const uniqueSpriteIds = Array.from(new Set(spriteAssetIds.map(id => id.trim()).filter(Boolean)));
  return uniqueSpriteIds.flatMap(spriteAssetId => {
    const asset = allAssets.find(candidate => candidate.type === 'msx2sprite' && candidate.id === spriteAssetId);
    const sprite = asset?.data as Msx2Sprite | undefined;
    if (!sprite?.palette) return [];
    const mismatches = compareMsx2PalettesForUsedSlots(
      screenPalette,
      sprite.palette,
      getUsedMsx2SpritePaletteSlots(sprite),
    );
    return mismatches.length
      ? [{
        spriteAssetId,
        spriteName: asset?.name || sprite.name || spriteAssetId,
        ownerLabel,
        mismatches,
      }]
      : [];
  });
};

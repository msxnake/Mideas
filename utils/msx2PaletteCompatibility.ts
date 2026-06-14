import type {
  EnemyDefinition,
  Msx2PlayerDefinition,
  Msx2Screen4EntityInstance,
  Msx2Sprite,
  ProjectAsset,
  Screen5PaletteSlot,
} from '../types';

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

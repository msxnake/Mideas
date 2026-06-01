import { Msx2Screen4TileScreen } from '../../../../types';
import {
  getComponentValue,
  getMsx2GridSnapCharBlockFromEntity,
  getMsx2GridSnapSettings,
  resolveMsx2GridSnapCharBase,
  snapPixelToGrid,
} from './msx2GridSnapComponentGenerator';

export const MSX2_MAX_PUSH_BOXES_PER_SCREEN = 8;
export const MSX2_PUSH_BOX_STATE_BYTES = 6;

export const MSX2_PUSH_AXIS_HORIZONTAL = 0;
export const MSX2_PUSH_AXIS_VERTICAL = 1;
export const MSX2_PUSH_AXIS_BOTH = 2;

export interface Msx2PushBoxRuntimeSlot {
  x: number;
  y: number;
  charBase: number;
  pushAxis: number;
  moveSpeed: number;
  gravity: number;
  gridUnit: number;
  charWidth: number;
  charHeight: number;
  spriteAssetId: string;
  paletteSlot: number;
  pattern: number[];
  color: number[];
}

const clampTileCoordinate = (value: unknown, max: number): number =>
  Math.max(0, Math.min(max, Number(value) || 0));

const clampHardwareSpriteCoord = (value: number, max: number): number =>
  Math.max(0, Math.min(max, value));

const normalizePushAxis = (value: unknown): number => {
  const token = String(value || 'horizontal').replace(/[\s_-]+/g, '').toLowerCase();
  if (token === 'vertical' || token === 'y') return MSX2_PUSH_AXIS_VERTICAL;
  if (token === 'both' || token === 'all' || token === 'xy') return MSX2_PUSH_AXIS_BOTH;
  return MSX2_PUSH_AXIS_HORIZONTAL;
};

export function normalizePushBoxGravity(value: unknown, defaultValue = true): number {
  if (value === false || value === 'false' || value === 0 || value === '0') return 0;
  if (value === true || value === 'true' || value === 1 || value === '1') return 1;
  return defaultValue ? 1 : 0;
}

export function entityHasMsx2PushBox(entity: any): boolean {
  return Boolean(entity?.components?.msx2_push_box || entity?.params?.pushBox || entity?.params?.engine === 'pushBox');
}

/** Resolve a screen tile index from msx2_char_render.tileIndex, tileId, or params. */
export function resolveMsx2CharRenderTileIndex(screen: Msx2Screen4TileScreen | undefined, entity: any): number | undefined {
  const charRender = entity?.components?.msx2_char_render;
  const tileId = String(charRender?.tileId ?? entity?.params?.tileId ?? '').trim();
  if (tileId && screen?.tiles?.length) {
    const byId = screen.tiles.findIndex(tile => String(tile?.id || '') === tileId);
    if (byId >= 0) return byId;
  }
  const explicitTileIndex = Number(charRender?.tileIndex ?? entity?.params?.tileIndex);
  if (Number.isFinite(explicitTileIndex) && explicitTileIndex >= 0) return explicitTileIndex;
  return undefined;
}

export function getMsx2PushBoxRuntimeSlots(
  screen: Msx2Screen4TileScreen | undefined,
  resolveTileBytes: (screen: Msx2Screen4TileScreen | undefined, entity: any) => { pattern: number[]; color: number[] } | undefined
): Msx2PushBoxRuntimeSlot[] {
  const reservedBases: number[] = [];
  return (screen?.layers?.entities || [])
    .filter(entity => entityHasMsx2PushBox(entity) && entity.position)
    .slice(0, MSX2_MAX_PUSH_BOXES_PER_SCREEN)
    .map(entity => {
      const grid = getMsx2GridSnapSettings(entity);
      const restGridUnit = Math.max(8, grid.gridUnit);
      const tileX = clampTileCoordinate(entity.position?.x, 15);
      const tileY = clampTileCoordinate(entity.position?.y, 11);
      const pixelX = snapPixelToGrid(
        clampHardwareSpriteCoord(
          Number(getComponentValue(entity, 'msx2_transform', 'pixelX', tileX * 16)),
          240
        ),
        restGridUnit
      );
      const pixelY = snapPixelToGrid(
        clampHardwareSpriteCoord(
          Number(getComponentValue(entity, 'msx2_transform', 'pixelY', tileY * 16)),
          176
        ),
        restGridUnit
      );
      const charBlock = getMsx2GridSnapCharBlockFromEntity(screen, entity, resolveTileBytes);
      const charBase = resolveMsx2GridSnapCharBase(entity, reservedBases, charBlock.charBase);
      reservedBases.push(charBase);
      const moveSpeed = Math.max(1, Math.min(4, Number(
        getComponentValue(entity, 'msx2_push_box', 'moveSpeed', entity.params?.moveSpeed ?? 1)
      ) || 1));
      const pushAxis = normalizePushAxis(
        getComponentValue(entity, 'msx2_push_box', 'pushAxis', entity.params?.pushAxis ?? 'horizontal')
      );
      const gravity = normalizePushBoxGravity(
        getComponentValue(entity, 'msx2_push_box', 'gravity', entity.params?.gravity ?? true),
        true
      );
      const spriteAssetId = String(
        getComponentValue(entity, 'msx2_hardware_sprite', 'msx2SpriteAssetId', entity.params?.msx2SpriteAssetId ?? '')
      );
      const paletteSlot = Math.max(1, Math.min(15, Number(
        getComponentValue(entity, 'msx2_hardware_sprite', 'paletteSlot',
          getComponentValue(entity, 'msx2_char_render', 'paletteSlot', entity.params?.paletteSlot ?? 6))
      ) || 6));
      return {
        x: pixelX,
        y: pixelY,
        charBase,
        pushAxis,
        moveSpeed,
        gravity,
        gridUnit: restGridUnit,
        charWidth: grid.charWidth,
        charHeight: grid.charHeight,
        spriteAssetId,
        paletteSlot,
        pattern: charBlock.pattern,
        color: charBlock.color,
      };
    });
}

export function getFirstPushBoxEntity(
  screens: Array<Msx2Screen4TileScreen | undefined>
): any | undefined {
  for (const screen of screens) {
    const entity = (screen?.layers?.entities || []).find(candidate => entityHasMsx2PushBox(candidate));
    if (entity) return entity;
  }
  return undefined;
}

export function usesMsx2PushBoxFromScreens(
  screens: Array<Msx2Screen4TileScreen | undefined>
): boolean {
  return screens.some(screen =>
    (screen?.layers?.entities || []).some(entity => entityHasMsx2PushBox(entity))
  );
}

export function usesMsx2PushBoxVerticalPush(
  screens: Array<Msx2Screen4TileScreen | undefined>
): boolean {
  const isVerticalAxis = (value: unknown): boolean => {
    const token = String(value || 'horizontal').replace(/[\s_-]+/g, '').toLowerCase();
    return token === 'vertical' || token === 'y' || token === 'both' || token === 'all' || token === 'xy';
  };
  return screens.some(screen =>
    (screen?.layers?.entities || []).some(entity =>
      entityHasMsx2PushBox(entity)
      && isVerticalAxis(entity?.components?.msx2_push_box?.pushAxis ?? entity?.params?.pushAxis)
    )
  );
}

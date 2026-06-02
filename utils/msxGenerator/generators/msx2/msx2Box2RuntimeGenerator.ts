import { Msx2Screen4TileScreen } from '../../../../types';
import { getMsx2TileBehaviorKind } from '../../../msx2Screen4TileBehavior';
import { normalizeBox2Axis, normalizeBox2Gravity } from '../../../msx2Box2Runtime';
import {
  getComponentValue,
  getMsx2GridSnapCharBlockFromEntity,
  getMsx2GridSnapSettings,
  resolveMsx2GridSnapCharBase,
  snapPixelToGrid,
} from './msx2GridSnapComponentGenerator';

export const MSX2_MAX_BOX2_PER_SCREEN = 8;

export interface Msx2Box2RuntimeSlot {
  x: number;
  y: number;
  charBase: number;
  pushAxis: number;
  slideSpeed: number;
  gravity: number;
  requiresAlignment: number;
  gridUnit: number;
  charWidth: number;
  charHeight: number;
  spriteAssetId: string;
  paletteSlot: number;
  pattern: number[];
  color: number[];
  /** True when this slot comes from a painted map tile (behaviorKind box), not an entity. */
  mapOrigin?: boolean;
  /** SCREEN 4 name-table quad to restore under a map-origin box when it slides away. */
  restoreNameBytes?: [number, number, number, number];
  mapTileIndex?: number;
  mapCellX?: number;
  mapCellY?: number;
}

export type Msx2Box2NameLayout = {
  charBaseAtTile: (tileX: number, tileY: number) => number;
  restoreNameQuadAtTile: (tileX: number, tileY: number) => [number, number, number, number];
};

const MSX2_BOX2_SCREEN_TILE_WIDTH = 16;
const MSX2_BOX2_SCREEN_TILE_HEIGHT = 12;

export function screenHasMapBoxTiles(screen: Msx2Screen4TileScreen | undefined): boolean {
  const tiles = screen?.tiles || [];
  const map = screen?.map || [];
  const height = screen?.heightTiles || MSX2_BOX2_SCREEN_TILE_HEIGHT;
  const width = screen?.widthTiles || MSX2_BOX2_SCREEN_TILE_WIDTH;
  for (let tileY = 0; tileY < height; tileY++) {
    for (let tileX = 0; tileX < width; tileX++) {
      const tileIndex = Math.max(0, Math.min(tiles.length - 1, Number(map[tileY]?.[tileX]) || 0));
      if (getMsx2TileBehaviorKind(tiles[tileIndex]) === 'box') return true;
    }
  }
  return false;
}

function slotOccupiesCell(slot: Msx2Box2RuntimeSlot): string {
  const tileX = Math.floor(slot.x / 16);
  const tileY = Math.floor(slot.y / 16);
  return `${tileX},${tileY}`;
}

function buildMapBoxTileSlots(
  screen: Msx2Screen4TileScreen | undefined,
  nameLayout: Msx2Box2NameLayout,
  resolveTileBytes: (screen: Msx2Screen4TileScreen | undefined, entity: any) => { pattern: number[]; color: number[] } | undefined,
  occupiedCells: Set<string>
): Msx2Box2RuntimeSlot[] {
  if (!screen) return [];
  const tiles = screen.tiles || [];
  const map = screen.map || [];
  const height = screen.heightTiles || MSX2_BOX2_SCREEN_TILE_HEIGHT;
  const width = screen.widthTiles || MSX2_BOX2_SCREEN_TILE_WIDTH;
  const playerPushBox = (screen.layers?.entities || []).find(entity => playerHasMsx2PushBox(entity))?.components?.msx2_push_box || {};
  const pushAxis = normalizeBox2Axis(playerPushBox.pushAxis ?? 'horizontal');
  const slideSpeed = Math.max(1, Math.min(4, Number(playerPushBox.slideSpeed ?? 1) || 1));
  const gravity = normalizeBox2Gravity(playerPushBox.gravity, true) ? 1 : 0;
  const slots: Msx2Box2RuntimeSlot[] = [];
  for (let tileY = 0; tileY < height; tileY++) {
    for (let tileX = 0; tileX < width; tileX++) {
      const cellKey = `${tileX},${tileY}`;
      if (occupiedCells.has(cellKey)) continue;
      const tileIndex = Math.max(0, Math.min(tiles.length - 1, Number(map[tileY]?.[tileX]) || 0));
      const tile = tiles[tileIndex];
      if (getMsx2TileBehaviorKind(tile) !== 'box') continue;
      occupiedCells.add(cellKey);
      const pseudoEntity = { params: { tileIndex } };
      const bytes = resolveTileBytes(screen, pseudoEntity) || { pattern: Array(32).fill(0), color: Array(32).fill(0) };
      slots.push({
        x: tileX * 16,
        y: tileY * 16,
        charBase: nameLayout.charBaseAtTile(tileX, tileY),
        pushAxis,
        slideSpeed,
        gravity,
        requiresAlignment: 1,
        gridUnit: 16,
        charWidth: 2,
        charHeight: 2,
        spriteAssetId: '',
        paletteSlot: 6,
        pattern: bytes.pattern,
        color: bytes.color,
        mapOrigin: true,
        restoreNameBytes: nameLayout.restoreNameQuadAtTile(tileX, tileY),
        mapTileIndex: tileIndex,
        mapCellX: tileX,
        mapCellY: tileY,
      });
    }
  }
  return slots;
}

const clampTileCoordinate = (value: unknown, max: number): number =>
  Math.max(0, Math.min(max, Number(value) || 0));

const clampHardwareSpriteCoord = (value: number, max: number): number =>
  Math.max(0, Math.min(max, value));

/** True for msx2_box2 and legacy msx2_push_box entities. */
export function entityHasMsx2Box2(entity: any): boolean {
  if (entity?.kind === 'player') return false;
  if (entity?.components?.msx2_box2) return true;
  if (entity?.components?.msx2_push_box) return true;
  const engine = String(entity?.params?.engine || '').replace(/[\s_-]+/g, '').toLowerCase();
  return engine === 'box2' || engine === 'pushbox' || entity?.params?.pushBox === true || entity?.params?.box2 === true;
}

export function playerHasMsx2PushBox(entity: any): boolean {
  if (entity?.kind !== 'player') return false;
  const pushBox = entity?.components?.msx2_push_box;
  if (!pushBox) return false;
  return pushBox.enabled !== false;
}

function screenHasPlayerEntry(screen: Msx2Screen4TileScreen | undefined): boolean {
  return Array.isArray(screen?.playerEntries) && screen.playerEntries.length > 0;
}

function readBox2Field(entity: any, box2Key: string, legacyKey: string, fallback: unknown): unknown {
  const box2 = entity?.components?.msx2_box2;
  if (box2 && box2[box2Key] !== undefined) return box2[box2Key];
  const legacy = entity?.components?.msx2_push_box;
  if (legacy && legacy[legacyKey] !== undefined) return legacy[legacyKey];
  if (entity?.params?.[box2Key] !== undefined) return entity.params[box2Key];
  if (entity?.params?.[legacyKey] !== undefined) return entity.params[legacyKey];
  return fallback;
}

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

export function getMsx2Box2RuntimeSlots(
  screen: Msx2Screen4TileScreen | undefined,
  resolveTileBytes: (screen: Msx2Screen4TileScreen | undefined, entity: any) => { pattern: number[]; color: number[] } | undefined
): Msx2Box2RuntimeSlot[] {
  const reservedBases: number[] = [];
  return (screen?.layers?.entities || [])
    .filter(entity => entityHasMsx2Box2(entity) && entity.position)
    .slice(0, MSX2_MAX_BOX2_PER_SCREEN)
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
      const slideSpeed = Math.max(1, Math.min(4, Number(
        readBox2Field(entity, 'slideSpeed', 'moveSpeed', 1)
      ) || 1));
      const pushAxis = normalizeBox2Axis(readBox2Field(entity, 'pushAxis', 'pushAxis', 'horizontal'));
      const gravity = normalizeBox2Gravity(readBox2Field(entity, 'gravity', 'gravity', true), true) ? 1 : 0;
      const requiresAlignment = readBox2Field(entity, 'requiresAlignment', 'requiresAlignment', true) !== false ? 1 : 0;
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
        slideSpeed,
        gravity,
        requiresAlignment,
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

export function getMsx2Box2RuntimeSlotsForScreen(
  screen: Msx2Screen4TileScreen | undefined,
  resolveTileBytes: (screen: Msx2Screen4TileScreen | undefined, entity: any) => { pattern: number[]; color: number[] } | undefined,
  nameLayout?: Msx2Box2NameLayout
): Msx2Box2RuntimeSlot[] {
  const entitySlots = getMsx2Box2RuntimeSlots(screen, resolveTileBytes);
  const occupiedCells = new Set(entitySlots.map(slotOccupiesCell));
  const mapSlots = nameLayout ? buildMapBoxTileSlots(screen, nameLayout, resolveTileBytes, occupiedCells) : [];
  return [...entitySlots, ...mapSlots].slice(0, MSX2_MAX_BOX2_PER_SCREEN);
}

export function getFirstBox2Entity(
  screens: Array<Msx2Screen4TileScreen | undefined>
): any | undefined {
  for (const screen of screens) {
    const entity = (screen?.layers?.entities || []).find(candidate => entityHasMsx2Box2(candidate));
    if (entity) return entity;
  }
  return undefined;
}

export function usesMsx2Box2FromScreens(
  screens: Array<Msx2Screen4TileScreen | undefined>
): boolean {
  return screens.some(screen =>
    (screen?.layers?.entities || []).some(entity => entityHasMsx2Box2(entity))
    || (screenHasMapBoxTiles(screen) && (
      screenHasPlayerEntry(screen)
      || (screen?.layers?.entities || []).some(entity => playerHasMsx2PushBox(entity))
    ))
  );
}

export function usesMsx2Box2VerticalPush(
  screens: Array<Msx2Screen4TileScreen | undefined>
): boolean {
  return screens.some(screen =>
    (screen?.layers?.entities || []).some(entity => {
      if (!entityHasMsx2Box2(entity)) return false;
      const axis = normalizeBox2Axis(readBox2Field(entity, 'pushAxis', 'pushAxis', 'horizontal'));
      return axis === 1 || axis === 2;
    })
  );
}

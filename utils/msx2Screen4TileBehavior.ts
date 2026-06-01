import { Msx2Screen4Tile, Msx2Screen4TileBehaviorKind, Msx2Screen4TileHitbox, Msx2Screen4TileScreen } from '../types';

export type Msx2Screen4TileBehaviorFilter = Msx2Screen4TileBehaviorKind | 'all';

export const MSX2_TILE_BEHAVIOR_KINDS: Msx2Screen4TileBehaviorKind[] = [
  'background',
  'foreground',
  'dangerous',
  'box',
];

export const MSX2_TILE_BEHAVIOR_LABELS: Record<Msx2Screen4TileBehaviorKind, string> = {
  background: 'Fondo',
  foreground: 'Frente / Colisión',
  dangerous: 'Peligro',
  box: 'Caja',
};

export const MSX2_TILE_BEHAVIOR_DESCRIPTIONS: Record<Msx2Screen4TileBehaviorKind, string> = {
  background: 'Solo aspecto visual. Sin colisión ni daño.',
  foreground: 'Plataformas, suelo, techo y sólidos.',
  dangerous: 'Pinchos, fuego, eléctrico, ácido (hazard).',
  box: 'Cajas empujables (box2). Colisión dinámica en runtime, no en esta capa.',
};

export const MSX2_TILE_BEHAVIOR_COLORS: Record<Msx2Screen4TileBehaviorKind, string> = {
  background: '#64748b',
  foreground: '#3b82f6',
  dangerous: '#f472b6',
  box: '#f59e0b',
};

const clampHitboxCoord = (value: unknown, max: number): number =>
  Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));

export const getDefaultHitboxForBehavior = (
  kind: Msx2Screen4TileBehaviorKind,
  tileWidth = 16,
  tileHeight = 16
): Msx2Screen4TileHitbox => {
  if (kind === 'background') {
    return { offsetX: 0, offsetY: 0, width: 0, height: 0 };
  }
  return { offsetX: 0, offsetY: 0, width: tileWidth, height: tileHeight };
};

export const normalizeMsx2TileBehaviorKind = (value: unknown): Msx2Screen4TileBehaviorKind =>
  MSX2_TILE_BEHAVIOR_KINDS.includes(value as Msx2Screen4TileBehaviorKind)
    ? value as Msx2Screen4TileBehaviorKind
    : 'background';

export const getMsx2TileBehaviorKind = (tile: Msx2Screen4Tile | undefined): Msx2Screen4TileBehaviorKind =>
  normalizeMsx2TileBehaviorKind(tile?.behaviorKind);

export const normalizeMsx2TileHitbox = (
  tile: Msx2Screen4Tile | undefined,
  tileWidth = 16,
  tileHeight = 16
): Msx2Screen4TileHitbox => {
  const kind = getMsx2TileBehaviorKind(tile);
  const fallback = getDefaultHitboxForBehavior(kind, tileWidth, tileHeight);
  const hitbox = tile?.hitbox;
  if (!hitbox) return fallback;
  const width = clampHitboxCoord(hitbox.width, tileWidth);
  const height = clampHitboxCoord(hitbox.height, tileHeight);
  const maxOffsetX = Math.max(0, tileWidth - width);
  const maxOffsetY = Math.max(0, tileHeight - height);
  return {
    offsetX: clampHitboxCoord(hitbox.offsetX, maxOffsetX),
    offsetY: clampHitboxCoord(hitbox.offsetY, maxOffsetY),
    width,
    height,
  };
};

export const normalizeMsx2Screen4TileBehavior = (
  tile: Msx2Screen4Tile,
  tileWidth = 16,
  tileHeight = 16
): Msx2Screen4Tile => {
  const behaviorKind = getMsx2TileBehaviorKind(tile);
  return {
    ...tile,
    behaviorKind,
    hitbox: normalizeMsx2TileHitbox({ ...tile, behaviorKind }, tileWidth, tileHeight),
  };
};

export const resolveMsx2TileRuntimeLayers = (
  tile: Msx2Screen4Tile | undefined
): { collision: number; effect: number } => {
  const kind = getMsx2TileBehaviorKind(tile);
  if (kind === 'foreground') {
    return { collision: 1, effect: 0 };
  }
  if (kind === 'box') {
    return { collision: 0, effect: 0 };
  }
  if (kind === 'dangerous') {
    return { collision: 0, effect: 1 };
  }
  return { collision: 0, effect: 0 };
};

/** Remove stale collision-mask bytes under painted box tiles (box2 owns runtime collision). */
export const stripMsx2BoxTileCollisionFromLayer = (
  map: number[][],
  tiles: Msx2Screen4Tile[],
  collision: number[][]
): number[][] => {
  const maxTileIndex = Math.max(0, tiles.length - 1);
  return collision.map((row, y) =>
    row.map((value, x) => {
      const tileIndex = Math.max(0, Math.min(maxTileIndex, Number(map[y]?.[x]) || 0));
      if (getMsx2TileBehaviorKind(tiles[tileIndex]) !== 'box') return value;
      return 0;
    })
  );
};

/** Apply collision/effects for one map cell from the painted tile behavior. */
export const applyMsx2TileBehaviorToMapCell = (
  tile: Msx2Screen4Tile | undefined,
  x: number,
  y: number,
  collision: number[][],
  effects: number[][]
): void => {
  const { collision: collisionValue, effect } = resolveMsx2TileRuntimeLayers(tile);
  if (collision[y]?.[x] !== undefined) {
    collision[y][x] = collisionValue;
  }
  if (effects[y]?.[x] !== undefined) {
    effects[y][x] = effect;
  }
};

export const filterMsx2TilesByBehavior = (
  tiles: Msx2Screen4Tile[],
  filter: Msx2Screen4TileBehaviorFilter
): Array<{ tile: Msx2Screen4Tile; index: number }> =>
  tiles
    .map((tile, index) => ({ tile, index }))
    .filter(entry => filter === 'all' || getMsx2TileBehaviorKind(entry.tile) === filter);

export const countMsx2TilesByBehavior = (
  tiles: Msx2Screen4Tile[]
): Record<Msx2Screen4TileBehaviorKind, number> => ({
  background: tiles.filter(tile => getMsx2TileBehaviorKind(tile) === 'background').length,
  foreground: tiles.filter(tile => getMsx2TileBehaviorKind(tile) === 'foreground').length,
  dangerous: tiles.filter(tile => getMsx2TileBehaviorKind(tile) === 'dangerous').length,
  box: tiles.filter(tile => getMsx2TileBehaviorKind(tile) === 'box').length,
});

export const getMsx2TilePixelSize = (
  tile: Msx2Screen4Tile | undefined
): { width: number; height: number } => {
  const width = Math.max(8, Math.min(32, Number(tile?.width ?? tile?.pixels?.[0]?.length ?? 16) || 16));
  const height = Math.max(8, Math.min(32, Number(tile?.height ?? tile?.pixels?.length ?? 16) || 16));
  return { width, height };
};

export const isPixelInsideMsx2TileHitbox = (
  tile: Msx2Screen4Tile | undefined,
  localX: number,
  localY: number
): boolean => {
  const kind = getMsx2TileBehaviorKind(tile);
  if (kind !== 'dangerous') return false;
  const { width: tileWidth, height: tileHeight } = getMsx2TilePixelSize(tile);
  const hitbox = normalizeMsx2TileHitbox(tile, tileWidth, tileHeight);
  if (hitbox.width <= 0 || hitbox.height <= 0) return false;
  return localX >= hitbox.offsetX
    && localX < hitbox.offsetX + hitbox.width
    && localY >= hitbox.offsetY
    && localY < hitbox.offsetY + hitbox.height;
};

export const checkMsx2HazardAtWorldPixel = (
  screen: Msx2Screen4TileScreen,
  pixelX: number,
  pixelY: number,
  tileSize = 16
): boolean => {
  if (pixelX < 0 || pixelY < 0) return false;
  const tileX = Math.floor(pixelX / tileSize);
  const tileY = Math.floor(pixelY / tileSize);
  if (tileX < 0 || tileX >= (screen.widthTiles || 16) || tileY < 0 || tileY >= (screen.heightTiles || 12)) {
    return false;
  }
  const tileIndex = screen.map?.[tileY]?.[tileX] ?? 0;
  const tile = screen.tiles?.[tileIndex];
  const effectCell = screen.layers?.effects?.[tileY]?.[tileX] ?? 0;
  if (getMsx2TileBehaviorKind(tile) !== 'dangerous' && effectCell !== 1) return false;
  const localX = pixelX - tileX * tileSize;
  const localY = pixelY - tileY * tileSize;
  return isPixelInsideMsx2TileHitbox(tile, localX, localY);
};

export const buildMsx2TileVisualMapBytes = (screen: Msx2Screen4TileScreen | undefined): number[] => {
  const width = screen?.widthTiles || 16;
  const height = screen?.heightTiles || 12;
  const bytes: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      bytes.push(Math.max(0, Math.min(255, Number(screen?.map?.[y]?.[x]) || 0)));
    }
  }
  return bytes;
};

export const buildMsx2TileHazardHitboxBytes = (
  screen: Msx2Screen4TileScreen | undefined,
  paddedTileSlots?: number
): number[] => {
  const tiles = screen?.tiles || [];
  const slotCount = Math.max(1, paddedTileSlots ?? (tiles.length || 1));
  const bytes: number[] = [];
  tiles.forEach(tile => {
    const { width, height } = getMsx2TilePixelSize(tile);
    const kind = getMsx2TileBehaviorKind(tile);
    const hitbox = normalizeMsx2TileHitbox(tile, width, height);
    if (kind !== 'dangerous' || hitbox.width <= 0 || hitbox.height <= 0) {
      bytes.push(0, 0, 0, 0);
      return;
    }
    bytes.push(hitbox.offsetX, hitbox.offsetY, hitbox.width, hitbox.height);
  });
  while (bytes.length < slotCount * 4) {
    bytes.push(0, 0, 0, 0);
  }
  return bytes.slice(0, slotCount * 4);
};

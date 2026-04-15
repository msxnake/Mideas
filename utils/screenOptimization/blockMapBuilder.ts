import { ScreenBlockExportMode } from '../../types';

export type OptimizedScreenBlockMode = Exclude<ScreenBlockExportMode, 'raw'>;

export interface ScreenBlockCatalogEntry {
  index: number;
  bytes: number[];
}

export interface BuiltScreenBlockMap {
  mode: OptimizedScreenBlockMode;
  blockWidth: 2 | 4;
  blockHeight: 2 | 4;
  sourceWidth: number;
  sourceHeight: number;
  mapWidth: number;
  mapHeight: number;
  catalog: ScreenBlockCatalogEntry[];
  catalogFlatBytes: number[];
  mapIndices: number[];
  sourceLengthBytes: number;
  catalogLengthBytes: number;
  mapLengthBytes: number;
  optimizedLengthBytes: number;
  savingsBytes: number;
  repeatedBlockCount: number;
}

function resolveBlockSize(mode: OptimizedScreenBlockMode): 2 | 4 {
  return mode === 'blocks4x4' ? 4 : 2;
}

export function isOptimizedScreenBlockMode(
  mode: ScreenBlockExportMode | undefined
): mode is OptimizedScreenBlockMode {
  return mode === 'blocks2x2' || mode === 'blocks4x4';
}

export function buildScreenBlockMapFromBytes({
  bytes,
  width,
  height,
  mode,
}: {
  bytes: ArrayLike<number>;
  width: number;
  height: number;
  mode: ScreenBlockExportMode | undefined;
}): BuiltScreenBlockMap | null {
  if (!isOptimizedScreenBlockMode(mode)) {
    return null;
  }

  const blockSize = resolveBlockSize(mode);
  if (width <= 0 || height <= 0 || width % blockSize !== 0 || height % blockSize !== 0) {
    return null;
  }

  const expectedLength = width * height;
  if (bytes.length !== expectedLength) {
    return null;
  }

  const mapWidth = width / blockSize;
  const mapHeight = height / blockSize;
  const catalog: ScreenBlockCatalogEntry[] = [];
  const catalogIndexBySignature = new Map<string, number>();
  const mapIndices: number[] = [];

  for (let blockY = 0; blockY < mapHeight; blockY++) {
    for (let blockX = 0; blockX < mapWidth; blockX++) {
      const blockBytes: number[] = [];

      for (let localY = 0; localY < blockSize; localY++) {
        const srcY = (blockY * blockSize) + localY;
        const rowOffset = srcY * width;
        for (let localX = 0; localX < blockSize; localX++) {
          const srcX = (blockX * blockSize) + localX;
          blockBytes.push(bytes[rowOffset + srcX] & 0xff);
        }
      }

      const signature = blockBytes.join(',');
      let catalogIndex = catalogIndexBySignature.get(signature);
      if (catalogIndex === undefined) {
        catalogIndex = catalog.length;
        catalogIndexBySignature.set(signature, catalogIndex);
        catalog.push({
          index: catalogIndex,
          bytes: blockBytes,
        });
      }

      mapIndices.push(catalogIndex & 0xff);
    }
  }

  const catalogFlatBytes = catalog.flatMap((entry) => entry.bytes);
  const sourceLengthBytes = expectedLength;
  const catalogLengthBytes = catalogFlatBytes.length;
  const mapLengthBytes = mapIndices.length;
  const optimizedLengthBytes = catalogLengthBytes + mapLengthBytes;

  return {
    mode,
    blockWidth: blockSize,
    blockHeight: blockSize,
    sourceWidth: width,
    sourceHeight: height,
    mapWidth,
    mapHeight,
    catalog,
    catalogFlatBytes,
    mapIndices,
    sourceLengthBytes,
    catalogLengthBytes,
    mapLengthBytes,
    optimizedLengthBytes,
    savingsBytes: sourceLengthBytes - optimizedLengthBytes,
    repeatedBlockCount: mapIndices.length - catalog.length,
  };
}

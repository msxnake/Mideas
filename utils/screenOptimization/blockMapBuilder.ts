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

export interface SharedScreenBlockCatalog {
  mode: OptimizedScreenBlockMode;
  blockWidth: 2 | 4;
  blockHeight: 2 | 4;
  segmentIndex: number;
  labelSuffix: string;
  catalog: ScreenBlockCatalogEntry[];
  catalogFlatBytes: number[];
  catalogLengthBytes: number;
}

export interface BuiltSharedScreenBlockMap extends BuiltScreenBlockMap {
  sharedCatalog: SharedScreenBlockCatalog;
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

function collectBlockSignatures({
  bytes,
  width,
  height,
  mode,
}: {
  bytes: ArrayLike<number>;
  width: number;
  height: number;
  mode: OptimizedScreenBlockMode;
}): string[] | null {
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
  const signatures: string[] = [];

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

      signatures.push(blockBytes.join(','));
    }
  }

  return signatures;
}

function signatureToBytes(signature: string): number[] {
  return signature.split(',').map(value => Number(value) & 0xff);
}

interface MutableSharedCatalog {
  mode: OptimizedScreenBlockMode;
  blockWidth: 2 | 4;
  blockHeight: 2 | 4;
  segmentIndex: number;
  signatureToIndex: Map<string, number>;
  catalog: ScreenBlockCatalogEntry[];
}

function freezeSharedCatalog(catalog: MutableSharedCatalog): SharedScreenBlockCatalog {
  const catalogFlatBytes = catalog.catalog.flatMap((entry) => entry.bytes);
  return {
    mode: catalog.mode,
    blockWidth: catalog.blockWidth,
    blockHeight: catalog.blockHeight,
    segmentIndex: catalog.segmentIndex,
    labelSuffix: `${catalog.blockWidth}X${catalog.blockHeight}_${catalog.segmentIndex}`,
    catalog: catalog.catalog,
    catalogFlatBytes,
    catalogLengthBytes: catalogFlatBytes.length,
  };
}

export function buildSharedScreenBlockMaps<TScreen extends { index: number; bytes: ArrayLike<number>; width: number; height: number; mode?: ScreenBlockExportMode }>({
  screens,
  maxCatalogEntries = 256,
  maxCatalogBytes = 768,
  maxCatalogBytesByMode = {
    blocks2x2: maxCatalogBytes,
    blocks4x4: maxCatalogEntries * 16,
  },
}: {
  screens: TScreen[];
  maxCatalogEntries?: number;
  maxCatalogBytes?: number;
  maxCatalogBytesByMode?: Partial<Record<OptimizedScreenBlockMode, number>>;
}): {
  blockMapsByScreenIndex: Map<number, BuiltSharedScreenBlockMap>;
  catalogs: SharedScreenBlockCatalog[];
} {
  const catalogsByMode: Record<OptimizedScreenBlockMode, MutableSharedCatalog[]> = {
    blocks2x2: [],
    blocks4x4: [],
  };
  const assignments: Array<{
    screen: TScreen;
    mode: OptimizedScreenBlockMode;
    blockSize: 2 | 4;
    signatures: string[];
    catalog: MutableSharedCatalog;
  }> = [];

  for (const screen of screens) {
    if (!isOptimizedScreenBlockMode(screen.mode)) {
      continue;
    }

    const mode = screen.mode;
    const blockSize = resolveBlockSize(mode);
    const modeMaxCatalogBytes = maxCatalogBytesByMode[mode] ?? maxCatalogBytes;
    const maxEntriesForMode = Math.min(
      maxCatalogEntries,
      Math.floor(modeMaxCatalogBytes / (blockSize * blockSize))
    );
    const signatures = collectBlockSignatures({
      bytes: screen.bytes,
      width: screen.width,
      height: screen.height,
      mode,
    });
    if (!signatures) {
      continue;
    }

    const uniqueSignatures = Array.from(new Set(signatures));
    if (uniqueSignatures.length > maxEntriesForMode) {
      continue;
    }

    const catalogs = catalogsByMode[mode];
    let bestCatalog: MutableSharedCatalog | null = null;
    let bestReuseCount = -1;

    for (const candidate of catalogs) {
      let reuseCount = 0;
      let missingCount = 0;
      for (const signature of uniqueSignatures) {
        if (candidate.signatureToIndex.has(signature)) {
          reuseCount += 1;
        } else {
          missingCount += 1;
        }
      }
      if (candidate.catalog.length + missingCount > maxEntriesForMode) {
        continue;
      }
      if (reuseCount > bestReuseCount) {
        bestCatalog = candidate;
        bestReuseCount = reuseCount;
      }
    }

    if (!bestCatalog) {
      bestCatalog = {
        mode,
        blockWidth: blockSize,
        blockHeight: blockSize,
        segmentIndex: catalogs.length,
        signatureToIndex: new Map<string, number>(),
        catalog: [],
      };
      catalogs.push(bestCatalog);
    }

    for (const signature of uniqueSignatures) {
      if (bestCatalog.signatureToIndex.has(signature)) {
        continue;
      }
      const catalogIndex = bestCatalog.catalog.length;
      bestCatalog.signatureToIndex.set(signature, catalogIndex);
      bestCatalog.catalog.push({
        index: catalogIndex,
        bytes: signatureToBytes(signature),
      });
    }

    assignments.push({
      screen,
      mode,
      blockSize,
      signatures,
      catalog: bestCatalog,
    });
  }

  const frozenCatalogByMutable = new Map<MutableSharedCatalog, SharedScreenBlockCatalog>();
  const catalogs = [...catalogsByMode.blocks2x2, ...catalogsByMode.blocks4x4].map((catalog) => {
    const frozen = freezeSharedCatalog(catalog);
    frozenCatalogByMutable.set(catalog, frozen);
    return frozen;
  });
  const blockMapsByScreenIndex = new Map<number, BuiltSharedScreenBlockMap>();

  for (const assignment of assignments) {
    const { screen, mode, blockSize, signatures, catalog } = assignment;
    const mapIndices = signatures.map((signature) => catalog.signatureToIndex.get(signature)! & 0xff);
    const catalogFlatBytes = catalog.catalog.flatMap((entry) => entry.bytes);
    const sourceLengthBytes = screen.width * screen.height;
    const mapWidth = screen.width / blockSize;
    const mapHeight = screen.height / blockSize;
    const catalogLengthBytes = catalogFlatBytes.length;
    const mapLengthBytes = mapIndices.length;
    const optimizedLengthBytes = catalogLengthBytes + mapLengthBytes;

    blockMapsByScreenIndex.set(screen.index, {
      mode,
      blockWidth: blockSize,
      blockHeight: blockSize,
      sourceWidth: screen.width,
      sourceHeight: screen.height,
      mapWidth,
      mapHeight,
      catalog: catalog.catalog,
      catalogFlatBytes,
      mapIndices,
      sourceLengthBytes,
      catalogLengthBytes,
      mapLengthBytes,
      optimizedLengthBytes,
      savingsBytes: sourceLengthBytes - optimizedLengthBytes,
      repeatedBlockCount: mapIndices.length - new Set(signatures).size,
      sharedCatalog: frozenCatalogByMutable.get(catalog)!,
    });
  }

  return {
    blockMapsByScreenIndex,
    catalogs,
  };
}

import { PortraitAsset, ProjectAsset, TileBank, TileBankDefinition } from '../types';

export const DIALOGUE_PORTRAIT_PACKAGE_SCHEMA = 'mideas.dialoguePortrait.v1';

export interface DialoguePortraitPackage {
  schema: typeof DIALOGUE_PORTRAIT_PACKAGE_SCHEMA;
  exportedAt?: string;
  currentProjectName?: string;
  currentScreenMode?: string;
  assets: ProjectAsset[];
  tileBanks?: TileBank[];
  portraitAssetId: string;
  importHint?: string;
  source?: Record<string, unknown>;
}

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const sanitizePortraitPackageFilename = (name: string): string => (
  name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_') || 'portrait'
);

export const createUniquePortraitAssetId = (base: string, usedIds: Set<string>): string => {
  let suffix = 0;
  let candidate = `${base}_${Date.now()}`;
  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${base}_${Date.now()}_${suffix}`;
  }
  usedIds.add(candidate);
  return candidate;
};

function isPortraitLike(value: unknown): value is PortraitAsset {
  const portrait = value as PortraitAsset;
  return !!portrait
    && typeof portrait === 'object'
    && typeof portrait.id === 'string'
    && typeof portrait.name === 'string'
    && Number.isFinite(portrait.widthChars)
    && Number.isFinite(portrait.heightChars)
    && Array.isArray(portrait.cells);
}

function normalizePortrait(portrait: PortraitAsset): PortraitAsset {
  const widthChars = Math.max(1, Math.min(8, Math.floor(portrait.widthChars || 4)));
  const heightChars = Math.max(1, Math.min(8, Math.floor(portrait.heightChars || 4)));
  const cellCount = widthChars * heightChars;

  return {
    ...portrait,
    widthChars,
    heightChars,
    cells: Array.from({ length: cellCount }, (_, index) => portrait.cells[index] || ''),
    dedupeIdenticalTiles: portrait.dedupeIdenticalTiles !== false,
    mouth: {
      enabled: portrait.mouth?.enabled === true,
      cellIndex: Math.max(0, Math.min(Math.max(0, cellCount - 1), Math.floor(portrait.mouth?.cellIndex ?? 0))),
      openTileId: portrait.mouth?.openTileId || '',
    },
  };
}

function getPortraitAssetFromPackage(parsed: any): ProjectAsset | undefined {
  if (!Array.isArray(parsed?.assets)) return undefined;
  const preferredId = typeof parsed.portraitAssetId === 'string' ? parsed.portraitAssetId : '';
  return parsed.assets.find((asset: ProjectAsset) => asset.type === 'portrait' && asset.id === preferredId)
    || parsed.assets.find((asset: ProjectAsset) => asset.type === 'portrait');
}

export function parseDialoguePortraitPackage(content: string): DialoguePortraitPackage {
  const parsed = JSON.parse(content);

  if (parsed?.schema === DIALOGUE_PORTRAIT_PACKAGE_SCHEMA || Array.isArray(parsed?.assets)) {
    const portraitAsset = getPortraitAssetFromPackage(parsed);
    const portrait = portraitAsset?.data;
    if (!portraitAsset || !isPortraitLike(portrait)) {
      throw new Error('Invalid Portrait package format.');
    }

    return {
      schema: DIALOGUE_PORTRAIT_PACKAGE_SCHEMA,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : undefined,
      currentProjectName: typeof parsed.currentProjectName === 'string' ? parsed.currentProjectName : undefined,
      currentScreenMode: typeof parsed.currentScreenMode === 'string' ? parsed.currentScreenMode : undefined,
      assets: parsed.assets,
      tileBanks: Array.isArray(parsed.tileBanks) ? parsed.tileBanks : undefined,
      portraitAssetId: portraitAsset.id,
      importHint: typeof parsed.importHint === 'string' ? parsed.importHint : undefined,
      source: parsed.source && typeof parsed.source === 'object' ? parsed.source : undefined,
    };
  }

  if (parsed?.type === 'portrait' && isPortraitLike(parsed.data)) {
    return {
      schema: DIALOGUE_PORTRAIT_PACKAGE_SCHEMA,
      assets: [parsed],
      portraitAssetId: parsed.id,
    };
  }

  if (isPortraitLike(parsed)) {
    return {
      schema: DIALOGUE_PORTRAIT_PACKAGE_SCHEMA,
      assets: [{
        id: parsed.id,
        name: parsed.name,
        type: 'portrait',
        data: parsed,
      }],
      portraitAssetId: parsed.id,
    };
  }

  throw new Error('Invalid Portrait package format.');
}

function remapAssignedTiles(assignedTiles: Record<string, any> | undefined, idMap: Map<string, string>): Record<string, any> {
  const remapped: Record<string, any> = {};
  Object.entries(assignedTiles || {}).forEach(([tileId, assignment]) => {
    remapped[idMap.get(tileId) || tileId] = assignment;
  });
  return remapped;
}

function remapTileBankData(tileBank: TileBank, idMap: Map<string, string>): TileBank {
  return {
    ...tileBank,
    banks: (tileBank.banks || []).map((bank: TileBankDefinition) => ({
      ...bank,
      assignedTiles: remapAssignedTiles(bank.assignedTiles, idMap),
    })),
  };
}

function countAssignedPortraitCells(tileBank: TileBank | undefined, cells: string[]): { total: number; completeBanks: number; enabledBanks: number } {
  const uniqueCells = Array.from(new Set(cells.filter(Boolean)));
  if (!tileBank || uniqueCells.length === 0 || !Array.isArray(tileBank.banks)) {
    return { total: 0, completeBanks: 0, enabledBanks: 0 };
  }

  return tileBank.banks.reduce((stats, bank) => {
    if (bank.enabled === false) return stats;
    const assignedTiles = bank.assignedTiles || {};
    const assignedCount = uniqueCells.filter(tileId => !!assignedTiles[tileId]).length;
    return {
      total: stats.total + assignedCount,
      completeBanks: stats.completeBanks + (assignedCount === uniqueCells.length ? 1 : 0),
      enabledBanks: stats.enabledBanks + 1,
    };
  }, { total: 0, completeBanks: 0, enabledBanks: 0 });
}

export function resolveBestPortraitTileBankAssetId(
  portrait: Pick<PortraitAsset, 'cells' | 'tileBankAssetId' | 'mouth'>,
  allAssets: ProjectAsset[]
): string | undefined {
  const cells = [
    ...(Array.isArray(portrait.cells) ? portrait.cells : []),
    portrait.mouth?.openTileId || '',
  ];
  const tileBankAssets = allAssets.filter(asset => asset.type === 'tilebank' && asset.data) as Array<ProjectAsset & { data: TileBank }>;
  if (tileBankAssets.length === 0) return portrait.tileBankAssetId;

  const scoredBanks = tileBankAssets
    .map(asset => {
      const stats = countAssignedPortraitCells(asset.data, cells);
      const isCurrent = asset.id === portrait.tileBankAssetId || asset.data.id === portrait.tileBankAssetId;
      const isPortraitNamed = /portrait|dialog/i.test(`${asset.name} ${asset.data.name}`);
      return {
        id: asset.id,
        dataId: asset.data.id,
        score: (stats.completeBanks * 1000) + stats.total + (isPortraitNamed ? 100 : 0) + (isCurrent ? 10 : 0),
        stats,
      };
    })
    .filter(entry => entry.stats.total > 0)
    .sort((a, b) => b.score - a.score);

  const best = scoredBanks[0];
  if (!best) return portrait.tileBankAssetId;

  const current = scoredBanks.find(entry => entry.id === portrait.tileBankAssetId || entry.dataId === portrait.tileBankAssetId);
  if (current && current.stats.completeBanks >= best.stats.completeBanks && current.stats.total >= best.stats.total) {
    return portrait.tileBankAssetId;
  }

  return best.id;
}

export function createDialoguePortraitPackage(
  portrait: PortraitAsset,
  allAssets: ProjectAsset[],
  tileBanks: TileBank[] = []
): DialoguePortraitPackage {
  const normalizedPortrait = normalizePortrait(portrait);
  const dependencyIds = new Set(normalizedPortrait.cells.filter(Boolean));
  if (normalizedPortrait.mouth?.openTileId) dependencyIds.add(normalizedPortrait.mouth.openTileId);
  if (normalizedPortrait.tileBankAssetId) dependencyIds.add(normalizedPortrait.tileBankAssetId);

  const dependencyAssets = allAssets
    .filter(asset => {
      if (asset.type === 'portrait') return false;
      if (dependencyIds.has(asset.id)) return true;
      if (asset.type === 'tilebank' && asset.data && dependencyIds.has((asset.data as TileBank).id)) return true;
      return false;
    })
    .map(asset => cloneJson(asset));

  const portraitAsset: ProjectAsset = {
    id: normalizedPortrait.id,
    name: normalizedPortrait.name,
    type: 'portrait',
    data: cloneJson(normalizedPortrait),
  };

  const packageTileBanks = dependencyAssets
    .filter(asset => asset.type === 'tilebank' && asset.data)
    .map(asset => asset.data as TileBank);
  if (normalizedPortrait.tileBankAssetId) {
    const looseTileBank = tileBanks.find(bank => (
      bank.id === normalizedPortrait.tileBankAssetId
      && !packageTileBanks.some(packageBank => packageBank.id === bank.id)
    ));
    if (looseTileBank) packageTileBanks.push(cloneJson(looseTileBank));
  }

  return {
    schema: DIALOGUE_PORTRAIT_PACKAGE_SCHEMA,
    exportedAt: new Date().toISOString(),
    currentProjectName: `${sanitizePortraitPackageFilename(normalizedPortrait.name)}_dialogue_portrait`,
    currentScreenMode: 'SCREEN 2 (Graphics I)',
    assets: [...dependencyAssets, portraitAsset],
    tileBanks: packageTileBanks,
    portraitAssetId: portraitAsset.id,
    importHint: 'Cargar este JSON desde Portrait Editor para importar el portrait y sus tiles dependientes.',
  };
}

export function remapDialoguePortraitPackageForImport(
  packageData: DialoguePortraitPackage,
  existingAssets: ProjectAsset[],
  options: { portraitId: string; portraitName?: string; reservedAssetIds?: Set<string> }
): { portrait: PortraitAsset; assetsToCreate: ProjectAsset[] } {
  const existingIds = new Set([
    ...existingAssets.map(asset => asset.id),
    ...(options.reservedAssetIds ? Array.from(options.reservedAssetIds) : []),
  ]);
  const usedIds = new Set(existingIds);
  const idMap = new Map<string, string>();
  const assetsToCreate: ProjectAsset[] = [];
  const portraitAsset = packageData.assets.find(asset => asset.id === packageData.portraitAssetId && asset.type === 'portrait')
    || packageData.assets.find(asset => asset.type === 'portrait');

  if (!portraitAsset || !isPortraitLike(portraitAsset.data)) {
    throw new Error('Invalid Portrait package format.');
  }

  packageData.assets.forEach(asset => {
    if (!asset?.id || !asset.type || asset.type === 'portrait') return;

    const existingAsset = existingAssets.find(existing => existing.id === asset.id);
    if (existingAsset && existingAsset.type === asset.type && JSON.stringify(existingAsset.data) === JSON.stringify(asset.data)) {
      idMap.set(asset.id, asset.id);
      return;
    }

    const newId = existingIds.has(asset.id)
      ? createUniquePortraitAssetId(`${asset.type}_imported`, usedIds)
      : asset.id;

    usedIds.add(newId);
    idMap.set(asset.id, newId);
  });

  packageData.assets.forEach(asset => {
    if (!asset?.id || !asset.type || asset.type === 'portrait') return;

    const existingAsset = existingAssets.find(existing => existing.id === asset.id);
    if (existingAsset && existingAsset.type === asset.type && JSON.stringify(existingAsset.data) === JSON.stringify(asset.data)) {
      return;
    }

    const newId = idMap.get(asset.id);
    if (!newId) return;

    const clonedAsset = cloneJson(asset);
    clonedAsset.id = newId;
    if (clonedAsset.data && typeof clonedAsset.data === 'object' && 'id' in clonedAsset.data) {
      (clonedAsset.data as any).id = newId;
    }
    if (clonedAsset.type === 'tilebank' && clonedAsset.data) {
      clonedAsset.data = remapTileBankData(clonedAsset.data as TileBank, idMap);
    }
    assetsToCreate.push(clonedAsset);
  });

  const importedPortrait = normalizePortrait(cloneJson(portraitAsset.data));
  const remappedPortrait: PortraitAsset = {
    ...importedPortrait,
    id: options.portraitId,
    name: options.portraitName || importedPortrait.name,
    tileBankAssetId: importedPortrait.tileBankAssetId
      ? (idMap.get(importedPortrait.tileBankAssetId) || importedPortrait.tileBankAssetId)
      : undefined,
    cells: importedPortrait.cells.map(tileId => tileId ? (idMap.get(tileId) || tileId) : ''),
    mouth: importedPortrait.mouth
      ? {
          ...importedPortrait.mouth,
          openTileId: importedPortrait.mouth.openTileId
            ? (idMap.get(importedPortrait.mouth.openTileId) || importedPortrait.mouth.openTileId)
            : '',
        }
      : undefined,
  };
  remappedPortrait.tileBankAssetId = resolveBestPortraitTileBankAssetId(
    remappedPortrait,
    [...existingAssets, ...assetsToCreate]
  ) || remappedPortrait.tileBankAssetId;

  return { portrait: remappedPortrait, assetsToCreate };
}

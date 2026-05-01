import { Boss, BossBehaviorAction, BossForm, BossPhase, ProjectAsset } from '../types';

export const BOSS_PACKAGE_SCHEMA = 'mideas.boss.v1';

export interface BossExportPackage {
  schema: typeof BOSS_PACKAGE_SCHEMA;
  exportedAt: string;
  boss: Boss;
  assets: ProjectAsset[];
}

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const sanitizeBossPackageFilename = (name: string): string => (
  name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_') || 'boss'
);

export const createUniqueAssetId = (base: string, usedIds: Set<string>): string => {
  let suffix = 0;
  let candidate = `${base}_${Date.now()}`;
  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${base}_${Date.now()}_${suffix}`;
  }
  usedIds.add(candidate);
  return candidate;
};

export const createUniqueAssetName = (
  preferredName: string,
  existingAssets: ProjectAsset[],
  type?: ProjectAsset['type']
): string => {
  const baseName = preferredName.trim() || 'Imported Boss';
  const existingNames = new Set(
    existingAssets
      .filter(asset => !type || asset.type === type)
      .map(asset => asset.name)
  );
  if (!existingNames.has(baseName)) return baseName;

  let index = 2;
  let candidate = `${baseName} ${index}`;
  while (existingNames.has(candidate)) {
    index += 1;
    candidate = `${baseName} ${index}`;
  }
  return candidate;
};

const addId = (ids: Set<string>, id?: string | null) => {
  if (id) ids.add(id);
};

const addTileMatrixIds = (ids: Set<string>, matrix?: (string | null)[][]) => {
  matrix?.forEach(row => row.forEach(tileId => addId(ids, tileId)));
};

const addWeakPointIds = (ids: Set<string>, phaseOrForm: Pick<BossPhase | BossForm, 'weakPoints'>) => {
  phaseOrForm.weakPoints?.forEach(weakPoint => {
    addId(ids, weakPoint.hitSpriteId);
    addId(ids, weakPoint.destroyedTileId);
  });
};

const addBehaviorActionIds = (ids: Set<string>, action: BossBehaviorAction) => {
  if (action.type === 'shield') {
    addId(ids, action.shieldAssetId);
  }
};

export const collectBossDependencyAssetIds = (boss: Boss): Set<string> => {
  const ids = new Set<string>();

  addId(ids, boss.deathExplosionSpriteId);
  addId(ids, boss.deathSoundId);

  boss.attacks?.forEach(attack => {
    addId(ids, attack.spriteAssetId);
    addId(ids, attack.soundEffectAssetId);
    addId(ids, attack.laserTileAssetId);
    addId(ids, attack.blockTileAssetId);
    addId(ids, attack.explosionSpriteAssetId);
  });

  boss.phases?.forEach(phase => {
    addId(ids, phase.spriteAssetId);
    addTileMatrixIds(ids, phase.tileMatrix);
    addWeakPointIds(ids, phase);
    phase.forms?.forEach(form => {
      addTileMatrixIds(ids, form.tileMatrix);
      addWeakPointIds(ids, form);
    });
    phase.behaviorLoop?.forEach(action => addBehaviorActionIds(ids, action));
  });

  return ids;
};

export const createBossExportPackage = (boss: Boss, allAssets: ProjectAsset[]): BossExportPackage => {
  const dependencyIds = collectBossDependencyAssetIds(boss);
  const assets = allAssets
    .filter(asset => dependencyIds.has(asset.id) && asset.type !== 'boss')
    .map(asset => cloneJson(asset));

  return {
    schema: BOSS_PACKAGE_SCHEMA,
    exportedAt: new Date().toISOString(),
    boss: cloneJson(boss),
    assets,
  };
};

const isBossLike = (value: unknown): value is Boss => {
  const boss = value as Boss;
  return !!boss
    && typeof boss === 'object'
    && typeof boss.id === 'string'
    && typeof boss.name === 'string'
    && Array.isArray(boss.phases)
    && Array.isArray(boss.attacks);
};

export const parseBossExportPackage = (content: string): BossExportPackage => {
  const parsed = JSON.parse(content);
  const packageData = parsed?.schema === BOSS_PACKAGE_SCHEMA ? parsed : { schema: BOSS_PACKAGE_SCHEMA, boss: parsed, assets: [] };

  if (packageData.schema !== BOSS_PACKAGE_SCHEMA || !isBossLike(packageData.boss)) {
    throw new Error('Invalid Boss package format.');
  }

  return {
    schema: BOSS_PACKAGE_SCHEMA,
    exportedAt: typeof packageData.exportedAt === 'string' ? packageData.exportedAt : new Date().toISOString(),
    boss: packageData.boss,
    assets: Array.isArray(packageData.assets) ? packageData.assets : [],
  };
};

const remapOptionalId = (
  id: string | null | undefined,
  idMap: Map<string, string>,
  existingIds: Set<string>
): string | undefined => {
  if (!id) return undefined;
  return idMap.get(id) ?? (existingIds.has(id) ? id : undefined);
};

const remapTileMatrix = (
  matrix: (string | null)[][] | undefined,
  idMap: Map<string, string>,
  existingIds: Set<string>
): (string | null)[][] | undefined => {
  if (!matrix) return undefined;
  return matrix.map(row => row.map(tileId => tileId ? (remapOptionalId(tileId, idMap, existingIds) ?? null) : null));
};

const remapWeakPoints = (
  weakPoints: BossPhase['weakPoints'],
  idMap: Map<string, string>,
  existingIds: Set<string>
): BossPhase['weakPoints'] => weakPoints?.map(weakPoint => ({
  ...weakPoint,
  hitSpriteId: remapOptionalId(weakPoint.hitSpriteId, idMap, existingIds),
  destroyedTileId: remapOptionalId(weakPoint.destroyedTileId, idMap, existingIds),
}));

const remapBehaviorAction = (
  action: BossBehaviorAction,
  idMap: Map<string, string>,
  existingIds: Set<string>
): BossBehaviorAction => {
  if (action.type === 'shield') {
    return {
      ...action,
      shieldAssetId: remapOptionalId(action.shieldAssetId, idMap, existingIds),
    };
  }
  return { ...action };
};

export interface BossPackageImportOptions {
  bossId: string;
  bossName: string;
  existingTileBankIds?: Set<string>;
  reservedAssetIds?: Set<string>;
  clearProjectLinks?: boolean;
}

export const remapBossPackageForImport = (
  packageData: BossExportPackage,
  existingAssets: ProjectAsset[],
  options: BossPackageImportOptions
): { boss: Boss; assetsToCreate: ProjectAsset[] } => {
  const existingIds = new Set([
    ...existingAssets.map(asset => asset.id),
    ...(options.reservedAssetIds ? Array.from(options.reservedAssetIds) : []),
  ]);
  const usedIds = new Set(existingIds);
  const idMap = new Map<string, string>();
  const assetsToCreate: ProjectAsset[] = [];

  packageData.assets.forEach(asset => {
    if (!asset?.id || !asset.type) return;

    const existingAsset = existingAssets.find(existing => existing.id === asset.id);
    if (existingAsset && existingAsset.type === asset.type && JSON.stringify(existingAsset.data) === JSON.stringify(asset.data)) {
      idMap.set(asset.id, asset.id);
      return;
    }

    const newId = existingIds.has(asset.id)
      ? createUniqueAssetId(`${asset.type}_imported`, usedIds)
      : asset.id;

    usedIds.add(newId);
    idMap.set(asset.id, newId);

    const clonedAsset = cloneJson(asset);
    clonedAsset.id = newId;
    if (clonedAsset.data && typeof clonedAsset.data === 'object' && 'id' in clonedAsset.data) {
      (clonedAsset.data as any).id = newId;
    }
    assetsToCreate.push(clonedAsset);
  });

  const importedBoss = cloneJson(packageData.boss);
  const existingTileBankIds = options.existingTileBankIds ?? new Set<string>();

  const phases = importedBoss.phases.map(phase => ({
    ...phase,
    spriteAssetId: remapOptionalId(phase.spriteAssetId, idMap, existingIds),
    tileBankId: phase.tileBankId && existingTileBankIds.has(phase.tileBankId) ? phase.tileBankId : undefined,
    tileMatrix: remapTileMatrix(phase.tileMatrix, idMap, existingIds),
    weakPoints: remapWeakPoints(phase.weakPoints, idMap, existingIds),
    forms: phase.forms?.map(form => ({
      ...form,
      tileMatrix: remapTileMatrix(form.tileMatrix, idMap, existingIds) ?? [],
      weakPoints: remapWeakPoints(form.weakPoints, idMap, existingIds),
    })),
    behaviorLoop: phase.behaviorLoop?.map(action => remapBehaviorAction(action, idMap, existingIds)),
  }));

  const attacks = importedBoss.attacks.map(attack => ({
    ...attack,
    spriteAssetId: remapOptionalId(attack.spriteAssetId, idMap, existingIds),
    soundEffectAssetId: remapOptionalId(attack.soundEffectAssetId, idMap, existingIds),
    laserTileAssetId: remapOptionalId(attack.laserTileAssetId, idMap, existingIds),
    blockTileAssetId: remapOptionalId(attack.blockTileAssetId, idMap, existingIds),
    explosionSpriteAssetId: remapOptionalId(attack.explosionSpriteAssetId, idMap, existingIds),
  }));

  return {
    boss: {
      ...importedBoss,
      id: options.bossId,
      name: options.bossName,
      phases,
      attacks,
      deathExplosionSpriteId: remapOptionalId(importedBoss.deathExplosionSpriteId, idMap, existingIds),
      deathSoundId: remapOptionalId(importedBoss.deathSoundId, idMap, existingIds),
      linkedScreenId: options.clearProjectLinks === false ? importedBoss.linkedScreenId : null,
      behaviorPreviewStartXChar: options.clearProjectLinks === false ? importedBoss.behaviorPreviewStartXChar : undefined,
      behaviorPreviewStartYChar: options.clearProjectLinks === false ? importedBoss.behaviorPreviewStartYChar : undefined,
      behaviorPreviewPlayerXChar: options.clearProjectLinks === false ? importedBoss.behaviorPreviewPlayerXChar : undefined,
      behaviorPreviewPlayerYChar: options.clearProjectLinks === false ? importedBoss.behaviorPreviewPlayerYChar : undefined,
    },
    assetsToCreate,
  };
};

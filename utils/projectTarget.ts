import { ProjectAsset } from '../types';

export type ProjectTarget = 'MSX1' | 'MSX2';

const MSX1_ONLY_ASSET_TYPES = new Set<ProjectAsset['type']>([
  'tile',
  'sprite',
  'screenmap',
  'font',
  'tilebank',
  'boss',
  'portrait',
]);

const MSX2_ONLY_ASSET_TYPES = new Set<ProjectAsset['type']>([
  'msx2sprite',
  'msx2bitmap',
  'msx2screen',
]);

export const getProjectTargetFromScreenMode = (screenMode: string): ProjectTarget => (
  screenMode === 'SCREEN 5 (Graphics III)' ? 'MSX2' : 'MSX1'
);

export const getAssetTarget = (assetType: ProjectAsset['type']): ProjectTarget | 'COMMON' => {
  if (MSX1_ONLY_ASSET_TYPES.has(assetType)) return 'MSX1';
  if (MSX2_ONLY_ASSET_TYPES.has(assetType)) return 'MSX2';
  return 'COMMON';
};

export const isAssetTypeEnabledForProject = (
  assetType: ProjectAsset['type'],
  currentScreenMode: string
): boolean => {
  const assetTarget = getAssetTarget(assetType);
  return assetTarget === 'COMMON' || assetTarget === getProjectTargetFromScreenMode(currentScreenMode);
};

export const isScreen2Project = (screenMode: string): boolean => getProjectTargetFromScreenMode(screenMode) === 'MSX1';
export const isScreen5Project = (screenMode: string): boolean => getProjectTargetFromScreenMode(screenMode) === 'MSX2';

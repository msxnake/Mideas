import { ComponentDefinition, EntityTemplate, ProjectAsset } from '../types';

export type ProjectTarget = 'MSX1' | 'MSX2';
export type TargetScope = ProjectTarget | 'COMMON';

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

export const isTargetEnabledForProject = (
  target: TargetScope | undefined,
  currentScreenMode: string
): boolean => {
  const normalizedTarget = target || 'MSX1';
  return normalizedTarget === 'COMMON' || normalizedTarget === getProjectTargetFromScreenMode(currentScreenMode);
};

export const getComponentDefinitionTarget = (component: ComponentDefinition): TargetScope => component.target || 'MSX1';

export const getEntityTemplateTarget = (template: EntityTemplate): TargetScope => template.target || 'MSX1';

export const isComponentDefinitionEnabledForProject = (
  component: ComponentDefinition,
  currentScreenMode: string
): boolean => isTargetEnabledForProject(getComponentDefinitionTarget(component), currentScreenMode);

export const isEntityTemplateEnabledForProject = (
  template: EntityTemplate,
  currentScreenMode: string
): boolean => isTargetEnabledForProject(getEntityTemplateTarget(template), currentScreenMode);

export const isAssetTypeEnabledForProject = (
  assetType: ProjectAsset['type'],
  currentScreenMode: string
): boolean => {
  const assetTarget = getAssetTarget(assetType);
  return assetTarget === 'COMMON' || assetTarget === getProjectTargetFromScreenMode(currentScreenMode);
};

export const isScreen2Project = (screenMode: string): boolean => getProjectTargetFromScreenMode(screenMode) === 'MSX1';
export const isScreen5Project = (screenMode: string): boolean => getProjectTargetFromScreenMode(screenMode) === 'MSX2';

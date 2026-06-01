import { ComponentDefinition, EntityTemplate, Msx2ProjectProfile, ProjectAsset } from '../types';
import {
  filterComponentDefinitionsForMsx2Profile,
  filterEntityTemplatesForMsx2Profile,
  isAssetTypeAllowedForMsx2Profile,
} from './msx2ProjectProfiles';

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
  'presentationscreen',
  'gameflow',
]);

const MSX2_ONLY_ASSET_TYPES = new Set<ProjectAsset['type']>([
  'msx2sprite',
  'msx2bitmap',
  'msx2screen',
  'msx2bitmaproom',
  'msx2player',
  'msx2hudfont',
  'msx2presentation',
  'msx2gameflow',
]);

export const getProjectTargetFromScreenMode = (screenMode: string): ProjectTarget => (
  screenMode === 'SCREEN 4 (Graphics II)' || screenMode === 'SCREEN 5 (Graphics III)' ? 'MSX2' : 'MSX1'
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

export const filterComponentDefinitionsForProject = (
  components: ComponentDefinition[],
  currentScreenMode: string,
  msx2ProjectProfile?: Msx2ProjectProfile | null
): ComponentDefinition[] => {
  const targetFiltered = components.filter(component =>
    isComponentDefinitionEnabledForProject(component, currentScreenMode)
  );
  if (isScreen4Project(currentScreenMode) && msx2ProjectProfile) {
    return filterComponentDefinitionsForMsx2Profile(targetFiltered, msx2ProjectProfile);
  }
  return targetFiltered;
};

export const filterEntityTemplatesForProject = (
  templates: EntityTemplate[],
  currentScreenMode: string,
  msx2ProjectProfile?: Msx2ProjectProfile | null
): EntityTemplate[] => {
  const targetFiltered = templates.filter(template =>
    isEntityTemplateEnabledForProject(template, currentScreenMode)
  );
  if (isScreen4Project(currentScreenMode) && msx2ProjectProfile) {
    return filterEntityTemplatesForMsx2Profile(targetFiltered, msx2ProjectProfile);
  }
  return targetFiltered;
};

export const isAssetTypeEnabledForProject = (
  assetType: ProjectAsset['type'],
  currentScreenMode: string
): boolean => {
  const assetTarget = getAssetTarget(assetType);
  return assetTarget === 'COMMON' || assetTarget === getProjectTargetFromScreenMode(currentScreenMode);
};

/** MSX2 asset types hidden from all MSX2 profiles unless explicitly allowed. */
export const MSX2_UI_HIDDEN_ASSET_TYPES: ProjectAsset['type'][] = [];

export const isAssetTypeEnabledForMsx2Project = (
  assetType: ProjectAsset['type'],
  currentScreenMode: string,
  msx2ProjectProfile?: Msx2ProjectProfile | null
): boolean => {
  if (!isAssetTypeEnabledForProject(assetType, currentScreenMode)) return false;
  if (!isScreen4Project(currentScreenMode)) return true;
  if (MSX2_UI_HIDDEN_ASSET_TYPES.includes(assetType)) return false;
  return isAssetTypeAllowedForMsx2Profile(assetType, msx2ProjectProfile);
};

export const isScreen2Project = (screenMode: string): boolean => getProjectTargetFromScreenMode(screenMode) === 'MSX1';
export const isScreen4Project = (screenMode: string): boolean => getProjectTargetFromScreenMode(screenMode) === 'MSX2';
export const isScreen5Project = (screenMode: string): boolean => getProjectTargetFromScreenMode(screenMode) === 'MSX2';

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isScreen5Project = exports.isScreen4Project = exports.isScreen2Project = exports.isAssetTypeEnabledForMsx2Project = exports.MSX2_UI_HIDDEN_ASSET_TYPES = exports.isAssetTypeEnabledForProject = exports.filterEntityTemplatesForProject = exports.filterComponentDefinitionsForProject = exports.isEntityTemplateEnabledForProject = exports.isComponentDefinitionEnabledForProject = exports.getEntityTemplateTarget = exports.getComponentDefinitionTarget = exports.isTargetEnabledForProject = exports.getAssetTarget = exports.getProjectTargetFromScreenMode = void 0;
const msx2ProjectProfiles_1 = require("./msx2ProjectProfiles");
const MSX1_ONLY_ASSET_TYPES = new Set([
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
const MSX2_ONLY_ASSET_TYPES = new Set([
    'msx2sprite',
    'msx2bitmap',
    'msx2bitmaptile',
    'msx2bitmapstamp',
    'msx2bitmapterrain',
    'msx2screen',
    'msx2bitmaproom',
    'msx2player',
    'msx2enemy',
    'msx2hudfont',
    'msx2hud',
    'msx2presentation',
    'msx2gameflow',
]);
const getProjectTargetFromScreenMode = (screenMode) => (screenMode === 'SCREEN 4 (Graphics II)' || screenMode === 'SCREEN 5 (Graphics III)' ? 'MSX2' : 'MSX1');
exports.getProjectTargetFromScreenMode = getProjectTargetFromScreenMode;
const getAssetTarget = (assetType) => {
    if (MSX1_ONLY_ASSET_TYPES.has(assetType))
        return 'MSX1';
    if (MSX2_ONLY_ASSET_TYPES.has(assetType))
        return 'MSX2';
    return 'COMMON';
};
exports.getAssetTarget = getAssetTarget;
const isTargetEnabledForProject = (target, currentScreenMode) => {
    const normalizedTarget = target || 'MSX1';
    return normalizedTarget === 'COMMON' || normalizedTarget === (0, exports.getProjectTargetFromScreenMode)(currentScreenMode);
};
exports.isTargetEnabledForProject = isTargetEnabledForProject;
const getComponentDefinitionTarget = (component) => component.target || 'MSX1';
exports.getComponentDefinitionTarget = getComponentDefinitionTarget;
const getEntityTemplateTarget = (template) => template.target || 'MSX1';
exports.getEntityTemplateTarget = getEntityTemplateTarget;
const isComponentDefinitionEnabledForProject = (component, currentScreenMode) => (0, exports.isTargetEnabledForProject)((0, exports.getComponentDefinitionTarget)(component), currentScreenMode);
exports.isComponentDefinitionEnabledForProject = isComponentDefinitionEnabledForProject;
const isEntityTemplateEnabledForProject = (template, currentScreenMode) => (0, exports.isTargetEnabledForProject)((0, exports.getEntityTemplateTarget)(template), currentScreenMode);
exports.isEntityTemplateEnabledForProject = isEntityTemplateEnabledForProject;
const filterComponentDefinitionsForProject = (components, currentScreenMode, msx2ProjectProfile) => {
    const targetFiltered = components.filter(component => (0, exports.isComponentDefinitionEnabledForProject)(component, currentScreenMode));
    if ((0, exports.isScreen4Project)(currentScreenMode) && msx2ProjectProfile) {
        return (0, msx2ProjectProfiles_1.filterComponentDefinitionsForMsx2Profile)(targetFiltered, msx2ProjectProfile);
    }
    return targetFiltered;
};
exports.filterComponentDefinitionsForProject = filterComponentDefinitionsForProject;
const filterEntityTemplatesForProject = (templates, currentScreenMode, msx2ProjectProfile) => {
    const targetFiltered = templates.filter(template => (0, exports.isEntityTemplateEnabledForProject)(template, currentScreenMode));
    if ((0, exports.isScreen4Project)(currentScreenMode) && msx2ProjectProfile) {
        return (0, msx2ProjectProfiles_1.filterEntityTemplatesForMsx2Profile)(targetFiltered, msx2ProjectProfile);
    }
    return targetFiltered;
};
exports.filterEntityTemplatesForProject = filterEntityTemplatesForProject;
const isAssetTypeEnabledForProject = (assetType, currentScreenMode) => {
    const assetTarget = (0, exports.getAssetTarget)(assetType);
    return assetTarget === 'COMMON' || assetTarget === (0, exports.getProjectTargetFromScreenMode)(currentScreenMode);
};
exports.isAssetTypeEnabledForProject = isAssetTypeEnabledForProject;
/** MSX2 asset types hidden from all MSX2 profiles unless explicitly allowed. */
exports.MSX2_UI_HIDDEN_ASSET_TYPES = [];
const isAssetTypeEnabledForMsx2Project = (assetType, currentScreenMode, msx2ProjectProfile) => {
    if (!(0, exports.isAssetTypeEnabledForProject)(assetType, currentScreenMode))
        return false;
    if (!(0, exports.isScreen4Project)(currentScreenMode))
        return true;
    if (exports.MSX2_UI_HIDDEN_ASSET_TYPES.includes(assetType))
        return false;
    return (0, msx2ProjectProfiles_1.isAssetTypeAllowedForMsx2Profile)(assetType, msx2ProjectProfile);
};
exports.isAssetTypeEnabledForMsx2Project = isAssetTypeEnabledForMsx2Project;
const isScreen2Project = (screenMode) => (0, exports.getProjectTargetFromScreenMode)(screenMode) === 'MSX1';
exports.isScreen2Project = isScreen2Project;
const isScreen4Project = (screenMode) => (0, exports.getProjectTargetFromScreenMode)(screenMode) === 'MSX2';
exports.isScreen4Project = isScreen4Project;
const isScreen5Project = (screenMode) => (0, exports.getProjectTargetFromScreenMode)(screenMode) === 'MSX2';
exports.isScreen5Project = isScreen5Project;

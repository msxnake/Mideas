/**
 * An enumeration of all possible HUD element types.
 */
export var HUDElementType;
(function (HUDElementType) {
    HUDElementType["Score"] = "Score";
    HUDElementType["HighScore"] = "HighScore";
    HUDElementType["Lives"] = "Lives";
    HUDElementType["EnergyBar"] = "EnergyBar";
    HUDElementType["ItemDisplay"] = "ItemDisplay";
    HUDElementType["SceneName"] = "SceneName";
    HUDElementType["MiniMap"] = "MiniMap";
    HUDElementType["CoinCounter"] = "CoinCounter";
    HUDElementType["BossEnergyBar"] = "BossEnergyBar";
    HUDElementType["PhaseIndicator"] = "PhaseIndicator";
    HUDElementType["AttackAlert"] = "AttackAlert";
    HUDElementType["TextBox"] = "TextBox";
    HUDElementType["NumericField"] = "NumericField";
    HUDElementType["CustomCounter"] = "CustomCounter";
})(HUDElementType || (HUDElementType = {}));
// --- End ECS Core Types ---
// --- Effect Zone Types ---
/**
 * Legacy bitmask definitions kept only to infer effect types from old projects.
 * New data should use `effectType + params`.
 */
export const LEGACY_EFFECT_ZONE_FLAGS = {
    water: { bit: 0, label: "Water Effect", maskValue: 0b00000001, color: 'rgba(50, 100, 200, 0.4)' },
    customGravity: { bit: 1, label: "Custom Gravity", maskValue: 0b00000010, color: 'rgba(150, 50, 200, 0.4)' },
    icePhysics: { bit: 2, label: "Ice Physics", maskValue: 0b00000100, color: 'rgba(100, 200, 255, 0.4)' },
    spriteConceal: { bit: 3, label: "Sprite Concealment", maskValue: 0b00001000, color: 'rgba(100, 100, 100, 0.4)' },
};
/** Supported runtime effect categories for rectangular effect zones. */
export const EFFECT_ZONE_TYPE_CONFIG = {
    secretZone: { label: "Secret Zone", color: 'rgba(255, 209, 102, 0.38)' },
    wind: { label: "Wind", color: 'rgba(91, 192, 235, 0.34)' },
    water: { label: "Water", color: 'rgba(50, 100, 200, 0.4)' },
    customGravity: { label: "Custom Gravity", color: 'rgba(150, 50, 200, 0.4)' },
    icePhysics: { label: "Ice Physics", color: 'rgba(100, 200, 255, 0.4)' },
    spriteConceal: { label: "Sprite Concealment", color: 'rgba(100, 100, 100, 0.4)' },
};
export const DEFAULT_WIND_EFFECT_ZONE_PARAMS = {
    direction: 'right',
    strength: 1,
};
export const getDefaultEffectZoneParams = (effectType) => {
    switch (effectType) {
        case 'wind':
            return { ...DEFAULT_WIND_EFFECT_ZONE_PARAMS };
        default:
            return {};
    }
};
export const normalizeEffectZoneParams = (effectType, params) => {
    const source = params || {};
    if (effectType === 'wind') {
        const allowedDirections = ['left', 'right', 'up', 'down'];
        const rawDirection = typeof source.direction === 'string' ? source.direction : DEFAULT_WIND_EFFECT_ZONE_PARAMS.direction;
        const direction = allowedDirections.includes(rawDirection)
            ? rawDirection
            : DEFAULT_WIND_EFFECT_ZONE_PARAMS.direction;
        const rawStrength = typeof source.strength === 'number' ? source.strength : parseInt(String(source.strength ?? ''), 10);
        return {
            direction,
            strength: Number.isFinite(rawStrength) ? Math.max(0, rawStrength) : DEFAULT_WIND_EFFECT_ZONE_PARAMS.strength,
        };
    }
    return {};
};
export const resolveEffectZoneType = (zone) => {
    if (zone.effectType && zone.effectType in EFFECT_ZONE_TYPE_CONFIG) {
        return zone.effectType;
    }
    const mask = zone.mask ?? 0;
    if ((mask & LEGACY_EFFECT_ZONE_FLAGS.water.maskValue) !== 0)
        return 'water';
    if ((mask & LEGACY_EFFECT_ZONE_FLAGS.customGravity.maskValue) !== 0)
        return 'customGravity';
    if ((mask & LEGACY_EFFECT_ZONE_FLAGS.icePhysics.maskValue) !== 0)
        return 'icePhysics';
    if ((mask & LEGACY_EFFECT_ZONE_FLAGS.spriteConceal.maskValue) !== 0)
        return 'spriteConceal';
    return 'secretZone';
};
// --- End Game Flow Types ---
/**
 * An enumeration of all possible editor types in the application.
 */
export var EditorType;
(function (EditorType) {
    EditorType["None"] = "None";
    EditorType["Tile"] = "Tile";
    EditorType["Sprite"] = "Sprite";
    EditorType["Screen"] = "Screen";
    EditorType["Code"] = "Code";
    EditorType["Attributes"] = "Attributes";
    EditorType["Sound"] = "Sound";
    EditorType["Platformer"] = "Platformer";
    EditorType["WorldMap"] = "WorldMap";
    EditorType["Track"] = "Track";
    EditorType["HUD"] = "HUD";
    EditorType["TileBanks"] = "TileBanks";
    EditorType["Font"] = "Font";
    EditorType["HelpDocs"] = "HelpDocs";
    EditorType["BehaviorEditor"] = "BehaviorEditor";
    EditorType["ComponentDefinitionEditor"] = "ComponentDefinitionEditor";
    EditorType["EntityTemplateEditor"] = "EntityTemplateEditor";
    EditorType["Boss"] = "Boss";
    EditorType["WorldView"] = "WorldView";
    EditorType["GameFlow"] = "GameFlow";
    EditorType["MainMenu"] = "MainMenu";
    EditorType["PresentationScreen"] = "PresentationScreen";
    EditorType["StateMachine"] = "StateMachine";
    EditorType["GlobalVariables"] = "GlobalVariables";
    EditorType["Palette"] = "Palette";
})(EditorType || (EditorType = {}));
export const DITHER_BRUSH_DIAMETERS = [1, 3, 5, 7];
export const SOLIDITY_TYPES = [
    { id: 0, name: "NoSolid (Passable)", isSolid: false },
    { id: 1, name: "Solid (Wall/Ground)", isSolid: true },
    { id: 2, name: "Platform (Top-Solid)", isSolid: true },
    { id: 3, name: "Slope (Solid)", isSolid: true },
];
export const PROPERTY_FLAGS = {
    isBreakable: { bit: 0, label: "Breakable" },
    isMovable: { bit: 1, label: "Movable" },
    causesDamage: { bit: 2, label: "Deadly" },
    isInteractiveSwitch: { bit: 3, label: "Interactable" },
};
// --- End Centralized History System ---

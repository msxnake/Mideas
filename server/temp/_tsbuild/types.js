"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROPERTY_FLAGS = exports.SOLIDITY_TYPES = exports.DITHER_BRUSH_DIAMETERS = exports.EditorType = exports.EFFECT_ZONE_FLAGS = exports.HUDElementType = exports.EXPLOSION_SPRITE_SIZES = void 0;
/** An array of possible sprite sizes for generated explosions. */
exports.EXPLOSION_SPRITE_SIZES = [16, 24, 32];
/**
 * An enumeration of all possible HUD element types.
 */
var HUDElementType;
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
})(HUDElementType || (exports.HUDElementType = HUDElementType = {}));
// --- End ECS Core Types ---
// --- Effect Zone Types ---
/** A constant object defining the available flags for an effect zone. */
exports.EFFECT_ZONE_FLAGS = {
    water: { bit: 0, label: "Water Effect", maskValue: 0b00000001, color: 'rgba(50, 100, 200, 0.4)' },
    customGravity: { bit: 1, label: "Custom Gravity", maskValue: 0b00000010, color: 'rgba(150, 50, 200, 0.4)' },
    icePhysics: { bit: 2, label: "Ice Physics", maskValue: 0b00000100, color: 'rgba(100, 200, 255, 0.4)' },
    spriteConceal: { bit: 3, label: "Sprite Concealment", maskValue: 0b00001000, color: 'rgba(100, 100, 100, 0.4)' },
};
// --- End Game Flow Types ---
/**
 * An enumeration of all possible editor types in the application.
 */
var EditorType;
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
    EditorType["StateMachine"] = "StateMachine";
    EditorType["GlobalVariables"] = "GlobalVariables";
    EditorType["Palette"] = "Palette";
})(EditorType || (exports.EditorType = EditorType = {}));
exports.DITHER_BRUSH_DIAMETERS = [1, 3, 5, 7];
exports.SOLIDITY_TYPES = [
    { id: 0, name: "NoSolid (Passable)", isSolid: false },
    { id: 1, name: "Solid (Wall/Ground)", isSolid: true },
    { id: 2, name: "Platform (Top-Solid)", isSolid: true },
    { id: 3, name: "Slope (Solid)", isSolid: true },
];
exports.PROPERTY_FLAGS = {
    isBreakable: { bit: 0, label: "Breakable" },
    isMovable: { bit: 1, label: "Movable" },
    causesDamage: { bit: 2, label: "Deadly" },
    isInteractiveSwitch: { bit: 3, label: "Interactable" },
};
// --- End Centralized History System ---

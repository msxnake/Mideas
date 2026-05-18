"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldKeepRuntimeBackgroundLayout = shouldKeepRuntimeBackgroundLayout;
function hasRuntimeSecretZone(screen) {
    if (!Array.isArray(screen?.effectZones))
        return false;
    return screen.effectZones.some((zone) => {
        const rect = zone?.rect || {};
        const width = Number(rect.width ?? zone?.width ?? 0);
        const height = Number(rect.height ?? zone?.height ?? 0);
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            return false;
        }
        if (zone?.effectType === 'secretZone')
            return true;
        const hasKnownEffectType = typeof zone?.effectType === 'string' && zone.effectType.length > 0;
        const mask = Number(zone?.mask ?? 0);
        const hasLegacyNonSecretMask = Number.isFinite(mask) && mask !== 0;
        return !hasKnownEffectType && !hasLegacyNonSecretMask;
    });
}
function shouldKeepRuntimeBackgroundLayout(analysis) {
    return !!analysis.screenMaps?.some((screen) => hasRuntimeSecretZone(screen));
}

import { ProjectAnalysis } from '../../asmTemplateGenerator';

export function hasRuntimeSecretZone(screen: any): boolean {
  if (!Array.isArray(screen?.effectZones)) return false;

  return screen.effectZones.some((zone: any) => {
    const rect = zone?.rect || {};
    const width = Number(rect.width ?? zone?.width ?? 0);
    const height = Number(rect.height ?? zone?.height ?? 0);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return false;
    }

    if (zone?.effectType === 'secretZone') return true;

    const hasKnownEffectType = typeof zone?.effectType === 'string' && zone.effectType.length > 0;
    const mask = Number(zone?.mask ?? 0);
    const hasLegacyNonSecretMask = Number.isFinite(mask) && mask !== 0;

    return !hasKnownEffectType && !hasLegacyNonSecretMask;
  });
}

export function shouldKeepRuntimeBackgroundLayout(analysis: ProjectAnalysis): boolean {
  return false;
}

export function getRuntimeSecretRestoreBufferSize(analysis: ProjectAnalysis): number {
  const screens = Array.isArray(analysis.screenMaps) ? analysis.screenMaps : [];
  let maxArea = 0;

  for (const screen of screens) {
    if (!Array.isArray(screen?.effectZones)) continue;

    for (const zone of screen.effectZones) {
      const zoneAny = zone as any;
      const rect = (zoneAny?.rect || {}) as any;
      const width = Number(rect.width ?? zoneAny?.width ?? 0);
      const height = Number(rect.height ?? zoneAny?.height ?? 0);
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        continue;
      }

      const syntheticScreen = { effectZones: [zone] };
      if (!hasRuntimeSecretZone(syntheticScreen)) continue;

      maxArea = Math.max(maxArea, Math.min(32, width) * Math.min(24, height));
    }
  }

  return Math.min(768, maxArea);
}

/**
 * @fileoverview Sprites Generator - Sprite pattern and animation data
 * Generates sprites.asm with sprite definitions and management functions
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { buildMSXDirectionalSpriteCatalog, generateSpriteASMCode } from '../../../components/utils/spriteUtils';
import { analyzeComponentUsage } from '../utils/componentAnalyzer';
import { MSX1_PALETTE } from '../../../constants';
import { usesMapperBanking } from './romModeUtils';
import {
  buildMapperBankEqu,
  buildMapperDataPopAsm,
  buildMapperWindowedAddress,
  getMapperWindowConfig,
  type MapperTargetFormat,
} from './mapperWindowUtils';
import { buildResourceIdLabelFromAsmLabel } from '../utils/megaromResourceArtifacts';

// Constants
const SPRITE_INVISIBLE_VALUE = 224; // MSX: Y >= 209 hides sprite, but 224 is safer off-screen
const DEFAULT_DATA_FORMAT = 'hex';
const SPRITE_PATTERN_SLOT_CAPACITY = 64; // MSX1 SPRPAT = 2048 bytes = 64 patterns of 16x16

/**
 * Analyze drawable palette layers for a sprite across ALL frames.
 * Returns palette layer indexes that are really used at least once.
 */
const analyzeDrawableLayerIndexes = (sprite: any): number[] => {
  const palette: string[] = sprite?.spritePalette || [];
  const bg: string | undefined = sprite?.backgroundColor;
  const frames = sprite?.frames || [];

  if (!palette.length || !frames.length) return [];
  const used: number[] = [];

  for (let layerIdx = 0; layerIdx < palette.length; layerIdx++) {
    const layerColor = palette[layerIdx];
    if (!layerColor || layerColor === bg) continue;

    let hasPixels = false;
    for (const frame of frames) {
      if (!frame?.data) continue;
      for (let y = 0; y < (frame.data.length || 0) && !hasPixels; y++) {
        for (let x = 0; x < (frame.data[y]?.length || 0) && !hasPixels; x++) {
          if (frame.data[y][x] === layerColor) {
            hasPixels = true;
          }
        }
      }
      if (hasPixels) break;
    }

    if (hasPixels) {
      used.push(layerIdx);
    }
  }

  return used;
};

const findFirstDrawableLayerIndex = (sprite: any): number => {
  const usedLayers = analyzeDrawableLayerIndexes(sprite);
  return usedLayers.length > 0 ? usedLayers[0] : -1;
};

function buildSpritePatternDataSection(sprites: any[]): string {
  let code = `; ==================================================================
; SPRITE PATTERN DATA
; ==================================================================
`;

  sprites.forEach((sprite, index) => {
    const suffix = `_${index}`;
    const uniqueName = sprite.name + suffix;
    const spriteASM = generateSpriteASMCode(sprite, DEFAULT_DATA_FORMAT, index);

    code += `\n; Sprite Asset ${index}: ${sprite.name}\n${spriteASM}`;
  });

  code += `
; ==================================================================
; PLACEHOLDER SPRITE PATTERN (for entities with missing sprite assets)
; ==================================================================
; 16x16 white square sprite (solid fill)
SPRITE_PLACEHOLDER_PATTERN:
    ; Top half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Bottom half (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half top (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
    ; Right half bottom (8x8)
    db #FF, #FF, #FF, #FF, #FF, #FF, #FF, #FF
`;

  return code;
}

type SpritePatternUsage = {
  index: number;
  name: string;
  frameCount: number;
  layerCount: number;
  slotCount: number;
};

export interface RuntimeSpritePatternPack {
  id: string;
  label: string;
  displayName: string;
  spriteIndexes: number[];
  totalSlotsRequired: number;
  placeholderSlot: number;
  baseSlotsBySpriteIndex: number[];
}

export interface ScreenSpritePatternUsageSummary {
  screenId: string;
  screenName: string;
  totalSlotsRequired: number;
}

const buildSpritePatternUsage = (sprites: any[]): SpritePatternUsage[] =>
  sprites.map((sprite, index) => {
    const frameCount = Math.max(1, sprite?.frames?.length || 1);
    const layerCount = Math.max(1, analyzeDrawableLayerIndexes(sprite).length);
    return {
      index,
      name: sprite?.name || `sprite_${index}`,
      frameCount,
      layerCount,
      slotCount: frameCount * layerCount,
    };
  });

const buildSpritePatternCapacityError = (
  usages: SpritePatternUsage[],
  requiredSlots: number,
  scopeLabel: string
): string => {
  const lines = usages
    .slice()
    .sort((a, b) => b.slotCount - a.slotCount || a.index - b.index)
    .slice(0, 12)
    .map(
      usage =>
        `- Sprite ${usage.index} "${usage.name}": ${usage.frameCount} frame(s) x ${usage.layerCount} layer(s) = ${usage.slotCount} slots`
    );

  return [
    `Runtime sprite-pattern uploads are disabled for gameplay exports.`,
    `${scopeLabel} needs ${requiredSlots} sprite pattern slots (including 1 placeholder), but MSX1 SPRPAT only fits ${SPRITE_PATTERN_SLOT_CAPACITY}.`,
    `Reduce sprite frames/layers or split the runtime sprite set so it fits entirely in VRAM preload mode.`,
    lines.length > 0 ? `Largest sprite consumers:\n${lines.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

const toSpritePatternPackLabel = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '_');

const resolveSpriteIndexByReference = (
  spriteRef: unknown,
  spriteNameToIndex: Record<string, number>,
  spriteCount: number
): number | null => {
  if (typeof spriteRef === 'number' && Number.isInteger(spriteRef) && spriteRef >= 0 && spriteRef < spriteCount) {
    return spriteRef;
  }

  if (typeof spriteRef !== 'string') {
    return null;
  }

  const trimmed = spriteRef.trim();
  if (!trimmed) {
    return null;
  }

  const directIndex = spriteNameToIndex[trimmed];
  if (directIndex !== undefined) {
    return directIndex;
  }

  const lowerIndex = spriteNameToIndex[trimmed.toLowerCase()];
  if (lowerIndex !== undefined) {
    return lowerIndex;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed >= 0 && parsed < spriteCount ? parsed : null;
};

const findComponentPropertyName = (
  componentDef: any,
  predicate: (prop: any) => boolean
): string | null => {
  const prop = componentDef?.properties?.find((candidate: any) => predicate(candidate));
  return prop?.name || null;
};

const resolveEntitySpriteAssetId = (entity: any, analysis: ProjectAnalysis): string | undefined => {
  const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);
  const componentDefinitions = analysis.components || [];

  if (entity?.componentOverrides) {
    for (const compId of Object.keys(entity.componentOverrides)) {
      const compDef = componentDefinitions.find((c: any) => c.id === compId);
      const propName = findComponentPropertyName(compDef, (prop: any) => prop.type === 'sprite_ref');
      if (propName && entity.componentOverrides[compId]?.[propName]) {
        return entity.componentOverrides[compId][propName];
      }
    }
  }

  for (const comp of template?.components || []) {
    const compDef = componentDefinitions.find((c: any) => c.id === comp.definitionId);
    const propName = findComponentPropertyName(compDef, (prop: any) => prop.type === 'sprite_ref');
    if (propName && comp.defaultValues?.[propName]) {
      return comp.defaultValues[propName];
    }
  }

  return undefined;
};

const resolveTemplateSpriteAssetId = (template: any, analysis: ProjectAnalysis): string | undefined => {
  const componentDefinitions = analysis.components || [];
  for (const comp of template?.components || []) {
    const compDef = componentDefinitions.find((c: any) => c.id === comp.definitionId);
    const propName = findComponentPropertyName(compDef, (prop: any) => prop.type === 'sprite_ref');
    if (propName && comp.defaultValues?.[propName]) {
      return comp.defaultValues[propName];
    }
  }
  return undefined;
};

const resolveEntityStateMachineAssetId = (entity: any, analysis: ProjectAnalysis): string | undefined => {
  const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);
  const componentDefinitions = analysis.components || [];

  if (entity?.componentOverrides) {
    for (const compId of Object.keys(entity.componentOverrides)) {
      const compDef = componentDefinitions.find((c: any) => c.id === compId);
      const propName = findComponentPropertyName(
        compDef,
        (prop: any) => prop.type === 'statemachine_ref' || prop.name === 'stateMachineAssetId' || prop.name === 'state_machine'
      );
      if (propName && entity.componentOverrides[compId]?.[propName]) {
        return entity.componentOverrides[compId][propName];
      }
    }
  }

  for (const comp of template?.components || []) {
    const compDef = componentDefinitions.find((c: any) => c.id === comp.definitionId);
    const propName = findComponentPropertyName(
      compDef,
      (prop: any) => prop.type === 'statemachine_ref' || prop.name === 'stateMachineAssetId' || prop.name === 'state_machine'
    );
    if (propName && comp.defaultValues?.[propName]) {
      return comp.defaultValues[propName];
    }
  }

  return undefined;
};

const resolveTemplateStateMachineAssetId = (template: any, analysis: ProjectAnalysis): string | undefined => {
  const componentDefinitions = analysis.components || [];
  for (const comp of template?.components || []) {
    const compDef = componentDefinitions.find((c: any) => c.id === comp.definitionId);
    const propName = findComponentPropertyName(
      compDef,
      (prop: any) => prop.type === 'statemachine_ref' || prop.name === 'stateMachineAssetId' || prop.name === 'state_machine'
    );
    if (propName && comp.defaultValues?.[propName]) {
      return comp.defaultValues[propName];
    }
  }
  return undefined;
};

const collectStateMachineActions = (stateMachine: any): any[] => {
  const actions: any[] = [];
  for (const state of stateMachine?.states || []) {
    if (Array.isArray(state?.onEnter)) actions.push(...state.onEnter);
    if (Array.isArray(state?.onExit)) actions.push(...state.onExit);
  }
  for (const transition of stateMachine?.transitions || []) {
    if (Array.isArray(transition?.actions)) actions.push(...transition.actions);
  }
  return actions;
};

const createRuntimeSpritePatternPackBuilder = (analysis: ProjectAnalysis) => {
  const spriteCatalog = buildMSXDirectionalSpriteCatalog(analysis.sprites || []);
  const spritePatternUsage = buildSpritePatternUsage(spriteCatalog.sprites);
  const stateMachinesById = new Map(
    (analysis.stateMachines || [])
      .filter((sm: any) => sm?.id)
      .map((sm: any) => [sm.id, sm])
  );
  const templatesById = new Map(
    (analysis.templates || [])
      .filter((template: any) => template?.id)
      .map((template: any) => [template.id, template])
  );

  return (id: string, displayName: string, entities: any[]): RuntimeSpritePatternPack => {
    const spriteIndexes = new Set<number>();
    const queuedTemplateIds = new Set<string>();
    const processedTemplateIds = new Set<string>();
    const processedStateMachineIds = new Set<string>();

    const addSpriteReference = (spriteRef: unknown) => {
      const spriteIndex = resolveSpriteIndexByReference(spriteRef, spriteCatalog.nameToIndex, spriteCatalog.sprites.length);
      if (spriteIndex !== null) {
        spriteIndexes.add(spriteIndex);
      }
    };

    const queueTemplate = (templateId: unknown) => {
      if (typeof templateId === 'string' && templateId) {
        queuedTemplateIds.add(templateId);
      }
    };

    const processStateMachine = (stateMachineId: unknown) => {
      if (typeof stateMachineId !== 'string' || !stateMachineId || processedStateMachineIds.has(stateMachineId)) {
        return;
      }
      processedStateMachineIds.add(stateMachineId);

      const stateMachine = stateMachinesById.get(stateMachineId);
      if (!stateMachine) return;

      for (const action of collectStateMachineActions(stateMachine)) {
        if (!action || typeof action !== 'object') continue;
        if (action.type === 'CHANGE_SPRITE') {
          addSpriteReference(action.params?.sprite ?? action.params?.spriteId);
        } else if (action.type === 'SPAWN_ENTITY') {
          queueTemplate(action.params?.templateId ?? action.params?.entityTemplateId ?? action.params?.entityId);
        }
      }
    };

    const processTemplate = (templateId: string) => {
      if (processedTemplateIds.has(templateId)) return;
      processedTemplateIds.add(templateId);

      const template = templatesById.get(templateId);
      if (!template) return;

      addSpriteReference(resolveTemplateSpriteAssetId(template, analysis));
      processStateMachine(resolveTemplateStateMachineAssetId(template, analysis));
    };

    for (const entity of entities) {
      addSpriteReference(resolveEntitySpriteAssetId(entity, analysis));
      processStateMachine(resolveEntityStateMachineAssetId(entity, analysis));
      queueTemplate(entity?.entityTemplateId);
    }

    while (queuedTemplateIds.size > 0) {
      const templateId = queuedTemplateIds.values().next().value as string;
      queuedTemplateIds.delete(templateId);
      processTemplate(templateId);
    }

    const pendingDirectional = Array.from(spriteIndexes);
    while (pendingDirectional.length > 0) {
      const spriteIndex = pendingDirectional.pop()!;
      const candidates = [
        spriteCatalog.directionalLookupTables.left[spriteIndex],
        spriteCatalog.directionalLookupTables.right[spriteIndex],
        spriteCatalog.directionalLookupTables.up[spriteIndex],
        spriteCatalog.directionalLookupTables.down[spriteIndex],
      ];
      for (const candidate of candidates) {
        if (typeof candidate === 'number' && candidate >= 0 && candidate < spriteCatalog.sprites.length && !spriteIndexes.has(candidate)) {
          spriteIndexes.add(candidate);
          pendingDirectional.push(candidate);
        }
      }
    }

    const sortedSpriteIndexes = Array.from(spriteIndexes).sort((a, b) => a - b);
    const baseSlotsBySpriteIndex = new Array(Math.max(1, spriteCatalog.sprites.length)).fill(0);
    let nextSlot = 0;
    const usedUsages: SpritePatternUsage[] = [];

    for (const spriteIndex of sortedSpriteIndexes) {
      const usage = spritePatternUsage[spriteIndex];
      if (!usage) continue;
      baseSlotsBySpriteIndex[spriteIndex] = nextSlot;
      nextSlot += usage.slotCount;
      usedUsages.push(usage);
    }

    const totalSlotsRequired = nextSlot + 1;
    if (totalSlotsRequired > SPRITE_PATTERN_SLOT_CAPACITY) {
      throw new Error(buildSpritePatternCapacityError(usedUsages, totalSlotsRequired, displayName));
    }

    return {
      id,
      label: toSpritePatternPackLabel(id),
      displayName,
      spriteIndexes: sortedSpriteIndexes,
      totalSlotsRequired,
      placeholderSlot: nextSlot,
      baseSlotsBySpriteIndex,
    };
  };
};

export const buildRuntimeSpritePatternPacks = (analysis: ProjectAnalysis): RuntimeSpritePatternPack[] => {
  const buildPack = createRuntimeSpritePatternPackBuilder(analysis);
  const worldMaps = (analysis.worldmaps || []) as any[];

  if (worldMaps.length === 0) {
    return [buildPack('default', 'Default runtime sprite set', analysis.entities || [])];
  }

  return worldMaps.map((world: any, index: number) => {
    const worldId = world?.id || `world_${index}`;
    const screenIds = new Set((world?.nodes || []).map((node: any) => node?.screenAssetId).filter(Boolean));
    const worldEntities = (analysis.entities || []).filter((entity: any) => screenIds.has(entity?.screenAssetId));
    return buildPack(worldId, `World "${world?.name || worldId}"`, worldEntities);
  });
};

export const buildScreenSpritePatternUsageSummaries = (analysis: ProjectAnalysis): ScreenSpritePatternUsageSummary[] => {
  const buildPack = createRuntimeSpritePatternPackBuilder(analysis);
  const screens = Array.isArray(analysis.screenMaps) ? analysis.screenMaps : [];
  return screens.map((screen: any, index: number) => {
    const screenId = String(screen?.id || `screen_${index}`);
    const screenName = String(screen?.name || `Screen ${index}`);
    const screenEntities = (analysis.entities || []).filter((entity: any) => entity?.screenAssetId === screenId);
    const pack = buildPack(screenId, `Screen "${screenName}"`, screenEntities);
    return {
      screenId,
      screenName,
      totalSlotsRequired: pack.totalSlotsRequired,
    };
  });
};

export function buildWorldSpritePatternPolicyManifest(analysis: ProjectAnalysis): string {
  const spriteCatalog = buildMSXDirectionalSpriteCatalog(analysis.sprites || []);
  const runtimePatternPacks = buildRuntimeSpritePatternPacks(analysis);
  const worldMaps = (analysis.worldmaps || []) as any[];
  const lines: string[] = [];

  lines.push('WORLD SPRITE PATTERN POLICY');
  lines.push('Source: runtime sprite packs inferred from entities present in each world.');
  lines.push(`Pack capacity: ${SPRITE_PATTERN_SLOT_CAPACITY} slots (including placeholder).`);
  lines.push('');

  if (runtimePatternPacks.length === 0) {
    lines.push('No runtime sprite packs generated.');
    return lines.join('\n');
  }

  lines.push('PACKS');
  runtimePatternPacks.forEach((pack, packIndex) => {
    lines.push(`PACK ${packIndex.toString().padStart(2, '0')} ${pack.label}`);
    lines.push(`- display: ${pack.displayName}`);
    lines.push(`- slots: ${pack.totalSlotsRequired}/${SPRITE_PATTERN_SLOT_CAPACITY}`);
    lines.push(`- placeholder_slot: ${pack.placeholderSlot}`);
    if (pack.spriteIndexes.length === 0) {
      lines.push(`- sprites: none`);
    } else {
      lines.push(`- sprites:`);
      pack.spriteIndexes.forEach((spriteIndex) => {
        const spriteName = spriteCatalog.sprites[spriteIndex]?.name || `sprite_${spriteIndex}`;
        const baseSlot = pack.baseSlotsBySpriteIndex[spriteIndex] || 0;
        lines.push(`  ${spriteIndex}: ${spriteName} @ slot ${baseSlot}`);
      });
    }
    lines.push('');
  });

  if (worldMaps.length > 0) {
    lines.push('WORLD -> PACK');
    worldMaps.forEach((world: any, worldIndex: number) => {
      const worldId = String(world?.id || `world_${worldIndex}`);
      const worldName = String(world?.name || `world_${worldIndex}`);
      const pack = runtimePatternPacks[worldIndex];
      lines.push(
        `${worldIndex.toString().padStart(2, '0')} ${worldName} (${worldId}) -> ` +
        `${pack ? `${pack.label} [id=${worldIndex}]` : 'none'}`
      );
    });
  } else {
    lines.push('WORLD -> PACK');
    lines.push(`00 default -> ${runtimePatternPacks[0].label} [id=0]`);
  }

  return lines.join('\n').trimEnd();
}

/**
 * Generate sprite data file (sprites.asm)
 *
 * @param analysis - Project analysis with sprite assets
 * @returns ASM code string with sprite data and functions
 */
export function generateSpritesFile(
  analysis: ProjectAnalysis,
  romMode: string = 'simple32k',
  dataInBank4: boolean = false,
  targetFormat: MapperTargetFormat = 'konami'
): string {
  const sourceSprites = analysis.sprites || [];
  const usesMapper = usesMapperBanking(romMode);
  const useResourceManager = romMode === 'megarom';
  const mapperWindow = getMapperWindowConfig(romMode, targetFormat);
  const mapperPop = usesMapper ? buildMapperDataPopAsm(mapperWindow) : '';
  const spriteCatalog = buildMSXDirectionalSpriteCatalog(sourceSprites);
  const sprites = spriteCatalog.sprites;
  const spriteNameToIndex = spriteCatalog.nameToIndex;
  const directionalLookupTables = spriteCatalog.directionalLookupTables;
  const runtimePatternPacks = buildRuntimeSpritePatternPacks(analysis);
  const defaultRuntimePatternPack = runtimePatternPacks[0];
  const worldMaps = (analysis.worldmaps || []) as any[];

  spriteCatalog.warnings.forEach(warning => {
    console.warn(`[Sprites Generator] ${warning}`);
  });

  console.log('🎨 generateSpritesFile() called:');
  console.log(`  - analysis.sprites.length: ${sourceSprites.length}`);
  console.log(`  - expandedSprites.length: ${sprites.length}`);
  console.log(`  - analysis.entities.length: ${analysis.entities?.length || 0}`);
  console.log(`  - analysis.templates.length: ${analysis.templates?.length || 0}`);

  // INTELLIGENT SPRITE MAPPING & MULTI-LAYER SUPPORT
  const { activeEntities } = analyzeComponentUsage(analysis);

  console.log(`  - activeEntities.length: ${activeEntities.length}`);

  // Helper to parse hex color to RGB
  const hexToRGB = (hex: string): { r: number; g: number; b: number } | null => {
    if (!hex || hex.startsWith('rgba')) return null;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return null;
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16)
    };
  };

  // Helper to get MSX1 color index from hex (nearest color match)
  const hexToMSX1Index = (hex: string): number => {
    if (!hex) return 0;
    // Try exact match first
    const exact = MSX1_PALETTE.find(c => c.hex.toUpperCase() === hex.toUpperCase());
    if (exact) return exact.index;
    // Nearest color match (Euclidean distance in RGB space)
    const rgb = hexToRGB(hex);
    if (!rgb) return 15;
    let bestIndex = 15;
    let bestDist = Infinity;
    for (const c of MSX1_PALETTE) {
      if (c.index === 0) continue; // Skip transparent
      const cRGB = hexToRGB(c.hex);
      if (!cRGB) continue;
      const dist = (rgb.r - cRGB.r) ** 2 + (rgb.g - cRGB.g) ** 2 + (rgb.b - cRGB.b) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = c.index;
      }
    }
    return bestIndex;
  };

  // Helper to analyze sprite layers/colors.
  // Uses compact stable layer set (only globally used layers), matching
  // spriteUtils.generateSpriteASMCode() output layout.
  const getSpriteLayerColors = (sprite: any): number[] => {
    if (!sprite) return [15]; // Default white

    const palette: string[] = sprite.spritePalette || [];
    const bg: string | undefined = sprite.backgroundColor;
    const usedLayerIndexes = analyzeDrawableLayerIndexes(sprite);
    if (usedLayerIndexes.length === 0) return [15];

    const colors: number[] = usedLayerIndexes.map((layerIdx) => {
      const hex = palette[layerIdx];
      if (!hex || (bg && hex === bg)) {
        return 0;
      } else {
        return hexToMSX1Index(hex);
      }
    });

    return colors.length > 0 ? colors : [15];
  };

  const emitDirectionTable = (label: string, values: number[]): string => {
    let table = `${label}:\n`;
    if (values.length === 0) {
      table += `    db 0\n`;
      return table;
    }

    const bytesPerLine = 16;
    for (let i = 0; i < values.length; i += bytesPerLine) {
      const chunk = values.slice(i, i + bytesPerLine);
      table += `    db ${chunk.join(', ')}\n`;
    }
    return table;
  };

  const getEntitySpriteInfo = (entity: any): { spriteAssetIndex: number; spriteName: string; colors: number[] } | null => {
    console.log(`\n🔍 getEntitySpriteInfo for entity: "${entity.name}" (template: ${entity.entityTemplateId})`);
    console.log(`   Available sprites: ${sprites.map(s => `"${s.name}" (${s.id})`).join(', ') || 'NONE'}`);

    const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);
    if (!template) {
      console.log(`   ❌ Template not found!`);
      return null;
    }
    console.log(`   Template found: "${template.name}"`);
    console.log(`   Template components: ${template.components?.map((c: any) => c.definitionId).join(', ') || 'NONE'}`);

    // Use the same logic as GameFlowPreviewModal.tsx:
    // 1. First check componentOverrides for sprite_ref properties
    // 2. Then check template.components defaultValues for sprite_ref properties

    const componentDefinitions = analysis.components || [];
    let spriteAssetId: string | undefined;

    // Step 1: Check entity instance overrides first
    if (entity.componentOverrides) {
      for (const compId in entity.componentOverrides) {
        const compDef = componentDefinitions.find((c: any) => c.id === compId);
        const spriteProp = compDef?.properties?.find((p: any) => p.type === 'sprite_ref');
        if (spriteProp && entity.componentOverrides[compId]?.[spriteProp.name]) {
          spriteAssetId = entity.componentOverrides[compId][spriteProp.name];
          console.log(`   ✅ Found spriteAssetId in overrides: "${spriteAssetId}"`);
          break;
        }
      }
    }

    // Step 2: If not found in overrides, check template component defaults
    if (!spriteAssetId) {
      for (const comp of template.components || []) {
        const compDef = componentDefinitions.find((c: any) => c.id === comp.definitionId);
        const spriteProp = compDef?.properties?.find((p: any) => p.type === 'sprite_ref');
        if (spriteProp && comp.defaultValues?.[spriteProp.name]) {
          spriteAssetId = comp.defaultValues[spriteProp.name];
          console.log(`   ✅ Found spriteAssetId in template defaults: "${spriteAssetId}"`);
          break;
        }
      }
    }

    console.log(`   Resolved spriteAssetId: "${spriteAssetId || 'undefined'}"`);

    // If no spriteAssetId found, entity has no sprite configured
    if (!spriteAssetId) {
      console.log(`   ⚠️ No sprite_ref property found in any component`);
      // Fallback: use first available sprite if any exist
      if (sprites.length > 0) {
        console.log(`   ⚠️ Defaulting to first sprite "${sprites[0].name}"`);
        return {
          spriteAssetIndex: 0,
          spriteName: sprites[0].name,
          colors: getSpriteLayerColors(sprites[0])
        };
      }
      return null;
    }

    // Find sprite by ID/name alias map (includes auto-generated directional aliases)
    let foundIndex = spriteNameToIndex[spriteAssetId];
    if (foundIndex === undefined) {
      foundIndex = spriteNameToIndex[spriteAssetId.toLowerCase()];
    }

    // If still not found, try partial name match
    if (foundIndex === undefined) {
      const spriteIdLower = spriteAssetId.toLowerCase();
      foundIndex = sprites.findIndex(s =>
        s.name?.toLowerCase().includes(spriteIdLower) ||
        spriteIdLower.includes(s.name?.toLowerCase() || '')
      );
    }

    if (foundIndex !== undefined && foundIndex >= 0) {
      console.log(`   ✅ Found sprite "${sprites[foundIndex].name}" at index ${foundIndex}`);
      return {
        spriteAssetIndex: foundIndex,
        spriteName: sprites[foundIndex].name,
        colors: getSpriteLayerColors(sprites[foundIndex])
      };
    }

    // Sprite ID specified but not found in assets
    console.log(`   ❌ Sprite "${spriteAssetId}" not found in project assets`);
    return {
      spriteAssetIndex: -1,
      spriteName: `MISSING_${spriteAssetId}`,
      colors: [15] // White placeholder
    };
  };

  // Phase 1: Analyze allocation
  // Map each active entity to a set of hardware sprites (layers)
  interface EntitySpriteAllocation {
    entityIndex: number;
    spriteName: string;
    spriteAssetIndex: number;
    baseHwSpriteIndex: number;
    layerCount: number;
    colors: number[];
  }

  const entityAllocations: EntitySpriteAllocation[] = [];
  let currentHwSpriteIndex = 0;

  activeEntities.forEach((entity, entityIndex) => {
    const spriteInfo = getEntitySpriteInfo(entity);

    if (!spriteInfo) {
      // Fallback: ensure every active entity gets at least a placeholder sprite
      entityAllocations.push({
        entityIndex,
        spriteName: 'PLACEHOLDER',
        spriteAssetIndex: -1,
        baseHwSpriteIndex: currentHwSpriteIndex,
        layerCount: 1,
        colors: [15] // White placeholder
      });
      currentHwSpriteIndex += 1;
      return;
    }

    entityAllocations.push({
      entityIndex,
      spriteName: spriteInfo.spriteName,
      spriteAssetIndex: spriteInfo.spriteAssetIndex,
      baseHwSpriteIndex: currentHwSpriteIndex,
      layerCount: spriteInfo.colors.length,
      colors: spriteInfo.colors
    });

    currentHwSpriteIndex += spriteInfo.colors.length;
  });

  const spritePatternUsage = buildSpritePatternUsage(sprites);

  // Always reserve full hardware sprite table (32) in RAM.
  // VRAM upload can be smaller: active range + one SAT end marker sprite.
  // However, if any SubMenu node uses a sprite cursor (slots 28-31),
  // we must upload the full SAT so those slots reach VRAM.
  const totalHardwareSprites = 32;
  const SUBMENU_CURSOR_BASE = 28;
  const SUBMENU_CURSOR_MAX = 4;
  const hasSubmenuCursorSprite = (analysis.gameFlow?.nodes || []).some(
    (n: any) => n.type === 'SubMenu' && n.appearance?.cursorSpriteAssetId
  );
  const maxUsedSlot = hasSubmenuCursorSprite
    ? SUBMENU_CURSOR_BASE + SUBMENU_CURSOR_MAX
    : Math.max(1, Math.min(currentHwSpriteIndex, totalHardwareSprites));
  const uploadHardwareSprites = Math.min(
    maxUsedSlot < totalHardwareSprites ? maxUsedSlot + 1 : totalHardwareSprites,
    totalHardwareSprites
  );
  const uploadBytes = uploadHardwareSprites * 4;

  // Phase 2: Generate Code
  let code = `; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: ${activeEntities.length}
; Total Hardware Sprites (Layers): ${totalHardwareSprites}
; SAT Upload Sprites per frame: ${uploadHardwareSprites}
; Sprite Pattern Preload Mode: STATIC_ALL_FRAMES
; Runtime Sprite Pattern Packs: ${runtimePatternPacks.length}
; ==================================================================
`;

  if (!dataInBank4) {
    code += buildSpritePatternDataSection(sprites);
  } else {
    code += `; SPRITE_DATA_ROM_DATA_GROUP: bank4\n`;
    code += `; (sprite pattern blobs are emitted in bank4 data zones for megarom builds)\n`;
  }

  // Generate sprite pattern aliases and bank constants
  sprites.forEach((sprite, index) => {
    const uniqueName = `${sprite.name}_${index}`;
    const safeSpriteName = uniqueName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();

    // Find first layer that actually has pixel data
    const firstDrawableLayerIndex = findFirstDrawableLayerIndex(sprite);

    if (firstDrawableLayerIndex >= 0) {
      code += `\n; Unified pattern label for sprite ${index}
SPRITE_${index}_PATTERN EQU ${safeSpriteName}_F0_LAYER${firstDrawableLayerIndex}
SPRITE_${index}_PATTERN_BANK EQU ${buildMapperBankEqu(`SPRITE_${index}_PATTERN`, mapperWindow)}\n`;
    } else {
      code += `\n; WARNING: No valid pattern layers found for sprite ${index}
SPRITE_${index}_PATTERN:
    db 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0
SPRITE_${index}_PATTERN_BANK EQU ${buildMapperBankEqu(`SPRITE_${index}_PATTERN`, mapperWindow)}\n`;
    }

  });

  code += `
SPRITE_PLACEHOLDER_PATTERN_BANK EQU ${buildMapperBankEqu('SPRITE_PLACEHOLDER_PATTERN', mapperWindow)}

`;

  if (sprites.length === 0) {
    code += `; No sprite assets found - using placeholder pattern only 
SPRITE_0_PATTERN EQU SPRITE_PLACEHOLDER_PATTERN
SPRITE_0_PATTERN_BANK EQU ${buildMapperBankEqu('SPRITE_0_PATTERN', mapperWindow)}\n`;
  }

  // Sprite animation metadata tables
  code += `
; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count:
`;
  sprites.forEach((sprite, index) => {
    const frames = sprite.frames?.length || 1;
    code += `    db ${frames} ; Sprite ${index}: ${sprite.name}\n`;
  });
  if (sprites.length === 0) {
    code += `    db 1 ; Placeholder\n`;
  }

  code += `SPRITE_ASSET_COUNT EQU ${Math.max(1, sprites.length)}\n`;
  code += `SPRITE_PATTERN_PRELOAD_MODE EQU 1\n`;

  code += `
; Table: Sprite Asset Loop Flags
; Format: db flags (bit 1: 1=loop, 0=once)
sprite_loop_flags:
`;
  sprites.forEach((sprite, index) => {
    // Default to looping if loops property is undefined, as per Mideas defaults
    const loops = sprite.loops !== false;
    const loopVal = loops ? '2' : '0';
    code += `    db ${loopVal} ; Sprite ${index}: ${sprite.name}\n`;
  });
  if (sprites.length === 0) {
    code += `    db 2 ; Placeholder (loops by default)\n`;
  }

  code += `
; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
`;
  sprites.forEach((_sprite, index) => {
    code += `    dw SPRITE_${index}_FRAME_PTRS\n`;
  });
  if (sprites.length === 0) {
    code += `    dw SPRITE_0_FRAME_PTRS\n`;
  }

  sprites.forEach((sprite, index) => {
    const suffix = `_${index}`;
    const uniqueName = sprite.name + suffix;
    const safeSpriteName = uniqueName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    const firstDrawableLayerIndex = findFirstDrawableLayerIndex(sprite);
    const frames = sprite.frames?.length || 1;

    code += `
; Sprite ${index}: ${sprite.name} frame pointers
SPRITE_${index}_FRAME_PTRS:
`;
    for (let f = 0; f < frames; f++) {
      if (firstDrawableLayerIndex >= 0) {
        code += `    dw ${safeSpriteName}_F${f}_LAYER${firstDrawableLayerIndex}\n`;
      } else {
        code += `    dw SPRITE_PLACEHOLDER_PATTERN\n`;
      }
    }
  });
  if (sprites.length === 0) {
    code += `
SPRITE_0_FRAME_PTRS:
    dw SPRITE_PLACEHOLDER_PATTERN
`;
  }

  code += `
; ==================================================================
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
`;
  code += emitDirectionTable('sprite_dir_left_table', directionalLookupTables.left);
  code += '\n';
  code += emitDirectionTable('sprite_dir_right_table', directionalLookupTables.right);
  code += '\n';
  code += emitDirectionTable('sprite_dir_up_table', directionalLookupTables.up);
  code += '\n';
  code += emitDirectionTable('sprite_dir_down_table', directionalLookupTables.down);
  code += '\n';

  code += ` 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config: 
`;
  entityAllocations.forEach(alloc => {
    const baseIndex = alloc.baseHwSpriteIndex >= 0 ? alloc.baseHwSpriteIndex : 0;
    code += `    db ${baseIndex}, ${alloc.layerCount} ; Entity ${alloc.entityIndex} (${alloc.spriteName})\n`;
  });
  // Fill for remaining entities (if any mismatch)
  if (entityAllocations.length < 32) {
    code += `    ds ${(32 - entityAllocations.length) * 2}, 0 ; Padding\n`;
  }

  code += `
; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
`;
  entityAllocations.forEach(alloc => {
    const idx = alloc.spriteAssetIndex >= 0 ? alloc.spriteAssetIndex : 0xFF;
    code += `    db #${idx.toString(16).toUpperCase().padStart(2, '0')} ; Entity ${alloc.entityIndex} (${alloc.spriteName})\n`;
  });
  if (entityAllocations.length < 32) {
    code += `    ds ${32 - entityAllocations.length}, #FF ; Padding\n`;
  }

  // Compute max layer count across all entity allocations (used by SM color update)
  const maxEntityLayers = Math.max(1, ...entityAllocations.map(a => a.layerCount));

  code += `SPRITE_MAX_ENTITY_LAYERS EQU ${maxEntityLayers}  ; Max HW sprite layers per entity\n`;

  code += `
; Table: Hardware Sprite Layer Colors (ROM initial values - copied to RAM at init)
; Format: db color_index
sprite_layer_colors_init:
`;
  let colorsWritten = 0;
  entityAllocations.forEach(alloc => {
    if (alloc.layerCount > 0) {
      code += `    ; Entity ${alloc.entityIndex} (${alloc.spriteName}) layers:\n`;
      alloc.colors.forEach((color, i) => {
        code += `    db ${color} ; Layer ${i}\n`;
        colorsWritten += 1;
      });
    }
  });
  // Padding to fill 32 slots total
  const remainingColors = totalHardwareSprites - colorsWritten;
  if (remainingColors > 0) {
    code += `    ds ${remainingColors}, 0 ; Padding\n`;
  }

  // SM_SpriteLayerColorTable: per-sprite color table for Action_ChangeSprite
  // Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite, in the same layer order
  // as the sprite pattern blob (usedLayerIndexes order, padded with 0 for empty slots)
  code += `
; Table: SM Sprite Layer Colors (for Action_ChangeSprite runtime color update)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = color for HW sprite slot j of sprite i
SM_SpriteLayerColorTable:
`;
  sprites.forEach((sprite, index) => {
    const colors = getSpriteLayerColors(sprite);
    const paddedColors: number[] = [...colors];
    while (paddedColors.length < maxEntityLayers) paddedColors.push(0);
    code += `    db ${paddedColors.join(', ')} ; Sprite ${index}: ${sprite.name}\n`;
  });
  if (sprites.length === 0) {
    const zeros = Array(maxEntityLayers).fill(0);
    code += `    db ${zeros.join(', ')} ; Placeholder\n`;
  }

  code += `
; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    ; Copy sprite_layer_colors_init (ROM) -> sprite_layer_colors (RAM)
    ld hl, sprite_layer_colors_init
    ld de, sprite_layer_colors
    ld bc, 32
    ldir
    call clear_all_sprites
    ld hl, sprite_asset_base_pattern_slot_runtime
    ld (hl), 0
${Math.max(1, sprites.length) > 1 ? `    ld de, sprite_asset_base_pattern_slot_runtime+1
    ld bc, ${Math.max(1, sprites.length) - 1}
    ldir
` : ``}    xor a
    ld (sprite_placeholder_base_pattern_num), a
    ld a, #FF
    ld (current_sprite_pattern_pack_id), a
${(analysis.worldmaps || []).length === 0 ? `    call load_sprite_patterns
` : ``}    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
${defaultRuntimePatternPack ? `    call load_sprite_patterns_${defaultRuntimePatternPack.label}
    ret
` : `    ret
`}
`;

  code += `
SPRITE_PATTERN_PACK_INVALID EQU #FF
SPRITE_PATTERN_PACK_COUNT EQU ${runtimePatternPacks.length}
`;

  if (worldMaps.length > 0) {
    code += `
; World index -> runtime sprite pattern pack id
world_sprite_pattern_pack_table:
`;
    worldMaps.forEach((world: any, index: number) => {
      const worldId = world?.id || `world_${index}`;
      const packLabel = toSpritePatternPackLabel(worldId).toUpperCase();
      code += `    db SPRITE_PATTERN_PACK_${packLabel}_ID ; World ${index}: ${world?.name || worldId}\n`;
    });
  }

  runtimePatternPacks.forEach((pack) => {
    code += `
; ------------------------------------------------------------------
; Runtime Sprite Pattern Pack: ${pack.displayName}
; Slots required: ${pack.totalSlotsRequired}/${SPRITE_PATTERN_SLOT_CAPACITY}
; ------------------------------------------------------------------
SPRITE_PATTERN_PACK_${pack.label.toUpperCase()}_ID EQU ${runtimePatternPacks.indexOf(pack)}

sprite_asset_base_pattern_slot_${pack.label}:
`;
    const spriteCount = Math.max(1, sprites.length);
    for (let index = 0; index < spriteCount; index++) {
      const spriteName = sprites[index]?.name || 'Placeholder';
      code += `    db ${pack.baseSlotsBySpriteIndex[index] || 0} ; Sprite ${index}: ${spriteName}\n`;
    }

    code += `
load_sprite_patterns_${pack.label}:
    ld hl, sprite_asset_base_pattern_slot_${pack.label}
    ld de, sprite_asset_base_pattern_slot_runtime
    ld bc, SPRITE_ASSET_COUNT
    ldir
    ld a, ${pack.placeholderSlot * 4}
    ld (sprite_placeholder_base_pattern_num), a
${usesMapper && !useResourceManager ? `    call mapper_push_${mapperWindow.dataWindowPage}\n` : ''}`;

    if (pack.spriteIndexes.length === 0) {
      code += `    ; No runtime sprites in this pack - placeholder only
`;
    } else {
      pack.spriteIndexes.forEach((spriteIndex) => {
        const sprite = sprites[spriteIndex];
        const usage = spritePatternUsage[spriteIndex];
        const basePatternSlot = pack.baseSlotsBySpriteIndex[spriteIndex] || 0;
        const uniqueName = `${sprite.name}_${spriteIndex}`;
        const safeSpriteName = uniqueName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
        const firstDrawableLayerIndex = findFirstDrawableLayerIndex(sprite);
        const drawableLayerIndexes = analyzeDrawableLayerIndexes(sprite);
        for (let frameIndex = 0; frameIndex < usage.frameCount; frameIndex++) {
          const frameBaseSlot = basePatternSlot + (frameIndex * usage.layerCount);
          if (useResourceManager && drawableLayerIndexes.length > 0) {
            code += `    ; Sprite Asset ${spriteIndex}: ${sprite.name} frame ${frameIndex} (${usage.layerCount} layers)\n`;
            drawableLayerIndexes.forEach((layerIndex, layerOffset) => {
              const frameLayerLabel = `${safeSpriteName}_F${frameIndex}_LAYER${layerIndex}`;
              const frameLayerResourceId = buildResourceIdLabelFromAsmLabel(frameLayerLabel);
              code += `    ld a, ${frameLayerResourceId}\n`;
              code += `    ld de, SPRPAT + (${frameBaseSlot + layerOffset} * 32)\n`;
              code += `    call resource_load_to_vram_by_id\n`;
            });
          } else {
            code += `    ; Sprite Asset ${spriteIndex}: ${sprite.name} frame ${frameIndex} (${usage.layerCount} layers)
${usesMapper ? `    ld a, SPRITE_${spriteIndex}_PATTERN_BANK\n    call mapper_set_bank_${mapperWindow.dataWindowPage}\n` : ''}    ld hl, ${usesMapper ? buildMapperWindowedAddress(`${safeSpriteName}_F${frameIndex}_LAYER${firstDrawableLayerIndex}`, mapperWindow) : `${safeSpriteName}_F${frameIndex}_LAYER${firstDrawableLayerIndex}`}
    ld de, SPRPAT + (${frameBaseSlot} * 32)
    ld bc, ${usage.layerCount * 32}
    call FAST_LDIRVM
`;
          }
        }
      });
    }

    code += `    ; Placeholder sprite used by missing sprite refs
${useResourceManager ? `    ld a, ${buildResourceIdLabelFromAsmLabel('SPRITE_PLACEHOLDER_PATTERN')}
    ld de, SPRPAT + (${pack.placeholderSlot} * 32)
    call resource_load_to_vram_by_id
    ld a, SPRITE_PATTERN_PACK_${pack.label.toUpperCase()}_ID
    ld (current_sprite_pattern_pack_id), a
    ret
` : `${usesMapper ? `    ld a, SPRITE_PLACEHOLDER_PATTERN_BANK\n    call mapper_set_bank_${mapperWindow.dataWindowPage}\n` : ''}    ld hl, ${usesMapper ? buildMapperWindowedAddress('SPRITE_PLACEHOLDER_PATTERN', mapperWindow) : 'SPRITE_PLACEHOLDER_PATTERN'}
    ld de, SPRPAT + (${pack.placeholderSlot} * 32)
    ld bc, 32
    call FAST_LDIRVM
    ld a, SPRITE_PATTERN_PACK_${pack.label.toUpperCase()}_ID
    ld (current_sprite_pattern_pack_id), a
${mapperPop}    ret
`}
`;

    code += `
ensure_sprite_patterns_${pack.label}:
    ld a, (current_sprite_pattern_pack_id)
    cp SPRITE_PATTERN_PACK_${pack.label.toUpperCase()}_ID
    ret z
    jp load_sprite_patterns_${pack.label}
`;
  });

  if (runtimePatternPacks.length > 0) {
    code += `
; ------------------------------------------------------------------
; Generic sprite pattern dispatchers
; ------------------------------------------------------------------
load_sprite_patterns_by_pack_id:
    cp SPRITE_PATTERN_PACK_INVALID
    ret z
`;
    runtimePatternPacks.forEach((pack) => {
      code += `    cp SPRITE_PATTERN_PACK_${pack.label.toUpperCase()}_ID\n`;
      code += `    jp z, load_sprite_patterns_${pack.label}\n`;
    });
    code += `    ret

ensure_sprite_patterns_by_pack_id:
    cp SPRITE_PATTERN_PACK_INVALID
    ret z
`;
    runtimePatternPacks.forEach((pack) => {
      code += `    cp SPRITE_PATTERN_PACK_${pack.label.toUpperCase()}_ID\n`;
      code += `    jp z, ensure_sprite_patterns_${pack.label}\n`;
    });
    code += `    ret
`;
  } else {
    code += `
load_sprite_patterns_by_pack_id:
    ret

ensure_sprite_patterns_by_pack_id:
    ret
`;
  }

  if (worldMaps.length > 0) {
    code += `
; ------------------------------------------------------------------
; ensure_sprite_patterns_for_world_id
; Input:  A = world id
; Output: matching sprite pack ensured when world id is valid
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
ensure_sprite_patterns_for_world_id:
    cp ${worldMaps.length}
    ret nc
    ld e, a
    ld d, 0
    ld hl, world_sprite_pattern_pack_table
    add hl, de
    ld a, (hl)
    jp ensure_sprite_patterns_by_pack_id
`;
  } else {
    code += `
ensure_sprite_patterns_for_world_id:
    ret
`;
  }

  code += `
; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = hardware sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:
    ; Safety check: Ensure sprite index < 32
    cp 32
    ret nc

    ; Safety check: Never write Y >= 208 (208 is SAT end marker on MSX)
    push af
    ld a, c
    cp 208
    jr c, .y_ok
    ld c, SPRITE_INVISIBLE
.y_ok:
    pop af

    ; Save pattern (D) and color (E) before calculating address
    push de

    ; Calculate base address for sprite: index * 4
    ld l, a
    ld h, 0
    add hl, hl      ; index * 2
    add hl, hl      ; index * 4
    ; Add base of the attribute table
    ld de, sprite_attributes
    add hl, de      ; HL = &sprite_attributes[index * 4]

    ; Restore pattern and color
    pop de

    ; Write attributes
    ld (hl), c      ; Y
    inc hl
    ld (hl), b      ; X
    inc hl
    ld (hl), d      ; Pattern
    inc hl
    ld (hl), e      ; Color

    ld a, 1
    ld (sprites_dirty), a
    ret

; Clear all sprites (set Y = SPRITE_INVISIBLE)
; OPTIMIZED: Uses faster increment method instead of ADD HL,DE
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, ${totalHardwareSprites}
    ld a, SPRITE_INVISIBLE
.sprite_clear_loop:
    ld (hl), a      ; Set Y = SPRITE_INVISIBLE
    inc hl          ; Skip to X
    inc hl          ; Skip to Pattern
    inc hl          ; Skip to Color
    inc hl          ; Next sprite (4× INC HL = 24 cycles vs ADD HL,DE = 35 cycles)
    djnz .sprite_clear_loop
    ld a, 1
    ld (sprites_dirty), a
    ret

; Hide specific sprite (A = hardware sprite index)
hide_sprite:
    cp 32
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), SPRITE_INVISIBLE
    ld a, 1
    ld (sprites_dirty), a
    ret

; Copy sprite attributes from RAM to VRAM
update_sprites_to_vram:
    ld a, (sprites_dirty)
    or a
    ret z
    xor a
    ld (sprites_dirty), a
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, ${uploadBytes}  ; Upload active sprite range + SAT end marker
    call FAST_LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU ${SPRITE_INVISIBLE_VALUE}

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds ${totalHardwareSprites * 4}
; active_sprite_count: db 0
; sprites_dirty: db 0
`;

  return code;
}

export function getSpritesBank4Data(analysis: ProjectAnalysis): string {
  const sourceSprites = analysis.sprites || [];
  const spriteCatalog = buildMSXDirectionalSpriteCatalog(sourceSprites);
  return buildSpritePatternDataSection(spriteCatalog.sprites);
}

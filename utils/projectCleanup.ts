/**
 * Utility functions to clean up unused componentDefinitions and entityTemplates
 * from project data before saving
 */

import { ProjectAsset, ComponentDefinition, EntityTemplate, ScreenMap } from '../types';

interface ProjectData {
  assets: ProjectAsset[];
  componentDefinitions: ComponentDefinition[];
  entityTemplates: EntityTemplate[];
}

/**
 * Find all componentDefinition IDs that are actually used in entityTemplates
 */
function getUsedComponentIds(entityTemplates: EntityTemplate[]): Set<string> {
  const usedIds = new Set<string>();

  entityTemplates.forEach(template => {
    template.components.forEach(comp => {
      usedIds.add(comp.definitionId);
    });
  });

  return usedIds;
}

/**
 * Find all entityTemplate IDs that are actually used in the project
 * Checks:
 * - ScreenMaps: entities array
 * - EffectZones: spawnEntityTemplateId
 * - Component properties: entity_template_ref type
 */
function getUsedEntityTemplateIds(
  assets: ProjectAsset[],
  entityTemplates: EntityTemplate[]
): Set<string> {
  const usedIds = new Set<string>();

  // Check ScreenMaps for entity instances
  assets.forEach(asset => {
    if (asset.type === 'screenmap' && asset.data) {
      const screenMapData = asset.data as ScreenMap;

      // Entities in screenmap
      screenMapData.entities?.forEach(entity => {
        if (entity.templateId) {
          usedIds.add(entity.templateId);
        }
      });

      // EffectZones that spawn entities
      screenMapData.effectZones?.forEach(zone => {
        if (zone.spawnEntityTemplateId) {
          usedIds.add(zone.spawnEntityTemplateId);
        }
      });
    }
  });

  // Check entityTemplates for references to other templates (in component properties)
  entityTemplates.forEach(template => {
    template.components.forEach(comp => {
      Object.values(comp.defaultValues || {}).forEach(value => {
        // Check if value looks like a template ID (starts with 'tpl_')
        if (typeof value === 'string' && value.startsWith('tpl_')) {
          usedIds.add(value);
        }
      });
    });
  });

  return usedIds;
}

/**
 * Remove unused componentDefinitions and entityTemplates from project data
 * Returns cleaned copies (does not mutate original)
 */
export function cleanUnusedDefinitions(projectData: ProjectData): {
  componentDefinitions: ComponentDefinition[];
  entityTemplates: EntityTemplate[];
  stats: {
    componentsRemoved: number;
    templatesRemoved: number;
  };
} {
  const { assets, componentDefinitions, entityTemplates } = projectData;

  // Step 1: Find used entity templates
  const usedTemplateIds = getUsedEntityTemplateIds(assets, entityTemplates);

  // Filter entity templates to keep only used ones
  const cleanedEntityTemplates = entityTemplates.filter(template =>
    usedTemplateIds.has(template.id)
  );

  // Step 2: Find used component definitions (from the cleaned entity templates)
  const usedComponentIds = getUsedComponentIds(cleanedEntityTemplates);

  // Filter component definitions to keep only used ones
  const cleanedComponentDefinitions = componentDefinitions.filter(compDef =>
    usedComponentIds.has(compDef.id)
  );

  const stats = {
    componentsRemoved: componentDefinitions.length - cleanedComponentDefinitions.length,
    templatesRemoved: entityTemplates.length - cleanedEntityTemplates.length,
  };

  return {
    componentDefinitions: cleanedComponentDefinitions,
    entityTemplates: cleanedEntityTemplates,
    stats,
  };
}

/**
 * Check if project has unused definitions
 */
export function hasUnusedDefinitions(projectData: ProjectData): boolean {
  const { stats } = cleanUnusedDefinitions(projectData);
  return stats.componentsRemoved > 0 || stats.templatesRemoved > 0;
}

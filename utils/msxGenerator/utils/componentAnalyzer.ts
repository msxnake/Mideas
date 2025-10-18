/**
 * @fileoverview Component Analyzer - Detects used components and entities
 * Filters unused components and entity templates to optimize ROM size
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Component usage analysis result
 */
export interface ComponentUsageAnalysis {
  usedComponents: Set<string>;
  usedTemplates: Set<string>;
  activeEntities: any[];
  componentToEntitiesMap: Map<string, Set<string>>;
}

/**
 * Standard component definition IDs (based on Mideas component system)
 */
const STANDARD_COMPONENT_IDS: Record<string, string> = {
  'comp_pos': 'Position',
  'comp_position': 'Position',
  'comp_render': 'Sprite',
  'comp_sprite': 'Sprite',
  'comp_movement': 'Movement',
  'comp_velocity': 'Movement',
  'comp_collision': 'Collision',
  'comp_player_input': 'Input',
  'comp_input': 'Input',
  'comp_ai_behavior': 'Behavior',
  'comp_behavior': 'Behavior',
  'comp_health': 'Health',
  'comp_animation': 'Animation',
  'comp_gravity': 'Gravity',
  'comp_jump': 'Jump',
  'comp_damage': 'Damage',
  'comp_statemachine': 'StateMachine',
  'comp_cursors': 'Cursors'
};

/**
 * Analyze which components are actually used in the project
 *
 * @param analysis - Project analysis with entities and templates
 * @returns Component usage analysis with filtering data
 */
export function analyzeComponentUsage(analysis: ProjectAnalysis): ComponentUsageAnalysis {
  const usedComponents = new Set<string>();
  const usedTemplates = new Set<string>();
  const activeEntities: any[] = [];
  const componentToEntitiesMap = new Map<string, Set<string>>();

  console.log('🔍 Analyzing component usage...');
  console.log(`📊 Total entities in project: ${analysis.entities?.length || 0}`);

  // STEP 1: Extract active entities from screenmaps
  if (analysis.entities && analysis.entities.length > 0) {
    analysis.entities.forEach((entity: any) => {
      console.log(`  - Entity: ${entity.name} (template: ${entity.entityTemplateId})`);
      activeEntities.push(entity);

      // Track which template is used
      if (entity.entityTemplateId) {
        usedTemplates.add(entity.entityTemplateId);
      }
    });
  }

  console.log(`✅ Active entities: ${activeEntities.length}`);
  console.log(`✅ Used templates: ${Array.from(usedTemplates).join(', ')}`);

  // STEP 2: For each active entity, detect which components it uses
  activeEntities.forEach((entity: any) => {
    const entityName = entity.name || entity.id;

    // Get template definition
    const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);

    if (template) {
      console.log(`  📦 Analyzing template "${template.name}" for entity "${entityName}"`);

      // Analyze template components
      if (template.components && Array.isArray(template.components)) {
        template.components.forEach((comp: any) => {
          const componentDefId = comp.definitionId || comp.componentDefinitionId;

          if (componentDefId) {
            // Map component definition ID to standard name
            const standardName = STANDARD_COMPONENT_IDS[componentDefId] || componentDefId;

            console.log(`    - Component: ${componentDefId} → ${standardName}`);
            usedComponents.add(standardName);

            // Track which entities use this component
            if (!componentToEntitiesMap.has(standardName)) {
              componentToEntitiesMap.set(standardName, new Set());
            }
            componentToEntitiesMap.get(standardName)!.add(entityName);
          }
        });
      }

      // Check component overrides (specific values per entity instance)
      if (entity.componentOverrides) {
        Object.keys(entity.componentOverrides).forEach((compId: string) => {
          const standardName = STANDARD_COMPONENT_IDS[compId] || compId;
          console.log(`    - Override: ${compId} → ${standardName}`);
          usedComponents.add(standardName);

          if (!componentToEntitiesMap.has(standardName)) {
            componentToEntitiesMap.set(standardName, new Set());
          }
          componentToEntitiesMap.get(standardName)!.add(entityName);
        });
      }
    } else {
      console.warn(`  ⚠️  Template "${entity.entityTemplateId}" not found for entity "${entityName}"`);
    }
  });

  console.log('📊 Component usage summary:');
  console.log(`  - Total used components: ${usedComponents.size}`);
  usedComponents.forEach(comp => {
    const entities = componentToEntitiesMap.get(comp);
    console.log(`    • ${comp}: ${entities?.size || 0} entities`);
  });

  return {
    usedComponents,
    usedTemplates,
    activeEntities,
    componentToEntitiesMap
  };
}

/**
 * Check if a specific component is used in the project
 */
export function isComponentUsed(componentName: string, analysis: ComponentUsageAnalysis): boolean {
  return analysis.usedComponents.has(componentName);
}

/**
 * Get entities that use a specific component
 */
export function getEntitiesWithComponent(componentName: string, analysis: ComponentUsageAnalysis): string[] {
  const entities = analysis.componentToEntitiesMap.get(componentName);
  return entities ? Array.from(entities) : [];
}

/**
 * Generate component mask for a specific entity based on its actual components
 * Returns 16-bit mask to support 10+ components (Jump, Gravity, etc.)
 */
export function generateEntityComponentMask(entity: any, template: any, analysis: ProjectAnalysis): number {
  let mask = 0;

  // Map component names to bit positions (16-bit mask for 10+ components)
  const COMP_BIT_POSITION: Record<string, number> = {
    'Position': 0,   // Bit 0  - #0001
    'Sprite': 1,     // Bit 1  - #0002
    'Movement': 2,   // Bit 2  - #0004
    'Collision': 3,  // Bit 3  - #0008
    'Input': 4,      // Bit 4  - #0010
    'Behavior': 5,   // Bit 5  - #0020
    'Health': 6,     // Bit 6  - #0040
    'Animation': 7,  // Bit 7  - #0080
    'Jump': 8,       // Bit 8  - #0100 (NEW)
    'Gravity': 9     // Bit 9  - #0200 (NEW)
  };

  if (template && template.components) {
    template.components.forEach((comp: any) => {
      const componentDefId = comp.definitionId || comp.componentDefinitionId;
      const standardName = STANDARD_COMPONENT_IDS[componentDefId];

      if (standardName && COMP_BIT_POSITION[standardName] !== undefined) {
        mask |= (1 << COMP_BIT_POSITION[standardName]);
      }
    });
  }

  // Add overrides
  if (entity.componentOverrides) {
    Object.keys(entity.componentOverrides).forEach((compId: string) => {
      const standardName = STANDARD_COMPONENT_IDS[compId];
      if (standardName && COMP_BIT_POSITION[standardName] !== undefined) {
        mask |= (1 << COMP_BIT_POSITION[standardName]);
      }
    });
  }

  return mask;
}

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
  'comp_wall_collision': 'WallCollision',
  'comp_player_input': 'Input',
  'comp_input': 'Input',
  'comp_ai_behavior': 'Behavior',
  'comp_behavior': 'Behavior',
  'comp_health': 'Health',
  'comp_animation': 'Animation',
  'comp_gravity': 'Gravity',
  'comp_jump': 'Jump',
  'comp_damage': 'Damage',
  'comp_deadly_tiles': 'DeadlyTiles',
  'comp_wall_jump': 'WallJump',
  'comp_wall_grab': 'WallGrab',
  'comp_air_control': 'AirControl',
  'comp_statemachine': 'StateMachine',
  'comp_cursors': 'Cursors',
  'comp_carry': 'Carry',
  'comp_collectible': 'Collectible',
  'comp_patrol': 'Patrol',
  'comp_retractable_gate': 'RetractableGate'
};

/**
 * Resolve final spriteId for an entity (defaults + overrides)
 */
function resolveSpriteId(entity: any, template: any): string | undefined {
  const spriteComp = template?.components?.find((c: any) =>
    c.definitionId === 'comp_sprite' || c.definitionId === 'comp_render'
  );

  if (!spriteComp) return undefined;

  const defaults = spriteComp.defaultValues || {};
  const overrides = entity.componentOverrides?.['comp_sprite'] || entity.componentOverrides?.['comp_render'] || {};
  const finalProps = { ...defaults, ...overrides };

  return finalProps.spriteId || finalProps.spriteAssetId || finalProps.sprite || finalProps.spriteName;
}

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
  activeEntities.forEach((entity: any, entityIndex: number) => {
    const entityDisplayName = entity.name || entity.id;
    const entityKey = entity.id || entity.name || `entity_${entityIndex}`;

    // Get template definition
    const template = analysis.templates?.find((t: any) => t.id === entity.entityTemplateId);

    if (template) {
      console.log(`  📦 Analyzing template "${template.name}" for entity "${entityDisplayName}"`);

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
            componentToEntitiesMap.get(standardName)!.add(entityKey);
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
          componentToEntitiesMap.get(standardName)!.add(entityKey);
        });
      }
    } else {
      console.warn(`  ⚠️  Template "${entity.entityTemplateId}" not found for entity "${entityDisplayName}"`);
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
 * 
 * INTELLIGENT FIX: Only adds Sprite component if entity has sprite data
 * Position markers (like "nucleo" entities) won't get unnecessary sprites
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
    'Gravity': 9,    // Bit 9  - #0200 (NEW)
    'WallJump': 14,  // Bit 14 - #4000
    'AirControl': 15, // Bit 15 - #8000
    'DeadlyTiles': 13 // Bit 13 - #2000
  };

  // Track if entity has sprite component defined
  let hasSpriteComponent = false;

  if (template && template.components) {
    template.components.forEach((comp: any) => {
      const componentDefId = comp.definitionId || comp.componentDefinitionId;
      const standardName = STANDARD_COMPONENT_IDS[componentDefId];

      if (standardName && COMP_BIT_POSITION[standardName] !== undefined) {
        mask |= (1 << COMP_BIT_POSITION[standardName]);

        // Check if this is a sprite/render component
        if (standardName === 'Sprite') {
          hasSpriteComponent = true;
        }
      }

      // Patrol requires Movement to be active (update_position_component moves the entity)
      if (standardName === 'Patrol') {
        mask |= (1 << COMP_BIT_POSITION['Movement']);
      }
    });
  }

  // Add overrides
  if (entity.componentOverrides) {
    Object.keys(entity.componentOverrides).forEach((compId: string) => {
      const standardName = STANDARD_COMPONENT_IDS[compId];
      if (standardName && COMP_BIT_POSITION[standardName] !== undefined) {
        mask |= (1 << COMP_BIT_POSITION[standardName]);

        if (standardName === 'Sprite') {
          hasSpriteComponent = true;
        }
      }
    });
  }

  // Always add Position (all entities need position tracking)
  mask |= (1 << COMP_BIT_POSITION['Position']); // Bit 0: #0001

  // INTELLIGENT FIX: Only add Sprite if entity has render/sprite component
  // If template has comp_render or comp_sprite, it needs sprite rendering
  // We trust the template definition - if it declares a render component, enable sprites
  if (hasSpriteComponent) {
    mask |= (1 << COMP_BIT_POSITION['Sprite']);   // Bit 1: #0002
  } else {
    // Double-check: Even if no sprite component was found in the iteration above,
    // check if template has sprite data (spriteId or similar) as a fallback
    const spriteId = resolveSpriteId(entity, template);
    const hasValidSpriteAsset = spriteId &&
      analysis.sprites?.some((s: any) => s.id === spriteId || s.name === spriteId);

    if (hasValidSpriteAsset) {
      mask |= (1 << COMP_BIT_POSITION['Sprite']);   // Bit 1: #0002
    }
  }

  return mask;
}

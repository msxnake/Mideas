/**
 * @fileoverview Summary Extractor - Extrae datos limpios de proyectos Mideas
 * Genera archivos summary.json optimizados para msxModularGenerator
 */

import { ProjectAsset, GameFlowGraph, WorldMap, ScreenMap, Sprite, Tile, EntityTemplate, ComponentDefinition, Boss } from '../types';
import { generateTilePatternBytes, generateTileColorBytes } from '../components/utils/tileUtils';
import { generateSpriteASMCode } from '../components/utils/spriteUtils';
import fs from 'fs';
import path from 'path';

/**
 * Interfaz para el Summary JSON limpio
 */
export interface ProjectSummary {
  schema: string;
  projectInfo: {
    name: string;
    extractedFrom: string;
    extractionDate: string;
    mideasVersion: string;
    summaryVersion: string;
  };
  execution: {
    mainGameFlow: {
      id: string;
      name: string;
      startNodeId: string;
      nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: any;
      }>;
      connections: Array<{
        id: string;
        fromNodeId: string;
        toNodeId: string;
      }>;
    };
    startBehavior: string;
    initialState: string;
    hasMenus: boolean;
  };
  assets: {
    worldMaps: any[];
    screens: any[];
    msx2Screens: any[];
    tiles: any[];
    sprites: any[];
    entities: any[];
    components: any[];
    fonts: any[];
    stateMachines: any[];
    bosses: any[];
  };
  metadata: {
    extraction: {
      totalOriginalAssets: number;
      totalUsedAssets: number;
      compressionRatio: string;
      brokenReferences: string[];
    };
    msxGeneration: {
      targetMSX: string[];
      estimatedROMSize: number;
      memoryUsage: {
        sprites: number;
        variables: number;
        patterns: number;
      };
    };
    validation: {
      gameFlowValid: boolean;
      allReferencesValid: boolean;
      msxCompatible: boolean;
      warnings: string[];
    };
  };
}

/**
 * Busca y valida el GameFlow principal del proyecto
 */
function findMainGameFlow(assets: ProjectAsset[]): ProjectAsset {
  const gameFlows = assets.filter(asset => asset.type === 'gameflow');

  if (gameFlows.length === 0) {
    throw new Error("❌ No GameFlow found - Summary generation aborted");
  }

  if (gameFlows.length === 1) {
    console.log(`✅ Single GameFlow found: "${gameFlows[0].name}"`);
    return gameFlows[0]; // Solo hay uno, usarlo
  }

  if (gameFlows.length > 1) {
    // Buscar GameFlow con nombre "main" (case insensitive)
    const mainGameFlow = gameFlows.find(gf =>
      gf.name.toLowerCase().includes('main') ||
      gf.data.name?.toLowerCase().includes('main')
    );

    if (!mainGameFlow) {
      const names = gameFlows.map(gf => gf.name).join(', ');
      throw new Error(`❌ Multiple GameFlows found but no "main" GameFlow detected. Found: ${names}`);
    }

    console.log(`✅ Main GameFlow found: "${mainGameFlow.name}" (from ${gameFlows.length} GameFlows)`);
    return mainGameFlow;
  }

  throw new Error("❌ Unexpected GameFlow state");
}

/**
 * Verifica si un asset existe en el proyecto
 */
function assetExists(assets: ProjectAsset[], type: string, id: string): boolean {
  return assets.some(asset => asset.type === type && asset.id === id);
}

/**
 * Obtiene un asset específico del proyecto
 */
function getAsset(assets: ProjectAsset[], type: string, id: string): ProjectAsset | null {
  return assets.find(asset => asset.type === type && asset.id === id) || null;
}

/**
 * Extrae WorldMaps referenciados en el GameFlow
 */
function extractUsedWorldMaps(gameFlow: GameFlowGraph, assets: ProjectAsset[], usedAssets: any, warnings: string[]): void {
  const worldMapIds = new Set<string>();

  // Buscar worldMapId en los nodos del GameFlow
  gameFlow.nodes?.forEach(node => {
    if (node.data?.worldMapId) {
      worldMapIds.add(node.data.worldMapId);
    }
  });

  // Validar y extraer cada WorldMap
  worldMapIds.forEach(worldMapId => {
    if (assetExists(assets, 'worldmap', worldMapId)) {
      const worldMapAsset = getAsset(assets, 'worldmap', worldMapId);
      if (worldMapAsset) {
        usedAssets.worldMaps.push({
          id: worldMapAsset.id,
          name: worldMapAsset.name,
          data: worldMapAsset.data
        });
        console.log(`✅ WorldMap added: "${worldMapAsset.name}"`);

        // Extraer screens de este WorldMap
        extractUsedScreensFromWorldMap(worldMapAsset.data, assets, usedAssets, warnings);
      }
    } else {
      const warning = `⚠️  WorldMap "${worldMapId}" referenced in GameFlow but not found`;
      warnings.push(warning);
      console.warn(warning);
    }
  });
}

/**
 * Extrae Screens referenciados en WorldMaps
 */
function extractUsedScreensFromWorldMap(worldMap: any, assets: ProjectAsset[], usedAssets: any, warnings: string[]): void {
  const screenIds = new Set<string>();

  // Extraer screenIds del WorldMap
  worldMap.nodes?.forEach((node: any) => {
    const screenId = node.screenAssetId || node.screenId;
    if (screenId) {
      screenIds.add(screenId);
    }
  });

  // Validar y extraer cada Screen
  screenIds.forEach(screenId => {
    const screenAsset = getAsset(assets, 'screenmap', screenId) || getAsset(assets, 'msx2screen', screenId);
    if (screenAsset) {
      if (screenAsset.type === 'msx2screen') {
        usedAssets.msx2Screens.push({
          id: screenAsset.id,
          name: screenAsset.name,
          data: screenAsset.data
        });
        console.log(`âœ… MSX2 Screen added: "${screenAsset.name}"`);
        extractSpritesFromMsx2Screen(screenAsset.data, assets, usedAssets, warnings);
        return;
      }
      if (screenAsset) {
        usedAssets.screens.push({
          id: screenAsset.id,
          name: screenAsset.name,
          data: screenAsset.data
        });
        console.log(`✅ Screen added: "${screenAsset.name}"`);

        // Extraer assets dependientes de esta Screen
        extractAssetsFromScreen(screenAsset.data, assets, usedAssets, warnings);
      }
    } else {
      const warning = `⚠️  Screen "${screenId}" referenced in WorldMap but not found`;
      warnings.push(warning);
      console.warn(warning);
    }
  });
}

function extractSpritesFromMsx2Screen(screen: any, assets: ProjectAsset[], usedAssets: any, warnings: string[]): void {
  const entities = screen?.layers?.entities || [];
  entities.forEach((entity: any) => {
    const context = `MSX2 screen "${screen?.name || screen?.id}" entity "${entity?.name || entity?.id}"`;
    const spriteIds = [
      entity?.spriteAssetId,
      entity?.components?.msx2_hardware_sprite?.msx2SpriteAssetId,
      entity?.components?.msx2_render?.msx2SpriteAssetId,
      entity?.components?.msx2_render?.spriteAssetId,
    ];
    spriteIds.forEach(spriteId => addMsx2SpriteOrLegacySpriteAsset(spriteId, assets, usedAssets, warnings, context));
  });
}

/**
 * Extrae Tiles, Sprites, Entities de una Screen específica
 */
function extractAssetsFromScreen(screen: any, assets: ProjectAsset[], usedAssets: any, warnings: string[]): void {
  // 1. Extraer Tiles usados en la screen
  extractTilesFromScreen(screen, assets, usedAssets, warnings);

  // 2. Extraer Entities instanciadas en la screen
  extractEntitiesFromScreen(screen, assets, usedAssets, warnings);

  // 3. Extraer Sprites usados por las entities
  extractSpritesFromEntities(usedAssets.entities, assets, usedAssets, warnings);
}

/**
 * Extrae Tiles utilizados en una Screen
 */
function extractTilesFromScreen(screen: any, assets: ProjectAsset[], usedAssets: any, warnings: string[]): void {
  const tileIds = new Set<string>();

  // Extraer tiles del tileBank de la screen
  if (screen.tileBank?.tiles) {
    screen.tileBank.tiles.forEach((tileRef: any) => {
      if (tileRef.tileId) {
        tileIds.add(tileRef.tileId);
      }
    });
  }

  // Extraer tiles de las layers background
  if (screen.layers?.background) {
    screen.layers.background.forEach((row: any[]) => {
      row.forEach((cell: any) => {
        if (cell && cell.tileId) {
          tileIds.add(cell.tileId);
        }
      });
    });
  }

  // Validar y procesar cada tile
  tileIds.forEach(tileId => {
    if (assetExists(assets, 'tile', tileId)) {
      const tileAsset = getAsset(assets, 'tile', tileId);
      if (tileAsset && !usedAssets.tiles.some((t: any) => t.id === tileId)) {
        // Procesar tile para MSX
        const tileData = {
          id: tileAsset.id,
          name: tileAsset.name,
          width: tileAsset.data.width,
          height: tileAsset.data.height,
          data: tileAsset.data.data,
          msxCharCount: Math.ceil(tileAsset.data.width / 8) * Math.ceil(tileAsset.data.height / 8),
          patterns: generateTilePatternBytes(tileAsset.data, 'SCREEN 2 (Graphics I)'),
          colors: generateTileColorBytes(tileAsset.data, 'SCREEN 2 (Graphics I)')
        };

        usedAssets.tiles.push(tileData);
        console.log(`✅ Tile added: "${tileAsset.name}" (${tileData.msxCharCount} MSX chars)`);
      }
    } else {
      const warning = `⚠️  Tile "${tileId}" referenced in Screen but not found`;
      warnings.push(warning);
      console.warn(warning);
    }
  });
}

/**
 * Extrae Entities instanciadas en una Screen
 */
function extractEntitiesFromScreen(screen: any, assets: ProjectAsset[], usedAssets: any, warnings: string[]): void {
  if (!screen.entityInstances) return;

  const templateIds = new Set<string>();

  // Recopilar templateIds de las instancias
  screen.entityInstances.forEach((instance: any) => {
    if (instance.templateId) {
      templateIds.add(instance.templateId);
    }
  });

  // Validar y extraer templates de entities
  templateIds.forEach(templateId => {
    if (assetExists(assets, 'entitytemplate', templateId)) {
      const entityAsset = getAsset(assets, 'entitytemplate', templateId);
      if (entityAsset && !usedAssets.entities.some((e: any) => e.templateId === templateId)) {
        usedAssets.entities.push({
          templateId: entityAsset.id,
          name: entityAsset.name,
          data: entityAsset.data,
          usedInScreens: [screen.id || 'unknown']
        });
        console.log(`✅ Entity template added: "${entityAsset.name}"`);

        // Extraer components de esta entity
        extractComponentsFromEntity(entityAsset.data, assets, usedAssets, warnings);
      }
    } else {
      const warning = `⚠️  Entity template "${templateId}" referenced in Screen but not found`;
      warnings.push(warning);
      console.warn(warning);
    }
  });
}

/**
 * Extrae Components utilizados por una Entity
 */
function extractComponentsFromEntity(entity: any, assets: ProjectAsset[], usedAssets: any, warnings: string[]): void {
  if (!entity.components) return;

  entity.components.forEach((componentId: string) => {
    if (assetExists(assets, 'componentdefinition', componentId)) {
      const componentAsset = getAsset(assets, 'componentdefinition', componentId);
      if (componentAsset && !usedAssets.components.some((c: any) => c.id === componentId)) {
        usedAssets.components.push({
          id: componentAsset.id,
          name: componentAsset.name,
          data: componentAsset.data
        });
        console.log(`✅ Component added: "${componentAsset.name}"`);
      }
    } else {
      const warning = `⚠️  Component "${componentId}" referenced in Entity but not found`;
      warnings.push(warning);
      console.warn(warning);
    }
  });
}

/**
 * Extrae Sprites utilizados por las Entities
 */
function extractSpritesFromEntities(entities: any[], assets: ProjectAsset[], usedAssets: any, warnings: string[]): void {
  const spriteIds = new Set<string>();

  // Buscar spriteIds en los datos de las entities
  entities.forEach(entity => {
    if (entity.data?.spriteId) {
      spriteIds.add(entity.data.spriteId);
    }

    // Buscar en components que pueden tener sprites
    if (entity.data?.components) {
      Object.values(entity.data.components).forEach((component: any) => {
        if (component?.spriteId) {
          spriteIds.add(component.spriteId);
        }
      });
    }
  });

  // Validar y procesar cada sprite
  spriteIds.forEach(spriteId => {
    if (assetExists(assets, 'sprite', spriteId)) {
      const spriteAsset = getAsset(assets, 'sprite', spriteId);
      if (spriteAsset && !usedAssets.sprites.some((s: any) => s.id === spriteId)) {
        // Procesar sprite para MSX
        const spriteASM = generateSpriteASMCode(spriteAsset.data, 'hex');

        const spriteData = {
          id: spriteAsset.id,
          name: spriteAsset.name,
          width: spriteAsset.data.width,
          height: spriteAsset.data.height,
          frames: spriteAsset.data.frames?.length || 1,
          msxSize: spriteAsset.data.width <= 8 && spriteAsset.data.height <= 8 ? '8x8' : '16x16',
          asmCode: spriteASM,
          totalPatternBytes: spriteASM.length
        };

        usedAssets.sprites.push(spriteData);
        console.log(`✅ Sprite added: "${spriteAsset.name}" (${spriteData.frames} frames, ${spriteData.msxSize})`);
      }
    } else {
      const warning = `⚠️  Sprite "${spriteId}" referenced in Entity but not found`;
      warnings.push(warning);
      console.warn(warning);
    }
  });
}

function addTileAsset(tileId: string | null | undefined, assets: ProjectAsset[], usedAssets: any, warnings: string[], context: string): void {
  if (!tileId || usedAssets.tiles.some((t: any) => t.id === tileId)) return;

  const tileAsset = getAsset(assets, 'tile', tileId);
  if (!tileAsset) {
    const warning = `Tile "${tileId}" referenced in ${context} but not found`;
    warnings.push(warning);
    console.warn(warning);
    return;
  }

  const tileData = {
    id: tileAsset.id,
    name: tileAsset.name,
    width: tileAsset.data.width,
    height: tileAsset.data.height,
    data: tileAsset.data.data,
    msxCharCount: Math.ceil(tileAsset.data.width / 8) * Math.ceil(tileAsset.data.height / 8),
    patterns: generateTilePatternBytes(tileAsset.data, 'SCREEN 2 (Graphics I)'),
    colors: generateTileColorBytes(tileAsset.data, 'SCREEN 2 (Graphics I)')
  };

  usedAssets.tiles.push(tileData);
  console.log(`Tile added from ${context}: "${tileAsset.name}" (${tileData.msxCharCount} MSX chars)`);
}

function addSpriteAsset(spriteId: string | null | undefined, assets: ProjectAsset[], usedAssets: any, warnings: string[], context: string): void {
  if (!spriteId || usedAssets.sprites.some((s: any) => s.id === spriteId)) return;

  const spriteAsset = getAsset(assets, 'sprite', spriteId);
  if (!spriteAsset) {
    const warning = `Sprite "${spriteId}" referenced in ${context} but not found`;
    warnings.push(warning);
    console.warn(warning);
    return;
  }

  const spriteASM = generateSpriteASMCode(spriteAsset.data, 'hex');
  const spriteData = {
    id: spriteAsset.id,
    name: spriteAsset.name,
    width: spriteAsset.data.width,
    height: spriteAsset.data.height,
    frames: spriteAsset.data.frames?.length || 1,
    msxSize: spriteAsset.data.width <= 8 && spriteAsset.data.height <= 8 ? '8x8' : '16x16',
    asmCode: spriteASM,
    totalPatternBytes: spriteASM.length
  };

  usedAssets.sprites.push(spriteData);
  console.log(`Sprite added from ${context}: "${spriteAsset.name}" (${spriteData.frames} frames, ${spriteData.msxSize})`);
}

function addMsx2SpriteOrLegacySpriteAsset(spriteId: string | null | undefined, assets: ProjectAsset[], usedAssets: any, warnings: string[], context: string): void {
  if (!spriteId) return;

  if (usedAssets.msx2Sprites?.some((s: any) => s.id === spriteId)) return;
  const msx2SpriteAsset = getAsset(assets, 'msx2sprite', spriteId);
  if (msx2SpriteAsset) {
    usedAssets.msx2Sprites.push({
      id: msx2SpriteAsset.id,
      name: msx2SpriteAsset.name,
      data: msx2SpriteAsset.data,
    });
    console.log(`MSX2 sprite added from ${context}: "${msx2SpriteAsset.name}"`);
    return;
  }

  addSpriteAsset(spriteId, assets, usedAssets, warnings, context);
}

function extractBosses(assets: ProjectAsset[], usedAssets: any, warnings: string[]): void {
  assets
    .filter(asset => asset.type === 'boss')
    .forEach((bossAsset) => {
      const boss = {
        ...(bossAsset.data as Boss),
        id: (bossAsset.data as Boss).id || bossAsset.id,
        name: (bossAsset.data as Boss).name || bossAsset.name
      };

      if (!usedAssets.bosses.some((existing: Boss) => existing.id === boss.id)) {
        usedAssets.bosses.push(boss);
        console.log(`Boss added: "${boss.name}"`);
      }

      boss.phases?.forEach((phase, phaseIndex) => {
        const context = `Boss "${boss.name}" phase ${phaseIndex + 1}`;
        addSpriteAsset(phase.spriteAssetId, assets, usedAssets, warnings, context);
        phase.tileMatrix?.forEach(row => {
          row.forEach(tileId => addTileAsset(tileId, assets, usedAssets, warnings, context));
        });
        phase.weakPoints?.forEach((weakPoint) => {
          addSpriteAsset(weakPoint.hitSpriteId, assets, usedAssets, warnings, context);
          addTileAsset(weakPoint.destroyedTileId, assets, usedAssets, warnings, context);
        });
      });

      boss.attacks?.forEach((attack) => {
        addSpriteAsset(attack.spriteAssetId, assets, usedAssets, warnings, `Boss "${boss.name}" attack "${attack.name}"`);
        addSpriteAsset(attack.explosionSpriteAssetId, assets, usedAssets, warnings, `Boss "${boss.name}" attack "${attack.name}" explosion`);
        addTileAsset(attack.laserTileAssetId, assets, usedAssets, warnings, `Boss "${boss.name}" attack "${attack.name}" laser char`);
      });
      addSpriteAsset(boss.deathExplosionSpriteId, assets, usedAssets, warnings, `Boss "${boss.name}" death explosion`);
    });
}

/**
 * Calcula estadísticas y metadata del summary
 */
function calculateMetadata(originalAssets: ProjectAsset[], usedAssets: any, warnings: string[]): any {
  const totalUsed = Object.values(usedAssets).reduce((sum: number, assetArray: any) => {
    return sum + (Array.isArray(assetArray) ? assetArray.length : 0);
  }, 0);

  const compressionRatio = ((1 - totalUsed / originalAssets.length) * 100).toFixed(1);

  // Estimaciones de memoria MSX
  const spriteMemory = usedAssets.sprites.length * 4; // 4 bytes por sprite
  const variableMemory = 100 + spriteMemory; // Base + sprites
  const patternMemory = usedAssets.tiles.reduce((sum: number, tile: any) => sum + tile.msxCharCount * 8, 0);

  return {
    extraction: {
      totalOriginalAssets: originalAssets.length,
      totalUsedAssets: totalUsed,
      compressionRatio: `${compressionRatio}% reduction`,
      brokenReferences: warnings
    },
    msxGeneration: {
      targetMSX: ["MSX1", "MSX2", "MSX2+"],
      estimatedROMSize: 2048 + patternMemory + (usedAssets.sprites.length * 32),
      memoryUsage: {
        sprites: spriteMemory,
        variables: variableMemory,
        patterns: patternMemory
      }
    },
    validation: {
      gameFlowValid: true,
      allReferencesValid: warnings.length === 0,
      msxCompatible: true,
      warnings: warnings
    }
  };
}

/**
 * Función principal: Extrae summary limpio de un proyecto Mideas
 */
export function extractProjectSummary(projectPath: string, outputDir: string = 'summary'): ProjectSummary {
  console.log(`🔍 Extracting summary from: ${projectPath}`);

  // 1. Leer proyecto original
  const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  const assets: ProjectAsset[] = projectData.assets || [];
  const warnings: string[] = [];

  console.log(`📊 Original project: ${assets.length} assets`);

  // 2. Encontrar GameFlow principal
  let mainGameFlow: ProjectAsset;
  try {
    mainGameFlow = findMainGameFlow(assets);
  } catch (error) {
    console.error(error);
    throw error;
  }

  // 3. Estructura de assets usados
  const usedAssets = {
    worldMaps: [],
    screens: [],
    msx2Screens: [],
    msx2Sprites: [],
    tiles: [],
    sprites: [],
    entities: [],
    components: [],
    fonts: [],
    stateMachines: [],
    bosses: []
  };

  // 4. Extraer assets siguiendo cadena de dependencias
  console.log('🔗 Following dependency chain...');
  extractUsedWorldMaps(mainGameFlow.data, assets, usedAssets, warnings);
  extractBosses(assets, usedAssets, warnings);

  // 5. Crear summary final
  const projectName = path.basename(projectPath, '.json');
  const summary: ProjectSummary = {
    schema: "Mideas Project Summary v1.0",
    projectInfo: {
      name: projectName,
      extractedFrom: projectPath,
      extractionDate: new Date().toISOString(),
      mideasVersion: projectData.version || "unknown",
      summaryVersion: "1.0"
    },
    execution: {
      mainGameFlow: {
        id: mainGameFlow.id,
        name: mainGameFlow.name,
        startNodeId: mainGameFlow.data.startNodeId || "",
        nodes: mainGameFlow.data.nodes || [],
        connections: mainGameFlow.data.connections || []
      },
      startBehavior: "gameflow",
      initialState: "game",
      hasMenus: mainGameFlow.data.nodes?.some((node: any) => node.type === 'menu') || false
    },
    assets: usedAssets,
    metadata: calculateMetadata(assets, usedAssets, warnings)
  };

  // 6. Guardar summary
  const outputPath = path.join(outputDir, `${projectName}_summary.json`);
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

  console.log(`✅ Summary created: ${outputPath}`);
  console.log(`📈 Compression: ${summary.metadata.extraction.compressionRatio}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);

  return summary;
}

/**
 * Función de utilidad: Extraer summary desde línea de comandos
 */
export function extractSummaryFromFile(inputFile: string): void {
  try {
    extractProjectSummary(inputFile);
    console.log('🎉 Summary extraction completed successfully!');
  } catch (error) {
    console.error('❌ Summary extraction failed:', error);
    process.exit(1);
  }
}

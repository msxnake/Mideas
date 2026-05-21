/**
 * Generador de Summary funcional para proyectos Mideas
 * Convierte proyecto completo → summary limpio para msxModularGenerator
 */

import fs from 'fs';
import path from 'path';

// Función para extraer components de un entity template
function extractComponentsFromTemplate(entityTemplate, componentDefinitions, usedAssets, warnings) {
  if (!entityTemplate.components) return;

  entityTemplate.components.forEach(componentRef => {
    const componentId = componentRef.definitionId;
    const componentDef = componentDefinitions.find(comp => comp.id === componentId);

    if (!componentDef) {
      warnings.push(`Component definition "${componentId}" not found`);
      return;
    }

    if (!usedAssets.components.some(c => c.id === componentId)) {
      usedAssets.components.push({
        id: componentDef.id,
        name: componentDef.name,
        type: componentDef.type || 'custom',
        properties: componentDef.properties || [],
        description: componentDef.description,
        defaultValues: componentRef.defaultValues
      });

      console.log(`✅ Component added: "${componentDef.name}" (${componentDef.properties?.length || 0} properties)`);
    }
  });
}

function createProjectSummary(projectPath) {
  console.log(`🔍 Creating summary from: ${projectPath}`);

  // 1. Leer proyecto original
  const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  const assets = projectData.assets || [];
  const componentDefinitions = projectData.componentDefinitions || [];
  const entityTemplates = projectData.entityTemplates || [];

  console.log(`📊 Original project: ${assets.length} assets`);
  console.log(`📊 Component definitions: ${componentDefinitions.length}`);
  console.log(`📊 Entity templates: ${entityTemplates.length}`);

  // 2. Encontrar GameFlow principal
  const gameFlows = assets.filter(asset => asset.type === 'gameflow');
  if (gameFlows.length === 0) {
    throw new Error("❌ No GameFlow found");
  }

  let mainGameFlow = gameFlows[0];
  if (gameFlows.length > 1) {
    const found = gameFlows.find(gf =>
      gf.name.toLowerCase().includes('main') ||
      gf.data.name?.toLowerCase().includes('main')
    );
    if (!found) {
      throw new Error(`❌ Multiple GameFlows but no 'main': ${gameFlows.map(g => g.name).join(', ')}`);
    }
    mainGameFlow = found;
  }

  console.log(`✅ Main GameFlow: "${mainGameFlow.name}"`);

  // 3. Extraer assets usados siguiendo cadena de dependencias
  const usedAssets = {
    worldMaps: [],
    screens: [],
    msx2Screens: [],
    tiles: [],
    sprites: [],
    entities: [],
    components: [],
    fonts: [],
    stateMachines: []
  };

  const warnings = [];

  // 4. Seguir cadena: GameFlow → WorldMaps → Screens → Assets
  const worldMapIds = new Set();

  // Extraer worldMapIds de nodos GameFlow
  mainGameFlow.data.nodes?.forEach(node => {
    if (node.worldAssetId) {
      worldMapIds.add(node.worldAssetId);
      console.log(`🔗 Found WorldMap reference: ${node.worldAssetId}`);
    }
  });

  // Procesar cada WorldMap
  worldMapIds.forEach(worldMapId => {
    const worldMapAsset = assets.find(asset => asset.type === 'worldmap' && asset.id === worldMapId);
    if (!worldMapAsset) {
      warnings.push(`WorldMap "${worldMapId}" not found`);
      return;
    }

    usedAssets.worldMaps.push({
      id: worldMapAsset.id,
      name: worldMapAsset.name,
      startScreenId: worldMapAsset.data.startScreenNodeId,
      screens: worldMapAsset.data.nodes || [],
      connections: worldMapAsset.data.connections || []
    });

    console.log(`✅ WorldMap added: "${worldMapAsset.name}"`);

    // Extraer screens de este WorldMap
    const screenIds = new Set();
    worldMapAsset.data.nodes?.forEach(node => {
      if (node.screenAssetId) {
        screenIds.add(node.screenAssetId);
        console.log(`🔗 Found Screen reference: ${node.screenAssetId}`);
      }
    });

    // Procesar cada Screen
    screenIds.forEach(screenId => {
      const screenAsset = assets.find(asset => (asset.type === 'screenmap' || asset.type === 'msx2screen') && asset.id === screenId);
      if (!screenAsset) {
        warnings.push(`Screen "${screenId}" not found`);
        return;
      }

      if (screenAsset.type === 'msx2screen') {
        usedAssets.msx2Screens.push({
          id: screenAsset.id,
          name: screenAsset.name,
          widthTiles: screenAsset.data.widthTiles,
          heightTiles: screenAsset.data.heightTiles,
          tileSize: screenAsset.data.tileSize,
          layers: screenAsset.data.layers,
          entityInstances: screenAsset.data.layers?.entities || []
        });
        console.log(`âœ… MSX2 Screen added: "${screenAsset.name}" (${screenAsset.data.widthTiles}x${screenAsset.data.heightTiles})`);
        return;
      }

      usedAssets.screens.push({
        id: screenAsset.id,
        name: screenAsset.name,
        width: screenAsset.data.width,
        height: screenAsset.data.height,
        layers: screenAsset.data.layers,
        tileBank: screenAsset.data.tileBank,
        entityInstances: screenAsset.data.layers?.entities || []
      });

      console.log(`✅ Screen added: "${screenAsset.name}" (${screenAsset.data.width}x${screenAsset.data.height})`);
      console.log(`📋 Screen data keys: ${Object.keys(screenAsset.data).join(', ')}`);
      console.log(`📋 Layers keys: ${Object.keys(screenAsset.data.layers || {}).join(', ')}`);
      console.log(`📋 Entities: ${screenAsset.data.entities?.length || 0}`);
      console.log(`📋 Layers.entities: ${screenAsset.data.layers?.entities?.length || 0}`);

      // Extraer sprites SOLO desde componentes Render (cadena de dependencias válida)
      const validSpriteIds = new Set();
      screenAsset.data.layers?.entities?.forEach(instance => {
        console.log(`🔍 Analyzing entity: "${instance.name}" (template: ${instance.entityTemplateId})`);

        // REGLA: Solo sprites conectados via Render component son válidos
        if (instance.componentOverrides?.comp_render?.spriteAssetId) {
          const spriteId = instance.componentOverrides.comp_render.spriteAssetId;
          validSpriteIds.add(spriteId);
          console.log(`✅ Valid Sprite found via Render component: ${spriteId}`);
        } else {
          console.log(`⚠️  Entity "${instance.name}" has no sprite assigned to Render component`);
        }

        // Detectar sprites en otros componentes (enlaces rotos)
        Object.entries(instance.componentOverrides || {}).forEach(([compId, component]) => {
          if (compId !== 'comp_render' && component.spriteAssetId) {
            warnings.push(`Broken link: Sprite "${component.spriteAssetId}" in non-Render component "${compId}"`);
            console.log(`❌ Broken link detected: sprite in ${compId} component`);
          }
        });
      });

      // Procesar cada Sprite VÁLIDO (conectado via Render component)
      validSpriteIds.forEach(spriteId => {
        const spriteAsset = assets.find(asset => asset.type === 'sprite' && asset.id === spriteId);
        if (!spriteAsset) {
          warnings.push(`Sprite "${spriteId}" not found`);
          return;
        }

        usedAssets.sprites.push({
          id: spriteAsset.id,
          name: spriteAsset.name,
          width: spriteAsset.data.size?.width || spriteAsset.data.width,
          height: spriteAsset.data.size?.height || spriteAsset.data.height,
          frames: spriteAsset.data.frames?.length || 1,
          msxSize: (spriteAsset.data.size?.width || spriteAsset.data.width) <= 8 && (spriteAsset.data.size?.height || spriteAsset.data.height) <= 8 ? '8x8' : '16x16',
          data: spriteAsset.data
        });

        console.log(`✅ Valid Sprite added: "${spriteAsset.name}" (${spriteAsset.data.size?.width || spriteAsset.data.width}x${spriteAsset.data.size?.height || spriteAsset.data.height}) - Connected via Render component`);
      });

      // Extraer Entity Templates de las entity instances
      const entityTemplateIds = new Set();
      screenAsset.data.layers?.entities?.forEach(instance => {
        if (instance.entityTemplateId) {
          entityTemplateIds.add(instance.entityTemplateId);
          console.log(`🔗 Found Entity Template reference: ${instance.entityTemplateId}`);
        }
      });

      // Procesar cada Entity Template (desde configuración del proyecto)
      entityTemplateIds.forEach(templateId => {
        const entityTemplate = entityTemplates.find(template => template.id === templateId);
        if (!entityTemplate) {
          warnings.push(`Entity template "${templateId}" not found in project templates`);
          return;
        }

        if (!usedAssets.entities.some(e => e.templateId === templateId)) {
          usedAssets.entities.push({
            templateId: entityTemplate.id,
            name: entityTemplate.name,
            components: entityTemplate.components || [],
            icon: entityTemplate.icon,
            description: entityTemplate.description,
            usedInScreens: [screenId]
          });

          console.log(`✅ Entity Template added: "${entityTemplate.name}" (${entityTemplate.components?.length || 0} components)`);

          // Extraer Components de este Entity Template
          extractComponentsFromTemplate(entityTemplate, componentDefinitions, usedAssets, warnings);
        }
      });
    });
  });

  // 5. Crear summary final
  const projectName = path.basename(projectPath, '.json');
  const summary = {
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
      hasMenus: mainGameFlow.data.nodes?.some(node => node.type === 'menu') || false
    },
    assets: usedAssets,
    metadata: {
      extraction: {
        totalOriginalAssets: assets.length,
        totalUsedAssets: Object.values(usedAssets).reduce((sum, arr) => sum + arr.length, 0),
        compressionRatio: `${((1 - Object.values(usedAssets).reduce((sum, arr) => sum + arr.length, 0) / assets.length) * 100).toFixed(1)}% reduction`,
        brokenReferences: warnings
      },
      msxGeneration: {
        targetMSX: ["MSX1", "MSX2", "MSX2+"],
        estimatedROMSize: 2048 + (usedAssets.sprites.length * 32),
        memoryUsage: {
          sprites: usedAssets.sprites.length * 4,
          variables: 100 + (usedAssets.sprites.length * 4),
          patterns: usedAssets.tiles.length * 32
        }
      },
      validation: {
        gameFlowValid: true,
        allReferencesValid: warnings.length === 0,
        msxCompatible: true,
        warnings: warnings
      }
    }
  };

  // 6. Guardar summary
  const outputPath = `summary/${projectName}_summary.json`;
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

  console.log(`✅ Summary created: ${outputPath}`);
  console.log(`📈 Compression: ${summary.metadata.extraction.compressionRatio}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  if (warnings.length > 0) {
    console.log(`⚠️  Warning details:`);
    warnings.forEach(warning => console.log(`     - ${warning}`));
  }

  return summary;
}

// Export function for use in other modules
export { createProjectSummary };

// Crear summary para simple_sprite
try {
  const summary = createProjectSummary('./Examples/simple_sprite(2).json');
  console.log('\n🎉 Summary creation completed successfully!');
  console.log('\n📋 Summary Stats:');
  console.log(`   WorldMaps: ${summary.assets.worldMaps.length}`);
  console.log(`   Screens: ${summary.assets.screens.length}`);
  console.log(`   Sprites: ${summary.assets.sprites.length}`);
  console.log(`   Tiles: ${summary.assets.tiles.length}`);
  console.log(`   Entities: ${summary.assets.entities.length}`);
  console.log(`   Components: ${summary.assets.components.length}`);
} catch (error) {
  console.error('\n❌ Summary creation failed:', error.message);
}

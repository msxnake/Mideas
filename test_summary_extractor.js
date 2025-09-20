/**
 * Script de prueba para el Summary Extractor
 * Prueba la extracción de summary de BasicEnemy(7).json
 */

import fs from 'fs';
import path from 'path';

// Simulación del extractProjectSummary para JavaScript puro
function extractProjectSummary(projectPath) {
  console.log(`🔍 Extracting summary from: ${projectPath}`);

  // 1. Leer proyecto original
  const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  const assets = projectData.assets || [];
  const warnings = [];

  console.log(`📊 Original project: ${assets.length} assets`);

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
      throw new Error(`❌ Multiple GameFlows but no 'main' found: ${gameFlows.map(g => g.name).join(', ')}`);
    }
    mainGameFlow = found;
  }

  console.log(`✅ Main GameFlow: "${mainGameFlow.name}"`);
  console.log(`📍 Start Node: ${mainGameFlow.data.startNodeId}`);
  console.log(`🔗 Nodes: ${mainGameFlow.data.nodes?.length || 0}`);
  console.log(`↔️  Connections: ${mainGameFlow.data.connections?.length || 0}`);

  // 3. Analizar tipos de assets
  const assetTypes = {};
  assets.forEach(asset => {
    assetTypes[asset.type] = (assetTypes[asset.type] || 0) + 1;
  });

  console.log('\n📋 Asset Types in Project:');
  Object.entries(assetTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  // 4. Analizar nodos del GameFlow
  console.log('\n🎯 GameFlow Analysis:');
  if (mainGameFlow.data.nodes) {
    mainGameFlow.data.nodes.forEach((node, i) => {
      console.log(`   Node ${i}: ${node.id} (${node.type || 'unknown'})`);
      console.log(`      Position: (${node.position?.x || 0}, ${node.position?.y || 0})`);
      console.log(`      Data keys: ${Object.keys(node.data || {}).join(', ')}`);

      // Buscar worldAssetId en la estructura real
      if (node.worldAssetId) {
        console.log(`      └─ WorldMap: ${node.worldAssetId}`);
      } else if (node.data?.worldAssetId) {
        console.log(`      └─ WorldMap: ${node.data.worldAssetId}`);
      } else {
        console.log(`      └─ No worldAssetId found`);
        console.log(`      └─ Node structure:`, JSON.stringify(node, null, 4));
      }
    });
  }

  // 5. Verificar referencias
  const worldMapIds = new Set();
  if (mainGameFlow.data.nodes) {
    mainGameFlow.data.nodes.forEach(node => {
      // Estructura real: worldAssetId directamente en el nodo
      if (node.worldAssetId) {
        worldMapIds.add(node.worldAssetId);
      } else if (node.data?.worldAssetId) {
        worldMapIds.add(node.data.worldAssetId);
      }
    });
  }

  console.log('\n🔍 Reference Validation:');
  worldMapIds.forEach(worldMapId => {
    const exists = assets.some(asset => asset.type === 'worldmap' && asset.id === worldMapId);
    console.log(`   WorldMap "${worldMapId}": ${exists ? '✅ Found' : '❌ Missing'}`);

    if (exists) {
      const worldMap = assets.find(asset => asset.type === 'worldmap' && asset.id === worldMapId);
      console.log(`      Name: "${worldMap.name}"`);
      console.log(`      Nodes: ${worldMap.data.nodes?.length || 0}`);
    }
  });

  // 6. Estadísticas finales
  const spritesCount = assets.filter(a => a.type === 'sprite').length;
  const tilesCount = assets.filter(a => a.type === 'tile').length;
  const screensCount = assets.filter(a => a.type === 'screenmap').length;

  console.log('\n📊 Assets Summary:');
  console.log(`   Sprites: ${spritesCount}`);
  console.log(`   Tiles: ${tilesCount}`);
  console.log(`   Screens: ${screensCount}`);
  console.log(`   Total Assets: ${assets.length}`);

  return {
    success: true,
    projectName: path.basename(projectPath, '.json'),
    gameFlowFound: true,
    mainGameFlow: mainGameFlow.name,
    totalAssets: assets.length,
    warnings: warnings.length
  };
}

// Ejecutar prueba
try {
  console.log('='.repeat(60));
  console.log('🧪 TESTING WITH SIMPLE_SPRITE PROJECT');
  console.log('='.repeat(60));
  const result = extractProjectSummary('./Examples/simple_sprite(2).json');
  console.log('\n🎉 Summary extraction test completed successfully!');
  console.log('📋 Result:', result);
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
}
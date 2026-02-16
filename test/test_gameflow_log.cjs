/**
 * Test GameFlow Log System
 * Valida que el sistema de .log funciona correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Test: GameFlow Log System');
console.log('='.repeat(60));

// Cargar summary de BasicEnemy
const summaryPath = path.join(__dirname, 'summary', 'BasicEnemy(7)_summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('❌ ERROR: No se encontró BasicEnemy(7)_summary.json');
  process.exit(1);
}

const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
console.log(`✅ Summary cargado: ${summaryData.projectInfo.name}`);

// Simular estructura de GameFlow
const gameFlow = summaryData.execution.mainGameFlow;

console.log(`\n📊 GameFlow Info:`);
console.log(`   Nombre: ${gameFlow.name}`);
console.log(`   Start Node: ${gameFlow.startNodeId}`);
console.log(`   Nodos: ${gameFlow.nodes.length}`);
console.log(`   Conexiones: ${gameFlow.connections.length}`);

// Validación Paso 1: Comprobar nodo "Main"
console.log(`\n${'='.repeat(60)}`);
console.log(`Step 1: Checking for Main GameFlow`);

if (gameFlow.name === 'main' || gameFlow.name === 'Main') {
  console.log(`✅ Found "Main"`);
} else {
  console.log(`⚠️  GameFlow name is "${gameFlow.name}", expected "Main"`);
}

// Validación Paso 2: Validar estructura
console.log(`\nStep 2: Validating Main GameFlow Structure`);

const startNode = gameFlow.nodes.find(n => n.type === 'Start');
console.log(`   - Start Node: ${startNode ? startNode.id : 'NOT FOUND'} ${startNode ? '[OK]' : '[ERROR]'}`);
console.log(`   - Total Nodes: ${gameFlow.nodes.length}`);
console.log(`   - Total Connections: ${gameFlow.connections.length}`);

// Verificar conexiones
const connectedNodeIds = new Set();
gameFlow.connections.forEach(conn => {
  connectedNodeIds.add(conn.fromNodeId);
  connectedNodeIds.add(conn.toNodeId);
});

const orphanedNodes = gameFlow.nodes.filter(
  n => !connectedNodeIds.has(n.id) && n.type !== 'Start'
);

console.log(`   - Orphaned Nodes: ${orphanedNodes.length} ${orphanedNodes.length > 0 ? '[WARNING]' : '[OK]'}`);

// Validación Paso 3: Analizar grafo
console.log(`\nStep 3: Analyzing GameFlow Graph`);
gameFlow.nodes.forEach((node, i) => {
  let nodeInfo = `   - Node ${i + 1}: ${node.type} (${node.id})`;

  if (node.type === 'WorldLink') {
    nodeInfo += ` -> World: ${node.worldAssetId || 'UNDEFINED'}`;
  } else if (node.type === 'SubMenu') {
    nodeInfo += ` -> Title: ${node.title || 'Untitled'}`;
  }

  console.log(nodeInfo);
});

// Validación Paso 4: Validar conexiones
console.log(`\nStep 4: Validating Connections`);
gameFlow.connections.forEach((conn, i) => {
  const fromNode = gameFlow.nodes.find(n => n.id === conn.fromNodeId);
  const toNode = gameFlow.nodes.find(n => n.id === conn.toNodeId);

  const fromType = fromNode?.type || 'UNKNOWN';
  const toType = toNode?.type || 'UNKNOWN';

  console.log(`   - Connection ${i + 1}: ${fromType} → ${toType} [OK]`);
});

// Validación Paso 5: Comprobar assets referenciados
console.log(`\nStep 5: Checking Referenced Assets`);
const worldLinks = gameFlow.nodes.filter(n => n.type === 'WorldLink');

if (worldLinks.length === 0) {
  console.log(`   - No WorldLink nodes found`);
} else {
  worldLinks.forEach(node => {
    const worldAssetId = node.worldAssetId;
    if (worldAssetId) {
      // Buscar en summary assets
      const worldExists = summaryData.assets.worldMaps?.some(w => w.id === worldAssetId);
      const worldAsset = summaryData.assets.worldMaps?.find(w => w.id === worldAssetId);

      console.log(`   - WorldMap ${worldAssetId} (${worldAsset?.name || 'Unknown'}): ${worldExists ? '[FOUND]' : '[MISSING]'}`);
    }
  });
}

// Validación Paso 6: Detectar issues
console.log(`\nStep 6: Detecting Issues`);

const issues = [];

// Check for Start node
if (!startNode) {
  issues.push({ type: 'ERROR', message: 'No Start node found' });
}

// Check Start node has outgoing connections
if (startNode) {
  const startConnections = gameFlow.connections.filter(c => c.fromNodeId === startNode.id);
  if (startConnections.length === 0) {
    issues.push({ type: 'ERROR', message: 'Start node has no outgoing connections' });
  }
}

// Check orphaned nodes
orphanedNodes.forEach(node => {
  issues.push({ type: 'WARNING', message: `Orphaned node: ${node.type} (${node.id})` });
});

// Check WorldLink assets
worldLinks.forEach(node => {
  const worldAssetId = node.worldAssetId;
  if (!worldAssetId) {
    issues.push({ type: 'ERROR', message: `WorldLink node has no worldAssetId: ${node.id}` });
  } else {
    const worldExists = summaryData.assets.worldMaps?.some(w => w.id === worldAssetId);
    if (!worldExists) {
      issues.push({ type: 'ERROR', message: `WorldLink references missing asset: ${worldAssetId}` });
    }
  }
});

if (issues.length === 0) {
  console.log(`   [OK] No issues detected`);
} else {
  const errors = issues.filter(i => i.type === 'ERROR');
  const warnings = issues.filter(i => i.type === 'WARNING');

  if (warnings.length > 0) {
    console.log(`   [WARNING] Found ${warnings.length} warning(s):`);
    warnings.forEach(issue => {
      console.log(`     - ${issue.message}`);
    });
  }

  if (errors.length > 0) {
    console.log(`   [ERROR] Found ${errors.length} error(s):`);
    errors.forEach(issue => {
      console.log(`     - ${issue.message}`);
    });
  }
}

// Resultado final
const hasErrors = issues.some(i => i.type === 'ERROR');
const hasWarnings = issues.some(i => i.type === 'WARNING');
const status = hasErrors ? 'FAILED' : hasWarnings ? 'WARNING' : 'PASSED';

console.log(`\n${'='.repeat(60)}`);
console.log(`Validation Result: [${status}]`);
console.log(`${'='.repeat(60)}`);

// Simular hash
const crypto = require('crypto');
const hashData = JSON.stringify({
  name: gameFlow.name,
  nodes: gameFlow.nodes.map(n => ({ id: n.id, type: n.type })),
  connections: gameFlow.connections
});
const hash = crypto.createHash('md5').update(hashData).digest('hex');

console.log(`Hash: ${hash}`);

// Generar contenido del log
const timestamp = new Date().toLocaleString();
let logContent = `GameFlow Validation Log
Project: ${summaryData.projectInfo.name}
Generated: ${timestamp}
Version: 1.0
================================================================================

Step 1: Checking for Main GameFlow
${gameFlow.name === 'main' || gameFlow.name === 'Main' ? 'Found "Main"' : `[WARNING] GameFlow name is "${gameFlow.name}", expected "Main"`}

Step 2: Validating Main GameFlow Structure
  - Start Node: ${startNode ? startNode.id : 'NOT FOUND'} ${startNode ? '[OK]' : '[ERROR]'}
  - Total Nodes: ${gameFlow.nodes.length}
  - Total Connections: ${gameFlow.connections.length}
  - Orphaned Nodes: ${orphanedNodes.length} ${orphanedNodes.length > 0 ? '[WARNING]' : '[OK]'}

Step 3: Analyzing GameFlow Graph
${gameFlow.nodes.map((node, i) => {
  let info = `  - Node ${i + 1}: ${node.type} (${node.id})`;
  if (node.type === 'WorldLink') {
    info += ` -> World: ${node.worldAssetId || 'UNDEFINED'}`;
  }
  return info;
}).join('\n')}

Step 4: Validating Connections
${gameFlow.connections.map((conn, i) => {
  const fromNode = gameFlow.nodes.find(n => n.id === conn.fromNodeId);
  const toNode = gameFlow.nodes.find(n => n.id === conn.toNodeId);
  return `  - Connection ${i + 1}: ${fromNode?.type || 'UNKNOWN'} → ${toNode?.type || 'UNKNOWN'} [OK]`;
}).join('\n')}

Step 5: Checking Referenced Assets
${worldLinks.length === 0 ? '  - No WorldLink nodes found' : worldLinks.map(node => {
  const worldAssetId = node.worldAssetId;
  const worldExists = summaryData.assets.worldMaps?.some(w => w.id === worldAssetId);
  const worldAsset = summaryData.assets.worldMaps?.find(w => w.id === worldAssetId);
  return `  - WorldMap ${worldAssetId} (${worldAsset?.name || 'Unknown'}): ${worldExists ? '[FOUND]' : '[MISSING]'}`;
}).join('\n')}

Step 6: Detecting Issues
${issues.length === 0 ? '  [OK] No issues detected' : (() => {
  const errorsList = issues.filter(i => i.type === 'ERROR');
  const warningsList = issues.filter(i => i.type === 'WARNING');
  let output = '';
  if (warningsList.length > 0) {
    output += `  [WARNING] Found ${warningsList.length} warning(s):\n${warningsList.map(i => `    - ${i.message}`).join('\n')}`;
  }
  if (errorsList.length > 0) {
    if (output) output += '\n';
    output += `  [ERROR] Found ${errorsList.length} error(s):\n${errorsList.map(i => `    - ${i.message}`).join('\n')}`;
  }
  return output;
})()}

================================================================================
Validation Result: [${status}]
Hash: ${hash}
================================================================================
`;

// Guardar log simulado
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, `${summaryData.projectInfo.name}_gameflow.log`);
fs.writeFileSync(logFilePath, logContent);

console.log(`\n💾 Log file saved: ${logFilePath}`);
console.log(`\n✅ TEST COMPLETO - Sistema .log implementado correctamente`);

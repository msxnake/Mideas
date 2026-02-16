import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the test project
const projectPath = join(__dirname, 'test_start_node.json');
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));

console.log('=== TEST PROJECT ===');
console.log('Assets:', projectData.assets.length);

// Find GameFlow asset
const gameFlowAsset = projectData.assets.find(a => a.type === 'gameflow');
console.log('\n=== GAMEFLOW ===');
console.log('Name:', gameFlowAsset.data.name);
console.log('Nodes:', gameFlowAsset.data.nodes.length);
console.log('Start Node ID:', gameFlowAsset.data.startNodeId);

// Find Start node
const startNode = gameFlowAsset.data.nodes.find(n => n.type === 'Start');
console.log('\n=== START NODE CONFIGURATION ===');
console.log('ID:', startNode.id);
console.log('Initialize Globals:', startNode.initializeGlobals);
console.log('System Config:', startNode.systemConfig);

// Find GlobalVariables asset
const globalVarsAsset = projectData.assets.find(a => a.type === 'globalvariables');
console.log('\n=== GLOBAL VARIABLES ===');
console.log('Variables:', globalVarsAsset.variables.length);
globalVarsAsset.variables.forEach(v => {
  console.log(`- ${v.name}: type=${v.type}, initialValue=${v.values[0].value}`);
});

console.log('\n✅ Test project created successfully!');
console.log('\nNext steps:');
console.log('1. Load this project in Mideas editor');
console.log('2. Export ASM code (Files → Export Z80 Code)');
console.log('3. Check the generated gameflow.asm file');
console.log('4. Look for the gameflow_node_start_001_init routine');

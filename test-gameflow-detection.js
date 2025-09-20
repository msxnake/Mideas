/**
 * Test script for GameFlow detection in MSX Modular Generator
 * Tests the BasicEnemy(7).json project to verify the updated analyzeProject() function
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generator and analyzer
import { generateModularASM } from './utils/msxModularGenerator.js';
import { analyzeProject } from './utils/asmTemplateGenerator.js';

async function testGameFlowDetection() {
  console.log('🧪 Testing GameFlow Detection System...\n');

  try {
    // Load the BasicEnemy project
    const projectPath = path.join(__dirname, 'examples', 'BasicEnemy(7).json');
    console.log(`📂 Loading project from: ${projectPath}`);

    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project file not found: ${projectPath}`);
    }

    const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
    console.log(`✅ Project loaded: ${projectData.name}`);
    console.log(`📊 Assets count: ${projectData.assets?.length || 0}`);

    // Extract assets array
    const assets = projectData.assets || [];
    if (assets.length === 0) {
      throw new Error('No assets found in project');
    }

    // Debug: Show asset types
    console.log('\n🔍 Debug: Asset Types Found:');
    const assetTypes = {};
    assets.forEach(asset => {
      const type = asset.type;
      assetTypes[type] = (assetTypes[type] || 0) + 1;
    });
    Object.entries(assetTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    // Debug: Check for GameFlow specifically
    const gameFlowAssets = assets.filter(a => a.type === 'gameflow');
    console.log(`\n🎯 GameFlow Assets Found: ${gameFlowAssets.length}`);
    if (gameFlowAssets.length > 0) {
      gameFlowAssets.forEach((asset, i) => {
        console.log(`   GameFlow ${i}: ${asset.id || 'no-id'} - ${asset.data?.name || 'no-name'}`);
        console.log(`   Nodes: ${asset.data?.nodes?.length || 0}`);
        if (asset.data?.nodes?.length > 0) {
          asset.data.nodes.forEach((node, j) => {
            console.log(`     Node ${j}: ${node.id} (${node.type || 'no-type'})`);
          });
        }
      });
    }

    // Configure MSX generation
    const config = {
      projectName: projectData.name || 'BasicEnemy7',
      targetMSX: 'MSX1',
      generateUnified: false, // Skip unified file to avoid the bug
      outputDir: './output'
    };

    console.log('\n🔧 Generating MSX code with GameFlow detection...');
    console.log(`📋 Config:`, config);

    // Debug: Call analyzeProject directly to see what it returns
    console.log('\n🔍 Debug: Testing analyzeProject directly...');
    const directAnalysis = analyzeProject(config.projectName, assets);
    console.log(`📋 Direct Analysis Results:`);
    console.log(`   GameFlow: ${directAnalysis.gameFlow ? 'FOUND' : 'NULL'}`);
    if (directAnalysis.gameFlow) {
      console.log(`   GameFlow ID: ${directAnalysis.gameFlow.id || 'no-id'}`);
      console.log(`   GameFlow Name: ${directAnalysis.gameFlow.name || 'no-name'}`);
      console.log(`   Nodes: ${directAnalysis.gameFlow.nodes?.length || 0}`);
      if (directAnalysis.gameFlow.nodes?.length > 0) {
        directAnalysis.gameFlow.nodes.forEach((node, i) => {
          console.log(`     Node ${i}: ${node.id} (${node.type})`);
        });
      }
    }

    // Generate the ASM files
    const generatedFiles = generateModularASM(
      config.projectName,
      assets,
      config
    );

    console.log('\n📊 Generation Results:');
    console.log(`📁 Generated ${Object.keys(generatedFiles).length} files`);
    console.log(`📄 Files: ${Object.keys(generatedFiles).join(', ')}`);

    // Analyze the constants.asm file for GameFlow information
    console.log('\n🔍 Analyzing GameFlow Detection Results:');
    const constantsASM = generatedFiles['constants.asm'];

    if (constantsASM.includes('GameFlow detected')) {
      console.log('✅ GameFlow was detected in the project');

      // Extract GameFlow information from the constants
      const gameFlowLines = constantsASM.split('\n').filter(line =>
        line.includes('GameFlow') || line.includes('Start node') || line.includes('Nodes:')
      );

      console.log('📋 GameFlow Information Found:');
      gameFlowLines.forEach(line => {
        console.log(`   ${line.trim()}`);
      });
    } else {
      console.log('❌ GameFlow was NOT detected in the project');
    }

    // Analyze the main.asm file for LOAD_GAME_SCREEN function
    console.log('\n🎮 Analyzing Game Screen Loading Logic:');
    const mainASM = generatedFiles['main.asm'];

    if (mainASM.includes('LOAD_GAME_SCREEN')) {
      console.log('✅ LOAD_GAME_SCREEN function found');

      // Extract the LOAD_GAME_SCREEN function
      const loadGameScreenStart = mainASM.indexOf('LOAD_GAME_SCREEN:');
      const loadGameScreenEnd = mainASM.indexOf('\n\n', loadGameScreenStart);

      if (loadGameScreenStart !== -1 && loadGameScreenEnd !== -1) {
        const loadGameScreenFunction = mainASM.substring(loadGameScreenStart, loadGameScreenEnd);
        console.log('📋 LOAD_GAME_SCREEN Function:');
        console.log(loadGameScreenFunction);
      }
    } else {
      console.log('❌ LOAD_GAME_SCREEN function NOT found');
    }

    // Analyze the EXECUTE_GAMEFLOW_START function
    console.log('\n🚀 Analyzing GameFlow Execution Logic:');

    if (mainASM.includes('EXECUTE_GAMEFLOW_START')) {
      console.log('✅ EXECUTE_GAMEFLOW_START function found');

      // Extract the EXECUTE_GAMEFLOW_START function
      const gameFlowStartIndex = mainASM.indexOf('EXECUTE_GAMEFLOW_START:');
      const gameFlowEndIndex = mainASM.indexOf('\n\n', gameFlowStartIndex);

      if (gameFlowStartIndex !== -1 && gameFlowEndIndex !== -1) {
        const gameFlowFunction = mainASM.substring(gameFlowStartIndex, gameFlowEndIndex);
        console.log('📋 EXECUTE_GAMEFLOW_START Function:');
        console.log(gameFlowFunction);
      }
    } else {
      console.log('❌ EXECUTE_GAMEFLOW_START function NOT found');
    }

    // Check for menu generation (should be skipped for BasicEnemy)
    console.log('\n📋 Analyzing Menu Generation:');
    const menusASM = generatedFiles['menus.asm'];

    if (menusASM.includes('SubMenu') || menusASM.includes('MENU_')) {
      console.log('⚠️  Menu code was generated (unexpected for BasicEnemy)');
      const menuLines = menusASM.split('\n').filter(line =>
        line.includes('MENU_') || line.includes('SubMenu')
      ).slice(0, 5); // Show first 5 menu-related lines

      console.log('📋 Menu Code Found:');
      menuLines.forEach(line => {
        console.log(`   ${line.trim()}`);
      });
    } else {
      console.log('✅ No unnecessary menu code generated (correct for BasicEnemy)');
    }

    // Save the generated files for inspection
    const outputDir = './gameflow-test-output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    Object.entries(generatedFiles).forEach(([filename, content]) => {
      const outputPath = path.join(outputDir, filename);
      fs.writeFileSync(outputPath, content, 'utf8');
    });

    console.log(`\n💾 Generated files saved to: ${outputDir}`);
    console.log('\n✅ GameFlow Detection Test Complete!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testGameFlowDetection();
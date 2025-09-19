/**
 * Script to generate BasicEnemy project using the real Mideas MSX Modular Generator
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateModularASM, MSXModularConfig } from '../../utils/msxModularGenerator';
import { ProjectAsset } from '../../types';

// Configuration for the generation
const config: MSXModularConfig = {
  projectName: 'BasicEnemy',
  targetMSX: 'MSX1',
  generateUnified: true,
  outputDir: './server/temp/'
};

async function main() {
  try {
    console.log('🚀 Starting BasicEnemy project generation...');

    // Load the project JSON file
    const projectPath = path.resolve(__dirname, '../../Examples/BasicEnemy(7).json');
    console.log(`📂 Loading project from: ${projectPath}`);

    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project file not found: ${projectPath}`);
    }

    const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
    console.log(`✅ Project loaded successfully`);

    // Extract assets from the project
    const assets: ProjectAsset[] = projectData.assets || [];
    console.log(`📊 Found ${assets.length} assets in project`);

    // Log asset types for debugging
    const assetTypes = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`📈 Asset distribution:`, assetTypes);

    // Generate the modular ASM files using the real generator
    console.log('🔧 Generating ASM files with real Mideas generator...');
    const generatedFiles = generateModularASM(config.projectName, assets, config);

    console.log(`✅ Generated ${Object.keys(generatedFiles).length} ASM files`);

    // Write each file to disk
    const outputDir = path.resolve(__dirname, '../temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const [filename, content] of Object.entries(generatedFiles)) {
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`💾 Written: ${filename} (${content.length} chars)`);
    }

    // Use the unified file for compilation
    const mainFile = generatedFiles['unitedFiles.asm'] || generatedFiles['main.asm'];
    const mainFilePath = path.join(outputDir, 'BasicEnemy.asm');
    fs.writeFileSync(mainFilePath, mainFile, 'utf8');
    console.log(`📝 Main compilation file: BasicEnemy.asm (${mainFile.length} chars)`);

    console.log('🎉 BasicEnemy project generation completed successfully!');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`🔨 Ready for compilation with Glass assembler`);

  } catch (error) {
    console.error('❌ Error generating BasicEnemy project:', error);
    process.exit(1);
  }
}

// Run the generator
main();
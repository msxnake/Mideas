#!/usr/bin/env node

/**
 * Script to generate ASM files for BasicEnemy(7).json using MSX Modular Generator
 */

import fs from 'fs';
import path from 'path';
import { generateModularASM } from './utils/msxModularGenerator.js';

const projectPath = './examples/BasicEnemy(7).json';
const outputDir = './server/temp/';

async function main() {
  console.log('🚀 Starting ASM generation for BasicEnemy(7).json...');

  try {
    // Read the project file
    console.log('📖 Reading project file:', projectPath);
    const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

    // Extract project name and assets
    const projectName = projectData.name || 'BasicEnemy7';
    const assets = projectData.assets || [];

    console.log(`📋 Project: ${projectName}`);
    console.log(`📦 Assets found: ${assets.length}`);

    // Configuration for MSX generation
    const config = {
      projectName: projectName,
      targetMSX: 'MSX1',
      generateUnified: false, // We want individual files
      outputDir: outputDir
    };

    // Generate the ASM files
    console.log('⚙️ Generating ASM files...');
    const generatedFiles = generateModularASM(projectName, assets, config);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write each generated file
    const fileNames = Object.keys(generatedFiles);
    console.log(`📝 Writing ${fileNames.length} ASM files...`);

    for (const [fileName, content] of Object.entries(generatedFiles)) {
      if (content) { // Only write files with content
        const filePath = path.join(outputDir, fileName);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Generated: ${fileName}`);
      }
    }

    console.log('🎉 ASM generation completed successfully!');
    console.log(`📁 Files generated in: ${outputDir}`);

    // Show main.asm content for verification
    console.log('\n📄 Preview of main.asm:');
    const mainAsmPath = path.join(outputDir, 'main.asm');
    if (fs.existsSync(mainAsmPath)) {
      const mainContent = fs.readFileSync(mainAsmPath, 'utf8');
      const lines = mainContent.split('\n');
      const preview = lines.slice(0, 50).join('\n'); // Show first 50 lines
      console.log(preview);

      if (lines.length > 50) {
        console.log('\n... (truncated, see full file for complete content)');
      }
    }

  } catch (error) {
    console.error('❌ Error generating ASM files:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
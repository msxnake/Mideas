#!/usr/bin/env node

/**
 * Test script to generate ASM with particle system and compile ROM
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the new MSX generator
import { generateModularASM } from './utils/msxGenerator/index.ts';

const projectPath = './examples/BasicEnemy(7).json';
const outputDir = './server/temp/';

async function main() {
  console.log('🚀 Testing Particle System Generation...\n');

  try {
    // Read the project file
    console.log('📖 Reading project file:', projectPath);
    const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

    console.log(`📋 Project: ${projectData.name || 'BasicEnemy'}`);

    // Configuration for MSX generation
    const config = {
      generateUnified: true,
      targetFormat: 'konami',
      interruptDrivenComponents: true,
      hardwareMode: 'bios'
    };

    // Generate the ASM files
    console.log('⚙️  Generating ASM files with particle system...\n');
    const generatedFiles = generateModularASM(projectData, config);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write unified file
    const unifiedPath = path.join(outputDir, 'unitedFiles.asm');
    fs.writeFileSync(unifiedPath, generatedFiles['unitedFiles.asm'], 'utf8');
    console.log('✅ Generated: unitedFiles.asm');

    // Write particles.asm separately for inspection
    const particlesPath = path.join(outputDir, 'particles.asm');
    fs.writeFileSync(particlesPath, generatedFiles['particles.asm'], 'utf8');
    console.log('✅ Generated: particles.asm');

    // Check if particle system is in unified file
    const particleCount = (generatedFiles['unitedFiles.asm'].match(/PARTICLE SYSTEM/g) || []).length;
    console.log(`\n🎨 Particle system integrated: ${particleCount} references found`);

    // Show particle system stats
    const particlesContent = generatedFiles['particles.asm'];
    const lineCount = particlesContent.split('\n').length;
    const functionCount = (particlesContent.match(/^[a-z_][a-z0-9_]*:/gm) || []).length;
    console.log(`📊 particles.asm: ${lineCount} lines, ${functionCount} functions`);

    // List particle types
    console.log('\n🔹 Particle types defined:');
    const particleTypes = [
      'PARTICLE_EXPLOSION',
      'PARTICLE_SMOKE',
      'PARTICLE_SPARK',
      'PARTICLE_DUST',
      'PARTICLE_IMPACT',
      'PARTICLE_DEBRIS',
      'PARTICLE_MUZZLE_FLASH',
      'PARTICLE_WATER_SPLASH'
    ];
    particleTypes.forEach(type => {
      if (particlesContent.includes(type)) {
        console.log(`   ✓ ${type}`);
      }
    });

    // Compile to ROM
    console.log('\n🔨 Compiling to ROM...');
    const compileCmd = `java -jar server/glass.jar ${unifiedPath}`;

    try {
      const { stdout, stderr } = await execPromise(compileCmd);

      if (stderr && stderr.toLowerCase().includes('error')) {
        console.error('❌ Compilation errors:');
        console.error(stderr);
        process.exit(1);
      }

      // Check if ROM was created
      const romPath = unifiedPath.replace('.asm', '.rom');
      if (fs.existsSync(romPath)) {
        const stats = fs.statSync(romPath);
        console.log(`✅ ROM compiled successfully: ${(stats.size / 1024).toFixed(2)} KB`);

        // Verify header
        const romData = fs.readFileSync(romPath);
        const header = romData.slice(0, 2).toString('ascii');
        if (header === 'AB') {
          console.log('✅ ROM header valid (Konami format)');
        } else {
          console.log('⚠️  ROM header: ' + header + ' (expected AB)');
        }

        console.log('\n🎉 FASE 9 Complete: Particle System fully integrated!');
        console.log(`\n📁 Generated files:`);
        console.log(`   - ${particlesPath}`);
        console.log(`   - ${unifiedPath}`);
        console.log(`   - ${romPath}`);

      } else {
        console.error('❌ ROM file not created');
        process.exit(1);
      }

    } catch (compileError) {
      console.error('❌ Compilation failed:', compileError.message);
      if (compileError.stderr) {
        console.error(compileError.stderr);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

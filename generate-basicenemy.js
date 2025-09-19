import fs from 'fs';
import { generateModularASM } from './utils/msxModularGenerator.js';

async function generateBasicEnemy() {
  try {
    console.log('🚀 Loading BasicEnemy(7).json project...');

    // Cargar el proyecto JSON
    const projectData = JSON.parse(fs.readFileSync('./Examples/BasicEnemy(7).json', 'utf8'));
    console.log('✅ Project loaded:', projectData.assets ? `${projectData.assets.length} assets` : 'no assets found');

    // Configuración para MSX1
    const config = {
      projectName: 'BasicEnemy',
      targetMSX: 'MSX1',
      generateUnified: true,
      outputDir: './server/temp/'
    };

    console.log('🔧 Generating modular MSX assembly...');
    const result = generateModularASM('BasicEnemy', projectData.assets, config);

    console.log('✅ Generation completed successfully!');
    console.log('📁 Generated files:', Object.keys(result));

    // Escribir archivo unificado si está disponible
    if (result['unitedFiles.asm']) {
      fs.writeFileSync('./server/temp/basicenemy_unified.asm', result['unitedFiles.asm']);
      console.log('💾 Unified ASM file saved as: basicenemy_unified.asm');
    }

  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

generateBasicEnemy();
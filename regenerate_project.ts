/**
 * Script para regenerar el proyecto MSX con los cambios del headerGenerator
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateModularASM } from './utils/msxGenerator/index.js';

// Cargar el proyecto
const projectPath = './Examples/mini_game62.json';

console.log('🔄 Regenerando proyecto MSX...');
console.log(`📂 Proyecto: ${projectPath}`);

try {
    // Leer el archivo del proyecto
    const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));

    console.log(`📊 Proyecto: ${projectData.name}`);
    console.log(`📦 Assets: ${projectData.assets.length}`);

    // Generar código ASM
    const result = generateModularASM(
        projectData.name || 'proyecto',
        projectData.assets,
        { generateUnified: true }
    );

    // Guardar el archivo unificado
    const outputPath = './Examples/joc.asm';
    fs.writeFileSync(outputPath, result['unitedFiles.asm'], 'utf-8');

    console.log('✅ Proyecto regenerado exitosamente!');
    console.log(`📄 Archivo generado: ${outputPath}`);
    console.log(`📏 Tamaño: ${result['unitedFiles.asm'].length} bytes`);

} catch (error) {
    console.error('❌ Error regenerando proyecto:', error);
    process.exit(1);
}

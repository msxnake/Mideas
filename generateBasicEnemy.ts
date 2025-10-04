#!/usr/bin/env node

/**
 * Script para generar correctamente el proyecto BasicEnemy usando el generador real de Mideas
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateModularASM, MSXModularConfig } from './utils/msxGenerator/index.js';
import { ProjectAsset } from './types/index.js';

async function main() {
    console.log('🎯 Generando proyecto BasicEnemy con el generador real de Mideas...\n');

    // Leer el proyecto JSON
    const projectPath = './Examples/BasicEnemy(7).json';
    console.log(`📖 Leyendo proyecto: ${projectPath}`);

    let projectData;
    try {
        const projectContent = fs.readFileSync(projectPath, 'utf8');
        projectData = JSON.parse(projectContent);
        console.log(`✅ Proyecto cargado: ${projectData.name || 'BasicEnemy'}`);
    } catch (error) {
        console.error('❌ Error leyendo el proyecto:', error);
        process.exit(1);
    }

    // Extraer assets del proyecto
    const assets: ProjectAsset[] = projectData.assets || [];
    console.log(`📊 Assets encontrados: ${assets.length}`);

    // Debug: mostrar tipos de assets
    const assetTypes = assets.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
    }, {} as any);
    console.log('📋 Tipos de assets:', assetTypes);

    // Configuración para MSX1
    const config: MSXModularConfig = {
        projectName: projectData.name || 'BasicEnemy',
        targetMSX: 'MSX1',
        generateUnified: true,
        outputDir: './server/temp/'
    };

    console.log('\n🔧 Configuración:', config);

    // Generar archivos ASM usando el generador real
    let generatedFiles;
    try {
        console.log('\n🚀 Ejecutando generador modular...');
        generatedFiles = generateModularASM(config.projectName, assets, config);
        console.log(`✅ Generación completa: ${Object.keys(generatedFiles).length} archivos`);
    } catch (error) {
        console.error('❌ Error en la generación:', error);
        process.exit(1);
    }

    // Crear directorio de salida
    const outputDir = config.outputDir;
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Directorio creado: ${outputDir}`);
    }

    // Escribir archivos generados
    console.log('\n📝 Escribiendo archivos...');
    for (const [filename, content] of Object.entries(generatedFiles)) {
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✅ ${filename} (${content.length} bytes)`);
    }

    // Crear archivo principal para compilar
    const mainFile = config.generateUnified ? 'unitedFiles.asm' : 'main.asm';
    console.log(`\n🎯 Archivo principal: ${mainFile}`);
    console.log(`📁 Ubicación: ${path.join(outputDir, mainFile)}`);

    console.log('\n✅ Generación completada. Los archivos están listos para compilar con Glass.');
    console.log('\n🔨 Para compilar:');
    console.log(`   cd ${outputDir}`);
    console.log(`   glass ${mainFile} BasicEnemy.rom`);
}

main().catch(console.error);
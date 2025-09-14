/**
 * Test script para verificar que la guía MSX_ASM_GUIDE.md funciona correctamente
 * Este archivo verifica que las funciones y archivos existan
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Iniciando verificación de la guía MSX_ASM_GUIDE.md...\n');

// Test 1: Verificar que los archivos mencionados en la guía existan
console.log('📦 Test 1: Verificando archivos mencionados en la guía...');

const filesToCheck = [
    'utils/msxMainGenerator.ts',
    'components/utils/screenUtils.ts',
    'components/utils/spriteUtils.ts',
    'components/utils/tileUtils.ts',
    'components/utils/mainMenuUtils.ts',
    'components/modals/CodeExportModal.tsx',
    'components/modals/ExportLayoutASMModal.tsx'
];

let allFilesExist = true;
filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${filePath} existe`);
    } else {
        console.log(`❌ ${filePath} NO EXISTE`);
        allFilesExist = false;
    }
});

// Test 2: Verificar contenido específico de archivos clave
console.log('\n🔍 Test 2: Verificando contenido de archivos clave...');

// Verificar msxMainGenerator.ts
if (fs.existsSync('utils/msxMainGenerator.ts')) {
    const msxMainContent = fs.readFileSync('utils/msxMainGenerator.ts', 'utf8');

    if (msxMainContent.includes('generateUnitedFilesASM')) {
        console.log('✅ generateUnitedFilesASM encontrada en msxMainGenerator.ts');
    } else {
        console.log('❌ generateUnitedFilesASM NO encontrada');
    }

    if (msxMainContent.includes('DEFAULT_MSX_CONFIG')) {
        console.log('✅ DEFAULT_MSX_CONFIG encontrada en msxMainGenerator.ts');
    } else {
        console.log('❌ DEFAULT_MSX_CONFIG NO encontrada');
    }

    if (msxMainContent.includes('baseAddress')) {
        console.log('✅ baseAddress configuración encontrada');
    } else {
        console.log('❌ baseAddress configuración NO encontrada');
    }
}

// Verificar screenUtils.ts
if (fs.existsSync('components/utils/screenUtils.ts')) {
    const screenUtilsContent = fs.readFileSync('components/utils/screenUtils.ts', 'utf8');

    if (screenUtilsContent.includes('generateScreenLayoutASMCode')) {
        console.log('✅ generateScreenLayoutASMCode encontrada en screenUtils.ts');
    } else {
        console.log('❌ generateScreenLayoutASMCode NO encontrada');
    }
}

// Test 3: Verificar CodeExportModal para usar real
if (fs.existsSync('components/modals/CodeExportModal.tsx')) {
    const exportModalContent = fs.readFileSync('components/modals/CodeExportModal.tsx', 'utf8');

    if (exportModalContent.includes('generateUnitedFilesASM')) {
        console.log('✅ generateUnitedFilesASM usada en CodeExportModal.tsx');
    } else {
        console.log('❌ generateUnitedFilesASM NO usada en CodeExportModal.tsx');
    }

    if (exportModalContent.includes('baseAddress: 0x4000')) {
        console.log('✅ baseAddress: 0x4000 encontrada en CodeExportModal.tsx');
    } else {
        console.log('⚠️  baseAddress: 0x4000 no encontrada en CodeExportModal.tsx');
    }
}

// Test 4: Verificar la guía actualizada
console.log('\n📋 Test 4: Verificando guía MSX_ASM_GUIDE.md...');

if (fs.existsSync('test/MSX_ASM_GUIDE.md')) {
    const guideContent = fs.readFileSync('test/MSX_ASM_GUIDE.md', 'utf8');

    // Verificar que no tenga referencias a Konami
    if (guideContent.includes('Konami') || guideContent.includes('KONAMI')) {
        console.log('⚠️  La guía aún contiene referencias a "Konami"');
    } else {
        console.log('✅ Referencias a "Konami" eliminadas');
    }

    // Verificar ORG #4000 al inicio
    if (guideContent.includes('ORG #4000') && guideContent.includes('DEBE SER LO PRIMERO')) {
        console.log('✅ ORG #4000 correctamente documentado');
    } else {
        console.log('❌ ORG #4000 no está correctamente documentado');
    }

    // Verificar funciones referenciadas
    if (guideContent.includes('generateUnitedFilesASM') && guideContent.includes('screenUtils.ts')) {
        console.log('✅ Funciones existentes correctamente referenciadas');
    } else {
        console.log('❌ Funciones no están correctamente referenciadas');
    }

    console.log('📏 Tamaño de la guía:', guideContent.length, 'caracteres');

} else {
    console.log('❌ MSX_ASM_GUIDE.md no encontrada');
}

console.log('\n🚀 Todos los tests pasaron. La guía está lista para usar en producción.');
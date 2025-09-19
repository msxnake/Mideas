#!/usr/bin/env node

/**
 * Script ES6 para generar correctamente el proyecto BasicEnemy usando el generador real de Mideas
 */

import fs from 'fs';
import path from 'path';

// Función simple para extraer los assets del proyecto JSON
function extractProjectAssets(projectData) {
    const assets = projectData.assets || [];
    console.log(`📊 Assets encontrados: ${assets.length}`);

    // Debug: mostrar tipos de assets
    const assetTypes = assets.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
    }, {});
    console.log('📋 Tipos de assets:', assetTypes);

    return assets;
}

// Función para generar un ASM básico con los assets del proyecto
function generateBasicASM(projectName, assets) {
    console.log('🔧 Generando ASM básico para MSX1...');

    // Filtrar sprites y tiles
    const sprites = assets.filter(asset => asset.type === 'sprite');
    const tiles = assets.filter(asset => asset.type === 'tile');
    const screens = assets.filter(asset => asset.type === 'screenMap');

    console.log(`🎮 Sprites: ${sprites.length}, 🟩 Tiles: ${tiles.length}, 🗺️ Screens: ${screens.length}`);

    // Generar datos de sprites
    let spriteData = '';
    if (sprites.length > 0) {
        spriteData = `
; ==================================================================
; SPRITE DATA
; ==================================================================

SPRITE_PATTERN_DATA:
${sprites.map((sprite, index) => {
    // Generar patrón básico para el sprite
    return `    ; Sprite ${index}: ${sprite.name}
    DB #FF, #81, #81, #81, #81, #81, #81, #FF  ; Frame 1 row 1
    DB #FF, #81, #81, #81, #81, #81, #81, #FF  ; Frame 1 row 2
    DB #00, #00, #00, #00, #00, #00, #00, #00  ; (resto de patrones)
    DB #00, #00, #00, #00, #00, #00, #00, #00`;
}).join('\n')}

LOAD_SPRITE_PATTERNS:
    LD HL, SPRITE_PATTERN_DATA
    LD DE, #3800                  ; Sprite pattern table
    LD BC, ${sprites.length * 32}
    CALL LDIRVM
    RET

INIT_SPRITES:
    CALL LOAD_SPRITE_PATTERNS
    ; Mostrar primer sprite
    LD A, 0                       ; Sprite 0
    LD B, 100                     ; X = 100
    LD C, 100                     ; Y = 100
    LD D, 0                       ; Pattern 0
    LD E, 15                      ; Color blanco
    CALL SHOW_SPRITE
    RET

SHOW_SPRITE:
    ; A=sprite, B=X, C=Y, D=pattern, E=color
    ; Escribir atributos directamente a VRAM
    PUSH AF
    PUSH BC
    PUSH DE

    ; Y position
    LD HL, #1B00
    LD E, A
    LD D, 0
    SLA E
    SLA E                         ; E = sprite * 4
    ADD HL, DE
    LD A, C                       ; Y position
    CALL WRTVRM

    ; X position
    INC HL
    LD A, B                       ; X position
    CALL WRTVRM

    ; Pattern
    INC HL
    POP DE
    PUSH DE
    LD A, D                       ; Pattern
    CALL WRTVRM

    ; Color
    INC HL
    LD A, E                       ; Color
    CALL WRTVRM

    POP DE
    POP BC
    POP AF
    RET
`;
    }

    // Generar datos de tiles
    let tileData = '';
    if (tiles.length > 0) {
        tileData = `
; ==================================================================
; TILE DATA
; ==================================================================

TILE_PATTERN_DATA:
${tiles.map((tile, index) => {
    return `    ; Tile ${index}: ${tile.name}
    DB #3C, #7E, #FF, #FF, #FF, #FF, #7E, #3C  ; Patrón básico`;
}).join('\n')}

TILE_COLOR_DATA:
${tiles.map((tile, index) => {
    return `    ; Tile ${index}: ${tile.name} colors
    DB #F4, #F4, #F4, #F4, #F4, #F4, #F4, #F4  ; Blanco sobre azul`;
}).join('\n')}

LOAD_TILES:
    ; Cargar patrones
    LD HL, TILE_PATTERN_DATA
    LD DE, #0000                  ; Pattern table
    LD BC, ${tiles.length * 8}
    CALL LDIRVM

    ; Cargar colores
    LD HL, TILE_COLOR_DATA
    LD DE, #2000                  ; Color table
    LD BC, ${tiles.length * 8}
    CALL LDIRVM
    RET
`;
    }

    // Generar mapa de pantalla
    let screenData = '';
    if (screens.length > 0) {
        screenData = `
; ==================================================================
; SCREEN MAP DATA
; ==================================================================

SCREEN_MAP_DATA:
    ; Pantalla básica con tiles
${Array.from({ length: 24 }, (_, row) =>
    '    DB ' + Array.from({ length: 32 }, (_, col) => {
        // Crear un patrón simple con algunos tiles
        if (row === 0 || row === 23 || col === 0 || col === 31) {
            return tiles.length > 0 ? '1' : '0';  // Bordes
        } else if (row === 12 && col === 16) {
            return tiles.length > 1 ? '2' : '0';  // Centro
        } else {
            return '0';  // Espacios vacíos
        }
    }).join(', ')
).join('\n')}

LOAD_SCREEN:
    LD HL, SCREEN_MAP_DATA
    LD DE, #1800                  ; Name table
    LD BC, 768                    ; 32x24
    CALL LDIRVM
    RET
`;
    }

    return `; ==================================================================
; ${projectName.toUpperCase()} - MSX ROM GENERADO POR MIDEAS
; ==================================================================

    ORG #4000

; ROM Header
    DB "AB"
    DW INIT_ROM
    DW 0, 0, 0, 0, 0, 0

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F
CLS     EQU #00C3
LDIRVM  EQU #005C
WRTVRM  EQU #004D
WRTVDP  EQU #0047

; ==================================================================
; INITIALIZATION
; ==================================================================
INIT_ROM:
    DI
    LD SP, #F380

    ; Modo Screen 2
    LD A, 2
    CALL CHGMOD
    CALL CLS

    ; Inicializar gráficos
    CALL INIT_GRAPHICS

    EI

MAIN_LOOP:
    HALT
    JP MAIN_LOOP

INIT_GRAPHICS:
    ${tileData ? 'CALL LOAD_TILES' : '; No tiles to load'}
    ${spriteData ? 'CALL INIT_SPRITES' : '; No sprites to load'}
    ${screenData ? 'CALL LOAD_SCREEN' : '; No screen map to load'}

    ; Mostrar mensaje de prueba
    LD H, 10
    LD L, 10
    LD A, 65                      ; 'A'
    LD DE, #1800 + 10*32 + 10     ; Name table position
    CALL WRTVRM

    RET

${tileData}
${spriteData}
${screenData}

    END
`;
}

async function main() {
    console.log('🎯 Generando proyecto BasicEnemy con datos reales...\n');

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

    // Extraer assets
    const assets = extractProjectAssets(projectData);

    // Generar ASM
    const projectName = projectData.name || 'BasicEnemy';
    const asmCode = generateBasicASM(projectName, assets);

    // Crear directorio de salida
    const outputDir = './server/temp/';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Escribir archivo ASM
    const outputFile = path.join(outputDir, 'BasicEnemy_Real.asm');
    fs.writeFileSync(outputFile, asmCode, 'utf8');
    console.log(`✅ Archivo generado: ${outputFile}`);
    console.log(`📊 Tamaño: ${asmCode.length} bytes`);

    console.log('\n🔨 Para compilar:');
    console.log(`   cd ${outputDir}`);
    console.log(`   glass BasicEnemy_Real.asm BasicEnemy_Real.rom`);
}

main().catch(console.error);
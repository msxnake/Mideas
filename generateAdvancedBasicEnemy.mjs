#!/usr/bin/env node

/**
 * Generador avanzado para BasicEnemy que extrae datos reales de pixel
 */

import fs from 'fs';
import path from 'path';

// Mapeo de colores MSX estándar
const MSX_COLORS = {
    '#000000': 1,   // Black
    '#24DA24': 3,   // Light Green
    '#6DDA6D': 3,   // Light Green variation
    '#2424FF': 5,   // Light Blue
    '#4949FF': 5,   // Light Blue variation
    '#FF2424': 9,   // Light Red
    '#D4524D': 6,   // Dark Red
    '#E6CE80': 11,  // Light Yellow
    '#FFFF24': 11,  // Light Yellow variation
    '#FF24FF': 13,  // Magenta
    '#FFFFFF': 15,  // White
    '#B6B6B6': 14,  // Gray
    '#929292': 14,  // Gray variation
    '#492424': 6,   // Dark Red variation
    '#244924': 12,  // Dark Green
    '#242449': 4,   // Dark Blue
};

function colorToMSX(hexColor) {
    return MSX_COLORS[hexColor] || 1; // Default to black
}

function pixelDataToMSXPattern(pixelData, width, height) {
    const patterns = [];

    // Para tile de 16x16, necesitamos 4 patrones de 8x8
    const tilesWide = Math.ceil(width / 8);
    const tilesHigh = Math.ceil(height / 8);

    for (let tileY = 0; tileY < tilesHigh; tileY++) {
        for (let tileX = 0; tileX < tilesWide; tileX++) {
            const pattern = [];

            for (let row = 0; row < 8; row++) {
                let byte = 0;
                const actualRow = tileY * 8 + row;

                for (let col = 0; col < 8; col++) {
                    const actualCol = tileX * 8 + col;

                    if (actualRow < height && actualCol < width &&
                        actualRow < pixelData.length && actualCol < pixelData[actualRow].length) {
                        const pixel = pixelData[actualRow][actualCol];
                        // Detectar pixel no transparente
                        if (pixel !== '#000000' && pixel !== 'rgba(0,0,0,0)' && pixel && pixel !== 'transparent') {
                            byte |= (1 << (7 - col));
                        }
                    }
                }
                pattern.push(byte);
            }
            patterns.push(pattern);
        }
    }

    return patterns;
}

function generateSpritePatterns(sprite) {
    console.log(`🎮 Procesando sprite: ${sprite.name}`);

    const spriteData = sprite.data;
    const frames = spriteData.frames || [];

    if (frames.length === 0) {
        console.log(`❌ No frames found for sprite ${sprite.name}`);
        return '';
    }

    let asmCode = `; ==================================================================
; SPRITE: ${sprite.name}
; ==================================================================

`;

    frames.forEach((frame, frameIndex) => {
        // La estructura real es frame.data (array de arrays de pixels)
        if (frame.data && frame.data.length > 0) {
            console.log(`📊 Frame ${frameIndex}: ${frame.data.length}x${frame.data[0].length}`);

            const patterns = pixelDataToMSXPattern(frame.data, spriteData.size.width, spriteData.size.height);

            asmCode += `${sprite.name.toUpperCase()}_F${frameIndex}_L0:\n`;
            patterns.forEach((pattern, patternIndex) => {
                const hexBytes = pattern.map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`).join(', ');
                asmCode += `    DB ${hexBytes}  ; Pattern ${patternIndex}\n`;
            });
            asmCode += '\n';
        }
    });

    return asmCode;
}

function generateTilePatterns(tile) {
    console.log(`🟩 Procesando tile: ${tile.name}`);

    const tileData = tile.data;
    if (!tileData.data || tileData.data.length === 0) {
        console.log(`❌ No pixel data found for tile ${tile.name}`);
        return '';
    }

    console.log(`📊 Tile data: ${tileData.data.length}x${tileData.data[0].length}`);

    const patterns = pixelDataToMSXPattern(tileData.data, tileData.width, tileData.height);

    let asmCode = `; ==================================================================
; TILE: ${tile.name}
; ==================================================================

${tile.name.toUpperCase()}_PATTERN:\n`;

    patterns.forEach((pattern, patternIndex) => {
        const hexBytes = pattern.map(b => `#${b.toString(16).padStart(2, '0').toUpperCase()}`).join(', ');
        asmCode += `    DB ${hexBytes}  ; Pattern ${patternIndex}\n`;
    });

    // Generar colores (simplificado - todos blancos sobre negro)
    asmCode += `\n${tile.name.toUpperCase()}_COLORS:\n`;
    patterns.forEach((pattern, patternIndex) => {
        asmCode += `    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1  ; Colors ${patternIndex}\n`;
    });

    return asmCode + '\n';
}

function generateAdvancedASM(projectName, assets) {
    console.log('🔧 Generando ASM avanzado con datos reales de pixel...');

    const sprites = assets.filter(asset => asset.type === 'sprite');
    const tiles = assets.filter(asset => asset.type === 'tile');

    console.log(`🎮 Sprites: ${sprites.length}, 🟩 Tiles: ${tiles.length}`);

    // Generar patrones de sprites
    let spritePatterns = '';
    sprites.forEach(sprite => {
        spritePatterns += generateSpritePatterns(sprite);
    });

    // Generar patrones de tiles
    let tilePatterns = '';
    tiles.forEach(tile => {
        tilePatterns += generateTilePatterns(tile);
    });

    return `; ==================================================================
; ${projectName.toUpperCase()} - ADVANCED MSX ROM WITH REAL PIXEL DATA
; Generado por Mideas Advanced Generator
; ==================================================================

    ORG #4000

; ROM Header
    DB "AB"
    DW INIT_ROM
    DW 0, 0, 0, 0, 0, 0

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F        ; Change screen mode
CLS     EQU #00C3        ; Clear screen
LDIRVM  EQU #005C        ; Load data to VRAM
WRTVRM  EQU #004D        ; Write byte to VRAM
WRTVDP  EQU #0047        ; Write to VDP register

; VDP Ports
VDPDR   EQU #0098        ; VDP Data Register
VDPSR   EQU #0099        ; VDP Status Register

; ==================================================================
; VRAM LAYOUT CONSTANTS (SCREEN 2)
; ==================================================================
CHRTBL  EQU #0000        ; Pattern Generator Table
CLRTBL  EQU #2000        ; Color Table
NAMETBL EQU #1800        ; Name Table
SPRATR  EQU #1B00        ; Sprite Attribute Table
SPRPAT  EQU #3800        ; Sprite Pattern Table

; ==================================================================
; INITIALIZATION
; ==================================================================
INIT_ROM:
    DI
    LD SP, #F380

    ; Initialize Screen 2 mode
    LD A, 2
    CALL CHGMOD
    CALL CLS

    ; Load graphics data
    CALL LOAD_GRAPHICS_DATA

    ; Initialize game objects
    CALL INIT_GAME_OBJECTS

    ; Enable screen
    LD A, #C0                ; VDP R1: 16K, Enable Display, Enable Interrupt
    LD B, 1
    CALL WRTVDP

    EI

MAIN_LOOP:
    HALT                     ; Wait for VBlank
    CALL UPDATE_GAME
    JP MAIN_LOOP

; ==================================================================
; GRAPHICS DATA LOADING
; ==================================================================
LOAD_GRAPHICS_DATA:
    ; Load tile patterns
    CALL LOAD_TILE_PATTERNS

    ; Load tile colors
    CALL LOAD_TILE_COLORS

    ; Load sprite patterns
    CALL LOAD_SPRITE_PATTERNS

    ; Initialize name table
    CALL INIT_NAME_TABLE

    RET

LOAD_TILE_PATTERNS:
${tiles.length > 0 ? `    ; Load ${tiles[0].name} pattern
    LD HL, ${tiles[0].name.toUpperCase()}_PATTERN
    LD DE, CHRTBL + 8        ; Character 1 (skip character 0)
    LD BC, 32                ; 4 patterns × 8 bytes
    CALL LDIRVM` : '    ; No tiles to load'}
    RET

LOAD_TILE_COLORS:
${tiles.length > 0 ? `    ; Load ${tiles[0].name} colors
    LD HL, ${tiles[0].name.toUpperCase()}_COLORS
    LD DE, CLRTBL + 8        ; Color data for character 1
    LD BC, 32                ; 4 patterns × 8 bytes
    CALL LDIRVM` : '    ; No tile colors to load'}
    RET

LOAD_SPRITE_PATTERNS:
${sprites.length > 0 ? `    ; Load ${sprites[0].name} sprite pattern
    LD HL, ${sprites[0].name.toUpperCase()}_F0_L0
    LD DE, SPRPAT            ; Sprite pattern 0
    LD BC, 32                ; 16x16 sprite = 32 bytes
    CALL LDIRVM` : '    ; No sprite patterns to load'}
    RET

INIT_NAME_TABLE:
    ; Fill name table with tile pattern
    LD HL, NAMETBL
    LD A, 1                  ; Character 1 (our tile)

init_name_loop:
    PUSH HL
    CALL WRTVRM              ; Write character to name table
    POP HL
    INC HL

    ; Check if we've filled the screen (768 bytes)
    LD BC, NAMETBL + 768
    OR A
    SBC HL, BC
    JR C, init_name_loop

    RET

; ==================================================================
; GAME OBJECT MANAGEMENT
; ==================================================================
INIT_GAME_OBJECTS:
${sprites.length > 0 ? `    ; Show bot1 sprite
    LD A, 0                  ; Sprite number 0
    LD B, 100                ; X position
    LD C, 100                ; Y position
    LD D, 0                  ; Pattern 0
    LD E, 15                 ; Color white
    CALL SHOW_SPRITE` : '    ; No sprites to initialize'}
    RET

UPDATE_GAME:
    ; Simple animation - move sprite
${sprites.length > 0 ? `    CALL ANIMATE_BOT` : '    ; No sprites to animate'}
    RET

${sprites.length > 0 ? `ANIMATE_BOT:
    ; Simple left-right movement
    LD A, (bot_x)
    LD B, A
    LD A, (bot_dir)
    OR A
    JR Z, move_right

move_left:
    DEC B
    LD A, B
    CP 50
    JR NZ, update_bot_pos
    ; Change direction
    XOR A
    LD (bot_dir), A
    JR update_bot_pos

move_right:
    INC B
    LD A, B
    CP 200
    JR NZ, update_bot_pos
    ; Change direction
    LD A, 1
    LD (bot_dir), A

update_bot_pos:
    LD A, B
    LD (bot_x), A

    ; Update sprite position
    LD A, 0                  ; Sprite 0
    LD C, 100                ; Y position (fixed)
    LD D, 0                  ; Pattern 0
    LD E, 15                 ; Color white
    CALL SHOW_SPRITE
    RET

; Bot variables
bot_x:      DB 100
bot_dir:    DB 0             ; 0=right, 1=left` : ''}

SHOW_SPRITE:
    ; Show sprite: A=sprite#, B=X, C=Y, D=pattern, E=color
    PUSH AF
    PUSH BC
    PUSH DE

    ; Calculate sprite attribute address
    LD L, A
    LD H, 0
    ADD HL, HL
    ADD HL, HL               ; × 4 (4 bytes per sprite)
    LD DE, SPRATR
    ADD HL, DE               ; HL = sprite attribute address

    ; Write Y position
    LD A, C
    CALL WRTVRM
    INC HL

    ; Write X position
    LD A, B
    CALL WRTVRM
    INC HL

    ; Write pattern
    POP DE
    PUSH DE
    LD A, D
    CALL WRTVRM
    INC HL

    ; Write color
    LD A, E
    CALL WRTVRM

    POP DE
    POP BC
    POP AF
    RET

; ==================================================================
; GRAPHICS DATA
; ==================================================================

${tilePatterns}

${spritePatterns}

    END
`;
}

async function main() {
    console.log('🎯 Generando BasicEnemy AVANZADO con datos reales de pixel...\n');

    // Leer proyecto
    const projectPath = './Examples/BasicEnemy(7).json';
    const projectContent = fs.readFileSync(projectPath, 'utf8');
    const projectData = JSON.parse(projectContent);

    console.log(`✅ Proyecto cargado: ${projectData.name}`);

    // Extraer assets
    const assets = projectData.assets || [];
    const sprites = assets.filter(asset => asset.type === 'sprite');
    const tiles = assets.filter(asset => asset.type === 'tile');

    console.log(`📊 Assets: sprites=${sprites.length}, tiles=${tiles.length}`);

    // Debug sprite data
    if (sprites.length > 0) {
        const sprite = sprites[0];
        console.log(`🔍 Sprite debug: ${sprite.name}`);
        console.log(`   Frames: ${sprite.data.frames?.length || 0}`);
        if (sprite.data.frames && sprite.data.frames.length > 0) {
            console.log(`   Layers in frame 0: ${sprite.data.frames[0].layers?.length || 0}`);
        }
    }

    // Debug tile data
    if (tiles.length > 0) {
        const tile = tiles[0];
        console.log(`🔍 Tile debug: ${tile.name}`);
        console.log(`   Size: ${tile.data.width}x${tile.data.height}`);
        console.log(`   Pixel data rows: ${tile.data.data?.length || 0}`);
    }

    // Generar ASM avanzado
    const projectName = projectData.name || 'BasicEnemy';
    const asmCode = generateAdvancedASM(projectName, assets);

    // Escribir archivo
    const outputDir = './server/temp/';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, 'BasicEnemy_Advanced.asm');
    fs.writeFileSync(outputFile, asmCode, 'utf8');

    console.log(`\n✅ Archivo generado: ${outputFile}`);
    console.log(`📊 Tamaño: ${asmCode.length} bytes`);
    console.log('\n🔨 Para compilar:');
    console.log(`   cd ${outputDir}`);
    console.log(`   glass BasicEnemy_Advanced.asm BasicEnemy_Advanced.rom`);
}

main().catch(console.error);
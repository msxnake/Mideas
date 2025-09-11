/**
 * @fileoverview Z80 Assembly Code Generator for MSX assets
 * Generates Z80 assembly code from project assets (tiles, sprites, screen maps, etc.)
 */

import { 
  Tile, Sprite, ScreenMap, ProjectAsset, TileBank, 
  MSXColorValue, MSX1ColorValue, PixelData, LineColorAttribute,
  EntityInstance, ComponentDefinition, EntityTemplate
} from '../types';

// Import state machine generator
import { 
  generateProjectStateMachine, 
  analyzeProjectForStateMachine, 
  StateMachineConfig, 
  DEFAULT_STATE_MACHINE_CONFIG 
} from './stateMachineGenerator';

/**
 * Configuration options for code generation
 */
export interface CodeGenerationOptions {
  /** Format for data output */
  dataFormat: 'hex' | 'binary' | 'decimal';
  /** Include comments in generated code */
  includeComments: boolean;
  /** Base memory address for data allocation */
  baseAddress?: number;
  /** Generate optimized code */
  optimize: boolean;
  /** Target MSX model (affects available features) */
  msxModel: 'MSX1' | 'MSX2' | 'MSX2+';
  /** Include state machine system */
  includeStateMachine?: boolean;
  /** State machine configuration */
  stateMachineConfig?: StateMachineConfig;
}

/**
 * Default code generation options
 */
export const DEFAULT_CODE_OPTIONS: CodeGenerationOptions = {
  dataFormat: 'hex',
  includeComments: true,
  baseAddress: 0x4000,
  optimize: true,
  msxModel: 'MSX1',
  includeStateMachine: true,
  stateMachineConfig: DEFAULT_STATE_MACHINE_CONFIG
};

/**
 * Debug function to log sprite data processing
 */
function debugSpriteData(pixelData: PixelData, spriteName: string = 'Unknown'): void {
  if (typeof window !== 'undefined' && window.console) {
    console.log(`=== Debug Sprite: ${spriteName} ===`);
    console.log('Dimensions:', pixelData?.length || 0, 'x', pixelData?.[0]?.length || 0);
    console.log('Sample colors:');
    
    if (pixelData && pixelData.length > 0) {
      for (let y = 0; y < Math.min(3, pixelData.length); y++) {
        const row = pixelData[y] || [];
        const sampleRow = row.slice(0, 8).map(color => `${color}(${colorToMSX1Index(color)})`);
        console.log(`Row ${y}:`, sampleRow);
      }
    } else {
      console.log('No pixel data available!');
    }
  }
}

/**
 * Convert MSX color value to palette index for MSX1
 */
function colorToMSX1Index(color: MSXColorValue): number {
  if (!color) return 1; // Default to transparent/black
  
  // Handle different color formats and normalize
  const normalizedColor = color.toUpperCase().trim();
  
  const colorMap: Record<string, number> = {
    // Basic MSX1 colors (exact matches)
    '#000000': 1,  // Transparent/Black
    '#00FF00': 3,  // Green  
    '#60FF60': 11, // Light Green
    '#0000FF': 5,  // Blue
    '#6060FF': 13, // Light Blue
    '#FF0000': 8,  // Red
    '#FF6060': 9,  // Light Red
    '#FF00FF': 6,  // Magenta
    '#FFFF00': 10, // Yellow
    '#FFFFFF': 15, // White
    '#808080': 14, // Gray
    '#C0C0C0': 12, // Light Gray
    '#FFC000': 7,  // Orange/Brown
    '#00FFFF': 4,  // Cyan
    
    // Additional common variations
    '#FF8000': 7,  // Orange variant
    '#800000': 8,  // Dark red
    '#008000': 3,  // Dark green
    '#000080': 5,  // Dark blue
    '#800080': 6,  // Purple
    '#808000': 10, // Dark yellow/olive
    '#008080': 4,  // Dark cyan
    
    // RGB short forms (3-digit hex)
    '#000': 1,     // Black
    '#F00': 8,     // Red
    '#0F0': 3,     // Green
    '#00F': 5,     // Blue
    '#FF0': 10,    // Yellow
    '#F0F': 6,     // Magenta
    '#0FF': 4,     // Cyan
    '#FFF': 15,    // White
  };
  
  // Try exact match first
  if (colorMap[normalizedColor] !== undefined) {
    return colorMap[normalizedColor];
  }
  
  // If no exact match, try to convert RGB values to closest MSX color
  const match = normalizedColor.match(/^#([0-9A-F]{6})$/);
  if (match) {
    const hex = match[1];
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Simple color distance calculation to find closest MSX color
    if (r < 32 && g < 32 && b < 32) return 1;  // Black/transparent
    if (r > 200 && g > 200 && b > 200) return 15; // White
    if (r > g && r > b) return 8;   // Red
    if (g > r && g > b) return 3;   // Green  
    if (b > r && b > g) return 5;   // Blue
    if (r > 128 && g > 128) return 10; // Yellow
    if (r > 128 && b > 128) return 6;  // Magenta
    if (g > 128 && b > 128) return 4;  // Cyan
  }
  
  return 15; // Default to white for unknown colors
}

/**
 * Convert pixel data to MSX pattern data
 * For sprites, we use a two-plane system where each pixel needs 2 bits
 * For tiles, we use single-plane 1-bit per pixel
 */
function pixelDataToPattern(pixelData: PixelData, isSprite: boolean = false): number[] {
  const pattern: number[] = [];
  
  if (!pixelData || pixelData.length === 0) {
    // Return empty pattern for missing data
    return new Array(8).fill(0);
  }
  
  if (isSprite) {
    // For sprites: generate two planes (4-color mode)
    const plane1: number[] = [];
    const plane2: number[] = [];
    
    for (let y = 0; y < Math.min(8, pixelData.length); y++) {
      const row = pixelData[y] || [];
      let byte1 = 0; // Plane 1
      let byte2 = 0; // Plane 2
      
      for (let x = 0; x < Math.min(8, row.length); x++) {
        const color = row[x] || '#000000';
        const colorIndex = colorToMSX1Index(color);
        
        // Convert color index to 2-bit value for sprite mode
        let colorValue = 0;
        if (colorIndex === 1) colorValue = 0;      // Transparent (00)
        else if (colorIndex <= 8) colorValue = 1;  // Color set 1 (01)
        else if (colorIndex <= 14) colorValue = 2; // Color set 2 (10)  
        else colorValue = 3;                       // Color set 3 (11)
        
        // Set bits in both planes
        if (colorValue & 1) byte1 |= (1 << (7 - x)); // Bit 0
        if (colorValue & 2) byte2 |= (1 << (7 - x)); // Bit 1
      }
      
      plane1.push(byte1);
      plane2.push(byte2);
    }
    
    // Pad to 8 rows if needed
    while (plane1.length < 8) {
      plane1.push(0);
      plane2.push(0);
    }
    
    // Combine both planes
    return [...plane1, ...plane2];
  } else {
    // For tiles: single plane (2-color mode)
    for (let y = 0; y < Math.min(8, pixelData.length); y++) {
      const row = pixelData[y] || [];
      let byte = 0;
      
      for (let x = 0; x < Math.min(8, row.length); x++) {
        const color = row[x] || '#000000';
        const colorIndex = colorToMSX1Index(color);
        
        // For tiles: any non-transparent color sets the bit
        if (colorIndex !== 1) { // Not transparent
          byte |= (1 << (7 - x));
        }
      }
      
      pattern.push(byte);
    }
    
    // Pad to 8 bytes if needed
    while (pattern.length < 8) {
      pattern.push(0);
    }
    
    return pattern;
  }
}

/**
 * Generate Z80 assembly code for tile data
 */
export function generateTileAssembly(tiles: Tile[], options: CodeGenerationOptions = DEFAULT_CODE_OPTIONS): string {
  let code = '';
  
  if (options.includeComments) {
    code += '; ==================================================\n';
    code += '; TILE DATA SECTION\n';
    code += `; Generated for ${tiles.length} tile(s)\n`;
    code += '; ==================================================\n\n';
  }
  
  // Generate pattern data
  code += 'TILE_PATTERNS:\n';
  tiles.forEach((tile, index) => {
    if (options.includeComments) {
      code += `    ; Tile: ${tile.name} (${tile.width}x${tile.height})\n`;
    }
    
    const pattern = pixelDataToPattern(tile.data, false); // Tiles use single plane
    code += `TILE_${index.toString().padStart(3, '0')}:\n`;
    
    pattern.forEach((byte, byteIndex) => {
      if (byteIndex % 8 === 0) code += '    DB ';
      
      switch (options.dataFormat) {
        case 'hex':
          code += `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
          break;
        case 'binary':
          code += `%${byte.toString(2).padStart(8, '0')}`;
          break;
        case 'decimal':
          code += byte.toString();
          break;
      }
      
      if ((byteIndex + 1) % 8 === 0 || byteIndex === pattern.length - 1) {
        code += '\n';
      } else {
        code += ', ';
      }
    });
    code += '\n';
  });
  
  // Generate color attribute data if available
  const tilesWithColors = tiles.filter(t => t.lineAttributes);
  if (tilesWithColors.length > 0) {
    code += '\nTILE_COLORS:\n';
    tilesWithColors.forEach((tile, index) => {
      if (tile.lineAttributes) {
        if (options.includeComments) {
          code += `    ; Colors for tile: ${tile.name}\n`;
        }
        
        code += `TILE_COLOR_${index.toString().padStart(3, '0')}:\n`;
        tile.lineAttributes.forEach((line, lineIndex) => {
          line.forEach((attr, attrIndex) => {
            const fgIndex = colorToMSX1Index(attr.fg);
            const bgIndex = colorToMSX1Index(attr.bg);
            const colorByte = (fgIndex << 4) | bgIndex;
            
            if (attrIndex === 0) code += '    DB ';
            code += `#${colorByte.toString(16).toUpperCase().padStart(2, '0')}`;
            if (attrIndex < line.length - 1) code += ', ';
          });
          code += '\n';
        });
        code += '\n';
      }
    });
  }
  
  return code;
}

/**
 * Generate Z80 assembly code for sprite data
 */
export function generateSpriteAssembly(sprites: Sprite[], options: CodeGenerationOptions = DEFAULT_CODE_OPTIONS): string {
  let code = '';
  
  if (options.includeComments) {
    code += '; ==================================================\n';
    code += '; SPRITE DATA SECTION\n';
    code += `; Generated for ${sprites.length} sprite(s)\n`;
    code += '; ==================================================\n\n';
  }
  
  sprites.forEach((sprite, spriteIndex) => {
    if (options.includeComments) {
      code += `; Sprite: ${sprite.name} (${sprite.size.width}x${sprite.size.height})\n`;
      code += `; Frames: ${sprite.frames.length}\n\n`;
    }
    
    code += `SPRITE_${spriteIndex.toString().padStart(3, '0')}_PATTERNS:\n`;
    
    sprite.frames.forEach((frame, frameIndex) => {
      if (options.includeComments) {
        code += `    ; Frame ${frameIndex}\n`;
      }
      
      // Debug sprite data (only in development)
      debugSpriteData(frame.data, `${sprite.name} Frame ${frameIndex}`);
      
      const pattern = pixelDataToPattern(frame.data, true); // Sprites use two planes
      code += `SPRITE_${spriteIndex.toString().padStart(3, '0')}_FRAME_${frameIndex}:\n`;
      
      // Add comments for sprite planes
      if (options.includeComments && pattern.length === 16) {
        code += '    ; Plane 1 (8 bytes)\n';
      }
      
      pattern.forEach((byte, byteIndex) => {
        if (byteIndex % 8 === 0) {
          code += '    DB ';
          // Add plane 2 comment for sprites
          if (options.includeComments && byteIndex === 8 && pattern.length === 16) {
            code = code.slice(0, -7) + '    ; Plane 2 (8 bytes)\n    DB ';
          }
        }
        
        switch (options.dataFormat) {
          case 'hex':
            code += `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
            break;
          case 'binary':
            code += `%${byte.toString(2).padStart(8, '0')}`;
            break;
          case 'decimal':
            code += byte.toString();
            break;
        }
        
        if ((byteIndex + 1) % 8 === 0 || byteIndex === pattern.length - 1) {
          code += '\n';
        } else {
          code += ', ';
        }
      });
      code += '\n';
    });
    
    // Generate sprite color data
    if (options.includeComments) {
      code += `    ; Sprite ${sprite.name} color palette\n`;
    }
    code += `SPRITE_${spriteIndex.toString().padStart(3, '0')}_COLORS:\n`;
    code += '    DB ';
    sprite.spritePalette.forEach((color, colorIndex) => {
      const colorIndex1 = colorToMSX1Index(color);
      code += `#${colorIndex1.toString(16).toUpperCase().padStart(2, '0')}`;
      if (colorIndex < sprite.spritePalette.length - 1) code += ', ';
    });
    code += '\n\n';
  });
  
  return code;
}

/**
 * Generate Z80 assembly code for screen map layout
 */
export function generateScreenMapAssembly(screenMap: ScreenMap, tiles: Tile[], options: CodeGenerationOptions = DEFAULT_CODE_OPTIONS): string {
  let code = '';
  
  if (options.includeComments) {
    code += '; ==================================================\n';
    code += `; SCREEN MAP: ${screenMap.name}\n`;
    code += `; Size: ${screenMap.width}x${screenMap.height}\n`;
    code += '; ==================================================\n\n';
  }
  
  // Generate background layer
  code += `${screenMap.name.toUpperCase()}_BACKGROUND:\n`;
  const bgLayer = screenMap.layers.background;
  
  let dataCounter = 0;
  for (let y = 0; y < screenMap.height; y++) {
    for (let x = 0; x < screenMap.width; x++) {
      if (dataCounter % 16 === 0) {
        code += '    DB ';
      }
      
      const tile = bgLayer[y] && bgLayer[y][x] ? bgLayer[y][x] : null;
      const tileIndex = tile?.tileId ? tiles.findIndex(t => t.id === tile.tileId) : 0;
      
      switch (options.dataFormat) {
        case 'hex':
          code += `#${tileIndex.toString(16).toUpperCase().padStart(2, '0')}`;
          break;
        case 'binary':
          code += `%${tileIndex.toString(2).padStart(8, '0')}`;
          break;
        case 'decimal':
          code += tileIndex.toString();
          break;
      }
      
      dataCounter++;
      if (dataCounter % 16 === 0 || (x === screenMap.width - 1 && y === screenMap.height - 1)) {
        code += '\n';
      } else {
        code += ', ';
      }
    }
  }
  code += '\n';
  
  // Generate collision layer
  code += `${screenMap.name.toUpperCase()}_COLLISION:\n`;
  const collisionLayer = screenMap.layers.collision;
  
  dataCounter = 0;
  for (let y = 0; y < screenMap.height; y++) {
    for (let x = 0; x < screenMap.width; x++) {
      if (dataCounter % 16 === 0) {
        code += '    DB ';
      }
      
      const tile = collisionLayer[y] && collisionLayer[y][x] ? collisionLayer[y][x] : null;
      const tileIndex = tile?.tileId ? tiles.findIndex(t => t.id === tile.tileId) : 0;
      
      switch (options.dataFormat) {
        case 'hex':
          code += `#${tileIndex.toString(16).toUpperCase().padStart(2, '0')}`;
          break;
        case 'binary':
          code += `%${tileIndex.toString(2).padStart(8, '0')}`;
          break;
        case 'decimal':
          code += tileIndex.toString();
          break;
      }
      
      dataCounter++;
      if (dataCounter % 16 === 0 || (x === screenMap.width - 1 && y === screenMap.height - 1)) {
        code += '\n';
      } else {
        code += ', ';
      }
    }
  }
  code += '\n';
  
  return code;
}

/**
 * Generate entity initialization code
 */
export function generateEntityAssembly(entities: EntityInstance[], components: ComponentDefinition[], templates: EntityTemplate[], options: CodeGenerationOptions = DEFAULT_CODE_OPTIONS): string {
  let code = '';
  
  if (options.includeComments) {
    code += '; ==================================================\n';
    code += `; ENTITY INITIALIZATION CODE\n`;
    code += `; Total entities: ${entities.length}\n`;
    code += '; ==================================================\n\n';
  }
  
  code += 'INIT_ENTITIES:\n';
  
  entities.forEach((entity, index) => {
    const template = templates.find(t => t.id === entity.entityTemplateId);
    if (!template) return;
    
    if (options.includeComments) {
      code += `    ; Entity: ${entity.name} (Template: ${template.name})\n`;
      code += `    ; Position: (${entity.position.x}, ${entity.position.y})\n`;
    }
    
    code += `    ; Initialize entity ${index}\n`;
    code += `    LD HL, ENTITY_${index.toString().padStart(3, '0')}_DATA\n`;
    code += `    LD DE, ENTITY_BUFFER + ${index * 16}\n`;
    code += `    LD BC, 16\n`;
    code += `    LDIR\n`;
    code += '\n';
  });
  
  code += '    RET\n\n';
  
  // Generate entity data tables
  code += '; Entity data tables\n';
  entities.forEach((entity, index) => {
    const template = templates.find(t => t.id === entity.entityTemplateId);
    if (!template) return;
    
    code += `ENTITY_${index.toString().padStart(3, '0')}_DATA:\n`;
    code += `    DB ${entity.position.x}, ${entity.position.y} ; Position\n`;
    code += `    DB ${template.components.length} ; Component count\n`;
    
    // Add component data
    template.components.forEach((comp, compIndex) => {
      const compDef = components.find(c => c.id === comp.definitionId);
      if (compDef) {
        code += `    DB ${compIndex} ; Component ${compDef.name}\n`;
      }
    });
    
    code += '\n';
  });
  
  return code;
}

/**
 * Generate complete MSX game assembly code from project assets
 */
export function generateCompleteGameAssembly(assets: ProjectAsset[], options: CodeGenerationOptions = DEFAULT_CODE_OPTIONS): string {
  const tiles = assets.filter(a => a.type === 'tile').map(a => a.data as Tile);
  const sprites = assets.filter(a => a.type === 'sprite').map(a => a.data as Sprite);
  const screenMaps = assets.filter(a => a.type === 'screenmap').map(a => a.data as ScreenMap);
  const components = assets.filter(a => a.type === 'componentdefinition').map(a => a.data as ComponentDefinition);
  const templates = assets.filter(a => a.type === 'entitytemplate').map(a => a.data as EntityTemplate);
  
  let code = '';
  
  // Header
  if (options.includeComments) {
    code += '; ==================================================\n';
    code += '; MSX GAME - GENERATED ASSEMBLY CODE\n';
    code += `; Generated on: ${new Date().toISOString()}\n`;
    code += `; Target: ${options.msxModel}\n`;
    code += '; ==================================================\n\n';
  }
  
  // Memory organization
  code += `    ORG #${(options.baseAddress || 0x8000).toString(16).toUpperCase()}\n\n`;
  
  // Main program structure
  code += 'MAIN_PROGRAM:\n';
  code += '    ; Initialize MSX\n';
  code += '    CALL INIT_MSX\n';
  code += '    CALL LOAD_GRAPHICS\n';
  code += '    CALL INIT_ENTITIES\n';
  code += '    \n';
  code += 'MAIN_LOOP:\n';
  code += '    CALL UPDATE_GAME\n';
  code += '    CALL RENDER_FRAME\n';
  code += '    JP MAIN_LOOP\n\n';
  
  // Generate data sections
  if (tiles.length > 0) {
    code += generateTileAssembly(tiles, options);
  }
  
  if (sprites.length > 0) {
    code += generateSpriteAssembly(sprites, options);
  }
  
  if (screenMaps.length > 0) {
    screenMaps.forEach(screenMap => {
      code += generateScreenMapAssembly(screenMap, tiles, options);
    });
  }
  
  // Generate entity code for the first screen map with entities
  const mainScreen = screenMaps.find(s => s.layers.entities.length > 0);
  if (mainScreen && templates.length > 0 && components.length > 0) {
    code += generateEntityAssembly(mainScreen.layers.entities, components, templates, options);
  }
  
  // Add basic MSX initialization routines
  code += '; ==================================================\n';
  code += '; MSX SYSTEM ROUTINES\n';
  code += '; ==================================================\n\n';
  
  code += 'INIT_MSX:\n';
  code += '    ; Set screen mode 2\n';
  code += '    LD A, 2\n';
  code += '    CALL #005F ; CHGMOD\n';
  code += '    RET\n\n';
  
  code += 'LOAD_GRAPHICS:\n';
  code += '    ; Load tile patterns to VRAM\n';
  if (tiles.length > 0) {
    code += '    LD HL, TILE_PATTERNS\n';
    code += '    LD DE, #0000 ; Pattern table address\n';
    code += `    LD BC, ${tiles.length * 8}\n`;
    code += '    CALL LDIRVM\n';
  }
  code += '    RET\n\n';
  
  code += 'UPDATE_GAME:\n';
  code += '    ; Game logic here\n';
  code += '    RET\n\n';
  
  code += 'RENDER_FRAME:\n';
  code += '    ; Rendering code here\n';
  code += '    RET\n\n';
  
  return code;
}

/**
 * Generate state machine assembly code for a project
 */
export function generateStateMachineAssembly(
  projectName: string,
  assets: ProjectAsset[], 
  options: CodeGenerationOptions = DEFAULT_CODE_OPTIONS
): string {
  // Analyze project to determine optimal state machine configuration
  const config = analyzeProjectForStateMachine(assets);
  
  // Override with user configuration if provided
  const finalConfig = options.stateMachineConfig ? 
    { ...config, ...options.stateMachineConfig } : 
    config;
    
  return generateProjectStateMachine(projectName, assets, finalConfig, options);
}

/**
 * Generate complete game assembly with optional state machine integration
 */
export function generateCompleteGameWithStateMachine(
  projectName: string,
  assets: ProjectAsset[], 
  options: CodeGenerationOptions = DEFAULT_CODE_OPTIONS
): string {
  let code = '';
  
  // Generate main game code
  const mainCode = generateCompleteGameAssembly(assets, options);
  
  // Add state machine if requested
  if (options.includeStateMachine) {
    const stateMachineCode = generateStateMachineAssembly(projectName, assets, options);
    
    if (options.includeComments) {
      code += '; ==================================================\n';
      code += '; PROJECT WITH INTEGRATED STATE MACHINE\n';
      code += `; Project: ${projectName}\n`;
      code += `; Generated: ${new Date().toISOString()}\n`;
      code += '; ==================================================\n\n';
    }
    
    // Include state machine first
    code += stateMachineCode;
    code += '\n';
    
    // Then add the main game code
    code += '; ==================================================\n';
    code += '; MAIN GAME CODE\n';
    code += '; ==================================================\n\n';
    code += mainCode;
    
    // Add integration code
    code += '\n';
    code += '; ==================================================\n';
    code += '; INTEGRATION CODE\n';
    code += '; ==================================================\n\n';
    
    code += 'MAIN_PROGRAM:\n';
    code += '    ; Initialize MSX system\n';
    code += '    CALL INIT_MSX\n';
    code += '    \n';
    code += '    ; Initialize state machine\n';
    code += '    CALL INIT_STATE_MACHINE\n';
    code += '    \n';
    code += '    ; Load graphics data\n';
    code += '    CALL LOAD_GRAPHICS\n';
    code += '    \n';
    code += '    ; Main loop - state machine handles everything\n';
    code += 'MAIN_LOOP:\n';
    code += '    HALT                ; Wait for V-Blank\n';
    code += '    JP MAIN_LOOP        ; Loop forever\n\n';
    
    return code;
  } else {
    return mainCode;
  }
}

/**
 * Create a project-specific copy of state machine code
 */
export function createProjectStateMachineCopy(
  projectName: string,
  assets: ProjectAsset[],
  options: CodeGenerationOptions = DEFAULT_CODE_OPTIONS
): { filename: string; content: string; config: StateMachineConfig } {
  // Analyze project for optimal configuration
  const config = analyzeProjectForStateMachine(assets);
  
  // Generate the state machine code
  const content = generateProjectStateMachine(projectName, assets, config, options);
  
  // Create a filename based on project name
  const sanitizedProjectName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${sanitizedProjectName}_state_machine.asm`;
  
  return {
    filename,
    content,
    config
  };
}
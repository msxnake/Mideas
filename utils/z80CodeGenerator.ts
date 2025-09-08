/**
 * @fileoverview Z80 Assembly Code Generator for MSX assets
 * Generates Z80 assembly code from project assets (tiles, sprites, screen maps, etc.)
 */

import { 
  Tile, Sprite, ScreenMap, ProjectAsset, TileBank, 
  MSXColorValue, MSX1ColorValue, PixelData, LineColorAttribute,
  EntityInstance, ComponentDefinition, EntityTemplate
} from '../types';

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
}

/**
 * Default code generation options
 */
export const DEFAULT_CODE_OPTIONS: CodeGenerationOptions = {
  dataFormat: 'hex',
  includeComments: true,
  baseAddress: 0x8000,
  optimize: true,
  msxModel: 'MSX1'
};

/**
 * Convert MSX color value to palette index for MSX1
 */
function colorToMSX1Index(color: MSXColorValue): number {
  const colorMap: Record<string, number> = {
    '#000000': 1,  // Black
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
    '#FFC000': 7,  // Orange
    '#00FFFF': 4,  // Cyan
  };
  return colorMap[color.toUpperCase()] || 15; // Default to white
}

/**
 * Convert pixel data to MSX pattern data
 */
function pixelDataToPattern(pixelData: PixelData): number[] {
  const pattern: number[] = [];
  
  for (let y = 0; y < pixelData.length; y++) {
    let byte = 0;
    for (let x = 0; x < Math.min(8, pixelData[y].length); x++) {
      if (colorToMSX1Index(pixelData[y][x]) !== 1) { // Not black (transparent)
        byte |= (1 << (7 - x));
      }
    }
    pattern.push(byte);
  }
  
  return pattern;
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
    
    const pattern = pixelDataToPattern(tile.data);
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
      
      const pattern = pixelDataToPattern(frame.data);
      code += `SPRITE_${spriteIndex.toString().padStart(3, '0')}_FRAME_${frameIndex}:\n`;
      
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
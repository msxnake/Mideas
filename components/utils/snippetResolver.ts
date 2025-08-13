
import { ProjectAsset, TileBank, Tile, ScreenMap } from '../../types';

interface ProjectState {
    assets: ProjectAsset[];
    tileBanks: TileBank[];
}

// NOTE: This value is also in constants.ts. Ideally, it should be imported,
// but to keep this utility self-contained and avoid potential circular dependencies,
// it's defined locally here.
const EDITOR_BASE_TILE_DIM_S2 = 8;

/**
 * Sanitizes a string to be a valid Z80 assembly label.
 * @param name The string to sanitize.
 * @returns An uppercase string with invalid characters replaced by underscores.
 */
const toAsmLabel = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
};

/**
 * Resolves a single placeholder of the format 'type.name.property'.
 * @param type The asset type (e.g., 'tile', 'bank').
 * @param nameOrId The name or ID of the asset.
 * @param prop The property to retrieve (e.g., 'char_code', 'vram_pattern_start').
 * @param state The current project state containing assets and banks.
 * @returns The resolved value as a string, or an error comment string.
 */
const resolveSimplePlaceholder = (type: string, nameOrId: string, prop: string, state: ProjectState): string | null => {
    nameOrId = nameOrId.replace(/\s+/g, '_'); // Normalize name from snippet
    switch (type.toLowerCase()) {
        case 'tile':
            const tileAsset = state.assets.find(a => a.type === 'tile' && (a.id === nameOrId || a.name.replace(/\s+/g, '_') === nameOrId));
            if (!tileAsset) return `;; ERROR: Tile '${nameOrId}' not found.`;
            
            const tile = tileAsset.data as Tile;
            switch(prop.toLowerCase()) {
                case 'name': return tile.name;
                case 'width': return String(tile.width);
                case 'height': return String(tile.height);
                case 'char_code':
                    // Find which bank this tile is in to get the char code
                    for (const bank of state.tileBanks) {
                        if ((bank.enabled ?? true) && bank.assignedTiles[tile.id]) {
                            return String(bank.assignedTiles[tile.id].charCode);
                        }
                    }
                    return `;; ERROR: Tile '${nameOrId}' not assigned to any enabled bank.`;
                default: return `;; ERROR: Unknown property '${prop}' for tile.`;
            }

        case 'bank':
            const bank = state.tileBanks.find(b => b.id === nameOrId || b.name.replace(/\s+/g, '_') === nameOrId);
            if (!bank) return `;; ERROR: Bank '${nameOrId}' not found.`;
            switch(prop.toLowerCase()) {
                case 'name': return bank.name;
                case 'vram_pattern_start': return String(bank.vramPatternStart);
                case 'vram_color_start': return String(bank.vramColorStart);
                case 'charset_start': return String(bank.charsetRangeStart);
                case 'charset_end': return String(bank.charsetRangeEnd);
                default: return `;; ERROR: Unknown property '${prop}' for bank.`;
            }
        
        default:
            return `;; ERROR: Unknown asset type '${type}'.`;
    }
};

/**
 * Resolves a macro of the format 'MACRO_NAME(parameter)'.
 * @param macroName The name of the macro (e.g., 'BANK_TILE_DEFINITIONS').
 * @param param The parameter for the macro (e.g., a bank name).
 * @param state The current project state.
 * @returns The expanded assembly code string, or an error comment string.
 */
const resolveMacro = (macroName: string, param: string, state: ProjectState): string => {
    param = param.replace(/\s+/g, '_'); // Normalize param name
    switch (macroName.toUpperCase()) {
        case 'BANK_TILE_DEFINITIONS':
            const bank = state.tileBanks.find(b => b.id === param || b.name.replace(/\s+/g, '_') === param);
            if (!bank) return `;; ERROR: Bank '${param}' for macro not found.`;

            let asmOutput = `;; EQUates for tiles in bank: ${bank.name}\n`;
            Object.entries(bank.assignedTiles).forEach(([tileId, assignment]) => {
                const tileAsset = state.assets.find(a => a.id === tileId);
                if (tileAsset) {
                    const tile = tileAsset.data as Tile;
                    const tileLabel = toAsmLabel(tile.name);
                    const baseCharCode = assignment.charCode;
                    
                    const widthInChars = Math.ceil(tile.width / EDITOR_BASE_TILE_DIM_S2);
                    const heightInChars = Math.ceil(tile.height / EDITOR_BASE_TILE_DIM_S2);
                    const numChars = widthInChars * heightInChars;

                    if (numChars === 1) {
                        asmOutput += `${tileLabel}_CHAR EQU ${baseCharCode}\n`;
                    } else {
                         asmOutput += `${tileLabel}_BASE_CHAR EQU ${baseCharCode}\n`;
                         for (let y = 0; y < heightInChars; y++) {
                             for (let x = 0; x < widthInChars; x++) {
                                 asmOutput += `${tileLabel}_${y}_${x}_CHAR EQU ${baseCharCode + (y * widthInChars) + x}\n`;
                             }
                         }
                    }
                }
            });
            return asmOutput.trim();

        default:
            return `;; ERROR: Unknown macro '${macroName}'.`;
    }
};

/**
 * Takes a snippet's code and resolves any dynamic placeholders within it.
 * @param code The snippet code containing placeholders.
 * @param state The current project state.
 * @returns The code with all placeholders replaced with their resolved values.
 */
export const resolveSnippetPlaceholders = (code: string, state: ProjectState): string => {
    if (!code) return '';

    // Regex for simple placeholders: {{type.name.property}}
    const placeholderRegex = /\{\{([\w\s-]+)\.([\w\s-]+)\.([\w\s-]+)\}\}/g;
    let resolvedCode = code.replace(placeholderRegex, (match, type, nameOrId, prop) => {
        return resolveSimplePlaceholder(type.trim(), nameOrId.trim(), prop.trim(), state) || match;
    });

    // Regex for macros: {{MACRO_NAME(param)}}
    const macroRegex = /\{\{([\w\s-]+)\(([\w\s-]+)\)\}\}/g;
    resolvedCode = resolvedCode.replace(macroRegex, (match, macroName, param) => {
        return resolveMacro(macroName.trim(), param.trim(), state) || match;
    });

    return resolvedCode;
};

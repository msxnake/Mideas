
import React, { useState, useEffect, useCallback } from 'react';
import { TileBank, Tile, ProjectAsset, MSX1Color, MSX1ColorValue, MSXFontAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { MSX1_PALETTE, MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR, SCREEN2_PIXELS_PER_COLOR_SEGMENT, DEFAULT_TILE_BANKS_CONFIG, DEFAULT_SCREEN_HEIGHT_TILES, DEFAULT_SCREEN_WIDTH_TILES } from '../../constants';
import { PlusCircleIcon, TrashIcon, ListBulletIcon, PencilIcon, ViewfinderCircleIcon } from '../icons/MsxIcons';

interface TileBankEditorProps {
  tileBanks: TileBank[];
  onUpdateBanks: (updatedBanks: TileBank[]) => void;
  allTiles: ProjectAsset[]; // Assets of type 'tile'
  allFonts: ProjectAsset[]; // Assets of type 'font'
  currentScreenMode: string;
}

const VRAM_PATTERN_BASE_MSX2 = 0x0000; // Typical start for Pattern Generator Table
const VRAM_COLOR_BASE_MSX2 = 0x2000;   // Typical start for Color Table
const EDITOR_BASE_TILE_DIM_S2 = 8;


const calculateVramUsage = (bank: TileBank, tileAssets: ProjectAsset[]): { patternBytes: number, colorBytes: number, totalCharsUsedByTiles: number } => {
  const isBankEffectivelyEnabled = bank.enabled ?? true;
  if (!isBankEffectivelyEnabled) return { patternBytes: 0, colorBytes: 0, totalCharsUsedByTiles: 0 };

  let totalCharsUsedByTiles = 0;
  Object.entries(bank.assignedTiles).forEach(([tileId, assignment]) => {
    // Check if this is a font assignment
    if (tileId.startsWith('font_') && (assignment as any).fontCharacters) {
      // Count each individual font character
      totalCharsUsedByTiles += (assignment as any).fontCharacters.length;
    } else {
      // Regular tile assignment
      const tileAsset = tileAssets.find(t => t.id === tileId)?.data as Tile | undefined;
      if (tileAsset) {
        const widthInChars = Math.ceil(tileAsset.width / EDITOR_BASE_TILE_DIM_S2);
        const heightInChars = Math.ceil(tileAsset.height / EDITOR_BASE_TILE_DIM_S2);
        totalCharsUsedByTiles += widthInChars * heightInChars;
      } else {
        // Fallback if tile asset not found, assume 1 char (should ideally not happen)
        totalCharsUsedByTiles += 1;
      }
    }
  });

  // VRAM usage is based on the bank's character range, not just assigned tiles,
  // as the range is reserved irrespective of how many tiles fill it.
  const numCharsInBankRange = bank.charsetRangeEnd - bank.charsetRangeStart + 1;
  const patternBytes = numCharsInBankRange * 8; // 8 bytes per character pattern
  const colorBytes = numCharsInBankRange * 8;   // 8 bytes per character color attributes in Screen 2

  return { patternBytes, colorBytes, totalCharsUsedByTiles };
};

export const TileBankEditor: React.FC<TileBankEditorProps> = ({
  tileBanks: initialTileBanks,
  onUpdateBanks,
  allTiles,
  allFonts,
  currentScreenMode,
}) => {
  const [banks, setBanks] = useState<TileBank[]>(initialTileBanks);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(initialTileBanks.length > 0 ? initialTileBanks[0].id : null);
  const [isAssignTileModalOpen, setIsAssignTileModalOpen] = useState<boolean>(false);
  const [bankToAssignTileTo, setBankToAssignTileTo] = useState<string | null>(null);
  const [isFontAssetModalOpen, setIsFontAssetModalOpen] = useState<boolean>(false);
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [isTilesetPreviewOpen, setIsTilesetPreviewOpen] = useState<boolean>(false);
  const [shouldUpdateParent, setShouldUpdateParent] = useState<boolean>(false);

  // Effect to update parent when banks change (but not during initial load)
  useEffect(() => {
    if (shouldUpdateParent) {
      onUpdateBanks(banks);
      setShouldUpdateParent(false);
    }
  }, [banks, shouldUpdateParent, onUpdateBanks]);

  // Clean up invalid tile assignments
  const cleanupInvalidAssignments = useCallback((banksToClean: TileBank[]) => {
    return banksToClean.map(bank => {
      const cleanedAssignedTiles: { [key: string]: any } = {};

      Object.entries(bank.assignedTiles).forEach(([tileId, assignment]) => {
        // Check if this is a font assignment
        if (tileId.startsWith('font_')) {
          // For font assignments, check if the font asset still exists
          // Extract fontId from pattern: font_fontId_characters_timestamp
          const fontIdMatch = tileId.match(/^font_([^_]+_[^_]+)/);
          if (fontIdMatch) {
            const fontId = fontIdMatch[1];
            const fontExists = allFonts.some(f => f.id === fontId);
            if (fontExists) {
              cleanedAssignedTiles[tileId] = assignment;
            }
          }
        } else {
          // For regular tile assignments, check if the tile asset still exists
          const tileExists = allTiles.some(t => t.id === tileId);
          if (tileExists) {
            cleanedAssignedTiles[tileId] = assignment;
          }
        }
      });

      return {
        ...bank,
        assignedTiles: cleanedAssignedTiles
      };
    });
  }, [allTiles, allFonts]);

  // Update parent with cleaned banks if needed
  useEffect(() => {
    const cleanedBanks = cleanupInvalidAssignments(initialTileBanks);

    // Check if there were changes
    const hasChanges = cleanedBanks.some((cleanedBank, index) =>
      Object.keys(cleanedBank.assignedTiles).length !== Object.keys(initialTileBanks[index]?.assignedTiles || {}).length
    );

    if (hasChanges) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        onUpdateBanks(cleanedBanks);
      }, 0);
    }
  }, [initialTileBanks, cleanupInvalidAssignments, onUpdateBanks]);

  useEffect(() => {
    const cleanedBanks = cleanupInvalidAssignments(initialTileBanks);
    setBanks(cleanedBanks);

    if (!selectedBankId && cleanedBanks.length > 0) {
        setSelectedBankId(cleanedBanks[0].id);
    } else if (selectedBankId && !cleanedBanks.find(b => b.id === selectedBankId) && cleanedBanks.length > 0) {
        setSelectedBankId(cleanedBanks[0].id);
    } else if (cleanedBanks.length === 0) {
        setSelectedBankId(null);
    }
  }, [initialTileBanks, selectedBankId, cleanupInvalidAssignments]);

  const handleBankPropertyChange = (bankId: string, property: keyof TileBank | `screenZone.${keyof TileBank['screenZone']}`, value: any) => {
    setBanks(prevBanks => {
      let newBanks = prevBanks.map(bank => {
        if (bank.id === bankId) {
          const updatedBank = { ...bank };
          if (property.startsWith('screenZone.')) {
            const zoneKey = property.split('.')[1] as keyof TileBank['screenZone'];
            let numVal = parseInt(value,10) || 0;
            // Basic validation for screen zone properties
            if (zoneKey === 'x') numVal = Math.max(0, Math.min(numVal, DEFAULT_SCREEN_WIDTH_TILES - updatedBank.screenZone.width));
            if (zoneKey === 'y') numVal = Math.max(0, Math.min(numVal, DEFAULT_SCREEN_HEIGHT_TILES - updatedBank.screenZone.height));
            if (zoneKey === 'width') numVal = Math.max(1, Math.min(numVal, DEFAULT_SCREEN_WIDTH_TILES - updatedBank.screenZone.x));
            if (zoneKey === 'height') numVal = Math.max(1, Math.min(numVal, DEFAULT_SCREEN_HEIGHT_TILES - updatedBank.screenZone.y));
            updatedBank.screenZone = { ...bank.screenZone, [zoneKey]: numVal };
          } else if (property === 'charsetRangeStart' || property === 'charsetRangeEnd' || property === 'vramPatternStart' || property === 'vramColorStart' || property === 'defaultFgColorIndex' || property === 'defaultBgColorIndex') {
            (updatedBank as any)[property] = parseInt(value, 10) || 0;
          } else if (property === 'isLocked' || property === 'enabled') {
             (updatedBank as any)[property] = Boolean(value);
          }
           else {
            (updatedBank as any)[property] = value;
          }

          if (property !== 'enabled') { // Range validation for non-enable toggles
            if (property === 'charsetRangeStart' && updatedBank.charsetRangeStart > updatedBank.charsetRangeEnd) {
                updatedBank.charsetRangeEnd = updatedBank.charsetRangeStart;
            }
            if (property === 'charsetRangeEnd' && updatedBank.charsetRangeEnd < updatedBank.charsetRangeStart) {
                updatedBank.charsetRangeStart = updatedBank.charsetRangeEnd;
            }
            updatedBank.charsetRangeStart = Math.max(0, Math.min(255, updatedBank.charsetRangeStart));
            updatedBank.charsetRangeEnd = Math.max(updatedBank.charsetRangeStart, Math.min(255, updatedBank.charsetRangeEnd));
          }
          
          updatedBank.vramPatternStart = Math.max(0, updatedBank.vramPatternStart);
          updatedBank.vramColorStart = Math.max(0, updatedBank.vramColorStart);
          
          return updatedBank;
        }
        return bank;
      });

      if (property === 'enabled' && (bankId === 'bank_hud' || bankId === 'bank_status_menu')) {
        const mainGameBankIndex = newBanks.findIndex(b => b.id === 'bank_main_game');
        const hudBank = newBanks.find(b => b.id === 'bank_hud')!; 
        const statusBank = newBanks.find(b => b.id === 'bank_status_menu')!;

        const isHudEffectivelyEnabled = hudBank.enabled ?? true;
        const isStatusEffectivelyEnabled = statusBank.enabled ?? true;

        const defaultHudConf = DEFAULT_TILE_BANKS_CONFIG.find(b => b.id === 'bank_hud')!;
        const defaultMainConf = DEFAULT_TILE_BANKS_CONFIG.find(b => b.id === 'bank_main_game')!;
        const defaultStatusConf = DEFAULT_TILE_BANKS_CONFIG.find(b => b.id === 'bank_status_menu')!;
        
        if (mainGameBankIndex !== -1) {
            const mainGameBank = { ...newBanks[mainGameBankIndex] }; 
            mainGameBank.screenZone = { ...mainGameBank.screenZone }; 

            mainGameBank.charsetRangeStart = isHudEffectivelyEnabled
                ? defaultMainConf.charsetRangeStart
                : defaultHudConf.charsetRangeStart;

            mainGameBank.charsetRangeEnd = isStatusEffectivelyEnabled
                ? defaultMainConf.charsetRangeEnd
                : defaultStatusConf.charsetRangeEnd;

            let newMainGameY = defaultMainConf.screenZone.y;
            let newMainGameHeight = defaultMainConf.screenZone.height;

            if (!isHudEffectivelyEnabled) {
                newMainGameY = defaultHudConf.screenZone.y;
                newMainGameHeight += defaultHudConf.screenZone.height;
            }
            if (!isStatusEffectivelyEnabled) { 
                newMainGameHeight += defaultStatusConf.screenZone.height;
            }

            mainGameBank.screenZone.y = newMainGameY;
            mainGameBank.screenZone.height = newMainGameHeight;
            mainGameBank.screenZone.width = defaultMainConf.screenZone.width;
            mainGameBank.screenZone.x = defaultMainConf.screenZone.x;

            newBanks[mainGameBankIndex] = mainGameBank;
        }
      }

      return newBanks;
    });
    setShouldUpdateParent(true);
  };

  const handleAssignTileToBank = (bankId: string, tileAssetId: string) => {
    setBanks(prevBanks => {
      const newBanks = prevBanks.map(bank => {
        if (bank.id === bankId) {
          if (bank.assignedTiles[tileAssetId]) {
            alert(`Tile "${allTiles.find(t=>t.id === tileAssetId)?.name}" is already assigned to this bank.`);
            return bank;
          }

          const tileAsset = allTiles.find(t => t.id === tileAssetId)?.data as Tile | undefined;
          if (!tileAsset) {
            alert(`Tile asset with ID ${tileAssetId} not found.`);
            return bank;
          }

          const widthInChars = Math.ceil(tileAsset.width / EDITOR_BASE_TILE_DIM_S2);
          const heightInChars = Math.ceil(tileAsset.height / EDITOR_BASE_TILE_DIM_S2);
          const numCodesNeeded = widthInChars * heightInChars;

          if (numCodesNeeded === 0) {
            alert(`Tile "${tileAsset.name}" has zero dimensions in characters. Cannot assign.`);
            return bank;
          }

          const usedCharCodesInBank = new Set<number>();
          Object.entries(bank.assignedTiles).forEach(([assignedTileId, assignment]) => {
            const assignedAsset = allTiles.find(t => t.id === assignedTileId)?.data as Tile | undefined;
            if (assignedAsset) {
              const w = Math.ceil(assignedAsset.width / EDITOR_BASE_TILE_DIM_S2);
              const h = Math.ceil(assignedAsset.height / EDITOR_BASE_TILE_DIM_S2);
              for (let i = 0; i < w * h; i++) {
                usedCharCodesInBank.add(assignment.charCode + i);
              }
            } else { // Fallback for potentially inconsistent data
               usedCharCodesInBank.add(assignment.charCode);
            }
          });

          let foundBaseCharCode = -1;
          for (let charCodeAttempt = bank.charsetRangeStart; charCodeAttempt <= bank.charsetRangeEnd - numCodesNeeded + 1; charCodeAttempt++) {
            let blockAvailable = true;
            for (let k = 0; k < numCodesNeeded; k++) {
              if (usedCharCodesInBank.has(charCodeAttempt + k)) {
                blockAvailable = false;
                break;
              }
            }
            if (blockAvailable) {
              foundBaseCharCode = charCodeAttempt;
              break;
            }
          }

          if (foundBaseCharCode === -1) {
            alert(`Bank "${bank.name}" has no contiguous block of ${numCodesNeeded} free character codes in range [${bank.charsetRangeStart}-${bank.charsetRangeEnd}].`);
            return bank;
          }

          const updatedBank = { ...bank, assignedTiles: { ...bank.assignedTiles, [tileAssetId]: { charCode: foundBaseCharCode } } };
          return updatedBank;
        }
        return bank;
      });
      return newBanks;
    });
    setShouldUpdateParent(true);
    setIsAssignTileModalOpen(false);
  };

  const handleRemoveTileFromBank = (bankId: string, tileAssetId: string) => {
    setBanks(prevBanks => {
        const newBanks = prevBanks.map(bank => {
            if (bank.id === bankId) {
                const newAssignedTiles = { ...bank.assignedTiles };
                delete newAssignedTiles[tileAssetId];
                return { ...bank, assignedTiles: newAssignedTiles };
            }
            return bank;
        });
        return newBanks;
    });
    setShouldUpdateParent(true);
  };

  const renderCharacterGraphics = (charCode: number): JSX.Element => {
    // Check if this character is assigned to a tile or font
    let assignedTileData: PixelData | null = null;
    let assignedFontPattern: number[] | null = null;
    let hasAssignment = false;

    banks.forEach(bank => {
      if (charCode >= bank.charsetRangeStart && charCode <= bank.charsetRangeEnd) {
        Object.entries(bank.assignedTiles).forEach(([tileId, assignment]) => {
          if (tileId.startsWith('font_') && (assignment as any).fontCharacters) {
            // Font character assignment
            const fontChars = (assignment as any).fontCharacters;
            const fontChar = fontChars.find((fc: any) => fc.bankCharCode === charCode);
            if (fontChar) {
              const fontAsset = allFonts.find(f => tileId.includes(f.id));
              if (fontAsset) {
                const fontData = (fontAsset.data as MSXFontAsset).fontData;
                // Use the actual ASCII code of the character (A=65, B=66, etc.)
                const actualCharCode = fontChar.character.charCodeAt(0);
                const pattern = fontData[actualCharCode];
                if (pattern && pattern.length === 8) {
                  assignedFontPattern = pattern;
                  hasAssignment = true;
                }
              }
            }
          } else {
            // Regular tile assignment
            const tileAsset = allTiles.find(t => t.id === tileId)?.data as Tile | undefined;
            if (tileAsset) {
              const widthInChars = Math.ceil(tileAsset.width / EDITOR_BASE_TILE_DIM_S2);
              const heightInChars = Math.ceil(tileAsset.height / EDITOR_BASE_TILE_DIM_S2);
              const totalChars = widthInChars * heightInChars;
              if (charCode >= assignment.charCode && charCode < assignment.charCode + totalChars) {
                const charIndex = charCode - assignment.charCode;
                const charX = charIndex % widthInChars;
                const charY = Math.floor(charIndex / widthInChars);

                // Extract 8x8 section from tile
                const startX = charX * 8;
                const startY = charY * 8;
                const char8x8: PixelData = [];

                for (let y = 0; y < 8; y++) {
                  const row: string[] = [];
                  for (let x = 0; x < 8; x++) {
                    const pixelX = startX + x;
                    const pixelY = startY + y;
                    if (pixelY < tileAsset.data.length && pixelX < tileAsset.data[pixelY].length) {
                      row.push(tileAsset.data[pixelY][pixelX]);
                    } else {
                      row.push('#000000');
                    }
                  }
                  char8x8.push(row);
                }
                assignedTileData = char8x8;
                hasAssignment = true;
              }
            }
          }
        });
      }
    });

    // Create the 8x8 pixel grid
    if (assignedFontPattern) {
      // Get font colors from MSX font color attributes or use MSX-like defaults
      let colorAttrs: any = null;

      // Try to get colors from font color attributes if available
      banks.forEach(bank => {
        if (charCode >= bank.charsetRangeStart && charCode <= bank.charsetRangeEnd) {
          Object.entries(bank.assignedTiles).forEach(([tileId, assignment]) => {
            if (tileId.startsWith('font_') && (assignment as any).fontCharacters) {
              const fontChar = (assignment as any).fontCharacters.find((fc: any) => fc.bankCharCode === charCode);
              if (fontChar) {
                const fontAsset = allFonts.find(f => tileId.includes(f.id));
                if (fontAsset && (fontAsset.data as MSXFontAsset).fontColorAttributes) {
                  const actualCharCode = fontChar.character.charCodeAt(0);
                  colorAttrs = (fontAsset.data as MSXFontAsset).fontColorAttributes[actualCharCode];
                }
              }
            }
          });
        }
      });

      // Render font pattern (8 bytes, each bit is a pixel) with per-row colors
      return (
        <div
          style={{
            width: '24px',
            height: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            border: '1px solid #666'
          }}
        >
          {assignedFontPattern.map((byte, rowIndex) =>
            Array.from({length: 8}, (_, colIndex) => {
              const isPixelOn = (byte & (1 << (7 - colIndex))) !== 0;

              // Get colors for this specific row, with fallbacks
              let fgColor = '#5555FF'; // MSX Blue default
              let bgColor = '#AAAAAA'; // MSX Light Gray default

              if (colorAttrs && colorAttrs[rowIndex]) {
                fgColor = colorAttrs[rowIndex].fg || fgColor;
                bgColor = colorAttrs[rowIndex].bg || bgColor;
              }

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    backgroundColor: isPixelOn ? fgColor : bgColor,
                    width: '100%',
                    height: '100%'
                  }}
                />
              );
            })
          ).flat()}
        </div>
      );
    } else if (assignedTileData && assignedTileData.length === 8) {
      // Render tile pixel data
      return (
        <div
          style={{
            width: '24px',
            height: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            border: '1px solid #666'
          }}
        >
          {assignedTileData.map((row, rowIndex) =>
            row.map((color, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  backgroundColor: color,
                  width: '100%',
                  height: '100%'
                }}
              />
            ))
          ).flat()}
        </div>
      );
    } else {
      // Empty character - show hex code
      return (
        <div
          className="border border-gray-400 bg-black flex items-center justify-center"
          style={{ width: '24px', height: '24px' }}
        >
          <span className="text-white text-[6px] font-mono">
            {charCode.toString(16).padStart(2, '0').toUpperCase()}
          </span>
        </div>
      );
    }
  };

  const handleAssignFontCharactersToBank = (bankId: string, fontId: string, characters: string[]) => {
    setBanks(prevBanks => {
        const newBanks = prevBanks.map(bank => {
            if (bank.id === bankId) {
                const fontAsset = allFonts.find(f => f.id === fontId);
                if (!fontAsset) {
                    alert(`Font asset with ID ${fontId} not found.`);
                    return bank;
                }

                // Validate font color attributes for MSX1 compatibility
                const fontData = fontAsset.data as MSXFontAsset;
                const invalidColorWarnings: string[] = [];

                if (fontData.fontColorAttributes) {
                    characters.forEach(char => {
                        const charCode = char.charCodeAt(0);
                        const colorAttrs = fontData.fontColorAttributes[charCode];
                        if (colorAttrs) {
                            colorAttrs.forEach((rowColor, rowIndex) => {
                                const fgColorValid = MSX1_PALETTE.some(c => c.hex === rowColor.fg);
                                const bgColorValid = MSX1_PALETTE.some(c => c.hex === rowColor.bg);

                                if (!fgColorValid) {
                                    invalidColorWarnings.push(`Character '${char}' row ${rowIndex}: invalid fg color ${rowColor.fg}`);
                                }
                                if (!bgColorValid) {
                                    invalidColorWarnings.push(`Character '${char}' row ${rowIndex}: invalid bg color ${rowColor.bg}`);
                                }
                            });
                        }
                    });
                }

                if (invalidColorWarnings.length > 0) {
                    const shouldContinue = confirm(
                        `Warning: Some font colors are not valid MSX1 colors:\n${invalidColorWarnings.slice(0, 5).join('\n')}${invalidColorWarnings.length > 5 ? '\n...' : ''}\n\nContinue anyway?`
                    );
                    if (!shouldContinue) {
                        return bank;
                    }
                }

                // Map each character to its exact ASCII position
                const fontCharMapping: any[] = [];
                const conflictingCharacters: string[] = [];

                characters.forEach(char => {
                    const asciiCode = char.charCodeAt(0); // A=65, B=66, etc.

                    // Check if this ASCII position falls within the bank range
                    if (asciiCode >= bank.charsetRangeStart && asciiCode <= bank.charsetRangeEnd) {
                        // Check if this position is already occupied by a tile
                        let isOccupied = false;
                        Object.entries(bank.assignedTiles).forEach(([tileId, assignment]) => {
                            if (!tileId.startsWith('font_')) {
                                // Check if ASCII position conflicts with tile assignment
                                const tileAsset = allTiles.find(t => t.id === tileId)?.data as Tile | undefined;
                                if (tileAsset) {
                                    const w = Math.ceil(tileAsset.width / EDITOR_BASE_TILE_DIM_S2);
                                    const h = Math.ceil(tileAsset.height / EDITOR_BASE_TILE_DIM_S2);
                                    const totalChars = w * h;
                                    if (asciiCode >= assignment.charCode && asciiCode < assignment.charCode + totalChars) {
                                        isOccupied = true;
                                    }
                                }
                            }
                        });

                        if (isOccupied) {
                            conflictingCharacters.push(char);
                        } else {
                            fontCharMapping.push({
                                character: char,
                                charCode: asciiCode,
                                bankCharCode: asciiCode // Use the exact ASCII position
                            });
                        }
                    }
                });

                if (conflictingCharacters.length > 0) {
                    alert(`Characters ${conflictingCharacters.join(', ')} conflict with existing tile assignments in bank "${bank.name}".`);
                }

                if (fontCharMapping.length === 0) {
                    alert(`No characters from ${characters.join('')} can be placed in bank range ${bank.charsetRangeStart}-${bank.charsetRangeEnd}`);
                    return bank;
                }

                // Create a virtual tile for this font character assignment
                const fontTileId = `font_${fontId}_${characters.join('')}_${Date.now()}`;

                const updatedBank = {
                    ...bank,
                    assignedTiles: {
                        ...bank.assignedTiles,
                        [fontTileId]: {
                            charCode: 0, // Not used for fonts - each char has its own position
                            fontCharacters: fontCharMapping
                        }
                    }
                };
                return updatedBank;
            }
            return bank;
        });
        return newBanks;
    });
    setShouldUpdateParent(true);
  };
  
  const selectedBankDetails = banks.find(b => b.id === selectedBankId);

  if (currentScreenMode !== "SCREEN 2 (Graphics I)") {
    return (
      <Panel title="Tile Banks Management" icon={<ListBulletIcon />}>
        <p className="p-4 text-msx-textsecondary">Tile Banks are only applicable for MSX SCREEN 2 projects.</p>
      </Panel>
    );
  }
  
  const renderBankControls = (bank: TileBank) => {
    const { patternBytes, colorBytes, totalCharsUsedByTiles } = calculateVramUsage(bank, allTiles);
    const isBankEffectivelyEnabled = bank.enabled ?? true;
    const numCharsInBankRange = isBankEffectivelyEnabled ? (bank.charsetRangeEnd - bank.charsetRangeStart + 1) : 0;
    // totalCharsUsedByTiles is now a better reflection of actual usage by assigned tiles
    // const numAssignedTiles = Object.keys(bank.assignedTiles).length; // This counts assets, not char codes

    const isHudOrStatusBank = bank.id === 'bank_hud' || bank.id === 'bank_status_menu';
    const isMainGameBank = bank.id === 'bank_main_game';


    return (
      <div key={bank.id} className={`p-3 border border-msx-border rounded-md bg-msx-panelbg/70 ${!isBankEffectivelyEnabled && isHudOrStatusBank ? 'opacity-60' : ''}`}>
        <div className="flex justify-between items-center mb-2">
          <input 
            type="text" 
            value={bank.name} 
            onChange={(e) => handleBankPropertyChange(bank.id, 'name', e.target.value)}
            className="pixel-font text-md text-msx-highlight bg-transparent border-b border-msx-highlight/50 focus:border-msx-highlight outline-none"
            disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank)}
          />
           <div className="flex items-center space-x-3">
             {isHudOrStatusBank && (
                <label className="text-xs flex items-center">
                    <input 
                        type="checkbox" 
                        checked={isBankEffectivelyEnabled} 
                        onChange={(e) => handleBankPropertyChange(bank.id, 'enabled', e.target.checked)} 
                        className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent mr-1"
                        disabled={bank.isLocked}
                    />
                    Enabled
                </label>
             )}
             <label className="text-xs flex items-center">
                 <input type="checkbox" checked={bank.isLocked} onChange={(e) => handleBankPropertyChange(bank.id, 'isLocked', e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent mr-1"/>
                 Locked
             </label>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2">
          <div>
            <label>Charset Range: </label>
            <input type="number" value={bank.charsetRangeStart} onChange={(e) => handleBankPropertyChange(bank.id, 'charsetRangeStart', e.target.value)} className="w-12 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank) || isMainGameBank} />
            -
            <input type="number" value={bank.charsetRangeEnd} onChange={(e) => handleBankPropertyChange(bank.id, 'charsetRangeEnd', e.target.value)} className="w-12 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank) || isMainGameBank} />
            <span className="text-msx-textsecondary"> ({numCharsInBankRange} chars total in range)</span>
          </div>
          <div>
            <label>VRAM Pattern Start: </label>
            <input type="text" value={`0x${bank.vramPatternStart.toString(16).toUpperCase()}`} onChange={(e) => handleBankPropertyChange(bank.id, 'vramPatternStart', parseInt(e.target.value,16))} className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank)} />
            <span className="text-msx-textsecondary"> (Size: {patternBytes}B)</span>
          </div>
          <div>
            <label>VRAM Color Start: </label>
            <input type="text" value={`0x${bank.vramColorStart.toString(16).toUpperCase()}`} onChange={(e) => handleBankPropertyChange(bank.id, 'vramColorStart', parseInt(e.target.value,16))} className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank)} />
            <span className="text-msx-textsecondary"> (Size: {colorBytes}B)</span>
          </div>
           <div>
            <label>Screen Zone (X,Y,W,H): </label>
            <input type="number" value={bank.screenZone.x} onChange={(e) => handleBankPropertyChange(bank.id, 'screenZone.x', e.target.value)} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank) || isMainGameBank } />
            <input type="number" value={bank.screenZone.y} onChange={(e) => handleBankPropertyChange(bank.id, 'screenZone.y', e.target.value)} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank) || isMainGameBank } />
            <input type="number" value={bank.screenZone.width} onChange={(e) => handleBankPropertyChange(bank.id, 'screenZone.width', e.target.value)} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank) || isMainGameBank } />
            <input type="number" value={bank.screenZone.height} onChange={(e) => handleBankPropertyChange(bank.id, 'screenZone.height', e.target.value)} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank) || isMainGameBank } />
          </div>
          <div>
            <label>Default Colors (FG/BG Idx): </label>
            <select value={bank.defaultFgColorIndex} onChange={(e) => handleBankPropertyChange(bank.id, 'defaultFgColorIndex', e.target.value)} className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded text-xs" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank)}>
                {MSX1_PALETTE.map(c => <option key={`fg-${c.index}`} value={c.index}>{c.index}: {c.name.split(' ')[0]}</option>)}
            </select>
            /
            <select value={bank.defaultBgColorIndex} onChange={(e) => handleBankPropertyChange(bank.id, 'defaultBgColorIndex', e.target.value)} className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded text-xs" disabled={bank.isLocked || (!isBankEffectivelyEnabled && isHudOrStatusBank)}>
                {MSX1_PALETTE.map(c => <option key={`bg-${c.index}`} value={c.index}>{c.index}: {c.name.split(' ')[0]}</option>)}
            </select>
          </div>
        </div>
        
        <h5 className="text-sm text-msx-cyan mt-3 mb-1">Assigned Tiles ({totalCharsUsedByTiles} / {numCharsInBankRange} char codes used):</h5>
        <div className={`max-h-32 overflow-y-auto bg-msx-bgcolor p-1 rounded border border-msx-border space-y-0.5 ${(!isBankEffectivelyEnabled && isHudOrStatusBank) ? 'opacity-50' : ''}`}>
            {Object.entries(bank.assignedTiles).map(([tileId, assignment]) => {
                // Check if this is a font assignment
                if (tileId.startsWith('font_') && (assignment as any).fontCharacters) {
                    const fontChars = (assignment as any).fontCharacters;
                    const codesUsedByThisFont = `${fontChars.length} chars`;
                    const characterList = fontChars.map((fc: any) => fc.character).join('');

                    // Check if this font has color attributes
                    const fontAsset = allFonts.find(f => tileId.includes(f.id));
                    let hasColorInfo = false;
                    let colorInfo = '';

                    if (fontAsset && (fontAsset.data as MSXFontAsset).fontColorAttributes) {
                        const fontColorAttrs = (fontAsset.data as MSXFontAsset).fontColorAttributes;
                        const hasColors = fontChars.some((fc: any) => {
                            const charCode = fc.character.charCodeAt(0);
                            return fontColorAttrs[charCode] && fontColorAttrs[charCode].length > 0;
                        });

                        if (hasColors) {
                            hasColorInfo = true;
                            colorInfo = '🎨 Per-row colors';
                        }
                    }

                    return (
                        <div key={tileId} className="flex justify-between items-center p-0.5 text-xs hover:bg-msx-border/50 rounded bg-blue-900/20">
                            <div className="flex flex-col">
                                <span>Font: {characterList} (Font Asset)</span>
                                {hasColorInfo && <span className="text-green-400 text-xs italic">{colorInfo}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-msx-textsecondary">ASCII pos: {fontChars.map((fc: any) => fc.bankCharCode).join(',')} - {codesUsedByThisFont}</span>
                                {!bank.isLocked && isBankEffectivelyEnabled &&
                                    <Button onClick={() => handleRemoveTileFromBank(bank.id, tileId)} size="sm" variant="danger" className="!p-0.5" icon={<TrashIcon className="w-2.5 h-2.5"/>}>{null}</Button>}
                            </div>
                        </div>
                    );
                } else {
                    // Regular tile assignment
                    const tileAsset = allTiles.find(t => t.id === tileId)?.data as Tile | undefined;
                    let codesUsedByThisTile = "1 char";
                    if (tileAsset) {
                        const wInChars = Math.ceil(tileAsset.width / EDITOR_BASE_TILE_DIM_S2);
                        const hInChars = Math.ceil(tileAsset.height / EDITOR_BASE_TILE_DIM_S2);
                        const total = wInChars * hInChars;
                        if (total > 1) codesUsedByThisTile = `${total} chars (${wInChars}x${hInChars})`;
                    }
                    return (
                        <div key={tileId} className="flex justify-between items-center p-0.5 text-xs hover:bg-msx-border/50 rounded">
                            <span>{tileAsset?.name || 'Unknown Tile'} (ID: ...{tileId.slice(-4)})</span>
                            <span className="text-msx-textsecondary">Base: {assignment.charCode} (0x{assignment.charCode.toString(16).toUpperCase()}) - {codesUsedByThisTile}</span>
                            {!bank.isLocked && isBankEffectivelyEnabled &&
                                <Button onClick={() => handleRemoveTileFromBank(bank.id, tileId)} size="sm" variant="danger" className="!p-0.5" icon={<TrashIcon className="w-2.5 h-2.5"/>}>{null}</Button>}
                        </div>
                    );
                }
            })}
            {totalCharsUsedByTiles === 0 && <p className="text-xs text-msx-textsecondary italic p-1">No tiles assigned to this bank.</p>}
        </div>
        {!bank.isLocked && isBankEffectivelyEnabled &&
            <div className="flex gap-2 mt-2">
                <Button
                    onClick={() => { setBankToAssignTileTo(bank.id); setIsAssignTileModalOpen(true); }}
                    size="sm" variant="secondary" icon={<PlusCircleIcon />} className="text-xs"
                    disabled={totalCharsUsedByTiles >= numCharsInBankRange}
                >
                    Assign Tile to Bank
                </Button>
                <Button
                    onClick={() => { setBankToAssignTileTo(bank.id); setIsFontAssetModalOpen(true); }}
                    size="sm" variant="secondary" icon={<PencilIcon />} className="text-xs"
                    disabled={totalCharsUsedByTiles >= numCharsInBankRange}
                >
                    Font Asset
                </Button>
            </div>}
        {isBankEffectivelyEnabled && totalCharsUsedByTiles >= numCharsInBankRange && <p className="text-xs text-red-500 mt-1">Bank character code range full or not enough contiguous space.</p>}
        {!isBankEffectivelyEnabled && isHudOrStatusBank && <p className="text-xs text-orange-400 mt-1">This bank is currently disabled. Its character range is allocated to the Main Game Area.</p>}
      </div>
    );
  };

  return (
    <Panel title="Tile Banks Management (SCREEN 2)" icon={<ListBulletIcon />} className="flex-grow flex flex-col p-2 bg-msx-bgcolor overflow-y-auto select-none">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-msx-textsecondary flex-1">
          Define up to 3 independent banks for character tiles. Each bank reserves a range of character codes (0-255) and VRAM for patterns and colors.
          Associate banks with screen zones for organization. Exported screen maps will use character codes from these banks.
          HUD and Status banks can be disabled to give their character codes to the Main Game Area.
        </p>
        <Button
          onClick={() => setIsTilesetPreviewOpen(true)}
          size="sm"
          variant="secondary"
          icon={<ViewfinderCircleIcon />}
          className="ml-2 text-xs whitespace-nowrap"
        >
          Preview Tileset
        </Button>
      </div>
      <div className="space-y-3">
        {banks.map(bank => (
          <React.Fragment key={bank.id}>
            <button 
                onClick={() => setSelectedBankId(bank.id)} 
                className={`w-full text-left p-2 rounded pixel-font text-lg ${selectedBankId === bank.id ? 'bg-msx-accent text-white' : 'bg-msx-panelbg text-msx-highlight hover:bg-msx-border'} ${!(bank.enabled ?? true) && (bank.id === 'bank_hud' || bank.id === 'bank_status_menu') ? 'opacity-70 line-through' : ''}`}
            >
                {bank.name} (Chars: {bank.charsetRangeStart}-{bank.charsetRangeEnd}) {(bank.enabled ?? true) ? '' : '(Disabled)'}
            </button>
            {selectedBankId === bank.id && renderBankControls(bank)}
          </React.Fragment>
        ))}
      </div>
      
      {isAssignTileModalOpen && bankToAssignTileTo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setIsAssignTileModalOpen(false)}>
          <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-md animate-slideIn pixel-font" onClick={e => e.stopPropagation()}>
            <h3 className="text-md text-msx-highlight mb-3">Assign Tile to Bank: {banks.find(b=>b.id===bankToAssignTileTo)?.name}</h3>
            <div className="max-h-60 overflow-y-auto space-y-1">
                {allTiles.filter(asset => asset.type === 'tile' && !(banks.find(b=>b.id===bankToAssignTileTo)?.assignedTiles[asset.id])).map(tileAssetItem => {
                    const tileAsset = tileAssetItem.data as Tile;
                    return (
                        <Button
                            key={tileAssetItem.id}
                            onClick={() => handleAssignTileToBank(bankToAssignTileTo, tileAssetItem.id)}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs"
                        >
                            {tileAssetItem.name} ({tileAsset.width}x{tileAsset.height})
                        </Button>
                    );
                })}
                {allTiles.filter(asset => asset.type === 'tile' && !(banks.find(b=>b.id===bankToAssignTileTo)?.assignedTiles[asset.id])).length === 0 &&
                    <p className="text-xs text-msx-textsecondary p-2">All available tiles are already assigned to this bank or no suitable tiles exist.</p>
                }
            </div>
            <Button onClick={() => setIsAssignTileModalOpen(false)} variant="primary" size="md" className="mt-4">Close</Button>
          </div>
        </div>
      )}

      {isFontAssetModalOpen && bankToAssignTileTo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setIsFontAssetModalOpen(false)}>
          <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-2xl animate-slideIn pixel-font" onClick={e => e.stopPropagation()}>
            <h3 className="text-md text-msx-highlight mb-3">Font Asset for Bank: {banks.find(b=>b.id===bankToAssignTileTo)?.name}</h3>

            <div className="mb-4">
              <label className="block text-sm text-msx-cyan mb-2">Select Font:</label>
              <select
                value={selectedFontId || ''}
                onChange={(e) => setSelectedFontId(e.target.value || null)}
                className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-sm"
              >
                <option value="">Select a font...</option>
                {allFonts.filter(asset => asset.type === 'font').map(fontAsset => (
                  <option key={fontAsset.id} value={fontAsset.id}>
                    {fontAsset.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedFontId && (
              <div className="mb-4">
                <label className="block text-sm text-msx-cyan mb-2">Select Characters (A-Z, 0-9):</label>
                <div className="grid grid-cols-8 gap-1 p-2 bg-msx-bgcolor border border-msx-border rounded max-h-40 overflow-y-auto">
                  {/* A-Z */}
                  {Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i)).map(char => (
                    <button
                      key={char}
                      onClick={() => {
                        setSelectedCharacters(prev =>
                          prev.includes(char)
                            ? prev.filter(c => c !== char)
                            : [...prev, char]
                        );
                      }}
                      className={`p-1 text-xs border rounded ${
                        selectedCharacters.includes(char)
                          ? 'bg-msx-accent text-white border-msx-accent'
                          : 'bg-msx-panelbg border-msx-border hover:bg-msx-border'
                      }`}
                    >
                      {char}
                    </button>
                  ))}
                  {/* 0-9 */}
                  {Array.from({length: 10}, (_, i) => String.fromCharCode(48 + i)).map(char => (
                    <button
                      key={char}
                      onClick={() => {
                        setSelectedCharacters(prev =>
                          prev.includes(char)
                            ? prev.filter(c => c !== char)
                            : [...prev, char]
                        );
                      }}
                      className={`p-1 text-xs border rounded ${
                        selectedCharacters.includes(char)
                          ? 'bg-msx-accent text-white border-msx-accent'
                          : 'bg-msx-panelbg border-msx-border hover:bg-msx-border'
                      }`}
                    >
                      {char}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-msx-textsecondary mt-1">
                  Selected: {selectedCharacters.length} characters
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (selectedFontId && selectedCharacters.length > 0 && bankToAssignTileTo) {
                    handleAssignFontCharactersToBank(bankToAssignTileTo, selectedFontId, selectedCharacters);
                    setIsFontAssetModalOpen(false);
                    setSelectedFontId(null);
                    setSelectedCharacters([]);
                  }
                }}
                variant="primary"
                size="md"
                disabled={!selectedFontId || selectedCharacters.length === 0}
              >
                Assign Characters
              </Button>
              <Button
                onClick={() => {
                  setIsFontAssetModalOpen(false);
                  setSelectedFontId(null);
                  setSelectedCharacters([]);
                }}
                variant="secondary"
                size="md"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {isTilesetPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setIsTilesetPreviewOpen(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-6xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-black">Mapa de Caracteres MSX (256 Characters)</h3>
              <button
                onClick={() => setIsTilesetPreviewOpen(false)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              >
                Cerrar
              </button>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded p-4">
              {/* Complete 256 characters in 16x16 grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(16, 1fr)',
                  gap: '4px'
                }}
              >
                {Array.from({length: 256}, (_, charCode) => (
                  <div key={charCode} style={{ textAlign: 'center' }}>
                    {renderCharacterGraphics(charCode)}
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                      {charCode}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};

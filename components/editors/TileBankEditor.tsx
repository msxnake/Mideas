
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TileBank, TileBankDefinition, Tile, ProjectAsset, MSX1Color, MSX1ColorValue, MSXFontAsset, PixelData } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { MSX1_PALETTE, MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR, SCREEN2_PIXELS_PER_COLOR_SEGMENT, DEFAULT_TILE_BANK_DEFINITIONS, DEFAULT_SCREEN_HEIGHT_TILES, DEFAULT_SCREEN_WIDTH_TILES } from '../../constants';
import { PlusCircleIcon, TrashIcon, ListBulletIcon, PencilIcon, ViewfinderCircleIcon } from '../icons/MsxIcons';
import {
  buildTileCharSignature,
  findAvailableScreen2CharBlock,
  getTileAssignmentCharCodes,
  getTileCharDimensions,
  isAssignableScreen2TileCharCode,
  resolveTileAssignmentCharCode,
  resolveTileAssignmentLabel,
} from '../../utils/tileBankOptimization';

interface TileBankEditorProps {
  tileBank: TileBank;
  onUpdate: (updatedBank: TileBank) => void;
  allTiles: ProjectAsset[]; // Assets of type 'tile'
  allFonts: ProjectAsset[]; // Assets of type 'font'
  currentScreenMode: string;
}

const VRAM_PATTERN_BASE_MSX2 = 0x0000; // Typical start for Pattern Generator Table
const VRAM_COLOR_BASE_MSX2 = 0x2000;   // Typical start for Color Table
const EDITOR_BASE_TILE_DIM_S2 = 8;

const getTileDataFromAsset = (asset: ProjectAsset | undefined): Tile | undefined => (
  asset?.type === 'tile' ? asset.data as Tile : undefined
);

const getTileDataIdFromAsset = (asset: ProjectAsset | undefined): string | undefined => (
  getTileDataFromAsset(asset)?.id
);

const findTileAssetByAnyId = (tileAssets: ProjectAsset[], tileId: string): ProjectAsset | undefined => (
  tileAssets.find(asset => asset.id === tileId || getTileDataIdFromAsset(asset) === tileId)
);

const calculateVramUsage = (bank: TileBankDefinition, tileAssets: ProjectAsset[]): { patternBytes: number, colorBytes: number, totalCharsUsedByTiles: number, usedAssignableChars: number, totalAssignableChars: number, freeAssignableChars: number } => {
  const isBankEffectivelyEnabled = bank.enabled ?? true;
  if (!isBankEffectivelyEnabled) return { patternBytes: 0, colorBytes: 0, totalCharsUsedByTiles: 0, usedAssignableChars: 0, totalAssignableChars: 0, freeAssignableChars: 0 };

  const usedCharCodes = new Set<number>();
  Object.entries(bank.assignedTiles).forEach(([tileId, assignment]) => {
    // Check if this is a font assignment
    if (tileId.startsWith('font_') && (assignment as any).fontCharacters) {
      // Count each individual font character
      (assignment as any).fontCharacters.forEach((fontChar: any) => usedCharCodes.add(Number(fontChar.bankCharCode)));
    } else {
      // Regular tile assignment
      const tileAsset = getTileDataFromAsset(findTileAssetByAnyId(tileAssets, tileId));
      if (tileAsset) {
        getTileAssignmentCharCodes(assignment as any, tileAsset).forEach(code => usedCharCodes.add(code));
      } else {
        // Fallback if tile asset not found, assume 1 char (should ideally not happen)
        usedCharCodes.add(Number((assignment as any).charCode) || 0);
      }
    }
  });
  const totalCharsUsedByTiles = usedCharCodes.size;

  // VRAM usage is based on the bank's character range, not just assigned tiles,
  // as the range is reserved irrespective of how many tiles fill it.
  const numCharsInBankRange = bank.charsetRangeEnd - bank.charsetRangeStart + 1;
  const patternBytes = numCharsInBankRange * 8; // 8 bytes per character pattern
  const colorBytes = numCharsInBankRange * 8;   // 8 bytes per character color attributes in Screen 2
  const totalAssignableChars = Array.from(
    { length: numCharsInBankRange },
    (_unused, index) => bank.charsetRangeStart + index
  ).filter(isAssignableScreen2TileCharCode).length;
  const usedAssignableChars = Array.from(usedCharCodes).filter(isAssignableScreen2TileCharCode).length;
  const freeAssignableChars = Math.max(0, totalAssignableChars - usedAssignableChars);

  return { patternBytes, colorBytes, totalCharsUsedByTiles, usedAssignableChars, totalAssignableChars, freeAssignableChars };
};

export const TileBankEditor: React.FC<TileBankEditorProps> = ({
  tileBank: initialTileBank,
  onUpdate,
  allTiles,
  allFonts,
  currentScreenMode,
}) => {
  const [tileBank, setTileBank] = useState<TileBank>(initialTileBank);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(
    initialTileBank?.banks?.length > 0 ? initialTileBank.banks[0].id : null
  );
  const [isAssignTileModalOpen, setIsAssignTileModalOpen] = useState<boolean>(false);
  const [bankToAssignTileTo, setBankToAssignTileTo] = useState<string | null>(null);
  const [selectedTileIdsForBatch, setSelectedTileIdsForBatch] = useState<string[]>([]);
  const [tileSearchTerm, setTileSearchTerm] = useState<string>('');
  const [assignToAllBanks, setAssignToAllBanks] = useState<boolean>(false);
  const [isFontAssetModalOpen, setIsFontAssetModalOpen] = useState<boolean>(false);
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [isTilesetPreviewOpen, setIsTilesetPreviewOpen] = useState<boolean>(false);
  const [currentPreviewBank, setCurrentPreviewBank] = useState<number>(0);
  const [shouldUpdateParent, setShouldUpdateParent] = useState<boolean>(false);
  const migrationPerformedRef = useRef<boolean>(false);

  // Effect to sync with prop changes (when a different asset is selected)
  useEffect(() => {
    setTileBank(initialTileBank);
    setSelectedBankId(initialTileBank?.banks?.length > 0 ? initialTileBank.banks[0].id : null);
    setShouldUpdateParent(false);
  }, [initialTileBank]);

  // Quick lookup for tile assets by id (avoids repeated finds)
  const tileAssetLookup = useMemo(() => {
    const map = new Map<string, Tile>();
    allTiles.forEach(asset => {
      const tile = asset.data as Tile;
      map.set(asset.id, tile);
      if (tile.id) map.set(tile.id, tile);
    });
    return map;
  }, [allTiles]);

  // Effect to update parent when tileBank changes (but not during initial load)
  useEffect(() => {
    if (shouldUpdateParent) {
      onUpdate(tileBank);
      setShouldUpdateParent(false);
    }
  }, [tileBank, shouldUpdateParent, onUpdate]);

  // Clean up invalid tile assignments
  const cleanupInvalidAssignments = useCallback((banksToClean: TileBankDefinition[] | undefined) => {
    if (!banksToClean || !Array.isArray(banksToClean)) {
      return [];
    }
    return banksToClean.map(bank => {
      const cleanedAssignedTiles: { [key: string]: any } = {};

      Object.entries(bank.assignedTiles || {}).forEach(([tileId, assignment]) => {
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
          const tileExists = !!findTileAssetByAnyId(allTiles, tileId);
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
    const cleanedBanks = cleanupInvalidAssignments(tileBank?.banks);

    // Check if there were changes
    const hasChanges = cleanedBanks.some((cleanedBank, index) =>
      Object.keys(cleanedBank.assignedTiles).length !== Object.keys(tileBank?.banks?.[index]?.assignedTiles || {}).length
    );

    if (hasChanges) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        setTileBank(prev => ({ ...prev, banks: cleanedBanks }));
        setShouldUpdateParent(true);
      }, 0);
    }
  }, [tileBank?.banks, cleanupInvalidAssignments]);

  // Auto-migrate old tile banks from charsetRangeStart 128 to 0
  // This ensures all banks expose the full editor range; allocator skips reserved chars.
  // Only runs once per component mount to avoid interfering with user actions
  useEffect(() => {
    if (!tileBank?.banks || tileBank.banks.length === 0) return;
    if (migrationPerformedRef.current) return; // Skip if already migrated

    // Check if any bank starts at 128 (old default)
    const needsMigration = tileBank.banks.some(bank =>
      bank.charsetRangeStart === 128
    );

    if (needsMigration) {
      console.log('Migrating tile banks from charsetRangeStart 128 to 0...');
      migrationPerformedRef.current = true; // Mark as performed

      setTimeout(() => {
        setTileBank(prev => ({
          ...prev,
          banks: prev.banks.map(bank => {
            // Migrate banks starting at 128 to start at 0
            // This is safe even with assigned tiles as 128-253 is a subset of 0-255
            if (bank.charsetRangeStart === 128) {
              console.log(`Migrated bank "${bank.name}" to start at char 0`);
              return {
                ...bank,
                charsetRangeStart: 0  // Update to start at 0, allowing fonts in 0-127
              };
            }
            return bank;
          })
        }));
        setShouldUpdateParent(true);
      }, 0);
    }
  }, [tileBank?.banks]);

  // Handle selectedBankId updates separately without cleaning assignments
  useEffect(() => {
    if (!selectedBankId && tileBank?.banks?.length > 0) {
      setSelectedBankId(tileBank.banks[0].id);
    } else if (selectedBankId && !tileBank?.banks?.find(b => b.id === selectedBankId) && tileBank?.banks?.length > 0) {
      setSelectedBankId(tileBank.banks[0].id);
    } else if (tileBank?.banks?.length === 0) {
      setSelectedBankId(null);
    }
  }, [tileBank?.banks, selectedBankId]);

  const handleBankPropertyChange = (bankId: string, property: keyof TileBankDefinition | `screenZone.${keyof TileBankDefinition['screenZone']}`, value: any) => {
    setTileBank(prevTileBank => {
      const prevBanks = prevTileBank.banks;
      const newBanks = prevBanks.map(bank => {
        if (bank.id === bankId) {
          const updatedBank = { ...bank };
          if (property.startsWith('screenZone.')) {
            const zoneKey = property.split('.')[1] as keyof TileBankDefinition['screenZone'];
            let numVal = parseInt(value, 10) || 0;
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

      // Remove the complex bank interdependency logic since each bank is now independent
      // Each bank has its own 256 character range; 254 and 255 are reserved.

      return { ...prevTileBank, banks: newBanks };
    });
    setShouldUpdateParent(true);
  };

  const resetAssignTileModalState = () => {
    setIsAssignTileModalOpen(false);
    setBankToAssignTileTo(null);
    setSelectedTileIdsForBatch([]);
    setTileSearchTerm('');
    setAssignToAllBanks(false);
  };

  const collectUsedCharCodes = useCallback((bank: TileBankDefinition): Set<number> => {
    const used = new Set<number>();
    Object.entries(bank.assignedTiles || {}).forEach(([tileId, assignment]) => {
      if (tileId.startsWith('font_') && (assignment as any).fontCharacters) {
        (assignment as any).fontCharacters.forEach((fc: any) => used.add(fc.bankCharCode));
      } else {
        const tileAsset = tileAssetLookup.get(tileId);
        const tileAssignment = assignment as { charCode: number };
        if (!tileAsset || tileAssignment.charCode === undefined) return;
        getTileAssignmentCharCodes(tileAssignment as any, tileAsset).forEach(code => used.add(code));
      }
    });
    return used;
  }, [tileAssetLookup]);

  const buildExistingSignatureMap = (bank: TileBankDefinition): Map<string, number> => {
    const signatureToCharCode = new Map<string, number>();
    Object.entries(bank.assignedTiles || {}).forEach(([tileId, assignment]) => {
      if (tileId.startsWith('font_') || Array.isArray((assignment as any).fontCharacters)) return;
      const tile = tileAssetLookup.get(tileId);
      if (!tile) return;

      const assignmentAny = assignment as any;
      if (Array.isArray(assignmentAny.optimizedChars)) {
        assignmentAny.optimizedChars.forEach((entry: any) => {
          const signature = String(entry?.signature || '');
          const charCode = Number(entry?.charCode);
          if (signature && isAssignableScreen2TileCharCode(charCode) && !signatureToCharCode.has(signature)) {
            signatureToCharCode.set(signature, charCode);
          }
        });
      }

      const { totalChars } = getTileCharDimensions(tile);
      for (let charIndex = 0; charIndex < totalChars; charIndex++) {
        const { signature } = buildTileCharSignature(tile, charIndex);
        const charCode = resolveTileAssignmentCharCode(assignment as any, tile, charIndex % getTileCharDimensions(tile).widthInChars, Math.floor(charIndex / getTileCharDimensions(tile).widthInChars));
        if (charCode !== undefined && isAssignableScreen2TileCharCode(charCode) && !signatureToCharCode.has(signature)) {
          signatureToCharCode.set(signature, charCode);
        }
      }
    });
    return signatureToCharCode;
  };

  const allocateTileCharMap = (
    bank: TileBankDefinition,
    tileAsset: Tile,
    signatureToCharCode: Map<string, number>,
    usedCharCodesInBank: Set<number>
  ): { charMap: number[]; optimizedChars: any[] } | null => {
    const { totalChars } = getTileCharDimensions(tileAsset);
    const charMap: number[] = [];
    const pendingBySignature = new Map<string, { charIndices: number[]; signature: string; isEmpty: boolean }>();

    for (let charIndex = 0; charIndex < totalChars; charIndex++) {
      const { signature, isEmpty } = buildTileCharSignature(tileAsset, charIndex);
      const existingCharCode = signatureToCharCode.get(signature);
      if (existingCharCode !== undefined) {
        charMap[charIndex] = existingCharCode;
        continue;
      }

      const pending = pendingBySignature.get(signature);
      if (pending) {
        pending.charIndices.push(charIndex);
      } else {
        pendingBySignature.set(signature, { charIndices: [charIndex], signature, isEmpty });
      }
    }

    const pendingEntries = Array.from(pendingBySignature.values());
    const optimizedChars: any[] = [];

    if (pendingEntries.length > 0) {
      const blockStart = findAvailableScreen2CharBlock(
        bank.charsetRangeStart,
        bank.charsetRangeEnd,
        usedCharCodesInBank,
        pendingEntries.length
      );
      if (blockStart === -1) return null;

      pendingEntries.forEach((entry, index) => {
        const charCode = blockStart + index;
        usedCharCodesInBank.add(charCode);
        signatureToCharCode.set(entry.signature, charCode);
        entry.charIndices.forEach(charIndex => {
          charMap[charIndex] = charCode;
        });
        optimizedChars.push({
          charIndex: entry.charIndices[0],
          charCode,
          signature: entry.signature,
          isEmpty: entry.isEmpty,
        });
      });
    }

    return { charMap, optimizedChars };
  };

  const tryAssignTilesToBanks = useCallback((targetBankIds: string[], tileIds: string[]) => {
    if (tileIds.length === 0 || targetBankIds.length === 0) {
      alert('Selecciona al menos un tile y un banco de destino.');
      return { success: false, assignedCount: 0 };
    }

    let errorMessage = '';
    let assignedCount = 0;
    const skippedAlreadyAssigned: string[] = [];

    setTileBank(prevTileBank => {
      const nextBanks = prevTileBank.banks.map(bank => ({
        ...bank,
        assignedTiles: { ...bank.assignedTiles }
      }));

      for (const bankId of targetBankIds) {
        const bankIndex = nextBanks.findIndex(b => b.id === bankId);
        if (bankIndex === -1) continue;

        const bank = nextBanks[bankIndex];
        if (bank.isLocked) {
          errorMessage = `El banco "${bank.name}" est? bloqueado.`;
          return prevTileBank;
        }

        const usedCharCodesInBank = collectUsedCharCodes(bank);

        for (const tileAssetId of tileIds) {
          if (bank.assignedTiles[tileAssetId]) {
            skippedAlreadyAssigned.push(tileAssetId);
            continue;
          }

          const tileAsset = tileAssetLookup.get(tileAssetId);
          if (!tileAsset) {
            errorMessage = `No se encontr? el tile con ID ${tileAssetId}.`;
            return prevTileBank;
          }

          const { totalChars } = getTileCharDimensions(tileAsset);

          if (totalChars <= 0) {
            errorMessage = `El tile "${tileAsset.name}" no tiene dimensiones v?lidas para SCREEN 2.`;
            return prevTileBank;
          }

          const signatureToCharCode = buildExistingSignatureMap(bank);
          const allocation = allocateTileCharMap(bank, tileAsset, signatureToCharCode, usedCharCodesInBank);

          if (!allocation) {
            errorMessage = `El banco "${bank.name}" no tiene un bloque contiguo libre suficiente en el rango ${bank.charsetRangeStart}-${bank.charsetRangeEnd}.`;
            return prevTileBank;
          }

          bank.assignedTiles[tileAssetId] = {
            charCode: allocation.charMap[0] ?? 0,
            optimized: true,
            charMap: allocation.charMap,
            optimizedChars: allocation.optimizedChars,
          };
          assignedCount++;
        }
      }

      return { ...prevTileBank, banks: nextBanks };
    });

    if (errorMessage) {
      alert(errorMessage);
      return { success: false, assignedCount, skipped: skippedAlreadyAssigned };
    }

    if (assignedCount === 0 && skippedAlreadyAssigned.length > 0) {
      alert('Todos los tiles seleccionados ya estaban asignados en los bancos objetivo.');
      return { success: false, assignedCount, skipped: skippedAlreadyAssigned };
    }

    if (skippedAlreadyAssigned.length > 0) {
      alert(`Algunos tiles ya estaban asignados y se omitieron (${skippedAlreadyAssigned.length}).`);
    }

    setShouldUpdateParent(true);
    return { success: true, assignedCount, skipped: skippedAlreadyAssigned };
  }, [collectUsedCharCodes, tileAssetLookup]);

  const handleAssignTileToBank = (bankId: string, tileAssetId: string, closeAfterAssign: boolean = false) => {
    const targetBankIds = assignToAllBanks && tileBank?.banks?.length ? tileBank.banks.map(b => b.id) : [bankId];
    const result = tryAssignTilesToBanks(targetBankIds, [tileAssetId]);
    if (result.success) {
      setSelectedTileIdsForBatch(prev => prev.filter(id => id !== tileAssetId));
      if (closeAfterAssign) {
        resetAssignTileModalState();
      }
    }
  };

  const toggleTileBatchSelection = (tileId: string) => {
    setSelectedTileIdsForBatch(prev => prev.includes(tileId) ? prev.filter(id => id !== tileId) : [...prev, tileId]);
  };

  const handleBatchAssignSelectedTiles = () => {
    if (!bankToAssignTileTo) return;
    const targetBankIds = assignToAllBanks && tileBank?.banks?.length ? tileBank.banks.map(b => b.id) : [bankToAssignTileTo];
    const result = tryAssignTilesToBanks(targetBankIds, selectedTileIdsForBatch);
    if (result.success) {
      resetAssignTileModalState();
    }
  };

  const handleRemoveTileFromBank = (bankId: string, tileAssetId: string) => {
    setTileBank(prevTileBank => {
      const newBanks = (prevTileBank?.banks || []).map(bank => {
        if (bank.id === bankId) {
          const newAssignedTiles = { ...bank.assignedTiles || {} };
          delete newAssignedTiles[tileAssetId];
          return { ...bank, assignedTiles: newAssignedTiles };
        }
        return bank;
      });
      return { ...prevTileBank, banks: newBanks };
    });
    setShouldUpdateParent(true);
  };

  const handleOptimizeBankAssignments = (bankId: string) => {
    let optimizedCount = 0;
    let errorMessage = '';

    setTileBank(prevTileBank => {
      const newBanks = (prevTileBank?.banks || []).map(bank => {
        if (bank.id !== bankId) return bank;
        if (bank.isLocked) {
          errorMessage = `El banco "${bank.name}" esta bloqueado.`;
          return bank;
        }

        const nextAssignedTiles: Record<string, any> = {};
        const usedCharCodes = new Set<number>();
        const signatureToCharCode = new Map<string, number>();

        Object.entries(bank.assignedTiles || {}).forEach(([tileId, assignment]) => {
          if (tileId.startsWith('font_') || Array.isArray((assignment as any).fontCharacters)) {
            nextAssignedTiles[tileId] = assignment;
            (assignment as any).fontCharacters?.forEach((fontChar: any) => usedCharCodes.add(Number(fontChar.bankCharCode)));
          }
        });

        for (const [tileId, assignment] of Object.entries(bank.assignedTiles || {})) {
          if (tileId.startsWith('font_') || Array.isArray((assignment as any).fontCharacters)) continue;
          const tileAsset = tileAssetLookup.get(tileId);
          if (!tileAsset) {
            nextAssignedTiles[tileId] = assignment;
            continue;
          }

          const allocation = allocateTileCharMap(bank, tileAsset, signatureToCharCode, usedCharCodes);
          if (!allocation) {
            errorMessage = `El banco "${bank.name}" no tiene bloques contiguos libres suficientes para optimizar.`;
            return bank;
          }

          const previousCodes = getTileAssignmentCharCodes(assignment as any, tileAsset).join(',');
          const nextCodes = Array.from(new Set(allocation.charMap)).join(',');
          if (previousCodes !== nextCodes || !(assignment as any).optimized) {
            optimizedCount++;
          }

          nextAssignedTiles[tileId] = {
            ...(assignment as any),
            charCode: allocation.charMap[0] ?? 0,
            optimized: true,
            charMap: allocation.charMap,
            optimizedChars: allocation.optimizedChars,
          };
        }

        return {
          ...bank,
          assignedTiles: nextAssignedTiles,
        };
      });
      return { ...prevTileBank, banks: newBanks };
    });

    if (errorMessage) {
      alert(errorMessage);
      return;
    }

    setShouldUpdateParent(true);
    alert(`Banco optimizado. ${optimizedCount} tiles revisados para reutilizar chars 8x8 repetidos o vacios.`);
  };

  const renderCharacterGraphics = (charCode: number, bankIndex?: number): React.ReactElement => {
    // Check if this character is assigned to a tile or font
    let assignedTileData: PixelData | null = null;
    let assignedFontPattern: number[] | null = null;
    let hasAssignment = false;

    // If bankIndex is provided, only check that specific bank
    const banksToCheck = bankIndex !== undefined ? [tileBank?.banks?.[bankIndex]].filter(Boolean) : (tileBank?.banks || []);

    banksToCheck.forEach(bank => {
      if (bank && charCode >= bank.charsetRangeStart && charCode <= bank.charsetRangeEnd) {
        Object.entries(bank.assignedTiles || {}).forEach(([tileId, assignment]) => {
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
            const tileAsset = getTileDataFromAsset(findTileAssetByAnyId(allTiles, tileId));
            const tileAssignment = assignment as any;
            if (tileAsset && tileAssignment.charCode !== undefined) {
              const { widthInChars } = getTileCharDimensions(tileAsset);
              const charCodes = getTileAssignmentCharCodes(tileAssignment, tileAsset);
              if (charCodes.includes(charCode)) {
                const charIndex = Array.isArray(tileAssignment.charMap)
                  ? Math.max(0, tileAssignment.charMap.findIndex((code: number) => code === charCode))
                  : charCode - tileAssignment.charCode;
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
      banksToCheck.forEach(bank => {
        if (bank && charCode >= bank.charsetRangeStart && charCode <= bank.charsetRangeEnd) {
          Object.entries(bank.assignedTiles || {}).forEach(([tileId, assignment]) => {
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
            Array.from({ length: 8 }, (_, colIndex) => {
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
    setTileBank(prevTileBank => {
      const prevBanks = prevTileBank.banks;
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
              Object.entries(bank.assignedTiles || {}).forEach(([tileId, assignment]) => {
                if (!tileId.startsWith('font_')) {
                  // Check if ASCII position conflicts with tile assignment
                  const tileAsset = getTileDataFromAsset(findTileAssetByAnyId(allTiles, tileId));
                  const tileAssignment = assignment as { charCode: number };
                  if (tileAsset && tileAssignment.charCode !== undefined) {
                    if (getTileAssignmentCharCodes(tileAssignment as any, tileAsset).includes(asciiCode)) {
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
      return { ...prevTileBank, banks: newBanks };
    });
    setShouldUpdateParent(true);
  };

  const selectedBankDetails = tileBank?.banks?.find(b => b.id === selectedBankId);

  if (currentScreenMode !== "SCREEN 2 (Graphics I)") {
    return (
      <Panel title="MSX1 Tile Banks Management" icon={<ListBulletIcon />}>
        <p className="p-4 text-msx-textsecondary">Tile Banks are only applicable for MSX1 SCREEN 2 projects.</p>
      </Panel>
    );
  }

  const renderBankControls = (bank: TileBankDefinition) => {
    const { patternBytes, colorBytes, totalCharsUsedByTiles, usedAssignableChars, totalAssignableChars, freeAssignableChars } = calculateVramUsage(bank, allTiles);
    const isBankEffectivelyEnabled = bank.enabled ?? true;
    const numCharsInBankRange = isBankEffectivelyEnabled ? (bank.charsetRangeEnd - bank.charsetRangeStart + 1) : 0;
    // totalCharsUsedByTiles is now a better reflection of actual usage by assigned tiles
    // const numAssignedTiles = Object.keys(bank.assignedTiles).length; // This counts assets, not char codes

    // All banks are now independent, no special logic needed
    const isSpecialBank = false; // No special banks anymore


    return (
      <div key={bank.id} className={`p-3 border border-msx-border rounded-md bg-msx-panelbg/70`}>
        <div className="flex justify-between items-center mb-2">
          <input
            type="text"
            value={bank.name}
            onChange={(e) => handleBankPropertyChange(bank.id, 'name', e.target.value)}
            className="pixel-font text-md text-msx-highlight bg-transparent border-b border-msx-highlight/50 focus:border-msx-highlight outline-none"
            disabled={bank.isLocked}
          />
          <div className="flex items-center space-x-3">
            <label className="text-xs flex items-center">
              <input type="checkbox" checked={bank.isLocked} onChange={(e) => handleBankPropertyChange(bank.id, 'isLocked', e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent mr-1" />
              Locked
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2">
          <div>
            <label>Charset Range: </label>
            <input type="number" value={bank.charsetRangeStart} onChange={(e) => handleBankPropertyChange(bank.id, 'charsetRangeStart', e.target.value)} className="w-12 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={true} />
            -
            <input type="number" value={bank.charsetRangeEnd} onChange={(e) => handleBankPropertyChange(bank.id, 'charsetRangeEnd', e.target.value)} className="w-12 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={true} />
            <span className="text-msx-textsecondary"> ({numCharsInBankRange} chars total in range)</span>
          </div>
          <div>
            <label>VRAM Pattern Start: </label>
            <input type="text" value={`0x${bank.vramPatternStart.toString(16).toUpperCase()}`} onChange={(e) => handleBankPropertyChange(bank.id, 'vramPatternStart', parseInt(e.target.value, 16))} className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked} />
            <span className="text-msx-textsecondary"> (Size: {patternBytes}B)</span>
          </div>
          <div>
            <label>VRAM Color Start: </label>
            <input type="text" value={`0x${bank.vramColorStart.toString(16).toUpperCase()}`} onChange={(e) => handleBankPropertyChange(bank.id, 'vramColorStart', parseInt(e.target.value, 16))} className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked} />
            <span className="text-msx-textsecondary"> (Size: {colorBytes}B)</span>
          </div>
          <div>
            <label>Screen Zone (X,Y,W,H): </label>
            <input type="number" value={bank.screenZone.x} onChange={(e) => handleBankPropertyChange(bank.id, 'screenZone.x', e.target.value)} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked} />
            <input type="number" value={bank.screenZone.y} onChange={(e) => handleBankPropertyChange(bank.id, 'screenZone.y', e.target.value)} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked} />
            <input type="number" value={bank.screenZone.width} onChange={(e) => handleBankPropertyChange(bank.id, 'screenZone.width', e.target.value)} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked} />
            <input type="number" value={bank.screenZone.height} onChange={(e) => handleBankPropertyChange(bank.id, 'screenZone.height', e.target.value)} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded" disabled={bank.isLocked} />
          </div>
          <div>
            <label>Default Colors (FG/BG Idx): </label>
            <select value={bank.defaultFgColorIndex} onChange={(e) => handleBankPropertyChange(bank.id, 'defaultFgColorIndex', e.target.value)} className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded text-xs" disabled={bank.isLocked}>
              {MSX1_PALETTE.map(c => <option key={`fg-${c.index}`} value={c.index}>{c.index}: {c.name.split(' ')[0]}</option>)}
            </select>
            /
            <select value={bank.defaultBgColorIndex} onChange={(e) => handleBankPropertyChange(bank.id, 'defaultBgColorIndex', e.target.value)} className="w-16 p-0.5 bg-msx-bgcolor border-msx-border rounded text-xs" disabled={bank.isLocked}>
              {MSX1_PALETTE.map(c => <option key={`bg-${c.index}`} value={c.index}>{c.index}: {c.name.split(' ')[0]}</option>)}
            </select>
          </div>
        </div>

        <h5 className="text-sm text-msx-cyan mt-3 mb-1">Assigned Tiles ({usedAssignableChars} / {totalAssignableChars} assignable char codes used, {freeAssignableChars} free):</h5>
        <div className={`max-h-32 overflow-y-auto bg-msx-bgcolor p-1 rounded border border-msx-border space-y-0.5`}>
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
                  colorInfo = 'Per-row colors';
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
                    {!bank.isLocked &&
                      <Tooltip text="Remove tile from bank"><Button onClick={() => handleRemoveTileFromBank(bank.id, tileId)} size="sm" variant="danger" className="!p-0.5" icon={<TrashIcon className="w-2.5 h-2.5" />}>{null}</Button></Tooltip>}
                  </div>
                </div>
              );
            } else {
              // Regular tile assignment
              const tileAsset = getTileDataFromAsset(findTileAssetByAnyId(allTiles, tileId));
              let codesUsedByThisTile = "1 char";
              if (tileAsset) {
                codesUsedByThisTile = resolveTileAssignmentLabel(assignment as any, tileAsset);
              }
              return (
                <div key={tileId} className="flex justify-between items-center p-0.5 text-xs hover:bg-msx-border/50 rounded">
                  <span>{tileAsset?.name || 'Unknown Tile'} (ID: ...{tileId.slice(-4)})</span>
                  <span className="text-msx-textsecondary">Base: {(assignment as { charCode: number }).charCode} (0x{(assignment as { charCode: number }).charCode.toString(16).toUpperCase()}) - {codesUsedByThisTile}</span>
                  {!bank.isLocked &&
                    <Tooltip text="Remove tile from bank"><Button onClick={() => handleRemoveTileFromBank(bank.id, tileId)} size="sm" variant="danger" className="!p-0.5" icon={<TrashIcon className="w-2.5 h-2.5" />}>{null}</Button></Tooltip>}
                </div>
              );
            }
          })}
          {totalCharsUsedByTiles === 0 && <p className="text-xs text-msx-textsecondary italic p-1">No tiles assigned to this bank.</p>}
        </div>
        {!bank.isLocked &&
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => {
                setBankToAssignTileTo(bank.id);
                setSelectedTileIdsForBatch([]);
                setTileSearchTerm('');
                setAssignToAllBanks(false);
                setIsAssignTileModalOpen(true);
              }}
              size="sm" variant="secondary" icon={<PlusCircleIcon />} className="text-xs"
              disabled={freeAssignableChars <= 0}
            >
              Assign Tile to Bank
            </Button>
            <Button
              onClick={() => { setBankToAssignTileTo(bank.id); setIsFontAssetModalOpen(true); }}
              size="sm" variant="secondary" icon={<PencilIcon />} className="text-xs"
              disabled={freeAssignableChars <= 0}
            >
              Font Asset
            </Button>
            <Button
              onClick={() => handleOptimizeBankAssignments(bank.id)}
              size="sm" variant="secondary" icon={<ViewfinderCircleIcon />} className="text-xs"
              disabled={Object.keys(bank.assignedTiles || {}).length === 0}
            >
              Optimize 8x8
            </Button>
          </div>}
        {freeAssignableChars <= 0 && <p className="text-xs text-red-500 mt-1">Bank character code range full or not enough contiguous space.</p>}
      </div>
    );
  };

  return (
    <Panel title="MSX1 Tile Banks Management (SCREEN 2)" icon={<ListBulletIcon />} className="flex-grow flex flex-col p-2 bg-msx-bgcolor overflow-y-auto select-none">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-msx-textsecondary flex-1">
          Define 3 independent banks for character tiles. Each bank has 256 characters with 254 and 255 reserved.
          Bank 0: HUD/Fonts, Bank 1: Game Tileset, Bank 2: Background/Status.
          Each bank corresponds to a different area of MSX Screen 2 memory for optimal pattern organization.
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
        {(tileBank?.banks || []).map(bank => {
          const { freeAssignableChars, totalAssignableChars } = calculateVramUsage(bank, allTiles);
          return (
          <React.Fragment key={bank.id}>
            <button
              onClick={() => setSelectedBankId(bank.id)}
              className={`w-full text-left p-2 rounded pixel-font text-lg flex flex-wrap items-center gap-x-3 gap-y-1 ${selectedBankId === bank.id ? 'bg-msx-accent text-white' : 'bg-msx-panelbg text-msx-highlight hover:bg-msx-border'}`}
            >
              <span>{bank.name} (Chars: {bank.charsetRangeStart}-{bank.charsetRangeEnd})</span>
              <span className={selectedBankId === bank.id ? 'text-white/90' : 'text-msx-cyan'}>
                Free: {freeAssignableChars}/{totalAssignableChars}
              </span>
            </button>
            {selectedBankId === bank.id && renderBankControls(bank)}
          </React.Fragment>
          );
        })}
      </div>

      {isAssignTileModalOpen && bankToAssignTileTo && (() => {
        const targetBankIds = assignToAllBanks && tileBank?.banks?.length ? tileBank.banks.map(b => b.id) : [bankToAssignTileTo];
        const searchTerm = tileSearchTerm.toLowerCase();
        const availableTiles = allTiles
          .filter(asset => asset.type === 'tile')
          .filter(asset => {
            const tileDataId = getTileDataIdFromAsset(asset);
            const isAssignedEverywhere = targetBankIds.length > 0 && targetBankIds.every(bankId => {
              const bank = tileBank?.banks?.find(b => b.id === bankId);
              return bank?.assignedTiles?.[asset.id] || (tileDataId ? bank?.assignedTiles?.[tileDataId] : undefined);
            });
            if (isAssignedEverywhere) return false;
            if (!searchTerm) return true;
            return (asset.name || '').toLowerCase().includes(searchTerm);
          });

        return (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={resetAssignTileModalState}>
            <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-md animate-slideIn pixel-font" onClick={e => e.stopPropagation()}>
              <h3 className="text-md text-msx-highlight mb-3">Assign Tile to Bank: {tileBank?.banks?.find(b => b.id === bankToAssignTileTo)?.name}</h3>

              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <input
                  type="text"
                  value={tileSearchTerm}
                  onChange={(e) => setTileSearchTerm(e.target.value)}
                  placeholder="Buscar tile..."
                  className="flex-1 min-w-[140px] p-1 rounded border border-msx-border bg-msx-bgcolor"
                />
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignToAllBanks}
                    onChange={(e) => setAssignToAllBanks(e.target.checked)}
                    className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                  />
                  <span>Asignar a los 3 bancos</span>
                </label>
                <span className="text-msx-textsecondary">Seleccionados: {selectedTileIdsForBatch.length}</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {availableTiles.map(tileAssetItem => {
                  const tileAsset = tileAssetItem.data as Tile;
                  const isSelected = selectedTileIdsForBatch.includes(tileAssetItem.id);
                  return (
                    <div
                      key={tileAssetItem.id}
                      className="flex items-center justify-between p-1 rounded border border-msx-border/50 hover:border-msx-accent/60"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTileBatchSelection(tileAssetItem.id)}
                          className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs">{tileAssetItem.name} ({tileAsset.width}x{tileAsset.height})</span>
                          {assignToAllBanks && <span className="text-[10px] text-msx-textsecondary">Se replicar? en los 3 bancos (SCREEN 2)</span>}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssignTileToBank(bankToAssignTileTo, tileAssetItem.id)}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Asignar ahora
                      </Button>
                    </div>
                  );
                })}
                {availableTiles.length === 0 &&
                  <p className="text-xs text-msx-textsecondary p-2">Todos los tiles disponibles ya est?n asignados en los bancos seleccionados.</p>
                }
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={resetAssignTileModalState} variant="danger" size="md">
                  Cancelar
                </Button>
                <Button
                  onClick={handleBatchAssignSelectedTiles}
                  size="md"
                  variant="secondary"
                  disabled={selectedTileIdsForBatch.length === 0}
                >
                  Asignar seleccion
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {isFontAssetModalOpen && bankToAssignTileTo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setIsFontAssetModalOpen(false)}>
          <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-2xl animate-slideIn pixel-font" onClick={e => e.stopPropagation()}>
            <h3 className="text-md text-msx-highlight mb-3">Font Asset for Bank: {tileBank?.banks?.find(b => b.id === bankToAssignTileTo)?.name}</h3>

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

                {/* Quick selection buttons */}
                <div className="flex gap-2 mb-3">
                  <Button
                    onClick={() => {
                      const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
                      setSelectedCharacters(prev => {
                        const newSelection = [...prev];
                        alphabet.forEach(char => {
                          if (!newSelection.includes(char)) {
                            newSelection.push(char);
                          }
                        });
                        return newSelection;
                      });
                    }}
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                  >
                    Select A-Z
                  </Button>
                  <Button
                    onClick={() => {
                      const numbers = Array.from({ length: 10 }, (_, i) => String.fromCharCode(48 + i));
                      setSelectedCharacters(prev => {
                        const newSelection = [...prev];
                        numbers.forEach(char => {
                          if (!newSelection.includes(char)) {
                            newSelection.push(char);
                          }
                        });
                        return newSelection;
                      });
                    }}
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                  >
                    Select 0-9
                  </Button>
                  <Button
                    onClick={() => {
                      const punctuation = ['.', ',', ';', ':'];
                      setSelectedCharacters(prev => {
                        const newSelection = [...prev];
                        punctuation.forEach(char => {
                          if (!newSelection.includes(char)) {
                            newSelection.push(char);
                          }
                        });
                        return newSelection;
                      });
                    }}
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                  >
                    Select .,;:
                  </Button>
                  <Button
                    onClick={() => setSelectedCharacters([])}
                    size="sm"
                    variant="danger"
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-8 gap-1 p-2 bg-msx-bgcolor border border-msx-border rounded max-h-40 overflow-y-auto">
                  {/* A-Z */}
                  {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(char => (
                    <button
                      key={char}
                      onClick={() => {
                        setSelectedCharacters(prev =>
                          prev.includes(char)
                            ? prev.filter(c => c !== char)
                            : [...prev, char]
                        );
                      }}
                      className={`p-1 text-xs border rounded ${selectedCharacters.includes(char)
                        ? 'bg-msx-accent text-white border-msx-accent'
                        : 'bg-msx-panelbg border-msx-border hover:bg-msx-border'
                        }`}
                    >
                      {char}
                    </button>
                  ))}
                  {/* 0-9 */}
                  {Array.from({ length: 10 }, (_, i) => String.fromCharCode(48 + i)).map(char => (
                    <button
                      key={char}
                      onClick={() => {
                        setSelectedCharacters(prev =>
                          prev.includes(char)
                            ? prev.filter(c => c !== char)
                            : [...prev, char]
                        );
                      }}
                      className={`p-1 text-xs border rounded ${selectedCharacters.includes(char)
                        ? 'bg-msx-accent text-white border-msx-accent'
                        : 'bg-msx-panelbg border-msx-border hover:bg-msx-border'
                        }`}
                    >
                      {char}
                    </button>
                  ))}
                  {/* Punctuation */}
                  {['.', ',', ';', ':'].map(char => (
                    <button
                      key={char}
                      onClick={() => {
                        setSelectedCharacters(prev =>
                          prev.includes(char)
                            ? prev.filter(c => c !== char)
                            : [...prev, char]
                        );
                      }}
                      className={`p-1 text-xs border rounded ${selectedCharacters.includes(char)
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
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-black">Mapa de Caracteres MSX</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPreviewBank(Math.max(0, currentPreviewBank - 1))}
                    disabled={currentPreviewBank === 0}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    &lt;- Anterior
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {tileBank?.banks?.[currentPreviewBank]?.name || `Bank ${currentPreviewBank}`} ({currentPreviewBank + 1}/3)
                  </span>
                  <button
                    onClick={() => setCurrentPreviewBank(Math.min(2, currentPreviewBank + 1))}
                    disabled={currentPreviewBank === 2}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Siguiente -&gt;
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsTilesetPreviewOpen(false)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              >
                Cerrar
              </button>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded p-4">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  Triple Bank System: 3 x 256 = 768 Total Characters
                </div>
                <div className="text-sm text-blue-600">
                  Bank {currentPreviewBank}: {tileBank?.banks?.[currentPreviewBank]?.name || 'Unknown'} - 256 Independent Characters (254/255 reserved)
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  VRAM: {tileBank?.banks?.[currentPreviewBank]?.vramPatternStart ? `0x${tileBank.banks[currentPreviewBank].vramPatternStart.toString(16).toUpperCase()}` : 'N/A'} (Patterns) |
                  {tileBank?.banks?.[currentPreviewBank]?.vramColorStart ? ` 0x${tileBank.banks[currentPreviewBank].vramColorStart.toString(16).toUpperCase()}` : ' N/A'} (Colors)
                </div>
              </div>
              {/* Complete 256 characters in 16x16 grid for current bank */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(16, 1fr)',
                  gap: '4px'
                }}
              >
                {Array.from({ length: 256 }, (_, charCode) => (
                  <div key={charCode} style={{ textAlign: 'center' }}>
                    {renderCharacterGraphics(charCode, currentPreviewBank)}
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



import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { Tile, ProjectAsset, LineColorAttribute, MSX1ColorValue, DataFormat, PixelData, TileLogicalProperties } from '../../types'; 
import { generateTileASMCode, createDefaultLineAttributes, generateTilePatternBytes, generateTileColorBytes } from '../utils/tileUtils'; 
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { MSX_SCREEN5_PALETTE, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR, SCREEN2_PIXELS_PER_COLOR_SEGMENT } from '../../constants';

interface TileFileOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTileAssets: ProjectAsset[]; 
  onUpdateAllTileAssets: (newTiles: ProjectAsset[]) => void;
  currentTile: Tile | null; 
  currentScreenMode: string; 
  dataOutputFormat: DataFormat;
}

const MODAL_DEFAULT_FONT_SIZE = 13;
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;

export const TileFileOperationsModal: React.FC<TileFileOperationsModalProps> = ({
  isOpen,
  onClose,
  allTileAssets,
  onUpdateAllTileAssets,
  currentTile,
  currentScreenMode,
  dataOutputFormat,
}) => {
  const [tilesetFilename, setTilesetFilename] = useState<string>('custom_tileset.json');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTileAsmCode, setCurrentTileAsmCode] = useState<string>('');
  const [tilesetAsmCode, setTilesetAsmCode] = useState<string>('');

  useEffect(() => {
    if (isOpen && currentTile && currentScreenMode === "SCREEN 2 (Graphics I)") {
      setCurrentTileAsmCode(generateTileASMCode(currentTile, currentTile.name, dataOutputFormat));
    } else {
      setCurrentTileAsmCode(''); 
    }
    setTilesetAsmCode(''); 
  }, [isOpen, currentTile, currentScreenMode, dataOutputFormat]);

  if (!isOpen) return null;

  const handleSaveTileset = () => {
    const tilesToSave: Tile[] = allTileAssets.filter(asset => asset.type === 'tile').map(asset => asset.data as Tile);
    if (tilesToSave.length === 0) {
      alert("No tiles to save.");
      return;
    }
    const jsonString = JSON.stringify({ tiles: tilesToSave }, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tilesetFilename.endsWith('.json') ? tilesetFilename : `${tilesetFilename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`Tileset saved as ${a.download}`);
  };

  const handleLoadTilesetClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedJson = JSON.parse(text);
        
        let loadedTilesData: Partial<Tile>[]; // Use Partial<Tile> for intermediate processing
        if (Array.isArray(parsedJson)) { 
            loadedTilesData = parsedJson;
        } else if (parsedJson && Array.isArray(parsedJson.tiles)) { 
            loadedTilesData = parsedJson.tiles;
        } else {
            throw new Error("Invalid tileset format. Expected an array of tiles or an object with a 'tiles' array.");
        }

        if (loadedTilesData.length === 0) {
          alert("No tiles found in the loaded file.");
          return;
        }
        
        const defaultLogicalProps: TileLogicalProperties = {
            mapId: 0, familyId: 0, instanceId: 0,
            isSolid: false, isBreakable: false, causesDamage: false,
            isMovable: false, isInteractiveSwitch: false
          };

        const newProjectAssets: ProjectAsset[] = loadedTilesData.map((tileData, index) => {
          const id = tileData.id || `loaded_tile_${Date.now()}_${index}`;
          const name = tileData.name || `Loaded Tile ${index + 1}`;
          const width = typeof tileData.width === 'number' && tileData.width > 0 ? tileData.width : 16;
          const height = typeof tileData.height === 'number' && tileData.height > 0 ? tileData.height : 16;
          
          let pixelData: PixelData = [];
          if (Array.isArray(tileData.data) && tileData.data.length > 0 && Array.isArray(tileData.data[0])) {
              if (tileData.data.length !== height || tileData.data[0].length !== width) {
                  console.warn(`Tile '${name}' (ID: ${id}) has mismatched pixel data dimensions. Expected ${width}x${height}, got ${tileData.data[0].length}x${tileData.data.length}. Re-initializing.`);
                  pixelData = Array(height).fill(null).map(() => Array(width).fill(MSX_SCREEN5_PALETTE[1].hex));
              } else {
                  pixelData = tileData.data as PixelData;
              }
          } else {
             pixelData = Array(height).fill(null).map(() => Array(width).fill(MSX_SCREEN5_PALETTE[1].hex));
          }

          let lineAttrs: LineColorAttribute[][] | undefined = tileData.lineAttributes;
          
          if (currentScreenMode === "SCREEN 2 (Graphics I)") {
            const expectedSegmentsPerRow = Math.max(1, width / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
            if (!lineAttrs || lineAttrs.length !== height || !lineAttrs.every(row => Array.isArray(row) && row.length === expectedSegmentsPerRow)) {
              console.warn(`Tile '${name}' (ID: ${id}) missing or has invalid lineAttributes. Applying defaults for SCREEN 2.`);
              lineAttrs = createDefaultLineAttributes(width, height, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR);
            }
          } else {
            lineAttrs = undefined; 
          }
          
          const validatedTile: Tile = { 
            id, 
            name, 
            width, 
            height, 
            data: pixelData, 
            lineAttributes: lineAttrs,
            logicalProperties: tileData.logicalProperties || defaultLogicalProps // Ensure logicalProperties exists
          };
          return { id, name, type: 'tile', data: validatedTile };
        });

        onUpdateAllTileAssets(newProjectAssets);
        alert(`Tileset "${file.name}" loaded successfully with ${newProjectAssets.length} tiles.`);

      } catch (error) {
        console.error("Error loading or parsing tileset file:", error);
        alert(`Failed to load tileset: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
        }
      }
    };
    reader.onerror = () => {
      alert("Error reading tileset file.");
       if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleCopyCurrentTileAsm = () => {
    navigator.clipboard.writeText(currentTileAsmCode)
      .then(() => alert('Current tile ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy current tile ASM code: ', err));
  };

  const handleDownloadCurrentTileAsm = () => {
    if (!currentTile) return;
    const safeTileName = currentTile.name.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeTileName}_tile.asm`;
    const blob = new Blob([currentTileAsmCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateTilesetAsm = () => {
    if (currentScreenMode !== "SCREEN 2 (Graphics I)") {
        setTilesetAsmCode(";; Tileset ASM export is only available for SCREEN 2 mode.");
        return;
    }
    const tileAssetsToExport = allTileAssets.filter(asset => asset.type === 'tile');
    if (tileAssetsToExport.length === 0) {
        setTilesetAsmCode(";; No tiles in the project to export.");
        return;
    }

    let allPatternsAsm = `;; --- ALL TILE PATTERNS ---\nALL_MAP_TILES_PTR:\n`;
    let allColorsAsm = `\n;; --- ALL TILE COLORS ---\nALL_MAP_TILES_COL:\n`;
    let headerAsm = `;; TILESET EXPORT - ${new Date().toLocaleString()}\n`;
    headerAsm += `;; ${tileAssetsToExport.length} tiles total.\n\n`;
    headerAsm += `;; Data format: ${dataOutputFormat.toUpperCase()}\n\n`;

    tileAssetsToExport.forEach(asset => {
        const tile = asset.data as Tile;
        const safeTileName = asset.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();

        if (tile.lineAttributes) {
            // Get pattern bytes
            const patternBytes = generateTilePatternBytes(tile, currentScreenMode);
            allPatternsAsm += `    ;; Pattern data for ${safeTileName}\n`;
            for (let i = 0; i < patternBytes.length; i += 16) {
                const chunk = Array.from(patternBytes.slice(i, i + 16));
                const formattedChunk = chunk.map(b => dataOutputFormat === 'hex' ? `#${b.toString(16).padStart(2,'0').toUpperCase()}` : b.toString());
                allPatternsAsm += `    DB ${formattedChunk.join(',')}\n`;
            }

            // Get color bytes
            const colorBytes = generateTileColorBytes(tile);
            if(colorBytes){
                allColorsAsm += `    ;; Color data for ${safeTileName}\n`;
                for (let i = 0; i < colorBytes.length; i += 16) {
                    const chunk = Array.from(colorBytes.slice(i, i + 16));
                    const formattedChunk = chunk.map(b => dataOutputFormat === 'hex' ? `#${b.toString(16).padStart(2,'0').toUpperCase()}` : b.toString());
                    allColorsAsm += `    DB ${formattedChunk.join(',')}\n`;
                }
            }
        } else {
             allPatternsAsm += `    ;; Tile: ${safeTileName} - SKIPPED (Not configured for SCREEN 2)\n`;
             allColorsAsm += `    ;; Tile: ${safeTileName} - SKIPPED (Not configured for SCREEN 2)\n`;
        }
    });

    setTilesetAsmCode(headerAsm + allPatternsAsm + allColorsAsm);
  };

  const handleCopyTilesetAsm = () => {
    navigator.clipboard.writeText(tilesetAsmCode)
      .then(() => alert('Tileset ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy tileset ASM code: ', err));
  };
  
  const handleDownloadTilesetAsm = () => {
    const safeTilesetName = tilesetFilename.replace(/\.json$/i, '').replace(/[^a-zA-Z0-9_]/g, '_') || 'tileset';
    const filename = `${safeTilesetName}_SCREEN2.asm`;
    const blob = new Blob([tilesetAsmCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadBinaryFile = (data: Uint8Array, baseName: string, suffix: string) => {
    const safeName = baseName.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeName}_${suffix}.bin`;
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCurrentTilePatternBIN = () => {
    if (!currentTile) return;
    const patternBytes = generateTilePatternBytes(currentTile, currentScreenMode);
    downloadBinaryFile(patternBytes, currentTile.name, "pattern");
  };

  const handleDownloadCurrentTileColorBIN = () => {
    if (!currentTile || currentScreenMode !== "SCREEN 2 (Graphics I)") return;
    const colorBytes = generateTileColorBytes(currentTile);
    if (colorBytes) {
      downloadBinaryFile(colorBytes, currentTile.name, "color");
    } else {
      alert("Color data is not available for this tile/mode.");
    }
  };
  
  const handleDownloadAllPatternsBIN = () => {
      const tileAssetsToExport = allTileAssets.filter(asset => asset.type === 'tile');
      if (tileAssetsToExport.length === 0) { alert("No tiles to export."); return; }
      
      const allPatternBytesArrays: Uint8Array[] = [];
      tileAssetsToExport.forEach(asset => {
          const tile = asset.data as Tile;
          allPatternBytesArrays.push(generateTilePatternBytes(tile, currentScreenMode));
      });
      const totalLength = allPatternBytesArrays.reduce((sum, arr) => sum + arr.length, 0);
      const combinedBytes = new Uint8Array(totalLength);
      let offset = 0;
      allPatternBytesArrays.forEach(arr => {
          combinedBytes.set(arr, offset);
          offset = Number(offset) + Number(arr.length); // Explicitly ensure numeric operation
      });
      downloadBinaryFile(combinedBytes, tilesetFilename.replace(/\.json$/i, ''), "all_patterns");
  };

  const handleDownloadAllColorsBIN = () => {
      if (currentScreenMode !== "SCREEN 2 (Graphics I)") { alert("Color data export is for SCREEN 2 only."); return; }
      const tileAssetsToExport = allTileAssets.filter(asset => asset.type === 'tile');
      if (tileAssetsToExport.length === 0) { alert("No tiles to export."); return; }

      const allColorBytesArrays: Uint8Array[] = [];
      tileAssetsToExport.forEach(asset => {
          const tile = asset.data as Tile;
          const colorBytes = generateTileColorBytes(tile);
          if (colorBytes) allColorBytesArrays.push(colorBytes);
      });
       if (allColorBytesArrays.length === 0) { alert("No color data generated for any tile."); return; }

      const totalLength = allColorBytesArrays.reduce((sum, arr) => sum + arr.length, 0);
      const combinedBytes = new Uint8Array(totalLength);
      let offset = 0;
      allColorBytesArrays.forEach(arr => {
          combinedBytes.set(arr, offset);
          offset += arr.length;
      });
      downloadBinaryFile(combinedBytes, tilesetFilename.replace(/\.json$/i, ''), "all_colors");
  };

  const editorLineHeight = MODAL_DEFAULT_FONT_SIZE * MODAL_LINE_HEIGHT_MULTIPLIER;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tileFileOpsModalTitle"
    >
      <div
        className="bg-msx-panelbg p-5 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="tileFileOpsModalTitle" className="text-xl font-semibold text-msx-highlight mb-4 pb-2 border-b border-msx-border">
          Tile File Operations
        </h2>

        <div className="flex-grow overflow-y-auto pr-2 space-y-4 text-sm">
          <Panel title="Tileset (JSON)" className="shadow-sm">
            <div className="p-3 space-y-3">
              <div className="flex items-center space-x-2">
                <label htmlFor="tilesetFilename" className="text-msx-textsecondary text-xs flex-shrink-0">Filename:</label>
                <input
                  type="text"
                  id="tilesetFilename"
                  value={tilesetFilename}
                  onChange={(e) => setTilesetFilename(e.target.value)}
                  className="p-1.5 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent flex-grow"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveTileset} variant="primary" size="sm" className="flex-1">Save All Tiles</Button>
                <Button onClick={handleLoadTilesetClick} variant="secondary" size="sm" className="flex-1">Load Tiles</Button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
              </div>
              <p className="text-[0.65rem] text-msx-textsecondary mt-1">Saves/Loads all tiles in the current project. Loading replaces existing tiles.</p>
            </div>
          </Panel>

          {currentTile && (
            <Panel title={`Export Current Tile: ${currentTile.name}`} className="shadow-sm">
              <div className="p-3 space-y-3">
                  {currentScreenMode === "SCREEN 2 (Graphics I)" && currentTileAsmCode && (
                    <>
                      <h4 className="text-xs text-msx-cyan">ASM (SCREEN 2)</h4>
                      <div className="max-h-60 overflow-hidden"> 
                         <Z80SyntaxHighlighter 
                            code={currentTileAsmCode} 
                            editorFontSize={MODAL_DEFAULT_FONT_SIZE}
                            editorLineHeight={editorLineHeight }
                         />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleCopyCurrentTileAsm} variant="secondary" size="sm" className="flex-1" disabled={!currentTileAsmCode}>Copy ASM</Button>
                        <Button onClick={handleDownloadCurrentTileAsm} variant="primary" size="sm" className="flex-1" disabled={!currentTileAsmCode}>Download .ASM</Button>
                      </div>
                    </>
                  )}
                 <h4 className="text-xs text-msx-cyan mt-2">Binary Data (.BIN)</h4>
                 <div className="flex space-x-2">
                    <Button onClick={handleDownloadCurrentTilePatternBIN} variant="primary" size="sm" className="flex-1">Pattern .BIN</Button>
                    {currentScreenMode === "SCREEN 2 (Graphics I)" && (
                        <Button onClick={handleDownloadCurrentTileColorBIN} variant="primary" size="sm" className="flex-1">Color .BIN</Button>
                    )}
                 </div>
                 <p className="text-[0.65rem] text-msx-textsecondary mt-1">Exports raw binary data for the current tile.
                    Pattern data is generated based on current screen mode. Color data is for SCREEN 2 only.
                 </p>
              </div>
            </Panel>
          )}

          <Panel title="Export All Tiles (Tileset)" className="shadow-sm">
              <div className="p-3 space-y-3">
                {currentScreenMode === "SCREEN 2 (Graphics I)" && (
                   <>
                    <h4 className="text-xs text-msx-cyan">ASM (SCREEN 2)</h4>
                    <Button onClick={handleGenerateTilesetAsm} variant="secondary" size="sm" className="w-full mb-2">
                      Generate Tileset ASM
                    </Button>
                    {tilesetAsmCode && (
                      <>
                        <div className="max-h-60 overflow-hidden">
                          <Z80SyntaxHighlighter 
                              code={tilesetAsmCode} 
                              editorFontSize={MODAL_DEFAULT_FONT_SIZE}
                              editorLineHeight={editorLineHeight}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleCopyTilesetAsm} variant="secondary" size="sm" className="flex-1">Copy ASM</Button>
                          <Button onClick={handleDownloadTilesetAsm} variant="primary" size="sm" className="flex-1">Download .ASM</Button>
                        </div>
                      </>
                    )}
                   </>
                )}
                <h4 className="text-xs text-msx-cyan mt-2">Binary Data (.BIN)</h4>
                <div className="flex space-x-2">
                    <Button onClick={handleDownloadAllPatternsBIN} variant="primary" size="sm" className="flex-1">All Patterns .BIN</Button>
                    {currentScreenMode === "SCREEN 2 (Graphics I)" && (
                        <Button onClick={handleDownloadAllColorsBIN} variant="primary" size="sm" className="flex-1">All Colors .BIN</Button>
                    )}
                 </div>
                 <p className="text-[0.65rem] text-msx-textsecondary mt-1">
                    Exports binary data for all tiles in the project. 
                    {currentScreenMode === "SCREEN 2 (Graphics I)" ? "Pattern and Color data specific to SCREEN 2." : "Pattern data only."}
                 </p>
              </div>
            </Panel>
        </div>

        <div className="mt-6 pt-4 border-t border-msx-border flex justify-end">
          <Button onClick={onClose} variant="primary" size="md">Close</Button>
        </div>
      </div>
    </div>
  );
};
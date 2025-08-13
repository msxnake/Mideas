

import React, { useState, useCallback, useEffect } from 'react';
import { MSXFont, MSXCharacterPattern, Point, MSXFontColorAttributes, MSXFontRowColorAttributes, MSX1ColorValue, DataFormat } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PencilIcon, SaveFloppyIcon, FolderOpenIcon, CodeIcon } from '../icons/MsxIcons'; 
import { DEFAULT_MSX_FONT, EDITABLE_CHAR_CODES_SUBSET, ALL_CHAR_CODES_FOR_SELECTOR } from '../utils/msxFontRenderer'; 
import { ExportFontASMModal } from '../modals/ExportFontASMModal';
import { MSX1_PALETTE_IDX_MAP, MSX1_PALETTE_MAP, DEFAULT_SCREEN2_BG_COLOR, DEFAULT_SCREEN2_FG_COLOR } from '../../constants';

const CHAR_WIDTH = 8;
const CHAR_HEIGHT = 8;


const PIXEL_ON_COLOR = '#FFFFFF'; 
const PIXEL_OFF_COLOR = '#000000'; 
const PREVIEW_PIXEL_ON_COLOR = '#74D07D'; 
const PREVIEW_PIXEL_OFF_COLOR = '#1A1A2E'; 

interface FontEditorProps {
  fontData: MSXFont;
  onUpdateFont: (newFont: MSXFont) => void;
  fontColorAttributes: MSXFontColorAttributes;
  onUpdateFontColorAttributes: (newFontColors: MSXFontColorAttributes) => void;
  currentScreenMode: string;
  selectedColor: MSX1ColorValue; // From the main MSX1Palette if in SCREEN 2
  dataOutputFormat: DataFormat; 
}

const SingleCharPreview: React.FC<{ 
    pattern: MSXCharacterPattern | undefined; 
    scale: number; 
    isSelected?: boolean;
    rowColors?: MSXFontRowColorAttributes; // Added for SCREEN 2
    currentScreenMode: string; // Added for SCREEN 2
}> = ({ pattern, scale, isSelected, rowColors, currentScreenMode }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, CHAR_WIDTH * scale, CHAR_HEIGHT * scale);
        const p = pattern || Array(8).fill(0); 
        
        const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";

        for (let y = 0; y < CHAR_HEIGHT; y++) {
          const rowByte = p[y];
          const fgForRow = (isScreen2 && rowColors && rowColors[y]) ? rowColors[y].fg : PREVIEW_PIXEL_ON_COLOR;
          const bgForRow = (isScreen2 && rowColors && rowColors[y]) ? rowColors[y].bg : PREVIEW_PIXEL_OFF_COLOR;

          for (let x = 0; x < CHAR_WIDTH; x++) {
            const isPixelSet = (rowByte >> (7 - x)) & 1;
            ctx.fillStyle = isPixelSet ? fgForRow : bgForRow;
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
        if (isSelected) {
            ctx.strokeStyle = '#E94560'; 
            ctx.lineWidth = Math.max(1, scale / 8);
            ctx.strokeRect(0, 0, CHAR_WIDTH * scale, CHAR_HEIGHT * scale);
        }
      }
    }
  }, [pattern, scale, isSelected, rowColors, currentScreenMode]);

  return <canvas ref={canvasRef} width={CHAR_WIDTH * scale} height={CHAR_HEIGHT * scale} className="border border-msx-border" />;
};


const FontPixelGrid: React.FC<{
  pattern: MSXCharacterPattern | undefined;
  onPixelToggle: (point: Point) => void;
  pixelSize: number;
  rowColors?: MSXFontRowColorAttributes; // Added for SCREEN 2
  currentScreenMode: string; // Added for SCREEN 2
}> = ({ pattern, onPixelToggle, pixelSize, rowColors, currentScreenMode }) => {
  const currentPattern = pattern || Array(8).fill(0);

  const handlePixelClick = (x: number, y: number) => {
    onPixelToggle({ x, y });
  };

  const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";
  const gridBgColor = isScreen2 ? undefined : PIXEL_OFF_COLOR; // Let individual cells define bg in S2

  return (
    <div
      className="grid border border-msx-border shadow-inner"
      style={{
        gridTemplateColumns: `repeat(${CHAR_WIDTH}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${CHAR_HEIGHT}, ${pixelSize}px)`,
        width: CHAR_WIDTH * pixelSize,
        height: CHAR_HEIGHT * pixelSize,
        imageRendering: 'pixelated',
        cursor: 'pointer',
        backgroundColor: gridBgColor, 
      }}
    >
      {currentPattern.flatMap((rowByte, y) =>
        Array.from({ length: CHAR_WIDTH }).map((_, x) => {
          const isPixelSet = (rowByte >> (7 - x)) & 1;
          let cellColor = isPixelSet ? PIXEL_ON_COLOR : PIXEL_OFF_COLOR;

          if (isScreen2 && rowColors && rowColors[y]) {
            cellColor = isPixelSet ? rowColors[y].fg : rowColors[y].bg;
          }

          return (
            <div
              key={`${x}-${y}`}
              className="hover:outline hover:outline-1 hover:outline-msx-highlight"
              style={{
                backgroundColor: cellColor,
                width: `${pixelSize}px`,
                height: `${pixelSize}px`,
              }}
              onClick={() => handlePixelClick(x, y)}
              role="button"
              aria-label={`Pixel ${x},${y} - ${isPixelSet ? 'On' : 'Off'}. Click to toggle.`}
            />
          );
        })
      )}
    </div>
  );
};

const generateFontASMCode = (
    fontPatterns: MSXFont, 
    fontColors: MSXFontColorAttributes | undefined,
    currentScreenMode: string,
    fontName: string = "CUSTOM_FONT",
    filterEditableCharsOnly: boolean,
    dataFormat: DataFormat // Added parameter
): string => {
  const safeFontName = fontName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  let asmString = `;; MSX Font Data: ${fontName}\n`;
  asmString += `;; Exported from MSX Retro Game IDE\n`;
  if (filterEditableCharsOnly) {
    asmString += `;; Includes only Space, 0-9, A-Z (if defined)\n`;
  } else {
    asmString += `;; Includes all 256 characters\n`;
  }
  asmString += `;; Mode: ${currentScreenMode}\n`;
  asmString += `;; Data Format: ${dataFormat.toUpperCase()}\n\n`;
  
  const defaultPattern = Array(8).fill(0x00);
  const codesToExport = filterEditableCharsOnly 
    ? EDITABLE_CHAR_CODES_SUBSET.map(ec => ec.code)
    : Array.from({ length: 256 }, (_, i) => i);

  const formatNumber = (value: number): string => {
    return dataFormat === 'hex' ? `#${value.toString(16).padStart(2, '0').toUpperCase()}` : value.toString(10);
  };

  asmString += `${safeFontName}_PATTERN_DATA:\n`;
  for (const charCode of codesToExport) {
    const pattern = fontPatterns[charCode] || DEFAULT_MSX_FONT[charCode] || defaultPattern;
    const charRepresentation = 
        (charCode >= 32 && charCode <= 126) 
        ? String.fromCharCode(charCode) 
        : (ALL_CHAR_CODES_FOR_SELECTOR.find(ec => ec.code === charCode)?.display || `ASCII ${charCode}`);
    
    asmString += `  ; Char ${charCode} (0x${charCode.toString(16).padStart(2, '0').toUpperCase()}) - ${charRepresentation} - PATTERN\n`;
    const patternValuesString = pattern.map(formatNumber).join(',');
    asmString += `    DB ${patternValuesString}\n`;
  }

  if (currentScreenMode === "SCREEN 2 (Graphics I)" && fontColors) {
    asmString += `\n${safeFontName}_COLOR_DATA:\n`;
    const defaultRowColors = Array(8).fill({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR });

    for (const charCode of codesToExport) {
      const charRepresentation = 
        (charCode >= 32 && charCode <= 126) 
        ? String.fromCharCode(charCode) 
        : (ALL_CHAR_CODES_FOR_SELECTOR.find(ec => ec.code === charCode)?.display || `ASCII ${charCode}`);

      const isNumeric = charCode >= 48 && charCode <= 57; // '0' - '9'
      const isAlpha = charCode >= 65 && charCode <= 90;   // 'A' - 'Z'
      
      let actualColorsToUseForByteGeneration = defaultRowColors;
      let commentSuffix = `COLOR (FG_idx << 4 | BG_idx)`;
      let shouldExportDataLine = false;

      if (isNumeric) {
          actualColorsToUseForByteGeneration = fontColors[48] || defaultRowColors;
          if (charCode === 48) { // '0'
              commentSuffix += ` - Shared for '0'-'9'`;
              shouldExportDataLine = true;
          } else { // '1' - '9'
              commentSuffix += ` - Uses '0' color data (defined by Char 48)`;
              shouldExportDataLine = false;
          }
      } else if (isAlpha) {
          actualColorsToUseForByteGeneration = fontColors[65] || defaultRowColors;
          if (charCode === 65) { // 'A'
              commentSuffix += ` - Shared for 'A'-'Z'`;
              shouldExportDataLine = true;
          } else { // 'B' - 'Z'
              commentSuffix += ` - Uses 'A' color data (defined by Char 65)`;
              shouldExportDataLine = false;
          }
      } else { // Other characters (Space, symbols, etc.)
          actualColorsToUseForByteGeneration = fontColors[charCode] || defaultRowColors;
          shouldExportDataLine = true;
      }

      asmString += `  ; Char ${charCode} (0x${charCode.toString(16).padStart(2, '0').toUpperCase()}) - ${charRepresentation} - ${commentSuffix}\n`;

      if (shouldExportDataLine) {
          const colorBytes = actualColorsToUseForByteGeneration.map(attr => {
              const fgIdx = MSX1_PALETTE_MAP.get(attr.fg)?.index ?? 15;
              const bgIdx = MSX1_PALETTE_MAP.get(attr.bg)?.index ?? 1;
              return (fgIdx << 4) | bgIdx;
          });
          const colorValuesString = colorBytes.map(formatNumber).join(',');
          asmString += `    DB ${colorValuesString}\n`;
      }
    }
  }
  return asmString;
};


export const FontEditor: React.FC<FontEditorProps> = ({ 
    fontData, onUpdateFont, 
    fontColorAttributes, onUpdateFontColorAttributes, 
    currentScreenMode, selectedColor, dataOutputFormat
}) => {
  const [selectedCharCode, setSelectedCharCode] = useState<number | null>(EDITABLE_CHAR_CODES_SUBSET[0]?.code || 32);
  const [zoom, setZoom] = useState(20);
  const [previewText, setPreviewText] = useState("ABC 123");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isExportAsmModalOpen, setIsExportAsmModalOpen] = useState(false);
  const [asmCodeToExport, setAsmCodeToExport] = useState("");
  const [fontNameToExport, setFontNameToExport] = useState("CustomMSXFont");
  const [filterEditableCharsOnly, setFilterEditableCharsOnly] = useState(true);

  const charCodesForSelector = filterEditableCharsOnly ? EDITABLE_CHAR_CODES_SUBSET : ALL_CHAR_CODES_FOR_SELECTOR;

  useEffect(() => {
    if (filterEditableCharsOnly && selectedCharCode !== null && !EDITABLE_CHAR_CODES_SUBSET.some(ec => ec.code === selectedCharCode)) {
        setSelectedCharCode(EDITABLE_CHAR_CODES_SUBSET[0]?.code || 32);
    } else if (!filterEditableCharsOnly && selectedCharCode === null && ALL_CHAR_CODES_FOR_SELECTOR.length > 0) {
        setSelectedCharCode(ALL_CHAR_CODES_FOR_SELECTOR[0].code);
    } else if (selectedCharCode === null && EDITABLE_CHAR_CODES_SUBSET.length > 0) {
        setSelectedCharCode(EDITABLE_CHAR_CODES_SUBSET[0].code || 32);
    }
  }, [filterEditableCharsOnly, selectedCharCode]);


  const currentPattern = selectedCharCode !== null ? fontData[selectedCharCode] : undefined;
  const currentCharColorAttributes = selectedCharCode !== null ? fontColorAttributes[selectedCharCode] : undefined;


  const handlePixelToggle = useCallback((point: Point) => {
    if (selectedCharCode === null) return;

    const newFontData = { ...fontData };
    let patternToUpdate = [...(newFontData[selectedCharCode] || Array(8).fill(0))];
    
    patternToUpdate[point.y] = patternToUpdate[point.y] ^ (1 << (7 - point.x));
    
    newFontData[selectedCharCode] = patternToUpdate;
    onUpdateFont(newFontData);
  }, [selectedCharCode, fontData, onUpdateFont]);

  const handleClearCharacter = () => {
    if (selectedCharCode === null) return;
    const newFontData = { ...fontData, [selectedCharCode]: Array(8).fill(0) };
    onUpdateFont(newFontData);
  };

  const handleInvertCharacter = () => {
    if (selectedCharCode === null) return;
    const existingPattern = fontData[selectedCharCode] || Array(8).fill(0);
    const invertedPattern = existingPattern.map(byte => ~byte & 0xFF); 
    const newFontData = { ...fontData, [selectedCharCode]: invertedPattern };
    onUpdateFont(newFontData);
  };

  const handleRowColorChange = (charToEdit: number, rowIndex: number, type: 'fg' | 'bg', color: MSX1ColorValue) => {
    const newFontColors = { ...fontColorAttributes };
    const charColors = [...(newFontColors[charToEdit] || Array(8).fill({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR }).map(c => ({...c})))]; // Deep copy row
    charColors[rowIndex] = { ...charColors[rowIndex], [type]: color };
    newFontColors[charToEdit] = charColors;
    onUpdateFontColorAttributes(newFontColors);
  };

  const handleApplyColorsToRange = (rangeType: 'numbers' | 'letters') => {
    if (selectedCharCode === null) {
      alert("Please select a source character first (e.g., '0' for numbers, 'A' for letters).");
      return;
    }
    
    const sourceCharColorAttributes = fontColorAttributes[selectedCharCode];
    if (!sourceCharColorAttributes && currentScreenMode === "SCREEN 2 (Graphics I)") {
        alert(`Row colors for the selected source character '${String.fromCharCode(selectedCharCode)}' are not defined. Please define them first or ensure they are initialized.`);
        return;
    }

    const codesToUpdate = rangeType === 'numbers' 
      ? Array.from({ length: 10 }, (_, i) => 48 + i) // 0-9
      : Array.from({ length: 26 }, (_, i) => 65 + i); // A-Z
    
    const anchorCharCode = rangeType === 'numbers' ? 48 : 65; // '0' or 'A'

    const newFontColors = { ...fontColorAttributes };
    const newFontData = { ...fontData };
    let patternsModified = false;

    codesToUpdate.forEach(code => {
      // Apply row colors from the selected source character
      if (currentScreenMode === "SCREEN 2 (Graphics I)" && sourceCharColorAttributes) {
        newFontColors[code] = JSON.parse(JSON.stringify(sourceCharColorAttributes)); 
      }

      // If the selected character is the anchor for this range, invert patterns of other characters in the range
      if (selectedCharCode === anchorCharCode && code !== selectedCharCode) {
        const targetOriginalPattern = newFontData[code] || DEFAULT_MSX_FONT[code] || Array(8).fill(0);
        const invertedTargetPattern = targetOriginalPattern.map(byte => ~byte & 0xFF);
        newFontData[code] = invertedTargetPattern;
        patternsModified = true;
      }
    });

    if (currentScreenMode === "SCREEN 2 (Graphics I)") {
      onUpdateFontColorAttributes(newFontColors);
    }
    if (patternsModified) {
      onUpdateFont(newFontData);
    }
    
    alert(`Row colors ${patternsModified ? 'and patterns ' : ''}applied to ${rangeType === 'numbers' ? '0-9' : 'A-Z'}.`);
  };
  
  const renderTextPreview = () => {
      if (!previewText) return null;
      const canvas = document.createElement('canvas');
      const scale = 2;
      const charSpacing = 1;
      const totalCharWidth = (CHAR_WIDTH + charSpacing) * scale;
      canvas.width = (previewText.length * totalCharWidth - (charSpacing * scale)) ;
      canvas.height = CHAR_HEIGHT * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.imageSmoothingEnabled = false;
      
      // Determine global background for the preview canvas itself.
      // If SCREEN 2, and the first character of previewText has its first row BG color defined, use that.
      // Otherwise, use PREVIEW_PIXEL_OFF_COLOR.
      let globalPreviewBg = PREVIEW_PIXEL_OFF_COLOR;
      if (currentScreenMode === "SCREEN 2 (Graphics I)") {
          const firstCharPreviewCode = previewText.charCodeAt(0);
          const firstCharColors = fontColorAttributes[firstCharPreviewCode];
          if (firstCharColors && firstCharColors[0]) {
              globalPreviewBg = firstCharColors[0].bg;
          }
      }
      ctx.fillStyle = globalPreviewBg;
      ctx.fillRect(0,0, canvas.width, canvas.height);


      for (let i = 0; i < previewText.length; i++) {
          const charCode = previewText.charCodeAt(i);
          const pattern = fontData[charCode] || DEFAULT_MSX_FONT[63] || Array(8).fill(0); 
          const charRowColors = (currentScreenMode === "SCREEN 2 (Graphics I)" && fontColorAttributes[charCode]) 
                                ? fontColorAttributes[charCode] 
                                : undefined;

          for (let y = 0; y < CHAR_HEIGHT; y++) {
              const rowByte = pattern[y];
              // Determine FG/BG for this specific row of this character
              const fgForRow = (charRowColors && charRowColors[y]) ? charRowColors[y].fg : PREVIEW_PIXEL_ON_COLOR; 
              const bgForRow = (charRowColors && charRowColors[y]) ? charRowColors[y].bg : globalPreviewBg; // Use global preview BG if char-specific not set
              
              for (let x = 0; x < CHAR_WIDTH; x++) {
                  const isPixelSet = (rowByte >> (7-x)) & 1;
                  ctx.fillStyle = isPixelSet ? fgForRow : bgForRow;
                  
                  // Only draw if pixel is set OR if the background color for this row/char is different from the global preview BG
                  if (isPixelSet || bgForRow !== globalPreviewBg) {
                     ctx.fillRect( (i * (CHAR_WIDTH + charSpacing) + x) * scale, y * scale, scale, scale);
                  }
              }
          }
      }
      return <img src={canvas.toDataURL()} alt="Text Preview" className="border border-msx-border" style={{imageRendering: 'pixelated', backgroundColor: globalPreviewBg }}/>;
  };

  const handleSaveFont = () => {
    const charsetWithStringKeys: Record<string, MSXCharacterPattern> = {};
    for (const charCode in fontData) {
        if (Object.prototype.hasOwnProperty.call(fontData, charCode)) {
            charsetWithStringKeys[String(charCode)] = fontData[Number(charCode)];
        }
    }

    const exportData: any = { // Use 'any' temporarily for flexibility
      name: "MSX Custom Font",
      description: "User-edited MSX character set from IDE.",
      format: "8 bytes per character",
      charset: charsetWithStringKeys,
    };

    if (currentScreenMode === "SCREEN 2 (Graphics I)" && Object.keys(fontColorAttributes).length > 0) {
        const colorAttrsWithStringKeys: Record<string, MSXFontRowColorAttributes> = {};
        for (const charCode in fontColorAttributes) {
            if (Object.prototype.hasOwnProperty.call(fontColorAttributes, charCode)) {
                colorAttrsWithStringKeys[String(charCode)] = fontColorAttributes[Number(charCode)];
            }
        }
        exportData.colorAttributes = colorAttrsWithStringKeys;
        exportData.description += " Includes SCREEN 2 row color attributes.";
    }


    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'msx-custom-font.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("Font saved as msx-custom-font.json");
  };

  const handleLoadFontClick = () => {
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

        if (!parsedJson || typeof parsedJson.charset !== 'object' || parsedJson.charset === null) {
          throw new Error("Invalid font file format: 'charset' object missing or invalid.");
        }
        
        const loadedFontPatterns: MSXFont = {};
        let fontFileBaseName = "CustomFont";
        if (typeof parsedJson.name === 'string' && parsedJson.name.trim() !== '') {
            fontFileBaseName = parsedJson.name.trim();
        } else if (file.name) {
            fontFileBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || "ImportedFont";
        }
        setFontNameToExport(fontFileBaseName);


        for (const key in parsedJson.charset) {
          if (Object.prototype.hasOwnProperty.call(parsedJson.charset, key)) {
            const charCode = parseInt(key, 10);
            const pattern = parsedJson.charset[key];
            if (!isNaN(charCode) && Array.isArray(pattern) && pattern.length === 8 && pattern.every(p => typeof p === 'number' && p >= 0 && p <= 255)) {
              loadedFontPatterns[charCode] = pattern as MSXCharacterPattern;
            } else {
              console.warn(`Skipping invalid character pattern data for key '${key}' in loaded font.`);
            }
          }
        }
        
        if (!loadedFontPatterns[63] && DEFAULT_MSX_FONT[63]) { // Ensure '?' exists
            loadedFontPatterns[63] = DEFAULT_MSX_FONT[63];
        }
        onUpdateFont(loadedFontPatterns);

        // Load color attributes if present and in SCREEN 2 mode
        const loadedFontColors: MSXFontColorAttributes = {};
        if (currentScreenMode === "SCREEN 2 (Graphics I)" && parsedJson.colorAttributes && typeof parsedJson.colorAttributes === 'object') {
            for (const key in parsedJson.colorAttributes) {
                 if (Object.prototype.hasOwnProperty.call(parsedJson.colorAttributes, key)) {
                    const charCode = parseInt(key, 10);
                    const rowColors = parsedJson.colorAttributes[key];
                    if (!isNaN(charCode) && Array.isArray(rowColors) && rowColors.length === 8 &&
                        rowColors.every(rc => typeof rc === 'object' && rc.fg && rc.bg && MSX1_PALETTE_MAP.has(rc.fg) && MSX1_PALETTE_MAP.has(rc.bg) )) {
                         loadedFontColors[charCode] = rowColors as MSXFontRowColorAttributes;
                    } else {
                        console.warn(`Skipping invalid character color attribute data for key '${key}'.`);
                    }
                 }
            }
        }
        // If no color attributes in file but in SCREEN 2, initialize with defaults
        if (currentScreenMode === "SCREEN 2 (Graphics I)" && Object.keys(loadedFontColors).length === 0) {
             const defaultRowColorsArray = Array(8).fill(null).map(() => ({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR })); // Ensure new objects
             for (const charCodeStr in loadedFontPatterns) {
                 const charCodeNum = Number(charCodeStr);
                 if (!isNaN(charCodeNum)) {
                     loadedFontColors[charCodeNum] = JSON.parse(JSON.stringify(defaultRowColorsArray));
                 }
             }
        }
        onUpdateFontColorAttributes(loadedFontColors);

        alert(`Font "${parsedJson.name || file.name}" loaded successfully!`);
      } catch (error) {
        console.error("Error loading or parsing font file:", error);
        alert(`Failed to load font: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
      alert("Error reading font file.");
       if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleOpenExportAsmModal = () => {
    const nameForExport = fontNameToExport || "MSX_FONT";
    const asm = generateFontASMCode(fontData, fontColorAttributes, currentScreenMode, nameForExport, filterEditableCharsOnly, dataOutputFormat);
    setAsmCodeToExport(asm);
    setIsExportAsmModalOpen(true);
  };


  return (
    <Panel title="MSX1 Font Editor" icon={<PencilIcon />} className="flex-grow flex flex-col bg-msx-bgcolor">
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} />
      <div className="p-2 border-b border-msx-border flex items-center space-x-2 flex-wrap gap-1">
        <Button onClick={handleSaveFont} size="sm" variant="secondary" icon={<SaveFloppyIcon />}>Save Font (.json)</Button>
        <Button onClick={handleLoadFontClick} size="sm" variant="secondary" icon={<FolderOpenIcon />}>Load Font (.json)</Button>
        <Button onClick={handleOpenExportAsmModal} size="sm" variant="secondary" icon={<CodeIcon />}>Export Font ASM</Button>
        <label className="flex items-center text-xs pixel-font text-msx-textsecondary ml-2">
            <input 
                type="checkbox" 
                checked={filterEditableCharsOnly} 
                onChange={(e) => setFilterEditableCharsOnly(e.target.checked)}
                className="mr-1 form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
            />
            Filter Editable (Space, 0-9, A-Z)
        </label>
        <div className="flex items-center space-x-1 ml-auto">
            <label htmlFor="fontExportName" className="text-xs pixel-font text-msx-textsecondary">ASM Label:</label>
            <input 
                type="text" 
                id="fontExportName"
                value={fontNameToExport} 
                onChange={(e) => setFontNameToExport(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="FontLabelForASM"
                className="p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent w-32"
            />
        </div>
      </div>
      <div className="flex flex-grow overflow-hidden">
        {/* Left: Character Selector */}
        <div className="w-48 p-2 border-r border-msx-border overflow-y-auto flex-shrink-0">
          <h4 className="text-sm pixel-font text-msx-highlight mb-2">Characters {filterEditableCharsOnly ? "(Editable Subset)" : "(All 256)"}</h4>
          <div className="grid grid-cols-8 gap-1">
            {charCodesForSelector.map(({ code, display }) => (
              <button
                key={code}
                onClick={() => setSelectedCharCode(code)}
                className={`p-0.5 border rounded text-[0.5rem] flex flex-col items-center justify-center aspect-square 
                            ${selectedCharCode === code ? 'bg-msx-accent text-white border-msx-accent' : 'bg-msx-panelbg text-msx-textsecondary border-msx-border hover:border-msx-highlight'}`}
                title={`Edit character '${display}' (ASCII: ${code})`}
              >
                <SingleCharPreview 
                    pattern={fontData[code]} 
                    scale={1.5} 
                    isSelected={selectedCharCode === code}
                    rowColors={currentScreenMode === "SCREEN 2 (Graphics I)" ? fontColorAttributes[code] : undefined}
                    currentScreenMode={currentScreenMode}
                />
                <span className="mt-0.5 truncate block w-full text-center" style={{maxWidth: '100%'}}>{display}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Pixel Editor & Controls */}
        <div className="flex-grow p-3 flex flex-col items-center justify-start"> {/* Changed to justify-start */}
          {selectedCharCode !== null ? (
            <>
              <div className="mb-2 flex items-center space-x-2">
                <span className="text-lg pixel-font text-msx-highlight">
                  Editing: '{charCodesForSelector.find(c => c.code === selectedCharCode)?.display || String.fromCharCode(selectedCharCode)}' (ASCII: {selectedCharCode})
                </span>
                <label htmlFor="fontZoom" className="text-xs pixel-font text-msx-textsecondary">Zoom:</label>
                <input type="range" id="fontZoom" min="10" max="40" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} className="w-24 accent-msx-accent" />
              </div>
              <FontPixelGrid 
                pattern={currentPattern} 
                onPixelToggle={handlePixelToggle} 
                pixelSize={zoom} 
                rowColors={currentCharColorAttributes}
                currentScreenMode={currentScreenMode}
              />
              <div className="mt-3 flex space-x-2">
                <Button onClick={handleClearCharacter} variant="danger" size="sm">Clear Char</Button>
                <Button onClick={handleInvertCharacter} variant="secondary" size="sm">Invert Char</Button>
              </div>
            </>
          ) : (
            <p className="text-msx-textsecondary mt-10">Select a character to edit.</p>
          )}
        </div>

        {/* Right: Color Attributes & Preview */}
        <div className="w-72 p-2 border-l border-msx-border flex-shrink-0 flex flex-col items-center space-y-3 overflow-y-auto">
            <h4 className="text-sm pixel-font text-msx-highlight">Character Pattern Preview</h4>
            {selectedCharCode !== null && 
                <SingleCharPreview 
                    pattern={currentPattern} 
                    scale={8} 
                    rowColors={currentCharColorAttributes}
                    currentScreenMode={currentScreenMode}
                />}
            
            {currentScreenMode === "SCREEN 2 (Graphics I)" && selectedCharCode !== null && (
              <div className="w-full mt-2">
                <h5 className="text-xs pixel-font text-msx-cyan mb-1 text-center">Row Colors (FG/BG)</h5>
                <div className="space-y-0.5">
                  {(currentCharColorAttributes || Array(8).fill({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR })).map((attr, rowIndex) => {
                     const fgColorObj = MSX1_PALETTE_MAP.get(attr.fg);
                     const bgColorObj = MSX1_PALETTE_MAP.get(attr.bg);
                     return (
                        <div key={rowIndex} className="flex items-center justify-between text-xs p-0.5 bg-msx-panelbg/50 rounded">
                            <span className="text-msx-textsecondary w-10">Row {rowIndex}:</span>
                            <button 
                                onClick={() => handleRowColorChange(selectedCharCode, rowIndex, 'fg', selectedColor)}
                                className="w-8 h-5 border border-msx-border rounded text-white text-[0.6rem] flex items-center justify-center" style={{backgroundColor: attr.fg}}
                                title={`Set FG to selected palette color. Current: ${fgColorObj?.name || attr.fg} (Idx ${fgColorObj?.index})`}>
                                {fgColorObj?.index}
                            </button>
                            <button 
                                onClick={() => handleRowColorChange(selectedCharCode, rowIndex, 'bg', selectedColor)}
                                className="w-8 h-5 border border-msx-border rounded text-white text-[0.6rem] flex items-center justify-center" style={{backgroundColor: attr.bg}}
                                title={`Set BG to selected palette color. Current: ${bgColorObj?.name || attr.bg} (Idx ${bgColorObj?.index})`}>
                                {bgColorObj?.index}
                            </button>
                        </div>
                     );
                  })}
                </div>
                <div className="mt-2 flex flex-col space-y-1">
                    <Button onClick={() => handleApplyColorsToRange('numbers')} size="sm" variant="ghost" className="text-xs" disabled={!currentCharColorAttributes || ![48].includes(selectedCharCode)}>Apply Row Colors to 0-9</Button>
                    <Button onClick={() => handleApplyColorsToRange('letters')} size="sm" variant="ghost" className="text-xs" disabled={!currentCharColorAttributes || ![65].includes(selectedCharCode)}>Apply Row Colors to A-Z</Button>
                </div>
              </div>
            )}
            
            <h4 className="text-sm pixel-font text-msx-highlight mt-2">Text String Preview</h4>
            <input 
                type="text" 
                value={previewText} 
                onChange={(e) => setPreviewText(e.target.value.toUpperCase())} 
                className="w-full p-1.5 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
                placeholder="Type to preview..."
                maxLength={20}
            />
            <div className="p-1 border border-msx-border rounded min-h-[32px] w-full flex justify-center" 
                 style={{backgroundColor: PREVIEW_PIXEL_OFF_COLOR }}>
                {renderTextPreview()}
            </div>
        </div>
      </div>
      {isExportAsmModalOpen && (
        <ExportFontASMModal
          isOpen={isExportAsmModalOpen}
          onClose={() => setIsExportAsmModalOpen(false)}
          fontName={fontNameToExport || "CustomMSXFont"}
          asmCode={asmCodeToExport}
          fontData={fontData}
          fontColorAttributes={fontColorAttributes}
          filterEditableCharsOnly={filterEditableCharsOnly}
          currentScreenMode={currentScreenMode}
        />
      )}
    </Panel>
  );
};
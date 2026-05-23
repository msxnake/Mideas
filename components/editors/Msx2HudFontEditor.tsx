import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DataFormat, Msx2HudFontAsset, Point } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { CodeIcon, FolderOpenIcon, LoadIcon, PencilIcon, SaveFloppyIcon } from '../icons/MsxIcons';

const CHAR_WIDTH = 8;
const CHAR_HEIGHT = 8;
const SUPPORTED_CHARS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-/';
const ZX_ASCII_FIRST = 0x20;
const ZX_ASCII_GLYPH_COUNT = 96;
const ZX_ASCII_CHARS = Array.from({ length: ZX_ASCII_GLYPH_COUNT }, (_unused, index) =>
  String.fromCharCode(ZX_ASCII_FIRST + index)
).join('');
const MSX2_DEFAULT_PALETTE_HEX = [
  '#000000', '#000000', '#24DB24', '#6DFF6D',
  '#2424FF', '#496DFF', '#B62424', '#49DBFF',
  '#FF2424', '#FF6D6D', '#DBDB24', '#DBDB92',
  '#249224', '#DB49B6', '#B6B6B6', '#FFFFFF',
];

interface Msx2HudFontEditorProps {
  font: Msx2HudFontAsset;
  onUpdate: (data: Partial<Msx2HudFontAsset>) => void;
  dataOutputFormat: DataFormat;
}

const normalizePattern = (pattern: unknown): number[] => {
  if (!Array.isArray(pattern)) return Array(8).fill(0);
  return Array.from({ length: 8 }, (_unused, index) =>
    Math.max(0, Math.min(255, Number(pattern[index]) || 0))
  );
};

const formatByte = (value: number, dataOutputFormat: DataFormat): string => (
  dataOutputFormat === 'hex'
    ? `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`
    : String(value & 0xff)
);

const msx2PaletteHex = (slot: number): string => MSX2_DEFAULT_PALETTE_HEX[slot & 0x0f] || '#000000';

const SingleCharPreview: React.FC<{ pattern: number[]; scale: number; colorByte: number; isSelected?: boolean }> = ({
  pattern,
  scale,
  colorByte,
  isSelected,
}) => {
  const fg = msx2PaletteHex((colorByte >> 4) & 0x0f);
  const bg = msx2PaletteHex(colorByte & 0x0f);

  return (
    <div
      className={`grid border ${isSelected ? 'border-msx-danger' : 'border-msx-border'}`}
      style={{
        gridTemplateColumns: `repeat(8, ${scale}px)`,
        gridTemplateRows: `repeat(8, ${scale}px)`,
        width: CHAR_WIDTH * scale,
        height: CHAR_HEIGHT * scale,
        imageRendering: 'pixelated',
      }}
    >
      {Array.from({ length: 64 }, (_unused, index) => {
        const y = Math.floor(index / 8);
        const x = index % 8;
        const lit = Boolean((pattern[y] || 0) & (0x80 >> x));
        return <div key={index} style={{ backgroundColor: lit ? fg : bg }} />;
      })}
    </div>
  );
};

const FontPixelGrid: React.FC<{
  pattern: number[];
  onPixelToggle: (point: Point) => void;
  pixelSize: number;
  colorByte: number;
}> = ({ pattern, onPixelToggle, pixelSize, colorByte }) => {
  const fg = msx2PaletteHex((colorByte >> 4) & 0x0f);
  const bg = msx2PaletteHex(colorByte & 0x0f);

  return (
    <div
      className="grid border border-msx-border shadow-inner"
      style={{
        gridTemplateColumns: `repeat(8, ${pixelSize}px)`,
        gridTemplateRows: `repeat(8, ${pixelSize}px)`,
        width: CHAR_WIDTH * pixelSize,
        height: CHAR_HEIGHT * pixelSize,
        imageRendering: 'pixelated',
        cursor: 'pointer',
      }}
    >
      {Array.from({ length: 64 }, (_unused, index) => {
        const y = Math.floor(index / 8);
        const x = index % 8;
        const lit = Boolean((pattern[y] || 0) & (0x80 >> x));
        return (
          <button
            key={index}
            type="button"
            className="hover:outline hover:outline-1 hover:outline-msx-highlight"
            style={{ backgroundColor: lit ? fg : bg, width: pixelSize, height: pixelSize }}
            onClick={() => onPixelToggle({ x, y })}
            aria-label={`MSX2 HUD font pixel ${x},${y} ${lit ? 'on' : 'off'}`}
          />
        );
      })}
    </div>
  );
};

export const Msx2HudFontEditor: React.FC<Msx2HudFontEditorProps> = ({ font, onUpdate, dataOutputFormat }) => {
  const characters = useMemo(() => Array.from(font.characters || SUPPORTED_CHARS), [font.characters]);
  const [selectedChar, setSelectedChar] = useState(characters[0] || ' ');
  const [zoom, setZoom] = useState(20);
  const [previewText, setPreviewText] = useState('ROOM 1 000');
  const [showAsm, setShowAsm] = useState(false);
  const [rasterFontSize, setRasterFontSize] = useState(8);
  const [rasterOffsetX, setRasterOffsetX] = useState(0);
  const [rasterOffsetY, setRasterOffsetY] = useState(0);
  const [rasterThreshold, setRasterThreshold] = useState(80);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const zxBinaryInputRef = useRef<HTMLInputElement>(null);

  const colorByte = Math.max(0, Math.min(255, Number(font.colorByte ?? 0xF1) || 0xF1));
  const currentPattern = normalizePattern(font.patterns?.[selectedChar]);
  const fg = (colorByte >> 4) & 0x0f;
  const bg = colorByte & 0x0f;

  const updatePattern = useCallback((char: string, pattern: number[]) => {
    onUpdate({
      patterns: {
        ...(font.patterns || {}),
        [char]: normalizePattern(pattern),
      },
    });
  }, [font.patterns, onUpdate]);

  const handlePixelToggle = useCallback((point: Point) => {
    const next = [...currentPattern];
    next[point.y] = next[point.y] ^ (1 << (7 - point.x));
    updatePattern(selectedChar, next);
  }, [currentPattern, selectedChar, updatePattern]);

  const handleClearCharacter = () => updatePattern(selectedChar, Array(8).fill(0));
  const handleInvertCharacter = () => updatePattern(selectedChar, currentPattern.map(byte => (~byte) & 0xff));
  const handleShift = (dx: number, dy: number) => {
    const next = Array(8).fill(0);
    for (let y = 0; y < 8; y++) {
      const sourceY = y - dy;
      if (sourceY < 0 || sourceY > 7) continue;
      for (let x = 0; x < 8; x++) {
        const sourceX = x - dx;
        if (sourceX < 0 || sourceX > 7) continue;
        if ((currentPattern[sourceY] || 0) & (0x80 >> sourceX)) {
          next[y] |= (0x80 >> x);
        }
      }
    }
    updatePattern(selectedChar, next);
  };

  const updateColorByte = (nextFg = fg, nextBg = bg) => {
    onUpdate({ colorByte: ((nextFg & 0x0f) << 4) | (nextBg & 0x0f) });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(font, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'msx2-hud-font.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const nextCharacters = String(parsed.characters || font.characters || SUPPORTED_CHARS);
        const nextPatterns: Record<string, number[]> = {};
        Array.from(nextCharacters).forEach(char => {
          nextPatterns[char] = normalizePattern(parsed.patterns?.[char] || font.patterns?.[char]);
        });
        onUpdate({
          target: 'MSX2',
          vdpMode: 'SCREEN4',
          baseChar: Math.max(0, Math.min(255, Number(parsed.baseChar ?? font.baseChar ?? 0xC0))),
          characters: nextCharacters,
          patterns: nextPatterns,
          colorByte: Math.max(0, Math.min(255, Number(parsed.colorByte ?? font.colorByte ?? 0xF1))),
          notes: String(parsed.notes || font.notes || ''),
        });
      } catch (error) {
        alert(`Failed to load MSX2 HUD font: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const rasterizeGlyph = useCallback((ctx: CanvasRenderingContext2D, char: string, scale: number): number[] => {
    if (char === ' ') return Array(8).fill(0);
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#fff';
    ctx.font = `${rasterFontSize}px "MSX2HudImportedFont", monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(char, rasterOffsetX, rasterOffsetY);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const pattern = Array(8).fill(0);
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        let alphaTotal = 0;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = gx * scale + sx;
            const py = gy * scale + sy;
            alphaTotal += imageData[((py * canvas.width + px) * 4) + 3];
          }
        }
        const alphaAverage = alphaTotal / (scale * scale);
        if (alphaAverage >= rasterThreshold) {
          pattern[gy] |= (0x80 >> gx);
        }
      }
    }
    return pattern;
  }, [rasterFontSize, rasterOffsetX, rasterOffsetY, rasterThreshold]);

  const handleFontFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fontBytes = reader.result as ArrayBuffer;
        const importedFace = new FontFace('MSX2HudImportedFont', fontBytes);
        const loadedFace = await importedFace.load();
        document.fonts.add(loadedFace);
        await document.fonts.ready;

        const scale = 8;
        const canvas = document.createElement('canvas');
        canvas.width = 8 * scale;
        canvas.height = 8 * scale;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Canvas 2D context is not available.');

        const nextPatterns: Record<string, number[]> = {};
        characters.forEach(char => {
          nextPatterns[char] = rasterizeGlyph(ctx, char, scale);
        });

        onUpdate({
          patterns: nextPatterns,
          notes: `Imported from ${file.name} at ${rasterFontSize}px, offset ${rasterOffsetX},${rasterOffsetY}, threshold ${rasterThreshold}.`,
        });
        setImportStatus(`Imported ${characters.length} glyphs from ${file.name}`);
        document.fonts.delete(loadedFace);
      } catch (error) {
        setImportStatus(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (fontFileInputRef.current) fontFileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleZxBinarySelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        if (bytes.length < 8 || bytes.length % 8 !== 0) {
          throw new Error('ZX font binary must contain 8 bytes per glyph.');
        }
        const glyphCount = Math.min(ZX_ASCII_GLYPH_COUNT, Math.floor(bytes.length / 8));
        const nextCharacters = ZX_ASCII_CHARS.slice(0, glyphCount);
        const nextPatterns: Record<string, number[]> = {};
        Array.from(nextCharacters).forEach((char, charIndex) => {
          const offset = charIndex * 8;
          nextPatterns[char] = Array.from(bytes.slice(offset, offset + 8));
        });
        onUpdate({
          baseChar: ZX_ASCII_FIRST,
          characters: nextCharacters,
          patterns: nextPatterns,
          notes: `Imported ZX bitmap font from ${file.name}: ${glyphCount} glyphs, first source glyph is ASCII #20 SPACE.`,
        });
        setSelectedChar(' ');
        setPreviewText('SCORE 000 ROOM 1');
        setImportStatus(`Imported ZX binary ${file.name}: ASCII #20-#${(ZX_ASCII_FIRST + glyphCount - 1).toString(16).toUpperCase()}`);
      } catch (error) {
        setImportStatus(`ZX import failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (zxBinaryInputRef.current) zxBinaryInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const renderPreviewGlyphs = () => Array.from(previewText.toUpperCase()).map((char, index) => {
    const fallback = font.patterns?.[' '] || [];
    return (
      <SingleCharPreview
        key={`${char}-${index}`}
        pattern={normalizePattern(font.patterns?.[char] || fallback)}
        scale={3}
        colorByte={colorByte}
      />
    );
  });

  const asmCode = useMemo(() => {
    const patternBytes = characters.flatMap(char => normalizePattern(font.patterns?.[char]));
    const colorBytes = Array(patternBytes.length).fill(colorByte);
    return [
      '; MSX2 SCREEN 4 HUD font',
      `; Base char: ${formatByte(font.baseChar || 0xC0, dataOutputFormat)}`,
      'MSX2_HUD_FONT_PATTERNS:',
      `    DB ${patternBytes.map(value => formatByte(value, dataOutputFormat)).join(',')}`,
      'MSX2_HUD_FONT_COLORS:',
      `    DB ${colorBytes.map(value => formatByte(value, dataOutputFormat)).join(',')}`,
    ].join('\n');
  }, [characters, colorByte, dataOutputFormat, font.baseChar, font.patterns]);

  return (
    <Panel title="MSX2 HUD Font Editor" icon={<PencilIcon />} className="flex-grow flex flex-col bg-msx-bgcolor">
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} />
      <input type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" ref={fontFileInputRef} onChange={handleFontFileSelected} style={{ display: 'none' }} />
      <input type="file" accept=".ch8,.bin,.fnt,.raw,application/octet-stream" ref={zxBinaryInputRef} onChange={handleZxBinarySelected} style={{ display: 'none' }} />
      <div className="p-2 border-b border-msx-border flex items-center space-x-2 flex-wrap gap-1">
        <Button onClick={exportJson} size="sm" variant="secondary" icon={<SaveFloppyIcon />}>Save Font (.json)</Button>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="secondary" icon={<FolderOpenIcon />}>Load Font (.json)</Button>
        <Button onClick={() => fontFileInputRef.current?.click()} size="sm" variant="secondary" icon={<LoadIcon />}>Import TTF</Button>
        <Button onClick={() => zxBinaryInputRef.current?.click()} size="sm" variant="secondary" icon={<LoadIcon />}>Import ZX .ch8</Button>
        <Button onClick={() => setShowAsm(value => !value)} size="sm" variant="secondary" icon={<CodeIcon />}>Export Font ASM</Button>
        <div className="flex items-center gap-2 ml-auto text-xs text-msx-textsecondary">
          <span>Mode: {font.vdpMode}</span>
          <span>Base: #{(font.baseChar || 0xC0).toString(16).toUpperCase().padStart(2, '0')}</span>
          <span>Glyphs: {characters.length}</span>
        </div>
      </div>

      <div className="flex flex-grow overflow-hidden" style={{ userSelect: 'none' }}>
        <div className="w-48 border-r border-msx-border flex-shrink-0 flex flex-col min-h-0">
          <div className="p-2 flex-shrink-0">
            <h4 className="text-sm pixel-font text-msx-highlight mb-2">HUD Characters</h4>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
            <div className="grid grid-cols-8 gap-1">
              {characters.map(char => (
                <button
                  key={char === ' ' ? 'space' : char}
                  onClick={() => setSelectedChar(char)}
                  className={`p-0.5 border rounded text-[0.5rem] flex flex-col items-center justify-center aspect-square ${
                    selectedChar === char ? 'bg-msx-accent text-white border-msx-accent' : 'bg-msx-panelbg text-msx-textsecondary border-msx-border hover:border-msx-highlight'
                  }`}
                  title={`Edit MSX2 HUD character ${char === ' ' ? 'space' : char}`}
                >
                  <SingleCharPreview pattern={normalizePattern(font.patterns?.[char])} scale={1.5} colorByte={colorByte} isSelected={selectedChar === char} />
                  <span className="mt-0.5 truncate block w-full text-center">{char === ' ' ? 'SP' : char}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-grow p-3 flex flex-col items-center justify-start overflow-y-auto">
          <div className="mb-2 flex items-center space-x-2">
            <span className="text-lg pixel-font text-msx-highlight">Editing: {selectedChar === ' ' ? 'Space' : selectedChar}</span>
            <label htmlFor="msx2HudFontZoom" className="text-xs pixel-font text-msx-textsecondary">Zoom:</label>
            <input id="msx2HudFontZoom" type="range" min="10" max="40" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-24 accent-msx-accent" />
          </div>
          <FontPixelGrid pattern={currentPattern} onPixelToggle={handlePixelToggle} pixelSize={zoom} colorByte={colorByte} />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button onClick={handleClearCharacter} variant="danger" size="sm">Clear Char</Button>
            <Button onClick={handleInvertCharacter} variant="secondary" size="sm">Invert Char</Button>
            <Button onClick={() => handleShift(-1, 0)} variant="secondary" size="sm">Shift Left</Button>
            <Button onClick={() => handleShift(1, 0)} variant="secondary" size="sm">Shift Right</Button>
            <Button onClick={() => handleShift(0, -1)} variant="secondary" size="sm">Shift Up</Button>
            <Button onClick={() => handleShift(0, 1)} variant="secondary" size="sm">Shift Down</Button>
          </div>
          {showAsm && (
            <textarea
              readOnly
              value={asmCode}
              className="mt-4 w-full max-w-3xl h-48 bg-msx-panelbg border border-msx-border rounded p-2 text-xs font-mono text-msx-textprimary"
            />
          )}
        </div>

        <div className="w-72 p-2 border-l border-msx-border flex-shrink-0 flex flex-col items-center space-y-3 overflow-y-auto">
          <h4 className="text-sm pixel-font text-msx-highlight">Character Preview</h4>
          <SingleCharPreview pattern={currentPattern} scale={8} colorByte={colorByte} />

          <div className="w-full">
            <h5 className="text-xs pixel-font text-msx-cyan mb-1 text-center">SCREEN 4 Color Byte</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center justify-between gap-2">
                <span>FG</span>
                <input type="number" min={0} max={15} value={fg} onChange={(event) => updateColorByte(Number(event.target.value), bg)} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>BG</span>
                <input type="number" min={0} max={15} value={bg} onChange={(event) => updateColorByte(fg, Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
            </div>
            <div className="mt-2 text-center text-xs text-msx-textsecondary">byte {formatByte(colorByte, dataOutputFormat)}</div>
          </div>

          <div className="w-full border-t border-msx-border pt-3">
            <h5 className="text-xs pixel-font text-msx-cyan mb-2 text-center">TTF Rasterizer</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center justify-between gap-2">
                <span>Size</span>
                <input type="number" min={5} max={16} value={rasterFontSize} onChange={(event) => setRasterFontSize(Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>Thresh</span>
                <input type="number" min={1} max={255} value={rasterThreshold} onChange={(event) => setRasterThreshold(Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>X</span>
                <input type="number" min={-8} max={8} value={rasterOffsetX} onChange={(event) => setRasterOffsetX(Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>Y</span>
                <input type="number" min={-8} max={8} value={rasterOffsetY} onChange={(event) => setRasterOffsetY(Number(event.target.value))} className="w-16 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5" />
              </label>
            </div>
            {importStatus && <p className="mt-2 text-[0.65rem] text-msx-textsecondary">{importStatus}</p>}
          </div>

          <h4 className="text-sm pixel-font text-msx-highlight mt-2">Text String Preview</h4>
          <input
            type="text"
            value={previewText}
            onChange={(event) => setPreviewText(event.target.value.toUpperCase())}
            className="w-full p-1.5 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            placeholder="Type to preview..."
            maxLength={20}
          />
          <div className="p-1 border border-msx-border rounded min-h-[32px] w-full flex flex-wrap gap-px justify-center bg-black">
            {renderPreviewGlyphs()}
          </div>
          {font.notes && <p className="text-[0.65rem] text-msx-textsecondary">{font.notes}</p>}
        </div>
      </div>
    </Panel>
  );
};

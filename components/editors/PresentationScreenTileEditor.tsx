import React, { useEffect, useMemo, useState } from 'react';
import { MSX1_PALETTE } from '../../constants';
import {
  PresentationScreenEditMode,
  PresentationScreenEditableTile,
} from '../../types';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { Modal } from '../modals/Modal';

interface PresentationScreenTileEditorProps {
  isOpen: boolean;
  tile: PresentationScreenEditableTile | null;
  onClose: () => void;
  onSave: (payload: {
    patternBytes: number[];
    colorBytes: number[];
    mode: PresentationScreenEditMode;
  }) => void;
}

const TILE_SIZE = 8;
const DEFAULT_BULK_FG = 15;
const DEFAULT_BULK_BG = 1;

function clampNibble(value: number): number {
  return Math.max(0, Math.min(15, Math.round(value))) & 0x0f;
}

function readRowColors(colorByte: number): { fg: number; bg: number } {
  return {
    fg: (colorByte >> 4) & 0x0f,
    bg: colorByte & 0x0f,
  };
}

function writeRowColors(fg: number, bg: number): number {
  return ((clampNibble(fg) << 4) | clampNibble(bg)) & 0xff;
}

function togglePatternBit(patternByte: number, x: number): number {
  return patternByte ^ (0x80 >> x);
}

const paletteEntries = MSX1_PALETTE.map(color => ({
  ...color,
  cssColor: color.index === 0 ? '#111111' : color.hex,
}));

/** Small color swatch used in the row table */
const RowSwatch: React.FC<{
  colorIndex: number;
  active: boolean;
  onClick: () => void;
  title: string;
}> = ({ colorIndex, active, onClick, title }) => {
  const color = paletteEntries.find(e => e.index === colorIndex) ?? paletteEntries[0];
  const textClass = colorIndex === 11 || colorIndex === 14 || colorIndex === 15 ? 'text-black' : 'text-white';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`relative w-7 h-7 rounded border transition-all text-[10px] font-bold ${active ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border hover:border-msx-textsecondary'} ${textClass}`}
      style={{ backgroundColor: color.cssColor }}
    >
      {colorIndex}
      {colorIndex === 0 && (
        <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.45)_45%,rgba(255,255,255,0.45)_55%,transparent_55%)]" />
      )}
    </button>
  );
};

/** Full palette picker — shared selector */
const PalettePicker: React.FC<{
  selected: number;
  onSelect: (idx: number) => void;
  label: string;
}> = ({ selected, onSelect, label }) => {
  return (
    <div className="space-y-1">
      <div className="text-[11px] text-msx-textsecondary">{label}</div>
      <div className="grid grid-cols-8 gap-[3px]">
        {paletteEntries.map(color => {
          const textClass = color.index === 11 || color.index === 14 || color.index === 15 ? 'text-black' : 'text-white';
          return (
            <button
              key={color.index}
              type="button"
              onClick={() => onSelect(color.index)}
              title={`${color.index} - ${color.name}`}
              className={`relative h-7 rounded border transition-all text-[10px] font-bold ${textClass} ${selected === color.index ? 'border-msx-highlight ring-1 ring-msx-highlight scale-[1.05]' : 'border-msx-border hover:border-msx-textsecondary'}`}
              style={{ backgroundColor: color.cssColor }}
            >
              {color.index}
              {color.index === 0 && (
                <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.45)_45%,rgba(255,255,255,0.45)_55%,transparent_55%)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PresentationScreenTileEditor: React.FC<PresentationScreenTileEditorProps> = ({
  isOpen,
  tile,
  onClose,
  onSave,
}) => {
  const [patternBytes, setPatternBytes] = useState<number[]>(Array(TILE_SIZE).fill(0));
  const [colorBytes, setColorBytes] = useState<number[]>(Array(TILE_SIZE).fill(0x11));
  const [editMode, setEditMode] = useState<PresentationScreenEditMode>('single');

  // Shared palette state — one selected color, one active channel
  const [selectedColor, setSelectedColor] = useState<number>(DEFAULT_BULK_FG);
  const [paintChannel, setPaintChannel] = useState<'fg' | 'bg'>('fg');

  useEffect(() => {
    if (!tile) return;
    setPatternBytes(tile.patternBytes.slice(0, TILE_SIZE));
    setColorBytes(tile.colorBytes.slice(0, TILE_SIZE));
    setEditMode(tile.charUsageCount > 1 ? 'single' : 'shared');
    const firstRowColors = readRowColors(tile.colorBytes[0] ?? 0x11);
    setSelectedColor(paintChannel === 'fg' ? firstRowColors.fg : firstRowColors.bg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile]);

  const sharedLabel = useMemo(() => {
    if (!tile || tile.charUsageCount <= 1) return 'Char exclusivo';
    return `Char compartido por ${tile.charUsageCount} celdas`;
  }, [tile]);

  if (!tile) return null;

  const handlePixelClick = (x: number, y: number) => {
    setPatternBytes(prev => {
      const next = [...prev];
      next[y] = togglePatternBit(next[y] ?? 0, x) & 0xff;
      return next;
    });
  };

  /** Apply selectedColor to a specific row + channel */
  const handleRowSwatchClick = (row: number, channel: 'fg' | 'bg') => {
    setColorBytes(prev => {
      const next = [...prev];
      const current = readRowColors(next[row] ?? 0);
      next[row] = writeRowColors(
        channel === 'fg' ? selectedColor : current.fg,
        channel === 'bg' ? selectedColor : current.bg,
      );
      return next;
    });
  };

  /** Apply selectedColor to all rows for paintChannel */
  const handleFillAll = (channel: 'fg' | 'bg') => {
    setColorBytes(prev => prev.map(colorByte => {
      const current = readRowColors(colorByte ?? 0);
      return writeRowColors(
        channel === 'fg' ? selectedColor : current.fg,
        channel === 'bg' ? selectedColor : current.bg,
      );
    }));
  };

  const handleReset = () => {
    setPatternBytes(tile.patternBytes.slice(0, TILE_SIZE));
    setColorBytes(tile.colorBytes.slice(0, TILE_SIZE));
    setEditMode(tile.charUsageCount > 1 ? 'single' : 'shared');
    const firstRowColors = readRowColors(tile.colorBytes[0] ?? 0x11);
    setSelectedColor(firstRowColors.fg);
    setPaintChannel('fg');
  };

  const handleSave = () => {
    onSave({
      patternBytes,
      colorBytes,
      mode: tile.charUsageCount > 1 ? editMode : 'shared',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Tile (${tile.cell.x}, ${tile.cell.y})`}
    >
      <div className="w-[min(92vw,760px)] space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-4 items-start">
          {/* ── Left: Pixel canvas ── */}
          <Panel title="Pixels" bodyClassName="p-3">
            <div
              className="grid border border-msx-border bg-black"
              style={{
                gridTemplateColumns: `repeat(${TILE_SIZE}, 28px)`,
                gridTemplateRows: `repeat(${TILE_SIZE}, 28px)`,
              }}
            >
              {patternBytes.flatMap((patternByte, y) =>
                Array.from({ length: TILE_SIZE }).map((_, x) => {
                  const colors = readRowColors(colorBytes[y] ?? 0);
                  const isSet = (patternByte & (0x80 >> x)) !== 0;
                  const colorIndex = isSet ? colors.fg : colors.bg;
                  const swatch = MSX1_PALETTE.find(entry => entry.index === colorIndex)?.hex ?? '#000000';
                  return (
                    <button
                      key={`${x}-${y}`}
                      type="button"
                      className="border border-black/30 hover:outline hover:outline-1 hover:outline-msx-highlight"
                      style={{ width: 28, height: 28, backgroundColor: swatch }}
                      onClick={() => handlePixelClick(x, y)}
                      title={`Pixel ${x},${y}`}
                    />
                  );
                }),
              )}
            </div>
            <div className="mt-3 text-xs text-msx-textsecondary space-y-0.5">
              <div>Char: {tile.charCode} · Bank: {tile.bank}</div>
              <div>{sharedLabel}</div>
            </div>
          </Panel>

          {/* ── Right: Compact color editor ── */}
          <div className="space-y-3">
            {/* Shared palette */}
            <Panel title="Color Palette" bodyClassName="p-3 space-y-3">
              <PalettePicker
                selected={selectedColor}
                onSelect={setSelectedColor}
                label="Selected color (click a row swatch to apply)"
              />

              {/* Channel toggle + Fill All */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-msx-textsecondary">Paint:</span>
                <button
                  type="button"
                  onClick={() => setPaintChannel('fg')}
                  className={`px-3 py-1 rounded text-xs border transition-all ${paintChannel === 'fg' ? 'bg-msx-highlight border-msx-highlight text-black font-bold' : 'border-msx-border text-msx-textsecondary hover:border-msx-textsecondary'}`}
                >
                  FG
                </button>
                <button
                  type="button"
                  onClick={() => setPaintChannel('bg')}
                  className={`px-3 py-1 rounded text-xs border transition-all ${paintChannel === 'bg' ? 'bg-msx-highlight border-msx-highlight text-black font-bold' : 'border-msx-border text-msx-textsecondary hover:border-msx-textsecondary'}`}
                >
                  BG
                </button>
                <Button size="sm" variant="secondary" onClick={() => handleFillAll('fg')}>
                  Fill All FG
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleFillAll('bg')}>
                  Fill All BG
                </Button>
              </div>
            </Panel>

            {/* Compact row table */}
            <Panel title="Row Colors" bodyClassName="p-2">
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-[2rem_auto_auto] items-center gap-2 px-1 text-[11px] text-msx-textsecondary">
                  <span>Row</span>
                  <span className="text-center">FG</span>
                  <span className="text-center">BG</span>
                </div>

                {colorBytes.map((colorByte, row) => {
                  const { fg, bg } = readRowColors(colorByte ?? 0);
                  return (
                    <div
                      key={row}
                      className="grid grid-cols-[2rem_auto_auto] items-center gap-2 px-1 rounded hover:bg-msx-bg"
                    >
                      <span className="text-xs text-msx-textsecondary text-center">{row}</span>
                      <RowSwatch
                        colorIndex={fg}
                        active={false}
                        onClick={() => handleRowSwatchClick(row, 'fg')}
                        title={`R${row} FG = ${fg} — click to set to ${selectedColor}`}
                      />
                      <RowSwatch
                        colorIndex={bg}
                        active={false}
                        onClick={() => handleRowSwatchClick(row, 'bg')}
                        title={`R${row} BG = ${bg} — click to set to ${selectedColor}`}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-msx-textsecondary px-1">
                Click FG/BG swatch to apply selected palette color to that row.
              </p>
            </Panel>

            {tile.charUsageCount > 1 && (
              <Panel title="Apply Mode" bodyClassName="p-3 space-y-2">
                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="radio"
                    name="presentation-edit-mode"
                    checked={editMode === 'single'}
                    onChange={() => setEditMode('single')}
                  />
                  <span>Only this cell</span>
                </label>
                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="radio"
                    name="presentation-edit-mode"
                    checked={editMode === 'shared'}
                    onChange={() => setEditMode('shared')}
                  />
                  <span>Edit shared char</span>
                </label>
              </Panel>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleReset} variant="ghost">Reset</Button>
          <Button onClick={onClose} variant="ghost">Cancel</Button>
          <Button onClick={handleSave}>Save Tile</Button>
        </div>
      </div>
    </Modal>
  );
};

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

const PaletteSwatchButton: React.FC<{
  colorIndex: number;
  selected: boolean;
  onClick: () => void;
  titlePrefix: string;
}> = ({ colorIndex, selected, onClick, titlePrefix }) => {
  const color = paletteEntries.find(entry => entry.index === colorIndex) ?? paletteEntries[0];
  const textClass = colorIndex === 11 || colorIndex === 14 || colorIndex === 15 ? 'text-black' : 'text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-8 rounded border transition-all ${selected ? 'border-msx-highlight ring-1 ring-msx-highlight scale-[1.03]' : 'border-msx-border hover:border-msx-textsecondary'}`}
      style={{ backgroundColor: color.cssColor }}
      title={`${titlePrefix}: ${color.index} - ${color.name}`}
    >
      <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${textClass}`}>
        {color.index}
      </span>
      {colorIndex === 0 && (
        <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.45)_45%,rgba(255,255,255,0.45)_55%,transparent_55%)]" />
      )}
    </button>
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
  const [bulkFgColor, setBulkFgColor] = useState<number>(DEFAULT_BULK_FG);
  const [bulkBgColor, setBulkBgColor] = useState<number>(DEFAULT_BULK_BG);

  useEffect(() => {
    if (!tile) {
      return;
    }
    setPatternBytes(tile.patternBytes.slice(0, TILE_SIZE));
    setColorBytes(tile.colorBytes.slice(0, TILE_SIZE));
    setEditMode(tile.charUsageCount > 1 ? 'single' : 'shared');
    const firstRowColors = readRowColors(tile.colorBytes[0] ?? 0x11);
    setBulkFgColor(firstRowColors.fg);
    setBulkBgColor(firstRowColors.bg);
  }, [tile]);

  const sharedLabel = useMemo(() => {
    if (!tile || tile.charUsageCount <= 1) {
      return 'Char exclusivo';
    }
    return `Char compartido por ${tile.charUsageCount} celdas`;
  }, [tile]);

  if (!tile) {
    return null;
  }

  const handlePixelClick = (x: number, y: number) => {
    setPatternBytes(prev => {
      const next = [...prev];
      next[y] = togglePatternBit(next[y] ?? 0, x) & 0xff;
      return next;
    });
  };

  const handleRowColorChange = (row: number, channel: 'fg' | 'bg', value: number) => {
    setColorBytes(prev => {
      const next = [...prev];
      const current = readRowColors(next[row] ?? 0);
      next[row] = writeRowColors(
        channel === 'fg' ? value : current.fg,
        channel === 'bg' ? value : current.bg,
      );
      return next;
    });
  };

  const handleReset = () => {
    setPatternBytes(tile.patternBytes.slice(0, TILE_SIZE));
    setColorBytes(tile.colorBytes.slice(0, TILE_SIZE));
    setEditMode(tile.charUsageCount > 1 ? 'single' : 'shared');
    const firstRowColors = readRowColors(tile.colorBytes[0] ?? 0x11);
    setBulkFgColor(firstRowColors.fg);
    setBulkBgColor(firstRowColors.bg);
  };

  const applyBulkColor = (channel: 'fg' | 'bg', value: number) => {
    setColorBytes(prev => prev.map((colorByte) => {
      const current = readRowColors(colorByte ?? 0);
      return writeRowColors(
        channel === 'fg' ? value : current.fg,
        channel === 'bg' ? value : current.bg,
      );
    }));
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
      <div className="w-[min(92vw,980px)] max-h-[85vh] overflow-y-auto space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-4 items-start">
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
            <div className="mt-3 text-xs text-msx-textsecondary">
              <div>Char code: {tile.charCode}</div>
              <div>Banco: {tile.bank}</div>
              <div>{sharedLabel}</div>
            </div>
          </Panel>

          <Panel title="Row Colors" bodyClassName="p-3 space-y-3">
            <Panel title="Bulk Apply" bodyClassName="p-3 space-y-3">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-msx-textsecondary">Foreground</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => applyBulkColor('fg', bulkFgColor)}
                    >
                      Apply FG to all rows
                    </Button>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {paletteEntries.map(color => (
                      <PaletteSwatchButton
                        key={`bulk-fg-${color.index}`}
                        colorIndex={color.index}
                        selected={bulkFgColor === color.index}
                        onClick={() => setBulkFgColor(color.index)}
                        titlePrefix="Bulk FG"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-msx-textsecondary">Background</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => applyBulkColor('bg', bulkBgColor)}
                    >
                      Apply BG to all rows
                    </Button>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {paletteEntries.map(color => (
                      <PaletteSwatchButton
                        key={`bulk-bg-${color.index}`}
                        colorIndex={color.index}
                        selected={bulkBgColor === color.index}
                        onClick={() => setBulkBgColor(color.index)}
                        titlePrefix="Bulk BG"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            {colorBytes.map((colorByte, row) => {
              const { fg, bg } = readRowColors(colorByte ?? 0);
              const fgColor = paletteEntries.find(entry => entry.index === fg) ?? paletteEntries[0];
              const bgColor = paletteEntries.find(entry => entry.index === bg) ?? paletteEntries[0];

              return (
                <div key={row} className="rounded border border-msx-border p-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-msx-textsecondary">R{row}</div>
                    <div className="flex items-center gap-3 text-[11px] text-msx-textsecondary">
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded border border-msx-border" style={{ backgroundColor: fgColor.cssColor }} />
                        <span>FG {fg}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded border border-msx-border" style={{ backgroundColor: bgColor.cssColor }} />
                        <span>BG {bg}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-[11px] text-msx-textsecondary">Foreground</div>
                      <div className="grid grid-cols-8 gap-1">
                        {paletteEntries.map(color => (
                          <PaletteSwatchButton
                            key={`fg-${row}-${color.index}`}
                            colorIndex={color.index}
                            selected={fg === color.index}
                            onClick={() => handleRowColorChange(row, 'fg', color.index)}
                            titlePrefix={`R${row} FG`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-msx-textsecondary">Background</div>
                      <div className="grid grid-cols-8 gap-1">
                        {paletteEntries.map(color => (
                          <PaletteSwatchButton
                            key={`bg-${row}-${color.index}`}
                            colorIndex={color.index}
                            selected={bg === color.index}
                            onClick={() => handleRowColorChange(row, 'bg', color.index)}
                            titlePrefix={`R${row} BG`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

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
          </Panel>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleReset} variant="ghost">
            Reset
          </Button>
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Tile
          </Button>
        </div>
      </div>
    </Modal>
  );
};

import React, { useMemo, useState } from 'react';
import { ScreenBlockExportMode, ScreenTile, Tile } from '../../types';
import { createTileDataURL } from '../utils/screenUtils';

export interface ScreenBlockCatalogPreviewEntry {
  index: number;
  usageCount: number;
  globalUsageCount?: number;
  cells: ScreenTile[];
}

export interface ScreenBlockCatalogPreviewStats {
  blockWidth: number;
  blockHeight: number;
  uniqueBlockCount: number;
  catalogEntries: ScreenBlockCatalogPreviewEntry[];
}

interface ScreenBlockCatalogPanelProps {
  currentMode: ScreenBlockExportMode;
  blocks2x2: ScreenBlockCatalogPreviewStats | null;
  blocks4x4: ScreenBlockCatalogPreviewStats | null;
  tileset: Tile[];
  currentScreenMode: string;
  editorBaseTileDim: number;
  selectedEntryId?: string | null;
  onSelectEntry?: (entry: ScreenBlockCatalogPreviewEntry, blockWidth: number, blockHeight: number) => void;
  className?: string;
}

const MODE_LABELS: Record<Exclude<ScreenBlockExportMode, 'raw'>, string> = {
  blocks2x2: 'Shared 2x2 blocks',
  blocks4x4: 'Shared 4x4 blocks',
};

function getButtonClass(isActive: boolean, isDisabled: boolean): string {
  if (isDisabled) {
    return 'rounded border border-msx-border/60 bg-msx-bgcolor/20 px-2 py-1 text-msx-textsecondary/50 cursor-not-allowed';
  }

  return `rounded border px-2 py-1 transition-colors ${
    isActive
      ? 'border-msx-accent bg-msx-accent/20 text-msx-textprimary'
      : 'border-msx-border/60 bg-msx-bgcolor/40 text-msx-textsecondary hover:border-msx-highlight hover:text-msx-textprimary'
  }`;
}

function renderCatalogCell(
  cell: ScreenTile | undefined,
  tileset: Tile[],
  currentScreenMode: string,
  editorBaseTileDim: number,
  key: string
) {
  const tile = cell?.tileId ? tileset.find(candidate => candidate.id === cell.tileId) : null;
  if (!tile) {
    return (
      <div
        key={key}
        className="h-5 w-5 border border-msx-border/30 bg-msx-bgcolor-darker"
      />
    );
  }

  return (
    <img
      key={key}
      src={createTileDataURL(
        tile,
        cell?.subTileX ?? 0,
        cell?.subTileY ?? 0,
        editorBaseTileDim,
        editorBaseTileDim,
        editorBaseTileDim,
        currentScreenMode
      )}
      alt=""
      className="h-5 w-5 border border-msx-border/30 object-contain"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export const ScreenBlockCatalogPanel: React.FC<ScreenBlockCatalogPanelProps> = ({
  currentMode,
  blocks2x2,
  blocks4x4,
  tileset,
  currentScreenMode,
  editorBaseTileDim,
  selectedEntryId,
  onSelectEntry,
  className = '',
}) => {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogMode, setCatalogMode] = useState<'blocks2x2' | 'blocks4x4'>('blocks4x4');

  const effectiveCatalogMode = useMemo(() => {
    if (catalogMode === 'blocks4x4' && blocks4x4) return 'blocks4x4';
    if (catalogMode === 'blocks2x2' && blocks2x2) return 'blocks2x2';
    if (currentMode === 'blocks4x4' && blocks4x4) return 'blocks4x4';
    if (currentMode === 'blocks2x2' && blocks2x2) return 'blocks2x2';
    if (blocks4x4) return 'blocks4x4';
    return 'blocks2x2';
  }, [blocks2x2, blocks4x4, catalogMode, currentMode]);

  const catalogPreview =
    effectiveCatalogMode === 'blocks4x4' ? blocks4x4 :
    effectiveCatalogMode === 'blocks2x2' ? blocks2x2 :
    null;

  return (
    <div className={`rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 text-xs ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-msx-textprimary">Catalog</div>
          <div className="text-msx-textsecondary">
            {catalogPreview
              ? `${MODE_LABELS[effectiveCatalogMode]} | ${catalogPreview.catalogEntries.length} entries`
              : 'No block catalog for this active area.'}
          </div>
        </div>
        <button
          type="button"
          className={getButtonClass(isCatalogOpen, !blocks2x2 && !blocks4x4)}
          onClick={() => setIsCatalogOpen(open => !open)}
          disabled={!blocks2x2 && !blocks4x4}
        >
          Catalog
        </button>
      </div>

      {isCatalogOpen && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={getButtonClass(effectiveCatalogMode === 'blocks2x2', !blocks2x2)}
              onClick={() => setCatalogMode('blocks2x2')}
              disabled={!blocks2x2}
            >
              2x2
            </button>
            <button
              type="button"
              className={getButtonClass(effectiveCatalogMode === 'blocks4x4', !blocks4x4)}
              onClick={() => setCatalogMode('blocks4x4')}
              disabled={!blocks4x4}
            >
              4x4
            </button>
          </div>

          {catalogPreview ? (
            <div className="max-h-72 overflow-auto pr-1">
              <div className="grid grid-cols-2 gap-2">
                {catalogPreview.catalogEntries.map(entry => (
                  <button
                    type="button"
                    key={entry.index}
                    className={`rounded border bg-msx-bgcolor-darker/60 p-1 text-left transition-colors ${
                      selectedEntryId === `${effectiveCatalogMode}:${entry.index}`
                        ? 'border-msx-highlight ring-1 ring-msx-highlight'
                        : 'border-msx-border/60 hover:border-msx-accent hover:bg-msx-bgcolor'
                    }`}
                    title={`Use catalog #${entry.index} as a ${catalogPreview.blockWidth}x${catalogPreview.blockHeight} stamp | current screen x${entry.usageCount}${entry.globalUsageCount !== undefined ? ` | global x${entry.globalUsageCount}` : ''}`}
                    onClick={() => onSelectEntry?.(entry, catalogPreview.blockWidth, catalogPreview.blockHeight)}
                  >
                    <div className="mb-1 flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-msx-textprimary">#{entry.index}</span>
                      <span className={entry.usageCount > 1 ? 'text-msx-cyan' : 'text-msx-textsecondary'}>
                          x{entry.usageCount}
                      </span>
                    </div>
                    <div
                      className="grid w-fit overflow-hidden rounded-sm border border-msx-border/40"
                      style={{ gridTemplateColumns: `repeat(${catalogPreview.blockWidth}, minmax(0, 1fr))` }}
                    >
                      {entry.cells.map((cell, cellIndex) =>
                        renderCatalogCell(
                          cell,
                          tileset,
                          currentScreenMode,
                          editorBaseTileDim,
                          `${entry.index}-${cellIndex}`
                        )
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-msx-textsecondary">
              Active area must align to the selected block size.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

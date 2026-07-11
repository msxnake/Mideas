import React from 'react';
import { ScreenBlockExportMode } from '../../types';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';

interface MSX2CompositionStats {
  blockWidth: number;
  blockHeight: number;
  uniqueBlockCount: number;
  repeatedBlockCount: number;
  optimizedLengthBytes: number;
  sourceLengthBytes: number;
  savingsBytes: number;
}

interface MSX2CompositionPanelProps {
  title?: string;
  screenWidth: number;
  screenHeight: number;
  pixelWidth?: number;
  pixelHeight?: number;
  cellPixelSize?: number;
  activeAreaX: number;
  activeAreaY: number;
  activeAreaWidth: number;
  activeAreaHeight: number;
  currentMode: ScreenBlockExportMode;
  rawLengthBytes: number;
  blocks2x2: MSX2CompositionStats | null;
  blocks4x4: MSX2CompositionStats | null;
  recommendedMode: ScreenBlockExportMode;
  onApplyRoomPreset?: (preset: 'full' | 'topHud' | 'topHudBottom' | 'tallHud') => void;
  className?: string;
}

const MODE_LABELS: Record<ScreenBlockExportMode, string> = {
  raw: 'raw 8x8 cells',
  blocks2x2: '2x2 shared blocks',
  blocks4x4: '4x4 shared blocks',
};

function renderMetric(label: string, value: React.ReactNode, tone: 'normal' | 'accent' | 'warning' = 'normal') {
  const valueClassName =
    tone === 'accent' ? 'text-msx-cyan' :
    tone === 'warning' ? 'text-msx-warning' :
    'text-msx-textprimary';

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-msx-textsecondary">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

export const MSX2CompositionPanel: React.FC<MSX2CompositionPanelProps> = ({
  title = 'MSX2 Composition',
  screenWidth,
  screenHeight,
  pixelWidth = 256,
  pixelHeight = 192,
  cellPixelSize = 8,
  activeAreaX,
  activeAreaY,
  activeAreaWidth,
  activeAreaHeight,
  currentMode,
  rawLengthBytes,
  blocks2x2,
  blocks4x4,
  recommendedMode,
  onApplyRoomPreset,
  className = '',
}) => {
  const topHudRows = activeAreaY;
  const bottomHudRows = Math.max(0, screenHeight - (activeAreaY + activeAreaHeight));
  const sideHudCells = activeAreaX + Math.max(0, screenWidth - (activeAreaX + activeAreaWidth));
  const hasSideHudMargins = sideHudCells > 0;
  const activeCellCount = Math.max(0, activeAreaWidth * activeAreaHeight);
  const copiesPerCell = Math.max(1, Math.round((cellPixelSize / 8) * (cellPixelSize / 8)));
  const backgroundCopies8x8 = activeCellCount * copiesPerCell;
  const candidate16x16Copies = blocks2x2?.uniqueBlockCount ?? (cellPixelSize === 16 ? activeCellCount : Math.ceil(activeCellCount / 4));
  const repeated16x16Candidates = blocks2x2?.repeatedBlockCount ?? 0;
  const isFullWidthGameplayBand = activeAreaX === 0 && activeAreaWidth === screenWidth;
  const isAlignedForBlockSize = (blockSize: 2 | 4) =>
    isFullWidthGameplayBand &&
    topHudRows % blockSize === 0 &&
    activeAreaHeight % blockSize === 0 &&
    bottomHudRows % blockSize === 0;
  const bestBlockStats =
    recommendedMode === 'blocks4x4' ? blocks4x4 :
    recommendedMode === 'blocks2x2' ? blocks2x2 :
    null;

  return (
    <Panel title={title} collapsible className={`text-xs ${className}`} bodyClassName="p-2 space-y-2">
      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-1">
        {renderMetric('Mode', 'SCREEN 5 bitmap', 'accent')}
        {renderMetric('Visible grid', `${screenWidth}x${screenHeight} cells`)}
        {renderMetric('Pixel size', `${pixelWidth}x${pixelHeight}`)}
        {renderMetric('Authoring cell', `${cellPixelSize}x${cellPixelSize}`)}
        {renderMetric('Runtime unit', '8x8 V9938 copies')}
      </div>

      {onApplyRoomPreset && (
        <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-2">
          <div className="text-msx-textprimary">Active Area presets</div>
          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" variant="ghost" className="text-[11px]" onClick={() => onApplyRoomPreset('full')} title="Use the full MSX2 room as gameplay">
              Full
            </Button>
            <Button size="sm" variant="ghost" className="text-[11px]" onClick={() => onApplyRoomPreset('topHud')} title="Reserve the top 2 16x16 rows for a HUD band">
              Top HUD 2
            </Button>
            <Button size="sm" variant="ghost" className="text-[11px]" onClick={() => onApplyRoomPreset('topHudBottom')} title="Reserve top 2 rows and bottom 1 row as static/HUD bands">
              Top 2 + Bot 1
            </Button>
            <Button size="sm" variant="ghost" className="text-[11px]" onClick={() => onApplyRoomPreset('tallHud')} title="Reserve the top 3 16x16 rows for a taller HUD band">
              Top HUD 3
            </Button>
          </div>
        </div>
      )}

      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-1">
        <div className="text-msx-textprimary">Active Area / HUD bands</div>
        {renderMetric('Top HUD rows', topHudRows)}
        {renderMetric('Gameplay rows', activeAreaHeight)}
        {renderMetric('Bottom HUD rows', bottomHudRows)}
        {renderMetric('Side HUD cells', sideHudCells, hasSideHudMargins ? 'warning' : 'normal')}
        {renderMetric('Raw export fit', 'valid', 'accent')}
        {renderMetric('2x2 band fit', isAlignedForBlockSize(2) ? 'valid' : 'needs snap', isAlignedForBlockSize(2) ? 'accent' : 'warning')}
        {renderMetric('4x4 band fit', isAlignedForBlockSize(4) ? 'valid' : 'needs snap', isAlignedForBlockSize(4) ? 'accent' : 'warning')}
        {hasSideHudMargins && (
          <div className="text-msx-warning">
            Prefer full-width gameplay with top/bottom HUD bands for MSX2 composition.
          </div>
        )}
      </div>

      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-1">
        <div className="text-msx-textprimary">Estimated V9938 composition</div>
        {renderMetric('8x8 background copies', backgroundCopies8x8)}
        {renderMetric('16x16 candidate blocks', candidate16x16Copies)}
        {renderMetric('Repeated 16x16 candidates', repeated16x16Candidates)}
        {renderMetric('Current export mode', MODE_LABELS[currentMode])}
        {renderMetric('Recommended', MODE_LABELS[recommendedMode], recommendedMode === 'raw' ? 'normal' : 'accent')}
      </div>

      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-1">
        <div className="text-msx-textprimary">Export preview</div>
        {renderMetric('Raw map bytes', `${rawLengthBytes}B`)}
        {bestBlockStats
          ? renderMetric('Best block bytes', `${bestBlockStats.optimizedLengthBytes}B`, bestBlockStats.savingsBytes >= 0 ? 'accent' : 'warning')
          : renderMetric('Best block bytes', 'raw selected')}
        {renderMetric('Runtime primitives', 'copy / fill / line')}
        <div className="text-msx-textsecondary">
          Background and HUD are composed into bitmap VRAM; actors remain hardware sprites.
        </div>
      </div>
    </Panel>
  );
};

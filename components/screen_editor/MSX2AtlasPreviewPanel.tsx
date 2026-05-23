import React from 'react';
import { Msx2Screen4Runtime, Msx2Screen4Tile } from '../../types';
import { Panel } from '../common/Panel';

interface MSX2AtlasPreviewPanelProps {
  tiles: Msx2Screen4Tile[];
  map: number[][];
  runtime: Msx2Screen4Runtime;
}

const SCREEN4_ROW_STRIDE_BYTES = 128;
const SCREEN4_VISIBLE_ROWS = 192;
const SCREEN4_VISIBLE_BYTES = SCREEN4_ROW_STRIDE_BYTES * SCREEN4_VISIBLE_ROWS;
const SIMPLE_VRAM_BUDGET_BYTES = 0x20000;

const metric = (label: string, value: React.ReactNode, tone: 'normal' | 'accent' | 'warning' = 'normal') => {
  const className = tone === 'accent' ? 'text-msx-cyan' : tone === 'warning' ? 'text-msx-warning' : 'text-msx-textprimary';
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-msx-textsecondary">{label}</span>
      <span className={className}>{value}</span>
    </div>
  );
};

const uniqueTextChars = (runtime: Msx2Screen4Runtime): number => {
  const chars = new Set<string>();
  for (const widget of runtime.hudWidgets || []) {
    if (widget.kind !== 'text') continue;
    for (const char of String(widget.text || widget.name || '')) {
      if (char.trim()) chars.add(char);
    }
  }
  const needsDigits = (runtime.hudWidgets || []).some(widget => widget.kind === 'counter' || widget.binding === 'score' || widget.binding === 'lives' || widget.binding === 'collectibles');
  if (needsDigits) '0123456789'.split('').forEach(char => chars.add(char));
  return chars.size;
};

export const MSX2AtlasPreviewPanel: React.FC<MSX2AtlasPreviewPanelProps> = ({ tiles, map, runtime }) => {
  const usedTileIndexes = new Set<number>();
  for (const row of map || []) {
    for (const value of row || []) usedTileIndexes.add(Math.max(0, Math.floor(Number(value) || 0)));
  }
  const uniqueBackgroundBlocks = usedTileIndexes.size;
  const glyphCount = uniqueTextChars(runtime);
  const iconWidgetCount = (runtime.hudWidgets || []).filter(widget => widget.kind === 'icon' || widget.binding === 'lives').length;
  const authoredWidgetCount = runtime.hudWidgets?.length || 0;
  const variableTileCount = tiles.filter(tile => (tile.width || 16) !== 16 || (tile.height || 16) !== 16).length;
  const glyphBytes = glyphCount * 32;
  const iconBytes = iconWidgetCount * 128;
  const backgroundBlockBytes = uniqueBackgroundBlocks * 128;
  const estimatedAtlasBytes = glyphBytes + iconBytes + backgroundBlockBytes;
  const offscreenRows = Math.ceil(estimatedAtlasBytes / SCREEN4_ROW_STRIDE_BYTES);
  const totalPlanBytes = SCREEN4_VISIBLE_BYTES + estimatedAtlasBytes;
  const fitsSimpleVram = totalPlanBytes <= SIMPLE_VRAM_BUDGET_BYTES;

  return (
    <Panel title="MSX2 Atlas Preview" collapsible className="text-xs" bodyClassName="p-2 space-y-2">
      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-1">
        {metric('HUD widgets', authoredWidgetCount)}
        {metric('Glyph chars', glyphCount)}
        {metric('16x16 icon slots', iconWidgetCount)}
        {metric('Unique room tiles', uniqueBackgroundBlocks)}
        {metric('Variable tile shapes', variableTileCount, variableTileCount ? 'warning' : 'normal')}
      </div>
      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-1">
        {metric('Visible page bytes', `${SCREEN4_VISIBLE_BYTES}B`)}
        {metric('Estimated atlas bytes', `${estimatedAtlasBytes}B`, estimatedAtlasBytes ? 'accent' : 'normal')}
        {metric('Offscreen rows', offscreenRows)}
        {metric('Simple VRAM fit', fitsSimpleVram ? 'yes' : 'review', fitsSimpleVram ? 'accent' : 'warning')}
      </div>
      <div className="text-msx-textsecondary">
        Preview only: atlas rows are a planning estimate for later V9938 copy/fill renderers.
      </div>
    </Panel>
  );
};

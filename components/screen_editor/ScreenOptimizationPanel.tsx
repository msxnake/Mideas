import React from 'react';
import { ScreenBlockExportMode } from '../../types';
import { Panel } from '../common/Panel';

interface OptimizationPreviewStats {
  blockWidth: number;
  blockHeight: number;
  uniqueBlockCount: number;
  repeatedBlockCount: number;
  optimizedLengthBytes: number;
  sourceLengthBytes: number;
  savingsBytes: number;
}

interface ScreenOptimizationPanelProps {
  currentMode: ScreenBlockExportMode;
  rawLengthBytes: number;
  blocks2x2: OptimizationPreviewStats | null;
  blocks4x4: OptimizationPreviewStats | null;
  recommendedMode: ScreenBlockExportMode;
  overlayMode: 'off' | 'blocks2x2' | 'blocks4x4';
  onOverlayModeChange: (mode: 'off' | 'blocks2x2' | 'blocks4x4') => void;
  className?: string;
}

const MODE_LABELS: Record<ScreenBlockExportMode, string> = {
  raw: 'Raw tiles',
  blocks2x2: 'Blocks 2x2',
  blocks4x4: 'Blocks 4x4',
};

function formatDelta(bytes: number): string {
  return bytes >= 0 ? `-${bytes}B` : `+${Math.abs(bytes)}B`;
}

function getOverlayButtonClass(isActive: boolean, isDisabled: boolean): string {
  if (isDisabled) {
    return 'rounded border border-msx-border/60 bg-msx-bgcolor/20 px-2 py-1 text-msx-textsecondary/50 cursor-not-allowed';
  }

  return `rounded border px-2 py-1 transition-colors ${
    isActive
      ? 'border-msx-accent bg-msx-accent/20 text-msx-textprimary'
      : 'border-msx-border/60 bg-msx-bgcolor/40 text-msx-textsecondary hover:border-msx-highlight hover:text-msx-textprimary'
  }`;
}

function renderModeSummary(
  label: string,
  isActive: boolean,
  preview: OptimizationPreviewStats | null,
  fallbackRawBytes: number
) {
  if (!preview) {
    return (
      <div className={`rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 ${isActive ? 'ring-1 ring-msx-accent/60' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-msx-textprimary">{label}</span>
          {isActive && <span className="text-msx-accent">Active</span>}
        </div>
        <div className="mt-1 text-msx-textsecondary">
          Not available for this map shape. Export falls back to raw ({fallbackRawBytes}B).
        </div>
      </div>
    );
  }

  const isSaving = preview.savingsBytes >= 0;

  return (
    <div className={`rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 ${isActive ? 'ring-1 ring-msx-accent/60' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-msx-textprimary">{label}</span>
        <div className="flex items-center gap-2">
          <span className={isSaving ? 'text-msx-textsecondary' : 'text-msx-warning'}>
            {formatDelta(preview.savingsBytes)}
          </span>
          {isActive && <span className="text-msx-accent">Active</span>}
        </div>
      </div>
      <div className="mt-1 text-msx-textsecondary">
        {preview.optimizedLengthBytes}B total | {preview.uniqueBlockCount} unique | {preview.repeatedBlockCount} reused
      </div>
      <div className="text-msx-textsecondary">
        Block {preview.blockWidth}x{preview.blockHeight}
      </div>
    </div>
  );
}

function renderOverlayLegendItem(
  swatchClassName: string,
  label: string,
  description: string
) {
  return (
    <div className="flex items-center gap-2 rounded border border-msx-border/50 bg-msx-bgcolor/30 px-2 py-1">
      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${swatchClassName}`} aria-hidden="true" />
      <span className="text-msx-textprimary">{label}</span>
      <span className="text-msx-textsecondary">{description}</span>
    </div>
  );
}

export const ScreenOptimizationPanel: React.FC<ScreenOptimizationPanelProps> = ({
  currentMode,
  rawLengthBytes,
  blocks2x2,
  blocks4x4,
  recommendedMode,
  overlayMode,
  onOverlayModeChange,
  className = '',
}) => {
  const activePreview =
    currentMode === 'blocks2x2' ? blocks2x2 :
    currentMode === 'blocks4x4' ? blocks4x4 :
    null;

  const recommendationText =
    recommendedMode === 'raw'
      ? 'Recommendation: keep raw tiles for this screen.'
      : `Recommendation: ${MODE_LABELS[recommendedMode]} gives the smallest export.`;

  const currentStatusText =
    currentMode === 'raw'
      ? `Current export stays tile-by-tile (${rawLengthBytes}B).`
      : activePreview
        ? activePreview.savingsBytes >= 0
          ? `Current mode saves ${activePreview.savingsBytes}B compared with raw.`
          : `Current mode costs ${Math.abs(activePreview.savingsBytes)}B more than raw.`
        : `Current mode cannot be built for this screen and will fall back to raw (${rawLengthBytes}B).`;

  const selectedOverlayPreview =
    overlayMode === 'blocks2x2' ? blocks2x2 :
    overlayMode === 'blocks4x4' ? blocks4x4 :
    null;

  const overlayStatusText =
    overlayMode === 'off'
      ? 'Overlay hidden.'
      : selectedOverlayPreview
        ? `${MODE_LABELS[overlayMode]} overlay: repeated blocks are cyan, unique blocks are amber.`
        : `${MODE_LABELS[overlayMode]} overlay is not available for this map shape.`;

  return (
    <Panel title="Optimization Preview" className={`text-xs ${className}`} bodyClassName="p-2 space-y-2">
      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2">
        <div className="text-msx-textprimary">Current mode: {MODE_LABELS[currentMode]}</div>
        <div className="mt-1 text-msx-textsecondary">{currentStatusText}</div>
        <div className="mt-1 text-msx-cyan">{recommendationText}</div>
        <div className="mt-1 text-msx-textsecondary">
          Runtime collision/effects remain tile-based. This only changes export packing.
        </div>
      </div>

      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2">
        <div className="text-msx-textprimary">Overlay preview</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            className={getOverlayButtonClass(overlayMode === 'off', false)}
            onClick={() => onOverlayModeChange('off')}
          >
            Off
          </button>
          <button
            type="button"
            className={getOverlayButtonClass(overlayMode === 'blocks2x2', !blocks2x2)}
            onClick={() => onOverlayModeChange('blocks2x2')}
            disabled={!blocks2x2}
          >
            2x2
          </button>
          <button
            type="button"
            className={getOverlayButtonClass(overlayMode === 'blocks4x4', !blocks4x4)}
            onClick={() => onOverlayModeChange('blocks4x4')}
            disabled={!blocks4x4}
          >
            4x4
          </button>
        </div>
        <div className="mt-2 text-msx-textsecondary">{overlayStatusText}</div>
        <div className="mt-2 space-y-1">
          <div className="text-msx-textprimary">Legend</div>
          <div className="space-y-1">
            {renderOverlayLegendItem('bg-cyan-400', 'Cyan', '= reused block')}
            {renderOverlayLegendItem('bg-amber-400', 'Amber', '= unique block')}
            {renderOverlayLegendItem('bg-msx-highlight', 'xN', '= total occurrences in the exported block map')}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className={`rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 ${currentMode === 'raw' ? 'ring-1 ring-msx-accent/60' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-msx-textprimary">Raw tiles</span>
            {currentMode === 'raw' && <span className="text-msx-accent">Active</span>}
          </div>
          <div className="mt-1 text-msx-textsecondary">{rawLengthBytes}B total | direct tile stream</div>
        </div>
        {renderModeSummary('Blocks 2x2', currentMode === 'blocks2x2', blocks2x2, rawLengthBytes)}
        {renderModeSummary('Blocks 4x4', currentMode === 'blocks4x4', blocks4x4, rawLengthBytes)}
      </div>
    </Panel>
  );
};

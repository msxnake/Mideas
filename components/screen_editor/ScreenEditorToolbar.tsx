





import React from 'react';
import { Button } from '../common/Button';
import { HudIcon, CodeIcon as ASMIcon, CopyIcon, ClipboardDocumentListIcon as PasteIcon, PlusCircleIcon, MapIcon, PlayIcon } from '../icons/MsxIcons';
import { ScreenMap } from '../../types';

type LayerName = keyof ScreenMap['layers'] | 'entities' | 'effects';

interface ScreenEditorToolbarProps {
  activeLayer: LayerName;
  onLayerChange: (layer: LayerName) => void;
  layerNames: LayerName[];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  
  activeAreaX: string;
  activeAreaY: string;
  activeAreaWidth: string;
  activeAreaHeight: string;
  onActiveAreaChange: (prop: 'activeAreaX' | 'activeAreaY' | 'activeAreaWidth' | 'activeAreaHeight', value: string) => void;
  maxActiveAreaX: number;
  maxActiveAreaY: number;
  maxActiveAreaWidth: number;
  maxActiveAreaHeight: number;
  onOpenHudEditor: () => void;
  isHudAreaDefined: boolean;
  onExportLayout: () => void; 
  onExportBehavior: () => void; 
  onPreview: () => void;

  onCopyLayer: () => void; 
  onPasteLayer: () => void; 
  isCopyLayerDisabled?: boolean; 
  isPasteLayerDisabled?: boolean; 
  onAddNewEffectZone: () => void;
  onShowMapFile: () => void;
}

export const ScreenEditorToolbar: React.FC<ScreenEditorToolbarProps> = ({
  activeLayer, onLayerChange, layerNames, zoom, onZoomChange,
  activeAreaX, activeAreaY, activeAreaWidth, activeAreaHeight, onActiveAreaChange,
  maxActiveAreaX, maxActiveAreaY, maxActiveAreaWidth, maxActiveAreaHeight,
  onOpenHudEditor, isHudAreaDefined,
  onExportLayout, onExportBehavior, onPreview,
  onCopyLayer, onPasteLayer, isCopyLayerDisabled, isPasteLayerDisabled,
  onAddNewEffectZone, onShowMapFile
}) => {
  
  return (
    <div className="p-2 border-b border-msx-border flex flex-wrap gap-x-2 gap-y-1 items-center text-xs">
      <div>
        <label className="pixel-font text-msx-textsecondary mr-1">Layer:</label>
        {layerNames.map(name => (
          <button
            key={name}
            onClick={() => onLayerChange(name)}
            className={`px-1.5 py-0.5 rounded ${activeLayer === name ? 'bg-msx-accent text-white' : 'bg-msx-border text-msx-textsecondary hover:bg-msx-highlight'}`}
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex items-center">
        <label htmlFor="screenZoom" className="pixel-font text-msx-textsecondary mr-1">Zoom:</label>
        <input
          type="range"
          id="screenZoom"
          min="4"
          max={Math.max(24, Math.round(16 * 2.6))} 
          value={zoom}
          onChange={(e) => onZoomChange(parseInt(e.target.value))}
          className="w-20 sm:w-24 accent-msx-accent"
        />
      </div>
      
      <div className="flex items-center space-x-1 pt-1 sm:pt-0 border-t sm:border-t-0 sm:border-l border-msx-border/50 sm:pl-2 mt-1 sm:mt-0">
        <span className="pixel-font text-msx-textsecondary">Active Area (Cells):</span>
        <label htmlFor="activeX" className="text-msx-textsecondary sr-only">Active X</label>
        <input title="Active Area X (offset)" type="number" id="activeX" value={activeAreaX} onChange={(e) => onActiveAreaChange('activeAreaX', e.target.value)} min="0" max={maxActiveAreaX} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded"/>
        <label htmlFor="activeY" className="text-msx-textsecondary sr-only">Active Y</label>
        <input title="Active Area Y (offset)" type="number" id="activeY" value={activeAreaY} onChange={(e) => onActiveAreaChange('activeAreaY', e.target.value)} min="0" max={maxActiveAreaY} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded"/>
        <label htmlFor="activeW" className="text-msx-textsecondary sr-only">Active Width</label>
        <input title="Active Area Width (cells)" type="number" id="activeW" value={activeAreaWidth} onChange={(e) => onActiveAreaChange('activeAreaWidth', e.target.value)} min="1" max={maxActiveAreaWidth} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded"/>
        <label htmlFor="activeH" className="text-msx-textsecondary sr-only">Active Height</label>
        <input title="Active Area Height (cells)" type="number" id="activeH" value={activeAreaHeight} onChange={(e) => onActiveAreaChange('activeAreaHeight', e.target.value)} min="1" max={maxActiveAreaHeight} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded"/>
      </div>

      <div className="flex items-center space-x-1 ml-auto">
        <Button onClick={onPreview} size="sm" variant="primary" icon={<PlayIcon className="w-4 h-4" />} title="Preview Screen"> Preview </Button>
        <Button onClick={onOpenHudEditor} size="sm" variant="secondary" icon={<HudIcon className="w-4 h-4" />} title={!isHudAreaDefined ? "No HUD area defined (Active Area covers full screen)" : "Manage HUD elements for this screen"} disabled={!isHudAreaDefined}> HUD </Button>
        {activeLayer === 'effects' && (
            <Button onClick={onAddNewEffectZone} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-3.5 h-3.5"/>} title="Add a new effect zone to the map">Add Effect Zone</Button>
        )}
        <Button onClick={onCopyLayer} size="sm" variant="ghost" title="Copy active area of current layer" icon={<CopyIcon className="w-3.5 h-3.5"/>} disabled={isCopyLayerDisabled}>Copy Layer</Button>
        <Button onClick={onPasteLayer} size="sm" variant="ghost" title="Paste copied layer data into active area of current layer" icon={<PasteIcon className="w-3.5 h-3.5"/>} disabled={isPasteLayerDisabled}>Paste Layer</Button>
        <Button onClick={onShowMapFile} size="sm" variant="secondary" title="Show/Generate main map ASM file" icon={<MapIcon className="w-4 h-4"/>}> Map ASM </Button>
        <Button onClick={onExportLayout} size="sm" variant="secondary" title="Export active area layout as ASM data" icon={<ASMIcon className="w-4 h-4"/>}> Layout ASM </Button>
        <Button onClick={onExportBehavior} size="sm" variant="secondary" title="Export active area behavior map as ASM data" icon={<ASMIcon className="w-4 h-4"/>}> Behavior ASM </Button>
      </div>
    </div>
  );
};
import React from 'react';
import { Button } from '@/components/common/Button';
import { DrawingTool, SymmetrySettings, DitherBrushDiameter, DITHER_BRUSH_DIAMETERS } from '@/types';
import { EDITABLE_TILE_DIMENSIONS } from '@/constants';
import { PencilIcon, FireIcon as FloodFillIcon, PatternBrushIcon, SaveFloppyIcon } from '@/components/icons/MsxIcons';

interface TileEditorToolbarProps {
  // Tool Selection
  currentTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  ditherBrushDiameter: DitherBrushDiameter;
  onDitherBrushDiameterChange: (diameter: DitherBrushDiameter) => void;

  // Symmetry
  symmetrySettings: SymmetrySettings;
  onSymmetryToggle: (key: keyof SymmetrySettings) => void;
  onSymmetryClear: () => void;

  // Tile Attributes
  tileName: string;
  onTileNameChange: (newName: string) => void;
  tileDimensions: { width: number; height: number };
  onDimensionsChange: (newWidth: number, newHeight: number) => void;

  // Actions
  onCopy: () => void;
  onPaste: () => void;
  isPasteDisabled: boolean;
  onSplit: () => void;
  onGenerate: () => void;
  onMirrorH: () => void;
  onMirrorV: () => void;
  onFileOps: () => void;
}

const ToolbarSeparator = () => <div className="border-l border-msx-border h-6 mx-2"></div>;

export const TileEditorToolbar: React.FC<TileEditorToolbarProps> = ({
  currentTool, onToolChange, ditherBrushDiameter, onDitherBrushDiameterChange,
  symmetrySettings, onSymmetryToggle, onSymmetryClear,
  tileName, onTileNameChange, tileDimensions, onDimensionsChange,
  onCopy, onPaste, isPasteDisabled, onSplit, onGenerate, onMirrorH, onMirrorV, onFileOps
}) => {

  const toolButtonClass = (toolName: DrawingTool) =>
    `px-2 py-1 ${currentTool === toolName ? 'bg-msx-highlight text-msx-bgcolor' : 'bg-msx-border text-msx-textsecondary hover:bg-opacity-80'}`;

  const symmetryButtonClass = (isActive: boolean) =>
    `px-1.5 py-0.5 text-[0.65rem] ${isActive ? 'bg-msx-accent text-white' : 'bg-msx-border text-msx-textsecondary hover:bg-msx-highlight'}`;

  return (
    <div className="w-full flex items-center gap-2 p-1.5 bg-msx-panelbg rounded border border-msx-border text-xs mb-2 flex-wrap">
      {/* Group 1: Tools */}
      <div className="flex items-center space-x-1">
        <label className="text-xs mr-1">Tool:</label>
        <Button onClick={() => onToolChange('pencil')} className={toolButtonClass('pencil')} title="Pencil (Draw/Erase)"><PencilIcon className="w-4 h-4" /></Button>
        <Button onClick={() => onToolChange('floodfill')} className={toolButtonClass('floodfill')} title="Flood Fill"><FloodFillIcon className="w-4 h-4" /></Button>
        <Button onClick={() => onToolChange('dither')} className={toolButtonClass('dither')} title="Dither Brush"><PatternBrushIcon className="w-4 h-4" /></Button>
      </div>
      {currentTool === 'dither' && (
        <div className="flex items-center space-x-1 pl-1">
           <label className="text-xs">Brush Size:</label>
           {DITHER_BRUSH_DIAMETERS.map(d =>
              <Button key={d} onClick={() => onDitherBrushDiameterChange(d)} size="sm" variant={ditherBrushDiameter === d ? 'secondary' : 'ghost'} className="!p-1 text-[0.6rem] w-6 h-6">{d}x{d}</Button>
           )}
        </div>
      )}

      <ToolbarSeparator />

      {/* Group 2: Symmetry */}
      <div className="flex items-center gap-1">
          <span className="text-msx-textsecondary mr-1">Symmetry:</span>
          <Button onClick={() => onSymmetryToggle('horizontal')} className={symmetryButtonClass(symmetrySettings.horizontal)}>H</Button>
          <Button onClick={() => onSymmetryToggle('vertical')} className={symmetryButtonClass(symmetrySettings.vertical)}>V</Button>
          <Button onClick={() => onSymmetryToggle('diagonalMain')} className={symmetryButtonClass(symmetrySettings.diagonalMain)}>D1</Button>
          <Button onClick={() => onSymmetryToggle('diagonalAnti')} className={symmetryButtonClass(symmetrySettings.diagonalAnti)}>D2</Button>
          <Button onClick={() => onSymmetryToggle('quadMirror')} className={symmetryButtonClass(symmetrySettings.quadMirror)}>Quad</Button>
          <Button onClick={onSymmetryClear} className="px-1.5 py-0.5 text-[0.65rem] bg-msx-danger text-white hover:bg-opacity-80">Off</Button>
      </div>

      <ToolbarSeparator />

      {/* Group 3: Tile Attributes */}
      <div className="flex items-center gap-2">
        <div>
          <label className="text-msx-textsecondary mr-1">Name:</label>
          <input type="text" value={tileName} onChange={(e) => onTileNameChange(e.target.value)} className="w-28 p-1 text-xs bg-msx-bgcolor border-msx-border rounded" />
        </div>
        <div className="flex items-center space-x-1">
          <label className="text-msx-textsecondary">Dims:</label>
          <select value={tileDimensions.width} onChange={(e) => onDimensionsChange(parseInt(e.target.value), tileDimensions.height)} className="p-1 text-xs bg-msx-bgcolor border-msx-border rounded">
              {EDITABLE_TILE_DIMENSIONS.map(d => <option key={`w-${d}`} value={d}>{d}</option>)}
          </select>
          <span className="text-msx-textsecondary">x</span>
          <select value={tileDimensions.height} onChange={(e) => onDimensionsChange(tileDimensions.width, parseInt(e.target.value))} className="p-1 text-xs bg-msx-bgcolor border-msx-border rounded">
              {EDITABLE_TILE_DIMENSIONS.map(d => <option key={`h-${d}`} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <ToolbarSeparator />

      {/* Group 4: Actions */}
      <div className="flex items-center gap-1">
        <Button onClick={onCopy} size="sm" variant="secondary">Copy</Button>
        <Button onClick={onPaste} size="sm" variant="secondary" disabled={isPasteDisabled}>Paste</Button>
        <Button onClick={onSplit} size="sm" variant="secondary">Split 8x8</Button>
        <Button onClick={onGenerate} size="sm" variant="secondary">Generator</Button>
        <Button onClick={onMirrorH} size="sm" variant="secondary">Mirror H</Button>
        <Button onClick={onMirrorV} size="sm" variant="secondary">Mirror V</Button>
        <Button onClick={onFileOps} size="sm" variant="secondary" icon={<SaveFloppyIcon/>}>File Ops</Button>
      </div>
    </div>
  );
};

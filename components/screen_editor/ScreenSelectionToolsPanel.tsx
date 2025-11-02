
import React from 'react';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import {
    TrashIcon, SparklesIcon, StopCircleIcon, PaintBrushIcon,
    ArrowsPointingOutIcon, ClipboardDocumentListIcon as PasteIcon, ViewfinderCircleIcon,
    DocumentPlusIcon
} from '../icons/MsxIcons';
import { ScreenSelectionRect, Tile, ScreenEditorTool } from '../../types';

/**
 * Props for the {@link ScreenSelectionToolsPanel} component.
 * @category ScreenEditor
 */
interface ScreenSelectionToolsPanelProps {
  /** The currently active screen editor tool. */
  currentScreenTool: ScreenEditorTool;
  /** Callback function to set the active screen editor tool. */
  onSetScreenTool: (tool: ScreenEditorTool) => void;
  /** The current selection rectangle, or null if no selection. */
  selectionRect: ScreenSelectionRect | null;
  /** Callback function to clear the tiles within the selection. */
  onClearSelection: () => void;
  /** Callback function to clear the selection rectangle itself. */
  onUnselect: () => void;
  /** The ID of the currently selected tile for fill operations. */
  selectedTileId: string | null;
  /** The base dimension of a tile in the editor. */
  editorBaseTileDim: number;
  /** The tileset used in the screen. */
  tileset: Tile[];
  /** Whether the currently active layer is editable with selection tools. */
  activeLayerIsEditable: boolean;
  /** Callback function to fill the selection with the current tile. */
  onFillSelection: () => void;
  /** Callback function to fill the selection with a zigzag pattern of the current tile. */
  onZigZagFillSelection: () => void;
  /** Callback function to copy the screen data. */
  onCopyScreen: () => void;
  /** Callback function to paste screen data. */
  onPasteScreen: () => void;
  /** Whether the paste action should be disabled. */
  isPasteDisabled: boolean;
  /** Callback function to create a stamp from the current selection. */
  onCreateStamp: () => void;
}

/**
 * A panel containing tools for manipulating a selected area in the screen editor.
 *
 * @param props The component props.
 * @returns A React component.
 * @category ScreenEditor
 */
export const ScreenSelectionToolsPanel: React.FC<ScreenSelectionToolsPanelProps> = ({
  currentScreenTool,
  onSetScreenTool,
  selectionRect,
  onClearSelection,
  onUnselect,
  selectedTileId,
  editorBaseTileDim,
  tileset,
  activeLayerIsEditable,
  onFillSelection,
  onZigZagFillSelection,
  onCopyScreen,
  onPasteScreen,
  isPasteDisabled,
  onCreateStamp,
}) => {
  const selectedTileForFillOperations = tileset.find(t => t.id === selectedTileId);
  const isZigZagPossible = selectedTileForFillOperations &&
                           Math.ceil(selectedTileForFillOperations.width / editorBaseTileDim) >= 2 &&
                           Math.ceil(selectedTileForFillOperations.height / editorBaseTileDim) >= 2;

  const isFillDisabled = !selectionRect || !activeLayerIsEditable || !selectedTileForFillOperations;
  const isZigZagFillDisabled = isFillDisabled || !isZigZagPossible;

  const toolButtonClass = (tool: ScreenEditorTool) => 
    `w-full mt-1 p-1 text-xs rounded ${currentScreenTool === tool ? 'bg-msx-highlight text-msx-bgcolor' : 'bg-msx-border text-msx-textsecondary hover:bg-msx-highlight/70'}`;

  return (
    <Panel title="Selection Tools" className="w-48 p-2 border-l border-msx-border flex-shrink-0 text-xs">
      <div className="space-y-1.5">
        <Button
          onClick={() => onSetScreenTool('select')}
          className={toolButtonClass('select')}
          icon={<ViewfinderCircleIcon className="w-3.5 h-3.5 mr-1" />}
          aria-pressed={currentScreenTool === 'select'}
        >
          Select Area
        </Button>
        <Button 
            onClick={onUnselect} 
            disabled={!selectionRect} 
            size="sm" 
            variant="ghost" 
            icon={<StopCircleIcon className="w-3.5 h-3.5 mr-1" />} 
            className="w-full justify-start"
            title="Clear current selection rectangle"
        >
          Unselect Area
        </Button>
        <Button 
            onClick={onClearSelection} 
            disabled={!selectionRect || !activeLayerIsEditable} 
            size="sm" 
            variant="danger" 
            icon={<TrashIcon className="w-3.5 h-3.5 mr-1" />} 
            className="w-full justify-start"
            title="Clear tiles within the selected area"
        >
          Clear Selection
        </Button>
        <Button
            onClick={onFillSelection}
            disabled={isFillDisabled}
            size="sm"
            variant="secondary"
            icon={<PaintBrushIcon className="w-3.5 h-3.5 mr-1" />}
            className="w-full justify-start"
            title="Fill selected area with the current tile"
        >
          Fill Selection
        </Button>
        <Button
            onClick={onZigZagFillSelection}
            disabled={isZigZagFillDisabled}
            size="sm"
            variant="secondary"
            icon={<SparklesIcon className="w-3.5 h-3.5 mr-1" />}
            className="w-full justify-start"
            title="Fill selected area with the current tile in a ZigZag pattern (tile must be >= 2x2 cells)"
        >
          Zig-Zag Fill
        </Button>
        <Button
            onClick={onCreateStamp}
            disabled={!selectionRect || !activeLayerIsEditable}
            size="sm"
            variant="primary"
            icon={<DocumentPlusIcon className="w-3.5 h-3.5 mr-1" />}
            className="w-full justify-start"
            title="Save selected area as a reusable stamp pattern"
        >
          Create Stamp
        </Button>
        
        <div className="pt-2 mt-2 border-t border-msx-border">
            <Button 
                onClick={onCopyScreen} 
                size="sm" 
                variant="ghost" 
                icon={<ArrowsPointingOutIcon className="w-3.5 h-3.5 mr-1" />} 
                className="w-full justify-start"
                title="Clone active area layout and HUD configuration to buffer"
            >
                Clone Grid
            </Button>
            <Button 
                onClick={onPasteScreen} 
                size="sm" 
                variant="ghost" 
                icon={<PasteIcon className="w-3.5 h-3.5 mr-1" />} 
                className="w-full justify-start"
                disabled={isPasteDisabled}
                title="Paste buffered grid data, overwriting active area and HUD"
            >
                Paste Grid
            </Button>
        </div>
      </div>
    </Panel>
  );
};

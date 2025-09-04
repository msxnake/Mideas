



import React from 'react';
import { Point, ScreenMap, Tile, MockEntityType } from '../../types';

/**
 * Represents the name of a layer in the screen editor.
 * @category ScreenEditor
 */
type LayerName = keyof ScreenMap['layers'] | 'entities' | 'effects';

/**
 * Props for the {@link ScreenEditorStatusBar} component.
 * @category ScreenEditor
 */
interface ScreenEditorStatusBarProps {
  /** The currently active layer in the editor. */
  activeLayer: LayerName;
  /** The ID of the currently selected tile, or null if none is selected. */
  selectedTileId: string | null;
  /** The mock entity type to be placed, or null. */
  currentEntityTypeToPlace: MockEntityType | null;
  /** The name of the currently selected effect zone. */
  selectedEffectZoneName?: string | null;
  /** The tileset used in the screen. */
  tileset: Tile[];
  /** The screen map data. */
  screenMap: ScreenMap;
  /** The coordinates of the last clicked cell. */
  lastClickedCell: Point | null;
}

/**
 * A status bar component for the screen editor, displaying information about the current state.
 *
 * @param props The component props.
 * @returns A React component.
 * @category ScreenEditor
 */
export const ScreenEditorStatusBar: React.FC<ScreenEditorStatusBarProps> = ({
  activeLayer,
  selectedTileId,
  currentEntityTypeToPlace,
  selectedEffectZoneName, // New
  tileset,
  screenMap,
  lastClickedCell,
}) => {
  let toolMessage = "Eraser";
  if (activeLayer === 'entities') {
    toolMessage = currentEntityTypeToPlace ? `Place ${currentEntityTypeToPlace.name}` : 'Select Entity';
  } else if (activeLayer === 'effects') {
    toolMessage = selectedEffectZoneName ? `Zone: ${selectedEffectZoneName}` : 'Select/Add Effect Zone';
  } else if (selectedTileId) {
    toolMessage = tileset.find(t => t.id === selectedTileId)?.name || 'Unknown Tile';
  }

  return (
    <div className="p-2 border-t border-msx-border text-xs text-msx-textsecondary pixel-font">
      Selected Tool: {toolMessage} |
      Layer: {activeLayer} | Map Size (cells): {screenMap.width}x{screenMap.height} |
      Active Area: X:{screenMap.activeAreaX ?? 0} Y:{screenMap.activeAreaY ?? 0} W:{screenMap.activeAreaWidth ?? screenMap.width} H:{screenMap.activeAreaHeight ?? screenMap.height} |
      Last Click: {lastClickedCell ? `(${lastClickedCell.x}, ${lastClickedCell.y})` : 'N/A'}
    </div>
  );
};
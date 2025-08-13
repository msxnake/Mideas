



import React from 'react';
import { Point, ScreenMap, Tile, MockEntityType } from '../../types';

type LayerName = keyof ScreenMap['layers'] | 'entities' | 'effects';

interface ScreenEditorStatusBarProps {
  activeLayer: LayerName;
  selectedTileId: string | null;
  currentEntityTypeToPlace: MockEntityType | null;
  selectedEffectZoneName?: string | null; // New
  tileset: Tile[];
  screenMap: ScreenMap;
  lastClickedCell: Point | null;
}

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






import React from 'react';
import { Button } from '../common/Button';
import { HudIcon, CodeIcon as ASMIcon, CopyIcon, ClipboardDocumentListIcon as PasteIcon, PlusCircleIcon, SaveIcon, LoadIcon } from '../icons/MsxIcons';
import { ScreenBlockExportMode, ScreenBehaviorSource, ScreenMap, ProjectAsset, ScreenKind, ScreenEngineKind } from '../../types';
import { MSX1_PALETTE } from '../../constants';
import { getBackgroundColorHex, isScreen2Mode } from '../../utils/screenModeConfig';

/**
 * Represents the name of a layer in the screen editor.
 * @category ScreenEditor
 */
type LayerName = keyof ScreenMap['layers'] | 'entities' | 'effects';

/**
 * Props for the {@link ScreenEditorToolbar} component.
 * @category ScreenEditor
 */
interface ScreenEditorToolbarProps {
  /** The currently active layer. */
  activeLayer: LayerName;
  /** Callback function when the active layer changes. */
  onLayerChange: (layer: LayerName) => void;
  /** An array of available layer names. */
  layerNames: LayerName[];
  /** High-level screen role. */
  screenKind: ScreenKind;
  /** Runtime update engine selected by the screen role. */
  screenEngine: ScreenEngineKind;
  /** Callback when high-level screen role changes. */
  onScreenKindChange: (screenKind: ScreenKind) => void;
  /** The current zoom level. */
  zoom: number;
  /** Callback function when the zoom level changes. */
  onZoomChange: (zoom: number) => void;
  
  /** The x-coordinate of the active area. */
  activeAreaX: string;
  /** The y-coordinate of the active area. */
  activeAreaY: string;
  /** The width of the active area. */
  activeAreaWidth: string;
  /** The height of the active area. */
  activeAreaHeight: string;
  /** Callback function when an active area property changes. */
  onActiveAreaChange: (prop: 'activeAreaX' | 'activeAreaY' | 'activeAreaWidth' | 'activeAreaHeight', value: string) => void;
  /** The maximum value for the active area's x-coordinate. */
  maxActiveAreaX: number;
  /** The maximum value for the active area's y-coordinate. */
  maxActiveAreaY: number;
  /** The maximum value for the active area's width. */
  maxActiveAreaWidth: number;
  /** The maximum value for the active area's height. */
  maxActiveAreaHeight: number;
  /** Callback function to open the HUD editor. */
  onOpenHudEditor: () => void;
  /** Whether a HUD area is defined for the screen. */
  isHudAreaDefined: boolean;
  /** Callback function to export the layout data. */
  onExportLayout: () => void; 
  /** Callback function to export the behavior map. */
  onExportBehavior: () => void;
  /** Callback function to export screen map as JSON. */
  onExportScreenMapJSON: () => void;
  /** Callback function to import screen map from JSON. */
  onImportScreenMapJSON: () => void;

  /** Callback function to copy the current layer. */
  onCopyLayer: () => void; 
  /** Callback function to paste into the current layer. */
  onPasteLayer: () => void; 
  /** Whether the copy layer button should be disabled. */
  isCopyLayerDisabled?: boolean; 
  /** Whether the paste layer button should be disabled. */
  isPasteLayerDisabled?: boolean; 
  /** Callback function to add a new effect zone. */
  onAddNewEffectZone: () => void;
  /** Whether a new effect zone can be created from the current selection. */
  canAddNewEffectZone?: boolean;

  /** The current screen mode. */
  currentScreenMode: string;
  /** The selected TileBank asset ID. */
  selectedTileBankId?: string;
  /** Callback function when TileBank selection changes. */
  onTileBankChange: (tileBankId: string) => void;
  /** All project assets for TileBank filtering. */
  allProjectAssets: ProjectAsset[];
  /** Background color index (0-15) for VDP. */
  backgroundColor?: number;
  /** Border color index (0-15) for VDP. */
  borderColor?: number;
  /** Callback when background color changes. */
  onBackgroundColorChange: (colorIndex: number) => void;
  /** Callback when border color changes. */
  onBorderColorChange: (colorIndex: number) => void;
  /** Current background export optimization mode. */
  backgroundBlockMode: ScreenBlockExportMode;
  /** Callback when background export optimization mode changes. */
  onBackgroundBlockModeChange: (mode: ScreenBlockExportMode) => void;
  /** Current behavior source mode. */
  behaviorSource: ScreenBehaviorSource;
  /** Callback when behavior source mode changes. */
  onBehaviorSourceChange: (source: ScreenBehaviorSource) => void;
  /** Whether the current Active Area is compatible with the selected block mode. */
  isBackgroundBlockAlignmentValid?: boolean;
  /** Human-readable Active Area compatibility summary for the selected block mode. */
  backgroundBlockAlignmentMessage?: string;
  /** Callback to snap Active Area to the current block mode while preserving current HUD margins. */
  onSnapActiveAreaToBlockMode?: () => void;
  /** Whether snapping Active Area is currently possible. */
  canSnapActiveAreaToBlockMode?: boolean;
  /** Optional optimization preview for the current background mode. */
  backgroundBlockPreview?: {
    blockWidth: number;
    blockHeight: number;
    uniqueBlockCount: number;
    optimizedLengthBytes: number;
    sourceLengthBytes: number;
    savingsBytes: number;
  } | null;
}

/**
 * A toolbar component for the screen editor, providing controls for layers, zoom, active area, and various actions.
 *
 * @param props The component props.
 * @returns A React component.
 * @category ScreenEditor
 */
export const ScreenEditorToolbar: React.FC<ScreenEditorToolbarProps> = ({
  activeLayer, onLayerChange, layerNames, zoom, onZoomChange,
  screenKind, screenEngine, onScreenKindChange,
  activeAreaX, activeAreaY, activeAreaWidth, activeAreaHeight, onActiveAreaChange,
  maxActiveAreaX, maxActiveAreaY, maxActiveAreaWidth, maxActiveAreaHeight,
  onOpenHudEditor, isHudAreaDefined,
  onExportLayout, onExportBehavior,
  onExportScreenMapJSON, onImportScreenMapJSON,
  onCopyLayer, onPasteLayer, isCopyLayerDisabled, isPasteLayerDisabled,
  onAddNewEffectZone, canAddNewEffectZone = false,
  currentScreenMode, selectedTileBankId, onTileBankChange, allProjectAssets,
  backgroundColor = 1, borderColor = 1, onBackgroundColorChange, onBorderColorChange,
  backgroundBlockMode, onBackgroundBlockModeChange,
  behaviorSource, onBehaviorSourceChange,
  isBackgroundBlockAlignmentValid = true,
  backgroundBlockAlignmentMessage,
  onSnapActiveAreaToBlockMode,
  canSnapActiveAreaToBlockMode = false,
  backgroundBlockPreview
}) => {

  const tileBankAssets = allProjectAssets?.filter(asset => asset.type === 'tilebank') || [];
  const isMSXScreen2 = isScreen2Mode(currentScreenMode);
  const hasNoTileBanks = isMSXScreen2 && tileBankAssets.length === 0;
  const backgroundSwatch = getBackgroundColorHex(backgroundColor, currentScreenMode);
  const borderSwatch = getBackgroundColorHex(borderColor, currentScreenMode);
  
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

      <div className="flex items-center space-x-1 border-l border-msx-border/50 pl-2">
        <label htmlFor="screenKindSelector" className="pixel-font text-msx-textsecondary text-xs">Screen:</label>
        <select
          id="screenKindSelector"
          value={screenKind}
          onChange={(e) => onScreenKindChange(e.target.value as ScreenKind)}
          className="p-1 bg-msx-bgcolor border-msx-border rounded text-msx-textprimary text-xs focus:ring-msx-accent focus:border-msx-accent"
          title="Distinguishes playable screens from tutorial, dialog, and cutscene screens"
        >
          <option value="playable">Playable</option>
          <option value="tutorial">Tutorial</option>
          <option value="dialog">Dialog</option>
          <option value="cutscene">Cutscene</option>
        </select>
        <span
          className="px-1.5 py-0.5 rounded bg-msx-bgcolor-dark border border-msx-border/60 text-msx-textsecondary"
          title="Only this runtime engine should update on the current screen"
        >
          Engine: {screenEngine === 'player' ? 'Player' : 'FakePlayer'}
        </span>
      </div>

      {/* TileBank Selector (SCREEN 2 only) */}
      {isMSXScreen2 && (
        <div className="flex items-center space-x-1 border-l border-msx-border/50 pl-2">
          <label htmlFor="tileBankSelector" className="pixel-font text-msx-textsecondary">TileBank:</label>
          {hasNoTileBanks ? (
            <div className="flex items-center space-x-1">
              <span className="text-red-500 pixel-font text-xs">⚠ No TileBanks</span>
              <span className="text-msx-textsecondary text-xs italic">Please create a TileBank asset first</span>
            </div>
          ) : (
            <select
              id="tileBankSelector"
              value={selectedTileBankId || ''}
              onChange={(e) => onTileBankChange(e.target.value)}
              className="p-1 bg-msx-bgcolor border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            >
              <option value="">-- Select TileBank --</option>
              {tileBankAssets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name || 'Unnamed TileBank'}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* MSX Background and Border Color Selectors */}
      <div className="flex items-center space-x-2 border-l border-msx-border/50 pl-2">
        <div className="flex items-center space-x-1">
          <label htmlFor="bgColorSelector" className="pixel-font text-msx-textsecondary text-xs">BG:</label>
          <select
            id="bgColorSelector"
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(parseInt(e.target.value))}
            className="p-1 bg-msx-bgcolor border-msx-border rounded text-msx-textprimary text-xs focus:ring-msx-accent focus:border-msx-accent"
            title="Background Color (VDP backdrop)"
          >
            {MSX1_PALETTE.map(color => (
              <option key={color.index} value={color.index}>
                {color.name}
              </option>
            ))}
          </select>
          <div
            className="w-5 h-5 border border-msx-border rounded"
            style={{ backgroundColor: backgroundSwatch }}
            title={MSX1_PALETTE[backgroundColor]?.name || 'Black'}
          />
        </div>

        <div className="flex items-center space-x-1">
          <label htmlFor="borderColorSelector" className="pixel-font text-msx-textsecondary text-xs">Border:</label>
          <select
            id="borderColorSelector"
            value={borderColor}
            onChange={(e) => onBorderColorChange(parseInt(e.target.value))}
            className="p-1 bg-msx-bgcolor border-msx-border rounded text-msx-textprimary text-xs focus:ring-msx-accent focus:border-msx-accent"
            title="Border Color (VDP border area)"
          >
            {MSX1_PALETTE.map(color => (
              <option key={color.index} value={color.index}>
                {color.name}
              </option>
            ))}
          </select>
          <div
            className="w-5 h-5 border border-msx-border rounded"
            style={{ backgroundColor: borderSwatch }}
            title={MSX1_PALETTE[borderColor]?.name || 'Black'}
          />
        </div>
      </div>

      <div className="flex items-center space-x-1 border-l border-msx-border/50 pl-2">
        <label htmlFor="backgroundBlockMode" className="pixel-font text-msx-textsecondary text-xs">Export:</label>
        <select
          id="backgroundBlockMode"
          value={backgroundBlockMode}
          onChange={(e) => onBackgroundBlockModeChange(e.target.value as ScreenBlockExportMode)}
          className="p-1 bg-msx-bgcolor border-msx-border rounded text-msx-textprimary text-xs focus:ring-msx-accent focus:border-msx-accent"
          title="Background export optimization mode"
        >
          <option value="raw">Raw tiles</option>
          <option value="blocks2x2">Blocks 2x2</option>
          <option value="blocks4x4">Blocks 4x4</option>
        </select>
        {backgroundBlockPreview && (
          <span
            className={`text-[11px] ${backgroundBlockPreview.savingsBytes >= 0 ? 'text-msx-textsecondary' : 'text-msx-warning'}`}
            title={`${backgroundBlockPreview.blockWidth}x${backgroundBlockPreview.blockHeight} blocks`}
          >
            {backgroundBlockPreview.uniqueBlockCount} uniq | {backgroundBlockPreview.optimizedLengthBytes}B
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1 border-l border-msx-border/50 pl-2">
        <label htmlFor="behaviorSourceMode" className="pixel-font text-msx-textsecondary text-xs">Behavior:</label>
        <select
          id="behaviorSourceMode"
          value={behaviorSource}
          onChange={(e) => onBehaviorSourceChange(e.target.value as ScreenBehaviorSource)}
          className="p-1 bg-msx-bgcolor border-msx-border rounded text-msx-textprimary text-xs focus:ring-msx-accent focus:border-msx-accent"
          title="Select how runtime collision/behavior is generated for this screen"
        >
          <option value="collisionLayer">Collision layer</option>
          <option value="backgroundChars">Background chars</option>
        </select>
        {behaviorSource === 'backgroundChars' && (
          <span
            className="max-w-[17rem] text-[11px] text-msx-warning"
            title="ROM export and play preview derive behavior from background chars. Collision layer is ignored in this mode."
          >
            Uses background chars; collision layer ignored.
          </span>
        )}
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
        <input title="Active Area X (offset)" type="number" id="activeX" value={isNaN(activeAreaX) ? '' : activeAreaX} onChange={(e) => onActiveAreaChange('activeAreaX', e.target.value)} min="0" max={maxActiveAreaX} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded"/>
        <label htmlFor="activeY" className="text-msx-textsecondary sr-only">Active Y</label>
        <input title="Active Area Y (offset)" type="number" id="activeY" value={isNaN(activeAreaY) ? '' : activeAreaY} onChange={(e) => onActiveAreaChange('activeAreaY', e.target.value)} min="0" max={maxActiveAreaY} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded"/>
        <label htmlFor="activeW" className="text-msx-textsecondary sr-only">Active Width</label>
        <input title="Active Area Width (cells)" type="number" id="activeW" value={isNaN(activeAreaWidth) ? '' : activeAreaWidth} onChange={(e) => onActiveAreaChange('activeAreaWidth', e.target.value)} min="1" max={maxActiveAreaWidth} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded"/>
        <label htmlFor="activeH" className="text-msx-textsecondary sr-only">Active Height</label>
        <input title="Active Area Height (cells)" type="number" id="activeH" value={isNaN(activeAreaHeight) ? '' : activeAreaHeight} onChange={(e) => onActiveAreaChange('activeAreaHeight', e.target.value)} min="1" max={maxActiveAreaHeight} className="w-10 p-0.5 bg-msx-bgcolor border-msx-border rounded"/>
        {backgroundBlockMode !== 'raw' && (
          <>
            <span
              className={`max-w-[20rem] text-[11px] ${isBackgroundBlockAlignmentValid ? 'text-msx-textsecondary' : 'text-msx-warning'}`}
              title={backgroundBlockAlignmentMessage}
            >
              {backgroundBlockAlignmentMessage}
            </span>
            <Button
              onClick={onSnapActiveAreaToBlockMode}
              size="sm"
              variant="ghost"
              className="text-[11px]"
              title="Snap Active Area to the current block mode while preserving current HUD/non-active margins"
              disabled={!canSnapActiveAreaToBlockMode}
            >
              Snap AA
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center space-x-1 ml-auto">
        <Button onClick={onOpenHudEditor} size="sm" variant="secondary" icon={<HudIcon className="w-4 h-4" />} title={!isHudAreaDefined ? "No HUD area defined (Active Area covers full screen)" : "Manage HUD elements for this screen"} disabled={!isHudAreaDefined}> HUD </Button>
        {activeLayer === 'effects' && (
            <Button onClick={onAddNewEffectZone} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-3.5 h-3.5"/>} title={canAddNewEffectZone ? "Create a new effect zone from the current selection" : "Select a rectangular area first"} disabled={!canAddNewEffectZone}>New Zone</Button>
        )}
        <Button onClick={onCopyLayer} size="sm" variant="ghost" title="Copy active area of current layer" icon={<CopyIcon className="w-3.5 h-3.5"/>} disabled={isCopyLayerDisabled}>Copy Layer</Button>
        <Button onClick={onPasteLayer} size="sm" variant="ghost" title="Paste copied layer data into active area of current layer" icon={<PasteIcon className="w-3.5 h-3.5"/>} disabled={isPasteLayerDisabled}>Paste Layer</Button>
        <Button onClick={onExportScreenMapJSON} size="sm" variant="ghost" title="Export entire screen map as JSON" icon={<SaveIcon className="w-3.5 h-3.5"/>}>Export JSON</Button>
        <Button onClick={onImportScreenMapJSON} size="sm" variant="ghost" title="Import screen map from JSON file" icon={<LoadIcon className="w-3.5 h-3.5"/>}>Import JSON</Button>
        <Button onClick={onExportLayout} size="sm" variant="secondary" title="Export active area layout as ASM data" icon={<ASMIcon className="w-4 h-4"/>}> Layout ASM </Button>
        <Button onClick={onExportBehavior} size="sm" variant="secondary" title="Export active area behavior map as ASM data" icon={<ASMIcon className="w-4 h-4"/>}> Behavior ASM </Button>
      </div>
    </div>
  );
};

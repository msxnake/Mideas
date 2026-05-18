import React from 'react';
import { Button } from '../common/Button';
import { HudIcon, CodeIcon as ASMIcon, CopyIcon, ClipboardDocumentListIcon as PasteIcon, PlusCircleIcon, SaveIcon, LoadIcon } from '../icons/MsxIcons';
import { ScreenBlockExportMode, ScreenBehaviorSource, ProjectAsset, ScreenKind, ScreenEngineKind, ScreenEditorLayerName } from '../../types';
import { MSX1_PALETTE } from '../../constants';
import { getBackgroundColorHex, isScreen2Mode } from '../../utils/screenModeConfig';

/**
 * Represents the name of a layer in the screen editor.
 * @category ScreenEditor
 */
type LayerName = ScreenEditorLayerName;

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
  /** Callback function to export ZX0-compressed layout data. */
  onExportLayoutZx0: () => void;
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

const isInvalidNumberInput = (value: string) => Number.isNaN(Number(value));

/**
 * A toolbar component for the screen editor, providing controls for layers, zoom, active area, and actions.
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
  onExportLayout, onExportLayoutZx0, onExportBehavior,
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

  const selectClassName = 'h-7 min-w-0 rounded border border-msx-border bg-msx-bgcolor px-2 text-xs text-msx-textprimary focus:border-msx-accent focus:ring-msx-accent';
  const numberInputClassName = 'h-7 w-11 rounded border border-msx-border bg-msx-bgcolor px-1 text-center text-xs text-msx-textprimary';
  const groupClassName = 'flex min-w-0 items-center gap-2';
  const labelClassName = 'text-[11px] font-medium text-msx-textsecondary';
  const layerButtonClassName = (name: LayerName) =>
    `rounded px-2 py-1 text-xs leading-none transition-colors ${
      activeLayer === name
        ? 'bg-msx-accent text-white'
        : 'bg-msx-border text-msx-textsecondary hover:bg-msx-highlight hover:text-msx-bgcolor'
    }`;

  return (
    <div className="border-b border-msx-border bg-msx-panelbg px-3 py-2 text-xs">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className={groupClassName}>
            <span className={labelClassName}>Layer</span>
            {layerNames.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => onLayerChange(name)}
                className={layerButtonClassName(name)}
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </button>
            ))}
          </div>

          <div className={`${groupClassName} border-l border-msx-border/60 pl-4`}>
            <span className={labelClassName}>Screen</span>
            <label htmlFor="screenKindSelector" className="sr-only">Screen type</label>
            <select
              id="screenKindSelector"
              value={screenKind}
              onChange={(e) => onScreenKindChange(e.target.value as ScreenKind)}
              className={selectClassName}
              title="Distinguishes playable screens from tutorial, dialog, and cutscene screens"
            >
              <option value="playable">Playable</option>
              <option value="tutorial">Tutorial</option>
              <option value="dialog">Dialog</option>
              <option value="cutscene">Cutscene</option>
            </select>
            <span
              className="h-7 rounded border border-msx-border/60 bg-msx-bgcolor-dark px-2 py-1 text-msx-textsecondary"
              title="Only this runtime engine should update on the current screen"
            >
              Engine: {screenEngine === 'player' ? 'Player' : 'FakePlayer'}
            </span>
            {isMSXScreen2 && (
              hasNoTileBanks ? (
                <span className="text-msx-warning">No TileBanks</span>
              ) : (
                <>
                  <label htmlFor="tileBankSelector" className="text-msx-textsecondary">TileBank</label>
                  <select
                    id="tileBankSelector"
                    value={selectedTileBankId || ''}
                    onChange={(e) => onTileBankChange(e.target.value)}
                    className={`${selectClassName} min-w-[10rem]`}
                  >
                    <option value="">Select TileBank</option>
                    {tileBankAssets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name || 'Unnamed TileBank'}
                      </option>
                    ))}
                  </select>
                </>
              )
            )}
          </div>

          <div className={`${groupClassName} border-l border-msx-border/60 pl-4`}>
            <span className={labelClassName}>Palette</span>
            <div className="flex items-center gap-1">
              <label htmlFor="bgColorSelector" className="text-msx-textsecondary">BG</label>
              <select
                id="bgColorSelector"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(parseInt(e.target.value))}
                className={`${selectClassName} w-36`}
                title="Background Color (VDP backdrop)"
              >
                {MSX1_PALETTE.map(color => (
                  <option key={color.index} value={color.index}>
                    {color.name}
                  </option>
                ))}
              </select>
              <span
                className="h-6 w-6 rounded border border-msx-border"
                style={{ backgroundColor: backgroundSwatch }}
                title={MSX1_PALETTE[backgroundColor]?.name || 'Black'}
              />
            </div>

            <div className="flex items-center gap-1">
              <label htmlFor="borderColorSelector" className="text-msx-textsecondary">Border</label>
              <select
                id="borderColorSelector"
                value={borderColor}
                onChange={(e) => onBorderColorChange(parseInt(e.target.value))}
                className={`${selectClassName} w-36`}
                title="Border Color (VDP border area)"
              >
                {MSX1_PALETTE.map(color => (
                  <option key={color.index} value={color.index}>
                    {color.name}
                  </option>
                ))}
              </select>
              <span
                className="h-6 w-6 rounded border border-msx-border"
                style={{ backgroundColor: borderSwatch }}
                title={MSX1_PALETTE[borderColor]?.name || 'Black'}
              />
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
            <Button onClick={onOpenHudEditor} size="sm" variant="secondary" icon={<HudIcon className="w-4 h-4" />} title={!isHudAreaDefined ? "No HUD area defined (Active Area covers full screen)" : "Manage HUD elements for this screen"} disabled={!isHudAreaDefined}>HUD</Button>
            {activeLayer === 'effects' && (
              <Button onClick={onAddNewEffectZone} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-3.5 h-3.5"/>} title={canAddNewEffectZone ? "Create a new effect zone from the current selection" : "Select a rectangular area first"} disabled={!canAddNewEffectZone}>New Zone</Button>
            )}
            <Button onClick={onCopyLayer} size="sm" variant="ghost" title="Copy active area of current layer" icon={<CopyIcon className="w-3.5 h-3.5"/>} disabled={isCopyLayerDisabled}>Copy</Button>
            <Button onClick={onPasteLayer} size="sm" variant="ghost" title="Paste copied layer data into active area of current layer" icon={<PasteIcon className="w-3.5 h-3.5"/>} disabled={isPasteLayerDisabled}>Paste</Button>
            <Button onClick={onExportScreenMapJSON} size="sm" variant="ghost" title="Export entire screen map as JSON" icon={<SaveIcon className="w-3.5 h-3.5"/>}>Export JSON</Button>
            <Button onClick={onImportScreenMapJSON} size="sm" variant="ghost" title="Import screen map from JSON file" icon={<LoadIcon className="w-3.5 h-3.5"/>}>Import JSON</Button>
            <Button onClick={onExportLayout} size="sm" variant="secondary" title="Export active area layout as ASM data" icon={<ASMIcon className="w-4 h-4"/>}>Layout ASM</Button>
            <Button onClick={onExportLayoutZx0} size="sm" variant="secondary" title="Export active area layout as ZX0-compressed ASM data" icon={<ASMIcon className="w-4 h-4"/>}>Layout ZX0</Button>
            <Button onClick={onExportBehavior} size="sm" variant="secondary" title="Export active area behavior map as ASM data" icon={<ASMIcon className="w-4 h-4"/>}>Behavior ASM</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-msx-border/40 pt-2">
          <div className={groupClassName}>
            <label htmlFor="backgroundBlockMode" className={labelClassName}>Export</label>
            <select
              id="backgroundBlockMode"
              value={backgroundBlockMode}
              onChange={(e) => onBackgroundBlockModeChange(e.target.value as ScreenBlockExportMode)}
              className={`${selectClassName} w-32`}
              title="Background export optimization mode"
            >
              <option value="raw">Raw tiles</option>
              <option value="blocks2x2">Shared 2x2</option>
              <option value="blocks4x4">Shared 4x4</option>
            </select>
            {backgroundBlockPreview && (
              <span
                className={`whitespace-nowrap text-[11px] ${backgroundBlockPreview.savingsBytes >= 0 ? 'text-msx-textsecondary' : 'text-msx-warning'}`}
                title={`${backgroundBlockPreview.blockWidth}x${backgroundBlockPreview.blockHeight} blocks`}
              >
                {backgroundBlockPreview.uniqueBlockCount} uniq | {backgroundBlockPreview.optimizedLengthBytes}B
              </span>
            )}
          </div>

          <div className={`${groupClassName} border-l border-msx-border/60 pl-4`}>
            <label htmlFor="behaviorSourceMode" className={labelClassName}>Behavior</label>
            <select
              id="behaviorSourceMode"
              value={behaviorSource}
              onChange={(e) => onBehaviorSourceChange(e.target.value as ScreenBehaviorSource)}
              className={`${selectClassName} w-40`}
              title="Select how runtime collision/behavior is generated for this screen"
            >
              <option value="collisionLayer">Collision layer</option>
              <option value="backgroundChars">Background chars</option>
            </select>
            {behaviorSource === 'backgroundChars' && (
              <span
                className="max-w-[16rem] text-[11px] leading-tight text-msx-warning"
                title="ROM export and play preview derive behavior from background chars. Collision layer is ignored in this mode."
              >
                Uses background chars; collision layer ignored.
              </span>
            )}
          </div>

          <div className={`${groupClassName} border-l border-msx-border/60 pl-4`}>
            <label htmlFor="screenZoom" className={labelClassName}>Zoom</label>
            <input
              type="range"
              id="screenZoom"
              min="4"
              max={Math.max(24, Math.round(16 * 2.6))}
              value={zoom}
              onChange={(e) => onZoomChange(parseInt(e.target.value))}
              className="w-24 accent-msx-accent"
            />
            <span className="text-msx-textsecondary">{zoom}px</span>
          </div>

          <div className={`${groupClassName} border-l border-msx-border/60 pl-4`}>
            <span className={labelClassName}>Active Area</span>
            <label htmlFor="activeX" className="sr-only">Active X</label>
            <input title="Active Area X (offset)" type="number" id="activeX" value={isInvalidNumberInput(activeAreaX) ? '' : activeAreaX} onChange={(e) => onActiveAreaChange('activeAreaX', e.target.value)} min="0" max={maxActiveAreaX} className={numberInputClassName}/>
            <label htmlFor="activeY" className="sr-only">Active Y</label>
            <input title="Active Area Y (offset)" type="number" id="activeY" value={isInvalidNumberInput(activeAreaY) ? '' : activeAreaY} onChange={(e) => onActiveAreaChange('activeAreaY', e.target.value)} min="0" max={maxActiveAreaY} className={numberInputClassName}/>
            <label htmlFor="activeW" className="sr-only">Active Width</label>
            <input title="Active Area Width (cells)" type="number" id="activeW" value={isInvalidNumberInput(activeAreaWidth) ? '' : activeAreaWidth} onChange={(e) => onActiveAreaChange('activeAreaWidth', e.target.value)} min="1" max={maxActiveAreaWidth} className={numberInputClassName}/>
            <label htmlFor="activeH" className="sr-only">Active Height</label>
            <input title="Active Area Height (cells)" type="number" id="activeH" value={isInvalidNumberInput(activeAreaHeight) ? '' : activeAreaHeight} onChange={(e) => onActiveAreaChange('activeAreaHeight', e.target.value)} min="1" max={maxActiveAreaHeight} className={numberInputClassName}/>
            {backgroundBlockMode !== 'raw' && (
              <>
                <span
                  className={`max-w-[18rem] text-[11px] leading-tight ${isBackgroundBlockAlignmentValid ? 'text-msx-textsecondary' : 'text-msx-warning'}`}
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
                  Snap
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

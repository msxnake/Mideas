



import React, { useMemo } from 'react';
import { Boss, Tile, ScreenEditorTool, EffectZone, TileBank, ProjectAsset, TileStamp, ScreenEditorLayerName } from '../../types';
import { createTileDataURL } from '../utils/screenUtils';
import { Button } from '../common/Button';
import { EraserIcon, DocumentPlusIcon, TrashIcon } from '../icons/MsxIcons';

/**
 * Props for the {@link ScreenTilesetPanel} component.
 * @category ScreenEditor
 */
interface ScreenTilesetPanelProps {
  /** The currently active layer in the editor. */
  activeLayer: ScreenEditorLayerName;
  /** The tileset available for the screen. */
  tileset: Tile[];
  /** The ID of the currently selected tile. */
  selectedTileId: string | null;
  /** Callback function to set the selected tile ID. */
  setSelectedTileId: (id: string | null) => void;
  /** The current screen mode. */
  currentScreenMode: string;
  /** The base dimension of a tile in the editor. */
  editorBaseTileDim: number;
  /** The currently active screen editor tool. */
  currentScreenTool: ScreenEditorTool;
  /** Callback function to set the active screen editor tool. */
  onSetScreenTool: (tool: ScreenEditorTool) => void;
  /** An array of effect zones for the current screen. */
  effectZones: EffectZone[];
  /** The ID of the currently selected effect zone. */
  selectedEffectZoneId: string | null;
  /** Callback function to select an effect zone. */
  onSelectEffectZone: (id: string | null) => void;
  /** Whether the selected effect zone can insert text. */
  canAddSecretText?: boolean;
  /** Opens the Add Text modal for the selected secret zone. */
  onAddSecretText?: () => void;
  /** Current rectangular selection in the grid. */
  selectionRect?: { x: number; y: number; width: number; height: number } | null;
  /** The current MSX Screen 2 sector (0, 1, or 2). */
  currentSector?: 0 | 1 | 2;
  /** The selected TileBank asset ID (for SCREEN 2 filtering). */
  selectedTileBankId?: string;
  /** All project assets (for TileBank lookup). */
  allProjectAssets?: ProjectAsset[];
  /** Whether to show the sector grid lines (for MSX Screen 2). */
  showSectorLines?: boolean;
  /** Callback to toggle sector grid lines visibility. */
  onToggleSectorLines?: () => void;
  /** List of saved stamp patterns. */
  stamps?: TileStamp[];
  /** The ID of the currently selected stamp. */
  selectedStampId?: string | null;
  /** Callback to select a stamp. */
  onSelectStamp?: (stampId: string | null) => void;
  /** Callback to delete a stamp. */
  onDeleteStamp?: (stampId: string) => void;
  /** Callback for tile context menu. */
  onTileContextMenu?: (event: React.MouseEvent, tileId: string) => void;
  /** The boss asset selected for placement. */
  selectedBossAssetId?: string | null;
  /** Callback to select a boss asset for placement. */
  onSelectBossAsset?: (bossAssetId: string | null) => void;
  /** Callback to add/sync a boss asset using its Behavior placement. */
  onPlaceBossAsset?: (bossAssetId: string) => void;
}

/**
 * A panel that displays the tileset for the screen editor, allowing tile selection and tool activation.
 * It also displays a list of effect zones when the 'effects' layer is active.
 *
 * @param props The component props.
 * @returns A React component.
 * @category ScreenEditor
 */
export const ScreenTilesetPanel: React.FC<ScreenTilesetPanelProps> = ({
  activeLayer,
  tileset,
  selectedTileId,
  setSelectedTileId,
  currentScreenMode,
  editorBaseTileDim,
  currentScreenTool,
  onSetScreenTool,
  effectZones,
  selectedEffectZoneId,
  onSelectEffectZone,
  canAddSecretText = false,
  onAddSecretText,
  selectionRect,
  currentSector,
  selectedTileBankId,
  allProjectAssets,
  showSectorLines,
  onToggleSectorLines,
  stamps = [],
  selectedStampId,
  onSelectStamp,
  onDeleteStamp,
  onTileContextMenu,
  selectedBossAssetId,
  onSelectBossAsset,
  onPlaceBossAsset,
}) => {

  const eraserButtonClass = `w-full mt-1 p-1 text-xs rounded ${currentScreenTool === 'erase' ? 'bg-msx-highlight text-msx-bgcolor' : 'bg-msx-border text-msx-textsecondary hover:bg-msx-highlight/70'}`;

  const getTileAssetForTile = (tile: Tile): ProjectAsset | undefined => (
    allProjectAssets?.find(asset => {
      if (asset.type !== 'tile') return false;
      const assetTile = asset.data as Tile | undefined;
      return asset.id === tile.id || assetTile?.id === tile.id;
    })
  );

  const getSelectableTileId = (tile: Tile): string => getTileAssetForTile(tile)?.id || tile.id;

  // Filter tiles based on MSX Screen 2 sector and TileBank
  const filteredTileset = useMemo(() => {
    const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";
    const hasTileBank = selectedTileBankId !== undefined && selectedTileBankId !== '';

    // SCREEN 2 mode REQUIRES a TileBank
    if (isScreen2 && !hasTileBank) {
      // BLOCK: No tiles available without TileBank selection
      return [];
    }

    // If not SCREEN 2, show all tiles (normal behavior)
    if (!isScreen2) {
      return tileset;
    }

    // SCREEN 2 with TileBank selected - filter by sector
    if (currentSector === undefined) {
      return []; // No sector defined yet
    }

    // Find the selected TileBank
    const tileBankAsset = allProjectAssets?.find(asset => asset.id === selectedTileBankId && asset.type === 'tilebank');
    if (!tileBankAsset) {
      console.warn(`TileBank asset not found: ${selectedTileBankId}`);
      return tileset;
    }

    const tileBankData = tileBankAsset.data as TileBank;
    const sectorBank = tileBankData.banks[currentSector];

    if (!sectorBank) {
      console.warn(`Sector ${currentSector} not found in TileBank ${selectedTileBankId}`);
      return tileset;
    }

    // Filter tiles that are assigned to this sector's bank
    const assignedTileIds = Object.keys(sectorBank.assignedTiles);
    const assignedTileIdSet = new Set(assignedTileIds);
    const filtered = tileset.filter(tile => {
      if (assignedTileIdSet.has(tile.id)) return true;
      const tileAsset = getTileAssetForTile(tile);
      return !!tileAsset && assignedTileIdSet.has(tileAsset.id);
    });

    console.log(`📋 Filtering tiles for Sector ${currentSector}:`, {
      totalTiles: tileset.length,
      filteredTiles: filtered.length,
      assignedTileIds,
      filteredTileIds: filtered.map(t => t.id)
    });

    return filtered;
  }, [tileset, currentScreenMode, selectedTileBankId, currentSector, allProjectAssets]);

  const renderTileBasedTools = () => (
    <>
      {currentScreenMode === "SCREEN 2 (Graphics I)" && currentSector !== undefined && selectedTileBankId && (
        <div className="mb-2 p-1 bg-msx-darkblue/30 border border-msx-accent/50 rounded text-xs">
          <div className="text-msx-cyan font-bold">Sector {currentSector}</div>
          <div className="text-msx-textsecondary">Lines {currentSector * 8}-{currentSector * 8 + 7}</div>
          <div className="text-msx-textsecondary">{filteredTileset.length} tiles available</div>
        </div>
      )}
      {filteredTileset.length === 0 && (
        <div className="text-xs">
          {currentScreenMode === "SCREEN 2 (Graphics I)" && !selectedTileBankId ? (
            <div className="p-2 bg-red-900/30 border border-red-500/50 rounded">
              <div className="text-red-400 font-bold mb-1">⚠ TileBank Required</div>
              <div className="text-msx-textsecondary">
                Please select a TileBank from the toolbar above to enable tile placement in SCREEN 2 mode.
              </div>
            </div>
          ) : currentScreenMode === "SCREEN 2 (Graphics I)" && selectedTileBankId ? (
            <div className="text-msx-textsecondary italic">
              No tiles assigned to Sector {currentSector}. Use TileBank Editor to assign tiles to this bank.
            </div>
          ) : (
            <div className="text-msx-textsecondary italic">
              No tiles available. Create tiles first.
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-3 gap-1">
        {filteredTileset.map(tile => {
          const selectableTileId = getSelectableTileId(tile);
          const isSelected = (selectedTileId === tile.id || selectedTileId === selectableTileId)
            && (currentScreenTool === 'draw' || currentScreenTool === 'select');
          return (
            <div
              key={selectableTileId}
              onClick={() => {
                setSelectedTileId(selectableTileId);
                onSetScreenTool('draw');
              }}
              onContextMenu={(e) => {
                if (onTileContextMenu) {
                  onTileContextMenu(e, selectableTileId);
                }
              }}
              className={`p-0.5 border-2 rounded cursor-pointer 
                          ${isSelected ? 'border-msx-accent bg-msx-accent/30' : 'border-transparent hover:border-msx-highlight'}`}
              title={`${tile.name} (${tile.width}x${tile.height}) - Click to select for drawing/filling. Right-click to edit.`}
            >
              <img
                src={createTileDataURL(tile, 0, 0, Math.min(40, tile.width), Math.min(40, tile.height), tile.width, currentScreenMode)}
                alt={tile.name}
                className="w-full h-auto object-contain"
                style={{ imageRendering: 'pixelated', maxWidth: '40px', maxHeight: '40px' }}
              />
            </div>
          );
        })}
      </div>
      <Button
        onClick={() => {
          setSelectedTileId(null);
          onSetScreenTool('erase');
        }}
        className={eraserButtonClass}
        icon={<EraserIcon className="w-3.5 h-3.5 mr-1" />}
      >
        Eraser / Clear Tile
      </Button>
    </>
  );

  const renderEffectZoneTools = () => (
    <div className="space-y-1">
      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 text-xs text-msx-textsecondary">
        {selectionRect
          ? `Selection: X ${selectionRect.x}, Y ${selectionRect.y}, W ${selectionRect.width}, H ${selectionRect.height}. Use "New Zone" in the toolbar.`
          : 'Use the Select tool on the Effects layer to mark an area, then click "New Zone".'}
      </div>
      {onAddSecretText && (
        <Button
          onClick={onAddSecretText}
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={!canAddSecretText}
          title={canAddSecretText ? 'Insert tile text inside the selected Secret Zone' : 'Select a Secret Zone first'}
        >
          Add Text
        </Button>
      )}
      {effectZones.length === 0 && <p className="text-xs text-msx-textsecondary italic">No effect zones defined yet.</p>}
      {effectZones.map(zone => (
        <Button
          key={zone.id}
          onClick={() => onSelectEffectZone(zone.id)}
          variant={selectedEffectZoneId === zone.id ? 'primary' : 'ghost'}
          size="sm"
          className="w-full justify-start truncate"
          title={`Select Effect Zone: ${zone.name}`}
        >
          {zone.name}
        </Button>
      ))}
    </div>
  );

  const renderStampLibrary = () => {
    if (!stamps || stamps.length === 0) {
      return (
        <div className="text-xs text-msx-textsecondary italic p-2">
          No stamps saved. Select an area and click "Create Stamp" to save a reusable pattern.
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {stamps.map(stamp => (
          <div
            key={stamp.id}
            className={`p-2 border rounded cursor-pointer flex items-center justify-between ${selectedStampId === stamp.id && currentScreenTool === 'stamp'
                ? 'border-msx-accent bg-msx-accent/30'
                : 'border-msx-border hover:border-msx-highlight'
              }`}
            onClick={() => {
              if (onSelectStamp) {
                onSelectStamp(stamp.id);
                onSetScreenTool('stamp');
              }
            }}
            title={`${stamp.name} - Click to use, right-click to delete`}
          >
            <div className="flex-1">
              <div className="text-xs font-bold text-msx-text truncate">{stamp.name}</div>
              <div className="text-[0.65rem] text-msx-textsecondary">{stamp.width}x{stamp.height}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteStamp) {
                  onDeleteStamp(stamp.id);
                }
              }}
              className="ml-2 p-1 hover:bg-red-500/20 rounded"
              title="Delete stamp"
            >
              <TrashIcon className="w-3 h-3 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderBossTools = () => {
    const bossAssets = (allProjectAssets || []).filter(asset => asset.type === 'boss');

    if (bossAssets.length === 0) {
      return (
        <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 text-xs text-msx-textsecondary">
          No boss assets. Create a boss in the Boss Editor first.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="space-y-1">
          {bossAssets.map(asset => {
            const boss = asset.data as Boss | undefined;
            const firstPhase = boss?.phases?.find((phase, index) => boss.phasesEnabled?.[index] !== false) || boss?.phases?.[0];
            const dimensions = firstPhase?.dimensions;
            const sizeText = dimensions ? `${dimensions.width}x${dimensions.height} chars` : 'sprite boss';
            const isSelected = selectedBossAssetId === asset.id;

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  onSelectBossAsset?.(asset.id);
                  onPlaceBossAsset?.(asset.id);
                  onSetScreenTool('select');
                }}
                className={`w-full rounded border p-2 text-left text-xs transition-colors ${
                  isSelected
                    ? 'border-msx-accent bg-msx-accent/30 text-msx-textprimary'
                    : 'border-msx-border bg-msx-bgcolor/40 text-msx-textsecondary hover:border-msx-highlight hover:text-msx-textprimary'
                }`}
                title={`Add ${asset.name || boss?.name || 'Boss'} using its Behavior screen and start position`}
              >
                <div className="truncate font-semibold">{asset.name || boss?.name || 'Unnamed Boss'}</div>
                <div className="text-[0.65rem] text-msx-textsecondary">
                  {sizeText}
                  {boss?.linkedScreenId && Number.isFinite(boss.behaviorPreviewStartXChar) && Number.isFinite(boss.behaviorPreviewStartYChar)
                    ? ` - Behavior @ ${boss.behaviorPreviewStartXChar},${boss.behaviorPreviewStartYChar}`
                    : ' - Behavior required'}
                </div>
              </button>
            );
          })}
        </div>
        <Button
          onClick={() => {
            onSelectBossAsset?.(null);
            onSetScreenTool('erase');
          }}
          className={eraserButtonClass}
          icon={<EraserIcon className="w-3.5 h-3.5 mr-1" />}
        >
          Eraser / Remove Boss
        </Button>
      </div>
    );
  };


  return (
    <div className="w-48 p-2 border-r border-msx-border overflow-y-auto flex-shrink-0">
      <h4 className="text-sm pixel-font text-msx-highlight mb-2">
        {activeLayer === 'entities' ? 'Entities' :
          activeLayer === 'bosses' ? 'Bosses' :
          activeLayer === 'effects' ? 'Effect Zones' : 'Tileset & Tools'}
      </h4>

      {/* Sector Grid Lines Toggle (only for SCREEN 2 mode) */}
      {currentScreenMode === "SCREEN 2 (Graphics I)" && onToggleSectorLines && (
        <div className="mb-2 p-2 bg-msx-darkblue/20 border border-msx-accent/30 rounded">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-msx-text">MSX1 Sector Lines</span>
            <button
              onClick={onToggleSectorLines}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showSectorLines ? 'bg-msx-accent' : 'bg-msx-border'
                }`}
              title={showSectorLines ? "Hide sector grid lines" : "Show sector grid lines"}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${showSectorLines ? 'translate-x-5' : 'translate-x-1'
                  }`}
              />
            </button>
          </label>
        </div>
      )}

      {activeLayer === 'entities' && (
        <p className="text-xs text-msx-textsecondary">Select an Entity Template from the right panel to place instances.</p>
      )}

      {activeLayer === 'bosses' && renderBossTools()}

      {(activeLayer === 'background' || activeLayer === 'collision') && (
        <>
          {renderTileBasedTools()}

          {/* Stamps Library */}
          {stamps && stamps.length > 0 && (
            <div className="mt-3 pt-3 border-t border-msx-border">
              <h5 className="text-xs font-bold text-msx-highlight mb-2 flex items-center">
                <DocumentPlusIcon className="w-3 h-3 mr-1" />
                Stamp Library
              </h5>
              {renderStampLibrary()}
            </div>
          )}
        </>
      )}

      {activeLayer === 'effects' && (
        <>
          {renderTileBasedTools()}
          <div className="mt-3 border-t border-msx-border pt-3">
            <h5 className="mb-2 text-xs font-bold text-msx-highlight">Zones</h5>
            {renderEffectZoneTools()}
          </div>
        </>
      )}
    </div>
  );
};

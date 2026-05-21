import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Boss, BossBehaviorAction, BossForm, BossPhase, BossPhaseWeakPoint, ProjectAsset, ScreenMap, Sprite, Tile, TileBank, TileBankDefinition, BossAttack, BossCrushMovement, BossNeckChain, ContextMenuItem, EditorType, Msx2Screen5TileScreen } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, CopyIcon, EraserIcon, PasteIcon, PlusCircleIcon, TrashIcon, PencilIcon, ViewfinderCircleIcon, SaveIcon, LoadIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { createTileDataURL } from '../utils/screenUtils';
import { EDITOR_BASE_TILE_DIM_S2, DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT, DEFAULT_SCREEN2_FG_COLOR, MSX_SCREEN5_PALETTE, DEFAULT_SCREEN2_BG_COLOR } from '../../constants';
import { createDefaultLineAttributes } from '../utils/tileUtils';
import { BossFireOriginMarker, BossMovementController, BossTileSelection } from './BossMovementController';
import { BossTilesetPanel } from './BossTilesetPanel';
import { BossPreviewModal } from '../modals/BossPreviewModal';
import { BossBehaviorEditor } from './BossBehaviorEditor';
import { createBossExportPackage, parseBossExportPackage, remapBossPackageForImport, sanitizeBossPackageFilename } from '../../utils/bossPackageUtils';
import { downloadTextFile } from '../../utils/downloadUtils';


import { CopiedBossPhaseData } from '../../types';

/**
 * Props for the BossEditor component.
 */
interface BossEditorProps {
    /** The boss asset data being edited. */
    boss: Boss;
    /** Callback to update the boss data. Can also create new assets, like tiles. */
    onUpdate: (data: Partial<Boss>, newAssetsToCreate?: ProjectAsset[]) => void;
    /** A list of all project assets. */
    allAssets: ProjectAsset[];
    /** A list of all configured tile banks. */
    tileBanks: TileBank[];
    /** Callback to update a tile bank asset from the compatibility tools. */
    onUpdateTileBank: (tileBankId: string, data: Partial<TileBank>) => void;
    /** Callback to navigate to a different asset editor. */
    onNavigateToAsset: (assetId: string | null, editorTypeOverride?: EditorType) => void;
    /** Callback to display a context menu. */
    onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
    /** The current MSX screen mode. */
    currentScreenMode: string;
    /** The current zoom level for the editor canvas. */
    zoom: number;
    /** Callback to set the zoom level. */
    setZoom: (zoom: number) => void;
    /** The currently copied boss phase data for paste operations. */
    copiedBossPhase: CopiedBossPhaseData | null;
    /** Callback to set the copied boss phase data. */
    setCopiedBossPhase: (data: CopiedBossPhaseData | null) => void;
}

/**
 * A small component to render a preview of a sprite's first frame.
 * @param {object} props - The component props.
 * @param {string} props.spriteAssetId - The ID of the sprite asset to preview.
 * @param {ProjectAsset[]} props.allAssets - The list of all project assets to find the sprite from.
 * @returns A React component displaying the sprite preview.
 */
const SpritePreview: React.FC<{ spriteAssetId: string; allAssets: ProjectAsset[] }> = ({ spriteAssetId, allAssets }) => {
    const asset = allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite');
    if (!asset) return <div className="w-6 h-6 bg-msx-panelbg border border-dashed border-msx-border flex-shrink-0 flex items-center justify-center text-xs text-msx-danger">?</div>;
    const sprite = asset.data as Sprite;
    const frame = sprite.frames[0]?.data;
    if (!frame) return <div className="w-6 h-6 bg-msx-panelbg border border-dashed border-msx-border flex-shrink-0 flex items-center justify-center text-xs text-msx-danger">?</div>;
    
    const canvas = document.createElement('canvas');
    canvas.width = sprite.size.width;
    canvas.height = sprite.size.height;
    const ctx = canvas.getContext('2d');
    if(ctx){
        for(let y=0; y<sprite.size.height; y++){
            for(let x=0; x<sprite.size.width; x++){
                if(frame[y]?.[x] && frame[y][x] !== sprite.backgroundColor){
                    ctx.fillStyle = frame[y][x];
                    ctx.fillRect(x,y,1,1);
                }
            }
        }
    }
    return <img src={canvas.toDataURL()} alt={sprite.name} className="w-6 h-6 object-contain border border-msx-border bg-msx-panelbg flex-shrink-0" style={{ imageRendering: 'pixelated' }} />;
};

type BossEditMode = 'tiles' | 'collision' | 'weakpoints' | 'neck' | 'fireorigin' | 'behavior';

interface CopiedBossTileBlock {
    width: number;
    height: number;
    tileMatrix: (string | null)[][];
}

interface BossContentBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

const createDefaultBossNeckChain = (): BossNeckChain => ({
    enabled: true,
    segments: [],
    amplitudeX: 0,
    amplitudeY: 8,
    speed: 1,
    segmentDelayFrames: 4,
    followStrength: 0.85,
});

const createDefaultBossCrushMovement = (): BossCrushMovement => ({
    enabled: false,
    direction: 'down',
    distance: 48,
    windupFrames: 18,
    slamFrames: 8,
    holdFrames: 14,
    returnFrames: 24,
    cooldownFrames: 40,
});

const BOSS_EDIT_MODE_LABELS: Record<BossEditMode, string> = {
    tiles: 'Graphic',
    collision: 'Collision',
    weakpoints: 'Weak Points',
    neck: 'Neck',
    fireorigin: 'Fire Origin',
    behavior: 'Behavior',
};

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const FIRE_ORIGIN_ATTACK_TYPES = new Set<BossAttack['type']>(['Projectile', 'Boomerang', 'Rock', 'SineWave', 'HomingMissile', 'Laser', 'Bomb']);

const supportsFireOrigin = (attack: BossAttack): boolean => FIRE_ORIGIN_ATTACK_TYPES.has(attack.type);

const getAttackOriginCell = (attack: BossAttack, phase: BossPhase | undefined): { x: number; y: number } => {
    const width = Math.max(1, phase?.dimensions?.width || 1);
    const height = Math.max(1, phase?.dimensions?.height || 1);
    const x = Math.round(((attack.spawnOffsetX ?? 0) + (width * 4) - 4) / 8);
    const y = Math.round(((attack.spawnOffsetY ?? 0) + (height * 4) - 4) / 8);
    return {
        x: clampNumber(Number.isFinite(x) ? x : Math.floor(width / 2), 0, width - 1),
        y: clampNumber(Number.isFinite(y) ? y : Math.floor(height / 2), 0, height - 1),
    };
};

const getSpawnOffsetFromOriginCell = (x: number, y: number, phase: BossPhase | undefined): Pick<BossAttack, 'spawnOffsetX' | 'spawnOffsetY'> => {
    const width = Math.max(1, phase?.dimensions?.width || 1);
    const height = Math.max(1, phase?.dimensions?.height || 1);
    return {
        spawnOffsetX: (clampNumber(x, 0, width - 1) * 8 + 4) - (width * 4),
        spawnOffsetY: (clampNumber(y, 0, height - 1) * 8 + 4) - (height * 4),
    };
};

const getPhaseTileCount = (phase: BossPhase | undefined) => (
    phase?.tileMatrix?.reduce((count, row) => count + row.filter(Boolean).length, 0) ?? 0
);

const isBlackOrTransparentPixel = (color: string | null | undefined): boolean => {
    const normalized = String(color || '').replace(/\s/g, '').toLowerCase();
    return normalized === ''
        || normalized === '#000'
        || normalized === '#000000'
        || normalized === 'transparent'
        || normalized === 'rgba(0,0,0,0)';
};

const isVisuallyEmptyTile = (tile: Tile | undefined): boolean => (
    !!tile && !tile.data.some(row => row.some(pixel => !isBlackOrTransparentPixel(pixel)))
);

const isContentTileId = (tileId: string | null | undefined, tileById: Map<string, Tile>): boolean => {
    if (!tileId) return false;
    const tile = tileById.get(tileId);
    return !isVisuallyEmptyTile(tile);
};

const expandBoundsWithTileMatrix = (
    bounds: BossContentBounds | null,
    matrix: (string | null)[][] | undefined,
    tileById: Map<string, Tile>
): BossContentBounds | null => {
    let nextBounds = bounds;
    matrix?.forEach((row, y) => {
        row.forEach((tileId, x) => {
            if (!isContentTileId(tileId, tileById)) return;
            nextBounds = nextBounds
                ? {
                    minX: Math.min(nextBounds.minX, x),
                    minY: Math.min(nextBounds.minY, y),
                    maxX: Math.max(nextBounds.maxX, x),
                    maxY: Math.max(nextBounds.maxY, y),
                }
                : { minX: x, minY: y, maxX: x, maxY: y };
        });
    });
    return nextBounds;
};

const getPhaseContentBounds = (phase: BossPhase | undefined, tileById: Map<string, Tile>): BossContentBounds | null => {
    if (!phase?.dimensions) return null;
    let bounds: BossContentBounds | null = null;
    bounds = expandBoundsWithTileMatrix(bounds, phase.tileMatrix, tileById);
    phase.forms?.forEach(form => {
        bounds = expandBoundsWithTileMatrix(bounds, form.tileMatrix, tileById);
    });
    return bounds;
};

const getMatrixContentBounds = (matrix: (string | null)[][] | undefined, tileById: Map<string, Tile>): BossContentBounds | null => (
    expandBoundsWithTileMatrix(null, matrix, tileById)
);

const boundsContainsBounds = (outer: BossContentBounds, inner: BossContentBounds | null): boolean => (
    !inner
    || (
        inner.minX >= outer.minX
        && inner.minY >= outer.minY
        && inner.maxX <= outer.maxX
        && inner.maxY <= outer.maxY
    )
);

const cropNullableMatrix = <T,>(
    matrix: T[][] | undefined,
    bounds: BossContentBounds,
    fallback: T
): T[][] => {
    const width = bounds.maxX - bounds.minX + 1;
    const height = bounds.maxY - bounds.minY + 1;
    return Array.from({ length: height }, (_, y) => (
        Array.from({ length: width }, (_, x) => matrix?.[bounds.minY + y]?.[bounds.minX + x] ?? fallback)
    ));
};

const cropWeakPointsToBounds = (weakPoints: BossPhaseWeakPoint[] | undefined, bounds: BossContentBounds): BossPhaseWeakPoint[] | undefined => (
    weakPoints
        ?.filter(weakPoint => (
            weakPoint.x >= bounds.minX
            && weakPoint.y >= bounds.minY
            && weakPoint.x <= bounds.maxX
            && weakPoint.y <= bounds.maxY
        ))
        .map(weakPoint => ({
            ...weakPoint,
            x: weakPoint.x - bounds.minX,
            y: weakPoint.y - bounds.minY,
        }))
);

const cropNeckChainToBounds = (neckChain: BossNeckChain | undefined, bounds: BossContentBounds): BossNeckChain | undefined => (
    neckChain
        ? {
            ...neckChain,
            segments: neckChain.segments
                .filter(segment => (
                    segment.x >= bounds.minX
                    && segment.y >= bounds.minY
                    && segment.x <= bounds.maxX
                    && segment.y <= bounds.maxY
                ))
                .map(segment => ({
                    x: segment.x - bounds.minX,
                    y: segment.y - bounds.minY,
                })),
        }
        : undefined
);

const shiftFixedBehaviorTargets = (
    loop: BossBehaviorAction[] | undefined,
    dx: number,
    dy: number
): BossBehaviorAction[] | undefined => (
    loop?.map(action => {
        if (!('target' in action) || action.target?.type !== 'fixed') return action;
        return {
            ...action,
            target: {
                ...action.target,
                xChar: (action.target.xChar ?? 0) + dx,
                yChar: (action.target.yChar ?? 0) + dy,
            },
        } as BossBehaviorAction;
    })
);

const clonePhaseCollisionMatrix = (phase: BossPhase): boolean[][] => {
    const width = Math.max(1, phase.dimensions?.width || 1);
    const height = Math.max(1, phase.dimensions?.height || 1);
    const source = phase.collisionMatrix || [];
    return Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => Boolean(source[y]?.[x]))
    );
};

const isPhaseCollisionMatrixSized = (phase: BossPhase): boolean => {
    const width = Math.max(1, phase.dimensions?.width || 1);
    const height = Math.max(1, phase.dimensions?.height || 1);
    return phase.collisionMatrix?.length === height
        && phase.collisionMatrix.every(row => row.length === width);
};

const buildSolidTileCollisionMatrix = (phase: BossPhase, tileById: Map<string, Tile>): boolean[][] => {
    const width = Math.max(1, phase.dimensions?.width || 1);
    const height = Math.max(1, phase.dimensions?.height || 1);
    return Array.from({ length: height }, (_, y) => (
        Array.from({ length: width }, (_, x) => {
            const tileId = phase.tileMatrix?.[y]?.[x];
            return Boolean(tileId && tileById.get(tileId)?.logicalProperties?.isSolid);
        })
    ));
};

type BossBankTileStatus = 'assigned' | 'identical' | 'canAdd' | 'noSpace' | 'missing';

interface BossBankTileCompatibility {
    tileId: string;
    tileName: string;
    requiredBankIndexes: number[];
    charsNeeded: number;
    status: BossBankTileStatus;
    charCode?: number;
    matchedTileId?: string;
    matchedTileName?: string;
}

const clonePixelData = (data: Tile['data']) => data.map(row => [...row]);

const tileGraphicHash = (tile: Tile): string => JSON.stringify({
    width: tile.width,
    height: tile.height,
    data: tile.data,
    lineAttributes: tile.lineAttributes || null,
});

const getTileCharsNeeded = (tile: Tile): number => {
    const widthInChars = Math.max(1, Math.ceil(tile.width / EDITOR_BASE_TILE_DIM_S2));
    const heightInChars = Math.max(1, Math.ceil(tile.height / EDITOR_BASE_TILE_DIM_S2));
    return widthInChars * heightInChars;
};

const collectUsedCharCodesFromBank = (bank: TileBankDefinition, tileById: Map<string, Tile>, ignoreTileId?: string): Set<number> => {
    const used = new Set<number>();
    Object.entries(bank.assignedTiles || {}).forEach(([tileId, assignment]) => {
        if (ignoreTileId && tileId === ignoreTileId) return;
        if (Array.isArray((assignment as any).fontCharacters)) {
            (assignment as any).fontCharacters.forEach((fontCharacter: any) => {
                const charCode = Number(fontCharacter.bankCharCode);
                if (Number.isFinite(charCode)) used.add(charCode);
            });
            return;
        }

        const tile = tileById.get(tileId);
        const charCode = Number((assignment as any).charCode);
        if (!tile || !Number.isFinite(charCode)) return;
        for (let index = 0; index < getTileCharsNeeded(tile); index++) {
            used.add(charCode + index);
        }
    });
    return used;
};

const isCharBlockAvailableInBank = (
    bank: TileBankDefinition,
    tileById: Map<string, Tile>,
    tileId: string,
    startCharCode: number,
    numCodesNeeded: number
): boolean => {
    if (startCharCode < bank.charsetRangeStart || startCharCode + numCodesNeeded - 1 > bank.charsetRangeEnd) {
        return false;
    }
    const used = collectUsedCharCodesFromBank(bank, tileById, tileId);
    for (let offset = 0; offset < numCodesNeeded; offset++) {
        if (used.has(startCharCode + offset)) return false;
    }
    return true;
};

const findSharedAvailableCharBlock = (
    banks: TileBankDefinition[],
    tileById: Map<string, Tile>,
    tileId: string,
    numCodesNeeded: number
): number => {
    const assignedCharCodes = banks
        .map(bank => Number((bank.assignedTiles?.[tileId] as any)?.charCode))
        .filter(charCode => Number.isFinite(charCode));

    if (assignedCharCodes.length > 0) {
        const existingCharCode = assignedCharCodes[0];
        if (
            assignedCharCodes.every(charCode => charCode === existingCharCode)
            && banks.every(bank => isCharBlockAvailableInBank(bank, tileById, tileId, existingCharCode, numCodesNeeded))
        ) {
            return existingCharCode;
        }
    }

    const minStart = Math.max(...banks.map(bank => bank.charsetRangeStart));
    const maxEnd = Math.min(...banks.map(bank => bank.charsetRangeEnd));
    const rangesToTry: Array<{ start: number; end: number }> = [];
    const preferredStart = Math.max(minStart, 128);
    const preferredEnd = Math.min(maxEnd, 255);
    if (preferredStart <= preferredEnd) rangesToTry.push({ start: preferredStart, end: preferredEnd });
    const fallbackStart = Math.max(minStart, 0);
    const fallbackEnd = Math.min(maxEnd, 127);
    if (fallbackStart <= fallbackEnd) rangesToTry.push({ start: fallbackStart, end: fallbackEnd });

    for (const range of rangesToTry) {
        for (let candidate = range.start; candidate <= range.end - numCodesNeeded + 1; candidate++) {
            if (banks.every(bank => isCharBlockAvailableInBank(bank, tileById, tileId, candidate, numCodesNeeded))) {
                return candidate;
            }
        }
    }

    return -1;
};

const mirrorPixelData = (data: Tile['data'], axis: 'horizontal' | 'vertical'): Tile['data'] => {
    const cloned = clonePixelData(data);
    return axis === 'horizontal'
        ? cloned.map(row => [...row].reverse())
        : [...cloned].reverse();
};

const mirrorLineAttributes = (
    attributes: Tile['lineAttributes'],
    axis: 'horizontal' | 'vertical'
): Tile['lineAttributes'] => {
    if (!attributes) return undefined;
    const cloned = attributes.map(row => row.map(attribute => ({ ...attribute })));
    return axis === 'horizontal'
        ? cloned.map(row => [...row].reverse())
        : [...cloned].reverse();
};

/**
 * A comprehensive editor for creating and managing multi-phase boss entities.
 * It includes a grid for tile-based construction, property editors for phases and attacks,
 * and panels for managing the boss's structure and tileset.
 */
export const BossEditor: React.FC<BossEditorProps> = ({ boss, onUpdate, allAssets, onUpdateTileBank, onNavigateToAsset, onShowContextMenu, currentScreenMode, zoom, setZoom, copiedBossPhase, setCopiedBossPhase }) => {
    
    const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(boss.phases[0]?.id || null);
    const [editMode, setEditMode] = useState<BossEditMode>('tiles');
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [tileSelection, setTileSelection] = useState<BossTileSelection | null>(null);
    const [copiedBossTileBlock, setCopiedBossTileBlock] = useState<CopiedBossTileBlock | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [collapsedAttackIds, setCollapsedAttackIds] = useState<Set<string>>(() => new Set());
    const [selectedWeakPointCoord, setSelectedWeakPointCoord] = useState<{ x: number; y: number } | null>(null);
    const [selectedFireOriginAttackId, setSelectedFireOriginAttackId] = useState<string | null>(null);
    const [selectedCompatibilityTileBankId, setSelectedCompatibilityTileBankId] = useState<string>('');
    const bossPackageInputRef = useRef<HTMLInputElement>(null);
    const projectTileBanks = useMemo<TileBank[]>(() => (
        allAssets
            .filter(asset => asset.type === 'tilebank')
            .map(asset => {
                const tileBank = asset.data as TileBank | undefined;
                return tileBank && Array.isArray(tileBank.banks)
                    ? { ...tileBank, id: tileBank.id || asset.id, name: asset.name || tileBank.name }
                    : null;
            })
            .filter((tileBank): tileBank is TileBank => !!tileBank)
    ), [allAssets]);
    
    const [assetPickerState, setAssetPickerState] = useState<{
        isOpen: boolean; assetTypeToPick: ProjectAsset['type'] | null;
        onSelect: ((assetId: string) => void) | null; currentValue: string | null;
    }>({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });

    useEffect(() => {
        setTileSelection(null);
    }, [selectedPhaseId, editMode]);

    useEffect(() => {
        setSelectedWeakPointCoord(null);
    }, [selectedPhaseId]);

    useEffect(() => {
        if (editMode !== 'weakpoints') setSelectedWeakPointCoord(null);
    }, [editMode]);

    useEffect(() => {
        if (!selectedFireOriginAttackId) return;
        const selectedAttack = boss.attacks?.find(attack => attack.id === selectedFireOriginAttackId);
        if (!selectedAttack || !supportsFireOrigin(selectedAttack)) {
            setSelectedFireOriginAttackId(null);
        }
    }, [boss.attacks, selectedFireOriginAttackId]);

    useEffect(() => {
        if (!selectedCompatibilityTileBankId && projectTileBanks[0]?.id) {
            setSelectedCompatibilityTileBankId(projectTileBanks[0].id);
        } else if (selectedCompatibilityTileBankId && !projectTileBanks.some(tileBank => tileBank.id === selectedCompatibilityTileBankId)) {
            setSelectedCompatibilityTileBankId(projectTileBanks[0]?.id || '');
        }
    }, [selectedCompatibilityTileBankId, projectTileBanks]);

    const openAssetPicker = (assetType: ProjectAsset['type'], currentValue: string | undefined, onSelectCallback: (assetId: string) => void) => {
        setAssetPickerState({
            isOpen: true,
            assetTypeToPick: assetType,
            onSelect: onSelectCallback,
            currentValue: currentValue || null,
        });
    };

    const handleUpdateField = (field: keyof Boss, value: any) => {
        onUpdate({ [field]: value });
    };

    const handleExportBossPackage = () => {
        const bossPackage = createBossExportPackage(boss, allAssets);
        const filename = `${sanitizeBossPackageFilename(boss.name)}.boss.json`;
        downloadTextFile(filename, JSON.stringify(bossPackage, null, 2), 'application/json');
    };

    const handleImportBossPackage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            try {
                const packageData = parseBossExportPackage(String(loadEvent.target?.result || ''));
                const { boss: importedBoss, assetsToCreate } = remapBossPackageForImport(packageData, allAssets, {
                    bossId: boss.id,
                    bossName: boss.name,
                    existingTileBankIds: new Set(projectTileBanks.map(tileBank => tileBank.id)),
                });
                onUpdate(importedBoss, assetsToCreate);
                setSelectedPhaseId(importedBoss.phases[0]?.id || null);
                setTileSelection(null);
            } catch (error) {
                console.error('Error importing Boss package:', error);
                window.alert('Could not import this Boss JSON. The file may be corrupted or in the wrong format.');
            } finally {
                event.target.value = '';
            }
        };
        reader.onerror = () => {
            window.alert('Could not read the selected Boss JSON file.');
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleAddPhase = () => {
        const newPhase: BossPhase = {
            id: `phase_${Date.now()}`, name: `Phase ${boss.phases.length + 1}`, healthThreshold: 0,
            buildType: 'tile', dimensions: { width: 8, height: 8 },
            tileMatrix: Array(8).fill(null).map(() => Array(8).fill(null)),
            collisionMatrix: Array(8).fill(null).map(() => Array(8).fill(false)),
            weakPoints: [], neckChain: createDefaultBossNeckChain(), crushMovement: createDefaultBossCrushMovement(), behaviorLoop: [], attackSequence: []
        };
        const currentPhasesEnabled = boss.phasesEnabled || Array(boss.phases.length).fill(true);
        onUpdate({
            phases: [...boss.phases, newPhase],
            phasesEnabled: [...currentPhasesEnabled, true]
        });
        setSelectedPhaseId(newPhase.id);
    };

    const handleTogglePhaseEnabled = (index: number) => {
        const currentPhasesEnabled = boss.phasesEnabled || Array(boss.phases.length).fill(true);
        const newPhasesEnabled = [...currentPhasesEnabled];
        newPhasesEnabled[index] = !newPhasesEnabled[index];
        onUpdate({ phasesEnabled: newPhasesEnabled });
    };

    const handleDuplicatePhase = () => {
        if (!selectedPhase) return;

        const clonedPhase: BossPhase = {
            ...JSON.parse(JSON.stringify(selectedPhase)),
            id: `phase_${Date.now()}`,
            name: `${selectedPhase.name} Copy`,
        };
        const insertIndex = boss.phases.findIndex(phase => phase.id === selectedPhase.id) + 1;
        const currentPhasesEnabled = boss.phasesEnabled || Array(boss.phases.length).fill(true);
        const updatedPhases = [...boss.phases];
        const updatedPhasesEnabled = [...currentPhasesEnabled];
        updatedPhases.splice(insertIndex, 0, clonedPhase);
        updatedPhasesEnabled.splice(insertIndex, 0, true);

        onUpdate({ phases: updatedPhases, phasesEnabled: updatedPhasesEnabled });
        setSelectedPhaseId(clonedPhase.id);
    };

    const handleDeletePhase = () => {
        if (!selectedPhase || boss.phases.length <= 1) return;

        const selectedIndex = boss.phases.findIndex(phase => phase.id === selectedPhase.id);
        const updatedPhases = boss.phases.filter(phase => phase.id !== selectedPhase.id);
        const currentPhasesEnabled = boss.phasesEnabled || Array(boss.phases.length).fill(true);
        const updatedPhasesEnabled = currentPhasesEnabled.filter((_, index) => index !== selectedIndex);
        const nextSelectedIndex = clampNumber(selectedIndex, 0, updatedPhases.length - 1);

        onUpdate({ phases: updatedPhases, phasesEnabled: updatedPhasesEnabled });
        setSelectedPhaseId(updatedPhases[nextSelectedIndex]?.id || null);
    };

    const handleCopyPhase = () => {
        if (!selectedPhase) return;
        const dataToCopy: CopiedBossPhaseData = {
            tileMatrix: JSON.parse(JSON.stringify(selectedPhase.tileMatrix || [])),
            collisionMatrix: JSON.parse(JSON.stringify(selectedPhase.collisionMatrix || [])),
            dimensions: { ...(selectedPhase.dimensions || { width: 8, height: 8 }) },
            forms: selectedPhase.forms ? JSON.parse(JSON.stringify(selectedPhase.forms)) as BossForm[] : undefined,
            initialFormId: selectedPhase.initialFormId,
            neckChain: selectedPhase.neckChain ? JSON.parse(JSON.stringify(selectedPhase.neckChain)) : undefined,
            crushMovement: selectedPhase.crushMovement ? JSON.parse(JSON.stringify(selectedPhase.crushMovement)) : undefined,
            behaviorLoop: selectedPhase.behaviorLoop ? JSON.parse(JSON.stringify(selectedPhase.behaviorLoop)) as BossBehaviorAction[] : undefined,
        };
        setCopiedBossPhase(dataToCopy);
    };

    const handlePastePhase = () => {
        if (!selectedPhase || !copiedBossPhase) return;

        const updatedPhaseData = {
            tileMatrix: copiedBossPhase.tileMatrix,
            collisionMatrix: copiedBossPhase.collisionMatrix,
            dimensions: copiedBossPhase.dimensions,
            forms: copiedBossPhase.forms,
            initialFormId: copiedBossPhase.initialFormId,
            neckChain: copiedBossPhase.neckChain,
            crushMovement: copiedBossPhase.crushMovement,
            behaviorLoop: copiedBossPhase.behaviorLoop,
        };

        const updatedPhases = boss.phases.map(p =>
            p.id === selectedPhaseId ? { ...p, ...updatedPhaseData } : p
        );

        onUpdate({ phases: updatedPhases });
    };

    const handleUpdatePhase = (phaseId: string, field: keyof BossPhase, value: any) => {
        const updatedPhases = boss.phases.map(p => {
            if (p.id === phaseId) {
                let updatedPhase = { ...p, [field]: value };

                if (field === 'buildType' && value === 'tile') {
                    if (!updatedPhase.dimensions) updatedPhase.dimensions = { width: 8, height: 8 };
                    const { width, height } = updatedPhase.dimensions;
                    if (!updatedPhase.tileMatrix || updatedPhase.tileMatrix.length !== height || updatedPhase.tileMatrix[0]?.length !== width) {
                         updatedPhase.tileMatrix = Array(height).fill(null).map(() => Array(width).fill(null));
                    }
                    if (!updatedPhase.collisionMatrix || updatedPhase.collisionMatrix.length !== height || updatedPhase.collisionMatrix[0]?.length !== width) {
                        updatedPhase.collisionMatrix = Array(height).fill(null).map(() => Array(width).fill(false));
                    }
                     if (!updatedPhase.weakPoints) updatedPhase.weakPoints = [];
                }

                if (field === 'dimensions') {
                    const newWidth = value.width || 8;
                    const newHeight = value.height || 8;
                    const oldWidth = p.dimensions?.width || 0;
                    const oldHeight = p.dimensions?.height || 0;

                    const oldTileMatrix = p.tileMatrix || [];
                    const newTileMatrix = Array(newHeight).fill(null).map((_, y) => 
                        Array(newWidth).fill(null).map((_, x) => (y < oldHeight && x < oldWidth && oldTileMatrix[y]) ? oldTileMatrix[y][x] : null)
                    );
                    updatedPhase.tileMatrix = newTileMatrix;
                    
                    const oldCollisionMatrix = p.collisionMatrix || [];
                    const newCollisionMatrix = Array(newHeight).fill(null).map((_, y) => 
                        Array(newWidth).fill(false).map((_, x) => (y < oldHeight && x < oldWidth && oldCollisionMatrix[y]) ? (oldCollisionMatrix[y][x] ?? false) : false)
                    );
                    updatedPhase.collisionMatrix = newCollisionMatrix;

                    if (p.weakPoints) {
                        updatedPhase.weakPoints = p.weakPoints.filter(wp => wp.x < newWidth && wp.y < newHeight);
                    }

                    if (p.neckChain) {
                        updatedPhase.neckChain = {
                            ...p.neckChain,
                            segments: p.neckChain.segments.filter(segment => segment.x < newWidth && segment.y < newHeight),
                        };
                    }
                }
                return updatedPhase;
            }
            return p;
        });
        onUpdate({ phases: updatedPhases });
    };
    
    const handleGridClick = (x: number, y: number) => {
        const currentPhase = boss.phases.find(p => p.id === selectedPhaseId);
        if (!currentPhase || currentPhase.buildType !== 'tile') return;

        if (editMode === 'fireorigin') {
            if (!selectedFireOriginAttackId) return;
            const originOffsets = getSpawnOffsetFromOriginCell(x, y, currentPhase);
            onUpdate({
                attacks: bossAttacks.map(attack => (
                    attack.id === selectedFireOriginAttackId
                        ? { ...attack, ...originOffsets }
                        : attack
                )),
            });
            return;
        }

        const updatedPhases = boss.phases.map(p => {
            if (p.id === selectedPhaseId) {
                const newPhase = { ...p };
                switch (editMode) {
                    case 'tiles':
                        const newMatrix = (newPhase.tileMatrix || []).map(row => [...row]);
                        if (newMatrix[y]) {
                            newMatrix[y][x] = selectedTileId;
                            newPhase.tileMatrix = newMatrix;
                        }
                        break;
                    case 'collision':
                        const newCollisionMatrix = clonePhaseCollisionMatrix(newPhase);
                        newCollisionMatrix[y][x] = !newCollisionMatrix[y][x];
                        newPhase.collisionMatrix = newCollisionMatrix;
                        break;
                    case 'weakpoints':
                        const newWeakPoints = [...(newPhase.weakPoints || [])];
                        const existingWpIndex = newWeakPoints.findIndex(wp => wp.x === x && wp.y === y);
                        if (existingWpIndex > -1) {
                            if (selectedWeakPointCoord?.x === x && selectedWeakPointCoord?.y === y) {
                                newWeakPoints.splice(existingWpIndex, 1);
                                setSelectedWeakPointCoord(null);
                            } else {
                                setSelectedWeakPointCoord({ x, y });
                            }
                        } else {
                            newWeakPoints.push({ x, y, health: 1 });
                            setSelectedWeakPointCoord({ x, y });
                        }
                        newPhase.weakPoints = newWeakPoints;
                        break;
                    case 'neck':
                        const neckChain = newPhase.neckChain || createDefaultBossNeckChain();
                        const nextSegments = [...neckChain.segments];
                        const existingSegmentIndex = nextSegments.findIndex(segment => segment.x === x && segment.y === y);
                        if (existingSegmentIndex > -1) {
                            nextSegments.splice(existingSegmentIndex, 1);
                        } else if (newPhase.tileMatrix?.[y]?.[x]) {
                            nextSegments.push({ x, y });
                        }
                        newPhase.neckChain = { ...neckChain, enabled: true, segments: nextSegments };
                        break;
                }
                return newPhase;
            }
            return p;
        });
        onUpdate({ phases: updatedPhases });
    };

    const applySolidTilesToCollision = () => {
        if (!selectedPhaseId) return;

        const updatedPhases = boss.phases.map(phase => {
            if (phase.id !== selectedPhaseId || phase.buildType !== 'tile') return phase;
            return {
                ...phase,
                collisionMatrix: buildSolidTileCollisionMatrix(phase, tileById),
            };
        });
        onUpdate({ phases: updatedPhases });
    };

    const handleEditModeChange = (mode: BossEditMode) => {
        if (mode === 'collision') {
            const currentPhase = boss.phases.find(phase => phase.id === selectedPhaseId);
            if (currentPhase?.buildType === 'tile' && !isPhaseCollisionMatrixSized(currentPhase)) {
                const updatedPhases = boss.phases.map(phase => (
                    phase.id === selectedPhaseId && phase.buildType === 'tile'
                        ? { ...phase, collisionMatrix: buildSolidTileCollisionMatrix(phase, tileById) }
                        : phase
                ));
                onUpdate({ phases: updatedPhases });
            }
        }
        setEditMode(mode);
    };

    const handleCreateNewTile = (cellX: number, cellY: number) => {
        const id = `tile_boss_${Date.now()}`;
        const name = `${boss.name}_part_${cellY}_${cellX}`;
        const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";
        const initialColor = isScreen2 ? DEFAULT_SCREEN2_FG_COLOR : MSX_SCREEN5_PALETTE[1].hex;
        const tileW = isScreen2 ? EDITOR_BASE_TILE_DIM_S2 : DEFAULT_TILE_WIDTH;
        const tileH = isScreen2 ? EDITOR_BASE_TILE_DIM_S2 : DEFAULT_TILE_HEIGHT;
    
        const newTileData: Tile = {
            id, name, width: tileW, height: tileH,
            data: Array(tileH).fill(null).map(() => Array(tileW).fill(initialColor)),
            ...(isScreen2 && { lineAttributes: createDefaultLineAttributes(tileW, tileH, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR) }),
            logicalProperties: { mapId: 0, familyId: 0, instanceId: 0, isSolid: false, isBreakable: false, isMovable: false, causesDamage: false, isInteractiveSwitch: false, isInteractable: false, interactionType: 'none', interactionValue: 1, interactionTarget: '' }
        };

        const newAsset: ProjectAsset = { id, name, type: 'tile', data: newTileData };
        const updatedPhases = boss.phases.map(p => {
            if (p.id === selectedPhaseId) {
                const newMatrix = (p.tileMatrix || []).map(row => [...row]);
                if (newMatrix[cellY]) newMatrix[cellY][cellX] = id;
                return { ...p, tileMatrix: newMatrix };
            }
            return p;
        });
        
        onUpdate({ phases: updatedPhases }, [newAsset]);
        onNavigateToAsset(id, EditorType.Tile);
    };

    const handleCreateMirroredTile = (sourceTile: Tile, axis: 'horizontal' | 'vertical') => {
        const id = `tile_boss_mirror_${axis}_${Date.now()}`;
        const suffix = axis === 'horizontal' ? 'mirror_h' : 'mirror_v';
        const name = `${sourceTile.name}_${suffix}`;
        const mirroredTile: Tile = {
            ...JSON.parse(JSON.stringify(sourceTile)),
            id,
            name,
            data: mirrorPixelData(sourceTile.data, axis),
            lineAttributes: mirrorLineAttributes(sourceTile.lineAttributes, axis),
            logicalProperties: { ...sourceTile.logicalProperties },
            screen5Palette: sourceTile.screen5Palette ? sourceTile.screen5Palette.map(color => ({ ...color })) : undefined,
        };
        const newAsset: ProjectAsset = { id, name, type: 'tile', data: mirroredTile };
        onUpdate({}, [newAsset]);
        setSelectedTileId(id);
    };

    const handleGridContextMenu = (event: React.MouseEvent, x: number, y: number) => {
        const currentPhase = boss.phases.find(p => p.id === selectedPhaseId);
        if (!currentPhase || currentPhase.buildType !== 'tile' || editMode !== 'tiles') return;
        event.preventDefault();
        
        const tileIdAtCell = currentPhase.tileMatrix?.[y]?.[x];
        const tileAssetAtCell = tileIdAtCell ? tileset.find(t => t.id === tileIdAtCell) : null;
        
        const menuItems: ContextMenuItem[] = [
            {
                label: 'Select Current Tile',
                icon: <ViewfinderCircleIcon className="w-4 h-4" />,
                onClick: () => { if (tileIdAtCell) setSelectedTileId(tileIdAtCell); },
                disabled: !tileIdAtCell
            },
            { isSeparator: true },
            {
                label: 'Create New Tile...',
                icon: <PlusCircleIcon className="w-4 h-4" />,
                onClick: () => handleCreateNewTile(x, y)
            },
            {
                label: `Edit Tile: ${tileAssetAtCell?.name || ''}`,
                icon: <PencilIcon className="w-4 h-4" />,
                onClick: () => tileIdAtCell && onNavigateToAsset(tileIdAtCell, EditorType.Tile),
                disabled: !tileIdAtCell
            },
            { isSeparator: true },
            {
                label: 'Clear Tile',
                icon: <TrashIcon className="w-4 h-4" />,
                onClick: () => {
                    const updatedPhases = boss.phases.map(p => {
                        if (p.id === selectedPhaseId) {
                            const newMatrix = (p.tileMatrix || []).map(row => [...row]);
                            if (newMatrix[y]) newMatrix[y][x] = null;
                            return { ...p, tileMatrix: newMatrix };
                        }
                        return p;
                    });
                    onUpdate({ phases: updatedPhases });
                },
                disabled: !tileIdAtCell
            }
        ];
        onShowContextMenu({ x: event.clientX, y: event.clientY }, menuItems);
    };

    const selectedPhase = useMemo(() => boss.phases.find(p => p.id === selectedPhaseId), [boss.phases, selectedPhaseId]);
    const tileset = useMemo(() => allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile), [allAssets]);
    const allTiles = useMemo(() => allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile), [allAssets]);
    const tileById = useMemo<Map<string, Tile>>(() => new Map(allTiles.map(tile => [tile.id, tile])), [allTiles]);
    const bossAttacks = boss.attacks || [];
    const selectedFireOriginAttack = bossAttacks.find(attack => attack.id === selectedFireOriginAttackId) || null;
    const fireOriginMarkers = useMemo<BossFireOriginMarker[]>(() => (
        bossAttacks
            .filter(supportsFireOrigin)
            .map((attack, index) => {
                const origin = getAttackOriginCell(attack, selectedPhase);
                return {
                    ...origin,
                    label: String(index + 1),
                    title: `${attack.name} (${attack.type})`,
                    selected: attack.id === selectedFireOriginAttackId,
                };
            })
    ), [bossAttacks, selectedFireOriginAttackId, selectedPhase]);
    const selectedNeckChain = selectedPhase?.neckChain || createDefaultBossNeckChain();
    const selectedCrushMovement = selectedPhase?.crushMovement || createDefaultBossCrushMovement();
    const selectedPhaseTileCount = getPhaseTileCount(selectedPhase);
    const selectedVisibleContentBounds = useMemo(() => getMatrixContentBounds(selectedPhase?.tileMatrix, tileById), [selectedPhase?.tileMatrix, tileById]);
    const linkedBossPreviewStart = useMemo(() => {
        if (!boss.linkedScreenId) return null;
        const linkedScreenAsset = allAssets.find(asset => asset.id === boss.linkedScreenId && (asset.type === 'screenmap' || asset.type === 'msx2screen'));
        if (linkedScreenAsset?.type === 'msx2screen') {
            const linkedScreen = linkedScreenAsset.data as Msx2Screen5TileScreen | undefined;
            const bossEntity = linkedScreen?.layers?.entities?.find(entity =>
                entity.kind === 'custom' && (
                    entity.id === boss.id ||
                    entity.name === boss.name ||
                    entity.params?.bossAssetId === boss.id ||
                    entity.components?.boss?.bossAssetId === boss.id
                )
            );
            if (bossEntity?.position) {
                return {
                    x: Math.floor(bossEntity.position.x / 8),
                    y: Math.floor(bossEntity.position.y / 8),
                };
            }
            return null;
        }
        const linkedScreen = linkedScreenAsset?.data as ScreenMap | undefined;
        const linkedBossInstance = linkedScreen?.bossInstances?.find(instance => instance.bossAssetId === boss.id);
        return linkedBossInstance
            ? { x: linkedBossInstance.xChar, y: linkedBossInstance.yChar }
            : null;
    }, [allAssets, boss.id, boss.linkedScreenId]);
    const previewStartX = Number.isFinite(boss.behaviorPreviewStartXChar)
        ? boss.behaviorPreviewStartXChar as number
        : linkedBossPreviewStart?.x;
    const previewStartY = Number.isFinite(boss.behaviorPreviewStartYChar)
        ? boss.behaviorPreviewStartYChar as number
        : linkedBossPreviewStart?.y;
    const canTrimSelectedPhase = !!(
        selectedPhase?.dimensions
        && selectedVisibleContentBounds
        && (
            selectedVisibleContentBounds.minX > 0
            || selectedVisibleContentBounds.minY > 0
            || selectedVisibleContentBounds.maxX < selectedPhase.dimensions.width - 1
            || selectedVisibleContentBounds.maxY < selectedPhase.dimensions.height - 1
        )
    );
    const selectedWeakPoints = selectedPhase?.weakPoints || [];
    const selectedWeakPoint = selectedWeakPointCoord
        ? selectedWeakPoints.find(weakPoint => weakPoint.x === selectedWeakPointCoord.x && weakPoint.y === selectedWeakPointCoord.y) || null
        : null;

    const assignedTileIds = useMemo(() => {
        const assignedTileIds = new Set<string>();
        projectTileBanks.forEach(tileBank => {
            tileBank.banks?.forEach(bank => {
                Object.keys(bank.assignedTiles || {}).forEach(tileId => {
                    assignedTileIds.add(tileId);
                });
            });
        });

        return assignedTileIds;
    }, [projectTileBanks]);

    const showUnassignedTilesWarning = useMemo(() => (
        allTiles.some(tile => tile.width === 8 && tile.height === 8 && !assignedTileIds.has(tile.id))
    ), [allTiles, assignedTileIds]);

    const bossTileBankRequirements = useMemo<Map<string, Set<number>>>(() => {
        const requirements = new Map<string, Set<number>>();
        const addRequirement = (tileId: string | null | undefined) => {
            if (!tileId) return;
            const bankIndexes = requirements.get(tileId) || new Set<number>();
            bankIndexes.add(0);
            bankIndexes.add(1);
            bankIndexes.add(2);
            requirements.set(tileId, bankIndexes);
        };
        const addMatrix = (matrix?: (string | null)[][]) => {
            matrix?.forEach(row => row.forEach(tileId => addRequirement(tileId)));
        };

        boss.phases.forEach(phase => {
            addMatrix(phase.tileMatrix);
            phase.forms?.forEach(form => addMatrix(form.tileMatrix));
            phase.weakPoints?.forEach(weakPoint => addRequirement(weakPoint.destroyedTileId));
            phase.forms?.forEach(form => form.weakPoints?.forEach(weakPoint => addRequirement(weakPoint.destroyedTileId)));
        });
        boss.attacks?.forEach(attack => {
            addRequirement(attack.laserTileAssetId);
            addRequirement(attack.blockTileAssetId);
        });

        return requirements;
    }, [boss.phases, boss.attacks]);

    const selectedCompatibilityTileBank = useMemo(
        () => projectTileBanks.find(tileBank => tileBank.id === selectedCompatibilityTileBankId),
        [projectTileBanks, selectedCompatibilityTileBankId]
    );

    const bossBankCompatibility = useMemo((): BossBankTileCompatibility[] => {
        if (!selectedCompatibilityTileBank) return [];

        const tileHashes = new Map(allTiles.map(tile => [tile.id, tileGraphicHash(tile)]));
        const bankAssignedTileIdsByIndex = selectedCompatibilityTileBank.banks.map(bank => new Set(Object.keys(bank.assignedTiles || {})));

        const requirementEntries = Array.from(bossTileBankRequirements.entries()) as [string, Set<number>][];
        return requirementEntries.map(([tileId, bankIndexes]): BossBankTileCompatibility => {
            const tile = tileById.get(tileId);
            const requiredBankIndexes = Array.from(bankIndexes).sort((a: number, b: number) => a - b);
            if (!tile) {
                return {
                    tileId,
                    tileName: tileId,
                    requiredBankIndexes,
                    charsNeeded: 0,
                    status: 'missing',
                };
            }

            const charsNeeded = getTileCharsNeeded(tile);
            const requiredBanks = requiredBankIndexes
                .map(bankIndex => selectedCompatibilityTileBank.banks[bankIndex])
                .filter((bank): bank is TileBankDefinition => !!bank);
            const currentAssignedCharCodes = requiredBanks
                .map(bank => Number((bank.assignedTiles?.[tileId] as any)?.charCode))
                .filter(charCode => Number.isFinite(charCode));
            const hasConsistentAssignment = currentAssignedCharCodes.length === requiredBanks.length
                && currentAssignedCharCodes.every(charCode => charCode === currentAssignedCharCodes[0]);
            const sharedCharCode = findSharedAvailableCharBlock(requiredBanks, tileById, tileId, charsNeeded);
            const isAssignedEverywhere = requiredBankIndexes.every(bankIndex => bankAssignedTileIdsByIndex[bankIndex]?.has(tileId));
            if (isAssignedEverywhere && hasConsistentAssignment && sharedCharCode === currentAssignedCharCodes[0]) {
                return {
                    tileId,
                    tileName: tile.name,
                    requiredBankIndexes,
                    charsNeeded,
                    status: 'assigned',
                    charCode: sharedCharCode,
                };
            }

            const tileHash = tileHashes.get(tileId);
            const matchingTile = allTiles.find(candidate => {
                if (candidate.id === tileId || tileGraphicHash(candidate) !== tileHash) return false;
                const candidateSharedCharCode = findSharedAvailableCharBlock(requiredBanks, tileById, candidate.id, charsNeeded);
                return candidateSharedCharCode !== -1
                    && requiredBankIndexes.every(bankIndex => bankAssignedTileIdsByIndex[bankIndex]?.has(candidate.id));
            });
            if (matchingTile) {
                return {
                    tileId,
                    tileName: tile.name,
                    requiredBankIndexes,
                    charsNeeded,
                    status: 'identical',
                    charCode: findSharedAvailableCharBlock(requiredBanks, tileById, matchingTile.id, charsNeeded),
                    matchedTileId: matchingTile.id,
                    matchedTileName: matchingTile.name,
                };
            }

            const targetCharCode = requiredBanks.some(bank => bank.isLocked)
                ? -1
                : findSharedAvailableCharBlock(requiredBanks, tileById, tileId, charsNeeded);

            return {
                tileId,
                tileName: tile.name,
                requiredBankIndexes,
                charsNeeded,
                status: targetCharCode !== -1 ? 'canAdd' : 'noSpace',
                charCode: targetCharCode !== -1 ? targetCharCode : undefined,
            };
        }).sort((a, b) => {
            const statusOrder: Record<BossBankTileStatus, number> = { noSpace: 0, missing: 1, canAdd: 2, identical: 3, assigned: 4 };
            return statusOrder[a.status] - statusOrder[b.status] || a.tileName.localeCompare(b.tileName);
        });
    }, [allTiles, bossTileBankRequirements, selectedCompatibilityTileBank, tileById]);

    const bossBankCompatibilityCounts = useMemo(() => (
        bossBankCompatibility.reduce<Record<BossBankTileStatus, number>>((counts, item) => {
            counts[item.status] += 1;
            return counts;
        }, { assigned: 0, identical: 0, canAdd: 0, noSpace: 0, missing: 0 })
    ), [bossBankCompatibility]);

    const createPhaseTileMatrix = (phase: BossPhase): (string | null)[][] => {
        const width = phase.dimensions?.width ?? 0;
        const height = phase.dimensions?.height ?? 0;
        return Array.from({ length: height }, (_, y) => (
            Array.from({ length: width }, (_, x) => phase.tileMatrix?.[y]?.[x] ?? null)
        ));
    };

    const getClampedTileSelection = (): BossTileSelection | null => {
        if (!selectedPhase?.dimensions || selectedPhase.buildType !== 'tile' || !tileSelection) return null;

        const phaseWidth = selectedPhase.dimensions.width;
        const phaseHeight = selectedPhase.dimensions.height;
        if (phaseWidth <= 0 || phaseHeight <= 0) return null;

        const x = clampNumber(tileSelection.x, 0, phaseWidth - 1);
        const y = clampNumber(tileSelection.y, 0, phaseHeight - 1);
        const width = Math.min(tileSelection.width, phaseWidth - x);
        const height = Math.min(tileSelection.height, phaseHeight - y);

        return width > 0 && height > 0 ? { x, y, width, height } : null;
    };

    const updateSelectedPhaseTileMatrix = (updater: (matrix: (string | null)[][], phase: BossPhase) => (string | null)[][]) => {
        if (!selectedPhaseId) return;

        const updatedPhases = boss.phases.map(phase => {
            if (phase.id !== selectedPhaseId || phase.buildType !== 'tile') return phase;

            const nextMatrix = updater(createPhaseTileMatrix(phase), phase);
            return { ...phase, tileMatrix: nextMatrix };
        });
        onUpdate({ phases: updatedPhases });
    };

    const copyTileSelection = () => {
        const selection = getClampedTileSelection();
        if (!selectedPhase || !selection) return;

        const matrix = createPhaseTileMatrix(selectedPhase);
        setCopiedBossTileBlock({
            width: selection.width,
            height: selection.height,
            tileMatrix: Array.from({ length: selection.height }, (_, y) => (
                Array.from({ length: selection.width }, (_, x) => matrix[selection.y + y]?.[selection.x + x] ?? null)
            )),
        });
    };

    const clearTileSelection = () => {
        const selection = getClampedTileSelection();
        if (!selection) return;

        updateSelectedPhaseTileMatrix(matrix => {
            const nextMatrix = matrix.map(row => [...row]);
            for (let y = selection.y; y < selection.y + selection.height; y++) {
                for (let x = selection.x; x < selection.x + selection.width; x++) {
                    if (nextMatrix[y]) nextMatrix[y][x] = null;
                }
            }
            return nextMatrix;
        });
    };

    const moveTileSelection = (dx: number, dy: number) => {
        const selection = getClampedTileSelection();
        if (!selectedPhase?.dimensions || !selection) return;

        const nextX = clampNumber(selection.x + dx, 0, selectedPhase.dimensions.width - selection.width);
        const nextY = clampNumber(selection.y + dy, 0, selectedPhase.dimensions.height - selection.height);
        if (nextX === selection.x && nextY === selection.y) return;
        const actualDx = nextX - selection.x;
        const actualDy = nextY - selection.y;

        const updatedPhases = boss.phases.map(phase => {
            if (phase.id !== selectedPhaseId || phase.buildType !== 'tile') return phase;

            const matrix = createPhaseTileMatrix(phase);
            const block = Array.from({ length: selection.height }, (_, y) => (
                Array.from({ length: selection.width }, (_, x) => matrix[selection.y + y]?.[selection.x + x] ?? null)
            ));
            const nextMatrix = matrix.map(row => [...row]);

            for (let y = selection.y; y < selection.y + selection.height; y++) {
                for (let x = selection.x; x < selection.x + selection.width; x++) {
                    if (nextMatrix[y]) nextMatrix[y][x] = null;
                }
            }

            block.forEach((row, y) => {
                row.forEach((tileId, x) => {
                    if (nextMatrix[nextY + y]) nextMatrix[nextY + y][nextX + x] = tileId;
                });
            });

            return {
                ...phase,
                tileMatrix: nextMatrix,
                behaviorLoop: shiftFixedBehaviorTargets(phase.behaviorLoop, -actualDx, -actualDy),
            };
        });

        onUpdate({
            phases: updatedPhases,
            ...(Number.isFinite(previewStartX)
                ? { behaviorPreviewStartXChar: (previewStartX as number) - actualDx }
                : {}),
            ...(Number.isFinite(previewStartY)
                ? { behaviorPreviewStartYChar: (previewStartY as number) - actualDy }
                : {}),
        });
        setTileSelection({ ...selection, x: nextX, y: nextY });
    };

    const pasteTileSelection = () => {
        if (!selectedPhase?.dimensions || !copiedBossTileBlock) return;

        const destination = getClampedTileSelection();
        const destX = destination?.x ?? 0;
        const destY = destination?.y ?? 0;
        const pasteWidth = Math.min(copiedBossTileBlock.width, selectedPhase.dimensions.width - destX);
        const pasteHeight = Math.min(copiedBossTileBlock.height, selectedPhase.dimensions.height - destY);
        if (pasteWidth <= 0 || pasteHeight <= 0) return;

        updateSelectedPhaseTileMatrix(matrix => {
            const nextMatrix = matrix.map(row => [...row]);
            for (let y = 0; y < pasteHeight; y++) {
                for (let x = 0; x < pasteWidth; x++) {
                    if (nextMatrix[destY + y]) nextMatrix[destY + y][destX + x] = copiedBossTileBlock.tileMatrix[y]?.[x] ?? null;
                }
            }
            return nextMatrix;
        });
        setTileSelection({ x: destX, y: destY, width: pasteWidth, height: pasteHeight });
    };

    const selectFilledTiles = () => {
        if (!selectedPhase?.dimensions) return;

        const bounds = getPhaseContentBounds(selectedPhase, tileById);
        setTileSelection(bounds
            ? { x: bounds.minX, y: bounds.minY, width: bounds.maxX - bounds.minX + 1, height: bounds.maxY - bounds.minY + 1 }
            : null
        );
    };

    const trimSelectedPhaseToContent = () => {
        if (!selectedPhaseId || !selectedPhase?.dimensions || !selectedVisibleContentBounds) return;

        const bounds = selectedVisibleContentBounds;
        trimSelectedPhaseToBounds(bounds, 'content');
    };

    const trimSelectedPhaseToSelection = () => {
        if (!activeTileSelection) return;

        trimSelectedPhaseToBounds({
            minX: activeTileSelection.x,
            minY: activeTileSelection.y,
            maxX: activeTileSelection.x + activeTileSelection.width - 1,
            maxY: activeTileSelection.y + activeTileSelection.height - 1,
        }, 'selection');
    };

    const trimSelectedPhaseToBounds = (bounds: BossContentBounds, source: 'content' | 'selection') => {
        if (!selectedPhaseId || !selectedPhase?.dimensions) return;

        const nextWidth = bounds.maxX - bounds.minX + 1;
        const nextHeight = bounds.maxY - bounds.minY + 1;
        const trimOffsetX = bounds.minX;
        const trimOffsetY = bounds.minY;
        const formsWithOutsideTiles = selectedPhase.forms?.filter(form => !boundsContainsBounds(bounds, getMatrixContentBounds(form.tileMatrix, tileById))) || [];
        if (formsWithOutsideTiles.length > 0) {
            const shouldTrim = window.confirm(
                `${source === 'content' ? 'Trim to Content' : 'Trim to Selection'} will crop ${formsWithOutsideTiles.length} form(s) with tiles outside the selected bounds. Continue?`
            );
            if (!shouldTrim) return;
        }

        const nextPreviewStartX = Number.isFinite(previewStartX) ? (previewStartX as number) + trimOffsetX : undefined;
        const nextPreviewStartY = Number.isFinite(previewStartY) ? (previewStartY as number) + trimOffsetY : undefined;

        const updatedPhases = boss.phases.map(phase => {
            if (phase.id !== selectedPhaseId || phase.buildType !== 'tile') return phase;

            return {
                ...phase,
                dimensions: { width: nextWidth, height: nextHeight },
                tileMatrix: cropNullableMatrix<string | null>(phase.tileMatrix, bounds, null),
                collisionMatrix: phase.collisionMatrix
                    ? cropNullableMatrix<boolean>(phase.collisionMatrix, bounds, false)
                    : undefined,
                weakPoints: cropWeakPointsToBounds(phase.weakPoints, bounds),
                neckChain: cropNeckChainToBounds(phase.neckChain, bounds),
                behaviorLoop: shiftFixedBehaviorTargets(phase.behaviorLoop, trimOffsetX, trimOffsetY),
                forms: phase.forms?.map(form => ({
                    ...form,
                    dimensions: { width: nextWidth, height: nextHeight },
                    tileMatrix: cropNullableMatrix<string | null>(form.tileMatrix, bounds, null),
                    collisionMatrix: form.collisionMatrix
                        ? cropNullableMatrix<boolean>(form.collisionMatrix, bounds, false)
                        : undefined,
                    weakPoints: cropWeakPointsToBounds(form.weakPoints, bounds),
                })),
            };
        });

        const shiftedWeakPointCoord = selectedWeakPointCoord
            && selectedWeakPointCoord.x >= bounds.minX
            && selectedWeakPointCoord.y >= bounds.minY
            && selectedWeakPointCoord.x <= bounds.maxX
            && selectedWeakPointCoord.y <= bounds.maxY
            ? { x: selectedWeakPointCoord.x - bounds.minX, y: selectedWeakPointCoord.y - bounds.minY }
            : null;

        onUpdate({
            phases: updatedPhases,
            ...(Number.isFinite(nextPreviewStartX)
                ? { behaviorPreviewStartXChar: nextPreviewStartX }
                : {}),
            ...(Number.isFinite(nextPreviewStartY)
                ? { behaviorPreviewStartYChar: nextPreviewStartY }
                : {}),
        });
        setSelectedWeakPointCoord(shiftedWeakPointCoord);
        setTileSelection({ x: 0, y: 0, width: nextWidth, height: nextHeight });
    };

    const activeTileSelection = getClampedTileSelection();

    const remapTileMatrix = (matrix: (string | null)[][] | undefined, remap: Map<string, string>) => (
        matrix?.map(row => row.map(tileId => tileId && remap.has(tileId) ? remap.get(tileId)! : tileId))
    );

    const remapWeakPoints = (weakPoints: BossPhase['weakPoints'] | undefined, remap: Map<string, string>) => (
        weakPoints?.map(weakPoint => ({
            ...weakPoint,
            destroyedTileId: weakPoint.destroyedTileId && remap.has(weakPoint.destroyedTileId)
                ? remap.get(weakPoint.destroyedTileId)
                : weakPoint.destroyedTileId,
        }))
    );

    const handleMergeBossTilesIntoBank = () => {
        if (!selectedCompatibilityTileBank) return;

        const blockingItems = bossBankCompatibility.filter(item => item.status === 'noSpace' || item.status === 'missing');
        if (blockingItems.length > 0) {
            window.alert(`Cannot merge: ${blockingItems.length} Boss tile(s) are missing or do not fit in the selected Tile Bank.`);
            return;
        }

        const remap = new Map<string, string>();
        bossBankCompatibility.forEach(item => {
            if (item.status === 'identical' && item.matchedTileId) {
                remap.set(item.tileId, item.matchedTileId);
            }
        });

        const nextBanks = selectedCompatibilityTileBank.banks.map(bank => ({
            ...bank,
            assignedTiles: { ...(bank.assignedTiles || {}) },
        }));

        let assignedCount = 0;
        let repairedCount = 0;
        for (const item of bossBankCompatibility) {
            if (item.status !== 'canAdd') continue;
            const tile = tileById.get(item.tileId);
            if (!tile) continue;

            const requiredBanks = item.requiredBankIndexes
                .map(bankIndex => nextBanks[bankIndex])
                .filter((bank): bank is TileBankDefinition => !!bank);
            const nextCharCode = findSharedAvailableCharBlock(requiredBanks, tileById, item.tileId, item.charsNeeded);
            if (nextCharCode === -1) {
                window.alert(`Cannot merge: tile "${item.tileName}" no longer fits in the selected banks.`);
                return;
            }

            for (const bankIndex of item.requiredBankIndexes) {
                const bank = nextBanks[bankIndex];
                if (!bank) continue;

                if (!isCharBlockAvailableInBank(bank, tileById, item.tileId, nextCharCode, item.charsNeeded)) {
                    window.alert(`Cannot merge: tile "${item.tileName}" no longer fits in bank ${bankIndex}.`);
                    return;
                }

                const previousCharCode = Number((bank.assignedTiles[item.tileId] as any)?.charCode);
                bank.assignedTiles[item.tileId] = { charCode: nextCharCode };
                if (Number.isFinite(previousCharCode)) {
                    if (previousCharCode !== nextCharCode) repairedCount++;
                } else {
                    assignedCount++;
                }
            }
        }

        const nextPhases = boss.phases.map(phase => ({
            ...phase,
            tileBankId: phase.buildType === 'tile' ? selectedCompatibilityTileBank.id : phase.tileBankId,
            tileMatrix: remapTileMatrix(phase.tileMatrix, remap),
            weakPoints: remapWeakPoints(phase.weakPoints, remap),
            forms: phase.forms?.map(form => ({
                ...form,
                tileMatrix: remapTileMatrix(form.tileMatrix, remap) || form.tileMatrix,
                weakPoints: remapWeakPoints(form.weakPoints, remap),
            })),
        }));

        const nextAttacks = boss.attacks.map(attack => ({
            ...attack,
            laserTileAssetId: attack.laserTileAssetId && remap.has(attack.laserTileAssetId)
                ? remap.get(attack.laserTileAssetId)
                : attack.laserTileAssetId,
            blockTileAssetId: attack.blockTileAssetId && remap.has(attack.blockTileAssetId)
                ? remap.get(attack.blockTileAssetId)
                : attack.blockTileAssetId,
        }));

        onUpdateTileBank(selectedCompatibilityTileBank.id, { banks: nextBanks });
        onUpdate({ phases: nextPhases, attacks: nextAttacks });

        const remappedCount = remap.size;
        window.alert(`Boss Bank merge complete. Added ${assignedCount} bank assignment(s), repaired ${repairedCount}, reused ${remappedCount} identical tile(s).`);
    };

    const handleUpdateAttack = (attackId: string, field: keyof BossAttack, value: any) => {
        const updatedAttacks = bossAttacks.map(a => a.id === attackId ? { ...a, [field]: value } : a);
        onUpdate({ attacks: updatedAttacks });
    };

    const handleUpdateAttackOriginCell = (attackId: string, x: number, y: number) => {
        const originOffsets = getSpawnOffsetFromOriginCell(x, y, selectedPhase);
        const updatedAttacks = bossAttacks.map(attack => (
            attack.id === attackId ? { ...attack, ...originOffsets } : attack
        ));
        onUpdate({ attacks: updatedAttacks });
    };

    const renderFireOriginControls = (attack: BossAttack) => {
        if (!supportsFireOrigin(attack)) return null;
        const width = Math.max(1, selectedPhase?.dimensions?.width || 1);
        const height = Math.max(1, selectedPhase?.dimensions?.height || 1);
        const origin = getAttackOriginCell(attack, selectedPhase);

        return (
            <div className="col-span-2 rounded border border-orange-400/30 bg-orange-400/10 p-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-orange-300">Fire origin</span>
                    <Button
                        size="sm"
                        variant={selectedFireOriginAttackId === attack.id && editMode === 'fireorigin' ? 'secondary' : 'ghost'}
                        icon={<ViewfinderCircleIcon className="w-3 h-3" />}
                        onClick={() => {
                            setSelectedFireOriginAttackId(attack.id);
                            setEditMode('fireorigin');
                        }}
                    >
                        Pick
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-msx-textsecondary">Origin X tile:</label>
                        <input
                            type="number"
                            min="0"
                            max={width - 1}
                            value={origin.x}
                            onChange={e => handleUpdateAttackOriginCell(attack.id, Math.max(0, Math.min(width - 1, parseInt(e.target.value) || 0)), origin.y)}
                            className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-msx-textsecondary">Origin Y tile:</label>
                        <input
                            type="number"
                            min="0"
                            max={height - 1}
                            value={origin.y}
                            onChange={e => handleUpdateAttackOriginCell(attack.id, origin.x, Math.max(0, Math.min(height - 1, parseInt(e.target.value) || 0)))}
                            className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const handleAddAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Projectile ${bossAttacks.length + 1}`,
            type: 'Projectile',
            damage: 1,
            speed: 3,
            cooldown: 900,
            range: 160,
            projectileDirection: 'left',
            spawnOffsetX: 0,
            spawnOffsetY: 0,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleAddMeteorAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Meteors ${bossAttacks.length + 1}`,
            type: 'Meteor',
            damage: 2,
            speed: 4,
            cooldown: 1200,
            range: 216,
            spawnOffsetX: 0,
            spawnOffsetY: -16,
            meteorCount: 4,
            meteorSpreadX: 32,
            meteorWarningFrames: 18,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleAddSlamRocksAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Slam Rocks ${bossAttacks.length + 1}`,
            type: 'SlamRocks',
            damage: 2,
            speed: 4,
            cooldown: 4000,
            range: 216,
            meteorCount: 4,
            slamRiseChars: 3,
            slamWindupFrames: 16,
            slamFrames: 6,
            slamHoldFrames: 8,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleAddFallingBlocksAttack = () => {
        const defaultBlockTile = allTiles.find(tile => tile.logicalProperties?.isSolid && tile.logicalProperties?.isBreakable)
            || allTiles.find(tile => tile.logicalProperties?.isSolid)
            || allTiles[0];
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Falling Blocks ${bossAttacks.length + 1}`,
            type: 'FallingBlocks',
            damage: 2,
            speed: 4,
            cooldown: 4000,
            range: 216,
            meteorCount: 4,
            blockTileAssetId: defaultBlockTile?.id,
            landingYChar: 20,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleAddBoomerangAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Boomerang ${bossAttacks.length + 1}`,
            type: 'Boomerang',
            damage: 1,
            speed: 3,
            cooldown: 3400,
            range: 96,
            projectileDirection: 'left',
            spawnOffsetX: 0,
            spawnOffsetY: 0,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleAddRockAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Rock ${bossAttacks.length + 1}`,
            type: 'Rock',
            damage: 2,
            speed: 3,
            cooldown: 1400,
            range: 128,
            arcHeight: 40,
            projectileDirection: 'left',
            spawnOffsetX: 0,
            spawnOffsetY: 0,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleAddSineWaveAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Sine Wave ${bossAttacks.length + 1}`,
            type: 'SineWave',
            damage: 1,
            speed: 3,
            cooldown: 1800,
            range: 144,
            projectileDirection: 'left',
            spawnOffsetX: 0,
            spawnOffsetY: 0,
            waveAmplitude: 16,
            waveFrequencyFrames: 4,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleAddHomingMissileAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Homing Missile ${bossAttacks.length + 1}`,
            type: 'HomingMissile',
            damage: 2,
            speed: 3,
            cooldown: 1800,
            range: 176,
            projectileDirection: 'left',
            spawnOffsetX: 0,
            spawnOffsetY: 0,
            homingTurnStep: 2,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleAddLaserAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Laser ${bossAttacks.length + 1}`,
            type: 'Laser',
            damage: 2,
            cooldown: 1200,
            projectileDirection: 'left',
            spawnOffsetX: 0,
            spawnOffsetY: 0,
            laserLengthChars: 12,
            laserDurationFrames: 18,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleAddBombAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`,
            name: `Bombs ${bossAttacks.length + 1}`,
            type: 'Bomb',
            damage: 2,
            cooldown: 1500,
            spawnOffsetX: 0,
            spawnOffsetY: 0,
            bombCount: 3,
            bombSpreadX: 28,
            bombFuseFrames: 45,
            explosionRadius: 24,
            explosionDurationFrames: 18,
        };
        onUpdate({ attacks: [...bossAttacks, newAttack] });
    };

    const handleDeleteAttack = (attackId: string) => {
        const updatedAttacks = bossAttacks.filter(attack => attack.id !== attackId);
        const updatedPhases = boss.phases.map(phase => ({
            ...phase,
            attackSequence: phase.attackSequence.filter(id => id !== attackId),
        }));
        onUpdate({ attacks: updatedAttacks, phases: updatedPhases });
    };

    const handleTogglePhaseAttack = (attackId: string) => {
        if (!selectedPhaseId) return;

        const updatedPhases = boss.phases.map(phase => {
            if (phase.id !== selectedPhaseId) return phase;
            const currentSequence = phase.attackSequence || [];
            const attackSequence = currentSequence.includes(attackId)
                ? currentSequence.filter(id => id !== attackId)
                : [...currentSequence, attackId];
            return { ...phase, attackSequence };
        });

        onUpdate({ phases: updatedPhases });
    };

    const updateSelectedPhaseWeakPoints = (updater: (weakPoints: BossPhaseWeakPoint[]) => BossPhaseWeakPoint[]) => {
        if (!selectedPhaseId) return;

        const updatedPhases = boss.phases.map(phase => (
            phase.id === selectedPhaseId
                ? { ...phase, weakPoints: updater([...(phase.weakPoints || [])]) }
                : phase
        ));
        onUpdate({ phases: updatedPhases });
    };

    const handleUpdateWeakPoint = (x: number, y: number, patch: Partial<BossPhaseWeakPoint>) => {
        updateSelectedPhaseWeakPoints(weakPoints => weakPoints.map(weakPoint => (
            weakPoint.x === x && weakPoint.y === y
                ? { ...weakPoint, ...patch }
                : weakPoint
        )));
    };

    const handleDeleteWeakPoint = (x: number, y: number) => {
        updateSelectedPhaseWeakPoints(weakPoints => weakPoints.filter(weakPoint => weakPoint.x !== x || weakPoint.y !== y));
        if (selectedWeakPointCoord?.x === x && selectedWeakPointCoord?.y === y) {
            setSelectedWeakPointCoord(null);
        }
    };

    const handleClearWeakPoints = () => {
        updateSelectedPhaseWeakPoints(() => []);
        setSelectedWeakPointCoord(null);
    };

    const handleToggleAttackCollapsed = (attackId: string) => {
        setCollapsedAttackIds(current => {
            const next = new Set(current);
            if (next.has(attackId)) {
                next.delete(attackId);
            } else {
                next.add(attackId);
            }
            return next;
        });
    };

    const handleUpdateCrushMovement = (patch: Partial<BossCrushMovement>) => {
        if (!selectedPhaseId) return;

        const updatedPhases = boss.phases.map(phase => {
            if (phase.id !== selectedPhaseId) return phase;
            const currentMovement = phase.crushMovement || createDefaultBossCrushMovement();
            return {
                ...phase,
                crushMovement: { ...currentMovement, ...patch },
            };
        });

        onUpdate({ phases: updatedPhases });
    };

    const handleUpdateNeckChain = (patch: Partial<BossNeckChain>) => {
        if (!selectedPhaseId) return;

        const updatedPhases = boss.phases.map(phase => {
            if (phase.id !== selectedPhaseId) return phase;
            const currentChain = phase.neckChain || createDefaultBossNeckChain();
            return {
                ...phase,
                neckChain: { ...currentChain, ...patch },
            };
        });
        onUpdate({ phases: updatedPhases });
    };

    const handleClearNeckChain = () => {
        handleUpdateNeckChain({ segments: [] });
    };

    const handleReverseNeckChain = () => {
        handleUpdateNeckChain({ segments: [...selectedNeckChain.segments].reverse() });
    };

    const handleRemoveLastNeckSegment = () => {
        handleUpdateNeckChain({ segments: selectedNeckChain.segments.slice(0, -1) });
    };

    const handleSortNeckChain = (axis: 'horizontal' | 'vertical') => {
        const sortedSegments = [...selectedNeckChain.segments].sort((a, b) => (
            axis === 'horizontal'
                ? (a.x - b.x) || (a.y - b.y)
                : (a.y - b.y) || (a.x - b.x)
        ));
        handleUpdateNeckChain({ segments: sortedSegments });
    };

    const handleBuildNeckChainFromFilledTiles = (axis: 'horizontal' | 'vertical') => {
        if (!selectedPhase?.tileMatrix) return;

        const filledSegments = selectedPhase.tileMatrix.flatMap((row, y) => (
            row.map((tileId, x) => tileId ? { x, y } : null).filter((segment): segment is { x: number; y: number } => !!segment)
        ));
        const sortedSegments = filledSegments.sort((a, b) => (
            axis === 'horizontal'
                ? (a.x - b.x) || (a.y - b.y)
                : (a.y - b.y) || (a.x - b.x)
        ));

        handleUpdateNeckChain({ enabled: true, segments: sortedSegments });
        setEditMode('neck');
    };

    return (
        <Panel title={`Boss Editor: ${boss.name}`} className="flex-grow min-h-0 min-w-0 flex flex-col overflow-hidden !p-0">
            <div className="flex min-h-0 min-w-0 flex-grow overflow-hidden" style={{ userSelect: 'none' }}>
                <div className="min-w-0 flex-grow p-3 overflow-auto">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-msx-border/40 pb-2 text-xs">
                        <div className="min-w-0">
                            <div className="truncate text-msx-highlight">{selectedPhase?.name || 'No phase selected'}</div>
                            <div className="text-msx-textsecondary">
                                {selectedPhase?.buildType === 'tile'
                                    ? `${selectedPhase.dimensions?.width || 0}x${selectedPhase.dimensions?.height || 0} tiles · ${selectedPhaseTileCount} filled · ${selectedNeckChain.segments.length} neck segments`
                                    : selectedPhase?.buildType === 'sprite'
                                        ? 'Sprite-based phase'
                                        : 'Select or create a phase'}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                            {(Object.keys(BOSS_EDIT_MODE_LABELS) as BossEditMode[]).map(mode => (
                                <Button
                                    key={mode}
                                    onClick={() => handleEditModeChange(mode)}
                                    variant={editMode === mode ? 'secondary' : 'ghost'}
                                    size="sm"
                                    disabled={!selectedPhase || (mode !== 'behavior' && selectedPhase.buildType !== 'tile')}
                                >
                                    {BOSS_EDIT_MODE_LABELS[mode]}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-start justify-start">
                        {selectedPhase && editMode === 'behavior' ? (
                            <BossBehaviorEditor
                                boss={boss}
                                phase={selectedPhase}
                                allAssets={allAssets}
                                currentScreenMode={currentScreenMode}
                                onUpdatePhase={(patch) => {
                                    const updatedPhases = boss.phases.map(phase => phase.id === selectedPhaseId ? { ...phase, ...patch } : phase);
                                    onUpdate({ phases: updatedPhases });
                                }}
                                onUpdateBoss={(patch) => onUpdate(patch)}
                            />
                        ) : selectedPhase && selectedPhase.buildType === 'tile' ? (
                            <div className="flex flex-col items-start gap-2">
                                {editMode === 'tiles' && (
                                    <div className="flex flex-wrap items-center gap-1 text-xs">
                                        <span className="mr-1 text-msx-textsecondary">
                                            Selection: {activeTileSelection
                                                ? `${activeTileSelection.width}x${activeTileSelection.height} @ ${activeTileSelection.x},${activeTileSelection.y}`
                                                : 'none'}
                                        </span>
                                        <Button onClick={() => moveTileSelection(0, -1)} variant="ghost" size="sm" icon={<ArrowUpIcon className="w-3 h-3" />} disabled={!activeTileSelection}>Up</Button>
                                        <Button onClick={() => moveTileSelection(0, 1)} variant="ghost" size="sm" icon={<ArrowDownIcon className="w-3 h-3" />} disabled={!activeTileSelection}>Down</Button>
                                        <Button onClick={() => moveTileSelection(-1, 0)} variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-3 h-3" />} disabled={!activeTileSelection}>Left</Button>
                                        <Button onClick={() => moveTileSelection(1, 0)} variant="ghost" size="sm" icon={<ArrowRightIcon className="w-3 h-3" />} disabled={!activeTileSelection}>Right</Button>
                                        <Button onClick={copyTileSelection} variant="ghost" size="sm" icon={<CopyIcon className="w-3 h-3" />} disabled={!activeTileSelection}>Copy</Button>
                                        <Button onClick={pasteTileSelection} variant="ghost" size="sm" icon={<PasteIcon className="w-3 h-3" />} disabled={!copiedBossTileBlock}>Paste</Button>
                                        <Button onClick={clearTileSelection} variant="ghost" size="sm" icon={<EraserIcon className="w-3 h-3" />} disabled={!activeTileSelection}>Clear</Button>
                                        <Button onClick={selectFilledTiles} variant="ghost" size="sm" disabled={selectedPhaseTileCount === 0}>Select Filled</Button>
                                        <Button onClick={trimSelectedPhaseToContent} variant="secondary" size="sm" disabled={!canTrimSelectedPhase}>Trim to Content</Button>
                                        <Button onClick={trimSelectedPhaseToSelection} variant="secondary" size="sm" disabled={!activeTileSelection}>Trim to Selection</Button>
                                    </div>
                                )}
                                {editMode === 'collision' && (
                                    <div className="flex flex-wrap items-center gap-1 text-xs">
                                        <Button onClick={applySolidTilesToCollision} variant="ghost" size="sm" disabled={selectedPhaseTileCount === 0}>Use Solid Tiles</Button>
                                    </div>
                                )}
                                {editMode === 'fireorigin' && (
                                    <div className="flex flex-wrap items-center gap-1 text-xs text-msx-textsecondary">
                                        <span>
                                            Attack: {selectedFireOriginAttack ? `${selectedFireOriginAttack.name} (${selectedFireOriginAttack.type})` : 'select one in Attacks'}
                                        </span>
                                    </div>
                                )}
                                <BossMovementController
                                    phase={selectedPhase}
                                    tileset={tileset}
                                    editMode={editMode}
                                    onGridClick={handleGridClick}
                                    onGridContextMenu={handleGridContextMenu}
                                    zoom={zoom}
                                    showUnassignedTilesWarning={showUnassignedTilesWarning}
                                    selectionEnabled={editMode === 'tiles'}
                                    tileSelection={tileSelection}
                                    onTileSelectionChange={setTileSelection}
                                    fireOriginMarkers={fireOriginMarkers}
                                />
                            </div>
                        ) : selectedPhase && selectedPhase.buildType === 'sprite' ? (
                            <div className="flex flex-col items-center space-y-2">
                                {selectedPhase.spriteAssetId && <SpritePreview spriteAssetId={selectedPhase.spriteAssetId} allAssets={allAssets} />}
                                <p className="text-xs text-msx-textsecondary">Sprite-based phase. Edit sprite asset directly.</p>
                            </div>
                        ) : (
                            <p className="text-msx-textsecondary">Select a phase to begin editing.</p>
                        )}
                    </div>
                </div>

                 <div className="w-72 2xl:w-80 border-l border-msx-border p-2 overflow-y-auto space-y-4 flex-shrink-0">
                    <Panel title="General" collapsible defaultCollapsed>
                        <div className="space-y-2 text-xs">
                            <input
                                ref={bossPackageInputRef}
                                type="file"
                                accept=".json,.boss.json,application/json"
                                className="hidden"
                                onChange={handleImportBossPackage}
                            />
                             <div>
                                <label className="block text-msx-textsecondary">Boss Name:</label>
                                <span className="block w-full p-1 text-msx-textprimary">{boss.name}</span>
                            </div>
                            <div>
                                <label className="block text-msx-textsecondary">Total Health:</label>
                                <input type="number" value={boss.totalHealth} onChange={e => handleUpdateField('totalHealth', parseInt(e.target.value) || 0)} min="1" className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                            </div>
                            <div>
                                <label className="block text-msx-textsecondary">ASM Update Every N Frames:</label>
                                <input
                                    type="number"
                                    value={boss.runtimeUpdateIntervalFrames ?? 1}
                                    onChange={e => handleUpdateField('runtimeUpdateIntervalFrames', Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
                                    min="1"
                                    max="8"
                                    className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                />
                                <p className="text-[10px] leading-snug text-msx-textsecondary">1 = fastest. 2-4 reduces MSX slowdown by updating Boss movement/redraw less often.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-msx-border/40">
                                <Button onClick={handleExportBossPackage} variant="secondary" size="sm" icon={<SaveIcon className="w-3 h-3" />}>
                                    Export Boss
                                </Button>
                                <Button onClick={() => bossPackageInputRef.current?.click()} variant="secondary" size="sm" icon={<LoadIcon className="w-3 h-3" />}>
                                    Import Boss
                                </Button>
                            </div>
                            <p className="text-[10px] leading-snug text-msx-textsecondary">
                                Import replaces this Boss and brings referenced tiles, sprites and sounds. Screen placement is cleared.
                            </p>
                        </div>
                    </Panel>
                    <Panel title="Boss Bank Compatibility" collapsible>
                        <div className="space-y-2 text-xs">
                            <div>
                                <label className="block text-msx-textsecondary">Target Tile Bank:</label>
                                <select
                                    value={selectedCompatibilityTileBankId}
                                    onChange={event => setSelectedCompatibilityTileBankId(event.target.value)}
                                    className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                >
                                    <option value="">Select Bank...</option>
                                    {projectTileBanks.map(tileBank => (
                                        <option key={tileBank.id} value={tileBank.id}>{tileBank.name}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedCompatibilityTileBank ? (
                                <>
                                    <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                                        <div className="rounded bg-msx-bgcolor p-1"><div className="text-msx-textsecondary">OK</div><div className="text-msx-green">{bossBankCompatibilityCounts.assigned}</div></div>
                                        <div className="rounded bg-msx-bgcolor p-1"><div className="text-msx-textsecondary">Reuse</div><div className="text-msx-cyan">{bossBankCompatibilityCounts.identical}</div></div>
                                        <div className="rounded bg-msx-bgcolor p-1"><div className="text-msx-textsecondary">Add</div><div className="text-msx-yellow">{bossBankCompatibilityCounts.canAdd}</div></div>
                                        <div className="rounded bg-msx-bgcolor p-1"><div className="text-msx-textsecondary">Full</div><div className="text-msx-danger">{bossBankCompatibilityCounts.noSpace}</div></div>
                                        <div className="rounded bg-msx-bgcolor p-1"><div className="text-msx-textsecondary">Missing</div><div className="text-msx-danger">{bossBankCompatibilityCounts.missing}</div></div>
                                    </div>
                                    <Button
                                        onClick={handleMergeBossTilesIntoBank}
                                        variant="primary"
                                        size="sm"
                                        className="w-full"
                                        disabled={bossBankCompatibility.length === 0 || bossBankCompatibilityCounts.noSpace > 0 || bossBankCompatibilityCounts.missing > 0}
                                    >
                                        Merge Boss Tiles Into Bank
                                    </Button>
                                    <div className="max-h-40 overflow-y-auto border border-msx-border/50 rounded bg-msx-bgcolor p-1 space-y-1">
                                        {bossBankCompatibility.length === 0 ? (
                                            <p className="text-msx-textsecondary p-1">No tile-based Boss tiles detected.</p>
                                        ) : bossBankCompatibility.map(item => {
                                            const statusClass = item.status === 'assigned'
                                                ? 'text-msx-green'
                                                : item.status === 'identical'
                                                    ? 'text-msx-cyan'
                                                    : item.status === 'canAdd'
                                                        ? 'text-msx-yellow'
                                                        : 'text-msx-danger';
                                            const statusLabel = item.status === 'assigned'
                                                ? 'Assigned'
                                                : item.status === 'identical'
                                                    ? `Reuse ${item.matchedTileName || item.matchedTileId}`
                                                    : item.status === 'canAdd'
                                                        ? 'Can add'
                                                        : item.status === 'missing'
                                                            ? 'Missing asset'
                                                            : 'No free block';
                                            return (
                                                <div key={item.tileId} className="flex items-start justify-between gap-2 border-b border-msx-border/30 pb-1 last:border-b-0">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-msx-textprimary">{item.tileName}</div>
                                                        <div className="text-[10px] text-msx-textsecondary">
                                                            Banks {item.requiredBankIndexes.map(index => index + 1).join(', ')} · {item.charsNeeded} char{item.charsNeeded === 1 ? '' : 's'}
                                                            {item.charCode !== undefined ? ` · #${item.charCode.toString(16).padStart(2, '0').toUpperCase()}` : ''}
                                                        </div>
                                                    </div>
                                                    <span className={`shrink-0 text-[10px] ${statusClass}`}>{statusLabel}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] leading-snug text-msx-textsecondary">
                                        Merge never overwrites occupied chars. Boss tiles are placed in all 3 SCREEN 2 banks using the same char code, or remapped to identical tiles already assigned that way.
                                    </p>
                                </>
                            ) : (
                                <p className="text-msx-textsecondary">Select a Tile Bank to check Boss compatibility.</p>
                            )}
                        </div>
                    </Panel>
                    <Panel title="Phase / Movement Properties" collapsible>
                        {selectedPhase ? (
                            <div className="space-y-2 text-xs">
                                 <div>
                                    <label className="block text-msx-textsecondary">Phase Name:</label>
                                    <input type="text" value={selectedPhase.name} onChange={e => handleUpdatePhase(selectedPhaseId!, 'name', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                     <div>
                                        <label className="block text-msx-textsecondary">Health Threshold:</label>
                                        <input type="number" value={selectedPhase.healthThreshold} onChange={e => handleUpdatePhase(selectedPhaseId!, 'healthThreshold', parseInt(e.target.value) || 0)} min="0" className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                    </div>
                                    <div>
                                        <label className="block text-msx-textsecondary mb-1">Build Type:</label>
                                        <select value={selectedPhase.buildType} onChange={e => handleUpdatePhase(selectedPhaseId!, 'buildType', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
                                            <option value="tile">Tile-based</option>
                                            <option value="sprite">Sprite-based</option>
                                        </select>
                                    </div>
                                </div>
                                {selectedPhase.buildType === 'tile' && (
                                     <>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div><label>Width (tiles):</label><input type="number" value={selectedPhase.dimensions?.width || 8} onChange={e => handleUpdatePhase(selectedPhaseId!, 'dimensions', {...selectedPhase.dimensions, width: parseInt(e.target.value) || 1})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/></div>
                                            <div><label>Height (tiles):</label><input type="number" value={selectedPhase.dimensions?.height || 8} onChange={e => handleUpdatePhase(selectedPhaseId!, 'dimensions', {...selectedPhase.dimensions, height: parseInt(e.target.value) || 1})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/></div>
                                        </div>
                                         <div>
                                            <label className="block text-xs text-msx-textsecondary mb-1">Tile Bank:</label>
                                            <select value={selectedPhase.tileBankId || ''} onChange={e => handleUpdatePhase(selectedPhaseId!, 'tileBankId', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
                                                <option value="">Select Bank...</option>
                                                {projectTileBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-msx-border/30">
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <div className="text-msx-textsecondary">Weak Points</div>
                                                    <div className="text-[0.65rem] text-msx-textsecondary">
                                                        {selectedWeakPoints.length} marked tile{selectedWeakPoints.length === 1 ? '' : 's'}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button onClick={() => setEditMode('weakpoints')} variant={editMode === 'weakpoints' ? 'secondary' : 'ghost'} size="sm">Edit</Button>
                                                    <Button onClick={handleClearWeakPoints} variant="ghost" size="sm" disabled={selectedWeakPoints.length === 0}>Clear</Button>
                                                </div>
                                            </div>
                                            <div className="max-h-28 overflow-y-auto rounded border border-msx-border/40 bg-msx-bgcolor/40 p-1 space-y-1">
                                                {selectedWeakPoints.length === 0 ? (
                                                    <div className="px-1 py-2 text-msx-textsecondary">No weak points in this phase.</div>
                                                ) : selectedWeakPoints.map(weakPoint => {
                                                    const isSelected = selectedWeakPointCoord?.x === weakPoint.x && selectedWeakPointCoord?.y === weakPoint.y;
                                                    return (
                                                        <button
                                                            key={`${weakPoint.x},${weakPoint.y}`}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedWeakPointCoord({ x: weakPoint.x, y: weakPoint.y });
                                                                setEditMode('weakpoints');
                                                            }}
                                                            className={`flex w-full items-center justify-between rounded px-2 py-1 text-left ${isSelected ? 'bg-yellow-400/20 text-yellow-300' : 'hover:bg-msx-border/40'}`}
                                                        >
                                                            <span>Tile {weakPoint.x},{weakPoint.y}</span>
                                                            <span className="font-mono text-[0.65rem]">DMG {Math.max(1, weakPoint.health || 1)}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {selectedWeakPoint && (
                                                <div className="space-y-2 rounded border border-yellow-400/30 bg-yellow-400/10 p-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-yellow-300">Weak {selectedWeakPoint.x},{selectedWeakPoint.y}</span>
                                                        <Button onClick={() => handleDeleteWeakPoint(selectedWeakPoint.x, selectedWeakPoint.y)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3" />}>Delete</Button>
                                                    </div>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Damage to Boss:</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="255"
                                                            value={Math.max(1, selectedWeakPoint.health || 1)}
                                                            onChange={e => handleUpdateWeakPoint(
                                                                selectedWeakPoint.x,
                                                                selectedWeakPoint.y,
                                                                { health: Math.max(1, Math.min(255, parseInt(e.target.value) || 1)) }
                                                            )}
                                                            className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Hit Sprite:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={allAssets.find(asset => asset.id === selectedWeakPoint.hitSpriteId)?.name || 'None'}>
                                                                {allAssets.find(asset => asset.id === selectedWeakPoint.hitSpriteId)?.name || 'None'}
                                                            </span>
                                                            <Button size="sm" variant="secondary" onClick={() => openAssetPicker('sprite', selectedWeakPoint.hitSpriteId, assetId => handleUpdateWeakPoint(selectedWeakPoint.x, selectedWeakPoint.y, { hitSpriteId: assetId }))}>...</Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateWeakPoint(selectedWeakPoint.x, selectedWeakPoint.y, { hitSpriteId: undefined })} disabled={!selectedWeakPoint.hitSpriteId}>Clear</Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Destroyed Tile:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={tileById.get(selectedWeakPoint.destroyedTileId || '')?.name || 'None'}>
                                                                {tileById.get(selectedWeakPoint.destroyedTileId || '')?.name || 'None'}
                                                            </span>
                                                            <Button size="sm" variant="secondary" onClick={() => openAssetPicker('tile', selectedWeakPoint.destroyedTileId, assetId => handleUpdateWeakPoint(selectedWeakPoint.x, selectedWeakPoint.y, { destroyedTileId: assetId }))}>...</Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateWeakPoint(selectedWeakPoint.x, selectedWeakPoint.y, { destroyedTileId: undefined })} disabled={!selectedWeakPoint.destroyedTileId}>Clear</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-msx-border/30">
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-2 text-msx-textsecondary">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedNeckChain.enabled}
                                                        onChange={e => handleUpdateNeckChain({ enabled: e.target.checked })}
                                                        className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                                                    />
                                                    Neck chain
                                                </label>
                                                <div className="flex gap-1">
                                                    <Button onClick={handleRemoveLastNeckSegment} variant="ghost" size="sm" disabled={selectedNeckChain.segments.length === 0}>Undo</Button>
                                                    <Button onClick={handleClearNeckChain} variant="ghost" size="sm" disabled={selectedNeckChain.segments.length === 0}>Clear</Button>
                                                </div>
                                            </div>
                                            <div className="text-[0.65rem] text-msx-textsecondary">
                                                {selectedNeckChain.segments.length} tiles in vector. Segment 1 leads; each next tile follows the previous one.
                                            </div>
                                            <div className="grid grid-cols-2 gap-1">
                                                <Button onClick={() => handleBuildNeckChainFromFilledTiles('vertical')} variant="ghost" size="sm" disabled={selectedPhaseTileCount === 0}>Build Vertical</Button>
                                                <Button onClick={() => handleBuildNeckChainFromFilledTiles('horizontal')} variant="ghost" size="sm" disabled={selectedPhaseTileCount === 0}>Build Horizontal</Button>
                                                <Button onClick={() => handleSortNeckChain('vertical')} variant="ghost" size="sm" disabled={selectedNeckChain.segments.length < 2}>Sort Vertical</Button>
                                                <Button onClick={() => handleSortNeckChain('horizontal')} variant="ghost" size="sm" disabled={selectedNeckChain.segments.length < 2}>Sort Horizontal</Button>
                                                <Button onClick={() => handleReverseNeckChain()} variant="ghost" size="sm" disabled={selectedNeckChain.segments.length < 2}>Reverse</Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <label>Amplitude X:</label>
                                                    <input type="number" value={selectedNeckChain.amplitudeX} onChange={e => handleUpdateNeckChain({ amplitudeX: parseInt(e.target.value) || 0 })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                                <div>
                                                    <label>Amplitude Y:</label>
                                                    <input type="number" value={selectedNeckChain.amplitudeY} onChange={e => handleUpdateNeckChain({ amplitudeY: parseInt(e.target.value) || 0 })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                                <div>
                                                    <label>Speed:</label>
                                                    <input type="number" min="0.1" step="0.1" value={selectedNeckChain.speed} onChange={e => handleUpdateNeckChain({ speed: parseFloat(e.target.value) || 0.1 })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                                <div>
                                                    <label>Delay:</label>
                                                    <input type="number" min="0" max="60" value={selectedNeckChain.segmentDelayFrames} onChange={e => handleUpdateNeckChain({ segmentDelayFrames: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                            </div>
                                            <div>
                                                <label>Follow strength:</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={selectedNeckChain.followStrength}
                                                    onChange={e => handleUpdateNeckChain({ followStrength: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-msx-border rounded-lg appearance-none cursor-pointer"
                                                />
                                                <div className="text-[0.65rem] text-right text-msx-textsecondary">{selectedNeckChain.followStrength.toFixed(2)}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-msx-border/30">
                                            <label className="flex items-center gap-2 text-msx-textsecondary">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCrushMovement.enabled}
                                                    onChange={e => handleUpdateCrushMovement({ enabled: e.target.checked })}
                                                    className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                                                />
                                                Crush movement
                                            </label>
                                            <div className="text-[0.65rem] text-msx-textsecondary">
                                                Fast slam movement for stomp/crush boss attacks.
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <label>Direction:</label>
                                                    <select
                                                        value={selectedCrushMovement.direction}
                                                        onChange={e => handleUpdateCrushMovement({ direction: e.target.value as BossCrushMovement['direction'] })}
                                                        className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                                    >
                                                        <option value="down">Down</option>
                                                        <option value="up">Up</option>
                                                        <option value="left">Left</option>
                                                        <option value="right">Right</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label>Distance px:</label>
                                                    <input type="number" min="0" value={selectedCrushMovement.distance} onChange={e => handleUpdateCrushMovement({ distance: parseInt(e.target.value) || 0 })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                                <div>
                                                    <label>Windup:</label>
                                                    <input type="number" min="0" value={selectedCrushMovement.windupFrames} onChange={e => handleUpdateCrushMovement({ windupFrames: parseInt(e.target.value) || 0 })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                                <div>
                                                    <label>Slam:</label>
                                                    <input type="number" min="1" value={selectedCrushMovement.slamFrames} onChange={e => handleUpdateCrushMovement({ slamFrames: Math.max(1, parseInt(e.target.value) || 1) })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                                <div>
                                                    <label>Hold:</label>
                                                    <input type="number" min="0" value={selectedCrushMovement.holdFrames} onChange={e => handleUpdateCrushMovement({ holdFrames: parseInt(e.target.value) || 0 })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                                <div>
                                                    <label>Return:</label>
                                                    <input type="number" min="1" value={selectedCrushMovement.returnFrames} onChange={e => handleUpdateCrushMovement({ returnFrames: Math.max(1, parseInt(e.target.value) || 1) })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                                <div>
                                                    <label>Cooldown:</label>
                                                    <input type="number" min="0" value={selectedCrushMovement.cooldownFrames} onChange={e => handleUpdateCrushMovement({ cooldownFrames: parseInt(e.target.value) || 0 })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="flex items-center space-x-1 pt-2 border-t border-msx-border/30">
                                    <span className="text-msx-textsecondary">Mode:</span>
                                    <Button onClick={() => handleEditModeChange('tiles')} variant={editMode === 'tiles' ? 'secondary' : 'ghost'} size="sm">Graphic</Button>
                                    <Button onClick={() => handleEditModeChange('collision')} variant={editMode === 'collision' ? 'secondary' : 'ghost'} size="sm">Collision</Button>
                                    <Button onClick={() => handleEditModeChange('weakpoints')} variant={editMode === 'weakpoints' ? 'secondary' : 'ghost'} size="sm">Weak Points</Button>
                                    <Button onClick={() => handleEditModeChange('neck')} variant={editMode === 'neck' ? 'secondary' : 'ghost'} size="sm">Neck</Button>
                                    <Button onClick={() => handleEditModeChange('fireorigin')} variant={editMode === 'fireorigin' ? 'secondary' : 'ghost'} size="sm">Fire Origin</Button>
                                    <Button onClick={() => handleEditModeChange('behavior')} variant={editMode === 'behavior' ? 'secondary' : 'ghost'} size="sm">Behavior</Button>
                                </div>
                                <div className="flex items-center space-x-2 pt-2 border-t border-msx-border/30">
                                    <label htmlFor="boss-zoom" className="text-msx-textsecondary text-xs whitespace-nowrap">Zoom:</label>
                                    <input
                                        id="boss-zoom"
                                        type="range"
                                        min="0.5"
                                        max="4"
                                        step="0.1"
                                        value={zoom}
                                        onChange={e => setZoom(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-msx-border rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xs w-10 text-right font-mono">{zoom.toFixed(1)}x</span>
                                </div>
                                <div className="pt-2 border-t border-msx-border/30">
                                    <Button onClick={() => setIsPreviewOpen(true)} variant="secondary" className="w-full">Preview Animation</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-msx-border/30">
                                    <Button onClick={handleCopyPhase} variant="secondary" size="sm" disabled={!selectedPhase}>Copy Phase</Button>
                                    <Button onClick={handlePastePhase} variant="secondary" size="sm" disabled={!selectedPhase || !copiedBossPhase}>Paste Phase</Button>
                                </div>
                            </div>
                        ) : <p className="text-xs text-msx-textsecondary italic">Select a phase to see properties.</p>}
                     </Panel>
                    <Panel title="Boss Shooting" collapsible>
                        <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={handleAddAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Projectile
                                </Button>
                                <Button onClick={handleAddBoomerangAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Boomerang
                                </Button>
                                <Button onClick={handleAddRockAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Rock
                                </Button>
                                <Button onClick={handleAddSineWaveAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Sine Wave
                                </Button>
                                <Button onClick={handleAddHomingMissileAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Homing
                                </Button>
                                <Button onClick={handleAddLaserAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Laser
                                </Button>
                                <Button onClick={handleAddMeteorAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Meteors
                                </Button>
                                <Button onClick={handleAddSlamRocksAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Slam Rocks
                                </Button>
                                <Button onClick={handleAddFallingBlocksAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Blocks
                                </Button>
                                <Button onClick={handleAddBombAttack} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full">
                                    Add Bombs
                                </Button>
                            </div>
                            {bossAttacks.length === 0 && (
                                <p className="text-xs text-msx-textsecondary italic">No boss attacks configured.</p>
                            )}
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {bossAttacks.map(attack => {
                                    const attackSprite = attack.spriteAssetId
                                        ? allAssets.find(asset => asset.id === attack.spriteAssetId && asset.type === 'sprite')
                                        : null;
                                    const explosionSprite = attack.explosionSpriteAssetId
                                        ? allAssets.find(asset => asset.id === attack.explosionSpriteAssetId && asset.type === 'sprite')
                                        : null;
                                    const laserTile = attack.laserTileAssetId
                                        ? allAssets.find(asset => asset.id === attack.laserTileAssetId && asset.type === 'tile')
                                        : null;
                                    const blockTile = attack.blockTileAssetId
                                        ? allAssets.find(asset => asset.id === attack.blockTileAssetId && asset.type === 'tile')
                                        : null;
                                    const isEnabledInPhase = !!selectedPhase?.attackSequence?.includes(attack.id);
                                    const isAttackCollapsed = collapsedAttackIds.has(attack.id);

                                    return (
                                        <div key={attack.id} className="rounded border border-msx-border/50 bg-msx-bgcolor/50 p-2 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <label className="flex min-w-0 flex-1 items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={isEnabledInPhase}
                                                        onChange={() => handleTogglePhaseAttack(attack.id)}
                                                        disabled={!selectedPhase}
                                                        className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                                                    />
                                                    <span className="truncate text-msx-highlight">{attack.name}</span>
                                                    <span className="flex-shrink-0 rounded bg-msx-panelbg px-1.5 py-0.5 text-[0.6rem] text-msx-textsecondary">
                                                        {attack.type}
                                                    </span>
                                                </label>
                                                <Button onClick={() => handleToggleAttackCollapsed(attack.id)} variant="ghost" size="sm">
                                                    {isAttackCollapsed ? '+' : '-'}
                                                </Button>
                                                <Button onClick={() => handleDeleteAttack(attack.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3" />}>
                                                    Delete
                                                </Button>
                                            </div>
                                            {!isAttackCollapsed && (
                                                <>
                                            <div>
                                                <label className="block text-msx-textsecondary">Name:</label>
                                                <input
                                                    type="text"
                                                    value={attack.name}
                                                    onChange={e => handleUpdateAttack(attack.id, 'name', e.target.value)}
                                                    className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-msx-textsecondary">Type:</label>
                                                    <select
                                                        value={attack.type}
                                                        onChange={e => handleUpdateAttack(attack.id, 'type', e.target.value as BossAttack['type'])}
                                                        className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                                    >
                                                        <option value="Projectile">Projectile</option>
                                                        <option value="Boomerang">Boomerang</option>
                                                        <option value="Rock">Rock</option>
                                                        <option value="SineWave">Sine Wave</option>
                                                        <option value="HomingMissile">Homing Missile</option>
                                                        <option value="Laser">Laser</option>
                                                        <option value="Meteor">Meteor</option>
                                                        <option value="SlamRocks">Slam Rocks</option>
                                                        <option value="FallingBlocks">Falling Blocks</option>
                                                        <option value="Bomb">Bomb</option>
                                                        <option value="Melee">Melee</option>
                                                        <option value="Special">Special</option>
                                                        <option value="Pattern">Pattern</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-msx-textsecondary">Damage:</label>
                                                    <input type="number" min="0" value={attack.damage} onChange={e => handleUpdateAttack(attack.id, 'damage', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                </div>
                                            </div>
                                            {(attack.type === 'Projectile' || attack.type === 'Boomerang' || attack.type === 'Rock' || attack.type === 'SineWave' || attack.type === 'HomingMissile') && (
                                                <>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">{attack.type === 'Boomerang' ? 'Boomerang' : attack.type === 'Rock' ? 'Rock' : attack.type === 'SineWave' ? 'Sine Wave' : attack.type === 'HomingMissile' ? 'Homing Missile' : 'Projectile'} Sprite:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={attackSprite?.name || 'None'}>
                                                                {attackSprite?.name || 'None'}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => openAssetPicker('sprite', attack.spriteAssetId, assetId => handleUpdateAttack(attack.id, 'spriteAssetId', assetId))}
                                                            >
                                                                ...
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateAttack(attack.id, 'spriteAssetId', '')} disabled={!attack.spriteAssetId}>
                                                                Clear
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Direction:</label>
                                                            <select
                                                                value={attack.projectileDirection || 'left'}
                                                                onChange={e => handleUpdateAttack(attack.id, 'projectileDirection', e.target.value as BossAttack['projectileDirection'])}
                                                                className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                                            >
                                                                <option value="left">Left</option>
                                                                <option value="right">Right</option>
                                                                <option value="up">Up</option>
                                                                <option value="down">Down</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Speed:</label>
                                                            <input type="number" min="1" value={attack.speed ?? 3} onChange={e => handleUpdateAttack(attack.id, 'speed', parseInt(e.target.value) || 1)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Cooldown ms:</label>
                                                            <input type="number" min="100" step="50" value={attack.cooldown ?? (attack.type === 'Boomerang' ? 3400 : attack.type === 'Rock' ? 1400 : attack.type === 'SineWave' || attack.type === 'HomingMissile' ? 1800 : 900)} onChange={e => handleUpdateAttack(attack.id, 'cooldown', parseInt(e.target.value) || 100)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Range px:</label>
                                                            <input type="number" min="8" value={attack.range ?? (attack.type === 'Boomerang' ? 96 : attack.type === 'Rock' ? 128 : attack.type === 'SineWave' ? 144 : attack.type === 'HomingMissile' ? 176 : 160)} onChange={e => handleUpdateAttack(attack.id, 'range', parseInt(e.target.value) || 8)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        {attack.type === 'Rock' && (
                                                            <div>
                                                                <label className="block text-msx-textsecondary">Arc height:</label>
                                                                <input type="number" min="0" value={attack.arcHeight ?? 40} onChange={e => handleUpdateAttack(attack.id, 'arcHeight', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                            </div>
                                                        )}
                                                        {attack.type === 'SineWave' && (
                                                            <>
                                                                <div>
                                                                    <label className="block text-msx-textsecondary">Wave amplitude:</label>
                                                                    <input type="number" min="0" max="64" value={attack.waveAmplitude ?? 16} onChange={e => handleUpdateAttack(attack.id, 'waveAmplitude', Math.max(0, parseInt(e.target.value) || 0))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-msx-textsecondary">Wave step frames:</label>
                                                                    <input type="number" min="1" max="32" value={attack.waveFrequencyFrames ?? 4} onChange={e => handleUpdateAttack(attack.id, 'waveFrequencyFrames', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                                </div>
                                                            </>
                                                        )}
                                                        {attack.type === 'HomingMissile' && (
                                                            <div>
                                                                <label className="block text-msx-textsecondary">Turn step:</label>
                                                                <input type="number" min="1" max="16" value={attack.homingTurnStep ?? 2} onChange={e => handleUpdateAttack(attack.id, 'homingTurnStep', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                            </div>
                                                        )}
                                                        {renderFireOriginControls(attack)}
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fine X px:</label>
                                                            <input type="number" value={attack.spawnOffsetX ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetX', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fine Y px:</label>
                                                            <input type="number" value={attack.spawnOffsetY ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetY', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {attack.type === 'Meteor' && (
                                                <>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Meteor Sprite:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={attackSprite?.name || 'None'}>
                                                                {attackSprite?.name || 'None'}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => openAssetPicker('sprite', attack.spriteAssetId, assetId => handleUpdateAttack(attack.id, 'spriteAssetId', assetId))}
                                                            >
                                                                ...
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateAttack(attack.id, 'spriteAssetId', '')} disabled={!attack.spriteAssetId}>
                                                                Clear
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Count:</label>
                                                            <input type="number" min="1" max="8" value={attack.meteorCount ?? 4} onChange={e => handleUpdateAttack(attack.id, 'meteorCount', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Spread px:</label>
                                                            <input type="number" min="0" value={attack.meteorSpreadX ?? 32} onChange={e => handleUpdateAttack(attack.id, 'meteorSpreadX', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fall speed:</label>
                                                            <input type="number" min="1" value={attack.speed ?? 4} onChange={e => handleUpdateAttack(attack.id, 'speed', parseInt(e.target.value) || 1)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fall range px:</label>
                                                            <input type="number" min="32" value={attack.range ?? 216} onChange={e => handleUpdateAttack(attack.id, 'range', parseInt(e.target.value) || 32)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Cooldown ms:</label>
                                                            <input type="number" min="100" step="50" value={attack.cooldown ?? 1200} onChange={e => handleUpdateAttack(attack.id, 'cooldown', parseInt(e.target.value) || 100)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Warning frames:</label>
                                                            <input type="number" min="0" value={attack.meteorWarningFrames ?? 18} onChange={e => handleUpdateAttack(attack.id, 'meteorWarningFrames', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Center X:</label>
                                                            <input type="number" value={attack.spawnOffsetX ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetX', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Start Y:</label>
                                                            <input type="number" value={attack.spawnOffsetY ?? -16} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetY', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {attack.type === 'SlamRocks' && (
                                                <>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Rock Sprite:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={attackSprite?.name || 'None'}>
                                                                {attackSprite?.name || 'None'}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => openAssetPicker('sprite', attack.spriteAssetId, assetId => handleUpdateAttack(attack.id, 'spriteAssetId', assetId))}
                                                            >
                                                                ...
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateAttack(attack.id, 'spriteAssetId', '')} disabled={!attack.spriteAssetId}>
                                                                Clear
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Rise chars:</label>
                                                            <input type="number" min="1" max="8" value={attack.slamRiseChars ?? 3} onChange={e => handleUpdateAttack(attack.id, 'slamRiseChars', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Rock count:</label>
                                                            <input type="number" min="1" max="4" value={attack.meteorCount ?? 4} onChange={e => handleUpdateAttack(attack.id, 'meteorCount', Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Windup frames:</label>
                                                            <input type="number" min="1" value={attack.slamWindupFrames ?? 16} onChange={e => handleUpdateAttack(attack.id, 'slamWindupFrames', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Slam frames:</label>
                                                            <input type="number" min="1" value={attack.slamFrames ?? 6} onChange={e => handleUpdateAttack(attack.id, 'slamFrames', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Hold frames:</label>
                                                            <input type="number" min="0" value={attack.slamHoldFrames ?? 8} onChange={e => handleUpdateAttack(attack.id, 'slamHoldFrames', Math.max(0, parseInt(e.target.value) || 0))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Total ms:</label>
                                                            <input type="number" min="500" step="50" value={attack.cooldown ?? 4000} onChange={e => handleUpdateAttack(attack.id, 'cooldown', parseInt(e.target.value) || 500)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fall speed:</label>
                                                            <input type="number" min="1" value={attack.speed ?? 4} onChange={e => handleUpdateAttack(attack.id, 'speed', parseInt(e.target.value) || 1)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fall range px:</label>
                                                            <input type="number" min="32" value={attack.range ?? 216} onChange={e => handleUpdateAttack(attack.id, 'range', parseInt(e.target.value) || 32)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {attack.type === 'FallingBlocks' && (
                                                <>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Falling Sprite:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={attackSprite?.name || 'None'}>
                                                                {attackSprite?.name || 'None'}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => openAssetPicker('sprite', attack.spriteAssetId, assetId => handleUpdateAttack(attack.id, 'spriteAssetId', assetId))}
                                                            >
                                                                ...
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateAttack(attack.id, 'spriteAssetId', '')} disabled={!attack.spriteAssetId}>
                                                                Clear
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Landed Char Tile:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={blockTile?.name || 'None'}>
                                                                {blockTile?.name || 'None'}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => openAssetPicker('tile', attack.blockTileAssetId, assetId => handleUpdateAttack(attack.id, 'blockTileAssetId', assetId))}
                                                            >
                                                                ...
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateAttack(attack.id, 'blockTileAssetId', '')} disabled={!attack.blockTileAssetId}>
                                                                Clear
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Block count:</label>
                                                            <input type="number" min="1" max="4" value={attack.meteorCount ?? 4} onChange={e => handleUpdateAttack(attack.id, 'meteorCount', Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Landing row:</label>
                                                            <input type="number" min="0" max="23" value={attack.landingYChar ?? 20} onChange={e => handleUpdateAttack(attack.id, 'landingYChar', Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fall speed:</label>
                                                            <input type="number" min="1" value={attack.speed ?? 4} onChange={e => handleUpdateAttack(attack.id, 'speed', parseInt(e.target.value) || 1)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Total ms:</label>
                                                            <input type="number" min="500" step="50" value={attack.cooldown ?? 4000} onChange={e => handleUpdateAttack(attack.id, 'cooldown', parseInt(e.target.value) || 500)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {attack.type === 'Laser' && (
                                                <>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Laser Char Tile:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={laserTile?.name || 'None'}>
                                                                {laserTile?.name || 'None'}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => openAssetPicker('tile', attack.laserTileAssetId, assetId => handleUpdateAttack(attack.id, 'laserTileAssetId', assetId))}
                                                            >
                                                                ...
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateAttack(attack.id, 'laserTileAssetId', '')} disabled={!attack.laserTileAssetId}>
                                                                Clear
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Direction:</label>
                                                            <select
                                                                value={attack.projectileDirection || 'left'}
                                                                onChange={e => handleUpdateAttack(attack.id, 'projectileDirection', e.target.value as BossAttack['projectileDirection'])}
                                                                className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                                            >
                                                                <option value="left">Left</option>
                                                                <option value="right">Right</option>
                                                                <option value="up">Up</option>
                                                                <option value="down">Down</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Length chars:</label>
                                                            <input type="number" min="1" max="32" value={attack.laserLengthChars ?? 12} onChange={e => handleUpdateAttack(attack.id, 'laserLengthChars', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Active frames:</label>
                                                            <input type="number" min="1" value={attack.laserDurationFrames ?? 18} onChange={e => handleUpdateAttack(attack.id, 'laserDurationFrames', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Cooldown ms:</label>
                                                            <input type="number" min="100" step="50" value={attack.cooldown ?? 1200} onChange={e => handleUpdateAttack(attack.id, 'cooldown', parseInt(e.target.value) || 100)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        {renderFireOriginControls(attack)}
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fine X px:</label>
                                                            <input type="number" value={attack.spawnOffsetX ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetX', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fine Y px:</label>
                                                            <input type="number" value={attack.spawnOffsetY ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetY', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {attack.type === 'Bomb' && (
                                                <>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Bomb Sprite:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={attackSprite?.name || 'None'}>
                                                                {attackSprite?.name || 'None'}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => openAssetPicker('sprite', attack.spriteAssetId, assetId => handleUpdateAttack(attack.id, 'spriteAssetId', assetId))}
                                                            >
                                                                ...
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateAttack(attack.id, 'spriteAssetId', '')} disabled={!attack.spriteAssetId}>
                                                                Clear
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-msx-textsecondary">Explosion Sprite:</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="min-w-0 flex-1 truncate rounded border border-msx-border/30 bg-msx-bgcolor p-1" title={explosionSprite?.name || 'None'}>
                                                                {explosionSprite?.name || 'None'}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => openAssetPicker('sprite', attack.explosionSpriteAssetId, assetId => handleUpdateAttack(attack.id, 'explosionSpriteAssetId', assetId))}
                                                            >
                                                                ...
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleUpdateAttack(attack.id, 'explosionSpriteAssetId', '')} disabled={!attack.explosionSpriteAssetId}>
                                                                Clear
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Count:</label>
                                                            <input type="number" min="1" max="8" value={attack.bombCount ?? 3} onChange={e => handleUpdateAttack(attack.id, 'bombCount', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Spread px:</label>
                                                            <input type="number" min="0" value={attack.bombSpreadX ?? 28} onChange={e => handleUpdateAttack(attack.id, 'bombSpreadX', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fuse frames:</label>
                                                            <input type="number" min="1" value={attack.bombFuseFrames ?? 45} onChange={e => handleUpdateAttack(attack.id, 'bombFuseFrames', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Explosion frames:</label>
                                                            <input type="number" min="1" value={attack.explosionDurationFrames ?? 18} onChange={e => handleUpdateAttack(attack.id, 'explosionDurationFrames', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Explosion radius:</label>
                                                            <input type="number" min="8" value={attack.explosionRadius ?? 24} onChange={e => handleUpdateAttack(attack.id, 'explosionRadius', Math.max(8, parseInt(e.target.value) || 8))} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Cooldown ms:</label>
                                                            <input type="number" min="100" step="50" value={attack.cooldown ?? 1500} onChange={e => handleUpdateAttack(attack.id, 'cooldown', parseInt(e.target.value) || 100)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        {renderFireOriginControls(attack)}
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fine X px:</label>
                                                            <input type="number" value={attack.spawnOffsetX ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetX', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Fine Y px:</label>
                                                            <input type="number" value={attack.spawnOffsetY ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetY', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Panel>
                    <Panel title="Phases / Movements" collapsible defaultCollapsed>
                        <Button onClick={handleAddPhase} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full mb-2">Add Phase</Button>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <Button onClick={handleDuplicatePhase} size="sm" variant="ghost" disabled={!selectedPhase}>Duplicate</Button>
                            <Button onClick={handleDeletePhase} size="sm" variant="danger" icon={<TrashIcon className="w-3 h-3" />} disabled={!selectedPhase || boss.phases.length <= 1}>Delete</Button>
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {boss.phases.map((phase, index) => (
                                <div key={phase.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={boss.phasesEnabled?.[index] ?? true}
                                        onChange={() => handleTogglePhaseEnabled(index)}
                                        className="form-checkbox h-4 w-4 text-msx-accent bg-msx-bgcolor border-msx-border rounded focus:ring-msx-accent"
                                    />
                                    <button onClick={() => setSelectedPhaseId(phase.id)} className={`flex-grow text-left p-1.5 rounded text-xs truncate ${selectedPhaseId === phase.id ? 'bg-msx-accent text-white' : 'hover:bg-msx-border'}`}>
                                        <span className="block truncate">{phase.name}</span>
                                        <span className={`block text-[0.6rem] ${selectedPhaseId === phase.id ? 'text-white/75' : 'text-msx-textsecondary'}`}>
                                            {phase.buildType === 'tile'
                                            ? `${phase.dimensions?.width || 0}x${phase.dimensions?.height || 0} - ${phase.neckChain?.segments.length || 0} neck`
                                                : 'sprite'}
                                        </span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>

                {editMode !== 'behavior' && (
                    <BossTilesetPanel
                        allTiles={allTiles}
                        assignedTileIds={assignedTileIds}
                        selectedTileId={selectedTileId}
                        onSelectTile={setSelectedTileId}
                        onShowContextMenu={onShowContextMenu}
                        onCreateMirroredTile={handleCreateMirroredTile}
                        currentScreenMode={currentScreenMode}
                    />
                )}
            </div>
            {assetPickerState.isOpen && (
                <AssetPickerModal
                    isOpen={assetPickerState.isOpen}
                    onClose={() => setAssetPickerState({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null })}
                    onSelectAsset={(assetId) => {
                        assetPickerState.onSelect?.(assetId);
                        setAssetPickerState({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });
                    }}
                    assetTypeToPick={assetPickerState.assetTypeToPick!}
                    allAssets={allAssets}
                    currentSelectedId={assetPickerState.currentValue}
                />
            )}
            {isPreviewOpen && (
                <BossPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    boss={boss}
                    tileset={tileset}
                    allAssets={allAssets}
                />
            )}
        </Panel>
    );
};

import React, { useState, useMemo } from 'react';
import { Boss, BossBehaviorAction, BossPhase, ProjectAsset, Sprite, Tile, TileBank, BossAttack, BossCrushMovement, BossNeckChain, ContextMenuItem, EditorType } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, PencilIcon, ViewfinderCircleIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { createTileDataURL } from '../utils/screenUtils';
import { EDITOR_BASE_TILE_DIM_S2, DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT, DEFAULT_SCREEN2_FG_COLOR, MSX_SCREEN5_PALETTE, DEFAULT_SCREEN2_BG_COLOR } from '../../constants';
import { createDefaultLineAttributes } from '../utils/tileUtils';
import { BossMovementController } from './BossMovementController';
import { BossTilesetPanel } from './BossTilesetPanel';
import { BossPreviewModal } from '../modals/BossPreviewModal';
import { BossBehaviorEditor } from './BossBehaviorEditor';


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

type BossEditMode = 'tiles' | 'collision' | 'weakpoints' | 'neck' | 'behavior';

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
    behavior: 'Behavior',
};

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getPhaseTileCount = (phase: BossPhase | undefined) => (
    phase?.tileMatrix?.reduce((count, row) => count + row.filter(Boolean).length, 0) ?? 0
);

const clonePixelData = (data: Tile['data']) => data.map(row => [...row]);

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
export const BossEditor: React.FC<BossEditorProps> = ({ boss, onUpdate, allAssets, tileBanks, onNavigateToAsset, onShowContextMenu, currentScreenMode, zoom, setZoom, copiedBossPhase, setCopiedBossPhase }) => {
    
    const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(boss.phases[0]?.id || null);
    const [editMode, setEditMode] = useState<BossEditMode>('tiles');
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [collapsedAttackIds, setCollapsedAttackIds] = useState<Set<string>>(() => new Set());
    
    const [assetPickerState, setAssetPickerState] = useState<{
        isOpen: boolean; assetTypeToPick: ProjectAsset['type'] | null;
        onSelect: ((assetId: string) => void) | null; currentValue: string | null;
    }>({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });

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
                        const newCollisionMatrix = (newPhase.collisionMatrix || []).map(row => [...row]);
                        if (newCollisionMatrix[y]) {
                            newCollisionMatrix[y][x] = !newCollisionMatrix[y][x];
                            newPhase.collisionMatrix = newCollisionMatrix;
                        }
                        break;
                    case 'weakpoints':
                        const newWeakPoints = [...(newPhase.weakPoints || [])];
                        const existingWpIndex = newWeakPoints.findIndex(wp => wp.x === x && wp.y === y);
                        if (existingWpIndex > -1) {
                            newWeakPoints.splice(existingWpIndex, 1);
                        } else {
                            newWeakPoints.push({ x, y, health: 10 });
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
    const bossAttacks = boss.attacks || [];
    const selectedNeckChain = selectedPhase?.neckChain || createDefaultBossNeckChain();
    const selectedCrushMovement = selectedPhase?.crushMovement || createDefaultBossCrushMovement();
    const selectedPhaseTileCount = getPhaseTileCount(selectedPhase);

    const assignedTileIds = useMemo(() => {
        const assignedTileIds = new Set<string>();
        tileBanks.forEach(tileBank => {
            tileBank.banks?.forEach(bank => {
                Object.keys(bank.assignedTiles || {}).forEach(tileId => {
                    assignedTileIds.add(tileId);
                });
            });
        });

        return assignedTileIds;
    }, [tileBanks]);

    const showUnassignedTilesWarning = useMemo(() => (
        allTiles.some(tile => tile.width === 8 && tile.height === 8 && !assignedTileIds.has(tile.id))
    ), [allTiles, assignedTileIds]);

    const handleUpdateAttack = (attackId: string, field: keyof BossAttack, value: any) => {
        const updatedAttacks = bossAttacks.map(a => a.id === attackId ? { ...a, [field]: value } : a);
        onUpdate({ attacks: updatedAttacks });
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
                                    onClick={() => setEditMode(mode)}
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
                            <BossMovementController
                                phase={selectedPhase}
                                tileset={tileset}
                                editMode={editMode}
                                onGridClick={handleGridClick}
                                onGridContextMenu={handleGridContextMenu}
                                zoom={zoom}
                                showUnassignedTilesWarning={showUnassignedTilesWarning}
                            />
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
                             <div>
                                <label className="block text-msx-textsecondary">Boss Name:</label>
                                <span className="block w-full p-1 text-msx-textprimary">{boss.name}</span>
                            </div>
                            <div>
                                <label className="block text-msx-textsecondary">Total Health:</label>
                                <input type="number" value={boss.totalHealth} onChange={e => handleUpdateField('totalHealth', parseInt(e.target.value) || 0)} min="1" className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                            </div>
                            <div>
                                <label className="block text-msx-textsecondary mt-2">Preview Screen:</label>
                                <select
                                    value={boss.linkedScreenId || ''}
                                    onChange={e => handleUpdateField('linkedScreenId', e.target.value || null)}
                                    className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                                >
                                    <option value="">None</option>
                                    {allAssets.filter(a => a.type === 'screenmap').map(screen => (
                                        <option key={screen.id} value={screen.id}>
                                            {screen.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
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
                                                {tileBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
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
                                    <Button onClick={() => setEditMode('tiles')} variant={editMode === 'tiles' ? 'secondary' : 'ghost'} size="sm">Graphic</Button>
                                    <Button onClick={() => setEditMode('collision')} variant={editMode === 'collision' ? 'secondary' : 'ghost'} size="sm">Collision</Button>
                                    <Button onClick={() => setEditMode('weakpoints')} variant={editMode === 'weakpoints' ? 'secondary' : 'ghost'} size="sm">Weak Points</Button>
                                    <Button onClick={() => setEditMode('neck')} variant={editMode === 'neck' ? 'secondary' : 'ghost'} size="sm">Neck</Button>
                                    <Button onClick={() => setEditMode('behavior')} variant={editMode === 'behavior' ? 'secondary' : 'ghost'} size="sm">Behavior</Button>
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
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Offset X:</label>
                                                            <input type="number" value={attack.spawnOffsetX ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetX', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Offset Y:</label>
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
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Offset X:</label>
                                                            <input type="number" value={attack.spawnOffsetX ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetX', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Offset Y:</label>
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
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Center X:</label>
                                                            <input type="number" value={attack.spawnOffsetX ?? 0} onChange={e => handleUpdateAttack(attack.id, 'spawnOffsetX', parseInt(e.target.value) || 0)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-msx-textsecondary">Center Y:</label>
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

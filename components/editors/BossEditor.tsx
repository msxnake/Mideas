import React, { useState, useMemo } from 'react';
import { Boss, BossPhase, ProjectAsset, Sprite, Tile, TileBank, BossAttack, BossPhaseWeakPoint, ContextMenuItem, EditorType, TileLogicalProperties, LineColorAttribute, MSXColorValue } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, SpriteIcon, TilesetIcon, PencilIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { createTileDataURL } from '../utils/screenUtils';
import { EDITOR_BASE_TILE_DIM_S2, DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT, DEFAULT_SCREEN2_FG_COLOR, MSX_SCREEN5_PALETTE, DEFAULT_SCREEN2_BG_COLOR } from '../../constants';
import { createDefaultLineAttributes } from '../utils/tileUtils';
import { BossMovementController } from './BossMovementController';


interface BossEditorProps {
    boss: Boss;
    onUpdate: (data: Partial<Boss>, newAssetsToCreate?: ProjectAsset[]) => void;
    allAssets: ProjectAsset[];
    tileBanks: TileBank[];
    onNavigateToAsset: (assetId: string | null, editorTypeOverride?: EditorType) => void;
    onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
    currentScreenMode: string;
}

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

type BossEditMode = 'tiles' | 'collision' | 'weakpoints';

export const BossEditor: React.FC<BossEditorProps> = ({ boss, onUpdate, allAssets, tileBanks, onNavigateToAsset, onShowContextMenu, currentScreenMode }) => {
    
    const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(boss.phases[0]?.id || null);
    const [editMode, setEditMode] = useState<BossEditMode>('tiles');
    
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
            weakPoints: [], attackSequence: []
        };
        onUpdate({ phases: [...boss.phases, newPhase] });
        setSelectedPhaseId(newPhase.id);
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
                }
                return updatedPhase;
            }
            return p;
        });
        onUpdate({ phases: updatedPhases });
    };
    
    const handleGridClick = (x: number, y: number) => {
        const currentPhase = boss.phases.find(p => p.id === selectedPhaseId);
        if (!currentPhase || currentPhase.buildType !== 'tile' || editMode === 'tiles') return;

        const updatedPhases = boss.phases.map(p => {
            if (p.id === selectedPhaseId) {
                const newPhase = {...p};
                switch (editMode) {
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
            logicalProperties: { mapId: 0, familyId: 0, instanceId: 0, isSolid: false, isBreakable: false, isMovable: false, causesDamage: false, isInteractiveSwitch: false }
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

    const handleGridContextMenu = (event: React.MouseEvent, x: number, y: number) => {
        const currentPhase = boss.phases.find(p => p.id === selectedPhaseId);
        if (!currentPhase || currentPhase.buildType !== 'tile' || editMode !== 'tiles') return;
        event.preventDefault();
        
        const tileIdAtCell = currentPhase.tileMatrix?.[y]?.[x];
        const tileAssetAtCell = tileIdAtCell ? tileset.find(t => t.id === tileIdAtCell) : null;
        
        const menuItems: ContextMenuItem[] = [
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
    const tilesForBank = useMemo(() => {
        if (!selectedPhase || !selectedPhase.tileBankId) return [];
        const bank = tileBanks.find(b => b.id === selectedPhase.tileBankId);
        if (!bank) return [];
        return Object.keys(bank.assignedTiles).map(tileId => tileset.find(t => t.id === tileId)).filter(Boolean) as Tile[];
    }, [selectedPhase, tileBanks, tileset]);

    const handleUpdateAttack = (attackId: string, field: keyof BossAttack, value: any) => {
        const updatedAttacks = boss.attacks.map(a => a.id === attackId ? { ...a, [field]: value } : a);
        onUpdate({ attacks: updatedAttacks });
    };

    const handleAddAttack = () => {
        const newAttack: BossAttack = {
            id: `attack_${Date.now()}`, name: `New Attack ${boss.attacks.length + 1}`, type: 'Projectile', damage: 1
        };
        onUpdate({ attacks: [...boss.attacks, newAttack] });
    };

    return (
        <Panel title={`Boss Editor: ${boss.name}`} className="flex-grow flex flex-col !p-0">
            <div className="flex flex-grow overflow-hidden">
                <div className="flex-grow p-3 flex items-center justify-center">
                    {selectedPhase && selectedPhase.buildType === 'tile' ? (
                        <BossMovementController
                            phase={selectedPhase}
                            tileset={tileset}
                            editMode={editMode}
                            onGridClick={handleGridClick}
                            onGridContextMenu={handleGridContextMenu}
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

                 <div className="w-80 border-l border-msx-border p-2 overflow-y-auto space-y-4 flex-shrink-0">
                    <Panel title="General">
                        <div className="space-y-2 text-xs">
                             <div>
                                <label className="block text-msx-textsecondary">Boss Name:</label>
                                <input type="text" value={boss.name} onChange={e => handleUpdateField('name', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                            </div>
                            <div>
                                <label className="block text-msx-textsecondary">Total Health:</label>
                                <input type="number" value={boss.totalHealth} onChange={e => handleUpdateField('totalHealth', parseInt(e.target.value) || 0)} min="1" className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                            </div>
                        </div>
                    </Panel>
                    <Panel title="Phase / Movement Properties">
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
                                    </>
                                )}
                                 <div className="flex items-center space-x-1 pt-2 border-t border-msx-border/30">
                                    <span className="text-msx-textsecondary">Mode:</span>
                                    <Button onClick={() => setEditMode('tiles')} variant={editMode === 'tiles' ? 'secondary' : 'ghost'} size="sm">Graphic</Button>
                                    <Button onClick={() => setEditMode('collision')} variant={editMode === 'collision' ? 'secondary' : 'ghost'} size="sm">Collision</Button>
                                    <Button onClick={() => setEditMode('weakpoints')} variant={editMode === 'weakpoints' ? 'secondary' : 'ghost'} size="sm">Weak Points</Button>
                                </div>
                            </div>
                        ) : <p className="text-xs text-msx-textsecondary italic">Select a phase to see properties.</p>}
                     </Panel>
                    <Panel title="Phases / Movements">
                        <Button onClick={handleAddPhase} size="sm" variant="secondary" icon={<PlusCircleIcon/>} className="w-full mb-2">Add Phase</Button>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {boss.phases.map(phase => (
                                <button key={phase.id} onClick={() => setSelectedPhaseId(phase.id)} className={`w-full text-left p-1.5 rounded text-xs truncate ${selectedPhaseId === phase.id ? 'bg-msx-accent text-white' : 'hover:bg-msx-border'}`}>
                                    {phase.name}
                                </button>
                            ))}
                        </div>
                    </Panel>
                </div>
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
        </Panel>
    );
};
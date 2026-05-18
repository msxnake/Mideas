

import React, { useState, useEffect, useRef } from 'react';
import { ProjectAsset, Sprite } from '../../types';
import { Button } from '../common/Button';
import { createSpriteDataURL } from '../utils/screenUtils';
import { AnimationWatcherModal } from './AnimationWatcherModal';
import { LoadIcon, SaveIcon } from '../icons/MsxIcons';

/**
 * A component to display a thumbnail preview of a sprite.
 * @internal
 */
const SpriteThumbnail: React.FC<{
    /** The sprite asset to display. */
    spriteAsset: ProjectAsset;
    /** The index of the sprite in the list. */
    index: number;
    /** Whether the sprite is currently being dragged. */
    isDragging: boolean;
    /** Whether this sprite is selected for file operations. */
    isSelected: boolean;
}> = ({ spriteAsset, index, isDragging, isSelected }) => {
    const sprite = spriteAsset.data as Sprite;
    const dataUrl = sprite.frames[0] ? createSpriteDataURL(sprite.frames[0].data, sprite.size.width, sprite.size.height) : '';

    return (
        <div
            className={`p-2 border-2 rounded-md flex flex-col items-center justify-center space-y-1 transition-all duration-150
                        ${isDragging ? 'border-msx-highlight bg-msx-accent/30 opacity-50 scale-105' : isSelected ? 'border-msx-highlight bg-msx-accent/25 ring-2 ring-msx-highlight/70' : 'border-msx-border bg-msx-panelbg hover:border-msx-accent'}`}
            draggable="false" // Prevent native image drag
        >
            <span className="text-xs text-msx-textsecondary">#{index}</span>
            {dataUrl ? (
                <img
                    src={dataUrl}
                    alt={sprite.name}
                    className="w-16 h-16 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                    draggable="false"
                />
            ) : (
                <div className="w-16 h-16 flex items-center justify-center text-xs text-msx-danger">No Preview</div>
            )}
            <p className="text-xs text-msx-textprimary truncate w-full text-center" title={sprite.name}>
                {sprite.name}
            </p>
        </div>
    );
};

/**
 * Props for the {@link SpriteSheetReorderModal} component.
 * @category Modal
 */
interface SpriteSheetReorderModalProps {
    /** Whether the modal is currently open. */
    isOpen: boolean;
    /** Callback function to close the modal. */
    onClose: () => void;
    /** The list of sprite assets to reorder. */
    sprites: ProjectAsset[];
    /** Callback function when the user saves the new order. */
    onUpdateOrder: (reorderedSprites: ProjectAsset[]) => void;
    /** A list of all project assets (used for animation watcher). */
    allAssets: ProjectAsset[];
    /** The current screen mode (used for animation watcher). */
    currentScreenMode: string;
    /** Callback to open the sprite frames modal for a specific sprite. */
    onOpenFramesModal: (spriteAsset: ProjectAsset) => void;
}

/**
 * A modal dialog for reordering sprites in a sprite sheet using drag and drop.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Modal
 */
export const SpriteSheetReorderModal: React.FC<SpriteSheetReorderModalProps> = ({
    isOpen,
    onClose,
    sprites,
    onUpdateOrder,
    allAssets,
    currentScreenMode,
    onOpenFramesModal,
}) => {
    const [localSprites, setLocalSprites] = useState<ProjectAsset[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [selectedSpriteIds, setSelectedSpriteIds] = useState<Set<string>>(new Set());
    const importFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalSprites([...sprites]); // Create a local copy on open
            setSelectedSpriteIds(new Set());
        }
    }, [isOpen, sprites]);

    const createUniqueImportedId = (baseId: string, usedIds: Set<string>, suffix: string) => {
        let candidate = baseId || `sprite_imported_${Date.now()}_${suffix}`;
        if (!usedIds.has(candidate)) {
            usedIds.add(candidate);
            return candidate;
        }

        let counter = 1;
        do {
            candidate = `${baseId || 'sprite_imported'}_imported_${suffix}_${counter}`;
            counter += 1;
        } while (usedIds.has(candidate));

        usedIds.add(candidate);
        return candidate;
    };

    const normalizeImportedSprites = (parsedJson: any): ProjectAsset[] => {
        const rawSprites = Array.isArray(parsedJson)
            ? parsedJson
            : parsedJson && Array.isArray(parsedJson.sprites)
                ? parsedJson.sprites
                : null;

        if (!rawSprites) {
            throw new Error("Invalid sprite sheet export. Expected an array or an object with a 'sprites' array.");
        }

        const usedIds = new Set(localSprites.map(asset => asset.id));

        return rawSprites.map((rawSpriteAsset: any, index: number) => {
            const rawSprite = rawSpriteAsset?.type === 'sprite' && rawSpriteAsset.data
                ? rawSpriteAsset.data
                : rawSpriteAsset;

            if (!rawSprite || !rawSprite.size || !Array.isArray(rawSprite.frames)) {
                throw new Error(`Invalid sprite at index ${index}.`);
            }

            const baseName = rawSprite.name || rawSpriteAsset?.name || `Imported Sprite ${index + 1}`;
            const assetId = createUniqueImportedId(rawSpriteAsset?.id || rawSprite.id, usedIds, `${Date.now()}_${index}`);
            const spriteId = assetId;
            const spriteName = localSprites.some(asset => asset.name === baseName) ? `${baseName}_imported` : baseName;
            const importedSprite: Sprite = {
                ...rawSprite,
                id: spriteId,
                name: spriteName,
                size: {
                    width: Number(rawSprite.size.width) || 16,
                    height: Number(rawSprite.size.height) || 16,
                },
                frames: rawSprite.frames,
                currentFrameIndex: rawSprite.frames.length > 0
                    ? Math.min(Math.max(Number(rawSprite.currentFrameIndex) || 0, 0), rawSprite.frames.length - 1)
                    : -1,
            };

            return {
                id: assetId,
                name: spriteName,
                type: 'sprite',
                data: importedSprite,
            } as ProjectAsset;
        });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Use a transparent image for drag ghost to have a clean look
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault(); // Necessary to allow dropping
        if (draggedIndex === null || draggedIndex === index) {
            return;
        }

        const draggedItem = localSprites[draggedIndex];
        const newSprites = [...localSprites];
        newSprites.splice(draggedIndex, 1);
        newSprites.splice(index, 0, draggedItem);

        setDraggedIndex(index);
        setLocalSprites(newSprites);
    };
    
    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleSpriteClick = (event: React.MouseEvent<HTMLDivElement>, spriteAsset: ProjectAsset) => {
        if (!event.ctrlKey && !event.metaKey) {
            return;
        }

        event.preventDefault();
        setSelectedSpriteIds(prev => {
            const next = new Set(prev);
            if (next.has(spriteAsset.id)) {
                next.delete(spriteAsset.id);
            } else {
                next.add(spriteAsset.id);
            }
            return next;
        });
    };

    const handleExportSelectedSprites = () => {
        const selectedSprites = localSprites.filter(spriteAsset => selectedSpriteIds.has(spriteAsset.id));
        if (selectedSprites.length === 0) {
            return;
        }

        const exportPayload = {
            type: 'mideas-sprite-assets',
            version: 1,
            exportedAt: new Date().toISOString(),
            sprites: selectedSprites,
        };
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedSprites.length === 1
            ? `${selectedSprites[0].name.replace(/[^a-zA-Z0-9_-]/g, '_')}.sprite.json`
            : `mideas_sprite_selection_${selectedSprites.length}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const text = e.target?.result as string;
                const importedSprites = normalizeImportedSprites(JSON.parse(text));
                if (importedSprites.length === 0) {
                    alert('No sprites found in the imported file.');
                    return;
                }

                setLocalSprites(prev => [...prev, ...importedSprites]);
                setSelectedSpriteIds(new Set(importedSprites.map(asset => asset.id)));
            } catch (error) {
                console.error('Error importing sprite assets:', error);
                alert(`Failed to import sprites: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                if (importFileRef.current) {
                    importFileRef.current.value = '';
                }
            }
        };
        reader.onerror = () => {
            alert('Error reading sprite asset file.');
            if (importFileRef.current) {
                importFileRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleSaveChanges = () => {
        onUpdateOrder(localSprites);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4">
                <div
                    className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-slideIn"
                    onClick={e => e.stopPropagation()}
                >
                    <h2 className="text-lg text-msx-highlight mb-4 pixel-font">Reorder Sprite Sheet</h2>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-msx-textsecondary">Drag and drop sprites to change their order. Ctrl-click sprites to select them for export. Double-click a sprite to view its frames.</p>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={handleExportSelectedSprites}
                                variant="secondary"
                                size="sm"
                                icon={<SaveIcon />}
                                disabled={selectedSpriteIds.size === 0}
                                title={selectedSpriteIds.size === 0 ? 'Ctrl-click sprites to select assets to export' : `Export ${selectedSpriteIds.size} selected sprite${selectedSpriteIds.size === 1 ? '' : 's'}`}
                            >
                                Export
                            </Button>
                            <Button onClick={handleImportClick} variant="secondary" size="sm" icon={<LoadIcon />}>
                                Import
                            </Button>
                            <input type="file" accept=".json,.sprite.json,application/json" ref={importFileRef} onChange={handleImportFileSelected} className="hidden" />
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {localSprites.map((spriteAsset, index) => (
                                <div
                                    key={spriteAsset.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className="cursor-move"
                                    onClick={(event) => handleSpriteClick(event, spriteAsset)}
                                    onDoubleClick={() => {
                                        onOpenFramesModal(spriteAsset);
                                    }}
                                    aria-selected={selectedSpriteIds.has(spriteAsset.id)}
                                >
                                    <SpriteThumbnail
                                        spriteAsset={spriteAsset}
                                        index={index}
                                        isDragging={draggedIndex === index}
                                        isSelected={selectedSpriteIds.has(spriteAsset.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-msx-border flex justify-end space-x-2">
                        <Button onClick={onClose} variant="ghost" size="md">Cancel</Button>
                        <Button onClick={handleSaveChanges} variant="primary" size="md">Save & Close</Button>
                    </div>
                </div>
            </div>
        </>
    );
};

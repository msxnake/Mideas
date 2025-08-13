

import React, { useState, useEffect } from 'react';
import { ProjectAsset, Sprite } from '../../types';
import { Button } from '../common/Button';
import { createSpriteDataURL } from '../utils/screenUtils';
import { AnimationWatcherModal } from './AnimationWatcherModal';

// Thumbnail component (defined within the same file)
const SpriteThumbnail: React.FC<{
    spriteAsset: ProjectAsset;
    index: number;
    isDragging: boolean;
}> = ({ spriteAsset, index, isDragging }) => {
    const sprite = spriteAsset.data as Sprite;
    const dataUrl = sprite.frames[0] ? createSpriteDataURL(sprite.frames[0].data, sprite.size.width, sprite.size.height) : '';

    return (
        <div
            className={`p-2 border-2 rounded-md flex flex-col items-center justify-center space-y-1 transition-all duration-150
                        ${isDragging ? 'border-msx-highlight bg-msx-accent/30 opacity-50 scale-105' : 'border-msx-border bg-msx-panelbg hover:border-msx-accent'}`}
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

// Main Modal component
interface SpriteSheetReorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    sprites: ProjectAsset[];
    onUpdateOrder: (reorderedSprites: ProjectAsset[]) => void;
    allAssets: ProjectAsset[];
    currentScreenMode: string;
    onOpenFramesModal: (spriteAsset: ProjectAsset) => void;
}

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

    useEffect(() => {
        if (isOpen) {
            setLocalSprites([...sprites]); // Create a local copy on open
        }
    }, [isOpen, sprites]);

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
                    <p className="text-xs text-msx-textsecondary mb-4">Drag and drop sprites to change their order. Double-click a sprite to view its frames.</p>
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
                                    onDoubleClick={() => {
                                        onOpenFramesModal(spriteAsset);
                                    }}
                                >
                                    <SpriteThumbnail
                                        spriteAsset={spriteAsset}
                                        index={index}
                                        isDragging={draggedIndex === index}
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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ProjectAsset, Sprite, SpriteFrame } from '../../types';
import { Button } from '../common/Button';
import { createSpriteDataURL } from '../utils/screenUtils';

/**
 * Props for the {@link SpriteFramesModal} component.
 * @category Modal
 */
interface SpriteFramesModalProps {
    /** Whether the modal is currently open. */
    isOpen: boolean;
    /** Callback function to close the modal. */
    onClose: () => void;
    /** Callback function to split the sprite frames into individual sprite assets. */
    onSplit: (spriteAsset: ProjectAsset) => void;
    /** Callback function to persist a reordered frame list. */
    onReorderFrames: (spriteAssetId: string, reorderedFrames: SpriteFrame[]) => void;
    /** The sprite asset whose frames are to be displayed. */
    spriteAsset: ProjectAsset | null;
}

/**
 * A component to display a preview of a single sprite frame.
 * @internal
 */
const FramePreview: React.FC<{
    sprite: Sprite;
    frameIndex: number;
    frame: SpriteFrame;
    isDragging: boolean;
}> = ({ sprite, frameIndex, frame, isDragging }) => {
    const dataUrl = useMemo(
        () => createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height),
        [frame.data, sprite.size.height, sprite.size.width]
    );

    const borderClass = isDragging
        ? 'border-msx-highlight bg-msx-accent/20 opacity-70'
        : 'border-msx-border bg-msx-bgcolor';

    return (
        <div className={`p-1 border ${borderClass} flex flex-col items-center space-y-1 rounded`}>
            <img
                src={dataUrl}
                alt={`Frame ${frameIndex}`}
                className="w-16 h-16 object-contain"
                style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-xs text-msx-textsecondary">Frame {frameIndex}</span>
        </div>
    );
};

/**
 * A modal dialog for viewing all frames of a sprite and optionally splitting them into individual sprites.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Modal
 */
export const SpriteFramesModal: React.FC<SpriteFramesModalProps> = ({
    isOpen,
    onClose,
    onSplit,
    onReorderFrames,
    spriteAsset,
}) => {
    if (!isOpen || !spriteAsset) return null;

    const sprite = spriteAsset.data as Sprite;
    const [localFrames, setLocalFrames] = useState<SpriteFrame[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [hasPendingOrder, setHasPendingOrder] = useState(false);
    const framesRef = useRef<SpriteFrame[]>([]);

    useEffect(() => {
        if (isOpen && spriteAsset) {
            const initialFrames = [...(spriteAsset.data as Sprite).frames];
            framesRef.current = initialFrames;
            setLocalFrames(initialFrames);
            setDraggedIndex(null);
            setHasPendingOrder(false);
        }
    }, [isOpen, spriteAsset]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) {
            return;
        }

        const reordered = [...localFrames];
        const [movedFrame] = reordered.splice(draggedIndex, 1);
        reordered.splice(index, 0, movedFrame);
        framesRef.current = reordered;
        setLocalFrames(reordered);
        setDraggedIndex(index);
        setHasPendingOrder(true);
    };

    const commitFrameOrder = () => {
        if (!spriteAsset || !hasPendingOrder) return;
        const framesToPersist = framesRef.current.length ? framesRef.current : localFrames;
        onReorderFrames(spriteAsset.id, framesToPersist);
        setHasPendingOrder(false);
    };

    const handleDragEnd = () => {
        commitFrameOrder();
        setDraggedIndex(null);
    };

    const handleSplitClick = () => {
        commitFrameOrder();
        const framesToUse = framesRef.current.length ? framesRef.current : localFrames;
        const updatedSpriteAsset: ProjectAsset = {
            ...spriteAsset,
            data: { ...sprite, frames: framesToUse },
        };
        onSplit(updatedSpriteAsset);
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="spriteFramesModalTitle"
        >
            <div
                className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-slideIn"
                onClick={e => e.stopPropagation()}
            >
                <h2 id="spriteFramesModalTitle" className="text-lg text-msx-highlight mb-4 pixel-font">
                    Frames for: {sprite.name}
                </h2>
                <p className="text-xs text-msx-textsecondary mb-4">
                    Drag frames to reorder them. Changes save automatically after dropping.
                </p>
                <div className="flex-grow overflow-y-auto pr-2 border-t border-b border-msx-border py-4">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                        {localFrames.map((frame, index) => (
                            <div
                                key={frame.id || index}
                                draggable
                                className="cursor-move"
                                onDragStart={e => handleDragStart(e, index)}
                                onDragOver={e => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                            >
                                <FramePreview
                                    sprite={sprite}
                                    frameIndex={index}
                                    frame={frame}
                                    isDragging={draggedIndex === index}
                                />
                            </div>
                        ))}
                    </div>
                    {localFrames.length === 0 && (
                        <p className="text-center text-msx-textsecondary">This sprite has no frames.</p>
                    )}
                </div>
                <div className="mt-6 pt-4 flex justify-between items-center">
                    <p className="text-xs text-msx-textsecondary font-sans">'Split' will create a new MSX1 sprite asset for each frame.</p>
                    <div className="flex space-x-2">
                        <Button onClick={onClose} variant="ghost" size="md">Close</Button>
                        <Button onClick={handleSplitClick} variant="primary" size="md" disabled={sprite.frames.length === 0}>
                            MSX1 Split Frames into Sprites
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

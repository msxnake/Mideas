import React from 'react';
import { ProjectAsset, Sprite } from '../../types';
import { Button } from '../common/Button';
import { createSpriteDataURL } from '../utils/screenUtils';

interface SpriteFramesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSplit: (spriteAsset: ProjectAsset) => void;
    spriteAsset: ProjectAsset | null;
}

const FramePreview: React.FC<{ sprite: Sprite; frameIndex: number }> = ({ sprite, frameIndex }) => {
    const frame = sprite.frames[frameIndex];
    if (!frame) return null;

    const dataUrl = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);

    return (
        <div className="p-1 border border-msx-border bg-msx-bgcolor flex flex-col items-center space-y-1">
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


export const SpriteFramesModal: React.FC<SpriteFramesModalProps> = ({ isOpen, onClose, onSplit, spriteAsset }) => {
    if (!isOpen || !spriteAsset) return null;

    const sprite = spriteAsset.data as Sprite;

    const handleSplitClick = () => {
        onSplit(spriteAsset);
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
                <div className="flex-grow overflow-y-auto pr-2 border-t border-b border-msx-border py-4">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                        {sprite.frames.map((frame, index) => (
                            <FramePreview key={frame.id || index} sprite={sprite} frameIndex={index} />
                        ))}
                    </div>
                    {sprite.frames.length === 0 && (
                        <p className="text-center text-msx-textsecondary">This sprite has no frames.</p>
                    )}
                </div>
                <div className="mt-6 pt-4 flex justify-between items-center">
                    <p className="text-xs text-msx-textsecondary font-sans">'Split' will create a new sprite asset for each frame.</p>
                    <div className="flex space-x-2">
                        <Button onClick={onClose} variant="ghost" size="md">Close</Button>
                        <Button onClick={handleSplitClick} variant="primary" size="md" disabled={sprite.frames.length === 0}>
                            Split Frames into Sprites
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

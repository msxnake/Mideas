import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { FireIcon } from '../icons/MsxIcons';

/**
 * Parameters for warp disintegration generation
 */
export interface WarpParams {
    numFrames: number;
    spiralTightness: number;
    rotationSpeed: number;
}

interface WarpGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (params: WarpParams) => void;
}

export const WarpGeneratorModal: React.FC<WarpGeneratorModalProps> = ({
    isOpen,
    onClose,
    onGenerate
}) => {
    const [numFrames, setNumFrames] = useState<number>(15);
    const [spiralTightness, setSpiralTightness] = useState<number>(50);
    const [rotationSpeed, setRotationSpeed] = useState<number>(50);

    const handleGenerate = () => {
        onGenerate({
            numFrames,
            spiralTightness,
            rotationSpeed
        });
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Warp Disintegration Generator">
            <div className="p-4 space-y-4">
                <Panel title="Warp Parameters">
                    <div className="space-y-4">
                        {/* Number of Frames */}
                        <div className="space-y-2">
                            <label className="text-sm pixel-font text-msx-highlight block">
                                Number of Frames: {numFrames}
                            </label>
                            <input
                                type="range"
                                min="8"
                                max="30"
                                value={numFrames}
                                onChange={(e) => setNumFrames(parseInt(e.target.value))}
                                className="w-full accent-msx-accent"
                            />
                            <p className="text-xs text-msx-textsecondary">
                                Total frames for complete warp effect (8-30)
                            </p>
                        </div>

                        {/* Spiral Tightness */}
                        <div className="space-y-2">
                            <label className="text-sm pixel-font text-msx-highlight block">
                                Spiral Tightness: {spiralTightness}%
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={spiralTightness}
                                onChange={(e) => setSpiralTightness(parseInt(e.target.value))}
                                className="w-full accent-msx-accent"
                            />
                            <p className="text-xs text-msx-textsecondary">
                                How tightly pixels spiral toward center (10-100)
                            </p>
                        </div>

                        {/* Rotation Speed */}
                        <div className="space-y-2">
                            <label className="text-sm pixel-font text-msx-highlight block">
                                Rotation Speed: {rotationSpeed}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={rotationSpeed}
                                onChange={(e) => setRotationSpeed(parseInt(e.target.value))}
                                className="w-full accent-msx-accent"
                            />
                            <p className="text-xs text-msx-textsecondary">
                                Angular velocity of spiral rotation (0-100)
                            </p>
                        </div>
                    </div>
                </Panel>

                {/* Preview Info */}
                <Panel title="Effect Preview">
                    <div className="text-xs text-msx-textsecondary space-y-1">
                        <p>
                            <span className="text-msx-textprimary">Effect Type:</span> Spiral warp to center
                        </p>
                        <p>
                            <span className="text-msx-textprimary">Spiral Turns:</span> ~{Math.round(spiralTightness / 20)} rotations
                        </p>
                        <p>
                            <span className="text-msx-textprimary">Motion:</span> Pixels rotate {rotationSpeed}% speed while converging
                        </p>
                        <p className="text-msx-cyan pt-1">
                            ✨ Pixels will spiral inward and disappear at the center
                        </p>
                    </div>
                </Panel>

                {/* Action Buttons */}
                <div className="flex space-x-2 justify-end pt-2">
                    <Button
                        onClick={handleClose}
                        variant="secondary"
                        size="sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        variant="primary"
                        size="sm"
                        icon={<FireIcon className="w-4 h-4" />}
                    >
                        Generate Warp
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
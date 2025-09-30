import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { FireIcon } from '../icons/MsxIcons';

/**
 * Parameters for fragment generation
 */
export interface FragmentParams {
    numFrames: number;
    animationSpeed: number;
    separationSpeed: number;
}

interface FragmentGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (params: FragmentParams) => void;
}

export const FragmentGeneratorModal: React.FC<FragmentGeneratorModalProps> = ({
    isOpen,
    onClose,
    onGenerate
}) => {
    const [numFrames, setNumFrames] = useState<number>(16);
    const [animationSpeed, setAnimationSpeed] = useState<number>(100);
    const [separationSpeed, setSeparationSpeed] = useState<number>(50);

    const handleGenerate = () => {
        onGenerate({
            numFrames,
            animationSpeed,
            separationSpeed
        });
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Sprite Fragment Generator">
            <div className="p-4 space-y-4">
                <Panel title="Fragment Parameters">
                    <div className="space-y-4">
                        {/* Number of Frames */}
                        <div className="space-y-2">
                            <label className="text-sm pixel-font text-msx-highlight block">
                                Number of Frames: {numFrames}
                            </label>
                            <input
                                type="range"
                                min="8"
                                max="32"
                                value={numFrames}
                                onChange={(e) => setNumFrames(parseInt(e.target.value))}
                                className="w-full accent-msx-accent"
                            />
                            <p className="text-xs text-msx-textsecondary">
                                Total frames for complete separation (8-32)
                            </p>
                        </div>

                        {/* Animation Speed */}
                        <div className="space-y-2">
                            <label className="text-sm pixel-font text-msx-highlight block">
                                Animation Speed: {animationSpeed}ms
                            </label>
                            <input
                                type="range"
                                min="50"
                                max="300"
                                step="25"
                                value={animationSpeed}
                                onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                                className="w-full accent-msx-accent"
                            />
                            <p className="text-xs text-msx-textsecondary">
                                Time between frames in milliseconds (50-300ms)
                            </p>
                        </div>

                        {/* Separation Speed */}
                        <div className="space-y-2">
                            <label className="text-sm pixel-font text-msx-highlight block">
                                Separation Intensity: {separationSpeed}%
                            </label>
                            <input
                                type="range"
                                min="25"
                                max="100"
                                step="25"
                                value={separationSpeed}
                                onChange={(e) => setSeparationSpeed(parseInt(e.target.value))}
                                className="w-full accent-msx-accent"
                            />
                            <p className="text-xs text-msx-textsecondary">
                                How fast the fragments separate (25-100%)
                            </p>
                        </div>
                    </div>
                </Panel>

                {/* Preview Info */}
                <Panel title="Preview">
                    <div className="text-xs text-msx-textsecondary space-y-1">
                        <p>
                            <span className="text-msx-textprimary">Total Animation Duration:</span> {(numFrames * animationSpeed / 1000).toFixed(1)}s
                        </p>
                        <p>
                            <span className="text-msx-textprimary">Effect:</span> Break sprite into 4 quadrants
                        </p>
                        <p>
                            <span className="text-msx-textprimary">Separation:</span> Line-by-line outward movement
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
                        Generate Fragments
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
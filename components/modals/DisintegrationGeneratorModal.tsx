import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { FireIcon } from '../icons/MsxIcons';

/**
 * Parameters for disintegration generation
 */
export interface DisintegrationParams {
    numFrames: number;
    animationSpeed: number;
    convertToGrayscale: boolean;
}

interface DisintegrationGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (params: DisintegrationParams) => void;
}

export const DisintegrationGeneratorModal: React.FC<DisintegrationGeneratorModalProps> = ({
    isOpen,
    onClose,
    onGenerate
}) => {
    const [numFrames, setNumFrames] = useState<number>(10);
    const [animationSpeed, setAnimationSpeed] = useState<number>(150);
    const [convertToGrayscale, setConvertToGrayscale] = useState<boolean>(true);

    const handleGenerate = () => {
        onGenerate({
            numFrames,
            animationSpeed,
            convertToGrayscale
        });
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Sprite Disintegration Generator">
            <div className="p-4 space-y-4">
                <Panel title="Disintegration Parameters">
                    <div className="space-y-4">
                        {/* Number of Frames */}
                        <div className="space-y-2">
                            <label className="text-sm pixel-font text-msx-highlight block">
                                Number of Frames: {numFrames}
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                value={numFrames}
                                onChange={(e) => setNumFrames(parseInt(e.target.value))}
                                className="w-full accent-msx-accent"
                            />
                            <p className="text-xs text-msx-textsecondary">
                                Total frames for complete disintegration (5-30)
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
                                max="500"
                                step="25"
                                value={animationSpeed}
                                onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                                className="w-full accent-msx-accent"
                            />
                            <p className="text-xs text-msx-textsecondary">
                                Time between frames in milliseconds (50-500ms)
                            </p>
                        </div>

                        {/* Convert to Grayscale */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={convertToGrayscale}
                                    onChange={(e) => setConvertToGrayscale(e.target.checked)}
                                    className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
                                />
                                <span className="text-sm pixel-font text-msx-textprimary">
                                    Convert to Grayscale
                                </span>
                            </label>
                            <p className="text-xs text-msx-textsecondary ml-6">
                                First convert sprite to black and white before disintegration
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
                            <span className="text-msx-textprimary">Pixels removed per frame:</span> ~{Math.ceil(100 / numFrames)}%
                        </p>
                        <p>
                            <span className="text-msx-textprimary">Effect:</span> {convertToGrayscale ? 'Grayscale + ' : ''}Progressive pixel removal
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
                        Generate Disintegration
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
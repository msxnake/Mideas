
import React, { useMemo } from 'react';

/**
 * Props for the {@link AYEnvelopeVisualizer} component.
 * @category Tracker
 */
interface AYEnvelopeVisualizerProps {
    /** The currently selected envelope shape (0-15). */
    selectedShape: number;
    /** Callback when a shape is selected. */
    onShapeChange: (shape: number) => void;
    /** Optional CSS class name. */
    className?: string;
}

/**
 * Metadata for each AY-3-8910 envelope shape.
 * @internal
 */
interface EnvelopeShapeInfo {
    shape: number;
    name: string;
    description: string;
    continue: boolean;
    attack: boolean;
    alternate: boolean;
    hold: boolean;
}

/**
 * Information about all 16 AY envelope shapes.
 * Based on AY-3-8910 datasheet.
 * @constant
 */
const ENVELOPE_SHAPES: EnvelopeShapeInfo[] = [
    { shape: 0, name: '\\___', description: 'Fall, Off', continue: false, attack: false, alternate: false, hold: false },
    { shape: 1, name: '\\___', description: 'Fall, Off', continue: false, attack: false, alternate: false, hold: true },
    { shape: 2, name: '\\/\\/\\/\\/', description: 'Fall, Repeat', continue: false, attack: false, alternate: true, hold: false },
    { shape: 3, name: '\\‾‾‾', description: 'Fall, Hold', continue: false, attack: false, alternate: true, hold: true },
    { shape: 4, name: '/___', description: 'Rise, Off', continue: false, attack: true, alternate: false, hold: false },
    { shape: 5, name: '/___', description: 'Rise, Off', continue: false, attack: true, alternate: false, hold: true },
    { shape: 6, name: '/\\/\\/\\/', description: 'Rise, Repeat', continue: false, attack: true, alternate: true, hold: false },
    { shape: 7, name: '/‾‾‾', description: 'Rise, Hold', continue: false, attack: true, alternate: true, hold: true },
    { shape: 8, name: '\\\\\\\\', description: 'Fall, Continue', continue: true, attack: false, alternate: false, hold: false },
    { shape: 9, name: '\\___', description: 'Fall, Off', continue: true, attack: false, alternate: false, hold: true },
    { shape: 10, name: '\\/\\/\\/\\/', description: 'Fall, Alt', continue: true, attack: false, alternate: true, hold: false },
    { shape: 11, name: '\\‾‾‾', description: 'Fall, Hold', continue: true, attack: false, alternate: true, hold: true },
    { shape: 12, name: '////', description: 'Rise, Continue', continue: true, attack: true, alternate: false, hold: false },
    { shape: 13, name: '/‾‾‾', description: 'Rise, Hold', continue: true, attack: true, alternate: false, hold: true },
    { shape: 14, name: '/\\/\\/\\/', description: 'Rise, Alt', continue: true, attack: true, alternate: true, hold: false },
    { shape: 15, name: '/___', description: 'Rise, Off', continue: true, attack: true, alternate: true, hold: true },
];

/**
 * Generates SVG path data for an AY envelope shape.
 * @param shapeInfo The envelope shape information.
 * @param width The width of the visualization.
 * @param height The height of the visualization.
 * @returns SVG path data string.
 * @internal
 */
const generateEnvelopePath = (shapeInfo: EnvelopeShapeInfo, width: number, height: number): string => {
    const { attack, alternate, hold, continue: cont } = shapeInfo;

    let path = '';
    const segments = cont ? 3 : 1; // Show multiple cycles if continuous
    const segmentWidth = width / segments;

    for (let seg = 0; seg < segments; seg++) {
        const startX = seg * segmentWidth;
        const endX = (seg + 1) * segmentWidth;

        // Determine if this segment rises or falls
        let rises = attack;
        if (alternate && seg > 0) {
            rises = seg % 2 === 0 ? attack : !attack;
        }

        if (seg === 0) {
            path += `M ${startX} ${rises ? height : 0}`;
        }

        if (hold && seg > 0) {
            // Hold at current level
            path += ` L ${endX} ${path.includes(`${startX}`) ? (rises ? 0 : height) : (rises ? height : 0)}`;
        } else {
            // Rise or fall
            path += ` L ${endX} ${rises ? 0 : height}`;
        }
    }

    return path;
};

/**
 * A visual selector and preview for AY-3-8910 hardware envelope shapes.
 * Displays all 16 shapes as clickable thumbnails with the selected shape highlighted.
 * 
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const AYEnvelopeVisualizer: React.FC<AYEnvelopeVisualizerProps> = ({
    selectedShape,
    onShapeChange,
    className = ''
}) => {
    // Ensure selectedShape is in valid range
    const validShape = Math.max(0, Math.min(15, selectedShape));

    // Generate preview for the selected shape
    const selectedShapeInfo = ENVELOPE_SHAPES[validShape];
    const previewPath = useMemo(
        () => generateEnvelopePath(selectedShapeInfo, 200, 80),
        [selectedShapeInfo]
    );

    return (
        <div className={`ay-envelope-visualizer ${className}`}>
            {/* Large preview of selected shape */}
            <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-msx-textsecondary font-semibold">
                        AY Envelope Shape
                    </label>
                    <span className="text-xs text-msx-accent font-mono">
                        #{validShape} - {selectedShapeInfo.name}
                    </span>
                </div>

                <div className="bg-msx-bgcolor border border-msx-border rounded p-3">
                    <svg width="200" height="80" className="mx-auto">
                        <path
                            d={previewPath}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {/* Grid lines */}
                        <line x1="0" y1="0" x2="200" y2="0" stroke="#374151" strokeWidth="0.5" />
                        <line x1="0" y1="40" x2="200" y2="40" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="0" y1="80" x2="200" y2="80" stroke="#374151" strokeWidth="0.5" />
                    </svg>
                    <p className="text-center text-xs text-msx-textsecondary mt-2">
                        {selectedShapeInfo.description}
                    </p>
                </div>
            </div>

            {/* Grid of all 16 shapes */}
            <div className="grid grid-cols-4 gap-2">
                {ENVELOPE_SHAPES.map((shapeInfo) => {
                    const isSelected = shapeInfo.shape === validShape;
                    const thumbnailPath = generateEnvelopePath(shapeInfo, 60, 30);

                    return (
                        <button
                            key={shapeInfo.shape}
                            onClick={() => onShapeChange(shapeInfo.shape)}
                            className={`
                relative p-2 rounded border-2 transition-all
                ${isSelected
                                    ? 'border-msx-accent bg-msx-accent bg-opacity-10'
                                    : 'border-msx-border bg-msx-bgcolor hover:border-msx-textsecondary'
                                }
              `}
                            title={`${shapeInfo.shape}: ${shapeInfo.description}`}
                        >
                            {/* Shape number badge */}
                            <div className={`
                absolute top-0 left-0 w-5 h-5 flex items-center justify-center
                text-[9px] font-bold rounded-br
                ${isSelected ? 'bg-msx-accent text-white' : 'bg-msx-border text-msx-textsecondary'}
              `}>
                                {shapeInfo.shape}
                            </div>

                            {/* Waveform thumbnail */}
                            <svg width="60" height="30" className="mx-auto">
                                <path
                                    d={thumbnailPath}
                                    fill="none"
                                    stroke={isSelected ? '#a78bfa' : '#6b7280'}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>

                            {/* Shape name */}
                            <div className="text-[9px] text-center mt-1 font-mono text-msx-textsecondary">
                                {shapeInfo.name}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-3 text-[10px] text-msx-textsecondary space-y-0.5">
                <p><strong>Tip:</strong> Hardware envelope shapes affect the volume over time.</p>
                <p>• <strong>Rise (/):</strong> Volume increases | <strong>Fall (\\):</strong> Volume decreases</p>
                <p>• <strong>Hold (‾):</strong> Sustains | <strong>Continue:</strong> Repeats pattern</p>
            </div>
        </div>
    );
};

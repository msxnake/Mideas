
import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Props for the {@link EnvelopeEditor} component.
 * @category Tracker
 */
interface EnvelopeEditorProps {
    /** The type of envelope being edited. */
    type: 'volume' | 'tone' | 'noise';
    /** The envelope data as an array of numbers. */
    values: number[];
    /** The loop point index (0-31, or 255 for no loop). */
    loopPoint?: number;
    /** Callback when the envelope values change. */
    onChange: (values: number[]) => void;
    /** Callback when the loop point changes. */
    onLoopChange?: (loopPoint: number | undefined) => void;
    /** Optional label for the editor. */
    label?: string;
    /** Optional CSS class name. */
    className?: string;
}

/**
 * A visual envelope editor component for PSG instruments.
 * Allows interactive editing of volume and tone envelopes with drag-and-drop points.
 * 
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const EnvelopeEditor: React.FC<EnvelopeEditorProps> = ({
    type,
    values,
    loopPoint,
    onChange,
    onLoopChange,
    label,
    className = ''
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Configuration based on envelope type
    const config = type === 'volume'
        ? { min: 0, max: 127, color: '#4ade80', gridLines: 8 }
        : type === 'tone'
            ? { min: -128, max: 127, color: '#60a5fa', gridLines: 16 }
            : { min: 0, max: 31, color: '#f59e0b', gridLines: 8 };

    const width = 400;
    const height = 150;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Convert envelope value to Y coordinate
    const valueToY = useCallback((value: number) => {
        const normalized = (value - config.min) / (config.max - config.min);
        return padding.top + graphHeight * (1 - normalized);
    }, [config.min, config.max, graphHeight, padding.top]);

    // Convert Y coordinate to envelope value
    const yToValue = useCallback((y: number) => {
        const normalized = 1 - ((y - padding.top) / graphHeight);
        const value = Math.round(normalized * (config.max - config.min) + config.min);
        return Math.max(config.min, Math.min(config.max, value));
    }, [config.min, config.max, graphHeight, padding.top]);

    // Convert index to X coordinate
    const indexToX = useCallback((index: number) => {
        if (values.length <= 1) return padding.left + graphWidth / 2;
        return padding.left + (index / (values.length - 1)) * graphWidth;
    }, [values.length, graphWidth, padding.left]);

    // Convert X coordinate to index
    const xToIndex = useCallback((x: number) => {
        const normalized = (x - padding.left) / graphWidth;
        return Math.round(normalized * (values.length - 1));
    }, [values.length, graphWidth, padding.left]);

    // Handle mouse down on a point
    const handlePointMouseDown = useCallback((index: number, e: React.MouseEvent) => {
        e.preventDefault();
        setDraggingIndex(index);
    }, []);

    // Handle mouse move for dragging
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (draggingIndex === null || !svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const newValue = yToValue(y);

        const newValues = [...values];
        newValues[draggingIndex] = newValue;
        onChange(newValues);
    }, [draggingIndex, values, onChange, yToValue]);

    // Handle mouse up to stop dragging
    const handleMouseUp = useCallback(() => {
        setDraggingIndex(null);
    }, []);

    // Handle double click to add/remove points
    const handleDoubleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking near an existing point to remove it
        const clickedIndex = values.findIndex((_, i) => {
            const px = indexToX(i);
            const py = valueToY(values[i]);
            const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
            return distance < 8;
        });

        if (clickedIndex !== -1 && values.length > 1) {
            // Remove point
            const newValues = values.filter((_, i) => i !== clickedIndex);
            onChange(newValues);

            // Adjust loop point if necessary
            if (loopPoint !== undefined && loopPoint !== 255) {
                if (loopPoint === clickedIndex) {
                    onLoopChange?.(255);
                } else if (loopPoint > clickedIndex) {
                    onLoopChange?.(loopPoint - 1);
                }
            }
        } else if (values.length < 32) {
            // Add point at the clicked position
            const newValue = yToValue(y);
            const insertIndex = xToIndex(x);
            const newValues = [...values];
            newValues.splice(Math.max(0, Math.min(insertIndex, values.length)), 0, newValue);
            onChange(newValues);
        }
    }, [values, onChange, indexToX, valueToY, xToIndex, yToValue, loopPoint, onLoopChange]);

    // Generate grid lines
    const gridLines = [];
    for (let i = 0; i <= config.gridLines; i++) {
        const value = config.min + (i / config.gridLines) * (config.max - config.min);
        const y = valueToY(value);
        gridLines.push(
            <line
                key={`grid-${i}`}
                x1={padding.left}
                y1={y}
                x2={padding.left + graphWidth}
                y2={y}
                stroke="#374151"
                strokeWidth="0.5"
                strokeDasharray="2,2"
            />
        );
    }

    // Generate path for the envelope
    const pathData = values.map((value, i) => {
        const x = indexToX(i);
        const y = valueToY(value);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
        <div className={`envelope-editor ${className}`}>
            {label && (
                <label className="block text-xs text-msx-textsecondary mb-1 font-semibold">
                    {label}
                </label>
            )}

            <svg
                ref={svgRef}
                width={width}
                height={height}
                className="bg-msx-bgcolor border border-msx-border rounded cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
            >
                {/* Grid lines */}
                {gridLines}

                {/* Axis labels */}
                <text x={5} y={padding.top} fontSize="10" fill="#9ca3af">
                    {config.max}
                </text>
                <text x={5} y={height - padding.bottom + 15} fontSize="10" fill="#9ca3af">
                    {config.min}
                </text>

                {/* Loop indicator */}
                {loopPoint !== undefined && loopPoint !== 255 && loopPoint < values.length && (
                    <>
                        <line
                            x1={indexToX(loopPoint)}
                            y1={padding.top}
                            x2={indexToX(loopPoint)}
                            y2={height - padding.bottom}
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray="4,2"
                        />
                        <text
                            x={indexToX(loopPoint) + 5}
                            y={padding.top + 12}
                            fontSize="10"
                            fill="#f59e0b"
                            fontWeight="bold"
                        >
                            LOOP
                        </text>
                    </>
                )}

                {/* Envelope path */}
                {values.length > 0 && (
                    <path
                        d={pathData}
                        fill="none"
                        stroke={config.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Points */}
                {values.map((value, i) => {
                    const x = indexToX(i);
                    const y = valueToY(value);
                    const isHovered = hoveredIndex === i;
                    const isDragging = draggingIndex === i;
                    const isLoop = loopPoint === i;

                    return (
                        <g key={i}>
                            {/* Point circle */}
                            <circle
                                cx={x}
                                cy={y}
                                r={isDragging ? 7 : isHovered ? 6 : 5}
                                fill={isLoop ? '#f59e0b' : config.color}
                                stroke="#1f2937"
                                strokeWidth="2"
                                className="cursor-move"
                                onMouseDown={(e) => handlePointMouseDown(i, e)}
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />

                            {/* Value label on hover */}
                            {isHovered && (
                                <text
                                    x={x}
                                    y={y - 15}
                                    fontSize="11"
                                    fill={config.color}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    pointerEvents="none"
                                >
                                    {value}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Instructions */}
                <text
                    x={width / 2}
                    y={height - 5}
                    fontSize="9"
                    fill="#6b7280"
                    textAnchor="middle"
                >
                    Drag points • Double-click to add/remove • {values.length}/32 points
                </text>
            </svg>

            {/* Loop point selector */}
            {onLoopChange && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                    <label className="text-msx-textsecondary">Loop Point:</label>
                    <select
                        value={loopPoint ?? 255}
                        onChange={(e) => onLoopChange(parseInt(e.target.value))}
                        className="px-2 py-1 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary text-xs"
                    >
                        <option value={255}>No Loop</option>
                        {values.map((_, i) => (
                            <option key={i} value={i}>
                                Point {i} ({values[i]})
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

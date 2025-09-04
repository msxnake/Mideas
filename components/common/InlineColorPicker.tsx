
import React, { useState, useEffect, useRef } from 'react';
import { MSX1ColorValue } from '../../types';
import { MSX1_PALETTE } from '../../constants';
import { Button } from './Button';

/**
 * An inline color picker component for selecting from the MSX1 palette.
 * @param {object} props - The component props.
 * @param {string} props.label - The label to display next to the color picker.
 * @param {MSX1ColorValue} props.color - The currently selected color.
 * @param {(color: MSX1ColorValue) => void} props.onChange - Callback function for when a new color is selected.
 * @returns A React component.
 */
export const InlineColorPicker: React.FC<{ label: string, color: MSX1ColorValue; onChange: (color: MSX1ColorValue) => void; }> = ({ label, color, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    return (
        <div className="flex items-center justify-between p-2 bg-msx-bgcolor rounded relative">
            <span className="text-msx-textprimary">{label}:</span>
            <Button onClick={() => setIsOpen(o => !o)} size="sm" variant="ghost" className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded border border-msx-border" style={{ backgroundColor: color }}></div>
                <span className="text-msx-textsecondary">{color}</span>
            </Button>
            {isOpen && (
                <div ref={pickerRef} className="absolute z-20 top-full right-0 mt-1 bg-msx-panelbg border border-msx-border rounded shadow-lg p-2">
                    <div className="grid grid-cols-8 gap-1">
                        {MSX1_PALETTE.map(c => (
                            <button
                                key={c.index}
                                className={`w-6 h-6 rounded border-2 ${color === c.hex ? 'border-white ring-1 ring-white' : 'border-transparent'}`}
                                style={{ backgroundColor: c.hex }}
                                onClick={() => { onChange(c.hex); setIsOpen(false); }}
                                title={`${c.name} (${c.index})`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

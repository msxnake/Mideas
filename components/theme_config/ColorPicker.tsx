import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS: string[] = [
  '#22272E', '#2D333B', '#58A6FF', '#3FB950', '#C9D1D9', '#8B949E', '#444C56', '#F85149', '#F0A832', // Dark theme defaults
  '#F3F4F6', '#FFFFFF', '#3B82F6', '#10B981', '#1F2937', '#6B7280', '#D1D5DB', // Light theme defaults
  '#EF4444', '#F59E0B', '#EC4899', '#8B5CF6', '#0EA5E9', '#6366F1' // Extra accents
];


const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const [inputValue, setInputValue] = useState(color);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Basic validation for hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value) || /^#[0-9A-Fa-f]{3}$/.test(e.target.value) || e.target.value === 'transparent') {
      onChange(e.target.value);
    }
  };
  
  const handleInputBlur = () => {
    // Ensure the parent's state is updated if the input was manually changed
    if (inputValue !== color) {
        if (/^#[0-9A-Fa-f]{6}$/.test(inputValue) || /^#[0-9A-Fa-f]{3}$/.test(inputValue) || inputValue === 'transparent') {
            onChange(inputValue);
        } else {
            setInputValue(color); // Revert if invalid
        }
    }
  }

  const handlePresetClick = (presetColor: string) => {
    onChange(presetColor);
    setInputValue(presetColor);
    setIsPickerOpen(false);
  };
  
  const handleHtmlColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setInputValue(e.target.value);
  };

  return (
    <div className="flex items-center space-x-2 w-full">
      {label && <span className="text-xs text-msx-textsecondary w-24 truncate">{label}:</span>}
      <div 
        className="w-8 h-8 rounded border border-msx-border cursor-pointer flex-shrink-0"
        style={{ backgroundColor: color }}
        onClick={() => setIsPickerOpen(!isPickerOpen)}
        title={`Current color: ${color}. Click to open picker.`}
        role="button"
        aria-expanded={isPickerOpen}
        aria-haspopup="dialog"
      />
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="p-1.5 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent w-28"
        placeholder="#RRGGBB"
        maxLength={7}
      />
      {isPickerOpen && (
        <div ref={pickerRef} className="absolute z-20 mt-1 top-full bg-msx-panelbg p-3 rounded-md shadow-lg border border-msx-border max-w-xs">
          <input
            type="color"
            value={color}
            onChange={handleHtmlColorInputChange}
            className="w-full h-10 cursor-pointer mb-2 border-none p-0"
            aria-label="HTML Color Picker"
          />
          <div className="grid grid-cols-6 gap-1 mb-2">
            {PRESET_COLORS.map((preset) => (
              <div
                key={preset}
                className="w-6 h-6 rounded-sm cursor-pointer border border-msx-border hover:ring-2 hover:ring-msx-accent"
                style={{ backgroundColor: preset }}
                onClick={() => handlePresetClick(preset)}
                title={preset}
                role="button"
              />
            ))}
          </div>
          <p className="text-[0.65rem] text-msx-textsecondary text-center">Click swatch or use picker.</p>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;

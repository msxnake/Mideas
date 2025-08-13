
import React from 'react';
import { MSXColor, MSXColorValue, MSX1Color } from '../../types';
import { Panel } from '../common/Panel';
// Fix: Import MSX1_PALETTE from ../../constants // Removed this line

interface PalettePanelProps {
  palette: MSXColor[] | MSX1Color[]; // Can be MSX regular palette or MSX1 specific
  selectedColor: MSXColorValue;
  onColorSelect: (color: MSXColorValue) => void;
  isMsx1Palette?: boolean;
}

export const PalettePanel: React.FC<PalettePanelProps> = ({ palette, selectedColor, onColorSelect, isMsx1Palette = false }) => {
  const title = isMsx1Palette ? "MSX1 Palette (SCREEN 2)" : "MSX Palette (SCREEN 5)";
  
  return (
    <Panel title={title} titleClassName="text-msx-highlight">
      <div className={`grid ${isMsx1Palette ? 'grid-cols-8' : 'grid-cols-8'} gap-1 p-1`}>
        {palette.map((colorItem) => {
          const msx1Color = isMsx1Palette ? colorItem as MSX1Color : null;
          const genericColor = colorItem as MSXColor; // To access hex and name generally

          const isSelected = selectedColor === genericColor.hex;
          const isTransparentMSX1 = isMsx1Palette && msx1Color?.index === 0;

          return (
            <button
              key={genericColor.name + (msx1Color ? msx1Color.index : '')}
              title={`${genericColor.name}${msx1Color ? ` (Idx: ${msx1Color.index})` : ''}`}
              onClick={() => onColorSelect(genericColor.hex)}
              className={`w-full aspect-square rounded border-2 relative
                          ${isSelected ? 'border-msx-white ring-2 ring-offset-1 ring-offset-msx-panelbg ring-msx-white' : 'border-msx-border'}
                          ${(genericColor.hex === 'rgba(0,0,0,0)' && !isMsx1Palette) ? 'bg-transparent bg-stripes' : ''} 
                          ${isTransparentMSX1 ? 'bg-stripes' : ''}
                          hover:opacity-80 transition-opacity`}
              style={{ backgroundColor: (genericColor.hex !== 'rgba(0,0,0,0)' && !isTransparentMSX1) ? genericColor.hex : undefined }}
            >
              {( (genericColor.hex === 'rgba(0,0,0,0)' && !isMsx1Palette) || isTransparentMSX1 ) && 
                <span className="absolute inset-0 flex items-center justify-center text-xs text-msx-textprimary opacity-80 pointer-events-none"> {/* Changed text-msx-gray to text-msx-textprimary and adjusted opacity */}
                  {isMsx1Palette ? msx1Color?.index : 'T'}
                </span>
              }
              {isMsx1Palette && !isTransparentMSX1 && msx1Color && msx1Color.index !== undefined && (
                 <span className="absolute bottom-0 right-0 px-0.5 text-[0.5rem] bg-black/30 text-white/70 rounded-tl-sm pointer-events-none">
                    {msx1Color.index}
                 </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 p-1 text-xs text-msx-textsecondary pixel-font">
        Selected: 
        <div 
            className={`inline-block w-3 h-3 rounded border border-msx-border ml-1 mr-0.5 align-middle ${selectedColor === 'rgba(0,0,0,0)' ? 'bg-stripes' : ''}`} 
            style={{backgroundColor: selectedColor}}
        ></div>
        {palette.find(c => (c as MSXColor).hex === selectedColor)?.name}
        {isMsx1Palette && ` (Idx: ${(palette.find(c => (c as MSXColor).hex === selectedColor) as MSX1Color)?.index})`}
      </div>
    </Panel>
  );
};

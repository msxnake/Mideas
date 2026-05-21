
import React from 'react';
import { MSXColor, MSXColorValue, MSX1Color } from '../../types';
import { Panel } from '../common/Panel';
// Fix: Import MSX1_PALETTE from ../../constants // Removed this line

/**
 * Props for the {@link PalettePanel} component.
 * @category Tools
 */
interface PalettePanelProps {
  /** The color palette to display (can be for SCREEN 2 or MSX2 V9938 modes). */
  palette: MSXColor[] | MSX1Color[];
  /** The currently selected color value. */
  selectedColor: MSXColorValue;
  /** Callback function when a color is selected. */
  onColorSelect: (color: MSXColorValue) => void;
  /** Whether the palette is for MSX1 (SCREEN 2). */
  isMsx1Palette?: boolean;
}

/**
 * A panel that displays a color palette for selection.
 * It can render either the 16-color MSX1 palette or the 4-color sprite palette.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tools
 */
export const PalettePanel: React.FC<PalettePanelProps> = ({ palette, selectedColor, onColorSelect, isMsx1Palette = false }) => {
  const title = isMsx1Palette ? "MSX1 Palette (SCREEN 2)" : "MSX2 Palette";
  
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

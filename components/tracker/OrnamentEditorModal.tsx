
import React from 'react';
import { PT3Ornament } from '../../types';
import { Button } from '../common/Button';
import { PT3_MAX_ORNAMENTS, PT3_ORNAMENT_LENGTH } from '../../constants';

// This mirrors the OrnamentModalBuffer type definition from TrackerComposer
interface OrnamentModalBuffer extends Omit<Partial<PT3Ornament>, 'data'> {
    data?: string;
}

interface OrnamentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingOrnament: PT3Ornament | null;
  ornamentModalBuffer: OrnamentModalBuffer;
  onOrnamentModalBufferChange: (field: keyof OrnamentModalBuffer, value: any) => void;
  onSubmit: () => void;
}

type PredefinedOrnamentType = "Custom" | "Simple Vibrato" | "Fast Trill (Semitone)" | "Major Arpeggio Up" | "Quick Slide Up" | "Mordent (Upper)" | "Random";

const PREDEFINED_ORNAMENTS: Record<PredefinedOrnamentType, Partial<OrnamentModalBuffer>> = {
    "Custom": {}, // Placeholder for manual editing
    "Simple Vibrato": {
        data: "0,1,0,-1",
        loopPosition: 0,
    },
    "Fast Trill (Semitone)": {
        data: "0,1",
        loopPosition: 0,
    },
    "Major Arpeggio Up": {
        data: "0,4,7",
        loopPosition: 0,
    },
    "Quick Slide Up": {
        data: "0,1,2,3",
        loopPosition: 255, // No loop
    },
    "Mordent (Upper)": {
        data: "0,1,0",
        loopPosition: 255, // No loop
    },
    "Random": {} // Special case handled by generateRandomOrnamentData
};

const generateRandomOrnamentData = (): Partial<OrnamentModalBuffer> => {
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomBool = (probabilityTrue = 0.5) => Math.random() < probabilityTrue;

    const dataLen = randomInt(2, 8); // Short random sequence
    const data: number[] = [];
    for (let i = 0; i < dataLen; i++) {
        data.push(randomInt(-3, 3)); // Small pitch deviations
    }
    // Ensure the first element is often 0 for a stable start
    if (data.length > 0 && Math.random() < 0.7) {
      data[0] = 0;
    }
    
    const loopPosition = randomBool(0.4) ? randomInt(0, dataLen - 1) : 255;

    return {
        data: data.join(','),
        loopPosition: loopPosition,
    };
};


export const OrnamentEditorModal: React.FC<OrnamentEditorModalProps> = ({
  isOpen,
  onClose,
  editingOrnament,
  ornamentModalBuffer,
  onOrnamentModalBufferChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  const handleFieldChange = (field: keyof OrnamentModalBuffer, value: string | number | undefined) => {
    onOrnamentModalBufferChange(field, value);
  };
  
  const handleNumberFieldChange = (field: keyof OrnamentModalBuffer, value: string) => {
    const num = parseInt(value, 10);
    onOrnamentModalBufferChange(field, isNaN(num) ? undefined : num);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value as PredefinedOrnamentType;
    let presetData: Partial<OrnamentModalBuffer>;

    if (selectedType === "Random") {
        presetData = generateRandomOrnamentData();
    } else {
        presetData = PREDEFINED_ORNAMENTS[selectedType] || {};
    }
    
    // Apply preset data, keeping ID and Name if they were already set
    Object.keys(presetData).forEach(key => {
        const fieldKey = key as keyof OrnamentModalBuffer;
        onOrnamentModalBufferChange(fieldKey, presetData[fieldKey]);
    });
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ornamentModalTitle"
    >
        <div 
            className="bg-msx-panelbg p-4 rounded-lg shadow-xl max-w-lg w-full animate-slideIn pixel-font" 
            onClick={e => e.stopPropagation()}
        >
            <h3 id="ornamentModalTitle" className="text-lg text-msx-highlight mb-3">
                {editingOrnament ? `Edit Ornament ${editingOrnament.id}` : `Add Ornament ${ornamentModalBuffer.id || ''}`}
            </h3>

            {!editingOrnament && (
                 <div className="mb-3 text-xs">
                    <label htmlFor="ornamentPreset" className="block text-msx-textsecondary mb-0.5">Load Template:</label>
                    <select
                        id="ornamentPreset"
                        onChange={handlePresetChange}
                        defaultValue="Custom"
                        className="w-full p-1.5 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
                    >
                        {(Object.keys(PREDEFINED_ORNAMENTS) as PredefinedOrnamentType[]).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="space-y-2 text-xs max-h-[60vh] overflow-y-auto pr-1">
                <div>
                    ID: 
                    <input 
                        type="number" 
                        value={ornamentModalBuffer.id || ""} 
                        onChange={e => handleNumberFieldChange('id', e.target.value)} 
                        min="1" 
                        max={PT3_MAX_ORNAMENTS} 
                        className="p-1 bg-msx-bgcolor border border-msx-border rounded w-16 ml-1"
                        disabled={!!editingOrnament}
                    />
                </div>
                <div>
                    Name: 
                    <input 
                        type="text" 
                        value={ornamentModalBuffer.name || ""} 
                        onChange={e => handleFieldChange('name', e.target.value)} 
                        className="p-1 bg-msx-bgcolor border border-msx-border rounded w-full"
                    />
                </div>
                <div>
                    Data (csv, up to {PT3_ORNAMENT_LENGTH} vals, pitch offsets): 
                    <input 
                        type="text" 
                        value={ornamentModalBuffer.data || ""} 
                        onChange={e => handleFieldChange('data', e.target.value)} 
                        className="p-1 bg-msx-bgcolor border border-msx-border rounded w-full" 
                        placeholder="e.g. 0,1,-2,0"
                    />
                </div>
                <div>
                    Loop Pos (0-{PT3_ORNAMENT_LENGTH-1}, 255=off): 
                    <input 
                        type="number" 
                        value={ornamentModalBuffer.loopPosition ?? ""} 
                        onChange={e => handleNumberFieldChange('loopPosition', e.target.value)} 
                        min="0" max="255" 
                        className="p-1 bg-msx-bgcolor border border-msx-border rounded w-full"
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={onClose} variant="ghost">Cancel</Button>
                <Button onClick={onSubmit} variant="primary">Save</Button>
            </div>
        </div>
    </div>
  );
};

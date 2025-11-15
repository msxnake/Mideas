import React, { useEffect, useMemo, useState } from 'react';
import { PaletteAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { MSX_SCREEN5_MASTER_PALETTE } from '../../constants';
import { assignMasterColorToSlot, ensureScreen5PaletteSlots } from '../../utils/screen5PaletteUtils';

const MASTER_PALETTE_COLUMNS = 32;

interface PaletteEditorProps {
  paletteAsset: { id: string; name: string; data?: PaletteAsset };
  onUpdate: (updatedData: Partial<PaletteAsset>) => void;
  setStatusBarMessage: (message: string) => void;
}

export const PaletteEditor: React.FC<PaletteEditorProps> = ({
  paletteAsset,
  onUpdate,
  setStatusBarMessage,
}) => {
  const { slots: rawSlots = [], notes = '', mode = 'SCREEN5' } = paletteAsset.data || { slots: [] };
  const { slots, changed } = useMemo(() => ensureScreen5PaletteSlots(rawSlots), [rawSlots]);
  const [activeSlot, setActiveSlot] = useState<number>(1);

  useEffect(() => {
    if (changed) {
      onUpdate({ slots });
    }
  }, [changed, onUpdate, slots]);

  useEffect(() => {
    if (activeSlot <= 0 || activeSlot >= slots.length) {
      setActiveSlot(1);
    }
  }, [slots.length, activeSlot]);

  const handleAssignColor = (masterIndex: number) => {
    if (activeSlot === 0) {
      setStatusBarMessage('Slot 0 es transparente por convención.');
      return;
    }
    const updatedSlots = assignMasterColorToSlot(slots, activeSlot, masterIndex);
    onUpdate({ slots: updatedSlots });
    setStatusBarMessage(`Slot ${activeSlot} actualizado a color ${masterIndex}.`);
  };

  return (
    <Panel title={`Palette Editor: ${paletteAsset.name}`} className="flex flex-col p-4 gap-4 h-full overflow-auto">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-msx-highlight">Slots ({mode})</h3>
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot, index) => {
            const isActive = index === activeSlot;
            const slotLabel = index === 0 ? 'Slot 0 (Transp.)' : `Slot ${index}`;
            return (
              <button
                key={slot.slotIndex}
                className={`border rounded p-2 text-left text-xs transition-colors ${isActive ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border hover:border-msx-highlight'}`}
                onClick={() => setActiveSlot(index)}
                style={slot.hex === 'rgba(0,0,0,0)' ? undefined : { backgroundColor: slot.hex }}
              >
                <div className={`font-semibold ${slot.hex === 'rgba(0,0,0,0)' ? 'text-msx-textsecondary' : 'text-white mix-blend-difference'}`}>{slotLabel}</div>
                <div className="mt-1 text-[0.65rem] text-msx-textsecondary">
                  {slot.hex === 'rgba(0,0,0,0)' ? 'Transparente' : slot.hex} <br />
                  {slot.masterIndex >= 0 ? `Idx ${slot.masterIndex}` : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-msx-highlight">Master Palette</h3>
        <div className="max-h-64 overflow-y-auto border border-msx-border rounded">
          <div
            className="grid gap-1 p-1"
            style={{ gridTemplateColumns: `repeat(${MASTER_PALETTE_COLUMNS}, minmax(0, 1fr))` }}
          >
            {MSX_SCREEN5_MASTER_PALETTE.map(color => (
              <button
                key={color.index}
                className="w-4 h-4 rounded border border-msx-border hover:opacity-80"
                style={{ backgroundColor: color.hex }}
                title={`Idx ${color.index} - ${color.hex}`}
                onClick={() => handleAssignColor(color.index)}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-msx-textsecondary">Selecciona un slot (1-15) y luego un color del maestro para actualizarlo. El slot 0 permanece transparente.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-msx-highlight" htmlFor="palette-notes">Notas</label>
        <textarea
          id="palette-notes"
          className="w-full bg-msx-bgcolor border border-msx-border rounded p-2 text-xs text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
          rows={4}
          value={notes}
          onChange={e => onUpdate({ notes: e.target.value })}
          placeholder="Añade notas sobre el uso de esta paleta..."
        />
      </div>

      <div className="flex items-center justify-end gap-2 text-xs text-msx-textsecondary">
        <span>Slot activo:</span>
        <Button size="sm" variant="secondary" onClick={() => setActiveSlot(1)} disabled={activeSlot === 1}>1</Button>
        <Button size="sm" variant="secondary" onClick={() => setActiveSlot(0)} disabled={activeSlot === 0}>0</Button>
      </div>
    </Panel>
  );
};

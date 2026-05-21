import React, { useEffect, useMemo, useState } from 'react';
import { PaletteAsset, Screen5PaletteSlot } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import {
  DEFAULT_SCREEN5_CUSTOM_PALETTE,
  MSX_SCREEN5_MASTER_PALETTE,
  snapHexToScreen5MasterColor,
} from '../../constants';
import { assignMasterColorToSlot, ensureScreen5PaletteSlots } from '../../utils/screen5PaletteUtils';

const MASTER_PALETTE_COLUMNS = 32;
const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

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
  const { slots: rawSlots = [], notes = '', mode = 'SCREEN4' } = paletteAsset.data || { slots: [] };
  const { slots, changed } = useMemo(() => ensureScreen5PaletteSlots(rawSlots), [rawSlots]);
  const [activeSlot, setActiveSlot] = useState<number>(1);

  const activePaletteSlot = slots[activeSlot] || slots[1];
  const activeMasterColor = activePaletteSlot?.masterIndex >= 0
    ? MSX_SCREEN5_MASTER_PALETTE[activePaletteSlot.masterIndex]
    : undefined;
  const [hexInput, setHexInput] = useState(activeMasterColor?.hex || '#000000');

  useEffect(() => {
    if (changed) {
      onUpdate({ slots });
    }
  }, [changed, onUpdate, slots]);

  useEffect(() => {
    if (activeSlot < 0 || activeSlot >= slots.length) {
      setActiveSlot(1);
    }
  }, [slots.length, activeSlot]);

  useEffect(() => {
    setHexInput(activeMasterColor?.hex || '#000000');
  }, [activeMasterColor?.hex]);

  const formatVdpBytes = (slot?: Screen5PaletteSlot): string => {
    if (!slot || slot.masterIndex < 0) return '-- --';
    const color = MSX_SCREEN5_MASTER_PALETTE[slot.masterIndex];
    if (!color) return '-- --';
    const byte1 = (color.rLevel << 4) | color.bLevel;
    const byte2 = color.gLevel;
    return `#${byte1.toString(16).toUpperCase().padStart(2, '0')} #${byte2.toString(16).toUpperCase().padStart(2, '0')}`;
  };

  const applyMasterColorToActiveSlot = (masterIndex: number) => {
    if (activeSlot === 0) {
      setStatusBarMessage('Slot 0 is transparent by convention.');
      return;
    }
    const updatedSlots = assignMasterColorToSlot(slots, activeSlot, masterIndex);
    onUpdate({ slots: updatedSlots });
    setStatusBarMessage(`Slot ${activeSlot} updated to master color ${masterIndex}.`);
  };

  const applyRgbLevels = (rLevel: number, gLevel: number, bLevel: number) => {
    const clampedR = Math.min(Math.max(0, rLevel), 7);
    const clampedG = Math.min(Math.max(0, gLevel), 7);
    const clampedB = Math.min(Math.max(0, bLevel), 7);
    applyMasterColorToActiveSlot((clampedR << 6) | (clampedG << 3) | clampedB);
  };

  const applyHexInput = () => {
    const snapped = snapHexToScreen5MasterColor(hexInput);
    setHexInput(snapped.hex);
    applyMasterColorToActiveSlot(snapped.masterIndex);
  };

  const resetToDefault = () => {
    onUpdate({ slots: DEFAULT_SCREEN5_CUSTOM_PALETTE.map(slot => ({ ...slot })), mode: 'SCREEN4' });
    setStatusBarMessage('MSX2 palette reset to the default V9938 slot set.');
  };

  return (
    <Panel title={`MSX2 Palette Editor: ${paletteAsset.name}`} className="flex flex-col p-4 gap-4 h-full overflow-auto">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,420px)_1fr] gap-4 min-h-0">
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-msx-highlight">MSX2 Slots ({mode})</h3>
            <Button size="sm" variant="secondary" onClick={resetToDefault}>Reset default</Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot, index) => {
              const isActive = index === activeSlot;
              const isTransparent = slot.hex === TRANSPARENT_HEX;
              const slotLabel = index === 0 ? 'S0 trans' : `S${index}`;
              return (
                <button
                  key={slot.slotIndex}
                  type="button"
                  className={`min-h-16 border rounded p-2 text-left text-xs transition-colors ${isActive ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border hover:border-msx-highlight'}`}
                  onClick={() => setActiveSlot(index)}
                  style={isTransparent ? undefined : { backgroundColor: slot.hex }}
                >
                  <div className={`font-semibold ${isTransparent ? 'text-msx-textsecondary' : 'text-white mix-blend-difference'}`}>{slotLabel}</div>
                  <div className={`mt-1 text-[0.65rem] ${isTransparent ? 'text-msx-textsecondary' : 'text-white mix-blend-difference'}`}>
                    {isTransparent ? 'Transparent' : slot.hex}
                    <br />
                    {slot.masterIndex >= 0 ? `M${slot.masterIndex}` : 'Locked'}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border border-msx-border rounded p-3 bg-msx-bgcolor text-xs space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded border border-msx-border"
                style={activePaletteSlot?.hex === TRANSPARENT_HEX ? undefined : { backgroundColor: activePaletteSlot?.hex }}
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-msx-highlight">Slot {activeSlot}</div>
                <div className="text-msx-textsecondary">{activePaletteSlot?.hex || TRANSPARENT_HEX}</div>
                <div className="text-msx-textsecondary">Master: {activePaletteSlot?.masterIndex ?? -1}</div>
              </div>
            </div>

            {activeMasterColor ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <label>R
                    <input
                      type="number"
                      min={0}
                      max={7}
                      value={activeMasterColor.rLevel}
                      onChange={event => applyRgbLevels(Number(event.target.value), activeMasterColor.gLevel, activeMasterColor.bLevel)}
                      className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded px-2 py-1"
                    />
                  </label>
                  <label>G
                    <input
                      type="number"
                      min={0}
                      max={7}
                      value={activeMasterColor.gLevel}
                      onChange={event => applyRgbLevels(activeMasterColor.rLevel, Number(event.target.value), activeMasterColor.bLevel)}
                      className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded px-2 py-1"
                    />
                  </label>
                  <label>B
                    <input
                      type="number"
                      min={0}
                      max={7}
                      value={activeMasterColor.bLevel}
                      onChange={event => applyRgbLevels(activeMasterColor.rLevel, activeMasterColor.gLevel, Number(event.target.value))}
                      className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded px-2 py-1"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <label>Hex input
                    <input
                      value={hexInput}
                      onChange={event => setHexInput(event.target.value)}
                      className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded px-2 py-1"
                      placeholder="#RRGGBB"
                    />
                  </label>
                  <Button size="sm" variant="secondary" onClick={applyHexInput}>Snap</Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-msx-textsecondary">
                  <div>RGB333: {activeMasterColor.rLevel},{activeMasterColor.gLevel},{activeMasterColor.bLevel}</div>
                  <div>VDP: {formatVdpBytes(activePaletteSlot)}</div>
                </div>
              </>
            ) : (
              <p className="text-msx-textsecondary">Slot 0 is transparent and cannot be assigned to a V9938 master color.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-msx-highlight">MSX2 V9938 Master Palette</h3>
          <div className="max-h-[28rem] overflow-y-auto border border-msx-border rounded">
            <div
              className="grid gap-1 p-1"
              style={{ gridTemplateColumns: `repeat(${MASTER_PALETTE_COLUMNS}, minmax(0, 1fr))` }}
            >
              {MSX_SCREEN5_MASTER_PALETTE.map(color => {
                const isSelected = color.index === activePaletteSlot?.masterIndex;
                return (
                  <button
                    key={color.index}
                    type="button"
                    className={`aspect-square min-w-4 rounded border hover:opacity-80 ${isSelected ? 'border-white ring-1 ring-msx-highlight' : 'border-msx-border'}`}
                    style={{ backgroundColor: color.hex }}
                    title={`Idx ${color.index} - ${color.hex} - RGB333 ${color.rLevel},${color.gLevel},${color.bLevel} - VDP ${formatVdpBytes({ slotIndex: activeSlot, masterIndex: color.index, hex: color.hex })}`}
                    onClick={() => applyMasterColorToActiveSlot(color.index)}
                  />
                );
              })}
            </div>
          </div>
          <p className="text-xs text-msx-textsecondary">Select slot 1-15, then pick a master color. Slot 0 stays transparent. Master index = (R&lt;&lt;6)|(G&lt;&lt;3)|B.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-msx-highlight" htmlFor="palette-notes">Notes</label>
        <textarea
          id="palette-notes"
          className="w-full bg-msx-bgcolor border border-msx-border rounded p-2 text-xs text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
          rows={4}
          value={notes}
          onChange={e => onUpdate({ notes: e.target.value })}
          placeholder="Add notes about where this palette is used..."
        />
      </div>
    </Panel>
  );
};

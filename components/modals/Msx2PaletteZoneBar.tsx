import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Msx2PaletteZones, Screen5PaletteSlot } from '../../types';
import { SCREEN5_PALETTE_SLOT_COUNT } from '../../utils/msx2PaletteUtils';
import {
  getImmutableSlots,
  getSlotRole,
  normalizePaletteZones,
} from '../../utils/msx2PaletteZones';

interface Msx2PaletteZoneBarProps {
  /** The 16-slot palette to visualize. */
  palette: Screen5PaletteSlot[];
  /** Current zoning. Normalized internally; pass undefined to use defaults. */
  zones: Msx2PaletteZones;
  /** Emitted when the user drags the divider. Omit for read-only. */
  onChange?: (zones: Msx2PaletteZones) => void;
  /** Read-only mode hides the draggable handle. */
  readOnly?: boolean;
}

const TRANSPARENT_HEX = 'rgba(0,0,0,0)';
const CELL_WIDTH = 26; // px per slot cell

/**
 * Horizontal bar visualizing the 16-slot shared SCREEN4 palette divided into
 * functional zones (Intocable / Sprites / Tiles) with a draggable divider
 * (arrow handle) between the sprite and tile zones.
 *
 * The divider snaps to slot boundaries. Dragging maps the pointer x to the
 * nearest boundary, clamped so at least one slot stays on each side and the
 * divider never lands before the sprite-zone start.
 */
export const Msx2PaletteZoneBar: React.FC<Msx2PaletteZoneBarProps> = ({
  palette,
  zones,
  onChange,
  readOnly = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const normalized = useMemo(() => normalizePaletteZones(zones, palette), [zones, palette]);
  const immutable = useMemo(() => new Set(getImmutableSlots(palette)), [palette]);

  const slots = useMemo(
    () => Array.from({ length: SCREEN5_PALETTE_SLOT_COUNT }, (_, index) => palette[index]),
    [palette],
  );

  const commitDividerFromX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || !onChange) return;
    const rect = track.getBoundingClientRect();
    const relative = clientX - rect.left;
    let target = Math.round(relative / CELL_WIDTH);
    // Clamp so sprites keep >=1 slot and tiles keep >=1 slot.
    target = Math.min(Math.max(target, normalized.spriteStart + 1), normalized.tileEnd);
    if (target === normalized.divider) return;
    onChange(normalizePaletteZones({ ...normalized, divider: target }, palette));
  }, [normalized, onChange, palette]);

  useEffect(() => {
    if (readOnly || !onChange) return;
    const handleMove = (event: MouseEvent) => {
      if (!draggingRef.current) return;
      event.preventDefault();
      commitDividerFromX(event.clientX);
    };
    const handleUp = () => { draggingRef.current = false; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [commitDividerFromX, onChange, readOnly]);

  const editable = !readOnly && !!onChange;
  const handleLeft = normalized.divider * CELL_WIDTH;

  const zoneSummary = (label: string, color: string, slotList: number[]) => (
    <span className={color}>
      {label}: {slotList.length > 0 ? slotList.map(slot => `S${slot}`).join(', ') : '—'}
    </span>
  );

  const spriteSlots: number[] = [];
  const tileSlots: number[] = [];
  const immutableSlots: number[] = [];
  for (let slot = 0; slot < SCREEN5_PALETTE_SLOT_COUNT; slot++) {
    const role = getSlotRole(slot, normalized, palette);
    if (role === 'immutable') immutableSlots.push(slot);
    else if (role === 'sprite') spriteSlots.push(slot);
    else tileSlots.push(slot);
  }

  return (
    <div className="space-y-2">
      <div className="text-msx-textsecondary">
        Zonas de la paleta compartida (SCREEN 4)
      </div>
      <div className="relative select-none" style={{ width: SCREEN5_PALETTE_SLOT_COUNT * CELL_WIDTH }}>
        <div ref={trackRef} className="flex">
          {slots.map((slot, index) => {
            const role = getSlotRole(index, normalized, palette);
            const hex = slot?.hex || '#000000';
            const isTransparent = index === 0 || hex === TRANSPARENT_HEX;
            const ring =
              role === 'immutable' ? 'ring-1 ring-msx-warning'
              : role === 'sprite' ? 'ring-1 ring-msx-highlight'
              : 'ring-1 ring-msx-accent';
            const title = `S${index} ${isTransparent ? 'transparente' : hex} — ${
              role === 'immutable' ? 'intocable' : role === 'sprite' ? 'sprites' : 'tiles'
            }`;
            return (
              <div
                key={index}
                title={title}
                className={`relative h-7 border border-msx-border ${ring}`}
                style={{
                  width: CELL_WIDTH,
                  backgroundColor: isTransparent ? 'transparent' : hex,
                  backgroundImage: isTransparent
                    ? 'linear-gradient(45deg,#333 25%,transparent 25%,transparent 75%,#333 75%),linear-gradient(45deg,#333 25%,transparent 25%,transparent 75%,#333 75%)'
                    : undefined,
                  backgroundSize: isTransparent ? '8px 8px' : undefined,
                  backgroundPosition: isTransparent ? '0 0,4px 4px' : undefined,
                }}
              >
                <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] leading-none text-white mix-blend-difference">
                  {index}
                </span>
                {immutable.has(index) && index !== 0 && (
                  <span className="absolute top-0 left-0 right-0 text-center text-[8px] leading-none text-msx-warning">⚲</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Draggable divider between sprite and tile zones. */}
        <div
          className={`absolute top-0 bottom-0 ${editable ? 'cursor-ew-resize' : ''}`}
          style={{ left: handleLeft - 7, width: 14 }}
          onMouseDown={editable ? (event) => { event.preventDefault(); draggingRef.current = true; } : undefined}
          title={editable ? 'Arrastra para mover el límite Sprites/Tiles' : `Límite en S${normalized.divider}`}
        >
          <div className="absolute top-[-6px] bottom-[-6px] left-1/2 w-0.5 -translate-x-1/2 bg-msx-highlight" />
          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center text-msx-highlight">
            <span className="text-[10px] leading-none">◀</span>
            <span className="text-[10px] leading-none">▶</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
        {zoneSummary('Intocable', 'text-msx-warning', immutableSlots)}
        {zoneSummary('Sprites', 'text-msx-highlight', spriteSlots)}
        {zoneSummary('Tiles', 'text-msx-accent', tileSlots)}
      </div>
    </div>
  );
};

export default Msx2PaletteZoneBar;

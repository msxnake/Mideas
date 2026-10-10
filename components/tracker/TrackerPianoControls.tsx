
import React from 'react';
import VirtualPiano from '../common/VirtualPiano';
import { Button } from '../common/Button';

/**
 * Props for the {@link TrackerPianoControls} component.
 * @category Tracker
 */
interface TrackerPianoControlsProps {
  /** A set of currently pressed keys to be highlighted on the virtual piano. */
  pressedKeys: Set<string>;
  /** Optional 0..1 visual intensity for currently pressed keys. */
  pressedKeyLevels?: Map<string, number>;
  /** The current octave offset for keyboard input. */
  keyboardOctaveOffset: number;
  /** Callback function when a key on the virtual piano is pressed. */
  onPianoKeyPress: (noteName: string) => void;
  /** Callback function to change the octave offset. */
  onOctaveChange: (newOffset: number | ((prevOffset: number) => number)) => void;
  /** The minimum allowed octave offset. */
  minOctave: number;
  /** The maximum allowed octave offset. */
  maxOctave: number;
  soundSelection?: string;
  onClearSoundSelection?: () => void;
  onShareSoundProperties?: () => void;
  canShareSoundProperties?: boolean;
}

/**
 * A component that provides a virtual piano and octave controls for the tracker.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const TrackerPianoControls: React.FC<TrackerPianoControlsProps> = ({
  pressedKeys, pressedKeyLevels, keyboardOctaveOffset, onPianoKeyPress, onOctaveChange, minOctave, maxOctave,
  soundSelection, onClearSoundSelection, onShareSoundProperties, canShareSoundProperties = false
}) => {
  return (
    <div className="border-t border-msx-border">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-xs text-msx-textsecondary">
        <span title="Ctrl+C en una fila copia instrumento, ornamento, volumen, envolvente y efectos para el piano y MIDI.">
          {soundSelection} · Ctrl+C: copiar sonido de la fila
        </span>
        <div className="flex flex-shrink-0 items-center gap-2">
          {onShareSoundProperties && <Button size="sm" variant="secondary"
            disabled={!canShareSoundProperties} onMouseDown={event => event.preventDefault()}
            onClick={onShareSoundProperties}
            title={canShareSoundProperties
              ? 'Copiar el sonido de la fila y canal del cursor para el piano y MIDI (Ctrl+C).'
              : 'Sitúa el cursor en una celda del tracker para copiar su sonido.'}>Share Propierty</Button>}
          {onClearSoundSelection && <Button size="sm" variant="ghost" onClick={onClearSoundSelection}>Quitar sonido copiado</Button>}
        </div>
      </div>
      <div className="p-1 flex items-center justify-between">
      <VirtualPiano
          pressedKeys={pressedKeys}
          pressedKeyLevels={pressedKeyLevels}
          baseDisplayOctave={3 + keyboardOctaveOffset}
          numOctavesToDisplay={3}
          onPianoKeyPress={onPianoKeyPress}
      />
      <div className="flex items-center space-x-1 text-xs mr-2">
          <span className="text-msx-textsecondary">Octave:</span>
          <Button onClick={() => onOctaveChange(o => Math.max(minOctave, (typeof o === 'number' ? o : 0) -1))} size="sm" variant="ghost" disabled={keyboardOctaveOffset <= minOctave}>-</Button>
          <span className="w-5 text-center text-msx-highlight">{keyboardOctaveOffset}</span>
          <Button onClick={() => onOctaveChange(o => Math.min(maxOctave, (typeof o === 'number' ? o : 0) + 1))} size="sm" variant="ghost" disabled={keyboardOctaveOffset >= maxOctave}>+</Button>
      </div>
      </div>
    </div>
  );
};

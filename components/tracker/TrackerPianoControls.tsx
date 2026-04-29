
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
}

/**
 * A component that provides a virtual piano and octave controls for the tracker.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const TrackerPianoControls: React.FC<TrackerPianoControlsProps> = ({
  pressedKeys, keyboardOctaveOffset, onPianoKeyPress, onOctaveChange, minOctave, maxOctave
}) => {
  return (
    <div className="p-1 border-t border-msx-border flex items-center justify-between">
      <VirtualPiano
          pressedKeys={pressedKeys}
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
  );
};

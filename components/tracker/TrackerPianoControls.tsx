
import React from 'react';
import VirtualPiano from '../common/VirtualPiano';
import { Button } from '../common/Button';

interface TrackerPianoControlsProps {
  pressedKeys: Set<string>;
  keyboardOctaveOffset: number;
  onPianoKeyPress: (noteName: string) => void;
  onOctaveChange: (newOffset: number | ((prevOffset: number) => number)) => void;
  minOctave: number;
  maxOctave: number;
}

export const TrackerPianoControls: React.FC<TrackerPianoControlsProps> = ({
  pressedKeys, keyboardOctaveOffset, onPianoKeyPress, onOctaveChange, minOctave, maxOctave
}) => {
  return (
    <div className="p-1 border-t border-msx-border flex items-center justify-between">
      <VirtualPiano
          pressedKeys={pressedKeys}
          baseDisplayOctave={3 + keyboardOctaveOffset}
          numOctavesToDisplay={2}
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

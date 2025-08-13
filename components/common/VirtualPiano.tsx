
import React from 'react';
import { PT3_NOTE_NAMES } from '../../constants'; // Assuming PT3_NOTE_NAMES: ["C-", "C#", ..., "B-"]

interface VirtualPianoProps {
  pressedKeys: Set<string>; // Set of note strings like "C-4", "C#4"
  baseDisplayOctave?: number; // The starting octave to display (e.g., 3)
  numOctavesToDisplay?: number; // How many octaves to show (e.g., 3)
  onPianoKeyPress?: (noteName: string) => void; // Optional: For clickable piano
}

const WHITE_KEY_WIDTH = 30; // pixels
const BLACK_KEY_WIDTH = WHITE_KEY_WIDTH * 0.6;
const WHITE_KEY_HEIGHT = 120;
const BLACK_KEY_HEIGHT = WHITE_KEY_HEIGHT * 0.6;

const notesInOctave = PT3_NOTE_NAMES; // ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"]
const blackKeyIndices = [1, 3, 6, 8, 10]; // Indices of C#, D#, F#, G#, A# in notesInOctave

interface PianoKeyInfo {
  noteName: string; // e.g., "C-4"
  isBlack: boolean;
  x: number;
  width: number;
  height: number;
  label: string; // e.g. "C", "C#"
}

export const VirtualPiano: React.FC<VirtualPianoProps> = ({
  pressedKeys,
  baseDisplayOctave = 3,
  numOctavesToDisplay = 3,
  onPianoKeyPress,
}) => {
  const pianoKeys: PianoKeyInfo[] = [];
  let currentX = 0;

  for (let oct = 0; oct < numOctavesToDisplay; oct++) {
    const currentOctave = baseDisplayOctave + oct;
    notesInOctave.forEach((noteBaseName, index) => {
      if (!blackKeyIndices.includes(index)) { // White key
        const noteFullName = `${noteBaseName}${currentOctave}`;
        pianoKeys.push({
          noteName: noteFullName,
          isBlack: false,
          x: currentX,
          width: WHITE_KEY_WIDTH,
          height: WHITE_KEY_HEIGHT,
          label: noteBaseName.replace('-', ''),
        });
        currentX += WHITE_KEY_WIDTH;
      }
    });
  }
  
  // Add black keys relative to white keys
  currentX = 0; // Reset for black key positioning
  for (let oct = 0; oct < numOctavesToDisplay; oct++) {
    const currentOctave = baseDisplayOctave + oct;
    notesInOctave.forEach((noteBaseName, index) => {
      if (!blackKeyIndices.includes(index)) { // White key processed
        if (blackKeyIndices.includes(index + 1) && index + 1 < notesInOctave.length) { // If next is a black key
          const blackNoteName = `${notesInOctave[index+1]}${currentOctave}`;
          pianoKeys.push({
            noteName: blackNoteName,
            isBlack: true,
            x: currentX + WHITE_KEY_WIDTH - (BLACK_KEY_WIDTH / 2) ,
            width: BLACK_KEY_WIDTH,
            height: BLACK_KEY_HEIGHT,
            label: notesInOctave[index+1].replace('-', ''),
          });
        }
        currentX += WHITE_KEY_WIDTH;
      }
    });
  }

  const totalWidth = pianoKeys.filter(k => !k.isBlack).length * WHITE_KEY_WIDTH;

  const handleKeyPress = (noteName: string) => {
    if (onPianoKeyPress) {
      onPianoKeyPress(noteName);
    }
  };

  return (
    <div className="bg-msx-panelbg p-2 rounded border border-msx-border shadow-md relative select-none overflow-x-auto" style={{ width: '100%', height: WHITE_KEY_HEIGHT + 20 }}>
      <div style={{ width: totalWidth, height: WHITE_KEY_HEIGHT, position: 'relative' }}>
        {pianoKeys.map((keyInfo) => {
          const isPressed = pressedKeys.has(keyInfo.noteName);
          const keyStyle: React.CSSProperties = {
            position: 'absolute',
            left: keyInfo.x,
            width: keyInfo.width,
            height: keyInfo.height,
            border: '1px solid var(--msx-border)',
            borderRadius: '0 0 3px 3px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '5px',
            fontSize: '0.6rem',
            userSelect: 'none',
            cursor: onPianoKeyPress ? 'pointer' : 'default',
          };

          if (keyInfo.isBlack) {
            keyStyle.backgroundColor = isPressed ? 'var(--msx-highlight)' : 'var(--msx-black)';
            keyStyle.color = isPressed ? 'var(--msx-black)' : 'var(--msx-white)';
            keyStyle.zIndex = 10;
            keyStyle.borderColor = 'var(--msx-black)';
          } else {
            keyStyle.backgroundColor = isPressed ? 'var(--msx-accent)' : 'var(--msx-white)';
            keyStyle.color = isPressed ? 'var(--msx-white)' : 'var(--msx-black)';
            keyStyle.borderColor = 'var(--msx-border)';
          }

          return (
            <div 
              key={keyInfo.noteName} 
              style={keyStyle} 
              title={keyInfo.noteName}
              onMouseDown={() => handleKeyPress(keyInfo.noteName)} // Use onMouseDown for more immediate feel
              role="button"
              tabIndex={onPianoKeyPress ? 0 : -1}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleKeyPress(keyInfo.noteName);}}
            >
              {!keyInfo.isBlack && keyInfo.label.startsWith('C') && (
                <span className="absolute bottom-1 left-1 text-[0.55rem] opacity-70">
                    {keyInfo.noteName.slice(-1)} {/* Octave number */}
                </span>
               )}
               <span className="opacity-90">{keyInfo.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualPiano;

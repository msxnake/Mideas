
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TrackerSongData, TrackerPattern, TrackerRow, TrackerCell, PT3Instrument, PT3Ornament, PT3ChannelId } from '../../types';
import { Button } from '../common/Button';
import {
    DEFAULT_PT3_ROWS_PER_PATTERN, PT3_CHANNELS,
    PT3_NOTE_NAMES, PT3_MAX_INSTRUMENTS, PT3_MAX_ORNAMENTS, PT3_PIANO_KEY_LAYOUT,
    PT3_KEYBOARD_OCTAVE_MIN_MAX, 
    DEFAULT_PT3_BPM, DEFAULT_PT3_SPEED
} from '../../constants'; 
import { AYSynthesizer } from '../utils/aySynthesizer';
import {
    createEmptyRow, createDefaultTrackerPattern,
    NOTE_REGEX, INSTRUMENT_REGEX, ORNAMENT_REGEX, VOLUME_REGEX,
    createEmptyCell
} from '../utils/trackerUtils';
import { PT3FileOperationsModal } from '../modals/PT3FileOperationsModal';
import { LogModal } from '../modals/LogModal'; // Import the new LogModal

// Import new modular components
import { TrackerHeader } from '../tracker/TrackerHeader';
import { PatternOrderPanel } from '../tracker/PatternOrderPanel';
import { PatternsPanel } from '../tracker/PatternsPanel';
import { InstrumentsPanel } from '../tracker/InstrumentsPanel';
import { OrnamentsPanel } from '../tracker/OrnamentsPanel';
import { TrackerPianoControls } from '../tracker/TrackerPianoControls';
import { PlusCircleIcon } from '../icons/MsxIcons';
import { PatternEditorGrid } from '../tracker/PatternEditorGrid';
import { InstrumentEditorModal } from '../tracker/InstrumentEditorModal';
import { OrnamentEditorModal } from '../tracker/OrnamentEditorModal';
import { Panel } from '../common/Panel';


interface TrackerComposerProps {
  songData: TrackerSongData;
  onUpdate: (data: Partial<TrackerSongData>) => void;
}

interface InstrumentModalBuffer extends Omit<Partial<PT3Instrument>, 'volumeEnvelope' | 'toneEnvelope'> {
    volumeEnvelope?: string;
    toneEnvelope?: string;
}

interface OrnamentModalBuffer extends Omit<Partial<PT3Ornament>, 'data'> {
    data?: string;
}

const createOdeToJoySampleSong = (): TrackerSongData => {
    const pianoInstrument: PT3Instrument = {
        id: 1,
        name: "Piano",
        volumeEnvelope: [127, 90, 60, 0], // Standard decay
        toneEnvelope: [0, 0, 0],
        ayEnvelopeShape: 0, // Fall, then Off
        ayToneEnabled: true,
        ayNoiseEnabled: false,
    };

    const createPatternFromDetailedScore = (
        idSuffix: string,
        name: string,
        melodyQuarterNotes: string[], // Array of 16 quarter notes for melody
        bassQuarterNotes: string[], // Array of 16 quarter notes for bass
        numRowsPerPattern: number = 64
    ): TrackerPattern => {
        const pattern: TrackerPattern = {
            id: `sample_p_${idSuffix}_${Date.now()}`,
            name: name,
            numRows: numRowsPerPattern,
            rows: Array(numRowsPerPattern).fill(null).map(() => createEmptyRow())
        };

        const rowsPerQuarterNote = 4; // At speed 6, this fits 16 quarter notes in 64 rows

        for (let i = 0; i < melodyQuarterNotes.length; i++) {
            const melodyNote = melodyQuarterNotes[i];
            const bassNote = bassQuarterNotes[i] || null; // Use provided bass or null
            const startRow = i * rowsPerQuarterNote;

            if (startRow < numRowsPerPattern) {
                // Melody - Channel A
                pattern.rows[startRow].A = {
                    note: melodyNote,
                    instrument: 1,
                    ornament: null,
                    volume: melodyNote === "===" ? 0 : 15 // Hex F
                };
                // Bass - Channel B
                pattern.rows[startRow].B = {
                    note: bassNote,
                    instrument: 1,
                    ornament: null,
                    volume: bassNote === "===" || bassNote === null ? 0 : 12 // Hex C
                };

                // Fill subsequent rows for sustained notes with "---" (null note)
                for (let r = 1; r < rowsPerQuarterNote; r++) {
                    if (startRow + r < numRowsPerPattern) {
                        pattern.rows[startRow + r].A = { note: null, instrument: null, ornament: null, volume: null };
                        pattern.rows[startRow + r].B = { note: null, instrument: null, ornament: null, volume: null };
                    }
                }
            }
        }
        // Ensure Channel C is silent
        for (let r = 0; r < numRowsPerPattern; r++) {
            pattern.rows[r].C = createEmptyCell();
        }
        return pattern;
    };
    
    // Measures 24-27 from score image
    const melodyP0_score = ["E-4", "E-4", "F#4", "G-4",  "G-4", "F#4", "E-4", "D-4",  "C-4", "C-4", "D-4", "E-4",  "E-4", "D-4", "D-4", "D-4"];
    const bassP0_score   = ["C-3", "C-3", "C-3", "C-3",  "G-2", "G-2", "G-2", "G-2",  "C-3", "C-3", "C-3", "C-3",  "G-2", "G-2", "G-2", "G-2"];

    // Measures 28-31 from score image (assuming a common progression, might differ slightly from user's text example "Patrón 01")
    // User text for P1 was: E E F# G G F# E D C C D E D C C C
    const melodyP1_score = ["E-4", "E-4", "F#4", "G-4",  "G-4", "F#4", "E-4", "D-4",  "C-4", "C-4", "D-4", "E-4",  "D-4", "C-4", "C-4", "C-4"];
    const bassP1_score   = ["C-3", "C-3", "C-3", "C-3",  "G-2", "G-2", "G-2", "G-2",  "C-3", "C-3", "C-3", "C-3",  "C-3", "C-3", "C-3", "C-3"];

    const patterns: TrackerPattern[] = [
        createPatternFromDetailedScore("0", "Ode Pt1 (M24-27)", melodyP0_score, bassP0_score), // Index 0
        createPatternFromDetailedScore("1", "Ode Pt2 (M28-31)", melodyP1_score, bassP1_score), // Index 1
    ];

    const order = [0, 1];

    return {
        id: `sample_song_detailed_${Date.now()}`,
        name: "Ode to Joy (Detailed)",
        title: "Ode to Joy (Measures 24-31)",
        author: "Beethoven / MSX IDE",
        bpm: 97,  // Kept from original
        speed: 6,   // Kept from original (4 rows per quarter note)
        globalVolume: 15,
        patterns: patterns,
        order: order,
        lengthInPatterns: order.length,
        restartPosition: 0,
        instruments: [pianoInstrument],
        ornaments: [],
        currentPatternIndexInOrder: 0,
        currentPatternId: patterns[0].id, // Start with the first pattern
        ayHardwareEnvelopePeriod: 256, // Default value
    };
};


export const TrackerComposer: React.FC<TrackerComposerProps> = ({ songData, onUpdate }) => {
  const [localSongName, setLocalSongName] = useState(songData.name);
  const [localSongTitle, setLocalSongTitle] = useState(songData.title || "");
  const [localSongAuthor, setLocalSongAuthor] = useState(songData.author || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRow, setPlaybackRow] = useState(0);
  
  const [focusedCell, setFocusedCell] = useState<{rowIndex: number, channelId: PT3ChannelId, field: keyof TrackerCell} | null>(null);
  const [synthesizer, setSynthesizer] = useState<AYSynthesizer | null>(null);

  const playbackIntervalRef = useRef<number | null>(null);
  const patternEditorRef = useRef<HTMLDivElement>(null);

  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<PT3Instrument | null>(null);
  const [instrumentModalBuffer, setInstrumentModalBuffer] = useState<InstrumentModalBuffer>({});
  
  const [activeInstrumentId, setActiveInstrumentId] = useState<number | null>(null);

  const [isOrnamentModalOpen, setIsOrnamentModalOpen] = useState(false);
  const [editingOrnament, setEditingOrnament] = useState<PT3Ornament | null>(null);
  const [ornamentModalBuffer, setOrnamentModalBuffer] = useState<OrnamentModalBuffer>({});
  const [activeOrnamentId, setActiveOrnamentId] = useState<number | null>(null); // New state for active ornament

  const [keyboardOctaveOffset, setKeyboardOctaveOffset] = useState(0);
  const [activePianoKeys, setActivePianoKeys] = useState<Set<string>>(new Set());
  const activePianoKeysTimeoutRef = useRef<number | null>(null);
  
  const channelPendingNoteCutRef = useRef<boolean[]>([false, false, false]);

  const [editStepJump, setEditStepJump] = useState<number>(1);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  // State for Log Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const fieldsOrder: (keyof TrackerCell)[] = ['note', 'instrument', 'ornament', 'volume'];

  const addLog = useCallback((message: string) => {
    setLogMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const activePatternIdToUse = useMemo(() => {
    if (songData && songData.patterns && songData.patterns.length > 0) {
        if (songData.currentPatternId && songData.patterns.some(p => p.id === songData.currentPatternId)) {
            return songData.currentPatternId;
        }
        const orderIndex = songData.currentPatternIndexInOrder;
        if (orderIndex >= 0 && orderIndex < songData.order.length) {
            const patternIndexInStorage = songData.order[orderIndex];
            if (patternIndexInStorage >= 0 && patternIndexInStorage < songData.patterns.length) {
                return songData.patterns[patternIndexInStorage].id;
            }
        }
        // Fallback to the first pattern in storage if other checks fail
        if (songData.patterns[0]) {
             return songData.patterns[0].id;
        }
    }
    if (isLogModalOpen) addLog(`Warning: Could not determine activePatternIdToUse. songData.patterns count: ${songData?.patterns?.length}. songData.currentPatternId: ${songData?.currentPatternId}`);
    return ""; 
  }, [songData, isLogModalOpen, addLog]); 

  const currentPattern = useMemo(() => {
    return songData.patterns.find(p => p.id === activePatternIdToUse);
  }, [songData.patterns, activePatternIdToUse]);


  useEffect(() => {
    const synth = new AYSynthesizer(songData.globalVolume / 15);
    synth.setSongData(songData);
    setSynthesizer(synth);
    return () => {
      synth.closeContext();
    };
  }, []); 

  useEffect(() => {
    if (synthesizer) {
        synthesizer.setSongData(songData); 
    }
  }, [songData, synthesizer]);

  useEffect(() => { 
    if (isLogModalOpen && songData.name !== localSongName) addLog(`useEffect: Setting localSongName to '${songData.name}' (was '${localSongName}')`);
    setLocalSongName(songData.name); 
  }, [songData.name, isLogModalOpen, addLog, localSongName]);
  
  useEffect(() => { 
    const currentLocalTitle = localSongTitle;
    const propTitle = songData.title || "";
    if (isLogModalOpen && propTitle !== currentLocalTitle) addLog(`useEffect: Setting localSongTitle to '${propTitle}' (was '${currentLocalTitle}')`);
    setLocalSongTitle(propTitle); 
  }, [songData.title, isLogModalOpen, addLog, localSongTitle]);

  useEffect(() => { 
    const currentLocalAuthor = localSongAuthor;
    const propAuthor = songData.author || "";
    if (isLogModalOpen && propAuthor !== currentLocalAuthor) addLog(`useEffect: Setting localSongAuthor to '${propAuthor}' (was '${currentLocalAuthor}')`);
    setLocalSongAuthor(propAuthor); 
  }, [songData.author, isLogModalOpen, addLog, localSongAuthor]);
  
  useEffect(() => {
    if (songData && songData.id && isLogModalOpen) { 
        addLog(`TrackerComposer received songData prop: ID=${songData.id}, Name='${songData.name}', currentPatternId='${songData.currentPatternId}'`);
        addLog(`Derived activePatternIdToUse: '${activePatternIdToUse}'`);
        addLog(`Derived currentPattern: ID='${currentPattern?.id}', Name='${currentPattern?.name}'`);
        if (currentPattern) {
            addLog(`   currentPattern.numRows: ${currentPattern.numRows}`);
        }
    }
  }, [songData, activePatternIdToUse, currentPattern, isLogModalOpen, addLog]);


  useEffect(() => {
    if (songData.instruments.length > 0) {
      if (activeInstrumentId === null || !songData.instruments.some(instr => instr.id === activeInstrumentId)) {
        setActiveInstrumentId(songData.instruments[0].id);
      }
    } else {
      if (activeInstrumentId !== null) {
        setActiveInstrumentId(null);
      }
    }
  }, [songData.instruments, activeInstrumentId]);

  useEffect(() => {
    if (songData.ornaments.length > 0) {
      if (activeOrnamentId === null || !songData.ornaments.some(orn => orn.id === activeOrnamentId)) {
        setActiveOrnamentId(songData.ornaments[0].id);
      }
    } else {
      if (activeOrnamentId !== null) {
        setActiveOrnamentId(null);
      }
    }
  }, [songData.ornaments, activeOrnamentId]);


  useEffect(() => {
    if (patternEditorRef.current && focusedCell && currentPattern) {
        const cellId = `cell-${focusedCell.rowIndex}-${focusedCell.channelId}-${focusedCell.field}`;
        const cellElement = document.getElementById(cellId) as HTMLInputElement | null;
        if (cellElement) {
            const cellRect = cellElement.getBoundingClientRect();
            const editorRect = patternEditorRef.current.getBoundingClientRect();
            
            const isVerticallyVisible = cellRect.top >= editorRect.top && cellRect.bottom <= editorRect.bottom;
            const isHorizontallyVisible = cellRect.left >= editorRect.left && cellRect.right <= editorRect.right;

            if (!isVerticallyVisible || !isHorizontallyVisible) {
                 cellElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    }
  }, [focusedCell, currentPattern]);

  const handleGlobalDataChange = useCallback((field: 'bpm' | 'speed' | 'globalVolume' | 'lengthInPatterns' | 'restartPosition', value: string | number) => {
    let valToUpdate = parseInt(String(value), 10);
    if (isNaN(valToUpdate)) {
        if (field === 'bpm') valToUpdate = DEFAULT_PT3_BPM;
        else if (field === 'speed') valToUpdate = DEFAULT_PT3_SPEED;
        else if (field === 'globalVolume') valToUpdate = 15;
        else valToUpdate = 0;
    }
    if (field === 'globalVolume') {
        valToUpdate = Math.max(0, Math.min(15, valToUpdate));
        synthesizer?.setMasterVolume(valToUpdate / 15);
    }
    if (field === 'bpm') valToUpdate = Math.max(30, Math.min(300, valToUpdate));
    if (field === 'speed') valToUpdate = Math.max(1, Math.min(31, valToUpdate)); 
    if (field === 'lengthInPatterns') valToUpdate = Math.max(1, Math.min(songData.order.length, valToUpdate));
    if (field === 'restartPosition') valToUpdate = Math.max(0, Math.min(Math.max(0, songData.lengthInPatterns - 1), valToUpdate));

    onUpdate({ [field]: valToUpdate });
  }, [onUpdate, synthesizer, songData.order.length, songData.lengthInPatterns]);

  const handlePatternRowsChange = useCallback((newRowsString: string) => {
    if (!currentPattern) return;
    let num = parseInt(newRowsString, 10);
    if (isNaN(num) || num < 1 || num > 256) {
      alert("Number of rows must be between 1 and 256.");
      return;
    }

    const updatedPatterns = songData.patterns.map(p => {
        if (p.id === currentPattern.id) {
            const newRowsArray = [...p.rows];
            if (num > p.numRows) {
                for (let i = p.numRows; i < num; i++) {
                    newRowsArray.push(createEmptyRow());
                }
            } else {
                newRowsArray.length = num;
            }
            return { ...p, numRows: num, rows: newRowsArray };
        }
        return p;
    });
    onUpdate({ patterns: updatedPatterns });
  }, [currentPattern, songData.patterns, onUpdate]);


  const handleCellChange = useCallback((rowIndex: number, channelId: PT3ChannelId, field: keyof TrackerCell, inputValue: string | number | null) => {
    if (!currentPattern) return;
    let finalValueToStore: string | number | null = null;
    let isValid = false;
    if (inputValue === null || (typeof inputValue === 'string' && inputValue.trim() === "")) {
        finalValueToStore = null;
        isValid = true;
    } else {
        const upperInputValue = typeof inputValue === 'string' ? inputValue.toUpperCase() : String(inputValue);
        switch(field) {
            case 'note':
                if (NOTE_REGEX.test(upperInputValue)) { finalValueToStore = upperInputValue; isValid = true; }
                break;
            case 'instrument':
                if (INSTRUMENT_REGEX.test(String(inputValue))) { finalValueToStore = Number(inputValue); isValid = true; }
                break;
            case 'ornament':
                if (ORNAMENT_REGEX.test(String(inputValue))) { finalValueToStore = Number(inputValue); isValid = true; }
                break;
            case 'volume':
                if (VOLUME_REGEX.test(upperInputValue)) { finalValueToStore = parseInt(upperInputValue, 16); isValid = true; }
                break;
            default:
                const _exhaustiveCheck: never = field; 
                return _exhaustiveCheck;
        }
    }
    if (isValid) {
        const updatedPatterns = songData.patterns.map(p => {
            if (p.id === currentPattern.id) {
                const newRows = p.rows.map((r, rIdx) => {
                    if (rIdx === rowIndex) {
                        const newRow = {...r};
                        const updatedChannelCell = { ...newRow[channelId] };
                        (updatedChannelCell as any)[field] = finalValueToStore;

                        // Auto-apply active instrument/ornament if cell's respective field is null and a new note is entered
                        if (field === 'note' && finalValueToStore && typeof finalValueToStore === 'string' &&
                            finalValueToStore !== "---" && finalValueToStore !== "===") {
                            
                            if (activeInstrumentId !== null && updatedChannelCell.instrument === null) { 
                                updatedChannelCell.instrument = activeInstrumentId;
                            }
                            if (activeOrnamentId !== null && updatedChannelCell.ornament === null) { // New logic for ornament
                                updatedChannelCell.ornament = activeOrnamentId;
                            }
                        }
                        newRow[channelId] = updatedChannelCell;
                        return newRow;
                    }
                    return r;
                });
                return { ...p, rows: newRows };
            }
            return p;
        });
        onUpdate({ patterns: updatedPatterns });
    }
  }, [currentPattern, songData.patterns, onUpdate, activeInstrumentId, activeOrnamentId]); // Added activeOrnamentId

  const handlePlayStop = async () => {
    if (synthesizer) {
      if (isPlaying) {
        synthesizer.stopAllNotes();
        setIsPlaying(false);
        if (playbackIntervalRef.current) clearTimeout(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
        setPlaybackRow(0); 
      } else {
        await synthesizer.ensureAudioContext();
        if (synthesizer['audioContext']?.state === 'running') {
            setIsPlaying(true);
            setPlaybackRow(0); 
            channelPendingNoteCutRef.current = [false, false, false];
        } else {
            console.warn("AudioContext could not be started or resumed. Playback prevented.");
        }
      }
    }
  };
  
  const handleSilenceAllChannels = useCallback(() => {
    if (synthesizer) {
        synthesizer.stopAllNotes();
    }
    if (isPlaying) {
        setIsPlaying(false);
    }
    if (playbackIntervalRef.current) {
        clearTimeout(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
    }
    setPlaybackRow(0);
    channelPendingNoteCutRef.current = [false, false, false];
  }, [synthesizer, isPlaying]);


  useEffect(() => {
    if (isPlaying && currentPattern && synthesizer && synthesizer['audioContext']?.state === 'running') {
        let rowToProcess = playbackRow;
        let patternToProcess = currentPattern;
        let patternIndexInOrderToProcess = songData.currentPatternIndexInOrder;

        const rowData = patternToProcess.rows[rowToProcess];
        if (!rowData) {
            setIsPlaying(false);
            return;
        }
        
        for (let chIdx = 0; chIdx < PT3_CHANNELS.length; chIdx++) {
            if (channelPendingNoteCutRef.current[chIdx]) {
                synthesizer.playNote(chIdx as 0 | 1 | 2, "===", null, null, null);
                channelPendingNoteCutRef.current[chIdx] = false;
            }
        }
        
        PT3_CHANNELS.forEach((chId, chIndex) => {
            const cell = rowData[chId];
            if (cell.note === "===") {
                 channelPendingNoteCutRef.current[chIndex] = true;
            }
            synthesizer.playNote(
                chIndex as 0 | 1 | 2, cell.note, cell.instrument, cell.ornament, cell.volume
            );
        });

        let rowDurationMs = (2500 * songData.speed) / songData.bpm;
        if (songData.bpm === 0 || songData.speed === 0) rowDurationMs = 200;

        if (playbackIntervalRef.current) clearTimeout(playbackIntervalRef.current);
        playbackIntervalRef.current = window.setTimeout(() => {
            setPlaybackRow(prevRow => {
                let nextRow = prevRow + 1;
                let nextPatternOrderIdx = patternIndexInOrderToProcess;

                if (nextRow >= patternToProcess.numRows) {
                    nextRow = 0;
                    nextPatternOrderIdx = patternIndexInOrderToProcess + 1;
                    if (nextPatternOrderIdx >= songData.lengthInPatterns) {
                        nextPatternOrderIdx = songData.restartPosition;
                    }
                }

                if (nextPatternOrderIdx !== patternIndexInOrderToProcess) {
                    const nextPatternIdxInStorage = songData.order[nextPatternOrderIdx];
                    const nextPatternObj = songData.patterns[nextPatternIdxInStorage];
                    onUpdate({ currentPatternIndexInOrder: nextPatternOrderIdx, currentPatternId: nextPatternObj?.id });
                }
                return nextRow;
            });
        }, Math.max(20, rowDurationMs));

    } else {
        if (playbackIntervalRef.current) clearTimeout(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
        if (!isPlaying && synthesizer) { 
             synthesizer.stopAllNotes();
        }
    }
    return () => { if (playbackIntervalRef.current) clearTimeout(playbackIntervalRef.current); };
  }, [isPlaying, playbackRow, songData, synthesizer, onUpdate, currentPattern]);

  const focusCellAndSelectText = useCallback((rIdx: number, chId: PT3ChannelId, fld: keyof TrackerCell) => {
    if (!currentPattern || rIdx < 0 || rIdx >= currentPattern.numRows) return;
    const cellId = `cell-${rIdx}-${chId}-${fld}`;
    const cellElement = document.getElementById(cellId) as HTMLInputElement;
    if (cellElement) {
        cellElement.focus();
        cellElement.select();
        setFocusedCell({ rowIndex: rIdx, channelId: chId, field: fld });
    }
  }, [currentPattern]);

  const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!focusedCell || !currentPattern) return;
    const { rowIndex, channelId, field } = focusedCell;
    const numRows = currentPattern.numRows;
    const channelIndex = PT3_CHANNELS.indexOf(channelId);
    const currentFieldIndex = fieldsOrder.indexOf(field);

    const keyLower = e.key.toLowerCase();
    if (field === 'note' && PT3_PIANO_KEY_LAYOUT[keyLower] && synthesizer) {
        e.preventDefault();
        const layoutEntry = PT3_PIANO_KEY_LAYOUT[keyLower];
        const finalOctave = Math.max(0, Math.min(7, layoutEntry.baseOctave + keyboardOctaveOffset));
        const noteString = `${PT3_NOTE_NAMES[layoutEntry.noteNameIndex]}${finalOctave}`;

        handleCellChange(rowIndex, channelId, 'note', noteString);
        
        const cellData = currentPattern.rows[rowIndex]?.[channelId];
        synthesizer.playNote(
            channelIndex as 0 | 1 | 2, noteString, 
            cellData?.instrument !== null && cellData?.instrument !== undefined ? cellData.instrument : activeInstrumentId, 
            cellData?.ornament !== null && cellData?.ornament !== undefined ? cellData.ornament : activeOrnamentId, // Consider active ornament
            cellData?.volume
        );
        
        setActivePianoKeys(prev => new Set(prev).add(noteString));
        if (activePianoKeysTimeoutRef.current) clearTimeout(activePianoKeysTimeoutRef.current);
        activePianoKeysTimeoutRef.current = window.setTimeout(() => {
            setActivePianoKeys(prev => { const newSet = new Set(prev); newSet.delete(noteString); return newSet; });
        }, 150);

        focusCellAndSelectText(Math.min(numRows - 1, rowIndex + editStepJump), channelId, 'note');
        return;
    }

    switch(e.key) {
        case 'ArrowUp': e.preventDefault(); focusCellAndSelectText(Math.max(0, rowIndex - 1), channelId, field); break;
        case 'ArrowDown': e.preventDefault(); focusCellAndSelectText(Math.min(numRows - 1, rowIndex + 1), channelId, field); break;
        case 'ArrowLeft': e.preventDefault();
            if (currentFieldIndex > 0) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex - 1]);
            else if (channelIndex > 0) focusCellAndSelectText(rowIndex, PT3_CHANNELS[channelIndex - 1], fieldsOrder[fieldsOrder.length - 1]);
            break;
        case 'ArrowRight': e.preventDefault();
            if (currentFieldIndex < fieldsOrder.length - 1) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex + 1]);
            else if (channelIndex < PT3_CHANNELS.length - 1) focusCellAndSelectText(rowIndex, PT3_CHANNELS[channelIndex + 1], fieldsOrder[0]);
            break;
        case 'PageUp': e.preventDefault(); focusCellAndSelectText(Math.max(0, rowIndex - 16), channelId, field); break;
        case 'PageDown': e.preventDefault(); focusCellAndSelectText(Math.min(numRows - 1, rowIndex + 16), channelId, field); break;
        case 'Home': e.preventDefault(); focusCellAndSelectText(0, channelId, field); break;
        case 'End': e.preventDefault(); focusCellAndSelectText(numRows - 1, channelId, field); break;
        case 'Tab': e.preventDefault();
            if (e.shiftKey) {
                if (currentFieldIndex > 0) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex - 1]);
                else if (channelIndex > 0) focusCellAndSelectText(rowIndex, PT3_CHANNELS[channelIndex - 1], fieldsOrder[fieldsOrder.length - 1]);
                else focusCellAndSelectText(Math.max(0, rowIndex - 1), PT3_CHANNELS[PT3_CHANNELS.length -1], fieldsOrder[fieldsOrder.length - 1]);
            } else {
                 if (currentFieldIndex < fieldsOrder.length - 1) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex + 1]);
                 else if (channelIndex < PT3_CHANNELS.length - 1) focusCellAndSelectText(rowIndex, PT3_CHANNELS[channelIndex + 1], fieldsOrder[0]);
                 else focusCellAndSelectText(Math.min(numRows -1, rowIndex + 1), PT3_CHANNELS[0], fieldsOrder[0]);
            }
            break;
        case 'Enter': e.preventDefault();
            const nextRowForEnter = Math.min(numRows - 1, rowIndex + editStepJump);
            const didAdvanceRow = nextRowForEnter > rowIndex && nextRowForEnter < numRows;
            if (field === 'note' && didAdvanceRow) focusCellAndSelectText(nextRowForEnter, channelId, 'note');
            else if (currentFieldIndex < fieldsOrder.length - 1) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex + 1]);
            else if (channelIndex < PT3_CHANNELS.length - 1) focusCellAndSelectText(rowIndex, PT3_CHANNELS[channelIndex + 1], fieldsOrder[0]);
            else if (didAdvanceRow) focusCellAndSelectText(nextRowForEnter, PT3_CHANNELS[0], fieldsOrder[0]);
            break;
        case 'Escape': (e.target as HTMLElement).blur(); setFocusedCell(null); break;
        case 'Delete': case 'Backspace': e.preventDefault(); handleCellChange(rowIndex, channelId, field, null); break;
        default: break;
    }
  }, [focusedCell, currentPattern, PT3_CHANNELS, handleCellChange, focusCellAndSelectText, keyboardOctaveOffset, synthesizer, activeInstrumentId, activeOrnamentId, editStepJump, fieldsOrder, songData.instruments, songData.ornaments]);

  const handleCurrentPatternIndexInOrderChange = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < songData.order.length) {
      const newPatternIndexInStorage = songData.order[newIndex];
      if (newPatternIndexInStorage >= 0 && newPatternIndexInStorage < songData.patterns.length) {
        onUpdate({ currentPatternIndexInOrder: newIndex, currentPatternId: songData.patterns[newPatternIndexInStorage].id });
      }
    }
  }, [songData.order, songData.patterns, onUpdate]);

  const handleOrderListChange = useCallback((orderIndex: number, newPatternArrayIndex: number) => {
    const newOrder = [...songData.order];
    if (newPatternArrayIndex >= 0 && newPatternArrayIndex < songData.patterns.length) {
      newOrder[orderIndex] = newPatternArrayIndex;
      let updatePayload: Partial<TrackerSongData> = { order: newOrder };
      if (orderIndex === songData.currentPatternIndexInOrder) {
        updatePayload.currentPatternId = songData.patterns[newPatternArrayIndex].id;
      }
      onUpdate(updatePayload);
    }
  }, [songData.order, songData.patterns, songData.currentPatternIndexInOrder, onUpdate]);

  const addPatternToOrder = useCallback(() => {
    if (songData.patterns.length === 0) { alert("Please create a pattern first."); return; }
    const newOrder = [...songData.order, 0]; 
    onUpdate({ order: newOrder, lengthInPatterns: newOrder.length });
  }, [songData.order, songData.patterns.length, onUpdate]);

  const removePatternFromOrder = useCallback((orderIndexToRemove: number) => {
    if (songData.order.length <= 1) { alert("Cannot remove the last pattern from the order list."); return; }
    const newOrder = songData.order.filter((_, idx) => idx !== orderIndexToRemove);
    let newCurrentPatternIndexInOrder = songData.currentPatternIndexInOrder;
    if (orderIndexToRemove < songData.currentPatternIndexInOrder || (orderIndexToRemove === songData.currentPatternIndexInOrder && songData.currentPatternIndexInOrder === newOrder.length) ) {
        newCurrentPatternIndexInOrder = Math.max(0, songData.currentPatternIndexInOrder -1);
    }
    
    let newCurrentPatternId = songData.currentPatternId;
    if (newOrder.length > 0 && newCurrentPatternIndexInOrder < newOrder.length) {
        const activePatternIdx = newOrder[newCurrentPatternIndexInOrder];
        if (songData.patterns[activePatternIdx]) {
            newCurrentPatternId = songData.patterns[activePatternIdx].id;
        }
    } else if (newOrder.length > 0 && songData.patterns[newOrder[0]]) {
        newCurrentPatternIndexInOrder = 0;
        newCurrentPatternId = songData.patterns[newOrder[0]].id;
    } else {
        newCurrentPatternId = undefined; 
    }
    onUpdate({ order: newOrder, lengthInPatterns: newOrder.length, currentPatternIndexInOrder: newCurrentPatternIndexInOrder, currentPatternId: newCurrentPatternId });
  }, [songData.order, songData.patterns, songData.currentPatternIndexInOrder, songData.currentPatternId, onUpdate]);

  const handleAddPattern = useCallback(() => {
    const newPatternIdSuffix = `pattern_${Date.now()}`;
    const newPattern = createDefaultTrackerPattern(newPatternIdSuffix);
    const newPatterns = [...songData.patterns, newPattern];
    const newPatternIndexInStorage = newPatterns.length - 1;
    
    onUpdate({
        patterns: newPatterns,
        order: [...songData.order, newPatternIndexInStorage], 
        lengthInPatterns: songData.order.length + 1,
        currentPatternIndexInOrder: songData.order.length, 
        currentPatternId: newPattern.id, 
    });
  }, [songData.patterns, songData.order, onUpdate]);

  const handleDeleteCurrentPattern = useCallback(() => {
    if (songData.patterns.length <= 1) { alert("Cannot delete the last pattern."); return; }
    if (!currentPattern) return;

    const currentPatternArrayIndex = songData.patterns.findIndex(p => p.id === currentPattern.id);
    if (currentPatternArrayIndex === -1) return;

    const newPatterns = songData.patterns.filter(p => p.id !== currentPattern.id);
    const newOrder = songData.order
        .map(orderPatternIndex => {
            if (orderPatternIndex === currentPatternArrayIndex) return -1; 
            return orderPatternIndex > currentPatternArrayIndex ? orderPatternIndex - 1 : orderPatternIndex;
        })
        .filter(orderPatternIndex => orderPatternIndex !== -1);

    let newCurrentPatternIndexInOrder = songData.currentPatternIndexInOrder;
    if (newOrder.length === 0 && newPatterns.length > 0) newOrder.push(0);
    
    if (newCurrentPatternIndexInOrder >= newOrder.length) newCurrentPatternIndexInOrder = Math.max(0, newOrder.length - 1);

    const nextActivePatternId = newPatterns.length > 0
        ? (newOrder.length > 0 && newPatterns[newOrder[newCurrentPatternIndexInOrder]] ? newPatterns[newOrder[newCurrentPatternIndexInOrder]].id : newPatterns[0]?.id)
        : "";
    
    onUpdate({
      patterns: newPatterns,
      order: newOrder.length > 0 ? newOrder : (newPatterns.length > 0 ? [0] : []),
      lengthInPatterns: newOrder.length > 0 ? newOrder.length : (newPatterns.length > 0 ? 1: 0),
      currentPatternIndexInOrder: newCurrentPatternIndexInOrder,
      currentPatternId: nextActivePatternId,
    });
  }, [currentPattern, songData.patterns, songData.order, songData.currentPatternIndexInOrder, onUpdate]);

  const handleInstrumentModalFieldChange = (field: keyof InstrumentModalBuffer, value: any) => {
    setInstrumentModalBuffer(prev => ({ ...prev, [field]: value }));
  };

  const handleInstrumentModalSubmit = useCallback(() => {
    if (!instrumentModalBuffer.id || !instrumentModalBuffer.name) {
      alert("Instrument ID and Name are required.");
      return;
    }
    const newInstrumentData: PT3Instrument = {
      id: instrumentModalBuffer.id,
      name: instrumentModalBuffer.name,
      volumeEnvelope: instrumentModalBuffer.volumeEnvelope?.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n)),
      toneEnvelope: instrumentModalBuffer.toneEnvelope?.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n)),
      volumeLoop: instrumentModalBuffer.volumeLoop,
      toneLoop: instrumentModalBuffer.toneLoop,
      ayEnvelopeShape: instrumentModalBuffer.ayEnvelopeShape,
      ayToneEnabled: instrumentModalBuffer.ayToneEnabled,
      ayNoiseEnabled: instrumentModalBuffer.ayNoiseEnabled,
    };

    let updatedInstruments;
    if (editingInstrument) {
      updatedInstruments = songData.instruments.map(instr => instr.id === editingInstrument.id ? newInstrumentData : instr);
    } else {
      if (songData.instruments.find(i => i.id === newInstrumentData.id)) {
        alert(`Instrument with ID ${newInstrumentData.id} already exists.`);
        return;
      }
      updatedInstruments = [...songData.instruments, newInstrumentData];
    }
    updatedInstruments.sort((a, b) => a.id - b.id);
    onUpdate({ instruments: updatedInstruments });
    setIsInstrumentModalOpen(false);
    setEditingInstrument(null);
  }, [instrumentModalBuffer, editingInstrument, songData.instruments, onUpdate]);


  const handleOrnamentModalFieldChange = (field: keyof OrnamentModalBuffer, value: any) => {
    setOrnamentModalBuffer(prev => ({ ...prev, [field]: value }));
  };

  const handleOrnamentModalSubmit = useCallback(() => {
    if (!ornamentModalBuffer.id || !ornamentModalBuffer.name) {
      alert("Ornament ID and Name are required.");
      return;
    }
    const newOrnamentData: PT3Ornament = {
      id: ornamentModalBuffer.id,
      name: ornamentModalBuffer.name,
      data: ornamentModalBuffer.data?.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n)) || [],
      loopPosition: ornamentModalBuffer.loopPosition,
    };

    let updatedOrnaments;
    if (editingOrnament) {
      updatedOrnaments = songData.ornaments.map(orn => orn.id === editingOrnament.id ? newOrnamentData : orn);
    } else {
      if (songData.ornaments.find(o => o.id === newOrnamentData.id)) {
        alert(`Ornament with ID ${newOrnamentData.id} already exists.`);
        return;
      }
      updatedOrnaments = [...songData.ornaments, newOrnamentData];
    }
    updatedOrnaments.sort((a,b) => a.id - b.id);
    onUpdate({ ornaments: updatedOrnaments });
    setIsOrnamentModalOpen(false);
    setEditingOrnament(null);
  }, [ornamentModalBuffer, editingOrnament, songData.ornaments, onUpdate]);

  const handleVirtualPianoKeyPress = useCallback((noteName: string) => {
    if (focusedCell && currentPattern) {
        synthesizer?.playNote(
            PT3_CHANNELS.indexOf(focusedCell.channelId) as 0 | 1 | 2,
            noteName,
            activeInstrumentId,
            currentPattern.rows[focusedCell.rowIndex][focusedCell.channelId].ornament ?? activeOrnamentId, // Consider active ornament
            currentPattern.rows[focusedCell.rowIndex][focusedCell.channelId].volume ?? 15
        );
        handleCellChange(focusedCell.rowIndex, focusedCell.channelId, 'note', noteName);
        focusCellAndSelectText(
            Math.min(currentPattern.numRows - 1, focusedCell.rowIndex + editStepJump),
            focusedCell.channelId,
            'note'
        );
    }
  }, [focusedCell, synthesizer, currentPattern, handleCellChange, activeInstrumentId, activeOrnamentId, focusCellAndSelectText, editStepJump]);
  
  const handleLoadSongDataFromModal = useCallback((newSongData: TrackerSongData, newName?: string) => {
    onUpdate(newSongData); 
    if (newName) {
        setLocalSongName(newSongData.name || newName); 
        setLocalSongTitle(newSongData.title || "");
        setLocalSongAuthor(newSongData.author || "");
    }
    setFocusedCell(null);
    setIsFileModalOpen(false);
  }, [onUpdate]);

  const handleOpenInstrumentModal = useCallback((instrument: PT3Instrument | null) => {
    if (instrument) {
      setEditingInstrument(instrument);
      setInstrumentModalBuffer({
        ...instrument,
        volumeEnvelope: instrument.volumeEnvelope?.join(','),
        toneEnvelope: instrument.toneEnvelope?.join(','),
      });
    } else {
      const existingIds = songData.instruments.map(i => i.id);
      let newId = 1;
      while (existingIds.includes(newId) && newId <= PT3_MAX_INSTRUMENTS) {
        newId++;
      }
      if (newId > PT3_MAX_INSTRUMENTS) {
        alert(`Cannot add more instruments (max ${PT3_MAX_INSTRUMENTS} reached).`);
        return;
      }
      setEditingInstrument(null);
      setInstrumentModalBuffer({ 
        id: newId,
        name: `Instrument ${newId}`,
        volumeEnvelope: "127,0",
        toneEnvelope: "0",
        volumeLoop: 255,
        toneLoop: 255,
        ayToneEnabled: true,
        ayNoiseEnabled: false,
        ayEnvelopeShape: 0,
      });
    }
    setIsInstrumentModalOpen(true);
  }, [songData.instruments]);

  const handleOpenOrnamentModal = useCallback((ornament: PT3Ornament | null) => {
    if (ornament) {
        setEditingOrnament(ornament);
        setOrnamentModalBuffer({
            ...ornament,
            data: ornament.data?.join(','),
        });
    } else {
        const existingIds = songData.ornaments.map(o => o.id);
        let newId = 1;
        while (existingIds.includes(newId) && newId <= PT3_MAX_ORNAMENTS) {
            newId++;
        }
        if (newId > PT3_MAX_ORNAMENTS) {
            alert(`Cannot add more ornaments (max ${PT3_MAX_ORNAMENTS} reached).`);
            return;
        }
        setEditingOrnament(null);
        setOrnamentModalBuffer({ 
            id: newId,
            name: `Ornament ${newId}`,
            data: "0",
            loopPosition: 255, 
        });
    }
    setIsOrnamentModalOpen(true);
  }, [songData.ornaments]);

  const handleLoadSampleSong = useCallback(() => {
    setLogMessages([]); 
    addLog("Button 'Load Sample Song' clicked.");
    setIsLogModalOpen(true); 

    addLog("Initiating sample song load...");
    addLog("Calling createOdeToJoySampleSong().");
    const sampleSong = createOdeToJoySampleSong();
    addLog(`Sample song data created: ID=${sampleSong.id}, Name=${sampleSong.name}, Patterns=${sampleSong.patterns.length}, Instruments=${sampleSong.instruments.length}, currentPatternId=${sampleSong.currentPatternId}`);
    
    addLog("Calling onUpdate() to update global application state with sample song.");
    onUpdate(sampleSong); 
    addLog("onUpdate() with sample song completed.");

    addLog("Resetting local TrackerComposer UI state (playback, focus).");
    if (isPlaying) {
        setIsPlaying(false); 
    }
    setPlaybackRow(0); 
    setFocusedCell(null); 
    addLog("Sample song loading process finished in TrackerComposer.");

  }, [onUpdate, isPlaying, addLog]);

  const handleSelectPattern = useCallback((id: string) => {
    const patternObject = songData.patterns.find(p => p.id === id);
    if (patternObject) {
        const patternArrayIndex = songData.patterns.indexOf(patternObject);
        const orderIndex = songData.order.findIndex(idx => idx === patternArrayIndex);
        
        setFocusedCell(null); 
        onUpdate({
            currentPatternId: id,
            currentPatternIndexInOrder: (orderIndex !== -1) ? orderIndex : Math.max(0, songData.currentPatternIndexInOrder)
        });
    }
  }, [songData, onUpdate]);


  if (!currentPattern && songData.patterns.length > 0) {
    return <Panel title="Tracker Composer"><p className="p-4">Loading pattern data...</p></Panel>;
  }
  if (songData.patterns.length === 0 || !currentPattern) {
    return (
        <Panel title="Tracker Composer" className="flex-grow flex flex-col items-center justify-center p-4">
            <p className="text-msx-textsecondary mb-4">No patterns in this song yet.</p>
            <Button onClick={handleAddPattern} variant="primary" icon={<PlusCircleIcon/>}>Create First Pattern</Button>
             <Button onClick={() => setIsFileModalOpen(true)} variant="secondary" className="mt-2">File Operations</Button>
             <Button onClick={handleLoadSampleSong} variant="secondary" className="mt-2">Load Sample Song</Button>
        </Panel>
    );
  }

  return (
    <div className="flex-grow flex flex-col bg-msx-bgcolor overflow-hidden h-full">
      <TrackerHeader
        songName={localSongName} onSongNameChange={(name) => { setLocalSongName(name); onUpdate({ name }); }}
        songTitle={localSongTitle} onSongTitleChange={(title) => { setLocalSongTitle(title); onUpdate({ title }); }}
        songAuthor={localSongAuthor} onSongAuthorChange={(author) => { setLocalSongAuthor(author); onUpdate({ author }); }}
        bpm={songData.bpm} onBpmChange={(val) => handleGlobalDataChange('bpm', val)}
        speed={songData.speed} onSpeedChange={(val) => handleGlobalDataChange('speed', val)}
        patternRows={currentPattern?.numRows || DEFAULT_PT3_ROWS_PER_PATTERN}
        onPatternRowsChange={handlePatternRowsChange}
        editStepJump={editStepJump} onEditStepJumpChange={setEditStepJump}
        globalVolume={songData.globalVolume} onGlobalVolumeChange={(val) => handleGlobalDataChange('globalVolume', val)}
        isPlaying={isPlaying} onPlayStop={handlePlayStop}
        onOpenFileOperations={() => setIsFileModalOpen(true)}
        onLoadSampleSong={handleLoadSampleSong} 
        onSilenceAllChannels={handleSilenceAllChannels}
      />

      <div className="flex flex-grow overflow-hidden"> {/* Main content area (scrollable) */}
        <div className="w-60 p-2 border-r border-msx-border flex flex-col space-y-2 overflow-y-auto text-xs flex-shrink-0"> {/* Left panels column */}
          <PatternOrderPanel
            order={songData.order} patterns={songData.patterns}
            currentPatternIndexInOrder={songData.currentPatternIndexInOrder}
            onOrderListChange={handleOrderListChange}
            onCurrentPatternIndexInOrderChange={handleCurrentPatternIndexInOrderChange}
            onAddPatternToOrder={addPatternToOrder} onRemovePatternFromOrder={removePatternFromOrder}
            lengthInPatterns={songData.lengthInPatterns} onLengthInPatternsChange={(val) => handleGlobalDataChange('lengthInPatterns', val)}
            restartPosition={songData.restartPosition} onRestartPositionChange={(val) => handleGlobalDataChange('restartPosition', val)}
          />
          <PatternsPanel
            patterns={songData.patterns} activePatternId={activePatternIdToUse}
            onSetActivePatternId={handleSelectPattern}
            onAddPattern={handleAddPattern} onDeleteCurrentPattern={handleDeleteCurrentPattern}
          />
          <InstrumentsPanel
            instruments={songData.instruments} activeInstrumentId={activeInstrumentId}
            onSetActiveInstrumentId={setActiveInstrumentId} onOpenInstrumentModal={handleOpenInstrumentModal}
          />
          <OrnamentsPanel 
            ornaments={songData.ornaments} 
            activeOrnamentId={activeOrnamentId}
            onSetActiveOrnamentId={setActiveOrnamentId}
            onOpenOrnamentModal={handleOpenOrnamentModal} 
          />
        </div>

        <PatternEditorGrid
            currentPattern={currentPattern} focusedCell={focusedCell}
            isPlaying={isPlaying} playbackRow={playbackRow}
            onCellChange={handleCellChange}
            onCellFocus={(rIdx, chId, fld) => setFocusedCell({rowIndex: rIdx, channelId: chId, field: fld})}
            onGridKeyDown={handleGridKeyDown} patternEditorRef={patternEditorRef}
        />
      </div>

      <div className="flex-shrink-0"> {/* Piano controls, fixed height */}
        <TrackerPianoControls
            pressedKeys={activePianoKeys} keyboardOctaveOffset={keyboardOctaveOffset}
            onPianoKeyPress={handleVirtualPianoKeyPress} onOctaveChange={setKeyboardOctaveOffset}
            minOctave={PT3_KEYBOARD_OCTAVE_MIN_MAX.min} maxOctave={PT3_KEYBOARD_OCTAVE_MIN_MAX.max}
        />
      </div>

      <InstrumentEditorModal
        isOpen={isInstrumentModalOpen} onClose={() => { setIsInstrumentModalOpen(false); setEditingInstrument(null); }}
        editingInstrument={editingInstrument} instrumentModalBuffer={instrumentModalBuffer}
        onInstrumentModalBufferChange={handleInstrumentModalFieldChange} onSubmit={handleInstrumentModalSubmit}
      />
      
      <OrnamentEditorModal
        isOpen={isOrnamentModalOpen} onClose={() => { setIsOrnamentModalOpen(false); setEditingOrnament(null); }}
        editingOrnament={editingOrnament} ornamentModalBuffer={ornamentModalBuffer}
        onOrnamentModalBufferChange={handleOrnamentModalFieldChange} onSubmit={handleOrnamentModalSubmit}
      />

      {isFileModalOpen && (
        <PT3FileOperationsModal
            isOpen={isFileModalOpen} onClose={() => setIsFileModalOpen(false)}
            songData={songData} onLoadSongData={handleLoadSongDataFromModal}
            currentSongName={localSongName}
        />
      )}

      <LogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={logMessages}
      />
    </div>
  );
};

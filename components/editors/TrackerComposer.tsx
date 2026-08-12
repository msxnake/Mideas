
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TrackerSongData, TrackerPattern, TrackerRow, TrackerCell, PT3Instrument, PT3Ornament, PT3ChannelId, SCCInstrument, SCCChannelId, TrackerChannelId } from '../../types';
import { Button } from '../common/Button';
import {
  DEFAULT_PT3_ROWS_PER_PATTERN, PT3_CHANNELS, SCC_CHANNELS,
  PT3_NOTE_NAMES, PT3_MAX_INSTRUMENTS, PT3_MAX_ORNAMENTS, PT3_PIANO_KEY_LAYOUT,
  PT3_KEYBOARD_OCTAVE_MIN_MAX,
  DEFAULT_PT3_BPM, DEFAULT_PT3_SPEED
} from '../../constants';
import { AYRegisterSynthesizer } from '../utils/ayRegisterSynthesizer';
import { SCCSynthesizer } from '../utils/sccSynthesizer';
import { DualChipSynthesizer } from '../utils/dualChipSynthesizer';
import {
  createEmptyRow, createDefaultTrackerPattern,
  NOTE_REGEX, INSTRUMENT_REGEX, ORNAMENT_REGEX, VOLUME_REGEX,
  createEmptyCell, getSongChannels, toDualChipSong, toNativeTrackerSong, channelChip, isSccInstrument
} from '../utils/trackerUtils';
import { LogModal } from '../modals/LogModal'; // Import the new LogModal

// Import new modular components
import { TrackerHeader } from '../tracker/TrackerHeader';
import { PatternOrderPanel } from '../tracker/PatternOrderPanel';
import { PatternsPanel } from '../tracker/PatternsPanel';
import { InstrumentsPanel } from '../tracker/InstrumentsPanel';
import { OrnamentsPanel } from '../tracker/OrnamentsPanel';
import { TrackerPianoControls } from '../tracker/TrackerPianoControls';
import { PsgOscilloscopePanel } from '../tracker/PsgOscilloscopePanel';
import { PlusCircleIcon } from '../icons/MsxIcons';
import { PatternEditorGrid } from '../tracker/PatternEditorGrid';
import { InstrumentEditorModal } from '../tracker/InstrumentEditorModal';
import { OrnamentEditorModal } from '../tracker/OrnamentEditorModal';
import { WaveformEditorModal } from '../tracker/WaveformEditorModal';
import { Panel } from '../common/Panel';
import { createCmajorChiptuneSampleSong } from '../../utils/trackerSampleSong';
import { CowbellPT3Player } from '../utils/cowbellPt3Player';
import { useMidiInput } from '../../utils/useMidiInput';
import { MidiInputPanel, MidiChannelMode, MidiActionId, MidiActionMap } from '../tracker/MidiInputPanel';
import { downloadJsonFile } from '../../utils/downloadUtils';
import { createMusicJsonPackage, normalizeImportedMusic, sanitizeMusicFilename } from '../../utils/trackerMusicJson';
import { locatePT3PlaybackFrame, locatePT3OrderStepFrames, parsePT3Module, parsePT3File } from '../utils/pt3Parser';
import { normalizeImportedPT3Data } from '../utils/trackerUtils';
import { mergePT3Assets } from '../utils/pt3InstrumentImport';
import { mergePT3FactoryKit } from '../../utils/audio/pt3FactoryInstruments';
import {
  applyPT3SourceNoteEntry,
  findPreviousTrackerInstrument,
  patchPT3SourceOrnamentBytes,
  patchPT3SourceSampleBytes,
  resolveTrackerNoteInstrumentEntry,
  rewritePT3PatternNoteStreams,
} from '../utils/pt3SourceEditor';
import {
  getTrackerEffectParameterByteCount,
  normalizeTrackerEffectParams,
  resolveNativeTrackerRowSpeed,
} from '../utils/trackerEffects';

const hasFullPT3Header = (bytes: Uint8Array): boolean => {
  const headerText = new TextDecoder('ascii', { fatal: false }).decode(bytes.slice(0, 20));
  return headerText.startsWith('ProTracker') || headerText.startsWith('Vortex Tracker');
};

const DEMO_PT3_URL = '/samples/pt3/kuvo-forgotten-puppet.pt3';
const DEMO_PT3_FILENAME = 'KUVO - Forgotten puppet (2021).pt3';

/**
 * Value ranges the PT3 stream can actually encode, checked before an edit is
 * serialized in source-faithful mode.
 *
 * The cell inputs are shared with native mode and are deliberately wider (INS
 * and ORN accept two decimal digits), so out-of-range values do reach here.
 * Note that a blank cell is always legal: in PT3 it means "inherit", which is
 * why every message points back at it.
 */
/**
 * Apply one edited field to a PT3 cell, keeping FX and CMD consistent.
 *
 * A PT3 command's parameters are a fixed-width payload, so the serializer
 * refuses a command whose CMD does not have exactly the right number of
 * digits. Editing the two columns one at a time would therefore be impossible:
 * choosing FX while CMD is still blank would be rejected, and so would the
 * reverse. Picking a command resizes CMD to match (keeping the digits already
 * typed when the width is unchanged), and clearing FX clears CMD with it.
 */
const buildPT3CellPatch = (
  field: keyof TrackerCell,
  value: string | number | null,
  currentCell: TrackerCell | undefined,
): Partial<TrackerCell> => {
  if (field !== 'effectCommand') return { [field]: value } as Partial<TrackerCell>;

  // FX 0 is the replayer's NOP and carries no payload; treat it as "no command"
  // so the editor never has to write a 0x00 byte into a channel stream.
  const command = value === null || value === 0 ? null : Number(value) & 0x0f;
  if (command === null) return { effectCommand: null, effectParams: null };

  const requiredDigits = getTrackerEffectParameterByteCount(command) * 2;
  const existing = normalizeTrackerEffectParams(currentCell?.effectParams ?? null) ?? '';
  const params = existing.length === requiredDigits
    ? existing
    : existing.slice(0, requiredDigits).padEnd(requiredDigits, '0');
  return { effectCommand: command, effectParams: params || null };
};

const PT3_SOURCE_FIELD_RANGES = {
  instrument: {
    label: 'INS', min: 1, max: 31, range: '1..31',
    inherits: 'el sample',
    format: (value: number) => String(value),
  },
  ornament: {
    label: 'ORN', min: 0, max: 15, range: '0..15',
    inherits: 'el ornamento',
    format: (value: number) => String(value),
  },
  volume: {
    label: 'VOL', min: 1, max: 15, range: '1..F',
    inherits: 'el volumen',
    // Volume is typed and displayed as a single hex digit, so echo it back that
    // way rather than as the decimal the cell parser produced.
    format: (value: number) => value.toString(16).toUpperCase(),
  },
} as const;


/**
 * Props for the {@link TrackerComposer} component.
 * @category Editors
 */
interface TrackerComposerProps {
  /** The song data object to be edited. */
  songData: TrackerSongData;
  /** Callback function to update the song data. */
  onUpdate: (data: Partial<TrackerSongData> | ((currentSong: TrackerSongData) => Partial<TrackerSongData>)) => void;
  /** Optional: create a NEW track asset with the dual-chip (PSG+SCC) version
   *  of this song, keeping the original untouched. */
  onCreateDualChipCopy?: (dualSong: TrackerSongData) => void;
}

/**
 * A buffer for editing instrument data in a modal.
 * @internal
 */
interface InstrumentModalBuffer extends Omit<Partial<PT3Instrument>, 'volumeEnvelope' | 'toneEnvelope' | 'noiseEnvelope'> {
  volumeEnvelope?: string;
  toneEnvelope?: string;
  noiseEnvelope?: string;
}

/**
 * A buffer for editing ornament data in a modal.
 * @internal
 */
interface OrnamentModalBuffer extends Omit<Partial<PT3Ornament>, 'data'> {
  data?: string;
}

/**
 * Creates a sample song ("Ode to Joy") for demonstration purposes.
 * @returns A complete TrackerSongData object for the sample song.
 * @internal
 */
const createOdeToJoySampleSong = (): TrackerSongData => {
  const instruments: PT3Instrument[] = [
    {
      id: 1,
      name: "Bajo eléctrico (Bass)",
      volumeEnvelope: [0, 50, 100, 127, 110, 100, 80],
      volumeLoop: 3,
      toneEnvelope: [0],
      toneLoop: 255,
      ayToneEnabled: true,
      ayNoiseEnabled: false,
      ayEnvelopeShape: 9,
    },
    {
      id: 2,
      name: "Caja / Snare Drum",
      volumeEnvelope: [127, 116, 96, 72, 50, 30, 14, 0],
      noiseEnvelope: [3, 5, 8, 12, 18, 24, 31],
      volumeLoop: 255,
      noiseLoop: 255,
      toneEnvelope: [7, 4, 2, 0],
      toneLoop: 255,
      ayToneEnabled: true,
      ayNoiseEnabled: true,
      ayEnvelopeShape: 0,
      noiseBaseFrequency: 3,
    },
    {
      id: 3,
      name: "Bombo / Kick Drum",
      volumeEnvelope: [127, 118, 100, 78, 56, 32, 12, 0],
      noiseEnvelope: [2, 4, 7, 12, 20, 31],
      toneEnvelope: [-24, -18, -14, -10, -7, -4, -2, 0],
      volumeLoop: 255,
      noiseLoop: 255,
      toneLoop: 255,
      ayToneEnabled: true,
      ayNoiseEnabled: true,
      ayEnvelopeShape: 0,
      noiseBaseFrequency: 2,
    },
    {
      id: 4,
      name: "Platillo / Hi-Hat",
      volumeEnvelope: [120, 84, 48, 20, 0],
      noiseEnvelope: [1, 1, 2, 4, 8, 16, 31],
      toneEnvelope: [0],
      volumeLoop: 255,
      toneLoop: 255,
      noiseLoop: 255,
      ayToneEnabled: false,
      ayNoiseEnabled: true,
      ayEnvelopeShape: 0,
      noiseBaseFrequency: 1,
    },
    {
      id: 5,
      name: "Lead con vibrato",
      volumeEnvelope: [0, 30, 80, 127, 110, 100, 90],
      volumeLoop: 2,
      toneEnvelope: [0, 1, 2, 1, 0, -1, -2, -1],
      toneLoop: 0,
      ayToneEnabled: true,
      ayNoiseEnabled: false,
      ayEnvelopeShape: 11,
    },
    {
      id: 6,
      name: "Arpegio rápido (Chip Chord)",
      volumeEnvelope: [100, 127, 100, 90, 100, 127, 90, 80],
      volumeLoop: 0,
      toneEnvelope: [0, 4, 7, 12, 7, 4, 0],
      toneLoop: 0,
      ayToneEnabled: true,
      ayNoiseEnabled: false,
      ayEnvelopeShape: 13,
    },
    {
      id: 7,
      name: "Organillo / Pad simple",
      volumeEnvelope: [0, 40, 80, 120, 127, 100, 90, 80, 70, 60],
      volumeLoop: 4,
      toneEnvelope: [0, 0, 1, 1, 0, 0, 1, 1],
      toneLoop: 0,
      ayToneEnabled: true,
      ayNoiseEnabled: false,
      ayEnvelopeShape: 12,
    }
  ];

  const createPatternFromDetailedScore = (
    idSuffix: string,
    name: string,
    melodyQuarterNotes: { note: string, instrument: number }[],
    bassQuarterNotes: { note: string, instrument: number }[],
    percussionQuarterNotes: { note: string, instrument: number }[],
    numRowsPerPattern: number = 64
  ): TrackerPattern => {
    const pattern: TrackerPattern = {
      id: `sample_p_${idSuffix}_${Date.now()}`,
      name: name,
      numRows: numRowsPerPattern,
      rows: Array(numRowsPerPattern).fill(null).map(() => createEmptyRow())
    };

    const rowsPerQuarterNote = 4;

    const placeNotes = (notes: { note: string, instrument: number }[], channel: PT3ChannelId, defaultVolume: number) => {
      for (let i = 0; i < notes.length; i++) {
        const { note, instrument } = notes[i];
        const startRow = i * rowsPerQuarterNote;

        if (startRow < numRowsPerPattern) {
          pattern.rows[startRow][channel] = {
            note: note,
            instrument: instrument,
            ornament: null,
            volume: note === "===" ? 0 : defaultVolume
          };
          for (let r = 1; r < rowsPerQuarterNote; r++) {
            if (startRow + r < numRowsPerPattern) {
              pattern.rows[startRow + r][channel] = createEmptyCell();
            }
          }
        }
      }
    };

    placeNotes(melodyQuarterNotes, 'A', 15);
    placeNotes(bassQuarterNotes, 'B', 12);
    placeNotes(percussionQuarterNotes, 'C', 10);

    return pattern;
  };

  const melodyP0 = [
    { note: "E-4", instrument: 5 }, { note: "E-4", instrument: 5 }, { note: "F#4", instrument: 5 }, { note: "G-4", instrument: 5 },
    { note: "G-4", instrument: 5 }, { note: "F#4", instrument: 5 }, { note: "E-4", instrument: 5 }, { note: "D-4", instrument: 5 },
    { note: "C-4", instrument: 5 }, { note: "C-4", instrument: 5 }, { note: "D-4", instrument: 5 }, { note: "E-4", instrument: 5 },
    { note: "E-4", instrument: 5 }, { note: "D-4", instrument: 5 }, { note: "D-4", instrument: 5 }, { note: "D-4", instrument: 5 }
  ];
  const bassP0 = [
    { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 },
    { note: "G-2", instrument: 1 }, { note: "G-2", instrument: 1 }, { note: "G-2", instrument: 1 }, { note: "G-2", instrument: 1 },
    { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 },
    { note: "G-2", instrument: 1 }, { note: "G-2", instrument: 1 }, { note: "G-2", instrument: 1 }, { note: "G-2", instrument: 1 }
  ];
  const percussionP0 = [
    { note: "C-5", instrument: 3 }, { note: "---", instrument: 0 }, { note: "C-5", instrument: 2 }, { note: "---", instrument: 0 },
    { note: "C-5", instrument: 4 }, { note: "---", instrument: 0 }, { note: "C-5", instrument: 2 }, { note: "---", instrument: 0 },
    { note: "C-5", instrument: 3 }, { note: "---", instrument: 0 }, { note: "C-5", instrument: 2 }, { note: "---", instrument: 0 },
    { note: "C-5", instrument: 4 }, { note: "---", instrument: 0 }, { note: "C-5", instrument: 2 }, { note: "C-5", instrument: 2 }
  ];

  const melodyP1 = [
    { note: "E-4", instrument: 6 }, { note: "E-4", instrument: 6 }, { note: "F#4", instrument: 6 }, { note: "G-4", instrument: 6 },
    { note: "G-4", instrument: 6 }, { note: "F#4", instrument: 6 }, { note: "E-4", instrument: 6 }, { note: "D-4", instrument: 6 },
    { note: "C-4", instrument: 6 }, { note: "C-4", instrument: 6 }, { note: "D-4", instrument: 6 }, { note: "E-4", instrument: 6 },
    { note: "D-4", instrument: 6 }, { note: "C-4", instrument: 6 }, { note: "C-4", instrument: 6 }, { note: "C-4", instrument: 6 }
  ];
  const bassP1 = [
    { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 },
    { note: "G-2", instrument: 1 }, { note: "G-2", instrument: 1 }, { note: "G-2", instrument: 1 }, { note: "G-2", instrument: 1 },
    { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 },
    { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }, { note: "C-3", instrument: 1 }
  ];
  const percussionP1 = [
    { note: "C-5", instrument: 3 }, { note: "---", instrument: 0 }, { note: "C-5", instrument: 2 }, { note: "---", instrument: 0 },
    { note: "C-5", instrument: 4 }, { note: "---", instrument: 0 }, { note: "C-5", instrument: 2 }, { note: "---", instrument: 0 },
    { note: "C-5", instrument: 3 }, { note: "---", instrument: 0 }, { note: "C-5", instrument: 2 }, { note: "---", instrument: 0 },
    { note: "C-5", instrument: 4 }, { note: "C-5", instrument: 2 }, { note: "C-5", instrument: 2 }, { note: "===", instrument: 0 }
  ];

  const patterns: TrackerPattern[] = [
    createPatternFromDetailedScore("0", "Ode Pt1", melodyP0, bassP0, percussionP0),
    createPatternFromDetailedScore("1", "Ode Pt2", melodyP1, bassP1, percussionP1),
  ];

  const order = [0, 1];

  return {
    id: `sample_song_detailed_${Date.now()}`,
    name: "Ode to Joy (MSX1)",
    soundChip: 'PSG',
    title: "Ode to Joy (Multi-Instrument)",
    author: "Beethoven / MSX IDE",
    bpm: 110,
    speed: 6,
    globalVolume: 15,
    patterns: patterns,
    order: order,
    lengthInPatterns: order.length,
    restartPosition: 0,
    instruments: instruments,
    ornaments: [],
    currentPatternIndexInOrder: 0,
    currentPatternId: patterns[0].id,
    ayHardwareEnvelopePeriod: 100,
    ayNoisePeriod: 16,
    playbackBackend: 'native' as const,
    externalPt3Data: undefined,
    externalPt3HasHeader: undefined,
  };
};


/**
 * The main component for the PT3-style music tracker editor.
 * It orchestrates various sub-components for editing patterns, order lists, instruments, and ornaments.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Editors
 */
export const TrackerComposer: React.FC<TrackerComposerProps> = ({ songData, onUpdate, onCreateDualChipCopy }) => {
  const [localSongName, setLocalSongName] = useState(songData.name);
  const [localSongTitle, setLocalSongTitle] = useState(songData.title || "");
  const [localSongAuthor, setLocalSongAuthor] = useState(songData.author || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRow, setPlaybackRow] = useState(0);
  const [mutedChannels, setMutedChannels] = useState<Set<TrackerChannelId>>(new Set());
  const mutedChannelsRef = useRef(mutedChannels);
  mutedChannelsRef.current = mutedChannels;

  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number, channelId: TrackerChannelId, field: keyof TrackerCell } | null>(null);
  // Read from the Cowbell time callback, which lives outside the render scope.
  const focusedCellRef = useRef(focusedCell);
  focusedCellRef.current = focusedCell;

  /**
   * Audition mode: repeat the pattern under the cursor instead of walking the
   * order. Made for dialling in an instrument -- you hear the same bars over
   * and over while editing, without the song running away from you.
   */
  const [loopCurrentPattern, setLoopCurrentPattern] = useState(false);
  const loopCurrentPatternRef = useRef(loopCurrentPattern);
  loopCurrentPatternRef.current = loopCurrentPattern;
  /** Order step being auditioned, latched when the loop is armed. */
  const loopOrderIndexRef = useRef<number | null>(null);
  const [synthesizer, setSynthesizer] = useState<AYRegisterSynthesizer | SCCSynthesizer | DualChipSynthesizer | null>(null);

  const playbackIntervalRef = useRef<number | null>(null);
  // Latches the previous value of isPlaying so the row scheduler can tell a real
  // playing -> stopped transition from one of its many incidental re-runs.
  const wasPlayingRef = useRef(false);
  const nativeRowSpeedRef = useRef(Math.max(1, songData.speed || DEFAULT_PT3_SPEED));
  const patternEditorRef = useRef<HTMLDivElement>(null);
  const externalPt3PlayerRef = useRef<CowbellPT3Player | null>(null);
  const songDataRef = useRef(songData);
  songDataRef.current = songData;
  const lastExternalOrderIndexRef = useRef(songData.currentPatternIndexInOrder);
  /**
   * Set once the user takes charge of which pattern is shown, by picking one
   * from the Patterns list or by focusing a cell. While it is set, the PT3
   * playhead keeps scrolling the row cursor but stops re-selecting the pattern
   * underneath the user -- otherwise a pattern chosen by hand was silently
   * replaced a moment later, and the next note went into whichever pattern the
   * song had reached. Cleared when playback is (re)started.
   */
  const userPickedPatternRef = useRef(false);
  const musicJsonInputRef = useRef<HTMLInputElement>(null);
  const pt3InstrumentInputRef = useRef<HTMLInputElement>(null);
  const pt3MusicInputRef = useRef<HTMLInputElement>(null);
  const [pt3ImportFeedback, setPt3ImportFeedback] = useState<{
    kind: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [externalPt3Status, setExternalPt3Status] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [externalPt3Error, setExternalPt3Error] = useState<string | null>(null);
  /**
   * Report a rejected PT3 edit from inside an onUpdate reducer. Those reducers
   * run during the owning component's render, where a direct setState warns
   * about updating another component mid-render, so defer to a microtask.
   */
  const reportExternalPt3Error = useCallback((message: string) => {
    queueMicrotask(() => setExternalPt3Error(message));
  }, []);
  const [externalPt3CurrentTime, setExternalPt3CurrentTime] = useState(0);
  const [externalPt3Duration, setExternalPt3Duration] = useState<number | null>(null);

  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<PT3Instrument | null>(null);
  const [instrumentModalBuffer, setInstrumentModalBuffer] = useState<InstrumentModalBuffer>({});

  const [isWaveformModalOpen, setIsWaveformModalOpen] = useState(false);
  const [editingSccInstrument, setEditingSccInstrument] = useState<SCCInstrument | null>(null);

  const [activeInstrumentId, setActiveInstrumentId] = useState<number | null>(null);
  const explicitlySelectedInstrumentIdRef = useRef<number | null>(null);
  const handleSelectInstrument = useCallback((instrumentId: number | null) => {
    explicitlySelectedInstrumentIdRef.current = instrumentId;
    setActiveInstrumentId(instrumentId);
  }, []);

  useEffect(() => {
    explicitlySelectedInstrumentIdRef.current = null;
  }, [songData.id]);

  const [isOrnamentModalOpen, setIsOrnamentModalOpen] = useState(false);
  const [editingOrnament, setEditingOrnament] = useState<PT3Ornament | null>(null);
  const [ornamentModalBuffer, setOrnamentModalBuffer] = useState<OrnamentModalBuffer>({});
  const [activeOrnamentId, setActiveOrnamentId] = useState<number | null>(null); // New state for active ornament

  const [keyboardOctaveOffset, setKeyboardOctaveOffset] = useState(0);
  const [activePianoKeys, setActivePianoKeys] = useState<Set<string>>(new Set());
  const [activePianoKeyLevels, setActivePianoKeyLevels] = useState<Map<string, number>>(new Map());
  const activePianoKeysTimeoutRef = useRef<number | null>(null);
  const playbackPianoNotesRef = useRef<(string | null)[]>(Array(PT3_CHANNELS.length).fill(null));
  const playbackPianoLevelsRef = useRef<number[]>(Array(PT3_CHANNELS.length).fill(0));
  const playbackPianoTimeoutsRef = useRef<(number | null)[]>(Array(PT3_CHANNELS.length).fill(null));
  const playbackInstrumentIdsRef = useRef<(number | null)[]>(Array(PT3_CHANNELS.length).fill(null));

  const channelPendingNoteCutRef = useRef<boolean[]>(Array(SCC_CHANNELS.length).fill(false));
  const previewNoteTimeoutsRef = useRef<(number | null)[]>([]);
  const channels = useMemo(
    () => getSongChannels(songData, true),
    [songData.soundChip, songData.sccEnabled]
  );
  const silencePlaybackChannel = useCallback((channelId: TrackerChannelId) => {
    const channelIndex = channels.indexOf(channelId);
    if (channelIndex < 0) return;
    synthesizer?.playNote(channelIndex as any, "===", null, null, null);
    channelPendingNoteCutRef.current[channelIndex] = false;
    if (playbackPianoTimeoutsRef.current[channelIndex]) {
      clearTimeout(playbackPianoTimeoutsRef.current[channelIndex]!);
      playbackPianoTimeoutsRef.current[channelIndex] = null;
    }
    playbackPianoNotesRef.current[channelIndex] = null;
    playbackPianoLevelsRef.current[channelIndex] = 0;
    playbackInstrumentIdsRef.current[channelIndex] = null;
  }, [channels, synthesizer]);

  const handleToggleChannelMute = useCallback((channelId: TrackerChannelId) => {
    setMutedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  }, []);

  const clearPreviewNoteTimeout = useCallback((channelIndex?: number) => {
    if (channelIndex === undefined) {
      previewNoteTimeoutsRef.current.forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId);
      });
      previewNoteTimeoutsRef.current = [];
      return;
    }
    if (previewNoteTimeoutsRef.current[channelIndex]) {
      clearTimeout(previewNoteTimeoutsRef.current[channelIndex]!);
      previewNoteTimeoutsRef.current[channelIndex] = null;
    }
  }, []);

  const publishPianoVisualState = useCallback(() => {
    const levels = new Map<string, number>();
    playbackPianoNotesRef.current.forEach((note, channelIndex) => {
      if (!note) return;
      const level = Math.max(0, Math.min(1, playbackPianoLevelsRef.current[channelIndex] ?? 0));
      if (level <= 0.02) return;
      levels.set(note, Math.max(levels.get(note) ?? 0, level));
    });
    setActivePianoKeys(new Set(levels.keys()));
    setActivePianoKeyLevels(levels);
  }, []);

  const clearPianoHighlights = useCallback(() => {
    if (activePianoKeysTimeoutRef.current) {
      clearTimeout(activePianoKeysTimeoutRef.current);
      activePianoKeysTimeoutRef.current = null;
    }
    playbackPianoTimeoutsRef.current.forEach(timeoutId => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    playbackPianoTimeoutsRef.current = Array(channels.length).fill(null);
    playbackPianoNotesRef.current = Array(channels.length).fill(null);
    playbackPianoLevelsRef.current = Array(channels.length).fill(0);
    playbackInstrumentIdsRef.current = Array(channels.length).fill(null);
    setActivePianoKeys(new Set());
    setActivePianoKeyLevels(new Map());
  }, [channels.length]);

  useEffect(() => {
    setMutedChannels(prev => {
      const next = new Set<TrackerChannelId>();
      channels.forEach(channelId => {
        if (prev.has(channelId)) next.add(channelId);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [channels]);

  useEffect(() => {
    externalPt3PlayerRef.current?.setMutedChannels(mutedChannels);
    mutedChannels.forEach(channelId => silencePlaybackChannel(channelId));
    publishPianoVisualState();
  }, [mutedChannels, silencePlaybackChannel, publishPianoVisualState]);

  const isPlayableNote = useCallback((note: string | null | undefined): note is string => {
    return !!note && note !== '---' && note !== '===';
  }, []);

  const normalizePianoEnvelopeValue = useCallback((value: number, maxValue: number): number => {
    const denominator = maxValue > 15 ? 127 : 15;
    return Math.max(0, Math.min(1, value / denominator));
  }, []);

  const schedulePianoVisualEnvelope = useCallback((channelIndex: number, note: string, instrumentId: number | null, rowDurationMs: number, nextKeeps: boolean) => {
    if (playbackPianoTimeoutsRef.current[channelIndex]) {
      clearTimeout(playbackPianoTimeoutsRef.current[channelIndex]!);
      playbackPianoTimeoutsRef.current[channelIndex] = null;
    }

    const instrument = typeof instrumentId === 'number'
      ? songData.instruments.find(instr => instr.id === instrumentId) as PT3Instrument | undefined
      : undefined;
    const volumeEnvelope = instrument?.volumeEnvelope?.length ? instrument.volumeEnvelope : [15];
    const envelopeMaxValue = Math.max(...volumeEnvelope, 15);
    const hasVolumeLoop = typeof instrument?.volumeLoop === 'number'
      && instrument.volumeLoop >= 0
      && instrument.volumeLoop < volumeEnvelope.length;
    const endsSilent = volumeEnvelope.length > 0 && (volumeEnvelope[volumeEnvelope.length - 1] ?? 0) <= 0;
    const shouldFollowEnvelope = !hasVolumeLoop && endsSilent && volumeEnvelope.length > 1;
    const firstLevel = normalizePianoEnvelopeValue(volumeEnvelope[0] ?? 15, envelopeMaxValue);

    playbackPianoLevelsRef.current[channelIndex] = firstLevel;
    publishPianoVisualState();

    if (!shouldFollowEnvelope) {
      if (nextKeeps) return;

      playbackPianoTimeoutsRef.current[channelIndex] = window.setTimeout(() => {
        if (playbackPianoNotesRef.current[channelIndex] === note) {
          playbackPianoNotesRef.current[channelIndex] = null;
          playbackPianoLevelsRef.current[channelIndex] = 0;
          publishPianoVisualState();
        }
        playbackPianoTimeoutsRef.current[channelIndex] = null;
      }, Math.max(60, rowDurationMs * 0.85));
      return;
    }

    const stepMs = 35;
    let envelopeIndex = 1;
    const tickEnvelope = () => {
      if (playbackPianoNotesRef.current[channelIndex] === note) {
        const level = normalizePianoEnvelopeValue(volumeEnvelope[envelopeIndex] ?? 0, envelopeMaxValue);
        playbackPianoLevelsRef.current[channelIndex] = level;
        if (level <= 0.02 && envelopeIndex >= volumeEnvelope.length - 1) {
          playbackPianoNotesRef.current[channelIndex] = null;
        }
        publishPianoVisualState();

        if (playbackPianoNotesRef.current[channelIndex] === note && envelopeIndex < volumeEnvelope.length - 1) {
          envelopeIndex++;
          playbackPianoTimeoutsRef.current[channelIndex] = window.setTimeout(tickEnvelope, stepMs);
          return;
        }
      }
      playbackPianoTimeoutsRef.current[channelIndex] = null;
    };

    playbackPianoTimeoutsRef.current[channelIndex] = window.setTimeout(tickEnvelope, stepMs);
  }, [normalizePianoEnvelopeValue, publishPianoVisualState, songData.instruments]);

  const schedulePreviewNoteCut = useCallback((channelIndex: number, delayMs: number = 400) => {
    if (!synthesizer || channelIndex < 0) return;
    clearPreviewNoteTimeout(channelIndex);
    const timeoutId = window.setTimeout(() => {
      synthesizer.playNote(channelIndex as any, "===", null, null, null);
      previewNoteTimeoutsRef.current[channelIndex] = null;
    }, delayMs);
    previewNoteTimeoutsRef.current[channelIndex] = timeoutId;
  }, [synthesizer, clearPreviewNoteTimeout]);

  useEffect(() => {
    return () => {
      clearPreviewNoteTimeout();
    };
  }, [clearPreviewNoteTimeout]);

  const [editStepJump, setEditStepJump] = useState<number>(1);

  // State for Log Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const fieldsOrder = useMemo<(keyof TrackerCell)[]>(() => (
    songData.playbackBackend === 'external-pt3'
      ? ['note', 'instrument', 'ornament', 'volume']
      : ['note', 'instrument', 'ornament', 'volume', 'effectCommand', 'effectParams']
  ), [songData.playbackBackend]);

  const addLog = useCallback((message: string) => {
    setLogMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const activePatternIdToUse = useMemo(() => {
    if (songData && songData.patterns && songData.patterns.length > 0) {
      if (songData.currentPatternId && songData.patterns.some(p => p.id === songData.currentPatternId)) {
        return songData.currentPatternId;
      }
      const orderIndex = songData.currentPatternIndexInOrder;
      if (songData.order && orderIndex >= 0 && orderIndex < songData.order.length) {
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

  const activePatternStorageIndex = useMemo(() => {
    // activePatternIdToUse already encodes the right precedence: the explicitly
    // selected pattern first, the order position only as a fallback. Resolving
    // the order FIRST here contradicted it, and a pattern the order never
    // references was then unreachable -- picking one from the Patterns list
    // silently kept the editor, and every edit, on the previously shown
    // pattern. PT3 modules routinely carry patterns outside their order.
    // Playback stays correct because the row scheduler advances id and order
    // index together.
    const idPatternIndex = songData.patterns.findIndex(p => p.id === activePatternIdToUse);
    if (idPatternIndex >= 0) return idPatternIndex;

    const orderedPatternIndex = songData.order?.[songData.currentPatternIndexInOrder];
    if (
      typeof orderedPatternIndex === 'number' &&
      orderedPatternIndex >= 0 &&
      orderedPatternIndex < songData.patterns.length
    ) {
      return orderedPatternIndex;
    }
    return 0;
  }, [songData.currentPatternIndexInOrder, songData.order, songData.patterns, activePatternIdToUse]);

  const currentPattern = useMemo(() => {
    return songData.patterns[activePatternStorageIndex];
  }, [songData.patterns, activePatternStorageIndex]);

  const getResolvedCellValue = useCallback((
    rowIndex: number,
    channelId: TrackerChannelId,
    field: 'instrument' | 'ornament' | 'volume'
  ): number | null => {
    if (!currentPattern || rowIndex < 0) return null;

    for (let scanRow = rowIndex; scanRow >= 0; scanRow--) {
      const cell = currentPattern.rows[scanRow]?.[channelId];
      const value = cell?.[field];
      if (value !== null && value !== undefined) {
        return value as number;
      }
    }

    return null;
  }, [currentPattern]);


  useEffect(() => {
    const synth = songData.soundChip === 'PSG+SCC'
      ? new DualChipSynthesizer(songData.globalVolume / 15)
      : songData.soundChip === 'SCC'
        ? new SCCSynthesizer(songData.globalVolume / 15)
        : new AYRegisterSynthesizer(songData.globalVolume / 15);

    synth.setSongData(songData);
    setSynthesizer(synth);
    return () => {
      synth.closeContext();
    };
  }, [songData.soundChip]);

  useEffect(() => {
    if (synthesizer) {
      synthesizer.setSongData(songData);
    }
  }, [songData, synthesizer]);

  useEffect(() => {
    return () => {
      externalPt3PlayerRef.current?.close();
      externalPt3PlayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    externalPt3PlayerRef.current?.close();
    externalPt3PlayerRef.current = null;
    setExternalPt3Status(songData.playbackBackend === 'external-pt3' && songData.externalPt3Data?.length ? 'ready' : 'idle');
    setExternalPt3Error(null);
    setExternalPt3CurrentTime(0);
    setExternalPt3Duration(null);
    setIsPlaying(false);
  }, [songData.playbackBackend, songData.externalPt3Data]);

  useEffect(() => {
    if (isLogModalOpen) addLog(`useEffect: Setting localSongName to '${songData.name}'`);
    setLocalSongName(songData.name);
  }, [songData.name, isLogModalOpen, addLog]);

  useEffect(() => {
    const propTitle = songData.title || "";
    if (isLogModalOpen) addLog(`useEffect: Setting localSongTitle to '${propTitle}'`);
    setLocalSongTitle(propTitle);
  }, [songData.title, isLogModalOpen, addLog]);

  useEffect(() => {
    const propAuthor = songData.author || "";
    if (isLogModalOpen) addLog(`useEffect: Setting localSongAuthor to '${propAuthor}'`);
    setLocalSongAuthor(propAuthor);
  }, [songData.author, isLogModalOpen, addLog]);

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
    if (songData.instruments && songData.instruments.length > 0) {
      if (activeInstrumentId === null || !songData.instruments.some(instr => instr.id === activeInstrumentId)) {
        explicitlySelectedInstrumentIdRef.current = null;
        setActiveInstrumentId(songData.instruments[0].id);
      }
    } else {
      if (activeInstrumentId !== null) {
        explicitlySelectedInstrumentIdRef.current = null;
        setActiveInstrumentId(null);
      }
    }
  }, [songData.instruments, activeInstrumentId]);

  useEffect(() => {
    if (songData.ornaments && songData.ornaments.length > 0) {
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

  const handleGlobalDataChange = useCallback((field: 'bpm' | 'speed' | 'globalVolume' | 'lengthInPatterns' | 'restartPosition' | 'ayHardwareEnvelopePeriod' | 'ayNoisePeriod', value: string | number) => {
    let valToUpdate = parseInt(String(value), 10);
    if (isNaN(valToUpdate)) {
      if (field === 'bpm') valToUpdate = DEFAULT_PT3_BPM;
      else if (field === 'speed') valToUpdate = DEFAULT_PT3_SPEED;
      else if (field === 'globalVolume') valToUpdate = 15;
      else if (field === 'ayHardwareEnvelopePeriod') valToUpdate = 100;
      else if (field === 'ayNoisePeriod') valToUpdate = 16;
      else valToUpdate = 0;
    }
    if (field === 'globalVolume') {
      valToUpdate = Math.max(0, Math.min(15, valToUpdate));
      synthesizer?.setMasterVolume(valToUpdate / 15);
    }
    if (field === 'bpm') valToUpdate = Math.max(30, Math.min(300, valToUpdate));
    if (field === 'speed') valToUpdate = Math.max(1, Math.min(31, valToUpdate));
    if (field === 'lengthInPatterns') valToUpdate = Math.max(1, Math.min(songData.order?.length || 1, valToUpdate));
    if (field === 'restartPosition') valToUpdate = Math.max(0, Math.min(Math.max(0, songData.lengthInPatterns - 1), valToUpdate));
    if (field === 'ayHardwareEnvelopePeriod') valToUpdate = Math.max(1, Math.min(65535, valToUpdate));
    if (field === 'ayNoisePeriod') valToUpdate = Math.max(0, Math.min(31, valToUpdate));

    if (field === 'speed' && songData.playbackBackend === 'external-pt3' && songData.externalPt3Data?.length) {
      const bytes = new Uint8Array(songData.externalPt3Data);
      if (songData.externalPt3HasHeader && bytes.length > 100) {
        bytes[100] = valToUpdate;
        externalPt3PlayerRef.current?.stop();
        externalPt3PlayerRef.current?.close();
        externalPt3PlayerRef.current = null;
        setIsPlaying(false);
        setExternalPt3CurrentTime(0);
        setExternalPt3Duration(null);
        setExternalPt3Status('ready');
        onUpdate({ speed: valToUpdate, externalPt3Data: Array.from(bytes) });
        return;
      }
    }
    onUpdate({ [field]: valToUpdate });
  }, [onUpdate, synthesizer, songData.order?.length, songData.lengthInPatterns, songData.playbackBackend, songData.externalPt3Data, songData.externalPt3HasHeader]);

  const handlePatternRowsChange = useCallback((newRowsString: string) => {
    if (!currentPattern) return;
    let num = parseInt(newRowsString, 10);
    if (isNaN(num) || num < 1 || num > 256) {
      alert("Number of rows must be between 1 and 256.");
      return;
    }

    onUpdate((currentSong) => {
      const targetPattern = currentSong.patterns[activePatternStorageIndex];
      if (!targetPattern) return {};

      const updatedPatterns = currentSong.patterns.map((p, patternIndex) => {
        if (patternIndex === activePatternStorageIndex) {
        const newRowsArray = [...p.rows];
        if (num > p.numRows) {
          for (let i = p.numRows; i < num; i++) {
            newRowsArray.push(createEmptyRow(channels));
          }
        } else {
          newRowsArray.length = num;
        }
        return { ...p, numRows: num, rows: newRowsArray };
      }
      return p;
      });

      return { patterns: updatedPatterns };
    });
  }, [currentPattern, activePatternStorageIndex, songData.patterns, onUpdate, channels]);


  const handleCellChange = useCallback((rowIndex: number, channelId: TrackerChannelId, field: keyof TrackerCell, inputValue: string | number | null) => {
    if (!currentPattern) return;
    let finalValueToStore: string | number | null = null;
    let isValid = false;
    if (inputValue === null || (typeof inputValue === 'string' && inputValue.trim() === "")) {
      finalValueToStore = null;
      isValid = true;
    } else {
      const upperInputValue = typeof inputValue === 'string' ? inputValue.toUpperCase() : String(inputValue);
      switch (field) {
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
        case 'effectCommand':
          if (/^[0-9A-F]$/.test(upperInputValue)) { finalValueToStore = parseInt(upperInputValue, 16); isValid = true; }
          break;
        case 'effectParams': {
          const normalizedParams = normalizeTrackerEffectParams(upperInputValue);
          if (normalizedParams !== null) { finalValueToStore = normalizedParams; isValid = true; }
          break;
        }
        default:
          const _exhaustiveCheck: never = field;
          return _exhaustiveCheck;
      }
    }
    if (isValid) {
      if (songData.playbackBackend === 'external-pt3') {
        if (channelId !== 'A' && channelId !== 'B' && channelId !== 'C') return;
        // Check the PT3 ranges up front. The cell inputs accept wider values
        // than the format does (INS and ORN take two digits, so 50 or 20 get
        // through), and without this the serializer threw further down and the
        // whole edit was discarded with the reason buried in a caught error.
        const pt3Range = PT3_SOURCE_FIELD_RANGES[field as keyof typeof PT3_SOURCE_FIELD_RANGES];
        if (pt3Range && finalValueToStore !== null) {
          const numericValue = Number(finalValueToStore);
          if (!Number.isFinite(numericValue) || numericValue < pt3Range.min || numericValue > pt3Range.max) {
            setExternalPt3Error(
              `${pt3Range.label} admite ${pt3Range.range} en PT3; recibido ${pt3Range.format(numericValue)}. `
              + `Deja la celda vacía para heredar ${pt3Range.inherits} de la fila anterior.`
            );
            return;
          }
        }

        externalPt3PlayerRef.current?.stop();
        externalPt3PlayerRef.current?.close();
        externalPt3PlayerRef.current = null;
        setIsPlaying(false);
        setExternalPt3CurrentTime(0);
        setExternalPt3Duration(null);
        setExternalPt3Status('ready');
        setExternalPt3Error(null);
        onUpdate((currentSong) => {
          if (!currentSong.externalPt3Data?.length) return {};
          try {
            const activeSourceInstrument = currentSong.instruments.find(instrument =>
              instrument.id === activeInstrumentId && !isSccInstrument(instrument)
            );
            const updatedPatterns = field === 'note'
              ? applyPT3SourceNoteEntry({
                patterns: currentSong.patterns,
                patternIndex: activePatternStorageIndex,
                order: currentSong.order,
                orderIndex: currentSong.currentPatternIndexInOrder,
                rowIndex,
                channel: channelId,
                note: finalValueToStore as string | null,
                activeInstrumentId: activeSourceInstrument?.id ?? null,
                activeInstrumentWasExplicitlySelected:
                  explicitlySelectedInstrumentIdRef.current === activeSourceInstrument?.id,
              })
              : currentSong.patterns.map((pattern, patternIndex) => {
                if (patternIndex !== activePatternStorageIndex) return pattern;
                const rows = pattern.rows.map((row, currentRowIndex) => {
                  if (currentRowIndex !== rowIndex) return row;
                  return {
                    ...row,
                    [channelId]: {
                      ...row[channelId],
                      ...buildPT3CellPatch(field, finalValueToStore, row[channelId]),
                    },
                  };
                });
                return { ...pattern, rows };
              });
            const bytes = rewritePT3PatternNoteStreams(
              new Uint8Array(currentSong.externalPt3Data),
              updatedPatterns,
            );
            const decoded = parsePT3File(bytes.buffer);
            const previousNames = new Map(currentSong.instruments.map(instrument => [instrument.id, instrument.name]));
            const previousOrnamentNames = new Map(currentSong.ornaments.map(ornament => [ornament.id, ornament.name]));
            return {
              ...decoded,
              instruments: decoded.instruments?.map(instrument => ({
                ...instrument,
                name: previousNames.get(instrument.id) || instrument.name,
              })),
              ornaments: decoded.ornaments?.map(ornament => ({
                ...ornament,
                name: previousOrnamentNames.get(ornament.id) || ornament.name,
              })),
              playbackBackend: 'external-pt3',
              externalPt3Data: Array.from(bytes),
              externalPt3HasHeader: currentSong.externalPt3HasHeader,
              externalPt3PlayerId: currentSong.externalPt3PlayerId || 'custom',
            };
          } catch (error) {
            // This reducer runs inside the owning component's render pass, so
            // setting state straight from here warns about updating another
            // component while rendering. Hand the message to a microtask, which
            // lands after the commit.
            reportExternalPt3Error(error instanceof Error ? error.message : String(error));
            return {};
          }
        });
        return;
      }
      onUpdate((currentSong) => {
        const targetPattern = currentSong.patterns[activePatternStorageIndex];
        if (!targetPattern) return {};

        const updatedPatterns = currentSong.patterns.map((p, patternIndex) => {
          if (patternIndex === activePatternStorageIndex) {
          const newRows = p.rows.map((r, rIdx) => {
            if (rIdx === rowIndex) {
              const newRow = { ...r };
              const updatedChannelCell = { ...newRow[channelId] };
              (updatedChannelCell as any)[field] = finalValueToStore;

              // Auto-apply active instrument/ornament if cell's respective field is null and a new note is entered
              if (field === 'note' && finalValueToStore && typeof finalValueToStore === 'string' &&
                finalValueToStore !== "---" && finalValueToStore !== "===") {

                // Explicitly check for null, undefined, or 0
                const targetChip = channelChip(channelId);
                const instrumentMatchesTargetChip = (instrument: PT3Instrument | SCCInstrument) => (
                  targetChip === 'SCC' ? isSccInstrument(instrument) : !isSccInstrument(instrument)
                );
                const activeInstrument = currentSong.instruments.find(instrument => instrument.id === activeInstrumentId);
                const compatibleInstrumentId = activeInstrument && instrumentMatchesTargetChip(activeInstrument)
                  ? activeInstrument.id
                  : currentSong.instruments.find(instrumentMatchesTargetChip)?.id ?? null;
                const previousInstrumentId = findPreviousTrackerInstrument({
                  patterns: currentSong.patterns,
                  patternIndex: activePatternStorageIndex,
                  order: currentSong.order,
                  orderIndex: currentSong.currentPatternIndexInOrder,
                  rowIndex,
                  channel: channelId,
                });
                const previousInstrument = currentSong.instruments.find(
                  instrument => instrument.id === previousInstrumentId,
                );
                const compatiblePreviousInstrumentId = previousInstrument
                  && instrumentMatchesTargetChip(previousInstrument)
                  ? previousInstrument.id
                  : null;
                const instrumentToWrite = resolveTrackerNoteInstrumentEntry(
                  compatiblePreviousInstrumentId,
                  compatibleInstrumentId,
                  explicitlySelectedInstrumentIdRef.current === activeInstrument?.id,
                );

                // Never leave a PSG instrument on an SCC channel (or vice
                // versa). This is especially easy to trigger immediately
                // after converting an imported PT3 song to PSG+SCC.
                if (instrumentToWrite !== null) {
                  updatedChannelCell.instrument = instrumentToWrite;
                }
                if (activeOrnamentId !== null && (updatedChannelCell.ornament === null || updatedChannelCell.ornament === undefined || updatedChannelCell.ornament === 0)) {
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

        return { patterns: updatedPatterns };
      });
    } else if (songData.playbackBackend === 'external-pt3') {
      // The value failed its field regex, so nothing above ran. The cell input
      // keeps what was typed in its own local state, so without a message the
      // field just sits there showing a value the song never accepted -- the
      // edit looks applied and is not. INS and ORN are the usual way in: both
      // take two digits, but only accept 0..31 and 0..15 respectively.
      const range = PT3_SOURCE_FIELD_RANGES[field as keyof typeof PT3_SOURCE_FIELD_RANGES];
      setExternalPt3Error(
        range
          ? `${range.label} admite ${range.range} en PT3; "${inputValue}" no es válido. `
            + `Deja la celda vacía para heredar ${range.inherits} de la fila anterior.`
          : `"${inputValue}" no es un valor válido para este campo.`
      );
    }
  }, [currentPattern, activePatternStorageIndex, songData.patterns, songData.playbackBackend, onUpdate, activeInstrumentId, activeOrnamentId, reportExternalPt3Error]);

  // Clear every cell of one channel in the CURRENTLY EDITED pattern (undoable
  // with Ctrl+Z). Also cuts any live preview voice on that channel.
  const handleClearChannel = useCallback((channelId: TrackerChannelId) => {
    onUpdate((currentSong) => {
      const targetPattern = currentSong.patterns[activePatternStorageIndex];
      if (!targetPattern) return {};
      const updatedPatterns = currentSong.patterns.map((p, patternIndex) => {
        if (patternIndex !== activePatternStorageIndex) return p;
        const newRows = p.rows.map((r) => ({ ...r, [channelId]: createEmptyCell() }));
        return { ...p, rows: newRows };
      });
      return { patterns: updatedPatterns };
    });
    const channelIndex = channels.indexOf(channelId);
    if (channelIndex >= 0 && synthesizer) {
      void synthesizer.playNote(channelIndex as any, '===', null, null, null);
    }
  }, [onUpdate, activePatternStorageIndex, channels, synthesizer]);

  const ensureExternalPt3Player = useCallback(async (): Promise<CowbellPT3Player | null> => {
    if (!songData.externalPt3Data?.length) {
      setExternalPt3Error('No PT3 data loaded.');
      setExternalPt3Status('error');
      return null;
    }
    const bytes = new Uint8Array(songData.externalPt3Data);
    if (!songData.externalPt3HasHeader || !hasFullPT3Header(bytes)) {
      setExternalPt3Error('This file was imported as headerless PT3 data. Reimport the original .pt3 file with its ProTracker/Vortex Tracker header before playback.');
      setExternalPt3Status('error');
      return null;
    }

    if (!externalPt3PlayerRef.current) {
      externalPt3PlayerRef.current = new CowbellPT3Player(bytes, {
        onPlay: () => {
          setIsPlaying(true);
          setExternalPt3Status('ready');
        },
        onPause: () => setIsPlaying(false),
        onEnded: () => {
          setIsPlaying(false);
          setExternalPt3CurrentTime(0);
        },
        onLoadedMetadata: (duration) => setExternalPt3Duration(duration),
        onTimeUpdate: (currentTime, duration) => {
          setExternalPt3CurrentTime(currentTime);
          setExternalPt3Duration(duration);
          const liveSong = songDataRef.current;
          const cursor = locatePT3PlaybackFrame(liveSong, Math.floor(currentTime * 50));

          // Pattern audition: as soon as the playhead leaves the latched order
          // step, jump back to its first frame. Seeking rather than restarting
          // keeps the replayer's channel state, which is what makes an
          // instrument tweak audible on the very next repeat.
          if (cursor && loopCurrentPatternRef.current && loopOrderIndexRef.current !== null
              && cursor.orderIndex !== loopOrderIndexRef.current) {
            const span = locatePT3OrderStepFrames(liveSong, loopOrderIndexRef.current);
            if (span) {
              externalPt3PlayerRef.current?.seek(span.startFrame / 50);
              return;
            }
          }

          if (cursor) {
            setPlaybackRow(cursor.row);
            const pattern = liveSong.patterns[cursor.patternIndex];
            // Source-faithful Cowbell playback does not pass through the
            // native row scheduler, so mirror its current notes explicitly on
            // the piano. PT3 blank fields inherit the previous note exactly as
            // they do in the source pattern.
            (['A', 'B', 'C'] as const).forEach((channelId, channelIndex) => {
              if (mutedChannelsRef.current.has(channelId)) {
                playbackPianoNotesRef.current[channelIndex] = null;
                playbackPianoLevelsRef.current[channelIndex] = 0;
                return;
              }
              let note: string | null = null;
              if (pattern) {
                for (let rowIndex = Math.min(cursor.row, pattern.numRows - 1); rowIndex >= 0; rowIndex -= 1) {
                  const candidate = pattern.rows[rowIndex]?.[channelId]?.note;
                  if (candidate === '===') { note = null; break; }
                  if (candidate && candidate !== '---') { note = candidate; break; }
                }
              }
              playbackPianoNotesRef.current[channelIndex] = isPlayableNote(note) ? note : null;
              playbackPianoLevelsRef.current[channelIndex] = note ? 1 : 0;
            });
            publishPianoVisualState();
            // Follow the playhead across the order so the grid scrolls with the
            // song -- but NEVER while a cell has focus. This sync moves the
            // pattern that edits are written to, so letting it run mid-edit
            // sent the note to whatever pattern happened to be playing instead
            // of the one being edited: notes typed while the song played piled
            // up in the wrong pattern, and re-selecting a pattern by hand was
            // immediately undone by the next callback.
            if (
              cursor.orderIndex !== lastExternalOrderIndexRef.current
              && !focusedCellRef.current
              && !userPickedPatternRef.current
            ) {
              lastExternalOrderIndexRef.current = cursor.orderIndex;
              onUpdate({
                currentPatternIndexInOrder: cursor.orderIndex,
                currentPatternId: pattern?.id,
              });
            }
          }
        },
      });
      externalPt3PlayerRef.current.setMutedChannels(mutedChannelsRef.current);
    }

    return externalPt3PlayerRef.current;
  }, [songData.externalPt3Data, onUpdate, isPlayableNote, publishPianoVisualState]);

  const handleExternalPt3PlayStop = useCallback(async () => {
    if (isPlaying) {
      externalPt3PlayerRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    setExternalPt3Status('loading');
    setExternalPt3Error(null);
    // Pressing Play hands the pattern view back to the song -- unless we are
    // auditioning one pattern, where the whole point is that it stays put.
    userPickedPatternRef.current = loopCurrentPatternRef.current;
    try {
      const player = await ensureExternalPt3Player();
      if (!player) return;
      if (loopCurrentPatternRef.current) {
        const orderIndex = songDataRef.current.currentPatternIndexInOrder;
        loopOrderIndexRef.current = orderIndex;
        const span = locatePT3OrderStepFrames(songDataRef.current, orderIndex);
        if (span) player.seek(span.startFrame / 50);
      }
      await player.play();
      setExternalPt3Status('ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start PT3 playback.';
      setExternalPt3Error(message);
      setExternalPt3Status('error');
      setIsPlaying(false);
      externalPt3PlayerRef.current?.close();
      externalPt3PlayerRef.current = null;
    }
  }, [ensureExternalPt3Player, isPlaying]);

  const handleExternalPt3Stop = useCallback(() => {
    externalPt3PlayerRef.current?.stop();
    setIsPlaying(false);
    setExternalPt3CurrentTime(0);
    setPlaybackRow(0);
    lastExternalOrderIndexRef.current = 0;
    const firstPatternIndex = songDataRef.current.order?.[0];
    onUpdate({
      currentPatternIndexInOrder: 0,
      currentPatternId: typeof firstPatternIndex === 'number' ? songDataRef.current.patterns[firstPatternIndex]?.id : undefined,
    });
  }, [onUpdate]);

  const handleExternalPt3Seek = useCallback((value: string) => {
    const nextTime = Number(value);
    if (!Number.isFinite(nextTime)) return;
    externalPt3PlayerRef.current?.seek(nextTime);
    setExternalPt3CurrentTime(nextTime);
  }, []);

  // Stop playback. When `resetRow` is true (Stop) the playhead returns to row 0;
  // when false (Pause) the current row is kept so playback can resume in place.
  const stopPlayback = useCallback((resetRow: boolean) => {
    if (synthesizer) synthesizer.stopAllNotes();
    setIsPlaying(false);
    if (playbackIntervalRef.current) clearTimeout(playbackIntervalRef.current);
    playbackIntervalRef.current = null;
    if (resetRow) setPlaybackRow(0);
    if (resetRow) nativeRowSpeedRef.current = Math.max(1, songData.speed || DEFAULT_PT3_SPEED);
    channelPendingNoteCutRef.current = Array(channels.length).fill(false);
    clearPreviewNoteTimeout();
    clearPianoHighlights();
  }, [synthesizer, channels.length, clearPreviewNoteTimeout, clearPianoHighlights, songData.speed]);

  // Start playback. `resetRow` true starts from row 0 (Play); false resumes from
  // the current playhead (Resume after Pause).
  const startPlayback = useCallback(async (resetRow: boolean) => {
    if (!synthesizer) return;
    synthesizer.stopAllNotes();
    await synthesizer.ensureAudioContext();
    if (synthesizer['audioContext']?.state === 'running') {
      clearPreviewNoteTimeout();
      clearPianoHighlights();
      setIsPlaying(true);
      if (resetRow) {
        setPlaybackRow(0);
        nativeRowSpeedRef.current = Math.max(1, songData.speed || DEFAULT_PT3_SPEED);
      }
      channelPendingNoteCutRef.current = Array(channels.length).fill(false);
    } else {
      console.warn("AudioContext could not be started or resumed. Playback prevented.");
    }
  }, [synthesizer, channels.length, clearPreviewNoteTimeout, clearPianoHighlights, songData.speed]);

  const handlePlayStop = useCallback(async () => {
    if (songData.playbackBackend === 'external-pt3') {
      await handleExternalPt3PlayStop();
      return;
    }
    if (isPlaying) stopPlayback(true);
    else await startPlayback(true);
  }, [songData.playbackBackend, handleExternalPt3PlayStop, isPlaying, startPlayback, stopPlayback]);

  // Pause/resume toggle: unlike Play/Stop it preserves the playhead position.
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) stopPlayback(false);
    else await startPlayback(false);
  }, [isPlaying, startPlayback, stopPlayback]);

  /**
   * Toggle single-pattern audition. Arming it mid-playback latches whichever
   * pattern is selected right now and jumps there, so you can pick a pattern,
   * hit this, and keep tweaking an instrument against the same bars.
   */
  const handleToggleLoopPattern = useCallback(() => {
    setLoopCurrentPattern(previous => {
      const next = !previous;
      loopCurrentPatternRef.current = next;
      if (!next) {
        loopOrderIndexRef.current = null;
        // Hand the pattern view back to the playhead, otherwise disarming the
        // loop left the grid frozen on the audited pattern while the song
        // carried on underneath it.
        userPickedPatternRef.current = false;
        lastExternalOrderIndexRef.current = -1;
        return next;
      }
      const orderIndex = songDataRef.current.currentPatternIndexInOrder;
      loopOrderIndexRef.current = orderIndex;
      userPickedPatternRef.current = true;
      if (songDataRef.current.playbackBackend === 'external-pt3' && externalPt3PlayerRef.current) {
        const span = locatePT3OrderStepFrames(songDataRef.current, orderIndex);
        if (span) externalPt3PlayerRef.current.seek(span.startFrame / 50);
      }
      return next;
    });
  }, []);

  const handleSilenceAllChannels = useCallback(() => {
    if (songData.playbackBackend === 'external-pt3') {
      externalPt3PlayerRef.current?.stop();
      setExternalPt3CurrentTime(0);
    }
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
    nativeRowSpeedRef.current = Math.max(1, songData.speed || DEFAULT_PT3_SPEED);
    channelPendingNoteCutRef.current = Array(channels.length).fill(false);
    clearPreviewNoteTimeout();
    clearPianoHighlights();
  }, [songData.playbackBackend, songData.speed, synthesizer, isPlaying, channels, clearPreviewNoteTimeout, clearPianoHighlights]);


  useEffect(() => {
    // The scheduler and the synth must agree on this flag: while it is true the
    // synth defers PT3 sample commands to its own 50Hz clock (replayer
    // fidelity), while it is false it flushes them on arrival so previewed
    // notes are heard at once. Deriving both from one expression keeps the two
    // from drifting apart -- Pause on an external-PT3 song, for instance, sets
    // isPlaying without ever starting this scheduler.
    const rowSchedulerActive = songData.playbackBackend !== 'external-pt3'
      && isPlaying
      && !!currentPattern
      && !!synthesizer
      && synthesizer['audioContext']?.state === 'running';
    (synthesizer as { setRowPlaybackActive?: (active: boolean) => void } | null)
      ?.setRowPlaybackActive?.(rowSchedulerActive);

    if (rowSchedulerActive && currentPattern && synthesizer) {
      let rowToProcess = playbackRow;
      let patternToProcess = currentPattern;
      let patternIndexInOrderToProcess = songData.currentPatternIndexInOrder;

      const rowData = patternToProcess.rows[rowToProcess];
      if (!rowData) {
        setIsPlaying(false);
        return;
      }

      const rowSpeed = resolveNativeTrackerRowSpeed(
        channels.map(channelId => rowData[channelId] ?? createEmptyCell()),
        nativeRowSpeedRef.current,
      );
      nativeRowSpeedRef.current = rowSpeed;
      let rowDurationMs = (2500 * rowSpeed) / songData.bpm;
      if (songData.bpm === 0 || rowSpeed === 0) rowDurationMs = 200;

      const nextPatternIndexInOrder = (rowToProcess + 1) >= patternToProcess.numRows
        ? ((patternIndexInOrderToProcess + 1) >= songData.lengthInPatterns ? songData.restartPosition : (patternIndexInOrderToProcess + 1))
        : patternIndexInOrderToProcess;
      const nextPatternStorageIndex = songData.order?.[nextPatternIndexInOrder];
      const nextPatternObj = songData.patterns[nextPatternStorageIndex ?? patternIndexInOrderToProcess];
      const nextRowIndex = (rowToProcess + 1) >= patternToProcess.numRows ? 0 : (rowToProcess + 1);
      const nextRowData = nextPatternObj?.rows?.[nextRowIndex];

      for (let chIdx = 0; chIdx < channels.length; chIdx++) {
        if (channelPendingNoteCutRef.current[chIdx]) {
          synthesizer.playNote(chIdx as any, "===", null, null, null);
          if (playbackPianoTimeoutsRef.current[chIdx]) {
            clearTimeout(playbackPianoTimeoutsRef.current[chIdx]!);
            playbackPianoTimeoutsRef.current[chIdx] = null;
          }
          playbackPianoNotesRef.current[chIdx] = null;
          playbackPianoLevelsRef.current[chIdx] = 0;
          playbackInstrumentIdsRef.current[chIdx] = null;
          channelPendingNoteCutRef.current[chIdx] = false;
        }
      }

      channels.forEach((chId, chIndex) => {
        if (mutedChannels.has(chId)) {
          synthesizer.playNote(chIndex as any, "===", null, null, null);
          if (playbackPianoTimeoutsRef.current[chIndex]) {
            clearTimeout(playbackPianoTimeoutsRef.current[chIndex]!);
            playbackPianoTimeoutsRef.current[chIndex] = null;
          }
          playbackPianoNotesRef.current[chIndex] = null;
          playbackPianoLevelsRef.current[chIndex] = 0;
          playbackInstrumentIdsRef.current[chIndex] = null;
          channelPendingNoteCutRef.current[chIndex] = false;
          return;
        }
        const cell = rowData[chId] || { note: "---", instrument: null, ornament: null, volume: null };
        const nextCell = nextRowData ? (nextRowData[chId] || { note: "---" }) : { note: "---" };
        const nextKeeps = !nextCell.note || nextCell.note === '---';
        if (typeof cell.instrument === 'number' && cell.instrument > 0) {
          playbackInstrumentIdsRef.current[chIndex] = cell.instrument;
        }
        if (cell.note === "===") {
          channelPendingNoteCutRef.current[chIndex] = true;
          if (playbackPianoTimeoutsRef.current[chIndex]) {
            clearTimeout(playbackPianoTimeoutsRef.current[chIndex]!);
            playbackPianoTimeoutsRef.current[chIndex] = null;
          }
          playbackPianoNotesRef.current[chIndex] = null;
          playbackPianoLevelsRef.current[chIndex] = 0;
        } else if (isPlayableNote(cell.note)) {
          const instrumentIdForVisual = (typeof cell.instrument === 'number' && cell.instrument > 0)
            ? cell.instrument
            : playbackInstrumentIdsRef.current[chIndex];
          playbackPianoNotesRef.current[chIndex] = cell.note;
          schedulePianoVisualEnvelope(
            chIndex,
            cell.note,
            instrumentIdForVisual,
            rowDurationMs,
            nextKeeps
          );
          if (!nextKeeps) {
            channelPendingNoteCutRef.current[chIndex] = true;
          }
        }
        synthesizer.playNote(
          chIndex as any, cell.note, cell.instrument, cell.ornament, cell.volume,
          cell.effectCommand ?? null, cell.effectParams ?? null,
        );
      });
      publishPianoVisualState();

      if (playbackIntervalRef.current) clearTimeout(playbackIntervalRef.current);
      playbackIntervalRef.current = window.setTimeout(() => {
        setPlaybackRow(prevRow => {
          let nextRow = prevRow + 1;
          let nextPatternOrderIdx = patternIndexInOrderToProcess;

          if (nextRow >= patternToProcess.numRows) {
            nextRow = 0;
            // Auditioning one pattern: wrap to its own row 0 instead of
            // stepping through the order.
            if (!loopCurrentPatternRef.current) {
              nextPatternOrderIdx = patternIndexInOrderToProcess + 1;
              if (nextPatternOrderIdx >= songData.lengthInPatterns) {
                nextPatternOrderIdx = songData.restartPosition;
              }
            }
          }

          if (nextPatternOrderIdx !== patternIndexInOrderToProcess) {
            const nextPatternIdxInStorage = songData.order?.[nextPatternOrderIdx];
            const nextPatternObj = songData.patterns[nextPatternIdxInStorage];
            onUpdate({ currentPatternIndexInOrder: nextPatternOrderIdx, currentPatternId: nextPatternObj?.id });
          }
          return nextRow;
        });
      }, Math.max(20, rowDurationMs));

    } else {
      if (playbackIntervalRef.current) clearTimeout(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
      // Tear the voices down only on the real playing -> stopped transition.
      // This effect also re-runs on re-renders that have nothing to do with
      // playback (songData and the inline onUpdate change identity constantly),
      // and stopAllNotes() resets the PT3 driver state: it used to wipe the
      // preview command handleCellChange had queued a moment earlier, which is
      // why typing a note over an imported PT3 song made no sound at all.
      if (!isPlaying && wasPlayingRef.current && synthesizer) {
        synthesizer.stopAllNotes();
        channelPendingNoteCutRef.current = Array(channels.length).fill(false);
        clearPreviewNoteTimeout();
        clearPianoHighlights();
      }
    }
    wasPlayingRef.current = isPlaying;
    return () => { if (playbackIntervalRef.current) clearTimeout(playbackIntervalRef.current); };
  }, [isPlaying, playbackRow, songData, synthesizer, onUpdate, currentPattern, channels, mutedChannels, clearPreviewNoteTimeout, clearPianoHighlights, isPlayableNote, schedulePianoVisualEnvelope, publishPianoVisualState]);

  const focusCellAndSelectText = useCallback((rIdx: number, chId: TrackerChannelId, fld: keyof TrackerCell) => {
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
    const channelIndex = channels.indexOf(channelId);
    const currentFieldIndex = fieldsOrder.indexOf(field);

    const keyLower = e.key.toLowerCase();
    if (field === 'note' && PT3_PIANO_KEY_LAYOUT[keyLower] && synthesizer) {
      e.preventDefault();
      const layoutEntry = PT3_PIANO_KEY_LAYOUT[keyLower];
      const finalOctave = Math.max(0, Math.min(7, layoutEntry.baseOctave + keyboardOctaveOffset));
      const noteString = `${PT3_NOTE_NAMES[layoutEntry.noteNameIndex]}${finalOctave}`;
      const resolvedInstrumentId = getResolvedCellValue(rowIndex, channelId, 'instrument');
      const resolvedOrnamentId = getResolvedCellValue(rowIndex, channelId, 'ornament');
      const resolvedVolume = currentPattern.rows[rowIndex]?.[channelId]?.volume ?? null;

      handleCellChange(rowIndex, channelId, 'note', noteString);

      if (!mutedChannels.has(channelId)) {
        synthesizer.playNote(
          channelIndex as any, noteString,
          resolvedInstrumentId !== null ? resolvedInstrumentId : activeInstrumentId,
          resolvedOrnamentId !== null ? resolvedOrnamentId : activeOrnamentId,
          resolvedVolume
        );
        schedulePreviewNoteCut(channelIndex);
      }

      setActivePianoKeys(prev => new Set(prev).add(noteString));
      setActivePianoKeyLevels(prev => {
        const next = new Map(prev);
        next.set(noteString, 1);
        return next;
      });
      if (activePianoKeysTimeoutRef.current) clearTimeout(activePianoKeysTimeoutRef.current);
      activePianoKeysTimeoutRef.current = window.setTimeout(() => {
        setActivePianoKeys(prev => { const newSet = new Set(prev); newSet.delete(noteString); return newSet; });
        setActivePianoKeyLevels(prev => { const next = new Map(prev); next.delete(noteString); return next; });
      }, 150);

      focusCellAndSelectText(Math.min(numRows - 1, rowIndex + editStepJump), channelId, 'note');
      return;
    }

    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); focusCellAndSelectText(Math.max(0, rowIndex - 1), channelId, field); break;
      case 'ArrowDown': e.preventDefault(); focusCellAndSelectText(Math.min(numRows - 1, rowIndex + 1), channelId, field); break;
      case 'ArrowLeft': e.preventDefault();
        if (currentFieldIndex > 0) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex - 1]);
        else if (channelIndex > 0) focusCellAndSelectText(rowIndex, channels[channelIndex - 1], fieldsOrder[fieldsOrder.length - 1]);
        break;
      case 'ArrowRight': e.preventDefault();
        if (currentFieldIndex < fieldsOrder.length - 1) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex + 1]);
        else if (channelIndex < channels.length - 1) focusCellAndSelectText(rowIndex, channels[channelIndex + 1], fieldsOrder[0]);
        break;
      case 'PageUp': e.preventDefault(); focusCellAndSelectText(Math.max(0, rowIndex - 16), channelId, field); break;
      case 'PageDown': e.preventDefault(); focusCellAndSelectText(Math.min(numRows - 1, rowIndex + 16), channelId, field); break;
      case 'Home': e.preventDefault(); focusCellAndSelectText(0, channelId, field); break;
      case 'End': e.preventDefault(); focusCellAndSelectText(numRows - 1, channelId, field); break;
      case 'Tab': e.preventDefault();
        if (e.shiftKey) {
          if (currentFieldIndex > 0) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex - 1]);
          else if (channelIndex > 0) focusCellAndSelectText(rowIndex, channels[channelIndex - 1], fieldsOrder[fieldsOrder.length - 1]);
          else focusCellAndSelectText(Math.max(0, rowIndex - 1), channels[channels.length - 1], fieldsOrder[fieldsOrder.length - 1]);
        } else {
          if (currentFieldIndex < fieldsOrder.length - 1) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex + 1]);
          else if (channelIndex < channels.length - 1) focusCellAndSelectText(rowIndex, channels[channelIndex + 1], fieldsOrder[0]);
          else focusCellAndSelectText(Math.min(numRows - 1, rowIndex + 1), channels[0], fieldsOrder[0]);
        }
        break;
      case 'Enter': e.preventDefault();
        const nextRowForEnter = Math.min(numRows - 1, rowIndex + editStepJump);
        const didAdvanceRow = nextRowForEnter > rowIndex && nextRowForEnter < numRows;
        if (field === 'note' && didAdvanceRow) focusCellAndSelectText(nextRowForEnter, channelId, 'note');
        else if (currentFieldIndex < fieldsOrder.length - 1) focusCellAndSelectText(rowIndex, channelId, fieldsOrder[currentFieldIndex + 1]);
        else if (channelIndex < channels.length - 1) focusCellAndSelectText(rowIndex, channels[channelIndex + 1], fieldsOrder[0]);
        else if (didAdvanceRow) focusCellAndSelectText(nextRowForEnter, channels[0], fieldsOrder[0]);
        break;
      case 'Escape': (e.target as HTMLElement).blur(); setFocusedCell(null); break;
      case 'Delete': case 'Backspace': e.preventDefault(); handleCellChange(rowIndex, channelId, field, null); break;
      default: break;
    }
  }, [focusedCell, currentPattern, channels, handleCellChange, focusCellAndSelectText, keyboardOctaveOffset, synthesizer, activeInstrumentId, activeOrnamentId, editStepJump, fieldsOrder, songData.instruments, songData.ornaments, schedulePreviewNoteCut, getResolvedCellValue, mutedChannels]);

  const handleCurrentPatternIndexInOrderChange = useCallback((newIndex: number) => {
    if (songData.order && newIndex >= 0 && newIndex < songData.order.length) {
      const newPatternIndexInStorage = songData.order[newIndex];
      if (newPatternIndexInStorage >= 0 && newPatternIndexInStorage < songData.patterns.length) {
        onUpdate({ currentPatternIndexInOrder: newIndex, currentPatternId: songData.patterns[newPatternIndexInStorage].id });
      }
    }
  }, [songData.order, songData.patterns, onUpdate]);

  const handleOrderListChange = useCallback((orderIndex: number, newPatternArrayIndex: number) => {
    const newOrder = [...(songData.order || [])];
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
    const newOrder = [...(songData.order || []), 0];
    onUpdate({ order: newOrder, lengthInPatterns: newOrder.length });
  }, [songData.order, songData.patterns.length, onUpdate]);

  const removePatternFromOrder = useCallback((orderIndexToRemove: number) => {
    if (!songData.order || songData.order.length <= 1) { alert("Cannot remove the last pattern from the order list."); return; }
    const newOrder = songData.order.filter((_, idx) => idx !== orderIndexToRemove);
    let newCurrentPatternIndexInOrder = songData.currentPatternIndexInOrder;
    if (orderIndexToRemove < songData.currentPatternIndexInOrder || (orderIndexToRemove === songData.currentPatternIndexInOrder && songData.currentPatternIndexInOrder === newOrder.length)) {
      newCurrentPatternIndexInOrder = Math.max(0, songData.currentPatternIndexInOrder - 1);
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
    const newPattern = createDefaultTrackerPattern(newPatternIdSuffix, 64, channels);
    const newPatterns = [...songData.patterns, newPattern];
    const newPatternIndexInStorage = newPatterns.length - 1;

    // A new pattern cannot exist in the immutable source PT3 stream. Adding
    // one is therefore an explicit request to compose a native Mideas song;
    // keep the imported PSG instruments, but leave source-faithful playback.
    const switchToNative = songData.playbackBackend === 'external-pt3';
    onUpdate({
      patterns: newPatterns,
      order: [...(songData.order || []), newPatternIndexInStorage],
      lengthInPatterns: (songData.order?.length || 0) + 1,
      currentPatternIndexInOrder: songData.order?.length || 0,
      currentPatternId: newPattern.id,
      ...(switchToNative ? {
        playbackBackend: 'native' as const,
        externalPt3Data: undefined,
        externalPt3HasHeader: undefined,
        externalPt3PlayerId: undefined,
      } : {}),
    });
  }, [songData.patterns, songData.order, songData.playbackBackend, onUpdate, channels]);

  const handleDeleteCurrentPattern = useCallback(() => {
    if (songData.patterns.length <= 1) { alert("Cannot delete the last pattern."); return; }
    if (!currentPattern) return;

    const currentPatternArrayIndex = activePatternStorageIndex;
    if (currentPatternArrayIndex === -1) return;

    const newPatterns = songData.patterns.filter(p => p.id !== currentPattern.id);
    const newOrder = (songData.order || [])
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
      lengthInPatterns: newOrder.length > 0 ? newOrder.length : (newPatterns.length > 0 ? 1 : 0),
      currentPatternIndexInOrder: newCurrentPatternIndexInOrder,
      currentPatternId: nextActivePatternId,
    });
  }, [currentPattern, activePatternStorageIndex, songData.patterns, songData.order, songData.currentPatternIndexInOrder, onUpdate]);

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
      noiseEnvelope: instrumentModalBuffer.noiseEnvelope?.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n)),
      volumeLoop: instrumentModalBuffer.volumeLoop,
      toneLoop: instrumentModalBuffer.toneLoop,
      noiseLoop: instrumentModalBuffer.noiseLoop,
      ayEnvelopeShape: instrumentModalBuffer.ayEnvelopeShape,
      ayToneEnabled: instrumentModalBuffer.ayToneEnabled,
      ayNoiseEnabled: instrumentModalBuffer.ayNoiseEnabled,
      noiseBaseFrequency: instrumentModalBuffer.noiseBaseFrequency,
      hardwareEnvelopePeriod: instrumentModalBuffer.hardwareEnvelopePeriod,
      hardwareEnvelopeRatio: instrumentModalBuffer.hardwareEnvelopeRatio,
      // Editing any tab must never turn an exact PT3 macro back into a legacy
      // instrument; only Save commits the modal's deep-copied draft.
      instrumentMode: instrumentModalBuffer.instrumentMode,
      pt3Sample: instrumentModalBuffer.pt3Sample,
    };
    if (songData.soundChip === 'PSG+SCC') {
      newInstrumentData.chip = 'PSG';
    }

    let updatedInstruments;
    if (editingInstrument) {
      updatedInstruments = (songData.instruments || []).map(instr => instr.id === editingInstrument.id ? newInstrumentData : instr);
    } else {
      if (songData.instruments?.find(i => i.id === newInstrumentData.id)) {
        alert(`Instrument with ID ${newInstrumentData.id} already exists.`);
        return;
      }
      updatedInstruments = [...(songData.instruments || []), newInstrumentData];
    }
    updatedInstruments.sort((a, b) => a.id - b.id);
    if (songData.playbackBackend === 'external-pt3') {
      const macro = newInstrumentData.pt3Sample;
      if (!editingInstrument || !macro || !songData.externalPt3Data) {
        alert('A source PT3 can only save instruments that already exist in the module.');
        return;
      }
      let bytes: Uint8Array;
      try {
        bytes = patchPT3SourceSampleBytes(new Uint8Array(songData.externalPt3Data), macro);
      } catch (error) {
        alert(error instanceof Error ? error.message : String(error));
        return;
      }
      const decoded = parsePT3File(bytes.buffer);
      const names = new Map(updatedInstruments.map(instrument => [instrument.id, instrument.name]));
      externalPt3PlayerRef.current?.stop();
      externalPt3PlayerRef.current?.close();
      externalPt3PlayerRef.current = null;
      setIsPlaying(false);
      setExternalPt3CurrentTime(0);
      setExternalPt3Duration(null);
      setExternalPt3Status('ready');
      onUpdate({
        ...decoded,
        instruments: decoded.instruments?.map(instrument => ({ ...instrument, name: names.get(instrument.id) || instrument.name })),
        playbackBackend: 'external-pt3',
        externalPt3Data: Array.from(bytes),
      });
    } else {
      onUpdate({ instruments: updatedInstruments });
    }
    setIsInstrumentModalOpen(false);
    setEditingInstrument(null);
  }, [instrumentModalBuffer, editingInstrument, songData.instruments, songData.playbackBackend, songData.externalPt3Data, onUpdate]);


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
      sourcePointer: ornamentModalBuffer.sourcePointer,
    };

    let updatedOrnaments;
    if (editingOrnament) {
      updatedOrnaments = (songData.ornaments || []).map(orn => orn.id === editingOrnament.id ? newOrnamentData : orn);
    } else {
      if (songData.ornaments?.find(o => o.id === newOrnamentData.id)) {
        alert(`Ornament with ID ${newOrnamentData.id} already exists.`);
        return;
      }
      updatedOrnaments = [...(songData.ornaments || []), newOrnamentData];
    }
    updatedOrnaments.sort((a, b) => a.id - b.id);
    if (songData.playbackBackend === 'external-pt3') {
      if (!editingOrnament || !songData.externalPt3Data) {
        alert('A source PT3 can only save ornaments that already exist in the module.');
        return;
      }
      let bytes: Uint8Array;
      try {
        bytes = patchPT3SourceOrnamentBytes(new Uint8Array(songData.externalPt3Data), newOrnamentData);
      } catch (error) {
        alert(error instanceof Error ? error.message : String(error));
        return;
      }
      const decoded = parsePT3File(bytes.buffer);
      const names = new Map(updatedOrnaments.map(ornament => [ornament.id, ornament.name]));
      externalPt3PlayerRef.current?.stop();
      externalPt3PlayerRef.current?.close();
      externalPt3PlayerRef.current = null;
      setIsPlaying(false);
      setExternalPt3CurrentTime(0);
      setExternalPt3Duration(null);
      setExternalPt3Status('ready');
      onUpdate({
        ...decoded,
        ornaments: decoded.ornaments?.map(ornament => ({ ...ornament, name: names.get(ornament.id) || ornament.name })),
        playbackBackend: 'external-pt3',
        externalPt3Data: Array.from(bytes),
      });
    } else {
      onUpdate({ ornaments: updatedOrnaments });
    }
    setIsOrnamentModalOpen(false);
    setEditingOrnament(null);
  }, [ornamentModalBuffer, editingOrnament, songData.ornaments, songData.playbackBackend, songData.externalPt3Data, onUpdate]);

  const handleVirtualPianoKeyPress = useCallback((noteName: string) => {
    if (focusedCell && currentPattern) {
      const channelIndex = channels.indexOf(focusedCell.channelId);
      const resolvedInstrumentId = getResolvedCellValue(focusedCell.rowIndex, focusedCell.channelId, 'instrument');
      const resolvedOrnamentId = getResolvedCellValue(focusedCell.rowIndex, focusedCell.channelId, 'ornament');
      if (!mutedChannels.has(focusedCell.channelId)) {
        synthesizer?.playNote(
          channelIndex as any,
          noteName,
          resolvedInstrumentId !== null ? resolvedInstrumentId : activeInstrumentId,
          resolvedOrnamentId !== null ? resolvedOrnamentId : activeOrnamentId,
          currentPattern.rows[focusedCell.rowIndex][focusedCell.channelId].volume ?? 15
        );
        schedulePreviewNoteCut(channelIndex);
      }
      setActivePianoKeys(prev => new Set(prev).add(noteName));
      setActivePianoKeyLevels(prev => {
        const next = new Map(prev);
        next.set(noteName, 1);
        return next;
      });
      if (activePianoKeysTimeoutRef.current) clearTimeout(activePianoKeysTimeoutRef.current);
      activePianoKeysTimeoutRef.current = window.setTimeout(() => {
        setActivePianoKeys(prev => { const next = new Set(prev); next.delete(noteName); return next; });
        setActivePianoKeyLevels(prev => { const next = new Map(prev); next.delete(noteName); return next; });
      }, 150);
      handleCellChange(focusedCell.rowIndex, focusedCell.channelId, 'note', noteName);
      focusCellAndSelectText(
        Math.min(currentPattern.numRows - 1, focusedCell.rowIndex + editStepJump),
        focusedCell.channelId,
        'note'
      );
    }
  }, [focusedCell, synthesizer, currentPattern, handleCellChange, activeInstrumentId, activeOrnamentId, focusCellAndSelectText, editStepJump, channels, schedulePreviewNoteCut, getResolvedCellValue, mutedChannels]);

  // --- MIDI input (Akai MPK Mini MK3 and other Web MIDI devices) ---
  const [midiOctaveOffset, setMidiOctaveOffset] = useState<number>(() => {
    const v = parseInt(localStorage.getItem('mideas.tracker.midi.octaveOffset') || '0', 10);
    return Number.isFinite(v) ? Math.max(-4, Math.min(4, v)) : 0;
  });
  const [midiChannelMode, setMidiChannelMode] = useState<MidiChannelMode>(() => {
    return (localStorage.getItem('mideas.tracker.midi.channelMode') as MidiChannelMode) === 'fixed' ? 'fixed' : 'follow';
  });
  const [midiFixedChannelIndex, setMidiFixedChannelIndex] = useState<number>(() => {
    const v = parseInt(localStorage.getItem('mideas.tracker.midi.fixedChannel') || '0', 10);
    return Number.isFinite(v) ? v : 0;
  });
  // When on, the MIDI Note On velocity is written to the cell's volume column
  // (velocity 1..127 -> volume 1..15). When off, the volume column is untouched.
  const [midiVelocityToVolume, setMidiVelocityToVolume] = useState<boolean>(() => {
    return localStorage.getItem('mideas.tracker.midi.velocityToVolume') !== '0';
  });
  useEffect(() => { localStorage.setItem('mideas.tracker.midi.velocityToVolume', midiVelocityToVolume ? '1' : '0'); }, [midiVelocityToVolume]);

  useEffect(() => { localStorage.setItem('mideas.tracker.midi.octaveOffset', String(midiOctaveOffset)); }, [midiOctaveOffset]);
  useEffect(() => { localStorage.setItem('mideas.tracker.midi.channelMode', midiChannelMode); }, [midiChannelMode]);
  useEffect(() => { localStorage.setItem('mideas.tracker.midi.fixedChannel', String(midiFixedChannelIndex)); }, [midiFixedChannelIndex]);

  // CC -> tracker action map (MIDI Learn). Functions are CC-only so they never
  // collide with note input. Persisted so a learned layout survives reloads.
  const EMPTY_MIDI_ACTION_MAP: MidiActionMap = {
    playStop: null, pause: null, recArm: null,
    instrumentPrev: null, instrumentNext: null, volumeDown: null, volumeUp: null,
  };
  const [midiActionMap, setMidiActionMap] = useState<MidiActionMap>(() => {
    try {
      const raw = localStorage.getItem('mideas.tracker.midi.actionMap');
      if (raw) return { ...EMPTY_MIDI_ACTION_MAP, ...JSON.parse(raw) };
    } catch { /* ignore malformed storage */ }
    return EMPTY_MIDI_ACTION_MAP;
  });
  const [midiLearnTarget, setMidiLearnTarget] = useState<MidiActionId | null>(null);
  // REC arm: live MIDI notes are written into the pattern during playback only
  // while this is on. Stopped step-entry editing is unaffected.
  const [midiRecArmed, setMidiRecArmed] = useState(false);
  // Tracks the last value per CC so we fire actions on the rising edge only.
  const ccLastValueRef = useRef<Map<number, number>>(new Map());

  useEffect(() => { localStorage.setItem('mideas.tracker.midi.actionMap', JSON.stringify(midiActionMap)); }, [midiActionMap]);

  // Convert a MIDI note number to a tracker note string (e.g. 60 -> "C-4"),
  // applying the configured octave offset. MIDI 60 = C4. Returns null if the
  // resulting octave is outside the tracker's 0..7 range.
  const midiNoteToTrackerNote = useCallback((midiNote: number): string | null => {
    const noteIndex = ((midiNote % 12) + 12) % 12;
    const baseOctave = Math.floor(midiNote / 12) - 1;
    const octave = baseOctave + midiOctaveOffset;
    if (octave < 0 || octave > 7) return null;
    return `${PT3_NOTE_NAMES[noteIndex]}${octave}`;
  }, [midiOctaveOffset]);

  // Insert a note string at an explicit (row, channel) target, reusing the
  // exact same logic as the on-screen piano / computer keyboard: write the
  // cell, preview through the synth, highlight the key, and advance the row.
  const insertNoteAtChannel = useCallback((channelId: TrackerChannelId, noteName: string, velocity?: number) => {
    if (!currentPattern) return;
    const channelIndex = channels.indexOf(channelId);
    if (channelIndex < 0) return;
    // Velocity sensitivity: map MIDI velocity (1..127) to PT3 volume (1..15).
    const velVolume = (midiVelocityToVolume && typeof velocity === 'number')
      ? Math.max(1, Math.min(15, Math.round((velocity / 127) * 15)))
      : null;
    // While playing, record live at tempo: write into the row currently being
    // played and let the cursor follow the playhead (do NOT advance the edit
    // cursor per note, which produced the sequential bug). When stopped, behave
    // as step entry at the focused cell, advancing by editStepJump.
    const recording = isPlaying;
    // While playing, only capture live notes when REC is armed. Stopped
    // step-entry (editing) is always allowed.
    if (recording && !midiRecArmed) return;
    const rowIndex = recording
      ? Math.max(0, Math.min(currentPattern.numRows - 1, playbackRow))
      : (focusedCell ? focusedCell.rowIndex : 0);
    const resolvedInstrumentId = getResolvedCellValue(rowIndex, channelId, 'instrument');
    const resolvedOrnamentId = getResolvedCellValue(rowIndex, channelId, 'ornament');
    // Manual preview only when stopped. During playback the engine plays the
    // written note on its next pass, and a manual note-cut would silence the
    // channel mid-playback.
    if (!recording && !mutedChannels.has(channelId)) {
      synthesizer?.playNote(
        channelIndex as any,
        noteName,
        resolvedInstrumentId !== null ? resolvedInstrumentId : activeInstrumentId,
        resolvedOrnamentId !== null ? resolvedOrnamentId : activeOrnamentId,
        velVolume ?? currentPattern.rows[rowIndex]?.[channelId]?.volume ?? 15
      );
      schedulePreviewNoteCut(channelIndex);
    }
    setActivePianoKeys(prev => new Set(prev).add(noteName));
    setActivePianoKeyLevels(prev => { const next = new Map(prev); next.set(noteName, 1); return next; });
    if (activePianoKeysTimeoutRef.current) clearTimeout(activePianoKeysTimeoutRef.current);
    activePianoKeysTimeoutRef.current = window.setTimeout(() => {
      setActivePianoKeys(prev => { const next = new Set(prev); next.delete(noteName); return next; });
      setActivePianoKeyLevels(prev => { const next = new Map(prev); next.delete(noteName); return next; });
    }, 150);
    handleCellChange(rowIndex, channelId, 'note', noteName);
    // Translate the played velocity into the cell's volume column.
    if (velVolume !== null) {
      handleCellChange(rowIndex, channelId, 'volume', velVolume.toString(16).toUpperCase());
    }
    if (!recording) {
      focusCellAndSelectText(Math.min(currentPattern.numRows - 1, rowIndex + editStepJump), channelId, 'note');
    }
  }, [currentPattern, focusedCell, channels, getResolvedCellValue, mutedChannels, synthesizer, activeInstrumentId, activeOrnamentId, schedulePreviewNoteCut, handleCellChange, focusCellAndSelectText, editStepJump, isPlaying, playbackRow, midiRecArmed, midiVelocityToVolume]);

  const handleMidiNoteOn = useCallback((midiNote: number, velocity: number) => {
    const noteName = midiNoteToTrackerNote(midiNote);
    if (!noteName) return;
    // Follow cursor: requires a focused cell; otherwise default to first channel.
    if (midiChannelMode === 'follow') {
      const targetChannel = focusedCell ? focusedCell.channelId : channels[0];
      insertNoteAtChannel(targetChannel, noteName, velocity);
    } else {
      const idx = Math.max(0, Math.min(channels.length - 1, midiFixedChannelIndex));
      insertNoteAtChannel(channels[idx], noteName, velocity);
    }
  }, [midiNoteToTrackerNote, midiChannelMode, focusedCell, channels, midiFixedChannelIndex, insertNoteAtChannel]);

  // Note Off: nothing to clean up here. Preview note cuts are scheduled by
  // the preview timeout; explicit silencing on key release is intentionally
  // avoided so it does not interfere with row playback / pending cuts.
  const handleMidiNoteOff = useCallback((_midiNote: number) => { /* no-op: state-safe */ }, []);

  // Cycle the active instrument by dir (+1/-1), wrapping around the list.
  const cycleInstrument = useCallback((dir: 1 | -1) => {
    const instruments = songData.instruments || [];
    if (instruments.length === 0) return;
    const curIdx = instruments.findIndex(i => i.id === activeInstrumentId);
    const base = curIdx < 0 ? 0 : curIdx;
    const nextIdx = (base + dir + instruments.length) % instruments.length;
    handleSelectInstrument(instruments[nextIdx].id);
  }, [songData.instruments, activeInstrumentId, handleSelectInstrument]);

  // Nudge the volume column (0..15) of the focused cell by delta. Volume is
  // stored as a single hex digit, so we pass it as such to handleCellChange.
  const adjustFocusedVolume = useCallback((delta: number) => {
    if (!focusedCell || !currentPattern) return;
    const resolved = getResolvedCellValue(focusedCell.rowIndex, focusedCell.channelId, 'volume');
    const base = typeof resolved === 'number' ? resolved : 15;
    const next = Math.max(0, Math.min(15, base + delta));
    handleCellChange(focusedCell.rowIndex, focusedCell.channelId, 'volume', next.toString(16).toUpperCase());
  }, [focusedCell, currentPattern, getResolvedCellValue, handleCellChange]);

  const clearMidiAction = useCallback((action: MidiActionId) => {
    setMidiActionMap(prev => ({ ...prev, [action]: null }));
  }, []);

  // Control Change handler. When a learn target is armed the next CC binds to
  // that action; otherwise the CC fires its mapped action on a rising edge
  // (value crosses 64 upward) so pads/knobs don't double-trigger.
  const handleMidiControlChange = useCallback((cc: number, value: number) => {
    if (midiLearnTarget) {
      setMidiActionMap(prev => {
        const next = { ...prev };
        // A CC can only drive one action: clear it elsewhere first.
        (Object.keys(next) as MidiActionId[]).forEach(k => { if (next[k] === cc) next[k] = null; });
        next[midiLearnTarget] = cc;
        return next;
      });
      setMidiLearnTarget(null);
      ccLastValueRef.current.set(cc, value);
      return;
    }
    const prevValue = ccLastValueRef.current.get(cc) ?? 0;
    ccLastValueRef.current.set(cc, value);
    const pressed = prevValue < 64 && value >= 64;
    if (!pressed) return;
    if (midiActionMap.playStop === cc) { void handlePlayStop(); return; }
    if (midiActionMap.pause === cc) { void handlePlayPause(); return; }
    if (midiActionMap.recArm === cc) { setMidiRecArmed(v => !v); return; }
    if (midiActionMap.instrumentPrev === cc) { cycleInstrument(-1); return; }
    if (midiActionMap.instrumentNext === cc) { cycleInstrument(1); return; }
    if (midiActionMap.volumeDown === cc) { adjustFocusedVolume(-1); return; }
    if (midiActionMap.volumeUp === cc) { adjustFocusedVolume(1); return; }
  }, [midiLearnTarget, midiActionMap, handlePlayStop, handlePlayPause, cycleInstrument, adjustFocusedVolume]);

  const midi = useMidiInput({
    onNoteOn: handleMidiNoteOn,
    onNoteOff: handleMidiNoteOff,
    onControlChange: handleMidiControlChange,
  });

  const handleOpenInstrumentModal = useCallback((instrument: PT3Instrument | null) => {
    if (instrument) {
      setEditingInstrument(instrument);
      setInstrumentModalBuffer({
        ...instrument,
        volumeEnvelope: instrument.volumeEnvelope?.join(','),
        toneEnvelope: instrument.toneEnvelope?.join(','),
        noiseEnvelope: instrument.noiseEnvelope?.join(','),
        // Deep-copy the PT3 macro: the step editor must work on a draft that
        // only reaches the song when the user presses Save Instrument.
        pt3Sample: instrument.pt3Sample ? {
          ...instrument.pt3Sample,
          steps: instrument.pt3Sample.steps.map(step => ({
            ...step,
            raw: [...step.raw] as [number, number, number, number],
          })),
        } : undefined,
      });
    } else {
      const existingIds = (songData.instruments || []).map(i => i.id);
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
        noiseEnvelope: "",
        volumeLoop: 255,
        toneLoop: 255,
        noiseLoop: 255,
        ayToneEnabled: true,
        ayNoiseEnabled: false,
        ayEnvelopeShape: undefined,
      });
    }
    setIsInstrumentModalOpen(true);
  }, [songData.instruments]);

  const handleOpenWaveformModal = useCallback((instrument: SCCInstrument | null) => {
    if (instrument) {
      setEditingSccInstrument(instrument);
    } else {
      const existingIds = (songData.instruments || []).map(i => i.id);
      let newId = 1;
      while (existingIds.includes(newId) && newId <= PT3_MAX_INSTRUMENTS) {
        newId++;
      }
      if (newId > PT3_MAX_INSTRUMENTS) {
        alert(`Cannot add more instruments (max ${PT3_MAX_INSTRUMENTS} reached).`);
        return;
      }
      setEditingSccInstrument({
        id: newId,
        name: `Wave ${newId}`,
        waveform: Array(32).fill(0),
        volume: 15,
      });
    }
    setIsWaveformModalOpen(true);
  }, [songData.instruments]);

  const handleSaveSccInstrument = useCallback((instrument: SCCInstrument) => {
    if (songData.soundChip === 'PSG+SCC' && !instrument.chip) {
      instrument = { ...instrument, chip: 'SCC' };
    }
    let updatedInstruments;
    const existing = songData.instruments.find(i => i.id === instrument.id);

    if (existing) {
      updatedInstruments = (songData.instruments || []).map(instr =>
        instr.id === instrument.id ? instrument : instr
      );
    } else {
      updatedInstruments = [...(songData.instruments || []), instrument];
    }
    updatedInstruments.sort((a, b) => a.id - b.id);
    onUpdate({ instruments: updatedInstruments });
    setIsWaveformModalOpen(false);
    setEditingSccInstrument(null);
  }, [songData.instruments, onUpdate]);

  const handleDeleteInstrument = useCallback((instrument: PT3Instrument | SCCInstrument) => {
    const deletedId = instrument.id;
    const updatedInstruments = (songData.instruments || []).filter(item => item.id !== deletedId);
    const updatedPatterns = (songData.patterns || []).map(pattern => ({
      ...pattern,
      rows: pattern.rows.map(row => {
        const updatedRow = { ...row };
        Object.keys(updatedRow).forEach(channelId => {
          const cell = updatedRow[channelId];
          if (cell && cell.instrument === deletedId) {
            updatedRow[channelId] = { ...cell, instrument: null };
          }
        });
        return updatedRow;
      }),
    }));
    onUpdate({ instruments: updatedInstruments, patterns: updatedPatterns });
    if (activeInstrumentId === deletedId) {
      explicitlySelectedInstrumentIdRef.current = null;
      setActiveInstrumentId(updatedInstruments[0]?.id ?? null);
    }
  }, [songData.instruments, songData.patterns, onUpdate, activeInstrumentId]);


  const handleOpenOrnamentModal = useCallback((ornament: PT3Ornament | null) => {
    if (ornament) {
      setEditingOrnament(ornament);
      setOrnamentModalBuffer({
        ...ornament,
        data: ornament.data?.join(','),
      });
    } else {
      const existingIds = (songData.ornaments || []).map(o => o.id);
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
    addLog("Calling createCmajorChiptuneSampleSong().");
    const sampleSong = createCmajorChiptuneSampleSong();
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
    clearPianoHighlights();
    addLog("Sample song loading process finished in TrackerComposer.");

  }, [onUpdate, isPlaying, addLog, clearPianoHighlights]);

  const handleImportPT3File = useCallback(() => {
    const loadPT3Buffer = (buffer: ArrayBuffer, fileName: string) => {
      const bytes = new Uint8Array(buffer);
      const textDecoder = new TextDecoder('ascii', { fatal: false });
      const hasHeader = hasFullPT3Header(bytes);

      let trackBytes: number[];
      let speed = 6;
      let title = fileName.replace(/\.[^/.]+$/, '');

      if (hasHeader && bytes.length > 99) {
        // Full .pt3 file - extract title and speed from header.
        const titleRaw = textDecoder.decode(bytes.slice(30, 64));
        const nullIdx = titleRaw.indexOf('\0');
        const extractedTitle = (nullIdx >= 0 ? titleRaw.slice(0, nullIdx) : titleRaw).trim();
        if (extractedTitle) title = extractedTitle;
        // Byte 99 is the tone-table selector; the PT3 delay/speed lives at byte 100.
        speed = bytes[100] || 6;
        trackBytes = Array.from(bytes);
      } else {
        speed = bytes[0] || 6;
        trackBytes = Array.from(bytes);
      }

      externalPt3PlayerRef.current?.close();
      externalPt3PlayerRef.current = null;
      setExternalPt3CurrentTime(0);
      setExternalPt3Duration(null);
      setExternalPt3Status('ready');
      setExternalPt3Error(hasHeader ? null : 'Loaded headerless PT3 data. Cowbell playback needs the original .pt3 file with its ProTracker/Vortex Tracker header.');
      if (isPlaying) setIsPlaying(false);
      onUpdate({
        name: title,
        title,
        speed,
        playbackBackend: 'external-pt3',
        externalPt3Data: trackBytes,
        externalPt3HasHeader: hasHeader,
        externalPt3PlayerId: 'custom',
        patterns: [],
        order: [],
        lengthInPatterns: 0,
        currentPatternId: undefined,
        currentPatternIndexInOrder: 0,
      });
    };

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pt3,.99';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const buffer = evt.target?.result as ArrayBuffer;
        loadPT3Buffer(buffer, file.name);
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  }, [onUpdate, isPlaying]);

  const handleLoadPT3Music = useCallback(() => {
    pt3MusicInputRef.current?.click();
  }, []);

  const handlePT3MusicFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const imported = normalizeImportedPT3Data(parsePT3File(buffer), file.name);
      if (isPlaying) handlePlayStop();
      externalPt3PlayerRef.current?.close();
      externalPt3PlayerRef.current = null;
      setExternalPt3CurrentTime(0);
      setExternalPt3Duration(null);
      setExternalPt3Status('ready');
      setExternalPt3Error(null);
      onUpdate({
        name: imported.name,
        title: imported.title,
        author: imported.author,
        speed: imported.speed,
        bpm: imported.bpm,
        soundChip: 'PSG',
        // Preserve decoded rows for the tracker while Preview and ROM consume
        // the untouched module through the reference-compatible PT3 players.
        playbackBackend: 'external-pt3',
        externalPt3Data: Array.from(bytes),
        externalPt3HasHeader: true,
        externalPt3PlayerId: 'custom',
        patterns: imported.patterns,
        order: imported.order,
        lengthInPatterns: imported.lengthInPatterns,
        restartPosition: imported.restartPosition,
        currentPatternId: imported.currentPatternId,
        currentPatternIndexInOrder: imported.currentPatternIndexInOrder,
        instruments: imported.instruments,
        ornaments: imported.ornaments,
      });
      explicitlySelectedInstrumentIdRef.current = null;
      setActiveInstrumentId(imported.instruments[0]?.id ?? null);
      setActiveOrnamentId(imported.ornaments[0]?.id ?? null);
      setPt3ImportFeedback({ kind: 'success', message: `Loaded source-faithful PT3 music “${imported.title}”: ${imported.patterns.length} visible patterns, ${imported.instruments.length} samples. Preview and ROM use the original Vortex/PT3 stream.` });
    } catch (error) {
      setPt3ImportFeedback({ kind: 'error', message: `Could not load PT3 music: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      input.value = '';
    }
  }, [onUpdate, isPlaying, handlePlayStop]);

  const handleExportMusicJson = useCallback(() => {
    downloadJsonFile(
      `${sanitizeMusicFilename(songData.name)}.music.json`,
      createMusicJsonPackage(songData)
    );
  }, [songData]);

  const handleImportMusicJson = useCallback(() => {
    musicJsonInputRef.current?.click();
  }, []);

  const handleExtractPT3Instruments = useCallback(() => {
    setPt3ImportFeedback(null);
    pt3InstrumentInputRef.current?.click();
  }, []);

  const handleAddFactoryPT3Kit = useCallback(() => {
    setPt3ImportFeedback(null);
    const merged = mergePT3FactoryKit(songData.instruments || []);
    const addedCount = merged.addedInstrumentIds.length;
    if (addedCount === 0) {
      const alreadyInstalled = merged.alreadyPresentPresetNames.length;
      setPt3ImportFeedback({
        kind: alreadyInstalled > 0 ? 'success' : 'error',
        message: alreadyInstalled > 0
          ? `The complete Mideas PT3 factory kit is already installed (${alreadyInstalled} instruments).`
          : 'Factory kit was not added: the 31 instrument slots are already occupied.',
      });
      return;
    }

    onUpdate({ instruments: merged.instruments });
    explicitlySelectedInstrumentIdRef.current = null;
    setActiveInstrumentId(merged.addedInstrumentIds[0]);
    const skippedCount = merged.skippedPresetNames.length;
    const alreadyInstalled = merged.alreadyPresentPresetNames.length;
    setPt3ImportFeedback({
      kind: skippedCount > 0 ? 'warning' : 'success',
      message: skippedCount > 0
        ? `Added ${addedCount} factory PT3 instruments; ${skippedCount} did not fit in the bank.`
        : `Added ${addedCount} original Mideas PT3 instruments${alreadyInstalled > 0 ? ` (${alreadyInstalled} already present)` : ''}. Select one and use the piano below to hear it.`,
    });
  }, [songData.instruments, onUpdate]);

  const handlePT3InstrumentFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = parsePT3Module(await file.arrayBuffer());
      const merged = mergePT3Assets(songData.instruments || [], songData.ornaments || [], parsed);
      const importedCount = merged.importedInstrumentIds.length;
      const ornamentCount = merged.importedOrnamentIds.length;
      const skippedCount = merged.skippedSampleIds.length + merged.skippedOrnamentIds.length;

      if (importedCount + ornamentCount === 0) {
        setPt3ImportFeedback({
          kind: 'error',
          message: 'Nothing was added: the PSG instrument and ornament banks are full.',
        });
        return;
      }

      onUpdate({ instruments: merged.instruments, ornaments: merged.ornaments });
      if (merged.importedInstrumentIds[0] !== undefined) {
        explicitlySelectedInstrumentIdRef.current = null;
        setActiveInstrumentId(merged.importedInstrumentIds[0]);
      }
      if (merged.importedOrnamentIds[0] !== undefined) {
        setActiveOrnamentId(merged.importedOrnamentIds[0]);
      }

      const details = [
        `${importedCount} sample${importedCount === 1 ? '' : 's'}`,
        `${ornamentCount} ornament${ornamentCount === 1 ? '' : 's'}`,
      ];
      if (skippedCount > 0) details.push(`${skippedCount} skipped (bank full)`);
      if (parsed.warnings.length > 0) details.push(`${parsed.warnings.length} parser warning${parsed.warnings.length === 1 ? '' : 's'}`);
      setPt3ImportFeedback({
        kind: skippedCount > 0 || parsed.warnings.length > 0 ? 'warning' : 'success',
        message: `Added ${details.join(', ')} from “${parsed.title}”. Select one and use the piano below to hear it.`,
      });
    } catch (error) {
      setPt3ImportFeedback({
        kind: 'error',
        message: `Could not extract PT3 instruments: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      input.value = '';
    }
  }, [songData.instruments, songData.ornaments, onUpdate]);

  const handleMusicJsonFileSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const importedSong = normalizeImportedMusic(JSON.parse(String(reader.result)), songData);
        externalPt3PlayerRef.current?.close();
        externalPt3PlayerRef.current = null;
        if (isPlaying) setIsPlaying(false);
        setExternalPt3CurrentTime(0);
        setExternalPt3Duration(null);
        setExternalPt3Status(importedSong.playbackBackend === 'external-pt3' ? 'ready' : 'idle');
        setExternalPt3Error(null);
        setFocusedCell(null);
        explicitlySelectedInstrumentIdRef.current = null;
        setActiveInstrumentId(importedSong.instruments[0]?.id ?? null);
        setActiveOrnamentId(importedSong.ornaments[0]?.id ?? null);
        onUpdate(importedSong);
      } catch (error) {
        alert(`Could not import music JSON: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      alert('Could not read the selected music JSON file.');
      input.value = '';
    };
    reader.readAsText(file);
  }, [isPlaying, onUpdate, songData.id, songData.name]);

  const handleLoadDemoPT3File = useCallback(async () => {
    const response = await fetch(DEMO_PT3_URL);
    if (!response.ok) {
      setExternalPt3Error(`Could not load bundled PT3 demo (${response.status}).`);
      setExternalPt3Status('error');
      return;
    }
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('ascii', { fatal: false });
    const hasHeader = hasFullPT3Header(bytes);
    const titleRaw = hasHeader ? textDecoder.decode(bytes.slice(30, 64)) : '';
    const nullIdx = titleRaw.indexOf('\0');
    const extractedTitle = (nullIdx >= 0 ? titleRaw.slice(0, nullIdx) : titleRaw).trim();

    externalPt3PlayerRef.current?.close();
    externalPt3PlayerRef.current = null;
    setExternalPt3CurrentTime(0);
    setExternalPt3Duration(null);
    setExternalPt3Status('ready');
    setExternalPt3Error(hasHeader ? null : 'Bundled PT3 demo is missing a ProTracker/Vortex Tracker header.');
    if (isPlaying) setIsPlaying(false);
    onUpdate({
      name: extractedTitle || DEMO_PT3_FILENAME.replace(/\.[^/.]+$/, ''),
      title: extractedTitle || DEMO_PT3_FILENAME.replace(/\.[^/.]+$/, ''),
      speed: (hasHeader ? bytes[100] : bytes[0]) || 6,
      playbackBackend: 'external-pt3',
      externalPt3Data: Array.from(bytes),
      externalPt3HasHeader: hasHeader,
      externalPt3PlayerId: 'custom',
      patterns: [],
      order: [],
      lengthInPatterns: 0,
      currentPatternId: undefined,
      currentPatternIndexInOrder: 0,
    });
  }, [onUpdate, isPlaying]);

  const handleSelectPattern = useCallback((id: string) => {
    const patternObject = songData.patterns.find(p => p.id === id);
    if (patternObject) {
      const patternArrayIndex = songData.patterns.indexOf(patternObject);
      const orderIndex = songData.order?.findIndex(idx => idx === patternArrayIndex) ?? -1;

      // An explicit choice outranks the PT3 playhead until playback restarts.
      userPickedPatternRef.current = true;
      setFocusedCell(null);
      onUpdate({
        currentPatternId: id,
        currentPatternIndexInOrder: (orderIndex !== -1) ? orderIndex : Math.max(0, songData.currentPatternIndexInOrder)
      });
    }
  }, [songData, onUpdate]);


  /**
   * The hidden file pickers, rendered by EVERY branch below.
   *
   * They used to live only in the main return, so the buttons that open them
   * through a ref did nothing in the other branches: "Load PT3 Music" on an
   * empty song called click() on a null ref and silently went nowhere, which is
   * exactly the state a user reaches when they want to load a PT3 in the first
   * place. Keeping them here means a picker is mounted wherever its button is.
   */
  const hiddenFileInputs = (
    <>
      <input
        ref={musicJsonInputRef}
        type="file"
        accept=".json,.music.json,application/json"
        onChange={handleMusicJsonFileSelected}
        className="hidden"
        aria-label="Import Mideas music JSON file"
      />
      <input
        ref={pt3InstrumentInputRef}
        type="file"
        accept=".pt3,application/octet-stream"
        onChange={handlePT3InstrumentFileSelected}
        className="hidden"
        aria-label="Extract instruments from a PT3 file"
      />
      <input
        ref={pt3MusicInputRef}
        type="file"
        accept=".pt3,.99,application/octet-stream"
        onChange={handlePT3MusicFileSelected}
        className="hidden"
        aria-label="Load PT3 music into tracker"
      />
    </>
  );

  if (!currentPattern && songData.patterns.length > 0) {
    return <Panel title="Tracker Composer">{hiddenFileInputs}<p className="p-4">Loading pattern data...</p></Panel>;
  }
  // Legacy external imports without decoded rows keep their compact player.
  // Source-faithful "Load PT3 Music" imports retain rows and continue into the
  // normal tracker UI while their audio is handled by the original PT3 stream.
  if (songData.playbackBackend === 'external-pt3' && songData.patterns.length === 0) {
    const duration = externalPt3Duration ?? 0;
    const formatTime = (seconds: number | null): string => {
      if (seconds === null || !Number.isFinite(seconds)) return '--:--';
      const safeSeconds = Math.max(0, Math.floor(seconds));
      const mins = Math.floor(safeSeconds / 60);
      const secs = safeSeconds % 60;
      return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    return (
      <Panel title="Tracker Composer" className="flex-grow bg-msx-bgcolor p-4">
        {hiddenFileInputs}
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-center">
          <div className="rounded border border-msx-border bg-msx-panelbg p-4 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-msx-border pb-3">
              <div>
                <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-msx-highlight">External PT3 Preview</div>
                <div className="mt-1 text-lg font-bold text-msx-textprimary">{songData.title || songData.name || 'Unnamed PT3'}</div>
                <div className="mt-1 text-xs text-msx-textsecondary">
                  Cowbell ZXPT3 backend / {(songData.externalPt3Data?.length ?? 0).toLocaleString()} bytes / {songData.externalPt3HasHeader ? 'full PT3' : 'headerless data'}
                </div>
              </div>
              <div className="rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs uppercase text-msx-textsecondary">
                {externalPt3Status}
              </div>
            </div>

            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={Math.max(0, duration)}
                step={0.05}
                value={Math.min(externalPt3CurrentTime, Math.max(0, duration))}
                disabled={!duration}
                onChange={e => handleExternalPt3Seek(e.target.value)}
                className="w-full accent-msx-highlight"
                title="Seek"
              />
              <div className="mt-1 flex justify-between font-mono text-[0.68rem] text-msx-textsecondary">
                <span>{formatTime(externalPt3CurrentTime)}</span>
                <span>{formatTime(externalPt3Duration)}</span>
              </div>
            </div>

            {externalPt3Error && (
              <div className="mb-4 rounded border border-msx-warning/70 bg-msx-warning/10 px-3 py-2 text-xs text-msx-warning">
                {externalPt3Error}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleExternalPt3PlayStop}
                variant={isPlaying ? 'danger' : 'primary'}
                disabled={externalPt3Status === 'loading' || !songData.externalPt3Data?.length}
              >
                {isPlaying ? 'Pause' : externalPt3Status === 'loading' ? 'Loading...' : 'Play PT3'}
              </Button>
              <Button onClick={handleExternalPt3Stop} variant="ghost" disabled={!songData.externalPt3Data?.length}>
                Stop
              </Button>
              <Button onClick={handleImportPT3File} variant="secondary" title="Replace with another .pt3 or .99 file">
                Replace PT3 File
              </Button>
              <Button
                onClick={() => {
                  externalPt3PlayerRef.current?.close();
                  externalPt3PlayerRef.current = null;
                  setIsPlaying(false);
                  onUpdate({ playbackBackend: 'native', externalPt3Data: undefined, externalPt3HasHeader: undefined, externalPt3PlayerId: undefined });
                }}
                variant="ghost"
              >
                Switch to Native Tracker
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    );
  }
  if (songData.patterns.length === 0 || !currentPattern) {
    return (
      <Panel title="Tracker Composer" className="flex-grow flex flex-col items-center justify-center p-4">
        {hiddenFileInputs}
        <p className="text-msx-textsecondary mb-4">No patterns in this song yet.</p>
        <Button onClick={handleAddPattern} variant="primary" icon={<PlusCircleIcon />}>Create First Pattern</Button>
        <Button onClick={handleLoadSampleSong} variant="secondary" className="mt-2">Load Sample Song</Button>
        <Button onClick={handleImportPT3File} variant="secondary" className="mt-2" title="Import external .pt3 or .99 file">Import PT3 File</Button>
        <Button onClick={handleLoadPT3Music} variant="secondary" className="mt-2" title="Load editable native patterns from a .pt3 file">Load PT3 Music</Button>
      </Panel>
    );
  }

  return (
    <div className="flex h-full flex-grow select-none flex-col overflow-hidden bg-[#05080c]">
      {hiddenFileInputs}
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
        ayHardwareEnvelopePeriod={songData.ayHardwareEnvelopePeriod}
        onAyHardwareEnvelopePeriodChange={(val) => handleGlobalDataChange('ayHardwareEnvelopePeriod', val)}
        ayNoisePeriod={songData.ayNoisePeriod}
        onAyNoisePeriodChange={(val) => handleGlobalDataChange('ayNoisePeriod', val)}
        isPlaying={isPlaying} onPlayStop={handlePlayStop}
        channels={channels}
        onLoadSampleSong={handleLoadSampleSong}
        onSilenceAllChannels={handleSilenceAllChannels}
        onToggleLoopPattern={handleToggleLoopPattern}
        loopCurrentPattern={loopCurrentPattern}
        onExportMusicJson={handleExportMusicJson}
        onImportMusicJson={handleImportMusicJson}
        soundChip={songData.soundChip}
        onSoundChipChange={(chip) => {
          if (chip === songData.soundChip) return;
          if (chip === 'PSG+SCC') {
            // Dual conversion is non-destructive: keep every cell and tag
            // the existing instruments with their chip.
            onUpdate(toDualChipSong(songData));
          } else {
            onUpdate({ soundChip: chip, instruments: [] });
          }
        }}
        sccEnabled={songData.sccEnabled !== false}
        onSccEnabledChange={(enabled) => onUpdate({ sccEnabled: enabled })}
        onDuplicateAsDualChip={onCreateDualChipCopy && songData.soundChip !== 'PSG+SCC'
          ? () => onCreateDualChipCopy(toDualChipSong(songData))
          : undefined}
        onImportPT3File={handleLoadPT3Music}
        onLoadDemoPT3File={handleLoadDemoPT3File}
        isExternalPT3={songData.playbackBackend === 'external-pt3'}
      />
      {songData.playbackBackend === 'external-pt3' && songData.patterns.length > 0 && (
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-msx-highlight/50 bg-msx-highlight/10 px-3 py-1.5 text-[0.68rem]">
          <div>
            <span className="font-bold uppercase text-msx-highlight">Source-faithful PT3</span>
            <span className="ml-2 text-msx-textprimary">
              Modo Vortex: NOTE, INS, ORN, VOL y FX/CMD son editables sobre el stream original. FX admite 1 GLISS, 2 PORTA, 3 SAMPLE POS, 4 ORNAMENT POS, 5 VIBRATO, 8 ENV SLIDE y 9 SPEED; la columna PT3 muestra el estado inline de la fila y no se edita. Para crear una canción nueva con los instrumentos PT3 importados, cambia al modo nativo.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-msx-textsecondary">
              {(songData.externalPt3Data?.length ?? 0).toLocaleString()} bytes / {externalPt3Status}
            </span>
            <Button
              size="sm"
              variant="ghost"
              title="Usar los instrumentos PT3 importados en una canción nueva. Se conserva la tabla de notas, pero los efectos de patrón PT3 (glissando, delay y slide de envelope) no pasan al modo nativo."
              onClick={() => {
                externalPt3PlayerRef.current?.stop();
                externalPt3PlayerRef.current?.close();
                externalPt3PlayerRef.current = null;
                setIsPlaying(false);
                setExternalPt3Status('idle');
                onUpdate(toNativeTrackerSong(songData));
              }}
            >
              Componer música nueva
            </Button>
          </div>
        </div>
      )}
      {/* Rejected edits report here. The other copy of this message lives in the
          compact-player branch above, which only renders for imports that have
          no decoded rows -- so in the pattern grid a refused keystroke used to
          vanish with no explanation at all. */}
      {songData.playbackBackend === 'external-pt3' && songData.patterns.length > 0 && externalPt3Error && (
        <div
          role="alert"
          className="flex flex-shrink-0 items-start gap-2 border-b border-msx-warning/70 bg-msx-warning/10 px-3 py-1.5 text-[0.68rem] text-msx-warning"
        >
          <span className="font-bold uppercase">Edición rechazada</span>
          <span className="flex-grow text-msx-textprimary">{externalPt3Error}</span>
          <button
            type="button"
            aria-label="Descartar el aviso"
            className="px-1 font-bold text-msx-warning hover:text-msx-textprimary"
            onClick={() => setExternalPt3Error(null)}
          >
            ×
          </button>
        </div>
      )}
      <div className="min-h-0 flex flex-grow overflow-hidden"> {/* Main content area (scrollable) */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-msx-border bg-msx-panelbg/55 p-2 text-xs shadow-[6px_0_18px_rgba(0,0,0,0.22)]"> {/* Left panels column */}
          <div className="mb-2 flex items-center justify-between border-b border-msx-border/70 pb-2">
            <div>
              <div className="text-[0.62rem] uppercase tracking-wider text-msx-textsecondary">Song Map</div>
              <div className="font-mono text-[0.68rem] text-msx-highlight">{channels.length} channels / {currentPattern.numRows} rows</div>
            </div>
            <div className="rounded border border-msx-border bg-msx-bgcolor px-2 py-1 font-mono text-[0.65rem] text-msx-textprimary">
              {songData.soundChip}
            </div>
          </div>
          <div className="flex flex-col space-y-2">
          <PatternOrderPanel
            order={songData.order || []} patterns={songData.patterns}
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
            instruments={songData.instruments || []} activeInstrumentId={activeInstrumentId}
            onSetActiveInstrumentId={handleSelectInstrument} onOpenInstrumentModal={handleOpenInstrumentModal}
            soundChip={songData.soundChip} onOpenWaveformModal={handleOpenWaveformModal}
            onDeleteInstrument={handleDeleteInstrument}
            onExtractPT3Instruments={songData.soundChip === 'SCC' ? undefined : handleExtractPT3Instruments}
            onAddFactoryPT3Kit={songData.soundChip === 'SCC' ? undefined : handleAddFactoryPT3Kit}
            pt3ImportFeedback={pt3ImportFeedback}
          />
          <OrnamentsPanel
            ornaments={songData.ornaments || []}
            activeOrnamentId={activeOrnamentId}
            onSetActiveOrnamentId={setActiveOrnamentId}
            onOpenOrnamentModal={handleOpenOrnamentModal}
          />
          <MidiInputPanel
            midi={midi}
            octaveOffset={midiOctaveOffset}
            onOctaveOffsetChange={setMidiOctaveOffset}
            channelMode={midiChannelMode}
            onChannelModeChange={setMidiChannelMode}
            fixedChannelIndex={midiFixedChannelIndex}
            onFixedChannelIndexChange={setMidiFixedChannelIndex}
            channelLabels={channels as unknown as string[]}
            onActivateAudio={() => { void synthesizer?.ensureAudioContext(); }}
            actionMap={midiActionMap}
            learnTarget={midiLearnTarget}
            onLearnAction={setMidiLearnTarget}
            onClearAction={clearMidiAction}
            recArmed={midiRecArmed}
            velocityToVolume={midiVelocityToVolume}
            onVelocityToVolumeChange={setMidiVelocityToVolume}
          />
          </div>
        </div>

        <div className="min-w-0 flex flex-grow flex-col overflow-hidden">
          <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-msx-border bg-msx-bgcolor/80 px-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-[0.62rem] uppercase tracking-wider text-msx-textsecondary">Pattern Editor</span>
              <span className="font-mono text-msx-highlight">{currentPattern.name}</span>
              <span className="rounded border border-msx-border bg-black/20 px-2 py-0.5 font-mono text-[0.62rem] text-msx-textsecondary">#{String(activePatternStorageIndex).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[0.68rem] text-msx-textsecondary">
              {songData.soundChip !== 'SCC' && (
                <span className="rounded border border-msx-highlight/50 bg-msx-highlight/10 px-2 py-0.5 text-msx-highlight" title="Las canciones PSG/PT3 usan las tres voces AY, igual que Vortex Tracker.">
                  PSG musical A/B/C
                </span>
              )}
              <span className="rounded border border-msx-border/70 bg-black/20 px-2 py-0.5">Order {String(songData.currentPatternIndexInOrder).padStart(2, '0')}</span>
              <span className="rounded border border-msx-border/70 bg-black/20 px-2 py-0.5">BPM {songData.bpm}</span>
              <span className="rounded border border-msx-border/70 bg-black/20 px-2 py-0.5">Speed {songData.speed}</span>
            </div>
          </div>
          {songData.soundChip !== 'SCC' && (
            <PsgOscilloscopePanel
              channels={channels}
              mutedChannels={mutedChannels}
              synthesizer={songData.playbackBackend === 'external-pt3'
                ? externalPt3PlayerRef.current
                : synthesizer}
              isPlaying={isPlaying}
              sourcePT3Mode={songData.playbackBackend === 'external-pt3'}
              gridScrollRef={patternEditorRef}
              onToggleMute={handleToggleChannelMute}
              onClearChannel={handleClearChannel}
            />
          )}
          <PatternEditorGrid
            currentPattern={currentPattern} focusedCell={focusedCell}
            isPlaying={isPlaying} playbackRow={playbackRow}
            onCellChange={handleCellChange}
            onCellFocus={(rIdx, chId, fld) => setFocusedCell({ rowIndex: rIdx, channelId: chId, field: fld })}
            onGridKeyDown={handleGridKeyDown} patternEditorRef={patternEditorRef}
            channels={channels}
            sourcePT3Mode={songData.playbackBackend === 'external-pt3'}
          />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-msx-border bg-msx-panelbg/80"> {/* Piano controls, fixed height */}
        <TrackerPianoControls
          pressedKeys={activePianoKeys}
          pressedKeyLevels={activePianoKeyLevels}
          keyboardOctaveOffset={keyboardOctaveOffset}
          onPianoKeyPress={handleVirtualPianoKeyPress} onOctaveChange={setKeyboardOctaveOffset}
          minOctave={PT3_KEYBOARD_OCTAVE_MIN_MAX.min} maxOctave={PT3_KEYBOARD_OCTAVE_MIN_MAX.max}
        />
      </div>

      <InstrumentEditorModal
        isOpen={isInstrumentModalOpen} onClose={() => { setIsInstrumentModalOpen(false); setEditingInstrument(null); }}
        editingInstrument={editingInstrument} instrumentModalBuffer={instrumentModalBuffer}
        onInstrumentModalBufferChange={handleInstrumentModalFieldChange} onSubmit={handleInstrumentModalSubmit}
        synthesizer={synthesizer}
        ornaments={songData.ornaments}
      />

      <WaveformEditorModal
        isOpen={isWaveformModalOpen}
        onClose={() => { setIsWaveformModalOpen(false); setEditingSccInstrument(null); }}
        instrument={editingSccInstrument}
        onSave={handleSaveSccInstrument}
      />

      <OrnamentEditorModal
        isOpen={isOrnamentModalOpen} onClose={() => { setIsOrnamentModalOpen(false); setEditingOrnament(null); }}
        editingOrnament={editingOrnament} ornamentModalBuffer={ornamentModalBuffer}
        onOrnamentModalBufferChange={handleOrnamentModalFieldChange} onSubmit={handleOrnamentModalSubmit}
      />

      <LogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={logMessages}
      />
    </div>
  );
};


import { TrackerSongData, TrackerPattern, TrackerRow, TrackerCell, PT3Instrument, PT3Ornament } from '../../types';
import { PT3_DEFAULT_VIBRATO_TABLE, PT3_ORNAMENT_LENGTH, PT3_INSTRUMENT_DATA_SIZE, PT3_NOTE_NAMES, PT3_CHANNELS } from '../../constants';
// Removed PT3_EFFECT_COMMAND_MAP, PT3_ORNAMENT_EFFECT_CODE from imports

const HEADER_SIZE = 100;
const PATTERN_ORDER_TABLE_SIZE = 512; // 128 entries * 4 bytes
const ORNAMENT_POINTER_TABLE_SIZE = 32; // 16 pointers * 2 bytes
const INSTRUMENT_POINTER_TABLE_SIZE = 32; // 16 pointers * 2 bytes

const serializeEnvelopeData = (envelope: number[] | undefined, length: number): Int8Array => {
  const envelopeBytes = new Int8Array(length);
  for (let i = 0; i < length; i++) {
    if (envelope && i < envelope.length) {
      let val = envelope[i];
      if (val < -128) val = -128;
      if (val > 127) val = 127;
      envelopeBytes[i] = val;
    } else {
      envelopeBytes[i] = 0;
    }
  }
  return envelopeBytes;
};

// Helper to map tracker note string to PT3 0-11 value, or special markers
const mapTrackerNoteToPt3ByteValue = (note: string | null): number => {
    if (note === null || note === "---") return 0xFF; // No note change / Keep previous
    if (note === "===") return 0xFE; // Note cut / Key off

    const notePart = note.substring(0, 2).toUpperCase();
    const noteIndex = PT3_NOTE_NAMES.indexOf(notePart);
    
    if (noteIndex !== -1) return noteIndex;
    
    // Fallback for single char notes like C4 (becomes C-)
    const singleCharNote = note.substring(0,1).toUpperCase() + "-";
    const singleCharIndex = PT3_NOTE_NAMES.indexOf(singleCharNote);
    if (singleCharIndex !== -1) return singleCharIndex;

    return 0xFF; // Default to no note change if parsing fails
};

// mapEffectCmdCharToCode function removed as it's no longer used.

export const serializePT3File = (songData: TrackerSongData): ArrayBuffer => {
  const textEncoder = new TextEncoder();

  let currentFileContentOffset = HEADER_SIZE + PATTERN_ORDER_TABLE_SIZE;

  // --- Prepare Ornament Data ---
  const validOrnaments = songData.ornaments
    .filter(orn => orn.id >= 1 && orn.id <= 15)
    .sort((a, b) => a.id - b.id);
  const ornamentDataBlocksBytes: Uint8Array[] = [];
  const ornamentPointersAbsFileOffset: number[] = Array(16).fill(0);
  const ornamentPointerTableStartFileOffset = currentFileContentOffset;
  currentFileContentOffset += ORNAMENT_POINTER_TABLE_SIZE;
  validOrnaments.forEach(ornament => {
    const ornamentSBytes = serializeEnvelopeData(ornament.data, PT3_ORNAMENT_LENGTH);
    ornamentDataBlocksBytes.push(new Uint8Array(ornamentSBytes.buffer));
    if (ornament.id >=1 && ornament.id <= 15) ornamentPointersAbsFileOffset[ornament.id] = currentFileContentOffset;
    currentFileContentOffset += PT3_ORNAMENT_LENGTH;
  });

  // --- Prepare Instrument Data ---
  const validInstruments = songData.instruments
    .filter(instr => instr.id >= 1 && instr.id <= 15)
    .sort((a, b) => a.id - b.id);
  const instrumentDataBlocksBytes: Uint8Array[] = [];
  const instrumentPointersAbsFileOffset: number[] = Array(16).fill(0);
  const instrumentPointerTableStartFileOffset = currentFileContentOffset;
  currentFileContentOffset += INSTRUMENT_POINTER_TABLE_SIZE;
  validInstruments.forEach(instrument => {
    const instrumentBlock = new ArrayBuffer(PT3_INSTRUMENT_DATA_SIZE);
    const instrView = new DataView(instrumentBlock);
    instrView.setUint8(0, (instrument.volumeLoop !== undefined && instrument.volumeLoop >= 0 && instrument.volumeLoop < 32) ? instrument.volumeLoop : 255);
    instrView.setUint8(1, (instrument.toneLoop !== undefined && instrument.toneLoop >=0 && instrument.toneLoop < 32) ? instrument.toneLoop : 255);
    const isHardwareEnvelopeUsed = (instrument.ayEnvelopeShape !== undefined && instrument.ayEnvelopeShape >= 0 && instrument.ayEnvelopeShape <= 15);
    const firstVolPoint = instrument.volumeEnvelope?.[0];
    const volumePart = isHardwareEnvelopeUsed ? 0x0F : ((firstVolPoint !== undefined ? (firstVolPoint & 0x0F) : 0x0F));
    const toneEnableForInstrument = (instrument.ayToneEnabled === undefined ? true : instrument.ayToneEnabled) ? 1 : 0;
    const noiseEnableForInstrument = (instrument.ayNoiseEnabled === undefined ? false : instrument.ayNoiseEnabled) ? 1 : 0;
    const mixerByte = volumePart | (toneEnableForInstrument << 4) | (noiseEnableForInstrument << 5) | (isHardwareEnvelopeUsed ? (1 << 6) : 0);
    instrView.setUint8(2, mixerByte);
    instrView.setUint8(3, (isHardwareEnvelopeUsed ? instrument.ayEnvelopeShape! : 0) & 0x0F);
    const volEnvBytes = serializeEnvelopeData(instrument.volumeEnvelope, 32);
    for(let i=0; i<32; i++) instrView.setInt8(4 + i, volEnvBytes[i]);
    const toneEnvBytes = serializeEnvelopeData(instrument.toneEnvelope, 32);
    for(let i=0; i<32; i++) instrView.setInt8(36 + i, toneEnvBytes[i]);
    instrumentDataBlocksBytes.push(new Uint8Array(instrumentBlock));
    if (instrument.id >=1 && instrument.id <= 15) instrumentPointersAbsFileOffset[instrument.id] = currentFileContentOffset;
    currentFileContentOffset += PT3_INSTRUMENT_DATA_SIZE;
  });

  // --- Prepare Pattern Data ---
  const channelADataBytes: number[] = [];
  const channelBDataBytes: number[] = [];
  const channelCDataBytes: number[] = [];
  const ASM_NOTE_OFF = 0xFF; // Represents '---' or no note


  songData.patterns.forEach(pattern => {
    PT3_CHANNELS.forEach(chId => {
      const channelBuffer = chId === 'A' ? channelADataBytes : (chId === 'B' ? channelBDataBytes : channelCDataBytes);
      // Simplified lastState for only relevant fields
      let lastState = { noteVal: ASM_NOTE_OFF, instrumentId: 0, volume: 0, ornamentId: 0 };
      
      for (let r = 0; r < pattern.numRows; r++) {
        const cell = pattern.rows[r][chId];
        let flagsByte = 0x00;
        const dataBytesForStep: number[] = [];

        const pt3NoteVal = mapTrackerNoteToPt3ByteValue(cell.note);
        const instrumentId = cell.instrument !== null ? Math.min(15, Math.max(0, cell.instrument)) : 0;
        
        // Note and Instrument part
        // Check if note OR instrument changed, or if a note is explicitly set (even if same as last)
        if (cell.note !== "---" && (pt3NoteVal !== lastState.noteVal || instrumentId !== lastState.instrumentId)) {
            flagsByte |= 0x01; // Note and Instrument present flag
            // This is a custom format for the demo: byte for note, byte for instrument
            dataBytesForStep.push(pt3NoteVal); 
            dataBytesForStep.push(instrumentId);
            
            lastState.noteVal = (pt3NoteVal !== ASM_NOTE_OFF) ? pt3NoteVal : lastState.noteVal;
            lastState.instrumentId = instrumentId;
        }

        // Volume part
        let volumeVal = cell.volume;
        if (cell.note === "===" && volumeVal === null) volumeVal = 0; // Note cut implies volume 0 if not set
        if (volumeVal !== null && volumeVal !== lastState.volume) {
            flagsByte |= 0x02; // Volume present flag
            dataBytesForStep.push(volumeVal & 0x0F);
            lastState.volume = volumeVal;
        }

        // Ornament part (using the "effect" flag and bytes)
        const currentOrnamentId = cell.ornament !== null ? Math.min(15, Math.max(0, cell.ornament)) : 0;
        if (currentOrnamentId !== lastState.ornamentId) { 
            flagsByte |= 0x04; // Effect flag (used for ornament)
            dataBytesForStep.push(0x0F); // Hardcoded effect code for "Set Ornament"
            dataBytesForStep.push(currentOrnamentId); // Ornament ID is the parameter
            lastState.ornamentId = currentOrnamentId;
        } else if (currentOrnamentId === 0 && lastState.ornamentId !== 0 && cell.ornament !== null) { // Explicitly set ornament to none
            flagsByte |= 0x04;
            dataBytesForStep.push(0x0F); 
            dataBytesForStep.push(0); 
            lastState.ornamentId = 0;
        }
        
        // Push to channel buffer
        if (flagsByte === 0x00) {
            channelBuffer.push(0x00); // No changes, push single 0 byte
        } else {
            channelBuffer.push(flagsByte);
            channelBuffer.push(...dataBytesForStep);
        }
      }
      channelBuffer.push(0xFF); // End of pattern marker for this channel
    });
  });

  const patternDataStartFileOffset = currentFileContentOffset;
  const offsetChA = patternDataStartFileOffset;
  const offsetChB = offsetChA + channelADataBytes.length;
  const offsetChC = offsetChB + channelBDataBytes.length;
  const totalFileSize = offsetChC + channelCDataBytes.length;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);
  let finalWriteOffset = 0;

  // --- Write Header (100 bytes) ---
  const title = songData.title || songData.name || "Untitled PT3";
  const titleBytes = textEncoder.encode(title.substring(0, 15));
  for (let i = 0; i < 16; i++) view.setUint8(finalWriteOffset + i, i < titleBytes.length ? titleBytes[i] : 0);
  view.setUint8(finalWriteOffset + 0x10, 0);
  view.setUint8(finalWriteOffset + 0x11, Math.min(255, songData.patterns.length));
  view.setUint8(finalWriteOffset + 0x12, Math.min(128, songData.order.length));
  view.setUint8(finalWriteOffset + 0x13, 128);
  view.setUint16(finalWriteOffset + 0x14, offsetChA, true); // Ch A Pattern Pointer
  view.setUint16(finalWriteOffset + 0x16, offsetChB, true); // Ch B Pattern Pointer
  view.setUint16(finalWriteOffset + 0x18, offsetChC, true); // Ch C Pattern Pointer
  view.setUint16(finalWriteOffset + 0x1A, 0, true); // Ch D Pattern Pointer (unused)
  view.setUint16(finalWriteOffset + 0x1C, ornamentPointerTableStartFileOffset, true);
  view.setUint16(finalWriteOffset + 0x1E, instrumentPointerTableStartFileOffset, true);
  view.setUint8(finalWriteOffset + 0x1F, songData.speed & 0x1F);
  PT3_DEFAULT_VIBRATO_TABLE.forEach((val, i) => view.setUint8(finalWriteOffset + 0x20 + i, val));
  for (let i = 0x40; i <= 0x5E; i++) view.setUint8(finalWriteOffset + i, 0);
  view.setUint8(finalWriteOffset + 0x5F, songData.restartPosition);
  for (let i = 0x60; i < HEADER_SIZE; i++) view.setUint8(finalWriteOffset + i, 0);
  finalWriteOffset += HEADER_SIZE;

  // --- Write Pattern Order Table (512 bytes) ---
  for (let i = 0; i < 128; i++) {
    const baseOffset = finalWriteOffset + i * 4;
    if (i < songData.order.length) {
      const pIdx = songData.order[i];
      view.setUint8(baseOffset + 0, pIdx); view.setUint8(baseOffset + 1, pIdx); view.setUint8(baseOffset + 2, pIdx); view.setUint8(baseOffset + 3, 0);
    } else {
      view.setUint32(baseOffset, 0, true);
    }
  }
  finalWriteOffset += PATTERN_ORDER_TABLE_SIZE;

  // --- Write Ornament Pointer Table & Data ---
  for (let i = 0; i < 16; i++) view.setUint16(finalWriteOffset + i * 2, ornamentPointersAbsFileOffset[i], true);
  finalWriteOffset += ORNAMENT_POINTER_TABLE_SIZE;
  ornamentDataBlocksBytes.forEach(block => { block.forEach(b => view.setUint8(finalWriteOffset++, b)); });

  // --- Write Instrument Pointer Table & Data ---
  for (let i = 0; i < 16; i++) view.setUint16(finalWriteOffset + i * 2, instrumentPointersAbsFileOffset[i], true);
  finalWriteOffset += INSTRUMENT_POINTER_TABLE_SIZE;
  instrumentDataBlocksBytes.forEach(block => { block.forEach(b => view.setUint8(finalWriteOffset++, b)); });
  
  // --- Write Pattern Data ---
  channelADataBytes.forEach(b => view.setUint8(finalWriteOffset++, b));
  channelBDataBytes.forEach(b => view.setUint8(finalWriteOffset++, b));
  channelCDataBytes.forEach(b => view.setUint8(finalWriteOffset++, b));

  return buffer;
};

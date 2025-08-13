

import { TrackerSongData, PT3Instrument, PT3Ornament, TrackerCell, PT3ChannelId } from '../../types';
import { PT3_NOTE_NAMES, PT3_CHANNELS } from '../../constants'; // Removed PT3_EFFECT_COMMAND_MAP

// Special byte values for notes in ASM export
const ASM_NOTE_OFF = 255; // Represents '---'
const ASM_NOTE_CUT = 254; // Represents '==='

// Helper to convert "C-4" style note to a single byte (0-95, or special)
const noteStringToAsmByte = (note: string | null): number => {
    if (note === null || note === "---") return ASM_NOTE_OFF;
    if (note === "===") return ASM_NOTE_CUT;

    const match = note.toUpperCase().match(/^([A-G](?:#|-)?)([0-7])$/);
    if (!match) return ASM_NOTE_OFF; // Invalid note format

    const noteBase = match[1];
    const octave = parseInt(match[2], 10);

    const noteIndexInOctave = PT3_NOTE_NAMES.indexOf(noteBase);
    if (noteIndexInOctave === -1) return ASM_NOTE_OFF; // Should not happen if NOTE_REGEX is good

    return (octave * 12) + noteIndexInOctave; // 0-95 for C-0 to B-7
};

// formatEffectForAsm removed as effects are removed

export const generateTrackerSongASM = (songData: TrackerSongData): string => {
    let asm = `;; PT3 Song Export: ${songData.name}\n`;
    asm += `;; Title: ${songData.title || 'N/A'}\n`;
    asm += `;; Author: ${songData.author || 'N/A'}\n`;
    asm += `;; Exported on: ${new Date().toISOString()}\n\n`;

    const safeLabelPrefix = (songData.name || "MySong").replace(/[^a-zA-Z0-9_]/g, '_');

    // Song Metadata
    asm += `${safeLabelPrefix}_BPM DEFW ${songData.bpm}\n`;
    asm += `${safeLabelPrefix}_SPEED DB ${songData.speed}\n`;
    asm += `${safeLabelPrefix}_GLOBAL_VOL DB ${songData.globalVolume}\n`;
    asm += `${safeLabelPrefix}_LEN_PATTERNS DB ${songData.lengthInPatterns}\n`;
    asm += `${safeLabelPrefix}_RESTART_POS DB ${songData.restartPosition}\n\n`;
    
    if (songData.ayHardwareEnvelopePeriod !== undefined) {
        asm += `${safeLabelPrefix}_AY_ENV_PERIOD DEFW ${songData.ayHardwareEnvelopePeriod}\n\n`;
    }


    // Instruments (basic info as comments)
    asm += `;; --- INSTRUMENTS (${songData.instruments.length}) ---\n`;
    if (songData.instruments.length > 0) {
        songData.instruments.forEach(instr => {
            asm += `;; Instrument ${String(instr.id).padStart(2, '0')}: ${instr.name}\n`;
            if (instr.volumeEnvelope && instr.volumeEnvelope.length > 0) asm += `;;   Vol Env: ${instr.volumeEnvelope.join(',')}${instr.volumeLoop !== undefined ? ` Loop: ${instr.volumeLoop}` : ''}\n`;
            if (instr.toneEnvelope && instr.toneEnvelope.length > 0) asm += `;;   Tone Env: ${instr.toneEnvelope.join(',')}${instr.toneLoop !== undefined ? ` Loop: ${instr.toneLoop}`: ''}\n`;
            if (instr.ayEnvelopeShape !== undefined) asm += `;;   AY Env Shape: ${instr.ayEnvelopeShape} (#${instr.ayEnvelopeShape.toString(16).toUpperCase()})\n`;
            asm += `;;   AY Tone: ${instr.ayToneEnabled === undefined ? true : instr.ayToneEnabled}, AY Noise: ${!!instr.ayNoiseEnabled}\n`;
        });
    } else {
        asm += `;; No instruments defined.\n`;
    }
    asm += '\n';

    // Ornaments (basic info as comments)
    asm += `;; --- ORNAMENTS (${songData.ornaments.length}) ---\n`;
    if (songData.ornaments.length > 0) {
        songData.ornaments.forEach(orn => {
            asm += `;; Ornament ${String(orn.id).padStart(2, '0')}: ${orn.name}\n`;
            if (orn.data && orn.data.length > 0) asm += `;;   Data: ${orn.data.join(',')}${orn.loopPosition !== undefined ? ` Loop: ${orn.loopPosition}` : ''}\n`;
        });
    } else {
        asm += `;; No ornaments defined.\n`;
    }
    asm += '\n';
    
    // Order List
    asm += `${safeLabelPrefix}_ORDER_LIST:\n`;
    for (let i = 0; i < songData.order.length; i += 16) {
        const chunk = songData.order.slice(i, i + 16);
        asm += `    DB ${chunk.map(pIdx => String(pIdx)).join(',')}\n`;
    }
    asm += '\n';

    // Patterns
    asm += `;; --- PATTERNS (${songData.patterns.length}) ---\n`;
    songData.patterns.forEach((pattern, pIdx) => {
        asm += `${safeLabelPrefix}_PATTERN_${pIdx}_DATA: ; ${pattern.name}, ${pattern.numRows} rows\n`;
        pattern.rows.forEach((row, rIdx) => {
            asm += `    ; Row ${String(rIdx).padStart(2, '0')}\n`;
            PT3_CHANNELS.forEach(chId => {
                const cell = row[chId];
                const noteByte = noteStringToAsmByte(cell.note);
                const instrByte = cell.instrument !== null ? cell.instrument : 0; // 0 for no instrument
                const ornByte = cell.ornament !== null ? cell.ornament : 0; // 0 for no ornament
                const volByte = cell.volume !== null ? cell.volume : 0xFF; // FF for no volume change
                
                // Removed effectCmdByte and effectValByte
                asm += `    DB ${noteByte}, ${instrByte}, ${ornByte}, ${volByte} ; Chan ${chId}\n`;
            });
        });
        asm += '\n';
    });

    asm += `;; End of PT3 Song Export: ${songData.name}\n`;
    return asm;
};

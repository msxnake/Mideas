import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildPT3MusicBlock } from '../../utils/msxGenerator/generators/soundGenerator';
import { buildExternalPT3WorkspaceAsm } from '../../utils/msxGenerator/generators/variablesGenerator';
import { createBlankPT3Song } from '../../components/utils/pt3Recording';
import { createMusicJsonPackage, normalizeImportedMusic } from '../../utils/trackerMusicJson';
import { PT3AudioTransport } from '../../components/utils/pt3AudioTransport';

const original = { ...createBlankPT3Song(), id: 'pt3-rate', name: 'PT3 Rate' };
const slow = { ...original, pt3Force50Hz: true };
const imported = normalizeImportedMusic(createMusicJsonPackage(slow), { id: 'destination', name: 'Destination' });
assert.equal(imported.pt3Force50Hz, true, 'Music JSON round-trip retains 50 Hz');
assert.deepEqual(imported.externalPt3Data, original.externalPt3Data, 'Clock setting never rewrites PT3 bytes');
assert.equal(normalizeImportedMusic(createMusicJsonPackage({ ...slow, pt3Force50Hz: false }), original).pt3Force50Hz, false);

// The transport tracks real elapsed time while loop/recording coordinates stay in PT3 frames.
const transport = new PT3AudioTransport(new Uint8Array());
const state = transport as any;
state.context = { currentTime: 1 };
state.duration = 2; // 100 decoded frames at 50 Hz.
state.playing = true;
state.anchor = { frame: 0, contextTime: 0 };
assert.equal(transport.getCurrentTime(), 1);
transport.setPlaybackHz(60);
assert.equal(transport.getPlaybackHz(), 60);
assert.equal(transport.getCurrentTime() * 60, 50, 'Live rate change holds musical frame');
assert.equal(state.duration * 60, 100, 'Duration is recomputed for the same stream');
state.context.currentTime = 1.5;
assert.equal(transport.getCurrentTime() * 60, 80);
transport.setPlaybackHz(50);
assert.equal(transport.getCurrentTime() * 50, 80);
state.playing = false;
state.context.currentTime = 2;
assert.equal(transport.getCurrentTime() * 50, 80, 'Pause holds position at either rate');

const legacy = buildPT3MusicBlock([original]);
assert(!legacy.includes('music_pt3_50hz_table:'), 'Unconfigured ROMs keep the existing tick path');
const mixed = buildPT3MusicBlock([slow, original], 'simple32k', 'konami', { videoRefreshHz: 60 });
assert(mixed.includes('music_pt3_50hz_table:\n    DB 1,0'), 'Clock flag is per asset');
const gate = mixed.slice(mixed.indexOf('    ; INPUT: none.'), mixed.indexOf('    ; Check if song ended'));
assert(!/\b(call|push|pop|di|ei|out|ld a, i)\b/.test(gate), 'Divider changes neither stack, IRQ nor hardware state');
assert(!/\b(bc|de|hl|ix|iy)\b/i.test(gate.split('\n').filter(line => !line.trimStart().startsWith(';')).join('\n')),
  'Divider preserves caller registers other than AF');
assert(buildPT3MusicBlock([slow]).includes('ld a, (isComputer50HzOr60Hz)'), 'Generic ROM uses boot PAL/NTSC detection');
assert(buildPT3MusicBlock([slow], 'simple32k', 'konami', { videoRefreshHz: 50 }).includes('jp .pt3_50hz_ready'),
  'PAL does not skip ticks');

// Produce a small executable harness for Glass/OpenMSX. It runs the actual generated
// wrappers and replayer, counting PT3_PLAY calls through a debugger breakpoint.
const out = resolve('server/temp/pt3-50hz');
mkdirSync(out, { recursive: true });
const workspace = buildExternalPT3WorkspaceAsm(0xC100);
assert(workspace.asm.includes('music_pt3_50hz_counter EQU #C340'));
assert.equal(workspace.nextFree, 0xC342, 'Clock bytes follow the whole PT3 volume table');
const probeAsm = `    org #4000
    db #41,#42
    dw probe_boot,0,0,0,0,0,0
music_active EQU #C000
music_muted EQU #C001
music_loop EQU #C002
music_track_index EQU #C003
isComputer50HzOr60Hz EQU #C004
probe_stage EQU #C005
probe_remaining EQU #C006
${workspace.asm}
probe_boot:
    di
    ld sp, #F300
    xor a
    call #005F
    ld hl, probe_message
probe_print:
    ld a, (hl)
    or a
    jr z, probe_start
    call #00A2
    inc hl
    jr probe_print
probe_start:
    di
    ld a, 1
    ld (isComputer50HzOr60Hz), a
    call music_init_system
    ld a, 1
    ld (probe_stage), a
    xor a
    ld b, 1
    call music_play_track
    call probe_run_frames
    ld a, 2
    ld (probe_stage), a
    ld a, 1
    ld b, 1
    call music_play_track
    call probe_run_frames
    xor a
    ld (isComputer50HzOr60Hz), a
    ld a, 3
    ld (probe_stage), a
    xor a
    ld b, 1
    call music_play_track
    call probe_run_frames
    ld a, 4
    ld (probe_stage), a
probe_done:
    jp probe_done
probe_run_frames:
    ld a, 60
    ld (probe_remaining), a
probe_frame:
    call music_update
    ld a, (probe_remaining)
    dec a
    ld (probe_remaining), a
    jp nz, probe_frame
    ret
probe_message:
    db "PT3 50 Hz timing test",13,10,"NTSC: 50 / 60 ticks",13,10,"PAL:  50 Hz = 60 ticks/60 calls",13,10,0
${buildPT3MusicBlock([slow, original])}
    ds #C000-$, #FF
`;
writeFileSync(resolve(out, 'probe.asm'), probeAsm);
const project = JSON.parse(readFileSync(resolve('test/msx2-walljumper/walljumper_smoke.json'), 'utf8'));
project.name = project.currentProjectName = 'PT3 50 Hz UI';
project.assets.push({ id: original.id, type: 'track', name: original.name, data: original });
writeFileSync(resolve(out, 'ui-project.json'), JSON.stringify(project));
console.log('PASS: clock setting round-trip, live transport position/duration, per-track dispatch, PAL bypass and divider register contract.');

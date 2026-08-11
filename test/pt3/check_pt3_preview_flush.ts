/**
 * Regression contract for silent PT3 note entry.
 *
 * Imported PT3 songs use `pt3-sample` instruments, which are the only ones that
 * do not write the AY registers inside playNote(): they hand a command to the
 * PT3 preview engine. That command used to sit in the queue until the next 50Hz
 * frame tick, and an unrelated React re-render in between reset the driver and
 * dropped it -- typing a note over an imported PT3 song produced no sound.
 *
 * The invariant enforced here: outside row playback, a previewed PT3 note must
 * reach the AY registers synchronously, before any later event can run. During
 * row playback the opposite must hold -- commands ride the frame clock, because
 * flushing per call would add an engine tick to every held voice on a row.
 */
import { AYRegisterSynthesizer } from '../../components/utils/ayRegisterSynthesizer';
import { PT3_FACTORY_INSTRUMENTS } from '../../utils/audio/pt3FactoryInstruments';
import type { PT3Instrument, TrackerSongData } from '../../types';

let failures = 0;
const fail = (message: string): void => {
  failures += 1;
  console.log(`FAIL: ${message}`);
};

// ---------------------------------------------------------------------------
// Minimal WebAudio stub. The frame timer is captured but never fires on its
// own, so anything the registers show has been written synchronously.
// ---------------------------------------------------------------------------
let frameCallback: (() => void) | null = null;

class StubAudioContext {
  public state = 'running';
  public currentTime = 0;
  public destination = {};
  createGain() {
    return { gain: { setValueAtTime: () => {} }, connect: () => {} };
  }
  createScriptProcessor() {
    return { onaudioprocess: null as unknown, connect: () => {} };
  }
  async resume() {
    this.state = 'running';
  }
  async close() {
    this.state = 'closed';
  }
}

(globalThis as any).window = {
  AudioContext: StubAudioContext,
  setInterval: (handler: () => void) => {
    frameCallback = handler;
    return 1;
  },
  clearInterval: () => {
    frameCallback = null;
  },
};

const factoryTemplate = PT3_FACTORY_INSTRUMENTS.find(
  (instrument): instrument is PT3Instrument =>
    (instrument as PT3Instrument).instrumentMode === 'pt3-sample'
    && !!(instrument as PT3Instrument).pt3Sample,
);
if (!factoryTemplate) {
  console.log('FAIL: no pt3-sample instrument in the factory kit; cannot exercise the preview path.');
  process.exit(1);
}
// Factory entries are templates carrying id 0; a song assigns the real id on
// import, and playNote only resolves instrument ids greater than zero.
const sampleInstrument: PT3Instrument = { ...factoryTemplate, id: 1 };

const song = {
  id: 'preview-flush-check',
  name: 'preview flush check',
  soundChip: 'PSG',
  bpm: 125,
  speed: 6,
  ayNoisePeriod: 16,
  ayHardwareEnvelopePeriod: 100,
  instruments: [sampleInstrument],
  ornaments: [],
  patterns: [],
  order: [],
  lengthInPatterns: 0,
  restartPosition: 0,
  currentPatternId: '',
  currentPatternIndexInOrder: 0,
} as unknown as TrackerSongData;

/** Amplitude register for a channel; nonzero means the voice is audible. */
const amplitudeOf = (synth: AYRegisterSynthesizer, channel: number): number =>
  (synth as unknown as { registers: Uint8Array }).registers[8 + channel];

const newSynth = async (): Promise<AYRegisterSynthesizer> => {
  const synth = new AYRegisterSynthesizer(0.5);
  synth.setSongData(song);
  await synth.ensureAudioContext();
  return synth;
};

// --- 1. Preview outside row playback must be audible synchronously ----------
{
  const synth = await newSynth();
  synth.setRowPlaybackActive(false);

  let capturedFrames = 0;
  synth.setPT3FrameCaptureHook(() => { capturedFrames += 1; });

  await synth.playNote(0, 'C-4', sampleInstrument.id, null, 15);

  if (capturedFrames === 0) {
    fail('preview note produced no PT3 engine frame; the command is still queued.');
  }
  if (amplitudeOf(synth, 0) === 0) {
    fail(`preview note left channel A amplitude at 0 (R8=${amplitudeOf(synth, 0)}); it is inaudible.`);
  }
  if (frameCallback === null) {
    fail('frame timer was never installed; the stub does not reflect a live audio context.');
  }
}

// --- 2. ...and must survive a re-render that reaches the synth afterwards ---
// stopAllNotes() is what an incidental re-render used to trigger. Even in that
// worst case the note must already have been written rather than sitting in a
// queue waiting to be discarded.
{
  const synth = await newSynth();
  synth.setRowPlaybackActive(false);

  await synth.playNote(0, 'C-4', sampleInstrument.id, null, 15);
  const beforeReset = amplitudeOf(synth, 0);
  if (beforeReset === 0) {
    fail('preview note was not written before the simulated re-render.');
  }

  // A second preview after the reset must also be heard: the driver state is
  // rebuilt from scratch and the command must not be lost with it.
  synth.stopAllNotes();
  await synth.playNote(1, 'E-4', sampleInstrument.id, null, 15);
  if (amplitudeOf(synth, 1) === 0) {
    fail('preview note after stopAllNotes() was inaudible; the queue was dropped again.');
  }
}

// --- 3. Row playback keeps riding the 50Hz clock ----------------------------
// Fidelity guard for the other direction: while the row scheduler drives the
// synth, a note must NOT flush on arrival, or every held voice gains an extra
// engine tick per note-heavy row.
{
  const synth = await newSynth();
  synth.setRowPlaybackActive(true);

  let capturedFrames = 0;
  synth.setPT3FrameCaptureHook(() => { capturedFrames += 1; });

  await synth.playNote(0, 'C-4', sampleInstrument.id, null, 15);
  if (capturedFrames !== 0) {
    fail(`row playback flushed ${capturedFrames} frame(s) inside playNote; commands must wait for the frame clock.`);
  }

  frameCallback?.();
  if (capturedFrames !== 1) {
    fail(`row playback produced ${capturedFrames} frame(s) on the first tick; expected exactly 1.`);
  }
  if (amplitudeOf(synth, 0) === 0) {
    fail('row playback note stayed silent after its frame tick.');
  }
}

if (failures > 0) {
  console.log(`PT3 preview flush contract: ${failures} failure(s).`);
  process.exit(1);
}
console.log('PT3 preview flush contract: preview flushes synchronously, row playback still rides the 50Hz clock.');

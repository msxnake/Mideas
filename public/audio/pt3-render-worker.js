// Offline PT3 -> PCM renderer for the AI Game Sketch WAV export.
// Same pipeline the tracker uses for external PT3 songs: the bundled Cowbell
// ZXPT3 Z80 player produces one AY register frame per 50/60 Hz tick
// (as in pt3-decode-worker.js) and Cowbell's AYChip synthesizes them
// (as in pt3-worklet.js). Cowbell's license is in /vendor/cowbell/LICENSE.
self.window = self;
importScripts('../vendor/cowbell/cowbell.min.js', '../vendor/cowbell/zx.min.js', '../vendor/cowbell/ay_chip.min.js');

const MODULE_ADDRESS = 18542; // Bundled Cowbell ZXPT3 loader's MODADDR.
const MAX_FRAMES = 50 * 60 * 15; // 15 minutes at 50 Hz: safety cap.

function decodeFrames(source) {
  if (source.length > 65536 - MODULE_ADDRESS) throw new Error('PT3 module is too large for the Cowbell player memory.');
  const memory = new Uint8Array(65536);
  memory.set(Cowbell.Common.PT3PlayerBin, 16384);
  memory.set(source, MODULE_ADDRESS);
  let selectedRegister = 0;
  const registers = new Uint8Array(15);
  const frames = [];
  const cpu = Cowbell.Common.buildZ80({})({
    memory: { read: address => memory[address], write: (address, value) => { memory[address] = value; } },
    ioBus: { write: (port, value) => {
      if ((port & 49154) === 49152) selectedRegister = value;
      else if ((port & 49154) === 32768) {
        registers[selectedRegister] = value;
        if (selectedRegister === 13) registers[14] = 1;
      }
    } },
  });
  cpu.runRoutine(16384, 16128);
  let complete = false;
  for (let frame = 0; frame < MAX_FRAMES; frame++) {
    registers[14] = 0;
    cpu.runRoutine(16389, 16128);
    if (memory[16394] !== 0) { complete = true; break; }
    frames.push(registers.slice());
  }
  if (!frames.length) throw new Error('The PT3 module produced no frames.');
  return { frames, complete };
}

function synthesize(frames, sampleRate, playbackHz) {
  const chip = new Cowbell.Common.AYChip({ frequency: 1773400, stereoMode: 'ACB', sampleRate, mode: 'AY' });
  const samplesPerFrame = sampleRate / playbackHz;
  const total = Math.round(frames.length * samplesPerFrame);
  const mono = new Float32Array(total);
  const left = new Float32Array(Math.ceil(samplesPerFrame) + 1);
  const right = new Float32Array(Math.ceil(samplesPerFrame) + 1);
  const buffer = { getChannelData: index => (index ? right : left) };
  let position = 0;
  let exact = 0;
  frames.forEach((frame, index) => {
    for (let register = 0; register < 13; register++) chip.setRegister(register, frame[register]);
    // R13 restarts the envelope: only write it when the player wrote it.
    if (index === 0 || frame[14]) chip.setRegister(13, frame[13]);
    exact += samplesPerFrame;
    const count = Math.min(total, Math.round(exact)) - position;
    if (count <= 0) return;
    left.fill(0, 0, count);
    right.fill(0, 0, count);
    chip.generate(buffer, 0, count);
    for (let i = 0; i < count; i++) mono[position + i] = (left[i] + right[i]) * 0.5;
    position += count;
  });
  return mono;
}

self.onmessage = ({ data: { id, bytes, sampleRate, playbackHz } }) => {
  try {
    const hz = playbackHz === 60 ? 60 : 50;
    const { frames, complete } = decodeFrames(new Uint8Array(bytes));
    const samples = synthesize(frames, sampleRate || 44100, hz);
    self.postMessage({ id, samples: samples.buffer, frameCount: frames.length, complete, playbackHz: hz }, [samples.buffer]);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};

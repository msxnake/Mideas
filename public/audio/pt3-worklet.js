import './cowbell-worklet-globals.js';
import '../vendor/cowbell/ay_chip.min.js';

/** Continuous 50 Hz register playback with swaps only at a loop boundary. */
class PT3Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.log = new Uint8Array();
    this.pending = null;
    this.revision = 0;
    this.frame = 0;
    this.remaining = 0;
    this.iteration = 0;
    this.playing = false;
    this.loop = null;
    this.muted = 0;
    this.reportSamples = 0;
    this.restoreEnvelope = true;
    this.chips = [0, 1, 2].map(() => new Cowbell.Common.AYChip({ frequency: 1773400, stereoMode: 'ACB', sampleRate, mode: 'AY' }));
    this.scratch = this.chips.map(() => [new Float32Array(128), new Float32Array(128)]);
    this.scopes = this.chips.map(() => new Float32Array(1024));
    this.scopeIndex = 0;
    this.port.onmessage = ({ data }) => {
      switch (data.type) {
        case 'load':
          this.log = new Uint8Array(data.log); this.revision = data.revision;
          this.frame = 0; this.remaining = 0; this.pending = null;
          this.restoreEnvelope = true;
          this.port.postMessage({ type: 'loaded', frames: this.log.length / 15 });
          break;
        case 'queue': this.pending = { log: new Uint8Array(data.log), revision: data.revision }; break;
        case 'play':
          if (this.frame >= this.log.length / 15) { this.frame = 0; this.remaining = 0; }
          this.playing = true; break;
        case 'pause': this.playing = false; break;
        case 'seek':
          this.frame = Math.max(0, Math.min(Math.floor(data.frame), this.log.length / 15 - 1));
          this.remaining = 0; this.iteration = 0; this.restoreEnvelope = true; break;
        case 'loop': this.loop = data.range; break;
        case 'mute': this.muted = data.mask; break;
      }
      this.report();
    };
  }

  report(contextOffset = 0) {
    // frame is the next register frame while remaining > 0.
    const position = this.remaining > 0 ? this.frame - this.remaining / (sampleRate / 50) : this.frame;
    this.port.postMessage({ type: 'position', frame: position, contextTime: currentTime + contextOffset,
      playing: this.playing, iteration: this.iteration, revision: this.revision });
  }

  nextFrame() {
    const count = this.log.length / 15;
    const end = this.loop ? Math.min(this.loop.endFrame, count) : count;
    if (this.frame >= end) {
      if (!this.loop) { this.playing = false; this.port.postMessage({ type: 'ended' }); return false; }
      if (this.pending) {
        this.log = this.pending.log; this.revision = this.pending.revision; this.pending = null;
      }
      this.frame = Math.max(0, Math.min(this.loop.startFrame, this.log.length / 15 - 1));
      this.iteration++;
      this.port.postMessage({ type: 'loop', iteration: this.iteration, revision: this.revision });
    }
    const offset = this.frame * 15;
    this.chips.forEach((chip, channel) => {
      for (let register = 0; register < 13; register++) {
        chip.setRegister(register, register >= 8 && register <= 10 && register !== channel + 8 ? 0 : this.log[offset + register]);
      }
      if (this.restoreEnvelope || this.log[offset + 14]) chip.setRegister(13, this.log[offset + 13]);
    });
    this.restoreEnvelope = false;
    this.frame++;
    this.remaining += sampleRate / 50;
    return true;
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output?.length || !this.playing || !this.log.length) return true;
    const length = output[0].length;
    let offset = 0;
    while (offset < length) {
      if (this.remaining <= 0 && !this.nextFrame()) break;
      const size = Math.min(length - offset, Math.ceil(this.remaining));
      this.chips.forEach((chip, channel) => {
        const scratch = this.scratch[channel];
        chip.generate({ getChannelData: index => scratch[index] }, 0, size);
        for (let i = 0; i < size; i++) {
          this.scopes[channel][(this.scopeIndex + offset + i) % 1024] = (scratch[0][i] + scratch[1][i]) * 0.5;
          if (!(this.muted & (1 << channel))) {
            output[0][offset + i] += scratch[0][i];
            if (output[1]) output[1][offset + i] += scratch[1][i];
          }
        }
      });
      this.remaining -= size;
      offset += size;
    }
    this.scopeIndex = (this.scopeIndex + length) % 1024;
    this.reportSamples += length;
    if (this.reportSamples >= sampleRate / 10) {
      this.reportSamples = 0;
      this.report(length / sampleRate);
      this.port.postMessage({ type: 'scopes', scopes: this.scopes.map(scope => {
        const ordered = new Float32Array(1024);
        ordered.set(scope.subarray(this.scopeIndex)); ordered.set(scope.subarray(0, this.scopeIndex), 1024 - this.scopeIndex);
        return ordered;
      }) });
    }
    return true;
  }
}
registerProcessor('mideas-pt3', PT3Processor);

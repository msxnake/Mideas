import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('public/audio/pt3-worklet.js', 'utf8').replace(/^import .*;\r?\n/gm, '');
const chipSource = readFileSync('public/vendor/cowbell/ay_chip.min.js', 'utf8');
function create(rate) {
  let Processor;
  const messages = [];
  const scope = { sampleRate: rate, currentTime: 0, Cowbell: { Common: {}, Player: {} },
    AudioWorkletProcessor: class { port = { postMessage: message => messages.push(message), onmessage: null }; },
    registerProcessor: (_name, implementation) => { Processor = implementation; },
  };
  vm.createContext(scope); vm.runInContext(chipSource, scope); vm.runInContext(source, scope);
  const processor = new Processor();
  return { processor, scope, messages, send: data => processor.port.onmessage({ data }) };
}
const oldFrame = [100,0,200,0,0,0,0,0x38,0,15,0,0,0,0,0];
const newFrame = [100,0,200,0,0,0,0,0x38,15,15,0,0,0,0,0];
const makeLog = frames => new Uint8Array(frames.flat()).buffer;
for (const rate of [44100, 48000, 11025]) {
  const looping = create(rate), reference = create(rate);
  looping.send({ type: 'load', log: makeLog([oldFrame,oldFrame]), revision: 0 });
  looping.send({ type: 'loop', range: { startFrame: 0, endFrame: 2 } });
  looping.send({ type: 'queue', log: makeLog([newFrame,newFrame]), revision: 1 });
  reference.send({ type: 'load', log: makeLog([oldFrame,oldFrame,...Array(50).fill(newFrame)]), revision: 0 });
  looping.send({ type: 'play' }); reference.send({ type: 'play' });
  const blocks = Math.ceil(rate * 0.2 / 128);
  for (let block=0;block<blocks;block++) {
    looping.scope.currentTime = reference.scope.currentTime = block * 128 / rate;
    const a=[new Float32Array(128),new Float32Array(128)];
    const b=[new Float32Array(128),new Float32Array(128)];
    looping.processor.process([], [a]); reference.processor.process([], [b]);
    assert.deepEqual(a,b,`loop swap introduces no silence or AY phase reset at ${rate} Hz, block ${block}`);
  }
  assert.equal(looping.processor.revision,1);
  assert(looping.processor.iteration>=4);
  assert(looping.messages.some(message=>message.type==='loop' && message.revision===1));
  looping.send({ type: 'pause' });
  const silence=[new Float32Array(128),new Float32Array(128)]; looping.processor.process([], [silence]);
  assert(silence.every(channel=>channel.every(value=>value===0)));
  const frameBefore=looping.processor.frame; looping.processor.process([], [silence]);
  assert.equal(looping.processor.frame,frameBefore,'pause freezes the musical clock');
}
console.log('PASS: AudioWorklet loop swaps match continuous reference audio sample-for-sample at 44.1/48/11.025 kHz; pause freezes the clock.');

// The same AY register stream must run at either command rate without pitch changes.
for (const rate of [44100, 48000, 11025]) {
  const slow = create(rate), fast = create(rate);
  for (const [player, hz] of [[slow, 50], [fast, 60]]) {
    player.send({ type: 'load', log: makeLog(Array(120).fill(oldFrame)), revision: 0 });
    player.send({ type: 'rate', hz });
    player.send({ type: 'play' });
  }
  for (let offset = 0; offset < rate; offset += 128) {
    const size = Math.min(128, rate - offset);
    slow.scope.currentTime = fast.scope.currentTime = offset / rate;
    const a = [new Float32Array(size), new Float32Array(size)];
    const b = [new Float32Array(size), new Float32Array(size)];
    slow.processor.process([], [a]); fast.processor.process([], [b]);
    assert.deepEqual(a, b, `Changing PT3 clock must preserve sustained AY pitch and phase at ${rate} Hz`);
  }
  for (const [player, hz] of [[slow, 50], [fast, 60]]) {
    player.processor.report();
    const position = player.messages.filter(message => message.type === 'position').at(-1).frame;
    assert(Math.abs(position - hz) < 1e-6, `One second must advance ${hz} PT3 frames at ${rate} Hz`);
  }
  fast.send({ type: 'rate', hz: 50 });
  assert(Math.abs(fast.messages.at(-1).frame - 60) < 1e-6, 'Live rate change preserves the musical position');
  fast.send({ type: 'loop', range: { startFrame: 55, endFrame: 65 } });
  fast.send({ type: 'seek', frame: 55 });
  const a = [new Float32Array(128), new Float32Array(128)];
  fast.processor.process([], [a]);
  assert.equal(fast.processor.playbackHz, 50);
  assert.equal(fast.processor.loop.startFrame, 55, 'Changing clock keeps loop frame coordinates');
}
console.log('PASS: 50/60 Hz advance exactly 50/60 frames per second with identical sustained pitch; live switching retains position and loops.');

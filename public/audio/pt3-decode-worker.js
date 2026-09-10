// Run the same bundled Cowbell/Bulba decoder off the UI and audio threads.
// Cowbell's license is in /vendor/cowbell/LICENSE. The ROM player is unchanged.
self.window = self;
importScripts('../vendor/cowbell/cowbell.min.js', '../vendor/cowbell/zx.min.js');

self.onmessage = ({ data: { id, bytes } }) => {
  try {
    const source = new Uint8Array(bytes);
    const moduleAddress = 18542; // Bundled Cowbell ZXPT3 loader's MODADDR.
    if (source.length > 65536 - moduleAddress) throw new Error('El módulo excede la memoria del preview Cowbell.');
    const memory = new Uint8Array(65536);
    memory.set(Cowbell.Common.PT3PlayerBin, 16384);
    memory.set(source, moduleAddress);
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
    for (let frame = 0; frame < 1000000; frame++) {
      registers[14] = 0;
      cpu.runRoutine(16389, 16128);
      if (memory[16394] !== 0) { complete = true; break; }
      frames.push(registers.slice());
    }
    if (!complete || !frames.length) throw new Error('El módulo no produce una secuencia PT3 válida y acotada.');
    const log = new Uint8Array(frames.length * 15);
    frames.forEach((frame, index) => log.set(frame, index * 15));
    self.postMessage({ id, log: log.buffer }, [log.buffer]);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};

import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1100 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.addInitScript(() => {
    window.pt3Nodes = [];
    const OriginalWorker = window.Worker;
    window.Worker = class extends OriginalWorker {
      postMessage(message, ...args) {
        if (message.bytes && window.pt3DecodeDelay) {
          setTimeout(() => super.postMessage(message, ...args), window.pt3DecodeDelay);
        } else super.postMessage(message, ...args);
      }
    };
    const Original = window.AudioWorkletNode;
    window.AudioWorkletNode = class extends Original {
      constructor(context, name, ...args) {
        super(context, name, ...args);
        if (name !== 'mideas-pt3') return;
        const probe = { context, playing: false, connected: false, analyser: context.createAnalyser() };
        window.pt3Nodes.push(probe);
        const connect = this.connect.bind(this), disconnect = this.disconnect.bind(this);
        this.connect = (...args) => {
          probe.connected = true;
          connect(probe.analyser);
          return connect(...args);
        };
        this.disconnect = (...args) => { probe.connected = false; return disconnect(...args); };
        const post = this.port.postMessage.bind(this.port);
        this.port.postMessage = (message, ...args) => {
          if (message.type === 'play') probe.playing = true;
          if (message.type === 'pause') probe.playing = false;
          post(message, ...args);
        };
      }
    };
    window.pt3Audit = () => {
      let peak = 0;
      for (const probe of window.pt3Nodes) {
        if (!probe.connected || probe.context.state === 'closed') continue;
        const samples = new Float32Array(probe.analyser.fftSize);
        probe.analyser.getFloatTimeDomainData(samples);
        peak = Math.max(peak, ...samples.map(Math.abs));
      }
      return { peak, playing: window.pt3Nodes.filter(probe => probe.connected && probe.playing && probe.context.state !== 'closed').length };
    };
  });
  await page.goto('http://localhost:3000');
  await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { TrackerComposer } = await import('/components/editors/TrackerComposer.tsx');
    const { parsePT3File } = await import('/components/utils/pt3Parser.ts');
    const bytes = new Uint8Array(await (await fetch('/samples/pt3/kuvo-forgotten-puppet.pt3')).arrayBuffer());
    const host = document.createElement('div');
    host.style = 'position:fixed;inset:0;z-index:99999;background:black';
    document.body.append(host);
    function Harness() {
      const [song, setSong] = React.useState(() => ({
        id: 'stop-test', ...parsePT3File(bytes.buffer), soundChip: 'PSG',
        playbackBackend: 'external-pt3', externalPt3Data: Array.from(bytes), externalPt3HasHeader: true,
      }));
      return React.createElement(TrackerComposer, {
        songData: song,
        onUpdate: update => setSong(previous => ({ ...previous, ...(typeof update === 'function' ? update(previous) : update) })),
      });
    }
    window.testRoot = createRoot(host);
    window.testRoot.render(React.createElement(Harness));
  });
  for (const stopButton of ['Stop', 'Silence', 'Stop', 'Silence']) {
    await page.getByRole('button', { name: 'Play Song', exact: true }).click();
    await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
    await page.waitForFunction(() => window.pt3Audit().peak > 0.001);
    assert.equal((await page.evaluate(() => window.pt3Audit())).playing, 1, 'only one PT3 reaches the speakers');
    await page.getByRole('button', { name: stopButton, exact: true }).click();
    await page.waitForTimeout(200);
    const stopped = await page.evaluate(() => window.pt3Audit());
    assert.equal(stopped.playing, 0, `${stopButton} pauses/closes every connected PT3`);
    assert(stopped.peak < 0.000001, `${stopButton} leaves actual audio silent (peak ${stopped.peak})`);
  }
  // Cancel while the decoder has not delivered the initial song yet.
  await page.evaluate(() => { window.pt3DecodeDelay = 400; });
  for (const cancelButton of ['Silence', 'Play Song']) {
    await page.getByRole('button', { name: 'Play Song', exact: true }).click();
    await page.getByRole('button', { name: cancelButton, exact: true }).click();
    await page.waitForTimeout(600);
    assert.equal((await page.evaluate(() => window.pt3Audit())).playing, 0,
      `${cancelButton} cancels a pending Play without resurrecting audio`);
    await page.getByRole('button', { name: 'Play Song', exact: true }).waitFor();
  }
  await page.evaluate(() => { window.pt3DecodeDelay = 0; });
  // The transport must also respect Stop while AudioContext.resume is pending.
  await page.evaluate(async () => {
    const { PT3AudioTransport } = await import('/components/utils/pt3AudioTransport.ts');
    const { createBlankPT3Song } = await import('/components/utils/pt3Recording.ts');
    const transport = new PT3AudioTransport(new Uint8Array(createBlankPT3Song().externalPt3Data));
    await transport.open();
    const originalResume = AudioContext.prototype.resume;
    let release, entered;
    const ready = new Promise(resolve => { entered = resolve; });
    AudioContext.prototype.resume = function () {
      entered();
      return new Promise(resolve => { release = resolve; });
    };
    try {
      const playing = transport.play();
      await ready;
      transport.stop();
      release();
      await playing;
      if (window.pt3Audit().playing !== 0) throw new Error('Stop failed during resume');
    } finally {
      AudioContext.prototype.resume = originalResume;
      transport.close();
    }
    let refused = false;
    try { await transport.play(); } catch { refused = true; }
    if (!refused) throw new Error('A closed PT3 transport reopened');
  });
  await page.getByRole('button', { name: 'Play Song', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
  await page.evaluate(() => window.testRoot.unmount());
  await page.waitForTimeout(200);
  assert.equal((await page.evaluate(() => window.pt3Audit())).playing, 0, 'unmount closes the PT3');
  assert.deepEqual(errors, []);
  console.log('PASS: imported PT3 Play/Stop/Play, Silence, cancellation during decode/resume and unmount; one voice during playback and actual silence after stopping.');
} finally {
  await browser.close();
}

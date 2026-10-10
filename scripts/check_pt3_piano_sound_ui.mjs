import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1100 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.addInitScript(() => {
    window.soundNodes = [];
    const Original = AudioWorkletNode;
    window.AudioWorkletNode = class extends Original {
      constructor(context, name, options) {
        super(context, name, options);
        if (name !== 'mideas-pt3') return;
        const probe = { audition: options.processorOptions?.audition, messages: [], context,
          analyser: context.createAnalyser() };
        window.soundNodes.push(probe);
        const connect = this.connect.bind(this);
        this.connect = (...args) => { connect(probe.analyser); return connect(...args); };
        const post = this.port.postMessage.bind(this.port);
        this.port.postMessage = (message, ...args) => {
          probe.messages.push(message.log ? { ...message, log: Array.from(new Uint8Array(message.log)) } : message);
          post(message, ...args);
        };
      }
    };
    const port = { id: 'test', name: 'MIDI test', state: 'connected', type: 'input', onmidimessage: null };
    window.testMidi = port;
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: async () => ({ inputs: new Map([['test', port]]), onstatechange: null }) });
    window.auditionPeak = () => {
      let peak = 0;
      for (const node of window.soundNodes.filter(node => node.audition && node.context.state !== 'closed')) {
        const samples = new Float32Array(node.analyser.fftSize);
        node.analyser.getFloatTimeDomainData(samples);
        peak = Math.max(peak, ...samples.map(Math.abs));
      }
      return peak;
    };
  });
  await page.goto('http://localhost:3000');
  await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { TrackerComposer } = await import('/components/editors/TrackerComposer.tsx');
    const { createBlankPT3Song, commitTrackerTake } = await import('/components/utils/pt3Recording.ts');
    const host = document.createElement('div');
    host.style = 'position:fixed;inset:0;z-index:99999;background:black'; document.body.append(host);
    function Harness() {
      const [song, setSong] = React.useState(() => {
        const base = { id: 'sound-test', ...createBlankPT3Song(undefined, [
          { id: 0, name: 'None', data: [0], loopPosition: 0 },
          { id: 1, name: 'Octaves', data: [0, 12], loopPosition: 0 },
        ]) };
        base.patterns = base.patterns.map(pattern => ({ ...pattern, numRows: 16, rows: pattern.rows.slice(0, 16) }));
        base.patterns[0].rows[0].A = { ...base.patterns[0].rows[0].A, note: 'C-4', instrument: 1, ornament: 1, volume: 7,
          effectCommand: 5, effectParams: '0203', pt3Envelope: '9:004B' };
        return { ...base, ...commitTrackerTake(base, new Map()) };
      });
      window.testSong = song;
      window.replaceSoundSong = setSong;
      return React.createElement(TrackerComposer, { songData: song,
        onUpdate: update => setSong(previous => ({ ...previous, ...(typeof update === 'function' ? update(previous) : update) })) });
    }
    window.soundRoot = createRoot(host); window.soundRoot.render(React.createElement(Harness));
  });
  await page.getByRole('button', { name: 'Share Propierty', exact: true }).waitFor();
  assert(await page.getByRole('button', { name: 'Share Propierty', exact: true }).isDisabled(), 'sharing needs a tracker cursor');
  await page.locator('#cell-0-A-note').click();
  await page.locator('#cell-0-A-note').press('Control+c');
  await page.getByText(/Sonido copiado del canal A, fila 00/).waitFor();
  await page.getByRole('button', { name: 'Quitar sonido copiado', exact: true }).click();
  const beforeShare = await page.evaluate(() => JSON.stringify(window.testSong));
  await page.getByRole('button', { name: 'Share Propierty', exact: true }).click();
  await page.getByText(/Sonido copiado del canal A, fila 00/).waitFor();
  assert.equal(await page.evaluate(() => JSON.stringify(window.testSong)), beforeShare, 'sharing selects properties without editing the song');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'cell-0-A-note', 'sharing retains the tracker cursor');
  await page.locator('#cell-4-A-note').click();
  await page.locator('[data-note="D-4"]').click();
  await page.waitForFunction(() => window.soundNodes.some(node => node.audition && node.messages.some(message => message.type === 'play')));
  await page.waitForFunction(() => window.auditionPeak() > 0.001);
  const captured = await page.evaluate(() => {
    const node = window.soundNodes.find(node => node.audition);
    return { cell: window.testSong.patterns[0].rows[4].A,
      log: node.messages.findLast(message => message.type === 'load').log,
      frame: node.messages.findLast(message => message.type === 'seek').frame };
  });
  assert.equal(captured.cell.instrument, 1);
  assert.equal(captured.cell.ornament, 1);
  assert.equal(captured.cell.volume, 7);
  assert.equal(captured.cell.effectCommand, 5);
  assert.equal(captured.cell.effectParams, '0203');
  assert.equal(captured.cell.pt3Envelope, '9:004B');
  await page.waitForTimeout(550);
  assert(await page.evaluate(() => window.auditionPeak() < 0.000001), 'piano audition stops after its audible duration');
  await page.getByRole('button', { name: 'Play Song', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
  const playback = await page.evaluate(() => window.soundNodes.findLast(node => !node.audition).messages.find(message => message.type === 'load').log);
  assert.deepEqual(captured.log.slice(captured.frame * 15, (captured.frame + 20) * 15),
    playback.slice(captured.frame * 15, (captured.frame + 20) * 15), 'audition and Play decode identical PSG frames for the same saved note');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  // A manual selection replaces a copied selector, including an occupied row.
  const instrumentName = await page.evaluate(() => window.testSong.instruments.find(item => item.id === 2).name);
  await page.getByRole('button', { name: 'Quitar sonido copiado', exact: true }).click();
  await page.locator(`[title="Select: ${instrumentName}. Double-click to edit."]`).click();
  await page.getByRole('button', { name: 'Sin ornamento (00)', exact: true }).click();
  await page.locator('#cell-4-A-note').click();
  await page.locator('[data-note="E-4"]').click();
  await page.waitForFunction(() => window.testSong.patterns[0].rows[4].A.note === 'E-4');
  assert.equal(await page.evaluate(() => window.testSong.patterns[0].rows[4].A.instrument), 2);
  assert.equal(await page.evaluate(() => window.testSong.patterns[0].rows[4].A.ornament), 0);
  // MIDI Only play uses that selection and leaves the song byte-for-byte intact.
  await page.getByLabel('Enable MIDI', { exact: true }).check();
  await page.waitForFunction(() => typeof window.testMidi.onmidimessage === 'function');
  await page.getByRole('button', { name: 'Only play', exact: true }).click();
  const before = await page.evaluate(() => JSON.stringify(window.testSong));
  await page.evaluate(() => window.testMidi.onmidimessage({ data: new Uint8Array([0x90, 67, 100]) }));
  await page.waitForFunction(() => window.auditionPeak() > 0.001);
  await page.evaluate(() => window.testMidi.onmidimessage({ data: new Uint8Array([0x80, 67, 0]) }));
  await page.waitForTimeout(120);
  assert(await page.evaluate(() => window.auditionPeak() < 0.000001), 'MIDI note-off silences the worklet');
  assert.equal(await page.evaluate(() => JSON.stringify(window.testSong)), before);
  // Rapid note-on/off and Silence during startup must not leave an orphan voice.
  await page.evaluate(() => {
    window.testMidi.onmidimessage({ data: new Uint8Array([0x90, 72, 100]) });
    window.testMidi.onmidimessage({ data: new Uint8Array([0x80, 72, 0]) });
  });
  await page.waitForTimeout(300);
  assert(await page.evaluate(() => window.auditionPeak() < 0.000001));
  await page.evaluate(() => window.testMidi.onmidimessage({ data: new Uint8Array([0x90, 60, 100]) }));
  await page.getByRole('button', { name: 'Silence', exact: true }).click();
  await page.waitForTimeout(300);
  assert(await page.evaluate(() => window.auditionPeak() < 0.000001));
  await page.screenshot({ path: 'server/temp/pt3-piano-sound-ui.png' });
  // Also exercise a real imported module with its original tuning/sample bank.
  const imported = await page.evaluate(async () => {
    const { parsePT3File } = await import('/components/utils/pt3Parser.ts');
    const bytes = new Uint8Array(await (await fetch('/samples/pt3/kuvo-forgotten-puppet.pt3')).arrayBuffer());
    const song = { id: 'imported-sound-test', ...parsePT3File(bytes.buffer), soundChip: 'PSG',
      playbackBackend: 'external-pt3', externalPt3Data: Array.from(bytes), externalPt3HasHeader: true };
    const index = song.order[0];
    const row = song.patterns[index].rows.findIndex(row => row.A.note && row.A.note !== '===' && row.A.note !== '---');
    window.replaceSoundSong(song);
    return { row };
  });
  await page.locator(`#cell-${imported.row}-A-note`).click();
  await page.locator(`#cell-${imported.row}-A-note`).press('Control+c');
  await page.locator('[data-note="D-4"]').click();
  await page.waitForFunction(() => window.auditionPeak() > 0.001);
  const realPreview = await page.evaluate(() => {
    const node = window.soundNodes.findLast(node => node.audition && node.context.state !== 'closed');
    return { log: node.messages.findLast(message => message.type === 'load').log,
      frame: node.messages.findLast(message => message.type === 'seek').frame };
  });
  await page.getByRole('button', { name: 'Play Song', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
  const realPlay = await page.evaluate(() => window.soundNodes.findLast(node => !node.audition).messages.find(message => message.type === 'load').log);
  assert.deepEqual(realPreview.log.slice(realPreview.frame * 15, (realPreview.frame + 1) * 15),
    realPlay.slice(realPreview.frame * 15, (realPreview.frame + 1) * 15), 'imported PT3 piano and Play use identical note registers and original tuning');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.evaluate(() => window.soundRoot.unmount());
  assert.deepEqual(errors, []);
  console.log('PASS: Ctrl+C and Share Propierty sound preset, cursor preservation, selected instrument/ornament, piano/Play PSG-frame parity, actual piano and MIDI audio, MIDI release, rapid cancellation, Silence and unmount.');
} finally { await browser.close(); }

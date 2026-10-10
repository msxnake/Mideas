import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://localhost:3000');
  await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { TrackerComposer } = await import('/components/editors/TrackerComposer.tsx');
    const { createBlankPT3Song, commitTrackerTake } = await import('/components/utils/pt3Recording.ts');
    const host = document.createElement('div');
    host.style = 'position:fixed;inset:0;z-index:99999;background:black';
    document.body.append(host);
    function Harness() {
      const [song, setSong] = React.useState(() => {
        const base = { id: 'clear-test', ...createBlankPT3Song() };
        const pattern = { ...base.patterns[0], numRows: 8, rows: base.patterns[0].rows.slice(0, 8) };
        base.patterns = [pattern, structuredClone({ ...pattern, id: 'second', name: 'Pattern 01' })];
        base.order = [0, 1]; base.lengthInPatterns = 2;
        base.currentPatternId = 'second'; base.currentPatternIndexInOrder = 1;
        const withNotes = { ...base, ...commitTrackerTake(base, new Map([
          ['0:0:A', { note: 'C-4', instrument: 11, volume: 12 }],
          ['1:0:A', { note: 'E-4', instrument: 11, volume: 10, effectCommand: 3, effectParams: '00' }],
          ['1:2:A', { note: 'G-4' }],
          ['1:0:B', { note: 'C-3', instrument: 11, volume: 10 }],
          ['1:0:C', { note: 'C-5', instrument: 11, volume: 15 }],
          ['1:4:C', { note: 'E-5' }],
        ])) };
        withNotes.patterns[1].pt3SourceRows[0].A.prefixBytes.push(0x2a);
        return { ...withNotes, ...commitTrackerTake(withNotes, new Map()) };
      });
      window.testSong = song;
      window.savedBeforeClear ??= structuredClone(song);
      window.setTestSong = setSong;
      return React.createElement(TrackerComposer, {
        songData: song,
        onUpdate: update => setSong(previous => ({ ...previous, ...(typeof update === 'function' ? update(previous) : update) })),
      });
    }
    createRoot(host).render(React.createElement(Harness));
  });
  const clearA = page.getByRole('button', { name: 'Borrar canal A del patrón actual', exact: true });
  await clearA.waitFor();
  const alignment = await page.evaluate(() => ['A', 'B', 'C'].map(channel => {
    const button = document.querySelector(`[aria-label="Borrar canal ${channel} del patrón actual"]`).getBoundingClientRect();
    const note = document.getElementById(`cell-0-${channel}-note`).getBoundingClientRect();
    return { buttonLeft: button.left, noteLeft: note.left, buttonWidth: button.width };
  }));
  assert(alignment.every(({ buttonLeft, noteLeft }) => Math.abs(buttonLeft - noteLeft) < 2),
    'each clear button is directly above its own channel column');
  await page.getByRole('button', { name: 'Play Song', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
  // Pick the second pattern again if the playhead has followed the first one.
  await page.evaluate(() => window.setTestSong(song => ({ ...song, currentPatternId: 'second', currentPatternIndexInOrder: 1 })));
  await clearA.click();
  await page.getByRole('button', { name: 'Play Song', exact: true }).waitFor();
  const result = await page.evaluate(async () => {
    const { parsePT3File } = await import('/components/utils/pt3Parser.ts');
    const current = window.testSong, original = window.savedBeforeClear;
    const decoded = parsePT3File(new Uint8Array(current.externalPt3Data).buffer);
    if (current.currentPatternId !== 'second') throw new Error('Clear switched the selected pattern');
    for (const channel of ['B', 'C']) {
      if (JSON.stringify(current.patterns[1].rows.map(row => row[channel])) !== JSON.stringify(original.patterns[1].rows.map(row => row[channel]))) {
        throw new Error(`Clear A changed ${channel}`);
      }
    }
    if (JSON.stringify(current.patterns[0].rows) !== JSON.stringify(original.patterns[0].rows)) throw new Error('Other pattern changed');
    if (JSON.stringify(current.order) !== JSON.stringify(original.order)) throw new Error('Order changed');
    const cleared = decoded.patterns[1].rows.map(row => row.A);
    if (cleared[0].note !== '===' || cleared.slice(1).some(cell => cell.note)) throw new Error('Cleared binary has notes');
    if (decoded.patterns[1].pt3SourceRows.some(row => row.A.prefixBytes.length || row.A.effects.length)) throw new Error('Cleared PT3 retained source commands');
    const worker = new Worker('/audio/pt3-decode-worker.js');
    try {
      const log = await new Promise((resolve, reject) => {
        worker.onmessage = ({ data }) => data.error ? reject(new Error(data.error)) : resolve(new Uint8Array(data.log));
        worker.postMessage({ id: 1, bytes: new Uint8Array(current.externalPt3Data).buffer });
      });
      const startFrame = 8 * current.speed;
      for (let frame = startFrame; frame < log.length / 15; frame++) {
        if (log[frame * 15 + 8] !== 0) throw new Error('A inherited sound from the previous pattern');
      }
      if (!Array.from({ length: log.length / 15 - startFrame }, (_, index) => log[(startFrame + index) * 15 + 10]).some(value => value > 0)) {
        throw new Error('C rhythm no longer sounds');
      }
    } finally { worker.terminate(); }
    return { cleared, noteC: decoded.patterns[1].rows[0].C.note };
  });
  assert.equal(result.noteC, 'C-5');
  await page.screenshot({ path: 'server/temp/tracker-clear-channel-ui.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: visible, aligned clear-channel buttons; clears only A in the selected pattern, preserves B/C and other patterns, removes PT3 commands and inherited A audio.');
} finally {
  await browser.close();
}

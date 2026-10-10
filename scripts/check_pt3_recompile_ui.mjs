import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1100 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.addInitScript(() => {
    const OriginalWorker = window.Worker;
    window.Worker = class extends OriginalWorker {
      postMessage(message, ...args) {
        if (message.bytes) window.lastDecodedPT3 = Array.from(new Uint8Array(message.bytes));
        super.postMessage(message, ...args);
      }
    };
  });
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
        const base = { id: 'recompile-test', ...createBlankPT3Song() };
        return { ...base, ...commitTrackerTake(base, new Map([['0:0:A', { note: 'C-4', instrument: 11, volume: 15 }]])) };
      });
      window.testSong = song;
      window.replaceTestSong = setSong;
      return React.createElement(TrackerComposer, {
        songData: song,
        onUpdate: update => setSong(previous => ({ ...previous, ...(typeof update === 'function' ? update(previous) : update) })),
      });
    }
    createRoot(host).render(React.createElement(Harness));
  });
  await page.getByLabel('A note at row 0', { exact: true }).fill('E-4');
  await page.getByRole('button', { name: 'Play Song', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
  const loadedNote = () => page.evaluate(async () => {
    const { parsePT3File } = await import('/components/utils/pt3Parser.ts');
    return parsePT3File(new Uint8Array(window.lastDecodedPT3).buffer).patterns[0].rows[0].A.note;
  });
  assert.equal(await loadedNote(), 'E-4', 'manual cell edit reaches the decoder');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  // A legacy project/undo/import can leave the decoded rows newer than its binary.
  await page.evaluate(() => window.replaceTestSong(previous => {
    const next = structuredClone(previous);
    next.patterns[0].rows[0].A.note = 'G-4';
    return next;
  }));
  await page.waitForFunction(() => window.testSong.patterns[0].rows[0].A.note === 'G-4');
  await page.getByRole('button', { name: 'Play Song', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
  assert.equal(await loadedNote(), 'G-4', 'Play recompiles stale binary from the visible pattern');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.evaluate(() => window.replaceTestSong(previous => {
    const next = structuredClone(previous);
    next.patterns[0].rows[0].A.note = 'A-4';
    return next;
  }));
  await page.getByRole('button', { name: 'Recompilar PT3', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'PT3 recompilado' }).waitFor();
  const storedNote = () => page.evaluate(async () => {
    const { parsePT3File } = await import('/components/utils/pt3Parser.ts');
    return parsePT3File(new Uint8Array(window.testSong.externalPt3Data).buffer).patterns[0].rows[0].A.note;
  });
  assert.equal(await storedNote(), 'A-4', 'explicit recompilation saves the edited module');
  await page.getByRole('button', { name: 'Play Song', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
  assert.equal(await loadedNote(), 'A-4', 'explicit recompilation replaces the cached player');
  await page.getByRole('button', { name: 'Recompilar PT3', exact: true }).click();
  await page.getByRole('button', { name: 'Play Song', exact: true }).waitFor();
  const goodBinary = await page.evaluate(() => JSON.stringify(window.testSong.externalPt3Data));
  await page.evaluate(() => window.replaceTestSong(previous => ({ ...previous, order: [99] })));
  await page.getByRole('button', { name: 'Recompilar PT3', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'PT3 admite' }).waitFor();
  assert.equal(await page.evaluate(() => JSON.stringify(window.testSong.externalPt3Data)), goodBinary,
    'a failed compile retains the last valid binary');
  // Exercise the real PT3 import picker and edit a compressed source pattern.
  await page.getByLabel('Load PT3 music into tracker').setInputFiles('public/samples/pt3/kuvo-forgotten-puppet.pt3');
  await page.waitForFunction(() => window.testSong.patterns.length > 1);
  const importedNote = await page.getByLabel('A note at row 0', { exact: true }).inputValue();
  const replacement = importedNote === 'C-5' ? 'D-5' : 'C-5';
  await page.getByLabel('A note at row 0', { exact: true }).fill(replacement);
  await page.getByRole('button', { name: 'Recompilar PT3', exact: true }).click();
  assert.equal(await storedNote(), replacement, 'real imported PT3 accepts the edited note');
  await page.getByRole('button', { name: 'Play Song', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
  assert.equal(await loadedNote(), replacement, 'real imported PT3 sends the edited note to audio');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  assert.deepEqual(errors, []);
  await page.screenshot({ path: 'server/temp/pt3-recompile-ui.png' });
  console.log('PASS: manual edits, stale projects, explicit recompilation, failure recovery and real PT3 import reach the audio decoder.');
} catch (error) {
  console.error('PT3 UI diagnostics:', await page.getByRole('alert').allTextContents(), errors);
  await page.screenshot({ path: 'server/temp/pt3-recompile-failure.png' });
  throw error;
} finally {
  await browser.close();
}

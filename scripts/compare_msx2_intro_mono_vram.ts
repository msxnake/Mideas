// Byte-exact check of 1 bpp Intro images: VRAM dumped from OpenMSX by check_msx2_intro_smoke.mjs
// (INTRO_MONO=1) against the editor's own rendering (renderIntroImagePixels, 4 bpp nibble pairs).
// Run: npx tsx scripts/compare_msx2_intro_mono_vram.ts <fixture.json> <intro_mono_vram.txt>
import fs from 'node:fs';
import { renderIntroImagePixels } from '../utils/msx2IntroUtils';

const [fixturePath, dumpPath] = process.argv.slice(2);
const project = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const intro = project.assets.find((a: any) => a.type === 'msx2intro').data;
const dumps = new Map<string, number[]>();
for (const line of fs.readFileSync(dumpPath, 'utf8').split(/\r?\n/)) {
  const [name, ...bytes] = line.trim().split(/\s+/);
  if (name) dumps.set(name, bytes.map(Number));
}

let fails = 0;
let checked = 0;
for (const slide of intro.slides) {
  for (const image of slide.images) {
    if (!image.mono) continue;
    const rendered = renderIntroImagePixels(slide, image, project.assets);
    if (!rendered) { console.log(`FAIL  ${image.id}: no source`); fails++; continue; }
    const { dest, pixels } = rendered;
    const expected: number[] = [];
    for (let i = 0; i < pixels.length; i += 2) expected.push((pixels[i] << 4) | pixels[i + 1]);
    const got = dumps.get(image.id);
    if (!got) { console.log(`FAIL  ${image.id}: not dumped from VRAM`); fails++; continue; }
    const inks = pixels.filter(p => p === image.mono.ink).length;
    // a solid box would compare equal to a broken expander too easily: demand a real picture
    if (inks === 0 || inks === pixels.length) { console.log(`FAIL  ${image.id}: expected image is a solid box (${inks} ink pixels), the test proves nothing`); fails++; continue; }
    const diffs: string[] = [];
    for (let i = 0; i < expected.length; i++) {
      if (got[i] !== expected[i]) diffs.push(`(${dest.x + (i % (dest.w / 2)) * 2},${dest.y + Math.floor(i / (dest.w / 2))}) got ${got[i]?.toString(16)} want ${expected[i].toString(16)}`);
    }
    checked++;
    if (got.length !== expected.length) { console.log(`FAIL  ${image.id}: ${got.length} bytes dumped, ${expected.length} expected`); fails++; }
    else if (diffs.length) { console.log(`FAIL  ${image.id} ${dest.w}x${dest.h}: ${diffs.length} bytes differ, first ${diffs.slice(0, 5).join('; ')}`); fails++; }
    else console.log(`ok    ${image.id} ${dest.w}x${dest.h} 1 bpp: ${expected.length} VRAM bytes identical to the editor (${inks} ink pixels)`);
  }
}
if (checked === 0) { console.log('FAIL  no 1 bpp image was checked'); fails++; }
console.log(fails ? `MONO FAIL (${fails})` : 'MONO PASS');
process.exit(fails ? 1 : 0);

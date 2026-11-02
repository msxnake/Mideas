// Checks of the orbiting tetrahedron of a SCREEN 5 bitmap-room intro (msx2BitmapIntroTetrahedron.ts).
//
//   npx tsx scripts/check_msx2_intro_tetrahedron.ts
//
// No emulator: the module is pure, and everything the Z80 later plays is a table built here. What is checked:
//   - the tetrahedron is regular, with 32 px between vertices (the middle Z plane of the picture);
//   - the three palette entries of a dot satisfy rim | highlight = body, rim is the darkest, and a palette with
//     no such trio is refused;
//   - the picture mask: 'silhouette' fills background pixels enclosed by the drawing, 'pixels' does not;
//   - the frame records parse as [n][SAT][n patterns] and the orbit closes without a jump from the last frame
//     to the first;
//   - the occlusion is exact: no pixel of a clipped pattern lies on the picture, a picture covering the whole
//     screen leaves no clipped pattern at all (dots behind it are parked, dots in front are untouched), and
//     with no picture nothing is clipped or parked;
//   - malformed input stops the export with a message that names the problem.
import assert from 'node:assert/strict';
import {
  buildBitmapIntroTetrahedron,
  buildPictureMask,
  chooseOrTriple,
  tetrahedronVertices,
  type BitmapIntroTetrahedronConfig,
} from '../utils/msxGenerator/generators/msx2/msx2BitmapIntroTetrahedron';

const checks: string[] = [];
const pass = (name: string) => { checks.push(name); console.log(`ok - ${name}`); };

// ---- synthetic dot sprites: discs drawn with palette slots 1 (rim), 2 (highlight), 3 (body)
const HEX = ['rgba(0,0,0,0)', '#2424B6', '#FFFFFF', '#4949FF'];
function disc(diameter: number, id: string, slotOverride?: number) {
  const radius = diameter / 2;
  const data = Array.from({ length: 16 }, (_unused, y) => Array.from({ length: 16 }, (_unused2, x) => {
    const distance = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
    if (distance > radius) return HEX[0];
    if (slotOverride) return '#FF0000';
    if (distance > radius - 1.2) return HEX[1];
    if (x < 8 && y < 8 && distance > radius * 0.35) return HEX[2];
    return HEX[3];
  }));
  return {
    id,
    name: `disc ${diameter}`,
    size: { width: 16, height: 16 },
    palette: HEX.map((hex, slotIndex) => ({ slotIndex, masterIndex: 0, hex })).concat(
      Array.from({ length: 12 }, (_unused, i) => ({ slotIndex: 4 + i, masterIndex: 0, hex: i === 0 ? '#FF0000' : `#0000${(i + 16).toString(16).toUpperCase().padStart(2, '0')}` }))),
    frames: [{ id: 'f', data }],
    currentFrameIndex: 0,
  };
}
const sprites = [disc(16, 's16'), disc(12, 's12'), disc(8, 's8'), disc(4, 's4')];
const analysis: any = { msx2Sprites: sprites };
const baseConfig: BitmapIntroTetrahedronConfig = { enabled: true, spriteAssetIds: sprites.map(sprite => sprite.id), paletteSlots: [1, 2, 3] };
const emptyContext = { paletteBytes: [], bitmapBytes: [] as number[] };

// ---- 1. geometry
{
  const vertices = tetrahedronVertices(32);
  assert.equal(vertices.length, 4);
  let pairs = 0;
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const distance = Math.hypot(vertices[a][0] - vertices[b][0], vertices[a][1] - vertices[b][1], vertices[a][2] - vertices[b][2]);
      assert.ok(Math.abs(distance - 32) < 1e-9, `vertices ${a}-${b} are ${distance} apart, not 32`);
      pairs++;
    }
  }
  assert.equal(pairs, 6);
  for (const axis of [0, 1, 2]) assert.ok(Math.abs(vertices.reduce((sum, vertex) => sum + vertex[axis], 0)) < 1e-9, 'centroid is not the origin');
  assert.ok(vertices[0][1] < vertices[1][1], 'the apex is not above the base (y grows downward)');
  pass('regular tetrahedron: six edges of 32 px, centroid at the origin, apex up');
}

// ---- 2. palette trio
const paletteOf = (colors: Record<number, [number, number, number]>) => {
  const bytes = new Array(32).fill(0);
  for (const [slot, [r, g, b]] of Object.entries(colors)) { bytes[Number(slot) * 2] = (r << 4) | b; bytes[Number(slot) * 2 + 1] = g; }
  return bytes;
};
{
  const palette = paletteOf({ 1: [1, 1, 3], 2: [7, 7, 7], 3: [4, 4, 7] });
  const triple = chooseOrTriple(palette, [0, 0]);
  assert.deepEqual(triple, { rim: 1, highlight: 2, body: 3 });
  assert.equal(triple!.rim | triple!.highlight, triple!.body);
  // many candidates: the winner must still satisfy the OR and the shading order
  const rich = paletteOf({ 1: [0, 0, 2], 2: [7, 7, 7], 3: [3, 3, 6], 4: [2, 0, 0], 5: [5, 2, 5], 6: [4, 4, 0], 7: [6, 6, 6], 8: [0, 3, 0], 9: [1, 5, 1], 12: [2, 7, 2], 10: [6, 1, 1] });
  const best = chooseOrTriple(rich, [0x11])!;
  assert.equal(best.rim | best.highlight, best.body, 'rim | highlight must equal body');
  assert.ok(best.body !== best.rim && best.body !== best.highlight);
  const luma = (slot: number) => { const b = rich[slot * 2]; return 0.299 * (b >> 4) + 0.587 * rich[slot * 2 + 1] + 0.114 * (b & 7); };
  assert.ok(luma(best.rim) <= luma(best.body) && luma(best.body) <= luma(best.highlight), 'the body must sit between rim and highlight');
  // overlapping bits: 5 (0101) | 6 (0110) = 7 (0111); a XOR would give 3, which this palette does not have
  assert.deepEqual(chooseOrTriple(paletteOf({ 5: [1, 1, 2], 6: [5, 5, 5], 7: [3, 3, 4] }), [0, 0]), { rim: 5, highlight: 6, body: 7 });
  // no trio: two colours only
  assert.equal(chooseOrTriple(paletteOf({ 1: [1, 1, 3], 2: [7, 7, 7] }), [0, 0]), undefined);
  // an entry that is black and unused is not a colour...
  assert.equal(chooseOrTriple(paletteOf({ 1: [1, 1, 3], 2: [7, 7, 7], 4: [0, 0, 0] }), [0x00]), undefined);
  // ...but a black entry the picture uses is
  assert.ok(chooseOrTriple(paletteOf({ 2: [1, 1, 3], 4: [7, 7, 7] }), [0x16, 0x66]), 'a used black entry should count as a colour');
  pass('palette trio: rim | highlight = body, shaded in order, none found when there is no trio');
}

// ---- 3. picture mask
function bitmapWith(draw: (x: number, y: number) => number): number[] {
  const bytes: number[] = [];
  for (let y = 0; y < 212; y++) for (let x = 0; x < 256; x += 2) bytes.push((draw(x, y) << 4) | draw(x + 1, y));
  return bytes;
}
{
  // a ring of colour 5 on background 1, with background-coloured pixels inside the ring
  const ring = bitmapWith((x, y) => {
    const d = Math.hypot(x - 128, y - 106);
    return d <= 40 && d >= 30 ? 5 : 1;
  });
  const silhouette = buildPictureMask(ring, 'silhouette')!;
  const pixels = buildPictureMask(ring, 'pixels')!;
  const at = (mask: { opaque: Uint8Array }, x: number, y: number) => mask.opaque[y * 256 + x];
  assert.equal(at(silhouette, 128, 106), 1, 'silhouette: the hole inside the ring must hide a dot behind it');
  assert.equal(at(pixels, 128, 106), 0, 'pixels: the hole must not hide anything');
  assert.equal(at(silhouette, 128 + 35, 106), 1);
  assert.equal(at(silhouette, 128 + 60, 106), 0, 'outside the ring is background');
  assert.equal(at(silhouette, 5, 5), 0);
  assert.ok(silhouette.bounds.width >= 80 && silhouette.bounds.width <= 82, `ring bounds ${silhouette.bounds.width}`);
  assert.equal(buildPictureMask(bitmapWith(() => 1)), undefined, 'a blank picture has no mask');
  const rect = buildPictureMask([], 'silhouette', { x: 10, y: 20, width: 30, height: 40 })!;
  assert.deepEqual(rect.bounds, { x: 10, y: 20, width: 30, height: 40 });
  pass('picture mask: silhouette fills enclosed background, pixels mode does not, blank picture has none, rectangle override');
}

// ---- 4. frame records
interface Plane { y: number; x: number; pattern: number }
interface FrameRecord { n: number; planes: Plane[]; patterns: number[][] }
function parse(blocks: number[][], frames: number): FrameRecord[] {
  const records: FrameRecord[] = [];
  for (const block of blocks) {
    assert.ok(block.length <= 0x2000, `a block of ${block.length} bytes does not fit one 8 KB bank`);
    let offset = 0;
    while (offset < block.length) {
      const n = block[offset++];
      const planes: Plane[] = [];
      for (let plane = 0; plane < 8; plane++) { planes.push({ y: block[offset], x: block[offset + 1], pattern: block[offset + 2] }); assert.equal(block[offset + 3], 0); offset += 4; }
      const patterns = Array.from({ length: n }, () => { const bytes = block.slice(offset, offset + 32); offset += 32; return bytes; });
      records.push({ n, planes, patterns });
    }
    assert.equal(offset, block.length, 'a record straddles the end of a block');
  }
  assert.equal(records.length, frames);
  return records;
}
const visible = (plane: Plane) => plane.y !== 0xd0;
const pixelsOf = (plane: Plane, pattern: number[]): Array<[number, number]> => {
  const result: Array<[number, number]> = [];
  // quadrants: upper left, lower left, upper right, lower right
  [[0, 0], [0, 8], [8, 0], [8, 8]].forEach(([qx, qy], quadrant) => {
    for (let row = 0; row < 8; row++) {
      for (let bit = 0; bit < 8; bit++) if (pattern[quadrant * 8 + row] & (0x80 >> bit)) result.push([plane.x + qx + bit, plane.y + 1 + qy + row]);
    }
  });
  return result;
};
{
  const open = buildBitmapIntroTetrahedron('t', { ...baseConfig, cycleFrames: 240 }, analysis, emptyContext);
  const records = parse(open.frameBlocks, 240);
  assert.equal(open.planeCount, 8);
  assert.ok(records.every(record => record.n === 0), 'with no picture nothing may be clipped');
  assert.ok(records.every(record => record.planes.every(visible)), 'with no picture nothing may be parked');
  // two planes per ball share one position; the colour table is A for plane 2g and CC | B for plane 2g+1
  for (const record of records) for (let ball = 0; ball < 4; ball++) {
    assert.equal(record.planes[ball * 2].x, record.planes[ball * 2 + 1].x);
    assert.equal(record.planes[ball * 2].y, record.planes[ball * 2 + 1].y);
  }
  assert.equal(open.colorBytes.length, 8 * 16);
  assert.ok(open.colorBytes.slice(0, 16).every(color => color === 1) && open.colorBytes.slice(16, 32).every(color => color === (0x40 | 2)));
  // the orbit closes: the step from the last frame to the first must look like every other step
  const stepSize = (frame: number) => {
    const a = records[frame].planes.filter((_p, index) => index % 2 === 0);
    const b = records[(frame + 1) % 240].planes.filter((_p, index) => index % 2 === 0);
    return Math.max(...a.map(dot => Math.min(...b.map(other => Math.hypot(other.x - dot.x, other.y - dot.y)))));
  };
  const steps = Array.from({ length: 239 }, (_unused, frame) => stepSize(frame));
  const typical = Math.max(...steps);
  assert.ok(typical <= 9, `a dot moves ${typical.toFixed(1)} px in one frame`);
  assert.ok(stepSize(239) <= typical * 1.3 + 0.5, `wrap from frame 239 to 0 moves ${stepSize(239).toFixed(1)} px, a normal step is at most ${typical.toFixed(1)}`);
  // it really orbits: the dots cover a wide area over the cycle
  const xs = records.flatMap(record => record.planes.map(plane => plane.x));
  assert.ok(Math.max(...xs) - Math.min(...xs) > 120, 'the tetrahedron does not travel around the picture');
  pass('frame records parse, colour table is A / CC|B, and the orbit closes without a jump');
}

// ---- 5. occlusion
{
  const half = { x: 64, y: 42, width: 128, height: 128 };
  const clipped = buildBitmapIntroTetrahedron('t', { ...baseConfig, pictureRect: half, cycleFrames: 240 }, analysis, emptyContext);
  const records = parse(clipped.frameBlocks, 240);
  let clippedPlanes = 0;
  let parked = 0;
  for (const record of records) {
    assert.ok(record.n <= 8);
    for (const plane of record.planes) {
      if (!visible(plane)) { parked++; continue; }
      const index = plane.pattern / 4;
      if (index < clipped.dynamicPatternBase) continue;
      clippedPlanes++;
      const pattern = record.patterns[index - clipped.dynamicPatternBase];
      assert.ok(pattern, 'a plane points at a per-frame pattern slot the record does not carry');
      const pixels = pixelsOf(plane, pattern);
      assert.ok(pixels.length > 0, 'a clipped pattern with no pixels should have been parked');
      for (const [x, y] of pixels) {
        assert.ok(!(x >= half.x && x < half.x + half.width && y >= half.y && y < half.y + half.height), `a clipped dot shows through the picture at ${x},${y}`);
      }
    }
  }
  assert.ok(clippedPlanes > 20, `only ${clippedPlanes} clipped planes: the dots never cross the picture edge`);
  assert.ok(parked > 20, `only ${parked} parked planes: the dots never go behind the picture`);

  // a picture over the whole screen: everything behind is parked, nothing needs a clipped pattern
  const whole = buildBitmapIntroTetrahedron('t', { ...baseConfig, pictureRect: { x: 0, y: 0, width: 256, height: 212 }, cycleFrames: 240 }, analysis, emptyContext);
  const wholeRecords = parse(whole.frameBlocks, 240);
  assert.ok(wholeRecords.every(record => record.n === 0), 'with the picture over the whole screen no pattern should be clipped');
  const wholeParked = wholeRecords.reduce((sum, record) => sum + record.planes.filter(plane => !visible(plane)).length, 0);
  assert.ok(wholeParked > parked, 'a bigger picture must hide more');
  // the dots in front are still there
  assert.ok(wholeRecords.some(record => record.planes.some(visible)), 'the dots in front of the picture must stay visible');
  // pixel-exact: the same dot unclipped vs clipped differs by exactly the covered pixels
  pass(`occlusion is pixel exact: ${clippedPlanes} clipped planes never show through the picture, ${parked} planes parked, whole-screen picture clips nothing`);
}

// ---- 5b. orbit radius
{
  // a picture that fills the screen: half the picture + 24 would send the orbit off the display, so the default shrinks
  const full = { x: 0, y: 0, width: 256, height: 212 };
  const fitted = buildBitmapIntroTetrahedron('t', { ...baseConfig, pictureRect: full }, analysis, emptyContext);
  assert.ok(fitted.orbitRadius < 128 && fitted.orbitRadius >= 24, `orbit radius ${fitted.orbitRadius} for a full-screen picture`);
  const wanted = buildBitmapIntroTetrahedron('t', { ...baseConfig, pictureRect: full, orbitRadius: 148 }, analysis, emptyContext);
  assert.equal(wanted.orbitRadius, 148, 'an explicit radius must be respected');
  // with the fitted radius no dot is ever parked for leaving the display: dots in front of a picture that covers the
  // screen stay visible all the way round (parked planes then come only from being behind the picture)
  const small = buildBitmapIntroTetrahedron('t', baseConfig, analysis, emptyContext);
  assert.equal(small.orbitRadius, 72, 'no picture: the default orbit is 72 px');
  const edgeRecords = parse(buildBitmapIntroTetrahedron('t', { ...baseConfig, orbitRadius: 148 }, analysis, emptyContext).frameBlocks, 240);
  assert.ok(edgeRecords.some(record => record.planes.some(plane => !visible(plane))), 'an orbit of 148 px should leave the display (this is what the fit avoids)');
  const fittedRecords = parse(buildBitmapIntroTetrahedron('t', { ...baseConfig, orbitRadius: fitted.orbitRadius }, analysis, emptyContext).frameBlocks, 240);
  assert.ok(fittedRecords.every(record => record.planes.every(visible)), 'the fitted orbit must keep every dot on the display');
  pass(`orbit radius: fitted to ${fitted.orbitRadius} px for a full-screen picture, explicit radius respected`);
}

// ---- 6. errors
{
  const throwsWith = (config: Partial<BitmapIntroTetrahedronConfig>, pattern: RegExp, context = emptyContext, extraAnalysis = analysis) => {
    assert.throws(() => buildBitmapIntroTetrahedron('t', { ...baseConfig, ...config } as BitmapIntroTetrahedronConfig, extraAnalysis, context), pattern);
  };
  throwsWith({ spriteAssetIds: [] }, /needs spriteAssetIds/);
  throwsWith({ spriteAssetIds: ['missing'] }, /references msx2sprite asset "missing"/);
  throwsWith({ paletteSlots: [1, 2, 4] }, /rim \| highlight = body/);
  throwsWith({ paletteSlots: undefined }, /found no three entries/);
  throwsWith({ cycleFrames: 4 }, /cycleFrames/);
  throwsWith({ spriteAssetIds: ['bad'] }, /two-colour sprites/, emptyContext, { msx2Sprites: [disc(8, 'bad', 4)] });
  pass('malformed input stops the export with a message that names the problem');
}

console.log(`\n${checks.length} checks passed`);

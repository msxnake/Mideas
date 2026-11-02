import type { BitmapIntroTetrahedron } from './msxGenerator/generators/msx2/msx2BitmapIntroTetrahedron';

/**
 * Preview of the orbiting tetrahedron: draws the picture and the dots the way the ROM will show them. It decodes the same
 * frame records the Z80 streams (`[n] [SAT image] [n clipped patterns]`) instead of recomputing the animation, so what it
 * shows is what the tables say.
 *
 * Sprite model (V9938 mode 2, 16x16): planes are drawn in order, the lowest index wins a pixel; a plane whose colour has
 * the CC bit (0x40) is ORed with the plane right above it where the two overlap and shows in its own colour elsewhere.
 * Pattern layout is four 8x8 quadrants: upper left, lower left, upper right, lower right.
 */

export const ORBIT_PREVIEW_WIDTH = 256;
export const ORBIT_PREVIEW_HEIGHT = 212;
const ROW_BYTES = ORBIT_PREVIEW_WIDTH / 2;
const PLANES = 8;

interface PlaneEntry { y: number; x: number; pattern: number }
interface FrameRecord { planes: PlaneEntry[]; patterns: number[][] }

export interface OrbitPreview {
  frameCount: number;
  /** Vblanks each frame is shown for. */
  delay: number;
  /** Paints frame `frame` (wraps) into `target`, an RGBA buffer of ORBIT_PREVIEW_WIDTH x ORBIT_PREVIEW_HEIGHT x 4. */
  draw(frame: number, target: Uint8ClampedArray): void;
}

function decodeRecords(result: BitmapIntroTetrahedron): FrameRecord[] {
  const records: FrameRecord[] = [];
  for (const block of result.frameBlocks) {
    let offset = 0;
    while (offset < block.length) {
      const count = block[offset++];
      const planes: PlaneEntry[] = [];
      for (let plane = 0; plane < PLANES; plane++) {
        planes.push({ y: block[offset], x: block[offset + 1], pattern: block[offset + 2] });
        offset += 4;
      }
      const patterns: number[][] = [];
      for (let index = 0; index < count; index++) { patterns.push(block.slice(offset, offset + 32)); offset += 32; }
      records.push({ planes, patterns });
    }
  }
  return records;
}

const level = (value: number) => Math.round(((value & 7) * 255) / 7);

export function createOrbitPreview(result: BitmapIntroTetrahedron, paletteBytes: number[], bitmapBytes: number[]): OrbitPreview {
  const records = decodeRecords(result);
  const rgb = Array.from({ length: 16 }, (_unused, slot) => {
    const first = paletteBytes[slot * 2] || 0;
    const second = paletteBytes[slot * 2 + 1] || 0;
    return [level(first >> 4), level(second), level(first)] as const;
  });
  // The picture never changes: paint it once.
  const picture = new Uint8ClampedArray(ORBIT_PREVIEW_WIDTH * ORBIT_PREVIEW_HEIGHT * 4);
  for (let y = 0; y < ORBIT_PREVIEW_HEIGHT; y++) {
    for (let x = 0; x < ORBIT_PREVIEW_WIDTH; x++) {
      const byte = bitmapBytes[y * ROW_BYTES + (x >> 1)] || 0;
      const color = rgb[(x & 1) ? byte & 0x0f : byte >> 4];
      const at = (y * ORBIT_PREVIEW_WIDTH + x) * 4;
      picture[at] = color[0]; picture[at + 1] = color[1]; picture[at + 2] = color[2]; picture[at + 3] = 255;
    }
  }
  const colorOf = new Uint8Array(ORBIT_PREVIEW_WIDTH * ORBIT_PREVIEW_HEIGHT);
  const ownerOf = new Int8Array(ORBIT_PREVIEW_WIDTH * ORBIT_PREVIEW_HEIGHT);

  const patternRow = (pattern: number[], row: number): number => {
    const left = row < 8 ? pattern[row] : pattern[8 + (row - 8)];
    const right = row < 8 ? pattern[16 + row] : pattern[24 + (row - 8)];
    return ((left & 0xff) << 8) | (right & 0xff);
  };

  return {
    frameCount: records.length,
    delay: result.delay,
    draw(frame, target) {
      target.set(picture);
      colorOf.fill(0);
      ownerOf.fill(-1);
      const record = records[((frame % records.length) + records.length) % records.length];
      record.planes.forEach((plane, planeIndex) => {
        const index = plane.pattern >> 2;
        const pattern = index < result.dynamicPatternBase
          ? result.patternBytes.slice(index * 32, index * 32 + 32)
          : record.patterns[index - result.dynamicPatternBase];
        if (!pattern) return;
        const top = (plane.y > 0xe0 ? plane.y - 256 : plane.y) + 1;
        for (let row = 0; row < 16; row++) {
          const line = top + row;
          if (line < 0 || line >= ORBIT_PREVIEW_HEIGHT) continue;
          const colorByte = result.colorBytes[planeIndex * 16 + row] || 0;
          const cc = (colorByte & 0x40) !== 0;
          const own = colorByte & 0x0f;
          if (!own) continue; // colour 0 is transparent
          const bits = patternRow(pattern, row);
          if (!bits) continue;
          for (let column = 0; column < 16; column++) {
            if (!(bits & (0x8000 >> column))) continue;
            const x = plane.x + column;
            if (x >= ORBIT_PREVIEW_WIDTH) continue;
            const at = line * ORBIT_PREVIEW_WIDTH + x;
            if (ownerOf[at] < 0) {
              colorOf[at] = own;
              ownerOf[at] = planeIndex;
            } else if (cc && ownerOf[at] === planeIndex - 1) {
              colorOf[at] |= own; // the plane right above drew here: the colours are ORed
              ownerOf[at] = planeIndex;
            }
          }
        }
      });
      for (let at = 0; at < colorOf.length; at++) {
        if (ownerOf[at] < 0) continue;
        const color = rgb[colorOf[at]];
        target[at * 4] = color[0]; target[at * 4 + 1] = color[1]; target[at * 4 + 2] = color[2];
      }
    },
  };
}

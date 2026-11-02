/**
 * Tetrahedron of four hardware-sprite dots that spins and orbits the presentation bitmap of a SCREEN 5
 * bitmap-room intro scene.
 *
 * The presentation picture is the background, at the middle Z plane (z = 0). The tetrahedron is regular, with
 * `edge` pixels between its vertices at that plane (default 32). It spins about itself (X and Z axes) and its
 * centre travels along a circular orbit around the picture, tilted so it reads as an ellipse: the near half of
 * the orbit passes in front of the picture and the far half behind it.
 *
 * Hidden-behind-the-picture is pixel perfect and precomputed. Hardware sprites can never go behind bitmap
 * pixels, so for every dot that is behind the picture plane the export ANDs its sprite patterns with the
 * complement of the picture mask (the silhouette of the picture, or its non-background pixels): whatever the
 * picture covers is cut out of the pattern before the ROM exists. A dot the picture fully covers is parked
 * off screen; one that is partly covered gets a clipped pattern of its own for that frame.
 *
 * Everything that moves is a ROM table built at export time, one record per frame:
 *     [n] [SAT image: Y, X, pattern number for every plane] [n clipped patterns, 32 bytes each]
 * The Z80 only streams records into VRAM (SAT, and the clipped patterns into per-frame pattern slots after
 * the base patterns); it computes nothing, so there is no lag.
 *
 * Dot art. The balls are the project's own `msx2sprite` assets (`spriteAssetIds`, one per size), drawn with TWO
 * colours and their OR, which costs two hardware planes per ball, so four balls are exactly the 8 planes per
 * scanline the V9938 can show. The palette slots of the asset are the OR convention:
 *   slot 1 = A       rim        plane 0
 *   slot 2 = B       highlight  plane 1 (CC bit set: its colour is ORed with plane 0 where they overlap)
 *   slot 3 = A | B   body       both planes overlap
 * In the ROM those three roles take three entries of the bitmap's own palette that satisfy A | B = C (see
 * chooseOrTriple), so the dots use colours the picture already has and the palette is never overwritten.
 *
 * Sprite tables (V9938 sprite mode 2, #F400 colours / #F600 SAT / #F800 patterns): ball g owns planes 2g and
 * 2g+1, so a ball's two planes stay adjacent (the CC plane must follow its base plane) and balls occlude each
 * other front to back. The colour table is indexed by plane, not by pattern, and never changes: plane 2g is
 * colour A, plane 2g+1 is colour B with CC. Pattern 0 is empty; planes not drawn are parked below the display.
 */
import type { Msx2OrbitTetrahedronConfig, Msx2Sprite } from '../../../../types';
import type { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { resolveMsx2SpriteById } from './msx2Screen4Generator';

export type BitmapIntroTetrahedronConfig = Msx2OrbitTetrahedronConfig;

export interface BitmapIntroTetrahedronContext {
  /** The palette on screen when the animation runs: 16 x (byte1 = (R << 4) | B, byte2 = G). */
  paletteBytes: number[];
  /** The picture on screen: 212 rows x 128 bytes, 4 bits per pixel. */
  bitmapBytes: number[];
}

export interface BitmapIntroTetrahedron {
  /** Pattern 0 (empty) followed by the layers of every dot size: uploaded once. */
  patternBytes: number[];
  /** 16 line colours for each of `planeCount` planes. */
  colorBytes: number[];
  /** The frame records, packed into blocks of at most 8 KB; a record never straddles two blocks. */
  frameBlocks: number[][];
  frameCount: number;
  planeCount: number;
  delay: number;
  /** Pattern index of the first per-frame (clipped) pattern slot; the n patterns of a record go there. */
  dynamicPatternBase: number;
  /** Radius of the orbit that was used, in pixels. */
  orbitRadius: number;
  /** Palette entries the dots use: rim A, highlight B and body C = A | B. */
  paletteEntries: OrTriple;
  /** One line describing the palette entries, picture mask and data volume. */
  summary: string;
}

export interface OrTriple {
  rim: number;
  highlight: number;
  body: number;
}

export const TETRAHEDRON_BALLS = 4;
const LAYERS_PER_BALL = 2;
const PLANE_COUNT = TETRAHEDRON_BALLS * LAYERS_PER_BALL;
const MAX_BLOCK_BYTES = 0x2000;
const SAT_PARK_Y = 0xd0;
const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 212;
const ROW_BYTES = SCREEN_WIDTH / 2;
const CAMERA_DISTANCE = 400;
const SLOT_RIM = 1;
const SLOT_HIGHLIGHT = 2;
const SLOT_BODY = 3;

/** Vertices of a regular tetrahedron with the base horizontal and the apex up, centroid at the origin. y grows downward. */
export function tetrahedronVertices(edge: number): Array<[number, number, number]> {
  const baseRadius = edge / Math.sqrt(3);
  const height = edge * Math.sqrt(2 / 3);
  const apexY = -height * 3 / 4;
  const baseY = height / 4;
  const vertices: Array<[number, number, number]> = [[0, apexY, 0]];
  for (const degrees of [90, 210, 330]) {
    const angle = degrees * Math.PI / 180;
    vertices.push([baseRadius * Math.cos(angle), baseY, baseRadius * Math.sin(angle)]);
  }
  return vertices;
}

function paletteColor(paletteBytes: number[], slot: number): [number, number, number] {
  const first = paletteBytes[slot * 2] || 0;
  const second = paletteBytes[slot * 2 + 1] || 0;
  return [(first >> 4) & 7, second & 7, first & 7];
}

const luma = ([r, g, b]: [number, number, number]) => 0.299 * r + 0.587 * g + 0.114 * b;

function pixelAt(bitmapBytes: number[], x: number, y: number): number {
  const byte = bitmapBytes[y * ROW_BYTES + (x >> 1)] || 0;
  return (x & 1) ? byte & 0x0f : byte >> 4;
}

/**
 * Three palette entries for the dot: rim A (darkest), highlight B (lightest) and body C = A | B, so the hardware
 * OR of the two planes lands exactly on a colour that is already in the palette. Entries the picture does not
 * use and that are black are skipped (they are unset slots, not colours). Ranked by how well the body sits
 * between rim and highlight, then by contrast.
 */
export function chooseOrTriple(paletteBytes: number[], bitmapBytes: number[]): OrTriple | undefined {
  const used = new Set<number>();
  for (const byte of bitmapBytes) { used.add(byte >> 4); used.add(byte & 0x0f); }
  const eligible = (slot: number) => {
    const color = paletteColor(paletteBytes, slot);
    return used.has(slot) || color.some(channel => channel > 0);
  };
  let best: { triple: OrTriple; score: number } | undefined;
  for (let first = 1; first < 16; first++) {
    for (let second = first + 1; second < 16; second++) {
      const body = first | second;
      if (body === first || body === second || !eligible(first) || !eligible(second) || !eligible(body)) continue;
      const [rim, highlight] = luma(paletteColor(paletteBytes, first)) <= luma(paletteColor(paletteBytes, second))
        ? [first, second] : [second, first];
      const rimColor = paletteColor(paletteBytes, rim);
      const highlightColor = paletteColor(paletteBytes, highlight);
      const bodyColor = paletteColor(paletteBytes, body);
      const same = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
      if (same(rimColor, highlightColor) || same(rimColor, bodyColor) || same(bodyColor, highlightColor)) continue;
      const lumaRim = luma(rimColor);
      const lumaHighlight = luma(highlightColor);
      const lumaBody = luma(bodyColor);
      const ordered = lumaRim <= lumaBody && lumaBody <= lumaHighlight;
      const score = (ordered ? 100 : 0) - Math.abs(lumaBody - (lumaRim + lumaHighlight) / 2) + (lumaHighlight - lumaRim);
      if (!best || score > best.score) best = { triple: { rim, highlight, body }, score };
    }
  }
  return best?.triple;
}

export interface PictureMask {
  /** 256 x 212, 1 = the picture covers this pixel. */
  opaque: Uint8Array;
  /** Bounding box of the covered pixels. */
  bounds: { x: number; y: number; width: number; height: number };
}

function maskBounds(opaque: Uint8Array): PictureMask['bounds'] | undefined {
  let minX = SCREEN_WIDTH; let maxX = -1; let minY = SCREEN_HEIGHT; let maxY = -1;
  for (let y = 0; y < SCREEN_HEIGHT; y++) {
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      if (!opaque[y * SCREEN_WIDTH + x]) continue;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  return maxX < 0 ? undefined : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Which screen pixels the picture covers. The background is the commonest colour on the border of the screen.
 * 'silhouette' (default) covers everything the background cannot reach from the border, so background-coloured
 * pixels enclosed by the drawing still hide a dot behind it; 'pixels' covers only the non-background pixels.
 * Undefined when there is nothing but background.
 */
export function buildPictureMask(
  bitmapBytes: number[],
  mode: 'silhouette' | 'pixels' = 'silhouette',
  rect?: { x: number; y: number; width: number; height: number },
): PictureMask | undefined {
  const opaque = new Uint8Array(SCREEN_WIDTH * SCREEN_HEIGHT);
  if (rect) {
    for (let y = Math.max(0, Math.floor(rect.y)); y < Math.min(SCREEN_HEIGHT, Math.ceil(rect.y + rect.height)); y++) {
      for (let x = Math.max(0, Math.floor(rect.x)); x < Math.min(SCREEN_WIDTH, Math.ceil(rect.x + rect.width)); x++) opaque[y * SCREEN_WIDTH + x] = 1;
    }
  } else {
    if (bitmapBytes.length < SCREEN_HEIGHT * ROW_BYTES) return undefined;
    const counts = new Array<number>(16).fill(0);
    for (let x = 0; x < SCREEN_WIDTH; x++) { counts[pixelAt(bitmapBytes, x, 0)]++; counts[pixelAt(bitmapBytes, x, SCREEN_HEIGHT - 1)]++; }
    for (let y = 0; y < SCREEN_HEIGHT; y++) { counts[pixelAt(bitmapBytes, 0, y)]++; counts[pixelAt(bitmapBytes, SCREEN_WIDTH - 1, y)]++; }
    const background = counts.indexOf(Math.max(...counts));
    for (let y = 0; y < SCREEN_HEIGHT; y++) {
      for (let x = 0; x < SCREEN_WIDTH; x++) opaque[y * SCREEN_WIDTH + x] = pixelAt(bitmapBytes, x, y) === background ? 0 : 1;
    }
    if (mode === 'silhouette') {
      // Flood the background from the border: what stays unreached belongs to the picture.
      const reached = new Uint8Array(SCREEN_WIDTH * SCREEN_HEIGHT);
      const queue: number[] = [];
      const push = (x: number, y: number) => {
        const index = y * SCREEN_WIDTH + x;
        if (reached[index] || opaque[index]) return;
        reached[index] = 1;
        queue.push(index);
      };
      for (let x = 0; x < SCREEN_WIDTH; x++) { push(x, 0); push(x, SCREEN_HEIGHT - 1); }
      for (let y = 0; y < SCREEN_HEIGHT; y++) { push(0, y); push(SCREEN_WIDTH - 1, y); }
      for (let head = 0; head < queue.length; head++) {
        const x = queue[head] % SCREEN_WIDTH;
        const y = Math.floor(queue[head] / SCREEN_WIDTH);
        if (x > 0) push(x - 1, y);
        if (x < SCREEN_WIDTH - 1) push(x + 1, y);
        if (y > 0) push(x, y - 1);
        if (y < SCREEN_HEIGHT - 1) push(x, y + 1);
      }
      for (let index = 0; index < opaque.length; index++) opaque[index] = reached[index] ? 0 : 1;
    }
  }
  const bounds = maskBounds(opaque);
  return bounds ? { opaque, bounds } : undefined;
}

interface BallSize {
  sprite: Msx2Sprite;
  diameter: number;
  centerX: number;
  centerY: number;
  /** 16x16 masks of the planes that have pixels (plane 0 first). */
  masks: boolean[][][];
  firstPattern: number;
}

/** Palette slot of every pixel of frame 0 (0 = transparent). */
function spritePixelSlots(sprite: Msx2Sprite): number[][] {
  const frame = sprite.frames?.[sprite.currentFrameIndex || 0] || sprite.frames?.[0];
  const slotByHex = new Map<string, number>();
  for (const slot of sprite.palette || []) {
    const hex = String(slot.hex || '').trim().toUpperCase();
    if (slot.slotIndex > 0 && !slotByHex.has(hex)) slotByHex.set(hex, slot.slotIndex);
  }
  return Array.from({ length: 16 }, (_unused, y) => Array.from({ length: 16 }, (_unused2, x) => {
    const value = String(frame?.data?.[y]?.[x] || '').trim().toUpperCase();
    return slotByHex.get(value) || 0;
  }));
}

/** 16x16 mask as the four 8x8 quadrants of a mode 2 sprite pattern: upper left, lower left, upper right, lower right. */
function quadrantPattern(mask: boolean[][]): number[] {
  const bytes: number[] = [];
  for (const [x0, y0] of [[0, 0], [0, 8], [8, 0], [8, 8]]) {
    for (let y = 0; y < 8; y++) {
      let bits = 0;
      for (let x = 0; x < 8; x++) if (mask[y0 + y][x0 + x]) bits |= 0x80 >> x;
      bytes.push(bits);
    }
  }
  return bytes;
}

/** Reads a dot sprite: 16x16, palette slots 1 (A), 2 (B) and 3 (A|B) only. */
function readBallSprite(sprite: Msx2Sprite): { reason: string } | { ball: BallSize } {
  if ((sprite.size?.width || 16) !== 16 || (sprite.size?.height || 16) !== 16) {
    return { reason: `needs 16x16 sprites; "${sprite.name}" is ${sprite.size?.width}x${sprite.size?.height}` };
  }
  const slots = spritePixelSlots(sprite);
  for (const slot of slots.flat()) {
    if (slot > SLOT_BODY) {
      return { reason: `needs two-colour sprites: "${sprite.name}" uses palette slot ${slot}; the dots may only use slot ${SLOT_RIM} (A, rim), ${SLOT_HIGHLIGHT} (B, highlight) and ${SLOT_BODY} (A|B, body)` };
    }
  }
  const plane = (inPlane: (slot: number) => boolean) => slots.map(row => row.map(slot => slot > 0 && inPlane(slot)));
  const masks = [
    plane(slot => slot === SLOT_RIM || slot === SLOT_BODY),
    plane(slot => slot === SLOT_HIGHLIGHT || slot === SLOT_BODY),
  ];
  let minX = 16; let maxX = -1; let minY = 16; let maxY = -1;
  slots.forEach((row, y) => row.forEach((slot, x) => {
    if (!slot) return;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }));
  if (maxX < 0) return { reason: `uses the empty sprite "${sprite.name}"` };
  return {
    ball: {
      sprite,
      diameter: Math.max(maxX - minX + 1, maxY - minY + 1),
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      masks: masks.filter(mask => mask.some(row => row.some(Boolean))),
      firstPattern: 0,
    },
  };
}

/** Whether a sprite asset can be one of the dots of the tetrahedron, and why not. For the editor. */
export function describeOrbitSprite(sprite: Msx2Sprite): { ok: boolean; reason?: string; diameter?: number } {
  const read = readBallSprite(sprite);
  return 'reason' in read ? { ok: false, reason: read.reason } : { ok: true, diameter: read.ball.diameter };
}

export function buildBitmapIntroTetrahedron(
  sceneName: string,
  config: BitmapIntroTetrahedronConfig,
  analysis: ProjectAnalysis,
  context: BitmapIntroTetrahedronContext,
): BitmapIntroTetrahedron {
  const fail = (why: string): never => {
    throw new Error(`MSX2 bitmap-room intro scene "${sceneName}": the orbiting tetrahedron ${why}.`);
  };
  const ids = Array.isArray(config.spriteAssetIds) ? config.spriteAssetIds.map(id => String(id || '').trim()).filter(Boolean) : [];
  if (!ids.length) fail('needs spriteAssetIds (the msx2sprite assets of the dots, one per size)');

  const sizes: BallSize[] = ids.map(id => {
    const sprite = resolveMsx2SpriteById(analysis, id);
    if (!sprite) return fail(`references msx2sprite asset "${id}", which does not exist`);
    const read = readBallSprite(sprite);
    return 'reason' in read ? fail(read.reason) : read.ball;
  }).sort((a, b) => b.diameter - a.diameter);

  const patternBytes: number[] = Array(32).fill(0);
  for (const size of sizes) {
    size.firstPattern = patternBytes.length / 32;
    for (const mask of size.masks) patternBytes.push(...quadrantPattern(mask));
  }
  const dynamicPatternBase = patternBytes.length / 32;
  if (dynamicPatternBase + PLANE_COUNT > 64) fail(`needs ${dynamicPatternBase} base sprite patterns plus ${PLANE_COUNT} per-frame slots; the limit is 64`);

  // Palette entries of the dot.
  let triple: OrTriple | undefined;
  if (config.paletteSlots) {
    const [rim, highlight, body] = config.paletteSlots.map(Number);
    if (![rim, highlight, body].every(slot => Number.isInteger(slot) && slot >= 1 && slot <= 15) || (rim | highlight) !== body || body === rim || body === highlight) {
      fail(`paletteSlots [${config.paletteSlots.join(', ')}] must be three entries 1..15 with rim | highlight = body and body different from both`);
    }
    triple = { rim, highlight, body };
  } else {
    triple = chooseOrTriple(context.paletteBytes, context.bitmapBytes);
    if (!triple) {
      const usedColors = new Set<number>();
      for (const byte of context.bitmapBytes) { usedColors.add(byte >> 4); usedColors.add(byte & 0x0f); }
      fail(`found no three entries in the palette of the picture (which uses ${usedColors.size} colour${usedColors.size === 1 ? '' : 's'}) with colourA | colourB = colourC and three different colours. The dots take their colours from the presentation bitmap: load the bitmap, or free palette entries in it, or set paletteSlots`);
    }
  }
  const { rim, highlight, body } = triple!;
  const colorBytes: number[] = [];
  for (let ball = 0; ball < TETRAHEDRON_BALLS; ball++) {
    colorBytes.push(...Array(16).fill(rim), ...Array(16).fill(0x40 | highlight));
  }

  // The picture the dots hide behind.
  const picture = buildPictureMask(context.bitmapBytes, config.maskMode === 'pixels' ? 'pixels' : 'silhouette', config.pictureRect);
  const centerX = picture ? picture.bounds.x + picture.bounds.width / 2 : SCREEN_WIDTH / 2;
  const centerY = picture ? picture.bounds.y + picture.bounds.height / 2 : SCREEN_HEIGHT / 2;
  // A pixel of a dot behind the picture is cut when the picture covers it. Pixels outside the display never show,
  // so they are cut too: no clipped pattern is spent on them.
  const hidden = (x: number, y: number) =>
    x < 0 || y < 0 || x >= SCREEN_WIDTH || y >= SCREEN_HEIGHT || (!!picture && picture.opaque[y * SCREEN_WIDTH + x] === 1);

  const cycleFrames = Math.round(Number(config.cycleFrames) || 240);
  if (cycleFrames < 8 || cycleFrames > 255) fail(`cycleFrames ${cycleFrames} must be 8..255`);
  const delay = Math.max(1, Math.min(255, Math.round(Number(config.frameDelay) || 1)));
  const edge = Number(config.edge) > 0 ? Number(config.edge) : 32;
  const dotDiameter = Number(config.dotDiameter) > 0 ? Number(config.dotDiameter) : 12;
  const tilt = config.orbitTilt !== undefined && Number.isFinite(Number(config.orbitTilt)) ? Number(config.orbitTilt) : 0.35;
  const spinX = Math.round(config.spinX !== undefined && Number.isFinite(Number(config.spinX)) ? Number(config.spinX) : 2);
  const spinZ = Math.round(config.spinZ !== undefined && Number.isFinite(Number(config.spinZ)) ? Number(config.spinZ) : 1);
  const vertices = tetrahedronVertices(edge);

  /** Where the four vertices are, on screen and in depth, at `frame` of an orbit of `radius` pixels. */
  const place = (frame: number, radius: number) => {
    const phase = 2 * Math.PI * frame / cycleFrames;
    const orbitDepth = radius * Math.sin(phase);
    const originX = radius * Math.cos(phase);
    const originY = orbitDepth * Math.sin(tilt);
    const originZ = orbitDepth * Math.cos(tilt);
    const turnX = phase * spinX;
    const turnZ = phase * spinZ;
    return vertices.map(([vx, vy, vz]) => {
      // spin about itself: X axis, then Z axis
      const y1 = vy * Math.cos(turnX) - vz * Math.sin(turnX);
      const z1 = vy * Math.sin(turnX) + vz * Math.cos(turnX);
      const x2 = vx * Math.cos(turnZ) - y1 * Math.sin(turnZ);
      const y2 = vx * Math.sin(turnZ) + y1 * Math.cos(turnZ);
      const worldZ = originZ + z1;
      const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - worldZ);
      return { worldZ, perspective, screenX: centerX + (originX + x2) * perspective, screenY: centerY + (originY + y2) * perspective };
    });
  };
  const fitsScreen = (radius: number) => {
    for (let frame = 0; frame < cycleFrames; frame++) {
      for (const ball of place(frame, radius)) {
        const reach = dotDiameter * ball.perspective / 2 + 1;
        if (ball.screenX - reach < 0 || ball.screenX + reach > SCREEN_WIDTH - 1 || ball.screenY - reach < 0 || ball.screenY + reach > SCREEN_HEIGHT - 1) return false;
      }
    }
    return true;
  };
  let orbitRadius = Number(config.orbitRadius) > 0
    ? Number(config.orbitRadius)
    : (picture ? Math.max(picture.bounds.width, picture.bounds.height) / 2 + 24 : 72);
  if (!(Number(config.orbitRadius) > 0)) {
    // a picture that fills the screen would send the orbit off it: shrink until every dot stays on the display
    while (orbitRadius > 24 && !fitsScreen(orbitRadius)) orbitRadius -= 2;
  }

  const records: number[][] = [];
  let clippedPatterns = 0;
  let parkedPlanes = 0;
  for (let frame = 0; frame < cycleFrames; frame++) {
    const balls = place(frame, orbitRadius).sort((x, y) => y.worldZ - x.worldZ);

    const sat: number[] = [];
    const clipped: number[][] = [];
    for (const ball of balls) {
      const wanted = dotDiameter * ball.perspective;
      let size = sizes[0];
      for (const candidate of sizes) {
        if (Math.abs(candidate.diameter - wanted) < Math.abs(size.diameter - wanted)) size = candidate;
      }
      const spriteX = Math.round(ball.screenX - size.centerX);
      const firstLine = Math.round(ball.screenY - size.centerY);
      const offScreen = spriteX < 0 || spriteX > 255 || firstLine <= -16 || firstLine >= SCREEN_HEIGHT;
      const behind = ball.worldZ < 0;
      for (let layer = 0; layer < LAYERS_PER_BALL; layer++) {
        const mask = size.masks[layer];
        if (offScreen || !mask) {
          sat.push(SAT_PARK_Y, 0, 0, 0);
          continue;
        }
        let pattern = size.firstPattern + layer;
        if (behind && picture) {
          // cut out whatever the picture covers
          let total = 0;
          let visible = 0;
          const visibleMask = mask.map((row, y) => row.map((on, x) => {
            if (!on) return false;
            total++;
            const keep = !hidden(spriteX + x, firstLine + y);
            if (keep) visible++;
            return keep;
          }));
          if (visible === 0) {
            sat.push(SAT_PARK_Y, 0, 0, 0);
            parkedPlanes++;
            continue;
          }
          if (visible < total) {
            pattern = dynamicPatternBase + clipped.length;
            clipped.push(quadrantPattern(visibleMask));
            clippedPatterns++;
          }
        }
        // the SAT Y byte is the line above the first displayed line
        sat.push((firstLine - 1) & 0xff, spriteX, pattern * 4, 0);
      }
    }
    records.push([clipped.length, ...sat, ...clipped.flat()]);
  }

  // Pack the records into blocks of at most one 8 KB data bank; a record never straddles two blocks.
  const frameBlocks: number[][] = [];
  for (const record of records) {
    const last = frameBlocks[frameBlocks.length - 1];
    if (last && last.length + record.length <= MAX_BLOCK_BYTES) last.push(...record);
    else frameBlocks.push([...record]);
  }
  const totalBytes = frameBlocks.reduce((sum, block) => sum + block.length, 0);
  const pictureText = picture
    ? `picture mask ${picture.bounds.width}x${picture.bounds.height} at ${picture.bounds.x},${picture.bounds.y}`
    : 'no picture detected (nothing is hidden)';
  return {
    patternBytes,
    colorBytes,
    frameBlocks,
    frameCount: cycleFrames,
    planeCount: PLANE_COUNT,
    delay,
    dynamicPatternBase,
    orbitRadius,
    paletteEntries: { rim, highlight, body },
    summary: `palette entries rim ${rim}, highlight ${highlight}, body ${body}; ${pictureText}; orbit radius ${Math.round(orbitRadius)} px; ${cycleFrames} frames in ${frameBlocks.length} block(s), ${totalBytes} bytes, ${clippedPatterns} clipped patterns, ${parkedPlanes} planes hidden`,
  };
}

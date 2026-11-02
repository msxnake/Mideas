/**
 * Minimal, dependency-free RGBA image helpers for the AI Game Sketch exporter.
 *
 * - `RgbaImage` is a plain RGBA8888 buffer (works in browser and Node).
 * - `encodePng` writes a valid PNG using *stored* (uncompressed) deflate blocks.
 *   The sketch ZIP is DEFLATE-compressed afterwards, so file size stays small
 *   without pulling a zlib implementation into the bundle.
 * - `scaleImage` upscales pixel art either with nearest-neighbour (exact
 *   blocks) or with the Scale2x/Scale3x (EPX family) smoothing filters, which
 *   keep the original palette (no new colours are invented).
 */

export interface RgbaImage {
  width: number;
  height: number;
  /** width * height * 4 bytes, row-major, RGBA. */
  data: Uint8Array;
}

export type ScaleMethod = 'nearest' | 'smooth';

export function createImage(width: number, height: number): RgbaImage {
  return { width, height, data: new Uint8Array(Math.max(0, width * height * 4)) };
}

/** Parses '#RRGGBB', '#RGB', 'rgb(...)' or 'rgba(...)'. Unknown/empty => transparent. */
export function parseCssColor(color: string | null | undefined): [number, number, number, number] {
  if (!color) return [0, 0, 0, 0];
  const c = String(color).trim();
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16), 255];
    }
    if (hex.length >= 6) {
      const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) : 255;
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), a];
    }
    return [0, 0, 0, 0];
  }
  const m = c.match(/^rgba?\(([^)]*)\)$/i);
  if (m) {
    const parts = m[1].split(',').map(p => p.trim());
    const r = Number(parts[0]) || 0;
    const g = Number(parts[1]) || 0;
    const b = Number(parts[2]) || 0;
    const aRaw = parts.length > 3 ? Number(parts[3]) : 1;
    const a = Number.isFinite(aRaw) ? Math.round(Math.max(0, Math.min(1, aRaw)) * 255) : 255;
    return [r, g, b, a];
  }
  return [0, 0, 0, 0];
}

export function setPixel(img: RgbaImage, x: number, y: number, rgba: [number, number, number, number]) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const o = (y * img.width + x) * 4;
  img.data[o] = rgba[0];
  img.data[o + 1] = rgba[1];
  img.data[o + 2] = rgba[2];
  img.data[o + 3] = rgba[3];
}

export function fillImage(img: RgbaImage, rgba: [number, number, number, number]) {
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = rgba[0];
    img.data[i + 1] = rgba[1];
    img.data[i + 2] = rgba[2];
    img.data[i + 3] = rgba[3];
  }
}

/** Copies `src` into `dst` at (dx,dy). Transparent source pixels are skipped. */
export function blit(dst: RgbaImage, src: RgbaImage, dx: number, dy: number) {
  for (let y = 0; y < src.height; y++) {
    const ty = dy + y;
    if (ty < 0 || ty >= dst.height) continue;
    for (let x = 0; x < src.width; x++) {
      const tx = dx + x;
      if (tx < 0 || tx >= dst.width) continue;
      const so = (y * src.width + x) * 4;
      if (src.data[so + 3] === 0) continue;
      const doff = (ty * dst.width + tx) * 4;
      dst.data[doff] = src.data[so];
      dst.data[doff + 1] = src.data[so + 1];
      dst.data[doff + 2] = src.data[so + 2];
      dst.data[doff + 3] = src.data[so + 3];
    }
  }
}

/** Builds an image from Mideas PixelData (2D array of CSS colours). */
export function imageFromPixelData(pixels: string[][] | undefined, width?: number, height?: number): RgbaImage {
  const h = height ?? pixels?.length ?? 0;
  const w = width ?? (pixels?.[0]?.length ?? 0);
  const img = createImage(w, h);
  for (let y = 0; y < h; y++) {
    const row = pixels?.[y];
    if (!row) continue;
    for (let x = 0; x < w; x++) {
      setPixel(img, x, y, parseCssColor(row[x] as any));
    }
  }
  return img;
}

// ---------------------------------------------------------------------------
// Scaling
// ---------------------------------------------------------------------------

function readU32(img: RgbaImage, x: number, y: number): number {
  const cx = x < 0 ? 0 : x >= img.width ? img.width - 1 : x;
  const cy = y < 0 ? 0 : y >= img.height ? img.height - 1 : y;
  const o = (cy * img.width + cx) * 4;
  // Unsigned 32-bit pack (RGBA).
  return ((img.data[o] << 24) | (img.data[o + 1] << 16) | (img.data[o + 2] << 8) | img.data[o + 3]) >>> 0;
}

function writeU32(img: RgbaImage, x: number, y: number, v: number) {
  const o = (y * img.width + x) * 4;
  img.data[o] = (v >>> 24) & 0xff;
  img.data[o + 1] = (v >>> 16) & 0xff;
  img.data[o + 2] = (v >>> 8) & 0xff;
  img.data[o + 3] = v & 0xff;
}

export function scaleNearest(src: RgbaImage, factor: number): RgbaImage {
  const f = Math.max(1, Math.floor(factor));
  if (f === 1) return { width: src.width, height: src.height, data: src.data.slice() };
  const dst = createImage(src.width * f, src.height * f);
  for (let y = 0; y < dst.height; y++) {
    const sy = Math.floor(y / f);
    for (let x = 0; x < dst.width; x++) {
      const sx = Math.floor(x / f);
      const so = (sy * src.width + sx) * 4;
      const doff = (y * dst.width + x) * 4;
      dst.data[doff] = src.data[so];
      dst.data[doff + 1] = src.data[so + 1];
      dst.data[doff + 2] = src.data[so + 2];
      dst.data[doff + 3] = src.data[so + 3];
    }
  }
  return dst;
}

/** Scale2x / AdvMAME2x. Keeps the source palette. */
export function scale2x(src: RgbaImage): RgbaImage {
  const dst = createImage(src.width * 2, src.height * 2);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const B = readU32(src, x, y - 1);
      const D = readU32(src, x - 1, y);
      const E = readU32(src, x, y);
      const F = readU32(src, x + 1, y);
      const H = readU32(src, x, y + 1);
      let e0 = E, e1 = E, e2 = E, e3 = E;
      if (B !== H && D !== F) {
        e0 = D === B ? D : E;
        e1 = B === F ? F : E;
        e2 = D === H ? D : E;
        e3 = H === F ? F : E;
      }
      writeU32(dst, x * 2, y * 2, e0);
      writeU32(dst, x * 2 + 1, y * 2, e1);
      writeU32(dst, x * 2, y * 2 + 1, e2);
      writeU32(dst, x * 2 + 1, y * 2 + 1, e3);
    }
  }
  return dst;
}

/** Scale3x / AdvMAME3x. Keeps the source palette. */
export function scale3x(src: RgbaImage): RgbaImage {
  const dst = createImage(src.width * 3, src.height * 3);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const A = readU32(src, x - 1, y - 1);
      const B = readU32(src, x, y - 1);
      const C = readU32(src, x + 1, y - 1);
      const D = readU32(src, x - 1, y);
      const E = readU32(src, x, y);
      const F = readU32(src, x + 1, y);
      const G = readU32(src, x - 1, y + 1);
      const H = readU32(src, x, y + 1);
      const I = readU32(src, x + 1, y + 1);
      const out = [E, E, E, E, E, E, E, E, E];
      if (B !== H && D !== F) {
        out[0] = D === B ? D : E;
        out[1] = (D === B && E !== C) || (B === F && E !== A) ? B : E;
        out[2] = B === F ? F : E;
        out[3] = (D === B && E !== G) || (D === H && E !== A) ? D : E;
        out[4] = E;
        out[5] = (B === F && E !== I) || (H === F && E !== C) ? F : E;
        out[6] = D === H ? D : E;
        out[7] = (D === H && E !== I) || (H === F && E !== G) ? H : E;
        out[8] = H === F ? F : E;
      }
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
          writeU32(dst, x * 3 + i, y * 3 + j, out[j * 3 + i]);
        }
      }
    }
  }
  return dst;
}

/**
 * Upscales by an integer factor. With `smooth`, the factor is decomposed in
 * 2x/3x Scale passes (2,3,4,6,8,9...). Any remaining prime factor (5,7...)
 * is applied with nearest-neighbour.
 */
export function scaleImage(src: RgbaImage, factor: number, method: ScaleMethod): RgbaImage {
  const f = Math.max(1, Math.floor(factor));
  if (f === 1) return { width: src.width, height: src.height, data: src.data.slice() };
  if (method === 'nearest') return scaleNearest(src, f);
  let img = src;
  let remaining = f;
  while (remaining % 3 === 0) {
    img = scale3x(img);
    remaining /= 3;
  }
  while (remaining % 2 === 0) {
    img = scale2x(img);
    remaining /= 2;
  }
  if (remaining > 1) img = scaleNearest(img, remaining);
  return img;
}

// ---------------------------------------------------------------------------
// PNG encoding
// ---------------------------------------------------------------------------

let CRC_TABLE: Uint32Array | null = null;
function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}

function crc32(bytes: Uint8Array, start = 0, end = bytes.length): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

function zlibStored(raw: Uint8Array): Uint8Array {
  const MAX = 65535;
  const blocks = Math.max(1, Math.ceil(raw.length / MAX));
  const out = new Uint8Array(2 + raw.length + blocks * 5 + 4);
  let o = 0;
  out[o++] = 0x78;
  out[o++] = 0x01;
  for (let i = 0; i < blocks; i++) {
    const start = i * MAX;
    const len = Math.min(MAX, raw.length - start);
    out[o++] = i === blocks - 1 ? 1 : 0;
    out[o++] = len & 0xff;
    out[o++] = (len >>> 8) & 0xff;
    out[o++] = ~len & 0xff;
    out[o++] = (~len >>> 8) & 0xff;
    out.set(raw.subarray(start, start + len), o);
    o += len;
  }
  const ad = adler32(raw);
  out[o++] = (ad >>> 24) & 0xff;
  out[o++] = (ad >>> 16) & 0xff;
  out[o++] = (ad >>> 8) & 0xff;
  out[o++] = ad & 0xff;
  return out;
}

function writeU32BE(buf: Uint8Array, offset: number, v: number) {
  buf[offset] = (v >>> 24) & 0xff;
  buf[offset + 1] = (v >>> 16) & 0xff;
  buf[offset + 2] = (v >>> 8) & 0xff;
  buf[offset + 3] = v & 0xff;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  writeU32BE(out, 0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  writeU32BE(out, 8 + data.length, crc32(out, 4, 8 + data.length));
  return out;
}

export function encodePng(img: RgbaImage): Uint8Array {
  const width = Math.max(1, img.width);
  const height = Math.max(1, img.height);
  const ihdr = new Uint8Array(13);
  writeU32BE(ihdr, 0, width);
  writeU32BE(ihdr, 4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    if (y < img.height && img.width === width) {
      raw.set(img.data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
    }
  }

  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const parts = [signature, chunk('IHDR', ihdr), chunk('IDAT', zlibStored(raw)), chunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

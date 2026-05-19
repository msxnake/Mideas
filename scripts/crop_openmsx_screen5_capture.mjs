import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'screenshots', 'msx2_screen5_manic_miner_openmsx.png');
const output = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(root, 'screenshots', 'msx2_screen5_manic_miner_openmsx_active.png');

const TARGET_WIDTH = 256;
const TARGET_HEIGHT = 212;

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function readPng(filePath) {
  const bytes = fs.readFileSync(filePath);
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += length + 12;
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  if (channels !== 3 && channels !== 4) {
    throw new Error(`Unsupported PNG color type ${colorType}`);
  }

  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4);
  let readOffset = 0;
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = inflated[readOffset++];
    const row = Buffer.from(inflated.subarray(readOffset, readOffset + stride));
    readOffset += stride;
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? row[i - channels] : 0;
      const up = previous[i] || 0;
      const upLeft = i >= channels ? previous[i - channels] : 0;
      let value = row[i];
      if (filter === 1) {
        value = (value + left) & 0xff;
      } else if (filter === 2) {
        value = (value + up) & 0xff;
      } else if (filter === 3) {
        value = (value + Math.floor((left + up) / 2)) & 0xff;
      } else if (filter === 4) {
        const predictor = left + up - upLeft;
        const pa = Math.abs(predictor - left);
        const pb = Math.abs(predictor - up);
        const pc = Math.abs(predictor - upLeft);
        value = (value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 0xff;
      }
      row[i] = value;
    }
    for (let x = 0; x < width; x++) {
      const src = x * channels;
      const dst = ((y * width) + x) * 4;
      pixels[dst] = row[src];
      pixels[dst + 1] = row[src + 1];
      pixels[dst + 2] = row[src + 2];
      pixels[dst + 3] = channels === 4 ? row[src + 3] : 255;
    }
    previous = row;
  }

  return { width, height, pixels };
}

function writePng(filePath, width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0;
    pixels.copy(raw, offset, y * width * 4, (y + 1) * width * 4);
    offset += width * 4;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

function cropAndResize(source) {
  if (source.width !== 640 || source.height !== 480) {
    throw new Error(`Expected a 640x480 OpenMSX screenshot, got ${source.width}x${source.height}`);
  }

  const crop = { x: 25, y: 28, width: 586, height: 424 };
  const target = Buffer.alloc(TARGET_WIDTH * TARGET_HEIGHT * 4);
  for (let y = 0; y < TARGET_HEIGHT; y++) {
    const sourceY = crop.y + Math.min(crop.height - 1, Math.floor((y * crop.height) / TARGET_HEIGHT));
    for (let x = 0; x < TARGET_WIDTH; x++) {
      const sourceX = crop.x + Math.min(crop.width - 1, Math.floor((x * crop.width) / TARGET_WIDTH));
      const src = ((sourceY * source.width) + sourceX) * 4;
      const dst = ((y * TARGET_WIDTH) + x) * 4;
      target[dst] = source.pixels[src];
      target[dst + 1] = source.pixels[src + 1];
      target[dst + 2] = source.pixels[src + 2];
      target[dst + 3] = 255;
    }
  }
  return target;
}

const source = readPng(input);
writePng(output, TARGET_WIDTH, TARGET_HEIGHT, cropAndResize(source));
console.log(`Active SCREEN 5 crop: ${output}`);

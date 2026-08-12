#!/usr/bin/env node

import { deflateSync } from 'node:zlib';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_SCALE = 4;
const DEFAULT_PALETTE = [
  'rgba(0,0,0,0)', '#000000', '#24DB24', '#6DFF6D',
  '#2424FF', '#496DFF', '#B62424', '#49DBFF',
  '#FF2424', '#FF6D6D', '#DBDB24', '#DBDB92',
  '#249224', '#DB49B6', '#B6B6B6', '#FFFFFF',
];

const FALLBACK_GLYPHS = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  'C': ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
};

function usage() {
  return 'Usage: node scripts/render_msx2_hud_preview.mjs --input <project.json> [--asset <hud-id-or-name>] [--output <preview.png>] [--scale <1-32>]';
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') return { help: true };
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const equalsAt = token.indexOf('=');
    const key = token.slice(2, equalsAt >= 0 ? equalsAt : undefined);
    const value = equalsAt >= 0 ? token.slice(equalsAt + 1) : argv[++i];
    if (!['input', 'asset', 'output', 'scale'].includes(key)) throw new Error(`Unknown option: --${key}`);
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    options[key] = value;
  }
  return options;
}

function finiteInt(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.floor(number)));
}

function parseColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const color = value.trim();
  const shortHex = /^#([0-9a-f]{3,4})$/i.exec(color);
  if (shortHex) {
    const parts = [...shortHex[1]].map(part => Number.parseInt(part + part, 16));
    return [parts[0], parts[1], parts[2], parts[3] ?? 255];
  }
  const longHex = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color);
  if (longHex) {
    return [
      Number.parseInt(longHex[1].slice(0, 2), 16),
      Number.parseInt(longHex[1].slice(2, 4), 16),
      Number.parseInt(longHex[1].slice(4, 6), 16),
      longHex[2] ? Number.parseInt(longHex[2], 16) : 255,
    ];
  }
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(color);
  if (rgba) {
    const alpha = rgba[4] === undefined ? 255 : Math.round(Math.max(0, Math.min(1, Number(rgba[4]))) * 255);
    return [
      finiteInt(rgba[1], 0, 0, 255),
      finiteInt(rgba[2], 0, 0, 255),
      finiteInt(rgba[3], 0, 0, 255),
      alpha,
    ];
  }
  return fallback;
}

function masterIndexColor(masterIndex) {
  const value = finiteInt(masterIndex, 0, 0, 511);
  const level8 = level => Math.round(level * 255 / 7);
  return [level8((value >> 6) & 7), level8((value >> 3) & 7), level8(value & 7), 255];
}

function paletteSlotsFrom(value) {
  const slots = Array.isArray(value) ? value : value?.slots;
  if (!Array.isArray(slots)) return null;
  const palette = DEFAULT_PALETTE.map((color, index) => parseColor(color, [0, 0, 0, index === 0 ? 0 : 255]));
  for (let position = 0; position < slots.length; position += 1) {
    const slot = slots[position];
    const index = finiteInt(slot?.slotIndex ?? slot?.index ?? position, position, 0, 15);
    if (typeof slot === 'string') palette[index] = parseColor(slot, palette[index]);
    else if (slot && typeof slot === 'object') {
      if (typeof slot.hex === 'string' || typeof slot.color === 'string') {
        palette[index] = parseColor(slot.hex ?? slot.color, palette[index]);
      } else if (Number.isFinite(Number(slot.masterIndex)) && Number(slot.masterIndex) >= 0) {
        palette[index] = masterIndexColor(slot.masterIndex);
      } else if (Array.isArray(slot.rgb) && slot.rgb.length >= 3) {
        palette[index] = [
          finiteInt(slot.rgb[0], 0, 0, 255),
          finiteInt(slot.rgb[1], 0, 0, 255),
          finiteInt(slot.rgb[2], 0, 0, 255),
          slot.rgb[3] === undefined ? 255 : finiteInt(slot.rgb[3], 255, 0, 255),
        ];
      }
    }
  }
  return palette;
}

function resolvePalette(project, hud, assets) {
  const linked = assets.find(asset => asset?.id === hud.paletteAssetId);
  const candidates = [
    linked?.data, linked,
    hud.palette, hud.paletteSlots,
    project.palette, project.msx2Palette, project.projectPalette,
    assets.find(asset => String(asset?.type || '').toLowerCase() === 'palette')?.data,
  ];
  for (const candidate of candidates) {
    const palette = paletteSlotsFrom(candidate);
    if (palette) return palette;
  }
  return DEFAULT_PALETTE.map((color, index) => parseColor(color, [0, 0, 0, index === 0 ? 0 : 255]));
}

function makeCanvas(width, height, palette) {
  const pixels = new Uint8Array(width * height);
  pixels.fill(1);
  const set = (x, y, slot) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = finiteInt(slot, -1, -1, 15);
    if (index < 0 || palette[index][3] === 0) return;
    pixels[y * width + x] = index;
  };
  const rect = (x, y, w, h, slot) => {
    const left = Math.max(0, Math.floor(x));
    const top = Math.max(0, Math.floor(y));
    const right = Math.min(width, Math.floor(x + Math.max(0, w)));
    const bottom = Math.min(height, Math.floor(y + Math.max(0, h)));
    for (let py = top; py < bottom; py += 1) {
      for (let px = left; px < right; px += 1) set(px, py, slot);
    }
  };
  return { width, height, pixels, set, rect };
}

function drawIcon(canvas, icon, x, y) {
  if (!icon) return;
  const height = finiteInt(icon.height, icon.pixels?.length ?? 0, 0, 4096);
  const width = finiteInt(icon.width, icon.pixels?.[0]?.length ?? 0, 0, 4096);
  for (let iy = 0; iy < height; iy += 1) {
    for (let ix = 0; ix < width; ix += 1) {
      const slot = Number(icon.pixels?.[iy]?.[ix]);
      if (Number.isFinite(slot) && slot >= 0) canvas.set(x + ix, y + iy, slot);
    }
  }
}

function drawFallbackGlyph(canvas, char, x, y, color) {
  const rows = FALLBACK_GLYPHS[char] ?? FALLBACK_GLYPHS[' '];
  for (let row = 0; row < rows.length; row += 1) {
    for (let col = 0; col < rows[row].length; col += 1) {
      if (rows[row][col] === '1') canvas.set(x + col + 1, y + row, color);
    }
  }
}

function drawText(canvas, text, element, font, color) {
  if (!text) return;
  const normalized = [...String(text)].map(char => char.toUpperCase());
  const textWidth = normalized.length * 8;
  let x = finiteInt(element.x, 0, -65536, 65536);
  const width = finiteInt(element.width, textWidth, 0, 65536);
  if (element.align?.h === 'right') x += width - textWidth;
  else if (element.align?.h === 'center') x += Math.floor((width - textWidth) / 2);
  const y = finiteInt(element.y, 0, -65536, 65536);
  const allowed = new Set([...(font?.characters || '')]);
  const background = finiteInt(font?.screen5BackgroundSlot, 0, 0, 15);

  normalized.forEach((rawChar, charIndex) => {
    const char = allowed.size === 0 || allowed.has(rawChar) ? rawChar : ' ';
    const bitmap = font?.vdpMode === 'SCREEN5' ? (font.bitmapPatterns?.[char] ?? font.bitmapPatterns?.[' ']) : null;
    if (Array.isArray(bitmap)) {
      for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
          const slot = Number(bitmap[row]?.[col]);
          if (Number.isFinite(slot) && slot !== background) canvas.set(x + charIndex * 8 + col, y + row, slot);
        }
      }
      return;
    }
    const pattern = font?.patterns?.[char] ?? font?.patterns?.[' '];
    if (Array.isArray(pattern)) {
      for (let row = 0; row < 8; row += 1) {
        const bits = Number(pattern[row]) || 0;
        for (let col = 0; col < 8; col += 1) {
          if (bits & (0x80 >> col)) canvas.set(x + charIndex * 8 + col, y + row, color);
        }
      }
      return;
    }
    drawFallbackGlyph(canvas, char, x + charIndex * 8, y, color);
  });
}

function formatValue(element) {
  const value = Math.max(0, Math.floor(Number(element.initialValue) || 0));
  const digits = finiteInt(element.format?.digits, 3, 1, 16);
  const base = element.format?.base === 'hex' ? 16 : 10;
  let result = value.toString(base).toUpperCase();
  if (element.format?.zeroPad) result = result.padStart(digits, '0');
  return `${element.format?.prefix || ''}${result}`;
}

function drawWidget(canvas, element, icons, font) {
  if (!element || element.visible === false) return;
  const x = finiteInt(element.x, 0, -65536, 65536);
  const y = finiteInt(element.y, 0, -65536, 65536);
  const width = finiteInt(element.width, 16, 0, 65536);
  const height = finiteInt(element.height, 16, 0, 65536);
  const colors = element.colors || {};
  const iconById = id => icons.find(icon => icon?.id === id);

  if (element.kind === 'icon') {
    canvas.rect(x, y, width, height, colors.border ?? 15);
    canvas.rect(x + 1, y + 1, Math.max(0, width - 2), Math.max(0, height - 2), colors.empty ?? 1);
    const icon = element.binding === 'carriedObject'
      ? iconById(element.emptyAtlasEntryId)
      : iconById(element.atlasEntryId);
    drawIcon(canvas, icon, x + 1, y + 1);
    return;
  }

  if (element.kind === 'counter') {
    drawText(canvas, formatValue(element), element, font, colors.text ?? 15);
    return;
  }

  if (element.kind === 'iconCounter') {
    const icon = iconById(element.atlasEntryId);
    const iconWidth = Math.min(height, 10);
    if (icon) drawIcon(canvas, icon, x, y + Math.max(0, Math.floor((height - icon.height) / 2)));
    else canvas.rect(x, y + Math.floor((height - iconWidth) / 2), iconWidth, iconWidth, colors.primary ?? 10);
    drawText(canvas, formatValue(element), {
      ...element,
      x: x + iconWidth + 1,
      width: Math.max(1, width - iconWidth - 1),
      align: { ...(element.align || {}), h: 'left' },
    }, font, colors.text ?? 15);
    return;
  }

  if (element.kind === 'iconRow') {
    const step = Number(element.spacing) > 0 ? finiteInt(element.spacing, 16, 1, 4096) : 16;
    const total = Math.max(1, Math.floor(width / step));
    const maxValue = Math.max(1, finiteInt(element.maxValue, total, 1, 65535));
    const value = finiteInt(element.initialValue, maxValue, 0, maxValue);
    const fullCount = Math.round((value / maxValue) * total);
    const fullIcon = iconById(element.atlasEntryId);
    const emptyIcon = iconById(element.emptyAtlasEntryId);
    for (let index = 0; index < total; index += 1) {
      const icon = index < fullCount ? fullIcon : emptyIcon;
      if (icon) drawIcon(canvas, icon, x + index * step, y);
      else {
        const size = Math.max(1, Math.min(8, step - 2));
        canvas.rect(
          x + index * step + Math.floor((step - size) / 2),
          y + Math.floor((height - size) / 2),
          size,
          size,
          index < fullCount ? (colors.primary ?? 10) : (colors.secondary ?? 8),
        );
      }
    }
  }
}

function renderHud(project, assetSelector) {
  const assets = Array.isArray(project.assets) ? project.assets : [];
  const hudAssets = assets.filter(item => String(item?.type || '').toLowerCase() === 'msx2hud');
  const asset = assetSelector
    ? hudAssets.find(item => item.id === assetSelector || item.name === assetSelector || item.data?.name === assetSelector)
    : hudAssets[0];
  if (!asset) throw new Error('The project does not contain an msx2hud asset.');
  const hud = asset.data && typeof asset.data === 'object' ? asset.data : asset;
  const width = finiteInt(hud.width, 256, 1, 4096);
  const height = finiteInt(hud.height, 20, 1, 4096);
  const palette = resolvePalette(project, hud, assets);
  const canvas = makeCanvas(width, height, palette);
  const icons = Array.isArray(hud.icons) ? hud.icons : [];
  const fontAsset = assets.find(item => item?.id === hud.hudFontAssetId && item?.type === 'msx2hudfont');
  const font = fontAsset?.data;
  const layers = Array.isArray(hud.layers) ? [...hud.layers].reverse() : [];

  for (const layer of layers) {
    if (!layer || layer.visible === false) continue;
    if (layer.kind === 'paint' && Array.isArray(layer.pixels)) {
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const slot = Number(layer.pixels[y]?.[x]);
          if (Number.isFinite(slot) && slot >= 0) canvas.set(x, y, slot);
        }
      }
    } else if (layer.kind === 'widget') {
      drawWidget(canvas, layer.element, icons, font);
    }
  }

  return { asset, hud, palette, canvas };
}

function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return chunk;
}

function encodePng(canvas, palette, scale) {
  const width = canvas.width * scale;
  const height = canvas.height * scale;
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let sourceY = 0; sourceY < canvas.height; sourceY += 1) {
    for (let repeatY = 0; repeatY < scale; repeatY += 1) {
      const outputY = sourceY * scale + repeatY;
      raw[outputY * stride] = 0;
      for (let sourceX = 0; sourceX < canvas.width; sourceX += 1) {
        const rgba = palette[canvas.pixels[sourceY * canvas.width + sourceX]];
        for (let repeatX = 0; repeatX < scale; repeatX += 1) {
          const outputX = sourceX * scale + repeatX;
          const offset = outputY * stride + 1 + outputX * 4;
          raw[offset] = rgba[0];
          raw[offset + 1] = rgba[1];
          raw[offset + 2] = rgba[2];
          raw[offset + 3] = rgba[3];
        }
      }
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (!options.input) throw new Error(`--input is required.\n${usage()}`);
  const input = path.resolve(options.input);
  const scale = finiteInt(options.scale, DEFAULT_SCALE, 1, 32);
  if (String(scale) !== String(options.scale ?? DEFAULT_SCALE)) throw new Error('--scale must be an integer from 1 to 32.');
  const output = path.resolve(options.output || `${path.basename(input, path.extname(input))}_msx2hud.png`);
  const project = JSON.parse(await readFile(input, 'utf8'));
  const rendered = renderHud(project, options.asset);
  const png = encodePng(rendered.canvas, rendered.palette, scale);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, png);
  console.log(JSON.stringify({
    input,
    output,
    assetId: rendered.asset.id ?? null,
    assetName: rendered.asset.name ?? rendered.hud.name ?? null,
    logicalSize: `${rendered.canvas.width}x${rendered.canvas.height}`,
    pngSize: `${rendered.canvas.width * scale}x${rendered.canvas.height * scale}`,
    scale,
  }, null, 2));
}

main().catch(error => {
  console.error(`render_msx2_hud_preview: ${error.message}`);
  process.exitCode = 1;
});

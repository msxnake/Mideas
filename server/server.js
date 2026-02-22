/**
 * @fileoverview This file sets up a simple Express server to handle backend tasks
 * for the MSX IDE, such as code compilation and data compression.
 */

const express = require('express');
const cors = require('cors');
const util = require('util');
const { exec } = require('child_process');
const fs = require('fs');
const execAsync = util.promisify(exec);
const path = require('path');
const { serializeAsset } = require('./assetSerializer');

const app = express();
const port = 3001;

const ZX0_ROUTINE_OVERHEAD_BYTES = 96;
const ZX0_PER_BLOCK_RUNTIME_OVERHEAD_BYTES = 11;

function parseAsmByteToken(token) {
  const raw = token.trim();
  if (!raw) return null;

  let value;
  if (raw.startsWith('#')) {
    value = parseInt(raw.slice(1), 16);
  } else if (/^0x[0-9a-f]+$/i.test(raw)) {
    value = parseInt(raw, 16);
  } else if (/^[0-9a-f]+h$/i.test(raw)) {
    value = parseInt(raw.slice(0, -1), 16);
  } else if (/^\d+$/.test(raw)) {
    value = parseInt(raw, 10);
  } else {
    throw new Error(`Unsupported DB token: "${raw}"`);
  }

  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error(`DB value out of range (0..255): "${raw}"`);
  }

  return value;
}

function parseDbLineBytes(line) {
  const noComment = line.split(';')[0];
  const dbMatch = noComment.match(/^\s*db\s+(.+)$/i);
  if (!dbMatch) return null;

  const tokens = dbMatch[1].split(',');
  const bytes = [];
  for (const token of tokens) {
    const byte = parseAsmByteToken(token);
    if (byte !== null) bytes.push(byte);
  }
  return bytes;
}

function formatAsmDbLines(bytes, bytesPerLine = 16) {
  const lines = [];
  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    const chunk = bytes.slice(i, i + bytesPerLine);
    const parts = chunk.map((b) => `#${b.toString(16).toUpperCase().padStart(2, '0')}`);
    lines.push(`    DB ${parts.join(',')}`);
  }
  return lines;
}

function runZx0Compression(inputBytes, tempDir) {
  const { execFileSync } = require('child_process');
  const zx0JarPath = path.join(__dirname, 'zx0.jar');
  if (!fs.existsSync(zx0JarPath)) {
    throw new Error(`ZX0 jar not found: ${zx0JarPath}`);
  }

  const stamp = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const inputPath = path.join(tempDir, `zx0_screen_in_${stamp}.bin`);
  const outputPath = path.join(tempDir, `zx0_screen_out_${stamp}.bin`);

  try {
    fs.writeFileSync(inputPath, Buffer.from(inputBytes));
    execFileSync('java', ['-jar', zx0JarPath, inputPath, outputPath], { stdio: 'pipe' });
    return fs.readFileSync(outputPath);
  } finally {
    try { fs.unlinkSync(inputPath); } catch (_) {}
    try { fs.unlinkSync(outputPath); } catch (_) {}
  }
}

function hasEquSymbol(sourceCode, symbolName) {
  const re = new RegExp(`^\\s*${symbolName}\\s+EQU\\b`, 'im');
  return re.test(sourceCode);
}

function collectAsmDataBlocks(lines, labelRegex) {
  const blocks = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(labelRegex);
    if (!m) continue;

    const label = m[1];
    const bytes = [];
    let j = i + 1;
    let seenData = false;

    while (j < lines.length) {
      const trimmed = lines[j].trim();
      const parsed = parseDbLineBytes(lines[j]);
      if (parsed) {
        bytes.push(...parsed);
        seenData = true;
        j++;
        continue;
      }

      if (trimmed === '' || trimmed.startsWith(';')) {
        j++;
        continue;
      }

      // Non-DB and non-comment line ends the data block once we hit another token.
      if (seenData) break;
      break;
    }

    if (bytes.length > 0) {
      blocks.push({
        label,
        startLine: i,
        endLine: j - 1,
        bytes
      });
    }

    i = j - 1;
  }

  return blocks;
}

function injectZx0IntoUnifiedAsm(sourceCode, tempDir) {
  const info = {
    attempted: false,
    applied: false,
    method: 'ZX0',
    candidateScreens: 0,
    candidateBehaviorMaps: 0,
    candidateTilePatterns: 0,
    candidateTileColors: 0,
    candidateFontPatterns: 0,
    candidateFontColors: 0,
    candidateSpritePatterns: 0,
    compressedScreens: 0,
    compressedBehaviorMaps: 0,
    compressedTilePatterns: 0,
    compressedTileColors: 0,
    compressedFontPatterns: 0,
    compressedFontColors: 0,
    compressedSpritePatterns: 0,
    originalBytes: 0,
    compressedBytes: 0,
    savedBytes: 0,
    netSavedBytes: 0,
    warning: null,
    screenBufferSymbol: null,
    behaviorBufferSymbol: null,
    tilePatternBufferSymbol: null,
    tileColorBufferSymbol: null,
    fontPatternBufferSymbol: null,
    fontColorBufferSymbol: null,
    spritePatternBufferSymbol: null
  };

  if (!/;\s*File:\s*unitedFiles\.asm/i.test(sourceCode)) {
    return { code: sourceCode, info };
  }
  const hasLayoutData = /SCREEN_[A-Z0-9_]+_\d+_LAYOUT:/.test(sourceCode);
  const hasBehaviorData = /BEHAVIOR_[A-Z0-9_]+_\d+_DATA:/.test(sourceCode);
  const hasTilePatternData = /^\s*tile_pattern_[a-z0-9_]+:\s*$/im.test(sourceCode);
  const hasTileColorData = /^\s*tile_color_[a-z0-9_]+:\s*$/im.test(sourceCode);
  const hasFontPatternData = /^\s*FONT_PATTERN_DATA:\s*$/im.test(sourceCode);
  const hasFontColorData = /^\s*FONT_COLOR_DATA:\s*$/im.test(sourceCode);
  const hasSpritePatternData = /^\s*(?:[A-Z][A-Z0-9_]*_F\d+_LAYER\d+|SPRITE_PLACEHOLDER_PATTERN):\s*$/im.test(sourceCode);
  if (
    !hasLayoutData &&
    !hasBehaviorData &&
    !hasTilePatternData &&
    !hasTileColorData &&
    !hasFontPatternData &&
    !hasFontColorData &&
    !hasSpritePatternData
  ) {
    return { code: sourceCode, info };
  }

  const sourceHasZx0Routine = /^\s*dzx0_standard:/im.test(sourceCode);
  const screenBufferSymbol = hasEquSymbol(sourceCode, 'LEVEL_MAP_RAM') ? 'LEVEL_MAP_RAM' : 'ZX0_SCREEN_BUFFER';
  const behaviorBufferSymbol = hasEquSymbol(sourceCode, 'BEHAVIOR_MAP_RAM') ? 'BEHAVIOR_MAP_RAM' : 'ZX0_BEHAVIOR_BUFFER';
  const tilePatternBufferSymbol = hasEquSymbol(sourceCode, 'ZX0_TILE_PATTERN_BUFFER') ? 'ZX0_TILE_PATTERN_BUFFER' : 'ZX0_TILE_PATTERN_BUFFER';
  const tileColorBufferSymbol = hasEquSymbol(sourceCode, 'ZX0_TILE_COLOR_BUFFER') ? 'ZX0_TILE_COLOR_BUFFER' : 'ZX0_TILE_COLOR_BUFFER';
  const fontPatternBufferSymbol = hasEquSymbol(sourceCode, 'ZX0_FONT_PATTERN_BUFFER') ? 'ZX0_FONT_PATTERN_BUFFER' : 'ZX0_FONT_PATTERN_BUFFER';
  const fontColorBufferSymbol = hasEquSymbol(sourceCode, 'ZX0_FONT_COLOR_BUFFER') ? 'ZX0_FONT_COLOR_BUFFER' : 'ZX0_FONT_COLOR_BUFFER';
  const spritePatternBufferSymbol = hasEquSymbol(sourceCode, 'ZX0_SPRITE_PATTERN_BUFFER') ? 'ZX0_SPRITE_PATTERN_BUFFER' : 'ZX0_SPRITE_PATTERN_BUFFER';
  info.screenBufferSymbol = screenBufferSymbol;
  info.behaviorBufferSymbol = behaviorBufferSymbol;
  info.tilePatternBufferSymbol = tilePatternBufferSymbol;
  info.tileColorBufferSymbol = tileColorBufferSymbol;
  info.fontPatternBufferSymbol = fontPatternBufferSymbol;
  info.fontColorBufferSymbol = fontColorBufferSymbol;
  info.spritePatternBufferSymbol = spritePatternBufferSymbol;

  info.attempted = true;
  const lines = sourceCode.split(/\r?\n/);
  const layoutBlocks = collectAsmDataBlocks(lines, /^\s*(SCREEN_[A-Z0-9_]+_\d+_LAYOUT):\s*$/);
  const behaviorBlocks = collectAsmDataBlocks(lines, /^\s*(BEHAVIOR_[A-Z0-9_]+_\d+_DATA):\s*$/);
  const tilePatternBlocks = collectAsmDataBlocks(lines, /^\s*(tile_pattern_[a-z0-9_]+):\s*$/i);
  const tileColorBlocks = collectAsmDataBlocks(lines, /^\s*(tile_color_[a-z0-9_]+):\s*$/i);
  const fontPatternBlocks = collectAsmDataBlocks(lines, /^\s*(FONT_PATTERN_DATA):\s*$/i);
  const fontColorBlocks = collectAsmDataBlocks(lines, /^\s*(FONT_COLOR_DATA):\s*$/i);
  const spritePatternBlocks = collectAsmDataBlocks(lines, /^\s*([A-Z][A-Z0-9_]*_F\d+_LAYER\d+|SPRITE_PLACEHOLDER_PATTERN):(?:\s*;.*)?\s*$/);

  if (
    layoutBlocks.length === 0 &&
    behaviorBlocks.length === 0 &&
    tilePatternBlocks.length === 0 &&
    tileColorBlocks.length === 0 &&
    fontPatternBlocks.length === 0 &&
    fontColorBlocks.length === 0 &&
    spritePatternBlocks.length === 0
  ) {
    return { code: sourceCode, info };
  }

  info.candidateScreens = layoutBlocks.length;
  info.candidateBehaviorMaps = behaviorBlocks.length;
  info.candidateTilePatterns = tilePatternBlocks.length;
  info.candidateTileColors = tileColorBlocks.length;
  info.candidateFontPatterns = fontPatternBlocks.length;
  info.candidateFontColors = fontColorBlocks.length;
  info.candidateSpritePatterns = spritePatternBlocks.length;

  const selectedLayoutBlocks = new Map();
  const selectedBehaviorBlocks = new Map();
  const selectedTilePatternBlocks = new Map();
  const selectedTileColorBlocks = new Map();
  const selectedFontPatternBlocks = new Map();
  const selectedFontColorBlocks = new Map();
  let selectedSpritePatternBlob = null;

  function processBlocks(blocks, kind) {
    for (const block of blocks) {
      info.originalBytes += block.bytes.length;
      try {
        const compressed = runZx0Compression(block.bytes, tempDir);
        if (compressed.length < block.bytes.length) {
          const selected = {
            ...block,
            kind,
            compressedBytes: Array.from(compressed.values())
          };
          if (kind === 'layout') {
            selectedLayoutBlocks.set(block.label.toUpperCase(), selected);
            info.compressedScreens += 1;
          } else if (kind === 'behavior') {
            selectedBehaviorBlocks.set(block.label.toUpperCase(), selected);
            info.compressedBehaviorMaps += 1;
          } else if (kind === 'tile_pattern') {
            selectedTilePatternBlocks.set(block.label.toUpperCase(), selected);
            info.compressedTilePatterns += 1;
          } else if (kind === 'tile_color') {
            selectedTileColorBlocks.set(block.label.toUpperCase(), selected);
            info.compressedTileColors += 1;
          } else if (kind === 'font_pattern') {
            selectedFontPatternBlocks.set(block.label.toUpperCase(), selected);
            info.compressedFontPatterns += 1;
          } else if (kind === 'font_color') {
            selectedFontColorBlocks.set(block.label.toUpperCase(), selected);
            info.compressedFontColors += 1;
          }
          info.compressedBytes += compressed.length;
          info.savedBytes += (block.bytes.length - compressed.length);
        } else {
          info.compressedBytes += block.bytes.length;
        }
      } catch (err) {
        if (!info.warning) {
          info.warning = `ZX0 compression failed for ${block.label}: ${err.message}`;
        }
        info.compressedBytes += block.bytes.length;
      }
    }
  }

  processBlocks(layoutBlocks, 'layout');
  processBlocks(behaviorBlocks, 'behavior');
  processBlocks(tilePatternBlocks, 'tile_pattern');
  processBlocks(tileColorBlocks, 'tile_color');
  processBlocks(fontPatternBlocks, 'font_pattern');
  processBlocks(fontColorBlocks, 'font_color');

  if (spritePatternBlocks.length > 0) {
    const spriteBytes = [];
    const spriteLabelOffsets = new Map();
    for (const block of spritePatternBlocks) {
      spriteLabelOffsets.set(block.label, spriteBytes.length);
      spriteBytes.push(...block.bytes);
    }

    info.originalBytes += spriteBytes.length;
    // Keep a conservative RAM margin so sprite blob doesn't consume all free RAM.
    const MAX_SAFE_SPRITE_BLOB_BYTES = 0x2200; // 8704 bytes
    if (spriteBytes.length > MAX_SAFE_SPRITE_BLOB_BYTES) {
      info.compressedBytes += spriteBytes.length;
      if (!info.warning) {
        info.warning = `ZX0 sprite blob skipped: ${spriteBytes.length} bytes exceeds safe RAM budget (${MAX_SAFE_SPRITE_BLOB_BYTES} bytes).`;
      }
    } else {
      try {
        const compressed = runZx0Compression(spriteBytes, tempDir);
        if (compressed.length < spriteBytes.length) {
          selectedSpritePatternBlob = {
            kind: 'sprite_pattern_blob',
            label: 'ZX0_SPRITE_PATTERN_DATA',
            bytes: spriteBytes,
            compressedBytes: Array.from(compressed.values()),
            blocks: spritePatternBlocks,
            labelOffsets: spriteLabelOffsets
          };
          info.compressedSpritePatterns = spritePatternBlocks.length;
          info.compressedBytes += compressed.length;
          info.savedBytes += (spriteBytes.length - compressed.length);
        } else {
          info.compressedBytes += spriteBytes.length;
        }
      } catch (err) {
        if (!info.warning) {
          info.warning = `ZX0 compression failed for sprite pattern blob: ${err.message}`;
        }
        info.compressedBytes += spriteBytes.length;
      }
    }
  }

  const compressedBlockCount =
    selectedLayoutBlocks.size +
    selectedBehaviorBlocks.size +
    selectedTilePatternBlocks.size +
    selectedTileColorBlocks.size +
    selectedFontPatternBlocks.size +
    selectedFontColorBlocks.size +
    (selectedSpritePatternBlob ? 1 : 0);
  const routineOverhead = (compressedBlockCount > 0 && !sourceHasZx0Routine) ? ZX0_ROUTINE_OVERHEAD_BYTES : 0;
  const runtimeOverhead = compressedBlockCount * ZX0_PER_BLOCK_RUNTIME_OVERHEAD_BYTES;
  info.netSavedBytes = info.savedBytes - routineOverhead - runtimeOverhead;

  if (compressedBlockCount === 0 || info.netSavedBytes <= 0) {
    return { code: sourceCode, info };
  }

  const replacementByStart = new Map();
  const allSelectedBlocks = [
    ...selectedLayoutBlocks.values(),
    ...selectedBehaviorBlocks.values(),
    ...selectedTilePatternBlocks.values(),
    ...selectedTileColorBlocks.values(),
    ...selectedFontPatternBlocks.values(),
    ...selectedFontColorBlocks.values()
  ];
  for (const block of allSelectedBlocks) {
    const replacement = [];
    replacement.push(lines[block.startLine]);
    replacement.push(`    ; ZX0 compressed ${block.kind} (${block.bytes.length} -> ${block.compressedBytes.length} bytes)`);
    replacement.push(...formatAsmDbLines(block.compressedBytes));
    replacementByStart.set(block.startLine, { endLine: block.endLine, lines: replacement });
  }

  const compressedLayoutLabels = new Set(Array.from(selectedLayoutBlocks.keys()));
  const compressedBehaviorLabels = new Set(Array.from(selectedBehaviorBlocks.keys()));
  const compressedTilePatternLabels = new Set(Array.from(selectedTilePatternBlocks.keys()));
  const compressedTileColorLabels = new Set(Array.from(selectedTileColorBlocks.keys()));
  const compressedFontPatternLabels = new Set(Array.from(selectedFontPatternBlocks.keys()));
  const compressedFontColorLabels = new Set(Array.from(selectedFontColorBlocks.keys()));
  if (selectedSpritePatternBlob) {
    for (const block of selectedSpritePatternBlob.blocks) {
      replacementByStart.set(block.startLine, {
        endLine: block.endLine,
        lines: [`    ; ZX0 compressed sprite pattern moved to ${selectedSpritePatternBlob.label} (${block.bytes.length} bytes)`]
      });
    }
  }
  const rebuilt = [];
  for (let i = 0; i < lines.length; i++) {
    if (replacementByStart.has(i)) {
      const replacement = replacementByStart.get(i);
      rebuilt.push(...replacement.lines);
      i = replacement.endLine;
      continue;
    }
    rebuilt.push(lines[i]);
  }

  const patched = [];
  let inLoadScreen = false;
  let inLoadPattern = false;
  let inLoadColor = false;
  let layoutDecompressedInCurrentFunction = false;
  let behaviorDecompressedInCurrentFunction = false;
  let patternDecompressedInCurrentFunction = false;
  let colorDecompressedInCurrentFunction = false;
  let spriteBlobInitInjected = false;
  let spriteBlobSubmenuInjected = false;
  let fontBlobInitInjected = false;

  for (const line of rebuilt) {
    if (selectedSpritePatternBlob && /^\s*init_sprite_system:\s*$/i.test(line)) {
      patched.push(line);
      patched.push('    ; Decompress ZX0 sprite pattern blob into RAM buffer');
      patched.push('    di');
      patched.push(`    ld hl, ${selectedSpritePatternBlob.label}`);
      patched.push(`    ld de, ${spritePatternBufferSymbol}`);
      patched.push('    call dzx0_standard');
      patched.push('    ei');
      spriteBlobInitInjected = true;
      continue;
    }

    if (selectedSpritePatternBlob && !spriteBlobInitInjected && /^\s*init_sprites:\s*$/i.test(line)) {
      patched.push(line);
      patched.push('    ; Decompress ZX0 sprite pattern blob into RAM buffer');
      patched.push('    di');
      patched.push(`    ld hl, ${selectedSpritePatternBlob.label}`);
      patched.push(`    ld de, ${spritePatternBufferSymbol}`);
      patched.push('    call dzx0_standard');
      patched.push('    ei');
      spriteBlobInitInjected = true;
      continue;
    }

    if (selectedSpritePatternBlob && /^\s*submenu_prepare_cursor_sprite:\s*$/i.test(line)) {
      patched.push(line);
      if (!spriteBlobSubmenuInjected) {
        patched.push('    ; Ensure sprite pattern blob is available for submenu cursor');
        patched.push('    di');
        patched.push(`    ld hl, ${selectedSpritePatternBlob.label}`);
        patched.push(`    ld de, ${spritePatternBufferSymbol}`);
        patched.push('    call dzx0_standard');
        patched.push('    ei');
        spriteBlobSubmenuInjected = true;
      }
      continue;
    }

    if ((compressedFontPatternLabels.size > 0 || compressedFontColorLabels.size > 0) && /^\s*init_font_system:\s*$/i.test(line)) {
      patched.push(line);
      if (!fontBlobInitInjected) {
        if (compressedFontPatternLabels.size > 0) {
          patched.push('    ; Decompress ZX0 font pattern data into RAM buffer');
          patched.push('    di');
          patched.push('    ld hl, FONT_PATTERN_DATA');
          patched.push(`    ld de, ${fontPatternBufferSymbol}`);
          patched.push('    call dzx0_standard');
          patched.push('    ei');
        }
        if (compressedFontColorLabels.size > 0) {
          patched.push('    ; Decompress ZX0 font color data into RAM buffer');
          patched.push('    di');
          patched.push('    ld hl, FONT_COLOR_DATA');
          patched.push(`    ld de, ${fontColorBufferSymbol}`);
          patched.push('    call dzx0_standard');
          patched.push('    ei');
        }
        fontBlobInitInjected = true;
      }
      continue;
    }

    if (/^\s*load_screen_[a-z0-9_]+:\s*$/i.test(line)) {
      inLoadScreen = true;
      inLoadPattern = false;
      inLoadColor = false;
      layoutDecompressedInCurrentFunction = false;
      behaviorDecompressedInCurrentFunction = false;
      patternDecompressedInCurrentFunction = false;
      colorDecompressedInCurrentFunction = false;
      patched.push(line);
      continue;
    }

    if (/^\s*load_pattern_[a-z0-9_]+:\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadPattern = true;
      inLoadColor = false;
      layoutDecompressedInCurrentFunction = false;
      behaviorDecompressedInCurrentFunction = false;
      patternDecompressedInCurrentFunction = false;
      colorDecompressedInCurrentFunction = false;
      patched.push(line);
      continue;
    }

    if (/^\s*load_color_[a-z0-9_]+:\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadPattern = false;
      inLoadColor = true;
      layoutDecompressedInCurrentFunction = false;
      behaviorDecompressedInCurrentFunction = false;
      patternDecompressedInCurrentFunction = false;
      colorDecompressedInCurrentFunction = false;
      patched.push(line);
      continue;
    }

    const hlLayoutMatch = line.match(/^\s*ld\s+hl,\s*(SCREEN_[A-Z0-9_]+_\d+_LAYOUT)(\s*\+\s*\d+)?\s*(?:;.*)?$/i);
    if (inLoadScreen && hlLayoutMatch) {
      const layoutLabel = hlLayoutMatch[1].toUpperCase();
      const offset = hlLayoutMatch[2] ? hlLayoutMatch[2].replace(/\s+/g, '') : '';
        if (compressedLayoutLabels.has(layoutLabel)) {
          if (!layoutDecompressedInCurrentFunction) {
            patched.push('    ; Decompress ZX0 screen layout into RAM buffer');
            patched.push('    di');
            patched.push(`    ld hl, ${hlLayoutMatch[1]}`);
            patched.push(`    ld de, ${screenBufferSymbol}`);
            patched.push('    call dzx0_standard');
            patched.push('    ei');
            layoutDecompressedInCurrentFunction = true;
          }
          patched.push(`    ld hl, ${screenBufferSymbol}${offset}`);
          continue;
        }
    }

    const hlBehaviorMatch = line.match(/^\s*ld\s+hl,\s*(BEHAVIOR_[A-Z0-9_]+_\d+_DATA)\s*(?:;.*)?$/i);
    if (inLoadScreen && hlBehaviorMatch) {
      const behaviorLabel = hlBehaviorMatch[1].toUpperCase();
      if (compressedBehaviorLabels.has(behaviorLabel)) {
        if (!behaviorDecompressedInCurrentFunction) {
          patched.push('    ; Decompress ZX0 behavior map into RAM buffer');
          patched.push('    di');
          patched.push(`    ld hl, ${hlBehaviorMatch[1]}`);
          patched.push(`    ld de, ${behaviorBufferSymbol}`);
          patched.push('    call dzx0_standard');
          patched.push('    ei');
          behaviorDecompressedInCurrentFunction = true;
        }
        patched.push(`    ld hl, ${behaviorBufferSymbol}`);
        continue;
      }
    }

    const hlTilePatternMatch = line.match(/^\s*ld\s+hl,\s*(tile_pattern_[a-z0-9_]+)(\s*\+\s*\d+)?\s*(?:;.*)?$/i);
    if (inLoadPattern && hlTilePatternMatch) {
      const patternLabel = hlTilePatternMatch[1].toUpperCase();
      const offset = hlTilePatternMatch[2] ? hlTilePatternMatch[2].replace(/\s+/g, '') : '';
      if (compressedTilePatternLabels.has(patternLabel)) {
        if (!patternDecompressedInCurrentFunction) {
          patched.push('    ; Decompress ZX0 tile pattern data into RAM buffer');
          patched.push('    di');
          patched.push(`    ld hl, ${hlTilePatternMatch[1]}`);
          patched.push(`    ld de, ${tilePatternBufferSymbol}`);
          patched.push('    call dzx0_standard');
          patched.push('    ei');
          patternDecompressedInCurrentFunction = true;
        }
        patched.push(`    ld hl, ${tilePatternBufferSymbol}${offset}`);
        continue;
      }
    }

    const hlTileColorMatch = line.match(/^\s*ld\s+hl,\s*(tile_color_[a-z0-9_]+)(\s*\+\s*\d+)?\s*(?:;.*)?$/i);
    if (inLoadColor && hlTileColorMatch) {
      const colorLabel = hlTileColorMatch[1].toUpperCase();
      const offset = hlTileColorMatch[2] ? hlTileColorMatch[2].replace(/\s+/g, '') : '';
      if (compressedTileColorLabels.has(colorLabel)) {
        if (!colorDecompressedInCurrentFunction) {
          patched.push('    ; Decompress ZX0 tile color data into RAM buffer');
          patched.push('    di');
          patched.push(`    ld hl, ${hlTileColorMatch[1]}`);
          patched.push(`    ld de, ${tileColorBufferSymbol}`);
          patched.push('    call dzx0_standard');
          patched.push('    ei');
          colorDecompressedInCurrentFunction = true;
        }
        patched.push(`    ld hl, ${tileColorBufferSymbol}${offset}`);
        continue;
      }
    }

    if (compressedFontPatternLabels.size > 0 && /^\s*ld\s+iy,\s*FONT_PATTERN_DATA\s*(?:;.*)?$/i.test(line)) {
      patched.push(`    ld iy, ${fontPatternBufferSymbol}`);
      continue;
    }

    if (compressedFontColorLabels.size > 0 && /^\s*ld\s+iy,\s*FONT_COLOR_DATA\s*(?:;.*)?$/i.test(line)) {
      patched.push(`    ld iy, ${fontColorBufferSymbol}`);
      continue;
    }

    if ((inLoadScreen || inLoadPattern || inLoadColor) && /^\s*ret\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadPattern = false;
      inLoadColor = false;
      layoutDecompressedInCurrentFunction = false;
      behaviorDecompressedInCurrentFunction = false;
      patternDecompressedInCurrentFunction = false;
      colorDecompressedInCurrentFunction = false;
      patched.push(line);
      continue;
    }

    patched.push(line);
  }

  let finalCode = patched.join('\n');
  const extraEquBlocks = [];
  const maxLayoutSize = selectedLayoutBlocks.size > 0
    ? Math.max(...Array.from(selectedLayoutBlocks.values()).map(b => b.bytes.length))
    : 0;
  const maxBehaviorSize = selectedBehaviorBlocks.size > 0
    ? Math.max(...Array.from(selectedBehaviorBlocks.values()).map(b => b.bytes.length))
    : 0;
  const maxTilePatternSize = selectedTilePatternBlocks.size > 0
    ? Math.max(...Array.from(selectedTilePatternBlocks.values()).map(b => b.bytes.length))
    : 0;
  const maxTileColorSize = selectedTileColorBlocks.size > 0
    ? Math.max(...Array.from(selectedTileColorBlocks.values()).map(b => b.bytes.length))
    : 0;
  const maxFontPatternSize = selectedFontPatternBlocks.size > 0
    ? Math.max(...Array.from(selectedFontPatternBlocks.values()).map(b => b.bytes.length))
    : 0;
  const maxFontColorSize = selectedFontColorBlocks.size > 0
    ? Math.max(...Array.from(selectedFontColorBlocks.values()).map(b => b.bytes.length))
    : 0;
  const maxSpritePatternSize = selectedSpritePatternBlob
    ? selectedSpritePatternBlob.bytes.length
    : 0;

  const needsScreenBufferEqu = selectedLayoutBlocks.size > 0 &&
    screenBufferSymbol === 'ZX0_SCREEN_BUFFER' &&
    !/^\s*ZX0_SCREEN_BUFFER\s+EQU\s+/im.test(finalCode);

  const needsBehaviorBufferEqu = selectedBehaviorBlocks.size > 0 &&
    behaviorBufferSymbol === 'ZX0_BEHAVIOR_BUFFER' &&
    !/^\s*ZX0_BEHAVIOR_BUFFER\s+EQU\s+/im.test(finalCode);

  const needsTilePatternBufferEqu = selectedTilePatternBlocks.size > 0 &&
    tilePatternBufferSymbol === 'ZX0_TILE_PATTERN_BUFFER' &&
    !/^\s*ZX0_TILE_PATTERN_BUFFER\s+EQU\s+/im.test(finalCode);

  const needsTileColorBufferEqu = selectedTileColorBlocks.size > 0 &&
    tileColorBufferSymbol === 'ZX0_TILE_COLOR_BUFFER' &&
    !/^\s*ZX0_TILE_COLOR_BUFFER\s+EQU\s+/im.test(finalCode);

  const needsFontPatternBufferEqu = selectedFontPatternBlocks.size > 0 &&
    fontPatternBufferSymbol === 'ZX0_FONT_PATTERN_BUFFER' &&
    !/^\s*ZX0_FONT_PATTERN_BUFFER\s+EQU\s+/im.test(finalCode);

  const needsFontColorBufferEqu = selectedFontColorBlocks.size > 0 &&
    fontColorBufferSymbol === 'ZX0_FONT_COLOR_BUFFER' &&
    !/^\s*ZX0_FONT_COLOR_BUFFER\s+EQU\s+/im.test(finalCode);

  const needsSpritePatternBufferEqu = !!selectedSpritePatternBlob &&
    spritePatternBufferSymbol === 'ZX0_SPRITE_PATTERN_BUFFER' &&
    !/^\s*ZX0_SPRITE_PATTERN_BUFFER\s+EQU\s+/im.test(finalCode);

  const buffersToAllocate = [];
  if (needsScreenBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_SCREEN_BUFFER', size: Math.max(1, maxLayoutSize), title: 'ZX0 SCREEN BUFFER', note: 'Free RAM buffer for screen layout decompression' });
  if (needsBehaviorBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_BEHAVIOR_BUFFER', size: Math.max(1, maxBehaviorSize), title: 'ZX0 BEHAVIOR BUFFER', note: 'Free RAM buffer for behavior map decompression' });
  if (needsTilePatternBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_TILE_PATTERN_BUFFER', size: Math.max(1, maxTilePatternSize), title: 'ZX0 TILE PATTERN BUFFER', note: 'Free RAM buffer for tile pattern data decompression' });
  if (needsTileColorBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_TILE_COLOR_BUFFER', size: Math.max(1, maxTileColorSize), title: 'ZX0 TILE COLOR BUFFER', note: 'Free RAM buffer for tile color data decompression' });
  if (needsFontPatternBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_FONT_PATTERN_BUFFER', size: Math.max(1, maxFontPatternSize), title: 'ZX0 FONT PATTERN BUFFER', note: 'Free RAM buffer for font pattern data decompression' });
  if (needsFontColorBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_FONT_COLOR_BUFFER', size: Math.max(1, maxFontColorSize), title: 'ZX0 FONT COLOR BUFFER', note: 'Free RAM buffer for font color data decompression' });
  if (needsSpritePatternBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_SPRITE_PATTERN_BUFFER', size: Math.max(1, maxSpritePatternSize), title: 'ZX0 SPRITE PATTERN BUFFER', note: 'Free RAM buffer for sprite pattern blob decompression' });

  if (buffersToAllocate.length > 0) {
    const RAM_BUFFER_BASE = 0xC900;
    const RAM_BUFFER_LIMIT = 0xF380;
    let nextAddress = RAM_BUFFER_BASE;

    const allocated = [];
    for (const buf of buffersToAllocate) {
      nextAddress = (nextAddress + 0xFF) & 0xFF00; // align at 256-byte boundary
      const start = nextAddress;
      const endExclusive = start + buf.size;
      if (endExclusive > RAM_BUFFER_LIMIT) {
        info.warning = `ZX0 buffer allocation overflow (${buf.symbol}, ${buf.size} bytes).`;
        return { code: sourceCode, info };
      }
      allocated.push({ ...buf, start, endExclusive });
      nextAddress = endExclusive;
    }

    for (const buf of allocated) {
      const startHex = buf.start.toString(16).toUpperCase().padStart(4, '0');
      extraEquBlocks.push(
        '; ==================================================================',
        `; ${buf.title} (AUTO-INJECTED)`,
        `; ${buf.note} (${buf.size} bytes)`,
        '; ==================================================================',
        `${buf.symbol} EQU #${startHex}`,
        ''
      );
    }
  }

  if (selectedSpritePatternBlob) {
    extraEquBlocks.push(
      '; ==================================================================',
      '; ZX0 SPRITE LABEL REMAP (AUTO-INJECTED)',
      '; Original sprite labels now point to decompressed RAM buffer',
      '; =================================================================='
    );
    for (const block of selectedSpritePatternBlob.blocks) {
      const offset = selectedSpritePatternBlob.labelOffsets.get(block.label) || 0;
      extraEquBlocks.push(`${block.label} EQU ${spritePatternBufferSymbol}+${offset}`);
    }
    extraEquBlocks.push('');
  }

  const extraDataBlocks = [];
  if (selectedSpritePatternBlob) {
    extraDataBlocks.push(
      '; ==================================================================',
      '; ZX0 SPRITE PATTERN BLOB (AUTO-INJECTED)',
      '; ==================================================================',
      `${selectedSpritePatternBlob.label}:`,
      `    ; ZX0 compressed sprite patterns (${selectedSpritePatternBlob.bytes.length} -> ${selectedSpritePatternBlob.compressedBytes.length} bytes)`,
      ...formatAsmDbLines(selectedSpritePatternBlob.compressedBytes),
      ''
    );
  }

  if (extraDataBlocks.length > 0) {
    const dataBlock = `\n${extraDataBlocks.join('\n')}\n`;
    if (/^\s*end\b.*$/im.test(finalCode)) {
      finalCode = finalCode.replace(/^\s*end\b.*$/im, `${dataBlock}$&`);
    } else {
      finalCode = `${finalCode}${dataBlock}`;
    }
  }

  if (extraEquBlocks.length > 0) {
    const equBlock = `\n${extraEquBlocks.join('\n')}\n`;
    if (/^\s*end\b.*$/im.test(finalCode)) {
      finalCode = finalCode.replace(/^\s*end\b.*$/im, `${equBlock}$&`);
    } else {
      finalCode = `${finalCode}${equBlock}`;
    }
  }

  if (!/^\s*dzx0_standard:/im.test(finalCode)) {
    const zx0AsmPath = path.join(__dirname, '..', 'src', 'asm', 'zx0_decompress.asm');
    const zx0RoutineCode = fs.existsSync(zx0AsmPath)
      ? fs.readFileSync(zx0AsmPath, 'utf8')
      : null;

    if (!zx0RoutineCode) {
      info.warning = 'ZX0 routine source not found at src/asm/zx0_decompress.asm';
      return { code: sourceCode, info };
    }

    const zx0Block = [
      '',
      '; ==================================================================',
      '; ZX0 DECOMPRESSOR (AUTO-INJECTED)',
      '; ==================================================================',
      zx0RoutineCode.trim(),
      ''
    ].join('\n');

    if (/^\s*end\b.*$/im.test(finalCode)) {
      finalCode = finalCode.replace(/^\s*end\b.*$/im, `${zx0Block}\n$&`);
    } else {
      finalCode = `${finalCode}\n${zx0Block}\n`;
    }
  }

  info.applied = true;
  return { code: finalCode, info };
}

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large ASM files
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Also for URL-encoded data

/**
 * Root endpoint to check if the server is running.
 * @name GET /
 * @function
 */
app.get('/', (req, res) => {
  res.send('MSX IDE Compiler Backend is running!');
});

/**
 * Endpoint to compile Z80 assembly code using the Glass assembler.
 * Expects a JSON body with a `code` property.
 * @name POST /compile
 * @function
 */
app.post('/compile', (req, res) => {
  const { code, generateSymbols, projectName, screenCompression } = req.body;

  console.log('📨 Compilation request received');
  console.log('  projectName:', projectName);
  console.log('  generateSymbols parameter:', generateSymbols);
  console.log('  Code length:', code?.length || 0);

  if (!code) {
    return res.status(400).send({ error: 'No code provided' });
  }

  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Use project name for file naming, fallback to timestamp if not provided
  const sanitizedProjectName = projectName
    ? projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_')
    : `source_${Date.now()}`;

  const tempFilePath = path.join(tempDir, `${sanitizedProjectName}.asm`);
  const outputFilePath = path.join(tempDir, `${sanitizedProjectName}.rom`);
  const symbolFilePath = generateSymbols ? path.join(tempDir, `${sanitizedProjectName}.sym`) : null;
  const compressedAsmOutputPath = path.join(tempDir, `${sanitizedProjectName}_compressed.asm`);
  const unifiedCompressedAsmOutputPath = path.join(tempDir, 'unitedCompressedFiles.asm');
  const isUnifiedInput = /;\s*File:\s*unitedFiles\.asm/i.test(code);

  let compressedAsmFileInfo = null;

  let codeToCompile = code;
  let screenCompressionInfo = {
    attempted: false,
    applied: false,
    method: 'ZX0',
    candidateScreens: 0,
    candidateBehaviorMaps: 0,
    candidateTilePatterns: 0,
    candidateTileColors: 0,
    candidateFontPatterns: 0,
    candidateFontColors: 0,
    candidateSpritePatterns: 0,
    compressedScreens: 0,
    compressedBehaviorMaps: 0,
    compressedTilePatterns: 0,
    compressedTileColors: 0,
    compressedFontPatterns: 0,
    compressedFontColors: 0,
    compressedSpritePatterns: 0,
    originalBytes: 0,
    compressedBytes: 0,
    savedBytes: 0,
    netSavedBytes: 0,
    warning: null,
    screenBufferSymbol: null,
    behaviorBufferSymbol: null,
    tilePatternBufferSymbol: null,
    tileColorBufferSymbol: null,
    fontPatternBufferSymbol: null,
    fontColorBufferSymbol: null,
    spritePatternBufferSymbol: null
  };

  try {
    if (screenCompression !== false) {
      const preprocessed = injectZx0IntoUnifiedAsm(code, tempDir);
      codeToCompile = preprocessed.code;
      screenCompressionInfo = preprocessed.info;

      if (screenCompressionInfo.applied) {
        fs.writeFileSync(compressedAsmOutputPath, codeToCompile, 'utf8');
        console.log(`ZX0 screen compression applied. Output ASM: ${compressedAsmOutputPath}`);
        console.log('ZX0 compression stats:', screenCompressionInfo);

        compressedAsmFileInfo = {
          compressedAsmFile: path.basename(compressedAsmOutputPath),
          compressedAsmPath: compressedAsmOutputPath,
          compressedAsmDownloadUrl: `/download/${path.basename(compressedAsmOutputPath)}`
        };

        if (isUnifiedInput) {
          fs.writeFileSync(unifiedCompressedAsmOutputPath, codeToCompile, 'utf8');
          compressedAsmFileInfo.unitedCompressedAsmFile = path.basename(unifiedCompressedAsmOutputPath);
          compressedAsmFileInfo.unitedCompressedAsmPath = unifiedCompressedAsmOutputPath;
          compressedAsmFileInfo.unitedCompressedAsmDownloadUrl = `/download/${path.basename(unifiedCompressedAsmOutputPath)}`;
          console.log(`Unified compressed ASM alias written: ${unifiedCompressedAsmOutputPath}`);
        }
      } else if (screenCompressionInfo.attempted) {
        console.log('ZX0 screen compression skipped (no net gain).', screenCompressionInfo);
      }
    }
  } catch (preprocessError) {
    screenCompressionInfo.warning = `ZX0 preprocess error: ${preprocessError.message}`;
    console.error('ZX0 preprocess error:', preprocessError);
  }

  fs.writeFile(tempFilePath, codeToCompile, (err) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to write temporary file', details: err });
    }

    const jarPath = path.join(__dirname, 'glass.jar');
    // Add symbol file path if generateSymbols is true
    const command = symbolFilePath
      ? `java -jar "${jarPath}" "${tempFilePath}" "${outputFilePath}" "${symbolFilePath}"`
      : `java -jar "${jarPath}" "${tempFilePath}" "${outputFilePath}"`;

    console.log(`🔧 Executing Glass: ${command}`);
    if (generateSymbols) {
      console.log(`📋 Symbols will be saved to: ${symbolFilePath}`);
    }

    exec(command, (error, stdout, stderr) => {
      // Log detailed information for debugging
      console.log('=== GLASS COMPILATION RESULTS ===');
      console.log('Command:', command);
      console.log('Error object:', error);
      console.log('STDOUT:', stdout);
      console.log('STDERR:', stderr);
      console.log('===================================');

      if (error) {
        // Don't delete temp file yet so we can inspect it
        console.log(`❌ Glass compilation failed. Temp file: ${tempFilePath}`);

        // Read the source file to see what we tried to compile
        fs.readFile(tempFilePath, 'utf8', (readErr, sourceCode) => {
          const errorResponse = {
            error: 'Glass compilation failed',
            details: stderr || stdout || error.message,
            command: command,
            sourceFile: tempFilePath,
            sourceCode: readErr ? 'Could not read source' : sourceCode.substring(0, 1000), // First 1000 chars
            fullStderr: stderr,
            fullStdout: stdout,
            errorCode: error.code,
            signal: error.signal,
            screenCompressionInfo: screenCompressionInfo,
            compressedAsmFileInfo: compressedAsmFileInfo
          };

          console.log('Full error response:', errorResponse);
          return res.status(500).json(errorResponse);
        });
        return;
      }

      fs.readFile(outputFilePath, (readErr, data) => {
        // Clean up only the temporary ASM file, keep the ROM file
        fs.unlink(tempFilePath, () => {});

        if (readErr) {
          return res.status(500).send({ error: 'Failed to read compiled file', details: readErr });
        }

        // MSX ROM files must be multiples of 8KB
        const KB_8 = 8192; // 8KB in bytes
        const ROM_ORIGIN = 0x4000;
        const SIMPLE_ROM_LIMIT_BYTES = 32 * 1024;
        const originalSize = data.length;
        const sizeMod8192 = originalSize % KB_8;
        const targetSize = Math.max(KB_8, Math.ceil(originalSize / KB_8) * KB_8);

        let paddedData = data;
        if (originalSize !== targetSize) {
          // Calculate padding needed to reach next 8KB boundary
          const paddingNeeded = targetSize - originalSize;
          const padding = Buffer.alloc(paddingNeeded, 0xFF); // Fill with 0xFF (common for ROM padding)
          paddedData = Buffer.concat([data, padding]);

          console.log(`📏 ROM Size Adjustment:`);
          console.log(`   Original: ${originalSize} bytes`);
          console.log(`   Padded: ${paddedData.length} bytes (${paddedData.length / KB_8}×8KB)`);
          console.log(`   Added: ${paddingNeeded} bytes of padding (0xFF)`);

          // Write the padded ROM back to file
          fs.writeFileSync(outputFilePath, paddedData);
        } else {
          console.log(`✅ ROM Size OK: ${originalSize} bytes (${originalSize / KB_8}×8KB)`);
        }

        const banks8KB = paddedData.length / KB_8;
        const endAddress = ROM_ORIGIN + paddedData.length - 1;
        const exceedsSimpleRomLimit = paddedData.length > SIMPLE_ROM_LIMIT_BYTES;
        const mapperHint = exceedsSimpleRomLimit
          ? 'ROM exceeds 32KB simple layout. Use mapper-aware build/runtime (Konami/ASCII).'
          : null;

        console.log('ROM diagnostics:', {
          sizeMod8192,
          banks8KB,
          romOrigin: `0x${ROM_ORIGIN.toString(16).toUpperCase()}`,
          endAddress: `0x${endAddress.toString(16).toUpperCase()}`,
          simpleRomLimitBytes: SIMPLE_ROM_LIMIT_BYTES,
          exceedsSimpleRomLimit
        });

        // Check if symbol file was generated
        let symbolFileInfo = null;
        if (symbolFilePath && fs.existsSync(symbolFilePath)) {
          const symbolStats = fs.statSync(symbolFilePath);
          const symbolFileName = path.basename(symbolFilePath);

          // Convert Glass .sym format to OpenMSX format
          const openmsxSymFilePath = symbolFilePath.replace('.sym', '_openMSX.sym');
          try {
            const symbolContent = fs.readFileSync(symbolFilePath, 'utf-8');
            const lines = symbolContent.split('\n');
            const openmsxSymbols = [];

            // Parse Glass format: LABEL: equ 4000H
            // Filter: Only include symbols in ROM range (0x4000-0xFFFF)
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(';')) continue;

              const match = trimmed.match(/^([A-Za-z0-9_]+):\s+equ\s+([0-9A-Fa-f]+)H?$/);
              if (match) {
                const label = match[1];
                const address = match[2];
                const addrValue = parseInt(address, 16);

                // Only include symbols in ROM address range (0x4000-0xFFFF)
                // This filters out constants and BIOS addresses
                if (addrValue >= 0x4000 && addrValue <= 0xFFFF) {
                  // Keep original Glass format for OpenMSX compatibility
                  openmsxSymbols.push(`${label}: equ ${address}H`);
                }
              }
            }

            // Sort by address
            openmsxSymbols.sort((a, b) => {
              const addrA = parseInt(a.match(/equ ([0-9A-Fa-f]+)H/)[1], 16);
              const addrB = parseInt(b.match(/equ ([0-9A-Fa-f]+)H/)[1], 16);
              return addrA - addrB;
            });

            fs.writeFileSync(openmsxSymFilePath, openmsxSymbols.join('\n') + '\n', 'utf-8');
            console.log(`📋 OpenMSX symbols: ${openmsxSymbols.length} ROM symbols (filtered 0x4000-0xFFFF)`);
          } catch (convError) {
            console.error('⚠️ Failed to convert to OpenMSX format:', convError);
          }

          const openmsxSymFileName = path.basename(openmsxSymFilePath);
          symbolFileInfo = {
            symbolFile: symbolFileName,
            symbolPath: symbolFilePath,
            symbolDownloadUrl: `/download/${symbolFileName}`,
            symbolSize: symbolStats.size,
            // Add OpenMSX format info
            openmsxSymbolFile: openmsxSymFileName,
            openmsxSymbolDownloadUrl: `/download/${openmsxSymFileName}`
          };
          console.log(`✅ Symbol file generated: ${symbolFileName} (${symbolStats.size} bytes)`);
        } else if (symbolFilePath) {
          console.log(`⚠️ Symbol file was requested but not generated: ${symbolFilePath}`);
        }

        // Return ROM file information for download
        const romFileName = path.basename(outputFilePath);
        const responseData = {
          success: true,
          data: paddedData.toString('hex'),
          message: stdout,
          romFile: romFileName,
          romPath: outputFilePath,
          downloadUrl: `/download/${romFileName}`,
          screenCompressionInfo: screenCompressionInfo,
          romSizeInfo: {
            originalSize: originalSize,
            paddedSize: paddedData.length,
            paddingAdded: paddedData.length - originalSize,
            sizeIn8KB: paddedData.length / KB_8,
            sizeMod8192: sizeMod8192,
            banks8KB: banks8KB,
            romOrigin: ROM_ORIGIN,
            endAddress: endAddress,
            simpleRomLimitBytes: SIMPLE_ROM_LIMIT_BYTES,
            exceedsSimpleRomLimit: exceedsSimpleRomLimit,
            mapperHint: mapperHint
          }
        };

        // Add symbol file info if available
        if (symbolFileInfo) {
          Object.assign(responseData, symbolFileInfo);
        }

        // Add compressed ASM file info if available
        if (compressedAsmFileInfo) {
          Object.assign(responseData, compressedAsmFileInfo);
        }

        res.send(responseData);
      });
    });
  });
});

/**
 * Endpoint to compress unified ASM screen/behavior data with ZX0 (without compiling).
 * Expects a JSON body with `code` and optional `projectName`.
 * @name POST /compress-unified-asm
 * @function
 */
app.post('/compress-unified-asm', (req, res) => {
  const { code, projectName } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'No ASM code provided' });
  }

  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const sanitizedProjectName = projectName
    ? projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_')
    : `source_${Date.now()}`;

  const compressedAsmOutputPath = path.join(tempDir, `${sanitizedProjectName}_compressed.asm`);
  const unifiedCompressedAsmOutputPath = path.join(tempDir, 'unitedCompressedFiles.asm');

  try {
    const preprocessed = injectZx0IntoUnifiedAsm(code, tempDir);
    const info = preprocessed.info;

    if (!info.attempted) {
      return res.json({
        success: true,
        applied: false,
        message: 'Input is not a recognized unitedFiles.asm export',
        compressionInfo: info
      });
    }

    if (!info.applied) {
      return res.json({
        success: true,
        applied: false,
        message: 'Compression skipped (no net gain)',
        compressionInfo: info
      });
    }

    fs.writeFileSync(compressedAsmOutputPath, preprocessed.code, 'utf8');
    fs.writeFileSync(unifiedCompressedAsmOutputPath, preprocessed.code, 'utf8');

    const compressedAsmFileName = path.basename(compressedAsmOutputPath);
    const unifiedCompressedAsmFileName = path.basename(unifiedCompressedAsmOutputPath);

    return res.json({
      success: true,
      applied: true,
      message: 'Unified ASM compressed with ZX0 successfully',
      compressedCode: preprocessed.code,
      compressionInfo: info,
      compressedAsmFile: compressedAsmFileName,
      compressedAsmPath: compressedAsmOutputPath,
      compressedAsmDownloadUrl: `/download/${compressedAsmFileName}`,
      unitedCompressedAsmFile: unifiedCompressedAsmFileName,
      unitedCompressedAsmPath: unifiedCompressedAsmOutputPath,
      unitedCompressedAsmDownloadUrl: `/download/${unifiedCompressedAsmFileName}`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to compress unified ASM',
      details: error.message
    });
  }
});

/**
 * Endpoint to run a compression tool (e.g., ZX0) on asset data.
 * Serializes the provided asset data, saves it to a temporary file,
 * runs the specified compressor, and returns compression statistics.
 * @name POST /run-compressor
 * @function
 */
app.post('/run-compressor', async (req, res) => {
  const { tool, inputData, outputFile, assetType } = req.body;

  if (!tool || !inputData || !outputFile || !assetType) {
    return res.status(400).json({ message: 'Missing required parameters: tool, inputData, outputFile, or assetType.' });
  }

  const projectRoot = path.join(__dirname, '..');
  const safeOutputFile = path.join(projectRoot, outputFile);

  if (!safeOutputFile.startsWith(projectRoot)) {
    return res.status(400).json({ message: 'Invalid output file path specified.' });
  }

  const tempDir = path.join(__dirname, 'temp');
  let tempInputFilePath = null;

  try {
    await fs.promises.mkdir(tempDir, { recursive: true });

    const binaryData = serializeAsset({ type: assetType, data: inputData });

    tempInputFilePath = path.join(tempDir, `compress_input_${Date.now()}`);
    await fs.promises.writeFile(tempInputFilePath, binaryData);

    const originalSize = binaryData.length;

    const outputDir = path.dirname(safeOutputFile);
    await fs.promises.mkdir(outputDir, { recursive: true });

    if (tool.toUpperCase() === 'ZX0') {
      const jarPath = path.join(__dirname, 'zx0.jar');
      const command = `java -jar "${jarPath}" "${tempInputFilePath}" "${safeOutputFile}"`;

      try {
        await execAsync(command);
      } catch (e) {
        throw new Error(`ZX0 compression failed: ${e.stderr || e.stdout || e.message}`);
      }
    } else {
      await fs.promises.copyFile(tempInputFilePath, safeOutputFile);
    }

    const compressedStats = await fs.promises.stat(safeOutputFile);

    const ratio = originalSize > 0 ? (1 - (compressedStats.size / originalSize)) * 100 : 0;
    res.json({
      message: `File compressed successfully with ${tool}.`,
      originalSize: originalSize,
      compressedSize: compressedStats.size,
      ratio: ratio,
    });

  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ message: 'An error occurred during compression.', details: error.message });
  } finally {
    if (tempInputFilePath) {
      try {
        await fs.promises.unlink(tempInputFilePath);
      } catch (cleanupError) {
        console.error('Failed to delete temporary compression file:', cleanupError);
      }
    }
  }
});

/**
 * Endpoint to download compiled ROM files
 * @name GET /download/:filename
 * @function
 */
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;

  // Validate filename (allow .rom, .sym and .asm files)
  const isValidExtension = filename.endsWith('.rom') || filename.endsWith('.sym') || filename.endsWith('.asm');
  const hasInvalidChars = filename.includes('..') || filename.includes('/') || filename.includes('\\');

  if (!isValidExtension || hasInvalidChars) {
    return res.status(400).send({ error: 'Invalid filename. Only .rom, .sym and .asm files are allowed.' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const filePath = path.join(tempDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    const fileType = filename.endsWith('.sym') ? 'Symbol' : (filename.endsWith('.asm') ? 'ASM' : 'ROM');
    return res.status(404).send({ error: `${fileType} file not found: ${filename}` });
  }

  // Set headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Set content type based on file extension
  if (filename.endsWith('.sym') || filename.endsWith('.asm')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  } else {
    res.setHeader('Content-Type', 'application/octet-stream');
  }

  // Send the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      const fileType = filename.endsWith('.sym')
        ? 'symbol'
        : (filename.endsWith('.asm') ? 'ASM' : 'ROM');
      return res.status(500).send({ error: `Failed to read ${fileType} file`, details: err });
    }

    res.send(data);

    // Optional: Delete the file after sending (uncomment if you want to clean up)
    // setTimeout(() => {
    //   fs.unlink(filePath, () => {});
    // }, 5000); // Delete after 5 seconds
  });
});

/**
 * Endpoint to list available ROM files
 * @name GET /roms
 * @function
 */
app.get('/roms', (req, res) => {
  const tempDir = path.join(__dirname, 'temp');

  if (!fs.existsSync(tempDir)) {
    return res.send({ roms: [] });
  }

  fs.readdir(tempDir, (err, files) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to read temp directory', details: err });
    }

    const romFiles = files
      .filter(file => file.endsWith('.rom'))
      .map(file => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.mtime,
          downloadUrl: `/download/${file}`
        };
      });

    res.send({ roms: romFiles });
  });
});

/**
 * Endpoint to run ROM in OpenMSX for testing
 * @name POST /run-openmsx
 * @function
 */
app.post('/run-openmsx', (req, res) => {
  const { romFile } = req.body;

  if (!romFile) {
    return res.status(400).send({ error: 'No ROM file specified' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const romPath = path.join(tempDir, romFile);

  // Verify ROM file exists
  if (!fs.existsSync(romPath)) {
    return res.status(404).send({ error: 'ROM file not found', romFile: romFile });
  }

  // Path to automation script
  const automationDir = path.join(__dirname, '..', 'automation', 'openmsx');
  const runScript = path.join(automationDir, 'run-openmsx.bat');

  if (!fs.existsSync(runScript)) {
    return res.status(500).send({ error: 'OpenMSX automation script not found' });
  }

  console.log(`🎮 Starting OpenMSX with ROM: ${romFile}`);

  // Execute run script (doesn't wait - OpenMSX stays open)
  const command = `"${runScript}" "${romPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ Failed to start OpenMSX: ${error.message}`);
      return res.status(500).send({
        error: 'Failed to start OpenMSX',
        details: error.message,
        stdout: stdout,
        stderr: stderr
      });
    }

    console.log(`✅ OpenMSX started successfully for ROM: ${romFile}`);
    res.send({
      success: true,
      message: 'OpenMSX started successfully',
      romFile: romFile,
      note: 'OpenMSX is running - close it manually when done testing'
    });
  });
});

/**
 * Endpoint to generate screenshot from ROM
 * @name POST /generate-screenshot
 * @function
 */
app.post('/generate-screenshot', (req, res) => {
  const { romFile, waitSeconds = 10 } = req.body;

  if (!romFile) {
    return res.status(400).send({ error: 'No ROM file specified' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const romPath = path.join(tempDir, romFile);

  // Verify ROM file exists
  if (!fs.existsSync(romPath)) {
    return res.status(404).send({ error: 'ROM file not found', romFile: romFile });
  }

  // Path to automation script
  const automationDir = path.join(__dirname, '..', 'automation', 'openmsx');
  const screenshotScript = path.join(automationDir, 'openmsx-screenshot-corrected.bat');

  if (!fs.existsSync(screenshotScript)) {
    return res.status(500).send({ error: 'Screenshot automation script not found' });
  }

  console.log(`📷 Generating screenshot for ROM: ${romFile} (wait: ${waitSeconds}s)`);

  // Execute screenshot script and wait for completion
  const command = `"${screenshotScript}" "${romPath}" ${waitSeconds}`;

  exec(command, { timeout: (waitSeconds + 20) * 1000 }, (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ Screenshot generation failed: ${error.message}`);
      return res.status(500).send({
        error: 'Screenshot generation failed',
        details: error.message,
        stdout: stdout,
        stderr: stderr
      });
    }

    // Look for generated screenshot
    const screenshotsDir = path.join(automationDir, 'screenshots');

    if (!fs.existsSync(screenshotsDir)) {
      return res.status(500).send({ error: 'Screenshots directory not found' });
    }

    // Find the most recent PNG file
    try {
      const screenshotFiles = fs.readdirSync(screenshotsDir)
        .filter(file => file.endsWith('.png'))
        .map(file => {
          const filePath = path.join(screenshotsDir, file);
          const stats = fs.statSync(filePath);
          return { filename: file, mtime: stats.mtime, size: stats.size };
        })
        .sort((a, b) => b.mtime - a.mtime);

      if (screenshotFiles.length === 0) {
        return res.status(500).send({ error: 'No screenshot generated' });
      }

      const latestScreenshot = screenshotFiles[0];
      console.log(`✅ Screenshot generated: ${latestScreenshot.filename}`);

      res.send({
        success: true,
        message: 'Screenshot generated successfully',
        romFile: romFile,
        screenshot: {
          filename: latestScreenshot.filename,
          size: latestScreenshot.size,
          generated: latestScreenshot.mtime
        },
        waitSeconds: waitSeconds
      });

    } catch (dirError) {
      return res.status(500).send({
        error: 'Failed to read screenshots directory',
        details: dirError.message
      });
    }
  });
});

/**
 * Endpoint to serve screenshot files
 * @name GET /screenshot/:filename
 * @function
 */
app.get('/screenshot/:filename', (req, res) => {
  const filename = req.params.filename;

  // Validate filename
  if (!filename.endsWith('.png') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).send({ error: 'Invalid filename' });
  }

  const automationDir = path.join(__dirname, '..', 'automation', 'openmsx');
  const screenshotsDir = path.join(automationDir, 'screenshots');
  const filePath = path.join(screenshotsDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send({ error: 'Screenshot not found' });
  }

  // Set headers for image
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

  // Send the image file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to read screenshot', details: err });
    }
    res.send(data);
  });
});

/**
 * Starts the Express server.
 */
if (require.main === module) {
  app.listen(port, () => {
    console.log(`MSX IDE Compiler Backend listening at http://localhost:${port}`);
  });
}

module.exports = {
  app,
  injectZx0IntoUnifiedAsm
};

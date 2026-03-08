/**
 * @fileoverview This file sets up a simple Express server to handle backend tasks
 * for the MSX IDE, such as code compilation and data compression.
 */

const express = require('express');
const cors = require('cors');
const util = require('util');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const execAsync = util.promisify(exec);
const path = require('path');
const { serializeAsset } = require('./assetSerializer');

const app = express();
const port = 3001;

const ZX0_ROUTINE_OVERHEAD_BYTES = 96;
const ZX0_PER_BLOCK_RUNTIME_OVERHEAD_BYTES = 11;
const SIMPLE_ROM_LIMIT_BYTES = 32 * 1024;
const PLAIN48_ROM_LIMIT_BYTES = 48 * 1024;
const ROM_MODE_VALUES = ['auto', 'simple32k', 'plain48k', 'megarom'];

function isRomFileLockError(text) {
  const value = String(text || '').toLowerCase();
  if (!value) return false;
  return (
    value.includes('filesystemexception') &&
    value.includes('.rom') &&
    (value.includes('secci') || value.includes('user-mapped section') || value.includes('being used by another process'))
  );
}

function closeOpenMsxProcesses() {
  try {
    if (process.platform === 'win32') {
      const out = execSync('taskkill /IM openmsx.exe /F', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return /openmsx\.exe/i.test(String(out || ''));
    }
    execSync('pkill -f openmsx', { stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch (_) {
    return false;
  }
}

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

function parseSourceRomConfig(sourceCode) {
  if (typeof sourceCode !== 'string' || sourceCode.length === 0) return null;

  const normalizeRomMode = (value) => {
    const v = String(value || '').trim().toLowerCase();
    return ROM_MODE_VALUES.includes(v) ? v : null;
  };
  const normalizeMapper = (value) => {
    const v = String(value || '').trim().toLowerCase();
    return ['konami', 'ascii8', 'ascii16'].includes(v) ? v : null;
  };
  const normalizeYesNo = (value) => {
    const v = String(value || '').trim().toLowerCase();
    if (v === 'yes' || v === 'true') return true;
    if (v === 'no' || v === 'false') return false;
    return null;
  };

  const unifiedRomMode = normalizeRomMode(
    sourceCode.match(/^\s*;\s*ROM Mode:\s*(auto|simple32k|plain48k|megarom)\s*$/im)?.[1]
  );
  const unifiedMapper = normalizeMapper(
    sourceCode.match(/^\s*;\s*Mapper Target:\s*(konami|ascii8|ascii16)\s*$/im)?.[1]
  );
  const unifiedAutoMega = normalizeYesNo(
    sourceCode.match(/^\s*;\s*Auto MegaROM:\s*(Yes|No)\s*$/im)?.[1]
  );

  const mapperAsmTarget = normalizeMapper(
    sourceCode.match(/^\s*;\s*Target mapper:\s*(konami|ascii8|ascii16)\s*$/im)?.[1]
  );
  const mapperAsmModeMatch = sourceCode.match(
    /^\s*;\s*ROM mode:\s*(auto|simple32k|plain48k|megarom)\s*\(autoMegaROM=(true|false)\)\s*$/im
  );
  const mapperAsmRomMode = normalizeRomMode(mapperAsmModeMatch?.[1]);
  const mapperAsmAutoMega = normalizeYesNo(mapperAsmModeMatch?.[2]);

  const romMode = unifiedRomMode || mapperAsmRomMode;
  const targetFormat = unifiedMapper || mapperAsmTarget;
  const autoMegaROM = unifiedAutoMega !== null ? unifiedAutoMega : mapperAsmAutoMega;

  if (!romMode && !targetFormat && autoMegaROM === null) {
    return null;
  }

  return {
    romMode: romMode || null,
    targetFormat: targetFormat || null,
    autoMegaROM
  };
}

function sourceConfigHasMapperWritesEnabled(sourceConfig) {
  if (!sourceConfig) return false;
  if (sourceConfig.romMode === 'megarom') return true;
  if (sourceConfig.romMode === 'auto' && sourceConfig.autoMegaROM !== false) return true;
  return false;
}

function sourceHasLinear48kLayout(sourceCode) {
  const text = String(sourceCode || '');
  return /^\s*org\s+#0000\b/im.test(text) && /^\s*org\s+#4000\b/im.test(text);
}

function disableMapperWritesForSimple32k(sourceCode) {
  if (typeof sourceCode !== 'string' || sourceCode.length === 0) return sourceCode;

  let patched = sourceCode;

  patched = patched.replace(
    /^(\s*;\s*ROM mode:\s*)(auto|megarom)\s*\(autoMegaROM=(true|false)\)\s*$/im,
    '$1simple32k (autoMegaROM=false)'
  );
  patched = patched.replace(/^\s*;\s*Auto MegaROM:\s*Yes\s*$/im, '; Auto MegaROM: No');
  patched = patched.replace(
    /^\s*;\s*Mapper register writes are enabled for this build configuration\.\s*$/im,
    '; Mapper register writes are disabled (simple32k mode).'
  );
  patched = patched.replace(
    /^\s*ld\s+\(MAPPER_REG_P[1-4]\),\s*a\s*$/gim,
    '    ; write disabled in current ROM mode'
  );

  return patched;
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

function countSymbolReferences(sourceCodeUpper, symbol) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'g');
  const matches = sourceCodeUpper.match(re);
  return matches ? matches.length : 0;
}

function buildSpriteFrameGroups(spritePatternBlocks, sourceCode) {
  const groups = [];
  const groupsByKey = new Map();
  const usedSymbolBases = new Set();
  const sourceCodeUpper = String(sourceCode || '').toUpperCase();

  const toSafeSymbolBase = (rawKey) => {
    let base = String(rawKey || 'SPRITE')
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!base) base = 'SPRITE';
    if (/^\d/.test(base)) base = `SPRITE_${base}`;
    if (base.length > 32) base = base.slice(0, 32);

    let unique = base;
    let suffix = 2;
    while (usedSymbolBases.has(unique)) {
      unique = `${base}_${suffix}`;
      suffix += 1;
    }
    usedSymbolBases.add(unique);
    return unique;
  };

  for (const block of spritePatternBlocks) {
    // Example label: HERO_LEFT_0_F1_LAYER2
    const m = block.label.match(/^(.*)_F(\d+)_LAYER(\d+)$/i);
    if (!m) continue;

    const spriteBase = m[1].toUpperCase();
    const frameIndex = parseInt(m[2], 10);
    const layerIndex = parseInt(m[3], 10);
    const frameKey = `${spriteBase}_F${frameIndex}`;

    let group = groupsByKey.get(frameKey);
    if (!group) {
      const symbolBase = toSafeSymbolBase(frameKey);
      group = {
        key: frameKey,
        spriteBase,
        frameIndex,
        symbolBase,
        compressedLabel: `ZX0_SPRITE_FRAME_${symbolBase}_DATA`,
        blocks: []
      };
      groupsByKey.set(frameKey, group);
      groups.push(group);
    }

    group.blocks.push({
      ...block,
      layerIndex
    });
  }

  const result = [];
  for (const group of groups) {
    if (!group.blocks || group.blocks.length === 0) continue;

    group.blocks.sort((a, b) => a.layerIndex - b.layerIndex);
    const firstBlock = group.blocks[0];
    const firstLabel = firstBlock.label;

    const bytes = [];
    for (const block of group.blocks) {
      bytes.push(...block.bytes);
    }

    // Safety: If any non-first layer label is referenced elsewhere, skip this group.
    // Compression remap is safe only when external code uses the frame entry label.
    let hasUnsafeExternalLayerRefs = false;
    for (let i = 1; i < group.blocks.length; i++) {
      const label = group.blocks[i].label.toUpperCase();
      const refs = countSymbolReferences(sourceCodeUpper, label);
      if (refs > 1) {
        hasUnsafeExternalLayerRefs = true;
        break;
      }
    }
    if (hasUnsafeExternalLayerRefs) continue;

    result.push({
      ...group,
      firstLabel,
      bytes
    });
  }

  return result;
}

function injectZx0IntoUnifiedAsm(sourceCode, tempDir, options = {}) {
  const {
    screens       = true,
    behaviorMaps  = true,
    tilePatterns  = true,
    tileColors    = true,
    fontPatterns  = true,
    fontColors    = true,
    spritePatterns = true,
  } = options;
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
  info.screenBufferSymbol = screenBufferSymbol;
  info.behaviorBufferSymbol = behaviorBufferSymbol;
  info.tilePatternBufferSymbol = tilePatternBufferSymbol;
  info.tileColorBufferSymbol = tileColorBufferSymbol;
  info.fontPatternBufferSymbol = fontPatternBufferSymbol;
  info.fontColorBufferSymbol = fontColorBufferSymbol;

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
  const selectedSpritePatternGroups = [];

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

  if (screens)      processBlocks(layoutBlocks, 'layout');
  if (behaviorMaps) processBlocks(behaviorBlocks, 'behavior');
  if (tilePatterns) processBlocks(tilePatternBlocks, 'tile_pattern');
  if (tileColors)   processBlocks(tileColorBlocks, 'tile_color');
  if (fontPatterns) processBlocks(fontPatternBlocks, 'font_pattern');
  if (fontColors)   processBlocks(fontColorBlocks, 'font_color');

  if (spritePatterns && spritePatternBlocks.length > 0) {
    // Group sprite pattern data by frame (all layers packed together):
    // HERO_LEFT_0_F1_LAYER1 + HERO_LEFT_0_F1_LAYER2 => frame group HERO_LEFT_0_F1
    const spriteGroups = buildSpriteFrameGroups(spritePatternBlocks, sourceCode);

    for (const group of spriteGroups) {
      info.originalBytes += group.bytes.length;

      try {
        const compressed = runZx0Compression(group.bytes, tempDir);
        if (compressed.length < group.bytes.length) {
          selectedSpritePatternGroups.push({
            ...group,
            kind: 'sprite_pattern_frame',
            compressedBytes: Array.from(compressed.values())
          });
          info.compressedSpritePatterns += group.blocks.length;
          info.compressedBytes += compressed.length;
          info.savedBytes += (group.bytes.length - compressed.length);
        } else {
          info.compressedBytes += group.bytes.length;
        }
      } catch (err) {
        if (!info.warning) {
          info.warning = `ZX0 compression failed for sprite frame ${group.key}: ${err.message}`;
        }
        info.compressedBytes += group.bytes.length;
      }
    }
  }
  info.spritePatternBufferSymbol = selectedSpritePatternGroups.length > 0
    ? 'ZX0_SPRITE_FRAME_BUFFER'
    : null;

  const compressedBlockCount =
    selectedLayoutBlocks.size +
    selectedBehaviorBlocks.size +
    selectedTilePatternBlocks.size +
    selectedTileColorBlocks.size +
    selectedFontPatternBlocks.size +
    selectedFontColorBlocks.size +
    selectedSpritePatternGroups.length;
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
  if (selectedSpritePatternGroups.length > 0) {
    for (const spriteGroup of selectedSpritePatternGroups) {
      for (const block of spriteGroup.blocks) {
        replacementByStart.set(block.startLine, {
          endLine: block.endLine,
          lines: [`    ; ZX0 compressed sprite pattern moved to ${spriteGroup.compressedLabel} (${block.bytes.length} bytes)`]
        });
      }
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
  let inLoadSpritePatterns = false;
  let inUpdateAnimation = false;
  let inActionChangeSprite = false;
  let inSubmenuPrepareCursor = false;
  let fontBlobInitInjected = false;

  for (const line of rebuilt) {
    if (selectedSpritePatternGroups.length > 0 && /^\s*load_sprite_patterns:\s*$/i.test(line)) {
      inLoadSpritePatterns = true;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
      patched.push(line);
      continue;
    }

    if (selectedSpritePatternGroups.length > 0 && /^\s*update_animation_component:\s*$/i.test(line)) {
      inLoadSpritePatterns = false;
      inUpdateAnimation = true;
      inActionChangeSprite = false;
      inSubmenuPrepareCursor = false;
      patched.push(line);
      continue;
    }

    if (selectedSpritePatternGroups.length > 0 && /^\s*Action_ChangeSprite:\s*$/i.test(line)) {
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inActionChangeSprite = true;
      inSubmenuPrepareCursor = false;
      patched.push(line);
      continue;
    }

    if (selectedSpritePatternGroups.length > 0 && /^\s*submenu_prepare_cursor_sprite:\s*$/i.test(line)) {
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inActionChangeSprite = false;
      inSubmenuPrepareCursor = true;
      patched.push(line);
      continue;
    }

    if (/^\s*[A-Za-z_][A-Za-z0-9_]*:\s*$/.test(line)) {
      if (!/^\s*Action_ChangeSprite:\s*$/i.test(line)) {
        inActionChangeSprite = false;
      }
      inSubmenuPrepareCursor = false;
    }

    if (
      selectedSpritePatternGroups.length > 0 &&
      (inLoadSpritePatterns || inUpdateAnimation || inActionChangeSprite || inSubmenuPrepareCursor) &&
      /^\s*call\s+FAST_LDIRVM\s*(?:;.*)?$/i.test(line)
    ) {
      // Compressed exports remap sprite labels to ZX0 blobs, so sprite uploads in
      // these routines must go through the decompressing copy helper, not raw FAST_LDIRVM.
      patched.push('    call COPY_SPRITE_SRC_TO_VRAM');
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
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
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
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
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
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
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

    if ((inLoadScreen || inLoadPattern || inLoadColor || inLoadSpritePatterns || inUpdateAnimation || inActionChangeSprite) && /^\s*ret\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadPattern = false;
      inLoadColor = false;
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inActionChangeSprite = false;
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
  const maxSpriteFrameSize = selectedSpritePatternGroups.length > 0
    ? Math.max(...selectedSpritePatternGroups.map((group) => group.bytes.length))
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
  const needsSpriteFrameBufferEqu = selectedSpritePatternGroups.length > 0 &&
    !/^\s*ZX0_SPRITE_FRAME_BUFFER\s+EQU\s+/im.test(finalCode);

  const buffersToAllocate = [];
  if (needsScreenBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_SCREEN_BUFFER', size: Math.max(1, maxLayoutSize), title: 'ZX0 SCREEN BUFFER', note: 'Free RAM buffer for screen layout decompression' });
  if (needsBehaviorBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_BEHAVIOR_BUFFER', size: Math.max(1, maxBehaviorSize), title: 'ZX0 BEHAVIOR BUFFER', note: 'Free RAM buffer for behavior map decompression' });
  if (needsTilePatternBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_TILE_PATTERN_BUFFER', size: Math.max(1, maxTilePatternSize), title: 'ZX0 TILE PATTERN BUFFER', note: 'Free RAM buffer for tile pattern data decompression' });
  if (needsTileColorBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_TILE_COLOR_BUFFER', size: Math.max(1, maxTileColorSize), title: 'ZX0 TILE COLOR BUFFER', note: 'Free RAM buffer for tile color data decompression' });
  if (needsFontPatternBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_FONT_PATTERN_BUFFER', size: Math.max(1, maxFontPatternSize), title: 'ZX0 FONT PATTERN BUFFER', note: 'Free RAM buffer for font pattern data decompression' });
  if (needsFontColorBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_FONT_COLOR_BUFFER', size: Math.max(1, maxFontColorSize), title: 'ZX0 FONT COLOR BUFFER', note: 'Free RAM buffer for font color data decompression' });
  if (needsSpriteFrameBufferEqu) {
    buffersToAllocate.push({
      symbol: 'ZX0_SPRITE_FRAME_BUFFER',
      size: Math.max(1, maxSpriteFrameSize),
      title: 'ZX0 SPRITE FRAME BUFFER',
      note: 'Shared RAM buffer for per-frame sprite decompression before VRAM upload'
    });
  }

  if (buffersToAllocate.length > 0) {
    const DEFAULT_RAM_BUFFER_BASE = 0xC900;
    const RAM_BUFFER_LIMIT = 0xF380;
    const ramUsageMatch = finalCode.match(/^\s*RAM_USAGE_END\s+EQU\s+#([0-9A-Fa-f]+)/im);
    const ramUsageEnd = ramUsageMatch ? Number.parseInt(ramUsageMatch[1], 16) : DEFAULT_RAM_BUFFER_BASE;
    // Keep buffers above project RAM variables to avoid corrupting runtime systems
    // (interrupt hooks/task table, entity arrays, etc.).
    const RAM_BUFFER_BASE = Math.max(DEFAULT_RAM_BUFFER_BASE, (ramUsageEnd + 0xFF) & 0xFF00);
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

  if (selectedSpritePatternGroups.length > 0) {
    extraEquBlocks.push(
      '; ==================================================================',
      '; ZX0 SPRITE LABEL REMAP (AUTO-INJECTED)',
      '; Frame entry labels now point to ZX0-compressed frame blobs',
      '; =================================================================='
    );
    for (const group of selectedSpritePatternGroups) {
      extraEquBlocks.push(`; Frame group: ${group.key}`);
      extraEquBlocks.push(`${group.firstLabel} EQU ${group.compressedLabel}`);
    }
    extraEquBlocks.push('');
  }

  const extraDataBlocks = [];
  if (selectedSpritePatternGroups.length > 0) {
    extraDataBlocks.push(
      '; ==================================================================',
      '; ZX0 SPRITE FRAME BLOBS (AUTO-INJECTED)',
      '; ==================================================================',
      'ZX0_SPRITE_FRAME_DATA_START:'
    );
    for (const group of selectedSpritePatternGroups) {
      extraDataBlocks.push(
        `${group.compressedLabel}:`,
        `    ; ZX0 compressed sprite frame ${group.key} (${group.bytes.length} -> ${group.compressedBytes.length} bytes)`,
        ...formatAsmDbLines(group.compressedBytes)
      );
    }
    extraDataBlocks.push(
      'ZX0_SPRITE_FRAME_DATA_END_LABEL:',
      '    DB #00',
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

  if (selectedSpritePatternGroups.length > 0 && !/^\s*COPY_SPRITE_SRC_TO_VRAM:\s*$/im.test(finalCode)) {
    const spriteCopyHelperBlock = [
      '',
      '; ==================================================================',
      '; ZX0 SPRITE COPY HELPER (AUTO-INJECTED)',
      '; - If HL points to a compressed sprite frame blob, decompress frame',
      ';   to ZX0_SPRITE_FRAME_BUFFER and then upload to VRAM.',
      '; - Otherwise copy raw frame data directly to VRAM.',
      '; Input: HL=source (ROM), DE=VRAM destination, BC=byte count',
      '; ==================================================================',
      'COPY_SPRITE_SRC_TO_VRAM:',
      '    push de',
      '    ; source < ZX0_SPRITE_FRAME_DATA_START => raw copy',
      '    push hl',
      '    ld de, ZX0_SPRITE_FRAME_DATA_START',
      '    or a',
      '    sbc hl, de',
      '    pop hl',
      '    jr c, COPY_SPRITE_SRC_TO_VRAM_RAW',
      '',
      '    ; source >= ZX0_SPRITE_FRAME_DATA_END_LABEL => raw copy',
      '    push hl',
      '    ld de, ZX0_SPRITE_FRAME_DATA_END_LABEL',
      '    or a',
      '    sbc hl, de',
      '    pop hl',
      '    jr nc, COPY_SPRITE_SRC_TO_VRAM_RAW',
      '',
      '    ; Compressed frame: decompress to shared RAM buffer, then upload',
      '    pop de',
      '    push bc',
      '    push de',
      '    push hl',
      '    ld de, ZX0_SPRITE_FRAME_BUFFER',
      '    call dzx0_standard',
      '    pop hl',
      '    pop de',
      '    pop bc',
      '    ld hl, ZX0_SPRITE_FRAME_BUFFER',
      '    jp FAST_LDIRVM',
      '',
      'COPY_SPRITE_SRC_TO_VRAM_RAW:',
      '    pop de',
      '    jp FAST_LDIRVM',
      ''
    ].join('\n');

    if (/^\s*end\b.*$/im.test(finalCode)) {
      finalCode = finalCode.replace(/^\s*end\b.*$/im, `${spriteCopyHelperBlock}\n$&`);
    } else {
      finalCode = `${finalCode}\n${spriteCopyHelperBlock}\n`;
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
  const { code, generateSymbols, projectName, screenCompression, romMode, targetFormat, autoMegaROM } = req.body;

  console.log('Compilation request received');
  console.log('  projectName:', projectName);
  console.log('  generateSymbols parameter:', generateSymbols);
  console.log('  requested ROM config:', {
    romMode: romMode || 'simple32k',
    targetFormat: targetFormat || 'konami',
    autoMegaROM: typeof autoMegaROM === 'boolean' ? autoMegaROM : String(romMode || 'simple32k') === 'auto'
  });
  console.log('  Code length:', code?.length || 0);

  if (!code) {
    return res.status(400).send({ error: 'No code provided' });
  }

  const normalizedRomMode = ROM_MODE_VALUES.includes(String(romMode))
    ? String(romMode)
    : 'simple32k';
  const normalizedTargetFormat = ['konami', 'ascii8', 'ascii16'].includes(String(targetFormat))
    ? String(targetFormat)
    : 'konami';
  const normalizedAutoMegaROM =
    typeof autoMegaROM === 'boolean'
      ? autoMegaROM
      : normalizedRomMode === 'auto';

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

    console.log(`Executing Glass: ${command}`);
    if (generateSymbols) {
      console.log(`Symbols will be saved to: ${symbolFilePath}`);
    }

    const runGlassCompile = (attempt = 1) => {
      exec(command, (error, stdout, stderr) => {
      let compileStdout = stdout || '';
      let compileStderr = stderr || '';

      // Log detailed information for debugging
      console.log('=== GLASS COMPILATION RESULTS ===');
      console.log('Command:', command);
      console.log('Attempt:', attempt);
      console.log('Error object:', error);
      console.log('STDOUT:', compileStdout);
      console.log('STDERR:', compileStderr);
      console.log('===================================');

      if (error && attempt === 1) {
        const fullErrorText = `${compileStderr}\n${compileStdout}\n${error.message || ''}`;
        if (isRomFileLockError(fullErrorText)) {
          const closed = closeOpenMsxProcesses();
          if (closed) {
            console.warn('Detected ROM file lock. Closed openMSX and retrying Glass compile once...');
            return runGlassCompile(2);
          }
          console.warn('Detected ROM file lock, but could not close openMSX automatically.');
        }
      }

      if (error) {
        // Don't delete temp file yet so we can inspect it
        console.log(`Glass compilation failed. Temp file: ${tempFilePath}`);

        // Read the source file to see what we tried to compile
        fs.readFile(tempFilePath, 'utf8', (readErr, sourceCode) => {
          const errorResponse = {
            error: 'Glass compilation failed',
            details: compileStderr || compileStdout || error.message,
            command: command,
            sourceFile: tempFilePath,
            sourceCode: readErr ? 'Could not read source' : sourceCode.substring(0, 1000), // First 1000 chars
            fullStderr: compileStderr,
            fullStdout: compileStdout,
            errorCode: error.code,
            signal: error.signal,
            requestedRomConfig: {
              romMode: normalizedRomMode,
              targetFormat: normalizedTargetFormat,
              autoMegaROM: normalizedAutoMegaROM
            },
            screenCompressionInfo: screenCompressionInfo,
            compressedAsmFileInfo: compressedAsmFileInfo
          };

          console.log('Full error response:', errorResponse);
          return res.status(500).json(errorResponse);
        });
        return;
      }

      const sourceRomConfigBeforeCompile = parseSourceRomConfig(codeToCompile);
      const mapperWritesActiveInSource = sourceConfigHasMapperWritesEnabled(sourceRomConfigBeforeCompile);
      const compiledSizeBytes = fs.existsSync(outputFilePath) ? fs.statSync(outputFilePath).size : 0;
      const shouldRecompileSimpleSafe =
        normalizedRomMode !== 'megarom' &&
        mapperWritesActiveInSource &&
        compiledSizeBytes > 0 &&
        compiledSizeBytes <= SIMPLE_ROM_LIMIT_BYTES;

      if (shouldRecompileSimpleSafe) {
        const simpleSafeCode = disableMapperWritesForSimple32k(codeToCompile);
        if (simpleSafeCode !== codeToCompile) {
          console.log(
            `Mapper writes detected in <=32KB ROM (${compiledSizeBytes} bytes). Recompiling with simple32k-safe mapper stubs.`
          );

          try {
            codeToCompile = simpleSafeCode;
            fs.writeFileSync(tempFilePath, codeToCompile, 'utf8');
            const retryStdout = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
            if (retryStdout && retryStdout.trim()) {
              compileStdout = [compileStdout, retryStdout].filter(Boolean).join('\n');
            }
            console.log('Simple32k-safe recompilation completed.');
          } catch (retryError) {
            const retryStdoutText = retryError && retryError.stdout
              ? String(retryError.stdout)
              : '';
            const retryStderrText = retryError && retryError.stderr
              ? String(retryError.stderr)
              : '';
            return res.status(500).json({
              error: 'Glass recompilation failed while applying simple32k-safe mapper mode',
              details: retryStderrText || retryStdoutText || retryError.message,
              command: command,
              sourceFile: tempFilePath,
              fullStderr: retryStderrText,
              fullStdout: retryStdoutText,
              requestedRomConfig: {
                romMode: normalizedRomMode,
                targetFormat: normalizedTargetFormat,
                autoMegaROM: normalizedAutoMegaROM
              }
            });
          }
        }
      }

      fs.readFile(outputFilePath, (readErr, data) => {
        // Clean up only the temporary ASM file, keep the ROM file
        fs.unlink(tempFilePath, () => {});

        if (readErr) {
          return res.status(500).send({ error: 'Failed to read compiled file', details: readErr });
        }

        // MSX ROM files must be multiples of 8KB. For real flashcarts we
        // enforce a minimum of 32KB and power-of-two 8KB bank counts.
        const KB_8 = 8192; // 8KB in bytes
        const MIN_FLASHCART_ROM_BYTES = 32 * 1024;
        const ROM_ORIGIN = 0x4000;
        const originalSize = data.length;
        const sizeMod8192 = originalSize % KB_8;
        const aligned8KBSize = Math.max(KB_8, Math.ceil(originalSize / KB_8) * KB_8);
        const aligned8KBBanks = aligned8KBSize / KB_8;
        const minFlashcartBanks = MIN_FLASHCART_ROM_BYTES / KB_8;
        const sourceRomConfig = parseSourceRomConfig(codeToCompile);
        const linear48kCapable = sourceHasLinear48kLayout(codeToCompile) || sourceRomConfig?.romMode === 'plain48k';
        const isPowerOfTwo = (value) => value > 0 && (value & (value - 1)) === 0;
        const powerOfTwoBankCount = isPowerOfTwo(aligned8KBBanks)
          ? aligned8KBBanks
          : Math.pow(2, Math.ceil(Math.log2(aligned8KBBanks)));
        const targetBankCount = Math.max(minFlashcartBanks, powerOfTwoBankCount);
        let targetSize = targetBankCount * KB_8;
        let paddingPolicy = 'minimum 32KB + power-of-two 8KB banks';
        let plain48kSupportWarning = null;

        if (normalizedRomMode === 'plain48k') {
          if (aligned8KBSize > PLAIN48_ROM_LIMIT_BYTES) {
            plain48kSupportWarning = 'Requested plain48k, but final ROM exceeds 48KB.';
          } else if (!linear48kCapable) {
            plain48kSupportWarning =
              'Requested plain48k, but source ASM does not contain a linear 48KB page-0 layout. Falling back to standard ROM padding.';
          } else if (aligned8KBSize > SIMPLE_ROM_LIMIT_BYTES) {
            targetSize = PLAIN48_ROM_LIMIT_BYTES;
            paddingPolicy = 'linear plain48k (fixed 48KB image)';
          }
        }

        let paddedData = data;
        if (originalSize !== targetSize) {
          // Calculate padding needed to reach hardware-safe size.
          const paddingNeeded = targetSize - originalSize;
          const padding = Buffer.alloc(paddingNeeded, 0xFF); // Fill with 0xFF (common for ROM padding)
          paddedData = Buffer.concat([data, padding]);

          console.log('ROM Size Adjustment:');
          console.log(`   Original: ${originalSize} bytes`);
          console.log(`   8KB aligned: ${aligned8KBSize} bytes (${aligned8KBBanks}x8KB)`);
          console.log(`   Hardware-safe: ${paddedData.length} bytes (${paddedData.length / KB_8}x8KB)`);
          console.log(`   Added: ${paddingNeeded} bytes of padding (0xFF)`);

          // Write the padded ROM back to file
          fs.writeFileSync(outputFilePath, paddedData);
        } else {
          console.log(`ROM Size OK: ${originalSize} bytes (${originalSize / KB_8}x8KB)`);
        }

        const banks8KB = paddedData.length / KB_8;
        const endAddress = ROM_ORIGIN + paddedData.length - 1;
        const exceedsSimpleRomLimit = paddedData.length > SIMPLE_ROM_LIMIT_BYTES;
        const exceedsPlain48RomLimit = paddedData.length > PLAIN48_ROM_LIMIT_BYTES;
        const mapperHint = exceedsSimpleRomLimit
          ? 'ROM exceeds 32KB simple layout. Use mapper-aware build/runtime (Konami/ASCII).'
          : null;
        let sourceConfigMismatchWarning = null;
        if (sourceRomConfig) {
          const sourceRomMode = sourceRomConfig.romMode || 'unknown';
          const sourceTargetFormat = sourceRomConfig.targetFormat || 'unknown';
          const sourceAutoMega = sourceRomConfig.autoMegaROM === null ? 'unknown' : String(sourceRomConfig.autoMegaROM);
          if (
            sourceRomConfig.romMode !== null && sourceRomConfig.romMode !== normalizedRomMode ||
            sourceRomConfig.targetFormat !== null && sourceRomConfig.targetFormat !== normalizedTargetFormat ||
            sourceRomConfig.autoMegaROM !== null && sourceRomConfig.autoMegaROM !== normalizedAutoMegaROM
          ) {
            sourceConfigMismatchWarning =
              `Source ASM config (mode=${sourceRomMode}, mapper=${sourceTargetFormat}, autoMegaROM=${sourceAutoMega}) differs from compile request ` +
              `(mode=${normalizedRomMode}, mapper=${normalizedTargetFormat}, autoMegaROM=${normalizedAutoMegaROM}).`;
          }
        }

        let romModeConflictWarning = null;
        if (normalizedRomMode === 'simple32k' && exceedsSimpleRomLimit) {
          romModeConflictWarning = 'Requested simple32k, but final ROM exceeds 32KB and requires a mapper.';
        } else if (normalizedRomMode === 'plain48k' && exceedsPlain48RomLimit) {
          romModeConflictWarning = 'Requested plain48k, but final ROM exceeds 48KB and requires a mapper.';
        }

        let resolvedRomMode = 'simple32k';
        let mapperResolutionReason = 'ROM fits in 32KB simple layout.';
        if (normalizedRomMode === 'megarom') {
          resolvedRomMode = 'megarom';
          mapperResolutionReason = 'Forced megarom by request.';
        } else if (normalizedRomMode === 'plain48k') {
          if (exceedsPlain48RomLimit) {
            resolvedRomMode = 'megarom_required';
            mapperResolutionReason = 'ROM exceeds 48KB; plain48k request is not valid.';
          } else if (exceedsSimpleRomLimit) {
            if (linear48kCapable) {
              resolvedRomMode = 'plain48k';
              mapperResolutionReason = 'Forced plain48k by request and source exposes a linear 48KB layout.';
            } else {
              resolvedRomMode = 'plain48k_pending';
              mapperResolutionReason = 'plain48k requested, but source lacks page-0 layout; runtime support is still pending.';
            }
          } else {
            resolvedRomMode = 'simple32k';
            mapperResolutionReason = 'plain48k requested, but ROM still fits in 32KB.';
          }
        } else if (normalizedRomMode === 'simple32k') {
          if (exceedsSimpleRomLimit) {
            resolvedRomMode = 'megarom_required';
            mapperResolutionReason = 'ROM exceeds 32KB; simple32k request is not valid.';
          } else {
            resolvedRomMode = 'simple32k';
            mapperResolutionReason = 'Forced simple32k by request and ROM fits.';
          }
        } else {
          if (exceedsSimpleRomLimit && !exceedsPlain48RomLimit && linear48kCapable) {
            resolvedRomMode = 'plain48k';
            mapperResolutionReason = 'Auto mode switched to plain48k because ROM fits in 48KB and source exposes page-0 layout.';
          } else if (exceedsSimpleRomLimit) {
            resolvedRomMode = 'megarom';
            mapperResolutionReason = exceedsPlain48RomLimit
              ? 'Auto mode switched to megarom because ROM exceeds 48KB.'
              : 'Auto mode switched to megarom because ROM exceeds 32KB and source has no plain48k layout.';
          } else {
            resolvedRomMode = 'simple32k';
            mapperResolutionReason = 'Auto mode kept simple32k because ROM fits in 32KB.';
          }
        }
        const mapperActive = resolvedRomMode === 'megarom' || resolvedRomMode === 'megarom_required';
        const resolvedTargetFormat = mapperActive ? normalizedTargetFormat : 'none';

        console.log('ROM diagnostics:', {
          sizeMod8192,
          banks8KB,
          romOrigin: `0x${ROM_ORIGIN.toString(16).toUpperCase()}`,
          endAddress: `0x${endAddress.toString(16).toUpperCase()}`,
          simpleRomLimitBytes: SIMPLE_ROM_LIMIT_BYTES,
          plain48RomLimitBytes: PLAIN48_ROM_LIMIT_BYTES,
          exceedsSimpleRomLimit,
          exceedsPlain48RomLimit,
          requestedRomMode: normalizedRomMode,
          requestedTargetFormat: normalizedTargetFormat,
          requestedAutoMegaROM: normalizedAutoMegaROM,
          linear48kCapable,
          plain48kSupportWarning,
          romModeConflictWarning,
          resolvedRomMode,
          resolvedTargetFormat,
          mapperTargetFormat: normalizedTargetFormat,
          mapperActive,
          mapperResolutionReason,
          sourceRomConfig,
          sourceConfigMismatchWarning
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
            console.log(`OpenMSX symbols: ${openmsxSymbols.length} ROM symbols (filtered 0x4000-0xFFFF)`);
          } catch (convError) {
            console.error('Failed to convert to OpenMSX format:', convError);
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
          console.log(`Symbol file generated: ${symbolFileName} (${symbolStats.size} bytes)`);
        } else if (symbolFilePath) {
          console.log(`Symbol file was requested but not generated: ${symbolFilePath}`);
        }

        // Return ROM file information for download
        const romFileName = path.basename(outputFilePath);
        const responseData = {
          success: true,
          data: paddedData.toString('hex'),
          message: compileStdout,
          romFile: romFileName,
          romPath: outputFilePath,
          downloadUrl: `/download/${romFileName}`,
          screenCompressionInfo: screenCompressionInfo,
          requestedRomConfig: {
            romMode: normalizedRomMode,
            targetFormat: normalizedTargetFormat,
            autoMegaROM: normalizedAutoMegaROM
          },
          sourceRomConfig: sourceRomConfig,
          sourceConfigMismatchWarning: sourceConfigMismatchWarning,
          plain48kSupportWarning: plain48kSupportWarning,
          resolvedRomConfig: {
            requestedRomMode: normalizedRomMode,
            resolvedRomMode: resolvedRomMode,
            targetFormat: resolvedTargetFormat,
            mapperTargetFormat: normalizedTargetFormat,
            mapperActive: mapperActive,
            reason: mapperResolutionReason
          },
          romModeConflictWarning: romModeConflictWarning,
          romSizeInfo: {
            originalSize: originalSize,
            paddedSize: paddedData.length,
            paddingAdded: paddedData.length - originalSize,
            paddingPolicy: paddingPolicy,
            minimumFlashcartSize: MIN_FLASHCART_ROM_BYTES,
            aligned8KBSize: aligned8KBSize,
            aligned8KBBanks: aligned8KBBanks,
            targetHardwareSize: targetSize,
            targetHardwareBanks: targetSize / KB_8,
            hardwareSafePaddingApplied: targetSize !== aligned8KBSize,
            sizeIn8KB: paddedData.length / KB_8,
            sizeMod8192: sizeMod8192,
            banks8KB: banks8KB,
            romOrigin: ROM_ORIGIN,
            endAddress: endAddress,
            simpleRomLimitBytes: SIMPLE_ROM_LIMIT_BYTES,
            plain48RomLimitBytes: PLAIN48_ROM_LIMIT_BYTES,
            exceedsSimpleRomLimit: exceedsSimpleRomLimit,
            exceedsPlain48RomLimit: exceedsPlain48RomLimit,
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
    };

    runGlassCompile(1);
  });
});

/**
 * Endpoint to compress unified ASM screen/behavior data with ZX0 (without compiling).
 * Expects a JSON body with `code` and optional `projectName`.
 * @name POST /compress-unified-asm
 * @function
 */
app.post('/compress-unified-asm', (req, res) => {
  const { code, projectName, zx0Options } = req.body;

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
    const preprocessed = injectZx0IntoUnifiedAsm(code, tempDir, zx0Options || {});
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

  console.log(`Starting OpenMSX with ROM: ${romFile}`);

  // Execute run script (doesn't wait - OpenMSX stays open)
  const command = `"${runScript}" "${romPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`Failed to start OpenMSX: ${error.message}`);
      return res.status(500).send({
        error: 'Failed to start OpenMSX',
        details: error.message,
        stdout: stdout,
        stderr: stderr
      });
    }

    console.log(`OpenMSX started successfully for ROM: ${romFile}`);
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

  console.log(`Generating screenshot for ROM: ${romFile} (wait: ${waitSeconds}s)`);

  // Execute screenshot script and wait for completion
  const command = `"${screenshotScript}" "${romPath}" ${waitSeconds}`;

  exec(command, { timeout: (waitSeconds + 20) * 1000 }, (error, stdout, stderr) => {
    if (error) {
      console.log(`Screenshot generation failed: ${error.message}`);
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
      console.log(`Screenshot generated: ${latestScreenshot.filename}`);

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

/**
 * @fileoverview This file sets up a simple Express server to handle backend tasks
 * for the MSX IDE, such as code compilation and data compression.
 */

const express = require('express');
const cors = require('cors');
const util = require('util');
const { exec, execSync, execFile } = require('child_process');
const fs = require('fs');
const execAsync = util.promisify(exec);
const execFileAsync = util.promisify(execFile);
const path = require('path');
const { serializeAsset } = require('./assetSerializer');

const app = express();
const port = 3001;

const ZX0_ROUTINE_OVERHEAD_BYTES = 96;
const ZX0_PER_BLOCK_RUNTIME_OVERHEAD_BYTES = 11;
const SIMPLE_ROM_LIMIT_BYTES = 32 * 1024;
const PLAIN48_ROM_LIMIT_BYTES = 48 * 1024;
const ROM_MODE_VALUES = ['auto', 'simple32k', 'plain48k', 'megarom'];
const zx0CompressionJobs = new Map();

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

async function runZx0CompressionAsync(inputBytes, tempDir) {
  const zx0JarPath = path.join(__dirname, 'zx0.jar');
  if (!fs.existsSync(zx0JarPath)) {
    throw new Error(`ZX0 jar not found: ${zx0JarPath}`);
  }

  const stamp = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const inputPath = path.join(tempDir, `zx0_screen_in_${stamp}.bin`);
  const outputPath = path.join(tempDir, `zx0_screen_out_${stamp}.bin`);

  try {
    fs.writeFileSync(inputPath, Buffer.from(inputBytes));
    await execFileAsync('java', ['-jar', zx0JarPath, inputPath, outputPath], { stdio: 'pipe' });
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
  const explicitPage0Data = text.match(/^\s*;\s*Linear48K Page0 Data:\s*(Yes|No)\b/im)?.[1];
  if (explicitPage0Data) {
    return explicitPage0Data.toLowerCase() === 'yes';
  }
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
    let alreadyCompressed = false;

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
        if (!seenData && /^\s*;\s*ZX0 compressed\b/i.test(lines[j])) {
          alreadyCompressed = true;
        }
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
        alreadyCompressed,
        bytes,
        lines: lines.slice(i, j)
      });
    }

    i = j - 1;
  }

  return blocks;
}

function formatAsmAddress(value) {
  return `#${value.toString(16).toUpperCase().padStart(4, '0')}`;
}

function countAsmBytesInLines(lines) {
  let total = 0;
  for (const line of lines) {
    const parsed = parseDbLineBytes(line);
    if (parsed) total += parsed.length;
  }
  return total;
}

function getMegaromDataGroupKey(label) {
  const upper = String(label || '').toUpperCase();
  if (upper.startsWith('TILE_PATTERN_') || upper.startsWith('TILEBANK_PATTERN_DATA_')) {
    return 'patterns';
  }
  if (upper.startsWith('TILE_COLOR_') || upper.startsWith('TILEBANK_COLOR_DATA_')) {
    return 'colors';
  }
  return upper;
}

function matchAsmLabelLoad(line, registerName, labelPattern) {
  const register = String(registerName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const plainMatch = line.match(
    new RegExp(
      `^\\s*ld\\s+${register},\\s*(${labelPattern})(\\s*\\+\\s*\\d+)?\\s*(?:;.*)?$`,
      'i'
    )
  );
  if (plainMatch) {
    return {
      label: plainMatch[1],
      offset: plainMatch[2] ? plainMatch[2].replace(/\s+/g, '') : '',
      banked: false,
    };
  }

  const bankedMatch = line.match(
    new RegExp(
      `^\\s*ld\\s+${register},\\s*\\(\\s*(${labelPattern})\\s*&\\s*#1FFF\\s*\\)\\s*\\|\\s*#8000(\\s*\\+\\s*\\d+)?\\s*(?:;.*)?$`,
      'i'
    )
  );
  if (bankedMatch) {
    return {
      label: bankedMatch[1],
      offset: bankedMatch[2] ? bankedMatch[2].replace(/\s+/g, '') : '',
      banked: true,
    };
  }

  return null;
}

function repackMegaromZonedDataSection(sourceCode) {
  const lines = String(sourceCode || '').split(/\r?\n/);
  let sectionStart = lines.findIndex((line) => /;\s*DATA BANKS .+Zone-packed data/i.test(line));
  if (sectionStart === -1) return sourceCode;
  if (sectionStart > 0 && /^\s*;\s*=+\s*$/.test(lines[sectionStart - 1])) {
    sectionStart -= 1;
  }

  const sectionEnd = lines.findIndex((line, idx) => idx > sectionStart && /^\s*end\b/i.test(line));
  if (sectionEnd === -1) return sourceCode;

  const sectionLines = lines.slice(sectionStart, sectionEnd);
  const sectionText = sectionLines.join('\n');
  const zoneSizeMatch = sectionText.match(/Zone-packed data \((\d+) bytes per zone\)/i);
  if (!zoneSizeMatch) return sourceCode;
  const zoneSize = parseInt(zoneSizeMatch[1], 10);
  if (!Number.isFinite(zoneSize) || zoneSize <= 0) return sourceCode;

  let dataStartAddress = null;
  const dataStartMatch = sectionText.match(/Data start address:\s*#([0-9A-F]+)/i);
  if (dataStartMatch) {
    dataStartAddress = parseInt(dataStartMatch[1], 16);
  }
  if (!Number.isFinite(dataStartAddress)) {
    const firstOrgMatch = sectionText.match(/^\s*org\s+#([0-9A-F]+)\s*$/im);
    if (firstOrgMatch) {
      dataStartAddress = parseInt(firstOrgMatch[1], 16);
    }
  }
  if (!Number.isFinite(dataStartAddress)) return sourceCode;

  const firstDiagSeparator = sectionLines.findIndex((line, idx) => idx > 0 && /^\s*;\s*-{10,}\s*$/.test(line));
  if (firstDiagSeparator === -1) return sourceCode;
  const introLines = sectionLines.slice(0, firstDiagSeparator);

  const firstOrgIndex = sectionLines.findIndex((line) => /^\s*org\s+#/i.test(line));
  if (firstOrgIndex === -1) return sourceCode;
  const dataLines = sectionLines.slice(firstOrgIndex);

  const blocks = [];
  const prelude = [];
  let currentLabel = null;
  let currentLines = [];
  let skipZoneBanner = 0;

  const flushCurrent = () => {
    if (!currentLabel) return;
    blocks.push({
      label: currentLabel,
      groupKey: getMegaromDataGroupKey(currentLabel),
      lines: currentLines.slice(),
      byteSize: countAsmBytesInLines(currentLines),
    });
    currentLabel = null;
    currentLines = [];
  };

  for (const line of dataLines) {
    if (/^\s*org\s+#/i.test(line) || /^\s*ds\s+#/i.test(line)) {
      flushCurrent();
      prelude.length = 0;
      skipZoneBanner = /^\s*org\s+#/i.test(line) ? 3 : 0;
      continue;
    }

    if (skipZoneBanner > 0) {
      if (/^\s*;\s*=+\s*$/.test(line) || /^\s*;\s*DATA ZONE\b/i.test(line) || /^\s*$/.test(line)) {
        skipZoneBanner -= 1;
        continue;
      }
      skipZoneBanner = 0;
    }

    const labelMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*):(?:\s*;.*)?\s*$/);
    if (labelMatch) {
      flushCurrent();
      currentLabel = labelMatch[1];
      currentLines = [...prelude, line];
      prelude.length = 0;
      continue;
    }

    if (!currentLabel) {
      if (line.trim() === '' || line.trim().startsWith(';')) {
        prelude.push(line);
      }
      continue;
    }

    currentLines.push(line);
  }
  flushCurrent();

  if (blocks.length === 0) return sourceCode;

  const units = [];
  for (const block of blocks) {
    const shouldMerge = (block.groupKey === 'patterns' || block.groupKey === 'colors') &&
      units.length > 0 &&
      units[units.length - 1].groupKey === block.groupKey;

    if (shouldMerge) {
      const currentUnit = units[units.length - 1];
      currentUnit.labels.push(block.label);
      currentUnit.byteSize += block.byteSize;
      if (currentUnit.lines.length > 0 && currentUnit.lines[currentUnit.lines.length - 1] !== '') {
        currentUnit.lines.push('');
      }
      currentUnit.lines.push(...block.lines);
      continue;
    }

    units.push({
      groupKey: block.groupKey,
      labels: [block.label],
      lines: block.lines.slice(),
      byteSize: block.byteSize,
    });
  }

  const zones = [];
  let currentZoneUnits = [];
  let currentZoneUsed = 0;
  let zoneIndex = 0;

  const flushZone = () => {
    if (currentZoneUnits.length === 0) return;
    const orgAddress = dataStartAddress + (zoneIndex * zoneSize);
    const endAddress = orgAddress + zoneSize;
    zones.push({
      zoneIndex,
      orgAddress,
      endAddress,
      physicalBank: (orgAddress - 0x4000) / zoneSize,
      usedBytes: currentZoneUsed,
      remainingBytes: zoneSize - currentZoneUsed,
      units: currentZoneUnits,
    });
    zoneIndex += 1;
    currentZoneUnits = [];
    currentZoneUsed = 0;
  };

  for (const unit of units) {
    if (unit.byteSize > zoneSize) {
      throw new Error(
        `MegaROM ZX0 data zone overflow: ${unit.labels.join(', ')} ` +
        `(${unit.byteSize} bytes > zone ${zoneSize})`
      );
    }

    if (currentZoneUnits.length > 0 && currentZoneUsed + unit.byteSize > zoneSize) {
      flushZone();
    }

    currentZoneUnits.push({
      ...unit,
      zoneOffset: currentZoneUsed,
    });
    currentZoneUsed += unit.byteSize;
  }
  flushZone();

  const diagnosticsLines = [
    '; ------------------------------------------------------------------',
    '; MEGAROM DATA ZONE PACKER (post-ZX0 final sizes)',
    `; Zone size: ${zoneSize} bytes`,
    `; Data start address: ${formatAsmAddress(dataStartAddress)}`,
    `; Total data bytes (post-ZX0 / final): ${units.reduce((sum, unit) => sum + unit.byteSize, 0)}`,
    `; Zones used: ${zones.length}`,
    '; ------------------------------------------------------------------',
  ];

  for (const zone of zones) {
    diagnosticsLines.push(
      `; ZONE ${zone.zoneIndex.toString().padStart(2, '0')} ` +
      `[${formatAsmAddress(zone.orgAddress)}-${formatAsmAddress(zone.endAddress)}] ` +
      `bank ${zone.physicalBank} used=${zone.usedBytes} slack=${zone.remainingBytes}`
    );
    for (const unit of zone.units) {
      diagnosticsLines.push(
        `;   + ${unit.labels.join(', ')} @ +${formatAsmAddress(unit.zoneOffset)} size=${unit.byteSize}`
      );
    }
  }

  const zoneAsmLines = [];
  for (const zone of zones) {
    zoneAsmLines.push(`    org ${formatAsmAddress(zone.orgAddress)}`);
    zoneAsmLines.push('; ==================================================================');
    zoneAsmLines.push(
      `; DATA ZONE ${zone.zoneIndex.toString().padStart(2, '0')} ` +
      `(bank ${zone.physicalBank}) used=${zone.usedBytes} slack=${zone.remainingBytes}`
    );
    zoneAsmLines.push('; ==================================================================');
    for (const unit of zone.units) {
      zoneAsmLines.push(...unit.lines);
      zoneAsmLines.push('');
    }
    zoneAsmLines.push(`    ds ${formatAsmAddress(zone.endAddress)} - $, #FF`);
    zoneAsmLines.push('');
  }

  const rebuiltSection = [
    ...introLines,
    ...diagnosticsLines,
    '',
    ...zoneAsmLines,
  ];

  return [
    ...lines.slice(0, sectionStart),
    ...rebuiltSection,
    ...lines.slice(sectionEnd),
  ].join('\n');
}

function countSymbolReferences(sourceCodeUpper, symbol) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'g');
  const matches = sourceCodeUpper.match(re);
  return matches ? matches.length : 0;
}

function parsePresentationCompressionFlag(sourceCode, key, defaultValue = true) {
  const match = String(sourceCode || '').match(new RegExp(`^\\s*;\\s*${key}:\\s*([01])\\s*$`, 'im'));
  if (!match) return defaultValue;
  return match[1] === '1';
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

async function injectZx0IntoUnifiedAsm(sourceCode, tempDir, options = {}, onProgress = null) {
  const {
    screens             = true,
    effects             = true,
    behaviorMaps        = true,
    tilePatterns        = true,
    tileColors          = true,
    fontPatterns        = true,
    fontColors          = true,
    spritePatterns      = true,
    presentationScreen  = true,
  } = options;
  const info = {
    attempted: false,
    applied: false,
    method: 'ZX0',
    candidateScreens: 0,
    candidateEffects: 0,
    candidateBehaviorMaps: 0,
    candidateTilePatterns: 0,
    candidateTileColors: 0,
    candidateFontPatterns: 0,
    candidateFontColors: 0,
    candidateSpritePatterns: 0,
    compressedScreens: 0,
    compressedEffects: 0,
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
    effectsBufferSymbol: 'runtime_effects_layout',
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
  const hasEffectsData = /SCREEN_[A-Z0-9_]+_\d+_EFFECTS_LAYOUT:/.test(sourceCode);
  const hasBehaviorData = /BEHAVIOR_[A-Z0-9_]+_\d+_DATA:/.test(sourceCode);
  const hasPresentationNameData = /^\s*PRESENTATION_SCREEN_NAMETBL:\s*$/im.test(sourceCode);
  const hasPresentationPatternData = /^\s*PRESENTATION_SCREEN_PATTERNS_B[0-2]:\s*$/im.test(sourceCode);
  const hasPresentationColorData = /^\s*PRESENTATION_SCREEN_COLORS_B[0-2]:\s*$/im.test(sourceCode);
  const hasTilePatternData = /^\s*tile_pattern_[a-z0-9_]+:\s*$/im.test(sourceCode);
  const hasTileColorData = /^\s*tile_color_[a-z0-9_]+:\s*$/im.test(sourceCode);
  const hasFontPatternData = /^\s*FONT_PATTERN_DATA:\s*$/im.test(sourceCode);
  const hasFontColorData = /^\s*FONT_COLOR_DATA:\s*$/im.test(sourceCode);
  const hasSpritePatternData = /^\s*(?:[A-Z][A-Z0-9_]*_F\d+_LAYER\d+|SPRITE_PLACEHOLDER_PATTERN):\s*$/im.test(sourceCode);
  if (
    !hasLayoutData &&
    !hasEffectsData &&
    !hasBehaviorData &&
    !hasPresentationNameData &&
    !hasPresentationPatternData &&
    !hasPresentationColorData &&
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
  const compressPresentationName = parsePresentationCompressionFlag(sourceCode, 'PRESENTATION_SCREEN_COMPRESS_NAMETBL', true);
  const compressPresentationPatterns = parsePresentationCompressionFlag(sourceCode, 'PRESENTATION_SCREEN_COMPRESS_PATTERNS', true);
  const compressPresentationColors = parsePresentationCompressionFlag(sourceCode, 'PRESENTATION_SCREEN_COMPRESS_COLORS', true);
  const presentationDataInPage0 = /^\s*;\s*PRESENTATION_SCREEN_ROM_DATA_GROUP:\s*page0\s*$/im.test(sourceCode);
  const fontDataInPage0 = /^\s*;\s*FONT_DATA_ROM_DATA_GROUP:\s*page0\s*$/im.test(sourceCode);
  info.screenBufferSymbol = screenBufferSymbol;
  info.effectsBufferSymbol = 'runtime_effects_layout';
  info.behaviorBufferSymbol = behaviorBufferSymbol;
  info.tilePatternBufferSymbol = tilePatternBufferSymbol;
  info.tileColorBufferSymbol = tileColorBufferSymbol;
  info.fontPatternBufferSymbol = fontPatternBufferSymbol;
  info.fontColorBufferSymbol = fontColorBufferSymbol;

  info.attempted = true;
  const lines = sourceCode.split(/\r?\n/);
  const layoutBlocks = collectAsmDataBlocks(lines, /^\s*(SCREEN_[A-Z0-9_]+_\d+_LAYOUT):\s*$/);
  const effectsBlocks = collectAsmDataBlocks(lines, /^\s*(SCREEN_[A-Z0-9_]+_\d+_EFFECTS_LAYOUT):\s*$/);
  const behaviorBlocks = collectAsmDataBlocks(lines, /^\s*(BEHAVIOR_[A-Z0-9_]+_\d+_DATA):\s*$/);
  const presentationNameBlocks = (presentationScreen && compressPresentationName)
    ? collectAsmDataBlocks(lines, /^\s*(PRESENTATION_SCREEN_NAMETBL):\s*$/)
    : [];
  const presentationPatternBlocks = (presentationScreen && compressPresentationPatterns)
    ? collectAsmDataBlocks(lines, /^\s*(PRESENTATION_SCREEN_PATTERNS_B[0-2]):\s*$/)
    : [];
  const presentationColorBlocks = (presentationScreen && compressPresentationColors)
    ? collectAsmDataBlocks(lines, /^\s*(PRESENTATION_SCREEN_COLORS_B[0-2]):\s*$/)
    : [];
  const tilePatternBlocks = collectAsmDataBlocks(lines, /^\s*(tile_pattern_[a-z0-9_]+):\s*$/i);
  const tileColorBlocks = collectAsmDataBlocks(lines, /^\s*(tile_color_[a-z0-9_]+):\s*$/i);
  const fontPatternBlocks = collectAsmDataBlocks(lines, /^\s*(FONT_PATTERN_DATA):\s*$/i);
  const fontColorBlocks = collectAsmDataBlocks(lines, /^\s*(FONT_COLOR_DATA):\s*$/i);
  const spritePatternBlocks = collectAsmDataBlocks(lines, /^\s*([A-Z][A-Z0-9_]*_F\d+_LAYER\d+|SPRITE_PLACEHOLDER_PATTERN):(?:\s*;.*)?\s*$/);

  if (
    layoutBlocks.length === 0 &&
    presentationNameBlocks.length === 0 &&
    effectsBlocks.length === 0 &&
    behaviorBlocks.length === 0 &&
    presentationPatternBlocks.length === 0 &&
    presentationColorBlocks.length === 0 &&
    tilePatternBlocks.length === 0 &&
    tileColorBlocks.length === 0 &&
    fontPatternBlocks.length === 0 &&
    fontColorBlocks.length === 0 &&
    spritePatternBlocks.length === 0
  ) {
    return { code: sourceCode, info };
  }

  const allLayoutBlocks = [...layoutBlocks, ...presentationNameBlocks];
  const allTilePatternBlocks = [...tilePatternBlocks, ...presentationPatternBlocks];
  const allTileColorBlocks = [...tileColorBlocks, ...presentationColorBlocks];

  info.candidateScreens = allLayoutBlocks.length;
  info.candidateEffects = effectsBlocks.length;
  info.candidateBehaviorMaps = behaviorBlocks.length;
  info.candidateTilePatterns = allTilePatternBlocks.length;
  info.candidateTileColors = allTileColorBlocks.length;
  info.candidateFontPatterns = fontPatternBlocks.length;
  info.candidateFontColors = fontColorBlocks.length;
  info.candidateSpritePatterns = spritePatternBlocks.length;

  const enabledProgressGroups = [
    screens ? { phase: 'screens', label: 'Compress screen layouts', count: allLayoutBlocks.length } : null,
    effects ? { phase: 'effects', label: 'Compress effects layouts', count: effectsBlocks.length } : null,
    behaviorMaps ? { phase: 'behaviorMaps', label: 'Compress behavior maps', count: behaviorBlocks.length } : null,
    tilePatterns ? { phase: 'tilePatterns', label: 'Compress tile patterns', count: allTilePatternBlocks.length } : null,
    tileColors ? { phase: 'tileColors', label: 'Compress tile colors', count: allTileColorBlocks.length } : null,
    fontPatterns ? { phase: 'fontPatterns', label: 'Compress font patterns', count: fontPatternBlocks.length } : null,
    fontColors ? { phase: 'fontColors', label: 'Compress font colors', count: fontColorBlocks.length } : null,
    spritePatterns ? { phase: 'spritePatterns', label: 'Compress sprite frames', count: spritePatternBlocks.length > 0 ? buildSpriteFrameGroups(spritePatternBlocks, sourceCode).length : 0 } : null,
  ].filter(Boolean);

  const totalProgressSteps = enabledProgressGroups.reduce((sum, group) => sum + group.count, 0);
  let completedProgressSteps = 0;

  const emitProgress = (message, phase, current = completedProgressSteps, total = totalProgressSteps) => {
    if (typeof onProgress === 'function') {
      onProgress({
        message,
        phase,
        current,
        total: Math.max(1, total)
      });
    }
  };

  const selectedLayoutBlocks = new Map();
  const selectedEffectsBlocks = new Map();
  const selectedBehaviorBlocks = new Map();
  const selectedTilePatternBlocks = new Map();
  const selectedTileColorBlocks = new Map();
  const selectedFontPatternBlocks = new Map();
  const selectedFontColorBlocks = new Map();
  const selectedSpritePatternGroups = [];
  let spriteGroups = [];
  let forcedPage0BlockCount = 0;
  let alreadyCompressedBlockCount = 0;

  function shouldForcePage0BlockCompression(block, kind) {
    const label = String(block?.label || '').toUpperCase();
    if (!label) return false;

    if (presentationDataInPage0) {
      if (kind === 'layout' && label === 'PRESENTATION_SCREEN_NAMETBL') return true;
      if (kind === 'tile_pattern' && /^PRESENTATION_SCREEN_PATTERNS_B[0-2]$/.test(label)) return true;
      if (kind === 'tile_color' && /^PRESENTATION_SCREEN_COLORS_B[0-2]$/.test(label)) return true;
    }

    if (fontDataInPage0) {
      if (kind === 'font_pattern' && label === 'FONT_PATTERN_DATA') return true;
      if (kind === 'font_color' && label === 'FONT_COLOR_DATA') return true;
    }

    return false;
  }

  if (spritePatterns && spritePatternBlocks.length > 0) {
    spriteGroups = buildSpriteFrameGroups(spritePatternBlocks, sourceCode);
  }

  async function processBlocks(blocks, kind, phaseLabel, phaseKey) {
    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index];
      emitProgress(`${phaseLabel} ${index + 1}/${blocks.length}`, phaseKey);
      info.originalBytes += block.bytes.length;
      if (block.alreadyCompressed) {
        alreadyCompressedBlockCount += 1;
        info.compressedBytes += block.bytes.length;
        completedProgressSteps += 1;
        emitProgress(`${phaseLabel} ${Math.min(index + 1, blocks.length)}/${blocks.length}`, phaseKey);
        continue;
      }
      const forceCompression = shouldForcePage0BlockCompression(block, kind);
      try {
        const compressed = await runZx0CompressionAsync(block.bytes, tempDir);
        if (compressed.length < block.bytes.length || forceCompression) {
          const selected = {
            ...block,
            kind,
            compressedBytes: Array.from(compressed.values())
          };
          if (forceCompression) {
            forcedPage0BlockCount += 1;
          }
          if (kind === 'layout') {
            selectedLayoutBlocks.set(block.label.toUpperCase(), selected);
            info.compressedScreens += 1;
          } else if (kind === 'effects') {
            selectedEffectsBlocks.set(block.label.toUpperCase(), selected);
            info.compressedEffects += 1;
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
      completedProgressSteps += 1;
      emitProgress(`${phaseLabel} ${Math.min(index + 1, blocks.length)}/${blocks.length}`, phaseKey);
    }
  }

  emitProgress('Preparing ZX0 blocks...', 'prepare', 0, totalProgressSteps);

  if (screens)      await processBlocks(allLayoutBlocks, 'layout', 'Compress screen layouts', 'screens');
  if (effects)      await processBlocks(effectsBlocks, 'effects', 'Compress effects layouts', 'effects');
  if (behaviorMaps) await processBlocks(behaviorBlocks, 'behavior', 'Compress behavior maps', 'behaviorMaps');
  if (tilePatterns) await processBlocks(allTilePatternBlocks, 'tile_pattern', 'Compress tile patterns', 'tilePatterns');
  if (tileColors)   await processBlocks(allTileColorBlocks, 'tile_color', 'Compress tile colors', 'tileColors');
  if (fontPatterns) await processBlocks(fontPatternBlocks, 'font_pattern', 'Compress font patterns', 'fontPatterns');
  if (fontColors)   await processBlocks(fontColorBlocks, 'font_color', 'Compress font colors', 'fontColors');

  if (spritePatterns && spriteGroups.length > 0) {
    for (let groupIndex = 0; groupIndex < spriteGroups.length; groupIndex++) {
      const group = spriteGroups[groupIndex];
      emitProgress(`Compress sprite frames ${groupIndex + 1}/${spriteGroups.length}`, 'spritePatterns');
      info.originalBytes += group.bytes.length;

      try {
        const compressed = await runZx0CompressionAsync(group.bytes, tempDir);
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
      completedProgressSteps += 1;
      emitProgress(`Compress sprite frames ${Math.min(groupIndex + 1, spriteGroups.length)}/${spriteGroups.length}`, 'spritePatterns');
    }
  }
  info.spritePatternBufferSymbol = selectedSpritePatternGroups.length > 0
    ? 'ZX0_SPRITE_FRAME_BUFFER'
    : null;

  const compressedBlockCount =
    selectedLayoutBlocks.size +
    selectedEffectsBlocks.size +
    selectedBehaviorBlocks.size +
    selectedTilePatternBlocks.size +
    selectedTileColorBlocks.size +
    selectedFontPatternBlocks.size +
    selectedFontColorBlocks.size +
    selectedSpritePatternGroups.length;
  const routineOverhead = (compressedBlockCount > 0 && !sourceHasZx0Routine) ? ZX0_ROUTINE_OVERHEAD_BYTES : 0;
  const runtimeOverhead = compressedBlockCount * ZX0_PER_BLOCK_RUNTIME_OVERHEAD_BYTES;
  info.netSavedBytes = info.savedBytes - routineOverhead - runtimeOverhead;

  const mustApplyPage0Compression = forcedPage0BlockCount > 0;
  const alreadyCompressedSource = alreadyCompressedBlockCount > 0;

  if (compressedBlockCount === 0) {
    if (alreadyCompressedSource) {
      info.applied = true;
      info.alreadyCompressed = true;
    }
    emitProgress('ZX0 compression finished', 'finalize', totalProgressSteps, totalProgressSteps);
    return { code: sourceCode, info };
  }

  if (!mustApplyPage0Compression && info.netSavedBytes <= 0) {
    emitProgress('ZX0 compression finished', 'finalize', totalProgressSteps, totalProgressSteps);
    return { code: sourceCode, info };
  }

  const replacementByStart = new Map();
  const allSelectedBlocks = [
    ...selectedLayoutBlocks.values(),
    ...selectedEffectsBlocks.values(),
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
  const compressedEffectsLabels = new Set(Array.from(selectedEffectsBlocks.keys()));
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
  let inShowPresentationScreen = false;
  let presentationCopyUsesRamBuffer = false;
  let fontBlobInitInjected = false;

  for (const line of rebuilt) {
    if (selectedSpritePatternGroups.length > 0 && /^\s*load_sprite_patterns(?:_[a-z0-9_]+)?:\s*$/i.test(line)) {
      inLoadSpritePatterns = true;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
      inShowPresentationScreen = false;
      patched.push(line);
      continue;
    }

    if (selectedSpritePatternGroups.length > 0 && /^\s*update_animation_component:\s*$/i.test(line)) {
      inLoadSpritePatterns = false;
      inUpdateAnimation = true;
      inActionChangeSprite = false;
      inSubmenuPrepareCursor = false;
      inShowPresentationScreen = false;
      patched.push(line);
      continue;
    }

    if (selectedSpritePatternGroups.length > 0 && /^\s*Action_ChangeSprite:\s*$/i.test(line)) {
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inActionChangeSprite = true;
      inSubmenuPrepareCursor = false;
      inShowPresentationScreen = false;
      patched.push(line);
      continue;
    }

    if (selectedSpritePatternGroups.length > 0 && /^\s*submenu_prepare_cursor_sprite:\s*$/i.test(line)) {
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inActionChangeSprite = false;
      inSubmenuPrepareCursor = true;
      inShowPresentationScreen = false;
      patched.push(line);
      continue;
    }

    if (/^\s*show_presentation_screen:\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadPattern = false;
      inLoadColor = false;
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inActionChangeSprite = false;
      inSubmenuPrepareCursor = false;
      inShowPresentationScreen = true;
      presentationCopyUsesRamBuffer = false;
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
          if (fontDataInPage0) {
            patched.push('    ld hl, FONT_PATTERN_DATA');
            patched.push(`    ld de, ${fontPatternBufferSymbol}`);
            patched.push('    call page0_decompress_to_ram');
          } else {
            patched.push('    di');
            patched.push('    ld hl, FONT_PATTERN_DATA');
            patched.push(`    ld de, ${fontPatternBufferSymbol}`);
            patched.push('    call dzx0_standard');
            patched.push('    ei');
          }
        }
        if (compressedFontColorLabels.size > 0) {
          patched.push('    ; Decompress ZX0 font color data into RAM buffer');
          if (fontDataInPage0) {
            patched.push('    ld hl, FONT_COLOR_DATA');
            patched.push(`    ld de, ${fontColorBufferSymbol}`);
            patched.push('    call page0_decompress_to_ram');
          } else {
            patched.push('    di');
            patched.push('    ld hl, FONT_COLOR_DATA');
            patched.push(`    ld de, ${fontColorBufferSymbol}`);
            patched.push('    call dzx0_standard');
            patched.push('    ei');
          }
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
      inShowPresentationScreen = false;
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
      inShowPresentationScreen = false;
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
      inShowPresentationScreen = false;
      layoutDecompressedInCurrentFunction = false;
      behaviorDecompressedInCurrentFunction = false;
      patternDecompressedInCurrentFunction = false;
      colorDecompressedInCurrentFunction = false;
      patched.push(line);
      continue;
    }

    const hlLayoutMatch = matchAsmLabelLoad(line, 'hl', 'SCREEN_[A-Z0-9_]+_\\d+_LAYOUT');
    if (inLoadScreen && hlLayoutMatch) {
      const layoutLabel = hlLayoutMatch.label.toUpperCase();
      const offset = hlLayoutMatch.offset;
        if (compressedLayoutLabels.has(layoutLabel)) {
          if (!layoutDecompressedInCurrentFunction) {
            patched.push('    ; Decompress ZX0 screen layout into RAM buffer');
            patched.push('    di');
            patched.push(`    ld hl, ${hlLayoutMatch.label}`);
            patched.push(`    ld de, ${screenBufferSymbol}`);
            patched.push('    call dzx0_standard');
            patched.push('    ei');
            layoutDecompressedInCurrentFunction = true;
          }
          patched.push(`    ld hl, ${screenBufferSymbol}${offset}`);
          continue;
        }
    }

    const hlBehaviorMatch = matchAsmLabelLoad(line, 'hl', 'BEHAVIOR_[A-Z0-9_]+_\\d+_DATA');
    if (inLoadScreen && hlBehaviorMatch) {
      const behaviorLabel = hlBehaviorMatch.label.toUpperCase();
      if (compressedBehaviorLabels.has(behaviorLabel)) {
        if (!behaviorDecompressedInCurrentFunction) {
          patched.push('    ; Decompress ZX0 behavior map into RAM buffer');
          patched.push('    di');
          patched.push(`    ld hl, ${hlBehaviorMatch.label}`);
          patched.push(`    ld de, ${behaviorBufferSymbol}`);
          patched.push('    call dzx0_standard');
          patched.push('    ei');
          behaviorDecompressedInCurrentFunction = true;
        }
        patched.push(`    ld hl, ${behaviorBufferSymbol}`);
        continue;
      }
    }

    const hlEffectsMatch = matchAsmLabelLoad(line, 'hl', 'SCREEN_[A-Z0-9_]+_\\d+_EFFECTS_LAYOUT');
    if (inLoadScreen && hlEffectsMatch) {
      const effectsLabel = hlEffectsMatch.label.toUpperCase();
      if (compressedEffectsLabels.has(effectsLabel)) {
        patched.push('    ; Decompress ZX0 effects layout directly into runtime_effects_layout');
        patched.push('    di');
        patched.push(`    ld hl, ${hlEffectsMatch.label}`);
        patched.push('    ld de, runtime_effects_layout');
        patched.push('    call dzx0_standard');
        patched.push('    ei');
        patched.push('    ld hl, runtime_effects_layout');
        continue;
      }
    }

    const hlTilePatternMatch = matchAsmLabelLoad(line, 'hl', '(?:tile_pattern_[a-z0-9_]+|tilebank_pattern_data_\\d+)');
    if (inLoadPattern && hlTilePatternMatch) {
      const patternLabel = hlTilePatternMatch.label.toUpperCase();
      const offset = hlTilePatternMatch.offset;
      if (compressedTilePatternLabels.has(patternLabel)) {
        if (!patternDecompressedInCurrentFunction) {
          patched.push('    ; Decompress ZX0 tile pattern data into RAM buffer');
          patched.push('    di');
          patched.push(`    ld hl, ${hlTilePatternMatch.label}`);
          patched.push(`    ld de, ${tilePatternBufferSymbol}`);
          patched.push('    call dzx0_standard');
          patched.push('    ei');
          patternDecompressedInCurrentFunction = true;
        }
        patched.push(`    ld hl, ${tilePatternBufferSymbol}${offset}`);
        continue;
      }
    }

    const hlTileColorMatch = matchAsmLabelLoad(line, 'hl', '(?:tile_color_[a-z0-9_]+|tilebank_color_data_\\d+)');
    if (inLoadColor && hlTileColorMatch) {
      const colorLabel = hlTileColorMatch.label.toUpperCase();
      const offset = hlTileColorMatch.offset;
      if (compressedTileColorLabels.has(colorLabel)) {
        if (!colorDecompressedInCurrentFunction) {
          patched.push('    ; Decompress ZX0 tile color data into RAM buffer');
          patched.push('    di');
          patched.push(`    ld hl, ${hlTileColorMatch.label}`);
          patched.push(`    ld de, ${tileColorBufferSymbol}`);
          patched.push('    call dzx0_standard');
          patched.push('    ei');
          colorDecompressedInCurrentFunction = true;
        }
        patched.push(`    ld hl, ${tileColorBufferSymbol}${offset}`);
        continue;
      }
    }

    const hlPresentationNameMatch = matchAsmLabelLoad(line, 'hl', 'PRESENTATION_SCREEN_NAMETBL');
    if (inShowPresentationScreen && !presentationDataInPage0 && hlPresentationNameMatch) {
      const label = hlPresentationNameMatch.label.toUpperCase();
      if (compressedLayoutLabels.has(label)) {
        patched.push('    ; Decompress ZX0 presentation name table into RAM buffer');
        patched.push(`    ld hl, ${hlPresentationNameMatch.label}`);
        patched.push(`    ld de, ${screenBufferSymbol}`);
        patched.push(`    call ${presentationDataInPage0 ? 'page0_decompress_to_ram' : 'dzx0_standard'}`);
        patched.push(`    ld hl, ${screenBufferSymbol}`);
        presentationCopyUsesRamBuffer = true;
        continue;
      }
    }

    const hlPresentationPatternMatch = matchAsmLabelLoad(line, 'hl', 'PRESENTATION_SCREEN_PATTERNS_B[0-2]');
    if (inShowPresentationScreen && !presentationDataInPage0 && hlPresentationPatternMatch) {
      const label = hlPresentationPatternMatch.label.toUpperCase();
      if (compressedTilePatternLabels.has(label)) {
        patched.push('    ; Decompress ZX0 presentation pattern bank into RAM buffer');
        patched.push(`    ld hl, ${hlPresentationPatternMatch.label}`);
        patched.push(`    ld de, ${tilePatternBufferSymbol}`);
        patched.push(`    call ${presentationDataInPage0 ? 'page0_decompress_to_ram' : 'dzx0_standard'}`);
        patched.push(`    ld hl, ${tilePatternBufferSymbol}`);
        presentationCopyUsesRamBuffer = true;
        continue;
      }
    }

    const hlPresentationColorMatch = matchAsmLabelLoad(line, 'hl', 'PRESENTATION_SCREEN_COLORS_B[0-2]');
    if (inShowPresentationScreen && !presentationDataInPage0 && hlPresentationColorMatch) {
      const label = hlPresentationColorMatch.label.toUpperCase();
      if (compressedTileColorLabels.has(label)) {
        patched.push('    ; Decompress ZX0 presentation color bank into RAM buffer');
        patched.push(`    ld hl, ${hlPresentationColorMatch.label}`);
        patched.push(`    ld de, ${tileColorBufferSymbol}`);
        patched.push(`    call ${presentationDataInPage0 ? 'page0_decompress_to_ram' : 'dzx0_standard'}`);
        patched.push(`    ld hl, ${tileColorBufferSymbol}`);
        presentationCopyUsesRamBuffer = true;
        continue;
      }
    }

    if (inShowPresentationScreen && !presentationDataInPage0 && presentationCopyUsesRamBuffer && /^\s*call\s+page0_copy_to_vram\s*(?:;.*)?$/i.test(line)) {
      patched.push('    call FAST_LDIRVM');
      presentationCopyUsesRamBuffer = false;
      continue;
    }

    if (compressedFontPatternLabels.size > 0 && matchAsmLabelLoad(line, 'iy', 'FONT_PATTERN_DATA')) {
      patched.push(`    ld iy, ${fontPatternBufferSymbol}`);
      continue;
    }

    if (compressedFontColorLabels.size > 0 && matchAsmLabelLoad(line, 'iy', 'FONT_COLOR_DATA')) {
      patched.push(`    ld iy, ${fontColorBufferSymbol}`);
      continue;
    }

    if ((inLoadScreen || inLoadPattern || inLoadColor || inLoadSpritePatterns || inUpdateAnimation || inActionChangeSprite || inShowPresentationScreen) && /^\s*ret\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadPattern = false;
      inLoadColor = false;
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inActionChangeSprite = false;
      inShowPresentationScreen = false;
      presentationCopyUsesRamBuffer = false;
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
  if (/;\s*DATA BANKS .+Zone-packed data/i.test(finalCode)) {
    finalCode = repackMegaromZonedDataSection(finalCode);
  }
  const extraEquBlocks = [];
  const maxLayoutSize = selectedLayoutBlocks.size > 0
    ? Math.max(...Array.from(selectedLayoutBlocks.values()).map(b => b.bytes.length))
    : 0;
  const maxEffectsSize = selectedEffectsBlocks.size > 0
    ? Math.max(...Array.from(selectedEffectsBlocks.values()).map(b => b.bytes.length))
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
  if (selectedEffectsBlocks.size > 0 && maxEffectsSize <= 0) {
    throw new Error('Effects ZX0 compression selected but no effects block size was resolved');
  }
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

  // Detect megarom: ZX0 blobs + helpers must land in banks 0-3 (before ds #C000 - $)
  const isMegarom = /^\s*;\s*ROM Mode:\s*megarom\b/im.test(finalCode);
  // For megarom and plain48k: inject code before ds #C000 - $ to stay in addressable window
  const injectBeforePad = isMegarom || /^\s*;\s*Linear48K Page0 Data:\s*(Yes|No)\b/im.test(finalCode);

  function injectCodeBeforeEnd(block) {
    if (injectBeforePad) {
      const padMatch = finalCode.match(/^\s*ds\s+#C000\s*-\s*[$][^\n]*/im);
      if (padMatch) {
        // Re-use the existing pad line so comments are preserved
        finalCode = finalCode.replace(/^\s*ds\s+#C000\s*-\s*[$][^\n]*/im, `${block}\n${padMatch[0]}`);
        return;
      }
    }
    if (/^\s*end\b.*$/im.test(finalCode)) {
      finalCode = finalCode.replace(/^\s*end\b.*$/im, `${block}\n$&`);
    } else {
      finalCode = `${finalCode}${block}`;
    }
  }

  if (extraDataBlocks.length > 0) {
    const dataBlock = `\n${extraDataBlocks.join('\n')}\n`;
    injectCodeBeforeEnd(dataBlock);
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

    injectCodeBeforeEnd(spriteCopyHelperBlock);
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

    injectCodeBeforeEnd(zx0Block);
  }

  // Keep the fixed-size 48KB pad as the last data reservation in plain48k builds.
  // ZX0 injection appends helpers and routines near the end of the file; if the
  // original `ds #C000 - $` remains before those blocks, the final ROM grows past
  // 48KB even though the source intended a fixed linear image.
  if (/^\s*;\s*Linear48K Page0 Data:\s*(Yes|No)\b/im.test(finalCode)) {
    const plain48PadRegex = /^\s*ds\s+#C000\s*-\s*\$\s*(?:;.*)?$/im;
    const padMatch = finalCode.match(plain48PadRegex);
    if (padMatch) {
      const padLine = padMatch[0];
      finalCode = finalCode.replace(plain48PadRegex, '').replace(/\n{3,}/g, '\n\n');
      if (/^\s*end\b.*$/im.test(finalCode)) {
        finalCode = finalCode.replace(/^\s*end\b.*$/im, `${padLine}\n\n$&`);
      } else {
        finalCode = `${finalCode}\n${padLine}\n`;
      }
    }
  }

  info.applied = true;
  info.alreadyCompressed = alreadyCompressedSource;
  emitProgress('ZX0 compression finished', 'finalize', totalProgressSteps, totalProgressSteps);
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
app.post('/compile', async (req, res) => {
  const { code, generateSymbols, projectName, screenCompression, romMode, targetFormat, autoMegaROM, romSizeKB } = req.body;

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
    candidateEffects: 0,
    candidateBehaviorMaps: 0,
    candidateTilePatterns: 0,
    candidateTileColors: 0,
    candidateFontPatterns: 0,
    candidateFontColors: 0,
    candidateSpritePatterns: 0,
    compressedScreens: 0,
    compressedEffects: 0,
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
    effectsBufferSymbol: 'runtime_effects_layout',
    behaviorBufferSymbol: null,
    tilePatternBufferSymbol: null,
    tileColorBufferSymbol: null,
    fontPatternBufferSymbol: null,
    fontColorBufferSymbol: null,
    spritePatternBufferSymbol: null
  };

  try {
    if (screenCompression !== false) {
      const preprocessed = await injectZx0IntoUnifiedAsm(code, tempDir);
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
    const includeServerPath = __dirname;
    // Add symbol file path if generateSymbols is true
    const command = symbolFilePath
      ? `java -jar "${jarPath}" -I "${includeServerPath}" "${tempFilePath}" "${outputFilePath}" "${symbolFilePath}"`
      : `java -jar "${jarPath}" -I "${includeServerPath}" "${tempFilePath}" "${outputFilePath}"`;

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

        // plain48k mode: may override targetSize to 48KB if layout is present
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

        // Explicit romSizeKB override has highest priority (runs after plain48k auto-logic)
        const VALID_ROM_SIZES_KB = [32, 48, 64, 128, 256];
        const requestedRomSizeKB = typeof romSizeKB === 'number' && VALID_ROM_SIZES_KB.includes(romSizeKB)
          ? romSizeKB
          : null;
        if (requestedRomSizeKB !== null) {
          const requestedBytes = requestedRomSizeKB * 1024;
          if (originalSize > requestedBytes) {
            console.warn(`Requested ROM size ${requestedRomSizeKB}KB is smaller than compiled output (${originalSize} bytes). Ignoring size override.`);
          } else {
            targetSize = requestedBytes;
            paddingPolicy = `forced ${requestedRomSizeKB}KB`;
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
            requestedRomSizeKB: requestedRomSizeKB,
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

  const buildCompressionResponse = (preprocessed) => {
    const info = preprocessed.info;

    if (!info.attempted) {
      return {
        success: true,
        applied: false,
        message: 'Input is not a recognized unitedFiles.asm export',
        compressionInfo: info
      };
    }

    if (!info.applied) {
      return {
        success: true,
        applied: false,
        message: 'Compression skipped (no net gain)',
        compressionInfo: info
      };
    }

    fs.writeFileSync(compressedAsmOutputPath, preprocessed.code, 'utf8');
    fs.writeFileSync(unifiedCompressedAsmOutputPath, preprocessed.code, 'utf8');

    const compressedAsmFileName = path.basename(compressedAsmOutputPath);
    const unifiedCompressedAsmFileName = path.basename(unifiedCompressedAsmOutputPath);

    return {
      success: true,
      applied: true,
      message: info.alreadyCompressed
        ? 'Unified ASM already contains ZX0-compressed data'
        : 'Unified ASM compressed with ZX0 successfully',
      compressedCode: preprocessed.code,
      compressionInfo: info,
      compressedAsmFile: compressedAsmFileName,
      compressedAsmPath: compressedAsmOutputPath,
      compressedAsmDownloadUrl: `/download/${compressedAsmFileName}`,
      unitedCompressedAsmFile: unifiedCompressedAsmFileName,
      unitedCompressedAsmPath: unifiedCompressedAsmOutputPath,
      unitedCompressedAsmDownloadUrl: `/download/${unifiedCompressedAsmFileName}`
    };
  };

  try {
    injectZx0IntoUnifiedAsm(code, tempDir, zx0Options || {})
      .then((preprocessed) => {
        res.json(buildCompressionResponse(preprocessed));
      })
      .catch((error) => {
        res.status(500).json({
          success: false,
          error: 'Failed to compress unified ASM',
          details: error.message
        });
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to compress unified ASM',
      details: error.message
    });
  }
});

app.post('/compress-unified-asm-job', (req, res) => {
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
  const jobId = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

  const buildCompressionResponse = (preprocessed) => {
    const info = preprocessed.info;

    if (!info.attempted) {
      return {
        success: true,
        applied: false,
        message: 'Input is not a recognized unitedFiles.asm export',
        compressionInfo: info
      };
    }

    if (!info.applied) {
      return {
        success: true,
        applied: false,
        message: 'Compression skipped (no net gain)',
        compressionInfo: info
      };
    }

    fs.writeFileSync(compressedAsmOutputPath, preprocessed.code, 'utf8');
    fs.writeFileSync(unifiedCompressedAsmOutputPath, preprocessed.code, 'utf8');

    const compressedAsmFileName = path.basename(compressedAsmOutputPath);
    const unifiedCompressedAsmFileName = path.basename(unifiedCompressedAsmOutputPath);

    return {
      success: true,
      applied: true,
      message: info.alreadyCompressed
        ? 'Unified ASM already contains ZX0-compressed data'
        : 'Unified ASM compressed with ZX0 successfully',
      compressedCode: preprocessed.code,
      compressionInfo: info,
      compressedAsmFile: compressedAsmFileName,
      compressedAsmPath: compressedAsmOutputPath,
      compressedAsmDownloadUrl: `/download/${compressedAsmFileName}`,
      unitedCompressedAsmFile: unifiedCompressedAsmFileName,
      unitedCompressedAsmPath: unifiedCompressedAsmOutputPath,
      unitedCompressedAsmDownloadUrl: `/download/${unifiedCompressedAsmFileName}`
    };
  };

  zx0CompressionJobs.set(jobId, {
    status: 'queued',
    progress: {
      message: 'Preparing ZX0 compression...',
      phase: 'prepare',
      current: 0,
      total: 1
    },
    result: null,
    error: null,
    createdAt: Date.now()
  });

  res.json({
    success: true,
    jobId
  });

  (async () => {
    try {
      const job = zx0CompressionJobs.get(jobId);
      if (job) {
        job.status = 'running';
      }

      const preprocessed = await injectZx0IntoUnifiedAsm(code, tempDir, zx0Options || {}, (progress) => {
        const currentJob = zx0CompressionJobs.get(jobId);
        if (!currentJob) return;
        currentJob.progress = progress;
      });

      const responseData = buildCompressionResponse(preprocessed);
      const currentJob = zx0CompressionJobs.get(jobId);
      if (currentJob) {
        currentJob.status = 'completed';
        currentJob.result = responseData;
        currentJob.progress = {
          message: 'ZX0 compression finished',
          phase: 'finalize',
          current: currentJob.progress?.total || 1,
          total: currentJob.progress?.total || 1
        };
      }
    } catch (error) {
      const currentJob = zx0CompressionJobs.get(jobId);
      if (currentJob) {
        currentJob.status = 'failed';
        currentJob.error = error.message || String(error);
      }
    }
  })();
});

app.get('/compress-unified-asm-job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = zx0CompressionJobs.get(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Compression job not found'
    });
  }

  return res.json({
    success: true,
    job
  });
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
  const { romFile, romType } = req.body;

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
  const romTypeArg = typeof romType === 'string' && romType.trim()
    ? ` "${romType.trim()}"`
    : '';
  const command = `"${runScript}" "${romPath}"${romTypeArg}`;

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
      romType: typeof romType === 'string' && romType.trim() ? romType.trim() : null,
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
  const { romFile, waitSeconds = 10, romType } = req.body;

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
  const romTypeArg = typeof romType === 'string' && romType.trim()
    ? ` "${romType.trim()}"`
    : '';
  const command = `"${screenshotScript}" "${romPath}" ${waitSeconds}${romTypeArg}`;

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

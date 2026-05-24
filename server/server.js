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
const POST_ASM_ANALYSIS_RULES = ['dead-blocks', 'unused-runtime-labels', 'inactive-feature-runtime', 'unused-screen-loaders', 'unused-boss-attack-runtime', 'unused-component-runtime', 'state-machine-dispatch-handlers'];
const POST_ASM_APPLY_RULES = new Set(['dead-blocks', 'unused-screen-loaders', 'inactive-feature-runtime', 'unused-boss-attack-runtime', 'unused-component-runtime', 'state-machine-dispatch-handlers']);
const POST_ASM_ALLOWED_RULES = new Set([
  'active-list-redundant-screen-check',
  'active-list-redundant-active-check',
  'hud-double-work',
  'deadly-recompute-in-tile-interaction',
  ...POST_ASM_ANALYSIS_RULES,
  'unused-screen-loaders',
]);

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

function countAsmDataBytesInLine(line) {
  const noComment = String(line || '').split(';')[0];
  const dbMatch = noComment.match(/^\s*db\s+(.+)$/i);
  if (dbMatch) {
    const parsed = parseDbLineBytes(line);
    return parsed ? parsed.length : 0;
  }

  const dwMatch = noComment.match(/^\s*dw\s+(.+)$/i);
  if (dwMatch) {
    const operands = dwMatch[1]
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);
    return operands.length * 2;
  }

  return 0;
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

function sanitizePostAsmProjectName(projectName) {
  const raw = String(projectName || 'source').trim().toLowerCase();
  return raw.replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'source';
}

function normalizePostAsmRuleIds(rules) {
  const rawRules = Array.isArray(rules)
    ? rules
    : typeof rules === 'string'
      ? rules.split(',')
      : POST_ASM_ANALYSIS_RULES;

  const normalized = rawRules
    .map((rule) => String(rule || '').trim())
    .filter(Boolean);

  if (!normalized.length) {
    return [...POST_ASM_ANALYSIS_RULES];
  }

  const unknown = normalized.filter((rule) => !POST_ASM_ALLOWED_RULES.has(rule));
  if (unknown.length) {
    throw new Error(`Unknown post-ASM rule id(s): ${unknown.join(', ')}`);
  }

  return [...new Set(normalized)];
}

function buildPostAsmAnalysisSummary(report, rules) {
  const metrics = report?.metrics || {};
  const blockInventory = metrics.block_inventory || {};
  const byRule = metrics.by_rule || {};
  const optimizationSummary = metrics.optimization_summary || {};
  const selectedRules = Array.isArray(metrics.selected_rules) ? metrics.selected_rules : rules;
  const ruleMetrics = Object.fromEntries(
    Object.entries(byRule).map(([ruleId, item]) => [
      ruleId,
      {
        findings: Number(item?.findings || 0),
        patchable: Number(item?.patchable || 0),
        removedLines: Number(item?.removed_lines || 0),
        removedSourceBytes: Number(item?.removed_source_bytes || 0),
      },
    ])
  );

  return {
    mode: 'analysis-only',
    rules,
    selectedRules,
    findings: Array.isArray(report?.findings) ? report.findings.length : 0,
    appliedPatches: Number(metrics.applied_patches || report?.applied_patches || 0),
    originalLineCount: Number(metrics.original_line_count || 0),
    outputLineCount: Number(metrics.output_line_count || 0),
    blockCount: Array.isArray(report?.blocks) ? report.blocks.length : 0,
    deadBlockCandidates: Number(blockInventory.dead_block_candidates || 0),
    deadCandidateLines: Number(blockInventory.dead_candidate_lines || 0),
    deadCandidateSourceBytes: Number(blockInventory.dead_candidate_source_bytes || 0),
    unusedRuntimeLabels: Number(byRule['unused-runtime-labels']?.findings || 0),
    inactiveFeatureRuntime: Number(byRule['inactive-feature-runtime']?.findings || 0),
    unusedScreenLoaders: Number(byRule['unused-screen-loaders']?.findings || 0),
    unusedBossAttackRuntime: Number(byRule['unused-boss-attack-runtime']?.findings || 0),
    unusedComponentRuntime: Number(byRule['unused-component-runtime']?.findings || 0),
    stateMachineDispatchHandlers: Number(byRule['state-machine-dispatch-handlers']?.findings || 0),
    removedLines: Number(optimizationSummary.removed_lines || 0),
    removedSourceBytes: Number(optimizationSummary.removed_source_bytes || 0),
    ruleMetrics,
  };
}

async function analyzePostAsmCode(code, options = {}) {
  if (typeof code !== 'string' || !code.trim()) {
    throw new Error('No ASM code provided');
  }

  const rules = normalizePostAsmRuleIds(options.rules);
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const projectRoot = path.join(__dirname, '..');
  const stamp = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const baseName = `${sanitizePostAsmProjectName(options.projectName)}_${stamp}`;
  const inputPath = path.join(tempDir, `${baseName}.post_asm_input.asm`);
  const reportJsonPath = path.join(tempDir, `${baseName}.post_asm_report.json`);
  const reportMdPath = path.join(tempDir, `${baseName}.post_asm_report.md`);
  const optimizerScript = path.join(projectRoot, 'scripts', 'post_asm_optimize.py');
  const pythonExe = process.env.PYTHON || 'python';

  fs.writeFileSync(inputPath, code, 'utf8');

  const args = [
    optimizerScript,
    '--input', inputPath,
    '--rules', rules.join(','),
    '--report-json', reportJsonPath,
    '--report-md', reportMdPath,
  ];

  const { stdout, stderr } = await execFileAsync(pythonExe, args, {
    cwd: projectRoot,
    maxBuffer: 32 * 1024 * 1024,
  });

  const report = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));
  const summary = buildPostAsmAnalysisSummary(report, rules);

  return {
    rules,
    inputPath,
    reportJsonPath,
    reportMdPath,
    report,
    summary,
    stdout,
    stderr,
  };
}

function normalizePostAsmPasses(passes) {
  const value = Number.parseInt(String(passes ?? 3), 10);
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }
  return Math.min(value, 7);
}

function collectGlobalAsmLabels(sourceCode) {
  const labels = new Set();
  for (const line of String(sourceCode || '').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_.$][A-Za-z0-9_.$]*):\s*(?:;.*)?$/);
    if (!match) continue;
    const label = match[1];
    if (label.startsWith('.')) continue;
    labels.add(label);
  }
  return labels;
}

function collectPatchRemovedGlobalLabels(sourceCode, report) {
  const labels = new Set();
  const lines = String(sourceCode || '').split(/\r?\n/);
  const findings = Array.isArray(report?.findings) ? report.findings : [];
  for (const finding of findings) {
    const patch = finding?.patch;
    if (!patch || !Number.isInteger(patch.start_index) || !Number.isInteger(patch.end_index)) continue;
    const start = Math.max(0, patch.start_index);
    const end = Math.min(lines.length, patch.end_index);
    for (let index = start; index < end; index += 1) {
      const match = lines[index].match(/^\s*([A-Za-z_.$][A-Za-z0-9_.$]*):\s*(?:;.*)?$/);
      if (!match || match[1].startsWith('.')) continue;
      labels.add(match[1]);
    }
  }
  return labels;
}

function collectReportedRemovedLabels(report) {
  const labels = new Set();
  const addLabels = (items) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (typeof item === 'string' && item && !item.startsWith('.')) {
        labels.add(item);
      }
    }
  };

  addLabels(report?.metrics?.removed_labels);
  addLabels(report?.metrics?.optimization_summary?.removed_labels);
  if (Array.isArray(report?.metrics?.optimization_passes)) {
    for (const passInfo of report.metrics.optimization_passes) {
      addLabels(passInfo?.removed_labels);
    }
  }
  return labels;
}

function extractPostAsmEntryTarget(sourceCode) {
  const lines = String(sourceCode || '').split(/\r?\n/);
  for (let index = 0; index < Math.min(lines.length, 80); index += 1) {
    const line = lines[index];
    if (!/^\s*dw\s+/i.test(line)) continue;
    const noComment = line.split(';')[0];
    const operands = noComment
      .replace(/^\s*dw\s+/i, '')
      .split(',')
      .map((operand) => operand.trim())
      .filter(Boolean);
    const target = operands.find((operand) => /^[A-Za-z_.$][A-Za-z0-9_.$]*$/.test(operand));
    if (target) return target;
  }
  return null;
}

function collectPostAsmRequiredLabels(sourceCode, report) {
  const labels = new Set();
  const allLabels = collectGlobalAsmLabels(sourceCode);
  const patchRemovedLabels = collectPatchRemovedGlobalLabels(sourceCode, report);
  for (const label of collectReportedRemovedLabels(report)) {
    patchRemovedLabels.add(label);
  }
  const candidateBlocks = new Set(
    Array.isArray(report?.block_analysis)
      ? report.block_analysis
          .filter((analysis) => analysis && analysis.candidate === true)
          .map((analysis) => String(analysis.block_id || ''))
      : []
  );
  const candidateLabels = new Set();
  if (Array.isArray(report?.blocks)) {
    for (const block of report.blocks) {
      if (!block || !candidateBlocks.has(String(block.id || ''))) continue;
      const blockLabels = Array.isArray(block.labels) ? block.labels : [];
      for (const label of blockLabels) {
        if (label && !String(label).startsWith('.')) {
          candidateLabels.add(String(label));
        }
      }
    }
  }
  const criticalPatterns = [
    /^INIT/i,
    /^MAIN_GAME_START$/i,
    /^START$/i,
    /^BOOT/i,
    /^RESOURCE_TABLE$/i,
    /^RESOURCE_IDS/i,
    /^MAPPER/i,
    /^SET_.*BANK/i,
    /^SWITCH_.*BANK/i,
    /^ISR/i,
    /^INTERRUPT/i,
  ];

  for (const label of allLabels) {
    if (
      !candidateLabels.has(label) &&
      !patchRemovedLabels.has(label) &&
      criticalPatterns.some((pattern) => pattern.test(label))
    ) {
      labels.add(label);
    }
  }

  const entryTarget = extractPostAsmEntryTarget(sourceCode);
  if (entryTarget && !patchRemovedLabels.has(entryTarget)) {
    labels.add(entryTarget);
  }

  if (Array.isArray(report?.blocks)) {
    for (const block of report.blocks) {
      if (!block || candidateBlocks.has(String(block.id || ''))) continue;
      const blockLabels = Array.isArray(block.labels) ? block.labels : [];
      for (const label of blockLabels) {
        if (label && !String(label).startsWith('.') && !patchRemovedLabels.has(String(label))) {
          labels.add(String(label));
        }
      }
    }
  }

  return [...labels].sort((left, right) => left.localeCompare(right));
}

function comparePostAsmConfigInvariant(originalCode, optimizedCode) {
  const originalConfig = parseSourceRomConfig(originalCode);
  const optimizedConfig = parseSourceRomConfig(optimizedCode);
  if (!originalConfig && !optimizedConfig) return null;
  const normalize = (config) => ({
    romMode: config?.romMode || null,
    targetFormat: config?.targetFormat || null,
    autoMegaROM: config?.autoMegaROM ?? null,
  });
  const left = normalize(originalConfig);
  const right = normalize(optimizedConfig);
  if (JSON.stringify(left) === JSON.stringify(right)) return null;
  return {
    id: 'rom-config',
    message: `ROM config changed during post-ASM optimization: original=${JSON.stringify(left)}, optimized=${JSON.stringify(right)}`,
  };
}

function comparePostAsmResourceInvariant(originalCode, optimizedCode) {
  const labelsToKeep = [
    'resource_table',
    'resource_ids',
    'resource_bank_table',
    'resource_address_table',
    'resource_size_table',
  ];
  const originalLabels = collectGlobalAsmLabels(originalCode);
  const optimizedLabels = collectGlobalAsmLabels(optimizedCode);
  const missing = labelsToKeep.filter((label) => originalLabels.has(label) && !optimizedLabels.has(label));
  if (!missing.length) return null;
  return {
    id: 'resource-labels',
    message: `Resource table labels disappeared during post-ASM optimization: ${missing.join(', ')}`,
  };
}

function normalizePostAsmFingerprintLine(line) {
  return String(line || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function extractGlobalAsmLabel(line) {
  const match = String(line || '').match(/^\s*([A-Za-z_.$][A-Za-z0-9_.$]*):\s*(?:;.*)?$/);
  if (!match || match[1].startsWith('.')) return null;
  return match[1];
}

function collectPostAsmLabelBlockFingerprint(sourceCode, targetLabel) {
  const lines = String(sourceCode || '').split(/\r?\n/);
  const target = String(targetLabel || '').toLowerCase();
  let startIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const label = extractGlobalAsmLabel(lines[index]);
    if (label && label.toLowerCase() === target) {
      startIndex = index;
      break;
    }
  }
  if (startIndex < 0) return null;

  const blockLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    if (index > startIndex && extractGlobalAsmLabel(lines[index])) {
      break;
    }
    blockLines.push(lines[index]);
  }

  const normalizedLines = blockLines
    .map((line) => normalizePostAsmFingerprintLine(line))
    .filter(Boolean);
  const dataByteCount = blockLines.reduce((total, line) => total + countAsmDataBytesInLine(line), 0);
  return {
    label: targetLabel,
    lineCount: normalizedLines.length,
    dataByteCount,
    checksum: buildBankMetadataChecksum(normalizedLines),
  };
}

function collectPostAsmResourceMetadataFingerprint(sourceCode) {
  const labelsToFingerprint = [
    'resource_table',
    'resource_ids',
    'resource_bank_table',
    'resource_address_table',
    'resource_size_table',
  ];
  const labels = {};
  for (const label of labelsToFingerprint) {
    const fingerprint = collectPostAsmLabelBlockFingerprint(sourceCode, label);
    if (fingerprint) {
      labels[label] = fingerprint;
    }
  }
  return { labels };
}

function comparePostAsmResourceMetadataInvariant(originalCode, optimizedCode) {
  const original = collectPostAsmResourceMetadataFingerprint(originalCode);
  const optimized = collectPostAsmResourceMetadataFingerprint(optimizedCode);
  const changes = [];
  for (const [label, originalFingerprint] of Object.entries(original.labels)) {
    const optimizedFingerprint = optimized.labels[label];
    if (!optimizedFingerprint) {
      changes.push({ label, reason: 'missing' });
      continue;
    }
    if (
      originalFingerprint.checksum !== optimizedFingerprint.checksum ||
      originalFingerprint.lineCount !== optimizedFingerprint.lineCount ||
      originalFingerprint.dataByteCount !== optimizedFingerprint.dataByteCount
    ) {
      changes.push({
        label,
        reason: 'changed',
        original: originalFingerprint,
        optimized: optimizedFingerprint,
      });
    }
  }

  return {
    original,
    optimized,
    error: changes.length
      ? {
          id: 'resource-metadata',
          message: `Resource table metadata changed during post-ASM optimization: ${changes.map((change) => change.label).join(', ')}`,
          changes,
        }
      : null,
  };
}

function comparePostAsmInvariants(originalCode, optimizedCode, report) {
  const errors = [];
  const warnings = [];
  const requiredLabels = collectPostAsmRequiredLabels(originalCode, report);
  const optimizedLabels = collectGlobalAsmLabels(optimizedCode);
  const missingLabels = requiredLabels.filter((label) => !optimizedLabels.has(label));
  if (missingLabels.length) {
    errors.push({
      id: 'required-labels',
      message: `Required labels disappeared during post-ASM optimization: ${missingLabels.slice(0, 20).join(', ')}${missingLabels.length > 20 ? ` (+${missingLabels.length - 20} more)` : ''}`,
      missingLabels,
    });
  }

  const configError = comparePostAsmConfigInvariant(originalCode, optimizedCode);
  if (configError) errors.push(configError);

  const resourceError = comparePostAsmResourceInvariant(originalCode, optimizedCode);
  if (resourceError) errors.push(resourceError);

  const resourceMetadata = comparePostAsmResourceMetadataInvariant(originalCode, optimizedCode);
  if (resourceMetadata.error) errors.push(resourceMetadata.error);

  const originalEntry = extractPostAsmEntryTarget(originalCode);
  const optimizedEntry = extractPostAsmEntryTarget(optimizedCode);
  if (originalEntry && optimizedEntry && originalEntry !== optimizedEntry) {
    errors.push({
      id: 'rom-entry',
      message: `ROM entry target changed during post-ASM optimization: ${originalEntry} -> ${optimizedEntry}`,
    });
  } else if (originalEntry && !optimizedEntry) {
    errors.push({
      id: 'rom-entry',
      message: `ROM entry target disappeared during post-ASM optimization: ${originalEntry}`,
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    requiredLabels,
    originalEntry,
    optimizedEntry,
    resourceMetadata: {
      original: resourceMetadata.original,
      optimized: resourceMetadata.optimized,
    },
  };
}

async function optimizePostAsmCode(code, options = {}) {
  if (typeof code !== 'string' || !code.trim()) {
    throw new Error('No ASM code provided');
  }

  const rules = normalizePostAsmRuleIds(options.rules || ['dead-blocks']);
  const unsafeApplyRules = rules.filter((rule) => !POST_ASM_APPLY_RULES.has(rule));
  if (unsafeApplyRules.length) {
    throw new Error(`Post-ASM apply is not enabled for rule id(s): ${unsafeApplyRules.join(', ')}`);
  }
  const passes = normalizePostAsmPasses(options.passes);
  const validateGlass = options.validateGlass !== false;
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const projectRoot = path.join(__dirname, '..');
  const stamp = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const baseName = `${sanitizePostAsmProjectName(options.projectName)}_${stamp}`;
  const inputPath = path.join(tempDir, `${baseName}.post_asm_input.asm`);
  const outputPath = path.join(tempDir, `${baseName}.optimized.asm`);
  const optimizedRomPath = path.join(tempDir, `${baseName}.optimized.rom`);
  const reportJsonPath = path.join(tempDir, `${baseName}.optimized.post_asm_report.json`);
  const reportMdPath = path.join(tempDir, `${baseName}.optimized.post_asm_report.md`);
  const optimizerScript = path.join(projectRoot, 'scripts', 'post_asm_optimize.py');
  const glassJarPath = path.join(__dirname, 'glass.jar');
  const pythonExe = process.env.PYTHON || 'python';

  fs.writeFileSync(inputPath, code, 'utf8');

  const args = [
    optimizerScript,
    '--input', inputPath,
    '--rules', rules.join(','),
    '--passes', String(passes),
    '--apply',
    '--output', outputPath,
    '--report-json', reportJsonPath,
    '--report-md', reportMdPath,
  ];

  if (validateGlass) {
    args.push('--validate-glass', glassJarPath, '--validate-rom-output', optimizedRomPath);
  }

  const { stdout, stderr } = await execFileAsync(pythonExe, args, {
    cwd: projectRoot,
    maxBuffer: 32 * 1024 * 1024,
  });

  const report = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));
  const optimizedCode = fs.readFileSync(outputPath, 'utf8');
  const invariantCheck = comparePostAsmInvariants(code, optimizedCode, report);
  if (!invariantCheck.ok) {
    const details = invariantCheck.errors.map((error) => error.message).join(' ');
    const invariantError = new Error(`Post-ASM invariant validation failed. ${details}`);
    invariantError.invariantCheck = invariantCheck;
    invariantError.outputPath = outputPath;
    invariantError.reportJsonPath = reportJsonPath;
    invariantError.reportMdPath = reportMdPath;
    throw invariantError;
  }
  const summary = {
    ...buildPostAsmAnalysisSummary(report, rules),
    mode: validateGlass ? 'apply-validated' : 'apply-unvalidated',
    passes,
    validateGlass,
    optimizedLineCount: optimizedCode.split(/\r?\n/).filter((_, index, lines) => index < lines.length - 1 || lines[index] !== '').length,
    invariantCheck,
  };

  return {
    rules,
    passes,
    validateGlass,
    inputPath,
    outputPath,
    optimizedRomPath: fs.existsSync(optimizedRomPath) ? optimizedRomPath : null,
    reportJsonPath,
    reportMdPath,
    optimizedCode,
    report,
    invariantCheck,
    summary,
    stdout,
    stderr,
  };
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

function sourceHasMsx2Screen4KonamiFixedBank0Compat(sourceCode) {
  const text = String(sourceCode || '');
  return (
    /^\s*;\s*Mideas MSX2 SCREEN 4 tile backend\s*$/im.test(text) &&
    /^\s*;\s*ROM Mode:\s*megarom\s*$/im.test(text) &&
    /^\s*;\s*Mapper Target:\s*konami\s*$/im.test(text) &&
    /^\s*init_konami8k_fixed_bank0_banks:\s*$/im.test(text)
  );
}

function findScatteredMapperRegisterWrites(sourceCode) {
  const activeLines = String(sourceCode || '')
    .split(/\r?\n/)
    .map((line) => line.split(';')[0]);
  const allowedLabels = new Set([
    'mapper_set_bank_p1',
    'mapper_set_bank_p2',
    'mapper_set_bank_p3',
    'mapper_set_bank_p4'
  ]);
  const mapperWritePattern = /\bld\s+\(\s*(?:MAPPER_REG_P[1-4]|#(?:6000|8000|A000))\s*\)\s*,\s*a\b/i;
  const findings = [];
  let currentLabel = '';
  activeLines.forEach((line, index) => {
    const labelMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*):\s*$/);
    if (labelMatch) {
      currentLabel = labelMatch[1];
      return;
    }
    if (allowedLabels.has(currentLabel)) return;
    const stripped = line.trim();
    if (!stripped) return;
    if (mapperWritePattern.test(stripped)) {
      findings.push(`line ${index + 1}: ${stripped}`);
    }
  });
  return findings;
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

function isGlassRomCapacityError(text) {
  const value = String(text || '').toLowerCase();
  return (
    value.includes('negative initial size') ||
    value.includes('out of range') ||
    value.includes('overflow') && value.includes('rom')
  );
}

function getNegativeDsOverflowBytes(text) {
  const match = String(text || '').match(/Negative initial size:\s*(-?\d+)/i);
  if (!match) return null;

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed) || parsed >= 0) return null;

  return Math.abs(parsed);
}

function buildMsx2ResidentOverflowFailure(sourceCode, fullErrorText, sourceFile) {
  const overflowBytes = getNegativeDsOverflowBytes(fullErrorText);
  if (overflowBytes === null) return null;
  const text = String(sourceCode || '');
  if (
    !text.includes('Mideas MSX2 SCREEN 4 tile backend') ||
    !text.includes('MSX2 SCREEN 4 cold data bank') ||
    !/ds\s+#C000\s*-\s*\$/i.test(text)
  ) {
    return null;
  }
  return {
    scope: 'msx2_screen4_megarom_compile_failure',
    status: 'error',
    reason: `Resident SCREEN 4 code/data crossed #C000 by ${overflowBytes} bytes before the cold data bank.`,
    sourceFile,
    overflowBytes,
    pipelineGates: [
      {
        id: 'glass_compile',
        status: 'failed',
        evidence: [sourceFile].filter(Boolean)
      }
    ],
    planB: {
      primary: 'Move cold read-only tables to world/data banks or special-code banks.',
      secondary: 'Remove unused resident fallback data and replace repeated resident tables with VRAM fill/streaming.',
      avoid: 'Do not solve resident ROM pressure by copying whole worlds into RAM.'
    }
  };
}

function parsePlain48kPage0Diagnostics(sourceCode) {
  const text = String(sourceCode || '');
  if (!/^\s*;\s*ROM Mode:\s*plain48k\s*$/im.test(text)) {
    return null;
  }

  const parseNumberComment = (label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp(`^\\s*;\\s*${escaped}:\\s*(\\d+)\\s*bytes\\s*$`, 'im'));
    return match ? Number.parseInt(match[1], 10) : null;
  };

  const linearPage0Data = text.match(/^\s*;\s*Linear48K Page0 Data:\s*(Yes|No)\b/im)?.[1] || null;
  const selectedGroups = [];
  const skippedGroups = [];
  let currentList = null;

  for (const line of text.split(/\r?\n/)) {
    if (/^\s*;\s*Selected groups:\s*$/i.test(line)) {
      currentList = selectedGroups;
      continue;
    }
    if (/^\s*;\s*Selected groups:\s*none\s*$/i.test(line)) {
      currentList = null;
      continue;
    }
    if (/^\s*;\s*Skipped groups:\s*$/i.test(line)) {
      currentList = skippedGroups;
      continue;
    }
    const groupMatch = line.match(/^\s*;\s*-\s*(.+?):\s*(\d+)\s*bytes\s*\[([^\]]+)\]\s*(.*)$/);
    if (groupMatch && currentList) {
      currentList.push({
        label: groupMatch[1].trim(),
        sizeBytes: Number.parseInt(groupMatch[2], 10),
        mode: groupMatch[3].trim(),
        reason: groupMatch[4].trim()
      });
      continue;
    }
    if (/^\s*;\s*(?:Group:|[-=]{3,}|CRITICAL:|BIOS|CONSTANTS|VARIABLES|SPRITE|SCREEN|COMPONENT)/i.test(line)) {
      currentList = null;
    }
  }

  return {
    linearPage0Data,
    budgetBytes: parseNumberComment('Budget'),
    usedBytes: parseNumberComment('Used') ?? parseNumberComment('Page0 Used Bytes'),
    remainingBytes: parseNumberComment('Remaining') ?? parseNumberComment('Page0 Remaining Bytes'),
    selectedGroups,
    skippedGroups
  };
}

function formatPlain48kPage0Diagnostic(page0Info, overflowBytes) {
  if (!page0Info) return '';

  const used = Number.isFinite(page0Info.usedBytes) ? page0Info.usedBytes : 0;
  const remaining = Number.isFinite(page0Info.remainingBytes) ? page0Info.remainingBytes : 0;
  const selected = page0Info.selectedGroups?.length
    ? page0Info.selectedGroups.map(group => `${group.label} (${group.sizeBytes} bytes)`).join(', ')
    : 'none';
  const skipped = page0Info.skippedGroups?.length
    ? page0Info.skippedGroups.map(group => `${group.label} (${group.sizeBytes} bytes: ${group.reason})`).join('; ')
    : 'none';
  const overflow = overflowBytes !== null
    ? ` Main #4000-#BFFF overflow after page-0 packing: ${overflowBytes} bytes.`
    : '';

  return ` Plain48K uses a restricted page-0 packing path: only groups with safe page-0 access can move to #0000-#3FFF. Page0 used ${used} bytes, remaining ${remaining} bytes. Selected: ${selected}. Skipped: ${skipped}.${overflow}`;
}

function buildRomCapacitySuggestion(romMode, targetFormat, autoMegaROM, fitsPlain48k) {
  if (romMode === 'megarom') {
    return null;
  }

  if (romMode === 'simple32k' && fitsPlain48k) {
    return {
      romMode: 'plain48k',
      targetFormat,
      mapperActive: false,
      autoMegaROM: false,
      romSizeKB: 48,
      validationStatus: 'candidate',
      label: 'Validate Plain 48KB ROM',
      reason: 'The current simple32k output is above 32KB but within the 48KB raw budget, so Plain 48KB is only a candidate. Mideas must regenerate and compile the Plain 48KB build before it can be treated as valid.'
    };
  }

  return {
    romMode: 'megarom',
    targetFormat,
    mapperActive: true,
    autoMegaROM: true,
    validationStatus: 'required',
    label: 'Generate MegaROM',
    reason: romMode === 'plain48k'
      ? 'The assembled output exceeds the 48KB plain ROM budget.'
      : 'The assembled output cannot be represented by the selected ROM mode.'
  };
}

function buildRomCapacityDetails(romMode, canSuggestPlain48k, negativeDsOverflowBytes, page0Info = null) {
  const overflowText = negativeDsOverflowBytes !== null
    ? ` by ${negativeDsOverflowBytes} bytes`
    : '';

  if (romMode === 'plain48k') {
    return `The project exceeds the Plain 48KB ROM budget${overflowText}. Generate as MegaROM.${formatPlain48kPage0Diagnostic(page0Info, negativeDsOverflowBytes)}`;
  }

  if (romMode === 'megarom') {
    return `The MegaROM build failed before Glass could write a valid ROM${overflowText}. Check the MegaROM bank layout or generated ASM.`;
  }

  if (romMode === 'simple32k' && canSuggestPlain48k) {
    return `The project exceeds the Simple 32KB ROM limit${overflowText}. Plain 48KB is a candidate only; Mideas must regenerate it and verify that the regenerated build still fits 48KB.`;
  }

  if (romMode === 'simple32k') {
    return `The project exceeds the Simple 32KB ROM limit${overflowText} and no longer fits in the 48KB plain budget. Generate as MegaROM.`;
  }

  return `The project exceeds the selected ROM mode${overflowText}.`;
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
    total += countAsmDataBytesInLine(line);
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

function findMegaromDataSectionEnd(lines, sectionStart) {
  const bossDataSectionStart = lines.findIndex((line, idx) =>
    idx > sectionStart &&
    /^\s*;\s*BOSS DATA BANKS\b/i.test(line)
  );
  if (bossDataSectionStart !== -1) {
    const previousSeparator = bossDataSectionStart > 0 && /^\s*;\s*=+\s*$/.test(lines[bossDataSectionStart - 1])
      ? bossDataSectionStart - 1
      : bossDataSectionStart;
    return previousSeparator;
  }

  const farSectionStart = lines.findIndex((line, idx) =>
    idx > sectionStart &&
    /^\s*;\s*#{10,}\s*$/.test(line) &&
    /^\s*;\s*FAR BANK\b/i.test(lines[idx + 1] || '')
  );
  if (farSectionStart !== -1) return farSectionStart;

  const farMarker = lines.findIndex((line, idx) =>
    idx > sectionStart &&
    (/^\s*;\s*FAR BANK\b/i.test(line) || /^\s*FAR_BANK_\d+_ROM_START:/i.test(line))
  );
  if (farMarker !== -1) return farMarker;

  return lines.findIndex((line, idx) => idx > sectionStart && /^\s*end\b/i.test(line));
}

function repackMegaromZonedDataSection(sourceCode) {
  const lines = String(sourceCode || '').split(/\r?\n/);
  let sectionStart = lines.findIndex((line) => /;\s*DATA BANKS .+Zone-packed data/i.test(line));
  if (sectionStart === -1) return sourceCode;
  if (sectionStart > 0 && /^\s*;\s*=+\s*$/.test(lines[sectionStart - 1])) {
    sectionStart -= 1;
  }

  const sectionEnd = findMegaromDataSectionEnd(lines, sectionStart);
  if (sectionEnd === -1) return sourceCode;

  const sectionLines = lines.slice(sectionStart, sectionEnd);
  const sectionText = sectionLines.join('\n');
  const zoneSizeMatch = sectionText.match(/Zone-packed data \((\d+) bytes per zone\)/i);
  if (!zoneSizeMatch) return sourceCode;
  const zoneSize = parseInt(zoneSizeMatch[1], 10);
  if (!Number.isFinite(zoneSize) || zoneSize <= 0) return sourceCode;
  const originalZoneCountMatch = sectionText.match(/Zones used:\s*(\d+)/i);
  const minimumZoneCount = originalZoneCountMatch ? parseInt(originalZoneCountMatch[1], 10) : 0;

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
  while (Number.isFinite(minimumZoneCount) && zones.length < minimumZoneCount) {
    const orgAddress = dataStartAddress + (zoneIndex * zoneSize);
    const endAddress = orgAddress + zoneSize;
    zones.push({
      zoneIndex,
      orgAddress,
      endAddress,
      physicalBank: (orgAddress - 0x4000) / zoneSize,
      usedBytes: 0,
      remainingBytes: zoneSize,
      units: [],
    });
    zoneIndex += 1;
  }

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

function renderMideasArtifactCommentBlock(fileName, content) {
  const commented = String(content || '')
    .split(/\r?\n/)
    .map((line) => (line.length > 0 ? `; ${line}` : ';'))
    .join('\n');
  return `; [[[MIDEAS_ARTIFACT:${fileName}:BEGIN]]]\n${commented}\n; [[[MIDEAS_ARTIFACT:${fileName}:END]]]`;
}

function extractMideasArtifactCommentBlock(sourceCode, fileName) {
  const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(sourceCode || '').match(
    new RegExp(
      `; \\[\\[\\[MIDEAS_ARTIFACT:${escaped}:BEGIN\\]\\]\\]\\n([\\s\\S]*?)\\n; \\[\\[\\[MIDEAS_ARTIFACT:${escaped}:END\\]\\]\\]`,
      'i'
    )
  );
  if (!match) return null;
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*;\s?/, ''))
    .join('\n');
}

function replaceMideasArtifactCommentBlock(sourceCode, fileName, content) {
  const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const artifactRegex = new RegExp(
    `; \\[\\[\\[MIDEAS_ARTIFACT:${escaped}:BEGIN\\]\\]\\]\\n[\\s\\S]*?\\n; \\[\\[\\[MIDEAS_ARTIFACT:${escaped}:END\\]\\]\\]`,
    'i'
  );
  const rendered = renderMideasArtifactCommentBlock(fileName, content);
  if (!artifactRegex.test(sourceCode)) return sourceCode;
  return sourceCode.replace(artifactRegex, rendered);
}

function parseMideasJsonArtifact(sourceCode, fileName) {
  const content = extractMideasArtifactCommentBlock(sourceCode, fileName);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch (_) {
    return null;
  }
}

function buildMsx2IdeBudgetFeedbackFromAsm(sourceCode) {
  const projectSlice = parseMideasJsonArtifact(sourceCode, 'project_slice.json');
  const logicalBudget = parseMideasJsonArtifact(sourceCode, 'logical_bank_budget.json');
  const artifactWorldBankManifest = parseMideasJsonArtifact(sourceCode, 'msx2_world_bank_manifest.json');
  const ramBudget = parseMideasJsonArtifact(sourceCode, 'ram_budget.json');
  if (
    !projectSlice ||
    projectSlice.scope !== 'msx2_screen4_project_slice' ||
    !logicalBudget ||
    !ramBudget
  ) {
    return null;
  }
  const bankSize = Number(logicalBudget.bankSizeBytes || 8192);
  const totalPayload = Number(logicalBudget.totalPayloadBytes || 0);
  const packages = Array.isArray(logicalBudget.packages) ? logicalBudget.packages : [];
  const warnings = Array.isArray(logicalBudget.recoveryRecommendations)
    ? logicalBudget.recoveryRecommendations.filter((item) => item && ['warning', 'plan_b'].includes(item.severity))
    : [];
  const warningPackedBanks = Array.isArray(logicalBudget.warningPackedBanks) ? logicalBudget.warningPackedBanks : [];
  const ramRecommendations = Array.isArray(ramBudget.recommendations) ? ramBudget.recommendations : [];
  const ramWarnings = ramRecommendations.filter((item) => item && ['warning', 'plan_b'].includes(item.severity));
  const largestAssets = [...packages]
    .sort((a, b) => Number(b?.usedBytes || 0) - Number(a?.usedBytes || 0))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      usedBytes: Number(item.usedBytes || 0),
      bankClass: item.recommendedBankClass,
      warning: Boolean(item.warning),
      overBudgetBytes: Number(item.overBudgetBytes || 0)
    }));
  const suggestedFixes = [];
  for (const item of Array.isArray(logicalBudget.recoveryRecommendations) ? logicalBudget.recoveryRecommendations : []) {
    if (!item) continue;
    suggestedFixes.push({
      severity: item.severity || 'info',
      target: item.target,
      reason: item.reason,
      action: item.action
    });
  }
  for (const step of Array.isArray(logicalBudget.recoveryPlan) ? logicalBudget.recoveryPlan : []) {
    if (!step || !['recommended', 'required', 'enforced'].includes(step.status)) continue;
    suggestedFixes.push({
      severity: step.status,
      target: Array.isArray(step.appliesTo) && step.appliesTo.length ? step.appliesTo.join(', ') : step.id,
      reason: step.trigger,
      action: step.action
    });
  }
  for (const item of ramWarnings) {
    suggestedFixes.push({
      severity: item.severity || 'info',
      target: item.target,
      reason: item.reason,
      action: item.action
    });
  }
  let status = 'ok';
  if (warnings.length || warningPackedBanks.length || ramWarnings.length) status = 'warning';
  if ((Array.isArray(logicalBudget.overBudgetPackages) && logicalBudget.overBudgetPackages.length) || (ramBudget.status && ramBudget.status !== 'ok')) {
    status = 'error';
  }
  const includedRuntimeModules = Array.isArray(projectSlice.includedRuntimeModuleDetails)
    ? projectSlice.includedRuntimeModuleDetails
    : (Array.isArray(projectSlice.includedRuntimeModules) ? projectSlice.includedRuntimeModules.map((id) => ({ id })) : []);
  const excludedRuntimeModules = Array.isArray(projectSlice.excludedRuntimeModules) ? projectSlice.excludedRuntimeModules : [];
  const runtimeModuleDetails = Array.isArray(projectSlice.runtimeModuleDetails)
    ? projectSlice.runtimeModuleDetails
    : [
      ...includedRuntimeModules.map((item) => ({ ...item, included: true })),
      ...excludedRuntimeModules.map((item) => ({ ...item, included: false }))
    ];
  const includedRuntimeModuleDetails = includedRuntimeModules.map((item) => ({
    id: item?.id ?? item,
    placement: item?.placement || 'unknown',
    reason: item?.reason
  }));
  const worldBankManifest = artifactWorldBankManifest || projectSlice.worldBankManifest || null;
  const manifestWorlds = Array.isArray(worldBankManifest?.worlds) ? worldBankManifest.worlds : [];
  const manifestPhysicalBanks = Array.isArray(worldBankManifest?.estimatedPhysicalBanks) ? worldBankManifest.estimatedPhysicalBanks : [];
  const manifestPackageCount = manifestWorlds.reduce((sum, world) =>
    sum + (Array.isArray(world?.packages) ? world.packages.length : 0), 0);
  const manifestWarningBankCount = manifestPhysicalBanks.filter((bank) => bank?.status === 'warning' || bank?.warning === true).length;
  const manifestOverBudgetBankCount = manifestPhysicalBanks.filter((bank) => bank?.status === 'error' || Number(bank?.overBudgetBytes || 0) > 0).length;
  return {
    scope: 'msx2_screen4_ide_budget_feedback',
    status,
    project: {
      name: projectSlice.projectName,
      backend: projectSlice.backend,
      screenMode: projectSlice.screenMode,
      romMode: projectSlice.romMode,
      mapper: projectSlice.mapper
    },
    rom: {
      bankSizeBytes: bankSize,
      payloadBytes: totalPayload,
      estimatedPackedBankCount: Number(logicalBudget.estimatedPackedBankCount || 0),
      warningThresholdBytes: Number(logicalBudget.warningThresholdBytes || 0),
      usedPercentOfSingleBank: bankSize ? Math.round((totalPayload / bankSize) * 10000) / 100 : 0,
      warningBankCount: warningPackedBanks.length,
      warningRecommendationCount: warnings.length,
      bankClassSummary: Array.isArray(logicalBudget.bankClassSummary) ? logicalBudget.bankClassSummary : []
    },
    ram: {
      start: ramBudget.start,
      limit: ramBudget.limit,
      usedBytes: Number(ramBudget.usedBytes || 0),
      freeBytes: Number(ramBudget.freeBytes || 0),
      status: ramBudget.status || 'unknown',
      warningCount: ramWarnings.length,
      sections: Array.isArray(ramBudget.sections) ? ramBudget.sections : []
    },
    runtimeModules: {
      included: includedRuntimeModuleDetails,
      excluded: excludedRuntimeModules,
      all: runtimeModuleDetails,
      includedCount: includedRuntimeModuleDetails.length,
      residentCount: includedRuntimeModuleDetails.filter((item) => item.placement === 'resident').length,
      farCodeCount: includedRuntimeModuleDetails.filter((item) => item.placement === 'far_code').length,
      worldSpecificCount: includedRuntimeModuleDetails.filter((item) => item.placement === 'world_specific').length
    },
    worldBankManifest: worldBankManifest ? {
      worldCount: manifestWorlds.length,
      estimatedPhysicalBankCount: manifestPhysicalBanks.length,
      dataWindowAddress: worldBankManifest.dataWindowAddress,
      packageCount: manifestPackageCount,
      warningBankCount: manifestWarningBankCount,
      overBudgetBankCount: manifestOverBudgetBankCount,
      worlds: manifestWorlds,
      estimatedPhysicalBanks: manifestPhysicalBanks
    } : undefined,
    worldPackages: Array.isArray(projectSlice.worldPackageSummary) ? projectSlice.worldPackageSummary : [],
    largestAssets,
    warnings: {
      romRecommendations: warnings,
      warningPackedBanks,
      ramRecommendations: ramWarnings
    },
    suggestedFixes
  };
}

function buildMsx2BudgetResolutionFailureContext(feedback) {
  if (!feedback || typeof feedback !== 'object') return null;
  const worldBankManifest = feedback.worldBankManifest || {};
  const largestAssets = Array.isArray(feedback.largestAssets) ? feedback.largestAssets : [];
  const warningPackedBanks = Array.isArray(feedback.warnings?.warningPackedBanks) ? feedback.warnings.warningPackedBanks : [];
  const overBudgetAssets = largestAssets.filter((item) => Number(item?.overBudgetBytes || 0) > 0);
  const ramStatus = String(feedback.ram?.status || 'unknown');
  let failedGateId = 'ide_budget_feedback';
  if (ramStatus && ramStatus !== 'ok' && ramStatus !== 'unknown') {
    failedGateId = 'ram_budget_report';
  } else if (
    Number(worldBankManifest.overBudgetBankCount || 0) > 0 ||
    overBudgetAssets.length > 0 ||
    String(feedback.status || '') === 'error'
  ) {
    failedGateId = 'bank_allocation_dry_run';
  }
  return {
    failedGateId,
    project: feedback.project || {},
    rom: {
      payloadBytes: Number(feedback.rom?.payloadBytes || 0),
      estimatedPackedBankCount: Number(feedback.rom?.estimatedPackedBankCount || 0),
      warningBankCount: Number(feedback.rom?.warningBankCount || warningPackedBanks.length || 0),
      overBudgetAssetCount: overBudgetAssets.length
    },
    ram: {
      status: ramStatus,
      usedBytes: Number(feedback.ram?.usedBytes || 0),
      freeBytes: Number(feedback.ram?.freeBytes || 0)
    },
    worldBankManifest: {
      worldCount: Number(worldBankManifest.worldCount || 0),
      estimatedPhysicalBankCount: Number(worldBankManifest.estimatedPhysicalBankCount || 0),
      warningBankCount: Number(worldBankManifest.warningBankCount || 0),
      overBudgetBankCount: Number(worldBankManifest.overBudgetBankCount || 0),
      dataWindowAddress: worldBankManifest.dataWindowAddress
    }
  };
}

function isResourceTableRamZx0Candidate(resource) {
  const type = String(resource?.type || '').toUpperCase();
  const label = String(resource?.label || '').toUpperCase();
  if (!label || label.startsWith('PRESENTATION_SCREEN_')) return false;
  if (isDirectRomScreenBlockCatalog(label)) return false;

  if (
    type === 'SCREEN_LAYOUT' ||
    type === 'SCREEN_EFFECTS_LAYOUT' ||
    type === 'SCREEN_BEHAVIOR_MAP' ||
    type === 'SCREEN_BLOCK_CATALOG' ||
    type === 'SCREEN_BLOCK_MAP' ||
    type === 'SCREEN_EFFECT_ZONE_TABLE' ||
    type === 'MUSIC_TRACK' ||
    type === 'SOUND_DATA'
  ) {
    return true;
  }

  if (type === 'SCREEN_DATA') {
    return (
      label.includes('INTERACTION_') ||
      label.includes('CHAR_BEHAVIOR_TABLE') ||
      label.includes('BOSS_TABLE')
    );
  }

  return false;
}

function isResourceTableVramZx0Candidate(resource) {
  const type = String(resource?.type || '').toUpperCase();
  const label = String(resource?.label || '').toUpperCase();
  if (!label || label.startsWith('PRESENTATION_SCREEN_')) return false;

  return (
    type === 'TILE_PATTERNS' ||
    type === 'TILE_COLORS' ||
    type === 'FONT_PATTERNS' ||
    type === 'FONT_COLORS' ||
    type === 'SPRITE_PATTERNS'
  );
}

function isResourceTableZx0Candidate(resource) {
  return isResourceTableRamZx0Candidate(resource) || isResourceTableVramZx0Candidate(resource);
}

function isDirectRomScreenBlockCatalog(label) {
  return /^SCREEN_BLOCK_CATALOG_4X4_\d+$/.test(String(label || '').toUpperCase());
}

function createDirectRomCatalogCompressedError(label) {
  const error = new Error(
    `${label} is already ZX0-compressed, but shared 4x4 screen block catalogs are read directly from a fixed ROM bank and must stay raw. Regenerate the unified ASM from the project before applying ZX0.`
  );
  error.code = 'MIDEAS_DIRECT_ROM_CATALOG_COMPRESSED';
  return error;
}

function buildResourceTableAsmFromRecords(resources) {
  const sorted = [...resources].sort((left, right) => left.id - right.id);
  const lines = [
    '; ==================================================================',
    '; GENERATED RESOURCE TABLE',
    '; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags',
    '; Resource id is the zero-based descriptor index.',
    '; Address is the mapper-window address visible after selecting bank.',
    '; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.',
    '; ==================================================================',
    'RESOURCE_TABLE_ENTRY_SIZE EQU 8',
    'RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01',
    `RESOURCE_TABLE_COUNT EQU ${sorted.length}`,
    '',
    'resource_table:',
  ];

  if (sorted.length === 0) {
    lines.push('    ; No banked resources generated for this build.');
  }

  for (const resource of sorted) {
    lines.push(`    ; ${resource.label}`);
    lines.push(`    db ${resource.bank}`);
    lines.push(`    dw ${formatAsmAddress(resource.windowAddress)}`);
    lines.push(`    dw ${resource.size}`);
    lines.push(`    dw ${resource.uncompressedSize}`);
    lines.push(`    db ${resource.flags || 0}`);
  }

  return lines.join('\n');
}

function resolveResourceRuntimeBank(zoneBank, mapperFormat) {
  const bank = Number(zoneBank);
  if (!Number.isFinite(bank)) return zoneBank;
  if (String(mapperFormat || '').toLowerCase() === 'ascii16') {
    // Glass emits ROM bytes relative to the #4000 cartridge origin, but the
    // ASCII16 hardware register selects 16 KB file segments. The data zone
    // whose ASM address is #10000 is runtime segment 1, not logical bank 3.
    return Math.max(0, bank - 2);
  }
  return bank;
}

/**
 * Mirrors the generator-side label sanitizer for artifact repair after ZX0 packing.
 */
function sanitizeAsmKeyForArtifacts(value) {
  return String(value || '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

/**
 * Returns the compact resource shape shared by refreshed JSON artifacts.
 */
function buildResourceUsageSummaryFromRecord(resource) {
  return {
    id: resource.id,
    label: resource.label,
    group: resource.group,
    type: resource.type,
    bank: resource.bank,
    windowAddress: resource.windowAddress,
    zoneOffset: resource.zoneOffset,
    size: resource.size,
    storedSize: resource.size,
    uncompressedSize: resource.uncompressedSize,
    flags: resource.flags || 0,
    placementReason: resource.placementReason,
  };
}

function describeMegaromPlacement(resource, zone, unit, labelOffset) {
  const isCompressed = (resource.flags || 0) & 0x01;
  const compressionText = isCompressed
    ? `ZX0 ${resource.size}/${resource.uncompressedSize} bytes`
    : `raw ${resource.size} bytes`;
  const unitText = unit.labels.length > 1
    ? `merged ${unit.groupKey} unit (${unit.labels.length} labels)`
    : `single ${unit.groupKey} resource`;
  return (
    `post-ZX0 first-fit ${unitText}; ${compressionText}; ` +
    `bank ${zone.physicalBank} zone ${zone.zoneIndex} offset +${formatAsmAddress(unit.zoneOffset + labelOffset)}; ` +
    `zone slack after pack ${zone.remainingBytes} bytes`
  );
}

function buildBankMetadataChecksum(parts) {
  // Keep this in sync with scripts/build_mideas_unified_rom.py for artifact drift checks.
  let hash = 0x811c9dc5;
  const input = parts.map((part) => String(part ?? '')).join('|');
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).toUpperCase().padStart(8, '0')}`;
}

function formatManifestV2MapperName(mapperFormat) {
  switch (String(mapperFormat || '').toLowerCase()) {
    case 'konami':
      return 'KONAMI8K';
    case 'ascii8':
      return 'ASCII8';
    case 'ascii16':
      return 'ASCII16';
    default:
      return sanitizeAsmKeyForArtifacts(mapperFormat);
  }
}

function formatManifestV2GroupName(groupKey) {
  return String(groupKey || '').trim().toLowerCase();
}

function inferManifestV2Lifetime(resource) {
  const group = String(resource?.group || '').toUpperCase();
  return group === 'FONT' || group === 'SPRITES' ? 'persistent' : 'stream';
}

function inferManifestV2RuntimeTarget(resource) {
  const type = String(resource?.type || '').toUpperCase();
  if (type === 'MUSIC_TRACK' || type === 'SOUND_DATA' || type === 'SCREEN_EFFECT_ZONE_TABLE') {
    return 'RAM';
  }
  return 'VRAM';
}

function buildManifestV2IdFromRecords(resources, mapperInfo, zoneSize, dataStartAddress) {
  const checksum = buildBankMetadataChecksum([
    'mideas.manifest/2',
    mapperInfo.mapperFormat,
    zoneSize,
    dataStartAddress,
    resources.reduce((sum, resource) => sum + resource.uncompressedSize, 0),
    ...[...resources].sort((left, right) => left.id - right.id).flatMap((resource) => [
      resource.id,
      resource.label,
      resource.group,
      resource.type,
      resource.bank,
      resource.physicalAddress,
      resource.windowAddress,
      resource.zoneOffset,
      resource.size,
      resource.uncompressedSize,
      resource.flags || 0,
    ]),
  ]);
  return `mideas-v2:${checksum.replace(/^fnv1a32:/, '').toLowerCase()}`;
}

function buildManifestV2FromRecords(previousManifestV2, resources, zones, mapperInfo, zoneSize, dataStartAddress) {
  const orderedResources = [...resources].sort((left, right) => left.id - right.id);
  const resourceGroups = [...new Set(orderedResources.map((resource) => String(resource.group || '').toUpperCase()))]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
  const windowBaseAddress = parseAsmAddressExpression(mapperInfo.windowBase, 0xA000);
  const maxRomBank = orderedResources.reduce((maxBank, resource) => {
    const romBank = Math.trunc((resource.physicalAddress - 0x4000) / zoneSize);
    return Math.max(maxBank, romBank);
  }, 0);
  const resourcesByZone = new Map();
  for (const resource of orderedResources) {
    const romBank = Math.trunc((resource.physicalAddress - 0x4000) / zoneSize);
    if (!resourcesByZone.has(romBank)) resourcesByZone.set(romBank, []);
    resourcesByZone.get(romBank).push(resource);
  }

  return {
    ...(previousManifestV2 || {}),
    schema: 'mideas.manifest/2',
    build_id: buildManifestV2IdFromRecords(orderedResources, mapperInfo, zoneSize, dataStartAddress),
    entry_point: previousManifestV2?.entry_point || '0x4000',
    boot_reserved_size: previousManifestV2?.boot_reserved_size || 0,
    cartridge: {
      mapper: formatManifestV2MapperName(mapperInfo.mapperFormat),
      bank_size: zoneSize,
      banks: maxRomBank + 1,
      data_window: {
        page: mapperInfo.dataWindowPage,
        base: mapperInfo.windowBase,
        mask: mapperInfo.windowMask,
        bank_divisor: mapperInfo.bankDivisor,
      },
    },
    layout: {
      policy: 'post_zx0_deterministic_first_fit_decreasing',
      file_offset_rule: 'file_offset = rom_bank_index * bank_size + bank_offset',
      data_start_address: dataStartAddress,
      total_source_bytes: orderedResources.reduce((sum, resource) => sum + resource.uncompressedSize, 0),
    },
    groups: [
      {
        name: 'boot',
        fixed_bank: 0,
        lifetime: 'persistent',
      },
      ...resourceGroups.map((groupKey) => ({
        name: formatManifestV2GroupName(groupKey),
        lifetime: groupKey === 'FONT' || groupKey === 'SPRITES' ? 'persistent' : 'stream',
      })),
    ],
    resources: orderedResources.map((resource) => {
      const romBankIndex = Math.trunc((resource.physicalAddress - 0x4000) / zoneSize);
      const compressed = (resource.flags || 0) & 0x01;
      const runtimeTarget = inferManifestV2RuntimeTarget(resource);
      return {
        id: resource.id,
        type: formatManifestV2GroupName(resource.type),
        group: formatManifestV2GroupName(resource.group),
        file: `generated/${formatManifestV2GroupName(resource.group)}/${resource.label}.asm`,
        symbol: resource.label,
        resource_id_symbol: resource.resourceIdLabel,
        lifetime: inferManifestV2Lifetime(resource),
        compress: compressed ? 'zx0' : 'none',
        ...(compressed ? {
          decompressor: 'zx0',
          decompress_target: runtimeTarget,
        } : {}),
        runtime_target: runtimeTarget,
        placement: {
          bank_index: resource.bank,
          rom_bank_index: romBankIndex,
          window: mapperInfo.windowBase,
          window_address: resource.windowAddress,
          bank_offset: resource.zoneOffset,
          file_offset: (romBankIndex * zoneSize) + resource.zoneOffset,
          physical_address: resource.physicalAddress,
          align: 1,
        },
        size: {
          stored: resource.size,
          uncompressed: resource.uncompressedSize,
        },
        flags: resource.flags || 0,
      };
    }),
    verification: {
      algorithm: 'fnv1a32-resource-metadata',
      banks: zones.map((zone) => {
        const romBank = Math.trunc((zone.orgAddress - 0x4000) / zoneSize);
        const zoneResources = (resourcesByZone.get(romBank) || []).sort((left, right) => {
          if (left.zoneOffset !== right.zoneOffset) return left.zoneOffset - right.zoneOffset;
          return left.id - right.id;
        });
        return {
          bank: zone.physicalBank,
          verification: buildBankVerificationFromResources(zone.physicalBank, zone.usedBytes, zoneResources),
        };
      }),
      expected_ram_dumps: Array.isArray(previousManifestV2?.verification?.expected_ram_dumps)
        ? previousManifestV2.verification.expected_ram_dumps
        : [],
    },
  };
}

function buildBankVerificationFromResources(bank, usedBytes, resources) {
  // Sort by the in-bank address so equivalent JSON orderings produce the same checksum.
  const ordered = [...resources].sort((left, right) => {
    const leftOffset = Number.isFinite(left.zoneOffset) ? left.zoneOffset : left.offset;
    const rightOffset = Number.isFinite(right.zoneOffset) ? right.zoneOffset : right.offset;
    if (leftOffset !== rightOffset) return leftOffset - rightOffset;
    return String(left.label || '').localeCompare(String(right.label || ''));
  });
  return {
    algorithm: 'fnv1a32-resource-metadata',
    metadataChecksum: buildBankMetadataChecksum([
      bank,
      usedBytes,
      ...ordered.flatMap((resource) => [
        resource.id,
        resource.label,
        Number.isFinite(resource.zoneOffset) ? resource.zoneOffset : resource.offset,
        resource.size,
        resource.uncompressedSize,
        resource.flags || 0,
      ]),
    ]),
    resourceCount: ordered.length,
    storedBytes: usedBytes,
  };
}

/**
 * Groups final resource records by bank after compression has changed placement.
 */
function summarizeResourceRecordsByBank(resources) {
  const bankMap = new Map();
  for (const resource of resources) {
    if (!bankMap.has(resource.bank)) {
      bankMap.set(resource.bank, []);
    }
    bankMap.get(resource.bank).push(resource);
  }

  return [...bankMap.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([bank, bankResources]) => {
      const ordered = [...bankResources].sort((left, right) => {
        if (left.zoneOffset !== right.zoneOffset) return left.zoneOffset - right.zoneOffset;
        return left.id - right.id;
      });
      return {
        bank,
        count: ordered.length,
        storedBytes: ordered.reduce((sum, resource) => sum + resource.size, 0),
        rawBytes: ordered.reduce((sum, resource) => sum + resource.uncompressedSize, 0),
        resourceIds: ordered.map((resource) => resource.id),
        resourceLabels: ordered.map((resource) => resource.label),
      };
    });
}

/**
 * Reuses existing scene resource ids, or infers them from generated screen labels.
 */
function inferSceneResourceIds(scene, resources) {
  if (Array.isArray(scene?.resourceIds)) {
    return scene.resourceIds.filter((id) => Number.isFinite(id));
  }

  const screenKey = sanitizeAsmKeyForArtifacts(scene?.name || scene?.id || `screen_${scene?.index || 0}`);
  const index = Number.isFinite(scene?.index) ? scene.index : 0;
  const prefixes = [
    `SCREEN_${screenKey}_${index}_`,
    `BEHAVIOR_${screenKey}_${index}_`,
  ];
  return resources
    .filter((resource) => prefixes.some((prefix) => String(resource.label || '').startsWith(prefix)))
    .map((resource) => resource.id);
}

/**
 * Refreshes scene resource placement so project_usage.json matches final ZX0 banks.
 */
function refreshProjectUsageScenes(projectUsage, resources) {
  if (!Array.isArray(projectUsage?.scenes)) return;
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));

  projectUsage.scenes = projectUsage.scenes.map((scene) => {
    const resourceIds = inferSceneResourceIds(scene, resources);
    const sceneResources = resourceIds
      .map((id) => resourceById.get(id))
      .filter(Boolean)
      .sort((left, right) => {
        if (left.bank !== right.bank) return left.bank - right.bank;
        if (left.zoneOffset !== right.zoneOffset) return left.zoneOffset - right.zoneOffset;
        return left.id - right.id;
      });
    const banks = summarizeResourceRecordsByBank(sceneResources);
    return {
      ...scene,
      resourceIds: sceneResources.map((resource) => resource.id),
      resources: sceneResources.map(buildResourceUsageSummaryFromRecord),
      banks,
      loadOrder: banks.map((bank) => ({
        bank: bank.bank,
        resourceIds: bank.resourceIds,
        resourceLabels: bank.resourceLabels,
      })),
      totals: {
        ...(scene?.totals || {}),
        resourceCount: sceneResources.length,
        storedBytes: sceneResources.reduce((sum, resource) => sum + resource.size, 0),
        rawBytes: sceneResources.reduce((sum, resource) => sum + resource.uncompressedSize, 0),
        compressedResources: sceneResources.filter((resource) => (resource.flags & 0x01) !== 0).length,
      },
    };
  });
}

/**
 * Rebuilds load_plan.json from refreshed project_usage data after compression.
 */
function buildLoadPlanFromProjectUsage(projectUsage) {
  const scenes = Array.isArray(projectUsage?.scenes) ? projectUsage.scenes : [];
  const mapper = projectUsage?.mapper || {};
  const allResources = Array.isArray(projectUsage?.bankedResources) ? projectUsage.bankedResources : [];
  const uniqueDataBanks = new Set(allResources.map((resource) => resource.bank).filter(Number.isFinite));
  const sceneBankTouches = scenes.map((scene) => Array.isArray(scene?.banks) ? scene.banks.length : 0);
  return {
    version: 1,
    scope: 'konami8k_scene_load_plan',
    strategy: 'group current banked resources by scene and physical bank; optimizer consumes this before repacking',
    mapper: {
      format: mapper.format || 'konami',
      segmentSize: mapper.segmentSize || 8192,
      dataWindowPage: mapper.dataWindowPage || 'p3',
      windowBase: mapper.windowBase || '#A000',
      windowMask: mapper.windowMask || '#1FFF',
      bankDivisor: mapper.bankDivisor || '#2000',
    },
    summary: {
      sceneCount: scenes.length,
      resourceCount: allResources.length,
      uniqueDataBanks: uniqueDataBanks.size,
      totalSceneBankTouches: sceneBankTouches.reduce((sum, touches) => sum + touches, 0),
      maxSceneBankTouches: sceneBankTouches.reduce((max, touches) => Math.max(max, touches), 0),
      totalStoredBytes: allResources.reduce((sum, resource) => sum + (resource.storedSize || resource.size || 0), 0),
      totalRawBytes: allResources.reduce((sum, resource) => sum + (resource.uncompressedSize || resource.size || 0), 0),
      compressedResources: allResources.filter((resource) => (resource.flags & 0x01) !== 0).length,
    },
    scenes: scenes.map((scene) => {
      const resources = Array.isArray(scene?.resources) ? scene.resources : [];
      const banks = Array.isArray(scene?.banks) ? scene.banks : [];
      const warnings = [];
      if (resources.length === 0) warnings.push('scene has no matched banked resources');
      if (banks.length > 3) warnings.push('scene spans more than three data banks');
      if (resources.some((resource) => resource.storedSize > 8192)) {
        warnings.push('scene contains a resource larger than one 8KB bank');
      }

      return {
        index: scene?.index,
        id: scene?.id,
        name: scene?.name,
        tileBankAssetId: scene?.tileBankAssetId || null,
        resourceCount: scene?.totals?.resourceCount || resources.length,
        totalStoredBytes: scene?.totals?.storedBytes || resources.reduce((sum, resource) => sum + (resource.storedSize || 0), 0),
        totalRawBytes: scene?.totals?.rawBytes || resources.reduce((sum, resource) => sum + (resource.uncompressedSize || 0), 0),
        compressedResources: scene?.totals?.compressedResources || resources.filter((resource) => (resource.flags & 0x01) !== 0).length,
        banks,
        loadOrder: Array.isArray(scene?.loadOrder) ? scene.loadOrder : [],
        warnings,
      };
    }),
  };
}

/**
 * Simulates scene bundle packing so tooling can compare current vs proposed banks.
 */
function parseAsmAddressExpression(value, fallback) {
  const raw = String(value || '').trim();
  if (raw.startsWith('#')) return parseInt(raw.slice(1), 16);
  if (/^0x[0-9a-f]+$/i.test(raw)) return parseInt(raw, 16);
  if (/^[0-9a-f]+h$/i.test(raw)) return parseInt(raw.slice(0, -1), 16);
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  return fallback;
}

function buildProposedSceneAwarePlacementFromRecords(scenes, resources, unassignedResources, mapperInfo = {}) {
  const legacyZoneSize = typeof mapperInfo === 'number' ? mapperInfo : mapperInfo?.segmentSize;
  const capacity = Math.max(1, Number(legacyZoneSize || 8192) | 0);
  const windowBase = parseAsmAddressExpression(
    typeof mapperInfo === 'number' ? '#A000' : mapperInfo?.windowBase,
    0xA000
  );
  const firstBank = resources.reduce((minBank, resource) => Math.min(minBank, resource.bank), Number.POSITIVE_INFINITY);
  const bankBase = Number.isFinite(firstBank) ? firstBank : 4;
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
  const makeUnit = (kind, unitResources, scene = null) => ({
    kind,
    sceneIndex: scene?.index ?? null,
    sceneId: scene?.id ?? null,
    sceneName: scene?.name ?? null,
    resourceIds: unitResources.map((resource) => resource.id),
    resourceLabels: unitResources.map((resource) => resource.label),
    storedBytes: unitResources.reduce((sum, resource) => sum + resource.size, 0),
    rawBytes: unitResources.reduce((sum, resource) => sum + resource.uncompressedSize, 0),
  });

  const sceneUnits = scenes.flatMap((scene) => {
    const sceneResources = (Array.isArray(scene?.resourceIds) ? scene.resourceIds : [])
      .map((resourceId) => resourceById.get(resourceId))
      .filter(Boolean);
    const sceneBytes = sceneResources.reduce((sum, resource) => sum + resource.size, 0);
    if (sceneBytes <= capacity) {
      return [makeUnit('scene', sceneResources, scene)];
    }
    return sceneResources.map((resource) => makeUnit('scene', [resource], scene));
  });
  const sharedUnits = unassignedResources.map((resource) => makeUnit('shared', [resource]));
  const units = [...sceneUnits, ...sharedUnits]
    .filter((unit) => unit.storedBytes > 0)
    .sort((left, right) => {
      if (right.storedBytes !== left.storedBytes) return right.storedBytes - left.storedBytes;
      return (left.sceneIndex ?? Number.MAX_SAFE_INTEGER) - (right.sceneIndex ?? Number.MAX_SAFE_INTEGER);
    });

  const banks = [];
  for (const unit of units) {
    let targetBank = banks.find((bank) => bank.freeBytes >= unit.storedBytes);
    if (!targetBank) {
      targetBank = {
        bank: bankBase + banks.length,
        usedBytes: 0,
        freeBytes: capacity,
        units: [],
      };
      banks.push(targetBank);
    }
    targetBank.units.push(unit);
    targetBank.usedBytes += unit.storedBytes;
    targetBank.freeBytes -= unit.storedBytes;
  }

  const sceneBankMap = new Map();
  for (const bank of banks) {
    for (const unit of bank.units) {
      if (unit.kind !== 'scene' || unit.sceneIndex === null) continue;
      if (!sceneBankMap.has(unit.sceneIndex)) {
        sceneBankMap.set(unit.sceneIndex, new Set());
      }
      sceneBankMap.get(unit.sceneIndex).add(bank.bank);
    }
  }
  const currentSceneBankTouches = scenes.reduce((sum, scene) => (
    sum + (Array.isArray(scene?.banks) ? scene.banks.length : 0)
  ), 0);
  const proposedSceneBankTouches = scenes.reduce((sum, scene) => sum + (sceneBankMap.get(scene?.index)?.size || 0), 0);
  const currentBanks = summarizeResourceRecordsByBank(resources);
  const buildResourcePlacements = (bank) => {
    let zoneOffset = 0;
    return bank.units.flatMap((unit) => unit.resourceIds.map((resourceId) => {
      const resource = resourceById.get(resourceId);
      if (!resource) return null;
      const placement = {
        id: resource.id,
        label: resource.label,
        bank: bank.bank,
        zoneOffset,
        windowAddress: windowBase + zoneOffset,
        storedSize: resource.size,
        uncompressedSize: resource.uncompressedSize,
        flags: resource.flags || 0,
        unitKind: unit.kind,
        sceneIndex: unit.sceneIndex,
        sceneId: unit.sceneId,
        sceneName: unit.sceneName,
        placementReason: (
          `proposed ${unit.kind} first-fit placement; ${resource.size}/${resource.uncompressedSize} bytes; ` +
          `bank ${bank.bank} offset +${formatAsmAddress(zoneOffset)}; current ROM placement unchanged`
        ),
      };
      zoneOffset += resource.size;
      return placement;
    })).filter(Boolean);
  };
  const proposedBanks = banks.map((bank) => {
    const resourcePlacements = buildResourcePlacements(bank);
    return {
      bank: bank.bank,
      usedBytes: bank.usedBytes,
      freeBytes: bank.freeBytes,
      units: bank.units,
      resourcePlacements,
      resourceIds: resourcePlacements.map((placement) => placement.id),
      resourceLabels: resourcePlacements.map((placement) => placement.label),
    };
  });

  return {
    strategy: 'dry-run scene bundles first-fit decreasing with mapper data-zone capacity; current ROM placement is unchanged',
    zoneSize: capacity,
    bankCount: banks.length,
    resourceCount: resources.length,
    totalStoredBytes: resources.reduce((sum, resource) => sum + resource.size, 0),
    resourcePlacements: proposedBanks.flatMap((bank) => bank.resourcePlacements),
    banks: proposedBanks,
    sceneBankPlan: scenes.map((scene) => ({
      index: scene?.index,
      id: scene?.id,
      name: scene?.name,
      currentBanks: Array.isArray(scene?.banks) ? scene.banks.map((bank) => bank.bank) : [],
      proposedBanks: [...(sceneBankMap.get(scene?.index) || new Set())].sort((left, right) => left - right),
    })),
    delta: {
      currentBankCount: currentBanks.length,
      proposedBankCount: banks.length,
      currentSceneBankTouches,
      proposedSceneBankTouches,
    },
  };
}

/**
 * Rebuilds bank_optimizer.json from final placement without changing the ROM layout.
 */
function buildBankOptimizerFromProjectUsage(projectUsage, resources, zones = [], mapperInfo = {}) {
  const scenes = Array.isArray(projectUsage?.scenes) ? projectUsage.scenes : [];
  const assignedResourceIds = new Set();
  for (const scene of scenes) {
    for (const resourceId of Array.isArray(scene?.resourceIds) ? scene.resourceIds : []) {
      assignedResourceIds.add(resourceId);
    }
  }
  const unassignedResources = resources
    .filter((resource) => !assignedResourceIds.has(resource.id))
    .sort((left, right) => {
      if (left.bank !== right.bank) return left.bank - right.bank;
      if (left.zoneOffset !== right.zoneOffset) return left.zoneOffset - right.zoneOffset;
      return left.id - right.id;
    });
  const allBanksByNumber = new Map(summarizeResourceRecordsByBank(resources).map((bank) => [bank.bank, bank]));
  for (const zone of Array.isArray(zones) ? zones : []) {
    if (allBanksByNumber.has(zone.physicalBank)) continue;
    allBanksByNumber.set(zone.physicalBank, {
      bank: zone.physicalBank,
      count: 0,
      storedBytes: 0,
      rawBytes: 0,
      resourceIds: [],
      resourceLabels: [],
    });
  }
  const allBanks = [...allBanksByNumber.values()].sort((left, right) => left.bank - right.bank);
  const sceneClusters = scenes.map((scene) => {
    const banks = Array.isArray(scene?.banks) ? scene.banks.map((bank) => bank.bank).filter(Number.isFinite) : [];
    return {
      index: scene?.index,
      id: scene?.id,
      name: scene?.name,
      resourceIds: Array.isArray(scene?.resourceIds) ? scene.resourceIds : [],
      banks,
      bankCount: banks.length,
      storedBytes: scene?.totals?.storedBytes || 0,
      rawBytes: scene?.totals?.rawBytes || 0,
      coLocated: banks.length <= 1,
      preferredBank: banks.length > 0 ? banks[0] : null,
    };
  });

  return {
    version: 1,
    scope: 'konami8k_bank_optimizer',
    strategy: 'analysis-only scene-aware first-fit input; later pass may repack or duplicate resources',
    constraints: {
      mapperFormat: mapperInfo.mapperFormat || 'konami',
      segmentSize: mapperInfo.segmentSize || 8192,
      dynamicWindows: 1,
      dataWindow: {
        page: mapperInfo.dataWindowPage || 'p3',
        base: mapperInfo.windowBase || '#A000',
        mask: mapperInfo.windowMask || '#1FFF',
        bankDivisor: mapperInfo.bankDivisor || '#2000',
      },
      maxRecommendedSceneBanks: 3,
    },
    currentPlacement: {
      bankCount: allBanks.length,
      resourceCount: resources.length,
      totalStoredBytes: resources.reduce((sum, resource) => sum + resource.size, 0),
      totalRawBytes: resources.reduce((sum, resource) => sum + resource.uncompressedSize, 0),
      compressedResources: resources.filter((resource) => (resource.flags & 0x01) !== 0).length,
      banks: allBanks,
    },
    proposedPlacement: buildProposedSceneAwarePlacementFromRecords(
      scenes,
      resources,
      unassignedResources,
      mapperInfo,
    ),
    sceneClusters,
    pressureWarnings: sceneClusters
      .filter((scene) => scene.bankCount > 3)
      .map((scene) => ({
        sceneIndex: scene.index,
        sceneName: scene.name,
        bankCount: scene.bankCount,
        message: 'scene spans more than three data banks',
      })),
    sharedOrGlobalResources: unassignedResources.map(buildResourceUsageSummaryFromRecord),
    duplicationCandidates: unassignedResources
      .filter((resource) => resource.size > 0 && resource.size <= 128)
      .map((resource) => ({
        id: resource.id,
        label: resource.label,
        group: resource.group,
        type: resource.type,
        bank: resource.bank,
        storedSize: resource.size,
        uncompressedSize: resource.uncompressedSize,
      })),
  };
}

function replaceActiveResourceTableAsm(sourceCode, resourceTableAsm) {
  const lines = String(sourceCode || '').split(/\r?\n/);
  const entrySizeIndex = lines.findIndex((line) => /^\s*RESOURCE_TABLE_ENTRY_SIZE\s+EQU\b/i.test(line));
  if (entrySizeIndex === -1) return sourceCode;

  let start = entrySizeIndex;
  for (let i = entrySizeIndex; i >= 0; i--) {
    if (/^\s*;\s*=+\s*$/.test(lines[i]) && i + 1 < lines.length && /GENERATED RESOURCE TABLE/i.test(lines[i + 1])) {
      start = i;
      break;
    }
    if (/GENERATED RESOURCE TABLE/i.test(lines[i])) {
      start = i;
    }
  }

  let end = lines.findIndex((line, index) =>
    index > entrySizeIndex &&
    (/^\s*;\s*ZX0 decoder\b/i.test(line) || /^\s*dzx0_standard:\s*$/i.test(line) || /^\s*resource_manager_init:\s*$/i.test(line))
  );
  if (end === -1) return sourceCode;

  return [
    ...lines.slice(0, start),
    ...resourceTableAsm.split(/\r?\n/),
    '',
    ...lines.slice(end),
  ].join('\n');
}

function parseMegaromDataSection(sourceCode) {
  const lines = String(sourceCode || '').split(/\r?\n/);
  let sectionStart = lines.findIndex((line) => /;\s*DATA BANKS .+Zone-packed data/i.test(line));
  if (sectionStart === -1) return null;
  if (sectionStart > 0 && /^\s*;\s*=+\s*$/.test(lines[sectionStart - 1])) {
    sectionStart -= 1;
  }

  const sectionEnd = findMegaromDataSectionEnd(lines, sectionStart);
  if (sectionEnd === -1) return null;

  const sectionLines = lines.slice(sectionStart, sectionEnd);
  const sectionText = sectionLines.join('\n');
  const zoneSizeMatch = sectionText.match(/Zone-packed data \((\d+) bytes per zone\)/i);
  if (!zoneSizeMatch) return null;
  const zoneSize = parseInt(zoneSizeMatch[1], 10);
  const originalZoneCountMatch = sectionText.match(/Zones used:\s*(\d+)/i);
  const minimumZoneCount = originalZoneCountMatch ? parseInt(originalZoneCountMatch[1], 10) : 0;

  let dataStartAddress = null;
  const dataStartMatch = sectionText.match(/Data start address:\s*#([0-9A-F]+)/i);
  if (dataStartMatch) {
    dataStartAddress = parseInt(dataStartMatch[1], 16);
  }
  if (!Number.isFinite(dataStartAddress)) {
    const firstOrgMatch = sectionText.match(/^\s*org\s+#([0-9A-F]+)\s*$/im);
    if (firstOrgMatch) dataStartAddress = parseInt(firstOrgMatch[1], 16);
  }
  if (!Number.isFinite(zoneSize) || !Number.isFinite(dataStartAddress)) return null;
  const windowBaseMatch = sectionText.match(/\|\s*#([0-9A-F]+)/i);
  const windowMaskMatch = sectionText.match(/\(label\s*&\s*(#[0-9A-F]+)\)/i);
  const bankDivisorMatch = sectionText.match(/BANK_NUMBER\s*=\s*\(\(label\s*-\s*#4000\)\s*\/\s*(#[0-9A-F]+)\)/i);
  const dataWindowPageMatch = sectionText.match(/Accessed through mapper\s+(P[234])/i);
  const windowBaseAddress = windowBaseMatch ? parseInt(windowBaseMatch[1], 16) : 0xA000;

  const firstDiagSeparator = sectionLines.findIndex((line, idx) => idx > 0 && /^\s*;\s*-{10,}\s*$/.test(line));
  const firstOrgIndex = sectionLines.findIndex((line) => /^\s*org\s+#/i.test(line));
  if (firstDiagSeparator === -1 || firstOrgIndex === -1) return null;

  const dataLines = sectionLines.slice(firstOrgIndex);
  const blocks = [];
  const prelude = [];
  let currentLabel = null;
  let currentLines = [];
  let skipZoneBanner = 0;

  const flushCurrent = () => {
    if (!currentLabel) return;
    const blockText = currentLines.join('\n');
    const compressedMatch = blockText.match(/ZX0 compressed banked resource\s*\((\d+)\s*->\s*(\d+)\s*bytes\)/i);
    const byteSize = countAsmBytesInLines(currentLines);
    const bytes = currentLines.flatMap((line) => parseDbLineBytes(line) || []);
    const declaredRawSize = compressedMatch ? parseInt(compressedMatch[1], 10) : byteSize;
    const declaredStoredSize = compressedMatch ? parseInt(compressedMatch[2], 10) : byteSize;
    blocks.push({
      label: currentLabel,
      groupKey: getMegaromDataGroupKey(currentLabel),
      lines: currentLines.slice(),
      byteSize,
      bytes,
      compressed: Boolean(compressedMatch),
      uncompressedSize: Number.isFinite(declaredRawSize) ? declaredRawSize : byteSize,
      flags: compressedMatch ? 1 : 0,
      declaredStoredSize: Number.isFinite(declaredStoredSize) ? declaredStoredSize : byteSize,
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

  return {
    allLines: lines,
    sectionStart,
    sectionEnd,
    introLines: sectionLines.slice(0, firstDiagSeparator),
    zoneSize,
    dataStartAddress,
    windowBaseAddress,
    windowBase: formatAsmAddress(windowBaseAddress),
    windowMask: windowMaskMatch ? windowMaskMatch[1].toUpperCase() : (zoneSize === 16384 ? '#3FFF' : '#1FFF'),
    bankDivisor: bankDivisorMatch ? bankDivisorMatch[1].toUpperCase() : (zoneSize === 16384 ? '#4000' : '#2000'),
    dataWindowPage: dataWindowPageMatch ? dataWindowPageMatch[1].toLowerCase() : 'p3',
    minimumZoneCount: Number.isFinite(minimumZoneCount) ? minimumZoneCount : 0,
    blocks,
  };
}

function packMegaromResourceBlocks(blocks, dataStartAddress, zoneSize, minimumZoneCount = 0) {
  const units = [];
  for (const block of blocks) {
    const shouldMerge = (block.groupKey === 'patterns' || block.groupKey === 'colors') &&
      units.length > 0 &&
      units[units.length - 1].groupKey === block.groupKey;

    if (shouldMerge) {
      const currentUnit = units[units.length - 1];
      currentUnit.labelOffsets.set(block.label, currentUnit.byteSize);
      currentUnit.labels.push(block.label);
      currentUnit.byteSize += block.byteSize;
      if (currentUnit.lines.length > 0 && currentUnit.lines[currentUnit.lines.length - 1] !== '') {
        currentUnit.lines.push('');
      }
      currentUnit.lines.push(...block.lines);
      currentUnit.blocks.push(block);
      continue;
    }

    units.push({
      groupKey: block.groupKey,
      labels: [block.label],
      lines: block.lines.slice(),
      byteSize: block.byteSize,
      labelOffsets: new Map([[block.label, 0]]),
      blocks: [block],
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
        `MegaROM ZX0 data zone overflow: ${unit.labels.join(', ')} (${unit.byteSize} bytes > zone ${zoneSize})`
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
  while (Number.isFinite(minimumZoneCount) && zones.length < minimumZoneCount) {
    const orgAddress = dataStartAddress + (zoneIndex * zoneSize);
    const endAddress = orgAddress + zoneSize;
    zones.push({
      zoneIndex,
      orgAddress,
      endAddress,
      physicalBank: (orgAddress - 0x4000) / zoneSize,
      usedBytes: 0,
      remainingBytes: zoneSize,
      units: [],
    });
    zoneIndex += 1;
  }

  return { units, zones };
}

function renderMegaromDataSection(introLines, zones, zoneSize, dataStartAddress) {
  const totalBytes = zones.reduce((sum, zone) => sum + zone.usedBytes, 0);
  const diagnosticsLines = [
    '; ------------------------------------------------------------------',
    '; MEGAROM DATA ZONE PACKER (post-ZX0 final sizes)',
    `; Zone size: ${zoneSize} bytes`,
    `; Data start address: ${formatAsmAddress(dataStartAddress)}`,
    `; Total data bytes (post-ZX0 / final): ${totalBytes}`,
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

  return [
    ...introLines,
    ...diagnosticsLines,
    '',
    ...zoneAsmLines,
  ];
}

function updateMegaromCompressionArtifacts({
  sourceCode,
  manifest,
  manifestV2,
  banks,
  projectUsage,
  segmentBudget,
  resources,
  zones,
  zoneSize,
  dataStartAddress,
  windowBaseAddress,
  resourceTableAsm,
}) {
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
  const resourceByLabel = new Map(resources.map((resource) => [String(resource.label).toUpperCase(), resource]));
  for (const zone of zones) {
    for (const unit of zone.units) {
      for (const block of unit.blocks || []) {
        const resource = resourceByLabel.get(String(block.label).toUpperCase());
        if (!resource) continue;
        const labelOffset = unit.labelOffsets?.get(block.label) || 0;
        resource.placementReason = describeMegaromPlacement(resource, zone, unit, labelOffset);
      }
    }
  }

  const zoneResources = zones.map((zone) => ({
    zone,
    resources: zone.units.flatMap((unit) =>
      unit.blocks
        .map((block) => resourceByLabel.get(String(block.label).toUpperCase()))
        .filter(Boolean)
    ),
  }));

  if (manifest?.summary) {
    manifest.summary.totalSourceBytes = resources.reduce((sum, resource) => sum + resource.uncompressedSize, 0);
    manifest.summary.totalStoredBytes = resources.reduce((sum, resource) => sum + resource.size, 0);
    manifest.summary.resourceCount = resources.length;
    manifest.summary.zoneCount = zones.length;
    manifest.summary.overflowCount = 0;
    manifest.summary.compressedResourceCount = resources.filter((resource) => resource.flags & 0x01).length;
  }
  const mapperInfo = {
    mapperFormat: manifest?.mapper?.format || banks?.mapperFormat || projectUsage?.mapper?.format || (zoneSize === 16384 ? 'ascii16' : 'konami'),
    segmentSize: zoneSize,
    dataWindowPage: manifest?.mapper?.dataWindowPage || banks?.dataWindow?.page || projectUsage?.mapper?.dataWindowPage || 'p3',
    windowBase: manifest?.mapper?.windowBase || banks?.dataWindow?.base || projectUsage?.mapper?.windowBase || formatAsmAddress(windowBaseAddress || 0xA000),
    windowMask: manifest?.mapper?.windowMask || banks?.dataWindow?.mask || projectUsage?.mapper?.windowMask || (zoneSize === 16384 ? '#3FFF' : '#1FFF'),
    bankDivisor: manifest?.mapper?.bankDivisor || banks?.dataWindow?.bankDivisor || projectUsage?.mapper?.bankDivisor || (zoneSize === 16384 ? '#4000' : '#2000'),
  };
  if (manifest) {
    manifest.mapper = {
      ...(manifest.mapper || {}),
      format: mapperInfo.mapperFormat,
      dataWindowPage: mapperInfo.dataWindowPage,
      windowBase: mapperInfo.windowBase,
      windowMask: mapperInfo.windowMask,
      bankDivisor: mapperInfo.bankDivisor,
      zoneSize,
    };
  }

  manifest.banks = zoneResources.map(({ zone, resources: zoneResourceList }) => {
    const resourceSummaries = zoneResourceList.map((resource) => ({
      id: resource.id,
      label: resource.label,
      resourceIdLabel: resource.resourceIdLabel,
      group: resource.group,
      type: resource.type,
      bank: resource.bank,
      zoneOffset: resource.zoneOffset,
      physicalAddress: resource.physicalAddress,
      windowAddress: resource.windowAddress,
      size: resource.size,
      storedSize: resource.size,
      uncompressedSize: resource.uncompressedSize,
      flags: resource.flags || 0,
      sourceIndex: resource.sourceIndex,
      placementReason: resource.placementReason,
    }));
    return {
      bank: zone.physicalBank,
      zoneIndex: zone.zoneIndex,
      orgAddress: zone.orgAddress,
      endAddress: zone.endAddress,
      usedBytes: zone.usedBytes,
      freeBytes: zone.remainingBytes,
      verification: buildBankVerificationFromResources(zone.physicalBank, zone.usedBytes, resourceSummaries),
      resources: resourceSummaries,
    };
  });
  manifest.overflow = [];

  banks.segmentSize = zoneSize;
  banks.mapperFormat = mapperInfo.mapperFormat;
  banks.dataWindow = {
    ...(banks.dataWindow || {}),
    page: mapperInfo.dataWindowPage,
    base: mapperInfo.windowBase,
    mask: mapperInfo.windowMask,
    bankDivisor: mapperInfo.bankDivisor,
  };
  banks.banks = zoneResources.map(({ zone, resources: zoneResourceList }) => {
    const resourceSummaries = zoneResourceList.map((resource) => ({
      id: resource.id,
      label: resource.label,
      bank: resource.bank,
      offset: resource.zoneOffset,
      address: resource.windowAddress,
      size: resource.size,
      storedSize: resource.size,
      uncompressedSize: resource.uncompressedSize,
      flags: resource.flags || 0,
      group: resource.group,
      type: resource.type,
      placementReason: resource.placementReason,
    }));
    return {
      bank: zone.physicalBank,
      origin: zone.orgAddress,
      end: zone.endAddress,
      usedBytes: zone.usedBytes,
      freeBytes: zone.remainingBytes,
      verification: buildBankVerificationFromResources(zone.physicalBank, zone.usedBytes, resourceSummaries),
      resources: resourceSummaries,
    };
  });
  banks.overflow = [];

  if (projectUsage?.counts) {
    projectUsage.counts.bankedResources = resources.length;
  }
  projectUsage.mapper = {
    ...(projectUsage.mapper || {}),
    format: mapperInfo.mapperFormat,
    segmentSize: zoneSize,
    dataWindowPage: mapperInfo.dataWindowPage,
    windowBase: mapperInfo.windowBase,
    windowMask: mapperInfo.windowMask,
    bankDivisor: mapperInfo.bankDivisor,
  };
  projectUsage.bankedResources = [...resources]
    .sort((left, right) => left.id - right.id)
    .map((resource) => ({
      id: resource.id,
      label: resource.label,
      group: resource.group,
      type: resource.type,
      bank: resource.bank,
      windowAddress: resource.windowAddress,
      size: resource.size,
      storedSize: resource.size,
      uncompressedSize: resource.uncompressedSize,
      flags: resource.flags || 0,
      placementReason: resource.placementReason,
    }));
  refreshProjectUsageScenes(projectUsage, resources);
  const loadPlan = buildLoadPlanFromProjectUsage(projectUsage);
  const bankOptimizer = buildBankOptimizerFromProjectUsage(projectUsage, resources, zones, mapperInfo);
  const refreshedManifestV2 = manifestV2
    ? buildManifestV2FromRecords(manifestV2, resources, zones, mapperInfo, zoneSize, dataStartAddress)
    : null;

  if (Array.isArray(segmentBudget?.dataBanks)) {
    segmentBudget.dataBanks = zones.map((zone) => ({
      bank: zone.physicalBank,
      role: 'asset_data',
      orgAddress: zone.orgAddress,
      endAddress: zone.endAddress,
      usedBytes: zone.usedBytes,
      freeBytes: zone.remainingBytes,
      resources: zoneResources.find((entry) => entry.zone === zone)?.resources.length || 0,
    }));
  }

  let code = sourceCode;
  code = replaceMideasArtifactCommentBlock(code, 'resource_table.asm', resourceTableAsm);
  code = replaceMideasArtifactCommentBlock(code, 'packing_manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  if (refreshedManifestV2) {
    code = replaceMideasArtifactCommentBlock(code, 'manifest_v2.json', JSON.stringify(refreshedManifestV2, null, 2) + '\n');
  }
  code = replaceMideasArtifactCommentBlock(code, 'banks.json', JSON.stringify(banks, null, 2) + '\n');
  code = replaceMideasArtifactCommentBlock(code, 'project_usage.json', JSON.stringify(projectUsage, null, 2) + '\n');
  code = replaceMideasArtifactCommentBlock(code, 'load_plan.json', JSON.stringify(loadPlan, null, 2) + '\n');
  code = replaceMideasArtifactCommentBlock(code, 'bank_optimizer.json', JSON.stringify(bankOptimizer, null, 2) + '\n');
  code = replaceMideasArtifactCommentBlock(code, 'segment_budget.json', JSON.stringify(segmentBudget, null, 2) + '\n');

  const manifestTextLines = [
    'MEGAROM PACKING MANIFEST',
    `Zone size: ${zoneSize}`,
    `Data start address: ${formatAsmAddress(dataStartAddress)}`,
    `Total resource blocks: ${resources.length}`,
    '',
  ];
  for (const { zone, resources: zoneResourceList } of zoneResources) {
    manifestTextLines.push(`BANK ${String(zone.physicalBank).padStart(2, '0')} used ${zone.usedBytes} / ${zoneSize}`);
    for (const resource of zoneResourceList) {
      manifestTextLines.push(
        `- ${String(resource.label).padEnd(32)} ` +
        `${String(resource.size).padStart(5, ' ')} stored / ` +
        `${String(resource.uncompressedSize).padStart(5, ' ')} raw bytes ` +
        `@ ${formatAsmAddress(resource.windowAddress)} ` +
        `(rom ${formatAsmAddress(resource.physicalAddress)}, offset +${formatAsmAddress(resource.zoneOffset)}) ` +
        `[${resource.group}/${resource.type}] flags=${resource.flags || 0}`
      );
      manifestTextLines.push(`  reason: ${resource.placementReason || 'placement reason unavailable'}`);
    }
    manifestTextLines.push(`FREE ${zone.remainingBytes}`);
    manifestTextLines.push('');
  }
  code = replaceMideasArtifactCommentBlock(code, 'packing_manifest.txt', manifestTextLines.join('\n').trimEnd() + '\n');

  return { code, resourceById };
}

async function injectZx0IntoMegaromResourceTableAsm(sourceCode, tempDir, info, onProgress = null) {
  const manifest = parseMideasJsonArtifact(sourceCode, 'packing_manifest.json');
  const manifestV2 = parseMideasJsonArtifact(sourceCode, 'manifest_v2.json');
  const banks = parseMideasJsonArtifact(sourceCode, 'banks.json');
  const projectUsage = parseMideasJsonArtifact(sourceCode, 'project_usage.json');
  const segmentBudget = parseMideasJsonArtifact(sourceCode, 'segment_budget.json');
  if (!manifest || !manifestV2 || !banks || !projectUsage || !segmentBudget) {
    info.warning = 'ZX0 skipped: missing generated MegaROM artifacts for resource_table rewrite';
    return { code: sourceCode, info };
  }

  const parsedData = parseMegaromDataSection(sourceCode);
  if (!parsedData || ![8192, 16384].includes(parsedData.zoneSize)) {
    info.warning = 'ZX0 skipped: unable to parse supported MegaROM DATA BANKS section';
    return { code: sourceCode, info };
  }

  const resources = [];
  for (const bank of manifest.banks || []) {
    for (const resource of bank.resources || []) {
      resources.push({
        id: resource.id,
        label: resource.label,
        resourceIdLabel: resource.resourceIdLabel,
        group: resource.group,
        type: resource.type,
        bank: resource.bank,
        zoneOffset: resource.zoneOffset,
        physicalAddress: resource.physicalAddress,
        windowAddress: resource.windowAddress,
        size: resource.size,
        uncompressedSize: resource.uncompressedSize || resource.size,
        flags: resource.flags || 0,
        sourceIndex: resource.sourceIndex,
      });
    }
  }

  const compressPresentationName = parsePresentationCompressionFlag(sourceCode, 'PRESENTATION_SCREEN_COMPRESS_NAMETBL', true);
  const compressPresentationPatterns = parsePresentationCompressionFlag(sourceCode, 'PRESENTATION_SCREEN_COMPRESS_PATTERNS', true);
  const compressPresentationColors = parsePresentationCompressionFlag(sourceCode, 'PRESENTATION_SCREEN_COMPRESS_COLORS', true);
  const isPresentationResourceZx0Candidate = (resource) => {
    const label = String(resource?.label || '').toUpperCase();
    if (label === 'PRESENTATION_SCREEN_NAMETBL') return compressPresentationName;
    if (/^PRESENTATION_SCREEN_PATTERNS_B[0-2]$/.test(label)) return compressPresentationPatterns;
    if (/^PRESENTATION_SCREEN_COLORS_B[0-2]$/.test(label)) return compressPresentationColors;
    return false;
  };

  const resourceByLabel = new Map(resources.map((resource) => [String(resource.label).toUpperCase(), resource]));
  const selectedResources = resources.filter((resource) =>
    isResourceTableZx0Candidate(resource) || isPresentationResourceZx0Candidate(resource)
  );
  const selectedResourceLabels = new Set(selectedResources.map((resource) => String(resource.label).toUpperCase()));

  info.attempted = true;
  info.candidateScreens = selectedResources.filter((resource) => String(resource.group || '').toUpperCase() === 'SCREENS').length;
  info.candidateTilePatterns = selectedResources.filter((resource) => String(resource.type || '').toUpperCase() === 'TILE_PATTERNS').length;
  info.candidateTileColors = selectedResources.filter((resource) => String(resource.type || '').toUpperCase() === 'TILE_COLORS').length;
  info.candidateFontPatterns = selectedResources.filter((resource) => String(resource.type || '').toUpperCase() === 'FONT_PATTERNS').length;
  info.candidateFontColors = selectedResources.filter((resource) => String(resource.type || '').toUpperCase() === 'FONT_COLORS').length;
  info.candidateSpritePatterns = selectedResources.filter((resource) => String(resource.type || '').toUpperCase() === 'SPRITE_PATTERNS').length;
  const blockByLabel = new Map(parsedData.blocks.map((block) => [String(block.label).toUpperCase(), block]));

  for (const resource of resources) {
    const label = String(resource.label || '').toUpperCase();
    if (!isDirectRomScreenBlockCatalog(label)) continue;
    const block = blockByLabel.get(label);
    if (block?.compressed || (resource.flags & 0x01)) {
      throw createDirectRomCatalogCompressedError(label);
    }
    resource.flags = 0;
    resource.uncompressedSize = resource.size;
  }

  let completed = 0;
  const candidates = [...selectedResourceLabels].filter((label) => blockByLabel.has(label));

  const emitProgress = (message, phase = 'megaromResources') => {
    if (typeof onProgress === 'function') {
      onProgress({ message, phase, current: completed, total: candidates.length });
    }
  };

  emitProgress('Compress banked resources...');
  for (const label of candidates) {
    const block = blockByLabel.get(label);
    const resource = resourceByLabel.get(label);
    if (block.compressed) {
      resource.size = block.byteSize;
      resource.uncompressedSize = block.uncompressedSize || block.byteSize;
      resource.flags = block.flags || 1;
      info.originalBytes += resource.uncompressedSize;
      info.compressedBytes += block.byteSize;
      info.savedBytes += Math.max(0, resource.uncompressedSize - block.byteSize);
      completed += 1;
      emitProgress(`Repair compressed banked resources ${completed}/${candidates.length}`);
      continue;
    }
    if (block.byteSize !== block.bytes.length) {
      info.originalBytes += block.byteSize;
      info.compressedBytes += block.byteSize;
      completed += 1;
      emitProgress(`Compress banked resources ${completed}/${candidates.length}`);
      continue;
    }
    info.originalBytes += block.bytes.length;
    try {
      const compressed = await runZx0CompressionAsync(block.bytes, tempDir);
      if (compressed.length < block.bytes.length) {
        block.lines = [
          block.lines[0],
          `    ; ZX0 compressed banked resource (${block.bytes.length} -> ${compressed.length} bytes)`,
          ...formatAsmDbLines(Array.from(compressed.values())),
        ];
        block.byteSize = compressed.length;
        block.compressed = true;
        block.uncompressedSize = block.bytes.length;
        block.flags = 1;
        resource.size = compressed.length;
        resource.uncompressedSize = block.bytes.length;
        resource.flags = 1;
        info.compressedBytes += compressed.length;
        info.savedBytes += (block.bytes.length - compressed.length);
        const resourceType = String(resource.type || '').toUpperCase();
        if (resourceType === 'TILE_PATTERNS' || resourceType === 'SCREEN_PATTERNS') {
          info.compressedTilePatterns += 1;
        } else if (resourceType === 'TILE_COLORS' || resourceType === 'SCREEN_COLORS') {
          info.compressedTileColors += 1;
        } else if (resourceType === 'FONT_PATTERNS') {
          info.compressedFontPatterns += 1;
        } else if (resourceType === 'FONT_COLORS') {
          info.compressedFontColors += 1;
        } else if (resourceType === 'SPRITE_PATTERNS') {
          info.compressedSpritePatterns += 1;
        } else if (resource.group === 'SCREENS') {
          info.compressedScreens += 1;
        }
      } else {
        info.compressedBytes += block.bytes.length;
      }
    } catch (err) {
      if (!info.warning) {
        info.warning = `ZX0 compression failed for banked resource ${block.label}: ${err.message}`;
      }
      info.compressedBytes += block.bytes.length;
    }
    completed += 1;
    emitProgress(`Compress banked resources ${completed}/${candidates.length}`);
  }

  const compressedResourceCount = resources.filter((resource) => resource.flags & 0x01).length;
  if (compressedResourceCount === 0) {
    info.netSavedBytes = 0;
    emitProgress('ZX0 compression finished', 'finalize');
    return { code: sourceCode, info };
  }

  const { zones } = packMegaromResourceBlocks(
    parsedData.blocks,
    parsedData.dataStartAddress,
    parsedData.zoneSize,
    parsedData.minimumZoneCount
  );
  const mapperFormat = String(manifest?.mapper?.format || (parsedData.zoneSize === 16384 ? 'ascii16' : '')).toLowerCase();
  const placementByLabel = new Map();
  for (const zone of zones) {
    for (const unit of zone.units) {
      for (const block of unit.blocks) {
        const labelOffset = unit.labelOffsets.get(block.label) || 0;
        const zoneOffset = unit.zoneOffset + labelOffset;
        placementByLabel.set(String(block.label).toUpperCase(), {
          bank: resolveResourceRuntimeBank(zone.physicalBank, mapperFormat),
          zoneOffset,
          physicalAddress: zone.orgAddress + zoneOffset,
          windowAddress: parsedData.windowBaseAddress + zoneOffset,
          size: block.byteSize,
          uncompressedSize: block.uncompressedSize || block.byteSize,
          flags: block.flags || 0,
        });
      }
    }
  }

  for (const resource of resources) {
    const placement = placementByLabel.get(String(resource.label).toUpperCase());
    if (!placement) continue;
    resource.bank = placement.bank;
    resource.zoneOffset = placement.zoneOffset;
    resource.physicalAddress = placement.physicalAddress;
    resource.windowAddress = placement.windowAddress;
    resource.size = placement.size;
    resource.uncompressedSize = placement.uncompressedSize;
    resource.flags = placement.flags;
  }

  const rebuiltSection = renderMegaromDataSection(
    parsedData.introLines,
    zones,
    parsedData.zoneSize,
    parsedData.dataStartAddress
  );
  let finalCode = [
    ...parsedData.allLines.slice(0, parsedData.sectionStart),
    ...rebuiltSection,
    ...parsedData.allLines.slice(parsedData.sectionEnd),
  ].join('\n');

  const resourceTableAsm = buildResourceTableAsmFromRecords(resources);
  finalCode = replaceActiveResourceTableAsm(finalCode, resourceTableAsm);
  const artifactResult = updateMegaromCompressionArtifacts({
    sourceCode: finalCode,
    manifest,
    manifestV2,
    banks,
    projectUsage,
    segmentBudget,
    resources,
    zones,
    zoneSize: parsedData.zoneSize,
    dataStartAddress: parsedData.dataStartAddress,
    windowBaseAddress: parsedData.windowBaseAddress,
    resourceTableAsm,
  });
  finalCode = artifactResult.code;

  info.applied = true;
  info.netSavedBytes = info.savedBytes;
  info.warning = info.warning || null;
  emitProgress('ZX0 compression finished', 'finalize');
  return { code: finalCode, info };
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
    screenBlockMaps     = true,
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
    candidateScreenBlockMaps: 0,
    candidateEffects: 0,
    candidateBehaviorMaps: 0,
    candidateTilePatterns: 0,
    candidateTileColors: 0,
    candidateFontPatterns: 0,
    candidateFontColors: 0,
    candidateSpritePatterns: 0,
    compressedScreens: 0,
    compressedScreenBlockMaps: 0,
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
  const hasBlockCatalogData = /SCREEN_[A-Z0-9_]+_\d+_BLOCK_CATALOG:/.test(sourceCode);
  const hasBlockMapData = /SCREEN_[A-Z0-9_]+_\d+_BLOCK_MAP:/.test(sourceCode);
  const hasEffectsData = /SCREEN_[A-Z0-9_]+_\d+_EFFECTS_LAYOUT:/.test(sourceCode);
  const hasBehaviorData = /BEHAVIOR_[A-Z0-9_]+_\d+_DATA:/.test(sourceCode);
  const hasPresentationNameData = /^\s*PRESENTATION_SCREEN_NAMETBL:\s*$/im.test(sourceCode);
  const hasPresentationPatternData = /^\s*PRESENTATION_SCREEN_PATTERNS_B[0-2]:\s*$/im.test(sourceCode);
  const hasPresentationColorData = /^\s*PRESENTATION_SCREEN_COLORS_B[0-2]:\s*$/im.test(sourceCode);
  const hasScreen4NameData = /^\s*[A-Z0-9_]*SCREEN_4[A-Z0-9_]*_NAMES:\s*$/im.test(sourceCode);
  const hasScreen4EffectsData = /^\s*[A-Z0-9_]*SCREEN_4[A-Z0-9_]*_EFFECTS:\s*$/im.test(sourceCode);
  const hasScreen4PatternData = /^\s*[A-Z0-9_]*SCREEN_4[A-Z0-9_]*_BANK_[0-2]_PATTERNS:\s*$/im.test(sourceCode);
  const hasScreen4ColorData = /^\s*[A-Z0-9_]*SCREEN_4[A-Z0-9_]*_BANK_[0-2]_COLORS:\s*$/im.test(sourceCode);
  const hasTilePatternData = /^\s*tile_pattern_[a-z0-9_]+:\s*$/im.test(sourceCode);
  const hasTileColorData = /^\s*tile_color_[a-z0-9_]+:\s*$/im.test(sourceCode);
  const hasFontPatternData = /^\s*FONT_PATTERN_DATA:\s*$/im.test(sourceCode);
  const hasFontColorData = /^\s*FONT_COLOR_DATA:\s*$/im.test(sourceCode);
  const hasSpritePatternData = /^\s*(?:[A-Z][A-Z0-9_]*_F\d+_LAYER\d+|SPRITE_PLACEHOLDER_PATTERN):\s*$/im.test(sourceCode);
  if (
    !hasLayoutData &&
    !hasBlockCatalogData &&
    !hasBlockMapData &&
    !hasEffectsData &&
    !hasBehaviorData &&
    !hasPresentationNameData &&
    !hasPresentationPatternData &&
    !hasPresentationColorData &&
    !hasScreen4NameData &&
    !hasScreen4EffectsData &&
    !hasScreen4PatternData &&
    !hasScreen4ColorData &&
    !hasTilePatternData &&
    !hasTileColorData &&
    !hasFontPatternData &&
    !hasFontColorData &&
    !hasSpritePatternData
  ) {
    return { code: sourceCode, info };
  }

  const sourceHasZx0Routine = /^\s*dzx0_standard:/im.test(sourceCode);
  const usesResourceManager = /^\s*resource_table:\s*$/im.test(sourceCode);
  if (usesResourceManager) {
    return injectZx0IntoMegaromResourceTableAsm(sourceCode, tempDir, info, onProgress);
  }
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
  const screenRuntimeDataInPage0 = /^\s*;\s*SCREEN_RUNTIME_DATA_ROM_DATA_GROUP:\s*page0\s*$/im.test(sourceCode);
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
  const blockCatalogBlocks = collectAsmDataBlocks(lines, /^\s*(SCREEN_[A-Z0-9_]+_\d+_BLOCK_CATALOG):\s*$/);
  const blockMapBlocks = collectAsmDataBlocks(lines, /^\s*(SCREEN_[A-Z0-9_]+_\d+_BLOCK_MAP):\s*$/);
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
  const screen4NameBlocks = collectAsmDataBlocks(lines, /^\s*([A-Z0-9_]*SCREEN_4[A-Z0-9_]*_NAMES):\s*$/);
  const screen4EffectsBlocks = collectAsmDataBlocks(lines, /^\s*([A-Z0-9_]*SCREEN_4[A-Z0-9_]*_EFFECTS):\s*$/);
  const screen4PatternBlocks = collectAsmDataBlocks(lines, /^\s*([A-Z0-9_]*SCREEN_4[A-Z0-9_]*_BANK_[0-2]_PATTERNS):\s*$/);
  const screen4ColorBlocks = collectAsmDataBlocks(lines, /^\s*([A-Z0-9_]*SCREEN_4[A-Z0-9_]*_BANK_[0-2]_COLORS):\s*$/);
  const tilePatternBlocks = collectAsmDataBlocks(lines, /^\s*(tile_pattern_[a-z0-9_]+):\s*$/i);
  const tileColorBlocks = collectAsmDataBlocks(lines, /^\s*(tile_color_[a-z0-9_]+):\s*$/i);
  const fontPatternBlocks = collectAsmDataBlocks(lines, /^\s*(FONT_PATTERN_DATA):\s*$/i);
  const fontColorBlocks = collectAsmDataBlocks(lines, /^\s*(FONT_COLOR_DATA):\s*$/i);
  const spritePatternBlocks = collectAsmDataBlocks(lines, /^\s*([A-Z][A-Z0-9_]*_F\d+_LAYER\d+|SPRITE_PLACEHOLDER_PATTERN):(?:\s*;.*)?\s*$/);

  if (
    layoutBlocks.length === 0 &&
    blockCatalogBlocks.length === 0 &&
    blockMapBlocks.length === 0 &&
    presentationNameBlocks.length === 0 &&
    screen4NameBlocks.length === 0 &&
    effectsBlocks.length === 0 &&
    screen4EffectsBlocks.length === 0 &&
    behaviorBlocks.length === 0 &&
    presentationPatternBlocks.length === 0 &&
    presentationColorBlocks.length === 0 &&
    screen4PatternBlocks.length === 0 &&
    screen4ColorBlocks.length === 0 &&
    tilePatternBlocks.length === 0 &&
    tileColorBlocks.length === 0 &&
    fontPatternBlocks.length === 0 &&
    fontColorBlocks.length === 0 &&
    spritePatternBlocks.length === 0
  ) {
    return { code: sourceCode, info };
  }

  const allLayoutBlocks = [...layoutBlocks, ...presentationNameBlocks, ...screen4NameBlocks];
  const allScreenBlockMapBlocks = [...blockCatalogBlocks, ...blockMapBlocks];
  const allEffectsBlocks = [...effectsBlocks, ...screen4EffectsBlocks];
  const allTilePatternBlocks = [...tilePatternBlocks, ...presentationPatternBlocks, ...screen4PatternBlocks];
  const allTileColorBlocks = [...tileColorBlocks, ...presentationColorBlocks, ...screen4ColorBlocks];

  info.candidateScreens = allLayoutBlocks.length;
  info.candidateScreenBlockMaps = allScreenBlockMapBlocks.length;
  info.candidateEffects = allEffectsBlocks.length;
  info.candidateBehaviorMaps = behaviorBlocks.length;
  info.candidateTilePatterns = allTilePatternBlocks.length;
  info.candidateTileColors = allTileColorBlocks.length;
  info.candidateFontPatterns = fontPatternBlocks.length;
  info.candidateFontColors = fontColorBlocks.length;
  info.candidateSpritePatterns = spritePatternBlocks.length;

  const enabledProgressGroups = [
    screens ? { phase: 'screens', label: 'Compress screen layouts', count: allLayoutBlocks.length } : null,
    screenBlockMaps ? { phase: 'screenBlockMaps', label: 'Compress screen block maps', count: allScreenBlockMapBlocks.length } : null,
    effects ? { phase: 'effects', label: 'Compress effects layouts', count: allEffectsBlocks.length } : null,
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
  const selectedBlockCatalogBlocks = new Map();
  const selectedBlockMapBlocks = new Map();
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
          } else if (kind === 'screen_block_catalog') {
            selectedBlockCatalogBlocks.set(block.label.toUpperCase(), selected);
            info.compressedScreenBlockMaps += 1;
          } else if (kind === 'screen_block_map') {
            selectedBlockMapBlocks.set(block.label.toUpperCase(), selected);
            info.compressedScreenBlockMaps += 1;
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
  if (screenBlockMaps) {
    await processBlocks(blockCatalogBlocks, 'screen_block_catalog', 'Compress screen block catalogs', 'screenBlockMaps');
    await processBlocks(blockMapBlocks, 'screen_block_map', 'Compress screen block maps', 'screenBlockMaps');
  }
  if (effects)      await processBlocks(allEffectsBlocks, 'effects', 'Compress effects layouts', 'effects');
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
    selectedBlockCatalogBlocks.size +
    selectedBlockMapBlocks.size +
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
    ...selectedBlockCatalogBlocks.values(),
    ...selectedBlockMapBlocks.values(),
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
  const compressedBlockCatalogLabels = new Set(Array.from(selectedBlockCatalogBlocks.keys()));
  const compressedBlockMapLabels = new Set(Array.from(selectedBlockMapBlocks.keys()));
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
  let inLoadScreen4 = false;
  let inInitMsx2EffectBuffers = false;
  let inLoadPattern = false;
  let inLoadColor = false;
  let layoutDecompressedInCurrentFunction = false;
  let blockCatalogDecompressedInCurrentFunction = false;
  let blockMapDecompressedInCurrentFunction = false;
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
  let skipPage0CopyToRamAfterZx0 = false;
  let skipMsx2EffectRawCopyAfterZx0 = false;

  for (const line of rebuilt) {
    if (skipPage0CopyToRamAfterZx0) {
      if (/^\s*ld\s+de\s*,/i.test(line) || /^\s*ld\s+bc\s*,/i.test(line)) {
        continue;
      }
      if (/^\s*call\s+page0_copy_to_ram\s*$/i.test(line)) {
        skipPage0CopyToRamAfterZx0 = false;
        continue;
      }
      skipPage0CopyToRamAfterZx0 = false;
    }

    if (skipMsx2EffectRawCopyAfterZx0) {
      if (/^\s*ld\s+(?:de|bc)\s*,/i.test(line)) {
        continue;
      }
      if (/^\s*ldir\s*(?:;.*)?$/i.test(line)) {
        skipMsx2EffectRawCopyAfterZx0 = false;
        continue;
      }
      skipMsx2EffectRawCopyAfterZx0 = false;
    }

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
      inLoadScreen4 = false;
      inInitMsx2EffectBuffers = false;
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
      if (!/^\s*init_msx2_effect_buffers:\s*$/i.test(line)) {
        inInitMsx2EffectBuffers = false;
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
      inLoadScreen4 = false;
      inInitMsx2EffectBuffers = false;
      inLoadPattern = false;
      inLoadColor = false;
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
      inShowPresentationScreen = false;
      layoutDecompressedInCurrentFunction = false;
      blockCatalogDecompressedInCurrentFunction = false;
      blockMapDecompressedInCurrentFunction = false;
      behaviorDecompressedInCurrentFunction = false;
      patternDecompressedInCurrentFunction = false;
      colorDecompressedInCurrentFunction = false;
      patched.push(line);
      continue;
    }

    if (/^\s*load_[A-Z0-9_]+_screen4:\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadScreen4 = true;
      inInitMsx2EffectBuffers = false;
      inLoadPattern = false;
      inLoadColor = false;
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
      inShowPresentationScreen = false;
      layoutDecompressedInCurrentFunction = false;
      blockCatalogDecompressedInCurrentFunction = false;
      blockMapDecompressedInCurrentFunction = false;
      behaviorDecompressedInCurrentFunction = false;
      patternDecompressedInCurrentFunction = false;
      colorDecompressedInCurrentFunction = false;
      patched.push(line);
      continue;
    }

    if (/^\s*init_msx2_effect_buffers:\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadScreen4 = false;
      inInitMsx2EffectBuffers = true;
      inLoadPattern = false;
      inLoadColor = false;
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
      inShowPresentationScreen = false;
      patched.push(line);
      continue;
    }

    if (/^\s*load_pattern_[a-z0-9_]+:\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadScreen4 = false;
      inInitMsx2EffectBuffers = false;
      inLoadPattern = true;
      inLoadColor = false;
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
      inShowPresentationScreen = false;
      layoutDecompressedInCurrentFunction = false;
      blockCatalogDecompressedInCurrentFunction = false;
      blockMapDecompressedInCurrentFunction = false;
      behaviorDecompressedInCurrentFunction = false;
      patternDecompressedInCurrentFunction = false;
      colorDecompressedInCurrentFunction = false;
      patched.push(line);
      continue;
    }

    if (/^\s*load_color_[a-z0-9_]+:\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadScreen4 = false;
      inInitMsx2EffectBuffers = false;
      inLoadPattern = false;
      inLoadColor = true;
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inSubmenuPrepareCursor = false;
      inShowPresentationScreen = false;
      layoutDecompressedInCurrentFunction = false;
      blockCatalogDecompressedInCurrentFunction = false;
      blockMapDecompressedInCurrentFunction = false;
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
          if (screenRuntimeDataInPage0) {
            patched.push('    ; Decompress ZX0 page-0 screen layout into RAM buffer');
            patched.push(`    ld hl, ${hlLayoutMatch.label}`);
            patched.push(`    ld de, ${screenBufferSymbol}`);
            patched.push('    call page0_decompress_to_ram');
            patched.push(`    ld hl, ${screenBufferSymbol}${offset}`);
            skipPage0CopyToRamAfterZx0 = true;
            layoutDecompressedInCurrentFunction = true;
            continue;
          }
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

    const hlScreen4NameMatch = matchAsmLabelLoad(line, 'hl', '[A-Z0-9_]+_NAMES');
    if (inLoadScreen4 && hlScreen4NameMatch) {
      const layoutLabel = hlScreen4NameMatch.label.toUpperCase();
      if (compressedLayoutLabels.has(layoutLabel)) {
        patched.push('    ; Decompress ZX0 screen4 name table into RAM buffer');
        patched.push('    di');
        patched.push(`    ld hl, ${hlScreen4NameMatch.label}`);
        patched.push(`    ld de, ${screenBufferSymbol}`);
        patched.push('    call dzx0_standard');
        patched.push('    ei');
        patched.push(`    ld hl, ${screenBufferSymbol}`);
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

    const hlBlockCatalogMatch = matchAsmLabelLoad(line, 'hl', 'SCREEN_[A-Z0-9_]+_\\d+_BLOCK_CATALOG');
    if (inLoadScreen && hlBlockCatalogMatch) {
      const blockCatalogLabel = hlBlockCatalogMatch.label.toUpperCase();
      const offset = hlBlockCatalogMatch.offset;
      if (compressedBlockCatalogLabels.has(blockCatalogLabel)) {
        if (screenRuntimeDataInPage0) {
          patched.push('    ; Decompress ZX0 page-0 screen block catalog into runtime_effects_layout');
          patched.push(`    ld hl, ${hlBlockCatalogMatch.label}`);
          patched.push('    ld de, runtime_effects_layout');
          patched.push('    call page0_decompress_to_ram');
          patched.push(`    ld hl, runtime_effects_layout${offset}`);
          skipPage0CopyToRamAfterZx0 = true;
          blockCatalogDecompressedInCurrentFunction = true;
          continue;
        }
        if (!blockCatalogDecompressedInCurrentFunction) {
          patched.push('    ; Decompress ZX0 screen block catalog into runtime_effects_layout');
          patched.push('    di');
          patched.push(`    ld hl, ${hlBlockCatalogMatch.label}`);
          patched.push('    ld de, runtime_effects_layout');
          patched.push('    call dzx0_standard');
          patched.push('    ei');
          blockCatalogDecompressedInCurrentFunction = true;
        }
        patched.push(`    ld hl, runtime_effects_layout${offset}`);
        continue;
      }
    }

    const hlBlockMapMatch = matchAsmLabelLoad(line, 'hl', 'SCREEN_[A-Z0-9_]+_\\d+_BLOCK_MAP');
    if (inLoadScreen && hlBlockMapMatch) {
      const blockMapLabel = hlBlockMapMatch.label.toUpperCase();
      const offset = hlBlockMapMatch.offset;
      if (compressedBlockMapLabels.has(blockMapLabel)) {
        if (screenRuntimeDataInPage0) {
          patched.push('    ; Decompress ZX0 page-0 screen block map into runtime_screen_layout');
          patched.push(`    ld hl, ${hlBlockMapMatch.label}`);
          patched.push('    ld de, runtime_screen_layout');
          patched.push('    call page0_decompress_to_ram');
          patched.push(`    ld hl, runtime_screen_layout${offset}`);
          skipPage0CopyToRamAfterZx0 = true;
          blockMapDecompressedInCurrentFunction = true;
          continue;
        }
        if (!blockMapDecompressedInCurrentFunction) {
          patched.push('    ; Decompress ZX0 screen block map into runtime_screen_layout');
          patched.push('    di');
          patched.push(`    ld hl, ${hlBlockMapMatch.label}`);
          patched.push('    ld de, runtime_screen_layout');
          patched.push('    call dzx0_standard');
          patched.push('    ei');
          blockMapDecompressedInCurrentFunction = true;
        }
        patched.push(`    ld hl, runtime_screen_layout${offset}`);
        continue;
      }
    }

    const hlEffectsMatch = matchAsmLabelLoad(line, 'hl', 'SCREEN_[A-Z0-9_]+_\\d+_EFFECTS_LAYOUT');
    if (inLoadScreen && hlEffectsMatch) {
      const effectsLabel = hlEffectsMatch.label.toUpperCase();
      if (compressedEffectsLabels.has(effectsLabel)) {
        if (screenRuntimeDataInPage0) {
          patched.push('    ; Decompress ZX0 page-0 effects layout directly into runtime_effects_layout');
          patched.push(`    ld hl, ${hlEffectsMatch.label}`);
          patched.push('    ld de, runtime_effects_layout');
          patched.push('    call page0_decompress_to_ram');
          patched.push('    ld hl, runtime_effects_layout');
          skipPage0CopyToRamAfterZx0 = true;
          continue;
        }
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

    const hlScreen4EffectsMatch = matchAsmLabelLoad(line, 'hl', '[A-Z0-9_]+_EFFECTS');
    if (inInitMsx2EffectBuffers && hlScreen4EffectsMatch) {
      const effectsLabel = hlScreen4EffectsMatch.label.toUpperCase();
      if (compressedEffectsLabels.has(effectsLabel)) {
        patched.push('    ; Decompress ZX0 screen4 effects directly into the runtime buffer');
        patched.push('    di');
        patched.push(`    ld hl, ${hlScreen4EffectsMatch.label}`);
        patched.push('    ld de, #C080');
        patched.push('    call dzx0_standard');
        patched.push('    ei');
        skipMsx2EffectRawCopyAfterZx0 = true;
        continue;
      }
    }

    const hlScreen4PatternMatch = matchAsmLabelLoad(line, 'hl', '[A-Z0-9_]+_BANK_[0-2]_PATTERNS');
    if (inLoadScreen4 && hlScreen4PatternMatch) {
      const patternLabel = hlScreen4PatternMatch.label.toUpperCase();
      if (compressedTilePatternLabels.has(patternLabel)) {
        patched.push('    ; Decompress ZX0 screen4 pattern bank into RAM buffer');
        patched.push('    di');
        patched.push(`    ld hl, ${hlScreen4PatternMatch.label}`);
        patched.push(`    ld de, ${tilePatternBufferSymbol}`);
        patched.push('    call dzx0_standard');
        patched.push('    ei');
        patched.push(`    ld hl, ${tilePatternBufferSymbol}`);
        continue;
      }
    }

    const hlScreen4ColorMatch = matchAsmLabelLoad(line, 'hl', '[A-Z0-9_]+_BANK_[0-2]_COLORS');
    if (inLoadScreen4 && hlScreen4ColorMatch) {
      const colorLabel = hlScreen4ColorMatch.label.toUpperCase();
      if (compressedTileColorLabels.has(colorLabel)) {
        patched.push('    ; Decompress ZX0 screen4 color bank into RAM buffer');
        patched.push('    di');
        patched.push(`    ld hl, ${hlScreen4ColorMatch.label}`);
        patched.push(`    ld de, ${tileColorBufferSymbol}`);
        patched.push('    call dzx0_standard');
        patched.push('    ei');
        patched.push(`    ld hl, ${tileColorBufferSymbol}`);
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

    if ((inLoadScreen || inLoadScreen4 || inInitMsx2EffectBuffers || inLoadPattern || inLoadColor || inLoadSpritePatterns || inUpdateAnimation || inActionChangeSprite || inShowPresentationScreen) && /^\s*ret\s*$/i.test(line)) {
      inLoadScreen = false;
      inLoadScreen4 = false;
      inInitMsx2EffectBuffers = false;
      inLoadPattern = false;
      inLoadColor = false;
      inLoadSpritePatterns = false;
      inUpdateAnimation = false;
      inActionChangeSprite = false;
      inShowPresentationScreen = false;
      presentationCopyUsesRamBuffer = false;
      layoutDecompressedInCurrentFunction = false;
      blockCatalogDecompressedInCurrentFunction = false;
      blockMapDecompressedInCurrentFunction = false;
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
  const SHARED_ZX0_SCRATCH_A = 'sharedA';
  const SHARED_ZX0_SCRATCH_B = 'sharedB';
  if (needsScreenBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_SCREEN_BUFFER', size: Math.max(1, maxLayoutSize), title: 'ZX0 SCREEN BUFFER', note: 'Shared scratch buffer for screen layout decompression', scratchGroup: SHARED_ZX0_SCRATCH_A });
  if (selectedEffectsBlocks.size > 0 && maxEffectsSize <= 0) {
    throw new Error('Effects ZX0 compression selected but no effects block size was resolved');
  }
  if (needsBehaviorBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_BEHAVIOR_BUFFER', size: Math.max(1, maxBehaviorSize), title: 'ZX0 BEHAVIOR BUFFER', note: 'Shared scratch buffer for behavior map decompression', scratchGroup: SHARED_ZX0_SCRATCH_A });
  if (needsTilePatternBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_TILE_PATTERN_BUFFER', size: Math.max(1, maxTilePatternSize), title: 'ZX0 TILE PATTERN BUFFER', note: 'Shared scratch buffer for tile pattern data decompression', scratchGroup: SHARED_ZX0_SCRATCH_A });
  if (needsTileColorBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_TILE_COLOR_BUFFER', size: Math.max(1, maxTileColorSize), title: 'ZX0 TILE COLOR BUFFER', note: 'Shared scratch buffer for tile color data decompression', scratchGroup: SHARED_ZX0_SCRATCH_A });
  if (needsFontPatternBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_FONT_PATTERN_BUFFER', size: Math.max(1, maxFontPatternSize), title: 'ZX0 FONT PATTERN BUFFER', note: 'Shared scratch buffer for font pattern data decompression', scratchGroup: SHARED_ZX0_SCRATCH_A });
  if (needsFontColorBufferEqu) buffersToAllocate.push({ symbol: 'ZX0_FONT_COLOR_BUFFER', size: Math.max(1, maxFontColorSize), title: 'ZX0 FONT COLOR BUFFER', note: 'Second scratch buffer for font color data while font pattern data is still live', scratchGroup: needsFontPatternBufferEqu ? SHARED_ZX0_SCRATCH_B : SHARED_ZX0_SCRATCH_A });
  if (needsSpriteFrameBufferEqu) {
    buffersToAllocate.push({
      symbol: 'ZX0_SPRITE_FRAME_BUFFER',
      size: Math.max(1, maxSpriteFrameSize),
      title: 'ZX0 SPRITE FRAME BUFFER',
      note: 'Shared scratch buffer for per-frame sprite decompression before VRAM upload',
      scratchGroup: SHARED_ZX0_SCRATCH_A
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

    const scratchGroups = [];
    for (const buf of buffersToAllocate) {
      const groupName = buf.scratchGroup || buf.symbol;
      let group = scratchGroups.find((candidate) => candidate.name === groupName);
      if (!group) {
        group = { name: groupName, size: 0, buffers: [] };
        scratchGroups.push(group);
      }
      group.size = Math.max(group.size, buf.size);
      group.buffers.push(buf);
    }

    const allocated = [];
    for (const group of scratchGroups) {
      nextAddress = (nextAddress + 0xFF) & 0xFF00; // align at 256-byte boundary
      const start = nextAddress;
      const endExclusive = start + group.size;
      if (endExclusive > RAM_BUFFER_LIMIT) {
        info.warning = `ZX0 scratch RAM overflow: need up to #${endExclusive.toString(16).toUpperCase().padStart(4, '0')}, limit is #${RAM_BUFFER_LIMIT.toString(16).toUpperCase().padStart(4, '0')}`;
        return { code: sourceCode, info };
      }
      for (const buf of group.buffers) {
        allocated.push({ ...buf, start, endExclusive: start + buf.size, scratchSize: group.size });
      }
      nextAddress = endExclusive;
    }

    for (const buf of allocated) {
      const startHex = buf.start.toString(16).toUpperCase().padStart(4, '0');
      extraEquBlocks.push(
        '; ==================================================================',
        `; ${buf.title} (AUTO-INJECTED)`,
        `; ${buf.note} (${buf.size} bytes, scratch slot ${buf.scratchSize} bytes)`,
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
  const isMegarom = /^\s*;\s*ROM mode(?:\s+requested)?\s*:\s*megarom\b/im.test(finalCode);
  const isSimple32k = /^\s*;\s*ROM mode(?:\s+requested)?\s*:\s*simple32k\b/im.test(finalCode);
  // Inject generated code before the fixed-size padding reservation so it stays
  // inside the assembled ROM image instead of being appended past the pad.
  const injectBeforePad = isMegarom || isSimple32k || /^\s*;\s*Linear48K Page0 Data:\s*(Yes|No)\b/im.test(finalCode);

  function injectCodeBeforeEnd(block) {
    if (injectBeforePad) {
      const padMatch = finalCode.match(/^\s*ds\s+#(?:8000|C000)\s*-\s*[$][^\n]*/im);
      if (padMatch) {
        // Re-use the existing pad line so comments are preserved
        finalCode = finalCode.replace(/^\s*ds\s+#(?:8000|C000)\s*-\s*[$][^\n]*/im, `${block}\n${padMatch[0]}`);
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
  let msx2BudgetFeedback = null;
  let msx2BudgetResolution = null;

  let codeToCompile = code;
  let screenCompressionInfo = {
    attempted: false,
    applied: false,
    method: 'ZX0',
    candidateScreens: 0,
    candidateScreenBlockMaps: 0,
    candidateEffects: 0,
    candidateBehaviorMaps: 0,
    candidateTilePatterns: 0,
    candidateTileColors: 0,
    candidateFontPatterns: 0,
    candidateFontColors: 0,
    candidateSpritePatterns: 0,
    compressedScreens: 0,
    compressedScreenBlockMaps: 0,
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
    if (preprocessError?.code === 'MIDEAS_DIRECT_ROM_CATALOG_COMPRESSED') {
      screenCompressionInfo.warning = preprocessError.message;
      return res.status(400).send({
        error: 'Invalid compressed 4x4 shared block catalog',
        details: preprocessError.message,
        msx2BudgetFeedback: buildMsx2IdeBudgetFeedbackFromAsm(codeToCompile),
        screenCompressionInfo
      });
    }
    screenCompressionInfo.warning = `ZX0 preprocess error: ${preprocessError.message}`;
    console.error('ZX0 preprocess error:', preprocessError);
  }

  msx2BudgetFeedback = buildMsx2IdeBudgetFeedbackFromAsm(codeToCompile);
  if (msx2BudgetFeedback?.status === 'error' && screenCompression === false) {
    msx2BudgetResolution = {
      scope: 'msx2_screen4_budget_resolution',
      status: 'attempted',
      attempts: [
        {
          attempt: 0,
          action: 'server_compile_budget_gate',
          status: 'failed',
          reason: 'ide_budget_feedback_error',
          failure: buildMsx2BudgetResolutionFailureContext(msx2BudgetFeedback)
        }
      ]
    };
    try {
      const retryPreprocessed = await injectZx0IntoUnifiedAsm(codeToCompile, tempDir);
      const retryFeedback = buildMsx2IdeBudgetFeedbackFromAsm(retryPreprocessed.code);
      screenCompressionInfo = retryPreprocessed.info;
      if (retryPreprocessed.info.applied) {
        codeToCompile = retryPreprocessed.code;
        fs.writeFileSync(compressedAsmOutputPath, codeToCompile, 'utf8');
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
        }
      }
      msx2BudgetFeedback = retryFeedback || msx2BudgetFeedback;
      msx2BudgetResolution.attempts.push({
        attempt: 1,
        action: 'enable_zx0_preprocess',
        status: retryFeedback && retryFeedback.status !== 'error' ? 'resolved' : 'failed',
        reason: retryFeedback ? `budget_status_${retryFeedback.status}` : 'missing_msx2_budget_feedback',
        failure: retryFeedback && retryFeedback.status === 'error'
          ? buildMsx2BudgetResolutionFailureContext(retryFeedback)
          : undefined,
        zx0: retryPreprocessed.info
      });
      msx2BudgetResolution.status = retryFeedback && retryFeedback.status !== 'error' ? 'resolved' : 'unresolved';
    } catch (retryError) {
      msx2BudgetResolution.attempts.push({
        attempt: 1,
        action: 'enable_zx0_preprocess',
        status: 'failed',
        reason: retryError instanceof Error ? retryError.message : String(retryError)
      });
      msx2BudgetResolution.status = 'unresolved';
    }
  }

  if (msx2BudgetFeedback?.status === 'error') {
    if (!msx2BudgetResolution) {
      msx2BudgetResolution = {
        scope: 'msx2_screen4_budget_resolution',
        status: 'unresolved',
        attempts: [
          {
            attempt: 0,
            action: 'server_compile_budget_gate',
            status: 'failed',
            reason: 'ide_budget_feedback_error',
            failure: buildMsx2BudgetResolutionFailureContext(msx2BudgetFeedback)
          }
        ]
      };
    } else if (msx2BudgetResolution.status !== 'resolved') {
      msx2BudgetResolution.status = 'unresolved';
    }
    return res.status(409).json({
      success: false,
      error: 'MSX2 MegaROM preflight budget failed',
      details: 'Mideas stopped before Glass because the current MSX2 SCREEN 4 MegaROM budget is already marked as error.',
      requestedRomConfig: {
        romMode: normalizedRomMode,
        targetFormat: normalizedTargetFormat,
        autoMegaROM: normalizedAutoMegaROM
      },
      msx2BudgetFeedback,
      msx2BudgetResolution,
      screenCompressionInfo,
      compressedAsmFileInfo
    });
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
        fs.readFile(tempFilePath, 'utf8', async (readErr, sourceCode) => {
          const fullErrorText = `${compileStderr}\n${compileStdout}\n${error.message || ''}`;
          const sourceRomConfig = parseSourceRomConfig(codeToCompile);
          const capacityOverflow = isGlassRomCapacityError(fullErrorText);
          const negativeDsOverflowBytes = getNegativeDsOverflowBytes(fullErrorText);
          const plain48kPage0Info = parsePlain48kPage0Diagnostics(codeToCompile);
          const msx2BudgetFeedback = buildMsx2IdeBudgetFeedbackFromAsm(codeToCompile);
          const msx2CompileFailure = buildMsx2ResidentOverflowFailure(codeToCompile, fullErrorText, tempFilePath);
          const canSuggestPlain48k =
            normalizedRomMode === 'simple32k' &&
            (negativeDsOverflowBytes === null || negativeDsOverflowBytes <= (PLAIN48_ROM_LIMIT_BYTES - SIMPLE_ROM_LIMIT_BYTES));
          const suggestedRomConfig = capacityOverflow
            ? buildRomCapacitySuggestion(
                normalizedRomMode,
                normalizedTargetFormat,
                normalizedAutoMegaROM,
                canSuggestPlain48k
              )
            : null;
          const capacityDetails = capacityOverflow
            ? buildRomCapacityDetails(normalizedRomMode, canSuggestPlain48k, negativeDsOverflowBytes, plain48kPage0Info)
            : null;
          const errorResponse = {
            success: false,
            error: 'Glass compilation failed',
            details: compileStderr || compileStdout || error.message,
            command: command,
            sourceFile: tempFilePath,
            sourceCode: readErr ? 'Could not read source' : sourceCode.substring(0, 1000), // First 1000 chars
            fullStderr: compileStderr,
            fullStdout: compileStdout,
            errorCode: error.code,
            signal: error.signal,
            negativeDsOverflowBytes: negativeDsOverflowBytes,
            plain48kPage0Info: plain48kPage0Info,
            requestedRomConfig: {
              romMode: normalizedRomMode,
              targetFormat: normalizedTargetFormat,
              autoMegaROM: normalizedAutoMegaROM
            },
            sourceRomConfig: sourceRomConfig,
            msx2BudgetFeedback: msx2BudgetFeedback,
            msx2BudgetResolution: msx2BudgetResolution,
            msx2CompileFailure: msx2CompileFailure,
            screenCompressionInfo: screenCompressionInfo,
            compressedAsmFileInfo: compressedAsmFileInfo
          };

          if (msx2CompileFailure) {
            errorResponse.error = 'MSX2 MegaROM resident bank overflow';
            errorResponse.details = [
              msx2CompileFailure.reason,
              msx2CompileFailure.planB.primary,
              msx2CompileFailure.planB.secondary
            ].join(' ');
          }

          if (capacityOverflow && !msx2CompileFailure) {
            errorResponse.error = normalizedRomMode === 'megarom'
              ? 'MegaROM build failed'
              : 'ROM does not fit in selected ROM mode';
            errorResponse.details = capacityDetails;
            errorResponse.romModeConflictWarning = normalizedRomMode === 'megarom'
              ? 'Requested megarom, but Glass could not produce a valid MegaROM image.'
              : normalizedRomMode === 'plain48k'
                ? 'Requested plain48k, but Glass reported that the ROM exceeds the 48KB limit.'
                : 'Requested simple32k, but Glass reported that the ROM exceeds the 32KB limit.';
            errorResponse.resolvedRomConfig = {
              requestedRomMode: normalizedRomMode,
              resolvedRomMode: suggestedRomConfig
                ? (suggestedRomConfig.romMode === 'plain48k' ? 'plain48k_recommended' : 'megarom_required')
                : 'megarom_failed',
              targetFormat: !suggestedRomConfig || suggestedRomConfig.romMode === 'megarom' ? normalizedTargetFormat : 'none',
              mapperTargetFormat: normalizedTargetFormat,
              mapperActive: !suggestedRomConfig || suggestedRomConfig.romMode === 'megarom',
              reason: suggestedRomConfig?.reason || 'MegaROM build failed before producing a valid ROM.'
            };
            if (suggestedRomConfig) {
              errorResponse.suggestedRomConfig = suggestedRomConfig;
            }
          }

          if (capacityOverflow && normalizedRomMode === 'megarom' && attempt === 1) {
            try {
              console.warn('MegaROM capacity failure detected. Retrying once with post-ASM optimization...');
              const recovery = await optimizePostAsmCode(codeToCompile, {
                projectName: projectName || 'megarom_recovery',
                passes: 3,
                validateGlass: false,
                rules: [...POST_ASM_APPLY_RULES],
              });

              const recoveryRomPath = outputFilePath.replace(/\.rom$/i, '.postasm.rom');
              const recoveryCommand = `java -jar "${jarPath}" -I "${includeServerPath}" "${recovery.outputPath}" "${recoveryRomPath}"`;
              const recoveryStdout = execSync(recoveryCommand, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

              if (fs.existsSync(recoveryRomPath)) {
                const KB_8 = 8192;
                const MIN_FLASHCART_ROM_BYTES = 32 * 1024;
                const optimizedRomData = fs.readFileSync(recoveryRomPath);
                const originalSize = optimizedRomData.length;
                const aligned8KBSize = Math.max(KB_8, Math.ceil(originalSize / KB_8) * KB_8);
                const aligned8KBBanks = aligned8KBSize / KB_8;
                const isPowerOfTwo = (value) => value > 0 && (value & (value - 1)) === 0;
                const powerOfTwoBankCount = isPowerOfTwo(aligned8KBBanks)
                  ? aligned8KBBanks
                  : Math.pow(2, Math.ceil(Math.log2(aligned8KBBanks)));
                const targetBankCount = Math.max(MIN_FLASHCART_ROM_BYTES / KB_8, powerOfTwoBankCount);
                const targetSize = targetBankCount * KB_8;
                const paddingNeeded = Math.max(0, targetSize - originalSize);
                const paddedData = paddingNeeded > 0
                  ? Buffer.concat([optimizedRomData, Buffer.alloc(paddingNeeded, 0xFF)])
                  : optimizedRomData;

                fs.writeFileSync(outputFilePath, paddedData);

                const romFileName = path.basename(outputFilePath);
                const recoveredMessage = [
                  `Glass initially exceeded the MegaROM bank budget${negativeDsOverflowBytes !== null ? ` by ${negativeDsOverflowBytes} bytes` : ''}.`,
                  'Post-ASM optimization recovered the build and Glass validated the optimized ASM.',
                  recoveryStdout || '',
                  recovery.stdout || '',
                ].filter(Boolean).join('\n');

                return res.send({
                  success: true,
                  data: paddedData.toString('hex'),
                  message: recoveredMessage,
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
                  msx2BudgetFeedback: buildMsx2IdeBudgetFeedbackFromAsm(recovery.optimizedCode || codeToCompile) || msx2BudgetFeedback,
                  resolvedRomConfig: {
                    requestedRomMode: normalizedRomMode,
                    resolvedRomMode: 'megarom',
                    targetFormat: normalizedTargetFormat,
                    mapperTargetFormat: normalizedTargetFormat,
                    mapperActive: true,
                    reason: 'MegaROM build recovered by post-ASM optimization after the first Glass capacity failure.'
                  },
                  romSizeInfo: {
                    originalSize: originalSize,
                    paddedSize: paddedData.length,
                    paddingAdded: paddedData.length - originalSize,
                    paddingPolicy: 'post-ASM recovered MegaROM + power-of-two 8KB banks',
                    aligned8KBSize: aligned8KBSize,
                    aligned8KBBanks: aligned8KBBanks,
                    targetHardwareSize: targetSize,
                    targetHardwareBanks: targetSize / KB_8,
                    sizeIn8KB: paddedData.length / KB_8,
                    sizeMod8192: originalSize % KB_8,
                  },
                  postAsmRecovery: {
                    applied: true,
                    optimizedAsmFile: path.basename(recovery.outputPath),
                    optimizedAsmDownloadUrl: `/download/${path.basename(recovery.outputPath)}`,
                    reportJsonFile: path.basename(recovery.reportJsonPath),
                    reportMarkdownFile: path.basename(recovery.reportMdPath),
                    summary: recovery.summary,
                  },
                  ...(compressedAsmFileInfo || {})
                });
              }
            } catch (recoveryError) {
              const recoveryMessage = recoveryError instanceof Error ? recoveryError.message : String(recoveryError);
              console.warn('Post-ASM MegaROM recovery failed:', recoveryMessage);
              errorResponse.postAsmRecovery = {
                applied: false,
                error: recoveryMessage,
              };
            }
          }

          console.log('Full error response:', errorResponse);
          return res.status(capacityOverflow ? 409 : 500).json(errorResponse);
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
        const screen4KonamiFixedBank0Compat = sourceHasMsx2Screen4KonamiFixedBank0Compat(codeToCompile);
        if (screen4KonamiFixedBank0Compat) {
          const scatteredMapperWrites = findScatteredMapperRegisterWrites(codeToCompile);
          if (scatteredMapperWrites.length > 0) {
            return res.status(422).json({
              error: 'MSX2 Konami8K validation failed',
              details: 'Mapper register writes must stay inside mapper_set_bank_p1/p2/p3.',
              findings: scatteredMapperWrites.slice(0, 12),
              requestedRomConfig: {
                romMode: normalizedRomMode,
                targetFormat: normalizedTargetFormat,
                autoMegaROM: normalizedAutoMegaROM
              },
              resolvedRomConfig: {
                mode: 'megarom_invalid',
                mapper: normalizedTargetFormat,
                mapperActive: true,
                reason: 'MSX2 SCREEN 4 Konami fixed-bank0 source has scattered mapper register writes.'
              }
            });
          }
        }
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
        const exceedsSimpleRomLimit = aligned8KBSize > SIMPLE_ROM_LIMIT_BYTES;
        const exceedsPlain48RomLimit = aligned8KBSize > PLAIN48_ROM_LIMIT_BYTES;
        const fitsPlain48RomLimit = exceedsSimpleRomLimit && !exceedsPlain48RomLimit;
        const bytesOverSimpleLimit = Math.max(0, aligned8KBSize - SIMPLE_ROM_LIMIT_BYTES);
        const bytesOverPlain48Limit = Math.max(0, aligned8KBSize - PLAIN48_ROM_LIMIT_BYTES);
        const mapperHint = exceedsSimpleRomLimit
          ? (
              fitsPlain48RomLimit
                ? 'ROM exceeds 32KB simple layout. Plain 48KB is only a validation candidate until regenerated and compiled.'
                : 'ROM exceeds 48KB plain layout. Use mapper-aware build/runtime (Konami/ASCII).'
            )
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
          romModeConflictWarning = fitsPlain48RomLimit
            ? 'Requested simple32k, but final ROM exceeds 32KB. Validate a regenerated plain48k build before using it.'
            : 'Requested simple32k, but final ROM exceeds 48KB and requires a mapper.';
        } else if (normalizedRomMode === 'plain48k' && exceedsPlain48RomLimit) {
          romModeConflictWarning = 'Requested plain48k, but final ROM exceeds 48KB and requires a mapper.';
        }

        let resolvedRomMode = 'simple32k';
        let mapperResolutionReason = 'ROM fits in 32KB simple layout.';
        if (normalizedRomMode === 'megarom') {
          resolvedRomMode = 'megarom';
          mapperResolutionReason = screen4KonamiFixedBank0Compat
            ? 'Forced megarom by request. MSX2 SCREEN 4 currently uses Konami 8K fixed-bank0 compatibility.'
            : 'Forced megarom by request.';
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
            resolvedRomMode = fitsPlain48RomLimit ? 'plain48k_recommended' : 'megarom_required';
            mapperResolutionReason = fitsPlain48RomLimit
              ? 'ROM exceeds 32KB; regenerated plain48k is a candidate and must be compiled before OpenMSX.'
              : 'ROM exceeds 48KB; simple32k request is not valid.';
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
          fitsPlain48RomLimit,
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
          sourceConfigMismatchWarning,
          screen4KonamiFixedBank0Compat
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
            reason: mapperResolutionReason,
            msx2Screen4KonamiFixedBank0Compat: screen4KonamiFixedBank0Compat
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
            msx2Screen4KonamiFixedBank0Compat: screen4KonamiFixedBank0Compat,
            sizeIn8KB: paddedData.length / KB_8,
            sizeMod8192: sizeMod8192,
            banks8KB: banks8KB,
            romOrigin: ROM_ORIGIN,
            endAddress: endAddress,
            simpleRomLimitBytes: SIMPLE_ROM_LIMIT_BYTES,
            plain48RomLimitBytes: PLAIN48_ROM_LIMIT_BYTES,
            exceedsSimpleRomLimit: exceedsSimpleRomLimit,
            exceedsPlain48RomLimit: exceedsPlain48RomLimit,
            fitsPlain48RomLimit: fitsPlain48RomLimit,
            bytesOverSimpleLimit: bytesOverSimpleLimit,
            bytesOverPlain48Limit: bytesOverPlain48Limit,
            mapperHint: mapperHint
          }
        };
        msx2BudgetFeedback = buildMsx2IdeBudgetFeedbackFromAsm(codeToCompile);
        if (msx2BudgetFeedback) {
          responseData.msx2BudgetFeedback = msx2BudgetFeedback;
        }
        if (msx2BudgetResolution) {
          responseData.msx2BudgetResolution = msx2BudgetResolution;
        }

        // Add symbol file info if available
        if (symbolFileInfo) {
          Object.assign(responseData, symbolFileInfo);
        }

        // Add compressed ASM file info if available
        if (compressedAsmFileInfo) {
          Object.assign(responseData, compressedAsmFileInfo);
        }

        const shouldBlockInvalidRom =
          (normalizedRomMode === 'simple32k' && exceedsSimpleRomLimit) ||
          (normalizedRomMode === 'plain48k' && exceedsPlain48RomLimit);

        if (shouldBlockInvalidRom) {
          const suggestedRomConfig = buildRomCapacitySuggestion(
            normalizedRomMode,
            normalizedTargetFormat,
            normalizedAutoMegaROM,
            fitsPlain48RomLimit
          );
          const blockingMessage = fitsPlain48RomLimit
            ? `ROM is ${bytesOverSimpleLimit} bytes over the 32KB simple limit. Plain 48KB is only a candidate; Mideas must regenerate and compile it before OpenMSX.`
            : `ROM is ${bytesOverPlain48Limit || bytesOverSimpleLimit} bytes over the selected ROM budget and requires MegaROM.`;
          const { data: _data, romFile: _romFile, romPath: _romPath, downloadUrl: _downloadUrl, ...blockedResponse } = responseData;

          return res.status(409).json({
            ...blockedResponse,
            success: false,
            error: 'ROM does not fit in selected ROM mode',
            details: `${blockingMessage} Mideas stopped before launching OpenMSX because the current ROM would be misleading.`,
            suggestedRomConfig
          });
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
        const status = error?.code === 'MIDEAS_DIRECT_ROM_CATALOG_COMPRESSED' ? 400 : 500;
        res.status(status).json({
          success: false,
          error: status === 400 ? 'Invalid compressed 4x4 shared block catalog' : 'Failed to compress unified ASM',
          details: error.message
        });
      });
  } catch (error) {
    const status = error?.code === 'MIDEAS_DIRECT_ROM_CATALOG_COMPRESSED' ? 400 : 500;
    return res.status(status).json({
      success: false,
      error: status === 400 ? 'Invalid compressed 4x4 shared block catalog' : 'Failed to compress unified ASM',
      details: error.message
    });
  }
});

/**
 * Endpoint to run post-ASM dead-code analysis without modifying the ASM.
 * Expects a JSON body with `code` and optional `projectName`/`rules`.
 * @name POST /analyze-post-asm
 * @function
 */
app.post('/analyze-post-asm', async (req, res) => {
  const { code, projectName, rules } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'No ASM code provided' });
  }

  try {
    const result = await analyzePostAsmCode(code, { projectName, rules });
    return res.json({
      success: true,
      applied: false,
      message: 'Post-ASM analysis completed; no patches were applied',
      rules: result.rules,
      summary: result.summary,
      report: result.report,
      reportJsonFile: path.basename(result.reportJsonPath),
      reportJsonPath: result.reportJsonPath,
      reportMarkdownFile: path.basename(result.reportMdPath),
      reportMarkdownPath: result.reportMdPath,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  } catch (error) {
    const message = error.message || String(error);
    const status = message.startsWith('Unknown post-ASM rule id') ? 400 : 500;
    return res.status(status).json({
      success: false,
      error: 'Failed to analyze post-ASM code',
      details: message,
    });
  }
});

/**
 * Endpoint to apply conservative post-ASM dead-block elimination into a
 * separate optimized ASM artifact.
 * Expects a JSON body with `code` and optional `projectName`/`passes`.
 * @name POST /optimize-post-asm
 * @function
 */
app.post('/optimize-post-asm', async (req, res) => {
  const { code, projectName, passes, validateGlass, rules } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'No ASM code provided' });
  }

  try {
    const result = await optimizePostAsmCode(code, { projectName, passes, validateGlass, rules });
    return res.json({
      success: true,
      applied: result.summary.appliedPatches > 0,
      message: result.summary.appliedPatches > 0
        ? 'Post-ASM optimization completed into a separate optimized ASM file'
        : 'Post-ASM optimization completed; no patchable rules were found',
      rules: result.rules,
      passes: result.passes,
      validateGlass: result.validateGlass,
      summary: result.summary,
      invariantCheck: result.invariantCheck,
      report: result.report,
      optimizedCode: result.optimizedCode,
      optimizedAsmFile: path.basename(result.outputPath),
      optimizedAsmPath: result.outputPath,
      optimizedAsmDownloadUrl: `/download/${path.basename(result.outputPath)}`,
      optimizedRomFile: result.optimizedRomPath ? path.basename(result.optimizedRomPath) : null,
      optimizedRomPath: result.optimizedRomPath,
      optimizedRomDownloadUrl: result.optimizedRomPath ? `/download/${path.basename(result.optimizedRomPath)}` : null,
      reportJsonFile: path.basename(result.reportJsonPath),
      reportJsonPath: result.reportJsonPath,
      reportMarkdownFile: path.basename(result.reportMdPath),
      reportMarkdownPath: result.reportMdPath,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to optimize post-ASM code',
      details: error.message || String(error),
      invariantCheck: error.invariantCheck || null,
      stdout: error.stdout,
      stderr: error.stderr,
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

app.post('/compress-binary-zx0', async (req, res) => {
  const { bytes } = req.body;

  if (!Array.isArray(bytes)) {
    return res.status(400).json({ success: false, message: 'Missing byte array.' });
  }

  const normalizedBytes = bytes.map((value) => Number(value));
  const invalidByte = normalizedBytes.find((value) => !Number.isInteger(value) || value < 0 || value > 255);
  if (invalidByte !== undefined) {
    return res.status(400).json({ success: false, message: `Invalid byte value: ${invalidByte}` });
  }

  const tempDir = path.join(__dirname, 'temp');

  try {
    await fs.promises.mkdir(tempDir, { recursive: true });
    const compressed = await runZx0CompressionAsync(Buffer.from(normalizedBytes), tempDir);
    const originalSize = normalizedBytes.length;
    const compressedBytes = Array.from(compressed.values());
    const compressedSize = compressedBytes.length;
    const savedBytes = originalSize - compressedSize;
    const ratio = originalSize > 0 ? (1 - (compressedSize / originalSize)) * 100 : 0;

    res.json({
      success: true,
      method: 'ZX0',
      originalSize,
      compressedSize,
      savedBytes,
      ratio,
      compressedBytes,
    });
  } catch (error) {
    console.error('ZX0 binary compression error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during ZX0 compression.',
      details: error.message,
    });
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
  injectZx0IntoUnifiedAsm,
  __postAsmAnalysisForTests: {
    POST_ASM_ANALYSIS_RULES,
    normalizePostAsmRuleIds,
    normalizePostAsmPasses,
    buildPostAsmAnalysisSummary,
    comparePostAsmInvariants,
    analyzePostAsmCode,
    optimizePostAsmCode,
  },
  __romCapacityForTests: {
    SIMPLE_ROM_LIMIT_BYTES,
    PLAIN48_ROM_LIMIT_BYTES,
    buildRomCapacitySuggestion,
    buildRomCapacityDetails,
    parsePlain48kPage0Diagnostics,
    formatPlain48kPage0Diagnostic,
    getNegativeDsOverflowBytes,
    isGlassRomCapacityError
  }
};

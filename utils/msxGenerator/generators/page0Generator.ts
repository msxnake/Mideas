/**
 * @fileoverview Page 0 Generator - linear 48K page-0 cold data groups
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

export const PAGE0_BUDGET_BYTES = 16 * 1024;
const SCREEN_WIDTH = 32;
const SCREEN_HEIGHT = 24;
const ASM_BYTES_PER_LINE = 16;

type Page0GroupId = 'presentationScreen';

interface Page0GroupSelection {
  id: Page0GroupId;
  label: string;
  sizeBytes: number;
  priority: number;
  mode: 'auto' | 'page0';
  reason: string;
}

interface Page0GroupRejection {
  id: Page0GroupId;
  label: string;
  sizeBytes: number;
  mode: 'auto' | 'page0' | 'default';
  reason: string;
}

export interface Page0Plan {
  budgetBytes: number;
  usedBytes: number;
  remainingBytes: number;
  selectedGroups: Page0GroupSelection[];
  rejectedGroups: Page0GroupRejection[];
}

const EMPTY_PAGE0_PLAN: Page0Plan = {
  budgetBytes: PAGE0_BUDGET_BYTES,
  usedBytes: 0,
  remainingBytes: PAGE0_BUDGET_BYTES,
  selectedGroups: [],
  rejectedGroups: [],
};

function hasValidPresentationScreenData(analysis: ProjectAnalysis): boolean {
  const config = analysis.presentationScreen;
  if (!config?.enabled) return false;
  return Array.isArray(config.data?.nameTable) && config.data.nameTable.length === (SCREEN_WIDTH * SCREEN_HEIGHT);
}

function getPresentationScreenTotalBytes(analysis: ProjectAnalysis): number {
  const config = analysis.presentationScreen;
  if (!config?.data) return 0;
  return [
    config.data.nameTable,
    config.data.patternBank0,
    config.data.patternBank1,
    config.data.patternBank2,
    config.data.colorBank0,
    config.data.colorBank1,
    config.data.colorBank2,
  ].reduce((total, bytes) => total + (Array.isArray(bytes) ? bytes.length : 0), 0);
}

export function buildPage0Plan(analysis: ProjectAnalysis, romMode: string = 'simple32k'): Page0Plan {
  if (romMode !== 'plain48k') {
    return EMPTY_PAGE0_PLAN;
  }

  const plan: Page0Plan = {
    budgetBytes: PAGE0_BUDGET_BYTES,
    usedBytes: 0,
    remainingBytes: PAGE0_BUDGET_BYTES,
    selectedGroups: [],
    rejectedGroups: [],
  };

  if (!hasValidPresentationScreenData(analysis)) {
    return plan;
  }

  const presentationScreen = analysis.presentationScreen!;
  const mode = presentationScreen.runtime?.romDataGroup ?? 'auto';
  const sizeBytes = getPresentationScreenTotalBytes(analysis);
  const baseGroup = {
    id: 'presentationScreen' as const,
    label: 'Presentation Screen',
    sizeBytes,
    priority: 10,
  };

  if (mode === 'default') {
    plan.rejectedGroups.push({
      ...baseGroup,
      mode,
      reason: 'Asset override keeps this group in the standard ROM area.',
    });
    return plan;
  }

  if (sizeBytes <= plan.remainingBytes) {
    plan.selectedGroups.push({
      ...baseGroup,
      mode,
      reason: mode === 'page0'
        ? 'Forced into page 0 by asset override.'
        : 'Auto-packed into page 0 as highest-priority cold data.',
    });
    plan.usedBytes += sizeBytes;
    plan.remainingBytes -= sizeBytes;
  } else {
    plan.rejectedGroups.push({
      ...baseGroup,
      mode,
      reason: mode === 'page0'
        ? `Forced page 0 placement requested, but ${sizeBytes} bytes exceeds remaining budget.`
        : `Auto-pack skipped because ${sizeBytes} bytes exceeds remaining page-0 budget.`,
    });
  }

  return plan;
}

function generateRawByteBlock(label: string, bytes: number[], comments: string[] = []): string {
  let asm = '';
  if (comments.length > 0) {
    asm += comments.map(comment => `; ${comment}`).join('\n') + '\n';
  }
  asm += `${label}:\n`;
  if (!Array.isArray(bytes) || bytes.length === 0) {
    asm += '    DB #00\n';
    return asm;
  }
  for (let i = 0; i < bytes.length; i += ASM_BYTES_PER_LINE) {
    const chunk = bytes.slice(i, i + ASM_BYTES_PER_LINE);
    const formatted = chunk.map(value => `#${value.toString(16).padStart(2, '0').toUpperCase()}`);
    asm += `    DB ${formatted.join(',')}\n`;
  }
  return asm;
}

export function presentationScreenUsesPage0Group(
  analysis: ProjectAnalysis,
  romMode: string = 'plain48k'
): boolean {
  return buildPage0Plan(analysis, romMode).selectedGroups.some(group => group.id === 'presentationScreen');
}

export function hasPage0DataGroups(analysis: ProjectAnalysis, romMode: string = 'simple32k'): boolean {
  return buildPage0Plan(analysis, romMode).selectedGroups.length > 0;
}

export function page0NeedsZx0Decoder(analysis: ProjectAnalysis, romMode: string = 'simple32k'): boolean {
  if (!presentationScreenUsesPage0Group(analysis, romMode)) {
    return false;
  }

  const compression = analysis.presentationScreen?.compression;
  return !!(
    compression?.compressNameTable ||
    compression?.compressPatterns ||
    compression?.compressColors
  );
}

export function formatPage0PlanComments(plan: Page0Plan): string {
  const lines = [
    '; Page 0 Budget Planner',
    `; Budget: ${plan.budgetBytes} bytes`,
    `; Used: ${plan.usedBytes} bytes`,
    `; Remaining: ${plan.remainingBytes} bytes`,
  ];

  if (plan.selectedGroups.length > 0) {
    lines.push('; Selected groups:');
    lines.push(...plan.selectedGroups.map(group =>
      `; - ${group.label}: ${group.sizeBytes} bytes [${group.mode}] ${group.reason}`
    ));
  } else {
    lines.push('; Selected groups: none');
  }

  if (plan.rejectedGroups.length > 0) {
    lines.push('; Skipped groups:');
    lines.push(...plan.rejectedGroups.map(group =>
      `; - ${group.label}: ${group.sizeBytes} bytes [${group.mode}] ${group.reason}`
    ));
  }

  return lines.join('\n');
}

export function generatePage0File(analysis: ProjectAnalysis, romMode: string = 'simple32k'): string {
  const plan = buildPage0Plan(analysis, romMode);
  if (plan.selectedGroups.length === 0) {
    return `; ==================================================================
; PAGE 0 DATA GROUPS
; File: page0.asm
; Description: No cold data groups selected for page 0
; ==================================================================
${formatPage0PlanComments(plan)}
`;
  }

  const presentationScreen = analysis.presentationScreen!;
  const config = presentationScreen;

  let code = `; ==================================================================
; PAGE 0 DATA GROUPS
; File: page0.asm
; Description: Cold data packed in the 0000h-3FFFh window for linear 48K ROMs
; ==================================================================

${formatPage0PlanComments(plan)}

; ------------------------------------------------------------------
; Group: Presentation Screen
; Intended use:
; - Copy cold data from page 0 to RAM/VRAM from page 1 helpers
; - Keep BIOS visible during normal execution
; ------------------------------------------------------------------

`;

  code += generateRawByteBlock('PRESENTATION_SCREEN_NAMETBL', config.data.nameTable, [
    `${config.name} - Name table (32x24)`,
    'Packed into page 0 group for plain48k layout.'
  ]);
  code += '\n';
  code += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B0', config.data.patternBank0, [
    `${config.name} - Pattern bank 0`,
  ]);
  code += '\n';
  code += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B1', config.data.patternBank1, [
    `${config.name} - Pattern bank 1`,
  ]);
  code += '\n';
  code += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B2', config.data.patternBank2, [
    `${config.name} - Pattern bank 2`,
  ]);
  code += '\n';
  code += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B0', config.data.colorBank0, [
    `${config.name} - Color bank 0`,
  ]);
  code += '\n';
  code += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B1', config.data.colorBank1, [
    `${config.name} - Color bank 1`,
  ]);
  code += '\n';
  code += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B2', config.data.colorBank2, [
    `${config.name} - Color bank 2`,
  ]);
  code += '\n';

  return code;
}

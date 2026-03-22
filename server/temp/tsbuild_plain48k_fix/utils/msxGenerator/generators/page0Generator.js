"use strict";
/**
 * @fileoverview Page 0 Generator - linear 48K page-0 cold data groups
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE0_BUDGET_BYTES = void 0;
exports.buildPage0Plan = buildPage0Plan;
exports.presentationScreenUsesPage0Group = presentationScreenUsesPage0Group;
exports.hasPage0DataGroups = hasPage0DataGroups;
exports.formatPage0PlanComments = formatPage0PlanComments;
exports.generatePage0File = generatePage0File;
exports.PAGE0_BUDGET_BYTES = 16 * 1024;
const SCREEN_WIDTH = 32;
const SCREEN_HEIGHT = 24;
const ASM_BYTES_PER_LINE = 16;
const EMPTY_PAGE0_PLAN = {
    budgetBytes: exports.PAGE0_BUDGET_BYTES,
    usedBytes: 0,
    remainingBytes: exports.PAGE0_BUDGET_BYTES,
    selectedGroups: [],
    rejectedGroups: [],
};
function hasValidPresentationScreenData(analysis) {
    const config = analysis.presentationScreen;
    if (!config?.enabled)
        return false;
    return Array.isArray(config.data?.nameTable) && config.data.nameTable.length === (SCREEN_WIDTH * SCREEN_HEIGHT);
}
function getPresentationScreenTotalBytes(analysis) {
    const config = analysis.presentationScreen;
    if (!config?.data)
        return 0;
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
function buildPage0Plan(analysis, romMode = 'simple32k') {
    if (romMode !== 'plain48k') {
        return EMPTY_PAGE0_PLAN;
    }
    const plan = {
        budgetBytes: exports.PAGE0_BUDGET_BYTES,
        usedBytes: 0,
        remainingBytes: exports.PAGE0_BUDGET_BYTES,
        selectedGroups: [],
        rejectedGroups: [],
    };
    if (!hasValidPresentationScreenData(analysis)) {
        return plan;
    }
    const presentationScreen = analysis.presentationScreen;
    const mode = presentationScreen.runtime?.romDataGroup ?? 'auto';
    const sizeBytes = getPresentationScreenTotalBytes(analysis);
    const baseGroup = {
        id: 'presentationScreen',
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
    }
    else {
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
function generateRawByteBlock(label, bytes, comments = []) {
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
function presentationScreenUsesPage0Group(analysis, romMode = 'plain48k') {
    return buildPage0Plan(analysis, romMode).selectedGroups.some(group => group.id === 'presentationScreen');
}
function hasPage0DataGroups(analysis, romMode = 'simple32k') {
    return buildPage0Plan(analysis, romMode).selectedGroups.length > 0;
}
function formatPage0PlanComments(plan) {
    const lines = [
        '; Page 0 Budget Planner',
        `; Budget: ${plan.budgetBytes} bytes`,
        `; Used: ${plan.usedBytes} bytes`,
        `; Remaining: ${plan.remainingBytes} bytes`,
    ];
    if (plan.selectedGroups.length > 0) {
        lines.push('; Selected groups:');
        lines.push(...plan.selectedGroups.map(group => `; - ${group.label}: ${group.sizeBytes} bytes [${group.mode}] ${group.reason}`));
    }
    else {
        lines.push('; Selected groups: none');
    }
    if (plan.rejectedGroups.length > 0) {
        lines.push('; Skipped groups:');
        lines.push(...plan.rejectedGroups.map(group => `; - ${group.label}: ${group.sizeBytes} bytes [${group.mode}] ${group.reason}`));
    }
    return lines.join('\n');
}
function generatePage0File(analysis, romMode = 'simple32k') {
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
    const presentationScreen = analysis.presentationScreen;
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

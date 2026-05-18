"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRegisterContractComment = buildRegisterContractComment;
function appendSection(lines, title, values) {
    if (!values || values.length === 0) {
        return;
    }
    lines.push(`;   ${title}:`);
    for (const value of values) {
        lines.push(`;     - ${value}`);
    }
}
/**
 * Build a standardized comment block that documents register expectations.
 * This is emitted inside generated ASM to avoid accidental register corruption.
 */
function buildRegisterContractComment(contract) {
    const lines = [];
    lines.push('; Register Contract:');
    if (contract.purpose) {
        lines.push(`;   Purpose: ${contract.purpose}`);
    }
    appendSection(lines, 'Inputs', contract.inputs);
    appendSection(lines, 'Outputs', contract.outputs);
    appendSection(lines, 'Clobbers', contract.clobbers);
    appendSection(lines, 'Preserved', contract.preserved);
    appendSection(lines, 'Register roles', contract.usage);
    appendSection(lines, 'Notes', contract.notes);
    return `${lines.join('\n')}\n`;
}

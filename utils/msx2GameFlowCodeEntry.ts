import {
  MSX2_CODE_ENTRY_MAX_CODES,
  MSX2_CODE_ENTRY_MAX_LENGTH,
  MSX2_CODE_ENTRY_MIN_LENGTH,
  MSX2_CODE_ENTRY_WRONG_PORT,
} from '../types';
import type { Msx2GameFlowCodeEntryNode, Msx2GameFlowConnection } from '../types';

/**
 * CodeEntry (password) node helpers shared by the GameFlow editor and the SCREEN 5 bitmap generator.
 * Ports: one per code (`from.sourceId` = code id) plus MSX2_CODE_ENTRY_WRONG_PORT for a wrong code / ESC.
 */

/** A code as the ROM compares it: upper-case A-Z / 0-9 only. */
export function normalizeMsx2Code(code: unknown): string {
  return String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function clampMsx2CodeLength(value: unknown): number {
  const numeric = Math.trunc(Number(value));
  if (!Number.isFinite(numeric)) return 4;
  return Math.max(MSX2_CODE_ENTRY_MIN_LENGTH, Math.min(MSX2_CODE_ENTRY_MAX_LENGTH, numeric));
}

/** Output ports in display order: the codes, then the wrong-code port. */
export function codeEntryPortIds(node: Msx2GameFlowCodeEntryNode): string[] {
  return [...(node.codes || []).slice(0, MSX2_CODE_ENTRY_MAX_CODES).map(code => code.id), MSX2_CODE_ENTRY_WRONG_PORT];
}

/** First port with no outgoing connection (where a new link should go), or undefined. */
export function firstFreeCodeEntryPort(
  node: Msx2GameFlowCodeEntryNode,
  connections: Msx2GameFlowConnection[],
): string | undefined {
  return codeEntryPortIds(node).find(port => !connections.some(c => c.from.nodeId === node.id && c.from.sourceId === port));
}

/** Editor validation for one CodeEntry node. */
export function codeEntryIssues(node: Msx2GameFlowCodeEntryNode, connections: Msx2GameFlowConnection[]): string[] {
  const issues: string[] = [];
  const name = `CodeEntry "${node.title || node.id}"`;
  const length = clampMsx2CodeLength(node.codeLength);
  const codes = node.codes || [];
  if (codes.length === 0) issues.push(`${name} needs at least one code.`);
  if (codes.length > MSX2_CODE_ENTRY_MAX_CODES) issues.push(`${name} has more than ${MSX2_CODE_ENTRY_MAX_CODES} codes; the extra ones are ignored.`);
  const seen = new Set<string>();
  for (const code of codes.slice(0, MSX2_CODE_ENTRY_MAX_CODES)) {
    const raw = String(code.code || '').trim();
    const normalized = normalizeMsx2Code(raw);
    if (normalized !== raw.toUpperCase() || normalized.length !== length) {
      issues.push(`${name}: code "${raw}" must be exactly ${length} characters A-Z / 0-9 (the ROM skips it).`);
    } else if (seen.has(normalized)) {
      issues.push(`${name}: code "${normalized}" is repeated; only the first one can ever match.`);
    }
    seen.add(normalized);
    const links = connections.filter(c => c.from.nodeId === node.id && c.from.sourceId === code.id);
    if (links.length === 0) issues.push(`${name}: code "${raw}" needs an outgoing connection.`);
    else if (links.length > 1) issues.push(`${name}: code "${raw}" has more than one outgoing connection.`);
  }
  const ports = new Set(codeEntryPortIds(node));
  for (const connection of connections.filter(c => c.from.nodeId === node.id)) {
    if (!connection.from.sourceId || !ports.has(connection.from.sourceId)) {
      issues.push(`${name} has an outgoing connection for an unknown code "${connection.from.sourceId || 'default'}".`);
    }
  }
  return issues;
}

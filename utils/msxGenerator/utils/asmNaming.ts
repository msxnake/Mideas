/**
 * @fileoverview ASM Naming Convention Utilities
 *
 * Convention:
 * - UPPERCASE: Constants (EQU values, sprite IDs, screen IDs, etc.)
 * - lowercase: Routine labels, variables, jump targets
 */

/** Convert routine name to lowercase (for labels, call, jp, jr targets) */
export function toRoutineLabel(name: string): string {
  return name.toLowerCase();
}

/** Keep constant name in UPPERCASE (for EQU definitions) */
export function toConstantName(name: string): string {
  return name.toUpperCase();
}

/** Sanitize and convert asset ID to routine label */
export function toAssetRoutineLabel(id: string, prefix: string = ''): string {
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return toRoutineLabel(prefix + sanitized);
}

/** Sanitize and convert asset ID to constant name */
export function toAssetConstant(id: string, prefix: string = ''): string {
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return toConstantName(prefix + sanitized);
}

/** Normalize label for safe ASM usage */
export function normalizeLabel(label: string): string {
  return label.replace(/[^a-zA-Z0-9_]/g, '_');
}

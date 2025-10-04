/**
 * @fileoverview ASM Code Formatting Utilities
 */

/**
 * Format ASM comment block
 */
export function formatComment(title: string, description?: string): string {
  let result = `; ==================================================================\n`;
  result += `; ${title.toUpperCase()}\n`;
  if (description) {
    result += `; ${description}\n`;
  }
  result += `; ==================================================================\n`;
  return result;
}

/**
 * Format ASM section header
 */
export function formatSection(title: string): string {
  return `\n; ==================================================================\n; ${title}\n; ==================================================================\n`;
}

/**
 * Format ASM subsection
 */
export function formatSubsection(title: string): string {
  return `\n; ${title}\n`;
}

/**
 * Format EQU constant definition
 */
export function formatEqu(name: string, value: number | string, comment?: string): string {
  const valueStr = typeof value === 'number' ? `#${value.toString(16).toUpperCase()}` : value;
  const commentStr = comment ? `  ; ${comment}` : '';
  return `${name.padEnd(24)} equ ${valueStr}${commentStr}\n`;
}

/**
 * Format label definition
 */
export function formatLabel(label: string, comment?: string): string {
  const commentStr = comment ? `  ; ${comment}` : '';
  return `${label}:${commentStr}\n`;
}

/**
 * Format DB (data byte) directive
 */
export function formatDb(data: string | number[], comment?: string): string {
  const dataStr = typeof data === 'string' ? `"${data}"` : data.map(b => `#${b.toString(16).padStart(2, '0')}`).join(', ');
  const commentStr = comment ? `  ; ${comment}` : '';
  return `    db ${dataStr}${commentStr}\n`;
}

/**
 * Format DW (data word) directive
 */
export function formatDw(value: string | number, comment?: string): string {
  const valueStr = typeof value === 'number' ? `#${value.toString(16).toUpperCase()}` : value;
  const commentStr = comment ? `  ; ${comment}` : '';
  return `    dw ${valueStr}${commentStr}\n`;
}

/**
 * Format DS (define space) directive
 */
export function formatDs(size: number, comment?: string): string {
  const commentStr = comment ? `  ; ${comment}` : '';
  return `    ds ${size}${commentStr}\n`;
}

/**
 * Convert byte array to hex string for ASM
 */
export function bytesToHexString(bytes: number[]): string {
  return bytes.map(b => `#${b.toString(16).padStart(2, '0')}`).join(', ');
}

/**
 * Format instruction with proper indentation
 */
export function formatInstruction(mnemonic: string, operands?: string, comment?: string): string {
  const instruction = operands ? `${mnemonic} ${operands}` : mnemonic;
  const commentStr = comment ? `  ; ${comment}` : '';
  return `    ${instruction.padEnd(30)}${commentStr}\n`;
}

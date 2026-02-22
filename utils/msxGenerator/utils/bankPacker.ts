/**
 * @fileoverview Bank packer utilities
 * Produces a deterministic 8KB bank packing report for diagnostics.
 */

const BANK_SIZE_8K = 8192;

const CORE_MODULES = new Set([
  'header.asm',
  'bios.asm',
  'constants.asm',
  'variables.asm',
  'mapper.asm',
  'interrupt.asm',
  'main.asm',
  'unitedFiles.asm'
]);

export interface BankPackEntry {
  moduleName: string;
  chunkBytes: number;
  bankIndex: number;
  bankOffset: number;
  segmentIndex: number;
  totalSegments: number;
}

export interface BankPackReport {
  bankSize: number;
  totalEstimatedBytes: number;
  banksUsed: number;
  entries: BankPackEntry[];
}

function parseNumericLiteral(raw: string): number | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^#([0-9a-f]+)$/.test(value)) return parseInt(value.slice(1), 16);
  if (/^0x([0-9a-f]+)$/.test(value)) return parseInt(value.slice(2), 16);
  if (/^([0-9a-f]+)h$/.test(value)) return parseInt(value.slice(0, -1), 16);
  return null;
}

function estimateDataDirectiveBytes(asm: string): number {
  let total = 0;
  const lines = asm.split(/\r?\n/);

  for (const line of lines) {
    const clean = line.split(';')[0].trim();
    if (!clean) continue;

    const dbMatch = clean.match(/^db\s+(.+)$/i);
    if (dbMatch) {
      total += dbMatch[1].split(',').filter((t) => t.trim().length > 0).length;
      continue;
    }

    const dwMatch = clean.match(/^dw\s+(.+)$/i);
    if (dwMatch) {
      total += dwMatch[1].split(',').filter((t) => t.trim().length > 0).length * 2;
      continue;
    }

    const dsMatch = clean.match(/^ds\s+(.+)$/i);
    if (dsMatch) {
      const size = parseNumericLiteral(dsMatch[1]);
      if (size !== null && size > 0) {
        total += size;
      }
    }
  }

  return total;
}

function estimateAsmBytes(asm: string): number {
  if (!asm) return 0;
  const dataDirectiveBytes = estimateDataDirectiveBytes(asm);
  const textBytes = new TextEncoder().encode(asm).length;
  const heuristicInstructionBytes = Math.floor(textBytes * 0.28);
  return Math.max(dataDirectiveBytes, heuristicInstructionBytes);
}

export function buildBankPackReport(files: Record<string, string>): BankPackReport {
  const modules = Object.entries(files)
    .filter(([name, content]) => !!content && !CORE_MODULES.has(name))
    .map(([moduleName, content]) => ({
      moduleName,
      estimatedBytes: estimateAsmBytes(content)
    }))
    .filter((m) => m.estimatedBytes > 0);

  const entries: BankPackEntry[] = [];
  let bankIndex = 0;
  let bankOffset = 0;
  let totalEstimatedBytes = 0;

  for (const module of modules) {
    let remaining = module.estimatedBytes;
    let segmentIndex = 0;
    const totalSegments = Math.max(1, Math.ceil(module.estimatedBytes / BANK_SIZE_8K));

    while (remaining > 0) {
      const spaceLeft = BANK_SIZE_8K - bankOffset;
      const chunkBytes = Math.min(remaining, spaceLeft);

      entries.push({
        moduleName: module.moduleName,
        chunkBytes,
        bankIndex,
        bankOffset,
        segmentIndex,
        totalSegments
      });

      remaining -= chunkBytes;
      totalEstimatedBytes += chunkBytes;
      bankOffset += chunkBytes;
      segmentIndex++;

      if (bankOffset >= BANK_SIZE_8K) {
        bankIndex++;
        bankOffset = 0;
      }
    }
  }

  const banksUsed = totalEstimatedBytes === 0 ? 0 : (bankOffset === 0 ? bankIndex : bankIndex + 1);

  return {
    bankSize: BANK_SIZE_8K,
    totalEstimatedBytes,
    banksUsed,
    entries
  };
}

export function formatBankPackReportAsAsmComments(report: BankPackReport): string {
  const lines: string[] = [];
  lines.push('; ------------------------------------------------------------------');
  lines.push('; 8KB BANK PACKER ESTIMATE (diagnostic placement view)');
  lines.push('; Runtime bank constants are derived from label addresses at assemble time.');
  lines.push(`; Estimated payload bytes: ${report.totalEstimatedBytes}`);
  lines.push(`; Estimated banks used: ${report.banksUsed}`);
  lines.push('; ------------------------------------------------------------------');

  if (report.entries.length === 0) {
    lines.push('; No banked payload candidates detected.');
    return lines.join('\n');
  }

  for (const entry of report.entries) {
    const offsetHex = entry.bankOffset.toString(16).toUpperCase().padStart(4, '0');
    const partLabel = entry.totalSegments > 1
      ? ` part ${entry.segmentIndex + 1}/${entry.totalSegments}`
      : '';
    lines.push(`; BANK ${entry.bankIndex.toString().padStart(2, '0')} @#${offsetHex} : ${entry.moduleName}${partLabel} (${entry.chunkBytes} bytes)`);
  }

  return lines.join('\n');
}

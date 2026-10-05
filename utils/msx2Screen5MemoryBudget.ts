// Memory budget indicator for MSX2 SCREEN 5 bitmap-room projects.
//
// Two scarce resources are measured:
//  - RAM: the dedicated runtime chain (#D000..#EFFF) the bitmap generator fills
//    system by system. The generator reports it as a one-line JSON comment
//    (`; @mideas-ram-budget {...}`) in unitedFiles.asm, so no assembly is needed.
//  - Resident window: #4000..#BFFF of the boot image (code + tables that must
//    be mapped all the time). Only Glass knows its size, so it is read from the
//    `bitmap_resident_end` symbol of a real compile.
//
// The MegaROM bank map reuses both: the generator lists every data/music/intro
// bank in `; @mideas-bank-map {...}` (the ones it cannot size are read from a
// `*_USED_END` symbol or from the ROM image), and banks 0-3 are the resident
// window. The server pads the image to a power-of-two number of banks, so the map
// also lists the empty banks up to that size.
import type { ProjectAsset } from '../types';

export const SCREEN5_RESIDENT_START = 0x4000;
export const SCREEN5_RESIDENT_END = 0xC000;
export const MEGAROM_BANK_BYTES = 0x2000;
// The boot image #4000-#BFFF is banks 0-3; the generator's data banks start at 4.
export const SCREEN5_RESIDENT_BANK_COUNT = (SCREEN5_RESIDENT_END - SCREEN5_RESIDENT_START) / MEGAROM_BANK_BYTES;

// The server pads every MegaROM to 2^n banks of 8 KB, never fewer than 4 (32 KB).
export const MEGAROM_MIN_BANKS = 4;

export type Screen5BankKind = 'resident' | 'data' | 'music' | 'intro-code' | 'intro-image' | 'fx-code' | 'tfx-code' | 'reserved' | 'free';

/** One entry of the generator's `; @mideas-bank-map` report (banks 4+; the resident banks are derived). */
export interface Screen5BankReportEntry {
  bank: number;
  kind: Exclude<Screen5BankKind, 'resident' | 'reserved' | 'free'>;
  /** Bytes known to the generator. Absent when only the compile can size the bank. */
  used?: number;
  /** Symbol that marks the end of the used bytes, and the Z80 address the bank is assembled at. */
  endLabel?: string;
  startAddr?: number;
  /** 'rom-tail': used = bank size minus the trailing #FF bytes of the bank in the ROM image. */
  measure?: 'rom-tail';
  blockCount?: number;
  blocks?: string[];
}

export interface Screen5BankReport {
  bankBytes: number;
  banks: Screen5BankReportEntry[];
}

export interface Screen5BankEntry {
  bank: number;
  kind: Screen5BankKind;
  /** Bytes in use; undefined when the bank could not be measured. */
  used?: number;
  blockCount?: number;
  blocks?: string[];
}

export interface Screen5BankMap {
  banks: Screen5BankEntry[];
  /** Banks of the exported ROM image: the content rounded up to a power of two. */
  bankCount: number;
  /** Banks up to the last one that holds something (highest used bank number + 1). */
  contentBankCount: number;
}

export interface Screen5RamSection {
  name: string;
  start: number;
  bytes: number;
}

export interface Screen5RamBudget {
  chainBase: number;
  chainStart: number;
  chainEnd: number;
  chainCeiling: number;
  skillsBase: number;
  skillsEnd: number;
  sections: Screen5RamSection[];
}

export interface Screen5ResidentBudget {
  status: 'ok' | 'overflow' | 'unavailable';
  usedBytes?: number;
  freeBytes?: number;
  overflowBytes?: number;
  message?: string;
}

export interface Screen5MemoryBudget {
  measuredAt: number;
  ram?: Screen5RamBudget;
  ramError?: string;
  resident: Screen5ResidentBudget;
  /** MegaROM bank map; absent when the generated ASM carries no bank report (not a MegaROM export). */
  banks?: Screen5BankMap;
}

export function parseScreen5RamBudget(asm: string): Screen5RamBudget | undefined {
  const match = asm.match(/^; @mideas-ram-budget (\{.*\})\s*$/m);
  if (!match) return undefined;
  try {
    return JSON.parse(match[1]) as Screen5RamBudget;
  } catch {
    return undefined;
  }
}

export function parseScreen5BankReport(asm: string): Screen5BankReport | undefined {
  const match = asm.match(/^; @mideas-bank-map (\{.*\})\s*$/m);
  if (!match) return undefined;
  try {
    return JSON.parse(match[1]) as Screen5BankReport;
  } catch {
    return undefined;
  }
}

// Glass .sym line: `bitmap_resident_end: equ 9F3AH`
export function parseResidentEndFromSym(sym: string): number | undefined {
  const match = sym.match(/^bitmap_resident_end:\s*equ\s+([0-9A-Fa-f]+)H\s*$/m);
  return match ? parseInt(match[1], 16) : undefined;
}

export function parseSymbolTable(sym: string): Map<string, number> {
  const table = new Map<string, number>();
  for (const match of sym.matchAll(/^(\S+):\s*equ\s+([0-9A-Fa-f]+)H\s*$/gm)) {
    table.set(match[1], parseInt(match[2], 16));
  }
  return table;
}

/**
 * Bytes of a bank that are not trailing #FF, read from the ROM image as the hex
 * string `/compile` returns (bank N starts at byte N * bankBytes). Real data
 * that ends in #FF reads a byte or two short; padding is what this is for.
 */
export function usedBytesFromRomTail(romHex: string, bank: number, bankBytes: number = MEGAROM_BANK_BYTES): number | undefined {
  const start = bank * bankBytes * 2;
  const end = start + bankBytes * 2;
  if (romHex.length < end) return undefined;
  const isF = (index: number) => (romHex.charCodeAt(index) | 0x20) === 0x66;
  let cursor = end;
  while (cursor > start && isF(cursor - 1) && isF(cursor - 2)) cursor -= 2;
  return (cursor - start) / 2;
}

export interface Screen5CompileMeasurement {
  /** End of the resident image (`bitmap_resident_end`); the four boot banks are filled up to it. */
  residentEnd?: number;
  symbols?: Map<string, number>;
  /** The compiled ROM image as the hex string `/compile` returns. */
  romHex?: string;
  /** Banks of the exported (padded) ROM image, when the server said. Otherwise derived from the content. */
  romBanks?: number;
}

/** What the server does to the image: 2^n banks, at least `MEGAROM_MIN_BANKS`. */
export function paddedRomBankCount(contentBanks: number): number {
  let banks = MEGAROM_MIN_BANKS;
  while (banks < contentBanks) banks *= 2;
  return banks;
}

// Konami SCC: a bank whose low 6 bits are #3F would expose the SCC in the P2 window, so it never holds data.
const isSccWindowBank = (bank: number) => (bank & 0x3f) === 0x3f;

/**
 * Lays out every bank of the ROM image from the generator's report plus what the
 * compile measured. Banks 0-3 are the resident window (filled up to
 * `residentEnd`); a bank number nobody uses between the data banks is one the
 * generator keeps as #FF because its low 6 bits are #3F (it would expose the SCC).
 */
export function buildScreen5BankMap(report: Screen5BankReport, measurement: Screen5CompileMeasurement): Screen5BankMap {
  const { residentEnd, symbols, romHex, romBanks } = measurement;
  const bankBytes = report.bankBytes || MEGAROM_BANK_BYTES;
  const byBank = new Map<number, Screen5BankEntry>();

  for (let bank = 0; bank < SCREEN5_RESIDENT_BANK_COUNT; bank++) {
    const bankStart = SCREEN5_RESIDENT_START + bank * bankBytes;
    byBank.set(bank, {
      bank,
      kind: 'resident',
      used: residentEnd === undefined ? undefined : Math.max(0, Math.min(bankBytes, residentEnd - bankStart)),
    });
  }

  for (const entry of report.banks) {
    const end = entry.endLabel ? symbols?.get(entry.endLabel) : undefined;
    const fromSymbol = end !== undefined && entry.startAddr !== undefined ? end - entry.startAddr : undefined;
    const fromRom = entry.measure === 'rom-tail' && romHex ? usedBytesFromRomTail(romHex, entry.bank, bankBytes) : undefined;
    byBank.set(entry.bank, {
      bank: entry.bank,
      kind: entry.kind,
      used: fromSymbol ?? fromRom ?? entry.used,
      blockCount: entry.blockCount,
      blocks: entry.blocks,
    });
  }

  const contentBankCount = Math.max(...byBank.keys()) + 1;
  // The server's own figure wins; it can only be larger than the content (the image is padded, never cut).
  const bankCount = Math.max(contentBankCount, romBanks ?? paddedRomBankCount(contentBankCount));
  const banks: Screen5BankEntry[] = [];
  for (let bank = 0; bank < bankCount; bank++) {
    const entry = byBank.get(bank);
    if (entry) banks.push(entry);
    // Padding at the end of the image is empty ROM, except for the numbers the SCC claims.
    else if (bank < contentBankCount || isSccWindowBank(bank)) banks.push({ bank, kind: 'reserved' });
    else banks.push({ bank, kind: 'free', used: 0 });
  }
  return { banks, bankCount, contentBankCount };
}

export const formatHex = (value: number) => `#${value.toString(16).toUpperCase().padStart(4, '0')}`;

export function getBackendBaseUrl(): string {
  const env = (import.meta as any).env as Record<string, string | undefined> | undefined;
  const configured = env?.VITE_BACKEND_URL?.trim() || env?.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location.hostname) return `http://${window.location.hostname}:3001`;
  return 'http://localhost:3001';
}

// Same asset set the export modal feeds the generator, minus the presentation
// screen (which would switch the emitter away from bitmap rooms).
function buildGeneratorAssets(assets: ProjectAsset[], entityTemplates: any[], componentDefinitions: any[]): ProjectAsset[] {
  const out = [...assets];
  for (const template of entityTemplates || []) {
    out.push({ id: template.id, type: 'entitytemplate', name: template.name || template.id, data: template } as ProjectAsset);
  }
  for (const compDef of componentDefinitions || []) {
    if (!out.find(a => a.id === compDef.id && a.type === 'componentdefinition')) {
      out.push({ id: compDef.id, type: 'componentdefinition', name: compDef.name || compDef.id, data: compDef } as ProjectAsset);
    }
  }
  return out;
}

interface ResidentMeasurement extends Screen5CompileMeasurement {
  resident: Screen5ResidentBudget;
}

async function measureResident(code: string, projectName: string): Promise<ResidentMeasurement> {
  const baseUrl = getBackendBaseUrl();
  let result: any;
  try {
    const response = await fetch(`${baseUrl}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        generateSymbols: true,
        projectName: `${projectName}_membudget`,
        romMode: 'megarom',
        targetFormat: 'konami',
        autoMegaROM: false,
      }),
    });
    result = await response.json();
  } catch (error) {
    return { resident: { status: 'unavailable', message: `Servidor de compilación no disponible (${baseUrl}).` } };
  }

  if (!result?.success) {
    const overflow = typeof result?.negativeDsOverflowBytes === 'number' ? result.negativeDsOverflowBytes : undefined;
    if (overflow !== undefined) {
      return { resident: { status: 'overflow', overflowBytes: overflow, message: `Glass: ds negativo, te pasas ${overflow} bytes.` } };
    }
    return { resident: { status: 'unavailable', message: String(result?.details || result?.error || 'La compilación falló.').slice(0, 400) } };
  }

  if (!result.symbolFile) {
    return { resident: { status: 'unavailable', message: 'Compiló, pero el servidor no devolvió el fichero .sym.' } };
  }
  const romHex = typeof result.data === 'string' ? result.data : undefined;
  const reportedBanks = Number(result.romSizeInfo?.targetHardwareBanks);
  const romBanks = Number.isInteger(reportedBanks) && reportedBanks > 0
    ? reportedBanks
    : romHex ? Math.floor(romHex.length / 2 / MEGAROM_BANK_BYTES) : undefined;
  try {
    const symResponse = await fetch(`${baseUrl}/download/${encodeURIComponent(result.symbolFile)}`);
    const symText = await symResponse.text();
    const symbols = parseSymbolTable(symText);
    const end = parseResidentEndFromSym(symText);
    if (end === undefined) {
      return { resident: { status: 'unavailable', message: 'No se encontró bitmap_resident_end en el .sym.' }, symbols, romHex, romBanks };
    }
    const usedBytes = end - SCREEN5_RESIDENT_START;
    return { resident: { status: 'ok', usedBytes, freeBytes: SCREEN5_RESIDENT_END - end }, symbols, residentEnd: end, romHex, romBanks };
  } catch {
    return { resident: { status: 'unavailable', message: 'No se pudo descargar el .sym.' } };
  }
}

export async function measureScreen5MemoryBudget(
  projectName: string,
  assets: ProjectAsset[],
  entityTemplates: any[],
  componentDefinitions: any[],
): Promise<Screen5MemoryBudget> {
  const measuredAt = Date.now();
  const { generateModularASM } = await import('./msxGenerator');
  let code: string;
  try {
    const files = generateModularASM(projectName, buildGeneratorAssets(assets, entityTemplates, componentDefinitions), {
      generateUnified: true,
      romMode: 'megarom',
      targetFormat: 'konami',
      autoMegaROM: false,
      screenMode: 'SCREEN 4 (Graphics II)',
      targetGraphicsBackend: 'screen5',
    } as any);
    code = files['unitedFiles.asm'] || files['main.asm'] || '';
  } catch (error) {
    // The generator throws when the RAM chain overflows #F000 (among others).
    return {
      measuredAt,
      ramError: error instanceof Error ? error.message : String(error),
      resident: { status: 'unavailable', message: 'No se generó el ASM.' },
    };
  }

  const ram = parseScreen5RamBudget(code);
  const { resident, ...measurement } = await measureResident(code, projectName);
  const bankReport = parseScreen5BankReport(code);
  return {
    measuredAt,
    ram,
    ramError: ram ? undefined : 'El ASM generado no trae el informe de RAM (¿no es un proyecto de bitmap rooms?).',
    resident,
    // On a resident overflow the four boot banks are, by definition, full.
    banks: bankReport
      ? buildScreen5BankMap(bankReport, resident.status === 'overflow' ? { ...measurement, residentEnd: SCREEN5_RESIDENT_END } : measurement)
      : undefined,
  };
}

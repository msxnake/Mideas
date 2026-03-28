export interface MegaromDataGroupInput {
  groupName: string;
  asm: string;
}

export interface MegaromDataBlock {
  groupName: string;
  label: string;
  asm: string;
  byteSize: number;
}

export interface MegaromPackedDataBlock extends MegaromDataBlock {
  zoneIndex: number;
  zoneOffset: number;
}

export interface MegaromDataZone {
  zoneIndex: number;
  orgAddress: number;
  endAddress: number;
  usedBytes: number;
  remainingBytes: number;
  physicalBank: number;
  blocks: MegaromPackedDataBlock[];
}

export interface MegaromDataPackResult {
  zoneSize: number;
  dataStartAddress: number;
  totalBlockBytes: number;
  zones: MegaromDataZone[];
  overflowBlocks: MegaromDataBlock[];
  diagnosticsComment: string;
  asm: string;
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

function countDirectiveBytes(line: string): number {
  const clean = line.split(';')[0].trim();
  if (!clean) return 0;

  const dbMatch = clean.match(/^db\s+(.+)$/i);
  if (dbMatch) {
    return dbMatch[1]
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
      .length;
  }

  const dwMatch = clean.match(/^dw\s+(.+)$/i);
  if (dwMatch) {
    return dwMatch[1]
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
      .length * 2;
  }

  const dsMatch = clean.match(/^ds\s+([^,]+)/i);
  if (dsMatch) {
    const size = parseNumericLiteral(dsMatch[1]);
    return size && size > 0 ? size : 0;
  }

  return 0;
}

function splitDataBlocks(group: MegaromDataGroupInput): MegaromDataBlock[] {
  const lines = group.asm.split(/\r?\n/);
  const blocks: MegaromDataBlock[] = [];
  const prelude: string[] = [];
  let currentLabel: string | null = null;
  let currentLines: string[] = [];
  let currentBytes = 0;

  const flushCurrent = () => {
    if (!currentLabel) return;
    blocks.push({
      groupName: group.groupName,
      label: currentLabel,
      asm: currentLines.join('\n').trimEnd(),
      byteSize: currentBytes,
    });
    currentLabel = null;
    currentLines = [];
    currentBytes = 0;
  };

  for (const line of lines) {
    const labelMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*):(?:\s*;.*)?\s*$/);
    if (labelMatch) {
      flushCurrent();
      currentLabel = labelMatch[1];
      currentLines = [...prelude, line];
      prelude.length = 0;
      continue;
    }

    if (!currentLabel) {
      prelude.push(line);
      continue;
    }

    currentLines.push(line);
    currentBytes += countDirectiveBytes(line);
  }

  flushCurrent();
  return blocks;
}

function formatHex(value: number): string {
  return `#${value.toString(16).toUpperCase().padStart(4, '0')}`;
}

function formatDiagnosticsComment(
  zoneSize: number,
  dataStartAddress: number,
  zones: MegaromDataZone[],
  overflowBlocks: MegaromDataBlock[],
  totalBlockBytes: number
): string {
  const lines: string[] = [];
  lines.push('; ------------------------------------------------------------------');
  lines.push('; MEGAROM DATA ZONE PACKER');
  lines.push(`; Zone size: ${zoneSize} bytes`);
  lines.push(`; Data start address: ${formatHex(dataStartAddress)}`);
  lines.push(`; Total data bytes (source blocks): ${totalBlockBytes}`);
  lines.push(`; Zones used: ${zones.length}`);
  lines.push('; ------------------------------------------------------------------');

  if (zones.length === 0) {
    lines.push('; No banked data blocks emitted.');
  }

  for (const zone of zones) {
    lines.push(
      `; ZONE ${zone.zoneIndex.toString().padStart(2, '0')} ` +
      `[${formatHex(zone.orgAddress)}-${formatHex(zone.endAddress)}] ` +
      `bank ${zone.physicalBank} used=${zone.usedBytes} slack=${zone.remainingBytes}`
    );
    for (const block of zone.blocks) {
      lines.push(
        `;   + ${block.label} (${block.groupName}) @ +${formatHex(block.zoneOffset)} size=${block.byteSize}`
      );
    }
  }

  if (overflowBlocks.length > 0) {
    lines.push('; ------------------------------------------------------------------');
    lines.push('; OVERFLOW BLOCKS');
    for (const block of overflowBlocks) {
      lines.push(`;   ! ${block.label} (${block.groupName}) size=${block.byteSize} exceeds zone size ${zoneSize}`);
    }
  }

  return lines.join('\n');
}

export function packMegaromDataGroups(
  groups: MegaromDataGroupInput[],
  dataStartAddress: number,
  zoneSize: number
): MegaromDataPackResult {
  const blocks = groups
    .flatMap(splitDataBlocks)
    .filter((block) => block.asm.trim().length > 0);

  const overflowBlocks: MegaromDataBlock[] = [];
  const zones: MegaromDataZone[] = [];
  let currentZoneBlocks: MegaromPackedDataBlock[] = [];
  let currentZoneUsed = 0;
  let zoneIndex = 0;

  const flushZone = () => {
    if (currentZoneBlocks.length === 0) return;
    const orgAddress = dataStartAddress + (zoneIndex * zoneSize);
    const endAddress = orgAddress + zoneSize;
    zones.push({
      zoneIndex,
      orgAddress,
      endAddress,
      usedBytes: currentZoneUsed,
      remainingBytes: zoneSize - currentZoneUsed,
      physicalBank: (orgAddress - 0x4000) / zoneSize,
      blocks: currentZoneBlocks,
    });
    zoneIndex += 1;
    currentZoneBlocks = [];
    currentZoneUsed = 0;
  };

  for (const block of blocks) {
    if (block.byteSize > zoneSize) {
      overflowBlocks.push(block);
      continue;
    }

    if (currentZoneBlocks.length > 0 && currentZoneUsed + block.byteSize > zoneSize) {
      flushZone();
    }

    currentZoneBlocks.push({
      ...block,
      zoneIndex,
      zoneOffset: currentZoneUsed,
    });
    currentZoneUsed += block.byteSize;
  }

  flushZone();

  const asmParts: string[] = [];
  for (const zone of zones) {
    asmParts.push(`    org ${formatHex(zone.orgAddress)}`);
    asmParts.push('; ==================================================================');
    asmParts.push(
      `; DATA ZONE ${zone.zoneIndex.toString().padStart(2, '0')} ` +
      `(bank ${zone.physicalBank}) used=${zone.usedBytes} slack=${zone.remainingBytes}`
    );
    asmParts.push('; ==================================================================');
    asmParts.push(zone.blocks.map((block) => block.asm).join('\n\n'));
    asmParts.push(`    ds ${formatHex(zone.endAddress)} - $, #FF`);
    asmParts.push('');
  }

  const totalBlockBytes = blocks.reduce((sum, block) => sum + block.byteSize, 0);

  return {
    zoneSize,
    dataStartAddress,
    totalBlockBytes,
    zones,
    overflowBlocks,
    diagnosticsComment: formatDiagnosticsComment(zoneSize, dataStartAddress, zones, overflowBlocks, totalBlockBytes),
    asm: asmParts.join('\n').trimEnd(),
  };
}

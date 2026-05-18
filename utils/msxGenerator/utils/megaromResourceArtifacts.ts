import type { MapperWindowConfig } from '../generators/mapperWindowUtils';
import type { MegaromDataPackResult, MegaromPackedDataBlock } from './megaromDataPacker';
import type { ProjectAnalysis } from '../../asmTemplateGenerator';
import { resolveTileAssignmentCharCode } from '../../../utils/tileBankOptimization';
import { analyzeComponentUsage } from './componentAnalyzer';
import { ACTION_IDS, CONDITION_IDS } from '../generators/stateMachineGenerator';

export interface MegaromResourceDescriptor {
  id: number;
  label: string;
  resourceIdLabel: string;
  resourceTypeKey: string;
  resourceGroupKey: string;
  physicalBank: number;
  physicalAddress: number;
  windowAddress: number;
  zoneOffset: number;
  size: number;
  uncompressedSize: number;
  flags: number;
  sourceIndex: number;
}

export interface MegaromGeneratedArtifact {
  fileName: string;
  content: string;
}

const SCREEN2_DYNAMIC_TILE_CHAR_MAX = 253;
const BOSS_ATTACK_RUNTIME_TYPES = [
  'Projectile',
  'Meteor',
  'Bomb',
  'Boomerang',
  'Rock',
  'Laser',
  'SineWave',
  'HomingMissile',
  'SlamRocks',
  'FallingBlocks',
];

const COMPONENT_RUNTIME_TYPES = [
  'Input',
  'Position',
  'Movement',
  'Collision',
  'Sprite',
  'Behavior',
  'Health',
  'Animation',
  'Jump',
  'Gravity',
  'WallGrab',
  'WallJump',
  'TileInteraction',
  'AutoDestroy',
  'Cursors',
  'StateMachine',
  'Carry',
  'Damage',
  'Shoot',
  'WallCollision',
  'DeadlyTiles',
  'InWater',
  'Collectible',
  'RetractableGate',
  'AutoControlScript',
  'Mirror',
];

function sanitizeAsmKey(value: string): string {
  return value
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

export function buildResourceIdLabelFromAsmLabel(label: string): string {
  return `RESOURCE_ID_${sanitizeAsmKey(label)}`;
}

function formatHex(value: number, digits = 4): string {
  return `#${value.toString(16).toUpperCase().padStart(digits, '0')}`;
}

function buildBankMetadataChecksum(parts: Array<string | number | null | undefined>): string {
  // Keep this in sync with scripts/build_mideas_unified_rom.py for artifact drift checks.
  let hash = 0x811c9dc5;
  const input = parts.map((part) => String(part ?? '')).join('|');
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).toUpperCase().padStart(8, '0')}`;
}

function buildBankVerification(
  bank: number,
  usedBytes: number,
  resourceSummaries: Array<{
    id: number | null;
    label: string;
    zoneOffset: number;
    size: number;
    uncompressedSize: number;
    flags: number;
  }>
) {
  // Sort by the in-bank address so equivalent JSON orderings produce the same checksum.
  const ordered = [...resourceSummaries].sort((left, right) => {
    if (left.zoneOffset !== right.zoneOffset) return left.zoneOffset - right.zoneOffset;
    return String(left.label).localeCompare(String(right.label));
  });
  return {
    algorithm: 'fnv1a32-resource-metadata',
    metadataChecksum: buildBankMetadataChecksum([
      bank,
      usedBytes,
      ...ordered.flatMap((resource) => [
        resource.id,
        resource.label,
        resource.zoneOffset,
        resource.size,
        resource.uncompressedSize,
        resource.flags,
      ]),
    ]),
    resourceCount: ordered.length,
    storedBytes: usedBytes,
  };
}

function inferResourceGroupKey(groupName: string): string {
  const normalized = groupName.trim().toLowerCase();
  switch (normalized) {
    case 'sprites':
      return 'SPRITES';
    case 'patterns':
      return 'PATTERNS';
    case 'colors':
      return 'COLORS';
    case 'screens':
      return 'SCREENS';
    case 'font':
      return 'FONT';
    case 'presentation':
      return 'PRESENTATION';
    case 'sound':
      return 'SOUND';
    default:
      return sanitizeAsmKey(normalized || 'misc');
  }
}

function inferResourceTypeKey(groupName: string, label: string): string {
  const group = groupName.trim().toLowerCase();
  const upperLabel = label.toUpperCase();

  if (group === 'patterns') {
    return upperLabel.includes('SPRITE') ? 'SPRITE_PATTERNS' : 'TILE_PATTERNS';
  }

  if (group === 'sprites') {
    return 'SPRITE_PATTERNS';
  }

  if (group === 'colors') {
    return 'TILE_COLORS';
  }

  if (group === 'font') {
    return upperLabel.includes('COLOR') ? 'FONT_COLORS' : 'FONT_PATTERNS';
  }

  if (group === 'presentation') {
    if (upperLabel.includes('NAMETBL')) return 'SCREEN_NAME_TABLE';
    if (upperLabel.includes('COLOR')) return 'SCREEN_COLORS';
    if (upperLabel.includes('PATTERN')) return 'SCREEN_PATTERNS';
    return 'PRESENTATION_DATA';
  }

  if (group === 'sound') {
    if (upperLabel.startsWith('MUSIC_TRACK_')) return 'MUSIC_TRACK';
    return 'SOUND_DATA';
  }

  if (group === 'screens') {
    if (upperLabel.includes('EFFECT_ZONE_TABLE')) return 'SCREEN_EFFECT_ZONE_TABLE';
    if (upperLabel.startsWith('BEHAVIOR_')) return 'SCREEN_BEHAVIOR_MAP';
    if (upperLabel.includes('EFFECTS_LAYOUT')) return 'SCREEN_EFFECTS_LAYOUT';
    if (upperLabel.includes('BLOCK_CATALOG')) return 'SCREEN_BLOCK_CATALOG';
    if (upperLabel.includes('BLOCK_MAP')) return 'SCREEN_BLOCK_MAP';
    if (upperLabel.includes('LAYOUT')) return 'SCREEN_LAYOUT';
    return 'SCREEN_DATA';
  }

  return 'GENERIC_DATA';
}

function buildGroupCodeMap(resources: MegaromResourceDescriptor[]): Map<string, number> {
  const groupMap = new Map<string, number>();
  let nextCode = 1;
  for (const resource of resources) {
    if (!groupMap.has(resource.resourceGroupKey)) {
      groupMap.set(resource.resourceGroupKey, nextCode++);
    }
  }
  return groupMap;
}

function buildTypeCodeMap(resources: MegaromResourceDescriptor[]): Map<string, number> {
  const typeMap = new Map<string, number>();
  let nextCode = 1;
  for (const resource of resources) {
    if (!typeMap.has(resource.resourceTypeKey)) {
      typeMap.set(resource.resourceTypeKey, nextCode++);
    }
  }
  return typeMap;
}

function buildResourceDescriptors(
  packResult: MegaromDataPackResult,
  mapperWindow: MapperWindowConfig
): MegaromResourceDescriptor[] {
  return packResult.zones
    .flatMap((zone) => zone.blocks)
    .sort((left, right) => left.sourceIndex - right.sourceIndex)
    .map((block, index) => buildResourceDescriptor(block, index, mapperWindow));
}

function buildResourceDescriptor(
  block: MegaromPackedDataBlock,
  id: number,
  mapperWindow: MapperWindowConfig
): MegaromResourceDescriptor {
  const resourceIdLabel = buildResourceIdLabelFromAsmLabel(block.label);
  const logicalBank = Math.trunc((block.physicalAddress - 0x4000) / mapperWindow.dataZoneSize);
  const runtimeBank = mapperWindow.targetFormat === 'ascii16'
    // Glass emits cartridge bytes from the #4000 origin, while ASCII16 mapper
    // registers select 16 KB ROM-file segments. Data placed at ASM #10000 is
    // therefore runtime segment 1, not logical bank 3 from the ASM address.
    ? Math.max(0, logicalBank - 2)
    : logicalBank;
  return {
    id,
    label: block.label,
    resourceIdLabel,
    resourceTypeKey: inferResourceTypeKey(block.groupName, block.label),
    resourceGroupKey: inferResourceGroupKey(block.groupName),
    physicalBank: runtimeBank,
    physicalAddress: block.physicalAddress,
    windowAddress: parseInt(mapperWindow.windowBaseExpr.slice(1), 16) + block.zoneOffset,
    zoneOffset: block.zoneOffset,
    size: block.byteSize,
    uncompressedSize: block.byteSize,
    flags: 0,
    sourceIndex: block.sourceIndex,
  };
}

function buildResourceIdsAsm(resources: MegaromResourceDescriptor[]): string {
  const lines: string[] = [];
  lines.push('; ==================================================================');
  lines.push('; GENERATED RESOURCE IDS');
  lines.push('; Generated by MegaROM export backend.');
  lines.push('; ==================================================================');
  lines.push('RESOURCE_ID_INVALID EQU #FF');
  lines.push('');
  for (const resource of resources) {
    lines.push(`${resource.resourceIdLabel.padEnd(40)} EQU ${resource.id}`);
  }
  return lines.join('\n').trimEnd();
}

function buildResourceTableAsm(resources: MegaromResourceDescriptor[]): string {
  const lines: string[] = [];
  lines.push('; ==================================================================');
  lines.push('; GENERATED RESOURCE TABLE');
  lines.push('; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags');
  lines.push('; Resource id is the zero-based descriptor index.');
  lines.push('; Address is the mapper-window address visible after selecting bank.');
  lines.push('; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.');
  lines.push('; ==================================================================');
  lines.push(`RESOURCE_TABLE_ENTRY_SIZE EQU 8`);
  lines.push(`RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01`);
  lines.push(`RESOURCE_TABLE_COUNT EQU ${resources.length}`);
  lines.push('');
  lines.push('resource_table:');
  if (resources.length === 0) {
    lines.push('    ; No banked resources generated for this build.');
  }

  for (const resource of resources) {
    lines.push(`    ; ${resource.label}`);
    lines.push(`    db ${resource.physicalBank}`);
    lines.push(`    dw ${formatHex(resource.windowAddress)}`);
    lines.push(`    dw ${resource.size}`);
    lines.push(`    dw ${resource.uncompressedSize}`);
    lines.push(`    db ${resource.flags}`);
  }

  return lines.join('\n').trimEnd();
}

function buildPackingManifestText(
  packResult: MegaromDataPackResult,
  resources: MegaromResourceDescriptor[]
): string {
  const resourceByLabel = new Map(resources.map((resource) => [resource.label, resource]));
  const lines: string[] = [];
  lines.push('MEGAROM PACKING MANIFEST');
  lines.push(`Zone size: ${packResult.zoneSize}`);
  lines.push(`Data start address: ${formatHex(packResult.dataStartAddress)}`);
  lines.push(`Total resource blocks: ${resources.length}`);
  lines.push('');

  for (const zone of packResult.zones) {
    lines.push(`BANK ${zone.physicalBank.toString().padStart(2, '0')} used ${zone.usedBytes} / ${packResult.zoneSize}`);
    for (const block of zone.blocks) {
      const resource = resourceByLabel.get(block.label);
      if (!resource) {
        continue;
      }
      lines.push(
        `- ${resource.label.padEnd(32)} ` +
        `${resource.size.toString().padStart(5, ' ')} stored / ` +
        `${resource.uncompressedSize.toString().padStart(5, ' ')} raw bytes ` +
        `@ ${formatHex(resource.windowAddress)} ` +
        `(rom ${formatHex(resource.physicalAddress)}, offset +${formatHex(resource.zoneOffset)}) ` +
        `[${resource.resourceGroupKey}/${resource.resourceTypeKey}]`
      );
    }
    lines.push(`FREE ${zone.remainingBytes}`);
    lines.push('');
  }

  if (packResult.overflowBlocks.length > 0) {
    lines.push('OVERFLOW BLOCKS');
    for (const block of packResult.overflowBlocks) {
      lines.push(`- ${block.label} ${block.byteSize} bytes`);
    }
  }

  return lines.join('\n').trimEnd();
}

function buildPackingManifestJson(
  packResult: MegaromDataPackResult,
  mapperWindow: MapperWindowConfig,
  resources: MegaromResourceDescriptor[]
): string {
  const resourceByLabel = new Map(resources.map((resource) => [resource.label, resource]));
  const buildPlacementReason = (zone: MegaromDataPackResult['zones'][number], block: MegaromPackedDataBlock): string => {
    const endOffset = Math.max(block.zoneOffset, block.zoneOffset + block.byteSize - 1);
    return [
      `${mapperWindow.targetFormat} first-fit data-zone placement`,
      `group=${block.groupName}`,
      `stored=${block.byteSize}`,
      `zoneSize=${mapperWindow.dataZoneSize}`,
      `bank=${zone.physicalBank}`,
      `offset=${formatHex(block.zoneOffset)}-${formatHex(endOffset)}`,
      `window=${mapperWindow.dataWindowPage}/${mapperWindow.windowBaseExpr}`,
      `slackAfter=${zone.remainingBytes}`,
    ].join('; ');
  };
  const manifest = {
    version: 1,
    mapper: {
      format: mapperWindow.targetFormat,
      dataWindowPage: mapperWindow.dataWindowPage,
      windowBase: mapperWindow.windowBaseExpr,
      windowMask: mapperWindow.windowMaskExpr,
      bankDivisor: mapperWindow.bankDivisorExpr,
      zoneSize: mapperWindow.dataZoneSize,
    },
    summary: {
      dataStartAddress: packResult.dataStartAddress,
      totalSourceBytes: packResult.totalBlockBytes,
      resourceCount: resources.length,
      zoneCount: packResult.zones.length,
      overflowCount: packResult.overflowBlocks.length,
    },
    banks: packResult.zones.map((zone) => {
      const resourceSummaries = zone.blocks.map((block) => {
        const resource = resourceByLabel.get(block.label);
        return {
          id: resource?.id ?? null,
          label: block.label,
          resourceIdLabel: resource?.resourceIdLabel ?? null,
          group: resource?.resourceGroupKey ?? block.groupName,
          type: resource?.resourceTypeKey ?? 'GENERIC_DATA',
          bank: zone.physicalBank,
          zoneOffset: block.zoneOffset,
          physicalAddress: block.physicalAddress,
          windowAddress: resource?.windowAddress ?? null,
          size: block.byteSize,
          storedSize: resource?.size ?? block.byteSize,
          uncompressedSize: resource?.uncompressedSize ?? block.byteSize,
          flags: resource?.flags ?? 0,
          sourceIndex: block.sourceIndex,
          placementReason: buildPlacementReason(zone, block),
        };
      });
      return {
        bank: zone.physicalBank,
        zoneIndex: zone.zoneIndex,
        orgAddress: zone.orgAddress,
        endAddress: zone.endAddress,
        usedBytes: zone.usedBytes,
        freeBytes: zone.remainingBytes,
        verification: buildBankVerification(zone.physicalBank, zone.usedBytes, resourceSummaries),
        resources: resourceSummaries,
      };
    }),
    overflow: packResult.overflowBlocks.map((block) => ({
      label: block.label,
      group: block.groupName,
      size: block.byteSize,
    })),
  };

  return JSON.stringify(manifest, null, 2) + '\n';
}

function formatManifestMapperName(targetFormat: MapperWindowConfig['targetFormat']): string {
  switch (targetFormat) {
    case 'konami':
      return 'KONAMI8K';
    case 'ascii8':
      return 'ASCII8';
    case 'ascii16':
      return 'ASCII16';
    default:
      return sanitizeAsmKey(targetFormat);
  }
}

function formatManifestGroupName(groupKey: string): string {
  return groupKey.trim().toLowerCase();
}

function inferManifestLifetime(resource: MegaromResourceDescriptor): 'persistent' | 'stream' {
  switch (resource.resourceGroupKey) {
    case 'FONT':
    case 'SPRITES':
      return 'persistent';
    case 'SOUND':
    case 'SCREENS':
    case 'PATTERNS':
    case 'COLORS':
    case 'PRESENTATION':
    default:
      return 'stream';
  }
}

function inferManifestRuntimeTarget(resource: MegaromResourceDescriptor): 'RAM' | 'VRAM' {
  switch (resource.resourceTypeKey) {
    case 'MUSIC_TRACK':
    case 'SOUND_DATA':
    case 'SCREEN_EFFECT_ZONE_TABLE':
      return 'RAM';
    default:
      return 'VRAM';
  }
}

function buildManifestV2Id(
  packResult: MegaromDataPackResult,
  mapperWindow: MapperWindowConfig,
  resources: MegaromResourceDescriptor[]
): string {
  const checksum = buildBankMetadataChecksum([
    'mideas.manifest/2',
    mapperWindow.targetFormat,
    mapperWindow.dataZoneSize,
    packResult.dataStartAddress,
    packResult.totalBlockBytes,
    ...resources.flatMap((resource) => [
      resource.id,
      resource.label,
      resource.resourceGroupKey,
      resource.resourceTypeKey,
      resource.physicalBank,
      resource.physicalAddress,
      resource.windowAddress,
      resource.zoneOffset,
      resource.size,
      resource.uncompressedSize,
      resource.flags,
    ]),
  ]);
  return `mideas-v2:${checksum.replace(/^fnv1a32:/, '').toLowerCase()}`;
}

function buildManifestV2Json(
  packResult: MegaromDataPackResult,
  mapperWindow: MapperWindowConfig,
  resources: MegaromResourceDescriptor[]
): string {
  const resourceGroups = uniqueSorted(resources.map((resource) => resource.resourceGroupKey));
  const groups = [
    {
      name: 'boot',
      fixed_bank: 0,
      lifetime: 'persistent',
    },
    ...resourceGroups.map((groupKey) => ({
      name: formatManifestGroupName(groupKey),
      lifetime: groupKey === 'FONT' || groupKey === 'SPRITES' ? 'persistent' : 'stream',
    })),
  ];
  const maxRomBank = resources.reduce((maxBank, resource) => {
    const romBank = Math.trunc((resource.physicalAddress - 0x4000) / mapperWindow.dataZoneSize);
    return Math.max(maxBank, romBank);
  }, 0);
  const resourceByLabel = new Map(resources.map((resource) => [resource.label, resource]));
  const bankVerification = packResult.zones.map((zone) => {
    const zoneResources = zone.blocks
      .map((block) => resourceByLabel.get(block.label))
      .filter((resource): resource is MegaromResourceDescriptor => Boolean(resource));
    return {
      bank: zone.physicalBank,
      verification: buildBankVerification(zone.physicalBank, zone.usedBytes, zoneResources.map((resource) => ({
        id: resource.id,
        label: resource.label,
        zoneOffset: resource.zoneOffset,
        size: resource.size,
        uncompressedSize: resource.uncompressedSize,
        flags: resource.flags,
      }))),
    };
  });

  const manifest = {
    schema: 'mideas.manifest/2',
    build_id: buildManifestV2Id(packResult, mapperWindow, resources),
    entry_point: '0x4000',
    boot_reserved_size: 0,
    cartridge: {
      mapper: formatManifestMapperName(mapperWindow.targetFormat),
      bank_size: mapperWindow.dataZoneSize,
      banks: maxRomBank + 1,
      data_window: {
        page: mapperWindow.dataWindowPage,
        base: mapperWindow.windowBaseExpr,
        mask: mapperWindow.windowMaskExpr,
        bank_divisor: mapperWindow.bankDivisorExpr,
      },
    },
    layout: {
      policy: 'deterministic_first_fit_decreasing',
      file_offset_rule: 'file_offset = rom_bank_index * bank_size + bank_offset',
      data_start_address: packResult.dataStartAddress,
      total_source_bytes: packResult.totalBlockBytes,
    },
    groups,
    resources: resources.map((resource) => {
      const romBankIndex = Math.trunc((resource.physicalAddress - 0x4000) / mapperWindow.dataZoneSize);
      const fileOffset = romBankIndex * mapperWindow.dataZoneSize + resource.zoneOffset;
      const compressed = (resource.flags & 0x01) !== 0;
      const runtimeTarget = inferManifestRuntimeTarget(resource);
      return {
        id: resource.id,
        type: resource.resourceTypeKey.toLowerCase(),
        group: formatManifestGroupName(resource.resourceGroupKey),
        file: `generated/${formatManifestGroupName(resource.resourceGroupKey)}/${resource.label}.asm`,
        symbol: resource.label,
        resource_id_symbol: resource.resourceIdLabel,
        lifetime: inferManifestLifetime(resource),
        compress: compressed ? 'zx0' : 'none',
        ...(compressed ? {
          decompressor: 'zx0',
          decompress_target: runtimeTarget,
        } : {}),
        runtime_target: runtimeTarget,
        placement: {
          bank_index: resource.physicalBank,
          rom_bank_index: romBankIndex,
          window: mapperWindow.windowBaseExpr,
          window_address: resource.windowAddress,
          bank_offset: resource.zoneOffset,
          file_offset: fileOffset,
          physical_address: resource.physicalAddress,
          align: 1,
        },
        size: {
          stored: resource.size,
          uncompressed: resource.uncompressedSize,
        },
        flags: resource.flags,
      };
    }),
    verification: {
      algorithm: 'fnv1a32-resource-metadata',
      banks: bankVerification,
      expected_ram_dumps: [],
    },
  };

  return JSON.stringify(manifest, null, 2) + '\n';
}

function buildBanksJson(
  packResult: MegaromDataPackResult,
  mapperWindow: MapperWindowConfig,
  resources: MegaromResourceDescriptor[]
): string {
  const resourceByLabel = new Map(resources.map((resource) => [resource.label, resource]));
  const buildPlacementReason = (zone: MegaromDataPackResult['zones'][number], block: MegaromPackedDataBlock): string => {
    const endOffset = Math.max(block.zoneOffset, block.zoneOffset + block.byteSize - 1);
    return [
      `${mapperWindow.targetFormat} first-fit data-zone placement`,
      `group=${block.groupName}`,
      `stored=${block.byteSize}`,
      `zoneSize=${mapperWindow.dataZoneSize}`,
      `bank=${zone.physicalBank}`,
      `offset=${formatHex(block.zoneOffset)}-${formatHex(endOffset)}`,
      `window=${mapperWindow.dataWindowPage}/${mapperWindow.windowBaseExpr}`,
      `slackAfter=${zone.remainingBytes}`,
    ].join('; ');
  };
  const banks = {
    version: 1,
    mapperFormat: mapperWindow.targetFormat,
    segmentSize: mapperWindow.dataZoneSize,
    dataWindow: {
      page: mapperWindow.dataWindowPage,
      base: mapperWindow.windowBaseExpr,
      mask: mapperWindow.windowMaskExpr,
      bankDivisor: mapperWindow.bankDivisorExpr,
    },
    banks: packResult.zones.map((zone) => {
      const resourceSummaries = zone.blocks.map((block) => {
        const resource = resourceByLabel.get(block.label);
        return {
          id: resource?.id ?? null,
          label: block.label,
          bank: zone.physicalBank,
          offset: block.zoneOffset,
          address: resource?.windowAddress ?? null,
          size: block.byteSize,
          storedSize: resource?.size ?? block.byteSize,
          uncompressedSize: resource?.uncompressedSize ?? block.byteSize,
          flags: resource?.flags ?? 0,
          group: resource?.resourceGroupKey ?? block.groupName,
          type: resource?.resourceTypeKey ?? 'GENERIC_DATA',
          placementReason: buildPlacementReason(zone, block),
        };
      });
      return {
        bank: zone.physicalBank,
        origin: zone.orgAddress,
        end: zone.endAddress,
        usedBytes: zone.usedBytes,
        freeBytes: zone.remainingBytes,
        verification: buildBankVerification(zone.physicalBank, zone.usedBytes, resourceSummaries.map((resource) => ({
          id: resource.id,
          label: resource.label,
          zoneOffset: resource.offset,
          size: resource.size,
          uncompressedSize: resource.uncompressedSize,
          flags: resource.flags,
        }))),
        resources: resourceSummaries,
      };
    }),
    overflow: packResult.overflowBlocks.map((block) => ({
      label: block.label,
      group: block.groupName,
      size: block.byteSize,
    })),
  };

  return JSON.stringify(banks, null, 2) + '\n';
}

function countBy<T>(items: T[], keySelector: (item: T) => string): Array<{ key: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keySelector(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, count]) => ({ key, count }));
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((left, right) => left.localeCompare(right));
}

function findScreenTileBank(analysis: ProjectAnalysis | undefined, screen: any) {
  const tileBankId = screen?.tileBankAssetId;
  if (typeof tileBankId !== 'string' || tileBankId.length === 0) return null;
  return (analysis?.tileBanks || []).find((tileBank: any) => tileBank?.id === tileBankId) || null;
}

function resolveScreen2TileAssignment(
  tileId: string,
  subTileX: number,
  subTileY: number,
  tileAsset: any,
  tileBank: any
) {
  const attempts: Array<{
    bankId: string | null;
    bankName: string | null;
    charCode?: number;
    range?: { start: number; end: number };
    inRange?: boolean;
    reason?: string;
  }> = [];
  for (const bank of tileBank?.banks || []) {
    const bankId = bank?.id || null;
    const bankName = bank?.name || null;
    const assignment = bank?.assignedTiles?.[tileId];
    if ((bank?.enabled ?? true) && assignment) {
      let charCode = 0;
      if (tileAsset) {
        charCode = resolveTileAssignmentCharCode(assignment, tileAsset, subTileX, subTileY) ?? 0;
      } else if (Array.isArray(assignment.fontCharacters)) {
        charCode = Number(assignment.fontCharacters[subTileX]?.bankCharCode ?? 0);
      }
      const range = {
        start: Number(bank.charsetRangeStart ?? 0),
        end: Math.min(SCREEN2_DYNAMIC_TILE_CHAR_MAX, Number(bank.charsetRangeEnd ?? SCREEN2_DYNAMIC_TILE_CHAR_MAX)),
      };
      const inRange = charCode >= range.start && charCode <= range.end;
      attempts.push({ bankId, bankName, charCode, range, inRange });
      if (inRange) {
        return { ok: true, attempts };
      }
    } else {
      attempts.push({ bankId, bankName, reason: 'tile not assigned to this bank' });
    }
  }
  return { ok: false, attempts };
}

function collectScreen2TileBankIssues(analysis: ProjectAnalysis | undefined, screen: any, index: number) {
  const tileBank = findScreenTileBank(analysis, screen);
  const tilesById = new Map((analysis?.tiles || []).map((tile: any) => [tile.id, tile]));
  const activeArea = {
    x: screen?.activeAreaX ?? 0,
    y: screen?.activeAreaY ?? 0,
    width: screen?.activeAreaWidth ?? screen?.width ?? 0,
    height: screen?.activeAreaHeight ?? screen?.height ?? 0,
  };
  const issuesByTile = new Map<string, {
    tileId: string;
    tileName: string | null;
    reason: string;
    cells: Array<{ x: number; y: number; subTileX: number; subTileY: number }>;
    attempts: ReturnType<typeof resolveScreen2TileAssignment>['attempts'];
  }>();
  let checkedCells = 0;
  const uniqueTileIds = new Set<string>();

  if (!tileBank) {
    return {
      index,
      id: screen?.id || screen?.assetId || `screen_${index}`,
      name: screen?.name || screen?.label || screen?.id || `screen_${index}`,
      tileBankAssetId: screen?.tileBankAssetId || null,
      tileBankName: null,
      activeArea,
      status: screen?.tileBankAssetId ? 'missing_tilebank_asset' : 'no_tilebank_selected',
      totals: {
        checkedCells: 0,
        uniqueTiles: 0,
        issueCells: 0,
        issueTiles: 0,
        missingAssetCells: 0,
        missingAssetTiles: 0,
        unassignedCells: 0,
        unassignedTiles: 0,
      },
      issues: [],
    };
  }

  const backgroundLayer = screen?.layers?.background;
  for (let row = 0; row < activeArea.height; row++) {
    const y = activeArea.y + row;
    for (let column = 0; column < activeArea.width; column++) {
      const x = activeArea.x + column;
      const cell = Array.isArray(backgroundLayer?.[y]) ? backgroundLayer[y][x] : null;
      const tileId = cell?.tileId;
      if (typeof tileId !== 'string' || tileId.length === 0) continue;
      checkedCells += 1;
      uniqueTileIds.add(tileId);
      const tileAsset = tilesById.get(tileId);
      const resolved = resolveScreen2TileAssignment(
        tileId,
        Number(cell?.subTileX ?? 0),
        Number(cell?.subTileY ?? 0),
        tileAsset,
        tileBank
      );
      if (resolved.ok) continue;
      if (!issuesByTile.has(tileId)) {
        issuesByTile.set(tileId, {
          tileId,
          tileName: tileAsset?.name || null,
          reason: tileAsset ? 'tile is not assigned to any enabled bank/range' : 'tile asset not found',
          cells: [],
          attempts: resolved.attempts,
        });
      }
      issuesByTile.get(tileId)?.cells.push({
        x,
        y,
        subTileX: Number(cell?.subTileX ?? 0),
        subTileY: Number(cell?.subTileY ?? 0),
      });
    }
  }

  const issues = [...issuesByTile.values()]
    .sort((left, right) => left.tileId.localeCompare(right.tileId));
  const issueCells = issues.reduce((sum, issue) => sum + issue.cells.length, 0);
  const missingAssetIssues = issues.filter((issue) => issue.reason === 'tile asset not found');
  const unassignedIssues = issues.filter((issue) => issue.reason !== 'tile asset not found');
  const missingAssetCells = missingAssetIssues.reduce((sum, issue) => sum + issue.cells.length, 0);
  const unassignedCells = unassignedIssues.reduce((sum, issue) => sum + issue.cells.length, 0);
  return {
    index,
    id: screen?.id || screen?.assetId || `screen_${index}`,
    name: screen?.name || screen?.label || screen?.id || `screen_${index}`,
    tileBankAssetId: screen?.tileBankAssetId || null,
    tileBankName: tileBank?.name || null,
    activeArea,
    status: issues.length > 0 ? 'issues' : 'ok',
    totals: {
      checkedCells,
      uniqueTiles: uniqueTileIds.size,
      issueCells,
      issueTiles: issues.length,
      missingAssetCells,
      missingAssetTiles: missingAssetIssues.length,
      unassignedCells,
      unassignedTiles: unassignedIssues.length,
    },
    issues,
  };
}

function buildTileBankIntegrityJson(analysis: ProjectAnalysis | undefined): string {
  const screens = (analysis?.screenMaps || [])
    .map((screen: any, index: number) => collectScreen2TileBankIssues(analysis, screen, index));
  const checkedScreens = screens.filter((screen) => screen.status !== 'no_tilebank_selected').length;
  const issueScreens = screens.filter((screen) => screen.status === 'issues' || screen.status === 'missing_tilebank_asset').length;
  const summary = {
    screens: analysis?.screenMaps?.length || 0,
    tileBanks: analysis?.tileBanks?.length || 0,
    checkedScreens,
    issueScreens,
    issueCells: screens.reduce((sum, screen) => sum + screen.totals.issueCells, 0),
    issueTiles: screens.reduce((sum, screen) => sum + screen.totals.issueTiles, 0),
    missingAssetCells: screens.reduce((sum, screen) => sum + screen.totals.missingAssetCells, 0),
    missingAssetTiles: screens.reduce((sum, screen) => sum + screen.totals.missingAssetTiles, 0),
    unassignedCells: screens.reduce((sum, screen) => sum + screen.totals.unassignedCells, 0),
    unassignedTiles: screens.reduce((sum, screen) => sum + screen.totals.unassignedTiles, 0),
  };
  return JSON.stringify({
    version: 1,
    scope: 'konami8k_tilebank_integrity',
    summary,
    screens,
  }, null, 2) + '\n';
}

/**
 * Returns the compact resource shape shared by project_usage/load_plan artifacts.
 */
function toResourceUsageSummary(resource: MegaromResourceDescriptor) {
  return {
    id: resource.id,
    label: resource.label,
    group: resource.resourceGroupKey,
    type: resource.resourceTypeKey,
    bank: resource.physicalBank,
    windowAddress: resource.windowAddress,
    zoneOffset: resource.zoneOffset,
    size: resource.size,
    storedSize: resource.size,
    uncompressedSize: resource.uncompressedSize,
    flags: resource.flags,
  };
}

/**
 * Groups resources by physical 8KB bank while preserving in-bank load order.
 */
function summarizeResourcesByBank(resources: MegaromResourceDescriptor[]) {
  const bankMap = new Map<number, MegaromResourceDescriptor[]>();
  for (const resource of resources) {
    if (!bankMap.has(resource.physicalBank)) {
      bankMap.set(resource.physicalBank, []);
    }
    bankMap.get(resource.physicalBank)?.push(resource);
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
 * Converts grouped bank summaries into the scene load order consumed by tooling.
 */
function buildSceneLoadOrder(resources: MegaromResourceDescriptor[]) {
  return summarizeResourcesByBank(resources).map((bank) => ({
    bank: bank.bank,
    resourceIds: bank.resourceIds,
    resourceLabels: bank.resourceLabels,
  }));
}

/**
 * Extracts tile asset ids from one screen layer without assuming a fixed cell shape.
 */
function collectTileIdsFromLayer(layer: any): string[] {
  if (!Array.isArray(layer)) return [];
  const ids: string[] = [];
  for (const row of layer) {
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      const tileId = cell?.tileId;
      if (typeof tileId === 'string' && tileId.length > 0) {
        ids.push(tileId);
      }
    }
  }
  return uniqueSorted(ids);
}

/**
 * Builds the generated ASM label prefixes that identify resources owned by a screen.
 */
function buildSceneResourceMatchers(screen: any, index: number): string[] {
  const screenName = String(screen?.name || screen?.label || screen?.id || `screen_${index}`);
  const screenKey = sanitizeAsmKey(screenName);
  return [
    `SCREEN_${screenKey}_${index}_`,
    `BEHAVIOR_${screenKey}_${index}_`,
  ];
}

/**
 * Builds the per-screen resource graph used by the load plan and bank optimizer.
 */
function buildSceneUsageGraph(
  analysis: ProjectAnalysis | undefined,
  resources: MegaromResourceDescriptor[]
) {
  const screens = analysis?.screenMaps || [];
  return screens.map((screen: any, index: number) => {
    const matchers = buildSceneResourceMatchers(screen, index);
    const sceneResources = resources
      .filter((resource) => matchers.some((prefix) => resource.label.startsWith(prefix)))
      .sort((left, right) => {
        if (left.physicalBank !== right.physicalBank) return left.physicalBank - right.physicalBank;
        if (left.zoneOffset !== right.zoneOffset) return left.zoneOffset - right.zoneOffset;
        return left.id - right.id;
      });
    const entityInstances = Array.isArray(screen?.layers?.entities) ? screen.layers.entities : [];
    const effectZones = Array.isArray(screen?.effectZones) ? screen.effectZones : [];
    const bossInstances = Array.isArray(screen?.bossInstances) ? screen.bossInstances : [];
    const backgroundTileIds = collectTileIdsFromLayer(screen?.layers?.background);
    const collisionTileIds = collectTileIdsFromLayer(screen?.layers?.collision);
    const effectsTileIds = collectTileIdsFromLayer(screen?.layers?.effects);

    return {
      index,
      id: screen?.id || screen?.assetId || `screen_${index}`,
      name: screen?.name || screen?.label || screen?.id || `screen_${index}`,
      size: {
        width: screen?.width || 0,
        height: screen?.height || 0,
      },
      screenKind: screen?.screenKind || null,
      screenEngine: screen?.screenEngine || null,
      tileBankAssetId: screen?.tileBankAssetId || null,
      tileUsage: {
        backgroundTileIds,
        collisionTileIds,
        effectsTileIds,
        uniqueTileIds: uniqueSorted([...backgroundTileIds, ...collisionTileIds, ...effectsTileIds]),
      },
      entities: {
        count: entityInstances.length,
        templateIds: uniqueSorted(entityInstances.map((entity: any) => entity?.entityTemplateId)),
        names: uniqueSorted(entityInstances.map((entity: any) => entity?.name)),
      },
      effectZones: {
        count: effectZones.length,
      },
      bosses: {
        count: bossInstances.length,
        bossIds: uniqueSorted(bossInstances.map((boss: any) => boss?.bossAssetId || boss?.bossId || boss?.id)),
      },
      resourceIds: sceneResources.map((resource) => resource.id),
      resources: sceneResources.map(toResourceUsageSummary),
      banks: summarizeResourcesByBank(sceneResources),
      loadOrder: buildSceneLoadOrder(sceneResources),
      totals: {
        resourceCount: sceneResources.length,
        storedBytes: sceneResources.reduce((sum, resource) => sum + resource.size, 0),
        rawBytes: sceneResources.reduce((sum, resource) => sum + resource.uncompressedSize, 0),
        compressedResources: sceneResources.filter((resource) => (resource.flags & 0x01) !== 0).length,
      },
    };
  });
}

function asStringId(value: any): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function unwrapAssetData(asset: any): any {
  return asset?.data && typeof asset.data === 'object' ? asset.data : asset;
}

function collectPlacedBossAssetIdsForUsage(analysis: ProjectAnalysis | undefined): Set<string> {
  const bossIds = new Set<string>();
  (analysis?.screenMaps || []).forEach((screen: any) => {
    const bossInstances = Array.isArray(screen?.bossInstances) ? screen.bossInstances : [];
    bossInstances.forEach((instance: any) => {
      const bossId = asStringId(instance?.bossAssetId ?? instance?.bossId ?? instance?.id);
      if (bossId) {
        bossIds.add(bossId);
      }
    });
  });
  return bossIds;
}

function collectUsedBossAttackRuntimeTypes(analysis: ProjectAnalysis | undefined) {
  const bosses = Array.isArray(analysis?.bosses) ? (analysis?.bosses as any[]) : [];
  const placedBossIds = collectPlacedBossAssetIdsForUsage(analysis);
  const usedTypes = new Set<string>();
  const typeCounts: Record<string, number> = {};
  let referencedAttacks = 0;

  bosses
    .filter((boss: any) => placedBossIds.size === 0 || !boss?.id || placedBossIds.has(String(boss.id)))
    .forEach((boss: any) => {
      const attackById = new Map<string, any>(
        (Array.isArray(boss?.attacks) ? boss.attacks : [])
          .filter((attack: any) => attack?.id !== undefined && attack?.id !== null)
          .map((attack: any) => [String(attack.id), attack])
      );
      const usedAttackIds = new Set<string>();
      (Array.isArray(boss?.phases) ? boss.phases : []).forEach((phase: any) => {
        (Array.isArray(phase?.attackSequence) ? phase.attackSequence : []).forEach((attackId: any) => {
          const normalized = asStringId(attackId);
          if (normalized) {
            usedAttackIds.add(normalized);
          }
        });
        (Array.isArray(phase?.behaviorLoop) ? phase.behaviorLoop : []).forEach((action: any) => {
          if (action?.type === 'attack') {
            const normalized = asStringId(action?.attackId);
            if (normalized) {
              usedAttackIds.add(normalized);
            }
          }
        });
      });

      usedAttackIds.forEach((attackId) => {
        const attack = attackById.get(attackId);
        if (!attack) {
          return;
        }
        const type = String(attack.type || 'Projectile');
        usedTypes.add(type);
        typeCounts[type] = (typeCounts[type] || 0) + 1;
        referencedAttacks += 1;
      });
    });

  const sortedUsedTypes = Array.from(usedTypes).sort();
  return {
    usedTypes: sortedUsedTypes,
    unusedTypes: BOSS_ATTACK_RUNTIME_TYPES.filter((type) => !usedTypes.has(type)),
    typeCounts,
    referencedAttacks,
  };
}

function collectUsedComponentRuntimeTypes(analysis: ProjectAnalysis | undefined) {
  if (!analysis) {
    return {
      usedComponents: [],
      unusedComponents: COMPONENT_RUNTIME_TYPES,
      componentCounts: {},
      activeEntities: 0,
    };
  }

  const usage = analyzeComponentUsage(analysis);
  const usedComponents = Array.from(usage.usedComponents).sort();
  const usedSet = new Set(usedComponents);
  const componentCounts: Record<string, number> = {};
  usage.componentToEntitiesMap.forEach((entities, component) => {
    componentCounts[component] = entities.size;
  });

  return {
    usedComponents,
    unusedComponents: COMPONENT_RUNTIME_TYPES.filter((component) => !usedSet.has(component)),
    componentCounts,
    activeEntities: usage.activeEntities.length,
  };
}

function sortedNumbers(values: Set<number>): number[] {
  return Array.from(values).sort((a, b) => a - b);
}

function addRuntimeType(
  type: string,
  ids: Record<string, number>,
  usedTypes: Set<string>,
  usedIds: Set<number>,
  counts: Record<string, number>,
  unknownTypes: Set<string>
): void {
  if (!type) {
    return;
  }
  const id = ids[type];
  if (id === undefined) {
    unknownTypes.add(type);
    return;
  }
  usedTypes.add(type);
  usedIds.add(id);
  counts[type] = (counts[type] || 0) + 1;
}

function collectUsedStateMachineRuntimeIds(analysis: ProjectAnalysis | undefined) {
  const stateMachines = Array.isArray(analysis?.stateMachines)
    ? (analysis?.stateMachines as any[]).map(unwrapAssetData)
    : [];
  const usedActionTypes = new Set<string>();
  const usedActionIds = new Set<number>();
  const actionTypeCounts: Record<string, number> = {};
  const unknownActionTypes = new Set<string>();
  const usedConditionTypes = new Set<string>();
  const usedConditionIds = new Set<number>();
  const conditionTypeCounts: Record<string, number> = {};
  const unknownConditionTypes = new Set<string>();
  let transitionCount = 0;
  let implicitAlwaysTrueConditions = 0;

  const addAction = (action: any): void => {
    addRuntimeType(
      String(action?.type || ''),
      ACTION_IDS,
      usedActionTypes,
      usedActionIds,
      actionTypeCounts,
      unknownActionTypes
    );
  };

  const addImplicitAlwaysTrueCondition = (): void => {
    implicitAlwaysTrueConditions += 1;
    usedConditionTypes.add('None');
    usedConditionIds.add(0);
    conditionTypeCounts.None = (conditionTypeCounts.None || 0) + 1;
  };

  const addCondition = (condition: any): void => {
    if (!condition || typeof condition !== 'object') {
      addImplicitAlwaysTrueCondition();
      return;
    }
    const type = String(condition.type || '');
    if (!type) {
      addImplicitAlwaysTrueCondition();
      return;
    }
    addRuntimeType(
      type,
      CONDITION_IDS,
      usedConditionTypes,
      usedConditionIds,
      conditionTypeCounts,
      unknownConditionTypes
    );
    const nestedConditions = Array.isArray(condition.conditions) ? condition.conditions : [];
    nestedConditions.forEach(addCondition);
  };

  stateMachines.forEach((stateMachine: any) => {
    (Array.isArray(stateMachine?.states) ? stateMachine.states : []).forEach((state: any) => {
      (Array.isArray(state?.onEnter) ? state.onEnter : []).forEach(addAction);
      (Array.isArray(state?.onExit) ? state.onExit : []).forEach(addAction);
      (Array.isArray(state?.transitions) ? state.transitions : []).forEach((transition: any) => {
        transitionCount += 1;
        addCondition(transition?.conditions);
        (Array.isArray(transition?.actions) ? transition.actions : []).forEach(addAction);
      });
    });
    (Array.isArray(stateMachine?.transitions) ? stateMachine.transitions : []).forEach((transition: any) => {
      transitionCount += 1;
      addCondition(transition?.conditions);
      (Array.isArray(transition?.actions) ? transition.actions : []).forEach(addAction);
    });
  });

  return {
    stateMachines: stateMachines.length,
    transitions: transitionCount,
    usedActionIds: sortedNumbers(usedActionIds),
    usedActionTypes: Array.from(usedActionTypes).sort(),
    actionTypeCounts,
    unknownActionTypes: Array.from(unknownActionTypes).sort(),
    usedConditionIds: sortedNumbers(usedConditionIds),
    usedConditionTypes: Array.from(usedConditionTypes).sort(),
    conditionTypeCounts,
    unknownConditionTypes: Array.from(unknownConditionTypes).sort(),
    implicitAlwaysTrueConditions,
  };
}

function connectionEndpointNodeId(endpoint: any): string | null {
  if (typeof endpoint === 'string') return endpoint;
  return asStringId(endpoint?.nodeId) || asStringId(endpoint?.id);
}

function buildReachableNodeIds(nodes: any[], connections: any[], startIds: string[], bidirectional = false): Set<string> {
  const nodeIds = new Set(nodes.map((node) => asStringId(node?.id)).filter((id): id is string => Boolean(id)));
  const starts = startIds.filter((id) => nodeIds.has(id));
  if (nodeIds.size === 0) return new Set<string>();
  if (starts.length === 0) {
    return new Set(nodeIds);
  }

  const edges = new Map<string, Set<string>>();
  const addEdge = (from: string | null, to: string | null) => {
    if (!from || !to || !nodeIds.has(from) || !nodeIds.has(to)) return;
    if (!edges.has(from)) edges.set(from, new Set<string>());
    edges.get(from)?.add(to);
  };
  for (const connection of connections) {
    const from = connectionEndpointNodeId(connection?.from ?? connection?.fromNodeId ?? connection?.source);
    const to = connectionEndpointNodeId(connection?.to ?? connection?.toNodeId ?? connection?.target);
    addEdge(from, to);
    if (bidirectional) addEdge(to, from);
  }

  const reachable = new Set<string>();
  const queue = [...starts];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || reachable.has(nodeId)) continue;
    reachable.add(nodeId);
    for (const next of edges.get(nodeId) || []) {
      if (!reachable.has(next)) queue.push(next);
    }
  }
  return reachable;
}

function collectScreenRefsFromNode(node: any): string[] {
  const candidates = [
    node?.screenAssetId,
    node?.screenId,
    node?.screenMapId,
    node?.targetScreenAssetId,
    node?.targetScreenId,
    node?.appearance?.backgroundScreenAssetId,
    node?.appearance?.screenAssetId,
    node?.data?.screenAssetId,
    node?.data?.screenId,
    node?.data?.screenMapId,
  ];
  return uniqueSorted(candidates.map(asStringId));
}

function buildGameFlowReachability(
  analysis: ProjectAnalysis | undefined,
  scenes: ReturnType<typeof buildSceneUsageGraph>
) {
  const gameFlow = unwrapAssetData(analysis?.gameFlow);
  const hasGameFlow = Boolean(gameFlow);
  const reachableScreenIds = new Set<string>();
  const reachableWorldIds = new Set<string>();
  const screenSources = new Map<string, Set<string>>();
  const addScreenSource = (screenId: string | null, source: string) => {
    if (!screenId) return;
    reachableScreenIds.add(screenId);
    if (!screenSources.has(screenId)) screenSources.set(screenId, new Set<string>());
    screenSources.get(screenId)?.add(source);
  };

  if (hasGameFlow) {
    const gameFlowNodes = Array.isArray(gameFlow?.nodes) ? gameFlow.nodes : [];
    const gameFlowConnections = Array.isArray(gameFlow?.connections) ? gameFlow.connections : [];
    const startIds = [
      asStringId(gameFlow?.startNodeId),
      ...gameFlowNodes
        .filter((node: any) => String(node?.type || '').toLowerCase() === 'start')
        .map((node: any) => asStringId(node?.id)),
    ].filter((id): id is string => Boolean(id));
    const reachableGameFlowNodeIds = buildReachableNodeIds(gameFlowNodes, gameFlowConnections, startIds);

    for (const node of gameFlowNodes) {
      const nodeId = asStringId(node?.id);
      if (!nodeId || !reachableGameFlowNodeIds.has(nodeId)) continue;
      const worldId = asStringId(node?.worldAssetId) || asStringId(node?.worldId) || asStringId(node?.data?.worldAssetId);
      if (worldId) reachableWorldIds.add(worldId);
      for (const screenId of collectScreenRefsFromNode(node)) {
        addScreenSource(screenId, `gameflow:${nodeId}`);
      }
    }

    const worlds = Array.isArray((analysis as any)?.worldmaps) ? (analysis as any).worldmaps : [];
    for (const worldAsset of worlds) {
      const world = unwrapAssetData(worldAsset);
      const worldId = asStringId(world?.id) || asStringId(worldAsset?.id);
      if (!worldId || !reachableWorldIds.has(worldId)) continue;
      const worldNodes = Array.isArray(world?.nodes) ? world.nodes : [];
      const worldConnections = Array.isArray(world?.connections) ? world.connections : [];
      const worldStartIds = [asStringId(world?.startScreenNodeId)].filter((id): id is string => Boolean(id));
      const reachableWorldNodeIds = buildReachableNodeIds(worldNodes, worldConnections, worldStartIds, true);
      for (const node of worldNodes) {
        const nodeId = asStringId(node?.id);
        if (!nodeId || !reachableWorldNodeIds.has(nodeId)) continue;
        addScreenSource(asStringId(node?.screenAssetId), `worldmap:${worldId}:node:${nodeId}`);
      }
    }
  }

  const annotatedScenes = scenes.map((scene) => {
    const sources = uniqueSorted([...(screenSources.get(scene.id) || new Set<string>())]);
    const reachable = hasGameFlow ? reachableScreenIds.has(scene.id) : null;
    return {
      index: scene.index,
      id: scene.id,
      name: scene.name,
      reachable,
      sources,
      reason: hasGameFlow
        ? (reachable ? 'reachable from GameFlow start graph' : 'not reached from GameFlow start graph')
        : 'no GameFlow graph available; reachability unknown',
    };
  });

  return {
    hasGameFlow,
    reachableScreenIds: uniqueSorted([...reachableScreenIds]),
    reachableWorldIds: uniqueSorted([...reachableWorldIds]),
    scenes: annotatedScenes,
    counts: {
      totalScreens: scenes.length,
      reachableScreens: annotatedScenes.filter((scene) => scene.reachable === true).length,
      unreachableScreens: annotatedScenes.filter((scene) => scene.reachable === false).length,
      unknownScreens: annotatedScenes.filter((scene) => scene.reachable === null).length,
    },
  };
}

/**
 * Produces the current scene load plan without changing bank placement.
 */
function buildLoadPlanFromSceneGraph(
  scenes: ReturnType<typeof buildSceneUsageGraph>,
  resources: MegaromResourceDescriptor[],
  mapperWindow: MapperWindowConfig
) {
  const uniqueDataBanks = new Set(resources.map((resource) => resource.physicalBank));
  const sceneBankTouches = scenes.map((scene) => scene.banks.length);
  return {
    version: 1,
    scope: 'konami8k_scene_load_plan',
    strategy: 'group current banked resources by scene and physical bank; optimizer consumes this before repacking',
    mapper: {
      format: mapperWindow.targetFormat,
      segmentSize: mapperWindow.dataZoneSize,
      dataWindowPage: mapperWindow.dataWindowPage,
      windowBase: mapperWindow.windowBaseExpr,
      windowMask: mapperWindow.windowMaskExpr,
      bankDivisor: mapperWindow.bankDivisorExpr,
    },
    summary: {
      sceneCount: scenes.length,
      resourceCount: resources.length,
      uniqueDataBanks: uniqueDataBanks.size,
      totalSceneBankTouches: sceneBankTouches.reduce((sum, touches) => sum + touches, 0),
      maxSceneBankTouches: sceneBankTouches.reduce((max, touches) => Math.max(max, touches), 0),
      totalStoredBytes: resources.reduce((sum, resource) => sum + resource.size, 0),
      totalRawBytes: resources.reduce((sum, resource) => sum + resource.uncompressedSize, 0),
      compressedResources: resources.filter((resource) => (resource.flags & 0x01) !== 0).length,
    },
    scenes: scenes.map((scene) => {
      const warnings: string[] = [];
      if (scene.resourceIds.length === 0) {
        warnings.push('scene has no matched banked resources');
      }
      if (scene.banks.length > 3) {
        warnings.push('scene spans more than three data banks');
      }
      if (scene.resources.some((resource) => resource.storedSize > 8192)) {
        warnings.push('scene contains a resource larger than one 8KB bank');
      }

      return {
        index: scene.index,
        id: scene.id,
        name: scene.name,
        tileBankAssetId: scene.tileBankAssetId,
        resourceCount: scene.totals.resourceCount,
        totalStoredBytes: scene.totals.storedBytes,
        totalRawBytes: scene.totals.rawBytes,
        compressedResources: scene.totals.compressedResources,
        banks: scene.banks,
        loadOrder: scene.loadOrder,
        warnings,
      };
    }),
  };
}

/**
 * Simulates a scene-aware first-fit plan without changing current ROM placement.
 */
function buildProposedSceneAwarePlacement(
  scenes: ReturnType<typeof buildSceneUsageGraph>,
  resources: MegaromResourceDescriptor[],
  unassignedResources: MegaromResourceDescriptor[],
  mapperWindow: MapperWindowConfig
) {
  const zoneSize = mapperWindow.dataZoneSize;
  const capacity = Math.max(1, zoneSize | 0);
  const windowBase = parseInt(mapperWindow.windowBaseExpr.slice(1), 16);
  const firstBank = resources.reduce((minBank, resource) => Math.min(minBank, resource.physicalBank), Number.POSITIVE_INFINITY);
  const bankBase = Number.isFinite(firstBank) ? firstBank : 4;
  const makeUnit = (
    kind: 'scene' | 'shared',
    unitResources: MegaromResourceDescriptor[],
    scene?: { index: number; id: string; name: string }
  ) => {
    const storedBytes = unitResources.reduce((sum, resource) => sum + resource.size, 0);
    const sceneLabel = scene ? `scene=${scene.name}` : 'scene=none';
    return {
      kind,
      sceneIndex: scene?.index ?? null,
      sceneId: scene?.id ?? null,
      sceneName: scene?.name ?? null,
      resourceIds: unitResources.map((resource) => resource.id),
      resourceLabels: unitResources.map((resource) => resource.label),
      storedBytes,
      rawBytes: unitResources.reduce((sum, resource) => sum + resource.uncompressedSize, 0),
      placementReason: kind === 'scene'
        ? `scene-aware first-fit unit; ${sceneLabel}; resources=${unitResources.length}; stored=${storedBytes}; zoneSize=${capacity}`
        : `shared/global first-fit unit; resources=${unitResources.length}; stored=${storedBytes}; zoneSize=${capacity}`,
    };
  };

  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
  const sceneUnits = scenes.flatMap((scene) => {
    const sceneResources = scene.resourceIds
      .map((resourceId) => resourceById.get(resourceId))
      .filter((resource): resource is MegaromResourceDescriptor => Boolean(resource));
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

  const banks: Array<{
    bank: number;
    usedBytes: number;
    freeBytes: number;
    units: typeof units;
  }> = [];
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

  const sceneBankMap = new Map<number, Set<number>>();
  for (const bank of banks) {
    for (const unit of bank.units) {
      if (unit.kind !== 'scene' || unit.sceneIndex === null) continue;
      if (!sceneBankMap.has(unit.sceneIndex)) {
        sceneBankMap.set(unit.sceneIndex, new Set<number>());
      }
      sceneBankMap.get(unit.sceneIndex)?.add(bank.bank);
    }
  }
  const currentSceneBankTouches = scenes.reduce((sum, scene) => sum + scene.banks.length, 0);
  const proposedSceneBankTouches = scenes.reduce((sum, scene) => sum + (sceneBankMap.get(scene.index)?.size || 0), 0);
  const buildResourcePlacements = (bank: { bank: number; units: typeof units }) => {
    let zoneOffset = 0;
    return bank.units.flatMap((unit) => unit.resourceIds.map((resourceId) => {
      const resource = resourceById.get(resourceId);
      if (!resource) return null;
      const placement = {
        id: resource.id,
        label: resource.label,
        group: resource.resourceGroupKey,
        type: resource.resourceTypeKey,
        bank: bank.bank,
        zoneOffset,
        windowAddress: windowBase + zoneOffset,
        storedSize: resource.size,
        uncompressedSize: resource.uncompressedSize,
        flags: resource.flags,
        unitKind: unit.kind,
        sceneIndex: unit.sceneIndex,
        sceneId: unit.sceneId,
        sceneName: unit.sceneName,
        placementReason: [
          unit.placementReason,
          `proposedBank=${bank.bank}`,
          `offset=${formatHex(zoneOffset)}`,
          `window=${mapperWindow.dataWindowPage}/${mapperWindow.windowBaseExpr}`,
        ].join('; '),
      };
      zoneOffset += resource.size;
      return placement;
    })).filter((placement): placement is NonNullable<typeof placement> => Boolean(placement));
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
      index: scene.index,
      id: scene.id,
      name: scene.name,
      currentBanks: scene.banks.map((bank) => bank.bank),
      proposedBanks: [...(sceneBankMap.get(scene.index) || new Set<number>())].sort((left, right) => left - right),
    })),
    delta: {
      currentBankCount: summarizeResourcesByBank(resources).length,
      proposedBankCount: banks.length,
      currentSceneBankTouches,
      proposedSceneBankTouches,
    },
  };
}

/**
 * Emits analysis input for the next optimizer pass: scene clusters, shared resources,
 * pressure warnings, and small duplication candidates.
 */
function buildBankOptimizerFromSceneGraph(
  scenes: ReturnType<typeof buildSceneUsageGraph>,
  resources: MegaromResourceDescriptor[],
  mapperWindow: MapperWindowConfig
) {
  const assignedResourceIds = new Set<number>();
  for (const scene of scenes) {
    for (const resourceId of scene.resourceIds) {
      assignedResourceIds.add(resourceId);
    }
  }

  const unassignedResources = resources
    .filter((resource) => !assignedResourceIds.has(resource.id))
    .sort((left, right) => {
      if (left.physicalBank !== right.physicalBank) return left.physicalBank - right.physicalBank;
      if (left.zoneOffset !== right.zoneOffset) return left.zoneOffset - right.zoneOffset;
      return left.id - right.id;
    });
  const allBanks = summarizeResourcesByBank(resources);
  const sceneClusters = scenes.map((scene) => ({
    index: scene.index,
    id: scene.id,
    name: scene.name,
    resourceIds: scene.resourceIds,
    banks: scene.banks.map((bank) => bank.bank),
    bankCount: scene.banks.length,
    storedBytes: scene.totals.storedBytes,
    rawBytes: scene.totals.rawBytes,
    coLocated: scene.banks.length <= 1,
    preferredBank: scene.banks[0]?.bank ?? null,
  }));
  const pressureWarnings = sceneClusters
    .filter((scene) => scene.bankCount > 3)
    .map((scene) => ({
      sceneIndex: scene.index,
      sceneName: scene.name,
      bankCount: scene.bankCount,
      message: 'scene spans more than three data banks',
    }));

  return {
    version: 1,
    scope: 'konami8k_bank_optimizer',
    strategy: 'analysis-only scene-aware first-fit input; later pass may repack or duplicate resources',
    constraints: {
      mapperFormat: mapperWindow.targetFormat,
      segmentSize: mapperWindow.dataZoneSize,
      dynamicWindows: 1,
      dataWindow: {
        page: mapperWindow.dataWindowPage,
        base: mapperWindow.windowBaseExpr,
        mask: mapperWindow.windowMaskExpr,
        bankDivisor: mapperWindow.bankDivisorExpr,
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
    proposedPlacement: buildProposedSceneAwarePlacement(scenes, resources, unassignedResources, mapperWindow),
    sceneClusters,
    pressureWarnings,
    sharedOrGlobalResources: unassignedResources.map(toResourceUsageSummary),
    duplicationCandidates: unassignedResources
      .filter((resource) => resource.size > 0 && resource.size <= 128)
      .map((resource) => ({
        id: resource.id,
        label: resource.label,
        group: resource.resourceGroupKey,
        type: resource.resourceTypeKey,
        bank: resource.physicalBank,
        storedSize: resource.size,
        uncompressedSize: resource.uncompressedSize,
      })),
  };
}

function buildProjectUsageJson(
  analysis: ProjectAnalysis | undefined,
  resources: MegaromResourceDescriptor[],
  mapperWindow: MapperWindowConfig
): string {
  const scenes = buildSceneUsageGraph(analysis, resources);
  const gameFlowReachability = buildGameFlowReachability(analysis, scenes);
  const bossInstanceCount = scenes.reduce((sum, scene) => sum + (scene.bosses?.count || 0), 0);
  const hasBossRuntime = Boolean((analysis?.bosses?.length || 0) > 0 || bossInstanceCount > 0);
  const bossAttackRuntime = collectUsedBossAttackRuntimeTypes(analysis);
  const componentRuntime = collectUsedComponentRuntimeTypes(analysis);
  const stateMachineRuntime = collectUsedStateMachineRuntimeIds(analysis);
  const gameFlow = unwrapAssetData(analysis?.gameFlow);
  const gameFlowNodes = Array.isArray(gameFlow?.nodes) ? gameFlow.nodes : [];
  const gameFlowSubMenuCount = gameFlowNodes.filter((node: any) => String(node?.type || '').toLowerCase() === 'submenu').length;
  const explicitMenuCount = Array.isArray((analysis as any)?.menus)
    ? (analysis as any).menus.length
    : ((analysis?.hasMenus || analysis?.hasMenuSystem) ? 1 : 0);
  const menuRuntimeCount = explicitMenuCount + gameFlowSubMenuCount;
  const hasMenuRuntime = Boolean(menuRuntimeCount > 0 || analysis?.hasMenuSystem);
  const dialogueCount = analysis?.dialogues?.length || 0;
  const worldmapCount = analysis?.worldmaps?.length || 0;
  const projectUsage = {
    version: 1,
    scope: 'konami8k_megarom_data',
    mapper: {
      format: mapperWindow.targetFormat,
      segmentSize: mapperWindow.dataZoneSize,
      dataWindowPage: mapperWindow.dataWindowPage,
      windowBase: mapperWindow.windowBaseExpr,
      windowMask: mapperWindow.windowMaskExpr,
      bankDivisor: mapperWindow.bankDivisorExpr,
    },
    features: {
      sprites: Boolean(analysis?.hasSprites || resources.some((resource) => resource.resourceGroupKey === 'SPRITES')),
      tiles: Boolean(analysis?.hasTiles || resources.some((resource) => resource.resourceTypeKey.includes('TILE'))),
      screens: Boolean(analysis?.hasScreens || resources.some((resource) => resource.resourceGroupKey === 'SCREENS')),
      entities: Boolean(analysis?.hasEntities),
      components: Boolean(analysis?.hasComponents),
      gameFlow: Boolean(analysis?.hasGameFlow),
      menus: hasMenuRuntime,
      bosses: hasBossRuntime,
      dialogues: dialogueCount > 0,
      worldmaps: worldmapCount > 0,
      fonts: Boolean(analysis?.hasFonts || resources.some((resource) => resource.resourceGroupKey === 'FONT')),
      animations: Boolean(analysis?.hasAnimations),
      collisions: Boolean(analysis?.hasCollisions),
      sounds: Boolean((analysis?.sounds?.length || 0) > 0 || (analysis?.tracks?.length || 0) > 0),
      stateMachines: Boolean((analysis?.stateMachines?.length || 0) > 0),
    },
    counts: {
      components: analysis?.components?.length || 0,
      componentRuntimeTypes: componentRuntime.usedComponents.length,
      templates: analysis?.templates?.length || 0,
      sprites: analysis?.sprites?.length || 0,
      tiles: analysis?.tiles?.length || 0,
      tileBanks: analysis?.tileBanks?.length || 0,
      screens: analysis?.screenMaps?.length || 0,
      entities: analysis?.entities?.length || 0,
      menus: menuRuntimeCount,
      bosses: analysis?.bosses?.length || 0,
      bossInstances: bossInstanceCount,
      bossAttackTypes: bossAttackRuntime.usedTypes.length,
      bossAttacksReferenced: bossAttackRuntime.referencedAttacks,
      dialogues: dialogueCount,
      worldmaps: worldmapCount,
      presentationScreens: analysis?.presentationScreen ? 1 : 0,
      sounds: analysis?.sounds?.length || 0,
      tracks: analysis?.tracks?.length || 0,
      stateMachines: analysis?.stateMachines?.length || 0,
      stateMachineActionTypes: stateMachineRuntime.usedActionIds.length,
      stateMachineConditionTypes: stateMachineRuntime.usedConditionIds.length,
      bankedResources: resources.length,
    },
    resourceGroups: countBy(resources, (resource) => resource.resourceGroupKey),
    resourceTypes: countBy(resources, (resource) => resource.resourceTypeKey),
    bossAttackRuntime,
    componentRuntime,
    stateMachineRuntime,
    gameFlowReachability,
    scenes,
    bankedResources: resources.map((resource) => ({
      id: resource.id,
      label: resource.label,
      group: resource.resourceGroupKey,
      type: resource.resourceTypeKey,
      bank: resource.physicalBank,
      windowAddress: resource.windowAddress,
      size: resource.size,
      storedSize: resource.size,
      uncompressedSize: resource.uncompressedSize,
      flags: resource.flags,
    })),
  };

  return JSON.stringify(projectUsage, null, 2) + '\n';
}

function buildLoadPlanJson(
  analysis: ProjectAnalysis | undefined,
  resources: MegaromResourceDescriptor[],
  mapperWindow: MapperWindowConfig
): string {
  const scenes = buildSceneUsageGraph(analysis, resources);
  return JSON.stringify(buildLoadPlanFromSceneGraph(scenes, resources, mapperWindow), null, 2) + '\n';
}

/**
 * Serializes the analysis-only bank optimizer artifact beside the concrete load plan.
 */
function buildBankOptimizerJson(
  analysis: ProjectAnalysis | undefined,
  resources: MegaromResourceDescriptor[],
  mapperWindow: MapperWindowConfig
): string {
  const scenes = buildSceneUsageGraph(analysis, resources);
  return JSON.stringify(buildBankOptimizerFromSceneGraph(scenes, resources, mapperWindow), null, 2) + '\n';
}

export function renderNamedArtifactAsCommentBlock(fileName: string, content: string): string {
  const lines = content.split(/\r?\n/);
  const commented = lines.map((line) => (line.length > 0 ? `; ${line}` : ';')).join('\n');
  return `; [[[MIDEAS_ARTIFACT:${fileName}:BEGIN]]]\n${commented}\n; [[[MIDEAS_ARTIFACT:${fileName}:END]]]`;
}

export function buildMegaromGeneratedArtifacts(
  packResult: MegaromDataPackResult,
  mapperWindow: MapperWindowConfig,
  analysis?: ProjectAnalysis
): MegaromGeneratedArtifact[] {
  const resources = buildResourceDescriptors(packResult, mapperWindow);
  return [
    {
      fileName: 'resource_ids.asm',
      content: buildResourceIdsAsm(resources),
    },
    {
      fileName: 'resource_table.asm',
      content: buildResourceTableAsm(resources),
    },
    {
      fileName: 'packing_manifest.txt',
      content: buildPackingManifestText(packResult, resources),
    },
    {
      fileName: 'packing_manifest.json',
      content: buildPackingManifestJson(packResult, mapperWindow, resources),
    },
    {
      fileName: 'manifest_v2.json',
      content: buildManifestV2Json(packResult, mapperWindow, resources),
    },
    {
      fileName: 'banks.json',
      content: buildBanksJson(packResult, mapperWindow, resources),
    },
    {
      fileName: 'project_usage.json',
      content: buildProjectUsageJson(analysis, resources, mapperWindow),
    },
    {
      fileName: 'load_plan.json',
      content: buildLoadPlanJson(analysis, resources, mapperWindow),
    },
    {
      fileName: 'bank_optimizer.json',
      content: buildBankOptimizerJson(analysis, resources, mapperWindow),
    },
    {
      fileName: 'tilebank_integrity.json',
      content: buildTileBankIntegrityJson(analysis),
    },
  ];
}

export function renderMegaromGeneratedArtifactsAsCommentBlocks(
  packResult: MegaromDataPackResult,
  mapperWindow: MapperWindowConfig,
  analysis?: ProjectAnalysis
): string {
  return buildMegaromGeneratedArtifacts(packResult, mapperWindow, analysis)
    .map((artifact) => renderNamedArtifactAsCommentBlock(artifact.fileName, artifact.content))
    .join('\n\n');
}

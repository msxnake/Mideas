import { usesMapperBanking } from './romModeUtils';

export type MapperTargetFormat = 'konami' | 'ascii8' | 'ascii16';

export interface MapperWindowConfig {
  targetFormat: MapperTargetFormat;
  bankDivisorExpr: string;
  windowMaskExpr: string;
  windowBaseExpr: string;
  dataWindowPage: 'p2' | 'p3';
  dataZoneSize: number;
}

export function getMapperWindowConfig(
  romMode: string,
  targetFormat: MapperTargetFormat = 'konami'
): MapperWindowConfig {
  if (!usesMapperBanking(romMode)) {
    return {
      targetFormat,
      bankDivisorExpr: '#2000',
      windowMaskExpr: '#1FFF',
      windowBaseExpr: '#8000',
      dataWindowPage: 'p2',
      dataZoneSize: 0x2000,
    };
  }

  if (targetFormat === 'ascii16') {
    return {
      targetFormat,
      bankDivisorExpr: '#4000',
      windowMaskExpr: '#3FFF',
      windowBaseExpr: '#8000',
      dataWindowPage: 'p3',
      dataZoneSize: 0x4000,
    };
  }

  if (targetFormat === 'konami') {
    return {
      targetFormat,
      bankDivisorExpr: '#2000',
      windowMaskExpr: '#1FFF',
      windowBaseExpr: '#A000',
      dataWindowPage: 'p3',
      dataZoneSize: 0x2000,
    };
  }

  return {
    targetFormat,
    bankDivisorExpr: '#2000',
    windowMaskExpr: '#1FFF',
    windowBaseExpr: '#8000',
    dataWindowPage: 'p3',
    dataZoneSize: 0x2000,
  };
}

export function buildMapperBankEqu(label: string, config: MapperWindowConfig): string {
  return `((${label} - #4000) / ${config.bankDivisorExpr})`;
}

export function buildMapperWindowedAddress(label: string, config: MapperWindowConfig): string {
  return `(${label} & ${config.windowMaskExpr}) | ${config.windowBaseExpr}`;
}

export function buildMapperDataPushAsm(bankSymbol: string, config: MapperWindowConfig): string {
  return `    call mapper_push_${config.dataWindowPage}\n    ld a, ${bankSymbol} & #FF\n    call mapper_set_bank_${config.dataWindowPage}\n`;
}

export function buildMapperDataPopAsm(config: MapperWindowConfig): string {
  return `    call mapper_pop_${config.dataWindowPage}\n`;
}

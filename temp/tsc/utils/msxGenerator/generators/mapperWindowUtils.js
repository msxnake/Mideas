import { usesMapperBanking } from './romModeUtils';
export function getMapperWindowConfig(romMode, targetFormat = 'konami') {
    if (!usesMapperBanking(romMode)) {
        return {
            bankDivisorExpr: '#2000',
            windowMaskExpr: '#1FFF',
            windowBaseExpr: '#8000',
            dataWindowPage: 'p2',
            dataZoneSize: 0x2000,
        };
    }
    if (targetFormat === 'ascii16') {
        return {
            bankDivisorExpr: '#4000',
            windowMaskExpr: '#3FFF',
            windowBaseExpr: '#8000',
            dataWindowPage: 'p3',
            dataZoneSize: 0x4000,
        };
    }
    return {
        bankDivisorExpr: '#2000',
        windowMaskExpr: '#1FFF',
        windowBaseExpr: '#8000',
        dataWindowPage: 'p2',
        dataZoneSize: 0x2000,
    };
}
export function buildMapperBankEqu(label, config) {
    return `((${label} - #4000) / ${config.bankDivisorExpr})`;
}
export function buildMapperWindowedAddress(label, config) {
    return `(${label} & ${config.windowMaskExpr}) | ${config.windowBaseExpr}`;
}
export function buildMapperDataPushAsm(bankSymbol, config) {
    return `    call mapper_push_${config.dataWindowPage}\n    ld a, ${bankSymbol}\n    call mapper_set_bank_${config.dataWindowPage}\n`;
}
export function buildMapperDataPopAsm(config) {
    return `    call mapper_pop_${config.dataWindowPage}\n`;
}

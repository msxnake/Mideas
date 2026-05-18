"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapperWindowConfig = getMapperWindowConfig;
exports.buildMapperBankEqu = buildMapperBankEqu;
exports.buildMapperWindowedAddress = buildMapperWindowedAddress;
exports.buildMapperDataPushAsm = buildMapperDataPushAsm;
exports.buildMapperDataPopAsm = buildMapperDataPopAsm;
const romModeUtils_1 = require("./romModeUtils");
function getMapperWindowConfig(romMode, targetFormat = 'konami') {
    if (!(0, romModeUtils_1.usesMapperBanking)(romMode)) {
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
function buildMapperBankEqu(label, config) {
    return `((${label} - #4000) / ${config.bankDivisorExpr})`;
}
function buildMapperWindowedAddress(label, config) {
    return `(${label} & ${config.windowMaskExpr}) | ${config.windowBaseExpr}`;
}
function buildMapperDataPushAsm(bankSymbol, config) {
    return `    call mapper_push_${config.dataWindowPage}\n    ld a, ${bankSymbol} & #FF\n    call mapper_set_bank_${config.dataWindowPage}\n`;
}
function buildMapperDataPopAsm(config) {
    return `    call mapper_pop_${config.dataWindowPage}\n`;
}

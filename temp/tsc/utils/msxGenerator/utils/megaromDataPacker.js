function parseNumericLiteral(raw) {
    const value = raw.trim().toLowerCase();
    if (!value)
        return null;
    if (/^\d+$/.test(value))
        return parseInt(value, 10);
    if (/^#([0-9a-f]+)$/.test(value))
        return parseInt(value.slice(1), 16);
    if (/^0x([0-9a-f]+)$/.test(value))
        return parseInt(value.slice(2), 16);
    if (/^([0-9a-f]+)h$/.test(value))
        return parseInt(value.slice(0, -1), 16);
    return null;
}
function countDirectiveBytes(line) {
    const clean = line.split(';')[0].trim();
    if (!clean)
        return 0;
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
function splitDataBlocks(group) {
    const lines = group.asm.split(/\r?\n/);
    const blocks = [];
    const prelude = [];
    let currentLabel = null;
    let currentLines = [];
    let currentBytes = 0;
    const flushCurrent = () => {
        if (!currentLabel)
            return;
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
function formatHex(value) {
    return `#${value.toString(16).toUpperCase().padStart(4, '0')}`;
}
function formatDiagnosticsComment(zoneSize, dataStartAddress, zones, overflowBlocks, totalBlockBytes) {
    const lines = [];
    lines.push('; ------------------------------------------------------------------');
    lines.push('; MEGAROM DATA ZONE PACKER (FIRST-FIT DECREASING)');
    lines.push(`; Zone size: ${zoneSize} bytes`);
    lines.push(`; Data start address: ${formatHex(dataStartAddress)}`);
    lines.push(`; Total data bytes (source blocks): ${totalBlockBytes}`);
    lines.push(`; Zones used: ${zones.length}`);
    lines.push('; Placement policy: sort blocks by size descending, then first-fit by zone.');
    lines.push('; ------------------------------------------------------------------');
    if (zones.length === 0) {
        lines.push('; No banked data blocks emitted.');
    }
    for (const zone of zones) {
        lines.push(`; ZONE ${zone.zoneIndex.toString().padStart(2, '0')} ` +
            `[${formatHex(zone.orgAddress)}-${formatHex(zone.endAddress)}] ` +
            `bank ${zone.physicalBank} used=${zone.usedBytes} slack=${zone.remainingBytes}`);
        for (const block of zone.blocks) {
            lines.push(`;   + ${block.label} (${block.groupName}) @ +${formatHex(block.zoneOffset)} size=${block.byteSize}`);
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
export function packMegaromDataGroups(groups, dataStartAddress, zoneSize) {
    const sourceBlocks = groups
        .flatMap(splitDataBlocks)
        .filter((block) => block.asm.trim().length > 0);
    const indexedBlocks = sourceBlocks.map((block, sourceIndex) => ({
        ...block,
        sourceIndex,
    }));
    const orderedBlocks = [...indexedBlocks].sort((left, right) => {
        if (right.byteSize !== left.byteSize) {
            return right.byteSize - left.byteSize;
        }
        return left.sourceIndex - right.sourceIndex;
    });
    const overflowBlocks = [];
    const zones = [];
    const createZone = () => {
        const zoneIndex = zones.length;
        const orgAddress = dataStartAddress + (zoneIndex * zoneSize);
        return {
            zoneIndex,
            orgAddress,
            endAddress: orgAddress + zoneSize,
            usedBytes: 0,
            remainingBytes: zoneSize,
            physicalBank: (orgAddress - 0x4000) / zoneSize,
            blocks: [],
        };
    };
    for (const block of orderedBlocks) {
        if (block.byteSize > zoneSize) {
            overflowBlocks.push(block);
            continue;
        }
        let targetZone = zones.find((zone) => zone.remainingBytes >= block.byteSize);
        if (!targetZone) {
            targetZone = createZone();
            zones.push(targetZone);
        }
        const zoneOffset = targetZone.usedBytes;
        targetZone.blocks.push({
            ...block,
            zoneIndex: targetZone.zoneIndex,
            zoneOffset,
            physicalAddress: targetZone.orgAddress + zoneOffset,
        });
        targetZone.usedBytes += block.byteSize;
        targetZone.remainingBytes = zoneSize - targetZone.usedBytes;
    }
    const asmParts = [];
    for (const zone of zones) {
        asmParts.push(`    org ${formatHex(zone.orgAddress)}`);
        asmParts.push('; ==================================================================');
        asmParts.push(`; DATA ZONE ${zone.zoneIndex.toString().padStart(2, '0')} ` +
            `(bank ${zone.physicalBank}) used=${zone.usedBytes} slack=${zone.remainingBytes}`);
        asmParts.push('; ==================================================================');
        asmParts.push(zone.blocks.map((block) => block.asm).join('\n\n'));
        asmParts.push(`    ds ${formatHex(zone.endAddress)} - $, #FF`);
        asmParts.push('');
    }
    const totalBlockBytes = sourceBlocks.reduce((sum, block) => sum + block.byteSize, 0);
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

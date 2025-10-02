#!/usr/bin/env node
/**
 * Converts Glass.jar .sym format to OpenMSX debugger format
 *
 * Glass format:  LABEL: equ 4000H
 * OpenMSX format: 0x4000 LABEL
 */

const fs = require('fs');
const path = require('path');

function convertGlassToOpenMSX(inputFile, outputFile) {
    console.log(`Converting ${inputFile} to OpenMSX format...`);

    // Read input file
    const content = fs.readFileSync(inputFile, 'utf-8');
    const lines = content.split('\n');

    const symbols = [];

    // Parse Glass format: LABEL: equ 4000H
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(';')) continue;

        // Match: LABEL: equ 4000H or LABEL: equ 0F3E9H
        const match = trimmed.match(/^([A-Za-z0-9_]+):\s+equ\s+([0-9A-Fa-f]+)H?$/);
        if (match) {
            const label = match[1];
            const address = match[2];

            // Convert to decimal for OpenMSX
            const addrDecimal = parseInt(address, 16);

            // OpenMSX format: 0xADDR LABEL
            symbols.push(`0x${address.padStart(4, '0')} ${label}`);
        }
    }

    // Sort by address
    symbols.sort((a, b) => {
        const addrA = parseInt(a.split(' ')[0], 16);
        const addrB = parseInt(b.split(' ')[0], 16);
        return addrA - addrB;
    });

    // Write output file
    const outputContent = symbols.join('\n') + '\n';
    fs.writeFileSync(outputFile, outputContent, 'utf-8');

    console.log(`✅ Converted ${symbols.length} symbols`);
    console.log(`📁 Output: ${outputFile}`);

    return symbols.length;
}

// Main
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error('Usage: node convert_sym_to_openmsx.js <input.sym> [output.sym]');
        console.error('');
        console.error('Example:');
        console.error('  node convert_sym_to_openmsx.js game.sym game_openmsx.sym');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace('.sym', '_openmsx.sym');

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: File not found: ${inputFile}`);
        process.exit(1);
    }

    try {
        convertGlassToOpenMSX(inputFile, outputFile);
        console.log('');
        console.log('To load in OpenMSX debugger:');
        console.log(`  debug load_symbols "${path.resolve(outputFile)}"`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

module.exports = { convertGlassToOpenMSX };

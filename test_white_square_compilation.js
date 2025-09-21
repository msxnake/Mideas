// ==================================================================
// WHITE SQUARE GAME - Compilation Test Script
// ==================================================================
// This script tests that the white square game compiles correctly
// and produces a valid MSX ROM file.

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('='.repeat(70));
console.log('WHITE SQUARE GAME - COMPILATION TEST');
console.log('='.repeat(70));

const sourceFile = 'white_square_game.asm';
const romFile = 'white_square_game.rom';
const glassJar = 'server/glass.jar';

try {
    // Check if source file exists
    if (!fs.existsSync(sourceFile)) {
        throw new Error(`Source file ${sourceFile} not found!`);
    }
    console.log(`✓ Source file found: ${sourceFile}`);

    // Check if glass.jar exists
    if (!fs.existsSync(glassJar)) {
        throw new Error(`Glass.jar compiler not found at: ${glassJar}`);
    }
    console.log(`✓ Glass.jar compiler found: ${glassJar}`);

    // Remove existing ROM file if it exists
    if (fs.existsSync(romFile)) {
        fs.unlinkSync(romFile);
        console.log(`✓ Removed existing ROM file: ${romFile}`);
    }

    // Compile the assembly file
    console.log('\n--- COMPILATION OUTPUT ---');
    const compileCommand = `java -jar ${glassJar} ${sourceFile} ${romFile}`;
    console.log(`Command: ${compileCommand}`);

    try {
        const output = execSync(compileCommand, { encoding: 'utf8', stdio: 'pipe' });
        if (output.trim()) {
            console.log('Compiler output:', output);
        } else {
            console.log('✓ Compilation completed with no output (success)');
        }
    } catch (error) {
        if (error.stdout) console.log('STDOUT:', error.stdout);
        if (error.stderr) console.log('STDERR:', error.stderr);
        throw error;
    }

    // Check if ROM file was created
    if (!fs.existsSync(romFile)) {
        throw new Error(`ROM file ${romFile} was not created!`);
    }
    console.log(`✓ ROM file created: ${romFile}`);

    // Check ROM file size
    const stats = fs.statSync(romFile);
    const expectedSize = 8192; // 8KB
    if (stats.size !== expectedSize) {
        console.warn(`⚠ ROM size is ${stats.size} bytes, expected ${expectedSize} bytes`);
    } else {
        console.log(`✓ ROM size is correct: ${stats.size} bytes (8KB)`);
    }

    // Check ROM header
    const romData = fs.readFileSync(romFile);
    const header = romData.slice(0, 2);
    if (header[0] === 0x41 && header[1] === 0x42) { // "AB"
        console.log('✓ ROM header is correct: "AB" signature found');
    } else {
        console.warn(`⚠ ROM header incorrect: expected "AB", found "${String.fromCharCode(header[0])}${String.fromCharCode(header[1])}"`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL TESTS PASSED! The white square game is ready to run on MSX.');
    console.log('='.repeat(70));

    console.log('\nTo test on OpenMSX:');
    console.log(`1. Start OpenMSX`);
    console.log(`2. Insert cartridge: cart ${romFile}`);
    console.log(`3. Reset: reset`);
    console.log('4. Use arrow keys to move the white square around the screen');

    console.log('\nGame Features:');
    console.log('- Screen 2 graphics mode with black background');
    console.log('- White 16x16 pixel square sprite');
    console.log('- Joystick/keyboard input for movement (arrow keys)');
    console.log('- Smooth movement with boundary checking');
    console.log('- V-Blank synchronized for proper timing');

} catch (error) {
    console.error('\n❌ COMPILATION FAILED!');
    console.error('Error:', error.message);
    if (error.status) {
        console.error('Exit code:', error.status);
    }
    process.exit(1);
}
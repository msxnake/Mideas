/**
 * Test script to compile ASM code with glass.jar and detect errors
 * Usage: node test_compile_asm.mjs [path-to-json]
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const GLASS_JAR = join(__dirname, 'server', 'glass.jar');
const TEMP_DIR = join(__dirname, 'server', 'temp');
const DEFAULT_PROJECT = 'C:\\Users\\salam\\Downloads\\mymsxgame1.json';

async function main() {
  const projectPath = process.argv[2] || DEFAULT_PROJECT;

  console.log('='.repeat(60));
  console.log('MSX ASM Compilation Test');
  console.log('='.repeat(60));
  console.log(`Project: ${projectPath}`);
  console.log(`Glass JAR: ${GLASS_JAR}`);
  console.log('');

  // Check if glass.jar exists
  if (!existsSync(GLASS_JAR)) {
    console.error('ERROR: glass.jar not found at', GLASS_JAR);
    process.exit(1);
  }

  // Check if project exists
  if (!existsSync(projectPath)) {
    console.error('ERROR: Project file not found at', projectPath);
    process.exit(1);
  }

  // Read project JSON
  console.log('Reading project JSON...');
  const projectJson = JSON.parse(readFileSync(projectPath, 'utf-8'));

  // Import the generator dynamically
  console.log('Loading MSX Generator...');

  try {
    // We need to use tsx or ts-node for TypeScript files
    // For now, let's compile manually by building the project first

    // Try to use the existing temp ASM file if it exists
    const asmFiles = existsSync(join(TEMP_DIR, 'unitedFiles.asm'));

    if (!asmFiles) {
      console.log('No unitedFiles.asm found. Please generate it through the UI first.');
      console.log('Then run this script again.');
      process.exit(1);
    }

    const asmPath = join(TEMP_DIR, 'unitedFiles.asm');
    const romPath = join(TEMP_DIR, 'test_output.rom');

    console.log(`\nCompiling: ${asmPath}`);
    console.log(`Output: ${romPath}`);
    console.log('-'.repeat(60));

    try {
      const result = execSync(
        `java -jar "${GLASS_JAR}" "${asmPath}" "${romPath}"`,
        {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: TEMP_DIR
        }
      );

      console.log('SUCCESS! ROM compiled successfully.');
      console.log(result);

    } catch (compileError) {
      console.log('\nCOMPILATION FAILED!');
      console.log('-'.repeat(60));

      const errorOutput = compileError.stderr || compileError.stdout || compileError.message;
      console.log(errorOutput);

      // Parse the error to extract useful info
      const errorMatch = errorOutput.match(/\[at ([^\]]+):(\d+)\]\n(.+)/s);
      if (errorMatch) {
        const [, file, line, context] = errorMatch;
        console.log('\n' + '='.repeat(60));
        console.log('ERROR DETAILS:');
        console.log(`File: ${file}`);
        console.log(`Line: ${line}`);
        console.log(`Context: ${context.trim()}`);

        // Try to read the line from the ASM file
        try {
          const asmContent = readFileSync(asmPath, 'utf-8').split('\n');
          const lineNum = parseInt(line, 10);
          const startLine = Math.max(0, lineNum - 5);
          const endLine = Math.min(asmContent.length, lineNum + 5);

          console.log('\nCode around error:');
          console.log('-'.repeat(40));
          for (let i = startLine; i < endLine; i++) {
            const marker = i + 1 === lineNum ? '>>>' : '   ';
            console.log(`${marker} ${i + 1}: ${asmContent[i]}`);
          }
        } catch (e) {
          // Ignore read errors
        }
      }

      process.exit(1);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

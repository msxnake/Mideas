/**
 * Full ASM generation and compilation test
 * Generates ASM from project JSON and compiles with glass.jar
 *
 * Usage: npx tsx test_full_compile.ts [path-to-json]
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the generator
import { generateModularASM } from './utils/msxGenerator/index';
import { analyzeProject } from './utils/asmTemplateGenerator';
import { ProjectAsset } from './types';

// Configuration
const GLASS_JAR = join(__dirname, 'server', 'glass.jar');
const TEMP_DIR = join(__dirname, 'server', 'temp');
const DEFAULT_PROJECT = 'C:\\Users\\salam\\Downloads\\mymsxgame1.json';

interface CompilationResult {
  success: boolean;
  error?: string;
  line?: number;
  file?: string;
  context?: string;
}

function compileASM(asmPath: string, romPath: string): CompilationResult {
  try {
    execSync(
      `java -jar "${GLASS_JAR}" "${asmPath}" "${romPath}"`,
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: dirname(asmPath)
      }
    );
    return { success: true };
  } catch (error: any) {
    const errorOutput = error.stderr || error.stdout || error.message;

    // Parse error details
    const lineMatch = errorOutput.match(/\[at [^\]]+:(\d+)\]/);
    const contextMatch = errorOutput.match(/\[at [^\]]+:\d+\]\n(.+)/s);

    return {
      success: false,
      error: errorOutput,
      line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
      context: contextMatch ? contextMatch[1].split('\n')[0].trim() : undefined
    };
  }
}

function showCodeContext(asmPath: string, errorLine: number, contextLines: number = 5): void {
  try {
    const content = readFileSync(asmPath, 'utf-8').split('\n');
    const start = Math.max(0, errorLine - contextLines - 1);
    const end = Math.min(content.length, errorLine + contextLines);

    console.log('\nCode context:');
    console.log('-'.repeat(60));
    for (let i = start; i < end; i++) {
      const marker = i + 1 === errorLine ? '>>> ' : '    ';
      console.log(`${marker}${(i + 1).toString().padStart(5)}: ${content[i]}`);
    }
    console.log('-'.repeat(60));
  } catch (e) {
    console.log('Could not read source file for context');
  }
}

async function main(): Promise<void> {
  const projectPath = process.argv[2] || DEFAULT_PROJECT;

  console.log('='.repeat(70));
  console.log('MSX Full ASM Generation and Compilation Test');
  console.log('='.repeat(70));
  console.log(`Project: ${projectPath}`);
  console.log('');

  // Check files exist
  if (!existsSync(GLASS_JAR)) {
    console.error('ERROR: glass.jar not found at', GLASS_JAR);
    process.exit(1);
  }

  if (!existsSync(projectPath)) {
    console.error('ERROR: Project file not found at', projectPath);
    process.exit(1);
  }

  // Read project JSON
  console.log('1. Reading project JSON...');
  const projectData = JSON.parse(readFileSync(projectPath, 'utf-8'));
  const assets: ProjectAsset[] = [...(projectData.assets || [])];

  // CRITICAL: Add entityTemplates and componentDefinitions to assets
  if (projectData.entityTemplates && Array.isArray(projectData.entityTemplates)) {
    projectData.entityTemplates.forEach((template: any) => {
      assets.push({
        id: template.id,
        type: 'entitytemplate',
        name: template.name || template.id,
        data: template
      });
    });
  }
  if (projectData.componentDefinitions && Array.isArray(projectData.componentDefinitions)) {
    projectData.componentDefinitions.forEach((compDef: any) => {
      if (!assets.find(a => a.id === compDef.id && a.type === 'componentdefinition')) {
        assets.push({
          id: compDef.id,
          type: 'componentdefinition',
          name: compDef.name || compDef.id,
          data: compDef
        });
      }
    });
  }
  console.log(`   Found ${assets.length} assets (including templates & components)`);

  // Analyze project
  console.log('\n2. Analyzing project...');
  if (!assets || assets.length === 0) {
    console.error('   ERROR: No assets found in project');
    process.exit(1);
  }
  const projectName = projectData.name || 'TestProject';
  const analysis = analyzeProject(projectName, assets);
  console.log(`   Sprites: ${analysis.sprites?.length || 0}`);
  console.log(`   Tiles: ${analysis.tiles?.length || 0}`);
  console.log(`   Screens: ${analysis.screenMaps?.length || 0}`);
  console.log(`   Entities: ${analysis.entities?.length || 0}`);
  console.log(`   Has GameFlow: ${analysis.hasGameFlow}`);

  // Generate ASM
  console.log('\n3. Generating ASM files...');
  console.log(`   Project name: ${projectName}`);
  console.log(`   Assets type: ${typeof assets}, isArray: ${Array.isArray(assets)}`);
  console.log(`   Assets: ${JSON.stringify(assets.slice(0, 2).map(a => ({ id: a.id, type: a.type, name: a.name })))}`);

  try {
    const files = generateModularASM(projectName, assets, {
      generateUnified: true,
      interruptDrivenComponents: true,
      hardwareMode: 'hybrid'
    });

    console.log(`   Generated ${Object.keys(files).length} files`);

    // Save unified file
    const unifiedPath = join(TEMP_DIR, 'test_unified.asm');
    const romPath = join(TEMP_DIR, 'test_unified.rom');

    writeFileSync(unifiedPath, files['unitedFiles.asm']);
    console.log(`   Saved: ${unifiedPath}`);

    // Compile
    console.log('\n4. Compiling with glass.jar...');
    const result = compileASM(unifiedPath, romPath);

    if (result.success) {
      console.log('\n' + '='.repeat(70));
      console.log('SUCCESS! ROM compiled without errors.');
      console.log(`Output: ${romPath}`);
      console.log('='.repeat(70));
    } else {
      console.log('\n' + '='.repeat(70));
      console.log('COMPILATION FAILED!');
      console.log('='.repeat(70));
      console.log(result.error);

      if (result.line) {
        showCodeContext(unifiedPath, result.line);
      }

      process.exit(1);
    }

  } catch (error: any) {
    console.error('\nGeneration error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

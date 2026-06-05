import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const GLASS_JAR = join(__dirname, 'server', 'glass.jar');
const TEMP_DIR = join(__dirname, 'server', 'temp');
const PROJECT_PATH = 'C:\\Users\\salam\\Downloads\\push_example15.json';

console.log('=== MSX2 Compilation: push_example15 ===\n');

// 1. Check files
if (!existsSync(GLASS_JAR)) { console.error('glass.jar not found'); process.exit(1); }
if (!existsSync(PROJECT_PATH)) { console.error('Project file not found'); process.exit(1); }

// 2. Read project
console.log('1. Reading project...');
const projectData = JSON.parse(readFileSync(PROJECT_PATH, 'utf-8'));
const { generateModularASM } = await import('./utils/msxGenerator/index.ts');
const { analyzeProject } = await import('./utils/asmTemplateGenerator.ts');

// Build assets
const assets = [...(projectData.assets || [])];
if (projectData.entityTemplates) {
  projectData.entityTemplates.forEach(t => {
    if (!assets.find(a => a.id === t.id)) assets.push({ id: t.id, type: 'entitytemplate', name: t.name || t.id, data: t });
  });
}
if (projectData.componentDefinitions) {
  projectData.componentDefinitions.forEach(c => {
    if (!assets.find(a => a.id === c.id)) assets.push({ id: c.id, type: 'componentdefinition', name: c.name || c.id, data: c });
  });
}
console.log(`   Assets: ${assets.length}`);

// 3. Analyze
console.log('\n2. Analyzing...');
const projectName = projectData.name || 'push_example15';
const analysis = analyzeProject(projectName, assets);
console.log(`   Sprites: ${analysis.sprites?.length}`);
console.log(`   Tiles: ${analysis.tiles?.length}`);
console.log(`   Screens: ${analysis.screenMaps?.length}`);

// 4. Generate ASM
console.log('\n3. Generating ASM...');
const files = generateModularASM(projectName, assets, { generateUnified: true, hardwareMode: 'hybrid', romMode: 'megarom', targetFormat: 'konami' });
const asmPath = join(TEMP_DIR, 'push_example15.asm');
writeFileSync(asmPath, files['unitedFiles.asm']);
console.log(`   ASM saved: ${asmPath}`);

// 5. Compile with glass.jar
console.log('\n4. Compiling with glass.jar...');
try {
  execSync(`java -jar "${GLASS_JAR}" "${asmPath}" "${join(TEMP_DIR, 'push_example15.rom')}"`, {
    encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], cwd: TEMP_DIR
  });
  console.log('   SUCCESS: ROM compiled!');
} catch (e) {
  const out = e.stderr || e.stdout || e.message;
  console.error('   FAILED:\n' + out);
  const lineMatch = out.match(/\[at [^\]]+:(\d+)\]/);
  if (lineMatch) {
    const line = parseInt(lineMatch[1]);
    const lines = readFileSync(asmPath, 'utf-8').split('\n');
    const start = Math.max(0, line - 6);
    const end = Math.min(lines.length, line + 4);
    console.log('\nCode context around line ' + line + ':');
    console.log('-'.repeat(60));
    for (let i = start; i < end; i++) {
      console.log(`${i + 1 === line ? '>>>' : '   '} ${i + 1}: ${lines[i]}`);
    }
    console.log('-'.repeat(60));
  }
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Refactor safety net: proves that a pure refactor of the ASM generator leaves
 * the generated output byte-identical.
 *
 * The discipline of "ROM byte-identica si no se usa" already exists across the
 * MSX2 features; this script automates it so a refactor stops being scary:
 *
 *   1. On a clean tree:  node scripts/check_generator_output_identical.mjs --record
 *   2. Refactor.
 *   3. node scripts/check_generator_output_identical.mjs
 *
 * Step 3 fails loudly, with the first differing line, if any case moved.
 *
 * Hashing the unified ASM (not the ROM) is the primary check because glass.jar
 * is deterministic: identical ASM implies an identical ROM, and an ASM diff is
 * the only one a human can actually read. `--rom` additionally assembles every
 * case with glass.jar and hashes the binary, for the final belt-and-braces pass
 * before landing a refactor.
 *
 * Line endings are normalised to \n before hashing: the repo runs with
 * autocrlf=true and a CRLF flip must not masquerade as a generator change.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = path.join(ROOT, 'test', 'generator-baseline', 'baseline.json');
// Snapshots live under server/temp (gitignored): they are only needed to diff a
// mismatch inside the working session, never to be committed. The baseline ASM
// and the current ASM go to SEPARATE directories on purpose — writing both to
// one directory made the current run overwrite the very snapshot it was about
// to diff against, so every mismatch reported "lines are identical".
const BASELINE_ASM_DIR = path.join(ROOT, 'server', 'temp', 'genbaseline', 'baseline');
const CURRENT_ASM_DIR = path.join(ROOT, 'server', 'temp', 'genbaseline', 'current');
const TS_BUILD_DIR = path.join(ROOT, 'server', 'temp', 'tsbuild_cmp');

/**
 * Cases must cover every route that shares the code being refactored. For the
 * SCREEN 5 presentation data helpers that means all three consumers:
 * the strict-shape presentation backend, the generic flow walker, and the
 * bitmap-room intro.
 *
 * Every fixture here is tracked in git on purpose — anything under an `out/`
 * directory is gitignored build output and would make the baseline
 * unreproducible on a fresh clone.
 */
const CASES = [
  {
    id: 'presentation-minimal',
    fixture: 'test/msx2-screen5-presentation/presentation_screen5_project.json',
    covers: 'presentation backend, no GameFlow (normalizePresentation + palette + bitmap)',
  },
  {
    id: 'presentation-flow-strict',
    fixture: 'test/msx2-gameflow/screen5_presentation_flow_project.json',
    covers: 'presentation backend, strict-shape flow resolver',
  },
  {
    id: 'presentation-chain-from-png',
    fixture: 'test/msx2-screen5-presentation/from_png/presentacion_naves_galaxian_rtype_screen5_project.json',
    covers: 'multi-scene presentation chain imported from PNG',
  },
  {
    id: 'presentation-bionic-simple32k',
    fixture: 'test/msx2-screen5-presentation/bionic_invaders/bionic_invaders_screen5_presentation_project.json',
    covers: 'presentation backend, simple32k chunking',
  },
  {
    id: 'presentation-bionic-megarom',
    fixture: 'test/msx2-screen5-presentation/bionic_invaders_megarom/bionic_invaders_screen5_presentation_megarom_project.json',
    romMode: 'megarom',
    covers: 'presentation backend, Konami MegaROM banked chunks',
  },
  {
    id: 'presentation-flow-walker-menu',
    fixture: 'test/msx2-gameflow/screen5_gameflow_menu_project.json',
    covers: 'generic flow walker (SubMenu / TextScroll / wipes)',
  },
  {
    id: 'bitmap-room-intro',
    fixture: 'test/msx2-bitmap-intro/bitmap_intro_test.json',
    covers: 'bitmap-room backend rendering its own Screen5Presentation intro',
  },
  {
    id: 'bitmap-room-boss',
    fixture: 'test/msx2-boss/fixture_boss_def.json',
    // The boss fixture carries a full presentation intro, which does not fit a
    // simple 32KB ROM; MegaROM is how this project is actually exported.
    romMode: 'megarom',
    // The boss generator is the biggest single emitter in the backend and had
    // NO case here, so "byte-identical unless the feature is used" was an
    // unverified claim for every boss subsystem. This fixture exercises the
    // ones that share code: HP phases, a path with node scripts, sprite
    // bullets, damage zones and the Room Lock chain.
    covers: 'bitmap-room boss: attack phases, path, sprite bullets, damage zones, barrier',
  },
  {
    id: 'mixed-screen5-to-screen4',
    fixture: 'test/msx2-mixed/mixed_screen5_screen4_project.json',
    covers: 'SCREEN 5 presentation intro handing off to a SCREEN 4 tile runtime in one ROM',
  },
  {
    id: 'mixed-screen5-to-screen4-megarom',
    fixture: 'test/msx2-mixed/mixed_screen5_screen4_project.json',
    romMode: 'megarom',
    // Only on Konami MegaROM does the intro emit BOTH cartridge bring-up calls,
    // which is the branch that actually strips them out of the banked intro.
    covers: 'mixed route on Konami MegaROM: the intro bring-up strip actually fires',
  },
];

/**
 * Backend-id aliasing: each pair must generate the SAME ASM for the same
 * fixture. This is what makes renaming the backend ids safe — it proves the
 * legacy id and its current spelling resolve to the same target, including the
 * SCREEN 5 emitter choice, which is no longer part of the id.
 *
 * Independent of the baseline: both sides are generated in the same run, so
 * these keep working without re-recording.
 */
const EQUIVALENCE_CASES = [
  {
    id: 'screen5-presentation-alias',
    fixture: 'test/msx2-screen5-presentation/presentation_screen5_project.json',
    left: 'msx2-screen5-presentation',
    right: 'screen5',
    covers: 'legacy presentation id vs screen5 (presentation assets -> presentation emitter)',
  },
  {
    id: 'screen5-bitmap-room-alias',
    fixture: 'test/msx2-bitmap-intro/bitmap_intro_test.json',
    left: 'msx2-screen4-bitmap-room',
    right: 'screen5',
    covers: 'legacy bitmap-room id vs screen5 (flow purpose pins the rooms emitter)',
  },
  {
    id: 'screen4-pattern-alias',
    fixture: 'test/msx2-screen4/raster-bricks/msx2-raster-bricks-project.json',
    left: 'msx2-screen4-pattern',
    right: 'screen4',
    covers: 'legacy tile id vs screen4',
  },
];

/**
 * GameFlow `purpose` aliasing. The two SCREEN 5 purposes collapsed into one
 * (`screen5`), which no longer says which emitter to use — that is inferred
 * from the assets. These pairs prove the inference lands on the same emitter
 * the legacy purpose used to pin, which is what makes the collapse safe for
 * projects that carry BOTH bitmap rooms and a presentation asset.
 */
const PURPOSE_EQUIVALENCE_CASES = [
  {
    id: 'purpose-bitmap-rooms',
    fixture: 'test/msx2-bitmap-intro/bitmap_intro_test.json',
    left: 'screen4-bitmap-runtime',
    right: 'screen5',
    covers: 'rooms + presentation asset: screen5 must infer the rooms emitter',
  },
  {
    id: 'purpose-presentation',
    fixture: 'test/msx2-gameflow/screen5_presentation_flow_project.json',
    left: 'screen5-presentation',
    right: 'screen5',
    covers: 'presentation only, no rooms: screen5 must infer the presentation emitter',
  },
];

function parseArgs(argv) {
  const args = { record: false, rom: false, reuseBuild: false, verbose: false, filter: null, allowTscErrors: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--record') args.record = true;
    else if (arg === '--rom') args.rom = true;
    else if (arg === '--reuse-build') args.reuseBuild = true;
    else if (arg === '--allow-tsc-errors') args.allowTscErrors = true;
    else if (arg === '--rom-only') { args.romOnly = true; args.rom = true; }
    else if (arg === '--verbose') args.verbose = true;
    else if (arg === '--filter') args.filter = argv[++i];
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage() {
  console.log(`Usage: node scripts/check_generator_output_identical.mjs [options]

  --record             Write the baseline instead of comparing against it.
  --rom                Also assemble every case with glass.jar and hash the ROM.
  --reuse-build        Skip the TypeScript build and reuse the previous one.
                       Unsafe during a refactor: the build may be stale.
  --allow-tsc-errors   Continue when tsc exits non-zero but still emitted.
  --rom-only           Only the ROM must match; ASM differences are reported but
                       do not fail. For comment-only changes to generated ASM.
                       Implies --rom.
  --filter <str>       Only run cases whose id contains <str>.
  --verbose            Show tsc and generator output.
`);
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function normalizeEol(text) {
  return text.replace(/\r\n/g, '\n');
}

/**
 * Builds the generator into a CLEAN output directory.
 *
 * The clean wipe is not hygiene, it is correctness: an earlier version of this
 * script tolerated a failing tsc as long as index.js existed, which silently
 * compared a STALE build against the baseline and reported a false green on a
 * source change. A build that does not fully succeed must abort the run.
 */
function buildGenerator({ reuseBuild, verbose, allowTscErrors }) {
  const compiledIndex = path.join(TS_BUILD_DIR, 'utils', 'msxGenerator', 'index.js');
  if (reuseBuild) {
    if (!fs.existsSync(compiledIndex)) {
      throw new Error(`--reuse-build was passed but there is no build at ${path.relative(ROOT, compiledIndex)}.`);
    }
    console.log('Reusing existing generator build (--reuse-build): output may be stale.');
    return compiledIndex;
  }
  console.log('Compiling the generator with tsc...');
  fs.rmSync(TS_BUILD_DIR, { recursive: true, force: true });
  fs.mkdirSync(TS_BUILD_DIR, { recursive: true });
  // Run the local tsc through node rather than npx: since Node 20 a .cmd
  // shim cannot be spawned without a shell, and that failure surfaces with an
  // empty stdout, which is what previously got mistaken for "type errors".
  const tscBin = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!fs.existsSync(tscBin)) {
    throw new Error(`Local TypeScript not found at ${path.relative(ROOT, tscBin)}. Run npm install.`);
  }
  try {
    execFileSync(
      process.execPath,
      [
        tscBin,
        '--pretty', 'false',
        '--module', 'commonjs',
        '--target', 'ES2020',
        '--outDir', TS_BUILD_DIR,
        '--moduleResolution', 'node',
        '--skipLibCheck',
        '--noEmitOnError', 'false',
        'utils/msxGenerator/index.ts',
      ],
      { cwd: ROOT, stdio: verbose ? 'inherit' : 'pipe' }
    );
  } catch (error) {
    const details = [error.stdout, error.stderr]
      .map(stream => (stream ? stream.toString().trim() : ''))
      .filter(Boolean)
      .join('\n');
    if (!allowTscErrors) {
      throw new Error(
        `tsc exited non-zero, so the build cannot be trusted:\n${details || '(no output captured)'}\n\n` +
        'Fix the type errors, or pass --allow-tsc-errors if they are known and unrelated.'
      );
    }
    if (!fs.existsSync(compiledIndex)) {
      throw new Error(`TypeScript build produced no output.\n${details}`);
    }
    console.warn(`tsc reported errors but emitted output (--allow-tsc-errors):\n${details}`);
  }
  if (!fs.existsSync(compiledIndex)) {
    throw new Error(`TypeScript build produced no output at ${path.relative(ROOT, compiledIndex)}.`);
  }
  fs.writeFileSync(path.join(TS_BUILD_DIR, 'package.json'), '{"type":"commonjs"}');
  return compiledIndex;
}

/**
 * Mirrors how scripts/build_mideas_unified_rom.py derives the export config
 * from a project JSON, so the baseline reflects the real export path rather
 * than an invented one.
 */
function resolveCaseConfig(testCase, raw) {
  const screenMode = testCase.screenMode
    || raw.screenMode
    || raw.currentScreenMode
    || 'SCREEN 4 (Graphics II)';
  return {
    name: testCase.name || raw.name || raw.currentProjectName || path.basename(testCase.fixture, '.json'),
    config: {
      generateUnified: true,
      romMode: testCase.romMode || 'simple32k',
      targetFormat: testCase.targetFormat || 'konami',
      screenMode,
      // Left undefined on purpose when the fixture does not pin it: that
      // exercises resolveGraphicsBackend() exactly as a real export would.
      targetGraphicsBackend: testCase.backend || raw.targetGraphicsBackend || undefined,
    },
  };
}

function generateAsm(generator, testCase, verbose) {
  const fixturePath = path.join(ROOT, testCase.fixture);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Missing fixture: ${testCase.fixture}`);
  }
  const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const assets = Array.isArray(raw.assets) ? raw.assets : [];
  if (assets.length === 0) throw new Error(`Fixture has no assets: ${testCase.fixture}`);
  if (testCase.purpose) {
    // Same flow the generator picks: "Main MSX2" if present, else the first one.
    const flows = assets.filter(asset => asset?.type === 'msx2gameflow');
    const flow = flows.find(asset => asset.name === 'Main MSX2') || flows[0];
    if (!flow?.data) throw new Error(`Fixture has no msx2gameflow to set a purpose on: ${testCase.fixture}`);
    flow.data.purpose = testCase.purpose;
  }
  const { name, config } = resolveCaseConfig(testCase, raw);

  // The generator is chatty; keep the report readable unless asked otherwise.
  const realLog = console.log;
  const realWarn = console.warn;
  if (!verbose) {
    console.log = () => {};
    console.warn = () => {};
  }
  let files;
  try {
    files = generator.generateModularASM(name, assets, config);
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
  const asm = files['unitedFiles.asm'] || files['main.asm'];
  if (!asm) {
    throw new Error(`Generator returned no unified ASM for ${testCase.id}. Files: ${Object.keys(files).join(', ')}`);
  }
  return normalizeEol(asm);
}

function findGlassJar() {
  for (const candidate of [path.join(ROOT, 'server', 'glass.jar'), path.join(ROOT, 'test', 'glass.jar')]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('glass.jar not found in server/ or test/.');
}

function assembleRom(glassJar, asm, caseId, verbose) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_rom_'));
  try {
    const asmPath = path.join(workDir, `${caseId}.asm`);
    const romPath = path.join(workDir, `${caseId}.rom`);
    fs.writeFileSync(asmPath, asm);
    execFileSync(
      'java',
      ['-jar', glassJar, '-I', path.join(ROOT, 'server'), asmPath, romPath],
      { cwd: ROOT, stdio: verbose ? 'inherit' : 'pipe' }
    );
    return createHash('sha256').update(fs.readFileSync(romPath)).digest('hex');
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/** First differing line, with a little context, so a mismatch is actionable. */
function describeFirstDifference(caseId, currentAsm) {
  const snapshotPath = path.join(BASELINE_ASM_DIR, `${caseId}.asm`);
  if (!fs.existsSync(snapshotPath)) {
    return `      (no ASM snapshot to diff; re-run --record on a clean tree to capture one)`;
  }
  const before = normalizeEol(fs.readFileSync(snapshotPath, 'utf8')).split('\n');
  const after = currentAsm.split('\n');
  const limit = Math.max(before.length, after.length);
  for (let i = 0; i < limit; i++) {
    if (before[i] !== after[i]) {
      const context = [];
      for (let j = Math.max(0, i - 2); j < i; j++) context.push(`        ${j + 1}   ${before[j] ?? ''}`);
      context.push(`        ${i + 1} - ${before[i] ?? '<eof>'}`);
      context.push(`        ${i + 1} + ${after[i] ?? '<eof>'}`);
      return [
        `      first difference at line ${i + 1} (${before.length} -> ${after.length} lines)`,
        ...context,
      ].join('\n');
    }
  }
  return '      lines are identical; the difference is in line endings or trailing bytes';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const cases = args.filter ? CASES.filter(item => item.id.includes(args.filter)) : CASES;
  if (cases.length === 0) throw new Error(`No cases match filter: ${args.filter}`);

  const compiledIndex = buildGenerator(args);
  const generator = require(compiledIndex);
  const glassJar = args.rom ? findGlassJar() : null;

  const results = {};
  const failures = [];
  const asmOutDir = args.record ? BASELINE_ASM_DIR : CURRENT_ASM_DIR;
  fs.mkdirSync(asmOutDir, { recursive: true });

  for (const testCase of cases) {
    process.stdout.write(`  ${testCase.id.padEnd(32)} `);
    let asm;
    try {
      asm = generateAsm(generator, testCase, args.verbose);
    } catch (error) {
      console.log('GENERATION FAILED');
      failures.push(`${testCase.id}: ${error.message}`);
      continue;
    }
    const entry = { fixture: testCase.fixture, covers: testCase.covers, asmSha256: sha256(asm), asmBytes: asm.length };
    if (glassJar) {
      try {
        entry.romSha256 = assembleRom(glassJar, asm, testCase.id, args.verbose);
      } catch (error) {
        console.log('ASSEMBLY FAILED');
        failures.push(`${testCase.id}: glass.jar failed: ${error.message}`);
        continue;
      }
    }
    results[testCase.id] = entry;
    fs.writeFileSync(path.join(asmOutDir, `${testCase.id}.asm`), asm);
    console.log(`${entry.asmSha256.slice(0, 12)}  ${String(entry.asmBytes).padStart(8)} bytes${entry.romSha256 ? `  rom ${entry.romSha256.slice(0, 12)}` : ''}`);
  }

  const runEquivalence = (title, pairs, buildSide) => {
    console.log(`\n  ${title}:`);
    for (const pair of pairs) {
      process.stdout.write(`  ${pair.id.padEnd(32)} `);
      try {
        const left = generateAsm(generator, buildSide(pair, pair.left), args.verbose);
        const right = generateAsm(generator, buildSide(pair, pair.right), args.verbose);
        if (sha256(left) === sha256(right)) {
          console.log(`${pair.left} == ${pair.right}`);
        } else {
          console.log('MISMATCH');
          failures.push(`${pair.id}: '${pair.left}' and '${pair.right}' generate different ASM (${pair.covers})`);
        }
      } catch (error) {
        console.log('FAILED');
        failures.push(`${pair.id}: ${error.message}`);
      }
    }
  };

  if (!args.filter) {
    runEquivalence('backend-id aliases', EQUIVALENCE_CASES, (pair, side) => ({ ...pair, backend: side }));
    // The fixture pins the backend; only the flow purpose differs between sides.
    runEquivalence('gameflow purpose aliases', PURPOSE_EQUIVALENCE_CASES, (pair, side) => ({
      ...pair,
      backend: undefined,
      purpose: side,
    }));
  }

  if (args.record) {
    if (failures.length > 0) {
      console.error('\nRefusing to record a baseline with failing cases:');
      for (const failure of failures) console.error(`  - ${failure}`);
      return 1;
    }
    fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
    const baseline = {
      note: 'Generated by scripts/check_generator_output_identical.mjs --record. Hashes of the unified ASM per fixture; a pure refactor must not change them.',
      recordedAt: new Date().toISOString(),
      cases: results,
    };
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`\nBaseline written: ${path.relative(ROOT, BASELINE_PATH)} (${Object.keys(results).length} cases)`);
    console.log(`ASM snapshots:    ${path.relative(ROOT, BASELINE_ASM_DIR)}`);
    return 0;
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`\nNo baseline found at ${path.relative(ROOT, BASELINE_PATH)}. Run with --record first.`);
    return 1;
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const drifted = [];
  for (const testCase of cases) {
    const expected = baseline.cases?.[testCase.id];
    const actual = results[testCase.id];
    if (!actual) continue;
    if (!expected) {
      drifted.push(`${testCase.id}: not in the baseline (re-record after adding a case)`);
      continue;
    }
    if (expected.asmSha256 !== actual.asmSha256) {
      const report = `${testCase.id}: ASM changed\n      expected ${expected.asmSha256}\n      actual   ${actual.asmSha256}\n${describeFirstDifference(testCase.id, normalizeEol(fs.readFileSync(path.join(CURRENT_ASM_DIR, `${testCase.id}.asm`), 'utf8')))}`;
      if (!args.romOnly) {
        drifted.push(report);
        continue;
      }
      // --rom-only: the ASM moved on purpose; the ROM below is what must hold.
      console.log(`\n  NOTE ${report}`);
    }
    if (expected.romSha256 && actual.romSha256 && expected.romSha256 !== actual.romSha256) {
      drifted.push(
        args.romOnly
          ? `${testCase.id}: ROM changed\n      expected ${expected.romSha256}\n      actual   ${actual.romSha256}\n      (--rom-only tolerates ASM edits, but this one reached the binary)`
          : `${testCase.id}: ROM changed despite identical ASM (non-deterministic assembly?)`
      );
    }
  }

  if (failures.length > 0 || drifted.length > 0) {
    console.error('\nFAIL: generator output is not byte-identical to the baseline.\n');
    for (const failure of failures) console.error(`  - ${failure}`);
    for (const item of drifted) console.error(`  - ${item}`);
    console.error('\nIf the change is intentional, review the diff and re-record the baseline.');
    return 1;
  }

  console.log(`\nOK: ${Object.keys(results).length} cases byte-identical to the baseline recorded ${baseline.recordedAt}.`);
  return 0;
}

// require() from an ESM module.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

try {
  process.exit(main());
} catch (error) {
  console.error(`\nERROR: ${error.message}`);
  process.exit(1);
}

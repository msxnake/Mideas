#!/usr/bin/env node
/**
 * "BEFORE" references for the task "move the SCREEN 5 transition engine (bitmap_tfx_*) to a bank"
 * (docs/msx/MSX2_TFX_BANK_PLAN.md, phase F0).
 *
 * The tree has uncommitted Transition FX work, so a worktree of HEAD is NOT a valid reference: the
 * reference is the working tree as it is NOW, recorded with a manifest that pins exactly what was built
 * (HEAD, sha256 of `git diff HEAD --binary`, sha256 of every source file in the generator's tsc closure,
 * glass.jar, fixtures) and exactly how (one command per artefact).
 *
 * USAGE (one command regenerates everything from scratch in about 1-2 minutes; the test719 cases need ~8 GB of RAM):
 *
 *   node scripts/build_tfx_bank_reference.mjs                       -> test/msx2-transition-fx/out/tfxbank_ref/
 *   node scripts/build_tfx_bank_reference.mjs --out test/msx2-transition-fx/out/tfxbank_new --label after
 *                                                                   -> same set of artefacts for the AFTER tree
 *
 *   --out DIR            output directory (default test/msx2-transition-fx/out/tfxbank_ref; gitignored)
 *   --label NAME         free text stored in the manifest ("before" by default)
 *   --only ID,GROUP,...  rebuild only those cases (ids such as A_diagonal, T719_wipe or groups A B C D T719 small);
 *                        merges into the existing manifest; genbaseline and determinism are skipped unless asked
 *   --list               print the case table and exit
 *   --genbaseline        run the genbaseline snapshot step (default on for a full run)
 *   --no-genbaseline     skip it (the harness takes ~15 s)
 *   --banked             the tree AFTER the engine moved to a bank (docs/msx/MSX2_TFX_BANK_PLAN.md): test719 is expected to compile with
 *                        1.072 B free for EVERY engine variant (diagonal and iris included), and the probe follows the new symbols
 *                        (bitmap_tfx_frame_wait / bitmap_tfxb_hmmv). Use it with --out ...tfxbank_new --label after.
 *   --no-determinism     skip the rebuild-and-compare of two artefacts (default on for a full run)
 *   --probe / --no-probe boot every small case (A-D) that has the engine in OpenMSX (-romtype KonamiSCC; $OPENMSX_EXE
 *                        overrides the executable) and record, per ROM, that bitmap_tfx_play is really reached, from which
 *                        call site, how many frame waits / HMMV / music_update calls happen inside it and that it returns
 *                        (an instrument check: a case that never runs the engine proves nothing). Default on for a full run
 *                        when OpenMSX is installed (~1 s per ROM); evidence goes to <out>/probe/ and into the manifest.
 *   --test719 PATH       location of test719.json (default C:/Users/salam/Downloads/test719.json, or $TEST719_JSON)
 *   --keep-asm-max N     keep the .asm of a case only when it is <= N bytes (default 2000000)
 *   --build DIR          tsc build directory of the generator (default server/temp/tsbuild_tfxbank_<label>)
 *   --reuse-build        reuse the tsc build already in that directory (UNSAFE if the sources changed)
 *   --compare A B        print the artefact-by-artefact comparison of two output directories (or their manifest.json) and exit
 *   --allow-tsc-errors   continue when tsc exits non-zero
 *
 * WHAT IT WRITES (all under --out):
 *   cases/<id>.{asm,rom,sym}        small cases A-D (+ the control cases)
 *   test719/<id>.{asm,rom,sym}      test719 variants (their ASM is ~1.4 MB; kept while <= --keep-asm-max)
 *   probe/<id>.{tcl,txt}            the OpenMSX reach probe of each small case and what it printed
 *   test719/<id>.error.txt          the glass message of a variant that does not fit (diagonal and iris today)
 *   genbaseline/current/*.asm       copy of server/temp/genbaseline/current after `check_generator_output_identical.mjs --rom`
 *   genbaseline/genbaseline.log     its log (asm/rom sha prefixes per case) + genbaseline.json (parsed)
 *   generator_sources.txt           "path<TAB>sha256" of every file tsc compiles for utils/msxGenerator/index.ts
 *   manifest.json                   written after EVERY case, so an interrupted run keeps what was done
 *
 * Fixtures come from scripts/build_tfx_bank_parity_fixtures.mjs: versioned JSON mutated in memory, never saved
 * (test719 is parsed per case inside a fresh `node --max-old-space-size=8192` child; nothing of it is copied).
 * Every case is generated in its own child process, so the output cannot depend on the order of the cases or
 * on state left over by a previous one. The generator is the tsc build (same flags as
 * scripts/measure_bitmap_rom_budget.mjs and check_generator_output_identical.mjs) with the same config as the
 * budget script: { romMode: 'megarom', targetFormat: 'konami', autoMegaROM: true }.
 *
 * FREE BYTES = trailing #FF of the resident window #4000-#BFFF (ROM file offsets 0-#7FFF), the figure of
 * measure_bitmap_rom_budget.mjs. "Does not fit" = glass `Negative initial size: -N` (N bytes missing).
 *
 * Comparing BEFORE and AFTER: run this script twice with different --out, then compare manifest.json
 * artefact by artefact (rom.sha256, sym.sha256, asm.sha256, residentFree). Exit code 0 means the run
 * completed and every acceptance check held; 1 means a case did not behave as its definition promises.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { CASES, FIXTURE_PATHS, buildCase, findCase } from './build_tfx_bank_parity_fixtures.mjs';

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), '..');
const require = createRequire(import.meta.url);
const GLASS_JAR = path.join(ROOT, 'server', 'glass.jar');
const RESIDENT_BYTES = 0x8000;

/** Free resident bytes the plan quotes for test719 (section 1); `null` = does not fit, with the bytes missing. */
const EXPECTED_T719 = {
  T719_bridged: { free: 1120 }, T719_cls: { free: 1109 }, T719_fade_to_black: { free: 1068 },
  T719_vertical: { free: 382 }, T719_horizontal: { free: 437 }, T719_mirror: { free: 418 },
  T719_blinds: { free: 662 }, T719_pattern: { free: 622 }, T719_wipe: { free: 542 },
  T719_diagonal: { missing: 223 }, T719_iris: { missing: 1250 },
};
/**
 * Same table for a run of the tree AFTER the engine moved to a bank (`--banked`): every variant that carries the engine leaves the same
 * free bytes (the resident part is the two trampolines + the call/wait glue, whatever the effect), diagonal and iris included.
 * cls / fade_to_black use the old routines without the engine and the bridged variant has no node: unchanged.
 */
const EXPECTED_T719_BANKED = {
  T719_bridged: { free: 1120 }, T719_cls: { free: 1109 }, T719_fade_to_black: { free: 1068 },
  T719_vertical: { free: 1072 }, T719_horizontal: { free: 1072 }, T719_mirror: { free: 1072 },
  T719_blinds: { free: 1072 }, T719_pattern: { free: 1072 }, T719_wipe: { free: 1072 },
  T719_diagonal: { free: 1072 }, T719_iris: { free: 1072 },
};
const DETERMINISM_PROBES = ['A_diagonal', 'T719_wipe'];
const NOTES = [
  'bitmap_intro_test.json = the versioned test/msx2-bitmap-intro fixture: Start -> Screen5Presentation (intro) -> Transition (vertical wipe) -> WorldLink -> End. It is already the base of scripts/check_msx2_screen5_transitions.mjs (section 3) and of the genbaseline case bitmap-room-intro. Case A mutates its Transition node (A_control_legacy keeps it untouched, in MegaROM).',
  'Case C has 10 fill effects (the 8 test719 can hold today + diagonal + iris) and palette_fade_out. The plan text says "9 effects" (8 + iris): diagonal is added because it is the effect that motivated the task.',
  'Every effect case carries test719 node parameters (durationFrames 30, reverse true): that is what routes the legacy pixel wipes through the engine. T719_diagonal is test719 exactly as shipped; the other T719_* change only the effect field; T719_bridged removes the node (Music -> Intro).',
  'SCC coverage exists in the versioned tree (test/scc/scc_mideas_integration.json): B_scc_wipe and C_scc_wipe use it. There is no versioned PSG+SCC dual fixture in these cases.',
  'FREE = trailing #FF bytes of the resident window (ROM offsets 0-#7FFF = #4000-#BFFF), the figure of scripts/measure_bitmap_rom_budget.mjs. "does not fit" = glass "Negative initial size: -N" (N bytes missing); the message is kept in test719/<id>.error.txt.',
  'The ASM of the test719 variants is ~1.4 MB, below --keep-asm-max (2 MB), so it IS kept next to the ROM (the plan assumed >2 MB).',
  'git diff HEAD does not see untracked files and the generator imports two of them (see generatorSources.untrackedInClosure): generatorSources.sha256 (the tsc closure) is the identity of the generator source, git.diffHeadBinarySha256 is the one the plan asked for.',
  'genbaseline exit code 1 is expected today: 5 bitmap-room cases differ from the checked-in test/generator-baseline/baseline.json only by the @mideas-ram-budget comment line (stale since September). baseline.json is not touched; genbaseline/current/*.asm and the ROM sha prefixes of genbaseline.log are the BEFORE snapshot.',
  'The OpenMSX probe covers the small cases only; test719 variants are not booted (their presentation waits for a key). Probe = bitmap_tfx_play is reached, from which call site, frame waits / HMMV / music_update calls inside it, and that it returns.',
];
const KEY_SYMBOLS = [
  'bitmap_tfx_play', 'bitmap_tfx_play_wait', 'bitmap_tfx_hmmv', 'bitmap_tfx_wait_ce', 'bitmap_tfx_rect_tiles', 'bitmap_tfx_world_palette_ptr',
  'bitmap_flow_wait_vblank', 'bitmap_wait_vblank', 'music_update', 'run_bitmap_intro', 'bitmap_room_restore_resident_banks',
  'bitmap_displayed_page', 'bitmap_gameflow_exit_flag', 'init_rom', 'mapper_set_bank_p2', 'mapper_bank_p2_current',
];

// ---------------------------------------------------------------------------
// small utilities
// ---------------------------------------------------------------------------

const sha256 = data => createHash('sha256').update(data).digest('hex');
const sha256File = file => {
  const hash = createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.alloc(1 << 20);
  try {
    for (let n; (n = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0;) hash.update(buffer.subarray(0, n));
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
};
const rel = file => path.relative(ROOT, file).replace(/\\/g, '/');
const fileEntry = file => ({ path: rel(file), bytes: fs.statSync(file).size, sha256: sha256File(file) });
const writeJsonAtomic = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, file);
};

function parseArgs(argv) {
  const args = {
    out: path.join(ROOT, 'test', 'msx2-transition-fx', 'out', 'tfxbank_ref'), label: 'before', only: null, list: false,
    genbaseline: null, determinism: null, probe: null, test719: null, keepAsmMax: 2_000_000, reuseBuild: false, allowTscErrors: false,
    worker: null, build: null, banked: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => { if (i + 1 >= argv.length) throw new Error(`${arg} needs a value`); return argv[++i]; };
    if (arg === '--out') args.out = path.resolve(ROOT, value());
    else if (arg === '--label') args.label = value();
    else if (arg === '--banked') args.banked = true;
    else if (arg === '--only') args.only = value().split(',').map(item => item.trim()).filter(Boolean);
    else if (arg === '--list') args.list = true;
    else if (arg === '--genbaseline') args.genbaseline = true;
    else if (arg === '--no-genbaseline') args.genbaseline = false;
    else if (arg === '--no-determinism') args.determinism = false;
    else if (arg === '--determinism') args.determinism = true;
    else if (arg === '--probe') args.probe = true;
    else if (arg === '--no-probe') args.probe = false;
    else if (arg === '--test719') args.test719 = value();
    else if (arg === '--keep-asm-max') args.keepAsmMax = Number(value());
    else if (arg === '--reuse-build') args.reuseBuild = true;
    else if (arg === '--allow-tsc-errors') args.allowTscErrors = true;
    else if (arg === '--compare') { args.compare = [value(), value()]; }
    else if (arg === '--worker') args.worker = value();
    else if (arg === '--build') args.build = path.resolve(ROOT, value());
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`unknown argument ${arg} (see the header of scripts/build_tfx_bank_reference.mjs)`);
  }
  return args;
}

const trailingFF = (buffer, from, to) => { let n = 0; for (let i = to - 1; i >= from && buffer[i] === 0xff; i--) n++; return n; };

function readSymbols(file) {
  const table = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([^:\s]+):\s*equ\s+([0-9A-Fa-f]+)H/i);
    if (match) table.set(match[1], parseInt(match[2], 16));
  }
  return table;
}

// ---------------------------------------------------------------------------
// worker: ONE case, in this (fresh) process
// ---------------------------------------------------------------------------

function runWorker(args) {
  const id = args.worker;
  const built = buildCase(id);
  const { def, name, config } = built;
  const generator = require(path.join(args.build, 'utils', 'msxGenerator', 'index.js'));
  const workDir = path.join(args.out, 'work');
  fs.mkdirSync(workDir, { recursive: true });
  const finalDir = path.join(args.out, def.kind === 'test719' ? 'test719' : 'cases');
  fs.mkdirSync(finalDir, { recursive: true });
  const result = { id, group: def.group, status: 'pending', romMode: def.romMode, expectsTfx: def.expectsTfx, generatorWarnings: 0 };

  const realLog = console.log;
  const realWarn = console.warn;
  console.log = () => {};
  console.warn = () => { result.generatorWarnings++; };
  let asm;
  try {
    const files = generator.generateModularASM(name, built.project.assets, config);
    asm = (files['unitedFiles.asm'] || files['main.asm'] || '').replace(/\r\n/g, '\n');
    if (!asm) throw new Error(`generator returned no unified ASM (files: ${Object.keys(files).join(', ')})`);
  } catch (error) {
    result.status = 'generator-failed';
    result.error = String(error?.stack || error).split('\n').slice(0, 8).join('\n');
    return result;
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
  built.project = null;

  const asmPath = path.join(workDir, `${id}.asm`);
  const romPath = path.join(workDir, `${id}.rom`);
  const symPath = path.join(workDir, `${id}.sym`);
  fs.writeFileSync(asmPath, asm);
  result.asm = { bytes: Buffer.byteLength(asm), sha256: sha256(asm) };
  result.tfx = {
    engineEmitted: /^bitmap_tfx_play:/m.test(asm),
    playCalls: (asm.match(/^\s+call bitmap_tfx_play\b/gm) || []).length,
    fillTables: (asm.match(/^bitmap_tfx_table_\d+:/gm) || []).length,
    paletteEngineEmitted: /^bitmap_tfx_pal_lerp:/m.test(asm),
  };
  result.musicDriver = /^SCC_Init:/m.test(asm) ? 'scc' : /^pt3_/im.test(asm) ? 'pt3' : /^music_update:/m.test(asm) ? 'other' : 'none';

  const glass = spawnSync('java', ['-jar', GLASS_JAR, '-I', path.join(ROOT, 'server'), asmPath, romPath, symPath],
    { cwd: ROOT, maxBuffer: 1 << 28, encoding: 'utf8' });
  const glassText = `${glass.stdout || ''}${glass.stderr || ''}`.trim();
  if (glass.status !== 0 || !fs.existsSync(romPath)) {
    result.status = 'glass-failed';
    result.error = glassText.split('\n').slice(0, 8).join('\n');
    const overflow = /Negative initial size:\s*(-?\d+)/.exec(glassText);
    if (overflow) result.missingBytes = Math.abs(Number(overflow[1]));
    fs.writeFileSync(path.join(finalDir, `${id}.error.txt`), `${glassText.split('\n').slice(0, 8).join('\n')}\n`);
    result.errorFile = rel(path.join(finalDir, `${id}.error.txt`));
  } else {
    result.status = 'ok';
    const rom = fs.readFileSync(romPath);
    result.romBytes = rom.length;
    result.residentFree = trailingFF(rom, 0, RESIDENT_BYTES);
    const symbols = readSymbols(symPath);
    result.symbols = Object.fromEntries(KEY_SYMBOLS.filter(key => symbols.has(key)).map(key => [key, `#${symbols.get(key).toString(16).toUpperCase()}`]));
    result.tfx.tableAddresses = [...symbols.entries()].filter(([key]) => /^bitmap_tfx_table_\d+$/.test(key)).map(([key, value]) => `${key}=#${value.toString(16).toUpperCase()}`);
    fs.copyFileSync(romPath, path.join(finalDir, `${id}.rom`));
    fs.copyFileSync(symPath, path.join(finalDir, `${id}.sym`));
    result.rom = fileEntry(path.join(finalDir, `${id}.rom`));
    result.sym = fileEntry(path.join(finalDir, `${id}.sym`));
  }
  if (result.asm.bytes <= args.keepAsmMax) {
    fs.copyFileSync(asmPath, path.join(finalDir, `${id}.asm`));
    result.asm.path = rel(path.join(finalDir, `${id}.asm`));
  }
  for (const file of [asmPath, romPath, symPath]) fs.rmSync(file, { force: true });
  return result;
}

// ---------------------------------------------------------------------------
// orchestrator pieces
// ---------------------------------------------------------------------------

function gitBuffer(args) {
  const proc = spawnSync('git', args, { cwd: ROOT, maxBuffer: 1 << 30 });
  if (proc.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${String(proc.stderr).slice(0, 300)}`);
  return proc.stdout;
}
const gitText = args => gitBuffer(args).toString('utf8').trim();

function gitSnapshot() {
  const diffExcluding = excludes => sha256(gitBuffer(['diff', 'HEAD', '--binary', '--', '.', ...excludes.map(item => `:(exclude)${item}`)]));
  const base = ['node_modules', 'dist'];
  return {
    // The two figures the task asks for / the robust one (tracked build output under server/temp is rewritten by other tools).
    diffHeadBinarySha256: diffExcluding(base),
    diffHeadBinarySha256ExcludingServerTemp: diffExcluding([...base, 'server/temp']),
  };
}

function summariseStatus() {
  const lines = gitBuffer(['status', '--short']).toString('utf8').split('\n').filter(Boolean);
  const noise = /^(.. )"?(node_modules\/|dist\/|server\/temp\/)/;
  const byCode = {};
  const modified = [], deleted = [], untracked = [];
  let noiseCount = 0;
  for (const line of lines) {
    const code = line.slice(0, 2);
    byCode[code] = (byCode[code] || 0) + 1;
    if (noise.test(line)) { noiseCount++; continue; }
    const file = line.slice(3);
    if (code === '??') untracked.push(file);
    else if (code.includes('D')) deleted.push(file);
    else modified.push(`${code.trim()} ${file}`);
  }
  return { totalEntries: lines.length, byCode, entriesInNodeModulesDistServerTemp: noiseCount, modifiedTracked: modified, deletedTracked: deleted, untracked };
}

const TSC_FLAGS = ['--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020', '--moduleResolution', 'node', '--skipLibCheck', '--noEmitOnError', 'false'];
const tscBin = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

function buildGenerator(buildDir, args) {
  const compiled = path.join(buildDir, 'utils', 'msxGenerator', 'index.js');
  if (args.reuseBuild && fs.existsSync(compiled)) {
    return { reused: true, exitCode: null, errors: null };
  }
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.mkdirSync(buildDir, { recursive: true });
  const proc = spawnSync(process.execPath, [tscBin, ...TSC_FLAGS, '--outDir', buildDir, 'utils/msxGenerator/index.ts'], { cwd: ROOT, maxBuffer: 1 << 28, encoding: 'utf8' });
  const output = `${proc.stdout || ''}${proc.stderr || ''}`.trim();
  if (proc.status !== 0 && !args.allowTscErrors) {
    throw new Error(`tsc exited ${proc.status}; the build cannot be trusted as a reference:\n${output.slice(0, 2000)}\n(--allow-tsc-errors to continue)`);
  }
  if (!fs.existsSync(compiled)) throw new Error(`tsc produced no output at ${rel(compiled)}`);
  fs.writeFileSync(path.join(buildDir, 'package.json'), '{"type":"commonjs"}');
  return { reused: false, exitCode: proc.status, errors: output ? output.split('\n').length : 0 };
}

function sourceFingerprint(outDir) {
  const proc = spawnSync(process.execPath, [tscBin, ...TSC_FLAGS, '--listFilesOnly', '--noEmit', 'utils/msxGenerator/index.ts'], { cwd: ROOT, maxBuffer: 1 << 28, encoding: 'utf8' });
  const files = proc.stdout.split('\n').map(line => line.trim()).filter(line => line && !/node_modules/.test(line) && fs.existsSync(line)).map(line => path.resolve(line));
  const entries = files.map(file => `${rel(file)}\t${sha256File(file)}`).sort();
  const untrackedAll = new Set(gitText(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean));
  const changedTracked = new Set(gitText(['diff', 'HEAD', '--name-only']).split('\n').filter(Boolean));
  const inClosure = entries.map(line => line.split('\t')[0]);
  fs.writeFileSync(path.join(outDir, 'generator_sources.txt'), `${entries.join('\n')}\n`);
  return {
    files: entries.length,
    sha256: sha256(entries.join('\n')),
    untrackedInClosure: inClosure.filter(file => untrackedAll.has(file)),
    modifiedVsHeadInClosure: inClosure.filter(file => changedTracked.has(file)),
    listing: rel(path.join(outDir, 'generator_sources.txt')),
  };
}

function spawnCase(id, args, buildDir) {
  const def = findCase(id);
  const nodeArgs = def.kind === 'test719' ? ['--max-old-space-size=8192'] : [];
  const argv = [...nodeArgs, SELF, '--worker', id, '--out', args.out, '--build', buildDir, '--keep-asm-max', String(args.keepAsmMax)];
  if (args.test719) argv.push('--test719', args.test719);
  const started = Date.now();
  const proc = spawnSync(process.execPath, argv, { cwd: ROOT, maxBuffer: 1 << 28, encoding: 'utf8', env: { ...process.env, ...(args.test719 ? { TEST719_JSON: args.test719 } : {}) } });
  const line = (proc.stdout || '').split('\n').find(item => item.startsWith('@@RESULT '));
  if (!line) {
    return { id, status: 'worker-crashed', exitCode: proc.status, error: `${proc.stdout || ''}${proc.stderr || ''}`.slice(-1500), seconds: (Date.now() - started) / 1000 };
  }
  const result = JSON.parse(line.slice('@@RESULT '.length));
  result.seconds = Math.round((Date.now() - started) / 100) / 10;
  const outRel = rel(args.out);
  result.command = {
    generate: `node ${nodeArgs.join(' ')} scripts/build_tfx_bank_reference.mjs --worker ${id} --out ${outRel} --build ${rel(buildDir)}`.replace('node  ', 'node '),
    glass: `java -jar server/glass.jar -I server <${id}.asm> <${id}.rom> <${id}.sym>`,
    reproduce: `node scripts/build_tfx_bank_reference.mjs --only ${id} --out ${outRel}`,
  };
  const def2 = findCase(id);
  result.blurb = def2.blurb;
  return result;
}

function runGenbaseline(outDir, log) {
  const current = path.join(ROOT, 'server', 'temp', 'genbaseline', 'current');
  fs.rmSync(current, { recursive: true, force: true });
  const command = 'node scripts/check_generator_output_identical.mjs --rom';
  log(`genbaseline: ${command} (no --record; test/generator-baseline/baseline.json is not touched)`);
  const baselineBefore = sha256File(path.join(ROOT, 'test', 'generator-baseline', 'baseline.json'));
  const started = Date.now();
  const proc = spawnSync(process.execPath, ['scripts/check_generator_output_identical.mjs', '--rom'], { cwd: ROOT, maxBuffer: 1 << 28, encoding: 'utf8', timeout: 3_600_000 });
  const text = `${proc.stdout || ''}${proc.stderr || ''}`;
  const dir = path.join(outDir, 'genbaseline');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'genbaseline.log'), text);
  if (fs.existsSync(current)) fs.cpSync(current, path.join(dir, 'current'), { recursive: true });
  const cases = {};
  for (const line of text.split('\n')) {
    const match = line.match(/^\s+(\S+)\s+([0-9a-f]{12})\s+(\d+) bytes(?:\s+rom ([0-9a-f]{12}))?\s*$/);
    if (match) cases[match[1]] = { asmSha12: match[2], asmBytes: Number(match[3]), romSha12: match[4] || null };
  }
  const snapshots = {};
  const snapshotDir = path.join(dir, 'current');
  if (fs.existsSync(snapshotDir)) for (const file of fs.readdirSync(snapshotDir).sort()) snapshots[file] = sha256File(path.join(snapshotDir, file));
  const failures = [...text.matchAll(/^\s+- ([A-Za-z0-9_-]+): /gm)].map(match => match[1]);
  const summary = {
    command, exitCode: proc.status, seconds: Math.round((Date.now() - started) / 1000),
    redCases: [...new Set(failures)], cases, asmSnapshotSha256: snapshots,
    baselineJsonUntouched: sha256File(path.join(ROOT, 'test', 'generator-baseline', 'baseline.json')) === baselineBefore,
    note: 'Exit code 1 is expected today: the checked-in baseline.json is stale for the red cases (@mideas-ram-budget line, September). Only the snapshots/ROM prefixes matter for before/after.',
    log: rel(path.join(dir, 'genbaseline.log')),
  };
  writeJsonAtomic(path.join(dir, 'genbaseline.json'), summary);
  return summary;
}

// ---------------------------------------------------------------------------
// OpenMSX reach probe (instrument check): does the case really run the engine, and from where?
// ---------------------------------------------------------------------------

const OPENMSX = process.env.OPENMSX_EXE || 'C:/Program Files/openMSX/openmsx.exe';
const hex4 = value => `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;
const slashes = file => file.replace(/\\/g, '/');

function probeCase(id, artefact, outDir) {
  const def = findCase(id);
  const probeDir = path.join(outDir, 'probe');
  fs.mkdirSync(probeDir, { recursive: true });
  const symbols = readSymbols(path.join(ROOT, artefact.sym.path));
  const need = name => { if (!symbols.has(name)) throw new Error(`${id}: symbol ${name} missing`); return hex4(symbols.get(name)); };
  const resultFile = path.join(probeDir, `${id}.txt`);
  const tclPath = path.join(probeDir, `${id}.tcl`);
  const musicAddr = symbols.has('music_update') ? hex4(symbols.get('music_update')) : null;
  const dispatcher = def.group === 'D';
  const lines = [
    `# generated by scripts/build_tfx_bank_reference.mjs --probe (${id})`,
    `set result [open "${slashes(resultFile)}" w]`,
    'set throttle off',
    'proc note {msg} { global result; puts $result $msg; flush $result }',
    'set hits 0',
    'set returned 0',
    'set in_play 0',
    'set waits 0',
    'set hmmv 0',
    'set music 0',
    'set finished 0',
    `debug set_bp ${need('bitmap_tfx_play')} {} {`,
    '  if {$::hits == 0} {',
    '    set ::in_play 1',
    '    set ::t_play [machine_info time]',
    '    set ::caller [peek16 [reg SP]]',
    '    set ::play_hl [reg HL]',
    '    set ::play_de [reg DE]',
    '    debug set_bp $::caller {} { if {!$::returned} { set ::returned 1; set ::in_play 0; note [format "RETURN_AFTER %.3f" [expr {[machine_info time] - $::t_play}]]; after time 1.5 finish } }',
    '  }',
    '  incr ::hits',
    '}',
    // BEFORE ROMs wait at bitmap_tfx_play_wait and launch from bitmap_tfx_hmmv; AFTER ROMs (engine in a bank, `--banked`) wait through the
    // resident bitmap_tfx_frame_wait and launch from the banked copy bitmap_tfxb_hmmv.
    `debug set_bp ${need(symbols.has('bitmap_tfx_play_wait') ? 'bitmap_tfx_play_wait' : 'bitmap_tfx_frame_wait')} {} { if {$::in_play} { incr ::waits } }`,
    `debug set_bp ${need(symbols.has('bitmap_tfxb_hmmv') ? 'bitmap_tfxb_hmmv' : 'bitmap_tfx_hmmv')} {} { if {$::in_play} { incr ::hmmv } }`,
    ...(musicAddr ? [`debug set_bp ${musicAddr} {} { if {$::in_play} { incr ::music } }`] : []),
    'proc finish {} {',
    '  global finished hits returned waits hmmv music caller play_hl play_de',
    '  if {$finished} { return }',
    '  set finished 1',
    '  note "PLAY_HITS $hits"',
    '  note "RETURNED $returned"',
    '  note "WAIT_ITERATIONS $waits"',
    '  note "HMMV_CALLS $hmmv"',
    '  note "MUSIC_UPDATES_INSIDE_PLAY $music"',
    '  if {$hits > 0} { note [format "CALLER 0x%04X" $caller]; note [format "HL 0x%04X" $play_hl]; note [format "DE 0x%04X" $play_de] }',
    '  note "RESULT DONE"',
    '  close $::result',
    '  exit',
    '}',
    ...(dispatcher ? [
      '# leave the game the way the Exit World tile does: keep raising the GameFlow exit flag until the transition runs',
      `proc raise_exit {} { if {$::hits == 0 && !$::finished} { debug write memory ${need('bitmap_gameflow_exit_flag')} 1; after time 1 raise_exit } }`,
      'after time 6 raise_exit',
    ] : []),
    'after time 90 { note "TIMEOUT 90s emulated"; finish }',
  ];
  fs.writeFileSync(tclPath, `${lines.join('\n')}\n`);
  fs.rmSync(resultFile, { force: true });
  const romArgs = ['-cart', slashes(path.join(ROOT, artefact.rom.path)), ...(def.romMode === 'megarom' ? ['-romtype', 'KonamiSCC'] : [])];
  const started = Date.now();
  const proc = spawnSync(OPENMSX, ['-machine', 'C-BIOS_MSX2+_JP', ...romArgs, '-script', slashes(tclPath)], { cwd: ROOT, timeout: 180000, stdio: 'pipe' });
  const text = fs.existsSync(resultFile) ? fs.readFileSync(resultFile, 'utf8') : '';
  const field = key => { const match = new RegExp(`^${key} (\\S+)`, 'm').exec(text); return match ? match[1] : null; };
  const caller = field('CALLER') ? parseInt(field('CALLER'), 16) : null;
  let callerLabel = null;
  if (caller !== null) {
    const below = [...symbols.entries()].filter(([, address]) => address >= 0x4000 && address <= caller).sort((a, b) => b[1] - a[1]);
    callerLabel = below.length ? `${below[0][0]}+${caller - below[0][1]}` : null;
  }
  return {
    ran: /RESULT DONE/.test(text), exitCode: proc.status, wallSeconds: Math.round((Date.now() - started) / 100) / 10,
    playHits: Number(field('PLAY_HITS')), returned: field('RETURNED') === '1', waitIterations: Number(field('WAIT_ITERATIONS')),
    hmmvCalls: Number(field('HMMV_CALLS')), musicUpdatesInsidePlay: Number(field('MUSIC_UPDATES_INSIDE_PLAY')),
    callerAddress: field('CALLER'), callerNearestLabel: callerLabel, hl: field('HL'), de: field('DE'),
    timedOut: /TIMEOUT/.test(text), evidence: rel(resultFile),
  };
}

// ---------------------------------------------------------------------------
// --compare: BEFORE vs AFTER, artefact by artefact
// ---------------------------------------------------------------------------

function compareManifests(left, right) {
  const load = target => JSON.parse(fs.readFileSync(fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, 'manifest.json') : target, 'utf8'));
  const a = load(path.resolve(ROOT, left));
  const b = load(path.resolve(ROOT, right));
  console.log(`BEFORE "${a.label}" (generator sources ${a.generatorSources?.sha256.slice(0, 12)})  vs  AFTER "${b.label}" (${b.generatorSources?.sha256.slice(0, 12)})`);
  console.log(`${'id'.padEnd(22)} ${'asm'.padEnd(10)} ${'rom'.padEnd(10)} ${'sym'.padEnd(10)} free before -> after`);
  const ids = [...new Set([...Object.keys(a.artifacts), ...Object.keys(b.artifacts)])];
  const verdict = (x, y) => (x === undefined && y === undefined ? '-' : x === y ? 'same' : 'DIFFERENT');
  for (const id of ids) {
    const x = a.artifacts[id] || {};
    const y = b.artifacts[id] || {};
    const free = x.status === 'ok' || y.status === 'ok' ? `${x.residentFree ?? x.status} -> ${y.residentFree ?? y.status}` : `${x.status} -> ${y.status}`;
    console.log(`${id.padEnd(22)} ${verdict(x.asm?.sha256, y.asm?.sha256).padEnd(10)} ${verdict(x.rom?.sha256, y.rom?.sha256).padEnd(10)} ${verdict(x.sym?.sha256, y.sym?.sha256).padEnd(10)} ${free}`);
  }
  if (a.genbaseline && b.genbaseline) {
    console.log(`genbaseline: ASM snapshots ${JSON.stringify(a.genbaseline.asmSnapshotSha256) === JSON.stringify(b.genbaseline.asmSnapshotSha256) ? 'same' : 'DIFFERENT'}, ROM sha prefixes ${JSON.stringify(Object.fromEntries(Object.entries(a.genbaseline.cases).map(([k, v]) => [k, v.romSha12]))) === JSON.stringify(Object.fromEntries(Object.entries(b.genbaseline.cases).map(([k, v]) => [k, v.romSha12]))) ? 'same' : 'DIFFERENT'}`);
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(fs.readFileSync(SELF, 'utf8').split('*/')[0]); return 0; }
  if (args.worker) {
    if (args.test719) FIXTURE_PATHS.test719 = args.test719;
    process.stdout.write(`@@RESULT ${JSON.stringify(runWorker(args))}\n`);
    return 0;
  }
  if (args.compare) { compareManifests(...args.compare); return 0; }
  if (args.list) {
    for (const item of CASES) console.log(`${item.id.padEnd(22)} ${item.group.padEnd(5)} ${item.romMode.padEnd(9)} tfx=${item.expectsTfx ? 'yes' : 'no '}  ${item.blurb}`);
    return 0;
  }
  if (args.test719) FIXTURE_PATHS.test719 = args.test719;

  const full = !args.only;
  const runGenbase = args.genbaseline ?? full;
  const runDeterminism = args.determinism ?? full;
  const runProbe = (args.probe ?? full) && fs.existsSync(OPENMSX);
  if ((args.probe ?? full) && !runProbe) console.warn(`OpenMSX not found at ${OPENMSX} (set OPENMSX_EXE): the reach probe is skipped.`);
  const selected = !args.only ? CASES : CASES.filter(item => args.only.includes(item.id) || args.only.includes(item.group) || (args.only.includes('small') && item.kind === 'small'));
  if (selected.length === 0) throw new Error(`--only ${args.only.join(',')} matches no case (see --list)`);
  const missing719 = selected.some(item => item.kind === 'test719') && !fs.existsSync(FIXTURE_PATHS.test719);
  if (missing719) throw new Error(`test719 not found at ${FIXTURE_PATHS.test719} (use --test719 PATH or $TEST719_JSON)`);

  fs.mkdirSync(args.out, { recursive: true });
  const logPath = path.join(args.out, 'build.log');
  const log = message => { const line = `[${new Date().toISOString()}] ${message}`; console.log(line); fs.appendFileSync(logPath, `${line}\n`); };
  const manifestPath = path.join(args.out, 'manifest.json');
  const existing = !full && fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
  const manifest = existing || { schema: 1, label: args.label, artifacts: {} };
  manifest.label = args.label;
  manifest.status = 'running';
  manifest.startedAt = manifest.startedAt || new Date().toISOString();
  manifest.commandLine = `node scripts/build_tfx_bank_reference.mjs ${process.argv.slice(2).join(' ')}`.trim();
  manifest.notes = NOTES;
  // Readable order: provenance first, per-artefact detail last.
  const FIRST_KEYS = ['schema', 'label', 'status', 'startedAt', 'finishedAt', 'commandLine', 'notes', 'problems', 'treeStableDuringRun', 'git', 'tools', 'inputs', 'tscBuild', 'generatorSources', 'budgetTest719', 'determinism', 'genbaseline'];
  const save = () => {
    const ordered = {};
    for (const key of FIRST_KEYS) if (key in manifest) ordered[key] = manifest[key];
    for (const key of Object.keys(manifest)) if (!(key in ordered) && key !== 'artifacts') ordered[key] = manifest[key];
    ordered.artifacts = manifest.artifacts;
    writeJsonAtomic(manifestPath, ordered);
  };

  // ---- what exactly is being built ----
  const startSnapshot = gitSnapshot();
  manifest.git = {
    head: gitText(['rev-parse', 'HEAD']),
    headSubject: gitText(['log', '-1', '--format=%s']),
    branch: gitText(['branch', '--show-current']),
    ...startSnapshot,
    note: 'git diff HEAD does not see untracked files: the generator sources that are untracked are pinned in generatorSources instead.',
    statusShort: summariseStatus(),
  };
  const java = spawnSync('java', ['-version'], { encoding: 'utf8' });
  manifest.tools = {
    node: process.version, java: `${java.stderr || java.stdout}`.split('\n')[0],
    tsc: JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', 'typescript', 'package.json'), 'utf8')).version,
    glassJarSha256: sha256File(GLASS_JAR),
    platform: `${process.platform} ${process.arch}`,
  };
  manifest.inputs = Object.fromEntries(Object.entries(FIXTURE_PATHS).map(([key, file]) => [key, fs.existsSync(file)
    ? { path: file.replace(/\\/g, '/'), bytes: fs.statSync(file).size, sha256: sha256File(file) }
    : { path: file.replace(/\\/g, '/'), missing: true }]));
  log(`reference "${args.label}": ${selected.length} case(s) -> ${rel(args.out)}; HEAD ${manifest.git.head.slice(0, 10)}, diff sha ${startSnapshot.diffHeadBinarySha256.slice(0, 12)}`);
  save();

  const buildDir = args.build || path.join(ROOT, 'server', 'temp', `tsbuild_tfxbank_${args.label.replace(/[^A-Za-z0-9_-]/g, '_')}`);
  log(`compiling the generator with tsc into ${rel(buildDir)} ...`);
  manifest.tscBuild = { dir: rel(buildDir), ...buildGenerator(buildDir, args) };
  manifest.generatorSources = sourceFingerprint(args.out);
  log(`generator closure: ${manifest.generatorSources.files} files, sha ${manifest.generatorSources.sha256.slice(0, 12)}; untracked in closure: ${manifest.generatorSources.untrackedInClosure.length}`);
  save();

  // ---- the cases ----
  const problems = [];
  for (const def of selected) {
    log(`build ${def.id} ...`);
    const result = spawnCase(def.id, { ...args }, buildDir);
    manifest.artifacts[def.id] = result;
    const line = result.status === 'ok'
      ? `ok  rom ${result.romBytes} B, resident free ${result.residentFree} B, ${result.seconds}s`
      : `${result.status}${result.missingBytes ? ` (missing ${result.missingBytes} B)` : ''} ${result.seconds}s`;
    log(`  ${def.id}: ${line}`);
    // instrument checks: the case must have the engine exactly when it promises to
    if (result.status === 'worker-crashed' || result.status === 'generator-failed') problems.push(`${def.id}: ${result.status}: ${String(result.error || '').split('\n')[0]}`);
    else if (result.tfx && result.tfx.engineEmitted !== def.expectsTfx) problems.push(`${def.id}: expected engine ${def.expectsTfx ? 'present' : 'absent'} in the ASM but it is ${result.tfx.engineEmitted ? 'present' : 'absent'}`);
    else if (def.expectsMusic && result.musicDriver !== def.expectsMusic) problems.push(`${def.id}: expected the ${def.expectsMusic} music runtime in the ASM but found ${result.musicDriver}`);
    else if (result.status === 'glass-failed' && !(args.banked ? EXPECTED_T719_BANKED : EXPECTED_T719)[def.id]?.missing) problems.push(`${def.id}: glass failed unexpectedly: ${String(result.error || '').split('\n')[0]}`);
    save();
  }
  fs.rmSync(path.join(args.out, 'work'), { recursive: true, force: true });

  // ---- instrument check in OpenMSX: the case must reach the engine from the call site it is meant for ----
  if (runProbe) {
    for (const def of selected.filter(item => item.kind === 'small' && item.expectsTfx && manifest.artifacts[item.id]?.status === 'ok')) {
      log(`probe ${def.id} in OpenMSX ...`);
      let probe;
      try { probe = probeCase(def.id, manifest.artifacts[def.id], args.out); } catch (error) { probe = { ran: false, error: String(error.message || error) }; }
      manifest.artifacts[def.id].probe = probe;
      probe.siteKind = /^(run_bitmap_intro|bitmap_intro)/.test(probe.callerNearestLabel || '') ? 'boot intro'
        : /^bitmap_gf_node_/.test(probe.callerNearestLabel || '') ? 'dispatcher' : 'UNKNOWN';
      const expectedSite = def.group === 'A' || def.group === 'B' ? 'boot intro' : 'dispatcher';
      log(`  ${def.id}: play hits ${probe.playHits}, returned ${probe.returned}, waits ${probe.waitIterations}, HMMV ${probe.hmmvCalls}, music_update inside ${probe.musicUpdatesInsidePlay}, caller ${probe.callerNearestLabel} (${probe.siteKind})`);
      if (!probe.ran || !(probe.playHits >= 1) || !probe.returned) problems.push(`${def.id}: OpenMSX never completed bitmap_tfx_play (hits ${probe.playHits}, returned ${probe.returned}, timedOut ${probe.timedOut})`);
      else if (probe.siteKind !== expectedSite) problems.push(`${def.id}: bitmap_tfx_play was called from ${probe.callerNearestLabel} (${probe.siteKind}) but the case is meant for the ${expectedSite} call site`);
      save();
    }
  }

  // ---- acceptance (b): free bytes of test719 against the plan ----
  const budgetRows = [];
  for (const [id, expected] of Object.entries(args.banked ? EXPECTED_T719_BANKED : EXPECTED_T719)) {
    const result = manifest.artifacts[id];
    if (!result) continue;
    const row = { id, expected: expected.free ?? `does not fit (-${expected.missing})`, measured: result.status === 'ok' ? result.residentFree : `does not fit (-${result.missingBytes ?? '?'})` };
    row.match = expected.free !== undefined ? result.status === 'ok' && result.residentFree === expected.free : result.status === 'glass-failed' && result.missingBytes === expected.missing;
    budgetRows.push(row);
    if (!row.match) problems.push(`${id}: free bytes ${row.measured} differ from the plan (${row.expected})`);
  }
  manifest.budgetTest719 = budgetRows;

  // ---- acceptance (c): determinism ----
  if (runDeterminism) {
    manifest.determinism = [];
    const probeArgs = { ...args, out: path.join(args.out, 'determinism') };
    for (const id of DETERMINISM_PROBES.filter(probe => manifest.artifacts[probe]?.status === 'ok')) {
      log(`determinism: rebuilding ${id} in a fresh process ...`);
      const again = spawnCase(id, probeArgs, buildDir);
      const first = manifest.artifacts[id];
      const row = {
        id, asmEqual: again.asm?.sha256 === first.asm?.sha256, romEqual: again.rom?.sha256 === first.rom?.sha256, symEqual: again.sym?.sha256 === first.sym?.sha256,
        firstRomSha256: first.rom?.sha256, secondRomSha256: again.rom?.sha256,
      };
      manifest.determinism.push(row);
      log(`  ${id}: asm ${row.asmEqual ? 'identical' : 'DIFFERENT'}, rom ${row.romEqual ? 'identical' : 'DIFFERENT'}, sym ${row.symEqual ? 'identical' : 'DIFFERENT'}`);
      if (!(row.asmEqual && row.romEqual && row.symEqual)) problems.push(`${id}: a second build in a fresh process differs (not deterministic)`);
      save();
    }
    if (manifest.determinism.every(row => row.asmEqual && row.romEqual && row.symEqual)) fs.rmSync(probeArgs.out, { recursive: true, force: true });
  }

  // ---- genbaseline snapshots ----
  if (runGenbase) {
    manifest.genbaseline = runGenbaseline(args.out, log);
    log(`genbaseline: exit ${manifest.genbaseline.exitCode}, ${Object.keys(manifest.genbaseline.cases).length} cases recorded, red: ${manifest.genbaseline.redCases.join(', ') || 'none'}`);
    save();
  }

  // ---- the tree must not have moved while we were building ----
  const endSnapshot = gitSnapshot();
  const sourcesAgain = sourceFingerprint(args.out);
  manifest.treeStableDuringRun = {
    diffHeadBinary: endSnapshot.diffHeadBinarySha256ExcludingServerTemp === startSnapshot.diffHeadBinarySha256ExcludingServerTemp,
    generatorSources: sourcesAgain.sha256 === manifest.generatorSources.sha256,
  };
  if (!manifest.treeStableDuringRun.diffHeadBinary || !manifest.treeStableDuringRun.generatorSources) problems.push('the working tree changed while the reference was being built: it does not describe one single state');

  manifest.finishedAt = new Date().toISOString();
  manifest.problems = problems;
  manifest.status = problems.length ? 'finished-with-problems' : 'complete';
  save();
  log(`${manifest.status}: ${Object.keys(manifest.artifacts).length} artefacts in manifest${problems.length ? `; PROBLEMS:\n  - ${problems.join('\n  - ')}` : ''}`);
  return problems.length ? 1 : 0;
}

// exitCode (not process.exit): a worker's result line goes to a pipe and has to be flushed first.
try {
  process.exitCode = main();
} catch (error) {
  console.error(`ERROR: ${error.stack || error.message}`);
  process.exitCode = 2;
}

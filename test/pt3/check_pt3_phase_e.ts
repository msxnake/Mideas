import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface ExpectedFrame {
  index: number;
  registers: number[];
  writeRegister13: boolean;
  noiseAddState: number;
}

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const outDir = resolve(process.cwd(), 'test', 'pt3', 'out');
const compareTrace = (label: string, expectedFile: string, actualFile: string): number => {
  const expected = JSON.parse(readFileSync(resolve(outDir, expectedFile), 'utf8')) as { frames: ExpectedFrame[] };
  const actualLines = readFileSync(resolve(outDir, actualFile), 'utf8').trim().split(/\r?\n/).filter(Boolean);
  assert(actualLines.length === expected.frames.length, `${label} OpenMSX frame count mismatch: expected ${expected.frames.length}, got ${actualLines.length}.`);

  let expectedR13Writes = 0;
  actualLines.forEach((line, index) => {
    const match = line.match(/^frame=(\d+) regs=([0-9,]+) r13writes=(\d+) noiseadd=(\d+)$/);
    assert(match, `${label} malformed OpenMSX trace line ${index}: ${line}`);
    const frameIndex = Number(match[1]);
    const registers = match[2].split(',').map(Number);
    const r13Writes = Number(match[3]);
    const noiseAdd = Number(match[4]);
    const wanted = expected.frames[index];
    if (wanted.writeRegister13) expectedR13Writes += 1;

    assert(frameIndex === wanted.index, `${label} frame index mismatch at ${index}: expected ${wanted.index}, got ${frameIndex}.`);
    assert(registers.length === 14, `${label} OpenMSX frame ${index} must expose R0..R13.`);
    for (let register = 0; register <= 12; register += 1) {
      assert(registers[register] === wanted.registers[register], `${label} frame ${index} R${register} mismatch: TS=${wanted.registers[register]} ASM=${registers[register]}.`);
    }
    if (wanted.writeRegister13) {
      assert(registers[13] === wanted.registers[13], `${label} frame ${index} R13 retrigger value mismatch.`);
    }
    assert(r13Writes === expectedR13Writes, `${label} frame ${index} R13 write policy mismatch: expected cumulative ${expectedR13Writes}, got ${r13Writes}.`);
    assert(noiseAdd === (wanted.noiseAddState & 0xff), `${label} frame ${index} persistent AddToNs mismatch: expected ${wanted.noiseAddState & 0xff}, got ${noiseAdd}.`);
  });
  return actualLines.length;
};

const realFrames = compareTrace('KUVO', 'phase_e_expected.json', 'phase_e_openmsx.txt');
const arbitrationFrames = compareTrace('arbitration', 'phase_e_global_expected.json', 'phase_e_global_openmsx.txt');
console.log(`PT3 phase E OpenMSX golden traces passed (${realFrames + arbitrationFrames} byte-exact AY frames).`);

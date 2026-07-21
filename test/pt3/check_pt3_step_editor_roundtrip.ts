import { PT3_FACTORY_INSTRUMENTS } from '../../utils/audio/pt3FactoryInstruments';
import {
  buildPT3SampleStep,
  decodePT3SampleStep,
  encodePT3SampleLogicalStep,
  toPT3SampleLogicalStep,
} from '../../components/utils/pt3SampleEngine';

let checked = 0;
let mismatches = 0;

for (const instrument of PT3_FACTORY_INSTRUMENTS) {
  const macro = (instrument as any).pt3Sample;
  if (!macro) continue;
  macro.steps.forEach((step: any, index: number) => {
    checked += 1;
    const logical = toPT3SampleLogicalStep(step);
    const raw = encodePT3SampleLogicalStep(logical);
    if (raw.join(',') !== step.raw.join(',')) {
      mismatches += 1;
      console.log(`${instrument.name} step ${index}: raw ${step.raw.join(',')} -> ${raw.join(',')}`);
    }
    const rebuilt = buildPT3SampleStep(logical) as any;
    for (const key of Object.keys(step)) {
      if (key === 'raw') continue;
      if (rebuilt[key] !== step[key]) {
        mismatches += 1;
        console.log(`${instrument.name} step ${index}: field ${key} ${step[key]} -> ${rebuilt[key]}`);
      }
    }
  });
}

// Exhaust the shared PT3 C byte. In particular, C bit 6 is observable through
// the 7-bit noise delta even when C bit 7 disables amplitude slide, so a visual
// no-op must retain it exactly (for example C=0x41).
for (let c = 0; c <= 0xff; c += 1) {
  const raw: [number, number, number, number] = [c, 0x00, 0x34, 0x12];
  const rebuiltRaw = encodePT3SampleLogicalStep(toPT3SampleLogicalStep(decodePT3SampleStep(raw)));
  checked += 1;
  if (rebuiltRaw.join(',') !== raw.join(',')) {
    mismatches += 1;
    console.log(`exhaustive C=${c}: raw ${raw.join(',')} -> ${rebuiltRaw.join(',')}`);
  }
}

console.log(`PT3 step-editor round-trip: ${checked} steps checked, ${mismatches} mismatches.`);
if (mismatches > 0 || checked === 0) process.exit(1);

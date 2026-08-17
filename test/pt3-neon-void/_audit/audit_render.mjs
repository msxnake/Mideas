#!/usr/bin/env node
/**
 * REPRODUCCION INDEPENDIENTE.
 * Motor de frames PT3 + emulacion AY-3-8910 escritos desde el replayer Z80
 * (server/PT3-ROM-alltables-glass.asm). No importa nada de components/utils/.
 *
 * El modulo auditado usa un subconjunto minimo (sin ornaments, sin envolvente,
 * sin efectos, sin deslizamientos), asi que el motor necesario es:
 *   periodo = NT_[nota] + offsetTonoDelSample (acumulado si bit6)
 *   amplitud = VT_[volCanal*16 + volSample]
 *   mixer  = bits 4 (tono off) y 7 (ruido off) del byte 1 del paso
 *   ruido  = Ns_Base(0) + offset del byte 0 del paso
 * Se AVISA si el modulo usa algo fuera de ese subconjunto.
 */
import { writeFileSync } from 'node:fs';
import { cargar, leerCabecera, leerPosiciones, decodificarCanal, leerSample, u16 } from './pt3_decode_independent.mjs';

const RELOJ_AY = 3579545 / 2;   // PSG del MSX
const FRAMES_POR_S = 50;
const MUESTREO = 44100;

// --- tabla de tonos 2 (T_NEW_2), con el redondeo del constructor del replayer ---
const BASE2 = [0x0D10, 0x0C55, 0x0BA4, 0x0AFC, 0x0A5F, 0x09CA, 0x093D, 0x08B8, 0x083B, 0x07C5, 0x0755, 0x06EC];
const NT = [];
for (let n = 0; n < 12; n += 1) { let v = BASE2[n] * 2; for (let o = 0; o < 8; o += 1) { v = (v >> 1) + (v & 1); NT[o * 12 + n] = v; } }

// --- tabla de volumenes VT_, emulando el bucle INITV1/INITV2 del replayer ---
const construirVT = () => {
  const VT = new Uint8Array(256);
  let hl = 0x0011, de = 0x0000, ix = 16;
  for (let b1 = 15; b1 >= 1; b1 -= 1) {
    const hlGuardado = hl;
    let r = hl + de; let carry = r > 0xffff; hl = r & 0xffff;         // add hl,de
    const nuevoDe = hl; hl = de; de = nuevoDe;                        // ex de,hl
    hl = carry ? 0xffff : 0x0000;                                     // sbc hl,hl
    for (let b = 16; b >= 1; b -= 1) {
      const l = hl & 0xff, h = (hl >> 8) & 0xff;
      const a = (h + ((l >> 7) & 1)) & 0xff;                          // ld a,l / rla / ld a,h / adc a,0
      VT[ix++] = a & 0x0f;
      r = hl + de; carry = r > 0xffff; hl = r & 0xffff;               // add hl,de
    }
    hl = hlGuardado;
    if ((de & 0xff) === 0x77) de = (de & 0xff00) | 0x78;              // cp #77 / inc e
  }
  return VT;
};
const VT = construirVT();

// --- motor ---
export const reproducir = (b, maxFrames = Infinity) => {
  const h = leerCabecera(b);
  const { lista } = leerPosiciones(b);
  const avisos = new Set();

  const canales = ['A', 'B', 'C'].map(() => ({
    filas: null, i: 0, note: 0, sonando: false, sample: null, posSample: 0,
    volCanal: 15, tnAcc: 0,
  }));

  // pre-decodificar todas las posiciones
  const porPosicion = lista.map((posByte) => {
    const e = h.ptrPatrones + posByte * 2;
    return ['A', 'B', 'C'].map((_, k) => decodificarCanal(b, u16(b, e + k * 2)).filas);
  });
  const samples = {};
  for (let s = 1; s <= 31; s += 1) { const smp = leerSample(b, h.ptrSamples[s]); if (smp) samples[s] = smp; }

  const frames = [];
  let pos = 0, fila = 0, delay = h.speed, contador = h.speed;
  let totalFrames = 0;

  while (totalFrames < maxFrames && pos < lista.length) {
    contador -= 1;
    if (contador === 0) {
      contador = delay;
      // nueva fila
      if (fila >= porPosicion[pos][0].length) { pos += 1; fila = 0; if (pos >= lista.length) break; }
      for (let c = 0; c < 3; c += 1) {
        const f = porPosicion[pos][c][fila];
        if (!f) continue;
        const ch = canales[c];
        if (f.sample !== null) { ch.sample = f.sample; if (!samples[f.sample]) avisos.add(`sample ${f.sample} inexistente`); }
        if (f.volume !== null) ch.volCanal = f.volume;
        if (f.ornament !== null && f.ornament !== 0) avisos.add('usa ornaments (no emulados)');
        if (f.envelope) avisos.add('usa envolvente (no emulada)');
        if (f.efectos.length) avisos.add(`usa efectos: ${f.efectos.join(',')}`);
        if (f.note !== null) { ch.note = f.note; ch.sonando = true; ch.posSample = 0; ch.tnAcc = 0; }
        else if (f.release) ch.sonando = false;
      }
      fila += 1;
    }
    // --- generar registros AY de este frame (CHREGS) ---
    const reg = { periodo: [0, 0, 0], ampl: [0, 0, 0], mixer: 0, ruido: 0 };
    for (let c = 0; c < 3; c += 1) {
      const ch = canales[c];
      if (!ch.sonando || ch.sample === null) { reg.mixer |= (1 << c) | (8 << c); continue; }
      const smp = samples[ch.sample];
      const p = ch.posSample;
      const [b0, b1, b2, b3] = smp.raw.slice(p * 4, p * 4 + 4);
      ch.posSample = (p + 1) < smp.pasos ? p + 1 : smp.loop;

      let off = b2 | (b3 << 8); if (off & 0x8000) off -= 0x10000;
      if (b1 & 0x40) { ch.tnAcc = (ch.tnAcc + off) | 0; off = ch.tnAcc; }   // BIT 6,B -> acumula
      const nota = Math.max(0, Math.min(95, ch.note));
      let periodo = (NT[nota] + off) & 0x0fff;
      if (periodo === 0) periodo = 1;
      reg.periodo[c] = periodo;

      const volSample = b1 & 0x0f;
      reg.ampl[c] = VT[(ch.volCanal & 0x0f) * 16 + volSample];
      if (b1 & 0x10) reg.mixer |= (1 << c);        // tono deshabilitado
      if (b1 & 0x80) reg.mixer |= (8 << c);        // ruido deshabilitado
      else reg.ruido = (b0 >> 1) & 0x1f;
      if ((b0 & 0x01) === 0) avisos.add('paso de sample con envolvente activada (no emulada)');
      if (b0 & 0x80) avisos.add('paso de sample con desliz de amplitud (no emulado)');
    }
    frames.push(reg);
    totalFrames += 1;
  }
  return { frames, avisos: [...avisos] };
};

// --- sintesis AY (onda cuadrada + LFSR de ruido) a WAV mono ---
const AMPLITUDES = [0, 0.0056, 0.0079, 0.0112, 0.0158, 0.0224, 0.0316, 0.0447,
                    0.0631, 0.0891, 0.1259, 0.1778, 0.2512, 0.3548, 0.5012, 0.7079];

export const sintetizar = (frames, soloCanal = null) => {
  const muestrasPorFrame = Math.round(MUESTREO / FRAMES_POR_S);
  const salida = new Float32Array(frames.length * muestrasPorFrame);
  const cont = [0, 0, 0]; const nivel = [1, 1, 1];
  let contRuido = 0, lfsr = 1, nivelRuido = 1;
  const ciclosPorMuestra = RELOJ_AY / 16 / MUESTREO;
  let k = 0;
  for (const f of frames) {
    for (let s = 0; s < muestrasPorFrame; s += 1) {
      let v = 0;
      for (let c = 0; c < 3; c += 1) {
        if (soloCanal !== null && c !== soloCanal) continue;
        const tonoOn = (f.mixer & (1 << c)) === 0;
        const ruidoOn = (f.mixer & (8 << c)) === 0;
        cont[c] += ciclosPorMuestra;
        const per = Math.max(1, f.periodo[c]);
        while (cont[c] >= per) { cont[c] -= per; nivel[c] = -nivel[c]; }
        const t = tonoOn ? (nivel[c] > 0 ? 1 : 0) : 1;
        const n = ruidoOn ? nivelRuido : 1;
        if (tonoOn || ruidoOn) v += AMPLITUDES[f.ampl[c]] * (t & n);
      }
      contRuido += ciclosPorMuestra;
      const perRuido = Math.max(1, f.ruido) * 2;
      while (contRuido >= perRuido) {
        contRuido -= perRuido;
        lfsr = (lfsr >> 1) | ((((lfsr & 1) ^ ((lfsr >> 3) & 1)) & 1) << 16);
        nivelRuido = lfsr & 1;
      }
      salida[k++] = v * 0.6;
    }
  }
  return salida;
};

const escribirWav = (ruta, datos) => {
  const n = datos.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(MUESTREO, 24); buf.writeUInt32LE(MUESTREO * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i += 1) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(datos[i] * 32767))), 44 + i * 2);
  writeFileSync(ruta, buf);
};

// ---------------------------------------------------------------------------
const D = 'C:/Users/salam/Documents/Programacion/Mideas/test/pt3-neon-void/';
for (const [nombre, ruta] of [['completo', D + 'neon_void_runner.pt3'], ['loop', D + 'neon_void_runner_loop.pt3']]) {
  const b = cargar(ruta);
  const { frames, avisos } = reproducir(b);
  console.log(`\n### ${nombre}: ${frames.length} frames = ${(frames.length / 50).toFixed(1)} s`);
  if (avisos.length) console.log(`  AVISOS del motor: ${avisos.join(' | ')}`);
  else console.log('  el modulo se reproduce ENTERO con el subconjunto minimo (sin ornaments/envolvente/efectos)');

  // metricas por canal
  for (let c = 0; c < 3; c += 1) {
    const activos = frames.filter(f => (f.mixer & (1 << c)) === 0 || (f.mixer & (8 << c)) === 0);
    const conVol = frames.filter(f => f.ampl[c] > 0);
    const periodos = frames.filter(f => f.ampl[c] > 0 && (f.mixer & (1 << c)) === 0).map(f => f.periodo[c]);
    const fuera = periodos.filter(p => p < 1 || p > 4095).length;
    console.log(`  canal ${'ABC'[c]}: ${(100 * activos.length / frames.length).toFixed(1)}% frames con mixer abierto, ` +
      `${(100 * conVol.length / frames.length).toFixed(1)}% con amplitud>0, amplitud media ${(conVol.reduce((a, f) => a + f.ampl[c], 0) / Math.max(1, conVol.length)).toFixed(1)}/15, ` +
      `periodo ${periodos.length ? `${Math.min(...periodos)}..${Math.max(...periodos)}` : '-'}, fuera de rango: ${fuera}`);
  }
  const mudos = frames.filter(f => f.ampl[0] === 0 && f.ampl[1] === 0 && f.ampl[2] === 0).length;
  console.log(`  frames completamente mudos: ${mudos} (${(100 * mudos / frames.length).toFixed(1)}%)`);

  const pcm = sintetizar(frames);
  const rms = Math.sqrt(pcm.reduce((a, x) => a + x * x, 0) / pcm.length);
  let pico = 0; for (const x of pcm) if (Math.abs(x) > pico) pico = Math.abs(x);
  console.log(`  WAV: RMS ${rms.toFixed(4)}  pico ${pico.toFixed(3)}`);
  escribirWav(`${D}_audit/render_${nombre}.wav`, pcm);
  for (let c = 0; c < 3; c += 1) {
    const solo = sintetizar(frames, c);
    const r = Math.sqrt(solo.reduce((a, x) => a + x * x, 0) / solo.length);
    console.log(`    canal ${'ABC'[c]} solo: RMS ${r.toFixed(4)} ${r < 1e-5 ? '  <-- SILENCIO' : ''}`);
    escribirWav(`${D}_audit/render_${nombre}_${'ABC'[c]}.wav`, solo);
  }
}

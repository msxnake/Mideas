#!/usr/bin/env node
/** Verificacion INDEPENDIENTE del analisis de tempo y del filtro de armonicos. */
import { readFileSync } from 'node:fs';

const CSV = 'C:/Users/salam/Downloads/neon_void_runner_basic_pitch/Neon Void Runner_basic_pitch.csv';
const lineas = readFileSync(CSV, 'utf8').split(/\r?\n/);
const notas = [];
for (let i = 1; i < lineas.length; i += 1) {
  const l = lineas[i].trim(); if (!l) continue;
  const c = l.split(',');
  const [inicio, fin, pitch, vel] = [Number(c[0]), Number(c[1]), Number(c[2]), Number(c[3])];
  if (![inicio, fin, pitch].every(Number.isFinite)) continue;
  notas.push({ inicio, fin, pitch, vel, dur: fin - inicio });
}
notas.sort((a, b) => a.inicio - b.inicio || a.pitch - b.pitch);
console.log(`notas CSV: ${notas.length}`);
console.log(`duracion: ${Math.min(...notas.map(n => n.inicio)).toFixed(2)}s .. ${Math.max(...notas.map(n => n.fin)).toFixed(2)}s`);
console.log(`duracion de nota: min ${Math.min(...notas.map(n => n.dur)).toFixed(4)}s  mediana ${notas.map(n => n.dur).sort((a, b) => a - b)[notas.length >> 1].toFixed(3)}s`);
console.log(`velocity: min ${Math.min(...notas.map(n => n.vel))} max ${Math.max(...notas.map(n => n.vel))}`);
console.log(`pitch: min ${Math.min(...notas.map(n => n.pitch))} max ${Math.max(...notas.map(n => n.pitch))}`);

// ---------------------------------------------------------------------------
// 1. BARRIDO DE TEMPO propio: para cada BPM, mejor desfase, error medio de
//    cuantizacion de los onsets unicos a la rejilla de semicorcheas.
// ---------------------------------------------------------------------------
const onsets = [...new Set(notas.map(n => n.inicio))].sort((a, b) => a - b);
console.log(`\nonsets unicos: ${onsets.length}`);

const evaluar = (bpm) => {
  const paso = 60 / bpm / 4;
  let mejor = { err: Infinity, dentro: 0, desfase: 0 };
  for (let k = 0; k < 200; k += 1) {
    const desfase = (k / 200) * paso;
    let err = 0, dentro = 0;
    for (const t of onsets) {
      const d = Math.abs(t - desfase - Math.round((t - desfase) / paso) * paso);
      err += d; if (d < 0.02) dentro += 1;
    }
    if (err / onsets.length < mejor.err) mejor = { err: err / onsets.length, dentro: dentro / onsets.length, desfase };
  }
  return mejor;
};

console.log('\n--- barrido de BPM (mi propio calculo) ---');
let mejorGlobal = { bpm: 0, err: Infinity };
const curva = [];
for (let bpm = 138; bpm <= 154; bpm += 0.005) {
  const r = evaluar(bpm);
  curva.push([bpm, r.err, r.dentro]);
  if (r.err < mejorGlobal.err) mejorGlobal = { bpm, ...r };
}
console.log(`MINIMO GLOBAL: ${mejorGlobal.bpm.toFixed(3)} BPM  error medio ${(mejorGlobal.err * 1000).toFixed(2)} ms  dentro de +-20ms ${(mejorGlobal.dentro * 100).toFixed(1)}%  desfase ${(mejorGlobal.desfase * 1000).toFixed(1)} ms`);
for (const bpm of [145, 145.5, 146, 146.34, 147, 150, 292 / 2, 73]) {
  const r = evaluar(bpm);
  console.log(`  ${String(bpm).padStart(7)} BPM -> ${(r.err * 1000).toFixed(2)} ms  ${(r.dentro * 100).toFixed(1)}% dentro de 20 ms`);
}
// minimos locales aislados
const locales = curva.filter((p, i) => i > 2 && i < curva.length - 3 &&
  p[1] < curva[i - 1][1] && p[1] < curva[i + 1][1] && p[1] < 0.9 * (curva[i - 40]?.[1] ?? 1));
console.log(`  minimos locales claros: ${locales.map(p => `${p[0].toFixed(3)}(${(p[1] * 1000).toFixed(1)}ms)`).join(' ')}`);

// deriva por tercios
const tercio = Math.ceil(onsets.length / 3);
for (let t = 0; t < 3; t += 1) {
  const sub = onsets.slice(t * tercio, (t + 1) * tercio);
  const paso = 60 / 146 / 4;
  let mejor = Infinity;
  for (let k = 0; k < 200; k += 1) {
    const d0 = (k / 200) * paso;
    const e = sub.reduce((a, t2) => a + Math.abs(t2 - d0 - Math.round((t2 - d0) / paso) * paso), 0) / sub.length;
    if (e < mejor) mejor = e;
  }
  console.log(`  tercio ${t + 1} a 146 BPM: ${(mejor * 1000).toFixed(2)} ms`);
}

// ---------------------------------------------------------------------------
// 2. FILTRO DE ARMONICOS: reproducir el criterio y medir que descarta.
// ---------------------------------------------------------------------------
console.log('\n--- filtro de limpieza (replica del criterio del conversor) ---');
const sup = notas.filter(n => n.dur >= 0.055 && n.vel >= 30);
console.log(`tras duracion>=55ms y vel>=30: ${sup.length} (descartadas ${notas.length - sup.length})`);
const energia = (n) => n.vel * Math.min(n.dur, 0.6);
let armonicos = 0;
const descartadas = [];
const limpias = sup.filter((n, i) => {
  for (let j = 0; j < sup.length; j += 1) {
    if (j === i) continue;
    const o = sup[j];
    if (Math.abs(o.inicio - n.inicio) > 0.07) continue;
    const iv = n.pitch - o.pitch;
    if (iv !== 12 && iv !== 19) continue;
    if (energia(o) > energia(n)) { armonicos += 1; descartadas.push({ n, o, iv }); return false; }
  }
  return true;
});
console.log(`descartadas como armonicos: ${armonicos}  -> quedan ${limpias.length}`);
const por12 = descartadas.filter(d => d.iv === 12).length;
console.log(`  de ellas +12 semitonos: ${por12}   +19: ${descartadas.length - por12}`);
console.log(`  duracion media de las descartadas: ${(descartadas.reduce((a, d) => a + d.n.dur, 0) / descartadas.length).toFixed(3)}s  vel media ${(descartadas.reduce((a, d) => a + d.n.vel, 0) / descartadas.length).toFixed(1)}`);
console.log(`  duracion media de las conservadas: ${(limpias.reduce((a, n) => a + n.dur, 0) / limpias.length).toFixed(3)}s  vel media ${(limpias.reduce((a, n) => a + n.vel, 0) / limpias.length).toFixed(1)}`);
// cuantas descartadas eran la nota MAS larga de su instante (sospecha de falso positivo)
const sospechosas = descartadas.filter(d => d.n.dur > d.o.dur * 1.5);
console.log(`  descartadas que duraban >1.5x su supuesta fundamental: ${sospechosas.length} (posibles falsos positivos)`);
const notasLargas = descartadas.filter(d => d.n.dur > 0.5);
console.log(`  descartadas de mas de 0.5 s: ${notasLargas.length}`);

// ---------------------------------------------------------------------------
// 3. COLISIONES tras el reparto por registro (una nota por canal y fila)
// ---------------------------------------------------------------------------
console.log('\n--- reparto a 3 canales: colisiones reales ---');
const paso146 = 60 / 146 / 4;
let desfase = 0, mejorE = Infinity;
for (let k = 0; k < 200; k += 1) {
  const d0 = (k / 200) * paso146;
  const e = onsets.reduce((a, t) => a + Math.abs(t - d0 - Math.round((t - d0) / paso146) * paso146), 0) / onsets.length;
  if (e < mejorE) { mejorE = e; desfase = d0; }
}
const aFila = (t) => Math.round((t - desfase) / paso146);
const canal = (p) => p < 48 ? 'B' : p >= 63 ? 'A' : 'C';
const mapa = new Map();
for (const n of limpias) {
  const clave = `${canal(n.pitch)}:${aFila(n.inicio)}`;
  if (!mapa.has(clave)) mapa.set(clave, []);
  mapa.get(clave).push(n);
}
let col = 0, perdidas = 0;
for (const [, v] of mapa) if (v.length > 1) { col += 1; perdidas += v.length - 1; }
console.log(`celdas (canal,fila) ocupadas: ${mapa.size}  con colision: ${col}  notas PERDIDAS por colision: ${perdidas}`);
console.log(`notas limpias ${limpias.length} -> colocables ${mapa.size} (se pierde el ${(100 * perdidas / limpias.length).toFixed(1)}%)`);
const porCanal = { A: 0, B: 0, C: 0 };
for (const [k] of mapa) porCanal[k[0]] += 1;
console.log(`por canal: A=${porCanal.A} B=${porCanal.B} C=${porCanal.C}`);

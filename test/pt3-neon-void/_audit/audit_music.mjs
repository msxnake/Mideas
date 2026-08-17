#!/usr/bin/env node
/** Contenido MUSICAL de los .pt3, leido con el decodificador propio. */
import { cargar, leerCabecera, leerPosiciones, decodificarCanal, u16 } from './pt3_decode_independent.mjs';

const NOMBRES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
const nom = (i) => `${NOMBRES[i % 12]}${Math.floor(i / 12) + 1}`;

// Tabla de tonos 2 = T_NEW_2 = grupo [#0D10..#06EC] (resuelto desde T1_+74 en
// test/msx2-gameflow/test223_flowtext.asm y el depacker de PT3_INIT).
const BASE_T2 = [0x0D10, 0x0C55, 0x0BA4, 0x0AFC, 0x0A5F, 0x09CA, 0x093D, 0x08B8, 0x083B, 0x07C5, 0x0755, 0x06EC];
const RELOJ_MSX = 3579545 / 2;
const periodo = (n) => BASE_T2[n % 12] >> Math.floor(n / 12);
const hz = (n) => RELOJ_MSX / (16 * periodo(n));
const centsVsMidi = (n) => {
  const midi = n + 24;
  const fRef = 440 * Math.pow(2, (midi - 69) / 12);
  return 1200 * Math.log2(hz(n) / fRef);
};

for (const ruta of process.argv.slice(2).length ? process.argv.slice(2) : [
  'C:/Users/salam/Documents/Programacion/Mideas/test/pt3-neon-void/neon_void_runner.pt3',
  'C:/Users/salam/Documents/Programacion/Mideas/test/pt3-neon-void/neon_void_runner_loop.pt3',
]) {
  const b = cargar(ruta);
  const h = leerCabecera(b);
  const { lista } = leerPosiciones(b);

  // Linea de tiempo completa siguiendo el orden de reproduccion.
  const linea = { A: [], B: [], C: [] };
  for (const posByte of lista) {
    const entrada = h.ptrPatrones + posByte * 2;
    for (const [k, canal] of ['A', 'B', 'C'].entries()) {
      const d = decodificarCanal(b, u16(b, entrada + k * 2));
      for (const f of d.filas) linea[canal].push(f);
    }
  }
  const filas = linea.A.length;
  const segPorFila = h.speed / 50;

  console.log(`\n=================================================================`);
  console.log(`### ${ruta.split(/[\\/]/).pop()}   ${filas} filas, ${(filas * segPorFila).toFixed(1)} s a speed ${h.speed} (50 Hz)`);
  console.log(`=================================================================`);

  const est = {};
  for (const canal of ['A', 'B', 'C']) {
    const c = linea[canal];
    const notas = c.map((f, i) => ({ ...f, i })).filter(f => f.note !== null);
    const pitches = notas.map(f => f.note);
    // duracion sonando: de cada nota hasta el siguiente note o release
    const duraciones = [];
    for (let k = 0; k < notas.length; k += 1) {
      let fin = filas;
      for (let j = notas[k].i + 1; j < filas; j += 1) {
        if (c[j].note !== null || c[j].release) { fin = j; break; }
      }
      duraciones.push(fin - notas[k].i);
    }
    // hueco mayor sin nota
    let hueco = 0, ultima = -1, huecoEn = 0;
    for (const n of notas) { if (n.i - ultima > hueco) { hueco = n.i - ultima; huecoEn = ultima; } ultima = n.i; }
    if (filas - ultima > hueco) { hueco = filas - ultima; huecoEn = ultima; }
    est[canal] = { notas: notas.length, pitches, duraciones, hueco, huecoEn, idx: notas.map(n => n.i) };
    const distintos = new Set(pitches).size;
    const saltos = pitches.slice(1).map((p, i2) => Math.abs(p - pitches[i2]));
    console.log(`  canal ${canal}: ${notas.length} notas  rango ${nom(Math.min(...pitches))}..${nom(Math.max(...pitches))} (MIDI ${Math.min(...pitches) + 24}..${Math.max(...pitches) + 24})  ${distintos} alturas distintas`);
    console.log(`      densidad ${(100 * notas.length / filas).toFixed(1)}% de filas  dur. media ${(duraciones.reduce((a, x) => a + x, 0) / duraciones.length).toFixed(1)} filas (${(duraciones.reduce((a, x) => a + x, 0) / duraciones.length * segPorFila).toFixed(2)} s)  max ${Math.max(...duraciones)} filas (${(Math.max(...duraciones) * segPorFila).toFixed(1)} s)`);
    console.log(`      salto medio ${(saltos.reduce((a, x) => a + x, 0) / saltos.length).toFixed(2)} semitonos  saltos de octava exacta: ${saltos.filter(s => s === 12).length}`);
    console.log(`      hueco mayor sin nota: ${hueco} filas = ${(hueco * segPorFila).toFixed(1)} s (a partir de la fila ${huecoEn})`);
  }

  // simultaneidad
  let tres = 0, dos = 0, uno = 0, cero = 0;
  const sonando = { A: false, B: false, C: false };
  let silencioTotal = 0, silencioMax = 0, silencioActual = 0;
  for (let f = 0; f < filas; f += 1) {
    for (const canal of ['A', 'B', 'C']) {
      if (linea[canal][f].note !== null) sonando[canal] = true;
      else if (linea[canal][f].release) sonando[canal] = false;
    }
    const n = ['A', 'B', 'C'].filter(c => sonando[c]).length;
    if (n === 3) tres += 1; else if (n === 2) dos += 1; else if (n === 1) uno += 1; else cero += 1;
    if (n === 0) { silencioActual += 1; silencioMax = Math.max(silencioMax, silencioActual); silencioTotal += 1; }
    else silencioActual = 0;
  }
  console.log(`  voces sonando por fila: 3 voces ${(100 * tres / filas).toFixed(1)}%  2 voces ${(100 * dos / filas).toFixed(1)}%  1 voz ${(100 * uno / filas).toFixed(1)}%  silencio ${(100 * cero / filas).toFixed(1)}%`);
  console.log(`  silencio total ${(silencioTotal * segPorFila).toFixed(1)} s, racha de silencio mas larga ${(silencioMax * segPorFila).toFixed(1)} s`);

  // ultima fila: cortes para el bucle
  const ult = filas - 1;
  console.log(`  ultima fila (${ult}): A ${linea.A[ult].release ? '===' : (linea.A[ult].note !== null ? nom(linea.A[ult].note) : '---')}` +
              `  B ${linea.B[ult].release ? '===' : (linea.B[ult].note !== null ? nom(linea.B[ult].note) : '---')}` +
              `  C ${linea.C[ult].release ? '===' : (linea.C[ult].note !== null ? nom(linea.C[ult].note) : '---')}`);

  // clases de nota (tonalidad)
  const clases = new Array(12).fill(0);
  for (const canal of ['A', 'B', 'C']) for (const p of est[canal].pitches) clases[p % 12] += 1;
  console.log(`  clases de nota: ${clases.map((v, i) => `${NOMBRES[i]}${v}`).join(' ')}`);

  // primeras 24 filas como vista de tracker
  console.log('  --- filas 0-15 (A | B | C) ---');
  for (let f = 0; f < 16; f += 1) {
    const cel = (canal) => {
      const x = linea[canal][f];
      const n = x.note !== null ? nom(x.note) : x.release ? '===' : '---';
      return `${n} ${x.sample !== null ? String(x.sample).padStart(2, '0') : '..'} ${x.volume !== null ? x.volume.toString(16).toUpperCase() : '.'}`;
    };
    console.log(`   ${String(f).padStart(2, '0')} | ${cel('A')} | ${cel('B')} | ${cel('C')}`);
  }
}

console.log('\n--- afinacion de la tabla de tonos 2 en MSX (reloj 1789772.5 Hz) ---');
for (const n of [0, 12, 24, 36, 39, 48, 60, 72, 95]) {
  console.log(`  nota ${String(n).padStart(2)} ${nom(n)} (MIDI ${n + 24}): periodo ${periodo(n)} -> ${hz(n).toFixed(2)} Hz  (${centsVsMidi(n) >= 0 ? '+' : ''}${centsVsMidi(n).toFixed(1)} cents vs A440)`);
}

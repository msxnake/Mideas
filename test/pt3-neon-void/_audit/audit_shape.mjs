#!/usr/bin/env node
/** Compara la FORMA de los .pt3 generados contra .pt3 reales, con decodificador propio. */
import { cargar, leerCabecera, leerPosiciones, decodificarModulo, leerSample, leerOrnamento } from './pt3_decode_independent.mjs';

const R = 'C:/Users/salam/Documents/Programacion/Mideas/';
const FICHEROS = [
  ['GENERADO completo', R + 'test/pt3-neon-void/neon_void_runner.pt3'],
  ['GENERADO loop    ', R + 'test/pt3-neon-void/neon_void_runner_loop.pt3'],
  ['REAL game over   ', R + 'pt3/PT3/CASTLEVA/game over.pt3'],
  ['REAL bloody tears', R + 'pt3/PT3/CASTLEVA/bloody tears.pt3'],
  ['REAL KUVO puppet ', R + 'pt3/downloaded/KUVO - Forgotten puppet (2021).pt3'],
];

const hex = (n, w = 2) => '#' + n.toString(16).toUpperCase().padStart(w, '0');

for (const [etiqueta, ruta] of FICHEROS) {
  let b;
  try { b = cargar(ruta); } catch (e) { console.log(`\n### ${etiqueta}: NO SE PUEDE LEER (${e.code})`); continue; }
  const h = leerCabecera(b);
  const pos = leerPosiciones(b);
  const m = decodificarModulo(b);

  console.log(`\n=================================================================`);
  console.log(`### ${etiqueta}  (${b.length} B)  ${ruta.split('/').pop()}`);
  console.log(`=================================================================`);
  console.log(`firma      : ${JSON.stringify(h.firma)}`);
  console.log(`titulo     : ${JSON.stringify(h.titulo)}`);
  console.log(`" by "     : ${JSON.stringify(h.by)}   autor: ${JSON.stringify(h.autor)}`);
  console.log(`byte98=${hex(h.byte98)}  toneTable[99]=${h.toneTable}  speed[100]=${h.speed}  numPos[101]=${h.numPos}  loop[102]=${h.loopPos}`);
  console.log(`ptrPatrones=${h.ptrPatrones} (${hex(h.ptrPatrones, 4)})   esperado 201+numPos+1=${201 + h.numPos + 1}`);
  console.log(`lista pos (primeros 24): [${pos.lista.slice(0, 24).join(',')}]  ...  byte tras la lista = ${hex(pos.byteFF)} @${pos.offsetFF}`);
  const mult3 = pos.lista.every(v => v % 3 === 0);
  const mult2no3 = pos.lista.every(v => v % 2 === 0);
  console.log(`lista: todos multiplo de 3? ${mult3}   todos multiplo de 2? ${mult2no3}   max=${Math.max(...pos.lista)}`);

  const samples = h.ptrSamples.map((p, i) => [i, leerSample(b, p)]).filter(([, s]) => s);
  console.log(`samples definidos: ${samples.map(([i, s]) => `#${i}@${s.ptr}(loop ${s.loop},${s.pasos} pasos${s.desborda ? ' DESBORDA' : ''})`).join(' ')}`);
  const orn = h.ptrOrnamentos.map((p, i) => [i, leerOrnamento(b, p)]).filter(([, o]) => o);
  console.log(`ornamentos definidos: ${orn.map(([i, o]) => `#${i}@${o.ptr}(loop ${o.loop},${o.pasos} pasos,[${o.datos.slice(0, 8).join(',')}]${o.desborda ? ' DESBORDA' : ''})`).join(' ')}`);

  if (m.problemas.length) console.log(`PROBLEMAS: ${m.problemas.join(' | ')}`);

  // --- forma de los streams ---
  const filasPorCanal = [];
  const bytesPorFila = [];
  const cmdGlobal = new Map();
  let errores = 0;
  for (const [posByte, pat] of m.patrones) {
    for (const canal of ['A', 'B', 'C']) {
      const c = pat.canales[canal];
      if (c.error) { errores += 1; console.log(`  ERROR patron pos=${posByte} canal ${canal}: ${c.error}`); }
      filasPorCanal.push(c.filas.length);
      if (c.filas.length) bytesPorFila.push(c.bytes / c.filas.length);
      for (const [k, v] of c.usoComandos) cmdGlobal.set(k, (cmdGlobal.get(k) ?? 0) + v);
    }
  }
  const uniq = [...new Set(filasPorCanal)].sort((a, b2) => a - b2);
  console.log(`patrones unicos referenciados: ${m.patrones.size}`);
  console.log(`filas DECODIFICADAS por canal-patron (distintos): [${uniq.join(', ')}]`);
  // Filas REALES de tracker = suma de NoteSkip. Los 3 canales de un patron
  // DEBEN dar el mismo total: es la autocomprobacion del decodificador.
  const totalesPorPatron = [];
  for (const [posByte, pat] of m.patrones) {
    const t = ['A', 'B', 'C'].map(c => pat.canales[c].filas.reduce((a, f) => a + (f.noteSkip ?? 1), 0));
    totalesPorPatron.push([posByte, t, t[0] === t[1] && t[1] === t[2]]);
  }
  const desalineados = totalesPorPatron.filter(([, , ok]) => !ok);
  console.log(`filas de TRACKER (sum NoteSkip) por patron: [${[...new Set(totalesPorPatron.map(([, t]) => t[0]))].sort((a, b2) => a - b2).join(', ')}]`);
  console.log(`patrones con A/B/C desalineados: ${desalineados.length}${desalineados.length ? ' -> ' + desalineados.slice(0, 6).map(([p, t]) => `pos${p}:${t.join('/')}`).join(' ') : ' (ninguno: A=B=C)'}`);
  console.log(`bytes/fila medio: ${(bytesPorFila.reduce((a, x) => a + x, 0) / bytesPorFila.length).toFixed(2)}   errores de decodificacion: ${errores}`);

  // distribucion de comandos por clase
  const clases = new Map();
  const clase = (c) => c >= 0xf0 ? 'F0-FF OrSm' : c === 0xd0 ? 'D0 filaVacia' : c > 0xd0 ? 'D1-EF sample'
    : c === 0xc0 ? 'C0 noteOff' : c > 0xc0 ? 'C1-CF volumen' : c === 0xb0 ? 'B0 envOff' : c > 0xb0 ? 'B1-BF skip/env'
    : c >= 0x50 ? '50-AF nota' : c >= 0x40 ? '40-4F ornam' : c >= 0x20 ? '20-3F ruido' : c >= 0x10 ? '10-1F esam' : '01-0F efecto';
  for (const [c, v] of cmdGlobal) clases.set(clase(c), (clases.get(clase(c)) ?? 0) + v);
  const total = [...clases.values()].reduce((a, x) => a + x, 0);
  console.log(`distribucion de comandos (${total} bytes de comando):`);
  for (const [k, v] of [...clases].sort((a, b2) => b2[1] - a[1])) {
    console.log(`   ${k.padEnd(15)} ${String(v).padStart(6)}  ${(100 * v / total).toFixed(1)}%`);
  }
}

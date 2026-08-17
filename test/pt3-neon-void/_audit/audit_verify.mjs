#!/usr/bin/env node
/**
 * AUDITORIA INDEPENDIENTE: invariantes que DEBEN poder ponerse en rojo.
 * Todo se comprueba con el decodificador propio (semantica del replayer Z80),
 * sin tocar components/utils/pt3Parser.ts.
 *
 * Uso:  node audit_verify.mjs [ruta.pt3 ...]
 *       node audit_verify.mjs --mutar <ruta.pt3> <offset> <valor>   (control negativo)
 */
import { readFileSync } from 'node:fs';
import { cargar, leerCabecera, leerPosiciones, decodificarCanal, leerSample, leerOrnamento, u16 } from './pt3_decode_independent.mjs';

const FIRMA = 'Vortex Tracker II 1.0 module: ';
const NOMBRES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
const nombreNota = (i) => `${NOMBRES[i % 12]}${Math.floor(i / 12) + 1}`;
const midiDeNota = (i) => i + 24;

/** Decodifica un paso de sample (4 bytes) segun CHREGS: POP BC (C=b0,B=b1), POP HL (b2,b3). */
export const decodificarPasoSample = ([b0, b1, b2, b3]) => {
  let tono = b2 | (b3 << 8);
  if (tono & 0x8000) tono -= 0x10000;
  return {
    volumen: b1 & 0x0f,
    tonoOffset: tono,
    tonoActivo: (b1 & 0x10) === 0,        // mixer: bit4 de B = tone DISABLE
    ruidoActivo: (b1 & 0x80) === 0,       // bit7 de B = noise DISABLE / selector env-slide
    acumulaTono: (b1 & 0x40) !== 0,       // BIT 6,B
    envolventeOn: (b0 & 0x01) === 0,      // BIT 0,C: 1 => NO se aplica envolvente
    deslizAmplitud: (b0 & 0x80) !== 0 ? ((b0 & 0x40) ? '+1' : '-1') : '-',
  };
};

export const auditar = (nombre, b) => {
  const fallos = [];
  const avisos = [];
  const F = (cond, msg) => { if (!cond) fallos.push(msg); return cond; };
  const A = (cond, msg) => { if (!cond) avisos.push(msg); return cond; };

  const h = leerCabecera(b);
  // --- 1. cabecera ---
  F(h.firma === FIRMA, `firma incorrecta: ${JSON.stringify(h.firma)}`);
  F(h.by === ' by ', `separador " by " incorrecto: ${JSON.stringify(h.by)}`);
  F(b.length > 201, 'fichero mas corto que la cabecera');
  F(h.toneTable <= 7, `toneTable ${h.toneTable} fuera de 0..7`);
  F(h.speed >= 1 && h.speed <= 15, `speed ${h.speed} sospechoso`);
  F(h.numPos >= 1, 'numPos = 0');
  F(h.loopPos < h.numPos, `loopPos ${h.loopPos} >= numPos ${h.numPos}`);

  // --- 2. lista de posiciones ---
  const { lista, offsetFF, byteFF } = leerPosiciones(b);
  F(byteFF === 0xff, `falta el terminador #FF tras la lista (hay #${byteFF?.toString(16)})`);
  F(lista.every(v => v % 3 === 0), 'hay posiciones que no son multiplo de 3 (indice*3)');
  F(h.ptrPatrones === offsetFF + 1, `ptrPatrones ${h.ptrPatrones} != 201+numPos+1 (${offsetFF + 1})`);
  const maxPos = Math.max(...lista);
  F(h.ptrPatrones + maxPos * 2 + 6 <= b.length, 'la tabla de patrones se sale del fichero');

  // --- 3. patrones: decodificacion con la semantica del replayer ---
  const patrones = new Map();
  const usadosSample = new Set();
  const usadosOrnamento = new Set();
  let notaMin = 999, notaMax = -1;
  let volCero = 0;
  const filasPorPos = [];

  for (const posByte of lista) {
    if (!patrones.has(posByte)) {
      const entrada = h.ptrPatrones + posByte * 2;
      const canales = {};
      for (const [k, canal] of ['A', 'B', 'C'].entries()) {
        const ptr = u16(b, entrada + k * 2);
        F(ptr >= 201 && ptr < b.length, `pos ${posByte} canal ${canal}: puntero ${ptr} fuera del fichero`);
        const d = decodificarCanal(b, ptr);
        F(!d.error, `pos ${posByte} canal ${canal}: ${d.error}`);
        F(d.terminador !== null, `pos ${posByte} canal ${canal}: stream sin terminador #00`);
        canales[canal] = { ptr, ...d };
        for (const f of d.filas) {
          if (f.sample !== null) usadosSample.add(f.sample);
          if (f.ornament !== null) usadosOrnamento.add(f.ornament);
          if (f.note !== null) { notaMin = Math.min(notaMin, f.note); notaMax = Math.max(notaMax, f.note); }
          if (f.volume === 0) volCero += 1;
        }
      }
      patrones.set(posByte, canales);
    }
    const c = patrones.get(posByte);
    const t = ['A', 'B', 'C'].map(k => c[k].filas.reduce((a, f) => a + (f.noteSkip ?? 1), 0));
    F(t[0] === t[1] && t[1] === t[2],
      `pos ${posByte}: los 3 canales no duran lo mismo (A=${t[0]} B=${t[1]} C=${t[2]} filas de tracker)`);
    filasPorPos.push(t[0]);
  }
  F(notaMax <= 95, `nota ${notaMax} fuera del rango 0..95 del replayer`);
  F(volCero === 0, `${volCero} comandos de volumen 0 (#C0 es note off, no volumen)`);

  // --- 4. samples y ornamentos referenciados ---
  for (const s of usadosSample) {
    F(s >= 1 && s <= 31, `sample ${s} fuera de 1..31`);
    const ptr = h.ptrSamples[s];
    F(ptr !== 0, `el stream usa el sample ${s} pero su puntero (offset ${105 + s * 2}) es 0`);
    const smp = leerSample(b, ptr);
    F(smp && !smp.desborda, `el cuerpo del sample ${s} se sale del fichero`);
    if (smp) F(smp.loop < smp.pasos, `sample ${s}: loop ${smp.loop} >= pasos ${smp.pasos} (el replayer haria loop fuera del sample)`);
  }
  for (const o of usadosOrnamento) {
    const ptr = h.ptrOrnamentos[o];
    F(ptr !== 0, `el stream usa el ornamento ${o} pero su puntero es 0`);
  }
  // Ornamento 0: el replayer de este repo tiene EMPTYSAMORN interno, pero otros
  // replayers leen el ornamento 0 del modulo, asi que debe existir.
  const orn0 = leerOrnamento(b, h.ptrOrnamentos[0]);
  A(orn0 && orn0.pasos > 0 && !orn0.desborda, 'ornamento 0 ausente o malformado');

  // --- 5. solapes / huecos entre bloques ---
  const bloques = [];
  for (const [posByte, canales] of patrones) {
    for (const canal of ['A', 'B', 'C']) {
      const c = canales[canal];
      bloques.push([c.ptr, c.terminador + 1, `patron@${posByte}${canal}`]);
    }
  }
  for (const s of usadosSample) {
    const smp = leerSample(b, h.ptrSamples[s]);
    if (smp) bloques.push([smp.ptr, smp.fin, `sample${s}`]);
  }
  if (orn0) bloques.push([orn0.ptr, orn0.fin, 'orn0']);
  bloques.sort((x, y) => x[0] - y[0]);
  for (let i = 1; i < bloques.length; i += 1) {
    if (bloques[i][0] < bloques[i - 1][1]) {
      A(false, `solape: ${bloques[i - 1][2]} [${bloques[i - 1][0]},${bloques[i - 1][1]}) con ${bloques[i][2]} [${bloques[i][0]},...)`);
    }
  }
  const cubierto = bloques.reduce((a, [i0, i1]) => a + (i1 - i0), 0) + h.ptrPatrones - 201 + (maxPos / 3 + 1) * 6;
  A(Math.abs(b.length - 201 - cubierto + (h.ptrPatrones - 201)) < b.length,
    'espacio no cubierto'); // informativo

  return { h, lista, patrones, fallos, avisos, usadosSample, usadosOrnamento,
           notaMin, notaMax, filasPorPos, nombre };
};

// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
if (argv[0] === '--mutar') {
  const [, ruta, off, val] = argv;
  const b = cargar(ruta);
  const antes = b[Number(off)];
  b[Number(off)] = Number(val);
  const r = auditar(`${ruta} MUTADO @${off}: ${antes}->${val}`, b);
  console.log(`\n### CONTROL NEGATIVO ${r.nombre}`);
  console.log(r.fallos.length ? `ROJO (${r.fallos.length} fallos):\n  - ${r.fallos.slice(0, 8).join('\n  - ')}`
                              : 'VERDE  <-- LA COMPROBACION NO DETECTA LA CORRUPCION');
  process.exit(0);
}

const RUTAS = argv.length ? argv : [
  'C:/Users/salam/Documents/Programacion/Mideas/test/pt3-neon-void/neon_void_runner.pt3',
  'C:/Users/salam/Documents/Programacion/Mideas/test/pt3-neon-void/neon_void_runner_loop.pt3',
  'C:/Users/salam/Documents/Programacion/Mideas/pt3/PT3/CASTLEVA/game over.pt3',
  'C:/Users/salam/Documents/Programacion/Mideas/pt3/PT3/CASTLEVA/bloody tears.pt3',
  'C:/Users/salam/Documents/Programacion/Mideas/pt3/downloaded/KUVO - Forgotten puppet (2021).pt3',
];

let totalFallos = 0;
for (const ruta of RUTAS) {
  const b = cargar(ruta);
  const r = auditar(ruta, b);
  totalFallos += r.fallos.length;
  console.log(`\n### ${ruta.split(/[\\/]/).pop()}  (${b.length} B)`);
  console.log(`    speed=${r.h.speed} toneTable=${r.h.toneTable} pos=${r.h.numPos} loop=${r.h.loopPos} ` +
              `notas ${nombreNota(r.notaMin)}(MIDI ${midiDeNota(r.notaMin)})..${nombreNota(r.notaMax)}(MIDI ${midiDeNota(r.notaMax)})`);
  console.log(`    samples usados: {${[...r.usadosSample].sort((a, x) => a - x).join(',')}}  ornamentos usados: {${[...r.usadosOrnamento].join(',')}}`);
  console.log(`    filas de tracker por posicion: [${[...new Set(r.filasPorPos)].join(',')}]`);
  console.log(`    ${r.fallos.length === 0 ? 'FALLOS: ninguno' : `FALLOS (${r.fallos.length}):\n      - ${r.fallos.slice(0, 10).join('\n      - ')}`}`);
  if (r.avisos.length) console.log(`    AVISOS: ${r.avisos.slice(0, 5).join(' | ')}`);

  // samples decodificados con la semantica del replayer
  if (ruta.includes('neon_void')) {
    console.log('    --- samples decodificados desde los bytes crudos (semantica CHREGS) ---');
    for (const s of [...r.usadosSample].sort((a, x) => a - x)) {
      const smp = leerSample(b, r.h.ptrSamples[s]);
      const pasos = [];
      for (let i = 0; i < smp.pasos; i += 1) {
        const d = decodificarPasoSample(smp.raw.slice(i * 4, i * 4 + 4));
        pasos.push(`${i === smp.loop ? '>' : ' '}v${String(d.volumen).padStart(2)}${d.tonoActivo ? 'T' : '-'}${d.ruidoActivo ? 'N' : '-'}${d.envolventeOn ? 'E' : '-'}${d.tonoOffset ? (d.tonoOffset > 0 ? '+' : '') + d.tonoOffset : ''}`);
      }
      console.log(`      #${s} loop=${smp.loop}/${smp.pasos}: ${pasos.join(' |')}`);
    }
  }
}
console.log(`\n===== TOTAL FALLOS: ${totalFallos} =====`);

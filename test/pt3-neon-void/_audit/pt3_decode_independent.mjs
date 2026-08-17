#!/usr/bin/env node
/**
 * AUDITORIA INDEPENDIENTE - decodificador PT3 escrito DIRECTAMENTE desde la
 * semantica del replayer Z80 real (server/PT3-ROM-alltables-glass.asm,
 * rutinas PT3_INIT / PT3_PLAY / PTDECOD / CHREGS).
 *
 * NO importa NADA de components/utils/. No usa pt3Parser.ts.
 *
 * Clasificador de PTDECOD reconstruido paso a paso (PD_LOOP: DE=#2010):
 *   cmd >= #F0            -> PD_OrSm : ornamento=(cmd-#F0), + 1 byte extra = sample*2
 *   cmd == #D0            -> PD_FIN  : fin de fila (fila vacia)
 *   #D1..#EF              -> PD_SAM  : sample = cmd-#D0
 *   cmd == #C0            -> PD_REL  : note off (fin de fila)
 *   #C1..#CF              -> PD_VOL  : volumen = cmd-#C0
 *   cmd == #B0            -> PD_EOff : envolvente off
 *   #B1..#BF             -> PD_SorE : #B1 = NoteSkip(+1 byte), resto = SetEnv(+3 bytes)
 *   #50..#AF              -> PD_NOTE : nota = cmd-#50 (fin de fila)
 *   #40..#4F              -> PD_ORN  : ornamento = cmd-#40
 *   #20..#3F              -> PD_NOIS : ruido base = cmd-#20
 *   #10..#1F              -> PD_ESAM : envolvente+sample, +1 byte sample*2 (y +3 si !=#10)
 *   #01..#0F              -> SPCCOMS[cmd] (efectos con operandos)
 *   #00                   -> en canal A: FIN DE PATRON (lo detecta PT3_PLAY antes de
 *                            llamar a PTDECOD). Dentro de PTDECOD seria SPCCOMS[0]=C_NOP.
 */

import { readFileSync } from 'node:fs';

export const u16 = (b, o) => b[o] | (b[o + 1] << 8);

export const leerCabecera = (b) => ({
  firma: Buffer.from(b.slice(0, 30)).toString('latin1'),
  titulo: Buffer.from(b.slice(30, 62)).toString('latin1'),
  by: Buffer.from(b.slice(62, 66)).toString('latin1'),
  autor: Buffer.from(b.slice(66, 98)).toString('latin1'),
  byte98: b[98],
  toneTable: b[99],
  speed: b[100],
  numPos: b[101],
  loopPos: b[102],
  ptrPatrones: u16(b, 103),
  ptrSamples: Array.from({ length: 32 }, (_, i) => u16(b, 105 + i * 2)),
  ptrOrnamentos: Array.from({ length: 16 }, (_, i) => u16(b, 169 + i * 2)),
  tam: b.length,
});

/** Lista de posiciones: bytes desde 201 hasta el #FF. */
export const leerPosiciones = (b) => {
  const h = leerCabecera(b);
  const lista = [];
  let o = 201;
  // Se leen EXACTAMENTE numPos bytes, como hace el replayer (que ademas para en #FF).
  for (let i = 0; i < h.numPos; i += 1) lista.push(b[o + i]);
  o += h.numPos;
  return { lista, offsetFF: o, byteFF: b[o] };
};

/**
 * Decodifica UN canal de UN patron replicando PTDECOD byte a byte.
 * Devuelve las filas y cuantos bytes ha consumido, o el error si sale del fichero.
 * `pararEnCero`: emula el chequeo de PT3_PLAY (solo valido para el canal A);
 * para B y C el replayer NO comprueba el #00, asi que devolvemos igualmente
 * la fila donde aparece para poder detectar desincronizaciones.
 */
export const decodificarCanal = (b, inicio, maxFilas = 4096) => {
  let p = inicio;
  const filas = [];
  const usoComandos = new Map();
  let noteSkip = 1;
  const anota = (c) => usoComandos.set(c, (usoComandos.get(c) ?? 0) + 1);
  let terminador = null;

  while (filas.length < maxFilas) {
    if (p >= b.length) return { filas, bytes: p - inicio, usoComandos, error: `puntero ${p} fuera del fichero`, terminador };
    // Chequeo de PT3_PLAY: byte 0 = fin de patron.
    if (b[p] === 0x00) { terminador = p; break; }

    const fila = { note: null, release: false, empty: false, sample: null, volume: null,
                   ornament: null, noise: null, envelope: null, efectos: [], bytes: 0, offset: p };
    let finFila = false;
    let guardia = 0;
    // Los SPCCOMS (#01-#0F) NO llevan sus operandos en linea: PD_LP2 hace
    // "PUSH DE / JR PD_LOOP", asi que el handler se ejecuta al RET de PD_FIN,
    // DESPUES del byte que cierra la fila, y en orden LIFO.
    const pendientes = [];
    while (!finFila) {
      if (p >= b.length) return { filas, bytes: p - inicio, usoComandos, error: `puntero ${p} fuera del fichero (mitad de fila)`, terminador };
      if (++guardia > 64) return { filas, bytes: p - inicio, usoComandos, error: `fila sin terminar en ${fila.offset}`, terminador };
      const cmd = b[p++];
      anota(cmd);
      if (cmd >= 0xf0) {                       // PD_OrSm: SETORN(0B) + 1 byte sample*2
        fila.ornament = cmd - 0xf0;
        fila.sample = b[p++] >> 1;
      } else if (cmd === 0xd0) {               // PD_FIN
        fila.empty = true; finFila = true;
      } else if (cmd > 0xd0) {                 // PD_SAM
        fila.sample = cmd - 0xd0;
      } else if (cmd === 0xc0) {               // PD_REL
        fila.release = true; finFila = true;
      } else if (cmd > 0xc0) {                 // PD_VOL
        fila.volume = cmd - 0xc0;
      } else if (cmd === 0xb0) {               // PD_EOff
        fila.envelope = 'off';
      } else if (cmd > 0xb0) {                 // PD_SorE
        if (cmd === 0xb1) { noteSkip = b[p++]; fila.efectos.push(`NoteSkip=${noteSkip}`); }
        else { fila.envelope = `env${cmd - 0xb0}`; p += 2; } // SETENV lee 2 bytes en linea
      } else if (cmd >= 0x50) {                // PD_NOTE
        fila.note = cmd - 0x50; finFila = true;
      } else if (cmd >= 0x40) {                // PD_ORN
        fila.ornament = cmd - 0x40;
      } else if (cmd >= 0x20) {                // PD_NOIS
        fila.noise = cmd - 0x20;
      } else if (cmd >= 0x10) {                // PD_ESAM: CALL NZ,SETENV(2B si !=#10) + 1 byte
        if (cmd !== 0x10) p += 2;
        fila.sample = b[p++] >> 1;
        fila.envelope = `esam${cmd - 0x10}`;
      } else {                                 // SPCCOMS 0..15 -> operandos diferidos
        pendientes.push(cmd);
        fila.efectos.push(`spc${cmd}`);
      }
    }
    // Handlers en LIFO: el ultimo empujado se ejecuta primero y lee primero.
    const OPERANDOS = { 0: 0, 1: 3, 2: 5, 3: 1, 4: 1, 5: 2, 6: 0, 7: 0, 8: 3, 9: 1 };
    for (let i = pendientes.length - 1; i >= 0; i -= 1) p += OPERANDOS[pendientes[i]] ?? 0;
    fila.bytes = p - fila.offset;
    fila.noteSkip = noteSkip;
    filas.push(fila);
  }
  return { filas, bytes: p - inicio, usoComandos, error: null, terminador, noteSkip };
};

export const decodificarModulo = (b) => {
  const h = leerCabecera(b);
  const { lista, byteFF, offsetFF } = leerPosiciones(b);
  const patrones = new Map();
  const problemas = [];

  for (const posByte of lista) {
    if (patrones.has(posByte)) continue;
    // PT3_PLAY: IY = PatsPtr + posByte*2 ; la entrada son 3 punteros de 16 bits.
    const entrada = h.ptrPatrones + posByte * 2;
    if (entrada + 6 > b.length) { problemas.push(`entrada de patron ${posByte} en ${entrada} fuera del fichero`); continue; }
    const canales = {};
    for (const [k, canal] of ['A', 'B', 'C'].entries()) {
      const ptr = u16(b, entrada + k * 2);
      canales[canal] = { ptr, ...decodificarCanal(b, ptr) };
    }
    patrones.set(posByte, { entrada, canales });
  }
  return { h, lista, byteFF, offsetFF, patrones, problemas };
};

export const leerSample = (b, ptr) => {
  if (ptr === 0 || ptr + 2 > b.length) return null;
  const loop = b[ptr], pasos = b[ptr + 1];
  const fin = ptr + 2 + pasos * 4;
  return { ptr, loop, pasos, fin, desborda: fin > b.length,
           raw: Array.from(b.slice(ptr + 2, Math.min(fin, b.length))) };
};

export const leerOrnamento = (b, ptr) => {
  if (ptr === 0 || ptr + 2 > b.length) return null;
  const loop = b[ptr], pasos = b[ptr + 1];
  const fin = ptr + 2 + pasos;
  return { ptr, loop, pasos, fin, desborda: fin > b.length,
           datos: Array.from(b.slice(ptr + 2, Math.min(fin, b.length))) };
};

export const cargar = (ruta) => new Uint8Array(readFileSync(ruta));

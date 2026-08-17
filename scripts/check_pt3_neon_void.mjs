#!/usr/bin/env node
/**
 * check_pt3_neon_void.mjs
 * ---------------------------------------------------------------------------
 * Harness de validacion de los .pt3 generados por scripts/basic_pitch_to_pt3.mjs.
 *
 * Comprueba tres cosas independientes:
 *   1. Que parsePT3Module / parsePT3File (components/utils/pt3Parser.ts) leen el
 *      fichero sin excepciones y sin warnings.
 *   2. Que la cabecera y los punteros son estructuralmente iguales a los de un
 *      .pt3 real (pt3/PT3/CASTLEVA), campo a campo.
 *   3. Round-trip real: se vuelve a ejecutar la conversion, y las filas que el
 *      conversor pretendia escribir se comparan una a una con las que devuelve
 *      el parser (nota, sample efectivo y volumen efectivo de cada canal).
 *
 * Uso: node scripts/check_pt3_neon_void.mjs
 * Sale con codigo 1 si algo falla.
 */

import { mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

import { convertir, PRESETS, nombreNotaPT3 } from './basic_pitch_to_pt3.mjs';

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PT3_REAL_DE_REFERENCIA = join(RAIZ_REPO, 'pt3', 'PT3', 'CASTLEVA', 'game over.pt3');

let fallos = 0;
const comprobar = (condicion, mensaje) => {
  console.log(`  ${condicion ? 'OK  ' : 'FALLA'} ${mensaje}`);
  if (!condicion) fallos += 1;
};

// --- carga del parser TS del repo (mismo patron que scripts/check_pt3_*.mjs) ---
const cargarParser = async () => {
  const salida = join(RAIZ_REPO, 'server', 'temp', 'pt3-neon-void', 'puente_parser.mjs');
  await mkdir(dirname(salida), { recursive: true });
  await build({
    stdin: {
      contents: "export { parsePT3Module, parsePT3File, hasFullPT3Header } from './components/utils/pt3Parser';",
      resolveDir: RAIZ_REPO,
      loader: 'ts',
      sourcefile: 'puente_parser.ts',
    },
    outfile: salida,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    logLevel: 'silent',
  });
  return import(`${pathToFileURL(salida).href}?v=${Date.now()}`);
};

const leerU16 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8);
const aBuffer = (bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

// ---------------------------------------------------------------------------
// Comparacion estructural contra un PT3 real
// ---------------------------------------------------------------------------
const compararCabeceraConPT3Real = (nuestro, real) => {
  console.log('\n--- cabecera: nuestro modulo vs "game over.pt3" (Vortex real) ---');
  const campos = [
    ['firma[0..29]', b => new TextDecoder('ascii').decode(b.slice(0, 30))],
    ['titulo[30..61]', b => new TextDecoder('ascii').decode(b.slice(30, 62))],
    ['" by "[62..65]', b => JSON.stringify(new TextDecoder('ascii').decode(b.slice(62, 66)))],
    ['autor[66..97]', b => new TextDecoder('ascii').decode(b.slice(66, 98))],
    ['relleno[98]', b => `#${b[98].toString(16).padStart(2, '0').toUpperCase()}`],
    ['toneTable[99]', b => b[99]],
    ['speed[100]', b => b[100]],
    ['posiciones[101]', b => b[101]],
    ['loop[102]', b => b[102]],
    ['ptrPatrones[103]', b => `${leerU16(b, 103)} (#${leerU16(b, 103).toString(16).toUpperCase()})`],
    ['ptrSample1[107]', b => leerU16(b, 107)],
    ['ptrOrnamento0[169]', b => leerU16(b, 169)],
    ['tam. fichero', b => b.length],
  ];
  for (const [nombre, extraer] of campos) {
    console.log(`  ${nombre.padEnd(20)} nuestro=${String(extraer(nuestro)).padEnd(34)} real=${extraer(real)}`);
  }

  console.log('\n--- invariantes estructurales (se exigen a los dos ficheros) ---');
  for (const [etiqueta, bytes] of [['nuestro', nuestro], ['real   ', real]]) {
    const posiciones = bytes[101];
    const listaOk = Array.from(bytes.slice(201, 201 + posiciones)).every(v => v % 3 === 0);
    comprobar(listaOk, `${etiqueta}: las ${posiciones} posiciones son multiplos de 3 (indice*3)`);
    comprobar(bytes[201 + posiciones] === 0xff, `${etiqueta}: terminador #FF tras la lista de posiciones`);
    const ptrPatrones = leerU16(bytes, 103);
    comprobar(ptrPatrones === 201 + posiciones + 1,
      `${etiqueta}: tabla de patrones justo detras del #FF (esperado ${201 + posiciones + 1}, hay ${ptrPatrones})`);
    const maxPatron = Math.max(...Array.from(bytes.slice(201, 201 + posiciones))) / 3;
    let punterosOk = true;
    for (let p = 0; p <= maxPatron; p += 1) {
      for (let c = 0; c < 3; c += 1) {
        const puntero = leerU16(bytes, ptrPatrones + p * 6 + c * 2);
        if (puntero < 201 || puntero >= bytes.length) punterosOk = false;
      }
    }
    comprobar(punterosOk, `${etiqueta}: los ${(maxPatron + 1) * 3} punteros de canal caen dentro del fichero`);
    const ornamento0 = leerU16(bytes, 169);
    comprobar(ornamento0 > 0 && ornamento0 + 2 <= bytes.length && bytes[ornamento0 + 1] > 0,
      `${etiqueta}: ornamento 0 definido en ${ornamento0} (loop ${bytes[ornamento0]}, ${bytes[ornamento0 + 1]} pasos)`);
  }
};

// ---------------------------------------------------------------------------
// Round-trip: lo que quise escribir vs lo que el parser lee
// ---------------------------------------------------------------------------
const compararRoundTrip = (resultado, parseado) => {
  console.log('\n--- round-trip escribir -> parsear -> comparar ---');
  comprobar(parseado.patterns.length === resultado.patrones.length,
    `numero de patrones: intencion ${resultado.patrones.length}, parseado ${parseado.patterns.length}`);
  comprobar(JSON.stringify(parseado.order) === JSON.stringify(resultado.orden),
    `orden de reproduccion identico (${resultado.orden.length} posiciones)`);

  let celdasComparadas = 0;
  const diferencias = [];
  for (let p = 0; p < Math.min(parseado.patterns.length, resultado.celdasPorPatron.length); p += 1) {
    const patronParseado = parseado.patterns[p];
    const patronIntencion = resultado.celdasPorPatron[p];
    if (patronParseado.numRows !== patronIntencion.A.length) {
      diferencias.push(`patron ${p}: ${patronParseado.numRows} filas parseadas frente a ${patronIntencion.A.length} escritas`);
      continue;
    }
    // El parser arranca cada canal con sample=1 / volumen=15 y solo rellena
    // instrument/volume en las filas donde hay selector: hay que arrastrar.
    const estado = { A: { sample: 1, volumen: 15 }, B: { sample: 1, volumen: 15 }, C: { sample: 1, volumen: 15 } };
    for (let fila = 0; fila < patronParseado.numRows; fila += 1) {
      for (const canal of ['A', 'B', 'C']) {
        const leida = patronParseado.rows[fila][canal];
        const escrita = patronIntencion[canal][fila];
        if (leida.instrument !== null) estado[canal].sample = leida.instrument;
        if (leida.volume !== null) estado[canal].volumen = leida.volume;

        const notaEsperada = escrita.note !== null ? nombreNotaPT3(escrita.note) : (escrita.release ? '===' : null);
        if (leida.note !== notaEsperada) {
          diferencias.push(`p${p} f${fila} ${canal}: nota escrita ${notaEsperada} != leida ${leida.note}`);
        }
        if (escrita.note !== null) {
          if (estado[canal].sample !== escrita.sample) {
            diferencias.push(`p${p} f${fila} ${canal}: sample escrito ${escrita.sample} != efectivo ${estado[canal].sample}`);
          }
          if (estado[canal].volumen !== escrita.volume) {
            diferencias.push(`p${p} f${fila} ${canal}: volumen escrito ${escrita.volume} != efectivo ${estado[canal].volumen}`);
          }
        }
        celdasComparadas += 1;
      }
    }
  }
  comprobar(diferencias.length === 0,
    `${celdasComparadas} celdas comparadas, ${diferencias.length} diferencias`);
  diferencias.slice(0, 12).forEach(diferencia => console.log(`        ! ${diferencia}`));
};

// ---------------------------------------------------------------------------
// Vista de tracker para inspeccion visual
// ---------------------------------------------------------------------------
const imprimirPatron = (patron, filas = 16) => {
  const celda = (c) => {
    const nota = (c.note ?? '---').padEnd(3);
    const ins = c.instrument !== null ? String(c.instrument).padStart(2, '0') : '..';
    const vol = c.volume !== null ? c.volume.toString(16).toUpperCase() : '.';
    return `${nota} ${ins} ${vol}`;
  };
  for (let fila = 0; fila < Math.min(filas, patron.numRows); fila += 1) {
    const r = patron.rows[fila];
    console.log(`   ${String(fila).padStart(2, '0')} | ${celda(r.A)} | ${celda(r.B)} | ${celda(r.C)}`);
  }
};

// ---------------------------------------------------------------------------
const main = async () => {
  const { parsePT3Module, parsePT3File, hasFullPT3Header } = await cargarParser();
  const real = new Uint8Array(readFileSync(PT3_REAL_DE_REFERENCIA));

  for (const [nombrePreset, preset] of Object.entries(PRESETS)) {
    const ruta = resolve(RAIZ_REPO, preset.salida);
    console.log(`\n=============================================================`);
    console.log(`PRESET "${nombrePreset}" -> ${preset.salida}`);
    console.log(`=============================================================`);

    const enDisco = new Uint8Array(readFileSync(ruta));
    const resultado = await convertir(preset);

    console.log('\n--- determinismo ---');
    comprobar(Buffer.compare(Buffer.from(enDisco), Buffer.from(resultado.bytes)) === 0,
      `el fichero en disco (${enDisco.length} B) coincide byte a byte con una reconversion`);

    console.log('\n--- parseo con components/utils/pt3Parser.ts ---');
    comprobar(hasFullPT3Header(enDisco), 'hasFullPT3Header() reconoce la firma');
    const modulo = parsePT3Module(aBuffer(enDisco));
    const cancion = parsePT3File(aBuffer(enDisco));
    console.log(`  titulo            : "${modulo.title}"`);
    console.log(`  autor             : "${modulo.author}"`);
    console.log(`  speed             : ${modulo.speed}  (${(750 / modulo.speed).toFixed(1)} BPM a 50 Hz con fila = 1/16)`);
    console.log(`  toneTable         : ${modulo.toneTable}`);
    console.log(`  posiciones         : ${modulo.positionCount}  orden = [${modulo.order.join(', ')}]`);
    console.log(`  loop              : ${modulo.loopPosition}`);
    console.log(`  ptr tabla patrones: ${modulo.patternTablePointer}`);
    console.log(`  patrones          : ${modulo.patterns.length} (${modulo.patterns.map(p => p.numRows).join('/')} filas)`);
    console.log(`  instrumentos      : ${modulo.instruments.length} -> ${modulo.instruments.map(i => `#${i.id}(${i.pt3Sample.steps.length} pasos, loop ${i.pt3Sample.loop})`).join(' ')}`);
    console.log(`  ornamentos        : ${modulo.ornaments.length}`);
    console.log(`  warnings          : ${modulo.warnings.length === 0 ? '(ninguno)' : JSON.stringify(modulo.warnings)}`);

    comprobar(modulo.warnings.length === 0, 'parsePT3Module no genera warnings');
    comprobar(modulo.speed === resultado.speed, `speed ${resultado.speed}`);
    comprobar(modulo.positionCount === resultado.orden.length, `positionCount ${resultado.orden.length}`);
    comprobar(modulo.loopPosition === 0, 'loopPosition 0');
    comprobar(modulo.patterns.every(p => p.numRows === 64), 'todos los patrones tienen 64 filas');
    comprobar(modulo.instruments.length === Object.keys(resultado.samples).length,
      `${Object.keys(resultado.samples).length} instrumentos presentes`);
    comprobar(cancion.patterns.length > 0 && cancion.order.length > 0, 'parsePT3File devuelve TrackerSongData usable');

    // Los pasos de cada sample deben volver con exactamente los mismos bytes.
    let samplesOk = true;
    for (const instrumento of modulo.instruments) {
      const original = resultado.samples[instrumento.id];
      const leidos = instrumento.pt3Sample.steps.flatMap(s => [...s.raw]);
      if (JSON.stringify(leidos) !== JSON.stringify(original.cuerpo)) samplesOk = false;
      if (instrumento.pt3Sample.loop !== original.loop) samplesOk = false;
    }
    comprobar(samplesOk, 'los bytes de todos los samples sobreviven el round-trip');

    compararRoundTrip(resultado, modulo);
    compararCabeceraConPT3Real(enDisco, real);

    console.log('\n--- primeras 16 filas del patron 0 (nota ins vol por canal A|B|C) ---');
    imprimirPatron(modulo.patterns[0]);
  }

  console.log(`\n=============================================================`);
  console.log(fallos === 0 ? 'RESULTADO: todas las comprobaciones OK' : `RESULTADO: ${fallos} COMPROBACIONES FALLIDAS`);
  process.exit(fallos === 0 ? 0 : 1);
};

await main();

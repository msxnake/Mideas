#!/usr/bin/env node
/**
 * basic_pitch_to_pt3.mjs
 * ---------------------------------------------------------------------------
 * Convierte la transcripcion audio->MIDI de Spotify Basic Pitch (fichero CSV)
 * en un modulo PT3 REAL (ProTracker 3 / Vortex Tracker II) de 3 canales para
 * el AY-3-8910 del MSX.
 *
 * El formato de salida es el que describe components/utils/pt3Parser.ts:
 * cabecera de 201 bytes con firma "Vortex Tracker II 1.0 module: ", lista de
 * posiciones terminada en #FF, tabla de patrones de 6 bytes por patron y
 * streams de comandos por canal. NO se usa components/utils/pt3Serializer.ts:
 * ese modulo escribe un formato inventado y no produce PT3 reproducibles.
 *
 * Uso:
 *   node scripts/basic_pitch_to_pt3.mjs --preset completo
 *   node scripts/basic_pitch_to_pt3.mjs --preset loop
 *   node scripts/basic_pitch_to_pt3.mjs --preset completo --out otra/ruta.pt3
 *   node scripts/basic_pitch_to_pt3.mjs            (genera los dos presets)
 *
 * Tambien se puede importar como modulo: `convertir(opciones)` devuelve los
 * bytes del PT3 y la representacion intermedia de filas, que es lo que usa
 * scripts/check_pt3_neon_void.mjs para el round-trip escribir->parsear.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// 1. Constantes del formato PT3 (espejo de components/utils/pt3Parser.ts)
// ---------------------------------------------------------------------------

const PT3_HEADER_SIZE = 201;
const PT3_TONE_TABLE_OFFSET = 99;
const PT3_SPEED_OFFSET = 100;
const PT3_POSITION_COUNT_OFFSET = 101;
const PT3_LOOP_POSITION_OFFSET = 102;
const PT3_PATTERN_POINTER_OFFSET = 103;
const PT3_SAMPLE_POINTERS_OFFSET = 105;
const PT3_ORNAMENT_POINTERS_OFFSET = 169;
const PT3_POSITION_LIST_OFFSET = 201;

/** Firma que Vortex Tracker II escribe en los .pt3 reales (30 caracteres). */
const PT3_FIRMA = 'Vortex Tracker II 1.0 module: ';
/** Tabla de tonos #2 (ASM), la que usan los modulos PT3 3.x mas habituales. */
const PT3_TONE_TABLE = 2;

/** El indice de nota 0 del PT3 ("C-1") equivale al MIDI 24 (32.70 Hz). */
const MIDI_DE_NOTA_PT3_0 = 24;
const NOMBRES_NOTA = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];

/**
 * Filas por patron. constants.ts define DEFAULT_PT3_ROWS_PER_PATTERN = 32, pero
 * el formato PT3 no fija la longitud (la marca el terminador #00 del canal A) y
 * el estandar de Vortex/ProTracker 3 son 64 filas = 4 compases de 4/4 a 1/16.
 */
const FILAS_POR_PATRON = 64;
/** Filas por compas de 4/4 cuando cada fila es una semicorchea. */
const FILAS_POR_COMPAS = 16;

// ---------------------------------------------------------------------------
// 2. Parametros musicales deducidos del analisis del CSV
// ---------------------------------------------------------------------------

/**
 * BPM de la rejilla. El MIDI exportado declara 145 BPM (meta FF 51 03 =
 * 413793 us/negra), pero ese valor lo impuso el export, no la musica: el
 * barrido del error medio de cuantizacion sobre los 1884 onsets unicos del CSV
 * (140-152 BPM, paso 0.005) tiene UN solo minimo, agudo y aislado, en 146.000
 * BPM -> 11.8 ms de error medio y 81.8 % de onsets dentro de +-20 ms, frente a
 * ~25 ms / 40 % en todo el resto del barrido (que es el suelo aleatorio).
 * Ademas el error es plano por tercios de cancion (11.9 / 11.6 / 11.8 ms), o
 * sea que no hay deriva de tempo. Se usa el valor medido, no el declarado.
 */
const BPM_REJILLA = 146.0;

/**
 * Velocidad PT3 (frames de 50 Hz por fila). Con una fila = semicorchea:
 *   BPM = 750 / speed  ->  speed 5 = 150 BPM, speed 6 = 125 BPM.
 * speed 5 (100 ms/fila) queda a +2.5 % del tempo medido; speed 6 se iria a
 * -14 %. En un MSX NTSC (60 Hz) el equivalente exacto seria speed 6.
 */
const PT3_SPEED = 5;

/** Umbrales de limpieza de la transcripcion (ver limpiarTranscripcion). */
const DURACION_MINIMA_S = 0.055;   // ~media fila: por debajo son detecciones sueltas
const VELOCIDAD_MINIMA = 30;       // el CSV va de 26 a 89, mediana 54
const VENTANA_SIMULTANEO_S = 0.07; // dos onsets dentro de esta ventana son "a la vez"

/** Fronteras de registro para repartir las voces entre los 3 canales del PSG. */
const LIMITE_GRAVE = 48;  // < C3  -> bajo
const LIMITE_AGUDO = 63;  // >= D#4 -> melodia

// ---------------------------------------------------------------------------
// 3. Banco de instrumentos PT3
// ---------------------------------------------------------------------------

/**
 * Numeracion de samples dentro del modulo. El 1 es el que el replayer PT3
 * selecciona por defecto al arrancar, asi que va la voz principal.
 */
const SAMPLE_LEAD = 1;
const SAMPLE_BAJO = 2;
const SAMPLE_ARMONIA = 3;
const SAMPLE_BOMBO = 4;
const SAMPLE_CAJA = 5;
const SAMPLE_CHARLES = 6;

/** Volumen de canal (multiplica al volumen del sample en la tabla PT3). */
const VOLUMEN_LEAD = 15;
const VOLUMEN_BAJO = 15;
const VOLUMEN_ARMONIA = 11; // la armonia se queda por detras de la melodia
const VOLUMEN_PERCUSION = 15;

/**
 * Paso de sample "logico" con los valores por defecto del kit de fabrica:
 * tono activo, ruido apagado y envolvente hardware desactivada (bit 0 de C = 1).
 */
const paso = (volume, tonePeriodOffset = 0, extra = {}) => ({
  volume,
  amplitudeSlide: 0,
  tonePeriodOffset,
  accumulateTone: false,
  toneEnabled: true,
  noiseEnabled: false,
  hardwareEnvelopeEnabled: false,
  noiseOrEnvelopeBase: 0,
  accumulateNoiseOrEnvelope: false,
  ...extra,
});

/**
 * Instrumentos disenados para este tema (los de percusion se toman tal cual del
 * kit de fabrica PT3_FACTORY_INSTRUMENTS, ver construirBancoDeSamples).
 *
 * - "Neon Void Bass": ataque con el periodo acortado (click de pua sintetica),
 *   cuerpo sostenido a volumen 13 y un batido de +-1 en el bucle que da el
 *   ligero desafinado tipico del bajo synthwave.
 * - "Neon Void Pad": apoyo armonico. Volumen medio (10-13) con tremolo lento y
 *   un desafinado suave para que "respire" por detras del lead.
 */
const INSTRUMENTOS_PROPIOS = {
  [SAMPLE_BAJO]: {
    nombre: 'Neon Void Bass',
    loop: 4,
    pasos: [
      paso(15, -40),
      paso(15, -12),
      paso(15, 0),
      paso(14, 0),
      paso(13, 0),
      paso(13, 1),
      paso(13, 0),
      paso(12, -1),
    ],
  },
  [SAMPLE_ARMONIA]: {
    nombre: 'Neon Void Pad',
    loop: 2,
    pasos: [
      paso(12, 0),
      paso(13, 0),
      paso(12, 2),
      paso(11, 0),
      paso(10, -2),
      paso(11, 0),
    ],
  },
};

/** Instrumentos que se copian del kit de fabrica, por nombre exacto. */
const INSTRUMENTOS_DE_FABRICA = {
  [SAMPLE_LEAD]: 'Mideas Bright Lead',
  [SAMPLE_BOMBO]: 'Mideas Punch Kick',
  [SAMPLE_CAJA]: 'Mideas Dry Snare',
  [SAMPLE_CHARLES]: 'Mideas Closed Hat',
};

// ---------------------------------------------------------------------------
// 4. Carga de los modulos TypeScript del repo (patron de scripts/check_pt3_*)
// ---------------------------------------------------------------------------

/**
 * Empaqueta con esbuild los modulos TS que hacen falta para que el banco de
 * instrumentos salga byte a byte del codigo del repo y no de una copia.
 */
const cargarModulosDelRepo = async () => {
  const salida = join(RAIZ_REPO, 'server', 'temp', 'pt3-neon-void', 'puente_instrumentos.mjs');
  mkdirSync(dirname(salida), { recursive: true });
  await build({
    stdin: {
      contents: [
        "export { PT3_FACTORY_INSTRUMENTS } from './utils/audio/pt3FactoryInstruments';",
        "export { encodePT3SampleLogicalStep } from './components/utils/pt3SampleEngine';",
      ].join('\n'),
      resolveDir: RAIZ_REPO,
      loader: 'ts',
      sourcefile: 'puente_instrumentos.ts',
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

/** Devuelve { id: { nombre, loop, cuerpo: number[] } } con los bytes ya crudos. */
const construirBancoDeSamples = ({ PT3_FACTORY_INSTRUMENTS, encodePT3SampleLogicalStep }) => {
  const banco = {};

  for (const [id, nombre] of Object.entries(INSTRUMENTOS_DE_FABRICA)) {
    const preset = PT3_FACTORY_INSTRUMENTS.find(instrumento => instrumento.name === nombre);
    if (!preset || !preset.pt3Sample) throw new Error(`No existe el instrumento de fabrica "${nombre}".`);
    banco[Number(id)] = {
      nombre,
      loop: preset.pt3Sample.loop,
      cuerpo: preset.pt3Sample.steps.flatMap(pasoSample => [...pasoSample.raw]),
      pasos: preset.pt3Sample.steps.length,
    };
  }

  for (const [id, definicion] of Object.entries(INSTRUMENTOS_PROPIOS)) {
    banco[Number(id)] = {
      nombre: definicion.nombre,
      loop: definicion.loop,
      cuerpo: definicion.pasos.flatMap(logico => encodePT3SampleLogicalStep(logico)),
      pasos: definicion.pasos.length,
    };
  }

  return banco;
};

// ---------------------------------------------------------------------------
// 5. Lectura y limpieza de la transcripcion
// ---------------------------------------------------------------------------

/**
 * Lee el CSV de Basic Pitch. La columna pitch_bend trae un numero VARIABLE de
 * valores extra por fila, asi que solo se parsean las 4 primeras columnas.
 */
const leerNotasCSV = (ruta) => {
  const lineas = readFileSync(ruta, 'utf8').split(/\r?\n/);
  const notas = [];
  for (let i = 1; i < lineas.length; i += 1) {
    const linea = lineas[i].trim();
    if (!linea) continue;
    const campos = linea.split(',');
    const inicio = Number(campos[0]);
    const fin = Number(campos[1]);
    const pitch = Number(campos[2]);
    const velocidad = Number(campos[3]);
    if (!Number.isFinite(inicio) || !Number.isFinite(fin) || !Number.isFinite(pitch)) continue;
    notas.push({ inicio, fin, pitch, velocidad: Number.isFinite(velocidad) ? velocidad : 64, duracion: fin - inicio });
  }
  notas.sort((a, b) => a.inicio - b.inicio || a.pitch - b.pitch);
  return notas;
};

/**
 * Descarta las notas fantasma tipicas de una transcripcion automatica:
 *  a) duraciones por debajo de media fila,
 *  b) velocities muy bajas,
 *  c) armonicos: una nota que empieza a la vez que otra, exactamente 12 o 19
 *     semitonos por encima y con menos energia, es el 2o/3er parcial del mismo
 *     sonido, no una nota real.
 */
const limpiarTranscripcion = (notas) => {
  const descartes = { cortas: 0, flojas: 0, armonicos: 0 };
  const supervivientes = notas.filter((nota) => {
    if (nota.duracion < DURACION_MINIMA_S) { descartes.cortas += 1; return false; }
    if (nota.velocidad < VELOCIDAD_MINIMA) { descartes.flojas += 1; return false; }
    return true;
  });

  const energia = (nota) => nota.velocidad * Math.min(nota.duracion, 0.6);
  const limpias = supervivientes.filter((nota, indice) => {
    for (let j = 0; j < supervivientes.length; j += 1) {
      if (j === indice) continue;
      const otra = supervivientes[j];
      if (Math.abs(otra.inicio - nota.inicio) > VENTANA_SIMULTANEO_S) continue;
      const intervalo = nota.pitch - otra.pitch;
      if (intervalo !== 12 && intervalo !== 19) continue;
      // Solo se cae el parcial si la fundamental tiene mas energia.
      if (energia(otra) > energia(nota)) { descartes.armonicos += 1; return false; }
    }
    return true;
  });

  return { notas: limpias, descartes };
};

// ---------------------------------------------------------------------------
// 6. Cuantizacion a filas de tracker
// ---------------------------------------------------------------------------

/**
 * Busca el desfase de rejilla que minimiza el error medio de cuantizacion de
 * los onsets y devuelve la funcion fila(t). Basic Pitch coloca los tiempos en
 * una rejilla propia de 11.61 ms (hop de 256 muestras a 22050 Hz), asi que el
 * desfase no es cero.
 */
const construirRejilla = (notas, bpm) => {
  const pasoSegundos = 60 / bpm / 4; // semicorchea
  const onsets = [...new Set(notas.map(nota => nota.inicio))];
  let mejor = { desfase: 0, error: Infinity };
  const SUBDIVISIONES = 200;
  for (let k = 0; k < SUBDIVISIONES; k += 1) {
    const desfase = (k / SUBDIVISIONES) * pasoSegundos;
    let error = 0;
    for (const t of onsets) {
      const fila = Math.round((t - desfase) / pasoSegundos);
      error += Math.abs(t - desfase - fila * pasoSegundos);
    }
    error /= onsets.length;
    if (error < mejor.error) mejor = { desfase, error };
  }
  const aFila = (t) => Math.round((t - mejor.desfase) / pasoSegundos);
  // Porcentaje de onsets que caen a menos de 20 ms de su fila: si la rejilla es
  // la buena ronda el 82 %, y con un BPM equivocado baja al ~40 % (suelo).
  const dentroDe20ms = onsets.filter((t) => {
    const fila = Math.round((t - mejor.desfase) / pasoSegundos);
    return Math.abs(t - mejor.desfase - fila * pasoSegundos) < 0.02;
  }).length / onsets.length;
  return { pasoSegundos, desfase: mejor.desfase, errorMedio: mejor.error, dentroDe20ms, aFila };
};

// ---------------------------------------------------------------------------
// 7. Reparto a 3 canales
// ---------------------------------------------------------------------------

const CANALES = ['A', 'B', 'C'];

/**
 * Reparte por registro: el PSG solo admite una nota por canal y fila, y separar
 * por altura mantiene cada voz en su sitio en vez de saltar de canal en canal.
 *   A = melodia (pitch >= LIMITE_AGUDO)
 *   B = bajo    (pitch <  LIMITE_GRAVE)
 *   C = armonia (el registro medio)
 */
const canalDeNota = (pitch) => {
  if (pitch < LIMITE_GRAVE) return 'B';
  if (pitch >= LIMITE_AGUDO) return 'A';
  return 'C';
};

/** Distancia maxima (en filas) a la que la nota anterior sigue "tirando" de la melodia. */
const MEMORIA_MELODICA_FILAS = 8;
/** Penalizacion por semitono de salto respecto a la nota anterior del lead. */
const PESO_CONTINUIDAD = 0.12;

/**
 * Elige que nota se queda cuando varias caen en el mismo canal y la misma fila.
 *
 * Canal A: puntuacion duracion + velocidad - salto respecto a la nota anterior.
 * Quedarse siempre con la mas aguda parece lo natural, pero Basic Pitch cuela
 * parciales sueltos muy arriba (p.ej. un unico MIDI 93 en todo el tema) y esos
 * ganaban siempre. Con la continuidad melodica el salto medio entre notas
 * consecutivas del lead baja de 6.25 a 5.64 semitonos y los saltos de octava
 * exacta (firma del armonico) de 44 a 32.
 * Canal B: la mas grave, que es la fundamental del bajo.
 * Canal C: la mas fuerte, que es la que realmente se oye en el acompanamiento.
 */
const elegirCandidata = (canal, candidatas, pitchAnterior) => {
  if (candidatas.length === 1) return candidatas[0];
  if (canal === 'A') {
    const puntuar = (nota) => (Math.min(nota.duracion, 0.5) / 0.25)
      + 0.02 * nota.velocidad
      - (pitchAnterior === null ? 0 : PESO_CONTINUIDAD * Math.abs(nota.pitch - pitchAnterior));
    return candidatas.reduce((mejor, nota) => (puntuar(nota) > puntuar(mejor) ? nota : mejor));
  }
  return candidatas.reduce((mejor, nota) => {
    // Las notas largas son las musicalmente relevantes; las cortas son residuos.
    if (nota.duracion > mejor.duracion * 1.25) return nota;
    if (mejor.duracion > nota.duracion * 1.25) return mejor;
    if (canal === 'B') return nota.pitch < mejor.pitch ? nota : mejor;
    return nota.velocidad > mejor.velocidad ? nota : mejor;
  });
};

/**
 * Convierte las notas ya cuantizadas en tres rejillas de celdas
 * { note, release, sample, volume } de longitud `numFilas`.
 */
const repartirCanales = (notas, rejilla, numFilas, filaInicial) => {
  const candidatas = { A: [], B: [], C: [] };
  for (const canal of CANALES) candidatas[canal] = Array.from({ length: numFilas }, () => []);
  const elegidas = { A: new Array(numFilas).fill(null), B: new Array(numFilas).fill(null), C: new Array(numFilas).fill(null) };
  const estadisticas = { A: 0, B: 0, C: 0, colisiones: 0, fuera: 0 };

  for (const nota of notas) {
    const fila = rejilla.aFila(nota.inicio) - filaInicial;
    if (fila < 0 || fila >= numFilas) { estadisticas.fuera += 1; continue; }
    const canal = canalDeNota(nota.pitch);
    const filaFin = Math.max(fila + 1, rejilla.aFila(nota.fin) - filaInicial);
    candidatas[canal][fila].push({ ...nota, fila, filaFin });
  }

  // Se recorre en orden de fila para que la continuidad melodica vea la nota anterior ya decidida.
  for (const canal of CANALES) {
    let pitchAnterior = null;
    let filaAnterior = -MEMORIA_MELODICA_FILAS - 1;
    for (let fila = 0; fila < numFilas; fila += 1) {
      const enFila = candidatas[canal][fila];
      if (enFila.length === 0) continue;
      if (enFila.length > 1) estadisticas.colisiones += enFila.length - 1;
      const memoria = fila - filaAnterior <= MEMORIA_MELODICA_FILAS ? pitchAnterior : null;
      const elegida = elegirCandidata(canal, enFila, memoria);
      elegidas[canal][fila] = elegida;
      pitchAnterior = elegida.pitch;
      filaAnterior = fila;
    }
  }

  const celdas = {};
  for (const canal of CANALES) {
    const rejillaCanal = Array.from({ length: numFilas }, () => ({ note: null, release: false, sample: null, volume: null }));
    const sample = canal === 'A' ? SAMPLE_LEAD : canal === 'B' ? SAMPLE_BAJO : SAMPLE_ARMONIA;
    const volumen = canal === 'A' ? VOLUMEN_LEAD : canal === 'B' ? VOLUMEN_BAJO : VOLUMEN_ARMONIA;

    for (let fila = 0; fila < numFilas; fila += 1) {
      const nota = elegidas[canal][fila];
      if (!nota) continue;
      estadisticas[canal] += 1;
      rejillaCanal[fila].note = nota.pitch - MIDI_DE_NOTA_PT3_0;
      rejillaCanal[fila].sample = sample;
      rejillaCanal[fila].volume = volumen;

      // El corte de la nota nunca puede pisar la siguiente nota del canal.
      let siguiente = numFilas;
      for (let k = fila + 1; k < numFilas; k += 1) {
        if (elegidas[canal][k]) { siguiente = k; break; }
      }
      const filaCorte = Math.min(nota.filaFin, siguiente);
      if (filaCorte < numFilas && filaCorte !== siguiente) rejillaCanal[filaCorte].release = true;
    }
    celdas[canal] = rejillaCanal;
  }

  return { celdas, estadisticas };
};

// ---------------------------------------------------------------------------
// 8. Percusion opcional sobre el canal C
// ---------------------------------------------------------------------------

/**
 * Rellena los huecos del canal C con una base 4/4 (bombo en 1 y 3, caja en 2
 * y 4, charles en las corcheas). Solo escribe donde el canal esta libre, asi
 * que la armonia transcrita siempre tiene prioridad. Es contenido anadido, no
 * transcrito: por eso va detras de una opcion y solo se usa en el bucle.
 */
const PATRON_BATERIA = {
  0: { sample: SAMPLE_BOMBO, pitch: 36 },   // C-2
  2: { sample: SAMPLE_CHARLES, pitch: 72 },
  4: { sample: SAMPLE_CAJA, pitch: 52 },    // E-3
  6: { sample: SAMPLE_CHARLES, pitch: 72 },
  8: { sample: SAMPLE_BOMBO, pitch: 36 },
  10: { sample: SAMPLE_CHARLES, pitch: 72 },
  12: { sample: SAMPLE_CAJA, pitch: 52 },
  14: { sample: SAMPLE_CHARLES, pitch: 72 },
};

const anadirPercusion = (celdas, numFilas) => {
  let golpes = 0;
  for (let fila = 0; fila < numFilas; fila += 1) {
    const golpe = PATRON_BATERIA[fila % FILAS_POR_COMPAS];
    if (!golpe) continue;
    const celda = celdas.C[fila];
    if (celda.note !== null) continue;
    celda.note = golpe.pitch - MIDI_DE_NOTA_PT3_0;
    celda.sample = golpe.sample;
    celda.volume = VOLUMEN_PERCUSION;
    celda.release = false;
    golpes += 1;
  }
  return golpes;
};

/** Corta cualquier nota que siga sonando en la ultima fila (para que el bucle empalme). */
const cerrarFinal = (celdas, numFilas) => {
  for (const canal of CANALES) {
    const ultima = celdas[canal][numFilas - 1];
    if (ultima.note === null && !ultima.release) ultima.release = true;
  }
};

// ---------------------------------------------------------------------------
// 9. Codificacion de patrones PT3
// ---------------------------------------------------------------------------

/**
 * Codifica un canal de un patron como stream de comandos PT3:
 *   #D1-#EF  seleccionar sample (comando - #D0)
 *   #40-#4F  seleccionar ornamento
 *   #C1-#CF  volumen de canal
 *   #50-#AF  nota (fin de fila), #C0 note off (fin de fila), #D0 fila vacia
 *   #00      fin de patron
 * Los selectores solo se emiten cuando cambian, igual que hace Vortex; el
 * estado arranca "desconocido" en cada patron para que el patron sea
 * autosuficiente y no dependa de lo que sono en la posicion anterior.
 */
const codificarCanal = (celdas) => {
  const bytes = [];
  let sampleActual = null;
  let volumenActual = null;
  for (const celda of celdas) {
    if (celda.sample !== null && celda.sample !== sampleActual) {
      if (celda.sample < 1 || celda.sample > 31) throw new Error(`Sample ${celda.sample} fuera de rango PT3 (1-31).`);
      bytes.push(0xd0 + celda.sample);
      sampleActual = celda.sample;
    }
    if (celda.volume !== null && celda.volume !== volumenActual) {
      // #C0 es note off, asi que el volumen 0 no es codificable: se usa 1.
      const volumen = Math.max(1, Math.min(15, celda.volume));
      bytes.push(0xc0 | volumen);
      volumenActual = volumen;
    }
    if (celda.note !== null) {
      if (celda.note < 0 || celda.note > 95) throw new Error(`Nota ${celda.note} fuera del rango PT3 (C-1..B-8).`);
      bytes.push(0x50 + celda.note);
    } else if (celda.release) {
      bytes.push(0xc0);
    } else {
      bytes.push(0xd0);
    }
  }
  bytes.push(0x00); // terminador de patron
  return bytes;
};

/** Trocea las tres rejillas en patrones de 64 filas y deduplica los repetidos. */
const construirPatrones = (celdas, numFilas) => {
  const patrones = [];
  const orden = [];
  const indicePorClave = new Map();
  const celdasPorPatron = [];

  for (let inicio = 0; inicio < numFilas; inicio += FILAS_POR_PATRON) {
    const trozo = {};
    for (const canal of CANALES) {
      trozo[canal] = celdas[canal].slice(inicio, inicio + FILAS_POR_PATRON);
      // El ultimo patron se rellena con filas vacias hasta completar 64.
      while (trozo[canal].length < FILAS_POR_PATRON) {
        trozo[canal].push({ note: null, release: false, sample: null, volume: null });
      }
    }
    const streams = { A: codificarCanal(trozo.A), B: codificarCanal(trozo.B), C: codificarCanal(trozo.C) };
    const clave = `${streams.A.join(',')}|${streams.B.join(',')}|${streams.C.join(',')}`;
    let indice = indicePorClave.get(clave);
    if (indice === undefined) {
      indice = patrones.length;
      indicePorClave.set(clave, indice);
      patrones.push(streams);
      celdasPorPatron.push(trozo);
    }
    orden.push(indice);
  }

  return { patrones, orden, celdasPorPatron };
};

// ---------------------------------------------------------------------------
// 10. Ensamblado del fichero PT3
// ---------------------------------------------------------------------------

const escribirAscii = (bytes, offset, texto, longitud) => {
  const relleno = texto.slice(0, longitud).padEnd(longitud, ' ');
  for (let i = 0; i < longitud; i += 1) bytes[offset + i] = relleno.charCodeAt(i) & 0xff;
};

/**
 * Ensambla el modulo completo. Disposicion (identica a la de un .pt3 real):
 *   0-200    cabecera
 *   201..    lista de posiciones (patron * 3) + terminador #FF
 *            tabla de patrones (3 punteros de 16 bits por patron)
 *            streams de los patrones
 *            cuerpos de los samples
 *            cuerpos de los ornamentos
 */
const ensamblarPT3 = ({ titulo, autor, speed, orden, patrones, samples, ornamentos, posicionLoop }) => {
  if (orden.length > 255) throw new Error(`La lista de posiciones (${orden.length}) no cabe en un byte.`);
  if (patrones.length * 3 > 255) throw new Error(`Demasiados patrones (${patrones.length}) para el indice x3 de la lista.`);

  // --- primera pasada: calcular offsets ---
  let cursor = PT3_HEADER_SIZE;
  const offsetListaPosiciones = cursor;
  cursor += orden.length + 1; // + terminador #FF
  const offsetTablaPatrones = cursor;
  cursor += patrones.length * 6;

  const offsetsStreams = patrones.map((streams) => {
    const offsets = {};
    for (const canal of CANALES) {
      offsets[canal] = cursor;
      cursor += streams[canal].length;
    }
    return offsets;
  });

  const offsetsSamples = {};
  for (const [id, sample] of Object.entries(samples)) {
    offsetsSamples[Number(id)] = cursor;
    cursor += 2 + sample.cuerpo.length;
  }

  const offsetsOrnamentos = {};
  for (const [id, ornamento] of Object.entries(ornamentos)) {
    offsetsOrnamentos[Number(id)] = cursor;
    cursor += 2 + ornamento.datos.length;
  }

  // --- segunda pasada: escribir ---
  const bytes = new Uint8Array(cursor);
  escribirAscii(bytes, 0, PT3_FIRMA, 30);
  escribirAscii(bytes, 30, titulo, 32);
  escribirAscii(bytes, 62, ' by ', 4);
  escribirAscii(bytes, 66, autor, 32);
  bytes[98] = 0x20;
  bytes[PT3_TONE_TABLE_OFFSET] = PT3_TONE_TABLE;
  bytes[PT3_SPEED_OFFSET] = speed;
  bytes[PT3_POSITION_COUNT_OFFSET] = orden.length;
  bytes[PT3_LOOP_POSITION_OFFSET] = posicionLoop;
  bytes[PT3_PATTERN_POINTER_OFFSET] = offsetTablaPatrones & 0xff;
  bytes[PT3_PATTERN_POINTER_OFFSET + 1] = (offsetTablaPatrones >> 8) & 0xff;

  for (const [id, offset] of Object.entries(offsetsSamples)) {
    const puntero = PT3_SAMPLE_POINTERS_OFFSET + Number(id) * 2;
    bytes[puntero] = offset & 0xff;
    bytes[puntero + 1] = (offset >> 8) & 0xff;
  }
  for (const [id, offset] of Object.entries(offsetsOrnamentos)) {
    const puntero = PT3_ORNAMENT_POINTERS_OFFSET + Number(id) * 2;
    bytes[puntero] = offset & 0xff;
    bytes[puntero + 1] = (offset >> 8) & 0xff;
  }

  orden.forEach((indice, posicion) => { bytes[offsetListaPosiciones + posicion] = indice * 3; });
  bytes[offsetListaPosiciones + orden.length] = 0xff;

  patrones.forEach((streams, indice) => {
    const base = offsetTablaPatrones + indice * 6;
    CANALES.forEach((canal, k) => {
      const offset = offsetsStreams[indice][canal];
      bytes[base + k * 2] = offset & 0xff;
      bytes[base + k * 2 + 1] = (offset >> 8) & 0xff;
    });
  });

  patrones.forEach((streams, indice) => {
    for (const canal of CANALES) bytes.set(streams[canal], offsetsStreams[indice][canal]);
  });

  for (const [id, sample] of Object.entries(samples)) {
    const offset = offsetsSamples[Number(id)];
    bytes[offset] = sample.loop & 0xff;
    bytes[offset + 1] = (sample.cuerpo.length / 4) & 0xff;
    bytes.set(sample.cuerpo, offset + 2);
  }

  for (const [id, ornamento] of Object.entries(ornamentos)) {
    const offset = offsetsOrnamentos[Number(id)];
    bytes[offset] = ornamento.loop & 0xff;
    bytes[offset + 1] = ornamento.datos.length & 0xff;
    ornamento.datos.forEach((valor, k) => { bytes[offset + 2 + k] = valor & 0xff; });
  }

  return bytes;
};

// ---------------------------------------------------------------------------
// 11. Conversion completa
// ---------------------------------------------------------------------------

/** Nombre PT3 ("C-4") del indice de nota, con el mismo criterio que pt3Parser. */
export const nombreNotaPT3 = (indice) => `${NOMBRES_NOTA[indice % 12]}${Math.floor(indice / 12) + 1}`;

export const PRESETS = {
  completo: {
    titulo: 'Neon Void Runner',
    autor: 'Basic Pitch -> Mideas',
    percusion: false,
    compasInicial: 0,
    compases: null,
    salida: 'test/pt3-neon-void/neon_void_runner.pt3',
  },
  loop: {
    // Compases 16-47: la seccion mas densa del tema (ver README) y multiplo de
    // 4 compases, asi que empieza y acaba en frontera de frase.
    titulo: 'Neon Void Runner (loop)',
    autor: 'Basic Pitch -> Mideas',
    percusion: true,
    compasInicial: 16,
    compases: 32,
    salida: 'test/pt3-neon-void/neon_void_runner_loop.pt3',
  },
};

export const CSV_POR_DEFECTO = 'C:/Users/salam/Downloads/neon_void_runner_basic_pitch/Neon Void Runner_basic_pitch.csv';

/**
 * Ejecuta toda la cadena CSV -> PT3 y devuelve tanto los bytes como la
 * representacion intermedia, para que el harness pueda comprobar el round-trip.
 */
export const convertir = async (opciones = {}) => {
  const {
    csv = CSV_POR_DEFECTO,
    titulo = 'Neon Void Runner',
    autor = 'Basic Pitch -> Mideas',
    percusion = false,
    compasInicial = 0,
    compases = null,
    bpm = BPM_REJILLA,
    speed = PT3_SPEED,
  } = opciones;

  const modulos = await cargarModulosDelRepo();
  const samples = construirBancoDeSamples(modulos);
  // El ornamento 0 (un solo 0) es el "sin ornamento" por defecto del replayer.
  const ornamentos = { 0: { loop: 0, datos: [0] } };

  const crudas = leerNotasCSV(csv);
  const { notas, descartes } = limpiarTranscripcion(crudas);
  const rejilla = construirRejilla(notas, bpm);

  const ultimaFila = Math.max(...notas.map(nota => rejilla.aFila(nota.fin)));
  const filaInicial = compasInicial * FILAS_POR_COMPAS;
  const filasDisponibles = Math.max(0, ultimaFila + 1 - filaInicial);
  const filasPedidas = compases === null ? filasDisponibles : compases * FILAS_POR_COMPAS;
  const numFilas = Math.ceil(Math.min(filasPedidas, filasDisponibles) / FILAS_POR_PATRON) * FILAS_POR_PATRON;

  const { celdas, estadisticas } = repartirCanales(notas, rejilla, numFilas, filaInicial);
  const golpes = percusion ? anadirPercusion(celdas, numFilas) : 0;
  cerrarFinal(celdas, numFilas);

  const { patrones, orden, celdasPorPatron } = construirPatrones(celdas, numFilas);
  const bytes = ensamblarPT3({
    titulo,
    autor,
    speed,
    orden,
    patrones,
    samples,
    ornamentos,
    posicionLoop: 0,
  });

  return {
    bytes,
    orden,
    patrones,
    celdas,
    celdasPorPatron,
    samples,
    ornamentos,
    numFilas,
    speed,
    resumen: {
      notasCSV: crudas.length,
      notasUsables: notas.length,
      descartes,
      bpm,
      speed,
      bpmReproducido: 750 / speed,
      pasoRejillaMs: rejilla.pasoSegundos * 1000,
      desfaseRejillaMs: rejilla.desfase * 1000,
      errorCuantizacionMs: rejilla.errorMedio * 1000,
      onsetsDentroDe20ms: `${(rejilla.dentroDe20ms * 100).toFixed(1)}%`,
      filas: numFilas,
      compases: numFilas / FILAS_POR_COMPAS,
      posiciones: orden.length,
      patronesUnicos: patrones.length,
      notasPorCanal: { A: estadisticas.A, B: estadisticas.B, C: estadisticas.C },
      colisionesResueltas: estadisticas.colisiones,
      notasFueraDelExtracto: estadisticas.fuera,
      golpesPercusion: golpes,
      duracionSegundos: (numFilas * speed) / 50,
      bytesTotales: bytes.length,
    },
  };
};

// ---------------------------------------------------------------------------
// 12. CLI
// ---------------------------------------------------------------------------

const parsearArgumentos = (argv) => {
  const opciones = {};
  for (let i = 0; i < argv.length; i += 1) {
    const argumento = argv[i];
    if (!argumento.startsWith('--')) continue;
    const clave = argumento.slice(2);
    const valor = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    opciones[clave] = valor;
  }
  return opciones;
};

const generarPreset = async (nombrePreset, sobrescrituras = {}) => {
  const preset = PRESETS[nombrePreset];
  if (!preset) throw new Error(`Preset desconocido "${nombrePreset}". Usa: ${Object.keys(PRESETS).join(', ')}`);
  const destino = resolve(RAIZ_REPO, sobrescrituras.out ?? preset.salida);
  const resultado = await convertir({ ...preset, ...sobrescrituras });
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, resultado.bytes);
  console.log(`\n=== preset "${nombrePreset}" -> ${destino} ===`);
  for (const [clave, valor] of Object.entries(resultado.resumen)) {
    console.log(`  ${clave}: ${typeof valor === 'object' ? JSON.stringify(valor) : valor}`);
  }
  return resultado;
};

const esEjecucionDirecta = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (esEjecucionDirecta) {
  const argumentos = parsearArgumentos(process.argv.slice(2));
  const presets = argumentos.preset ? [argumentos.preset] : Object.keys(PRESETS);
  for (const nombrePreset of presets) {
    await generarPreset(nombrePreset, {
      ...(argumentos.csv ? { csv: argumentos.csv } : {}),
      ...(argumentos.out ? { out: argumentos.out } : {}),
      ...(argumentos.speed ? { speed: Number(argumentos.speed) } : {}),
      ...(argumentos.bpm ? { bpm: Number(argumentos.bpm) } : {}),
    });
  }
}

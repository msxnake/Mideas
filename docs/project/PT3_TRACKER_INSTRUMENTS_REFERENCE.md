# PT3-Style Tracker Instruments Reference

Referencia para los instrumentos PSG por pasos de Mideas y su compatibilidad
con flujos de trabajo PT3/Vortex.

## Estado actual

Mideas dispone de dos modos de instrumento PSG:

- `legacy-envelopes`, que mantiene las canciones y presets historicos.
- `pt3-sample`, que ejecuta un programa exacto por tick con tono, volumen,
  ruido, mixer, envelope y acumuladores.

El parser conserva las cuatro bytes originales de cada linea PT3. El engine
TypeScript, el Preview y el runtime Z80 exportado comparten la misma semantica.
La paridad se valida mediante trazas doradas TS/OpenMSX y esta documentada en
`PT3_SAMPLE_RUNTIME_REFERENCE.md`.

## Que hacen los trackers reales

- En PT3/Vortex Tracker II el instrumento no es solo una envolvente ADSR. Cada
  linea del sample controla cambios de tono y volumen, ruido, mascara de mixer
  y uso del envelope hardware.
- Arkos Tracker 2 tambien usa instrumentos basados en macros y automatizaciones
  por tick.
- El timbre resulta de la secuencia temporal completa, no de un valor fijo.

Fuentes:

- Vortex Tracker II: https://github.com/z00m128/vortextracker2
- Vortex Tracker II README: https://github.com/Marian-Vittek/vortextracker2/blob/master/README.txt
- Arkos Tracker 2 manual: https://www.julien-nevo.com/arkostracker/index.php/arkos-tracker-2-user-manual/

## Semantica adoptada en Mideas

- Sample y ornament PT3 se importan como datos editables separados.
- La nota efectiva se limita a 0..95 antes de consultar la tabla tonal.
- El volumen del sample y el volumen del canal se combinan mediante la tabla
  exacta `VT_`.
- El ruido global conserva el arbitraje A->B->C: la ultima peticion gana.
- Las contribuciones al periodo del envelope se suman entre canales.
- `AddToNs` persiste entre frames y se limpia solo al iniciar o reiniciar.
- R13 se escribe solamente cuando hay retrigger para no reiniciar el envelope
  de forma accidental.
- El descriptor legacy se conserva separado y no cambia de sonido.

Siguen fuera de alcance:

- El editor visual de lineas del sample PT3. El editor actual identifica el
  macro y lo conserva al guardar, pero todavia no modifica sus pasos.
- Los efectos de cancion `CurESld`/`CurEDel`; no pertenecen al instrumento.

## Kit PT3 de fabrica

`utils/audio/pt3FactoryInstruments.ts` contiene doce macros originales y
redistribuibles creados para Mideas:

- Mideas Deep Kick y Mideas Punch Kick.
- Mideas Dry Snare y Mideas Wide Snare.
- Mideas Closed Hat y Mideas Open Hat.
- Mideas Rimshot, Mideas Low Tom y Mideas High Tom.
- Mideas Pluck Bass, Mideas Bright Lead y Mideas Laser Zap.

El boton `Add Factory PT3 Kit` del TrackerComposer:

- usa solamente IDs libres entre 1 y 31;
- no sustituye instrumentos existentes;
- instala parcialmente si quedan pocos slots;
- no duplica presets ya instalados;
- selecciona el primer instrumento nuevo para probarlo con el piano.

La suite `scripts/check_pt3_factory_kit.mjs` verifica los doce programas, sus
bytes PT3 sinteticos, loops, silencios finales, comportamiento headless y
serializacion para el runtime ASM.

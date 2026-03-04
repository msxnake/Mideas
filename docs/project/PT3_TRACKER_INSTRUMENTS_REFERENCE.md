# PT3-Style Tracker Instruments Reference

Resumen de referencia para acercar el tracker PSG de Mideas a flujos de trabajo tipo PT3/Vortex/Arkos sin reescribir todavia un motor PT3 completo.

## Que hacen los trackers "reales"

- En PT3/Vortex Tracker II el instrumento no es solo una envolvente ADSR. El editor de sample expone por paso cambios de tono, volumen, ruido, mascara de mixer y uso de envelope hardware, que se reproducen tick a tick.
- En Arkos Tracker 2 el instrumento tambien es macro-based: cada instrumento combina varias pistas de automatizacion y una de ellas controla el ruido (`n`), ademas del software period y el hardware period.
- En ambos casos el timbre real sale de secuencias cortas por tick, no de un unico valor fijo.

Fuentes:

- Vortex Tracker II (repositorio): https://github.com/z00m128/vortextracker2
- Vortex Tracker II README (sample editor, tone/noise/envelope mask): https://github.com/Marian-Vittek/vortextracker2/blob/master/README.txt
- Arkos Tracker 2 manual (instrument tracks y columna `n` para noise): https://www.julien-nevo.com/arkostracker/index.php/arkos-tracker-2-user-manual/
- Arkos Tracker 2 en CPC-Power (import de instrumentos VT2): https://www.cpc-power.com/index.php?page=detail&num=14521

## Decision tomada en Mideas

Implementacion incremental y compatible:

- Se mantiene el descriptor actual de instrumento PSG.
- Se añade `noiseEnvelope` + `noiseLoop` como macro software por tick.
- Esa macro se aplica en el preview WebAudio y en el runtime ASM exportado.
- Los offsets ya existentes del descriptor (flags, volumen, tone env, etc.) se conservan; la nueva macro se serializa al final.

Esto no convierte aun a Mideas en un clon completo de PT3:

- No existe todavia un editor de sample por pasos con mixer mask, acumuladores o comandos.
- No se ha implementado aun la separacion PT3 clasica entre sample y ornament.
- El ruido sigue siendo global en AY/MSX, asi que varias voces con ruido comparten el mismo periodo efectivo.

## Consecuencia practica

La nueva macro de ruido ya permite construir mejores instrumentos de percusion:

- Snare: barrido de ruido rapido hacia valores altos.
- Hi-hat: ruido muy rapido al inicio y cierre agresivo.
- Drum hibrido: tono corto + ruido descendente.

Es un primer paso util para percusion "de verdad" en MSX sin romper el runtime actual.

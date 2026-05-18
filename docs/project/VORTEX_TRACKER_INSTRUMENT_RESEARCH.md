# Vortex Tracker Instrument Research

Notas practicas para acercar los instrumentos PSG de Mideas a la filosofia de Vortex Tracker II / Pro Tracker 3 sin copiar material creativo de canciones concretas.

## Hallazgos

- Vortex Tracker II es un editor PT3 para AY-3-8910, AY-3-8912 y YM2149F. Puede cargar muchos formatos de trackers ZX y guardar como PT3 o como formato temporal de texto.
- En Vortex, el instrumento se edita en la pestana de samples. Una linea tipica tiene mascara de tono, ruido y envolvente (`TNE`), offsets numericos, acumulacion y volumen hexadecimal.
- El sonido "grande" no viene de una onda compleja. Sale de macros cortas por tick: volumen, pitch, ruido, mascara de mixer y envolvente hardware.
- El formato `.VT2` generado por Vortex Tracker 2.5 es, para otros importadores, el mismo contenido que el texto temporal. Arkos Tracker importa `.VT2` generando hasta 64 lineas cuando necesita convertir incrementos/decrementos de pitch, volumen o ruido.
- Arkos descarta algunos datos de hardware/noise/envelope de patrones en su importador porque su arquitectura mueve ese control al instrumento. Esa misma decision aplica a Mideas: conviene absorberlo como preset/macro de instrumento, no como columna suelta en patrones.

Fuentes consultadas:

- https://bulba.untergrund.net/vortex_e.htm
- https://raw.githubusercontent.com/oisee/vti/master/readme.txt
- https://www.julien-nevo.com/arkostracker/index.php/vt2-import/
- https://www.msx.org/forum/msx-talk/graphics-and-music/collection-of-samples-for-vortex-tracker-ii
- https://chipmusic.org/forums/topic/27/vortex-tracker-ii/

## Mapeo a Mideas

Mideas ya cubre buena parte de la arquitectura con `PT3Instrument`:

- `volumeEnvelope` equivale a la curva de amplitud por tick.
- `toneEnvelope` cubre vibrato, caidas de pitch, golpes y arpegios sencillos.
- `noiseEnvelope` cubre barridos de ruido para caja, hihat, toms y efectos.
- `volumeLoop`, `toneLoop` y `noiseLoop` cubren macros sostenidas.
- `ayToneEnabled` y `ayNoiseEnabled` son la mascara de mixer basica.
- `ayEnvelopeShape`, `hardwareEnvelopePeriod` y `hardwareEnvelopeRatio` cubren el truco de envolvente hardware, especialmente leads/bajos tipo buzz.

Lo que falta para una importacion fiel:

- Mascara `TNE` por paso, no solo por instrumento.
- Acumuladores por columna (`^` / `_`) para pitch, noise y volumen.
- Diferenciar mejor "sample" PT3 y "ornament" PT3 clasicos.
- Importador de texto `.VT2` que lea bloques de samples/ornaments y los convierta al modelo Mideas.

## Presets anadidos

Se han agregado plantillas inspiradas en la tecnica VT/PT3, no copiadas de ningun modulo:

- `VT Buzz Lead`: envolvente hardware ligada al tono (`hardwareEnvelopeRatio: 1.0`) y vibrato suave.
- `VT Plucked Bass`: decaimiento seco con caida rapida de pitch.
- `VT Arp Bell`: arpegio corto con envolvente hardware para brillo.
- `VT Noise Snare`: cuerpo tonal mas ruido ascendente.
- `VT Metal Hat`: ruido rapido mezclado con arpegio metalico.
- `VT Hollow Tom`: tom con pitch descendente y cola de ruido.

## Siguiente paso recomendable

Implementar un importador `.VT2` limitado a instrumentos:

1. Leer el archivo como texto.
2. Detectar bloques de samples y ornaments.
3. Convertir cada linea de sample a una fila normalizada: tone mask, noise mask, envelope mask, pitch delta, noise period/delta, volume y acumuladores.
4. Expandir acumuladores a arrays planos de hasta 64 ticks.
5. Guardar como `PT3Instrument` Mideas con `volumeEnvelope`, `toneEnvelope`, `noiseEnvelope`, loops y flags.

Esto permitiria estudiar modulos con permiso o ejemplos libres y traer el caracter sonoro sin depender de copiar canciones completas.

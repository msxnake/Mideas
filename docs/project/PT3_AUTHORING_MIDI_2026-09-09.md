# Composición PT3 y MIDI en Mideas

El objetivo es un editor de composición comparable a Vortex, manteniendo el
player PT3 existente de la ROM. Este cambio no modifica el runtime Z80.

## Flujo disponible

1. Cargar una canción mediante Replace PT3 para estudiar sus patrones, muestras,
   ornamentos, envolventes y efectos. Se conserva el módulo como fuente.
2. Extraer instrumentos desde otro PT3 con Extract Instruments from PT3. En modo
   PT3, el banco se instala también en el binario reproducible.
3. Nueva canción PT3 con este banco crea 64 filas vacías conservando las muestras
   PT3 del banco actual. Si no hay muestras PT3, utiliza el banco original de
   Mideas. La interfaz pide confirmar la sustitución; se puede deshacer.
4. Añadir patrones y editar el orden conserva el backend PT3.
5. Elegir instrumento y canal MIDI, activar MIDI y REC, reproducir y tocar.
   La toma se añade al canal elegido. Al parar, pausar o desarmar REC se confirma
   como una actualización, con patrones y binario coherentes. La primera nota
   declara instrumento y las siguientes pueden heredarlo.
6. Cuantización MIDI permite fila actual o la línea más cercana de una rejilla
   de 1, 2 o 4 filas. Respeta cambios de Speed/SPD y los límites del patrón.
   Grabar duración escribe `===` al soltar (incluido note-on con velocidad cero).
   Un toque corto dura al menos un paso. Soltar una tecla antigua no corta una
   nota posterior del mismo canal. Los cortes no borran notas ya existentes.
7. Activar Solo este patrón permite overdub por vueltas: la toma se prepara
   mientras suena el acompañamiento y entra en una vuelta posterior en cuanto
   está lista. No hace falta parar ni reiniciar el player. El indicador muestra
   la vuelta y la preparación/incorporación de la toma.
8. Exportar PT3 entrega un módulo completo e incluye la toma pendiente.

La captura PT3 consulta el tiempo del player en cada note-on; no usa como reloj
la fila del último render ni el patrón seleccionado para edición. El motor
nativo conserva su flujo anterior.

## Transporte de audio

- El decoder Z80 de Cowbell/Bulba se ejecuta en un Worker y genera el mismo log
  de registros que la integración Cowbell anterior. No se modifica el player
  de la ROM.
- El emulador AY de Cowbell se ejecuta en un AudioWorklet a 50 Hz musicales,
  independientemente de los renders de React. El bucle y la sustitución del log
  se resuelven dentro del procesado de audio conservando la fase del chip.
- Como máximo hay una preparación en curso y una versión más reciente en cola;
  las versiones descartadas no pueden reemplazar una toma posterior.
- Mientras se toca una tecla, el backing de su canal se silencia para no duplicar
  la nota de monitoring. Los otros canales continúan y el mute manual se respeta.
- Parar, pausar, desarmar REC o desconectar/cambiar el dispositivo MIDI finaliza
  las notas retenidas. El binario y la vista se confirman juntos al cerrar la toma.

## Límites actuales

- Esto no representa todavía la paridad funcional completa con Vortex.
- El monitoring inmediato usa el sintetizador de preview de Mideas y sigue
  pendiente trasladarlo también al hilo de audio. El acompañamiento PT3 ya usa
  AudioWorklet; no se afirma paridad acústica del monitoring con la ROM.
- El overdub continuo opera con Solo este patrón. Sin ese modo, el módulo
  confirmado se carga al siguiente Play. Una toma terminada muy cerca del borde
  puede entrar una vuelta después si su preparación no ha acabado a tiempo.
- No hay pedal sustain ni grabación polifónica automática repartida entre A/B/C.
- Un canal AY admite una nota simultánea. Varias entradas en la misma fila y
  canal dejan la última. Los patrones repetidos en el orden comparten datos.
- No se ha validado hardware MPK real ni se ha generado una ROM de prueba en
  esta sesión. No se afirma paridad acústica del monitoring con la ROM.
- Quedan por completar la reducción de repintados de la cuadrícula, el monitoring
  fuera del hilo principal y herramientas de edición de bloques.

## Validación

- `npm run test:pt3-recording`: módulo nuevo, banco original e importado de un
  PT3 real, persistencia de toma, herencia INS, preservación de otros canales y
  muestras, orden multipatrón y rechazo de datos inválidos.
- `node scripts/check_pt3_live_recording_ui.mjs`: requiere Vite en localhost:3000;
  monta TrackerComposer en un navegador aislado con Web MIDI simulado, graba dos
  notas y una liberación cuantizadas sobre B, comprueba que A suena en la siguiente
  vuelta y que B se conserva en el binario al parar; añade un patrón sin cambiar
  al motor nativo. No modifica proyectos del usuario.
- `npm run test:pt3-worklet`: compara el audio de un intercambio de toma con una
  secuencia continua, muestra por muestra a 44.1, 48 y 11.025 kHz; comprueba pausa.
- `node scripts/check_pt3_decoder_ui.mjs`: compara todos los bytes del log del
  Worker con el decoder Cowbell original para un PT3 creado y otro importado
  (384 y 8964 frames respectivamente).
- Contratos existentes de entrada de notas, preview flush y efectos PT3 verdes.
- Typecheck de TrackerComposer, las utilidades nuevas y sus dependencias verde.
  El chequeo global agotó memoria; se limitó a estos puntos de entrada.
- `npm run build`: compilación de producción correcta.

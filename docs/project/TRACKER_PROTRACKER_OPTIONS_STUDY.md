# Tracker Protracker Options Study

Estudio practico de la interfaz mostrada en la captura de Protracker 3.61 y de como sus ideas pueden traducirse a Mideas. El objetivo no es clonar un tracker Amiga/MOD, sino identificar opciones de alto valor para evolucionar el tracker MSX/PT3/SCC de Mideas.

## Lectura general de la captura

La pantalla concentra casi todo el flujo musical en una unica vista:

- Cabecera de modulo: nombre, autor/creditos, fecha, tiempo y posicion de reproduccion.
- Transporte: play, stop, continue, record, edit, setup y operaciones de patron.
- Navegacion musical: posicion, patron, longitud, fichero, sample activo, volumen, finetune y repeticion.
- Editor de muestras: load sample, kill sample, sampler, longitud y loop.
- Opciones de transformacion: filter, boost, interpol, normalize, backwards, halver, grab, mix.
- Tabla de patrones: cuatro canales, filas, nota, sample/instrumento y parametros de efecto.
- Comandos de edicion por bloque: insert, delete, clear, cut, copy, paste, flip, exchange, octave up/down, note up/down, scroll up/down, rotate up/down.
- Medidores visuales: forma de onda, actividad por canal y estado de reproduccion.

La fuerza de la UI viene de tres decisiones:

1. Todas las acciones importantes estan a un click o tecla.
2. Los cambios destructivos o transformadores operan sobre contextos claros: muestra, patron, canal o bloque.
3. El tracker muestra estado musical real mientras se edita: posicion, patron, tempo, volumenes y actividad por canal.

## Opciones visibles y valor para Mideas

### 1. Transporte y modos de reproduccion

Opciones observadas:

- `PLAY`: reproduce desde la posicion actual o patron actual.
- `STOP`: detiene la reproduccion.
- `CONTINUE`: reanuda desde el punto detenido.
- `RECORD`: entrada en vivo desde teclado.
- `EDIT`: modo de edicion directa de patrones.
- `PATTERN`: reproduccion centrada en patron.
- `CLEAR`: limpieza del contexto seleccionado.

Valor para Mideas:

- Mideas ya tiene `Play Pattern`, stop/silence e import PT3 externo, pero puede ganar mucho con modos separados:
  - `Play Song`: reproduce el orden completo.
  - `Play Pattern`: reproduce solo el patron actual en bucle.
  - `Play From Row`: arranca en la fila seleccionada.
  - `Continue`: reanuda sin reiniciar envelopes/instrumentos si el backend lo permite.
  - `Record Step`: entrada por teclado que avanza segun `Step`.
  - `Record Live`: cuantiza notas capturadas en tiempo real a filas.

Prioridad recomendada: alta para `Play Song`, `Play Pattern`, `Play From Row` y `Record Step`; media para `Continue` y `Record Live`.

### 2. Navegacion de cancion: posicion, patron y longitud

Opciones observadas:

- `POS`: posicion dentro de la lista de orden.
- `PATTERN`: patron referenciado por la posicion.
- `LENGTH`: longitud de la cancion.
- Flechas de incremento/decremento en cada valor.
- Estado inferior con `PLAY MODULE`.

Valor para Mideas:

- Mideas ya modela `order`, `lengthInPatterns`, `restartPosition`, `currentPatternIndexInOrder` y `currentPatternId`.
- Conviene reforzar la UI con un panel de orden mas operativo:
  - lista vertical de posiciones;
  - patron asignado por posicion;
  - botones de insertar, duplicar, borrar y mover;
  - `restartPosition` visible como marcador de loop;
  - contador de tiempo estimado basado en BPM, speed, filas y orden.

Prioridad recomendada: alta. Es una mejora de composicion muy rentable y no exige cambiar el runtime.

### 3. Control de tempo: speed, BPM y timing

Opciones observadas:

- `SPEED 125` en la zona MOD2SAMP.
- BPM visible a la derecha.
- Tiempo de reproduccion visible.

Nota: en Protracker clasico, tempo y speed tienen semantica distinta a PT3. En Mideas ya existe `bpm` y `speed` en `TrackerSongData`.

Valor para Mideas:

- Mantener `speed` como ticks por fila para el tracker nativo.
- Mostrar tiempo estimado de cancion y patron.
- Mostrar cadencia efectiva:
  - PAL 50 Hz;
  - NTSC 60 Hz si se soporta;
  - filas por segundo calculadas.
- Evitar que la reproduccion en ROM dependa del loop de juego; debe seguir la regla documentada en `PT3_PLAYBACK_TIMING_REFERENCE.md`.

Prioridad recomendada: alta para tiempo estimado y display PAL/NTSC; critica para cualquier cambio de runtime musical.

### 4. Editor de patrones por canales

Opciones observadas:

- Cuatro tracks MOD, cada uno con nota e informacion compacta: nota, sample, efecto y parametro.
- Filas numeradas.
- Cursor de edicion muy claro.
- Columnas verticales fijas y densas.

Equivalente en Mideas:

- PSG: 3 canales A/B/C.
- SCC: 5 canales.
- Celda actual: `note`, `instrument`, `ornament`, `volume`.

Opciones que conviene implementar:

- Cursor por subcampo: nota, instrumento, ornament, volumen, efecto.
- Entrada hexadecimal o decimal segun campo.
- Modo `follow playback`: el cursor o marcador sigue la fila que suena.
- Seleccion rectangular de filas/canales.
- Edicion por teclado tipo tracker:
  - notas con teclado de piano;
  - borrar nota;
  - subir/bajar semitono;
  - subir/bajar octava;
  - copiar/pegar bloque;
  - interpolar volumen o pitch en seleccion.

Prioridad recomendada: alta para seleccion rectangular y operaciones de bloque; media para subcampos avanzados y follow playback.

### 5. Operaciones de bloque

Opciones observadas:

- `INSERT`, `DELETE`, `CLEAR`.
- `CUT`, `COPY`, `PASTE`.
- `FLIP`, `EXCHG`.
- `OCT.UP`, `OCT.DN`.
- `NOTE UP`, `NOTE DN`.
- `SCR.UP`, `SCR.DN`.
- `ROT.UP`, `ROT.DN`.

Interpretacion practica:

- `INSERT/DELETE`: desplazan filas dentro del patron.
- `CLEAR`: vacia seleccion o canal.
- `CUT/COPY/PASTE`: portapapeles tracker.
- `FLIP`: invierte el orden temporal del bloque.
- `EXCHG`: intercambia canales o bloques.
- `OCT/NOTE`: transpone.
- `SCR`: desplaza contenido y descarta lo que sale.
- `ROT`: desplaza contenido circularmente.

Valor para Mideas:

Estas opciones son de maxima rentabilidad porque no dependen del motor de audio. Solo manipulan `TrackerPattern.rows`.

Implementacion recomendada:

- Crear utilidades puras sobre patrones:
  - `copyPatternSelection`;
  - `pastePatternSelection`;
  - `clearPatternSelection`;
  - `transposePatternSelection`;
  - `shiftPatternSelection`;
  - `rotatePatternSelection`;
  - `flipPatternSelection`;
  - `exchangeChannelsOrSelection`.
- Cubrirlas con tests unitarios porque son funciones de datos y es facil romper bordes.
- Soportar portapapeles interno primero; portapapeles del sistema despues.

Prioridad recomendada: muy alta.

### 6. Gestion de samples e instrumentos

Opciones observadas:

- `SAMPLE 01`.
- `LENGTH`.
- `REPEAT`.
- `REPLEN`.
- `VOLUME`.
- `FINETUNE`.
- `LOAD SAMPLE`.
- `KILL SAMPLE`.
- `SAMPLER`.

En Protracker esto opera sobre muestras PCM. En Mideas el equivalente depende del backend:

- PSG: instrumento macro por ticks (`volumeEnvelope`, `toneEnvelope`, `noiseEnvelope`, loops, mixer, hardware envelope).
- SCC: wavetable de 32 muestras, volumen y envelope.
- PT3 externo: datos importados, con edicion limitada si no se parsea el formato.

Traduccion a Mideas:

- Para PSG:
  - `Sample` debe llamarse `Instrument` o `Macro`.
  - `Length` = longitud de macro.
  - `Repeat/Replen` = loop start y longitud de loop.
  - `Volume` = volumen base o envelope.
  - `Finetune` = offset fino de tono o detune por instrumento.
  - `Load/Kill` = importar/eliminar preset.
  - `Sampler` = editor visual de macro PSG.
- Para SCC:
  - `Length` fijo 32 para wavetable.
  - `Repeat` no aplica a la onda, pero si al envelope.
  - `Finetune` puede ser offset por instrumento.

Prioridad recomendada: alta para un editor PSG macro por pasos; media para detune/finetune por instrumento; baja para nombres heredados tipo `sample` si confunden.

### 7. Opciones de transformacion de sample

Opciones observadas:

- `FILTER`.
- `BOOST`.
- `INTERPOL`.
- `NORMALIZE`.
- `BACKWARDS`.
- `HALVER`.
- `GRAB`.
- `MIX`.

Traduccion para Mideas:

- `NORMALIZE`:
  - PSG: escalar envelope de volumen a 0-15 conservando forma.
  - SCC: escalar wavetable a rango -128..127 sin clipping.
- `BOOST`:
  - PSG: aumentar volumen de macro hasta limite.
  - SCC: ganancia con saturacion controlada.
- `FILTER`:
  - PSG: suavizar cambios bruscos de `toneEnvelope` o `noiseEnvelope`.
  - SCC: suavizado de wavetable.
- `INTERPOL`:
  - PSG: generar pasos intermedios entre puntos de macro.
  - SCC: interpolar wavetable o envelope.
- `BACKWARDS`:
  - PSG: invertir macro de volumen/tono/ruido.
  - SCC: invertir wavetable.
- `HALVER`:
  - PSG: reducir resolucion o dividir valores por 2.
  - SCC: reducir amplitud.
- `GRAB`:
  - Mideas: capturar instrumento desde seleccion/patron o importar desde PT3/VT2.
- `MIX`:
  - PSG: combinar macros de dos instrumentos con reglas por columna.
  - SCC: mezclar dos wavetables.

Prioridad recomendada:

- Alta: normalize, reverse/backwards, interpolate.
- Media: boost, filter, halve.
- Baja al inicio: mix y grab, salvo que se enfoque como importador de instrumentos.

### 8. Visualizacion de actividad

Opciones observadas:

- Mini ondas arriba.
- Barras verticales de actividad por canal en la tabla.
- Estado de reproduccion.
- Memoria libre: chip/fast/public.

Valor para Mideas:

- Para un tracker MSX, la visualizacion debe ayudar a depurar sonido y exportacion:
  - medidor por canal PSG/SCC;
  - nota efectiva por canal;
  - instrumento activo;
  - volumen efectivo;
  - noise period efectivo;
  - mixer tone/noise activo;
  - hardware envelope shape/period activo;
  - contador de tick/fila/patron.
- En ROM/export:
  - memoria ocupada por musica;
  - bytes por cancion;
  - bytes por instrumento;
  - coste estimado por frame si se conoce.

Prioridad recomendada: media-alta. No compone por si sola, pero acelera mucho la depuracion.

### 9. Mod2Samp como inspiracion, no como objetivo directo

Opciones observadas:

- `MOD2SAMP OPTIONS`.
- `NOTE`, `PATTERN`, `STARTP`, `ENDPOS`, `SAMPLE`, `SPEED`.
- Render/export de un modulo a sample con filtros y normalizacion.

En Mideas esto podria reinterpretarse asi:

- Renderizar una macro/instrumento a vista previa.
- Convertir una frase de patron en un instrumento o SFX.
- Exportar una seleccion musical como SFX PSG.
- Crear preview offline para comparar native tracker vs external PT3.

Prioridad recomendada: media. Es potente, pero conviene implementarlo despues de operaciones de bloque e instrumentos macro.

## Gap frente al tracker actual de Mideas

Estado local observado en el codigo:

- `TrackerSongData` ya tiene `patterns`, `order`, `lengthInPatterns`, `restartPosition`, `instruments`, `ornaments`, `bpm`, `speed`, `globalVolume`, backend `native`/`external-pt3`.
- `PT3Instrument` ya soporta `volumeEnvelope`, `toneEnvelope`, `noiseEnvelope`, loops, mixer PSG basico y hardware envelope.
- `TrackerCell` todavia es compacto: nota, instrumento, ornament y volumen. No hay columna explicita de efecto/parametro.
- La UI de cabecera ya cubre chip, BPM, speed, rows, step, volumen, HW envelope, noise, mute, sample song, import PT3, play pattern y silence.

Gaps principales:

- Falta una UI de orden/pattern list con edicion rapida.
- Falta seleccion rectangular robusta en patrones.
- Faltan operaciones de bloque estilo tracker clasico.
- Falta editor de instrumento PSG por pasos con vista tipo macro.
- Falta una columna de efectos o un sistema equivalente.
- Falta inspeccion visual de estado efectivo por canal durante playback.
- Falta importacion parcial de instrumentos desde formatos de texto tipo VT2/PT3 si se decide ir por esa ruta.

## Propuesta de implementacion por fases

### Fase 1: productividad del editor

Objetivo: que componer sea mas rapido sin tocar runtime.

Implementar:

- Seleccion rectangular en patron.
- Copy/cut/paste/clear.
- Insert/delete row.
- Transpose note up/down.
- Transpose octave up/down.
- Shift up/down.
- Rotate up/down.
- Flip selection.
- Exchange channel/selection.

Riesgo: bajo.

Pruebas:

- Tests unitarios sobre patrones con PSG 3 canales y SCC 5 canales.
- Casos con celdas vacias, notas nulas, seleccion parcial y bordes del patron.

### Fase 2: orden y navegacion de cancion

Objetivo: componer estructura completa, no solo patrones aislados.

Implementar:

- Panel de orden con posiciones.
- Insertar/duplicar/borrar/mover posiciones.
- Asignar patron por posicion.
- Marcador de restart/loop.
- Play song y play from order position.
- Tiempo estimado de cancion.

Riesgo: bajo-medio por interaccion con playback preview.

### Fase 3: instrumentos PSG macro

Objetivo: capturar lo que hace grande a PT3/Vortex: timbre por ticks.

Implementar:

- Editor de pasos para `volumeEnvelope`, `toneEnvelope`, `noiseEnvelope`.
- Loop start por macro.
- Toggle tone/noise por paso o como minimo por instrumento.
- Preview de instrumento aislado con nota seleccionable.
- Operaciones: normalize, reverse, interpolate, halve, smooth/filter.
- Presets de percusion, bajo, lead, arpegio y efectos.

Riesgo: medio, porque afecta preview y generador ASM.

Nota: el documento `VORTEX_TRACKER_INSTRUMENT_RESEARCH.md` ya apunta en esta direccion.

### Fase 4: efectos de patron

Objetivo: acercar la expresividad tracker sin romper el modelo actual.

Implementar primero un set pequeno:

- Portamento up/down.
- Tone slide to note.
- Vibrato por celda o por instrumento.
- Volume slide.
- Set speed.
- Pattern break/jump si la arquitectura de orden lo soporta.

Diseno recomendado:

- Extender `TrackerCell` con `effectCode?: string | null` y `effectParam?: number | null`.
- Mantener compatibilidad con proyectos antiguos.
- Preview WebAudio y runtime ASM deben compartir semantica documentada.

Riesgo: alto si se implementa sin tests y sin contrato de runtime. Hacerlo despues de fases 1-3.

### Fase 5: importadores y conversiones

Objetivo: aprovechar ecosistema tracker sin depender de reescribir todo.

Implementar:

- Importador VT2 limitado a instrumentos.
- Importador PT3 externo ya existente, pero con inspeccion basica de metadata si es viable.
- Convertir seleccion de patron a SFX.
- Exportar/importar presets de instrumentos en JSON.

Riesgo: medio-alto por formatos externos y expectativas de fidelidad.

## Ranking de opciones para implementar

1. Operaciones de bloque: copy, paste, clear, transpose, shift, rotate, flip.
2. Panel de orden completo con restart/loop y play song.
3. Editor PSG macro por pasos.
4. Normalize, reverse e interpolate para macros/instrumentos.
5. Visualizacion de canal efectivo durante playback.
6. Play from row/order position y follow playback.
7. Efectos de patron minimos.
8. Importador VT2 limitado a instrumentos.
9. Convertir seleccion musical a SFX.
10. Mix/grab avanzados.

## Decisiones de producto recomendadas

- Usar terminologia Mideas, no terminologia MOD cuando cree confusion. Por ejemplo, `Instrument` o `Macro` es mejor que `Sample` para PSG.
- Mantener la densidad tracker, pero no replicar botones pequeños sin necesidad. Mideas puede tener paneles con atajos y menus contextuales.
- Implementar primero operaciones que solo transforman datos. Dan valor inmediato y tienen bajo riesgo.
- No mezclar soporte PT3 externo con el tracker nativo sin una frontera clara. `external-pt3` debe seguir siendo backend propio.
- Documentar cualquier efecto de patron como contrato, porque WebAudio preview y ASM deben sonar igual en lo importante.
- Preservar `music_play_track`, `music_update`, `music_stop`, `music_mute` y `music_resume` como API publica del runtime.

## Checklist para convertir este estudio en tareas

- Crear modulo de utilidades puras para selecciones de patrones.
- Anadir tests de transformaciones de patron.
- Disenar modelo de seleccion rectangular en UI.
- Anadir panel de orden si el actual no cubre edicion completa.
- Disenar editor de macro PSG en torno a `PT3Instrument`.
- Definir contrato de efectos antes de tocar ASM.
- Revisar generador ASM al ampliar instrumentos o efectos.
- Actualizar docs de audio al cerrar cada fase.


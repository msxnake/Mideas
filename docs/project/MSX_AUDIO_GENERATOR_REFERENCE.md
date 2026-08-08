# MSX Audio Generator Reference

Referencia rápida del pipeline ASM actual para proyectos Mideas que generan ROM MSX, con foco en el camino de audio/música. Este documento cubre los generadores reales de `utils/msxGenerator/` y deja explícitos los puntos de entrada del runtime musical para proyectos JSON "solo música".

## Inventario actual del pipeline

El entry point real es [utils/msxGenerator/index.ts](/c:/Users/salam/Documents/Programacion/Mideas/utils/msxGenerator/index.ts). A fecha de marzo de 2026 ya no estamos en el modelo antiguo de 13 módulos: el pipeline coordina más generadores y varios son opcionales o especializados.

Generadores ASM registrados hoy:

- `biosGenerator.ts` -> `bios.asm`
- `constantsGenerator.ts` -> `constants.asm`
- `variablesGenerator.ts` -> `variables.asm`
- `mapperGenerator.ts` -> `mapper.asm`
- `interruptGenerator.ts` -> `interrupt.asm`
- `headerGenerator.ts` -> `header.asm`
- `patternsGenerator.ts` -> `patterns.asm`
- `colorsGenerator.ts` -> `colors.asm`
- `componentsGenerator.ts` -> `components.asm` (o se integra dentro de `interrupt.asm` si `interruptDrivenComponents=true`)
- `entitiesGenerator.ts` -> `entities.asm`
- `worldGenerator.ts` -> `worlds.asm`
- `screensGenerator.ts` -> `screens.asm`
- `spritesGenerator.ts` -> `sprites.asm`
- `fontGenerator.ts` -> `font.asm`
- `hudGenerator.ts` -> `hud.asm`
- `menusGenerator.ts` -> `menus.asm`
- `soundGenerator.ts` -> `sound.asm`
- `sccSoundGenerator.ts` -> backend SCC integrat dins `sound.asm` quan els tracks són SCC
- `scrollGenerator.ts` -> `scroll.asm`
- `animatedTilesGenerator.ts` -> `animtiles.asm`
- `stateMachineGenerator.ts` -> `statemachine.asm`
- `gameFlowGenerator.ts` -> `gameflow.asm`
- `mainGenerator.ts` -> `main.asm`
- `unifiedGenerator.ts` -> `unitedFiles.asm` cuando se pide salida unificada

## Generadores nuevos o poco documentados detectados

Comparando el pipeline real con la documentación histórica, estos módulos eran los menos cubiertos por docs de proyecto y conviene tratarlos como "nuevos" a efectos de mantenimiento:

- `soundGenerator.ts`: dispatch PSG/PT3/SCC, runtime PSG i efectes.
- `sccSoundGenerator.ts`: serialització de tracks SCC, waveforms i runtime K051649 de cinc canals.
- `worldGenerator.ts`: arranque de pantallas/mundos y helpers de transición.
- `scrollGenerator.ts`: soporte de scroll horizontal/vertical.
- `animatedTilesGenerator.ts`: actualización de tiles animados por frame.
- `interruptGenerator.ts`: scheduler/task dispatcher con contratos de registros explícitos.

No todos necesitan una guía completa en la misma sesión, pero el de audio sí, porque un proyecto solo con música depende de él directamente.

## Camino mínimo para un proyecto JSON "solo música"

Aunque el JSON no tenga tiles, sprites ni gameplay, el export ASM sigue montando la infraestructura base de ROM. El subconjunto realmente relevante para audio es:

- `header.asm`: cabecera ROM.
- `bios.asm`: wrappers BIOS (`WRTPSG`, `GICINI`, etc.).
- `constants.asm`: tipos de nodos y constantes de runtime.
- `variables.asm`: reserva de RAM con `EQU`, incluyendo el bloque `music_*`.
- `sound.asm`: runtime PSG y tablas tracker.
- `gameflow.asm`: nodos de Music si el proyecto usa Game Flow.
- `statemachine.asm`: acciones `Action_PlayMusic`, `Action_MuteMusic`, `Action_StopMusic` si el proyecto usa state machines.
- `main.asm`: orden de `include` y arranque global.

El resto de archivos puede salir casi vacío o con stubs, pero siguen formando parte del build modular.

## Runtime musical generado por `soundGenerator.ts`

Archivo fuente: [soundGenerator.ts](/c:/Users/salam/Documents/Programacion/Mideas/utils/msxGenerator/generators/soundGenerator.ts)

### Responsabilidades

- Serializa tracks PSG (`analysis.tracks`) en tablas ROM.
- Emite primitivas PSG de bajo nivel (`psg_write`, `psg_set_tone`, `psg_set_volume`, `psg_set_mixer`).
- Expone SFX simples y el runtime tracker "Phase 1".
- Mantiene el estado musical en RAM usando símbolos `music_*` definidos en `variables.asm`.
- Quan tots els tracks musicals són SCC natius, delega en `sccSoundGenerator.ts`
  i manté la mateixa API pública `music_*`. Els efectes PSG continuen disponibles.

### Backend SCC Konami

- Requereix `targetFormat=konami`; aquest target emet el mapper Konami SCC de
  8 KB amb registres `#7000/#9000/#B000`.
- La ruta bitmap Konami admite tracks SCC, tracks PSG nativos y tracks duales
  `PSG+SCC` dentro de la misma ROM. Un track `external-pt3` source-faithful no
  se mezcla con esos backends nativos en esa ruta.
- Si una canción PSG o `PSG+SCC` supera el espacio útil de un banco de 8 KB,
  `sccSoundGenerator.ts` duplica descriptor, tablas e instrumentos y reparte
  los cuerpos de patrón entre varios bancos. En canciones duales, cada unidad
  contiene juntos los cuerpos SCC y PSG del mismo patrón; la tabla de bancos
  del PSG gobierna el cambio para ambos reproductores.
- El orden `scc_music_update` seguido de `psg_music_update` es un invariante del
  patrón multibanco dual: SCC resuelve primero la dirección de la próxima fila
  y PSG selecciona después el banco que ambos leerán en el frame siguiente.
- `music_update` SCC s'executa al mainline sincronitzat amb `HALT`, mai dins
  `H.TIMI`, perquè pot carregar una waveform de 32 bytes.
- Cada accés SCC exposa temporalment el banc `#3F` a P2 i restaura el banc
  anterior des de la pila. El mirror `mapper_bank_p2_current` queda coherent.
- Els canals lògics 4 i 5 comparteixen waveform com al SCC original; el cache
  del runtime també és compartit per evitar saltar una recàrrega necessària.
- El volum global del tracker es preaplica a volums i envelopes durant la
  serialització. Una envelope sense loop conserva l'últim valor.
- La RAM SCC (`scc_music_*`, `scc_ch_*`) es reserva dinàmicament a
  `variables.asm` només quan hi ha tracks SCC exportables.

### Estado RAM requerido

Las variables que consume `sound.asm` se generan en [variablesGenerator.ts](/c:/Users/salam/Documents/Programacion/Mideas/utils/msxGenerator/generators/variablesGenerator.ts) e incluyen:

- `music_active`, `music_muted`, `music_loop`
- `music_track_index`
- `music_row_frames`, `music_row_countdown`
- `music_order_pos`, `music_pattern_index`, `music_pattern_row`, `music_pattern_rows`
- `music_track_ptr_l/h`, `music_pattern_ptr_l/h`
- `music_mixer_shadow`
- `music_ch_*` para canales `a`, `b`, `c` (note, instrument, ornament, volume y steps de volumen, tono, ruido y ornament)

Si falta este bloque RAM, el runtime compila pero no funciona correctamente.

### API pública del runtime musical

Estas son las rutinas que otros generadores pueden llamar sin conocer el layout interno de track tables:

1. `init_sound_system`
   Inicializa PSG por BIOS (`GICINI`), limpia estado SFX y resetea todo el tracker musical.

2. `music_play_track`
   Entrada directa para empezar un track.
   Contrato:
   `A = track index`, `B bit 0 = loop`.

3. `music_execute_command`
   Entrada compacta usada por Game Flow.
   Contrato:
   `DE -> [command, trackIndex, loopFlag]`.
   Comandos:
   `0=stop`, `1=play`, `2=mute`, `3=resume`, `#FF=no-op`.

4. `music_update`
   Debe llamarse una vez por frame del juego o menú. Refresca PSG y consume la siguiente fila tracker cuando el contador vence.

5. `music_stop`
   Resetea el estado y silencia canales.

6. `music_mute` / `music_resume`
   Pausa o reexpone audio sin perder el estado de reproducción actual.

### Tick de audio actual

Tras las pruebas reales de marzo de 2026, el tick musical ya no debe depender solo de `task_update_music` en `H.TIMI`.

- `header.asm` sigue haciendo `music_init_system` al arrancar.
- Los tracks internos del tracker de Mideas no auto-registran el task de audio por defecto: `gameflow.asm` llama `music_update` desde los bucles sincronizados con `HALT`.
- Los tracks `external-pt3` en ROM lineal si auto-registran `music_update` en `H.TIMI` por defecto, salvo que `interruptConfig.enableAudioTask` se fuerce explicitamente a `false`.
- Los tracks `external-pt3` en MegaROM usan por defecto el tick del bucle `HALT`, porque cambiar bancos para ejecutar el replayer dentro de `H.TIMI` puede desestabilizar MSX2. Se puede forzar el comportamiento antiguo con `interruptConfig.enableAudioTask=true`.
- Si el proyecto usa state machines con sonido, esos mismos bucles llaman tambien `SM_UpdateSound`.

Motivo:

- En proyectos GameFlow minimos con PT3 externo se observo reproduccion muda cuando todo el avance musical dependia del hook IRQ; por eso el wrapper comun `task_audio_tick` se mantiene disponible tanto para IRQ como para bucles HALT.
- En juegos pesados con PT3 externo, dejar `PT3_PLAY/PT3_ROUT` en el loop de gameplay hace que la musica herede cualquier frame lento. Por defecto los PT3 externos vuelven a tick fijo por `H.TIMI`, pero el task de IRQ llama solo a `music_update`; `SM_UpdateSound` y SFX quedan fuera del hook para no ampliar el coste ni la superficie de corrupcion.

### Regla PT3 externa

Para el backend `external-pt3` hay dos invariantes que no deben romperse:

- Si `externalPt3HasHeader=false`, la tabla debe apuntar a `track_label - 99`.
  Motivo: el bloque serializado empieza en el byte original 99 del fichero PT3. `PT3_INIT` suma 100 y espera leer la velocidad en el byte original 100, asi que hay que reconstruir la base original del modulo.
- `music_update` debe envolver `PT3_INIT`, `PT3_PLAY` y `PT3_ROUT` con `DI/EI` cuando se llamen desde el loop principal.
  Motivo: `PT3_ROUT` escribe PSG directamente por puertos y no debe quedar interrumpido a mitad de frame.
- `init_sound_system` debe inicializarse en el boot global y no dentro de `init_game_systems`.
  Motivo: en proyectos `Start -> Music -> WorldLink`, reinicializar sonido al entrar al mundo apaga la cancion recien arrancada.

### Regla de validacion de assets PT3

La validez del runtime PT3 no debe juzgarse con una sola cancion de procedencia dudosa.

Proceso recomendado:

1. Probar una ROM de control con un `.99` conocido bueno.
2. Probar una cancion de referencia de una carpeta fiable.
3. Solo si ambas fallan, volver al runtime/generador.

Hallazgo practico de esta sesion:

- `mideas_known_good.99` si reproduce.
- `CASTLEVA/ending.pt3` tambien reproduce tras strip de 99 bytes.
- Por tanto, si un proyecto concreto sigue mudo con otro asset, el problema probablemente esta en ese modulo PT3 importado.

### Regla PT3 en MegaROM

Las pistas `external-pt3` source-faithful no pasan por la compresion ZX0 generica
de recursos. Sus bloques `pt3_track_<n>_bank_0` y
`pt3_track_<n>_bank_1` se leen directamente desde los bancos del mapper por el
replayer, y ambos labels deben conservarse en el ASM final.

### Flujo interno

El flujo normal del tracker es:

1. `music_play_track` valida índice y carga el puntero base del track.
2. `music_apply_row` resuelve order -> pattern -> row actual.
3. `music_apply_channel_cell` cachea la fila y, cuando entra una nota nueva, rearma la envolvente hardware del PSG si el instrumento la usa (`ayEnvelopeShape`).
4. `music_update_channel_effects` empuja el estado cacheado al PSG.
   Si el instrumento define `noiseEnvelope`, esta fase avanza una macro de ruido software y reprograma el periodo de ruido del PSG.
5. `music_update` repite el ciclo una vez por frame y decide cuándo avanzar de fila.

El diseño actual es deliberadamente simple: el estado activo se cachea en RAM y las tablas largas viven en ROM.
Limitación relevante: la envolvente hardware del AY sigue siendo global (como en el chip real), así que si varias voces la disparan a la vez, la última nota que la rearma domina la forma/periodo activos.
El generador de ruido también es global (registro 6 del PSG), así que si varios canales usan ruido con macros distintas en el mismo frame, prevalece el último canal actualizado.
Además, el valor `hardwareEnvelopePeriod` del editor no se copia 1:1 al PSG: el export lo reescala para aproximar la cadencia del preview de PC, que avanza esa envolvente con ticks software mucho más lentos que el hardware real.

## Integración con Game Flow

Archivo fuente: [gameFlowGenerator.ts](/c:/Users/salam/Documents/Programacion/Mideas/utils/msxGenerator/generators/gameFlowGenerator.ts)

Punto clave:

- `gameflow_handle_music`

Comportamiento:

- Espera `DE` apuntando al payload del nodo de música.
- Hace `push bc` antes de llamar a `music_execute_command` porque `BC` sigue siendo la tabla de conexiones del flujo.
- Tras ejecutar el comando, recupera `BC` y continúa por la conexión por defecto.

Implicación práctica: si cambias el contrato de `music_execute_command`, hay que revisar este handler en la misma tarea.

Además, el loop principal de varios estados llama `music_update` antes de otros subsistemas de audio/SFX para que la música mantenga su cadencia de frame.

## Integración con State Machine

Archivo fuente: [stateMachineGenerator.ts](/c:/Users/salam/Documents/Programacion/Mideas/utils/msxGenerator/generators/stateMachineGenerator.ts)

Acciones musicales ya soportadas:

- `Action_PlayMusic`
  Lee dos bytes de parámetros desde `HL` y llama a `music_play_track`.
  Contrato cargado por el action handler:
  `A = track index`, `B = loop flag`.

- `Action_MuteMusic`
  Llama a `music_mute`.

- `Action_StopMusic`
  Llama a `music_stop`.

Esto permite disparar música desde state machines sin pasar por Game Flow, pero sigue usando exactamente el mismo runtime de `sound.asm`.

## Reglas de mantenimiento

- Si se modifica una rutina del runtime musical, actualizar también sus comentarios de contrato dentro de `soundGenerator.ts`.
- Si cambia el payload de nodos `Music`, revisar `gameflow_handle_music`.
- Si cambia la firma de `music_play_track`, revisar `Action_PlayMusic`.
- `music_update` debe seguir siendo segura para llamarse una vez por frame; no asumir llamadas múltiples por frame salvo que se reescriba el temporizador.
- Cualquier expansión futura (envolventes complejas, ruido por canal, PT3 más completo) debe preservar `music_execute_command` y `music_update` como API estable, o documentar el breaking change en esta misma carpeta.
- La integración futura de un backend `external-pt3` debe colgarse de esa misma API pública (`music_play_track`, `music_update`, `music_stop`, `music_mute`, `music_resume`) para que Game Flow y State Machine no necesiten cambios estructurales.

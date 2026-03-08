# PT3 External Player Integration

Documento de trabajo para integrar un replayer PT3 externo en Mideas sin romper el tracker nativo.

## Update 2026-03-07

Estado actual del repo tras la integracion inicial:

- El tracker ya permite importar `.pt3` y `.99` como backend `external-pt3`.
- El generador ASM ya emite un bloque PT3 dedicado cuando detecta tracks externos.
- `sound.asm` ya hace dispatch por backend en la API publica:
  - `music_play_track`
  - `music_update`
  - `music_stop`
  - `music_mute`
  - `music_resume`
- `externalPt3Data` ya se serializa en ROM y se referencia desde `music_pt3_track_table`.
- La build de prueba con `C:\Users\salam\Downloads\musicaW.json` compila correctamente en `simple32k` y `megarom`.
- La secuencia PT3 que debe mantenerse en `music_update` es `PT3_PLAY` seguido de `PT3_ROUT`.
- Para modulos `.99` strippeados, `music_pt3_track_table` debe apuntar a `track_label - 99`.
- Las llamadas a `PT3_INIT`, `PT3_PLAY` y `PT3_ROUT` deben hacerse en seccion `DI/EI` si el tick musical corre desde el loop principal.
- `init_sound_system` debe ejecutarse una sola vez en el boot global. No debe llamarse desde `init_game_systems` ni al entrar en `WorldLink`, porque eso resetea la musica justo despues de un nodo `Music`.

## Validacion real 2026-03-07

Resultado final de las pruebas reales en OpenMSX con `MyMSXGame13.json`:

- La integracion PT3 del generador ya reproduce correctamente con modulos buenos.
- Se verifico que una ROM de control con `mideas_known_good.99` si suena.
- Tambien se verifico que una cancion de `CASTLEVA` (`ending.pt3`) suena correctamente en el mismo pipeline.
- El problema original de `MyMSXGame13.json` no era solo el runtime: el asset PT3 importado de origen estaba mal.

Conclusion practica:

- La ruta `external-pt3` queda validada con canciones buenas.
- Si una cancion PT3 concreta no suena pero una ROM de control con otra si, el siguiente foco debe ser el asset y no el replayer.
- La carpeta `pt3/PT3/BALQUEST.MSX` se descarto durante esta sesion como fuente fiable de test y se elimino del repo local.

Lo que sigue pendiente no es la conexion basica del backend, sino la validacion de estabilidad real en OpenMSX y la politica de mapper para canciones grandes.

## Referencia elegida

La implementación de referencia inspeccionada en esta sesión es el player PT3 de MSXgl:

- Ruta local de referencia usada: `server/temp/MSXgl_pt3_ref/engine/src/pt3/pt3_player.c`
- Cabecera API: `server/temp/MSXgl_pt3_ref/engine/src/pt3/pt3_player.h`

Autores indicados por el propio archivo:

- S.V. Bulba (player Vortex Tracker II original)
- Alfonso D. C. / Dioniso (adaptación MSX)
- MSXKun / Paxanga Soft (ajustes ROM)
- SapphiRe (versión asMSX)
- mvac7/303bcn (adaptación SDCC)
- Guillaume "Aoineko" Blanchard (distribución dentro de MSXgl, CC BY-SA según cabecera)

## API útil observada

La capa externa ya expone una API clara:

- `PT3_Init()`
- `PT3_InitSong(songAddr)`
- `PT3_Decode()`
- `PT3_UpdatePSG()`
- `PT3_Pause()`
- `PT3_Resume()`
- `PT3_Silence()`
- `PT3_SetLoop(bool)`

Esto encaja bien con la API musical pública actual de Mideas:

- `music_play_track`
- `music_update`
- `music_stop`
- `music_mute`
- `music_resume`

## Decisión de integración

La integración recomendada es por backend:

- `playbackBackend = "native"`: usa el runtime tracker actual de Mideas.
- `playbackBackend = "external-pt3"`: usa datos PT3 binarios y delega en el replayer externo.

El modelo de datos ya queda preparado para esto con:

- `playbackBackend`
- `externalPt3Data`
- `externalPt3HasHeader`
- `externalPt3PlayerId`

## Qué falta para que realmente suene

Todavía no está conectado el replayer al ASM generado. Para completar la integración real faltan estos pasos:

1. Portar o encapsular el núcleo del player PT3 a una forma consumible por Glass (`.asm` puro o include compatible).
2. Añadir un bloque de RAM para el estado del player PT3 externo.
3. Hacer dispatch en `music_play_track` / `music_update` / `music_stop` / `music_mute` / `music_resume` según `playbackBackend`.
4. Serializar `externalPt3Data` a ROM y pasar el puntero correcto a `PT3_InitSong`.
5. Resolver mezcla o arbitraje entre música PT3 y SFX propios de Mideas.

## Cambio de estrategia tras pruebas reales

Durante las pruebas prácticas de esta sesión se intentó convertir a Glass la variante asMSX de SapphiRe (`PT3-ROM.ASM`) y ejecutar varios `.pt3` reales en OpenMSX.

Resultado observado:

- El cartucho arrancaba, pero la reproducción era inestable.
- Con pequeños cambios de compatibilidad podían sonar algunas notas o parte de un patrón.
- El player seguía colgándose o reseteando el emulador tras poco tiempo.

Conclusión:

- El problema ya no parece estar en el fichero `.pt3` ni en el flujo de `header + 100 bytes`.
- La vía de "parchear el fuente asMSX manualmente hasta que funcione en Glass" es demasiado frágil como base de producto.
- El núcleo PT3 usa varios trucos con `SP`, datos en ROM y supuestos del ensamblador original; una conversión parcial o incorrecta rompe la reproducción aunque el ensamblado compile.

Por tanto, la recomendación actual cambia:

1. No usar `PT3-ROM-glass.asm` como base definitiva de integración.
2. Tomar como contrato de referencia la API estable de MSXgl/SDCC (`PT3_Init`, `PT3_InitSong`, `PT3_Decode`, `PT3_UpdatePSG`, `PT3_Pause`, `PT3_Resume`, `PT3_SetLoop`).
3. Integrar un player PT3 externo ya validado, en vez de seguir corrigiendo a mano el port de asMSX.

## Estrategia recomendada a partir de aquí

Hay dos rutas sensatas:

### Ruta A: backend PT3 con player externo precompilado

- Compilar fuera de Mideas un player PT3 conocido bueno (por ejemplo, la variante MSXgl/SDCC o un binario equivalente).
- Incluir ese bloque como asset/binario estable dentro del export MSX.
- Adaptar solo el contrato de entrada/salida desde Mideas, sin reescribir el núcleo.

Ventaja:

- Minimiza el riesgo de romper la lógica interna del replayer.

Inconveniente:

- Requiere una toolchain adicional o un binario previamente generado.

### Ruta B: soporte de backend PT3 por contrato, sin depender todavía del núcleo

- Mantener en Mideas el modelo de datos y el dispatch por `playbackBackend`.
- Preparar la infraestructura para `external-pt3` (selección de track, datos, play/stop/update).
- Dejar el núcleo PT3 desacoplado hasta disponer de una implementación externa probada.

Ventaja:

- Permite avanzar en la arquitectura de Mideas sin bloquearse por el replayer.

Inconveniente:

- No da reproducción PT3 final hasta conectar el núcleo externo.

## Limitación del entorno actual

En este entorno local no hay `sdcc` instalado, así que no se puede compilar aquí directamente la referencia SDCC/MSXgl para validarla "tal cual".

Eso refuerza la recomendación de no seguir iterando sobre el port manual a Glass como ruta principal.

## Qué se ha hecho en esta sesión

- Se seleccionó una referencia concreta.
- Se documentó el contrato de integración.
- Se añadió base de modelo en `TrackerSongData` para soportar tracks PT3 externos.
- Se comprobó que la conversión manual del player asMSX a Glass compila, pero no alcanza estabilidad suficiente en ejecución real.

Eso deja el siguiente paso bien delimitado: integrar un runtime PT3 externo estable, sin improvisar el contrato ni depender del port manual inestable.

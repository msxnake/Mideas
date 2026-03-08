# PT3 Mapper Handoff 2026-03-06

## Objetivo

Migrar la integracion PT3 de `unitedCompressedFiles(83).asm` a una solucion en ROM con mapper Konami, para evitar usar RAM temporal ZX0 como buffer de la cancion.

## Estado actual

- Archivo de trabajo: `C:\Users\salam\Downloads\unitedCompressedFiles(83).asm`
- La build actual sigue en modo `simple32k`.
- La cancion PT3 integrada ahora mismo esta comprimida con ZX0 y se descomprime a RAM.
- Esa solucion no es estable: corrompe graficos y puede terminar en reset.

## Diagnostico ya verificado

### 1. El problema principal no es `99` vs `100`

El replayer `PT3-ROM-alltables-glass.asm` espera `HL = module_address - 100`.
Si el fichero ya esta en formato `.99` strippeado, la llamada correcta es `track_label - 99`.

Eso ya esta corregido en las pruebas estables.

### 2. El problema principal tampoco parece ser solo CPU

Se reviso la actualizacion PT3 dentro de la IRQ:

- `PT3_PLAY`
- `PT3_ROUT`

Se elimino un `EI` peligroso dentro del flujo de interrupcion. Eso era una fuente real de inestabilidad, pero no explica por si solo la corrupcion grafica persistente.

### 3. La causa fuerte actual es solape de RAM

En `unitedCompressedFiles(83).asm`:

- `PT3_TRACK_BUFFER EQU #D400`
- `music_unpack_pt3_track` descomprime la cancion ZX0 ahi
- `music_pt3_track_table` apunta a `PT3_TRACK_BUFFER - 99`

Pero ese mismo rango `#D400+` ya esta reutilizado por buffers temporales ZX0 del propio juego:

- `ZX0_SCREEN_BUFFER EQU #D400`
- `ZX0_BEHAVIOR_BUFFER EQU #D700`
- `ZX0_TILE_PATTERN_BUFFER EQU #DA00`
- `ZX0_TILE_COLOR_BUFFER EQU #DB00`
- `ZX0_FONT_PATTERN_BUFFER EQU #DC00`
- `ZX0_FONT_COLOR_BUFFER EQU #DE00`
- `ZX0_SPRITE_FRAME_BUFFER EQU #E000`

La cancion PT3 descomprimida ocupa demasiado para convivir con esa zona. En cuanto el juego vuelve a descomprimir pantallas, fuentes o sprites, pisa la musica en RAM. A partir de ahi el replayer lee basura y aparecen:

- audio corrupto
- corrupcion grafica
- cuelgue o reset

## Estado exacto del ASM

Referencias utiles dentro de `C:\Users\salam\Downloads\unitedCompressedFiles(83).asm`:

- `ROM Mode: simple32k` en linea aproximada 15
- `call mapper_runtime_init` en linea aproximada 104
- `PT3_TRACK_BUFFER EQU #D400` en linea aproximada 1425
- stub mapper simple32k en lineas aproximadas 1431-1515
- `task_update_music` en linea aproximada 2246
- `music_play_track` llama a `music_unpack_pt3_track` en linea aproximada 12126
- `music_unpack_pt3_track` en linea aproximada 12151
- `music_update` en linea aproximada 12166
- secuencia actual PT3 segura:
  - `call PT3_PLAY` en linea aproximada 12206
  - `call PT3_ROUT` en linea aproximada 12207
- `music_pt3_track_table` apunta a RAM en linea aproximada 12223
- `pt3_track_0_zx0_data` en linea aproximada 12227

## Hechos de compilacion ya comprobados

Se lanzo este comando de analisis:

```powershell
python C:\Users\salam\.codex\skills\konami-asm-mapper\scripts\build_konami_rom.py --source "C:\Users\salam\Downloads\unitedCompressedFiles(83).asm" --output "server\temp\unitedCompressedFiles83_mapper_probe.rom" --project-root "."
```

Resultado:

- `size_bytes=27692`
- `size_padded_bytes=32768`
- `size_mod_8192=0`
- `banks_8k=4`
- `end_address=0xBFFF`
- `exceeds_32k_simple=false`

Interpretacion:

- El juego base aun cabe en `32 KB`.
- El motivo de comprimir la cancion fue hacerla entrar dentro de `32 KB`.
- Si queremos conservar esta cancion completa en ROM y quitar el buffer RAM, la salida correcta es pasar a mapper o usar una cancion bastante mas pequena.

## Ficheros auxiliares generados durante esta sesion

- Cancion buena extraida para pruebas:
  - `C:\Users\salam\Documents\Programacion\Mideas\server\temp\mideas_known_good.99`
- Version comprimida ZX0:
  - `C:\Users\salam\Documents\Programacion\Mideas\server\temp\mideas_known_good.zx0`
- ROM de prueba actual:
  - `C:\Users\salam\Documents\Programacion\Mideas\server\temp\unitedCompressedFiles83_music.rom`
- ROM de sondeo mapper:
  - `C:\Users\salam\Documents\Programacion\Mideas\server\temp\unitedCompressedFiles83_mapper_probe.rom`

## Decisiones ya tomadas

- No seguir con PT3 descomprimido a `#D400`.
- No asumir que el problema es solo carga de CPU.
- Mantener `PT3_PLAY` seguido de `PT3_ROUT`.
- Mantener corregido el offset del modulo PT3.
- Arrancar siempre OpenMSX en PAL 50 Hz para estas pruebas.

## Siguiente paso recomendado

### Opcion elegida

Empezar por la opcion 1: migracion a ROM con mapper Konami.

### Plan concreto para retomar

1. Revertir la estrategia `ZX0 -> PT3_TRACK_BUFFER`.
2. Volver a guardar la cancion PT3 como dato ROM, no en RAM.
3. Activar un mapper Konami real en lugar de los stubs `simple32k`.
4. Fijar una politica clara de bancos:
   - banco estable para arranque
   - banco estable para codigo critico
   - banco dedicado para datos PT3
5. Hacer que el acceso al modulo PT3 ocurra con el banco correcto visible.
6. Restaurar el banco esperado al salir de rutinas que hagan acceso cruzado.
7. Recompilar y probar:
   - arranque
   - gameplay
   - transiciones
   - escenas con descompresion ZX0
   - estabilidad de audio a 50 Hz

## Riesgos al retomar

- El juego ya contiene llamadas a `mapper_set_bank_p2`, pero ahora mismo son no-op. Al activarlas de verdad, puede aparecer codigo que daba por hecho que todo estaba residente siempre.
- Habra que auditar especialmente:
  - cargas de pantallas
  - cargas de sprites
  - acceso a mapas y tiles
  - llamadas desde IRQ
- El arranque y el flujo principal deben quedarse en un banco estable para no auto-desmapear codigo en ejecucion.

## Nota de sesion

En este turno no se hicieron mas cambios funcionales al juego. Solo se deja documentado el estado y la ruta de continuacion para retomar la migracion a mapper sin repetir diagnostico.

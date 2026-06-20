# Mideas SCREEN 5 Bitmap — World Engine (diseño cerrado)

> Regla de oro: en Mideas SCREEN 5 Bitmap, una pantalla **nunca** se exporta como imagen
> completa (24 KB). Se exporta como **mapa de 192 bytes** que referencia **tiles bitmap 16×16**
> reutilizables del tileset del mundo.

## Unidades

- **Tile mínimo estándar: 16×16 px bitmap.** No existe 8×8 como unidad del engine.
- En SCREEN 5 (4 bpp, 2 px/byte) un tile 16×16 ocupa **128 bytes**.
- Pantalla = 256×192 → 16 columnas × 12 filas = **192 tiles** → **192 bytes** de índices.
- Cada byte del mapa = índice de tile 16×16 (0 = vacío/fondo).

## Tamaños

| Elemento             |    Tamaño |
| -------------------- | --------: |
| Tile 16×16 SCREEN 5  | 128 bytes |
| 64 tiles 16×16       |      8 KB |
| 128 tiles 16×16      |     16 KB |
| Pantalla 16×12 tiles | 192 bytes |

## Mundo = asset `worldmap`

- **Un mundo = un asset `worldmap`** (`WorldMapGraph`). Sus `nodes[].screenAssetId` son las
  pantallas (`msx2bitmaproom`) de ese mundo.
- **Todas las pantallas de un mundo comparten el mismo atlas/tileset y paleta.** El atlas
  canónico se toma de la pantalla de inicio (`startScreenNodeId`) o del primer nodo. Las
  pantallas adyacentes ya clonan el atlas al crearse.
- El campo `zone` de cada nodo permite (futuro) TileBank A común + TileBank B por zona.

## Arquitectura de render: command engine (VRAM→VRAM)

1. El tileset del mundo (atlas bitmap, p. ej. 256×128) se sube **una vez** a VRAM offscreen
   (`offscreenBaseY`).
2. `load_room(idx)`: limpia la página visible al color de fondo y, por cada celda no vacía de
   los 192 bytes, hace una **copia VRAM→VRAM (HMMM)** del rectángulo del tile (sx,sy,16,16) a
   su posición de pantalla (col*16, row*16 + offset HUD).
3. Las pantallas bitmap completas de 24 KB solo se usan para title screen, cutscenes o fondos
   únicos.

## Colisión / atributos

- La colisión **no** se calcula por píxel. Se guarda **por tile** (solid, platform, deadly,
  ladder, water, breakable, animated, …) + capa de celda por pantalla.
- `load_room` recarga el collision map (16×12 = 192 bytes) de la pantalla destino.

## ROM: siempre MegaROM Konami

Banking por mundo:

```text
BANK world.A     → tileset común (64 tiles 16×16 = 8 KB)
BANK world.B     → tileset por zona (64 tiles 16×16 = 8 KB)
BANK world.MAP   → pantallas de 192 bytes (~40/banco) + atributos de tile
BANK world.OBJ   → enemigos / items / puertas / triggers por pantalla
BANK world.LOGIC → scripts / state machines
```

## Transición multi-pantalla

Portada de SCREEN 4 (`msx2_try_world_edge_transition_*`):

- RAM `current_screen_index`.
- Tabla de transiciones construida desde las `connections` del `worldmap` (W/E/N/S → índice
  de pantalla destino, o "ninguna").
- La detección de borde en el movimiento **sustituye** el clamp `[2,239]`: al cruzar un borde
  con transición → `load_room(destino)` y reposicionar al player en el borde opuesto.

## Estado de implementación

- Fase 1: tileset → VRAM offscreen.
- Fase 2: `load_room` por command engine + recarga de collision.
- Fase 3: transición de borde multi-pantalla.
- Fase 4: banking de mundos grandes / TileBank B por zona.

## Gotchas / bugs resueltos

- **`load_room` colisión basura por clobber de DE (2026-06-20)** — `replay_room_commands`
  destruye `DE` (vía `vdp_reinit_cmd_pointer` que hace `ld e,#20`); `load_room` no debe
  reutilizar `DE` como índice de room tras llamarlo. Síntoma: player amurallado, sin gravedad,
  solo anima. Detalle completo y tabla de registros que destruye cada helper en
  [Z80_REGISTER_CLOBBER_ERRATA.md](Z80_REGISTER_CLOBBER_ERRATA.md). **No es problema de mapper**
  (konami vs auto-detect dan el mismo fallo).
- **Lag tras transición por R#15 sin restaurar (2026-06-20)** — `load_room` usa el command
  engine, que lee S#2 (`read_vdp_status_2` deja **R#15=2**). El `init` reseteaba R#15=0 tras el
  primer `load_room`, pero `try_room_transition` no → al entrar a una room vecina el
  `bitmap_wait_vblank` del main loop (que *asume R#15=0* y lee S#0 bit7) leía S#2, no veía el
  flag de vblank y agotaba el contador de fallback (#4000) cada frame → **lag severo** ("pinta
  la pantalla constantemente"). El start room iba bien porque init sí reseteaba. Fix: `load_room`
  restaura R#15=0 al final (cubre init y transiciones). Lección: si una rutina cambia estado
  global del VDP (R#15, R#17, banks), debe restaurarlo o documentarlo — igual que con registros
  de CPU ([Z80_REGISTER_CLOBBER_ERRATA.md](Z80_REGISTER_CLOBBER_ERRATA.md)).
- **Color 0 = backdrop (R#7)** — en SCREEN 5 el color 0 (transparencia) y las franjas exteriores
  se pintan con el backdrop R#7 = `backgroundColor`. Si no se escribe R#7 tras CHGMOD, sale el
  cyan por defecto del C-BIOS.

## Test OpenMSX headless

```
openmsx -machine C-BIOS_MSX2 -cart room.rom -romtype konami -script probe.tcl
```
TCL útil: `peek 0xC000`=player_y, `0xC001`=player_x, `0xC00B`=current_screen_index, collision RAM
en `0xC010+idx`. Input: `keymatrixdown 8 0x80`=derecha, `0x10`=izquierda, bit0=space. El boot de
C-BIOS tarda ~5-6 s: muestrear a partir de T+6 s.

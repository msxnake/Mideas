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

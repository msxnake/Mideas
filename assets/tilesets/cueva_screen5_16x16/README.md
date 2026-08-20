# Cueva MSX2 SCREEN 5 — tileset 16x16

Tileset original para una cueva top-down en MSX2 V9938 SCREEN 5.

## Contenido

- `cueva_reference_original.png`: referencia creativa original generada con ImageGen.
- `cueva_atlas_8x8_indexed.png`: atlas canónico de 128×128, 8×8 celdas de 16×16, sin alpha residual.
- `cueva_atlas_8x8_rgb.png`: misma imagen en RGB para inspección/importación visual.
- `cueva_context_preview_2x.png`: composición de prueba de 256×192 ampliada 2×.
- `cueva_screen5_bitmap_stamp.asset.json`: asset con forma `msx2bitmapstamp` / `SCREEN5_BITMAP_STAMP`, 64 tiles y píxeles indexados.
- `cueva_screen5_palette.json`: paleta completa de 16 slots MSX2 RGB333.
- `cueva_tile_manifest.json`: nombres estables, roles de gameplay y orden row-major.
- `cueva_validation_report.json`: salida del validador determinista de la skill.

## Paleta

Se usan 14 colores efectivos: slot 0 como backdrop/transparencia lógica y slots 1–13 para roca, sombra, agua y minerales. Los slots 14 (`gris`) y 15 (`blanco`) quedan reservados para compatibilidad del proyecto o un acento excepcional.

La paleta usa RGB333 real del V9938; el `masterIndex` se conserva en `cueva_screen5_palette.json`. El asset JSON contiene una sola `paletteId`: `palette_screen5_cueva`.

## Uso en Mideas

Importa `cueva_atlas_8x8_rgb.png` desde el editor de bitmap SCREEN 5 o conserva `cueva_screen5_bitmap_stamp.asset.json` como asset de proyecto. El atlas y el JSON están sincronizados: mismo orden row-major, misma paleta y 256 índices por tile.

La composición no se ha insertado en ningún juego existente porque en esta petición no se indicó un JSON de proyecto de juego. El paquete está preparado para añadirse al array de assets del proyecto objetivo sin modificar los cambios ajenos del repositorio.

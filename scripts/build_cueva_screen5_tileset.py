#!/usr/bin/env python3
"""Build the deterministic MSX2 SCREEN 5 cave tileset package.

The generated ImageGen atlas is kept as the creative source. This script only
does the mechanical preflight required by Mideas: flattening, nearest-neighbour
alignment, RGB333 palette snapping, 16x16 slicing, manifest generation, and a
small context composition.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "assets" / "tilesets" / "cueva_screen5_16x16"
SOURCE = PACKAGE / "cueva_reference_original.png"


def msx_color(r: int, g: int, b: int) -> dict[str, object]:
    levels = [0, 36, 73, 109, 146, 182, 219, 255]
    rgb = (levels[r], levels[g], levels[b])
    return {
        "rgb333": [r, g, b],
        "rgb888": list(rgb),
        "hex": "#%02X%02X%02X" % rgb,
        "masterIndex": (r << 6) | (g << 3) | b,
    }


def palette_slots() -> list[dict[str, object]]:
    # Slot 0 remains Mideas' transparent/backdrop slot. Slots 14 and 15 are
    # deliberately reserved for project-specific compatibility or a rare
    # brightest accent and are not used by the quantizer below.
    colors = [
        None,
        (0, 0, 1, "abismo azul"),
        (0, 1, 3, "sombra marina"),
        (1, 1, 4, "indigo profundo"),
        (1, 2, 5, "violeta sombra"),
        (2, 2, 4, "pizarra oscura"),
        (3, 3, 4, "pizarra media"),
        (4, 4, 5, "piedra fria"),
        (5, 5, 6, "piedra iluminada"),
        (6, 6, 7, "brillo de hielo"),
        (0, 3, 4, "agua teal"),
        (1, 5, 6, "reflejo de agua"),
        (5, 3, 1, "mineral ambar"),
        (7, 5, 2, "destello dorado"),
        (5, 5, 5, "reservado gris"),
        (7, 7, 7, "reservado blanco"),
    ]
    slots: list[dict[str, object]] = []
    for slot_index, spec in enumerate(colors):
        if spec is None:
            slots.append({
                "slotIndex": 0,
                "masterIndex": -1,
                "hex": "rgba(0,0,0,0)",
                "name": "transparente / backdrop",
                "reserved": False,
            })
            continue
        r, g, b, name = spec
        color = msx_color(r, g, b)
        slots.append({
            "slotIndex": slot_index,
            "masterIndex": color["masterIndex"],
            "hex": color["hex"],
            "rgb333": color["rgb333"],
            "rgb888": color["rgb888"],
            "name": name,
            "reserved": slot_index >= 14,
        })
    return slots


NAMES = [
    [
        "roca_relleno_bolas", "roca_relleno_granulado", "roca_relleno_losetas", "roca_relleno_puntos",
        "sombra_receso_01", "sombra_receso_02", "sombra_receso_03", "nudo_rocoso",
    ],
    [
        "borde_horizontal_roca_01", "borde_horizontal_roca_02", "borde_horizontal_estalactitas", "borde_horizontal_roca_03",
        "borde_superior_suelo_01", "borde_superior_suelo_02", "borde_superior_suelo_03", "borde_superior_suelo_04",
    ],
    [
        "borde_vertical_roca_01", "borde_vertical_roca_02", "borde_vertical_estalactitas", "borde_vertical_roca_03",
        "borde_vertical_suelo_01", "borde_vertical_suelo_02", "borde_vertical_suelo_03", "borde_vertical_suelo_04",
    ],
    [
        "esquina_exterior_noroeste", "esquina_exterior_noreste", "esquina_exterior_suroeste", "esquina_exterior_sureste",
        "esquina_exterior_estalactita_01", "esquina_exterior_estalactita_02", "esquina_exterior_estalactita_03", "esquina_exterior_estalactita_04",
    ],
    [
        "esquina_interior_noroeste", "esquina_interior_noreste", "esquina_interior_suroeste", "esquina_interior_sureste",
        "esquina_interior_estalactita_01", "esquina_interior_estalactita_02", "esquina_interior_estalactita_03", "esquina_interior_estalactita_04",
    ],
    [
        "union_t_izquierda", "union_t_derecha", "union_t_arriba", "union_t_abajo",
        "union_cruz_01", "union_cruz_02", "union_cruz_03", "union_cruz_04",
    ],
    [
        "receso_arco_01", "receso_arco_02", "receso_arco_03", "receso_arco_04",
        "receso_puerta_01", "receso_puerta_02", "mineral_ambar_01", "mineral_ambar_02",
    ],
    [
        "agua_borde_01", "agua_borde_02", "agua_borde_03", "agua_relleno",
        "estalagmita_ambar", "estalagmita_piedra", "estalactita_larga", "grupo_mineral_ambar",
    ],
]


def tile_role(row: int, col: int) -> tuple[str, str, str]:
    if row == 0:
        return "fill", "solid", "roca de relleno"
    if row in (1, 2):
        return "edge", "solid", "transicion de pared o suelo"
    if row in (3, 4):
        return "corner", "solid", "esquina de transicion"
    if row == 5:
        return "junction", "solid", "union de transiciones"
    if row == 6:
        if col >= 6:
            return "accent", "decorative", "mineral decorativo"
        return "recess", "empty", "hueco o recoveco"
    if col <= 3:
        return "water_edge", "hazard", "agua subterranea"
    return "decoration", "decorative", "estalactita o estalagmita"


def nearest_index(rgb: tuple[int, int, int], rgb_by_slot: dict[int, tuple[int, int, int]]) -> int:
    # Restrict selection to the intentional active budget; reserved slots never
    # leak into imported pixels by accident.
    candidates = range(1, 14)
    return min(
        candidates,
        key=lambda index: sum((rgb[channel] - rgb_by_slot[index][channel]) ** 2 for channel in range(3)),
    )


def build_atlas(slots: list[dict[str, object]]) -> tuple[Image.Image, list[int]]:
    with Image.open(SOURCE) as source:
        rgba = source.convert("RGBA")
        # The generated source uses transparent antialiased pixels. Flatten it
        # against black first, then keep an exact nearest-neighbour 8x8 grid.
        backdrop = Image.new("RGBA", rgba.size, (0, 0, 0, 255))
        flattened = Image.alpha_composite(backdrop, rgba).convert("RGB")
        aligned_rgb = flattened.resize((128, 128), Image.Resampling.NEAREST)
        aligned_alpha = rgba.getchannel("A").resize((128, 128), Image.Resampling.NEAREST)

    rgb_by_slot = {
        int(slot["slotIndex"]): tuple(int(channel) for channel in slot.get("rgb888", [0, 0, 0]))
        for slot in slots
        if slot["slotIndex"] != 0
    }
    indexed: list[int] = []
    for y in range(128):
        for x in range(128):
            if aligned_alpha.getpixel((x, y)) == 0:
                indexed.append(0)
            else:
                indexed.append(nearest_index(aligned_rgb.getpixel((x, y)), rgb_by_slot))

    indexed_image = Image.new("P", (128, 128))
    indexed_image.putdata(indexed)
    flat_palette: list[int] = []
    for slot in slots:
        if slot["slotIndex"] == 0:
            flat_palette.extend([0, 0, 0])
        else:
            flat_palette.extend(int(channel) for channel in slot["rgb888"])
    indexed_image.putpalette(flat_palette + [0] * (768 - len(flat_palette)))
    return indexed_image, indexed


def tile_pixels(indexed: list[int], row: int, col: int) -> list[int]:
    return [indexed[(row * 16 + y) * 128 + col * 16 + x] for y in range(16) for x in range(16)]


def build_context(atlas: Image.Image) -> Image.Image:
    tile_cache = {
        (row, col): atlas.crop((col * 16, row * 16, col * 16 + 16, row * 16 + 16)).convert("RGB")
        for row in range(8)
        for col in range(8)
    }
    room = Image.new("RGB", (256, 192), (0, 0, 0))
    fill_choices = [(0, 0), (0, 1), (0, 2), (0, 3)]
    for y in range(12):
        for x in range(16):
            choice = fill_choices[(x + 2 * y) % len(fill_choices)]
            room.paste(tile_cache[choice], (x * 16, y * 16))

    # Compose a readable sample room from each family without redrawing art.
    placements = {
        (1, 2): (3, 0), (1, 3): (3, 1), (1, 12): (3, 2), (1, 13): (3, 3),
        (2, 2): (2, 0), (3, 2): (2, 1), (2, 13): (2, 2), (3, 13): (2, 3),
        (4, 6): (5, 4), (5, 6): (5, 0), (6, 6): (5, 6), (7, 6): (5, 2),
        (8, 5): (6, 2), (8, 6): (6, 3), (9, 5): (6, 4), (9, 6): (6, 5),
        (10, 1): (7, 0), (10, 2): (7, 1), (10, 3): (7, 2), (10, 4): (7, 3),
        (10, 11): (7, 4), (9, 11): (7, 5), (2, 11): (7, 6), (9, 12): (7, 7),
    }
    for (x, y), source_tile in placements.items():
        room.paste(tile_cache[source_tile], (x * 16, y * 16))
    return room.resize((512, 384), Image.Resampling.NEAREST)


def main() -> None:
    PACKAGE.mkdir(parents=True, exist_ok=True)
    slots = palette_slots()
    atlas, indexed = build_atlas(slots)
    atlas.save(PACKAGE / "cueva_atlas_8x8_indexed.png", optimize=False)
    atlas.convert("RGB").save(PACKAGE / "cueva_atlas_8x8_rgb.png", optimize=False)
    atlas.resize((512, 512), Image.Resampling.NEAREST).convert("RGB").save(
        PACKAGE / "cueva_atlas_8x8_4x_preview.png", optimize=False
    )
    build_context(atlas).save(PACKAGE / "cueva_context_preview_2x.png", optimize=False)

    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    palette_id = "palette_screen5_cueva"
    stamp_id = "bitmap_stamp_screen5_cueva_16x16"
    tiles = []
    manifest_tiles = []
    for row in range(8):
        for col in range(8):
            name = NAMES[row][col]
            role, gameplay, description = tile_role(row, col)
            tile_id = f"{stamp_id}_tile_r{row:02d}_c{col:02d}"
            tiles.append({
                "id": tile_id,
                "name": name,
                "mode": "SCREEN5_BITMAP",
                "width": 16,
                "height": 16,
                "sourceType": "generated",
                "sourceFileName": "cueva_atlas_8x8_indexed.png",
                "paletteId": palette_id,
                "pixelData": tile_pixels(indexed, row, col),
                "tags": ["cave", role, gameplay],
                "createdAt": now,
                "updatedAt": now,
            })
            manifest_tiles.append({
                "index": row * 8 + col,
                "row": row,
                "column": col,
                "id": tile_id,
                "name": name,
                "role": role,
                "gameplayRole": gameplay,
                "description": description,
            })

    stamp = {
        "id": stamp_id,
        "name": "Cueva MSX2 SCREEN 5 16x16",
        "mode": "SCREEN5_BITMAP_STAMP",
        "columns": 8,
        "rows": 8,
        "tileWidth": 16,
        "tileHeight": 16,
        "sourceType": "generated",
        "sourceFileName": "cueva_atlas_8x8_indexed.png",
        "paletteId": palette_id,
        "tiles": tiles,
        "tags": ["cave", "top-down", "terrain", "screen5", "16x16"],
        "createdAt": now,
        "updatedAt": now,
    }
    asset = {
        "id": stamp_id,
        "name": "Cueva MSX2 SCREEN 5 16x16",
        "type": "msx2bitmapstamp",
        "data": {
            "id": stamp_id,
            "name": "Cueva MSX2 SCREEN 5 16x16",
            "savedAt": int(datetime.now(timezone.utc).timestamp() * 1000),
            "stamp": stamp,
            "palette": [
                {key: value for key, value in slot.items() if key in {"slotIndex", "masterIndex", "hex"}}
                for slot in slots
            ],
        },
    }
    (PACKAGE / "cueva_screen5_bitmap_stamp.asset.json").write_text(
        json.dumps(asset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (PACKAGE / "cueva_screen5_palette.json").write_text(
        json.dumps({"id": palette_id, "name": "Paleta Cueva MSX2 SCREEN 5", "mode": "SCREEN5", "slots": slots}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (PACKAGE / "cueva_tile_manifest.json").write_text(
        json.dumps({"atlas": "cueva_atlas_8x8_indexed.png", "tileSize": [16, 16], "columns": 8, "rows": 8, "tiles": manifest_tiles}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

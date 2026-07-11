# -*- coding: utf-8 -*-
"""
photo2autotile - Convierte una foto de textura real en una plantilla autotile
blob16 (64x64 px, 4x4 tiles de 16x16) importable en Mideas via
"Importar plantilla Autotile" del editor bitmap SCREEN 5.

El layout 4x4 replica BLOB16_LAYOUT_MASKS de utils/msx2Autotile.ts:
    6 14 12  4      esquina NO | borde N        | esquina NE | tapa N
    7 15 13  5      borde O    | centro         | borde E    | tubo vertical
    3 11  9  1      esquina SO | borde S        | esquina SE | tapa S
    2 10  8  0      tapa O     | tubo horizontal| tapa E     | aislado
Bits de mascara (vecino presente): 1=N 2=E 4=S 8=O. Lado expuesto = bit a 0.

Uso:
    python tools/photo2autotile.py foto.png [-o salida.png] [opciones]

Opciones principales:
    --tile N          Tamano de tile (default 16, el de Mideas MSX2)
    --crop X,Y,W,H    Region de la foto a usar (default: cuadrado central)
    --scale F         Zoom del recorte antes de reducir (default 1.0)
    --seam N          Ancho de mezcla de costuras seamless en px (default 3, 0=off)
    --bevel N         Grosor del bisel en lados expuestos (default 2)
    --outline         Contorno oscuro de 1px en lados expuestos
    --contrast F      Realce de contraste (default 1.15)
    --preview         Genera ademas <salida>_preview.png (mosaico 4x zoom)
"""

import argparse
import os
import sys

from PIL import Image, ImageEnhance

BLOB16_LAYOUT_MASKS = [
    6, 14, 12, 4,
    7, 15, 13, 5,
    3, 11, 9, 1,
    2, 10, 8, 0,
]

BIT_N, BIT_E, BIT_S, BIT_W = 1, 2, 4, 8


def center_square_crop(img: Image.Image) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def make_seamless(tile: Image.Image, seam: int) -> Image.Image:
    """Offset en cruz + mezcla lineal de las costuras para que el tile repita."""
    if seam <= 0:
        return tile
    n = tile.width
    half = n // 2
    # Desplazar medio tile: las costuras originales quedan en el centro.
    shifted = Image.new("RGB", (n, n))
    shifted.paste(tile.crop((half, half, n, n)), (0, 0))
    shifted.paste(tile.crop((0, half, half, n)), (half, 0))
    shifted.paste(tile.crop((half, 0, n, half)), (0, half))
    shifted.paste(tile.crop((0, 0, half, half)), (half, half))

    src = tile.load()
    dst = shifted.load()
    out = shifted.copy()
    pix = out.load()
    # Mezclar la cruz central (costura) con la textura original sin desplazar.
    for y in range(n):
        for x in range(n):
            dx = abs(x - half) if abs(x - half) < abs(x - half + n) else abs(x - half + n)
            dy = abs(y - half) if abs(y - half) < abs(y - half + n) else abs(y - half + n)
            d = min(dx, dy)
            if d >= seam:
                continue
            # Peso 0 en la costura -> textura original; 1 a distancia >= seam.
            t = d / float(seam)
            sr, sg, sb = src[x, y]
            dr, dg, db = dst[x, y]
            pix[x, y] = (
                int(sr + (dr - sr) * t),
                int(sg + (dg - sg) * t),
                int(sb + (db - sb) * t),
            )
    return out


def shade(rgb, factor):
    r, g, b = rgb
    return (
        max(0, min(255, int(r * factor))),
        max(0, min(255, int(g * factor))),
        max(0, min(255, int(b * factor))),
    )


def apply_edges(base: Image.Image, mask: int, bevel: int, outline: bool) -> Image.Image:
    """Bisel + contorno en los lados expuestos (bit de vecino a 0)."""
    n = base.width
    tile = base.copy()
    pix = tile.load()

    # factor por profundidad: capa 0 (borde) mas marcada.
    def edge_factors(depth):
        # highlight superior, sombra inferior/lateral, decreciente hacia dentro.
        strength = 1.0 - depth / float(bevel + 1)
        return strength

    for depth in range(bevel):
        s = edge_factors(depth)
        if not (mask & BIT_N):  # norte expuesto -> highlight (luz cenital)
            f = 1.0 + 0.45 * s
            for x in range(n):
                pix[x, depth] = shade(pix[x, depth], f)
        if not (mask & BIT_S):  # sur expuesto -> sombra fuerte
            f = 1.0 - 0.45 * s
            for x in range(n):
                pix[x, n - 1 - depth] = shade(pix[x, n - 1 - depth], f)
        if not (mask & BIT_W):  # oeste -> sombra media
            f = 1.0 - 0.30 * s
            for y in range(n):
                pix[depth, y] = shade(pix[depth, y], f)
        if not (mask & BIT_E):  # este -> sombra media
            f = 1.0 - 0.30 * s
            for y in range(n):
                pix[n - 1 - depth, y] = shade(pix[n - 1 - depth, y], f)

    if outline:
        if not (mask & BIT_N):
            for x in range(n):
                pix[x, 0] = shade(pix[x, 0], 0.35)
        if not (mask & BIT_S):
            for x in range(n):
                pix[x, n - 1] = shade(pix[x, n - 1], 0.35)
        if not (mask & BIT_W):
            for y in range(n):
                pix[0, y] = shade(pix[0, y], 0.35)
        if not (mask & BIT_E):
            for y in range(n):
                pix[n - 1, y] = shade(pix[n - 1, y], 0.35)

    return tile


def build_atlas(base: Image.Image, tile_size: int, bevel: int, outline: bool) -> Image.Image:
    atlas = Image.new("RGB", (tile_size * 4, tile_size * 4))
    for index, mask in enumerate(BLOB16_LAYOUT_MASKS):
        cell = apply_edges(base, mask, bevel, outline)
        atlas.paste(cell, ((index % 4) * tile_size, (index // 4) * tile_size))
    return atlas


def build_preview(atlas: Image.Image, tile_size: int, zoom: int = 4) -> Image.Image:
    """Mosaico de demo: un bloque 5x4 pintado con el autotile, para juzgar el resultado."""
    # mapa de demo (1=terreno) con formas variadas
    demo = [
        [1, 1, 1, 0, 1],
        [1, 1, 1, 0, 1],
        [0, 1, 0, 0, 1],
        [1, 1, 1, 1, 1],
    ]
    rows, cols = len(demo), len(demo[0])

    def is_terrain(cx, cy):
        if cx < 0 or cy < 0 or cy >= rows or cx >= cols:
            return False
        return demo[cy][cx] == 1

    cell_at = {}
    for index, mask in enumerate(BLOB16_LAYOUT_MASKS):
        cell_at[mask] = ((index % 4) * tile_size, (index // 4) * tile_size)

    out = Image.new("RGB", (cols * tile_size, rows * tile_size), (24, 24, 32))
    for cy in range(rows):
        for cx in range(cols):
            if not is_terrain(cx, cy):
                continue
            mask = 0
            if is_terrain(cx, cy - 1):
                mask |= BIT_N
            if is_terrain(cx + 1, cy):
                mask |= BIT_E
            if is_terrain(cx, cy + 1):
                mask |= BIT_S
            if is_terrain(cx - 1, cy):
                mask |= BIT_W
            sx, sy = cell_at[mask]
            cell = atlas.crop((sx, sy, sx + tile_size, sy + tile_size))
            out.paste(cell, (cx * tile_size, cy * tile_size))
    return out.resize((out.width * zoom, out.height * zoom), Image.NEAREST)


def main():
    parser = argparse.ArgumentParser(description="Foto de textura -> autotile blob16 para Mideas")
    parser.add_argument("photo", help="Foto de textura (png/jpg/webp...)")
    parser.add_argument("-o", "--output", help="PNG de salida (default: <foto>_autotile.png)")
    parser.add_argument("--tile", type=int, default=16, help="Tamano de tile (default 16)")
    parser.add_argument("--crop", help="Region X,Y,W,H de la foto (default: cuadrado central)")
    parser.add_argument("--scale", type=float, default=1.0, help="Zoom del recorte (>1 acerca)")
    parser.add_argument("--seam", type=int, default=3, help="Mezcla de costura seamless en px (0=off)")
    parser.add_argument("--bevel", type=int, default=2, help="Grosor de bisel en lados expuestos")
    parser.add_argument("--no-outline", action="store_true", help="Sin contorno oscuro de 1px")
    parser.add_argument("--contrast", type=float, default=1.15, help="Realce de contraste")
    parser.add_argument("--saturation", type=float, default=1.1, help="Realce de saturacion")
    parser.add_argument("--preview", action="store_true", help="Genera <salida>_preview.png")
    args = parser.parse_args()

    if not os.path.isfile(args.photo):
        sys.exit(f"No existe la foto: {args.photo}")

    img = Image.open(args.photo).convert("RGB")

    if args.crop:
        x, y, w, h = (int(v) for v in args.crop.split(","))
        img = img.crop((x, y, x + w, y + h))
    else:
        img = center_square_crop(img)

    if args.scale != 1.0:
        side = img.width
        new = max(args.tile, int(side / args.scale))
        left = (side - new) // 2
        img = img.crop((left, left, left + new, left + new))

    # Reduccion a resolucion de tile con antialiasing (conserva la "media" de la textura).
    base = img.resize((args.tile, args.tile), Image.LANCZOS)
    base = make_seamless(base, args.seam)

    if args.contrast != 1.0:
        base = ImageEnhance.Contrast(base).enhance(args.contrast)
    if args.saturation != 1.0:
        base = ImageEnhance.Color(base).enhance(args.saturation)

    atlas = build_atlas(base, args.tile, args.bevel, not args.no_outline)

    out_path = args.output or os.path.splitext(args.photo)[0] + "_autotile.png"
    atlas.save(out_path)
    print(f"Autotile blob16 guardado: {out_path} ({atlas.width}x{atlas.height})")

    if args.preview:
        preview_path = os.path.splitext(out_path)[0] + "_preview.png"
        build_preview(atlas, args.tile).save(preview_path)
        print(f"Preview: {preview_path}")


if __name__ == "__main__":
    main()

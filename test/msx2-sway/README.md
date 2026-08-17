# SCREEN 5 bitmap — hierba que se mueve al pasar (grass sway)

Smoke del sistema de intercambio dinámico de tiles bitmap: una celda pintada con un
tile marcado *"Se mueve al pasar"* se dobla mientras el cuerpo del player la atraviesa
y vuelve sola a su sitio. Es decorativo: la colisión de la celda no se toca.

Generador: [`msx2BitmapSwayGenerator.ts`](../../utils/msxGenerator/generators/msx2/msx2BitmapSwayGenerator.ts).

## Cómo se regenera

El fixture se construye encima del smoke canónico de bitmap rooms, que es el único que
compila de forma fiable en el repo:

```bash
python -B scripts/build_msx2_screen5_bitmap_room_smoke.py --skip-openmsx
node test/msx2-sway/make_fixture.mjs
python -B scripts/build_mideas_unified_rom.py --json test/msx2-sway/fixture_sway.json \
    --project-root . --asm-output test/msx2-sway/sway.asm \
    --rom-output test/msx2-sway/sway.rom --allow-tsc-errors
bash test/msx2-sway/run_probe.sh
```

`run_probe.sh` saca las direcciones de RAM del ASM recién generado (el bloque de la
hierba se dimensiona a partir del hitbox del player, así que una constante fija se
quedaría obsoleta sin avisar) y devuelve código de salida ≠ 0 si algún check falla.

## Qué comprueba el probe

Sobre el pool en `bitmap_sway_pool`, leyendo `cell / set / want / drawn / timer`:

1. Nada doblado antes de que el player llegue a la mata.
2. Entrar andando hacia la derecha dobla la celda hacia la derecha (`drawn = 2`).
3. Darse la vuelta dentro de la mata la dobla hacia la izquierda (`drawn = 1`).
4. Salir de la mata libera todos los slots: la hierba se endereza sola.

Las capturas `_sway_rest.png` (mata uniforme) y `_sway_right.png` (una celda cambiada
bajo el player) muestran el swap en pantalla.

## ROM byte-idéntica si no se usa

`make_fixture.mjs --no-sway` escribe la misma sala sin la marca. Construyendo esa ROM
con el generador tal cual y con `collectBitmapSwayData` forzado a devolver vacío, el
ASM y la ROM salen idénticos: un proyecto que no usa hierba no paga nada.

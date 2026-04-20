---
name: capturar-openmsx-en-accion
description: Captura screenshots PNG de una ROM en OpenMSX despues de ejecutar una secuencia reproducible de input en la misma sesion. Use when Codex needs to arrancar una ROM, navegar menus o mover un personaje con teclas programadas, y guardar una captura del estado resultante para depuracion visual, evidencia de gameplay, o comparacion contra Preview de Mideas.
---

# Capturar OpenMSX En Accion

Automate a deterministic OpenMSX session that boots a ROM, replays input, captures a PNG, and closes the emulator.
Use this skill when the screenshot must reflect gameplay or menu interaction, not only a fixed boot delay.

## Quick Workflow

1. Confirm the ROM exists.
2. Define the input sequence that reaches the state to capture.
3. Run:
   - `python scripts/capture_openmsx_action.py --rom <archivo.rom> --sequence "DOWN,DOWN,SPACE,WAIT:700,RIGHT:1200" --project-root <repo-root>`
4. Review the PNG path reported by the script.
5. Re-run with the same timing values when you need comparable screenshots across iterations.

## Sequence Syntax

- Keys: `UP`, `DOWN`, `LEFT`, `RIGHT`, `SPACE`, `SPC`.
- Waits: `WAIT:500`.
- Repeats: `LEFT*3`, `DOWN*2`.
- Explicit hold durations: `RIGHT:1200`, `SPACE:200`.
- Separator: comma.

Example:
- `--sequence "DOWN,DOWN,SPACE,WAIT:800,RIGHT:900,WAIT:200,SPACE"`

## Options

- `--output <archivo.png>`: exact screenshot path. If omitted, the script writes under `~/Documents/openMSX/screenshots`.
- `--boot-wait-ms <ms>`: delay before the first input. Increase this when the ROM reaches the title screen slowly.
- `--hold-ms <ms>`: tap duration for simple key presses.
- `--gap-ms <ms>`: pause after each key release.
- `--capture-wait-ms <ms>`: extra wait after the last input before taking the screenshot.
- `--romtype <type>`: explicit OpenMSX cart type such as `konami`.
- `--machine <id>`: optional machine id. Do not assume a machine name exists unless the user provides it or you already verified it locally.
- `--openmsx <ruta/openmsx.exe>`: force the OpenMSX binary.
- `--load-via-script`: load the ROM with `carta` inside TCL instead of `-cart`.
- `--dry-run`: print the resolved command and generated TCL script without launching OpenMSX.

## Notes

- Prefer this skill over plain screenshot capture when the visual state depends on menu navigation, player movement, or staged timing.
- Prefer `--dry-run` first when debugging startup or input timing.
- If `-cart` fails to boot the ROM, retry with `--romtype konami` or `--load-via-script`.
- If OpenMSX exits without producing the PNG, retry with a verified `--machine` id and a larger `--boot-wait-ms`.
- Keep `--boot-wait-ms`, `--gap-ms`, and `--capture-wait-ms` fixed when comparing screenshots across builds.

## Resources

- Driver script: `scripts/capture_openmsx_action.py`
- Quick examples: `references/quickstart.md`

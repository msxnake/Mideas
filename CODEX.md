Cuando pidas "incrementar versión" o "nueva versión", este agente (Codex CLI) seguirá estas reglas y comandos.

Regla fuente
- Lee y respeta docs/project/VERSION_LOCATIONS.md para saber dónde actualizar.

Qué actualizar
- README.md: Línea con `**Version X.XXX**`.
- constants.ts: `export const APP_VERSION = "X.XXX";`.
- docs/project/VERSION_LOCATIONS.md: `## Current Version: X.XXX`.
- Opcional: package.json -> campo `version` (solo si lo pides o con flag `--package`).

Cómo calcular la nueva versión
- Si no especificas número, incrementa por defecto +0.001 sobre el valor de constants.ts.
- Si indicas explícitamente la versión (p.ej. 0.260), úsala tal cual.

Changelog
- Preguntar: "¿Quieres actualizar changeLog.txt?".
- Si sí: ejecutar `node generateChangelog.cjs` (usa commits que contengan `version X.XXX`).

Flujo Git
- Preguntar: "¿Quieres subirlo a GitHub?".
- Si sí: crear commit `Version X.XXX - [breve descripción]` y `git push`.

Script de apoyo (Node)
- Archivo: `bumpVersionCodex.cjs` en la raíz.
- Uso:
  - `node bumpVersionCodex.cjs` → auto incrementa +0.001.
  - `node bumpVersionCodex.cjs 0.260` → fija versión.
  - Flags opcionales:
    - `--package` → también actualiza package.json.
    - `--commit` → crea commit con mensaje `Version X.XXX - bump via Codex`.
    - `--push` → hace `git push` tras el commit.

Ejemplos
- Solo actualizar archivos: `node bumpVersionCodex.cjs`
- Actualizar y commitear: `node bumpVersionCodex.cjs --commit`
- Fijar versión y publicar: `node bumpVersionCodex.cjs 0.260 --package --commit --push`


Memoria Codex - uso de archivos .md en raiz (sin subcarpetas)
- `README.md`: documentacion principal del proyecto (descripcion, features, instalacion y ejecucion).
- `CHANGELOG.md`: historial de versiones y cambios por release.
- `CODEX.md`: reglas operativas de Codex para tareas de version/release.
- `CLAUDE.md`: guia de trabajo para asistentes IA y reglas tecnicas Z80/MSX.
- `GAMEFLOW_BEHAVIOR.md`: especificacion tecnica del flujo de nodos GameFlow en ASM.
- `memoria_Rom_Ram_MSX.md`: referencia sobre organizacion ROM/RAM en MSX y variables ASM.
- `SPRITE_MOVEMENT_SOLUTION.md`: reporte tecnico de problema/solucion de movimiento de sprites.
- `TILE_COLLISION_BUG_REPORT.md`: informe de bug de colisiones con analisis de causa raiz.

Regla de ubicacion de archivos
- Si el usuario menciona un archivo sin ruta explicita, buscar primero en `C:\Users\salam\Downloads`.

Regla ASM del generador
- Si modificas una rutina ASM del generador o codigo que emite ASM, lee antes `CLAUDE.md`, `docs/msx/Z80_INSTRUCTIONS_REFERENCE.md` y la documentacion funcional asociada al subsistema.
- Antes de cambiar la rutina, identifica y conserva su contrato de registros (entradas, salidas, registros clobbered, flags y balance de stack). Si cambias ese contrato a proposito, actualiza tambien la documentacion asociada.

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


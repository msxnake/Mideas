# Mideas – Intermediate Game JSON (v1)

This exporter generates a single `.json` file that represents the **game structure** in a way that is easier to consume by future generators (e.g. MSX `.asm` output), without changing the current MSX generators.

## Where to export it

In the UI: `File` → `Export Game Structure (.json)`

You will be asked for an export mode:

- `compact-pretty` (default)
- `compact-min`
- `full-pretty`
- `full-min`

The file name is:

`<projectName>_game_structure_<compact|full>_<min?>.json`

## What it contains (high level)

- `initialization`
  - `entryGameFlowAssetId` (heuristic: the `gameflow` asset named `Main`, otherwise the first one)
  - `entry` (start node and first node resolved from the entry gameflow)
  - `derivedMenu` (only if the first node after `Start` is a `SubMenu`)
  - `globalVariables` assets
- `structure`
  - `gameFlows` (nodes + connections + per-node referenced asset IDs)
  - `worldMaps` (world map graphs + screens expanded to include tile layers in compact form and entities/components)
- `catalog`
  - `assetsById` (all project assets, keyed by ID, with their original `data`)
  - `componentDefinitionsById`, `entityTemplatesById` (filtered to only those referenced by placed entities in any `screenmap`)
  - `tileBanks`, `msxFont`, `msxFontColorAttributes`
- `diagnostics`
  - `missingAssetIds` (referenced but not present)
  - `warnings` (human-readable issues found while expanding)

## Notes

- Screen tile layers are stored as SCREEN 2 vectors (32×24 = 768 bytes) encoded as **HEX** (`encoding: "screen2-idx-hex-v1"`), plus a per-screen `tileTable` that maps `index -> tileId(+subTile)`.
- Entities placed in the Screen Editor are exported in two ways:
  - Human-readable: `screen.entities` (templates + merged component values)
  - Compact: `screen.entitiesPacked` as HEX (`encoding: "screen2-entities-hex-v1"`) with `bytesPerEntity=3` (`templateIndex`, `x`, `y`) plus `entityTemplateTable` to map indices back to `entityTemplateId`.
- For `SCREEN 2 (Graphics I)`, `tile` and `sprite` pixel grids are exported in compact form (no per-pixel RGBA strings):
  - Tiles: `tile.dataEncoded.encoding = "msx1-idx-nibble-hex-v1"` (two pixels per byte, MSX1 palette indices 0–15).
  - Tiles (SCREEN 2 line colors): if present, `tile.lineAttributesEncoded.encoding = "msx1-lineattrs-hex-v1"` (one byte per 8-pixel segment: `fg<<4|bg`).
  - Sprites: `sprite.framesEncoded[]` with the same encoding; `sprite.backgroundColorIndex` and `sprite.spritePaletteIndices` are also provided.
- `catalog.msxFont` and `catalog.msxFontColorAttributes` are exported as compact HEX blocks:
  - `catalog.msxFont.encoding = "msx1-font-patterns-hex-v1"`: 256 chars × 8 bytes (pattern rows).
  - `catalog.msxFontColorAttributes.encoding = "msx1-font-colors-hex-v1"`: 256 chars × 8 bytes (`fg<<4|bg` per row).
- `font` assets in `catalog.assetsById` only include a lightweight reference (`{ ref: "catalog.msxFont" }`) to avoid duplication.
- Sprite/tile “datas” are available in `catalog.assetsById` under the corresponding asset IDs.

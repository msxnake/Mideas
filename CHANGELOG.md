## Unreleased

### Bug Fixes

- **State Machine `Lives` sync fix**: Updated `Action_DecLives` and `Action_IncLives` in the MSX state machine generator so they also write the final value into `global_var_lives`. This fixes exported ASM cases where `HAS_DEADLY_TILE_COLLISION` became true but `VARIABLE_COMPARE(Lives == 0)` still failed because only `entity_health_current` changed.
- **State Machine global `VARIABLE_COMPARE` fix**: Fixed a Z80 runtime bug in `Condition_VariableCompare` where global variables (`VarID >= 6`, including `Lives`) restored `DE` in the wrong order, overwriting register `E` after reading the global byte. This made conditions like `HAS_DEADLY_TILE_COLLISION AND Lives == 3` fail in exported ASM even when `global_var_lives` had the expected value.

### Documentation

- **Documented State Machine global compare bug**: Added a project note describing the symptom, root cause, affected register flow, and patch for the `Lives == N` transition failure in exported ASM.
- **Documented Z80 `ld a, i` / `ld a, r` errata**: Added `docs/msx/Z80_LDA_I_ERRATA.md` and linked the rule from the main Z80 guidance files so future ASM generator changes avoid the interrupt flag race.

---

## v0.267

Released: 2026-01-01

### Bug Fixes

- **Critical: Fixed ROM corruption from ORG #C000**: Removed `ORG #C000` + `DS` directives from `variablesGenerator.ts` that were placing code in RAM section, corrupting Konami cartridge ROMs. Variables now use `EQU` only.

### Features

- **Download .sym with .asm**: When "Generate .sym" option is enabled in CodeExportModal, clicking "Save Assembly File" now downloads both the .asm and .sym files automatically.

### UI/UX Improvements

- **Removed obsolete Run menu**: The Run menu in Toolbar was obsolete and has been removed. Related props marked as `@deprecated`.

### Documentation

- **Z80 Instructions Reference**: Created `docs/msx/Z80_INSTRUCTIONS_REFERENCE.md` with complete valid instruction tables and common errors to avoid.
- **Documented Prompts**: Created `docs/Documented_Prompts.txt` to save effective prompts for future reference.
- **CLAUDE.md updates**: Added Z80 common errors table, JR vs JP rules, Screen 2 three-bank structure, and ORG #C000 warning.

---

## v0.266

Released: 2025-12-31

### UI/UX Improvements

- **Read-only asset names in editors**: Asset name fields in central editor panels are now read-only to prevent inconsistencies. Names should only be edited from the "Game Assets" section (Column 1).

### Affected Editors (Assets)

| Editor | Field Changed | Location |
|--------|---------------|----------|
| SpriteEditor | Name | Line 1197-1198 |
| TileEditor | Tile Name | Line 1986-1987 |
| BossEditor | Boss Name | Line 387-388 |
| SoundEditor | Name | Line 637-638 |
| FontEditor | ASM Label → Name | Line 621-623 |

### Excepciones (NO son Assets - nombre editable)

| Editor | Razón |
|--------|-------|
| EntityTemplateEditor | Las plantillas de entidad no son assets, se gestionan internamente |
| ComponentDefinitionEditor | Las definiciones de componentes no son assets, se gestionan internamente |

### Editores sin campo de nombre (solo muestran en título)

| Editor | Notas |
|--------|-------|
| ScreenEditor | Nombre mostrado en título del Panel |
| WorldMapEditor | Nombre mostrado en título del Panel |
| GameFlowEditor | Nombre mostrado en título del Panel |
| PaletteEditor | No tiene campo de nombre |
| StateMachineEditor | No tiene campo de nombre |
| TrackerComposer | No tiene campo de nombre |

### Editores con sub-elementos editables (no el asset principal)

| Editor | Sub-elementos |
|--------|---------------|
| TileBankEditor | Nombres de banks internos (no el asset) |
| GlobalVariablesEditor | Nombres de variables individuales (no el asset) |

### Technical Changes

- Changed `<input>` elements to `<span>` elements for asset name display
- FontEditor: Added `fontAssetName` prop to receive asset name from parent
- FontEditor: Removed `fontNameToExport` state (now uses prop)
- AppUI.tsx: Updated FontEditor call to pass `fontAssetName={activeAsset.name}`

---

## v0.265
\n
Released: 2025-11-11
\n\n
### Fixes
\n
- Prevent ghost entities/boxes after restart by hard-resetting session state in GameFlowPreviewModal (b12b408)
\n\n
### Details
\n
- Clear entitiesRef, heroRef, input, registries (boxPickedUp/collected), globals, music, and HUD; reset screen/world to force clean reinit on Restart.
\n\n

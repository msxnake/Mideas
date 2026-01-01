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


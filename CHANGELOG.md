## v0.266

Released: 2025-12-31

### UI/UX Improvements

- **Read-only asset names in editors**: Asset name fields in central editor panels are now read-only to prevent inconsistencies. Names should only be edited from the "Game Assets" section (Column 1).

### Affected Editors

| Editor | Field Changed | Location |
|--------|---------------|----------|
| SpriteEditor | Name | Line 1197-1198 |
| TileEditor | Tile Name | Line 1986-1987 |
| BossEditor | Boss Name | Line 387-388 |
| EntityTemplateEditor | Template Name | Line 421-423 |
| ComponentDefinitionEditor | Component Name | Line 311-313 |
| SoundEditor | Name | Line 637-638 |
| FontEditor | ASM Label → Name | Line 621-623 |

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


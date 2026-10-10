# MSX2 SCREEN 4 / SCREEN 5 Sprite View

The top toolbar's **Sprite View** opens a read-only pattern inspector for MSX2 projects, including legacy projects whose screen-mode text still says SCREEN 4 while their bitmap rooms use SCREEN 5. It detects the actual mode from the selected world's screen assets.

- **World general sprites** selects a World asset and displays the 64 hardware pattern groups at VRAM `#3800..#3FFF` for native SCREEN 4 tile screens, or `#F800..#FFFF` for SCREEN 5 bitmap rooms. Each 16x16 group uses four 8x8 pattern numbers and 32 bytes. Player animation/state banks, mirrored banks and initial effects appear at their real allocated group indices. Empty groups remain visible.
- **All sprite assets** displays every authored frame/cell/color layer of every MSX2 Sprite asset, with an asset filter and a shortcut to open the sprite editor. Catalogue indices are not VRAM assignments; the catalogue can exceed 64 patterns.
- **Screen sprites** combines the general bank with the selected screen's runtime pattern allocation. The **Screen** selector is available beside **World** and lists only that world's MSX2 screens, deduplicated in world order. Selecting a screen opens this tab; selecting **General sprites only** returns to the general bank. Changing worlds resets the screen selection.
- Select a pattern to see its source, frame, layer, cell offset, mirror orientation, physical address and raw bytes. Masks are shown by default; **Show layer colors** uses the selected world's palette (or the asset palette in the catalogue). Each hardware layer is shown independently, including CC/OR layers.
- The fixed footer counts the displayed bank against the 2048-byte pattern table. On **World general sprites**, screen-specific uploads are excluded. On **Screen sprites**, it includes dynamic uploads and the runtime's reserved cache cells. Green cells identify the general bank, blue cells identify screen dynamics, and dashed cells identify reserved cache capacity. Color/attribute tables are excluded. Allocation errors appear in red and suppress incomplete totals.

The current runtime compiles a shared player bank from its initial screen and keeps it across worlds. Sprite View follows that rule and identifies its source screen. Worlds outside the active Game Flow receive an explicitly labelled independent preview. A world with no MSX2 screens shows an empty-state message. If the allocator cannot inspect the bank, the error is displayed and total usage is unavailable; the view does not claim a complete count.

SCREEN 4 inspection reads the exact initial pattern payload from its existing generator. Its player frames/mirrors, shots, optional push boxes and carryable patterns retain their physical offsets. The blank reserve for per-screen Enemy Assets is excluded from the general count and stays available for dynamic uploads. Legacy shared enemy patterns, which are part of the fixed initial bank, are identified as shared and counted. No screen enemy pack is displayed in this tab.

SCREEN 4 screen inspection fills the real enemy cache with that screen's Enemy Asset pack. SCREEN 5 screen inspection reuses the full allocator and per-room tables, including compacted enemy pools, frame/facing/ceiling variants, foreground masks, platforms, carryables, turrets, shaft cabins, projectiles and weapon cache capacity. Categories that never coexist may reuse a physical range. A shared enemy pattern shows its first referenced color layer; weapon cells show the first drawable weapon frame, while the reserved group count is independent of its animation length. Failure of the full project allocator is shown explicitly even when caused by another screen or a separate runtime resource.

Implementation reuses the actual generator's player/state bank builders. When initial effects exist, an inspection-only early return after the existing allocator reads the exact init uploads and data (including generated fallbacks). Normal exports and register contracts are unchanged. Inspection does not modify project assets.

Validation:

```powershell
node scripts/check_msx2_sprite_view.mjs
node scripts/check_msx2_sprite_view_ui.cjs
```

The browser check uses an isolated test session and defaults to `http://localhost:3000/`. `MIDEAS_UI_URL`, `MIDEAS_SPRITE_VIEW_FIXTURE` and `MIDEAS_SPRITE_VIEW_OUT` override the URL, project fixture and screenshot directory. The model check verifies both modes, masks/mirrors, state sharing, start room selection, world-filtered screen choices, combined banks, range reuse, foreground/platforms, all authored frames, overflow, dynamic exclusion and holes, initial effects, immutability, and unchanged exported ASM. `MIDEAS_SPRITE_VIEW_TILE_FIXTURE` and `MIDEAS_SPRITE_VIEW_SCREEN_FIXTURE` optionally write fixtures for manual/browser checks.

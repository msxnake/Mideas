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


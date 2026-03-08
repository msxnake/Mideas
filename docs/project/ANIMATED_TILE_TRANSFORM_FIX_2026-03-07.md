# Animated Tile Transform Fix - 2026-03-07

## Context

Project used for validation:

- `C:\Users\salam\Downloads\pato_s.json`

Affected tiles:

- `corda`
- `elevador1`
- `elevador2`

Symptoms seen in ROM:

- transform-animated tiles became corrupted over time
- `elevador1` / `elevador2` did not move color rows correctly

## Initial hypotheses checked

These were investigated and were not the final fix by themselves:

1. Running transform updates too late in the frame
   - `update_animated_tiles` was moved close to `HALT`
   - this was not sufficient

2. IRQ / VRAM races
   - in `gameLoopHalt` mode, gameplay sprite/audio ticks are not registered as IRQ tasks
   - this was not the root cause

3. RAM overwrite in animated tile scratch variables
   - `anim_tile_transform_flags` and `anim_tile_row_buffer` do not overlap neighboring runtime memory
   - no RAM overlap was found in the generated layout

4. Lost transform opcode in `DE`
   - there were real bugs here and they were fixed
   - but corruption still persisted afterwards

## Real conclusion

The VRAM read/modify/write approach for transform-mode tiles was not robust enough for this engine/runtime path.

Even after fixing opcode handling and improving `FAST_RDVRM`, the transform runtime still remained fragile. The stable solution was to stop deriving transform frames from live VRAM and instead precompute the transform sequence from the source tile data during generation.

## Final implementation

Transform-mode tiles are now converted by the engine into normal frame-based animated tile groups at generation time.

That means:

- transform tiles no longer depend on VRAM readback
- pattern rows are precomputed from the source tile pattern bytes
- color rows are also precomputed when `animationTransformIncludeColors=true`
- runtime playback uses the existing frame animation pipeline
- `anim_transform_table` becomes effectively unused for generated projects using this path

## Generator behavior now

For each transform tile:

1. Resolve `baseTileId` or fallback to the tile itself.
2. Read source pattern/color bytes from project tile data.
3. Precompute `animationTransformCheckpoints` frames.
4. Emit those frames into `anim_tile_table` / frame data blocks.
5. Let runtime update them through `anim_upload_char_frame`.

This is especially important for:

- `shift_up`
- `shift_down`
- `swap_top_bottom`

Because those operations need stable row ordering for both pattern and color bytes.

## Files changed

Primary change:

- [animatedTilesGenerator.ts](C:/Users/salam/Documents/Programacion/Mideas/utils/msxGenerator/generators/animatedTilesGenerator.ts)

Supporting fixes made during investigation:

- [gameFlowGenerator.ts](C:/Users/salam/Documents/Programacion/Mideas/utils/msxGenerator/generators/gameFlowGenerator.ts)
  - moved animated tile update closer to the VBlank edge

- [directHardwareGenerator.ts](C:/Users/salam/Documents/Programacion/Mideas/utils/msxGenerator/generators/directHardwareGenerator.ts)
  - corrected `FAST_RDVRM` to use a dummy read before the real VRAM byte

## Important notes

- `corda` uses `shift_down` with `includeColors=false`
  - pattern moves
  - color rows remain static by design

- `elevador1` and `elevador2` use `shift_up` with `includeColors=true`
  - both pattern and color rows are precomputed and animated together

- Horizontal transform operations do not imply per-pixel color rotation in SCREEN 2 color tables.
  - Only vertical row movement is meaningful for color row animation.

## Validation artifacts

Stable validation ROM:

- [pato_s_transformprecalc.rom](C:/Users/salam/Documents/Programacion/Mideas/server/temp/pato_s_transformprecalc.rom)

Generated ASM proving transform tiles are emitted as frame groups:

- [pato_s_transformprecalc.asm](C:/Users/salam/Documents/Programacion/Mideas/server/temp/pato_s_transformprecalc.asm)

Relevant section:

- [pato_s_transformprecalc.asm#L14903](C:/Users/salam/Documents/Programacion/Mideas/server/temp/pato_s_transformprecalc.asm#L14903)

Evidence in that ASM:

- `corda`, `elevador1`, `elevador2` appear in `anim_tile_table`
- `anim_transform_table` is left empty except for end marker
- generated frame blocks:
  - `anim_transform_0_corda`
  - `anim_transform_1_elevador1`
  - `anim_transform_2_elevador2`

## Recommendation

Keep transform-mode generation as precomputed frames unless there is a strong reason to restore live VRAM transform logic.

For MSX1 SCREEN 2, precomputed frames are simpler, deterministic, and much easier to debug than runtime VRAM read/modify/write.

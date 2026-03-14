# PP7 Compression Experiments (2026-03-14)

This document records the compression experiments performed over `C:/Users/salam/Downloads/pp7.asm` so the results can be reused later without re-running the analysis.

## Scope

- Source analyzed: `C:/Users/salam/Downloads/pp7.asm`
- Focus:
  - sprite frame data
  - screen background layout data
  - collision/behavior map data
  - tile pattern/color data
  - font pattern/color data
- Notes:
  - `pp7.asm` already contains many ZX0-compressed blocks injected by the current pipeline.
  - Two sprite frames remained raw in `pp7.asm` during these tests:
    - `NINA_DEAD_RIGHT_6_F0`
    - `NINA_DEAD_LEFT_14_F0`

## Generated experiment artifacts

The following files were generated during the experiments:

- `C:/Users/salam/Downloads/pp7_sprite_zx0_experiment.asm`
- `C:/Users/salam/Downloads/pp7_sprite_zx0_experiment.json`
- `C:/Users/salam/Downloads/pp7_sprite_zx0_secondstage_experiment.asm`
- `C:/Users/salam/Downloads/pp7_sprite_zx0_secondstage_experiment.json`
- `C:/Users/salam/Downloads/pp7_all_zx0_secondstage_experiment.asm`
- `C:/Users/salam/Downloads/pp7_all_zx0_secondstage_experiment.json`
- `C:/Users/salam/Downloads/pp7_all_raw_single_zx0_experiment.asm`
- `C:/Users/salam/Downloads/pp7_all_raw_single_zx0_experiment.json`
- `C:/Users/salam/Downloads/pp7_screens_rle_vs_zx0_experiment.asm`
- `C:/Users/salam/Downloads/pp7_screens_rle_vs_zx0_experiment.json`
- `C:/Users/salam/Downloads/pp7_screens_superrle_vs_zx0_experiment.asm`
- `C:/Users/salam/Downloads/pp7_screens_superrle_vs_zx0_experiment.json`

## Experiment 1: Sprites, current per-frame ZX0 vs one unified raw ZX0

Question:
- What happens if all sprite frame raw data is concatenated and compressed once with ZX0 instead of keeping one ZX0 blob per frame?

Measured data:
- Sprite frames analyzed: `33`
- Frames already ZX0 in `pp7`: `31`
- Frames still raw in `pp7`: `2`
- Total raw sprite bytes: `2048`
- Current `pp7` sprite payload: `1626`
- Recompressed individually frame-by-frame with ZX0: `1630`
- One single unified ZX0 over all sprite raw data: `868`

Result:
- Unified raw ZX0 saves `758` bytes vs current `pp7` sprite payload.
- Unified raw ZX0 saves `762` bytes vs per-frame ZX0 recompression.

Interpretation:
- Per-frame ZX0 leaves a lot of cross-frame redundancy on the table.
- For this dataset, one unified ZX0 blob is much better than per-frame ZX0.

## Experiment 2: Sprites, ZX0 over existing sprite ZX0 blobs

Question:
- If the current sprite ZX0 blobs are concatenated and compressed again with a second ZX0 stage, is there still a gain?

Measured data:
- Existing compressed sprite frames in `pp7`: `31`
- Untouched raw sprite frames: `2`
- First-stage sprite ZX0 payload: `1498`
- Second-stage ZX0 over that first-stage payload: `1118`
- Current overall sprite payload including the two raw frames: `1626`
- Overall payload with second-stage ZX0 plus the two raw frames: `1246`

Result:
- Savings inside the compressed sprite set: `380` bytes
- Overall savings vs current sprite payload: `380` bytes
- With minimal offset table overhead:
  - 2-byte offsets for 31 entries: net approx `318` bytes saved
  - 3-byte offsets for 31 entries: net approx `287` bytes saved

Interpretation:
- ZX0-over-ZX0 does help.
- But it is clearly worse than compressing the unified raw sprite stream directly.

## Experiment 3: All current ZX0 blocks, ZX0 over ZX0

Question:
- If all current ZX0 blocks in `pp7.asm` are concatenated and compressed again with a second ZX0 stage, how much is gained globally?

Compressed blocks detected:
- `31` sprite frames
- `7` layouts
- `7` behavior maps
- `1` tile pattern
- `1` tile color
- `1` font pattern
- `1` font color
- Total compressed blocks: `49`

Measured data:
- Raw bytes represented by those blocks: `13776`
- First-stage payload of all current ZX0 blocks: `3217`
- Second-stage ZX0 over the full first-stage stream: `2785`

Result:
- Gross savings: `432` bytes
- With offset table overhead:
  - 2-byte offsets for 49 entries: net approx `334` bytes saved
  - 3-byte offsets for 49 entries: net approx `285` bytes saved

Interpretation:
- Global ZX0-over-ZX0 still gives a measurable gain.
- But the gain is moderate.

## Experiment 4: All relevant raw data concatenated, one single ZX0

Question:
- If all relevant raw data is reconstructed and concatenated into one raw stream, then compressed once with ZX0, how much better is that than the current mixed approach?

Scope:
- all current ZX0 asset blocks restored to raw
- plus the two sprite frames that were still raw in `pp7`

Measured data:
- Total blocks analyzed: `51`
- Total raw bytes: `13904`
- Current `pp7` payload for that scope: `3345`
- One single unified ZX0 over all reconstructed raw data: `2386`

Result:
- Savings vs current `pp7` payload: `959` bytes

Comparison against Experiment 3:
- Current payload: `3345`
- Global ZX0-over-ZX0 payload: `2913`
- Single ZX0 over all raw payload: `2386`
- Extra gain of unified raw ZX0 over global ZX0-over-ZX0: `527` bytes

Interpretation:
- This was the best size result among the global experiments.
- Compressing raw once is much better than applying a second ZX0 layer over already-compressed blobs.

## Experiment 5: Screens only, OptimizedRLE vs ZX0

Question:
- For screen background layouts and collision/behavior maps, how does simple RLE compare to ZX0?

Scope:
- `SCREEN_*_LAYOUT`
- `BEHAVIOR_*_DATA`

Totals:

### Layout

- Raw: `5376`
- ZX0: `813`
- OptimizedRLE: `2138`
- ZX0 advantage: `1325` bytes

### Behavior

- Raw: `5376`
- ZX0: `428`
- OptimizedRLE: `973`
- ZX0 advantage: `545` bytes

### Combined

- Raw: `10752`
- ZX0: `1241`
- OptimizedRLE: `3111`
- ZX0 advantage: `1870` bytes

Block-level result:
- ZX0 wins `14/14`
- OptimizedRLE wins `0/14`

Interpretation:
- For this game data, plain RLE is not competitive with ZX0 for screens or behavior maps.

## Experiment 6: Screens only, SuperRLE vs ZX0

Question:
- For screen background layouts and collision/behavior maps, how does the repo's SuperRLE compare to ZX0?

Totals:

### Layout

- Raw: `5376`
- ZX0: `813`
- SuperRLE: `1807`
- ZX0 advantage: `994` bytes

### Behavior

- Raw: `5376`
- ZX0: `428`
- SuperRLE: `801`
- ZX0 advantage: `373` bytes

### Combined

- Raw: `10752`
- ZX0: `1241`
- SuperRLE: `2608`
- ZX0 advantage: `1367` bytes

Block-level result:
- ZX0 wins `14/14`
- SuperRLE wins `0/14`

Interpretation:
- SuperRLE is clearly better than plain RLE.
- But for the `pp7.asm` screens, ZX0 still wins in every block.

## Final comparison

For the tested `pp7.asm` dataset:

1. Best global result:
   - one single ZX0 over reconstructed raw data
   - payload `2386`
   - savings `959` bytes vs current `pp7`

2. Second best global result:
   - global ZX0-over-ZX0
   - payload `2913`
   - savings `432` bytes gross vs current `pp7`

3. Sprite-specific result:
   - unified raw ZX0 over all sprite frames
   - payload `868`
   - savings `758` bytes vs current sprite payload

4. Screen compression result:
   - ZX0 beats both OptimizedRLE and SuperRLE in all tested layout and behavior blocks

## Practical recommendation

If implementation effort is justified, the order of value is:

1. Unify raw data before ZX0 wherever runtime access pattern allows it.
2. Prefer raw-unified ZX0 over ZX0-over-ZX0.
3. Keep ZX0 for screen layouts and collision maps; do not replace it with plain RLE or SuperRLE for the current `pp7`-style data.

## Important caveat

These experiments are size-only experiments.

A production implementation would need additional runtime design work:

- offset tables or lookup structures
- new load/decode flow for unified blobs
- possible RAM buffering strategy
- possible startup-time full decompression vs per-asset decompression tradeoff
- updated label remapping logic in the generator/postprocessor

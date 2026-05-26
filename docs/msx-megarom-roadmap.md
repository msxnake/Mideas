# Mideas MSX MegaROM Roadmap (Konami/ASCII)

## Objective

Enable the MSX generator to build stable MegaROM outputs with mapper-aware runtime/data access and IDE controls to export/compile in MegaROM mode.

## Reference Sources

- MSX ROM mapper reference (Konami, ASCII8, ASCII16): https://www.msx.org/wiki/ROM_mappers
- openMSX ROM mapper selection (`-romtype`): https://openmsx.org/manual/user.html
- Glass assembler CLI usage (`java -jar glass.jar ...`): https://www.grauw.nl/projects/glass/

## Current Status (2026-02-22)

### Phase 1: Mapper foundation (Done)

- Generator config includes `romMode`, `targetFormat`, `autoMegaROM`.
- `mapper.asm` runtime generated and included in unified/main build.
- Centralized routines available:
  - `mapper_runtime_init`
  - `mapper_set_bank_p1/p2/p3/p4`
  - `mapper_push_p2` / `mapper_pop_p2`
- Mapper state variables added in RAM map.
- Header boot path initializes mapper runtime state.

### Phase 2: Mapper-safe data access (Done)

- Screen layout/behavior loaders wrap ROM reads with `mapper_push_p2 -> mapper_set_bank_p2 -> mapper_pop_p2`.
- Current screen/behavior pointer banks are stored in:
  - `current_screen_layout_bank`
  - `current_behavior_map_bank`
- Collision read helpers now bank-switch before dereferencing ROM pointers:
  - `get_behavior_tile`
  - `get_tile_at_position`
- Pattern/color/font/sprite VRAM loaders are mapper-aware and restore previous bank after copy.

### Validation run (Done)

- `npm run -s build` passes.
- Unified ASM/ROM compile passed with:
  - `Examples/ejemplo1.json`
  - `Examples/mini_game62.json`
- Large sample `Examples/BasicPlatform(4).json` now also compiles after unique world-transition labels fix.

### Phase 3: Real bank allocation and packing (Done)

- Replaced fixed `EQU 1` bank constants with assembler-derived expressions:
  - `((LABEL - #4000) / #2000)`
- Added per-sprite pattern bank constants (`SPRITE_n_PATTERN_BANK`) and bank switch before each sprite copy.
- Kept 8KB bank packing report in unified ASM as diagnostic placement view.

Acceptance results:
- Unified ASM includes per-label bank constants and bank packing report.
- Compile passed on representative projects:
  - `Examples/ejemplo1.json`
  - `Examples/mini_game62.json`

## Placement Policy To Preserve

This is the current architectural rule for stable MegaROM work and should be
treated as a build invariant, not as an optional optimization:

- ZX0 data must be packed after compression, using final compressed size as the
  allocator input.
- Data must be assigned to hard placement zones and must not overflow them:
  - `ascii8` / 8 KB windowed layouts: pack data in 8 KB zones.
  - `ascii16` / 16 KB windowed layouts: pack data in 16 KB zones.
- Code should prefer 16 KB-stable regions or larger contiguous areas whenever
  possible, because routine splitting is expensive and fragile.
- Code should only be split at explicit far-call boundaries; arbitrary slicing
  of routines across banks is not an acceptable default strategy.
- Diagnostics should report compressed size, assigned zone, remaining slack,
  and any overflow before Glass/OpenMSX validation.

Current limitation to keep in mind:

- The present unified MegaROM packer still emits an 8 KB-first diagnostic view
  and an 8 KB-oriented code layout.
- That is useful for Konami and partial ASCII8 work, but it is not yet the
  final zone-aware allocator required for stable `ascii8`/`ascii16` builds.

## Konami8K Paper Alignment (2026-05-02)

Completed:

- Konami MegaROM data uses the P3 `#A000-#BFFF` 8 KB window.
- Generated `resource_table` descriptors now use the compression-ready format:
  `bank`, `address`, `storedSize`, `uncompressedSize`, `flags`.
- `RESOURCE_FLAG_COMPRESSED_ZX0` is defined for future ZX0 resource entries.
- `resource_load_to_ram_by_id` can route flagged banked resources through the
  resident `dzx0_standard` decoder while keeping the source bank mapped.
- `resource_find_by_id` preserves the descriptor ABI after reading 8-byte table
  entries: callers get `A=bank`, `DE=address`, and `BC=storedSize` on both cache
  hits and fresh table lookups.
- `resource_load_to_vram_by_id` now supports compressed banked resources with a
  hybrid path: resources that fit the shared 1488-byte scratch buffer decode to
  RAM and upload through `FAST_LDIRVM`; larger resources decode ZX0 directly to
  VRAM.
- Konami8K validation rejects uncommented `ld a,i` / `ld a,r` interrupt-state
  reads because of the Z80 errata risk.
- Table-backed MegaROM ZX0 post-processing is implemented for RAM-safe resource
  categories. It rewrites compressed resource blocks, repacks the P3 8 KB data
  banks, rebuilds `resource_table`, and regenerates `packing_manifest.json`,
  `banks.json`, `project_usage.json`, `unused_report.txt`, and
  `segment_budget.json` from final addresses and sizes.
- The post-processor now measures both `DB` and `DW` data bytes when repacking.
  Mixed `DW`/`DB` blocks are kept raw unless they have an exact byte stream, so
  resource table addresses stay aligned with Glass symbols.
- OpenMSX smoke for `joc52_banked_zx0v2_v6_megarom.rom` passed with
  `-romtype konami`: no reset after boot, IRQ counter advances, SPACE enters the
  game, RIGHT changes player X, and screenshots at t10/t14/t20 stay rendered.
- OpenMSX smoke for `joc52_banked_zx0vram_v1_megarom.rom` passed after enabling
  compressed VRAM resources: 51 resources compressed, including 32 sprite
  pattern blocks, 3 tile pattern blocks, and 3 tile color blocks; net saved
  bytes increased to 8933; screenshots at t10/t14/t20 stay rendered.
- Current `joc52` regression matrix now passes the same scripted OpenMSX smoke:
  - `simple32k` with ZX0: 28410 raw bytes, padded to 32768; player X moves
    `16 -> 120`.
  - raw Konami MegaROM with `--skip-zx0-preprocess`: 147456 raw bytes, padded
    to 262144, 2 data banks; player X moves `16 -> 100`.
  - table-backed ZX0+VRAM Konami MegaROM: 139264 raw bytes, padded to 262144,
    1 compressed data bank; player X moves `16 -> 94`.
- Current `joc60` regression matrix also passes the same scripted OpenMSX smoke:
  - `simple32k` with ZX0: 32074 raw bytes, padded to 32768; net saved 4751
    bytes; player X moves `16 -> 134`.
  - raw Konami MegaROM with `--skip-zx0-preprocess`: 147456 raw bytes, padded
    to 262144, 2 data banks; player X moves `16 -> 136`.
  - table-backed ZX0+VRAM Konami MegaROM: 139264 raw bytes, padded to 262144,
    1 compressed data bank, 51 compressed resources, net saved 10936 bytes;
    player X moves `16 -> 136`.
- `scripts/build_mideas_unified_rom.py --openmsx-smoke` now generates a debug
  Tcl probe from the Glass `.sym`, launches OpenMSX with the resolved mapper
  type, captures t10/t14/t20 screenshots, and fails if SPACE/RIGHT/regression
  markers do not appear.
- OpenMSX smoke runs are serialized with a local lock because the runner kills
  stale `openmsx.exe` processes before launching a new probe. Each smoke also
  retries once after a probe/emulator failure to absorb transient headless timing
  issues without weakening deterministic failures.
- MegaROM compressed VRAM resources now use RAM staging when they fit
  `ZX0_VRAM_TRANSFER_BUFFER`, keeping the fast `FAST_LDIRVM` upload path for
  common tiles and sprites. Larger VRAM resources fall back to direct-to-VRAM
  ZX0 decode, so they are no longer capped by the 1488-byte shared scratch
  buffer.
- The large direct-to-VRAM fallback remains available for compressed VRAM
  resources that do not fit the 1488-byte RAM staging buffer, but it still
  needs validation with a known-good project JSON whose VRAM resources exceed
  that threshold.
- `--openmsx-smoke-require-movement` is available for stricter projects such as
  `joc60`; default smoke now accepts stationary projects that still boot,
  advance IRQs, and render screenshots.
- Konami8K validation now enforces the paper's resident-kernel/data separation:
  mapper/runtime/resource/ZX0/ISR routines must remain before the first
  `org #6000`, asset banks must not overlap resident or far-code banks, and
  active code cannot reference banked resource labels directly.
- MegaROM screen boss placement loading now goes through `RESOURCE_ID` +
  `resource_load_to_ram_by_id`, so boss placement data is copied into RAM
  before runtime use instead of dereferencing a banked table symbol directly.
- MegaROM sprite frame pointer tables no longer point at banked sprite pattern
  labels; sprite pattern uploads use the resource manager/preload path.
- Added `scripts/run_mideas_regression_matrix.py` to run the repeatable
  `simple32k`, `plain48k`, and `megarom_konami` compile/OpenMSX smoke matrix
  for a project JSON. By default it writes full per-mode build logs to
  `server/temp/*_build.log` and prints only ROM, ZX0, Konami8K, and OpenMSX
  summary lines; `--verbose` restores full streaming output.
- Current `tales7` regression matrix passes the scripted OpenMSX smoke:
  - `simple32k`: 16384-byte ROM, boots and renders.
  - `plain48k`: 49152-byte ROM, boots and renders.
  - `megarom_konami`: 131072-byte ROM, 16 Konami8K segments, 15 resources, 1
    compressed data bank, boots and renders.
- Current `joc52` regression matrix passes the same scripted OpenMSX smoke:
  - `simple32k`: 32768-byte ROM; player X moves `16 -> 120`.
  - `plain48k`: 49152-byte ROM; player X moves `16 -> 112`.
  - `megarom_konami`: 262144-byte ROM, 32 Konami8K segments, 55 resources, 1
    compressed data bank, net saved 8933 bytes, max real code-bank usage 7729
    bytes; player X moves `16 -> 94`.
- Current `joc60` regression matrix passes the same scripted OpenMSX smoke:
  - `simple32k`: 32768-byte ROM; player X moves `16 -> 134`.
  - `plain48k`: 49152-byte ROM; player X moves `16 -> 134`.
  - `megarom_konami`: 262144-byte ROM, 32 Konami8K segments, 55 resources, 1
    compressed data bank, net saved 10936 bytes, max real code-bank usage 7729
    bytes; player X moves `16 -> 134`.
- Code-bank validation now uses Glass symbols emitted by unique
  `BANK_n_USED_END` labels. The old ASM-text module-size fields in
  `segment_budget.json` are explicitly named `estimatedUsedBytes`,
  `estimatedFreeBytes`, and `estimatedOverBudget`; hard validation checks the
  assembled end labels instead, including bank 0.
- Konami8K validation now rejects direct `call`/`jp` instructions from one
  far-code bank to a label defined in a different far-code bank. Cross-overlay
  branches must go through the bank-0 `_far` trampolines so P1 is saved,
  remapped, restored, and returned without corrupting the caller's bank.
- Konami8K validation now also rejects far-code `call`/`jp` branches directly into primary
  bank 1/P1 or bank 3/P3 labels. P1 is occupied by the executing overlay, and
  P3 is the dynamic asset-data window, so those calls must go through bank-0
  resident wrappers. The `worlds` far bank now calls
  `call_apply_collected_tiles_resident`, which maps component bank 1 only for
  the duration of `apply_collected_tiles`.
- Konami8K validation now rejects scattered mapper register writes. Writes to
  `MAPPER_REG_Px` or raw Konami mapper addresses `#6000/#8000/#A000` must stay
  inside the resident `mapper_set_bank_pX` routines, keeping bank switching
  centralized and auditable.
- Konami8K artifact validation now reports `residentP3Used`, measured from
  Glass `BANK_3_USED_END`, so the pipeline exposes how much resident code still
  occupies `#A000-#BFFF` before enforcing the paper's future "P3 data-only"
  layout.
- `scripts/build_mideas_unified_rom.py` now has `--strict-p3-data-window`,
  which turns the `residentP3Used` diagnostic into a hard Konami MegaROM
  validation failure and reports the responsible bank-3 resident modules. This
  gives the P3 data-only refactor a deterministic red/green gate while keeping
  current builds usable until GameFlow/resident code is moved out of `#A000`.
- GameFlow is no longer emitted in the P3 `#A000-#BFFF` resident window for
  Konami MegaROM builds. The unified packer now groups GameFlow after
  StateMachine in P2 (`#8000-#9FFF`) and leaves Bank 3 as an empty reserved P3
  window. `joc60` now passes `--strict-p3-data-window` with
  `residentP3Used=0` and OpenMSX movement smoke (`playerX=16->136`).
- Bank 3 is now the first physical asset-data segment for Konami MegaROM
  builds. Resident code is limited to banks 1-2, data starts at
  `#A000-#BFFF`, and far-code overlays are emitted after all reserved data
  zones while still executing through the P1 `#6000-#7FFF` trampoline window.
- The ZX0 post-processor now preserves the original data-zone count after
  compression, including empty reserved zones, so compressed data cannot move
  following far-code banks to different physical segments. `banks.json`,
  `packing_manifest.json`, `segment_budget.json`, and
  `bank_optimizer.json` all report those reserved empty data banks.
- Konami8K validation now checks the paper's physical-bank formula for every
  far-code overlay: `FAR_BANK_N_ROM_START` must assemble to a ROM address whose
  `((label - #4000) / #2000)` value is exactly `N`.
- Konami8K validation now checks every generated `_far` trampoline contract:
  IRQ must be disabled before bank mapping, the current P1 bank must be saved
  and restored through `mapper_bank_p1_current`, `EI` can only happen after the
  original bank is back, and `AF`/alternate-`AF` save sequences must balance
  before `RET`.
- Strict P3 data-window OpenMSX smoke now passes on the current bank-3 data
  layout:
  - `joc60_data_bank3_strict`: 32 Konami8K segments, 2 data banks
    (`bank 3` used, `bank 4` reserved empty after ZX0), `residentP3Used=0`,
    player X moves `16 -> 136`.
  - `joc52_data_bank3_strict`: 32 Konami8K segments, 2 data banks
    (`bank 3` used, `bank 4` reserved empty after ZX0), `residentP3Used=0`,
    player X moves `16 -> 118`.
- The compile pipeline now has `--strict-vram-staging`, which fails Konami
  MegaROM validation if any compressed VRAM resource is larger than the shared
  RAM staging buffer and would fall back to the slow direct-to-VRAM ZX0 decoder.
  Current `joc52`/`joc60` strict builds report `largeVramResources=0`, so their
  compressed VRAM loads use the faster RAM staging path.
- Final MegaROM packing artifacts now include `placementReason` for each banked
  resource. The reason records the post-ZX0 first-fit placement, whether the
  resource was part of a merged unit, compressed/raw size, bank/zone/offset, and
  remaining zone slack. Konami8K artifact validation requires this field so
  placement decisions stay inspectable during allocator work.
- `segment_budget.json` now also reports `placementReason` for every code bank
  and code module. Resident modules explain their fixed P1/P2 kernel window,
  far modules explain their size-sorted overlay index and P1 trampoline window,
  and Konami8K artifact validation requires those reasons before accepting the
  build.
- Mapper metadata is now carried through the MegaROM allocator artifacts:
  `packing_manifest.json`, `banks.json`, `project_usage.json`, and
  `bank_optimizer.json` record mapper format, data-window base/mask/divisor,
  and segment size. The post-ZX0 resource-table rewrite now derives window
  addresses from that parsed mapper window instead of hardcoding Konami
  `#A000`, and it accepts both 8 KB and 16 KB data zones.
- `bank_optimizer.json` proposed placement is now driven by mapper data-zone
  capacity instead of a hardcoded 8 KB value. ASCII16 dry-run placement reports
  `zoneSize=16384` with 16 KB `usedBytes/freeBytes` accounting, and the generic
  MegaROM artifact validator rejects proposed placements whose zone size or
  accounting does not match the requested mapper.
- The generic MegaROM artifact validator now also verifies optimizer resource
  coverage: `currentPlacement` and `proposedPlacement` must match the manifest
  resource count, every proposed bank's `usedBytes` must equal the sum of its
  resource sizes, and the proposed placement must include every manifest
  resource exactly once.
- The generic MegaROM validator now cross-checks `load_plan.json` summary
  accounting against concrete scene/bank entries and the manifest: scene count,
  unique data banks, bank touches, stored/raw bytes, and compressed-resource
  totals must all agree before a MegaROM build is accepted.
- The build script now validates mapper metadata for every MegaROM target, not
  only Konami. `packing_manifest.json`, `banks.json`, `project_usage.json`, and
  `bank_optimizer.json` must agree with the requested mapper format and each
  resource must stay inside its mapper data segment/window.
- `load_plan.json` now carries the same mapper metadata plus a global summary
  of scene/resource counts, data-bank touches, stored/raw bytes, and compressed
  resources. Both the TypeScript generator and the post-ZX0 artifact refresh
  path emit this metadata, and the build validator rejects MegaROM artifacts
  when the load plan mapper does not match the requested target.
- `scripts/run_mideas_regression_matrix.py` can now expand a single MegaROM
  regression run across multiple mapper targets via `--target-formats`, while
  keeping simple32k/plain48k as single non-mapper cases. Compact summaries also
  include the generic `MegaROM mapper artifacts` validation line.
- OpenMSX smoke can now run with forced mapper type or with mapper auto-detect.
  `scripts/build_mideas_unified_rom.py --openmsx-smoke-no-forced-romtype`
  omits `-romtype`, and `scripts/run_mideas_regression_matrix.py
  --openmsx-smoke-romtype-modes forced,auto` duplicates smoke cases with clear
  suffixes and `romtype=forced|auto` summaries.
- The regression matrix treats ASCII16 as a strict-promotion mapper target by
  default: it still compiles and prints `ASCII16 runtime layout`, but skips
  OpenMSX smoke unless `--strict-ascii16-runtime-layout` or the explicit force
  override is present. This lets exploratory mapper-expanded matrices cover
  `konami,ascii8,ascii16` without confusing layout-contract gaps with new
  gameplay regressions.
- The regression matrix accepts repeated `--json` arguments, so the current
  baseline project set (`joc51`, `joc_tales_9`, `patoantic248`, `joc60`) can be
  compiled through the same mapper matrix without external shell loops.
- Baseline compile matrix passed for `joc51`, `joc_tales_9`, `patoantic248`,
  and `joc60` across `megarom_konami`, `megarom_ascii8`, and
  `megarom_ascii16`. The initial ASCII16 pass reported the expected `P1/#6000`
  runtime-layout blocker, which became the strict promotion gate.
- The mapper-expanded `joc52` runtime matrix found and fixed the first hard
  ASCII8 contract mismatch. ASCII8 far-code trampolines now execute `#6000`
  overlays through P2/register `#6800`, while P1 keeps bank 0 resident at
  `#4000`. ASCII8 banked data and screen/behavior map access now use
  P3/register `#7000` for the `#8000` data window, so RAM sentinel bank `#FF`
  can no longer corrupt the component/input code window. OpenMSX smoke for
  `joc52` now passes in ASCII8 with movement (`player X 16 -> 118`) and mapper
  artifacts report `format=ascii8`, `segmentSize=8192`, `window=p3/#8000`,
  `resources=55`.
- ASCII16 compile metadata now validates the 16 KB data-window artifacts
  (`format=ascii16`, `segmentSize=16384`, `window=p3/#8000`) while reporting a
  separate runtime-layout diagnostic. The early ASCII16 output stayed blocked
  because far-code trampolines still used the lower `#4000-#7FFF` 16 KB page
  through `P1/#6000`; the OpenMSX smoke gate now rejects exact hazards instead
  of treating all ASCII16 builds as an unexplained blanket block.
- `segment_budget.json` now carries a mapper runtime-layout diagnostic. For
  ASCII16 it reports the shared 16 KB code-window granularity, resident lower
  page banks, far lower page banks, lower-page hazards, and the exact reason a
  build is blocked or promoted before emulator acceptance.
- `segment_budget.json` now carries mapper-aware budget metadata. Konami keeps
  the legacy `konami8k_segment_budget` scope for existing validation, while
  ASCII targets report `megarom_mapper_segment_budget`, `mapper.format`,
  `codeSegmentSize`, `dataSegmentSize`, and per-data-bank window fields so
  ASCII16 diagnostics no longer look like pure Konami8K output.
- MegaROM resident wrappers now resolve only to labels that are actually placed
  in emitted code banks or generated far trampolines. Optional modules such as
  `font` can no longer leave wrappers pointing at unplaced labels like
  `print_string_screen2`; absent targets fall back to `resident_noop`. The
  `joc_tales_8` Konami build now compiles and passes OpenMSX smoke with
  movement (`player X 216 -> 78`).
- The Screen 2 tile pipeline now reserves char 254 for GameFlow transition box
  cells and char 255 as the empty/SPC sentinel. Base pattern/color uploads are
  capped to chars `128-253`, runtime tilebank allocation rejects assignments
  that would touch 254/255, and `init_char0_color` reinstalls both reserved
  chars across all three SCREEN 2 banks so stale VRAM cannot leak into
  transition or empty boss/layout cells. `joc_tales_9` now compiles across
  `konami/ascii8/ascii16` and renders the large boss without the repeated
  reserved-char artifact.
- The MegaROM build and regression matrix now expose a
  `--strict-tilebank-integrity` gate. Normal builds still report
  `tilebankIssueScreens/tilebankIssueCells`, while strict validation fails when
  project screens reference missing or out-of-range Screen 2 tile assignments.
- The regression matrix also forwards `--strict-p3-data-window` and
  `--strict-vram-staging` to the builder, so Konami acceptance runs can enforce
  the paper's P3 data-only layout and RAM-staged ZX0 VRAM loads without
  dropping down to per-project build commands.
- The build and regression matrix now expose `--strict-ascii16-runtime-layout`.
  Non-strict ASCII16 runs skip OpenMSX smoke by default, while strict runs fail
  when `segment_budget.json.runtimeLayout.smokeBlocked=true` or assembled
  resident symbols overflow their window. This gives the 16 KB
  code-placement/RAM-trampoline work a deterministic red/green gate.
- Tilebank integrity diagnostics now split strict failures into
  `missingAssetCells` and `unassignedCells`. The current `joc51`/`joc60`
  strict tilebank failures are project-data issues (`missingAssetCells=96`,
  `unassignedCells=0`): their screen maps still reference deleted tile IDs, not
  mapper placement mistakes.
- PresentationScreen MegaROM flow now separates the short image-load routine
  from configurable SPACE/frame waits. GameFlow calls
  `show_presentation_screen_image_far`, lets the far-call trampoline restore the
  mapper window, then waits from GameFlow-owned code. This avoids holding ASCII8
  P2 on a `screens_code` overlay during long HALT/input loops.
- Optional boot PresentationScreen uses the same short image-load entrypoint and
  boot-local wait helpers, so `showAtBoot` no longer needs to run a long
  screen-code wrapper through a far trampoline.
- The forced-romtype gameplay matrix now passes Konami and ASCII8 with movement
  required for the baseline projects: `joc51`, `joc_tales_9`, `patoantic248`,
  and `joc60`. The previously failing ASCII8 cases now move
  `joc_tales_9` `216 -> 78` and `patoantic248` `8 -> 82`.
- ASCII16 resource descriptors now emit runtime 16 KB segment ids instead of
  logical ASM banks after the post-ZX0 repack step. This fixes the first
  OpenMSX reset/crash in `patoantic248`: gameplay pattern/color resources now
  map P3 segment `1` and decode real ZX0 bytes instead of reading `#FF`.
- ASCII16 far overlays now route generated `call_*_resident` wrappers through
  local RAM-bridge stubs as well as explicitly collected bank-0 labels. This
  fixes the first hidden-wrapper fault where `init_animated_tiles` called
  `call_update_animated_tiles_vram_resident` while the animtiles lower-page
  segment was mapped.
- Component trigger helpers are now emitted as a bank-0 resident copy when
  MegaROM components call them directly. This avoids resolving
  `component_trigger_edge_pressed_a` to a GameFlow lower-page overlay address
  that is only valid while that ASCII16 segment is mapped.
- `patoantic248` ASCII16 now reaches gameplay in OpenMSX and passes strict
  movement smoke (`playerX=8->40`). The key fix was keeping init-time
  `SM_ExecuteActions` no-op calls local to `entities.asm`; a direct
  `call resident_noop` from a lower-page ASCII16 overlay executed the mapped
  entity bank at the resident address instead of bank 0.
- The ASCII16 runtime-layout gate now treats lower-page far banks as acceptable
  when the RAM trampoline is installed, no hidden resident calls remain, and no
  upper-page resident code overlaps the data window. The baseline compile matrix
  for `joc51`, `joc_tales_9`, `patoantic248`, and `joc60` passes
  `konami/ascii8/ascii16` with strict VRAM staging and strict ASCII16 layout.
- The matrix runner now promotes ASCII16 to normal OpenMSX smoke when
  `--strict-ascii16-runtime-layout` is enabled. Without that strict gate it
  still skips ASCII16 smoke by default, so exploratory mapper matrices do not
  run emulator probes without the layout contract.
- `segment_budget.json` now reports ASCII16 resident code-window pressure as
  explicit estimated runtime-layout metadata:
  - `residentEstimatedWindowOverflowCount`
  - `residentEstimatedWindowOverflowSamples`
  - `residentEstimatedOutOfWindowLabelCount`
  - `residentEstimatedOutOfWindowLabelSamples`
  - `residentEstimatedOutOfWindowCallCount`
  - `residentEstimatedOutOfWindowCallSamples`
  - `status=smoke-candidate-risk` when no hard mapper hazard blocks smoke, but
    resident modules such as `components` estimate beyond their fixed window.
  This keeps existing OpenMSX smoke candidates runnable while making the
  label-level component placement risk visible in the build output.
- The first `joc60` ASCII16 pass with these diagnostics reports 67 estimated
  resident labels outside the fixed window and 54 call sites targeting them.
  `refresh_player_sprite_fastpath` itself remains inside the resident window
  estimate, which narrows the next investigation to helper calls later in
  `components` rather than that fastpath label directly.
- Strict ASCII16 builds now emit a Glass `.sym` file by default and compare
  actual `BANK_n_USED_END` labels against each resident bank window. The current
  `joc60` ASCII16 strict pass reports `actualResidentOverflows=0` and
  `maxActualResidentUsed=7739`, so the remaining `smoke-candidate-risk` status
  is an estimator pressure warning rather than a proven assembled overflow.
- The strict compile matrix for `joc51`, `joc_tales_9`, `patoantic248`, and
  `joc60` passes across `konami`, `ascii8`, and `ascii16`. All four ASCII16
  cases report `actualResidentOverflows=0`; their remaining risk is the
  estimated component label/call pressure that still needs emulator promotion.
- Strict ASCII16 OpenMSX smoke with movement now passes for `joc51`,
  `joc_tales_9`, `patoantic248`, and `joc60` without the older
  `--force-openmsx-smoke-compile-only` override. The latest `patoantic248` black
  screen was a hidden resident-label call: the conservative init-time
  `SM_ExecuteActions` skip used `resident_noop`, but that label is only valid
  when bank 0 owns the lower page. The generator now emits
  `entities_ascii16_init_noop` inside `entities.asm`, so the call returns inside
  the currently mapped overlay.
- `SM_ExecuteActions` still has a bank-0 trampoline/wrapper path for non-empty
  runtime cases, preserving the entity index in `A`. The ASCII16 runtime layout
  report exposes `farToFarDirectCallCount` and samples, and strict validation
  treats any remaining direct lower-page overlay-to-overlay call as a hard smoke
  blocker. The strict ASCII16 smoke set reports `farToFarDirectCalls=0`,
  `hiddenResidentCalls=0`, and movement OK.
- The OpenMSX mapper-smoke contract now receives the Glass `.sym` file for
  ASCII16 and rejects smoke if assembled resident code really overflows its
  window (`actualResidentOverflows > 0`), not only when the pre-assembly
  `smokeBlocked` flag is true.
- ASCII16 build output now reports the effective runtime status from real Glass
  symbols when they are available. Estimated resident-window pressure is still
  preserved as diagnostics, but `status=smoke-candidate` is emitted when
  `actualResidentOverflows=0`; for example `joc60` reports
  `estimatedResidentWindowOverflows=1`, `actualResidentOverflows=0`, and
  `maxActualResidentUsed=7739`.
- `segment_budget.json.runtimeLayout` is now annotated after assembly with the
  same post-Glass status: `preAssemblyStatus` preserves the estimated state,
  `status` carries the effective smoke state, and
  `actualResidentWindowOverflowCount` / `maxActualResidentUsed` record the real
  symbol-derived resident usage.
- The post-Glass ASCII16 annotation now also records per-resident-bank usage in
  `actualResidentBankUsages` plus `minActualResidentFree`, so future allocator
  work can see exact free/overflow bytes per resident window instead of only the
  aggregate maximum.
- ASCII16 resident usage now has a low-margin warning threshold
  (`actualResidentLowFreeThreshold=256`). Builds keep passing when the resident
  window fits, but `actualResidentLowFreeBankCount` and
  `actualResidentLowFreeBankUsages` flag cases such as `patoantic248`, where the
  current resident window has very little free space left.
- The build and regression matrix now expose
  `--strict-ascii16-resident-free-bytes N`. This keeps the default pipeline
  compatible, while acceptance runs can fail when any assembled ASCII16 resident
  window has less than `N` bytes free.
- StateMachine tree-shaking now keeps `Condition_AnimComplete` and
  `Condition_VariableCompare` emitted. This avoids a bad strip path where
  project data still references those handlers but Glass sees an undefined
  dispatch-table symbol.
- ASCII16 lower-page overlays now keep direct hardware helpers local after the
  final emitted-module sync step. `FAST_LDIRVM`/`FAST_WRTVRM` copies are renamed
  per far bank, including their local labels, so routines that stream ROM-local
  data to VRAM keep the source bank visible instead of remapping bank 0 first.
  This fixes the `joc51` ASCII16 HUD/font corruption: OpenMSX smoke renders the
  HUD cleanly and movement changes `playerX=16->134`.
- Runtime SCREEN 2 tilebanks now promote boss phase/form/attack tiles into all
  three vertical pattern/color banks when a referenced tilebank only assigned
  them in one bank. `joc51` proved the failure mode: the boss behavior RAM moved
  correctly, but the Name Table wrote low fallback tile indices because the boss
  chars were absent from the middle/lower SCREEN 2 banks. The fixed build emits
  the boss matrix with runtime tilebank chars (`#93..#9C`) and OpenMSX captures
  show the full boss moving across the screen.
- The post-fix compile matrix passes for `joc51`, `joc_tales_9`,
  `patoantic248`, and `joc60` across `megarom_konami`, `megarom_ascii8`, and
  `megarom_ascii16` with strict ASCII16 runtime layout plus
  `--strict-ascii16-resident-free-bytes 64`. `patoantic248` still reports the
  expected low resident margin (`minActualResidentFree=73`) but remains above
  the 64-byte acceptance gate.
- Post-ASM block reports now include source-size pressure for annotated blocks:
  total annotated lines/bytes and dead-candidate lines/bytes are emitted in the
  Markdown/JSON reports and compact CLI output. Dead-block candidates are sorted
  by source bytes in the report. The same inventory now includes the largest
  annotated blocks by source pressure, which gives the next optimization pass a
  deterministic priority list even when no block is currently removable. Reports
  also rank the largest global label spans, so unannotated hot spots can be found
  before adding more `@mideas:block` markers. A separate unannotated-label
  ranking now filters out labels already owned by blocks, giving a direct queue
  for the next annotation pass. Unannotated labels are now categorized as
  `bios_helper`, `bank_marker`, `data`, `screen_loader`, `boot_or_init`, or
  `runtime_code`, preventing BIOS/data/bank sentinels from being mixed with
  routine-level optimization targets. On `joc_tales_9`, the largest remaining
  unannotated entries are correctly split between `FAST_SNSMAT` (`bios_helper`),
  `BANK_0_USED_END` (`bank_marker`), `tilebank_pattern_data_0` (`data`), and
  `load_screen_new_playable_screen_777833014252` (`screen_loader`).
- Components ASM annotation coverage now includes `runtime.components.animation`,
  `runtime.components.wallcollision`, `runtime.components.collision`,
  `runtime.components.input`, and `runtime.components.jump`. Interrupt ASM now
  also marks `runtime.interrupt.dispatcher` and `runtime.interrupt.task_input`,
  and entity initialization emits per-entity blocks such as
  `data.entities.player_1.init`. Boss ASM now separates
  `runtime.boss.entry` from the larger `runtime.boss.core` helper block. On
  `joc_tales_9` this raises the optimized post-ASM block inventory from 6 to 15
  blocks while keeping
  `Dead-block candidates: 0`, marker errors at 0, and the ROM byte-identical
  after post-ASM validation.
- Init and screen-loader ASM now have explicit blocks too:
  `runtime.components.init` covers `init_components` and the shared
  `component_fill_32_a` helper, while generated `load_screen_*` routines emit
  `runtime.screens.*.loader` blocks. On `joc_tales_9` this raises the optimized
  block inventory to 17 blocks with `Dead-block candidates: 0`, marker errors
  at 0, and a byte-identical ROM.
- Runtime hot spots now have a first pass of label-to-block coverage:
  `runtime.components.gravity` wraps `init_gravity_system` and
  `update_gravity_component`, `runtime.gameflow.world_loop` wraps
  `gameflow_world_game_loop`, and `runtime.scroll.core` wraps the generated
  scroll helpers from `init_scroll_system` through `redraw_viewport`. On
  `joc_tales_9` this raises the optimized block inventory to 20 blocks with
  `Dead-block candidates: 0`, marker errors at 0, and a byte-identical 128 KB
  ROM. The largest remaining unannotated `runtime_code` entries are now outside
  those blocks, led by `expand_screen_block_layout_4x4`,
  `gameflow_handle_worldlink`, `resource_dzx0_to_vram`,
  `resource_find_by_id`, and `update_entity_patrol_facing`.
- A second runtime annotation pass now covers those entries too:
  `runtime.screens.block_layout_expander`, `runtime.gameflow.worldlink`,
  `runtime.resources.manager`, and `runtime.entities.patrol_facing` mark the
  screen-block expander, WorldLink handler, resource lookup/copy/decode helpers,
  and directional patrol-facing helper. The marker parser now ignores
  double-commented artifact copies such as `; ; @mideas:block`, preventing
  compressed ASM reports from double-counting source-file snapshots. On
  `joc_tales_9` this raises the optimized block inventory to 24 active blocks,
  with `Dead-block candidates: 0`, marker errors at 0, and a byte-identical
  128 KB ROM. The largest remaining unannotated `runtime_code` item is now
  `mapper_call_hl_auto`, followed by smaller mapper/page0 helpers.
- Mapper/page0 coverage now marks `runtime.mapper.core` and the MegaROM
  `runtime.page0.stubs` block. `runtime.mapper.core` covers mapper bank
  setters, push/pop helpers, far-call trampolines, and `mapper_call_hl_auto`.
  The page0 marker covers the no-op MegaROM labels required by shared boot code.
  On `joc_tales_9`, the optimized block inventory is now 26 active blocks with
  `Dead-block candidates: 0`, marker errors at 0, and the ROM still
  byte-identical after post-ASM validation.
- Component/runtime helper coverage now includes `runtime.components.behavior_tile`,
  `runtime.components.health`, `runtime.components.deadly_tiles`,
  `runtime.components.entity_management`,
  `runtime.components.state_machine_executor`, `runtime.gameflow.end_screen`,
  and `runtime.interrupt.stop`. This removes the previous largest unannotated
  runtime-code items (`get_behavior_tile_nb`, `gameflow_handle_end`,
  `create_entity`, `stop_interrupt_system`, `update_entity_deadly_flag_runtime`,
  `update_health_component`, and `execute_all_state_machines`) from the open
  optimization queue. On `joc_tales_9`, the optimized block inventory is now 33
  active blocks with `Dead-block candidates: 0`, marker errors at 0, and a
  byte-identical 128 KB ROM.
- The next annotation pass covers the remaining routine-level hot spots from
  the same report: `runtime.animtiles.core`,
  `runtime.interrupt.task_api`, `runtime.screens.copy_rect`,
  `runtime.components.directional_sprite_sync`, `runtime.components.carry`,
  per-world loader blocks such as `runtime.worlds.worldmap_1777833018852.loader`,
  `runtime.interrupt.vblank_flag`, `runtime.screens.colors`, and
  `runtime.sound.psg_lowlevel`. On `joc_tales_9`, strict post-ASM validation now
  reports 42 active blocks, `Dead-block candidates: 0`, marker errors at 0, and
  a byte-identical 128 KB ROM. The source-pressure inventory no longer lists any
  unannotated `runtime_code` labels; the largest remaining unannotated entries
  are intentionally classified as `bios_helper`, `bank_marker`, `data`, or
  `boot_or_init`.
- Cross-project source-pressure validation now covers the requested Downloads
  fixtures under strict Konami MegaROM post-ASM optimization:
  `joc_tales_9`, `joc64`, `joc51`, `patoantic249`, and `patoantic248`.
  Follow-up blocks mark project-specific hot spots that did not appear in the
  smaller `joc_tales_9` fixture: `runtime.components.tile_interaction`,
  `runtime.components.collected_tiles`, `runtime.hud.core`,
  `runtime.gameflow.screen_timer`, `runtime.font.loading`,
  `runtime.components.damage`, `runtime.components.secret_zones`,
  `runtime.gameflow.submenu`, `runtime.gameflow.text_screen`, and
  `runtime.gameflow.if_then_else`. Screen/presentation/sprite asset labels are
  categorized as data instead of runtime code. Final strict validation reports
  0 dead-block candidates, 0 marker errors, 0 unannotated `runtime_code`
  hot spots, and byte-identical optimized ROMs for all five fixtures
  (`joc_tales_9`: 42 blocks, `joc64`: 49, `joc51`: 51, `patoantic249`: 64,
  `patoantic248`: 64).
- Builds can now enforce that policy with `--strict-post-asm-no-dead-blocks`.
  The gate runs dead-block analysis on the exact ASM selected for Glass
  compilation, so `--post-asm-opt` validates the optimized ASM while check-only
  or strict-only builds validate the generated ASM. The regression matrix
  exposes the same flag for acceptance runs. `test_post_asm_optimize.py` now
  covers both the clean path and the strict failure path with a real optimizer
  subprocess.
- Mapper allocator artifacts now carry concrete placement explanations for both
  current and proposed data layouts. `packing_manifest.json` and `banks.json`
  resources emit `placementReason`, while `bank_optimizer.json` proposed banks
  include per-resource `resourcePlacements` with proposed bank, zone offset,
  mapper-window address, size, and reason. The generic MegaROM artifact
  validator rejects missing reasons, proposed resources that cross the mapper
  data segment, and mismatches between bank-level `resourceIds` and proposed
  placements. `test_megarom_packing_manifest_json.py` covers the new fields, and
  the strict Konami Downloads matrix (`joc_tales_9`, `joc64`, `joc51`,
  `patoantic249`, `patoantic248`) still reports 0 dead-block candidates, 0
  marker errors, no missing placement reasons, and valid proposed placements for
  every banked resource.
- The manifest/optimizer regression now also compiles `simple_sprite(2)` through
  `megarom_ascii8` and `megarom_ascii16`, checking mapper-specific window bases
  and zone sizes (`#8000` with 8 KB / 16 KB zones) plus proposed placement
  bounds. This keeps the allocator diagnostics tied to all supported mapper
  formats instead of only the Konami acceptance path.
- Sprite fast-path builds without the generic Input component now still emit the
  shared directional sprite sync helper when sprites are present. This fixes the
  small `simple_sprite(2)` MegaROM build, where Glass previously saw a forward
  call to `component_sync_directional_sprite_from_initial` but the helper block
  had been filtered out with the unused Input system.
- Direct-to-VRAM ZX0 fallback policy now has a dedicated artifact validation
  test. `test_konami8k_vram_staging_validation.py` builds a minimal Konami
  MegaROM artifact set with a compressed VRAM resource whose raw size exceeds
  `ZX0_VRAM_TRANSFER_BUFFER_SIZE`; non-strict validation reports it through
  `large_vram_resource_count` / `large_vram_resource_max`, while
  `strict_vram_staging` rejects the same artifact with the resource label in the
  diagnostic. This proves the compatibility fallback remains observable and
  enforceable even without a large real-project fixture.
- ASCII16 runtime-layout diagnostics now require risk counters to carry concrete
  samples. The mapper artifact validator rejects positive resident-window,
  out-of-window-label, out-of-window-call, far-to-far-call, or hidden-resident
  call counts when the corresponding sample list is empty or internally
  inconsistent. The manifest regression asserts the generated ASCII16 artifacts
  include those samples whenever a counter is non-zero, which keeps the
  label-level component placement work actionable instead of collapsing to
  opaque counts.
- ASCII16 lower-page resident-call localization is now reported explicitly in
  `segment_budget.json.runtimeLayout` as `residentBridgeCallCount` plus
  `residentBridgeCallSamples`. The generic mapper validator requires samples
  when bridges are emitted, and build output prints `residentBridgeCalls=N`, so
  the label-level component-call policy is visible even after hidden resident
  calls have been rewritten to RAM bridge stubs.
- Banked boss data now has first-class budget metadata. Each boss data bank is
  reported in `segment_budget.json.bossDataBanks` with bank, physical range,
  used/free bytes, boss id/name, mapper window fields, and a placement reason.
  Generic and Konami validators reject malformed boss bank metadata, overlaps
  with asset/code banks, and Konami boss banks outside the final ROM segment
  count; build summaries print `bossDataBanks=N`.
- ASCII16 runtime-layout validation now requires label/call risk samples to be
  structurally actionable. Estimated resident-window overflow, out-of-window
  label, out-of-window call, far-to-far call, and hidden-resident call samples
  must carry the concrete bank/module/line/target fields needed for the
  label-level component placement and call-policy pass.
- The dry-run zone-aware allocator diagnostics now validate top-level
  `proposedPlacement.resourcePlacements` with the same bank, offset, window,
  size, and `placementReason` rules used for per-bank placements. A synthetic
  unit test covers invalid aggregate placement metadata without requiring the
  large baseline JSONs.
- The regression matrix runner accepts `--skip-missing-json` so baseline runs can
  keep testing available `Downloads` fixtures while clearly reporting absent
  projects instead of treating fixture absence as a mapper/build failure.
- The same runner now accepts `--artifact-dir`, allowing compile/smoke matrix
  outputs to be written outside tracked `server/temp` paths during repeated
  roadmap verification runs.
- SCREEN block layouts now prefer shared catalogs by default for `blocks2x2` and
  `blocks4x4` exports unless a screen explicitly sets `sharedCatalogEnabled:
  false`. This keeps block-optimized screens on the byte-saving shared catalog
  path. `atenas148.json` validates the edge case where one new `blocks4x4`
  screen had no explicit shared flag: the latest Konami MegaROM smoke build
  uses one `SCREEN_BLOCK_CATALOG_4X4_0` resource for five block maps, drops the
  separate local catalog resource, and still passes OpenMSX movement smoke.
- `scripts/run_konami8k_pipeline.py` now wraps the regression matrix with the
  Konami 8K acceptance defaults: latest recursive `Downloads` matches for the
  baseline fixtures (`joc51`, `joc_tales_9`, `patoantic248`, `joc60`),
  `megarom/konami`, movement smoke, strict P3 data window, strict VRAM staging,
  post-ASM check-only diagnostics, skipped missing fixtures, and artifacts
  outside tracked `server/temp` by default. The dead-block gate remains
  available via `--strict-post-asm-no-dead-blocks`, but is explicit because some
  legacy fixtures still carry annotated report-only candidates. This gives the
  paper pipeline one reproducible command instead of repeated hand-built matrix
  invocations.
- The OpenMSX movement smoke now probes input, key row 8, entity position, and
  shadow OAM. When `player_x` is only a logical value or the configured player
  entity has a hidden sprite slot, the checker falls back to a visible OAM
  candidate and only accepts movement when the probe source stays consistent.
  This catches `patoantic248` gameplay movement (`playerX=179->200`) instead of
  falsely reporting the hidden entity at `x=8`.
- Far-call IRQ lock bookkeeping no longer clobbers `HL`. The lock counter now
  uses `A`, preserving pointer inputs for wrappers such as
  `print_string_vram_far`; this fixes `patoantic248` SubMenu rendering, where
  title/options disappeared because the text pointer was overwritten before
  entering the far helper.
- Secret-zone runtime no longer reserves a full 768-byte immutable background
  copy in RAM. It now sizes `secret_zone_restore_buffer` to the largest active
  zone rect and captures/restores only that packed rect, preserving the 1488-byte
  ZX0 staging scratch on larger projects such as `patoantic248`.
- GameFlow now has a second auxiliary far module for one-shot SubMenu handlers.
  PresentationScreen stays resident because its `HALT` wait loop must not run
  under a far-call `DI` window. This keeps the resident P2 bank below the Konami
  8K limit while routing shared helpers through bank-0 trampolines. The baseline
  compile-only Konami pipeline passes for `joc51`, `joc_tales_9`,
  `patoantic248`, and `joc60`.
Remaining:

- MSX2 SCREEN4 now has a first Konami MegaROM path for native `msx2screen`
  projects. It follows Konami without SCC fixed-bank0 rules: `#4000-#5FFF`
  stays fixed on segment 0, `#6000/#8000/#A000` are explicitly initialized
  through mapper helper routines, and a cold data bank is mapped at
  `#6000-#7FFF` only while uploading palette, hardware sprite, and SCREEN4
  graphics data to VRAM.
- MSX2 smoke scripts default to `megarom/konami`, pass `-romtype konami` to
  OpenMSX, and validate the generated ROM visually. The current conveyor smoke
  confirms boot, input probes, gameplay state, and player rendering under the
  MSX2 MegaROM path.
- Native MSX2 SCREEN4 smoke fixtures and outputs now use the
  `test/msx2-screen4` tree. The old SCREEN5 fixture generator name is retained
  only for compatibility, while active layer/conveyor smokes call the SCREEN4
  alias and keep generated fixture JSONs out of Git status.
- `json/galaxian_msx2_mideas.json` is the primary MSX2 SCREEN4 game fixture for
  this pipeline. It compiles as Konami MegaROM, boots in OpenMSX with
  `-romtype konami`, and renders the Galaxian playfield/player with the expected
  runtime probes (`screen=0`, `lives=3`, `gameover=0`).
- The MSX2 SCREEN4 Konami path now has the same hard mapper-write rule as the
  MSX1 pipeline: generated ASM is rejected if `ld (#6000),a`,
  `ld (#8000),a`, `ld (#A000),a`, or `ld (MAPPER_REG_Px),a` appears outside
  `mapper_set_bank_p1/p2/p3/p4`. This is enforced in both the CLI builder and
  the server compile path.
- MSX2 `ascii8`/`ascii16` are intentionally rejected for now. They still need a
  true mapper-window layout and allocator policy instead of the current Konami
  fixed-bank0 compatibility slice.
- Legacy `msx2bitmap` projects are not part of this slice; the supported path is
  the native MSX2 SCREEN4 backend generated from `msx2screen` projects.

- ASCII16 still needs a label-level component placement/call policy. Large
  projects split components.asm across multiple 16 KB runtime segments, so
  GameFlow and entity-bank calls cannot assume component routines are resident
  at a single lower-page address. The pipeline now reports this as
  `estimatedResidentWindowOverflows=1` plus label/callsite samples for the
  current baseline JSONs instead of hiding it behind a generic
  `smoke-candidate` status.

## Next Phases

### Phase 4: Far-call API for banked code (In progress)

- Added mapper helper routines:
  - `mapper_push_p1/p2/p3/p4`
  - `mapper_pop_p1/p2/p3/p4`
  - `mapper_call_hl_p1/p2/p3/p4`
  - `mapper_call_hl_auto` (window auto-detected from target HL address)
- Added RAM slots for saved banks per page/window (`p1`, `p3`, `p4`).
- Migrated high-level runtime paths to far-call with explicit bank byte in node data:
  - GameFlow `Start` (`init_routine_ptr + bank`)
  - GameFlow `WorldLink` (`load_world_ptr + bank`)
  - GameFlow `SubMenu` background screen loader (`bg_screen_fn + bank`)
  - GameFlow `Text` background screen loader (`screen_load_ptr + bank`)
- Migrated world screen load sites from direct `call load_screen_X` to:
  - `ld a, ((load_screen_X - #4000) / #2000)`
  - `ld hl, load_screen_X`
  - `call mapper_call_hl_auto`
- Hardened text and presentation waits after far-rendered screens:
  `wait_for_fire`, GameFlow PresentationScreen waits, and legacy presentation
  waits now enable interrupts immediately before each `HALT`, avoiding hangs
  when returning from mapper-protected code paths.

Acceptance criteria:
- No return-path bank corruption.
- Far-called routines preserve expected registers contract.

### Phase 5: IDE UX and compile pipeline hardening (Done)

Completed:
- ROM mode/mapper controls wired in Code Export flow (`auto`, `simple32k`, `megarom` + Konami/ASCII8/ASCII16).
- Compile request now sends explicit ROM config (`romMode`, `targetFormat`, `autoMegaROM`).
- Compile panel now shows:
  - Requested config
  - Source ASM embedded config
  - Resolved mapper decision and reason
  - Source/request mismatch warnings
- Added IDE-side drift warning if compile config differs from last generated ASM config.

- Added quick validation action (generate + compile + mapper summary) as a single-click pipeline.

Acceptance criteria:
- User can switch `simple32k` vs `megarom` from UI.
- Compile panel clearly displays active mapper config and resolved mapper mode.
- One-click mapper validation available from IDE actions.

### Phase 5.5: Zone-aware MegaROM allocator (Pending)

- Replace the current 8 KB diagnostic-first packer with a real allocator driven
  by mapper format and final compressed asset size.
- Support data zones of 8 KB (`ascii8`) and 16 KB (`ascii16`) without allowing
  a compressed asset to cross its assigned zone.
- Keep hot/common code in stable 16 KB-friendly regions and move only explicit
  far-call modules to split banks.
- Emit allocator diagnostics that explain why each asset/routine was placed in
  a given bank group. Data resources and code modules now report this through
  `placementReason`; the remaining allocator work is to replace the current
  diagnostic-first placement policy with mapper-aware repacking for ASCII8/16.

### Phase 6: Emulator regression matrix (Pending)

- Smoke test generated ROMs in openMSX with and without forced `-romtype`.
- Validate startup, screen transitions, collision reads, sprite loads.
- Run mapper-expanded MegaROM compile/smoke cases with `--target-formats
  konami,ascii8,ascii16`; Konami and ASCII8 have baseline gameplay smoke
  coverage, and ASCII16 joins the same smoke path when
  `--strict-ascii16-runtime-layout` is present. ASCII16 compile artifacts keep
  estimated resident-pressure counters for future label-level hardening, while
  the effective status is based on actual assembled resident usage when `.sym`
  output is available.
- `patoantic248` has a scripted menu route covering Main -> SubMenu -> Credits
  -> Main -> SubMenu again, plus the standard player-movement smoke.

Acceptance criteria:
- Pass matrix for Konami + ASCII8 projects and the strict ASCII16 gameplay
  smoke project set.
- No blank-screen/hang on bank-switch transitions.

## MSX2 MegaROM Stability Roadmap

This is the roadmap for the native MSX2 generator. Its goal is to avoid the
current MSX1 failure mode where a gameplay variation compiles until one emitted
bank crosses the 8 KB mapper limit and Glass fails late with a hard overflow.

The MSX2 path must be planned as a budgeted MegaROM build from the start:

- The fixed core is small and generic.
- World/gameplay content is packaged into explicit bank packs.
- ROM is the main storage area.
- RAM is only runtime state, small caches, and temporary buffers.
- Every bank has a budget report before Glass is invoked.

### Phase MSX2-1: Define the fixed runtime contract

Keep the resident MSX2 runtime limited to generic systems:

- MSX2/VDP init, palette and SCREEN 4 setup.
- Mapper init and centralized bank setters.
- Input, scheduler, IRQ/VBlank pacing.
- Player core.
- Entity pool and hardware sprite writer.
- Generic collision/effects/behavior readers.
- Generic movement verbs: patrol, gravity/platform, maze direction, projectile.
- Generic animation runner.
- Event queue.
- Resource loader: ROM raw, ROM ZX0, ROM-to-VRAM, ROM-to-RAM when justified.

Do not hardcode concrete enemies, per-game attack routines, or per-world
graphics in the resident core. A snake, bat, archer, Galaxian wave, or Lode
Runner guard is world data plus optional world code, not a new resident engine
section by default.

Acceptance criteria:

- `segment_budget.json` separates resident core modules from world/content
  modules.
- Resident banks have a warning threshold, not only a hard 8192-byte failure.
- Any new MSX2 runtime helper must declare whether it is resident, far code, or
  world-specific.

### Phase MSX2-2: Introduce World Bank Packs

Each MSX2 game/world should compile to a `World Bank Pack` instead of letting
all content compete for the same generated ASM banks.

Recommended logical pack:

- `world manifest`: bank ids, entry screen, palette, music, table pointers.
- `world graphics`: SCREEN 4 patterns, colors, name data, sprite patterns.
- `world screens`: tilemaps, collision, effects, behavior, spawn tables.
- `world entities`: enemy type table, movement profiles, attack profiles.
- `world animations`: animation sets and frame tables.
- `world special code`: bosses or unique behavior modules, only when data is
  not enough.

Small worlds can collapse these into fewer physical banks, but the generator
must keep the logical categories in the manifest and reports. The allocator can
then pack them, split them, or leave them raw with a documented reason.

Acceptance criteria:

- A generated `world_manifest.json` or equivalent artifact lists every world
  package, logical section, physical bank, window address, stored size, raw
  size, and placement reason.
- The ASM has stable labels for each package section so Glass symbols can
  verify real assembled size.
- A world can grow by adding a new data bank without moving unrelated resident
  code.

Current artifact:

- MSX2 SCREEN 4 generation now emits `msx2_world_bank_manifest.json` and embeds
  the same object as `worldBankManifest` inside `project_slice.json`. It lists
  each reachable world package with its logical section, estimated physical
  bank, Konami data window `#A000`, raw/stored bytes, storage decision, and
  placement reason. The preflight validates the standalone file against the
  project slice before Glass. Estimated physical banks also carry
  `warningThresholdBytes`, `usedPercent`, `overBudgetBytes`, and `status`, so
  the IDE can report bank pressure without reverse-engineering allocator math.
  The preflight now cross-validates each estimated physical bank against
  `logical_bank_budget.json` by index, usage/free bytes, warning threshold,
  over-budget bytes, pressure status, and package list; stale or divergent
  manifest data fails before Glass.

### Phase MSX2-3: Asset policy before packing

Every generated MSX2 asset must receive a storage decision before ASM emission:

- `RAM`: mutable runtime state or very hot small cache.
- `ROM_RAW`: read-only data that is small, poorly compressible, or accessed
  directly while its bank is visible.
- `ROM_ZX0`: read-only compressed data loaded occasionally.
- `ROM_ZX0_TO_VRAM`: graphics data decompressed or staged into VRAM.
- `ROM_RAW_TO_VRAM`: graphics data where compression is not worth the cost.

Initial policy:

- Data below 64 bytes stays raw unless there is a strong reason.
- Data from 64 to 512 bytes is compressed only when saving at least 25%.
- Data above 512 bytes is tested for compression.
- If compression saves less than 15%, keep raw.
- Data read every frame must either be RAM-resident or live in a stable visible
  runtime data bank.
- Graphics should prefer ROM-to-VRAM paths instead of ROM-to-RAM-to-VRAM unless
  staging is required for speed or decoder limits.

Acceptance criteria:

- `project_usage.json` or a new `asset_storage_policy.json` records
  `sizeRaw`, `sizeStored`, compression gain, access pattern, mutability, and
  final decision for each asset.
- The build fails before Glass if an asset marked as direct runtime data is
  placed in a bank that will not be visible during gameplay.
- The build warns when tiny tables are compressed for negligible savings.

### Phase MSX2-3.5: Project pre-compilation slice

Before allocating banks, Mideas must calculate the exact project slice required
by the current game. This pre-compilation step is not ASM generation yet; it is
the dependency graph that decides what exists in the ROM at all.

The pre-compiler starts from the project's active entry points:

- selected target platform and screen backend,
- active GameFlow graph,
- referenced worlds,
- referenced screens,
- referenced `msx2screen` layers,
- referenced sprites and animation sets,
- referenced entity templates,
- referenced state machines,
- referenced music/SFX,
- referenced HUD/menu/text assets,
- referenced custom behavior modules.

Then it produces a closed dependency set:

- include only assets reachable from those entry points,
- include only component/runtime modules required by those assets,
- include only state-machine opcodes/actions that are used,
- include only movement/attack/projectile engines that are referenced,
- include only screens and world links reachable from the active GameFlow,
- exclude editor-only assets, unused templates, unused components, unused
  default data, and inactive worlds.

This is mandatory because unused data is not harmless in an 8 KB banked ROM.
Every unused table, default enemy, animation, or state-machine helper increases
bank pressure and can turn a valid game variation into a bank overflow.

Pre-compilation output should be a concrete artifact, for example
`project_slice.json`:

- `includedAssets`,
- `excludedAssets`,
- `includedRuntimeModules`,
- `includedRuntimeModuleDetails`,
- `includedComponents`,
- `includedStateMachineOpcodes`,
- `includedWorldPackages`,
- `estimatedRamNeeds`,
- `estimatedRomNeeds`,
- `reason` for every inclusion.

Acceptance criteria:

- A project can explain why each emitted asset or runtime module is present.
- Unused default MSX2 entities/components are not emitted into the ROM.
- Adding an unused asset in the editor does not change the compiled ROM budget.
- The UI can show a "not included in ROM" list so authors understand what was
  excluded by the pre-compiler.

Current MSX2 SCREEN 4 implementation emits `project_slice.json` during ASM
generation. The slice is the current pre-compilation contract and includes:

- reachable assets and excluded assets,
- included and excluded runtime modules, with reason and placement
  (`resident`, `far_code`, or `world_specific`),
- `ownerWorldIds` on world-owned screens, tiles, and sprites,
- `worldPackageSummary`,
- `assetStoragePolicy`,
- `logicalBankBudget`,
- `ramBudget`.

The current rule is conservative: a runtime helper is emitted only when the
analysis proves the project needs it. For example, the MSX2 stage-banner helper
is included for shooter-wave builds and excluded for non-shooter builds, so a
platformer variation does not pay bytes for unused arcade HUD behavior.
The same slice now keeps `includedRuntimeModules` as a compact compatibility
list and adds `includedRuntimeModuleDetails` for the preflight/IDE path. Each
entry carries the inclusion reason and placement, so future helpers must declare
whether they are resident core, far code, or world-specific instead of silently
growing the fixed runtime.

`worldPackageSummary` is the bridge toward real World Packages. It groups the
currently reachable owner-world assets, counts reachable screens, reports
estimated bytes, and breaks those bytes down by bank class. Its totals must
match the owner-marked storage policy rows before the build can continue.

### Phase MSX2-4: Budgeted bank allocator

The allocator must be the first line of defense against bank overflow.

Rules:

- Use final stored size, after compression decisions, as allocator input.
- Reserve fixed resident banks first.
- Place world data into explicit 8 KB Konami zones.
- Keep `#A000-#BFFF` as the normal data/loading window for Konami.
- Place far code only at explicit call boundaries.
- Never split a routine or data record arbitrarily just to satisfy 8 KB.
- Allow new physical banks to be appended when a world grows.
- Fail with an actionable allocator error before Glass if a single unsplittable
  unit cannot fit in one 8 KB zone.

Acceptance criteria:

- The allocator reports `usedBytes`, `freeBytes`, `warningBytes`, and
  `overBudgetBytes` per bank before ASM generation.
- Default warning threshold is 90% of a bank; default hard limit is 8192 bytes.
- Overflow diagnostics name the logical package and largest contributors, for
  example `world0.entities`, `world0.graphics.sprites`, or
  `runtime.projectiles.core`.
- Glass should no longer be the first tool that discovers an 8 KB overflow.

Current MSX2 SCREEN 4 implementation emits `logical_bank_budget.json` and embeds
the same object in `project_slice.json`. The CLI preflight reads this before
Glass and fails early when:

- a logical package is larger than one 8 KB Konami window,
- an estimated packed bank crosses 8192 bytes,
- the external budget artifact does not match the embedded project slice,
- the generated budget omits required bank fields.

For a passing build, the CLI prints the payload size, estimated packed bank
count, package count, and largest contributor.

The budget also includes `bankClassSummary`, grouped by classes such as
`world.screen`, `world.graphics.sprite`, and `world.manifest`. This lets the
CLI and IDE explain which part of a world package is creating bank pressure
without inspecting every package row manually.

The CLI also supports `--strict-msx2-megarom-preflight-warnings`. Normal builds
keep warnings as diagnostics; strict builds treat ROM/RAM warnings and `plan_b`
recommendations as pre-Glass failures. This is intended for CI or release
exports where a nearly full bank should be handled before producing a ROM.

### Phase MSX2-4.5: Overflow recovery plan

When the allocator finds that a bank or unsplittable unit cannot fit, Mideas
should not immediately give up. It should run a deterministic recovery plan and
report which attempts were made.

Plan B order:

1. Repack same class of data with first-fit-decreasing by final stored size.
2. Split logical world packages across additional physical data banks when the
   records are independently addressable.
3. Move cold read-only data from resident/core banks into world data banks.
4. Try ZX0 only on large data categories where compression is allowed:
   graphics patterns, color tables, tilemaps/name data, large collision/effects
   maps, large text blocks, large screen data.
5. Keep tiny tables, hot frame data, and direct runtime lookup tables raw unless
   compression gives a meaningful win and does not add per-frame decode cost.
6. Move rare behavior to a world special-code bank behind a far-call boundary.
7. Split a large screen/graphics payload into independently loadable chunks
   only when the loader can address those chunks explicitly.
8. As a last resort, fail with an actionable report listing the largest
   contributors and suggested authoring changes.

The recovery plan must not:

- push read-only templates into RAM just to solve ROM pressure,
- decompress whole worlds into RAM,
- split arbitrary code in the middle of routines,
- create hidden bank switches inside hot per-frame loops,
- compress data that must be randomly accessed every frame unless it is decoded
  into a deliberately small hot cache.

Acceptance criteria:

- Overflow failures report the attempted Plan B steps.
- Reports distinguish "can add another bank" from "single unit too large for
  one 8 KB mapper window".
- The allocator can recommend concrete fixes: split world graphics, move boss
  code to special bank, remove unused defaults, compress screen data, or split a
  tilemap payload.

Current MSX2 SCREEN 4 budget artifacts already include recovery
recommendations. Passing builds may still carry warning or `plan_b`
recommendations so the IDE can show pressure before it becomes fatal.
`logical_bank_budget.json` also carries the ordered `recoveryPlan`, so the CLI
and IDE can show the deterministic Plan B sequence even before a build fails:
final-size repack, world package split, cold data move, selective ZX0, hot data
guard, special-code bank, chunk split, and actionable failure report.
The passing `preflight_summary.json` records byte counts and stable checksums
for the four required preflight artifacts. This makes stale, empty, or
truncated artifact problems visible as build diagnostics instead of surfacing
later as confusing compiler failures.


### Phase MSX2-5: RAM map and live-instance model

The base MSX2 target should still assume only `#C000-#FFFF` is comfortable game
RAM in cartridge mode.

ROM contains templates and read-only tables:

- Enemy type definitions.
- Spawn tables.
- Animation definitions.
- Movement and attack profiles.
- State machine bytecode.
- Collision and behavior maps when immutable.

RAM contains only live state:

- Active entities.
- Position, velocity, direction.
- HP, timers, flags.
- Current animation frame and frame timer.
- State machine current state and small local variables.
- Event queue.
- Sprite shadow/SAT staging.
- Small hot caches and scratch buffers.

Acceptance criteria:

- MSX2 builds emit a `ram_budget.json` or equivalent section in
  `segment_budget.json`.
- The report includes entity pool, projectile pool, sprite shadow, effects
  buffers, event queue, temporary buffers, stack reservation, and free RAM.
- Generation fails before Glass/OpenMSX if the planned runtime RAM crosses the
  safe limit.

Current MSX2 SCREEN 4 implementation emits `ram_budget.json` and embeds it in
`project_slice.json`. The base safe runtime window is `#C000-#F300`; the
preflight rejects builds with negative free RAM, invalid RAM scope, missing
required runtime sections, or RAM recommendations marked as errors.

### Phase MSX2-6: Data-driven entities before custom code

The default MSX2 enemy model should be:

- Entity template in ROM.
- Spawn row in ROM.
- Live instance in RAM.
- Generic component runner in the core.

Concrete enemies should be assembled from:

- component mask,
- sprite set id,
- animation set id,
- movement profile id,
- attack profile id,
- state machine id,
- hp, damage, flags.

World-specific code is allowed only for behavior that cannot be expressed by
generic movement, attack, animation, projectile, or state-machine data.

Promotion rule:

- Appears in one world: keep as world data or world special code.
- Appears in several projects: candidate for optional component.
- Appears broadly: promote into the default MSX2 core component library.

Acceptance criteria:

- Simple enemies do not create new resident update routines.
- Spawn loads copy only live fields to RAM, not full templates.
- Optional world special code has its own bank budget and far-call contract.

### Phase MSX2-7: Compile pipeline gates

The MSX2 MegaROM pipeline should run these gates in order:

1. Project analysis and world-package extraction.
2. Project pre-compilation slice: decide exactly what this game needs.
3. Asset storage policy decisions.
4. RAM budget report.
5. Bank allocation dry run.
6. Overflow recovery plan if needed.
7. ASM generation.
8. Glass compile.
9. Artifact validation against `.sym`.
10. Post-compilation optimization.
11. OpenMSX smoke when requested.

Acceptance criteria:

- UI and CLI both show the same mapper decision, RAM budget, bank budget, and
  largest contributors.
- A build can fail with `Bank budget overflow before ASM` and point to concrete
  assets instead of producing a late Glass bank-size failure.
- Regression fixtures include at least:
  - one small MSX2 SCREEN4 game,
  - one multi-screen platformer-style game,
  - one shooter/arcade game with projectiles,
  - one stress fixture designed to nearly fill a world data bank.

Current CLI gate:

1. ASM generation emits comment artifacts.
2. The build extracts `project_slice.json`, `asset_storage_policy.json`,
   `logical_bank_budget.json`, `msx2_world_bank_manifest.json`, and
   `ram_budget.json`.
3. MSX2 SCREEN 4 preflight validates those artifacts before the post-ASM pass
   and before Glass.
4. Passing preflight writes `preflight_summary.json` with compact ROM, RAM, and
   Plan B data for CLI/IDE consumption. The summary also records
   `outputArtifactChecks` for `msx2_ide_budget_feedback.json`, so the preflight
   report proves the IDE-facing budget artifact was regenerated and checksummed
   during the same gate.
5. `preflight_summary.json` now also exposes the ordered `pipelineGates` list:
   gates 1-6 are marked passed by the preflight, ASM generation is marked as
   already done, and Glass/symbol validation/post optimization/OpenMSX remain
   pending for the later build stages.
6. After Glass and mapper validation pass, MSX2 SCREEN 4 builds write
   `msx2_build_summary.json`. This ties the final ROM to the exact preflight
   input and output artifact checks, marks Glass and symbol/artifact validation
   as passed, and records checksums for the ROM, ASM, and symbol file. It also records whether
   the Post-ASM pass was not requested, check-only, applied, or produced no
   change, and whether OpenMSX smoke was not requested, pending, or passed.
   When OpenMSX smoke is requested, the summary is rewritten after the smoke
   completes so the final report reflects the real last gate state.
   When Post-ASM is requested, `msx2_build_summary.json` also carries compact
   `postAsmReports` entries with findings, applied patch count, dead-block
   candidate size, and bytes removed. The IDE can use this without parsing the
   full optimizer report. It also records `postAsmAttempts`, with status,
   rule classes, bytes removed, and checksums for each report, so the
   post-compilation loop has an auditable attempt history before a full
   rollback/acceptance loop is promoted.
   The final build summary also records the path, size, checksum, scope, and
   status of `msx2_ide_budget_feedback.json`, so the UI-facing budget view is
   tied to the same passing build as the ROM. If the build used the controlled
   retry loop, the summary also includes `budgetResolution` with the resolver
   status, attempt count, final action, and checksum of
   `msx2_budget_resolution.json`.
7. Passing preflight also writes `msx2_ide_budget_feedback.json`. This is the
   compact editor-facing view of the same facts: current ROM mode/mapper,
   logical bank pressure by class, RAM usage, world package bytes, largest
   assets, concrete warnings, and suggested fixes generated from Plan B data.
8. If a budget-oriented MSX2 preflight fails before Glass, it writes
   `msx2_preflight_failure.json` instead of leaving stale success summaries.
   This gives the CLI/IDE a machine-readable reason, affected package/bank
   data, RAM context, and the ordered Plan B recommendations. Failure summaries
   also carry compact `worldBankManifest` counts and per-estimated-bank
   pressure rows, so the IDE can show which world data bank failed without
   reparsing the full project slice. They also record byte counts and stable
   checksums for the input artifacts present at failure time, tying the stop
   report to the exact slice/budget/manifest/RAM data that failed. The same
   failure summary exposes `pipelineGates`, marking the failed preflight gate
   and every later gate as `not_run`, so the CLI/IDE can distinguish an
   allocator stop from a Glass or symbol-validation failure.
   They now also expose `resolverCandidates`: structured retry/regeneration
   options such as `relax_strict_warning_gate`, `enable_zx0_preprocess`, and
   the still-pending `split_over_budget_world_packages`. This is the stable
   bridge from detailed bank-failure diagnostics to automatic regeneration.
   The SCREEN 4 project slice now performs the first precompile-time split:
   splittable world packages (`msx2screen` and `msx2sprite`) estimated above one
   8KB window are emitted into `auto_world_package_chunk` logical chunks before
   first-fit bank packing. `logicalBankBudget` records `splitPackages` and
   `splitSourcePackages`, and `worldBankManifest` maps those chunks back to the
   owning world/asset so the report remains traceable.
9. `scripts/build_mideas_unified_rom.py` now enables the first controlled retry
   loop by default for MSX2 SCREEN 4 Konami MegaROM builds
   (`--no-auto-resolve-msx2-budget` disables it for diagnostics). It can
   resolve safe cases without changing project data: strict-warning failures
   can retry as non-strict, and over-budget failures produced while ZX0 was
   explicitly skipped can retry with ZX0 preprocessing enabled. The retry loop
   now chooses those actions from `resolverCandidates` instead of matching only
   raw failure strings. Each attempt is recorded in
   `msx2_budget_resolution.json` with the compact failed-gate, input-artifact,
   ROM, and world-bank context copied from `msx2_preflight_failure.json`;
   unresolved cases keep `msx2_preflight_failure.json` as the actionable stop
   report.
10. The normal `/compile` server path now also has a budget gate for embedded
    MSX2 SCREEN 4 artifacts. If the ASM budget is already marked `error`, the
    server stops before Glass and returns `msx2BudgetFeedback` plus
    `msx2BudgetResolution`. If compression was disabled, it first tries one
    safe ZX0 preprocess pass and only continues to Glass when that clears the
    budget error. The export modal reports the resolver status and final action
    in the compile summary. Server-side resolver attempts also preserve a
    compact failure context derived from the IDE feedback: failed gate, ROM/RAM
    pressure, World Bank Pack warning/overflow counts, and the resolver
    candidate IDs that drove or blocked the retry. Failed compile responses
    preserve the same `msx2BudgetFeedback` payload, including
    `resolverCandidates`, so the user sees the concrete bank/RAM cause and the
    attempted or pending resolver steps even when no ROM is produced.
    The IDE/server budget view now accepts `estimatedPackedBankCount > 1` for
    SCREEN 4 when `screen4DataBankPlan.supported=true`. The generated loader
    emits per-screen `<LABEL>_DATA_BANK` constants, selectable P2/#8000 bank
    entry, and physical `MSX2_SCREEN4_DATA_BANK_n_*` anchors so Glass symbols
    can verify that cold screen data really lands in separate 8 KB banks. Cases
    that require `auto_world_package_chunk` still stop before Glass because
    chunk-to-label physical loading is not implemented yet.
    SCREEN 4 effect templates now follow the same cold-data policy: each
    `<LABEL>_EFFECTS` table is emitted with its screen data bank and
    `init_msx2_effect_buffers` copies it to persistent RAM through the
    selectable bank loader. Collision and behavior layers intentionally remain
    resident for now because the gameplay loop still reads them directly from
    pointers every frame; moving those requires a bank-aware reader or a
    screen-local RAM cache, not a pure placement change.
11. Glass `Negative initial size` failures are now translated into Mideas
    diagnostics. For MSX2 SCREEN 4 Konami builds, a negative `ds #C000 - $`
    padding is reported as `MSX2 MegaROM resident bank overflow`, not as a raw
    Java exception. The CLI writes `msx2_compile_failure.json` with the failed
    `glass_compile` pipeline gate, ASM checksum, ROM/SYM targets, and Plan B:
    move cold read-only tables to world/data banks, remove unused resident
    fallbacks, or replace repeated resident tables with VRAM fill/streaming.
    This failure report also carries a non-eligible
    `move_cold_readonly_data_to_world_bank` resolver candidate so the next
    roadmap step can promote resident cold-data movement into a real automatic
    regeneration pass.
    The CLI now also tries one controlled automatic regeneration for this
    class of failure when normal MSX2 budget auto-resolve is enabled and
    Post-ASM was not already requested: it runs the conservative
    `dead-blocks` Post-ASM optimizer, recompiles the optimized ASM, and records
    the result in `compileResolution` / `resolverAttempts`. If the optimized
    ASM still fails, the original detailed compile failure remains the
    actionable stop report.
    The same failure report now includes `residentBankAnalysis`: a pre-Glass
    label-span ranking for the resident `#4000-#C000` SCREEN 4 section. It
    lists the largest labels by estimated data bytes/source pressure, marks
    likely move candidates such as resident layer/data tables, records the ASM
    line span for each contributor, and is also exposed by `/compile` as
    `residentContributors` so the export modal can show the concrete labels
    causing fixed-bank pressure instead of only the generic Glass error.
    The `/compile` server returns the same failure shape as
    `msx2CompileFailure`, and the export modal shows the resident-overflow
    reason plus Plan B directly beside the Glass logs. Its resolver candidates
    now mirror the CLI order for this failure class: first the eligible
    `run_post_asm_dead_block_optimizer` retry, then the pending
    `move_cold_readonly_data_to_world_bank` regeneration path. The server also
    returns `msx2CompileResolution` / `resolverAttempts` for the Post-ASM retry,
    so successful and failed regeneration attempts are visible in the same
    machine-readable shape as CLI build summaries.
12. The CLI post-ASM path now has its first safe rollback. When
    `--post-asm-opt` emits an optimized ASM but that candidate fails Glass or
    the later mapper/artifact validators, the builder records the optimized
    report as `rejected_validation_failed`, falls back to the baseline ASM,
    recompiles, and marks the build summary
    `validation.postAsm = fallback_to_baseline`. This protects a previously
    compilable ROM from being broken by an optimizer pass while still preserving
    the rejected candidate, byte savings, rule classes, and exact failure reason
    for the next resolver iteration.
13. The SCREEN 4 `worldBankManifest` now reports the actual current loader
    window as `#8000`, matching `MSX2_SCREEN4_DATA_BANK` and the P2 bank switch
    helper. The paper still targets a future stable world data window model, but
    the generated diagnostics must describe the ROM that exists today; otherwise
    the automatic resolver would be reasoning from the wrong address window.

Regression coverage currently checks the preflight directly and through the
MSX2 SCREEN 4 smoke fixtures for layers, Lode Runner-style mirrors, conveyor
maps, and Galaxian-style shooter builds.

### Phase MSX2-7.5: Post-compilation optimization loop

After Glass and symbol validation pass, Mideas should run a post-compilation
review pass against the exact ASM and artifacts that produced the ROM.

The post pass can optimize:

- dead emitted blocks,
- unreachable screen loaders,
- unused state-machine opcodes/actions,
- unused component helpers,
- duplicated small tables,
- repeated data that can become shared catalog data,
- bank placement slack,
- large contributors that could be moved from resident to far/world banks.

The loop must be conservative:

1. Apply one class of optimization.
2. Regenerate artifacts.
3. Re-run Glass.
4. Re-run bank/RAM validators.
5. Re-run targeted smoke when behavior could change.
6. Stop when no safe improvement remains or a configured pass limit is reached.

If a post pass fails validation, Mideas must discard that optimization attempt
and keep the last known-good build.

Acceptance criteria:

- The final ROM is always tied to a passing artifact set.
- Post optimization never mutates the source project.
- Reports show bytes saved, banks affected, and any optimization rejected by
  validation.

### Phase MSX2-8: IDE feedback

The editor should expose budget pressure while the user is authoring, not only
at export time.

Recommended UI signals:

- Current ROM mode and mapper.
- Estimated resident core usage.
- World package usage by category.
- RAM usage summary.
- Largest assets in the current world.
- Warnings when a variation adds code/data to a nearly full bank.
- Suggested fix: move to world data bank, compress, split world pack, promote
  to far code, or reduce RAM residency.

Acceptance criteria:

- The user can see why adding a feature threatens a bank.
- The report distinguishes resident-core pressure from content/world pressure.
- Suggested fixes are generated from the allocator facts, not generic advice.

Current artifact:

- `msx2_ide_budget_feedback.json` is generated by the MSX2 SCREEN 4 preflight
  and validated by the smoke fixtures. It is intentionally derived from
  `project_slice.json`, `logical_bank_budget.json`,
  `msx2_world_bank_manifest.json`, and `ram_budget.json`, so the editor and CLI
  do not drift into separate budget logic.
  The IDE-facing feedback now also carries a compact `runtimeModules` summary
  with included/excluded modules and resident/far/world-specific counts, plus a
  compact `worldBankManifest` summary with world count, estimated physical data
  banks, package count, warning/overflow bank counts, and the active data
  window.
- The export modal now also parses the embedded preflight artifacts directly
  from generated `unitedFiles.asm` and shows an `MSX2 MegaROM budget preview`
  before Glass runs. Failed build responses keep the same budget payload, so
  the authoring preview, build failure, and successful ROM summary all describe
  the same allocator facts. The frontend parser and compact feedback builder
  now live in `utils/msx2BudgetFeedback.ts`, keeping the export modal focused
  on presentation instead of duplicating artifact parsing logic inline. The
  preview also separates `Core/resident` pressure from `World/content`
  pressure and lists the largest world packages, so users can tell whether a
  variation is threatening the fixed runtime area or a world bank pack. It now
  surfaces near-full warning banks and several targeted suggested fixes instead
  of reducing the allocator's Plan B output to a single line.
  It also reports how many runtime modules the current slice includes and how
  many are resident, far-code, or world-specific, and how many World Bank Packs
  are planned for the current SCREEN 4 data window (`#8000` in the current
  fixed-bank0 loader).
- `npm run test:msx2-budget-feedback` compiles the shared frontend helper and
  runs it against synthetic embedded ASM artifacts. This gives the IDE preview
  parser a functional regression test beyond static contract checks. It also
  compares the frontend parser output against the server-side feedback builder
  so build responses and authoring previews do not drift.
- The export modal now preserves `msx2CompileFailure` from failed `/compile`
  responses. Resident overflow is shown as its own MSX2 failure class with a
  concrete byte count and Plan B, instead of forcing the user to infer the
  cause from Glass stderr.
- The SCREEN 5 presentation smoke can now run the same fixture in `megarom`
  mode. `smoke:msx2-screen5-presentation-megarom` compiles the Bionic Invaders
  presentation fixture as a Konami MegaROM, verifies ZX0 preprocessing, and
  rejects outputs that are not larger than 32 KB and 8 KB aligned. The static
  MSX2 suite includes this check without launching OpenMSX.

### Non-negotiable invariant

For MSX2 MegaROM generation, Mideas must not rely on Glass bank overflow as the
normal feedback loop. The generator must know the bank plan, RAM plan, storage
policy, and world-package layout before emitting ASM.

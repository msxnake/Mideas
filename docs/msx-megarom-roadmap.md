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
  a given bank group.

### Phase 6: Emulator regression matrix (Pending)

- Smoke test generated ROMs in openMSX with and without forced `-romtype`.
- Validate startup, screen transitions, collision reads, sprite loads.

Acceptance criteria:
- Pass matrix for at least Konami + ASCII8 projects.
- No blank-screen/hang on bank-switch transitions.

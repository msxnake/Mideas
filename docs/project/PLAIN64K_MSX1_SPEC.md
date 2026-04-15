# Plain64k MSX1 Spec

This note defines a possible `plain64k_msx1` mode for Mideas.

It is a design proposal, not a finished feature.

## Goal

Provide an experimental linear `64 KB` ROM mode for `MSX1` that sits between:

- `plain48k` for projects that need a page-0 cold-data area
- `megarom` for projects that need general-purpose large ROM access

The purpose is narrow:

- allow extra cold ROM storage without introducing a classic mapper
- keep the gameplay/runtime model close to the existing linear generators

## Non-goals

This mode should not try to replace `megarom` in the general case.

It is not intended for:

- arbitrary code execution from `#C000-#FFFF`
- permanent replacement of RAM in page 3
- always-on access to all `64 KB` as if it were normal flat memory
- complex streaming workloads that need frequent random access to the upper `16 KB`

## Why This Is Harder Than Plain48k

`plain48k` borrows `page 0` (`#0000-#3FFF`) from BIOS in controlled windows.

`plain64k_msx1` would also need to borrow `page 3` (`#C000-#FFFF`), which is
normally RAM. That is much riskier because page 3 usually contains:

- stack
- BIOS work area
- runtime variables
- scratch buffers

So the design rule must be:

- `page 3` is only a temporary ROM view for cold-data copies
- RAM must be restored immediately after each copy operation

## External Context

The proposal matches known MSX practice:

- The MSX Wiki states that non-mapper cartridge ROM can theoretically range up
  to `64 KB`, but warns that `0000h-3FFFh` and `C000h-FFFFh` require special
  care.
  - https://www.msx.org/wiki/Develop_a_program_in_cartridge_ROM
- Emulators such as openMSX, blueMSX and WebMSX recognize a `Mirrored` plain
  ROM mode rather than treating every `64 KB` cartridge as a classic mapper.
  - https://www.msxblue.com/manual/rommappers_c.htm
  - https://github.com/ppeccin/WebMSX

That does not make the mode simple. It only confirms that the format exists.

## Proposed Memory Model

Default runtime view:

- `page 0` (`#0000-#3FFF`): BIOS
- `page 1` (`#4000-#7FFF`): main game ROM
- `page 2` (`#8000-#BFFF`): main game ROM
- `page 3` (`#C000-#FFFF`): RAM

Cold-data windows:

- `page 0 ROM window`: temporary mapping for cold ROM reads in `#0000-#3FFF`
- `page 3 ROM window`: temporary mapping for cold ROM reads in `#C000-#FFFF`

ROM image layout:

- `ORG #0000`: `page0` cold-data area
- `ORG #4000`: cartridge header and main code/data
- `ORG #8000`: continuation of main code/data
- `ORG #C000`: `page3` cold-data area
- final output size: `65536` bytes

## Core Rule Set

The generator must enforce these rules:

1. Main executable code must live only in `#4000-#BFFF`.
2. `page0` and `page3` are cold-data only by default.
3. No routine may execute from `page3`.
4. No decompression target may overlap the RAM area used to restore page 3.
5. Any access to `page3` ROM must run from code located in `#4000-#BFFF`.
6. Interrupt-sensitive code must not leave `page3` mapped to ROM.
7. The stack must never remain in a page that is about to be remapped away.

## Allowed Asset Types

Good candidates for `page0/page3` cold storage:

- presentation screens
- static screen pattern/color/name data
- fonts
- music data that is copied to RAM once
- text blocks
- large compressed assets copied to RAM/VRAM in one shot

Bad candidates:

- code called every frame
- data tables used from hot loops
- object state
- game variables
- anything that depends on BIOS being visible in page 0 while accessed
- anything that depends on RAM staying visible in page 3 while accessed

## Runtime Contract

`plain64k_msx1` needs explicit helpers, similar in spirit to `plain48k` but with
an extra page-3 RAM restore contract.

Required persistent values in RAM:

- `SLOTBIOS`
- `SLOTGAME_PAGE0`
- `SLOTRAM_PAGE3`
- `SLOTGAME_PAGE3`

Required helper families:

- map game ROM into page 0
- restore BIOS into page 0
- map game ROM into page 3
- restore RAM into page 3
- copy from page-0 ROM window to RAM/VRAM
- copy from page-3 ROM window to RAM/VRAM

Safety rule:

- helpers that touch page 3 must execute from `#4000-#BFFF`
- they must save the active stack context if needed
- they must restore RAM in page 3 before returning to normal gameplay

## Compression Policy

Compression is still useful here, but the placement rules matter more than the
raw ratio.

Suggested policy:

- allow ZX0-compressed cold assets in `page0` and `page3`
- decompress only into RAM scratch buffers
- never decompress "in place" into `page3`
- share scratch buffers when asset lifetimes do not overlap

For MSX1 this should stay conservative:

- presentation assets first
- fonts second
- optional static text/music blobs later

## Generator Changes Needed

At minimum:

1. Add `plain64k_msx1` as an explicit ROM mode.
2. Extend diagnostics with:
   - `Linear64K Page0 Data`
   - `Linear64K Page3 Data`
   - per-page budget used/remaining
3. Add a two-page cold-data planner:
   - `default`
   - `page0`
   - `page3`
   - `auto`
4. Emit a real `ORG #C000` section in unified ASM.
5. Add startup helpers to capture BIOS/game/RAM slot values safely.
6. Add copy helpers for page-3 ROM access with immediate RAM restoration.
7. Restrict asset families allowed into `page3`.
8. Fail generation when a project needs hot access to data placed in `page3`.

## Recommended Asset Placement Policy

Conservative `auto` policy:

- `page0`: presentation screen first
- `page0`: small static boot assets next
- `page3`: larger one-shot cold assets only after page0 is full
- fallback to normal `#4000-#BFFF` placement if an asset is not certified safe

This keeps the first implementation aligned with the current `plain48k` model.

## Diagnostics and UX

The export UI and server diagnostics should state clearly that this mode is:

- `Experimental`
- `MSX1 only`
- `Cold-data only`

And should explain why a project is rejected, for example:

- page-3 asset requires hot random access
- estimated scratch RAM exceeds safe limit
- page-3 compressed blob has no safe restore path

## Recommended Rollout

Phase 1:

- add the mode
- emit `ORG #C000`
- support only `PresentationScreen`
- support ROM-to-VRAM copy through RAM buffer

Phase 2:

- add fonts and static text
- add page-3 planner
- add better diagnostics

Phase 3:

- add selected music blobs and additional cold groups
- add automated OpenMSX validation on MSX1 machines

## Practical Recommendation

For Mideas, the safe product rule should remain:

- prefer `megarom` for general-purpose projects above `48 KB`

`plain64k_msx1` should be offered only when all of these are true:

- the extra `16 KB` is mostly cold data
- the project does not need hot random access to upper ROM
- the project fits the temporary page-3-ROM / restored-page-3-RAM model

If those assumptions break, the generator should push the user to `megarom`.

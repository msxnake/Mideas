# MSX ROM Slot Paging Reference

This note preserves a practical reminder for this project about slot/page setup on MSX ROM cartridges.

## Baseline Assumption

For a ROM whose header starts in page 1 at `$4000`, after BIOS detection and before jumping to the init address:

- Page 0 shows BIOS
- Page 1 shows the cartridge ROM
- Page 3 shows RAM
- Page 2 is undefined

If code or data must be accessed outside page 1 and page 2 is not explicitly mapped to the ROM slot, the machine can crash because the Z80 may see unrelated memory there.

## 32K ROMs and Megaroms

From the slot paging point of view, 32K ROMs and megaroms behave the same:

- ROM must be visible in pages 1 and 2
- Page 2 (`$8000-$BFFF`) must be set to the same slot/subslot as page 1

The generic rule is:

1. Detect which slot/subslot is assigned to page 1
2. Mirror that same slot/subslot into page 2

## Important RAM Caveat for Linear 32K ROMs

If a non-mapper ROM is actually being executed from RAM (for example through a loader), do not blindly force page 2 to match page 1.

Reason:

- Some MSX machines split RAM across different slots
- On those systems, page 1 and page 2 RAM may legitimately live in different slots
- Reassigning page 2 to the ROM/page 1 slot can break the memory layout

So for linear 32K ROMs running from RAM:

- If the loader already configured memory, do nothing

For megaroms loaded through a mapper:

- RAM can usually be treated as unified in one slot
- The RAM-vs-ROM check is less critical in practice

## Linear 48K ROMs

Linear 48K ROMs are harder because they occupy `$0000-$BFFF`, so both page 0 and page 2 matter.

- Page 2 can be mapped in the normal way
- Page 0 is special because BIOS lives there before the switch

You cannot rely on BIOS code while replacing page 0 with the cartridge. The usual approach is:

1. Run a small slot-switch routine from a safe page (commonly page 1)
2. Recreate the needed page 0 switching logic without depending on BIOS code currently visible in page 0

If the program needs to toggle BIOS visibility later, keep two bytes in RAM:

- `SLOTBIOS`: slot configuration that restores BIOS
- `SLOTGAME`: slot configuration that restores the game ROM

That enables helper routines such as:

- Restoring BIOS to page 0
- Re-mapping the game ROM back into page 0

## Practical Takeaway for Mideas

When generating or reviewing MSX ROM code in this repository:

- Never assume page 2 is valid just because page 1 contains the ROM header
- Any access to ROM data/code in `$8000-$BFFF` requires correct slot setup first
- Linear 48K layouts need explicit page 0 handling, not just page 2 setup
- If running from RAM, be careful not to destroy a valid split-RAM configuration

This note should be treated as a design constraint whenever we touch cartridge startup, paging, mappers, or low-level ASM initialization.

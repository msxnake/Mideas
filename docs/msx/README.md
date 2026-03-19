# MSX Documentation Index

- `ROM_SLOT_PAGING_REFERENCE.md`: slot paging and cartridge page mapping notes.
- `SCREEN2_REFERENCE.md`: Screen 2 layout, tables, and VRAM addressing.
- `Z80_INSTRUCTIONS_REFERENCE.md`: valid Z80 instruction patterns and common assembler pitfalls.
- `Z80_LDA_I_ERRATA.md`: critical Z80 errata for `ld a, i` / `ld a, r` and why that pattern must not be used to preserve IRQ state.

Rule for future ASM work: if code touches interrupts, VRAM critical sections, or generator-emitted ASM, review `Z80_LDA_I_ERRATA.md` before editing.

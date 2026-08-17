# MSX Documentation Index

- `ROM_SLOT_PAGING_REFERENCE.md`: slot paging and cartridge page mapping notes.
- `SCREEN2_REFERENCE.md`: Screen 2 layout, tables, and VRAM addressing.
- `Z80_INSTRUCTIONS_REFERENCE.md`: valid Z80 instruction patterns and common assembler pitfalls.
- `Z80_LDA_I_ERRATA.md`: critical Z80 errata for `ld a, i` / `ld a, r` and why that pattern must not be used to preserve IRQ state.
- `MAPPER_KONAMI_SCC_2MB.md`: Konami SCC 2MB mapper spec used by the SCREEN 5 bitmap backend, SCC-window bank gotcha, and KUC notes.
- `MAPPER_ASCII16_STUDY.md`: feasibility study for the ASCII16 mapper (size ceiling, resident-window cost, coexistence with Konami SCC). Conclusion: do not migrate the bitmap backend for now.

Rule for future ASM work: if code touches interrupts, VRAM critical sections, or generator-emitted ASM, review `Z80_LDA_I_ERRATA.md` before editing.

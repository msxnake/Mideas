#!/usr/bin/env python3
"""Build the directed-test driver ROM for fast_copy_to_vram_chunked (CONTRATO B/C2).

Extracts the REAL emitted helper + vdp_write_register blocks from the current
generated united ASM (post-patch tree), wraps them in a test driver that runs
the length matrix 0/1/255/256/257/512/1024/2048 against alternating VRAM dst
blocks (#7800 / #3000: R#14=1 / R#14=0), prefills guards, preserves IX/IY, and
stores one result byte per case in RAM RESULTS. Halts with a #AA done marker.
The Tcl side reads results/VRAM/regs from outside and reports.

Result codes: 0 OK, 1 VRAM mismatch, 2 guard overwritten, 4 IX clobbered,
8 IY clobbered.
"""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASM = ROOT / 'server/temp/msx2_bitmap_room_smoke_fg_fastcopy_patterns1k_unified.asm'
OUT_ASM = ROOT / 'test/msx2-screen5-c2trans/chunked_driver.asm'
GLASS = ROOT / 'server/glass.jar'
OUT_ROM = ROOT / 'test/msx2-screen5-c2trans/chunked_driver.rom'
OUT_SYM = ROOT / 'test/msx2-screen5-c2trans/chunked_driver.sym'

src = ASM.read_text(encoding='utf8')

# ---- extract the real helper block: label .. its final jp vdp_write_register
hs = src.index('fast_copy_to_vram_chunked:')
done_at = src.index('.chunked_done:', hs)
jp_at = src.index('jp vdp_write_register', done_at)
helper_end = src.index('\n', jp_at)
helper = src[hs:helper_end]

# ---- extract vdp_write_register: label .. its ret
vs = src.index('vdp_write_register:')
vre = src.index('\n    ret\n', vs)
vwr = src[vs:vre + len('\n    ret\n')]

# sanity: helper must reference the vdp_write_register label
assert 'vdp_write_register' in helper

DRIVER_BODY = """
; ------------------------------------------------------------
; Directed test driver (CONTRATO B/C2): length matrix against the real
; fast_copy_to_vram_chunked. Results: one byte per case at RESULTS
; (0 = OK; 1 VRAM mismatch; 2 guard overwritten; 4 IX clobbered;
; 8 IY clobbered). DONE byte = #AA when finished.
; ------------------------------------------------------------
LENS:     DW 0, 1, 255, 256, 257, 512, 1024, 2048
NCASES:   EQU 8
SRC:      EQU #C000
RESULTS:  EQU #C500
DONE:     EQU #C510
DST_EVEN: EQU #7800
DST_ODD:  EQU #3000

INIT:
    DI
    LD SP, #F000
    ; source pattern: (i*7+3)&FF over 2056 bytes at SRC
    LD HL, SRC
    LD BC, 2056
    LD A, 3
FILL_SRC_ALL:
    LD (HL), A
    INC HL
    ADD A, 7
    DEC BC
    LD A, B
    OR C
    JR NZ, FILL_SRC_ALL
    ; run the matrix
    LD IX, RESULTS
    LD IY, LENS
    LD B, NCASES
CASE_LOOP:
    PUSH BC
    LD L, (IY+0)
    LD H, (IY+1)
    LD (CASELEN), HL
    CALL RUN_CASE
    INC IY
    INC IY
    POP BC
    DJNZ CASE_LOOP
    LD A, #AA
    LD (DONE), A
HALT_LOOP:
    JR HALT_LOOP

; ------------------------------------------------------------
; RUN_CASE: CASELEN = length; result byte to (IX).
; ------------------------------------------------------------
RUN_CASE:
    ; 1) fill source: CASELEN bytes, pattern (i*7+3)
    LD HL, SRC
    LD BC, (CASELEN)
    LD A, 3
RC_FILL_SRC:
    LD (HL), A
    INC HL
    ADD A, 7
    DEC BC
    LD A, B
    OR C
    JR NZ, RC_FILL_SRC
    ; 2) alternate dst and prefill len+8 guard bytes with #FF
    LD A, (CASEPAR)
    XOR 1
    LD (CASEPAR), A
    LD DE, DST_EVEN
    OR A
    JR Z, RC_DSTSET
    LD DE, DST_ODD
RC_DSTSET:
    LD (DSTCUR), DE
    LD A, E
    OUT (#99), A
    LD A, D
    AND #3F
    OR #40
    OUT (#99), A
    LD BC, (CASELEN)
    LD A, C
    ADD A, 8
    LD C, A
    JR NC, RC_FF_NC
    INC B
RC_FF_NC:
    LD A, #FF
RC_FF:
    OUT (#98), A
    DEC BC
    LD A, B
    OR C
    JR NZ, RC_FF
    ; 3) save IX/IY, set args, call the real helper
    PUSH IX
    POP HL
    LD (SAVIX), HL
    PUSH IY
    POP HL
    LD (SAVIY), HL
    LD HL, SRC
    LD DE, (DSTCUR)
    LD BC, (CASELEN)
    CALL fast_copy_to_vram_chunked
    ; 4) verify VRAM vs source over CASELEN bytes
    LD HL, SRC
    LD DE, (DSTCUR)
    LD BC, (CASELEN)
RC_VERIFY:
    LD A, (DE)
    CP (HL)
    JR NZ, RC_VRAM_FAIL
    INC HL
    INC DE
    DEC BC
    LD A, B
    OR C
    JR NZ, RC_VERIFY
    ; 5) guard bytes after len must be #FF
    LD B, 8
RC_GUARD:
    LD A, (DE)
    CP #FF
    JR NZ, RC_GUARD_FAIL
    INC DE
    DJNZ RC_GUARD
    ; 6) IX/IY preservation
    PUSH IX
    POP HL
    LD DE, (SAVIX)
    OR A
    SBC HL, DE
    JR NZ, RC_IXY_FAIL
    PUSH IY
    POP HL
    LD DE, (SAVIY)
    OR A
    SBC HL, DE
    JR NZ, RC_IXY_FAIL
    XOR A
    JR RC_RESULT
RC_VRAM_FAIL:
    LD A, 1
    JR RC_RESULT
RC_GUARD_FAIL:
    LD A, 2
    JR RC_RESULT
RC_IXY_FAIL:
    LD A, 4
RC_RESULT:
    LD (IX), A
    RET

; ---- variables ----
CASELEN: DW 0
DSTCUR:  DW 0
CASEPAR: DB 0
SAVIX:   DW 0
SAVIY:   DW 0
"""

driver = helper + '\n' + vwr + '\n' + DRIVER_BODY
OUT_ASM.write_text(driver, encoding='utf8', newline='\n')
print(f'driver asm written: {OUT_ASM}')

subprocess.run(['java', '-jar', str(GLASS), '-I', str(ROOT / 'server'),
                str(OUT_ASM), str(OUT_ROM), str(OUT_SYM)], check=True)
print(f'ROM: {OUT_ROM}')

"""Genera un ASM sintetic de 2MB (256 bancs de 8KB) amb el MATEIX patro
d'emissio de bancs que msx2Screen5BitmapRoomGenerator (PHYS_START + org #8000
+ org PHYS_START + #2000), per demostrar que glass.jar + el mapper Konami SCC
arriben als 2MB.

Cada banc de dades porta la signatura [banc, 255-banc] als seus 2 primers
bytes. Els bancs finestra-SCC (63/127/191/255) queden com padding #FF, igual
que fa el packer real. El boot llegeix una llista de bancs de prova per la
finestra P2 (#8000) i desa les signatures a #C000+, i despres verifica que
l'SCC apareix amb #3F -> #9000 (readback de waveform RAM #9800).

Us:  python gen_2mb_stress.py > stress_2mb.asm
"""

TEST_BANKS = [4, 62, 64, 100, 128, 190, 192, 254]
SCC_WINDOW = {0x3F, 0x7F, 0xBF, 0xFF}

out = []
out.append("""; 2MB Konami SCC mapper stress ROM (synthetic, generated)
RSLREG  EQU #0138
ENASLT  EQU #0024

    org #4000
STRESS_BANK0_PHYS_START:
    db "AB"
    dw init_rom
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

init_rom:
    di
    ld sp, #F380
    call map_page2_to_cart_primary
    ; Konami SCC resident bank init (same as generator)
    xor a
    ld (#5000), a
    ld a, 1
    ld (#7000), a
    ld a, 2
    ld (#9000), a
    ld a, 3
    ld (#B000), a
    ; Read the [bank, 255-bank] signature of each test bank through P2
    ld hl, test_bank_list
    ld de, #C000
.bank_loop:
    ld a, (hl)
    cp #FF
    jp z, .scc_test
    ld (#9000), a
    push hl
    ld hl, (#8000)
    ld a, l
    ld (de), a
    inc de
    ld a, h
    ld (de), a
    inc de
    pop hl
    inc hl
    jp .bank_loop
.scc_test:
    ; Bank #3F in P2 exposes the SCC: waveform RAM #9800 must read back
    ld a, #3F
    ld (#9000), a
    ld a, #AA
    ld (#9800), a
    ld a, (#9800)
    ld (de), a
    inc de
    ld a, #55
    ld (#9800), a
    ld a, (#9800)
    ld (de), a
    ; Done marker
    ld a, #77
    ld (#C0FF), a
.halt_loop:
    jp .halt_loop

map_page2_to_cart_primary:
    call RSLREG
    rrca
    rrca
    call get_cart_slot_value
    ld h, #80
    jp ENASLT

get_cart_slot_value:
    and #03
    ld c, a
    ld b, 0
    ld hl, #FCC1
    add hl, bc
    ld a, (hl)
    and #80
    jp z, .slot_ready
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    and #0C
.slot_ready:
    or c
    ret

test_bank_list:""")
out.append("    db " + ", ".join(str(b) for b in TEST_BANKS) + ", #FF")
out.append("    ds #6000 - $, #FF")
out.append("; banks 1-3: resident padding")
for _ in range(3):
    out.append("    ds #2000, #FF")
out.append("")
for bank in range(4, 256):
    if bank in SCC_WINDOW:
        out.append(f"; Bank {bank} reserved: (bank & #3F) == #3F would expose the SCC in the P2 window.")
        out.append("    ds #2000, #FF")
        continue
    out.append(f"STRESS_DATA_BANK_{bank}_PHYS_START:")
    out.append("    org #8000")
    out.append(f"    db {bank}, {255 - bank}")
    out.append("    ds #2000 - 2, #FF")
    out.append(f"    org STRESS_DATA_BANK_{bank}_PHYS_START + #2000")
out.append("    end")
print("\n".join(out))

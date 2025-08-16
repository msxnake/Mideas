; Your game should include one of these routines.
; DecompressRLE is faster but assumes perfect data.
; DecompressRLE_Safe is more robust for development.

; -------------------------------------------------------------------
; DecompressRLE - Fast Version (uses LDIR)
; HL: source address (compressed data, after width/height)
; DE: destination address (VRAM)
; BC: total bytes to decompress (width * height)
; -------------------------------------------------------------------
DecompressRLE:
.main_loop:
    LD A, (HL)      ; Get control byte
    INC HL
    BIT 7, A        ; Check if it's a repeat packet
    JR NZ, .repeat_packet

.literal_packet:    ; Literal packet (bit 7 is 0)
    PUSH BC         ; Save main counter
    LD C, A         ; Low 7 bits are the count
    LD B, 0
    LDIR            ; Copy C bytes from (HL) to (DE)
    POP BC          ; Restore main counter
    JR .check_end

.repeat_packet:     ; Repeat packet (bit 7 is 1)
    AND %01111111   ; Clear bit 7 to get count
    LD C, A         ; C = count
    LD A, (HL)      ; Get byte to repeat
    INC HL
.repeat_loop:
    LD (DE), A
    INC DE
    DEC C
    JR NZ, .repeat_loop
    ; Fall through to check_end

.check_end:
    LD A, B
    OR C
    RET Z           ; Return if BC is zero
    JR .main_loop

; -------------------------------------------------------------------
; DecompressRLE_Safe - Robust version (no LDIR)
; HL: source address (compressed data, after width/height)
; DE: destination address (VRAM)
; BC: total bytes to decompress (width * height)
; -------------------------------------------------------------------
DecompressRLE_Safe:
.main_loop_safe:
    LD A, B
    OR C
    RET Z           ; Return if BC is zero

    LD A, (HL)      ; Get control byte
    INC HL
    BIT 7, A        ; Check if it's a repeat packet
    JR NZ, .repeat_packet_safe

.literal_packet_safe: ; Literal packet (bit 7 is 0)
    LD B, A         ; B = count of literal bytes
.literal_loop_safe:
    LD A, (HL)
    INC HL
    LD (DE), A
    INC DE
    DEC BC          ; Decrement main counter
    DJNZ .literal_loop_safe
    JR .main_loop_safe

.repeat_packet_safe:  ; Repeat packet (bit 7 is 1)
    AND %01111111   ; Clear bit 7 to get count
    LD B, A         ; B = count of repeats
    LD A, (HL)      ; Get byte to repeat
    INC HL
.repeat_loop_safe:
    LD (DE), A
    INC DE
    DEC BC          ; Decrement main counter
    DJNZ .repeat_loop_safe
    JR .main_loop_safe

; =============================================================================
; scc_driver.inc — minimal SCC original driver primitives (Fase 1 of
; docs/MIDEAS_SCC_KONAMI_STUDY.md). Shared by the technical probe ROM and the
; VGM stream player ROM. Register contracts are binding: callers rely on the
; Preserves list of each routine.
; =============================================================================

; ---- BIOS / system ----------------------------------------------------------
ENASLT          equ #0024   ; set slot for page in H (bits 6-7), A = slot id, DI required
RSLREG          equ #0138   ; read primary slot register into A
EXPTBL          equ #FCC1   ; expanded-slot flags per primary slot
                            ; EXPTBL+4 = SLTTBL (last secondary slot reg values)

; ---- SCC original register map (mirror of utils/audio/sccConstants.js) ------
SCC_ENABLE_ADDR equ #9000   ; write #3F here to expose SCC at #9800-#9FFF
SCC_ENABLE_VAL  equ #3F
SCC_WAVE_CH1    equ #9800   ; 32 bytes per channel, ch4/ch5 share #9860
SCC_PERIOD_BASE equ #9880   ; 2 bytes per channel, low byte first, 12 bits
SCC_VOLUME_BASE equ #988A   ; 1 byte per channel, low nibble 0..15
SCC_MIXER       equ #988F   ; bits 0..4 enable channels 1..5
SCC_MIXER_MASK  equ #1F

; -----------------------------------------------------------------------------
; enable_page2_cart
; What:
;   Switch CPU page 2 (#8000-#BFFF) to this cartridge's slot so the Konami SCC
;   bank register (#9000) and the SCC registers (#9800-#9FFF) become visible.
; Inputs:
;   Interrupts must be disabled (ENASLT requirement). Running from page 1.
; Outputs:
;   Page 2 mapped to the same slot as page 1 (this cartridge).
; Destroys:
;   AF, BC, DE, HL (ENASLT clobbers)
; Preserves:
;   IX, IY
; Approx cost:
;   One-time setup. Never call per frame.
; -----------------------------------------------------------------------------
enable_page2_cart:
    call RSLREG
    rrca
    rrca
    and #03                 ; primary slot of page 1 (this cartridge)
    ld c, a
    ld b, 0
    ld hl, EXPTBL
    add hl, bc
    ld a, (hl)
    and #80                 ; expanded-slot flag
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl                  ; HL = SLTTBL + primary slot
    ld a, (hl)
    and #0C                 ; secondary slot bits for page 1
    or c                    ; A = F000SSPP slot id
    ld h, #80               ; target page 2
    call ENASLT
    ret

; -----------------------------------------------------------------------------
; SCC_Init
; What:
;   Enable SCC register access for a Konami SCC cartridge and silence channels.
; Inputs:
;   Page 2 already mapped to the cartridge slot (enable_page2_cart).
; Outputs:
;   SCC exposed at #9800-#9FFF, mixer = 0, all five volumes = 0.
; Destroys:
;   AF, HL
; Preserves:
;   BC, DE, IX, IY
; Approx cost:
;   Small fixed cost. Do not call per frame.
; Notes:
;   Writes #3F to #9000 as per the Konami SCC activation contract.
; -----------------------------------------------------------------------------
SCC_Init:
    ld a, SCC_ENABLE_VAL
    ld (SCC_ENABLE_ADDR), a
    xor a
    ld (SCC_MIXER), a
    ld hl, SCC_VOLUME_BASE
    ld (hl), a              ; volume ch1
    inc hl
    ld (hl), a              ; volume ch2
    inc hl
    ld (hl), a              ; volume ch3
    inc hl
    ld (hl), a              ; volume ch4
    inc hl
    ld (hl), a              ; volume ch5
    ret

; -----------------------------------------------------------------------------
; SCC_Stop
; What:
;   Stop SCC playback and silence every SCC channel.
; Inputs:
;   None.
; Outputs:
;   Volumes #988A-#988E = 0 and mixer #988F = 0.
; Destroys:
;   AF, B, HL
; Preserves:
;   C, DE, IX, IY
; Approx cost:
;   6 memory writes plus loop overhead.
; -----------------------------------------------------------------------------
SCC_Stop:
    xor a
    ld (SCC_MIXER), a
    ld hl, SCC_VOLUME_BASE
    ld b, 5
SCC_Stop_loop:
    ld (hl), a
    inc hl
    djnz SCC_Stop_loop
    ret

; -----------------------------------------------------------------------------
; SCC_SetMixer
; What:
;   Set SCC channel enable mask.
; Inputs:
;   A = bitmask, bit0 channel 1 .. bit4 channel 5.
; Outputs:
;   (#988F) = A & #1F.
; Destroys:
;   AF
; Preserves:
;   BC, DE, HL, IX, IY
; Approx cost:
;   Very small, one masked write.
; -----------------------------------------------------------------------------
SCC_SetMixer:
    and SCC_MIXER_MASK
    ld (SCC_MIXER), a
    ret

; -----------------------------------------------------------------------------
; SCC_SetVolume
; What:
;   Set volume for one SCC channel.
; Inputs:
;   A = channel index 0..4.
;   E = volume 0..15 (only low nibble is written).
; Outputs:
;   SCC volume register #988A + channel updated.
; Destroys:
;   AF, HL
; Preserves:
;   BC, DE, IX, IY
; Approx cost:
;   Small. Address calculation plus one write.
; -----------------------------------------------------------------------------
SCC_SetVolume:
    ld hl, SCC_VOLUME_BASE
    add a, l                ; #8A + 0..4 never carries
    ld l, a
    ld a, e
    and #0F
    ld (hl), a
    ret

; -----------------------------------------------------------------------------
; SCC_SetPeriod
; What:
;   Set 12-bit frequency divider for one SCC channel.
; Inputs:
;   A = channel index 0..4.
;   DE = period, low 12 bits used. f = 3579545 / (32 * (period + 1)).
; Outputs:
;   #9880 + channel*2 = low byte, then next address = high nibble.
; Destroys:
;   AF, HL
; Preserves:
;   BC, DE, IX, IY
; Approx cost:
;   Small. Address calculation plus two writes.
; -----------------------------------------------------------------------------
SCC_SetPeriod:
    add a, a                ; channel * 2
    ld hl, SCC_PERIOD_BASE
    add a, l                ; #80 + 0..8 never carries
    ld l, a
    ld (hl), e
    inc hl
    ld a, d
    and #0F
    ld (hl), a
    ret

; -----------------------------------------------------------------------------
; SCC_LoadWaveform32
; What:
;   Copy one 32-byte waveform into SCC waveform RAM for a channel.
; Inputs:
;   A = channel index 0..4.
;   HL = source waveform address in currently visible ROM/RAM.
; Outputs:
;   Waveform RAM updated. Channel index 4 (channel 5) is clamped to #9860,
;   the buffer shared with channel 4 on SCC original.
; Destroys:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY
; Approx cost:
;   32-byte LDIR plus setup. Avoid inside interrupt. Only call on instrument
;   change, never per frame.
; -----------------------------------------------------------------------------
SCC_LoadWaveform32:
    cp 4
    jp c, SCC_LoadWaveform32_ch
    ld a, 3                 ; SCC original: channel 5 shares #9860 with channel 4
SCC_LoadWaveform32_ch:
    rlca
    rlca
    rlca
    rlca
    rlca                    ; A = channel * 32 (max 96, no wrap)
    ld e, a
    ld d, #98
    ld bc, 32
    ldir
    ret

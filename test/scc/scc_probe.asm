; =============================================================================
; SCC technical probe ROM (Fase 1, step 1 of docs/MIDEAS_SCC_KONAMI_STUDY.md)
;
; Goal: confirm the SCC original register map constants with real hardware
; behaviour under OpenMSX (-romtype KonamiSCC):
;   - enable SCC by writing #3F to #9000 (Konami SCC bank register window)
;   - load a 32-byte triangle waveform into channel 1 (#9800-#981F)
;   - verify the waveform by reading it back (waveform RAM is R/W)
;   - set 12-bit period (#9880/#9881) + volume (#988A) + mixer bit 0 (#988F)
;   - run a tiny 4-note sequencer once per frame (writes SCC only on change)
;   - SCC_Stop on request from the smoke TCL, leaving all volumes/mixer at 0
;
; Progress/result markers live in RAM so the OpenMSX smoke script can assert
; them with `debug read memory`:
;   #C000 marker_boot      1 = INIT reached
;   #C001 marker_slot      2 = page 2 switched to cartridge slot (ENASLT ok)
;   #C002 marker_sccinit   3 = SCC_Init done (SCC exposed at #9800)
;   #C003 marker_wave_ok   1 = 32-byte readback of #9800 matches source
;   #C004 marker_wave_idx  first mismatching index when marker_wave_ok = 0
;   #C005 marker_ready     5 = full init sequence done, main loop running
;   #C006 frame_counter    increments once per frame while music plays
;   #C007 marker_note_idx  current sequencer note index 0..3
;   #C008 marker_stopped   1 = SCC_Stop executed
;   #C010 req_stop         written by the TCL script to request SCC_Stop
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

; ---- RAM (EQU only: cartridge ROM, never ORG into RAM) ----------------------
marker_boot     equ #C000
marker_slot     equ #C001
marker_sccinit  equ #C002
marker_wave_ok  equ #C003
marker_wave_idx equ #C004
marker_ready    equ #C005
frame_counter   equ #C006
marker_note_idx equ #C007
marker_stopped  equ #C008
req_stop        equ #C010
scc_tick        equ #C020   ; frames elapsed inside current note
scc_note_idx    equ #C021   ; sequencer position 0..3

NOTE_FRAMES     equ 25      ; frames per sequencer step (~0.5s PAL)

; =============================================================================
    org #4000
    db "AB"
    dw INIT
    ds 12, 0

INIT:
    di
    ld sp, #F380

    ; clear markers + runtime state
    xor a
    ld (marker_slot), a
    ld (marker_sccinit), a
    ld (marker_wave_ok), a
    ld (marker_wave_idx), a
    ld (marker_ready), a
    ld (frame_counter), a
    ld (marker_note_idx), a
    ld (marker_stopped), a
    ld (req_stop), a
    ld (scc_tick), a
    ld (scc_note_idx), a
    ld a, 1
    ld (marker_boot), a

    call enable_page2_cart
    ld a, 2
    ld (marker_slot), a

    call SCC_Init
    ld a, 3
    ld (marker_sccinit), a

    ; channel 1 (index 0): triangle waveform, then verify readback
    xor a
    ld hl, wave_triangle
    call SCC_LoadWaveform32
    call verify_wave_ch1

    ; channel 1: first note period, full volume, enable only bit 0
    ld de, (note_period_table)      ; note 0 period (little endian word)
    xor a
    call SCC_SetPeriod
    xor a
    ld e, 15
    call SCC_SetVolume
    ld a, #01
    call SCC_SetMixer

    ld a, 5
    ld (marker_ready), a
    ei

main_loop:
    halt
    ld a, (req_stop)
    or a
    jp nz, request_stop
    call SCC_MusicUpdate_1Frame
    ld hl, frame_counter
    inc (hl)
    jp main_loop

request_stop:
    call SCC_Stop
    ld a, 1
    ld (marker_stopped), a
halt_loop:
    halt
    jp halt_loop

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

; -----------------------------------------------------------------------------
; SCC_MusicUpdate_1Frame
; What:
;   Advance the probe's 4-note sequencer state by one video frame.
; Inputs:
;   scc_tick / scc_note_idx initialized (INIT does it).
; Outputs:
;   Every NOTE_FRAMES frames advances to the next note and writes its period
;   to channel 1. SCC registers are written ONLY on note change.
; Destroys:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY
; Approx cost:
;   Cheap on hold frames (counter increment); one period write on note change.
; Notes:
;   Callable once per frame from the main loop. Must not run inside H.TIMI.
; -----------------------------------------------------------------------------
SCC_MusicUpdate_1Frame:
    ld hl, scc_tick
    inc (hl)
    ld a, (hl)
    cp NOTE_FRAMES
    ret c                   ; hold frame: no SCC write at all
    ld (hl), 0
    ld hl, scc_note_idx
    ld a, (hl)
    inc a
    and #03
    ld (hl), a
    ld (marker_note_idx), a
    add a, a
    ld e, a
    ld d, 0
    ld hl, note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    xor a                   ; channel 1
    call SCC_SetPeriod
    ret

; -----------------------------------------------------------------------------
; verify_wave_ch1
; What:
;   Read back the 32 bytes at #9800 and compare against wave_triangle.
; Outputs:
;   marker_wave_ok = 1 on match, 0 + marker_wave_idx = index on mismatch.
; Destroys:
;   AF, BC, DE, HL
; -----------------------------------------------------------------------------
verify_wave_ch1:
    ld hl, SCC_WAVE_CH1
    ld de, wave_triangle
    ld b, 32
    ld c, 0
verify_wave_loop:
    ld a, (de)
    cp (hl)
    jp nz, verify_wave_fail
    inc hl
    inc de
    inc c
    djnz verify_wave_loop
    ld a, 1
    ld (marker_wave_ok), a
    ret
verify_wave_fail:
    xor a
    ld (marker_wave_ok), a
    ld a, c
    ld (marker_wave_idx), a
    ret

; ---- data -------------------------------------------------------------------
; Triangle, 32 signed samples (-128..127) stored as two's complement.
wave_triangle:
    db #00, #10, #20, #30, #40, #50, #60, #70
    db #7F, #70, #60, #50, #40, #30, #20, #10
    db #00, #F0, #E0, #D0, #C0, #B0, #A0, #90
    db #80, #90, #A0, #B0, #C0, #D0, #E0, #F0

; Periods (f = 3579545 / (32 * (period + 1))): A4, C5, E5, A5.
note_period_table:
    dw 253                  ; A4  ~440 Hz
    dw 213                  ; C5  ~523 Hz
    dw 169                  ; E5  ~658 Hz
    dw 126                  ; A5  ~881 Hz

; Pad to 32 KB = 4 Konami SCC banks of 8 KB (banks reset to 0,1,2,3).
    ds #C000 - $, #FF

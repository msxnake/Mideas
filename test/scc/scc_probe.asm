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

; Driver constants + primitives live in scc_driver.inc (shared with the VGM
; stream player ROM scc_vgm_play.asm).

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

    include "scc_driver.inc"
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

; =============================================================================
; SCC VGM stream player ROM — plays real Konami SCC music (converted from a
; VGM rip by test/scc/vgm2scc.js) through the Mideas minimal driver primitives
; (scc_driver.inc). Validates the driver against real-world register traffic:
; waveform swaps, per-frame volume envelopes, 12-bit period sweeps, mixer.
;
; Stream token format (must match vgm2scc.js):
;   #00            end of stream -> loop to scc_stream start
;   #01 n          current frame done, advance n frames total
;   #02 ch lo hi   SCC_SetPeriod
;   #03 ch vol     SCC_SetVolume
;   #04 mask       SCC_SetMixer
;   #05 ch idx     SCC_LoadWaveform32 from scc_wave_table + idx*32
;   #07 off val    raw byte write to #9800+off
;
; RAM markers for the OpenMSX smoke (debug read memory):
;   #C000 marker_boot     1 = INIT reached
;   #C001 marker_slot     2 = page 2 mapped to cartridge slot
;   #C002 marker_sccinit  3 = SCC_Init done
;   #C005 marker_ready    5 = main loop running
;   #C006 frame_counter   wraps at 256, must keep moving
;   #C009 loop_count      +1 every time the stream wraps (#00 token)
;   #C00A marker_bad      1 = unknown token found (converter/player mismatch)
;   #C010 req_stop        TCL writes 1 -> SCC_Stop and halt
;   #C008 marker_stopped  1 = SCC_Stop executed
; =============================================================================

marker_boot     equ #C000
marker_slot     equ #C001
marker_sccinit  equ #C002
marker_ready    equ #C005
frame_counter   equ #C006
marker_stopped  equ #C008
loop_count      equ #C009
marker_bad      equ #C00A
req_stop        equ #C010
stream_ptr      equ #C030   ; 2 bytes
wait_frames     equ #C032   ; idle frames left before processing more tokens

    org #4000
    db "AB"
    dw INIT
    ds 12, 0

INIT:
    di
    ld sp, #F380

    xor a
    ld (marker_slot), a
    ld (marker_sccinit), a
    ld (marker_ready), a
    ld (frame_counter), a
    ld (marker_stopped), a
    ld (loop_count), a
    ld (marker_bad), a
    ld (req_stop), a
    ld (wait_frames), a
    ld hl, scc_stream
    ld (stream_ptr), hl
    ld a, 1
    ld (marker_boot), a

    call enable_page2_cart
    ld a, 2
    ld (marker_slot), a

    call SCC_Init
    ld a, 3
    ld (marker_sccinit), a

    ld a, 5
    ld (marker_ready), a
    ei

main_loop:
    halt
    ld a, (req_stop)
    or a
    jp nz, request_stop
    call stream_update_1frame
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
; stream_update_1frame
; What:
;   Advance the converted VGM stream by one video frame: burn an idle frame if
;   wait_frames > 0, otherwise execute tokens until the next #01 wait token.
; Inputs:
;   stream_ptr / wait_frames initialized (INIT does it).
; Outputs:
;   SCC registers updated through the driver primitives. stream_ptr advanced.
;   loop_count incremented when the #00 end token wraps the stream.
; Destroys:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY
; Approx cost:
;   1 compare on idle frames; on active frames proportional to token count
;   (worst case: waveform load = 32-byte LDIR per changed channel).
; -----------------------------------------------------------------------------
stream_update_1frame:
    ld a, (wait_frames)
    or a
    jp z, stream_process
    dec a
    ld (wait_frames), a
    ret

stream_process:
    ld hl, (stream_ptr)
stream_token_loop:
    ld a, (hl)
    inc hl
    or a
    jp z, stream_wrap
    cp #01
    jp z, stream_tok_wait
    cp #02
    jp z, stream_tok_period
    cp #03
    jp z, stream_tok_volume
    cp #04
    jp z, stream_tok_mixer
    cp #05
    jp z, stream_tok_wave
    cp #07
    jp z, stream_tok_raw
    ld a, 1                 ; unknown token: flag and freeze stream
    ld (marker_bad), a
    dec hl
    ld (stream_ptr), hl
    ret

stream_wrap:
    ld hl, loop_count
    inc (hl)
    ld hl, scc_stream
    jp stream_token_loop

stream_tok_wait:
    ld a, (hl)
    inc hl
    ld (stream_ptr), hl
    dec a                   ; this frame counts as one of the n
    ld (wait_frames), a
    ret

stream_tok_period:
    ld a, (hl)              ; channel
    inc hl
    ld e, (hl)              ; period low
    inc hl
    ld d, (hl)              ; period high nibble
    inc hl
    push hl
    call SCC_SetPeriod      ; destroys AF, HL
    pop hl
    jp stream_token_loop

stream_tok_volume:
    ld a, (hl)              ; channel
    inc hl
    ld e, (hl)              ; volume
    inc hl
    push hl
    call SCC_SetVolume      ; destroys AF, HL
    pop hl
    jp stream_token_loop

stream_tok_mixer:
    ld a, (hl)
    inc hl
    push hl
    call SCC_SetMixer       ; destroys AF
    pop hl
    jp stream_token_loop

stream_tok_wave:
    ld c, (hl)              ; channel
    inc hl
    ld a, (hl)              ; waveform table index
    inc hl
    push hl
    ld l, a                 ; HL = scc_wave_table + idx*32
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, scc_wave_table
    add hl, de
    ld a, c
    call SCC_LoadWaveform32 ; destroys AF, BC, DE, HL
    pop hl
    jp stream_token_loop

stream_tok_raw:
    ld a, (hl)              ; offset inside #9800-#987F
    inc hl
    ld e, (hl)              ; value
    inc hl
    push hl
    ld h, #98
    ld l, a
    ld (hl), e
    pop hl
    jp stream_token_loop

    include "scc_driver.inc"

; ---- converted music data (vgm2scc.js output) --------------------------------
    include "nemesis2_track02.asm"

; Pad to 32 KB = 4 Konami SCC banks of 8 KB.
    ds #C000 - $, #FF

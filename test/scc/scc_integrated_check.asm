ENASLT EQU #0024
RSLREG EQU #0138
EXPTBL EQU #FCC1
music_active   EQU #C000
music_muted    EQU #C001
music_loop     EQU #C002
music_track_index EQU #C003
mapper_bank_p2_current EQU #C004
; ---- SCC music runtime RAM (EQU chain) ----
scc_music_active             EQU #C010
scc_music_muted              EQU #C011
scc_music_loop_count         EQU #C012
scc_music_row_frames         EQU #C013
scc_music_row_countdown      EQU #C014
scc_music_order_pos          EQU #C015
scc_music_order_len          EQU #C016
scc_music_restart_pos        EQU #C017
scc_music_pattern_row        EQU #C018
scc_music_pattern_rows       EQU #C019
scc_music_track_ptr          EQU #C01A
scc_music_order_ptr          EQU #C01C
scc_music_pattern_table_ptr  EQU #C01E
scc_music_inst_table_ptr     EQU #C020
scc_music_orn_table_ptr      EQU #C022
scc_music_row_ptr            EQU #C024
scc_music_mixer_shadow       EQU #C026
scc_ch_note                  EQU #C027
scc_ch_wave                  EQU #C02C
scc_ch_volbase               EQU #C031
scc_ch_envlo                 EQU #C036
scc_ch_envhi                 EQU #C03B
scc_ch_envlen                EQU #C040
scc_ch_envloop               EQU #C045
scc_ch_envstep               EQU #C04A
scc_ch_volout                EQU #C04F
scc_ch_arp_lo                EQU #C054
scc_ch_arp_hi                EQU #C059
scc_ch_arp_len               EQU #C05E
scc_ch_arp_loop              EQU #C063
scc_ch_arp_step              EQU #C068
scc_ch_vib_shift             EQU #C06D
scc_ch_vib_speed             EQU #C072
scc_ch_vib_delay             EQU #C077
scc_ch_vib_ctr               EQU #C07C
scc_ch_vib_phase             EQU #C081
scc_ch_period_lo             EQU #C086
scc_ch_period_hi             EQU #C08B
scc_music_loop_enabled       EQU #C090
    org #4000
    db "AB"
    dw INIT
    ds 12,0
INIT:
    di
    ld sp,#F380
    call enable_page2_cart
    ld a,2
    ld (mapper_bank_p2_current),a
    call music_init_system
    xor a
    ld b,1
    call music_play_track
    ei
loop:
    halt
    call music_update
    jp loop
enable_page2_cart:
    call RSLREG
    rrca
    rrca
    and #03
    ld c,a
    ld b,0
    ld hl,EXPTBL
    add hl,bc
    ld a,(hl)
    and #80
    or c
    ld c,a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a,(hl)
    and #0C
    or c
    ld h,#80
    call ENASLT
    ret
mapper_set_bank_p2:
    ld (mapper_bank_p2_current),a
    ld (#9000),a
    ret
; SCC validation: no warnings

; ---- SCC original register map (mirror of utils/audio/sccConstants.js) ------
SCC_ENABLE_ADDR EQU #9000   ; write #3F here to expose SCC at #9800-#9FFF
SCC_ENABLE_VAL  EQU #3F
SCC_WAVE_CH1    EQU #9800   ; 32 bytes per channel, ch4/ch5 share #9860
SCC_PERIOD_BASE EQU #9880   ; 2 bytes per channel, low byte first, 12 bits
SCC_VOLUME_BASE EQU #988A   ; 1 byte per channel, low nibble 0..15
SCC_MIXER       EQU #988F   ; bits 0..4 enable channels 1..5
SCC_MIXER_MASK  EQU #1F

; -----------------------------------------------------------------------------
; SCC_Init
; What:   Enable SCC register access (Konami SCC cartridge) + silence channels.
; Inputs: Page 2 already mapped to the cartridge slot.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_Init:
    ld a, SCC_ENABLE_VAL
    ld (SCC_ENABLE_ADDR), a
    xor a
    ld (SCC_MIXER), a
    ld hl, SCC_VOLUME_BASE
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    inc hl
    ld (hl), a
    ret

; -----------------------------------------------------------------------------
; SCC_Stop
; What:   Silence every SCC channel (volumes 0 + mixer 0).
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
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
; What:   (#988F) = A & #1F. bit0 ch1 .. bit4 ch5.
; Destroys: AF   Preserves: BC, DE, HL, IX, IY
; -----------------------------------------------------------------------------
SCC_SetMixer:
    and SCC_MIXER_MASK
    ld (SCC_MIXER), a
    ret

; -----------------------------------------------------------------------------
; SCC_SetVolume
; What:   Volume for one channel. A = channel 0..4, E = volume (low nibble).
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
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
; What:   12-bit divider. A = channel 0..4, DE = period (low 12 bits).
;         f = 3579545 / (32 * (period + 1)). Low byte first.
; Destroys: AF, HL   Preserves: BC, DE, IX, IY
; -----------------------------------------------------------------------------
SCC_SetPeriod:
    add a, a
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
; What:   Copy 32-byte waveform to a channel. A = channel 0..4, HL = source.
;         Channel index 4 clamps to #9860 (shared ch4/ch5 on SCC original).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; Cost:   32-byte LDIR. Only call on instrument change, never per frame.
; -----------------------------------------------------------------------------
SCC_LoadWaveform32:
    cp 4
    jp c, SCC_LoadWaveform32_ch
    ld a, 3
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

; ==================================================================
; SCC MUSIC RUNTIME (Fase 1)
; Row player over the validated SCC driver primitives. All SCC register
; traffic goes through shadows: nothing is rewritten unless it changed.
; ==================================================================

SCC_MUSIC_TRACK_COUNT EQU 1

scc_music_track_ptr_table:
    DW scc_track_0_integrated_data

; ------------------------------------------------------------------
; scc_music_init_system
; What:   Reset SCC music RAM, expose the SCC and silence the chip.
; Inputs: Page 2 already mapped to the cartridge slot (ENASLT done).
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
; ------------------------------------------------------------------
scc_music_init_system:
    xor a
    ld (scc_music_active), a
    ld (scc_music_muted), a
    ld (scc_music_loop_count), a
    ld (scc_music_loop_enabled), a
    ld (scc_music_mixer_shadow), a
    call scc_music_reset_channels
    ; The SCC shares the P2 bank register. Keep the caller's mapper bank on
    ; the CPU stack so nested resource loads cannot corrupt a global save slot.
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    call SCC_Init           ; #3F -> #9000 + mixer/volumes to 0
    pop af
    call mapper_set_bank_p2
    ret

; ------------------------------------------------------------------
; scc_music_reset_channels
; What:   Reset per-channel player state (note off, no waveform cached,
;         full volume base, no envelope, force volume rewrite).
; Destroys: AF, B, HL   Preserves: C, DE, IX, IY
; ------------------------------------------------------------------
scc_music_reset_channels:
    ld hl, scc_ch_note
    ld b, 5
scc_music_reset_note_loop:
    ld (hl), #FF
    inc hl
    djnz scc_music_reset_note_loop
    ld hl, scc_ch_wave
    ld b, 5
scc_music_reset_wave_loop:
    ld (hl), #FF
    inc hl
    djnz scc_music_reset_wave_loop
    ld hl, scc_ch_volbase
    ld b, 5
scc_music_reset_volbase_loop:
    ld (hl), #0F
    inc hl
    djnz scc_music_reset_volbase_loop
    xor a
    ld hl, scc_ch_envlen
    ld b, 5
scc_music_reset_envlen_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_envlen_loop
    ld hl, scc_ch_envstep
    ld b, 5
scc_music_reset_envstep_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_envstep_loop
    ld hl, scc_ch_volout
    ld b, 5
scc_music_reset_volout_loop:
    ld (hl), #FF            ; sentinel: force first real write
    inc hl
    djnz scc_music_reset_volout_loop
    ; arpeggio + vibrato disabled, period shadow forced to rewrite
    xor a
    ld hl, scc_ch_arp_len
    ld b, 5
scc_music_reset_arplen_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_arplen_loop
    ld hl, scc_ch_vib_shift
    ld b, 5
scc_music_reset_vibshift_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_vibshift_loop
    ld hl, scc_ch_vib_phase
    ld b, 5
scc_music_reset_vibphase_loop:
    ld (hl), a
    inc hl
    djnz scc_music_reset_vibphase_loop
    ld hl, scc_ch_period_hi
    ld b, 5
scc_music_reset_period_loop:
    ld (hl), #FF           ; sentinel: force first period write
    inc hl
    djnz scc_music_reset_period_loop
    ret

; ------------------------------------------------------------------
; scc_music_play_track
; What:   Start SCC song A (0-based). B bit 0 = loop flag.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_play_track:
    push bc
    ld c, a
    ld a, b
    and 1
    ld (scc_music_loop_enabled), a
    ld a, c
    cp SCC_MUSIC_TRACK_COUNT
    jp c, scc_music_play_track_valid
    pop bc
    jp scc_music_stop
scc_music_play_track_valid:
    add a, a
    ld e, a
    ld d, 0
    ld hl, scc_music_track_ptr_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (scc_music_track_ptr), de
    ; parse header
    ex de, hl               ; HL = track data
    ld a, (hl)              ; +0 row frames
    ld (scc_music_row_frames), a
    inc hl
    ld a, (hl)              ; +1 order length
    ld (scc_music_order_len), a
    inc hl
    ld a, (hl)              ; +2 restart position
    ld (scc_music_restart_pos), a
    inc hl
    inc hl                  ; +3 pattern count (implicit via tables)
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (scc_music_order_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (scc_music_pattern_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (scc_music_inst_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (scc_music_orn_table_ptr), de
    call scc_music_reset_channels
    xor a
    ld (scc_music_muted), a
    ld (scc_music_mixer_shadow), a
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    call SCC_Stop
    pop af
    call mapper_set_bank_p2
    xor a
    call scc_music_set_order_pos
    ld a, 1
    ld (scc_music_row_countdown), a   ; first update plays row 0
    ld (scc_music_active), a
    pop bc
    ret

; ------------------------------------------------------------------
; scc_music_set_order_pos
; What:   Position the player at order entry A: resolve pattern index,
;         set row pointer and row count, reset row counter.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
scc_music_set_order_pos:
    ld (scc_music_order_pos), a
    ld e, a
    ld d, 0
    ld hl, (scc_music_order_ptr)
    add hl, de
    ld a, (hl)              ; pattern index
    ld e, a
    ld d, 0
    ld hl, (scc_music_pattern_table_ptr)
    add hl, de
    add hl, de
    add hl, de              ; entries are 3 bytes: DW rows, DB numRows
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)
    ld (scc_music_pattern_rows), a
    ld (scc_music_row_ptr), de
    xor a
    ld (scc_music_pattern_row), a
    ret

; ------------------------------------------------------------------
; scc_music_stop / scc_music_mute / scc_music_resume
; Same contracts as the PSG tracker block equivalents.
; ------------------------------------------------------------------
scc_music_stop:
    push af
    push bc
    push hl
    call scc_music_init_system
    pop hl
    pop bc
    pop af
    ret

scc_music_mute:
    ld a, (scc_music_active)
    or a
    ret z
    ld a, 1
    ld (scc_music_muted), a
    push bc
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    call SCC_Stop
    pop af
    call mapper_set_bank_p2
    pop bc
    ret

scc_music_resume:
    ld a, (scc_music_active)
    or a
    ret z
    xor a
    ld (scc_music_muted), a
    ; volumes rewrite themselves on the next update via #FF shadows
    push bc
    ld hl, scc_ch_volout
    ld b, 5
scc_music_resume_loop:
    ld (hl), #FF
    inc hl
    djnz scc_music_resume_loop
    xor a
    ld (scc_music_mixer_shadow), a
    pop bc
    ret

; ------------------------------------------------------------------
; scc_music_update
; What:   Advance SCC music by one video frame: row timing, note/
;         instrument/volume events, per-frame volume envelopes, mixer.
;         Writes SCC registers only when shadow state changed.
; Inputs: Runtime RAM initialized (scc_music_play_track).
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; Cost:   Cheap on hold frames; note-on with waveform change costs one
;         32-byte LDIR per changed channel. Call once per frame from
;         the main loop, never from H.TIMI.
; ------------------------------------------------------------------
scc_music_update:
    ld a, (scc_music_active)
    or a
    ret z
    ld a, (scc_music_muted)
    or a
    ret nz
    ld a, (mapper_bank_p2_current)
    push af
    ld a, SCC_ENABLE_VAL
    call mapper_set_bank_p2
    ld hl, scc_music_row_countdown
    dec (hl)
    jp nz, scc_music_update_effects
    ld a, (scc_music_row_frames)
    ld (hl), a
    call scc_music_advance_row
    ld a, (scc_music_active)
    or a
    jp z, scc_music_update_restore_bank
scc_music_update_effects:
    call scc_music_update_pitch
    call scc_music_update_envelopes
    call scc_music_apply_mixer
scc_music_update_restore_bank:
    pop af
    jp mapper_set_bank_p2

; ------------------------------------------------------------------
; scc_music_advance_row
; What:   Decode the current row (5 channels x 4 bytes: note,
;         instrument, ornament, volume) and fire channel events, then
;         advance row/order position with restart wrap.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_advance_row:
    ld hl, (scc_music_row_ptr)
    ld c, 0                 ; channel index
scc_music_row_ch_loop:
    ld b, (hl)              ; note field
    inc hl
    ld d, (hl)              ; instrument field
    inc hl
    ld e, (hl)              ; ornament field
    inc hl
    push hl
    push bc                 ; save note (B) + channel (C)
    push de                 ; save instrument (D)
    ld a, e                 ; ornament field -> arp arrays for this channel
    call scc_music_apply_ornament
    pop de                  ; D = instrument field
    pop bc                  ; B = note, C = channel
    pop hl
    ld e, (hl)              ; volume field
    inc hl
    push hl
    push bc
    call scc_music_apply_cell
    pop bc
    pop hl
    inc c
    ld a, c
    cp 5
    jp c, scc_music_row_ch_loop
    ld (scc_music_row_ptr), hl
    ld hl, scc_music_pattern_row
    inc (hl)
    ld a, (scc_music_pattern_rows)
    cp (hl)
    ret nz
    ; end of pattern: next order entry (wrap to restart position)
    ld a, (scc_music_order_pos)
    inc a
    ld e, a
    ld a, (scc_music_order_len)
    cp e
    jp nz, scc_music_advance_order_set
    ld hl, scc_music_loop_count
    inc (hl)
    ld a, (scc_music_loop_enabled)
    or a
    jp z, scc_music_stop
    ld a, (scc_music_restart_pos)
    ld e, a
scc_music_advance_order_set:
    ld a, e
    jp scc_music_set_order_pos

; ------------------------------------------------------------------
; scc_music_apply_cell
; What:   Apply one row cell to one channel.
; Inputs: C = channel 0..4, B = note field, D = instrument field,
;         E = volume field.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_apply_cell:
    ; ---- instrument field first (note-on may use its volume/wave) ----
    ld a, d
    cp #FF
    jp z, scc_music_cell_volume
    or a
    jp z, scc_music_cell_volume
    push bc                 ; keep note (B) + channel (C)
    push de                 ; keep volume field (E)
    add a, a
    ld e, a
    ld d, 0
    ld hl, (scc_music_inst_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jp z, scc_music_cell_inst_done   ; null instrument pointer
    ex de, hl               ; HL = instrument record
    ; +0 waveform index -> load only when the channel timbre changes
    ld e, (hl)              ; E = new waveform index
    push hl
    ld hl, scc_ch_wave
    call scc_wave_cache_ptr
    ld a, (hl)
    cp e
    jp z, scc_music_cell_wave_same
    ld (hl), e
    ld l, e                 ; HL = scc_wave_table + E*32
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, scc_wave_table
    add hl, de
    ld a, c
    push bc
    call SCC_LoadWaveform32
    pop bc
scc_music_cell_wave_same:
    pop hl                  ; instrument record +0
    inc hl                  ; +1 default volume
    ld e, (hl)
    push hl
    ld hl, scc_ch_volbase
    call scc_ch_ptr
    ld (hl), e
    pop hl
    inc hl                  ; +2 envelope ptr low
    ld e, (hl)
    inc hl                  ; +3 envelope ptr high
    ld d, (hl)
    inc hl                  ; +4 envelope length
    ld b, (hl)              ; note field already saved on stack
    inc hl                  ; +5 envelope loop
    ld a, (hl)              ; A = envelope loop
    inc hl                  ; HL = instrument record +6 (vibrato block)
    push hl                 ; save record+6 for the vibrato read below
    push af                 ; save envelope loop
    push de
    ld hl, scc_ch_envlo
    call scc_ch_ptr
    pop de
    ld (hl), e
    push de
    ld hl, scc_ch_envhi
    call scc_ch_ptr
    pop de
    ld (hl), d
    ld hl, scc_ch_envlen
    call scc_ch_ptr
    ld (hl), b
    pop af                  ; envelope loop
    ld e, a
    ld hl, scc_ch_envloop
    call scc_ch_ptr
    ld (hl), e
    ; ---- cache per-instrument vibrato (depth/speed/delay) for this channel ----
    pop hl                  ; HL = instrument record +6
    ld e, (hl)              ; +6 vibrato depth/shift
    inc hl
    ld b, (hl)              ; +7 vibrato speed
    inc hl
    ld d, (hl)              ; +8 vibrato delay
    ld hl, scc_ch_vib_shift
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_vib_speed
    call scc_ch_ptr
    ld (hl), b
    ld hl, scc_ch_vib_delay
    call scc_ch_ptr
    ld (hl), d
scc_music_cell_inst_done:
    pop de
    pop bc
scc_music_cell_volume:
    ; ---- volume field: overrides the channel volume base ----
    ld a, e
    cp #FF
    jp z, scc_music_cell_note
    and #0F
    ld e, a
    ld hl, scc_ch_volbase
    call scc_ch_ptr
    ld (hl), e
scc_music_cell_note:
    ; ---- note field ----
    ld a, b
    cp #FF
    ret z                   ; keep playing
    cp #FE
    jp z, scc_music_cell_note_cut
    ; note on: store the base note; the per-frame pitch engine computes the
    ; effective period (base note + arpeggio + vibrato) and writes it this
    ; same frame. Restart envelope, arpeggio and vibrato phase.
    ld e, a
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_envstep
    call scc_ch_ptr
    ld (hl), 0
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld (hl), 0
    ld hl, scc_ch_vib_phase
    call scc_ch_ptr
    ld (hl), 0
    ld hl, scc_ch_vib_delay
    call scc_ch_ptr
    ld e, (hl)
    ld hl, scc_ch_vib_ctr
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_period_hi
    call scc_ch_ptr
    ld (hl), #FF            ; force the pitch engine to write the period
    ret
scc_music_cell_note_cut:
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld (hl), #FF
    ; stop arpeggio so a silenced channel does not keep stepping
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld (hl), 0
    ; force volume 0 now and refresh shadow
    ld hl, scc_ch_volout
    call scc_ch_ptr
    ld (hl), 0
    ld e, 0
    ld a, c
    push bc
    call SCC_SetVolume
    pop bc
    ret

; ------------------------------------------------------------------
; scc_ch_ptr
; What:   HL = HL + C (channel index 0..4) with carry into H.
; Destroys: AF   Preserves: BC, DE, IX, IY
; ------------------------------------------------------------------
scc_ch_ptr:
    ld a, c
    add a, l
    ld l, a
    ret nc
    inc h
    ret

; ------------------------------------------------------------------
; scc_wave_cache_ptr
; What:   HL = HL + min(C, 3). SCC original channels 4/5 share both
;         hardware waveform RAM and one cache entry.
; Destroys: AF   Preserves: BC, DE, IX, IY
; ------------------------------------------------------------------
scc_wave_cache_ptr:
    ld a, c
    cp 4
    jp c, scc_wave_cache_ptr_add
    ld a, 3
scc_wave_cache_ptr_add:
    add a, l
    ld l, a
    ret nc
    inc h
    ret

; ------------------------------------------------------------------
; scc_music_apply_ornament
; What:   Bind an ornament (arpeggio) to a channel from a row cell.
; Inputs: A = ornament field (#FF keep, 0 clear, 1..15 select),
;         C = channel 0..4. Ornament pointer table = scc_music_orn_table_ptr.
; Destroys: AF, DE, HL   Preserves: BC, IX, IY
; ------------------------------------------------------------------
scc_music_apply_ornament:
    cp #FF
    ret z                    ; keep current ornament
    or a
    jp z, scc_music_orn_clear
    ; look up ornament ptr table[A] (2 bytes/entry)
    add a, a
    ld e, a
    ld d, 0
    ld hl, (scc_music_orn_table_ptr)
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)               ; DE = ornament record pointer (0 = none)
    ld a, e
    or d
    jp z, scc_music_orn_clear
    ex de, hl                ; HL = ornament record (+0 len, +1 loop, +2 data)
    ld a, (hl)               ; len
    inc hl                   ; -> loop
    ld d, (hl)               ; D = loop
    inc hl                   ; HL = data pointer
    ld e, a                  ; E = len
    push hl                  ; save data pointer
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld (hl), e               ; arp_len = len
    ld hl, scc_ch_arp_loop
    call scc_ch_ptr
    ld (hl), d               ; arp_loop = loop
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld (hl), 0               ; restart the arpeggio
    pop de                   ; DE = data pointer
    ld hl, scc_ch_arp_lo
    call scc_ch_ptr
    ld (hl), e
    ld hl, scc_ch_arp_hi
    call scc_ch_ptr
    ld (hl), d
    ret
scc_music_orn_clear:
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld (hl), 0               ; inactive
    ret

; ------------------------------------------------------------------
; scc_music_update_pitch
; What:   Per-frame pitch for every live channel: effective note =
;         base note + arpeggio step offset, converted to a period, then
;         a triangle-LFO vibrato offset is added. The SCC period is
;         written only when it differs from the per-channel shadow.
; Inputs: scc_ch_note / arp / vib arrays, scc_note_period_table, scc_vib_table.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_pitch:
    ld c, 0                  ; channel index
scc_pitch_ch_loop:
    ld hl, scc_ch_note
    call scc_ch_ptr
    ld a, (hl)
    cp #FF
    jp z, scc_pitch_next     ; silent channel: nothing to pitch
    ld b, a                  ; B = effective note (base to start)
    ; ---- arpeggio ----
    ld hl, scc_ch_arp_len
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp z, scc_pitch_no_arp
    ld d, a                  ; D = len (>=1)
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld a, (hl)               ; step
    cp d
    jp c, scc_pitch_arp_step_ok
    ; step past end: wrap to loop, or hold the last entry
    ld hl, scc_ch_arp_loop
    call scc_ch_ptr
    ld a, (hl)
    cp #FF
    jp nz, scc_pitch_arp_step_ok
    ld a, d
    dec a                    ; hold last (len-1)
scc_pitch_arp_step_ok:
    ld e, a                  ; E = effective step (0..len-1)
    ld hl, scc_ch_arp_step
    call scc_ch_ptr
    ld a, e
    inc a
    ld (hl), a               ; store step+1 for next frame
    ld hl, scc_ch_arp_lo
    call scc_ch_ptr
    ld a, (hl)
    ld hl, scc_ch_arp_hi
    call scc_ch_ptr
    ld h, (hl)
    ld l, a                  ; HL = ornament data base
    ld d, 0                  ; DE = step (E)
    add hl, de
    ld a, (hl)               ; signed semitone offset
    add a, b
    ld b, a                  ; effective note += offset
scc_pitch_no_arp:
    ; ---- base period lookup (clamp note to 0..95) ----
    ld a, b
    cp 96
    jp c, scc_pitch_note_ok
    ld a, 95
scc_pitch_note_ok:
    add a, a
    ld l, a
    ld h, 0
    ld de, scc_note_period_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)               ; DE = base period
    ; ---- vibrato (triangle LFO scaled by shift) ----
    ld hl, scc_ch_vib_shift
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp z, scc_pitch_write    ; vibrato disabled
    ld hl, scc_ch_vib_ctr
    call scc_ch_ptr
    ld a, (hl)
    or a
    jp z, scc_pitch_vib_active
    dec (hl)                 ; delay still counting down
    jp scc_pitch_write
scc_pitch_vib_active:
    push de                  ; save base period across the delta math
    ld hl, scc_ch_vib_speed
    call scc_ch_ptr
    ld a, (hl)
    ld hl, scc_ch_vib_phase
    call scc_ch_ptr
    add a, (hl)
    ld (hl), a               ; phase += speed
    rrca
    rrca
    and #3F                  ; idx = (phase >> 2) & 63
    ld l, a
    ld h, 0
    ld de, scc_vib_table
    add hl, de
    ld a, (hl)               ; signed triangle value
    ld e, a                  ; E = value
    ld hl, scc_ch_vib_shift
    call scc_ch_ptr
    ld a, 5
    sub (hl)                 ; N = 5 - shift (0..4)
    ld b, a
    ld a, e                  ; A = triangle value
    inc b
    jr scc_pitch_vib_sra_test
scc_pitch_vib_sra:
    sra a                    ; arithmetic (sign-preserving) shift right
scc_pitch_vib_sra_test:
    dec b
    jr nz, scc_pitch_vib_sra
    pop de                   ; DE = base period
    ld l, a
    ld h, 0
    bit 7, a
    jr z, scc_pitch_vib_pos
    ld h, #FF                ; sign-extend a negative delta
scc_pitch_vib_pos:
    add hl, de
    ex de, hl                ; DE = period + vibrato delta
scc_pitch_write:
    ; write DE to the SCC only when it differs from the channel shadow
    ld hl, scc_ch_period_lo
    call scc_ch_ptr
    ld a, e
    cp (hl)
    jp nz, scc_pitch_do_write
    ld a, d
    and #0F
    ld hl, scc_ch_period_hi
    call scc_ch_ptr
    cp (hl)
    jp z, scc_pitch_next
scc_pitch_do_write:
    ld hl, scc_ch_period_lo
    call scc_ch_ptr
    ld (hl), e
    ld a, d
    and #0F
    ld hl, scc_ch_period_hi
    call scc_ch_ptr
    ld (hl), a
    ld a, c
    push bc
    call SCC_SetPeriod
    pop bc
scc_pitch_next:
    inc c
    ld a, c
    cp 5
    jp c, scc_pitch_ch_loop
    ret

; ------------------------------------------------------------------
; scc_music_update_envelopes
; What:   Per-frame volume for each active channel: envelope value
;         (attenuated by the channel volume base) or the base itself.
;         Writes SCC volume only when it differs from the shadow.
; Destroys: AF, BC, DE, HL   Preserves: IX, IY
; ------------------------------------------------------------------
scc_music_update_envelopes:
    ld c, 0
scc_music_env_ch_loop:
    ; skip silent channels (note == #FF)
    ld hl, scc_ch_note
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, scc_music_env_next
    ; envelope length
    ld hl, scc_ch_envlen
    add hl, de
    ld a, (hl)
    or a
    jp z, scc_music_env_use_base
    ld b, a                 ; B = length
    ; step with hold/loop
    ld hl, scc_ch_envstep
    add hl, de
    ld a, (hl)
    cp b
    jp c, scc_music_env_step_ok
    ; past the end: loop or hold last
    push hl
    ld hl, scc_ch_envloop
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp nz, scc_music_env_step_ok
    ld a, b
    dec a                   ; hold last value
scc_music_env_step_ok:
    ld (hl), a
    inc (hl)                ; advance for next frame
    ; fetch envelope[A]
    push de
    ld hl, scc_ch_envlo
    add hl, de
    ld e, (hl)
    ld hl, scc_ch_envhi
    push af
    ld a, c
    add a, l
    ld l, a
    ld a, 0
    adc a, h
    ld h, a
    pop af
    ld d, (hl)
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    pop de
    ; attenuate by volume base: vol = min(env, volbase)
    ld hl, scc_ch_volbase
    add hl, de
    cp (hl)
    jp c, scc_music_env_apply
    ld a, (hl)
    jp scc_music_env_apply
scc_music_env_use_base:
    ld hl, scc_ch_volbase
    add hl, de
    ld a, (hl)
scc_music_env_apply:
    ; write only on change
    ld hl, scc_ch_volout
    add hl, de
    cp (hl)
    jp z, scc_music_env_next
    ld (hl), a
    ld e, a
    ld a, c
    push bc
    call SCC_SetVolume
    pop bc
scc_music_env_next:
    inc c
    ld a, c
    cp 5
    jp c, scc_music_env_ch_loop
    ret

; ------------------------------------------------------------------
; scc_music_apply_mixer
; What:   Rebuild the channel-enable mask from scc_ch_note (bit set
;         when the channel holds a live note) and write it through
;         the shadow.
; Destroys: AF, BC, HL   Preserves: DE, IX, IY
; ------------------------------------------------------------------
scc_music_apply_mixer:
    ld hl, scc_ch_note
    ld b, 5
    ld c, 0                 ; mask accumulator
scc_music_mixer_loop:
    ld a, (hl)
    inc hl
    cp #FF
    jp z, scc_music_mixer_bit_done
    scf
scc_music_mixer_bit_done:
    rr c                    ; carry -> bit 7; after 5 rounds bits 3..7
    djnz scc_music_mixer_loop
    ld a, c
    rrca
    rrca
    rrca                    ; bits 3..7 -> bits 0..4
    and SCC_MIXER_MASK
    ld hl, scc_music_mixer_shadow
    cp (hl)
    ret z
    ld (hl), a
    jp SCC_SetMixer

; ==================================================================
; MIDEAS PUBLIC MUSIC API -> SCC BACKEND
; Game Flow, State Machines and world transitions keep using music_*.
; ==================================================================
; @mideas:block id=runtime.sound.music_scc_public kind=routine owner=sound roots=music_init_system,music_play_track,music_execute_command,music_update,music_stop,music_mute,music_resume

; Inputs: none. Destroys: AF, B, HL. Preserves: C, DE, IX, IY.
music_init_system:
    call scc_music_init_system
    xor a
    ld (music_active), a
    ld (music_muted), a
    ld (music_loop), a
    ld (music_track_index), a
    ret

; Inputs: A = track index, B bit 0 = loop. Destroys: AF, BC, DE, HL.
music_play_track:
    ld (music_track_index), a
    push af
    ld a, b
    and 1
    ld (music_loop), a
    pop af
    call scc_music_play_track
    ld a, (scc_music_active)
    ld (music_active), a
    xor a
    ld (music_muted), a
    ret

; Inputs: none. Destroys: AF, BC, HL. Preserves: DE, IX, IY.
music_stop:
    call scc_music_stop
    xor a
    ld (music_active), a
    ld (music_muted), a
    ld (music_loop), a
    ret

music_mute:
    call scc_music_mute
    ld a, (scc_music_muted)
    ld (music_muted), a
    ret

music_resume:
    call scc_music_resume
    ld a, (scc_music_muted)
    ld (music_muted), a
    ret

; Inputs: none. Destroys: AF, BC, DE, HL. Call once per frame outside H.TIMI.
music_update:
    call scc_music_update
    ld a, (scc_music_active)
    ld (music_active), a
    ld a, (scc_music_muted)
    ld (music_muted), a
    ret

; Input: DE -> [command, trackIndex, loopFlag].
; Commands: 0=stop, 1=play, 2=mute, 3=resume, #FF=no-op.
; Destroys: AF, BC (play path), DE (play path), HL.
music_execute_command:
    ld a, (de)
    cp #FF
    ret z
    or a
    jp z, music_stop
    cp 1
    jp z, music_execute_scc_play
    cp 2
    jp z, music_mute
    cp 3
    jp z, music_resume
    ret
music_execute_scc_play:
    inc de
    ld a, (de)
    ld c, a
    inc de
    ld a, (de)
    ld b, a
    ld a, c
    jp music_play_track

music_track_count:
    DB #01
; @mideas:endblock id=runtime.sound.music_scc_public

; ==================================================================

; SCC MUSIC DATA

; ==================================================================

scc_note_period_table:
    DW #0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF,#0FFF
    DW #0FFF,#0FE3,#0EFE,#0E27,#0D5B,#0C9C,#0BE6,#0B3B
    DW #0A9A,#0A01,#0972,#08EA,#086A,#07F1,#077F,#0713
    DW #06AD,#064D,#05F3,#059D,#054C,#0500,#04B8,#0474
    DW #0434,#03F8,#03BF,#0389,#0356,#0326,#02F9,#02CE
    DW #02A6,#0280,#025C,#023A,#021A,#01FB,#01DF,#01C4
    DW #01AB,#0193,#017C,#0167,#0152,#013F,#012D,#011C
    DW #010C,#00FD,#00EF,#00E1,#00D5,#00C9,#00BD,#00B3
    DW #00A9,#009F,#0096,#008E,#0086,#007E,#0077,#0070
    DW #006A,#0064,#005E,#0059,#0054,#004F,#004B,#0046
    DW #0042,#003F,#003B,#0038,#0034,#0031,#002F,#002C
    DW #0029,#0027,#0025,#0023,#0021,#001F,#001D,#001B

scc_vib_table:
    DB #00,#03,#06,#09,#0C,#0F,#11,#14,#16,#18,#1A,#1B,#1D,#1E,#1E,#1F
    DB #1F,#1F,#1E,#1E,#1D,#1B,#1A,#18,#16,#14,#11,#0F,#0C,#09,#06,#03
    DB #00,#FD,#FA,#F7,#F4,#F1,#EF,#EC,#EA,#E8,#E6,#E5,#E3,#E2,#E2,#E1
    DB #E1,#E1,#E2,#E2,#E3,#E5,#E6,#E8,#EA,#EC,#EF,#F1,#F4,#F7,#FA,#FD

; 1 unique waveform(s), 32 bytes each (signed two's complement)
scc_wave_table:
    DB #88,#98,#A8,#B8,#C8,#D8,#E8,#F8,#08,#18,#28,#38,#48,#58,#68,#78
    DB #78,#68,#58,#48,#38,#28,#18,#08,#F8,#E8,#D8,#C8,#B8,#A8,#98,#88

; ------------------------------------------------------------------
; SCC Song 0: integrated
; ------------------------------------------------------------------
scc_track_0_integrated_data:
    DB #06          ; +0 frames per row
    DB #01          ; +1 order length
    DB #00          ; +2 restart position
    DB #01          ; +3 pattern count
    DW scc_track_0_integrated_order_table          ; +4
    DW scc_track_0_integrated_pattern_table          ; +6
    DW scc_track_0_integrated_instrument_ptr_table  ; +8
    DW scc_track_0_integrated_ornament_ptr_table    ; +10

scc_track_0_integrated_order_table:
    DB #00

scc_track_0_integrated_pattern_table:
    DW scc_track_0_integrated_pattern_0_rows
    DB #10

scc_track_0_integrated_instrument_ptr_table:
    DW 0
    DW scc_track_0_integrated_inst_1
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

scc_track_0_integrated_ornament_ptr_table:
    DW 0
    DW scc_track_0_integrated_orn_1
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

scc_track_0_integrated_orn_1:
    DB #03          ; length
    DB #00          ; loop index
scc_track_0_integrated_orn_1_data:
    DB #00,#04,#07

scc_track_0_integrated_pattern_0_rows:
    DB #30,#01,#FF,#0F,#34,#01,#01,#0C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#01,#FF,#0F,#34,#01,#01,#0C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#01,#FF,#0F,#34,#01,#01,#0C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #30,#01,#FF,#0F,#34,#01,#01,#0C,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF

scc_track_0_integrated_inst_1:
    DB #00          ; +0 waveform table index
    DB #0F          ; +1 default volume
    DW scc_track_0_integrated_inst_1_vol_env          ; +2 volume envelope ptr
    DB #04          ; +4 envelope length
    DB #FF          ; +5 envelope loop (#FF = hold last)
    DB #03          ; +6 vibrato depth (0=off..5)
    DB #14          ; +7 vibrato speed (phase inc/frame)
    DB #02          ; +8 vibrato delay frames
scc_track_0_integrated_inst_1_vol_env:
    DB #0F,#0C,#0A,#08

    ds #C000-$,#FF

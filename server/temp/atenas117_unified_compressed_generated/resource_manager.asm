; @mideas:block id=runtime.resources.manager kind=routine owner=resources roots=resource_manager_init,resource_find_by_id,resource_copy_from_bank_to_ram,resource_decompress_from_bank_to_ram,resource_copy_from_bank_to_vram,resource_decompress_from_bank_to_vram,resource_dzx0_to_vram,resource_load_to_ram_by_id,resource_load_to_vram_by_id,resource_read_byte_from_bank
; ==================================================================
; RESOURCE MANAGER
; File: resource_manager.asm
; Description: Centralized banked resource lookup and copy helpers
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; ==================================================================

resource_manager_init:
    xor a
    ld (far_call_irq_lock_depth), a
    ld (resource_descriptor_bank), a
    ld (resource_descriptor_ptr), a
    ld (resource_descriptor_ptr + 1), a
    ld (resource_descriptor_addr), a
    ld (resource_descriptor_addr + 1), a
    ld (resource_descriptor_size), a
    ld (resource_descriptor_size + 1), a
    ld (resource_descriptor_uncompressed_size), a
    ld (resource_descriptor_uncompressed_size + 1), a
    ld (resource_descriptor_flags), a
    ld (vram_cache_tile_patterns_ready), a
    ld (vram_cache_tile_colors_ready), a
    ld (vram_cache_font_ready), a
    ld a, #FF
    ld (resource_descriptor_id), a

    ld (resource_ram_cache_effects_layout_id), a
    ld (resource_ram_cache_effect_zone_table_id), a
    ld (current_screen2_tilebank_id), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_pattern_vram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; ------------------------------------------------------------------
resource_invalidate_pattern_vram_cache:
    xor a
    ld (vram_cache_tile_patterns_ready), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_color_vram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; ------------------------------------------------------------------
resource_invalidate_color_vram_cache:
    xor a
    ld (vram_cache_tile_colors_ready), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_font_vram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; ------------------------------------------------------------------
resource_invalidate_font_vram_cache:
    xor a
    ld (vram_cache_font_ready), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_gameplay_vram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; Notes:
;   Use this when a fullscreen effect or presentation screen overwrites
;   shared gameplay/font VRAM tables outside the normal loaders.
; ------------------------------------------------------------------
resource_invalidate_gameplay_vram_cache:
    call resource_invalidate_pattern_vram_cache
    call resource_invalidate_color_vram_cache
    call resource_invalidate_font_vram_cache
    ld a, #FF
    ld (current_screen2_tilebank_id), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_screen_ram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; Notes:
;   Invalidates the clean RAM copies used to rebuild runtime screen data
;   without re-reading the same banked resource on repeated screen loads.
; ------------------------------------------------------------------
resource_invalidate_screen_ram_cache:
    ld a, #FF

    ld (resource_ram_cache_effects_layout_id), a
    ld (resource_ram_cache_effect_zone_table_id), a
    ret

; ------------------------------------------------------------------
; resource_find_by_id
; Inputs:
;   A = resource id
; Outputs on success (carry clear):
;   HL = pointer to descriptor entry
;   A  = bank number
;   DE = visible window address
;   BC = stored size in bytes
; Outputs on failure (carry set):
;   HL = resource_table
; Clobbers:
;   AF, BC, DE, HL
; Notes:
;   Mirrors the descriptor into RAM so callers can inspect fields later
;   without re-scanning the table.
; ------------------------------------------------------------------
resource_find_by_id:
    ld c, a
    ld a, (resource_descriptor_id)
    cp c
    jr nz, .resource_find_lookup
    ld a, (resource_descriptor_bank)
    ld de, (resource_descriptor_addr)
    ld bc, (resource_descriptor_size)
    or a
    ret
.resource_find_lookup:
    ld a, c
    cp RESOURCE_TABLE_COUNT
    jp nc, .resource_find_not_found
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, resource_table
    add hl, de
    ld a, c
    ld (resource_descriptor_id), a
    ld (resource_descriptor_ptr), hl
    push hl
    ld a, (hl)
    ld (resource_descriptor_bank), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (resource_descriptor_addr), de
    inc hl
    ld c, (hl)
    inc hl
    ld b, (hl)
    ld (resource_descriptor_size), bc
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (resource_descriptor_uncompressed_size), de
    inc hl
    ld a, (hl)
    ld (resource_descriptor_flags), a
    ld de, (resource_descriptor_addr)
    ld bc, (resource_descriptor_size)
    pop hl
    ld a, (resource_descriptor_bank)
    or a
    ret

.resource_find_not_found:
    xor a
    ld (resource_descriptor_bank), a
    ld (resource_descriptor_ptr), a
    ld (resource_descriptor_ptr + 1), a
    ld (resource_descriptor_addr), a
    ld (resource_descriptor_addr + 1), a
    ld (resource_descriptor_size), a
    ld (resource_descriptor_size + 1), a
    ld (resource_descriptor_uncompressed_size), a
    ld (resource_descriptor_uncompressed_size + 1), a
    ld (resource_descriptor_flags), a
    ld a, #FF
    ld (resource_descriptor_id), a
    scf
    ret

; ------------------------------------------------------------------
; resource_copy_from_bank_to_ram
; Inputs:
;   A  = bank number
;   HL = source visible in mapper data window
;   DE = destination in RAM
;   BC = size in bytes
; Outputs:
;   carry clear
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_copy_from_bank_to_ram:
    push af
    ld a, b
    or c
    jr nz, .resource_copy_ram_has_size
    pop af
    or a
    ret
.resource_copy_ram_has_size:
    pop af
    di
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    ldir
    call mapper_pop_p3
    ld a, (interrupt_in_progress)
    or a
    jp nz, .resource_copy_ram_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .resource_copy_ram_irq_done
    ei

.resource_copy_ram_irq_done:
    or a
    ret

; ------------------------------------------------------------------
; resource_decompress_from_bank_to_ram
; Inputs:
;   A  = bank number
;   HL = ZX0 source visible in mapper data window
;   DE = destination in RAM
; Outputs:
;   carry clear
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_decompress_from_bank_to_ram:
    di
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    call dzx0_standard
    call mapper_pop_p3
    ld a, (interrupt_in_progress)
    or a
    jp nz, .resource_decompress_ram_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .resource_decompress_ram_irq_done
    ei

.resource_decompress_ram_irq_done:
    or a
    ret

; ------------------------------------------------------------------
; resource_copy_from_bank_to_vram
; Inputs:
;   A  = bank number
;   HL = source visible in mapper data window
;   DE = destination in VRAM
;   BC = size in bytes
; Outputs:
;   carry clear
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_copy_from_bank_to_vram:
    push af
    ld a, b
    or c
    jr nz, .resource_copy_vram_has_size
    pop af
    or a
    ret
.resource_copy_vram_has_size:
    pop af
    di
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    ; Banked VRAM copy keeps IRQs masked until P2 is restored.
    ; FAST_LDIRVM re-enables IRQs internally, so inline the same port loop here.
    ; Restore IRQs only if they were enabled on entry.
    ld a, e
    out (#99), a
    nop
    ld a, d
    or #40
    out (#99), a
    nop
.resource_copy_vram_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .resource_copy_vram_loop
    call mapper_pop_p3
    ld a, (interrupt_in_progress)
    or a
    jp nz, .resource_copy_vram_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .resource_copy_vram_irq_done
    ei

.resource_copy_vram_irq_done:
    or a
    ret

; ------------------------------------------------------------------
; resource_decompress_from_bank_to_vram
; Inputs:
;   A  = bank number
;   HL = ZX0 source visible in mapper data window
;   DE = destination in VRAM
;   BC = uncompressed size in bytes
; Outputs:
;   carry clear
; Clobbers:
;   AF, BC, DE, HL
; Notes:
;   Uses fast RAM staging when the uncompressed output fits the shared scratch
;   buffer. Larger resources fall back to direct-to-VRAM ZX0 decode.
; ------------------------------------------------------------------
resource_decompress_from_bank_to_vram:
    push af
    ld a, b
    or c
    jp nz, .resource_decompress_vram_has_size
    pop af
    or a
    ret
.resource_decompress_vram_has_size:
    ld a, b
    cp ZX0_VRAM_TRANSFER_BUFFER_LIMIT_HIGH
    jp c, .resource_decompress_vram_staged
    jp nz, .resource_decompress_vram_direct
    ld a, c
    cp ZX0_VRAM_TRANSFER_BUFFER_LIMIT_NEXT_LOW
    jp c, .resource_decompress_vram_staged
.resource_decompress_vram_direct:
    pop af
    di
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    call resource_dzx0_to_vram
    call mapper_pop_p3
    ld a, (interrupt_in_progress)
    or a
    jp nz, .resource_decompress_vram_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .resource_decompress_vram_irq_done
    ei

.resource_decompress_vram_irq_done:
    or a
    ret
.resource_decompress_vram_staged:
    pop af
    push de
    push bc
    ld de, ZX0_VRAM_TRANSFER_BUFFER
    call resource_decompress_from_bank_to_ram
    pop bc
    pop de
    ld hl, ZX0_VRAM_TRANSFER_BUFFER
    jp FAST_LDIRVM

; ------------------------------------------------------------------
; resource_dzx0_to_vram
; Inputs:
;   HL = ZX0 source visible in mapper data window
;   DE = destination in VRAM
; Outputs:
;   DE advanced past decompressed stream
; Clobbers:
;   AF, BC, DE, HL
; Notes:
;   Adapted from the standard ZX0 decoder structure. Literal bytes are read
;   from mapper-visible ROM and written to VRAM; match bytes are read from
;   already decompressed VRAM and written to the current VRAM destination.
;   IRQs and mapper bank lifetime are managed by the caller.
; ------------------------------------------------------------------
resource_dzx0_to_vram:
    ld bc, #FFFF
    push bc
    inc bc
    ld a, #80
.resource_dzx0_vram_literals:
    call .resource_dzx0_vram_elias
    push af
.resource_dzx0_vram_literal_loop:
    ld a, e
    out (#99), a
    nop
    ld a, d
    or #40
    out (#99), a
    nop
    ld a, (hl)
    out (#98), a
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jp nz, .resource_dzx0_vram_literal_loop
    pop af
    add a, a
    jp c, .resource_dzx0_vram_new_offset
    call .resource_dzx0_vram_elias
.resource_dzx0_vram_copy:
    ex (sp), hl
    push hl
    add hl, de
    push af
.resource_dzx0_vram_copy_loop:
    push bc
    ld a, l
    out (#99), a
    nop
    ld a, h
    and #3F
    out (#99), a
    nop
    nop
    in a, (#98)
    ld b, a
    ld a, e
    out (#99), a
    nop
    ld a, d
    or #40
    out (#99), a
    nop
    ld a, b
    out (#98), a
    pop bc
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jp nz, .resource_dzx0_vram_copy_loop
    pop af
    pop hl
    ex (sp), hl
    add a, a
    jp nc, .resource_dzx0_vram_literals
.resource_dzx0_vram_new_offset:
    pop bc
    ld c, #FE
    call .resource_dzx0_vram_elias_loop
    inc c
    ret z
    ld b, c
    ld c, (hl)
    inc hl
    rr b
    rr c
    push bc
    ld bc, 1
    call nc, .resource_dzx0_vram_elias_backtrack
    inc bc
    jp .resource_dzx0_vram_copy
.resource_dzx0_vram_elias:
    inc c
.resource_dzx0_vram_elias_loop:
    add a, a
    jp nz, .resource_dzx0_vram_elias_skip
    ld a, (hl)
    inc hl
    rla
.resource_dzx0_vram_elias_skip:
    ret c
.resource_dzx0_vram_elias_backtrack:
    add a, a
    rl c
    rl b
    jp .resource_dzx0_vram_elias_loop

; ------------------------------------------------------------------
; resource_load_to_ram_by_id
; Inputs:
;   A  = resource id
;   DE = destination in RAM
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_to_ram_by_id:
    push de
    call resource_find_by_id
    jp c, .resource_load_to_ram_fail
    push de
    pop hl
    pop de
    ld a, (resource_descriptor_flags)
    and RESOURCE_FLAG_COMPRESSED_ZX0
    jr z, .resource_load_to_ram_raw
    ld a, (resource_descriptor_bank)
    jp resource_decompress_from_bank_to_ram
.resource_load_to_ram_raw:
    ld a, (resource_descriptor_bank)
    jp resource_copy_from_bank_to_ram

.resource_load_to_ram_fail:
    pop de
    ret

; ------------------------------------------------------------------
; resource_load_to_vram_by_id
; Inputs:
;   A  = resource id
;   DE = destination in VRAM
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_to_vram_by_id:
    push de
    call resource_find_by_id
    jp c, .resource_load_to_vram_fail
    ld a, (resource_descriptor_flags)
    and RESOURCE_FLAG_COMPRESSED_ZX0
    jp nz, .resource_load_to_vram_compressed
    push de
    pop hl
    pop de
    ld a, (resource_descriptor_bank)
    jp resource_copy_from_bank_to_vram

.resource_load_to_vram_compressed:
    push de
    pop hl
    ld bc, (resource_descriptor_uncompressed_size)
    pop de
    ld a, (resource_descriptor_bank)
    jp resource_decompress_from_bank_to_vram

.resource_load_to_vram_fail:
    pop de
    ret

; ------------------------------------------------------------------
; resource_load_screen_layout_cached
; Inputs:
;   A = screen layout resource id
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Notes:
;   Loads the current screen layout directly into runtime_screen_layout.
;   No immutable background copy is kept when secret zones are not generated.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_screen_layout_cached:
    ld de, runtime_screen_layout
    call resource_load_to_ram_by_id
    ret

; ------------------------------------------------------------------
; resource_load_effects_layout_cached
; Inputs:
;   A = effects layout resource id
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Notes:
;   Keeps the immutable effects layer in runtime_effects_layout.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_effects_layout_cached:
    ld c, a
    ld a, (resource_ram_cache_effects_layout_id)
    cp c
    jr z, .resource_effects_cache_hit
    push bc
    ld a, c
    ld de, runtime_effects_layout
    call resource_load_to_ram_by_id
    pop bc
    ret c
    ld a, c
    ld (resource_ram_cache_effects_layout_id), a
.resource_effects_cache_hit:
    xor a
    ret

; ------------------------------------------------------------------
; resource_load_behavior_map_cached
; Inputs:
;   A = behavior map resource id
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Notes:
;   Reloads the mutable runtime_behavior_map directly from the banked
;   resource. This avoids a second resident 32x24 behavior-map copy in RAM.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_behavior_map_cached:
    ld de, runtime_behavior_map
    call resource_load_to_ram_by_id
    ret

; ------------------------------------------------------------------
; resource_load_effect_zone_table_cached
; Inputs:
;   A = effect zone table resource id
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Notes:
;   Keeps the current screen's immutable effect zone table resident in RAM.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_effect_zone_table_cached:
    ld c, a
    ld a, (resource_ram_cache_effect_zone_table_id)
    cp c
    jr z, .resource_effect_zone_cache_hit
    push bc
    ld a, c
    ld de, runtime_effect_zone_table
    call resource_load_to_ram_by_id
    pop bc
    ret c
    ld a, c
    ld (resource_ram_cache_effect_zone_table_id), a
.resource_effect_zone_cache_hit:
    xor a
    ret

; ------------------------------------------------------------------
; resource_read_byte_from_bank
; Inputs:
;   A  = bank number
;   HL = source visible in mapper data window
; Outputs:
;   A = byte read
; Clobbers:
;   AF, BC, HL
; Preserves:
;   DE
; ------------------------------------------------------------------
resource_read_byte_from_bank:
    ld b, a
    ld a, b
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    ld a, (hl)
    ld b, a
    call mapper_pop_p3
    ld a, b
    ret
; @mideas:endblock id=runtime.resources.manager

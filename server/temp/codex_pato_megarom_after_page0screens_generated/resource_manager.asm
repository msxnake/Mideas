; ==================================================================
; RESOURCE MANAGER
; File: resource_manager.asm
; Description: Centralized banked resource lookup and copy helpers
; Descriptor format: db bank / dw address / dw size
; Resource id is the zero-based descriptor index.
; ==================================================================

resource_manager_init:
    xor a
    ld (resource_descriptor_bank), a
    ld (resource_descriptor_addr), a
    ld (resource_descriptor_addr + 1), a
    ld (resource_descriptor_size), a
    ld (resource_descriptor_size + 1), a
    ld (vram_cache_tile_patterns_ready), a
    ld (vram_cache_tile_colors_ready), a
    ld (vram_cache_font_ready), a
    ld a, #FF
    ld (resource_descriptor_id), a
    ld (resource_ram_cache_screen_layout_id), a
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
    ld (resource_ram_cache_screen_layout_id), a
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
;   BC = size in bytes
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
    ld e, a
    ld d, 0
    add hl, de
    ld de, resource_table
    add hl, de
    ld a, c
    ld (resource_descriptor_id), a
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
    pop hl
    ld a, (resource_descriptor_bank)
    or a
    ret

.resource_find_not_found:
    xor a
    ld (resource_descriptor_bank), a
    ld (resource_descriptor_addr), a
    ld (resource_descriptor_addr + 1), a
    ld (resource_descriptor_size), a
    ld (resource_descriptor_size + 1), a
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
    ex af, af'
    ld a, i
    push af
    di
    ex af, af'
    push af
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
    ldir
    call mapper_pop_p2
    pop af
    jp po, .resource_copy_ram_irq_done
    ei
.resource_copy_ram_irq_done:
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
    ex af, af'
    ld a, i
    push af
    di
    ex af, af'
    push af
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
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
    call mapper_pop_p2
    pop af
    jp po, .resource_copy_vram_irq_done
    ei
.resource_copy_vram_irq_done:
    or a
    ret

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
    push de
    pop hl
    pop de
    jp resource_copy_from_bank_to_vram

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
;   Keeps the immutable layout in runtime_background_layout and rebuilds
;   runtime_screen_layout from that clean RAM copy on every screen load.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_screen_layout_cached:
    ld c, a
    ld a, (resource_ram_cache_screen_layout_id)
    cp c
    jr z, .resource_layout_cache_hit
    push bc
    ld a, c
    ld de, runtime_background_layout
    call resource_load_to_ram_by_id
    pop bc
    ret c
    ld a, c
    ld (resource_ram_cache_screen_layout_id), a
.resource_layout_cache_hit:
    ld hl, runtime_background_layout
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    xor a
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
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
    ld a, (hl)
    ld b, a
    call mapper_pop_p2
    ld a, b
    ret

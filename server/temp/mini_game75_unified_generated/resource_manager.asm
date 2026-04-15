; ==================================================================
; RESOURCE MANAGER
; File: resource_manager.asm
; Description: Centralized banked resource lookup and copy helpers
; Descriptor format: db id, type, group, bank / dw address / dw size
; ==================================================================

resource_manager_init:
    xor a
    ld (resource_descriptor_ptr), a
    ld (resource_descriptor_ptr + 1), a
    ld (resource_descriptor_type), a
    ld (resource_descriptor_group), a
    ld (resource_descriptor_bank), a
    ld (resource_descriptor_addr), a
    ld (resource_descriptor_addr + 1), a
    ld (resource_descriptor_size), a
    ld (resource_descriptor_size + 1), a
    ld a, #FF
    ld (resource_descriptor_id), a
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
    ld hl, resource_table
    ld b, RESOURCE_TABLE_COUNT
.resource_find_loop:
    ld a, b
    or a
    jp z, .resource_find_not_found
    ld a, (hl)
    cp c
    jp z, .resource_find_found
    ld de, RESOURCE_TABLE_ENTRY_SIZE
    add hl, de
    dec b
    jp .resource_find_loop

.resource_find_found:
    ld (resource_descriptor_ptr), hl
    push hl
    ld a, (hl)
    ld (resource_descriptor_id), a
    inc hl
    ld a, (hl)
    ld (resource_descriptor_type), a
    inc hl
    ld a, (hl)
    ld (resource_descriptor_group), a
    inc hl
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
    ld (resource_descriptor_ptr), a
    ld (resource_descriptor_ptr + 1), a
    ld (resource_descriptor_type), a
    ld (resource_descriptor_group), a
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
    ld a, b
    or c
    ret z
    push af
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
    ldir
    call mapper_pop_p2
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
    ld a, b
    or c
    ret z
    push af
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
    call FAST_LDIRVM
    call mapper_pop_p2
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

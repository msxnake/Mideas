; ==================================================================
; GENERATED RESOURCE TABLE
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; Address is the mapper-window address visible after selecting bank.
; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.
; ==================================================================
RESOURCE_TABLE_ENTRY_SIZE EQU 8
RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01
RESOURCE_TABLE_COUNT EQU 3

resource_table:
    ; SPRITE_PLACEHOLDER_PATTERN
    db 1
    dw #8605
    dw 5
    dw 32
    db 1
    ; tile_pattern_bank0
    db 1
    dw #8000
    dw 982
    dw 1008
    db 1
    ; tile_color_bank0
    db 1
    dw #83D6
    dw 559
    dw 1008
    db 1

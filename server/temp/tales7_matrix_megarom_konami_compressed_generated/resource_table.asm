; ==================================================================
; GENERATED RESOURCE TABLE
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; Address is the mapper-window address visible after selecting bank.
; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.
; ==================================================================
RESOURCE_TABLE_ENTRY_SIZE EQU 8
RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01
RESOURCE_TABLE_COUNT EQU 15

resource_table:
    ; NEW_SPRITE_0_F0_LAYER1
    db 15
    dw #A6D2
    dw 30
    dw 32
    db 1
    ; SPRITE_PLACEHOLDER_PATTERN
    db 15
    dw #A6F0
    dw 5
    dw 32
    db 1
    ; tile_pattern_bank0
    db 15
    dw #A01E
    dw 490
    dw 664
    db 1
    ; tilebank_pattern_data_0
    db 15
    dw #A371
    dw 482
    dw 640
    db 1
    ; tile_color_bank0
    db 15
    dw #A208
    dw 361
    dw 664
    db 1
    ; tilebank_color_data_0
    db 15
    dw #A553
    dw 350
    dw 640
    db 1
    ; SCREEN_PAN1_0_BLOCK_CATALOG
    db 15
    dw #A6B7
    dw 18
    dw 48
    db 1
    ; SCREEN_PAN1_0_BLOCK_MAP
    db 15
    dw #A6C9
    dw 9
    dw 48
    db 1
    ; SCREEN_PAN1_0_EFFECTS_LAYOUT
    db 15
    dw #A000
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN1_0_EFFECT_ZONE_TABLE
    db 15
    dw #A700
    dw 1
    dw 1
    db 0
    ; SCREEN_PAN1_0_BOSS_TABLE
    db 15
    dw #A6F5
    dw 11
    dw 11
    db 0
    ; SCREEN_PAN1_0_CHAR_BEHAVIOR_TABLE
    db 15
    dw #A6B1
    dw 6
    dw 256
    db 1
    ; SCREEN_PAN1_0_INTERACTION_TYPE_MAP
    db 15
    dw #A006
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN1_0_INTERACTION_VALUE_MAP
    db 15
    dw #A00C
    dw 12
    dw 768
    db 1
    ; SCREEN_PAN1_0_INTERACTION_TARGET_MAP
    db 15
    dw #A018
    dw 6
    dw 768
    db 1

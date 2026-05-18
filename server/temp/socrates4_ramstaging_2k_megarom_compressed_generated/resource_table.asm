; ==================================================================
; GENERATED RESOURCE TABLE
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; Address is the mapper-window address visible after selecting bank.
; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.
; ==================================================================
RESOURCE_TABLE_ENTRY_SIZE EQU 8
RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01
RESOURCE_TABLE_COUNT EQU 12

resource_table:
    ; NEW_SPRITE_0_F0_LAYER1
    db 15
    dw #A9F8
    dw 23
    dw 32
    db 1
    ; SPRITE_PLACEHOLDER_PATTERN
    db 15
    dw #AA0F
    dw 5
    dw 32
    db 1
    ; tile_pattern_bank0
    db 15
    dw #A000
    dw 1697
    dw 1880
    db 1
    ; tile_color_bank0
    db 15
    dw #A6A1
    dw 825
    dw 1880
    db 1
    ; SCREEN_PAN1_0_LAYOUT
    db 15
    dw #A9DA
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN1_0_EFFECTS_LAYOUT
    db 15
    dw #A9E0
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN1_0_EFFECT_ZONE_TABLE
    db 15
    dw #AA1F
    dw 1
    dw 1
    db 0
    ; SCREEN_PAN1_0_BOSS_TABLE
    db 15
    dw #AA14
    dw 11
    dw 11
    db 0
    ; BEHAVIOR_PAN1_0_DATA
    db 15
    dw #A9E6
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN1_0_INTERACTION_TYPE_MAP
    db 15
    dw #A9EC
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN1_0_INTERACTION_VALUE_MAP
    db 15
    dw #A9F2
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN1_0_INTERACTION_TARGET_MAP
    db 15
    dw #AA20
    dw 6
    dw 768
    db 1

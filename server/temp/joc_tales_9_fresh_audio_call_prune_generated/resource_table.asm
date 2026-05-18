; ==================================================================
; GENERATED RESOURCE TABLE
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; Address is the mapper-window address visible after selecting bank.
; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.
; ==================================================================
RESOURCE_TABLE_ENTRY_SIZE EQU 8
RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01
RESOURCE_TABLE_COUNT EQU 14

resource_table:
    ; NEW_SPRITE_0_F0_LAYER2
    db 3
    dw #BF70
    dw 32
    dw 32
    db 0
    ; SPRITE_PLACEHOLDER_PATTERN
    db 3
    dw #BF90
    dw 32
    dw 32
    db 0
    ; tile_pattern_bank0
    db 3
    dw #A880
    dw 1016
    dw 1016
    db 0
    ; tilebank_pattern_data_0
    db 3
    dw #A000
    dw 1088
    dw 1088
    db 0
    ; tile_color_bank0
    db 3
    dw #AC78
    dw 1016
    dw 1016
    db 0
    ; tilebank_color_data_0
    db 3
    dw #A440
    dw 1088
    dw 1088
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_LAYOUT
    db 3
    dw #B070
    dw 768
    dw 768
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_EFFECTS_LAYOUT
    db 3
    dw #B370
    dw 768
    dw 768
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_EFFECT_ZONE_TABLE
    db 3
    dw #BFBB
    dw 1
    dw 1
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_BOSS_TABLE
    db 3
    dw #BFB0
    dw 11
    dw 11
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_CHAR_BEHAVIOR_TABLE
    db 4
    dw #A000
    dw 256
    dw 256
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_TYPE_MAP
    db 3
    dw #B670
    dw 768
    dw 768
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_VALUE_MAP
    db 3
    dw #B970
    dw 768
    dw 768
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_TARGET_MAP
    db 3
    dw #BC70
    dw 768
    dw 768
    db 0

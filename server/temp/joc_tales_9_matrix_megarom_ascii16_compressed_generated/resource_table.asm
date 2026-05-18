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
    db 1
    dw #893D
    dw 25
    dw 32
    db 1
    ; SPRITE_PLACEHOLDER_PATTERN
    db 1
    dw #8956
    dw 5
    dw 32
    db 1
    ; tile_pattern_bank0
    db 1
    dw #84A4
    dw 843
    dw 1016
    db 1
    ; tilebank_pattern_data_0
    db 1
    dw #8000
    dw 885
    dw 1088
    db 1
    ; tile_color_bank0
    db 1
    dw #87EF
    dw 288
    dw 1016
    db 1
    ; tilebank_color_data_0
    db 1
    dw #8375
    dw 303
    dw 1088
    db 1
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_LAYOUT
    db 1
    dw #890F
    dw 9
    dw 768
    db 1
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_EFFECTS_LAYOUT
    db 1
    dw #8918
    dw 6
    dw 768
    db 1
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_EFFECT_ZONE_TABLE
    db 1
    dw #8966
    dw 1
    dw 1
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_BOSS_TABLE
    db 1
    dw #895B
    dw 11
    dw 11
    db 0
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_CHAR_BEHAVIOR_TABLE
    db 1
    dw #8933
    dw 10
    dw 256
    db 1
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_TYPE_MAP
    db 1
    dw #891E
    dw 6
    dw 768
    db 1
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_VALUE_MAP
    db 1
    dw #8924
    dw 9
    dw 768
    db 1
    ; SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_TARGET_MAP
    db 1
    dw #892D
    dw 6
    dw 768
    db 1

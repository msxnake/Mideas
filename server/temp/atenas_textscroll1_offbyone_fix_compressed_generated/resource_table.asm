; ==================================================================
; GENERATED RESOURCE TABLE
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; Address is the mapper-window address visible after selecting bank.
; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.
; ==================================================================
RESOURCE_TABLE_ENTRY_SIZE EQU 8
RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01
RESOURCE_TABLE_COUNT EQU 10

resource_table:
    ; NEW_SPRITE_0_F0_LAYER1
    db 3
    dw #A024
    dw 25
    dw 32
    db 1
    ; SPRITE_PLACEHOLDER_PATTERN
    db 3
    dw #A03D
    dw 5
    dw 32
    db 1
    ; SCREEN_PANTALLA1_0_LAYOUT
    db 3
    dw #A000
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_EFFECTS_LAYOUT
    db 3
    dw #A006
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE
    db 3
    dw #A042
    dw 1
    dw 1
    db 0
    ; SCREEN_PANTALLA1_0_BOSS_TABLE
    db 3
    dw #A043
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_PANTALLA1_0_DATA
    db 3
    dw #A00C
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP
    db 3
    dw #A012
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP
    db 3
    dw #A018
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP
    db 3
    dw #A01E
    dw 6
    dw 768
    db 1

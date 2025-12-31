;; Sprite: WhiteSprite
;; Total Frames: 1
;; Size: 16x16
;; Background Color (not exported as a layer): 0
;; Drawable Palette (Hex): C0=0, C1=15, C2=6, C3=9

SPRITE_WHITESPRITE_WIDTH     EQU 16
SPRITE_WHITESPRITE_HEIGHT    EQU 16
SPRITE_WHITESPRITE_FRAMES    EQU 1

;; ---- Sprite Frame: WhiteSprite_F0 ----
;; Size: 16x16
WHITESPRITE_F0_LAYER1: ; Brush Color Index 1 (Actual Color: 15)
    DB #01,#03,#07,#0F,#1F,#3F,#7F,#FF,#FF,#7F,#3F,#1F,#0F,#07,#03,#01
    DB #80,#C0,#E0,#F0,#F8,#FC,#FE,#FF,#FF,#FE,#FC,#F8,#F0,#E0,#C0,#80

;; ---- End of Frame: WhiteSprite_F0 ----


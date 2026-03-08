        org     #4000

        db      "AB"
        dw      Start
        dw      0
        dw      0
        dw      0
        dw      0
        dw      0
        dw      0

CLIKSW          equ     #F3DB

PT3_SETUP       equ     #D174
PT3_MODADDR     equ     #D175
PT3_CrPsPtr     equ     #D177
PT3_SAMPTRS     equ     #D179
PT3_OrnPtrs     equ     #D17B
PT3_PDSP        equ     #D17D
PT3_CSP         equ     #D17F
PT3_PSP         equ     #D181
PT3_PrNote      equ     #D183
PT3_PrSlide     equ     #D184
PT3_AdInPtA     equ     #D186
PT3_AdInPtB     equ     #D188
PT3_AdInPtC     equ     #D18A
PT3_LPosPtr     equ     #D18C
PT3_PatsPtr     equ     #D18E
PT3_Delay       equ     #D190
PT3_AddToEn     equ     #D191
PT3_Env_Del     equ     #D192
PT3_ESldAdd     equ     #D193
PT3_NTL3        equ     #D195
VARS            equ     #D197
ChanA           equ     #D197
ChanB           equ     #D1B4
ChanC           equ     #D1D1
DelyCnt         equ     #D1EE
CurESld         equ     #D1EF
CurEDel         equ     #D1F1
Ns_Base_AddToNs equ     #D1F2
Ns_Base         equ     #D1F2
AddToNs         equ     #D1F3
NT_             equ     #D1F4
AYREGS          equ     #D2B4
VT_             equ     #D2B4
EnvBase         equ     #D2C2
VAR0END         equ     #D2C4
T1_             equ     #D2C4
T_NEW_1         equ     #D2C4
T_OLD_1         equ     #D2C4
T_OLD_2         equ     #D2DC
T_NEW_3         equ     #D2F4
T_OLD_3         equ     #D2F4
T_OLD_0         equ     #D2F6
T_NEW_0         equ     #D2F6
T_NEW_2         equ     #D30E

Start:
        di
        im      1
        ld      sp,#F380
        xor     a
        ld      (CLIKSW),a

        push    ix
        push    iy
        call    PT3_MUTE
        ld      hl,MusicData-99
        call    PT3_INIT
        pop     iy
        pop     ix

        ld      a,(PT3_SETUP)
        or      1
        ld      (PT3_SETUP),a

        ei

MainLoop:
        halt
        push    ix
        push    iy
        di
        call    PT3_PLAY
        call    PT3_ROUT
        ei
        pop     iy
        pop     ix
        jr      MainLoop

        include "../PT3-ROM-alltables-glass.asm"

MusicData:
        incbin  "mideas_known_good.99"

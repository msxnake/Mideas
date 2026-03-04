    org #4000

    db "AB"
    dw Start
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

; ------------------------------------------------------------------
; PT3 work area mapped to RAM (example addresses for standalone build)
; ------------------------------------------------------------------
PT3_SETUP       EQU #C000
PT3_MODADDR     EQU #C001
PT3_CrPsPtr     EQU #C003
PT3_SAMPTRS     EQU #C005
PT3_OrnPtrs     EQU #C007
PT3_PDSP        EQU #C009
PT3_CSP         EQU #C00B
PT3_PSP         EQU #C00D
PT3_PrNote      EQU #C00F
PT3_PrSlide     EQU #C010
PT3_AdInPtA     EQU #C012
PT3_AdInPtB     EQU #C014
PT3_AdInPtC     EQU #C016
PT3_LPosPtr     EQU #C018
PT3_PatsPtr     EQU #C01A
PT3_Delay       EQU #C01C
PT3_AddToEn     EQU #C01D
PT3_Env_Del     EQU #C01E
PT3_ESldAdd     EQU #C01F

VARS            EQU #C021
ChanA           EQU #C021
ChanB           EQU #C03E
ChanC           EQU #C05B
DelyCnt         EQU #C078
CurESld         EQU #C079
CurEDel         EQU #C07B
Ns_Base_AddToNs EQU #C07C
Ns_Base         EQU #C07C
AddToNs         EQU #C07D
AYREGS          EQU #C07E
VT_             EQU #C07E
EnvBase         EQU #C08C
VAR0END         EQU #C08E

Start:
    ret

    include "PT3-ROM-glass-auto.asm"

;-----------------------------------------------
; BIOS calls:
SYNCHR: equ #0008
RDSLT:  equ #000c
CHRGTR: equ #0010
WRSLT:  equ #0014
OUTDO:  equ #0018
CALSLT: equ #001c
DCOMPR: equ #0020
ENASLT: equ #0024
GETYPR: equ #0028
CALLF:  equ #0030
KEYINT: equ #0038
INITIO: equ #003b
INIFNK: equ #003e
DISSCR: equ #0041
ENASCR: equ #0044
WRTVDP: equ #0047
RDVRM:  equ #004a
WRTVRM: equ #004d
SETRD:  equ #0050
SETWRT: equ #0053
FILVRM: equ #0056
LDIRMV: equ #0059
LDIRVM: equ #005c
CHGMOD: equ #005f
CHGCLR: equ #0062
NMI:    equ #0066
CLRSPR: equ #0069
INITXT: equ #006c
INIT32: equ #006f
INIGRP: equ #0072
INIMLT: equ #0075
SETTXT: equ #0078
SETT32: equ #007b
SETGRP: equ #007e
SETMLT: equ #0081
CALPAT: equ #0084
CALATR: equ #0087
GSPSIZ: equ #008a
GRPPRT: equ #008d
GICINI: equ #0090
WRTPSG: equ #0093
RDPSG:  equ #0096
STRTMS: equ #0099
CHSNS:  equ #009c
CHGET:  equ #009f
CHPUT:  equ #00a2
LPTOUT: equ #00a5
LPTSTT: equ #00a8
CNVCHR: equ #00ab
PINLIN: equ #00ae
INLIN:  equ #00b1
QINLIN: equ #00b4
BREAKX: equ #00b7
ISCNTC: equ #00ba
CKCNTC: equ #00bd
BEEP:   equ #00c0
CLS:    equ #00c3
POSIT:  equ #00c6
FNKSB:  equ #00c9                
ERAFNK: equ #00cc
DSPFNK: equ #00cf
TOTEXT: equ #00d2
GTSTCK: equ #00d5
GTTRIG: equ #00d8
GTPAD:  equ #00db
GTPDL:  equ #00de
TAPION: equ #00e1
TAPIN:  equ #00e4
TAPIOF: equ #00e7
TAPOON: equ #00ea
TAPOUT: equ #00ed
TAPOOF: equ #00f0
STMOTR: equ #00f3
LFTQ:   equ #00f6
PUTQ:   equ #00f9
RIGHTC: equ #00fc
LEFTC:  equ #00ff
UPC:    equ #0102
TUPC:   equ #0105
DOWNC:  equ #0108
TDOWNC: equ #010b
SCALXY: equ #010e
MAPXY:  equ #0111
FETCHC: equ #0114
STOREC: equ #0117
SETATR: equ #011a
READC:  equ #011d
SETC:   equ #0120
NSETCX: equ #0123
GTASPC: equ #0126
PNTINI: equ #0129
SCANR:  equ #012c
SCANL:  equ #012f
CHGCAP: equ #0132
CHGSND: equ #0135
RSLREG: equ #0138
WSLREG: equ #013b
RDVDP:  equ #013e
SNSMAT: equ #0141
PHYDIO: equ #0144
FORMAT: equ #0147
ISFLIO: equ #014a
OUTDLP: equ #014d
GETVCP: equ #0150
GETVC2: equ #0153
KILBUF: equ #0156
CALBAS: equ #0159
SUBROM: equ #015c
EXTROM: equ #015f
CHKSLZ: equ #0162
CHKNEW: equ #0165
EOL:    equ #0168
BIGFIL: equ #016b
NSETRD: equ #016e
NSTWRT: equ #0171
NRDVRM: equ #0174
NWRVRM: equ #0177
RDRES:  equ #017a
WRRES:  equ #017d
CHGCPU: equ #0180
GETCPU: equ #0183
PCMPLY: equ #0186
PCMREC: equ #0189


;-----------------------------------------------
; System variables
VDP.DR:	equ #0006
VDP.DW:	equ #0007
VDP_REGISTER_0: equ #f3df
VDP_REGISTER_1: equ #f3e0
CLIKSW: equ #f3db       ; keyboard sound
FORCLR: equ #f3e9
BAKCLR: equ #f3ea
BDRCLR: equ #f3eb
SCNCNT: equ #f3f6
PUTPNT: equ #f3f8
GETPNT: equ #f3fa
MODE:   equ #fafc	
KEYS:   equ #fbe5    
KEYBUF: equ #fbf0
EXPTBL: equ #fcc1
TIMI:   equ #fd9f       ; timer interrupt hook
HKEY:   equ #fd9a       ; hkey interrupt hook


;-----------------------------------------------
; Assembler opcodes:	
JP_OPCODE: 			equ  #c3
RET_OPCODE:        	equ  #c9

;-----------------------------------------------
; VRAM map in Screen 1 (only 1 table of patterns, color table has 1 byte per each 8 patterns)
CHRTBL1:  equ     #0000   ; pattern table address
NAMTBL1:  equ     #1800   ; name table address 
CLRTBL1:  equ     #2000   ; color table address             
SPRTBL1:  equ     #0800   ; sprite pattern address  
SPRATR1:  equ     #1b00   ; sprite attribute address
; VRAM map in Screen 2 (3 tables of patterns, color table has 8 bytes per pattern)
CHRTBL2:  equ     #0000   ; pattern table address
NAMTBL2:  equ     #1800   ; name table address 
CLRTBL2:  equ     #2000   ; color table address             
SPRTBL2:  equ     #3800   ; sprite pattern address  
SPRATR2:  equ     #1b00   ; sprite attribute address

; VRAM map in Screen 4 (patterns like Screen 2, but sprites specify one color per line)
CHRTBL4:  equ     #0000   ; pattern table address
NAMTBL4:  equ     #1800   ; name table address 
CLRTBL4:  equ     #2000   ; color table address             
SPRTBL4:  equ     #3800   ; sprite pattern address  
SPRATR4:  equ     #1e00   ; sprite attribute address
SPRCLR4:  equ     #1c00   ; sprite attribute address

;-----------------------------------------------
; MSX1 colors:
COLOR_TRANSPARENT:	equ 0
COLOR_BLACK:		equ 1
COLOR_GREEN:		equ 2
COLOR_LIGHT_GREEN:	equ 3
COLOR_DARK_BLUE:	equ 4
COLOR_BLUE:			equ 5
COLOR_DARK_RED:		equ 6
COLOR_LIGHT_BLUE:	equ 7
COLOR_RED:			equ 8
COLOR_LIGHT_RED:	equ 9
COLOR_DARK_YELLOW:	equ 10
COLOR_YELLOW:		equ 11
COLOR_DARK_GREEN:	equ 12
COLOR_PURPLE:		equ 13
COLOR_GREY:			equ 14
COLOR_WHITE:		equ 15

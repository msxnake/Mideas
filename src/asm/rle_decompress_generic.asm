; Generic RLE Decompressor from Chibi Akumas
; Source: https://www.chibiakumas.com/z80/multiplatform2.php
;
; Parameters:
;   HL: source address (compressed data)
;   DE: destination address (decompressing)
;
; Format:
;   Header byte:
;     0: End of data.
;     Top bit 1: RLE compressed data. The other 7 bits are the count (1-127). The next byte is the value to repeat.
;     Top bit 0: Linear uncompressed data. The other 7 bits are the count (1-127). The next `count` bytes are copied literally.

RLEDECOMPRESS:
 LD A,(HL)
 INC HL
 AND A
 RET Z
 JP M,RLEDECOMPRESS_RLE
RLEDECOMPRESS_LINEAR:
 LD C,A
 LD B,0
 LDIR
 JP RLEDECOMPRESS
RLEDECOMPRESS_RLE:
 AND %01111111
 LD C,A
 LD A,(HL)
 INC HL
RLEDECOMPRESS_RLENEXT:
 LD (DE),A
 INC DE
 DEC C
 JP NZ,RLEDECOMPRESS_RLENEXT
 JP RLEDECOMPRESS

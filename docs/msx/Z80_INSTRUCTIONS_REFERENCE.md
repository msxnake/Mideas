# Z80 Instructions Reference for MSX (glass.jar)

Este documento lista las instrucciones Z80 **permitidas** para evitar errores de compilación.

## ERRORES COMUNES A EVITAR

| Instrucción INCORRECTA | Por qué falla | Alternativa CORRECTA |
|------------------------|---------------|----------------------|
| `ld hl,de` | No existe LD entre registros de 16 bits | `push de` / `pop hl` |
| `ld bc,hl` | No existe LD entre registros de 16 bits | `ld b,h` / `ld c,l` |
| `ld de,hl` | No existe LD entre registros de 16 bits | `ld d,h` / `ld e,l` |
| `ld hl,bc` | No existe LD entre registros de 16 bits | `ld h,b` / `ld l,c` |
| `ld sp,de` | SP solo puede cargarse desde HL | `ex de,hl` / `ld sp,hl` |
| `add hl,a` | ADD HL solo acepta BC,DE,HL,SP | Usar `ld e,a` / `ld d,0` / `add hl,de` |
| `sub hl,de` | SUB no existe para 16 bits | Usar `sbc hl,de` (con carry=0) |
| `ld (nn),a` | Correcto, pero... | `ld (nn),a` es válido |
| `ld (nn),bc` | Solo HL,DE,BC,SP pueden guardarse | `ld (nn),bc` ES válido |
| `inc (hl)` | Válido | `inc (hl)` ES correcto |
| `ld a,(de)` | Válido | `ld a,(de)` ES correcto |
| `ld a,(bc)` | Válido | `ld a,(bc)` ES correcto |

---

## LD - Load Instructions

### LD r,r' (8-bit register to register)
```
     | B | C | D | E | H | L | (HL) | A |
-----|---|---|---|---|---|---|------|---|
B    | x | x | x | x | x | x |  x   | x |
C    | x | x | x | x | x | x |  x   | x |
D    | x | x | x | x | x | x |  x   | x |
E    | x | x | x | x | x | x |  x   | x |
H    | x | x | x | x | x | x |  x   | x |
L    | x | x | x | x | x | x |  x   | x |
(HL) | x | x | x | x | x | x |  -   | x |
A    | x | x | x | x | x | x |  x   | x |

x = permitido, - = no permitido
```

### LD r,n (8-bit immediate)
```asm
ld a,n      ; OK
ld b,n      ; OK
ld c,n      ; OK
ld d,n      ; OK
ld e,n      ; OK
ld h,n      ; OK
ld l,n      ; OK
ld (hl),n   ; OK
```

### LD rr,nn (16-bit immediate)
```asm
ld bc,nn    ; OK
ld de,nn    ; OK
ld hl,nn    ; OK
ld sp,nn    ; OK
ld ix,nn    ; OK
ld iy,nn    ; OK
```

### LD rr,rr' (16-bit register to register)
```
SOLO ESTAS COMBINACIONES SON VÁLIDAS:

ld sp,hl    ; OK - única transferencia 16-bit directa
ld sp,ix    ; OK
ld sp,iy    ; OK

TODAS LAS DEMÁS REQUIEREN ALTERNATIVAS:

; Para ld hl,de usar:
push de
pop hl

; Para ld de,hl usar:
ld d,h
ld e,l

; Para ld bc,hl usar:
ld b,h
ld c,l

; Para ld hl,bc usar:
ld h,b
ld l,c
```

### LD con memoria indirecta
```asm
; A con (BC) o (DE)
ld a,(bc)   ; OK
ld a,(de)   ; OK
ld (bc),a   ; OK
ld (de),a   ; OK

; Cualquier registro con (HL)
ld r,(hl)   ; OK (r = a,b,c,d,e,h,l)
ld (hl),r   ; OK

; A con dirección absoluta
ld a,(nn)   ; OK
ld (nn),a   ; OK

; Registros 16-bit con dirección absoluta
ld hl,(nn)  ; OK
ld (nn),hl  ; OK
ld bc,(nn)  ; OK (ED prefix)
ld (nn),bc  ; OK (ED prefix)
ld de,(nn)  ; OK (ED prefix)
ld (nn),de  ; OK (ED prefix)
ld sp,(nn)  ; OK (ED prefix)
ld (nn),sp  ; OK (ED prefix)
```

---

## Arithmetic Instructions

### ADD (8-bit)
```asm
add a,r     ; OK (r = a,b,c,d,e,h,l)
add a,(hl)  ; OK
add a,n     ; OK
```

### ADD (16-bit)
```asm
add hl,bc   ; OK
add hl,de   ; OK
add hl,hl   ; OK
add hl,sp   ; OK

add ix,bc   ; OK
add ix,de   ; OK
add ix,ix   ; OK
add ix,sp   ; OK

; NO EXISTE: add hl,a (usar extensión a 16-bit)
```

### ADC (8-bit con carry)
```asm
adc a,r     ; OK
adc a,(hl)  ; OK
adc a,n     ; OK
```

### ADC (16-bit con carry)
```asm
adc hl,bc   ; OK
adc hl,de   ; OK
adc hl,hl   ; OK
adc hl,sp   ; OK
```

### SUB (solo 8-bit)
```asm
sub r       ; OK (implícito: sub a,r)
sub (hl)    ; OK
sub n       ; OK

; NO EXISTE: sub hl,de
```

### SBC (8-bit y 16-bit con carry)
```asm
; 8-bit
sbc a,r     ; OK
sbc a,(hl)  ; OK
sbc a,n     ; OK

; 16-bit (única resta 16-bit disponible)
sbc hl,bc   ; OK
sbc hl,de   ; OK
sbc hl,hl   ; OK
sbc hl,sp   ; OK

; Para restar sin carry, primero limpiar:
or a        ; Clear carry
sbc hl,de   ; Ahora resta sin carry
```

### INC / DEC
```asm
; 8-bit
inc r       ; OK (r = a,b,c,d,e,h,l)
inc (hl)    ; OK
dec r       ; OK
dec (hl)    ; OK

; 16-bit
inc bc      ; OK
inc de      ; OK
inc hl      ; OK
inc sp      ; OK
inc ix      ; OK
inc iy      ; OK
dec bc      ; OK
dec de      ; OK
dec hl      ; OK
dec sp      ; OK
```

---

## Logic Instructions

### AND, OR, XOR, CP
```asm
and r       ; OK
and (hl)    ; OK
and n       ; OK

or r        ; OK
or (hl)     ; OK
or n        ; OK

xor r       ; OK
xor (hl)    ; OK
xor n       ; OK

cp r        ; OK
cp (hl)     ; OK
cp n        ; OK
```

---

## Rotate and Shift

```asm
; Acumulador (rápidas, 1 byte)
rlca        ; Rotate left circular A
rrca        ; Rotate right circular A
rla         ; Rotate left through carry A
rra         ; Rotate right through carry A

; Cualquier registro (2 bytes, CB prefix)
rlc r       ; OK
rrc r       ; OK
rl r        ; OK
rr r        ; OK
sla r       ; OK (shift left arithmetic)
sra r       ; OK (shift right arithmetic, mantiene signo)
srl r       ; OK (shift right logical)

; También con (HL)
rlc (hl)    ; OK
sla (hl)    ; OK
; etc.
```

---

## Bit Instructions

```asm
bit n,r     ; Test bit n (0-7) of register r
bit n,(hl)  ; Test bit n of (HL)

set n,r     ; Set bit n of register r
set n,(hl)  ; Set bit n of (HL)

res n,r     ; Reset bit n of register r
res n,(hl)  ; Reset bit n of (HL)
```

---

## Jump Instructions

### JP vs JR - MUY IMPORTANTE

| Instrucción | Bytes | Rango | Uso |
|-------------|-------|-------|-----|
| `jp label` | 3 | Cualquier dirección | **PREFERIR SIEMPRE** |
| `jr label` | 2 | -128 a +127 bytes | Solo loops muy cortos |

**ERROR COMÚN**: Usar `jr` cuando el código crece y supera ±127 bytes.
```
; ESTO FALLA si el código entre jr y .label es > 127 bytes:
    jr z,.label
    ; ... mucho código ...
.label:

; SOLUCIÓN: Usar jp
    jp z,.label
    ; ... mucho código ...
.label:
```

**REGLA PRÁCTICA**: En caso de duda, usar `jp`. El byte extra no importa comparado con errores de compilación.

### Instrucciones de salto
```asm
jp nn       ; Jump absolute
jp cc,nn    ; Jump conditional (cc = z,nz,c,nc,pe,po,p,m)
jp (hl)     ; Jump to address in HL
jp (ix)     ; Jump to address in IX
jp (iy)     ; Jump to address in IY

jr e        ; Jump relative (-128 to +127) ⚠️ CUIDADO CON EL RANGO
jr c,e      ; Jump relative if carry
jr nc,e     ; Jump relative if no carry
jr z,e      ; Jump relative if zero
jr nz,e     ; Jump relative if not zero

djnz e      ; Decrement B, jump relative if not zero ⚠️ TAMBIÉN LIMITADO
```

---

## Call and Return

```asm
call nn     ; Call subroutine
call cc,nn  ; Call conditional

ret         ; Return
ret cc      ; Return conditional

rst n       ; Restart (n = 0,8,16,24,32,40,48,56)
```

---

## Stack Operations

```asm
push af     ; OK
push bc     ; OK
push de     ; OK
push hl     ; OK
push ix     ; OK
push iy     ; OK

pop af      ; OK
pop bc      ; OK
pop de      ; OK
pop hl      ; OK
pop ix      ; OK
pop iy      ; OK
```

---

## Exchange Instructions

```asm
ex de,hl    ; Exchange DE and HL
ex af,af'   ; Exchange AF with alternate
ex (sp),hl  ; Exchange (SP) with HL
ex (sp),ix  ; Exchange (SP) with IX
ex (sp),iy  ; Exchange (SP) with IY
exx         ; Exchange BC,DE,HL with alternates
```

---

## Block Transfer (muy útiles para MSX)

```asm
ldi         ; Load and increment (HL)->DE, inc HL,DE, dec BC
ldir        ; LDI repeat until BC=0
ldd         ; Load and decrement
lddr        ; LDD repeat until BC=0

cpi         ; Compare and increment
cpir        ; CPI repeat until BC=0 or match
cpd         ; Compare and decrement
cpdr        ; CPD repeat until BC=0 or match
```

---

## Input/Output

```asm
in a,(n)    ; Input from port n
in r,(c)    ; Input from port C to register
out (n),a   ; Output A to port n
out (c),r   ; Output register to port C

ini         ; Input and increment
inir        ; INI repeat
ind         ; Input and decrement
indr        ; IND repeat

outi        ; Output and increment
otir        ; OUTI repeat
outd        ; Output and decrement
otdr        ; OUTD repeat
```

---

## Misc Instructions

```asm
nop         ; No operation
halt        ; Halt CPU until interrupt
di          ; Disable interrupts
ei          ; Enable interrupts
im 0        ; Interrupt mode 0
im 1        ; Interrupt mode 1
im 2        ; Interrupt mode 2

scf         ; Set carry flag
ccf         ; Complement carry flag
cpl         ; Complement A (invert bits)
neg         ; Negate A (two's complement)
daa         ; Decimal adjust A
```

---

## Patrones Comunes para MSX

### Copiar HL a DE
```asm
; Método 1: byte a byte (4 bytes, 8 cycles)
ld d,h
ld e,l

; Método 2: push/pop (3 bytes, 21 cycles)
push hl
pop de
```

### Sumar A a HL
```asm
; A es unsigned
ld e,a
ld d,0
add hl,de

; A es signed (preservar signo)
ld e,a
ld d,0
bit 7,a         ; Check sign
jr z,.positive
dec d           ; D = #FF if negative
.positive:
add hl,de
```

### Restar DE de HL
```asm
or a            ; Clear carry
sbc hl,de
```

### Multiplicar por constantes
```asm
; x2
add hl,hl

; x4
add hl,hl
add hl,hl

; x3
ld d,h
ld e,l
add hl,hl
add hl,de

; x5
ld d,h
ld e,l
add hl,hl
add hl,hl
add hl,de
```

### Comparar HL con DE
```asm
or a
sbc hl,de       ; HL = HL - DE, flags set
add hl,de       ; Restore HL
; Zero flag: HL == DE
; Carry flag: HL < DE
```

---

## Quick Reference Card

### Registros disponibles
- **8-bit**: A, B, C, D, E, H, L
- **16-bit**: AF, BC, DE, HL, SP, IX, IY
- **Alternates**: AF', BC', DE', HL'

### Flags (F register)
- **S** - Sign (bit 7 del resultado)
- **Z** - Zero (resultado = 0)
- **H** - Half-carry (carry del bit 3)
- **P/V** - Parity/Overflow
- **N** - Add/Subtract
- **C** - Carry

### Condiciones para saltos
- `z` - Zero
- `nz` - Not zero
- `c` - Carry
- `nc` - No carry
- `pe` - Parity even / Overflow
- `po` - Parity odd / No overflow
- `p` - Positive (sign = 0)
- `m` - Minus (sign = 1)

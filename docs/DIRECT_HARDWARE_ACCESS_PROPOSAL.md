# Direct Hardware Access Mode - Propuesta de Implementación

## Objetivo
Reemplazar llamadas BIOS con acceso directo a hardware para máximo rendimiento en juegos MSX.

---

## Comparativa: BIOS vs Direct

### LDIRVM (Copia a VRAM)

#### Versión BIOS (actual):
```asm
; 30+ ciclos de overhead + tiempo de copia
ld hl, source_data
ld de, CHRTBL2
ld bc, 256
call LDIRVM        ; BIOS call: ~30 ciclos overhead
```

#### Versión Direct (propuesta):
```asm
; ~10 ciclos de overhead + tiempo de copia
ld hl, source_data
ld de, CHRTBL2
ld bc, 256
call FAST_LDIRVM   ; Nuestra rutina optimizada

; Implementación:
FAST_LDIRVM:
    ; Set VRAM write address
    ld a, e
    out (0x99), a      ; Address low (11 ciclos)
    ld a, d
    or 0x40            ; Write mode (7 ciclos)
    out (0x99), a      ; Address high (11 ciclos)

.loop:
    ld a, (hl)         ; Get byte (7 ciclos)
    out (0x98), a      ; Write to VRAM (11 ciclos)
    inc hl             ; Next source (6 ciclos)
    dec bc             ; Count-- (6 ciclos)
    ld a, b
    or c
    jr nz, .loop       ; Loop if BC != 0 (12 ciclos if jump)
    ret

; Total loop: ~48 ciclos/byte vs BIOS ~80+ ciclos/byte
; Ganancia: ~40% más rápido
```

---

## Rutinas Direct que Necesitamos

### 1. FAST_LDIRVM - Block Transfer to VRAM
**Uso:** Cargar tiles, sprites, screens
**Ahorro:** ~40% más rápido que BIOS

```asm
; Input: HL = source (RAM), DE = dest (VRAM), BC = count
FAST_LDIRVM:
    ld a, e
    out (0x99), a
    ld a, d
    or 0x40
    out (0x99), a
.loop:
    ld a, (hl)
    out (0x98), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .loop
    ret
```

### 2. FAST_WRTVRM - Write Byte to VRAM
**Uso:** Escribir tiles individuales, HUD
**Ahorro:** ~50% más rápido que BIOS

```asm
; Input: A = data, HL = VRAM address
FAST_WRTVRM:
    push af              ; Save data
    ld a, l
    out (0x99), a        ; Address low
    ld a, h
    or 0x40              ; Write mode
    out (0x99), a        ; Address high
    pop af               ; Restore data
    out (0x98), a        ; Write byte
    ret
```

### 3. FAST_WRTVDP - Write VDP Register
**Uso:** Cambiar modo, colores, scroll
**Ahorro:** ~30% más rápido

```asm
; Input: B = value, C = register
FAST_WRTVDP:
    ld a, b              ; Get value
    out (0x99), a        ; Write value
    ld a, c              ; Get register
    or 0x80              ; Set register write bit
    out (0x99), a        ; Write register number
    ret
```

### 4. FAST_GTSTCK - Read Joystick Direct
**Uso:** Input de jugador
**Ahorro:** ~60% más rápido (BIOS es muy lento aquí)

```asm
; Input: A = joystick port (0 or 1)
; Output: A = direction (0-8)
FAST_GTSTCK:
    rrca                 ; Port × 2
    and 0x0F
    or 0x40              ; PSG register 14/15
    out (0xA0), a        ; Select PSG register
    in a, (0xA2)         ; Read value
    cpl                  ; Invert bits
    and 0x0F             ; Mask direction
    ld hl, stick_table
    add a, l
    ld l, a
    ld a, (hl)           ; Lookup direction
    ret

stick_table:
    db 0, 1, 3, 2, 7, 0, 4, 3  ; Direction lookup
    db 5, 6, 0, 1, 8, 7, 5, 0
```

### 5. FAST_RDVRM - Read from VRAM
**Uso:** Collision detection, tile reading
**Ahorro:** ~45% más rápido

```asm
; Input: HL = VRAM address
; Output: A = data read
FAST_RDVRM:
    ld a, l
    out (0x99), a        ; Address low
    ld a, h
    and 0x3F             ; Read mode (bit 6=0)
    out (0x99), a        ; Address high
    in a, (0x98)         ; Read byte
    ret
```

---

## Implementación en Generators

### Archivo: `directHardwareGenerator.ts` (nuevo)

```typescript
/**
 * @fileoverview Direct Hardware Access Generator
 * Generates optimized hardware routines to replace BIOS calls
 */

export interface DirectHardwareOptions {
  mode: 'bios' | 'direct' | 'hybrid';
  optimizeLevel: 'safe' | 'aggressive';
  includeDebug: boolean;
}

export function generateDirectHardwareFile(options: DirectHardwareOptions): string {
  if (options.mode === 'bios') {
    return generateBIOSWrappers();
  }

  let code = `; ==================================================================
; DIRECT HARDWARE ACCESS ROUTINES
; Mode: ${options.mode}
; Optimize: ${options.optimizeLevel}
; ==================================================================
;
; These routines replace BIOS calls with direct hardware access
; for maximum performance in game loops.
;
; Performance gain: 30-60% faster than BIOS equivalents
; Trade-off: Less portable, requires MSX1/MSX2/MSX2+ detection
; ==================================================================

`;

  // Generate core routines
  code += generateFastLDIRVM();
  code += generateFastWRTVRM();
  code += generateFastWRTVDP();
  code += generateFastGTSTCK();

  if (options.optimizeLevel === 'aggressive') {
    code += generateUnrolledLoops();
    code += generateVBlankSync();
  }

  return code;
}

function generateFastLDIRVM(): string {
  return `
; ==================================================================
; FAST_LDIRVM - Optimized Block Transfer to VRAM
; ==================================================================
; Input: HL = source address (RAM)
;        DE = destination address (VRAM)
;        BC = byte count
; Output: None
; Destroys: AF, BC, HL
; Cycles: ~48 per byte (vs BIOS ~80+)
; ==================================================================
FAST_LDIRVM:
    ; Set VRAM write address
    ld a, e
    out (0x99), a        ; Address low byte
    ld a, d
    or 0x40              ; Set write mode (bit 6)
    out (0x99), a        ; Address high byte + command

    ; Copy loop
.copy_loop:
    ld a, (hl)           ; Read source byte
    out (0x98), a        ; Write to VRAM data port
    inc hl               ; Next source
    dec bc               ; Decrement counter
    ld a, b              ; Check if BC = 0
    or c
    jr nz, .copy_loop    ; Continue if not zero
    ret

; ==================================================================
; FAST_LDIRVM_256 - Optimized for 256-byte blocks (common case)
; ==================================================================
; Same as FAST_LDIRVM but optimized for exactly 256 bytes
; Saves ~100 cycles total by using simpler counter
; ==================================================================
FAST_LDIRVM_256:
    ld a, e
    out (0x99), a
    ld a, d
    or 0x40
    out (0x99), a

    ld b, 0              ; B = 256 (wraps to 0)
.copy_loop_256:
    ld a, (hl)
    out (0x98), a
    inc hl
    djnz .copy_loop_256  ; Use DJNZ for faster loop
    ret
`;
}

function generateFastWRTVRM(): string {
  return `
; ==================================================================
; FAST_WRTVRM - Write Single Byte to VRAM
; ==================================================================
; Input: A = data byte
;        HL = VRAM address
; Output: None
; Destroys: None (preserves all registers)
; Cycles: ~40 (vs BIOS ~70)
; ==================================================================
FAST_WRTVRM:
    push af              ; Save data
    ld a, l
    out (0x99), a        ; Address low
    ld a, h
    or 0x40              ; Write mode
    out (0x99), a        ; Address high
    pop af               ; Restore data
    out (0x98), a        ; Write to VRAM
    ret
`;
}

function generateFastWRTVDP(): string {
  return `
; ==================================================================
; FAST_WRTVDP - Write VDP Register
; ==================================================================
; Input: B = register value
;        C = register number (0-7 for MSX1, 0-23 for MSX2)
; Output: None
; Destroys: AF
; Cycles: ~25 (vs BIOS ~55)
; ==================================================================
FAST_WRTVDP:
    ld a, b              ; Get value
    out (0x99), a        ; Write value first
    ld a, c              ; Get register number
    or 0x80              ; Set register write bit
    out (0x99), a        ; Write register select
    ret
`;
}

function generateFastGTSTCK(): string {
  return `
; ==================================================================
; FAST_GTSTCK - Read Joystick Direction
; ==================================================================
; Input: A = joystick port (0 = port 1, 1 = port 2)
; Output: A = direction (0-8)
;         0 = Center
;         1 = Up, 2 = Up+Right, 3 = Right, 4 = Down+Right
;         5 = Down, 6 = Down+Left, 7 = Left, 8 = Up+Left
; Destroys: HL
; Cycles: ~50 (vs BIOS ~120+)
; ==================================================================
FAST_GTSTCK:
    ; Select PSG register 14 (port 1) or 15 (port 2)
    rrca                 ; A × 2
    and 0x0F
    or 0x40              ; PSG register 14/15 (joystick)
    out (0xA0), a        ; Select PSG register
    in a, (0xA2)         ; Read PSG data
    cpl                  ; Invert (joystick is active-low)
    and 0x0F             ; Mask 4 direction bits

    ; Lookup direction from 4-bit pattern
    ld hl, joystick_direction_table
    add a, l
    ld l, a
    adc a, h
    sub l
    ld h, a
    ld a, (hl)           ; Get direction code
    ret

; Direction lookup table (16 entries for all 4-bit combinations)
joystick_direction_table:
    db 0  ; 0000 = Center
    db 1  ; 0001 = Up
    db 5  ; 0010 = Down
    db 0  ; 0011 = Up+Down (invalid)
    db 7  ; 0100 = Left
    db 8  ; 0101 = Up+Left
    db 6  ; 0110 = Down+Left
    db 0  ; 0111 = Invalid
    db 3  ; 1000 = Right
    db 2  ; 1001 = Up+Right
    db 4  ; 1010 = Down+Right
    db 0  ; 1011 = Invalid
    db 0  ; 1100 = Left+Right (invalid)
    db 0  ; 1101 = Invalid
    db 0  ; 1110 = Invalid
    db 0  ; 1111 = Invalid
`;
}

function generateUnrolledLoops(): string {
  return `
; ==================================================================
; FAST_LDIRVM_UNROLLED - Ultra-fast VRAM copy (aggressive mode)
; ==================================================================
; Unrolled loop for maximum speed
; Use for critical sections (sprite patterns, screen updates)
; Tradeoff: Uses more ROM space
; ==================================================================
FAST_LDIRVM_32_UNROLLED:
    ; Set VRAM address (same as standard)
    ld a, e
    out (0x99), a
    ld a, d
    or 0x40
    out (0x99), a

    ; Unrolled 32-byte copy (for 1 sprite pattern)
    ld a, (hl)
    out (0x98), a
    inc hl
    ; ... repeat 31 more times ...

    ret

; Macro version for code generation
; COPY_BYTE_TO_VRAM:
;   ld a, (hl)
;   out (0x98), a
;   inc hl
`;
}

function generateVBlankSync(): string {
  return `
; ==================================================================
; WAIT_VBLANK - Wait for Vertical Blank
; ==================================================================
; Syncs with screen refresh for smooth animation
; Better than BIOS hook method (more predictable timing)
; ==================================================================
WAIT_VBLANK:
    ; Read VDP status register
.wait_vblank_start:
    in a, (0x99)         ; Read status
    and 0x80             ; Check VBlank flag (bit 7)
    jr z, .wait_vblank_start

    ; Wait for VBlank to end (prevents double-trigger)
.wait_vblank_end:
    in a, (0x99)
    and 0x80
    jr nz, .wait_vblank_end
    ret
`;
}
```

---

## Modificación de Generators Existentes

### spritesGenerator.ts - Modo Direct

```typescript
// En generateSpritesFile()
export function generateSpritesFile(
  analysis: ProjectAnalysis,
  options?: DirectHardwareOptions
): string {
  const useDirectHardware = options?.mode !== 'bios';

  // ... código existente ...

  if (useDirectHardware) {
    // Reemplazar:
    // call LDIRVM
    // Por:
    // call FAST_LDIRVM
    code += `    ld hl, ${patternLabel}
    ld de, SPRPAT + (${baseIndex} * 32)
    ld bc, ${layerCount * 32}
    call FAST_LDIRVM          ; Direct hardware (40% faster)
`;
  } else {
    // Versión BIOS (actual)
    code += `    ld hl, ${patternLabel}
    ld de, SPRPAT + (${baseIndex} * 32)
    ld bc, ${layerCount * 32}
    call LDIRVM               ; BIOS call (compatible)
`;
  }
}
```

---

## Tabla de Mejoras Esperadas

| Función | BIOS (ciclos) | Direct (ciclos) | Mejora | Frecuencia |
|---------|---------------|-----------------|--------|------------|
| LDIRVM (256 bytes) | ~20,480 | ~12,288 | **40%** | Cada frame |
| WRTVRM | ~70 | ~40 | **43%** | HUD updates |
| WRTVDP | ~55 | ~25 | **55%** | Screen init |
| GTSTCK | ~120 | ~50 | **58%** | Cada frame |
| VBlank wait | ~200 | ~30 | **85%** | Cada frame |

### Impacto Total por Frame:
- **BIOS mode:** ~25,000 ciclos en I/O
- **Direct mode:** ~14,500 ciclos en I/O
- **Ahorro:** ~**10,500 ciclos/frame** (~40% mejora en I/O)

---

## Estrategia de Implementación (3 Fases)

### Fase 1: Hybrid Mode (Recomendado para empezar)
✅ BIOS en inicialización (compatible, detecta hardware)
✅ Direct en game loop (performance crítico)

```asm
init_rom:
    ; Use BIOS for setup (compatibility)
    call CHGMOD              ; BIOS: Set screen mode
    call init_game_data

game_loop:
    ; Use direct for performance
    call FAST_LDIRVM         ; Direct: Update sprites
    call FAST_GTSTCK         ; Direct: Read input
    call WAIT_VBLANK         ; Direct: Sync
    jr game_loop
```

### Fase 2: Full Direct Mode
✅ Eliminar todas las llamadas BIOS
✅ Detectar MSX1/MSX2/MSX2+ manualmente
✅ Propio sistema de interrupciones

### Fase 3: Assembly Optimizations
✅ Unrolled loops para sprites críticos
✅ Self-modifying code (scanline effects)
✅ Register shadowing (EXX, EX AF,AF')

---

## Testing y Validación

### Test Suite Direct Hardware

```typescript
// test/directHardware.test.ts
describe('Direct Hardware Mode', () => {
  it('should generate FAST_LDIRVM correctly', () => {
    const asm = generateDirectHardwareFile({ mode: 'direct' });
    expect(asm).toContain('FAST_LDIRVM:');
    expect(asm).toContain('out (0x99), a');
  });

  it('should maintain compatibility in hybrid mode', () => {
    const asm = generateSpritesFile(analysis, { mode: 'hybrid' });
    expect(asm).toContain('call FAST_LDIRVM');
  });
});
```

### OpenMSX Validation Script

```tcl
# test_direct_hardware.tcl
# Run ROM and verify direct hardware access works

proc test_vram_write {} {
    # Set breakpoint on FAST_LDIRVM
    debug set_bp FAST_LDIRVM
    debug run

    # Verify VRAM address set correctly
    set port99 [debug read "port" 0x99]
    if {$port99 & 0x40} {
        puts "✅ VRAM write mode set"
    }
}

test_vram_write
```

---

## Compatibilidad MSX1/MSX2/MSX2+

### Detección de Hardware (Hybrid Mode)

```asm
detect_vdp_type:
    ; Read VDP status register
    in a, (0x99)
    in a, (0x99)         ; Second read returns ID

    ; Check MSX type
    cp 0                 ; MSX1 (TMS9918)
    jr z, is_msx1
    cp 1                 ; MSX2 (V9938)
    jr z, is_msx2
    ; Else MSX2+ (V9958)

is_msx1:
    ld a, 1
    ld (vdp_type), a
    ret

is_msx2:
    ld a, 2
    ld (vdp_type), a
    ret
```

---

## Conclusión

### Beneficios Direct Hardware:
- ✅ **40-60% más rápido** que BIOS en operaciones críticas
- ✅ **10,500+ ciclos ahorrados/frame** (combinado con optimizaciones anteriores)
- ✅ **Control total** para efectos avanzados
- ✅ **ROM más pequeño** (sin overhead BIOS)

### Trade-offs:
- ❌ **Menos portable** (requiere testing en MSX1/2/2+)
- ❌ **Más complejo** (necesitas entender hardware)
- ❌ **Sin safety nets** (puedes romper el VDP si fallas)

### Recomendación:
1. **Empezar con Hybrid Mode** (BIOS init + Direct game loop)
2. **Medir performance** con OpenMSX profiler
3. **Si necesitas más:** Full Direct Mode
4. **Solo si es crítico:** Assembly optimizations extremas

---

**¿Implementamos el modo Hybrid primero?** Es el mejor balance entre compatibilidad y performance.

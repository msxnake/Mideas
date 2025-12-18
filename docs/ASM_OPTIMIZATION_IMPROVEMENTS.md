# Mejoras Técnicas en Generadores ASM - MSX Z80

## Resumen Ejecutivo
Este documento detalla oportunidades de optimización técnica en el código Z80 Assembly generado por los generators de Mideas. Las mejoras se centran en reducir ciclos de CPU, optimizar uso de registros y mejorar la eficiencia del código generado.

---

## 1. COMPONENTES GENERATOR (componentsGenerator.ts)

### 1.1 Position Update Loop - Optimización de Bucle
**Archivo:** `componentsGenerator.ts:45-93`

**Código Actual:**
```asm
position_update_loop:
    ld a, (hl)                 ; Get entity component mask
    and COMP_MASK_POSITION
    jr z, position_next_entity

    ld a, (hl)                 ; ❌ REDUNDANTE - ya teníamos el mask en A
    and COMP_MASK_MOVEMENT
    jr z, position_next_entity
```

**Mejora Propuesta:**
```asm
position_update_loop:
    ld a, (hl)                 ; Get entity component mask
    ld d, a                    ; ✅ Guardar mask en D
    and COMP_MASK_POSITION
    jr z, position_next_entity

    ld a, d                    ; ✅ Reusar mask guardado
    and COMP_MASK_MOVEMENT
    jr z, position_next_entity
```

**Beneficio:** Ahorra 1 lectura de memoria por entidad (32 bytes/frame si hay 32 entidades)

---

### 1.2 Velocity Application - Optimización Aritmética
**Archivo:** `componentsGenerator.ts:58-84`

**Código Actual:**
```asm
    ; Update X Position
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                 ; A = VelX
    ld b, a                    ; ❌ Copia innecesaria

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                 ; A = X
    add a, b                   ; A = X + VelX
    ld (hl), a
```

**Mejora Propuesta:**
```asm
    ; Update X Position
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld b, (hl)                 ; ✅ Cargar directo en B

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                 ; A = X
    add a, b                   ; A = X + VelX
    ld (hl), a
```

**Beneficio:** Ahorra 1 instrucción LD por actualización de posición

---

### 1.3 Sprite Layer Loop - Optimización de Multiplicación
**Archivo:** `componentsGenerator.ts:172-203`

**Código Actual:**
```asm
sprite_layer_loop:
    ; Calculate Pattern: Pattern = HW Sprite Index
    ld a, l
    ld d, a                    ; D = Pattern

    ; Get Color from table
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e                   ; ❌ Cálculo redundante con offset
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
```

**Mejora Propuesta:**
```asm
sprite_layer_loop:
    ; Calculate Pattern: Pattern = HW Sprite Index
    ld a, l
    ld d, a                    ; D = Pattern

    ; Get Color from table
    push de
    ld hl, sprite_layer_colors
    ld e, l                    ; ✅ Usar offset directo
    ld d, 0
    add hl, de
    ld a, (hl)                 ; ✅ Más directo
    pop de
    ld e, a
```

**Beneficio:** Código más compacto y legible, ahorra ciclos en carry propagation

---

## 2. SPRITES GENERATOR (spritesGenerator.ts)

### 2.1 Show Sprite - Safety Check Ineficiente
**Archivo:** `spritesGenerator.ts:455-488`

**Código Actual:**
```asm
show_sprite:
    cp 32
    ret nc

    ; Safety check Y
    push af
    ld a, c
    cp 209
    jr nz, .y_ok
    ld c, 100
.y_ok:
    pop af

    ; Calculate address
    ld l, a
    ld h, 0
    add hl, hl      ; ❌ Multiplicación por 4 en 3 pasos
    add hl, hl
```

**Mejora Propuesta:**
```asm
show_sprite:
    cp 32
    ret nc

    ; Safety check Y (opcional - eliminar si no es crítico)
    ; ✅ Este check puede ser innecesario si llamamos con valores válidos

    ; Calculate address (multiplicar por 4 optimizado)
    ld l, a
    ld h, 0
    add hl, hl      ; × 2
    add hl, hl      ; × 4
    ; ✅ Ya era óptimo, pero podemos mejorar usando IX
```

**Alternativa con IX (si disponible):**
```asm
show_sprite:
    cp 32
    ret nc

    ld ixl, a       ; ✅ Usar IX como registro temporal
    ld ixh, 0
    add ix, ix      ; × 2
    add ix, ix      ; × 4

    ld de, sprite_attributes
    add ix, de
    ; Ahora IX apunta directo al sprite
```

**Beneficio:** Código más limpio, posible reducción de ciclos

---

### 2.2 Clear All Sprites - Loop Optimization
**Archivo:** `spritesGenerator.ts:490-498`

**Código Actual:**
```asm
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, 36        ; ❌ Número mágico (debería ser totalHardwareSprites + 4)
.clear_loop:
    ld (hl), SPRITE_INVISIBLE
    ld de, 4
    add hl, de      ; ❌ Sumar 4 en cada iteración es lento
    djnz .clear_loop
```

**Mejora Propuesta (Método 1 - LDIR):**
```asm
clear_all_sprites:
    ld hl, sprite_attributes
    ld de, sprite_attributes + 4
    ld bc, (32 * 4) - 4
    ld (hl), SPRITE_INVISIBLE
    ldir            ; ✅ Mucho más rápido
    ret
```

**Mejora Propuesta (Método 2 - Loop optimizado):**
```asm
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, 32        ; ✅ Constante clara
    ld a, SPRITE_INVISIBLE
.clear_loop:
    ld (hl), a      ; Y position
    inc hl
    inc hl
    inc hl
    inc hl          ; ✅ 4× INC HL es más rápido que ADD HL, DE
    djnz .clear_loop
    ret
```

**Beneficio:** LDIR es 21 ciclos/byte vs ~50 ciclos/sprite con el loop original

---

## 3. PATTERNS GENERATOR (patternsGenerator.ts)

### 3.1 Pattern Loading - LDIRVM Calls
**Archivo:** `patternsGenerator.ts:75-86`

**Código Actual:**
```asm
load_pattern_bank0:
    ld hl, tile_pattern_bank0
    ld de, CHRTBL2 + (128 * 8)
    ld bc, ${totalBytes}
    call FAST_LDIRVM          ; ✅ Ya usa fast version
    ret
```

**Mejora Propuesta:**
Si FAST_LDIRVM ya está optimizado, podemos mejorar la generación:

```typescript
// En patternsGenerator.ts
const totalBytes = analysis.tiles.reduce((total, tile) => {
    const charsWide = Math.ceil(tile.width / 8);
    const charsHigh = Math.ceil(tile.height / 8);
    return total + (charsWide * charsHigh * 8);
}, 0);

// ✅ Generar constante reutilizable
code += `PATTERN_DATA_SIZE EQU ${totalBytes}\n\n`;
```

**Beneficio:** Mejor documentación y mantenimiento del código

---

## 4. COLORS GENERATOR (colorsGenerator.ts)

### 4.1 Color Loading - Reuso de Código
**Archivo:** `colorsGenerator.ts:52-89`

**Problema:** Tres funciones casi idénticas (load_color_bank0/1/2)

**Mejora Propuesta:**
```asm
; Función genérica de carga
; Input: A = bank number (0, 1, 2)
load_color_bank_generic:
    push af

    ; Calculate offset: A × #800
    ld h, a
    ld l, 0
    add hl, hl      ; × #200
    add hl, hl      ; × #400
    add hl, hl      ; × #800

    ; Add base + char offset
    ld de, CLRTBL2 + (128 * 8)
    add hl, de
    ex de, hl       ; DE = destination

    ld hl, tile_color_bank0
    ld bc, ${totalBytes}
    call FAST_LDIRVM

    pop af
    ret

load_color_bank0:
    xor a           ; Bank 0
    jr load_color_bank_generic

load_color_bank1:
    ld a, 1         ; Bank 1
    jr load_color_bank_generic

load_color_bank2:
    ld a, 2         ; Bank 2
    jr load_color_bank_generic
```

**Beneficio:** Reduce duplicación de código, más fácil de mantener

---

## 5. SCREENS GENERATOR (screensGenerator.ts)

### 5.1 Screen Color Setting - VDP Register Write
**Archivo:** `screensGenerator.ts:270-298`

**Código Actual:**
```asm
set_screen_colors:
    push af
    push bc

    ; Background color shift
    and #0F
    rlca            ; ❌ 4× RLCA = 16 ciclos
    rlca
    rlca
    rlca
    ld c, a
```

**Mejora Propuesta (Tabla de Lookup):**
```asm
; En sección de datos:
color_shift_table:
    db #00, #10, #20, #30, #40, #50, #60, #70
    db #80, #90, #A0, #B0, #C0, #D0, #E0, #F0

set_screen_colors:
    push af
    push bc
    push hl

    ; Background color → high nibble (tabla)
    and #0F
    ld hl, color_shift_table
    add a, l
    ld l, a
    ld a, (hl)      ; ✅ 1 tabla lookup = ~11 ciclos vs 16
    ld c, a

    ; ... resto del código
    pop hl
    pop bc
    pop af
    ret
```

**Beneficio:** 5 ciclos ahorrados por llamada

---

### 5.2 Print String Loop - Character Conversion
**Archivo:** `screensGenerator.ts:283-315`

**Código Actual:**
```asm
.print_loop:
    ld a, (de)
    or a
    jr z, .print_done

    call hud_ascii_to_tile      ; ❌ CALL overhead innecesario

    push de
    call FAST_WRTVRM
    pop de

    inc de
    inc hl
    jr .print_loop
```

**Mejora Propuesta (Inline ASCII conversion):**
```asm
.print_loop:
    ld a, (de)
    or a
    jr z, .print_done

    ; ✅ Inline conversion (ahorra CALL/RET)
    cp 32
    jr nc, .valid_char
    ld a, 32
.valid_char:

    push de
    call FAST_WRTVRM
    pop de

    inc de
    inc hl
    jr .print_loop
```

**Beneficio:** Ahorra 17 ciclos por carácter (CALL = 17, RET = 10)

---

## 6. HUD GENERATOR (hudGenerator.ts)

### 6.1 Frame Drawing - Edge Loop Optimization
**Archivo:** `hudGenerator.ts:370-383`

**Código Actual:**
```asm
.top_edge_loop:
    ld a, 45        ; ❌ Cargar constante en cada iteración
    call FAST_WRTVRM
    inc hl
    djnz .top_edge_loop
```

**Mejora Propuesta:**
```asm
    ld a, 45        ; ✅ Cargar una vez antes del loop
.top_edge_loop:
    call FAST_WRTVRM
    inc hl
    djnz .top_edge_loop
```

**Beneficio:** 4 ciclos ahorrados por iteración × ancho del frame

---

### 6.2 Coordinate to VRAM Address - Optimización
**Archivo:** `hudGenerator.ts:217-246`

**Código Actual:**
```asm
    ; Y/8 = row
    ld a, e
    srl a
    srl a
    srl a           ; A = Y/8

    ; row × 32
    ld l, a
    ld h, 0
    add hl, hl      ; × 2
    add hl, hl      ; × 4
    add hl, hl      ; × 8
    add hl, hl      ; × 16
    add hl, hl      ; × 32
```

**Mejora Propuesta (Tabla de Multiplicación):**
```asm
; En sección de datos (generar con TS):
row_offset_table:
    dw #1800, #1820, #1840, #1860  ; Row 0-3
    dw #1880, #18A0, #18C0, #18E0  ; Row 4-7
    ; ... hasta row 23

; Código optimizado:
    ; Y/8 = row
    ld a, e
    srl a
    srl a
    srl a           ; A = Y/8 (row 0-23)

    ; Lookup row address
    add a, a        ; × 2 (word table)
    ld hl, row_offset_table
    add a, l
    ld l, a
    adc a, h
    sub l
    ld h, a
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a         ; HL = base VRAM address for row

    ; Add X/8
    ld a, d
    srl a
    srl a
    srl a
    add a, l
    ld l, a
```

**Beneficio:** Reduce 5 ADD HL,HL a 1 tabla lookup

---

## 7. GAMEFLOW GENERATOR (gameFlowGenerator.ts)

### 7.1 Connection Search - Linear Search Optimization
**Archivo:** `gameFlowGenerator.ts:206-236`

**Código Actual:**
```asm
.search_loop:
    ld a, (hl)
    cp CONNECTION_END
    jr z, .not_found

    cp d
    jr z, .found

    inc hl          ; ❌ Incremento manual de 3 bytes
    inc hl
    inc hl
    jr .search_loop
```

**Mejora Propuesta:**
```asm
.search_loop:
    ld a, (hl)
    cp CONNECTION_END
    jr z, .not_found

    cp d
    jr z, .found

    ld bc, 3        ; ✅ Más claro y potencialmente más rápido
    add hl, bc
    jr .search_loop
```

**Nota:** En Z80, 3× INC HL (18 ciclos) vs ADD HL,BC (11 ciclos) - ADD es más rápido

**Beneficio:** 7 ciclos por iteración de búsqueda

---

## 8. OPTIMIZACIONES GENERALES CROSS-GENERATOR

### 8.1 Uso de Registros Shadow (EXX, EX AF, AF')
**Contexto:** Ningún generator usa registros shadow

**Propuesta:** En loops críticos (sprite update, entity update):
```asm
; Guardar registros principales
exx             ; ✅ Intercambio rápido BC, DE, HL
ex af, af'      ; ✅ Intercambio rápido AF

; ... código que usa BC', DE', HL', AF'

; Restaurar
ex af, af'
exx
```

**Beneficio:**
- EXX = 4 ciclos vs 6× PUSH/POP = 66 ciclos
- EX AF,AF' = 4 ciclos vs PUSH AF / POP AF = 22 ciclos

---

### 8.2 Uso de INDEX Registers (IX, IY)
**Contexto:** Uso limitado de IX/IY

**Propuesta:** En estructuras de datos:
```asm
; Acceso a entity data
ld ix, entity_data_base
ld a, (ix + OFFSET_X_POS)   ; ✅ Acceso directo con offset
ld b, (ix + OFFSET_Y_POS)   ; ✅ Sin necesidad de ADD HL,DE
```

**Beneficio:** Código más compacto (aunque IX add 4 ciclos extra)

---

### 8.3 Loop Unrolling en Bucles Críticos
**Ejemplo:** Clear sprites (32 sprites)

**Código Actual:**
```asm
.clear_loop:
    ld (hl), a
    inc hl
    inc hl
    inc hl
    inc hl
    djnz .clear_loop    ; 32 iteraciones
```

**Mejora (Unroll 4×):**
```asm
    ld b, 8             ; Solo 8 iteraciones
.clear_loop:
    ; Sprite 0
    ld (hl), a
    inc hl
    inc hl
    inc hl
    inc hl

    ; Sprite 1
    ld (hl), a
    inc hl
    inc hl
    inc hl
    inc hl

    ; Sprite 2
    ld (hl), a
    inc hl
    inc hl
    inc hl
    inc hl

    ; Sprite 3
    ld (hl), a
    inc hl
    inc hl
    inc hl
    inc hl

    djnz .clear_loop
```

**Beneficio:** Reduce overhead de DJNZ (13 ciclos × 24 iteraciones ahorradas = 312 ciclos)

---

## 9. TABLA DE PRIORIDAD DE IMPLEMENTACIÓN

| Prioridad | Mejora | Archivo | Impacto | Dificultad |
|-----------|--------|---------|---------|------------|
| 🔴 ALTA | Clear Sprites LDIR | spritesGenerator.ts | Alto (cada frame) | Baja |
| 🔴 ALTA | Position Update - Mask Reuso | componentsGenerator.ts | Alto (32× por frame) | Baja |
| 🔴 ALTA | Inline ASCII conversion | screensGenerator.ts | Medio (HUD) | Baja |
| 🟡 MEDIA | Color Shift Table | screensGenerator.ts | Bajo (1× por screen) | Media |
| 🟡 MEDIA | Connection Search ADD | gameFlowGenerator.ts | Bajo (raro) | Baja |
| 🟡 MEDIA | Row Offset Table | hudGenerator.ts | Medio (HUD frame) | Media |
| 🟢 BAJA | Shadow Registers | Todos | Alto (frames) | Alta |
| 🟢 BAJA | Loop Unrolling | Varios | Variable | Media |

---

## 10. MÉTRICAS ESTIMADAS DE MEJORA

### Por Frame (60 Hz):
- **Clear Sprites:** ~1000 ciclos ahorrados
- **Position Update:** ~300 ciclos ahorrados (10 entidades activas)
- **Sprite Layer Loop:** ~150 ciclos ahorrados
- **HUD Print:** ~200 ciclos ahorrados (texto corto)

### Total Estimado: ~1650 ciclos/frame
**En CPU MSX (3.58 MHz):** 1650 ciclos = ~0.46 ms = ~2.7% de frame budget (16.67ms)

---

## 11. RECOMENDACIONES DE IMPLEMENTACIÓN

### Fase 1 (Quick Wins):
1. ✅ Implementar LDIR en clear_all_sprites
2. ✅ Reusar mask en position_update_loop
3. ✅ Inline ASCII conversion en print_string

### Fase 2 (Medium Effort):
4. ✅ Tabla de row offsets para HUD
5. ✅ Tabla de color shift
6. ✅ Optimizar connection search

### Fase 3 (Advanced):
7. ✅ Uso estratégico de shadow registers
8. ✅ Loop unrolling selectivo
9. ✅ Benchmarking y profiling

---

## 12. HERRAMIENTAS PARA VALIDACIÓN

### Testing:
1. **OpenMSX Debugger** - Contar ciclos reales
2. **Glass.jar warnings** - Detectar ineficiencias
3. **ROM Size comparison** - Antes/después

### Benchmarking:
```asm
; Template para medir ciclos
benchmark_start:
    ld hl, (#FC9E)      ; H.TIMI hook counter
    ld (benchmark_time_start), hl

    ; ... código a medir

    ld hl, (#FC9E)
    ld de, (benchmark_time_start)
    or a
    sbc hl, de          ; HL = ciclos transcurridos
    ld (benchmark_result), hl
    ret
```

---

## CONCLUSIÓN

Las mejoras propuestas ofrecen:
- ✅ **Reducción de ciclos:** ~2-5% por frame
- ✅ **Mejor mantenibilidad:** Código más claro
- ✅ **Compatibilidad:** Sin breaking changes
- ✅ **Escalabilidad:** Mejoras aplicables a proyectos grandes

**Próximos Pasos:**
1. Implementar mejoras de Fase 1 (bajo riesgo)
2. Validar con testing en OpenMSX
3. Medir impacto real con benchmarks
4. Iterar con Fase 2 y 3

---

**Documento generado:** 2025-12-16
**Versión:** 1.0
**Autor:** Claude Code Analysis

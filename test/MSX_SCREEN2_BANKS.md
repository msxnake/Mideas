# 🎮 MSX Screen 2 - Sistema de 3 Bancos de Memoria

## 📋 Información extraída del código real de Mideas

Este documento contiene la información esencial sobre cómo se organizan y cargan los 3 bancos de memoria en Screen 2 del MSX, basado en el código de `src/asm/init.asm`.

---

## 🏦 **ESTRUCTURA DE LOS 3 BANCOS EN SCREEN 2**

### **Pattern Generator Table (PGT) - 3 Bancos**
```assembly
; Banco 0: CHRTBL2 + #0000    (caracteres 0-255)
; Banco 1: CHRTBL2 + #800     (caracteres 0-255)
; Banco 2: CHRTBL2 + #1000    (caracteres 0-255)
```

### **Color Attribute Table (CAT) - 3 Bancos**
```assembly
; Banco 0: CLRTBL2 + #0000    (colores 0-255)
; Banco 1: CLRTBL2 + #800     (colores 0-255)
; Banco 2: CLRTBL2 + #1000    (colores 0-255)
```

---

## 🔄 **CARGA DE TILES EN LOS 3 BANCOS**

### **loadPatternBanks - Cargar Patrones**
```assembly
loadPatternBanks:
    ; --- Load TILE1 Pattern Data into all three PGT banks ---

    ; Banco 0 (Base)
    LD      HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
    LD      DE, CHRTBL2           ; Banco 0: #0000
    LD      BC, MAX_PTR           ; 4 characters (0-3) * 8 bytes/char = 32 bytes
    CALL    LDIRVM

    ; Banco 1 (+#800)
    LD      HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
    LD      DE, CHRTBL2 + #800    ; Banco 1: +#800
    LD      BC, MAX_PTR           ; 4 characters (0-3) * 8 bytes/char = 32 bytes
    CALL    LDIRVM

    ; Banco 2 (+#1000)
    LD      HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
    LD      DE, CHRTBL2 + #1000   ; Banco 2: +#1000
    LD      BC, MAX_PTR           ; 4 characters (0-3) * 8 bytes/char = 32 bytes
    CALL    LDIRVM
```

### **loadColorBanks - Cargar Colores**
```assembly
loadColorBanks:
    ; --- Load TILE1 Color Data into all three CAT banks ---

    ; Banco 0 (Base)
    LD      HL, ALL_MAP_TILES_COL ; Source RAM address for TILE1 colors
    LD      DE, CLRTBL2           ; Banco 0: #0000
    LD      BC, MAX_PTR           ; 4 characters * 8 bytes/char = 32 bytes
    CALL    LDIRVM

    ; Banco 1 (+#800)
    LD      HL, ALL_MAP_TILES_COL ; Source RAM address for TILE1 colors
    LD      DE, CLRTBL2 + #800    ; Banco 1: +#800
    LD      BC, MAX_PTR           ; 4 characters * 8 bytes/char = 32 bytes
    CALL    LDIRVM

    ; Banco 2 (+#1000)
    LD      HL, ALL_MAP_TILES_COL ; Source RAM address for TILE1 colors
    LD      DE, CLRTBL2 + #1000   ; Banco 2: +#1000
    LD      BC, MAX_PTR           ; 4 characters * 8 bytes/char = 32 bytes
    CALL    LDIRVM
```

---

## 🔲 **CARÁCTER BLANCO (ID #255) EN LOS 3 BANCOS**

### **loadBlankCharPatterns - Patrón del carácter blanco**
```assembly
loadBlankCharPatterns:
    ; Banco 0
    LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
    LD      DE, CHRTBL2 + #0000 + (255 * 8) ; Char #255 en banco 0
    LD      BC, 8                  ; 8 bytes for one character pattern
    CALL    LDIRVM

    ; Banco 1
    LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
    LD      DE, CHRTBL2 + #800 + (255 * 8)  ; Char #255 en banco 1
    LD      BC, 8                  ; 8 bytes for one character pattern
    CALL    LDIRVM

    ; Banco 2
    LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
    LD      DE, CHRTBL2 + #1000 + (255 * 8) ; Char #255 en banco 2
    LD      BC, 8                  ; 8 bytes for one character pattern
    CALL    LDIRVM
```

### **loadBlankCharColors - Color del carácter blanco**
```assembly
loadBlankCharColors:
    ; Banco 0
    LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
    LD      DE, CLRTBL2 + #0000 + (255 * 8) ; Char #255 color en banco 0
    LD      BC, 8                ; 8 bytes for one character color
    CALL    LDIRVM

    ; Banco 1
    LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
    LD      DE, CLRTBL2 + #800 + (255 * 8)  ; Char #255 color en banco 1
    LD      BC, 8                ; 8 bytes for one character color
    CALL    LDIRVM

    ; Banco 2
    LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
    LD      DE, CLRTBL2 + #1000 + (255 * 8) ; Char #255 color en banco 2
    LD      BC, 8                ; 8 bytes for one character color
    CALL    LDIRVM
```

---

## 📊 **DIRECCIONES DE MEMORIA SCREEN 2**

### **Pattern Generator Table (PGT)**
| Banco | Dirección Base | Rango | Tamaño |
|-------|----------------|-------|---------|
| 0 | CHRTBL2 + #0000 | #0000-#07FF | 2KB |
| 1 | CHRTBL2 + #800  | #0800-#0FFF | 2KB |
| 2 | CHRTBL2 + #1000 | #1000-#17FF | 2KB |

### **Color Attribute Table (CAT)**
| Banco | Dirección Base | Rango | Tamaño |
|-------|----------------|-------|---------|
| 0 | CLRTBL2 + #0000 | #2000-#27FF | 2KB |
| 1 | CLRTBL2 + #800  | #2800-#2FFF | 2KB |
| 2 | CLRTBL2 + #1000 | #3000-#37FF | 2KB |

---

## ⚡ **PUNTOS CLAVE**

1. **Replicación**: Los mismos datos se cargan en los 3 bancos
2. **Offset de bancos**: +#800 entre cada banco (#0000, #800, #1000)
3. **Carácter especial**: ID #255 se carga como carácter "blanco" en todos los bancos
4. **Separación**: Patrones y colores se cargan por separado pero de forma simétrica
5. **LDIRVM**: Se usa la función BIOS para transferir datos de RAM a VRAM

---

## 🔧 **FUNCIONES UTILIZADAS**

- **LDIRVM**: Función BIOS MSX para copiar datos de RAM a VRAM
- **ALL_MAP_TILES_PTR**: Puntero a datos de patrones de tiles en RAM
- **ALL_MAP_TILES_COL**: Puntero a datos de colores de tiles en RAM
- **BLANK_CHAR_PATTERN**: Patrón del carácter blanco (ID #255)
- **BLANK_CHAR_COLOR**: Color del carácter blanco (ID #255)

---

## 💡 **USO EN GENERACIÓN ASM**

Esta información es fundamental para:
- Entender cómo Mideas organiza los tiles en Screen 2
- Generar código correcto en `generateUnitedFilesASM`
- Configurar correctamente las direcciones VRAM
- Implementar sistemas de tiles que respeten esta estructura

**Conclusión**: En Screen 2, se cargan 3 copias idénticas de los datos de tiles en bancos separados por offsets de #800, tanto para patrones como para colores.
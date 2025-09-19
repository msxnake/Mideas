# MSX ROM Graphics Debugging - Complete Process Guide

## Overview

Este documento proporciona un proceso completo para debuggear problemas gráficos en ROMs MSX usando OpenMSX. Específicamente diseñado para el ROM BasicEnemy pero aplicable a cualquier ROM MSX con problemas gráficos.

## Problema Identificado

**BasicEnemy ROM Issues:**
- ROM se ejecuta sin errores
- No se muestran sprites ni gráficos
- Pantalla permanece vacía
- ROM muy pequeño (38 bytes) indica fallo de compilación

## Archivos de Debugging Creados

### 1. Script Principal de Debugging
**Archivo:** `automation/debugging/msx_graphics_debug.tcl`
- Script TCL completo para OpenMSX
- Funciones automatizadas de análisis VDP/VRAM
- Breakpoints inteligentes
- Logging detallado

### 2. Launcher para Windows
**Archivo:** `automation/debugging/debug_basicenemy.bat`
- Script batch para lanzar OpenMSX con debugging
- Verificaciones automáticas de ROM
- Detección de rutas de OpenMSX

### 3. Comandos Esenciales
**Archivo:** `automation/debugging/essential_debug_commands.txt`
- Referencia rápida de comandos
- Escenarios comunes de debugging
- Explicación de registros VDP

### 4. ROM Corregido para Pruebas
**Archivo:** `automation/debugging/basicenemy_fixed.asm`
- Versión funcional del ROM BasicEnemy
- Implementación correcta de sprites y tiles
- Rutinas seguras de VRAM

## Proceso de Debugging Paso a Paso

### Paso 1: Verificación Inicial
```batch
# Ejecutar el launcher
automation/debugging/debug_basicenemy.bat
```

### Paso 2: Iniciar Sesión de Debug
En el console de OpenMSX:
```tcl
start_debug_session
```

### Paso 3: Ejecutar Pruebas Automatizadas
```tcl
run_debug_tests
```

### Paso 4: Análisis Manual (si es necesario)
```tcl
# Verificar estado VDP
check_vdp_status

# Examinar contenidos VRAM
check_vram_contents

# Análisis de estructura ROM
analyze_rom_structure

# Configuración manual si falla automática
manual_vdp_setup
```

## Comandos Críticos de Debugging

### Verificación VDP
```tcl
# Estado general VDP
check_vdp_status

# Registros específicos
vdp info reg 0    # Modo registro 0
vdp info reg 1    # Modo registro 1
vdp info reg 2    # Tabla de nombres
```

### Análisis VRAM
```tcl
# Tabla de nombres (background)
hex_dump 0x1800 256

# Patrones de sprites
hex_dump 0x3800 256

# Atributos de sprites
hex_dump 0x1B00 128
```

### Control de Ejecución
```tcl
# Breakpoint en inicio ROM
debug set_breakpoint 0x4000

# Ejecutar paso a paso
step 1000

# Continuar ejecución
run
```

## Problemas Comunes y Soluciones

### 1. ROM Muy Pequeño (< 100 bytes)
**Problema:** Error de compilación
**Solución:**
- Revisar código ASM para errores de sintaxis
- Verificar que todas las rutinas estén implementadas
- Usar el ROM corregido para pruebas

### 2. Pantalla Negra
**Problema:** VDP no configurado correctamente
**Solución:**
```tcl
manual_vdp_setup
check_vdp_status
```

### 3. Sprites No Visibles
**Problema:** Datos de sprite no cargados o mal posicionados
**Diagnóstico:**
```tcl
# Verificar atributos de sprite
vdp info vram 0x1B00  # Y position
vdp info vram 0x1B01  # X position
vdp info vram 0x1B02  # Pattern
vdp info vram 0x1B03  # Color

# Verificar patrones de sprite
hex_dump 0x3800 64
```

### 4. Background No Visible
**Problema:** Tabla de nombres o patrones vacíos
**Diagnóstico:**
```tcl
# Tabla de nombres
hex_dump 0x1800 256

# Patrones
hex_dump 0x0000 256

# Colores
hex_dump 0x2000 256
```

## Configuración VDP Correcta (Screen 2)

### Registros VDP Esperados
```
R0: 0x02  (M3=0, M4=0, M5=1)
R1: 0xE2  (Screen on, M1=1, M2=1, 16x16 sprites)
R2: 0x06  (Name table at 0x1800)
R3: 0xFF  (Color table at 0x2000)
R4: 0x03  (Pattern table at 0x0000)
R5: 0x36  (Sprite attributes at 0x1B00)
R6: 0x07  (Sprite patterns at 0x3800)
R7: 0xF1  (White on black)
```

### Mapa de Memoria VRAM
```
0x0000-0x17FF: Pattern Generator Table (6KB)
0x1800-0x1AFF: Pattern Name Table (768 bytes)
0x1B00-0x1B7F: Sprite Attribute Table (128 bytes)
0x2000-0x37FF: Color Table (6KB)
0x3800-0x3FFF: Sprite Pattern Table (2KB)
```

## Archivos de Salida

### Logs
- `automation/debugging/debug_session.log`

### Screenshots
- `automation/openmsx/screenshots/debug_*.png`

## Uso del ROM Corregido

Para probar con el ROM funcional:
1. Compilar `basicenemy_fixed.asm` con SJASM
2. Ejecutar debugging con el nuevo ROM
3. Comparar resultados con ROM original

## Comandos de Compilación
```bash
# Compilar ROM corregido
sjasm basicenemy_fixed.asm basicenemy_fixed.rom

# Verificar tamaño
ls -l basicenemy_fixed.rom
```

## Próximos Pasos

1. **Identificar errores específicos** en el ROM original usando las herramientas
2. **Corregir código ASM** basado en los hallazgos del debugging
3. **Implementar datos gráficos** faltantes (sprites, tiles)
4. **Verificar rutinas VRAM** para evitar corrupción de memoria
5. **Optimizar rendimiento** una vez que funcione correctamente

## Recursos Adicionales

- **MSX Assembly Programming Guide**
- **VDP Programming Reference**
- **OpenMSX Documentation**
- **Screen 2 Mode Specifications**

---

*Este proceso de debugging ha sido diseñado para ser exhaustivo y detectar la mayoría de problemas gráficos comunes en ROMs MSX.*
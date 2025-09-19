# BasicEnemy ROM Debugging Instructions

## Problema
El ROM BasicEnemy_fixed.rom (2,719 bytes) compila correctamente pero muestra basura en pantalla en lugar de gráficos correctos cuando se ejecuta en OpenMSX.

## Archivos de Debugging

### 1. Script Principal de Debugging
- **Archivo**: `debug_basicenemy.tcl`
- **Propósito**: Script completo de debugging automatizado con breakpoints y análisis

### 2. Comandos Adicionales
- **Archivo**: `debug_commands.tcl`
- **Propósito**: Comandos específicos para casos comunes de debugging

### 3. Launcher Automático
- **Archivo**: `run_debug.bat`
- **Propósito**: Ejecuta OpenMSX con debugging habilitado

## Instrucciones de Uso

### Opción 1: Debugging Automático
```batch
# Ejecutar desde Windows
run_debug.bat
```

### Opción 2: Manual desde OpenMSX
```tcl
# En la consola de OpenMSX:
source debug_basicenemy.tcl
debug_basicenemy

# Después de que se active el breakpoint:
debug_interactive_mode
```

## Comandos de Debugging Principales

### Análisis Inicial
```tcl
debug_basicenemy              # Inicia sesión de debugging automático
quick_vdp_check              # Verificación rápida del estado VDP
quick_vram_check             # Verificación rápida del contenido VRAM
```

### Diagnóstico de Corrupción
```tcl
check_corruption             # Analiza patrones de corrupción específicos
vdp_state                   # Estado detallado del VDP
vram_dump                   # Volcado completo del contenido VRAM
```

### Soluciones de Emergencia
```tcl
force_enable_display         # Fuerza habilitación de pantalla
fix_screen2                 # Intenta reparar configuración Screen 2
setup_minimal_screen2       # Configura Screen 2 básico con patrón de prueba
```

### Análisis Avanzado
```tcl
dump_rom_header             # Analiza header del ROM y firma MSX
monitor_vdp_writes          # Monitorea todas las escrituras VDP
step_through_init           # Paso a paso por inicialización
```

## Problemas Comunes y Soluciones

### 1. Pantalla en Blanco/Negra
**Causa**: Display deshabilitado
**Comando**: `force_enable_display`
**Verificación**: `quick_vdp_check`

### 2. Basura/Datos Corruptos
**Causas Posibles**:
- VRAM no inicializada
- Modo de pantalla incorrecto
- Tablas VDP mal configuradas

**Diagnóstico**:
```tcl
quick_vram_check            # Verifica si hay datos en VRAM
check_corruption           # Análisis específico de corrupción
vdp_state                 # Estado completo VDP
```

### 3. Modo de Pantalla Incorrecto
**Verificación**: `debug_screen_mode`
**Solución**: `fix_screen2` o `setup_minimal_screen2`

### 4. Datos VRAM Vacíos
**Causa**: Rutinas de carga de datos comentadas/no implementadas
**Análisis**:
```tcl
vram_dump                  # Verifica contenido VRAM
monitor_vdp_writes         # Monitorea si se escriben datos
```

## Análisis de Breakpoints Automáticos

El script establece breakpoints en:
- **0x4000**: Entrada del cartucho
- **0x4010**: Después de inicialización
- **0x4020**: Configuración VDP
- **0x4030**: Bucle principal

En cada breakpoint se ejecuta:
1. Análisis del estado CPU
2. Análisis del estado VDP
3. Captura de screenshot
4. Análisis del contenido VRAM

## Screenshots Automáticos

Las capturas se guardan en:
`C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\screenshots\`

Nomenclatura:
- `debug_basicenemy_initial_MMDDYY_HHMMSS.png`
- `debug_basicenemy_after_init_MMDDYY_HHMMSS.png`
- `debug_basicenemy_vdp_setup_MMDDYY_HHMMSS.png`
- `debug_basicenemy_main_loop_MMDDYY_HHMMSS.png`

## Información Técnica MSX

### Screen 2 (Graphics 2) - Configuración Estándar
- **Modo**: R0=0x02, R1=0x6A
- **Name Table**: 0x1800 (R2=0x06)
- **Color Table**: 0x2000 (R3=0x80)
- **Pattern Table**: 0x0000 (R4=0x00)

### Áreas VRAM Screen 2
- **0x0000-0x17FF**: Pattern Table (gráficos de tiles)
- **0x1800-0x1AFF**: Name Table (qué pattern mostrar dónde)
- **0x2000-0x37FF**: Color Table (colores para cada pattern)
- **0x1B00-0x1B7F**: Sprite Attributes
- **0x3800-0x3FFF**: Sprite Patterns

## Funciones Comentadas en unitedFiles(16).asm

Las siguientes funciones están comentadas y pueden causar el problema:
- `INIT_FONT_SYSTEM`
- `PRINT_STRING_SCREEN2`
- `INIT_POSITION_SYSTEM`
- `INIT_SPRITE_SYSTEM`

**Análisis**: Verificar si estas funciones son necesarias para cargar datos gráficos en VRAM.

## Comandos de Emergencia

Si el debugging automático no funciona:
```tcl
# Configuración manual mínima Screen 2
setup_minimal_screen2

# Verificación inmediata
quick_vdp_check
quick_vram_check

# Screenshot manual
screenshot debug_manual.png
```

## Guardado de Estado

Para guardar el estado completo de debugging:
```tcl
save_state "debug_state_$(clock format [clock seconds] -format %H%M%S).txt"
```
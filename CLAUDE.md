cuando pida incrementar version, o diga nueva version, lee archivo ubicado en docs/project/VERSION\_LOCATIONS.md y sigue las instrucciones.

# MSX Memory Map

Direcciones   | Tamaño | Uso típico (MSX1)
--------------+--------+--------------------------
0000h-3FFFh   | 16 KB  | BIOS ROM
4000h-7FFFh   | 16 KB  | BASIC ROM / cartucho
8000h-BFFFh   | 16 KB  | RAM (parte baja)
C000h-FFFFh   | 16 KB  | RAM (parte alta)

## ⚠️ IMPORTANTE: MSX2+ Slot Management

* En MSX2+, la dirección #FFFF es el registro de selección de slots secundarios
* NUNCA escribir en #FFFF durante limpieza de RAM (puede causar crash/reset)
* Al limpiar RAM C000h-FFFFh, usar BC=#3FFE para parar en #FFFE
* Solo afecta MSX2+; MSX1 no tiene este problema



En el código asm para MSX, recordar que no trabajamos en modo texto, siempre trabajamos en screen 2 (graphic), por tanto las rutinas de la bios que

hacen referencia a modo texto quedan invalidadas.



Siempre compilamos asm con el compilador glass.jar que se encuentra en server.



Nuestro emulador por defecto es Openmsx.

Tenemos un agente que se encarga de las funciones de Openmsx.





El proyecto que estamos haciendo es un editor de juegos para MSX, se llama "Mideas MSX", compilado .

# MSX Modular Generator - Generador de Código ASM

## Función Principal
El archivo `utils/msxModularGenerator.ts` es el **generador principal de código ASM para MSX** en Mideas. Convierte proyectos Mideas (`.json`) en código Z80 Assembly ejecutable.

## Objetivo de Paridad
**CRÍTICO**: El modo "Play" de Mideas debe ser **idéntico** al ROM generado para MSX en:
- Gráficos y rendering
- Jugabilidad y comportamiento
- Estados de juego (Game Flow)

### Flujo de Trabajo
1. Usuario crea proyecto en Mideas (ej: BasicEnemy(7).json)
2. Modo "Play" en navegador (JavaScript/Canvas)
3. Export → "Files → Export Z80 Code → asm (all in one) konami"
4. ROM ejecutándose en OpenMSX

**Los pasos 2 y 4 DEBEN ser visualmente y funcionalmente idénticos.**

## Proceso de Generación

### 1. Análisis del Proyecto
- Examina assets del JSON (sprites, tiles, screenMaps)
- Detecta entidades, componentes, game flow
- Genera análisis estructural para ASM

### 2. Archivos ASM Generados (13 módulos)
- **`bios.asm`** - Funciones BIOS MSX (CHGMOD, LDIRVM, GTSTCK, etc.)
- **`constants.asm`** - Constantes del sistema y específicas del proyecto
- **`variables.asm`** - Variables RAM con direcciones EQU (C000h-F37Fh)
- **`header.asm`** - Cabecera ROM Konami ("AB" signature, ORG #4000)
- **`patterns.asm`** - Datos de patrones de tiles para Screen 2
- **`colors.asm`** - Datos de colores de tiles (fg/bg pairs)
- **`sprites.asm`** - Datos y funciones de sprites 16x16
- **`screens.asm`** - Mapas de pantalla y layouts (usando Screen Editor logic)
- **`components.asm`** - Sistema ECS (Position, Sprite, Movement, Collision, Input, Behavior)
- **`entities.asm`** - Definiciones de entidades de juego
- **`menus.asm`** - Sistema de menús con fuentes personalizadas
- **`font.asm`** - Fuentes para texto en Screen 2
- **`main.asm`** - Archivo principal con includes ordenados

### 3. Archivo Unificado (Opcional)
- **`unitedFiles.asm`** - Todos los módulos combinados en un solo archivo

## Características Técnicas

### MSX Hardware
- **Compatibilidad**: MSX1/MSX2/MSX2+
- **Modo gráfico**: Screen 2 (256x192, 3 bancos de patrones/colores)
- **Sprites**: 16x16 píxeles, hasta 32 sprites
- **Memoria RAM**: C000h-F37Fh (variables proyecto), F380h+ (sistema MSX)

### Sistema ECS (Entity-Component-System)
```asm
; Component masks para filtrado de entidades
COMP_MASK_POSITION   EQU #01  ; 00000001
COMP_MASK_SPRITE     EQU #02  ; 00000010
COMP_MASK_MOVEMENT   EQU #04  ; 00000100
COMP_MASK_COLLISION  EQU #08  ; 00001000
COMP_MASK_INPUT      EQU #10  ; 00010000
COMP_MASK_BEHAVIOR   EQU #20  ; 00100000
```

### Game Flow States
```asm
FLOW_STATE_MAIN_MENU    EQU 0
FLOW_STATE_GAME         EQU 1
FLOW_STATE_PAUSE        EQU 2
FLOW_STATE_GAME_OVER    EQU 3
FLOW_STATE_CREDITS      EQU 4
```

## Funciones Clave de Paridad

### Rendering Engine
- **`generateTilePatternBytes()`** - Convierte tiles a bytes MSX
- **`generateTileColorBytes()`** - Genera atributos de color
- **`generateSpriteASMCode()`** - Datos de sprite (mismo que Sprite Editor)
- **`generateScreenMapLayoutBytes()`** - Layout de pantallas (mismo que Screen Editor)

### Timing y Compatibilidad
- Usa **funciones BIOS** para timing automático (`LDIRVM`, `WRTVDP`)
- **V-Blank sync** en main loop (`HALT`)
- **Gestión segura de VRAM** (sin acceso directo a puertos)

## Puntos Críticos para Paridad

### 1. Tile Rendering
El generador debe usar **exactamente las mismas funciones** que:
- Screen Editor "Download ASM"
- Tile Editor pattern/color generation
- Screen rendering en modo Play

### 2. Sprite System
- **Posicionamiento**: Mismas coordenadas que Canvas
- **Animación**: Mismos frames y timing
- **Colisiones**: Misma lógica de detección

### 3. Input Handling
- **Joystick mapping**: Mismos códigos que JavaScript
- **Respuesta**: Mismo timing y sensibilidad

### 4. Game States
- **Transiciones**: Misma lógica de cambio de estado
- **Renderizado**: Mismo contenido por estado

## Compilación y Testing
- **Compilador**: `server/glass.jar`
- **Emulador**: OpenMSX
- **Automatización**: Agente `openmsx-automation` para testing
- **Formato**: Konami ROM (cabecera "AB", ORG #4000)

## Objetivo Final
Cuando un usuario exporta un proyecto Mideas a MSX:
1. ✅ Compila sin errores con glass.jar
2. ✅ Ejecuta correctamente en OpenMSX
3. ✅ **SE VE Y JUEGA EXACTAMENTE IGUAL** que el modo Play en Mideas


- en Downloads\a1.json hay un proyecto Mideas con ejemplo HUD, Tiles, Screen asset
- Hay una seccion de Mideas que es HUD Configuration Editor
- recuerda que TileBanks[][] es una matriz
- No hay eventos, todo son condiciones
## Reglas de Comunicación

- **Cuando tengas dudas sobre lo que te pido que programes, PREGUNTA antes de implementar.** No asumas, consulta primero.

## Z80 ASM - Errores Comunes a Evitar

**LEER**: `docs/msx/Z80_INSTRUCTIONS_REFERENCE.md` para referencia completa.
**LEER TAMBIEN**: `docs/msx/Z80_LDA_I_ERRATA.md` antes de tocar codigo ASM que preserve/restaure IRQ o lea IFF2 mediante flags.
**LEER TAMBIEN**: `ai/ASM_GUIDELINES.md` (preservación de registros CPU y estado global del VDP R#15/R#17/banks a través de un `call`, con tabla de clobbers) y `ai/LESSONS_LEARNED.md` antes de reutilizar un registro o asumir estado VDP tras un `call`. Casos reales: colisión basura por clobber de DE; lag por R#15 sin restaurar.

| INCORRECTO | CORRECTO |
|------------|----------|
| `ld hl,de` | `push de` / `pop hl` o `ld h,d` / `ld l,e` |
| `ld de,hl` | `ld d,h` / `ld e,l` |
| `ld bc,hl` | `ld b,h` / `ld c,l` |
| `add hl,a` | `ld e,a` / `ld d,0` / `add hl,de` |
| `sub hl,de` | `or a` / `sbc hl,de` |

### JR vs JP - Saltos

| Instrucción | Rango | Cuándo usar |
|-------------|-------|-------------|
| `jr label` | -128 a +127 bytes | Solo para saltos cortos y cercanos |
| `jp label` | Cualquier dirección | **USAR SIEMPRE si hay duda sobre la distancia** |

**REGLA**: Si el código entre el salto y la etiqueta puede crecer o es largo, usar **`jp`** en lugar de `jr`.
- `jr` = 2 bytes, pero limitado a ±127 bytes
- `jp` = 3 bytes, pero sin límite de distancia

### Errata Z80 - `ld a, i` / `ld a, r`

Patron prohibido en secciones criticas:

```asm
ld a, i
push af
; ...
pop af
ret po
ei
ret
```

**Motivo**: si entra una IRQ entre `ld a, i` y la siguiente lectura de flags, el bit P/V puede corromperse a 0 y el flujo puede saltarse el `ei`.

**Regla**: no usar `ld a, i` ni `ld a, r` para recordar el estado de interrupciones. Si el contexto garantiza IRQ activadas, usar `di` / `ei` incondicional. Si el contexto no es conocido, guardar el estado por otro mecanismo, por ejemplo un flag en RAM.

### MSX1 Screen 2 - Estructura de 3 Bancos

La pantalla se divide en 3 bancos verticales (cada uno cubre 8 filas de tiles):

| Banco | Filas | Pattern Table | Color Table |
|-------|-------|---------------|-------------|
| 0 | 0-7 | #0000-#07FF (2048 bytes) | #2000-#27FF |
| 1 | 8-15 | #0800-#0FFF (2048 bytes) | #2800-#2FFF |
| 2 | 16-23 | #1000-#17FF (2048 bytes) | #3000-#37FF |

- **256 chars x 8 bytes = 2048 bytes por banco**
- **Total: 768 caracteres únicos (256 x 3 bancos)**
- **Name Table**: #1800-#1AFF (768 bytes, 32x24)

**IMPORTANTE**: Para redefinir un tile en toda la pantalla, hay que escribirlo en los 3 bancos.

### Variables RAM en ROMs de Cartucho - NO usar ORG #C000

En ROMs de cartucho Konami (#4000), las variables RAM se definen **SOLO con EQU**:

```asm
; CORRECTO - Solo asigna dirección, no genera código
player_x    EQU #C000
player_y    EQU #C001
score       EQU #C002

; INCORRECTO - Intenta escribir en ROM, causa bug
    ORG #C000
    DS 100    ; NUNCA hacer esto en ROM de cartucho!
```

**Razón**: El compilador glass.jar genera un archivo ROM lineal. Si usas `ORG #C000` en medio del código, intentará poner datos en esa dirección dentro del archivo ROM, corrompiendo la estructura.

**Regla**: En cartuchos, la RAM (#C000+) se usa en **runtime**, no se "reserva" en la ROM.

---

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
El archivo `utils/msxGenerator/index.ts` es el **generador principal de código ASM para MSX** en Mideas. Convierte proyectos Mideas (`.json`) en código Z80 Assembly ejecutable.

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

### Collision Layers (Bitmask System)
Sistema de capas de colisión usando máscaras de bits:

| Bit | Valor Decimal | Uso Típico | Ejemplo Template |
|-----|---------------|------------|------------------|
| 0   | 1 (0000 0001) | Player | tpl_player |
| 1   | 2 (0000 0010) | Enemies | tpl_enemy_basic |
| 2   | 4 (0000 0100) | Player Bullets | tpl_player_bullet |
| 3   | 8 (0000 1000) | Platforms/Walls | entity_platform |
| 4   | 16 (0001 0000) | Enemy Bullets | - |
| 5   | 32 (0010 0000) | Collectibles/Items | - |
| 6   | 64 (0100 0000) | Triggers/Zones | - |
| 7   | 128 (1000 0000) | Custom/Special | - |

**Configuración típica:**
- `collisionLayer`: Define en qué layer está la entidad (valor único)
- `collidesWith`: Bitmask de layers con las que puede colisionar (suma de valores)

**Ejemplos:**
- Player: `collisionLayer: 1, collidesWith: 2` (colisiona con enemies)
- Enemy: `collisionLayer: 2, collidesWith: 1` (colisiona con player)
- Platform: `collisionLayer: 8, collidesWith: 255` (colisiona con todos)
- Player Bullet: `collisionLayer: 4, collidesWith: 2` (solo colisiona con enemies)

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

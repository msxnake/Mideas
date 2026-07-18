# MSX Screen 2 - Modo Gráfico Completo

## Características Principales

### Resolución y Estructura
- **Resolución**: 256×192 píxeles
- **Colores**: 16 colores simultáneos de la paleta MSX
- **Modo**: Gráfico bitmap (no es modo texto)
- **VRAM requerida**: 16 KB mínimo

### Arquitectura de 3 Bancos (Sectors)

Screen 2 divide la pantalla en **3 sectores verticales de 64 líneas** cada uno:

```
Sector 0: Líneas   0-63  (superior)
Sector 1: Líneas  64-127 (medio)
Sector 2: Líneas 128-191 (inferior)
```

**CRÍTICO**: Cada sector tiene sus propios:
- **Pattern Table** (tabla de patrones)
- **Color Table** (tabla de colores)

Esto permite hasta **768 tiles únicos** (256 tiles × 3 sectores).

### Tables en VRAM

#### 1. Pattern Generator Table (6144 bytes)
- **Dirección base**: Típicamente `#0000`
- **Tamaño**: 6144 bytes (256 tiles × 8 bytes × 3 sectores)
- **Estructura**:
  ```
  Sector 0: #0000 - #07FF (2048 bytes)
  Sector 1: #0800 - #0FFF (2048 bytes)
  Sector 2: #1000 - #17FF (2048 bytes)
  ```
- **Contenido**: Bitmap de 8×8 píxeles por tile (1 bit por píxel)

#### 2. Color Table (6144 bytes)
- **Dirección base**: Típicamente `#2000`
- **Tamaño**: 6144 bytes (igual estructura que patterns)
- **Estructura**:
  ```
  Sector 0: #2000 - #27FF
  Sector 1: #2800 - #2FFF
  Sector 2: #3000 - #37FF
  ```
- **Formato por byte**: `FFFFBBBB`
  - 4 bits altos: Color de primer plano (foreground)
  - 4 bits bajos: Color de fondo (background)

#### 3. Name Table (768 bytes)
- **Dirección base**: Típicamente `#1800`
- **Tamaño**: 768 bytes (32 columnas × 24 filas)
- **Contenido**: IDs de tiles (0-255) para cada posición de pantalla
- **Mapeo**: Posición (x,y) → `NAMETBL + (y * 32) + x`

### Sistema de Colores

**Paleta MSX (16 colores):**
```
0  = Transparente
1  = Negro           #000000
2  = Verde Medio     #3EB847
3  = Verde Claro     #74D07D
4  = Azul Oscuro     #2F2FC1
5  = Azul Claro      #5858FC
6  = Rojo Oscuro     #B63125
7  = Cyan            #68D2DA
8  = Rojo Medio      #FC584A
9  = Rojo Claro      #FF8E81
10 = Amarillo Oscuro #C0BF3B
11 = Amarillo Claro  #E7E474
12 = Verde Oscuro    #309337
13 = Magenta         #B640C8
14 = Gris            #999999
15 = Blanco          #FFFFFF
```

### Ventajas de Screen 2

1. **Máxima flexibilidad gráfica**: Cada línea de 8 píxeles puede tener colores diferentes
2. **768 tiles únicos**: 3× más que otros modos
3. **Ideal para juegos**: Permite gráficos detallados sin repeticiones
4. **Background scrolling**: Posible mediante manipulación de Name Table
5. **Mixing con sprites**: 32 sprites 16×16 simultáneos

### Limitaciones

1. **2 colores por línea de 8 píxeles**: En cada byte de color solo hay FG/BG
2. **No hay color por píxel**: Solo 1 bit por píxel (on/off)
3. **Consume mucha VRAM**: 16 KB total
4. **Lento de actualizar**: 6144 bytes para cambiar patterns completos

### Comparación con Otros Modos

| Modo      | Resolución | Colores/Tile | VRAM  | Uso Típico    |
|-----------|------------|--------------|-------|---------------|
| Screen 1  | 256×192    | 2 por tile   | 6 KB  | Juegos simples|
| Screen 2  | 256×192    | 2 por línea  | 16 KB | Juegos avanzados|
| Screen 3  | 64×48      | 16 por píxel | 12 KB | Gráficos/arte |
| Screen 4  | 256×192    | 2 por línea de patrón | 16 KB | MSX2 tile/pattern (VDP Graphic 3) |
| Screen 5  | 256×212    | 16 por píxel | 27 KB aprox. | MSX2 bitmap (VDP Graphic 4) |

### Uso en Mideas

En Mideas, Screen 2 se usa para:
- **Tile Editor**: Diseño de tiles 8×8 con 2 colores
- **Screen Editor**: Layout de mapas con Name Table
- **TileBanks**: Matrices de IDs de tiles para pantallas
- **HUD**: Renderizado de fuentes usando sectors

### Comandos BIOS Clave

```asm
; Inicializar Screen 2
LD A, 2
CALL CHGMOD          ; Cambiar a modo 2

; Escribir a VRAM
LD HL, PATTERN_DATA
LD DE, #0000         ; Destino VRAM
LD BC, 6144          ; Tamaño patterns
CALL LDIRVM          ; Copiar a VRAM

; Escribir a Color Table
LD HL, COLOR_DATA
LD DE, #2000
LD BC, 6144
CALL LDIRVM

; Escribir a Name Table
LD HL, SCREEN_LAYOUT
LD DE, #1800
LD BC, 768
CALL LDIRVM
```

### Ejemplo Práctico: Tile en Sector 1

Si quieres dibujar un tile con ID 5 en la fila 10 (sector 1):

1. **Pattern data** va a: `#0800 + (5 * 8)` = `#0828`
2. **Color data** va a: `#2800 + (5 * 8)` = `#2828`
3. **Name Table** posición (col=0, row=10): `#1800 + (10 * 32)` = `#1940`
   - Escribir valor `05` en esa posición

### Trucos Avanzados

1. **Fuentes personalizadas**: Usar sectores diferentes para variaciones de tiles
2. **Animación eficiente**: Cambiar solo Name Table (768 bytes) en lugar de patterns
3. **Scroll por tiles**: Modificar Name Table cíclicamente
4. **Paleta por zona**: Diferentes colores en sectores distintos del mismo tile

### Fórmulas Útiles

#### Calcular dirección de Pattern en VRAM
```
pattern_addr = BASE_PATTERN + (sector * 2048) + (tile_id * 8) + row
donde:
  BASE_PATTERN = #0000
  sector = tile_row / 8  (fila de pantalla / 8)
  tile_id = 0-255
  row = 0-7 (fila dentro del tile)
```

#### Calcular dirección de Color en VRAM
```
color_addr = BASE_COLOR + (sector * 2048) + (tile_id * 8) + row
donde:
  BASE_COLOR = #2000
```

#### Calcular posición en Name Table
```
name_addr = BASE_NAME + (tile_row * 32) + tile_col
donde:
  BASE_NAME = #1800
  tile_row = 0-23 (24 filas)
  tile_col = 0-31 (32 columnas)
```

#### Codificar byte de color
```
color_byte = (foreground << 4) | background
Ejemplo: FG=15 (blanco), BG=1 (negro) → #F1
```

### Optimizaciones de Rendimiento

1. **Usar LDIRVM en lugar de WRTVRM**: Copia en bloque es más rápida
2. **Actualizar solo Name Table**: Para animación de fondos
3. **Precalcular direcciones**: Evitar cálculos en tiempo real
4. **Agrupar escrituras VRAM**: Minimizar cambios de modo VDP
5. **Cachear tiles comunes**: Reutilizar IDs en Name Table

### Debugging Screen 2

**Verificar modo activo:**
```asm
CALL GTSTCK    ; Leer VDP status
AND #0E        ; Bits 1-3 = modo
CP #02         ; ¿Es Screen 2?
```

**Dump de VRAM para inspección:**
```asm
; Leer 16 bytes de VRAM desde #0000
LD HL, #0000
LD BC, 16
LD DE, BUFFER
CALL LDIRMV    ; VRAM → RAM
```

### Referencias Rápidas

**Direcciones VRAM típicas:**
```
Pattern Table:  #0000 - #17FF (6144 bytes)
Name Table:     #1800 - #1AFF (768 bytes)
Color Table:    #2000 - #37FF (6144 bytes)
Sprite Attr:    #1B00 - #1B7F (128 bytes)
Sprite Pattern: #3800 - #3FFF (2048 bytes)
```

**Registros VDP críticos:**
```
R#0: Modo base
R#1: Modo + enable sprites/display
R#2: Name Table base / 1024
R#3: Color Table base / 64
R#4: Pattern Table base / 2048
R#5: Sprite Attr Table base / 128
R#6: Sprite Pattern base / 2048
R#7: Border/Text color
```

---

**En resumen**: Screen 2 es el modo gráfico más usado en MSX1 para juegos porque ofrece el mejor balance entre flexibilidad gráfica, colores y rendimiento. Sus 3 sectores permiten 768 tiles únicos, ideal para juegos con gráficos ricos sin repeticiones.

## Relación con Mideas

Mideas MSX utiliza Screen 2 como modo principal para:
- Renderizado de juegos en el modo Play
- Generación de código ASM para ROMs MSX
- Tile Editor y Screen Editor
- Sistema de fuentes y HUD

Todo el pipeline de generación de código en `utils/msxModularGenerator.ts` está optimizado para Screen 2, generando los datos de patterns, colors y name table en el formato correcto para este modo.

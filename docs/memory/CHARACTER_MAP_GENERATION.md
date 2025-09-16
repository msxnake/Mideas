# Generación de Mapas de Caracteres MSX

## Problema Original

El generador de screens estaba produciendo datos incorrectos:

```assembly
; ❌ INCORRECTO - IDs de tiles con timestamps
SCREEN_PANTALLA1_DATA:
    DB tile_1757845467414, tile_1757845467414, tile_1757845467414
    DB tile_1757852050495, tile_1757852050495, tile_1757852050495
```

```assembly
; ❌ INCORRECTO - Todos valores #FF
SCREEN_PANTALLA1_LAYOUT:
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
    DB #FF,#FF,#FF,#FF,#FF,#FF,#FF,#FF
```

## Solución Implementada

### 1. Comprensión del Problema

**MSX requiere mapas de CARACTERES, no tiles:**
- Cada carácter MSX = 8x8 pixels
- Cada tile puede estar compuesto por múltiples caracteres
- Un tile de 16x16 = 4 caracteres (2x2)
- Un tile de 32x16 = 8 caracteres (4x2)

### 2. Cambios en `msxModularGenerator.ts`

**Antes:**
```typescript
// ❌ Mapeo simple tile -> índice
const tileIdToIndex = new Map<string, number>();
Array.from(uniqueTiles).forEach((tileId, index) => {
  tileIdToIndex.set(tileId, index + 1);
});
```

**Después:**
```typescript
// ✅ Tile banks automáticos con character mapping
const mainBank: TileBank = {
  ...DEFAULT_TILE_BANKS_CONFIG[1],
  assignedTiles: {},
  charsetRangeStart: 0,
  charsetRangeEnd: 255
};

let nextCharCode = 0;
Array.from(uniqueTileIds).forEach((tileId) => {
  const tileAsset = analysis.tiles?.find(t => t.id === tileId);
  if (tileAsset) {
    // Calcular caracteres necesarios
    const charsWide = Math.ceil(tileAsset.width / 8);
    const charsHigh = Math.ceil(tileAsset.height / 8);

    mainBank.assignedTiles[tileId] = {
      charCode: nextCharCode,
      assignedAt: Date.now()
    };

    nextCharCode += charsWide * charsHigh;
  }
});
```

### 3. Uso de `generateScreenMapLayoutBytes`

**Clave:** Usar la función exacta del Screen Editor con tile banks configurados:

```typescript
const layoutBytes = generateScreenMapLayoutBytes(
  screen,
  analysis.tiles || [],
  tileBanks, // ✅ Tile banks configurados
  'SCREEN 2 (Graphics I)' // ✅ Modo correcto
);
```

**Esta función internamente:**
1. Encuentra cada tile en `assignedTiles`
2. Obtiene el `baseCharCode` del tile
3. Calcula el character code específico: `baseCharCode + (subY * widthInChars) + subX`
4. Retorna character codes individuales, no tile IDs

### 4. Debugging Implementado

```typescript
console.log(`🔍 Screen ${screen.name}: Found ${uniqueTileIds.size} unique tiles`);
console.log('Available tiles in analysis:', analysis.tiles?.map(t => `${t.name} (${t.id})`));
console.log(`📌 Assigned tile ${tileAsset.name} to charCode ${nextCharCode}`);
console.log(`📊 Generated ${mapIndices.length} bytes: ${nonFFCount} non-FF`);
```

## Resultado Final

```assembly
; ✅ CORRECTO - Mapa de caracteres MSX
SCREEN_PANTALLA1_LAYOUT:
    DB #00,#01,#02,#03,#04,#05,#06,#07,#08,#09,#0A,#0B
    DB #10,#11,#12,#13,#14,#15,#16,#17,#18,#19,#1A,#1B
    DB #20,#21,#22,#23,#24,#25,#26,#27,#28,#29,#2A,#2B
```

Donde cada valor `#??` representa un **carácter individual de 8x8 pixels** en VRAM.

## Archivos Modificados

- `utils/msxModularGenerator.ts` - Generación automática de tile banks
- Imports añadidos: `DEFAULT_TILE_BANKS_CONFIG`, `TileBank`

## Conceptos Clave

1. **Tile vs Character**: Tiles son elementos gráficos, caracteres son unidades de 8x8 en VRAM
2. **Character Mapping**: Conversión automática de tiles a rangos de caracteres
3. **Tile Banks**: Estructura que mapea tiles a character codes
4. **Screen Editor Compatibility**: Usa la misma lógica que "Download ASM"

## Validación

El sistema ahora genera mapas de caracteres compatibles con:
- Hardware MSX SCREEN 2
- Rutinas de carga de VRAM (`LDIRVM`)
- Inicialización de pattern/color tables
- Código assembly estándar MSX
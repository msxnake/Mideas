# Plan pendiente: ZX0 para block maps 2x2 / 4x4 del Screen Editor

## Objetivo

Añadir compresion ZX0 para los fondos exportados como `blocks2x2` y `blocks4x4` desde `Screen Editor`, y exponer esa opcion en la UI de export/checkpoint junto a las opciones actuales de `screens`, `effects`, `behaviorMaps`, `tilePatterns`, `tileColors`, etc.

El objetivo practico es trabajar sobre todo en ROMs `simple32k` y `plain48k`.

## Fuera de alcance en esta iteracion

- No tocar megarom.
- No rehacer la logica de `raw`.
- No cambiar la semantica actual de carga de pantallas.
- No mezclar esta tarea con cambios de Active Area o HUD mas alla de lo ya existente.

## Estado actual encontrado

### Ya existe

- `Screen Editor` ya soporta `raw`, `blocks2x2` y `blocks4x4`.
- El generador de pantallas ya emite `BLOCK_CATALOG` y `BLOCK_MAP`.
- El runtime ya sabe expandir `BLOCK_CATALOG` + `BLOCK_MAP` hacia `runtime_background_layout`.

### Falta

- La UI ZX0 solo contempla `screens/effects/behaviorMaps/tilePatterns/tileColors/fontPatterns/fontColors/spritePatterns/presentationScreen`.
- La capa de ZX0 del servidor solo detecta y comprime:
  - `SCREEN_*_LAYOUT`
  - `SCREEN_*_EFFECTS_LAYOUT`
  - `BEHAVIOR_*_DATA`
  - patrones, colores, fuentes, sprites y presentation screen
- No hay ruta ZX0 especifica para:
  - `SCREEN_*_BLOCK_CATALOG`
  - `SCREEN_*_BLOCK_MAP`

## Archivos clave

- `components/modals/CodeExportModal.tsx`
- `server/server.js`
- `components/editors/ScreenEditor.tsx`
- `utils/msxGenerator/generators/screensGenerator.ts`
- `utils/screenOptimization/blockMapBuilder.ts`
- `types.ts`

## Estrategia propuesta

### 1. UI

Añadir una opcion nueva en ZX0, separada de `Screens (layout maps)`.

Nombre sugerido:

- `Screen block maps (2x2/4x4)`

Regla importante:

- `Screens (layout maps)` debe seguir significando solo `SCREEN_*_LAYOUT` raw.
- La nueva casilla debe controlar solo `SCREEN_*_BLOCK_CATALOG` y `SCREEN_*_BLOCK_MAP`.

Esto evita romper proyectos que hoy usan `raw` y ya dependen del comportamiento actual.

### 2. Modelo de opciones ZX0

Extender `Zx0CompressionOptions` con un campo nuevo, por ejemplo:

- `screenBlockMaps: boolean`

Actualizar tambien:

- `DEFAULT_ZX0_OPTIONS`
- boton `All`
- boton `None`
- render de checkboxes

## 3. Servidor: deteccion de bloques nuevos

En `server/server.js`, añadir recogida de bloques ASM para:

- `SCREEN_[A-Z0-9_]+_\\d+_BLOCK_CATALOG`
- `SCREEN_[A-Z0-9_]+_\\d+_BLOCK_MAP`

No deben entrar dentro de `layoutBlocks` para no mezclar `raw` con `block maps`.

Crear grupos separados:

- `blockCatalogBlocks`
- `blockMapBlocks`

o bien un grupo unificado con metadata suficiente para distinguir ambos tipos.

## 4. Servidor: compresion ZX0

Si la nueva opcion esta activa:

- comprimir `BLOCK_CATALOG`
- comprimir `BLOCK_MAP`

Actualizar contadores/progreso/info para que el resumen refleje estos bloques.

No reutilizar `compressedLayoutLabels` para estos recursos porque semanticamente no son `LAYOUT` raw.

## 5. Servidor: parcheo del loader

La carga de pantallas con block map ya existe en el runtime. Solo hay que adaptar el origen de datos cuando esos labels esten comprimidos.

Para pantallas con `BLOCK_LAYOUT_PRESENT = 1`:

- descomprimir `SCREEN_*_BLOCK_CATALOG` en `runtime_effects_layout`
- descomprimir `SCREEN_*_BLOCK_MAP` en `runtime_screen_layout`
- dejar despues la llamada existente a `expand_screen_block_layout_to_background`

Mantener el flujo actual:

- expandir a `runtime_background_layout`
- copiar luego a `runtime_screen_layout`

No reescribir `expand_screen_block_layout_to_background`.

## 6. Compatibilidad estricta

Estas rutas deben permanecer intactas:

- `raw` en `Screen Editor`
- export manual desde `ExportLayoutASMModal`
- compresion ZX0 actual de `SCREEN_*_LAYOUT`
- `effects`
- `behaviorMaps`
- `tilePatterns`
- `tileColors`
- `fontPatterns`
- `fontColors`
- `spritePatterns`
- `presentationScreen`

## 7. Ambito inicial de ROM

Implementar y validar solo para:

- `simple32k`
- `plain48k`

Megarom se deja pendiente porque su gestion de recursos y bancos es mas sensible.

## Pruebas recomendadas

### No regresion

- Proyecto `simple32k` con pantallas `raw`, export sin la nueva casilla.
- Proyecto `simple32k` con pantallas `raw`, export con la nueva casilla activada.
- Verificar que no cambia nada cuando no existen block maps.

### Casos nuevos

- Proyecto con una pantalla `blocks2x2` y ZX0 activado.
- Proyecto con una pantalla `blocks4x4` y ZX0 activado.
- Proyecto mixto con pantallas `raw` y `block map`.
- Proyecto `plain48k` con al menos una pantalla `blocks4x4`.

### Verificaciones

- El fondo reconstruido debe coincidir visualmente con la pantalla original.
- `collision` y `effects` deben seguir funcionando igual.
- El flujo HUD/no-HUD no debe alterarse.
- No debe romperse la carga de pantallas `raw`.

## Riesgo principal a vigilar

Hay una diferencia intencionada entre:

- el preview/analisis del editor
- y el generador runtime final, que trabaja sobre layout 32x24 completo

No mezclar esta tarea con cambios de semantica del `activeArea`, porque eso eleva mucho el riesgo de regresion.

## Orden sugerido de implementacion

1. Extender `Zx0CompressionOptions` y la UI.
2. Detectar `BLOCK_CATALOG` y `BLOCK_MAP` en `server/server.js`.
3. Comprimirlos con ZX0 y reemplazar bloques ASM.
4. Parchear `load_screen_*` para descompresion previa a la expansion.
5. Validar `simple32k`.
6. Validar `plain48k`.

## Criterio de hecho

La tarea se considera terminada cuando:

- existe casilla ZX0 especifica para block maps
- `raw` sigue funcionando exactamente igual
- `blocks2x2` y `blocks4x4` cargan correctamente comprimidos en `simple32k` y `plain48k`
- no se introduce soporte parcial para megarom en esta misma entrega

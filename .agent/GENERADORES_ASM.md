# GENERADORES ASM MSX - DOCUMENTACIÓN TÉCNICA

## 📍 Archivo Principal Orquestador
**Ubicación:** `utils/msxGenerator/index.ts`

### Funciones Principales
- `generateModularASM(projectName, assets, config)` - Genera ASM desde assets directos
- `generateModularASMFromSummary(summary, config)` - Genera ASM desde project summary

---

## 🔢 ORDEN DE GENERACIÓN (CRÍTICO - NO MODIFICAR)

Los generadores se ejecutan en este orden exacto (líneas 142-161 de `index.ts`):

### 1. **bios.asm**
- **Generador:** `generators/biosGenerator.ts` → `generateBIOSFile()`
- **Propósito:** Definiciones de funciones y direcciones del BIOS de MSX
- **Contenido:** 
  - Rutinas BIOS (CHGMOD, CHGCLR, WRTVDP, etc.)
  - Registros VDP (R#0-R#7)
  - Variables del sistema (HKEY, CLIKSW, BAKCLR, BDRCLR)
- **Dependencias:** Ninguna (DEBE SER PRIMERO)

### 2. **constants.asm**
- **Generador:** `generators/constantsGenerator.ts` → `generateConstantsFile(analysis)`
- **Propósito:** Constantes del proyecto
- **Contenido:**
  - Estados de flujo (FLOW_STATE_*)
  - Máscaras de componentes (COMP_MASK_*)
  - Constantes de GameFlow
  - Enumeraciones y flags
- **Dependencias:** BIOS

### 3. **variables.asm**
- **Generador:** `generators/variablesGenerator.ts` → `generateVariablesFile(analysis)`
- **Propósito:** Definiciones de variables RAM usando direcciones EQU
- **Contenido:**
  - Variables de sistema (current_flow_state, prev_flow_state)
  - Variables de entidades (SoA layout: entity_x_pos, entity_y_pos, etc.)
  - Variables de componentes (entity_comp_masks, entity_sprite_id, etc.)
  - Variables de GameFlow y State Machines
- **Dependencias:** Constants
- **Nota:** Usa Structure of Arrays (SoA) para optimización Z80

### 4. **header.asm**
- **Generador:** `generators/headerGenerator.ts` → `generateHeaderFile(projectName, analysis)`
- **Propósito:** Cabecera ROM MSX con firma "AB" e inicialización
- **Contenido:**
  - Header del cartucho MSX (firma "AB", punteros)
  - Rutina `init_rom` (configuración VDP, modo Screen 2, sprites 16x16)
  - Salto a `main_program`
- **Dependencias:** Variables
- **Configuración VDP:**
  - Registro #5: Sprite Attribute Table = #1B00
  - Registro #6: Sprite Pattern Table = #3800
  - Registro #1: Sprites 16x16, interrupciones habilitadas

### 5. **patterns.asm**
- **Generador:** `generators/patternsGenerator.ts` → `generatePatternsFile(analysis)`
- **Propósito:** Datos de patrones de tiles (8x8 píxeles)
- **Contenido:**
  - Pattern data de tiles
  - Rutinas de carga a VRAM (CHRTBL2 + offset)
- **Dependencias:** Header
- **Condición:** Solo si `analysis.tiles.length > 0`
- **Offset:** Tiles se cargan desde carácter 128 para evitar conflictos con fuentes

### 6. **colors.asm**
- **Generador:** `generators/colorsGenerator.ts` → `generateColorsFile(analysis)`
- **Propósito:** Datos de colores de tiles
- **Contenido:**
  - Color data de tiles (foreground/background)
  - Rutinas de carga a VRAM (CLRTBL2 + offset)
- **Dependencias:** Patterns
- **Condición:** Solo si `analysis.tiles.length > 0`

### 7. **sprites.asm**
- **Generador:** `generators/spritesGenerator.ts` → `generateSpritesFile(analysis)`
- **Propósito:** Datos y sistema de sprites (16x16 multi-layer)
- **Contenido:**
  - Sprite patterns (4 layers por sprite 16x16)
  - Configuración de sprites por entidad
  - Rutinas: `init_sprites`, `load_sprite_patterns`, `update_sprites_to_vram`
  - Tabla `sprite_attributes` (128 bytes: 32 sprites × 4 bytes)
- **Dependencias:** Colors
- **Condición:** Solo si `analysis.sprites.length > 0`
- **Formato:** Cada sprite 16x16 = 4 patterns MSX (8x8 cada uno)

### 8. **components.asm**
- **Generador:** `generators/componentsGenerator.ts` → `generateComponentsFile(analysis)`
- **Propósito:** Sistema ECS (Entity Component System)
- **Contenido:**
  - `init_components` (inicialización de sistemas)
  - Sistemas de componentes:
    - Position (actualización de posiciones)
    - Sprite (renderizado)
    - Movement (velocidad)
    - Jump (salto con doble salto)
    - Gravity (física)
    - Collision (detección)
    - Input (controles)
    - Animation (frames de sprite)
  - `update_components` (actualiza todos los sistemas activos)
- **Dependencias:** Sprites
- **Optimización:** Solo genera código para componentes usados en el proyecto

### 9. **entities.asm**
- **Generador:** `generators/entitiesGenerator.ts` → `generateEntitiesFile(analysis)`
- **Propósito:** Definiciones y configuración de entidades
- **Contenido:**
  - Entity templates (configuración inicial)
  - `init_entities` (spawn de entidades)
  - Configuración de componentes por entidad
  - Asignación de sprites a entidades
- **Dependencias:** Components
- **Formato:** Usa máscaras de bits para componentes activos

### 10. **worlds.asm**
- **Generador:** `generators/worldGenerator.ts` → `generateWorldsFile(analysis)`
- **Propósito:** Mapas de mundo y transiciones entre pantallas
- **Contenido:**
  - WorldMap data (nodos de pantallas)
  - Conexiones entre pantallas
  - Rutinas `load_world_X` (carga mundo y primera pantalla)
  - Sistema de transiciones
- **Dependencias:** Entities
- **Condición:** Solo si hay WorldMaps en el proyecto

### 11. **screens.asm**
- **Generador:** `generators/screensGenerator.ts` → `generateScreensFile(analysis)`
- **Propósito:** Layouts de pantallas y mapas
- **Contenido:**
  - Screen map data (32×24 tiles)
  - Rutinas `load_screen_X` (carga pantalla a VRAM)
  - `set_screen_colors` (configura colores VDP)
- **Dependencias:** Worlds
- **Condición:** Solo si `analysis.screenMaps.length > 0`
- **Formato:** Cada pantalla = 768 bytes (32 columnas × 24 filas)

### 12. **font.asm**
- **Generador:** `generators/fontGenerator.ts` → `generateFontFile(analysis)`
- **Propósito:** Sistema de fuentes personalizadas para Screen 2
- **Contenido:**
  - Font patterns (caracteres 8x8)
  - `init_font_system` (carga fuente a VRAM)
  - `print_text` (renderizado de texto)
  - Soporte para TileBank fonts
- **Dependencias:** Screens
- **Rango:** Caracteres 0-127 (tiles usan 128-255)

### 13. **hud.asm**
- **Generador:** `generators/hudGenerator.ts` → `generateHudFile(analysis)`
- **Propósito:** Sistema de HUD (Heads-Up Display)
- **Contenido:**
  - HUD elements (texto, variables, iconos)
  - `render_hud` (dibuja HUD en pantalla)
  - Actualización de variables dinámicas (score, lives, etc.)
- **Dependencias:** Font
- **Condición:** Solo si hay elementos HUD en screenMaps

### 14. **menus.asm**
- **Generador:** `generators/menusGenerator.ts` → `generateMenusFile(analysis)`
- **Propósito:** Sistema de menús y UI
- **Contenido:**
  - Menu definitions (de GameFlow SubMenu/Text nodes)
  - Navegación y selección
  - Rutinas `show_menu_X`, `show_text_X`
  - Configuración de colores (background/border)
- **Dependencias:** HUD
- **Condición:** Solo si hay nodos SubMenu/Text en GameFlow

### 15. **statemachine.asm**
- **Generador:** `generators/stateMachineGenerator.ts` → `generateStateMachineSystem(stateMachines)`
- **Propósito:** Motor de State Machines (IA de entidades)
- **Contenido:**
  - Runtime engine (`update_state_machines`)
  - Dispatch tables (acciones y condiciones)
  - State data (estados, transiciones)
  - Handlers de acciones (MOVE, JUMP, SPAWN, etc.)
  - Handlers de condiciones (KEY_PRESSED, CAN_MOVE, HAS_COLLISION, etc.)
- **Dependencias:** Menus
- **Condición:** Solo si `analysis.stateMachines` existe
- **Formato:** Cada estado tiene tabla de transiciones con condiciones

### 16. **gameflow.asm**
- **Generador:** `generators/gameFlowGenerator.ts` → `generateGameFlowFile(analysis)`
- **Propósito:** Sistema completo de GameFlow (flujo del juego)
- **Contenido:**
  - **Funciones principales:**
    - `load_game_screen` (carga pantalla según GameFlow)
    - `execute_gameflow_start` (ejecuta nodo inicial)
    - `execute_gameflow_node` (ejecuta un nodo)
  - **Handlers de ejecución:**
    - `execute_start_node`
    - `execute_world_link_node`
    - `execute_screen_node`
    - `execute_menu_node`
  - **Funciones auxiliares:**
    - `load_default_screen`
    - `find_next_gameflow_node`
    - `load_referenced_screen`
    - `show_menu_interface`
    - `show_no_content_message`
    - `show_end_screen`
  - **Node handlers (máquina de estados):**
    - Start: Salta al primer nodo conectado
    - WorldLink: Carga mundo y entra al main_loop
    - SubMenu: Muestra menú
    - Text: Muestra texto
    - Transition: Efectos de transición
    - Group: GameFlow anidado
    - End: Pantalla de fin
    - Restart: Reinicia el juego (jp init_rom)
    - Waypoint: Nodo de enrutamiento
    - IfThenElse: Condicional (compara variables globales)
    - Globals: Asigna valores a variables globales
- **Dependencias:** State Machines
- **Condición:** Siempre se genera (stub si no hay GameFlow)
- **Operadores soportados:** ==, !=, >, <, >=, <=
- **Nota:** Ahora es un archivo SEPARADO e INDEPENDIENTE (antes estaba dentro de main.asm)

### 17. **main.asm**
- **Generador:** `generators/mainGenerator.ts` → `generateMainFile(projectName, analysis)`
- **Propósito:** Archivo principal con includes ordenados y main_program
- **Contenido:**
  - **Includes ordenados** de todos los archivos anteriores (1-16)
  - **main_program** (entry point del juego)
    - Inicialización de sistemas (`init_game_systems`)
    - Inicialización de fuentes (`init_font_system`)
    - Inicialización de GameFlow
    - Llamada a `load_game_screen`
  - **main_loop** (bucle principal)
    - `halt` (espera V-Blank)
    - `update_current_state`
    - `render_frame`
  - **Game system functions:**
    - `init_game_systems` (inicializa components y entities)
    - `update_current_state` (actualiza todos los componentes)
    - `render_frame` (renderizado)
- **Dependencias:** Todos los archivos anteriores (1-16)
- **Flujo:** init_rom → main_program → load_game_screen → main_loop
- **Nota:** Ya NO contiene código de GameFlow inline (ahora está en gameflow.asm)

### 18. **unitedFiles.asm** (Opcional)
- **Generador:** `generators/unifiedGenerator.ts` → `generateUnifiedFile(files, projectName, analysis)`
- **Propósito:** Archivo unificado todo-en-uno (para compilación directa)
- **Contenido:** Todos los archivos anteriores combinados en orden
- **Dependencias:** Todos los archivos
- **Condición:** Solo si `config.generateUnified === true`
- **Uso:** Facilita compilación con glass.jar sin múltiples includes

---

## 🔄 FLUJO DE EJECUCIÓN

```
1. analyzeProject(projectName, assets)
   ↓ Analiza assets y detecta componentes, entidades, sprites, etc.
   ↓
2. Genera cada archivo en orden (1-17)
   ↓ Cada generador recibe ProjectAnalysis
   ↓
3. Si config.generateUnified → genera unitedFiles.asm
   ↓ Combina todos los archivos en uno solo
   ↓
4. Retorna GeneratedASMFiles object
   ↓ Objeto con todos los archivos .asm generados
```

---

## 🔑 DEPENDENCIAS CRÍTICAS

El orden es **ABSOLUTAMENTE CRÍTICO** porque:

1. **BIOS** debe estar primero (define rutinas base del MSX)
2. **Constants** depende de BIOS (usa direcciones BIOS)
3. **Variables** usa constants para direcciones EQU
4. **Header** usa variables para init_rom
5. **Patterns/Colors** deben ir antes de Sprites (sprites usan patterns)
6. **Components** necesita sprites para renderizado
7. **Entities** usa components para configuración
8. **Screens** usa entities para spawn
9. **Font** debe ir antes de HUD (HUD usa fuentes)
10. **HUD** debe ir antes de Menus (menus usan HUD)
11. **State Machines** debe ir antes de GameFlow (GameFlow puede usar SM)
12. **Main** incluye todos en orden y define el entry point

**⚠️ ADVERTENCIA:** Cambiar este orden causará errores de compilación en glass.jar

---

## 📊 ANÁLISIS DE PROYECTO

La función `analyzeProject()` (en `utils/asmTemplateGenerator.ts`) detecta:

- **Sprites:** Extrae assets tipo 'Sprite'
- **Tiles:** Extrae assets tipo 'Tile'
- **Screens:** Extrae assets tipo 'ScreenMap'
- **Entities:** Extrae templates de entidades
- **Components:** Analiza componentes usados en entidades
- **GameFlow:** Extrae asset tipo 'GameFlow'
- **State Machines:** Extrae assets tipo 'StateMachine'
- **Fonts:** Extrae assets tipo 'Font'
- **WorldMaps:** Extrae assets tipo 'WorldMap'
- **Global Variables:** Extrae variables globales definidas

---

## 🎯 OPTIMIZACIONES

### Components.asm
- Solo genera código para componentes **realmente usados**
- Analiza máscaras de componentes de todas las entidades
- Reduce tamaño del ROM significativamente

### Patterns/Colors.asm
- Solo se generan si hay tiles en el proyecto
- Tiles se cargan desde carácter 128 (evita conflicto con fuentes)

### Sprites.asm
- Solo se genera si hay sprites en el proyecto
- Sprites 16x16 se dividen en 4 patterns 8x8 automáticamente

### State Machines.asm
- Solo se genera si hay State Machines definidas
- Dispatch tables optimizadas para Z80

---

## 🐛 NOTAS DE DEPURACIÓN

### Problemas Comunes

1. **Sprites no aparecen:**
   - Verificar VDP Registers #5 y #6 en header.asm
   - Verificar que `update_sprites_to_vram` se llama después de init
   - Verificar índices de patterns (multiplicar por 4 para 16x16)

2. **Texto no visible:**
   - Verificar que fuentes usan caracteres 0-127
   - Verificar que tiles usan caracteres 128-255
   - Verificar que `init_font_system` se llama antes de `print_text`

3. **GameFlow no funciona:**
   - Verificar que `execute_gameflow_start` se llama en `load_game_screen`
   - Verificar conexiones entre nodos
   - Verificar que variables globales existen en analysis

4. **Errores de compilación:**
   - Verificar orden de includes en main.asm
   - Verificar que todas las etiquetas están definidas
   - Verificar que no hay símbolos redefinidos

---

## 📝 CONVENCIONES DE NOMBRES

### Etiquetas (Labels)
- **Funciones:** `snake_case` (ej: `init_sprites`, `load_screen_1`)
- **Variables:** `snake_case` (ej: `entity_x_pos`, `current_flow_state`)
- **Constantes:** `UPPER_SNAKE_CASE` (ej: `FLOW_STATE_GAME`, `COMP_MASK_SPRITE`)
- **GameFlow nodes:** `gameflow_node_<id>` (ej: `gameflow_node_gfn_1764189161182`)

### Conversión de Nombres
- Variables de GameFlow: `Goal` → `global_var_goal`
- Constantes de GameFlow: `Completed` → `GOAL_COMPLETED`
- Rutinas de pantallas: `Pantalla1` → `load_screen_pantalla1`
- Rutinas de mundos: `worldmap_123` → `load_world_worldmap_123`

---

## 🔧 CONFIGURACIÓN

### MSXModularConfig
```typescript
interface MSXModularConfig {
  generateUnified?: boolean;    // Genera unitedFiles.asm
  targetFormat?: 'konami' | 'ascii8' | 'ascii16';  // Formato de cartucho
}
```

### Uso
```typescript
const files = generateModularASM(projectName, assets, {
  generateUnified: true,
  targetFormat: 'konami'
});
```

---

## 📚 REFERENCIAS

- **Archivo principal:** `utils/msxGenerator/index.ts`
- **Análisis:** `utils/asmTemplateGenerator.ts`
- **Tipos:** `utils/msxGenerator/types/asmTypes.ts`
- **Utilidades:** `utils/msxGenerator/utils/`
  - `asmFormatters.ts` - Formateo de código ASM
  - `asmNaming.ts` - Conversión de nombres
  - `componentAnalyzer.ts` - Análisis de componentes

---

**Última actualización:** 2025-12-08
**Versión:** 1.0
**Estado:** Documentación base - Se irá actualizando durante depuración

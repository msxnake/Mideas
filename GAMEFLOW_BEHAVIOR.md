# 🎮 GameFlow - Comportamiento Entre Nodos

## 📋 Estructura de un Nodo

Cada nodo tiene 3 componentes:

```asm
gameflow_node_XXX:
    db NODE_TYPE              ; +0: Tipo de nodo (1 byte)
    dw data_pointer           ; +1-2: Puntero a datos (2 bytes)
    dw connection_table       ; +3-4: Tabla de conexiones (2 bytes)
```

---

## 🔄 Flujo de Ejecución Completo

### 1️⃣ Inicio del Juego

```asm
gameflow_start:
    ld hl, gameflow_node_START    ; Cargar nodo de inicio
    jp gameflow_execute_node      ; Ejecutar
```

### 2️⃣ Ejecución de un Nodo

```asm
gameflow_execute_node:
    ; 1. Lee tipo de nodo
    ld a, (hl)                    ; A = tipo (byte 0)
    inc hl

    ; 2. Lee puntero a datos
    ld e, (hl)                    ; DE = data pointer
    inc hl
    ld d, (hl)
    inc hl

    ; 3. Lee tabla de conexiones
    ld c, (hl)                    ; BC = connection table
    inc hl
    ld b, (hl)

    ; 4. Dispatcher a handler específico
    ; Compara A con cada tipo y salta
    cp NODE_TYPE_START
    jp z, gameflow_handle_start

    cp NODE_TYPE_WORLDLINK
    jp z, gameflow_handle_worldlink

    ; ... etc
```

### 3️⃣ Handler Específico del Nodo

Cada handler:
1. **Recibe**: `DE` = datos, `BC` = tabla de conexiones
2. **Procesa**: Ejecuta la lógica del nodo
3. **Busca**: Siguiente nodo usando conexiones
4. **Salta**: Al siguiente nodo con `jp gameflow_execute_node`

**Ejemplo - Nodo Start:**
```asm
gameflow_handle_start:
    ; 1. Procesar (Start no hace nada)

    ; 2. Obtener siguiente nodo
    call gameflow_get_default_connection
    ; HL ahora contiene dirección del siguiente nodo

    ; 3. Verificar si existe
    ld a, h
    or l
    ret z                         ; Si HL=0, terminar

    ; 4. Ejecutar siguiente nodo
    jp gameflow_execute_node      ; HL ya tiene el nodo
```

### 4️⃣ Búsqueda de Conexiones

**Conexión por Defecto:**
```asm
gameflow_get_default_connection:
    ; BC = tabla de conexiones
    ; Formato tabla:
    ;   db CONNECTION_TYPE
    ;   dw NODE_ADDRESS
    ;   db CONNECTION_END (255)

    ld h, b
    ld l, c                       ; HL = tabla

    ld a, (hl)                    ; Lee tipo
    cp CONNECTION_END
    jr z, .no_connection          ; Si es END, no hay conexión

    inc hl
    ld a, (hl)                    ; Lee dirección baja
    inc hl
    ld h, (hl)                    ; Lee dirección alta
    ld l, a                       ; HL = dirección del nodo
    ret

.no_connection:
    ld hl, 0                      ; HL = 0 (sin conexión)
    ret
```

**Conexión por Tipo (ej: THEN/ELSE):**
```asm
gameflow_get_connection_by_type:
    ; A = tipo a buscar
    ; BC = tabla

    ld d, a                       ; Guardar tipo
    ld h, b
    ld l, c

.search_loop:
    ld a, (hl)                    ; Lee tipo de entrada
    cp CONNECTION_END
    jr z, .not_found

    cp d                          ; ¿Es el tipo buscado?
    jr z, .found

    ; Siguiente entrada (skip 3 bytes)
    ld bc, 3
    add hl, bc
    jr .search_loop

.found:
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ret

.not_found:
    ld hl, 0
    ret
```

---

## 🎯 Tipos de Comportamiento Entre Nodos

### A) Flujo Lineal (Start → WorldLink)

```
┌─────────┐
│  Start  │──────┐
└─────────┘      │ CONNECTION_DEFAULT
                 ↓
           ┌───────────┐
           │ WorldLink │
           └───────────┘
```

**ASM Generado:**
```asm
; Nodo Start
gameflow_node_start:
    db NODE_TYPE_START
    dw gameflow_no_data
    dw start_conn

start_conn:
    db CONNECTION_DEFAULT         ; Tipo 0
    dw gameflow_node_worldlink    ; Siguiente
    db CONNECTION_END             ; Fin tabla

; Nodo WorldLink
gameflow_node_worldlink:
    db NODE_TYPE_WORLDLINK
    dw worldlink_data
    dw worldlink_conn
```

**Ejecución:**
```
1. Execute Start
2. Start handler → get_default_connection
3. HL = gameflow_node_worldlink
4. jp gameflow_execute_node (con HL = worldlink)
5. Execute WorldLink
6. WorldLink inicia game loop (NO retorna)
```

### B) Branching Condicional (IfThenElse)

```
                ┌──────────────┐
                │  IfThenElse  │
                └──────┬───────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
    [condición]                 [condición]
     verdadera                    falsa
         │                           │
         ↓                           ↓
    ┌─────────┐                ┌─────────┐
    │  THEN   │                │  ELSE   │
    └─────────┘                └─────────┘
```

**ASM Generado:**
```asm
gameflow_node_ifthenelse:
    db NODE_TYPE_IFTHENELSE
    dw ifthenelse_data
    dw ifthenelse_conn

ifthenelse_data:
    dw global_var_score           ; Variable a comparar
    db 100                        ; Valor de comparación
    db 0                          ; Operador (0=equals)

ifthenelse_conn:
    db CONNECTION_THEN            ; Tipo 1
    dw gameflow_node_victory      ; Si score == 100
    db CONNECTION_ELSE            ; Tipo 2
    dw gameflow_node_continue     ; Si score != 100
    db CONNECTION_END
```

**Ejecución:**
```asm
gameflow_handle_ifthenelse:
    ; 1. Leer datos
    ex de, hl
    ld e, (hl)                    ; DE = var address
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)                    ; A = compare value
    inc hl
    ld c, (hl)                    ; C = operator

    ; 2. Leer variable
    ex de, hl
    ld b, (hl)                    ; B = valor actual

    ; 3. Comparar
    cp b
    jr z, .then_branch

.else_branch:
    ; 4a. Rama ELSE
    pop bc                        ; BC = connection table
    ld a, CONNECTION_ELSE
    call gameflow_get_connection_by_type
    ; HL = nodo ELSE
    jp gameflow_execute_node

.then_branch:
    ; 4b. Rama THEN
    pop bc
    ld a, CONNECTION_THEN
    call gameflow_get_connection_by_type
    ; HL = nodo THEN
    jp gameflow_execute_node
```

### C) Menú con Opciones (SubMenu)

```
           ┌──────────┐
           │ SubMenu  │
           └────┬─────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ↓           ↓           ↓
┌────────┐ ┌────────┐ ┌────────┐
│Option 0│ │Option 1│ │Option 2│
└────────┘ └────────┘ └────────┘
```

**ASM Generado:**
```asm
submenu_conn:
    db CONNECTION_OPTION_0        ; Tipo 10
    dw gameflow_node_newgame
    db CONNECTION_OPTION_1        ; Tipo 11
    dw gameflow_node_continue
    db CONNECTION_OPTION_2        ; Tipo 12
    dw gameflow_node_settings
    db CONNECTION_END
```

**Ejecución:**
```asm
gameflow_handle_submenu:
    ; 1. Mostrar menú y obtener input
    call show_menu_placeholder
    ; Ahora: gameflow_menu_selection = índice seleccionado (0-2)

    ; 2. Calcular tipo de conexión
    ld a, (gameflow_menu_selection)
    add a, CONNECTION_OPTION_0    ; A = 10 + selection

    ; 3. Buscar conexión correspondiente
    pop bc                        ; BC = tabla
    call gameflow_get_connection_by_type

    ; 4. Ejecutar opción seleccionada
    jp gameflow_execute_node
```

### D) Game Loop (WorldLink)

```
           ┌──────────────┐
           │  WorldLink   │
           └──────┬───────┘
                  ↓
          ┌──────────────┐
          │  Game Loop   │◄────┐
          └──────┬───────┘     │
                 │              │
         ┌───────┴────────┐     │
         │                │     │
    [actualizar]    [exit flag?]
         │                │     │
         │                NO────┘
         │                │
         ↓               YES
    [continuar]           │
                          ↓
                    [siguiente nodo]
```

**Ejecución:**
```asm
gameflow_handle_worldlink:
    ; 1. Cargar mundo
    call load_world_data

    ; 2. Inicializar
    call init_entities

    ; 3. GAME LOOP
    call gameflow_world_game_loop
    ; ▲ Este loop NO retorna hasta exit flag

    ; 4. Después del loop, continuar
    pop bc
    call gameflow_get_default_connection
    jp gameflow_execute_node

gameflow_world_game_loop:
    ; Check exit
    ld a, (gameflow_exit_requested)
    or a
    ret nz                        ; Retorna si exit=1

    ; Update entities
    call update_all_entities

    ; Execute state machines
    call execute_all_state_machines

    ; Update sprites
    call update_sprites_to_vram

    ; Wait V-Blank
    call wait_vblank

    ; Loop infinito
    jp gameflow_world_game_loop
```

### E) Transición Visual (Transition)

```
┌──────────┐         ┌────────────┐         ┌──────────┐
│ Nodo A   │────────→│ Transition │────────→│ Nodo B   │
└──────────┘         └────────────┘         └──────────┘
                           │
                           ↓
                   [efecto visual]
                   [fade/flash/wipe]
```

**Ejecución:**
```asm
gameflow_handle_transition:
    ; 1. Ejecutar efecto
    push bc
    call execute_transition_effect
    ; Durante 0.5-1.5 segundos según efecto

    ; 2. Continuar flujo
    pop bc
    call gameflow_get_default_connection
    jp gameflow_execute_node
```

---

## ⏱️ Timing del Flujo

### Nodos Instantáneos
```
Start     →  <1ms
Restart   →  <1ms
Waypoint  →  <1ms
```

### Nodos con Delay
```
Transition  →  500ms - 1500ms (según efecto)
Text        →  Variable (según duración o input)
Music       →  <1ms (emite comando; la música PSG sigue en background durante menús y world loops)
```

### Nodos Interactivos
```
SubMenu     →  Hasta que usuario selecciona
End         →  Hasta que usuario presiona fire/ESC
```

### Nodos Bloqueantes
```
WorldLink   →  Hasta gameflow_exit_requested = 1
              (puede ser minutos/horas)
```

---

## 🔁 Ciclos y Recursión

### A) Loop Infinito (Menú Principal)
```
Start → MainMenu ◄──┐
         │          │
         └──────────┘
   (opción "Volver")
```

### B) Nested GameFlow (Grupos)
```
Main GameFlow:
  Start → Group → End
           │
           ↓
  Sub GameFlow:
    SubStart → SubWorldLink → SubEnd
                                  │
                                  ↓
                             [retorna a Main]
```

**Stack Usage:**
```
Nivel 0: Main GameFlow
  push parent_connection_table

Nivel 1: Sub GameFlow
  push parent_connection_table

Nivel 2: Sub-Sub GameFlow (si existe)
  ...

[Stack growth: ~10 bytes por nivel]
```

---

## 📊 Performance

### Cambio Entre Nodos
```
Carga tipo:           6 ciclos  (LD A, (HL))
Carga data ptr:      24 ciclos  (2× LD + 2× INC HL)
Carga conn ptr:      24 ciclos
Dispatcher:          ~30 ciclos (CP + JP Z)
Handler:           Variable
Get connection:      ~50 ciclos (búsqueda)
Jump:                10 ciclos  (JP)
─────────────────────────────────
Total típico:      ~150 ciclos = 0.04ms @ 3.58MHz
```

### Game Loop Iteration
```
Check exit:          ~15 ciclos
Update entities:   ~5000 ciclos (depende de # entidades)
Update sprites:    ~3000 ciclos
Wait V-Blank:      ~60000 ciclos (1/60s = 16.6ms)
Loop jump:           10 ciclos
─────────────────────────────────
Total:            ~68000 ciclos = ~19ms
                  = ~50-60 FPS
```

---

## ✅ Resumen

**El comportamiento entre nodos es:**

1. **Secuencial por defecto**: Start → A → B → C
2. **Condicional cuando necesario**: IfThenElse → THEN o ELSE
3. **Interactivo en menús**: SubMenu → Opción seleccionada
4. **Bloqueante en gameplay**: WorldLink (loop hasta exit)
5. **Con efectos visuales**: Transition (delay + continuar)
6. **Anidable**: Group (sub-GameFlow completo)

**Cada transición:**
- ✅ Preserva estado (via stack y variables)
- ✅ Es determinista (mismo input = mismo resultado)
- ✅ Puede tener delay visual (transitions)
- ✅ Puede esperar input (menus, text, end)
- ✅ Puede loopar (game loop, menu loop)

**El sistema es:**
- 🎯 **Simple**: Jump table + connection search
- ⚡ **Rápido**: ~150 ciclos por transición
- 💾 **Eficiente**: Stack mínimo, sin recursión profunda
- 🔒 **Seguro**: Verificación de HL=0 previene crashes

---

## 🖼️ Backend MSX2 SCREEN 5 (walker genérico)

Hasta ahora el export de SCREEN 5 sólo entendía **una forma fija** de grafo
(`Start → Screen5Presentation → [Text] → [Transition] → End`). Los nodos
SubMenu, TextScroll y TextScrollColor estaban deshabilitados en ese modo.

`utils/msxGenerator/generators/msx2/msx2Screen5FlowGenerator.ts` recorre el
grafo y emite **una rutina por nodo** con saltos entre ellas, así que el orden
es libre y los ciclos (menú → opción → volver al menú) son válidos.

### Cuándo se usa
Se activa automáticamente cuando el flow contiene `SubMenu`, `TextScroll`,
`TextScrollColor` o `Music`. Si no, se mantiene el backend estricto anterior y
la ROM sale **byte a byte idéntica**.

### Nodos soportados
| Nodo | Runtime |
|------|---------|
| `Screen5Presentation` | `DISSCR` → paleta a RAM (`GF_PALETTE_RAM`) → chunks a VRAM → `ENASCR` |
| `Text` | Título + líneas con word-wrap + `PRESS ANY KEY`, colores por nodo |
| `SubMenu` | Opciones dibujadas con la fuente 6x8; `GTSTCK` (cursores/joystick) mueve el resalte, `GTTRIG` (SPACE/fire) selecciona; cada opción salta a su propia rama |
| `TextScroll` / `TextScrollColor` | Ventana de texto que sube línea a línea con **HMMM**, banda inferior limpiada con **HMMV** |
| `Transition` | `cls`, `fade_to_black` y los 4 pixel wipes SCREEN 5 |
| `IfThenElse`, `Globals`, `Restart`, `End`, `Music`, `Waypoint` | Comparación 16-bit, escrituras EQU, `jp init_rom`, halt, silencio PSG, passthrough |

### Motor de texto
Fuente propia de 6x8 (`msx2Screen5FlowFont.ts`, ASCII 32..90, 5 px útiles + 1 de
separación). `gf_print` expande el glifo 1bpp a 4bpp en un buffer RAM
(`GF_TEXTBUF`, 8 filas) y sube cada fila con `LDIRVM`. Sólo se escribe el ancho
real del texto, así que el fondo de la presentación se conserva alrededor.

### Transiciones con el motor de comandos del V9938
Las wipes ya **no** usan `FILVRM` byte a byte (el camino antiguo hacía ~27.000
llamadas para un wipe vertical). Ahora cada paso es un único **HMMV**:

| Efecto | Implementación |
|--------|----------------|
| `screen5_vertical_pixel_wipe` | columnas de 4 px, 1 HMMV por frame (64 frames) |
| `screen5_horizontal_pixel_wipe` | bandas de 4 líneas (53 frames) |
| `screen5_mirror_pixel_wipe` | dos columnas simétricas por frame (32 frames) |
| `screen5_diagonal_pixel_wipe` | bloques 16x16 por anti-diagonal, tabla en ROM |
| `fade_to_black` | 8 pasos bajando R/G/B de `GF_PALETTE_RAM` |

⚠️ Tras `fade_to_black` la paleta queda a negro: el siguiente nodo que dibuje
texto no se verá hasta que un `Screen5Presentation` recargue la paleta.

### RAM
`#C800` runtime del flow (colores, menú, bloque de 15 bytes R#32..R#46),
`#C820` paleta viva, `#CA00`-`#CDFF` buffer de texto. Las globales siguen desde
`#C000` y el buffer ZX0 sigue en `#D000`.

### Proyecto de test
`scripts/create_msx2_screen5_gameflow_menu_fixture.py` genera
`test/msx2-gameflow/screen5_gameflow_menu_project.json`: pantalla de título
SCREEN 5, menú de 4 opciones y una rama por cada tipo de nodo/transición.

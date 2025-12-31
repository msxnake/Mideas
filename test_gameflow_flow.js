/**
 * Diagrama visual del flujo entre nodos en GameFlow
 */

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║           🎮 GAMEFLOW - FLUJO ENTRE NODOS (MSX ASM)              ║
╚═══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│ INICIO DEL JUEGO                                                │
└─────────────────────────────────────────────────────────────────┘

    [init_rom]
        │
        ├─> call gameflow_start
        │       │
        │       ├─> ld hl, gameflow_node_START
        │       └─> jp gameflow_execute_node
        │
        ↓

┌─────────────────────────────────────────────────────────────────┐
│ MOTOR DE EJECUCIÓN (gameflow_execute_node)                      │
└─────────────────────────────────────────────────────────────────┘

    Input: HL = dirección del nodo
        │
        ├─> [+0] Read TYPE     → A = node type
        ├─> [+1] Read DATA PTR → DE = data pointer
        └─> [+3] Read CONN PTR → BC = connection table
        │
        ├─> Dispatcher (CP + JP Z)
        │
        ↓
    ┌──────────────────┐
    │ Node Handler     │
    │ (específico)     │
    └──────────────────┘
        │
        ├─> Process (DE = data)
        ├─> Get Next (BC = connections)
        └─> Jump (jp gameflow_execute_node)
        │
        ↓ (loop infinito)


┌─────────────────────────────────────────────────────────────────┐
│ EJEMPLO 1: FLUJO LINEAL (Start → WorldLink → End)              │
└─────────────────────────────────────────────────────────────────┘

    ╔═══════════╗
    ║   Start   ║
    ╚═══════════╝
         │ (1) Execute Start
         │     - No data (gameflow_no_data)
         │     - No action
         │
         ├─> (2) get_default_connection
         │       ├─> Read connection table
         │       └─> HL = gameflow_node_worldlink
         │
         └─> (3) jp gameflow_execute_node
                 │
                 ↓
         ╔═══════════════╗
         ║   WorldLink   ║
         ╚═══════════════╝
         │ (4) Execute WorldLink
         │     - Load world data
         │     - Init entities
         │
         ├─> (5) call gameflow_world_game_loop
         │       │
         │       ╔════════════════════════════╗
         │       ║    GAME LOOP (infinito)   ║
         │       ╠════════════════════════════╣
         │       ║ ┌─────────────────────┐   ║
         │       ║ │ Check exit flag     │   ║
         │       ║ └──┬────────────────┬─┘   ║
         │       ║    │ Yes (exit=1)   │ No  ║
         │       ║    │ RET            └───┐ ║
         │       ║    │                    │ ║
         │       ║    │      ┌─────────────┘ ║
         │       ║    │      │               ║
         │       ║    │      ├─> update_all_entities     ║
         │       ║    │      ├─> execute_all_state_machines ║
         │       ║    │      ├─> update_sprites_to_vram ║
         │       ║    │      ├─> wait_vblank (16.6ms)  ║
         │       ║    │      └─> jp game_loop (loop ↑) ║
         │       ╚════╧════════════════════════╝
         │            │
         │            │ (gameflow_exit_requested = 1)
         │            ↓
         │
         ├─> (6) get_default_connection
         │       └─> HL = gameflow_node_end
         │
         └─> (7) jp gameflow_execute_node
                 │
                 ↓
         ╔═══════════╗
         ║    End    ║
         ╚═══════════╝
         │ (8) Execute End
         │     - Display end screen
         │     - Wait input (loop)
         │     - RET (game over)
         ↓
    [FIN DEL JUEGO]


┌─────────────────────────────────────────────────────────────────┐
│ EJEMPLO 2: BRANCHING (IfThenElse)                              │
└─────────────────────────────────────────────────────────────────┘

         ╔══════════════╗
         ║  IfThenElse  ║
         ╚══════════════╝
         │ Data: score, 100, equals
         │
         ├─> (1) Read variable (score)
         │       score = 150
         │
         ├─> (2) Compare: 150 == 100?
         │       Result: FALSE
         │
         ├─> (3) Branch: ELSE
         │       ├─> A = CONNECTION_ELSE
         │       └─> call get_connection_by_type
         │           HL = gameflow_node_continue
         │
         └─> (4) jp gameflow_execute_node
                 │
                 ↓
         ╔══════════════╗
         ║   Continue   ║  (rama ELSE)
         ╚══════════════╝

    Si score fuera 100:
         │
         ├─> (2) Compare: 100 == 100?
         │       Result: TRUE
         │
         ├─> (3) Branch: THEN
         │       └─> HL = gameflow_node_victory
         │
         └─> (4) jp gameflow_execute_node
                 │
                 ↓
         ╔══════════════╗
         ║   Victory    ║  (rama THEN)
         ╚══════════════╝


┌─────────────────────────────────────────────────────────────────┐
│ EJEMPLO 3: MENÚ INTERACTIVO (SubMenu)                          │
└─────────────────────────────────────────────────────────────────┘

         ╔══════════════╗
         ║   SubMenu    ║
         ╚══════════════╝
         │ Options: 3 (New Game, Continue, Settings)
         │
         ├─> (1) call show_menu_placeholder
         │       │
         │       ╔════════════════════════════╗
         │       ║     MENU LOOP              ║
         │       ╠════════════════════════════╣
         │       ║ Display options            ║
         │       ║   > Option 0  ◄──┐         ║
         │       ║     Option 1     │         ║
         │       ║     Option 2     │         ║
         │       ║                  │         ║
         │       ║ Read joystick ───┘         ║
         │       ║ UP/DOWN = move cursor      ║
         │       ║ FIRE = select              ║
         │       ║   └─> RET (selection=1)    ║
         │       ╚════════════════════════════╝
         │       │
         │       └─> gameflow_menu_selection = 1
         │
         ├─> (2) Calculate connection type
         │       A = CONNECTION_OPTION_0 + 1
         │       A = 11 (CONNECTION_OPTION_1)
         │
         ├─> (3) call get_connection_by_type
         │       Search table for type=11
         │       HL = gameflow_node_continue
         │
         └─> (4) jp gameflow_execute_node
                 │
                 ↓
         ╔══════════════╗
         ║   Continue   ║  (opción seleccionada)
         ╚══════════════╝


┌─────────────────────────────────────────────────────────────────┐
│ TIMING Y PERFORMANCE                                            │
└─────────────────────────────────────────────────────────────────┘

    Transición entre nodos:
    ┌──────────────────────────┬──────────┐
    │ Operación                │ Ciclos   │
    ├──────────────────────────┼──────────┤
    │ Read TYPE                │     6    │
    │ Read DATA PTR            │    24    │
    │ Read CONN PTR            │    24    │
    │ Dispatcher (CP + JP)     │    30    │
    │ Handler process          │ Variable │
    │ Get connection           │    50    │
    │ Jump                     │    10    │
    ├──────────────────────────┼──────────┤
    │ TOTAL                    │  ~150    │
    └──────────────────────────┴──────────┘

    150 ciclos @ 3.58MHz = 0.042ms = 42μs

    Game Loop (1 frame):
    ┌──────────────────────────┬──────────┐
    │ Update entities          │  ~5,000  │
    │ Update sprites           │  ~3,000  │
    │ Wait V-Blank             │ ~60,000  │
    ├──────────────────────────┼──────────┤
    │ TOTAL                    │ ~68,000  │
    └──────────────────────────┴──────────┘

    68,000 ciclos @ 3.58MHz = 19ms = 52 FPS


┌─────────────────────────────────────────────────────────────────┐
│ TIPOS DE NODOS Y SU COMPORTAMIENTO                             │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┬───────────────┬──────────────────────────┐
    │ Tipo         │ Duración      │ Comportamiento           │
    ├──────────────┼───────────────┼──────────────────────────┤
    │ Start        │ <1ms          │ Pasa inmediatamente      │
    │ End          │ Hasta input   │ Loop esperando fire/ESC  │
    │ Restart      │ <1ms          │ jp init_rom              │
    │ WorldLink    │ Hasta exit    │ Game loop infinito       │
    │ SubMenu      │ Hasta input   │ Loop esperando selección │
    │ Text         │ Variable      │ Duración o input         │
    │ IfThenElse   │ <1ms          │ Evaluación + branch      │
    │ Transition   │ 0.5-1.5s      │ Efecto visual + continua │
    │ Music        │ <1ms          │ Inicia async + continua  │
    │ Group        │ Variable      │ Nested GameFlow          │
    │ Waypoint     │ <1ms          │ Marca + continua         │
    │ Globals      │ <1ms          │ Set vars + continua      │
    └──────────────┴───────────────┴──────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ RESUMEN                                                         │
└─────────────────────────────────────────────────────────────────┘

    ✅ Cada nodo ejecuta y pasa al siguiente
    ✅ La transición es ~42μs (casi instantánea)
    ✅ Los nodos pueden:
       • Pasar inmediatamente (Start, Restart)
       • Esperar input (SubMenu, End, Text)
       • Bloquer en loop (WorldLink game loop)
       • Hacer efectos visuales (Transition)
       • Branch condicional (IfThenElse)
       • Ejecutar sub-flows (Group)

    ✅ El flujo es:
       Node → Handler → Get Connection → Next Node → ...

    ✅ El sistema es determinista y predecible
    ✅ Stack usage mínimo (~10 bytes por nested level)
    ✅ Performance excelente (~52 FPS en game loop)
`);

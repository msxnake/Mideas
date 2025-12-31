# GameFlow API Reference - Mideas MSX

## Índice
1. [Introducción](#introducción)
2. [Conceptos Básicos](#conceptos-básicos)
3. [Tipos de Nodos](#tipos-de-nodos)
4. [Tipos de Conexiones](#tipos-de-conexiones)
5. [Efectos de Transición](#efectos-de-transición)
6. [Control de Música](#control-de-música)
7. [Ejemplos Prácticos](#ejemplos-prácticos)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Troubleshooting](#troubleshooting)

---

## Introducción

**GameFlow** es el sistema de control de flujo de juego en Mideas MSX. Te permite crear la lógica de tu juego usando un sistema visual basado en **nodos** y **conexiones**, sin escribir código ASM.

### ¿Qué puedes hacer con GameFlow?

- 🎮 Crear menús principales e in-game
- 🎬 Añadir pantallas de victoria, derrota y créditos
- 🔀 Implementar lógica condicional (if/then/else)
- 📝 Mostrar texto y diálogos
- 🎨 Aplicar efectos de transición visuales
- 🎵 Controlar música y sonidos
- 🌍 Gestionar niveles y mundos
- ⏸️ Implementar pausas y sistemas de espera

### ¿Cómo funciona?

El juego comienza en el nodo **Start** y fluye de nodo en nodo siguiendo las **conexiones** que tú defines. Cada nodo ejecuta una acción específica y luego pasa al siguiente nodo conectado.

```
Start → Menu → WorldLink (Game Loop) → End
```

---

## Conceptos Básicos

### Nodos

Un **nodo** es una unidad de lógica de juego. Cada nodo tiene:
- **Tipo**: Define qué hace el nodo (menú, texto, juego, etc.)
- **Datos**: Configuración específica del nodo
- **Conexiones**: Enlaces a otros nodos

### Conexiones

Las **conexiones** determinan el flujo del juego:
- **DEFAULT**: Conexión lineal (siguiente nodo)
- **THEN/ELSE**: Conexiones condicionales
- **OPTION_0 a OPTION_5**: Opciones de menú

### Variables Globales

Puedes usar variables para controlar el flujo:
- `score`: Puntuación del jugador
- `lives`: Vidas restantes
- `level`: Nivel actual
- Variables personalizadas

---

## Tipos de Nodos

### 1. Start (Inicio)

**Descripción**: Nodo inicial del juego. Siempre debe ser el primer nodo.

**Propiedades**:
- No tiene datos
- Solo conexión DEFAULT

**Uso**:
```
Start → (siguiente nodo)
```

**Ejemplo**:
```json
{
  "type": "Start",
  "connections": [
    {"type": "DEFAULT", "target": "main_menu"}
  ]
}
```

---

### 2. End (Fin)

**Descripción**: Muestra una pantalla de fin y espera input del jugador.

**Propiedades**:
- `endType`: Tipo de pantalla (0-3)
  - `0`: Victoria (VICTORY!)
  - `1`: Derrota (GAME OVER)
  - `2`: Créditos (CREDITS)
  - `3`: Mensaje personalizado
- `message`: Mensaje personalizado (solo si endType=3)

**Uso**:
```
(cualquier nodo) → End
```

**Ejemplo - Pantalla de Victoria**:
```json
{
  "type": "End",
  "data": {
    "endType": 0
  }
}
```

**Ejemplo - Mensaje Personalizado**:
```json
{
  "type": "End",
  "data": {
    "endType": 3,
    "message": "THANKS FOR PLAYING!"
  }
}
```

**Comportamiento**:
- Muestra la pantalla
- Espera que el jugador presione FIRE o ESC
- El juego termina (no continúa a otro nodo)

---

### 3. Restart (Reiniciar)

**Descripción**: Reinicia el juego desde el principio.

**Propiedades**:
- No tiene datos
- No tiene conexiones (reinicia directamente)

**Uso**:
```
(cualquier nodo) → Restart
```

**Ejemplo**:
```json
{
  "type": "Restart"
}
```

**Comportamiento**:
- Salta a `init_rom` (reinicio completo)
- Equivalente a resetear la consola

---

### 4. WorldLink (Mundo/Nivel)

**Descripción**: Inicia el gameplay principal. Ejecuta el game loop del mundo.

**Propiedades**:
- `worldId`: ID del mundo a cargar
- `screenId`: ID de la pantalla inicial
- Conexión DEFAULT (ejecutada cuando el mundo termina)

**Uso**:
```
(menú/transición) → WorldLink → (siguiente nodo)
```

**Ejemplo**:
```json
{
  "type": "WorldLink",
  "data": {
    "worldId": 0,
    "screenId": 0
  },
  "connections": [
    {"type": "DEFAULT", "target": "victory_screen"}
  ]
}
```

**Comportamiento**:
- Carga el mundo y entidades
- Ejecuta el game loop (ECS + State Machines)
- Loop infinito hasta que se establece `gameflow_exit_requested = 1`
- Cuando termina, continúa a la conexión DEFAULT

**Cómo salir del WorldLink**:
- Usando un componente/behavior que establezca `gameflow_exit_requested = 1`
- Típicamente: muerte del jugador, victoria, ESC presionado

---

### 5. SubMenu (Menú)

**Descripción**: Muestra un menú interactivo con opciones.

**Propiedades**:
- `title`: Título del menú
- `options`: Array de strings (opciones del menú)
- Conexiones OPTION_0 a OPTION_N (una por opción)

**Uso**:
```
(cualquier nodo) → SubMenu → (nodo según opción seleccionada)
```

**Ejemplo**:
```json
{
  "type": "SubMenu",
  "data": {
    "title": "MAIN MENU",
    "options": ["NEW GAME", "CONTINUE", "SETTINGS"]
  },
  "connections": [
    {"type": "OPTION_0", "target": "new_game"},
    {"type": "OPTION_1", "target": "continue_game"},
    {"type": "OPTION_2", "target": "settings_menu"}
  ]
}
```

**Comportamiento**:
- Muestra el menú en pantalla
- El jugador navega con UP/DOWN
- Presiona FIRE para seleccionar
- Continúa al nodo conectado según la opción seleccionada

**Controles**:
- **UP**: Opción anterior
- **DOWN**: Opción siguiente
- **FIRE**: Seleccionar opción

---

### 6. Text (Texto)

**Descripción**: Muestra un texto en la zona inferior de la pantalla.

**Propiedades**:
- `text`: Texto a mostrar
- `duration`: Duración en frames (60 frames = 1 segundo)
  - Si es `0`: Espera input del jugador
  - Si es `>0`: Espera N frames
- Conexión DEFAULT (siguiente nodo)

**Uso**:
```
(cualquier nodo) → Text → (siguiente nodo)
```

**Ejemplo - Texto con duración**:
```json
{
  "type": "Text",
  "data": {
    "text": "LEVEL 1 - THE BEGINNING",
    "duration": 120
  },
  "connections": [
    {"type": "DEFAULT", "target": "world_1"}
  ]
}
```

**Ejemplo - Texto con espera de input**:
```json
{
  "type": "Text",
  "data": {
    "text": "PRESS FIRE TO START",
    "duration": 0
  },
  "connections": [
    {"type": "DEFAULT", "target": "game_start"}
  ]
}
```

**Comportamiento**:
- Limpia la zona de texto (filas 18-20)
- Muestra el texto centrado
- Espera duración O input (según configuración)
- Continúa al siguiente nodo

---

### 7. IfThenElse (Condicional)

**Descripción**: Evalúa una condición y elige entre dos caminos.

**Propiedades**:
- `variable`: Variable a evaluar (ej: "score", "lives")
- `value`: Valor a comparar
- `operator`: Operador de comparación
  - `"equals"`: Variable == Valor
  - `"greater"`: Variable > Valor
  - `"less"`: Variable < Valor
  - `"greaterOrEqual"`: Variable >= Valor
  - `"lessOrEqual"`: Variable <= Valor
- Conexiones THEN y ELSE

**Uso**:
```
(cualquier nodo) → IfThenElse → {THEN o ELSE}
```

**Ejemplo - Verificar Victoria**:
```json
{
  "type": "IfThenElse",
  "data": {
    "variable": "score",
    "value": 1000,
    "operator": "greaterOrEqual"
  },
  "connections": [
    {"type": "THEN", "target": "victory_screen"},
    {"type": "ELSE", "target": "continue_game"}
  ]
}
```

**Ejemplo - Verificar Vidas**:
```json
{
  "type": "IfThenElse",
  "data": {
    "variable": "lives",
    "value": 0,
    "operator": "equals"
  },
  "connections": [
    {"type": "THEN", "target": "game_over"},
    {"type": "ELSE", "target": "continue_game"}
  ]
}
```

**Comportamiento**:
- Lee la variable global
- Compara con el valor usando el operador
- Si TRUE: Continúa por THEN
- Si FALSE: Continúa por ELSE

**Variables disponibles**:
- `score`: Puntuación
- `lives`: Vidas
- `level`: Nivel actual
- Cualquier variable personalizada definida en tu proyecto

---

### 8. Transition (Transición)

**Descripción**: Aplica un efecto visual de transición.

**Propiedades**:
- `effectType`: Tipo de efecto (0-4)
  - `0`: Fade Out (desvanecimiento a negro)
  - `1`: Fade In (desvanecimiento desde negro)
  - `2`: Flash (parpadeos blanco/negro)
  - `3`: Wipe Down (limpieza de arriba a abajo)
  - `4`: Wipe Up (limpieza de abajo a arriba)
- Conexión DEFAULT (siguiente nodo)

**Uso**:
```
(cualquier nodo) → Transition → (siguiente nodo)
```

**Ejemplo - Fade Out**:
```json
{
  "type": "Transition",
  "data": {
    "effectType": 0
  },
  "connections": [
    {"type": "DEFAULT", "target": "next_level"}
  ]
}
```

**Duraciones**:
- Fade Out/In: ~1.3 segundos
- Flash: ~0.5 segundos
- Wipe Down/Up: ~0.8 segundos

**Comportamiento**:
- Ejecuta el efecto visual
- Continúa automáticamente al siguiente nodo

**Usos comunes**:
- Entre niveles: `Fade Out → WorldLink → Fade In`
- Muerte del jugador: `Flash → Game Over`
- Cambio de escena: `Wipe Down → SubMenu`

---

### 9. Music (Música)

**Descripción**: Controla la reproducción de música.

**Propiedades**:
- `command`: Comando de música (0-3)
  - `0`: Stop (detener)
  - `1`: Play (reproducir)
  - `2`: Pause (pausar)
  - `3`: Resume (reanudar)
- `trackId`: ID de la pista (solo para Play)
- `loop`: Repetir en loop (solo para Play)
- Conexión DEFAULT (siguiente nodo)

**Uso**:
```
(cualquier nodo) → Music → (siguiente nodo)
```

**Ejemplo - Reproducir música**:
```json
{
  "type": "Music",
  "data": {
    "command": 1,
    "trackId": 0,
    "loop": true
  },
  "connections": [
    {"type": "DEFAULT", "target": "main_menu"}
  ]
}
```

**Ejemplo - Detener música**:
```json
{
  "type": "Music",
  "data": {
    "command": 0
  },
  "connections": [
    {"type": "DEFAULT", "target": "game_over"}
  ]
}
```

**Comportamiento**:
- Ejecuta el comando de música (PSG AY-3-8910)
- Continúa inmediatamente al siguiente nodo
- La música se reproduce en background

**Comandos**:
- **Stop**: Silencia todos los canales PSG
- **Play**: Inicia reproducción de pista
- **Pause**: Pausa reproducción actual
- **Resume**: Reanuda desde pausa

---

### 10. Group (Grupo/Nested Flow)

**Descripción**: Ejecuta un sub-flujo de GameFlow anidado.

**Propiedades**:
- `subFlowStartNode`: ID del nodo inicial del sub-flujo
- Conexión DEFAULT (siguiente nodo después del sub-flujo)

**Uso**:
```
(cualquier nodo) → Group → (siguiente nodo)
```

**Ejemplo**:
```json
{
  "type": "Group",
  "data": {
    "subFlowStartNode": "cutscene_intro"
  },
  "connections": [
    {"type": "DEFAULT", "target": "main_game"}
  ]
}
```

**Comportamiento**:
- Guarda el estado actual en stack
- Ejecuta el sub-flujo completo
- Restaura el estado y continúa

**Casos de uso**:
- Cutscenes
- Sub-menús complejos
- Secuencias de diálogo
- Mini-juegos

---

### 11. Waypoint (Marcador)

**Descripción**: Nodo invisible que sirve como punto de referencia.

**Propiedades**:
- `name`: Nombre del waypoint
- Conexión DEFAULT (siguiente nodo)

**Uso**:
```
(cualquier nodo) → Waypoint → (siguiente nodo)
```

**Ejemplo**:
```json
{
  "type": "Waypoint",
  "data": {
    "name": "checkpoint_1"
  },
  "connections": [
    {"type": "DEFAULT", "target": "next_section"}
  ]
}
```

**Comportamiento**:
- No hace nada visible
- Continúa inmediatamente al siguiente nodo

**Casos de uso**:
- Organizar el flujo visualmente
- Puntos de retorno/guardado
- Debugging (marcar secciones del flujo)

---

### 12. Globals (Variables Globales)

**Descripción**: Modifica variables globales.

**Propiedades**:
- `variable`: Nombre de la variable
- `value`: Valor a asignar
- `operation`: Operación a realizar
  - `"set"`: Variable = Valor
  - `"add"`: Variable += Valor
  - `"subtract"`: Variable -= Valor
- Conexión DEFAULT (siguiente nodo)

**Uso**:
```
(cualquier nodo) → Globals → (siguiente nodo)
```

**Ejemplo - Establecer nivel**:
```json
{
  "type": "Globals",
  "data": {
    "variable": "level",
    "value": 2,
    "operation": "set"
  },
  "connections": [
    {"type": "DEFAULT", "target": "world_2"}
  ]
}
```

**Ejemplo - Sumar puntos**:
```json
{
  "type": "Globals",
  "data": {
    "variable": "score",
    "value": 100,
    "operation": "add"
  },
  "connections": [
    {"type": "DEFAULT", "target": "continue"}
  ]
}
```

**Comportamiento**:
- Modifica la variable global
- Continúa inmediatamente al siguiente nodo

**Variables comunes**:
- `score`: Puntuación
- `lives`: Vidas
- `level`: Nivel
- `coins`: Monedas recolectadas
- Variables personalizadas

---

## Tipos de Conexiones

### DEFAULT (Conexión por defecto)
**Valor**: 0
**Uso**: Flujo lineal, siguiente nodo automático
**Ejemplo**: Start → Menu → Game

### THEN (Condición verdadera)
**Valor**: 1
**Uso**: Rama TRUE de IfThenElse
**Ejemplo**: Si score >= 100 → Victory

### ELSE (Condición falsa)
**Valor**: 2
**Uso**: Rama FALSE de IfThenElse
**Ejemplo**: Si score < 100 → Continue

### OPTION_0 a OPTION_5 (Opciones de menú)
**Valores**: 10-15
**Uso**: Opciones de SubMenu
**Ejemplo**:
- OPTION_0 → New Game
- OPTION_1 → Continue
- OPTION_2 → Settings

---

## Efectos de Transición

### Fade Out (0)
**Duración**: ~1.3 segundos
**Efecto**: Desvanecimiento gradual a negro (4 pasos)
**Uso típico**: Fin de nivel, muerte del jugador

### Fade In (1)
**Duración**: ~1.3 segundos
**Efecto**: Aparición gradual desde negro (4 pasos)
**Uso típico**: Inicio de nivel, respawn del jugador

### Flash (2)
**Duración**: ~0.5 segundos
**Efecto**: 3 parpadeos rápidos blanco/negro
**Uso típico**: Impacto, daño, teletransporte

### Wipe Down (3)
**Duración**: ~0.8 segundos
**Efecto**: Limpieza de pantalla de arriba a abajo
**Uso típico**: Cambio de escena, menú a juego

### Wipe Up (4)
**Duración**: ~0.8 segundos
**Efecto**: Limpieza de pantalla de abajo a arriba
**Uso típico**: Juego a menú, fin de nivel

---

## Control de Música

### Comandos Disponibles

#### Stop (0)
Detiene la música y silencia todos los canales PSG.
```json
{"command": 0}
```

#### Play (1)
Inicia la reproducción de una pista.
```json
{
  "command": 1,
  "trackId": 0,
  "loop": true
}
```

#### Pause (2)
Pausa la música actual (mantiene estado).
```json
{"command": 2}
```

#### Resume (3)
Reanuda la música desde la pausa.
```json
{"command": 3}
```

### Chip de Sonido
- **PSG**: AY-3-8910 (3 canales)
- **Puertos**: #A0 (address), #A1 (data)
- **Registros**: 0-13 (tonos, volumen, envolvente)

---

## Ejemplos Prácticos

### Ejemplo 1: Juego Simple

```
Start
  ↓
SubMenu (Main Menu)
  ├─ OPTION_0 (New Game) → Fade Out → WorldLink (Level 1) → Victory
  ├─ OPTION_1 (Continue) → WorldLink (Level 1)
  └─ OPTION_2 (Quit) → End (Thanks)
```

**JSON**:
```json
{
  "nodes": [
    {
      "id": "start",
      "type": "Start",
      "connections": [{"type": "DEFAULT", "target": "main_menu"}]
    },
    {
      "id": "main_menu",
      "type": "SubMenu",
      "data": {
        "title": "MAIN MENU",
        "options": ["NEW GAME", "CONTINUE", "QUIT"]
      },
      "connections": [
        {"type": "OPTION_0", "target": "fade_out"},
        {"type": "OPTION_1", "target": "level_1"},
        {"type": "OPTION_2", "target": "quit_screen"}
      ]
    },
    {
      "id": "fade_out",
      "type": "Transition",
      "data": {"effectType": 0},
      "connections": [{"type": "DEFAULT", "target": "level_1"}]
    },
    {
      "id": "level_1",
      "type": "WorldLink",
      "data": {"worldId": 0, "screenId": 0},
      "connections": [{"type": "DEFAULT", "target": "victory"}]
    },
    {
      "id": "victory",
      "type": "End",
      "data": {"endType": 0}
    },
    {
      "id": "quit_screen",
      "type": "End",
      "data": {"endType": 3, "message": "THANKS FOR PLAYING!"}
    }
  ]
}
```

---

### Ejemplo 2: Sistema de Vidas

```
WorldLink (Game)
  ↓ (al morir)
IfThenElse (lives == 0?)
  ├─ THEN → Game Over
  └─ ELSE → Globals (lives -= 1) → Flash → Restart Level
```

**JSON**:
```json
{
  "nodes": [
    {
      "id": "game",
      "type": "WorldLink",
      "data": {"worldId": 0, "screenId": 0},
      "connections": [{"type": "DEFAULT", "target": "check_lives"}]
    },
    {
      "id": "check_lives",
      "type": "IfThenElse",
      "data": {
        "variable": "lives",
        "value": 0,
        "operator": "equals"
      },
      "connections": [
        {"type": "THEN", "target": "game_over"},
        {"type": "ELSE", "target": "lose_life"}
      ]
    },
    {
      "id": "lose_life",
      "type": "Globals",
      "data": {
        "variable": "lives",
        "value": 1,
        "operation": "subtract"
      },
      "connections": [{"type": "DEFAULT", "target": "death_flash"}]
    },
    {
      "id": "death_flash",
      "type": "Transition",
      "data": {"effectType": 2},
      "connections": [{"type": "DEFAULT", "target": "game"}]
    },
    {
      "id": "game_over",
      "type": "End",
      "data": {"endType": 1}
    }
  ]
}
```

---

### Ejemplo 3: Niveles Progresivos

```
Start
  ↓
Text ("LEVEL 1")
  ↓
WorldLink (Level 1)
  ↓
IfThenElse (score >= 500?)
  ├─ THEN → Text ("LEVEL 2") → WorldLink (Level 2) → Victory
  └─ ELSE → Game Over
```

**JSON**:
```json
{
  "nodes": [
    {
      "id": "start",
      "type": "Start",
      "connections": [{"type": "DEFAULT", "target": "level1_intro"}]
    },
    {
      "id": "level1_intro",
      "type": "Text",
      "data": {
        "text": "LEVEL 1 - THE BEGINNING",
        "duration": 120
      },
      "connections": [{"type": "DEFAULT", "target": "level_1"}]
    },
    {
      "id": "level_1",
      "type": "WorldLink",
      "data": {"worldId": 0, "screenId": 0},
      "connections": [{"type": "DEFAULT", "target": "check_score"}]
    },
    {
      "id": "check_score",
      "type": "IfThenElse",
      "data": {
        "variable": "score",
        "value": 500,
        "operator": "greaterOrEqual"
      },
      "connections": [
        {"type": "THEN", "target": "level2_intro"},
        {"type": "ELSE", "target": "game_over"}
      ]
    },
    {
      "id": "level2_intro",
      "type": "Text",
      "data": {
        "text": "LEVEL 2 - THE CHALLENGE",
        "duration": 120
      },
      "connections": [{"type": "DEFAULT", "target": "level_2"}]
    },
    {
      "id": "level_2",
      "type": "WorldLink",
      "data": {"worldId": 1, "screenId": 0},
      "connections": [{"type": "DEFAULT", "target": "victory"}]
    },
    {
      "id": "victory",
      "type": "End",
      "data": {"endType": 0}
    },
    {
      "id": "game_over",
      "type": "End",
      "data": {"endType": 1}
    }
  ]
}
```

---

### Ejemplo 4: Menú con Música

```
Start
  ↓
Music (Play menu theme)
  ↓
SubMenu (Main Menu)
  ├─ New Game → Music (Stop) → Music (Play game theme) → WorldLink
  ├─ Settings → Group (Settings Flow) → Main Menu
  └─ Quit → Music (Stop) → End
```

**JSON**:
```json
{
  "nodes": [
    {
      "id": "start",
      "type": "Start",
      "connections": [{"type": "DEFAULT", "target": "play_menu_music"}]
    },
    {
      "id": "play_menu_music",
      "type": "Music",
      "data": {
        "command": 1,
        "trackId": 0,
        "loop": true
      },
      "connections": [{"type": "DEFAULT", "target": "main_menu"}]
    },
    {
      "id": "main_menu",
      "type": "SubMenu",
      "data": {
        "title": "MAIN MENU",
        "options": ["NEW GAME", "SETTINGS", "QUIT"]
      },
      "connections": [
        {"type": "OPTION_0", "target": "stop_menu_music"},
        {"type": "OPTION_1", "target": "settings_flow"},
        {"type": "OPTION_2", "target": "quit_music"}
      ]
    },
    {
      "id": "stop_menu_music",
      "type": "Music",
      "data": {"command": 0},
      "connections": [{"type": "DEFAULT", "target": "play_game_music"}]
    },
    {
      "id": "play_game_music",
      "type": "Music",
      "data": {
        "command": 1,
        "trackId": 1,
        "loop": true
      },
      "connections": [{"type": "DEFAULT", "target": "game"}]
    },
    {
      "id": "game",
      "type": "WorldLink",
      "data": {"worldId": 0, "screenId": 0},
      "connections": [{"type": "DEFAULT", "target": "victory"}]
    },
    {
      "id": "settings_flow",
      "type": "Group",
      "data": {"subFlowStartNode": "settings_menu"},
      "connections": [{"type": "DEFAULT", "target": "main_menu"}]
    },
    {
      "id": "quit_music",
      "type": "Music",
      "data": {"command": 0},
      "connections": [{"type": "DEFAULT", "target": "quit"}]
    },
    {
      "id": "victory",
      "type": "End",
      "data": {"endType": 0}
    },
    {
      "id": "quit",
      "type": "End",
      "data": {"endType": 3, "message": "SEE YOU NEXT TIME!"}
    }
  ]
}
```

---

## Mejores Prácticas

### 1. Organización del Flujo

✅ **Bueno**: Flujo claro y lineal
```
Start → Menu → Game → Check Score → Victory/Game Over
```

❌ **Malo**: Flujo caótico con saltos innecesarios
```
Start → Menu → Game ⇄ Random Node ⇄ Menu ⇄ Game
```

### 2. Uso de Transiciones

✅ **Bueno**: Transiciones suaves entre escenas
```
WorldLink → Fade Out → Text → Fade In → Next WorldLink
```

❌ **Malo**: Cambios abruptos sin transiciones
```
WorldLink → Next WorldLink (sin efecto)
```

### 3. Manejo de Variables

✅ **Bueno**: Inicializar variables al inicio
```
Start → Globals (lives = 3) → Globals (score = 0) → Menu
```

❌ **Malo**: Asumir valores por defecto
```
Start → Menu (¿lives = ???)
```

### 4. Estructura de Menús

✅ **Bueno**: Menú con todas las opciones conectadas
```
SubMenu
  ├─ OPTION_0 → New Game
  ├─ OPTION_1 → Continue
  ├─ OPTION_2 → Settings
  └─ OPTION_3 → Quit
```

❌ **Malo**: Opciones sin conexión
```
SubMenu
  ├─ OPTION_0 → New Game
  └─ OPTION_1 → (sin conexión) ⚠️
```

### 5. Manejo de Música

✅ **Bueno**: Detener música antes de cambiar
```
Game → Music (Stop) → Victory Screen → Music (Play victory)
```

❌ **Malo**: Superponer músicas
```
Game (music playing) → Victory Screen → Music (Play victory)
(dos músicas sonando)
```

### 6. Validación de Condiciones

✅ **Bueno**: Siempre definir THEN y ELSE
```
IfThenElse (lives == 0)
  ├─ THEN → Game Over
  └─ ELSE → Continue Game
```

❌ **Malo**: Solo definir una rama
```
IfThenElse (lives == 0)
  ├─ THEN → Game Over
  └─ ELSE → (sin conexión) ⚠️
```

### 7. Textos y Duraciones

✅ **Bueno**: Duración proporcional al texto
```
Text ("LEVEL 1", duration: 60)  // 1 segundo - corto
Text ("GET READY FOR THE FINAL BOSS!", duration: 180)  // 3 segundos - largo
```

❌ **Malo**: Duraciones inadecuadas
```
Text ("LEVEL 1", duration: 300)  // 5 segundos - demasiado largo
Text ("GET READY FOR THE FINAL BOSS!", duration: 30)  // 0.5s - demasiado corto
```

### 8. Anidamiento de Grupos

✅ **Bueno**: Máximo 2-3 niveles de anidamiento
```
Main Flow → Group (Cutscene) → Group (Dialog) → Continue
```

❌ **Malo**: Anidamiento excesivo
```
Flow → Group → Group → Group → Group → Group (stack overflow risk)
```

---

## Troubleshooting

### Problema 1: El menú no responde

**Síntomas**: El menú se muestra pero no puedo navegar

**Causas posibles**:
- No tienes conexiones definidas para las opciones
- El joystick no está conectado correctamente

**Solución**:
```json
{
  "type": "SubMenu",
  "data": {
    "title": "MENU",
    "options": ["OPTION 1", "OPTION 2"]
  },
  "connections": [
    {"type": "OPTION_0", "target": "node1"},  // ✅ Asegurar conexiones
    {"type": "OPTION_1", "target": "node2"}
  ]
}
```

---

### Problema 2: El WorldLink no termina nunca

**Síntomas**: El juego se queda en loop infinito

**Causas posibles**:
- No se establece `gameflow_exit_requested = 1`

**Solución**:
- Asegúrate de que tu código/behavior establece la flag cuando el nivel termina
- Ejemplo: Al completar objetivo, muerte del jugador, presionar ESC

---

### Problema 3: Las transiciones no se ven

**Síntomas**: Los efectos de transición no aparecen

**Causas posibles**:
- EffectType incorrecto (fuera del rango 0-4)
- Código ASM no compilado correctamente

**Solución**:
```json
{
  "type": "Transition",
  "data": {
    "effectType": 0  // ✅ Debe ser 0-4
  }
}
```

---

### Problema 4: La música no suena

**Síntomas**: El comando Music no produce sonido

**Causas posibles**:
- TrackId incorrecto (pista no existe)
- Comando Stop llamado antes

**Solución**:
```json
{
  "type": "Music",
  "data": {
    "command": 1,      // ✅ Play
    "trackId": 0,      // ✅ Verificar que existe
    "loop": true
  }
}
```

---

### Problema 5: Variables no se actualizan

**Síntomas**: Globals no cambia el valor de las variables

**Causas posibles**:
- Nombre de variable incorrecto
- Operación incorrecta

**Solución**:
```json
{
  "type": "Globals",
  "data": {
    "variable": "score",      // ✅ Nombre exacto
    "value": 100,
    "operation": "add"        // ✅ "set", "add", o "subtract"
  }
}
```

---

### Problema 6: IfThenElse siempre va por ELSE

**Síntomas**: La condición nunca se cumple

**Causas posibles**:
- Operador incorrecto
- Variable no inicializada
- Valor de comparación incorrecto

**Solución**:
```json
{
  "type": "IfThenElse",
  "data": {
    "variable": "score",
    "value": 100,
    "operator": "greaterOrEqual"  // ✅ Verificar operador
  }
}
```

**Operadores válidos**:
- `"equals"` → ==
- `"greater"` → >
- `"less"` → <
- `"greaterOrEqual"` → >=
- `"lessOrEqual"` → <=

---

### Problema 7: Texto no se muestra completo

**Síntomas**: El texto aparece cortado

**Causas posibles**:
- Texto demasiado largo (máximo ~30 caracteres)
- Caracteres no soportados

**Solución**:
- Limita el texto a 30 caracteres máximo
- Usa solo caracteres ASCII estándar (A-Z, 0-9, espacios, puntuación básica)

---

### Problema 8: SubMenu con más de 6 opciones

**Síntomas**: No puedo añadir más opciones

**Causas posibles**:
- Límite del sistema (máximo 6 opciones: OPTION_0 a OPTION_5)

**Solución**:
- Divide el menú en sub-menús:
```
Main Menu
  ├─ OPTION_0 → Sub Menu 1 (más opciones)
  ├─ OPTION_1 → Sub Menu 2 (más opciones)
  └─ OPTION_2 → Back
```

---

### Problema 9: ROM no compila

**Síntomas**: Error de compilación glass.jar

**Causas posibles**:
- Nodos sin conexiones requeridas
- IDs de nodos duplicados
- Referencias a nodos inexistentes

**Solución**:
- Verifica que todos los nodos tengan las conexiones requeridas
- Asegura IDs únicos para cada nodo
- Verifica que los targets existan en la lista de nodos

---

### Problema 10: Pantalla negra al iniciar

**Síntomas**: ROM ejecuta pero pantalla negra

**Causas posibles**:
- Nodo Start sin conexión DEFAULT
- Referencia a nodo inexistente

**Solución**:
```json
{
  "id": "start",
  "type": "Start",
  "connections": [
    {"type": "DEFAULT", "target": "main_menu"}  // ✅ Asegurar conexión
  ]
}
```

---

## Apéndice A: Tabla de Referencia Rápida

| Nodo | Input | Output | Duración | Bloquea |
|------|-------|--------|----------|---------|
| Start | - | DEFAULT | <1ms | No |
| End | endType | - | Hasta input | Sí |
| Restart | - | - | <1ms | Sí (reinicia) |
| WorldLink | worldId, screenId | DEFAULT | Hasta exit | Sí |
| SubMenu | title, options | OPTION_N | Hasta input | Sí |
| Text | text, duration | DEFAULT | Variable | Depende |
| IfThenElse | var, value, op | THEN/ELSE | <1ms | No |
| Transition | effectType | DEFAULT | 0.5-1.5s | Sí |
| Music | command, trackId | DEFAULT | <1ms | No |
| Group | subFlowStartNode | DEFAULT | Variable | Sí |
| Waypoint | name | DEFAULT | <1ms | No |
| Globals | var, value, op | DEFAULT | <1ms | No |

---

## Apéndice B: Constantes de Sistema

### Connection Types
```
CONNECTION_DEFAULT      = 0
CONNECTION_THEN         = 1
CONNECTION_ELSE         = 2
CONNECTION_OPTION_0     = 10
CONNECTION_OPTION_1     = 11
CONNECTION_OPTION_2     = 12
CONNECTION_OPTION_3     = 13
CONNECTION_OPTION_4     = 14
CONNECTION_OPTION_5     = 15
CONNECTION_END          = 255
```

### Effect Types
```
EFFECT_FADE_OUT         = 0
EFFECT_FADE_IN          = 1
EFFECT_FLASH            = 2
EFFECT_WIPE_DOWN        = 3
EFFECT_WIPE_UP          = 4
```

### Music Commands
```
MUSIC_STOP              = 0
MUSIC_PLAY              = 1
MUSIC_PAUSE             = 2
MUSIC_RESUME            = 3
```

### End Screen Types
```
END_TYPE_VICTORY        = 0
END_TYPE_DEFEAT         = 1
END_TYPE_CREDITS        = 2
END_TYPE_CUSTOM         = 3
```

### Comparison Operators
```
"equals"
"greater"
"less"
"greaterOrEqual"
"lessOrEqual"
```

### Variable Operations
```
"set"
"add"
"subtract"
```

---

## Apéndice C: Timing Reference

| Operación | Ciclos Z80 | Tiempo (3.58MHz) | FPS equivalente |
|-----------|-----------|------------------|-----------------|
| Node transition | ~150 | 42μs | - |
| V-Blank wait | ~60,000 | 16.6ms | 60 |
| Game loop | ~68,000 | 19ms | 52 |
| Fade Out/In | ~280,000 | 78ms | - |
| Flash effect | ~100,000 | 28ms | - |
| Wipe effect | ~170,000 | 47ms | - |

**Nota**: 1 frame = 16.6ms @ 60Hz

---

## Apéndice D: Límites del Sistema

| Recurso | Límite | Notas |
|---------|--------|-------|
| Nodos totales | ~100 | Depende de RAM disponible |
| Conexiones por nodo | Ilimitado | Limitado por espacio ROM |
| Opciones de menú | 6 | OPTION_0 a OPTION_5 |
| Longitud de texto | ~30 chars | Depende del ancho de pantalla |
| Niveles de anidamiento | ~10 | Limitado por stack |
| Variables globales | ~32 | Definidas en proyecto |
| Pistas de música | ~16 | Depende de implementación PSG |

---

## Conclusión

El sistema GameFlow de Mideas MSX te permite crear juegos completos sin escribir código ASM directamente. Con los 12 tipos de nodos disponibles, puedes implementar:

- ✅ Menús interactivos
- ✅ Lógica condicional
- ✅ Múltiples niveles
- ✅ Efectos visuales
- ✅ Control de música
- ✅ Pantallas de victoria/derrota
- ✅ Sistemas de variables

**Próximos pasos**:
1. Experimenta con los ejemplos de este manual
2. Crea tu primer GameFlow simple (Start → Menu → Game → End)
3. Añade complejidad gradualmente (transiciones, música, condiciones)
4. Compila y prueba en OpenMSX

Para más información, consulta:
- [GAMEFLOW_BEHAVIOR.md](GAMEFLOW_BEHAVIOR.md) - Documentación técnica avanzada
- [MSX Assembly Reference](docs/MSX_ASM_REFERENCE.md) - Referencia de ASM
- [Mideas User Guide](docs/USER_GUIDE.md) - Guía de usuario general

---

**Versión del documento**: 1.0
**Fecha**: 26/12/2025
**Sistema**: Mideas MSX GameFlow
**Compatibilidad**: MSX1/MSX2/MSX2+

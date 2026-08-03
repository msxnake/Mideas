# Component Action Triggers

## Proposito

`Jump` y `Shoot` pueden elegir que accion logica de input los activa mediante la propiedad `trigger` del componente. Esto permite cambiar controles de plataformas sin dejar fijo un unico boton dentro del generador ASM.

## Valores soportados

| Valor | Significado en runtime | Uso tipico |
| --- | --- | --- |
| `fire` | `INPUT_BTN_FIRE` / SPACE / boton A de joystick | Disparo, salto heredado |
| `action2` | `INPUT_BTN_GRAB` / tecla N / boton B de joystick | Agarrar, dash, accion alternativa |
| `up` | `input_state == STICK_UP` | Salto de plataformas con cursor arriba |

El generador de entidades tambien acepta alias para facilitar la autoria:

- `fire2`, `grab`, `button2`, `btn2`, `secondButton`, `KeyN`, `n`, `KeyM`, `m` se convierten en `action2`.
- `ArrowUp`, `cursorUp` se convierten en `up`.
- Los valores desconocidos vuelven a `fire` para mantener compatibilidad.

## Defaults de componentes

Ambos componentes usan `fire` por defecto, asi los proyectos existentes conservan el comportamiento anterior:

```json
{
  "definitionId": "comp_jump",
  "defaultValues": {
    "trigger": "fire"
  }
}
```

```json
{
  "definitionId": "comp_shoot",
  "defaultValues": {
    "trigger": "fire"
  }
}
```

Para un plataformas donde ARRIBA salta y SPACE dispara:

```json
{
  "definitionId": "comp_jump",
  "defaultValues": {
    "trigger": "up"
  }
}
```

```json
{
  "definitionId": "comp_shoot",
  "defaultValues": {
    "trigger": "fire"
  }
}
```

Para disparar con segunda accion o tecla N:

```json
{
  "definitionId": "comp_shoot",
  "defaultValues": {
    "trigger": "action2"
  }
}
```

## Contrato ASM

El generador guarda un selector de trigger por entidad:

- `entity_jump_trigger` usa `temp_byte_29`.
- `entity_shoot_trigger` usa `temp_byte_30`.

Constantes de selector:

```asm
COMP_TRIGGER_FIRE    EQU 0
COMP_TRIGGER_ACTION2 EQU 1
COMP_TRIGGER_UP      EQU 2
```

Helpers de runtime:

- `component_trigger_edge_pressed_a`: entrada `A = COMP_TRIGGER_*`; devuelve `A = 1`/NZ solo cuando se acaba de pulsar en este frame. Lo usa `Jump`.
- `component_trigger_level_pressed_a`: entrada `A = COMP_TRIGGER_*`; devuelve `A = 1`/NZ mientras el trigger esta mantenido. Lo usa `Shoot`, asi que el cooldown controla los disparos repetidos.

Ambos helpers preservan `BC`, `DE` y `HL`; solo modifican `AF`.

## Shoot por char 8x8

`comp_shoot.mode = "char"` usa un unico char de Screen 2 en lugar de crear una entidad/sprite de proyectil. El char avanza horizontalmente desde el player segun `entity_facing_dir` hasta salir de pantalla o encontrar un tile solido en `runtime_behavior_map`.

- En este modo `charCode` define el patron 8x8 que se escribe en Name Table.
- Si no se configura `trigger` explicitamente en la plantilla o instancia, el export ASM usa `action2`, es decir tecla N / boton B.
- El disparo se bloquea mientras la entidad esta en `entity_wallgrab_active`, tiene una caja en `entity_carry_held`, o aparece como portadora en `entity_carried_by`.
- En ASM, `entity_shoot_trigger` usa el bit 7 como marca interna de modo char, el bit 6 como bloqueo runtime (`hasAmmo=false`) y los bits bajos siguen conteniendo `COMP_TRIGGER_*`.
- Una State Machine puede activar/desactivar el disparo con `SET_COMPONENT_PROPERTY`: componente `comp_shoot`, propiedad `hasAmmo`, valor `true` o `false`. Funciona en Preview y en ROM.

## Notas de diseno

`trigger` es una accion logica, no una tecla fisica cruda. El runtime MSX mapea esas acciones a `input_btn_curr` e `input_state`; el editor puede exponer despues bindings de teclado o gamepad sin cambiar los componentes.

`up` comprueba ahora el estado de direccion normalizado, por eso es ideal para salto con ARRIBA puro. Si un juego necesita que ARRIBA+IZQUIERDA o ARRIBA+DERECHA tambien cuenten como salto, conviene anadir un bit dedicado tipo `INPUT_BTN_JUMP` en vez de sobrecargar `input_state`.

## State Machine

Las condiciones `KEY_PRESSED`, `KEY_RELEASED` y `KEY_AND_MOVEMENT` obtienen su
lista del `Player Config / Controls` vinculado a la State Machine. Un control
desactivado no aparece como opcion. El texto incluye tambien su binding actual
(`Button B / Action 2 — Key N`, por ejemplo).

| Valor canonico | Runtime | Significado |
| --- | --- | --- |
| `up`, `down`, `left`, `right` | direccion logica configurada | Direcciones habilitadas |
| `fire` | `INPUT_BTN_FIRE` | Button A / Action 1 |
| `action2` | `INPUT_BTN_GRAB` | Button B / Action 2 |
| `f1` ... `f5` | matriz de teclado MSX | Tecla de funcion y accion configurada |

El editor guarda `fire` o `action2`, no la tecla fisica. Por tanto, una
transicion configurada con Button B sigue al binding de Controls/Player aunque
el usuario cambie la tecla N/M/CTRL o use el boton B del joystick.

Las teclas F1-F5 conservan su identificador fisico porque no son remapeables en
Player Config. El selector muestra la accion asociada, por ejemplo
`F2 — Pause` o `F3 — Map`, y solo incluye las teclas marcadas como habilitadas.

En el runtime generico, F1-F3 se leen en la fila 6 de la matriz MSX y F4-F5 en
la fila 7 mediante `FAST_SNSMAT`. El helper preserva `B`, `DE` y `HL`; solo
modifica `AF` y `C`, igual que el contrato de lectura de matriz existente.

La ruta bitmap de MSX2 SCREEN 5 emite dentro de `unitedFiles.asm` las
transiciones de entrada `KEY_PRESSED`/`KEY_RELEASED` de la State Machine
vinculada al Player. Las fuentes se resuelven desde el mismo `inputMapping`:
matriz de teclado, joystick 1/2 o trigger A/B. El estado se conserva en el
bloque RAM opcional y vuelve a aplicar el clip de animacion asociado cada
frame. Las condiciones compuestas y las acciones generales de State Machine
siguen perteneciendo al runtime modular completo.

Las Skills y la State Machine pueden leer la misma accion logica en el mismo
frame. El patron recomendado para un golpe es:

- la Skill ejecuta la mecanica (hitbox, dano y cooldown);
- la State Machine cambia al estado/animacion `Attack`;
- la salida de `Attack` usa `ANIMATION_COMPLETE` o un timeout.

No se deben duplicar dano o cooldown en ambos sistemas, porque entonces una
sola pulsacion produciria dos efectos de gameplay.

## Activacion de Skills por colision

Una Skill puede declarar `activationTrigger: 'collision'` en lugar de
`controlIcon`. En Player Config se muestra como `Collision` y no permite
asignar una tecla, combinacion u operador, porque su runtime se dispara al
detectar solapamiento con la entidad correspondiente.

`collector_gems` y `collector_items` usan este contrato. La recoleccion ocurre
al contacto; las entradas A/B quedan disponibles para Skills activas que si
requieren control explicito.

Una Skill tambien puede declarar `activationTrigger: 'collision-input'` junto
con `controlIcon`. Player Config lo representa como `Collision + control`; el
control sigue siendo remapeable, pero la colision y la entrada deben cumplirse
a la vez. `push_door` es el primer caso: por defecto requiere estar delante de
la puerta y pulsar Arriba. El mismo contrato sirve para futuras Skills como
entrar en una tienda al solaparse con su entrada y pulsar Arriba.

Los handlers de Preview/runtime resuelven esta informacion mediante
`getMsx2SkillActivation`: `collision` devuelve entrada nula,
`collision-input` devuelve la entrada configurada y exige conservar el gate de
solapamiento, e `input` mantiene el comportamiento anterior.

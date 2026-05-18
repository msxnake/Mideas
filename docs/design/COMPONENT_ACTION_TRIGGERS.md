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

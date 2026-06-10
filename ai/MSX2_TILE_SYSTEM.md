# MSX2 Tile System Summary

## Fecha: 2026-06-09

## Estructura del Byte de Tile (mapId)

```
┌────────┬────────┐
│ Family │Instance │
│  (4b)  │  (4b)  │
│  bits   │  bits  │
│   7-4   │   3-0  │
└────────┴────────┘
```

### Nibble Superior (FamilyId - bits 4-7)
Determina si el tile es sólido o no.

| Valor | Significado |
|-------|------------|
| 0 | NoSolid (pasable) |
| >= 1 | Solid (sólido) |

### Nibble Inferior (InstanceId - bits 0-3)
Propiedades específicas del tile.

| Bit | Propiedad | Descripción |
|-----|-----------|-------------|
| 0 | isBreakable | Tile rompible |
| 1 | isMovable | Tile empujable/movible |
| 2 | causesDamage | Daña al player |
| 3 | isInteractiveSwitch | Interruptor interactivo |

## CELL_FLAGS Byte (runtime)

```
┌──┬─────┬──────┬────┐
│ 7 │  6  │  5-3 │ 2-0│
├──┴─────┴──────┴────┤
│Zone │Behavior│Eft│Sld│
└─────┴────────┴────┴────┘
```

| Campo | Bits | Máscara | Descripción |
|-------|------|---------|-------------|
| Solid | 0 | 0x01 | 0=vacío, 1=sólido |
| Effect | 2-1 | 0x06 | 0=none, 1=hazard, 2=exit, 3=collectible |
| Behavior | 5-3 | 0x38 | Ver tabla abajo |
| Zone | 7-6 | 0xC0 | Reservado para zonas/material |

## BEHAVIOR (bits 3-5, 3 bits = valores 0-7)

| Valor | Nombre | Descripción |
|-------|--------|-------------|
| 0 | none | Celda normal. Puede ser sólida y tener efecto. Sin lógica extra. |
| 1 | ladder | Escalera. UP/DOWN, cancela gravedad, estado Climbing. |
| 2 | conveyor_right | Cinta transportadora →. Empuja player a la derecha. |
| 3 | conveyor_left | Cinta transportadora ←. Empuja player a la izquierda. |
| 4 | rope | Cuerda. Agarrarse, suspender gravedad, desplazamiento libre. |
| 5 | box | Caja empujable. Runtime dinámico, NO tratar como pared fija. |
| 6 | breakable | Tile rompible. Un solo tipo, sin subtipos. |
| 7 | FREE | Reservado para futuras extensiones. |

## Detección en ASM

```asm
; Obtener behavior:
ld a, (cell_flags)
and MSX2_CELL_BEHAVIOR_MASK   ; #38
srl a
srl a
srl a
; A = behavior (0-7)

; Detectar breakable:
cp 6
jr z, is_breakable

; Detectar box:
cp 5
jr z, is_box
```

## Capas de Pantalla MSX2

| Capa | Bytes | Dimensiones | Contenido |
|------|-------|-------------|-----------|
| NAME_TABLE | 192 | 16x12 | Índices de tiles visuales |
| COLLISION | 192 | 16x12 | 0=vacío, 1=sólido |
| EFFECTS | 192 | 16x12 | 0=seguro, 1=hazard, 2=exit, 3=collectible |
| BEHAVIOR | 192 | 16x12 | 0=none, 1=ladder, 2=conveyor→, 3=conveyor←, 4=rope, 5=box |
| CELL_FLAGS | 192 | 16x12 | Byte packeado: solid + effect + behavior + zone |

## Power Stomp Skill

La skill `power_stomp` usa `breakableTiles` como bitmask para especificar qué tipos de tile son rompibles. El sistema actual usa `instanceId bit 0 = isBreakable`.

## Decisión Tomada

- Solo hay **1 tipo de rompible**, sin subtipos (no brittle/wood/stone)
- BEHAVIOR = 6 se reserva para `breakable`
- Los bits 6-7 (ZONE) quedan libres para futuras extensiones

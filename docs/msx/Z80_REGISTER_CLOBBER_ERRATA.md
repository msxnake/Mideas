# Z80 Register Clobber Across `call` — Generator Errata

## Descripción del bug

Asumir que un registro **sobrevive a un `call`** sin verificar qué destruye la rutina
llamada. Es la causa de bugs silenciosos: el código compila, parece correcto y falla en
runtime de forma difícil de diagnosticar (datos corruptos, "paredes invisibles", saltos a
direcciones basura).

Es exactamente lo que prohíbe la regla de `CLAUDE.md` → *"Antes de Modificar ASM: verificar
qué registros destruye cada función (`call X`). Si destruye un registro que necesitas
después, preservarlo con push/pop ANTES del call."*

## Caso real — SCREEN 5 bitmap `load_room` (2026-06-20)

### Síntoma
En un proyecto SCREEN 5 bitmap (`newOne5.json`): el player aparecía **bloqueado** ("como con
paredes alrededor"), **sin gravedad** (no caía), y **solo se animaba** al pulsar el cursor.
Movía un poco en horizontal hasta toparse con "muro" invisible.

### Código defectuoso
`load_room` guardaba el índice de room en `DE` y lo reutilizaba en los tres lookups de tablas:

```asm
load_room:
    ld (current_screen_index), a
    ld e, a
    ld d, 0
    ; ... lookup render ptr (add hl,de) ...
    ; ... lookup blockcount (add hl,de) ...
    call replay_room_commands     ; <-- DESTRUYE DE
    ld hl, bitmap_room_collision_ptr_table
    add hl, de                    ; DE ya NO es el índice -> puntero basura
    add hl, de
    ; ... LDIR de 192 bytes de colisión desde dirección basura a RAM ...
```

### Causa raíz
`replay_room_commands` llama a `vdp_reinit_cmd_pointer`, que hace `ld e, #20`. Tras el `call`,
`DE = 0x0020`, no el índice de room. El lookup de colisión dereferenció un puntero basura y el
`LDIR` copió **basura al collision map en RAM** (`#C010+`). Resultado: toda celda parecía
sólida → player amurallado, `bitmap_try_move_y` siempre bloqueado → `on_ground` falso → sin
gravedad. La animación seguía porque vive en otra rutina que no depende de la colisión.

### Fix
Re-derivar el índice desde RAM (`current_screen_index`) **después** del `call`, en vez de
confiar en `DE`:

```asm
    call replay_room_commands
    ld a, (current_screen_index)  ; re-derivar; DE fue clobbeado
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_ptr_table
    add hl, de
    ...
```

### Verificación
OpenMSX headless (`-romtype konami`, `peek 0xC000`=player_y): la colisión RAM quedó correcta
(0=vacío, 0x10=sólido), el player cayó (y 128→160), anduvo, y la transición de borde cargó la
room vecina (`current_screen_index` 0→1). **No era problema de mapper**: konami vs auto-detect
daban el mismo fallo.

## Registros que destruyen los helpers del runtime bitmap (`msx2Screen4BitmapRoomGenerator.ts`)

| Rutina                        | Destruye            | Preserva        | Notas |
|-------------------------------|---------------------|-----------------|-------|
| `vdp_write_register`          | AF                  | BC, DE, HL      | Entrada A=reg, E=valor |
| `vdp_reinit_cmd_pointer`      | AF, **E**           | BC, D, HL       | `ld e,#20` — **clobbea E** |
| `vdp_wait_cmd_ready`          | AF                  | BC, DE, HL      | |
| `replay_room_commands`        | AF, BC, **DE**, HL  | IX, IY          | Hereda el clobber de E |
| `load_room`                   | AF, BC, DE, HL      | IX, IY          | |
| `copy_to_vram_ext`            | AF, BC, DE, HL      | IX, IY          | |
| `decompress_bitmap_rle_to_vram` | AF, BC, DE, HL    | IX, IY          | |

## Regla de prevención

1. Antes de reutilizar un registro tras un `call`, **leer la cabecera DESTROYS/PRESERVES** de la
   rutina llamada (y de las que ésta llame en cadena).
2. Si el comentario dice "PRESERVES X" pero el código no lo cumple, **el comentario miente** —
   corregir el comentario y el código. (Aquí `replay_room_commands` decía "PRESERVES DE".)
3. Para datos que sobreviven a varias rutinas, preferir **re-leer desde RAM** o **push/pop**
   antes que confiar en un registro.
4. Mantener actualizada la tabla de arriba al añadir/editar rutinas del runtime.

Ver también: [[SCREEN5_BITMAP_WORLD_ENGINE.md]], `CLAUDE.md` (sección "Antes de Modificar ASM").

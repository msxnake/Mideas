# Soldado: atraviesa suelo y paredes

## Diagnóstico confirmado

La física del intérprete de comportamientos mantiene sondas de un cuerpo de
16×16 aunque el perseguidor se dibuje con un cuerpo de 16×32. El creador del
perseguidor proporciona `hitboxH: MSX2_PURSUER_BODY_HEIGHT` (32), pero los
sensores y el integrador no reciben esa altura: usan constantes de 16 y 8.
Los offsets visuales sirven para recuperar el origen compartido de las capas,
pero no describen la extensión física completa del cuerpo.

La ROM examinada es la de `test744` generada y probada en la corrección de slots.
Las rutinas de comportamiento no se modificaron con aquella corrección ni con
esta investigación.

## Suelo: reproducción sin modificar el estado del soldado

Se navegó por el flujo real hasta `Area51-test`. El jugador se alejó de la puerta
y se esperó la aparición del perseguidor. El suelo empieza en Y=176.

| Dato | Esperado para 32 px | Observado |
|---|---:|---:|
| Origen Y al quedar apoyado | 144 | 160 |
| Borde inferior exclusivo del sprite | 176 | 192 |
| Punto consultado por la sonda inferior | Y + 32 | Y + 16 |

El soldado cae desde su posición de aparición hasta Y=160. La sonda encuentra
el suelo en 176 y detiene la caída, pero los 16 píxeles inferiores están ya
dentro del suelo. No pierde el mapa de colisión: consulta una posición equivocada.

Código: `msx2EnemyBehaviorRuntime.ts`, `bitmap_enemy_script_probe_below`
(líneas 728–740). `FLOOR_AHEAD`, `NO_FLOOR_AHEAD` y `ON_PLATFORM_TILE` también
usan el mismo supuesto de 16 píxeles. El máximo Y sintetizado del perseguidor
es 176, igualmente derivado de una altura de 16 sobre una sala de 192.

## Pared: prueba dirigida con el mapa real

En una segunda ejecución se situó el líder en RAM en X=176,Y=128, mirando a la
derecha, estado Walk, antes de un tick. Se conservaron el programa, la ROM y el
mapa real. La celda por delante en X=192,Y=136 es vacía; en X=192,Y=144 es sólida
con forma parcial, cuyo borde superior ocupa Y=144..151. El cuerpo de 32 píxeles
de alto alcanza esa celda; un cuerpo de 16 no la alcanzaría.

La traza confirmó:

1. `NO_FLOOR_AHEAD` no dispara porque encuentra suelo por delante a Y+16.
2. `WALL_AHEAD` consulta solo Y+8=136 y devuelve falso.
3. Se selecciona la acción WALK (opcode 1).
4. Tras un tick el origen es X=177,Y=129. Su borde derecho exclusivo es 193 y
   su parte inferior intersecta la celda sólida de X=192: ya ha entrado un píxel.

Código: `bitmap_enemy_script_cond_wall_ahead` (líneas 785–789) consulta un único
punto a Y+8. `bitmap_enemy_script_walk_body` (líneas 1163–1199) limita X contra
minX/maxX, pero deliberadamente no consulta sólidos. Por tanto una sonda que no
detecte la pared, o una regla WALK en otro estado sin condición de pared, permite
atravesarla. `TURN_AND_WALK` tampoco valida el paso en la nueva dirección.

## Corrección necesaria

Transmitir al runtime la geometría física del cuerpo, distinta de las capas de
color y del hitbox de daño. El suelo debe consultarse bajo sus pies y las paredes
deben comprobarse en toda su altura, incluyendo las formas de 8×8. El paso real
de movimiento debe respetar sólidos por píxel para que un cambio de estado,
TURN_AND_WALK o una velocidad mayor que uno no permitan atravesarlos.
También deben ajustarse los límites verticales al alto del cuerpo.

Conservar los contratos: el step preserva BC/IX; walk_body actualmente preserva
BC/E/HL/IX/IY y destruye AF/D; integrate_vy preserva BC/HL/IX/IY y destruye AF/DE.
`bitmap_probe_solid` destruye AF/DE/HL y conserva BC. Cualquier nuevo call en el
paso horizontal debe proteger el contador de velocidad, E y HL.

## Evidencia

En `%TEMP%/mideas-enemy-slot-fix/`:

- `soldier-bounds.tcl`, `soldier-bounds.log`, `soldier-floor.png`: caída natural.
- `soldier-wall.tcl`, `soldier-wall.log`: prueba dirigida de una pared que bloquea
  la mitad inferior del cuerpo, con mapa de sala sin modificar.
- `test744.asm`, `test744.rom`, `test744.sym`: ROM y símbolos utilizados.

Las sondas se ejecutaron en OpenMSX Philips NMS 8250 con mapper Konami SCC.
Este diagnóstico localizó y reprodujo el fallo. La corrección posterior ya
está implementada y validada: véase
[SCREEN5_ENEMY_BODY_COLLISION_2026-10-09.md](SCREEN5_ENEMY_BODY_COLLISION_2026-10-09.md).
El JSON original del usuario permanece intacto.

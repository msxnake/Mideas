# SCREEN 5: caché de colores de enemigos — 11 septiembre 2026

La actualización de colores evita copiar de nuevo un bloque de 16 bytes cuando
su offset final no ha cambiado. La clave incluye animación, oscuridad y la
inversión vertical del slime. Cada slot reserva dos bytes al final de la RAM
del subsistema: clave y validez. La carga de sala invalida todos los slots.
El offset 255 es una clave válida, por lo que no se utiliza como centinela.

Solo cambia el generador `msx2BitmapEnemyGenerator.ts`, dentro de la reserva de
RAM y las rutinas de carga/actualización de colores. La clave se guarda antes
de que el wrapper de MegaROM cambie A, y la validez después de copiar. No se
modifica el stride del pool ni el copiador de VRAM.

## Evidencia

OpenMSX, Philips NMS 8250; no se ha probado en hardware físico.
Referencia anterior del módulo de enemigos:
`cb308f04ad9ead3595f068be01ee28251e34afd1`.
Las ROM de juego se reconstruyeron desde los generadores actual y de referencia;
solo se fija a esa revisión el módulo de enemigos para aislar el cambio B.

| Prueba | Anterior | Optimizada |
|---|---:|---:|
| Juego completo Konami, frames emulados | 5400 | 5400 |
| Bloques verificados contra estado del pool y tabla fuente | 20216 | 20216 |
| Errores de color / clave / sonda | 0 | 0 |
| Arranques | 1 | 1 |
| Llamadas a `bitmap_enemy_colors_offset` | 20221 | 2893 |
| Casos dirigidos en ROM residente de 32 KB | 19 PASS | 19 PASS |
| Copias de color en esos casos | 38 | 23 |

La reducción de llamadas observada en el juego es aproximadamente 85,7 %.
Es un conteo de transferencias, no una medida de ciclos ni una mejora de FPS.
Las 2893 llamadas posteriores incluyen 2889 subidas del camino de actualización
y cuatro cargas iniciales. Los contadores abarcan una ventana de 5400 frames;
puede quedar una actualización parcial al cerrar esa ventana.

La ROM dirigida ejecuta las rutinas reales generadas de carga, SAT, iluminación
y colores, junto al copiador real de VRAM. Controla los inputs de pool y luces;
el predicado externo de sala oscura se sustituye por una variable de prueba.
Comprueba las 16 líneas de color de cada slot, los bytes de SAT incluidos slots
vacíos y terminador, BC/HL/IX/IY, R14 y el número exacto de transferencias.

Casos: carga inicial, repetición sin cambio, animación, oscuridad, halo del
jugador, antorcha apagada, linterna de bala, slime en ascenso/techo/caída,
sala vacía, reutilización de slot, retorno a la sala inicial, offset 255 con
validez cero y clave 255, repetición de 255, suma que vuelve a cero y enemigo
muerto oculto en SAT. Las cargas A/vacía/C/A son llamadas dirigidas a
`bitmap_load_enemies`, no recorridos mediante input por las puertas del juego.

La sonda anterior podía imprimir PASS y luego fallar al cerrar el log; también
omitía `vramFails`. La versión 6 corrige ambos defectos, contabiliza errores de
Tcl, conserva PRE/POST por separado y produce manifiestos SHA-256. Una ejecución
negativa fuerza valid=0 en un slot activo: detecta `vramFails=1`, da FAIL y
termina normalmente. Los logs v5 originales se conservan como evidencia histórica.

## Escritores y asignación de VRAM revisados

En `msx2Screen5BitmapRoomGenerator.ts`, los bloques de color de 16 bytes se
asignan consecutivamente a foreground, capas del jugador, enemigos, plataformas,
objetos transportables, fragmentos, torretas, ascensores, crumble y balas. El
generador SHOOT suma esas reservas al calcular el bloque de cada bala.
En la fixture de juego los cuatro enemigos ocupan F420–F45F; las dos primeras
entradas de color, F400–F41F, pertenecen a las categorías anteriores.

La excepción intencionada son las balas de jefe: reutilizan los slots de
enemigos cuando ninguna sala mezcla jefe y enemigos. El generador desactiva
esa reutilización si encuentra una sala mixta. Sus rutinas de carga y SAT
pueden escribir esos colores, pero el pool de enemigos de esa sala está vacío.
Al volver a una sala con enemigos, la carga invalida todas las claves. Los
escritores normales de enemigos son la carga de sala y la actualización de
colores. La tabla fuente es estática y el wrapper de MegaROM selecciona su
banco; el cambio no modifica su contrato.

Se revisaron las reservas en torno a las líneas 16468–16801, la exclusión de
jefes en 16805 y la cadena de carga/actualización en 17875 y 18418 del generador
de salas; las rutinas `bitmap_boss_sbul_load`, `bitmap_boss_sbul_sat` y
`buildBitmapBulletInitUploadAsm` completan el inventario de reutilización.

## Reproducción

Desde la raíz del repositorio, con Node, Java y OpenMSX instalados:

```powershell
& ./test/msx2-screen5-enemy-cache/run_validation.ps1
npm run build
```

El runner compila con Glass, ejecuta las ROM anterior y posterior, comprueba
que los logs son nuevos, exige RUN-COMPLETE y solo termina procesos OpenMSX que
él mismo haya lanzado. La prueba negativa debe dar FAIL; el runner exige que
sea por la corrupción deliberada de validez.

Los tests estructurales cubren las fixtures scripted enemy, bats y slime en
MegaROM y las dos primeras en residente. La fixture completa slime no cabe en
residente por su intro; los estados slime sí se ejecutan en la ROM dirigida.
`npm run build` pasa con el aviso existente de bundles grandes. No se atribuyen
a este cambio mejoras en iluminación, música o transición completa de sala.

Resultado: B validado dentro de esta cobertura; no se han hecho commit ni push.

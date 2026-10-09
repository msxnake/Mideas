# SCREEN 5: reserva completa de sprites de enemigos

## Problema y cambio

El generador de salas expandía cada enemigo en celdas de 16×16 y capas de color,
pero retenía solo cuatro piezas de hardware. En una zona de alerta, el control
del perseguidor rechazaba esa tabla incompleta. Fuera de una alerta, se omitían
piezas con un aviso. El mensaje confundía las capas omitidas del propio soldado
con las de otros enemigos.

Ahora se expanden todas las entidades y se reserva el máximo de piezas usado
por una sala del proyecto. SCREEN 5 evita también el recorte previo a doce
entidades lógicas del resolver compartido; SCREEN 4 conserva ese valor por
defecto. La reserva de enemigos crece junto con sus tablas, pool de RAM,
caché de colores y escrituras SAT, que ya dependían del número reservado.

Se rechazan más de 32 piezas de enemigos en una sala. Además, se comprueba el
total absoluto de slots SAT: reservas, primer plano, armas delanteras, jugador,
enemigos, rangos de balas de jefes, plataformas y otros sistemas, armas y balas
del jugador. El control se ejecuta incluso con SHOOT y armas desactivados.
La comprobación independiente de capacidad de patrones de VRAM se conserva.

Las rutinas ASM y sus contratos de registros no cambian. La compacción de
patrones repetidos sigue activa cuando cumple sus condiciones. El límite de
sprites por línea y la carga residente/dinámica por mundo son cuestiones
distintas de esta reserva; no se introduce el switch propuesto para enemigos.

## test744

El proyecto de Downloads tiene seleccionado el soldado «alternativa agente».
Su distribución rectangular de capas requiere ocho slots: cuatro por celda,
incluida una capa vacía de relleno. El otro enemigo de `Area51-test` ocupa dos.
El nuevo máximo de enemigos es diez; la reserva del soldado es ocho.

El JSON original se exportó con el pipeline TypeScript moderno, se compiló con
Glass incluyendo `server`, y se generó una ROM Konami SCC de 256 KiB con padding
FF. La auditoría del banco del perseguidor pasó. En OpenMSX Philips NMS 8250 se
avanzó por el flujo real (presentación, intro y menú), desde la sala inicial 4
hasta 3, 2 y 1. Tras cuatro segundos de espera en la sala 1 aparecieron todas
las capas del soldado y siguió visible el enemigo situado a la derecha.
El pool tenía un líder scripted y siete seguidores alineados; el otro enemigo
conservaba sus dos capas. Se inspeccionó la captura y las entradas SAT.

Artefactos de esa ejecución: `%TEMP%/mideas-enemy-slot-fix/`, incluyendo
`test744.asm`, `test744.rom`, `test744.sym`, `navigation.tcl`, `navigation.log`
y `test744-soldier.png`. El script acelera la intro y vuelve a velocidad normal
al llegar a la sala objetivo para que la captura muestre el frame actualizado.

## Regresión

```powershell
node scripts/check_msx2_pursuer_contract.mjs
./test/msx2-sprite-pattern-compaction/run_validation.ps1 -Project C:/Users/salam/Downloads/test744.json
node scripts/check_msx2_enemy_color_cache.mjs
node scripts/check_msx2_sprite_part_offsets.mjs
node scripts/check_bitmap_ram_aliasing.mjs
```

El contrato cubre seis piezas en salas con/sin alerta, cuerpo completo del
soldado, 17 enemigos de dos celdas (34 piezas), desbordamiento del presupuesto
global con patrones que sí caben, el límite exacto de 32 y la bala adicional.
La batería de compacción conserva sus 76 casos de OpenMSX. También pasan las
comprobaciones de caché de colores, offsets de partes y aliasing de RAM, y el
build de producción de Vite. Los outputs de build se escriben en la carpeta
temporal para preservar los del repositorio.

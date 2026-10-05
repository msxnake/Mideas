# Transiciones SCREEN 5 (`msx2transition`) - F0: viabilidad y medición

Fecha: 2026-10-04. Alcance: SOLO medición. No se ha tocado ningún generador ni código de producción.
Todo lo medido sale de OpenMSX 21.0 (`C-BIOS_MSX2+_JP`, 128 KB de VRAM) con los scripts de
`test/msx2-transition-fx/` (sección 9). Cada cifra lleva su origen:

- **[M]** medido en OpenMSX o sobre la ROM compilada por Glass.
- **[C]** calculado a partir de cifras medidas.
- **[L]** leído del código (ruta y línea; las líneas son de la rama `fixing-bugs` de hoy).

Proyecto de referencia: `Downloads/test716.json` (152 MB, 185 assets, backend bitmap-room, MegaROM Konami SCC).
Flujo real: Start -> Screen5Presentation (`msx2presentation_1784393641268`, waitForKey) -> Music -> Intro -> SubMenu -> WorldLink -> Restart.

## 1. Veredicto por punto

| # | Punto | Veredicto | Cifra clave |
|---|---|---|---|
| 1 | Presupuesto residente | **VIABLE** | 1.144 B libres en la ventana residente de test716 (868 en test710, **229 en test703**); un trampolín de 14 B cabe (ensamblado y comprobado en test716) |
| 2 | Páginas VRAM 1-3 libres durante la presentación | **VIABLE** | Intactas (centinela #A5) durante todo `run_bitmap_intro`; seguro: página 1 filas 0-231 (VRAM #8000-#F3FF) |
| 3 | Coste del blit | **VIABLE con matices** | HMMM 250x53 = 29,91 ms (1,79 frames a 60 Hz) sin sprites; 38,63 ms con 9 sprites. 4,51 / 5,83 µs/B **confirmado** |
| 3b | Flip de página por R#2 (0<->3) | **VIABLE, instantáneo** | 2 OUT; efecto en la línea de barrido siguiente; sin tearing si se escribe en los primeros ~3,2 ms tras el flag de vblank |
| 4 | RAM `#E700-#E73F` | **LIBRE** | Nadie la usa; la Intro ocupa `#E600-#E6FF` entero (no `#E6DF`) |
| 5 | Bytes de imagen | **calculado y contrastado con la ROM** | RLE completo 8.934 B; logo 6.625 B en bruto; alien 7.072 B en bruto |

## 2. Presupuesto residente (tarea 1)

`node scripts/measure_bitmap_rom_budget.mjs C:\Users\salam\Downloads\test716.json --asm ... --sym ... --keep ...` funciona
(compila sin errores; ~10 s la primera vez, 2 s con `--reuse-build`).

| Proyecto | ROM | Residente `#4000-#BFFF` libre [M] | Holgura total en bancos de datos [M] |
|---|---|---|---|
| test716 | 28 bancos (4 residentes + 24 de datos, 224 KB) | **1.144 B** (usados 31.624 de 32.768; último byte útil `#BB87`) | 44.267 B |
| test710 | 26 bancos | 868 B | 43.726 B |
| test703 | 22 bancos | **229 B** | 40.598 B |

- El mapper Konami SCC llega a 256 bancos (2 MiB): a test716 le quedan 228 bancos sin usar. Bancos de datos de test716 con >5 KB de cola libre: 13, 15, 19, 21, 23, 24 [M].
  Un banco nuevo para el intérprete del efecto no es problema.
- Desglose del residente de test716: la Intro ya tiene su trampolín `bitmap_intro_run` + `bitmap_intro_copy_vram` + `bitmap_intro_music` en `#500F-#5048` (58 B)
  y `run_bitmap_intro` (presentación legacy) en `#4EBA` [M, .sym].
- **El espacio libre es la cola del flujo lineal (`#BB88-#BFFF`), no hay hueco "bajo `#8000`"**. El trampolín debe quedar bajo `#8000`, así que se inserta
  en el mismo sitio que el de la Intro (tras `bitmap_room_restore_resident_banks`) y todo lo posterior se desplaza N bytes hacia la cola.
- **Comprobación empírica** (`splice_resident_check.mjs`): se inserta un trampolín borrador de 14 B
  (`ld (var),a / ld a,BANK / call mapper_set_bank_p2 / call interprete / jp bitmap_room_restore_resident_banks`) en test716 y se ensambla con Glass [M]:

  | Variante | Resultado |
  |---|---|
  | +14 B (trampolín) | ensambla; libres 1.130; el trampolín queda en `#500F-#501D` (< `#8000`) |
  | +14 +25 B / +14 +100 B | ensambla; libres 1.105 / 1.030 |
  | relleno exacto hasta 0 libres | ensambla |
  | un byte más | **falla: `Negative initial size: -1`** (el control rojo: la cifra de 1.144 B es exacta al byte) |

- Un trampolín de ~15-25 B (+5 B por llamada) cabe en los tres proyectos medidos. El marcador residente (`INTRO_RESIDENT_MARKER`) solo se emite si el flujo tiene un asset Intro (`introResidentMarker`, l.4534 y l.18916; sustitución en l.19277, [L]):
  hay que activarlo también cuando solo haya efecto.
- **Reutilizar el motor `bitmap_tfx_*` existente como código Z80 residente NO conviene:** medido sobre `test/msx2-transitions/out/bitmap_intro_pattern.asm` ocupa
  `#513E-#5418` = **730 B** (661 B de código + tablas). En test703 (229 B libres) no cabe y en test716 se comería el 64 %. Reutilizarlo solo como fuente de planes de rectángulos en TS.

## 3. VRAM durante la presentación (tarea 2)

### 3.1 Código [L]

`init_rom` (generado en `msx2Screen5BitmapRoomGenerator.ts` l.19597-19612; orden idéntico en el `.asm` real de test716):

1. `init_screen5_bitmap_vdp` (l.4701): CHGMOD 5, R#1=#62, **R#2=#1F (página 0)**, **R#5=#EF (SAT en #F600, tabla de colores 512 B debajo, #F400)**,
   **R#6=#1F (patrones de sprite #F800)**, R#11=#01, **R#9=#80 (212 líneas, NTSC 60 Hz)**.
2. `run_bitmap_intro` (l.1543): R#8=#0A (sprites OFF), `bitmap_intro_cls` (HMMV solo página 0), sube la escena por RLE a **página 0** (`buildRleChunksForVram(...,0,...)`, l.16917-16922), espera.
3. Solo después: paleta del juego, `init_bitmap_hud_band` (página 0 y **página 1** filas 0-19), `upload_tileset_atlas` (páginas 2-3), `init_hardware_sprite_tables`
   (#F400/#F600/#F800), `upload_bitmap_dialogue_gfx`, bala (#FE00, #F520).
4. El dispatcher pasa de largo por los `Screen5Presentation` (l.939-944): la presentación se reproduce **solo en el arranque**. `Restart` = `jp init_rom` (l.1107), es decir,
   repite el arranque completo sobre una VRAM ya usada: los datos de las páginas 1-3 se reescriben igual tras la presentación.

### 3.2 Medido en OpenMSX [M]

Sonda `vram_free_probe.mjs`: al entrar en `run_bitmap_intro` escribe el centinela #A5 en VRAM filas 256-1023 (96 KB); en `load_screen5_bitmap_palette` (primera instrucción tras
volver) y en `bitmap_gf_entry` (fin de `init_rom`) relee fila a fila. Resultados en `vram_free_test716.txt` (ROM real de test716, SPACE pulsado) y `vram_free_small.txt`
(fixture pequeño `test/msx2-bitmap-intro/bitmap_intro_test.json`, con vertical pixel wipe).

| Momento | test716 | fixture pequeño |
|---|---|---|
| (A) tras `run_bitmap_intro` | **las 768 filas intactas** (páginas 1, 2 y 3) | **las 768 filas intactas** |
| (B) tras el resto de `init_rom` | reescritas: p1 filas 0-19 (HUD seed #8000-#89FF); p1 filas 232, 234, 236, 240-247, 252 (tablas de sprites + bala); p2 completa y p3 filas 0-47 (atlas, 38.912 B); p3 filas 144-255 (glifos de diálogo). **Intactas: p1 filas 20-231, p3 filas 48-143** | p1 filas 0-19, 232/236/240-242; p2 filas 0-31 |
| (C) primera sala ya en pantalla (`bitmap_enter_game_loop`) | no medido (exige pasar Intro y SubMenu con teclas) | igual que (B): **la primera sala solo pinta la página 0; la página 1 filas 20-231 sigue intacta** |

- **Tablas de sprites = página 1 filas 232-255 (VRAM #F400-#FFFF)**, confirmado por R#5/R#6 y por las filas "tocadas" de la sonda. El efecto usaría filas 0-211 de la página 1
  (VRAM y 256-467): **no coincide**. Rango seguro de la página 1: **filas 0-231 (#8000-#F3FF)**; las filas 212-231 son el hueco "468..487" del comentario de presupuesto VRAM
  que emite el generador [L, l.18898].
- Las páginas 2 y 3 enteras también están libres en ese instante (sirven para el doble buffer 0<->3).
- **Lo que deja el efecto en la página 1 (filas 20-231) lo reescribe el primer cambio de sala:** el programa de render de cada sala para la página 1 empieza con un clear y
  copia los tiles ("clear + 16x16 tile copies", l.16887) [L]; hoy esa zona ya llega con basura de arranque en frío o con la partida anterior tras `Restart`. Riesgo bajo, pero conviene
  probar una transición de sala tras una presentación con efecto.
- `run_bitmap_intro` corre **antes** de que se inicialice la RAM (el latch multi-mundo va después, l.19603-19606): el intérprete del efecto no puede suponer ningún estado previo.

## 4. Coste de los comandos (tarea 3)

### 4.1 Método [M]

ROM `hmmm_cost_bench.asm` (16 KB, `org #4000`), mismo bucle de sondeo que `test/msx2-lighting/lmmv_bench.asm` (37 T = 10,336 µs), registros VDP idénticos a
`init_screen5_bitmap_vdp`, display ON, 212 líneas. Se ejecuta en 4 condiciones (sprites OFF / 9 sprites, 60 / 50 Hz) y por cada orden da tres cifras independientes entre sí:

- **M1** iteraciones de sondeo x 10,336 µs (tiempo de blitter ocupado, método del proyecto);
- **M3** reloj emulado entre el lanzamiento y el fin del sondeo (`machine_info time` en breakpoints, todas las repeticiones);
- **M2** reloj emulado de todo el bucle de K repeticiones / K (incluye el envío de registros del Z80).

**Calibración:** M3 / iteraciones = **10,3367 µs/iteración** en las cuatro condiciones frente a los 10,336 de 37 T: el contador del proyecto queda validado al 0,01 %.
Periodo de frame medido: **16,692 ms (R#9=#80, 59,9 Hz)**; con NT=1 **19,940 ms**.
Verificación funcional en cada ROM: el HMMM copia 6.625/6.625 bytes del rectángulo del logo (página 1 -> página 0) y el HMMV rellena el rectángulo sin tocar vecinos
(la medición no cronometra una orden vacía).

### 4.2 Resultados, 60 Hz (el proyecto fija 60 Hz con R#9=#80) [M]

Sin sprites (lo que hay en pantalla durante la presentación: `run_bitmap_intro` pone R#8=#0A):

| Orden | Bytes | ms por orden (M3) | µs/byte | % de frame (16,69 ms) |
|---|---|---|---|---|
| HMMM 250x53 (logo) | 6.625 | **29,911** | 4,51 | 179 % (1,79 frames) |
| HMMM 250x2 | 250 | 1,126 | 4,51 | 6,7 % |
| HMMM 250x4 | 500 | 2,258 | 4,52 | 13,5 % |
| HMMM 250x8 | 1.000 | 4,513 | 4,51 | 27,0 % |
| HMMV 250x53 | 6.625 | 18,390 | 2,78 | 110 % |
| HMMV 250x2 / x4 / x8 | 250 / 500 / 1.000 | 0,694 / 1,391 / 2,778 | 2,78 | 4,2 / 8,3 / 16,6 % |
| HMMM 256x212 (pantalla entera) | 27.136 | 122,404 | 4,51 | 733 % |
| HMMV 256x212 | 27.136 | 75,337 | 2,78 | 451 % |

Con 9 sprites activos (R#8=#08), 60 Hz:

| Orden | ms por orden (M3) | µs/byte | % de frame |
|---|---|---|---|
| HMMM 250x53 | **38,627** | 5,83 | 231 % |
| HMMM 250x2 / x4 / x8 | 1,461 / 2,919 / 5,832 | 5,84 | 8,8 / 17,5 / 34,9 % |
| HMMV 250x53 | 19,102 | 2,88 | 114 % |
| HMMV 250x2 / x4 / x8 | 0,722 / 1,444 / 2,884 | 2,89 | 4,3 / 8,6 / 17,3 % |
| HMMM / HMMV 256x212 | 158,109 / 78,037 | 5,83 / 2,88 | 947 % / 468 % |

### 4.3 Resultados, 50 Hz (NT=1; informativo, el arranque va a 60 Hz) [M]

| Orden | sin sprites ms (% de 19,94) | 9 sprites ms (%) |
|---|---|---|
| HMMM 250x53 | 29,647 (148,7 %) | 36,471 (182,9 %) |
| HMMM 250x2 / x4 / x8 | 1,115 / 2,238 / 4,476 (5,6 / 11,2 / 22,4 %) | 1,378 / 2,755 / 5,514 (6,9 / 13,8 / 27,7 %) |
| HMMV 250x53 | 17,855 (89,5 %) | 18,358 (92,1 %) |
| HMMV 250x2 / x4 / x8 | 0,671 / 1,346 / 2,691 | 0,694 / 1,391 / 2,768 |
| HMMM 256x212 | 121,363 | 149,318 |

El blitter va algo más rápido a 50 Hz con sprites (5,51 frente a 5,83 µs/B); lo atribuyo a que el vblank es más largo (interpretación, no medida aparte). Tablas completas: `test/msx2-transition-fx/summary_tables.md`.

### 4.4 Lectura [M]/[C]

- **Se confirma 4,5-5,8 µs/B para HMMM** (4,51 sin sprites; 5,83 con 9 sprites, +29 %) **y 2,78-2,88 µs/B para HMMV.** Coinciden con `lmmv_bench.txt` (4,507 / 5,824 / 2,876).
- **El coste fijo por orden NO está en el VDP:** el ajuste lineal tiempo = fijo + filas x coste/fila sobre las tiras de 2/4/8 filas da un término fijo de **-0,004 a +0,006 ms** (cero)
  y reproduce las 53 filas al microsegundo (p. ej. HMMM sin sprites: 29,910 previsto, 29,911 medido). El "0,22-0,35 ms por orden" de la memoria `v9938-command-cost-measured`
  es trabajo del Z80 (programar los 11-15 registros con las rutinas `vdp_write_register`/`reinit`). Aquí el envío con `OTIR` + contabilidad cuesta **0,163 ms (HMMM, 15 B) y 0,137 ms (HMMV, 11 B)**
  por orden (M2 - M3; cota superior, incluye la contabilidad del banco de pruebas). El intérprete en banco debería moverse en 0,1 ms por orden.
- Coste por fila de 250 px (pendiente del ajuste) y filas por frame con el blitter al 100 % [C]:

  | Condición | HMMM ms/fila | filas/frame | filas en 2 frames | HMMV ms/fila | filas/frame |
  |---|---|---|---|---|---|
  | sin sprites, 60 Hz | 0,5645 | 29,6 | 59,1 | 0,3472 | 48,1 |
  | 9 sprites, 60 Hz | 0,7286 | 22,9 | 45,8 | 0,3603 | 46,3 |
  | sin sprites, 50 Hz | 0,5601 | 35,6 | 71,2 | 0,3367 | 59,2 |
  | 9 sprites, 50 Hz | 0,6893 | 28,9 | 57,9 | 0,3456 | 57,7 |

- **Revelado en persiana**: una tira de 250x2 cuesta 1,13 ms (6,7 % del frame): sobra holgura a 60 fps; 250x8 por frame ocupa el 27 %.
- **Logo entero bajando (HMMM de 250x53 por paso)**: 29,9 ms = 1,79 frames a 60 Hz sin sprites: un paso cada 2 frames (30 fps). Margen hasta los 33,4 ms de 2 frames: 3,5 ms, de los que el HMMV de la estela (d x 0,347 ms/fila; d=4 -> 1,4 ms) y el envío de órdenes (~0,15 ms cada una) se llevan ~1,5-2 ms.
  Con sprites encendidos (38,6 ms) serían 3 frames por paso; no aplica en el arranque porque los sprites están apagados.
- **Tearing al copiar sobre la página visible** [C]: el haz recorre 15,7 líneas/ms; el HMMM copia 1,77 filas/ms (0,5645 ms/fila). Una copia del logo entero (30 ms) abarca ~2 frames y
  durante ese tiempo se ven filas nuevas y viejas mezcladas. Aceptable en un revelado (el estado intermedio ES el efecto) y poco bonito en un deslizamiento: ahí conviene el doble buffer con FLIP.
- **Doble buffer 0<->3 y presupuesto** [C]: con doble buffer la tira a copiar es (53 + 2d) filas por paso (la estela de dos pasos). En 2 frames caben 59,1 filas de HMMM (60 Hz, sin sprites)
  -> d <= 3 filas/paso con margen casi nulo para el overhead de órdenes; con d=4 (61 filas = 34,4 ms) se pasa a 3 frames por paso. Es una restricción de F1 a tener presente.

### 4.5 Flip de página por R#2 (0 <-> 3) [M]

ROM `page_flip_probe.asm`: página 0 = rojo, página 3 = verde (HMMV a filas 0 y 768). Tras cada flag de vblank (S#0 bit 7, etiqueta `pf_edge`) espera un retardo
configurable y escribe R#2 = #7F / #1F alternando (`pf_flip`). El host registra el instante de la escritura, el valor leído del banco de registros del VDP justo después
y hace capturas (`run_flip_probe.mjs`, `analyze_flip.py`).

| Escritura tras el flag | Registro leído justo después | Efecto en pantalla (fotograma capturado) |
|---|---|---|
| 22 µs | #7F / #1F (el valor escrito, al instante) | fotograma entero de una sola página (sin corte) |
| 2.534 µs | idem | fotograma entero de una sola página |
| 3.791 µs | idem | corte en la línea 10 |
| 5.048 µs | idem | corte en la línea 29 (esperado 29,7) |
| 6.305 / 7.562 µs | idem | líneas 49 / 69 (esperado 49,5 / 69,2) |
| 10.077 / 12.591 µs | idem | líneas 108 / 148 (esperado 108,7 / 148,2) |

- El corte avanza **1 línea por 63,69 µs de retardo** (error <= 1 línea): R#2 se aplica **en la siguiente línea de barrido, no se latchea por frame**. El FLIP es instantáneo (2 OUT, 22 µs de CPU, 0 ms de blitter frente a 122 ms de un HMMM de pantalla entera).
- La primera línea visible empieza **~3,18 ms (+-0,06) tras el flag** (212 líneas, NTSC): una escritura de R#2 (o de paleta) en los primeros ~3,1 ms es limpia (fotograma completo con la página nueva).
  Concuerda con el "~0,2 ms de ~3,2 ms" de la regla del diseño.
- Control rojo: con el build `--flip-reg 4` (escribe en R#4 en vez de R#2) los fotogramas salen todos rojos y R#2 se queda en #1F (`flip_shots_reg4/`).
- Cautela: las capturas de OpenMSX pueden salir con fotogramas viejos (memoria `openmsx-smoke-romtype-konami`/notas de smoke); por eso la prueba usa la posición del corte, que es idéntica en todos
  los fotogramas, y no la alternancia de colores entre capturas consecutivas.

## 5. RAM libre (tarea 4)

- **Intro**: `BITMAP_INTRO_RAM_BASE = #E600`, `INTRO_RAM_BYTES = 0x100` (`msx2BitmapIntroGenerator.ts` l.44-46). Las variables llegan a `bitmap_intro_pal EQU #E6E0` (32 B, paleta de la slide para el fundido)
  [L, l.367-404; confirmado en el .sym de test716: `bitmap_intro_which #E600` ... `bitmap_intro_pal #E6E0`]. **La Intro ocupa `#E600-#E6FF` completo; `#E600-#E6DF` (memoria y diseño) está obsoleto.**
- Otros ocupantes de la franja alta [L]: motor de texto del GameFlow `#E000-#E4FF` (`BF_RAM_BASE #E000`, `BF_TEXTBUF_BASE #E100`, 8 filas x 128 B; el "end screen" usa `#E0C0-#E0DE`
  dentro de esa ventana); `#E500-#E5FF` sin uso. En el `.sym` de test716 **no existe ningún símbolo >= `#E700`** [M]; búsqueda de literales `#E7xx`/`0xE7xx`/`#F0xx-#F3xx` en `utils/msxGenerator`: ninguno
  salvo variables de sistema BIOS (`#F3xx`).
- **`#E700-#E73F` está libre (64 B)**; hasta `#F2FF` no hay usuarios conocidos (el sistema BIOS empieza en `#F380` y la pila baja desde ahí).
- **Pero ninguna guarda lo impide hoy**: la cadena de RAM dedicada (HUD, gemas, boss...) arranca en `#D000` y su techo nominal es `#F000` (`HUD_LINKED_RAM_CEILING`, l.18017). Solo el chequeo de la Intro
  (`ramChainEnd > #E600` -> error, `msx2BitmapIntroGenerator.ts` l.247) protege `#E600+`, y **solo se ejecuta si el flujo tiene un nodo Intro** (l.243). En test716 la cadena termina en `#D373`
  (`@mideas-ram-budget`: chainEnd 54.131) [M]: sobran ~7 KB. Para usar `#E700` hay que ampliar la guarda a "Intro o efecto" (`chainEnd <= #E700`; `<= #E600` si hay ambos).
- Alternativa gratis (sin verificar en código): la Intro y el efecto de arranque nunca corren a la vez (el efecto va en `init_rom`, la Intro en el dispatcher; ambos inicializan su estado), así que el
  efecto podría compartir `#E600-#E6FF` con la Intro y no necesitar RAM nueva ni guarda nueva (solo la de `#E600`).

## 6. Aritmética de bytes (tarea 5)

`image_bytes.mjs` replica `buildScreen5BitmapBytes` + `buildRleChunksForVram` (pares (cuenta<=255, valor), nuevo chunk cada `RLE_ROM_CHUNK_MAX_BYTES = #1F00`, corte en cada
frontera de 16 KB de VRAM). Entrada: asset `msx2presentation_1784393641268` (256x212, `fitMode stretch`, 27.136 B empaquetados; `pixels[][]` y `packedBitmap` coinciden en los 27.136 bytes).

| Concepto | Bytes |
|---|---|
| Bitmap completo en bruto (212 filas x 128 B) | 27.136 |
| **Bitmap completo RLE tal como lo emite hoy** | **8.934** en 2 chunks: 6.998 + 1.936 (32,9 % del bruto) |
| Logo, rect x4-253 y12-64 (250x53) en bruto | **6.625** |
| Logo, RLE continuo / RLE por filas | 5.478 / 5.572 |
| Alien, rect x68-171 y65-200 (104x136; caja de los píxeles no negros, byte-alineada) en bruto | **7.072** |
| Alien, RLE continuo / por filas | 3.432 / 3.682 |
| Todo lo no negro (x4-253, y12-200) en bruto / RLE continuo | 23.625 / 8.910 |

- **Contraste con la ROM compilada:** `bitmap_intro_scene0_rle_chunk_0`..`_end` = 6.998 B en el banco 14 y `chunk_1` = 1.936 B en el banco 15 (`.sym` de test716) [M]: 6.998 + 1.936 = **8.934 B exactos**.
  El "8.932" del documento de diseño es 2 B menos.
- El 77,4 % de los píxeles (42.015 de 54.272) son el índice 1 (negro). El logo (bbox real x4-252, y12-64) y el alien (x68-170, y65-200) están separados en y (el alien empieza en la fila 65).
- El asset declara `compression: {codec: ZX0, enabled: true}`, pero el backend bitmap-room **no tiene ZX0** (solo el walker, con un búfer en `#D000`): emite RLE. Subir la imagen a la página 1 cuesta lo mismo
  que hoy a la página 0 en ROM (mismo flujo RLE) y ~0,21 s de CPU [C] (27.136 B x ~28 T/byte de `decompress_bitmap_rle_to_vram`) que ya se paga hoy.

## 7. Control de calidad de lo medido (tarea 6)

| Medición | Sabotaje | Resultado esperado y obtenido |
|---|---|---|
| Verificación del HMMM del banco | `SABOTAGE=1`: el HMMM lee desde SX+2 | **ROJO**: 6.625 de 6.625 bytes distintos (en la ROM normal: 0) |
| Coste por tamaño | `LOGO_H` 53 -> 106 | 29,911 -> 59,835 ms (x2,000); HMMV 18,390 -> 36,820 ms: la cifra sigue al tamaño |
| Condición de sprites | sprites ON/OFF | 4,51 -> 5,83 µs/B (+29 %), igual que `lmmv_bench.txt` |
| Reloj del sondeo | M3/iteraciones en las 4 condiciones | 10,3367 µs/iter frente a 10,336: constante validada |
| Frame del VDP | `after frame` en OpenMSX vs el contador del banco | 16,69 ms vs 16,66 (M1) / 16,69 (M2) |
| Sonda de VRAM libre | `--sabotage`: escribe #5A en la fila 300 durante la presentación | **ROJO**: la fila 300 aparece "touched" en (A) (`vram_free_small_sabotage.txt`) |
| Flip | `--flip-reg 4`: escribe en el registro equivocado | **ROJO**: todo rojo, R#2 inmóvil. Y el corte sigue el retardo (10 -> 148 líneas) |
| Presupuesto residente | relleno +1 B | **falla** con `Negative initial size: -1` |
| Bytes de imagen | bitmap puesto a ceros | 8.934 -> 216 B; el contador de discrepancias `pixels[][]` vs `packedBitmap` pasa de 0 a 27.136 |

Bug propio encontrado y corregido durante el trabajo: la primera versión del periodo de frame daba 15,46 ms porque el primer `wait_frame_flag` consumía un flag antiguo latcheado desde la última
lectura de S#0; ahora se consume el flag viejo y se arranca en un flanco real.

## 8. Riesgos y bloqueos para F1 y siguientes

1. **Coste fijo por orden**: el diseño supone ~0,35 ms por orden (Z80). Medido 0,14-0,16 ms con `OTIR` (cota superior). Es una holgura a favor, pero no confiar en ella: el presupuesto por frame debe ser parámetro del compilador.
2. **Deslizar con HMMM sobre la página visible rasga** durante ~2 frames por paso. El doble buffer 0<->3 es viable (páginas libres, FLIP instantáneo), pero la tira por paso crece a 53+2d filas: con d >= 4 se pasa de
   2 a 3 frames por paso (sin sprites, 60 Hz). Decidir d y número de pasos con esas cifras.
3. **Regla de FLIP**: escribir R#2/paleta/R#7 solo en los primeros ~3,1 ms tras el flag de vblank (justo después de `SYNC`) o aparecerá un corte a esa altura.
4. **Sprites**: apagados durante la presentación (R#8=#0A) -> cifras "sin sprites". Si algún día el efecto corre con sprites (p. ej. desde la Intro) el HMMM cuesta +29 % y 250x53 pasa de 1,8 a 2,3 frames.
5. **Residente**: sobra en test716 (1.144 B) y en test710 (868 B), pero test703 solo tiene **229 B**. El trampolín (14-25 B) cabe, el motor `bitmap_tfx_*` residente (730 B) no. Mantener el intérprete en banco
   y no sumar más código residente. El marcador residente debe activarse con "Intro o efecto".
6. **RAM**: la guarda de `ramChainEnd` solo existe con Intro; hay que extenderla a `#E700` (o compartir el bloque de `#E600` con la Intro). `#E600-#E6FF` está lleno (la memoria que dice `#E6DF` está desfasada).
7. **Arranque en frío**: `run_bitmap_intro` corre antes de inicializar la RAM (latch multi-mundo, espejo `mapper_bank_p2_current`); el intérprete debe inicializar todo su estado y restaurar P2/P3 al volver
   (`bitmap_room_restore_resident_banks`, como hace `bitmap_intro_run`).
8. **Restos en la página 1** (filas 20-231) tras el efecto: la primera sala solo pinta la página 0 (medido), así que la página 1 conserva la imagen hasta la primera transición, que la repinta con un clear.
   Probar una transición de sala justo después de una presentación con efecto.
9. **El motor de transiciones ya existe** (`screen5TransitionEngine.ts`, `msx2TransitionPatterns.ts`: HMMV + fundidos de paleta, nodos `Transition`). El diseño ya lo contempla como fuente de planes; ojo a que
   `run_bitmap_intro` ya reproduce la cadena Screen5Presentation -> Transition y a que existe `consumedTransitionIds` para no repetir transiciones en el dispatcher.
10. **Imagen**: 8.934 B de RLE en 2 bancos (14 y 15 en test716); el efecto no añade ROM de imagen (misma RLE, destino página 1). Con imagen derivada recuantizada habrá que recalcular (el diseño dice 8.928).
11. **OpenMSX**: capturas con `throttle off` pueden salir viejas; las aserciones deben ser sobre VRAM/RAM/registros, no sobre PNG, salvo el análisis de posición de corte usado aquí.

### Discrepancias con `MSX2_TRANSITION_FX_DESIGN.md`

- RAM de la Intro: `#E600-#E6FF`, no `#E600-#E6DF`; `#E700` libre pero sin guarda para proyectos sin Intro.
- "~0,35 ms por orden": es coste de Z80, medido 0,14-0,16 ms con OTIR; el VDP no añade coste fijo (< 6 µs).
- HMMV: 2,78 µs/B sin sprites (el diseño usa 2,88, que es el valor con sprites); inocuo.
- RLE completo 8.934 B (diseño: 8.932).
- "FLIP 0<->3 gratis": el flip lo es (22 µs); no lo es la tira extra que exige el doble buffer (sección 4.4).

## 9. Reproducir

Todo en `test/msx2-transition-fx/` (cwd = raíz del repo):

| Paso | Comando |
|---|---|
| Presupuesto residente | `node scripts/measure_bitmap_rom_budget.mjs <test716.json> --asm out.asm --sym out.sym --keep out.rom` |
| Trampolín cabe / +1 B falla | `node test/msx2-transition-fx/splice_resident_check.mjs out.asm` |
| VRAM libre (ROM real) | `node test/msx2-transition-fx/vram_free_probe.mjs --rom out.rom --sym out.sym --press-space --no-game` (y `--project <json>` / `--sabotage`) |
| Coste HMMM/HMMV | `node test/msx2-transition-fx/run_bench.mjs --sprites 0\|1 --hz 60\|50 [--logo-h N] [--sabotage 1]` y `node test/msx2-transition-fx/summarize_bench.mjs` |
| Flip | `node test/msx2-transition-fx/run_flip_probe.mjs 0 300 450 600 750 900 1200 1500 [--flip-reg 4]` y `python test/msx2-transition-fx/analyze_flip.py [carpeta]` |
| Bytes de imagen | `node test/msx2-transition-fx/image_bytes.mjs <test716.json> msx2presentation_1784393641268 --rect logo:4,12,253,64 --rect alien:68,65,170,200` |

Salidas guardadas: `results_*.json`, `summary_tables.md`, `vram_free_*.txt`, `splice_resident_test716.txt`, `image_bytes_test716.txt`, `flip_shots/`, `flip_shots_reg4/`.
`bench_cfg.asm` y `flip_cfg.asm` los reescriben los drivers (valores por defecto: sprites OFF, 60 Hz, LOGO_H 53, sin sabotaje; retardo 0, R#2).

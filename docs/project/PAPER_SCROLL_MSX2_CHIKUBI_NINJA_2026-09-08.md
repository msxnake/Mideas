# Scroll suave sin bitmap en MSX2/MSX2+: ingeniería inversa del motor de Chikubi Ninja (MSXdev25)

**Autor:** análisis realizado con asistencia de agente de código (ZCode), septiembre de 2026
**Objeto:** `MSXdev25_ChikubiNinja_v1.1.rom` (64 KB) — diseño y código: David Fernández "Imanok" (2025)
**Método:** desensamblado estático (z80dis) + verificación dinámica en openMSX (FS-A1WSX y NMS-8250)
**Estado:** completo para el sistema de scroll y la librería VRAM; parcial para la lógica banca en 0x8000

---

## Resumen

Se documenta, mediante ingeniería inversa y verificación empírica en emulador, el sistema de
scroll del plataformas *Chikubi Ninja* (MSXdev25). El juego usa **SCREEN 4** (tiles 8×8, 16
colores) — no un modo bitmap — y consigue scroll horizontal suave mediante un modelo de frame
poco convencional: **todo el tick de juego se ejecuta en una interrupción de línea en la línea
de barrido 159**, no en el vblank. Sobre esa base implementan dos caminos de scroll fino
seleccionables en arranque: en MSX2 (V9938) el registro de ajuste **R#18 = −(fase+1)** con
compensación software de las X de 26 sprites; en MSX2+/turboR (V9958) el scroll horizontal por
hardware de SCREEN 4 (**R#27**, habilitado con R#25=2), que solo afecta al fondo y no requiere
ningún trabajo por sprite. El scroll grueso lo lleva la propia name table como ventana circular
de 32 columnas. Se documenta además la librería de acceso VRAM (sin una sola llamada BIOS de
VRAM en todo el ROM), el descompresor LZ, el replayer PSG con diff de registros y varias
técnicas menores reutilizables. Todas las afirmaciones de comportamiento están respaldadas por
medidas en el emulador (contadores de breakpoints, lecturas de registros VDP en runtime y
muestreo de variables del juego durante gameplay real).

**Palabras clave:** MSX2, MSX2+, V9938, V9958, SCREEN 4, scroll hardware, R#18, R#26/R#27,
interrupción de línea, H.TIMI, OTIR, Z80.

---

## 1. Introducción

*Chikubi Ninja* (Imanok, MSXdev25) declara en su manual: "MSX2 con 64 KB de RAM. En MSX2+ o
superior el juego usará scroll por hardware". Esa frase resume una disyuntiva clásica de la
plataforma: el V9938 de MSX2 no tiene scroll horizontal por hardware utilizable en modos de
tiles, mientras que el V9958 de MSX2+ añadió un offset horizontal específico para SCREEN 4
(registros R#26/R#27, habilitados desde R#25). El interés del caso es doble:

1. **Cómo resuelve MSX2** la fase sub-píxel (0–7 px) que el name table no puede expresar
   (granularidad de 8 px), y qué cuesta.
2. **Cómo se estructura un frame sin tearing** cuando el registro de desplazamiento solo puede
   escribirse una vez por frame y la línea en que se escribe importa.

El juego es además un buen espécimen de ingeniería "de diseño": sin motor licenciado, sin
llamadas BIOS de acceso a VRAM, con todo el I/O a mano.

### 1.1 Alcance y limitaciones

Se desensamblaron y verificaron por completo: el arranque, la detección de hardware, la
librería VDP/VRAM, el manejador de interrupciones, el sistema de scroll fino y la cámara de
auto-scroll. La lógica de juego principal reside en un segmento banca mapeado en 0x8000
(incluye la reescritura de columnas del scroll grueso); de esa parte se identificaron las
interfaces y llamadas, pero no se desensambló línea a línea. Se indica explícitamente qué
afirmaciones son estáticas, dinámicas o inferidas.

---

## 2. Metodología

**Análisis estático.** Desensamblado con `z80dis` (Python) sobre el ROM lineal; búsqueda de
patrones de código máquina (llamadas BIOS `CD nn 00`, escrituras a puertos `D3 98/99/9B`,
`ED A3/ED A2` (OUTI/INI), secuencias de escritura de registros VDP `3E val / ED 79 / 3E 0x80|reg`,
escrituras a registros de mapper). Verificación cruzada de direcciones con las variables del
juego en RAM (0xED80–0xEDC0, 0xCA00–0xCAB0).

**Análisis dinámico.** openMSX con scripts Tcl inyectados por `-script`, usando la interfaz
`debug` (breakpoints y watchpoints con auto-continue), los comandos de consola `vdpreg`/`peek`,
los *debuggables* `{Main RAM}`, `VRAM`, `MapperIO` y los probes `VDP.IRQ*`. Se ejecutó el juego
real en dos máquinas: `Panasonic_FS-A1WSX` (MSX2+, V9958, 64 KB) y `Philips_NMS_8250` (MSX2,
V9938, 128 KB VRAM), llegando a gameplay real mediante pulsaciones inyectadas por la matriz de
teclado (`keymatrixdown 8 n`: fila 8, bit 0 = SPACE, bit 7 = RIGHT). Un savestate en gameplay
(`chikubi_game.oms`) permitió repetir experimentos.

**Trazas obtenidas** (resumen; detalle en §7):

| Experimento | MSX2+ (FS-A1WSX) | MSX2 (NMS-8250) |
|---|---|---|
| Interrupciones/s durante juego | 60 (todas por ruta de línea) | 60 (todas por ruta de línea) |
| R#19 leído dentro del tick | 159 | 159 |
| Escrituras R#27 (BP 0x4C2B) | **6921** (~60/s) | 0 |
| Escrituras R#18 (valor leído en runtime) | R#18=0 permanente | **= −(0xED82+1)**, muestra a muestra |
| Bucle compensación sprites (BP 0x4940) | 0 | **920** (~1/frame) |
| Ruta "vertical" 0x4CAC | solo en cargas (397 frames) | solo en cargas (392 frames) |
| Rango de 0xED82 en gameplay | 0..7 (diente de sierra) | 0..7 (muestras 6→3→0→2→5→0→3) |
| Correlación R#27 vs 0xED82 | **exacta** (ED82=5→R#27=05; ED82=1→R#27=01) | n/a |

Nota de entorno: openMSX pausa la emulación al perder el foco de ventana
(`pause_on_lost_focus`); para automatización desatendida hay que desactivarlo. La inyección de
teclas con `keymatrixdown` puede bloquear el intérprete Tcl si la máquina objetivo está en un
estado que no avanza; es preferible guardar savestate en cuanto se alcanza el estado deseado y
experimentar desde él.

---

## 3. El ROM: estructura y mapa de memoria

- 64 KB, megaROM de 4 segmentos con cabecera estándar "AB" **en el offset 0x4000 del archivo**
  y vector de arranque 0x4010: el segmento de arranque es el segundo bloque de 16 KB del
  fichero. openMSX lo monta como mapper genérico de 4 registros; en ambas máquinas arranca y
  funciona.
- **No se encontró ninguna escritura a registros de mapper en todo el código**: el juego vive
  con el mapeo inicial. El código de sistema (librerías, handler) ocupa el segmento visible en
  0x4000–0x7FFF; datos gráficos y lógica de juego se alcanzan en la ventana 0x8000 (rutinas
  como 0x80FE, 0x8134).
- Arranque (0x4010): `DI / IM 1 / SP=0xF380`, instala `RET` en H.KEYI y H.TIMI, apaga el click
  de teclado (CLIKSW), resuelve slots del BIOS (maquinaria PPI 0xA8 + 0xFFFF en 0x4370–0x444F)
  y encadena inicialización.
- Variables del juego: RAM libre 0xED80–0xEDC0 y 0xCA00–0xCAB0; buffer gráfico 0xC000;
  sombra de la SAT en 0xCA20; puertos VDP cacheados en 0xCA04–0xCA07.

---

## 4. Modo de vídeo y layout de VRAM

Configuración (estática + registros leídos en runtime):

```asm
469D  LD   A,4
469F  CALL 0x005F          ; CHGMOD -> SCREEN 4 (T1: tiles 8x8, 16 colores)
46A2  LD   BC,0x9F03
46A5  CALL 0x0047          ; WRTVDP: R#3 = 0x9F  (base de la tabla de color)
46A8  LD   BC,4
46AB  CALL 0x0047          ; WRTVDP: R#4 = 0x00  -> pattern generator en VRAM 0x0000
```

| Registro | Valor en juego | Efecto |
|---|---|---|
| R#0 | 0x04; **0x14** en gameplay | bit 4 = IE1: interrupción de **línea** activa |
| R#1 | 0x62 en carga / sin bit 5 en juego | sprites **16×16**; vblank (IE0) solo en cargas |
| R#2 | 0x06 | name table fija en **0x1800** (32×24) |
| R#4 | 0x00 | patrones en **0x0000** |
| R#19 | **0x9F (159)** | línea de interrupción |

Layout de VRAM deducido del propio código de carga (bloques LZ escritos con SETWRT):

```
0x0000-0x17FF  pattern generator (tileset)      0x2000-0x37FF  tabla de color
0x1800-0x1AFF  name table (ventana de scroll)   0x1E00         sprite attribute table
0x3800+        patrones de sprite (R#6=0x07)
```

La carga de nivel descomprime LZ **directamente a VRAM**: patrones en bloques de 0x500 bytes
(0x0B00, 0x1300…), color en 0x2300/0x2B00 y la name table completa en 0x1800.

**Conclusión 1:** el "scroll perfecto" se construye sobre SCREEN 4, no sobre un modo bitmap.
El juego es un motor de tiles con ventana de 32 columnas; la mayor parte del esfuerzo de
optimización va a mover esa ventana y su fase sub-píxel.

---

## 5. Arquitectura del frame: la interrupción de la línea 159

Hallazgo central, verificado dinámicamente: durante el gameplay se producen **exactamente 60
interrupciones por segundo y todas se atienden por la ruta de línea** (R#19 = 159, leído
dentro del propio tick). El vblank apenas se usa: la ruta alternativa del handler (0x4CAC,
seleccionada por el bit 0 de S#1 tras `RRCA`) solo se ejecutó durante pantallas de carga
(392–397 frames en las sesiones medidas).

El handler se instala en H.TIMI (0x4B7F): `FD9A = C3, FD9B = 02 4C` y `R#19 = 159`.
La línea 159 es la última del área de juego (filas 0–19 = líneas 0–159); el HUD ocupa las
filas 20–23 (líneas 160–191).

### 5.1 Estructura del handler (0x4C02)

```asm
4C02  DI / PUSH AF
4C04  R#15 = 1              ; seleccionar S#1
4C0C  IN   A,(0x99)         ; leer S#1
4C0E  RRCA                  ; bit0 -> carry
4C0F  JP   C,0x4CAC         ; ruta "vertical" (cargas): reset de registros + preload SAT
                             ; ---- ruta de LINEA 159: el frame de juego ----
4C12  si (0xED8D):          ; efecto "aviso": R#23 = 0/4 alternando cada 4 frames
4C18      R#23 = (frames AND 4)          (shake vertical de la banda baja)
4C23  if (0xEDBB == 3)      ; V9958?
4C2B      R#27 = (0xED82)   ;     offset horizontal por HARDWARE (solo fondo)
4C34      R#25 = 2          ;     bit1 = MASK (enmascarar borde izquierdo)
4C3F  else
4C3F      R#18 = -(0xED82+1);     ajuste de pantalla -1..-8 px (mueve TODA la imagen)
4C4C  R#15 = 0; IN A,(0x99) ; S#0: lectura del joystick, gratis, cada frame
4C56  [guardia anti-reentrada 0xCAA1]
4C6F  CALL 0x4927           ; input + fase de sprites + subida SAT
4C72  CALL 0x50F1 [cond]    ; redibujado de HUD desde buffer RAM 0xC000
4C82  CALL 0x71DA           ; tiles animados (2 fotogramas cada 4 ticks)
4C89  CALL 0x46EB           ; PSG: subir solo registros cambiados
4C8C  CALL 0x4D5B           ; fade de paleta
4C8F  CALL 0x4DF5           ; lógica principal (banca 0x8000) + cámara
4C92  CALL 0x4902           ; R#7 = color de flash
4CAA  EI / RET
```

### 5.2 Por qué no hay tearing

Secuencia temporal por frame (N):

1. Línea 159 del frame N−1: se escribieron los registros de scroll con la fase calculada por
   el tick N−1.
2. Líneas 159–191 + vblank del frame N: **todo** el trabajo VRAM del tick N (name table, SAT)
   ocurre mientras el haz barre el HUD — una zona que ese frame ya pasó a pantalla y cuyo
   contenido para el frame N+1 puede reescribirse sin riesgo.
3. Línea 159 del frame N: el registro se reescribe (con el valor del tick N) en el mismo
   scanline que siempre.

El registro de desplazamiento cambia **una vez por frame, siempre en la misma línea y con el
mismo valor que ya está aplicado para las líneas 0–158** del frame siguiente: el área de juego
nunca ve una transición a mitad de barrido.

**Conclusión 2:** el patrón "tick en la línea de split, registros de efecto primero, lógica
después" es una alternativa completa al modelo vblank + replanteo en el vblank siguiente. El
coste es acotar el tick a ~5,5 ms (33 líneas + vblank); el beneficio, que ninguna escritura
VRAM puede producir artefactos y que el input se muestrea a mitad de frame (menos latencia
percibida que el modelo "vblank + lógica").

---

## 6. El sistema de scroll

### 6.1 Modelo de dos niveles

- **Grueso (8 px):** la name table 0x1800 es una **ventana circular de 32 columnas** sobre el
  nivel. Al cruzar cada frontera de tile, la lógica (segmento banca 0x8000) reescribe la
  columna que entra. Por eso el offset de hardware nunca necesita más de 8 bits: 256 px = 32
  columnas exactas, y el juego **no toca R#26** (verificado: R#26 = 0 en todo momento).
- **Fino (0–7 px):** la variable `0xED82` contiene la fase en píxeles. Rango medido en
  gameplay: 0..7 en diente de sierra al avanzar.

### 6.2 Camino MSX2+ (V9958): scroll por hardware de SCREEN 4

```asm
4C2B  LD   A,(0xED82) / OUT (0x99),A / LD A,0x9B / OUT (0x99),A   ; R#27 = fase
4C34  LD   A,2         / OUT (0x99),A / LD A,0x99 / OUT (0x99),A   ; R#25 = 2
```

Efecto (contrastado con el código fuente de openMSX): R#26/R#27 forman el offset horizontal
de SCREEN 4 y **solo desplazan el fondo** (el sprite checker no recibe notificación de estos
registros); el bit 1 de R#25 activa la máscara del borde izquierdo. Coste por frame: **4 bytes
al puerto 0x99**. Los sprites ya son escritos por la lógica en coordenada de pantalla; el
juego no los toca en este camino (0 ejecuciones del bucle de compensación medidas).

### 6.3 Camino MSX2 (V9938): R#18 + compensación software

```asm
4C3F  LD   A,(0xED82) / ADD A,1 / NEG          ; A = -(fase+1) = 0xFF..0xF8
4C46  OUT (0x99),A / LD A,0x92 / OUT (0x99),A  ; R#18 = ajuste horizontal -1..-8 px
```

R#18 es el registro de ajuste de presentación del V9938 y desplaza **toda** la salida de vídeo
(fondo, sprites y borde; confirmado en openMSX: `updateHorizontalAdjust` a nivel de renderer).
Como el fondo (tiles) solo puede moverse en múltiplos de 8 por name table, R#18 aporta
justamente la fase sub-píxel. Pero como arrastra también los sprites, el juego los compensa
cada frame (0x4927–0x495A, ~1/frame medido):

```asm
4948  LD   A,(0xED82) / ADD A,1 / NEG / LD C,A    ; C = -(fase+1), idéntico a R#18
4940  LD   HL,0xCA21 / LD DE,4 / LD B,26          ; sombra SAT, stride 4, 26 sprites
4950  LD   A,C / ADD A,(HL)                        ; X_sprite -= (fase+1)
4952  CP   0xF8 / JR C,.. / LD A,0xFF              ; clamp: medio-salido -> 255
4958  LD   (HL),A / ADD HL,DE / DJNZ 0x4950
495C  SETWRT 0x1E00 + subida de los 128 bytes con OUTI
```

Coste: ~26 iteraciones de 30 ciclos + 128 OUTI + SETWRT por frame, asumible a 3,58 MHz.

**Conclusión 3:** la "fórmula de fase" del juego es `registro = -(fase+1)` en MSX2 y
`registro = fase` en MSX2+. El `+1` existe porque el rango de ajuste negativo de R#18 es
−1..−8 (no existe "−0"); cuando la fase vale 0 queda aplicado un offset permanente de −1 px,
inocuo. La detección de hardware es elegante: en el arranque se lee S#1 (R#15=1) y se guarda
`0xEDBB = ((S#1>>1)&0x1F)+1`; en V9958 el ID de versión en los bits 3-0 de S#1 es 4
( ⇒ 0xEDBB=3, medido), en V9938 es 0 ( ⇒ 1). Un `CP 3` en cada interrupción elige camino.

### 6.4 Cámara

- **Auto-scroll por waypoints** (0x4E4A): tabla de punteros por nivel en 0x81CE, indexada por
  `0xEDAC` (waypoint) y `0xED81` (paso); el byte leído se publica en `0xED82` y de la
  diferencia con la fase anterior se deriva la dirección (`0xEDB6`).
- **Cámara del jugador:** reside en el segmento banca; actualiza la misma `0xED82` y las
  columnas de la name table.
- **Shake:** durante los "avisos" (`0xED8D≠0`), R#23 = 0/4 alternando cada 4 frames:
  sacudida vertical de 4 líneas de la banda inferior.

---

## 7. La librería de acceso VRAM (0x47D5–0x4900)

Hallazgo transversal: **cero llamadas a LDIRVM/LDIRMV/FILVRM/SETRD/SETWRT del BIOS en todo el
ROM** (búsqueda exhaustiva). Solo se usan CHGMOD, WRTVDP, DISSCR/ENASCR y RDSLT (slots). Los
puertos VDP se cachean en RAM al arrancar leyendo la variable del BIOS 0x0007 (=0x98):
`0xCA04=0x98 (datos), 0xCA05=0x99 (regs), 0xCA06=0x9A, 0xCA07=0x9B (paleta)`.

### 7.1 SETWRT de 10 bytes (0x47D8)

```asm
47D8  DI
47D9  LD   A,(0xCA05) / LD C,A     ; C = 0x99
47DD  OUT  (C),L                   ; A0-A7
47DF  SET  6,H                     ; flag de escritura
47E1  OUT  (C),H                   ; A8-A13 + flags
47E3  RET                          ; (0x47E4 = SETRD con RES 6,H)
```

### 7.2 Copia RAM→VRAM por OUTI, contador de 16 bits (0x483A)

`HL=origen, DE=destino, BC=longitud`; SETWRT + bucles OUTI anidados (resto módulo 256, luego
grupos de 256). Patrón OUTI en vez de OTIR: sin recarga de B y timings uniformes (~26 ciclos/
byte). Lectura espejo con INI en 0x480E. Acceso puntual: escritura de un tile con cálculo de
dirección `0x1800 + Y*32 + X` (0x47F0), escritura de strings de tiles terminadas en 0 (0x48EA),
lectura de un byte (0x48DD).

### 7.3 Paleta por OTIR al 0x9B (0x464C)

`R#16 = 0` (escrito con la pareja `valor, 0x90` por el 0x99) seguido de `OTIR` de 32 bytes al
puerto 0x9B: los 16 colores en una sola instrucción. Variante de un color (2 bytes) en 0x4663.
El fade de paleta (0x4D5B) interpola las componentes por pasos entre la paleta origen/destino
en RAM.

### 7.4 Sistemas de apoyo

- **Descompresor LZ propio** (0x4AF7–0x4B78): literales de 4 bits + gamma con flag de bit;
  descomprime a un buffer RAM (0xC000) y de ahí a VRAM. Todos los gráficos de nivel viajan
  comprimidos.
- **Replayer PSG con diff** (0x46EB + 0x4781/0x479E): doble sombra de 12 registros PSG
  (0xCA08 actual vs 0xCA14 anterior); solo se escriben los registros que cambian, por acceso
  directo 0xA0/0xA1. La música cuesta casi nada de CPU.
- **Anti-flicker de sprites:** la SAT vive en RAM (0xCA20) y se sube entera cada frame; en
  cargas se precarga solo el byte Y=0xD8 del sprite 0 (0x4CDE) para que el VDP nunca llegue a
  leer una SAT a medias.
- **Entrada sin BIOS:** teclado leído por PPI directo (fila por 0xAA, bits por 0xA9; 0x4793);
  joystick por los bits de S#0, leído de propina en cada interrupción.

---

## 8. Discusión: qué transferir a un motor propio (Mideas)

1. **Tick en la línea de split** (en vez de vblank) cuando el frame tiene una banda fija
   (HUD): da una ventana segura para todo el rediseño VRAM y elimina el tearing sin dobles
   buffers. Requiere acotar el tick (~5,5 ms en SCREEN 4/192 líneas).
2. **Fase sub-píxel por hardware según máquina**: en SCREEN 4, usar R#26/R#27 + R#25=2 si hay
   V9958 (identificable por el ID=4 en S#1) y R#18 −(fase+1) + compensación de sprites en
   V9938. La detección son ~15 ciclos en el arranque.
3. **Ventana circular de name table** en vez de name tables dobles: 768 bytes de VRAM, una
   columna reescrita por cruce de tile, y el offset hardware envuelve solo (256 px = 32 col).
4. **SETWRT inline de 10 bytes + OUTI con contador 16 bits**: la pareja básica de I/O a VRAM;
   elimina toda dependencia del BIOS en el camino caliente.
5. **Paleta por R#16 + OTIR** y **PSG con diff de registros**: dos micro-sistemas que liberan
   la mayor parte del presupuesto de ciclos del frame.
6. **Sprite 0 con Y=0xD8 precargado**: coste cero, elimina el flicker del sprite protagonista
   cuando la SAT se reescribe en caliente.

Limitaciones del enfoque del juego a tener en cuenta: el scroll es bidireccional pero la
name table-ventana obliga a reescribir una columna completa (24 tiles) por cruce de tile; y el
camino MSX2 paga el R#18 "arrastra sprites" con el bucle de compensación por frame.

---

## 9. Conclusiones

1. *Chikubi Ninja* demuestra que un scroll suave de calidad consola es posible en SCREEN 4
   con un modelo de frame basado en interrupción de línea y tres registros bien elegidos.
2. En MSX2+ el V9958 resuelve la fase sub-píxel por hardware (R#26/R#27, fondo únicamente);
   en MSX2 la misma fase se sintetiza con R#18 pagando ~800 ciclos/frame de compensación de
   sprites. El juego implementa ambos y elige en arranque leyendo el ID de versión en S#1.
3. La disciplina de I/O del juego — cero BIOS en el camino VRAM, puertos cacheados, OUTI en
   lugar de OTIR, sombras en RAM para SAT, paleta y PSG — es reproducible íntegramente y es
   probablemente más valiosa que el propio algoritmo de scroll.

---

## Apéndice A. Direcciones de referencia

| Dirección | Contenido |
|---|---|
| 0x4010 | Arranque del ROM |
| 0x4370–0x444F | Gestión de slots (PPI 0xA8, 0xFFFF) |
| 0x45E5–0x4677 | Detección de VDP (S#1 ID) + control sprites filas 0-7 |
| 0x4600 | Lectura de S#1/S#0 con retardo seguro |
| 0x464C / 0x4663 | Carga de paleta completa / un color (OTIR 0x9B) |
| 0x4693 | Init de vídeo: CHGMOD SCREEN 4, R#3=0x9F, R#4=0 |
| 0x47D5 / 0x47E4 | SETWRT / SETRD |
| 0x47F0 | Dirección name table (0x1800 + Y·32 + X) |
| 0x480E / 0x483A | Lectura / escritura VRAM por INI/OUTI (BC 16 bits) |
| 0x4867 | Cacheo de puertos VDP desde BIOS[0x0007] |
| 0x48CD / 0x48DD / 0x48EA | Tile individual / lectura byte / string de tiles |
| 0x4927–0x4986 | Compensación de sprites MSX2 + subida SAT |
| 0x4AF7–0x4B78 | Descompresor LZ |
| 0x4B7F / 0x4B99 | Instalación H.TIMI / activación IE1 |
| 0x4C02 | Handler H.TIMI (despacho) |
| 0x4C12–0x4CAB | Ruta línea 159: scroll regs + tick |
| 0x4CAC–0x4CE8 | Ruta vertical (cargas) |
| 0x4E4A–0x4E6E | Cámara auto-scroll por waypoints (tabla 0x81CE) |
| 0x50F1 | Redibujado HUD/name table desde buffer 0xC000 |
| 0x71DA | Tiles animados (patrones 0x06C0, colores 0x26C0) |

## Apéndice B. Variables del juego

| Variable | Significado |
|---|---|
| 0xED81 / 0xEDAC / 0xEDAD | paso / waypoint / longitud (cámara auto) |
| 0xED82 | **fase fina de scroll 0..7** |
| 0xEDB6 | dirección de scroll |
| 0xEDBB | VDP detectado: 3 = V9958, 1 = V9938 |
| 0xEDBC / 0xEDBD | estado de interrupciones / fade |
| 0xF3DF / 0xFFE7 / 0xFFE8 | sombras de R#0 / R#8 / R#9 |
| 0xCAA1 / 0xCAA7 / 0xCAA8 | guardia tick / skip tick / contador de frames |
| 0xCA04–0xCA07 | puertos VDP cacheados (0x98–0x9B) |
| 0xCA20 | sombra de la SAT (128 bytes) |
| 0xCA08 / 0xCA14 | sombra PSG actual / anterior (diff) |

## Apéndice C. Reproducibilidad

Scripts de sondas, desensamblador auxiliar, capturas y este análisis: `re/chikubi/`.
Savestate de gameplay reutilizable: `~/Documents/openMSX/savestates/chikubi_game.oms`.
Para automatización desatendida en openMSX conviene `pause_on_lost_focus=false` (restaurado
tras las pruebas) y evitar `keymatrixdown` sobre estados que no avanzan: preferir savestates.

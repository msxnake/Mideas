# Estudio: bitmaps MSX2 con más de 2 colores (técnicas, command engine, doble buffer)

Fecha: 2026-06-16
Ámbito: V9938 (MSX2) / V9958 (MSX2+). Estudio técnico, no cambia código.
Relacionado: `MSX2_GRAPHICS_BACKEND_PLAN.md`, `MSX2_SCREEN5_MINIMAL_SMOKE.md`,
`VAMPIRE_KILLER_SCREEN4_IDEAS_FOR_MIDEAS.md`.

---

## 0. La pregunta y la respuesta corta

> Nota de modo (importante): la traza confirma que **Vampire Killer corre en
> SCREEN 5** (GRAPHIC 4, `R0=0x06`, 128 B/4bpp, command engine activo), NO en
> SCREEN 4. El **command engine (composición por bloques) solo funciona en modos
> bitmap (SCREEN 5/6/7/8), nunca en GRAPHIC 3**.
>
> En Mideas hay **dos** rutas etiquetadas "SCREEN 4": `msx2-screen4-pattern` es
> GRAPHIC 3 real (tile, con clash, sin blitter) y `msx2-screen4-bitmap-room` es
> solo el *nombre* — en runtime hace `CHGMOD 5` (SCREEN 5 real) y compone un bitmap
> 4bpp con el command engine, es decir, la técnica de VK. Conclusión: el composer
> estilo VK SÍ existe en Mideas, vía `msx2-screen4-bitmap-room` (que es SCREEN 5
> bajo un nombre "SCREEN 4"); lo que no puede blittear es la ruta GRAPHIC 3
> `msx2-screen4-pattern`. Ver `MSX2_GRAPHICS_BACKEND_PLAN.md`.

"Más de 2 colores" en realidad significa **eliminar el color-clash** (la limitación de
2 colores por segmento horizontal de 8 px). Esa limitación NO viene del número de
colores del modo, viene de usar una **tabla de atributos** (SCREEN 2 en MSX1 y
SCREEN 4 en MSX2 la tienen). Para tener color libre por píxel hay que usar un
**modo bitmap real** (SCREEN 5/6/7/8), donde cada píxel guarda su propio índice de
color y no existe tabla de atributos → cero clash.

- ¿Se usan 2 buffers? **Sí, normalmente**: page flipping (≥2 páginas de VRAM) para
  redibujados de pantalla completa / scroll. Pero hay una alternativa más barata:
  **1 página visible + atlas offscreen + composición por dirty-rects** con el
  command engine (el modelo Vampire Killer, que corre en SCREEN 5).
- La clave práctica para que un bitmap multicolor sea jugable NO es la CPU pintando
  píxeles, es el **command engine (blitter) del V9938** + **sprites hardware** para
  los actores móviles + **compresión** para almacenar las imágenes.

---

## 1. Modos de pantalla MSX2 y dónde desaparece el clash

| BASIC | Modo VDP | Resolución | Colores | bits/px | Tabla atributos | VRAM/página | Páginas (128 KB) |
|-------|----------|-----------|---------|---------|-----------------|-------------|------------------|
| SCREEN 2 | GRAPHIC 2 | 256×192 | 16 fijos | tile | **Sí** (clash) | - | - |
| SCREEN 4 | GRAPHIC 3 | 256×192 | 16 (de 512) | tile | **Sí** (clash) | - | - |
| SCREEN 5 | GRAPHIC 4 | 256×212 | 16 (de 512) | 4 | **No** | 32 KB | 4 |
| SCREEN 6 | GRAPHIC 5 | 512×212 | 4 (de 512) | 2 | **No** | 32 KB | 4 |
| SCREEN 7 | GRAPHIC 6 | 512×212 | 16 (de 512) | 4 | **No** | 64 KB | 2 |
| SCREEN 8 | GRAPHIC 7 | 256×212 | 256 fijos (GRB332) | 8 | **No** | 64 KB | 2 |
| SCREEN 10/11/12 | (V9958) | 256×212 | 12499/19268 (YJK) | 8 | No | 64 KB | 2 |

Conclusión: para "bitmap con más de 2 colores sin clash" el candidato natural es
**SCREEN 5 (16 colores)**; **SCREEN 8 (256)** si quieres color directo sin paleta;
SCREEN 7 si necesitas 512 px de ancho con 16 colores.

SCREEN 4 NO resuelve el problema del clash: sigue siendo tile + tabla de color
(2 colores por fila de 8 px de cada carácter). Lo que aporta SCREEN 4 sobre SCREEN 2
es paleta de 512 y sprites modo 2; por eso Mideas lo usa como "bitmap compuesto"
barato, pero no es color libre por píxel.

---

## 2. Layout de VRAM (ejemplo SCREEN 5)

- 256 px/línea, 4 bits/px → **2 píxeles por byte**. Nibble alto = píxel izquierdo,
  nibble bajo = píxel derecho.
- Stride de línea = 128 bytes. 212 líneas visibles → 212 × 128 = **27 136 bytes**
  por página. La página ocupa 32 KB (las líneas 212..255 quedan como zona offscreen
  utilizable: 256×44 px libres por página).
- Dirección del píxel (x,y) en página p:
  `addr = p*0x8000 + y*128 + (x >> 1)`; nibble = `(x & 1) ? bajo : alto`.
- SCREEN 8: 1 px/byte (color directo GRB332), stride 256, 212×256 = 54 272 bytes.

El "espacio de coordenadas" del command engine ve la VRAM como X = 0..255 (SCREEN5)
y **Y = 0..1023**. Las 4 páginas de SCREEN 5 son simplemente bandas de Y:
página 0 → Y 0..255, página 1 → Y 256..511, etc. Esto hace trivial tener un
**atlas offscreen** (bloques, fuente, iconos) en Y≥212 o en una página entera no
visible, y copiar con coordenadas.

---

## 3. Cómo se escribe en un bitmap (tres rutas)

1. **BIOS / sub-ROM** (`WRTVRM`, `NWRVRM`, `SETPAGE`, `FILVRM`...): cómodo pero
   lento. Solo para carga estática o setup.
2. **Puertos directos** (streaming): para volcar un bitmap precomputado o
   descomprimido en RAM.
   - `0x99` = puerto de control/registros. `0x98` = puerto de datos VRAM
     (auto-incremento). `0x9A` = puerto de paleta. `0x9B` = registro indirecto.
   - Para escribir: setear R#14 (bits A14–A16 de la dirección VRAM, modo >16 KB),
     luego `out 0x99` con byte bajo de dirección, luego `out 0x99` con
     `(byte_alto & 0x3F) | 0x40` (bit 6 = escritura). Después, stream de bytes a
     `0x98` (cada byte = 2 píxeles en SCREEN5). El auto-incremento avanza solo.
3. **VDP Command Engine (el blitter)** — la técnica central. Solo funciona en los
   modos bitmap (5/6/7/8), no en 4. Es lo que hace usables los bitmaps multicolor
   en juegos: compones la pantalla a base de **copias hardware VRAM→VRAM** en vez
   de bucles de CPU.

---

## 4. VDP Command Engine en detalle

Registros (se escriben por puerto indirecto R#17→R#44.. o directos R#32..R#46):

| Reg | Uso |
|-----|-----|
| R#32/33 | SX (source X, low/high) |
| R#34/35 | SY (source Y) |
| R#36/37 | DX (dest X) |
| R#38/39 | DY (dest Y) |
| R#40/41 | NX (ancho) |
| R#42/43 | NY (alto) |
| R#44 | CLR (color/dato de relleno o byte para HMMC) |
| R#45 | ARG (dirección DIX/DIY, selección VRAM/exp MXS/MXD) |
| R#46 | CMR = (comando<<4) | operación lógica |

Comandos (nibble alto de R#46):

| Cmd | Código | Qué hace |
|-----|--------|----------|
| HMMC | 0xF0 | CPU→VRAM por bytes (volcar datos del host a un rectángulo) |
| YMMM | 0xE0 | VRAM→VRAM solo en Y (mover columna; típico de scroll) |
| HMMM | 0xD0 | VRAM→VRAM rectángulo, alineado a byte (**copia de bloques**) |
| HMMV | 0xC0 | Rellenar rectángulo con un byte (fill rápido) |
| LMMC | 0xB0 | CPU→VRAM por píxeles (con op. lógica) |
| LMCM | 0xA0 | VRAM→CPU por píxeles (leer) |
| LMMM | 0x90 | VRAM→VRAM por píxeles (copia con AND/OR/XOR/transparencia) |
| LMMV | 0x80 | Rellenar rectángulo por píxeles (con op.) |
| LINE | 0x70 | Línea Bresenham hardware |
| SRCH | 0x60 | Buscar color en una línea (útil para fill por contorno) |
| PSET/POINT | 0x50/0x40 | Pintar/leer un píxel |

Operación lógica (nibble bajo): IMP (copia), AND, OR, XOR, NOT, y variantes "T"
(TIMP/TAND...) que tratan el **color 0 como transparente** → clave para pegar
sprites/bloques con transparencia sin máscara.

Diferencia importante:
- Comandos **H** (HMMM/HMMV/HMMC) trabajan **por bytes** (2 px en SCREEN5): el más
  rápido, pero X y NX deben ir en unidades de byte (pares de píxeles).
- Comandos **L** (LMMM/LMMV/LMMC) trabajan **por píxeles** con operación lógica y
  transparencia: más lentos pero precisos al píxel y con blending.

Sincronización: antes de lanzar otro comando, esperar a que el bit **CE**
(Command Executing, S#2 bit 0) sea 0. Para HMMC/LMMC (alimentar datos desde CPU),
esperar el bit **TR** (Transfer Ready, S#2 bit 7) antes de cada byte. Leer status
extendidos requiere seleccionar S#2 vía R#15.

Patrón de uso típico (copiar un bloque 16×16 del atlas a la pantalla):
```
; espera CE=0
; SX,SY = coords del bloque en el atlas (p.ej. Y>=212 o página offscreen)
; DX,DY = destino en la página visible
; NX=16, NY=16
; R#45 ARG = 0 (DIX/DIY hacia +)
; R#46 = 0xD0  ; HMMM, op IMP
; (HMMM ignora transparencia; usar LMMM 0x90 + op T** si quieres color 0 transparente)
```

Coste orientativo: una copia HMMM no es gratis, pero es ~1 orden de magnitud más
rápida que pintar el mismo rectángulo con CPU. Aun así, **copiar la pantalla
completa cada frame es caro** → de ahí las estrategias de buffer de abajo.

---

## 5. Doble buffer / páginas ("¿se usan 2 buffers?")

Sí, y hay tres estrategias. Elegir según el tipo de juego:

### A) Page flipping (doble/triple buffer real)
- 128 KB de VRAM → SCREEN5/6: 4 páginas; SCREEN7/8: 2 páginas.
- Renderizas el frame siguiente en la página oculta y, en VBLANK, cambias la
  **página visible** mediante el registro de base de la tabla (R#2 en GRAPHIC 4/5).
  Coste de "flip" ≈ 0 (solo cambias un registro).
- Ventaja: nunca se ve tearing ni el proceso de dibujo. Ideal para scroll y para
  escenas que se redibujan enteras.
- Coste: 2× VRAM por buffer. En SCREEN 7/8 solo hay 2 páginas → te da exactamente
  un doble buffer, sin sitio para un atlas grande en otra página.
- NOTA de implementación: los valores exactos de R#2 por página deben tomarse del
  datasheet del V9938 o usar la rutina BIOS `SETPAGE`. **No hardcodear constantes
  de memoria** (ver lección de bytes invertidos en `WRTVDP` en LESSONS_LEARNED).

### B) Una página visible + atlas offscreen + dirty-rects (modelo Vampire Killer)
- Una sola página se muestra. El resto de VRAM (líneas 212..255 de cada página y/o
  páginas enteras no visibles) guarda un **atlas**: bloques de fondo 8×8/16×16,
  fuente, iconos, frames.
- Al entrar a una sala: limpiar página (HMMV) y **componer** el fondo con copias
  HMMM/LMMM desde el atlas. Durante el juego solo se redibujan las **zonas que
  cambian** (HUD, una puerta que se abre): copiar solo ese rectángulo.
- Ventaja: mucho menos VRAM y CPU cuando casi todo es estático. Es el patrón de
  Vampire Killer (sobre SCREEN 5). Los helpers que el plan de Mideas nombra
  (`msx2_vdp_copy_rect`, `msx2_vdp_fill_rect`, `msx2_draw_glyph_8x8`,
  `msx2_draw_icon_16x16`, `msx2_draw_energy_bar`) describen ESTE patrón y aplican
  al backend `msx2-screen4-bitmap-room`, que pese al nombre hace `CHGMOD 5` y por
  tanto corre en SCREEN 5 (donde el command engine sí funciona). En la ruta
  GRAPHIC 3 `msx2-screen4-pattern` el blitter no existe.
- Limitación: no protege de tearing si redibujas mucho en pantalla; por eso los
  actores móviles van como **sprites**, no como bitmap.

### C) Híbrido
- Page flip para el mundo que hace scroll + recomposición de overlays por frame.
- O "back buffer" en una página offscreen donde compones, y luego un único HMMM
  copia solo los dirty-rects a la visible.

### Regla práctica
- ¿Redibujas casi toda la pantalla cada frame (scroll, transiciones)? → **A) page flip**.
- ¿Fondo mayormente estático + HUD + actores? → **B) 1 página + atlas + dirty-rects + sprites**.
- Mideas, hoy, encaja en B.

---

## 6. Mover cosas sin repintar el bitmap: sprites hardware

El error caro es animar personajes repintando el bitmap. En MSX2 usa los **32
sprites hardware en modo 2**:
- 16 colores por sprite (un color por línea del sprite, line color table).
- Hasta 8 sprites por línea de scanline (5 en MSX1).
- Los actores (player, enemigos, balas, ítems) van como sprites superpuestos al
  bitmap; así el fondo no se toca al moverlos.
- Actores ricos: 16×32 = 2 sprites apilados; color extra = 2 planos superpuestos
  (Vampire Killer usa 4 sprites por frame del protagonista: 2 celdas verticales ×
  2 planos de color). Mideas ya tiene el MVP de sprite 16×16 y mirror.

---

## 7. Meter el arte multicolor en VRAM (pipeline)

1. Convertir la imagen a paleta indexada:
   - SCREEN 5/7: 16 entradas RGB333 (cada canal 0–7). Mideas ya cuantiza PNG→16
     colores MSX2 en el importador de tiles/sprites.
   - SCREEN 8: 256 colores fijos GRB332 (sin paleta libre).
2. Empaquetar: SCREEN5 = 2 px/byte (nibbles); SCREEN8 = 1 px/byte.
3. **Comprimir** (ZX0, ya usado en el proyecto): una pantalla SCREEN5 son 27 136
   bytes y NO cabe en un banco de 16 KB en crudo. Se descomprime a RAM y se vuelca
   a VRAM por `0x98`, o se descomprime directamente por bloques al atlas.
4. Paleta: poner el índice en R#16 y escribir pares de bytes al puerto `0x9A`:
   - 1er byte = `0RRR0BBB` (R en bits 6–4, B en bits 2–0)
   - 2º byte  = `00000GGG` (G en bits 2–0)
   - SCREEN6 usa solo 4 entradas; SCREEN8 ignora la paleta (color fijo).

---

## 8. Por qué Mideas eligió SCREEN 4 (y cuándo merece SCREEN 5)

- Actualizar un tilemap (SCREEN 4) cuesta **1 byte en la name table por celda 8×8**
  → baratísimo. Un bitmap exige copiar píxeles.
- El command engine ayuda, pero recomponer pantalla completa sigue costando
  decenas de miles de ciclos.
- Una pantalla SCREEN5 = 27 KB → presiona el presupuesto MegaROM (ver política de
  bancos). Por eso el bitmap SCREEN5 quedó archivado salvo experimentos.
- **Cuándo SÍ vale SCREEN 5**: pantallas de presentación/cinemáticas, fondos
  artísticos sin clash, o un juego cuyo fondo es mayormente estático y los actores
  son sprites. Con atlas + dirty-rects + ZX0 + sprites es perfectamente viable.

---

## 9. Receta mínima para un compositor bitmap SCREEN 5 en Mideas (si se retoma)

Reutilizar la forma de los helpers SCREEN 4 pero sobre páginas bitmap:
1. `CHGMOD`/init a SCREEN 5, cargar paleta (puerto 0x9A).
2. Descomprimir (ZX0) el atlas de bloques/fuente/iconos a VRAM offscreen
   (Y≥212 y/o página oculta).
3. `HMMV` para limpiar la página visible.
4. Componer la sala: lista de records `{sx,sy,dx,dy,nx,ny,cmd}` → bucle que lanza
   `HMMM` (opacos) o `LMMM` con op transparente (color 0) por bloque, esperando CE.
5. HUD: glifos 8×8 y iconos 16×16 por copia; barras de energía con `HMMV`/`LINE`;
   actualizar solo el rectángulo que cambia.
6. Actores: SAT de sprites hardware, actualizada por frame.
7. Bucle: `HALT` (VBLANK) marca el ritmo (60 Hz). Si hay scroll → page flip en R#2;
   si no → solo dirty-rects.

Helpers nominales a emitir (espejo de los de SCREEN 4):
`msx2_bmp_clear_page`, `msx2_bmp_copy_rect` (HMMM), `msx2_bmp_copy_rect_t` (LMMM
transparente), `msx2_bmp_fill_rect` (HMMV/LMMV), `msx2_bmp_line`,
`msx2_bmp_blit_from_ram` (HMMC/streaming), `msx2_bmp_flip_page` (R#2).

---

## 10. Puntos a verificar contra hardware/datasheet (no fabricar)

- Constantes exactas de R#2 por página en GRAPHIC 4/5 (usar `SETPAGE` o datasheet).
- Bits exactos de R#45 (ARG) y selección VRAM/expansión (MXS/MXD) para
  direccionamiento >64 KB.
- Orden de bytes en cualquier `ld bc,#nnnn` usado con `WRTVDP` (lección documentada:
  el byte alto va a B, el bajo a C; `#0012` ≠ `#1200`).
- Todo smoke OpenMSX de ROM generada MegaROM debe usar `-romtype konami`.

---

## Resumen ejecutivo

- "Más de 2 colores" = modo **bitmap real** (SCREEN 5 = 16, SCREEN 8 = 256), donde
  no hay tabla de atributos y por tanto no hay color-clash.
- La técnica que lo hace jugable: **VDP command engine** (HMMM/LMMM/HMMV/LINE) para
  componer por bloques, **no** CPU pintando píxeles.
- **Doble buffer: sí**, vía **page flipping** (≥2 páginas, flip en R#2 en VBLANK)
  cuando redibujas mucho; o la vía más barata **1 página + atlas offscreen +
  dirty-rects** (modelo Vampire Killer, sobre SCREEN 5; el command engine no
  existe en el GRAPHIC 3 que Mideas llama "SCREEN 4").
- Complementos imprescindibles: **sprites hardware** para actores, **ZX0** para
  almacenar los 27 KB/pantalla, y respetar el presupuesto MegaROM.

---

## Addendum (2026-06-16): composición por bloques repetidos — factibilidad MegaROM

Pregunta: "27 136 bytes es por pantalla plana, pero si componemos con rectángulos
repetidos debería caber en MegaROM, ¿no?". **Sí. Es justo el modelo correcto** y la
diferencia entre poder almacenar *una* pantalla o *un juego entero*.

### La clave: no se guarda el bitmap, se guarda atlas + mapa

Almacenamiento por pantalla = **atlas de bloques únicos** (compartido) + **mapa de
índices** (por pantalla). El bitmap plano solo "existe" en la página visible de VRAM,
compuesto en tiempo de carga por el command engine.

### Tamaños reales (SCREEN 5, 4 bpp)

- Bloque 8×8 = 8 líneas × 4 bytes = **32 bytes**.
- Bloque 16×16 = 16 líneas × 8 bytes = **128 bytes**.
- Pantalla 256×192 = 24 576 bytes planos. En celdas: 32×24 = **768** celdas de 8×8,
  o 16×12 = **192** celdas de 16×16.

Si TODAS las celdas fueran únicas: 768 × 32 = 24 576 (= el bitmap, no ahorras nada).
Pero un fondo reutiliza muchísimo. Ejemplos realistas:

| Enfoque | Atlas único | Mapa/pantalla | Coste 1ª pantalla | Coste pantallas extra |
|---------|-------------|---------------|-------------------|------------------------|
| 64 bloques 8×8 | 64×32 = 2 048 B | 768 B (1 byte/celda) | ~2.8 KB | +768 B (≈ +100 B con ZX0) |
| 256 bloques 8×8 | 8 192 B | 768 B | ~9 KB | +768 B |
| 128 metatiles 16×16 | 128×128 = 16 384 B | 192 B | ~16.5 KB | **+192 B** (≈ +60 B ZX0) |

El **atlas se comparte entre todas las pantallas de un mundo**, así que cada pantalla
adicional cuesta solo su mapa (cientos de bytes, y comprime muy bien con ZX0 por sus
repeticiones).

### Presupuesto de un juego completo (estimación)

- Atlas 16×16 compartido: 128 metatiles → 16 KB en crudo, ~8–10 KB con ZX0. Se sube
  a VRAM offscreen **una vez**.
- Mapas: 50 pantallas × ~100 B (ZX0) ≈ **5 KB**.
- Total gráfico de fondo ≈ **~15 KB** → entran sin problema en unos pocos bancos de 8 KB.

Comparación: 50 pantallas SCREEN 5 planas = 50 × 27 KB = **1.35 MB** (imposible). Esa
es la diferencia.

### Cómo se compone en runtime (no por frame, en la carga de sala)

1. Atlas (bloques/fuente/iconos) descomprimido a VRAM offscreen (líneas 212..255 de
   cada página y/o páginas no visibles) — una sola vez por mundo.
2. Al entrar a la sala: `HMMV` limpia la página visible.
3. Para cada celda del mapa: `índice → (sx,sy)` en el atlas → set de registros del
   command engine → `HMMM` (opaco) o `LMMM` con op transparente (color 0) a
   `(dx,dy)` en la página visible. Esperar CE entre comandos.
4. Esto es lo que vio la traza de Vampire Killer en OpenMSX: mayoría de copias 8×8,
   algunas 16×16, **sin** primitiva 32×32 (las estructuras grandes se expanden en
   repeticiones).

### Coste de carga (orientativo, una sola vez)

- 192 copias `HMMM` de 16×16, o 768 copias de 8×8. Cada copia incluye setup de
  registros + transferencia. El total es del orden de unos pocos frames de VBLANK
  (3.58 MHz, 59 736 ciclos/frame), perfectamente asumible en una transición de sala
  (con fundido o "loading"). **No es coste por frame**, solo al cargar la pantalla.
- Fondos animados (antorchas, agua): se recopian solo esos pocos bloques cada frame
  (dirty-rects), no toda la pantalla.

### Restricciones a respetar

- `HMMM` trabaja en **unidades de byte** (2 px en SCREEN 5): X y ancho deben ser
  pares. 8/16/32 px cumplen siempre; no uses anchos impares en px.
- Índice de 1 byte → máximo **256 bloques únicos** por mapa. Si necesitas más, usa
  índice de 2 bytes o conjuntos de bloques por sector.
- El atlas vive en VRAM offscreen: con 128 KB hay sitio de sobra (1 página visible
  + 1 opcional de doble buffer aún deja ~64 KB para atlas + fuente + sprites).

### Relación con la pregunta anterior (¿2 buffers?)

Con composición por bloques, la sala se compone en la página visible **al cargar**;
no hay redibujado completo por frame → **no necesitas doble buffer para salas
estáticas**. El page flip queda reservado para scroll. Es decir, "rectángulos
repetidos" reduce la necesidad de 2 buffers.

### Encaje con Mideas

Mideas ya analiza `blocks2x2`/`blocks4x4` al exportar y el plan de backend ya fija
que la primitiva de runtime sea copia 8×8/16×16. Un compositor SCREEN 5 reutilizaría
esa misma idea: exportar **{atlas de bloques + mapa de índices}** por mundo/pantalla
y, en runtime, los helpers `msx2_bmp_copy_rect`/`_t` recorren el mapa. La ganancia
sobre SCREEN 4: **16 colores libres por píxel, sin clash**, al precio de un paso de
composición por command engine en la carga de sala.

### Conclusión

Sí: con atlas de bloques + mapa de índices + ZX0, SCREEN 5 es **totalmente viable en
MegaROM** para un juego completo. El coste por pantalla baja de 27 KB a ~100–800 B, y
el atlas (único coste grande) se amortiza entre todas las pantallas.

---

## Addendum (2026-06-16): coste de componer la sala y "aparecer de golpe"

Pregunta: con un mapa de 192 bytes (192 metatiles 16×16), ¿cuánto cuesta crear la
pantalla nueva? ¿Y cómo hago que aparezca **de golpe** al cambiar de habitación?

### Matiz crítico: el mapa pesa 192 B, pero componer escribe ~toda la pantalla

192 bytes es lo que ocupa el **mapa** (almacenamiento). Pero al componer, el command
engine **escribe los píxeles de cada celda**: 192 × 128 B = **24 576 bytes** copiados
a VRAM ≈ todo el playfield. Es decir:

> La reutilización de bloques ahorra **almacenamiento (ROM/VRAM)**, NO ahorra **ancho
> de banda de dibujo**. Componer la sala cuesta ~lo mismo que pintar una pantalla
> entera, independientemente de cuántos bloques únicos haya.

### Cuánto tarde (orden de magnitud, a medir en OpenMSX)

Coste = (transferencia del command engine) + (overhead de setup por copia):

- **Transferencia**: ~24.5 KB VRAM→VRAM por `HMMM`. Con **display ON** el engine
  comparte el acceso a VRAM con el refresco de pantalla y va más lento; con
  **display OFF** va ~2× más rápido. Como referencia práctica, recomponer ~toda una
  página SCREEN 5 está en el orden de **~2–4 frames** (≈ 33–66 ms a 60 Hz) con
  display ON, aprox. la mitad con display OFF.
- **Setup**: 192 copias, cada una pone ~7 pares de registros (SX,SY,DX,DY,NX,NY,CMR)
  por el puerto indirecto + esperar `CE=0`. Son ~unos cientos de ciclos Z80 por copia
  → del orden de **~1 frame** de CPU en total. Con bloques 8×8 serían 768 setups
  (4× más overhead) → por eso 16×16 compone más rápido aunque mueva los mismos bytes.

Estimación combinada: **~3–5 frames** (~50–80 ms) en MSX2 estándar con display ON.
**Importante**: el command engine corre **autónomo**, también durante el display
activo; NO tienes que meter las copias dentro del VBLANK. Solo lanzas comandos y
po=lleas `CE` (S#2 bit 0). Lo único que conviene hacer en VBLANK es el **flip**.

Medición exacta recomendada (estilo charter, OpenMSX debug): contar `HALT`/frames
desde que arrancas la composición hasta que `CE=0`, o leer el contador de frames del
VDP. Así obtienes el coste real de tu atlas/mapa concretos en vez de estimar.

### Cómo lograr que aparezca "de golpe" (sin ver cómo se dibuja)

El problema de componer en la página **visible** es que el jugador vería los bloques
apareciendo durante esos 3–5 frames. Soluciones (de mejor a más simple):

1. **Page flip (recomendado, sin parpadeo).** Tienes ≥2 páginas (SCREEN5 = 4).
   - La sala actual se muestra en la página A.
   - Compones la sala nueva en la página **B (oculta)** a lo largo de esos 3–5 frames;
     el jugador sigue viendo A, sin artefactos.
   - En un **VBLANK**, cambias la página visible a B con **un único write a R#2**.
     El cambio es **atómico e instantáneo** → la sala nueva aparece de golpe.
   - Coste del flip ≈ 0 (un registro). El siguiente cambio compone en A y vuelve a
     flipar. Esto es exactamente "cambiar de habitación de golpe".

2. **Display OFF durante la composición (más simple, con fogonazo).**
   - Apagas el display (bit blank en R#1), recompones la página visible (~2× más
     rápido sin refresco), vuelves a encender. Se ve un breve **negro** (1–4 frames),
     no el dibujado parcial. Muchos juegos lo disfrazan con un fundido a negro en el
     cambio de sala.

3. **Híbrido con fundido**: fundir a negro la página actual, componer, fundir desde
   negro. Oculta tanto el dibujado como cualquier diferencia de timing.

Para "cambio de habitación instantáneo" tipo metroidvania, la vía 1 (page flip) es la
canónica: nunca se ve construir la pantalla.

### Coste VRAM del page flip

- SCREEN 5: 4 páginas de 32 KB → te sobra para 2 páginas jugables (A/B) **y** atlas +
  fuente + sprites en el espacio offscreen restante.
- SCREEN 7/8: solo 2 páginas → A/B ocupan ambas; el atlas debe caber en el offscreen
  (líneas ≥212) de esas mismas páginas. Más justo.

### Palancas para reducir el tiempo de composición

- **16×16 en vez de 8×8**: misma transferencia, 4× menos setups.
- **Display OFF** mientras compones la página oculta: ~2× más rápido (si no haces
  page flip, igualmente acelera).
- **Columnas/filas repetidas con `YMMM`/tiras altas**: copiar tiras de varias celdas
  de una sola pasada reduce setups (avanzado).
- **Solo dirty-rects** cuando el cambio es parcial (puerta, panel) en vez de
  recomponer la sala entera.
- **Pre-componer la sala contigua** en la página oculta *mientras se juega* la actual
  (si sabes hacia dónde va el player), repartiendo el coste en muchos frames → flip
  con coste percibido cero.

### Conclusión

- Componer 192 metatiles 16×16 cuesta ~recomponer una pantalla completa
  (~24.5 KB, ~3–5 frames display ON) — la reutilización ahorra ROM/VRAM, no dibujo.
- No hace falta meterlo en el VBLANK: el command engine es autónomo.
- Para que aparezca **de golpe**: **compón en la página oculta y haz page flip en
  VBLANK (un write a R#2)**. Es instantáneo y sin parpadeo. La alternativa simple es
  componer con display OFF (breve negro).

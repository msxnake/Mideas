# Presupuesto de VRAM, bancos ROM y escalabilidad del backend SCREEN 5 bitmap

**Estudio técnico. No modifica código.**
Fecha: 2026-08-17 · Rama `fixing-bugs` · Backend `msx2-screen4-bitmap-room` (inicializa SCREEN 5)
· Mapper Konami SCC 2 MB.

Convenciones:

- **1 fila de VRAM = 128 bytes** (SCREEN 5: 256 px a 4 bpp). **VRAM = 1024 filas = 128 KB.**
- **1 celda de tile 16×16 a 4 bpp = 8 bytes/fila × 16 filas = 128 bytes.**
- **[V]** = verificado en código o ejecutando el packer real sobre un proyecto real.
  **[E]** = estimación mía, con el método a la vista.
- Proyecto de referencia: `test/msx2-boss/fixture_stampbody.json` (13 salas, 115 tiles únicos,
  1 boss, 1 diálogo con 3 retratos). Las cifras "reales" salen de replicar
  `buildSharedWorldAtlasRooms` sobre el JSON, no de estimar. **[V]**

---

## 0. Resumen ejecutivo (dos minutos)

**Cinco cifras.**

| | Hoy | Con la arquitectura propuesta |
|---|---|---|
| Atlas que paga cada sala | **26,0 KB** (unión de todo el proyecto) | **4,0 KB** (lo que la sala usa) |
| Bosses que caben | **1** (2 revientan) | **~248**, limitado por ROM, no por VRAM |
| Mundos que caben | **1** (2 revientan) | limitado por ROM |
| Retratos de diálogo que caben | **3** | **~744**, limitado por ROM |
| Coste VRAM de añadir contenido | **O(N), permanente** | **O(1)** |

**Seis hallazgos.**

1. **La tesis de Jordi es correcta en lo esencial.** Hay un único atlas global con la unión de
   los tiles de todos los mundos y los frames de todos los bosses — **incluidos bosses que no
   están colocados en ninguna sala** (`msx2Screen5BitmapRoomGenerator.ts:1761-1765`). La sala
   que más tiles usa necesita **32 filas (4,0 KB)**; el atlas ocupa **208 filas (26,0 KB)**.
   Factor **13×**.

2. **Pero se equivoca en el dominio (B).** El player y sus disparos **no están en el atlas**:
   son sprites hardware en `#F400/#F600/#F800` (21 filas = 2,6 KB, página 1). Ya están
   separados. Y su arte **ya vive en bancos fríos** y está **correctamente** gestionado
   (`:3357-3396`). No hay nada que arreglar ahí.

3. **El inquilino que nadie contaba cuesta más que el boss:** el blob de glifos y retratos,
   **160 filas = 20,0 KB**, de las cuales **11,25 KB son relleno desperdiciado** porque cada
   retrato se lleva una banda de filas entera para él solo (`:10663-10669`).

4. **CORRECCIÓN IMPORTANTE — el boss debe ser un metatile, no un blob.** Hoy el motor lo trata
   como un rectángulo opaco monolítico: `bitmap_boss_draw` lo pinta *"with one opaque HMMM"*
   (`msx2BitmapBossGenerator.ts:2345-2351`). Sin embargo **el asset ya está autorado por celdas
   de 16×16** (`stamp.tiles[]`) y `bitmapStampToPixelGrid` las **aplana y tira la estructura**
   (`utils/msx2Screen5BitmapTileLibrary.ts:115-136`). Recuperarla da **3–7× menos VRAM** y,
   sobre todo, **~4,8× menos blitter** en la animación: un boss de **96×96 o 128×96 pasa de estar
   condenado a 30 fps a ir a 60 fps** siempre que sea un boss que anima sin desplazarse. Es el
   hallazgo con más consecuencias del estudio.
   Ese ahorro sale de **omitir las celdas que no cambian**, no de trocear: partir un rectángulo
   nunca reduce el área a copiar (§5.4, corregido el 2026-08-18). Repintar el cuerpo entero por
   celdas cuesta ~12 % más, no un múltiplo, así que **un boss móvil también puede permitírselo**.

5. **La victoria más barata no cuesta una línea de código.** La oscuridad es un flag **por
   sala** (`msx2BitmapLightingGenerator.ts:359-361`). Declarar la sala de boss como iluminada
   devuelve al boss **15 índices de paleta pintables en vez de 7**. La queja de Jordi ("un boss
   a oscuras es muy pobre") **es estructural, no estética**, y desaparece por construcción.

6. **La segunda victoria, de riesgo bajo y muchos KB:** el gemelo oscuro se construye sobre el
   atlas **entero** con un solo HMMM (`:4184-4188`), frames de boss incluidos, y en el proyecto
   real **ni siquiera cabe** (necesita la fila 928, el diálogo empieza en la 864 → aviso
   silencioso y caída a 292 ms/17,5 frames por entrada a sala oscura, `:14721-14731`). Que el
   gemelo cubra sólo lo que las salas oscuras pintan ahorra **8–13 KB** y **lo hace caber otra
   vez**: 292 ms → ~25 ms, **12,5×**.

**`GAME_MODE_BOSS` está sólo diseñado**, no implementado: 0 apariciones en `utils/`, sólo en
`docs/msx/BOSS_SYSTEM_DESIGN.md:244-246`. **[V]**

---

## 1. Dos presupuestos que no son el mismo

Ésta es la confusión que más caro puede salir, así que va antes que nada.

| | **VRAM** | **Ventana residente** | **Bancos ROM fríos** |
|---|---|---|---|
| Tamaño | **128 KB fijos** (1024 filas) | **32 KB fijos** (`#4000-#BFFF`, bancos 0–3) | **~1,94 MB** (248 bancos usables de 8 KB) |
| ¿Crece? | **Nunca** | **Nunca** | Prácticamente ilimitado a esta escala |
| Se libera… | **no subiendo** cosas, o subiéndolas bajo demanda | sacando datos y tablas a bancos fríos | no hace falta |
| Evidencia | `:294-295` | nota `screen5-resident-window-budget`: `test234.json` llegó a **24 bytes libres de 32.768** | `:328` (primer banco de datos = 4), `:2787-2792` (256 bancos, los `(n&0x3F)==0x3F` reservados por la ventana SCC) |

Cuenta de bancos fríos **[V]**: bancos 4..255 = 252, menos {63, 127, 191, 255} reservados por
la ventana SCC = **248 bancos × 8.192 = 2.031.616 bytes = 1.984 KB**.

> **Regla que hay que tener grabada: bancar algo NO libera VRAM.**
> Lo que hace es *habilitar* la carga bajo demanda, que es lo que sí la libera.

**El ejemplo que lo demuestra, y que invalida una de las propuestas.** Los retratos de diálogo
**ya están en bancos fríos hoy**: `buildBankedRleDataBlocks(dialogueRleChunks, ...)`
(`:15039`). Y aun así **ocupan 20,0 KB de VRAM permanentemente**, porque se suben una vez en
boot y no se desalojan nunca (`upload_bitmap_dialogue_gfx`, *"once at boot after the atlas"*,
`:10791-10792`). **"Poner los personajes de diálogo en un banco de 8K" no ahorraría ni una
fila: ya están en un banco.** Lo que ahorra es no subirlos hasta que hagan falta.

---

## 2. Mapa VRAM fila a fila, hoy

### 2.1 Estructura fija, independiente del proyecto **[V]**

Constantes en `msx2Screen5BitmapRoomGenerator.ts:286-296`.

| Filas | Bytes | KB | Inquilino | Evidencia |
|---|---|---|---|---|
| 0–211 | 27.136 | 26,5 | **Página 0**: banda visible (HUD 20 + juego 192, R#9 LN=1) | `:286-289` |
| 212–227 | 2.048 | 2,0 | Slot offscreen HUD enlazado #1 | `:14735` |
| 228–243 | 2.048 | 2,0 | Slot offscreen HUD enlazado #2 | `:14735` |
| *(224–239)* | *2.048* | *2,0* | *Excluyente:* corazones clásicos, VRAM `#7000` | `:332-333` |
| **244–255** | **1.536** | **1,5** | **LIBRE** | por exclusión sobre `:14693-14700` |
| 256–467 | 27.136 | 26,5 | **Página 1**: la otra mitad del doble búfer | `:14694` |
| 468–483 | 2.048 | 2,0 | Slot offscreen HUD enlazado #3 | `:14735` |
| **484–487** | **512** | **0,5** | **LIBRE** | `:14697-14699` |
| 488–491 | 512 | 0,5 | Color de sprites `#F400–#F5FF` | `:3059` |
| 492 | 128 | 0,1 | SAT `#F600–#F67F` | `:3058`, `:14488` |
| **493–495** | **384** | **0,4** | **LIBRE** (`#F680–#F7FF`) | aritmética sobre lo anterior |
| 496–511 | 2.048 | 2,0 | Patrones de sprite `#F800–#FFFF` (64 grupos × 32 B) | `:14514`, `:15174` |
| 512–1023 | 65.536 | 64,0 | **Región de atlas** (páginas 2 y 3 enteras) | `:294-295` |

**No existe "la página 3 libre".** Las páginas 2 y 3 *son* la ventana de direccionamiento del
atlas (`ATLAS_BASE_Y=512` + `ATLAS_MAX_HEIGHT=512` = filas 512..1023) y el blob de diálogo ya
vive ahí. **Desperdicio estructural real: 12+4+3 = 19 filas = 2,4 KB.** Los huecos entre páginas
no son donde está el dinero.

**La página 1 no es "la sala limpia"** sino la otra mitad de un **doble búfer** (R#2 `#1F`/`#3F`,
`:2509`, `:16554-16558`); la oculta hace además de fuente de restore. Que eso no baste es
justamente por qué los proyectiles del boss necesitan scratch propio: *"Restoring from page 1
is NOT enough: the boss body, the chain barrier and other overlays only exist on the visible
page"* (`:15282-15286`).

### 2.2 La región de atlas con un proyecto real **[V]**

| Filas | Bytes | KB | Inquilino |
|---|---|---|---|
| 512–719 | 26.624 | 26,0 | Atlas compartido (115 tiles, `atlasRows16 = 208`) |
| 720–863 | 18.432 | 18,0 | Libre: gemelo oscuro / slots HUD extra / scratch carryables / scratch proyectil |
| 864–1023 | 20.480 | 20,0 | Blob de diálogo (8 filas de glifos + 144 de retratos → 152 → 160 alineadas) |

`dialogueVramBaseRow = 1024 − ⌈152/16⌉·16 = 864` (`:14709`).

**El gemelo oscuro no cabe:** `darkAtlasBaseY = 720`; condición `720 + 208 ≤ 864` →
**928 ≤ 864 es falso** (`:14722-14725`). Este proyecto no tiene salas oscuras hoy, pero el día
que alguien encienda una lámpara **pagará 292 ms (17,5 frames) por entrada de sala** y sólo se
enterará por un `console.warn` (`:14726-14731`).

---

## 3. Los cuatro inquilinos y el coste de la mezcla

### 3.1 (A) Tiles del mundo — sobreaprovisionamiento 13× **[V]**

Tiles distintos que cada sala realmente referencia en su `tileGrid` de 192 bytes
(`grid[y][x]` es índice 1-based en `entries`, `:2557-2562`):

| Sala | Tiles distintos | Filas | KB |
|---|---|---|---|
| pan1 | 21 | 32 | 4,0 |
| pan3 | 18 | 32 | 4,0 |
| pan4 | 15 | 16 | 2,0 |
| **pan2 (sala del boss)** | **12** | **16** | **2,0** |
| pant7 | 2 | 16 | 2,0 |
| **UNIÓN GLOBAL** | **115** | **208** | **26,0** |

Cada sala paga **26,0 KB** para usar como mucho **4,0 KB**.

### 3.2 (B) Player y disparos — la tesis se equivoca aquí **[V]**

Son sprites hardware, no bitmap. Ocupan **21 filas = 2,6 KB** en la página 1, fuera de la
región de atlas: patrones `#F800–#FFFF` (16 filas), color `#F400–#F5FF` (4), SAT `#F600–#F67F`
(1). Separarlos del atlas no libera nada porque ya están separados.

El recurso escaso ahí es otro: **64 grupos de patrón de sprite**, repartidos entre player,
foreground, enemigos, plataformas, carryables, debris, torretas, ascensores, suelo desmoronable,
balas de boss y disparo del player — diez guardas distintas lanzan error al pasarse (`:15174`,
`:15307`, `:15357`, `:15373`, `:15390`, `:15406`, `:15437`, `:15460`, `:15492`, `:15505`).
Presupuesto real, pero **ortogonal** a éste.

### 3.3 (C) Frames de boss — y el bug de los bosses huérfanos **[V]**

Los cuerpos y explosiones son assets `msx2bitmapstamp` inyectados en el atlas compartido
(`:14617-14621`); el boss los referencia con `sy = 512 + atlasY`
(`msx2BitmapBossGenerator.ts:851`).

**`collectBossBitmapStamps` recorre TODOS los assets `msx2boss` sin comprobar si el boss está
colocado en alguna sala** (`:1761-1765`):

```ts
for (const asset of ((analysis as any)?.assets || []) as any[]) {
  if (String(asset?.type || '').toLowerCase() !== 'msx2boss') continue;
  addParams(asset?.data?.params || asset?.data?.boss?.params || asset?.data || {});  // ← incondicional
}
```

**Una definición de boss que quedó en la biblioteca y no se usa ocupa VRAM residente para
siempre.** Con la biblioteca global de entidades, esto escala mal solo.

Coste por boss con los topes reales (`msx2BitmapBossGenerator.ts:759-764`: `frames` 1..4, frame
16..128 × 16..96) **en el modelo monolítico de hoy**:

| Concepto | Peor caso | Filas | KB |
|---|---|---|---|
| Tira del cuerpo | 256×96 (4 frames de 64, o 2 de 128) | 96 | 12,0 |
| Death FX | 8 stamps de 64×64 (`:1354`, `:1381`) | 128 | 16,0 |
| Puntos débiles | **0** — son rectángulos en tabla | 0 | 0 |
| Explosión de punto débil | **0** — reusa el 1.er Death FX (`:868-870`) | 0 | 0 |
| **Peor caso** | | **≤224** | **≤28,0** |
| **Típico** (64×64×2 frames + 3 frames de muerte 32×32) | | **96** | **12,0** |

**Con gemelo oscuro todo esto se duplica.** El §5 corrige estas cifras a la baja con el modelo
metatile.

### 3.4 (D) Glifos y retratos — 11,25 KB de relleno **[V]**

Empaquetado (`:10657-10670`):

```ts
for (const strip of strips)        { strip.blobRow = blobRow;    blobRow += Math.ceil(strip.chars.length/32)*8; }
for (const portrait of portraits)  { portrait.blobRow = blobRow; blobRow += portrait.height; }
```

- **Glifos:** 32 glifos por fila de 256 px, 8 px de alto → `⌈chars/32⌉·8` filas por *estilo*.
  Proyecto real: 30 caracteres → **8 filas = 1,0 KB**. Barato.
- **Retratos:** `blobRow += portrait.height` → **cada retrato se lleva una banda de filas
  completa para él solo**, aunque sólo use `width·2` píxeles de los 256 (`:10686-10691`).
  Normalizados a múltiplo de 8, máximo 48×48 (`:10523-10524`), tope `width·2 ≤ 256` (`:10664`).

Proyecto real: 3 retratos de 48×48 → **144 filas = 18.432 B**, usados `144 × 48 = 6.912 B`.

> **Desperdicio verificado: 144 × 80 = 11.520 bytes = 11,25 KB, el 62,5 % del área de retratos.**

**El margen real de la guarda `:14711`.** Sólo comprueba que el blob no pise el atlas
(`dialogueVramBaseRow < 512 + atlasRows16` → error). Con `atlasRows16=208` el blob podría llegar
a la fila 720, o sea **304 filas = 38 KB de retratos** antes del error. Pero **el gemelo oscuro
se rinde mucho antes y en silencio**: aquí, en cuanto el blob supera **144 filas**, es decir
**con 3 retratos de 48×48 ya está perdido**. El error grita cuando ya es tarde.

**Arreglo obvio:** empaquetar retratos en estantes como hace el atlas. Tres de 48×48 ocupan
96 px cada uno → **2 por banda** → 48+48 = **96 filas en vez de 144**, ahorro **6,0 KB**.

---

## 4. Diagnóstico de la tesis, sin cortesías

| Afirmación | Veredicto | Evidencia |
|---|---|---|
| "Los tiles del atlas y los del boss se colocan todos juntos" | **CIERTO** | `:14610`, `:14617-14621` |
| "…en mundo 1" | **Impreciso, y a peor**: es la unión de **todos** los mundos más **todos** los stamps de boss del proyecto, colocados o no | `:14618`, `:1761-1765` |
| (A) los tiles varían por mundo y sólo uno está activo | **CIERTO**, y hoy no se aprovecha | `:14640-14645` |
| (B) player y disparos residentes y comunes | **CIERTO pero ya resuelto**: son sprites hardware y su arte ya está en bancos fríos | `:3058-3059`, `:3357-3396` |
| (C) un banco de 8 KB por boss | **Correcto, y con el modelo metatile hasta sobra**; ver §9 | `:2787-2792` |
| "Se liberaría mucha VRAM" | **CIERTO**: 26,0 → 4,0 KB por sala | §3.1 |

**Lo que la tesis no ve, y juega a favor:** la fontanería de re-subida por transición **ya
existe**. Cada nodo WorldLink llama a `upload_tileset_atlas` + `prepare_dark_atlas` durante la
transición, fuera del bucle de juego (`:16498-16502`). Hoy re-sube el *mismo* atlas global —
no ahorra un byte, sólo garantiza estado determinista — pero **el atlas por mundo es menos
trabajo del que parece.**

---

## 5. El boss es un METATILE — corrección de la aritmética

Esta sección **invalida y sustituye** el modelo de "frames completos" que se usó en las
secciones anteriores.

### 5.1 Cómo está hoy, y por qué el arreglo es más pequeño de lo que parece **[V]**

| Capa | Modelo actual | Evidencia |
|---|---|---|
| **Autoría** | **Ya es por celdas.** El asset `msx2bitmapstamp` guarda `columns`, `rows`, `tileWidth`, `tileHeight` y **`tiles[]`**, una rejilla de `BitmapTileScreen5` de 16×16 editables por separado | claves del asset verificadas en el fixture; editor `Msx2BitmapStampEditor.tsx` |
| **Frontera generador** | **Aquí se pierde.** `bitmapStampToPixelGrid` aplana `tiles[]` en un único `number[][]` y descarta la estructura de celdas | `utils/msx2Screen5BitmapTileLibrary.ts:115-136` |
| **Packer** | Coloca ese blob como **una sola entrada** de atlas de 64×64 | `msx2Screen5BitmapRoomGenerator.ts:1893-1930` |
| **Runtime** | `bitmap_boss_draw` pinta *"with **one opaque HMMM**"* | `msx2BitmapBossGenerator.ts:2345-2351` |
| **Composición de salas** | **Ya trabaja por celdas 16×16**: `buildRoomRenderBlocks` emite un `OP_COPY_16` por celda | `msx2Screen5BitmapRoomGenerator.ts:2557-2574` |

> **Un boss-metatile es literalmente "un conjunto de entradas de atlas + una tabla de
> composición", que es exactamente la forma de un programa de render de sala.** El motor ya
> sabe reproducir eso (`replay_room_commands`). El cambio encaja mucho mejor con lo que existe
> que el blob monolítico actual.

**Tamaño del refactor [E]:**
- **Datos: pequeño.** No aplanar `tiles[]`; emitir cada celda como item del packer. Un puñado
  de líneas en `bitmapStampToPixelGrid` / `collectBossBitmapStamps`.
- **Runtime: mediano.** `bitmap_boss_draw` pasa de un HMMM a un bucle sobre una tabla de
  composición; el `boss_cmd_buf` de 15 bytes se reutiliza por celda. La restauración de bordes
  (`bitmap_boss_restore_strips`, `:2271-2278`) no cambia.
- **Tablas: pequeño.** La tabla del boss guarda hoy `sx, sy, width, height, frames`
  (`:906-922`); pasaría a guardar un puntero a la tabla de celdas.

### 5.2 Aritmética base **[V]**

- 1 celda 16×16 a 4 bpp = **8 bytes/fila × 16 filas = 128 bytes**. ✔ Coincide con la primitiva
  del motor (`TILE_GRID_SIZE = 16`, `OP_COPY_16`).
- **16 celdas caben en un estante de 16 filas** (16 × 16 px = 256 px de ancho) = **2.048 bytes,
  cero desperdicio**.
- Boss 64×64 = 4×4 = **16 celdas = 2.048 bytes = 1 estante**.
- Boss 96×96 = 6×6 = **36 celdas**. Boss 128×96 = 8×6 = **48 celdas**.

**Efecto colateral que se me había escapado:** un stamp monolítico alto **rompe el
empaquetado**. El packer es un shelf packer: al colocar un item de 64 px de alto, `shelfHeight`
sube a 64, y **los tiles de 16×16 colocados después en ese estante dejan 48 filas muertas
debajo** (`:1893-1920`). Con todo el arte en celdas de 16×16 **todos los estantes empaquetan
perfectos**. El modelo metatile no sólo almacena menos: **elimina el desperdicio de estante**.

### 5.3 Ahorro de VRAM por animación parcial

Fórmula: `celdas_totales = base + k·(frames − 1)`, `bytes = celdas × 128`,
`filas = ⌈celdas/16⌉ × 16`.

**Ejemplo pedido: boss 64×64, 8 frames, k = 3 celdas cambian por frame.**

| Modelo | Cuenta | Bytes | Filas de atlas |
|---|---|---|---|
| Frames completos | 8 × 2.048 | **16.384** | 128 |
| Metatile + variantes | (16 + 3×7) × 128 = 37 × 128 | **4.736** | 48 (⌈37/16⌉·16) |
| **Factor** | | **3,46×** | **2,67×** |

**Tabla general, 8 frames de animación:**

| Boss | Celdas base | Monolítico (B) | k=1 | k=2 | k=4 | k=8 |
|---|---|---|---|---|---|---|
| **64×64** | 16 | 16.384 | 2.944 (**5,6×**) | 3.840 (**4,3×**) | 5.632 (**2,9×**) | 9.216 (**1,8×**) |
| **96×96** | 36 | 36.864 | 5.504 (**6,7×**) | 6.400 (**5,8×**) | 8.192 (**4,5×**) | 11.776 (**3,1×**) |
| **128×96** | 48 | 49.152 | 7.040 (**7,0×**) | 7.936 (**6,2×**) | 9.728 (**5,1×**) | 13.312 (**3,7×**) |

Nota: las cifras "monolítico" de 96×96 y 128×96 con 8 frames **no son realizables hoy** —
la tira excedería los 256 px de ancho y el packer lanza excepción (`:1868-1870`,
`:1899-1901`), y `frames` está topado a 4 (`msx2BitmapBossGenerator.ts:759`). **El modelo
metatile no tiene ese tope**: las celdas se colocan donde quepan.

### 5.4 El hallazgo grande: el blitter

> **CORREGIDO (2026-08-18).** La primera redacción de esta sección daba el coste fijo por
> rectángulo como **0,22 ms** citando `lmmv_bench.txt` y marcándolo **[V]**. Las dos cosas
> estaban mal: el banco **no mide HMMM pequeños** (sólo 256×64), y su propia fila más pequeña
> lo desmiente — un `LMMV OR 2x8` **entero** tarda 0,104 ms, así que el fijo no puede ser 0,22.
> Las cifras de abajo son las buenas. Conclusión que sobrevive: el ahorro sale de **no repintar
> lo que no cambia**. Conclusión que se cae: que partir en celdas fuese caro de por sí.

**La regla que no depende de ninguna constante:** partir un rectángulo en N **nunca reduce el
tiempo de copia** — el área es la misma. Sólo añade coste por comando. Por tanto el modelo
metatile **no acelera un redibujado completo**; acelera **omitir celdas**.

**Coste fijo por comando, despejado de dos puntos medidos [E sobre la derivación, V sobre los
puntos]:** con `coste = fijo + tasa × px` y las filas `LMMV OR 256x64` (16.384 px → 97,244 ms)
y `LMMV OR 2x8` (16 px → 0,104 ms): tasa = 5,935 µs/px, **fijo ≈ 9 µs**. Unas 25 veces menos
que la cifra que traía este documento.

A eso hay que sumarle el lado CPU, que **no se solapa**: `bitmap_boss_launch_cmd` espera unidad
libre y hace `otir` de 15 bytes ≈ 315 T ≈ **88 µs por comando** a 3,58 MHz. Con muchos
rectángulos **este término pesa más que el fijo del VDP**.

| Trabajo | Bytes | Blitter | CPU | **Total** |
|---|---|---|---|---|
| Cuerpo 64×64 entero (1 cmd) | 2.048 | 11,93 ms | 0,09 | **12,02 ms** |
| **Las mismas 16 celdas, todas** | 2.048 | 12,07 ms | 1,41 | **13,48 ms** (**+12 %**) |
| **3 celdas** | 384 | 2,25 ms | 0,26 | **2,51 ms** |
| **1 celda 16×16** | 128 | 0,754 ms | 0,09 | **0,84 ms** |

3 celdas contra el cuerpo entero de 64×64: **12,02 / 2,51 = 4,8× menos trabajo** — el 4,2×
original sobrevive, y algo mejorado, pero por el motivo correcto.

**Punto de equilibrio [E]:** por celdas gana mientras `k × 0,842 ms < coste_cuerpo_entero`.

| Boss | Celdas totales | Umbral | Regla |
|---|---|---|---|
| 64×64 | 16 | **14,3 celdas** | por celdas si cambian ≤14 de 16 |
| 96×96 | 36 | **32,1 celdas** | por celdas si cambian ≤32 de 36 |
| 128×96 | 48 | **42,7 celdas** | por celdas si cambian ≤42 de 48 |

**Consecuencia práctica, distinta de la que decía este documento:** repintar el cuerpo entero
por celdas cuesta sólo **~12 % más**, no un múltiplo. El camino monolítico deja de ser
imprescindible como fallback de rendimiento y pasa a ser una optimización menor; lo que decide
sigue siendo cuántas celdas cambian.

### 5.5 Los dos presupuestos de boss, que hay que separar

**Caso 1 — boss que ANIMA sin desplazarse.** Sólo hay que repintar las celdas que cambian.
Presupuesto a 60 fps: el estudio de viabilidad da **12,14 ms como coste probado seguro**
(64×64 a 60 fps, 0 overruns/300 frames, `BOSS_SCREEN5_FEASIBILITY.md:29`). Con celdas eso son
**≈14 celdas por frame de animación** (12,02 ms / 0,842 ms por celda, §5.4 corregido).

| Boss | Celdas base | Celdas/frame a 60 fps | Veredicto |
|---|---|---|---|
| 64×64 | 16 | ≤14 | **60 fps** (ya lo estaba) |
| 96×96 | 36 | ≤14 de 36 | **60 fps — hoy condenado a 30 fps** |
| 128×96 | 48 | ≤14 de 48 | **60 fps — hoy condenado a ~20-30 fps** |
| 160×128 (10×8=80) | 80 | ≤14 de 80 | **60 fps — hoy imposible** (tira > 256 px) |

> **Un boss grande que anima una boca, dos ojos y un tentáculo cuesta lo mismo que un boss
> pequeño. El tamaño del boss deja de importar para el frame rate y sólo importa cuánto
> CAMBIA.** Esto invalida la conclusión del estudio de viabilidad de que 96×96 obliga a 30 fps:
> era cierta **sólo para el redibujado completo**.

**Caso 2 — boss que se MUEVE.** Al desplazarse 2 px cada píxel cambia de sitio: **hay que
repintar el cuerpo entero**. El ahorro de blitter no llega a existir, pero —con el coste fijo
ya corregido en §5.4— **tampoco hay penalización seria: el cuerpo entero por celdas cuesta
~12 % más** (13,48 ms frente a 12,02 en un 64×64). El ahorro de VRAM se mantiene íntegro.

> **Esto cambia la recomendación.** Con el 0,22 ms erróneo, un boss móvil por celdas parecía
> ~1,4× más lento y había que excluirlo. Con el coste real, **un boss móvil también puede ir
> por celdas** y cobrar el 3–7× de VRAM a cambio de un 12 % de blitter. Deja de ser un o-lo-uno-
> o-lo-otro y pasa a ser un ajuste por boss. Sigue siendo cierto que el camino monolítico es
> el más rápido para redibujado completo, y conviene conservarlo para bosses móviles grandes
> donde ese 12 % cruce el presupuesto de frame.

Atenuante ya presente: `bossInterval` por defecto = 3, o sea el cuerpo se redibuja
20 veces por segundo, no 60 (`msx2BitmapBossGenerator.ts:783-786`). Y la restauración de fondo
**ya es parcial** — sólo las tiras de borde que el cuerpo destapa
(`bitmap_boss_restore_strips`, `:2271-2278`).

> **Recomendación de producto: el editor debe distinguir "boss animado estático" de "boss
> móvil".** Tienen presupuestos radicalmente distintos y el autor debe saberlo antes de dibujar,
> no después de medir. Un híbrido natural: mover a intervalos largos y animar por celdas entre
> movimiento y movimiento.

### 5.6 Deduplicación de celdas **[V] + [E]**

**El packer ya deduplica por huella de píxeles**, a nivel de entrada:
`atlasEntryFingerprint` + `placedByFingerprint` (`:1856-1861`, `:1897-1899`). Hoy no sirve de
nada para el boss porque el boss es **una entrada de 64×64**; sólo colapsaría contra otro
stamp de 64×64 idéntico.

**En cuanto el boss se descompone en celdas de 16×16, la deduplicación llega gratis y sin
tocar el packer**: celdas de relleno plano, fondo repetido y zonas idénticas entre frames
colapsan solas, **y además colapsan contra los tiles de la sala** si coinciden.

Ahorro típico **[E]**: en un cuerpo de boss con silueta orgánica sobre fondo transparente,
entre **20 % y 35 %** de las celdas base suelen ser fondo puro o relleno repetido. Estimación
conservadora: **~25 %**.

**Puerta que hay que cerrar:** la deduplicación por **espejo horizontal no es posible**. La
huella compara píxeles crudos, y sobre todo **HMMM no sabe voltear**: el V9938 no tiene flip
en las copias. Un boss simétrico no puede compartir celdas entre sus dos mitades. (Los sprites
hardware sí se voltean, pero el boss no es un sprite.)

---

## 6. La paleta

### 6.1 En sala oscura el arte tiene 7 colores, no 15 — CONFIRMADO **[V]**

Esquema de **paleta emparejada 8×2**: índices 0–7 iluminados, 8–15 el gemelo atenuado.
Atenuar = `LMMV` OR (`#82`, CLR `#08`, pone el bit 3); iluminar = `LMMV` AND (`#81`, CLR `#07`)
(`msx2BitmapLightingGenerator.ts:17-21`). El gemelo del atlas se fabrica poniendo el bit 3
(`msx2Screen5BitmapRoomGenerator.ts:4189-4192`).

```
16 índices
 − 8   (8..15: gemelos forzados por el bit 3; el arte de fondo NO puede usarlos)
 − 1   (índice 0: transparente, muestra palette[R#7]; es el backdrop)
 ──────
 = 7 índices pintables
```

> **La queja de Jordi no es estética, es estructural: en una sala oscura el boss compite por
> 7 índices, no por 15.** Y los comparte con el fondo de la arena, el player, la bala, el HUD
> y el retrato.

El "SLOT 8 RESERVE" libera el índice 8, pero **sólo para la banda de HUD**: dentro de la banda
de juego el `AND #7` del halo lo convertiría en 0.

### 6.2 Inventario de índices reservados **[V]**

| Consumidor | Índices | Evidencia |
|---|---|---|
| Backdrop / transparente | **0** (R#7) | `:4001-4004` |
| Gemelos dim (sólo sala oscura) | **8–15** | `msx2BitmapLightingGenerator.ts:17-21` |
| Corazones HUD clásicos | **9** lleno, **14** vacío, **1** fondo | `:344-346` |
| Player | los de su sprite, por línea (`bitmap_room_sprite_colors`) | `:3323-3347` |
| Bala del disparo | los de `bitmap_bullet_color_data` | `msx2BitmapShootGenerator.ts:264` |
| Enemigos | `bitmap_enemy_sprite_colors` | `:15307` |
| Retrato de diálogo | los que el artista pintó | `:10686-10691` |
| Fondo de sala | `room.backgroundColor` | `:2517` |

**Anomalía a señalar:** los corazones usan **9 y 14**, que en paleta emparejada son los
gemelos atenuados de 1 y 6. En un mundo oscuro el HUD se pinta con los colores apagados. No es
un bug funcional (la banda de HUD nunca se atenúa) pero **es una restricción no documentada
sobre qué pueden significar los índices 1 y 6 en un proyecto con luz**.

**Caso peor** (sala de boss + iluminación + diálogo + disparo): de 16 índices, **9 están
hipotecados** (0 + los ocho gemelos). **Quedan 7 para seis consumidores.** Jordi tiene razón.

### 6.3 La excepción ya es expresable, y es gratis — CONFIRMADO **[V]**

> `msx2BitmapLightingGenerator.ts:359-361`
> ```ts
> export function isBitmapLightingRoom(room: any): boolean {
>   return String(room?.runtime?.lighting || 'off').toLowerCase() === 'lamp';
> }
> ```

**La oscuridad es un flag POR SALA**, no por mundo ni por proyecto. Y el generador ya lo trata
por sala donde decide de qué atlas lee cada sala:

> `msx2Screen5BitmapRoomGenerator.ts:14834`
> ```ts
> const dimShift = darkAtlasEnabled && isBitmapLightingRoom(roomData) ? atlasRows16 : 0;
> ```

Una sala iluminada dentro de un mundo oscuro **ya funciona y está verificada con fixture mixto**
(nota `msx2-halo-lighting-palette`).

**Coste cero, hoy:** poner `runtime.lighting = 'off'` en la sala de boss devuelve **15 índices
pintables en vez de 7**. Sin tocar el generador, sin riesgo de ROM, sin line-IRQ.

### 6.4 El segundo coste que se cae con la excepción **[V] + [E]**

El gemelo se construye con **un solo HMMM del rectángulo entero** — `NX=256`,
`NY=atlasRows16`, sin excepciones (`:4184-4188`). Los frames del boss se atenúan igual que la
hierba. Si ninguna sala de boss se pinta a oscuras, ese gemelo es VRAM tirada.

| Bosses (típicos, 96 filas c/u, modelo monolítico) | Filas de gemelo recuperadas | KB |
|---|---|---|
| 1 | 96 | **12,0** |
| 3 | 288 | **36,0** |

En el proyecto medido el cuerpo del boss son **64 filas** → el gemelo malgasta **8,0 KB**. **[V]**

**Y hay más:** el gemelo tampoco necesita cubrir los tiles que sólo pintan salas **iluminadas**.
Si la mitad de los tiles son de salas claras, el gemelo baja de 208 a ~104 filas → **13,0 KB**
y, decisivo, **vuelve a caber** (720 + 104 = 824 ≤ 864). Entrada a sala oscura:
**292 ms → ~25 ms, 12,5×**.

**Cómo:** no hace falta un segundo atlas. Basta **ordenar los items** del packer — primero los
tiles que alguna sala oscura usa, luego el resto, y al final los stamps de boss — y que el
gemelo copie sólo el **prefijo** `darkRows`, con el mismo único HMMM. Condicionado a
`anyDarkRoom` para preservar la ROM byte-idéntica.

### 6.5 Opciones de paleta por boss

| Opción | Coste | Veredicto |
|---|---|---|
| **(a) Reprogramar los 16 registros al entrar/salir** | **~3.648 T = 1,02 ms = 0,06 frames** **[E]** (16 × 228 T del bucle `:4022-4041`, incluido `vdp_write_register` `:3793-3803`, a 3,58 MHz) | **Viable.** El coste es ruido; el problema es el flash (§6.6) |
| **(b) Subrango de 4 índices "swatch de boss"** | 0 | **Innecesaria** con la sala iluminada: con 15 índices no hay que racionar |
| **(c) Paleta por SALA** | el mismo 1,02 ms | **PREFERIBLE a (a)**: más general, mismo coste, y `bitmap_world_palette_ptr_table` (`:14667-14669`) ya es exactamente esta forma indexada por mundo. Bajar el índice a sala es un cambio local |
| **(d) Romper el emparejamiento 8×2 sólo en salas de boss** | 0 | **Ya está roto por sala, y a propósito.** No es invariante global: `dimShift` es por sala (`:14834`). No hay nada que romper |
| **(e) Cambio de paleta por línea (R#19)** | IRQ + timing estricto | **DESCARTADA** |

**Por qué se descarta (e), explícitamente.** El motor **no usa la interrupción de línea**:
`grep` de `R#19`/`IE1` sobre `utils/msxGenerator/generators/msx2/` no devuelve nada (sólo R#23
de scroll en el generador de SCREEN 4). **[V]** Está libre, pero: (1) con la sala de boss
iluminada el boss ya tiene 15 índices, más de los que un boss usa con criterio; (2) el bucle
principal se sincroniza por `HALT`/vblank y una line-IRQ reparte el temporizado entre dos
vectores justo en el frame donde el blitter está más cargado; (3) el único caso que la
justificaría —dar colores propios al HUD— ya está resuelto más barato por el SLOT 8 RESERVE.
**Puerta cerrada.**

### 6.6 El flash, y cómo evitarlo **[E]**

Escribir R#16 **remapea instantáneamente todo lo que ya hay en pantalla, en las dos páginas**.
No es un problema de orden respecto a la composición: la página *visible* cambia de color en
ese instante.

1. **Nunca cambiar la paleta con la banda de juego visible y estable.** Hacerlo dentro de un
   wipe/fade (el GameFlow walker ya los tiene por HMMV) o con la pantalla apagada (R#1 BL)
   durante el ~1 ms.
2. **Mejor: apagar pantalla y sprites durante toda la carga transitoria.** Gratis en percepción
   (está bajo el wipe) y además el blitter acelera: **−23 %** pantalla apagada y **−29 %**
   sprites apagados (HMMM 5,82 → 4,51 µs/byte), ambos medidos. Es el truco clásico de "cargar
   durante el borrado" y aquí los números del propio proyecto lo respaldan.
3. **El camino de vuelta es el que se olvida.** Al morir el boss **o al morir el player** hay
   que restaurar la paleta emparejada del mundo. Si sólo se engancha en "boss derrotado", morir
   en la arena devuelve al mundo oscuro con la paleta luminosa y todo se ve mal hasta la
   siguiente transición. **Los dos caminos tienen que compartir la misma rutina de salida.**

### 6.7 Coherencia artística

Un mundo oscuro con la guarida del boss iluminada es un recurso narrativo clásico, no una
incongruencia: la transición de sombra a luz **subraya** la entrada al combate.

---

## 7. El régimen de combate contra boss

`GAME_MODE_BOSS` existe en `docs/msx/BOSS_SYSTEM_DESIGN.md:244-246` como **diseño**; no está
implementado (0 apariciones en `utils/`; el propio doc lo llama *"PARCIAL — via pause-gate de
diàleg"* en `:353`). **[V]**

### 7.1 Inventario de lo prescindible durante un combate

| Recurso | ¿Hace falta en la arena? | Filas hoy (proyecto real) | KB |
|---|---|---|---|
| Tiles de las otras 12 salas | **No** | 208 − 16 = **192** | **24,0** |
| Gemelo oscuro | **No** (arena iluminada, §6.3) | 0 hoy / **208 si cupiera** | 0 / 26,0 |
| Retratos de diálogo | **No**: el diálogo de intro ya terminó (`INTRO_OP_DIALOGUE` es un paso del Room Lock, `msx2BitmapBossGenerator.ts:263`, `:467`) | **144** | **18,0** |
| Glifos de fuente | Sólo si el boss habla en combate | 8 | 1,0 |
| Enemigos normales | **No** — el motor ya lo asume: las balas de boss exigen sala sin enemigos | grupos de sprite | — |
| Plataformas, gemas, puertas, ascensores | **No** en una arena | grupos de sprite + tiles | — |
| Tiles de la arena | **Sí** | 16 | 2,0 |
| Cuerpo del boss (metatile, §5) | **Sí** | 16–48 | 2,0–6,0 |
| Death FX | **Sí** | 16–32 | 2,0–4,0 |
| Scratch de proyectil | **Sí** | 16 | 2,0 |

### 7.2 La cifra

**Comprometido durante un combate en la región de atlas (512 filas), con modelo metatile:**

```
arena (12 celdas)             16 filas
cuerpo del boss + variantes   48 filas   (96×96 con 8 frames y k=2: 50 celdas → 48 filas)
death FX                      32 filas
scratch de proyectil          16 filas
gemelo oscuro                  0 filas   (arena iluminada)
blob de diálogo                0 filas   (reutilizable, §7.3)
                           ──────────
total                        112 filas = 14,0 KB
```

> **Durante un combate quedan libres 400 de las 1024 filas de la región de atlas (50,0 KB),
> frente a las 144 filas (18,0 KB) que quedan hoy — y esas 144 no dan ni para el gemelo
> oscuro.** Sumando los huecos estructurales (19 filas) y los slots de HUD que una arena no
> usa, el techo práctico ronda **420 filas ≈ 52 KB libres en pleno combate.** **[E]**

**Aviso honesto:** con el modelo metatile, **la VRAM deja de ser el límite del tamaño del boss
por un margen enorme**. Los límites pasan a ser el blitter (§5.4-5.5) y los topes del
generador, que habrá que subir: `frames` 1..4 (`msx2BitmapBossGenerator.ts:759`) y frame
≤128×96 (`:760-764`) están puestos porque el atlas es residente, compartido y monolítico.
Ninguna de las tres razones sobrevive a este refactor.

### 7.3 Retrato y boss: solapamiento temporal **[V] mecanismo, [E] propuesta**

La secuencia de Room Lock es un bytecode por sala con opcodes
`CLOSE_BARRIER`/`DIALOGUE`/`WAIT` (`msx2BitmapBossGenerator.ts:261-264`) más un paso 0 de
auto-walk. El diálogo (estado 3) **reutiliza el runtime `msx2dialogue` normal**.

```
entrada → auto-walk → [DIALOGUE: retratos vivos] → CLOSE_BARRIER → combate: retratos muertos
```

**Sí se pueden compartir filas**, y el punto de conmutación **ya existe en el bytecode**. Hoy
no se aprovecha porque el blob es **residente** (`:10791-10792`).

- **¿Sobrevive el retrato a un cambio de sala?** Hoy sí, porque nunca se descarga. Con carga
  bajo demanda no sobreviviría y habría que re-subirlo. Para NPCs de exploración es mal
  negocio; **para el retrato de intro de boss es excelente**, porque la carga cae dentro de una
  secuencia que ya congela al jugador.
- **¿Quién repinta al cerrar el diálogo?** `bitmap_dlg_close_box` **[V]** (`:11454-11503`):
  reproduce el programa de render de la sala **en la página mostrada**, los mismos bloques que
  `load_room`. **El fondo bajo la caja se restaura desde el atlas, no desde la página 1.**
  Consecuencia: **si el retrato compartiera filas con el boss, cerrar el diálogo no dañaría
  nada** — el repintado no lee esas filas — pero **los frames del boss deben cargarse DESPUÉS
  del `close_box`**, o el typewriter dibujaría glifos con píxeles de boss.

### 7.4 Precio del cambio de régimen **[E] sobre los µs/byte [V]**

Throughput de subida ROM→VRAM: el bucle RLE emite a **25 T/byte** (`out (#98)` 11 + `dec d` 4 +
`jp nz` 10, `:3915-3922`) → **6,98 µs/byte** a 3,58 MHz.

**Entrada (mundo → arena), modelo metatile:**

| Trabajo | Bytes | ms | frames |
|---|---|---|---|
| Arena (16 celdas) | 2.048 | 14,3 | 0,9 |
| Cuerpo + variantes (50 celdas) | 6.400 | 44,7 | 2,7 |
| Death FX (16 celdas) | 2.048 | 14,3 | 0,9 |
| Paleta | 32 | 1,0 | 0,1 |
| **Total** | **10.528** | **≈74** | **≈4,5** |

**Salida (arena → mundo) SI se hubiera descargado el atlas del mundo:**

| Trabajo | ms | frames |
|---|---|---|
| Re-subir atlas del mundo (26.624 B) | 185,8 | 11,2 |
| Reconstruir gemelo: HMMM (26.624 B × 5,82) | 155,0 | 9,3 |
| Reconstruir gemelo: LMMV OR (53.248 px × 5,94) | 316,3 | 19,0 |
| Re-subir blob de diálogo (20.480 B) | 143,0 | 8,6 |
| Restaurar paleta | 1,0 | 0,1 |
| **Total peor caso** | **≈801** | **≈48 (0,8 s)** |

**¿Se esconde?**

- **La entrada, sí, sin inventar nada.** 4,5 frames caben de sobra en el auto-walk obligatorio
  del Room Lock (`msx2BitmapBossGenerator.ts:1548-1551`), donde el jugador ya está congelado.
  Y el motor **ya sabe trocear trabajo VDP por frames**:
  `BITMAP_ROOM_COMPOSITION_BLOCKS_PER_FRAME = 24` (`:327`), usado por `step_room_composition`.
- **La salida, NO** detrás de una transición normal: 0,8 s es perceptible. Necesita
  presentación deliberada (la secuencia de explosiones del boss, que ya dura varios frames, o
  un fade del GameFlow) **y tickear la música durante ella**, o el sonido se corta — es
  exactamente el fallo ya diagnosticado en `commit_room_flip` (nota
  `msx2-bitmap-transition-blocking`).

**Y la decisión de diseño que hace innecesario casi todo lo anterior:**

> **No descargues el atlas del mundo.** Mantenlo residente y coloca el boss en una **ventana
> transitoria** detrás de él. Entonces la entrada cuesta ~74 ms (escondibles) y **la salida no
> cuesta nada**: no hay que restaurar lo que nunca se tocó, sólo la paleta (1,0 ms). El camino
> de vuelta — el que produce el flash y el parpadeo — desaparece por construcción.

En el proyecto real esa ventana **existe hoy**: 144 filas libres, y un boss metatile necesita
**112**. Cabe sin refactorizar el atlas del mundo.

### 7.5 Otros límites y trucos

- **8 sprites por línea** (V9938, sprite mode 2). En una arena esto **juega a favor**: el boss
  es bitmap, no gasta sprites, y sus balas también se blitean (`bitmap_boss_proj_draw` usa
  `#98` = LMMM+TIMP para transparencia). El presupuesto de 8/línea queda casi entero para
  player + disparo. Es un argumento fuerte a favor de bosses bitmap.
- **Cambio de banco:** los bancos de datos se mapean en P2 (`#8000-#9FFF`); **el código que
  selecciona y el que lee tienen que vivir por debajo de `#8000`** o se auto-desmapea a media
  rutina (notas `screen5-resident-window-budget` y `msx2-pool-index-banked-read`, con un bug
  real cada una). El cargador transitorio **debe** llamar a
  `bitmap_room_restore_resident_banks` al salir (`:3787`).
- **Comprimir mejor no acelera.** El cuello es el bucle de `OUT`, **por byte emitido**, no por
  byte leído. Un LZ ahorraría ROM — y sobran 1,94 MB — a cambio de **más** ciclos por byte
  emitido. **La compresión al vuelo queda descartada por aritmética.**
- **OUTI** (16 T/byte = 4,47 µs) sería 1,56× más rápido que el bucle RLE, **pero está por debajo
  del margen del V9938 con display activo (~29 T)**. El bucle actual, a 25 T, ya va justo.
  **Un cargador con OUTI exige pantalla apagada** — que es lo que conviene hacer igualmente
  (§6.6.2).

---

## 8. Reparto de bancos ROM

Lo que sigue evalúa la propuesta de Jordi (player en banco fijo de 8K · boss en 1-2 bancos ·
diálogo en 8K/16K) con la separación de presupuestos del §1 delante.

### 8.1 Player + disparos: **la propuesta ya está hecha, y no debe cambiarse** **[V]**

El arte del player **ya vive en bancos fríos** y **ya está correctamente gestionado**:

> `msx2Screen5BitmapRoomGenerator.ts:3357-3396` — `bitmap_upload_player_frame_colors`
> ```asm
>     ld a, (player_anim_frame)
>     ld c, a
>     ld a, (player_colors_loaded)
>     cp c
>     ret z                      ; ← camino rápido: NO paga banco si el frame no cambió
>     ...
>     ld a, c
>     call bitmap_room_select_data_bank_a
>     call fast_copy_to_vram_ext
>     jp bitmap_room_restore_resident_banks
> ```
> con el comentario explícito: *"Only the frame-change path pays this; the 'cp c / ret z' fast
> path above is untouched. This routine lives below `#8000`, so it may map the bank in its own
> body."*

Esto es **exactamente el arreglo** del bug histórico de MegaROM (sprites del player en basura
sólo en MegaROM porque la subida de color por frame leía un banco frío sin mapearlo — nota
`msx2-screen4-megarom-sprite-colors`). **En el backend bitmap ya está resuelto y la lección
está incorporada en el código.**

**¿Bancarlos obliga a un cambio de banco por frame?** **No.** Sólo en el frame en que cambia la
animación, y el cambio cuesta un `ld (#9000),a` (`mapper_set_bank_p2`, `:3606-3608`) más el
`call`/`ret`: **~100 T ≈ 28 µs** **[E]**, es decir **0,17 % de un frame**, y sólo cada
`animDelay` frames.

**¿Debería el player ser lo único residente, por estar siempre vivo?** **No, y la distinción
importa:** lo que está siempre vivo es el **código** del player y su **estado en RAM**, no sus
**píxeles**. Los píxeles se copian a VRAM y a partir de ahí el bucle principal lee de VRAM, no
de ROM. **El arte nunca debe ser residente.** Mantenerlo en banco frío es correcto y ya lo es.

**¿Un banco fijo de 8 KB dedicado?** **No aporta nada.** Los datos son
`bitmap_room_sprite_patterns` (~1,5 KB) + `bitmap_room_sprite_colors` y `_glowing` (768 B) +
bala (~48 B) ≈ **2,3 KB**. Dedicar un banco de 8 KB desperdicia 5,7 KB de ROM (irrelevante con
1,94 MB) **pero no gana determinismo**: el packer ya reparte bloques en bancos y falla explícito
si uno excede 8.192 B (`:2810-2812`). **Recomendación: dejarlo como está.**

### 8.2 Boss: recuento con el modelo metatile **[V] aritmética**

**8.192 / 128 = 64 celdas por banco de 8 KB** (datos crudos, sin RLE).

| Boss | Celdas base | Celdas de variante que caben en 1 banco | Con k=3 → frames de animación |
|---|---|---|---|
| 64×64 | 16 | 48 | **17 frames** |
| 96×96 | 36 | 28 | **10 frames** |
| 128×96 | 48 | 16 | **6 frames** |
| 160×128 | 80 | — | no cabe el cuerpo: **2 bancos** |

Contraste con lo que permite hoy el motor: **4 frames** (`msx2BitmapBossGenerator.ts:759`).
**Un solo banco de 8 KB da para 4× más animación de la que el motor sabe reproducir.**

Añadiendo lo demás: arena (12 celdas = 1.536 B) + death FX (16 celdas = 2.048 B) + paleta
(32 B) + tablas del boss (~230 B **[E]**) ≈ **3,8 KB**.

> **Veredicto: 2 bancos (16 KB) por boss, con holgura cómoda.** Banco A = cuerpo + variantes;
> banco B = arena + death FX + paleta + tablas. Con RLE sobra aún más. Y con 248 bancos
> disponibles, 20 bosses son 40 bancos: **el 16 % de la ROM**.

**Contraste VRAM ↔ ROM, que es la pregunta que importa:** de nada sirve tener 17 frames en ROM
si en VRAM caben menos. En modo boss hay **~400 filas libres = 51.200 bytes = 400 celdas de
capacidad** (§7.2), frente a las **64 celdas** que caben en un banco de 8 KB. **La VRAM admite
más de seis bancos enteros: el cuello no es ni la ROM ni la VRAM, son los topes del generador
y el blitter.**

### 8.3 Diálogo: candidato ideal a banco frío, **y ya lo es** **[V]**

Un retrato de 48×48 son dos fotogramas (boca cerrada + abierta) → `48 × 96 / 2` = **2.304 bytes
crudos**.

| Banco | Retratos de 48×48 | Retratos de 32×32 (1.024 B) |
|---|---|---|
| 8 KB | **3** | 8 |
| 16 KB | **7** | 16 |

**Frecuencia de lectura:** hoy se leen **una sola vez, en boot** (`:10791-10792`). Bajo carga
por demanda se leerían al abrir un diálogo — un evento raro, del orden de segundos. **CONFIRMADO:
es el candidato ideal a banco frío.**

**Pero ya están en banco frío** (`:15039`), y aun así ocupan 20,0 KB de VRAM. **Cambiar de
banco no arregla nada; lo que hay que cambiar es cuándo se suben a VRAM.** Éste es el ejemplo
que justifica la advertencia del §1.

### 8.4 El criterio general

La hipótesis planteada es **correcta, con un matiz que la hace más precisa**:

> **Lo que el bucle principal lee CADA FRAME va residente. Lo que se lee al entrar en una sala,
> al cambiar de frame de animación o al abrir un diálogo va a banco frío y se sube a VRAM bajo
> demanda. Y el arte NUNCA es residente ni permanece en VRAM más allá de donde se usa.**

El matiz: la tercera frase. Hay una diferencia entre "estar en ROM residente" y "estar en VRAM
permanentemente", y **el segundo error es el que comete el proyecto hoy**.

Qué cae de cada lado, y qué está mal colocado:

| Dato | Dónde debe estar | Dónde está hoy | ¿Correcto? |
|---|---|---|---|
| Código del motor | Residente | Residente | ✔ |
| Tablas por sala (render ptr, blockcount, collision/behavior ptr+bank) | Residente (se leen con bancos mapeados) | Residente | ✔ obligado (`bitmap-rom-resident-layout`) |
| Datos de música que lee `music_update` | Residente | Residente (`#A000`) | ✔ obligado |
| Patrones/colores de sprite del player | Banco frío, subida por cambio de frame | Banco frío, con fast-path | ✔ **ya bien** |
| Atlas de tiles (RLE) | Banco frío, subida por mundo/sala | Banco frío, subida **una vez** a VRAM global | ✖ **VRAM O(N)** |
| Frames de boss | Banco frío, subida al entrar en la arena | **Dentro del atlas residente en VRAM** | ✖ **VRAM O(N)** |
| Glifos + retratos de diálogo | Banco frío, subida al abrir el diálogo | Banco frío, **subida en boot y nunca desalojada** | ✖ **VRAM O(N)** |
| Gemelo oscuro | Derivado, sólo de lo que se pinta a oscuras | **Copia del atlas entero** | ✖ **VRAM O(N)×2** |

**Los cuatro ✖ son el mismo error, y todos son de VRAM, ninguno de ROM.**

### 8.5 Mapa de bancos propuesto **[E]**

| Banco(s) | Contenido | Tipo | Cuándo se mapea | Quién lo lee |
|---|---|---|---|---|
| 0–3 | Código, tablas por sala, tablas de sistemas, datos de música | **Residente** (`#4000-#BFFF`) | siempre | todo el motor |
| 4..n | Atlas del mundo (RLE), por mundo | Frío | `bitmap_prepare_world` / WorldLink | `upload_tileset_atlas` |
| n+1 | Semilla del HUD, corazones, tiles de widgets | Frío | boot | `init_bitmap_hud_band` |
| n+2 | Patrones + colores de sprite (player, bala, enemigos) | Frío | boot + cambio de frame | `bitmap_upload_player_frame_colors`, `bitmap_restore_player_sprite_patterns` |
| n+3.. | **Glifos + retratos, 3 por banco de 8 KB** | Frío | **al abrir un diálogo** | `upload_bitmap_dialogue_gfx` (a convertir en bajo demanda) |
| **B, B+1 por boss** | **A: cuerpo + variantes de celda. B: arena + death FX + paleta + tablas** | Frío | **al entrar en la sala del boss** (Room Lock, paso auto-walk) | cargador transitorio nuevo |
| últimos | Escenas de intro del GameFlow, música multi-banco | Frío | por nodo | walker / driver |

Regla de oro que atraviesa la tabla: **cualquier rutina que lea de un banco frío tiene que
vivir por debajo de `#8000` y restaurar los bancos residentes al salir.**

---

## 9. Escalabilidad: el argumento que justifica el refactor

### 9.1 Qué crece y qué no

| Recurso | Tamaño | ¿Crece? | Criterio |
|---|---|---|---|
| ROM (Konami SCC) | 1,94 MB de datos fríos | abundante | puede ser **O(N)** sin problema |
| **VRAM** | **128 KB** | **jamás** | **debe ser O(1)** |
| **Ventana residente** | **32 KB** | **jamás** | **debe ser O(1) por contenido** |
| RAM | techo `#F000` (`:15714`) | no | O(1) por contenido |
| Grupos de patrón de sprite | 64 | no | por sala co-activa, no global |

> **El criterio arquitectónico es uno solo: el coste en VRAM y en ventana residente de cada
> contenido nuevo debe ser O(1), no O(N).**

Cada opción del estudio bajo esa lente:

| Mecanismo | Coste VRAM | Veredicto |
|---|---|---|
| Atlas único compartido | **O(N tiles del proyecto)** | **MURO** |
| Gemelo oscuro del atlas entero | **O(N) ×2** | **MURO** |
| Stamps de boss en el atlas | **O(N bosses)** | **MURO** |
| Blob de diálogo residente | **O(N retratos)** | **MURO** |
| Atlas por mundo | O(mundo mayor) | **ESCALA** |
| Atlas por sala | O(sala mayor) | **ESCALA (óptimo)** |
| Ventana transitoria de boss | O(boss mayor) | **ESCALA** |
| Retratos bajo demanda | O(retrato mayor) | **ESCALA** |
| Boss como metatile | reduce la constante 3–7× | **ESCALA mejor** |
| Bancos ROM fríos | O(N) sobre 1,94 MB | **no es muro** |

### 9.2 El muro actual, con números **[V] aritmética sobre el proyecto real**

Región de atlas = 512 filas. Proyecto real: atlas 208 + diálogo 160 = 368 → **libre 144**.

| Contenido | Techo actual | Cuenta |
|---|---|---|
| **Bosses** | **1** | boss típico 96 filas; el 2.º pide 192 > 144 |
| **Bosses con gemelo oscuro** | **0** | 208 (atlas) + 208 (gemelo) + 160 (diálogo) = 576 > 512 |
| **Mundos** | **1** | 2 mundos de 115 tiles = 416 filas + 160 de diálogo = 576 > 512. Coincide con la nota `msx2-bitmap-multiworld`: *"El proyecto real va por 173/256, así que dos mundos no caben"* |
| **Retratos** | **3** | con 1 boss: 208+96+8+32 = 344 → libre 168 → 3×48 = 144 cabe, 4×48 = 192 no |
| **Tiles totales del proyecto** | **352** | 512 − 160 (diálogo) = 352 filas ÷ 16 × 16 celdas/estante. Con gemelo: **176** |

> **Añadir un boss cuesta filas del atlas compartido de forma permanente y global: es coste
> O(N). Eso es exactamente un techo, y está en 1.**

### 9.3 El techo con la arquitectura propuesta

| Contenido | **Hoy** | **Propuesto** | Qué lo limita ahora |
|---|---|---|---|
| **Bosses** | **1** | **~124** (2 bancos c/u de 248) | ROM |
| **Bosses (metatile, 1 banco)** | **1** | **~248** | ROM |
| **Mundos** | **1** | **decenas** (~26 KB RLE por mundo sobre 1,94 MB) | ROM |
| **Retratos de personaje** | **3** | **~744** (3 por banco de 8 KB) | ROM |
| **Tiles totales del proyecto** | **352** (176 con luz) | **ilimitado en la práctica**: la VRAM sólo aloja el mundo/sala activo | ROM |
| **Tamaño de boss a 60 fps (animado)** | 64×64 | **160×128 y más** si cambian ≤14 celdas | blitter |
| **Frames de animación de boss** | **4** | **10–17** por banco | tope del generador, a subir |

**La VRAM deja de aparecer en la columna "qué lo limita". Ése es el refactor.**

### 9.4 El siguiente cuello de botella **[E]**

Hecho todo lo anterior, **lo primero que volverá a romperse es la ventana residente de 32 KB.**
No es especulación: `test234.json` ya llegó a **24 bytes libres de 32.768** (nota
`screen5-resident-window-budget`), y el síntoma es un `Negative initial size: -N` de Glass, no
un mensaje comprensible.

Por qué es el siguiente muro: las tablas por sala **tienen que ser residentes** (se leen con
bancos de datos mapeados en P2, `bitmap-rom-resident-layout`), y son O(N salas):

```
render_ptr p0 (2) + render_ptr p1 (2) + blockcount (2) + collision ptr (2) + collision bank (1)
+ behavior ptr (2) + behavior bank (1) + transiciones (4) + world_local_index (1)   ≈ 17 B/sala
+ tablas de cada sistema activo (boss 27 B/sala, enemigos, plataformas, gemas, puertas…)
                                                                          ≈ 40–80 B/sala [E]
```

**Escala a la que aparece: ~60–120 salas** con el juego de features actual **[E]**
(a 60 B/sala, 100 salas = 6 KB de las 32 KB, más el código de todas las features activas, que
es lo que ya llenaba el residente con 13 salas).

Después vendrían, por orden **[E]**: (2) la RAM encadenada (techo `#F000`, `:15714`), a escala
de muchos sistemas simultáneos; (3) los **64 grupos de patrón de sprite** si una sala junta
muchas categorías de actor; (4) el tiempo de carga entre salas si el atlas pasa a ser por sala
sin trocearlo por frames.

**Mitigación conocida:** sacar tablas por sala a bancos fríos **no es posible** para las que se
leen con un banco mapeado. Lo que sí se puede es indexarlas mejor (tablas de estructura en vez
de estructura de tablas) y sacar del residente **todo** lo que sea arte o datos que no se leen
durante un `select_data_bank`.

### 9.5 Invariantes de diseño

Cinco reglas, para aplicar sin releer el estudio:

1. **Nada cuyo tamaño dependa del número de bosses, de mundos, de salas o de personajes puede
   vivir en el atlas compartido de VRAM.** Si crece con el contenido, va a una ventana
   transitoria dimensionada al **mayor** elemento, no a la **suma**.
2. **El arte nunca es residente en ROM, y nunca permanece en VRAM más allá de donde se usa.**
   Va a banco frío y se sube bajo demanda.
3. **Bancar algo no libera VRAM.** Sólo habilita la carga bajo demanda, que es lo que la libera.
   Si un dato ya está en un banco y sigue ocupando VRAM, el problema es *cuándo se sube*.
4. **Todo dato derivado (gemelo oscuro, variantes) se construye sólo sobre lo que realmente se
   consume**, nunca sobre el conjunto entero por comodidad de escribir un solo comando.
5. **Lo que el bucle principal lee cada frame va residente; lo demás va a banco frío.** Y toda
   rutina que lea de un banco frío vive por debajo de `#8000` y restaura los bancos residentes
   al salir.

---

## 10. Riesgo: la regla de la ROM byte-idéntica

El obstáculo real está localizado: **el shelf packer corre muy temprano y es order-dependent**.
Dos pasadas que tienen que recorrer el mismo orden (medición `:1854-1878`, colocación
`:1893-1930`), con un comentario advirtiéndolo (`:1852-1854`). Corre temprano porque
`assignDataBankConstants` necesita sus resultados para dar números de banco al código de subida
RLE que los sistemas posteriores usan (`:2794-2804`).

Cualquier cambio en el **orden** o el **conjunto** de items mueve todos los `sx/sy` y cambia el
ROM de **todos** los proyectos.

| Cambio | ¿Rompe byte-idéntico? | Cómo evitarlo |
|---|---|---|
| Excluir stamps de bosses no colocados (§3.3) | Sí, en proyectos con bosses huérfanos | Es un arreglo de bug; grabar línea base antes (arnés `screen5-generator-byte-identical-harness`) |
| Reordenar el packer para el gemelo (§6.4) | Sí, si se aplica siempre | Condicionar a `anyDarkRoom` |
| Empaquetar retratos en estantes (§3.4) | Sí, con ≥2 retratos | Condicionar a `portraits.length ≥ 2` |
| **Boss como metatile (§5)** | **Sí**: el boss deja de ser una entrada de 64×64 y pasa a ser 16 de 16×16 | Condicionar al modo metatile; los bosses que sigan siendo blob monolítico conservan el layout |
| Ventana transitoria de boss (§7.4) | No, si sólo se emite con bosses colocados | Patrón habitual del backend |
| Paleta por sala (§6.5c) | No | Emitir la tabla sólo si ≥2 salas difieren |
| Sala de boss iluminada (§6.3) | No | Es un dato del proyecto |

**Advertencia dura:** un régimen de VRAM propio para el combate **no se puede introducir sin
tocar el packer**, porque el packer es quien decide hoy que los frames del boss van al atlas
residente. Es riesgo **medio**, no bajo. Por eso va tarde en el plan.

---

## 11. Recomendación por fases

Ordenada por **beneficio / riesgo**, que no es "lo más ambicioso primero".

### Fase 0 — Hoy, sin tocar código. Riesgo cero.
**Declarar `runtime.lighting = 'off'` en las salas de boss.**
Gana: **15 índices de paleta pintables en vez de 7** (§6.1, §6.3). Ya funciona y está
verificado. Es cambiar un dato del proyecto.

### Fase 1 — Riesgo bajo, muchos KB.
**HECHA Y VERIFICADA EN HARDWARE (2026-08-18).** `DARK_ATLAS_PREFIX_ENABLED = true`.
Medido: atlas de 64 filas → gemelo de 32, **4 KB liberados**, coste de arranque 145 → 72 ms.

Episodio que merece quedar escrito: se la acusó de dejar una caverna en rojo sólido, y era
**inocente**. La misma caverna salía igual de roja con la fase apagada. La causa real era de
datos: la sala de arranque no tenía `backgroundColor`, caía a 0, y atenuar 0 da 8 — el slot 8
quedaba hipotecado como "la oscuridad" mientras el HUD ya lo usaba para el rojo de los
corazones (SLOT 8 RESERVE). El generador lo avisaba por consola desde el principio. Arreglo:
poner el fondo de la sala de entrada a un índice no-cero con el mismo negro.

Lección de método: comprobar **primero** si el bug existe sin tus cambios. Cuesta un build.
**Que el gemelo oscuro no cubra lo que ninguna sala oscura pinta.** Ordenar los items del
packer (tiles de salas oscuras primero, resto después, stamps de boss al final) y que el gemelo
copie sólo el prefijo, con el mismo único HMMM.
Gana: **8–13 KB** y, sobre todo, **hace que el gemelo quepa** → **292 ms → ~25 ms (12,5×)** por
entrada a sala oscura. Condicionar a `anyDarkRoom`.

### Fase 2 — Riesgo bajo, aislado.
**(a) Empaquetar retratos en estantes** (`:10663-10669`): 144 → 96 filas, **6,0 KB**; hasta
**62,5 %** del área de retratos en general.
**(b) Arreglar `collectBossBitmapStamps`** (`:1761-1765`): no meter en el atlas stamps de
bosses que no están colocados. Ganancia proporcional a las definiciones huérfanas.

### Fase 3 — **HECHA Y VERIFICADA EN HARDWARE (2026-08-18).**
`BOSS_METATILE_ENABLED = true`. Boss como metatile (§5): no aplanar `stamp.tiles[]`, emitir
celdas de 16×16, tabla de composición, `bitmap_boss_draw` como bucle sobre celdas con fallback
monolítico, y una segunda tabla de celdas-cambiadas por fotograma para el ahorro de blitter.

**Episodio que casi la deja mal cerrada.** El primer intento de verificarla en OpenMSX
concluyó "el boss no se dibuja" — `boss_active=1` y no había nada visible en pantalla, con el
flag tanto en ON como en OFF. Parecía un bug preexistente y ajeno a esta fase. Era un espejismo:
el "cuerpo" de la fixture de prueba es un tileset de sabana de repuesto (tonos de tierra y
hierba, con una banda de "cielo" transparente arriba), colocado justo al lado de una plataforma
de la propia sala con colores parecidos. **Se dibujaba perfectamente desde el principio**; sólo
que no se lee como "un monstruo" en una captura a tamaño reducido y se camufla con el decorado.

La prueba que lo cerró: con un cuerpo sin `bossPathId` (posición fija y conocida), se volcó la
VRAM de la página visible fila por fila, ancho completo de pantalla, con `BOSS_METATILE_ENABLED`
en `true` y en `false`. El `diff` de los dos volcados es **vacío**. No "se parece": son
byte a byte el mismo dibujo.

Lección de método, la misma que con la Fase 1: cuando algo "no se ve" en una captura, hay que
comprobar los bytes de VRAM antes de aceptar la lectura visual — sobre todo si el arte de
prueba no es el arte final.
Gana: **3–7× menos VRAM por boss**, deduplicación de celdas gratis (~25 % extra), fin del
desperdicio de estante, y **~4,8× menos blitter en la animación → 96×96 y 128×96 a 60 fps** (por omitir celdas, no por trocear: §5.4).
Habilita subir los topes de `frames` y de 256 px de tira.

**Condición de elegibilidad, sin UI nueva [V]:** el dato ya existe. Un boss anima sin
desplazarse cuando `bossMovement === 'static'` y no tiene `bossPathId` — el generador ya
resuelve ahí `dx = dy = 0` (`msx2BitmapBossGenerator.ts:811-817`). Con eso y `frames >= 2`
basta; la casilla "boss animado estático" que proponía este documento sería redundante.

**Orden sugerido de implementación**, ahora que §5.4 dice que el cuerpo entero por celdas sólo
cuesta ~12 % más:
1. **Bosses estáticos animados** (`bossMovement === 'static'`, sin path, `frames >= 2`): celdas
   deduplicadas + repintado sólo de las celdas que cambian. Es donde está todo el beneficio y
   el riesgo es contenido; el resto de bosses sale byte-idéntico.
2. **Bosses móviles**, después y como ajuste por boss: celdas por el 3–7 % de VRAM a cambio de
   ~12 % de blitter. Conservar el camino monolítico para los móviles grandes donde ese 12 %
   cruce el presupuesto de frame.

Aviso de acoplamiento: las dos mitades (datos y runtime) **no son separables**. Con las celdas
en el atlas el cuerpo deja de tener un rectángulo contiguo, así que el blit monolítico deja de
funcionar; emitir ambas cosas a la vez subiría la VRAM justo en la fase que viene a bajarla.

### Fase 4 — Riesgo medio. Resuelve la tesis.
**Ventana transitoria de boss**, cargada durante el Room Lock, **sin descargar el atlas del
mundo**. Entrada ~74 ms escondible en el auto-walk; **salida a coste cero**.
Opcionalmente compartir esa ventana con los retratos de la intro (§7.3).
Gana: el coste VRAM de un boss pasa de O(N) permanente a **O(1) transitorio**.

### Fase 5 — Riesgo medio. Fase 2 del multi-mundo, ya prevista.
**Atlas por mundo.** La fontanería de re-subida por WorldLink ya existe (`:16498-16502`).
Gana: el atlas pasa de la unión de mundos al máximo de un mundo → **el número de mundos deja de
estar limitado por VRAM**.

### Fase 6 — Riesgo alto, máxima ganancia. No bloquea nada.
**Atlas por sala.** 208 → 32 filas (26,0 → 4,0 KB). Coste: 4.096 B por transición = **28,6 ms =
1,7 frames**, solapable con la composición incremental que ya existe (24 bloques/frame, `:327`).
Sólo después de la Fase 5 y sólo si un proyecto real lo pide.

### Descartadas, con motivo
- **Compresión al vuelo** distinta del RLE: el cuello es el bucle de `OUT` por byte **emitido**;
  comprimir mejor cuesta **más** ciclos y ahorra una ROM que sobra (§7.5).
- **Cambio de paleta por línea (R#19)**: innecesario en cuanto la sala de boss es luminosa, y
  caro justo en el frame más cargado (§6.5e).
- **"Usar la página 3"**: no existe; las páginas 2 y 3 *son* la ventana del atlas. Los huecos
  reales suman **19 filas = 2,4 KB** (§2.1).
- **Deduplicación por espejo** de celdas de boss: **imposible**, HMMM no voltea (§5.6).
- **Banco fijo de 8 KB para el player**: no aporta nada; su arte ya está en banco frío y
  correctamente gestionado (§8.1).

---

## Apéndice: índice de evidencias

Salvo indicación, las líneas son de
`utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts`.

| Afirmación | Referencia |
|---|---|
| 212 líneas = HUD 20 + juego 192, R#9 LN=1 | `:286-289` |
| Atlas en filas 512..1023 | `:294-295` |
| Primer banco de datos = 4 | `:328` |
| 24 bloques VDP por frame en la composición | `:327` |
| Corazones en Y=224 (`#7000`), colores 9/14/1 | `:332-346` |
| Shelf packer, dos pasadas, order-dependent | `:1852-1930` |
| Deduplicación por huella de píxeles | `:1856-1861`, `:1897-1899` |
| `throw` si un item excede 256 px de ancho | `:1868-1870`, `:1899-1901` |
| `grid[y][x]` → `entries[value-1]`; `OP_COPY_16` por celda | `:2557-2574` |
| Bancos SCC reservados `(n&0x3F)==0x3F`; 256 bancos | `:2787-2792` |
| El packer corre temprano por `assignDataBankConstants` | `:2794-2804` |
| Un bloque no puede exceder 8.192 B | `:2810-2812` |
| SAT `#F600`, color `#F400`, patrones `#F800` | `:3058-3059`, `:14514` |
| Subida de color del player por cambio de frame, con banco | `:3357-3396` |
| `mapper_set_bank_p2` = `ld (#9000),a` | `:3606-3608` |
| `vdp_write_register` | `:3793-3803` |
| Bucle RLE→VRAM, 25 T/byte | `:3915-3922` |
| Carga de paleta, 16 registros | `:4022-4041` |
| `prepare_dark_atlas`: HMMM del atlas ENTERO + LMMV OR | `:4184-4192` |
| Blob de diálogo: una banda de filas por retrato | `:10657-10670` |
| Tope `width·2 ≤ 256` por retrato | `:10664-10665` |
| Blob subido una vez en boot | `:10791-10792` |
| `bitmap_dlg_close_box` repinta desde el programa de sala | `:11454-11503` |
| Stamps de TODOS los `msx2boss`, colocados o no | `:1761-1791` |
| "Phase 1 keeps ONE tileset atlas shared by all worlds" | `:14610` |
| Stamps de boss inyectados en el atlas compartido | `:14617-14621` |
| Mapa de slots libres (212/228/468; 488..511 tablas sprite) | `:14693-14700` |
| `dialogueVramBaseRow` y su guarda | `:14709-14712` |
| `darkAtlasEnabled` y su `console.warn` silencioso | `:14721-14731` |
| `dimShift` por sala | `:14834` |
| Chunks RLE de diálogo ya en bancos fríos | `:15039` |
| Scratch de carryables y de proyectil de boss | `:15277-15291` |
| 64 grupos de patrón de sprite | `:15174`, `:15307` |
| Techo de RAM `#F000` | `:15714` |
| WorldLink re-sube el atlas | `:16498-16502` |
| Oscuridad = flag por sala | `msx2BitmapLightingGenerator.ts:359-361` |
| Bit 3 = nivel de luz; OR `#08` / AND `#07` | `msx2BitmapLightingGenerator.ts:17-21` |
| Boss: 1..4 frames, 16..128 × 16..96 | `msx2BitmapBossGenerator.ts:759-764` |
| `bossInterval` por defecto 3 | `msx2BitmapBossGenerator.ts:783-786` |
| `sy = 512 + atlasY` | `msx2BitmapBossGenerator.ts:851` |
| Tabla del boss: sx, sy, width, height, frames | `msx2BitmapBossGenerator.ts:906-922` |
| Explosión de punto débil sin coste VRAM | `msx2BitmapBossGenerator.ts:868-870` |
| Death FX: 3 animados / 8 variantes, ≤64×64 | `msx2BitmapBossGenerator.ts:1353-1381` |
| Opcodes de Room Lock, incluido `DIALOGUE` | `msx2BitmapBossGenerator.ts:261-264`, `:467` |
| Auto-walk obligatorio del Room Lock | `msx2BitmapBossGenerator.ts:1548-1551` |
| `bitmap_boss_restore_strips` (restauración parcial) | `msx2BitmapBossGenerator.ts:2271-2278` |
| **`bitmap_boss_draw` = "one opaque HMMM"** | `msx2BitmapBossGenerator.ts:2345-2351` |
| **`bitmapStampToPixelGrid` aplana `stamp.tiles[]`** | `utils/msx2Screen5BitmapTileLibrary.ts:115-136` |
| `GAME_MODE_BOSS` sólo diseñado | `docs/msx/BOSS_SYSTEM_DESIGN.md:244-246`; 0 en `utils/` |
| HMMM 5,82 µs/B; LMMV 11,87; pantalla off −23 %; sprites off −29 % | `test/msx2-lighting/lmmv_bench.txt` |
| Fijo por comando ≈9 µs — **derivado**, no medido: el banco no mide HMMM pequeños (§5.4) | despejado de `lmmv_bench.txt` |
| CPU ≈88 µs por comando (`otir` de 15 B ≈ 315 T a 3,58 MHz) | `msx2BitmapBossGenerator.ts:2386-2394` |
| 64×64@60 fps y 96×96@30 fps verificados (redibujado completo) | `docs/msx/BOSS_SCREEN5_FEASIBILITY.md:27-31` |
| Residente a 24 bytes libres de 32.768 | memoria `screen5-resident-window-budget` |
| Bug histórico de colores de sprite en MegaROM | memoria `msx2-screen4-megarom-sprite-colors` |
| Tablas residentes leídas con banco erróneo | memoria `msx2-pool-index-banked-read` |
| Tick de música obligatorio en cargas largas | memoria `msx2-bitmap-transition-blocking` |

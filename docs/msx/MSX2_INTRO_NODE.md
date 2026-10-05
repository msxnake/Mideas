# Nodo Intro (SCREEN 5 bitmap-room)

Intro ilustrada con varias slides: imágenes colocadas en rectángulos, zonas de texto que se van
tecleando carácter a carácter y avance con ESPACIO o el botón A de un joystick. Se autoriza en el
editor **MSX2 Intro** (asset `msx2intro`) y se integra en el proyecto con el nodo **Intro** del
GameFlow (`Msx2GameFlowIntroNode { introAssetId }`).

## Modelo de datos (`types.ts`)

| Tipo | Campos principales |
|---|---|
| `Msx2IntroAsset` | `slides[]`, `fontAssetId?` (fuente por defecto), `musicTrackAssetId?` |
| `Msx2IntroSlide` | `backgroundColor`, `palette` (16 slots compartidos), `images[]`, `textZones[]`, `steps[]`, `transitionIn/Out` (`cut`\|`fade`) |
| `Msx2IntroImage` | `sourceAssetId` (un `msx2presentation`), `crop` (origen), `dest` (pantalla; `x` y `w` pares), `mono?` (`{ink, paper}`: imagen 1 bpp) |
| `Msx2IntroTextZone` | `rect` (x,w pares), `fg`, `bg`, `lineSpacing` 8..16, `charDelayFrames`, `fontAssetId?` |
| `Msx2IntroStep` | `zoneId`, `text`, `clearBefore`, `autoAdvanceFrames` (0 = espera pulsación) |

Reglas que el editor y la ROM comparten (`utils/msx2IntroUtils.ts`):

* **Un paso** teclea su texto en una zona. Una pulsación *mientras teclea* solo lo completa; la
  siguiente pulsación (un flanco nuevo) avanza. Un texto vacío no gasta pulsación.
* Mientras espera parpadea un triángulo en la esquina inferior derecha de la zona (cada 16
  fotogramas, empieza encendido). Guarda y restaura los píxeles que tapa.
* **Música** (`musicTrackAssetId`, misma convención que "Music on entry" del WorldLink): vacío =
  no toca lo que suene, `'__none'` = silencio, id de pista = arranca en bucle al empezar y sigue
  sonando después. Salir de una zona apaga la música, así que un intermedio necesita una pista aquí
  (o un nodo Music antes).
* **Fade** (`transitionIn/Out = 'fade'`): 7 pasos de 2 fotogramas que escalan R, G y B de la paleta
  (`round(c·nivel/7)`); entrada 1→7 desde negro, salida 6→0.
* **Fuentes**: siempre la máscara 1 bpp `patterns` del `msx2hudfont` (o la 6×8 integrada), dibujada
  en el color de la zona. El espacio se imprime en blanco aunque la fuente lo guarde como caja.
  Las imágenes se reducen a la paleta de la slide con el color más cercano; la transparencia de la
  imagen fuente se convierte en el color de fondo de la slide (el volcado a VRAM es opaco).
* **Imágenes 1 bpp** (`mono`, casilla "1-bit image" del editor): cada píxel pasa a `ink` o `paper`,
  el que esté más cerca en color del píxel fuente (la transparencia pasa a `paper`). Ocupan
  `ceil(w/8)·h` bytes en ROM en vez de `w/2·h` (128×128: 2048 B en vez de 8192). Los dos colores
  son slots cualesquiera de la paleta de la slide, no tienen que ser blanco y negro.

## Exportación (`msx2BitmapIntroGenerator.ts`)

Solo el backend **SCREEN 5 bitmap-room en MegaROM Konami SCC**. La ventana residente
`#4000-#BFFF` de un proyecto real está llena (test703: 247 bytes libres), así que:

```
resident (unos 65-190 B) bitmap_intro_run · bitmap_intro_copy_vram · bitmap_intro_music/tick (con música)
banco C  @#8000           intérprete (~1,6 KB) + tabla de fade + scripts (paleta, imágenes, zonas, pasos, texto) + fuentes
bancos C+1..              filas de imagen 4 bpp (o 1 bpp si `mono`), alineadas por fila (una fila nunca cruza de banco), con dedupe
```

**Imágenes 1 bpp.** Solo si alguna imagen es `mono` se emiten `bitmap_intro_copy_ram` (residente,
unos 12 B: copia una fila del banco de imagen a RAM) y, en el banco del intérprete,
`bitmap_intro_mono_setup` / `bitmap_intro_mono_row` (unos 150 B: expanden cada fila a nibbles con la
misma tabla de 4 pares que usan los glifos y la escriben con `bitmap_intro_vwrite`). Sin imágenes
mono, el ASM sale idéntico al de antes (comprobado contra el generador anterior con la intro de test720).

**Dónde va la parte residente.** Se emite justo detrás de las rutinas del mapper
(`bitmap_room_restore_resident_banks`), no al final del flujo: esas rutinas cambian P2, así que
tienen que estar por debajo de `#8000`, y solo ahí está garantizado aunque el proyecto sea grande.
En `buildRuntimeAsm` se deja un marcador (`INTRO_RESIDENT_MARKER`, solo si el GameFlow tiene un nodo
Intro) que el generador sustituye después. En test703 quedan en `#52CA-#5304` y la ventana residente
pasa de 247 a 181 bytes libres.

Los bancos se emiten **después** de todo lo demás. Un proyecto sin nodos Intro genera ASM y ROM
idénticos: se comprobó comparando los 13 casos de `scripts/check_generator_output_identical.mjs`
con y sin la integración (hoy ese script da diferencias en 5 casos por cambios ajenos del árbol, sin
relación con la intro). Los bancos con `(banco & #3F) == #3F` nunca se asignan (expondrían el SCC en P2).

### Formato del script (bytes)

```
intro   : nSlides, slide*
slide   : bg, flags(bit0 fade in, bit1 fade out), 32 bytes paleta [R<<4|B, G]*16,
          nImages, (xByte, y, wBytes, h, [tinta<<4|papel], nChunks, (banco, addrLo, addrHi, filas)*)*,
          nZones, (xByte, y, wBytes, h, celdaBytes, fuente, fg, bg, interlineado, retardo, columnas)*,
          nSteps, (zona, flags(bit0 limpiar), autoFrames, texto…#FF)*
texto   : índices de glifo (0..250; el 250 es el glifo en blanco), #FE = salto de línea, #FF = fin
contadores (slides, imágenes, zonas, pasos, tramos) caben en 1 byte: el exportador falla si pasan de 255
xByte   : bit 7 = imagen 1 bpp (xByte <= 127, el bit está libre); solo entonces va el byte [tinta<<4|papel]
filas 1 bpp: ceil(wBytes/4) bytes, bit 7 = píxel izquierdo, 1 = tinta, relleno a byte completo
```

### RAM (`#E600-#E6FF`, `BITMAP_INTRO_RAM_BASE`)

Estado propio del intérprete; nada más usa esa zona. La cadena de RAM dinámica del proyecto
(sistemas de HUD, enemigos, bosses…) empieza en `#D000` y tiene techo `#F000`; el motor de texto del
GameFlow ocupa `#E000-#E4FF`. El exportador **falla** si esa cadena llega a `#E600`. Las únicas variables del juego que toca son `bitmap_displayed_page` y
`bitmap_pending_display_page` (a 0, igual que los nodos Text).

### Estado que cambia y que se restaura

| Qué | Durante la intro | Al terminar |
|---|---|---|
| VRAM página 0 | se sobrescribe | queda en blanco (slot 0) |
| Paleta VDP | la de cada slide (y los fades) | `load_screen5_bitmap_palette` |
| R#1, R#2, R#8, R#14 | pantalla off/on, página 0, sprites off | display on, sprites on, R#14 = 0 |
| PSG R#15 / R#14 | se selecciona el puerto de joystick para leer el botón | R#15 queda con el puerto 2 seleccionado (el juego lo fija cada vez que lee la entrada) |
| PPI (fila 8) | se lee SPACE | fila 8 seleccionada |
| P2 / P3 | banco de la intro en P2 | P2 = 2, P3 = 3 |
| Páginas de VRAM 1–3 | no se tocan | — |

### Trampas conocidas

* **Música desde P2**: `music_update` mueve P2 (el SCC mapea `#3F`; el PT3 lo fuerza a 2 e ignora
  `mapper_bank_p2_current`). Se llama siempre por `bitmap_intro_music`, residente, que vuelve a
  mapear el banco de la intro antes del `ret`.
* **Copias de imagen**: el banco de imagen se mapea en P2 dentro de un helper residente
  (`bitmap_intro_copy_vram`); un intérprete que se mapea otro banco a sí mismo se desmapea.
* **Fade en el editor**: `drawIntroBuffer` no debe re-normalizar la paleta (reconstruiría los
  colores desde el índice maestro y deshace el fade).
* Una guarda `if bitmap_intro_resident_end > #8000 / ds -1` provoca un error de Glass (`Negative initial
  size: -1`) si la parte residente cruzara `#8000`; el motivo está en el comentario de esa línea del ASM.
* **Un menú cuya opción no tiene `sourceId`** en la conexión (pasa en test703 con START) se queda en el
  menú: la ROM trata la opción como "sin conectar". No es de la intro, pero impide llegar a ella.
* En OpenMSX, las capturas con `set throttle off` pueden salir con fotogramas antiguos: para mirar
  imágenes usar velocidad normal; los tests se apoyan en RAM/VRAM/paleta, no en capturas.

## Tests

| Comando | Qué cubre |
|---|---|
| `npx tsx scripts/test_msx2_intro_utils.ts` | máquina de estados del tecleo, rectángulos, fuentes, fade, música |
| `npx tsx scripts/test_msx2_intro_export.ts` | casos límite del exportador, cabeceras de contrato, guardas |
| `node scripts/check_msx2_intro_smoke.mjs` | OpenMSX: imagen, texto, marcador, música (`INTRO_MUSIC=keep\|none\|track`), avance con `INTRO_INPUT=space\|joy1\|joy2`, y que el presupuesto del intérprete cubra su tamaño real. Con `INTRO_MONO=1` las dos imágenes son 1 bpp (una de 124 px, ancho no múltiplo de 8) y su VRAM se compara byte a byte con el render del editor (`compare_msx2_intro_mono_vram.ts`) |
| `node scripts/check_msx2_intro_midgame.mjs` | intro **entre** dos WorldLink: sala idéntica, paleta y sprites restaurados |
| `node scripts/check_msx2_intro_fade.mjs` | fades leyendo la paleta del VDP (arriba, abajo, arriba) |
| `node scripts/check_msx2_intro_bigproject.mjs` | proyecto grande (fixture test606, ventana residente casi llena): la parte residente cae por debajo de `#8000` y todo ensambla |
| `node scripts/measure_bitmap_rom_budget.mjs <proyecto.json>` | presupuesto de ventana residente y bancos de cualquier proyecto |

El smoke va por eventos (espera a que la intro diga que espera, con un límite de 120 s emulados); el
intermedio y el fade todavía arrancan con horas fijas y se pueden desalinear si cambia la C-BIOS
(arranque ≈ 3,5 s).

## Pendiente

* Botón del joystick: la lógica del intérprete está probada forzando el bit del botón en la lectura del
  PSG (openMSX no puede pulsar el joystick desde un script); la selección real de puerto no se ha
  probado con un joystick.
* La escritura de paleta de cada paso del fade cae al principio del vblank, pero con música lenta puede
  rozar el final del borrado (1/7 de salto de brillo; sin medir en hardware).
* Música SCC nativa: solo se ha probado PT3 externo y PSG nativo.
* Fuentes de color: se dibujan en un solo color.
* Hardware real: sin probar (la lectura de VRAM bajo el marcador es lo más sensible).

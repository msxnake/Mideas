# Editor de transiciones SCREEN 5 (`msx2transition`) — diseño

Estado: diseño aprobado el 2026-10-04 (dirección: Opus; ejecución: agentes Sonnet).
Los números de línea citados vienen de la investigación del director: **verificar contra el código** antes de fiarse.

## 1. Qué se construye

Un asset nuevo `msx2transition` que añade un efecto de entrada a la pantalla de presentación
de un juego SCREEN 5 bitmap-room (ejemplo: "BACK TO MARS" en `C:\Users\salam\Downloads\test716.json`).
El usuario recorta rectángulos ("capas") sobre el bitmap de la presentación y les aplica efectos
preprogramados editables: **revelado** (persiana que descubre de arriba abajo), **deslizar**
(la capa baja desde arriba con easing/rebote), **fundido de paleta** (global o por capa), espera
y salto con tecla. Cada paso puede disparar **Sonidos assets** sincronizados (p. ej. whoosh al
empezar a bajar el logo y golpe al aterrizar).

### Decisiones de Jordi (2026-10-04)
- Integración: **propiedad `fxAssetId` del nodo `Screen5Presentation`** (no nodo nuevo).
- Persiana: **ambos** efectos, revelado y deslizar.
- Audio: **sincronizar Sonidos assets con los clips**. La música continua durante el título queda fuera del MVP.
- Alcance: **incluye fundido por región** (aceptado recuantizar; el asset de presentación NO se modifica).
- Decidido por el director/Claude: solo en el **arranque** (bitmap-room: las presentaciones a mitad de flujo
  se saltan hoy y las páginas 1-3 de VRAM están ocupadas durante la partida); backend solo bitmap-room
  (walker y backend estricto ignoran `fxAssetId` con aviso y exportan la imagen estática);
  una sola voz de sonido (canal C); animación saltable por defecto; imagen final derivada (no copia exacta).

## 2. Hechos verificados del código (verificar líneas)

- Asset `msx2presentation`: `types.ts:3632` (`pixels[212][256]`, `packedBitmap`, `palette` de 16, `runtime`).
  Editor `components/editors/Msx2Screen5PresentationEditor.tsx`; cuantizador `components/utils/msx2Screen5PresentationUtils.ts:226`;
  bytes para ROM `screen5PresentationData.ts:68` (paleta) y `:106` (bitmap).
- test716 usa el backend **bitmap-room** (`utils/msx2GameFlowPurpose.ts:65`). Flujo: Start → Screen5Presentation → Music → Intro → SubMenu → WorldLink.
- `resolveBitmapIntroScenes` (`msx2Screen5BitmapRoomGenerator.ts:662-733`, salta nodos Music en `:680`) convierte la presentación en una escena de
  `run_bitmap_intro` (`:1543`), llamada desde `init_rom` (`:19601-19609`) justo tras `init_screen5_bitmap_vdp` y **antes** de paleta del juego, HUD, atlas y sprites.
- En el dispatcher `Screen5Presentation` no hace nada (`:939-944`); `Intro` `:989`; `default` = salto `:1159`.
- La imagen se descomprime (RLE) directamente en la página 0 (`:16920`, `buildRleChunksForVram(...,0,...)`) → hoy se ve "de golpe".
  `decompress_bitmap_rle_to_vram` admite cualquier dirección VRAM (R#14).
- Ya existe un motor de transiciones (`utils/msx2TransitionPatterns.ts`, `screen5TransitionEngine.ts`), pero solo **rellena con color** (HMMV `:141`) o
  fundea paleta (`pal_lerp` `:462`); sus planes de rectángulos (`buildScreen5FillPlan` `:513`: wipe, persianas, iris, tramado) son reutilizables cambiando HMMV por HMMM.
- La ROM fuerza 60 Hz con R#9=#80 en `init_screen5_bitmap_vdp` (`:4735-4738`) → el tiempo del efecto va en **frames a 60 Hz fijos**.
- Durante el arranque las páginas VRAM 1-3 están libres: la imagen fuente vive en la página 1 (filas 0-211) y se compone con HMMM sobre la página 0.
  (Cuidado: la tabla de sprites de SCREEN 5 vive en filas 232-255 de la página 1, `#F400-#FFFF`; el efecto no debe tocarla. F0 lo confirma.)
- Cableado de un asset+editor nuevo (copiar `msx2intro`): `types.ts` (tipos + `EditorType`), `components/AppUI.tsx` (~`:455`, `:1401`),
  `components/tools/FileExplorerPanel.tsx`, `components/layout/Toolbar.tsx:466`, `handlers/useAssetHandlers.tsx` (`:941`, `:1322`),
  `components/tools/PropertiesPanel.tsx` (`:1084`, `:2125`), `utils/msx2ProjectProfiles.ts:62`. Generador con banco propio y trampolín residente:
  `msx2BitmapIntroGenerator.ts` (`:416-437`, guarda `ds -1` `:475`); marcador residente `options.introResidentMarker` (`:4534`, sustitución `:19277`);
  los bancos se añaden tras los de música e intro (`:19234`) → ROM idéntica si no se usa.
- RAM: `#E600-#E6DF` es de la Intro; el efecto necesita ~32 B + 4 B del sonido → candidato `#E700` (F0 lo confirma).
- Paridad: tests puros `scripts/test_msx2_intro_utils.ts`; OpenMSX `check_msx2_intro_smoke.mjs`/`_fade.mjs`/`_midgame.mjs`
  (throttle off, aserciones RAM/VRAM); comparación VRAM vs render JS `compare_msx2_intro_mono_vram.ts`. No hay Play del GameFlow bitmap: la paridad se mide contra el Play del propio editor.
- Hallazgo: la presentación de arranque hoy suena en silencio (el nodo Music se ejecuta en el dispatcher, después de `run_bitmap_intro`).

## 3. Modelo de datos

```ts
Msx2TransitionAsset {
  version: 1;
  sourcePresentationAssetId: string;
  layers: { id: string; name: string; rect: { x: number; y: number; w: number; h: number } }[]; // x y w pares; dentro de 256x212; disjuntas
  steps: { id: string; name: string; clips: Clip[] }[];   // los clips de un paso empiezan a la vez
  skippable: boolean;                                      // def true
  palettePlan?: { pinnedColors?: number[] };               // colores que el usuario no quiere fusionar
  exactFinal?: boolean;                                    // F4 (no MVP)
}
Clip {
  id: string;
  target: string | '__screen';                             // layerId o pantalla entera
  effect: 'reveal' | 'slide' | 'fade' | 'hold';
  durationFrames: number; delayFrames: number;
  easing: 'linear' | 'easeOut' | 'bounce';
  params: { direction?: 'down'|'up'|'left'|'right'; fade?: { direction: 'in'|'out' }; /* …por efecto */ };
  sounds?: { soundAssetId: string; at: 'start'|'end'; offsetFrames?: number /* -60..60 */ }[];   // máx. 2 por clip
}
Msx2GameFlowScreen5PresentationNode.fxAssetId?: string
```

## 4. Compilar a un flujo de bytes (clave de la paridad)

Una función TS pura `compileTransition(asset, image)` genera, fotograma a fotograma, un `Uint8Array`
de comandos VDP. El **Play del editor decodifica ese mismo bloque** sobre un modelo JS del VDP
(4 páginas de 256x256 a 4 bpp, paleta, página mostrada, backdrop, eventos de sonido) y el **Z80 solo lo reproduce**.
Easing y rebotes quedan precalculados en el flujo (coste 0 en el Z80). La ROM incluye el bloque con `DB`.

### Cabecera (12 B, little-endian, desplazamientos relativos al inicio del bloque)
| Offset | Campo |
|---|---|
| +0 | versión = 1 |
| +1 | flags: bit0 = saltable |
| +2 | valor de R#7 al empezar |
| +3 | 0 |
| +4 | `offStream` (u16) |
| +6 | `offFinal` (u16; 0 = no hay) — secuencia de salto al estado final |
| +8 | `offSounds` (u16) |
| +10 | `totalFrames` (u16) |

Tabla de sonidos: `u8 n` y n × `u16` con el offset del flujo de registros de cada sonido (10 B por paso, terminado en duración 0).

### Opcodes
| op | nombre | operandos | B | semántica |
|---|---|---|---|---|
| 00 | END | – | 1 | espera a que el motor de comandos esté libre; `SFXOFF`; R#15=0; vuelve |
| 01 | SYNC | n (1..255) | 2 | espera al motor; n× {tick sonido; vblank; si saltable y pulsación nueva de ESPACIO/disparo → salta a `offFinal`} |
| 02 | HMMM | sxb,sy,dxb,dy,wb,h,pages | 8 | SX=sxb·2, SY=sy+256·(pages&3), DX=dxb·2, DY=dy+256·(pages>>2&3), NX=wb·2 (wb 1..128), NY=h |
| 03 | HMMV | dxb,dy,wb,h,page,col | 7 | relleno; col = byte con los dos nibbles |
| 04 | LMMM | sx,sy,dx,dy,w−1,h,pages\|b4=TIMP | 8 | reservado F4: el MVP no lo emite |
| 05 | PAL | idx,rb,g | 4 | R#16=idx; dos escrituras a #9A |
| 06 | PALRUN | first,n,(rb,g)×n | 3+2n | ranuras contiguas |
| 07 | FLIP | page | 2 | R#2=(page<<5)\|#1F |
| 08 | SFX | id (bit7=0) | 2 | arranca el sonido en el canal C (reinicia si ya sonaba) |
| 09 | SFXOFF | – | 1 | R10=0, sombra=#24 |
| 0A | WAITKEY | – | 1 | soltar→pulsar→soltar, con tick de sonido |
| 0B | BACKDROP | c | 2 | R#7=c |
| ≥0C | inválido | – | – | el decodificador lanza error; el Z80 lo trata como END |

### Reglas (las garantiza el compilador y las comprueba el decodificador)
- Dentro de cada frame: PAL, PALRUN, FLIP y BACKDROP van justo tras `SYNC` y antes de cualquier HMMM/HMMV (la paleta se escribe justo tras el vblank, ~0,2 ms de ~3,2 ms).
- Página visible al terminar = 0. Si el efecto cambió R#7, tras la espera de la escena se repone `backdropColor`.
- x y w pares; rects dentro de 256x212 (la fuente es la página 1); capas disjuntas; ids existentes (presentación, sonidos, capas).
- El flujo cabe en el banco del intérprete.
- Presupuesto por frame: HMMM 4,51 µs/B, HMMV 2,88 µs/B, ~0,35 ms por orden (memoria `v9938-command-cost-measured`). Si un frame no cabe, el compilador añade `SYNC` y avisa.
- Para una escena con efecto, `paletteBytes` es la paleta **final** derivada (parte de un Transition posterior).
- Un fade_in/crossfade previo a la escena con efecto es error (el efecto gestiona su paleta).
- Sin MegaROM → la escena se muestra estática con aviso.

## 5. Efectos del MVP y coste (60 Hz)

| Efecto | Cómo | Coste | Veredicto |
|---|---|---|---|
| Revelado/persiana | 1 HMMM de tira por paso (2 filas = 250 B ≈ 1,5 ms); con lamas venecianas ~6,4 ms/paso | barato | 60 fps |
| Deslizar/desenrollar | HMMM de la capa + margen negro que borra la estela (+HMMV si falta). Logo 250x53 = 6.625 B ≈ 30 ms | ~30-45 fps, rasgado leve | En el arranque se puede hacer doble buffer gratis con FLIP 0↔3 |
| Fundido de paleta (global/región) | `PAL`/`PALRUN` | ~0 | gratis |
| Espera / salto con tecla | `SYNC` / `WAITKEY` | – | – |

Fuera del MVP (F4): disolución con tramado, letra a letra (una capa por letra), ciclo de paleta, iris, scroll por hardware R#23, `exactFinal`, LMMM transparente, música durante el título.
Inviable sin recuantizar: fundido por región (la paleta tiene 16 colores) → ver §7.

## 6. Audio sincronizado (diseño A)

- "Sonido" = asset `type:'sound'` con `PSGSoundData` (`types.ts:2712`, `:4590`). test716 tiene uno ("xof").
- Reproductor existente reutilizable: `msx2PsgOneShot.ts` (`compilePsgOneShot` `:50`; `buildPsgOneShotAsm` `:130`; usa el **canal C**; duración `durationMs*60/1000`;
  4 B de RAM; hay que llamar a `_tick` una vez por frame). Lo usan el disparo (`msx2BitmapShootGenerator.ts:496-503`) y la seta (`msx2Screen5BitmapRoomGenerator.ts:18570`). No copiar el formato del boss.
- Se puede llamar ANTES de `run_bitmap_intro` (no depende de `music_init_system`; escribe R4-R13, R7 y la sombra; la sombra se pone a #24 más tarde, `:19612`). 0 B residentes; ~116 B de código en el banco; 4 B de RAM.
- Los ticks los da el intérprete en `SYNC` y `WAITKEY`. Los datos del sonido viven en el banco del intérprete (no cambia de banco, a diferencia de la música: ver `bitmap_intro_music`, `msx2BitmapIntroGenerator.ts:451-458`).
- Refactor previo SIN cambiar ninguna ROM: `compilePsgOneShotRecords()` devuelve los registros como array; etiqueta `${prefix}_start_hl` (HL = datos) que no genera bytes.
- Play: port TS de `_tick/_load_step` + nuevo `AYRegisterSynthesizer.pokeRegisters(pares)` (`components/utils/ayRegisterSynthesizer.ts:80`), en el mismo frame que decodifica `SFX` → paridad a nivel de registro. (El `SoundEditor.tsx:200-201` escala por tempo y la ROM no: no usarlo para el Play.)
- Una sola voz: si un sonido corta a otro, el compilador avisa ("golpe corta a whoosh en el frame N"). Si queda cola sonando al final, el compilador añade `SYNC` hasta que termine; `END` silencia; saltar la animación hace `SFXOFF`.
- Id inexistente o sonido sin pasos → aviso y se omite el opcode (no falla).
- UI mínima: selector de sonido en el inspector del clip, "inicio/fin ± frames", ▶; barra ♪ en la línea de tiempo con la duración real; si no hay sonidos: "Crea uno en Sound Editor".

## 7. Fundido por región (diseño B)

Datos reales de `msx2presentation_1784393641268` (256x212): fondo negro = ranura 1 (42.015 px); logo (x4..253, y12..64) 13 colores;
alien (x68..171, y65..200) 5 colores; **comparten 4** (10, 11, 14, 15); píxeles sueltos en el alien: 4 px rojos de color 6/8 en (140-142,121-122) y 1 px de color 7 en (146,152).

- El negro pasa a la **ranura 0** (R#7=0 durante el efecto). Quedan 15 ranuras y hacen falta 21 → fusionar 6 colores. Algoritmo voraz que minimiza (píxeles × distancia RGB de 3 bits):
  logo 2→12 (2 px), 13→14 (7 px); alien 7→14 (1 px), 6→8→10 (4 px, el ojo rojo pasa a amarillo), 14→10 (17 px).
  Resultado: **16/16 ranuras, 30 píxeles distintos alteran color (0,24 % de los no negros)**; logo con 11 colores, alien con 4, negro en la 0.
  (3.769 píxeles del alien cambian de índice pero no de color.)
- **Imagen derivada en compilación (opción i, MVP):** función pura compartida por Play y generador; ROM +0 (RLE 8.928 vs 8.932 B). **El asset de presentación no se modifica.**
  Descartada (ii-a, parche PSET + tabla): con el negro en ranura 0 cambian de índice 42.000 px. (ii-b, volver a copia intacta con FLIP) queda como `exactFinal` en F4.
- Modelo: cada capa con clip `fade` pasa a tener paleta aislada (la calcula el editor); el resto forma el grupo "rest"; el fondo es común.
  `planPaletteGroups()` devuelve correspondencia de colores por capa, paleta nueva, rangos **contiguos** por grupo, píxeles alterados y lista de fusiones.
  En el asset solo se guarda `palettePlan.pinnedColors`. UI: aviso "se alteran N px (Δ máx.)" + vista de diferencias que resalta esos píxeles + botón "fijar color".
- El fundido: todo precalculado en TS: color = round(c × nivel_grupo × nivel_global) por componente de 3 bits; solo se emiten las ranuras que cambian con `PALRUN` por grupo (logo ≈ 25 B por cambio, ~200 B por fundido).
  Un fundido global simultáneo = multiplicar los dos niveles, sin cálculo en el Z80. Deslizar otra capa a la vez no interfiere.
- Casos límite: colores imposibles de aislar → siempre se resuelve fusionando, con aviso si se altera >1 % de la capa o Δ>3 (error solo si no se llega ni con un color por grupo);
  varios grupos a la vez permitidos (límite 15 colores totales); capa que se desliza y se funde funciona; rects de capa solapados = error;
  capa que pasa por encima de otra al moverse → aviso (HMMM es opaco; LMMM TIMP reservado para F4); solo fundido global → no se deriva nada.

## 8. Intérprete Z80 e integración

- ~400-600 B en un banco propio mapeado en P2 junto al flujo (como la Intro) + trampolín residente `bitmap_fx_run` de ~15-25 B por debajo de `#8000`, insertado con el mismo marcador (se activa si hay Intro **o** efecto).
  Incluye OUT al VDP, lectura de teclado por PPI, escritura de paleta y el reproductor PSG. Si hubiera música: envoltorio residente que re-mapea el banco (lección `bitmap_intro_music`).
- Al terminar: R#2 a página 0, R#7 repuesto, página 0 idéntica a la imagen final derivada.
- En `resolveBitmapIntroScenes` y `buildBitmapIntroAsm` (~`:1436`): si la escena tiene `fx`, su RLE (imagen derivada) va a la página 1 (`#08000`, carga invisible), se llama a `bitmap_fx_run` y se añade el epílogo.
- **ROM byte-idéntica si no se usa:** todas las ramas protegidas por `scene.fx`; bancos al final; pasar el arnés de 13 casos (memoria `screen5-generator-byte-identical-harness`) + test716 sin efecto.
- Guardas: trampolín < `#8000` (`ds -1`), presupuesto del banco, cadena de RAM ≤ `#E600` hasta la RAM del efecto.
- El Play del editor estira cada frame a max(espera, ⌈coste⌉), como la ROM (el flag de vblank queda guardado).

## 9. Fases

- **F0** (medición): presupuesto residente de test716, páginas VRAM libres, coste HMMM 250x53 y tiras, RAM `#E700`. Informe: `docs/msx/MSX2_TRANSITION_FX_F0.md`.
- **F1a**: tipos en `types.ts`; `utils/msx2TransitionFx.ts` (puro: `validateTransitionAsset`, `resolveTimeline`, `planPaletteGroups`, `deriveFxImage`,
  `compileTransition`, `createFxDecoder`/`stepFxFrame`, `createPsgOneShotSequencer`); refactor de `msx2PsgOneShot.ts` sin cambiar ROMs; fixture extraído de test716 (solo la presentación) en `test/msx2-transition-fx/`; `scripts/test_msx2_transition_fx.ts` + `package.json`.
- **F1b** (tras F1a): `components/editors/Msx2TransitionEditor.tsx` (lienzo de capas calcado de `Msx2IntroEditor`, línea de tiempo, inspector de clips con sonido, panel de paleta con diferencias y "fijar color", Play con `pokeRegisters`) + cableado.
- **F2** (tras F1a y F0): `msx2BitmapTransitionFxGenerator.ts` + integración en el generador bitmap-room + selector `fxAssetId` en `Msx2GameFlowEditor.tsx` (~`:2064`) + avisos en walker y backend estricto.
- **F3** (tras F1a y F2): `scripts/check_msx2_transition_fx_smoke.mjs` en OpenMSX.
- **F4** (opcional): `exactFinal`, LMMM transparente, disolución/letras/iris/ciclo de paleta, flujos multibanco, música durante el título.

### Criterios de aceptación
- F1a: plan de paleta = 16/16 ranuras y 30 px alterados; demo de prueba (logo cae en 40 frames con whoosh al empezar y golpe al final; alien aparece en 32 frames) con flujo < 4 KB;
  la página 0 final del decodificador coincide con la imagen derivada; codificar/decodificar = identidad; saltar con tecla deja el mismo estado final;
  todos los rects con x/w pares dentro de 256x212; **los tests se ponen en ROJO al sabotear el código** (p. ej. el byte alto de DY); ROMs sin cambio tras el refactor de `msx2PsgOneShot`.
- F1b: en el navegador, crear el asset desde la presentación de Back to Mars, dibujar la capa del logo, ver el Play y oír el sonido en el frame correcto; tsc acotado y vite build limpios.
- F2: proyectos sin efecto byte-idénticos (arnés); guardas funcionan; test716 compila con el efecto.
- F3: al llegar a END la VRAM de la página 0 = la del decodificador (27.136 B) y la paleta del VDP es la final; R#10 ≠ 0 en el frame de cada sonido ±1; R#10 = 0 tras END;
  saltar con ESPACIO llega al estado final en ≤ 2 frames; verificado en rojo quitando el tick; duración dentro de ±10 % de la estimación.

## 9b. Correcciones y cifras medidas en F0 (2026-10-04, OpenMSX 21.0; informe: `MSX2_TRANSITION_FX_F0.md`)

Estas cifras MANDAN sobre las del resto del documento cuando discrepan.
- **Residente libre** (ventana < #8000): test716 = **1.144 B** (exacto: +1 B falla con `Negative initial size`), test710 = 868 B, test703 = **229 B**. Trampolín de 14 B ensambla en test716. test716: 28 de 256 bancos, holgura de datos 44.267 B.
  El motor `bitmap_tfx_*` (730 B) no cabe residente en test703 → **el intérprete va en banco**.
- **VRAM:** páginas 1-3 intactas durante todo `run_bitmap_intro` (centinela #A5). Tras `init_rom` se reescriben página 1 filas 0-19 (HUD seed), atlas, diálogo y sprites (#F400-#FFFF = filas 232-255 de la página 1).
  **Rango seguro para la imagen fuente: página 1 filas 0-231** (la primera sala solo pinta la página 0).
- **Coste HMMM medido** (sin sprites / con 9 sprites): 250x53 = 29,91 / 38,63 ms (1,79 frames a 60 Hz); tiras 250x2 / x4 / x8 = 1,13 / 2,26 / 4,51 ms. 4,51 / 5,83 µs/B confirmados.
  **HMMV** 250x53 = 18,39 ms; 250x2 / x4 / x8 = 0,69 / 1,39 / 2,78 ms (2,78-2,88 µs/B).
- **El «0,35 ms por orden» es coste del Z80** (OTIR ≈ 0,14-0,16 ms + overhead), no del VDP: el coste fijo de VDP es ~0 (< 6 µs). El compilador debe presupuestar CPU y VDP por separado.
- **R#2 (flip) y paleta:** efecto en la línea de barrido siguiente; solo limpios si se escriben en los primeros ~3,1-3,2 ms tras el flag de vblank (si no, corte visible). Compuesto con HMMM directo sobre la página visible se ve a medias ~2 frames →
  el doble buffer 0↔3 es viable, pero con margen de 2d filas para borrar la estela, d ≥ 4 pasa de 2 a 3 frames por paso.
- **RAM:** `#E700-#E73F` libre. La Intro ocupa `#E600-#E6FF` **entero** (no `#E6DF`). RLE completo de la presentación de test716 = **8.934 B** (6.998 + 1.936, bancos 14 y 15); logo en bruto 6.625 B; alien (x68-171, y65-200) 7.072 B.
- **Riesgos para F2:** (1) la guarda de RAM de la cadena (≤ `#E600`) y el marcador residente hoy solo existen con nodo Intro → hay que activarlos con **«Intro o efecto»**;
  (2) `run_bitmap_intro` corre **antes** de inicializar la RAM → el intérprete debe **autoinicializar** su RAM y estado; (3) tras el efecto, los restos de la página 1 los repinta la primera transición de sala: probarlo;
  (4) las capturas de OpenMSX pueden salir con fotogramas viejos → aserciones sobre VRAM/RAM/registros, no sobre imágenes.

## 9c. F2: intérprete Z80 e integración (2026-10-04, OpenMSX 21.0)

Código: `utils/msxGenerator/generators/msx2/msx2BitmapTransitionFxGenerator.ts` (intérprete + trampolín + diseño de banco + compilación del asset por escena),
integración en `msx2Screen5BitmapRoomGenerator.ts` (`resolveBitmapIntroScenes`, `buildBitmapIntroAsm`, `init_rom`, marcador residente, mapa de bancos);
avisos en `msx2Screen5FlowGenerator.ts` y `msx2Screen5PresentationGenerator.ts` (ROM idéntica con o sin `fxAssetId`).

**Cifras reales** (sobre lo escrito en §8):
- Intérprete **819 B** (132 B son el secuenciador PSG one-shot; la tabla de despacho 24 B). `BITMAP_FX_CODE_BYTES_ESTIMATE = 900`: el smoke falla si Glass lo supera.
- Trampolín residente `bitmap_fx_run` **12 B** (`ld c,a / ld a,BANCO / call mapper_set_bank_p2 / call bitmap_fx_main / jp bitmap_room_restore_resident_banks`).
  En test716 la ventana residente pasa de 1.144 a **1.120 B libres** (−24 B: 12 del trampolín + 12 de la llamada y la reposición de R#7 en `run_bitmap_intro`).
- **Un banco** (tras música e Intro; en test716 el banco 28, 29 bancos en total). Efecto de prueba: bloque 845 B → banco 1.666/8.192 B. El banco aloja intérprete + tabla de bloques + todos los
  bloques distintos del proyecto (el índice del bloque va en A); presupuesto de datos = 8.192 − 900 B (manda el menor entre eso y `FX_MAX_BLOCK_BYTES` = 6.144 de F1a).
- RAM **`#E700-#E70B`** (12 B; `#E700-#E73F` sigue reservado), puesta a cero al empezar con un `ldir` (el efecto corre antes de inicializar la RAM del juego).
  Guarda: cadena de RAM ≤ `#E700`, o ≤ `#E600` si hay nodo Intro.
- Efecto de prueba (alien fade 32 + logo con rebote 40 + espera de tecla): **120 ticks estimados, 120,96 medidos**; ESPACIO durante la animación llega al final en ~0,05 s.

**Semántica decidida donde el documento no la fija** (el decodificador JS manda; estas son las únicas elecciones):
- **Tick = poll de S#0 hasta bit 7**, sin descartar antes un flag enganchado (un flag que se enganchó mientras el motor trabajaba cuenta como el tick). Con la espera de `bitmap_wait_vblank`
  (descartar y esperar el siguiente flanco) la misma animación dura 146 ticks (+22 %). Ver `ai/LESSONS_LEARNED.md`. `SYNC n` = esperar el motor y luego n ticks; cada tick = vblank → tick PSG → leer teclas.
- `prevKey` inicial = 0, como el decodificador: un ESPACIO ya pulsado al arrancar salta la animación (el `WAITKEY` sí exige soltar-pulsar-soltar).
- **LMMM (#04) y opcodes ≥ #0C → END** en el Z80, y el exportador **rechaza** un bloque con LMMM (error) hasta F4; también un `SFX` con id fuera de la tabla o un bloque mal formado.
- **R#7**: el intérprete pone el de la cabecera (0) al empezar; la escena repone el del cuarto de arranque (`ld e,#NN`) **después de la espera de la escena** y antes de una Transition posterior.
- La espera propia del nodo (`waitForKey`/`waitFrames`) corre **después** del efecto: un efecto que termina en «esperar tecla» sobre un nodo con `waitForKey` pide dos pulsaciones (con el salto también:
  pulsación 1 salta, pulsación 2 sale de la escena). Pendiente de decidir con Jordi (p. ej. que el editor ponga `waitForKey=false` en el nodo cuando el efecto ya espera).
- Una escena con efecto que no es la primera hace `bitmap_intro_cls` antes (el decodificador asume la página 0 negra). Detrás de un Transition de paleta (fade_in / fade_out_in / crossfade) es **error**.
- **Errores** (la exportación aborta, con mensaje): sin MegaROM (§4 decía «estática con aviso»; aquí es error, igual que el nodo Intro), asset inexistente, presentación fuente distinta de la del nodo, efecto que no compila,
  Transition de paleta previo, LMMM, bloque que no cabe en el banco, cadena de RAM sobre `#E700`/`#E600`. **Avisos**: los del compilador (frames estirados, plan de paleta), presentación con efecto fuera
  de la secuencia de arranque (se ignora), y walker / backend estricto (exportan la imagen estática).
- Mapa de bancos: el banco tiene tipo propio **`fx-code`** (informe del generador → `Screen5BankKind` en `utils/msx2Screen5MemoryBudget.ts` → rótulo «Efecto (código)» en `components/layout/Msx2MegaRomBankMap.tsx`; el componente no pinta color por tipo, solo usado/libre, así que no hay color nuevo); el tooltip lista «Transition FX: nombre». Se mide por el símbolo `BITMAP_FX_CODE_BANK_USED_END` igual que el banco de código de la Intro.

**F3 (2026-10-05): el smoke compara TODOS los ticks, no solo el final.**
- **Cómo se muestrea el tick N** (sin depender del reloj): la etiqueta `bitmap_fx_tick_done` cuelga del `ret` de `bitmap_fx_tick` (0 bytes) y un breakpoint la cuenta; el N-ésimo golpe es el tick N del decodificador.
  El decodificador avanza tick a tick, así que su estado tras el tick N es el que tiene el Z80 cuando su N-ésimo tick vuelve: las órdenes del grupo (paleta, SFX, HMMM/HMMV) van antes del `SYNC` y este espera a que el motor
  de comandos esté libre ANTES de contar su primer tick, de modo que el VDP ya tiene el fotograma completo. Un fotograma estirado (`SYNC 2` con 30 ms de HMMM) no introduce error: los ticks se **cuentan por llamadas**,
  nunca se leen del reloj, y el primer tick de ese `SYNC` vuelve al instante (flag enganchado) con el motor ya libre.
- El teclado y el joystick se manejan **desde ese contador** (mismos números que usa el decodificador: pulsar en el tick 40 durante 10 ticks para saltar, en el 130 durante 12 para el `WAITKEY`), así que la ejecución es
  determinista en la base de tiempo del decodificador y el END tiene que llegar en **exactamente** su tick: 143 sin saltar, **41** al saltar en el tick 40 (el salto cuesta 1 tick; el criterio «≤ 2 frames» se cumple con margen).
- En cada uno de los 120 ticks de la animación: página 0 de VRAM (27.136 B), las 16 entradas de paleta y el fichero de registros del PSG, contra el decodificador. Ticks destacados 10/25/40/50/60/70 (los 80 y 100 de la propuesta ya
  son el estado final en este efecto, así que no discriminan: el constructor exige que los destacados difieran del estado final). Registros PSG: R#10 en todos los ticks y R#4-7/R#11-13 desde el primer sonido
  (antes el fichero de registros conserva lo que dejó la BIOS, que el decodificador no modela); de R#7 solo cuentan los 6 bits del mezclador (los bits 6-7 son la dirección de los puertos de E/S y el PSG los fuerza).
  Cada evento SFX del decodificador se comprueba aparte (ticks evento−1…+1) y debe ser **observable** (los registros cambian). R#10 = 0 tras el END y tras un salto con el sonido sonando (el salto en el tick 40 cae en plena «whoosh»).
- Joystick: `--joy=1|2` fuerza el bit del botón (0 = pulsado) con un breakpoint en la etiqueta `bitmap_fx_key_joy1/2`, como `INTRO_INPUT=joy1|joy2` en la Intro (OpenMSX no puede pulsar un joystick desde un script); el teclado queda quieto.
  Verde con `--joy=1 --skip`, `--joy=2 --skip`, `--joy=1` y `--joy=2` (estos dos pasan el `WAITKEY`).
- Sabotajes F3 en rojo: `dx_high_midflow` (los HMMM de los ticks 50-70 apuntan fuera de la página: **el estado final y la paleta final salen bien** y falla desde el tick 52, también en los destacados 60 y 70), `sync_collapse`
  (todo SYNC dura un tick: final correcto; falla ya en la paleta del tick 4 y en VRAM desde el 35), `psg_no_tick` (falla en el tick 42), `sfx_wrong_id` (falla en el tick 97), `skip_no_sfxoff` (R#10 = 8 tras el salto), `joy1_ignored` y `joy2_ignored`
  (el `WAITKEY`/salto no llega: timeout; el cruzado — ignorar el puerto 1 con la pulsación por el 2 — sigue verde).

**Verificación** (todo contra el decodificador JS o registros/VRAM, nunca capturas):
- `npm run test:msx2-transition-fx-export` (diseño del banco, guardas, cabeceras de contrato, extremo a extremo desde el JSON con `fxAssetId`, walker/estricto; 8 mutaciones puestas en rojo a mano).
- `npm run test:msx2-transition-fx-openmsx` (smoke): ROM compila, intérprete ≤ estimador, página 0 de VRAM **byte a byte** igual a la del decodificador (27.136 B), página 1 = imagen derivada, paleta final, R#2/R#7/R#15/R#14, PSG liberado,
  duración ±10 %, el juego continúa y R#7 vuelve. También con `--skip` (mismo estado final), `--noskip` (efecto no saltable: la pulsación se ignora y dura lo mismo) `--chain` (el efecto es la segunda escena: exige el `bitmap_intro_cls` previo) y `--two-fx` (dos efectos distintos en el banco: el de Back to Mars corre desde el bloque 1 de la tabla). Sabotajes en rojo: `--sabotage=` dy_high, palrun_stride, no_wait_ce (sobre HMMV; sobre HMMM no se nota porque va siempre primero tras un SYNC), sx_not_doubled, sync_no_ticks, vblank_discard_stale, no_backdrop_restore, no_cls_before_fx (con `--chain`), block_index_ignored (con `--two-fx`).
- `npm run test:msx2-transition-fx-room-change` (riesgo 3 de F0): misma ROM con y sin efecto; tras el arranque se empuja al jugador por el borde oeste y se vuelca la banda de juego (filas 20..211) de la página mostrada: idéntica con y sin efecto antes y después del cambio de sala (la página 1 oculta SÍ conserva la imagen del efecto antes del cambio: control positivo de la sonda; la transición la repinta entera).
- `scripts/check_msx2_megarom_bank_map.ts` tiene un caso «Transition FX» (kind `fx-code`) y una comprobación pura del informe: el banco del efecto sale en el mapa y su tamaño (símbolo de Glass) coincide con los bytes de la ROM.
- test716 con el efecto injertado: compila y `--project=` reproduce el efecto con página 0 idéntica.
- Arnés byte-idéntico (`--rom`): los 13 casos + un proyecto con nodo Intro + test716 sin efecto, ASM y ROM idénticos a la línea base previa a F2. (El `baseline.json` del repo ya llevaba deriva en 5 casos bitmap-room antes de F2; no se ha re-grabado.)

**Sigue SIN verificar (hardware real; todo lo medido es OpenMSX 21.0):**
- Que la paleta, R#2 y R#7 escritos justo tras el `SYNC` caen dentro de la ventana de ~3,1 ms con una CPU/VDP reales (en OpenMSX se mide el estado por tick, no la posición del corte en pantalla); sin comprobar rasgado en un fotograma estirado.
- El botón del joystick con un joystick físico (aquí se fuerza el bit en la lectura del PSG; la selección real de puerto vía R#15 no se ha probado) y la repetición/rebote de un ESPACIO real.
- El sonido por el chip PSG real (aquí se leen los registros del PSG emulado: valores, no forma de onda), y que el R#7 con los bits de puerto cuadre en hardware.
- Cartuchos reales (Konami SCC en Carnivore2/MegaFlashROM): solo se ha probado `-romtype KonamiSCC`. Música sonando durante el efecto: fuera de alcance (el nodo Music corre después).
- Los timings absolutos (HMMM 30 ms, 120 ticks ≈ 2,0 s) salen de las mediciones de F0 y de OpenMSX; sin cronometrar en un MSX2 real.

## 10. Preset por defecto sobre "Back to Mars"
1. Fundido de entrada del alien (~32 frames).
2. El logo (4,12,250x53) baja desde arriba con rebote (~40 frames, ≈0,7 s) con whoosh al empezar y golpe al aterrizar.
3. Espera de tecla.

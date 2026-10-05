# Mover el motor de transiciones SCREEN 5 (`bitmap_tfx_*`) a un banco — plan

Estado: plan aprobado el 2026-10-05 (dirección: Opus; ejecución: agentes Sonnet). Las rutas y líneas vienen de la investigación
del director: **verificar contra el código** antes de fiarse.

## 1. Problema (medido)

`C:\Users\salam\Downloads\test719.json` (SCREEN 5 bitmap-room, MegaROM Konami) no compila: Glass da `Negative initial size: -223`
= la ventana residente de 32 KB (`#4000-#BFFF`, bancos 0-3; mídela con
`node scripts/measure_bitmap_rom_budget.mjs <json> --asm X.asm --sym X.sym --keep X.rom`) se desborda.
Causa: un nodo GameFlow `Transition` (`screen5_diagonal_pixel_wipe`, 30 frames, reverse) entre Music e Intro. Sin ese nodo quedan 1.120 B libres.
(El efecto de entrada `msx2transition` NO es la causa: ya estaba en test718, que compila; cuesta 24 B.)

Coste residente de cada efecto en test719 (libres con el efecto puesto; base sin nodo = 1.120):
cls 1.109, fade_to_black 1.068, vertical 382, horizontal 437, mirror 418, blinds 662, pattern 622, wipe 542, **diagonal NO CABE (faltan 223)**, **iris NO CABE (faltan 1.250)**.

Hallazgos del director:
- **El coste fijo es 411 B** y cuadra con las 8 mediciones: motor de relleno 385 B (`wait_ce` 24 + `hmmv` 49 + `play` 133 + `rect_tiles` 179; ref. `server/temp/menu_music/music_trans.sym`)
  + llamada 9 + espera de duración 5 + `jp` del nodo 3 + sombra SFX del init adelantado 5 + `world_palette_ptr` 4. El resto es la tabla de cada efecto
  (diagonal, bloque 16 = 224 rectángulos = 932 B → 932+411 = 1.343 ✓; iris círculo bloque 8 = 1.959 B → 2.370 ✓).
- **En test719 la transición no la ejecuta el dispatcher:** `resolveBitmapIntroScenes` (`msx2Screen5BitmapRoomGenerator.ts:690-765`) salta el nodo Music y marca el Transition como
  «consumido» por la escena 0; se reproduce dentro de `run_bitmap_intro` (llamada desde `init_rom`), tras `bitmap_fx_run` y `bitmap_intro_wait_space` y ANTES de que el nodo Music arranque la pista.
- **No hay llamadas a mitad de sala.** `bitmap_tfx_*` solo se llama desde `bitmap_tfx_transition_asm`/`emitScreen5TfxCall`: la intro de arranque y los nodos del dispatcher.
- **Único peligro real:** los datos residentes en `#8000-#9FFF` quedan ocultos mientras el banco tfx está en P2. El motor de relleno solo lee su tabla (irá en el mismo banco) y la pila → moverlo es seguro.
  El motor de paleta lee `screen5_bitmap_palette_data` y `bitmap_intro_sceneN_palette`, que en proyectos grandes caen en #8000-#9FFF → NO se mueve en esta tarea.

## 2. Inventario

| Pieza | Dónde se emite | Residente hoy | ¿Se mueve? |
|---|---|---|---|
| `bitmap_tfx_wait_ce/hmmv/play/rect_tiles` | `screen5TransitionEngine.ts:96-389`; se inserta en `:19473-19480` del generador bitmap-room y se coloca en `:19789` | 385 B | **Sí** |
| `bitmap_tfx_table_N` | `Screen5TfxDataPool.fillTableLabel/emitData` (engine.ts `:678-712`); plan/codificación `msx2TransitionPatterns.ts:513/633`; colocación `:19522/:19791` | 25-1.959 B | **Sí** |
| `bitmap_tfx_pal_*` + `bitmap_tfx_solid_*` | engine.ts `:392-656` | 208 + 32 por paleta | No |
| `bitmap_tfx_world_palette_ptr` | `:19481-19520` | 4 B (14 multimundo) | No |
| `bitmap_flow_wait_vblank` | `msx2BitmapFlowTextGenerator.ts:88-133` | 18 B (compartida con menús) | No |
| `BITMAP_INTRO_EFFECT_CALLS` / `bitmap_intro_*` | `:779-786`, `:1589-1866` | fill_rect 46, cls 14, wipes antiguos < 100 | **No** (`run_bitmap_intro` mapea bancos de datos y tiene que ser residente; ahorraría < 100 B) |

Liberado por efecto en test719 (hoy → después; el residente restante ≈ 48 B: llamada y espera 14, `jp` 3, init adelantado 5, `world_palette_ptr` 4, trampolines 22):
vertical 738→~48 (≈690), horizontal 683 (≈635), mirror 702 (≈654), blinds 458 (≈410), pattern 498 (≈450), wipe 578 (≈530),
**diagonal 1.343 (≈1.295; quedan ≈1.072 libres)**, **iris 2.370 (≈2.322)**, cls/fade_to_black sin cambio (rutinas antiguas sin motor).

## 3. Sitios que llaman al motor

| Sitio | P2/P3 al entrar | Música | Página / estado |
|---|---|---|---|
| A. `run_bitmap_intro`: transición de escena consumida (`:1517-1543`) y entrada `fade_in` (`:1559-1565`) | 2/3 | Init hecho (adelantado, `:19470`), ninguna pista suena aún; las esperas SÍ llaman a `music_update` | DE=0 fijo; R#15=0, R#17=32 al salir |
| B. Dispatcher `case 'Transition'` (`:989-1012`): tras Music, SubMenu, Intro o regreso de WorldLink | 2/3 (invariante a **medir**) | Sí, si antes hubo Music; hoy se tickea vía `bitmap_flow_wait_vblank` | DE = `bitmap_displayed_page`&1 × 256 |
| C. Efectos antiguos sin parámetros (`:1013-1029`) | — | No tickean | Sin cambio |

Todo corre con DI. P3 solo cambia dentro de `music_update` (SCC lo restaura a 3; `sccSoundGenerator.ts:3950-3956`). `music_update` mueve P2: PT3 lo fuerza a 2; SCC mapea #3F y vuelve al espejo `mapper_bank_p2_current`.

## 4. Diseño

**Módulo nuevo `msx2BitmapTfxBankGenerator.ts`**, copia del patrón de `buildBitmapTransitionFx` (`msx2BitmapTransitionFxGenerator.ts` ~`:200-291`).
- Banco `BITMAP_TFX_CODE_BANK`: el siguiente tras los bancos de FX/Intro/música, saltando los de `(b&#3F)==#3F`. Contenido en orden: `org #8000`; el motor con
  `generateScreen5TfxRuntime({prefix:'bitmap_tfxb', interrupts:false, fill:true, palette:false, frameWaitAsm:'    call bitmap_tfx_frame_wait'})` (misma fuente);
  `pool.emitFillTables()`; `BITMAP_TFX_CODE_BANK_USED_END:`; `ds #A000-$,#FF`.
- Parte residente de 22 B, colocada en `INTRO_RESIDENT_MARKER` (junto a `bitmap_room_restore_resident_banks`, ~#56xx). Los sitios llamadores NO cambian:

```
bitmap_tfx_play:          ; HL=tabla (#8000+ del banco tfx), DE=offset Y
    ld a, BITMAP_TFX_CODE_BANK      ; DESTROYS AF,BC,DE,HL  PRESERVES IX,IY
    call mapper_set_bank_p2
    call bitmap_tfxb_play
    jp bitmap_room_restore_resident_banks   ; sale P2=2,P3=3,R#15=0,R#17=32
bitmap_tfx_frame_wait:    ; solo desde el banco. DESTROYS AF,BC  PRESERVES DE,HL,IX,IY
    call bitmap_room_restore_resident_banks ; el frame wait puede vivir en #8000-#9FFF
    call bitmap_flow_wait_vblank            ; (bitmap_wait_vblank sin música)
bitmap_tfx_frame_wait_done:
    ld a, BITMAP_TFX_CODE_BANK              ; la música deja P2=2/espejo
    jp mapper_set_bank_p2
bitmap_tfx_resident_end:
    if bitmap_tfx_resident_end > #8000
    ds -1
    endif
```
(Mejora el patrón de la Intro: restaura P2=2 ANTES de la música, así el driver SCC ve P2 igual que su espejo y la espera puede vivir en cualquier sitio.)

- RAM: ninguna. Pila: +4 B. Sobrecoste ≈150 T-states por llamada y por frame (0,3 % de un frame).
- `Screen5TfxDataPool` se parte en `emitFillTables()` y `emitSolidPalettes()`; `emitData()` NO se toca (lo usan `gf_tfx` y `gen_engine_test`). Opción `waitCe` (def. `true`) para no emitir un `wait_ce` muerto en la parte residente de paleta.
- **Orden de generación:** el pool se llena en `:19063` y `:19446`, pero el runtime con el marcador se construye en `:18986`, el informe de bancos en `:19332` y el empalme en `:19365`.
  Mover el informe y el empalme detrás de `:19461` (son cadenas puras). Marcador: emitirlo siempre y, si no hay contenido, quitar exactamente `\n${MARKER}\n` para que el ASM salga idéntico.
- **Condición de emisión:** `isKonamiMegaRom && pool.usesFill`. Con ROM simple de 32 KB todo queda igual que hoy.
- **Guardas:** pre-chequeo en TS (tablas + 400 B > 8.192 → error claro que sugiera un bloque mayor); `ds #A000-$` y `ds -1` en Glass. Un solo banco: caben ~7,8 KB de tablas (p. ej. iris diamante bloque 4 = 6,5 KB).

## 5. Verificación (lo más importante; que NO se auto-valide)

**(a) ROM idéntica sin motor.** El árbol tiene sin commit el trabajo de Transition FX (F0-F3), así que una worktree de HEAD NO sirve de referencia.
En F0, sobre el árbol actual sin tocar: `node scripts/check_generator_output_identical.mjs --rom` SIN `--record` (para no tocar el `baseline.json` versionado, desfasado en 5 casos bitmap-room: su rojo se ignora).
Copiar `server/temp/genbaseline/current/` y el log con los sha de las ROM a `test/msx2-transition-fx/out/tfxbank_ref/genbaseline/`. Tras el cambio: misma orden, `diff -rq` vacío y mismos sha de ROM.
Ninguno de los 13 fixtures usa el motor en MegaROM (comprobado) → deben salir idénticos. Añadir comparación antes/después de `bitmap_intro_test` con un patrón en simple32k: ASM idéntico.

**(b) Paridad con transición.** Script nuevo `scripts/check_msx2_tfx_bank_parity.mjs`: compara cada par ROM referencia / ROM nueva en OpenMSX
(`-machine C-BIOS_MSX2+_JP -cart X -romtype KonamiSCC` — **KonamiSCC, no `konami`**, como el smoke de FX; `set throttle off`).
- Breakpoint en `bitmap_tfx_play` (residente en ambas). Comprobación de instrumento: dirección < #8000. Leer la dirección de retorno de la pila y poner otro breakpoint allí (también < #8000).
  Registrar P2/P3 comparando 16 B de #8000 y #A000 con los bancos 2/3 del fichero ROM (antes, comprobar que las firmas de los bancos difieren).
- Muestras por paso: ROM de referencia: `bitmap_tfx_play_wait+4` (comprobar que el opcode es #C1); ROM nueva: `bitmap_tfx_frame_wait_done`. En cada una: volcar la página visible (27.136 B en `bitmap_displayed_page`×32768), paleta, registros PSG, bit CE de S#2 y contador de frames (`after frame`).
- Al volver, comparar: VRAM, paleta, R#0-R#46, SP equilibrado, IX/IY, P2/P3 = 2/3 y nº de llamadas a `music_update`.
- Oráculo independiente: la lista de HMMV de la ROM de referencia (breakpoint en `bitmap_tfx_hmmv`, residente) debe coincidir con `buildScreen5FillPlan` expandido; al final las filas 0-211 valen el byte de relleno. Tolerancia de frames: 0.
- Casos (generados en memoria por `scripts/build_tfx_bank_parity_fixtures.mjs` a partir de fixtures versionados): A arranque con `bitmap_intro_test` (MegaROM); B arranque con música (derivado de `nuts_torchoff`, PT3, como `music_trans`);
  C dispatcher con PT3 sonando (Start→Music→Transition→WorldLink→End); D dispatcher tras partida (WorldLink→Transition→End, escribiendo `bitmap_gameflow_exit_flag` desde TCL).
  En C: los 9 efectos (los 8 de test719 + iris) y `palette_fade_out` (mezcla paleta residente con tabla cls en banco). En A, B y D: diagonal, blinds y wipe.

**(c) Música.** En B y C: `music_update` se llama una vez por espera; la secuencia de registros PSG es idéntica entre ROMs; tras el efecto se llega al nodo siguiente y los PSG siguen cambiando. Buscar un fixture SCC versionado; si no hay, anotarlo como hueco.

**(d) test719.** Con la diagonal compila y deja ≈1.072 B libres (aserción ≥ 1.000). Sin el nodo, la ROM es idéntica a la de referencia (`cmp`). Con cada uno de los 8 efectos: libres ≈ 1.072. En OpenMSX hasta `bitmap_intro_run`: página 0 llena de 0x00 y P2/P3 = 2/3.

**(e) Mapa de bancos.** Tipo nuevo `'tfx-code'`: en `Screen5BankKind` (`utils/msx2Screen5MemoryBudget.ts:27`), etiqueta «Transiciones (código)» en `components/layout/Msx2MegaRomBankMap.tsx` (~`:9-18`), y entrada con `endLabel: BITMAP_TFX_CODE_BANK_USED_END`.
En `scripts/check_msx2_megarom_bank_map.ts`: aserción de lógica pura y `compileAndCheck('Transition engine', SMALL_FIXTURE, […'tfx-code'], addTfxNode)`.

**(f) Sabotajes (cada uno debe poner rojo):** 1) frame wait con `ret` sin re-mapear el banco → cuelgue/timeout; 2) trampolín con `ret` en vez de `jp restore` → falla la comprobación de P2; 3) `BITMAP_TFX_CODE_BANK EQU n+1` → VRAM difiere;
4) alterar un byte de una tabla → VRAM del paso k difiere; 5) espera que llama a `bitmap_wait_vblank` con música → 0 llamadas a `music_update`; 6) trampolín por encima de #8000 → salta el `ds -1`; 7) diagonal con bloque 2 (54 KB) → error en TS o Glass;
8) marcador vacío que deja una línea → `diff -rq` no vacío; 9) `endLabel` equivocada → falla el contrato del mapa; 10) referencia frente a referencia → verde.
Además actualizar las regex de `scripts/check_msx2_screen5_transitions.mjs:~210` y `scripts/check_msx2_gameflow_menu_music.mjs:~200-204` (hoy validan `call bitmap_wait_vblank`/`call bitmap_flow_wait_vblank` dentro del motor). `check_tfx_engine.py` debe seguir verde (la fuente del motor no cambia).

## 6. Fases

- **F0 (sola, antes de tocar nada).** Crear `scripts/build_tfx_bank_parity_fixtures.mjs` y `scripts/build_tfx_bank_reference.mjs` (mutan el JSON en memoria; nunca copian los 152 MB). Generar en `test/msx2-transition-fx/out/tfxbank_ref/`: ASM/ROM/SYM de los casos A-D;
  test719 sin diagonal y con cada uno de los 8 efectos (borrar los ASM grandes, conservar ROM y SYM); instantáneas de genbaseline; `manifest.json` con HEAD y sha256 de `git diff HEAD --binary`. Aceptación: todo compila, las cifras de presupuesto cuadran con §2 y la referencia contra sí misma sale verde.
- **F1 (generador).** Ficheros: `screen5TransitionEngine.ts`, módulo nuevo y `msx2Screen5BitmapRoomGenerator.ts`. Aceptación: tsc limpio; (a) idéntica; contrato de transiciones verde con regex nuevas;
  en el `.sym`: `bitmap_tfx_play` y `bitmap_tfx_frame_wait` < #8000, `bitmap_tfxb_*` dentro del banco, ninguna `bitmap_tfx_table_*` en #4000-#BFFF.
- **F2 (en paralelo con F1 contra el contrato acordado).** Mapa de bancos (e).
- **F3 (en paralelo con F1).** Script de paridad desarrollado contra las ROMs de referencia: referencia contra sí misma = verde; sabotajes parcheando la ROM = rojos.
- **F4 (integración).** (b)-(f) completos sobre las ROMs nuevas; actualizar `ai/LESSONS_LEARNED.md`, la tabla de clobbers de `ai/ASM_GUIDELINES.md` y las memorias.

## 7. Decisiones tomadas (Jordi pidió «mueve el motor de transiciones a un banco»)
1. Motor de paleta (208 B) **se queda residente** (moverlo exige copiar a RAM las paletas que viven en #8000-#9FFF y no hay RAM libre garantizada: #E600/#E700 dependen de Intro y FX).
2. **Banco propio `tfx-code`** (+1 banco; en proyectos pequeños con transición puede subir el relleno de la ROM, p. ej. 17 → 32 bancos).
3. Tablas que no caben en un banco (diagonal con bloque 2 o 4: 54 y 13,7 KB): **error claro al exportar** en el MVP; más adelante varios bancos con el motor replicado (385 B por banco). No comprimir la diagonal ahora.
4. **Sin commit:** la referencia «antes» se toma del árbol sucio y se guarda con manifiesto (HEAD + sha256 del diff).

## 8. Estado de ejecución

**F1 (generador) + F2 (mapa de bancos): HECHAS (2026-10-05), sin commit.** Detalle de lo medido al final de esta sección; qué queda: F3 (script de paridad, otro agente) y F4.

Ficheros: `utils/msxGenerator/generators/msx2/msx2BitmapTfxBankGenerator.ts` (nuevo: banco, trampolines, guardas, pre-chequeo TS), `screen5TransitionEngine.ts`
(opción `waitCe`; `Screen5TfxDataPool.emitFillTables()/emitSolidPalettes()/fillTableBytes/describeFillTables()`; `emitData()` y la salida por defecto de
`generateScreen5TfxRuntime` idénticas, comprobado con 16 combinaciones contra el HEAD), `msx2Screen5BitmapRoomGenerator.ts` (marcador siempre emitido y retirado si
nada va allí; informe de bancos y empalme movidos tras el pool completo; condición `isKonamiMegaRom && pool.usesFill`), `utils/msx2Screen5MemoryBudget.ts` y
`components/layout/Msx2MegaRomBankMap.tsx` (tipo `tfx-code`, «Transiciones (código)»), `scripts/check_msx2_megarom_bank_map.ts`, `scripts/check_msx2_screen5_transitions.mjs`,
`scripts/check_msx2_gameflow_menu_music.mjs` (regex nuevas) y `scripts/check_msx2_tfx_bank_smoke.mjs` (nuevo: humo OpenMSX de las ROM A-D, antes y después).
Además: `scripts/build_tfx_bank_reference.mjs --banked` (tabla de libres esperada de una ROM «después» y sondeo con los símbolos nuevos).

**Cifras reales (medidas, no estimadas)**
- Banco `BITMAP_TFX_CODE_BANK` (el siguiente tras música/Intro/FX, saltando `(b&#3F)==#3F`): jugador 385 B (`wait_ce` 24 + `hmmv` 49 + `play` 133 + `rect_tiles` 179, exactamente lo del plan)
  + tablas. `BITMAP_TFX_CODE_BYTES_ESTIMATE = 400`; el humo falla si Glass lo supera. Un banco admite 7.792 B de tablas: iris diamante bloque 4 (6.543 B) solo cabe; dos iris de bloque 4
  (6.543 + 4.679) dan el error TS «the fill tables … need 11222 bytes but the transition engine bank has 7792 free …»; sin ese pre-chequeo, Glass da `Negative initial size: -3415` (= 11.222 + 385 − 8.192).
- Trampolines residentes: **22 B** (`bitmap_tfx_play` #5077 → `bitmap_tfx_resident_end` #508D en test719), con `ds -1` si cruzan #8000.
- test719 (libres en la ventana residente, medidos con `build_tfx_bank_reference.mjs` y con `measure_bitmap_rom_budget.mjs` sobre el JSON real): **1.072 B con cada uno de los 8 efectos, la diagonal
  (tabla 932 B → banco 1.317 B) y el iris (tabla 1.959 B → banco 2.344 B)**; esperado ≈1.072 (1.120 − 48 B residuales = 22 trampolines + 14 llamada y espera + 3 `jp` + 5 init adelantado + 4 `world_palette_ptr`). Hoy → después: vertical 382, horizontal 437,
  mirror 418, blinds 662, pattern 622, wipe 542, diagonal «no cabe (−223)», iris «no cabe (−1.250)» → todos 1.072. cls (1.109) y fade_to_black (1.068) no cambian (rutinas antiguas, ROM idéntica).
  La ROM real de test719 compila (245.760 B = 30 bancos) y es idéntica byte a byte a `T719_diagonal`. `T719_bridged` es idéntica a la referencia.
- Una ROM con transición de relleno en MegaROM gana UN banco (26 de 35 artefactos); solo cambia el tamaño padded a 2^n en `C_scc_wipe` (8 → 16 bancos); test719 29 → 30 (padded 32 en ambos).

**Verificación (F1/F2)**
- (a) `--compare tfxbank_ref tfxbank_new`: **ASM, ROM y SYM idénticos** en `A_control_legacy`, `A_simple32k_pattern`, `C_cls`, `C_fade_to_black`, `T719_bridged`, `T719_cls`, `T719_fade_to_black`;
  genbaseline `--rom` sin `--record`: los 13 casos con el mismo sha de ASM y de ROM, `diff -rq` de `genbaseline/current` vacío. Cambian solo los 28 artefactos con motor (esperado).
- Humo OpenMSX (`scripts/check_msx2_tfx_bank_smoke.mjs`, solo breakpoints/RAM/VRAM): 21 ROM A-D con motor, 507/507 checks; 8 variantes test719 (bancos 2 y 3 distintos: detecta un cruce 2↔3), 184/184,
  incluida «VRAM página 0 filas 0-211 = #00 tras la transición» y «se llega a `bitmap_intro_run`». La ROM de referencia pasa los checks comunes (273/273 en A-D, 66/66 en T719). Parity de F3 contra estas ROM: 23/23.
- Suites existentes verdes: `test:msx2-transition-fx` (46), `-fx-export`, `-fx-room-change`, `-fx-openmsx` (7 variantes), `test:msx2-screen5-transitions` (52), `test:msx2-gameflow-menu-music` (estático + OpenMSX),
  `test:msx2-megarom-bank-map` (con el caso nuevo «Transition engine»). `check_tfx_engine.py` no se pudo ejecutar (falta el paquete `z80`): su insumo, `generateScreen5TfxRuntime`, sale idéntico en 16 combinaciones
  frente al HEAD (prueba directa).
- Sabotajes en rojo (restaurados): frame wait con `ret` sin re-mapear → cuelgue (humo) y `static-layout`+`engine-reached` (parity); trampolín con `ret` → «P2 = banco del motor al volver»; `BITMAP_TFX_CODE_BANK` +1 → cuelgue;
  trampolín sobre #8000 → Glass `Negative initial size: -1` (el `ds -1`); pre-chequeo TS quitado → Glass `Negative initial size: -3415`; marcador vacío con una línea de más → 5 casos de genbaseline con ASM distinto;
  `endLabel` equivocada → `bank 9 (tfx-code) was not measured`; espera ausente / rutina de espera equivocada con música / espera de paleta sin tick → rojo en las dos regex nuevas; un byte de tabla → parity `table`.

**Desviaciones y decisiones para Jordi**
1. Criterio del plan «ninguna `bitmap_tfx_table_*` en #4000-#BFFF en el .sym»: imposible tal cual, Glass lista las etiquetas del banco en #8181 (ventana del banco). Se verifica por bytes: la tabla está en el banco del fichero ROM y no aparece en los 32 KB residentes.
2. Sabotaje 5 «diagonal con bloque 2»: no se puede crear (`pickBlockSize` recorta a [16, 8, 32]); se sustituyó por dos iris de bloque 4. Un bloque más pequeño en el iris (4) sí es editable: su tabla de 4.679-6.543 B es lo que más acerca al límite.
3. `bitmap_tfx_world_palette_ptr` (4-14 B) sigue emitido aunque el proyecto no use paleta: es código muerto en ese caso (§7.1 lo deja residente); quitarlo cuando `!usesPalette` ahorraría 4 B (14 en multimundo) pero cambia lo que la regex de F3 espera. No hecho.
4. `bitmap_tfx_frame_wait` restaura P2/P3 aunque la ROM no tenga música (8 B de más, la rutina de espera puede estar en #8000+: en test719 `bitmap_flow_wait_vblank` está en #A70F). Se mantuvo uniforme por el §4 y porque F3 muestrea en `bitmap_tfx_frame_wait_done`.
Herramientas locales de apoyo: ninguna que quede en el árbol (el tsc acotado se hizo con un `tsconfig` temporal sobre los ficheros tocados).

## 9. Estado F3 (script de paridad)

**F3 HECHA (2026-10-05), sin commit.** `scripts/check_msx2_tfx_bank_parity.mjs` (+ `npm run test:msx2-tfx-bank-parity`; `--help` trae el uso exacto y la lista de checks).
Compara 21 casos (A-D, SCC, palette_fade_out) y 2 virtuales `D_*_page1` (misma ROM que D, pero el script sube `bitmap_displayed_page` para que el motor reciba DE=256)
entre `tfxbank_ref` y `tfxbank_new`, en OpenMSX (`-romtype KonamiSCC`; simple32k sin `-romtype`), solo por VRAM/paleta/registros/RAM/CPU, tolerancia 0 bytes y 0 frames.
No cubre las variantes T719 (su presentación espera tecla y el motor de referencia está en #A754, fuera de la regla «< #8000»).

- **Instrumento:** bp en `bitmap_tfx_play` (< #8000 en las dos ROM), dirección de retorno leída de la pila; muestra por espera en `bitmap_tfx_play_wait+4` (ref, opcode #C1 verificado)
  o `bitmap_tfx_frame_wait_done` (nueva, opcode #3E); bp en `bitmap_tfx[b]_hmmv`, `music_update` y en el RET de `wait_ce` (para «asentar» las muestras tomadas con el
  motor de comandos ocupado: se relee la VRAM en la siguiente salida de wait_ce, sin HMMV emitido entre medias). P2/P3 se miden con el debuggable `romblocks` de OpenMSX
  (verdad de hardware) y con una firma de 128 B de cada página contra los bancos del fichero ROM. En los fixtures pequeños los bancos 1-3 son todo #FF: la firma no
  distingue 2 de 3, y el script lo anota y se fía de `romblocks` (mejor que la firma que pedía el plan).
- **Oráculo que no sale de la ROM:** `buildScreen5FillPlan`/`encodeScreen5FillPlan` de `utils/msx2TransitionPatterns.ts` (import directo con node 22; cae a `npx tsx` si no),
  expandido como `bitmap_tfx_rect_tiles`: tabla, lista de HMMV, HMMV emitidos antes de cada espera, VRAM tras cada paso simulada desde la página de entrada y relleno final.
- **Verificado (2026-10-05):** `--self` 23/23 verde en 6-7 s (también con --jobs 2..16: determinista). `--sabotage all`: 31 mutaciones se comportan como se espera (29 ponen rojo el
  check previsto, 2 `jitter*` benignas, +160 y +1600 T-states por frame, siguen verdes). Las `nw_*` parchean el ASM de `tfxbank_new` (items 1-5 de 5(f) + banco sin restaurar antes de la música).
  Un ROM «banco» hecho a mano con el diseño de §4 (descartado, ya existe el de F1) pasó 20/20 a la primera y las mismas mutaciones lo pusieron rojo.
- **Contra las ROM de F1 (`tfxbank_new` de las 20:23):** 23/23 PASS, mismas muestras y mismos frames. Pendiente para F4: repetirlo con la ROM final, y los sabotajes de generador
  de 5(f) que no son de ASM (6 `ds -1`, 7 diagonal bloque 2, 8 marcador vacío, 9 `endLabel`).

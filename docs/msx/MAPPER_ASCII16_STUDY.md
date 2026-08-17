# Estudio: mapper ASCII16 en Mideas (2026-08-16)

Viabilidad de usar el mapper **ASCII 16 KB** en Mideas: características, techo de
tamaño, dificultades de implementación y convivencia con el Konami SCC actual.

Alcance: estudio sobre código y documentación del repo. **No se ha compilado ni
ejecutado nada** para producir este documento.

Relacionado: [`MAPPER_KONAMI_SCC_2MB.md`](MAPPER_KONAMI_SCC_2MB.md),
[`../msx-megarom-roadmap.md`](../msx-megarom-roadmap.md).

---

## 1. Punto de partida: qué existe ya

ASCII16 **no se implementa desde cero**. Está hecho y validado en la ruta
MSX1 / SCREEN 2, y bloqueado a propósito en MSX2.

| Pieza | Estado | Fichero |
|---|---|---|
| Layout de registros ASCII16 | Hecho | `utils/msxGenerator/generators/mapperGenerator.ts:156` |
| Boot / init de bancos estáticos | Hecho | `utils/msxGenerator/generators/headerGenerator.ts:56` |
| Puente far-call en RAM | Hecho | `utils/msxGenerator/generators/unifiedGenerator.ts:1560` |
| Config de ventana de datos 16 KB | Hecho | `utils/msxGenerator/generators/mapperWindowUtils.ts:29` |
| Packer, artefactos y validadores | Hecho | `utils/msxGenerator/utils/bankPacker.ts`, `scripts/build_mideas_unified_rom.py` |
| Smoke OpenMSX con movimiento | PASS: `joc51`, `joc_tales_9`, `patoantic248`, `joc60` | `docs/msx-megarom-roadmap.md` |
| **MSX2 SCREEN 4 / SCREEN 5 bitmap** | **Rechazado a propósito** | `docs/msx-megarom-roadmap.md:728`, `components/modals/CodeExportModal.tsx:2048` |

Por tanto el trabajo real que queda es **llevar ASCII16 al backend MSX2 SCREEN 5
bitmap**, que hoy es Konami SCC puro.

---

## 2. Características del ASCII16

Dos ventanas conmutables de 16 KB, dos registros:

| Ventana | Registro (rango de escritura) | Estado al reset |
|---|---|---|
| `#4000-#7FFF` | `#6000-#67FF` | banco 0 |
| `#8000-#BFFF` | `#7000-#77FF` | banco 0 |

- Registro de banco de **8 bits** → 256 bancos × 16 KB.
- **No hay banco fijo.** Al reset ambas ventanas muestran el banco 0, así que el
  boot debe escribir `#7000` antes de ejecutar nada por encima de `#8000`.
- **No hay SCC.** Es un mapper de ASCII, sin chip de sonido. (Ver §7.)
- Variante `ASCII16-2` / `ASCII16-SRAM`: añade SRAM (2 u 8 KB). Es la única vía
  estándar a **partidas guardadas persistentes**; el Konami SCC no tiene SRAM.
- No existe el gotcha del banco `#3F`: se recuperan los 4 bancos que hoy quedan
  reservados como padding `#FF`.

---

## 3. Techo de tamaño del MegaROM

| Mapper | Tamaño de banco | Registro | Máximo |
|---|---|---|---|
| Konami SCC (actual en Mideas) | 8 KB | 8 bits | **2 MB** |
| ASCII8 | 8 KB | 8 bits | 2 MB |
| **ASCII16** | 16 KB | 8 bits | **4 MB** |
| KUC (Konami Ultimate Collection) | 8 KB + A20/A21 | 8+2 bits | 8 MB |

ASCII16 duplica el techo actual hasta **4 MB**.

Salvedad: el número de banco se enmascara al tamaño real de la ROM, así que hay
que emitir **potencias de dos** (64 KB … 4 MB). El builder ya hace ese padding
(`_next_power_of_two` en `scripts/build_mideas_unified_rom.py:2724`, con mínimo
de 4 segmentos = 64 KB para `ascii16`).

**Contexto importante**: los ROMs bitmap actuales rondan los 256 KB sobre un
techo de 2 MB. El tamaño no es el recurso escaso; lo es la ventana residente.

---

## 4. Dificultades genéricas (ya resueltas en MSX1, reutilizables)

- **No se puede conmutar la página desde la que se ejecuta.** Cambiar
  `#4000-#7FFF` mientras corres ahí te auto-desmapea a media rutina. La solución
  ya escrita y probada: copiar un puente diminuto a RAM durante el boot
  (`install_ascii16_far_call_ram`), con variantes normal / preserve-A /
  resident-bridge / tail-jump / entrada y salida de IRQ. Es el trabajo caro y ya
  está hecho.
- **La IRQ.** El hook H.TIMI puede entrar con una overlay mapeada; hay que forzar
  banco 0 en la entrada y restaurar en la salida
  (`ASCII16_IRQ_ENTRY_RAM` / `ASCII16_IRQ_EXIT_RAM`).
- **Llamadas overlay → overlay.** Con granularidad de 16 KB, un `call` directo de
  una overlay de página baja a otra es un fallo duro. El pipeline MSX1 ya lo
  detecta (`farToFarDirectCallCount`) y bloquea el smoke.

---

## 5. Dificultades específicas del backend SCREEN 5 bitmap

### 5.1 La granularidad de swap pasa de 8 KB a 16 KB

Es el problema serio. Layout actual con Konami SCC:

```
#4000-#7FFF  bancos 0-1   siempre visibles  (zona segura para lectores)
#8000-#9FFF  banco 2      código residente, se conmuta para leer datos
#A000-#BFFF  banco 3      código residente, se conmuta para música
```

Con ASCII16, `#8000-#BFFF` es **una sola página**: cualquier lectura de datos
borra los 16 KB de golpe. Se pierde la posibilidad de mantener `#A000-#BFFF`
pinchado mientras se lee por `#8000`.

El total residente sigue siendo 32 KB, pero el conjunto de código que
obligatoriamente debe vivir por debajo de `#8000` crece. Y el estado medido
(`test234.json`: **24 bytes libres de 32768**) no deja margen para reorganizar
sin sacar bloques a bancos primero.

### 5.2 Se pierde el SCC

Es el coste más alto en inversión hundida: `sccSoundGenerator.ts`, el tracker
dual PSG+SCC (fases 1-4 más música multibanco), 28 instrumentos en 7 familias,
el editor de waveforms con vibrato y la paridad de preview en PC. Un cartucho
ASCII16 estándar no lleva ese chip; quedaría solo PSG. (Matices en §7.)

### 5.3 El esquema de bancos de música se rompe

Los chunks de música se emiten con `org #A000` y se mapean en P3
(`msx2Screen5BitmapRoomGenerator.ts:2887`). En ASCII16 no existe un P3
independiente: hay que rediseñar a chunks de 16 KB o compartir la página alta
con los datos.

### 5.4 Escrituras de mapper hardcodeadas

El generador bitmap emite literales `ld (#5000),a`, `ld (#7000),a`,
`ld (#9000),a`, `ld (#B000),a` (`msx2Screen5BitmapRoomGenerator.ts:3555`, `:3589`,
`:3620`). Bajo ASCII16, `#7000` significa otra cosa (conmuta la página alta) y
`#9000` / `#B000` no significan nada. Hay que parametrizarlas por target, y
además cambia la topología de ventanas, no solo la dirección del registro.

### 5.5 El packer

`packBitmapRoomDataBanks` / `formatBankedDataBanks` asumen zonas de 8 KB
(`org #8000`, `ds`, `org PHYS_START + #2000`) y reservan los bancos `#3F`
(`isSccWindowBank`). Para ASCII16: zonas de 16 KB, `+ #4000`, y fuera la lógica
de bancos reservados. Es mecánico.

### 5.6 Duplicación de generadores

El mapper MSX1 vive en `mapperGenerator.ts`; el bitmap SCREEN 5 emite sus propias
rutinas inline sin relación con aquél. Deuda ya anotada en el plan de refactor de
backends SCREEN 5.

---

## 6. Convivencia con el Konami SCC

**En el mismo ROM: imposible.** El mapper es una propiedad del cartucho físico,
no del binario. Y hay conflicto directo de direcciones: `#7000` es el registro de
P1 en Konami SCC y el de la página alta en ASCII16. Una misma escritura significa
cosas incompatibles.

**Como targets alternativos del mismo generador: perfectamente viable, y es el
diseño que Mideas ya tiene** (`--target-format konami|ascii8|ascii16`, selector en
la UI, artefactos y validadores parametrizados por mapper). Para extenderlo al
backend bitmap harían falta tres cosas:

1. Un `MapperWindowConfig` propio de SCREEN 5 que describa la **topología de
   ventanas**, no solo la dirección del registro.
2. Que todas las escrituras pasen por `mapper_set_bank_pX` generado según target.
   Es la regla dura que el pipeline MSX1 ya valida: rechaza escrituras dispersas
   a registros de mapper.
3. Una política de audio por target: SCC solo disponible en Konami SCC, ASCII16
   fuerza PSG.

**Si el objetivo es superar los 2 MB manteniendo el SCC**, el camino barato ya
está documentado: **KUC** es un superconjunto del Konami SCC (al reset se comporta
idéntico), llega a 8 MB, y el ROM de 2 MB actual ya funciona en ese hardware. Ver
[`MAPPER_KONAMI_SCC_2MB.md`](MAPPER_KONAMI_SCC_2MB.md).

---

## 7. Addendum: el caso Pampas & Selene (pendiente de verificar)

Reporte de segunda mano (2026-08-16): *Pampas & Selene* (UnEpic_Fran) usaría
ASCII16 con algún truco para conservar el SCC.

**Esto contradice la investigación previa de este repo.**
[`MAPPER_KONAMI_SCC_2MB.md`](MAPPER_KONAMI_SCC_2MB.md) (2026-07-13, rama
`mapper_2m`) concluyó que el cartucho **físico** usa Konami SCC estándar de 2 MB
—por eso el volcado funciona en Carnivore2— y que el KUC solo aparece en las
versiones digitales/emulador. Esa conclusión es la base del backend actual.

Ninguna de las dos versiones está verificada en esta sesión. Posibles lecturas,
sin resolver:

1. **La investigación previa es correcta y el reporte está garbleado.** La lectura
   más probable: el juego usa bancos *lógicos* de 16 KB (pares de bancos de 8 KB)
   sobre hardware Konami SCC. Contado de segunda mano, "banca de 16 K" se
   convierte fácilmente en "usa ASCII16".
2. **El reporte es correcto y hay un cartucho con PLD a medida.** Es
   físicamente posible: el mapper y el chip de sonido son piezas independientes
   dentro del cartucho. Una PLD puede decodificar banking ASCII16 y exponer a la
   vez un SCC. El coste de diseño es concreto: el SCC vive en `#9800-#9FFF`, o sea
   justo en medio de la ventana de datos de 16 KB de ASCII16, abriendo un agujero
   de 2 KB que el packer tendría que esquivar en **cada** banco de datos —mucho
   peor que los 4 bancos reservados de hoy.
3. **Confusión con el hardware anfitrión.** En un MegaFlashROM SCC+ SD o un
   Carnivore2 el SCC es del cartucho de flash, no del ROM cargado. Un ROM ASCII16
   ejecutándose en esa placa puede tener SCC accesible sin que el ROM "use el
   mapper ASCII16 con SCC" en ningún sentido reproducible en un cartucho propio.

**Nota importante**: incluso si la lectura 2 fuera cierta, no cambia la
recomendación de §8. Un mapper a medida no es un target estándar; no lo emula
openMSX con un `-romtype` y no lo fabrica nadie en serie. Mideas necesita ROMs
que arranquen en hardware y emuladores existentes.

**Cómo cerrarlo empíricamente** (si se quiere invertir el tiempo):

- Cargar el ROM en openMSX sin `-romtype` y leer qué mapper autodetecta.
- Buscar en el binario escrituras a `#9800-#987F` (waveforms SCC) y a
  `#6000-#67FF` / `#7000-#77FF` (registros ASCII16) frente a
  `#5000/#7000/#9000/#B000` (Konami SCC).
- Preguntar directamente al autor. Es lo más barato y lo más fiable.

---

## 8. Recomendación

**No migrar el backend bitmap a ASCII16 ahora.** El balance sale negativo:

- **Ganas**: techo de 4 MB (que no se está usando), 32 KB de bancos reservados
  recuperados (irrelevante sobre 2 MB), y acceso a SRAM si se va a `ASCII16-2`.
- **Pierdes**: el SCC entero, la granularidad fina de swap justo cuando la ventana
  residente está a 24 bytes libres, y el esquema de bancos de música.

Por orden de prioridad:

1. **Nada, si el objetivo era tamaño.** Se está en ~256 KB de 2 MB. Y si se llega
   al techo, KUC cuesta una fracción de cambiar de mapper.
2. **ASCII16-2 como target futuro solo si se quieren save games en SRAM.** Ahí el
   argumento no es el tamaño sino la funcionalidad, y sí justifica sacrificar el
   SCC en una variante de build.
3. **Antes de cualquier mapper nuevo: liberar ventana residente.** Es el cuello
   real y beneficia a todos los targets. Candidatos ya medidos en `test234`:
   `bitmap_enemy_sprite_patterns` (1152 B), `bitmap_room_sprite_colors` +
   `_glowing` (768 B, ojo: lector por frame), `bitmap_flow_font` (472 B),
   `bitmap_end_font` (320 B).
4. **Si aun así se hace**, este es el orden:
   1. Parametrizar las escrituras de mapper del generador bitmap.
   2. `MapperWindowConfig` para SCREEN 5 (topología de ventanas).
   3. Packer de zonas de 16 KB.
   4. Portar el puente RAM desde `unifiedGenerator.ts`.
   5. ROM sintético de estrés de 4 MB reusando el arnés de
      `test/mapper-2m/gen_2mb_stress.py`.
   6. Smoke en OpenMSX con `-romtype ASCII16`.

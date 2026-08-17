# Neon Void Runner — transcripción Basic Pitch → PT3 (AY-3-8910, 3 canales)

Módulos PT3 **reales** (ProTracker 3 / Vortex Tracker II) generados a partir de la
transcripción audio→MIDI de "Neon Void Runner" hecha con Spotify Basic Pitch.

| Fichero | Tamaño | Contenido |
|---|---|---|
| `neon_void_runner.pt3` | 7.669 B | Tema completo: 35 posiciones × 64 filas = 2.240 filas ≈ 224 s |
| `neon_void_runner_loop.pt3` | 2.445 B | Extracto loopable para bucle de juego: 8 posiciones = 32 compases ≈ 51 s, con percusión |

Conversor: [`scripts/basic_pitch_to_pt3.mjs`](../../scripts/basic_pitch_to_pt3.mjs)
Validación: [`scripts/check_pt3_neon_void.mjs`](../../scripts/check_pt3_neon_void.mjs)

---

## 1. Cómo regenerar

```bash
# los dos ficheros
node scripts/basic_pitch_to_pt3.mjs

# sólo uno
node scripts/basic_pitch_to_pt3.mjs --preset completo
node scripts/basic_pitch_to_pt3.mjs --preset loop

# validación obligatoria (sale con código 1 si algo falla)
node scripts/check_pt3_neon_void.mjs
```

Entrada por defecto (no está en el repo, es del usuario):
`C:/Users/salam/Downloads/neon_void_runner_basic_pitch/Neon Void Runner_basic_pitch.csv`
Se puede cambiar con `--csv <ruta>`. Otras opciones: `--out`, `--speed`, `--bpm`.

El conversor necesita `esbuild` (ya es dependencia del repo): lo usa para cargar
`utils/audio/pt3FactoryInstruments.ts` y `components/utils/pt3SampleEngine.ts`, de
modo que los instrumentos salen del código del repo y no de una copia pegada.

> **Aviso**: `components/utils/pt3Serializer.ts` **no** escribe PT3 real (cabecera de
> 100 bytes, sin firma, codificación de patrones inventada). No se usa aquí. El
> encoder de `basic_pitch_to_pt3.mjs` está escrito contra la especificación que
> implementa `components/utils/pt3Parser.ts`.

---

## 2. Tempo y rejilla

El MIDI exportado declara **145 BPM** (meta `FF 51 03` = 413.793 µs/negra), pero ese
valor lo impuso el export, no la música. Barriendo el error medio de cuantización de
los 1.884 onsets únicos del CSV contra una rejilla de semicorcheas (140–152 BPM, paso
0,005) aparece **un solo mínimo, agudo y aislado, en 146,000 BPM**:

| BPM | error medio | onsets dentro de ±20 ms |
|---|---|---|
| 145,0 | 25,29 ms | 40,3 % |
| 145,5 | 25,24 ms | 40,4 % |
| **146,0** | **11,79 ms** | **81,8 %** |
| 146,34 | 25,25 ms | 39,9 % |
| 147,0 | 24,98 ms | 40,4 % |

~25 ms / 40 % es el suelo aleatorio (lo que da cualquier BPM equivocado). Además el
error es plano por tercios de canción (11,94 / 11,62 / 11,80 ms), o sea que **no hay
deriva de tempo**. La autocorrelación de la envolvente de onsets lo confirma: picos en
0,41 / 0,82 / 1,23 s → negra ≈ 0,41 s. Se usa **146,000 BPM**, no el declarado.

La rejilla lleva además un desfase de 61,6 ms, calculado por minimización: Basic Pitch
coloca los tiempos en su propia rejilla de 11,61 ms (hop de 256 muestras a 22.050 Hz)
desplazada medio hop, así que el offset no es cero.

### Speed PT3

Una fila = una semicorchea. Con el tick del replayer a 50 Hz (PAL):

```
BPM = 750 / speed    →   speed 5 = 150 BPM,  speed 6 = 125 BPM
```

146 BPM no es alcanzable con speed entero. Se elige **speed 5** (100 ms/fila, 150 BPM,
**+2,7 %** sobre el tempo medido); speed 6 se iría a −14 %. Como todo se recuantiza a
la rejilla, no hay deriva acumulada: el tema simplemente suena un 2,7 % más rápido.

> **MSX NTSC (60 Hz)**: el equivalente exacto son 100 ms/fila con **speed 6**. Si el
> juego corre a 60 Hz, basta con poner un `6` en el byte 100 del `.pt3`.

---

## 3. Limpieza de la transcripción

De las 2.470 notas del CSV se descartan 316 (12,8 %) y quedan **2.154**:

| Filtro | Notas | Comentario |
|---|---|---|
| Duración < 55 ms (media fila) | **0** | Basic Pitch ya no emite notas tan cortas (mínimo real ≈ 139 ms). El filtro se deja como red de seguridad, pero aquí no elimina nada. |
| Velocity < 30 | 10 | El CSV va de 26 a 89, mediana 54. |
| Armónicos espurios | 306 | Nota que empieza a la vez (±70 ms) que otra, exactamente **+12 o +19** semitonos por encima, y con menos energía (`velocity × duración`): es el 2.º/3.er parcial del mismo sonido, no una nota. |

El filtro de armónicos es el que más trabaja y era necesario: los dos pitches más
frecuentes del CSV son MIDI 48 (C3, 244 veces) y MIDI 50 (D3, 254) — justo una octava
por encima de MIDI 36 (C2) y 38 (D2), que son el bajo real.

**No** se han descartado detecciones aisladas en el registro muy agudo (137 notas
≥ MIDI 84) porque estadísticamente no se distinguen de las buenas (misma velocity y
duración medias). En su lugar se maneja en el reparto de canales (§4).

Tonalidad resultante: **Re menor** (clases de nota por duración total: D, C, A#/Bb, A,
G, F, E dominantes; C#, D#, F#, G#, B residuales).

---

## 4. Reducción a 3 canales PSG

El PSG admite **una nota por canal y fila**. El reparto es por registro, para que cada
voz se quede en su sitio en vez de saltar de canal en canal:

| Canal | Voz | Rango | Notas colocadas (completo / loop) |
|---|---|---|---|
| **A** | Melodía | MIDI ≥ 63 | 633 / 195 |
| **B** | Bajo | MIDI < 48 | 557 / 134 |
| **C** | Armonía (+ percusión en el loop) | MIDI 48–62 | 657 / 161 |

Cuando varias notas caen en el mismo canal y fila (307 colisiones en el tema completo)
se elige:

- **Canal A — continuidad melódica**: puntuación `duración + velocidad − 0,12 × salto`
  respecto a la nota anterior del lead (con memoria de 8 filas). Quedarse siempre con
  la más aguda parece lo natural, pero Basic Pitch cuela parciales sueltos muy arriba
  (p.ej. un único MIDI 93 en todo el tema) y esos ganaban siempre. Medido sobre la
  línea de melodía completa: el salto medio entre notas consecutivas baja de **6,25 a
  5,64 semitonos** y los saltos de octava exacta —la firma del armónico— de **44 a 32**.
- **Canal B — la más grave**, que es la fundamental del bajo.
- **Canal C — la más fuerte** (mayor velocity), que es la que realmente se oye.
- En B y C, antes que nada, gana la nota claramente más larga (> 25 % de diferencia):
  las cortas son residuo de la transcripción.

El corte de cada nota (`===`, note off) se coloca en la fila donde acaba, pero **nunca
más allá de la siguiente nota del mismo canal**, para no matar una nota ya arrancada.

---

## 5. Instrumentos y por qué estos

Seis samples PT3. Los de percusión y el lead se copian **byte a byte** de
`PT3_FACTORY_INSTRUMENTS` (`utils/audio/pt3FactoryInstruments.ts`); los otros dos son
originales, diseñados para este tema. Ninguno contiene datos copiados de módulos
comerciales.

| # | Nombre | Origen | Canal | Por qué |
|---|---|---|---|---|
| 1 | **Mideas Bright Lead** | fábrica | A | Es exactamente un lead de sintetizador: volumen 15 constante y un vibrato de ±5 en el periodo de tono que se repite en bucle desde el paso 0, o sea **sustain infinito con chorus**. Eso es el timbre de plomo brillante y sostenido que lleva la melodía en synthwave. Es el sample 1, que es el que el replayer PT3 selecciona por defecto al arrancar. |
| 2 | **Neon Void Bass** | propio | B | Bajo de sintetizador: ataque con el periodo acortado 40 unidades (el "click" de púa sintética), cuerpo a volumen 15→13 y bucle a partir del paso 4 con un batido de ±1 que da el ligero desafinado del bajo synthwave. `Mideas Pluck Bass` se descartó porque su sustain cae a volumen 10-11: se pierde debajo del lead. |
| 3 | **Neon Void Pad** | propio | C | Apoyo armónico. Volumen medio (10–13) con trémolo lento y desafinado suave de ±2: **se queda por detrás** de la melodía en vez de competir con ella. Refuerza el reparto de volúmenes de canal (§6). |
| 4 | **Mideas Punch Kick** | fábrica | C (loop) | Bombo: ruido en el ataque + barrido de tono descendente. Corto (7 pasos) para no comerse la armonía. |
| 5 | **Mideas Dry Snare** | fábrica | C (loop) | Caja seca: 4 pasos con tono + ruido y luego sólo ruido decayendo. Seca, no de cola larga, que en un canal compartido tapa. |
| 6 | **Mideas Closed Hat** | fábrica | C (loop) | Charles cerrado: 4 pasos de ruido puro, sin tono. Es lo más barato que existe en filas ocupadas por corcheas. |

**No se usan ornaments** más allá del obligatorio ornamento 0 (`[0]`, "sin ornamento",
que el replayer necesita como valor por defecto). Un ornamento de arpegio en el canal C
habría metido alturas que no están en la fuente; el canal C ya lleva armonía transcrita
de verdad. El "chorus" característico va dentro de los propios samples (desafinado de
periodo), no en ornaments.

### Volúmenes de canal

| Canal | Volumen | Motivo |
|---|---|---|
| A (melodía) | 15 | primer plano |
| B (bajo) | 15 | el bajo del AY necesita todo el volumen para oírse |
| C (armonía) | 11 | un escalón por detrás, para que no compita con el lead |
| C (percusión) | 15 | los golpes tienen que cortar |

---

## 6. Percusión (sólo en el loop)

El tema completo es **fiel**: sólo contiene notas transcritas. El extracto de bucle
lleva además una base 4/4 sintética en el canal C, porque un bucle de juego sin batería
suena hueco:

```
fila del compás:  0    2    4    6    8   10   12   14
                bombo hh  caja  hh  bombo hh  caja  hh
```

**Sólo se escribe donde el canal C está libre**: la armonía transcrita siempre tiene
prioridad. De los 256 huecos posibles se colocan **145 golpes** (57 %). Es contenido
añadido, no transcrito, y por eso está detrás de la opción `percusion` del preset.

## 7. Elección del extracto loopable

Compases **16–47** (32 compases = 8 patrones = 512 filas ≈ 51 s). Criterios:

- Es la zona de mayor densidad de notas del tema (28/25/26/17/21/22/20/19 notas por
  compás en 16–23, frente a ~9–15 en la parte final).
- Empieza y acaba en frontera de frase de 4 compases (las frases del tema van de 4 en 4).
- 512 filas es múltiplo exacto de 64, así que no hay patrón a medias.
- En la última fila se emite un note off en los tres canales, para que el empalme del
  bucle no arrastre una nota colgada.

`loopPosition` (byte 102) = 0 en los dos ficheros: el bucle es el módulo entero.

---

## 8. Formato PT3 escrito

Disposición idéntica a la de un `.pt3` real de Vortex Tracker II
(verificado contra `pt3/PT3/CASTLEVA/game over.pt3`):

| Offset | Contenido |
|---|---|
| 0–29 | `Vortex Tracker II 1.0 module: ` (30 chars) |
| 30–61 | título (32, relleno con espacios) |
| 62–65 | ` by ` |
| 66–97 | autor (32) |
| 98 | `#20` |
| 99 | tabla de tonos = **2** (la habitual en módulos PT3 3.x) |
| 100 | speed = **5** |
| 101 | nº de posiciones |
| 102 | posición de loop |
| 103–104 | puntero a la tabla de patrones (16 bits LE) |
| 105–168 | 32 punteros de sample (los no usados a 0, como Vortex) |
| 169–200 | 16 punteros de ornamento |
| 201… | lista de posiciones (índice × 3) + terminador `#FF` |
| … | tabla de patrones (3 punteros de 16 bits por patrón) |
| … | streams de patrón, cuerpos de sample (`loop`, `nº pasos`, pasos × 4 B), ornamentos |

Comandos usados en los streams de patrón (subconjunto deliberadamente mínimo):

```
#D1-#EF   seleccionar sample (comando − #D0)
#C1-#CF   volumen de canal
#50-#AF   nota (termina la fila) — #50 = C-1 = MIDI 24
#C0       note off (termina la fila)
#D0       fila vacía (termina la fila)
#00       fin de patrón
```

Sin efectos (SPCCOM) y sin `#B1` de cadencia: `NoteSkip` vale 1 por defecto, así que
cada fila del stream es una fila del tracker. Los selectores sólo se emiten cuando
cambian, pero el estado se reinicia en cada patrón, así que **cada patrón es
autosuficiente**: no depende de lo que sonara en la posición anterior. Un `#00` no
puede aparecer nunca dentro de un patrón, porque ninguno de los bytes que emitimos
vale 0.

Patrones de **64 filas** (estándar Vortex/PT3 = 4 compases de 4/4 a semicorchea). Ojo:
`constants.ts` define `DEFAULT_PT3_ROWS_PER_PATTERN = 32`, pero el formato PT3 no fija
la longitud del patrón — la marca el terminador `#00` del canal A — y 64 es lo que
usan los módulos reales.

---

## 9. Validación

`node scripts/check_pt3_neon_void.mjs` comprueba, para los dos ficheros:

1. **Determinismo**: el fichero en disco coincide byte a byte con una reconversión.
2. **Parseo** con `parsePT3Module` / `parsePT3File` de `components/utils/pt3Parser.ts`:
   sin excepciones y con `warnings` **vacío**.
3. **Bytes de los samples**: los pasos vuelven idénticos del round-trip.
4. **Round-trip fila a fila**: 6.720 celdas (completo) y 1.536 (loop) comparadas —
   nota, sample efectivo y volumen efectivo de cada canal— contra lo que el conversor
   pretendía escribir. **0 diferencias**.
5. **Cabecera campo a campo** contra `pt3/PT3/CASTLEVA/game over.pt3`, y los mismos
   invariantes estructurales exigidos a los dos ficheros (posiciones múltiplo de 3,
   terminador `#FF`, tabla de patrones justo detrás, punteros de canal dentro del
   fichero, ornamento 0 definido).

### Lo que NO está verificado

- **No se ha reproducido el audio.** No se ha abierto en Vortex Tracker, ni en
  OpenMSX, ni con un reproductor AY externo. Todo lo anterior es validación
  estructural y de round-trip contra el parser del repo.
- El parser de Mideas informa de **0 ornamentos** porque recorre los IDs 1–15 y el
  ornamento 0 no entra en esa lista. Está escrito (el harness lo comprueba leyendo el
  puntero de la posición 169 directamente), pero no aparece en `parsed.ornaments`.
- El byte 99 (tabla de tonos = 2) no se ha contrastado contra un reproductor: es el
  valor que usa `game over.pt3` y el habitual en módulos PT3 3.x, pero si al sonar la
  afinación no cuadra, es el primer byte que hay que tocar.
- El parecido tímbrico con el original es una decisión de diseño argumentada (§5),
  **no** una medida.

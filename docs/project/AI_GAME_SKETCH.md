# Sketch IA (AI Game Sketch) - MSX1

**Menú:** `File → Export Sketch IA (.zip)` (solo proyectos MSX1 / SCREEN 2).
**Código:** `utils/gameSketch/` · **Test:** `npm run test:game-sketch`

## Objetivo

Exportar un "plano" del juego, independiente del motor, que una IA (o una
persona) pueda usar para **reconstruir el juego en otro entorno**: Godot,
HTML5, Python/pygame, un port a MSX2, etc.

A diferencia de `Export Game Structure (.json)` (`utils/intermediateGameJson.ts`,
pensado para máquinas: hex de nibbles, bytes empaquetados), el Sketch IA está
pensado para ser **leído**: lenguaje natural, pseudocódigo, PNG y diagramas.

## Opciones al exportar

Un prompt pide `<escala 1-8> <smooth|nearest>`:

| Entrada | Resultado |
|---------|-----------|
| `1` | Solo píxeles originales (`graphics/x1`) |
| `2 smooth` | x1 + x2 con filtro Scale2x (pixel art, sin colores nuevos) |
| `3 smooth` | x1 + x3 con Scale3x |
| `4 smooth` | x1 + x4 (Scale2x dos veces) |
| `N nearest` | x1 + xN con píxeles grandes exactos |

Todas las coordenadas del JSON están siempre en píxeles lógicos x1 (256x192).

## Contenido del ZIP

```
<proyecto>_ai_sketch/
├── README_AI.md              guía/prompt para la IA (en inglés)
├── game_sketch.json          índice principal
├── screens/*.json            rejillas de tiles, collisionMap ASCII, entidades
├── rules/
│   ├── state_machines.md     reglas: lenguaje natural + pseudocódigo + Mermaid
│   ├── game_flow.md          flujo de menús/pantallas + mapa del mundo
│   └── glossary.json         significado de condiciones, acciones, componentes
├── graphics/
│   ├── palette.json, tileset_atlas.json
│   └── x1/, xN/              tiles, tileset_atlas, sprites (frames + sheet), screens, fonts
├── audio/
│   ├── AUDIO_SPEC.md         PSG AY-3-8910, SCC, fórmulas, tracker
│   ├── music/*.wav           canciones en WAV con puntos de bucle (Godot)
│   ├── music/*.json          canciones como eventos de nota con frecuencia
│   ├── instruments/*.json    instrumentos y ornamentos con descripción
│   ├── sfx/*.wav             efectos en WAV (one-shot)
│   └── sfx/*.json            efectos PSG por pasos
└── code/*.asm                scripts Z80 legacy (solo referencia)
```

## Decisiones de diseño

- **Reglas en tres formas**: cada transición de una máquina de estados se
  exporta como frase en inglés, pseudocódigo neutro y el `Condition`/`Action`
  original (sin pérdidas). Recordatorio: en Mideas no hay eventos, todo son
  condiciones evaluadas cada frame.
- **Semántica verificada contra el modo Play real**
  (`components/modals/GameFlowPreviewModal.tsx`, que replica el ROM Z80):
  física en punto fijo 8.8 (gravedad 0,25 px/frame², tope 4 px/frame, salto
  -4 px/frame), propiedades que el juego ignora (`ignoredByPlayMode`), colisión
  mutua entre capas, plataformas de una vía, salidas de pantalla, HUD, etc., en
  `game_sketch.json > engineRules` (`utils/gameSketch/knowledge.ts`).
  `ScreenPlayModal.tsx` era código muerto y se eliminó (Gauntlet R1).
- **Restricciones MSX1 separadas del diseño** (`sourcePlatform`): la IA sabe
  qué era límite de hardware (2 colores por línea de 8 px, 4 sprites por línea)
  y qué era decisión de diseño. Incluye pistas para **Godot 4, HTML5 y MSX2**.
- **PNG sin dependencias** (`utils/gameSketch/png.ts`): encoder propio con
  bloques deflate "stored"; el ZIP final (JSZip DEFLATE) los comprime.
- **README_AI en inglés**: los modelos rinden mejor; el resto de la doc de
  Mideas sigue en español.

## Audio WAV (para Godot)

- PCM 16 bits, mono, 44100 Hz, renderizado **offline** con la misma emulación
  AY-3-8910/YM2149 que el editor y el modo Play (`AYRegisterSynthesizer` en
  modo offline: `setOfflineClock`, `playNoteOffline`, `stepFrameOffline`,
  `renderOffline`). Código: `utils/gameSketch/audioRender.ts`.
- Canciones: se reproduce **exactamente la temporización del modo Play**
  (GameFlowPreviewModal): una fila cada 2500*speed/bpm ms con
  nota/instrumento/ornamento/volumen (sin efectos, como Play), reloj de frames
  del sintetizador cada 2500/bpm ms, y los cambios de registros se aplican entre
  bloques de 1024 muestras como el ScriptProcessor del navegador. Un render
  "tick exacto" hacía zumbar (~76 Hz) las canciones cuyos canales usan formas
  de envolvente hardware distintas (R13 reiniciado cada tick; bug visto con
  Oda1). Se renderiza desde `order[0]` hasta el final, una vez. El tramo de bucle (`order[restartPosition]` → final) va en
  un chunk RIFF `smpl`; Godot 4 lo detecta solo (Loop Mode: "Detect From WAV").
- Canciones `external-pt3` (PT3 importado con cabecera): se renderizan con el
  **reproductor PT3 real**, el mismo que usa el tracker: código Z80 ZXPT3
  ejecutado en el Z80 de Cowbell → frames de registros a 50 Hz → `AYChip` de
  Cowbell (AY 1,7734 MHz). Worker: `public/audio/pt3-render-worker.js`;
  cliente: `utils/gameSketch/pt3CowbellRender.ts`. El punto de bucle sale de
  `buildPT3RecordingTimeline` (verificado: mismo nº de frames que el
  reproductor). En la prueba A/B con `bounder10.pt3` este camino suena mucho
  mejor que el sintetizador del editor. Si el PT3 se importó sin cabecera, no
  se puede (igual que en el editor) y se avisa.
- Las canciones se normalizan a pico 0,9 (ganancia máx. x4); los efectos no.
- Efectos PSG: se escriben sus pasos directamente en los registros del chip.
- Limitación: el SCC no se renderiza (canciones SCC sin WAV; PSG+SCC solo
  con los canales A/B/C). Se avisa en `warnings`.

## Fuera de esta versión (v1)

Bosses, diálogos, retratos y presentation screens se listan en
`game_sketch.json > notIncludedInThisVersion` pero no se describen todavía.
El chip SCC no se renderiza a WAV todavía.

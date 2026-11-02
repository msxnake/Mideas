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
│   ├── music/*.json          canciones como eventos de nota con frecuencia
│   ├── instruments/*.json    instrumentos y ornamentos con descripción
│   └── sfx/*.json            efectos PSG por pasos
└── code/*.asm                scripts Z80 legacy (solo referencia)
```

## Decisiones de diseño

- **Reglas en tres formas**: cada transición de una máquina de estados se
  exporta como frase en inglés, pseudocódigo neutro y el `Condition`/`Action`
  original (sin pérdidas). Recordatorio: en Mideas no hay eventos, todo son
  condiciones evaluadas cada frame.
- **Física documentada con las fórmulas del modo Play**
  (`components/modals/ScreenPlayModal.tsx`): gravedad `vy += strength/60`,
  salto `vy = -jumpPower/40`, etc.
- **Restricciones MSX1 separadas del diseño** (`sourcePlatform`): la IA sabe
  qué era límite de hardware (2 colores por línea de 8 px, 4 sprites por línea)
  y qué era decisión de diseño. Incluye pistas para **Godot 4, HTML5 y MSX2**.
- **PNG sin dependencias** (`utils/gameSketch/png.ts`): encoder propio con
  bloques deflate "stored"; el ZIP final (JSZip DEFLATE) los comprime.
- **README_AI en inglés**: los modelos rinden mejor; el resto de la doc de
  Mideas sigue en español.

## Fuera de esta versión (v1)

Bosses, diálogos, retratos y presentation screens se listan en
`game_sketch.json > notIncludedInThisVersion` pero no se describen todavía.
Tampoco se renderiza el audio a WAV (solo datos + especificación).

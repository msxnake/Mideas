/**
 * Builds README_AI.md: the entry point / prompt for an AI (or developer) that
 * must rebuild the game from the sketch. Written in English on purpose: it is
 * consumed mainly by language models.
 */

const bullet = (items: string[]) => items.map(i => `- ${i}`).join('\n');

export function buildReadmeAi(sketch: any): string {
  const s = sketch;
  const counts = s.summary.counts;
  const screens = (s.screens as any[]).map(sc => `- \`${sc.file}\` - ${sc.summary}`).join('\n') || '- (no screens)';
  const templates = (s.entities.templates as any[])
    .filter(t => t.placedInScreens)
    .map(t => `- **${t.name}** (${t.role}): ${Object.keys(t.components).join(', ')}${t.stateMachines.length ? ` - rules: ${t.stateMachines.map((m: any) => m.name).join(', ')}` : ''}`)
    .join('\n') || '- (none placed in screens)';
  const flows = (s.gameFlows as any[]).flatMap(f => {
    const reachable = f.nodes.filter((n: any) => n.reachableFromStart && n.type !== 'Waypoint');
    const orphan = f.nodes.filter((n: any) => !n.reachableFromStart);
    return [
      ...(s.gameFlows.length > 1 ? [`**${f.name}**`] : []),
      ...reachable.map((n: any, i: number) => `${i + 1}. ${n.natural}`),
      ...(orphan.length ? [`- _Not connected to the start (probably unused): ${orphan.map((n: any) => n.label).join(', ')}_`] : []),
    ];
  }).join('\n') || '- (no game flow: start directly in the first world)';
  const scaleLine = s.graphics.scales.length > 1
    ? `Graphics are provided at ${s.graphics.scales.join(' and ')} (${s.graphics.scaleMethod}).`
    : 'Graphics are provided at original size (x1) only.';

  return `# ${s.project.name} - AI Game Sketch

You are given a complete, engine-neutral description of a video game originally
made with **Mideas MSX** for the **MSX1** home computer (256x192, 15 colours,
AY-3-8910 sound). Your job is to **rebuild this game** in the target platform the
user asks for (for example Godot 4, HTML5/JavaScript, Python/pygame, or MSX2),
reproducing the same layout, rules, feel and flow.

> Schema: \`${s.schema}\` - exported ${s.exportedAt}

## 1. The game in one look

- Genre (automatic guess): **${s.summary.genreGuess}**
- Player character(s): ${s.summary.players.length ? s.summary.players.map((p: string) => `**${p}**`).join(', ') : '(not detected)'}
- Content: ${counts.screens} screens, ${counts.worlds} world map(s), ${counts.sprites} sprites, ${counts.tiles} tiles, ${counts.entityTemplates} entity templates, ${counts.stateMachines} state machines, ${counts.songs} songs, ${counts.soundEffects} sound effects.

### Controls
${bullet(s.summary.controls.length ? s.summary.controls : ['Not detected: infer from the player components and rules.'])}

### Game flow (what the player sees, in order)
${flows}

### Entities placed in the levels
${templates}

### Screens
${screens}

## 2. Files in this sketch

| Path | Content |
|------|---------|
| \`game_sketch.json\` | Main index: summary, coordinate system, graphics catalogue, entities/components, state machines, game flow, world maps, audio, target hints. |
| \`screens/*.json\` | One file per screen: tile grids (indices into the tileset atlas), ASCII **collisionMap**, entity instances with fully resolved component values, effect zones, HUD. |
| \`screens\` PNGs (\`graphics/xN/screens/\`) | How each screen looks (background only, without sprites). Use as visual reference. |
| \`graphics/tileset_atlas.json\` + \`graphics/xN/tiles/tileset_atlas.png\` | Every 8x8 tile cell with its gameplay properties (solid, deadly, breakable...). Ready for a TileSet. |
| \`graphics/xN/tiles/*.png\` | Each tile asset (some tiles are 16x16 = 2x2 cells). |
| \`graphics/xN/sprites/<name>/\` | Sprite frames (\`frame_00.png\`...) and a horizontal sheet (\`sheet.png\`). |
| \`graphics/xN/fonts/\` | Bitmap fonts (16x16 grid of 8x8 glyphs, ASCII order). |
| \`graphics/palette.json\` | The 16-entry MSX1 palette. |
| \`rules/state_machines.md\` | **Gameplay rules**: every state machine in plain English + pseudocode + Mermaid diagram. |
| \`rules/game_flow.md\` | Menus/screens sequence and world map connections (Mermaid). |
| \`rules/glossary.json\` | Exact meaning of every condition, action, component and enemy behaviour. |
| \`audio/music/*.wav\`, \`audio/sfx/*.wav\` | **Ready-to-use audio** (16-bit 44.1 kHz). Songs include loop points (smpl chunk, auto-detected by Godot). |
| \`audio/music/*.json\` | Tracker songs as timed note events (with frequencies). |
| \`audio/instruments/*.json\` | Instrument and ornament definitions with readable descriptions. |
| \`audio/sfx/*.json\` | Sound effects (PSG step programs). |
| \`audio/AUDIO_SPEC.md\` | How the MSX sound chips and the tracker work, with formulas. |
${s.code.length ? '| \`code/*.asm\` | Optional legacy Z80 scripts (reference only). |\n' : ''}
## 3. Key rules to respect

${bullet([
    'Logical resolution is **256x192** px; the screen is a grid of **32x24 cells of 8x8 px**. Every coordinate, size and speed in the sketch is in these logical (x1) pixels.',
    'Time unit is the **frame = 1/60 s** (60 fixed updates per second). Speeds are pixels per frame; animations and WAIT use milliseconds. Physics are the Z80 8.8 fixed-point formulas in game_sketch.json > entities.components[].formulas (gravity 0.25 px/frame^2 up to 4 px/frame, jump -4 px/frame).',
    '**Mideas Play mode and the MSX ROM differ in a few features** (engineRules.playVsRom): this sketch describes Play mode, and marks ROM-only conditions/actions/components explicitly ("[ROM only ...]", "NOT simulated by Mideas Play mode"). Choose one behaviour and apply it consistently.',
    '**`engineRules` in game_sketch.json is mandatory reading**: state machine evaluation, tile collision probes, one-way platforms, entity collision classes, screen exits, HUD binding, menus layout, sprite mirroring.',
    'Some component properties are stored but NOT used by the game: they are listed per component as `ignoredByPlayMode` (e.g. Jump.jumpPower, Gravity.strength, AIBehavior.patrolRangeX). Do not implement them.',
    'Entities spawn at `spawnPixel` of each instance (cell * 8, or Patrol waypoint1). Hitboxes are relative to the sprite top-left corner.',
    'Collision against the level uses the **collisionMap** of each screen (blocking chars `#`, `=` one-way, `B`, `X`, `D`; see its legend).',
    'Collision between entities is **mutual**: A and B collide only when `(A.collidesWith & B.collisionLayer) != 0` AND `(B.collidesWith & A.collisionLayer) != 0`.',
    'Behaviour rules are **conditions checked every frame** (collision flags are rebuilt on every pass, as in the ROM). Transitions of the current state (and of "Any State") are evaluated in order and the first true one fires.',
    'Screens are **flip-screen** (no scrolling): leaving through a border loads the connected screen (see worlds in game_sketch.json).',
    scaleLine,
    ...s.graphics.styleRules,
  ])}

## 4. How to rebuild (recommended order)

1. Read \`game_sketch.json > summary\`, \`rules/game_flow.md\` and look at the screen PNGs.
2. Set up a 256x192 logical viewport with integer scaling and 60 fixed updates per second.
3. Build the tileset from \`graphics/tileset_atlas.json\` and load every screen from \`screens/*.json\` (layers.background + collisionMap).
4. Create one prefab/class per entity template (\`entities.templates\`), with the resolved component values of each instance.
5. Implement the systems: input, movement/physics (formulas), tile collision, entity collision (layers), state machines (\`rules/state_machines.md\`), animation, HUD.
6. Implement the world map navigation (screen borders) and the game flow (menus, texts, game over, victory).
7. Add audio: use the WAV files in \`audio/\` (music loops automatically in Godot); the JSON + AUDIO_SPEC.md allow re-synthesis or a remake.
8. Compare each screen with its PNG and the original behaviour description; then, optionally, enhance graphics/audio while keeping sizes, hitboxes and timings.

## 5. Target specific hints

### Godot 4
${bullet(s.targetHints.godot4)}

### HTML5 / JavaScript
${bullet(s.targetHints.html5)}

### MSX2 port
${bullet(s.targetHints.msx2)}

## 6. Original platform (MSX1) - what was a limitation, not a design choice

${bullet(s.project.sourcePlatform.constraints)}

${s.project.sourcePlatform.howToTreatConstraints}
${s.notIncludedInThisVersion ? `\n## 7. Not described in this sketch version\n\n${bullet(Object.entries(s.notIncludedInThisVersion.assets).map(([k, v]) => `${k}: ${v} asset(s)`))}\n` : ''}${s.warnings.length ? `\n## Export warnings\n\n${bullet(s.warnings.slice(0, 50))}\n` : ''}`;
}

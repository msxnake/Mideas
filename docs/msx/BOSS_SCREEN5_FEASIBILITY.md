# Bosses bitmap a MSX2 SCREEN 5 — Estudi de viabilitat + Fase 1 IMPLEMENTADA

**Data:** 2026-07-23 · **Mètode:** anàlisi del motor bitmap-room + benchmark empíric
OpenMSX (`test/boss/boss_blit_bench.asm`, C-BIOS_MSX2, display i sprites actius).

> **Estat:** Fase 1 del `msx2BitmapBossGenerator` **implementada i verificada**
> a OpenMSX (veure secció final). Aquest document conserva l'estudi de
> viabilitat que la va justificar.

## Pregunta

¿Es pot fer un generador de Bosses per a SCREEN 5 basat en **bitmaps grans**
(com el `bossesGenerator` MSX1 de tiles, però bitmap), tenint en compte que si
el boss es mou "la quantitat de bytes per moure pot ser un llast"?

## Resposta curta: SÍ — el Z80 no mou els bytes, els mou el blitter del V9938

Llançar un HMMM costa al Z80 ~15 OUTs (~300 cicles); la còpia la fa el VDP en
paral·lel mentre la CPU segueix executant la lògica del joc. El límit real no és
la CPU sinó el **throughput del blitter**, mesurat empíricament en
**~5,7 µs/byte** (HMMM, pantalla i sprites actius).

## Mesures reals (OpenMSX, marker de validesa OK)

| Boss (px) | bytes 4bpp | còpia HMMM | veredicte moviment |
|-----------|-----------|------------|--------------------|
| 32×32 | 512 | 2,3 ms | 60 fps sobrat |
| 48×48 | 1.152 | 6,0 ms | 60 fps sobrat |
| **64×64** | 2.048 | **11,7 ms** | **60 fps VERIFICAT: 0 overruns/300 frames** |
| **96×96** | 4.608 | **26,5 ms** | **30 fps VERIFICAT: 299 overruns/300 → 1 update/2 frames** |
| 128×96 | 6.144 | 35,2 ms | ~20-30 fps (1 update/2-3 frames) |

Test dinàmic: ping-pong 2 px/frame amb restore de 2 franges de 4px des de la
pàgina 1 (fons net) + redraw complet des de la pàgina 2 (atlas). Captura visual
sense cap rastre ni corrupció.

Nota: un boss que s'actualitza cada 2 frames segueix semblant fluid (els bosses
grans clàssics de MSX2 fan exactament això); el player continua a 60 fps
sempre — el blitter no toca la CPU.

## Per què encaixa amb el motor actual

1. **Doble buffer ja existent**: pàgina 0 visible / pàgina 1 amb el room net
   (el motor la manté per transicions). La pàgina 1 és la font de restore
   gratuïta per esborrar el rastre del boss.
2. **Atlas a pàgina 2 (VRAM fila 512+)**: els frames del boss es pugen com a
   part de l'atlas o després d'ell. VRAM lliure típica (files 768-1023):
   **32 KB** → 16 frames de 64×64 o 7 de 96×96.
3. **El motor ja té tota la infraestructura**: blocs de comando de 15 bytes per
   `#9B` amb R#17, `vdp_wait_cmd_ready`, RLE upload per bancs de 16KB, HMMM
   16×16 com a primitiva de composició.
4. **Sprites hardware descartats per al cos**: 8 sprites/línia i ja els gasten
   player + enemics + bales. El cos del boss ha de ser bitmap; els sprites
   queden per a projectils i overlays de dany.

## Regles de disseny del futur `msx2BitmapBossGenerator`

- **Frames opacs amb fons integrat**: HMMM (ràpid) en lloc de LMMM amb
  transparència (~2× més lent). El frame del boss porta el fons pintat;
  la caixa és rectangular.
- **Restore per franges (dirty strips)**, no rect complet: moviment de
  ±2 px/frame → ~128 bytes de restore en lloc de re-copiar tot el fons.
- **Cadència configurable**: reutilitzar `runtimeUpdateIntervalFrames` del
  tipus `Boss` existent (1 = 60fps per ≤64×64; 2 = 30fps per 96×96+).
- **Pressupost compartit**: el frame que el boss redibuixa, ajornar altres
  HMMM no crítics (portes, gemes) al frame següent.
- **Moviment vertical** = mateixes franges en horitzontal (simètric).
- Reutilitzar del `bossesGenerator` MSX1: fases, atacs, weak points,
  behavior loop — només canvia la capa de RENDER (tiles→bitmap HMMM).

## Fitxers del benchmark

- `test/boss/boss_blit_bench.asm` — ROM 16KB de mesura (glass)
- `test/boss/boss_blit_probe.tcl` — sonda TCL (llegeix comptadors RAM)
- `test/boss/boss_blit_probe.txt` — resultats
- Screenshot: `~/Documents/openMSX/screenshots/boss_blit_0002.png`

Gotcha registrat durant el test: variables `dw` en ROM no s'escriuen
(cartutx!) — sempre EQU a RAM (regla CLAUDE.md confirmada una vegada més).

---

## Fase 1 IMPLEMENTADA (2026-07-23)

**Generador:** `utils/msxGenerator/generators/msx2/msx2BitmapBossGenerator.ts`
(cablejat a `msx2Screen5BitmapRoomGenerator.ts`; kind `boss` +
`bitmap_boss` al catàleg de l'editor).

### Què fa
- 1 boss bitmap per sala, cos = regió del **shared atlas** referenciada per
  `bossAtlasEntryId` (mai coordenades crues: el packer remapeja sx/sy).
- Patrol X/Y (reusa el resolver d'enemics via còpia sintètica `kind:'enemy'`),
  cadència configurable (`bossInterval`), animació per tira horitzontal
  (`bossFrames`).
- **Render:** restore de 2 franges de 4px des de pàgina 1 (sala neta) + redraw
  HMMM del cos des de l'atlas → sense rastre.
- **Dany per contacte** (mateix contracte saturat + i-frames + respawn que els
  enemics). **Bales del player** el fereixen (redirigeix el stub
  `bitmap_bullet_check_enemy_collision` → `bitmap_boss_bullet_hit`).
- **Mort:** a 0 HP restore de tot el rectangle des de pàgina 1 + flag
  `boss_defeated[room]` **persistent** (no reapareix durant l'execució).
- Cost hardware: **0 sprites, 0 pattern groups**; només RAM encadenada
  (~${'`'}11+2+15+roomCount${'`'} bytes) sota el sostre HUD.

### Verificació OpenMSX (`test/msx2-boss/`)
- `make_fixture.py` → boss 64×64 procedural, patrol X 16..160, hp 3, shoot ON.
- **Moviment:** `boss_smoke.tcl` — boss creuant la sala (x 44→107→157),
  fons intacte, player 60fps.
- **Cicle de mort:** `boss_kill.tcl` — bales injectades al pool → hp 3→2→1→0,
  després `boss_active=0` + `boss_defeated[1]=1`; captura `boss_dead_*` mostra
  el cos esborrat net sense corrupció.
- **No-op:** una sala sense boss emet 0 bytes de codi boss (build 32KB intacte).

### Pendent (Fases futures)

> **Arquitectura completa i pla per fases:** veure
> [BOSS_SYSTEM_DESIGN.md](BOSS_SYSTEM_DESIGN.md). Aquest document (feasibility)
> només cobreix el **render** de la Fase 1; el disseny hi afegeix
> BossDefinition/Encounter/Runtime, `GAME_MODE_BOSS`, fases d'atac, punts febles
> i **Boss Defeat Actions** (`onDefeated`). Punt clau: la Fase 1 modela el boss
> com una **entitat** (`kind:'boss'`), cosa que el disseny corregeix.

- **Boss Defeat Actions** (`onDefeated`) — Fase A. Increment 1 (pipeline bytecode +
  `setFlag` autocontingut) **FET i verificat OpenMSX** (2026-07-24: `boss_flags[0]=1`
  en morir); increment 2 (openDoor/giveKey/showMessage/changeScreen) pendent.
- **Barrera de cadena (lock de sala)** — Fase B **FETA i verificada OpenMSX**
  (2026-07-24): cadena visible de tiles amb col·lisió al voltant de tot el perímetre
  (`bossBarrierTileId`), marcador `#80` auto-restaurable, desapareix en derrotar el boss.
  `game_mode`/lockDoors formals = pendent opcional.
- Editor UI per triar `bossAtlasEntryId` i previsualitzar (ara és param cru) — Fase F.
- Fases (HP thresholds) i atacs propis reutilitzant el model del
  `bossesGenerator` MSX1 (aquí només és render+patrol+contacte+bala) — Fase D.
- Revisar l'espai de coordenades de les **bales reals** vs `boss_y` lògic
  (el smoke injecta al pool directament; cal confirmar el mapping quan una
  bala real del player impacta a diferents altures).
- Weak points / behavior loop — Fase E.

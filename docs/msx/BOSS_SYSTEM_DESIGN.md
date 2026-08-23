# Mideas MSX2 SCREEN 5 Bitmap — Sistema de Bosses de Final de Fase (Disseny)

**Estat:** document de disseny. La **Fase 1 del render** ja està implementada i verificada
(veure [BOSS_SCREEN5_FEASIBILITY.md](BOSS_SCREEN5_FEASIBILITY.md)); aquest document defineix
l'**arquitectura completa** del sistema i el **pla d'implementació** per fases.

> Origen: conversa de disseny amb Jordi (branca `mcp_news`) integrant la idea
> arquitectònica del document NPC/diàlegs (separar responsabilitats amb State
> Machine + components + sistemes globals; no ficar tota la lògica dins d'una
> entitat genèrica).

---

## 1. Context del projecte

Mideas ja disposa d'un sistema de bosses de final de fase per a **MSX1** (tiles/caràcters),
on el boss podia estar format per diversos caràcters i el moviment es resolia manipulant
blocs de caràcters.

Ara, per a **MSX2 SCREEN 5 (bitmap)**, l'objectiu és un sistema equivalent però
**repensat**: el boss és un element bitmap gran, la qual cosa canvia estructura,
animació, gestió de memòria i integració amb el motor. **No s'ha de copiar el model
MSX1 directament.**

La idea principal: **un boss de final de fase NO és una entitat normal** del sistema
genèric d'entitats. Un boss té comportaments i conseqüències **globals** sobre la sala i
sobre el progrés del joc. Cal un sistema propi de bosses, separat.

---

## 2. Problema de la implementació actual

La implementació inicial (Fase 1) modela el boss com **una entitat més** dins de la
pantalla bitmap (`kind:'boss'`, patrol reusant el resolver d'enemics via còpia sintètica
`kind:'enemy'`, dany per contacte "mateix contracte que els enemics"). Això va servir per
**validar el render bitmap** (el dubte tècnic real: HMMM ~5,7 µs/byte, 64×64@60fps), però
**no és l'arquitectura correcta**.

Un boss no és "un enemic gran": normalment **modifica l'estat complet de la sala o la fase**:

- En entrar a la sala del boss, es poden **tancar les portes** i **bloquejar el jugador**.
- Pot tenir **diverses fases d'atac**.
- Pot tenir **punts febles** específics.
- Pot **canviar de comportament** segons la vida restant.
- En ser derrotat: **donar una clau**, **obrir una porta**, **activar un flag**, **mostrar
  un missatge** o **portar el jugador a una nova fase o món**.

Aquest comportament és massa global per estar amagat dins d'una entitat normal.

---

## 3. Objectiu del nou sistema

Un sistema de bosses per a MSX2 SCREEN 5 bitmap que permeti:

1. Crear bosses com a **assets reutilitzables**.
2. Definir els seus gràfics bitmap.
3. Definir **fases d'atac**.
4. Definir patrons de moviment.
5. Definir patrons de projectils.
6. Definir **punts febles** / zones vulnerables.
7. Definir **què passa quan el boss és derrotat**.
8. Permetre que una pantalla **referenciï** un boss sense convertir-lo en entitat genèrica.
9. Exportar-ho tot a JSON i després a dades ASM compatibles amb el motor.

---

## 4. Separació conceptual (3 nivells)

### 4.1 BossDefinition — plantilla reutilitzable

Què és el boss, independentment de la pantalla. Inclou: ID, nom intern, gràfics bitmap,
dimensions, frames principals, parts animades, vida base, fases d'atac, patrons de
moviment, patrons de tir, punts febles, zones de col·lisió, efectes visuals, música/so.

```json
{
  "id": "boss_eye_guardian",
  "name": "Eye Guardian",
  "graphics": {
    "mainBitmap": "eye_guardian_body",
    "animatedParts": [
      { "id": "eye", "frames": ["eye_01", "eye_02", "eye_03"], "x": 32, "y": 16 }
    ]
  },
  "baseHp": 100,
  "weakPoints": [
    { "id": "main_eye", "x": 32, "y": 16, "w": 16, "h": 16, "damageMultiplier": 1 }
  ]
}
```

### 4.2 BossEncounter — instància dins d'una pantalla

Permet reutilitzar el mateix boss en diferents llocs amb paràmetres diferents (fase
inicial, vida, portes bloquejades, recompensa).

```json
{
  "screenId": "castle_room_12",
  "bossId": "boss_eye_guardian",
  "startPhase": "phase_1",
  "hpOverride": 120,
  "lockDoors": ["left", "right"],
  "onDefeated": [
    { "action": "openDoor", "target": "right" },
    { "action": "giveItem", "itemId": "blue_key" }
  ]
}
```

### 4.3 BossRuntime — execució al motor

Carrega el boss en entrar a la sala; tanca portes/bloqueja sortides; dibuixa el boss;
actualitza la fase; executa moviment i atacs; comprova col·lisions amb el jugador i
impactes sobre punts febles; redueix vida; canvia de fase; executa les **accions de
derrota**; retorna al joc normal quan el boss ja ha estat derrotat.

---

## 5. Boss Editor (diàleg separat)

Mideas ha de tenir una pestanya/diàleg **dedicat** als bosses, **fora** de l'editor normal
d'entitats (nom proposat: **Boss Editor** / **MSX2 Bitmap Boss Editor**). Configura:

- **5.1 Informació general:** ID, nom, tipus, vida base, mida, posició inicial
  recomanada, prioritat de dibuix, música/SFX d'entrada.
- **5.2 Gràfics bitmap:** bitmap principal, parts animades independents, frames, paleta,
  dimensions màximes, origen gràfic, mirroring, opcions d'optimització.
- **5.3 Fases d'atac** (veure §6).
- **5.4 Punts febles / zones de dany** (veure §7).
- **5.5 Boss Defeat Actions** (veure §8).

---

## 6. Fases d'atac

Cada boss pot tenir diverses fases. Cada fase: ID, condició d'entrada (% vida), patró de
moviment, patró d'atac, velocitat, cadència de tir, tipus de projectil, canvis visuals
opcionals, punts febles actius/inactius.

```json
{
  "phases": [
    {
      "id": "phase_1",
      "enterWhenHpBelowPercent": 100,
      "movement": { "type": "horizontal_patrol", "speed": 1, "range": 80 },
      "attack": { "type": "single_shot", "interval": 90, "projectileId": "boss_bullet" }
    },
    {
      "id": "phase_2",
      "enterWhenHpBelowPercent": 70,
      "movement": { "type": "horizontal_jump", "speed": 2, "jumpInterval": 120 },
      "attack": { "type": "double_shot", "interval": 60, "projectileId": "boss_bullet" }
    }
  ]
}
```

---

## 7. Punts febles i zones de dany

Un boss no sempre rep dany a tot el cos (cos invulnerable, ull vulnerable, armadura,
punt feble que només apareix en una fase o durant un atac). Tipus de zona: sòlida, de
contacte (fa mal al jugador), vulnerable, invulnerable, punt feble, punt feble actiu
només en certes fases.

```json
{
  "damageZones": [
    { "id": "body", "type": "invulnerable", "x": 0, "y": 0, "w": 96, "h": 64 },
    { "id": "eye", "type": "weak_point", "x": 40, "y": 20, "w": 16, "h": 16,
      "activePhases": ["phase_1", "phase_2"], "damageMultiplier": 1 }
  ]
}
```

---

## 8. Boss Defeat Actions

Secció pròpia del Boss Editor: **què passa quan el boss cau**. Confirma que el boss és un
**esdeveniment de progrés**, no només un enemic. Opcions: donar clau/objecte, obrir
porta, desbloquejar sortida, activar flag global, mostrar missatge centrat, canviar de
pantalla/fase/món, activar cutscene, fer desaparèixer un bloqueig, guardar que el boss ja
ha estat derrotat.

```json
{
  "onDefeated": [
    { "action": "showMessage", "text": "Has derrotat el guardià." },
    { "action": "giveItem", "itemId": "blue_key" },
    { "action": "openDoor", "target": "east_door" },
    { "action": "setFlag", "flag": "boss_eye_guardian_defeated" }
  ]
}
```

```json
{
  "onDefeated": [
    { "action": "showMessage", "text": "El món 2 ha estat desbloquejat." },
    { "action": "goToWorld", "worldId": "world_2" }
  ]
}
```

---

## 9. Integració amb la pantalla

La pantalla **no** conté el boss com a entitat normal: té una **referència** a un
`BossEncounter`.

```json
{
  "screenId": "room_boss_01",
  "bossEncounter": {
    "bossId": "boss_eye_guardian",
    "startPhase": "phase_1",
    "lockPlayerInside": true,
    "lockDoors": ["left", "right"],
    "defeatedFlag": "boss_eye_guardian_defeated"
  }
}
```

En entrar el jugador: (1) comprova si hi ha `BossEncounter`; (2) comprova si el boss ja
està derrotat; (3) si no, activa mode boss; (4) tanca portes/bloqueja sortides; (5)
carrega gràfics i dades; (6) comença el combat; (7) en morir el boss, executa les accions
de derrota; (8) marca com derrotat si cal; (9) retorna el control normal.

---

## 10. Relació amb State Machine i sistemes globals

Igual que el Player no hauria de "saber" conversar directament sinó tenir estats
(`NORMAL`, `DIALOGUE_LOCKED`, `CUTSCENE`), el boss tampoc ha de ser una entitat amb tota
la lògica ficada dins. El motor té **modes globals**:

```
GAME_MODE_PLAYING
GAME_MODE_DIALOGUE
GAME_MODE_BOSS
GAME_MODE_CUTSCENE
```

En mode boss: el jugador continua controlable (amb restriccions possibles), les sortides
poden estar bloquejades, el `BossRuntime` s'actualitza cada frame, els enemics normals
poden desactivar-se, i el sistema de missatges pot activar-se en derrotar el boss.

```asm
UpdateGame:
    ld a,(GameMode)
    cp GAME_MODE_DIALOGUE
    jr z,UpdateDialogue
    cp GAME_MODE_BOSS
    jr z,UpdateBossMode
UpdatePlaying:
    call ReadPlayerInput
    call UpdatePlayer
    call UpdateEnemies
    ret
UpdateBossMode:
    call ReadPlayerInput
    call UpdatePlayer
    call UpdateBoss
    call UpdateBossProjectiles
    call CheckBossDefeat
    ret
UpdateDialogue:
    call UpdateTextBox
    call ReadDialogueButton
    ret
```

---

## 11. Components i sistemes proposats

**Components:** `BossDefinition`, `BossEncounter`, `BossPhase`, `BossMovementPattern`,
`BossAttackPattern`, `BossWeakPoint`, `BossDefeatAction`.

**Sistemes globals:** `BossSystem`, `BossRuntime`, `BossRenderer`, `BossCollisionSystem`,
`BossProjectileSystem`, `BossDefeatActionSystem`.

**Relació amb l'existent:** Player (Input/Movement/Collision/Animation/StateMachine) +
Global Systems (BossSystem, DialogueSystem, CutsceneSystem, TextBoxRenderer, EventSystem).

---

## 12. Flux complet recomanat

```
1.  El jugador entra en una pantalla.
2.  La pantalla té un BossEncounter associat.
3.  El motor comprova si el boss ja ha estat derrotat.
4.  Si no ho està, s'activa GAME_MODE_BOSS.
5.  Es tanquen portes o sortides.
6.  Es carrega la BossDefinition.
7.  Es crea el BossRuntime.
8.  El boss comença en la fase indicada.
9.  El jugador lluita contra el boss.
10. El boss canvia de fase segons la vida o condicions.
11. El jugador només pot fer mal a les zones vulnerables.
12. Quan la vida arriba a zero, s'activa onDefeated.
13. Es mostra missatge, es dona clau, s'obre porta o es canvia de món.
14. Es marca el boss com derrotat, si cal.
15. Es torna a GAME_MODE_PLAYING.
```

---

## 13. Instrucció clau per a una IA que ho implementi

> No implementis els bosses MSX2 SCREEN 5 com a entitats normals dins del sistema genèric
> d'entitats. Cal un sistema propi de bosses inspirat en el de MSX1, adaptat a SCREEN 5
> bitmap, amb: `BossDefinition` (asset reutilitzable), `BossEncounter` (instància de
> pantalla), `BossRuntime` (execució), Boss Editor separat, fases d'atac, patrons de
> moviment, patrons de projectils, punts febles, accions de derrota, i integració amb
> `GameMode` + `EventSystem` + State Machine del Player. **El boss és un esdeveniment
> global de joc, no només un enemic gran.**

---

## 14. Resum conceptual

```
Boss = asset reutilitzable + instància de pantalla + execució especial en runtime.
Boss ≠ entitat normal amb més mida i més vida.
```

El boss afecta la sala, el progrés, les portes, els objectes, les fases, els missatges i
fins i tot el canvi de món. Per això cal un Boss Editor separat, amb dades clares i
exportables a JSON, pensat des del principi per les limitacions d'MSX2 SCREEN 5 bitmap.

---
---

## 15. Estat actual al repo (punt de partida real)

Abans d'implementar, cal saber què ja existeix i què es pot **reutilitzar** en lloc de
reescriure. La bona notícia: la major part de les Defeat Actions i el `GAME_MODE_BOSS`
tenen ganxos ja fets al backend bitmap.

| Peça del disseny | Estat al repo | Fitxer / símbol |
|---|---|---|
| Render bitmap del boss (HMMM, restore de franges, mort) | **FET (Fase 1)** | `msx2BitmapBossGenerator.ts` |
| Boss com a `kind:'boss'` + patrol + contacte + bala | **FET** però com a **entitat** (a corregir) | `buildBitmapRoomBossData` |
| Flag `boss_defeated[room]` persistent | **FET** | `boss_defeated` RAM |
| Proto-`GAME_MODE` (congela sistemes) | **PARCIAL** — via pause-gate de diàleg | `bitmap_dlg_state` (pauseGateAsm) |
| Portes bloquejades + obertura + transició a room | **FET** (per clau) | `kind:'door'`, `bitmap_key_door_open_flags`, `bitmap_update_key_doors` |
| Claus/ítems + HUD | **FET** | `bitmap_key_count`, HUD `keyItem` |
| Missatge / text box typewriter | **FET** | sistema de diàleg (`bitmap_dlg_*`) |
| Transició de pantalla/room | **FET** | mecanisme de room destí de portes |
| Fases d'atac, punts febles, projectils del boss | **NO** | — |
| BossDefinition / Encounter separats de l'entitat | **NO** | — |
| Boss Editor com a diàleg propi | **FET** (asset `msx2boss`) | `components/editors/Msx2BossEditor.tsx` |

**Conclusió:** `openDoor`, `giveItem/giveKey`, `showMessage`, `setFlag`, `changeScreen` i
el `GAME_MODE_BOSS` es poden connectar a subsistemes **existents**. El gruix de feina nova
és: (a) separar BossDefinition/Encounter de l'entitat, (b) fases d'atac + punts febles +
projectils, (c) el Boss Editor UI.

---

## 16. Pla d'implementació per fases

Ordenat perquè cada fase sigui **compilable i verificable a OpenMSX** de manera aïllada,
i perquè una ROM sense boss segueixi **byte-idèntica** (regla de no-op del backend).

### Fase A — `onDefeated` (Boss Defeat Actions) sobre la Fase 1 actual
*Valor immediat, baix risc, reutilitza subsistemes existents.*

**Model de dades:** `onDefeated: BossDefeatAction[]` als params de l'entitat `bitmap_boss`
(encara sense separar Encounter; iteració mínima).

**Pipeline (comú):** a `msx2BitmapBossGenerator.ts`, cada room compila un **bytecode
d'accions** (`[opcode, arg...]` acabat en `END`), amb taula de punters
`bitmap_boss_defeat_ptr_table`. La rutina `bitmap_boss_run_defeat_actions` l'interpreta,
cridada des de `bitmap_boss_kill` just després de fixar `boss_defeated[room]=1`.
Opcodes: `END=#00`, `SET_FLAG=#01,idx`. **No-op:** sense `onDefeated`, 0 bytes nous
(ROM byte-idèntica).

#### Increment 1 — pipeline + `setFlag` — ✅ FET i verificat (2026-07-24)
- `setFlag` és **autocontingut**: taula `boss_flags[N]` pròpia del sistema boss (RAM
  persistent, encadenada després de `boss_defeated`; registre global de noms de flag).
- Verificat: TS net, glass.jar compila, i `test/msx2-boss/boss_kill.tcl` confirma en
  OpenMSX `boss_flags[0]=1` en morir el boss (fixture amb
  `onDefeated:[{action:'setFlag', flag:'boss_demon_defeated'}]`).

#### Increment 2 — accions cross-system — FET i verificat (2026-07-25)
Reutilització ASM injectada des del caller (`msx2Screen5BitmapRoomGenerator.ts`), que té
tots els subsistemes resolts:
- `openDoor` → escriure `1` a `bitmap_key_door_open_flags + offset` (offset via
  `doorOpenOffsetByEntityId`, a exposar des del sistema de portes) + redibuix.
- `giveKey` → incrementar `bitmap_key_count` (només si el sistema de claus és present).
- `showMessage` → text box del sistema de diàleg (`bitmap_dlg_*`) amb missatge estàtic
  (cal una via per a missatge no lligat a NPC; a validar).
- `changeScreen` → reutilitzar la transició de room de les portes (factoritzar un
  primitiu "queue transició a room N").
- Accions absents al projecte (sistema no present) → descartades a generació amb warning.

**Estat final:** les cinc accions estan implementades i exposades al Boss Editor.
`showMessage` obre un asset `msx2dialogue` amb `bitmap_dlg_open` (el mateix text box dels
NPC, amb typewriter i portrait); el col·lector de diàlegs ara també registra els diàlegs
que només fa servir un boss, així que **un món sense cap NPC parlant també pot tenir el
missatge del boss**. `changeScreen` reutilitza `start_key_door_transition` amb
`bitmap_pending_room` + entrada opcional (`entryX` buit = deixa el jugador on és), i
**atura el guió**: el que vingui després pertany a una sala que el jugador ja abandona.

Opcodes finals: `END=#00`, `SET_FLAG=#01,idx`, `GIVE_KEY=#02,n`, `OPEN_DOOR=#03,offset`,
`SHOW_MESSAGE=#04,dlg`, `CHANGE_SCREEN=#05,room,x,y`. Com que ja no tots ocupen 2 bytes,
el detector d'opcodes usats camina l'stream amb la mida real de cada instrucció (`DEFEAT_OP_ARGS`)
— amb el pas fix de 2 llegia arguments com si fossin opcodes.

> Verificat OpenMSX (`test/msx2-boss/boss_defeat_actions.tcl`): en morir el boss,
> `boss_flags[0]=1`, `bitmap_dlg_state=1` (text box obert) i `current_screen_index` passa
> de 1 a 2 amb l'entrada autoritzada. Stream generat:
> `#01 #00 | #04 #00 | #05 #02 #28 #50 | #00`. ROM sense aquestes accions: **byte-idèntica**.

> Gotcha d'autoria (avisada a generació): `showMessage` seguit de `changeScreen` deixa el
> text box obert mentre la sala canvia.

> Aquesta fase materialitza la conversa de veu (donar clau, obrir porta, missatge, flag,
> canvi de pantalla/món). L'increment 1 ja cobreix `setFlag`; l'increment 2, la resta.

### Fase B — Barrera de cadena (lock de sala) — ✅ FET i verificat (2026-07-24)

Enfocament escollit (idea de Jordi): en comptes de tocar els límits de pantalla, es
posa una **cadena visible al voltant de tota la room** — un únic tile 16×16 amb
col·lisió — que **desapareix en derrotar el boss**. Reutilitza el sistema de col·lisió
de tiles de runtime, sense cap cas especial de "no pots sortir de pantalla".

- **Model:** param `bossBarrierTileId` (entrada d'atlas 16×16) al boss. Taula per room
  `[present, sxLo, sxHi, syLo, syHi]`.
- **Apply (a `bitmap_boss_load`, boss armat):** recorre el perímetre (fila 0, fila 11,
  col 0, col 15) **tile a tile**; **NOMÉS** a les cel·les **buides** escriu el marcador
  de col·lisió `#80` (sòlid, no-deadly, fora del rang de valors de col·lisió del room) i
  hi pinta el tile de bloqueig amb HMMM. Les cel·les ja ocupades (paret/terra) es
  **salten del tot** (ni col·lisió ni dibuix) → **cap tile existent es matxaca**.
- **Remove (a `bitmap_boss_kill`):** recorre el perímetre tile a tile; **NOMÉS** a les
  cel·les que valen `#80` posa la col·lisió a 0 (reobre el pas) i restaura el gràfic des
  de la pàgina 1 (room neta). La resta no es toca. Cost RAM addicional: **5 bytes** (mode
  + sx/sy word); zero buffer gràcies al marcador auto-restaurable.
- **Verificat OpenMSX** (`test/msx2-boss/boss_kill.tcl`): durant la lluita el player
  queda tancat a la sala (mai canvia de room), obertures = `#80`, terra original
  preservat (`16`); en derrotar, obertures → `0`, terra intacte, cadena esborrada.
  Captures `boss_alive_` (cadena a tot el perímetre) i `boss_dead_` (room neta).

**Gotches registrats:** (1) marcador `#80` ha de quedar fora del rang de valors de
col·lisió del room (índexs de regió + bit deadly `#40` → ≤ `#7F`); (2) el spawn del
player ha de ser interior (el perímetre sencer queda sòlid); (3) el boss ha de patrullar
per l'interior perquè els seus restore-strips no esborrin la cadena de la vora.

> **Pendent opcional (no bloquejant):** formalitzar un byte `game_mode`
> (`PLAYING/DIALOGUE/BOSS`) unificant el pause-gate de diàleg existent, i `lockDoors`
> per-porta via `bitmap_key_door_open_flags`. El lock de sala ja el resol la cadena.

### Fase C — Separació BossDefinition / BossEncounter — ✅ FET i verificat (2026-07-24)

- **BossDefinition** = asset reutilitzable (`type: 'msx2boss'`, paràmetres a
  `data.params`): la plantilla del boss, autoritzada una vegada.
- **BossEncounter** = l'entitat `kind:'boss'` col·locada, que hi apunta amb
  **`bossId`** (o `bossDefinitionId`) i pot **sobreescriure** camps per instància
  (`hpOverride` → `bossHp`, i qualsevol altre paràmetre propi).
- `resolveBossParams` fa el merge: la definició posa els valors per defecte i
  l'encounter guanya — però **cadenes buides i arrays buits NO sobreescriuen** la
  plantilla, així una instància pot heretar-ho tot menys el que canvia de veritat.
- **Compatibilitat total:** un boss sense `bossId` funciona exactament com abans.
  Verificat amb `cmp`: la ROM del fixture inline queda **byte-idèntica**.
- Test: `test/msx2-boss/fixture_boss_def.json` (encounter amb només `bossId` +
  `hpOverride: 5`) → taula amb `hp = #05` i la resta heretada; emulador confirma
  `active=1 hp=5` amb la barrera activa.

### Fase D — Fases d'atac + projectils del boss

#### Planificador round-robin de frames (decisió d'arquitectura, Jordi)

El boss es comporta **com els enemics**: no fa tota la feina cada frame, sinó que la
reparteix en un cicle de frames, de manera que **cap frame paga alhora el HMMM gran del
cos i els blits de les bales**.

```
frame 0 → moviment + redibuix del COS (HMMM gran)
frame 1 → moviment de les bales SENARS
frame 2 → moviment de les bales PARELLS
frame 3 → LÒGICA del boss (canvi de fase/patrons)
```

**Estat:** implementat el repartiment **cos (cada 3 frames) ↔ bales (frames restants)**
(`bitmap_boss_off_frame`); el split senars/parells i el slot dedicat de lògica queden
pendents i requereixen passar d'una bala única a un **pool** de projectils.

#### Tipus de projectil: BITMAP vs SPRITE HARDWARE — triable a la UI

**Decisió (Jordi, 2026-07-24):** el tipus de bala ha de ser una **opció del Boss Editor**
(Fase F), i la via **preferent són els sprites hardware**, amb **diverses bales alhora**.

Motiu: SCREEN 5 va en **sprite mode 2 → 32 sprites, 8 per línia**; el límit real és per
*scanline*, no el total, i les bales del boss rarament comparteixen línia amb tot el
demés. La SAT (#F600, 4 bytes/sprite) ja té el layout
`[foreground][player layers][enemics][bales][terminador]`, amb marge per a un pool de
bales del boss.

Avantatges dels sprites hardware sobre el bitmap, tots dos importants:

| | Bitmap (HMMM) | Sprite hardware |
|---|---|---|
| Esborra el fons | **Sí** — cal scratch VRAM + save/restore | **No** — el VDP els compon a sobre |
| Cost per bala | 3 HMMM/frame (restore+save+draw) | escriure 4 bytes de SAT |
| Diverses alhora | car (blits multiplicats) | **barat** (és el cas d'ús natural) |
| Repartiment de frames | necessari | innecessari |
| Cost hardware | 0 sprites | 1 slot SAT + patró per bala |

**Decisió d'ús (Jordi):** es mantenen **les dues línies**, a triar per l'usuari:

- **`sprite`** → bales normals: **ràpides, diverses alhora**. Valor per defecte.
- **`bitmap`** → **bombes multicolor lentes** i **coets teledirigits** (lents però molt
  efectius). El bitmap permet més colors i mides que un sprite, i com que van lents, el
  cost dels blits i el save/restore de VRAM és perfectament assumible.

**Spec de les bales sprite** (per implementar):

- **Mida: sprite 16×16 amb el dibuix 8×8 centrat.** NO es canvia la mida de sprite del
  VDP (R#1) ni cap valor de VRAM de configuració: el projecte segueix en 16×16 i el patró
  de la bala porta el blob de 8×8 al centre (files 4..11, columnes 4..11), amb la resta
  transparent. Així la bala es veu petita sense tocar res global.
- `bossProjectileKind: 'sprite' | 'bitmap'` (defecte `sprite`).
- `bossProjectileMaxSlots`: nombre de bales simultànies (proposta: 2..4).
- **Assignació SAT — reutilitzar els slots dels enemics (decisió de Jordi):**
  durant un combat de boss **no hi ha altres enemics a la sala** (fins que el boss cau i
  es pot canviar de pantalla). Boss i enemics són doncs **mútuament excloents**, i les
  bales del boss poden **ocupar el rang de SAT dels enemics** en lloc de fer créixer la
  cadena. Categories de sprites a distingir explícitament:

  ```
  Player (+ capes)  |  bales del Player  |  fletxes del Player
  bales del BOSS    |  sprites d'enemics normals
                    ^--- mútuament excloents: comparteixen rang ---^
  ```

  **Classificació dels sprites (decisió de Jordi):** cal poder **distingir els sprites
  hardware entre ells**, i el mecanisme ja existeix: **l'asset Enemics** declara quins
  sprites fa servir, de manera que aquest registre identifica exactament **quins slots són
  els "modificables"** (reutilitzables). No cal endevinar-ho ni fixar-ho per convenció:
  el generador ja resol el rang d'enemics (`enemyData.maxSlots`, la seva base de SAT i els
  seus pattern groups), i aquest és precisament el rang que el boss pot reclamar.

  Conceptualment, cada sprite pertany a una **classe** amb un cicle de vida propi:

  | Classe | Vida | Reutilitzable pel boss |
  |---|---|---|
  | Player + capes | sempre | no |
  | Bales del Player | sempre | no |
  | Fletxes del Player | sempre | no |
  | Sprites d'enemics (asset Enemics) | només fora del combat de boss | **sí** |
  | Bales del Boss | només durant el combat | — |

  **Regla d'implementació segura:** reutilitzar el rang d'enemics **només quan la sala no
  té cap enemic col·locat**; si en té (autoria mixta), encadenar després del turret com a
  pla B en lloc de corrompre. Això fa la decisió automàtica i a prova d'errors d'autoria.
  ⚠️ Reservar slots sense escriure'n el SAT deixa el terminador `#D8` del sistema anterior
  al forat i **fa desaparèixer tots els sprites posteriors** (gotcha ja registrat).
- Runtime: pool de N, spawn apuntat al player, moviment rectilini, escriptura de SAT,
  dany al player amb el contracte saturat + i-frames, despawn en tocar tile sòlid o sortir
  de pantalla. Sense scratch VRAM ni repartiment de frames (el VDP els compon).

**Aspecte de la bala — seleccionable per l'usuari (Jordi):** el patró de la bala **no**
ha de ser fix. `bossProjectileSpriteId` referencia un **sprite del projecte** (mateix
resolver que les bales del player); si no se n'indica cap, s'usa el patró integrat amb el
blob 8×8 centrat. Per a la via bitmap, `bossProjectileTileId` tria l'entrada d'atlas.

**Animació de la bala sprite (2026-07-27):** si l'asset referenciat té més d'un frame
vàlid, el generador empaqueta tots els frames 16×16 consecutivament i reserva un pattern
group per frame. Cada bala viva conserva el seu propi índex de frame i comptador; el SAT
selecciona `patternBase + frame * 4`, i el retard es deriva de `animationSpeedMs` de
l'asset. Els projectils integrats o d'un sol frame conserven el pool original de 9 bytes;
només els animats afegeixen `frame` i `tick` al slot. Els colors de línia provenen del
frame actiu i es refresquen per slot abans d'actualitzar el patró del SAT.

**Estat:** **les dues vies implementades i verificades a OpenMSX** (2026-07-24).
La tria (`bossProjectileKind` + sprite/tile) l'exposarà el Boss Editor (Fase F).

#### Projectils bitmap — gotcha crític (via ja implementada)

> **GOTCHA (bug real trobat i corregit):** una bala bitmap **NO pot restaurar el fons des
> de la pàgina 1**. El cos del boss, la cadena de la barrera i altres overlays només
> existeixen a la pàgina visible, així que una restauració "de fons" **els esborra** allà
> on la bala hi passi per sobre.
> **Solució:** desar els píxels reals de sota la bala a un **rectangle scratch de VRAM**
> abans de dibuixar-la, i tornar-los a posar al frame següent (save → draw → restore).
> Seqüència per frame: `restore(old)` → moure → `save(new)` → `draw(new)`.

A més, la bala **desapareix en tocar un tile sòlid** (sonda a `bitmap_room_collision_map`
al seu centre): és bon disseny de joc (no travessa murs) i evita que se solapi amb la
cadena. *(Idea de Jordi; l'efecte de pols en impactar queda pendent.)*

#### Fases d'atac

Taula per room `[count, (hpAtOrBelow, interval, projSpeed) * count]` ordenada de més
malferit a menys; guanya la primera entrada amb `hpAtOrBelow >= boss_hp`. L'autoria fa
servir `enterWhenHpBelowPercent` (§6), convertit a HP absolut a generació.

##### Escalada per fase (2026-08-22)

Una fase que només pot dir "dispara més ràpid" es queda curta, i en un boss **només
làser** no deia absolutament res: la cadència de bala no hi arriba mai. Cada entrada pot
portar ara quatre bytes més — `[hpAtOrBelow, interval, projSpeed, shoot, laserInt,
bodyInt, moveSteps]`, stride 7 en comptes de 3:

| Byte | Camp autoria | 0 vol dir | Efecte |
|---|---|---|---|
| `shoot` | `shootId` (asset `msx2shoot`) | una bala apuntada | dispara un patró sencer (ventall, anell, ràfega) → **quantitat**, no només freqüència |
| `laserInt` | `laserInterval` | `bossLaserInterval` | les onades de làser tornen abans |
| `bodyInt` | `bodyInterval` | `bossInterval` | el cos s'actualitza més sovint (l'única palanca que costa VDP de veritat) |
| `moveSteps` | `moveStepMultiplier` (neutre = 1) | — | aplica el pas 2 o 3 cops per update |

**Byte-identitat**: `stripPhaseEscalation` retalla la taula als 3 bytes originals quan cap
sala del projecte fa servir cap override, i el runtime tria el stride amb el mateix flag
(`phaseTablesExtended`). Un projecte que no ho fa servir no paga ni un byte, i cap de les
rutines noves s'emet. Ho verifica `npm run test:msx2-boss-phases`, que genera les dues
variants i comprova que la variant "plana" **no conté** res de tot això.

`bitmap_boss_phase_apply` resol la fase UN cop per update de boss i la deixa a RAM
(`boss_phase_int/_spd/_shoot/_laser_int/_body_int/_move`). Es crida des de
`bitmap_boss_update_one`, abans del làser i de la porta de cadència, perquè un boss sense
config de projectils (i per tant sense IX) també pugui tenir fases.

> El pas de moviment segueix limitat a 2px: la neteja del rastre restaura franges al
> voltant del rectangle antic. `moveSteps` **no** aixeca aquest límit — repeteix el pas, i
> `bitmap_boss_strip_width` eixampla la franja (4/6/8px) perquè no quedi rastre. En un
> path, repetir el pas també escurça les pauses dels nodes.
>
> Les rutines de patró de tir (`bitmap_boss_shoot_*`) vivien dins del bloc de paths; ara
> s'emeten pel seu compte, perquè una fase pot nomenar un patró sense que el projecte
> tingui cap path. La posició dins d'un build amb paths no canvia (ROM idèntica).

#### Estat detallat
- `BossPhase[]` amb llindars de vida (`enterWhenHpBelowPercent`), patró de moviment i
  patró d'atac per fase. Runtime: seleccionar fase segons `boss_hp` i canviar
  moviment/cadència/projectil.
- Projectils del boss: pool propi (o reusar el pool d'enemics) amb el contracte de dany al
  jugador ja existent.
- Reutilitzar del `bossesGenerator` MSX1: model de fases/atacs (només canvia la capa de
  render, ja resolta).

### Fase E — Punts febles / zones de dany — ✅ FET i verificat (2026-07-24)

- `damageZones[]` a l'entitat boss: rectangles en **píxels locals del boss**
  `{ x, y, w, h, type, damageMultiplier }`. `type: 'invulnerable'` = armadura (la bala
  mor, 0 dany); qualsevol altre = punt feble (dany × `damageMultiplier`).
- Taula per room `[count, (x, y, w, h, kind, multiplier) * count]`; `bitmap_boss_zone_damage`
  la recorre i **guanya la primera coincidència** → cal declarar els punts febles **abans**
  de l'armadura que els conté. Una bala fora de tota zona fa el dany per defecte (1).
- `bitmap_boss_bullet_hit` ja no resta 1 fix: consulta la zona i resta els hits resultants
  (amb *overkill* → mort).
- **Verificat OpenMSX** amb el fixture (ulls ×2 com a punts febles, cos invulnerable):
  disparar al cos deixa `hp=3` (armadura), disparar a l'ull baixa `hp 3 → 1`.
  Smokes: `boss_kill_reliable.tcl` (cos) i `boss_zones_eye.tcl` (ull).
- **No-op:** sense `damageZones`, no s'emet ni la taula ni la rutina.

> Gotcha d'autoria: les coordenades són **locals al cos del boss**, no de pantalla.
> Gotcha de test: la bala avança 4px abans de comprovar la col·lisió, així que cal
> apuntar al **centre** de la zona, no a la vora, o el tret cau fora.

### Fase F — Boss Editor (UI) — FET (queden dos extres)

**Fet (autoria a l'entitat):** tots els paràmetres del sistema estan **declarats i
editables** a l'entrada `bitmap_boss` de `msx2EntityCatalog.ts`, agrupats i comentats per
seccions. Un autor pot configurar un boss complet des de l'editor d'entitats existent.

**Fet (diàleg dedicat):** `components/editors/Msx2BossEditor.tsx` — editor propi de
l'asset `msx2boss` (la BossDefinition de la Fase C), amb navegació per seccions
*General / Body & Graphics / Room Lock / Projectiles / Attack Phases / Damage Zones /
Defeat Actions*. Enganxat a `Toolbar` → `useAssetHandlers` (`createMsx2BossDefinition`) →
`EditorType.Msx2Boss` a `AppUI.tsx`. Inclou:
- **fases d'atac** (redissenyades el 2026-08-22): una targeta per fase amb la **banda
  d'HP que cobreix de veritat** (calculada amb l'ordre del runtime, no amb l'ordre de la
  llista), avís quan una fase queda tapada per una altra, avís quan hi ha un tram d'HP
  sense fase, i avís quan el path està en mode "només disparen els nodes" i per tant la
  cadència de la fase no s'aplica. La targeta **només mostra el que aquest boss pot fer**
  (`resolveBossAttacks`, que replica `resolveProjectile`/`resolveLaser` del generador):
  en un boss només-làser no hi ha cadència de bala perquè no en faria res,
- llista d'**accions de derrota** amb desplegables
  (`setFlag` / `giveKey` / `openDoor`, que són les que el generador sap emetre; el
  desplegable de portes només llista entitats `kind:'door'` reals),
- selector de sprite/tile per a la bala segons `bossProjectileKind`,
- **editor visual de zones de dany**: s'arrossega el rectangle sobre el cos i les zones
  noves s'insereixen **al principi** de la llista, que és l'ordre que guanya en runtime
  (punt feble per damunt de l'armadura).
- **previsualització gràfica** (2026-07-25): les entrades d'atlas es dibuixen a canvas a
  1 píxel MSX = 1 píxel de canvas, escalat per CSS amb `image-rendering: pixelated` i
  paleta de la room (color 0 = transparent, com a SCREEN 5). Es preveu el **cos** (una
  caixa per frame de la tira horitzontal), el **tile de barrera** en mosaic 3×3 (és un
  tile repetit, s'ha de jutjar tal com es veurà) i la **bala bitmap**. Al editor de zones
  el cos va **darrere** de la superfície d'arrossegament amb `pointer-events:none`, i si
  el boss té diversos frames hi ha un selector de frame de fons (un punt feble pot caure
  sobre una part que es mou).

> Verificat al navegador amb el fixture `test/msx2-boss/fixture_boss_def.json`:
> `boss_body_smoke` (64×64) es dibuixa amb 2366 px opacs de 4096 i 5 colors; amb
> `bossFrames = 2` surten dues caixes de 32×64 amb contingut diferent; la barrera
> `boss_chain_smoke` es repeteix 9 cops a 16×16; arrossegar (20,20)→(44,44) crea
> `zone_1` a 100px/125px amb escala 5. Sense errors nous de consola.

**Fet (moviment, 2026-07-25):** secció *Movement* amb `bossMovement`
(`static` / `patrolX` / `patrolY` / `patrolXY`, o buit = hereta el moviment de l'entitat
col·locada), `bossSpeed` (1..2 px/frame) i `bossRangePx` (recorregut des del spawn;
0 = els límits que ja porta l'entitat). **No calia tocar ASM**: el runtime ja rebota als
dos eixos i tracta `dx=dy=0` com a "quiet", així que el boss-torreta que només dispara i
la patrulla vertical/diagonal surten només de la taula per room.
> Verificat: ROM del fixture sense els params nous **byte-idèntica** (`cmp` amb
> `boss.rom`); `static` → `dx=#00 dy=#00`; `patrolY` speed 2 range 48 → `dx=#00 dy=#02`,
> `minY=#20 maxY=#50`. A OpenMSX (`test/msx2-boss/boss_move_modes.tcl`): static es queda
> a (64,32) durant tot el mostreig; patrolY oscil·la dins de y 32..80.
> **Camins lliures (waypoints) NO estan implementats** — caldria un mode de moviment nou
> al runtime del boss; el moviment actual és sempre rebot entre dos límits.

**Fet (biblioteca, 2026-07-25):** secció *Encounters* que llista tots els bosses
col·locats a qualsevol bitmap room, indica si segueixen aquesta definició, una altra o
són inline, i permet **assignar** (`bossId`) / **desvincular** i editar l'`hpOverride`
per instància. A *General*, botó **Duplicate this boss** (el clonatge ja reescriu
`data.id`/`data.name`, així que la còpia és referenciable de forma independent).

**Bugs trobats i corregits pel camí (2026-07-25):**
- `msx2boss` no estava al **Project Assets** (`FOLDER_TYPE_ORDER` /
  `FOLDER_DISPLAY_NAMES` / `FOLDER_NEW_LABELS` de `FileExplorerPanel.tsx`): els assets
  existien però no es veien a l'arbre.
- `getEditorTypeForAsset` (`useAssetHandlers.tsx`) no coneixia `msx2boss` → duplicar una
  definició obria `EditorType.None`.
- `resolveBitmapBossBulletSprite` llegia `bossProjectileSpriteId` **només de l'entitat
  col·locada**, així que el sprite de bala triat a la BossDefinition s'ignorava. Ara passa
  per `resolveBossParams` (exportat). Verificat: amb el sprite a la definició, la ROM emet
  el patró de l'usuari en comptes del blob integrat.
- El tipus de retorn de `collectBitmapKeyDoorRecords` no declarava
  `doorOpenOffsetByEntityId` (el camp sí que es retornava) → `tsc` fallava al fitxer.

**Pendent:**
- accions `showMessage` i `changeScreen` als desplegables, quan la Fase A increment 2 les
  implementi al generador,
- camins per waypoints i moviment sinusoïdal → **Fase G** (asset de paths + `pathId` per
  fase d'atac); avui el moviment del boss és només rebot lineal entre dos límits.

### Fase G — Paths de boss — INCREMENT 1 FET i verificat (2026-07-25)

**Fet:** asset `msx2bosspath` (nodes + accions per node), segments **lineals**, horneat a
stream amb re-mostreig per longitud d'arc i quantització amb residu, intèrpret Z80,
selecció de path **per fase d'atac**, i editor propi
(`components/editors/Msx2BossPathEditor.tsx`) que dibuixa els **passos ja quantitzats**,
no la línia ideal.

- Baker: `utils/msx2BossPath.ts` (`bakeBossPath`). Els límits són del **consumidor**
  (`BITMAP_BOSS_PATH_LIMITS`: ≤2 px i X parell per al cos bitmap), preparat per compilar
  el mateix path amb altres límits per a enemics amb sprite.
- Generador: `pathStreams` / `pathModes` / `pathSelTables` a `msx2BitmapBossGenerator.ts`,
  amb `bitmap_boss_path_wanted` / `_select` / `_sync` / `_step` / `_fire`.
- Selecció: `[default, count, (hpAtOrBelow, path)*]`, mateixes llindars i mateix ordre que
  la taula de fases → una sola passada, sense punters creuats. `0` = quiet, `#FF` = hereta.
- `firing: 'path'` silencia la cadència automàtica (a les dues vies de projectil).

> **Verificat**: ROM del fixture **byte-idèntica** sense paths (`cmp` amb `boss.rom`).
> Stream del rectangle: `#F2` + 32×`#A8` + `#F1 #14` + `#F2` + 16×`#8A` + `#F2` +
> 32×`#68` + `#F1 #14` + 16×`#86` + `#FF`. A OpenMSX
> (`test/msx2-boss/boss_path_trace.tcl`) el boss recorre 64,32 → 128,32 → 128,64 → 64,64
> i torna a començar; amb `firing:'path'` (`boss_path_fire.tcl`) apareixen bales al pool
> tot i tenir la cadència apagada; i forçant `boss_hp` (`boss_path_phase.tcl`) el path
> canvia 1 → 2 → 0 (quiet) segons la fase.

> **Gotcha real**: un path és una **forma relativa**, així que una path de fase comença
> allà on és el boss en aquell moment i **pot sortir de pantalla** encara que dibuixada
> des del spawn hi càpiga. El generador avisa fent-la caminar des del spawn, però és una
> comprovació de bona fe, no una garantia.

#### Increment 2 — segments sinusoïdals — FET i verificat (2026-07-25)

`Msx2BossPathNode.segment` descriu **com es viatja d'aquest node al següent**
(`{ mode: 'linear' | 'sine', amplitude, frequency }`), editable al panell del node. La
sinusoide cavalca la recta i afegeix `amplitude · sin(2π·f·t)` sobre la **normal del
segment**, o sigui que l'ona segueix la direcció dibuixada (un tram vertical ondula
esquerra/dreta) en comptes d'estar clavada a un eix. El nombre de mostres escala amb
`longitud + amplitud·freqüència·4`, perquè una ona densa necessita més resolució per
mesurar bé la longitud d'arc.

> Verificat: amplitud 16 / 2 ones sobre un tram de 96 px → `y` oscil·la ±16 amb el punt
> final exacte; a OpenMSX (`test/msx2-boss/boss_path_sine.tcl`) el boss ondula d'anada i
> torna recte, i el bucle tanca.

**Dos bugs reals que va destapar la prova a l'emulador:**
- Un bucle de **2 nodes** no afegia el tram de tornada (la condició era `> 2`), i com que
  el stream és una **forma relativa**, en arribar al `#FF` es reprodueix des d'on hagi
  acabat: el boss marxava cap a la dreta per sempre. Ara qualsevol `loop` amb ≥2 nodes
  tanca el circuit (amb 2 nodes surt un vaivé A→B→A).
- Amb deltes X **parells** obligatoris, un node amb X senar és inabastable i el bucle
  derivava 1 px per volta. Els nodes es **snapejen a X parell** al hornear, de manera que
  totes les voltes són idèntiques (i el cos del boss ja viu en X parell).

#### Increment 3 — corba suau (Catmull-Rom) i onion skin — FET (2026-07-25)

- Segment `spline`: Catmull-Rom que **passa pels nodes**, sense cap punt de control a
  col·locar. La tangent de cada extrem es dedueix dels veïns (amb *wrap* quan el recorregut
  és un bucle); en un camí obert, el primer i l'últim tram queden rectes perquè no tenen
  veí on recolzar-se. Verificat: mateix triangle 144 passos en recte i 150 amb corba, amb
  el bombament característic i el bucle tancant exacte.
- **Onion skin** a l'editor de paths (petició de Jordi): interruptor que dibuixa una
  **pantalla real de joc** darrere del recorregut, amb la llista de pantalles **activa
  només quan l'interruptor està encès**, i el **HUD** pintat a sobre si el projecte en té.
  El llenç passa a ser la pantalla sencera (256×212): banda de HUD de 20 files a dalt i
  l'àrea jugable de 192 a sota, amb la capa de nodes desplaçada per la banda **sense tocar
  les coordenades** (els nodes segueixen sent píxels d'àrea de joc). Reutilitza
  `drawScreen5BitmapRoomPreview` / `renderWidgetLayer` del Msx2HudEditor, ara exportats.

#### Increment 4 — MSX2 Shoots Definition — FET i verificat (2026-07-25)

Asset propi (`msx2shoot`, secció **MSX2 Shoots Definition** a Project Assets) on es defineix
un **patró de tir** reutilitzable, i que un node del path dispara **pel seu nom**. Pensat
també per a torretes i onades de naus més endavant.

- Patrons: `aimed` (torreta, apunta al jugador), `linear` (sempre la mateixa direcció) i
  `spread` (ventall de N bales al voltant de la mira).
- **Els angles són els 8 punts cardinals** i no és una simplificació de l'editor: el pool
  de bales guarda **un byte signat de velocitat per eix**, o sigui que una direcció ÉS una
  parella de signes. Angles fins demanarien velocitat fraccionària al pool.
- Record de 8 bytes `[pattern, count, dir, speed, off0, off1, off2, pad]`: els desplaçaments
  del ventall es **precalculen** (0, +1, −1), així el Z80 només suma un byte signat a un
  índex de direcció i consulta `bitmap_boss_dir_table`. La mira es resol amb una taula de
  9 bytes (signe de dy, signe de dx) → índex, no amb un arbre de decisions.
- L'opcode de tir passa a ser `#F2 s` (s = índex de patró, 0 = una bala apuntada), i com
  que **tots els opcodes tenen ara exactament 1 argument**, els walkers del stream avancen
  amb una constant en comptes de mirar quin opcode és.
- Només s'aplica a bales de **sprite hardware**: una bala bitmap no pot obrir-se en
  ventall, i es diu amb un warning a generació.

> Verificat OpenMSX (`test/msx2-boss/boss_shoot_pattern.tcl`): un `spread` de 3 amb speed 3
> posa 2 bales vives alhora amb velocitats diferents (`0,3` i `3,3` — recta i diagonal) i
> el `linear` cap avall dona exactament `0,2`. **2 i no 3 perquè el pool d'aquell projecte
> té 2 slots** (és `min(3, slots d'enemics)`): el generador avisa quan el ventall és més
> ample que el pool. Taules generades: `#02 #03 #04 #03 #00 #01 #FF #00` (ventall) i
> `#01 #01 #04 #02 ...` (recte avall). ROM sense patrons: **byte-idèntica**.

També, a petició de Jordi: amb un **path seleccionat**, els controls de patrol simple
(mode, velocitat, recorregut) queden **deshabilitats** al Boss Editor, perquè el path mana.

#### Increment 5 — pool de bales en punt fix 8.8 — FET (2026-07-25)

Primer pas cap als patrons que va dibuixar Jordi (**360° bullet fire** i **ràfaga de
dispar en angle**). El coll d'ampolla no era la SAT sinó el **format del pool**: amb un byte
signat de velocitat per eix només hi caben 8 direccions.

Slot de bala: **5 → 9 bytes**. Les parts fraccionàries van **al final**
(`+5 x frac, +6 y frac, +7 dx frac, +8 dy frac`), així tot el que ja llegia `x`/`y` a
`+1`/`+2` no s'ha tocat: només el pas de moviment passa a ser una suma de 16 bits
(`add` de la fracció + `adc` del píxel enter). La fracció de velocitat s'entrega al
spawner per RAM (`boss_sbul_dxf` / `boss_sbul_dyf`) perquè `B` és el comptador de cerca
de slot i no pot portar-la.

> Verificat OpenMSX (`test/msx2-boss/boss_fixed_point.tcl`): la cadència apuntada segueix
> disparant (462 frames amb bala viva, es mou quan `dx≠0`), els slots es reciclen i les
> fraccions arrenquen a zero. La ROM canvia respecte d'abans perquè el layout del pool ha
> canviat — no és un no-op i no pot ser-ho.

**Pressupost real mesurat** (build del fixture): la SAT va de #F600 a #F67F (32 sprites) i
se n'usen ~9 — jugador 4 capes (#F600), enemics 2 (#F610), plataforma 1 (#F618), bales del
jugador (#F61C). **Queden més de 20 slots lliures**, o sigui que el `min(3, slots
d'enemics)` del pool és un límit arbitrari que es pot calcular de veritat.

**El mur que queda és el de 8 sprites per línia**: un dispar radial neix tot al centre del
boss, o sigui a les mateixes línies, i a partir del novè sprite desapareixen fins que se
separen en vertical. La solució és la pròpia ràfaga: escalonar la sortida uns frames. Els
dos patrons del dibuix es necessiten mútuament.

**Pendent per completar els patrons dibuixats:** punts 1, 2, 3 i 5 → FETS a l'Increment 6.
Queda el 4 (pool creixent fins als slots de SAT realment lliures en comptes del cap de 3).

#### Increment 6 — anell de 16, radial i ràfaga — FET i verificat (2026-07-25)

Completa els dos patrons que va dibuixar Jordi. El pas 8.8 de l'Increment 5 era el format;
això és el que hi circula per dins.

- **Anell de 16 direccions** (`k * 22,5°`) en una taula de vectors unitaris **8.8**
  (`bitmap_boss_dir16_table`, 16 × 4 bytes: dx word, dy word, 1.0 = `#0100`). La velocitat
  s'aplica per **suma repetida** (speed 1..4), que surt més barat que qualsevol multiply
  i no gasta taula.
  > Efecte lateral volgut: els vectors ara estan **normalitzats**. Amb la taula antiga de
  > bytes sencers una diagonal viatjava √2 vegades més ràpid que una cardinal.
- **La mira es queda a 8 direccions** i es mapeja als **índexs parells** de l'anell: saber
  en quin dels 8 sectors és el jugador només demana el signe de cada eix (taula de 9
  bytes), i els índexs senars són els que fan que un ventall o un cercle es vegin rodons.
- **Record de patró reescrit**, mateixos 8 bytes:
  `[pattern, count, dir, speed, start, stride, burstCount, burstInterval]`.
  `start`/`stride` són passos d'anell **amb signe**, precalculats, i això fa que un ventall
  i un cercle sencer siguin **el mateix bucle**: `dir+start`, `+stride`, `+stride`… El
  ventall centrat ja no està limitat a 3 bales com quan eren offsets literals.
  - `spread`: `stride = spreadStep` (2 per defecte = els 45° d'abans), `start` = mig ventall enrere.
  - `radial`: `stride = round(16/N)`, `start = 0`.
- **Ràfaga**: `burstCount` onades cada `burstInterval` frames. RAM de la secció de tir
  7 → 10 bytes (`boss_burst_idx/left/cd`); `bitmap_boss_burst_tick` corre cada frame **fora
  del bucle del pool**, perquè disparar una onada reescriu IY. `bitmap_boss_sbul_load`
  neteja `boss_burst_idx`, així una ràfaga deguda no sobreviu al boss que la devia.

> **Bug arreglat de camí** (venia del commit del pool 8.8): els dos bucles que buiden el
> pool (`bitmap_boss_sbul_load` i `bitmap_boss_kill`) encara avançaven **de 5 en 5** amb
> l'slot ja a 9 bytes. Només es desactivava l'slot 0; els altres quedaven "actius" amb
> dades velles i es corrompien fraccions. Ara fan servir `BOSS_SBUL_SLOT_BYTES`.

> Verificat OpenMSX (`-romtype konami`), tres ROMs des de
> `scripts/build_msx2_boss_radial_burst_smoke.mjs`:
> - `--diagonal` (down-right, speed 2) → `dx=1 dxf=106 dy=1 dyf=106`, és a dir **1,414
>   px/frame** per eix = 2·sin45°. La taula antiga donava un `2,2` que era fals.
> - `--linear` (avall, speed 2) → `dx=0 dy=2` sense fracció: els eixos purs segueixen exactes.
> - radial de 4 amb ràfaga de 3 → velocitats **a 90°** l'una de l'altra (`1.106,1.106` i
>   `-2.150,1.106`, que és −1,414/+1,414), ràfaga viva 348 frames amb `left` 2→1→fi.
>   Només 2 bales alhora **perquè el pool d'aquell projecte en té 2**, i el generador ho
>   avisa a build suggerint precisament partir la volea en ràfega.

#### Formes predefinides al Path Editor (2026-08-22)

El panell **Shape** genera la ruta sencera a partir d'una forma: cercle, el·lipse,
rectangle, polígon regular (3–12 costats), estrella, zigzag i figura en 8 (∞).

- **No hi ha cap mode de corba nou.** La forma surt com a **nodes normals**, o sigui que ni
  `bakeBossPath`, ni el stream de bytes, ni el walker Z80 saben mai què és un "cercle". Un
  cercle generat costa exactament el mateix que el mateix recorregut dibuixat a mà, i cada
  node continua sent arrossegable i editable després.
- Les rodones arriben amb segments `spline` i les cantelludes amb recta: un pentàgon
  suavitzat ja no és un pentàgon.
- El que marca el cost de ROM és el **perímetre**, no el nombre de nodes: el mateix cercle
  amb 8 o amb 32 nodes ocupa els mateixos bytes.
- Generar **substitueix tota la ruta**; si algun node porta script, pregunta abans.
- Una forma tancada força `loopMode: 'loop'` (un cercle recorregut un sol cop és un arc).
  El zigzag és obert i respecta el mode que ja hi hagi.
- La previsualització verda sobre la ruta actual **passa pel baker**, així que el que es
  jutja abans de substituir res és exactament el que caminarà l'MSX.

Codi: `utils/msx2BossPathShapes.ts` (geometria pura, sense React) i el panell
`ShapeGenerator` dins `components/editors/Msx2BossPathEditor.tsx`.
Contractes: `npm run test:msx2-boss-path-shapes` (geometria + lap compilat) i
`npm run test:msx2-boss-path-shapes-ui` (el panell, contra un dev server).

**Pendent de la Fase G:** segments `bezier` amb punt de control, RLE del stream,
`pingpong`, i el compilat per a onades d'enemics (el mateix asset de tir hi encaixa).

### Disseny original de la Fase G

Idea de Jordi (2026-07-25): en comptes d'afegir modes de moviment un a un (sinusoïdal,
circular...), fer un **asset de recorregut** reutilitzable i que **cada fase d'atac triï
quin path segueix** — o `None`, i llavors el boss és estàtic durant aquella fase.

#### Model de dades

- **Asset nou `msx2bosspath`**: llista de **nodes** `{x, y}` en píxels de la sala, i per a
  **cada segment** (node *i* → node *i+1*) el **tipus de moviment**:
  `linear` | `sine` (amplitud + freqüència, perpendicular al segment) | `bezier` (un punt
  de control arrossegable) | `spline` (Catmull-Rom, la corba passa pels nodes sense punts
  de control). Més `speedPxPerTick` i mode de bucle (`loop` / `pingpong` / `once`).
- **`BossPhase.pathId`**: desplegable a la taula de fases del Boss Editor;
  buit/`none` = el boss es queda quiet en aquella fase.
- El moviment "clàssic" (`bossMovement`) es manté com a via simple; el path guanya quan
  la fase activa en té un.

#### Com arribar de A a B amb una corba, i què es precalcula

**Res de matemàtiques a runtime.** Tota la corba es genera en TypeScript i s'hi baixa una
**llista de passos ja quantitzats**; el Z80 només llegeix bytes i suma.

Fórmules per segment (totes avaluades amb `t` de 0 a 1 a generació):

| Tipus | Fórmula | Quan va bé |
|---|---|---|
| `linear` | `P = A + (B-A)·t` | trams rectes |
| `sine` | `d = normalitza(B-A)`, `n = (-d.y, d.x)`, `P = A + d·L·t + n·amp·sin(2π·f·t)` | ones, vol de mosca |
| `bezier` quadràtica | `P = (1-t)²·A + 2(1-t)t·C + t²·B` | arcs controlats amb 1 punt |
| `spline` Catmull-Rom | `P = ½·(2P₁ + (P₂-P₀)t + (2P₀-5P₁+4P₂-P₃)t² + (-P₀+3P₁-3P₂+P₃)t³)` | corba suau que **passa pels nodes**, zero punts de control |

Després de la corba, **dos passos imprescindibles**:

1. **Re-mostreig per longitud d'arc**: recórrer la corba amb `t` fi (p.ex. 256 passos),
   acumular distància, i emetre un punt cada cop que s'acumula `speedPxPerTick`. Sense
   això el boss accelera als trams rectes i frena a les corbes (paràmetre ≠ velocitat).
2. **Quantització a deltes enters amb residu acumulat** (estil Bresenham): guardar la part
   fraccionària perquè el camí no derivi. Els deltes es **claven a ≤2 px**, que és el
   límit real de les franges de restauració de 4 px — així és **impossible autoritzar un
   path il·legal**: la restricció es compleix al generador, no a runtime.

#### Codificació proposada

Un byte per tick de cos (el cos es mou/redibuixa cada `bossInterval` frames, per defecte 3
→ 20 passos/segon):

```
bits 7..4 : dx + 8   (delta X, -2..+2 → val 6..10)
bits 3..0 : dy + 8   (delta Y, -2..+2)
byte #FF  : fi del path (aplica el mode de bucle)
```

Amb **RLE** al damunt (`[comptador, byte de pas]`) els trams rectes surten pràcticament
gratis: un path de 10 segons són 200 passos = 200 bytes en cru, i típicament < 80 amb RLE.
Taula de punters `bitmap_boss_path_ptr_table` com la resta de subsistemes.

RAM de runtime: punter al path (2) + cursor (2) + repeticions RLE pendents (1) + mode/estat
(1) ≈ **6 bytes**, encadenats després de l'estat del boss.

> **Gotcha a respectar**: el generador ja arrodoneix la X del cos a parell (`even()`) per
> al HMMM; convé que els deltes X siguin **parells** (-2, 0, +2) perquè la restauració de
> franges quedi alineada. Els deltes Y poden ser 1.

#### Accions per node (idea de Jordi, 2026-07-25)

Cada **node** del path pot portar una **llista ordenada d'accions** que s'executen quan el
boss hi arriba, i quan s'acaba la llista es reprèn el moviment. El path deixa de ser només
una geometria i passa a ser un **guió**: "vés fins aquí, atura't 30 frames, dispara tres
cops, continua".

Accions previstes: `wait <frames>`, `fire <mode>` (apuntat al jugador / direcció fixa /
ràfega), `setAnimFrame <n>`, `setSpeed <px>`, `jumpTo <node>` (bucles interns).

**Codificació: al mateix stream, amb byte d'escapada.** Els passos de moviment mai poden
tenir el nibble alt a `#F` (dx+8 va de 6 a 10), així que tot el rang `#F0..#FF` queda
lliure per a opcodes:

```
#00..#EF : pas de moviment  (nibble alt = dx+8, nibble baix = dy+8)
#F1 n    : wait n ticks          #F2 mode : fire
#F3 px   : set speed             #F4 n    : set anim frame
#F5 idx  : jump to step idx      #FF      : fi (aplica el mode de bucle)
```

Un sol cursor, una sola taula, cap estructura paral·lela: l'intèrpret llegeix un byte i,
si és `< #F0`, suma els nibbles; si no, salta a la taula d'opcodes. Cost de runtime
negligible i s'executa al mateix tick de cos que ja existeix. Durant un `wait`, `dx=dy=0`
→ **no hi ha blit del cos**, o sigui que les pauses són gratis en VDP.

> **Conflicte de disseny a resoldre:** el `fire` per node i la cadència automàtica de la
> fase (`bossShootInterval` / `BossPhase.interval`) es trepitgen. Proposta: flag per path
> `firing: 'auto' | 'path'`; amb `'path'`, la cadència automàtica queda desactivada mentre
> aquella fase segueixi el path, i els trets els mana el guió.

#### Extrapolació a enemics (shoot'em up)

El mateix asset serveix per a **onades d'enemics** estil Galaga/R-Type: un enemic amb
punter a path i cursor propi. Dos matisos:

- **La geometria és compartida; el horneat NO.** El clamp de 2 px i la X parell són
  restriccions del **cos bitmap del boss** (franges de restauració + HMMM). Un enemic amb
  sprite hardware no en té cap: pot moure's 4-8 px per frame i amb X senar. Per tant el
  path asset ha de guardar la **geometria** (nodes, tipus de segment, velocitat en px/tick)
  i el generador ha de **compilar un stream per consumidor**, amb el seu propi límit.
- **Formacions**: N enemics poden compartir el mateix stream amb un **desfasament de
  ticks** d'entrada (cursor inicial diferent), que és exactament com es fan les onades
  clàssiques. RAM per enemic: punter (2) + cursor (2) + repeticions RLE (1) + wait (1).

#### Editor

Dibuixar el path **sobre la previsualització de la room** (ja existeix el renderer de
rooms bitmap a `Msx2HudEditor.tsx`), arrossegant nodes i punts de control, amb el desplegable
de tipus de moviment **per segment** i una previsualització animada del recorregut ja
quantitzat (que és exactament el que veurà l'MSX). En **clicar un node** s'obre la seva
llista d'accions (pausa, dispar, anim, salt), com la llista d'accions de derrota.

#### Sinusoïdal "simple" — decisió

El mode sinusoïdal solt **no s'implementa com a `bossMovement`**: queda cobert com a tipus
de segment dins dels paths, que és on l'usuari el vol de veritat.

### Ordre recomanat i criteri
`A → B → C → D → E → F → G`. A i B donen valor jugable de seguida sobre la Fase 1 ja
verificada; C prepara la reutilització; D i E són el "cor" del combat de boss; F és
l'ergonomia d'autoria. Cada fase: compila amb `glass.jar`, verifica a OpenMSX, i deixa la
ROM sense boss byte-idèntica.

### Intro Sequence — automoviment i segellat raster (2026-07-27)

Cada entrada a una sala amb boss viu reinicia la seqüència, sense flag persistent:

`entrada → caminar automàticament al centre X → Room Lock → combat`

- L'automoviment força només esquerra/dreta; reutilitza la física normal, de manera que
  la gravetat i les col·lisions continuen actives.
- `closeBarrier(animated=true)` ja no recorre cel·les des de les cantonades. Revela el
  tile de barrera amb un **raster de píxel horitzontal** de `Y=0` a `Y=191`.
- `linesPerFrame` controla la velocitat (1..16, per defecte 4). El camp antic
  `cellsPerFrame` es llegeix com a àlies compatible.
- El raster només visita cel·les buides del perímetre. No omple l'interior de la sala.
- La marca de col·lisió `#80` s'activa quan apareix la línia 16 de cada cel·la, no abans.
- `animated=false` conserva el tancament immediat en un sol pas.

### Death FX — explosions bitmap sobre el boss (2026-07-28)

Quan la vida arriba a zero, el boss no desapareix instantàniament si té assets
configurats. El runtime passa `boss_active` de `1` (combat) a `2` (mort), congela
el cos i retira tots els projectils. Després:

1. Tria pseudoaleatòriament un dels `bossDeathExplosionStampIds`.
2. Tria una posició que manté el stamp completament dins del rectangle del cos.
3. El compon amb V9938 `LMMM + TIMP` (`#98`), de manera que el color 0 és
   transparent i les explosions anteriors continuen visibles.
4. Repeteix `bossDeathExplosionCount` vegades, cada
   `bossDeathExplosionInterval` frames.
5. Espera `bossDeathExplosionHoldFrames`, restaura el rectangle complet, elimina
   la barrera i executa `onDefeated`.

La taula de cada sala guarda només `assetCount, count, interval, hold` i sis bytes
per stamp (`SX, SY, W, H`). El runtime afegeix tres bytes RAM (`left`, `tick`,
`seed`). Sense stamps vàlids, conserva la derrota immediata anterior.

#### Explosions animades (2026-08-03)

Amb `bossDeathExplosionAnimated`, la mateixa llista deixa de ser un conjunt de
variants i passa a ser **els fotogrames ordenats d'UNA explosió** (2 o 3, tots de
la mateixa mida i amplada parella). Per defecte s'usa el mode compacte: cada blast
estampa el fotograma següent a una posició pseudoaleatòria. Després de l'últim
fotograma, un pas implícit reconstrueix el bitmap complet del Boss des del seu atlas
amb un `HMMM` opac; així desapareixen tots els fotogrames de l'explosió anterior
sense copiar el fons de la sala. El mateix pas neteja l'última explosió abans del
`final hold`. El bit 7 de `assetCount` identifica aquesta seqüència ordenada; els
7 bits baixos compten els fotogrames més el pas implícit, que no ocupa cap record
de bitmap addicional a la ROM.

Amb `bossDeathExplosionConcurrent=true`, fins a **3 explosions** viuen alhora,
cadascuna en un slot de 5 bytes RAM (`active, frame, timer, rx, ry`) situat a un
desplaçament parell aleatori dins del cos congelat:

1. Cada `bossDeathExplosionInterval` frames neix una explosió en un slot lliure.
2. Cada `bossDeathExplosionFrameDelay` frames avança un fotograma: primer
   **esborra** el rectangle actual repintant el tros de cos des de l'atlas
   (`HMMM` opac, per això cal amplada parella) i després estampa el fotograma nou
   amb `LMMM + TIMP`.
3. En acabar l'últim fotograma el slot queda lliure i el cos torna a estar net;
   les explosions no s'acumulen.
4. Quan ja no queden explosions per llançar i tots els slots han acabat,
   `boss_death_left` passa a `#FF`, corre `bossDeathExplosionHoldFrames` i llavors
   finalitza com sempre (restaura el cos, treu la barrera, executa `onDefeated`).

**Pressupost VDP**: només **un** slot avança per frame (dues ordres) i cap
explosió neix en un frame que ja n'ha avançat una; els slots que vencen en un
frame ocupat reintenten al següent. Això manté el jugador a 60fps mentre el boss
mor.

La capçalera de la taula creix a sis bytes (`frameCount, count, interval, hold,
frameDelay, animFlag`) **només** si algun boss del projecte activa el mode
concurrent; si no, es retalla als quatre bytes. En un projecte mixt les sales
legacy/compactes comparteixen la capçalera de sis bytes i `animFlag = 0` les
envia al camí lleuger.

Verificat a OpenMSX amb `test/msx2-boss/make_death_anim_fixture.py` (camí animat)
i `make_death_mixed_fixture.py` (camí legacy dins d'una build animada).

Si `bossDeathExplosionAnimated` està actiu però la llista de stamps és buida,
el generador injecta tres explosions bitmap de 16x16 incorporades i les executa
pel camí legacy compacte. Així una configuració incompleta continua mostrant la
mort del boss sense carregar el runtime animat resident; quan hi ha stamps
seleccionats, aquests substitueixen el fallback i activen l'animació completa.

#### So d'explosió PSG (2026-08-03)

`bossDeathExplosionSoundAssetId` permet seleccionar qualsevol asset `Sound FX`
des de la secció **Death FX**. Cada blast visible reinicia el so al canal PSG C,
que és el canal reservat pels efectes de joc a SCREEN 5. El compilador remapeja
el primer canal no buit de l'asset a C i genera registres compactes
`duration,R4,R5,R6,R10,R7-C-bits`; no escriu R11-R13 en sons personalitzats,
perquè l'envolvent AY és global i podria alterar la música dels canals A/B.

Si el camp és buit, l'asset no existeix o no té passos reproduïbles, el runtime
usa una explosió MSX2 integrada: soroll al canal C amb envolvent de decaïment.
El fallback només ocupa una petita rutina de parelles registre/valor. La seva
ombra de R7 es combina amb la música, de manera que la següent actualització del
tracker conserva A/B i només adopta els bits de to/soroll de C.

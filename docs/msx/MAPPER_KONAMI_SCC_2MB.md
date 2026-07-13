# Mapper Konami SCC 2MB (referència Pampas & Selene)

Investigació i implementació del mapper de 2MB per als MegaROM MSX2 SCREEN 5
bitmap de Mideas (branca `mapper_2m`, 2026-07-13).

## Conclusió de la investigació

- El cartutx **físic** de Pampas & Selene usa el mapper **Konami SCC estàndard
  de 2MB** (per això el bolcat del cartutx funciona a Carnivore2). El mapper
  **Konami Ultimate Collection (KUC)** de Manuel Pazos només s'usa a les
  versions digitals/emulador del joc.
- El KUC és un **superconjunt del Konami SCC**: al reset (registres a 0)
  es comporta exactament com un Konami SCC. Els seus registres extra
  (`#7FFE` offset, `#7FFF` mapper/A20-A21) només calen per adreçar més de
  2MB de flash (fins a 8MB).
- Per tant: **un ROM Konami SCC de 2MB funciona a openMSX, Carnivore2,
  MegaFlashROM, Yamanooto i també en hardware KUC.** És l'objectiu de Mideas.

## Especificació Konami SCC (la que emet Mideas per SCREEN 5 bitmap)

- 4 finestres de 8KB commutables:

| Finestra      | Registre (rang d'escriptura) | Valor al reset |
|---------------|------------------------------|----------------|
| `#4000-#5FFF` | `#5000-#57FF`                | banc 0         |
| `#6000-#7FFF` | `#7000-#77FF`                | banc 1         |
| `#8000-#9FFF` | `#9000-#97FF`                | banc 2         |
| `#A000-#BFFF` | `#B000-#B7FF`                | banc 3         |

- Registre de banc de **8 bits** → 256 bancs × 8KB = **2MB**.
- **SCC**: escriure `#3F` al registre `#9000` fa aparèixer l'SCC a
  `#9800-#9FFD` (lectura i escriptura). Waveforms a `#9800-#987F`.

### Gotcha crític: bancs "finestra SCC"

Mentre el registre de la finestra P2 (`#9000`) contingui un valor amb els
**6 bits baixos a `#3F`** (bancs `#3F`, `#7F`, `#BF`, `#FF`), les lectures de
`#9800-#9FFF` retornen registres SCC en lloc de ROM. Com que Mideas llegeix
els bancs de dades per la finestra P2, **el packer no assigna mai dades a
aquests 4 números de banc** (queden com padding `#FF`, cost: 32KB de 2MB).
Vegeu `packBitmapRoomDataBanks` / `isSccWindowBank` a
`utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts`.

### Compatibilitat amb Konami4

Els registres que emet Mideas (`#7000/#9000/#B000`, i `#5000` amb valor 0)
cauen dins de les finestres d'escriptura del Konami4 clàssic (que commuta amb
qualsevol adreça del rang de 8KB, i ignora `#5000` perquè el banc 0 és fix).
Resultat verificat a OpenMSX: el mateix ROM arrenca i juga idèntic amb
`-romtype konami` i `-romtype KonamiSCC`. El romtype canònic a partir d'ara
és **KonamiSCC** (necessari per a l'SCC i per a mides > 256KB en hardware real).

## Especificació KUC (per si mai cal >2MB)

Documentació de Manuel Pazos (dins d'openMSX, `KonamiUltimateCollection.cc`):

```
[OFFSET REGISTER (#7FFE)]  bits 7-0: bank offset (se suma al registre de banc)
[MAPPER REGISTER (#7FFF)]
  7  A21 \  línies d'adreça de la flash per commutar blocs de 2MB
  6  A20 /
  5  Mode mapper: 0=Konami SCC, 1=Konami (només canvia el rang dels registres;
     l'SCC sempre està disponible)
  4  Flash write enable
  3  Desactiva mapper #4000-#5FFF en mode Konami / activa DAC
  2  Desactiva el mapper register
  1  Desactiva el bank switching
  0  (sense funció)
```

Adreça física = `(mapperReg & #C0) << 15 | (banc + offset) << 13 | offset13`.
openMSX: `-romtype KonamiUltimateCollection`.

## Recepta de verificació (OpenMSX)

```
python scripts/build_mideas_unified_rom.py --json <fixture>.json --project-root . \
    --asm-output out.asm --rom-output out.rom --allow-tsc-errors \
    --rom-mode megarom --target-format konami
openmsx -machine C-BIOS_MSX2 -carta out.rom -romtype KonamiSCC -script smoke.tcl
```

Smoke validat 2026-07-13 amb `test/msx2-destroy/fixture_base.json`:
boot + menú Game Flow (SPACE) + moviment del jugador (px `#C001`: 147→195
mantenint DRETA) + render correcte de sala i HUD
(`test/mapper-2m/smoke_kscc.tcl`).

## Fases

- **Fase 1 (FETA)**: mapper Konami SCC 2MB com a default de la ruta SCREEN 5
  bitmap. So PSG intacte.
- **Fase 2 (pendent)**: integrar el driver SCC ja validat
  (`test/scc/scc_driver.inc`, `sccSoundGenerator.ts`) — ara el mapper ja
  exposa l'SCC del propi cartutx (`#3F` → `#9000` amb push/pop del banc P2).

## Fonts

- openMSX `src/memory/KonamiUltimateCollection.cc` (docs de Manuel Pazos)
- https://github.com/openMSX/openMSX/issues/1031
- https://www.msx.org/forum/msx-talk/software/pampas-selene-on-carnivore2
- https://www.msx.org/forum/msx-talk/openmsx/about-extension-konami-ultimate-collection-in-openmsx

# Mideas SCC Konami Study

Estudi tecnic per preparar suport SCC original de Konami dins de Mideas sense modificar encara el comportament principal de l'aplicacio.

## Objectiu i abast

Mideas ja te editor React + TypeScript, preview PC, assets de joc i generacio ASM Z80/ROM per MSX. Aquest document defineix una arquitectura segura per afegir una futura linia musical PSG + SCC pensada per ROMs Konami SCC i hardware compatible com MegaFlashROM SCC, Carnivore2, RISKYMSX i openMSX.

En aquesta fase no s'implementa cap tracker complet, runtime SCC ni canvi funcional. La intencio es deixar clars els contractes abans de tocar generadors ASM.

## 1. Que es SCC de Konami

SCC, habitualment "Sound Creative Chip" o "Sound Custom Chip", es un xip de so wavetable usat per Konami en cartutxos MSX. Aporta cinc canals addicionals que es poden combinar amb els tres canals PSG AY-3-8910 del MSX.

Caracteristiques rellevants:

- 5 canals wavetable.
- Cada waveform te 32 bytes i representa un periode complet de l'ona.
- Volum independent per canal, 0..15.
- Frequencia/periode independent per canal.
- Registre de mixer/activacio amb un bit per canal.
- La waveform es ciclica: el xip recorre els indexs 0..31 i torna a 0.
- Les mostres de waveform s'han de tractar internament com a valors signed de 8 bits `-128..127`. Si la UI o algun importador usa `0..255`, cal convertir amb una regla explicita.

Limitacio important del SCC original:

- El SCC original nomes te quatre buffers de waveform per a cinc canals.
- El canal 4 i el canal 5 comparteixen la mateixa waveform a `9860h-987Fh`.
- Aixo vol dir que poden tenir periode i volum diferents, pero no timbres independents en SCC original.

Diferencia SCC original vs SCC+:

- SCC original: canals 4 i 5 comparteixen waveform.
- SCC+ / SCC-I: pot oferir cinc waveforms independents i modes addicionals.
- Per a Mideas, la fase inicial ha d'apuntar a SCC original compatible. SCC+ ha de quedar com una fase posterior per evitar generar musica que soni be en SCC+ pero malament en cartutxos SCC normals.

## 2. Mapa de registres SCC

Mapa minim per mode SCC compatible:

| Rang/adreca | Acces | Funcio |
| --- | --- | --- |
| `9000h` | W | Seleccio/activacio SCC en cartutxos Konami. Escriure `3Fh` quan cal exposar SCC a `9800h-9FFFh`. En documentacio tecnica tambe apareix com a qualsevol adreca del rang `9000h-97FFh`. |
| `9800h-981Fh` | R/W | Waveform canal 1, 32 bytes. |
| `9820h-983Fh` | R/W | Waveform canal 2, 32 bytes. |
| `9840h-985Fh` | R/W | Waveform canal 3, 32 bytes. |
| `9860h-987Fh` | R/W | Waveform compartida canals 4/5 en SCC original, 32 bytes. |
| `9880h-9881h` | W | Periode/frequencia canal 1, 12 bits, low byte primer. |
| `9882h-9883h` | W | Periode/frequencia canal 2. |
| `9884h-9885h` | W | Periode/frequencia canal 3. |
| `9886h-9887h` | W | Periode/frequencia canal 4. |
| `9888h-9889h` | W | Periode/frequencia canal 5. |
| `988Ah` | W | Volum canal 1, low nibble 0..15. |
| `988Bh` | W | Volum canal 2. |
| `988Ch` | W | Volum canal 3. |
| `988Dh` | W | Volum canal 4. |
| `988Eh` | W | Volum canal 5. |
| `988Fh` | W | Mixer / activacio canals. Bits 0..4 activen canals 1..5. Bits 5..7 no s'han d'usar en SCC minim. |

Notes practiques:

- Els registres de periode son divisors de 12 bits. El byte baix va a l'adreca parell i el nibble baix del byte alt va a l'adreca seguent.
- Formula documentada habitual: `f_tone = 3579545 / (32 * (period + 1))`.
- Com mes gran es el periode, mes greu es la nota.
- En SCC original, escriure una waveform per canal 4 modifica tambe el timbre efectiu del canal 5.
- Les zones `9890h-989Fh` poden apareixer com a miralls de `9880h-988Fh`; el driver minim de Mideas no les ha d'usar.
- El registre de deformacio/test `98E0h-98FFh` queda fora de la fase SCC minima.

## 3. Proposta d'arquitectura per Mideas

Separar el suport SCC en tres capes: model TypeScript, preview PC i exportador ASM.

### A. Model TypeScript d'audio SCC

El repo ja te base SCC a `types.ts`:

- `SCCChannelId = '1' | '2' | '3' | '4' | '5'`.
- `TrackerSongData.soundChip: 'PSG' | 'SCC'`.
- `SCCInstrument` amb `waveform: number[]`, `volume?: number`, `volumeEnvelope?: number[]` i `volumeLoop?: number`.

Proposta de model futur, compatible amb el que ja existeix:

```ts
export type SCCSample = number; // signed int8, -128..127

export interface SCCWaveform {
  id: string;
  name: string;
  samples: SCCSample[]; // exactament 32 valors signed
}

export interface SCCInstrument {
  id: number;
  name: string;
  waveformId: string;
  defaultVolume: number; // 0..15
  volumeMacro?: number[];
  pitchMacro?: number[];
  vibratoMacro?: number[];
}

export interface SCCNoteEvent {
  note: string | null;
  durationFrames: number;
  instrument: number | null;
  volume: number | null;
}

export interface SCCTrack {
  channel: '1' | '2' | '3' | '4' | '5';
  events: SCCNoteEvent[];
}

export interface SCCPattern {
  id: string;
  rows: SCCTrack[];
}

export interface SCCSong {
  id: string;
  title: string;
  speed: number;
  order: number[];
  patterns: SCCPattern[];
  waveforms: SCCWaveform[];
  instruments: SCCInstrument[];
}
```

Decisio recomanada sobre signed/unsigned:

- Model intern: signed `-128..127`, perque representa millor la forma d'ona centrada a zero i encaixa amb implementacions SCC que exposen `int8_t data[32]`.
- Import/export: acceptar `0..255` nomes en adaptadors i normalitzar immediatament a signed.
- UI: pot mostrar signed o una vista normalitzada, pero ha de guardar dades canoniques signed.

Adaptacio al repo actual:

- No cal substituir ara `TrackerSongData`.
- A Fase 1 es pot ampliar `SCCInstrument` gradualment o afegir tipus SCC especifics en un fitxer dedicat.
- Evitar un refactor massiu de `types.ts`; si els tipus SCC creixen, crear `utils/audio/sccTypes.ts` o `components/utils/sccTypes.ts` i despres integrar-los al model global.

### B. Preview PC

El repo ja te `components/utils/sccSynthesizer.ts`, que es el lloc natural per evolucionar la simulacio SCC de preview.

Primera versio simple:

- 5 oscil.ladors wavetable.
- Una fase acumulada per canal.
- Index `0..31` dins la waveform.
- Lectura de mostra signed i escalat a `[-1, 1]`.
- Volum per canal 0..15 i volum global.
- Mescla simple dels canals amb limitador suau per evitar clipping.
- Recarregar waveform nomes en note-on o canvi d'instrument, no cada tick.

Esquema conceptual:

```ts
phase[channel] += frequency[channel] / sampleRate;
waveIndex = Math.floor((phase[channel] % 1) * 32);
sample += waveform[waveIndex] / 128 * (volume[channel] / 15);
```

Limitacions acceptables de la primera versio:

- No cal emular exactament aliasing, DAC, distorsio ni deformacio SCC.
- No cal SCC+.
- No cal wave morphing avancat.

Futura fidelitat:

- Portar emu2212 a WASM o integrar una implementacio mes fidel.
- Fer comparacions auditives i, si es possible, logs de registres contra openMSX.
- Mantenir el preview simple com a fallback si el backend fidel pesa massa.

### C. Exportador ASM

El repo actual te `utils/msxGenerator/generators/soundGenerator.ts` per musica PSG nativa i PT3 extern. Tambe existeix `utils/asmTemplateGenerator.ts`, on avui es filtren tracks no-PSG.

Regles per l'exportador SCC:

- Generar dades compactes de musica, no una llista gegant d'escriptures crues a registres.
- El driver ASM processa una vegada per frame.
- El driver escriu registres SCC nomes quan hi ha canvis.
- Les waveforms es carreguen nomes quan canvia l'instrument efectiu del canal.
- La taula de periodes ha d'estar precomputada en ROM.
- El Z80 no ha de fer calcul musical pesat en runtime.
- El codi que toca SCC ha d'estar centralitzat.
- Qualsevol rutina que canvii banc ha de restaurar el banc esperat abans de retornar.

Format de dades recomanat per Fase 1:

- Taula de periodes per notes suportades.
- Taula de waveforms uniques de 32 bytes.
- Taula d'instruments: `waveformIndex`, `defaultVolume`, flags reservats.
- Patrons amb files comprimides per canal:
  - note index o `REST/HOLD`;
  - instrument index opcional;
  - volume opcional;
  - durada/tick segons el model de tracker existent.

No recomanat:

- Exportar per frame totes les escriptures `ld (98xxh),a`.
- Recarregar 32 bytes de waveform en cada fila si l'instrument no canvia.
- Executar copies llargues de waveform dins `H.TIMI`.

## 4. Proposta de driver ASM minim

Totes les rutines generades han de portar capcalera de contracte. Mideas ja ha tingut bugs per preservacio incorrecta de registres; SCC no ha d'afegir mes superficie opaca.

### SCC_Init

```asm
; -----------------------------------------------------------------------------
; SCC_Init
; What:
;   Enable SCC register access for a Konami SCC cartridge and silence channels.
; Inputs:
;   None for the first Mideas MVP. Future: selected cartridge slot/bank state.
; Outputs:
;   SCC exposed, mixer off or all volumes zero, SCC shadow RAM reset.
; Destroys:
;   AF, HL
; Preserves:
;   BC, DE, IX, IY
; Approx cost:
;   Small fixed cost plus mapper/slot setup. Do not call per frame.
; Notes:
;   Writes #3F to #9000 when SCC activation is required.
; -----------------------------------------------------------------------------
```

### SCC_Stop

```asm
; -----------------------------------------------------------------------------
; SCC_Stop
; What:
;   Stop SCC playback and silence every SCC channel.
; Inputs:
;   None.
; Outputs:
;   Volumes #988A-#988E = 0 and/or mixer #988F = 0.
; Destroys:
;   AF, B, HL
; Preserves:
;   C, DE, IX, IY
; Approx cost:
;   About 5-8 memory writes plus loop overhead.
; -----------------------------------------------------------------------------
```

### SCC_SetMixer

```asm
; -----------------------------------------------------------------------------
; SCC_SetMixer
; What:
;   Set SCC channel enable mask.
; Inputs:
;   A = bitmask, bit0 channel 1, bit4 channel 5. Bits 5-7 ignored by caller.
; Outputs:
;   (#988F) = A & #1F.
; Destroys:
;   AF
; Preserves:
;   BC, DE, HL, IX, IY
; Approx cost:
;   Very small, one masked write.
; -----------------------------------------------------------------------------
```

### SCC_SetVolume

```asm
; -----------------------------------------------------------------------------
; SCC_SetVolume
; What:
;   Set volume for one SCC channel.
; Inputs:
;   A = channel index 0..4.
;   E = volume 0..15.
; Outputs:
;   SCC volume register #988A + channel is updated.
; Destroys:
;   AF, HL
; Preserves:
;   BC, DE, IX, IY
; Approx cost:
;   Small. Address calculation plus one write.
; -----------------------------------------------------------------------------
```

### SCC_SetPeriod

```asm
; -----------------------------------------------------------------------------
; SCC_SetPeriod
; What:
;   Set 12-bit frequency divider for one SCC channel.
; Inputs:
;   A = channel index 0..4.
;   DE = period, low 12 bits used.
; Outputs:
;   SCC period registers #9880 + channel*2 are updated low byte then high nibble.
; Destroys:
;   AF, HL
; Preserves:
;   BC, DE, IX, IY
; Approx cost:
;   Small. Address calculation plus two writes.
; -----------------------------------------------------------------------------
```

### SCC_LoadWaveform32

```asm
; -----------------------------------------------------------------------------
; SCC_LoadWaveform32
; What:
;   Copy one 32-byte waveform into the SCC waveform RAM for a channel.
; Inputs:
;   A = channel index 0..4.
;   HL = source waveform address in currently visible ROM/RAM bank.
; Outputs:
;   Waveform RAM updated:
;     channel 1 -> #9800
;     channel 2 -> #9820
;     channel 3 -> #9840
;     channel 4 -> #9860
;     channel 5 -> #9860 in SCC original compatibility mode.
; Destroys:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY
; Approx cost:
;   32 byte copy plus setup. Avoid inside interrupt. Only call on instrument change.
; -----------------------------------------------------------------------------
```

### SCC_MusicUpdate_1Frame

```asm
; -----------------------------------------------------------------------------
; SCC_MusicUpdate_1Frame
; What:
;   Advance SCC music state by one video frame.
; Inputs:
;   Music runtime RAM already initialized.
; Outputs:
;   Applies note/instrument/volume changes due on this frame.
;   Writes SCC registers only when shadow state changed.
; Destroys:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY unless a future backend explicitly documents otherwise.
; Approx cost:
;   Variable. Cheap on hold frames; higher on note-on with waveform load.
; Notes:
;   Must be callable once per frame from the main loop/scheduler.
;   Must not assume it is running inside H.TIMI.
; -----------------------------------------------------------------------------
```

## 5. Integracio amb el motor Mideas

Punt d'encaix recomanat:

- `H.TIMI` ha de ser minim.
- El hook d'interrupcio nomes hauria de marcar `VBlankFlag` o cridar un dispatcher molt petit ja existent.
- `Music_Update_1Frame` ha de correr fora de `H.TIMI`, preferiblement en el main loop o scheduler sincronitzat amb `HALT`/VBlank.
- La musica SCC s'ha d'actualitzar una vegada per frame, igual que la regla actual documentada per musica del tracker i PT3 en MegaROM.

Motivacio:

- Carregar 32 bytes de waveform pot ser massa car o massa arriscat dins interrupcio.
- El driver pot necessitar bancs de dades visibles per llegir patrons/instruments.
- Fer bank switching dins IRQ augmenta el risc de tornar amb un banc incorrecte.
- Mideas ja te documentat que PT3 extern en MegaROM es mes segur des del loop `HALT` que des d'un audio task en IRQ quan hi ha bancs implicats.

Contracte proposat:

- `music_update` continua sent l'API publica de Mideas.
- Internament, si el track actiu es SCC, `music_update` fa dispatch a `SCC_MusicUpdate_1Frame`.
- Game Flow i State Machines no han de coneixer SCC.
- `music_execute_command`, `music_play_track`, `music_stop`, `music_mute` i `music_resume` han de mantenir una signatura estable.

Cadencia 50/60 Hz:

- Guardar `speed` com ticks per fila, no com milisegons.
- El preview PC pot calcular temps real, pero l'export ROM ha de tenir semantica clara per PAL 50 Hz i NTSC 60 Hz.
- La primera fase pot documentar objectiu PAL 50 Hz i afegir ajust 60 Hz despres.

## 6. Smoke tests obligatoris

Test 1: SCC canal 1 basic

- Inicialitzar SCC.
- Carregar ona simple al canal 1.
- Escriure periode i volum.
- Activar bit 0 a `988Fh`.
- Verificar en openMSX que hi ha activitat SCC i no hi ha crash.

Test 2: triangle, square i saw

- Exportar tres waveforms de 32 bytes.
- Fer sonar una nota curta amb cada instrument.
- Confirmar que el driver nomes carrega 32 bytes quan canvia instrument.

Test 3: canvi d'instrument nomes en note-on

- Patrons amb notes sostingudes i volum canviant.
- Verificar que no es reescriu waveform cada frame.
- Mirar logs/watchpoints sobre `9800h-987Fh` si es possible.

Test 4: canal 4/5 compartit en SCC original

- Assignar instruments diferents als canals 4 i 5.
- En mode SCC original, documentar i validar que l'ultima waveform carregada a `9860h` afecta tots dos.
- L'exportador ha d'avisar o resoldre conflictes de timbre per canals 4/5.

Test 5: stop musical

- Cridar `SCC_Stop`.
- Comprovar `988Ah-988Eh = 0` o `988Fh = 0`.
- Confirmar que no queda so sostingut.

Test 6: ROM de prova openMSX

- Generar ROM minima amb mapper Konami SCC.
- Executar openMSX amb romtype explicit apropiat per SCC.
- Validar arrencada, SCC enable i una sequencia curta.

Test 7: build TypeScript

- `npm run build` o equivalent del repo.
- Tests unitaris de serialitzacio SCC quan existeixin.
- Cap canvi SCC ha de trencar projectes PSG/PT3 existents.

## 7. Fitxers candidats del repo

No fer grans canvis encara. Proposta de fitxers per fases futures:

### Model TypeScript

Opcio conservadora:

- `types.ts`
  - Afegir nomes camps petits si han de formar part del format de projecte.
  - Evitar convertir `TrackerSongData` en un model massa carregat de cop.

Opcio mes neta si el model SCC creix:

- `utils/audio/sccTypes.ts`
  - `SCCWaveform`, `SCCNoteEvent`, `SCCSong`, constants de canals.
- Integrar despres a `types.ts` amb exports o unions estables.

### Preview audio

- `components/utils/sccSynthesizer.ts`
  - Ja existeix i hauria de ser l'evolucio natural del preview SCC.
- `components/tracker/WaveformEditorModal.tsx`
  - Ja existeix per editar instruments/waves SCC.
- `components/editors/TrackerComposer.tsx`
  - Ja fa switch PSG/SCC en UI. Tocar-lo nomes quan el model estigui tancat.

### Exportador ASM

- `utils/msxGenerator/generators/soundGenerator.ts`
  - Lloc actual del runtime musical PSG/PT3.
  - Afegir dispatch SCC en fase posterior, mantenint API publica.
- `utils/asmTemplateGenerator.ts`
  - Avui filtra tracks no-PSG en la ruta antiga. Caldra revisar aquest punt quan SCC exporti.
- `utils/msxGenerator/generators/variablesGenerator.ts`
  - Reservar RAM SCC quan hi hagi tracks SCC.
- `utils/msxGenerator/generators/unifiedGenerator.ts`
  - Si SCC necessita far calls o residencia especial, revisar juntament amb audio resident.

### Plantilles ASM

Opcio recomanada:

- `utils/msxGenerator/generators/sccSoundGenerator.ts`
  - Generador dedicat per rutines SCC i taules.
- `utils/msxGenerator/templates/scc/`
  - Si es decideix separar plantilles ASM llargues del TypeScript.

No recomanat:

- Barrejar molt ASM SCC inline dins de `soundGenerator.ts` si el bloc creix massa.

### Tests

- `test/test_scc_model_serialization.ts` o `.mjs`
  - Validar waveforms de 32 bytes, signed range i canal 4/5.
- `test/test_scc_asm_generation.js`
  - Validar que es generen labels/rutines SCC quan hi ha track SCC.
- `test/test_scc_register_contract.js`
  - Validar capcaleres ASM amb `Destroys`/`Preserves`.
- `test/scc/`
  - Fixtures de ROM minima, ASM i probes openMSX.

### Documentacio

- `docs/MIDEAS_SCC_KONAMI_STUDY.md`
  - Aquest estudi.
- `docs/project/MSX_AUDIO_GENERATOR_REFERENCE.md`
  - Actualitzar quan SCC tingui implementacio real.
- `docs/msx/ROM_SLOT_PAGING_REFERENCE.md`
  - Enllacar-hi notes SCC si es toca slot/page.

## 8. Resultat esperat i roadmap

### Roadmap Fase 1: SCC minim

- Confirmar constants SCC amb una ROM tecnica.
- Afegir validacions per `soundChip: 'SCC'` sense canviar export per defecte.
- Generar dades SCC compactes.
- Crear driver ASM minim:
  - `SCC_Init`
  - `SCC_Stop`
  - `SCC_SetMixer`
  - `SCC_SetVolume`
  - `SCC_SetPeriod`
  - `SCC_LoadWaveform32`
  - `SCC_MusicUpdate_1Frame`
- Exportar una ROM de prova Konami SCC en openMSX.

### Roadmap Fase 2: macros de volum/pitch/vibrato

- Afegir macros simples per instrument:
  - volum;
  - pitch offset;
  - vibrato.
- Mantenir shadow state per evitar escriptures redundants.
- Afegir tests de timing 50/60 Hz.
- Afegir avisos de conflicte per canals 4/5 en SCC original.

### Roadmap Fase 3: SCC+

- Afegir mode SCC+ nomes despres que SCC original sigui estable.
- Permetre waveform independent per canal 5.
- Afegir target explicit `konami-scc-plus` o flag equivalent.
- Validar MegaFlashROM SCC/openMSX i no assumir compatibilitat automatica.

### Roadmap Fase 4: editor musical visual dins Mideas

- Millorar editor de patrons per SCC.
- Mostrar waveform activa per canal.
- Operacions d'instrument:
  - normalize;
  - reverse;
  - interpolate;
  - import/export presets.
- Preview mes fidel opcional via emu2212/WASM.
- Integrar PSG + SCC com a mode compost quan hi hagi arbitratge clar.

## Riscos detectats

- El SCC original no permet timbre independent als canals 4 i 5.
- El mapper Konami normal i Konami SCC no son la mateixa cosa des del punt de vista del dispositiu de so.
- Escriure `3Fh` a `9000h` o tocar `9800h` sense tenir la pagina/cartutx correcte visible pot escriure on no toca.
- Carregar waveforms dins interrupcio pot desestabilitzar el joc.
- El preview PC pot sonar diferent del hardware real.
- Barrejar PSG, PT3 extern i SCC sense dispatcher clar pot duplicar estat musical i trencar `music_update`.
- Si les rutines ASM no declaren registres destruits/preservats, es repetiran bugs de corrupcio de registres.

## Fonts consultades

- libmsx SCC/SCC+ device interface: <https://mori0091.github.io/libmsx/group__SCC__DEVICE.html>
- openMSX VGM recorder SCC register comments: <https://github.com/openMSX/openMSX/blob/master/share/scripts/_vgmrecorder.tcl>
- Konami SCC/SCC+ Furnace docs: <https://github.com/tildearrow/furnace/blob/master/doc/7-systems/scc.md>
- Furnace manual SCC/SCC+ notes: <https://tildearrow.org/furnace/doc/latest/manual.pdf>
- Konami Sound Cartridge SCC+ notes: <https://bifi.msxnet.org/msxnet/tech/soundcartridge>
- Trilo Tracker SCC overview: <https://battleofthebits.com/lyceum/View/Trilo%2BTracker>
- Konami SCC register summary: <https://nl.wikipedia.org/wiki/Konami_SCC>
- Documentacio existent del repo: `types.ts`, `components/utils/sccSynthesizer.ts`, `components/tracker/WaveformEditorModal.tsx`, `utils/msxGenerator/generators/soundGenerator.ts`, `docs/project/MSX_AUDIO_GENERATOR_REFERENCE.md`, `docs/msx/ROM_SLOT_PAGING_REFERENCE.md`.

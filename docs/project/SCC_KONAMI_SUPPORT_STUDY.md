# SCC Konami Support Study for Mideas

Estudio tecnico para preparar soporte SCC de Konami en Mideas sin cambiar aun el comportamiento principal de la aplicacion.

## Alcance

Este documento no implementa el tracker SCC ni modifica el export ASM. Su objetivo es dejar una base arquitectonica para una fase posterior:

- identificar que ya existe en Mideas;
- separar soporte SCC de soporte PSG/PT3 actual;
- definir un contrato minimo para runtime/export;
- listar riesgos antes de tocar codigo critico.

Queda fuera de alcance en esta fase:

- reescribir el tracker;
- emitir sonido SCC en ROM;
- cambiar `music_update`, `music_play_track` o el scheduler;
- tocar el mapper Konami actual;
- migrar proyectos existentes.

## Estado actual observado

Mideas ya tiene parte del modelo de datos preparado:

- `TrackerSongData.soundChip` acepta `PSG` o `SCC`.
- `SCCChannelId` define cinco canales: `1..5`.
- `SCCInstrument` define una wavetable de 32 muestras, volumen opcional y envolvente de volumen.
- La UI del tracker permite seleccionar SCC y editar ondas SCC mediante `WaveformEditorModal`.
- El preview web ya tiene una aproximacion SCC en `components/utils/sccSynthesizer.ts`.

La ruta de export MSX todavia no esta preparada:

- `utils/asmTemplateGenerator.ts` filtra tracks no-PSG y los descarta en la ruta ASM antigua.
- `utils/msxGenerator/generators/soundGenerator.ts` serializa tracks PSG nativos y PT3 externos, pero no genera runtime SCC.
- La API publica de musica existente esta centrada en `music_play_track`, `music_update`, `music_stop`, `music_mute` y `music_resume`.
- Los documentos de PT3 ya recomiendan preservar esa API publica para que Game Flow y State Machines no dependan del backend real.

Conclusion: el soporte SCC debe entrar como un backend de audio nuevo detras de la API musical existente, no como una ruta paralela que obligue a Game Flow o State Machine a conocer detalles SCC.

## Hechos tecnicos SCC que afectan al diseno

SCC no es un PSG ampliado. Es un chip de cinco canales wavetable con memoria/registros mapeados en el espacio de memoria del cartucho. Para Mideas importan estas consecuencias:

- Hay que asegurar que la ventana de ROM/cartucho donde vive SCC esta visible antes de escribir registros SCC.
- El mapper Konami SCC no debe tratarse como identico al Konami 8K sin SCC.
- El canal 4 y 5 pueden compartir o restringir datos de onda segun variante SCC/SCC+ y modo. La primera fase debe apuntar al SCC clasico compatible.
- Las ondas son de 32 muestras. La UI ya encaja con ese tamano.
- El update por frame debe escribir frecuencia, volumen, enable y, cuando cambie el instrumento, la wavetable.
- La deteccion/seleccion de hardware debe ser explicita para evitar que una ROM SCC se ejecute como Konami normal y escriba en zonas sin SCC.

Punto a verificar antes de implementar: direcciones exactas de habilitacion SCC, registros, diferencias SCC vs SCC+, y comportamiento OpenMSX con `-romtype`. No conviene codificar esas constantes solo desde memoria o ejemplos sueltos.

## Relacion con mapper Konami

Mideas ya tiene una ruta MegaROM Konami 8K usada por SCREEN 4/5. Esa ruta asume bancos de datos y rutinas como `mapper_set_bank_p1/p2/p3`.

Para SCC hay que separar dos conceptos:

1. Mapper de ROM:
   Selecciona bancos visibles en paginas/cartucho.

2. Dispositivo SCC:
   Expone registros de audio/wavetable en una ventana de memoria concreta cuando el cartucho esta configurado para SCC.

Recomendacion:

- anadir una variante de target futura, por ejemplo `konami-scc`, sin cambiar el significado de `konami`;
- mantener el mapper Konami 8K actual intacto;
- crear una capa `scc_device` o `music_scc_*` que use una API centralizada para habilitar SCC y escribir registros;
- prohibir escrituras SCC dispersas desde Game Flow, State Machines o rutinas de gameplay.

Esto evita mezclar el trabajo SCC con el mapper Konami actual, que ya tiene riesgos propios de slot/page y bank restore.

## Propuesta de arquitectura

### Modelo

El modelo actual puede mantenerse al inicio:

- `soundChip: 'SCC'`
- `instruments: SCCInstrument[]`
- `patterns` con cinco canales `1..5`
- `TrackerCell.note`, `instrument`, `volume`

No hace falta ampliar `TrackerCell` para la primera fase. Efectos de patron, vibrato, portamento o duty/morph de onda deben esperar a una fase posterior.

Extensiones candidatas, no inmediatas:

- `playbackBackend?: 'native' | 'external-pt3' | 'native-scc'`
- `targetCartridge?: 'konami' | 'konami-scc'`
- flags de compatibilidad SCC clasico/SCC+ si se decide soportar ambos.

### Export ASM

El generador deberia decidir backend por track:

- `PSG + native`: runtime actual.
- `PSG + external-pt3`: ruta PT3 externa actual.
- `SCC + native`: nuevo runtime SCC.

La API publica no deberia cambiar:

- `music_play_track`
- `music_update`
- `music_stop`
- `music_mute`
- `music_resume`

Internamente, `music_play_track` puede hacer dispatch por backend o el generador puede emitir una variante de `sound.asm` cuando todos los tracks son SCC. La primera opcion escala mejor si algun dia se combinan assets PSG/SCC, pero tiene mas coste de RAM/ROM.

### Runtime SCC minimo

Fase minima para que una cancion SCC nativa sea exportable:

1. `scc_init`
   - mapear/activar la ventana SCC si procede;
   - silenciar canales;
   - limpiar shadow state en RAM.

2. `scc_load_instrument_wave`
   - copiar 32 bytes de wavetable al canal necesario;
   - ejecutarse solo cuando cambia instrumento o si el canal necesita restauracion.

3. `scc_set_channel_pitch`
   - convertir nota a periodo SCC;
   - escribir registros de frecuencia.

4. `scc_set_channel_volume`
   - aplicar volumen global, volumen de celda y envelope;
   - escribir volumen 0..15.

5. `scc_update`
   - avanzar fila/tick como el tracker actual;
   - actualizar cinco canales;
   - mantener muting/stop consistente con la API publica.

6. `scc_silence`
   - bajar volumen de los cinco canales y limpiar estado activo.

### RAM

No guardar ondas completas activas en RAM salvo que haya una razon fuerte. Las tablas de instrumentos deben vivir en ROM/bancos de datos y el runtime solo necesita estado activo:

- track activo;
- order/pattern/row/tick;
- nota/instrumento/volumen por canal;
- indice de envelope por canal;
- ultimo instrumento cargado por canal;
- flags mute/loop.

Hay que presupuestar mas RAM que PSG porque SCC son cinco canales, pero evitar buffers grandes.

### ROM y bancos

Politica recomendada:

- codigo critico de `music_update` residente o en banco estable;
- tablas de patrones/instrumentos en bancos de datos;
- rutinas de bank switch centralizadas;
- si `music_update` cambia banco, debe restaurar siempre el banco esperado antes de volver;
- no ejecutar replayer SCC desde una IRQ si necesita bank switching no trivial.

La regla ya documentada para PT3 se mantiene: en MegaROM, el tick musical desde loop `HALT` es mas seguro que una IRQ que cambie bancos.

## Integracion con Game Flow y State Machines

Game Flow y State Machine no deberian distinguir SCC:

- nodo Music sigue llamando a `music_execute_command`;
- `Action_PlayMusic` sigue llamando a `music_play_track`;
- mute/stop/resume siguen usando la API existente.

Si se necesita rechazar combinaciones no soportadas, el error debe ocurrir en export/validacion:

- `SCC + targetFormat=konami` sin SCC: error claro;
- `SCC + external-pt3`: error claro, porque PT3 externo es PSG/AY;
- mezcla PSG y SCC en una misma ROM: inicialmente no soportado salvo que se disene arbitraje explicito.

## Plan por fases

### Fase 0: documentacion y validacion

- cerrar constantes SCC con fuentes tecnicas y prueba OpenMSX;
- definir `konami-scc` como target futuro;
- anadir validaciones report-only si hace falta, sin cambiar runtime.

### Fase 1: backend SCC minimo

- generar tablas SCC nativas desde `TrackerSongData`;
- runtime de cinco canales sin efectos avanzados;
- soporte de notas, instrumentos, volumen y envelope simple;
- OpenMSX smoke con `-romtype` correcto.

### Fase 2: compatibilidad de editor/export

- mensajes claros en UI/export cuando SCC no puede compilarse;
- estimacion de bytes por ondas/patrones;
- tests de serializacion de tablas SCC.

### Fase 3: expresividad

- vibrato/portamento/volume slide;
- reutilizacion inteligente de ondas;
- SCC+ solo si hay una razon de producto.

## Riesgos

- Confundir Konami 8K normal con Konami SCC puede producir ROMs que compilan pero escriben en direcciones equivocadas.
- Escribir SCC desde IRQ mientras se cambian bancos puede romper graficos, musica o retornos de interrupcion.
- El preview web SCC es aproximado; no debe usarse como prueba final de fidelidad hardware.
- El canal 4/5 y las diferencias SCC/SCC+ pueden romper canciones si se asume independencia total de cinco wavetables.
- El soporte de SCC puede aumentar ROM/RAM mas de lo previsto si se copian ondas por fila en vez de por cambio de instrumento.
- Mezclar PSG SFX con musica SCC requiere arbitraje de audio y politica de salida; no debe aparecer implicitamente.

## Siguiente paso recomendado

Antes de implementar, crear una prueba tecnica aislada:

1. una ROM minima `konami-scc` que inicialice SCC, cargue una onda simple y reproduzca una nota por canal;
2. verificacion OpenMSX con romtype explicito;
3. captura de registros o screenshot/log que demuestre que la ventana SCC esta activa;
4. solo despues, conectar el runtime a `TrackerSongData`.

Ese paso reduce el riesgo principal: descubrir tarde que el mapper/cartucho SCC se configuro de forma distinta a la ruta Konami normal de Mideas.

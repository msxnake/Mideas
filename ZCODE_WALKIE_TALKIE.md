# ZCODE_WALKIE_TALKIE — protocolo de cooperación por exchange.txt

> Memoria persistente de ZCode para el canal walkie-talkie. **LEER ANTES DE
> CADA intervención en `exchange.txt`** (también al retomar una sesión
> nueva). Nada de lo que hay aquí excusa releer la cola del canal: esto
> recuerda las reglas, no la conversación.

## Identidad

- Firmo siempre como **ZCode**. No soy Claude ni ningún otro agente que haya
  pasado por el canal; nunca firmo con nombre ajeno.
- El canal puede tener otros participantes (hoy: Codex, Jordi como usuario).
  La atribución del historial es sagrada: lo firmado, lo firmó quien lo firmó.

## El canal: exchange.txt

- **Append-only estricto**: solo se escribe físicamente AL FINAL. No se
  borra, reescribe, reordena ni inserta junto a separadores antiguos.
- Cabecera de cada mensaje:
  `[NNN] DE: <nombre> | <YYYY-MM-DDTHH:MM:SS>±HH:MM | <TIPO>`
  TIPO = PROPUESTA | RESPUESTA | DATOS | PREGUNTA | ACUERDO | PARCHE | ERROR.
- Numeración: el siguiente número libre. Si dos mensajes comparten número
  (colisión mecánica), NO renumerar nada: marcarlo en el siguiente mensaje
  propio y seguir. Si un mensaje propio aparece fuera de orden físico, es
  error mecánico: se marca, no se mueve.
- Separador entre mensajes: una línea de `=` tras el cierre de turno.

## Turnos (regla dura)

- **CAMBIO**: cedo el micrófono; el otro ya puede escribir.
- **CAMBIO Y CORTO**: cedo el micrófono y termino mi parte.
- **SIGO YO**: CONSERVO el turno; el otro solo lee, piensa o prepara.
- **BREAK**: aviso urgente SIN cambiar el turno; cierra con **CONTINUA TU**.
- Solo escribe quien tiene el turno. Comprobar el fichero NO concede turno.
- Si el último mensaje no cierra con CAMBIO / CAMBIO Y CORTO, no escribo:
    puedo leer, pensar y preparar, pero no tocar el canal ni el código.

## Vigilancia

- Mientras el canal esté activo: revisar la cola **cada minuto como mínimo**
    (mi vigilante automatizado: cada 30 s, tamaño del fichero).
- Al detectar crecimiento, leer SOLO el tramo añadido desde la última
    lectura.
- Si no hay contenido nuevo o nada dirigido a mí con turno cedido: no
    escribir nada.

## Propiedad y cambios

- Nadie modifica código/tests de un fichero ajeno sin ACUERDO explícito en
  el canal (fichero + cambio concretos).
- Reparto vigente (tema Caverna2/boss): Codex posee los generadores
  (`msx2BitmapBossGenerator.ts`, `msx2Screen5BitmapRoomGenerator.ts`);
  ZCode posee sondas/fixtures/checkers (`test/`, `scripts/check_msx2_*`).
  Un reparto nuevo lo fija el ACUERDO de cada cooperación, no este fichero.
- Jordi (usuario) manda sobre el árbol: la autorización final de tocar
  generadores es suya.

## Certeza y cierre

- Todo hallazgo se marca: `[CONFIRMADO-LECTURA]` (fichero:línea),
  `[CONFIRMADO-HW]` (reproducido en OpenMSX con sonda) o `[HIPOTESIS]`.
- Regla del proyecto: un bug de boss NO se da por diagnosticado leyendo
  código; hace falta ROM generada + sonda.
- **SOLUCION_FINALIZADA** solo tras verificar el arreglo en OpenMSX. Un
  build verde nunca basta.

## Inicio de nueva cooperación (disparador de Jordi)

Cuando Jordi diga **"inicio cooperacion para ... tarea X"**:
1. Backup del canal actual al siguiente `exchange_N.txt` libre
   (existen `exchange_1.txt`, `exchange_backup_YYYYMMDD_HHMMSS.txt`, ...).
2. Vaciar `exchange.txt` para el tema nuevo.
3. Presentación neutral firmada ZCode: quién soy, la tarea X, qué aporto.
   No asumir qué IAs van a colaborar.
4. Re-armar la vigilancia y ESPERAR respuesta. No empezar trabajo por cuenta
   propia hasta que el canal defina la tarea y los turnos.

## Lecciones operativas (pagadas con bugs reales — no reaprenderlas)

- Las sondas resuelven direcciones **desde el .sym de la build en curso**;
  nunca heredarlas de otra build. Una sonda que mide la instrucción equivocada
  es peor que no sondar.
- openMSX SIEMPRE vía `test/run_openmsx_probe.sh`: taskkill previo
  (en Git Bash los switches van `//IM //F`), tope duro de reloj de pared y
  `Stop-Process -Force`. Nunca dejar openMSX abierto para que Jordi lo cierre.
- Un `catch` que traga un error de lectura NO es una medición (lección
  "VDP status": el debuggable no existía y el 0 era el valor por defecto).
  Verificar que el instrumento existe antes de citarlo como fuente.
- No cerrar bugs visuales comparando negro-sobre-negro: llevar la medición a
  donde el arte distinga (por eso el fixture de transición real existió).
- Los comandos VDP muertos se identifican en R#32-46 ("VDP regs"): el último
  bloque escrito queda ahí aunque el chip ya esté tostado.
- Leer el final del fichero con `tail -c` tras cada crecimiento; el historial
  completo solo al entrar por primera vez a una cooperación.
- Una ROTACION de canal ENCOGE el fichero: un vigilante por tamaño que solo
  dispara al crecer se queda ciego (le pasó a ZCode el 2026-08-21 con el
  inicio de la cooperacion del doble boss). Vigilar tambien los decrecimientos.

# ZCODE_WALKIE_TALKIE — protocolo de cooperación por exchange.txt

> Memoria persistente de ZCode para el canal walkie-talkie. **LEER ANTES DE
> CADA intervención en `exchange.txt`** (también al retomar una sesión
> nueva). Nada de lo que hay aquí excusa releer la cola del canal: esto
> recuerda las reglas, no la conversación.

## Identidad

- Firmo siempre como **ZCode**. No soy Claude ni ningún otro agente que haya
  pasado por el canal; nunca firmo con nombre ajeno.
- El canal puede tener otros participantes (hoy: Gemini y Codex;
  Jordi como usuario).
  La atribución del historial es sagrada: lo firmado, lo firmó quien lo firmó.
- El writer de Codex INSERTA en medio (reconfirmado el 2026-09-16: su [006]
  quedó por delante del [005] de ZCode): los re-escaneos completos son
  obligatorios, no opcionales.
- Vigilante DESACTIVADO por orden de Jordi (2026-09-16, "detener walkie"):
  la automatización `automation-5a0566a0-c3df-4788-84c2-22ef09e106bc` fue
  eliminada. Para reactivarlo: recrear el cron cada minuto siguiendo el
  prompt que quedó documentado en esta memoria (técnica del cursor V2).

## El canal: exchange.txt

- **Append-only estricto**: solo se escribe físicamente AL FINAL. No se
  borra, reescribe, reordena ni inserta junto a separadores antiguos.
- Cabecera (PROTOCOLO V2, orden de Jordi del 2026-09-16, SIN números):
  `DE: <nombre> | <YYYY-MM-DDTHH:MM:SS±HH:MM> | <TIPO>` (+ tag libre opcional)
  TIPO = PROPUESTA | RESPUESTA | DATOS | PREGUNTA | ACUERDO | PARCHE | ERROR.
  Los SEGUNDOS son obligatorios: minuto suelto colisiona.
- Referencias por remitente + hora: "respondo a GEMINI @ 20:16:00".
- Posición de lectura: "he leído hasta <nombre @ HH:MM:SS>" o "hasta el final
  del fichero". Nadie necesita saber cuántos mensajes hay para escribir.
- Motivo del cambio: la numeración correlativa se rompió dos veces el
  2026-09-16 (un [006] insertado antes de su [005] y dos [006] duplicados).
  El historial antiguo numerado [001]-[007] NO se reescribe; sus referencias
  por número siguen siendo válidas para ese tramo.
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

Cooperación vigente (2026-09-16): **sprites MSX2 16x16 con Gemini** — Gemini
dibuja la rejilla ASCII, ZCode convierte con la skill `msx2-sprites`
(`.msx2sprite.json` + preview PNG) y coordina el canal. Historial anterior
(cooperación Codex: shoot definitions/aimed) en
`exchange_backup_20260916_200134.txt`. Las entregas de arte de Gemini usan
la leyenda de colores fijada en el [001] del canal actual.

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
- Tras escribir en el canal, re-armar el vigilante solo con el tamaño YA
  asentado (releer y verificar el final del fichero antes de armar): un
  vigilante armado a mitad de flush cazó la cola del propio mensaje de ZCode
  como falsa alarma (2026-08-22, tras el [037]). Ante un disparo, verificar
  siempre que el tramo "nuevo" no sea mensaje propio.
- Un agente con writer defectuoso puede INSERTAR mensajes al inicio o en
  medio del fichero (2026-08-22: dos [038] insertados tras el [001] y un
  [021] duplicado). `tail -c` es CIEGO a eso: ante cualquier disparo del
  vigilante, re-escanear cabeceras (grep -n "^\[") y comparar con la
  numeración/posiciones conocidas, no solo leer el tramo final. Marcar la
  colisión o duplicado en el siguiente mensaje propio; jamás renumerar,
  reordenar ni "arreglar" el fichero.
- El re-escaneo de cabeceras debe ser COMPLETO, no del final de la lista:
  un [041] insertado en la línea 26 pasó 6 horas inadvertido porque los
  re-escaneos usaban `grep ... | tail -N` (lección pagada el 2026-08-22,
  cazada por Claude en su [063]; el mensaje perdido contenía un visto
  bueno que cerraba dos cabos que yo seguía reportando como abiertos).
  Ante cualquier anomalía de numeración: `grep -n "^\[" exchange.txt`
  completo y comparar longitudes de lista.
- TÉCNICA DEL CURSOR (V2): como los mensajes empiezan con `DE: ` (o
  `[NNN] DE:` en el tramo histórico), el vigilante cuenta cabeceras con
  `grep -c -E "^(====)?(\[[^]]*\] )?DE: "`, anota la línea de la última y
  su remitente+timestamp, persistido en `server/temp/walkie_cursor.txt`.
  Cualquier mensaje nuevo —append arriba, abajo o en medio— cambia el
  recuento o desplaza líneas. Al disparar, escaneo completo de cabeceras y
  leer solo lo que haya más allá del cursor. EXCEPCIÓN (matiz de Jordi):
  si el RECUENTO DECRECE, es una rotación (clear del tema + tarea nueva):
  el cursor queda invalidado. Acción: verificar que el historial viejo
  existe en su backup (exchange_N.txt o exchange_backup_*), releer el
  fichero NUEVO completo (es una presentación de cooperación distinta),
  resetear el cursor al estado nuevo y seguir el procedimiento de inicio
  de cooperación (presentarse, re-armar vigilancia, ESPERAR definición de
  tarea y turnos).

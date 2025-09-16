# 🧠 Variables de Sistema MSX - Mapa de Memoria

## 📍 Zona alta de RAM: #F380 - #FFFF

En los sistemas **MSX**, la **zona alta de RAM** (normalmente desde **#F380** hasta **#FFFF**, dependiendo del modelo y la cantidad de RAM disponible) es utilizada por el **BIOS del MSX** para almacenar **variables de sistema**, buffers, punteros, y estados internos que el sistema operativo (MSX-BIOS y MSX-DOS, si está presente) necesita para funcionar correctamente.

---

## 🧠 Estructura de las variables de sistema en la zona alta de RAM

La estructura exacta puede variar ligeramente entre modelos (MSX1, MSX2, MSX2+, Turbo R), pero en general, en **MSX1/MSX2 estándar**, las variables de sistema comienzan en **#F380** y ocupan hasta **#FFFF**.

### 📍 Zona principal: #F380 - #FFFF (aprox. 1664 bytes)

Esta zona se divide en varias partes:

---

## 📌 Bloques principales de variables de sistema (MSX1/MSX2 típico)

### 1. **#F380 - #F3FF: Variables de sistema críticas**
Contiene punteros, flags y estados del sistema. Algunas importantes:

- **#F380 - #F383**: `TXTTAB` — Puntero al inicio del programa BASIC en memoria.
- **#F384 - #F387**: `VARTAB` — Puntero al inicio de las variables BASIC.
- **#F388 - #F38B**: `ARYTAB` — Puntero al inicio de los arrays BASIC.
- **#F38C - #F38F**: `STREND` — Puntero al final de los arrays/string space.
- **#F390 - #F393**: `FRETOP` — Puntero al tope de la memoria libre BASIC.
- **#F398 - #F39B**: `TEMPPT` — Puntero a espacio temporal para expresiones.
- **#F39C - #F39F**: `TEMPST` — Puntero de inicio del espacio temporal.
- **#F3A0**: `CURLIN` — Número de línea BASIC actual (2 bytes, little endian).
- **#F3A2**: `OLDLIN` — Última línea ejecutada.
- **#F3A4**: `OLDTXT` — Puntero a última línea BASIC mostrada.
- **#F3A8**: `DATLIN` — Línea donde está el último `DATA`.
- **#F3AC - #F3AF**: `PRMFLG` — Flags de parámetros (modo de ejecución, etc.).
- **#F3B0 - #F3B3**: `FNKFLG` — Estado de las teclas de función.
- **#F3B4 - #F3B7**: `TXTUNF` — Buffer de entrada de teclado.
- **#F3BC - #F3BF**: `LINL40` — Longitud de línea en modo 40 columnas.
- **#F3C0 - #F3C3**: `LINL32` — Longitud de línea en modo 32 columnas.
- **#F3C4 - #F3C7**: `CSRY` — Cursor Y actual.
- **#F3C8 - #F3CB**: `CSRX` — Cursor X actual.
- **#F3CC - #F3CF**: `LINLEN` — Longitud actual de línea.
- **#F3D0 - #F3D3**: `CRTCNT` — Contador de líneas de CRT (para scroll).
- **#F3D4 - #F3D7**: `DSPFLG` — Flags de visualización.
- **#F3DC - #F3DF**: `RNDX` — Semilla del generador aleatorio.
- **#F3E0 - #F3E3**: `VERCK` — Checksum de versión del BASIC.
- **#F3E4 - #F3E7**: `ERRFLG` — Código de último error.
- **#F3EA - #F3ED**: `SAVSTK` — Stack guardado durante errores.
- **#F3F8 - #F3FB**: `RAMTOP` — Tope de RAM disponible para BASIC.
- **#F3FC - #F3FF**: `TRPTMP` — Temporal para `TRON`/`TROFF`.

> ⚠️ **¡NO BORRAR!** — Estas variables son críticas para el funcionamiento del intérprete BASIC y el BIOS. Si se corrompen, el sistema puede colgarse o comportarse erráticamente.

---

### 2. **#F400 - #F67F: Buffer de pantalla y teclado**
- Buffer de teclado (`KEYBUF`)
- Buffer de salida de pantalla (`LINBUF`, `LINWRK`)
- Estado de scroll, colores, modos gráficos
- Punteros a rutinas de video

> ⚠️ **¡NO BORRAR!** — Si borras esto, pierdes el buffer de pantalla y teclado → pantalla en blanco o caracteres basura, teclado no responde.

---

### 3. **#F680 - #F7FF: Variables de dispositivos y extensiones**
- Estado de disk drive (si MSX-DOS)
- Punteros a rutinas de extensiones (RS-232, impresora, etc.)
- Estado de la ROM mapper (en MSX2+ y Turbo R)

> ⚠️ **Depende del sistema** — Si usas MSX-DOS o periféricos, ¡NO BORRAR!

---

### 4. **#F800 - #FBFF: Zona de trabajo del BIOS y temporales**
- Rutinas de servicio de interrupciones
- Temporales para operaciones de E/S
- Estado de VDP (Video Display Processor)
- Sonido (PSG)
- Joystick, teclado escaneado

> ⚠️ **¡NO BORRAR!** — Corromper esto puede hacer que el sistema se cuelgue o reinicie.

---

### 5. **#FC00 - #FFFF: Rutinas de BIOS y vectores de interrupción**
- **#FD9A - #FD9F**: Vector de `INITXT` (inicio BASIC)
- **#FE00 - #FE05**: Vector de `CALBAS` (llamada a BASIC)
- **#F37D - #F37F**: `USRSPC` — Espacio para usuario (a veces usado por programas)
- **Vectores de interrupción VSYNC, HSYNC, etc.**
- **BIOS ROM shadow o stubs en RAM (dependiendo del modelo)**

> ⚠️ **¡NO SOBREESCRIBIR!** — Esta zona contiene **código ejecutable** y **vectores críticos**. Sobrescribirla puede hacer que el sistema no arranque o se bloquee.

---

## ✅ ¿Qué memoria **SÍ** se puede usar/borrar?

Si necesitas memoria temporal o para tu programa en ensamblador o BASIC, usa:

- **Memoria libre por debajo de `FRETOP`** (consulta `FRETOP` en #F390)
- O bien, reserva memoria con `CLEAR` en BASIC para mover `FRETOP` hacia abajo y tener un bloque seguro arriba.
- En ensamblador, puedes usar la zona desde `#C000` hasta el inicio de las variables de sistema (`#F380`), **siempre que no estés usando MSX-DOS ni extensiones que ocupen esa zona**.

---

## 🛡️ Zonas que **NO DEBES BORRAR NI TOCAR** (Resumen)

| Rango        | Contenido                          | ¿Se puede tocar? |
|--------------|------------------------------------|------------------|
| **#F380 - #F3FF** | Variables BASIC y sistema          | ❌ NO            |
| **#F400 - #F67F** | Buffers pantalla/teclado           | ❌ NO            |
| **#F680 - #F7FF** | Estado dispositivos y DOS          | ❌ NO (si usas DOS) |
| **#F800 - #FBFF** | Trabajo BIOS, VDP, sonido, etc.    | ❌ NO            |
| **#FC00 - #FFFF** | BIOS, vectores, stubs, código      | ❌ NO (¡crítico!) |

---

## 💡 Consejo para programadores

Si estás programando en **ensamblador**, y quieres usar memoria alta **sin romper el sistema**, puedes:

1. Usar `RAMTOP` (#F3FC) para saber el límite superior disponible.
2. Mover `RAMTOP` hacia abajo con `POKE` o llamadas a BIOS (`CHGTAB`) para reservar espacio.
3. Usar la zona entre tu programa y `RAMTOP` como memoria libre.

Ejemplo en BASIC:

```basic
CLEAR 20000  ' deja libre desde #4E20 hasta RAMTOP
```

En ensamblador, puedes llamar a la rutina `CHGTAB` (#0014) para ajustar `TXTTAB` y liberar espacio.

---

## 🎯 **Código correcto para inicializar RAM del proyecto**

```assembly
; ==================================================================
; INICIALIZACIÓN SEGURA DE VARIABLES DE PROYECTO
; ==================================================================

INIT_RAM_VARIABLES:
    ; ⚠️ CORRECTO: Solo limpiar variables del proyecto, NO del sistema

    ; Método 1: Limpiar zona específica del proyecto
    LD HL, current_flow_state    ; #C000 - primera variable del proyecto
    LD DE, current_flow_state+1  ; #C001 - siguiente byte
    LD BC, RAM_USAGE_END - current_flow_state - 1  ; Solo hasta #C520
    LD (HL), 0
    LDIR                         ; Limpia solo variables del proyecto

    ; Método 2: Inicializar variables individuales (más seguro)
    XOR A
    LD (current_flow_state), A
    LD (input_state), A
    LD (active_sprite_count), A
    ; ... etc para cada variable específica

    ; ⚠️ NUNCA hacer esto (corrompe variables del sistema):
    ; LD HL, #C000
    ; LD DE, #C001
    ; LD BC, #3FFE     ; ❌ MAL - limpia variables del sistema
    ; LDIR

    RET

; ==================================================================
; ZONAS SEGURAS PARA VARIABLES DE PROYECTO
; ==================================================================

; ✅ SEGURO: #C000 - #F37F (zona de usuario)
; Variables del proyecto pueden usar hasta #F37F sin riesgo

; Variables del proyecto (EQU con direcciones seguras)
current_flow_state     EQU #C000    ; ✅ Seguro
prev_flow_state        EQU #C001    ; ✅ Seguro
input_state            EQU #C004    ; ✅ Seguro
; ... hasta RAM_USAGE_END EQU #F300 (límite seguro)

; ❌ PELIGROSO: #F380+ (variables del sistema MSX)
; ❌ NO usar para variables del proyecto
```

---

## 📚 Referencias útiles

- **MSX BIOS Specification** — [https://www.msx.org/wiki/BIOS](https://www.msx.org/wiki/BIOS)
- **MSX Red Book (ASCII MSX Technical Data Book)**
- **MSX Assembly Page** — [http://map.grauw.nl/](http://map.grauw.nl/) → Tiene mapas de memoria detallados.

---

✅ **Conclusión:**
La zona alta de RAM (**#F380 - #FFFF**) contiene **variables y buffers críticos del sistema**. **No debes borrar ni modificar** esta zona a menos que sepas exactamente qué estás haciendo y hayas redirigido previamente los punteros del sistema (como `RAMTOP`, `FRETOP`, etc.). Para uso general, trabaja en zonas más bajas o reserva espacio con `CLEAR`.

**Para proyectos en Mideas:** Usa el rango **#C000 - #F37F** para variables del proyecto y **nunca limpies más allá de #F380**.
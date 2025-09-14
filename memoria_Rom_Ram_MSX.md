En la programación en ensamblador Z80 para MSX, especialmente al crear un cartucho ROM, es correcto que las constantes (como tablas de datos fijos, strings o valores iniciales) vayan en ROM (no modificables), mientras que las variables (que se cambian durante la ejecución) deben estar en RAM. El código principal suele empezar con `ORG #4000` (o similar, dependiendo del slot de ROM), ya que eso define el origen del binario ROM.

Para "contarle" al assembler (no compiler, ya que en ASM usamos ensambladores como sjasm, tniasm, glass o asMSX) que las variables empiezan en #C000 (una dirección típica en RAM para MSX, como en la página 3 de 0C000h-0FFFFh), puedes hacer lo siguiente. Hay varias formas, dependiendo del ensamblador que uses, para evitar que las definiciones de variables inflen el binario ROM con bytes innecesarios (ya que las variables no forman parte del ROM).

### 1. **Usando `ORG` para cambiar a la sección de RAM y `DS` para reservar espacio**
   - Coloca `ORG #C000` después de tu código y constantes en ROM.
   - Define las variables con `DS` (define space) para reservar bytes sin inicializarlos.
   - Ejemplo básico en tu archivo .asm:
     ```
     ; Código y constantes en ROM
     ORG #4000
     ; Aquí va tu header de ROM, código principal, constantes con DB/DW, etc.
     MI_CONSTANTE: DB 1,2,3  ; Ejemplo de constante en ROM

     ; Ahora sección de variables en RAM
     ORG #C000
     MI_VARIABLE1: DS 1  ; Reserva 1 byte para una variable (e.g., un contador)
     MI_VARIABLE2: DS 2  ; Reserva 2 bytes (un word, e.g., para una dirección)
     TABLA_VARS:   DS 10 ; Reserva 10 bytes para una tabla
     ```
   - **Acceso en código**: Usa paréntesis para leer/escribir, como `LD A,(MI_VARIABLE1)` o `LD (MI_VARIABLE2),HL`.
   - **Advertencia**: Algunos ensambladores paddingan el binario con ceros desde #4000 hasta #C000, creando un archivo enorme. Para evitarlo:
     - Usa ensambladores con soporte para "virtual" (como sjasm): `DS virtual 1` en lugar de `DS 1`. Esto define las etiquetas sin emitir bytes en el binario.
     - En tniasm, usa `RB 1` (reserve byte) o `RW 1` (reserve word) en vez de `DS`.
     - En glass: `DS virtual 1`.
     - Si no, ensambla y luego extrae solo el rango de ROM (e.g., con herramientas como `dd` en Linux o un editor hex).

### 2. **Usando `EQU` para definir direcciones absolutas en RAM (sin reservar espacio explícito)**
   - Si no necesitas reservar bloques grandes, define etiquetas con `EQU` directamente en direcciones de RAM. No cambia el ORG ni añade nada al binario.
   - Ejemplo:
     ```
     ; Al inicio del archivo, después de ORG #4000
     MI_VARIABLE1 EQU #C000  ; Dirección fija en RAM
     MI_VARIABLE2 EQU #C001
     TABLA_VARS   EQU #C003  ; Salta 2 bytes para la anterior

     ; En código
     LD A,0
     LD (MI_VARIABLE1),A  ; Inicializa
     ```
   - Ventaja: Simple y no afecta el binario ROM. Desventaja: Si cambias el layout, tienes que ajustar todos los EQU manualmente.

### 3. **Inicializando variables desde ROM (copiando a RAM al inicio)**
   - Si quieres valores iniciales en las variables, defínelos como constantes en ROM y cópialos a RAM en el startup de tu programa (usando `LDIR`).
   - Ejemplo:
     ```
     ; En ROM (después de ORG #4000)
     VALORES_INICIALES:
         DB 0, 1, 2, 3  ; Valores para copiar a RAM

     ; Startup code
     LD HL,VALORES_INICIALES
     LD DE,#C000  ; Dirección de inicio en RAM
     LD BC,4      ; Longitud a copiar
     LDIR         ; Copia de ROM a RAM

     ; Ahora define variables (con EQU o ORG/DS virtual)
     MI_TABLA EQU #C000
     ```
   - Esto es común para "variables" que necesitan setup inicial pero se modifican después.

### Consejos generales para MSX ROM:
- **Header de ROM**: Siempre incluye el header estándar en #4000 (e.g., DB "AB", DW INIT, etc.) para que el MSX lo reconozca como cartucho.
- **Espacio en RAM**: En MSX, #C000 está en la página 3 de RAM (asumiendo slot estándar). Usa variables del sistema como RAMAD3 (#F344) para confirmar el slot.
- **Ensambladores recomendados**: sjasmplus o asMSX para MSX dev. Ejemplo de comando: `sjasmplus tuarchivo.asm --lst=tuarchivo.lst` (genera .rom).
- **Pruebas**: Usa emuladores como openMSX o blueMSX para cargar tu .rom como cartucho.
- Si usas mappers (e.g., para ROM >16KB), maneja bancos con OUT a puertos como #FD.

Si especificas qué ensamblador usas (e.g., sjasm, wbass2), puedo dar ejemplos más precisos. ¡Prueba y si tienes errores, comparte el código!
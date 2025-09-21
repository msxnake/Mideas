;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; END.ASM - Finalización de ROM MSX con alineamiento 8KB
;; Asegura que el ROM final sea múltiplo de 8KB como requiere MSX
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; ==================================================================
; INFORMACIÓN SOBRE TAMAÑO DE ROM MSX
; ==================================================================
;
; Los archivos ROM para MSX deben tener un tamaño que sea múltiplo
; de 8KB (8192 bytes). Esto es un requisito del hardware MSX.
;
; Tamaños válidos comunes:
; - 8KB   = 8192 bytes   = #2000 bytes
; - 16KB  = 16384 bytes  = #4000 bytes
; - 32KB  = 32768 bytes  = #8000 bytes
; - 64KB  = 65536 bytes  = #10000 bytes
; - 128KB = 131072 bytes = #20000 bytes
; - etc.
;
; Si el código no alcanza exactamente un múltiplo de 8KB,
; debemos rellenar con bytes hasta completar el siguiente múltiplo.
;
; ==================================================================

; ==================================================================
; PADDING AUTOMÁTICO PARA 8KB BOUNDARY
; ==================================================================

; Calcular cuántos bytes faltan para completar el siguiente múltiplo de 8KB
; Fórmula: padding_needed = 8192 - (current_address % 8192)
; Si el resultado es 8192, significa que ya estamos alineados (padding = 0)

current_size    EQU $ - #4000   ; Tamaño actual desde inicio del ROM (#4000)
boundary_8kb    EQU #2000       ; 8KB = 8192 bytes = #2000 en hexadecimal
mod_result      EQU current_size % boundary_8kb
padding_needed  EQU (boundary_8kb - mod_result) % boundary_8kb

; Solo añadir padding si es necesario (si padding_needed > 0)
IF padding_needed > 0
    ; Rellenar con bytes #FF hasta el siguiente boundary de 8KB
    DS padding_needed, #FF
ENDIF

; ==================================================================
; VERIFICACIÓN FINAL DE TAMAÑO
; ==================================================================

final_size      EQU $ - #4000   ; Tamaño final del ROM
verify_multiple EQU final_size % boundary_8kb

; Esta verificación debería dar 0 si todo está correcto
IF verify_multiple != 0
    .ERROR "ROM size is not a multiple of 8KB! Check padding calculation."
ENDIF

; ==================================================================
; INFORMACIÓN DE DEBUG (Solo para referencia durante compilación)
; ==================================================================

; Para debug: mostrar información de tamaño
; (Estos valores solo son visibles durante la compilación)
;
; Tamaño antes del padding: current_size bytes
; Padding añadido: padding_needed bytes
; Tamaño final: final_size bytes
; Múltiplos de 8KB: final_size / 8192

; ==================================================================
; VARIANTES DE USO
; ==================================================================

; OPCIÓN 1: Padding con #FF (recomendado)
; DS padding_needed, #FF

; OPCIÓN 2: Padding con #00
; DS padding_needed, #00

; OPCIÓN 3: Padding con bytes aleatorios (no recomendado)
; DS padding_needed, #C9  ; RET instruction

; OPCIÓN 4: Para ROMs que necesitan alineamiento específico
; current_addr    EQU $
; target_addr     EQU (current_addr + boundary_8kb - 1) & ~(boundary_8kb - 1)
; padding_bytes   EQU target_addr - current_addr
; DS padding_bytes, #FF

; ==================================================================
; NOTAS IMPORTANTES
; ==================================================================

; 1. Este archivo debe incluirse al FINAL de tu proyecto, después
;    de todo el código y datos del juego.
;
; 2. El cálculo asume que el ROM inicia en #4000 (cartridge estándar).
;    Si usas una dirección diferente, ajusta la fórmula.
;
; 3. El compilador glass.jar soporta estas operaciones matemáticas
;    y condicionales (IF/ENDIF).
;
; 4. El padding con #FF es recomendado porque representa instrucciones
;    RST #38 que son relativamente seguras si se ejecutan por error.
;
; 5. Para ROMs de 32KB o más, considera usar bancos de memoria y
;    ajustar el cálculo en consecuencia.

; ==================================================================
; EJEMPLO DE INCLUSIÓN EN MAIN.ASM
; ==================================================================

; Al final de tu archivo principal (main.asm):
;
; ; ... todo tu código aquí ...
; ; ... datos del juego ...
;
; ; Alineamiento final para ROM
; INCLUDE "End.asm"
;
; ==================================================================

; ==================================================================
; END OF END.ASM
; ==================================================================
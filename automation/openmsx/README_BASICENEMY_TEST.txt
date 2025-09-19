BASICENEMY ROM TESTING WITH OPENMSX
====================================

Archivos creados para probar el ROM BasicEnemy:

UBICACION DE ARCHIVOS:
---------------------
ROM a probar: C:\Users\salam\Documents\Programacion\Mideas\server\temp\basicenemy_generated.rom
Scripts de automatizacion: C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\

EJECUCION RAPIDA - CAPTURA DE SCREENSHOT:
-----------------------------------------
1. Ejecutar: run_basicenemy_test.bat
   - Carga automaticamente el ROM BasicEnemy en OpenMSX
   - Espera 10 segundos para que se ejecute el programa
   - Captura screenshot automaticamente
   - Guarda la imagen en la carpeta screenshots/

DEBUGGING PASO A PASO:
---------------------
1. Ejecutar: run_debug_session.bat
   - Inicia OpenMSX con el ROM cargado y debugging habilitado
   - Establece breakpoint en 0x4000 (inicio del cartucho)
   - Proporciona comandos para analisis detallado

COMANDOS DE DEBUG DISPONIBLES:
------------------------------
Ejecucion:
  step              - Ejecutar una instruccion
  step_over         - Saltar sobre llamadas a subrutinas
  step_out          - Salir de subrutina actual
  debug cont        - Continuar ejecucion hasta breakpoint

Breakpoints:
  debug set_bp <addr>    - Establecer breakpoint (ej: 0x4000)
  debug remove_bp <id>   - Quitar breakpoint por ID
  debug list_bp          - Listar todos los breakpoints

Memoria y registros:
  info register          - Mostrar registros CPU (A, BC, DE, HL, SP, PC)
  info memory <addr>     - Mostrar contenido de memoria
  peek <addr>            - Leer byte de memoria
  poke <addr> <value>    - Escribir byte en memoria

Funciones personalizadas:
  inspect_memory         - Inspeccionar areas de memoria comunes
  show_context          - Mostrar contexto de ejecucion actual
  set_common_breakpoints - Establecer breakpoints en vectores RST

AREAS DE MEMORIA IMPORTANTES PARA BASICENEMY:
---------------------------------------------
0x0000-0x3FFF: BIOS ROM
0x4000-0x7FFF: Tu ROM (codigo BasicEnemy)
0x8000-0x9FFF: Tabla de patrones (graficos de tiles)
0xA000-0xA7FF: Tabla de colores
0xC000-0xFFFF: RAM

VDP (chip de video):
0x0000-0x17FF: Tabla de patrones
0x1800-0x1AFF: Tabla de nombres
0x2000-0x37FF: Tabla de colores
0x3800-0x3FFF: Tabla de atributos de sprites

FLUJO DE TESTING RECOMENDADO:
-----------------------------
1. Primero ejecutar run_basicenemy_test.bat para ver resultado general
2. Si hay problemas, usar run_debug_session.bat para analisis detallado
3. Establecer breakpoints en areas clave (inicio ROM, bucles principales)
4. Usar step/step_over para seguir la ejecucion
5. Inspeccionar memoria VDP para verificar graficos/sprites

CONFIGURACION MSX:
------------------
- El ROM esta configurado para MSX1 con modo Screen 2
- Incluye 1 tile (brick1) y 1 sprite
- Contiene 4 archivos de codigo ASM del proyecto Mideas

SCREENSHOTS:
-----------
Los screenshots se guardan automaticamente en:
C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\screenshots\

Formato del nombre: basicenemy_test_MMDDYYYY_HHMMSS.png
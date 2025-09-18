@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   OpenMSX Screenshot Tool v2.0
echo ========================================

if "%~1"=="" (
    echo ERROR: Especifique un archivo ROM
    echo Uso: %0 "archivo.rom"
    pause
    exit /b 1
)

set "ROM_PATH=%~1"
set "ROM_NAME=%~n1"
set "OPENMSX_PATH=C:\Program Files\openMSX\openmsx.exe"
set "SCREENSHOT_DIR=screenshots"

REM Generar timestamp único
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set "fecha=%%d%%b%%c"
for /f "tokens=1-3 delims=: " %%a in ("%time%") do set "hora=%%a%%b%%c"
set "TIMESTAMP=%fecha%_%hora%"
set "TIMESTAMP=!TIMESTAMP: =0!"

set "SCREENSHOT_FILE=%ROM_NAME%_%TIMESTAMP%.png"
set "FULL_SCREENSHOT_PATH=%CD%\%SCREENSHOT_DIR%\%SCREENSHOT_FILE%"

echo ROM: %ROM_PATH%
echo Screenshot: %SCREENSHOT_FILE%

REM Crear directorio
if not exist "%SCREENSHOT_DIR%" (
    mkdir "%SCREENSHOT_DIR%"
    echo Directorio creado: %SCREENSHOT_DIR%
)

REM Verificar archivos
if not exist "%ROM_PATH%" (
    echo ERROR: ROM no encontrado: %ROM_PATH%
    pause
    exit /b 1
)

if not exist "%OPENMSX_PATH%" (
    echo ERROR: OpenMSX no encontrado: %OPENMSX_PATH%
    pause
    exit /b 1
)

REM Crear script TCL funcional
set "TCL_SCRIPT=%TEMP%\screenshot_%TIMESTAMP%.tcl"

REM Escribir script con sintaxis correcta
(
echo # Screenshot automation script
echo puts "Iniciando automatización de screenshot..."
echo puts "ROM: %ROM_NAME%"
echo puts "Esperando 10 segundos para que cargue el ROM..."
echo.
echo after 10000 {
echo     puts "Capturando screenshot..."
echo     set screenshot_path {%FULL_SCREENSHOT_PATH:\=/%}
echo     puts "Ruta: $screenshot_path"
echo.
echo     # Intentar screenshot
echo     if {[catch {screenshot $screenshot_path} err]} {
echo         puts "Error screenshot: $err"
echo         puts "Intentando con savescreen..."
echo         if {[catch {savescreen $screenshot_path} err2]} {
echo             puts "Error savescreen: $err2"
echo         } else {
echo             puts "Savescreen exitoso"
echo         }
echo     } else {
echo         puts "Screenshot exitoso"
echo     }
echo.
echo     after 2000 exit
echo }
) > "%TCL_SCRIPT%"

echo.
echo Script TCL: %TCL_SCRIPT%
echo Screenshot path: %FULL_SCREENSHOT_PATH%
echo.
echo Iniciando OpenMSX...
echo (Se cerrará automáticamente después del screenshot^)

REM Ejecutar OpenMSX y esperar
start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL_SCRIPT%"

echo OpenMSX terminó.

REM Verificar resultado
if exist "%FULL_SCREENSHOT_PATH%" (
    echo.
    echo ========================================
    echo   ✅ ÉXITO: Screenshot capturado
    echo ========================================
    echo Archivo: %SCREENSHOT_FILE%
    echo Tamaño:
    dir "%FULL_SCREENSHOT_PATH%" | find "%SCREENSHOT_FILE%"
    echo.
    echo Abriendo directorio...
    start explorer "%CD%\%SCREENSHOT_DIR%"
) else (
    echo.
    echo ========================================
    echo   ❌ FALLO: Screenshot no creado
    echo ========================================
    echo.
    echo Debug info:
    echo - ROM path: %ROM_PATH%
    echo - Screenshot dir: %CD%\%SCREENSHOT_DIR%
    echo - Expected file: %FULL_SCREENSHOT_PATH%
    echo.
    echo Contenido del script TCL:
    type "%TCL_SCRIPT%"
    echo.
    echo Archivos en screenshots:
    dir "%SCREENSHOT_DIR%" 2>nul
)

REM Limpiar script temporal
if exist "%TCL_SCRIPT%" del "%TCL_SCRIPT%"

echo.
pause
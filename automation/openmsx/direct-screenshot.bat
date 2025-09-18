@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   OpenMSX Direct Screenshot
echo ========================================

if "%~1"=="" (
    echo ERROR: Debe especificar un archivo ROM
    echo Uso: %0 "archivo.rom" [segundos_espera]
    pause
    exit /b 1
)

set "ROM_PATH=%~1"
set "ROM_NAME=%~n1"
set "WAIT_SECONDS=%~2"
if "%WAIT_SECONDS%"=="" set "WAIT_SECONDS=10"

set "OPENMSX_PATH=C:\Program Files\openMSX\openmsx.exe"
set "SCREENSHOT_DIR=screenshots"
set "TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=!TIMESTAMP: =0!"
set "SCREENSHOT_FILE=%ROM_NAME%_%TIMESTAMP%.png"

echo ROM: %ROM_PATH%
echo Espera: %WAIT_SECONDS% segundos
echo Screenshot: %SCREENSHOT_FILE%

REM Crear directorio
if not exist "%SCREENSHOT_DIR%" mkdir "%SCREENSHOT_DIR%"

REM Crear script TCL que funciona
set "TCL_FILE=%TEMP%\openmsx_ss_%TIMESTAMP%.tcl"
(
echo puts "=== OpenMSX Screenshot Script ==="
echo puts "ROM cargado, esperando %WAIT_SECONDS% segundos..."
echo.
echo proc take_screenshot {} {
echo     global screenshot_file
echo     puts "Intentando capturar screenshot: $screenshot_file"
echo
echo     if {[catch {screenshot $screenshot_file} error]} {
echo         puts "Error en screenshot: $error"
echo         puts "Intentando metodo alternativo..."
echo         if {[catch {savescreen $screenshot_file} error2]} {
echo             puts "Error en savescreen: $error2"
echo         } else {
echo             puts "Screenshot guardado con savescreen"
echo         }
echo     } else {
echo         puts "Screenshot guardado exitosamente"
echo     }
echo
echo     after 2000 {
echo         puts "Cerrando OpenMSX..."
echo         exit
echo     }
echo }
echo.
echo set screenshot_file [file join [pwd] "%SCREENSHOT_DIR%" "%SCREENSHOT_FILE%"]
echo puts "Archivo screenshot: $screenshot_file"
echo.
echo after [expr %WAIT_SECONDS% * 1000] {
echo     take_screenshot
echo }
) > "%TCL_FILE%"

echo.
echo Script TCL creado: %TCL_FILE%
echo Iniciando OpenMSX...

REM Ejecutar OpenMSX
start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL_FILE%"

echo OpenMSX cerrado.

REM Verificar resultado
if exist "%SCREENSHOT_DIR%\%SCREENSHOT_FILE%" (
    echo.
    echo ========================================
    echo   ✅ SUCCESS: Screenshot creado
    echo ========================================
    echo Archivo: %SCREENSHOT_DIR%\%SCREENSHOT_FILE%
    start explorer "%CD%\%SCREENSHOT_DIR%"
) else (
    echo.
    echo ========================================
    echo   ❌ FAILED: No se creó el screenshot
    echo ========================================
    echo Posibles causas:
    echo - ROM no válido o no compatible
    echo - OpenMSX no pudo cargar el ROM
    echo - Problema con el comando screenshot
    dir "%SCREENSHOT_DIR%" 2>nul
)

REM Mostrar contenido del script para debug
echo.
echo === Contenido del script TCL ===
type "%TCL_FILE%"

REM Limpiar
if exist "%TCL_FILE%" del "%TCL_FILE%"

pause
@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   OpenMSX Screenshot Tool (Fixed)
echo ========================================

if "%~1"=="" (
    echo ERROR: Debe especificar un archivo ROM
    echo Uso: %0 "archivo.rom"
    pause
    exit /b 1
)

set "ROM_PATH=%~1"
set "ROM_NAME=%~n1"
set "OPENMSX_PATH=C:\Program Files\openMSX\openmsx.exe"
set "SCREENSHOT_DIR=screenshots"
set "TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=!TIMESTAMP: =0!"

echo ROM: %ROM_PATH%
echo Screenshot: %ROM_NAME%_%TIMESTAMP%.png

REM Crear directorio de screenshots
if not exist "%SCREENSHOT_DIR%" mkdir "%SCREENSHOT_DIR%"

REM Crear script TCL corregido
set "TCL_FILE=%TEMP%\screenshot_%TIMESTAMP%.tcl"
(
echo # OpenMSX Screenshot Automation
echo puts "Iniciando ROM..."
echo after 10000 {
echo     puts "Capturando screenshot..."
echo     catch {screenshot "%CD:\=/%/%SCREENSHOT_DIR%/%ROM_NAME%_%TIMESTAMP%.png"} result
echo     puts "Screenshot result: $result"
echo     after 1000 {
echo         puts "Cerrando OpenMSX..."
echo         exit
echo     }
echo }
) > "%TCL_FILE%"

echo.
echo Iniciando OpenMSX con script TCL...
echo Archivo TCL: %TCL_FILE%

REM Ejecutar OpenMSX
"%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL_FILE%"

REM Verificar si se creo el screenshot
if exist "%SCREENSHOT_DIR%\%ROM_NAME%_%TIMESTAMP%.png" (
    echo.
    echo ========================================
    echo   ✅ Screenshot exitoso
    echo ========================================
    echo Archivo: %SCREENSHOT_DIR%\%ROM_NAME%_%TIMESTAMP%.png
    start explorer "%CD%\%SCREENSHOT_DIR%"
) else (
    echo.
    echo ========================================
    echo   ❌ Screenshot falló
    echo ========================================
    echo Verifique que el ROM se cargue correctamente
)

REM Limpiar archivo temporal
if exist "%TCL_FILE%" del "%TCL_FILE%"

pause
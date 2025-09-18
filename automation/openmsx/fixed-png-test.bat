@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   OpenMSX PNG Fix Test
echo ========================================

set "ROM_PATH=%~1"
if "%ROM_PATH%"=="" set "ROM_PATH=..\..\server\first.rom"

set "OPENMSX_PATH=C:\Program Files\openMSX\openmsx.exe"
set "SCREENSHOT_DIR=screenshots"
set "TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=!TIMESTAMP: =0!"

if not exist "%SCREENSHOT_DIR%" mkdir "%SCREENSHOT_DIR%"

echo ROM: %ROM_PATH%

REM Crear script TCL con sintaxis correcta
set "TCL_FILE=%TEMP%\fixed_screenshot_%TIMESTAMP%.tcl"

REM Escribir el script línea por línea con sintaxis correcta
echo puts "OpenMSX Screenshot Script - Sintaxis corregida" > "%TCL_FILE%"
echo puts "Esperando 10 segundos..." >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo proc take_screenshot {} { >> "%TCL_FILE%"
echo     puts "Iniciando captura de screenshot..." >> "%TCL_FILE%"
echo     set screenshot_file "%CD:\=/%/%SCREENSHOT_DIR%/fixed_screenshot_%TIMESTAMP%.png" >> "%TCL_FILE%"
echo     puts "Archivo: $screenshot_file" >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo     if {[catch {screenshot $screenshot_file} error]} { >> "%TCL_FILE%"
echo         puts "Error en screenshot: $error" >> "%TCL_FILE%"
echo         puts "Probando savescreen..." >> "%TCL_FILE%"
echo         if {[catch {savescreen $screenshot_file} error2]} { >> "%TCL_FILE%"
echo             puts "Error en savescreen: $error2" >> "%TCL_FILE%"
echo             puts "Probando captura con extensión .bmp..." >> "%TCL_FILE%"
echo             set bmp_file "%CD:\=/%/%SCREENSHOT_DIR%/fixed_screenshot_%TIMESTAMP%.bmp" >> "%TCL_FILE%"
echo             if {[catch {screenshot $bmp_file} error3]} { >> "%TCL_FILE%"
echo                 puts "Error en BMP: $error3" >> "%TCL_FILE%"
echo             } else { >> "%TCL_FILE%"
echo                 puts "SUCCESS: BMP creado" >> "%TCL_FILE%"
echo             } >> "%TCL_FILE%"
echo         } else { >> "%TCL_FILE%"
echo             puts "SUCCESS: savescreen funcionó" >> "%TCL_FILE%"
echo         } >> "%TCL_FILE%"
echo     } else { >> "%TCL_FILE%"
echo         puts "SUCCESS: screenshot funcionó" >> "%TCL_FILE%"
echo     } >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo     after 2000 { >> "%TCL_FILE%"
echo         puts "Cerrando OpenMSX..." >> "%TCL_FILE%"
echo         exit >> "%TCL_FILE%"
echo     } >> "%TCL_FILE%"
echo } >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo after 10000 take_screenshot >> "%TCL_FILE%"

echo.
echo Script TCL creado: %TCL_FILE%
echo.
echo === Contenido del script ===
type "%TCL_FILE%"
echo.
echo === Ejecutando OpenMSX ===

start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL_FILE%"

echo.
echo ========================================
echo   Resultados
echo ========================================

if exist "%SCREENSHOT_DIR%\fixed_screenshot_%TIMESTAMP%.png" (
    echo ✅ SUCCESS: PNG creado
    dir "%SCREENSHOT_DIR%\fixed_screenshot_%TIMESTAMP%.png"
) else if exist "%SCREENSHOT_DIR%\fixed_screenshot_%TIMESTAMP%.bmp" (
    echo ✅ SUCCESS: BMP creado
    dir "%SCREENSHOT_DIR%\fixed_screenshot_%TIMESTAMP%.bmp"
) else (
    echo ❌ No se creó ningún archivo de imagen
)

echo.
echo Todos los archivos en screenshots:
dir "%SCREENSHOT_DIR%"

del "%TCL_FILE%"
pause
@echo off
setlocal enabledelayedexpansion

REM ========================================
REM   OpenMSX Screenshot Automation v3.0
REM   Funcional - Captura PNG tras 10 segundos
REM ========================================

echo ========================================
echo   OpenMSX Screenshot Tool v3.0
echo ========================================

if "%~1"=="" (
    echo ERROR: Especifique un archivo ROM
    echo.
    echo Uso: %0 "archivo.rom" [segundos_espera] [directorio_salida]
    echo.
    echo Ejemplos:
    echo   %0 "mi_juego.rom"
    echo   %0 "mi_juego.rom" 15
    echo   %0 "mi_juego.rom" 10 "screenshots\custom"
    echo.
    pause
    exit /b 1
)

REM Parámetros
set "ROM_PATH=%~1"
set "WAIT_SECONDS=%~2"
set "OUTPUT_DIR=%~3"

REM Valores por defecto
if "%WAIT_SECONDS%"=="" set "WAIT_SECONDS=10"
if "%OUTPUT_DIR%"=="" set "OUTPUT_DIR=screenshots"

REM Configuración
set "ROM_NAME=%~n1"
set "OPENMSX_PATH=C:\Program Files\openMSX\openmsx.exe"

REM Generar timestamp único
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set "fecha=%%d%%b%%c"
for /f "tokens=1-3 delims=: " %%a in ("%time%") do set "hora=%%a%%b%%c"
set "TIMESTAMP=%fecha%_%hora%"
set "TIMESTAMP=!TIMESTAMP: =0!"

set "SCREENSHOT_FILE=%ROM_NAME%_%TIMESTAMP%.png"
set "FULL_SCREENSHOT_PATH=%CD%\%OUTPUT_DIR%\%SCREENSHOT_FILE%"

REM Mostrar información
echo ROM: %ROM_PATH%
echo Tiempo de espera: %WAIT_SECONDS% segundos
echo Directorio de salida: %OUTPUT_DIR%
echo Screenshot: %SCREENSHOT_FILE%
echo.

REM Verificaciones
if not exist "%ROM_PATH%" (
    echo ❌ ERROR: ROM no encontrado: %ROM_PATH%
    pause
    exit /b 1
)

if not exist "%OPENMSX_PATH%" (
    echo ❌ ERROR: OpenMSX no encontrado: %OPENMSX_PATH%
    echo.
    echo Verifique que OpenMSX esté instalado en:
    echo "%OPENMSX_PATH%"
    pause
    exit /b 1
)

REM Crear directorio de salida
if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
    echo ✅ Directorio creado: %OUTPUT_DIR%
)

REM Crear script TCL funcional
set "TCL_FILE=%TEMP%\openmsx_screenshot_%TIMESTAMP%.tcl"

echo # OpenMSX Screenshot Automation v3.0 > "%TCL_FILE%"
echo puts "========================================" >> "%TCL_FILE%"
echo puts "  OpenMSX Screenshot Automation v3.0" >> "%TCL_FILE%"
echo puts "========================================" >> "%TCL_FILE%"
echo puts "ROM: %ROM_NAME%" >> "%TCL_FILE%"
echo puts "Esperando %WAIT_SECONDS% segundos para la captura..." >> "%TCL_FILE%"
echo puts "" >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo proc capture_screenshot {} { >> "%TCL_FILE%"
echo     puts "🎮 Iniciando captura de screenshot..." >> "%TCL_FILE%"
echo     set screenshot_path "%CD:\=/%/%OUTPUT_DIR%/%SCREENSHOT_FILE%" >> "%TCL_FILE%"
echo     puts "📁 Archivo: $screenshot_path" >> "%TCL_FILE%"
echo     puts "" >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo     if {[catch {screenshot $screenshot_path} error]} { >> "%TCL_FILE%"
echo         puts "⚠️  Error en comando screenshot: $error" >> "%TCL_FILE%"
echo         puts "🔄 Intentando método alternativo..." >> "%TCL_FILE%"
echo         if {[catch {savescreen $screenshot_path} error2]} { >> "%TCL_FILE%"
echo             puts "❌ Error en savescreen: $error2" >> "%TCL_FILE%"
echo         } else { >> "%TCL_FILE%"
echo             puts "✅ SUCCESS: Captura realizada con savescreen" >> "%TCL_FILE%"
echo         } >> "%TCL_FILE%"
echo     } else { >> "%TCL_FILE%"
echo         puts "✅ SUCCESS: Screenshot capturado correctamente" >> "%TCL_FILE%"
echo     } >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo     puts "" >> "%TCL_FILE%"
echo     puts "🔄 Cerrando OpenMSX en 2 segundos..." >> "%TCL_FILE%"
echo     after 2000 { >> "%TCL_FILE%"
echo         puts "👋 Hasta la vista!" >> "%TCL_FILE%"
echo         exit >> "%TCL_FILE%"
echo     } >> "%TCL_FILE%"
echo } >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo after [expr %WAIT_SECONDS% * 1000] capture_screenshot >> "%TCL_FILE%"

echo ✅ Script TCL creado: %TCL_FILE%
echo.
echo 🚀 Iniciando OpenMSX...
echo ⏱️  El screenshot se capturará automáticamente tras %WAIT_SECONDS% segundos
echo 🔄 OpenMSX se cerrará automáticamente después de la captura
echo.

REM Ejecutar OpenMSX
start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL_FILE%"

echo 🏁 OpenMSX terminado.
echo.

REM Verificar resultado
if exist "%FULL_SCREENSHOT_PATH%" (
    echo ========================================
    echo   ✅ ÉXITO: Screenshot capturado
    echo ========================================
    echo 📷 Archivo: %SCREENSHOT_FILE%
    echo 📁 Ubicación: %OUTPUT_DIR%\
    echo 📏 Tamaño:
    for %%A in ("%FULL_SCREENSHOT_PATH%") do echo    %%~zA bytes
    echo.
    echo 🖼️  Abriendo directorio de screenshots...
    start explorer "%CD%\%OUTPUT_DIR%"
    echo.
    echo ✨ Screenshot listo para usar!
) else (
    echo ========================================
    echo   ❌ ERROR: Screenshot no creado
    echo ========================================
    echo.
    echo 🔍 Posibles causas:
    echo   - El ROM no se cargó correctamente
    echo   - Problema con el comando de captura
    echo   - Falta de permisos de escritura
    echo.
    echo 📋 Debug info:
    echo   ROM: %ROM_PATH%
    echo   Esperado: %FULL_SCREENSHOT_PATH%
    echo.
    echo 📁 Archivos actuales en %OUTPUT_DIR%:
    dir "%OUTPUT_DIR%" 2>nul
)

REM Limpiar script temporal
if exist "%TCL_FILE%" del "%TCL_FILE%"

echo.
echo ========================================
pause
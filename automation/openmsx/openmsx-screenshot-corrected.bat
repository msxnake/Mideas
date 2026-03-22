@echo off
setlocal enabledelayedexpansion

REM ========================================
REM   OpenMSX Screenshot - Comando Correcto
REM   Usando el comando 'screenshot' oficial
REM ========================================

echo ========================================
echo   OpenMSX Screenshot - Comando Correcto
echo ========================================

if "%~1"=="" (
    echo ERROR: Especifique un archivo ROM
    echo.
    echo Uso: %0 "archivo.rom" [segundos_espera]
    echo.
    pause
    exit /b 1
)

REM Parámetros
set "ROM_PATH=%~1"
set "WAIT_SECONDS=%~2"
set "ROM_TYPE=%~3"

REM Valores por defecto
if "%WAIT_SECONDS%"=="" set "WAIT_SECONDS=10"

REM Configuración
set "ROM_NAME=%~n1"
set "OPENMSX_PATH=C:\Program Files\openMSX\openmsx.exe"
set "LOCAL_SCREENSHOTS=screenshots"

REM Generar timestamp único
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set "fecha=%%d%%b%%c"
for /f "tokens=1-3 delims=: " %%a in ("%time%") do set "hora=%%a%%b%%c"
set "TIMESTAMP=%fecha%_%hora%"
set "TIMESTAMP=!TIMESTAMP: =0!"
set "TIMESTAMP=!TIMESTAMP:,=!"

set "SCREENSHOT_NAME=%ROM_NAME%_%TIMESTAMP%"

REM Crear directorio local
if not exist "%LOCAL_SCREENSHOTS%" mkdir "%LOCAL_SCREENSHOTS%"

REM Mostrar información
echo ROM: %ROM_PATH%
echo Tiempo de espera: %WAIT_SECONDS% segundos
echo Screenshot prefix: %SCREENSHOT_NAME%
echo.

REM Verificaciones
if not exist "%ROM_PATH%" (
    echo ❌ ERROR: ROM no encontrado: %ROM_PATH%
    pause
    exit /b 1
)

if not exist "%OPENMSX_PATH%" (
    echo ❌ ERROR: OpenMSX no encontrado: %OPENMSX_PATH%
    pause
    exit /b 1
)

REM Crear script TCL con comando screenshot correcto
set "TCL_FILE=%TEMP%\openmsx_screenshot_corrected_%TIMESTAMP%.tcl"

echo # OpenMSX Screenshot - Comando Correcto > "%TCL_FILE%"
echo puts "========================================" >> "%TCL_FILE%"
echo puts "  OpenMSX Screenshot - Comando Oficial" >> "%TCL_FILE%"
echo puts "========================================" >> "%TCL_FILE%"
echo puts "ROM: %ROM_NAME%" >> "%TCL_FILE%"
echo puts "Esperando %WAIT_SECONDS% segundos..." >> "%TCL_FILE%"
echo puts "" >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo proc take_screenshot {} { >> "%TCL_FILE%"
echo     puts "🎮 Iniciando captura con comando oficial..." >> "%TCL_FILE%"
echo     puts "" >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo     # Método 1: screenshot con nombre específico >> "%TCL_FILE%"
echo     puts "📷 Método 1: screenshot con nombre específico" >> "%TCL_FILE%"
echo     set local_path "%CD:\=/%/%LOCAL_SCREENSHOTS%/%SCREENSHOT_NAME%.png" >> "%TCL_FILE%"
echo     if {[catch {screenshot $local_path} error1]} { >> "%TCL_FILE%"
echo         puts "⚠️  Error método 1: $error1" >> "%TCL_FILE%"
echo         puts "" >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo         # Método 2: screenshot con prefix >> "%TCL_FILE%"
echo         puts "📷 Método 2: screenshot con prefix" >> "%TCL_FILE%"
echo         if {[catch {screenshot -prefix %SCREENSHOT_NAME%} error2]} { >> "%TCL_FILE%"
echo             puts "⚠️  Error método 2: $error2" >> "%TCL_FILE%"
echo             puts "" >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo             # Método 3: screenshot automático >> "%TCL_FILE%"
echo             puts "📷 Método 3: screenshot automático" >> "%TCL_FILE%"
echo             if {[catch {screenshot} error3]} { >> "%TCL_FILE%"
echo                 puts "❌ Error método 3: $error3" >> "%TCL_FILE%"
echo             } else { >> "%TCL_FILE%"
echo                 puts "✅ SUCCESS: Screenshot automático creado" >> "%TCL_FILE%"
echo                 puts "📁 Busque el archivo en el directorio screenshots de OpenMSX" >> "%TCL_FILE%"
echo             } >> "%TCL_FILE%"
echo         } else { >> "%TCL_FILE%"
echo             puts "✅ SUCCESS: Screenshot con prefix creado" >> "%TCL_FILE%"
echo         } >> "%TCL_FILE%"
echo     } else { >> "%TCL_FILE%"
echo         puts "✅ SUCCESS: Screenshot con ruta específica creado" >> "%TCL_FILE%"
echo         puts "📁 Archivo: $local_path" >> "%TCL_FILE%"
echo     } >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo     puts "" >> "%TCL_FILE%"
echo     puts "🔍 Verificando archivos creados..." >> "%TCL_FILE%"
echo     puts "🔄 Cerrando OpenMSX en 3 segundos..." >> "%TCL_FILE%"
echo     after 3000 { >> "%TCL_FILE%"
echo         puts "👋 ¡Captura completada!" >> "%TCL_FILE%"
echo         exit >> "%TCL_FILE%"
echo     } >> "%TCL_FILE%"
echo } >> "%TCL_FILE%"
echo. >> "%TCL_FILE%"
echo after [expr %WAIT_SECONDS% * 1000] take_screenshot >> "%TCL_FILE%"

echo ✅ Script TCL creado con comando oficial
echo.
echo 🚀 Iniciando OpenMSX...

REM Ejecutar OpenMSX
if "%ROM_TYPE%"=="" (
    start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL_FILE%"
) else (
    start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -romtype %ROM_TYPE% -script "%TCL_FILE%"
)

echo.
echo 🏁 OpenMSX terminado.
echo.
echo ========================================
echo   🔍 Verificando resultados
echo ========================================

REM Verificar en directorio local
set "LOCAL_FILE=%LOCAL_SCREENSHOTS%\%SCREENSHOT_NAME%.png"
if exist "%LOCAL_FILE%" (
    echo ✅ Screenshot encontrado en directorio local:
    echo    📷 %LOCAL_FILE%
    for %%A in ("%LOCAL_FILE%") do echo    📏 %%~zA bytes
    echo.
    start explorer "%CD%\%LOCAL_SCREENSHOTS%"
) else (
    echo ❌ No se encontró screenshot en directorio local
)

REM Verificar en directorio de OpenMSX (ubicación típica)
set "OPENMSX_SCREENSHOTS_DIR=%USERPROFILE%\openMSX\share\screenshots"
if exist "%OPENMSX_SCREENSHOTS_DIR%" (
    echo 📁 Verificando directorio OpenMSX: %OPENMSX_SCREENSHOTS_DIR%
    dir "%OPENMSX_SCREENSHOTS_DIR%\*.png" /O:D 2>nul | find ".png" && (
        echo ✅ Screenshots encontrados en directorio OpenMSX
        echo 🖼️  Abriendo directorio OpenMSX...
        start explorer "%OPENMSX_SCREENSHOTS_DIR%"
    ) || (
        echo ❌ No hay screenshots recientes en directorio OpenMSX
    )
) else (
    echo ❌ Directorio OpenMSX no encontrado: %OPENMSX_SCREENSHOTS_DIR%
)

REM Limpiar script temporal
if exist "%TCL_FILE%" del "%TCL_FILE%"

echo.
echo ========================================
pause

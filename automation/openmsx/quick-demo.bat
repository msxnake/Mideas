@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   OpenMSX Automation - Demo Rapido
echo ========================================
echo.

echo Este demo muestra las capacidades del sistema de automatizacion OpenMSX.
echo.

REM Verificar si hay ROMs en el directorio temp
set TEMP_DIR=..\..\server\temp
if not exist "%TEMP_DIR%" (
    echo ERROR: Directorio temp no encontrado: %TEMP_DIR%
    echo.
    echo Para usar este demo:
    echo 1. Compile algun codigo ASM primero para generar ROMs
    echo 2. O coloque archivos .rom en el directorio server\temp\
    goto :end
)

echo Buscando ROMs en %TEMP_DIR%...
set ROM_COUNT=0
for %%f in ("%TEMP_DIR%\*.rom") do (
    set /a ROM_COUNT+=1
    set "FIRST_ROM=%%f"
)

if %ROM_COUNT%==0 (
    echo No se encontraron archivos ROM en %TEMP_DIR%
    echo.
    echo Para generar ROMs de prueba:
    echo 1. Abra la aplicacion MSX IDE
    echo 2. Escriba codigo Z80 ASM
    echo 3. Compile usando el boton "Compile ASM"
    echo 4. Los ROMs se guardaran en server\temp\
    goto :end
)

echo Encontrados %ROM_COUNT% ROM(s) en el directorio temp.
echo Primer ROM: %FIRST_ROM%
echo.

REM Menu de opciones
echo Seleccione una opcion de demo:
echo.
echo 1. Screenshot de un ROM especifico
echo 2. Screenshots de todos los ROMs (lote)
echo 3. Verificar instalacion del sistema
echo 4. Ver configuracion actual
echo 5. Salir
echo.

set /p CHOICE="Ingrese su eleccion (1-5): "

if "%CHOICE%"=="1" goto :demo_single
if "%CHOICE%"=="2" goto :demo_batch
if "%CHOICE%"=="3" goto :demo_verify
if "%CHOICE%"=="4" goto :demo_config
if "%CHOICE%"=="5" goto :end

echo Opcion invalida.
goto :end

:demo_single
echo.
echo === DEMO: Screenshot Individual ===
echo.
echo Generando screenshot del primer ROM encontrado...
echo ROM: %FIRST_ROM%
echo Tiempo de espera: 8 segundos (demo rapido)
echo Directorio de salida: screenshots\demo
echo.

call openmsx-screenshot.bat "%FIRST_ROM%" 8 screenshots\demo

echo.
echo Demo de screenshot individual completado.
goto :end

:demo_batch
echo.
echo === DEMO: Screenshots en Lote ===
echo.
echo Generando screenshots de todos los ROMs en temp...
echo Directorio de entrada: %TEMP_DIR%
echo Tiempo de espera por ROM: 8 segundos
echo Directorio de salida: screenshots\demo_batch
echo.

powershell.exe -ExecutionPolicy Bypass -File "batch-screenshots.ps1" -InputDir "%TEMP_DIR%" -OutputDir "screenshots\demo_batch" -WaitSeconds 8

echo.
echo Demo de screenshots en lote completado.
goto :end

:demo_verify
echo.
echo === DEMO: Verificacion del Sistema ===
echo.
echo Ejecutando verificaciones de instalacion...
echo.

powershell.exe -ExecutionPolicy Bypass -File "test-automation.ps1" -CheckOnly

echo.
echo Verificacion del sistema completada.
goto :end

:demo_config
echo.
echo === DEMO: Configuracion Actual ===
echo.

if exist config.json (
    echo Archivo de configuracion encontrado: config.json
    echo.
    echo Contenido:
    type config.json
) else (
    echo Archivo de configuracion no encontrado.
)

echo.
echo Archivos disponibles en el directorio de automatizacion:
dir /b *.ps1 *.bat *.tcl *.js *.json *.md 2>nul

echo.
echo Scripts principales:
echo - openmsx-automation.ps1    : Script principal de PowerShell
echo - openmsx-screenshot.bat    : Interface simplificada
echo - batch-screenshots.ps1     : Procesamiento en lote
echo - test-automation.ps1       : Verificacion del sistema

goto :end

:end
echo.
echo Documentacion completa: README.md
echo.
echo Presione cualquier tecla para cerrar...
pause >nul
@echo off
setlocal enabledelayedexpansion

REM ========================================
REM   RUN OPENMSX - Para testear ROMs
REM   Ejecuta ROM y deja OpenMSX abierto
REM ========================================

echo ========================================
echo   RUN OPENMSX - Test ROM
echo ========================================

if "%~1"=="" (
    echo ERROR: Especifique un archivo ROM
    echo.
    echo Uso: %0 "archivo.rom"
    echo.
    pause
    exit /b 1
)

REM Configuración
set "ROM_PATH=%~1"
set "ROM_NAME=%~n1"
set "OPENMSX_PATH=C:\Program Files\openMSX\openmsx.exe"

REM Mostrar información
echo 🎮 ROM: %ROM_PATH%
echo 🎯 Archivo: %ROM_NAME%
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

echo ✅ ROM válido encontrado
echo ✅ OpenMSX disponible
echo.
echo 🚀 Iniciando OpenMSX para testing...
echo 🎮 El emulador permanecerá abierto para que puedas probar el ROM
echo 🔄 Cierra OpenMSX manualmente cuando termines de probar
echo.

REM Ejecutar OpenMSX sin script - permanece abierto
start "" "%OPENMSX_PATH%" -cart "%ROM_PATH%"

echo ✅ OpenMSX iniciado con el ROM
echo 🎮 ¡Disfruta probando tu ROM!
echo.
echo Nota: Este script terminará pero OpenMSX seguirá ejecutándose.
echo.

REM No esperamos - el script termina pero OpenMSX sigue ejecutándose
echo ========================================
pause
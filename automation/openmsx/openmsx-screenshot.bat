@echo off
setlocal enabledelayedexpansion

REM ========================================
REM  OpenMSX Screenshot Automation v1.0
REM ========================================

echo.
echo ========================================
echo   OpenMSX Screenshot Automation v1.0
echo ========================================
echo.

REM Verificar argumentos
if "%~1"=="" (
    echo ERROR: Se requiere la ruta del ROM como parametro
    echo.
    echo Uso: %~nx0 ^<ruta_del_rom^> [tiempo_espera] [directorio_salida]
    echo.
    echo Ejemplos:
    echo   %~nx0 game.rom
    echo   %~nx0 "C:\roms\my game.rom" 15
    echo   %~nx0 server\temp\source_123.rom 10 screenshots\batch
    echo.
    goto :error
)

set ROM_PATH=%~1
set WAIT_TIME=%~2
set OUTPUT_DIR=%~3

REM Valores por defecto
if "%WAIT_TIME%"=="" set WAIT_TIME=10
if "%OUTPUT_DIR%"=="" set OUTPUT_DIR=screenshots

REM Verificar que existe el archivo ROM
if not exist "%ROM_PATH%" (
    echo ERROR: Archivo ROM no encontrado: %ROM_PATH%
    goto :error
)

REM Mostrar configuración
echo ROM: %ROM_PATH%
echo Tiempo de espera: %WAIT_TIME% segundos
echo Directorio de salida: %OUTPUT_DIR%
echo.

REM Buscar PowerShell
where powershell.exe >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell no encontrado en el sistema
    goto :error
)

REM Ruta del script PowerShell
set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%openmsx-automation.ps1

REM Verificar que existe el script PowerShell
if not exist "%PS_SCRIPT%" (
    echo ERROR: Script PowerShell no encontrado: %PS_SCRIPT%
    goto :error
)

echo Ejecutando automatizacion...
echo.

REM Ejecutar script PowerShell
powershell.exe -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -RomPath "%ROM_PATH%" -WaitSeconds %WAIT_TIME% -OutputDir "%OUTPUT_DIR%"

set PS_EXIT_CODE=%ERRORLEVEL%

echo.
if %PS_EXIT_CODE%==0 (
    echo ========================================
    echo   ✅ SCREENSHOT AUTOMATION EXITOSA
    echo ========================================
    echo.
    echo 📷 Screenshot capturado exitosamente
    echo 📁 Revise el directorio: %OUTPUT_DIR%
    echo.

    REM Abrir directorio de screenshots si existe
    if exist "%OUTPUT_DIR%" (
        echo Abriendo directorio de screenshots...
        explorer "%OUTPUT_DIR%"
    )

) else (
    echo ========================================
    echo   ❌ SCREENSHOT AUTOMATION FALLÓ
    echo ========================================
    echo.
    echo Revise los mensajes de error anteriores.
    echo Código de salida: %PS_EXIT_CODE%
)

echo.
echo Presione cualquier tecla para cerrar...
pause >nul
exit /b %PS_EXIT_CODE%

:error
echo.
echo Presione cualquier tecla para cerrar...
pause >nul
exit /b 1
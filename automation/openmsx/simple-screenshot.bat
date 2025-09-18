@echo off
setlocal enabledelayedexpansion

REM Script simple para OpenMSX Screenshot
echo ========================================
echo   OpenMSX Simple Screenshot Tool
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

REM Verificar que existe el ROM
if not exist "%ROM_PATH%" (
    echo ERROR: ROM no encontrado: %ROM_PATH%
    pause
    exit /b 1
)

REM Verificar OpenMSX
if not exist "%OPENMSX_PATH%" (
    echo ERROR: OpenMSX no encontrado en: %OPENMSX_PATH%
    pause
    exit /b 1
)

REM Crear script TCL temporal
set "TCL_FILE=%TEMP%\screenshot_%TIMESTAMP%.tcl"
echo # Script automatico para screenshot > "%TCL_FILE%"
echo after 10000 { >> "%TCL_FILE%"
echo     screenshot "%CD%\%SCREENSHOT_DIR%\%ROM_NAME%_%TIMESTAMP%.png" >> "%TCL_FILE%"
echo     after 1000 { >> "%TCL_FILE%"
echo         exit >> "%TCL_FILE%"
echo     } >> "%TCL_FILE%"
echo } >> "%TCL_FILE%"

echo.
echo Iniciando OpenMSX...
echo Espere 10 segundos para el screenshot...

REM Ejecutar OpenMSX
"%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL_FILE%"

REM Limpiar archivo temporal
if exist "%TCL_FILE%" del "%TCL_FILE%"

echo.
echo ========================================
echo   Screenshot completado
echo ========================================
echo Archivo: %SCREENSHOT_DIR%\%ROM_NAME%_%TIMESTAMP%.png

REM Abrir directorio
start explorer "%CD%\%SCREENSHOT_DIR%"

pause
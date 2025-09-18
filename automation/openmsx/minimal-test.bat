@echo off
echo Probando OpenMSX con ROM simple...

set "OPENMSX=C:\Program Files\openMSX\openmsx.exe"
set "ROM=..\..\server\first.rom"

echo ROM: %ROM%
echo OpenMSX: %OPENMSX%

REM Probar cargar el ROM sin script
echo.
echo === Test 1: Cargar ROM sin automatización ===
echo Presione ESC para cerrar OpenMSX cuando aparezca
timeout 3
"%OPENMSX%" -cart "%ROM%"

echo.
echo OpenMSX cerrado. ¿Se cargó correctamente el ROM?
pause
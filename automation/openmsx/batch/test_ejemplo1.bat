@echo off
echo ========================================
echo OpenMSX ROM Test Automation
echo ========================================
echo ROM: ejemplo1.rom
echo Screenshot: ejemplo1_rom_test.png
echo ========================================

set OPENMSX="C:\Program Files\openMSX\openmsx.exe"
set ROM="C:\Users\salam\Documents\Programacion\Mideas\server\temp\ejemplo1_output\ejemplo1.rom"
set SCREENSHOT="C:\Users\salam\Documents\Programacion\Mideas\screenshots\ejemplo1_rom_test.png"

echo Starting OpenMSX...
%OPENMSX% -carta %ROM% -command "after time 4000 {screenshot %SCREENSHOT%; after time 1000 exit}"

echo.
echo Test completed!
pause

@echo off
echo Running test.rom in OpenMSX...
echo ROM file: test.rom
echo Expected: SCREEN 2 mode with 16x16 sprite at position (120,88)
echo.

"C:\Program Files\openMSX\openmsx.exe" -script "C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\test_rom_capture.tcl"

echo.
echo Test completed. Check screenshots folder for captured image.
pause
@echo off
echo =========================================
echo OpenMSX BasicEnemy FASE4 ROM Test
echo =========================================
echo.
echo Starting OpenMSX with BasicEnemy.rom...
echo Please wait 3-4 seconds after launch, then:
echo 1. Press F12 to open OpenMSX menu
echo 2. Select "Save Screenshot"
echo 3. Save as: BasicEnemy_FASE4_test_[timestamp].png
echo.
echo ROM Path: c:\Users\salam\Documents\Programacion\Mideas\server\temp\BasicEnemy.rom
echo Screenshot Dir: c:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\screenshots
echo.

start "" "C:\Program Files\openMSX\openmsx.exe" -carta "c:\Users\salam\Documents\Programacion\Mideas\server\temp\BasicEnemy.rom"

echo.
echo OpenMSX launched in separate window!
echo.
pause

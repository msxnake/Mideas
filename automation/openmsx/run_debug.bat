@echo off
echo ==================================================
echo   OpenMSX Debug Session for BasicEnemy_fixed.rom
echo ==================================================
echo.
echo This will start OpenMSX with debugging enabled
echo and load the BasicEnemy_fixed.rom for analysis.
echo.
echo Key debugging commands after OpenMSX starts:
echo   debug_basicenemy           - Start automated debugging
echo   debug_interactive_mode     - Enter interactive debug mode
echo   check_corruption           - Analyze corruption patterns
echo   fix_screen2                - Try to fix Screen 2 setup
echo.
echo Screenshots will be saved to:
echo   C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\screenshots\
echo.
pause

cd /d "C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx"

REM Create screenshots directory if it doesn't exist
mkdir screenshots 2>NUL

REM Start OpenMSX with the debug script
echo Starting OpenMSX with debug script...
openmsx -script debug_basicenemy.tcl

echo.
echo Debug session ended. Check screenshots folder for captured images.
pause
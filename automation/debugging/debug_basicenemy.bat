@echo off
REM ==================================================================
REM MSX BasicEnemy ROM Debug Session Launcher
REM File: debug_basicenemy.bat
REM Purpose: Launch OpenMSX with debugging script for BasicEnemy ROM
REM ==================================================================

echo ===============================================
echo MSX BasicEnemy ROM Debug Session
echo ===============================================

REM Create screenshots directory if it doesn't exist
if not exist "C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\screenshots" (
    mkdir "C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\screenshots"
    echo Created screenshots directory
)

REM Check if ROM exists
if not exist "C:\Users\salam\Documents\Programacion\Mideas\server\temp\basicenemy_generated.rom" (
    echo ERROR: ROM file not found!
    echo Path: C:\Users\salam\Documents\Programacion\Mideas\server\temp\basicenemy_generated.rom
    echo Please compile the ROM first.
    pause
    exit /b 1
)

REM Check ROM size
for %%I in ("C:\Users\salam\Documents\Programacion\Mideas\server\temp\basicenemy_generated.rom") do set rom_size=%%~zI
echo ROM Size: %rom_size% bytes

if %rom_size% LSS 100 (
    echo WARNING: ROM is very small ^(%rom_size% bytes^)
    echo This indicates a compilation error.
    echo Continue anyway? ^(Y/N^)
    set /p continue=
    if /i not "%continue%"=="Y" exit /b 1
)

echo Starting OpenMSX with debugging script...
echo.
echo Available debug commands after OpenMSX starts:
echo   start_debug_session    - Initialize debugging
echo   run_debug_tests        - Run automated tests
echo   manual_vdp_setup       - Manual VDP configuration
echo   show_debug_help        - Show all commands
echo.

REM Launch OpenMSX with the debugging script
REM Note: Adjust the path to openmsx.exe according to your installation
openmsx -script "C:\Users\salam\Documents\Programacion\Mideas\automation\debugging\msx_graphics_debug.tcl"

REM If OpenMSX is not in PATH, try common installation paths
if errorlevel 1 (
    echo OpenMSX not found in PATH, trying common locations...

    if exist "C:\Program Files\openMSX\openmsx.exe" (
        "C:\Program Files\openMSX\openmsx.exe" -script "C:\Users\salam\Documents\Programacion\Mideas\automation\debugging\msx_graphics_debug.tcl"
    ) else if exist "C:\Program Files (x86)\openMSX\openmsx.exe" (
        "C:\Program Files (x86)\openMSX\openmsx.exe" -script "C:\Users\salam\Documents\Programacion\Mideas\automation\debugging\msx_graphics_debug.tcl"
    ) else if exist "C:\openMSX\openmsx.exe" (
        "C:\openMSX\openmsx.exe" -script "C:\Users\salam\Documents\Programacion\Mideas\automation\debugging\msx_graphics_debug.tcl"
    ) else (
        echo ERROR: OpenMSX not found!
        echo Please ensure OpenMSX is installed and add it to your PATH,
        echo or modify this script with the correct path to openmsx.exe
        pause
        exit /b 1
    )
)

echo Debug session ended.
pause
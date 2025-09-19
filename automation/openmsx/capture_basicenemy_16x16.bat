@echo off
echo ===============================================
echo BasicEnemy 16x16 Sprites Screenshot Capture
echo ===============================================
echo.

REM Set paths
set "OPENMSX_PATH=C:\Program Files\openMSX"
set "PROJECT_PATH=C:\Users\salam\Documents\Programacion\Mideas"
set "AUTOMATION_PATH=%PROJECT_PATH%\automation\openmsx"
set "ROM_PATH=%PROJECT_PATH%\server\BasicEnemy_16x16.rom"
set "TCL_SCRIPT=%AUTOMATION_PATH%\capture_basicenemy_16x16.tcl"

REM Check if OpenMSX exists
if not exist "%OPENMSX_PATH%\openmsx.exe" (
    echo ERROR: OpenMSX not found at %OPENMSX_PATH%
    echo Please verify OpenMSX installation path
    pause
    exit /b 1
)

REM Check if ROM exists
if not exist "%ROM_PATH%" (
    echo ERROR: ROM file not found at %ROM_PATH%
    echo Please verify the ROM file exists
    pause
    exit /b 1
)

REM Create screenshots directory if it doesn't exist
if not exist "%AUTOMATION_PATH%\screenshots" (
    mkdir "%AUTOMATION_PATH%\screenshots"
    echo Created screenshots directory
)

REM Check if TCL script exists
if not exist "%TCL_SCRIPT%" (
    echo ERROR: TCL script not found at %TCL_SCRIPT%
    pause
    exit /b 1
)

echo Starting OpenMSX automation for BasicEnemy 16x16 sprites...
echo ROM: %ROM_PATH%
echo Script: %TCL_SCRIPT%
echo.
echo This will:
echo 1. Load BasicEnemy_16x16.rom
echo 2. Wait for execution (8 seconds)
echo 3. Check VDP registers for 16x16 sprite mode
echo 4. Inspect sprite attributes
echo 5. Capture screenshot
echo.

REM Execute OpenMSX with TCL script
cd /d "%OPENMSX_PATH%"
echo Launching OpenMSX...
openmsx.exe -script "%TCL_SCRIPT%"

REM Check if screenshot was created
set "SCREENSHOT_DIR=%AUTOMATION_PATH%\screenshots"
echo.
echo Checking for screenshots in: %SCREENSHOT_DIR%
dir /b "%SCREENSHOT_DIR%\BasicEnemy_16x16_sprites_*.png" 2>nul

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: Screenshot captured successfully!
    echo Check the screenshots directory for the new image.
) else (
    echo.
    echo WARNING: No screenshot file found. Check OpenMSX output for errors.
)

echo.
echo Script completed. Press any key to exit...
pause >nul
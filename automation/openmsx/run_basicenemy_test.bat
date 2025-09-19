@echo off
echo Starting BasicEnemy ROM test in OpenMSX...
echo.

REM Check if OpenMSX is installed
if not exist "C:\Program Files\openMSX\openmsx.exe" (
    if not exist "C:\Program Files (x86)\openMSX\openmsx.exe" (
        if not exist "C:\openMSX\openmsx.exe" (
            echo ERROR: OpenMSX not found in common installation directories
            echo Please install OpenMSX or update the path in this script
            pause
            exit /b 1
        ) else (
            set OPENMSX_PATH="C:\openMSX\openmsx.exe"
        )
    ) else (
        set OPENMSX_PATH="C:\Program Files (x86)\openMSX\openmsx.exe"
    )
) else (
    set OPENMSX_PATH="C:\Program Files\openMSX\openmsx.exe"
)

REM Check if ROM file exists
if not exist "C:\Users\salam\Documents\Programacion\Mideas\server\temp\basicenemy_generated.rom" (
    echo ERROR: BasicEnemy ROM file not found
    echo Expected location: C:\Users\salam\Documents\Programacion\Mideas\server\temp\basicenemy_generated.rom
    pause
    exit /b 1
)

echo Using OpenMSX at: %OPENMSX_PATH%
echo ROM file: C:\Users\salam\Documents\Programacion\Mideas\server\temp\basicenemy_generated.rom
echo.

REM Create screenshots directory
if not exist "C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\screenshots" (
    mkdir "C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\screenshots"
)

echo Launching OpenMSX with automation script...
echo The emulator will automatically:
echo   1. Load the BasicEnemy ROM
echo   2. Wait 10 seconds for execution
echo   3. Capture a screenshot
echo   4. Save it to the screenshots folder
echo.

REM Launch OpenMSX with the TCL script
%OPENMSX_PATH% -script "C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\test_basicenemy.tcl"

echo.
echo Test completed! Check the screenshots folder for results.
pause
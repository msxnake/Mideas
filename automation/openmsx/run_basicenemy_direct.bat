@echo off
echo Starting BasicEnemy ROM test in OpenMSX...
echo.

REM Check if OpenMSX is installed
if not exist "C:\Program Files\openMSX\openmsx.exe" (
    echo ERROR: OpenMSX not found at C:\Program Files\openMSX\openmsx.exe
    pause
    exit /b 1
)

REM Check if ROM file exists
if not exist "C:\Users\salam\Documents\Programacion\Mideas\server\temp\BasicEnemy.rom" (
    echo ERROR: BasicEnemy.rom not found
    pause
    exit /b 1
)

echo Using OpenMSX at: "C:\Program Files\openMSX\openmsx.exe"
echo ROM file: "C:\Users\salam\Documents\Programacion\Mideas\server\temp\BasicEnemy.rom"
echo.

echo Launching OpenMSX with BasicEnemy ROM...
"C:\Program Files\openMSX\openmsx.exe" -carta "C:\Users\salam\Documents\Programacion\Mideas\server\temp\BasicEnemy.rom"

echo.
echo OpenMSX closed.
pause
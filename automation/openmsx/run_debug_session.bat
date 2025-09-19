@echo off
echo Starting BasicEnemy ROM debug session in OpenMSX...
echo.

REM Check if OpenMSX is installed
if not exist "C:\Program Files\openMSX\openmsx.exe" (
    if not exist "C:\Program Files (x86)\openMSX\openmsx.exe" (
        if not exist "C:\openMSX\openmsx.exe" (
            echo ERROR: OpenMSX not found in common installation directories
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

echo Using OpenMSX at: %OPENMSX_PATH%
echo.
echo This will launch OpenMSX with the BasicEnemy ROM loaded and debugging enabled.
echo.
echo Available debug commands in the console:
echo   step              - Execute one instruction
echo   debug cont        - Continue execution
echo   info register     - Show CPU registers
echo   inspect_memory    - Show memory areas
echo   show_context      - Show current execution context
echo   set_common_breakpoints - Set breakpoints at RST vectors
echo.
echo Press any key to start debugging session...
pause

REM Launch OpenMSX with debugging script
%OPENMSX_PATH% -script "C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\debug_basicenemy.tcl"
@echo off
REM OpenMSX launcher with symbol file support
REM Usage: run_with_symbols.bat <rom_file> <sym_file>

setlocal

set ROM_FILE=%1
set SYM_FILE=%2

if "%ROM_FILE%"=="" (
    echo Error: ROM file not specified
    echo Usage: run_with_symbols.bat ^<rom_file^> ^<sym_file^>
    exit /b 1
)

if "%SYM_FILE%"=="" (
    echo Error: Symbol file not specified
    echo Usage: run_with_symbols.bat ^<rom_file^> ^<sym_file^>
    exit /b 1
)

if not exist "%ROM_FILE%" (
    echo Error: ROM file not found: %ROM_FILE%
    exit /b 1
)

if not exist "%SYM_FILE%" (
    echo Error: Symbol file not found: %SYM_FILE%
    exit /b 1
)

echo Starting OpenMSX with debugging...
echo ROM: %ROM_FILE%
echo Symbols: %SYM_FILE%
echo.

REM Start OpenMSX with ROM and load symbols via console
"C:\Program Files\openMSX\openmsx.exe" ^
    -carta "%ROM_FILE%" ^
    -command "debug load_symbols \"%SYM_FILE%\"; debug list_symbols"

endlocal

@echo off
echo ============================================
echo OpenMSX ROM Test Automation
echo ============================================

set OPENMSX_EXE="C:\Program Files\openMSX\openmsx.exe"
set ROM_PATH=%1
set SCRIPT_PATH=%~dp0test_rom_execution.tcl

if "%ROM_PATH%"=="" (
    echo Error: Please provide ROM file path as argument
    echo Usage: run_rom_test.bat "path\to\rom\file.rom"
    pause
    exit /b 1
)

if not exist %ROM_PATH% (
    echo Error: ROM file not found: %ROM_PATH%
    pause
    exit /b 1
)

if not exist %OPENMSX_EXE% (
    echo Error: OpenMSX not found at %OPENMSX_EXE%
    echo Please check your OpenMSX installation
    pause
    exit /b 1
)

echo Using OpenMSX: %OPENMSX_EXE%
echo ROM file: %ROM_PATH%
echo Script: %SCRIPT_PATH%
echo.

echo Starting ROM test...
%OPENMSX_EXE% -script %SCRIPT_PATH% %ROM_PATH%

echo.
echo ROM test completed. Check screenshots in automation\openmsx\screenshots\
pause
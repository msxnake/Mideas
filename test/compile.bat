@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   MSX Konami ROM Compiler v1.0
echo ========================================
echo.

REM Check if Java is installed
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed or not in PATH!
    echo Please install Java and try again.
    pause
    exit /b 1
)

REM Check if unitedFiles.asm exists
if not exist unitedFiles.asm (
    echo ERROR: unitedFiles.asm not found!
    echo.
    echo To generate it:
    echo 1. Open MSX IDE
    echo 2. Go to File ^> Export Z80 Code
    echo 3. Select 'ASM (all in one) - Konami ROM'
    echo 4. Click 'Generate unitedFiles.asm'
    echo.
    pause
    exit /b 1
)

REM Check if glass.jar exists
set GLASS_PATH=..\server\glass.jar
if not exist %GLASS_PATH% (
    echo ERROR: glass.jar not found at %GLASS_PATH%
    echo Please ensure glass.jar is in the server directory.
    pause
    exit /b 1
)

REM Show file info
echo Source file: unitedFiles.asm
for %%A in (unitedFiles.asm) do echo Size: %%~zA bytes
echo.

echo Compiling Konami ROM...
echo Command: java -jar %GLASS_PATH% unitedFiles.asm unitedFiles.rom
echo.

REM Clean up previous ROM if exists
if exist unitedFiles.rom del unitedFiles.rom

REM Compile with Glass
java -jar %GLASS_PATH% unitedFiles.asm unitedFiles.rom

REM Check compilation result
if exist unitedFiles.rom (
    echo.
    echo ========================================
    echo   ✅ COMPILATION SUCCESSFUL!
    echo ========================================
    echo.
    echo 🎮 Konami ROM created: unitedFiles.rom

    REM Show ROM file size
    for %%A in (unitedFiles.rom) do (
        echo 📄 Size: %%~zA bytes
        set /a kb=%%~zA/1024
        echo 💾 Size: !kb! KB
    )

    echo.
    echo 🚀 Ready for:
    echo    - MSX emulators (openMSX, BlueMSX, etc.)
    echo    - MSX flash cartridges
    echo    - Real MSX hardware
    echo.

    REM Open folder in explorer
    echo Opening folder...
    explorer .

) else (
    echo.
    echo ========================================
    echo   ❌ COMPILATION FAILED!
    echo ========================================
    echo.
    echo Check the error messages above for details.
    echo Common issues:
    echo - Syntax errors in ASM code
    echo - Missing labels or forward references
    echo - Invalid MSX addresses
)

echo.
echo Press any key to close...
pause >nul
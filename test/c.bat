@echo off
echo ========================================
echo   MSX Glass Compiler - Build Script
echo ========================================
echo.

REM Check if unitedFiles.asm exists
if not exist unitedFiles.asm (
    echo ERROR: unitedFiles.asm not found!
    echo Please generate it first from the IDE.
    pause
    exit /b 1
)

REM Check if glass.jar exists in parent server directory
if not exist glass.jar (
    echo ERROR: glass.jar not found in glass.jar
    echo Please ensure glass.jar is in the server directory.
    pause
    exit /b 1
)

echo Compiling unitedFiles.asm with Glass...
echo Command: java -jar glass.jar unitedFiles.asm unitedFiles.rom
echo.

REM Compile with Glass
java -jar glass.jar unitedFiles.asm unitedFiles.rom

REM Check if compilation was successful
if exist unitedFiles.rom (
    echo.
    echo ========================================
    echo   COMPILATION SUCCESSFUL!
    echo ========================================
    echo ROM file created: unitedFiles.rom
    dir unitedFiles.rom
    echo.
    echo Ready to run on MSX emulator or flash cart!
) else (
    echo.
    echo ========================================
    echo   COMPILATION FAILED!
    echo ========================================
    echo Check the error messages above.
)

echo.
pause
@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   OpenMSX PNG Test - Diferentes métodos
echo ========================================

set "ROM_PATH=%~1"
if "%ROM_PATH%"=="" set "ROM_PATH=..\..\server\first.rom"

set "OPENMSX_PATH=C:\Program Files\openMSX\openmsx.exe"
set "SCREENSHOT_DIR=screenshots"
set "TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=!TIMESTAMP: =0!"

if not exist "%SCREENSHOT_DIR%" mkdir "%SCREENSHOT_DIR%"

echo ROM: %ROM_PATH%
echo Testing multiple PNG capture methods...

REM Método 1: screenshot command
set "TCL1=%TEMP%\test1_%TIMESTAMP%.tcl"
(
echo puts "=== Test 1: screenshot command ==="
echo after 8000 {
echo     puts "Ejecutando screenshot..."
echo     set file1 "%CD:\=/%/%SCREENSHOT_DIR%/test1_screenshot_%TIMESTAMP%.png"
echo     puts "File: $file1"
echo     if {[catch {screenshot $file1} err]} {
echo         puts "ERROR screenshot: $err"
echo     } else {
echo         puts "SUCCESS screenshot"
echo     }
echo     after 1000 { puts "Test 1 complete"; exit }
echo }
) > "%TCL1%"

echo.
echo === Test 1: screenshot command ===
start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL1%"
del "%TCL1%"

REM Método 2: savescreen command
set "TCL2=%TEMP%\test2_%TIMESTAMP%.tcl"
(
echo puts "=== Test 2: savescreen command ==="
echo after 8000 {
echo     puts "Ejecutando savescreen..."
echo     set file2 "%CD:\=/%/%SCREENSHOT_DIR%/test2_savescreen_%TIMESTAMP%.png"
echo     puts "File: $file2"
echo     if {[catch {savescreen $file2} err]} {
echo         puts "ERROR savescreen: $err"
echo     } else {
echo         puts "SUCCESS savescreen"
echo     }
echo     after 1000 { puts "Test 2 complete"; exit }
echo }
) > "%TCL2%"

echo.
echo === Test 2: savescreen command ===
start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL2%"
del "%TCL2%"

REM Método 3: save_screen command
set "TCL3=%TEMP%\test3_%TIMESTAMP%.tcl"
(
echo puts "=== Test 3: save_screen command ==="
echo after 8000 {
echo     puts "Ejecutando save_screen..."
echo     set file3 "%CD:\=/%/%SCREENSHOT_DIR%/test3_savescreen2_%TIMESTAMP%.png"
echo     puts "File: $file3"
echo     if {[catch {save_screen $file3} err]} {
echo         puts "ERROR save_screen: $err"
echo     } else {
echo         puts "SUCCESS save_screen"
echo     }
echo     after 1000 { puts "Test 3 complete"; exit }
echo }
) > "%TCL3%"

echo.
echo === Test 3: save_screen command ===
start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL3%"
del "%TCL3%"

REM Método 4: captura manual con teclas
set "TCL4=%TEMP%\test4_%TIMESTAMP%.tcl"
(
echo puts "=== Test 4: manual capture ==="
echo after 8000 {
echo     puts "Simulando captura manual..."
echo     # Intentar simular PrintScreen o F12
echo     type keyb F12
echo     after 500 {
echo         puts "Manual capture attempted"
echo         after 1000 { puts "Test 4 complete"; exit }
echo     }
echo }
) > "%TCL4%"

echo.
echo === Test 4: manual capture ===
start /wait "" "%OPENMSX_PATH%" -cart "%ROM_PATH%" -script "%TCL4%"
del "%TCL4%"

echo.
echo ========================================
echo   Resultados de las pruebas
echo ========================================

echo Archivos generados en %SCREENSHOT_DIR%:
dir "%SCREENSHOT_DIR%\test*_%TIMESTAMP%.*" 2>nul

echo.
echo Todos los archivos en screenshots:
dir "%SCREENSHOT_DIR%"

pause
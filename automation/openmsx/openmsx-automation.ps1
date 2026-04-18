#Requires -Version 5.1

<#
.SYNOPSIS
    Automatización de OpenMSX para captura de screenshots de ROMs MSX

.DESCRIPTION
    Este script automatiza el proceso de:
    1. Abrir OpenMSX con un ROM específico
    2. Esperar tiempo de carga configurable
    3. Capturar screenshot en PNG
    4. Cerrar OpenMSX automáticamente
    5. Organizar screenshots con nombres descriptivos

.PARAMETER RomPath
    Ruta completa al archivo ROM (.rom)

.PARAMETER WaitSeconds
    Tiempo de espera en segundos antes de capturar (default: 10)

.PARAMETER OutputDir
    Directorio de salida para screenshots (default: ./screenshots)

.PARAMETER OpenMsxPath
    Ruta a OpenMSX ejecutable (auto-detect si no se especifica)

.PARAMETER Machine
    Tipo de máquina MSX a emular (default: 'MSX')

.PARAMETER KeepOpen
    No cerrar OpenMSX después del screenshot

.EXAMPLE
    .\openmsx-automation.ps1 -RomPath "C:\roms\game.rom"

.EXAMPLE
    .\openmsx-automation.ps1 -RomPath ".\server\temp\source_123.rom" -WaitSeconds 15 -OutputDir ".\screenshots\batch"

.EXAMPLE
    .\openmsx-automation.ps1 -RomPath "game.rom" -Machine "MSX2" -KeepOpen
#>

param(
    [Parameter(Mandatory=$true, HelpMessage="Ruta al archivo ROM")]
    [string]$RomPath,

    [Parameter(HelpMessage="Tiempo de espera antes del screenshot (segundos)")]
    [int]$WaitSeconds = 10,

    [Parameter(HelpMessage="Directorio de salida para screenshots")]
    [string]$OutputDir = "screenshots",

    [Parameter(HelpMessage="Ruta a OpenMSX ejecutable")]
    [string]$OpenMsxPath = "",

    [Parameter(HelpMessage="Tipo de máquina MSX (MSX, MSX2, MSX2+, etc.)")]
    [string]$Machine = "MSX",

    [Parameter(HelpMessage="No cerrar OpenMSX después del screenshot")]
    [switch]$KeepOpen
)

# Configuración
$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Funciones auxiliares
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN"  { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Find-OpenMSX {
    Write-Log "Buscando OpenMSX..."

    # Rutas comunes de OpenMSX en Windows
    $commonPaths = @(
        "${env:ProgramFiles}\openMSX\openmsx.exe",
        "${env:ProgramFiles(x86)}\openMSX\openmsx.exe",
        "C:\openMSX\openmsx.exe",
        ".\openmsx\openmsx.exe"
    )

    # Buscar en PATH
    try {
        $pathResult = Get-Command openmsx.exe -ErrorAction SilentlyContinue
        if ($pathResult) {
            return $pathResult.Source
        }
    }
    catch { }

    # Buscar en rutas comunes
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            Write-Log "OpenMSX encontrado en: $path" -Level "SUCCESS"
            return $path
        }
    }

    throw "OpenMSX no encontrado. Instale OpenMSX o especifique la ruta con -OpenMsxPath"
}

function Test-RomFile {
    param([string]$Path)

    Write-Log "Validando archivo ROM: $Path"

    if (-not (Test-Path $Path)) {
        throw "Archivo ROM no encontrado: $Path"
    }

    $fileInfo = Get-Item $Path
    $extension = $fileInfo.Extension.ToLower()

    if ($extension -ne ".rom") {
        Write-Log "Advertencia: El archivo no tiene extensión .rom" -Level "WARN"
    }

    # Verificar tamaño (debe ser múltiplo de 8KB para ROMs MSX)
    $size = $fileInfo.Length
    $kb8 = 8192

    if ($size % $kb8 -ne 0) {
        Write-Log "Advertencia: El ROM no es múltiplo de 8KB (actual: $size bytes)" -Level "WARN"
    }
    else {
        $sizeKB = $size / $kb8
        Write-Log "ROM válido: $size bytes (${sizeKB}×8KB)" -Level "SUCCESS"
    }

    return $fileInfo.FullName
}

function New-ScreenshotDir {
    param([string]$Dir)

    if (-not (Test-Path $Dir)) {
        Write-Log "Creando directorio: $Dir"
        New-Item -Path $Dir -ItemType Directory -Force | Out-Null
    }

    return (Resolve-Path $Dir).Path
}

function New-TclScript {
    param(
        [string]$RomName,
        [int]$WaitTime,
        [string]$ScreenshotDir,
        [bool]$AutoExit
    )

    $tempDir = [System.IO.Path]::GetTempPath()
    $scriptPath = Join-Path $tempDir "openmsx_automation_$(Get-Date -Format 'yyyyMMddHHmmss').tcl"

    $exitCommand = if ($AutoExit) { "exit" } else { "" }

    $tclContent = @"
# OpenMSX Automation Script
# Generado automáticamente - $(Get-Date)

proc log_message {msg} {
    puts "AUTOMATION: `$msg"
}

proc wait_and_screenshot {} {
    global rom_name screenshot_dir auto_exit

    log_message "Esperando ${WaitTime} segundos para que cargue el ROM..."
    after [expr ${WaitTime} * 1000] {
        log_message "Capturando screenshot..."

        # Crear directorio si no existe
        file mkdir `$screenshot_dir

        # Generar nombre único para el screenshot
        set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]
        set screenshot_file [file join `$screenshot_dir "`${rom_name}_`${timestamp}.png"]

        # Capturar screenshot
        catch {screenshot `$screenshot_file} result

        if {[file exists `$screenshot_file]} {
            log_message "Screenshot guardado: `$screenshot_file"
        } else {
            log_message "ERROR: No se pudo guardar el screenshot"
        }

        if {`$auto_exit} {
            log_message "Cerrando OpenMSX..."
            after 2000 exit
        } else {
            log_message "Screenshot completado. OpenMSX permanece abierto."
        }
    }
}

# Variables globales
set rom_name "$RomName"
set screenshot_dir "$($ScreenshotDir -replace '\\', '/')"
set auto_exit [expr {$AutoExit ? "true" : "false"}]

log_message "Iniciando automatización para ROM: `$rom_name"
log_message "Directorio de screenshots: `$screenshot_dir"
log_message "Auto-exit: `$auto_exit"

# Iniciar proceso de screenshot
wait_and_screenshot
"@

    Set-Content -Path $scriptPath -Value $tclContent -Encoding UTF8
    Write-Log "Script TCL creado: $scriptPath"
    return $scriptPath
}

function Start-OpenMsxAutomation {
    param(
        [string]$OpenMsxExe,
        [string]$Rom,
        [string]$TclScript,
        [string]$MachineType
    )

    Write-Log "Iniciando OpenMSX..."
    Write-Log "Ejecutable: $OpenMsxExe"
    Write-Log "ROM: $Rom"
    Write-Log "Script: $TclScript"
    Write-Log "Máquina: $MachineType"

    # Construir argumentos para OpenMSX
    $arguments = @(
        "-machine", $MachineType,
        "-cart", $Rom,
        "-script", $TclScript
    )

    try {
        # Iniciar OpenMSX
        $process = Start-Process -FilePath $OpenMsxExe -ArgumentList $arguments -PassThru -NoNewWindow
        Write-Log "OpenMSX iniciado (PID: $($process.Id))" -Level "SUCCESS"

        # Si no es KeepOpen, esperar a que termine
        if (-not $KeepOpen) {
            Write-Log "Esperando que OpenMSX termine..."
            $process.WaitForExit()
            Write-Log "OpenMSX terminado con código: $($process.ExitCode)" -Level "SUCCESS"
        }

        return $process
    }
    catch {
        throw "Error al iniciar OpenMSX: $($_.Exception.Message)"
    }
}

# Script principal
try {
    Write-Log "=== OpenMSX Automation v1.0 ===" -Level "SUCCESS"
    Write-Log "Iniciando automatización..."

    # Validar y resolver rutas
    $romFullPath = Test-RomFile -Path $RomPath
    $romName = [System.IO.Path]::GetFileNameWithoutExtension($romFullPath)
    $screenshotFullDir = New-ScreenshotDir -Dir $OutputDir

    # Encontrar OpenMSX
    if ([string]::IsNullOrWhiteSpace($OpenMsxPath)) {
        $OpenMsxPath = Find-OpenMSX
    }
    elseif (-not (Test-Path $OpenMsxPath)) {
        throw "OpenMSX no encontrado en: $OpenMsxPath"
    }

    # Crear script TCL
    $tclScript = New-TclScript -RomName $romName -WaitTime $WaitSeconds -ScreenshotDir $screenshotFullDir -AutoExit (-not $KeepOpen)

    Write-Log "Configuración:"
    Write-Log "  ROM: $romName"
    Write-Log "  Espera: $WaitSeconds segundos"
    Write-Log "  Salida: $screenshotFullDir"
    Write-Log "  Máquina: $Machine"
    Write-Log "  Auto-cerrar: $(-not $KeepOpen)"

    # Ejecutar automatización
    $process = Start-OpenMsxAutomation -OpenMsxExe $OpenMsxPath -Rom $romFullPath -TclScript $tclScript -MachineType $Machine

    Write-Log "=== Automatización completada ===" -Level "SUCCESS"
    Write-Log "Revise el directorio de screenshots: $screenshotFullDir"

}
catch {
    Write-Log "ERROR: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}
finally {
    # Limpiar archivos temporales
    if ($tclScript -and (Test-Path $tclScript)) {
        try {
            Remove-Item $tclScript -Force
            Write-Log "Script temporal limpiado"
        }
        catch {
            Write-Log "No se pudo limpiar script temporal: $tclScript" -Level "WARN"
        }
    }
}

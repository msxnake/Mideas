#Requires -Version 5.1

<#
.SYNOPSIS
    Procesamiento en lote de screenshots para múltiples ROMs

.DESCRIPTION
    Este script procesa múltiples archivos ROM en un directorio y genera
    screenshots automáticamente para cada uno usando OpenMSX.

.PARAMETER InputDir
    Directorio que contiene los archivos ROM

.PARAMETER OutputDir
    Directorio base para organizar screenshots

.PARAMETER WaitSeconds
    Tiempo de espera por ROM (default: 10)

.PARAMETER Parallel
    Procesar múltiples ROMs en paralelo

.PARAMETER MaxConcurrent
    Máximo número de procesos concurrentes (default: 2)

.PARAMETER Filter
    Filtro de archivos (default: "*.rom")

.EXAMPLE
    .\batch-screenshots.ps1 -InputDir ".\server\temp" -OutputDir ".\screenshots\batch"

.EXAMPLE
    .\batch-screenshots.ps1 -InputDir "C:\roms" -Parallel -MaxConcurrent 3
#>

param(
    [Parameter(Mandatory=$true, HelpMessage="Directorio con archivos ROM")]
    [string]$InputDir,

    [Parameter(HelpMessage="Directorio de salida para screenshots")]
    [string]$OutputDir = "screenshots\batch",

    [Parameter(HelpMessage="Tiempo de espera por ROM (segundos)")]
    [int]$WaitSeconds = 10,

    [Parameter(HelpMessage="Procesar en paralelo")]
    [switch]$Parallel,

    [Parameter(HelpMessage="Máximo procesos concurrentes")]
    [int]$MaxConcurrent = 2,

    [Parameter(HelpMessage="Filtro de archivos")]
    [string]$Filter = "*.rom"
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "Continue"

# Funciones auxiliares
function Write-BatchLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN"  { "Yellow" }
        "SUCCESS" { "Green" }
        "PROGRESS" { "Cyan" }
        default { "White" }
    }
    Write-Host "[$timestamp] [BATCH] [$Level] $Message" -ForegroundColor $color
}

function Test-Prerequisites {
    Write-BatchLog "Verificando requisitos..."

    # Verificar directorio de entrada
    if (-not (Test-Path $InputDir)) {
        throw "Directorio de entrada no encontrado: $InputDir"
    }

    # Verificar script de automatización
    $scriptDir = Split-Path -Parent $MyInvocation.ScriptName
    $automationScript = Join-Path $scriptDir "openmsx-automation.ps1"

    if (-not (Test-Path $automationScript)) {
        throw "Script de automatización no encontrado: $automationScript"
    }

    return $automationScript
}

function Get-RomFiles {
    param([string]$Dir, [string]$Pattern)

    Write-BatchLog "Buscando archivos ROM en: $Dir"
    Write-BatchLog "Patrón: $Pattern"

    $romFiles = Get-ChildItem -Path $Dir -Filter $Pattern -File
    Write-BatchLog "Encontrados $($romFiles.Count) archivos ROM" -Level "SUCCESS"

    return $romFiles
}

function New-BatchOutputDir {
    param([string]$BaseDir)

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $batchDir = Join-Path $BaseDir "batch_$timestamp"

    if (-not (Test-Path $batchDir)) {
        New-Item -Path $batchDir -ItemType Directory -Force | Out-Null
        Write-BatchLog "Directorio de lote creado: $batchDir"
    }

    return $batchDir
}

function Invoke-SingleRomScreenshot {
    param(
        [string]$RomPath,
        [string]$OutputDir,
        [int]$WaitTime,
        [string]$AutomationScript,
        [int]$Index,
        [int]$Total
    )

    $romName = [System.IO.Path]::GetFileNameWithoutExtension($RomPath)
    Write-BatchLog "[$Index/$Total] Procesando: $romName" -Level "PROGRESS"

    try {
        # Crear subdirectorio para este ROM
        $romOutputDir = Join-Path $OutputDir $romName
        if (-not (Test-Path $romOutputDir)) {
            New-Item -Path $romOutputDir -ItemType Directory -Force | Out-Null
        }

        # Ejecutar automatización
        $arguments = @(
            "-File", $AutomationScript,
            "-RomPath", $RomPath,
            "-WaitSeconds", $WaitTime,
            "-OutputDir", $romOutputDir
        )

        $process = Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -PassThru -NoNewWindow -Wait

        if ($process.ExitCode -eq 0) {
            Write-BatchLog "[$Index/$Total] ✅ $romName completado" -Level "SUCCESS"
            return @{ Success = $true; RomName = $romName; OutputDir = $romOutputDir }
        }
        else {
            Write-BatchLog "[$Index/$Total] ❌ $romName falló (código: $($process.ExitCode))" -Level "ERROR"
            return @{ Success = $false; RomName = $romName; Error = "Exit code: $($process.ExitCode)" }
        }
    }
    catch {
        Write-BatchLog "[$Index/$Total] ❌ $romName error: $($_.Exception.Message)" -Level "ERROR"
        return @{ Success = $false; RomName = $romName; Error = $_.Exception.Message }
    }
}

function Invoke-ParallelProcessing {
    param(
        [array]$RomFiles,
        [string]$OutputDir,
        [int]$WaitTime,
        [string]$AutomationScript,
        [int]$MaxThreads
    )

    Write-BatchLog "Iniciando procesamiento paralelo (máx $MaxThreads hilos)"

    $jobs = @()
    $completed = 0
    $total = $RomFiles.Count

    for ($i = 0; $i -lt $total; $i++) {
        $rom = $RomFiles[$i]

        # Esperar si hay demasiados trabajos activos
        while (($jobs | Where-Object { $_.State -eq "Running" }).Count -ge $MaxThreads) {
            Start-Sleep -Milliseconds 500

            # Verificar trabajos completados
            $finishedJobs = $jobs | Where-Object { $_.State -ne "Running" }
            foreach ($job in $finishedJobs) {
                $result = Receive-Job -Job $job
                Remove-Job -Job $job
                $completed++

                if ($result.Success) {
                    Write-BatchLog "✅ Paralelo completado: $($result.RomName)" -Level "SUCCESS"
                }
                else {
                    Write-BatchLog "❌ Paralelo falló: $($result.RomName) - $($result.Error)" -Level "ERROR"
                }
            }

            $jobs = $jobs | Where-Object { $_.State -eq "Running" }
        }

        # Iniciar nuevo trabajo
        $scriptBlock = {
            param($RomPath, $OutputDir, $WaitTime, $AutomationScript, $Index, $Total)

            $romName = [System.IO.Path]::GetFileNameWithoutExtension($RomPath)
            $romOutputDir = Join-Path $OutputDir $romName

            if (-not (Test-Path $romOutputDir)) {
                New-Item -Path $romOutputDir -ItemType Directory -Force | Out-Null
            }

            $arguments = @(
                "-File", $AutomationScript,
                "-RomPath", $RomPath,
                "-WaitSeconds", $WaitTime,
                "-OutputDir", $romOutputDir
            )

            try {
                $process = Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -PassThru -NoNewWindow -Wait
                return @{ Success = ($process.ExitCode -eq 0); RomName = $romName; OutputDir = $romOutputDir }
            }
            catch {
                return @{ Success = $false; RomName = $romName; Error = $_.Exception.Message }
            }
        }

        $job = Start-Job -ScriptBlock $scriptBlock -ArgumentList $rom.FullName, $OutputDir, $WaitTime, $AutomationScript, ($i + 1), $total
        $jobs += $job

        Write-BatchLog "Iniciado trabajo paralelo: $($rom.Name) (Job ID: $($job.Id))"
    }

    # Esperar a que terminen todos los trabajos
    while ($jobs.Count -gt 0) {
        Start-Sleep -Milliseconds 500

        $finishedJobs = $jobs | Where-Object { $_.State -ne "Running" }
        foreach ($job in $finishedJobs) {
            $result = Receive-Job -Job $job
            Remove-Job -Job $job
            $completed++

            if ($result.Success) {
                Write-BatchLog "✅ Paralelo completado: $($result.RomName) [$completed/$total]" -Level "SUCCESS"
            }
            else {
                Write-BatchLog "❌ Paralelo falló: $($result.RomName) - $($result.Error) [$completed/$total]" -Level "ERROR"
            }
        }

        $jobs = $jobs | Where-Object { $_.State -eq "Running" }
    }

    Write-BatchLog "Procesamiento paralelo completado: $completed/$total" -Level "SUCCESS"
}

function Invoke-SequentialProcessing {
    param(
        [array]$RomFiles,
        [string]$OutputDir,
        [int]$WaitTime,
        [string]$AutomationScript
    )

    Write-BatchLog "Iniciando procesamiento secuencial"

    $results = @()
    $total = $RomFiles.Count

    for ($i = 0; $i -lt $total; $i++) {
        $rom = $RomFiles[$i]
        $result = Invoke-SingleRomScreenshot -RomPath $rom.FullName -OutputDir $OutputDir -WaitTime $WaitTime -AutomationScript $AutomationScript -Index ($i + 1) -Total $total
        $results += $result
    }

    return $results
}

# Script principal
try {
    Write-BatchLog "=== OpenMSX Batch Screenshot Automation ===" -Level "SUCCESS"

    # Verificar prerequisitos
    $automationScript = Test-Prerequisites

    # Obtener archivos ROM
    $romFiles = Get-RomFiles -Dir $InputDir -Pattern $Filter

    if ($romFiles.Count -eq 0) {
        throw "No se encontraron archivos ROM en: $InputDir"
    }

    # Crear directorio de salida
    $batchOutputDir = New-BatchOutputDir -BaseDir $OutputDir

    Write-BatchLog "Configuración del lote:"
    Write-BatchLog "  Archivos ROM: $($romFiles.Count)"
    Write-BatchLog "  Tiempo de espera: $WaitSeconds segundos"
    Write-BatchLog "  Salida: $batchOutputDir"
    Write-BatchLog "  Paralelo: $Parallel"
    if ($Parallel) {
        Write-BatchLog "  Max concurrentes: $MaxConcurrent"
    }

    $startTime = Get-Date

    # Procesar archivos
    if ($Parallel) {
        Invoke-ParallelProcessing -RomFiles $romFiles -OutputDir $batchOutputDir -WaitTime $WaitSeconds -AutomationScript $automationScript -MaxThreads $MaxConcurrent
    }
    else {
        $results = Invoke-SequentialProcessing -RomFiles $romFiles -OutputDir $batchOutputDir -WaitTime $WaitSeconds -AutomationScript $automationScript
        $successful = ($results | Where-Object { $_.Success }).Count
        Write-BatchLog "Completados exitosamente: $successful/$($romFiles.Count)" -Level "SUCCESS"
    }

    $endTime = Get-Date
    $duration = $endTime - $startTime

    Write-BatchLog "=== Procesamiento en lote completado ===" -Level "SUCCESS"
    Write-BatchLog "Tiempo total: $($duration.ToString('hh\:mm\:ss'))"
    Write-BatchLog "Screenshots guardados en: $batchOutputDir"

    # Abrir directorio de resultados
    Start-Process -FilePath "explorer.exe" -ArgumentList $batchOutputDir

}
catch {
    Write-BatchLog "ERROR: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}
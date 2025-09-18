#Requires -Version 5.1

<#
.SYNOPSIS
    Script de prueba para verificar la instalación y funcionamiento de OpenMSX automation

.DESCRIPTION
    Este script verifica que todos los componentes estén instalados correctamente
    y realiza pruebas básicas del sistema de automatización.
#>

param(
    [Parameter(HelpMessage="ROM de prueba opcional")]
    [string]$TestRom = "",

    [Parameter(HelpMessage="Solo verificar instalación, no ejecutar pruebas")]
    [switch]$CheckOnly
)

$ErrorActionPreference = "Continue"

function Write-TestLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN"  { "Yellow" }
        "SUCCESS" { "Green" }
        "TEST" { "Cyan" }
        default { "White" }
    }
    Write-Host "[$timestamp] [TEST] [$Level] $Message" -ForegroundColor $color
}

function Test-PowerShellVersion {
    Write-TestLog "Verificando versión de PowerShell..." -Level "TEST"

    $version = $PSVersionTable.PSVersion
    Write-TestLog "PowerShell $($version.Major).$($version.Minor)"

    if ($version.Major -ge 5) {
        Write-TestLog "✅ PowerShell versión OK" -Level "SUCCESS"
        return $true
    } else {
        Write-TestLog "❌ Se requiere PowerShell 5.1 o superior" -Level "ERROR"
        return $false
    }
}

function Test-OpenMSXInstallation {
    Write-TestLog "Verificando instalación de OpenMSX..." -Level "TEST"

    # Buscar en PATH
    try {
        $pathResult = Get-Command openmsx.exe -ErrorAction SilentlyContinue
        if ($pathResult) {
            Write-TestLog "✅ OpenMSX encontrado en PATH: $($pathResult.Source)" -Level "SUCCESS"
            return $pathResult.Source
        }
    }
    catch { }

    # Buscar en ubicaciones comunes
    $commonPaths = @(
        "${env:ProgramFiles}\openMSX\openmsx.exe",
        "${env:ProgramFiles(x86)}\openMSX\openmsx.exe",
        "C:\openMSX\openmsx.exe"
    )

    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            Write-TestLog "✅ OpenMSX encontrado: $path" -Level "SUCCESS"
            return $path
        }
    }

    Write-TestLog "❌ OpenMSX no encontrado" -Level "ERROR"
    Write-TestLog "   Instale OpenMSX desde: https://openmsx.org/" -Level "WARN"
    return $null
}

function Test-AutomationScripts {
    Write-TestLog "Verificando scripts de automatización..." -Level "TEST"

    $scriptDir = Split-Path -Parent $MyInvocation.ScriptName
    $requiredFiles = @(
        "openmsx-automation.ps1",
        "screenshot_automation.tcl",
        "openmsx-screenshot.bat",
        "config.json"
    )

    $allPresent = $true
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $scriptDir $file
        if (Test-Path $filePath) {
            Write-TestLog "✅ $file" -Level "SUCCESS"
        } else {
            Write-TestLog "❌ $file no encontrado" -Level "ERROR"
            $allPresent = $false
        }
    }

    return $allPresent
}

function Test-DirectoryStructure {
    Write-TestLog "Verificando estructura de directorios..." -Level "TEST"

    $baseDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.ScriptName)
    $requiredDirs = @(
        "screenshots",
        "server\temp"
    )

    foreach ($dir in $requiredDirs) {
        $dirPath = Join-Path $baseDir $dir
        if (Test-Path $dirPath) {
            Write-TestLog "✅ $dir existe" -Level "SUCCESS"
        } else {
            Write-TestLog "⚠️  $dir no existe, será creado automáticamente" -Level "WARN"
        }
    }
}

function Test-SampleRom {
    Write-TestLog "Buscando ROMs de ejemplo..." -Level "TEST"

    $baseDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.ScriptName)
    $tempDir = Join-Path $baseDir "server\temp"

    if (Test-Path $tempDir) {
        $romFiles = Get-ChildItem -Path $tempDir -Filter "*.rom" | Select-Object -First 3

        if ($romFiles.Count -gt 0) {
            Write-TestLog "✅ Encontrados $($romFiles.Count) ROM(s) de ejemplo:" -Level "SUCCESS"
            foreach ($rom in $romFiles) {
                $sizeKB = [math]::Round($rom.Length / 1024, 1)
                Write-TestLog "   - $($rom.Name) (${sizeKB} KB)"
            }
            return $romFiles[0].FullName
        }
    }

    Write-TestLog "⚠️  No se encontraron ROMs de ejemplo" -Level "WARN"
    Write-TestLog "   Compile algún código ASM primero para crear ROMs de prueba"
    return $null
}

function Invoke-BasicTest {
    param([string]$OpenMsxPath, [string]$TestRomPath)

    Write-TestLog "Ejecutando prueba básica de automatización..." -Level "TEST"

    if (-not $TestRomPath) {
        Write-TestLog "⚠️  Sin ROM de prueba, omitiendo prueba de ejecución" -Level "WARN"
        return $true
    }

    $scriptDir = Split-Path -Parent $MyInvocation.ScriptName
    $automationScript = Join-Path $scriptDir "openmsx-automation.ps1"
    $testOutputDir = Join-Path $scriptDir "test-screenshots"

    Write-TestLog "Ejecutando: $automationScript"
    Write-TestLog "ROM: $TestRomPath"
    Write-TestLog "Tiempo de espera: 5 segundos (prueba rápida)"

    try {
        $arguments = @(
            "-File", $automationScript,
            "-RomPath", $TestRomPath,
            "-WaitSeconds", "5",
            "-OutputDir", $testOutputDir,
            "-Machine", "MSX"
        )

        $process = Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -PassThru -NoNewWindow -Wait

        if ($process.ExitCode -eq 0) {
            Write-TestLog "✅ Prueba básica exitosa" -Level "SUCCESS"

            # Verificar si se creó screenshot
            if (Test-Path $testOutputDir) {
                $screenshots = Get-ChildItem -Path $testOutputDir -Filter "*.png"
                if ($screenshots.Count -gt 0) {
                    Write-TestLog "✅ Screenshot generado: $($screenshots[0].Name)" -Level "SUCCESS"
                    return $true
                }
            }

            Write-TestLog "⚠️  Screenshot no encontrado en directorio de salida" -Level "WARN"
            return $true
        } else {
            Write-TestLog "❌ Prueba básica falló (código: $($process.ExitCode))" -Level "ERROR"
            return $false
        }
    }
    catch {
        Write-TestLog "❌ Error en prueba básica: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Show-TestSummary {
    param([hashtable]$Results)

    Write-TestLog ""
    Write-TestLog "=== RESUMEN DE PRUEBAS ===" -Level "TEST"

    $totalTests = $Results.Count
    $passedTests = ($Results.Values | Where-Object { $_ -eq $true }).Count
    $failedTests = $totalTests - $passedTests

    foreach ($test in $Results.GetEnumerator()) {
        $status = if ($test.Value) { "✅ PASS" } else { "❌ FAIL" }
        Write-TestLog "$status - $($test.Key)"
    }

    Write-TestLog ""
    if ($failedTests -eq 0) {
        Write-TestLog "🎉 TODAS LAS PRUEBAS PASARON ($passedTests/$totalTests)" -Level "SUCCESS"
        Write-TestLog "El sistema de automatización está listo para usar"
    } else {
        Write-TestLog "⚠️  $failedTests/$totalTests pruebas fallaron" -Level "WARN"
        Write-TestLog "Revise los errores anteriores antes de usar el sistema"
    }
}

# Script principal
try {
    Write-TestLog "=== OpenMSX Automation - Verificación del Sistema ===" -Level "SUCCESS"
    Write-TestLog "Iniciando verificaciones..."

    $results = @{}

    # Verificaciones básicas
    $results["PowerShell Version"] = Test-PowerShellVersion
    $openmsxPath = Test-OpenMSXInstallation
    $results["OpenMSX Installation"] = ($openmsxPath -ne $null)
    $results["Automation Scripts"] = Test-AutomationScripts

    Test-DirectoryStructure

    # Buscar ROM de prueba
    if ([string]::IsNullOrWhiteSpace($TestRom)) {
        $TestRom = Test-SampleRom
    }

    # Ejecutar prueba básica si no es solo verificación
    if (-not $CheckOnly -and $openmsxPath -and $results["Automation Scripts"]) {
        $results["Basic Test"] = Invoke-BasicTest -OpenMsxPath $openmsxPath -TestRomPath $TestRom
    }

    # Mostrar resumen
    Show-TestSummary -Results $results

    Write-TestLog ""
    Write-TestLog "=== INFORMACIÓN ADICIONAL ===" -Level "TEST"
    Write-TestLog "Documentación: README.md"
    Write-TestLog "Configuración: config.json"
    Write-TestLog "Ejemplos de uso:"
    Write-TestLog "  .\openmsx-screenshot.bat mi_juego.rom"
    Write-TestLog "  .\openmsx-automation.ps1 -RomPath juego.rom -WaitSeconds 10"
    Write-TestLog "  .\batch-screenshots.ps1 -InputDir ..\server\temp"
}
catch {
    Write-TestLog "ERROR CRÍTICO: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}
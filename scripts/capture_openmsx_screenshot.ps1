param(
  [Parameter(Mandatory = $true)]
  [string]$Rom,

  [string]$ProjectRoot = (Get-Location).Path,
  [string]$Output,
  [int]$WaitMs = 6000,
  [string]$Machine = "C-BIOS_MSX2",
  [string]$OpenMsx,
  [switch]$DryRun,
  [switch]$AllowRunningInstance
)

$ErrorActionPreference = "Stop"

function Resolve-ExistingPath([string]$PathValue) {
  $candidate = if ([System.IO.Path]::IsPathRooted($PathValue)) {
    [System.IO.Path]::GetFullPath($PathValue)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $PathValue))
  }
  if (Test-Path -LiteralPath $candidate) {
    return $candidate
  }
  throw "Path not found: $PathValue"
}

function Resolve-OpenMsx([string]$Explicit) {
  if ($Explicit) {
    if (Test-Path -LiteralPath $Explicit) { return [System.IO.Path]::GetFullPath($Explicit) }
    throw "OpenMSX not found: $Explicit"
  }
  if ($env:OPENMSX_PATH -and (Test-Path -LiteralPath $env:OPENMSX_PATH)) {
    return [System.IO.Path]::GetFullPath($env:OPENMSX_PATH)
  }
  $candidates = @(
    "C:\Program Files\openMSX\openmsx.exe",
    "C:\Program Files (x86)\openMSX\openmsx.exe"
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  $cmd = Get-Command openmsx -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  throw "OpenMSX executable not found. Use -OpenMsx or OPENMSX_PATH."
}

$projectRootFull = [System.IO.Path]::GetFullPath($ProjectRoot)
$romPath = Resolve-ExistingPath $Rom
$openMsxPath = Resolve-OpenMsx $OpenMsx

if (-not $Output) {
  $shotDir = Join-Path $projectRootFull "server/temp/msx2-screen5-minimal/screenshots"
  $Output = Join-Path $shotDir (([System.IO.Path]::GetFileNameWithoutExtension($romPath)) + ".png")
}
$outputPath = if ([System.IO.Path]::IsPathRooted($Output)) {
  [System.IO.Path]::GetFullPath($Output)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $projectRootFull $Output))
}
$outputDir = Split-Path -Parent $outputPath
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$tclPath = Join-Path $env:TEMP ("mideas_capture_" + [System.Guid]::NewGuid().ToString("N") + ".tcl")
$tclOutput = $outputPath.Replace("\", "/")
$waitSeconds = [Math]::Max(0.1, $WaitMs / 1000.0).ToString([System.Globalization.CultureInfo]::InvariantCulture)
$tcl = @"
puts "Mideas OpenMSX capture started"
after time $waitSeconds {
  puts "Capturing screenshot: $tclOutput"
  if {[catch {screenshot "$tclOutput"} err]} {
    puts "SHOTERR $err"
  } else {
    puts "SHOTOK $tclOutput"
  }
  after time 1.0 {exit}
}
"@
Set-Content -LiteralPath $tclPath -Value $tcl -Encoding ASCII

if (-not $AllowRunningInstance) {
  Get-Process openmsx -ErrorAction SilentlyContinue | Stop-Process -Force
}

$args = @("-machine", $Machine, "-cart", $romPath, "-script", $tclPath)
Write-Output ("OpenMSX: " + $openMsxPath)
Write-Output ("ROM: " + $romPath)
Write-Output ("Screenshot: " + $outputPath)
Write-Output ("Command: " + $openMsxPath + " " + ($args -join " "))

if ($DryRun) {
  Write-Output ("TCL: " + $tclPath)
  exit 0
}

$proc = Start-Process -FilePath $openMsxPath -ArgumentList $args -WorkingDirectory $projectRootFull -Wait -PassThru -WindowStyle Hidden
if ($proc.ExitCode -ne 0) {
  throw "OpenMSX exited with code $($proc.ExitCode)"
}
if (-not (Test-Path -LiteralPath $outputPath)) {
  throw "Screenshot was not created: $outputPath"
}
Write-Output ("Screenshot saved: " + $outputPath)

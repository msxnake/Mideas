#Requires -Version 5.1

<#
.SYNOPSIS
  Captures OpenMSX output and composes Preview vs OpenMSX side-by-side image.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$RomPath,

  [Parameter(Mandatory = $true)]
  [string]$PreviewPath,

  [string]$OpenMsxPath = "C:\Program Files\openMSX\openmsx.exe",

  [int]$WaitMs = 7000,

  [string]$OutputDir = "",

  [string]$Machine = "",

  [switch]$AllowRunningInstance
)

$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath {
  param([string]$PathValue)
  return (Resolve-Path -LiteralPath $PathValue -ErrorAction Stop).Path
}

function To-TclPath {
  param([string]$PathValue)
  return $PathValue.Replace("\", "/")
}

function Get-CandidateScreenshotDirs {
  param([string]$OutputAbsPath)
  $dirs = @(
    $OutputAbsPath,
    (Join-Path $env:USERPROFILE "Documents\openMSX\screenshots"),
    (Join-Path $env:USERPROFILE "openMSX\share\screenshots"),
    (Join-Path $env:APPDATA "openMSX\screenshots")
  )
  return $dirs | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
}

function New-TclCaptureScript {
  param(
    [string]$TclPath,
    [string]$RomAbsPath,
    [string]$OutputShotPath,
    [int]$CaptureWaitMs
  )

  $romTcl = To-TclPath $RomAbsPath
  $outTcl = To-TclPath $OutputShotPath

  $lines = @(
    "set __rom `"$romTcl`"",
    "set __out `"$outTcl`"",
    "set __wait_ms $CaptureWaitMs",
    'puts "CAPTURE: loading $__rom"',
    'if {[catch {carta $__rom} err]} {',
    '    puts "CAPTURE ERROR: failed to load ROM: $err"',
    '    exit 2',
    '}',
    'puts "CAPTURE: waiting $__wait_ms ms"',
    'after $__wait_ms',
    'if {[catch {screenshot $__out} err1]} {',
    '    puts "CAPTURE WARN: screenshot $__out failed: $err1"',
    '    if {[catch {screenshot} err2]} {',
    '        puts "CAPTURE ERROR: fallback screenshot failed: $err2"',
    '        exit 3',
    '    }',
    '    puts "CAPTURE WARN: fallback screenshot() used"',
    '} else {',
    '    puts "CAPTURE: screenshot saved to $__out"',
    '}',
    'after 500',
    'exit'
  )
  Set-Content -LiteralPath $TclPath -Value $lines -Encoding ASCII
}

function Find-NewestScreenshotAfter {
  param(
    [datetime]$SinceUtc,
    [string[]]$Dirs
  )

  $best = $null
  foreach ($dir in $Dirs) {
    if (-not (Test-Path -LiteralPath $dir)) {
      continue
    }
    $candidate = Get-ChildItem -LiteralPath $dir -Filter *.png -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -notlike "compare_*" } |
      Where-Object { $_.LastWriteTimeUtc -gt $SinceUtc } |
      Sort-Object LastWriteTimeUtc -Descending |
      Select-Object -First 1
    if ($candidate -and ((-not $best) -or ($candidate.LastWriteTimeUtc -gt $best.LastWriteTimeUtc))) {
      $best = $candidate
    }
  }
  return $best
}

function Find-NewestScreenshotAny {
  param([string[]]$Dirs)

  $best = $null
  foreach ($dir in $Dirs) {
    if (-not (Test-Path -LiteralPath $dir)) {
      continue
    }
    $candidate = Get-ChildItem -LiteralPath $dir -Filter *.png -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -notlike "compare_*" } |
      Sort-Object LastWriteTimeUtc -Descending |
      Select-Object -First 1
    if ($candidate -and ((-not $best) -or ($candidate.LastWriteTimeUtc -gt $best.LastWriteTimeUtc))) {
      $best = $candidate
    }
  }
  return $best
}

function New-ComparisonImage {
  param(
    [string]$PreviewImagePath,
    [string]$OpenMsxImagePath,
    [string]$OutputImagePath
  )

  Add-Type -AssemblyName System.Drawing

  $preview = $null
  $openmsx = $null
  $bitmap = $null
  $graphics = $null
  $font = $null
  $textBrush = $null

  try {
    $preview = [System.Drawing.Image]::FromFile($PreviewImagePath)
    $openmsx = [System.Drawing.Image]::FromFile($OpenMsxImagePath)

    $padding = 16
    $labelHeight = 26
    $maxHeight = [Math]::Max($preview.Height, $openmsx.Height)
    $canvasWidth = $preview.Width + $openmsx.Width + ($padding * 3)
    $canvasHeight = $maxHeight + ($padding * 2) + $labelHeight

    $bitmap = New-Object System.Drawing.Bitmap($canvasWidth, $canvasHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::FromArgb(25, 29, 36))

    $font = New-Object System.Drawing.Font("Consolas", 12, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 230, 230))

    $graphics.DrawString("Preview", $font, $textBrush, $padding, 4)
    $graphics.DrawString("OpenMSX", $font, $textBrush, $preview.Width + ($padding * 2), 4)
    $graphics.DrawImage($preview, $padding, $labelHeight + $padding)
    $graphics.DrawImage($openmsx, $preview.Width + ($padding * 2), $labelHeight + $padding)

    $bitmap.Save($OutputImagePath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    if ($textBrush) { $textBrush.Dispose() }
    if ($font) { $font.Dispose() }
    if ($graphics) { $graphics.Dispose() }
    if ($bitmap) { $bitmap.Dispose() }
    if ($preview) { $preview.Dispose() }
    if ($openmsx) { $openmsx.Dispose() }
  }
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $PSScriptRoot "screenshots\compare"
}

$rom = Resolve-AbsolutePath $RomPath
$preview = Resolve-AbsolutePath $PreviewPath

if (-not (Test-Path -LiteralPath $OpenMsxPath)) {
  throw "OpenMSX not found at: $OpenMsxPath"
}

if (-not $AllowRunningInstance) {
  Get-Process openmsx -ErrorAction SilentlyContinue | Stop-Process -Force
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
$outputAbs = Resolve-AbsolutePath $OutputDir

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$openmsxShot = Join-Path $outputAbs ("openmsx_" + $stamp + ".png")
$comparisonShot = Join-Path $outputAbs ("compare_" + $stamp + ".png")
$tclScript = Join-Path $env:TEMP ("openmsx_compare_" + $stamp + ".tcl")
$captureStartUtc = (Get-Date).ToUniversalTime()
$candidateDirs = Get-CandidateScreenshotDirs -OutputAbsPath $outputAbs

foreach ($dir in $candidateDirs) {
  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
}

try {
  New-TclCaptureScript -TclPath $tclScript -RomAbsPath $rom -OutputShotPath $openmsxShot -CaptureWaitMs $WaitMs

  $args = @()
  if (-not [string]::IsNullOrWhiteSpace($Machine)) {
    $args += @("-machine", $Machine)
  }
  $args += @("-script", $tclScript)

  $openMsxOutput = (& $OpenMsxPath @args 2>&1 | Out-String).Trim()
  $exitCode = $LASTEXITCODE

  $fallbackMode = "none"

  $timeoutMs = [Math]::Max($WaitMs + 15000, 25000)
  $deadline = (Get-Date).AddMilliseconds($timeoutMs)
  while ((Get-Date) -lt $deadline -and -not (Test-Path -LiteralPath $openmsxShot)) {
    $fresh = Find-NewestScreenshotAfter -SinceUtc $captureStartUtc -Dirs $candidateDirs
    if ($fresh) {
      Copy-Item -LiteralPath $fresh.FullName -Destination $openmsxShot -Force
      $fallbackMode = "newest-after-start"
      break
    }
    Start-Sleep -Milliseconds 250
  }

  if (-not $AllowRunningInstance) {
    Get-Process openmsx -ErrorAction SilentlyContinue | Stop-Process -Force
  }

  if (-not (Test-Path -LiteralPath $openmsxShot)) {
    $any = Find-NewestScreenshotAny -Dirs $candidateDirs
    if ($any) {
      Copy-Item -LiteralPath $any.FullName -Destination $openmsxShot -Force
      $fallbackMode = "latest-existing"
    }
  }

  if (-not (Test-Path -LiteralPath $openmsxShot)) {
    $dirsText = ($candidateDirs -join "; ")
    if ($openMsxOutput) {
      throw "OpenMSX screenshot was not produced. checked dirs: $dirsText. openMSX output: $openMsxOutput"
    }
    throw "OpenMSX screenshot was not produced. checked dirs: $dirsText"
  }

  New-ComparisonImage -PreviewImagePath $preview -OpenMsxImagePath $openmsxShot -OutputImagePath $comparisonShot

  [pscustomobject]@{
    success = $true
    rom = $rom
    preview = $preview
    openmsxExitCode = $exitCode
    openmsxScreenshot = $openmsxShot
    comparisonImage = $comparisonShot
    screenshotSource = $fallbackMode
    openmsxOutput = $openMsxOutput
  } | ConvertTo-Json -Depth 3
}
finally {
  if (Test-Path -LiteralPath $tclScript) {
    Remove-Item -LiteralPath $tclScript -Force -ErrorAction SilentlyContinue
  }
}

param(
    [string]$DownloadsDir = (Join-Path $env:USERPROFILE "Downloads"),
    [int]$OpenMsxTimeout = 45,
    [switch]$NoKeepGoing
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$MatrixScript = Join-Path $ProjectRoot "scripts\run_mideas_regression_matrix.py"
$KeepGoingArgs = @()
if (-not $NoKeepGoing) {
    $KeepGoingArgs += "--keep-going"
}

python $MatrixScript `
    --json (Join-Path $DownloadsDir "joc_tales_9.json") `
    --json (Join-Path $DownloadsDir "joc64.json") `
    --json (Join-Path $DownloadsDir "joc51.json") `
    --json (Join-Path $DownloadsDir "patoantic249.json") `
    --modes megarom `
    --target-formats konami `
    --post-asm-opt `
    --post-asm-rules dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime,unused-component-runtime,state-machine-dispatch-handlers `
    --post-asm-passes 7 `
    --openmsx-timeout $OpenMsxTimeout `
    @KeepGoingArgs

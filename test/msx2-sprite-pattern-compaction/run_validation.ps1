param(
    [string]$OpenMsx = 'C:\Program Files\openMSX\openmsx.exe',
    [string]$Project = ''
)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Push-Location $repo
try {
    $arguments = @('scripts/check_msx2_sprite_pattern_compaction.mjs')
    if ($Project) { $arguments += @('--project', $Project) }
    $buildOutput = & node @arguments
    if ($LASTEXITCODE -ne 0) { throw 'Pattern compaction build/check failed' }
    $buildOutput | Write-Output
    $manifestLine = $buildOutput | Where-Object { $_ -like 'MANIFEST=*' } | Select-Object -Last 1
    if (-not $manifestLine) { throw 'Build did not produce a probe manifest' }
    $manifest = Get-Content -LiteralPath $manifestLine.Substring(9) -Raw | ConvertFrom-Json
    foreach ($case in $manifest) {
        $started = [DateTime]::UtcNow
        $process = Start-Process -FilePath $OpenMsx -ArgumentList '-machine','Philips_NMS_8250',
            '-cart',$case.rom,'-romtype',$case.mapper,'-script',$case.tcl -WindowStyle Hidden -PassThru `
            -RedirectStandardError ($case.log + '.stderr')
        $null = $process.Handle
        if (-not $process.WaitForExit(20000)) {
            Stop-Process -Id $process.Id -Force
            throw "Owned OpenMSX probe timed out: $($case.name)"
        }
        $process.Refresh()
        if ($process.ExitCode -ne 0) { throw "OpenMSX failed: $($case.name)" }
        if ((Get-Item -LiteralPath $case.log).LastWriteTimeUtc -lt $started) { throw 'Stale probe log' }
        $result = Get-Content -LiteralPath $case.log -Raw
        if ($result -notmatch 'VERDICT: PASS' -or $result -match '(?m)^FAIL|TIMEOUT') {
            throw "Probe failed: $($case.name)`n$result"
        }
        Write-Output "$($case.name): PASS ($($case.cases) cases)"
    }
    Write-Output 'PASS: 76 emulated cases, normal and Konami ROMs, original and compact patterns.'
} finally { Pop-Location }

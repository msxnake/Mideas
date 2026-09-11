param([string]$OpenMsx = 'C:\Program Files\openMSX\openmsx.exe')
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Push-Location $repo
try {
    function Run-Node([string[]]$Arguments) {
        & node @Arguments
        if ($LASTEXITCODE -ne 0) { throw "Node failed: $Arguments" }
    }
    function Run-Probe([string]$Rom, [string]$Tcl, [string]$Log, [string]$Mapper, [bool]$ExpectFailure = $false) {
        $errLog = "$Log.stderr"
        $started = [DateTime]::UtcNow
        $p = Start-Process -FilePath $OpenMsx -ArgumentList '-machine','Philips_NMS_8250','-cart',$Rom,'-romtype',$Mapper,'-script',$Tcl -WindowStyle Hidden -PassThru -RedirectStandardError $errLog
        if (-not $p.WaitForExit(60000)) {
            Stop-Process -Id $p.Id -Force
            throw "Owned OpenMSX process timed out: $Tcl"
        }
        if ($p.ExitCode -ne 0) { throw "OpenMSX exited with code $($p.ExitCode): $Tcl" }
        if ((Get-Item -LiteralPath $Log).LastWriteTimeUtc -lt $started) { throw "Stale probe log: $Log" }
        $result = [IO.File]::ReadAllText((Join-Path $repo $Log))
        $verdict = if ($ExpectFailure) { 'VERDICT: FAIL' } else { 'VERDICT: PASS' }
        if (-not $result.Contains($verdict) -or -not $result.Contains('RUN-COMPLETE') -or $result.Contains('ERROR')) { throw "Probe failed: $Log`n$result" }
        if ($ExpectFailure -and ($result -notmatch 'vramFails=1 tickerr=0' -or $result -notmatch 'injected=1')) { throw 'Negative probe failed for an unexpected reason' }
        Write-Output "$Log : $verdict"
    }
    Run-Node @('scripts/check_msx2_enemy_color_cache.mjs')
    Run-Node @('test/msx2-screen5-enemy-cache/build_game.mjs')
    Run-Node @('test/msx2-screen5-enemy-cache/build_directed.mjs')
    foreach ($variant in @('pre','post')) {
        Run-Node @('test/msx2-screen5-enemy-cache/build_probe.mjs',$variant)
        Run-Probe "work/enemy-cache-game-v6/$variant.rom" "test/msx2-screen5-enemy-cache/probe_${variant}_v6.tcl" "test/msx2-screen5-enemy-cache/probe_${variant}_v6.txt" 'Konami'
        Run-Probe "work/enemy-cache-directed/$variant.rom" "work/enemy-cache-directed/$variant.tcl" "work/enemy-cache-directed/$variant.txt" 'Normal'
    }
    $priorNegative = $env:CACHE_NEGATIVE
    try {
        $env:CACHE_NEGATIVE = '1'
        Run-Node @('test/msx2-screen5-enemy-cache/build_probe.mjs','post')
    } finally {
        if ($null -eq $priorNegative) { Remove-Item Env:CACHE_NEGATIVE } else { $env:CACHE_NEGATIVE = $priorNegative }
    }
    Run-Probe 'work/enemy-cache-game-v6/post.rom' 'test/msx2-screen5-enemy-cache/probe_post_invalid_v6.tcl' 'test/msx2-screen5-enemy-cache/probe_post_invalid_v6.txt' 'Konami' $true
    Write-Output 'PASS: all B validation gates (negative control intentionally FAIL)'
} finally { Pop-Location }

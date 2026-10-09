param([string]$OpenMsx = 'C:\Program Files\openMSX\openmsx.exe')
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Push-Location $repo
try {
    $output = & node scripts/check_msx2_enemy_body_collision.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Body collision probe build failed' }
    $output | Write-Output
    $manifestLine = $output | Where-Object { $_ -like 'MANIFEST=*' } | Select-Object -Last 1
    if (-not $manifestLine) { throw 'Missing body collision manifest' }
    $manifest = Get-Content -LiteralPath $manifestLine.Substring(9) -Raw | ConvertFrom-Json
    foreach ($case in $manifest) {
        $started = [DateTime]::UtcNow
        $process = Start-Process -FilePath $OpenMsx -ArgumentList '-machine','Philips_NMS_8250',
            '-cart',$case.rom,'-romtype',$case.mapper,'-script',$case.tcl -WindowStyle Hidden -PassThru `
            -RedirectStandardError ($case.log + '.stderr')
        # Retain the process handle so Windows PowerShell can read ExitCode
        # after a fast emulator exit rather than returning a null value.
        $null = $process.Handle
        if (-not $process.WaitForExit(20000)) { $process.Kill(); throw 'Owned body probe timed out' }
        $process.Refresh()
        if ($process.ExitCode -ne 0) { throw 'OpenMSX body probe failed' }
        if ((Get-Item -LiteralPath $case.log).LastWriteTimeUtc -lt $started) { throw 'Stale body probe log' }
        $result = Get-Content -LiteralPath $case.log -Raw
        if ($result -notmatch 'VERDICT: PASS' -or $result -match '(?m)^FAIL|TIMEOUT') { throw $result }
        Write-Output "PASS: $($case.cases) full-body collision cases in OpenMSX."
    }
} finally { Pop-Location }

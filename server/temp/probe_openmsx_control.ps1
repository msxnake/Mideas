$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'C:\Program Files\openMSX\openmsx.exe'
$psi.Arguments = '-control stdio'
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true
$p = New-Object System.Diagnostics.Process
$p.StartInfo = $psi
$p.Start() | Out-Null
Start-Sleep -Seconds 2
$out = ''
while(-not $p.StandardOutput.EndOfStream){ $out += $p.StandardOutput.ReadLine() + "`n" }
$err = ''
while(-not $p.StandardError.EndOfStream){ $err += $p.StandardError.ReadLine() + "`n" }
$out | Set-Content 'C:\Users\salam\Documents\Programacion\Mideas\server\temp\probe_openmsx_control.out.txt'
$err | Set-Content 'C:\Users\salam\Documents\Programacion\Mideas\server\temp\probe_openmsx_control.err.txt'
$p.Kill()

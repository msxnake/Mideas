#!/usr/bin/env bash
# Same contract as test/run_openmsx_probe.sh but WITHOUT the global
# taskkill: per [Codex-008] we must only ever stop the openMSX instance we
# started ourselves, never a session the user may be running.
set -u
ROM=$1
TCL=$2
WALL=${3:-120}

powershell -NoProfile -Command "\$p = Start-Process -FilePath 'C:\Program Files\openMSX\openmsx.exe' -ArgumentList '-machine','Philips_NMS_8250','-cart','$ROM','-romtype','KonamiSCC','-script','$TCL' -WindowStyle Hidden -PassThru; \$p | Wait-Process -Timeout $WALL -ErrorAction SilentlyContinue; if (-not \$p.HasExited) { Stop-Process -Id \$p.Id -Force; Write-Output 'exit=KILLED-TIMEOUT' } else { Write-Output \"exit=\$(\$p.ExitCode)\" }"

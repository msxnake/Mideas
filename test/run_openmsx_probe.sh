#!/usr/bin/env bash
# Run an openMSX probe with a guaranteed hard stop.
#
#   usage: run_openmsx_probe.sh <rom> <tcl> [wall-seconds, default 60]
#
# Why this exists: when a Tcl probe dies early, openMSX keeps its window open
# forever and someone has to close it by hand. Git Bash `timeout` cannot be
# trusted to kill a native Windows GUI process either. So this runner:
#   1. kills any stale openmsx.exe FIRST (note the // switches: Git Bash turns
#      /IM into a path);
#   2. starts the emulator through PowerShell Start-Process -PassThru;
#   3. waits at most <wall-seconds> and then Stop-Process -Force, which is a
#      real TerminateProcess -- the window closes, no orphans.
# The Tcl probes still exit by themselves on success; the kill is only the
# safety net.
set -u
ROM=$1
TCL=$2
WALL=${3:-60}

taskkill //IM openmsx.exe //F >/dev/null 2>&1 || true

powershell -NoProfile -Command "\$p = Start-Process -FilePath 'C:\Program Files\openMSX\openmsx.exe' -ArgumentList '-machine','Philips_NMS_8250','-cart','$ROM','-romtype','KonamiSCC','-script','$TCL' -PassThru; \$p | Wait-Process -Timeout $WALL -ErrorAction SilentlyContinue; if (-not \$p.HasExited) { Stop-Process -Id \$p.Id -Force; Write-Output 'exit=KILLED-TIMEOUT' } else { Write-Output \"exit=\$(\$p.ExitCode)\" }"

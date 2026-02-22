---
description: Cerrar OpenMSX local
---
Este flujo de trabajo permite cerrar de forma segura la instancia de OpenMSX que se inició previamente y de la que guardamos su ID de proceso (PID).

### Pasos

1. Ejecuta el script de PowerShell para leer el archivo `openmsx.pid` y detener el proceso. Si no encuentra el archivo o el proceso ya no existe, intentará cerrar cualquier proceso llamado "openmsx".

   *Script de PowerShell:*
   ```powershell
   $pidFile = "$pwd\.agent\openmsx.pid"
   
   if (Test-Path $pidFile) {
       $pidStr = Get-Content $pidFile
       $pid = [int]$pidStr
       
       $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
       if ($process) {
           Write-Host "Cerrando OpenMSX con PID $pid..."
           Stop-Process -Id $pid -Force
           Remove-Item $pidFile -Force
           Write-Host "OpenMSX cerrado correctamente."
       } else {
           Write-Host "El proceso con PID $pid no existe. Limpiando archivo PID..."
           Remove-Item $pidFile -Force
           
           # Fallback: intentar cerrar por nombre
           Get-Process -Name "openmsx" -ErrorAction SilentlyContinue | Stop-Process -Force
       }
   } else {
       Write-Host "No se encontró archivo PID. Intentando cerrar openmsx por nombre..."
       Get-Process -Name "openmsx" -ErrorAction SilentlyContinue | Stop-Process -Force
   }
   ```

// turbo
2. Ejecuta el comando construido en la terminal usando tu herramienta `run_command`.

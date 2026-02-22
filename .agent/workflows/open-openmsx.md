---
description: Abrir OpenMSX en local
---
Este flujo de trabajo (workflow) permite abrir rápidamente el emulador OpenMSX en el entorno local del usuario. Guarda el PID del proceso para que después pueda cerrarse de manera segura.

### Pasos

1. Determina si el usuario ha solicitado abrir una ROM específica (por ejemplo, recién compilada en `server/temp` o en la carpeta `ROMs`). Si no especificó ninguna, se abrirá el emulador sin cartucho.
2. Construye el script de PowerShell para ejecutar OpenMSX y guardar su ID de proceso (PID) en un archivo local (`.agent/openmsx.pid`). La ruta habitual en Windows es `C:\Program Files\openMSX\openmsx.exe`.

   *Script de PowerShell:*
   ```powershell
   $msxPath = "C:\Program Files\openMSX\openmsx.exe"
   $pidFile = "$pwd\.agent\openmsx.pid"
   
   # Argumentos. Añadir "-cart RUTA_ROM" si aplica
   $args = @() 
   
   $process = Start-Process -FilePath $msxPath -ArgumentList $args -PassThru
   
   if ($process) {
       $process.Id | Out-File -FilePath $pidFile -Encoding ASCII
       Write-Host "OpenMSX iniciado con PID $($process.Id). Guardado en $pidFile"
   } else {
       Write-Host "Error al iniciar OpenMSX."
   }
   ```

// turbo
3. Ejecuta el comando construido en la terminal usando tu herramienta `run_command`.

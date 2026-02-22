---
description: Abrir screenshots de OpenMSX
---
Este flujo de trabajo permite abrir rápidamente la carpeta donde se guardan las capturas de pantalla de OpenMSX, o abrir directamente la captura más reciente.

### Pasos

1. Ejecuta el siguiente script de PowerShell. Este script busca en la carpeta de capturas de OpenMSX (`automation\openmsx\screenshots`). Si encuentra imágenes, abrirá la captura más reciente directamente con el visor de imágenes predeterminado de Windows. Si la carpeta está vacía o no existe, simplemente abrirá la carpeta (o la creará y la abrirá).

   *Script de PowerShell:*
   ```powershell
   $ssDir = "$pwd\automation\openmsx\screenshots"
   
   if (!(Test-Path $ssDir)) {
       Write-Host "La carpeta de capturas no existe. Creándola..."
       New-Item -ItemType Directory -Force -Path $ssDir | Out-Null
       Invoke-Item $ssDir
       exit
   }
   
   $latestScreenshot = Get-ChildItem -Path $ssDir -Filter "*.png" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
   
   if ($latestScreenshot) {
       Write-Host "Abriendo la captura más reciente: $($latestScreenshot.Name)"
       Invoke-Item $latestScreenshot.FullName
   } else {
       Write-Host "No hay capturas en la carpeta. Abriendo el directorio..."
       Invoke-Item $ssDir
   }
   ```

// turbo
2. Ejecuta el script de PowerShell en la terminal usando la herramienta `run_command` (marcándolo como seguro para auto-ejecutar por la etiqueta turbo).

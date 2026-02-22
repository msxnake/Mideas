---
description: Screenshot OpenMSX 6 segundos
---
Este flujo de trabajo abre OpenMSX y, pasados 6 segundos desde su apertura, toma una captura de la pantalla principal (screenshot). Luego, automáticamente cierra el emulador.

### Pasos

1. Determina si el usuario desea abrir una ROM específica. Si es así, obtén su ruta (ej. `ROMs/juego.rom` o `server/temp/rom_generada.rom`).

2. Construye y adapta el siguiente script de PowerShell. Este script genera un archivo TCL al vuelo para decirle a OpenMSX que tome una foto a los 6000ms (6 segundos) y luego se cierre.

   *Script de PowerShell:*
   ```powershell
   $tclPath = "$env:TEMP\openmsx_ss_6s.tcl"
   $outDir = "$pwd\automation\openmsx\screenshots"
   if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
   $fileName = "screenshot_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"
   # Convertimos la ruta a un formato seguro para TCL usando barras normales
   $outFile = "$outDir/$fileName" -replace "\\", "/"
   
   # Comando TCL que define una función para ejecutar comandos secuencialmente
   $tclContent = "proc do_shot {} {`n  catch {screenshot `"$outFile`"}`n  after 500 exit`n}`nafter 6000 do_shot"
   [System.IO.File]::WriteAllText($tclPath, $tclContent)
   
   Write-Host "Iniciando OpenMSX. Esperando 6s para screenshot..."
   
   # Lista de argumentos para Start-Process
   $argsList = @("-script", $tclPath)
   
   # SI HAY ROM, descomenta y modifica esta línea con la ruta correcta:
   # $argsList = @("-cart", "RUTA_A_LA_ROM", "-script", $tclPath)
   
   Start-Process -FilePath "C:\Program Files\openMSX\openmsx.exe" -ArgumentList $argsList -Wait
   Write-Host "✅ Hecho. Screenshot guardado en $outFile"
   ```

// turbo
3. Ejecuta el script de PowerShell en la terminal usando la herramienta `run_command` (marcándolo como seguro para auto-ejecutar por la etiqueta turbo).
4. (Opcional) Usa la herramienta pertinente para visualizar la imagen generada o confirmar al usuario dónde se ha guardado.

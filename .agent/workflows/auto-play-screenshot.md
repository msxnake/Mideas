---
description: Abrir ROM interactiva y analizar juego
---
Este flujo de trabajo abre una ROM específica de MSX, espera a que cargue la pantalla de inicio, pulsa Espacio (o cualquier otra tecla que necesites) para iniciar la partida, espera unos segundos, toma una captura de pantalla del "gameplay" y se cierra.
Finalmente, muestra la captura para que yo (Antigravity) pueda verla y analizarla por ti.

### Pasos

1. Verifica con el usuario qué ROM quiere ejecutar y cuánto tiempo debe esperar en cada fase. Por defecto asume que el usuario te proporciona el nombre, por ejemplo: `ROMs/minijuego.rom`.

2. Construye y ejecuta el script de PowerShell. Adapta los tiempos (`after X`) y la pulsación (ej. para Espacio es ` ` o Enter es `\r`) según cómo funcione el menú del juego.

   *Script de PowerShell:*
   ```powershell
   # EJEMPLO: Reemplazar RUTA_AL_ROM con la variable o ruta deseada.
   $romPath = "RUTA_AL_ROM" 
   
   $tclPath = "$env:TEMP\openmsx_start_and_shot.tcl"
   $outDir = "$pwd\automation\openmsx\screenshots"
   if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
   $fileName = "auto_gameplay_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"
   $outFile = "$outDir/$fileName" -replace "\\", "/"
   
   # 1. after 5000: Espera 5 segundos a que cargue la portada
   # 2. type " ": Pulsa espacio para iniciar el juego
   # 3. after 3000: Espera 3 segundos a que empiece la partida
   # 4. catch {screenshot ...}: Captura la pantalla
   # 5. exit: Cierra el emulador
   $tclContent = @"
   proc auto_play {} {
       # Escribimos un Espacio para salir del menu de inicio (cambiar a \r si es Enter)
       type " "
       
       # Esperamos 3 segundos en el juego y tomamos screenshot
       after 3000 {
           catch {screenshot {$outFile}}
           after 500 exit
       }
   }
   
   # Esperamos 5 segundos antes de pulsar el boton de inicio
   after 5000 auto_play
   "@
   
   [System.IO.File]::WriteAllText($tclPath, $tclContent)
   
   Write-Host "Iniciando OpenMSX con $romPath..."
   $msxPath = "C:\Program Files\openMSX\openmsx.exe"
   Start-Process -FilePath $msxPath -ArgumentList "-cart", "`"$romPath`"", "-script", "`"$tclPath`"" -Wait
   Write-Host "✅ Screenshot de gameplay guardado en $outFile"
   
   # Guardar la ruta en un archivo para que el agente lo lea
   "`"$outFile`"" | Out-File -FilePath "$pwd\.agent\last_gameplay_ss.txt" -Encoding ASCII
   ```

// turbo
3. Ejecuta el script de PowerShell sustituyendo `"RUTA_AL_ROM"` por el archivo `.rom` que indique el usuario.

4. Una vez finalizado, utiliza la herramienta `view_file` para abrir el archivo `.agent\last_gameplay_ss.txt` y obtener la ruta exacta de la imagen generada.

5. Usa la misma herramienta `view_file` apuntando a la imagen generada para analizarla visualmente y proveer al usuario una descripción o análisis exhaustivo del frame congelado del juego.

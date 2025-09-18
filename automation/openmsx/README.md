# OpenMSX Screenshot Automation

Sistema de automatización para OpenMSX que permite generar screenshots automáticamente de ROMs MSX con configuración flexible y procesamiento en lote.

## 🎯 Características

- ✅ **Automatización completa**: Abrir OpenMSX → Cargar ROM → Esperar → Screenshot → Cerrar
- ✅ **Tiempo configurable**: Ajustar tiempo de espera para diferentes tipos de ROM
- ✅ **Procesamiento en lote**: Múltiples ROMs automáticamente
- ✅ **Integración con servidor**: API REST para automatización desde aplicaciones web
- ✅ **Detección automática**: Encuentra OpenMSX en ubicaciones comunes de Windows
- ✅ **Organización**: Screenshots organizados con nombres descriptivos
- ✅ **Manejo de errores**: Validación robusta y mensajes claros de error

## 📁 Estructura de Archivos

```
automation/openmsx/
├── openmsx-automation.ps1      # Script principal de PowerShell
├── openmsx-screenshot.bat      # Interface simplificada (batch)
├── batch-screenshots.ps1       # Procesamiento en lote
├── screenshot_automation.tcl   # Script TCL para OpenMSX
├── server-integration.js       # Integración con Node.js/Express
├── server-example.js          # Ejemplo de servidor integrado
├── config.json               # Configuración predeterminada
└── README.md                 # Esta documentación
```

## 🚀 Instalación y Requisitos

### Requisitos del Sistema

1. **Windows 10/11** (PowerShell 5.1+)
2. **OpenMSX** instalado ([descargar aquí](https://openmsx.org/))
3. **Node.js** (opcional, para integración con servidor)

### Instalación de OpenMSX

1. Descargar OpenMSX desde [openmsx.org](https://openmsx.org/)
2. Instalar en ubicación estándar:
   - `C:\\Program Files\\openMSX\\`
   - O agregar al PATH del sistema

### Verificación

```powershell
# Verificar OpenMSX
openmsx.exe --version

# Verificar PowerShell
$PSVersionTable.PSVersion
```

## 📖 Guía de Uso

### 1. Uso Básico (Batch Script)

La forma más simple de usar el sistema:

```batch
# Screenshot de un ROM específico
.\openmsx-screenshot.bat "mi_juego.rom"

# Con tiempo personalizado
.\openmsx-screenshot.bat "mi_juego.rom" 15

# Con directorio de salida personalizado
.\openmsx-screenshot.bat "mi_juego.rom" 10 "screenshots\\mis_juegos"
```

### 2. PowerShell Avanzado

Para control completo sobre la automatización:

```powershell
# Ejemplo básico
.\openmsx-automation.ps1 -RomPath "juego.rom"

# Configuración completa
.\openmsx-automation.ps1 `
  -RomPath "C:\roms\metal_gear.rom" `
  -WaitSeconds 15 `
  -OutputDir "screenshots\metal_gear" `
  -Machine "MSX2" `
  -KeepOpen

# Usando ROM del servidor de compilación
.\openmsx-automation.ps1 `
  -RomPath "..\..\server\temp\source_1234567890.rom" `
  -WaitSeconds 12 `
  -OutputDir "screenshots\compiled"
```

### 3. Procesamiento en Lote

Para procesar múltiples ROMs automáticamente:

```powershell
# Procesamiento secuencial
.\batch-screenshots.ps1 -InputDir "..\..\server\temp" -OutputDir "screenshots\batch"

# Procesamiento paralelo (más rápido)
.\batch-screenshots.ps1 `
  -InputDir "C:\mis_roms" `
  -OutputDir "screenshots\coleccion" `
  -Parallel `
  -MaxConcurrent 3 `
  -WaitSeconds 8
```

## 🌐 Integración con Servidor Web

### Configuración del Servidor

```javascript
const OpenMSXAutomation = require('./automation/openmsx/server-integration');

// En tu server.js existente
const openmsxAutomation = new OpenMSXAutomation(app);
openmsxAutomation.setupRoutes(app);
```

### Endpoints API

#### 1. Screenshot Individual

```http
POST /screenshot
Content-Type: application/json

{
  "romPath": "./server/temp/source_1234567890.rom",
  "waitSeconds": 10,
  "machine": "MSX2",
  "outputDir": "screenshots/web"
}
```

#### 2. Screenshots en Lote

```http
POST /screenshot-batch
Content-Type: application/json

{
  "waitSeconds": 12,
  "machine": "MSX",
  "parallel": true,
  "maxConcurrent": 2
}
```

#### 3. Listar ROMs Disponibles

```http
GET /roms-available
```

#### 4. Listar Screenshots

```http
GET /screenshots?subDir=batch
```

#### 5. Descargar Screenshot

```http
GET /screenshot-download/mi_juego_20240918_143022.png
```

### Ejemplo de Integración Completa

```javascript
// Compilar código Y generar screenshot automáticamente
app.post('/compile-with-screenshot', async (req, res) => {
  const { code, generateScreenshot, screenshotOptions } = req.body;

  // 1. Compilar código ASM → ROM
  const romResult = await compileCode(code);

  // 2. Generar screenshot si se solicita
  if (generateScreenshot && romResult.success) {
    try {
      const screenshotResult = await openmsxAutomation.generateScreenshot(
        romResult.romPath,
        screenshotOptions
      );

      return res.json({
        ...romResult,
        screenshot: screenshotResult
      });
    } catch (error) {
      return res.json({
        ...romResult,
        screenshotError: error.message
      });
    }
  }

  res.json(romResult);
});
```

## ⚙️ Configuración Avanzada

### Archivo config.json

```json
{
  "openmsx": {
    "executable_paths": [
      "C:\\Program Files\\openMSX\\openmsx.exe",
      "C:\\Program Files (x86)\\openMSX\\openmsx.exe"
    ],
    "default_machine": "MSX",
    "supported_machines": ["MSX", "MSX2", "MSX2+", "MSXturboR"]
  },
  "automation": {
    "default_wait_time": 10,
    "screenshot_dir": "screenshots",
    "auto_exit": true
  }
}
```

### Máquinas MSX Soportadas

- `MSX` - MSX original (1983)
- `MSX2` - MSX2 (1985)
- `MSX2+` - MSX2+ (1988)
- `MSXturboR` - MSX turbo R (1990)
- `Philips_NMS_8250` - Modelo específico Philips
- `Sony_HB-F700P` - Modelo específico Sony
- `Panasonic_FS-A1ST` - Modelo específico Panasonic

## 🔧 Resolución de Problemas

### OpenMSX No Encontrado

```
ERROR: OpenMSX no encontrado. Instale OpenMSX o especifique la ruta con -OpenMsxPath
```

**Solución:**
1. Instalar OpenMSX desde [openmsx.org](https://openmsx.org/)
2. O especificar ruta manualmente:
   ```powershell
   .\openmsx-automation.ps1 -RomPath "juego.rom" -OpenMsxPath "C:\mi_openmsx\openmsx.exe"
   ```

### PowerShell Execution Policy

```
cannot be loaded because running scripts is disabled on this system
```

**Solución:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ROM No Válido

```
WARNING: El ROM no es múltiplo de 8KB (actual: 1234 bytes)
```

**Nota:** Los ROMs MSX deben ser múltiplos de 8KB. El sistema funcionará pero el ROM puede no cargar correctamente en OpenMSX.

### Timeout de Screenshot

Si el screenshot se toma antes de que cargue el juego:

```powershell
# Aumentar tiempo de espera
.\openmsx-automation.ps1 -RomPath "juego_lento.rom" -WaitSeconds 20
```

## 📊 Ejemplos de Uso Real

### Caso 1: Desarrollo de Juego MSX

```powershell
# Durante desarrollo, compilar y ver resultado
cd "C:\mi_proyecto_msx"

# Compilar código → generar ROM → screenshot automático
.\automation\openmsx\openmsx-automation.ps1 `
  -RomPath "output\mi_juego.rom" `
  -WaitSeconds 8 `
  -OutputDir "screenshots\desarrollo" `
  -Machine "MSX2"
```

### Caso 2: Catalogar Colección de ROMs

```powershell
# Generar screenshots de toda una colección
.\automation\openmsx\batch-screenshots.ps1 `
  -InputDir "D:\MSX_Collection\Games" `
  -OutputDir "D:\MSX_Screenshots" `
  -Parallel `
  -MaxConcurrent 4 `
  -WaitSeconds 15
```

### Caso 3: Integración en Flujo de CI/CD

```javascript
// En pipeline de testing automático
const screenshots = await openmsxAutomation.generateBatchScreenshots(
  ['build/game_v1.rom', 'build/game_v2.rom'],
  {
    waitSeconds: 10,
    outputDir: 'test-screenshots/',
    parallel: true
  }
);

console.log(`Generated ${screenshots.successful} screenshots`);
```

## 📝 Logs y Depuración

### Activar Logs Detallados

```powershell
# PowerShell con información detallada
$VerbosePreference = "Continue"
.\openmsx-automation.ps1 -RomPath "juego.rom" -Verbose
```

### Revisar Logs de OpenMSX

Los logs de automatización incluyen:
- Timestamps de cada operación
- Información de la máquina emulada
- Detalles del screenshot generado
- Errores específicos con contexto

### Archivos Temporales

Los scripts TCL temporales se guardan en:
- Windows: `%TEMP%\openmsx_automation_*.tcl`

Para depuración, comentar la línea de limpieza en el script.

## 🤝 Contribución

Este sistema está diseñado para ser extensible. Areas de mejora:

1. **Más formatos de salida**: JPG, GIF animado para demos
2. **OCR automático**: Reconocimiento de texto en pantalla
3. **Comparación automática**: Detectar diferencias entre versiones
4. **Screenshots múltiples**: Capturar varios momentos del juego
5. **Integración con MSX BASIC**: Screenshots de programas BASIC

## 📄 Licencia

Este código es parte del proyecto MSX IDE y sigue la misma licencia del proyecto principal.

---

**¡Disfruta automatizando tus screenshots de MSX!** 🎮📸
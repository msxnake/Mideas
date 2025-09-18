# 🚀 Instalación Rápida - OpenMSX Automation

Guía de instalación paso a paso para configurar el sistema de automatización de OpenMSX.

## ⚡ Instalación Express (5 minutos)

### 1. Verificar Requisitos

```powershell
# Verificar PowerShell (debe ser 5.1+)
$PSVersionTable.PSVersion

# Verificar si OpenMSX está instalado
Get-Command openmsx.exe -ErrorAction SilentlyContinue
```

### 2. Instalar OpenMSX (si no está instalado)

1. **Descargar OpenMSX**: Ir a [openmsx.org](https://openmsx.org/) → Downloads
2. **Instalar**: Ejecutar el instalador con configuración por defecto
3. **Verificar**: Abrir terminal y escribir `openmsx.exe --version`

### 3. Configurar PowerShell (si es necesario)

```powershell
# Permitir ejecución de scripts (solo una vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Probar el Sistema

```batch
# Ir al directorio de automatización
cd automation\openmsx

# Ejecutar verificación del sistema
.\test-automation.ps1 -CheckOnly

# Ejecutar demo rápido
.\quick-demo.bat
```

## 📋 Verificación Completa

### Checklist de Instalación

- [ ] **Windows 10/11** ✅
- [ ] **PowerShell 5.1+** ✅
- [ ] **OpenMSX instalado** ✅
- [ ] **Scripts de automatización** ✅
- [ ] **Execution Policy configurada** ✅
- [ ] **Prueba básica exitosa** ✅

### Comando de Verificación

```powershell
.\test-automation.ps1
```

Este comando verificará automáticamente todos los requisitos.

## 🎯 Primeros Pasos

### Generar tu Primer Screenshot

```batch
# Opción 1: Interface simple (recomendado para principiantes)
.\openmsx-screenshot.bat "ruta\a\tu\juego.rom"

# Opción 2: PowerShell avanzado
.\openmsx-automation.ps1 -RomPath "ruta\a\tu\juego.rom" -WaitSeconds 10
```

### Si no tienes ROMs de prueba

1. **Usar el servidor de compilación del proyecto**:
   - Ir a la aplicación MSX IDE web
   - Compilar código Z80 ASM
   - Los ROMs se guardan automáticamente en `server\temp\`

2. **Usar ROMs existentes**:
   - Colocar archivos `.rom` en cualquier directorio
   - Usar rutas absolutas o relativas

### Ejemplo con ROM del Proyecto

```powershell
# Si compilaste código usando la aplicación web
.\openmsx-automation.ps1 -RomPath "..\..\server\temp\source_1234567890.rom"
```

## 🔧 Configuración Personalizada

### Archivo config.json

Editar `C:\Users\salam\Documents\Programacion\Mideas\automation\openmsx\config.json`:

```json
{
  "automation": {
    "default_wait_time": 10,     ← Cambiar tiempo por defecto
    "screenshot_dir": "screenshots",  ← Cambiar directorio
    "auto_exit": true            ← Cerrar OpenMSX automáticamente
  }
}
```

### Variables de Entorno (Opcional)

```powershell
# Configurar OpenMSX path permanentemente
[System.Environment]::SetEnvironmentVariable("OPENMSX_PATH", "C:\mi_ruta\openmsx.exe", "User")
```

## 🚨 Solución de Problemas Comunes

### Error: "openmsx.exe no encontrado"

```powershell
# Verificar instalación
Get-ChildItem "C:\Program Files\openMSX\" -Recurse -Name "openmsx.exe"

# Especificar ruta manualmente
.\openmsx-automation.ps1 -RomPath "juego.rom" -OpenMsxPath "C:\ruta\completa\openmsx.exe"
```

### Error: "execution of scripts is disabled"

```powershell
# Ejecutar como administrador y correr:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine

# O solo para usuario actual:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### OpenMSX se abre pero no genera screenshot

1. **Aumentar tiempo de espera**:
   ```powershell
   .\openmsx-automation.ps1 -RomPath "juego.rom" -WaitSeconds 20
   ```

2. **Verificar que el ROM es válido**:
   - Debe ser múltiplo de 8KB
   - Extensión `.rom` o `.bin`

3. **Probar máquina diferente**:
   ```powershell
   .\openmsx-automation.ps1 -RomPath "juego.rom" -Machine "MSX2"
   ```

## 📂 Estructura de Directorios Creada

Después de la instalación tendrás:

```
automation/openmsx/
├── openmsx-automation.ps1      # ✅ Script principal
├── openmsx-screenshot.bat      # ✅ Interface simple
├── batch-screenshots.ps1       # ✅ Procesamiento lote
├── screenshot_automation.tcl   # ✅ Script TCL
├── test-automation.ps1         # ✅ Verificación
├── quick-demo.bat             # ✅ Demo rápido
├── config.json               # ✅ Configuración
├── README.md                 # ✅ Documentación
└── INSTALL.md               # ✅ Esta guía

screenshots/                  # 📁 Screenshots automáticos
├── demo/                    # 📁 Screenshots de demo
└── batch/                   # 📁 Screenshots en lote
```

## 🎉 ¡Instalación Completada!

### Próximos Pasos

1. **Leer documentación**: `README.md`
2. **Ejecutar demo**: `.\quick-demo.bat`
3. **Probar con tus ROMs**: `.\openmsx-screenshot.bat "tu_rom.rom"`
4. **Integrar con servidor** (opcional): Ver `server-integration.js`

### Comandos de Uso Frecuente

```powershell
# Screenshot rápido
.\openmsx-screenshot.bat "juego.rom"

# Screenshots de todos los ROMs compilados
.\batch-screenshots.ps1 -InputDir "..\..\server\temp"

# Verificar sistema
.\test-automation.ps1

# Demo interactivo
.\quick-demo.bat
```

### Soporte

- 📖 **Documentación completa**: `README.md`
- 🧪 **Pruebas**: `.\test-automation.ps1`
- 🎮 **Demo**: `.\quick-demo.bat`

¡Disfruta automatizando tus screenshots de MSX! 🎮📸
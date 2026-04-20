# Quick Start

## Capture after menu navigation

```powershell
python scripts/capture_openmsx_action.py `
  --rom server\temp\BasicEnemy.rom `
  --sequence "DOWN,DOWN,SPACE,WAIT:900" `
  --project-root C:\Users\salam\Documents\Programacion\Mideas
```

## Capture after moving the player

```powershell
python scripts/capture_openmsx_action.py `
  --rom server\temp\BasicEnemy.rom `
  --sequence "RIGHT:1200,WAIT:250,SPACE,WAIT:400,LEFT:700" `
  --project-root C:\Users\salam\Documents\Programacion\Mideas `
  --output C:\Users\salam\Documents\openMSX\screenshots\basicenemy_action.png
```

## Konami mapper with extra startup wait

```powershell
python scripts/capture_openmsx_action.py `
  --rom server\temp\mi_juego.rom `
  --romtype konami `
  --boot-wait-ms 7000 `
  --sequence "SPACE,WAIT:1200,RIGHT*2" `
  --project-root C:\Users\salam\Documents\Programacion\Mideas
```

## Inspect command without launching

```powershell
python scripts/capture_openmsx_action.py `
  --rom server\temp\BasicEnemy.rom `
  --sequence "DOWN,SPACE,WAIT:500" `
  --dry-run
```

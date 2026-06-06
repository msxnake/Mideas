# Project Memory

## Proyecto
Mideas

## Estado Actual
- Exportación ASM
- Exportación ROM
- State Machine
- Entities
- Components
- Worlds
- Screens

## Decisiones Arquitectónicas
- Mapper Konami 8KB
- Compresión ZX0
- Música PT3
- Prioridad absoluta del Player
- Scheduler VSYNC estilo Konami como objetivo de estabilidad

## Problemas Abiertos
- Optimización cambios pantalla
- Gestión de RAM
- Scheduler VSYNC
- Validación de registros en ASM generado
- Control de bugs difíciles por corrupción de registros

## Próximos Objetivos
- Biblioteca Players
- Biblioteca Enemigos
- Editor Waves
- Validación automática de cabeceras ASM

## Sesión 2026-06-06 - MSX2 PushBox / salto plataforma
- Rama activa: `codex/msx2-shooter-world-runtime`.
- Commit funcional previo: `beab2c96 Restore MSX2 pushbox runtime and fix player editor sync`.
- Commit de cierre: `eac296a5 Fix MSX2 platform jump hitbox probes`.
- Estado: `push_example12.json` y `push_example15.json` compilan con Glass como MegaROM Konami SCREEN 4.
- Prueba visual: OpenMSX con `push_example12_collision_fix.rom` muestra mapa, player, plataformas y cajas tras movimiento/salto.
- RAM preflight MSX2: 1604 bytes usados, 11452 libres, status `ok`.
- Bug resuelto: colisión vertical del salto MSX2 usaba probes fijos 16x16 y ahora usa `hitboxes.body` del Player Config con snap vertical.
- Lección documentada en `ai/LESSONS_LEARNED.md`: no asumir 16x16 si el Player Config define hitbox real.
- Pendiente: los cambios generados en `dist/*`, `server/temp/unitedCompressedFiles.asm` y `server/temp/codex_head_compare` quedaron fuera de los commits.

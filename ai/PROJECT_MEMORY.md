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

## Datos relevantes de prompts - 2026-06-06
- Prioridad del usuario: recuperar versión MSX2 donde PushBox funcionaba con movimiento suave de caja usando sprite hardware; el caso bueno fue alrededor del commit del día 3 y se validó con `push_example12.json`.
- Proyecto/fixtures relevantes: `push_example15.json` fue el bug original de pantalla azul/parpadeo; `push_example12.json` acabó siendo el fixture principal para PushBox con gravedad/caja.
- UI Player Config: los componentes del Player Config sí alimentan el JSON (`msx2player`) y el generador los fusiona con los componentes del player colocado en pantalla.
- Player Config no debe ser fuente de verdad para crear animaciones MSX2; la animación/render real debe venir del Sprite Editor MSX2 y el Player solo asigna el Render pertinente.
- Facing pendiente/contexto: se trabajó sobre facing/mirror/idle y se pidió admitir `Neutral / mirando al frente` en Default Facing.
- React: se corrigió `Maximum update depth exceeded` haciendo idempotente la sincronización de animaciones desde sprites enlazados.
- Game loop MSX2 actual: bucle secuencial por frame; componentes son switches de generación, no ECS dinámico runtime; GameFlow decide entrada a pantalla y el player tiene prioridad.
- OpenMSX debe usarse como herramienta de debug/validación visual cuando haya dudas de runtime MSX2.
- Nueva convención deseada: “modo noche” cuando el usuario diga `paramos sesion`, `adios`, `hasta mañana`, etc.; guardar memoria compacta por fecha, bugs esenciales y estado Git, sin llenar memoria con datos irrelevantes.
- Decisión de transparencia: no guardar conclusiones ocultas, codificadas o "solo para la IA". Cualquier memoria interna operativa debe ser visible, auditable y corregible por el usuario.

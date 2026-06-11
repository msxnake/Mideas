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

## Sesión 2026-06-07 - Player Config declarativo y pantallas MSX2
- Rama activa: `codex/msx2-shooter-world-runtime`.
- En Player Config, `Graphics & Render` queda orientado a enlaces declarativos: las animaciones no se crean ahí; se linkan roles del Player con renders MSX2 y estados de State Machine.
- Commits relevantes: `efedaa03`, `565d0a53`, `7f85c92b`, `02ce5d80`, `d4298dce`, `42493e7b`, `fd3fc7d1`, `792be814`.
- State Machines de Player: crear/actualizar solo desde estados explícitamente linkados; el asset auxiliar se nombra desde el Player owner visible (`<PlayerName>_sm`) y no debe renombrar el asset Player.
- UI de estados: mostrar nombres humanos (`Attacking`, `Walking`, etc.) y reservar ids internos para persistencia/debug.
- Nuevo selector en pantallas MSX2: `Player Entries` permite elegir el asset `MSX2 Player` por entrada usando `playerId`; commit `64e1bb06 Add MSX2 screen player asset selector`.
- Verificación final UI: `npm run build`, `git diff --check`, preview Vite con Playwright sin errores de consola.
- Pendiente: los cambios generados en `dist/*`, `server/temp/unitedCompressedFiles.asm` y `server/temp/codex_head_compare` siguen fuera de commits y no deben mezclarse con cambios funcionales.
- Limpieza Player Config: eliminado `worldCompatibility` y botones `Worlds`; commit `1bed4b8a`.
- Hitboxes UI: el Collision Box real vive en `msx2player.hitboxes.body`. El `MSX2 Sprite Editor` ya no muestra ni edita `Hitbox Settings` para evitar confusión; commit `5471719c`.
- Player Config muestra preview de sprite + hitboxes con body blanco/negro y attack rojo/negro punteados; commits `9ed6010d`, `f4e79506`, `4bae395e`.
- Attack Box es direccional 2D por facing (`hitboxes.attackByFacing.right/left/up/down`) y `hitboxes.attack` queda como fallback compatible con right; commit `9ceadcab`.

## Sesion 2026-06-08 - Player Config Weapons y hitbox mirror
- Rama activa: `codex/msx2-shooter-world-runtime`.
- Weapons en Player Config MSX2 queda como contrato declarativo JSON para futuro ASM: `weapons[]`, `equippedWeaponId`, disponibilidad inicial (`owned`, `pickup`, `locked`), `pickupItemId`, municion, durabilidad, comportamiento al quedarse sin balas o romperse.
- `equippedWeaponId` puede estar vacio: representa player sin arma equipada. No se debe autoequipar la primera arma si el usuario quiere empezar sin arma.
- Commits relevantes: `29ba0f41`, `a226fcb7`, `1885015d`.
- Preview de hitboxes muestra facing mirror: dibujo Right y Left mirror. El Left mirror debe ser espejo matematico del Right para que el attack box tenga el mismo tamano; commits `63722290`, `27cf7c0e`.
- Analisis MSX2 Player Components vs Player Config: el generador SCREEN 4 mezcla Player asset + entidad de pantalla. Los componentes `msx2_player_control`, `msx2_jump`, `msx2_gravity` controlan activacion/capacidades, pero si Player Config define `movement.jumpPower`, `movement.gravity` o `movement.maxFallSpeed`, esos valores numericos ganan y se convierten a 8.8 para ASM. `screen.runtime` puede sobreescribir jump/gravity/terminal por pantalla.
- Recomendacion de diseno: mantener Player Config como fuente humana principal y componentes como vista avanzada/sincronizada, para evitar contradicciones entre `movement.*` y `msx2_jump/msx2_gravity`.
- Ideas futuras discutidas: `slash` como weapon action declarativa consumida por State Machine/ASM; `dash` como ability de movimiento, no como weapon.

## Sesion 2026-06-10 - Fix skills MSX2 (dash/teleport/glide) y colision RAM coyote/box2
- Rama: `codex/msx2-shooter-world-runtime`.
- 6 fixes aplicados: (A) coyote/jump_buffer movidos de #C047/#C048 (eran msx2_box2_count/try_dx) al chain de msx2SkillRamLayout.ts con assert de limite #C087; (B) dash preserva E con push/pop alrededor de msx2_collision_at_pixel; (C) dash sin hooks box2 (labels inexistentes, no compilaba); (D) teleport abs usa el carry del SUB + check de colision en destino; (E) checks direccionales de skills corregidos (antes siempre "pulsado") y extraidos a msx2SkillControlsGenerator.ts; (F) glide cap invertido (jp nc -> jp c).
- Dash default binding cambiado de 'jump' a 'attack' (decision del usuario): compartir boton hacia que cada salto disparara dash.
- Verificacion: check_skill_params_contract 18/18, tsc limpio, test/verify_skills_fix.cjs (checks estructurales sobre ASM generado), compilacion glass (megarom konami, 40KB), smoke OpenMSX automatizado con C-BIOS_MSX2+ (-romtype Konami obligatorio): arranque + movimiento + salto + dash (27->59, para en solido) + teleport ida/vuelta con delta negativo + box2_count estable en salto con coyoteTime=8.
- Smoke automatizable nuevo: openmsx -script con after time + keymatrixdown/up + debug read memory permite probar mecanicas sin humano (supera la limitacion de la leccion 2026-06-08). Scripts en test/smoke_*.tcl.
- ROMs de evidencia: test/v22m_asis.rom (push_example22 coyote+pushBox), test/v21m_skills.rom (dash+teleport+glide). Screenshots test/smoke_*.png.
- Pendiente usuario: smoke manual en IDE/OpenMSX de sus proyectos reales; push_example22 NO cabe en simple32k (overflow ~2KB, previo a esta sesion) -> usar megarom konami.
- Fuera del commit: GameFlowPreviewModal.tsx, debug log, server/temp, downloads/*.json, gen_push21.py, test_fix.cjs (WIP previo no verificado en esta sesion).

## Sesion 2026-06-10 (continuacion) - wall_jump skill MSX2
- Rama: `codex/msx2-shooter-world-runtime`.
- Implementada skill `wall_jump` siguiendo el patrón de `dash`: TypeScript contract (`Msx2WallJumpConfig` + `getMsx2WallJumpConfigFromPlayerEntity` en `utils/msx2PlatformPhysics.ts`), ASM generator (`msx2WallJumpGenerator.ts` con 11 builders), integración en `msx2Screen4Generator.ts` (15 puntos de inyección), JS parity en `GameFlowPreviewModal.tsx`.
- RAM: 4 bytes para wall_jump (`msx2_wall_slide_side`, `msx2_wall_jump_lock_timer`, `msx2_wall_jump_lock_vx`, `msx2_wall_jump_key_lock`). Límite de skill chain movido de #C087 a #C08C (+4B wall_jump + 1B defensive gap).
- Bugfix crítico: `MSX2_GLIDE_RAM_BYTES` faltaba en `Msx2SkillRamOptions` y en `resolveMsx2SkillExtensionRamBase` — glide y wall_jump calculaban direcciones RAM incorrectas (wall_jump se posicionaba donde debía ir glide y viceversa).
- Bugfix init: `buildMsx2WallJumpInitClearAsm` ponía `wall_slide_side=0` (left wall) en vez de `MSX2_WALL_SLIDE_NONE` (0xFF).
- Reset en screen transition incluye wall_jump y dash vars (fix latente #4).
- Verificación: 22/22 checks en `check_skill_params_contract.cjs`, esbuild syntax clean.
- Pendiente: smoke OpenMSX end-to-end (manual o automatizado).

## Sesion 2026-06-11 - Regeneracion coyote + verificacion wall_jump
- Rama: `codex/msx2-shooter-world-runtime` (HEAD 901b8b04 wall_jump Fase 0-7).
- ROM coyote regenerada (push_example22, megarom konami): push de cajas OK ambas direcciones, box2_count estable. ROMs: test/v22coyote.rom y _64k.rom.
- 3 fixes a wall_jump/WIP: (1) TS error platformMoveSpeed usado antes de declarar (TDZ) en msx2Screen4Generator:3774; (2) buildMsx2WallJumpResetAsm() emitido incondicionalmente -> ROM sin wall_jump no compilaba (Symbol not found); (3) key_lock sin release -> solo un wall jump por vida; anadida msx2_wall_jump_release_lock (patron dash) y llamada en el gate.
- Verificacion wall_jump end-to-end (test/v22walljump_64k.rom, smoke determinista con pared inyectada en cache de colision): bloqueo en x=49, kick de 32px exactos (4px x 8 frames) con impulso vertical, lock decrementando, keylock armado/limpiado, SEGUNDO kick identico. Layout RAM: side #C079, timer #C07A, vx #C07B, keylock #C07C; coyote #C077; box2 #C047 intactos.
- Limitaciones conocidas wall_jump (sin tocar, decision pendiente): step_lock no comprueba colision (el kick puede empotrar al player); el mismo press de salto en suelo junto a pared dispara core jump + kick 1 frame despues; el input direccional no se suprime durante el lock (mantener hacia la pared reduce el escape a la mitad).
- Checks: contrato 22/22, verify_skills_fix OK, tsc limpio.

## Sesion 2026-06-11 (tarde) - Wall jump anidado: traslacion comprometida pixel a pixel
- Bug reportado: tras un wall_jump el player quedaba separado de la pared contigua (hasta 3px), sin friccion ni posibilidad de anidar otro salto. Causas: (1) paso de 4px paraba corto ante pared, (2) probe de contacto solo alcanza speed=2px, (3) lock de 8 frames expiraba antes de cruzar huecos >32px y con cursores bloqueados no se podia corregir.
- Rediseno en msx2WallJumpGenerator.ts: el kick es traslacion comprometida PIXEL A PIXEL con probe por pixel; no expira por tiempo: sigue hasta pared (queda FLUSH -> detect dispara -> slide -> kick anidado), borde patrol o aterrizaje. lock_timer pasa a flag #FF/0; lockFrames eliminado; lock_vx sigue siendo el air-lock de cursores (lo limpia solo el aterrizaje). Gate: jp a update_hardware_sprite_vertical mientras vx armado.
- Verificado visualmente con downloads/push.json (mapa con chimenea col13 de 16px entre torres col12/col14): escalada anidada ~14px/kick con taps rapidos de N, x clavada en 208 (cero empotramiento con 0px de margen), friccion exacta 1px/f, salida natural por arriba donde acaba la torre corta, vuelo comprometido ignorando cursores, control restaurado al aterrizar (incluso sobre una caja). Screenshots test/wj_*.png, ROM test/push_wj_64k.rom.
- Nota tuning: el ritmo de escalada depende de la cadencia de pulsacion y de wallJumpPower vs gravedad del proyecto (con la gravedad de push.json el rise por kick es ~16px).
- Tecnica nueva: dump del grid de colision 16x12 por TCL (leer ptr #C004/05) para disenar tests sobre el mapa real.

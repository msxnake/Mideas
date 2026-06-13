# Project Memory

## Proyecto
Mideas

## Regla operativa de archivos
- Si un proyecto Mideas solicitado no aparece en el workspace, `server/temp` o rutas obvias del repo, buscar primero en `C:\Users\salam\Downloads`. El usuario suele dejar ahi los `.json` recientes de proyectos Mideas.

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

## Sesion 2026-06-11 (noche) - Campo "Vertical push" en wall_jump
- Nuevo parametro `wallJumpVertical` (px/frame, 1-8, default 4) en el dialog de wall_jump, simetrico a Horizontal push y mas intuitivo que el 8.8.
- Precedencia: solo manda si esta EXPLICITO en skillParameters.wall_jump (check raw, no pickSkillNumberParam: su fallback al default habria pisado todo wallJumpPower custom con 4px/f). Sin el campo -> path legacy wallJumpPower intacto (bit-identical: #FC).
- Resuelto dentro de getMsx2WallJumpConfigFromPlayerEntity -> wallJumpPower88: ASM y preview JS (GameFlowPreviewModal) en paridad automatica sin tocar ASM.
- Archivos: msx2PlatformPhysics.ts, skills/handlers/index.ts, skills/data/wall_jump.json, components/dialogs/skills/WallJumpDialog.tsx (las 3 copias de la definicion del parametro), contrato.
- Verificado: contrato 22/22, tsc limpio, impulso #FC legacy / #F8 con vertical=8, smoke visual en chimenea de push.json: ~60px de subida por kick con vertical=8 (vs ~14px con default). ROM test/push_wjv8_64k.rom.
- Regla recordada: la definicion de un skill param vive en TRES sitios (handlers/index.ts, data/<skill>.json, components/dialogs/skills/<Skill>Dialog.tsx) - mantener las tres sincronizadas.

## Sesion 2026-06-11 (madrugada) - Power Stomp + terremoto VDP R#18
- Nuevo skill runtime Power Stomp (antes solo UI) + efecto reusable de screen shake via V9938 R#18. Implementado con agente, verificado y depurado por mi en OpenMSX.
- Disparo: DOWN+B en el aire (controlIcon power_stomp = ['down','attack']). Caida rapida (stompSpeed, pin gravity_vel), deteccion al aterrizar, shake si checkbox screenShake.
- Archivos nuevos: msx2ScreenShakeGenerator.ts (1 byte RAM, reusable), msx2PowerStompGenerator.ts (2 bytes: active+cooldown). Modificados: msx2PlatformPhysics.ts (Msx2PowerStompConfig + getMsx2PowerStompConfigFromPlayerEntity + msx2PlayerWantsScreenShake), msx2SkillRamLayout.ts (chain +powerStomp +screenShake, limite #C08C->#C094), msx2Screen4Generator.ts (wiring ~8 puntos espejo de wall_jump), skills/handlers/index.ts + data/power_stomp.json + PowerStompDialog.tsx (checkbox screenShake), check_skill_params_contract.cjs (22->26).
- RAM chain con wall_jump+stomp: coyote#C077 jbuf#C078 / wall_jump #C079-7C / stomp_active#C07D cooldown#C07E / shake_timer#C07F. Sin pushBox baja a #C049+. Sin solapes.
- BUG critico encontrado y corregido (ver LESSONS_LEARNED): init-clear del shake usaba `ld bc,#1200` (bytes invertidos) -> escribia R#0 en vez de R#18 -> VDP roto, cuelgue en GameFlow antes del main loop. Fix: `ld bc,#0012`.
- Tabla shake R#18: db #00,#F0,#10,#F0,#20 (se reproduce timer 5->1 = #20,#F0,#10,#F0,#00), oscilacion vertical que termina centrada. Verificado: r18 oscila 32->16->0.
- Verificacion OpenMSX: arranque OK (flags=1, player visible), salto+stomp (active=1, caida), aterrizaje dispara shake (shake=4, r18 oscila y centra). No-regresion: push.json sin stomp = 0 refs shake, arranca flags=1. Contrato 26/26, tsc limpio.
- Fase 2 pendiente (documentada como TODO en msx2_stomp_on_land): dano a enemigos / romper tiles dentro de impactRadius (params stompDamage, breakableTiles, impactRadius, ricochetOnMiss ya existen en UI pero sin runtime).
- Tecnica de debug clave: breakpoints openMSX (debug set_bp ADDR 1 {incr hits}) + reg PC. input_gate_hits=0 + PC en BIOS = cuelgue en init/gameflow, no en runtime del player.

## Sesion 2026-06-12 - Fix salto roto con air_dash activo
- Sintoma: con air_dash activado el salto normal moria en idle (flags=0, sin gravedad); andando funcionaba. Los commits 223da143/61bdf557 parcheaban sintoma.
- Causa raiz: `${airDashActiveFrameAsm}` insertado en el fallthrough del dispatch GTSTCK; su `jp upload_hardware_sprite_attrs` saltaba la fisica vertical todos los frames idle.
- Fix (1 linea, msx2Screen4Generator ~6303): bloque air dash movido tras el `jp update_hardware_sprite_vertical` final, alcanzable solo desde su gate.
- Verificado OpenMSX (push.json + air_dash, megarom konami): salto idle apex=76 = baseline, 3 saltos repetidos OK, air dash +36px burst, salto post-dash OK. ROM test/ad2_64k.rom.
- Incluye WIP previo verificado junto: probes centrales de grounded (jump block + check_grounded + land) y fast-path de flags en msx2_air_dash_player_grounded.

## Sesion 2026-06-12 - Primer puente Enemy Library -> runtime MSX2: FlyerSine
- Implementado `FlyerSine` como modo `msx2_movement` en los slots compactos de enemigos/hazards existentes: `mode=5`, `dx` firmado para velocidad horizontal, `dy` firmado para frecuencia vertical, `minY/maxY` como amplitud.
- No se ha conectado aun `EnemyDefinition -> Screen entity -> ROM`; por ahora se activa desde entidades de pantalla con `msx2_movement.mode = "flyerSine"`/`"sine"`/`"sineWave"`/`"flyer"`.
- RAM: 0 bytes nuevos. Se reutilizan tablas existentes `msx2_enemy_runtime_x/y/dx/dy/mode` y limites `msx2_screen_enemy_min/max`.
- CPU: coste por enemigo FlyerSine superior a patrol simple por mover X e Y en el mismo frame y consultar dos limites; sin llamadas BIOS/VDP nuevas.
- Verificacion: `node scripts/check_skill_params_contract.cjs`, `npm run build`, Glass ROM smoke con `server/temp/loderunner_flyer_sine_project.json` -> `server/temp/loderunner_flyer_sine.rom` 65536 bytes. ASM contiene `msx2_screen_enemy_mode: DB #05...` y `.enemy_slot_0_flyer_sine`.

## Sesion 2026-06-12 - Segundo puente Enemy Library -> runtime MSX2: Jumper
- Implementado `Jumper` vertical como modo `msx2_movement` en slots de enemigos: `mode=6`, `dy` firmado para salto/caida y `tick/speed` para pausa al aterrizar.
- Activacion por entidades de pantalla con `msx2_movement.mode = "jumper"`/`"jumping"`/`"verticalJump"`. Aun no conecta `EnemyDefinition` automaticamente.
- RAM: 0 bytes nuevos; reutiliza runtime compacto de enemigos. CPU: actualiza pausa y Y; sin llamadas externas ni VRAM/VDP nuevas.
- Nota: un intento de meter Hopper horizontal unrolled por slot produjo overflow residente en Glass; el `Jumper` final usa `msx2_enemy_jumper_shared` con stub por slot. `HopperTowardsPlayer` debe seguir este patron compartido o un diseno de slot indirecto, no duplicar movimiento X/Y por los 12 slots.

## Sesion 2026-06-12 - Fix overflow residente FlyerSine/Jumper MSX2
- Bug: proyectos MSX2 SCREEN 4 MegaROM podian fallar con `Resident SCREEN 4 code/data crossed #C000` despues de anadir comportamientos complejos de enemigo.
- Causa raiz: `FlyerSine` seguia duplicado por slot; el diagnostico podia apuntar a tablas pequenas (`msx2_screen_enemy_*`, `box2_restore_names`), pero el ahorro real estaba en eliminar codigo residente unrolled.
- Fix: `FlyerSine` pasa a `msx2_enemy_flyer_sine_shared` con stubs por slot, y `Jumper` usa el helper compartido `msx2_enemy_screen_slot_offset_from_b` para calcular offsets sin clobberar `B`.
- RAM: 0 bytes nuevos. CPU: algo mas de coste por `jp/call` al handler compartido, compensado por mucho menos ROM residente. Sin mover mundos ni tablas completas a RAM.
- Verificacion: `npm run build`, `node scripts/check_skill_params_contract.cjs`, Glass con `server/temp/loderunner_flyer_sine_project.json` y `server/temp/loderunner_jumper_project.json`; ROMs de 65536 bytes (`loderunner_flyer_sine_shared.rom`, `loderunner_jumper_shared.rom`). OpenMSX screenshots OK: `server/temp/loderunner_flyer_sine_shared_smoke.png`, `server/temp/loderunner_jumper_shared_smoke.png`.

## Sesion 2026-06-13 - Tercer puente Enemy Library -> runtime MSX2: WalkerTurnOnEdge
- Implementado `WalkerTurnOnEdge` (mode 7): patrulla horizontal que gira ante pared solida O ante borde de plataforma (sin suelo delante). Activacion por entidad de pantalla `msx2_movement.mode = "walkerTurnOnEdge"` (alias: walker / walkerEdge / turnOnEdge / edgeWalker). Commit `a041cfe4`.
- Patron compartido obligatorio (leccion overflow 2026-06-12): `msx2_enemy_walker_edge_shared` + stub por slot (`ld b,slot / jp ...`). Por frame: probe pared en `(frontX, y+8)` y probe borde en `(frontX, y+16)` con `msx2_collision_at_pixel`; `NEG` invierte dx al bloquear/borde sin mover ese frame. Limites min_x/max_x como red de seguridad.
- Registros: el slot viaja en B; `msx2_collision_at_pixel` necesita B=x, asi que el slot se guarda con PUSH BC / POP BC alrededor de cada probe (la rutina preserva BC, cada POP equilibra su PUSH). push=pop=6 verificado en el ASM generado.
- RAM: 0 bytes nuevos (reutiliza `msx2_enemy_runtime_x/dx/mode` + `msx2_screen_enemy_min/max_x`). CPU: ~2 probes de colision + 1 movimiento por walker/frame; sin llamadas BIOS/VDP/PSG nuevas; handler compartido = crecimiento residente minimo.
- Smoke OpenMSX (C-BIOS_MSX2+, romtype Konami, ROM Glass 40KB `test/walker_edge_smoke.rom`): inyectando una plataforma de 4 tiles en la cache de colision (`#C004/05`), el enemigo recorre cols 8..12 (x 129..192), gira dx en AMBOS bordes y nunca cae (span=63, 4 giros limpios). Sin plataforma (enemigo flotante) gira cada frame en el sitio: comportamiento documentado como NOTE, no bug.
- Pendiente compartido con FlyerSine/Jumper: el puente `EnemyDefinition -> entidad de pantalla -> ROM` sigue sin conectar; los modos se activan por `msx2_movement.mode` en la entidad colocada.

## Sesion 2026-06-13 - Puente Enemy Library -> pantalla MSX2 (enemigos colocables y jugables)
- Objetivo del usuario: colocar un Enemy de la Enemy Library directamente en una pantalla SCREEN 4 y que funcione el gameplay; las entidades quedan solo para objetos interactivos. Commit `5d703e48`.
- Modelo elegido (tras descartar el live-link por requerir fontaneria summary->analysis): **snapshot en colocacion**. El generador queda INTACTO (no-regresion garantizada; `msx2EntityRuntimeGenerator`/`msx2Screen4Generator` sin diff). Decision tomada con el usuario (descarto live-link complejo por riesgo/simplicidad, MIDEAS).
- `components/msx2_screen4_editor/msx2EntityCatalog.ts`: `mapEnemyBehaviorToMovementMode` (behavior EnemyDefinition -> nombre de modo del generador: PatrolHorizontal->patrolX, WalkerTurnOnEdge->walkerEdge, FlyerSine->flyerSine, Jumper->jumper, BounceDiagonal->ballBounce; resto -> 'static' = enemigo quieto que aun hace dano por contacto, implemented:false para avisar). `buildMsx2EnemyEntityFromAsset` vuelca un asset msx2enemy en una entidad `kind:'enemy'` colocada (msx2_movement.mode + render spriteId + params.enemyAssetId como link para un futuro "Refresh from library").
- `Msx2Screen4EditorParts.tsx` + `Msx2Screen4RoomEditor.tsx`: seccion "Place Enemy (from Library)" que lista los assets msx2enemy del proyecto; al hacer click en la pantalla estampa la entidad. Seleccionar un preset limpia la seleccion de enemigo y viceversa.
- El enemigo colocado fluye por el pipeline de slots EXISTENTE sin cambios: `getMsx2EnemyHazardRuntimeSlots` lee msx2_movement.mode; `getEnemyHardwareSpriteSource` lee el render sprite. Mapping es TS en tiempo de autoria.
- RAM: 0 bytes nuevos. CPU: 0 coste runtime (el enemigo corre igual que uno colocado a mano).
- Verificacion: contrato 47/47, Glass MegaROM Konami 40KB (`test/enemy_bridge_smoke.rom`), smoke OpenMSX: un WalkerTurnOnEdge de la libreria colocado en pantalla -> mode 7, recorre plataforma (span 64, 3 giros) y hace dano al player al contacto (lives 3->2, hit=1). Generadores byte-identicos (no-regresion).
- Limitacion v1 (documentada): todos los enemigos de una pantalla comparten 1 patron de sprite (el primero). Sprites distintos por enemigo + matar con bala/score = Fase 2 pendiente.

## Sesion 2026-06-13 - Cuarto comportamiento: ChaseHorizontal (mode 8)
- `ChaseHorizontal` (mode 8): el enemigo da 1px/frame hacia la X del player. Activacion `msx2_movement.mode = "chaseHorizontal"` (alias chaseH/chaseX/followX) y desde el puente Enemy Library (behavior ChaseHorizontal -> chaseH). Commit `3c3ae0ce`.
- Handler compartido `msx2_enemy_chase_h_shared` + stub por slot. Lee `msx2_player_sprite_x`, compara con enemy X (si igual -> no mueve, sin jitter), probe de pared en (frontX,y+8) (si solido -> no mueve), acotado a min_x/max_x. Slot en B con PUSH BC/POP BC alrededor del probe (push=pop=4).
- 'chase' a secas sigue siendo ghost-maze; ChaseHorizontal usa nombres explicitos para no colisionar.
- RAM: 0 bytes. CPU: 1 lectura player X + compare + 1 probe + 1 move por chaser/frame.
- Verificacion: contrato 52/52, Glass MegaROM Konami 40KB (`test/chase_smoke.rom`), OpenMSX: enemigo en x=200 sigue al player a la izquierda (->129) y luego a la derecha (->207). Behaviors con runtime: patrol/ghost/dive/ball/flyerSine/jumper/walkerEdge/chaseH. Faltan Hopper/DropFromCeiling/EmergeFromGround.

## Sesion 2026-06-13 - Enemy render roles + animacion hardware compartida
- Bug de `C:\Users\salam\Downloads\push10.json`: `Bat_Enemy` usaba `mosquit_spr` con 3 frames, pero el ASM MSX2 emitia solo `msx2_hw_enemy_sprite_pattern` frame 0 y el SAT escribia siempre el mismo patron. Resultado: enemigo sin animacion aunque el movimiento funcionase.
- Fix generador: el sprite hardware compartido de enemigos ahora reserva frames completos (y mirror si aplica), anade `msx2_enemy_anim_counter/frame` al final del pool de enemigos (+2 bytes RAM), y `write_hardware_sprite_attrs` usa `msx2_enemy_anim_frame` con stride 4 para 16x16.
- UI/JSON Enemy Config: `render.roles[]` declara links por rol/estado/comportamiento/ataque -> sprite -> frames/speed/loop. El editor conserva `render.spriteId` y `render.animations` como fallback compatible.
- Puente autoría->ASM: al colocar un `msx2enemy` desde la libreria, `buildMsx2EnemyEntityFromAsset` elige el rol que mejor coincide con behavior/attack y snapshottea `msx2_animation.frameList/frameDelay`; el generador consume esos frames. Limitacion vigente: runtime dinamico por estado (Patrol->Melee en gameplay) aun no implementado; hoy se selecciona el rol al colocar/generar el enemigo compartido de pantalla.
- Verificacion: contrato 60/60, `npm run build`, Glass MegaROM Konami con `push10_enemy_anim_roles.rom`, screenshot OpenMSX `server/temp/push10_enemy_anim_roles.png`. RAM preflight: used=1638, free=11418, status ok.

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

## Sesion 2026-06-18 - SCREEN 5 bitmap: render fix, no-mixing y nuevo editor Tile Map
- Rama: `feature/msx2-screen-bifurcation`.
- Aclaracion de nomenclatura: el "SCREEN 4 bitmap room" es nombre LEGACY de la ruta; el hardware real es SCREEN 5 (CHGMOD 5). Todas las etiquetas VISIBLES se renombraron a SCREEN 5; el id de tipo interno `msx2bitmaproom`, el mode `SCREEN4` y la ruta `msx2-screen4-bitmap-room` NO se tocan (commits `9291acac`, `502b0a2b`).
- No-mixing IMPUESTO (commit `4c3bb2d4`): un ROM = un modo grafico. `utils/msx2ProjectProfiles.ts` separa `MSX2_TILE_SCREEN_ASSET_TYPES` (perfiles tile, `msx2screen`) vs `MSX2_BITMAP_ROOM_ASSET_TYPES` (`bitmapPlatform`, `msx2bitmaproom`); `allowedAssetTypes` es baseline-authoritative (sin mergeUnique). Guard de export `detectMsx2ScreenModeConflict`/`getMsx2ScreenModeConflictMessage` en `generateModularASM`. Revierte el contrato previo que exigia que platform/maze permitieran bitmap rooms.
- Bug render SCREEN 5 RESUELTO (commit `8210906a`, otra IA + verificado): la parte inferior de la pantalla no se dibujaba. Causa real: NO era pared de escritura VRAM >#4000 (la escritura extendida con R#14 funciona); el framebuffer crudo de 24576 bytes ponia su 2a mitad en direccion Z80 #8000+, que en ROM simple32k NO esta garantizada como lectura de cartucho -> leia #FF y pintaba blanco. Fix: emitir el framebuffer como RLE residente y descomprimirlo a VRAM por chunks de 16KB rearmando R#14 por banco. Leccion en LESSONS_LEARNED (2026-06-17): un watchpoint de LECTURA que dispara NO prueba que el dato sea valido; no asumir que un ROM simple lineal es visible en #8000+.
- NUEVO editor "Tile Map" para bitmap SCREEN 5 (commits `95e49418`, `524fcd35`): `components/editors/Msx2BitmapScreenEditor.tsx`, en PARALELO al clasico `Msx2Screen5BitmapRoomEditor` (intacto), accesible por un toggle beta en `AppUI.tsx` para assets `msx2bitmaproom`.
  - Modelo de datos: nuevo campo opcional `tileGrid?: number[][]` en `Msx2Screen5BitmapRoom` (matriz 16x(alto/16), valor = indice de atlas entry +1, 0=vacio). Es la FUENTE DE VERDAD de los tiles (un tile por celda, ultimo gana); los comandos `copy` del render se DERIVAN de ella (preservando fills/lineas de color). Tilemap compacto, optimo para export MSX2 (pendiente: que el generador lo consuma directo).
  - Grid 16x16 (a la par con tiles). Pintar/borrar/clic-derecho actualizan la celda. Rellenar = flood-fill 4-conexo de tiles (estilo PAINT MSX BASIC) + fallback flood-fill de color por pixel sin tile. Clic derecho borra (boton izq pinta). Boton Clear All con confirmacion. Import/Export tiles via biblioteca global. Capas Visual/Collision/Objects con overlay. Palette Manager. Screen Budget (VRAM/atlas/commands).
  - Minimapa = vista del WorldMap (los "railes" = `WorldMapConnection`, una conexion con from/to direction = entrada+salida bidireccional). Sala actual centrada en cruz; vacios -> mini-dialog crea sala + conexion (find-or-create del worldmap) via `handleCreateAdjacentBitmapRoom` en AppUI; vecino existente -> hover ilumina, clic carga la sala (`onSelectAsset(id, EditorType.Msx2BitmapRoom)`). Para bitmap rooms, asset.id === room.id (== `screenAssetId` del nodo).
- UI build: para una feature grande de UI el usuario pidio "usa el agente"; los agentes general-purpose funcionaron bien con brief detallado + verificacion esbuild. (Solo spawnear agentes si el usuario lo pide.)

## Sesion 2026-06-20 - SCREEN 5 bitmap MegaROM pantalla blanca
- Bug: `msx2-screen4-bitmap-room` (hardware real SCREEN 5 / CHGMOD 5) renderizaba bien en `simple32k`, pero en `megarom konami` acababa blanco. El fallo se reprodujo con `C:\Users\salam\Downloads\pp1(3)11.json`.
- Diagnostico OpenMSX: en el decoder RLE, tras `ld (#8000),4`, la CPU leia `#04` desde `#8000`; eso probaba que `#8000-#BFFF` seguia siendo RAM y no el slot del cartucho/mapper.
- Causa raiz: se copiaron los setters de banco Konami de SCREEN 4 (`mapper_set_bank_p1/p2/p3`), pero faltaba copiar el paso previo `map_page2_to_cart_primary` que usa `RSLREG`, tabla de slots expandidos `#FCC1`, y `ENASLT H=#80` para poner page 2 en el slot del cartucho.
- Fix runtime: `init_rom` de bitmap-room MegaROM llama primero a `map_page2_to_cart_primary`, despues `init_konami8k_fixed_bank0_banks`; los RLE grandes se parten y empaquetan en bancos de 8KB con lectura por P2/#8000. Rutinas ASM nuevas documentadas con INPUT/OUTPUT/DESTROYS/PRESERVES.
- Fix tooling: `build_mideas_unified_rom.py` tiene validador especifico `validate_msx2_screen5_bitmap_room_konami_fixed_bank0_megarom`; ya no exige los artefactos del pipeline MegaROM SCREEN 4 tile para este backend bitmap.
- RAM: 0 bytes nuevos; no hay staging buffer, la descompresion RLE sigue siendo ROM bank -> VRAM.
- CPU: coste extra solo en carga/init por cambiar banco por chunk RLE; sin coste nuevo por frame.
- Commits: `47ed9320 Fix SCREEN 5 bitmap MegaROM mapper load` y `e6b17fe6 Validate bitmap room MegaROM builds`.
- Verificacion: `npm run smoke:msx2-screen4-bitmap-room -- --skip-openmsx`, build real MegaROM Konami de `pp1(3)11.json`, validacion builder `segments=8 dataBanks=4 bankedRleSymbols=5`, esbuild de generador/modal, `python -m py_compile scripts/build_mideas_unified_rom.py`, OpenMSX `-romtype konami` con captura correcta `test/msx2-screen4/out/pp1_3_11_screen5_megarom_test.png`.
- Leccion esencial ya registrada en `ai/LESSONS_LEARNED.md`: si tras `ld (#8000),A` se lee el mismo valor escrito, no hay mapper activo en esa pagina; primero mapear el slot del cartucho y luego inicializar bancos.

## Sesion 2026-06-20 - SCREEN 5 World Engine (multi-pantalla) + layout 212
- Rama: `feature/msx2-screen-bifurcation`.
- Reescrito el backend bitmap SCREEN 5 al modelo acordado: tile 16x16, pantalla = 192 bytes de indices, atlas/tileset compartido por MUNDO (mundo = asset `worldmap`), render por command engine (tileset offscreen + `load_room` con copias VRAM->VRAM LMMM + clear LMMV), siempre MegaROM Konami. Doc: `docs/msx/SCREEN5_BITMAP_WORLD_ENGINE.md`.
- Transicion multi-pantalla portada de SCREEN 4: tabla de raíles por room (W/E/N/S, #FF=none) desde `connections`; `try_room_transition` carga vecino y reposiciona al borde opuesto; hooks en `update_player_movement` sustituyen el clamp.
- Editor unico: el clasico `Msx2Screen5BitmapRoomEditor` se borro; `msx2bitmaproom` abre siempre el Tile Map (`Msx2BitmapScreenEditor`).
- Color unificado fondo/transparencia/franjas via VDP R#7 = `backgroundColor`.
- Layout vertical 212 lineas: R#9 LN=1 + HUD 20px + juego 192px (sin las 4 lineas azules sobrantes).
- NewProjectModal: opcion MSX2 ahora indica SCREEN 4 / SCREEN 5. Game-type picker: 3 columnas + scroll para no recortarse.
- 2 bugs ASM resueltos (corrupcion de estado a traves de call): clobber de DE en `load_room`; R#15 sin restaurar tras transicion (lag). Leccion en `ai/LESSONS_LEARNED.md`, regla general + tabla de clobbers en `ai/ASM_GUIDELINES.md`, LEER en `CLAUDE.md`.
- Verificacion OpenMSX (`newOne5.json`, C-BIOS_MSX2, -romtype konami): travesia pant1<->pant2<->pant3 ambos sentidos, clamp en bordes de mundo, gravedad, render limpio, sin lag, suelo llega al fondo. Smoke `msx2-screen4-bitmap-room` y validacion MegaROM Konami pasan.
- Salto/gravedad del backend bitmap ahora leen el Player Config (`movement.jumpPower` / `maxFallSpeed`) en vez de hardcodes; convertido a px enteros (player_vy es byte con signo). Verificado OpenMSX: jumpPower 5->salto 10px, 8->28px. RAM/CPU 0 (solo cambian constantes inmediatas). Default ahora -5 (jumpPower=5 del Player Config) en vez del antiguo -6.
- Pendiente: Fase 4 (banking por mundo TileBank A/B cuando haya muchas rooms; hoy render programs residentes en primeros 32KB). Transiciones N/S sin probar end-to-end (newOne5 solo tiene E/W).
- Nota git: `ai/PROJECT_MEMORY.md` ya tenia sin commitear el bloque previo "Sesion 2026-06-20 - SCREEN 5 bitmap MegaROM pantalla blanca" (trabajo ya commiteado en 47ed9320/e6b17fe6 por otra IA); se commitea junto por ser ambos logs de memoria del mismo archivo.

## Sesion 2026-06-25 - Skills coyote_time + jump_buffer en SCREEN 5 bitmap
- Objetivo del usuario: implementar mas skills para SCREEN 5 (backend bitmap room, hardware real SCREEN 5 / CHGMOD 5).
- Investigo state: bitmap ya tenia 15 skills (dash, air_dash, glide, wall_jump, power_stomp+screen_shake, shoot, teleport_a_b, slash, grab, high_jump, wall_break, spin_attack, double_jump, wall_climb). Faltaban vs SCREEN 4: coyote_time + jump_buffer (los mas faciles, 2 bytes RAM).
- Implementacion (2 archivos):
  - `utils/msxGenerator/generators/msx2/msx2BitmapDoubleJumpGenerator.ts`: anadidos `coyoteTime`/`jumpBuffer` a `BitmapJumpPhysics`, constantes `MSX2_BITMAP_COYOTE_TIMER_RAM=0xC00E` / `MSX2_BITMAP_JUMP_BUFFER_TIMER_RAM=0xC00F` (slots libres en el gap del player), funciones `buildBitmapCoyoteBufferEquates/InitClearAsm/LandHookAsm/LeaveGroundHookAsm`, y extension de `buildBitmapJumpBlockAsm` con timer-decrement block, coyote air-gate (consume timer + salta como grounded, cuenta como jump #1) y buffer arm. La rama legacy (coyote=0, buffer=0, double_jump off) es bit-identical al bloque original.
  - `utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts`: `BitmapPlayerPhysics` + `resolveBitmapPlayerPhysics` exponen `coyoteTime`/`jumpBuffer` (de `getMsx2PlatformPhysicsFromPlayerEntity`, que ya los devolvia pero el bitmap los ignoraba). Nuevo hook `leaveGroundAsm` en el struct `skillHooks` (inyectado en `.falling:` tras limpiar grounded). Coyote/buffer land hook al FINAL del chain (tras wall_jump/power_stomp/high_jump) para que sus clears corran primero.
- RAM: +2 bytes fijos (#C00E coyote timer, #C00F jump_buffer timer), solo usados si los params >0. No tocan el skill chain (#C0D9+).
- CPU: <30 ciclos/frame solo si activos; 0 para proyectos legacy.
- No-regresión: `newone25.json` (sin `skillParameters.jump`) recompila a ROM bit-identical (mismo SHA256 FC44238A...). Smoke `msx2-screen4-bitmap-room` pasa.
- Activación: solo cuando `skillParameters.jump` esta presente (proteccion confirmada en `msx2PlatformPhysics.ts:874-883`: movement.coyoteTime/jumpBuffer legacy se ignoran, como ya pasaba en SCREEN 4).
- Verificación OpenMSX (C-BIOS_MSX2, simple32k 32KB, fixture `newone25_coyote.json` con coyoteTime/jumpBuffer=4 primero, luego =60 para ventana de test):
  - Arranque OK (player grounded, timers a 0).
  - timerDec OK (coyote expira a 0 tras WAIT:500).
  - Aterrizaje OK (no roto por el land hook).
  - **Coyote**: poke airborne cayendo + SPACE → player termina 12px mas arriba que sin SPACE (saltó estando airborne, solo posible via coyote). `y=148 vy=04 flags=00` vs `y=160 vy=00 flags=01`.
  - **Buffer**: poke cayendo + buffer=60 armado → player aterriza y el land hook dispara salto automatico: `y=132 vy=FF(subiendo) flags=00 buffer=00(consumido)` vs buffer=0 `y=160 flags=01`.
- Leccion nueva en `ai/LESSONS_LEARNED.md`: smoke OpenMSX con `capture_openmsx_action.py` necesita `boot-wait-ms >= 6000` para tests de timing fino (<500ms); con boot 4000 los `after time` cortos se leen antes de que la emulación estabilice.

## Sesion 2026-06-30 (noche) - SCREEN 5 bitmap: HUD de corazones + modelo deadly revisado
- Rama: `feature/msx2-screen-bifurcation`.
- Objetivo del usuario: HUD de corazones que representen `player_health` (uno por punto), baje uno al tocar deadly (corazon vacio = outline, no desaparece), y opciones configurables. Entrevista larga para fijar diseño.
- Decisiones (entrevista): corazones = `player_health` (no lives); perdido = corazon vacio (outline, 2 tiles: full + empty); tiles 16x16 horneados por defecto (assets propios mas adelante); update solo pagina visible; dirty-flag; v1 hardcoded top-left; color rojo; overflow >12 escala a 8x8 (follow-up pendiente, v1 clampa a 12).
- **Modelo deadly revisado** (para que los corazones muevan): tocar deadly SIEMPRE `-1 player_health` + armar blink. `deadlyInstantRespawn` controla SOLO el reposiciono: ON = reposiciona al spawn por toque (sin resetear health, corazones siguen bajando); OFF = se queda. Al llegar health=0 -> `-1 life` + respawn completo (health=maxHealth + blink). Antes (tarea blink) el modo ON no bajaba health -> corazones nunca movian.
- Cambios (`msx2Screen5BitmapRoomGenerator.ts`):
  - Constantes: `BITMAP_HUD_HEART_TILE_Y=224`, `BITMAP_HUD_HEART_VRAM=#7000` (slot offscreen fijo pagina-0, independiente del atlas), colores palette 9 (full rojo) / 14 (empty gris) / 1 (bg = HUD seed bg).
  - `buildBitmapHeartTilePixels()`: mask 16x16 hand-authored + outline (4-vecindad). Framebuffer 16x32 (full cols 0-15, empty cols 16-31), bg=color 1 para que HMMM se integre sin borrar el HUD seed.
  - `buildBitmapHeartsHudAsm(maxHealth, heartUploadAsm)`: EQUs (`hud_hearts_drawn #C1FC`, `hud_cmd_block #C2C0` 15 bytes), rutinas `upload_hud_hearts` (wrapper RLE) + `update_hud_hearts` (dirty-flag: LDIR template a scratch, patchea DY desde `bitmap_displayed_page`, loop slots con `cp (player_health)` decide full/empty, `hud_launch_heart_cmd` lanza HMMM 15 bytes). **Restaura R#15=0 al final** (lección 2026-06-20: vdp_wait_cmd_ready deja R#15=2, romperia el poll de vblank). Template HMMM: source Y=224, NX=NY=16, CMR=#D0.
  - `bitmap_check_deadly_contact` revisado: `takeDamageAsm` (ON y OFF) ambos empiezan `dec (player_health)`; `.deadly_respawn` (full: reset health+blink+vy) cae a `.deadly_reposition` (solo mueve al spawn). ON usa reposition por toque; OFF solo ret.
  - Pipeline RLE: `heartRleChunks` anadidos a `allRleChunks` + `bankedDataBlocks` (MegaROM). `heartDataAsm` + `bitmap_room_hud_heart_data` emitidos. `init_rom` llama `upload_hud_hearts` + siembra `hud_hearts_drawn=#FF` (fuerza redraw frame 1). Main loop llama `update_hud_hearts`.
- RAM: +16 bytes (`hud_hearts_drawn` 1 + `hud_cmd_block` 15, en gaps libres #C1FC y #C2C0). Tiles en ROM/VRAM (0 RAM). CPU: dirty-flag -> 0 coste en frames sin daño; ~N comandos HMMM (N=maxHealth≤12) solo cuando health cambia.
- Riesgo señalado al usuario: el fondo del tile corazon = color 1 (HUD seed bg). Si el usuario pone otros widgets HUD arriba-izquierda, los corazones los pisan (v1 hardcoded reserva top-left). Overflow >12 corazones pendiente (escala 8x8).
- Verificacion (OpenMSX C-BIOS_MSX2, simple32k, glass 32KB):
  - Boot: `health=05`, `heartsDrawn=05` (dirty-flag latched, corazones llenos), player grounded, no crash.
  - Poke deadly bajo player + WAIT 1500ms: `health=04`, `heartsDrawn=04` (un corazon vaciado, health y flag en sincronia), `lives=03`.
  - WAIT 4000ms: `health=02`, `heartsDrawn=02` (3 toques, corazones siguen a health), `lives=03`.
  - Nota timing: boot-wait 5000 + WAIT 300 no dio tiempo (player aun cayendo); boot-wait 6000 + WAIT 1500 si (lección 2026-06-25 reconfirmada).
- Contract: +8 checks (heart builder, VRAM #7000, builder fn, EQUs, rutinas, R#15 restore, calls, deadly dec-health). Total 92. Contract completo sigue sin pasar por fallo PREEXISTENTE ajeno (`air_dash active block`).

## Sesion 2026-06-30 (tarde) - SCREEN 5 bitmap: skill blink + opcion deadlyInstantRespawn
- Rama: `feature/msx2-screen-bifurcation`.
- Objetivo del usuario: skill "blink" (parpadeo del sprite) como feedback de i-frames al recibir daño, con variables expuestas (tiempo/frames, in_blink/blink_ended), y una opcion configurable para que al caer en pinchos se pueda elegir entre respawn o no respawn.
- Decisiones con el usuario: blink es automatico al recibir daño (no boton); las "2 opciones" al caer en pinchos son el flag `health.deadlyInstantRespawn` (ON=respawn inmediato plataforma-clasica / OFF=dano+blink modo accion sin respawn hasta 0 health); durante blink el player es inmune a todo dano.
- Cambios:
  - `types.ts` + `utils/msx2PlayerDefaults.ts`: nuevo campo `health.deadlyInstantRespawn?: boolean` (default `true`, no-regresion). UI: checkbox en Msx2PlayerEditor seccion "Combat & Damage".
  - `msx2Screen5BitmapRoomGenerator.ts:resolveBitmapPlayerVitals` lee `health.deadlyInstantRespawn` (default true).
  - EQUs blink: `blink_phase #C1F9`, `blink_ended #C1FA`, `blink_hide #C1FB`. `blink_timer EQU player_invuln` (alias: la cuenta de i-frames ES la cuenta de blink; `in_blink = blink_timer != 0`, 0 bytes extra).
  - `bitmap_check_deadly_contact`: añade countdown de blink con `blink_ended` (pulsa 1 el frame exacto en que blink llega a 1->0) y genera 2 variantes de take_damage segun el flag:
    - ON (default): deadly -> `-1 life + respawn inmediato + blink` (plataforma clasica).
    - OFF: deadly -> `-1 health + blink`, respawn solo al health=0 (modo accion). Es lo que el usuario pidio para "caer en pinchos y no queremos spawn".
  - Parpadeo visual: `bitmap_update_sprite_sat` recibe `enableBlink` (true en bitmap). Un preamble calcula `blink_hide` cada frame (ciclo 8 frames: visible fases 0-3, oculto 4-7) y cada capa del sprite escribe Y=#D8 cuando blink_hide. Solo usa AF (respeta el contrato PRESERVES BC,HL de la rutina).
- RAM: +3 bytes fijos (`blink_phase/blink_ended/blink_hide #C1F9-#C1FB`), pegados a los del deadly (#C1FD-#C1FF). `blink_timer` es alias de `player_invuln` (0 bytes). CPU: ~12 ciclos/frame en el SAT upload (calculo blink_hide) + lógica ya existente.
- Riesgo señalado al usuario: el default ON cambia el comportamiento previo (que era dano gradual). Antes deadly gastaba health de a 1 y respawnea al 0; ahora ON = respawn inmediato al primer contacto. Si prefiere el anterior como default, basta cambiar `deadlyInstantRespawn: true` -> `false` en msx2PlayerDefaults.ts (la UI lo overridea por proyecto).
- Verificacion (OpenMSX C-BIOS_MSX2, simple32k):
  - Smoke ON (default): poke deadly bajo el player + WAIT 250ms -> `lives=02` (respawn inmediato, -1 life), `invuln=39` (blink armado), `bphase=04`, `bhide=01` (sprite oculto = parpadeo activo), `pY=50` (reposicionado al spawn).
  - Smoke OFF (JSON con `deadlyInstantRespawn:false`): mismo poke + WAIT 1500ms -> `health=03` (dano gradual 5->4->3 con i-frames de 60 frames), `lives=03` (SIN respawn), `invuln=2A`, `bhide=01`, `pY=B0` (player se queda en el sitio). Compilado via `build_mideas_unified_rom.py` con un fixture derivado del smoke.
  - Glass ROM 32768 bytes en ambos. Contract: +9 checks (deadlyInstantRespawn tipo/default/lectura, EQUs blink, alias blink_timer, enableBlink, SAT lee blink_hide, blink_ended pulse). El contract completo sigue sin pasar por el fallo PREEXISTENTE ajeno (`air_dash active block`).

## Sesion 2026-06-30 - SCREEN 5 bitmap: tiles Deadly pasables + sistema daño/respawn
- Rama: `feature/msx2-screen-bifurcation`.
- Objetivo del usuario: un tile "pinchos" marcado como Deadly en el Screen Editor no debía tener colisión implícita (quería pisarlos) y SÍ matar al pisarlos. Hasta ahora no mataban.
- Diagnóstico (dos causas en el backend bitmap, no una):
  1. `bitmap_probe_solid` hacia `or a` sobre el byte de celda: cualquier flag !=0 (incluido Deadly 0x40) se trataba como solido. El player no podia pisar los pinchos.
  2. El backend bitmap NO tenia deteccion de deadly ni sistema de vidas/health/respawn (eso solo existe en MSX1/SCREEN 2/4 via `update_deadly_tiles_component`). El main loop solo hacia movimiento + skills + SAT.
- Cambio 1 (`msx2Screen5BitmapRoomGenerator.ts:bitmap_probe_solid`): enmascarar el bit Deadly antes del test (`and #BF`). Deadly solo (0x40) -> pasable; Solid+Deadly (0x50) -> sigue solido (Solid 0x10 sobrevive la mascara). Contrato respetado: A devuelve el valor original de celda, Z = pasable. No-regresion para tiles solid/vacio (resultado identico).
- Cambio 2 (mismo archivo): nuevo sistema deadly.
  - `resolveBitmapPlayerVitals` lee `health.maxHealth/lives/invulnerabilityFrames` del Player Config (campos que ya existen en la UI y `types.ts:669`).
  - `buildBitmapDeadlySystemAsm` genera EQUs + init + main-loop call + rutina.
  - Rutina nueva `bitmap_check_deadly_contact` (documentada INPUT/OUTPUT/DESTROYS AF,DE,HL / PRESERVES BC) llamada cada frame tras `.skip_player_movement`. Probes left/center/right de la banda inferior del body via `bitmap_probe_deadly` (helper nuevo, simetrico a probe_solid/probe_behavior). Decrementa health, arma i-frames, y al llegar a 0 health decrementa lives + respawn (health=maxHealth, invuln, player al spawn del room actual).
  - Helper `bitmap_probe_deadly` (test `bit 6, a`, devuelve A intacto).
  - Tabla ROM `bitmap_room_spawn_x_table`/`bitmap_room_spawn_y_table` (1 byte/room cada una, indexada por `current_screen_index`) para respawn.
- RAM: +3 bytes fijos `player_health #C1FD / player_lives #C1FE / player_invuln #C1FF`, en el gap seguro entre `player_anim_state (#C1F0-#C1F5)` y `bitmap_room_behavior_map (#C200)`, lejos del skill chain (que empieza en `player_vy_frac #C0D9`). Sin tocar el skill chain ni punteros 16-bit. Tabla spawn = ROM (4 bytes/room), 0 RAM.
- CPU: 1 probe (3 muestras) + 1-2 compares por frame solo cuando invuln=0. <50 ciclos/frame. Inapreciable.
- Fuera de alcance (pendientes, avisados al usuario): HUD dinamico de vidas/health en bitmap, pantalla de Game Over al llegar lives=0 (hoy respawn infinito: si lives llega a 0 respawn igual), knockback al recibir daño (hoy solo i-frames).
- Verificacion: smoke `build_msx2_screen5_bitmap_room_smoke.py --skip-openmsx` (ROM 32768 bytes, glass OK). OpenMSX C-BIOS_MSX2 simple32k:
  - Boot: health=05, lives=03, invuln=00, player grounded (pFlags=01) y reposando (pY=B0). No-regresion.
  - Poke de celda deadly (0x40) bajo el player (fila 11 cols 1-5) + WAIT 1500ms: health=03 (5->3, dos toques separados por 60 frames de i-frames), invuln=2A, player sigue reposando (deadly pasable confirmado).
  - WAIT 6000ms: lives=02 (ocurrio >=1 respawn al llegar health a 0), health=04 (reseteado y un toque nuevo), invuln=30, player reposicionado al spawn (pY=AD).
- Contract: anadidos 10 checks en `scripts/check_skill_params_contract.cjs` para el deadly bitmap (EQUs, helper, rutina, mascara, tabla spawn). El contract completo NO pasa por un fallo PREEXISTENTE ajeno a este cambio (`air_dash active block` sobre `msx2Screen4Generator.ts`, ya roto en el arbol; verificado con `git stash`). Mis 10 checks verificados aislados via grep sobre el fuente TS.

## Sesion 2026-06-25 (tarde) - SCREEN 5 bitmap: fisica vertical fraccional (paridad con SCREEN 4)
- Bug reportado por el usuario: el salto en su proyecto SCREEN 5 "se siente menos suave" que en su proyecto SCREEN 4.
- Causa raiz: modelo de fisica vertical distinto entre backends. SCREEN 4 (`msx2Screen4Generator.ts:2529 msx2_apply_platform_gravity`) acumula `gravityStrength88` (default `#0040` = 0.25 px/frame^2) en `msx2_player_gravity_vel` (16-bit 8.8); el movimiento real (parte alta) solo cambia cuando la fraccion se desborda -> arco gradual. SCREEN 5 (`msx2Screen5BitmapRoomGenerator.ts .apply_gravity`) hacia `inc a` fijo cada frame = 1 px/frame^2 SIEMPRE, sin fraccion ni usar `gravityStrength88`. Resultado: SCREEN 5 aceleraba 4x mas rapido, arco "cuadrado".
- Fix: anadido sub-acumulador de fraccion `player_vy_frac EQU #C0D9` (1 byte fijo) a SCREEN 5. `.apply_gravity` ahora acumula `gravityFrac` (low byte de `gravityStrength88`) en `player_vy_frac`, y solo hace `inc (player_vy)` cuando carry. Replica el arco gradual de SCREEN 4 manteniendo `player_vy` como byte. `resolveBitmapPlayerPhysics` expone `gravityFrac` desde `physics.gravityStrength88`.
- Cambio GLOBAL e incondicional: TODOS los proyectos bitmap pasan a fisica fraccional (paridad total con SCREEN 4). Los ROM de bitmap existentes cambian de feel (mas flotantes con jumpPower alto). Decision del usuario: global + el ajusta el tuning (jumpPower/gravity) en el Player Config de cada proyecto.
- Para reservar el byte fijo, el skill chain se desplazo +1: `MSX2_BITMAP_DASH_RAM_BASE` `#C0D9 -> #C0DA` (en `msx2BitmapDashGenerator.ts`), y todo el chain (air_dash, glide, wall_jump, power_stomp, shake, shoot, teleport, slash, grab, high_jump, wall_break, spin_attack) corre +1. Actualizado `scripts/build_msx2_screen5_bitmap_room_smoke.py` (EQUs + probes + pokes del rango #C0D9-#C0E5 desplazados +1).
- Reset de `player_vy_frac` a 0 tras cada impulso de salto (para que la fraccion residual de una caida previa no recorte el impulso en 1 frame): `.jump_from_ground` y air-jump en `msx2BitmapDoubleJumpGenerator.ts`, buffer-fire en el land hook, wall_jump kick en `msx2BitmapWallJumpGenerator.ts`, `init_rom` y `commit_room_flip` (transicion). Skills de movimiento/caida (glide clamp, grab, wall_climb, power_stomp pin, teleport, air_dash) NO resetean frac (impacto <=1 frame, imperceptible).
- RAM: +1 byte fijo (`player_vy_frac #C0D9`). Skill chain desplazado +1 (mismo numero de bytes, corrido). CPU: +~8 ciclos/frame en `.apply_gravity` (ld, add, ld, jp nc, [ld, inc, ld]).
- Verificacion OpenMSX (newone25 con `skillParameters.jump` jumpPower=2560/10px, gravity default 0.25): mismo salto, modelo ENTERO (newone25_coyote.rom pre-cambio) el player vuelve a y=90 grounded en 600ms; modelo FRACCIONAL (newone25_smooth.rom) el player esta en y=12 airborne tras 600ms (78px mas arriba, aun subiendo). Confirma arco ~4x mas gradual. Nota: con jumpPower=10 + gravity 0.25 el salto sale MUY flotante (esperable); el usuario baja jumpPower o sube gravity para afinar.
- Smoke `msx2-screen4-bitmap-room` (completo, con OpenMSX): transicion pantalla + air_dash + glide + wall_jump + power_stomp TODOS pasan con el chain desplazado y la nueva fisica. No-regresion de skills confirmada.

## Sesion 2026-07-01 - HUD Editor Fases 1-2 (UI) + Fase 3a (bar dinamica SCREEN 5)
- Rama activa: `feature/msx2-screen-bifurcation` (arbol muy sucio con trabajo previo no relacionado; ver nota de commit mas abajo).
- Estado previo verificado: el Mideas HUD Editor YA existia (`components/editors/Msx2HudEditor.tsx`), el modelo `Msx2HudAsset` (`types.ts:891`) y la export ASM del linked HUD (`msx2Screen5BitmapRoomGenerator.ts`: `resolveLinkedHudAsset`, `buildBitmapHudLinkedIconRowAsm`, `buildBitmapHudLinkedCounterAsm`). Audite el gap contra la spec del usuario antes de programar.
- Fase 1 (chrome UI, 0 RAM/CPU): solo `Msx2HudEditor.tsx`. Barra amarilla "HUD AREA ONLY 256x20", reglas con ticks, barra de estado (Zoom/Screen 256x212/HUD/Snap/Grid/X-Y/Color/Autosave), preview corregida a **256x212** (antes hardcodeada 192 mal etiquetada; HUD 20 + juego 192), separador HUD/GAME AREA, checkbox Show HUD Area, integer-scale 1-4x, toggle Grid 1px, `min-h-0` en la cadena flex (leccion 2026-06-18). Cursor/color/autosave via refs (sin re-render por mouse-move).
- Fase 2 (fidelidad render widgets, 0 RAM/CPU): solo `Msx2HudEditor.tsx`. Nuevo renderer compartido `renderWidgetLayer` (lo usan canvas edit + preview = WYSIWYG). Render real por tipo: `bar` (empty+fill), `iconRow` (fila de iconos del atlas; fallback corazon para playerEnergy; placeholder si no), `icon`/`portrait` (caja + icono atlas), `iconCounter` (icono + valor), `counter`/`text` (valor/texto alineado). Helpers `slotHex`/`drawIconPixels`/`drawHeartMask`/`drawHudText`.
- Fase 3a (bar dinamica, ASM runtime): `msx2Screen5BitmapRoomGenerator.ts` + `Msx2HudEditor.tsx` (paridad) + `scripts/build_msx2_screen5_bitmap_room_smoke.py` (flag `--include-linked-hud-bar`).
  - `collectLinkedHudDynamicSources` anade `kind:'bar'`. Nueva `buildBitmapHudLinkedBarAsm`: dirty-flag + 2 HMMV (CMD_FILL=#C0) — empty track + primary fill — + restore R#15=0. fillW = clamp(value,0,max)*barW/max (mult 8x8->16 + div repeated-subtraction), floored even. Region even-aligned (barX & ~1, barW & ~1, max 254). NO consume offscreen tile (HMMV no necesita source) -> alivia la colision VRAM del atlas.
  - Pipeline tiles separado: `bar` excluido del offscreen y del budget de colision; `linkedHudTileData` ahora solo tile-based, con `uploadAsm` dentro de cada entry; dispatch via `tileDataBySourceIndex` (map por source index); `bar` -> builder bar.
  - Seed baker (`buildBitmapHudSeedPixels`): rama `bar` del linked asset pasa a caja even + empty/fill SIN borde (consistente con el HMMV; un borde 1px no sobrevive a un fill even-aligned). Rama legacy inline (hudWidgets) intacta.
  - Editor Fase 2: rama `bar` de `renderWidgetLayer` alineada al export (sin borde, caja even, empty+fill) para WYSIWYG.
- Leccion tecnica (registrada aqui; LESSONS_LEARNED.md esta entangled con trabajo previo): (1) En este proyecto **HMMV = CMD_FILL = 0xC0** (NO 0x88 ni 0xE8); ver `msx2Screen5BitmapRoomGenerator.ts:188`. Usar el codigo equivocado = fill roto. (2) En SCREEN 5, HMMV/HMMM requieren **DX/NX pares** (byte-aligned, 2px/byte): una barra con borde 1px NO puede preservarse con un fill dinamico even-aligned -> el bar del linked HUD no tiene borde. (3) Todo bar dinamico NO consume fila offscreen (a diferencia de iconRow/counter), asi que el budget de colision VRAM cuenta solo tile-based.
- RAM: bar reusa dirty(1) [+value(1) si binding no es playerEnergy/lives]. En el smoke (bar playerEnergy + counter score): dirty #C0E7 (bar, sin value), dirty #C0E8 + value #C0E9 (counter), dec3 #C0EA-EC. Cursor #C0ED < #C1F0 (player-anim). Sin overflow. CPU: 2 HMMV de rect pequeno solo cuando cambia el binding (~0 idle).
- Verificacion (smoke automatizable, leccion 2026-06-08 satisfecha): `build_msx2_screen5_bitmap_room_smoke.py --include-linked-hud-bar` -> ROM 32768 (Glass OK), marcadores "Dynamic bar meter" + update_hud_linked_0/1 presentes, template bar `DB #48,0,0,0,#48,0,#06,0,#50,0,#08,0,#04,0,#C0` (DX=72,DY=6,NX=80,NY=8,COL=4,CMD=#C0). OpenMSX full smoke (boot + transicion + skills) SIN crash. **Dinamico probado**: `player_health` (#C1FD) vs `hud_linked_0_drawn` (#C0E7) -> (05,05) baseline, (02,02) poke health=2, (0F,0F) poke health=15. El dirty-flag sigue a health en todos los casos (la barra crece y mengua). No-regresion: smoke por defecto (sin linked HUD) byte-identico.
- Nota de commit: `Msx2HudEditor.tsx` (untracked, Fases 1-2 limpias) y `scripts/build_msx2_screen5_bitmap_room_smoke.py` (limpio, solo mis adds) son aisables; PERO `msx2Screen5BitmapRoomGenerator.ts` ya tenia ~593 lineas uncommitted PREVIAS a Fase 3a (trabajo de hearts/blink/deadly/skills). No se puede aislar Fase 3a en ese archivo sin mezclar. Commit pendiente de decision del usuario.
- Fase 3b (counter multidigito, G2) HECHA y verificada: `buildBitmapHudLinkedCounterAsm` ahora ramifica narrow/wide via `linkedCounterSpec`. Narrow (digits 1-3) = path 8-bit/dec3 byte-identical (sin regresion). Wide (digits 4-5, bindings no playerEnergy/lives) = valor 16-bit (2 bytes), dirty-flag 2 bytes (detecta cambio de byte ALTO solo), rutina nueva `hud_word_to_dec5` (resta repetida 10000/1000/100/10, ~33 iter max, sin division), buffer `hud_dec5_buffer` (5B) compartido. 6-7 digitos se clampean a 5 (24-bit/BCD necesitarian mucha mas RAM; futuro).
- RAM wide counter: dirty(2) + value(2) = 4 bytes (vs 2 del narrow). En el smoke (bar playerEnergy + narrow counter score + wide counter custom=12345): bar dirty #C0E7, narrow dirty #C0E8+value #C0E9, wide dirty #C0EA-EB + value #C0EC-ED, dec3 #C0EE-F0, dec5 #C0F1-F5. Cursor #C0F6 < #C1F0.
- Verificacion OpenMSX (smoke `--include-linked-hud-bar`): boot value=0x3039 (12345) little-endian, dirty lo sigue. Poke low byte → dirty sigue. **Poke HIGH byte solo (0x3039→0x1139): dirty sigue (39/11)** — el caso que un dirty de 1 byte habria perdido (prueba clave del dirty 2 bytes). Poke value=65535 → dec5 buffer = 36 35 35 33 35 = "65535" ASCII correcto. Sin crash en ningun caso.
- G3 (cableado gameplay score/timer: que algo incremente el byte/word) sigue pendiente; no es HUD, es logica de juego (Fase 4+).

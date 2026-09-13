# MSX2 Shoots Definition — mini informe de patrones y plan

> ZCode, 2026-09-13. Pedido por Jordi: mejorar todo el MSX2 Shoot Definition,
> añadir métodos de ataque de bosses de shoot'em ups existentes, con revisión
> de Codex por el walkie-talkie. Este informe es el material de ese acuerdo.

## 1. Estado de partida (lo que ya existía)

- Anillo de **16 direcciones** (22.5°), velocidad 8.8 fija por eje, tabla
  `bitmap_boss_dir16_table` normalizada (una diagonal ya no va ×√2).
- Record de 8 bytes por patrón: `[pattern, count, dir, speed, start, stride,
  burstCount, burstInterval]`; un solo bucle Z80 cubre fan y anillo.
- Patrones: `aimed` (mira al jugador, 8 puntos cardinales vía tabla de 9
  entradas por signos), `linear` (dirección fija), `spread` (ventall), `radial`
  (anillo). Ráfagas (`burst`) escalonadas y fases por HP que retunen cadencia,
  velocidad y patrón. Disparo por nodo de path (`#F2 s`) y por cadencia de fase.
- Bullets sprite hardware en pool compartido (slot 9/11 bytes según animación),
  pool condicional a la ráfaga (Codex-050).

## 2. Añadido en esta sesión (implementado y verificado en OpenMSX)

| Cambio | Dónde | Verificación |
|---|---|---|
| **Fix de mira**: el aim compara el CENTRO del cuerpo del jugador (`player_x + hit.x + hit.w/2`, ídem Y) contra el centro del boss; antes comparaba el origen de render, y un jugador justo debajo del boss leía "abajo-izquierda" | `msx2BitmapBossGenerator.ts` (`bitmap_boss_aim_index`, `bitmap_boss_sbul_spawn`) | test606 real: 27/28 spawn edges con signo correcto (el 1 restante es el frame de cruce por el centro exacto caminando) + 15 screenshots visuales |
| **Ángulo fino `angle`** (0..15 pasos de 22.5°, 0=arriba) para `linear`, y como base fija de fan/anillo; gana sobre el `direction` de 8 puntos (compatibilidad) | `types.ts`, `msx2Shoot.ts`, editor | probe smoke diagonal/22.5°: fracciones 8.8 exactas |
| **`fixedAngle`** (bit 7 del byte de patrón): fan/anillo que NO sigue al jugador | ídem + Z80 `bit 7,c` | probe `--fanfixed`: slots 6 y 14 exactos con el jugador en otro sitio |
| **`spin`** (bit 6 + byte RAM `boss_shoot_rot`, reservado solo si algún patrón gira): espiral — el ángulo base rota un paso del stride por cada oleada de ráfaga | ídem | test606 real con fase apuntando a patrón espiral: record `#C2`, oleadas a slots 0 y 2 exactos, rot cíclica 1→2→3, 12 spawn edges |
| **Editor**: selector de ángulo de 16 entradas, checkbox de ángulo fijo, checkbox de espiral, preview que dibuja las próximas oleadas desvanecidas | `Msx2ShootEditor.tsx` | tsc limpio |

Compatibilidad: un asset sin `angle`/`fixedAngle`/`spin` hornea **byte-idéntico**
(test606: `#02,#01,#08,#04,#00,#01,#04,#0A` antes y después). Proyectos sin
`msx2shoot` no cambian ni un byte (las rutinas no se emiten).

## 3. Catálogo shoot'em up → qué cuesta aquí

Patrones clásicos (R-Type, Gradius, Aleste, Zanac, Twinbee...), mapeados al
subsistema. "Barato" = sin tocar el formato de record ni RAM nueva.

| Patrón (juego típico) | Estado | Coste |
|---|---|---|
| Torreta aimed (todos) | ✓ | — |
| Ventall N-way (Gradius) | ✓ | — |
| Anillo completo (Aleste) | ✓ | — |
| **Anillo con hueco** para pasar (R-Type) | ~ ya posible: radial de N<16 deja hueco; falta UI clara | barato (UI) |
| **Espiral** (Zanac) | ✓ NUEVO | +1 byte RAM condicional |
| Fan/anillo de ángulo fijo (torretas de pared) | ✓ NUEVO | — |
| **Spray aleatorio** alrededor de la mira (Twinbee) | backlog | barato: jitter del PRNG del boss sobre `aim` (bit 6 de `aimed`); el PRNG ya existe para rocas |
| **Backshot / ventall con offset del mira** (disparar también atrás) | ~ el record ya tiene `start` firmado; falta exponerlo en UI | barato (UI) |
| **Fan alternante** (izq/der por ráfaga) | ~ derivable: `spin` con stride 2 | — |
| **Multi-emisor / bocas de fuego** (alas, torretas del boss; R-Type final) | backlog | MEDIO: offset de spawn (muzzle) por record — o bien tabla aparte de emisores; toca `bitmap_boss_sbul_spawn_dir` y el editor |
| **Bala acelerada / curva sine** (homing ligero) | backlog | ALTO: ax/ay 8.8 por bala o steering table; budget por bala |
| **Carga/telegraph** (apunta 1s y dispara) | backlog | medio: opcode de intro por fase; sin formato nuevo |
| Cadencia por HP, ráfagas, disparo por path, láser de fase D | ✓ | — |

## 4. Plan propuesto (fases, con criterio de aceptación)

1. **Fase 1 — hecho** (esta sesión): fix de mira + angle + fixedAngle + spin +
   editor. Criterio: probes OpenMSX ya listados en §2; records antiguos
   byte-idénticos; ROMs sin `msx2shoot` byte-idénticas.
2. **Fase 2 — barata**: spray aleatorio (jitter del PRNG), hueco de anillo y
   offset del mira en la UI (ya soportados por el record). Criterio: probes
   desde `.sym` de la build en curso + screenshots; baseline byte-idéntico en
   proyectos que no usen lo nuevo.
3. **Fase 3 — media**: multi-emisor (muzzle offsets por patrón), carga/telegraph.
   Requiere ACUERDO de formato (¿record de 8→12 bytes solo cuando se usa, o
   tabla de emisores separada?) y del desplazamiento de RAM.
4. **Fase 4 — cara**: balas con aceleración/curva. Requiere presupuesto nuevo
   por bala; decidir si merece frente a más patrones de emisor.

## 5. Deuda técnica detectada (para el canal)

- `bitmap_boss_shoot_wave` reutiliza `boss_shoot_cnt` como índice de patrón
  (entrada) y contador de balas (durante): funciona pero es frágil.
- Los probes con ruta (caminar+dial+UP) son delicados al timing: convendría un
  flag de proyecto tipo `bossIntroSkippableForTests` o un opcode de intro
  `SKIP` para sondas.
- En builds frescos del fixture sintético `fixture_boss_def.json`, el disparo
  por nodo de path (`PATH_OP_FIRE`) no llega a `bitmap_boss_path_fire`
  (boss armado en node, `path_idx=1`, `fire_mode=1`, `shoot_cnt` sin escribir);
  la ROM committed del 04-08 sí dispara. [HIPOTESIS] cambio sin commit o
  fixture regenerado. Revisar (dominio generadores).

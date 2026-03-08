# Juego Pato Hero Sprite Init Fix 2026-03-07

Proyecto afectado:
- ASM probado: `C:\Users\salam\Downloads\unitedCompressedFiles(83).asm`
- ROM de validacion: `server/temp/juego_pato_pt3_linear48k.rom`

## Sintoma

En algunos arranques de `juego pato`, el sprite que aparecia en la posicion inicial del `hero` no era la nina sino otro asset, tipicamente el pato.

El fallo era intermitente:
- a veces salia la nina correcta
- a veces salia un sprite incorrecto ya desde el primer frame visible

## Lo que NO era la causa

Se comprobo que este bug ya existia antes de reservar los 5 primeros sprites hardware.

Por tanto, no estaba causado por:
- desplazar las entidades para empezar en el sprite hardware 5
- la subida completa de la SAT
- `task_manager` o la IRQ de musica

Ese parche de sprites reservados puede ser util para otros problemas de VRAM/SAT, pero no explicaba este bug de inicializacion del `hero`.

## Causa raiz

La causa real estaba en la interaccion entre:
- `init_hero_1`
- `Action_ChangeSprite`
- `entity_facing_dir`

`Action_ChangeSprite` aplica redirect direccional usando `entity_facing_dir[entity]` antes de fijar el sprite final. En el arranque del `hero`, esa tabla RAM no se estaba limpiando en `init_entities`.

Si `entity_facing_dir[0]` contenia basura de una ejecucion anterior o de RAM no inicializada:
- el `OnEnter` inicial del state machine del `hero` ejecutaba `CHANGE_SPRITE`
- `CHANGE_SPRITE` intentaba redirigir segun ese facing corrupto
- con un valor invalido, podia leer fuera de las tablas de direccion
- el sprite final del `hero` quedaba contaminado y podia resolverse a otro asset, incluido el pato

## Fix aplicado

En `C:\Users\salam\Downloads\unitedCompressedFiles(83).asm` se aplicaron tres defensas:

1. Limpiar `entity_facing_dir` en `init_entities`
- evita arrastrar basura de RAM al primer frame de gameplay

2. Sembrar facing inicial explicito del `hero`
- en `init_hero_1` se fuerza facing derecha (`2`) para que el primer `CHANGE_SPRITE` sea determinista

3. Validar rango en `Action_ChangeSprite`
- si `entity_facing_dir` no esta en `1..4`, se ignora el redirect direccional
- el codigo usa el sprite pedido originalmente en vez de indexar tablas con un valor invalido

## Resultado

Tras el parche, el arranque vuelve a ser determinista y el `hero` sale como la nina correcta.

Resumen practico:
- bug real: RAM no inicializada en `entity_facing_dir`
- bug descartado: reserva de los 5 primeros sprites hardware
- fix estable: limpiar RAM + fijar facing inicial + guard defensivo en `CHANGE_SPRITE`

## Integracion en generadores Mideas

El fix ya se ha llevado tambien al pipeline de export ASM:
- `utils/msxGenerator/generators/entitiesGenerator.ts`
  - limpia `entity_facing_dir` dentro de `init_entities`
  - si la entidad tiene `Sprite + Input`, siembra facing inicial a derecha (`2`)
- `utils/msxGenerator/generators/stateMachineGenerator.ts`
  - `Action_ChangeSprite` ignora facings fuera de rango y no indexa tablas con valores invalidos

Con esto, futuras exportaciones ASM ya no dependen del parche manual sobre `unitedCompressedFiles(83).asm`.

## Nota para el generador

Cuando Mideas emita ASM con sprites dependientes de facing o state machine:
- cualquier tabla runtime equivalente a `entity_facing_dir` debe inicializarse de forma explicita
- las acciones tipo `CHANGE_SPRITE` no deben asumir que el facing runtime siempre cae en rango valido
- la primera transicion visual del `hero` no debe depender de basura residual de RAM

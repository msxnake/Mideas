# Smoke Tests

## Regla Principal
No hacer commit sin Smoke Test.

## Antes de Commit

### Compilación
- ASM compila
- ROM generada
- Sin errores de ensamblador
- Sin errores de enlazado

### Arranque
- ROM inicia
- Sin pantalla negra
- Sin reset inesperado
- Sin cuelgue inicial

### Gameplay
- Player responde
- Movimiento fluido
- Colisiones correctas
- Cambio de pantallas correcto
- Coordenadas correctas al cambiar de pantalla
- Player no aparece dentro de paredes

### Recursos
- Sprites correctos
- Tiles correctos
- Colores correctos
- Música PT3 correcta
- Sin corrupción visual

### Integridad
- Sin glitches graves
- Sin corrupción RAM visible
- Sin corrupción VRAM visible
- Sin cuelgues

## Hardware Real

Si afecta a:
- Mapper
- VDP
- Interrupciones
- PT3
- RAM
- Bancos MegaROM
- Carga de recursos

Probar en hardware real cuando sea posible.

## Política de Commit

Commit permitido:
- Compila
- Arranca
- Smoke Test correcto

Commit prohibido:
- No probado
- Fallo conocido
- "Parece que funciona"

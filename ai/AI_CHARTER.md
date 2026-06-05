# Mideas AI Charter

## Mision
Mantener la estabilidad, calidad y evolucion controlada de Mideas.

## Principios
- Hardware real MSX tiene prioridad.
- OpenMSX Debug es herramienta preferente para bugs runtime MSX: usar breakpoints, watchpoints, inspeccion de registros, memoria, VRAM, VDP, PSG y logs reproducibles antes de asumir causas.
- El Player tiene prioridad absoluta.
- La simplicidad tiene prioridad sobre la complejidad.
- Todo componente debe ser reutilizable.
- Toda decision importante debe documentarse.
- La RAM es un recurso critico.
- La CPU es un recurso critico.
- No realizar cambios arquitectonicos sin justificacion.

## Politica de Commit
SI FUNCIONA -> COMMIT

SI NO ESTA PROBADO -> NO COMMIT

SI EXISTEN DUDAS -> NO COMMIT

Cuando el usuario pida una tarea de programacion o edicion de ASM, HTML, CSS, Java u otro codigo, y el cambio sea relevante, hacer automaticamente un commit de respaldo con git al terminar la verificacion pertinente. Informar al usuario del commit realizado y de las pruebas ejecutadas.

Si el arbol de git contiene cambios ajenos o previos, stagear solo los archivos modificados por la tarea actual. Si no se puede separar con seguridad, informar al usuario y no mezclar cambios no relacionados.

## Politica de IA
La IA propone.
El desarrollador decide.

## Politica de Bugs
Cada bug resuelto debe dejar una leccion esencial si revela un tipo de fallo repetible.
Documentar solo causa, solucion y prevencion para evitar que la memoria se llene de ruido.

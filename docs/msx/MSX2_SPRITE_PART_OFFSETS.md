# Offsets de zonas de sprites MSX2

Cada zona 16x16 tiene dos coordenadas independientes:

- `sourceX/sourceY`: celda fuente dentro de `frames[].data`.
- `offsetX/offsetY`: posición de destino desde el origen del metasprite, común a todos los frames.

Los proyectos sin coordenadas fuente usan la cuadrícula original, por índice de parte y de izquierda a derecha. Editar un offset guarda explícitamente las fuentes sin modificar píxeles ni colores. Los proyectos sin partes explícitas conservan su distribución original.

En el editor, los campos X/Y por zona cambian su posición. **Montaje** muestra el resultado, amplía el área para incluir offsets negativos y es de solo lectura. **Editar píxeles** mantiene la cuadrícula fuente para dibujar. Los indicadores de paleta se calculan en la fuente, en todos los frames. Animación, vista mirror, vista de habitación y exportación PNG usan la composición.

El exportador obtiene los patrones y colores OR desde la fuente, y emite las posiciones de destino. SCREEN 5 espeja también la posición X de cada celda: `anchoFuente - 16 - offsetX`. Los offsets con signo se suman en la SAT como inmediatos de 8 bits. Esta escritura usa A/flags como antes y conserva BC, DE, HL y la pila. No se ha cambiado el contrato de las rutinas de copia de patrones.

El presupuesto de scanlines cuenta todas las capas asignadas a una celda durante sus 16 líneas, incluso si una fila de patrón está vacía. En SCREEN 5 toma el máximo de capas de todas las zonas y todos los frames, porque la SAT mantiene una distribución uniforme. Desplazar zonas hasta solaparlas puede aumentar la ocupación por línea. La prioridad de composición sigue el orden de las partes.

Validación reproducible: `node scripts/check_msx2_sprite_part_offsets.mjs`. Comprueba tres zonas, dos frames, parejas OR distintas, preservación de píxeles/patrones, offsets negativos, mirror, presupuesto de solapamiento y persistencia JSON; genera una prueba SCREEN 5 en `work/msx2-sprite-part-offsets` para compilar con Glass.

# AI Workflow

## Antes de Programar
1. Leer AI_CHARTER.md
2. Leer PROJECT_MEMORY.md
3. Leer LESSONS_LEARNED.md
4. Si se toca ASM, leer ASM_GUIDELINES.md
5. Analizar impacto
6. Proponer solución

## Durante el Desarrollo
- Explicar ventajas
- Explicar riesgos
- Explicar consumo RAM
- Explicar consumo CPU
- No generar cambios arquitectónicos sin justificar
- No asumir que una rutina ASM preserva registros si no está documentado

## Después
1. Compilar
2. Ejecutar Smoke Test
3. Si funciona, commit
4. Si falla, no commit
5. Registrar errores importantes en LESSONS_LEARNED.md

## Regla Principal
SI FUNCIONA -> COMMIT

SI NO ESTÁ PROBADO -> NO COMMIT

SI EXISTEN DUDAS -> NO COMMIT

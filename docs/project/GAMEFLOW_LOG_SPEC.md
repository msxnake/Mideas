# GameFlow Log System Specification

## Objetivo
Sistema de control de procesos para GameFlow que valida la estructura antes de ejecutar Play/Preview.

## Archivo de Control
**Nombre:** `{projectName}_gameflow.log`
**Ubicación:** `./logs/`
**Formato:** Texto plano

## Flujo de Trabajo

### 1. Botón Play
```
Usuario hace click en Play
  ↓
¿Existe {projectName}_gameflow.log?
  ├─ NO → Mostrar error: "Please run Preview first to validate GameFlow"
  │        Return (no ejecuta Play)
  └─ SÍ → Continuar con Play normalmente
```

### 2. Botón Preview
```
Usuario hace click en Preview
  ↓
¿Existe {projectName}_gameflow.log?
  ├─ NO → Crear nuevo .log
  └─ SÍ → ¿Está actualizado con últimos cambios?
           ├─ NO → Regenerar .log
           └─ SÍ → Continuar con Preview normalmente
```

## Estructura del Archivo .log

```
GameFlow Validation Log
Project: {projectName}
Generated: {timestamp}
Version: 1.0
================================================================================

Step 1: Checking for Main GameFlow
Found "Main"

Step 2: Validating Main GameFlow Structure
  - Start Node: {nodeId} [OK]
  - Total Nodes: {count}
  - Total Connections: {count}
  - Orphaned Nodes: {count} [WARNING if > 0]

Step 3: Analyzing GameFlow Graph
  - Node 1: Start ({nodeId})
  - Node 2: WorldLink ({nodeId}) -> World: {worldAssetId}
  - Node 3: SubMenu ({nodeId}) -> Title: {title}
  ...

Step 4: Validating Connections
  - Connection 1: Start → WorldLink [OK]
  - Connection 2: SubMenu → End [OK]
  ...

Step 5: Checking Referenced Assets
  - WorldMap {worldAssetId}: [FOUND] / [MISSING]
  - Screen {screenId}: [FOUND] / [MISSING]
  ...

Step 6: Detecting Issues
  [OK] No issues detected

  OR

  [WARNING] Found 2 warnings:
    - Orphaned node: {nodeId}
    - Missing asset reference: {assetId}

  [ERROR] Found 1 errors:
    - Start node has no outgoing connections

================================================================================
Validation Result: [PASSED] / [FAILED]
Hash: {hash}  # Para detectar cambios
================================================================================
```

## Hash de Cambios

Para detectar si el GameFlow cambió:
```javascript
const hash = crypto.createHash('md5')
  .update(JSON.stringify({
    nodes: gameFlow.nodes.map(n => ({ id: n.id, type: n.type })),
    connections: gameFlow.connections
  }))
  .digest('hex');
```

## Estados del Log

- **PASSED**: GameFlow válido, puede ejecutarse Play
- **FAILED**: Errores críticos, no puede ejecutarse Play
- **WARNING**: Advertencias, puede ejecutarse pero con precaución

## Validaciones

### Críticas (ERROR)
- No existe nodo Start
- Start node sin conexiones salientes
- Referencias a assets inexistentes (WorldLink sin worldmap)
- Ciclos infinitos sin condición de salida
- Nodos End/Restart sin conexiones entrantes

### Advertencias (WARNING)
- Nodos huérfanos (sin conexiones)
- Múltiples nodos Start
- Conexiones que no van a ningún sitio
- SubMenu sin opciones
- Text node sin contenido

## Implementación

### Archivos a modificar:
1. `utils/gameFlowValidator.ts` - Nueva función de validación
2. `components/modals/GameFlowPreviewModal.tsx` - Validación en Preview
3. `components/editors/GameFlowEditor.tsx` - Validación en Play
4. `types.ts` - Agregar tipos para GameFlowValidationResult

### Funciones principales:
```typescript
// utils/gameFlowValidator.ts
export function validateGameFlow(gameFlow: GameFlowGraph, allAssets: ProjectAsset[]): GameFlowValidationResult;
export function generateGameFlowLog(gameFlow: GameFlowGraph, allAssets: ProjectAsset[], projectName: string): string;
export function saveGameFlowLog(logContent: string, projectName: string): void;
export function loadGameFlowLog(projectName: string): GameFlowLogData | null;
export function isGameFlowLogUpToDate(gameFlow: GameFlowGraph, projectName: string): boolean;
```
